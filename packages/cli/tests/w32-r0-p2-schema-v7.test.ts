import { createHash } from "node:crypto";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { previewProjectLayout } from "../src/layout-plan";
import { createExecutionContext, serializeOperationError } from "../src/operations/context";
import { invokeOperation } from "../src/operations/registry";
import {
  CURRENT_STORE_SCHEMA_VERSION,
  STORE_MIGRATIONS,
  STORE_WRITE_GUARD_EVENTS,
  StoreCheckpoint9StateError,
  StoreSchemaNewerError,
  StoreUnavailableError,
  applyStoreMigrations,
  classifyStoreCheckpoint9State,
  inspectStoreWriteGuard,
  makeStoreIssue,
  migrateStoreDatabaseAtCheckpoint9,
  openStoreDatabase,
  openStoreSqliteConnection,
  readStoreSchemaJournal,
  registerStoreWriteGuard,
  storeWriteGuardTriggerName,
  withStoreDatabase,
  inspectStoreBrokenReferences,
  listUnguardableStoreTables,
} from "../src/store/database";
import {
  readDetachedInstallationOperation,
  readInstallationStatus,
  recordPlannedFileChange,
  recoverInstallationOperation,
  sealInstallationOperation,
  withInstallationDatabase,
  withInstallationOperation,
} from "../src/store/installation-state";
import { applyProjectLayout, prepareProjectLayout } from "../src/store/layout-state";
import { previewStoreCompatibilityBridge } from "../src/store/compatibility-bridge";
import { WORK_EVIDENCE_PAYLOAD_LIMIT_BYTES, WorkEvidencePayloadTooLargeError, upsertWorkEvidence } from "../src/store/state-rows";
import { STORE_FAILED_RECOVERY_CLOSED, STORE_FIXED_RULES, STORE_FOLLOW_UPS, STORE_TABLE_CATALOG } from "../src/store/table-catalog";

const sha = (text: string) => `sha256:${createHash("sha256").update(text).digest("hex")}`;
const POSIX = process.platform !== "win32";
const V7_TABLES = STORE_TABLE_CATALOG.map((entry) => entry.table);

let temp: string;
let store: string;
let project: string;
beforeEach(() => {
  temp = mkdtempSync(path.join(os.tmpdir(), "make-docs-w32-p2-"));
  store = path.join(temp, "store");
  project = path.join(temp, "project");
  mkdirSync(project);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  rmSync(temp, { recursive: true, force: true });
});

/** Seed a schema v6 Store on a raw connection, as an older Make Docs left it. */
function seedV6(root: string): DatabaseSync {
  mkdirSync(root, { recursive: true });
  const db = new DatabaseSync(path.join(root, "store.db"));
  db.exec("PRAGMA foreign_keys=ON");
  for (const migration of STORE_MIGRATIONS.filter((candidate) => candidate.version <= 6)) {
    for (const statement of migration.statements) db.exec(statement);
    db.exec(`PRAGMA user_version=${migration.version}`);
  }
  return db;
}

const LEDGER_BEFORE = '{"schemaVersion":2,"projectId":"project-1","files":{}}';
const LEDGER_AFTER = '{"schemaVersion":2,"projectId":"project-1","files":{"a.md":{}}}';

function seedV6Rows(db: DatabaseSync): void {
  db.prepare("INSERT INTO installation_checkouts (checkout_id,project_id,root_path,created_at,root_path_key,verified_at,verification_json) VALUES (?,?,?,?,?,?,?)")
    .run("checkout-1", "project-1", "/old/project", "2026-01-01T00:00:00.000Z", "/old/project", null, null);
  const op = db.prepare("INSERT INTO installation_operations (operation_id,checkout_id,operation,status,before_ledger,after_ledger,created_at,finished_at,plan_complete) VALUES (?,?,?,?,?,?,?,?,?)");
  op.run("op-completed", "checkout-1", "setup.install", "completed", LEDGER_BEFORE, LEDGER_AFTER, "2026-01-01T00:00:00.000Z", "2026-01-01T00:01:00.000Z", 1);
  op.run("op-rolled-back", "checkout-1", "setup.install", "rolled-back", null, "null", "2026-01-02T00:00:00.000Z", "2026-01-02T00:01:00.000Z", 1);
  op.run("op-pending", "checkout-1", "setup.install", "pending", LEDGER_AFTER, LEDGER_AFTER, "2026-01-03T00:00:00.000Z", null, 0);
  const step = db.prepare("INSERT INTO installation_steps VALUES (?,?,?,?,?,?)");
  step.run("op-completed", 1, "a.md", '{"kind":"missing"}', '{"kind":"file"}', 1);
  step.run("op-completed", 2, "b.md", '{"kind":"missing"}', '{"kind":"file"}', 0);
  step.run("op-pending", 1, "c.md", '{"kind":"missing"}', '{"kind":"file"}', 1);
  db.prepare("INSERT INTO store_migration_receipts VALUES (?,?,?,?,?,?,?,?,?)")
    .run(`sha256:${"a".repeat(64)}`, "store.schema.migrate", "b".repeat(64), 2, 5, `sha256:${"c".repeat(64)}`, "completed", "2026-01-01T00:00:00.000Z", '{"schemaVersion":1}');
}

