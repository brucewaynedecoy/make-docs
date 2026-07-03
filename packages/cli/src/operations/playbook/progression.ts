import {
  PLAYBOOK_DEFAULT_STEP_MODE,
  type PlaybookModel,
  type PlaybookRoutingTarget,
  type PlaybookStep,
  type PlaybookStepMode,
  type PlaybookStepStatus,
} from "../../playbook";
import { findRepoRoot, utcNow } from "../shared";
import { OperationError } from "../types";
import {
  PLAYBOOK_RUN_TERMINAL_STATUSES,
  loadPlaybookRunModel,
  playbookRunCursorForStep,
  playbookRunStepId,
  readPlaybookRunState,
  transitionPlaybookRunState,
  type PlaybookRunCursor,
  type PlaybookRunEvidenceRecord,
  type PlaybookRunState,
  type PlaybookRunStepStatusEntry,
  type PlaybookRunTerminalStatus,
} from "./run-state";

/**
 * The Run Playbook progression engine (W18 R7 P2; PRD 35 R-OP-1..3).
 *
 * This module carries a run from `playbook.start` to a terminal status by
 * computing transitions from (run state, parsed Playbook model, reported
 * input). The engine consumes the single W18 R6 Playbook model via
 * {@link loadPlaybookRunModel} for every dependency, gate, and routing read
 * and never re-parses Playbook Markdown itself (R-SCOPE-1). The internal
 * structure — pure position computation over the storage seam in
 * `./run-state` — is a PRD 35 D9 implementer freedom.
 *
 * Read-versus-mutate classification (R-OP-3):
 *
 * - {@link computePlaybookRunNext} is the `playbook.next` read: it computes
 *   the next executable position from state plus model with zero side
 *   effects and never writes run state.
 * - {@link advancePlaybookRun} (`playbook.advance`), {@link recordPlaybookRunGate}
 *   (`playbook.gate`), and {@link closePlaybookRun} (`playbook.close`) are
 *   the only operations that transition existing run state, and
 *   `createPlaybookRunState` behind `playbook.start` is the only operation
 *   that creates it. {@link resumePlaybookRun} (`playbook.resume`,
 *   read-then-write per R-OP-1) re-enters a held run without changing its
 *   position. Every mutation flows through `transitionPlaybookRunState`, and
 *   every mutating operation is registered with `mutates: "write"` so the
 *   registry dispatch applies the uniform operation-core safety gating.
 *
 * Cursor and status semantics: the cursor points at the workflow step or
 * gate the run is positioned at. A step cursor holds run status `running`; a
 * gate cursor holds `waiting-for-user` until `playbook.gate` records a
 * decision; a failed step without a failure route and a rejected gate hold
 * `blocked`; and a run whose reachable steps are all resolved drops its
 * cursor and holds `waiting-for-user` for `playbook.close`, which alone
 * stamps the terminal status. All statuses are the shared W18 R6 vocabulary
 * (R-STATE-2). Step execution by mode (deterministic/delegated/manual) and
 * the digest-checked resume land in W18 R7 Phase 3; Phase 2 records reported
 * outcomes.
 *
 * The captured-evidence format is documented on `PlaybookRunEvidenceRecord`
 * in `./run-state` (D9 implementer decision).
 */

/** Reported step outcomes `playbook.advance` accepts (R-OP-1). */
export const PLAYBOOK_ADVANCE_OUTCOMES = [
  "completed",
  "failed",
] as const satisfies readonly PlaybookStepStatus[];
export type PlaybookAdvanceOutcome = (typeof PLAYBOOK_ADVANCE_OUTCOMES)[number];

/** Gate decisions `playbook.gate` records: approve unblocks, reject stops. */
export const PLAYBOOK_GATE_DECISION_VALUES = ["approve", "reject"] as const;
export type PlaybookGateDecisionValue = (typeof PLAYBOOK_GATE_DECISION_VALUES)[number];

export type PlaybookRunNextPosition = "step" | "gate" | "blocked" | "closeable" | "closed";

export interface PlaybookRunNextDependencyReport {
  id: string;
  requirement: string | null;
  availability: "available" | "unavailable" | "unknown";
}

