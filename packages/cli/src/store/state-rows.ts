import type { JsonValue } from "../operations/types";
import type { StoreDatabase } from "./database";

/**
 * Row-level primitives over the operational schema. This is the storage seam
 * consumed by later phases and by downstream lineages: the stable-project-
 * identity phase (W18 R10 P2), the unified project-state model (P3), the
 * W18 R7 runner's run-state storage, and the retained work-execution evidence
 * operations (W18 R11).
 *
 * Every project-scoped row is keyed by the manifest-minted project identifier
 * supplied by the caller (R-ID-1); this module never derives identity from a
 * path (R-ID-2) and stores run records and evidence payloads as opaque JSON so
 * the record shapes stay owned by their own lineages (R-SCOPE-1).
 */

export interface ProjectRegistryEntry {
  projectId: string;
  rootPath: string;
  packageName: string | null;
  packageVersion: string | null;
  registeredAt: string;
  lastSeenAt: string;
}

export interface PlaybookRunRow {
  projectId: string;
  runId: string;
  record: JsonValue;
  createdAt: string;
  updatedAt: string;
}

export interface WorkEvidenceRow {
  projectId: string;
  waveSlug: string;
  phasePath: string;
  evidenceKind: string;
  payload: JsonValue;
  repoRoot: string | null;
  recordedAt: string;
}

/**
 * Inserts or refreshes an install-registry mirror row (R-MIR-1). The
 * canonical install record remains the project's `.make-docs/manifest.json`.
 */
export function upsertProjectRegistryEntry(
  db: StoreDatabase,
  entry: {
    projectId: string;
    rootPath: string;
    packageName?: string | null;
    packageVersion?: string | null;
    now?: string;
  },
): void {
  const now = entry.now ?? new Date().toISOString();
  db.prepare(
    `INSERT INTO projects (project_id, root_path, package_name, package_version, registered_at, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (project_id) DO UPDATE SET
       root_path = excluded.root_path,
       package_name = excluded.package_name,
       package_version = excluded.package_version,
       last_seen_at = excluded.last_seen_at`,
  ).run(
    entry.projectId,
    entry.rootPath,
    entry.packageName ?? null,
    entry.packageVersion ?? null,
    now,
    now,
  );
}

export function readProjectRegistryEntry(
  db: StoreDatabase,
  projectId: string,
): ProjectRegistryEntry | null {
  const row = db
    .prepare(
      `SELECT project_id, root_path, package_name, package_version, registered_at, last_seen_at
       FROM projects WHERE project_id = ?`,
    )
    .get(projectId) as Record<string, unknown> | undefined;
  return row ? toProjectRegistryEntry(row) : null;
}

export function listProjectRegistryEntries(db: StoreDatabase): ProjectRegistryEntry[] {
  const rows = db
    .prepare(
      `SELECT project_id, root_path, package_name, package_version, registered_at, last_seen_at
       FROM projects ORDER BY project_id`,
    )
    .all() as Array<Record<string, unknown>>;
  return rows.map(toProjectRegistryEntry);
}

/** Thrown when `createPlaybookRunRecord` collides with an existing run row. */
export class PlaybookRunExistsError extends Error {
  constructor(projectId: string, runId: string) {
    super(
      `A Playbook run record already exists for project ${projectId} and run ${runId}. ` +
        "Use transitionPlaybookRunRecord to update an existing run.",
    );
    this.name = "PlaybookRunExistsError";
  }
}

/** Thrown when `transitionPlaybookRunRecord` targets a run row that does not exist. */
export class PlaybookRunNotFoundError extends Error {
  constructor(projectId: string, runId: string) {
    super(
      `No Playbook run record exists for project ${projectId} and run ${runId}. ` +
        "Use createPlaybookRunRecord to create a run before transitioning it.",
    );
    this.name = "PlaybookRunNotFoundError";
  }
}

/**
 * Creates a Playbook run-state record (W18 R10 P3, t2). This is the create
 * half of the storage seam PRD 35's R-STORE-1/R-STORE-2 consume: keyed by
 * (project identifier, run identifier), record stored as opaque JSON. The
 * record shape and progression semantics stay owned by the W18 R7 lineage
 * (R-SCOPE-1); this seam only guarantees create-versus-transition integrity
 * at the storage level. Fails explicitly when the run already exists.
 */
