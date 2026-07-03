import path from "node:path";
import {
  PLAYBOOK_DEFAULT_WORKFLOW_ROUTING_MODE,
  PLAYBOOK_STEP_STATUSES,
  parseAndValidatePlaybook,
  type PlaybookModel,
  type PlaybookStep,
  type PlaybookStepStatus,
  type PlaybookWorkflowRoutingMode,
} from "../../playbook";
import {
  createPlaybookRunRecord,
  listPlaybookRunRecords,
  readPlaybookRunRecord,
  resolveProjectIdentity,
  resolveStoreRoot,
  transitionPlaybookRunRecord,
  withStoreDatabase,
  type StoreDatabase,
} from "../../store";
import { createRunId, readTextFile } from "../../utils";
import { findRepoRoot, normalizePath, utcNow } from "../shared";
import { OperationError, type JsonValue } from "../types";
import type { OperationResult } from "../types";
import {
  evaluateHarnessCapabilities,
  resolvePlaybook,
  type HarnessCapabilityEvaluation,
  type PlaybookCatalogEntry,
  type PlaybookChildPolicy,
  type PlaybookConcurrencyPolicy,
  type PlaybookStack,
} from "./index";

/**
 * Playbook run state in the global store (W18 R7 P1; PRD 35 R-STORE-1..3,
 * R-STATE-1..2).
 *
 * This module is the runner's storage seam: read, create, and transition one
 * run record keyed by (manifest-minted project identifier, run identifier)
 * through the W18 R10 store primitives in `packages/cli/src/store/`. Run
 * state is relocated-canonical in the store — it is NEVER written under
 * `.make-docs/runs/` or any other repository path (R-STORE-1), and it is
 * never keyed by a directory path (R-STORE-2). Store schema, locking, and
 * recovery are consumed from the Runtime and Global Store lineage, not
 * defined here (R-STORE-3).
 *
 * Serialization (PRD 35 D9 implementer decision, recorded here and in
 * `packages/cli/src/store/README.md`): the full {@link PlaybookRunState}
 * record is serialized as one JSON document in the `record` column of the
 * store's `playbook_runs` table, versioned by its own `schemaVersion` field.
 * The store treats the payload as opaque JSON; this module owns the shape.
 *
 * Status vocabulary (R-STATE-2): per-step status, run status, and the
 * terminal status all use the shared W18 R6 vocabulary from
 * `packages/cli/src/playbook/model.ts` (`PLAYBOOK_STEP_STATUSES`). The
 * terminal statuses below are a type-checked subset of that vocabulary; the
 * runner defines no parallel status set.
 */

export type PlaybookRunExecutionMode = "serial" | "parallel";

/** Terminal statuses: the subset of the shared vocabulary a run can end in. */
export const PLAYBOOK_RUN_TERMINAL_STATUSES = [
  "completed",
  "failed",
  "cancelled",
] as const satisfies readonly PlaybookStepStatus[];
export type PlaybookRunTerminalStatus = (typeof PLAYBOOK_RUN_TERMINAL_STATUSES)[number];

/** Per-step status entry, in workflow declaration order (R-STATE-1). */
export interface PlaybookRunStepStatusEntry {
  stepId: string;
  status: PlaybookStepStatus;
}

/**
 * A recorded gate decision. The decision semantics (what unblocks, what
 * stops) land with `playbook.gate` in W18 R7 Phase 2; Phase 1 fixes only the
 * record shape the state carries.
 */
export interface PlaybookRunGateDecision {
  gateId: string;
  decision: string;
  decidedAt: string;
  evidenceRefs: string[];
}

/** Snapshot of one declared dependency's availability at a point in time. */
export interface PlaybookRunDependencyAvailability {
  id: string;
  kind: string | null;
  requirement: string | null;
  availability: "available" | "unavailable" | "unknown";
}

/** The current cursor: the step or gate the run is positioned at. */
export interface PlaybookRunCursor {
  kind: "step" | "gate";
  id: string;
}

/**
 * What a captured evidence entry attests: a step outcome, a gate decision, a
 * run closeout, a resume, or an explicit cross-machine import (W18 R7 P4;
 * R-PORT-1 — `playbook.run.import` appends an `import` record so the
 * rehydrated run carries its own provenance).
 */
