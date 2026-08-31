import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { getStoreDatabasePath } from "./paths";

/**
 * SQLite operational database for the global store (R-DB-1 through R-DB-4).
 *
 * Driver: the Node built-in `node:sqlite` module, loaded lazily via
 * `createRequire` so the CLI still loads on runtimes that predate it
 * (`node:sqlite` requires Node >= 22.5). On such runtimes the store database
 * reports `unavailable` through the same graceful-degradation path that
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
export const CURRENT_STORE_SCHEMA_VERSION = 2;

/** Milliseconds a connection waits on a locked database before erroring. */
export const STORE_BUSY_TIMEOUT_MS = 5000;

type SqliteModule = typeof import("node:sqlite");

/** A live connection to the store database. */
export type StoreDatabase = import("node:sqlite").DatabaseSync;

export interface StoreMigration {
  /** Schema version this migration produces. */
  version: number;
  description: string;
  statements: string[];
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
];

/** Thrown when the database was written by a newer CLI schema (R-DB-2). */
export class StoreSchemaNewerError extends Error {
  readonly databaseSchemaVersion: number;
  readonly cliSchemaVersion: number;

  constructor(databaseSchemaVersion: number, cliSchemaVersion: number, databasePath: string) {
    super(
      `The make-docs store database at ${databasePath} uses schema version ${databaseSchemaVersion}, ` +
        `but this CLI supports up to version ${cliSchemaVersion}. ` +
        "The database was left untouched. Update make-docs to a newer version to use it.",
    );
    this.name = "StoreSchemaNewerError";
    this.databaseSchemaVersion = databaseSchemaVersion;
    this.cliSchemaVersion = cliSchemaVersion;
  }
}

/** Thrown when no SQLite driver is available on this runtime. */
export class StoreUnavailableError extends Error {
  constructor(reason: string) {
    super(
      `The make-docs store database is unavailable: ${reason} ` +
        "Repository operations are unaffected; operational state will not be recorded on this runtime.",
    );
    this.name = "StoreUnavailableError";
  }
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
  | { state: "supported-current"; databasePath: string; schemaVersion: 2 }
  | { state: "supported-legacy"; databasePath: string; schemaVersion: 1 }
  | { state: "newer-unknown"; databasePath: string; schemaVersion: number; reason: string }
  | { state: "corrupt"; databasePath: string; schemaVersion: null; reason: string }
  | { state: "unknown"; databasePath: string; schemaVersion: number; reason: string }
  | { state: "indeterminate"; databasePath: string; schemaVersion: null; reason: string };

export type UnsafeStoreCheckpoint9Classification = Extract<
  StoreCheckpoint9Classification,
  { state: "newer-unknown" | "corrupt" | "unknown" | "indeterminate" }
>;

export class StoreCheckpoint9StateError extends Error {
  constructor(readonly classification: UnsafeStoreCheckpoint9Classification) {
    super(
      `Checkpoint 9 stopped because the Store at ${classification.databasePath} ` +
        `was classified as ${classification.state}: ${classification.reason}`,
    );
    this.name = "StoreCheckpoint9StateError";
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
      reason: `this Node runtime (${process.version}) does not provide the built-in node:sqlite module (requires Node >= 22.5).`,
    };
  }
  return cachedDriver;
}

