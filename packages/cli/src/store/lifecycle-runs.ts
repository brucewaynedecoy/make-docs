import { createHash } from "node:crypto";
import { OperationError, type JsonValue } from "../operations/types";
import {
  CURRENT_STORE_SCHEMA_VERSION,
  type StoreDatabase,
} from "./database";

export const LIFECYCLE_RUN_TYPES = ["lifecycle"] as const;
export type LifecycleRunType = (typeof LIFECYCLE_RUN_TYPES)[number];

export const LIFECYCLE_STAGES = [
  "design",
  "plan",
  "prd",
  "work",
  "implementation",
  "release",
  "archive",
  "retrospective",
] as const;
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export const LIFECYCLE_STATUSES = [
  "active",
  "paused",
  "completed",
  "failed",
  "abandoned",
] as const;
export type LifecycleStatus = (typeof LIFECYCLE_STATUSES)[number];

export const LIFECYCLE_MUTATION_OPERATIONS = [
  "lifecycle.start",
  "lifecycle.checkpoint",
  "lifecycle.pause",
  "lifecycle.resume",
  "lifecycle.attach-evidence",
  "lifecycle.complete",
  "lifecycle.fail",
  "lifecycle.abandon",
] as const;
export type LifecycleMutationOperation =
  (typeof LIFECYCLE_MUTATION_OPERATIONS)[number];

export type LifecycleMetadataValue = string | number | boolean | null;
export type LifecycleMetadata = Record<string, LifecycleMetadataValue>;

export interface LifecycleRunRow {
  projectId: string;
  runId: string;
  runType: LifecycleRunType;
  lifecycleStage: LifecycleStage;
  status: LifecycleStatus;
  checkpoint: string | null;
  version: number;
  metadata: LifecycleMetadata;
  startedAt: string;
  updatedAt: string;
  finishedAt: string | null;
}

export interface LifecycleEvidenceRow {
  projectId: string;
  runId: string;
  evidenceId: string;
  evidenceKind: string;
  referenceType: "project-path" | "external";
  reference: string;
  digest: string | null;
  recordedAt: string;
}

/** Exact minimal receipt accepted for W19 R1 P6. */
export interface LifecycleStoreMutationReceipt {
  schemaVersion: 1;
  receiptId: string;
  operation: LifecycleMutationOperation;
  projectId: string;
  runId: string;
  storeSchemaVersion: number;
  resultingVersion: number;
  committedAt: string;
}

export interface LifecycleStoreMutationResult {
  status: "captured";
  run: LifecycleRunRow;
  receipt: LifecycleStoreMutationReceipt;
}

export class LifecycleRunNotFoundError extends OperationError {
  readonly code = "lifecycle-run-not-found";

  constructor(projectId: string, runId: string) {
    super(`No lifecycle run \`${runId}\` exists for project \`${projectId}\`.`);
    this.name = "LifecycleRunNotFoundError";
  }
}

export class LifecycleRunExistsError extends OperationError {
  readonly code = "lifecycle-run-exists";

  constructor(projectId: string, runId: string) {
    super(`Lifecycle run \`${runId}\` already exists for project \`${projectId}\`.`);
    this.name = "LifecycleRunExistsError";
  }
}

export class LifecycleVersionConflictError extends OperationError {
  readonly code = "lifecycle-version-conflict";

  constructor(runId: string, expectedVersion: number, actualVersion: number) {
    super(
      `Lifecycle run \`${runId}\` is at version ${actualVersion}, not expected version ${expectedVersion}. ` +
        "Read the current run and retry with its explicit version.",
    );
    this.name = "LifecycleVersionConflictError";
  }
}

export function createLifecycleRun(
  db: StoreDatabase,
  input: {
    projectId: string;
    runId: string;
    lifecycleStage: LifecycleStage;
    checkpoint?: string | null;
    metadata?: LifecycleMetadata;
    committedAt: string;
  },
): LifecycleStoreMutationResult {
  return immediateTransaction(db, () => {
    try {
      db.prepare(
        `INSERT INTO runs (
          project_id, run_id, run_type, lifecycle_stage, status, checkpoint,
          version, metadata, started_at, updated_at, finished_at
        ) VALUES (?, ?, 'lifecycle', ?, 'active', ?, 1, ?, ?, ?, NULL)`,
      ).run(
        input.projectId,
        input.runId,
        input.lifecycleStage,
        input.checkpoint ?? null,
        JSON.stringify(input.metadata ?? {}),
        input.committedAt,
        input.committedAt,
      );
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new LifecycleRunExistsError(input.projectId, input.runId);
      }
      throw error;
    }
    const run = readLifecycleRunOrThrow(db, input.projectId, input.runId);
    return {
      status: "captured",
      run,
      receipt: createLifecycleStoreMutationReceipt({
        operation: "lifecycle.start",
        projectId: input.projectId,
        runId: input.runId,
        resultingVersion: run.version,
        committedAt: input.committedAt,
      }),
    };
  });
}

