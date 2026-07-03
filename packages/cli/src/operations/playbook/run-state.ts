import path from "node:path";
import {
  PLAYBOOK_DEFAULT_WORKFLOW_ROUTING_MODE,
  PLAYBOOK_STEP_STATUSES,
  parseAndValidatePlaybook,
  type PlaybookModel,
  type PlaybookStepStatus,
  type PlaybookWorkflowRoutingMode,
} from "../../playbook";
import {
  createPlaybookRunRecord,
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
  evidenceRefs: string[];
  cursor: PlaybookRunCursor | null;
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
  const status = parseRunStatus(input.status ?? "pending");
  const now = utcNow();
  const storeRoot = resolveRunStoreRoot(input.storeRoot);

  return withStoreDatabase(storeRoot, (db) => {
    const parent = parentRunId ? readRunRecordOrThrow(db, projectId, parentRunId) : null;
    validateChildRunRequest({ executionMode, outputSurfaceClaims, parent });

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
      cursor: cursorFrom(input.currentStep ?? null, input.currentGate ?? null),
      childPolicy: entry.run.childPlaybooks,
      concurrencyPolicy: entry.run.concurrency,
      childRuns: [],
      resumeHints: input.resumeHints ?? [],
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
 * back to path-keyed state; the fuller three-tier degradation story is
 * W18 R7 Phase 4.
 */
function requireRunProjectId(repoRoot: string): string {
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

function resolveRunStoreRoot(storeRoot: string | undefined): string {
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

/** Seeds every workflow step at `pending` in declaration order (R-STATE-2). */
function seedStepStatuses(model: PlaybookModel): PlaybookRunStepStatusEntry[] {
  return (model.workflow?.steps ?? []).map((step, index) => ({
    stepId: step.id?.value ?? `step-${index + 1}`,
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

function validateChildRunRequest(input: {
  executionMode: PlaybookRunExecutionMode;
  outputSurfaceClaims: string[];
  parent: PlaybookRunState | null;
}): void {
  const { executionMode, outputSurfaceClaims, parent } = input;
  if (!parent) {
    return;
  }
  if (parent.childPolicy === "none") {
    throw new OperationError(`Parent run \`${parent.runId}\` does not permit child playbooks.`);
  }
  if (executionMode === "parallel" && parent.childPolicy !== "parallel") {
    throw new OperationError(`Parent run \`${parent.runId}\` does not permit parallel child playbooks.`);
  }
  if (executionMode === "parallel") {
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

function findOutputSurfaceOverlap(
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
