import path from "node:path";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { afterEach, describe, expect, test, vi } from "vitest";
import { callMakeDocsMcpTool, deriveMcpToolName } from "../src/mcp/tools";
import {
  createExecutionContext,
  serializeOperationError,
} from "../src/operations/context";
import { invokeOperation, listOperations } from "../src/operations/registry";
import { OperationError } from "../src/operations/types";
import { listRunCliAdapters, runRunCommand } from "../src/run/cli";
import { runCli } from "../src/cli";
import {
  MIGRATION_CHECKPOINTS,
  executeStoreCheckpoint9Migration,
} from "../src/migration";
import {
  CURRENT_STORE_SCHEMA_VERSION,
  STORE_BUSY_TIMEOUT_MS,
  STORE_MIGRATIONS,
  LifecycleVersionConflictError,
  StoreSchemaNewerError,
  StoreMigrationRequiredError,
  applyStoreMigrations,
  attachLifecycleEvidence,
  createLifecycleRun,
  deleteProjectRows,
  listLifecycleEvidence,
  listLifecycleRuns,
  loadSqliteDriver,
  openStoreDatabase,
  readLifecycleRun,
  readUserVersion,
  transitionLifecycleRun,
  withStoreDatabase,
  type StoreDatabase,
  type LifecycleStatus,
} from "../src/store";
import { cleanupTempDir, createTempDir, writeMinimalManifest } from "./helpers";

const sqliteAvailable = loadSqliteDriver().available;
const roots: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  while (roots.length > 0) cleanupTempDir(roots.pop()!);
});

function storeRoot(): string {
  const root = createTempDir("make-docs-p6-store-");
  roots.push(root);
  return path.join(root, "store");
}

function projectRoot(projectId = "project-1"): string {
  const root = createTempDir("make-docs-p6-project-");
  roots.push(root);
  writeMinimalManifest(root, projectId);
  return root;
}

function operationContext(surface: "test" | "cli" | "mcp" = "test") {
  return createExecutionContext({
    surface,
    writesAllowed: true,
    now: () => "2026-08-30T12:00:00.000Z",
  });
}

function operationForStatus(
  status: Exclude<LifecycleStatus, "active">,
): "lifecycle.pause" | "lifecycle.complete" | "lifecycle.fail" | "lifecycle.abandon" {
  switch (status) {
    case "paused": return "lifecycle.pause";
    case "completed": return "lifecycle.complete";
    case "failed": return "lifecycle.fail";
    case "abandoned": return "lifecycle.abandon";
  }
}

function seedVersionOne(db: StoreDatabase): void {
  for (const statement of STORE_MIGRATIONS[0]!.statements) db.exec(statement);
  db.exec("PRAGMA user_version = 1");
}

function rawDatabase(databasePath: string): StoreDatabase {
  const driver = loadSqliteDriver();
  if (!driver.available) throw new Error(driver.reason);
  mkdirSync(path.dirname(databasePath), { recursive: true });
  return new driver.sqlite.DatabaseSync(databasePath);
}

async function captureError(run: () => Promise<unknown>): Promise<unknown> {
  try {
    await run();
  } catch (error) {
    return error;
  }
  throw new Error("Expected the operation to fail.");
}