export type PlaybookRunEvidenceScope = "step" | "gate" | "close" | "resume" | "import";

/**
 * Structured result of a deterministic step execution (W18 R7 P3; PRD 35
 * R-MODE-1, D9 implementer decision recorded here): when `playbook.advance`
 * executes a step's `operation` through the operation core or its `command`
 * through the shell, the captured evidence carries this record. `operation`
 * or `command` names what ran; `exitCode`/`stdoutTail`/`stderrTail` capture
 * the shell result (tails keep the last {@link PLAYBOOK_RUN_OUTPUT_EVIDENCE_LIMIT}
 * characters, where failures usually surface); `resultSummary` is the
 * operation invocation's JSON value truncated to the same limit; and
 * `errorMessage` carries the thrown message when execution failed without a
 * shell exit code. `truncated` is true whenever any captured stream or
 * summary was cut.
 */
export interface PlaybookRunExecutionEvidence {
  form: "operation" | "command";
  operation: string | null;
  command: string | null;
  exitCode: number | null;
  stdoutTail: string | null;
  stderrTail: string | null;
  resultSummary: string | null;
  errorMessage: string | null;
  truncated: boolean;
}

/** Character cap for captured stdout/stderr tails and operation result summaries. */
export const PLAYBOOK_RUN_OUTPUT_EVIDENCE_LIMIT = 4000;

/**
 * Captured evidence format (PRD 35 D9 implementer decision, recorded here).
 *
 * Every mutating progression operation appends one structured
 * `PlaybookRunEvidenceRecord` to `evidenceLog`: the scope names the event
 * kind, `subjectId` names the step or gate (or the run id for `close` and
 * `resume`), `outcome` is the reported result (a shared-vocabulary step
 * status for steps, the decision for gates, the terminal status for close),
 * `refs` carries caller-supplied evidence references (repository paths, run
 * ids, URLs, command transcripts), and `note` carries a free-form summary
 * from the reporting surface. The flat `evidenceRefs` field on the run state
 * remains the deduplicated roll-up of every record's `refs` — that is the
 * R-STATE-1 "evidence references" field — while `evidenceLog` preserves the
 * per-event attribution and ordering that audit and resume need.
 */
export interface PlaybookRunEvidenceRecord {
  scope: PlaybookRunEvidenceScope;
  subjectId: string;
  outcome: string;
  recordedAt: string;
  refs: string[];
  note: string | null;
  /** Structured deterministic-execution result; present only when the engine executed the step itself (R-MODE-1). */
  execution?: PlaybookRunExecutionEvidence;
}

/**
 * Staleness marker set by the digest-checked `playbook.resume` (W18 R7 P3;
 * PRD 35 R-RESUME-1, D9 implementer decision recorded here): when the stored
 * source digest no longer matches the current Playbook digest, the run is
 * marked stale with both digests and the step-identifier diff computable
 * from the current model, and it blocks — `playbook.advance` and
 * `playbook.gate` refuse a stale run until an explicit re-plan
 * (`playbook.start` against the current source) or the explicit opt-in
 * migration on `playbook.resume` clears the marker. A `null`/absent marker
 * means the run has never been detected stale (records created before this
 * field read as fresh; the next digest-checked resume decides).
 */
export interface PlaybookRunStaleness {
  detectedAt: string;
  storedDigest: string;
  currentDigest: string;
  addedStepIds: string[];
  removedStepIds: string[];
}

export interface PlaybookChildRunRecord {
  runId: string;
  playbookRef: string;
  stack: PlaybookStack;
  executionMode: PlaybookRunExecutionMode;
  outputSurfaceClaims: string[];
  status: PlaybookStepStatus;
}

/**
 * The run-state record (R-STATE-1). Extends the PRD 29 field set with the
 * project identifier, the source digest, the dependency availability
 * snapshot, and output/evidence references.
 */