function columns(db: DatabaseSync, table: string): string[] {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>).map((row) => row.name);
}

function journalEntry(digestSeed: string) {
  const receipt = { schemaVersion: 1, seed: digestSeed };
  return {
    receiptId: sha(`receipt-${digestSeed}`),
    checkpoint: 9 as const,
    projectRootDigest: createHash("sha256").update(digestSeed).digest("hex"),
    snapshotId: sha(`snapshot-${digestSeed}`),
    committedAt: "2026-11-22T00:00:00.000Z",
    receiptJson: JSON.stringify(receipt),
  };
}

function operation(fn: () => void): void {
  withInstallationOperation(project, "test.change", fn, { storeRoot: store });
}

function replace(relative: string, content: string): void {
  recordPlannedFileChange(project, relative, { kind: "file", content }, () => writeFileSync(path.join(project, relative), content));
}

describe("W32 R0 P2 schema v7 migration (A5, A25)", () => {
  it("moves v6 to v7 in one transaction, keeps every row and reference, and backfills terminal receipts", () => {
    // W29 R0 P2 made schema v8 current, so a v6 Store moves through v7 to v8, each in its own transaction.
    // W30 R0 P2 made schema v9 current, so a v6 Store moves through v7 and v8 to v9.
    expect(CURRENT_STORE_SCHEMA_VERSION).toBe(9);
    const db = seedV6(store);
    seedV6Rows(db);
    expect(previewStoreCompatibilityBridge(store).records).toEqual(expect.arrayContaining([
      expect.objectContaining({ bridgeId: "w32-r0-p2-store-schema-v7", disposition: "convert" }),
    ]));
    expect(applyStoreMigrations(db, 6)).toBe(CURRENT_STORE_SCHEMA_VERSION);
    expect(db.prepare("PRAGMA user_version").get()).toEqual({ user_version: CURRENT_STORE_SCHEMA_VERSION });
    expect(db.prepare("PRAGMA foreign_keys").get()).toEqual({ foreign_keys: 1 });
    expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
    expect(columns(db, "project_register")).toEqual(["project_id", "project_name", "first_seen_at", "last_seen_at"]);
    expect(columns(db, "installation_operations")).toEqual(STORE_TABLE_CATALOG.find((entry) => entry.table === "installation_operations")!.columns);
    const journal = readStoreSchemaJournal(db as never);
    expect(journal.journal.map((row) => row.version)).toEqual([3, 4, 5, 6, 7, 8, 9]);
    expect(journal.missingVersions).toEqual([]);

    const rows = db.prepare("SELECT operation_id,status,before_ledger_digest,after_ledger_digest,step_count,applied_step_count,failure_code FROM installation_operations ORDER BY operation_id").all();
    expect(rows).toEqual([
      { operation_id: "op-completed", status: "completed", before_ledger_digest: sha(LEDGER_BEFORE), after_ledger_digest: sha(LEDGER_AFTER), step_count: 2, applied_step_count: 1, failure_code: null },
      { operation_id: "op-pending", status: "pending", before_ledger_digest: null, after_ledger_digest: null, step_count: null, applied_step_count: null, failure_code: null },
      { operation_id: "op-rolled-back", status: "rolled-back", before_ledger_digest: null, after_ledger_digest: null, step_count: 0, applied_step_count: 0, failure_code: null },
    ]);
    expect(db.prepare("SELECT COUNT(*) AS count FROM installation_steps").get()).toEqual({ count: 3 });
    expect(db.prepare("SELECT source_schema_version,target_schema_version FROM store_migration_receipts").all()).toEqual([{ source_schema_version: 2, target_schema_version: 5 }]);
    // The widened CHECK takes the current target and still refuses a backward receipt.
    registerStoreWriteGuard(db as never);
    const insert = db.prepare("INSERT INTO store_migration_receipts VALUES (?,?,?,?,?,?,?,?,?)");
    insert.run(sha("forward"), "store.schema.migrate", "d".repeat(64), 6, 7, sha("s"), "completed", "now", "{}");
    expect(() => insert.run(sha("backward"), "store.schema.migrate", "d".repeat(64), 7, 6, sha("s"), "completed", "now", "{}")).toThrow(/CHECK/);
    // The failed status and its fields are accepted only in their bounded form.
    db.prepare("UPDATE installation_operations SET status='failed', failure_code='operation-error', failed_stage='apply' WHERE operation_id='op-pending'").run();
    expect(() => db.prepare("UPDATE installation_operations SET failure_code='Not A Code' WHERE operation_id='op-pending'").run()).toThrow(/CHECK/);
    expect(inspectStoreWriteGuard(db as never)).toEqual([]);
    db.close();

    const backups = readdirSync(store).filter((name) => name.endsWith(".backup"));
    expect(backups).toHaveLength(1);
    expect(backups[0]).toContain(`bridge-v6-to-v${CURRENT_STORE_SCHEMA_VERSION}`);
    if (POSIX) {
      expect(statSync(path.join(store, "store.db")).mode & 0o777).toBe(0o600);
      expect(statSync(path.join(store, backups[0]!)).mode & 0o777).toBe(0o600);
    }
    const backup = new DatabaseSync(path.join(store, backups[0]!), { readOnly: true });
    expect(backup.prepare("PRAGMA user_version").get()).toEqual({ user_version: 6 });
    backup.close();
  });

  it("rolls a failed v7 migration back and leaves the v6 Store as it was", () => {
    const db = seedV6(store);
    seedV6Rows(db);
    const migration = STORE_MIGRATIONS.find((candidate) => candidate.version === 7)!;
    const at = migration.statements.findIndex((statement) => statement.startsWith("INSERT INTO store_schema_journal"));
    migration.statements.splice(at, 0, "THIS IS AN INJECTED FAILURE");
    try {
      expect(() => applyStoreMigrations(db, 6)).toThrow();
    } finally {
      migration.statements.splice(at, 1);
    }
    expect(db.prepare("PRAGMA user_version").get()).toEqual({ user_version: 6 });
    expect(db.prepare("PRAGMA foreign_keys").get()).toEqual({ foreign_keys: 1 });
    expect(db.prepare("SELECT name FROM sqlite_schema WHERE name IN ('project_register','installation_operations_v7','store_migration_receipts_v7')").all()).toEqual([]);
    expect(db.prepare("SELECT COUNT(*) AS count FROM sqlite_schema WHERE type='trigger'").get()).toEqual({ count: 0 });
    expect(columns(db, "installation_operations")).toEqual(["operation_id", "checkout_id", "operation", "status", "before_ledger", "after_ledger", "created_at", "finished_at", "plan_complete"]);
    expect(db.prepare("SELECT COUNT(*) AS count FROM installation_operations").get()).toEqual({ count: 3 });
    expect(db.prepare("SELECT MAX(schema_version) AS version FROM store_schema_journal").get()).toEqual({ version: 6 });
    db.close();
    expect(classifyStoreCheckpoint9State(store)).toMatchObject({ state: "supported-legacy", schemaVersion: 6 });
  });

  it("refuses a newer schema without reading or changing its bytes", () => {
    openStoreDatabase(store).db.close();
    const raw = new DatabaseSync(path.join(store, "store.db"));
    raw.exec("PRAGMA user_version=10");
    raw.close();
    const bytes = readFileSync(path.join(store, "store.db"));
    expect(() => openStoreDatabase(store)).toThrow(StoreSchemaNewerError);
    expect(classifyStoreCheckpoint9State(store)).toMatchObject({ state: "newer-unknown", schemaVersion: 10 });
    expect(readFileSync(path.join(store, "store.db"))).toEqual(bytes);
  });

  it("creates a fresh v7 Store with mode 0600, every guard trigger, and the full schema journal", () => {
    withStoreDatabase(store, (db) => {
      expect(inspectStoreWriteGuard(db)).toEqual([]);
      const triggers = db.prepare("SELECT COUNT(*) AS count FROM sqlite_schema WHERE type='trigger' AND name LIKE 'make_docs_guard_%'").get() as { count: number };
      expect(triggers.count).toBe(V7_TABLES.length * STORE_WRITE_GUARD_EVENTS.length);
      // Schema v9 (W30 R0 P2) adds two triggers that are not guard triggers: a saved plan revision and a final assignment never change.
      expect((db.prepare("SELECT name FROM sqlite_schema WHERE type='trigger' AND name NOT LIKE 'make_docs_guard_%' ORDER BY name").all() as Array<{ name: string }>).map((row) => row.name))
        .toEqual(["factory_assignments_final_status", "factory_workflow_plans_never_change"]);
      expect(readStoreSchemaJournal(db).journal.map((row) => row.version)).toEqual([3, 4, 5, 6, 7, 8, 9]);
    });
    if (POSIX) expect(statSync(path.join(store, "store.db")).mode & 0o777).toBe(0o600);
  });
});

