import {
  PLAYBOOK_DEFAULT_STEP_MODE,
  PLAYBOOK_DEFAULT_WORKFLOW_ROUTING_MODE,
  type PlaybookModel,
  type PlaybookRoutingTarget,
  type PlaybookStep,
  type PlaybookStepMode,
  type PlaybookStepStatus,
} from "../../playbook";
import type { OperationExecutionContext } from "../context";
import { findRepoRoot, utcNow } from "../shared";
import { OperationError } from "../types";
import {
  executeDeterministicCommand,
  executeDeterministicOperation,
  playbookStepExecutionContext,
  resolveOperationCliCommand,
} from "./execution";
import {
  PLAYBOOK_RUN_TERMINAL_STATUSES,
  findOutputSurfaceOverlap,
  listPlaybookRunStates,
  loadPlaybookRunModel,
  normalizeOutputSurfaceClaims,
  playbookRunCursorForStep,
  playbookRunFamilyIds,
  playbookRunStepId,
  readPlaybookRunState,
  transitionPlaybookRunState,
  type PlaybookRunCursor,
  type PlaybookRunDependencyAvailability,
  type PlaybookRunEvidenceRecord,
  type PlaybookRunExecutionEvidence,
  type PlaybookRunGateDecision,
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
 * (R-STATE-2).
 *
 * Step execution by mode (W18 R7 P3; R-MODE-1..2): the W18 R6 step mode
 * governs what {@link advancePlaybookRun} does. A `deterministic` step
 * executes its declared `operation` through the operation core or its
 * `command` through the shell (see `./execution`), captures the structured
 * result as run evidence, and transitions automatically — and when the
 * caller cannot execute (the CLI-absent tier, R-TIER-1) it presents the
 * operation's derived human CLI form instead. A `delegated` step (and a
 * step with no declared mode, R-MODE-2) presents its instructions, holds at
 * `waiting-for-user`, and moves only on a later advance carrying the
 * reported outcome and evidence. A `manual` step records acknowledgment
 * only and executes nothing.
 *
 * Digest-aware resume (W18 R7 P3; R-RESUME-1..2): `playbook.resume`
 * compares the stored source digest with the current Playbook digest. A
 * match re-enters at the stored cursor; a mismatch marks the run stale,
 * blocks by default with a diagnostic naming the change, and requires an
 * explicit re-plan — or the explicit opt-in migration that re-maps
 * still-present step identifiers. A stale run also refuses advance and
 * gate transitions until the marker clears, so the engine never silently
 * progresses against a changed workflow.
 *
 * Run-time guardrails (W18 R7 P4; R-GUARD-1..4, R-SCOPE-2, R-KEEP-1): the
 * creation-time nesting, parallelism, and claim guardrails live in
 * `createPlaybookRunState` (`./run-state`); this engine enforces the rest at
 * transition time — `requireCapabilityClearance` stops advance/gate/resume on
 * a `manual-review-required` capability snapshot,
 * `requireStepOutputSurfacesFree` stops an advance whose step-declared output
 * surfaces overlap another open run's claims (R-GUARD-3), and
 * `settleUnattendedGates` realizes R-GUARD-4 by auto-approving only gates
 * that declare `unattended: true` in an unattended run and holding every
 * other gate at `waiting-for-user`.
 *
 * Resume-hint retirement (W18 R12 P2; PRD 39 R-FIX-2, register item D-016):
 * resume hints are current guidance only, never an audit trail. Every hint
 * the engine appends is subject-scoped — it records the step or gate it
 * advises about in the additive `hintSubjects` map — and every mutating
 * transition (`advance`, `gate`, `resume`) retires hints whose subject has
 * reached a resolved status through the single `settleGuidanceHints` seam.
 * `playbook.close` retires all guidance hints, so a closed run's state
 * carries none. Caller-supplied and capability hints are run-scoped and
 * retire at close. Historical evidence lives exclusively in the evidence
 * log, which no hint operation ever touches.
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
  /**
   * Reported outcome. Required to move a delegated step past its hold, and
   * accepted on a deterministic step as the by-hand execution report (the
   * loop-closer for the presented command form, R-TIER-1). Absent, the step
   * mode decides what advance does (R-MODE-1).
   */
  outcome?: PlaybookAdvanceOutcome | null;
  /** Manual-mode acknowledgment (R-MODE-1): records that the step was read; nothing executes. */
  acknowledge?: boolean;
  /**
   * CLI-absent deterministic path (R-MODE-1, R-TIER-1): the calling surface
   * cannot execute, so present the invocation's human command form for the
   * reader to run by hand instead of executing it.
   */
  present?: boolean;
  evidenceRefs?: string[];
  outputRefs?: string[];
  note?: string | null;
  /** The advancing surface's context; deterministic `operation:` steps inherit its gating. */
  operationContext?: OperationExecutionContext;
}

/** What one `playbook.advance` call did, per the step's execution mode (R-MODE-1). */
export type PlaybookAdvanceAction =
  | "recorded"
  | "executed-operation"
  | "executed-command"
  | "presented-command"
  | "presented-instructions"
  | "acknowledged";