export function readLifecycleRun(
  db: StoreDatabase,
  projectId: string,
  runId: string,
): LifecycleRunRow | null {
  const row = db
    .prepare(
      `SELECT project_id, run_id, run_type, lifecycle_stage, status, checkpoint,
              version, metadata, started_at, updated_at, finished_at
       FROM runs WHERE project_id = ? AND run_id = ?`,
    )
    .get(projectId, runId) as Record<string, unknown> | undefined;
  return row ? toLifecycleRunRow(row) : null;
}

export function listLifecycleRuns(
  db: StoreDatabase,
  projectId: string,
): LifecycleRunRow[] {
  const rows = db
    .prepare(
      `SELECT project_id, run_id, run_type, lifecycle_stage, status, checkpoint,
              version, metadata, started_at, updated_at, finished_at
       FROM runs WHERE project_id = ? ORDER BY started_at, run_id`,
    )
    .all(projectId) as Array<Record<string, unknown>>;
  return rows.map(toLifecycleRunRow);
}

/**
 * Applies one caller-authorized state change with explicit optimistic
 * concurrency. The caller owns the legal transition matrix.
 */
export function transitionLifecycleRun(
  db: StoreDatabase,
  input: {
    operation: Exclude<LifecycleMutationOperation, "lifecycle.start" | "lifecycle.attach-evidence">;
    projectId: string;
    runId: string;
    expectedVersion: number;
    nextStatus: LifecycleStatus;
    lifecycleStage?: LifecycleStage;
    checkpoint?: string | null;
    metadata?: LifecycleMetadata;
    committedAt: string;
  },
): LifecycleStoreMutationResult {
  return immediateTransaction(db, () => {
    const current = readLifecycleRunOrThrow(db, input.projectId, input.runId);
    assertExpectedVersion(current, input.expectedVersion);
    const resultingVersion = current.version + 1;
    const finishedAt = isTerminalStatus(input.nextStatus) ? input.committedAt : null;
    const result = db.prepare(
      `UPDATE runs SET
         lifecycle_stage = ?, status = ?, checkpoint = ?, version = ?,
         metadata = ?, updated_at = ?, finished_at = ?
       WHERE project_id = ? AND run_id = ? AND version = ?`,
    ).run(
      input.lifecycleStage ?? current.lifecycleStage,
      input.nextStatus,
      input.checkpoint === undefined ? current.checkpoint : input.checkpoint,
      resultingVersion,
      JSON.stringify(input.metadata ?? current.metadata),
      input.committedAt,
      finishedAt,
      input.projectId,
      input.runId,
      input.expectedVersion,
    );
    if (Number(result.changes) !== 1) {
      const latest = readLifecycleRunOrThrow(db, input.projectId, input.runId);
      throw new LifecycleVersionConflictError(
        input.runId,
        input.expectedVersion,
        latest.version,
      );
    }
    const run = readLifecycleRunOrThrow(db, input.projectId, input.runId);
    return {
      status: "captured",
      run,
      receipt: createLifecycleStoreMutationReceipt({
        operation: input.operation,
        projectId: input.projectId,
        runId: input.runId,
        resultingVersion,
        committedAt: input.committedAt,
      }),
    };
  });
}

export function attachLifecycleEvidence(
  db: StoreDatabase,
  input: {
    projectId: string;
    runId: string;
    expectedVersion: number;
    evidenceId: string;
    evidenceKind: string;
    referenceType: "project-path" | "external";
    reference: string;
    digest?: string | null;
    committedAt: string;
  },
): LifecycleStoreMutationResult & { evidence: LifecycleEvidenceRow } {
  return immediateTransaction(db, () => {
    const current = readLifecycleRunOrThrow(db, input.projectId, input.runId);
    assertExpectedVersion(current, input.expectedVersion);
    try {
      db.prepare(
        `INSERT INTO run_evidence (
          project_id, run_id, evidence_id, evidence_kind, reference_type,
          reference_value, digest, recorded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        input.projectId,
        input.runId,
        input.evidenceId,
        input.evidenceKind,
        input.referenceType,
        input.reference,
        input.digest ?? null,
        input.committedAt,
      );
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new OperationError(
          `Evidence \`${input.evidenceId}\` already exists for lifecycle run \`${input.runId}\`.`,
        );
      }
      throw error;
    }
    const resultingVersion = current.version + 1;
    const updated = db.prepare(
      `UPDATE runs SET version = ?, updated_at = ?
       WHERE project_id = ? AND run_id = ? AND version = ?`,
    ).run(
      resultingVersion,
      input.committedAt,
      input.projectId,
      input.runId,
      input.expectedVersion,
    );
    if (Number(updated.changes) !== 1) {
      const latest = readLifecycleRunOrThrow(db, input.projectId, input.runId);
      throw new LifecycleVersionConflictError(
        input.runId,
        input.expectedVersion,
        latest.version,
      );
    }
    const run = readLifecycleRunOrThrow(db, input.projectId, input.runId);
    const evidence = readLifecycleEvidenceOrThrow(
      db,
      input.projectId,
      input.runId,
      input.evidenceId,
    );
    return {
      status: "captured",
      run,
      evidence,
      receipt: createLifecycleStoreMutationReceipt({
        operation: "lifecycle.attach-evidence",
        projectId: input.projectId,
        runId: input.runId,
        resultingVersion,
        committedAt: input.committedAt,
      }),
    };
  });
}

