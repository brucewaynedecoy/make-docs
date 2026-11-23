import { createHash, randomUUID } from "node:crypto";
import { OperationError } from "../operations/types";
import { WORK_CLAIM_POLICY } from "../operations/work/work-store/catalog";
import {
  WORK_PARENT_KINDS,
  WorkAddRequestSchema,
  WorkClaimRecordSchema,
  WorkClaimRequestSchema,
  WorkReleaseRequestSchema,
  WorkSyncConflictRecordSchema,
  WorkSyncLedgerEntrySchema,
  WorkUnitRecordSchema,
  type WorkAddRequest,
  type WorkClaimRecord,
  type WorkClaimRefusal,
  type WorkClaimRequest,
  type WorkHandleObservation,
  type WorkReleaseRequest,
  type WorkSyncConflictRecord,
  type WorkSyncLedgerEntry,
  type WorkUnitKind,
  type WorkUnitRecord,
  type WorkUpdateRefusal,
} from "../operations/work/work-store/schemas";
import { StoreCheckpoint9StateError, classifyStoreCheckpoint9State, type StoreDatabase } from "./database";
import {
  InstallationStateError,
  STORE_LEGACY_SCHEMA_NEXT_ACTION,
  canonicalInstallationPath,
  readDeclarativeProjectId,
  validateInstallationStoreRoot,
  withInstallationDatabase,
  withStoreReadOnlyDatabase,
} from "./installation-state";
import { resolveStoreRoot } from "./paths";
import { readProjectRegisterRow, recordProjectInRegister } from "./project-register";

/**
 * W29 R0 P2 work store service (PRD 52 R-WORK-STORE-11, R-WORK-QUEUE-1 to
 * R-WORK-QUEUE-10 and R-WORK-QUEUE-14; PRD 38 R-REGISTER-2).
 *
 * This is the only code that reads and writes the schema v8 work store
 * tables (`work-store-schema.ts`). Every write carries an expected version:
 * the unit's record revision for units and claims, and the entry version for
 * the sync ledger and sync conflicts. A write whose expected version does not
 * match is refused, and nothing changes. Each write is atomic: inside a
 * caller's transaction it is a savepoint, and alone it is its own transaction.
 *
 * Projects resolve by name or project ID only through `project_register`
 * (R-REGISTER-2). Work writes need the project's register row, which
 * {@link writeWorkStore} records in the same transaction.
 *
 * The service enforces the rules that the tables own: one claim row for each
 * unit, claim expiry, renewal, takeover after a handle check, and the claim
 * rules of ancestors and descendants. Readiness (R-WORK-QUEUE-4, and the
 * `not-ready` claim refusal of R-WORK-QUEUE-17) is the work queue's rule in
 * W29 R0 P4. This phase adds no public operation.
 */

export const WORK_STORE_REFUSALS = [
  "version-conflict",
  "invalid-record",
  "unit-not-found",
  "project-not-registered",
  "project-not-identified",
  "project-mismatch",
  "not-claim-holder",
  "claim-expired",
  "unit-in-use",
  "checkout-not-bound",
  "handle-check-needed",
  "previous-holder-still-working",
  "project-still-registered",
  "export-proof-stale",
  "claim-live",
] as const;
export type WorkStoreRefusal = (typeof WORK_STORE_REFUSALS)[number];

/** Typed refusal of a work store write. Nothing changed. */
export class WorkStoreRefusalError extends OperationError {
  readonly code = "work-store-refused";
  constructor(
    readonly refusal: WorkStoreRefusal,
    readonly reason: string,
    readonly nextAction: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(`${reason} Make Docs refused this work store write, and nothing changed. ${nextAction}`);
    this.name = "WorkStoreRefusalError";
  }
}

function refuse(refusal: WorkStoreRefusal, reason: string, nextAction: string, details: Record<string, unknown> = {}): never {
  throw new WorkStoreRefusalError(refusal, reason, nextAction, details);
}

const RE_READ = "Read the record again, then retry the write with its current version.";

/* ------------------------------------------------------------------------ */
/* Transactions                                                             */
/* ------------------------------------------------------------------------ */

let savepointCounter = 0;

/**
 * Run `fn` atomically. Inside an open transaction it is a savepoint, so a
 * refusal undoes only this write. Alone it is its own transaction. Deferred
 * foreign keys are checked when the outermost transaction ends.
 */
function atomic<T>(db: StoreDatabase, fn: () => T): T {
  const name = `work_store_${++savepointCounter}`;
  db.exec(`SAVEPOINT ${name}`);
  try {
    const result = fn();
    db.exec(`RELEASE ${name}`);
    return result;
  } catch (error) {
    try {
      db.exec(`ROLLBACK TO ${name}`);
      db.exec(`RELEASE ${name}`);
    } catch {
      // The savepoint may already be gone.
    }
    throw error;
  }
}

function changes(result: { changes?: number | bigint }): number {
  return Number(result.changes ?? 0);
}

/* ------------------------------------------------------------------------ */
/* Store access                                                             */
/* ------------------------------------------------------------------------ */

/** One project that the Store knows, from `project_register`. */
export interface WorkStoreProject {
  projectId: string;
  projectName: string | null;
}

export const WORK_STORE_ABSENT_NEXT_ACTION = "Run make-docs setup to create the Store, then run this command again.";

/**
 * Refuse a Store that the work store cannot use, with the existing typed
 * results: an absent Store or a supported older schema is `store-unavailable`
 * with its one next action, and a corrupt, unknown, newer, or changed Store
 * is the Store state error that the operation boundary reports as
 * `store-unsafe`. Reads never migrate the Store.
 */
function assertWorkStoreUsable(storeRoot: string): void {
  const classification = classifyStoreCheckpoint9State(storeRoot);
  if (classification.state === "supported-current") return;
  if (classification.state === "absent") {
    throw new InstallationStateError(
      "store-unavailable",
      `The Store is absent, so it has no work store. No project files changed. ${WORK_STORE_ABSENT_NEXT_ACTION}`,
      undefined,
      WORK_STORE_ABSENT_NEXT_ACTION,
    );
  }
  if (classification.state === "supported-legacy") {
    throw new InstallationStateError(
      "store-unavailable",
      `The Store uses supported legacy schema ${classification.schemaVersion}, which has no work store tables. No project files changed. ${STORE_LEGACY_SCHEMA_NEXT_ACTION}`,
      undefined,
      STORE_LEGACY_SCHEMA_NEXT_ACTION,
    );
  }
  throw new StoreCheckpoint9StateError(classification);
}

/**
 * The project that {@link writeWorkStore} opened on each connection. Every
 * write on that connection must belong to it, so one project's write session
 * never changes another project's work.
 */
const openedProjects = new WeakMap<StoreDatabase, string>();

function assertOpenedProject(db: StoreDatabase, projectId: string): void {
  const opened = openedProjects.get(db);
  if (opened !== undefined && opened !== projectId) {
    refuse(
      "project-mismatch",
      `This write session is for project ${opened}, but the record belongs to project ${projectId}.`,
      "Open a write session for that project instead.",
      { openedProjectId: opened, projectId },
    );
  }
}

/**
 * Read the work store with no project folder, for a project resource URI
 * (PRD 52 R-WORK-URI-1, R-WORK-URI-5). It opens one read-only Store session.
 * It never creates or migrates a Store, and an unusable Store gives the same
 * typed result as {@link readWorkStore}.
 */