export function createPlaybookRunRecord(
  db: StoreDatabase,
  input: { projectId: string; runId: string; record: JsonValue; now?: string },
): void {
  const now = input.now ?? new Date().toISOString();
  try {
    db.prepare(
      `INSERT INTO playbook_runs (project_id, run_id, record, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(input.projectId, input.runId, JSON.stringify(input.record), now, now);
  } catch (error) {
    if (error instanceof Error && /UNIQUE constraint failed/i.test(error.message)) {
      throw new PlaybookRunExistsError(input.projectId, input.runId);
    }
    throw error;
  }
}

/**
 * Transitions (replaces) an existing Playbook run-state record. The new
 * record is opaque to the store — what a valid transition IS (statuses,
 * cursors, gates) is the W18 R7 runner's business; storage only guarantees
 * the run exists and the write is atomic. Fails explicitly when the run does
 * not exist so a transition can never silently create state.
 */
export function transitionPlaybookRunRecord(
  db: StoreDatabase,
  input: { projectId: string; runId: string; record: JsonValue; now?: string },
): void {
  const now = input.now ?? new Date().toISOString();
  const result = db
    .prepare(
      `UPDATE playbook_runs SET record = ?, updated_at = ?
       WHERE project_id = ? AND run_id = ?`,
    )
    .run(JSON.stringify(input.record), now, input.projectId, input.runId);
  if (Number(result.changes) === 0) {
    throw new PlaybookRunNotFoundError(input.projectId, input.runId);
  }
}

/** Lists a project's Playbook run-state records (records stay opaque JSON). */
export function listPlaybookRunRecords(
  db: StoreDatabase,
  projectId: string,
): PlaybookRunRow[] {
  const rows = db
    .prepare(
      `SELECT project_id, run_id, record, created_at, updated_at
       FROM playbook_runs WHERE project_id = ? ORDER BY run_id`,
    )
    .all(projectId) as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    projectId: String(row.project_id),
    runId: String(row.run_id),
    record: JSON.parse(String(row.record)) as JsonValue,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
}

/** Writes a Playbook run-state record (opaque JSON payload; shape owned by W18 R7). */
export function upsertPlaybookRunRecord(
  db: StoreDatabase,
  input: { projectId: string; runId: string; record: JsonValue; now?: string },
): void {
  const now = input.now ?? new Date().toISOString();
  db.prepare(
    `INSERT INTO playbook_runs (project_id, run_id, record, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (project_id, run_id) DO UPDATE SET
       record = excluded.record,
       updated_at = excluded.updated_at`,
  ).run(input.projectId, input.runId, JSON.stringify(input.record), now, now);
}

export function readPlaybookRunRecord(
  db: StoreDatabase,
  projectId: string,
  runId: string,
): PlaybookRunRow | null {
  const row = db
    .prepare(
      `SELECT project_id, run_id, record, created_at, updated_at
       FROM playbook_runs WHERE project_id = ? AND run_id = ?`,
    )
    .get(projectId, runId) as Record<string, unknown> | undefined;
  if (!row) {
    return null;
  }
  return {
    projectId: String(row.project_id),
    runId: String(row.run_id),
    record: JSON.parse(String(row.record)) as JsonValue,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

/**
 * Records a work-execution evidence entry against the canonical work-item
 * identity components supplied by the caller (R-PS-3).
 */
export function upsertWorkEvidence(
  db: StoreDatabase,
  input: {
    projectId: string;
    waveSlug: string;
    phasePath: string;
    evidenceKind: string;
    payload: JsonValue;
    repoRoot?: string | null;
    now?: string;
  },
): void {
  const now = input.now ?? new Date().toISOString();
  db.prepare(
    `INSERT INTO work_evidence (project_id, wave_slug, phase_path, evidence_kind, payload, repo_root, recorded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (project_id, wave_slug, phase_path, evidence_kind) DO UPDATE SET
       payload = excluded.payload,
       repo_root = excluded.repo_root,
       recorded_at = excluded.recorded_at`,
  ).run(
    input.projectId,
    input.waveSlug,
    input.phasePath,
    input.evidenceKind,
    JSON.stringify(input.payload),
    input.repoRoot ?? null,
    now,
  );
}

export function listWorkEvidence(
  db: StoreDatabase,
  filter: { projectId: string; waveSlug?: string; phasePath?: string },
): WorkEvidenceRow[] {
  const clauses = ["project_id = ?"];
  const params: string[] = [filter.projectId];
  if (filter.waveSlug !== undefined) {
    clauses.push("wave_slug = ?");
    params.push(filter.waveSlug);
  }
  if (filter.phasePath !== undefined) {
    clauses.push("phase_path = ?");
    params.push(filter.phasePath);
  }
  const rows = db
    .prepare(
      `SELECT project_id, wave_slug, phase_path, evidence_kind, payload, repo_root, recorded_at
       FROM work_evidence WHERE ${clauses.join(" AND ")}
       ORDER BY wave_slug, phase_path, evidence_kind`,
    )
    .all(...params) as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    projectId: String(row.project_id),
    waveSlug: String(row.wave_slug),
    phasePath: String(row.phase_path),
    evidenceKind: String(row.evidence_kind),
    payload: JSON.parse(String(row.payload)) as JsonValue,
    repoRoot: row.repo_root === null ? null : String(row.repo_root),
    recordedAt: String(row.recorded_at),
  }));
}

/**
 * Removes current rows keyed by the given project identifier inside one
 * transaction. Opaque legacy `playbook_runs` rows are deliberately excluded
 * from this current-state pruning seam (PRD 38 R-PS-6 / R-LIFE-2).
 */
export function deleteProjectRows(db: StoreDatabase, projectId: string): void {
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("DELETE FROM run_evidence WHERE project_id = ?").run(projectId);
    db.prepare("DELETE FROM runs WHERE project_id = ?").run(projectId);
    db.prepare("DELETE FROM work_evidence WHERE project_id = ?").run(projectId);
    db.prepare("DELETE FROM playbook_runs WHERE project_id = ?").run(projectId);
    db.prepare("DELETE FROM projects WHERE project_id = ?").run(projectId);
    db.exec("COMMIT");
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // The transaction may already be rolled back.
    }
    throw error;
  }
}

function toProjectRegistryEntry(row: Record<string, unknown>): ProjectRegistryEntry {
  return {
    projectId: String(row.project_id),
    rootPath: String(row.root_path),
    packageName: row.package_name === null ? null : String(row.package_name),
    packageVersion: row.package_version === null ? null : String(row.package_version),
    registeredAt: String(row.registered_at),
    lastSeenAt: String(row.last_seen_at),
  };
}