export function listLifecycleEvidence(
  db: StoreDatabase,
  projectId: string,
  runId: string,
): LifecycleEvidenceRow[] {
  const rows = db.prepare(
    `SELECT project_id, run_id, evidence_id, evidence_kind, reference_type,
            reference_value, digest, recorded_at
     FROM run_evidence WHERE project_id = ? AND run_id = ?
     ORDER BY recorded_at, evidence_id`,
  ).all(projectId, runId) as Array<Record<string, unknown>>;
  return rows.map(toLifecycleEvidenceRow);
}

export function createLifecycleStoreMutationReceipt(input: {
  operation: LifecycleMutationOperation;
  projectId: string;
  runId: string;
  resultingVersion: number;
  committedAt: string;
}): LifecycleStoreMutationReceipt {
  const subject = {
    schemaVersion: 1 as const,
    operation: input.operation,
    projectId: input.projectId,
    runId: input.runId,
    storeSchemaVersion: CURRENT_STORE_SCHEMA_VERSION,
    resultingVersion: input.resultingVersion,
    committedAt: input.committedAt,
  };
  return {
    schemaVersion: subject.schemaVersion,
    receiptId: `sha256:${createHash("sha256").update(stableJson(subject)).digest("hex")}`,
    operation: subject.operation,
    projectId: subject.projectId,
    runId: subject.runId,
    storeSchemaVersion: subject.storeSchemaVersion,
    resultingVersion: subject.resultingVersion,
    committedAt: subject.committedAt,
  };
}

function immediateTransaction<T>(db: StoreDatabase, apply: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = apply();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // SQLite can roll back an interrupted transaction before this handler runs.
    }
    throw error;
  }
}

function readLifecycleRunOrThrow(
  db: StoreDatabase,
  projectId: string,
  runId: string,
): LifecycleRunRow {
  const run = readLifecycleRun(db, projectId, runId);
  if (!run) throw new LifecycleRunNotFoundError(projectId, runId);
  return run;
}

function readLifecycleEvidenceOrThrow(
  db: StoreDatabase,
  projectId: string,
  runId: string,
  evidenceId: string,
): LifecycleEvidenceRow {
  const row = db.prepare(
    `SELECT project_id, run_id, evidence_id, evidence_kind, reference_type,
            reference_value, digest, recorded_at
     FROM run_evidence
     WHERE project_id = ? AND run_id = ? AND evidence_id = ?`,
  ).get(projectId, runId, evidenceId) as Record<string, unknown> | undefined;
  if (!row) {
    throw new OperationError(
      `Evidence \`${evidenceId}\` was not recorded for lifecycle run \`${runId}\`.`,
    );
  }
  return toLifecycleEvidenceRow(row);
}

function assertExpectedVersion(run: LifecycleRunRow, expectedVersion: number): void {
  if (run.version !== expectedVersion) {
    throw new LifecycleVersionConflictError(run.runId, expectedVersion, run.version);
  }
}

function toLifecycleRunRow(row: Record<string, unknown>): LifecycleRunRow {
  return {
    projectId: String(row.project_id),
    runId: String(row.run_id),
    runType: String(row.run_type) as LifecycleRunType,
    lifecycleStage: String(row.lifecycle_stage) as LifecycleStage,
    status: String(row.status) as LifecycleStatus,
    checkpoint: row.checkpoint === null ? null : String(row.checkpoint),
    version: Number(row.version),
    metadata: JSON.parse(String(row.metadata)) as LifecycleMetadata,
    startedAt: String(row.started_at),
    updatedAt: String(row.updated_at),
    finishedAt: row.finished_at === null ? null : String(row.finished_at),
  };
}

function toLifecycleEvidenceRow(row: Record<string, unknown>): LifecycleEvidenceRow {
  return {
    projectId: String(row.project_id),
    runId: String(row.run_id),
    evidenceId: String(row.evidence_id),
    evidenceKind: String(row.evidence_kind),
    referenceType: String(row.reference_type) as LifecycleEvidenceRow["referenceType"],
    reference: String(row.reference_value),
    digest: row.digest === null ? null : String(row.digest),
    recordedAt: String(row.recorded_at),
  };
}

function isTerminalStatus(status: LifecycleStatus): boolean {
  return status === "completed" || status === "failed" || status === "abandoned";
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Error && /UNIQUE constraint failed/i.test(error.message);
}

function stableJson(value: JsonValue | Record<string, unknown>): string {
  return JSON.stringify(sortJson(value));
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, sortJson(item)]),
    );
  }
  return value;
}
