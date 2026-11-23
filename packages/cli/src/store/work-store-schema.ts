/**
 * W29 R0 P2 work store tables (PRD 52 R-WORK-STORE-12, PRD 38 R-DB-7).
 *
 * Schema v8 adds six tables for the work store. This module holds their SQL
 * and the map from each physical column to its field phrase in the PRD 38
 * R-MIN register. It imports nothing from the Store, so `database.ts` can use
 * the statements in its migration list. The Store service that reads and
 * writes these tables is `work-store.ts`.
 *
 * Units, dependencies, links, and claims belong to the project and are shared
 * by every checkout of it. The sync ledger and sync conflicts belong to one
 * checkout (R-WORK-STORE-11).
 */

/** The Store schema version that creates the work store tables. */
export const WORK_STORE_SINCE_SCHEMA = 8;

export const WORK_STORE_TABLE_NAMES = [
  "work_units",
  "work_dependencies",
  "work_links",
  "work_claims",
  "work_sync_ledger",
  "work_sync_conflicts",
  "work_sync_checkouts",
] as const;
export type WorkStoreTableName = (typeof WORK_STORE_TABLE_NAMES)[number];

/** A UTC time as `Date.prototype.toISOString` writes it. The fixed form keeps text order equal to time order. */
const UTC_TIME_GLOB = "[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z";
const utcTime = (column: string) => `${column} GLOB '${UTC_TIME_GLOB}'`;
const storeId = (column: string, prefix: "wu-" | "wc-") =>
  `(length(${column}) BETWEEN 11 AND 67 AND substr(${column}, 1, 3) = '${prefix}' AND substr(${column}, 4) NOT GLOB '*[^a-z0-9]*')`;
/** A repository-relative path: not absolute, no backslash, and no `..` segment (a second layer under the service's schema check). */
const relativePath = (column: string) =>
  `(length(${column}) BETWEEN 1 AND 2048 AND substr(${column}, 1, 1) <> '/' AND instr(${column}, '\\') = 0 AND instr('/' || ${column} || '/', '/../') = 0)`;
const hexDigest = (column: string) => `(length(${column}) = 64 AND ${column} NOT GLOB '*[^0-9a-f]*')`;
const jsonArray = (column: string, maxBytes: number) =>
  `(length(${column}) <= ${maxBytes} AND json_valid(${column}) AND json_type(${column}) = 'array')`;

/**
 * The v8 statements. Foreign keys that point from one unit to another are
 * deferred, so one transaction can write a parent and its children, or a unit
 * and the units it depends on, in any order.
 */