describe("W32 R0 P2 write guard (A6, A7, A8)", () => {
  it("refuses every write from a connection without the guard function, changes nothing, and still reads", () => {
    withStoreDatabase(store, (db) => {
      upsertWorkEvidence(db, { projectId: "p", waveSlug: "w", phasePath: "docs/work/w/01.md", evidenceKind: "k", payload: { ok: true } });
    });
    const before = readFileSync(path.join(store, "store.db"));
    const raw = new DatabaseSync(path.join(store, "store.db"));
    try {
      expect(raw.prepare("SELECT evidence_kind FROM work_evidence").all()).toEqual([{ evidence_kind: "k" }]);
      expect(() => raw.exec("INSERT INTO project_register VALUES ('p','name','now','now')")).toThrow(/no such function: make_docs_write_guard/);
      expect(() => raw.exec("UPDATE work_evidence SET payload='{}'")).toThrow(/no such function: make_docs_write_guard/);
      expect(() => raw.exec("DELETE FROM work_evidence")).toThrow(/no such function: make_docs_write_guard/);
      expect(raw.prepare("SELECT payload FROM work_evidence").get()).toEqual({ payload: '{"ok":true}' });
      expect(raw.prepare("SELECT COUNT(*) AS count FROM project_register").get()).toEqual({ count: 0 });
    } finally {
      raw.close();
    }
    expect(readFileSync(path.join(store, "store.db"))).toEqual(before);
  });

  it("lets every Make Docs Store open path write", () => {
    // 1. openStoreDatabase and withStoreDatabase (project state, lifecycle, backlog cache, MCP tools).
    withStoreDatabase(store, (db) => {
      upsertWorkEvidence(db, { projectId: "p", waveSlug: "w", phasePath: "a.md", evidenceKind: "one", payload: 1 });
    });
    // 2. openStoreSqliteConnection (installation state, tool operations, Store removal check).
    const direct = openStoreSqliteConnection(path.join(store, "store.db"));
    direct.prepare("INSERT INTO project_register VALUES ('p','name','now','now')").run();
    direct.close();
    // 3. withInstallationDatabase and withInstallationOperation (setup, layout, recovery).
    operation(() => replace("note.md", "text"));
    withInstallationDatabase(project, (db) => db.prepare("DELETE FROM project_register").run(), { storeRoot: store });
    // 4. The checkpoint-9 migration entry point on a current Store (its own connection).
    expect(migrateStoreDatabaseAtCheckpoint9(store, journalEntry("current")).migrated).toBe(false);
    // 5. applyStoreMigrations registers the guard on the connection it is given.
    const raw = new DatabaseSync(path.join(store, "store.db"));
    expect(applyStoreMigrations(raw, CURRENT_STORE_SCHEMA_VERSION)).toBe(CURRENT_STORE_SCHEMA_VERSION);
    raw.prepare("UPDATE work_evidence SET evidence_kind='two'").run();
    raw.close();
    withStoreDatabase(store, (db) => {
      expect(db.prepare("SELECT evidence_kind FROM work_evidence").all()).toEqual([{ evidence_kind: "two" }]);
      expect(db.prepare("SELECT COUNT(*) AS count FROM installation_operations WHERE status='completed'").get()).toEqual({ count: 1 });
    });
  });

  it("fails the guard check when any table lacks its triggers, including a later table", () => {
    withStoreDatabase(store, (db) => {
      expect(inspectStoreWriteGuard(db)).toEqual([]);
      db.exec("CREATE TABLE later_table (id TEXT)");
      expect(inspectStoreWriteGuard(db)).toEqual(STORE_WRITE_GUARD_EVENTS.map((event) => `Table later_table has no BEFORE ${event.toUpperCase()} guard trigger.`));
      db.exec("DROP TABLE later_table");
    });
    // Every table the catalog names has all three triggers in a fresh Store.
    withStoreDatabase(store, (db) => {
      for (const table of V7_TABLES) {
        for (const event of STORE_WRITE_GUARD_EVENTS) {
          expect(db.prepare("SELECT 1 AS ok FROM sqlite_schema WHERE type='trigger' AND name=? AND tbl_name=?").get(storeWriteGuardTriggerName(table, event), table), `${table} ${event}`).toEqual({ ok: 1 });
        }
      }
    });
  });

  it.each([
    ["removed", (db: DatabaseSync) => db.exec(`DROP TRIGGER ${storeWriteGuardTriggerName("work_evidence", "delete")}`), /work_evidence has no BEFORE DELETE guard trigger/],
    ["changed", (db: DatabaseSync) => {
      db.exec(`DROP TRIGGER ${storeWriteGuardTriggerName("work_evidence", "update")}`);
      db.exec(`CREATE TRIGGER ${storeWriteGuardTriggerName("work_evidence", "update")} BEFORE UPDATE ON work_evidence BEGIN SELECT 1; END`);
    }, /guard trigger of table work_evidence changed/],
    ["unguarded table", (db: DatabaseSync) => db.exec("CREATE TABLE outside_table (id TEXT)"), /outside_table has no BEFORE INSERT guard trigger/],
  ] as const)("reports a %s trigger as store-unsafe, changed outside Make Docs, with the next action", async (_case, change, detail) => {
    openStoreDatabase(store).db.close();
    const backup = path.join(store, "store.db.bridge-v6-to-v7-test.backup");
    writeFileSync(backup, "backup bytes");
    const raw = new DatabaseSync(path.join(store, "store.db"));
    change(raw);
    raw.close();
    const bytes = readFileSync(path.join(store, "store.db"));

    const classified = classifyStoreCheckpoint9State(store);
    expect(classified).toMatchObject({ state: "unknown", issue: { code: "changed-outside" } });
    expect(classified.state === "unknown" ? classified.reason : "").toMatch(detail);
    let opened: unknown;
    try { openStoreDatabase(store); } catch (error) { opened = error; }
    expect(opened).toBeInstanceOf(StoreCheckpoint9StateError);
    const message = (opened as Error).message;
    expect(message).toContain("changed outside Make Docs");
    expect(message).toContain("make-docs setup store check");
    expect(message).toContain(backup);
    expect(() => openStoreSqliteConnection(path.join(store, "store.db"), { readOnly: true })).toThrow(/changed outside Make Docs/);
    expect(() => withInstallationDatabase(project, () => undefined, { storeRoot: store, readOnly: true })).toThrow(/changed outside Make Docs/);
    expect(readInstallationStatus(project, store)).toMatchObject({ status: "store-unavailable", nextAction: expect.stringContaining("changed outside Make Docs") });

    const failure = new StoreUnavailableError(makeStoreIssue("changed-outside", path.join(store, "store.db"), "check Store write guard", new Error("Table runs has no BEFORE INSERT guard trigger.")));
    let scoped: unknown;
    try {
      await invokeOperation("project.state.status", { targetRoot: project }, createExecutionContext({
        surface: "cli", route: "direct-cli", cwd: project, storeSession: async () => { throw failure; },
      }));
    } catch (error) { scoped = error; }
    expect(serializeOperationError(scoped)).toMatchObject({
      code: "store-unsafe",
      nextAction: expect.stringContaining("make-docs setup store check"),
    });
    expect(readFileSync(path.join(store, "store.db"))).toEqual(bytes);
  });
});