export function readWorkStoreAt<T>(storeRoot: string, fn: (db: StoreDatabase) => T): T {
  const store = canonicalInstallationPath(storeRoot);
  assertWorkStoreUsable(store);
  return withStoreReadOnlyDatabase(store, fn);
}

/** Read the work store of a project's Store. It never creates or migrates a Store. */
export function readWorkStore<T>(projectRoot: string, fn: (db: StoreDatabase) => T, options: { storeRoot?: string } = {}): T {
  const root = canonicalInstallationPath(projectRoot);
  const store = validateInstallationStoreRoot(root, options.storeRoot ?? resolveStoreRoot());
  assertWorkStoreUsable(store);
  return withInstallationDatabase(root, (db) => fn(db), { storeRoot: store, readOnly: true });
}

/**
 * Write the work store of the project at `projectRoot` in one transaction.
 * The project needs a `projectId` in its config. Its `project_register` row
 * is recorded first, in the same transaction (R-REGISTER-1), so a refused
 * name leaves no row. It never creates or migrates a Store.
 */
export function writeWorkStore<T>(
  projectRoot: string,
  fn: (db: StoreDatabase, project: WorkStoreProject) => T,
  options: { storeRoot?: string; now?: Date } = {},
): T {
  const root = canonicalInstallationPath(projectRoot);
  const store = validateInstallationStoreRoot(root, options.storeRoot ?? resolveStoreRoot());
  assertWorkStoreUsable(store);
  const projectId = readDeclarativeProjectId(root);
  if (!projectId) {
    refuse("project-not-identified", "The project has no projectId in .make-docs/config.yaml.", "Run make-docs setup in this project first.");
  }
  return withInstallationDatabase(root, (db) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      const row = recordProjectInRegister(db, { projectId, projectRoot: root, now: options.now?.toISOString() });
      openedProjects.set(db, row.projectId);
      const result = fn(db, { projectId: row.projectId, projectName: row.projectName });
      openedProjects.delete(db);
      db.exec("COMMIT");
      return result;
    } catch (error) {
      openedProjects.delete(db);
      try {
        db.exec("ROLLBACK");
      } catch {
        // The transaction may already be closed.
      }
      throw error;
    }
  }, { storeRoot: store });
}

/* ------------------------------------------------------------------------ */
/* Projects (T9)                                                            */
/* ------------------------------------------------------------------------ */

export type WorkProjectReference = string | { kind: "name" | "id"; value: string };

/**
 * Resolve a project by name or project ID through `project_register` only
 * (PRD 38 R-REGISTER-2, PRD 52 R-WORK-URI-1). A name resolves to the project
 * that holds it now, so a renamed project resolves only by its new name. A
 * reference that is not a name resolves as a project ID. Register writes
 * refuse a name that is another project's ID, so the two never clash.
 */
export function resolveWorkProject(db: StoreDatabase, reference: WorkProjectReference): WorkStoreProject | null {
  const ref = typeof reference === "string" ? { kind: "name" as const, value: reference } : reference;
  const byName = ref.kind === "name"
    ? db.prepare("SELECT project_id, project_name FROM project_register WHERE project_name = ?").get(ref.value) as
      | { project_id: string; project_name: string | null }
      | undefined
    : undefined;
  const row = byName ?? db.prepare("SELECT project_id, project_name FROM project_register WHERE project_id = ?").get(ref.value) as
    | { project_id: string; project_name: string | null }
    | undefined;
  return row ? { projectId: row.project_id, projectName: row.project_name } : null;
}

function assertProjectRegistered(db: StoreDatabase, projectId: string): void {
  if (!readProjectRegisterRow(db, projectId)) {
    refuse(
      "project-not-registered",
      `Project ${projectId} has no row in the project register.`,
      "Write work through writeWorkStore, which records the project first.",
      { projectId },
    );
  }
}

/* ------------------------------------------------------------------------ */
/* Units, dependencies, and links (T5)                                      */
/* ------------------------------------------------------------------------ */

interface UnitRow {
  project_id: string;
  store_id: string;
  kind: string;
  coordinate: string;
  parent_store_id: string | null;
  title: string;
  body: string | null;
  recorded_status: string | null;
  status: string;
  close_outcome: string | null;
  unresolved_dependencies_json: string;
  gates_json: string;
  blockers_json: string;
  source_path: string | null;
  copy_state: string;
  revision: number | bigint;
}

interface DependencyRow {
  unit_store_id: string;
  depends_on_store_id: string;
  source_text: string;
  source_path: string | null;
  source_line: number | bigint | null;
}

interface LinkRow {
  unit_store_id: string;
  direction: string;
  kind: string;
  path: string;
  anchor: string | null;
}

const UNIT_COLUMNS = "project_id, store_id, kind, coordinate, parent_store_id, title, body, recorded_status, status, close_outcome, unresolved_dependencies_json, gates_json, blockers_json, source_path, copy_state, revision";

function toUnit(row: UnitRow, dependencies: readonly DependencyRow[], links: readonly LinkRow[]): WorkUnitRecord {
  return WorkUnitRecordSchema.parse({
    projectId: row.project_id,
    storeId: row.store_id,
    kind: row.kind,
    coordinate: row.coordinate,
    parentStoreId: row.parent_store_id,
    title: row.title,
    body: row.body,
    recordedStatus: row.recorded_status,
    status: row.status,
    closeOutcome: row.close_outcome,
    dependencies: dependencies.map((dependency) => ({
      dependsOnStoreId: dependency.depends_on_store_id,
      sourceText: dependency.source_text,
      source: dependency.source_path === null
        ? null
        : { path: dependency.source_path, line: dependency.source_line === null ? null : Number(dependency.source_line) },
    })),
    unresolvedDependencies: JSON.parse(row.unresolved_dependencies_json),
    gates: JSON.parse(row.gates_json),
    blockers: JSON.parse(row.blockers_json),
    links: links.map((link) => ({ direction: link.direction, kind: link.kind, path: link.path, anchor: link.anchor })),
    sourcePath: row.source_path,
    copyState: row.copy_state,
    revision: Number(row.revision),
  });
}

function unitRow(db: StoreDatabase, storeId: string): UnitRow | undefined {
  return db.prepare(`SELECT ${UNIT_COLUMNS} FROM work_units WHERE store_id = ?`).get(storeId) as UnitRow | undefined;
}

function dependencyRows(db: StoreDatabase, storeId: string): DependencyRow[] {
  return db.prepare(
    "SELECT unit_store_id, depends_on_store_id, source_text, source_path, source_line FROM work_dependencies WHERE unit_store_id = ? ORDER BY ordinal",
  ).all(storeId) as unknown as DependencyRow[];
}

function linkRows(db: StoreDatabase, storeId: string): LinkRow[] {
  return db.prepare(
    "SELECT unit_store_id, direction, kind, path, anchor FROM work_links WHERE unit_store_id = ? ORDER BY ordinal",
  ).all(storeId) as unknown as LinkRow[];
}

export function readWorkUnit(db: StoreDatabase, storeId: string): WorkUnitRecord | null {
  const row = unitRow(db, storeId);
  return row ? toUnit(row, dependencyRows(db, storeId), linkRows(db, storeId)) : null;
}

