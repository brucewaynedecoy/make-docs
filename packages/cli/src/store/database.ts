import {
  chmodSync,
  closeSync,
  constants,
  fstatSync,
  fsyncSync,
  lstatSync,
  linkSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
  rmdirSync,
  rmSync,
  unlinkSync,
  writeFileSync,
  type Stats,
} from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { platform } from "../platform";
import { getStoreDatabasePath } from "./paths";
import { WORK_STORE_SINCE_SCHEMA, WORK_STORE_TABLE_NAMES, WORK_STORE_V8_STATEMENTS } from "./work-store-schema";
import { FACTORY_STORE_SINCE_SCHEMA, FACTORY_STORE_TABLE_NAMES, FACTORY_STORE_V9_STATEMENTS } from "./factory-store-schema";

/**
 * SQLite operational database for the global store (R-DB-1 through R-DB-4).
 *
 * Driver: the Node built-in `node:sqlite` module, loaded lazily via
 * `createRequire` so the CLI still loads on runtimes without it.
 * The package requires Node >= 24.0.0, where `node:sqlite` needs no flag. If a runtime
 * lacks the module, the store database reports `unavailable` through the same path that
 * R-DB-4 mandates for a missing database; nothing else in the CLI is
 * affected. See the module README for the full driver tradeoff record.
 *
 * Locking discipline (R-DB-3):
 * - `journal_mode = WAL` so readers never block the single writer.
 * - `busy_timeout = 5000` so contending writers queue instead of failing.
 * - Connections are short-lived: open, operate, close (`withStoreDatabase`).
 * - Multi-statement writes run inside `BEGIN IMMEDIATE` transactions so the
 *   write lock is acquired up front and held briefly.
 */

/** Current schema version of the operational database (recorded in `PRAGMA user_version`). */
export const CURRENT_STORE_SCHEMA_VERSION = 9;

/**
 * Store write guard (PRD 38 R-WRITE-GUARD). Every Store table has
 * `BEFORE INSERT`, `BEFORE UPDATE`, and `BEFORE DELETE` triggers that call
 * this SQL function. Only a Make Docs connection registers it, through
 * {@link registerStoreWriteGuard} in the one shared connection path. A
 * connection that Make Docs did not open has no such function, so its writes
 * fail with "no such function" and change nothing. Its reads still work.
 */
export const STORE_WRITE_GUARD_FUNCTION = "make_docs_write_guard";
/** The first schema version whose tables carry the write guard triggers. */
export const STORE_WRITE_GUARD_SINCE_SCHEMA = 7;
export const STORE_WRITE_GUARD_EVENTS = ["insert", "update", "delete"] as const;
export type StoreWriteGuardEvent = (typeof STORE_WRITE_GUARD_EVENTS)[number];
/** The reason that Store open reports when a guard trigger is missing or changed. */
export const STORE_CHANGED_OUTSIDE_REASON = "changed outside Make Docs";
/**
 * The limit of the write guard, which status and documentation state (PRD 38
 * R-WRITE-GUARD-6). The guard stops accidental and casual direct writes. It
 * does not stop a program that runs as the same person and sets out to remove
 * it; Make Docs detects that at the next Store open.
 */
export const STORE_WRITE_GUARD_LIMIT =
  "The write guard stops accidental and casual direct writes to the Store. A program that runs as you and sets out to remove the guard is not blocked; Make Docs detects it at the next Store open. Agents write the Store only through Make Docs commands or MCP tools.";

export function storeWriteGuardTriggerName(table: string, event: StoreWriteGuardEvent): string {
  return `make_docs_guard_${table}_${event}`;
}

/** A plain identifier stays as it is; any other name is quoted, so an older table with an odd name can be guarded too. */
function sqlIdentifier(name: string): string {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) ? name : `"${name.replaceAll('"', '""')}"`;
}

/** The exact trigger SQL that `sqlite_schema` must hold for one table and event. */
export function storeWriteGuardTriggerSql(table: string, event: StoreWriteGuardEvent): string {
  return `CREATE TRIGGER ${sqlIdentifier(storeWriteGuardTriggerName(table, event))} BEFORE ${event.toUpperCase()} ON ${sqlIdentifier(table)} BEGIN SELECT ${STORE_WRITE_GUARD_FUNCTION}(); END`;
}

/** A Store table that SQLite cannot give triggers: a virtual table or one of its shadow tables. */
export interface StoreUnguardableTable {
  table: string;
  kind: "virtual" | "shadow";
}

function storeTableRows(db: StoreDatabase): Array<{ name: string; sql: string | null }> {
  return db.prepare(
    "SELECT name, sql FROM sqlite_schema WHERE type = 'table' AND substr(name, 1, 7) <> 'sqlite_' ORDER BY name",
  ).all() as Array<{ name: string; sql: string | null }>;
}

/**
 * Tables that SQLite refuses triggers on ("cannot create triggers on virtual
 * tables" and "... on shadow tables"). No Make Docs schema creates one; an
 * older program may have. Make Docs skips them and reports them in Store
 * status, because their rows are not guarded.
 */
export function listUnguardableStoreTables(db: StoreDatabase): StoreUnguardableTable[] {
  const rows = storeTableRows(db);
  const virtual = rows.filter((row) => /^\s*CREATE\s+VIRTUAL\s+TABLE/i.test(row.sql ?? "")).map((row) => row.name);
  return rows.flatMap((row): StoreUnguardableTable[] => {
    if (virtual.includes(row.name)) return [{ table: row.name, kind: "virtual" }];
    return virtual.some((name) => row.name.startsWith(`${name}_`)) ? [{ table: row.name, kind: "shadow" }] : [];
  });
}

/** Every Store table that must carry the three guard triggers. */
function guardedStoreTables(db: StoreDatabase): string[] {
  const unguardable = new Set(listUnguardableStoreTables(db).map((entry) => entry.table));
  return storeTableRows(db).map((row) => row.name).filter((name) => !unguardable.has(name));
}

/** Rows that point to a missing parent row, grouped by child and parent table. */
export interface StoreBrokenReference {
  table: string;
  parent: string;
  count: number;
}

/** Read `PRAGMA foreign_key_check` for the whole Store, grouped by child and parent table. */
export function inspectStoreBrokenReferences(db: StoreDatabase): StoreBrokenReference[] {
  const counts = new Map<string, StoreBrokenReference>();
  for (const row of db.prepare("PRAGMA foreign_key_check").all() as Array<{ table: string; parent: string }>) {
    const key = `${row.table}\u0000${row.parent}`;
    const entry = counts.get(key) ?? { table: row.table, parent: row.parent, count: 0 };
    entry.count++;
    counts.set(key, entry);
  }
  return [...counts.values()].sort((left, right) => left.table.localeCompare(right.table) || left.parent.localeCompare(right.parent));
}

/** The repair step for broken references that existed before a migration. */
export const STORE_BROKEN_REFERENCE_NEXT_ACTION =
  "Make Docs keeps these rows and does not block on them. Run make-docs setup store check to review them. Do not delete Store rows by hand.";

/** One plain sentence for each group of broken references, with its repair step. */
export function describeStoreBrokenReferences(references: readonly StoreBrokenReference[]): string | null {
  if (references.length === 0) return null;
  const parts = references.map((entry) => `${entry.count} row(s) in ${entry.table} point to a missing ${entry.parent} row`);
  return `${parts.join("; ")}. ${STORE_BROKEN_REFERENCE_NEXT_ACTION}`;
}

/** The guard trigger statements for tables that a migration creates. */
export function storeWriteGuardStatements(tables: readonly string[]): string[] {
  return tables.flatMap((table) => STORE_WRITE_GUARD_EVENTS.map((event) => storeWriteGuardTriggerSql(table, event)));
}

/**
 * Register the write guard function on one connection. Every Make Docs Store
 * connection gets it in `openSqliteWithRetry`. Tests that seed fixture rows
 * on a raw connection call this too, which is the same Make Docs code path.
 */
export function registerStoreWriteGuard(db: StoreDatabase): void {
  db.function(STORE_WRITE_GUARD_FUNCTION, () => null);
}

/**
 * Compare every table's guard triggers with the expected SQL (R-WRITE-GUARD-4).
 * Returns one plain sentence for each missing or changed guard trigger. Reads
 * only `sqlite_schema`. An empty list means the guard is intact. Other
 * triggers are not guard triggers: a write in their body still fires the
 * guard triggers of the table it writes, so they cannot bypass the guard.
 */
export function inspectStoreWriteGuard(db: StoreDatabase): string[] {
  const tables = guardedStoreTables(db);
  const triggers = new Map((db.prepare(
    "SELECT name, tbl_name, sql FROM sqlite_schema WHERE type = 'trigger' ORDER BY name",
  ).all() as Array<{ name: string; tbl_name: string; sql: string | null }>).map((row) => [row.name, row]));
  const problems: string[] = [];
  for (const table of tables) {
    for (const event of STORE_WRITE_GUARD_EVENTS) {
      const name = storeWriteGuardTriggerName(table, event);
      const trigger = triggers.get(name);
      if (!trigger) problems.push(`Table ${table} has no BEFORE ${event.toUpperCase()} guard trigger.`);
      else if (trigger.tbl_name !== table || trigger.sql !== storeWriteGuardTriggerSql(table, event)) {
        problems.push(`The BEFORE ${event.toUpperCase()} guard trigger of table ${table} changed.`);
      }
    }
  }
  return problems;
}

/**
 * Tables that a schema from the write guard on creates, with that schema.
 * A Store that reports an older `user_version` never has one of them.
 */
const STORE_ROLLBACK_MARKER_TABLES: ReadonlyArray<{ table: string; sinceSchema: number }> = Object.freeze([
  { table: "project_register", sinceSchema: STORE_WRITE_GUARD_SINCE_SCHEMA },
  ...WORK_STORE_TABLE_NAMES.map((table) => ({ table, sinceSchema: WORK_STORE_SINCE_SCHEMA })),
  ...FACTORY_STORE_TABLE_NAMES.map((table) => ({ table, sinceSchema: FACTORY_STORE_SINCE_SCHEMA })),
]);

/**
 * Find objects of a newer schema in a Store that reports an older one
 * (R-WRITE-GUARD-4). A Store that Make Docs left at a schema never has a write
 * guard trigger from schema 7 when it reports schema 6 or older, a table that
 * a later schema creates (such as `project_register` from schema 7, the
 * work store tables from schema 8, or the factory tables from schema 9), or a
 * schema journal row newer than its
 * `user_version`. When one of them is present, the version was set back
 * outside Make Docs: the guard check that starts at schema 7 must not be
 * skipped, and a migration must not run again over the newer objects.
 * Returns one plain sentence for each finding. Reads only `sqlite_schema` and
 * the journal. An empty list means no rollback marker was found.
 */
export function inspectStoreVersionRollback(db: StoreDatabase): string[] {
  const version = readUserVersion(db);
  if (version >= CURRENT_STORE_SCHEMA_VERSION) return [];
  const problems: string[] = [];
  if (version < STORE_WRITE_GUARD_SINCE_SCHEMA) {
    const guardTriggers = db.prepare(
      "SELECT count(*) AS n FROM sqlite_schema WHERE type = 'trigger' AND sql LIKE ?",
    ).get(`%${STORE_WRITE_GUARD_FUNCTION}%`) as { n: number | bigint };
    if (Number(guardTriggers.n) > 0) problems.push(`The Store reports schema ${version} but has write guard triggers from schema ${STORE_WRITE_GUARD_SINCE_SCHEMA}.`);
  }
  const tables = new Set((db.prepare("SELECT name FROM sqlite_schema WHERE type = 'table'").all() as Array<{ name: string }>).map((row) => row.name));
  for (const marker of STORE_ROLLBACK_MARKER_TABLES) {
    if (marker.sinceSchema > version && tables.has(marker.table)) {
      problems.push(`The Store reports schema ${version} but has the ${marker.table} table from schema ${marker.sinceSchema}.`);
    }
  }
  if (tables.has("store_schema_journal")) {
    const newest = db.prepare("SELECT max(schema_version) AS v FROM store_schema_journal").get() as { v: number | bigint | null };
    if (newest.v !== null && Number(newest.v) > version) problems.push(`The Store reports schema ${version} but its schema journal records schema ${Number(newest.v)}.`);
  }
  return problems;
}

/**
 * Every write guard and rollback problem of an open Store: from schema 7 the
 * guard triggers of every table (inspectStoreWriteGuard), and for any schema
 * older than the current one the objects of a newer schema
 * (inspectStoreVersionRollback). An empty list means the Store is as Make
 * Docs left it.
 */
export function inspectStoreGuardAndVersion(db: StoreDatabase): string[] {
  const guard = readUserVersion(db) >= STORE_WRITE_GUARD_SINCE_SCHEMA ? inspectStoreWriteGuard(db) : [];
  return [...guard, ...inspectStoreVersionRollback(db)];
}

/** The name of a finished `setup store clean` backup in `<store>/backup/` (W32 R0 P4). */
export const STORE_CLEAN_BACKUP_PATTERN = /^store-clean-\d{8}T\d{9}Z-[0-9a-f]{8}\.db$/;
/** A clean backup that is still being written or checked, `.store-clean-*.db.partial`. It never counts as a backup. */
export const STORE_CLEAN_PARTIAL_BACKUP_PATTERN = /^\.store-clean-\d{8}T\d{9}Z-[0-9a-f]{8}\.db\.partial$/;

const SQLITE_HEADER = Buffer.from("SQLite format 3\0", "latin1");

/**
 * True when a file is a readable Store backup: a regular SQLite file that
 * passes `quick_check`, has a schema version, and, from schema 7, an intact
 * write guard. A partial, empty, or stray file is never a backup. Reads only.
 */
