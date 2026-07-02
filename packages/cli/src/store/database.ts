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
export const CURRENT_STORE_SCHEMA_VERSION = 1;

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
 * Opens (creating and migrating as needed) the store database.
 *
 * - Missing file: created fresh at the current schema (R-DB-4).
 * - Corrupt file: quarantined next to the store and recreated fresh; the
 *   caller reports recoverable operational-state loss (R-DB-4).
 * - Newer schema: throws {@link StoreSchemaNewerError} without reading or
 *   writing any table (R-DB-2).
 * - Missing driver: throws {@link StoreUnavailableError}.
 */
export function openStoreDatabase(storeRoot: string): OpenStoreDatabaseResult {
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
  } catch {
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

function closeQuietly(db: StoreDatabase | null): void {
  try {
    db?.close();
  } catch {
    // Closing an already-closed or failed connection is a no-op.
  }
}