export interface PlaybookRunNextStepReport {
  stepId: string;
  title: string | null;
  executor: string | null;
  role: string | null;
  activation: string | null;
  /** Effective mode with the W18 R6 `delegated` default applied (R-MODE-2). */
  mode: PlaybookStepMode;
  stepStatus: PlaybookStepStatus;
  invocation: {
    form: "operation" | "command" | "instructions";
    /** Stable operation registry identifier — never a CLI command string. */
    operation: string | null;
    commandRun: string | null;
    instructions: string | null;
  } | null;
  requires: PlaybookRunNextDependencyReport[];
  gate: {
    resolvedBy: string | null;
    evidence: string | null;
    unattended: boolean | null;
  } | null;
}

export interface PlaybookRunNextReport {
  runId: string;
  projectId: string;
  playbookRef: string;
  routingModel: PlaybookRunState["routingModel"];
  runStatus: PlaybookStepStatus;
  terminalStatus: PlaybookRunTerminalStatus | null;
  cursor: PlaybookRunCursor | null;
  position: PlaybookRunNextPosition;
  eligible: boolean;
  next: PlaybookRunNextStepReport | null;
  blockedBy: string[];
  guidance: string[];
}

interface WorkflowStepEntry {
  id: string;
  index: number;
  step: PlaybookStep;
}

/**
 * `playbook.next` (read, R-OP-1, R-OP-3): computes the next executable
 * position from the stored run state plus the parsed Playbook model,
 * respecting step dependencies, gates, and the routing model. Zero side
 * effects — this function never writes run state.
 */
export function computePlaybookRunNext(input: {
  repoRoot?: string;
  storeRoot?: string;
  runId: string;
}): PlaybookRunNextReport {
  const repoRoot = findRepoRoot(input.repoRoot);
  const state = readPlaybookRunState({
    repoRoot,
    storeRoot: input.storeRoot,
    runId: input.runId,
  });
  const base = {
    runId: state.runId,
    projectId: state.projectId,
    playbookRef: state.playbookRef,
    routingModel: state.routingModel,
    runStatus: state.status,
    terminalStatus: state.terminalStatus,
    cursor: state.cursor,
  };
  if (state.terminalStatus) {
    return {
      ...base,
      position: "closed",
      eligible: false,
      next: null,
      blockedBy: [
        `Run \`${state.runId}\` is closed with terminal status \`${state.terminalStatus}\`.`,
      ],
      guidance: [],
    };
  }
  if (!state.cursor) {
    return {
      ...base,
      position: "closeable",
      eligible: false,
      next: null,
      blockedBy: [],
      guidance: [
        "No workflow position remains; finalize the run with the `playbook.close` operation.",
      ],
    };
  }

  const model = loadPlaybookRunModel(repoRoot, state);
  const entries = requireWorkflowEntries(state, model);
  const entry = requireCursorEntry(state, entries, state.cursor.id);
  const stepStatus = stepStatusOf(state.stepStatuses, entry.id);
  const next = buildNextStepReport(state, entry, stepStatus);

  const blockedBy: string[] = [];
  const guidance: string[] = [];
  if (state.status === "blocked") {
    blockedBy.push(
      `Run \`${state.runId}\` is blocked; re-enter it with \`playbook.resume\` or finalize it with \`playbook.close\`.`,
    );
  }
  if (stepStatus === "failed") {
    blockedBy.push(
      `Step \`${entry.id}\` previously failed; retry it with \`playbook.advance\` after resuming, or finalize with \`playbook.close\`.`,
    );
  }
  for (const dependency of next.requires) {
    if (dependency.availability === "unavailable") {
      blockedBy.push(
        `Required dependency \`${dependency.id}\` is recorded as unavailable for this run.`,
      );
    } else if (dependency.availability === "unknown") {
      guidance.push(
        `Dependency \`${dependency.id}\` has unknown availability; probe it before executing the step.`,
      );
    }
  }
  const kind: PlaybookRunNextPosition = state.cursor.kind === "gate" ? "gate" : "step";
  if (kind === "gate" && blockedBy.length === 0) {
    guidance.push(
      `Gate \`${entry.id}\` requires a decision; record it with the \`playbook.gate\` operation.`,
    );
  }
  return {
    ...base,
    position: blockedBy.length > 0 ? "blocked" : kind,
    eligible: blockedBy.length === 0,
    next,
    blockedBy,
    guidance,
  };
}