describe("W32 R0 P2 defect fixes (A9, A10)", () => {
  it("writes the checkpoint-9 receipt for a v6 Store under the widened check", () => {
    const db = seedV6(store);
    seedV6Rows(db);
    db.close();
    const entry = journalEntry("v6");
    const result = migrateStoreDatabaseAtCheckpoint9(store, entry);
    expect(result).toMatchObject({ migrated: true, previousSchemaVersion: 6, schemaVersion: CURRENT_STORE_SCHEMA_VERSION });
    expect(result.backupPath).toContain(`bridge-v6-to-v${CURRENT_STORE_SCHEMA_VERSION}`);
    withStoreDatabase(store, (opened) => {
      expect(opened.prepare("SELECT source_schema_version,target_schema_version FROM store_migration_receipts WHERE receipt_id=?").get(entry.receiptId)).toEqual({ source_schema_version: 6, target_schema_version: CURRENT_STORE_SCHEMA_VERSION });
      expect(inspectStoreWriteGuard(opened)).toEqual([]);
    });
  });

  it("writes the checkpoint-9 receipt for a new Store from source 0", () => {
    const entry = journalEntry("fresh");
    expect(migrateStoreDatabaseAtCheckpoint9(store, entry)).toMatchObject({ migrated: true, previousSchemaVersion: null, schemaVersion: CURRENT_STORE_SCHEMA_VERSION });
    withStoreDatabase(store, (db) => {
      expect(db.prepare("SELECT source_schema_version,target_schema_version FROM store_migration_receipts").all()).toEqual([{ source_schema_version: 0, target_schema_version: CURRENT_STORE_SCHEMA_VERSION }]);
    });
  });

  it("does not rewrite the checkout path or verification on a committed operation", () => {
    operation(() => replace("note.md", "one"));
    withInstallationDatabase(project, (db) => {
      db.prepare("UPDATE installation_checkouts SET verified_at='sentinel-time', verification_json='{\"schemaVersion\":2,\"projectId\":\"sentinel\",\"ledgerDigest\":null,\"ownershipFacts\":[]}'").run();
    }, { storeRoot: store });
    const before = withInstallationDatabase(project, (db) => db.prepare("SELECT * FROM installation_checkouts").all(), { storeRoot: store, readOnly: true });
    expect(before).toHaveLength(1);
    operation(() => replace("note.md", "two"));
    const after = withInstallationDatabase(project, (db) => db.prepare("SELECT * FROM installation_checkouts").all(), { storeRoot: store, readOnly: true });
    expect(after).toEqual(before);
  });

  it("fills the four receipt columns when an operation reaches a terminal state", () => {
    operation(() => replace("note.md", "text"));
    withInstallationDatabase(project, (db) => {
      const row = db.prepare("SELECT before_ledger,after_ledger,before_ledger_digest,after_ledger_digest,step_count,applied_step_count FROM installation_operations WHERE status='completed'").get() as Record<string, unknown>;
      const steps = db.prepare("SELECT COUNT(*) AS count, SUM(applied) AS applied FROM installation_steps").get() as { count: number; applied: number };
      expect(row.before_ledger_digest).toBe(row.before_ledger === null ? null : sha(String(row.before_ledger)));
      expect(row.after_ledger_digest).toBe(row.after_ledger === null ? null : sha(String(row.after_ledger)));
      expect(row.step_count).toBe(steps.count);
      expect(row.applied_step_count).toBe(steps.applied);
    }, { storeRoot: store, readOnly: true });
  });

  it("records a failed operation as failed with bounded fields, blocks the checkout, and recovers it (T13)", () => {
    let error: unknown;
    try {
      operation(() => { replace("note.md", "new"); sealInstallationOperation(project); throw new Error("secret raw text /private/file"); });
    } catch (caught) { error = caught; }
    expect((error as Error).message).toContain("Failed operation:");
    const status = readInstallationStatus(project, store) as unknown as { status: string; pendingOperation: Record<string, unknown> };
    expect(status.status).toBe("recovery-required");
    expect(status.pendingOperation).toMatchObject({
      status: "failed",
      failure: { code: "operation-error", stage: "apply", summary: "The test.change operation stopped during apply (operation-error).", nextAction: expect.stringContaining("make-docs project state status") },
    });
    const id = String(status.pendingOperation.operation_id);
    const row = withInstallationDatabase(project, (db) => db.prepare("SELECT * FROM installation_operations WHERE operation_id=?").get(id), { storeRoot: store, readOnly: true }) as Record<string, unknown>;
    expect(row).toMatchObject({ status: "failed", failure_code: "operation-error", failed_stage: "apply", finished_at: null, before_ledger_digest: null });
    expect(JSON.stringify(row)).not.toContain("secret raw text");
    expect(() => operation(() => replace("other.md", "blocked"))).toThrow(/recover/);

    // Recovery stays open while the status is failed. A commit closes it and keeps the failure as history.
    expect(recoverInstallationOperation(project, id, "resume", true, store).status).toBe("ready");
    expect(recoverInstallationOperation(project, id, "resume", false, store).status).toBe("completed");
    const closed = withInstallationDatabase(project, (db) => db.prepare("SELECT status,failure_code,failed_stage,step_count,applied_step_count FROM installation_operations WHERE operation_id=?").get(id), { storeRoot: store, readOnly: true });
    expect(closed).toMatchObject({ status: "completed", failure_code: "operation-error", failed_stage: "apply" });
    expect(STORE_FAILED_RECOVERY_CLOSED.closingStatuses).toContain((closed as { status: "completed" }).status);
    operation(() => replace("other.md", "allowed"));
  });

  it("refuses an oversized work_evidence payload with a typed result that names the limit", () => {
    expect(WORK_EVIDENCE_PAYLOAD_LIMIT_BYTES).toBe(65_536);
    withStoreDatabase(store, (db) => {
      const input = { projectId: "p", waveSlug: "w", phasePath: "a.md", evidenceKind: "k" };
      // JSON.stringify adds two quote bytes, so this string is exactly at the limit.
      upsertWorkEvidence(db, { ...input, payload: "x".repeat(WORK_EVIDENCE_PAYLOAD_LIMIT_BYTES - 2) });
      let error: unknown;
      try { upsertWorkEvidence(db, { ...input, evidenceKind: "big", payload: "x".repeat(WORK_EVIDENCE_PAYLOAD_LIMIT_BYTES - 1) }); } catch (caught) { error = caught; }
      expect(error).toBeInstanceOf(WorkEvidencePayloadTooLargeError);
      expect(serializeOperationError(error)).toMatchObject({ code: "work-evidence-payload-too-large", message: expect.stringContaining("65536 bytes (64 KiB)") });
      expect((error as WorkEvidencePayloadTooLargeError).payloadBytes).toBe(WORK_EVIDENCE_PAYLOAD_LIMIT_BYTES + 1);
      expect(db.prepare("SELECT evidence_kind FROM work_evidence").all()).toEqual([{ evidence_kind: "k" }]);
    });
  });

  it("reads store_schema_journal in Store status and reports a missing version", () => {
    operation(() => replace("note.md", "text"));
    expect(readInstallationStatus(project, store)).toMatchObject({ storeSchema: { schemaVersion: CURRENT_STORE_SCHEMA_VERSION, journalVersions: [3, 4, 5, 6, 7, 8, 9], missingVersions: [], warning: null } });
    withInstallationDatabase(project, (db) => db.prepare("DELETE FROM store_schema_journal WHERE schema_version=5").run(), { storeRoot: store });
    expect(readInstallationStatus(project, store)).toMatchObject({
      storeSchema: { journalVersions: [3, 4, 6, 7, 8, 9], missingVersions: [5], warning: expect.stringContaining("no row for version 5") },
    });
  });
});