export function findWorkUnitByCoordinate(db: StoreDatabase, projectId: string, coordinate: string): WorkUnitRecord | null {
  const row = db.prepare(`SELECT ${UNIT_COLUMNS} FROM work_units WHERE project_id = ? AND coordinate = ?`).get(projectId, coordinate) as
    | UnitRow
    | undefined;
  return row ? toUnit(row, dependencyRows(db, row.store_id), linkRows(db, row.store_id)) : null;
}

/** Every unit of one project, ordered by coordinate text, with its dependencies and links. */
export function listWorkUnits(db: StoreDatabase, projectId: string): WorkUnitRecord[] {
  const rows = db.prepare(`SELECT ${UNIT_COLUMNS} FROM work_units WHERE project_id = ? ORDER BY coordinate, store_id`).all(projectId) as unknown as UnitRow[];
  const dependencies = new Map<string, DependencyRow[]>();
  for (const row of db.prepare(
    "SELECT unit_store_id, depends_on_store_id, source_text, source_path, source_line FROM work_dependencies WHERE project_id = ? ORDER BY unit_store_id, ordinal",
  ).all(projectId) as unknown as DependencyRow[]) {
    dependencies.set(row.unit_store_id, [...(dependencies.get(row.unit_store_id) ?? []), row]);
  }
  const links = new Map<string, LinkRow[]>();
  for (const row of db.prepare(
    `SELECT l.unit_store_id, l.direction, l.kind, l.path, l.anchor
       FROM work_links l JOIN work_units u ON u.store_id = l.unit_store_id
      WHERE u.project_id = ? ORDER BY l.unit_store_id, l.ordinal`,
  ).all(projectId) as unknown as LinkRow[]) {
    links.set(row.unit_store_id, [...(links.get(row.unit_store_id) ?? []), row]);
  }
  return rows.map((row) => toUnit(row, dependencies.get(row.store_id) ?? [], links.get(row.store_id) ?? []));
}

export type WorkUnitInput = Omit<WorkUnitRecord, "revision">;

/**
 * Create or replace one unit with its dependencies and links.
 *
 * `expectedVersion` is null to create a unit that must not exist yet, or the
 * unit's current record revision to replace it. The written unit has the next
 * revision. The parent must exist in the same project with a kind that
 * PRD 52 allows. Dependencies may point to units that the same transaction
 * writes later, because their foreign keys are checked at commit. A unit that
 * closes loses its claim (R-WORK-QUEUE-9), and a close follows the claim rule
 * of a report: a unit with a live claim closes only through `claimId` of its
 * holder (R-WORK-QUEUE-8). Inside {@link writeWorkStore}, the unit must belong
 * to the project that the session opened.
 */