export interface AdvancePlaybookRunInput {
  repoRoot?: string;
  storeRoot?: string;
  runId: string;
  /** Optional explicit step; must match the current cursor step when given. */
  stepId?: string | null;
  outcome: PlaybookAdvanceOutcome;
  evidenceRefs?: string[];
  outputRefs?: string[];
  note?: string | null;
}

/**
 * `playbook.advance` (write, R-OP-1): records completion or failure of the
 * current step, captures its evidence, transitions the step and run status,
 * and computes the next cursor from the model's routing.
 */
export function advancePlaybookRun(input: AdvancePlaybookRunInput): PlaybookRunState {
  const repoRoot = findRepoRoot(input.repoRoot);
  const loaded = readPlaybookRunState({
    repoRoot,
    storeRoot: input.storeRoot,
    runId: input.runId,
  });
  requireOpenRun(loaded, "advanced");
  const model = loadPlaybookRunModel(repoRoot, loaded);

  return transitionPlaybookRunState({
    repoRoot,
    storeRoot: input.storeRoot,
    runId: input.runId,
    apply: (state) => {
      requireOpenRun(state, "advanced");
      const entries = requireWorkflowEntries(state, model);
      const cursor = state.cursor;
      if (!cursor) {
        throw new OperationError(
          `Playbook run \`${state.runId}\` has no current step cursor; inspect it with \`playbook.next\` or finalize it with \`playbook.close\`.`,
        );
      }
      if (cursor.kind === "gate") {
        throw new OperationError(
          `Playbook run \`${state.runId}\` is positioned at gate \`${cursor.id}\`; record the decision with \`playbook.gate\`, not \`playbook.advance\`.`,
        );
      }
      if (input.stepId && input.stepId !== cursor.id) {
        throw new OperationError(
          `Step \`${input.stepId}\` is not the current cursor step \`${cursor.id}\` of run \`${state.runId}\`.`,
        );
      }
      const entry = requireCursorEntry(state, entries, cursor.id);
      const stepStatuses = withStepStatus(state.stepStatuses, entry.id, input.outcome);
      const evidence = appendEvidence(state, {
        scope: "step",
        subjectId: entry.id,
        outcome: input.outcome,
        recordedAt: utcNow(),
        refs: dedupe(input.evidenceRefs ?? []),
        note: normalizeNote(input.note),
      });

      let position: RunPosition;
      if (input.outcome === "failed") {
        const failureTarget =
          state.routingModel === "graph" ? (entry.step.routing?.onFailure ?? null) : null;
        position = failureTarget
          ? positionFromTarget(failureTarget, entries, entry)
          : {
              cursor,
              status: "blocked",
              hint: `Step \`${entry.id}\` failed; resume with \`playbook.resume\` to retry via \`playbook.advance\`, or finalize with \`playbook.close\`.`,
            };
      } else {
        position = positionFromSuccessor(
          computeSuccessor(state.routingModel, entries, stepStatuses, entry),
        );
      }

      return {
        ...state,
        stepStatuses,
        ...evidence,
        outputRefs: dedupe([...state.outputRefs, ...(input.outputRefs ?? [])]),
        cursor: position.cursor,
        status: position.status,
        resumeHints: withHint(state.resumeHints, position.hint),
      };
    },
  });
}

export interface RecordPlaybookRunGateInput {
  repoRoot?: string;
  storeRoot?: string;
  runId: string;
  /** Optional explicit gate; must match the current cursor gate when given. */
  gateId?: string | null;
  decision: PlaybookGateDecisionValue;
  evidenceRefs?: string[];
  note?: string | null;
}

/**
 * `playbook.gate` (write, R-OP-1): records a gate decision with its evidence
 * and either unblocks the run (approve moves the cursor past the gate) or
 * stops it (reject holds the run blocked at the gate).
 */
