import type { JsonValue } from "../operations/types";
import type { StoreDatabase } from "./database";
import {
  listWorkEvidence,
  upsertWorkEvidence,
  type WorkEvidenceRow,
} from "./state-rows";

/**
 * The unified project-state model (W18 R10 P3; PRD 38 R-PS-1 through R-PS-3).
 *
 * Project state is ONE model with TWO facets, both recorded decisions and
 * evidence for a unit of work, keyed by the manifest-minted project
 * identifier:
 *
 * - Playbook run-state (`playbook_runs`): the run records defined by the
 *   W18 R7 lineage. The storage seam is create / read / transition keyed by
 *   (project_id, run_id) — see `createPlaybookRunRecord`,
 *   `readPlaybookRunRecord`, and `transitionPlaybookRunRecord` in
 *   `state-rows.ts`. The record itself is opaque JSON: its shape, status
 *   vocabulary, and progression semantics are owned by PRD 35 and must not
 *   be defined here (R-SCOPE-1).
 * - Work-execution evidence (`work_evidence`): recorded sign-offs and
 *   decisions that cannot be re-derived from the repository or git,
 *   keyed to the canonical work-item identity below.
 *
 * Both facets live in the same SQLite database, on the same schema version
 * (`PRAGMA user_version`), behind the same append-only migration list
 * (`STORE_MIGRATIONS`), with the same identifier keying discipline. There is
 * deliberately no second store, second version counter, or parallel
 * vocabulary for either facet (R-PS-2).
 */

/**
 * Mirror-versus-relocated roles of the project-state tables (R-MIR-1,
 * R-MIR-2). This is the model-level encoding of the distinction:
 *
 * - `mirror`: the row is an index/cache of data whose canonical source lives
 *   in the repository (the project's `.make-docs/manifest.json`). Losing or
 *   rebuilding it loses nothing; authoritative reads must resolve to the
 *   manifest (see `registry-mirror.ts`).
 * - `relocated-canonical`: the row IS the data. Run-state and work-execution
 *   evidence have no in-repo copy anywhere; the store is their only home.
 */
export const PROJECT_STATE_TABLE_ROLES = {
  projects: "mirror",
  playbook_runs: "relocated-canonical",
  work_evidence: "relocated-canonical",
} as const;

export type ProjectStateTableRole =
  (typeof PROJECT_STATE_TABLE_ROLES)[keyof typeof PROJECT_STATE_TABLE_ROLES];

/**
 * Canonical work-item identity (R-PS-3): resolved repo root, wave slug, and
 * repo-relative phase path, exactly as produced by the retained work-item
 * identity resolver (`resolveWaveTarget` in the work operations domain; its
 * CLI surfacing is owned by the W18 R11 reorganization lineage). The store
 * records evidence AGAINST this identity and never re-derives it — these
 * functions accept the tuple verbatim and store it verbatim.
 *
 * `repoRoot` is carried as secondary lookup metadata only; the row key is the
 * project identifier plus (waveSlug, phasePath) (R-ID-2).
 */
export interface WorkItemIdentity {
  /** Resolved repository root (secondary metadata, never part of the key). */
  repoRoot: string;
  /** Wave directory slug under `docs/work/`. */
  waveSlug: string;
  /** Repo-relative phase document path. */
  phasePath: string;
}

/**
 * Records one work-execution evidence entry against a caller-supplied
 * canonical work-item identity. The evidence kind and payload are the
 * caller's vocabulary (the lifecycle checkpoint mapping lives with the
 * lifecycle operations); the store treats the payload as opaque JSON.
 */
export function recordWorkEvidence(
  db: StoreDatabase,
  input: {
    projectId: string;
    identity: WorkItemIdentity;
    evidenceKind: string;
    payload: JsonValue;
    now?: string;
  },
): void {
  upsertWorkEvidence(db, {
    projectId: input.projectId,
    waveSlug: input.identity.waveSlug,
    phasePath: input.identity.phasePath,
    evidenceKind: input.evidenceKind,
    payload: input.payload,
    repoRoot: input.identity.repoRoot,
    now: input.now,
  });
}

/** Reads every evidence row recorded against one canonical work-item identity. */
export function readWorkItemEvidence(
  db: StoreDatabase,
  input: { projectId: string; identity: Pick<WorkItemIdentity, "waveSlug" | "phasePath"> },
): WorkEvidenceRow[] {
  return listWorkEvidence(db, {
    projectId: input.projectId,
    waveSlug: input.identity.waveSlug,
    phasePath: input.identity.phasePath,
  });
}

/** Reads every evidence row recorded for one wave of a project. */
export function listWaveEvidence(
  db: StoreDatabase,
  input: { projectId: string; waveSlug: string },
): WorkEvidenceRow[] {
  return listWorkEvidence(db, {
    projectId: input.projectId,
    waveSlug: input.waveSlug,
  });
}