describe("W32 R0 P2 follow-ups (A26, A27)", () => {
  it("reports a completed layout operation with a pruned plan as complete in layout apply and recover --dry-run", () => {
    vi.stubEnv("MAKE_DOCS_HOME", store);
    mkdirSync(path.join(project, "docs/artifacts"), { recursive: true });
    writeFileSync(path.join(project, "docs/artifacts/note.md"), "# Shared note\n");
    const plan = previewProjectLayout(project);
    const prepared = prepareProjectLayout(project, plan.digest, "cli", [], store);
    expect(applyProjectLayout(project, prepared.operationId, "apply", false, store)).toMatchObject({ status: "completed" });
    withInstallationDatabase(project, (db) => {
      db.prepare("DELETE FROM installation_migration_records WHERE kind='snapshot' AND record_id=?").run(`detached:${prepared.operationId}`);
    }, { storeRoot: store });
    expect(readDetachedInstallationOperation(project, prepared.operationId, "project.layout.prepare", store, { allowPruned: true }))
      .toEqual({ status: "completed", plan: null, planPruned: true });
    expect(applyProjectLayout(project, prepared.operationId, "apply", false, store)).toMatchObject({ status: "already-complete", planPruned: true });
    expect(recoverInstallationOperation(project, prepared.operationId, "resume", true, store)).toMatchObject({ status: "completed", conflicts: [] });
    expect(recoverInstallationOperation(project, prepared.operationId, "rollback", true, store).status).toBe("completed");
    // A pending operation without its plan is still damage.
    const second = path.join(temp, "second");
    mkdirSync(path.join(second, "docs/artifacts"), { recursive: true });
    writeFileSync(path.join(second, "docs/artifacts/note.md"), "# Other\n");
    const pending = prepareProjectLayout(second, previewProjectLayout(second).digest, "cli", [], store);
    withInstallationDatabase(second, (db) => db.prepare("DELETE FROM installation_migration_records WHERE record_id=?").run(`detached:${pending.operationId}`), { storeRoot: store });
    expect(() => applyProjectLayout(second, pending.operationId, "apply", false, store)).toThrow(/saved layout plan is missing/);
  });

  it("records when a failed operation's recovery is closed, and P4 turns rules 004 and 005 on", () => {
    expect(STORE_FAILED_RECOVERY_CLOSED).toMatchObject({ followUp: "FOLLOW-UP-P2-FAILED-RECOVERY-CLOSED", openStatuses: ["failed"], closingStatuses: ["completed", "rolled-back"] });
    expect(STORE_FAILED_RECOVERY_CLOSED.definition).toContain("project state recover");
    expect(STORE_FAILED_RECOVERY_CLOSED.whileOpen).toContain("No fixed rule touches");
    const followUps = new Map(STORE_FOLLOW_UPS.map((followUp) => [followUp.id, followUp]));
    for (const id of ["FOLLOW-UP-P2-FAILED-RECOVERY-CLOSED", "FOLLOW-UP-P2-OPERATION-RECEIPT-COLUMNS", "FOLLOW-UP-P2-PRUNED-DETACHED-PLAN"] as const) {
      expect(followUps.get(id)).toMatchObject({ state: "done", resolution: expect.any(String) });
    }
    for (const id of ["STORE-RULE-004", "STORE-RULE-005"]) {
      // W32 R0 P4 implemented their write contract and turned them on.
      expect(STORE_FIXED_RULES.find((rule) => rule.id === id)!.activation).toEqual({ state: "active" });
    }
    // No fixed rule or candidate query treats a failed operation as terminal.
    for (const rule of STORE_FIXED_RULES) {
      for (const query of rule.candidates) {
        for (const match of query.sql.matchAll(/status IN \(([^)]*)\)/g)) {
          if (match[1]!.includes("'completed'")) expect(match[1], rule.id).not.toContain("'failed'");
        }
      }
    }
  });
});