export function recordPlaybookRunGate(input: RecordPlaybookRunGateInput): PlaybookRunState {
  const repoRoot = findRepoRoot(input.repoRoot);
  const loaded = readPlaybookRunState({
    repoRoot,
    storeRoot: input.storeRoot,
    runId: input.runId,
  });
  requireOpenRun(loaded, "gated");
  const model = loadPlaybookRunModel(repoRoot, loaded);

  return transitionPlaybookRunState({
    repoRoot,
    storeRoot: input.storeRoot,
    runId: input.runId,
    apply: (state) => {
      requireOpenRun(state, "gated");
      const entries = requireWorkflowEntries(state, model);
      const cursor = state.cursor;
      if (!cursor || cursor.kind !== "gate") {
        throw new OperationError(
          `Playbook run \`${state.runId}\` is not positioned at a gate; advance the current step with \`playbook.advance\` instead.`,
        );
      }
      if (input.gateId && input.gateId !== cursor.id) {
        throw new OperationError(
          `Gate \`${input.gateId}\` is not the current cursor gate \`${cursor.id}\` of run \`${state.runId}\`.`,
        );
      }
      const entry = requireCursorEntry(state, entries, cursor.id);
      const decidedAt = utcNow();
      const refs = dedupe(input.evidenceRefs ?? []);
      const approved = input.decision === "approve";
      const stepStatuses = withStepStatus(
        state.stepStatuses,
        entry.id,
        approved ? "completed" : "blocked",
      );
      const evidence = appendEvidence(state, {
        scope: "gate",
        subjectId: entry.id,
        outcome: input.decision,
        recordedAt: decidedAt,
        refs,
        note: normalizeNote(input.note),
      });
      const position: RunPosition = approved
        ? positionFromSuccessor(computeSuccessor(state.routingModel, entries, stepStatuses, entry))
        : {
            cursor,
            status: "blocked",
            hint: `Gate \`${entry.id}\` was rejected; re-plan, then re-enter with \`playbook.resume\` or finalize with \`playbook.close\`.`,
          };

      return {
        ...state,
        stepStatuses,
        gateDecisions: [
          ...state.gateDecisions,
          { gateId: entry.id, decision: input.decision, decidedAt, evidenceRefs: refs },
        ],
        ...evidence,
        cursor: position.cursor,
        status: position.status,
        resumeHints: withHint(state.resumeHints, position.hint),
      };
    },
  });
}

export interface ResumePlaybookRunInput {
  repoRoot?: string;
  storeRoot?: string;
  runId: string;
  resumeHints?: string[];
  evidenceRefs?: string[];
  note?: string | null;
}

/**
 * `playbook.resume` (read then write, R-OP-1): re-enters a held run at its
 * stored cursor, recomputing the run status from the cursor position and
 * recording the resume as evidence. This is the W18 R7 Phase 2 operation
 * SHELL: it reopens a blocked or waiting run without moving the cursor.
 *
 * PHASE 3 SEAM (R-RESUME-1): the digest-aware resume semantics land with
 * W18 R7 Phase 3. That phase will, at this seam, load the parsed model via
 * `loadPlaybookRunModel`, compare `state.sourceDigest` with the model's
 * `identity.sourceDigest`, resume at the stored cursor on a match, and on a
 * mismatch mark the run stale, block by default, require an explicit
 * re-plan, and emit a diagnostic naming the change. Phase 2 deliberately
 * implements no digest-blocking behavior.
 */
export function resumePlaybookRun(input: ResumePlaybookRunInput): PlaybookRunState {
  const repoRoot = findRepoRoot(input.repoRoot);
  return transitionPlaybookRunState({
    repoRoot,
    storeRoot: input.storeRoot,
    runId: input.runId,
    apply: (state) => {
      requireOpenRun(state, "resumed");
      // Phase 3 digest check lands here (see the doc comment above).
      const status: PlaybookStepStatus =
        state.cursor === null || state.cursor.kind === "gate" ? "waiting-for-user" : "running";
      const evidence = appendEvidence(state, {
        scope: "resume",
        subjectId: state.runId,
        outcome: status,
        recordedAt: utcNow(),
        refs: dedupe(input.evidenceRefs ?? []),
        note: normalizeNote(input.note),
      });
      let resumeHints = state.resumeHints;
      for (const hint of input.resumeHints ?? []) {
        resumeHints = withHint(resumeHints, hint);
      }
      if (state.cursor === null) {
        resumeHints = withHint(
          resumeHints,
          "No workflow position remains; finalize the run with `playbook.close`.",
        );
      }
      return { ...state, ...evidence, status, resumeHints };
    },
  });
}

export interface ClosePlaybookRunInput {
  repoRoot?: string;
  storeRoot?: string;
  runId: string;
  terminalStatus: PlaybookRunTerminalStatus;
  evidenceRefs?: string[];
  note?: string | null;
}

/**
 * `playbook.close` (write, R-OP-1): finalizes a run with a terminal status
 * and closeout evidence. Only close stamps `terminalStatus`; a closed run
 * refuses every further transition.
 */