export function isVerifiedStoreBackupFile(file: string): boolean {
  let db: StoreDatabase | null = null;
  try {
    const stat = lstatSync(file);
    if (!stat.isFile() || stat.size < 512 || stat.size % 512 !== 0) return false;
    const header = Buffer.alloc(SQLITE_HEADER.length);
    const fd = openSync(file, "r");
    try { readSync(fd, header, 0, header.length, 0); } finally { closeSync(fd); }
    if (!header.equals(SQLITE_HEADER)) return false;
    const driver = loadSqliteDriver();
    if (!driver.available) return false;
    db = openSqliteWithRetry(driver.sqlite, file, { readOnly: true }, "verify Store backup", undefined, false);
    const check = db.prepare("PRAGMA quick_check").get() as { quick_check?: string } | undefined;
    const version = readUserVersion(db);
    return check?.quick_check === "ok" && version >= 1 && inspectStoreGuardAndVersion(db).length === 0;
  } catch {
    return false;
  } finally {
    closeQuietly(db);
  }
}

/**
 * Store backups that Make Docs made: schema bridge backups next to `store.db`
 * (`store.db.*.backup`) and files in `<store>/backup/`. With `verified`, a
 * file in `<store>/backup/` counts only when it is a finished clean backup
 * (`store-clean-*.db`) that verifies, so a partial or stray file is never
 * named as the newest backup. File modes still cover every file.
 */
function listStoreBackupFiles(storeRoot: string, mode: "all" | "verified" = "all"): Array<{ file: string; mtimeMs: number }> {
  const candidates: Array<{ file: string; mtimeMs: number }> = [];
  const scan = (directory: string, accept: (name: string) => boolean) => {
    let names: string[];
    try {
      names = readdirSync(directory);
    } catch {
      return;
    }
    for (const name of names) {
      if (!accept(name)) continue;
      const file = path.join(directory, name);
      try {
        const stat = lstatSync(file);
        if (stat.isFile()) candidates.push({ file, mtimeMs: stat.mtimeMs });
      } catch {
        // A backup that disappears while we look is not a candidate.
      }
    }
  };
  const root = path.resolve(storeRoot);
  scan(root, (name) => name.startsWith("store.db.") && name.endsWith(".backup"));
  scan(path.join(root, "backup"), mode === "all" ? () => true : (name) => STORE_CLEAN_BACKUP_PATTERN.test(name) && isVerifiedStoreBackupFile(path.join(root, "backup", name)));
  return candidates;
}

/** Newest Store backup that Make Docs made, or null. */
export function findNewestStoreBackup(storeRoot: string): string | null {
  const candidates = listStoreBackupFiles(storeRoot, "verified");
  candidates.sort((left, right) => right.mtimeMs - left.mtimeMs || right.file.localeCompare(left.file));
  return candidates[0]?.file ?? null;
}

/** Set file mode 0600 on `store.db` and on every existing Store backup (R-WRITE-GUARD-5). */
export function applyStoreFileModes(storeRoot: string): void {
  applyStoreFileMode(getStoreDatabasePath(storeRoot));
  for (const backup of listStoreBackupFiles(storeRoot)) applyStoreFileMode(backup.file);
}

/** The next action for a Store whose write guard changed (PRD 38 R-WRITE-GUARD-4). */
export function storeChangedOutsideNextAction(storeRoot: string): string {
  const backup = findNewestStoreBackup(storeRoot);
  return `Do not write the Store. Run make-docs setup store check to review it. ${backup
    ? `The newest Store backup is ${backup}.`
    : "No Store backup was found."}`;
}

/** Set file mode 0600 on a Store database or backup file where the platform supports it. */
export function applyStoreFileMode(file: string): void {
  if (platform.kind === "win32") return;
  try {
    chmodSync(file, 0o600);
  } catch (error) {
    if (systemCode(error) !== "ENOENT") throw new StoreUnavailableError(makeStoreIssue("io-error", file, "set Store file mode", error));
  }
}

/** Milliseconds a connection waits on a locked database before erroring. */
export const STORE_BUSY_TIMEOUT_MS = 5000;

/** Maximum time to wait for a live Store owner before reporting contention. */
export const STORE_OWNER_WAIT_MS = 30_000;

/** The legacy file path is now a directory of shared process sessions. */
export const STORE_ACCESS_PATH = "store-access.lock";
const STORE_SESSION_VERSION = 1;

const STORE_WAIT_MIN_MS = 25;
const STORE_WAIT_MAX_MS = 250;
const waitBuffer = new Int32Array(new SharedArrayBuffer(4));

function storeSessionHostTag(hostname: string): string {
  const hostKey = createHash("sha256").update(hostname).digest("hex").slice(0, 16);
  return `h${hostKey}`;
}

export function storeSessionPendingName(pid: number, hostname: string, token: string): string {
  return `.pending-${pid}.${storeSessionHostTag(hostname)}.${token}`;
}

type SqliteModule = typeof import("node:sqlite");

/** A live connection to the store database. */
export type StoreDatabase = import("node:sqlite").DatabaseSync;

export interface StoreMigration {
  /** Schema version this migration produces. */
  version: number;
  description: string;
  statements: string[];
  /** True when a statement rebuilds a table, so foreign keys are checked before commit instead. */
  rebuildsTables?: boolean;
}

/**
 * Ordered, append-only migration list. A fresh database replays the full list;
 * an existing database replays only versions greater than its recorded
 * `user_version`. `update` (the installer apply flow) invokes this via
 * {@link openStoreDatabase}, satisfying R-DB-2 / R-LIFE-3.
 */