describe.skipIf(!sqliteAvailable)("W19 R1 P6 global Store lifecycle candidate", () => {
  test("1: fresh Store reaches checkpoint-9 schema with both new relations", () => {
    const root = storeRoot();
    const open = openStoreDatabase(root);
    try {
      expect(open.schemaVersion).toBe(2);
      expect(readUserVersion(open.db)).toBe(2);
      const tables = open.db.prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
      ).all() as Array<{ name: string }>;
      expect(tables.map((row) => row.name)).toEqual([
        "playbook_runs",
        "projects",
        "run_evidence",
        "runs",
        "store_checkpoint_journal",
        "work_evidence",
      ]);
    } finally {
      open.db.close();
    }
  });

  test("2: version-1 migration preserves legacy rows byte-semantically and unrelated rows", () => {
    const root = storeRoot();
    const databasePath = path.join(root, "store.db");
    const db = rawDatabase(databasePath);
    const record = '{  "legacy": true, "meaning": "opaque"  }';
    try {
      seedVersionOne(db);
      db.prepare(
        `INSERT INTO projects
          (project_id, root_path, package_name, package_version, registered_at, last_seen_at)
         VALUES (?, ?, NULL, NULL, ?, ?)`,
      ).run("project-1", "/tmp/project-1", "2026-08-30T00:00:00.000Z", "2026-08-30T00:00:00.000Z");
      db.prepare(
        `INSERT INTO playbook_runs (project_id, run_id, record, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
      ).run("project-1", "legacy-1", record, "start", "update");
      db.prepare(
        `INSERT INTO work_evidence
          (project_id, wave_slug, phase_path, evidence_kind, payload, repo_root, recorded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run("project-1", "w1-r1", "docs/work/01.md", "review", '{"passed":true}', "/tmp/project-1", "now");
      db.exec("CREATE TABLE unrelated_state (key TEXT PRIMARY KEY, value BLOB)");
      db.exec("CREATE INDEX unrelated_state_value ON unrelated_state (value)");
      db.prepare("INSERT INTO unrelated_state (key, value) VALUES (?, ?)").run("kept", Buffer.from([0, 1, 2, 255]));
      const schemaBefore = db.prepare(
        "SELECT type, name, tbl_name, sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name",
      ).all();
      const legacyHexBefore = db.prepare(
        "SELECT hex(record) AS record_hex FROM playbook_runs WHERE run_id = ?",
      ).get("legacy-1");

      expect(applyStoreMigrations(db, 1)).toBe(2);
      const checkpoint9Objects = new Set([
        "runs",
        "idx_runs_project_status",
        "run_evidence",
        "idx_run_evidence_run",
        "store_checkpoint_journal",
        "idx_store_checkpoint_journal_project",
      ]);
      const preservedSchema = (db.prepare(
        "SELECT type, name, tbl_name, sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name",
      ).all() as Array<{ name: string }>).filter((entry) => !checkpoint9Objects.has(entry.name));
      expect(preservedSchema).toEqual(schemaBefore);
      expect(db.prepare(
        "SELECT hex(record) AS record_hex FROM playbook_runs WHERE run_id = ?",
      ).get("legacy-1")).toEqual(legacyHexBefore);
      expect(db.prepare("SELECT COUNT(*) AS count FROM projects").get()).toEqual({ count: 1 });
      expect(db.prepare("SELECT COUNT(*) AS count FROM work_evidence").get()).toEqual({ count: 1 });
      expect(db.prepare("SELECT hex(value) AS value_hex FROM unrelated_state WHERE key = 'kept'").get())
        .toEqual({ value_hex: "000102FF" });
    } finally {
      db.close();
    }
  });

  test("3: fresh-project and no-op install paths run checkpoint 9 for an existing v1 Store", async () => {
    const root = storeRoot();
    const db = rawDatabase(path.join(root, "store.db"));
    seedVersionOne(db);
    db.close();
    expect(() => openStoreDatabase(root)).toThrow(StoreMigrationRequiredError);
    const freshProject = createTempDir("make-docs-p6-fresh-project-");
    roots.push(freshProject);
    const previousStoreRoot = process.env.MAKE_DOCS_HOME;
    process.env.MAKE_DOCS_HOME = root;
    try {
      await runCli(["setup", "--yes", "--target", freshProject]);
      const freshOpen = openStoreDatabase(root);
      expect(freshOpen.schemaVersion).toBe(2);
      freshOpen.db.close();

      const noOpStore = storeRoot();
      const noOpDb = rawDatabase(path.join(noOpStore, "store.db"));
      seedVersionOne(noOpDb);
      noOpDb.close();
      process.env.MAKE_DOCS_HOME = noOpStore;
      await runCli(["setup", "--yes", "--target", freshProject]);
      const noOpOpen = openStoreDatabase(noOpStore);
      expect(noOpOpen.schemaVersion).toBe(2);
      noOpOpen.db.close();
      expect(executeStoreCheckpoint9Migration({
        projectRoot: freshProject,
        storeRoot: noOpStore,
      })).toMatchObject({
        status: "completed",
        checkpoint: 9,
        recoveredProjection: true,
        setupMayContinue: true,
      });
    } finally {
      if (previousStoreRoot === undefined) delete process.env.MAKE_DOCS_HOME;
      else process.env.MAKE_DOCS_HOME = previousStoreRoot;
    }
  });

  test("4: double receipt-projection failure returns a typed stop and journal recovery preserves later writes", async () => {
    const root = storeRoot();
    const db = rawDatabase(path.join(root, "store.db"));
    try {
      seedVersionOne(db);
      db.prepare(
        "INSERT INTO playbook_runs (project_id, run_id, record, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      ).run("project-1", "legacy-1", '{"opaque":true}', "start", "update");
    } finally {
      db.close();
    }
    writeFileSync(path.join(root, "machine-owned.bin"), Buffer.from([0, 2, 4, 255]));
    const project = projectRoot();
    const receiptPath = path.join(project, ".make-docs", "state", "migration-receipts");
    mkdirSync(path.dirname(receiptPath), { recursive: true });
    // Planned failure point 1: receipt persistence cannot create its directory.
    writeFileSync(receiptPath, "blocked");
    const stopped = executeStoreCheckpoint9Migration({ projectRoot: project, storeRoot: root });
    expect(stopped).toEqual({
      schemaVersion: 1,
      status: "receipt-projection-failed",
      checkpoint: 9,
      code: "checkpoint-receipt-projection-failed",
      receiptId: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      projectionAttempts: 2,
      storeCommitted: true,
      setupMayContinue: false,
      message: expect.stringContaining("could not be projected twice"),
    });
    const committed = rawDatabase(path.join(root, "store.db"));
    try {
      expect(readUserVersion(committed)).toBe(2);
      expect(committed.prepare(
        "SELECT record FROM playbook_runs WHERE project_id = ? AND run_id = ?",
      ).get("project-1", "legacy-1")).toEqual({ record: '{"opaque":true}' });
      expect(committed.prepare(
        "SELECT receipt_id FROM store_checkpoint_journal WHERE checkpoint = 9",
      ).get()).toEqual({ receipt_id: stopped.receiptId });
      committed.exec("CREATE TABLE other_process_write (value TEXT)");
      committed.prepare("INSERT INTO other_process_write (value) VALUES (?)").run("preserved");
    } finally {
      committed.close();
    }
    expect(readFileSync(path.join(root, "machine-owned.bin"))).toEqual(Buffer.from([0, 2, 4, 255]));
    rmSync(receiptPath);
    const recovered = executeStoreCheckpoint9Migration({ projectRoot: project, storeRoot: root });
    expect(recovered).toMatchObject({
      status: "completed",
      receipt: { receiptId: stopped.receiptId },
      recoveredProjection: true,
      projectionAttempts: 1,
      setupMayContinue: true,
    });
    const afterRecovery = rawDatabase(path.join(root, "store.db"));
    try {
      expect(afterRecovery.prepare("SELECT value FROM other_process_write").get())
        .toEqual({ value: "preserved" });
    } finally {
      afterRecovery.close();
    }
    expect(readdirSync(path.dirname(root)).filter((name) => name.includes("checkpoint9"))).toEqual([]);

    const setupStore = storeRoot();
    const setupDb = rawDatabase(path.join(setupStore, "store.db"));
    seedVersionOne(setupDb);
    setupDb.close();
    const freshProject = createTempDir("make-docs-p6-projection-stop-");
    roots.push(freshProject);
    const blockedReceiptPath = path.join(
      freshProject,
      ".make-docs",
      "state",
      "migration-receipts",
    );
    mkdirSync(path.dirname(blockedReceiptPath), { recursive: true });
    writeFileSync(blockedReceiptPath, "blocked");
    const previousStoreRoot = process.env.MAKE_DOCS_HOME;
    process.env.MAKE_DOCS_HOME = setupStore;
    try {
      await expect(runCli(["setup", "--yes", "--target", freshProject]))
        .rejects.toMatchObject({
          code: "checkpoint-receipt-projection-failed",
          checkpointResult: {
            status: "receipt-projection-failed",
            projectionAttempts: 2,
            storeCommitted: true,
            setupMayContinue: false,
          },
        });
      expect(existsSync(path.join(freshProject, "AGENTS.md"))).toBe(false);
    } finally {
      if (previousStoreRoot === undefined) delete process.env.MAKE_DOCS_HOME;
      else process.env.MAKE_DOCS_HOME = previousStoreRoot;
    }
  });

  test("5: corrupt and newer Stores fail closed without quarantine or rewrite", () => {
    const corruptRoot = storeRoot();
    const corruptPath = path.join(corruptRoot, "store.db");
    mkdirSync(corruptRoot, { recursive: true });
    const corruptBytes = Buffer.from("not a sqlite database\0with opaque bytes");
    writeFileSync(corruptPath, corruptBytes);
    const corruptProject = projectRoot("corrupt-project");
    expect(() => executeStoreCheckpoint9Migration({
      projectRoot: corruptProject,
      storeRoot: corruptRoot,
    })).toThrow(/classified as corrupt/);
    expect(readFileSync(corruptPath)).toEqual(corruptBytes);
    expect(readdirSync(corruptRoot)).toEqual(["store.db"]);

    const root = storeRoot();
    const first = openStoreDatabase(root);
    first.db.exec("CREATE TABLE future_owned (value TEXT)");
    first.db.exec("PRAGMA user_version = 99");
    first.db.close();
    expect(() => openStoreDatabase(root)).toThrow(StoreSchemaNewerError);
    const db = rawDatabase(path.join(root, "store.db"));
    try {
      expect(readUserVersion(db)).toBe(99);
      expect(db.prepare("SELECT name FROM sqlite_master WHERE name='future_owned'").get()).toEqual({
        name: "future_owned",
      });
    } finally {
      db.close();
    }
  });

  test("6: current listings exclude legacy rows and project pruning keeps its prior contract", () => {
    const root = storeRoot();
    withStoreDatabase(root, (db) => {
      db.prepare(
        `INSERT INTO playbook_runs (project_id, run_id, record, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
      ).run("project-1", "legacy-1", "{}", "start", "update");
      createLifecycleRun(db, {
        projectId: "project-1",
        runId: "current-1",
        lifecycleStage: "design",
        committedAt: "2026-08-30T00:00:00.000Z",
      });
      expect(listLifecycleRuns(db, "project-1").map((run) => run.runId)).toEqual(["current-1"]);
      deleteProjectRows(db, "project-1");
      expect(listLifecycleRuns(db, "project-1")).toEqual([]);
      expect(
        db.prepare("SELECT record FROM playbook_runs WHERE project_id = ? AND run_id = ?")
          .get("project-1", "legacy-1"),
      ).toBeUndefined();
    });
    expect(MIGRATION_CHECKPOINTS.find((item) => item.checkpoint === 9)?.state).toBe("implemented");
    expect(MIGRATION_CHECKPOINTS.find((item) => item.checkpoint === 10)?.state).toBe("implemented");
  });

  test("7: a successful mutation returns only the exact minimal receipt fields", () => {
    const root = storeRoot();
    withStoreDatabase(root, (db) => {
      const result = createLifecycleRun(db, {
        projectId: "project-1",
        runId: "run-1",
        lifecycleStage: "plan",
        committedAt: "2026-08-30T01:02:03.000Z",
      });
      expect(Object.keys(result.receipt)).toEqual([
        "schemaVersion",
        "receiptId",
        "operation",
        "projectId",
        "runId",
        "storeSchemaVersion",
        "resultingVersion",
        "committedAt",
      ]);
      expect(result.receipt).toMatchObject({
        schemaVersion: 1,
        receiptId: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
        operation: "lifecycle.start",
        projectId: "project-1",
        runId: "run-1",
        storeSchemaVersion: CURRENT_STORE_SCHEMA_VERSION,
        resultingVersion: 1,
        committedAt: "2026-08-30T01:02:03.000Z",
      });
      const receiptSubject = {
        committedAt: "2026-08-30T01:02:03.000Z",
        operation: "lifecycle.start",
        projectId: "project-1",
        resultingVersion: 1,
        runId: "run-1",
        schemaVersion: 1,
        storeSchemaVersion: CURRENT_STORE_SCHEMA_VERSION,
      };
      expect(result.receipt.receiptId).toBe(
        `sha256:${createHash("sha256").update(JSON.stringify(receiptSubject)).digest("hex")}`,
      );
    });
  });

  test("8: optimistic conflict makes no write and emits no success receipt", () => {
    const root = storeRoot();
    withStoreDatabase(root, (db) => {
      createLifecycleRun(db, {
        projectId: "project-1",
        runId: "run-1",
        lifecycleStage: "work",
        committedAt: "2026-08-30T00:00:00.000Z",
      });
      // Planned failure point 2: stale expected version.
      expect(() => transitionLifecycleRun(db, {
        operation: "lifecycle.pause",
        projectId: "project-1",
        runId: "run-1",
        expectedVersion: 2,
        nextStatus: "paused",
        committedAt: "2026-08-30T00:01:00.000Z",
      })).toThrow(LifecycleVersionConflictError);
      expect(readLifecycleRun(db, "project-1", "run-1")).toMatchObject({
        status: "active",
        version: 1,
      });
    });
  });

  test("9: evidence insert and run-version change commit atomically", () => {
    const root = storeRoot();
    withStoreDatabase(root, (db) => {
      createLifecycleRun(db, {
        projectId: "project-1",
        runId: "run-1",
        lifecycleStage: "implementation",
        committedAt: "2026-08-30T00:00:00.000Z",
      });
      const result = attachLifecycleEvidence(db, {
        projectId: "project-1",
        runId: "run-1",
        expectedVersion: 1,
        evidenceId: "evidence-1",
        evidenceKind: "test-report",
        referenceType: "project-path",
        reference: "docs/assets/test-report.json",
        digest: `sha256:${"a".repeat(64)}`,
        committedAt: "2026-08-30T00:01:00.000Z",
      });
      expect(result.receipt.resultingVersion).toBe(2);
      expect(listLifecycleEvidence(db, "project-1", "run-1")).toEqual([
        expect.objectContaining({ evidenceId: "evidence-1", reference: "docs/assets/test-report.json" }),
      ]);
      expect(readLifecycleRun(db, "project-1", "run-1")?.version).toBe(2);
    });
  });

  test("10: duplicate evidence rolls back without advancing the run version", () => {
    const root = storeRoot();
    withStoreDatabase(root, (db) => {
      createLifecycleRun(db, {
        projectId: "project-1",
        runId: "run-1",
        lifecycleStage: "implementation",
        committedAt: "2026-08-30T00:00:00.000Z",
      });
      const base = {
        projectId: "project-1",
        runId: "run-1",
        evidenceId: "evidence-1",
        evidenceKind: "test-report",
        referenceType: "project-path" as const,
        reference: "docs/assets/test-report.json",
      };
      attachLifecycleEvidence(db, {
        ...base,
        expectedVersion: 1,
        committedAt: "2026-08-30T00:01:00.000Z",
      });
      // Planned failure point 3: duplicate stable evidence identity.
      expect(() => attachLifecycleEvidence(db, {
        ...base,
        expectedVersion: 2,
        committedAt: "2026-08-30T00:02:00.000Z",
      })).toThrow(/already exists/);
      expect(readLifecycleRun(db, "project-1", "run-1")?.version).toBe(2);
      expect(listLifecycleEvidence(db, "project-1", "run-1")).toHaveLength(1);
    });
  });

  test("11: database constraints reject unbounded metadata and roll back the run", () => {
    const root = storeRoot();
    withStoreDatabase(root, (db) => {
      // Planned failure point 4: metadata exceeds the schema bound.
      expect(() => createLifecycleRun(db, {
        projectId: "project-1",
        runId: "run-1",
        lifecycleStage: "design",
        metadata: { oversized: "x".repeat(5000) },
        committedAt: "2026-08-30T00:00:00.000Z",
      })).toThrow(/CHECK constraint failed/i);
      expect(readLifecycleRun(db, "project-1", "run-1")).toBeNull();
    });
  });

  test("12: cross-process checkpoint writers serialize and bounded busy failure leaves no partial row", async () => {
    const migrationRoot = storeRoot();
    const databasePath = path.join(migrationRoot, "store.db");
    const legacy = rawDatabase(databasePath);
    seedVersionOne(legacy);
    legacy.close();
    const project = projectRoot("serialized-project");
    const child = spawn(
      process.execPath,
      [
        "-e",
        [
          "const { DatabaseSync } = require('node:sqlite');",
          "const db = new DatabaseSync(process.env.CHECKPOINT_DB);",
          "db.exec('PRAGMA journal_mode = WAL');",
          "db.exec('BEGIN IMMEDIATE');",
          "db.exec('CREATE TABLE other_process_checkpoint_write (value TEXT)');",
          "db.prepare('INSERT INTO other_process_checkpoint_write (value) VALUES (?)').run('preserved');",
          "process.stdout.write('locked\\n');",
          "setTimeout(() => { db.exec('COMMIT'); db.close(); }, 150);",
        ].join(" "),
      ],
      {
        env: { ...process.env, CHECKPOINT_DB: databasePath },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    await new Promise<void>((resolve, reject) => {
      child.once("error", reject);
      child.stdout.once("data", () => resolve());
    });
    const serialized = executeStoreCheckpoint9Migration({
      projectRoot: project,
      storeRoot: migrationRoot,
    });
    expect(serialized.status).toBe("completed");
    if (child.exitCode === null) {
      await new Promise<void>((resolve, reject) => {
        child.once("error", reject);
        child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`child exited ${code}`)));
      });
    } else {
      expect(child.exitCode).toBe(0);
    }
    const serializedDb = rawDatabase(databasePath);
    try {
      expect(readUserVersion(serializedDb)).toBe(2);
      expect(serializedDb.prepare("SELECT value FROM other_process_checkpoint_write").get())
        .toEqual({ value: "preserved" });
    } finally {
      serializedDb.close();
    }

    const root = storeRoot();
    const first = openStoreDatabase(root);
    const second = openStoreDatabase(root);
    try {
      expect(STORE_BUSY_TIMEOUT_MS).toBe(5000);
      first.db.exec("BEGIN IMMEDIATE");
      second.db.exec("PRAGMA busy_timeout = 1");
      // Planned failure point 5: a second writer cannot obtain the transaction lock.
      expect(() => createLifecycleRun(second.db, {
        projectId: "project-1",
        runId: "run-1",
        lifecycleStage: "design",
        committedAt: "2026-08-30T00:00:00.000Z",
      })).toThrow(/busy|locked/i);
      first.db.exec("ROLLBACK");
      expect(readLifecycleRun(second.db, "project-1", "run-1")).toBeNull();
    } finally {
      try { first.db.exec("ROLLBACK"); } catch { /* already rolled back */ }
      first.db.close();
      second.db.close();
    }
  });

  test("13: start creates one active lifecycle run and rejects unknown vocabulary", async () => {
    const repoRoot = projectRoot();
    const root = storeRoot();
    const started = await invokeOperation(
      "lifecycle.start",
      {
        repoRoot,
        storeRoot: root,
        runId: "run-start",
        lifecycleStage: "design",
        checkpoint: "authority accepted",
      },
      operationContext(),
    );
    expect(started.value).toMatchObject({
      status: "captured",
      run: {
        projectId: "project-1",
        runId: "run-start",
        runType: "lifecycle",
        lifecycleStage: "design",
        status: "active",
        version: 1,
      },
    });
    await expect(
      invokeOperation(
        "lifecycle.start",
        { repoRoot, storeRoot: root, runId: "bad-stage", lifecycleStage: "shipping" },
        operationContext(),
      ),
    ).rejects.toThrow();
    withStoreDatabase(root, (db) => {
      expect(listLifecycleRuns(db, "project-1")).toHaveLength(1);
    });
  });

  test("14: show and project-scoped list read active, paused, and every terminal status", async () => {
    const repoRoot = projectRoot();
    const root = storeRoot();
    withStoreDatabase(root, (db) => {
      const statuses = ["active", "paused", "completed", "failed", "abandoned"] as const;
      for (const status of statuses) {
        createLifecycleRun(db, {
          projectId: "project-1",
          runId: `run-${status}`,
          lifecycleStage: "work",
          committedAt: "2026-08-30T10:00:00.000Z",
        });
        if (status !== "active") {
          transitionLifecycleRun(db, {
            operation: operationForStatus(status),
            projectId: "project-1",
            runId: `run-${status}`,
            expectedVersion: 1,
            nextStatus: status,
            committedAt: "2026-08-30T10:01:00.000Z",
          });
        }
      }
    });

    for (const status of ["active", "paused", "completed", "failed", "abandoned"] as const) {
      const shown = await invokeOperation(
        "lifecycle.show",
        { repoRoot, storeRoot: root, runId: `run-${status}` },
        createExecutionContext({ surface: "test" }),
      );
      expect(shown.value).toMatchObject({ status: "found", run: { status } });
      expect(shown.value).not.toHaveProperty("receipt");
    }
    const listed = await invokeOperation(
      "lifecycle.list",
      { repoRoot, storeRoot: root },
      createExecutionContext({ surface: "test" }),
    );
    expect((listed.value as { runs: unknown[] }).runs).toHaveLength(5);
    expect(listed.value).not.toHaveProperty("receipt");
  });

  test("15: checkpoints accept active or paused, permit stage revisit, and reject terminal runs", async () => {
    const repoRoot = projectRoot();
    const root = storeRoot();
    const base = { repoRoot, storeRoot: root, runId: "run-checkpoint" };
    await invokeOperation(
      "lifecycle.start",
      { ...base, lifecycleStage: "release" },
      operationContext(),
    );
    const active = await invokeOperation(
      "lifecycle.checkpoint",
      { ...base, expectedVersion: 1, checkpoint: "revisit design", lifecycleStage: "design" },
      operationContext(),
    );
    expect(active.value).toMatchObject({ run: { lifecycleStage: "design", status: "active", version: 2 } });
    await invokeOperation("lifecycle.pause", { ...base, expectedVersion: 2 }, operationContext());
    const paused = await invokeOperation(
      "lifecycle.checkpoint",
      { ...base, expectedVersion: 3, checkpoint: "paused review", lifecycleStage: "prd" },
      operationContext(),
    );
    expect(paused.value).toMatchObject({ run: { lifecycleStage: "prd", status: "paused", version: 4 } });
    await invokeOperation("lifecycle.resume", { ...base, expectedVersion: 4 }, operationContext());
    await invokeOperation("lifecycle.complete", { ...base, expectedVersion: 5 }, operationContext());
    const terminalCheckpointError = await captureError(() =>
      invokeOperation(
        "lifecycle.checkpoint",
        { ...base, expectedVersion: 6, checkpoint: "too late" },
        operationContext(),
      ),
    );
    expect(serializeOperationError(terminalCheckpointError)).toMatchObject({
      code: "invalid-lifecycle-transition",
      operation: "lifecycle.checkpoint",
      runId: "run-checkpoint",
      currentStatus: "completed",
      allowedStatuses: ["active", "paused"],
    });
  });

  test("16: pause and resume enforce their exact source states", async () => {
    const repoRoot = projectRoot();
    const root = storeRoot();
    const base = { repoRoot, storeRoot: root, runId: "run-pause" };
    await invokeOperation("lifecycle.start", { ...base, lifecycleStage: "plan" }, operationContext());
    expect(serializeOperationError(await captureError(() =>
      invokeOperation("lifecycle.resume", { ...base, expectedVersion: 1 }, operationContext()),
    ))).toMatchObject({
      code: "invalid-lifecycle-transition",
      operation: "lifecycle.resume",
      currentStatus: "active",
      allowedStatuses: ["paused"],
    });
    const paused = await invokeOperation(
      "lifecycle.pause",
      { ...base, expectedVersion: 1 },
      operationContext(),
    );
    expect(paused.value).toMatchObject({ run: { status: "paused", version: 2 } });
    expect(serializeOperationError(await captureError(() =>
      invokeOperation("lifecycle.pause", { ...base, expectedVersion: 2 }, operationContext()),
    ))).toMatchObject({
      code: "invalid-lifecycle-transition",
      operation: "lifecycle.pause",
      currentStatus: "paused",
      allowedStatuses: ["active"],
    });
    const resumed = await invokeOperation(
      "lifecycle.resume",
      { ...base, expectedVersion: 2 },
      operationContext(),
    );
    expect(resumed.value).toMatchObject({ run: { status: "active", version: 3 } });
  });

  test("17: complete, fail, and abandon enforce the accepted terminal matrix", async () => {
    const repoRoot = projectRoot();
    const root = storeRoot();
    const start = async (runId: string) => {
      await invokeOperation(
        "lifecycle.start",
        { repoRoot, storeRoot: root, runId, lifecycleStage: "implementation" },
        operationContext(),
      );
    };

    await start("run-complete");
    const completed = await invokeOperation(
      "lifecycle.complete",
      { repoRoot, storeRoot: root, runId: "run-complete", expectedVersion: 1 },
      operationContext(),
    );
    expect(completed.value).toMatchObject({ run: { status: "completed", version: 2 } });
    expect(serializeOperationError(await captureError(() =>
      invokeOperation(
        "lifecycle.fail",
        { repoRoot, storeRoot: root, runId: "run-complete", expectedVersion: 2 },
        operationContext(),
      ),
    ))).toMatchObject({
      code: "invalid-lifecycle-transition",
      operation: "lifecycle.fail",
      currentStatus: "completed",
      allowedStatuses: ["active", "paused"],
    });

    for (const [runId, operation, status] of [
      ["run-fail", "lifecycle.fail", "failed"],
      ["run-abandon", "lifecycle.abandon", "abandoned"],
    ] as const) {
      await start(runId);
      await invokeOperation(
        "lifecycle.pause",
        { repoRoot, storeRoot: root, runId, expectedVersion: 1 },
        operationContext(),
      );
      if (operation === "lifecycle.abandon") {
        expect(serializeOperationError(await captureError(() =>
          invokeOperation(
            "lifecycle.complete",
            { repoRoot, storeRoot: root, runId, expectedVersion: 2 },
            operationContext(),
          ),
        ))).toMatchObject({
          code: "invalid-lifecycle-transition",
          operation: "lifecycle.complete",
          currentStatus: "paused",
          allowedStatuses: ["active"],
        });
      }
      const terminal = await invokeOperation(
        operation,
        { repoRoot, storeRoot: root, runId, expectedVersion: 2 },
        operationContext(),
      );
      expect(terminal.value).toMatchObject({ run: { status, version: 3 } });
    }
  });

  test("18: bounded evidence accepts every status and rejects unsafe fixed-platform references", async () => {
    const repoRoot = projectRoot();
    const root = storeRoot();
    mkdirSync(path.join(repoRoot, "docs", "evidence"), { recursive: true });
    const statuses = ["active", "paused", "completed", "failed", "abandoned"] as const;
    for (const status of statuses) {
      const runId = `evidence-${status}`;
      await invokeOperation(
        "lifecycle.start",
        { repoRoot, storeRoot: root, runId, lifecycleStage: "implementation" },
        operationContext(),
      );
      if (status !== "active") {
        withStoreDatabase(root, (db) => transitionLifecycleRun(db, {
          operation: operationForStatus(status),
          projectId: "project-1",
          runId,
          expectedVersion: 1,
          nextStatus: status,
          committedAt: "2026-08-30T11:00:00.000Z",
        }));
      }
      const expectedVersion = status === "active" ? 1 : 2;
      const attached = await invokeOperation(
        "lifecycle.attach-evidence",
        {
          repoRoot,
          storeRoot: root,
          runId,
          expectedVersion,
          evidenceId: `ref-${status}`,
          evidenceKind: "test-report",
          projectPath: `docs/evidence/${status}.json`,
        },
        operationContext(),
      );
      expect(attached.value).toMatchObject({
        run: { status, version: expectedVersion + 1 },
        evidence: { referenceType: "project-path" },
      });
    }

    const external = await invokeOperation(
      "lifecycle.attach-evidence",
      {
        repoRoot,
        storeRoot: root,
        runId: "evidence-completed",
        expectedVersion: 3,
        evidenceId: "external-ref",
        evidenceKind: "review",
        externalReference: "https://example.test/report?id=secret#fragment",
      },
      operationContext(),
    );
    expect(external.value).toMatchObject({
      run: { status: "completed", version: 4 },
      evidence: { reference: "https://example.test/report", referenceType: "external" },
    });

    const unsafePaths = [
      "/etc/passwd",
      "../outside.txt",
      "C:/Windows/System32/config",
      "C:\\Windows\\System32\\config",
      "//server/share/file",
      "\\\\server\\share\\file",
      "docs\\evidence\\report.json",
      "docs/evidence/\0secret.json",
    ];
    for (const projectPath of unsafePaths) {
      await expect(
        invokeOperation(
          "lifecycle.attach-evidence",
          {
            repoRoot,
            storeRoot: root,
            runId: "evidence-active",
            expectedVersion: 2,
            evidenceId: `unsafe-${unsafePaths.indexOf(projectPath)}`,
            evidenceKind: "review",
            projectPath,
          },
          operationContext(),
        ),
      ).rejects.toThrow(OperationError);
    }
    const outside = createTempDir("make-docs-p6-outside-");
    roots.push(outside);
    symlinkSync(outside, path.join(repoRoot, "docs", "evidence", "linked"), "dir");
    await expect(
      invokeOperation(
        "lifecycle.attach-evidence",
        {
          repoRoot,
          storeRoot: root,
          runId: "evidence-active",
          expectedVersion: 2,
          evidenceId: "symlink-ref",
          evidenceKind: "review",
          projectPath: "docs/evidence/linked/secret.txt",
        },
        operationContext(),
      ),
    ).rejects.toThrow(/symbolic link/);
    await expect(
      invokeOperation(
        "lifecycle.attach-evidence",
        {
          repoRoot,
          storeRoot: root,
          runId: "evidence-active",
          expectedVersion: 2,
          evidenceId: "body-ref",
          evidenceKind: "review",
          projectPath: "docs/evidence/report.json",
          body: "must never enter the Store",
        },
        operationContext(),
      ),
    ).rejects.toThrow();
  });

  test("19: Store failure returns exact run-capture-unavailable without repository write or receipt", async () => {
    const repoRoot = projectRoot();
    const manifestPath = path.join(repoRoot, ".make-docs", "manifest.json");
    const manifestBefore = readFileSync(manifestPath, "utf8");
    const root = storeRoot();
    const opened = openStoreDatabase(root);
    opened.db.exec("PRAGMA user_version = 99");
    opened.db.close();

    const result = await invokeOperation(
      "lifecycle.start",
      { repoRoot, storeRoot: root, runId: "unavailable", lifecycleStage: "design" },
      operationContext(),
    );
    expect(result.value).toEqual({
      status: "run-capture-unavailable",
      operation: "lifecycle.start",
      projectId: "project-1",
      runId: "unavailable",
      repositoryMutation: false,
      automaticRetry: false,
      blocking: false,
      message: expect.stringContaining("supports up to version"),
    });
    expect(result.value).not.toHaveProperty("receipt");
    expect(readFileSync(manifestPath, "utf8")).toBe(manifestBefore);
  });

  test("20: CLI and MCP keep exact IDs, canonical results, and one-winner concurrency", async () => {
    const repoRoot = projectRoot();
    const root = storeRoot();
    const lifecycleIds = listOperations()
      .filter((operation) => operation.id.startsWith("lifecycle."))
      .map((operation) => operation.id);
    expect(lifecycleIds).toEqual([
      "lifecycle.start",
      "lifecycle.show",
      "lifecycle.list",
      "lifecycle.checkpoint",
      "lifecycle.pause",
      "lifecycle.resume",
      "lifecycle.attach-evidence",
      "lifecycle.complete",
      "lifecycle.fail",
      "lifecycle.abandon",
    ]);
    expect(listOperations().filter((operation) => lifecycleIds.includes(operation.id)))
      .toEqual(expect.arrayContaining(lifecycleIds.map((id) => expect.objectContaining({ id, status: "active" }))));
    expect(lifecycleIds.map(deriveMcpToolName)).toEqual([
      "make_docs_lifecycle_start",
      "make_docs_lifecycle_show",
      "make_docs_lifecycle_list",
      "make_docs_lifecycle_checkpoint",
      "make_docs_lifecycle_pause",
      "make_docs_lifecycle_resume",
      "make_docs_lifecycle_attach_evidence",
      "make_docs_lifecycle_complete",
      "make_docs_lifecycle_fail",
      "make_docs_lifecycle_abandon",
    ]);
    expect(listRunCliAdapters()).toEqual(expect.arrayContaining(lifecycleIds));

    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await runRunCommand([
      "lifecycle", "start",
      "--repo-root", repoRoot,
      "--store-root", root,
      "--run-id", "surface-run",
      "--stage", "design",
    ]);
    const cliStart = JSON.parse(String(stdout.mock.calls[0]![0])) as Record<string, unknown>;
    const mcpShow = await callMakeDocsMcpTool("make_docs_lifecycle_show", {
      repoRoot,
      storeRoot: root,
      runId: "surface-run",
    });
    expect(mcpShow.result).toMatchObject({ status: "found", run: cliStart.run });

    const contenders = await Promise.allSettled([
      runRunCommand([
        "lifecycle", "pause",
        "--repo-root", repoRoot,
        "--store-root", root,
        "--run-id", "surface-run",
        "--expected-version", "1",
      ]),
      callMakeDocsMcpTool("make_docs_lifecycle_fail", {
        repoRoot,
        storeRoot: root,
        runId: "surface-run",
        expectedVersion: 1,
        allowWrite: true,
      }),
    ]);
    expect(contenders.filter((entry) => entry.status === "fulfilled")).toHaveLength(1);
    expect(contenders.filter((entry) => entry.status === "rejected")).toHaveLength(1);
    withStoreDatabase(root, (db) => {
      expect(readLifecycleRun(db, "project-1", "surface-run")).toMatchObject({ version: 2 });
    });

    await invokeOperation(
      "lifecycle.start",
      { repoRoot, storeRoot: root, runId: "parity-run", lifecycleStage: "release" },
      operationContext(),
    );
    await invokeOperation(
      "lifecycle.complete",
      { repoRoot, storeRoot: root, runId: "parity-run", expectedVersion: 1 },
      operationContext(),
    );
    const cliError = serializeOperationError(await captureError(() => runRunCommand([
      "lifecycle", "pause",
      "--repo-root", repoRoot,
      "--store-root", root,
      "--run-id", "parity-run",
      "--expected-version", "2",
    ])));
    const mcpError = serializeOperationError(await captureError(() =>
      callMakeDocsMcpTool("make_docs_lifecycle_pause", {
        repoRoot,
        storeRoot: root,
        runId: "parity-run",
        expectedVersion: 2,
        allowWrite: true,
      }),
    ));
    expect(cliError).toEqual(mcpError);
    expect(cliError).toMatchObject({
      code: "invalid-lifecycle-transition",
      operation: "lifecycle.pause",
      runId: "parity-run",
      currentStatus: "completed",
      allowedStatuses: ["active"],
    });
  });
});