it("keeps file mode 0600 on a Store file that was wider", () => {
  if (!POSIX) return;
  const db = seedV6(path.join(temp, "legacy"));
  db.close();
  chmodSync(path.join(temp, "legacy", "store.db"), 0o644);
  expect(migrateStoreDatabaseAtCheckpoint9(path.join(temp, "legacy"), journalEntry("mode")).migrated).toBe(true);
  expect(statSync(path.join(temp, "legacy", "store.db")).mode & 0o777).toBe(0o600);
});

describe("W32 R0 P2 review fixes", () => {
  function orphanStep(db: DatabaseSync): void {
    db.exec("PRAGMA foreign_keys=OFF");
    db.prepare("INSERT INTO installation_steps VALUES (?,?,?,?,?,?)").run("op-gone", 1, "orphan.md", '{"kind":"missing"}', '{"kind":"file"}', 0);
    db.exec("PRAGMA foreign_keys=ON");
  }

  it("keeps and reports a reference that was broken before the migration, and does not block setup", () => {
    const db = seedV6(store);
    seedV6Rows(db);
    orphanStep(db);
    db.close();
    const preview = previewStoreCompatibilityBridge(store);
    expect(preview.blockers).toEqual([]);
    expect(preview.records).toEqual(expect.arrayContaining([expect.objectContaining({
      bridgeId: "w32-r0-p2-broken-references",
      disposition: "retain-history",
      count: 1,
      reason: expect.stringContaining("make-docs setup store check"),
    })]));
    expect(migrateStoreDatabaseAtCheckpoint9(store, journalEntry("orphan"))).toMatchObject({ migrated: true, schemaVersion: CURRENT_STORE_SCHEMA_VERSION });
    withStoreDatabase(store, (opened) => {
      expect(inspectStoreBrokenReferences(opened)).toEqual([{ table: "installation_steps", parent: "installation_operations", count: 1 }]);
      expect(opened.prepare("SELECT relative_path FROM installation_steps WHERE operation_id='op-gone'").get()).toEqual({ relative_path: "orphan.md" });
    });
  });

  it("refuses a reference that the migration itself breaks, and rolls back", () => {
    const db = seedV6(store);
    seedV6Rows(db);
    orphanStep(db);
    const migration = STORE_MIGRATIONS.find((candidate) => candidate.version === 7)!;
    const at = migration.statements.findIndex((statement) => statement.startsWith("ALTER TABLE installation_operations_v7 RENAME")) + 1;
    migration.statements.splice(at, 0, "DELETE FROM installation_operations WHERE operation_id='op-completed'");
    try {
      expect(() => applyStoreMigrations(db, 6)).toThrow(/would break foreign key references, first in installation_steps to installation_operations/);
    } finally {
      migration.statements.splice(at, 1);
    }
    expect(db.prepare("PRAGMA user_version").get()).toEqual({ user_version: 6 });
    expect(db.prepare("SELECT COUNT(*) AS count FROM installation_operations").get()).toEqual({ count: 3 });
    db.close();
  });

  it("reports an old broken reference in Store status with its repair step", () => {
    operation(() => replace("note.md", "text"));
    withInstallationDatabase(project, (db) => {
      db.exec("PRAGMA foreign_keys=OFF");
      db.prepare("INSERT INTO installation_steps VALUES (?,?,?,?,?,?)").run("op-gone", 1, "orphan.md", '{"kind":"missing"}', '{"kind":"file"}', 0);
    }, { storeRoot: store });
    expect(readInstallationStatus(project, store)).toMatchObject({
      storeIntegrity: {
        brokenReferences: [{ table: "installation_steps", parent: "installation_operations", count: 1 }],
        brokenReferencesWarning: expect.stringContaining("1 row(s) in installation_steps point to a missing installation_operations row"),
      },
    });
  });

  it("skips and reports a virtual table that an older program added, instead of failing", () => {
    const db = seedV6(store);
    db.exec("CREATE VIRTUAL TABLE notes USING fts5(body)");
    expect(applyStoreMigrations(db, 6)).toBe(CURRENT_STORE_SCHEMA_VERSION);
    expect(inspectStoreWriteGuard(db as never)).toEqual([]);
    expect(listUnguardableStoreTables(db as never)).toEqual([
      { table: "notes", kind: "virtual" },
      { table: "notes_config", kind: "shadow" },
      { table: "notes_content", kind: "shadow" },
      { table: "notes_data", kind: "shadow" },
      { table: "notes_docsize", kind: "shadow" },
      { table: "notes_idx", kind: "shadow" },
    ]);
    db.close();
    openStoreDatabase(store).db.close();
    operation(() => replace("note.md", "text"));
    expect(readInstallationStatus(project, store)).toMatchObject({
      storeIntegrity: { unguardableWarning: expect.stringContaining("SQLite cannot guard virtual table notes") },
    });
  });

  it("sets mode 0600 on Store backups that an older version left", () => {
    if (!POSIX) return;
    const db = seedV6(store);
    const oldBridge = path.join(store, "store.db.bridge-v4-to-v6-old.backup");
    const maintenance = path.join(store, "backup", "store-2026-11-01.db");
    writeFileSync(oldBridge, "old");
    mkdirSync(path.dirname(maintenance));
    writeFileSync(maintenance, "old");
    chmodSync(oldBridge, 0o644);
    chmodSync(maintenance, 0o644);
    applyStoreMigrations(db, 6);
    db.close();
    expect(statSync(oldBridge).mode & 0o777).toBe(0o600);
    expect(statSync(maintenance).mode & 0o777).toBe(0o600);
  });
});