export interface PlaybookAdvanceExecutionReport {
  stepId: string;
  /** Effective mode with the W18 R6 `delegated` default applied (R-MODE-2). */
  mode: PlaybookStepMode;
  action: PlaybookAdvanceAction;
  /** Null while the step holds at `waiting-for-user` for a later report. */
  outcome: PlaybookAdvanceOutcome | null;
  /** The derived human CLI form or external command line, when presented (R-TIER-1). */
  presentedCommand: string | null;
  /** The step's instruction text, when presented; usable directly without the CLI. */
  instructions: string | null;
  /** Structured deterministic-execution result, when the engine executed the step. */
  executionEvidence: PlaybookRunExecutionEvidence | null;
}

export interface AdvancePlaybookRunResult {
  state: PlaybookRunState;
  execution: PlaybookAdvanceExecutionReport;
}

/** The two shapes an advance resolves to: a recorded step outcome, or a hold at `waiting-for-user`. */
type AdvancePlan =
  | {
      kind: "outcome";
      action: "recorded" | "executed-operation" | "executed-command" | "acknowledged";
      outcome: PlaybookAdvanceOutcome;
      executionEvidence: PlaybookRunExecutionEvidence | null;
    }
  | {
      kind: "hold";
      action: "presented-command" | "presented-instructions";
      presentedCommand: string | null;
      instructions: string | null;
      note: string;
      hint: string;
    };

/**
 * `playbook.advance` (write, R-OP-1): advances the current step per its
 * execution mode (R-MODE-1..2) — executing, presenting, recording a
 * reported outcome, or recording acknowledgment — captures the evidence,
 * transitions the step and run status, and computes the next cursor from
 * the model's routing. Deterministic execution happens BEFORE the state
 * transition, so a thrown execution refusal leaves the run exactly where it
 * was; the run never records an outcome the engine did not observe.
 */
export async function advancePlaybookRun(
  input: AdvancePlaybookRunInput,
): Promise<AdvancePlaybookRunResult> {
  const repoRoot = findRepoRoot(input.repoRoot);
  const loaded = readPlaybookRunState({
    repoRoot,
    storeRoot: input.storeRoot,
    runId: input.runId,
  });
  requireOpenRun(loaded, "advanced");
  requireFreshRun(loaded, "advanced");
  requireCapabilityClearance(loaded, "advanced");
  const model = loadPlaybookRunModel(repoRoot, loaded);
  const entries = requireWorkflowEntries(loaded, model);
  const cursor = requireAdvanceStepCursor(loaded, input.stepId ?? null);
  const entry = requireCursorEntry(loaded, entries, cursor.id);
  requireStepOutputSurfacesFree({
    repoRoot,
    storeRoot: input.storeRoot,
    state: loaded,
    entry,
  });
  const mode = entry.step.mode.value ?? PLAYBOOK_DEFAULT_STEP_MODE;
  const plan = await planAdvance({ input, entry, mode, repoRoot });

  const state = transitionPlaybookRunState({
    repoRoot,
    storeRoot: input.storeRoot,
    runId: input.runId,
    apply: (current) => {
      requireOpenRun(current, "advanced");
      requireFreshRun(current, "advanced");
      const currentEntries = requireWorkflowEntries(current, model);
      const currentCursor = requireAdvanceStepCursor(current, input.stepId ?? null);
      const currentEntry = requireCursorEntry(current, currentEntries, currentCursor.id);
      if (currentEntry.id !== entry.id) {
        throw new OperationError(
          `Playbook run \`${current.runId}\` moved to step \`${currentEntry.id}\` while advancing \`${entry.id}\`; retry against the current position.`,
        );
      }
      return plan.kind === "hold"
        ? applyAdvanceHold(current, currentEntry, plan, input)
        : applyAdvanceOutcome(current, currentEntries, currentEntry, currentCursor, plan, input);
    },
  });

  return {
    state,
    execution: {
      stepId: entry.id,
      mode,
      action: plan.action,
      outcome: plan.kind === "outcome" ? plan.outcome : null,
      presentedCommand: plan.kind === "hold" ? plan.presentedCommand : null,
      instructions: plan.kind === "hold" ? plan.instructions : null,
      executionEvidence: plan.kind === "outcome" ? plan.executionEvidence : null,
    },
  };
}

/**
 * Resolves what this advance does from the effective step mode and the
 * caller's input (R-MODE-1..2). Deterministic execution side effects happen
 * here, before any state transition.
 */