export const WORK_STORE_V8_STATEMENTS: readonly string[] = Object.freeze([
  `CREATE TABLE work_units (
    project_id TEXT NOT NULL CHECK (length(project_id) BETWEEN 1 AND 160),
    store_id TEXT PRIMARY KEY CHECK ${storeId("store_id", "wu-")},
    kind TEXT NOT NULL CHECK (kind IN ('wave','revision','phase','stage','task','quick-item')),
    coordinate TEXT NOT NULL CHECK (length(coordinate) BETWEEN 1 AND 64),
    parent_store_id TEXT,
    title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 1024),
    body TEXT CHECK (body IS NULL OR length(body) <= 65536),
    recorded_status TEXT CHECK (recorded_status IS NULL OR length(recorded_status) BETWEEN 1 AND 256),
    status TEXT NOT NULL CHECK (status IN ('draft','open','in-progress','blocked','closed')),
    close_outcome TEXT CHECK (close_outcome IS NULL OR close_outcome IN ('done','cancelled','superseded')),
    unresolved_dependencies_json TEXT NOT NULL CHECK ${jsonArray("unresolved_dependencies_json", 65536)},
    gates_json TEXT NOT NULL CHECK ${jsonArray("gates_json", 65536)},
    blockers_json TEXT NOT NULL CHECK ${jsonArray("blockers_json", 65536)},
    source_path TEXT CHECK (source_path IS NULL OR ${relativePath("source_path")}),
    copy_state TEXT NOT NULL CHECK (copy_state IN ('kept','removed')),
    revision INTEGER NOT NULL CHECK (revision >= 1),
    UNIQUE (project_id, store_id),
    UNIQUE (project_id, coordinate),
    FOREIGN KEY (project_id, parent_store_id) REFERENCES work_units (project_id, store_id) DEFERRABLE INITIALLY DEFERRED,
    CHECK (parent_store_id IS NULL OR parent_store_id <> store_id),
    CHECK ((kind IN ('wave','quick-item')) = (parent_store_id IS NULL)),
    CHECK ((status = 'closed') = (close_outcome IS NOT NULL)),
    CHECK ((kind = 'quick-item') = (source_path IS NULL)),
    CHECK (kind <> 'quick-item' OR (coordinate GLOB '[1-9]*' AND coordinate NOT GLOB '*[^0-9]*'))
  )`,
  `CREATE INDEX idx_work_units_parent ON work_units (parent_store_id)`,
  `CREATE TABLE work_dependencies (
    project_id TEXT NOT NULL,
    unit_store_id TEXT NOT NULL,
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    depends_on_store_id TEXT NOT NULL,
    source_text TEXT NOT NULL CHECK (length(source_text) BETWEEN 1 AND 2048),
    source_path TEXT CHECK (source_path IS NULL OR ${relativePath("source_path")}),
    source_line INTEGER CHECK (source_line IS NULL OR source_line >= 1),
    PRIMARY KEY (unit_store_id, ordinal),
    FOREIGN KEY (project_id, unit_store_id) REFERENCES work_units (project_id, store_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY (project_id, depends_on_store_id) REFERENCES work_units (project_id, store_id) DEFERRABLE INITIALLY DEFERRED,
    CHECK (depends_on_store_id <> unit_store_id),
    CHECK (source_path IS NOT NULL OR source_line IS NULL)
  )`,
  `CREATE INDEX idx_work_dependencies_depends_on ON work_dependencies (project_id, depends_on_store_id)`,
  `CREATE TABLE work_links (
    unit_store_id TEXT NOT NULL REFERENCES work_units (store_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    direction TEXT NOT NULL CHECK (direction IN ('outbound','inbound')),
    kind TEXT NOT NULL CHECK (kind IN ('design','plan','prd-section','evidence','request','work-file')),
    path TEXT NOT NULL CHECK ${relativePath("path")},
    anchor TEXT CHECK (anchor IS NULL OR length(anchor) BETWEEN 1 AND 512),
    PRIMARY KEY (unit_store_id, ordinal)
  )`,
  // One claim row per unit, live or expired (R-WORK-QUEUE-6, A7). An expired
  // claim keeps its row until a release or a takeover replaces it.
  `CREATE TABLE work_claims (
    claim_id TEXT PRIMARY KEY CHECK ${storeId("claim_id", "wc-")},
    project_id TEXT NOT NULL,
    unit_store_id TEXT NOT NULL UNIQUE,
    claimant TEXT NOT NULL CHECK (length(claimant) BETWEEN 1 AND 256),
    task_handle TEXT CHECK (task_handle IS NULL OR length(task_handle) BETWEEN 1 AND 1024),
    claimed_at TEXT NOT NULL CHECK (${utcTime("claimed_at")}),
    renewed_at TEXT NOT NULL CHECK (${utcTime("renewed_at")}),
    expires_at TEXT NOT NULL CHECK (${utcTime("expires_at")}),
    takeover_observation TEXT CHECK (takeover_observation IS NULL OR takeover_observation IN ('stopped','finished','not-found')),
    FOREIGN KEY (project_id, unit_store_id) REFERENCES work_units (project_id, store_id) ON DELETE CASCADE,
    CHECK (claimed_at <= renewed_at AND renewed_at < expires_at)
  )`,
  `CREATE INDEX idx_work_claims_project ON work_claims (project_id, expires_at)`,
  `CREATE TABLE work_sync_ledger (
    checkout_id TEXT NOT NULL REFERENCES installation_checkouts (checkout_id) ON DELETE CASCADE,
    target_path TEXT NOT NULL CHECK ${relativePath("target_path")},
    unit_store_ids_json TEXT NOT NULL CHECK (${jsonArray("unit_store_ids_json", 65536)} AND json_array_length(unit_store_ids_json) >= 1),
    digest_algorithm TEXT NOT NULL CHECK (digest_algorithm = 'sha256'),
    last_applied_digest TEXT NOT NULL CHECK ${hexDigest("last_applied_digest")},
    store_revision INTEGER NOT NULL CHECK (store_revision >= 1),
    synced_at TEXT NOT NULL CHECK (${utcTime("synced_at")}),
    entry_version INTEGER NOT NULL CHECK (entry_version >= 1),
    PRIMARY KEY (checkout_id, target_path)
  )`,
  `CREATE TABLE work_sync_conflicts (
    checkout_id TEXT NOT NULL REFERENCES installation_checkouts (checkout_id) ON DELETE CASCADE,
    target_path TEXT NOT NULL CHECK ${relativePath("target_path")},
    kind TEXT NOT NULL CHECK (kind IN ('both-changed','file-deleted','store-missing','unclear')),
    file_digest TEXT CHECK (file_digest IS NULL OR ${hexDigest("file_digest")}),
    ledger_digest TEXT CHECK (ledger_digest IS NULL OR ${hexDigest("ledger_digest")}),
    store_revision INTEGER CHECK (store_revision IS NULL OR store_revision >= 1),
    affected_unit_store_ids_json TEXT NOT NULL CHECK ${jsonArray("affected_unit_store_ids_json", 65536)},
    detected_at TEXT NOT NULL CHECK (${utcTime("detected_at")}),
    entry_version INTEGER NOT NULL CHECK (entry_version >= 1),
    PRIMARY KEY (checkout_id, target_path),
    CHECK ((kind = 'file-deleted') = (file_digest IS NULL)),
    CHECK ((kind = 'store-missing') = (store_revision IS NULL)),
    CHECK (kind = 'store-missing' OR json_array_length(affected_unit_store_ids_json) >= 1)
  )`,
  // One row for each checkout whose first sync is done (W29 R0 P3, PRD 52 R-WORK-SYNC-9).
  `CREATE TABLE work_sync_checkouts (
    checkout_id TEXT PRIMARY KEY REFERENCES installation_checkouts (checkout_id) ON DELETE CASCADE,
    first_synced_at TEXT NOT NULL CHECK (${utcTime("first_synced_at")})
  )`,
]);