export const STORE_MIGRATIONS: StoreMigration[] = [
  {
    version: 1,
    description:
      "Initial schema: install/directory registry mirror plus the two project-state facets (Playbook run-state and work-execution evidence).",
    statements: [
      // Install and directory registry: a mirror/index of each project's
      // canonical .make-docs/manifest.json (R-MIR-1). Keyed by the
      // manifest-minted project id; root_path is secondary lookup metadata
      // only (R-ID-2) and is local-only data (R-PRIV-1).
      `CREATE TABLE projects (
        project_id TEXT PRIMARY KEY,
        root_path TEXT NOT NULL,
        package_name TEXT,
        package_version TEXT,
        registered_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL
      )`,
      `CREATE INDEX idx_projects_root_path ON projects (root_path)`,
      // Playbook run-state facet: relocated and canonical here (R-MIR-2).
      // The record column holds the run record as opaque JSON; its shape and
      // progression semantics are owned by the W18 R7 lineage (R-SCOPE-1).
      `CREATE TABLE playbook_runs (
        project_id TEXT NOT NULL,
        run_id TEXT NOT NULL,
        record TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (project_id, run_id)
      )`,
      // Work-execution evidence facet: recorded sign-offs and decisions that
      // cannot be re-derived from the repository or git (R-PS-1). Keyed by
      // project id plus the canonical work-item identity components (wave
      // slug, phase path) produced by the work-item identity resolver
      // (R-PS-3); repo_root is secondary metadata, never the key (R-ID-2).
      `CREATE TABLE work_evidence (
        project_id TEXT NOT NULL,
        wave_slug TEXT NOT NULL,
        phase_path TEXT NOT NULL,
        evidence_kind TEXT NOT NULL,
        payload TEXT NOT NULL,
        repo_root TEXT,
        recorded_at TEXT NOT NULL,
        PRIMARY KEY (project_id, wave_slug, phase_path, evidence_kind)
      )`,
      `CREATE INDEX idx_work_evidence_project ON work_evidence (project_id)`,
    ],
  },
  {
    version: 2,
    description:
      "Checkpoint 9: general lifecycle runs and bounded evidence references, without changing legacy Playbook state.",
    statements: [
      `CREATE TABLE runs (
        project_id TEXT NOT NULL CHECK (length(project_id) BETWEEN 1 AND 160),
        run_id TEXT NOT NULL CHECK (length(run_id) BETWEEN 1 AND 160),
        run_type TEXT NOT NULL CHECK (run_type = 'lifecycle'),
        lifecycle_stage TEXT NOT NULL CHECK (lifecycle_stage IN (
          'design', 'plan', 'prd', 'work', 'implementation', 'release', 'archive', 'retrospective'
        )),
        status TEXT NOT NULL CHECK (status IN (
          'active', 'paused', 'completed', 'failed', 'abandoned'
        )),
        checkpoint TEXT CHECK (checkpoint IS NULL OR length(checkpoint) BETWEEN 1 AND 256),
        version INTEGER NOT NULL CHECK (version >= 1),
        metadata TEXT NOT NULL CHECK (length(metadata) <= 4096),
        started_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        finished_at TEXT,
        PRIMARY KEY (project_id, run_id)
      )`,
      `CREATE INDEX idx_runs_project_status
       ON runs (project_id, status, started_at, run_id)`,
      `CREATE TABLE run_evidence (
        project_id TEXT NOT NULL CHECK (length(project_id) BETWEEN 1 AND 160),
        run_id TEXT NOT NULL CHECK (length(run_id) BETWEEN 1 AND 160),
        evidence_id TEXT NOT NULL CHECK (length(evidence_id) BETWEEN 1 AND 160),
        evidence_kind TEXT NOT NULL CHECK (length(evidence_kind) BETWEEN 1 AND 64),
        reference_type TEXT NOT NULL CHECK (reference_type IN ('project-path', 'external')),
        reference_value TEXT NOT NULL CHECK (length(reference_value) BETWEEN 1 AND 2048),
        digest TEXT CHECK (
          digest IS NULL OR (
            length(digest) = 71 AND
            substr(digest, 1, 7) = 'sha256:' AND
            substr(digest, 8) NOT GLOB '*[^0-9a-f]*'
          )
        ),
        recorded_at TEXT NOT NULL,
        PRIMARY KEY (project_id, run_id, evidence_id),
        FOREIGN KEY (project_id, run_id) REFERENCES runs (project_id, run_id)
      )`,
      `CREATE INDEX idx_run_evidence_run
       ON run_evidence (project_id, run_id, recorded_at, evidence_id)`,
      `CREATE TABLE store_checkpoint_journal (
        receipt_id TEXT PRIMARY KEY CHECK (length(receipt_id) = 71),
        checkpoint INTEGER NOT NULL CHECK (checkpoint = 9),
        project_root_digest TEXT NOT NULL CHECK (length(project_root_digest) = 64),
        snapshot_id TEXT NOT NULL CHECK (length(snapshot_id) = 71),
        committed_at TEXT NOT NULL,
        receipt_json TEXT NOT NULL CHECK (length(receipt_json) BETWEEN 2 AND 16384)
      )`,
      `CREATE INDEX idx_store_checkpoint_journal_project
       ON store_checkpoint_journal (project_root_digest, checkpoint, committed_at, receipt_id)`,
    ],
  },
  {
    version: 3,
    description: "Store-owned installation ledger, checkout writers, recovery and legacy transfer provenance.",
    statements: [
      `CREATE TABLE installation_checkouts (checkout_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, root_path TEXT NOT NULL UNIQUE, root_device TEXT NOT NULL, root_inode TEXT NOT NULL, created_at TEXT NOT NULL)`,
      `CREATE TABLE installation_ledgers (checkout_id TEXT PRIMARY KEY REFERENCES installation_checkouts(checkout_id), manifest_json TEXT NOT NULL, updated_at TEXT NOT NULL)`,
      `CREATE TABLE installation_operations (operation_id TEXT PRIMARY KEY, checkout_id TEXT NOT NULL REFERENCES installation_checkouts(checkout_id), operation TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('pending','completed','rolled-back')), before_ledger TEXT, after_ledger TEXT, created_at TEXT NOT NULL, finished_at TEXT, plan_complete INTEGER NOT NULL DEFAULT 0)`,
      `CREATE TABLE installation_steps (operation_id TEXT NOT NULL REFERENCES installation_operations(operation_id), ordinal INTEGER NOT NULL, relative_path TEXT NOT NULL, before_json TEXT NOT NULL, after_json TEXT NOT NULL, applied INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(operation_id, ordinal))`,
      `CREATE TABLE installation_locks (root_path TEXT PRIMARY KEY, token TEXT NOT NULL, pid INTEGER NOT NULL, hostname TEXT NOT NULL, acquired_at TEXT NOT NULL)`,
      `CREATE TABLE installation_migration_records (checkout_id TEXT NOT NULL REFERENCES installation_checkouts(checkout_id), kind TEXT NOT NULL CHECK(kind IN ('receipt','quiescence','snapshot','backup','legacy-import')), record_id TEXT NOT NULL, record_json TEXT NOT NULL, PRIMARY KEY(checkout_id,kind,record_id))`,
      `CREATE TABLE installation_transfers (checkout_id TEXT NOT NULL REFERENCES installation_checkouts(checkout_id), source_path TEXT NOT NULL, source_digest TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('imported','removed')), imported_at TEXT NOT NULL, PRIMARY KEY(checkout_id,source_path,source_digest))`,
      `CREATE TABLE tool_operations (operation_id TEXT PRIMARY KEY, operation TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('pending','completed','failed')), pid INTEGER NOT NULL, hostname TEXT NOT NULL, metadata_json TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT)`,
      `CREATE TABLE store_schema_journal (schema_version INTEGER PRIMARY KEY, description TEXT NOT NULL, committed_at TEXT NOT NULL)`,
      `INSERT INTO store_schema_journal VALUES (3, 'Store-owned installation state', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
    ],
  },
  {
    version: 4,
    description: "Platform-neutral checkout path keys and bounded verification evidence.",
    statements: [
      `ALTER TABLE installation_checkouts ADD COLUMN root_path_key TEXT`,
      `ALTER TABLE installation_checkouts ADD COLUMN verified_at TEXT`,
      `ALTER TABLE installation_checkouts ADD COLUMN verification_json TEXT`,
      `UPDATE installation_checkouts
       SET root_path_key = root_path,
           verified_at = created_at,
           verification_json = '{"schemaVersion":1,"kind":"legacy-path-import"}'
       WHERE root_path_key IS NULL`,
      `CREATE INDEX idx_installation_checkouts_path_key
       ON installation_checkouts (root_path_key)`,
      `INSERT INTO store_schema_journal VALUES (
        4,
        'Platform-neutral checkout path verification',
        strftime('%Y-%m-%dT%H:%M:%fZ','now')
      )`,
    ],
  },
  {
    version: 5,
    description: "W22 P5 compatibility bridge: target migration receipts and retired durable object-number identity.",
    statements: [
      `INSERT INTO tool_operations
        (operation_id, operation, status, pid, hostname, metadata_json, started_at, finished_at)
       SELECT
        'compatibility-bridge:w22-p5:v5',
        'compatibility.bridge',
        'pending',
        0,
        'schema-migration',
        '{"schemaVersion":1,"bridgeId":"w22-p5-store-schema-v5","sourceSchemaMaximum":4,"targetSchema":5}',
        strftime('%Y-%m-%dT%H:%M:%fZ','now'),
        NULL
       WHERE EXISTS (SELECT 1 FROM installation_checkouts)
          OR EXISTS (SELECT 1 FROM installation_ledgers)
          OR EXISTS (SELECT 1 FROM installation_transfers)
          OR EXISTS (SELECT 1 FROM store_checkpoint_journal)`,
      `CREATE TABLE store_migration_receipts (
        receipt_id TEXT PRIMARY KEY CHECK (length(receipt_id) = 71),
        operation TEXT NOT NULL CHECK (operation = 'store.schema.migrate'),
        project_root_digest TEXT NOT NULL CHECK (length(project_root_digest) = 64),
        source_schema_version INTEGER NOT NULL CHECK (source_schema_version BETWEEN 0 AND 4),
        target_schema_version INTEGER NOT NULL CHECK (target_schema_version = 5),
        snapshot_id TEXT NOT NULL CHECK (length(snapshot_id) = 71),
        result TEXT NOT NULL CHECK (result = 'completed'),
        committed_at TEXT NOT NULL,
        receipt_json TEXT NOT NULL CHECK (length(receipt_json) BETWEEN 2 AND 16384)
      )`,
      `CREATE INDEX idx_store_migration_receipts_project
       ON store_migration_receipts (project_root_digest, operation, committed_at, receipt_id)`,
      `INSERT INTO store_migration_receipts
        (receipt_id, operation, project_root_digest, source_schema_version,
         target_schema_version, snapshot_id, result, committed_at, receipt_json)
       SELECT receipt_id, 'store.schema.migrate', project_root_digest, 2, 5,
              snapshot_id, 'completed', committed_at, receipt_json
         FROM store_checkpoint_journal`,
      `INSERT INTO installation_migration_records
        (checkout_id, kind, record_id, record_json)
       SELECT checkout_id,
              'legacy-import',
              'w22-p5:checkout-object-numbers:v4',
              json_object(
                'schemaVersion', 1,
                'bridgeId', 'w22-p5-checkout-object-numbers',
                'rootDevice', root_device,
                'rootInode', root_inode,
                'retainedAs', 'legacy-comparison-evidence'
              )
         FROM installation_checkouts`,
      `ALTER TABLE installation_checkouts DROP COLUMN root_device`,
      `ALTER TABLE installation_checkouts DROP COLUMN root_inode`,
      `UPDATE tool_operations
          SET status = 'completed',
              finished_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
        WHERE operation_id = 'compatibility-bridge:w22-p5:v5'
          AND operation = 'compatibility.bridge'
          AND status = 'pending'`,
      `INSERT INTO store_schema_journal VALUES (
        5,
        'W22 P5 compatibility bridge',
        strftime('%Y-%m-%dT%H:%M:%fZ','now')
      )`,
    ],
  },
  {
    version: 6,
    description:
      "W23 R0 P5: optional, rebuildable per-record backlog review cache.",
    statements: [
      `CREATE TABLE backlog_review_cache (
        checkout_id TEXT NOT NULL REFERENCES installation_checkouts(checkout_id) ON DELETE CASCADE,
        record_path TEXT NOT NULL CHECK (
          length(record_path) BETWEEN 1 AND 2048 AND
          substr(record_path, 1, 1) <> '/' AND
          instr(record_path, '\\') = 0
        ),
        record_digest TEXT NOT NULL CHECK (
          length(record_digest) = 64 AND
          record_digest NOT GLOB '*[^0-9a-f]*'
        ),
        snapshot_schema_version INTEGER NOT NULL CHECK (snapshot_schema_version >= 1),
        rule_catalog_version INTEGER NOT NULL CHECK (rule_catalog_version >= 1),
        skill_version INTEGER NOT NULL CHECK (skill_version >= 1),
        fragment_json TEXT NOT NULL CHECK (length(fragment_json) BETWEEN 2 AND 65536),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (
          checkout_id,
          record_path,
          record_digest,
          snapshot_schema_version,
          rule_catalog_version,
          skill_version
        )
      )`,
      `CREATE INDEX idx_backlog_review_cache_checkout_updated
       ON backlog_review_cache (checkout_id, updated_at DESC, record_path)`,
      `INSERT INTO store_schema_journal VALUES (
        6,
        'W23 R0 P5 backlog review cache',
        strftime('%Y-%m-%dT%H:%M:%fZ','now')
      )`,
    ],
  },
  {
    version: 7,
    description:
      "W32 R0 P2: project register, failed installation operations with failure fields and bounded receipt columns, a widened migration receipt check, and the Store write guard.",
    // SQLite changes a CHECK only by a table rebuild. The rebuild runs with
    // foreign key enforcement off, then `PRAGMA foreign_key_check` must pass
    // before the same transaction commits (applyStoreMigrations).
    rebuildsTables: true,
    statements: [
      `CREATE TABLE project_register (
        project_id TEXT PRIMARY KEY CHECK (length(project_id) BETWEEN 1 AND 160),
        project_name TEXT UNIQUE CHECK (
          project_name IS NULL OR (
            length(project_name) BETWEEN 1 AND 64 AND
            project_name GLOB '[a-z]*' AND
            project_name NOT GLOB '*[^a-z0-9-]*'
          )
        ),
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL
      )`,
      `CREATE TABLE installation_operations_v7 (
        operation_id TEXT PRIMARY KEY,
        checkout_id TEXT NOT NULL REFERENCES installation_checkouts(checkout_id),
        operation TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending','completed','rolled-back','failed')),
        before_ledger TEXT,
        after_ledger TEXT,
        created_at TEXT NOT NULL,
        finished_at TEXT,
        plan_complete INTEGER NOT NULL DEFAULT 0,
        failure_code TEXT CHECK (
          failure_code IS NULL OR (
            length(failure_code) BETWEEN 1 AND 64 AND
            failure_code NOT GLOB '*[^a-z0-9-]*'
          )
        ),
        failure_summary TEXT CHECK (failure_summary IS NULL OR length(failure_summary) BETWEEN 1 AND 512),
        failed_stage TEXT CHECK (
          failed_stage IS NULL OR (
            length(failed_stage) BETWEEN 1 AND 64 AND
            failed_stage NOT GLOB '*[^a-z0-9-]*'
          )
        ),
        next_action TEXT CHECK (next_action IS NULL OR length(next_action) BETWEEN 1 AND 1024),
        before_ledger_digest TEXT CHECK (
          before_ledger_digest IS NULL OR (
            length(before_ledger_digest) = 71 AND
            substr(before_ledger_digest, 1, 7) = 'sha256:' AND
            substr(before_ledger_digest, 8) NOT GLOB '*[^0-9a-f]*'
          )
        ),
        after_ledger_digest TEXT CHECK (
          after_ledger_digest IS NULL OR (
            length(after_ledger_digest) = 71 AND
            substr(after_ledger_digest, 1, 7) = 'sha256:' AND
            substr(after_ledger_digest, 8) NOT GLOB '*[^0-9a-f]*'
          )
        ),
        step_count INTEGER CHECK (step_count IS NULL OR step_count >= 0),
        applied_step_count INTEGER CHECK (applied_step_count IS NULL OR applied_step_count >= 0),
        CHECK (applied_step_count IS NULL OR (step_count IS NOT NULL AND applied_step_count <= step_count))
      )`,
      `INSERT INTO installation_operations_v7
        (operation_id, checkout_id, operation, status, before_ledger, after_ledger, created_at, finished_at, plan_complete)
       SELECT operation_id, checkout_id, operation, status, before_ledger, after_ledger, created_at, finished_at, plan_complete
         FROM installation_operations`,
      `DROP TABLE installation_operations`,
      `ALTER TABLE installation_operations_v7 RENAME TO installation_operations`,
      `CREATE TABLE store_migration_receipts_v7 (
        receipt_id TEXT PRIMARY KEY CHECK (length(receipt_id) = 71),
        operation TEXT NOT NULL CHECK (operation = 'store.schema.migrate'),
        project_root_digest TEXT NOT NULL CHECK (length(project_root_digest) = 64),
        source_schema_version INTEGER NOT NULL CHECK (source_schema_version >= 0),
        target_schema_version INTEGER NOT NULL CHECK (target_schema_version >= 5),
        snapshot_id TEXT NOT NULL CHECK (length(snapshot_id) = 71),
        result TEXT NOT NULL CHECK (result = 'completed'),
        committed_at TEXT NOT NULL,
        receipt_json TEXT NOT NULL CHECK (length(receipt_json) BETWEEN 2 AND 16384),
        CHECK (source_schema_version < target_schema_version)
      )`,
      `INSERT INTO store_migration_receipts_v7
        (receipt_id, operation, project_root_digest, source_schema_version,
         target_schema_version, snapshot_id, result, committed_at, receipt_json)
       SELECT receipt_id, operation, project_root_digest, source_schema_version,
              target_schema_version, snapshot_id, result, committed_at, receipt_json
         FROM store_migration_receipts`,
      `DROP TABLE store_migration_receipts`,
      `ALTER TABLE store_migration_receipts_v7 RENAME TO store_migration_receipts`,
      `CREATE INDEX idx_store_migration_receipts_project
       ON store_migration_receipts (project_root_digest, operation, committed_at, receipt_id)`,
      `INSERT INTO store_schema_journal VALUES (
        7,
        'W32 R0 P2 project register, failed operations, receipt columns, and write guard',
        strftime('%Y-%m-%dT%H:%M:%fZ','now')
      )`,
      // The guard triggers come last, after every table exists in its v7 form.
      ...storeWriteGuardStatements([
        "projects", "playbook_runs", "work_evidence", "runs", "run_evidence", "store_checkpoint_journal",
        "installation_checkouts", "installation_ledgers", "installation_operations", "installation_steps",
        "installation_locks", "installation_migration_records", "installation_transfers", "tool_operations",
        "store_schema_journal", "store_migration_receipts", "backlog_review_cache", "project_register",
      ]),
    ],
  },
  {
    version: 8,
    description:
      "W29 R0 P2: work store tables for units, dependencies, links, claims, the per-checkout sync ledger, and sync conflicts, each with the Store write guard.",
    statements: [
      ...WORK_STORE_V8_STATEMENTS,
      `INSERT INTO store_schema_journal VALUES (
        8,
        'W29 R0 P2 work store tables',
        strftime('%Y-%m-%dT%H:%M:%fZ','now')
      )`,
      // Each migration installs the guard triggers of the tables it creates (R-WRITE-GUARD-3).
      ...storeWriteGuardStatements(WORK_STORE_TABLE_NAMES),
    ],
  },
  {
    version: 9,
    description:
      "W30 R0 P2: factory tables for machine tools, capability proofs, plan revisions, workflow bindings, grants, assignments, proof results, and file backups, each with the Store write guard.",
    statements: [
      ...FACTORY_STORE_V9_STATEMENTS,
      `INSERT INTO store_schema_journal VALUES (
        9,
        'W30 R0 P2 factory tables',
        strftime('%Y-%m-%dT%H:%M:%fZ','now')
      )`,
      // Each migration installs the guard triggers of the tables it creates (R-WRITE-GUARD-3).
      ...storeWriteGuardStatements(FACTORY_STORE_TABLE_NAMES),
    ],
  },
];

/** The v7 statement after which the terminal operation receipt columns are backfilled. */
const V7_RECEIPT_BACKFILL_AFTER = "ALTER TABLE installation_operations_v7 RENAME TO installation_operations";

/** SHA-256 of a ledger's exact text as `sha256:<hex>`, or null for a missing ledger (SQL NULL or the text `null`). */
export function storeLedgerDigest(ledger: string | null | undefined): string | null {
  // The text `null` means "no ledger" (a removal writes it), so it has no digest.
  return ledger === null || ledger === undefined || ledger === "null" ? null : `sha256:${createHash("sha256").update(ledger).digest("hex")}`;
}

/**
 * Fill the bounded receipt columns of one terminal installation operation
 * (PRD 38 R-DB-7, W32 R0 P2 T11). The migration backfills existing terminal
 * rows with it, and each commit to `completed` or `rolled-back` calls it in the
 * same transaction.
 */
export function fillInstallationOperationReceipt(db: StoreDatabase, operationId: string): void {
  const row = db.prepare("SELECT before_ledger, after_ledger FROM installation_operations WHERE operation_id = ?")
    .get(operationId) as { before_ledger: string | null; after_ledger: string | null } | undefined;
  if (!row) return;
  const counts = db.prepare(
    "SELECT COUNT(*) AS step_count, COALESCE(SUM(CASE WHEN applied = 1 THEN 1 ELSE 0 END), 0) AS applied_step_count FROM installation_steps WHERE operation_id = ?",
  ).get(operationId) as { step_count: number | bigint; applied_step_count: number | bigint };
  db.prepare(
    `UPDATE installation_operations
        SET before_ledger_digest = ?, after_ledger_digest = ?, step_count = ?, applied_step_count = ?
      WHERE operation_id = ?`,
  ).run(
    storeLedgerDigest(row.before_ledger),
    storeLedgerDigest(row.after_ledger),
    Number(counts.step_count),
    Number(counts.applied_step_count),
    operationId,
  );
}

function backfillTerminalOperationReceipts(db: StoreDatabase): void {
  const rows = db.prepare(
    "SELECT operation_id FROM installation_operations WHERE status IN ('completed','rolled-back') ORDER BY operation_id",
  ).all() as Array<{ operation_id: string }>;
  for (const row of rows) fillInstallationOperationReceipt(db, row.operation_id);
}

/** Thrown when the database was written by a newer CLI schema (R-DB-2). */
export class StoreSchemaNewerError extends Error {
  readonly code = "store-unavailable";
  readonly databaseSchemaVersion: number;
  readonly cliSchemaVersion: number;
  readonly issue: StoreIssue;

  constructor(databaseSchemaVersion: number, cliSchemaVersion: number, databasePath: string) {
    const issue: StoreIssue = { code: "schema-newer", path: databasePath, operation: "open Store", retryable: false, attempts: 1, waitedMs: 0, cause: `The Store uses schema version ${databaseSchemaVersion}, but this CLI supports up to version ${cliSchemaVersion}.` };
    super(formatStoreIssue(issue));
    this.name = "StoreSchemaNewerError";
    this.databaseSchemaVersion = databaseSchemaVersion;
    this.cliSchemaVersion = cliSchemaVersion;
    this.issue = issue;
  }
}

export type StoreIssueCode =
  | "access-denied"
  | "read-only-filesystem"
  | "sqlite-unavailable"
  | "contention-timeout"
  | "io-error"
  | "unsafe-path"
  | "corrupt"
  | "schema-newer"
  | "schema-unknown"
  | "owner-unverified"
  /** A write guard trigger is missing or changed (PRD 38 R-WRITE-GUARD-4). */
  | "changed-outside";

/** Structured detail for CLI and MCP Store failures. */
export interface StoreIssue {
  code: StoreIssueCode;
  path: string;
  operation: string;
  systemCode?: string;
  retryable: boolean;
  attempts: number;
  waitedMs: number;
  cause: string;
}

/** Thrown when the Store cannot be used safely. */
export class StoreUnavailableError extends Error {
  readonly code = "store-unavailable";
  readonly issue: StoreIssue;

  constructor(reason: string | StoreIssue) {
    const issue = typeof reason === "string"
      ? makeStoreIssue("io-error", "Store", "open", new Error(reason))
      : reason;
    super(formatStoreIssue(issue));
    this.name = "StoreUnavailableError";
    this.issue = issue;
  }
}

/** Formats one cause without hiding it behind a generic Store state. */
export function formatStoreIssue(
  issue: StoreIssue,
  context: { projectMutationStarted?: boolean; pendingOperationId?: string; operationFailed?: boolean } = {},
): string {
  let summary: string;
  switch (issue.code) {
    case "access-denied":
      summary = `Make Docs cannot access the Store at ${issue.path}. This process needs read and write access to the Store directory and its SQLite support files.`;
      break;
    case "read-only-filesystem":
      summary = `Make Docs cannot write the Store at ${issue.path} because the file system is read-only.`;
      break;
    case "sqlite-unavailable":
      summary = `Make Docs cannot ${issue.operation} the Store at ${issue.path} because SQLite support is not available. ${issue.cause}`;
      break;
    case "contention-timeout":
      summary = `Make Docs waited ${Math.ceil(issue.waitedMs / 1000)} seconds to ${issue.operation} at ${issue.path}. ${issue.cause}`;
      break;
    case "unsafe-path":
      summary = `Unsafe Store path: ${issue.path}. Make Docs refused it. ${issue.cause}`;
      break;
    case "corrupt":
    case "schema-unknown":
      summary = `Make Docs preserved the Store at ${issue.path}. ${issue.cause}`;
      break;
    case "schema-newer":
      summary = `Make Docs preserved the Store at ${issue.path}. The Store uses a newer schema. ${issue.cause}`;
      break;
    case "owner-unverified":
      summary = `Make Docs cannot verify the Store owner at ${issue.path}. ${issue.cause}`;
      break;
    case "changed-outside":
      summary = `Make Docs preserved the Store at ${issue.path}. The Store was ${STORE_CHANGED_OUTSIDE_REASON}: ${issue.cause}`;
      break;
    default:
      summary = `Make Docs could not complete the Store operation "${issue.operation}" at ${issue.path}${issue.systemCode ? ` (${issue.systemCode})` : ""}. ${issue.cause}`;
  }
  if (context.projectMutationStarted) {
    return `${summary} Project files may have changed.${context.pendingOperationId ? ` ${context.operationFailed ? "Failed" : "Pending"} operation: ${context.pendingOperationId}.` : ""} Run make-docs project state status before recovery.`;
  }
  const action = issue.code === "access-denied"
    ? "Give this process Store access, then run the command again."
    : issue.code === "contention-timeout"
      ? "Wait for the owner to finish, then run the command again."
      : issue.code === "owner-unverified"
        ? "Verify the owner before you recover its lease."
        : issue.code === "sqlite-unavailable"
          ? "Use a supported Node.js runtime with SQLite, then run the command again."
          : issue.code === "schema-newer"
            ? "Update make-docs to a version that supports this Store."
            : issue.code === "corrupt" || issue.code === "schema-unknown"
              ? "Repair or restore this Store before you run the command again. Do not create a replacement Store."
              : issue.code === "changed-outside"
                ? storeChangedOutsideNextAction(path.dirname(issue.path))
          : "Correct the Store condition and run the command again.";
  return `${summary} No project files changed. ${action}`;
}

/** An existing Store needs the explicit checkpoint-9 migration path. */
export class StoreMigrationRequiredError extends Error {
  readonly databaseSchemaVersion: number;
  readonly cliSchemaVersion: number;

  constructor(databaseSchemaVersion: number, cliSchemaVersion: number, databasePath: string) {
    super(
      `The make-docs store database at ${databasePath} uses schema version ${databaseSchemaVersion} ` +
        `and requires the explicit checkpoint-9 migration to version ${cliSchemaVersion}. ` +
        "Run the reviewed Make Docs update or setup migration before other Store operations.",
    );
    this.name = "StoreMigrationRequiredError";
    this.databaseSchemaVersion = databaseSchemaVersion;
    this.cliSchemaVersion = cliSchemaVersion;
  }
}

export type StoreCheckpoint9Classification =
  | { state: "absent"; databasePath: string; schemaVersion: null }
  | { state: "supported-current"; databasePath: string; schemaVersion: 9 }
  | { state: "supported-legacy"; databasePath: string; schemaVersion: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 }
  | { state: "newer-unknown"; databasePath: string; schemaVersion: number; reason: string; issue?: StoreIssue }
  | { state: "corrupt"; databasePath: string; schemaVersion: null; reason: string; issue?: StoreIssue }
  | { state: "unknown"; databasePath: string; schemaVersion: number; reason: string; issue?: StoreIssue }
  | { state: "indeterminate"; databasePath: string; schemaVersion: null; reason: string; issue: StoreIssue };

export type UnsafeStoreCheckpoint9Classification = Extract<
  StoreCheckpoint9Classification,
  { state: "newer-unknown" | "corrupt" | "unknown" | "indeterminate" }
>;

export class StoreCheckpoint9StateError extends Error {
  readonly code = "store-unavailable";
  readonly issue: StoreIssue;

  constructor(readonly classification: UnsafeStoreCheckpoint9Classification) {
    const issue = classification.issue ?? makeStoreIssue(
      classification.state === "corrupt" ? "corrupt" : classification.state === "newer-unknown" ? "schema-newer" : "schema-unknown",
      classification.databasePath,
      "inspect Store",
      new Error(classification.reason),
    );
    super(formatStoreIssue(issue));
    this.name = "StoreCheckpoint9StateError";
    this.issue = issue;
  }
}

export interface StoreCheckpoint9JournalEntry {
  receiptId: string;
  checkpoint: 9;
  projectRootDigest: string;
  snapshotId: string;
  committedAt: string;
  receiptJson: string;
}

export type SqliteDriverResult =
  | { available: true; sqlite: SqliteModule }
  | { available: false; reason: string };

let cachedDriver: SqliteDriverResult | null = null;

/**
 * Loads the built-in `node:sqlite` driver if this runtime provides it.
 * The result is cached for the process lifetime.
 */
export function loadSqliteDriver(): SqliteDriverResult {
  if (cachedDriver) {
    return cachedDriver;
  }
  try {
    const require = createRequire(import.meta.url);
    const sqlite = require("node:sqlite") as SqliteModule;
    cachedDriver = { available: true, sqlite };
  } catch {
    cachedDriver = {
      available: false,
      reason: `this Node runtime (${process.version}) does not provide the built-in node:sqlite module (Make Docs requires Node >= 24.0.0 with node:sqlite enabled).`,
    };
  }
  return cachedDriver;
}

export interface OpenStoreDatabaseResult {
  db: StoreDatabase;
  databasePath: string;
  /** True when no database file existed and a fresh one was created. */
  created: boolean;
  /**
   * Always false today. A corrupt or unknown Store is kept and refused, never
   * replaced (R-DB-4), so no open quarantines a database. The field stays for
   * the bootstrap report shape.
   */
  recovered: boolean;
  /** Always null today; see `recovered`. */
  quarantinedPath: string | null;
  /** Schema version before this open (null for a fresh database). */
  previousSchemaVersion: number | null;
  /** Schema version after migrations (always {@link CURRENT_STORE_SCHEMA_VERSION}). */
  schemaVersion: number;
}

/**
 * Opens the store database. Fresh databases replay the full schema. Existing
 * legacy databases always require the explicit checkpoint-9 migration entry
 * point. The ordinary open path cannot bypass its journal transaction.
 *
 * - Missing file: created fresh at the current schema (R-DB-4).
 * - Corrupt or unknown file: preserved; the caller reports Store unavailable.
 * - Newer schema: throws {@link StoreSchemaNewerError} without reading or
 *   writing any table (R-DB-2).
 * - Missing driver: throws {@link StoreUnavailableError}.
 */
export function openStoreDatabase(
  storeRoot: string,
  options: { recoverCorrupt?: boolean } = {},
): OpenStoreDatabaseResult {
  const driver = loadSqliteDriver();
  if (!driver.available) throw new StoreUnavailableError({
    code: "sqlite-unavailable",
    path: getStoreDatabasePath(storeRoot),
    operation: "open",
    retryable: false,
    attempts: 1,
    waitedMs: 0,
    cause: driver.reason,
  });
  const release = acquireStoreAccess(storeRoot);
  let db: StoreDatabase | null = null;
  try {
    const classification = classifyStoreCheckpoint9State(storeRoot);
    const databasePath = getStoreDatabasePath(storeRoot);
    if (classification.state === "newer-unknown") throw new StoreSchemaNewerError(classification.schemaVersion, CURRENT_STORE_SCHEMA_VERSION, databasePath);
    if (classification.state === "supported-legacy") throw new StoreMigrationRequiredError(classification.schemaVersion, CURRENT_STORE_SCHEMA_VERSION, databasePath);
    if (classification.state !== "absent" && classification.state !== "supported-current") throw new StoreCheckpoint9StateError(classification);
    db = connect(driver.sqlite, databasePath, classification.state !== "absent");
    if (classification.state === "absent") applyStoreMigrations(db, 0);
    const close = db.close.bind(db);
    db.close = () => { try { close(); } finally { release(); } };
    return {db, databasePath, created: classification.state === "absent", recovered: false, quarantinedPath: null, previousSchemaVersion: classification.schemaVersion, schemaVersion: CURRENT_STORE_SCHEMA_VERSION};
  } catch (error) { closeQuietly(db); release(); throw error; }
}

interface StoreLeaseSnapshot {
  file: string;
  stat: Stats;
  bytes: Buffer;
  token: string;
  pid: number;
  hostname: string;
}

export interface StoreSessionRecoveryResult {
  removed: string[];
  active: Array<{ file: string; pid: number; hostname: string }>;
}

/** One process lease is shared by all nested Store calls in that process. */
const accessLeases = new Map<string, { count: number; release: () => void }>();

function systemCode(error: unknown): string | undefined {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  return typeof code === "string" ? code : undefined;
}

/**
 * Windows reports EPERM, EACCES, or EBUSY when a process opens or creates a path that another
 * process is deleting. Store session admission races with the cleanup of the empty session
 * directory, so these codes are transient there. Callers retry them only until their deadline.
 */
function isTransientWindowsAccessError(code: string | undefined): boolean {
  return platform.kind === "win32" && new Set(["EPERM", "EACCES", "EBUSY"]).has(code ?? "");
}

/** A Store error that wraps a transient Windows access code. Unsafe-path, ownership, and contention results stay final. */
function isTransientWindowsStoreIssue(error: unknown): boolean {
  return error instanceof StoreUnavailableError &&
    !new Set(["unsafe-path", "owner-unverified", "contention-timeout"]).has(error.issue.code) &&
    isTransientWindowsAccessError(error.issue.systemCode);
}

function readStoreEntry(file: string, operation: string): Stats | null {
  try {
    return lstatSync(file, { throwIfNoEntry: false }) ?? null;
  } catch (error) {
    if (systemCode(error) === "ENOENT") return null;
    throw new StoreUnavailableError(makeStoreIssue("io-error", file, operation, error));
  }
}

export function makeStoreIssue(
  fallback: StoreIssueCode,
  targetPath: string,
  operation: string,
  error: unknown,
  details: Partial<Pick<StoreIssue, "attempts" | "waitedMs" | "retryable">> = {},
): StoreIssue {
  const code = systemCode(error);
  const issueCode: StoreIssueCode = code === "EACCES" || code === "EPERM"
    ? "access-denied"
    : code === "EROFS"
      ? "read-only-filesystem"
      : fallback;
  return {
    code: issueCode,
    path: targetPath,
    operation,
    ...(code ? { systemCode: code } : {}),
    retryable: details.retryable ?? false,
    attempts: details.attempts ?? 1,
    waitedMs: details.waitedMs ?? 0,
    cause: error instanceof Error ? error.message : String(error),
  };
}

function pause(attempt: number, deadline: number): void {
  const base = Math.min(STORE_WAIT_MAX_MS, STORE_WAIT_MIN_MS * (2 ** Math.min(attempt, 4)));
  const jitter = Math.floor(Math.random() * STORE_WAIT_MIN_MS);
  const remaining = Math.max(0, deadline - Date.now());
  Atomics.wait(waitBuffer, 0, 0, Math.min(remaining, base + jitter));
}

/** Share the bounded retry timing with checkout-level lock acquisition. */
export function waitForStoreRetry(attempt: number, deadline: number): void {
  pause(attempt, deadline);
}

function sameFile(left: Stats, right: Stats): boolean {
  return platform.sameFileObject(left, right, "file");
}

function readOwnerLease(file: string, operation: string, expectedVersion?: number): StoreLeaseSnapshot | null {
  const initial = readStoreEntry(file, operation);
  if (!initial) return null;
  if (!initial.isFile() || initial.isSymbolicLink() || initial.size > 16_384) {
    throw new StoreUnavailableError(makeStoreIssue(
      initial.isSymbolicLink() ? "unsafe-path" : "owner-unverified",
      file,
      operation,
      new Error("The lease owner record is missing or unsafe."),
    ));
  }
  let fd: number;
  try {
    fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  } catch (error) {
    if (systemCode(error) === "ENOENT") return null;
    throw new StoreUnavailableError(makeStoreIssue("io-error", file, operation, error));
  }
  try {
    const stat = fstatSync(fd);
    if (!sameFile(initial, stat)) {
      throw new StoreUnavailableError(makeStoreIssue("owner-unverified", file, operation, new Error("The lease changed during inspection.")));
    }
    const bytes = readFileSync(fd);
    let record: Record<string, unknown>;
    try {
      record = JSON.parse(bytes.toString("utf8")) as Record<string, unknown>;
    } catch {
      throw new StoreUnavailableError(makeStoreIssue("owner-unverified", file, operation, new Error("The lease owner record is unreadable.")));
    }
    if (typeof record.token !== "string" || !record.token || typeof record.hostname !== "string" || !record.hostname ||
      typeof record.pid !== "number" || !Number.isSafeInteger(record.pid) || record.pid <= 0) {
      throw new StoreUnavailableError(makeStoreIssue("owner-unverified", file, operation, new Error("The lease owner record is incomplete.")));
    }
    if (expectedVersion !== undefined && record.version !== expectedVersion) {
      throw new StoreUnavailableError(makeStoreIssue("owner-unverified", file, operation, new Error(`The Store session version is not supported: ${String(record.version)}.`)));
    }
    if (expectedVersion !== undefined && (typeof record.startedAt !== "string" || Number.isNaN(Date.parse(record.startedAt)))) {
      throw new StoreUnavailableError(makeStoreIssue("owner-unverified", file, operation, new Error("The Store session start time is missing or invalid.")));
    }
    return { file, stat, bytes, token: record.token, pid: record.pid, hostname: record.hostname };
  } finally {
    closeSync(fd);
  }
}

function processOwnerState(pid: number, hostname: string, file: string): "alive" | "dead" {
  const state = platform.processLiveness(pid, hostname);
  if (state === "alive" || state === "dead") return state;
  throw new StoreUnavailableError(makeStoreIssue(
    "owner-unverified",
    file,
    "inspect owner",
    new Error("The lease owner is on another host or its state cannot be verified."),
  ));
}

function ownerState(lease: StoreLeaseSnapshot): "alive" | "dead" {
  return processOwnerState(lease.pid, lease.hostname, lease.file);
}

function unlinkLeaseIfUnchanged(lease: StoreLeaseSnapshot): boolean {
  const current = readStoreEntry(lease.file, "verify Store lease");
  if (!current) return false;
  let bytes: Buffer;
  try {
    bytes = readFileSync(lease.file);
  } catch (error) {
    if (systemCode(error) === "ENOENT") return false;
    throw new StoreUnavailableError(makeStoreIssue("io-error", lease.file, "verify Store lease", error));
  }
  if (!sameFile(lease.stat, current) || !bytes.equals(lease.bytes)) {
    throw new StoreUnavailableError(makeStoreIssue("owner-unverified", lease.file, "recover lease", new Error("The lease changed during recovery.")));
  }
  try {
    unlinkSync(lease.file);
  } catch (error) {
    if (systemCode(error) === "ENOENT") return false;
    throw new StoreUnavailableError(makeStoreIssue("io-error", lease.file, "remove stopped Store lease", error));
  }
  return true;
}

function removeOwnedSession(file: string, token: string, stat: Stats | null, operation: string): boolean {
  if (!stat) return false;
  const lease = readOwnerLease(file, operation, STORE_SESSION_VERSION);
  if (!lease || !sameFile(stat, lease.stat) || lease.token !== token) return false;
  return unlinkLeaseIfUnchanged(lease);
}

function removePendingSession(file: string, stat: Stats | null): boolean {
  if (!stat) return false;
  const current = readStoreEntry(file, "clean pending Store session");
  if (!current || !sameFile(stat, current)) return false;
  try {
    unlinkSync(file);
    return true;
  } catch (error) {
    if (systemCode(error) === "ENOENT") return false;
    throw new StoreUnavailableError(makeStoreIssue("io-error", file, "clean pending Store session", error));
  }
}

/** Publish a complete exclusive owner record without an unreadable creation window. */
export function tryCreateExclusiveStoreLease(
  lockPath: string,
  owner: { token: string; pid: number; hostname: string; startedAt?: string },
): { created: true; stat: Stats } | { created: false } {
  const directory = path.dirname(lockPath);
  const pending = path.join(directory, `.pending-${path.basename(lockPath)}.${process.pid}.${randomUUID()}`);
  let fd: number | null = null;
  let stat: Stats | null = null;
  try {
    fd = openSync(pending, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600);
    platform.applyPrivateMode(fd, 0o600);
    writeFileSync(fd, JSON.stringify(owner));
    fsyncSync(fd);
    stat = fstatSync(fd);
    try {
      linkSync(pending, lockPath);
    } catch (error) {
      if (systemCode(error) === "EEXIST") return { created: false };
      throw new StoreUnavailableError(makeStoreIssue("io-error", lockPath, "publish exclusive Store lock", error));
    }
    const published = readStoreEntry(lockPath, "verify exclusive Store lock");
    if (!published || !sameFile(stat, published)) {
      throw new StoreUnavailableError(makeStoreIssue("owner-unverified", lockPath, "verify exclusive Store lock", new Error("The exclusive Store lock changed during publication.")));
    }
    return { created: true, stat };
  } catch (error) {
    if (error instanceof StoreUnavailableError) throw error;
    throw new StoreUnavailableError(makeStoreIssue("io-error", lockPath, "create exclusive Store lock", error));
  } finally {
    if (fd !== null) closeSync(fd);
    removePendingSession(pending, stat);
  }
}

function assertSafeStoreEntry(file: string, operation: string): void {
  const stat = readStoreEntry(file, operation);
  if (stat?.isSymbolicLink()) {
    throw new StoreUnavailableError(makeStoreIssue("unsafe-path", file, operation, new Error("Symbolic links are not allowed for Store state.")));
  }
}

function exclusiveBlocker(storeRoot: string, preparing: boolean): StoreLeaseSnapshot | null {
  const names = ["installation-lease-recovery.lock", "removal.lock", ...(!preparing ? ["installation-bootstrap.lock"] : [])];
  for (const name of names) {
    const file = path.join(storeRoot, name);
    if (!readStoreEntry(file, "inspect Store maintenance lock")) continue;
    const lease = readOwnerLease(file, "wait for Store maintenance");
    if (lease) return lease;
  }
  return null;
}

function cleanupAccessDirectory(directory: string): void {
  try {
    rmdirSync(directory);
  } catch (error) {
    const code = systemCode(error);
    if (!new Set(["ENOENT", "ENOTEMPTY", "EEXIST"]).has(code ?? "") &&
        !(platform.kind === "win32" && code === "EBUSY")) {
      throw new StoreUnavailableError(makeStoreIssue("io-error", directory, "clean session directory", error));
    }
  }
}

/** Inspect shared sessions and remove only proven-dead local owners. */
export function recoverDeadStoreAccessSessions(storeRoot: string, remove = true): StoreSessionRecoveryResult {
  const root = path.resolve(storeRoot);
  const directory = path.join(root, STORE_ACCESS_PATH);
  const stat = readStoreEntry(directory, "recover Store sessions");
  if (!stat) return { removed: [], active: [] };
  if (stat.isSymbolicLink()) {
    throw new StoreUnavailableError(makeStoreIssue("unsafe-path", directory, "recover Store sessions", new Error("The Store access path is a symbolic link.")));
  }
  if (!stat.isFile() && !stat.isDirectory()) {
    throw new StoreUnavailableError(makeStoreIssue("unsafe-path", directory, "recover Store sessions", new Error("The Store access path is not a file or directory.")));
  }
  let files: string[];
  try {
    files = stat.isFile()
      ? [directory]
      : readdirSync(directory).sort().map((entry) => path.join(directory, entry));
  } catch (error) {
    if (systemCode(error) === "ENOENT") return { removed: [], active: [] };
    throw new StoreUnavailableError(makeStoreIssue("io-error", directory, "read Store sessions", error));
  }
  const removed: string[] = [];
  const active: StoreSessionRecoveryResult["active"] = [];
  for (const file of files) {
    const pending = /^\.pending-(\d+)\.([A-Za-z0-9_-]+)\.[0-9a-f-]+$/.exec(path.basename(file));
    if (pending) {
      const stat = readStoreEntry(file, "recover pending Store session");
      if (!stat) continue;
      if (!stat.isFile() || stat.isSymbolicLink()) {
        throw new StoreUnavailableError(makeStoreIssue("unsafe-path", file, "recover Store sessions", new Error("The pending session path is unsafe.")));
      }
      const pid = Number(pending[1]);
      let hostname: string;
      if (/^h[0-9a-f]{16}$/.test(pending[2])) {
        if (pending[2] !== storeSessionHostTag(platform.hostname)) {
          throw new StoreUnavailableError(makeStoreIssue("owner-unverified", file, "recover Store sessions", new Error("The pending session owner is on another host.")));
        }
        hostname = platform.hostname;
      } else try {
        hostname = Buffer.from(pending[2], "base64url").toString("utf8");
      } catch {
        throw new StoreUnavailableError(makeStoreIssue("owner-unverified", file, "recover Store sessions", new Error("The pending session owner is unreadable.")));
      }
      if (!Number.isSafeInteger(pid) || pid <= 0 || !hostname) {
        throw new StoreUnavailableError(makeStoreIssue("owner-unverified", file, "recover Store sessions", new Error("The pending session owner is incomplete.")));
      }
      if (processOwnerState(pid, hostname, file) === "alive") {
        active.push({ file, pid, hostname });
      } else if (remove) {
        if (removePendingSession(file, stat)) {
          removed.push(path.relative(root, file).split(path.sep).join(path.posix.sep));
        }
      }
      continue;
    }
    const lease = readOwnerLease(file, "recover Store sessions", stat.isDirectory() ? STORE_SESSION_VERSION : undefined);
    if (!lease) continue;
    if (ownerState(lease) === "alive") {
      active.push({ file, pid: lease.pid, hostname: lease.hostname });
    } else if (remove && unlinkLeaseIfUnchanged(lease)) {
      removed.push(path.relative(root, file).split(path.sep).join(path.posix.sep));
    }
  }
  if (remove && stat.isDirectory() && active.length === 0) cleanupAccessDirectory(directory);
  return { removed, active };
}

/** Wait until an exclusive maintenance task can safely open or remove the Store. */
export function waitForStoreAccessToDrain(storeRoot: string, timeoutMs = STORE_OWNER_WAIT_MS): string[] {
  const started = Date.now();
  const deadline = started + timeoutMs;
  let attempt = 0;
  const removed: string[] = [];
  while (true) {
    let result: StoreSessionRecoveryResult;
    try {
      result = recoverDeadStoreAccessSessions(storeRoot);
    } catch (error) {
      const code = error instanceof StoreUnavailableError ? error.issue.systemCode : systemCode(error);
      if (isTransientWindowsAccessError(code) && Date.now() < deadline) {
        pause(attempt++, deadline);
        continue;
      }
      throw error;
    }
    removed.push(...result.removed);
    if (result.active.length === 0) return removed;
    if (Date.now() >= deadline) {
      throw new StoreUnavailableError({
        code: "contention-timeout",
        path: path.join(path.resolve(storeRoot), STORE_ACCESS_PATH),
        operation: "wait for Store sessions",
        retryable: true,
        attempts: attempt + 1,
        waitedMs: Date.now() - started,
        cause: `A live process still owns a Store session (${result.active.map((owner) => owner.pid).join(", ")}).`,
      });
    }
    pause(attempt++, deadline);
  }
}

/** Acquire one shared Store session. Nested calls in this process reuse it. */
export function acquireStoreAccess(storeRoot: string, preparing = false, timeoutMs = STORE_OWNER_WAIT_MS): () => void {
  const requestedStoreRoot = path.resolve(storeRoot);
  try {
    storeRoot = platform.describePath(requestedStoreRoot).canonicalPath;
  } catch (error) {
    throw new StoreUnavailableError(makeStoreIssue("io-error", requestedStoreRoot, "resolve Store root", error));
  }
  const prior = accessLeases.get(storeRoot);
  if (prior) {
    prior.count++;
    let done = false;
    return () => {
      if (!done) {
        done = true;
        prior.release();
      }
    };
  }

  const started = Date.now();
  const deadline = started + timeoutMs;
  let attempt = 0;
  while (true) {
    try {
      for (const suffix of ["store.db", "store.db-wal", "store.db-shm", STORE_ACCESS_PATH, "removal.lock", "installation-bootstrap.lock", "installation-lease-recovery.lock"]) {
        assertSafeStoreEntry(path.join(storeRoot, suffix), "open Store session");
      }
      try {
        mkdirSync(storeRoot, { recursive: true, mode: 0o700 });
      } catch (error) {
        throw new StoreUnavailableError(makeStoreIssue("io-error", storeRoot, "create", error));
      }

      const blocker = exclusiveBlocker(storeRoot, preparing);
      if (blocker) {
        if (blocker.pid === process.pid && blocker.hostname === platform.hostname) {
          throw new StoreUnavailableError({ code: "contention-timeout", path: blocker.file, operation: "open a Store session", retryable: false, attempts: attempt + 1, waitedMs: Date.now() - started, cause: "This process already owns the exclusive Store lock." });
        }
        if (ownerState(blocker) !== "alive") {
          throw new StoreUnavailableError(makeStoreIssue("owner-unverified", blocker.file, "wait for Store maintenance", new Error("A stopped maintenance owner requires lease recovery.")));
        }
        if (Date.now() >= deadline) {
          throw new StoreUnavailableError({ code: "contention-timeout", path: blocker.file, operation: "wait for Store maintenance", retryable: true, attempts: attempt + 1, waitedMs: Date.now() - started, cause: `Process ${blocker.pid} is still active.` });
        }
        pause(attempt++, deadline);
        continue;
      }

      const directory = path.join(storeRoot, STORE_ACCESS_PATH);
      const existing = readStoreEntry(directory, "open Store session");
      if (existing?.isFile()) {
        const legacy = readOwnerLease(directory, "open legacy Store session");
        if (!legacy) continue;
        if (ownerState(legacy) === "dead") {
          unlinkLeaseIfUnchanged(legacy);
          continue;
        }
        if (Date.now() >= deadline) {
          throw new StoreUnavailableError({ code: "contention-timeout", path: directory, operation: "wait for legacy Store session", retryable: true, attempts: attempt + 1, waitedMs: Date.now() - started, cause: `Process ${legacy.pid} is still active.` });
        }
        pause(attempt++, deadline);
        continue;
      }
      if (existing && !existing.isDirectory()) {
        throw new StoreUnavailableError(makeStoreIssue("unsafe-path", directory, "open Store session", new Error("The Store access path is not a directory.")));
      }
      if (existing?.isDirectory()) {
        try {
          recoverDeadStoreAccessSessions(storeRoot);
        } catch (error) {
          const code = error instanceof StoreUnavailableError ? error.issue.systemCode : systemCode(error);
          if (isTransientWindowsAccessError(code) && Date.now() < deadline) {
            pause(attempt++, deadline);
            continue;
          }
          throw error;
        }
      }
      try {
        mkdirSync(directory, { mode: 0o700 });
      } catch (error) {
        if (isTransientWindowsAccessError(systemCode(error)) && Date.now() < deadline) {
          pause(attempt++, deadline);
          continue;
        }
        if (systemCode(error) !== "EEXIST") throw new StoreUnavailableError(makeStoreIssue("io-error", directory, "create session directory", error));
      }
      let directoryFd: number | null = null;
      try {
        directoryFd = openSync(directory, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
        const opened = fstatSync(directoryFd);
        const named = readStoreEntry(directory, "verify session directory");
        if (!named) {
          if (Date.now() < deadline) {
            pause(attempt++, deadline);
            continue;
          }
          throw Object.assign(new Error("The Store session directory disappeared."), { code: "ENOENT" });
        }
        if (named.isSymbolicLink() || !named.isDirectory()) {
          throw new StoreUnavailableError(makeStoreIssue("unsafe-path", directory, "verify session directory", new Error("The Store session path is not a safe directory.")));
        }
        if (!platform.sameFileObject(opened, named, "directory")) {
          if (Date.now() < deadline) {
            pause(attempt++, deadline);
            continue;
          }
          throw new StoreUnavailableError(makeStoreIssue("owner-unverified", directory, "verify session directory", new Error("The Store session directory changed during admission.")));
        }
        platform.applyPrivateMode(directoryFd, 0o700);
      } catch (error) {
        if (error instanceof StoreUnavailableError) throw error;
        const code = systemCode(error);
        if ((code === "ENOENT" || isTransientWindowsAccessError(code)) && Date.now() < deadline) {
          pause(attempt++, deadline);
          continue;
        }
        throw new StoreUnavailableError(makeStoreIssue(code === "ELOOP" ? "unsafe-path" : "io-error", directory, "secure session directory", error));
      } finally {
        if (directoryFd !== null) closeSync(directoryFd);
      }

      const token = randomUUID();
      const file = path.join(directory, `${token}.json`);
      const pendingFile = path.join(directory, storeSessionPendingName(process.pid, platform.hostname, token));
      let fd: number | null = null;
      let leaseStat: Stats | null = null;
      // Identity of the pending file as created, so a failed attempt can remove its own file before a retry.
      let createdStat: Stats | null = null;
      try {
        // O_EXCL makes an existing file or link fail. macOS rejects O_NOFOLLOW
        // when O_CREAT creates a new file, so it must not be used here.
        fd = openSync(pendingFile, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600);
        createdStat = fstatSync(fd);
        platform.applyPrivateMode(fd, 0o600);
        writeFileSync(fd, JSON.stringify({ version: STORE_SESSION_VERSION, token, pid: process.pid, hostname: platform.hostname, startedAt: new Date().toISOString() }));
        fsyncSync(fd);
        leaseStat = fstatSync(fd);
        platform.atomicReplace(pendingFile, file);
        const lateBlocker = exclusiveBlocker(storeRoot, preparing);
        if (lateBlocker) {
          closeSync(fd);
          fd = null;
          removeOwnedSession(file, token, leaseStat, "cancel Store session");
          cleanupAccessDirectory(directory);
          if (lateBlocker.pid === process.pid && lateBlocker.hostname === platform.hostname) {
            throw new StoreUnavailableError({ code: "contention-timeout", path: lateBlocker.file, operation: "open a Store session", retryable: false, attempts: attempt + 1, waitedMs: Date.now() - started, cause: "This process already owns the exclusive Store lock." });
          }
          if (ownerState(lateBlocker) !== "alive") {
            throw new StoreUnavailableError(makeStoreIssue("owner-unverified", lateBlocker.file, "wait for Store maintenance", new Error("A stopped maintenance owner requires lease recovery.")));
          }
          if (Date.now() >= deadline) {
            throw new StoreUnavailableError({ code: "contention-timeout", path: lateBlocker.file, operation: "wait for Store maintenance", retryable: true, attempts: attempt + 1, waitedMs: Date.now() - started, cause: `Process ${lateBlocker.pid} is still active.` });
          }
          pause(attempt++, deadline);
          continue;
        }

        let released = false;
        const lease = { count: 1, release: () => {} };
        const release = () => {
          if (released || --lease.count > 0) return;
          released = true;
          accessLeases.delete(storeRoot);
          try {
            removeOwnedSession(file, token, leaseStat, "release Store session");
            cleanupAccessDirectory(directory);
          } finally {
            if (fd !== null) closeSync(fd);
          }
        };
        lease.release = release;
        accessLeases.set(storeRoot, lease);
        return release;
      } catch (error) {
        if (fd !== null) closeSync(fd);
        removeOwnedSession(file, token, leaseStat, "clean failed Store session");
        removePendingSession(pendingFile, leaseStat ?? createdStat);
        cleanupAccessDirectory(directory);
        if (error instanceof StoreUnavailableError) throw error;
        const code = systemCode(error);
        const retryableSessionOpenError = new Set(["ENOENT", "EEXIST", "ENOTEMPTY"]).has(code ?? "")
          || (platform.kind === "darwin" && code === "EINVAL")
          || isTransientWindowsAccessError(code);
        if (retryableSessionOpenError && Date.now() < deadline) {
          pause(attempt++, deadline);
          continue;
        }
        throw new StoreUnavailableError(makeStoreIssue("io-error", file, "open Store session", error, { attempts: attempt + 1, waitedMs: Date.now() - started }));
      }
    } catch (error) {
      // Windows also reports a transient access code from the safety reads between these steps,
      // because the same session path can be pending deletion. Retry those until the deadline.
      if (isTransientWindowsStoreIssue(error) && Date.now() < deadline) {
        pause(attempt++, deadline);
        continue;
      }
      throw error;
    }
  }
}

export interface StoreCheckpoint9MigrationResult {
  databasePath: string;
  previousSchemaVersion: number | null;
  schemaVersion: number;
  migrated: boolean;
  journal: StoreCheckpoint9JournalEntry | null;
  /** Verified pre-conversion Store backup. Null for a fresh or current Store. */
  backupPath: string | null;
}

export type StoreCheckpoint9Requirement =
  | "absent"
  | "current"
  | "migration-required";

const VERSION_ONE_TABLES = ["playbook_runs", "projects", "work_evidence"] as const;
const VERSION_TWO_TABLES = [
  ...VERSION_ONE_TABLES,
  "run_evidence",
  "runs",
  "store_checkpoint_journal",
] as const;

const VERSION_THREE_TABLES = [...VERSION_TWO_TABLES, "installation_checkouts", "installation_ledgers", "installation_operations", "installation_steps", "installation_locks", "installation_migration_records", "installation_transfers", "tool_operations", "store_schema_journal"] as const;
const VERSION_FOUR_TABLES = VERSION_THREE_TABLES;
const VERSION_FIVE_TABLES = [...VERSION_FOUR_TABLES, "store_migration_receipts"] as const;
const VERSION_SIX_TABLES = [...VERSION_FIVE_TABLES, "backlog_review_cache"] as const;
const VERSION_SEVEN_TABLES = [...VERSION_SIX_TABLES, "project_register"] as const;
const VERSION_EIGHT_TABLES = [...VERSION_SEVEN_TABLES, ...WORK_STORE_TABLE_NAMES] as const;
const VERSION_NINE_TABLES = [...VERSION_EIGHT_TABLES, ...FACTORY_STORE_TABLE_NAMES] as const;

/** Tables that a supported schema version must have, or null for an unsupported version. */
function expectedTablesForVersion(version: number): readonly string[] | null {
  switch (version) {
    case 1: return VERSION_ONE_TABLES;
    case 2: return VERSION_TWO_TABLES;
    case 3: return VERSION_THREE_TABLES;
    case 4: return VERSION_FOUR_TABLES;
    case 5: return VERSION_FIVE_TABLES;
    case 6: return VERSION_SIX_TABLES;
    case 7: return VERSION_SEVEN_TABLES;
    case 8: return VERSION_EIGHT_TABLES;
    case 9: return VERSION_NINE_TABLES;
    default: return null;
  }
}

/** Classifies the Store without creating a directory, database, sidecar, or table. */
export function classifyStoreCheckpoint9State(
  storeRoot: string,
): StoreCheckpoint9Classification {
  const databasePath = getStoreDatabasePath(storeRoot);
  let databaseEntry: Stats | null;
  try {
    databaseEntry = readStoreEntry(databasePath, "inspect Store database");
  } catch (error) {
    const issue = error instanceof StoreUnavailableError
      ? error.issue
      : makeStoreIssue("io-error", databasePath, "inspect Store database", error);
    return { state: "indeterminate", databasePath, schemaVersion: null, reason: issue.cause, issue };
  }
  if (!databaseEntry) {
    return { state: "absent", databasePath, schemaVersion: null };
  }
  if (databaseEntry.isSymbolicLink() || !databaseEntry.isFile()) {
    const issue = makeStoreIssue(
      "unsafe-path",
      databasePath,
      "inspect Store database",
      new Error(databaseEntry.isSymbolicLink()
        ? "The Store database is a symbolic link."
        : "The Store database path is not a file."),
    );
    return { state: "indeterminate", databasePath, schemaVersion: null, reason: issue.cause, issue };
  }
  const driver = loadSqliteDriver();
  if (!driver.available) {
    const issue: StoreIssue = {
      code: "sqlite-unavailable",
      path: databasePath,
      operation: "open",
      retryable: false,
      attempts: 1,
      waitedMs: 0,
      cause: driver.reason,
    };
    return {
      state: "indeterminate",
      databasePath,
      schemaVersion: null,
      reason: driver.reason,
      issue,
    };
  }
  let db: StoreDatabase | null = null;
  try {
    db = openSqliteWithRetry(driver.sqlite, databasePath, { readOnly: true }, "inspect", (connection) => {
      connection.exec(`PRAGMA busy_timeout = ${STORE_BUSY_TIMEOUT_MS}`);
    }, false);
    const check = db.prepare("PRAGMA quick_check").get() as
      | { quick_check?: string }
      | undefined;
    if (check?.quick_check !== "ok") {
      const reason = `SQLite quick_check returned ${String(check?.quick_check ?? "no result")}`;
      return {
        state: "corrupt",
        databasePath,
        schemaVersion: null,
        reason,
        issue: { code: "corrupt", path: databasePath, operation: "check Store database", retryable: false, attempts: 1, waitedMs: 0, cause: reason },
      };
    }
    const schemaVersion = readUserVersion(db);
    if (schemaVersion > CURRENT_STORE_SCHEMA_VERSION) {
      const reason = `schema version ${schemaVersion} is newer than supported version ${CURRENT_STORE_SCHEMA_VERSION}`;
      return {
        state: "newer-unknown",
        databasePath,
        schemaVersion,
        reason,
        issue: { code: "schema-newer", path: databasePath, operation: "read schema", retryable: false, attempts: 1, waitedMs: 0, cause: reason },
      };
    }
    const expectedTables = expectedTablesForVersion(schemaVersion);
    if (!expectedTables) {
      const reason = `schema version ${schemaVersion} is not a supported checkpoint-9 input`;
      return {
        state: "unknown",
        databasePath,
        schemaVersion,
        reason,
        issue: { code: "schema-unknown", path: databasePath, operation: "read schema", retryable: false, attempts: 1, waitedMs: 0, cause: reason },
      };
    }
    const actualTables = new Set(
      (db.prepare("SELECT name FROM sqlite_schema WHERE type = 'table'").all() as Array<{ name: string }>)
        .map((row) => row.name),
    );
    const missingTables = expectedTables.filter((name) => !actualTables.has(name));
    if (missingTables.length > 0) {
      const reason = `required schema objects are missing: ${missingTables.join(", ")}`;
      return {
        state: "unknown",
        databasePath,
        schemaVersion,
        reason,
        issue: { code: "schema-unknown", path: databasePath, operation: "read schema", retryable: false, attempts: 1, waitedMs: 0, cause: reason },
      };
    }
    {
      const guardProblems = inspectStoreGuardAndVersion(db);
      if (guardProblems.length > 0) {
        const reason = guardProblems.join(" ");
        return {
          state: "unknown",
          databasePath,
          schemaVersion,
          reason,
          issue: { code: "changed-outside", path: databasePath, operation: "check Store write guard", retryable: false, attempts: 1, waitedMs: 0, cause: reason },
        };
      }
    }
    return schemaVersion < CURRENT_STORE_SCHEMA_VERSION
      ? { state: "supported-legacy", databasePath, schemaVersion: schemaVersion as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 }
      : { state: "supported-current", databasePath, schemaVersion: 9 };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const corrupt = isCorruptDatabaseMessage(reason);
    const contention = isSqliteContention(error);
    const issue = error instanceof StoreUnavailableError
      ? error.issue
      : makeStoreIssue(corrupt ? "corrupt" : contention ? "contention-timeout" : "io-error", databasePath, "inspect", error, contention ? { retryable: true, waitedMs: STORE_BUSY_TIMEOUT_MS } : {});
    return {
      state: corrupt ? "corrupt" : "indeterminate",
      databasePath,
      schemaVersion: null,
      reason,
      issue,
    };
  } finally {
    closeQuietly(db);
  }
}

/**
 * Inspects an existing Store without recovery or schema writes. Checkpoint 9
 * uses this before fresh-project and no-op install paths.
 */
export function inspectStoreCheckpoint9Requirement(
  storeRoot: string,
): StoreCheckpoint9Requirement {
  const classification = classifyStoreCheckpoint9State(storeRoot);
  if (classification.state === "absent") return "absent";
  if (classification.state === "supported-current") return "current";
  if (classification.state === "supported-legacy") return "migration-required";
  throw new StoreCheckpoint9StateError(classification);
}

/**
 * The only explicit checkpoint-9 Store migration entry point. Callers invoke
 * it inside the reviewed immutable migration coordinator.
 */
export function migrateStoreDatabaseAtCheckpoint9(
  storeRoot: string,
  journal: StoreCheckpoint9JournalEntry,
): StoreCheckpoint9MigrationResult {
  const classification = classifyStoreCheckpoint9State(storeRoot);
  if (
    classification.state !== "absent" &&
    classification.state !== "supported-legacy" &&
    classification.state !== "supported-current"
  ) {
    throw new StoreCheckpoint9StateError(classification);
  }
  assertCheckpoint9JournalEntry(journal);
  const driver = loadSqliteDriver();
  if (!driver.available) throw new StoreUnavailableError({ code: "sqlite-unavailable", path: getStoreDatabasePath(storeRoot), operation: "migrate Store", retryable: false, attempts: 1, waitedMs: 0, cause: driver.reason });
  mkdirSync(storeRoot, { recursive: true });
  const databasePath = getStoreDatabasePath(storeRoot);
  const db = connect(driver.sqlite, databasePath, classification.state !== "absent");
  let startingVersion: number | null = null;
  let backupPath: string | null = null;
  try {
    startingVersion = readUserVersion(db);
    if (startingVersion > 0 && startingVersion < CURRENT_STORE_SCHEMA_VERSION) {
      assertStoreBridgeInputSafe(db, startingVersion);
      backupPath = createVerifiedStoreBridgeBackup(db, databasePath, startingVersion);
    }
    if (startingVersion === CURRENT_STORE_SCHEMA_VERSION) {
      db.exec("BEGIN IMMEDIATE");
      assertCheckpoint9StateInsideTransaction(db, databasePath, startingVersion);
      db.exec("COMMIT");
      return {
        databasePath,
        previousSchemaVersion: startingVersion,
        schemaVersion: CURRENT_STORE_SCHEMA_VERSION,
        migrated: false,
        journal: null,
        backupPath: null,
      };
    }
    const sourceVersion = startingVersion;
    const pending = STORE_MIGRATIONS.filter((migration) => migration.version > sourceVersion);
    // The state check, every migration, the receipt, and the version bump share one transaction.
    runStoreMigrationTransaction(db, pending, {
      before: () => assertCheckpoint9StateInsideTransaction(db, databasePath, sourceVersion),
      finish: () => {
        db.prepare(
          `INSERT INTO store_migration_receipts
            (receipt_id, operation, project_root_digest, source_schema_version,
             target_schema_version, snapshot_id, result, committed_at, receipt_json)
           VALUES (?, 'store.schema.migrate', ?, ?, ?, ?, 'completed', ?, ?)`,
        ).run(
          journal.receiptId,
          journal.projectRootDigest,
          sourceVersion,
          CURRENT_STORE_SCHEMA_VERSION,
          journal.snapshotId,
          journal.committedAt,
          journal.receiptJson,
        );
        db.exec(`PRAGMA user_version = ${CURRENT_STORE_SCHEMA_VERSION}`);
      },
    });
    applyStoreFileModes(storeRoot);
    return {
      databasePath,
      previousSchemaVersion: classification.state === "absent" ? null : startingVersion,
      schemaVersion: CURRENT_STORE_SCHEMA_VERSION,
      migrated: true,
      journal,
      backupPath,
    };
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // The transaction may already be closed.
    }
    throw error;
  } finally {
    closeQuietly(db);
  }
}

export function readStoreCheckpoint9JournalEntry(
  storeRoot: string,
  projectRootDigest: string,
): StoreCheckpoint9JournalEntry | null {
  const classification = classifyStoreCheckpoint9State(storeRoot);
  if (classification.state !== "supported-current") return null;
  const driver = loadSqliteDriver();
  if (!driver.available) throw new StoreUnavailableError({ code: "sqlite-unavailable", path: classification.databasePath, operation: "read Store migration journal", retryable: false, attempts: 1, waitedMs: 0, cause: driver.reason });
  const release = acquireStoreAccess(storeRoot);
  let db: StoreDatabase | null = null;
  try {
    db = openSqliteWithRetry(driver.sqlite, classification.databasePath, { readOnly: true }, "read Store migration journal", (connection) => {
      connection.exec(`PRAGMA busy_timeout = ${STORE_BUSY_TIMEOUT_MS}`);
    });
    const row = db.prepare(
      `SELECT receipt_id, checkpoint, project_root_digest, snapshot_id, committed_at, receipt_json
         FROM (
           SELECT receipt_id, 9 AS checkpoint, project_root_digest, snapshot_id, committed_at, receipt_json
             FROM store_migration_receipts
            WHERE operation = 'store.schema.migrate'
           UNION ALL
           SELECT receipt_id, checkpoint, project_root_digest, snapshot_id, committed_at, receipt_json
             FROM store_checkpoint_journal
         )
        WHERE project_root_digest = ? AND checkpoint = 9
        ORDER BY committed_at DESC, receipt_id DESC
        LIMIT 1`,
    ).get(projectRootDigest) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      receiptId: String(row.receipt_id),
      checkpoint: 9,
      projectRootDigest: String(row.project_root_digest),
      snapshotId: String(row.snapshot_id),
      committedAt: String(row.committed_at),
      receiptJson: String(row.receipt_json),
    };
  } finally {
    closeQuietly(db);
    release();
  }
}

/**
 * Opens the store database, runs `fn`, and always closes the connection.
 * This is the standard access pattern: connections stay short-lived so no
 * process holds the write lock across user-visible waits.
 */
export function withStoreDatabase<T>(
  storeRoot: string,
  fn: (db: StoreDatabase, open: OpenStoreDatabaseResult) => T,
): T {
  const open = openStoreDatabase(storeRoot);
  try {
    return fn(open.db, open);
  } finally {
    closeQuietly(open.db);
  }
}

/**
 * Applies all migrations above `fromVersion` in order, each inside a
 * `BEGIN IMMEDIATE` transaction paired with the `user_version` bump so a
 * migration either fully lands with its version or not at all (R-DB-2).
 */
export function applyStoreMigrations(db: StoreDatabase, fromVersion: number): number {
  const initialVersion = fromVersion;
  let version = fromVersion;
  // Make Docs code is the caller, so this connection may write through the guard.
  registerStoreWriteGuard(db);
  const row = db.prepare("PRAGMA database_list").all() as Array<{ name: string; file: string }>;
  const databasePath = row.find((entry) => entry.name === "main")?.file ?? "";
  if (initialVersion > 0 && STORE_MIGRATIONS.some((migration) => migration.version > initialVersion)) {
    // One verified backup of the existing Store before its first migration (R-DB-5).
    assertStoreBridgeInputSafe(db, initialVersion);
    if (!databasePath) throw new Error("The Store compatibility bridge requires a file-backed database.");
    createVerifiedStoreBridgeBackup(db, databasePath, initialVersion);
  }
  for (const migration of STORE_MIGRATIONS) {
    if (migration.version <= version) {
      continue;
    }
    runStoreMigrationTransaction(db, [migration], {
      finish: () => db.exec(`PRAGMA user_version = ${assertSchemaVersion(migration.version)}`),
    });
    version = migration.version;
  }
  // The Store file and every existing Store backup, also ones an older version made, get mode 0600.
  if (databasePath) applyStoreFileModes(path.dirname(databasePath));
  return version;
}

/**
 * Run `before`, the migrations, and `finish` in one `BEGIN IMMEDIATE` transaction. A
 * migration that rebuilds a table turns foreign key enforcement off before the
 * transaction (SQLite ignores the pragma inside one), and the transaction
 * commits only when `PRAGMA foreign_key_check` finds no broken reference.
 * Any failure rolls the whole transaction back.
 */
function runStoreMigrationTransaction(
  db: StoreDatabase,
  migrations: readonly StoreMigration[],
  hooks: { before?: () => void; finish: () => void },
): void {
  const rebuilds = migrations.some((migration) => migration.rebuildsTables);
  const foreignKeys = Number((db.prepare("PRAGMA foreign_keys").get() as { foreign_keys?: number | bigint } | undefined)?.foreign_keys ?? 0) === 1;
  if (rebuilds && foreignKeys) db.exec("PRAGMA foreign_keys = OFF");
  try {
    db.exec("BEGIN IMMEDIATE");
    try {
      hooks.before?.();
      // A reference that was already broken before the migration is not the
      // migration's doing. It is kept and reported in Store status. Only a
      // reference that the migration newly breaks stops it.
      const before = rebuilds ? inspectStoreBrokenReferences(db) : [];
      for (const migration of migrations) executeStoreMigrationStatements(db, migration);
      if (rebuilds) {
        const prior = new Map(before.map((entry) => [`${entry.table}\u0000${entry.parent}`, entry.count]));
        const newlyBroken = inspectStoreBrokenReferences(db)
          .filter((entry) => entry.count > (prior.get(`${entry.table}\u0000${entry.parent}`) ?? 0));
        if (newlyBroken.length > 0) {
          const first = newlyBroken[0]!;
          throw new Error(`The Store migration would break foreign key references, first in ${first.table} to ${first.parent}. The Store was preserved.`);
        }
      }
      hooks.finish();
      db.exec("COMMIT");
    } catch (error) {
      try {
        db.exec("ROLLBACK");
      } catch {
        // The transaction may already be rolled back.
      }
      throw error;
    }
  } finally {
    if (rebuilds && foreignKeys) db.exec("PRAGMA foreign_keys = ON");
  }
}

function assertStoreBridgeInputSafe(db: StoreDatabase, sourceVersion: number): void {
  // Only the W22 P5 bridge (schema 3 or 4 to 5) converts ledgers and needs a
  // quiet Store. Schema 5 and later migrations keep every row as it is, so a
  // stale lock or pending row stays recoverable after the upgrade.
  if (sourceVersion < 3 || sourceVersion >= 5) return;
  const activeLocks = Number((db.prepare("SELECT COUNT(*) AS count FROM installation_locks").get() as { count: number | bigint }).count);
  if (activeLocks > 0) {
    throw new Error(`The Store compatibility bridge found ${activeLocks} active installation lock(s). Finish the active writer and run setup again.`);
  }
  const pendingToolOperations = Number((db.prepare("SELECT COUNT(*) AS count FROM tool_operations WHERE status='pending'").get() as { count: number | bigint }).count);
  if (pendingToolOperations > 0) {
    throw new Error(`The Store compatibility bridge found ${pendingToolOperations} pending tool operation(s). Recover them before schema conversion.`);
  }
  const collision = db.prepare(
    "SELECT checkout_id FROM installation_migration_records WHERE kind='legacy-import' AND record_id IN ('w22-p5:checkout-object-numbers:v4','w22-p5:installation-ledger-projection:v4') LIMIT 1",
  ).get() as { checkout_id: string } | undefined;
  if (collision) {
    throw new Error(`The Store compatibility bridge record already exists for checkout ${collision.checkout_id}. The source schema is unclear and was preserved.`);
  }
  const ledgers = db.prepare("SELECT checkout_id, manifest_json FROM installation_ledgers ORDER BY checkout_id").all() as Array<{ checkout_id: string; manifest_json: string }>;
  for (const ledger of ledgers) {
    let value: unknown;
    try {
      value = JSON.parse(ledger.manifest_json);
    } catch {
      throw new Error(`The installation ledger for checkout ${ledger.checkout_id} is not valid JSON. The Store was preserved for review.`);
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`The installation ledger for checkout ${ledger.checkout_id} has an unsupported shape. The Store was preserved for review.`);
    }
  }
}

function executeStoreMigrationStatements(db: StoreDatabase, migration: StoreMigration): void {
  for (const [index, statement] of migration.statements.entries()) {
    db.exec(statement);
    // The first schema-5 statement records intent. Conversion follows it and
    // stays inside the same SQLite transaction as verification and cutover.
    if (migration.version === 5 && index === 0) convertLegacyProjectionLedgerRows(db);
    if (migration.version === 7 && statement === V7_RECEIPT_BACKFILL_AFTER) backfillTerminalOperationReceipts(db);
  }
  // The first guard migration guards every table that exists, also one that an
  // older process added, so the upgraded Store passes its own open check.
  if (migration.version === STORE_WRITE_GUARD_SINCE_SCHEMA) guardEveryExistingTable(db);
}

function guardEveryExistingTable(db: StoreDatabase): void {
  // A virtual table and its shadow tables cannot carry triggers. They are skipped
  // here and reported in Store status (listUnguardableStoreTables).
  const tables = guardedStoreTables(db);
  const triggers = new Set((db.prepare("SELECT name FROM sqlite_schema WHERE type = 'trigger'").all() as Array<{ name: string }>).map((row) => row.name));
  for (const table of tables) {
    for (const event of STORE_WRITE_GUARD_EVENTS) {
      if (!triggers.has(storeWriteGuardTriggerName(table, event))) db.exec(storeWriteGuardTriggerSql(table, event));
    }
  }
}

function convertLegacyProjectionLedgerRows(db: StoreDatabase): void {
  const legacyFields = new Set([
    "type",
    "resourcePath",
    "provenanceState",
    "providerPackage",
    "providerVersion",
    "providerImmutableRef",
    "materializationMode",
    "sourceDigest",
    "adoptionReceipt",
    "selectionTrigger",
    "operationLineage",
    "provenanceEvidence",
    "competingClaims",
  ]);
  const rows = db.prepare("SELECT checkout_id, manifest_json FROM installation_ledgers ORDER BY checkout_id").all() as Array<{ checkout_id: string; manifest_json: string }>;
  for (const row of rows) {
    const manifest = JSON.parse(row.manifest_json) as Record<string, unknown>;
    const projection = manifest.resourceProjection;
    if (!projection || typeof projection !== "object" || Array.isArray(projection)) continue;
    const target = structuredClone(manifest);
    const targetProjection = target.resourceProjection as Record<string, unknown>;
    let changed = false;
    for (const field of ["selectedTypes", "provider"]) {
      if (field in targetProjection) {
        delete targetProjection[field];
        changed = true;
      }
    }
    const resources = targetProjection.resources;
    if (resources && typeof resources === "object" && !Array.isArray(resources)) {
      for (const entry of Object.values(resources as Record<string, unknown>)) {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
        for (const field of Object.keys(entry as Record<string, unknown>)) {
          if (!legacyFields.has(field)) continue;
          delete (entry as Record<string, unknown>)[field];
          changed = true;
        }
      }
    }
    if (!changed) continue;
    db.prepare(
      "INSERT INTO installation_migration_records (checkout_id,kind,record_id,record_json) VALUES (?,'legacy-import','w22-p5:installation-ledger-projection:v4',?)",
    ).run(row.checkout_id, row.manifest_json);
    db.prepare("UPDATE installation_ledgers SET manifest_json=?, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE checkout_id=?")
      .run(JSON.stringify(target), row.checkout_id);
  }
}

function createVerifiedStoreBridgeBackup(
  db: StoreDatabase,
  databasePath: string,
  sourceVersion: number,
): string {
  const source = lstatSync(databasePath);
  const requiredBytes = BigInt(Math.max(source.size * 2, 1_048_576));
  const availableBytes = platform.availableBytes(path.dirname(databasePath));
  if (availableBytes < requiredBytes) {
    throw new Error(`The Store compatibility bridge needs at least ${requiredBytes} available bytes for a verified backup, but only ${availableBytes} are available.`);
  }
  const backupPath = `${databasePath}.bridge-v${sourceVersion}-to-v${CURRENT_STORE_SCHEMA_VERSION}-${randomUUID()}.backup`;
  const escaped = backupPath.replaceAll("'", "''");
  db.exec(`VACUUM INTO '${escaped}'`);
  applyStoreFileMode(backupPath);
  let backup: StoreDatabase | null = null;
  try {
    const driver = loadSqliteDriver();
    if (!driver.available) throw new Error(driver.reason);
    backup = openSqliteWithRetry(driver.sqlite, backupPath, { readOnly: true }, "verify Store bridge backup");
    const check = backup.prepare("PRAGMA quick_check").get() as { quick_check?: string } | undefined;
    const backedUpVersion = readUserVersion(backup);
    if (check?.quick_check !== "ok" || backedUpVersion !== sourceVersion) {
      throw new Error(`The Store bridge backup did not verify as schema ${sourceVersion}.`);
    }
    return backupPath;
  } finally {
    closeQuietly(backup);
  }
}

/** The first schema version that writes a `store_schema_journal` row. Versions 1 and 2 predate the table. */
export const STORE_SCHEMA_JOURNAL_SINCE_VERSION = 3;

export interface StoreSchemaJournalReport {
  /** The recorded `PRAGMA user_version`. */
  schemaVersion: number;
  /** One row for each accepted schema version, in version order. */
  journal: Array<{ version: number; description: string; committedAt: string }>;
  /** Versions from 3 up to the recorded version that have no journal row. */
  missingVersions: number[];
}

/**
 * Read the Store schema history (PRD 38 R-MIN `store_schema_journal`): every
 * journal row, and each version that should have a row but does not.
 */
export function readStoreSchemaJournal(db: StoreDatabase): StoreSchemaJournalReport {
  const schemaVersion = readUserVersion(db);
  const hasJournal = db.prepare("SELECT 1 FROM sqlite_schema WHERE type = 'table' AND name = 'store_schema_journal'").get() !== undefined;
  const journal = hasJournal
    ? (db.prepare("SELECT schema_version, description, committed_at FROM store_schema_journal ORDER BY schema_version").all() as Array<{ schema_version: number | bigint; description: string; committed_at: string }>)
      .map((row) => ({ version: Number(row.schema_version), description: row.description, committedAt: row.committed_at }))
    : [];
  const recorded = new Set(journal.map((row) => row.version));
  const missingVersions: number[] = [];
  for (let version = STORE_SCHEMA_JOURNAL_SINCE_VERSION; version <= schemaVersion; version++) {
    if (!recorded.has(version)) missingVersions.push(version);
  }
  return { schemaVersion, journal, missingVersions };
}

/** Reads the recorded schema version (`PRAGMA user_version`). */
export function readUserVersion(db: StoreDatabase): number {
  const row = db.prepare("PRAGMA user_version").get() as
    | { user_version?: number | bigint }
    | undefined;
  return Number(row?.user_version ?? 0);
}

function connect(sqlite: SqliteModule, databasePath: string, verify: boolean): StoreDatabase {
  return openSqliteWithRetry(sqlite, databasePath, {}, "open", (db) => {
    db.exec(`PRAGMA busy_timeout = ${STORE_BUSY_TIMEOUT_MS}`);
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA synchronous = NORMAL");
    db.exec("PRAGMA foreign_keys = ON");
    if (verify) {
      const check = db.prepare("PRAGMA quick_check").get() as
        | { quick_check?: string }
        | undefined;
      if (check?.quick_check !== "ok") {
        throw new Error(
          `SQLite quick_check failed: ${String(check?.quick_check ?? "unknown")}`,
        );
      }
    }
  });
}

export function isSqliteContention(error: unknown): boolean {
  const code = String((error as { code?: unknown; errcode?: unknown } | null)?.code ?? (error as { errcode?: unknown } | null)?.errcode ?? "");
  const message = error instanceof Error ? error.message : String(error);
  return /SQLITE_(BUSY|LOCKED|PROTOCOL)/i.test(code) || /database (?:is )?locked|database (?:is )?busy|locking protocol/i.test(message);
}

/**
 * The one shared Store connection path (PRD 38 R-WRITE-GUARD-2). Every Make
 * Docs Store connection opens here: it registers the write guard function,
 * runs the caller's pragmas, and, for a schema with the guard, checks every
 * table's guard triggers (R-WRITE-GUARD-4). `checkGuard: false` is only for
 * the classifier, which reports the same check as a Store state.
 */
function openSqliteWithRetry(
  sqlite: SqliteModule,
  databasePath: string,
  options: { readOnly?: boolean },
  operation: string,
  initialize?: (db: StoreDatabase) => void,
  checkGuard = true,
): StoreDatabase {
  const started = Date.now();
  const deadline = started + STORE_BUSY_TIMEOUT_MS;
  let attempt = 0;
  while (true) {
    let db: StoreDatabase | null = null;
    try {
      db = new sqlite.DatabaseSync(databasePath, options);
      registerStoreWriteGuard(db);
      // Triggers call the guard function, so the schema must be trusted to call it.
      db.exec("PRAGMA trusted_schema = ON");
      initialize?.(db);
      if (checkGuard) {
        const problems = inspectStoreGuardAndVersion(db);
        if (problems.length > 0) {
          throw new StoreUnavailableError({ code: "changed-outside", path: databasePath, operation: "check Store write guard", retryable: false, attempts: 1, waitedMs: 0, cause: problems.join(" ") });
        }
      }
      return db;
    } catch (error) {
      closeQuietly(db);
      if (!isSqliteContention(error)) {
        if (error instanceof StoreUnavailableError) throw error;
        throw new StoreUnavailableError(makeStoreIssue("io-error", databasePath, operation, error, { attempts: attempt + 1, waitedMs: Date.now() - started }));
      }
      if (Date.now() >= deadline) {
        throw new StoreUnavailableError(makeStoreIssue("contention-timeout", databasePath, operation, error, { retryable: true, attempts: attempt + 1, waitedMs: Date.now() - started }));
      }
      pause(attempt++, deadline);
    }
  }
}

/**
 * Open the Store read only for review, with the write guard check off
 * (W32 R0 P4, `setup store check`). This is the shared connection path with
 * `checkGuard: false`, like the classifier: SQLite refuses every write on a
 * read-only connection, so a Store that was changed outside Make Docs can be
 * read and reported without any write. The caller gets the guard problems
 * (empty when the guard is intact) and must close the connection.
 */
export function openStoreForReview(databasePath: string, operation = "review Store"): { db: StoreDatabase; guardProblems: string[] } {
  const driver = loadSqliteDriver();
  if (!driver.available) {
    throw new StoreUnavailableError({ code: "sqlite-unavailable", path: databasePath, operation, retryable: false, attempts: 1, waitedMs: 0, cause: driver.reason });
  }
  const db = openSqliteWithRetry(driver.sqlite, databasePath, { readOnly: true }, operation, (connection) => {
    connection.exec(`PRAGMA busy_timeout = ${STORE_BUSY_TIMEOUT_MS}`);
  }, false);
  try {
    const guardProblems = inspectStoreGuardAndVersion(db);
    return { db, guardProblems };
  } catch (error) {
    closeQuietly(db);
    throw error;
  }
}

/** Open one SQLite connection with Store error detail and bounded contention retry. */
export function openStoreSqliteConnection(
  databasePath: string,
  options: { readOnly?: boolean } = {},
  operation = "open",
): StoreDatabase {
  const driver = loadSqliteDriver();
  if (!driver.available) {
    throw new StoreUnavailableError({
      code: "sqlite-unavailable",
      path: databasePath,
      operation,
      retryable: false,
      attempts: 1,
      waitedMs: 0,
      cause: driver.reason,
    });
  }
  return openSqliteWithRetry(driver.sqlite, databasePath, options, operation, (db) => {
    db.exec(`PRAGMA busy_timeout = ${STORE_BUSY_TIMEOUT_MS}`);
    db.exec("PRAGMA foreign_keys = ON");
    if (!options.readOnly) db.exec("PRAGMA synchronous = FULL");
  });
}

/** Not called today: a corrupt Store is kept and refused, not quarantined (see `OpenStoreDatabaseResult.recovered`). */
function quarantineDatabase(databasePath: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const quarantinedPath = `${databasePath}.corrupt-${stamp}`;
  platform.atomicReplace(databasePath, quarantinedPath);
  // Stale WAL/SHM sidecars must not be replayed against the fresh database.
  for (const suffix of ["-wal", "-shm"]) {
    rmSync(`${databasePath}${suffix}`, { force: true });
  }
  return quarantinedPath;
}

function assertSchemaVersion(version: number): number {
  if (!Number.isInteger(version) || version < 0) {
    throw new Error(`Invalid store schema version: ${String(version)}`);
  }
  return version;
}

function assertCheckpoint9StateInsideTransaction(
  db: StoreDatabase,
  databasePath: string,
  schemaVersion: number,
): void {
  const check = db.prepare("PRAGMA quick_check").get() as
    | { quick_check?: string }
    | undefined;
  if (check?.quick_check !== "ok") {
    throw new StoreCheckpoint9StateError({
      state: "corrupt",
      databasePath,
      schemaVersion: null,
      reason: `SQLite quick_check returned ${String(check?.quick_check ?? "no result")}`,
    });
  }
  if (schemaVersion > CURRENT_STORE_SCHEMA_VERSION) {
    throw new StoreCheckpoint9StateError({
      state: "newer-unknown",
      databasePath,
      schemaVersion,
      reason: `schema version ${schemaVersion} is newer than supported version ${CURRENT_STORE_SCHEMA_VERSION}`,
    });
  }
  const expectedTables = schemaVersion === 0 ? [] : expectedTablesForVersion(schemaVersion);
  if (!expectedTables) {
    throw new StoreCheckpoint9StateError({
      state: "unknown",
      databasePath,
      schemaVersion,
      reason: `schema version ${schemaVersion} is not a supported checkpoint-9 input`,
    });
  }
  const actualTables = new Set(
    (db.prepare("SELECT name FROM sqlite_schema WHERE type = 'table'").all() as Array<{ name: string }>)
      .map((row) => row.name),
  );
  const missingTables = expectedTables.filter((name) => !actualTables.has(name));
  if (missingTables.length > 0) {
    throw new StoreCheckpoint9StateError({
      state: "unknown",
      databasePath,
      schemaVersion,
      reason: `required schema objects are missing: ${missingTables.join(", ")}`,
    });
  }
}

function assertCheckpoint9JournalEntry(entry: StoreCheckpoint9JournalEntry): void {
  if (
    !/^sha256:[0-9a-f]{64}$/.test(entry.receiptId) ||
    entry.checkpoint !== 9 ||
    !/^[0-9a-f]{64}$/.test(entry.projectRootDigest) ||
    !/^sha256:[0-9a-f]{64}$/.test(entry.snapshotId) ||
    entry.receiptJson.length < 2 ||
    entry.receiptJson.length > 16384
  ) {
    throw new Error("The checkpoint-9 journal entry is invalid or exceeds its metadata bound.");
  }
}

function isCorruptDatabaseMessage(message: string): boolean {
  return /not a database|database disk image is malformed|file is not a database|malformed/i.test(message);
}

function closeQuietly(db: StoreDatabase | null): void {
  try {
    db?.close();
  } catch {
    // Closing an already-closed or failed connection is a no-op.
  }
}