export function closePlaybookRun(input: ClosePlaybookRunInput): PlaybookRunState {
  const repoRoot = findRepoRoot(input.repoRoot);
  return transitionPlaybookRunState({
    repoRoot,
    storeRoot: input.storeRoot,
    runId: input.runId,
    apply: (state) => {
      requireOpenRun(state, "closed again");
      if (!PLAYBOOK_RUN_TERMINAL_STATUSES.includes(input.terminalStatus)) {
        throw new OperationError(
          `Playbook run terminal status must be one of: ${PLAYBOOK_RUN_TERMINAL_STATUSES.join(", ")}.`,
        );
      }
      const evidence = appendEvidence(state, {
        scope: "close",
        subjectId: state.runId,
        outcome: input.terminalStatus,
        recordedAt: utcNow(),
        refs: dedupe(input.evidenceRefs ?? []),
        note: normalizeNote(input.note),
      });
      return {
        ...state,
        ...evidence,
        cursor: null,
        status: input.terminalStatus,
        terminalStatus: input.terminalStatus,
      };
    },
  });
}

// ---------------------------------------------------------------------------
// Position computation (pure functions over state plus model)
// ---------------------------------------------------------------------------

interface RunPosition {
  cursor: PlaybookRunCursor | null;
  status: PlaybookStepStatus;
  hint: string | null;
}

type Successor = { kind: "step"; entry: WorkflowStepEntry } | { kind: "stop" } | { kind: "end" };

function workflowStepEntries(model: PlaybookModel): WorkflowStepEntry[] {
  return (model.workflow?.steps ?? []).map((step, index) => ({
    id: playbookRunStepId(step, index),
    index,
    step,
  }));
}

function requireWorkflowEntries(
  state: PlaybookRunState,
  model: PlaybookModel,
): WorkflowStepEntry[] {
  const entries = workflowStepEntries(model);
  if (entries.length === 0) {
    throw new OperationError(
      `Playbook \`${state.playbookRef}\` has no parsed workflow contract steps; the progression engine requires the W18 R6 workflow model.`,
    );
  }
  return entries;
}

function requireCursorEntry(
  state: PlaybookRunState,
  entries: WorkflowStepEntry[],
  cursorId: string,
): WorkflowStepEntry {
  const entry = entries.find((candidate) => candidate.id === cursorId);
  if (!entry) {
    throw new OperationError(
      `Run cursor \`${cursorId}\` is not a step in the parsed workflow of \`${state.playbookRef}\`; the Playbook source may have changed since run \`${state.runId}\` was created.`,
    );
  }
  return entry;
}

function isSequential(step: PlaybookStep): boolean {
  return (step.activation.value ?? "sequential") === "sequential";
}

/**
 * The successor of a resolved step or approved gate: graph routing follows
 * the step's `on_success`/`stop` declarations, and linear routing (or a
 * graph step without declarations) falls through to the next pending
 * sequentially activated step in declaration order. Event-bound steps never
 * become the cursor; they activate on their event.
 */
function computeSuccessor(
  routingModel: PlaybookRunState["routingModel"],
  entries: WorkflowStepEntry[],
  stepStatuses: PlaybookRunStepStatusEntry[],
  from: WorkflowStepEntry,
): Successor {
  if (routingModel === "graph" && from.step.routing) {
    const target = from.step.routing.onSuccess;
    if (target) {
      if (target.kind === "stop") {
        return { kind: "stop" };
      }
      return { kind: "step", entry: resolveTargetEntry(target, entries, from) };
    }
    if (from.step.routing.stop?.value === true) {
      return { kind: "stop" };
    }
  }
  const statuses = new Map(stepStatuses.map((entry) => [entry.stepId, entry.status]));
  const next = entries.find(
    (candidate) =>
      candidate.index > from.index &&
      isSequential(candidate.step) &&
      (statuses.get(candidate.id) ?? "pending") === "pending",
  );
  return next ? { kind: "step", entry: next } : { kind: "end" };
}

function resolveTargetEntry(
  target: PlaybookRoutingTarget,
  entries: WorkflowStepEntry[],
  from: WorkflowStepEntry,
): WorkflowStepEntry {
  const entry = target.stepId
    ? entries.find((candidate) => candidate.id === target.stepId)
    : undefined;
  if (!entry) {
    throw new OperationError(
      `Routing target \`${target.raw}\` on step \`${from.id}\` does not resolve to a workflow step.`,
    );
  }
  return entry;
}