/** The four PRD 38 R-MIN rows that govern the work store tables, by their row label start. */
export const WORK_STORE_RMIN_ROWS = Object.freeze({
  units: "Work store records (schema v8)",
  ledger: "Work sync ledger",
  conflicts: "Work sync conflicts",
  claims: "Work claims",
  checkouts: "Work sync checkouts",
} as const);
export type WorkStoreRMinRowKey = keyof typeof WORK_STORE_RMIN_ROWS;

export interface WorkStoreColumnRegisterEntry {
  /** The R-MIN row that governs the column. */
  row: WorkStoreRMinRowKey;
  /** The field phrase of that row that the column holds, exactly as PRD 38 writes it. */
  phrase: string;
}

/**
 * Every physical column of every work store table, in schema order, with the
 * R-MIN field it holds (W29 R0 P2 T8). The parity test reads the physical
 * schema and PRD 38, and fails when a column, a field, or a phrase is on one
 * side only. `ordinal` keeps the order of a unit's dependency or link list,
 * so it belongs to that list field.
 */
export const WORK_STORE_COLUMN_REGISTER: Readonly<Record<WorkStoreTableName, Readonly<Record<string, WorkStoreColumnRegisterEntry>>>> = Object.freeze({
  work_units: {
    project_id: { row: "units", phrase: "project ID" },
    store_id: { row: "units", phrase: "unit store ID" },
    kind: { row: "units", phrase: "kind" },
    coordinate: { row: "units", phrase: "coordinate" },
    parent_store_id: { row: "units", phrase: "parent" },
    title: { row: "units", phrase: "title and body text" },
    body: { row: "units", phrase: "title and body text" },
    recorded_status: { row: "units", phrase: "recorded status" },
    status: { row: "units", phrase: "status" },
    close_outcome: { row: "units", phrase: "close outcome" },
    unresolved_dependencies_json: { row: "units", phrase: "unresolved dependency text" },
    gates_json: { row: "units", phrase: "gates and whether each is met" },
    blockers_json: { row: "units", phrase: "blockers" },
    source_path: { row: "units", phrase: "source path" },
    copy_state: { row: "units", phrase: "repo copy state" },
    revision: { row: "units", phrase: "record revision" },
  },
  work_dependencies: {
    project_id: { row: "units", phrase: "project ID" },
    unit_store_id: { row: "units", phrase: "unit store ID" },
    ordinal: { row: "units", phrase: "dependencies" },
    depends_on_store_id: { row: "units", phrase: "dependencies" },
    source_text: { row: "units", phrase: "dependencies" },
    source_path: { row: "units", phrase: "dependencies" },
    source_line: { row: "units", phrase: "dependencies" },
  },
  work_links: {
    unit_store_id: { row: "units", phrase: "unit store ID" },
    ordinal: { row: "units", phrase: "links to repo documents" },
    direction: { row: "units", phrase: "links to repo documents" },
    kind: { row: "units", phrase: "links to repo documents" },
    path: { row: "units", phrase: "links to repo documents" },
    anchor: { row: "units", phrase: "links to repo documents" },
  },
  work_claims: {
    claim_id: { row: "claims", phrase: "claim ID" },
    project_id: { row: "claims", phrase: "project ID" },
    unit_store_id: { row: "claims", phrase: "unit store ID" },
    claimant: { row: "claims", phrase: "claimant" },
    task_handle: { row: "claims", phrase: "task handle reference" },
    claimed_at: { row: "claims", phrase: "claim time" },
    renewed_at: { row: "claims", phrase: "renewal time" },
    expires_at: { row: "claims", phrase: "expiry time" },
    takeover_observation: { row: "claims", phrase: "takeover handle observation" },
  },
  work_sync_ledger: {
    checkout_id: { row: "ledger", phrase: "checkout ID" },
    target_path: { row: "ledger", phrase: "target path" },
    unit_store_ids_json: { row: "ledger", phrase: "unit or file identity" },
    digest_algorithm: { row: "ledger", phrase: "last applied digest and algorithm" },
    last_applied_digest: { row: "ledger", phrase: "last applied digest and algorithm" },
    store_revision: { row: "ledger", phrase: "store revision at that write" },
    synced_at: { row: "ledger", phrase: "sync time" },
    entry_version: { row: "ledger", phrase: "entry version" },
  },
  work_sync_conflicts: {
    checkout_id: { row: "conflicts", phrase: "checkout ID" },
    target_path: { row: "conflicts", phrase: "target path" },
    kind: { row: "conflicts", phrase: "conflict kind" },
    file_digest: { row: "conflicts", phrase: "both revisions or digests" },
    ledger_digest: { row: "conflicts", phrase: "both revisions or digests" },
    store_revision: { row: "conflicts", phrase: "both revisions or digests" },
    affected_unit_store_ids_json: { row: "conflicts", phrase: "affected units" },
    detected_at: { row: "conflicts", phrase: "detection time" },
    entry_version: { row: "conflicts", phrase: "entry version" },
  },
  work_sync_checkouts: {
    checkout_id: { row: "checkouts", phrase: "checkout ID" },
    first_synced_at: { row: "checkouts", phrase: "first sync time" },
  },
});