export interface OpenStoreDatabaseResult {
  db: StoreDatabase;
  databasePath: string;
  /** True when no database file existed and a fresh one was created. */
  created: boolean;
  /** True when a corrupt database was quarantined and a fresh one created. */
  recovered: boolean;
  /** Quarantine location of the corrupt database, when `recovered` is true. */
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
 * - Corrupt file: quarantined next to the store and recreated fresh; the
 *   caller reports recoverable operational-state loss (R-DB-4).
 * - Newer schema: throws {@link StoreSchemaNewerError} without reading or
 *   writing any table (R-DB-2).
 * - Missing driver: throws {@link StoreUnavailableError}.
 */
export function openStoreDatabase(
  storeRoot: string,
  options: { recoverCorrupt?: boolean } = {},
): OpenStoreDatabaseResult {
  const driver = loadSqliteDriver();
  if (!driver.available) {
    throw new StoreUnavailableError(driver.reason);
  }

  mkdirSync(storeRoot, { recursive: true });
  const databasePath = getStoreDatabasePath(storeRoot);
  const existed = existsSync(databasePath);

  let db: StoreDatabase | null = null;
  let recovered = false;
  let quarantinedPath: string | null = null;

  try {
    db = connect(driver.sqlite, databasePath, existed);
  } catch (error) {
    if (options.recoverCorrupt === false) {
      throw error;
    }
    // The file exists but SQLite cannot use it: quarantine and recreate.
    quarantinedPath = quarantineDatabase(databasePath);
    recovered = true;
    db = connect(driver.sqlite, databasePath, false);
  }

  try {
    const previousSchemaVersion = existed && !recovered ? readUserVersion(db) : null;
    const startingVersion = previousSchemaVersion ?? 0;

    if (startingVersion > CURRENT_STORE_SCHEMA_VERSION) {
      throw new StoreSchemaNewerError(
        startingVersion,
        CURRENT_STORE_SCHEMA_VERSION,
        databasePath,
      );
    }

    if (startingVersion > 0 && startingVersion < CURRENT_STORE_SCHEMA_VERSION) {
      throw new StoreMigrationRequiredError(
        startingVersion,
        CURRENT_STORE_SCHEMA_VERSION,
        databasePath,
      );
    }

    applyStoreMigrations(db, startingVersion);

    return {
      db,
      databasePath,
      created: !existed,
      recovered,
      quarantinedPath,
      previousSchemaVersion,
      schemaVersion: CURRENT_STORE_SCHEMA_VERSION,
    };
  } catch (error) {
    closeQuietly(db);
    throw error;
  }
}

export interface StoreCheckpoint9MigrationResult {
  databasePath: string;
  previousSchemaVersion: number | null;
  schemaVersion: number;
  migrated: boolean;
  journal: StoreCheckpoint9JournalEntry | null;
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

/** Classifies the Store without creating a directory, database, sidecar, or table. */
export function classifyStoreCheckpoint9State(
  storeRoot: string,
): StoreCheckpoint9Classification {
  const databasePath = getStoreDatabasePath(storeRoot);
  if (!existsSync(databasePath)) {
    return { state: "absent", databasePath, schemaVersion: null };
  }
  const driver = loadSqliteDriver();
  if (!driver.available) {
    return {
      state: "indeterminate",
      databasePath,
      schemaVersion: null,
      reason: driver.reason,
    };
  }
  let db: StoreDatabase | null = null;
  try {
    db = new driver.sqlite.DatabaseSync(databasePath, { readOnly: true });
    db.exec(`PRAGMA busy_timeout = ${STORE_BUSY_TIMEOUT_MS}`);
    const check = db.prepare("PRAGMA quick_check").get() as
      | { quick_check?: string }
      | undefined;
    if (check?.quick_check !== "ok") {
      return {
        state: "corrupt",
        databasePath,
        schemaVersion: null,
        reason: `SQLite quick_check returned ${String(check?.quick_check ?? "no result")}`,
      };
    }
    const schemaVersion = readUserVersion(db);
    if (schemaVersion > CURRENT_STORE_SCHEMA_VERSION) {
      return {
        state: "newer-unknown",
        databasePath,
        schemaVersion,
        reason: `schema version ${schemaVersion} is newer than supported version ${CURRENT_STORE_SCHEMA_VERSION}`,
      };
    }
    if (schemaVersion !== 1 && schemaVersion !== CURRENT_STORE_SCHEMA_VERSION) {
      return {
        state: "unknown",
        databasePath,
        schemaVersion,
        reason: `schema version ${schemaVersion} is not a supported checkpoint-9 input`,
      };
    }
    const expectedTables = schemaVersion === 1 ? VERSION_ONE_TABLES : VERSION_TWO_TABLES;
    const actualTables = new Set(
      (db.prepare("SELECT name FROM sqlite_schema WHERE type = 'table'").all() as Array<{ name: string }>)
        .map((row) => row.name),
    );
    const missingTables = expectedTables.filter((name) => !actualTables.has(name));
    if (missingTables.length > 0) {
      return {
        state: "unknown",
        databasePath,
        schemaVersion,
        reason: `required schema objects are missing: ${missingTables.join(", ")}`,
      };
    }
    return schemaVersion === 1
      ? { state: "supported-legacy", databasePath, schemaVersion }
      : { state: "supported-current", databasePath, schemaVersion };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      state: isCorruptDatabaseMessage(reason) ? "corrupt" : "indeterminate",
      databasePath,
      schemaVersion: null,
      reason,
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
  if (!driver.available) throw new StoreUnavailableError(driver.reason);
  mkdirSync(storeRoot, { recursive: true });
  const databasePath = getStoreDatabasePath(storeRoot);
  const db = connect(driver.sqlite, databasePath, classification.state !== "absent");
  let startingVersion: number | null = null;
  try {
    db.exec("BEGIN IMMEDIATE");
    startingVersion = readUserVersion(db);
    assertCheckpoint9StateInsideTransaction(db, databasePath, startingVersion);
    if (startingVersion === CURRENT_STORE_SCHEMA_VERSION) {
      db.exec("COMMIT");
      return {
        databasePath,
        previousSchemaVersion: startingVersion,
        schemaVersion: CURRENT_STORE_SCHEMA_VERSION,
        migrated: false,
        journal: null,
      };
    }
    for (const migration of STORE_MIGRATIONS) {
      if (migration.version <= startingVersion) continue;
      for (const statement of migration.statements) db.exec(statement);
    }
    db.prepare(
      `INSERT INTO store_checkpoint_journal
        (receipt_id, checkpoint, project_root_digest, snapshot_id, committed_at, receipt_json)
       VALUES (?, 9, ?, ?, ?, ?)`,
    ).run(
      journal.receiptId,
      journal.projectRootDigest,
      journal.snapshotId,
      journal.committedAt,
      journal.receiptJson,
    );
    db.exec(`PRAGMA user_version = ${CURRENT_STORE_SCHEMA_VERSION}`);
    db.exec("COMMIT");
    return {
      databasePath,
      previousSchemaVersion: classification.state === "absent" ? null : startingVersion,
      schemaVersion: CURRENT_STORE_SCHEMA_VERSION,
      migrated: true,
      journal,
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
  if (!driver.available) throw new StoreUnavailableError(driver.reason);
  const db = new driver.sqlite.DatabaseSync(classification.databasePath, { readOnly: true });
  try {
    const row = db.prepare(
      `SELECT receipt_id, checkpoint, project_root_digest, snapshot_id, committed_at, receipt_json
         FROM store_checkpoint_journal
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
  let version = fromVersion;
  for (const migration of STORE_MIGRATIONS) {
    if (migration.version <= version) {
      continue;
    }
    db.exec("BEGIN IMMEDIATE");
    try {
      for (const statement of migration.statements) {
        db.exec(statement);
      }
      db.exec(`PRAGMA user_version = ${assertSchemaVersion(migration.version)}`);
      db.exec("COMMIT");
    } catch (error) {
      try {
        db.exec("ROLLBACK");
      } catch {
        // The transaction may already be rolled back.
      }
      throw error;
    }
    version = migration.version;
  }
  return version;
}

/** Reads the recorded schema version (`PRAGMA user_version`). */
export function readUserVersion(db: StoreDatabase): number {
  const row = db.prepare("PRAGMA user_version").get() as
    | { user_version?: number | bigint }
    | undefined;
  return Number(row?.user_version ?? 0);
}

function connect(sqlite: SqliteModule, databasePath: string, verify: boolean): StoreDatabase {
  const db = new sqlite.DatabaseSync(databasePath);
  try {
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
    return db;
  } catch (error) {
    closeQuietly(db);
    throw error;
  }
}

function quarantineDatabase(databasePath: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const quarantinedPath = `${databasePath}.corrupt-${stamp}`;
  renameSync(databasePath, quarantinedPath);
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
  if (schemaVersion !== 0 && schemaVersion !== 1 && schemaVersion !== CURRENT_STORE_SCHEMA_VERSION) {
    throw new StoreCheckpoint9StateError({
      state: "unknown",
      databasePath,
      schemaVersion,
      reason: `schema version ${schemaVersion} is not a supported checkpoint-9 input`,
    });
  }
  const expectedTables = schemaVersion === 1
    ? VERSION_ONE_TABLES
    : schemaVersion === CURRENT_STORE_SCHEMA_VERSION
      ? VERSION_TWO_TABLES
      : [];
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