function positionFromSuccessor(successor: Successor): RunPosition {
  if (successor.kind === "step") {
    return positionAtEntry(successor.entry);
  }
  return {
    cursor: null,
    status: "waiting-for-user",
    hint:
      successor.kind === "stop"
        ? "Workflow routing stopped the run; finalize it with `playbook.close`."
        : "All reachable workflow steps are resolved; finalize the run with `playbook.close`.",
  };
}

function positionFromTarget(
  target: PlaybookRoutingTarget,
  entries: WorkflowStepEntry[],
  from: WorkflowStepEntry,
): RunPosition {
  if (target.kind === "stop") {
    return positionFromSuccessor({ kind: "stop" });
  }
  return positionAtEntry(resolveTargetEntry(target, entries, from));
}

function positionAtEntry(entry: WorkflowStepEntry): RunPosition {
  const cursor = playbookRunCursorForStep(entry.step, entry.index);
  return {
    cursor,
    status: cursor.kind === "gate" ? "waiting-for-user" : "running",
    hint: null,
  };
}

function buildNextStepReport(
  state: PlaybookRunState,
  entry: WorkflowStepEntry,
  stepStatus: PlaybookStepStatus,
): PlaybookRunNextStepReport {
  const availabilityById = new Map(
    state.dependencyAvailability.map((dependency) => [dependency.id, dependency]),
  );
  const invocation = entry.step.invocations[0] ?? null;
  return {
    stepId: entry.id,
    title: entry.step.title?.value ?? null,
    executor: entry.step.executor.value ?? entry.step.executor.raw,
    role: entry.step.role.value ?? entry.step.role.raw,
    activation: entry.step.activation.value ?? entry.step.activation.raw ?? "sequential",
    mode: entry.step.mode.value ?? PLAYBOOK_DEFAULT_STEP_MODE,
    stepStatus,
    invocation: invocation
      ? {
          form: invocation.form,
          operation: invocation.operation?.value ?? null,
          commandRun: invocation.commandRun?.value ?? null,
          instructions: invocation.instructions?.value ?? null,
        }
      : null,
    requires: entry.step.requires.map((reference) => {
      const availability = availabilityById.get(reference.id);
      return {
        id: reference.id,
        requirement:
          reference.registryEntry?.requirement.value ??
          availability?.requirement ??
          null,
        availability: availability?.availability ?? "unknown",
      };
    }),
    gate: entry.step.gate
      ? {
          resolvedBy: entry.step.gate.resolvedBy?.value ?? null,
          evidence: entry.step.gate.evidence?.value ?? null,
          unattended: entry.step.gate.unattended?.value ?? null,
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// State bookkeeping helpers
// ---------------------------------------------------------------------------

function requireOpenRun(state: PlaybookRunState, verb: string): void {
  if (state.terminalStatus) {
    throw new OperationError(
      `Playbook run \`${state.runId}\` is closed with terminal status \`${state.terminalStatus}\`; a closed run cannot be ${verb}.`,
    );
  }
}

function stepStatusOf(
  stepStatuses: PlaybookRunStepStatusEntry[],
  stepId: string,
): PlaybookStepStatus {
  return stepStatuses.find((entry) => entry.stepId === stepId)?.status ?? "pending";
}

function withStepStatus(
  stepStatuses: PlaybookRunStepStatusEntry[],
  stepId: string,
  status: PlaybookStepStatus,
): PlaybookRunStepStatusEntry[] {
  return stepStatuses.map((entry) => (entry.stepId === stepId ? { ...entry, status } : entry));
}

function appendEvidence(
  state: PlaybookRunState,
  record: PlaybookRunEvidenceRecord,
): Pick<PlaybookRunState, "evidenceLog" | "evidenceRefs"> {
  return {
    evidenceLog: [...(state.evidenceLog ?? []), record],
    evidenceRefs: dedupe([...state.evidenceRefs, ...record.refs]),
  };
}

function withHint(hints: string[], hint: string | null): string[] {
  if (!hint || hints.includes(hint)) {
    return hints;
  }
  return [...hints, hint];
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeNote(note: string | null | undefined): string | null {
  const trimmed = note?.trim();
  return trimmed ? trimmed : null;
}
