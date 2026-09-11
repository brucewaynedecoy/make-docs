import {
  closeSync,
  constants,
  fchmodSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  linkSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmdirSync,
  rmSync,
  unlinkSync,
  writeFileSync,
  type Stats,
} from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
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
export const CURRENT_STORE_SCHEMA_VERSION = 3;

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
];

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
  | "owner-unverified";

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
  context: { projectMutationStarted?: boolean; pendingOperationId?: string } = {},
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
    default:
      summary = `Make Docs could not complete the Store operation "${issue.operation}" at ${issue.path}${issue.systemCode ? ` (${issue.systemCode})` : ""}. ${issue.cause}`;
  }
  if (context.projectMutationStarted) {
    return `${summary} Project files may have changed.${context.pendingOperationId ? ` Pending operation: ${context.pendingOperationId}.` : ""} Run make-docs project state status before recovery.`;
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
  | { state: "supported-current"; databasePath: string; schemaVersion: 3 }
  | { state: "supported-legacy"; databasePath: string; schemaVersion: 1 | 2 }
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
  return left.dev === right.dev && left.ino === right.ino && right.isFile();
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
  if (hostname !== os.hostname()) {
    throw new StoreUnavailableError(makeStoreIssue("owner-unverified", file, "inspect owner", new Error("The lease belongs to another or unknown host.")));
  }
  try {
    process.kill(pid, 0);
    return "alive";
  } catch (error) {
    if (systemCode(error) === "ESRCH") return "dead";
    throw new StoreUnavailableError(makeStoreIssue("owner-unverified", file, "inspect owner", error));
  }
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
    fchmodSync(fd, 0o600);
    stat = fstatSync(fd);
    writeFileSync(fd, JSON.stringify(owner));
    fsyncSync(fd);
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
    if (!new Set(["ENOENT", "ENOTEMPTY", "EEXIST"]).has(systemCode(error) ?? "")) {
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
      try {
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
          removed.push(path.relative(root, file));
        }
      }
      continue;
    }
    const lease = readOwnerLease(file, "recover Store sessions", stat.isDirectory() ? STORE_SESSION_VERSION : undefined);
    if (!lease) continue;
    if (ownerState(lease) === "alive") {
      active.push({ file, pid: lease.pid, hostname: lease.hostname });
    } else if (remove && unlinkLeaseIfUnchanged(lease)) {
      removed.push(path.relative(root, file));
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
    const result = recoverDeadStoreAccessSessions(storeRoot);
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
  storeRoot = path.resolve(storeRoot);
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
      if (blocker.pid === process.pid && blocker.hostname === os.hostname()) {
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
    if (existing?.isDirectory()) recoverDeadStoreAccessSessions(storeRoot);
    try {
      mkdirSync(directory, { mode: 0o700 });
    } catch (error) {
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
      if (opened.dev !== named.dev || opened.ino !== named.ino) {
        if (Date.now() < deadline) {
          pause(attempt++, deadline);
          continue;
        }
        throw new StoreUnavailableError(makeStoreIssue("owner-unverified", directory, "verify session directory", new Error("The Store session directory changed during admission.")));
      }
      fchmodSync(directoryFd, 0o700);
    } catch (error) {
      if (error instanceof StoreUnavailableError) throw error;
      const code = systemCode(error);
      if (code === "ENOENT" && Date.now() < deadline) {
        pause(attempt++, deadline);
        continue;
      }
      throw new StoreUnavailableError(makeStoreIssue(code === "ELOOP" ? "unsafe-path" : "io-error", directory, "secure session directory", error));
    } finally {
      if (directoryFd !== null) closeSync(directoryFd);
    }

    const token = randomUUID();
    const file = path.join(directory, `${token}.json`);
    const pendingFile = path.join(directory, `.pending-${process.pid}.${Buffer.from(os.hostname()).toString("base64url")}.${token}`);
    let fd: number | null = null;
    let leaseStat: Stats | null = null;
    try {
      // O_EXCL makes an existing file or link fail. macOS rejects O_NOFOLLOW
      // when O_CREAT creates a new file, so it must not be used here.
      fd = openSync(pendingFile, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600);
      fchmodSync(fd, 0o600);
      leaseStat = fstatSync(fd);
      writeFileSync(fd, JSON.stringify({ version: STORE_SESSION_VERSION, token, pid: process.pid, hostname: os.hostname(), startedAt: new Date().toISOString() }));
      fsyncSync(fd);
      renameSync(pendingFile, file);
      const lateBlocker = exclusiveBlocker(storeRoot, preparing);
      if (lateBlocker) {
        closeSync(fd);
        fd = null;
        removeOwnedSession(file, token, leaseStat, "cancel Store session");
        cleanupAccessDirectory(directory);
        if (lateBlocker.pid === process.pid && lateBlocker.hostname === os.hostname()) {
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
      removePendingSession(pendingFile, leaseStat);
      cleanupAccessDirectory(directory);
      if (error instanceof StoreUnavailableError) throw error;
      const code = systemCode(error);
      if (new Set(["ENOENT", "EEXIST", "ENOTEMPTY"]).has(code ?? "") && Date.now() < deadline) {
        pause(attempt++, deadline);
        continue;
      }
      throw new StoreUnavailableError(makeStoreIssue("io-error", file, "open Store session", error, { attempts: attempt + 1, waitedMs: Date.now() - started }));
    }
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

const VERSION_THREE_TABLES = [...VERSION_TWO_TABLES, "installation_checkouts", "installation_ledgers", "installation_operations", "installation_steps", "installation_locks", "installation_migration_records", "installation_transfers", "tool_operations", "store_schema_journal"] as const;

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
    });
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
    if (schemaVersion !== 1 && schemaVersion !== 2 && schemaVersion !== CURRENT_STORE_SCHEMA_VERSION) {
      const reason = `schema version ${schemaVersion} is not a supported checkpoint-9 input`;
      return {
        state: "unknown",
        databasePath,
        schemaVersion,
        reason,
        issue: { code: "schema-unknown", path: databasePath, operation: "read schema", retryable: false, attempts: 1, waitedMs: 0, cause: reason },
      };
    }
    const expectedTables = schemaVersion === 1 ? VERSION_ONE_TABLES : schemaVersion === 2 ? VERSION_TWO_TABLES : VERSION_THREE_TABLES;
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
    return schemaVersion < CURRENT_STORE_SCHEMA_VERSION
      ? { state: "supported-legacy", databasePath, schemaVersion: schemaVersion as 1 | 2 }
      : { state: "supported-current", databasePath, schemaVersion: 3 };
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
  if (!driver.available) throw new StoreUnavailableError({ code: "sqlite-unavailable", path: classification.databasePath, operation: "read Store migration journal", retryable: false, attempts: 1, waitedMs: 0, cause: driver.reason });
  const release = acquireStoreAccess(storeRoot);
  let db: StoreDatabase | null = null;
  try {
    db = openSqliteWithRetry(driver.sqlite, classification.databasePath, { readOnly: true }, "read Store migration journal", (connection) => {
      connection.exec(`PRAGMA busy_timeout = ${STORE_BUSY_TIMEOUT_MS}`);
    });
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

function openSqliteWithRetry(
  sqlite: SqliteModule,
  databasePath: string,
  options: { readOnly?: boolean },
  operation: string,
  initialize?: (db: StoreDatabase) => void,
): StoreDatabase {
  const started = Date.now();
  const deadline = started + STORE_BUSY_TIMEOUT_MS;
  let attempt = 0;
  while (true) {
    let db: StoreDatabase | null = null;
    try {
      db = new sqlite.DatabaseSync(databasePath, options);
      initialize?.(db);
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
  if (schemaVersion !== 0 && schemaVersion !== 1 && schemaVersion !== 2 && schemaVersion !== CURRENT_STORE_SCHEMA_VERSION) {
    throw new StoreCheckpoint9StateError({
      state: "unknown",
      databasePath,
      schemaVersion,
      reason: `schema version ${schemaVersion} is not a supported checkpoint-9 input`,
    });
  }
  const expectedTables = schemaVersion === 1
    ? VERSION_ONE_TABLES
    : schemaVersion === 2
      ? VERSION_TWO_TABLES
      : schemaVersion === CURRENT_STORE_SCHEMA_VERSION ? VERSION_THREE_TABLES : [];
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