export function putWorkUnit(
  db: StoreDatabase,
  unit: WorkUnitInput,
  options: { expectedVersion: number | null; claimId?: string | null; handleObservation?: WorkHandleObservation | null; now?: Date },
): WorkUnitRecord {
  return atomic(db, () => {
    const revision = (options.expectedVersion ?? 0) + 1;
    const parsed = WorkUnitRecordSchema.safeParse({ ...unit, revision });
    if (!parsed.success) {
      refuse("invalid-record", `The work unit does not match the record contract: ${parsed.error.issues.map((issue) => `${issue.path.join(".") || "unit"}: ${issue.message}`).join("; ")}.`, "Correct the unit and write it again.");
    }
    const record = parsed.data;
    assertOpenedProject(db, record.projectId);
    assertProjectRegistered(db, record.projectId);
    const current = unitRow(db, record.storeId);
    if (options.expectedVersion === null && current) {
      refuse("version-conflict", `Work unit ${record.storeId} already exists at revision ${Number(current.revision)}.`, RE_READ, { storeId: record.storeId, currentVersion: Number(current.revision) });
    }
    if (options.expectedVersion !== null) {
      if (!current) refuse("unit-not-found", `Work unit ${record.storeId} does not exist.`, RE_READ, { storeId: record.storeId });
      if (Number(current.revision) !== options.expectedVersion) {
        refuse("version-conflict", `Work unit ${record.storeId} is at revision ${Number(current.revision)}, not ${options.expectedVersion}.`, RE_READ, { storeId: record.storeId, currentVersion: Number(current.revision) });
      }
      if (current.project_id !== record.projectId || current.kind !== record.kind) {
        refuse("invalid-record", `Work unit ${record.storeId} cannot move to another project or change its kind.`, "Write a new unit instead.", { storeId: record.storeId });
      }
    }
    if (record.status === "closed" && current && current.status !== "closed") {
      const claimRefusal = checkWorkUnitWriteClaim(db, record.storeId, options.claimId ?? null, options.now ?? new Date(), {
        closing: true,
        handleObservation: options.handleObservation ?? null,
      });
      if (claimRefusal) {
        refuse(
          claimRefusal,
          claimRefusal === "claim-expired"
            ? `The claim on work unit ${record.storeId} has expired, so it cannot close the unit.`
            : claimRefusal === "not-claim-holder"
              ? `Work unit ${record.storeId} has a live claim that this write does not hold.`
              : `Work unit ${record.storeId} has an expired claim, and closing it needs the handle check of its task.`,
          "Close it through the claim holder, or check the old task handle first.",
          { storeId: record.storeId, claimRefusal },
        );
      }
    }
    if (record.parentStoreId !== null) {
      const parent = unitRow(db, record.parentStoreId);
      const allowed = WORK_PARENT_KINDS[record.kind];
      if (!parent || parent.project_id !== record.projectId || !allowed.includes(parent.kind as WorkUnitKind)) {
        refuse("invalid-record", `A ${record.kind} needs a ${allowed.join(" or ")} parent in the same project, and ${record.parentStoreId} is not one.`, "Write the parent first, or correct the parent.", { storeId: record.storeId, parentStoreId: record.parentStoreId });
      }
    }
    const values = [
      record.projectId, record.storeId, record.kind, record.coordinate, record.parentStoreId, record.title, record.body,
      record.recordedStatus, record.status, record.closeOutcome, JSON.stringify(record.unresolvedDependencies),
      JSON.stringify(record.gates), JSON.stringify(record.blockers), record.sourcePath, record.copyState, record.revision,
    ];
    if (current) {
      db.prepare(
        `UPDATE work_units SET project_id = ?, store_id = ?, kind = ?, coordinate = ?, parent_store_id = ?, title = ?, body = ?,
            recorded_status = ?, status = ?, close_outcome = ?, unresolved_dependencies_json = ?, gates_json = ?,
            blockers_json = ?, source_path = ?, copy_state = ?, revision = ?
          WHERE store_id = ? AND revision = ?`,
      ).run(...values, record.storeId, options.expectedVersion);
      db.prepare("DELETE FROM work_dependencies WHERE unit_store_id = ?").run(record.storeId);
      db.prepare("DELETE FROM work_links WHERE unit_store_id = ?").run(record.storeId);
    } else {
      db.prepare(`INSERT INTO work_units (${UNIT_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(...values);
    }
    const dependency = db.prepare(
      "INSERT INTO work_dependencies (project_id, unit_store_id, ordinal, depends_on_store_id, source_text, source_path, source_line) VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    record.dependencies.forEach((entry, ordinal) => {
      dependency.run(record.projectId, record.storeId, ordinal, entry.dependsOnStoreId, entry.sourceText, entry.source?.path ?? null, entry.source?.line ?? null);
    });
    const link = db.prepare("INSERT INTO work_links (unit_store_id, ordinal, direction, kind, path, anchor) VALUES (?, ?, ?, ?, ?, ?)");
    record.links.forEach((entry, ordinal) => link.run(record.storeId, ordinal, entry.direction, entry.kind, entry.path, entry.anchor));
    if (record.status === "closed") db.prepare("DELETE FROM work_claims WHERE unit_store_id = ?").run(record.storeId);
    return readWorkUnit(db, record.storeId)!;
  });
}

/**
 * Delete one unit that left its work file (W29 R0 P3 sync). The unit must be
 * at `expectedVersion`, have no child, and be no other unit's dependency, so
 * nothing points at a missing unit. Its dependencies, links, and claim go
 * with it. Inside {@link writeWorkStore}, it must belong to the opened project.
 */
export function deleteWorkUnit(db: StoreDatabase, storeId: string, options: { expectedVersion: number }): void {
  atomic(db, () => {
    const current = unitRow(db, storeId);
    if (!current) refuse("unit-not-found", `Work unit ${storeId} does not exist.`, RE_READ, { storeId });
    assertOpenedProject(db, current.project_id);
    if (Number(current.revision) !== options.expectedVersion) {
      refuse("version-conflict", `Work unit ${storeId} is at revision ${Number(current.revision)}, not ${options.expectedVersion}.`, RE_READ, { storeId, currentVersion: Number(current.revision) });
    }
    const child = db.prepare("SELECT store_id FROM work_units WHERE parent_store_id = ? LIMIT 1").get(storeId) as { store_id: string } | undefined;
    const dependent = db.prepare("SELECT unit_store_id FROM work_dependencies WHERE depends_on_store_id = ? LIMIT 1").get(storeId) as { unit_store_id: string } | undefined;
    if (child || dependent) {
      refuse(
        "unit-in-use",
        `Work unit ${storeId} still has ${child ? `a child, ${child.store_id}` : `a dependent unit, ${dependent!.unit_store_id}`}.`,
        "Move or delete the child, or change the dependency, first.",
        { storeId },
      );
    }
    db.prepare("DELETE FROM work_claims WHERE unit_store_id = ?").run(storeId);
    db.prepare("DELETE FROM work_units WHERE store_id = ? AND revision = ?").run(storeId, options.expectedVersion);
  });
}

/** A new stable store ID (R-WORK-QUEUE-1). */
export function newWorkUnitStoreId(): string {
  return `wu-${randomUUID().replaceAll("-", "")}`;
}

function newWorkClaimId(): string {
  return `wc-${randomUUID().replaceAll("-", "")}`;
}

/**
 * The next quick item number of a project (R-WORK-QUEUE-18). The store keeps
 * closed quick items, so a number is never used twice.
 */
export function nextQuickItemNumber(db: StoreDatabase, projectId: string): number {
  const row = db.prepare(
    "SELECT max(CAST(coordinate AS INTEGER)) AS n FROM work_units WHERE project_id = ? AND kind = 'quick-item'",
  ).get(projectId) as { n: number | bigint | null };
  return Number(row.n ?? 0) + 1;
}

/** Add a quick item with the next number, open, with no repo copy. */
export function createQuickItem(db: StoreDatabase, projectId: string, request: WorkAddRequest): WorkUnitRecord {
  const parsed = WorkAddRequestSchema.safeParse(request);
  if (!parsed.success) refuse("invalid-record", "The quick item request does not match its contract.", "Correct the title, body, or links.");
  return atomic(db, () => putWorkUnit(db, {
    projectId,
    storeId: newWorkUnitStoreId(),
    kind: "quick-item",
    coordinate: String(nextQuickItemNumber(db, projectId)),
    parentStoreId: null,
    title: parsed.data.title,
    body: parsed.data.body,
    recordedStatus: null,
    status: "open",
    closeOutcome: null,
    dependencies: [],
    unresolvedDependencies: [],
    gates: [],
    blockers: [],
    links: parsed.data.links,
    sourcePath: null,
    copyState: "kept",
  }, { expectedVersion: null }));
}

/** The longest progress note that a unit keeps (register D-066). */
export const WORK_UNIT_NOTE_MAX = 256;

export interface WorkUnitNote {
  note: string;
  noteAt: string;
}

/** The latest progress note of a unit, or null (W29 R0 P4, register D-066). */
export function readWorkUnitNote(db: StoreDatabase, storeId: string): WorkUnitNote | null {
  const row = db.prepare("SELECT note, note_at FROM work_units WHERE store_id = ?").get(storeId) as { note: string | null; note_at: string | null } | undefined;
  return row && row.note !== null && row.note_at !== null ? { note: row.note, noteAt: row.note_at } : null;
}

/** The plain text problem of a note, or null. One line, 1 to 256 characters, no control character. */
export function workUnitNoteProblem(note: string): string | null {
  if (note.length === 0 || note.trim() !== note) return "A note has no leading or trailing space and is not empty.";
  if (note.length > WORK_UNIT_NOTE_MAX) return `A note has at most ${WORK_UNIT_NOTE_MAX} characters.`;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(note)) return "A note is one line of plain text, with no line break, tab, or other control character.";
  return null;
}

/**
 * Replace a unit's latest progress note (register D-066). The write carries
 * the unit's record revision, raises it by one, and keeps every other field.
 * The caller checks the claim rule of a report first.
 */
export function setWorkUnitNote(
  db: StoreDatabase,
  storeId: string,
  note: string,
  options: { expectedVersion: number; now?: Date },
): WorkUnitRecord {
  return atomic(db, () => {
    const current = unitRow(db, storeId);
    if (!current) refuse("unit-not-found", `Work unit ${storeId} does not exist.`, RE_READ, { storeId });
    assertOpenedProject(db, current.project_id);
    if (Number(current.revision) !== options.expectedVersion) {
      refuse("version-conflict", `Work unit ${storeId} is at revision ${Number(current.revision)}, not ${options.expectedVersion}.`, RE_READ, { storeId, currentVersion: Number(current.revision) });
    }
    const problem = workUnitNoteProblem(note);
    if (problem) refuse("invalid-record", problem, "Correct the note and report again.", { storeId });
    db.prepare("UPDATE work_units SET note = ?, note_at = ?, revision = revision + 1 WHERE store_id = ? AND revision = ?")
      .run(note, (options.now ?? new Date()).toISOString(), storeId, options.expectedVersion);
    return readWorkUnit(db, storeId)!;
  });
}

/* ------------------------------------------------------------------------ */
/* Claims (T6, T7)                                                          */
/* ------------------------------------------------------------------------ */

interface ClaimRow {
  claim_id: string;
  project_id: string;
  unit_store_id: string;
  claimant: string;
  task_handle: string | null;
  claimed_at: string;
  renewed_at: string;
  expires_at: string;
  takeover_observation: WorkClaimRecord["takeoverObservation"];
}

function toClaim(row: ClaimRow): WorkClaimRecord {
  return WorkClaimRecordSchema.parse({
    projectId: row.project_id,
    claimId: row.claim_id,
    unitStoreId: row.unit_store_id,
    claimant: row.claimant,
    taskHandle: row.task_handle,
    claimedAt: row.claimed_at,
    renewedAt: row.renewed_at,
    expiresAt: row.expires_at,
    takeoverObservation: row.takeover_observation,
  });
}

function claimRow(db: StoreDatabase, unitStoreId: string): ClaimRow | undefined {
  return db.prepare("SELECT * FROM work_claims WHERE unit_store_id = ?").get(unitStoreId) as ClaimRow | undefined;
}

/** The claim row of a unit, live or expired, or null. */
export function readWorkClaim(db: StoreDatabase, unitStoreId: string): WorkClaimRecord | null {
  const row = claimRow(db, unitStoreId);
  return row ? toClaim(row) : null;
}

/** Every claim row of one project, live or expired. */
export function listWorkClaims(db: StoreDatabase, projectId: string): WorkClaimRecord[] {
  return (db.prepare("SELECT * FROM work_claims WHERE project_id = ? ORDER BY unit_store_id").all(projectId) as unknown as ClaimRow[]).map(toClaim);
}

/**
 * Release an expired claim for any caller, without its claim ID
 * (R-WORK-QUEUE-10). W29 R0 P4 T13 hides a claim ID from every caller that
 * does not hold the claim, so a person who releases another claimant's
 * expired claim names the unit and its expected version instead. A live
 * claim is refused with `not-claim-holder`: only its holder releases it.
 */
export function releaseExpiredWorkClaim(
  db: StoreDatabase,
  request: { unitStoreId: string; expectedVersion: number; handleObservation: WorkHandleObservation | null },
  options: { now?: Date } = {},
): WorkUpdateOutcome & { releasedClaimant: string | null } {
  const now = (options.now ?? new Date()).toISOString();
  return atomic(db, () => {
    const unit = unitRow(db, request.unitStoreId);
    if (!unit) refuse("unit-not-found", `Work unit ${request.unitStoreId} does not exist.`, RE_READ);
    assertOpenedProject(db, unit.project_id);
    if (Number(unit.revision) !== request.expectedVersion) return { accepted: false, refusal: "version-conflict", releasedClaimant: null };
    const existing = claimRow(db, request.unitStoreId);
    if (!existing || existing.expires_at > now) return { accepted: false, refusal: "not-claim-holder", releasedClaimant: null };
    // Owner decision 2026-11-23 (W29 R0 P4 finding 9, option A): a release of an expired claim runs the
    // R-WORK-QUEUE-7 handle check, so a release and a new claim never skip the check of a takeover.
    const handleRefusal = expiredClaimHandleRefusal(existing.task_handle, request.handleObservation);
    if (handleRefusal) return { accepted: false, refusal: handleRefusal, releasedClaimant: null };
    db.prepare("DELETE FROM work_claims WHERE claim_id = ? AND expires_at <= ?").run(existing.claim_id, now);
    return { accepted: true, refusal: null, releasedClaimant: existing.claimant };
  });
}

/**
 * The R-WORK-QUEUE-7 handle check for an expired claim that a caller without
 * it releases, closes, or takes over (owner decision 2026-11-23, W29 R0 P4
 * finding 9). A claim with a task handle needs what the check saw: stopped,
 * finished, or not found; a running task refuses. A claim with no task handle
 * has nothing to check, so a person names `no-handle` and may release or close
 * it. Returns null when the write may go on.
 */
export function expiredClaimHandleRefusal(
  taskHandle: string | null,
  observation: WorkHandleObservation | null,
): Extract<WorkUpdateRefusal, "handle-check-needed" | "previous-holder-still-working"> | null {
  if (observation === null) return "handle-check-needed";
  if (taskHandle === null) return observation === "no-handle" ? null : "handle-check-needed";
  if (observation === "running") return "previous-holder-still-working";
  if (observation === "no-handle") return "handle-check-needed";
  return null;
}

/** A claim is live until its expiry time (R-WORK-QUEUE-7). */
export function isWorkClaimLive(claim: Pick<WorkClaimRecord, "expiresAt">, now: Date): boolean {
  return claim.expiresAt > now.toISOString();
}

export type WorkClaimOutcome =
  | { result: "claimed" | "renewed"; refusal: null; claim: WorkClaimRecord }
  | { result: "refused"; refusal: WorkClaimRefusal; claim: WorkClaimRecord | null };

function refusedClaim(refusal: WorkClaimRefusal, claim: ClaimRow | undefined | null): WorkClaimOutcome {
  return { result: "refused", refusal, claim: claim ? toClaim(claim) : null };
}

/** The first live claim of another claimant on an ancestor or a descendant (R-WORK-QUEUE-14). */
function relatedLiveClaim(db: StoreDatabase, unitStoreId: string, claimant: string, now: string): "ancestor-claimed" | "descendant-claimed" | null {
  const ancestor = db.prepare(
    `WITH RECURSIVE ancestors(store_id) AS (
       SELECT parent_store_id FROM work_units WHERE store_id = ? AND parent_store_id IS NOT NULL
       UNION
       SELECT u.parent_store_id FROM work_units u JOIN ancestors a ON u.store_id = a.store_id WHERE u.parent_store_id IS NOT NULL
     )
     SELECT 1 FROM work_claims c JOIN ancestors a ON c.unit_store_id = a.store_id
      WHERE c.claimant <> ? AND c.expires_at > ? LIMIT 1`,
  ).get(unitStoreId, claimant, now);
  if (ancestor) return "ancestor-claimed";
  const descendant = db.prepare(
    `WITH RECURSIVE descendants(store_id) AS (
       SELECT store_id FROM work_units WHERE parent_store_id = ?
       UNION
       SELECT u.store_id FROM work_units u JOIN descendants d ON u.parent_store_id = d.store_id
     )
     SELECT 1 FROM work_claims c JOIN descendants d ON c.unit_store_id = d.store_id
      WHERE c.claimant <> ? AND c.expires_at > ? LIMIT 1`,
  ).get(unitStoreId, claimant, now);
  return descendant ? "descendant-claimed" : null;
}

/**
 * Claim, renew, or take over a unit (R-WORK-QUEUE-6, R-WORK-QUEUE-7, A7, A8).
 *
 * - No claim: a plain claim succeeds when no other claimant holds an
 *   ancestor or a descendant.
 * - A live claim: its holder renews it by naming its claim ID; anyone else,
 *   also a caller that names the same claimant without the claim ID, is refused.
 * - An expired claim: a plain claim is refused with
 *   `takeover-needs-handle-check`. A takeover names the expired claim and
 *   what the handle check saw. It is refused while the old task runs, and
 *   when the old claim has no task handle; a person releases that claim.
 *
 * The schema allows one claim row for each unit, so a second claim fails
 * there even if this check were skipped. Readiness is checked by the work
 * queue (W29 R0 P4) before it calls this service.
 */
export function claimWorkUnit(db: StoreDatabase, request: WorkClaimRequest, options: { now?: Date } = {}): WorkClaimOutcome {
  const parsed = WorkClaimRequestSchema.safeParse(request);
  if (!parsed.success) refuse("invalid-record", "The claim request does not match its contract.", "Correct the claim request.");
  const claimRequest = parsed.data;
  const now = options.now ?? new Date();
  const nowText = now.toISOString();
  return atomic(db, () => {
    const unit = unitRow(db, claimRequest.unitStoreId);
    if (!unit) return refusedClaim("unit-not-found", null);
    assertOpenedProject(db, unit.project_id);
    const existing = claimRow(db, claimRequest.unitStoreId);
    if (unit.status === "closed") return refusedClaim("unit-closed", existing);
    if (Number(unit.revision) !== claimRequest.expectedVersion) return refusedClaim("version-conflict", existing);
    const expiresAt = new Date(now.getTime() + (claimRequest.ttlSeconds ?? WORK_CLAIM_POLICY.defaultTtlSeconds) * 1000).toISOString();
    if (existing && existing.expires_at > nowText) {
      if (existing.claimant !== claimRequest.claimant) return refusedClaim("already-claimed", existing);
      // T13: a renewal names the claim ID. The claimant name alone is not proof of holding the claim.
      if ((claimRequest.claimId ?? null) !== existing.claim_id) return refusedClaim("already-claimed", existing);
      // A clock that went back must not make a renewal earlier than the last one:
      // renew from the later of now and the last renewal, so the times stay in order.
      const renewedAt = existing.renewed_at > nowText ? existing.renewed_at : nowText;
      const renewedExpiry = new Date(Date.parse(renewedAt) + (claimRequest.ttlSeconds ?? WORK_CLAIM_POLICY.defaultTtlSeconds) * 1000).toISOString();
      db.prepare("UPDATE work_claims SET renewed_at = ?, expires_at = ?, task_handle = coalesce(?, task_handle) WHERE claim_id = ?")
        .run(renewedAt, renewedExpiry, claimRequest.taskHandle, existing.claim_id);
      return { result: "renewed", refusal: null, claim: toClaim(claimRow(db, claimRequest.unitStoreId)!) };
    }
    if (existing) {
      const takeover = claimRequest.takeover;
      if (!takeover) return refusedClaim("takeover-needs-handle-check", existing);
      if (takeover.previousClaimId !== existing.claim_id) return refusedClaim("version-conflict", existing);
      if (existing.task_handle === null || takeover.handleObservation === "no-handle") return refusedClaim("no-handle-to-check", existing);
      if (takeover.handleObservation === "running") return refusedClaim("previous-holder-still-working", existing);
    } else if (claimRequest.takeover) {
      // The claim to take over is gone, so the caller read an older state.
      return refusedClaim("version-conflict", null);
    }
    const related = relatedLiveClaim(db, claimRequest.unitStoreId, claimRequest.claimant, nowText);
    if (related) return refusedClaim(related, existing);
    if (existing) db.prepare("DELETE FROM work_claims WHERE claim_id = ?").run(existing.claim_id);
    const observation = existing ? claimRequest.takeover!.handleObservation : null;
    db.prepare(
      `INSERT INTO work_claims (claim_id, project_id, unit_store_id, claimant, task_handle, claimed_at, renewed_at, expires_at, takeover_observation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(newWorkClaimId(), unit.project_id, unit.store_id, claimRequest.claimant, claimRequest.taskHandle, nowText, nowText, expiresAt, observation);
    return { result: "claimed", refusal: null, claim: toClaim(claimRow(db, claimRequest.unitStoreId)!) };
  });
}

export type WorkUpdateOutcome =
  | { accepted: true; refusal: null }
  | { accepted: false; refusal: WorkUpdateRefusal };

/**
 * Release a claim without closing its unit (R-WORK-QUEUE-10). The request
 * names the claim: its holder releases a live claim, and any caller that
 * names an expired claim releases it.
 */
export function releaseWorkClaim(db: StoreDatabase, request: WorkReleaseRequest): WorkUpdateOutcome {
  const parsed = WorkReleaseRequestSchema.safeParse(request);
  if (!parsed.success) refuse("invalid-record", "The release request does not match its contract.", "Correct the release request.");
  const release = parsed.data;
  return atomic(db, () => {
    const unit = unitRow(db, release.unitStoreId);
    if (!unit) refuse("unit-not-found", `Work unit ${release.unitStoreId} does not exist.`, RE_READ);
    assertOpenedProject(db, unit.project_id);
    if (Number(unit.revision) !== release.expectedVersion) return { accepted: false, refusal: "version-conflict" };
    const removed = changes(db.prepare("DELETE FROM work_claims WHERE unit_store_id = ? AND claim_id = ?").run(release.unitStoreId, release.claimId));
    return removed === 1 ? { accepted: true, refusal: null } : { accepted: false, refusal: "not-claim-holder" };
  });
}

/**
 * The claim rule of a report or a close (R-WORK-QUEUE-8, R-WORK-QUEUE-9): a
 * unit with a live claim changes only through its holder, and a caller
 * without a claim can change a unit that has no live claim. A holder whose
 * claim expired gets `claim-expired`. A close by a caller without the claim of
 * a unit whose claim expired needs the handle check (`closing`). Returns null
 * when the write may go on.
 */
export function checkWorkUnitWriteClaim(
  db: StoreDatabase,
  unitStoreId: string,
  claimId: string | null,
  now: Date = new Date(),
  options: { closing?: boolean; handleObservation?: WorkHandleObservation | null } = {},
): Extract<WorkUpdateRefusal, "not-claim-holder" | "claim-expired" | "handle-check-needed" | "previous-holder-still-working"> | null {
  const existing = claimRow(db, unitStoreId);
  const live = existing !== undefined && existing.expires_at > now.toISOString();
  if (claimId === null) {
    if (live) return "not-claim-holder";
    // A close by a caller without the claim ends an expired claim's work, so it runs the same
    // handle check as a takeover (owner decision 2026-11-23, W29 R0 P4 finding 9).
    if (existing && options.closing) return expiredClaimHandleRefusal(existing.task_handle, options.handleObservation ?? null);
    return null;
  }
  if (!existing || existing.claim_id !== claimId) return "not-claim-holder";
  return live ? null : "claim-expired";
}

/* ------------------------------------------------------------------------ */
/* Sync ledger and sync conflicts (T5)                                      */
/* ------------------------------------------------------------------------ */

export interface WorkSyncLedgerRow {
  entry: WorkSyncLedgerEntry;
  entryVersion: number;
}

export interface WorkSyncConflictRow {
  conflict: WorkSyncConflictRecord;
  entryVersion: number;
}

function checkoutProject(db: StoreDatabase, checkoutId: string): string {
  const row = db.prepare("SELECT project_id FROM installation_checkouts WHERE checkout_id = ?").get(checkoutId) as { project_id: string } | undefined;
  if (!row) refuse("invalid-record", `Checkout ${checkoutId} is not bound in this Store.`, "Bind the checkout with make-docs setup first.", { checkoutId });
  return row.project_id;
}

function assertUnitsOfProject(db: StoreDatabase, projectId: string, storeIds: readonly string[]): void {
  const lookup = db.prepare("SELECT 1 FROM work_units WHERE store_id = ? AND project_id = ?");
  const missing = storeIds.filter((storeId) => !lookup.get(storeId, projectId));
  if (missing.length > 0) {
    refuse("invalid-record", `These units are not work units of project ${projectId}: ${missing.join(", ")}.`, "Write the units first, or correct the unit list.", { missing });
  }
}

function assertEntryVersion(table: string, current: number | null, expected: number | null, key: string): void {
  if (current === expected) return;
  refuse(
    "version-conflict",
    current === null
      ? `The ${table} entry for ${key} does not exist, but version ${expected} was expected.`
      : `The ${table} entry for ${key} is at version ${current}, not ${expected ?? "absent"}.`,
    RE_READ,
    { key, currentVersion: current },
  );
}

function ledgerRow(db: StoreDatabase, checkoutId: string, targetPath: string): Record<string, unknown> | undefined {
  return db.prepare("SELECT * FROM work_sync_ledger WHERE checkout_id = ? AND target_path = ?").get(checkoutId, targetPath) as Record<string, unknown> | undefined;
}

function toLedger(row: Record<string, unknown>): WorkSyncLedgerRow {
  return {
    entry: WorkSyncLedgerEntrySchema.parse({
      checkoutId: row.checkout_id,
      targetPath: row.target_path,
      unitStoreIds: JSON.parse(String(row.unit_store_ids_json)),
      digestAlgorithm: row.digest_algorithm,
      lastAppliedDigest: row.last_applied_digest,
      storeRevision: Number(row.store_revision),
      syncedAt: row.synced_at,
    }),
    entryVersion: Number(row.entry_version),
  };
}

export function readSyncLedgerEntry(db: StoreDatabase, checkoutId: string, targetPath: string): WorkSyncLedgerRow | null {
  const row = ledgerRow(db, checkoutId, targetPath);
  return row ? toLedger(row) : null;
}

export function listSyncLedger(db: StoreDatabase, checkoutId: string): WorkSyncLedgerRow[] {
  return (db.prepare("SELECT * FROM work_sync_ledger WHERE checkout_id = ? ORDER BY target_path").all(checkoutId) as Record<string, unknown>[]).map(toLedger);
}

/** Write one ledger entry. `expectedVersion` is null for a new entry, or the entry version that the caller read. */
export function putSyncLedgerEntry(db: StoreDatabase, entry: WorkSyncLedgerEntry, options: { expectedVersion: number | null }): WorkSyncLedgerRow {
  const parsed = WorkSyncLedgerEntrySchema.safeParse(entry);
  if (!parsed.success) refuse("invalid-record", "The sync ledger entry does not match its contract.", "Correct the entry.");
  const value = parsed.data;
  return atomic(db, () => {
    const projectId = checkoutProject(db, value.checkoutId);
    assertOpenedProject(db, projectId);
    assertUnitsOfProject(db, projectId, value.unitStoreIds);
    const current = ledgerRow(db, value.checkoutId, value.targetPath);
    assertEntryVersion("sync ledger", current ? Number(current.entry_version) : null, options.expectedVersion, value.targetPath);
    const entryVersion = (options.expectedVersion ?? 0) + 1;
    const syncedAt = new Date(value.syncedAt).toISOString();
    db.prepare(
      `INSERT INTO work_sync_ledger (checkout_id, target_path, unit_store_ids_json, digest_algorithm, last_applied_digest, store_revision, synced_at, entry_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (checkout_id, target_path) DO UPDATE SET
         unit_store_ids_json = excluded.unit_store_ids_json, digest_algorithm = excluded.digest_algorithm,
         last_applied_digest = excluded.last_applied_digest, store_revision = excluded.store_revision,
         synced_at = excluded.synced_at, entry_version = excluded.entry_version`,
    ).run(value.checkoutId, value.targetPath, JSON.stringify(value.unitStoreIds), value.digestAlgorithm, value.lastAppliedDigest, value.storeRevision, syncedAt, entryVersion);
    return toLedger(ledgerRow(db, value.checkoutId, value.targetPath)!);
  });
}

/** Remove one ledger entry after a verified copy removal or with the repo copy off. */
export function deleteSyncLedgerEntry(db: StoreDatabase, checkoutId: string, targetPath: string, options: { expectedVersion: number }): void {
  atomic(db, () => {
    assertOpenedProject(db, checkoutProject(db, checkoutId));
    const current = ledgerRow(db, checkoutId, targetPath);
    assertEntryVersion("sync ledger", current ? Number(current.entry_version) : null, options.expectedVersion, targetPath);
    db.prepare("DELETE FROM work_sync_ledger WHERE checkout_id = ? AND target_path = ? AND entry_version = ?").run(checkoutId, targetPath, options.expectedVersion);
  });
}

function conflictRow(db: StoreDatabase, checkoutId: string, targetPath: string): Record<string, unknown> | undefined {
  return db.prepare("SELECT * FROM work_sync_conflicts WHERE checkout_id = ? AND target_path = ?").get(checkoutId, targetPath) as Record<string, unknown> | undefined;
}

function toConflict(row: Record<string, unknown>): WorkSyncConflictRow {
  return {
    conflict: WorkSyncConflictRecordSchema.parse({
      checkoutId: row.checkout_id,
      targetPath: row.target_path,
      kind: row.kind,
      fileDigest: row.file_digest,
      ledgerDigest: row.ledger_digest,
      storeRevision: row.store_revision === null ? null : Number(row.store_revision),
      affectedUnitStoreIds: JSON.parse(String(row.affected_unit_store_ids_json)),
      detectedAt: row.detected_at,
    }),
    entryVersion: Number(row.entry_version),
  };
}

export function listSyncConflicts(db: StoreDatabase, checkoutId: string): WorkSyncConflictRow[] {
  return (db.prepare("SELECT * FROM work_sync_conflicts WHERE checkout_id = ? ORDER BY target_path").all(checkoutId) as Record<string, unknown>[]).map(toConflict);
}

/** Record one conflict. `expectedVersion` is null for a new conflict, or the entry version that the caller read. */
export function putSyncConflict(db: StoreDatabase, conflict: WorkSyncConflictRecord, options: { expectedVersion: number | null }): WorkSyncConflictRow {
  const parsed = WorkSyncConflictRecordSchema.safeParse(conflict);
  if (!parsed.success) refuse("invalid-record", "The sync conflict does not match its contract.", "Correct the conflict.");
  const value = parsed.data;
  return atomic(db, () => {
    const projectId = checkoutProject(db, value.checkoutId);
    assertOpenedProject(db, projectId);
    // A store-missing conflict names work that the store no longer has.
    if (value.kind !== "store-missing") assertUnitsOfProject(db, projectId, value.affectedUnitStoreIds);
    const current = conflictRow(db, value.checkoutId, value.targetPath);
    assertEntryVersion("sync conflict", current ? Number(current.entry_version) : null, options.expectedVersion, value.targetPath);
    const entryVersion = (options.expectedVersion ?? 0) + 1;
    db.prepare(
      `INSERT INTO work_sync_conflicts (checkout_id, target_path, kind, file_digest, ledger_digest, store_revision, affected_unit_store_ids_json, detected_at, entry_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (checkout_id, target_path) DO UPDATE SET
         kind = excluded.kind, file_digest = excluded.file_digest, ledger_digest = excluded.ledger_digest,
         store_revision = excluded.store_revision, affected_unit_store_ids_json = excluded.affected_unit_store_ids_json,
         detected_at = excluded.detected_at, entry_version = excluded.entry_version`,
    ).run(
      value.checkoutId, value.targetPath, value.kind, value.fileDigest, value.ledgerDigest, value.storeRevision,
      JSON.stringify(value.affectedUnitStoreIds), new Date(value.detectedAt).toISOString(), entryVersion,
    );
    return toConflict(conflictRow(db, value.checkoutId, value.targetPath)!);
  });
}

/** When this checkout's first work sync finished, or null before it (PRD 52 R-WORK-SYNC-9). */
export function readWorkSyncCheckout(db: StoreDatabase, checkoutId: string): string | null {
  const row = db.prepare("SELECT first_synced_at FROM work_sync_checkouts WHERE checkout_id = ?").get(checkoutId) as { first_synced_at: string } | undefined;
  return row?.first_synced_at ?? null;
}

/**
 * Mark this checkout's first work sync as done. Only a checkout's first sync
 * imports without writing a file. A second mark keeps the first time.
 */
export function markWorkSyncCheckout(db: StoreDatabase, checkoutId: string, options: { now?: Date } = {}): string {
  return atomic(db, () => {
    assertOpenedProject(db, checkoutProject(db, checkoutId));
    db.prepare("INSERT INTO work_sync_checkouts (checkout_id, first_synced_at) VALUES (?, ?) ON CONFLICT (checkout_id) DO NOTHING")
      .run(checkoutId, (options.now ?? new Date()).toISOString());
    return readWorkSyncCheckout(db, checkoutId)!;
  });
}

/** Remove one conflict when a person settles it. */
export function deleteSyncConflict(db: StoreDatabase, checkoutId: string, targetPath: string, options: { expectedVersion: number }): void {
  atomic(db, () => {
    assertOpenedProject(db, checkoutProject(db, checkoutId));
    const current = conflictRow(db, checkoutId, targetPath);
    assertEntryVersion("sync conflict", current ? Number(current.entry_version) : null, options.expectedVersion, targetPath);
    db.prepare("DELETE FROM work_sync_conflicts WHERE checkout_id = ? AND target_path = ? AND entry_version = ?").run(checkoutId, targetPath, options.expectedVersion);
  });
}

/* ------------------------------------------------------------------------ */
/* Scoped cleanup of a pruned project's work rows (W29 R0 P4 T12)           */
/* ------------------------------------------------------------------------ */

/**
 * A digest of every work row of one project: units with their dependencies
 * and links, and claims. `work export` returns it when it wrote all of the
 * project's work, and the cleanup below needs the same digest, so it removes
 * only work that an export wrote and that has not changed since.
 */
export function workProjectDigest(db: StoreDatabase, projectId: string): string {
  const rows = (sql: string) => db.prepare(sql).all(projectId) as Array<Record<string, unknown>>;
  const sorted = (value: Record<string, unknown>) =>
    Object.fromEntries(Object.keys(value).sort().map((key) => [key, value[key] ?? null]));
  const material = {
    units: rows("SELECT * FROM work_units WHERE project_id = ? ORDER BY store_id").map(sorted),
    dependencies: rows("SELECT * FROM work_dependencies WHERE project_id = ? ORDER BY unit_store_id, ordinal").map(sorted),
    links: rows(
      `SELECT l.* FROM work_links l JOIN work_units u ON u.store_id = l.unit_store_id
        WHERE u.project_id = ? ORDER BY l.unit_store_id, l.ordinal`,
    ).map(sorted),
    claims: rows("SELECT * FROM work_claims WHERE project_id = ? ORDER BY unit_store_id").map(sorted),
  };
  return `sha256:${createHash("sha256").update(JSON.stringify(material)).digest("hex")}`;
}

/** What {@link deletePrunedProjectWorkRows} removed. */
export interface DeletePrunedProjectWorkRowsResult {
  projectId: string;
  removed: { work_units: number; work_dependencies: number; work_links: number; work_claims: number };
}

/**
 * Remove one project's work rows (units, dependencies, links, and claims)
 * after a project prune, in one transaction (PRD 38 work store records row,
 * R-LIFE-2). It runs only when:
 *
 * - the project has no `project_register` row and no bound checkout, so a
 *   prune removed it (R-REGISTER-4); and
 * - `exportDigest` is the digest from a `work export` result that wrote all of
 *   the project's work, and it still matches every work row; and
 * - no unit of the project has a live claim.
 *
 * Otherwise it refuses and changes nothing. It never touches another
 * project's rows. Sync ledger, conflict, and first-sync rows belong to a
 * checkout and go with the checkout (`ON DELETE CASCADE`).
 */
export function deletePrunedProjectWorkRows(
  db: StoreDatabase,
  projectId: string,
  options: { exportDigest: string; now?: Date },
): DeletePrunedProjectWorkRowsResult {
  db.exec("BEGIN IMMEDIATE");
  try {
    if (readProjectRegisterRow(db, projectId) || db.prepare("SELECT 1 FROM installation_checkouts WHERE project_id = ?").get(projectId)) {
      refuse(
        "project-still-registered",
        `Project ${projectId} is still in the project register or has a bound checkout, so its work rows stay.`,
        "Prune the project first. A prune keeps work rows; this cleanup removes them after an export.",
        { projectId },
      );
    }
    if (workProjectDigest(db, projectId) !== options.exportDigest) {
      refuse(
        "export-proof-stale",
        `The work rows of project ${projectId} do not match the export digest, so an export did not write all of this work, or the work changed since.`,
        "Run make-docs work export with --to and --quick again, and use the workDigest of a complete export.",
        { projectId },
      );
    }
    const now = (options.now ?? new Date()).toISOString();
    const live = db.prepare("SELECT claimant, expires_at FROM work_claims WHERE project_id = ? AND expires_at > ? ORDER BY expires_at").get(projectId, now) as
      | { claimant: string; expires_at: string }
      | undefined;
    if (live) {
      refuse(
        "claim-live",
        `A unit of project ${projectId} has a live claim by ${live.claimant} until ${live.expires_at}, so its work rows stay.`,
        "Wait for the claim to end, or have its holder release it, then export and clean up again.",
        { projectId, claimant: live.claimant, expiresAt: live.expires_at },
      );
    }
    const count = (sql: string) => Number((db.prepare(sql).get(projectId) as { n: number }).n);
    const removed = {
      work_units: count("SELECT count(*) AS n FROM work_units WHERE project_id = ?"),
      work_dependencies: count("SELECT count(*) AS n FROM work_dependencies WHERE project_id = ?"),
      work_links: count("SELECT count(*) AS n FROM work_links l JOIN work_units u ON u.store_id = l.unit_store_id WHERE u.project_id = ?"),
      work_claims: count("SELECT count(*) AS n FROM work_claims WHERE project_id = ?"),
    };
    // Children first is not needed: the parent key is deferred and every unit of the project goes.
    db.prepare("DELETE FROM work_claims WHERE project_id = ?").run(projectId);
    db.prepare("DELETE FROM work_dependencies WHERE project_id = ?").run(projectId);
    db.prepare("DELETE FROM work_links WHERE unit_store_id IN (SELECT store_id FROM work_units WHERE project_id = ?)").run(projectId);
    db.prepare("DELETE FROM work_units WHERE project_id = ?").run(projectId);
    db.exec("COMMIT");
    return { projectId, removed };
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // The transaction may already be closed.
    }
    throw error;
  }
}