async function planAdvance(args: {
  input: AdvancePlaybookRunInput;
  entry: WorkflowStepEntry;
  mode: PlaybookStepMode;
  repoRoot: string;
}): Promise<AdvancePlan> {
  const { input, entry, mode, repoRoot } = args;
  if (input.acknowledge) {
    if (mode !== "manual") {
      throw new OperationError(
        `Step \`${entry.id}\` runs in \`${mode}\` mode; acknowledgment is recorded only for \`manual\` steps (R-MODE-1).`,
      );
    }
    if (input.outcome) {
      throw new OperationError(
        `Manual step \`${entry.id}\` records acknowledgment only; it takes no reported outcome (R-MODE-1).`,
      );
    }
    return { kind: "outcome", action: "acknowledged", outcome: "completed", executionEvidence: null };
  }
  if (mode === "manual") {
    throw new OperationError(
      `Step \`${entry.id}\` is a \`manual\` step: documentation only. Record acknowledgment with \`playbook.advance\` and the acknowledge flag; nothing is executed (R-MODE-1).`,
    );
  }
  if (input.outcome) {
    if (input.present) {
      throw new OperationError(
        `Presenting a command and reporting an outcome are mutually exclusive on step \`${entry.id}\`; report the outcome after running the presented command.`,
      );
    }
    return { kind: "outcome", action: "recorded", outcome: input.outcome, executionEvidence: null };
  }
  if (mode === "deterministic") {
    return planDeterministicAdvance(args);
  }
  // `delegated`, including the R-MODE-2 default for an unspecified mode.
  if (input.present) {
    throw new OperationError(
      `Only \`deterministic\` steps present a command form; step \`${entry.id}\` runs in \`${mode}\` mode and already presents its instructions.`,
    );
  }
  const instructions =
    entry.step.invocations.find((invocation) => invocation.form === "instructions")
      ?.instructions?.value ?? null;
  return {
    kind: "hold",
    action: "presented-instructions",
    presentedCommand: null,
    instructions,
    note: `Presented the step instructions for delegated execution; awaiting the reported outcome.`,
    hint: `Delegated step \`${entry.id}\` is waiting for its executor: follow the step instructions, then report the outcome and evidence with \`playbook.advance\`.`,
  };
}

/**
 * Deterministic advance without a reported outcome (R-MODE-1): execute the
 * step's `operation` through the operation core or its `command` through
 * the shell, or — on the CLI-absent path — resolve and present the human
 * command form derived from the operation registry (R-TIER-1).
 */
async function planDeterministicAdvance(args: {
  input: AdvancePlaybookRunInput;
  entry: WorkflowStepEntry;
  repoRoot: string;
}): Promise<AdvancePlan> {
  const { input, entry, repoRoot } = args;
  const invocation = entry.step.invocations.find(
    (candidate) => candidate.form === "operation" || candidate.form === "command",
  );
  const operationId = invocation?.operation?.value ?? null;
  const commandRun = invocation?.commandRun?.value ?? null;
  if (!invocation || (!operationId && !commandRun)) {
    throw new OperationError(
      `Deterministic step \`${entry.id}\` declares no executable \`operation\` or \`command\` invocation; fix the Playbook workflow contract or report an outcome explicitly.`,
    );
  }
  if (input.present) {
    const presented = operationId ? await resolveOperationCliCommand(operationId) : commandRun!;
    return {
      kind: "hold",
      action: "presented-command",
      presentedCommand: presented,
      instructions: null,
      note: `Presented command \`${presented}\` for by-hand execution (CLI-absent tier).`,
      hint: `Deterministic step \`${entry.id}\` was presented for by-hand execution: run \`${presented}\`, then report the outcome and evidence with \`playbook.advance\`.`,
    };
  }
  const result = operationId
    ? await executeDeterministicOperation({
        operationId,
        // Step-declared input mapping is a later lineage; the engine supplies
        // the run's own roots, and each operation's schema strips the rest.
        operationInput: { repoRoot, storeRoot: input.storeRoot },
        context: playbookStepExecutionContext(repoRoot, input.operationContext),
      })
    : executeDeterministicCommand({ commandRun: commandRun!, repoRoot });
  return {
    kind: "outcome",
    action: operationId ? "executed-operation" : "executed-command",
    outcome: result.outcome,
    executionEvidence: result.evidence,
  };
}

/** Records a step outcome and moves the cursor (the Phase 2 transition, now mode-fed). */
function applyAdvanceOutcome(
  state: PlaybookRunState,
  entries: WorkflowStepEntry[],
  entry: WorkflowStepEntry,
  cursor: PlaybookRunCursor,
  plan: Extract<AdvancePlan, { kind: "outcome" }>,
  input: AdvancePlaybookRunInput,
): PlaybookRunState {
  const stepStatuses = withStepStatus(state.stepStatuses, entry.id, plan.outcome);
  const stepRecord: PlaybookRunEvidenceRecord = {
    scope: "step",
    subjectId: entry.id,
    outcome: plan.outcome,
    recordedAt: utcNow(),
    refs: dedupe(input.evidenceRefs ?? []),
    note: normalizeNote(input.note),
    ...(plan.executionEvidence ? { execution: plan.executionEvidence } : {}),
  };

  let position: RunPosition;
  if (plan.outcome === "failed") {
    const failureTarget =
      state.routingModel === "graph" ? (entry.step.routing?.onFailure ?? null) : null;
    position = failureTarget
      ? positionFromTarget(failureTarget, entries, entry)
      : {
          cursor,
          status: "blocked",
          hint: `Step \`${entry.id}\` failed; resume with \`playbook.resume\` to retry via \`playbook.advance\`, or finalize with \`playbook.close\`.`,
          hintSubject: entry.id,
        };
  } else {
    position = positionFromSuccessor(
      computeSuccessor(state.routingModel, entries, stepStatuses, entry),
    );
  }
  const settled = settleUnattendedGates(state, entries, stepStatuses, position);

  return {
    ...state,
    stepStatuses: settled.stepStatuses,
    gateDecisions: [...state.gateDecisions, ...settled.gateDecisions],
    ...appendEvidenceRecords(state, [stepRecord, ...settled.evidenceRecords]),
    outputRefs: dedupe([...state.outputRefs, ...(input.outputRefs ?? [])]),
    cursor: settled.position.cursor,
    status: settled.position.status,
    ...settleGuidanceHints(state, settled.stepStatuses, [
      { hint: settled.position.hint, subjectId: settled.position.hintSubject },
    ]),
  };
}