export interface PlaybookRunState {
  schemaVersion: 2;
  runId: string;
  rootRunId: string;
  parentRunId: string | null;
  /** Manifest-minted stable project identifier (the store row key, R-STORE-2). */
  projectId: string;
  playbookRef: string;
  playbookPath: string;
  /** SHA-256 hex digest of the Playbook source at run creation (R-RESUME-1 input). */
  sourceDigest: string;
  documentSchemaVersion: string | null;
  workflowSchemaVersion: string | null;
  stack: PlaybookStack;
  harness: string;
  capabilitySnapshot: HarnessCapabilityEvaluation;
  routingModel: PlaybookWorkflowRoutingMode;
  stepStatuses: PlaybookRunStepStatusEntry[];
  gateDecisions: PlaybookRunGateDecision[];
  dependencyAvailability: PlaybookRunDependencyAvailability[];
  outputSurfaceClaims: string[];
  outputRefs: string[];
  /** Deduplicated roll-up of every evidence record's refs (R-STATE-1). */
  evidenceRefs: string[];
  /** Per-event evidence attribution appended by the progression operations. */
  evidenceLog: PlaybookRunEvidenceRecord[];
  cursor: PlaybookRunCursor | null;
  /** Digest-mismatch marker (R-RESUME-1); null or absent while the run is fresh. */
  staleness?: PlaybookRunStaleness | null;
  /**
   * This run's own execution mode relative to its parent and siblings
   * (W18 R7 P4; R-GUARD-1..2). Serial is the default; absent in records
   * created before this field and read as `serial`.
   */
  executionMode?: PlaybookRunExecutionMode;
  /**
   * Unattended-mode marker (W18 R7 P4; R-GUARD-4): set only by explicit
   * caller opt-in on a Playbook whose run metadata declares
   * `unattended: true`. Absent in records created before this field and read
   * as attended.
   */
  unattended?: boolean;
  childPolicy: PlaybookChildPolicy;
  concurrencyPolicy: PlaybookConcurrencyPolicy;
  childRuns: PlaybookChildRunRecord[];
  resumeHints: string[];
  /** Current run status, always a shared-vocabulary value (R-STATE-2). */
  status: PlaybookStepStatus;
  /** Set only by run finalization; null while the run is open. */
  terminalStatus: PlaybookRunTerminalStatus | null;
  stateSource: "make-docs";
  harnessAssistsAreSourceOfTruth: false;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlaybookRunStateInput {
  repoRoot?: string;
  /** Explicit store root override (tests/sandboxes); defaults to the resolved global store. */
  storeRoot?: string;
  ref: string;
  requestedStack?: string | null;
  harness: string;
  requiredCapabilities?: string[];
  preferredCapabilities?: string[];
  runId?: string;
  parentRunId?: string | null;
  executionMode?: PlaybookRunExecutionMode;
  /**
   * Explicit unattended opt-in (R-GUARD-4). Requires the resolved Playbook's
   * run metadata to declare `unattended: true`; fails closed otherwise.
   */
  unattended?: boolean;
  /**
   * Explicit reviewed approval for parallel child execution (R-GUARD-2): the
   * "reviewed approval" alternative to a reviewed `harnessCapabilities`
   * record supporting `parallel_playbook_runs`. Surfaces grant it through the
   * operation core's named-approval seam (`parallel-children-reviewed`).
   */
  parallelChildrenReviewed?: boolean;
  outputSurfaceClaims?: string[];
  currentStep?: string | null;
  currentGate?: string | null;
  status?: PlaybookStepStatus;
  resumeHints?: string[];
}

export interface CreatePlaybookRunStateResult {
  projectId: string;
  runId: string;
  state: PlaybookRunState;
  parentState: PlaybookRunState | null;
}

/**
 * Creates a run and stores its record in the global store keyed by
 * (project id, run id). A child run is validated against its parent's
 * orchestration policy and linked into the parent's child-run references
 * inside the same store connection.
 *
 * W18 R7 P4 guardrails enforced here at creation time:
 *
 * - Nesting (R-GUARD-1): the parent's orchestration policy must permit child
 *   Playbooks, the child links through `parentRunId` plus the shared
 *   `rootRunId`, and serial execution is the default.
 * - Parallel children (R-GUARD-2): explicit parent permission
 *   (`child_playbooks: parallel`), plus a reviewed `harnessCapabilities`
 *   record supporting `parallel_playbook_runs` or an explicit reviewed
 *   approval, plus non-overlapping claimed output surfaces.
 * - Output-surface conflicts (R-GUARD-3): the new run's claims are checked
 *   against every other open run of the project outside its serial family;
 *   overlap stops the creation rather than risking interleaved writes.
 * - Unattended mode (R-GUARD-4): the caller's explicit opt-in is honored only
 *   when the Playbook's run metadata declares `unattended: true`.
 * - Capability handling (R-SCOPE-2, R-KEEP-1): the reviewed capability
 *   evaluation is consumed unchanged — a `manual-review-required` snapshot
 *   creates the run `blocked` with the evaluation's guidance, and a
 *   `serial-gated-fallback` snapshot records the serial-gated guidance as
 *   resume hints.
 */
export function createPlaybookRunState(
  input: CreatePlaybookRunStateInput,
): CreatePlaybookRunStateResult {
  const repoRoot = findRepoRoot(input.repoRoot);
  const projectId = requireRunProjectId(repoRoot);
  const resolution = resolvePlaybook({
    repoRoot,
    ref: input.ref,
    requestedStack: input.requestedStack,
  });
  const entry = resolution.entry;
  const model = parsePlaybookModelForEntry(repoRoot, entry);
  const runId = input.runId ?? createRunId();
  const parentRunId = input.parentRunId ?? null;
  const executionMode = input.executionMode ?? "serial";
  const unattended = input.unattended === true;
  if (unattended && entry.run.unattended !== true) {
    throw new OperationError(
      `Playbook \`${entry.ref}\` does not declare unattended support (run metadata \`unattended: true\`); ` +
        "an unattended run requires the Playbook's explicit permission (R-GUARD-4).",
    );
  }
  const outputSurfaceClaims = normalizeOutputSurfaceClaims(input.outputSurfaceClaims ?? []);
  const capabilitySnapshot = evaluateHarnessCapabilities({
    repoRoot,
    harness: input.harness,
    requiredCapabilities: [
      ...entry.run.requiresCapabilities,
      ...(input.requiredCapabilities ?? []),
    ],
    preferredCapabilities: [
      ...entry.run.prefersCapabilities,
      ...(input.preferredCapabilities ?? []),
    ],
  });
  // R-SCOPE-2 / R-KEEP-1: without an explicit caller status, the reviewed
  // capability evaluation decides — required capabilities that are unknown or
  // unsupported stop the run at `blocked` with manual-review guidance, and
  // unavailable optional capabilities record the serial-gated-fallback hints.
  const status =
    input.status === undefined && capabilitySnapshot.status === "manual-review-required"
      ? "blocked"
      : parseRunStatus(input.status ?? "pending");
  const capabilityHints =
    input.status === undefined && capabilitySnapshot.status !== "ready"
      ? capabilitySnapshot.guidance
      : [];
  const now = utcNow();
  const storeRoot = resolveRunStoreRoot(input.storeRoot);

  return withStoreDatabase(storeRoot, (db) => {
    const parent = parentRunId ? readRunRecordOrThrow(db, projectId, parentRunId) : null;
    validateChildRunRequest({
      executionMode,
      outputSurfaceClaims,
      parent,
      capabilitySnapshot,
      parallelChildrenReviewed: input.parallelChildrenReviewed === true,
    });
    requireCreationClaimsFree({
      runId,
      parentRunId,
      executionMode,
      outputSurfaceClaims,
      openRuns: listOpenRunStates(db, projectId),
    });

    const state: PlaybookRunState = {
      schemaVersion: 2,
      runId,
      rootRunId: parent?.rootRunId ?? runId,
      parentRunId,
      projectId,
      playbookRef: entry.ref,
      playbookPath: entry.path,
      sourceDigest: model.identity.sourceDigest,
      documentSchemaVersion: model.identity.schemaVersion,
      workflowSchemaVersion: model.identity.workflowSchemaVersion,
      stack: entry.stack,
      harness: input.harness,
      capabilitySnapshot,
      routingModel:
        model.workflow?.header.routing.value ?? PLAYBOOK_DEFAULT_WORKFLOW_ROUTING_MODE,
      stepStatuses: seedStepStatuses(model),
      gateDecisions: [],
      dependencyAvailability: snapshotDependencyAvailability(model),
      outputSurfaceClaims,
      outputRefs: [],
      evidenceRefs: [],
      evidenceLog: [],
      cursor:
        cursorFrom(input.currentStep ?? null, input.currentGate ?? null) ??
        initialPlaybookRunCursor(model),
      staleness: null,
      executionMode,
      unattended,
      childPolicy: entry.run.childPlaybooks,
      concurrencyPolicy: entry.run.concurrency,
      childRuns: [],
      resumeHints: mergeHints(input.resumeHints ?? [], capabilityHints),
      status,
      terminalStatus: null,
      stateSource: "make-docs",
      harnessAssistsAreSourceOfTruth: false,
      createdAt: now,
      updatedAt: now,
    };

    createPlaybookRunRecord(db, {
      projectId,
      runId,
      record: state as unknown as JsonValue,
      now,
    });

    let parentState: PlaybookRunState | null = null;
    if (parent) {
      parentState = {
        ...parent,
        childRuns: [
          ...parent.childRuns.filter((child) => child.runId !== runId),
          {
            runId,
            playbookRef: state.playbookRef,
            stack: state.stack,
            executionMode,
            outputSurfaceClaims,
            status: state.status,
          },
        ],
        updatedAt: now,
      };
      transitionPlaybookRunRecord(db, {
        projectId,
        runId: parent.runId,
        record: parentState as unknown as JsonValue,
        now,
      });
    }

    return { projectId, runId, state, parentState };
  });
}

/** Reads a run record from the global store, keyed by (project id, run id). */
export function readPlaybookRunState(input: {
  repoRoot?: string;
  storeRoot?: string;
  runId: string;
}): PlaybookRunState {
  const repoRoot = findRepoRoot(input.repoRoot);
  const projectId = requireRunProjectId(repoRoot);
  return withStoreDatabase(resolveRunStoreRoot(input.storeRoot), (db) =>
    readRunRecordOrThrow(db, projectId, input.runId),
  );
}

/**
 * Lists every stored run record of the resolved project. The progression
 * engine consumes this for the R-GUARD-3 concurrent output-surface checks;
 * records stay the runner-owned {@link PlaybookRunState} shape.
 */
export function listPlaybookRunStates(input: {
  repoRoot?: string;
  storeRoot?: string;
}): PlaybookRunState[] {
  const repoRoot = findRepoRoot(input.repoRoot);
  const projectId = requireRunProjectId(repoRoot);
  return withStoreDatabase(resolveRunStoreRoot(input.storeRoot), (db) =>
    listPlaybookRunRecords(db, projectId).map(
      (row) => row.record as unknown as PlaybookRunState,
    ),
  );
}

/**
 * Transitions an existing run record: read, apply, stamp `updatedAt`, and
 * replace in one store connection. What a valid transition IS (statuses,
 * cursors, gates) belongs to the W18 R7 Phase 2 progression operations; this
 * is the storage seam they consume. Fails explicitly when the run does not
 * exist, so a transition can never silently create state.
 */
export function transitionPlaybookRunState(input: {
  repoRoot?: string;
  storeRoot?: string;
  runId: string;
  apply: (state: PlaybookRunState) => PlaybookRunState;
}): PlaybookRunState {
  const repoRoot = findRepoRoot(input.repoRoot);
  const projectId = requireRunProjectId(repoRoot);
  return withStoreDatabase(resolveRunStoreRoot(input.storeRoot), (db) => {
    const current = readRunRecordOrThrow(db, projectId, input.runId);
    const next: PlaybookRunState = { ...input.apply(current), updatedAt: utcNow() };
    if (next.runId !== current.runId || next.projectId !== current.projectId) {
      throw new OperationError(
        "A Playbook run transition must not change the run identifier or project identifier.",
      );
    }
    transitionPlaybookRunRecord(db, {
      projectId,
      runId: input.runId,
      record: next as unknown as JsonValue,
      now: next.updatedAt,
    });
    return next;
  });
}

export function writePlaybookRunState(
  input: CreatePlaybookRunStateInput,
): OperationResult<JsonValue> {
  return {
    value: createPlaybookRunState(input) as unknown as JsonValue,
    provenance: {
      domain: "playbook",
      operation: "playbook-run-start",
      source: "shared",
      target: input.ref,
    },
  };
}

export function inspectPlaybookRunState(input: {
  repoRoot?: string;
  storeRoot?: string;
  runId: string;
}): OperationResult<JsonValue> {
  return {
    value: readPlaybookRunState(input) as unknown as JsonValue,
    provenance: {
      domain: "playbook",
      operation: "playbook-run-read",
      source: "shared",
      target: input.runId,
    },
  };
}

export function normalizeOutputSurfaceClaims(claims: string[]): string[] {
  return [...new Set(claims.map((claim) => normalizePath(claim.trim()).replace(/\/+$/, "")).filter(Boolean))];
}

/**
 * Resolves the project identifier that keys run state (R-STORE-2). Every
 * non-resolved identity fails with actionable guidance rather than falling
 * back to path-keyed state. Exported for the run portability seam
 * (`./portability`), which keys imported runs by the importing repository's
 * own manifest-minted identity (R-PORT-1).
 */
export function requireRunProjectId(repoRoot: string): string {
  const resolution = resolveProjectIdentity(repoRoot);
  if (resolution.status === "resolved") {
    return resolution.projectId;
  }
  const guidance =
    resolution.status === "unminted"
      ? "this project's manifest predates the stable project identifier; run `make-docs` once to mint it."
      : resolution.status === "no-manifest"
        ? "this repository has no .make-docs/manifest.json; run `make-docs` to set up Make Docs first."
        : "this project's .make-docs/manifest.json is unreadable; repair it and rerun `make-docs`.";
  throw new OperationError(
    `Cannot use the global store for Playbook run state: ${guidance} ` +
      "Run state is keyed by the manifest-minted project identifier plus a run identifier, never by a repository path.",
  );
}

export function resolveRunStoreRoot(storeRoot: string | undefined): string {
  return resolveStoreRoot(storeRoot ? { storeRoot } : {});
}

/** Fail-closed runtime guard: only shared-vocabulary statuses (R-STATE-2). */
function parseRunStatus(value: string): PlaybookStepStatus {
  if (!PLAYBOOK_STEP_STATUSES.includes(value as PlaybookStepStatus)) {
    throw new OperationError(
      `Playbook run status must be one of the shared step statuses: ${PLAYBOOK_STEP_STATUSES.join(", ")}.`,
    );
  }
  return value as PlaybookStepStatus;
}

function readRunRecordOrThrow(
  db: StoreDatabase,
  projectId: string,
  runId: string,
): PlaybookRunState {
  const row = readPlaybookRunRecord(db, projectId, runId);
  if (!row) {
    throw new OperationError(`No Playbook run state found for run id \`${runId}\`.`);
  }
  return row.record as unknown as PlaybookRunState;
}

function parsePlaybookModelForEntry(
  repoRoot: string,
  entry: PlaybookCatalogEntry,
): PlaybookModel {
  const sourcePath = path.isAbsolute(entry.path)
    ? entry.path
    : path.resolve(repoRoot, entry.path);
  return parseAndValidatePlaybook({
    sourcePath: entry.path,
    source: readTextFile(sourcePath),
  }).model;
}

/**
 * Loads the single parsed Playbook model for an existing run through the
 * W18 R6 library parser (R-SCOPE-1): the progression engine consumes this
 * model for every dependency, gate, and routing read and never re-parses
 * Playbook Markdown itself.
 */
export function loadPlaybookRunModel(repoRoot: string, state: PlaybookRunState): PlaybookModel {
  const sourcePath = path.isAbsolute(state.playbookPath)
    ? state.playbookPath
    : path.resolve(repoRoot, state.playbookPath);
  return parseAndValidatePlaybook({
    sourcePath: state.playbookPath,
    source: readTextFile(sourcePath),
  }).model;
}

/** Stable run-facing step identifier, matching the seeded status entries. */
export function playbookRunStepId(step: PlaybookStep, index: number): string {
  return step.id?.value ?? `step-${index + 1}`;
}

/** A cursor pointing at a workflow step, kinded by the step's gate role. */
export function playbookRunCursorForStep(step: PlaybookStep, index: number): PlaybookRunCursor {
  return {
    kind: step.role.value === "gate" ? "gate" : "step",
    id: playbookRunStepId(step, index),
  };
}

/**
 * The initial cursor for a fresh run (R-OP-2): the first sequentially
 * activated workflow step. Event-bound steps activate on their event, not by
 * cursor progression, and plain-form playbooks without a workflow contract
 * have no cursor.
 */
export function initialPlaybookRunCursor(model: PlaybookModel): PlaybookRunCursor | null {
  const steps = model.workflow?.steps ?? [];
  for (const [index, step] of steps.entries()) {
    if ((step.activation.value ?? "sequential") === "sequential") {
      return playbookRunCursorForStep(step, index);
    }
  }
  return null;
}

/** Seeds every workflow step at `pending` in declaration order (R-STATE-2). */
function seedStepStatuses(model: PlaybookModel): PlaybookRunStepStatusEntry[] {
  return (model.workflow?.steps ?? []).map((step, index) => ({
    stepId: playbookRunStepId(step, index),
    status: "pending",
  }));
}

/**
 * Records the declared dependency registry as an availability snapshot.
 * Availability probing lands with the progression operations; at creation the
 * snapshot carries the declared registry with `unknown` availability.
 */
function snapshotDependencyAvailability(
  model: PlaybookModel,
): PlaybookRunDependencyAvailability[] {
  return model.dependencies.entries.map((dependency) => ({
    id: dependency.id.value,
    kind: dependency.kind.value ?? dependency.kind.raw,
    requirement: dependency.requirement.value ?? dependency.requirement.raw,
    availability: "unknown",
  }));
}

function cursorFrom(currentStep: string | null, currentGate: string | null): PlaybookRunCursor | null {
  if (currentGate) {
    return { kind: "gate", id: currentGate };
  }
  if (currentStep) {
    return { kind: "step", id: currentStep };
  }
  return null;
}

/**
 * Nesting and parallelism guardrails at run creation (R-GUARD-1..2).
 *
 * A child run requires an open parent whose orchestration policy permits
 * child Playbooks; serial is the default. Parallel children additionally
 * require ALL of: explicit parent permission (`child_playbooks: parallel`),
 * parallel-execution support — a reviewed `harnessCapabilities` record with
 * `parallel_playbook_runs: true` consumed unchanged from the PRD 24 config
 * surface, or the explicit `parallel-children-reviewed` approval — and
 * output-surface claims proven disjoint from the parent and every sibling.
 * When any leg is missing the creation stops with guidance naming the serial
 * default, which is the "serialize or stop for review" branch of R-GUARD-2.
 */
function validateChildRunRequest(input: {
  executionMode: PlaybookRunExecutionMode;
  outputSurfaceClaims: string[];
  parent: PlaybookRunState | null;
  capabilitySnapshot: HarnessCapabilityEvaluation;
  parallelChildrenReviewed: boolean;
}): void {
  const { executionMode, outputSurfaceClaims, parent } = input;
  if (!parent) {
    return;
  }
  if (parent.terminalStatus) {
    throw new OperationError(
      `Parent run \`${parent.runId}\` is closed with terminal status \`${parent.terminalStatus}\`; ` +
        "a closed run cannot orchestrate new child playbook runs (R-GUARD-1).",
    );
  }
  if (parent.childPolicy === "none") {
    throw new OperationError(`Parent run \`${parent.runId}\` does not permit child playbooks.`);
  }
  if (executionMode === "parallel" && parent.childPolicy !== "parallel") {
    throw new OperationError(`Parent run \`${parent.runId}\` does not permit parallel child playbooks.`);
  }
  if (executionMode === "parallel") {
    const record = input.capabilitySnapshot.record;
    const capabilitySupport =
      record?.reviewStatus === "reviewed" && record.capabilities.parallel_playbook_runs === true;
    if (!capabilitySupport && !input.parallelChildrenReviewed) {
      throw new OperationError(
        "Parallel child playbook runs require parallel-execution support: a reviewed " +
          "`harnessCapabilities` record with `parallel_playbook_runs: true` in `.make-docs/config.yaml`, " +
          "or the explicit `parallel-children-reviewed` approval from the calling surface. " +
          "Start the child serially (the default) instead (R-GUARD-2).",
      );
    }
    const overlap = findOutputSurfaceOverlap(outputSurfaceClaims, [
      parent.outputSurfaceClaims,
      ...parent.childRuns.map((child) => child.outputSurfaceClaims),
    ].flat());
    if (overlap) {
      throw new OperationError(
        `Parallel child playbook output-surface claims overlap with an existing run: ${overlap[0]} and ${overlap[1]}.`,
      );
    }
  }
}

/**
 * Output-surface conflict guardrail at run creation (R-GUARD-3): the new
 * run's claims are checked against every other OPEN run of the project
 * outside its serial family — overlap stops the creation rather than risking
 * interleaved writes. The within-family checks for parallel children are
 * owned by {@link validateChildRunRequest}, which runs first.
 */
function requireCreationClaimsFree(input: {
  runId: string;
  parentRunId: string | null;
  executionMode: PlaybookRunExecutionMode;
  outputSurfaceClaims: string[];
  openRuns: PlaybookRunState[];
}): void {
  if (input.outputSurfaceClaims.length === 0) {
    return;
  }
  const family = playbookRunFamilyIds({
    runId: input.runId,
    parentRunId: input.parentRunId,
    executionMode: input.executionMode,
    runsById: new Map(input.openRuns.map((run) => [run.runId, run])),
  });
  for (const other of input.openRuns) {
    if (family.has(other.runId)) {
      continue;
    }
    const overlap = findOutputSurfaceOverlap(input.outputSurfaceClaims, other.outputSurfaceClaims);
    if (overlap) {
      throw new OperationError(
        `Run output-surface claim \`${overlap[0]}\` overlaps \`${overlap[1]}\` claimed by open run ` +
          `\`${other.runId}\`; the runner stops rather than interleaving writes (R-GUARD-3). ` +
          "Close the conflicting run or claim disjoint output surfaces.",
      );
    }
  }
}

/** Open (non-terminal) run records of the project, inside one store connection. */
function listOpenRunStates(db: StoreDatabase, projectId: string): PlaybookRunState[] {
  return listPlaybookRunRecords(db, projectId)
    .map((row) => row.record as unknown as PlaybookRunState)
    .filter((run) => !run.terminalStatus);
}

/**
 * The run identifiers a run does NOT execute concurrently with (W18 R7 P4;
 * recorded R-GUARD-3 implementer decision): the run itself plus its serial
 * ancestor chain. A serial child suspends the branch it belongs to, so an
 * overlap with a serial ancestor is the normal delegation pattern, not an
 * interleaving risk; a parallel run executes alongside its parent, so the
 * chain stops at the first parallel link. Open descendants and unrelated
 * open runs stay in the concurrent set — their overlapping claims stop the
 * runner.
 */
export function playbookRunFamilyIds(input: {
  runId: string;
  parentRunId: string | null;
  executionMode: PlaybookRunExecutionMode;
  runsById: Map<string, PlaybookRunState>;
}): Set<string> {
  const family = new Set<string>([input.runId]);
  let mode: PlaybookRunExecutionMode = input.executionMode;
  let parentId = input.parentRunId;
  while (parentId && mode === "serial" && !family.has(parentId)) {
    family.add(parentId);
    const parent = input.runsById.get(parentId);
    if (!parent) {
      break;
    }
    mode = parent.executionMode ?? "serial";
    parentId = parent.parentRunId;
  }
  return family;
}

export function findOutputSurfaceOverlap(
  proposedClaims: string[],
  existingClaims: string[],
): [string, string] | null {
  for (const proposed of proposedClaims) {
    for (const existing of existingClaims) {
      if (claimsOverlap(proposed, existing)) {
        return [proposed, existing];
      }
    }
  }
  return null;
}

function claimsOverlap(left: string, right: string): boolean {
  return left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`);
}

function mergeHints(base: string[], extra: string[]): string[] {
  const merged = [...base];
  for (const hint of extra) {
    if (hint && !merged.includes(hint)) {
      merged.push(hint);
    }
  }
  return merged;
}