/**
 * The field phrases of one R-MIN row label, such as
 * "Work claims: project ID, claim ID, ..., and takeover handle observation".
 * The list after the first colon is split at commas, and a leading "and" is
 * dropped.
 */
export function rMinRowFieldPhrases(label: string): string[] {
  const colon = label.indexOf(": ");
  if (colon < 0) return [];
  return label
    .slice(colon + 2)
    .split(",")
    .map((part) => part.trim().replace(/^and /, "").trim())
    .filter((part) => part.length > 0);
}

/**
 * Compare the work store tables, the column register, and the PRD 38 R-MIN
 * rows (T8, A9). Returns one plain sentence for each drift; an empty list
 * means the register and the physical schema match.
 */
export function workStoreSchemaDrift(
  physicalTables: Readonly<Record<string, readonly string[]>>,
  rMinRows: readonly { label: string }[],
  register: Readonly<Record<string, Readonly<Record<string, WorkStoreColumnRegisterEntry>>>> = WORK_STORE_COLUMN_REGISTER,
): string[] {
  const drift: string[] = [];
  for (const table of WORK_STORE_TABLE_NAMES) {
    const physical = physicalTables[table];
    const mapped = register[table] ?? {};
    if (!physical) {
      drift.push(`Table ${table} is not in the physical schema.`);
      continue;
    }
    for (const column of physical) {
      if (!mapped[column]) drift.push(`Column ${table}.${column} has no R-MIN field in the work store register.`);
    }
    for (const column of Object.keys(mapped)) {
      if (!physical.includes(column)) drift.push(`Column ${table}.${column} is in the work store register but not in the physical schema.`);
    }
  }
  for (const [key, labelStart] of Object.entries(WORK_STORE_RMIN_ROWS) as Array<[WorkStoreRMinRowKey, string]>) {
    const rows = rMinRows.filter((row) => row.label.startsWith(labelStart));
    if (rows.length !== 1) {
      drift.push(`R-MIN row "${labelStart}" matches ${rows.length} PRD 38 rows.`);
      continue;
    }
    const phrases = rMinRowFieldPhrases(rows[0]!.label);
    const held = new Set(
      Object.entries(register).flatMap(([table, columns]) =>
        Object.entries(columns)
          .filter(([column, entry]) => entry.row === key && (physicalTables[table] ?? []).includes(column))
          .map(([, entry]) => entry.phrase),
      ),
    );
    for (const phrase of phrases) {
      if (!held.has(phrase)) drift.push(`R-MIN field "${phrase}" of "${labelStart}" has no physical column.`);
    }
    for (const phrase of held) {
      if (!phrases.includes(phrase)) drift.push(`Physical columns hold "${phrase}", but the R-MIN row "${labelStart}" does not name it.`);
    }
  }
  return drift;
}