/**
 * Holds the step at `waiting-for-user` after a presentation (R-MODE-1): the
 * cursor stays put, the run waits, and the presentation is recorded as
 * evidence once (a repeated presentation refreshes nothing).
 */
function applyAdvanceHold(
  state: PlaybookRunState,
  entry: WorkflowStepEntry,
  plan: Extract<AdvancePlan, { kind: "hold" }>,
  input: AdvancePlaybookRunInput,
): PlaybookRunState {
  const alreadyWaiting = stepStatusOf(state.stepStatuses, entry.id) === "waiting-for-user";
  const stepStatuses = withStepStatus(state.stepStatuses, entry.id, "waiting-for-user");
  const evidence = alreadyWaiting
    ? {}
    : appendEvidence(state, {
        scope: "step",
        subjectId: entry.id,
        outcome: "waiting-for-user",
        recordedAt: utcNow(),
        refs: dedupe(input.evidenceRefs ?? []),
        note: normalizeNote(input.note) ?? plan.note,
      });
  return {
    ...state,
    stepStatuses,
    ...evidence,
    status: "waiting-for-user",
    ...settleGuidanceHints(state, stepStatuses, [{ hint: plan.hint, subjectId: entry.id }]),
  };
}

/** The advance-position preconditions, shared by the pre-execution read and the transition. */
function requireAdvanceStepCursor(
  state: PlaybookRunState,
  stepId: string | null,
): PlaybookRunCursor {
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
  if (stepId && stepId !== cursor.id) {
    throw new OperationError(
      `Step \`${stepId}\` is not the current cursor step \`${cursor.id}\` of run \`${state.runId}\`.`,
    );
  }
  return cursor;
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
  requireFreshRun(loaded, "gated");
  requireCapabilityClearance(loaded, "gated");
  const model = loadPlaybookRunModel(repoRoot, loaded);

  return transitionPlaybookRunState({
    repoRoot,
    storeRoot: input.storeRoot,
    runId: input.runId,
    apply: (state) => {
      requireOpenRun(state, "gated");
      requireFreshRun(state, "gated");
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
      const gateRecord: PlaybookRunEvidenceRecord = {
        scope: "gate",
        subjectId: entry.id,
        outcome: input.decision,
        recordedAt: decidedAt,
        refs,
        note: normalizeNote(input.note),
      };
      const position: RunPosition = approved
        ? positionFromSuccessor(computeSuccessor(state.routingModel, entries, stepStatuses, entry))
        : {
            cursor,
            status: "blocked",
            hint: `Gate \`${entry.id}\` was rejected; re-plan, then re-enter with \`playbook.resume\` or finalize with \`playbook.close\`.`,
            hintSubject: entry.id,
          };
      const settled = approved
        ? settleUnattendedGates(state, entries, stepStatuses, position)
        : { stepStatuses, gateDecisions: [], evidenceRecords: [], position };

      return {
        ...state,
        stepStatuses: settled.stepStatuses,
        gateDecisions: [
          ...state.gateDecisions,
          { gateId: entry.id, decision: input.decision, decidedAt, evidenceRefs: refs },
          ...settled.gateDecisions,
        ],
        ...appendEvidenceRecords(state, [gateRecord, ...settled.evidenceRecords]),
        cursor: settled.position.cursor,
        status: settled.position.status,
        ...settleGuidanceHints(state, settled.stepStatuses, [
          { hint: settled.position.hint, subjectId: settled.position.hintSubject },
        ]),
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
  /**
   * Explicit opt-in migration (R-RESUME-2): after a digest mismatch, re-map
   * still-present step identifiers onto the current workflow, flag added and
   * removed steps, and adopt the current digest. NEVER the default mismatch
   * behavior — without this flag a mismatch blocks.
   */
  migrate?: boolean;
}

/**
 * `playbook.resume` (read then write, R-OP-1): the digest-checked re-entry
 * (R-RESUME-1). The stored source digest is compared with the current
 * Playbook digest from the single parsed model:
 *
 * - MATCH: the run re-enters at its stored cursor, recomputing the run
 *   status from the cursor position and recording the resume as evidence
 *   (clearing any staleness marker left by a since-reverted change).
 * - MISMATCH (default): the run is marked stale and blocked, the mismatch
 *   is recorded as evidence, and the operation throws a diagnostic naming
 *   the change — both digests plus the step identifiers added and removed —
 *   and directing the caller to an explicit re-plan (`playbook.start`
 *   against the current source) or the opt-in migration. The runner never
 *   silently resumes against a changed workflow.
 * - MISMATCH with `migrate` (R-RESUME-2, opt-in only): still-present step
 *   identifiers keep their recorded statuses, added steps seed `pending`,
 *   removed steps are dropped and named in the evidence, the cursor stays
 *   at its step when that step survived (falling back to the first pending
 *   sequential step otherwise), and the run adopts the current digest,
 *   schema versions, routing model, and dependency registry before
 *   re-entering.
 */
export function resumePlaybookRun(input: ResumePlaybookRunInput): PlaybookRunState {
  const repoRoot = findRepoRoot(input.repoRoot);
  const loaded = readPlaybookRunState({
    repoRoot,
    storeRoot: input.storeRoot,
    runId: input.runId,
  });
  requireOpenRun(loaded, "resumed");
  requireCapabilityClearance(loaded, "resumed");
  const model = loadPlaybookRunModel(repoRoot, loaded);
  const currentDigest = model.identity.sourceDigest;
  if (currentDigest === loaded.sourceDigest) {
    return reenterPlaybookRun(input, repoRoot);
  }

  const entries = workflowStepEntries(model);
  const storedIds = loaded.stepStatuses.map((entry) => entry.stepId);
  const currentIds = new Set(entries.map((entry) => entry.id));
  const addedStepIds = entries
    .map((entry) => entry.id)
    .filter((id) => !storedIds.includes(id));
  const removedStepIds = storedIds.filter((id) => !currentIds.has(id));

  if (input.migrate) {
    return migratePlaybookRun({
      input,
      repoRoot,
      model,
      entries,
      currentDigest,
      addedStepIds,
      removedStepIds,
    });
  }

  const diagnostic = staleResumeDiagnostic(loaded, currentDigest, addedStepIds, removedStepIds);
  transitionPlaybookRunState({
    repoRoot,
    storeRoot: input.storeRoot,
    runId: input.runId,
    apply: (state) => {
      requireOpenRun(state, "resumed");
      const detectedAt = utcNow();
      const evidence = appendEvidence(state, {
        scope: "resume",
        subjectId: state.runId,
        outcome: "blocked",
        recordedAt: detectedAt,
        refs: dedupe(input.evidenceRefs ?? []),
        note: diagnostic,
      });
      return {
        ...state,
        ...evidence,
        status: "blocked",
        staleness: {
          detectedAt,
          storedDigest: state.sourceDigest,
          currentDigest,
          addedStepIds,
          removedStepIds,
        },
        // The staleness diagnostic advises about the run as a whole, so it
        // is run-scoped guidance; retirement still sweeps resolved subjects.
        ...settleGuidanceHints(state, state.stepStatuses, [{ hint: diagnostic }]),
      };
    },
  });
  throw new OperationError(diagnostic);
}

/** The digest-match re-entry: the Phase 2 semantics, plus clearing staleness. */
function reenterPlaybookRun(input: ResumePlaybookRunInput, repoRoot: string): PlaybookRunState {
  return transitionPlaybookRunState({
    repoRoot,
    storeRoot: input.storeRoot,
    runId: input.runId,
    apply: (state) => {
      requireOpenRun(state, "resumed");
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
      // Caller-supplied resume hints advise about the run, not a single
      // step, so they are run-scoped (PRD 39 R-FIX-2).
      const additions: GuidanceHintAddition[] = (input.resumeHints ?? []).map((hint) => ({ hint }));
      if (state.cursor === null) {
        additions.push({
          hint: "No workflow position remains; finalize the run with `playbook.close`.",
        });
      }
      return {
        ...state,
        ...evidence,
        status,
        ...settleGuidanceHints(state, state.stepStatuses, additions),
        staleness: null,
      };
    },
  });
}

/**
 * The opt-in step re-mapping (R-RESUME-2). The algorithm is a D9-style
 * implementer decision, recorded here: statuses re-key by step identifier,
 * added steps seed `pending`, removed steps drop (named in evidence), the
 * cursor survives with its step or falls back to the first pending
 * sequential step, and the run adopts the current source identity (digest,
 * schema versions, routing model) plus a merged dependency snapshot that
 * keeps previously probed availability for still-declared dependencies.
 */
function migratePlaybookRun(args: {
  input: ResumePlaybookRunInput;
  repoRoot: string;
  model: PlaybookModel;
  entries: WorkflowStepEntry[];
  currentDigest: string;
  addedStepIds: string[];
  removedStepIds: string[];
}): PlaybookRunState {
  const { input, repoRoot, model, entries, currentDigest, addedStepIds, removedStepIds } = args;
  return transitionPlaybookRunState({
    repoRoot,
    storeRoot: input.storeRoot,
    runId: input.runId,
    apply: (state) => {
      requireOpenRun(state, "resumed");
      const statusById = new Map(state.stepStatuses.map((entry) => [entry.stepId, entry.status]));
      const stepStatuses: PlaybookRunStepStatusEntry[] = entries.map((entry) => ({
        stepId: entry.id,
        status: statusById.get(entry.id) ?? "pending",
      }));
      const survivingCursorEntry = state.cursor
        ? entries.find((entry) => entry.id === state.cursor?.id)
        : undefined;
      const fallbackEntry = entries.find(
        (entry) =>
          isSequential(entry.step) && (statusById.get(entry.id) ?? "pending") === "pending",
      );
      const cursorEntry = survivingCursorEntry ?? fallbackEntry ?? null;
      const cursor = cursorEntry
        ? playbookRunCursorForStep(cursorEntry.step, cursorEntry.index)
        : null;
      const status: PlaybookStepStatus =
        cursor === null || cursor.kind === "gate" ? "waiting-for-user" : "running";
      const note = migrationNote(state, currentDigest, addedStepIds, removedStepIds);
      const evidence = appendEvidence(state, {
        scope: "resume",
        subjectId: state.runId,
        outcome: status,
        recordedAt: utcNow(),
        refs: dedupe(input.evidenceRefs ?? []),
        note: normalizeNote(input.note) ?? note,
      });
      // The migration note and caller hints are run-scoped; retirement runs
      // against the RE-MAPPED statuses, so hints about steps the migration
      // dropped or that resolved earlier retire here (PRD 39 R-FIX-2).
      const additions: GuidanceHintAddition[] = [
        { hint: note },
        ...(input.resumeHints ?? []).map((hint) => ({ hint })),
      ];
      if (cursor === null) {
        additions.push({
          hint: "No workflow position remains; finalize the run with `playbook.close`.",
        });
      }
      return {
        ...state,
        ...evidence,
        sourceDigest: currentDigest,
        documentSchemaVersion: model.identity.schemaVersion,
        workflowSchemaVersion: model.identity.workflowSchemaVersion,
        routingModel:
          model.workflow?.header.routing.value ?? PLAYBOOK_DEFAULT_WORKFLOW_ROUTING_MODE,
        stepStatuses,
        dependencyAvailability: mergeDependencyAvailability(state.dependencyAvailability, model),
        cursor,
        status,
        staleness: null,
        ...settleGuidanceHints(state, stepStatuses, additions),
      };
    },
  });
}

/** The R-RESUME-1 mismatch diagnostic: names both digests and the step-level change. */
function staleResumeDiagnostic(
  state: PlaybookRunState,
  currentDigest: string,
  addedStepIds: string[],
  removedStepIds: string[],
): string {
  const stepChange =
    addedStepIds.length > 0 || removedStepIds.length > 0
      ? `workflow steps changed (added: ${nameStepIds(addedStepIds)}; removed: ${nameStepIds(removedStepIds)})`
      : "no workflow step identifiers were added or removed, so the change is inside step definitions or narrative content";
  return (
    `Playbook run \`${state.runId}\` is stale: the Playbook source at \`${state.playbookPath}\` changed since the run started — ` +
    `stored digest \`${state.sourceDigest}\`, current digest \`${currentDigest}\`; ${stepChange}. ` +
    "Resume blocks by default and never silently re-enters a changed workflow; re-plan with `playbook.start` against the current source, " +
    "or explicitly opt in to step re-mapping with `playbook.resume` and the migrate flag."
  );
}

function migrationNote(
  state: PlaybookRunState,
  currentDigest: string,
  addedStepIds: string[],
  removedStepIds: string[],
): string {
  return (
    `Playbook run \`${state.runId}\` migrated to the current Playbook source by explicit opt-in: ` +
    `digest \`${state.sourceDigest}\` -> \`${currentDigest}\`; steps added: ${nameStepIds(addedStepIds)}; ` +
    `steps removed: ${nameStepIds(removedStepIds)}. Still-present step identifiers keep their recorded statuses.`
  );
}

function nameStepIds(ids: string[]): string {
  return ids.length > 0 ? ids.map((id) => `\`${id}\``).join(", ") : "none";
}

/** Merges the current dependency registry with previously probed availability. */
function mergeDependencyAvailability(
  existing: PlaybookRunDependencyAvailability[],
  model: PlaybookModel,
): PlaybookRunDependencyAvailability[] {
  const byId = new Map(existing.map((dependency) => [dependency.id, dependency]));
  return model.dependencies.entries.map((dependency) => {
    const id = dependency.id.value;
    return {
      id,
      kind: dependency.kind.value ?? dependency.kind.raw,
      requirement: dependency.requirement.value ?? dependency.requirement.raw,
      availability: byId.get(id)?.availability ?? "unknown",
    };
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
        // Close retires ALL guidance hints — a closed run's state carries
        // none; the durable audit trail is the evidence log, to which the
        // close record above was just appended (PRD 39 R-FIX-2, D-016).
        resumeHints: [],
        hintSubjects: {},
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
  /**
   * The step or gate the hint advises about (PRD 39 R-FIX-2); null when the
   * hint is run-scoped guidance (for example close guidance), which retires
   * only at `playbook.close`.
   */
  hintSubject: string | null;
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
    // Close guidance advises about the run as a whole, not a step subject.
    hintSubject: null,
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
    hintSubject: null,
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

/**
 * A stale run refuses step and gate transitions (R-RESUME-1 corollary,
 * recorded implementer decision): once `playbook.resume` detects a digest
 * mismatch, the engine never progresses against the changed workflow until
 * an explicit re-plan or the opt-in migration clears the marker.
 */
function requireFreshRun(state: PlaybookRunState, verb: string): void {
  const staleness = state.staleness ?? null;
  if (staleness) {
    throw new OperationError(
      `Playbook run \`${state.runId}\` is stale against its Playbook source (stored digest \`${staleness.storedDigest}\`, ` +
        `current digest \`${staleness.currentDigest}\` when detected) and cannot be ${verb}. ` +
        "Re-plan with `playbook.start` against the current source, or opt in to step re-mapping with `playbook.resume` and the migrate flag.",
    );
  }
}

/**
 * Reviewed-capability clearance (W18 R7 P4; R-SCOPE-2, R-KEEP-1): the
 * creation-time capability snapshot is consumed unchanged — a run whose
 * required capabilities were unknown or unsupported (`manual-review-required`)
 * refuses advance, gate, and resume transitions with the evaluation's own
 * guidance. The runner never guesses an unknown capability; after the
 * `harnessCapabilities` record is reviewed, an explicit re-plan
 * (`playbook.start`) takes a fresh snapshot. `playbook.close` stays available
 * so a stopped run can always be finalized.
 */
function requireCapabilityClearance(state: PlaybookRunState, verb: string): void {
  if (state.capabilitySnapshot?.status !== "manual-review-required") {
    return;
  }
  throw new OperationError(
    `Playbook run \`${state.runId}\` requires manual capability review before it can be ${verb}: ` +
      `${state.capabilitySnapshot.guidance.join(" ")} ` +
      "Review the harness capability record under `harnessCapabilities` in `.make-docs/config.yaml`, " +
      "then re-plan with `playbook.start` against the current source, or finalize with `playbook.close`.",
  );
}

/**
 * Output-surface conflict guardrail at step advance (W18 R7 P4; R-GUARD-3):
 * when the current step declares output surfaces (the W18 R6 step `outputs`
 * declarations), they are checked against the claims of every other open run
 * of the project outside this run's serial family before anything executes.
 * Overlap stops the advance — leaving run state untouched — rather than
 * risking interleaved writes. The check runs before deterministic execution,
 * so a refused step never runs.
 */
function requireStepOutputSurfacesFree(args: {
  repoRoot: string;
  storeRoot?: string;
  state: PlaybookRunState;
  entry: WorkflowStepEntry;
}): void {
  const declared = args.entry.step.outputs
    .map((output) => output.name.value)
    .filter((name): name is string => Boolean(name));
  const stepClaims = normalizeOutputSurfaceClaims(declared);
  if (stepClaims.length === 0) {
    return;
  }
  const openRuns = listPlaybookRunStates({
    repoRoot: args.repoRoot,
    storeRoot: args.storeRoot,
  }).filter((run) => !run.terminalStatus);
  const family = playbookRunFamilyIds({
    runId: args.state.runId,
    parentRunId: args.state.parentRunId,
    executionMode: args.state.executionMode ?? "serial",
    runsById: new Map(openRuns.map((run) => [run.runId, run])),
  });
  for (const other of openRuns) {
    if (family.has(other.runId)) {
      continue;
    }
    const overlap = findOutputSurfaceOverlap(stepClaims, other.outputSurfaceClaims);
    if (overlap) {
      throw new OperationError(
        `Step \`${args.entry.id}\` of run \`${args.state.runId}\` declares output surface \`${overlap[0]}\`, ` +
          `which overlaps \`${overlap[1]}\` claimed by open run \`${other.runId}\`; the runner stops rather ` +
          "than interleaving writes (R-GUARD-3). Close the conflicting run or re-plan with disjoint output surfaces.",
      );
    }
  }
}

interface UnattendedGateSettlement {
  stepStatuses: PlaybookRunStepStatusEntry[];
  gateDecisions: PlaybookRunGateDecision[];
  evidenceRecords: PlaybookRunEvidenceRecord[];
  position: RunPosition;
}

/**
 * Unattended-mode gate handling (W18 R7 P4; R-GUARD-4), applied wherever a
 * transition computes a new position — step advance and gate approval. In an
 * unattended run, a gate whose W18 R6 gate semantics declare
 * `unattended: true` proceeds without a human: the engine records an
 * `approve` decision with evidence naming the unattended continuation and
 * moves on (repeating for consecutive permitting gates, with a visited guard
 * against routing cycles). Every other gate sets the gate step to
 * `waiting-for-user` and HOLDS the run there for a human `playbook.gate`
 * decision. Attended runs are untouched. Recorded scope decision: the
 * settlement acts at advance and gate transitions; a run created or resumed
 * directly at a gate holds until its first transition, because creation and
 * digest-match re-entry do not recompute positions.
 */
function settleUnattendedGates(
  state: PlaybookRunState,
  entries: WorkflowStepEntry[],
  stepStatuses: PlaybookRunStepStatusEntry[],
  position: RunPosition,
): UnattendedGateSettlement {
  const settlement: UnattendedGateSettlement = {
    stepStatuses,
    gateDecisions: [],
    evidenceRecords: [],
    position,
  };
  if (state.unattended !== true) {
    return settlement;
  }
  const visited = new Set<string>();
  while (settlement.position.cursor?.kind === "gate") {
    const gateId = settlement.position.cursor.id;
    if (visited.has(gateId)) {
      break;
    }
    visited.add(gateId);
    const entry = entries.find((candidate) => candidate.id === gateId);
    if (!entry) {
      break;
    }
    if (entry.step.gate?.unattended?.value === true) {
      const decidedAt = utcNow();
      settlement.stepStatuses = withStepStatus(settlement.stepStatuses, entry.id, "completed");
      settlement.gateDecisions.push({
        gateId: entry.id,
        decision: "approve",
        decidedAt,
        evidenceRefs: [],
      });
      settlement.evidenceRecords.push({
        scope: "gate",
        subjectId: entry.id,
        outcome: "approve",
        recordedAt: decidedAt,
        refs: [],
        note:
          `Gate \`${entry.id}\` permits unattended continuation; the unattended run proceeded ` +
          "without a human (R-GUARD-4).",
      });
      settlement.position = positionFromSuccessor(
        computeSuccessor(state.routingModel, entries, settlement.stepStatuses, entry),
      );
      continue;
    }
    settlement.stepStatuses = withStepStatus(settlement.stepStatuses, entry.id, "waiting-for-user");
    settlement.position = {
      cursor: settlement.position.cursor,
      status: "waiting-for-user",
      hint:
        `Unattended run \`${state.runId}\` held at gate \`${entry.id}\`: the gate does not permit ` +
        "unattended continuation; record a human decision with `playbook.gate` (R-GUARD-4).",
      hintSubject: entry.id,
    };
    break;
  }
  return settlement;
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
  return appendEvidenceRecords(state, [record]);
}

function appendEvidenceRecords(
  state: PlaybookRunState,
  records: PlaybookRunEvidenceRecord[],
): Pick<PlaybookRunState, "evidenceLog" | "evidenceRefs"> {
  return {
    evidenceLog: [...(state.evidenceLog ?? []), ...records],
    evidenceRefs: dedupe([...state.evidenceRefs, ...records.flatMap((record) => record.refs)]),
  };
}

/**
 * Statuses that resolve a hint's step or gate subject (W18 R12 P2; PRD 39
 * R-FIX-2): the settled step-outcome statuses of the shared vocabulary. A
 * subject absent from the current step statuses (for example a step dropped
 * by the opt-in resume migration) is also resolved. Recorded implementer
 * decision: `failed` counts as resolved because it is a settled outcome —
 * the transition that records a failure appends its own fresh guidance AFTER
 * retirement, so the surviving hints always describe the position the latest
 * transition produced.
 */
const HINT_RESOLVED_STEP_STATUSES: readonly PlaybookStepStatus[] = [
  "completed",
  "failed",
  "skipped",
  "cancelled",
];

/** One hint appended by a transition, scoped to the step or gate it advises about. */
interface GuidanceHintAddition {
  hint: string | null;
  /** Step or gate subject; null or absent marks run-scoped guidance. */
  subjectId?: string | null;
}

/**
 * The single hint bookkeeping seam (PRD 39 R-FIX-2, the D-016 fix). Against
 * the post-transition step statuses it first RETIRES every hint whose subject
 * has reached a resolved status, then appends the transition's own additions,
 * recording their subject scope. Every mutating transition — `advance` (both
 * the outcome and hold paths), `gate`, and all three `resume` paths — flows
 * through here so retirement is uniform; `playbook.close` instead clears all
 * guidance hints, so a closed run's state carries none. Hints are forward
 * guidance only and never touch the evidence log.
 */
function settleGuidanceHints(
  state: PlaybookRunState,
  stepStatuses: PlaybookRunStepStatusEntry[],
  additions: GuidanceHintAddition[],
): Pick<PlaybookRunState, "resumeHints" | "hintSubjects"> {
  const statusById = new Map(stepStatuses.map((entry) => [entry.stepId, entry.status]));
  const subjects = { ...(state.hintSubjects ?? {}) };
  let hints = state.resumeHints.filter((hint) => {
    const subject = subjects[hint];
    if (!subject) {
      // Run-scoped guidance (including pre-change persisted hints, which
      // carry no subject) retires only at `playbook.close`.
      return true;
    }
    const status = statusById.get(subject);
    return !(status === undefined || HINT_RESOLVED_STEP_STATUSES.includes(status));
  });
  for (const addition of additions) {
    if (!addition.hint || hints.includes(addition.hint)) {
      continue;
    }
    hints = [...hints, addition.hint];
    if (addition.subjectId) {
      subjects[addition.hint] = addition.subjectId;
    }
  }
  // Keep the subject map exactly aligned with the surviving hints.
  for (const key of Object.keys(subjects)) {
    if (!hints.includes(key)) {
      delete subjects[key];
    }
  }
  return { resumeHints: hints, hintSubjects: subjects };
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeNote(note: string | null | undefined): string | null {
  const trimmed = note?.trim();
  return trimmed ? trimmed : null;
}
