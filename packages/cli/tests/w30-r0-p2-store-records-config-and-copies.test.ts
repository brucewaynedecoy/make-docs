import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, utimesSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadMakeDocsConfig } from "../src/config";
import {
  FactoryConfigBlockSchema,
  factoryConfigStateFieldProblems,
  factoryRoleNeedsContextMessage,
  parseFactoryConfigBlock,
  type FactoryWorkflowDefinition,
} from "../src/operations/factory/config-block";
import {
  FACTORY_BACKUP_README,
  FACTORY_BACKUP_RELATIVE_PATH,
  backupFactoryFileBeforeChange,
  cleanupFactoryBackups,
  isInsideGitWorkTree,
} from "../src/operations/factory/backups";
import { FACTORY_COPIES_RELATIVE_PATH, FACTORY_COPY_NOTE, factoryWorkflowCopyName, writeFactoryCopies } from "../src/operations/factory/copies";
import {
  FACTORY_PLAN_KEEP_NEWEST,
  factoryCanonicalDigest,
  factoryCanonicalJson,
  factoryDigest,
  factoryPlanRevisionsToKeep,
  resolveFactoryPlan,
  type FactoryPlanInput,
} from "../src/operations/factory/plan";
import {
  FACTORY_ASSIGNMENT_STATUSES,
  FACTORY_STATUS_HISTORY_MAX,
  FACTORY_STATUS_MOVES,
  factoryFreeTextProblem,
  factoryStatusMoveRefusal,
  nextFactoryRoundCount,
  type FactoryAssignmentStatus,
} from "../src/operations/factory/records";
import { isProtectedContentPath } from "../src/path-hygiene";
import { platform } from "../src/platform";
import {
  CURRENT_STORE_SCHEMA_VERSION,
  STORE_MIGRATIONS,
  STORE_WRITE_GUARD_EVENTS,
  StoreSchemaNewerError,
  applyStoreMigrations,
  classifyStoreCheckpoint9State,
  inspectStoreWriteGuard,
  isVerifiedStoreBackupFile,
  openStoreDatabase,
  openStoreSqliteConnection,
  readStoreSchemaJournal,
  storeWriteGuardTriggerName,
  withStoreDatabase,
} from "../src/store/database";
import { previewStoreCompatibilityBridge } from "../src/store/compatibility-bridge";
import { getInstallationCheckoutId, previewInstallationCheckoutMove } from "../src/store/installation-state";
import {
  FactoryStoreRefusalError,
  listFactoryAssignments,
  listFactoryBackups,
  listFactoryGrants,
  listFactoryPlanRevisions,
  markFactoryReadyRevision,
  readFactoryAssignment,
  revokeFactoryGrant,
  readFactoryMachineTool,
  readFactoryPlanRevision,
  readFactoryWorkflowBinding,
  saveFactoryGrant,
  saveFactoryMachineTool,
  saveFactoryPlanRevision,
  saveFactoryProofResult,
  saveFactoryWorkflowBinding,
  startFactoryAssignment,
  updateFactoryAssignment,
  useFactoryGrant,
  type FactoryAssignmentRecord,
} from "../src/store/factory-store";
import {
  FACTORY_STORE_COLUMN_REGISTER,
  FACTORY_STORE_RMIN_ROWS,
  FACTORY_STORE_TABLE_NAMES,
  factoryRMinRowFieldPhrases,
  factoryStoreSchemaDrift,
} from "../src/store/factory-store-schema";
import { STORE_TABLE_CATALOG, parseStoreRMinRows, readPhysicalStoreSchema } from "../src/store/table-catalog";
import { claimWorkUnit, createQuickItem, deletePrunedProjectWorkRows, deleteWorkUnit, listWorkUnits, putWorkUnit, readWorkUnit, releaseWorkClaim, workProjectDigest, writeWorkStore } from "../src/store/work-store";
import { WorkSettleRefusalError, syncWorkFiles } from "../src/operations/work/work-store/sync";
import { workClose } from "../src/operations/work/work-queue/queue";
import type { StoreDatabase } from "../src/store/database";
import { cleanupTempDir, createTempDir } from "./helpers";

/**
 * W30 R0 P2: the schema v9 factory tables (A9, A10, A11, A51 to A53), the
 * Store service rules, the resolved plan digest and keep rule, the `factory`
 * config block (A12, A54), the local copies (A13 to A15, A55), and the
 * backups outside git (A16 to A18). Tool names are generic, such as `tool-a`.
 */

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const PRD_38 = readFileSync(path.join(REPO_ROOT, "docs/prd/38-global-store-and-project-state.md"), "utf8");
const R_MIN_ROWS = parseStoreRMinRows(PRD_38);
const POSIX = process.platform !== "win32";
const T0 = new Date("2042-06-15T12:00:00.000Z");
const at = (minutes: number) => new Date(T0.getTime() + minutes * 60_000);
const PROJECT_ID = "factory-test-project";

const roots: string[] = [];
let temp: string;
let store: string;

beforeEach(() => {
  temp = platform.describePath(createTempDir("make-docs-w30-p2-")).canonicalPath;
  roots.push(temp);
  store = path.join(temp, "store");
  // No test may reach the real Store.
  vi.stubEnv("MAKE_DOCS_HOME", store);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  while (roots.length) {
    const root = roots.pop()!;
    // Copies are read-only; make them writable so the temp folder can go.
    const unlock = (folder: string) => {
      if (!existsSync(folder)) return;
      for (const name of readdirSync(folder)) {
        const entry = path.join(folder, name);
        try {
          chmodSync(entry, 0o755);
        } catch {
          // Best effort.
        }
        if (statSync(entry).isDirectory()) unlock(entry);
      }
    };
    unlock(root);
    cleanupTempDir(root);
  }
});

function project(name: string, extraConfig = ""): string {
  const root = path.join(temp, name);
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\n${extraConfig}`);
  const canonical = platform.describePath(root).canonicalPath;
  // Bind the checkout, which creates the Store at the current schema.
  if (!extraConfig) getInstallationCheckoutId(canonical, store);
  return canonical;
}

function columns(db: { prepare(sql: string): { all(...args: unknown[]): unknown[] } }, table: string): string[] {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>).map((row) => row.name);
}

function physical(): Record<string, string[]> {
  return withStoreDatabase(store, (db) => readPhysicalStoreSchema(db).tables as Record<string, string[]>);
}

function refusal(fn: () => unknown): FactoryStoreRefusalError {
  try {
    fn();
  } catch (error) {
    if (error instanceof FactoryStoreRefusalError) return error;
    throw error;
  }
  throw new Error("expected a factory refusal");
}

/** A Store at schema 8, made by the real migration code from a fresh Store. */
function seedV8(): void {
  mkdirSync(store, { recursive: true });
  const db = new DatabaseSync(path.join(store, "store.db"));
  db.exec("PRAGMA foreign_keys=ON");
  db.function("make_docs_write_guard", () => null);
  for (const migration of STORE_MIGRATIONS.filter((candidate) => candidate.version <= 6)) {
    for (const statement of migration.statements) db.exec(statement);
    db.exec(`PRAGMA user_version=${migration.version}`);
  }
  db.prepare("INSERT INTO installation_checkouts (checkout_id,project_id,root_path,created_at,root_path_key,verified_at,verification_json) VALUES (?,?,?,?,?,?,?)")
    .run("checkout-old", "project-old", "/old/project", "2026-01-01T00:00:00.000Z", "/old/project", null, null);
  db.close();
  const migrating = openStoreSqliteConnection(path.join(store, "store.db"), {}, "seed");
  try {
    const kept = STORE_MIGRATIONS.filter((migration) => migration.version <= 8).length;
    const saved = STORE_MIGRATIONS.splice(kept);
    try {
      expect(applyStoreMigrations(migrating, 6)).toBe(8);
    } finally {
      STORE_MIGRATIONS.push(...saved);
    }
  } finally {
    migrating.close();
  }
  for (const file of readdirSync(store)) {
    if (file.endsWith(".backup")) rmSync(path.join(store, file), { force: true });
  }
}

/* ------------------------------------------------------------------------ */
/* Fixtures: a ready workflow with a claimed unit                           */
/* ------------------------------------------------------------------------ */

const DEFINITION: FactoryWorkflowDefinition = parseFactoryConfigBlock({
  workflows: {
    ship: {
      type: "build-then-review",
      typeVersion: 1,
      roles: {
        builder: { job: "Does the job in the brief.", capabilities: ["read-write-files", "run-commands"], returns: "The result and its evidence." },
        reviewer: { job: "Checks the result against the requirements.", capabilities: ["read-write-files"], returns: "A pass or a defect list." },
      },
      roundLimit: 2,
      humanChannel: "wait-in-session",
    },
  },
}).workflows.ship!;

function planInput(overrides: Partial<FactoryPlanInput> = {}): FactoryPlanInput {
  return {
    workflowName: "ship",
    definition: DEFINITION,
    type: { name: "build-then-review", version: 1, fileDigest: "a".repeat(64) },
    binding: { roles: { builder: "tool-a", reviewer: "tool-b" }, wakeMethod: "person", channelRef: null, worktreeMethod: "none", knownLosses: [] },
    tools: {
      "tool-a": { toolId: "tool-a", state: "available", reportedVersion: "1.0", proofs: { "read-write-files": { result: "proved", toolVersion: "1.0", notCovered: [] }, "run-commands": { result: "proved", toolVersion: "1.0", notCovered: ["long output"] } } },
      "tool-b": { toolId: "tool-b", state: "available", reportedVersion: "2.0", proofs: { "read-write-files": { result: "proved", toolVersion: "2.0", notCovered: [] } } },
    },
    ...overrides,
  };
}

interface Ready {
  root: string;
  checkoutId: string;
  unitStoreId: string;
  claimId: string;
  planDigest: string;
}

function saveBinding(db: StoreDatabase, expectedVersion: number | null = null) {
  return saveFactoryWorkflowBinding(db, {
    projectId: PROJECT_ID,
    workflowName: "ship",
    roles: { builder: "tool-a", reviewer: "tool-b" },
    worktreeMethod: "none",
    channelRef: null,
    wakeMethod: "person",
    wakeRef: null,
    knownLosses: ["No tool can wake on its own."],
    readiness: "wired",
    currentPlanDigest: null,
  }, { expectedVersion });
}

/** A project with a ready `ship` workflow and one claimed quick item. */
function readyWorkflow(name = "ready"): Ready {
  const root = project(name);
  const checkoutId = getInstallationCheckoutId(root, store);
  return writeWorkStore(root, (db, workProject) => {
    const unit = createQuickItem(db, workProject.projectId, { title: "Write the notes", body: null, links: [] });
    const claimed = claimWorkUnit(db, { unitStoreId: unit.storeId, claimant: "foreman", taskHandle: "run-1", ttlSeconds: null, expectedVersion: unit.revision, takeover: null }, { now: T0 });
    if (claimed.result !== "claimed") throw new Error(`claim refused: ${claimed.refusal}`);
    saveBinding(db);
    const resolved = resolveFactoryPlan(planInput());
    const saved = saveFactoryPlanRevision(db, { projectId: PROJECT_ID, workflowName: "ship", plan: resolved.plan }, { now: T0 });
    saveFactoryProofResult(db, { projectId: PROJECT_ID, workflowName: "ship", outcome: "passed", testTask: "Write one line and review it.", planDigest: saved.revision.planDigest, path: ["builder: tool-a", "reviewer: tool-b"], manualSteps: [] }, { expectedVersion: null, now: T0 });
    markFactoryReadyRevision(db, PROJECT_ID, "ship", saved.revision.planDigest, { expectedVersion: 1 });
    return { root, checkoutId, unitStoreId: unit.storeId, claimId: claimed.claim.claimId, planDigest: saved.revision.planDigest };
  }, { storeRoot: store, now: T0 });
}

function start(ready: Ready, db: StoreDatabase, overrides: Partial<Parameters<typeof startFactoryAssignment>[1]> = {}, now = T0): FactoryAssignmentRecord {
  return startFactoryAssignment(db, {
    projectId: PROJECT_ID,
    workflowName: "ship",
    checkoutId: ready.checkoutId,
    unitStoreId: ready.unitStoreId,
    role: "builder",
    toolId: "tool-a",
    taskHandle: "thread-1",
    runId: "run-1",
    currentPlanDigest: ready.planDigest,
    ...overrides,
  }, { claimId: ready.claimId, now });
}

function move(ready: Ready, db: StoreDatabase, assignment: FactoryAssignmentRecord, status: FactoryAssignmentStatus, reason: Parameters<typeof updateFactoryAssignment>[3]["reason"], now = T0): FactoryAssignmentRecord {
  return updateFactoryAssignment(db, PROJECT_ID, assignment.assignmentId, { status, reason }, { claimId: ready.claimId, expectedVersion: assignment.version, now });
}

function write<T>(ready: Ready, fn: (db: StoreDatabase) => T): T {
  return writeWorkStore(ready.root, (db) => fn(db), { storeRoot: store, now: T0 });
}

/* ------------------------------------------------------------------------ */
/* Stage 1: Store tables                                                    */
/* ------------------------------------------------------------------------ */

describe("W30 R0 P2 schema v9 migration (T2, T5, A9)", () => {
  it("creates a fresh Store at schema v9 with every factory table, its guard triggers, its journal row, and its catalog entry", () => {
    expect(CURRENT_STORE_SCHEMA_VERSION).toBe(9);
    withStoreDatabase(store, (db) => {
      expect(readStoreSchemaJournal(db).journal.map((row) => row.version)).toEqual([3, 4, 5, 6, 7, 8, 9]);
      expect(inspectStoreWriteGuard(db)).toEqual([]);
      const triggers = new Set((db.prepare("SELECT name FROM sqlite_schema WHERE type = 'trigger'").all() as Array<{ name: string }>).map((row) => row.name));
      for (const table of FACTORY_STORE_TABLE_NAMES) {
        expect(columns(db, table), table).toEqual(STORE_TABLE_CATALOG.find((entry) => entry.table === table)!.columns);
        for (const event of STORE_WRITE_GUARD_EVENTS) expect(triggers.has(storeWriteGuardTriggerName(table, event)), `${table} ${event}`).toBe(true);
      }
    });
    const catalog = Object.fromEntries(STORE_TABLE_CATALOG.filter((entry) => entry.sinceSchema === 9).map((entry) => [entry.table, entry.rowClasses.map((rowClass) => rowClass.maintenanceClass)]));
    expect(catalog).toEqual({
      factory_machine_tools: ["bounded"],
      factory_capability_proofs: ["bounded"],
      factory_workflow_plans: ["bounded"],
      factory_workflow_bindings: ["keep"],
      factory_grants: ["keep"],
      factory_grant_uses: ["keep"],
      factory_assignments: ["keep"],
      factory_proof_results: ["bounded"],
      factory_backups: ["bounded"],
    });
    expect(STORE_TABLE_CATALOG.find((entry) => entry.table === "factory_workflow_plans")!.rowClasses[0]!.limit).toContain("10 newest other revisions");
  });

  it("moves v8 to v9 after one verified backup, keeps every row, and leaves the v8 Store readable until then", () => {
    seedV8();
    expect(classifyStoreCheckpoint9State(store)).toMatchObject({ state: "supported-legacy", schemaVersion: 8 });
    expect(previewStoreCompatibilityBridge(store).records).toEqual(expect.arrayContaining([
      expect.objectContaining({ bridgeId: "w30-r0-p2-store-schema-v9", disposition: "convert" }),
    ]));
    // A v8 Store stays readable where a v6 or v7 Store is: checkout move review reads it as it is.
    const reader = path.join(temp, "reader");
    mkdirSync(path.join(reader, ".make-docs"), { recursive: true });
    writeFileSync(path.join(reader, ".make-docs/config.yaml"), "projectId: project-old\n");
    const preview = previewInstallationCheckoutMove(platform.describePath(reader).canonicalPath, undefined, store);
    expect(preview.candidates.map((candidate) => candidate.checkoutId)).toEqual(["checkout-old"]);
    expect(preview.nextAction).not.toMatch(/schema|Store conversion/);
    expect(classifyStoreCheckpoint9State(store)).toMatchObject({ state: "supported-legacy", schemaVersion: 8 });
    const db = openStoreSqliteConnection(path.join(store, "store.db"), {}, "migrate");
    try {
      expect(applyStoreMigrations(db, 8)).toBe(9);
      expect(db.prepare("PRAGMA user_version").get()).toEqual({ user_version: 9 });
      expect(db.prepare("SELECT checkout_id FROM installation_checkouts").all()).toEqual([{ checkout_id: "checkout-old" }]);
      expect(readStoreSchemaJournal(db).journal.map((row) => row.version)).toEqual([3, 4, 5, 6, 7, 8, 9]);
      expect(inspectStoreWriteGuard(db)).toEqual([]);
    } finally {
      db.close();
    }
    const backups = readdirSync(store).filter((file) => /^store\.db\.bridge-v8-to-v9-.*\.backup$/.test(file));
    expect(backups).toHaveLength(1);
    expect(isVerifiedStoreBackupFile(path.join(store, backups[0]!))).toBe(true);
    expect(classifyStoreCheckpoint9State(store)).toMatchObject({ state: "supported-current", schemaVersion: 9 });
  });

  it("rolls the whole v9 migration back when one statement fails, and the v8 Store stays usable", () => {
    seedV8();
    const raw = openStoreSqliteConnection(path.join(store, "store.db"), {}, "seed");
    // An index with the name of a v9 index makes the migration fail after its first tables.
    raw.exec("CREATE INDEX idx_factory_backups_time ON project_register (project_id)");
    raw.close();
    const db = openStoreSqliteConnection(path.join(store, "store.db"), {}, "migrate");
    try {
      expect(() => applyStoreMigrations(db, 8)).toThrow(/already exists/);
      expect(db.prepare("PRAGMA user_version").get()).toEqual({ user_version: 8 });
      expect(db.prepare(`SELECT name FROM sqlite_schema WHERE name LIKE 'factory_%'`).all()).toEqual([]);
      expect(readStoreSchemaJournal(db).journal.map((row) => row.version)).toEqual([3, 4, 5, 6, 7, 8]);
    } finally {
      db.close();
    }
    expect(classifyStoreCheckpoint9State(store)).toMatchObject({ state: "supported-legacy", schemaVersion: 8 });
  });

  it("refuses a newer schema with the existing typed error and changes no byte", () => {
    withStoreDatabase(store, () => undefined);
    const raw = new DatabaseSync(path.join(store, "store.db"));
    raw.exec("PRAGMA user_version=10");
    raw.close();
    const bytes = readFileSync(path.join(store, "store.db"));
    expect(classifyStoreCheckpoint9State(store)).toMatchObject({ state: "newer-unknown", schemaVersion: 10 });
    expect(() => openStoreDatabase(store)).toThrow(StoreSchemaNewerError);
    expect(() => openStoreDatabase(store)).toThrow(/schema version 10, but this CLI supports up to version 9/);
    expect(readFileSync(path.join(store, "store.db")).equals(bytes)).toBe(true);
  });

  it("reports a v9 Store set back to schema 8 as changed outside Make Docs", () => {
    withStoreDatabase(store, () => undefined);
    const raw = new DatabaseSync(path.join(store, "store.db"));
    raw.exec("PRAGMA user_version=8");
    raw.close();
    const state = classifyStoreCheckpoint9State(store);
    expect(state).toMatchObject({ state: "unknown", schemaVersion: 8, issue: { code: "changed-outside" } });
    expect("reason" in state && state.reason).toContain("The Store reports schema 8 but has the factory_machine_tools table from schema 9.");
  });

  it("guards every factory table: a connection that Make Docs did not open cannot write", () => {
    withStoreDatabase(store, () => undefined);
    const raw = new DatabaseSync(path.join(store, "store.db"));
    try {
      expect(() => raw.prepare("INSERT INTO factory_machine_tools VALUES ('tool-a','agent-harness','Tool A','available',NULL,'[]','2042-06-15T12:00:00.000Z',1)").run()).toThrow(/no such function/);
      raw.exec(`DROP TRIGGER ${storeWriteGuardTriggerName("factory_grants", "update")}`);
    } finally {
      raw.close();
    }
    expect(classifyStoreCheckpoint9State(store)).toMatchObject({ state: "unknown", issue: { code: "changed-outside" } });
  });
});

describe("W30 R0 P2 R-MIN parity (T1, T6, A10)", () => {
  it("has a PRD 38 R-MIN row for every factory column, and the register matches the physical schema", () => {
    expect(factoryStoreSchemaDrift(physical(), R_MIN_ROWS)).toEqual([]);
    for (const labelStart of Object.values(FACTORY_STORE_RMIN_ROWS)) expect(R_MIN_ROWS.filter((row) => row.label.startsWith(labelStart)), labelStart).toHaveLength(1);
    const grants = R_MIN_ROWS.find((row) => row.label.startsWith("Factory grants"))!.label;
    expect(factoryRMinRowFieldPhrases(grants)).toEqual([
      "grant ID", "project ID", "workflow name", "action", "scope", "the lifecycle run for a `run` grant", "optional expiry time",
      "the time a `once` grant was spent", "granting person", "grant time", "record version",
    ]);
  });

  it("fails when an R-MIN field is removed", () => {
    const removed = R_MIN_ROWS.map((row) => (row.label.startsWith("Factory assignments") ? { ...row, label: row.label.replace(", part label", "") } : row));
    expect(factoryStoreSchemaDrift(physical(), removed).join("\n")).toContain('Physical columns hold "part label", but the R-MIN row "Factory assignments" does not name it.');
    const noRow = R_MIN_ROWS.filter((row) => !row.label.startsWith("Factory workflow plans"));
    expect(factoryStoreSchemaDrift(physical(), noRow).join("\n")).toContain('R-MIN row "Factory workflow plans" matches 0 PRD 38 rows.');
  });

  it("fails when a column is removed or added, or the register loses one", () => {
    const tables = physical();
    expect(factoryStoreSchemaDrift({ ...tables, factory_grants: tables.factory_grants!.filter((column) => column !== "spent_at") }, R_MIN_ROWS).join("\n"))
      .toContain('R-MIN field "the time a `once` grant was spent" of "Factory grants" has no physical column.');
    expect(factoryStoreSchemaDrift({ ...tables, factory_assignments: [...tables.factory_assignments!, "prompt"] }, R_MIN_ROWS).join("\n"))
      .toContain("Column factory_assignments.prompt has no R-MIN field");
    const { round_count: _dropped, ...assignments } = FACTORY_STORE_COLUMN_REGISTER.factory_assignments;
    expect(factoryStoreSchemaDrift(tables, R_MIN_ROWS, { ...FACTORY_STORE_COLUMN_REGISTER, factory_assignments: assignments }).join("\n"))
      .toContain("Column factory_assignments.round_count has no R-MIN field");
  });
});

describe("W30 R0 P2 machine tools, bindings, and grants (T4, T18, T19, A53)", () => {
  it("saves one tool list per machine with tool state, proof version, time, result, and a does-not-cover list", () => {
    const root = project("tools");
    writeWorkStore(root, (db) => {
      const tool = saveFactoryMachineTool(db, {
        toolId: "tool-a",
        kind: "agent-harness",
        label: "Tool A",
        state: "available",
        reportedVersion: "1.4.2",
        capabilities: ["read-write-files", "launch-agent"],
        proofs: [
          { capabilityId: "read-write-files", method: "Wrote and read back a test file.", toolVersion: "1.4.2", provedAt: T0, result: "proved", notCovered: ["binary files"] },
          { capabilityId: "launch-agent", method: "Docs claim it; the proof could not run.", toolVersion: "1.4.2", provedAt: T0, result: "unproved", notCovered: [] },
        ],
      }, { expectedVersion: null, now: T0 });
      expect(tool).toMatchObject({ state: "available", version: 1, proofs: [{ capabilityId: "launch-agent", result: "unproved" }, { capabilityId: "read-write-files", result: "proved", toolVersion: "1.4.2", provedAt: T0.toISOString(), notCovered: ["binary files"] }] });
      const missing = saveFactoryMachineTool(db, { ...tool, state: "missing", proofs: [] }, { expectedVersion: 1, now: T0 });
      expect(missing).toMatchObject({ state: "missing", version: 2, proofs: [] });
      expect(refusal(() => saveFactoryMachineTool(db, { ...tool, proofs: [] }, { expectedVersion: 1 })).refusal).toBe("version-conflict");
      expect(refusal(() => saveFactoryMachineTool(db, { ...tool, toolId: "tool-b", capabilities: ["fly-a-plane"], proofs: [] }, { expectedVersion: null })).refusal).toBe("unknown-capability");
      expect(refusal(() => saveFactoryMachineTool(db, { ...tool, toolId: "tool-b", state: "lost" as never, proofs: [] }, { expectedVersion: null })).refusal).toBe("invalid-record");
    }, { storeRoot: store });
    // A second project on the same machine reads the same tool list (R-FACTORY-15).
    const other = path.join(temp, "other");
    mkdirSync(path.join(other, ".make-docs"), { recursive: true });
    writeFileSync(path.join(other, ".make-docs/config.yaml"), "projectId: another-project\n");
    getInstallationCheckoutId(other, store);
    writeWorkStore(other, (db) => expect(readFactoryMachineTool(db, "tool-a")).toMatchObject({ state: "missing" }), { storeRoot: store });
  });

  it("saves a binding with known losses and never sets the ready revision; only a passed test task does", () => {
    const root = project("binding");
    writeWorkStore(root, (db) => {
      const binding = saveBinding(db);
      expect(binding).toMatchObject({ knownLosses: ["No tool can wake on its own."], readyRevision: null, readiness: "wired", version: 1 });
      expect(refusal(() => saveFactoryWorkflowBinding(db, { ...binding, readiness: "ready" as never, currentPlanDigest: null }, { expectedVersion: 1 })).refusal).toBe("proof-missing");
      const resolved = resolveFactoryPlan(planInput());
      const saved = saveFactoryPlanRevision(db, { projectId: PROJECT_ID, workflowName: "ship", plan: resolved.plan }, { now: T0 });
      expect(refusal(() => markFactoryReadyRevision(db, PROJECT_ID, "ship", saved.revision.planDigest, { expectedVersion: 1 })).refusal).toBe("proof-missing");
      expect(refusal(() => markFactoryReadyRevision(db, PROJECT_ID, "ship", "b".repeat(64), { expectedVersion: 1 })).refusal).toBe("plan-digest-mismatch");
      expect(refusal(() => saveFactoryProofResult(db, { projectId: PROJECT_ID, workflowName: "ship", outcome: "passed", testTask: "Test", planDigest: "b".repeat(64), path: ["builder"], manualSteps: [] }, { expectedVersion: null })).refusal).toBe("plan-digest-mismatch");
      saveFactoryProofResult(db, { projectId: PROJECT_ID, workflowName: "ship", outcome: "passed", testTask: "Test", planDigest: saved.revision.planDigest, path: ["builder"], manualSteps: ["Approve the app permission."] }, { expectedVersion: null });
      expect(markFactoryReadyRevision(db, PROJECT_ID, "ship", saved.revision.planDigest, { expectedVersion: 1 })).toMatchObject({ readyRevision: 1, readiness: "ready", version: 2 });
    }, { storeRoot: store });
  });

  it("records each grant's action, scope, run, optional expiry, and spent time, and checks each use", () => {
    const ready = readyWorkflow("grants");
    write(ready, (db) => {
      expect(refusal(() => useFactoryGrant(db, { projectId: PROJECT_ID, workflowName: "ship", action: "merge", runId: "run-1", unitStoreId: "unit-1" }, { now: T0 })).refusal).toBe("grant-missing");
      const once = saveFactoryGrant(db, { projectId: PROJECT_ID, workflowName: "ship", action: "merge", scope: "once", runId: null, expiresAt: at(60), grantedBy: "the owner" }, { now: T0 });
      expect(once).toMatchObject({ scope: "once", runId: null, expiresAt: at(60).toISOString(), spentAt: null, grantedBy: "the owner" });
      expect(useFactoryGrant(db, { projectId: PROJECT_ID, workflowName: "ship", action: "merge", runId: "run-1", unitStoreId: "unit-1" }, { now: at(1) })).toMatchObject({ grantId: once.grantId, spentAt: at(1).toISOString() });
      expect(refusal(() => useFactoryGrant(db, { projectId: PROJECT_ID, workflowName: "ship", action: "merge", runId: "run-1", unitStoreId: "unit-1" }, { now: at(2) })).refusal).toBe("grant-spent");

      saveFactoryGrant(db, { projectId: PROJECT_ID, workflowName: "ship", action: "deploy", scope: "run", runId: "run-1", expiresAt: null, grantedBy: "the owner" }, { now: T0 });
      expect(refusal(() => useFactoryGrant(db, { projectId: PROJECT_ID, workflowName: "ship", action: "deploy", runId: "run-2", unitStoreId: "unit-1" }, { now: at(1) })).refusal).toBe("grant-out-of-scope");
      expect(useFactoryGrant(db, { projectId: PROJECT_ID, workflowName: "ship", action: "deploy", runId: "run-1", unitStoreId: "unit-1" }, { now: at(1) }).spentAt).toBeNull();

      saveFactoryGrant(db, { projectId: PROJECT_ID, workflowName: "ship", action: "publish", scope: "standing", runId: null, expiresAt: at(5), grantedBy: "the owner" }, { now: T0 });
      expect(useFactoryGrant(db, { projectId: PROJECT_ID, workflowName: "ship", action: "publish", runId: "run-1", unitStoreId: "unit-1" }, { now: at(4) }).scope).toBe("standing");
      expect(refusal(() => useFactoryGrant(db, { projectId: PROJECT_ID, workflowName: "ship", action: "publish", runId: "run-1", unitStoreId: "unit-1" }, { now: at(6) })).refusal).toBe("grant-expired");

      expect(refusal(() => saveFactoryGrant(db, { projectId: PROJECT_ID, workflowName: "ship", action: "spend", scope: "run", runId: null, expiresAt: null, grantedBy: "the owner" })).refusal).toBe("invalid-record");
      expect(refusal(() => saveFactoryGrant(db, { projectId: PROJECT_ID, workflowName: "ship", action: "spend", scope: "once", runId: null, expiresAt: null, grantedBy: "token=abcdef123" })).refusal).toBe("never-log-field");
      // A grant-only save resolves no plan and does not change readiness.
      expect(listFactoryPlanRevisions(db, PROJECT_ID, "ship")).toHaveLength(1);
      expect(readFactoryWorkflowBinding(db, PROJECT_ID, "ship")).toMatchObject({ readiness: "ready", readyRevision: 1 });
      expect(listFactoryGrants(db, PROJECT_ID, "ship")).toHaveLength(3);
    });
  });

  it("ends a run grant when its lifecycle run ends", () => {
    const ready = readyWorkflow("run-grant");
    write(ready, (db) => {
      saveFactoryGrant(db, { projectId: PROJECT_ID, workflowName: "ship", action: "merge", scope: "run", runId: "run-9", expiresAt: null, grantedBy: "the owner" }, { now: T0 });
      db.prepare("INSERT INTO runs (project_id, run_id, run_type, lifecycle_stage, status, checkpoint, version, metadata, started_at, updated_at) VALUES (?, 'run-9', 'lifecycle', 'implementation', 'completed', NULL, 1, '{}', ?, ?)")
        .run(PROJECT_ID, T0.toISOString(), T0.toISOString());
      expect(refusal(() => useFactoryGrant(db, { projectId: PROJECT_ID, workflowName: "ship", action: "merge", runId: "run-9", unitStoreId: "unit-1" }, { now: at(1) })).refusal).toBe("grant-out-of-scope");
    });
  });
});

describe("W30 R0 P2 assignments (T3, T17, A11, A52)", () => {
  it("holds only the assignment fields, never a claim ID, and starts under the ready revision", () => {
    const ready = readyWorkflow("fields");
    write(ready, (db) => {
      const assignment = start(ready, db);
      expect(Object.keys(assignment).sort()).toEqual([
        "assignmentId", "checkedAt", "checkoutId", "history", "partLabel", "planDigest", "planRevision", "projectId", "role", "roundCount", "runId", "status", "taskHandle", "toolId", "unitStoreId", "version", "workflowName",
      ]);
      expect(assignment).toMatchObject({ partLabel: "main", roundCount: 0, planRevision: 1, planDigest: ready.planDigest, status: "offered", history: [{ status: "offered", at: T0.toISOString(), reason: "assigned" }] });
      expect(FACTORY_ASSIGNMENT_STATUSES).toContain(assignment.status);
      const row = JSON.stringify(db.prepare("SELECT * FROM factory_assignments").all());
      expect(row).not.toContain(ready.claimId);
      expect(columns(db, "factory_assignments").some((column) => column.includes("claim"))).toBe(false);
    });
  });

  it("refuses a caller without the live claim, and the refusal never repeats a claim ID", () => {
    const ready = readyWorkflow("claim");
    write(ready, (db) => {
      const wrong = refusal(() => startFactoryAssignment(db, { projectId: PROJECT_ID, workflowName: "ship", checkoutId: ready.checkoutId, unitStoreId: ready.unitStoreId, role: "builder", toolId: "tool-a", taskHandle: null, runId: "run-1", currentPlanDigest: ready.planDigest }, { claimId: "wc-notmine00", now: T0 }));
      expect(wrong.refusal).toBe("claim-not-held");
      expect(`${wrong.message} ${JSON.stringify(wrong.details)}`).not.toContain("wc-");
      // After the claim expires, the holder is refused too.
      const expired = refusal(() => start(ready, db, {}, at(31)));
      expect(expired.refusal).toBe("claim-not-held");
      const assignment = start(ready, db);
      expect(refusal(() => updateFactoryAssignment(db, PROJECT_ID, assignment.assignmentId, { status: "running", reason: "tool-started" }, { claimId: "wc-notmine00", expectedVersion: 1, now: T0 })).refusal).toBe("claim-not-held");
    });
  });

  it("refuses to start when the workflow is not ready or the current plan has another digest", () => {
    const ready = readyWorkflow("not-ready");
    write(ready, (db) => {
      expect(refusal(() => start(ready, db, { currentPlanDigest: "c".repeat(64) })).refusal).toBe("not-ready");
      // The gate is live readiness: the current plan's digest, not the saved readiness note (R-FACTORY-12).
      const binding = readFactoryWorkflowBinding(db, PROJECT_ID, "ship")!;
      saveFactoryWorkflowBinding(db, { ...binding, readiness: "drifted", currentPlanDigest: "c".repeat(64) }, { expectedVersion: binding.version });
      expect(readFactoryWorkflowBinding(db, PROJECT_ID, "ship")).toMatchObject({ readiness: "drifted", readyRevision: 1 });
      expect(refusal(() => start(ready, db, { currentPlanDigest: "c".repeat(64) })).refusal).toBe("not-ready");
      // The ready plan is back (for example a hand edit was undone): the start goes on with no new test task.
      expect(start(ready, db).planRevision).toBe(1);
    });
  });

  it("allows one open assignment for each job, and parts with other labels run at the same time", () => {
    const ready = readyWorkflow("open");
    write(ready, (db) => {
      start(ready, db);
      expect(refusal(() => start(ready, db)).refusal).toBe("assignment-open");
      expect(start(ready, db, { partLabel: "research" })).toMatchObject({ partLabel: "research" });
      expect(start(ready, db, { role: "reviewer", toolId: "tool-b" })).toMatchObject({ role: "reviewer" });
      // The schema holds the rule too.
      const row = db.prepare("SELECT * FROM factory_assignments WHERE part_label = 'main' AND role = 'builder'").get() as Record<string, unknown>;
      expect(() => db.prepare(`INSERT INTO factory_assignments (${Object.keys(row).join(",")}) VALUES (${Object.keys(row).map(() => "?").join(",")})`)
        .run(...Object.values(row).map((value, index) => (index === 0 ? "fa-duplicate0" : value)) as never[])).toThrow(/UNIQUE/);
      expect(refusal(() => start(ready, db, { partLabel: "Not_Kebab" })).refusal).toBe("invalid-record");
    });
  });

  it("follows the status move table, refuses an illegal move and any change to a final status", () => {
    for (const from of FACTORY_ASSIGNMENT_STATUSES) {
      for (const to of FACTORY_ASSIGNMENT_STATUSES) {
        const expected = ["accepted", "failed", "cancelled"].includes(from) ? "final-status" : from === to || FACTORY_STATUS_MOVES[from].includes(to) ? null : "illegal-move";
        expect(factoryStatusMoveRefusal(from, to), `${from} -> ${to}`).toBe(expected);
      }
    }
    const ready = readyWorkflow("moves");
    write(ready, (db) => {
      let assignment = start(ready, db);
      expect(refusal(() => move(ready, db, assignment, "accepted", "review-passed")).refusal).toBe("illegal-move");
      assignment = move(ready, db, assignment, "running", "tool-started");
      // The same status only records a check: no history entry.
      const checked = updateFactoryAssignment(db, PROJECT_ID, assignment.assignmentId, { status: "running", reason: "handle-checked" }, { claimId: ready.claimId, expectedVersion: assignment.version, now: at(5) });
      expect(checked.history).toHaveLength(2);
      expect(checked.checkedAt).toBe(at(5).toISOString());
      expect(refusal(() => move(ready, db, assignment, "returned", "result-returned")).refusal).toBe("version-conflict");
      assignment = move(ready, db, checked, "cancelled", "stopped-by-person");
      const final = refusal(() => move(ready, db, assignment, "running", "tool-started"));
      expect(final.refusal).toBe("final-status");
      expect(refusal(() => updateFactoryAssignment(db, PROJECT_ID, assignment.assignmentId, { status: "cancelled", reason: "handle-checked" }, { claimId: ready.claimId, expectedVersion: assignment.version, now: T0 })).refusal).toBe("final-status");
      // The schema refuses a change to a final assignment for every caller.
      expect(() => db.prepare("UPDATE factory_assignments SET checked_at = ? WHERE assignment_id = ?").run(at(9).toISOString(), assignment.assignmentId)).toThrow(/final factory assignment never changes/);
    });
  });

  it("counts correction rounds, refuses a move past the plan's round limit, and carries the count to the job's next assignment", () => {
    const ready = readyWorkflow("rounds");
    write(ready, (db) => {
      let assignment = move(ready, db, start(ready, db), "running", "tool-started");
      for (let round = 1; round <= 2; round++) {
        assignment = move(ready, db, assignment, "returned", "result-returned");
        assignment = move(ready, db, assignment, "needs-correction", "defects-found");
        expect(assignment.roundCount).toBe(round);
        assignment = move(ready, db, assignment, "running", "correction-sent");
      }
      assignment = move(ready, db, assignment, "returned", "result-returned");
      assignment = move(ready, db, assignment, "in-review", "sent-to-review");
      const limit = refusal(() => move(ready, db, assignment, "needs-correction", "defects-found"));
      expect(limit.refusal).toBe("round-limit-reached");
      expect(limit.details).toMatchObject({ roundLimit: 2, roundCount: 2 });
      move(ready, db, assignment, "failed", "round-limit-reached");
      // A new assignment for the same job starts at the count of the one before it (a takeover keeps it too).
      const next = start(ready, db, { taskHandle: "thread-2" });
      expect(next.roundCount).toBe(2);
      move(ready, db, next, "cancelled", "stopped-by-foreman");
      // Only a once grant for reset-correction-rounds resets the count, and the start spends it.
      expect(refusal(() => start(ready, db, { resetRounds: true })).refusal).toBe("grant-missing");
      saveFactoryGrant(db, { projectId: PROJECT_ID, workflowName: "ship", action: "reset-correction-rounds", scope: "standing", runId: null, expiresAt: null, grantedBy: "the owner" }, { now: T0 });
      expect(refusal(() => start(ready, db, { resetRounds: true })).refusal).toBe("grant-out-of-scope");
      saveFactoryGrant(db, { projectId: PROJECT_ID, workflowName: "ship", action: "reset-correction-rounds", scope: "once", runId: null, expiresAt: null, grantedBy: "the owner" }, { now: T0 });
      const reset = start(ready, db, { resetRounds: true }, at(1));
      expect(reset.roundCount).toBe(0);
      expect(listFactoryGrants(db, PROJECT_ID, "ship").find((grant) => grant.scope === "once")!.spentAt).toBe(at(1).toISOString());
    });
  });

  it("keeps only the 20 newest status history entries, each with a status, a time, and a reason code", () => {
    const ready = readyWorkflow("history");
    write(ready, (db) => {
      let assignment = start(ready, db);
      for (let index = 0; index < 15; index++) {
        assignment = move(ready, db, assignment, "unknown", "handle-not-found", at((index * 2 + 1) / 2));
        assignment = move(ready, db, assignment, "running", "handle-checked", at((index * 2 + 2) / 2));
      }
      expect(assignment.history).toHaveLength(FACTORY_STATUS_HISTORY_MAX);
      expect(assignment.history.at(-1)).toEqual({ status: "running", at: at(15).toISOString(), reason: "handle-checked" });
      for (const entry of assignment.history) expect(Object.keys(entry).sort()).toEqual(["at", "reason", "status"]);
      expect(refusal(() => updateFactoryAssignment(db, PROJECT_ID, assignment.assignmentId, { status: "returned", reason: "it went fine" as never }, { claimId: ready.claimId, expectedVersion: assignment.version })).refusal).toBe("invalid-record");
    });
  });

  it("refuses never-log values and names the field, never the value", () => {
    const ready = readyWorkflow("never-log");
    write(ready, (db) => {
      for (const [handle, expected] of [["API_KEY=abc123", "never-log-field"], ["line one\nline two", "never-log-field"], ["has space", "invalid-record"], ["-----BEGIN PRIVATE KEY-----", "invalid-record"]] as const) {
        const error = refusal(() => start(ready, db, { taskHandle: handle }));
        expect(error.refusal, handle).toBe(expected);
        expect(error.message).not.toContain(handle);
        expect(error.message).toContain("taskHandle");
      }
      // A long run ID is an ID, not a credential.
      expect(start(ready, db, { taskHandle: "0123456789abcdef0123456789abcdef0123" }).taskHandle).toHaveLength(36);
    });
    expect(factoryFreeTextProblem("x".repeat(121))).toBe("too-long");
    expect(factoryFreeTextProblem("password: hunter22")).toBe("credential");
    expect(factoryFreeTextProblem("Bearer abcdefghijkl")).toBe("credential");
    expect(factoryFreeTextProblem("uses $HOME_DIR")).toBe("environment");
    expect(factoryFreeTextProblem("A short plain label.")).toBeNull();
  });
});

describe("W30 R0 P2 resolved plan revisions (T16, A51)", () => {
  it("writes canonical JSON with sorted keys and a SHA-256 digest that does not depend on key order", () => {
    expect(factoryCanonicalJson({ b: 1, a: [true, null, "x"], c: { z: 0, y: -0 } })).toBe('{"a":[true,null,"x"],"b":1,"c":{"y":0,"z":0}}');
    expect(factoryCanonicalDigest({ b: 1, a: 2 })).toBe(factoryCanonicalDigest({ a: 2, b: 1 }));
    expect(factoryDigest("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(() => factoryCanonicalJson({ a: undefined })).toThrow(/undefined/);
    expect(() => factoryCanonicalJson({ a: Number.NaN })).toThrow(/not finite/);
    expect(() => factoryCanonicalJson({ a: new Date() })).toThrow(/plain objects/);
  });

  it("resolves the same plan from the same sources, and a new tool version, a missing tool, or a config edit changes the digest", () => {
    const base = resolveFactoryPlan(planInput());
    expect(resolveFactoryPlan(planInput()).planDigest).toBe(base.planDigest);
    const plan = base.plan as Record<string, unknown>;
    expect(Object.keys(plan).sort()).toEqual(["binding", "definition", "moveTableVersion", "roleTools", "type", "workflow"]);
    expect(plan.moveTableVersion).toBe(1);
    expect(base.planJson).not.toMatch(/grant/i);
    const toolA = planInput().tools["tool-a"]!;
    const newVersion = resolveFactoryPlan(planInput({ tools: { ...planInput().tools, "tool-a": { ...toolA, reportedVersion: "1.1" } } }));
    expect(newVersion.planDigest).not.toBe(base.planDigest);
    expect(newVersion.configDigest).toBe(base.configDigest);
    expect(resolveFactoryPlan(planInput({ tools: { "tool-b": planInput().tools["tool-b"]! } })).planDigest).not.toBe(base.planDigest);
    const edited = resolveFactoryPlan(planInput({ definition: { ...DEFINITION, roundLimit: 3 } }));
    expect(edited.configDigest).not.toBe(base.configDigest);
    expect(edited.bindingDigest).toBe(base.bindingDigest);
    // Contract defaults: a reviewer never gets builder-summary by default.
    expect(factoryCanonicalJson((plan.definition as { roles: unknown }).roles)).toContain('"reviewer":{"capabilities":["read-write-files"],"context":["candidate-result","evidence-links","project-files","requirements","unit-record"]');
  });

  it("keeps exactly the ready revision, each revision an open assignment names, and the 10 newest others", () => {
    expect([...factoryPlanRevisionsToKeep([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 2, [4])].sort((a, b) => a - b)).toEqual([2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    expect(FACTORY_PLAN_KEEP_NEWEST).toBe(10);
    const ready = readyWorkflow("keep");
    write(ready, (db) => {
      // Revision 1 is ready. Start an assignment under it, then save revision 2 and run an assignment under it.
      start(ready, db);
      const saveRevision = (roundLimit: number) => {
        const resolved = resolveFactoryPlan(planInput({ definition: { ...DEFINITION, roundLimit } }));
        return saveFactoryPlanRevision(db, { projectId: PROJECT_ID, workflowName: "ship", plan: resolved.plan }, { now: T0 });
      };
      const second = saveRevision(5);
      expect(second.revision.revision).toBe(2);
      saveFactoryProofResult(db, { projectId: PROJECT_ID, workflowName: "ship", outcome: "passed", testTask: "Test", planDigest: second.revision.planDigest, path: ["builder"], manualSteps: [] }, { expectedVersion: 1 });
      markFactoryReadyRevision(db, PROJECT_ID, "ship", second.revision.planDigest, { expectedVersion: 2 });
      start(ready, db, { partLabel: "second", currentPlanDigest: second.revision.planDigest });
      // Revision 3 becomes ready; revision 1 and 2 stay because open assignments name them.
      const third = saveRevision(6);
      saveFactoryProofResult(db, { projectId: PROJECT_ID, workflowName: "ship", outcome: "passed", testTask: "Test", planDigest: third.revision.planDigest, path: ["builder"], manualSteps: [] }, { expectedVersion: 2 });
      markFactoryReadyRevision(db, PROJECT_ID, "ship", third.revision.planDigest, { expectedVersion: 3 });
      for (let limit = 7; limit <= 18; limit++) saveRevision(limit);
      // A save of a digest that a kept revision has adds nothing.
      const again = saveRevision(18);
      expect(again.created).toBe(false);
      expect(again.revision.revision).toBe(15);
      const kept = listFactoryPlanRevisions(db, PROJECT_ID, "ship").map((revision) => revision.revision);
      // Ready 3, open 1 and 2, and the 10 newest others: 6 to 15. Revisions 4 and 5 are gone.
      expect(kept).toEqual([1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    });
  });

  it("refuses any change to a saved revision and a second row with the same workflow and revision number", () => {
    const ready = readyWorkflow("immutable");
    write(ready, (db) => {
      const saved = readFactoryPlanRevision(db, PROJECT_ID, "ship")!;
      expect(() => db.prepare("UPDATE factory_workflow_plans SET created_at = ? WHERE revision = 1").run(at(1).toISOString())).toThrow(/never changes/);
      expect(() => db.prepare("INSERT INTO factory_workflow_plans VALUES (?, 'ship', 1, ?, '{}', ?, ?, ?)").run(PROJECT_ID, "d".repeat(64), "e".repeat(64), "f".repeat(64), T0.toISOString())).toThrow(/UNIQUE|PRIMARY KEY/);
      expect(() => db.prepare("INSERT INTO factory_workflow_plans VALUES (?, 'ship', 2, ?, '{}', ?, ?, ?)").run(PROJECT_ID, saved.planDigest, "e".repeat(64), "f".repeat(64), T0.toISOString())).toThrow(/UNIQUE/);
      expect(readFactoryPlanRevision(db, PROJECT_ID, "ship")).toEqual(saved);
    });
  });
});

/* ------------------------------------------------------------------------ */
/* Stage 2: config and copies                                               */
/* ------------------------------------------------------------------------ */

function configDiagnostics(yaml: string): Array<{ code: string; keyPath?: string; message: string }> {
  const root = project(`config-${Math.random().toString(36).slice(2, 8)}`, yaml);
  return loadMakeDocsConfig(root).diagnostics as Array<{ code: string; keyPath?: string; message: string }>;
}

const GOOD_BLOCK = [
  "factory:",
  "  workflows:",
  "    ship-notes:",
  "      type: build-then-review",
  "      typeVersion: 1",
  "      roles:",
  "        builder:",
  "          job: Writes the notes for one unit.",
  "          capabilities: [read-write-files, run-commands]",
  "          returns: The changed notes and a short check list.",
  "        reviewer:",
  "          job: Checks the notes against the requirements.",
  "          capabilities: [read-write-files]",
  "          returns: A pass or a list of defects.",
  "          context: [unit-record, requirements, candidate-result]",
  "      roundLimit: 3",
  "      limits:",
  "        parallelWorkers: 2",
  "        claimSize: phase",
  "      gates: [The person approves the outline.]",
  "      escalations: [A source cannot be found.]",
  "      steps:",
  "        preflight: true",
  "      integrationOwner: builder",
  "      humanChannel: wait-in-session",
  "",
].join("\n");

describe("W30 R0 P2 the factory block in project config (T7, T8, T20, A12, A54)", () => {
  it("accepts the factory block with every portable field, and an absent block keeps no workflow", () => {
    expect(configDiagnostics("")).toEqual([]);
    expect(configDiagnostics("factory: {}\n")).toEqual([]);
    expect(configDiagnostics(GOOD_BLOCK)).toEqual([]);
    expect(parseFactoryConfigBlock(undefined)).toEqual({ workflows: {} });
    const parsed = FactoryConfigBlockSchema.parse({ workflows: { a: { type: "staged-backlog", typeVersion: 2, roles: { builder: { job: "Builds.", capabilities: ["edit-code"], returns: "A diff." } }, humanChannel: "messaging-tool" } } });
    expect(parsed.workflows.a).toMatchObject({ roundLimit: 3, limits: { claimSize: "phase" }, gates: [], escalations: [], steps: { preflight: false } });
  });

  it("rejects grants, IDs, paths, digests, receipts, and secrets, and names each key", () => {
    const diagnostics = configDiagnostics([
      "factory:",
      "  grants: [merge]",
      "  workflows:",
      "    ship-notes:",
      "      type: build-then-review",
      "      typeVersion: 1",
      "      toolId: tool-a",
      "      planDigest: abc",
      "      receipts: []",
      "      typePath: /tmp/x.md",
      "      apiToken: hidden",
      "      roles:",
      "        builder:",
      "          job: Writes.",
      "          capabilities: [read-write-files]",
      "          returns: Notes.",
      "          boundTool: tool-a",
      "      humanChannel: wait-in-session",
      "",
    ].join("\n"));
    expect(diagnostics.map((item) => [item.code, item.keyPath])).toEqual([
      ["factory-block-state-field", "factory.grants"],
      ["factory-block-state-field", "factory.workflows.ship-notes.toolId"],
      ["factory-block-state-field", "factory.workflows.ship-notes.planDigest"],
      ["factory-block-state-field", "factory.workflows.ship-notes.receipts"],
      ["factory-block-state-field", "factory.workflows.ship-notes.typePath"],
      ["factory-block-state-field", "factory.workflows.ship-notes.apiToken"],
      ["factory-block-state-field", "factory.workflows.ship-notes.roles.builder.boundTool"],
    ]);
    expect(diagnostics[0]!.message).toContain("holds a grant");
    expect(diagnostics[5]!.message).toContain("A secret stays with the tool that owns it.");
    expect(factoryConfigStateFieldProblems({ workflows: { "token-flow": { roles: { "secret-agent": {} } } } })).toEqual([]);
  });

  it("refuses state and secrets in free-text values without echoing them", () => {
    const value = (field: string, text: string) => configDiagnostics(GOOD_BLOCK.replace("          job: Writes the notes for one unit.", `          ${field}: "${text}"`));
    expect(value("job", "Read /Users/someone/project/notes")[0]!.message).toContain("looks like a machine path");
    expect(value("job", `Check ${"a".repeat(64)}`)[0]!.message).toContain("looks like");
    expect(value("job", "Use password: hunter22 to sign in")[0]!.message).toContain("looks like a credential");
    expect(value("job", "Use password: hunter22 to sign in")[0]!.message).not.toContain("hunter22");
    expect(value("job", "Set DEPLOY_ENV=prod first")[0]!.message).toContain("environment setting");
    expect(value("job", "x".repeat(121))[0]!.message).toContain("longer than its limit");
  });

  it("refuses an unknown context kind and names it, and a type version that is not a plain number", () => {
    const unknown = configDiagnostics(GOOD_BLOCK.replace("context: [unit-record, requirements, candidate-result]", "context: [unit-record, builder-mood]"));
    expect(unknown).toEqual([expect.objectContaining({ code: "invalid-factory-block", keyPath: "factory.workflows.ship-notes.roles.reviewer.context.1" })]);
    expect(unknown[0]!.message).toContain('"builder-mood" is not a context kind');
    expect(configDiagnostics(GOOD_BLOCK.replace("typeVersion: 1", 'typeVersion: "1"'))[0]).toMatchObject({ keyPath: "factory.workflows.ship-notes.typeVersion" });
    expect(configDiagnostics(GOOD_BLOCK.replace("integrationOwner: builder", "integrationOwner: editor"))[0]!.message).toContain('"editor" is not one of the workflow\'s roles');
  });
});

describe("W30 R0 P2 local copies (T9, T10, T11, T21, A13, A14, A15, A55)", () => {
  it("writes read-only copies with the generated note, the latest plan revision, and its ready line, and never a grant", () => {
    const ready = readyWorkflow("copies");
    write(ready, (db) => {
      saveFactoryMachineTool(db, { toolId: "tool-a", kind: "agent-harness", label: "Tool A", state: "available", reportedVersion: "1.0", capabilities: ["read-write-files"], proofs: [{ capabilityId: "read-write-files", method: "Wrote and read a file.", toolVersion: "1.0", provedAt: T0, result: "proved", notCovered: [] }] }, { expectedVersion: null, now: T0 });
      saveFactoryGrant(db, { projectId: PROJECT_ID, workflowName: "ship", action: "deploy-to-production", scope: "standing", runId: null, expiresAt: null, grantedBy: "the owner" }, { now: T0 });
      const result = writeFactoryCopies(db, ready.root, PROJECT_ID);
      expect(result.written).toEqual([".gitignore", "tools.md", factoryWorkflowCopyName("ship")]);
      const folder = path.join(ready.root, FACTORY_COPIES_RELATIVE_PATH);
      for (const name of ["tools.md", factoryWorkflowCopyName("ship")]) {
        const text = readFileSync(path.join(folder, name), "utf8");
        expect(text.split("\n")[0]).toBe(FACTORY_COPY_NOTE);
        expect(text).not.toContain("deploy-to-production");
        expect(text).not.toMatch(/grant/i);
        if (POSIX) expect(statSync(path.join(folder, name)).mode & 0o222).toBe(0);
      }
      expect(readFileSync(path.join(folder, ".gitignore"), "utf8")).toBe("*\n");
      const workflow = readFileSync(path.join(folder, factoryWorkflowCopyName("ship")), "utf8");
      expect(workflow).toContain("Latest plan revision: 1. This is the `ready` revision.");
      expect(workflow).toContain(ready.planDigest);

      // A newer revision that is not ready says so.
      const resolved = resolveFactoryPlan(planInput({ definition: { ...DEFINITION, roundLimit: 4 } }));
      saveFactoryPlanRevision(db, { projectId: PROJECT_ID, workflowName: "ship", plan: resolved.plan }, { now: T0 });
      writeFactoryCopies(db, ready.root, PROJECT_ID);
      expect(readFileSync(path.join(folder, factoryWorkflowCopyName("ship")), "utf8")).toContain("Latest plan revision: 2. This is not the `ready` revision. The `ready` revision is 1.");
    });
  });

  it("never reads a copy as input: an edited copy changes no result and the next write replaces it", () => {
    const ready = readyWorkflow("tamper");
    write(ready, (db) => {
      writeFactoryCopies(db, ready.root, PROJECT_ID);
      const file = path.join(ready.root, FACTORY_COPIES_RELATIVE_PATH, factoryWorkflowCopyName("ship"));
      const original = readFileSync(file, "utf8");
      chmodSync(file, 0o644);
      writeFileSync(file, original.replace("This is the `ready` revision.", "This is not ready.").replace(/"roundLimit": 2/, '"roundLimit": 99'));
      writeFileSync(path.join(ready.root, FACTORY_COPIES_RELATIVE_PATH, "stale.md"), "old copy");
      // The plan, its digest, and the assignment checks come from the Store only.
      expect(resolveFactoryPlan(planInput()).planDigest).toBe(ready.planDigest);
      let assignment = move(ready, db, start(ready, db), "running", "tool-started");
      for (let round = 0; round < 2; round++) {
        assignment = move(ready, db, move(ready, db, assignment, "returned", "result-returned"), "needs-correction", "defects-found");
        assignment = move(ready, db, assignment, "running", "correction-sent");
      }
      expect(refusal(() => move(ready, db, move(ready, db, assignment, "returned", "result-returned"), "needs-correction", "defects-found")).refusal).toBe("round-limit-reached");
      const rewritten = writeFactoryCopies(db, ready.root, PROJECT_ID);
      expect(rewritten.removed).toEqual(["stale.md"]);
      expect(readFileSync(file, "utf8")).toBe(original);
    });
    expect(isProtectedContentPath(".make-docs/factory/workflow-ship.md")).toBe(true);
  });

  it("keeps the copies out of git in a fresh project through the folder's own .gitignore", () => {
    const ready = readyWorkflow("gitignored");
    const git = (...args: string[]) => spawnSync("git", args, { cwd: ready.root, encoding: "utf8" });
    if (git("init", "-q").status !== 0) return;
    write(ready, (db) => writeFactoryCopies(db, ready.root, PROJECT_ID));
    const status = git("status", "--porcelain", "--untracked-files=all").stdout;
    expect(status).not.toContain(".make-docs/factory");
    expect(git("check-ignore", "-q", `${FACTORY_COPIES_RELATIVE_PATH}/tools.md`).status).toBe(0);
  });
});

/* ------------------------------------------------------------------------ */
/* Stage 3: backups outside git                                             */
/* ------------------------------------------------------------------------ */

describe("W30 R0 P2 backups outside git (T12 to T15, A16, A17, A18)", () => {
  function withBackupProject(name: string): { ready: Ready; assignment: FactoryAssignmentRecord; file: string } {
    const ready = readyWorkflow(name);
    expect(isInsideGitWorkTree(ready.root)).toBe(false);
    const file = path.join(ready.root, "notes", "plan.md");
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, "the original text\n");
    const assignment = write(ready, (db) => start(ready, db));
    return { ready, assignment, file };
  }

  it("copies a file before a worker changes it and records its file, hash, and assignment", () => {
    const { ready, assignment, file } = withBackupProject("backup");
    write(ready, (db) => {
      const outcome = backupFactoryFileBeforeChange(db, { projectRoot: ready.root, projectId: PROJECT_ID, assignmentId: assignment.assignmentId, filePath: "notes/plan.md" }, { now: T0 });
      expect(outcome.status).toBe("backed-up");
      const record = outcome.record!;
      expect(record).toMatchObject({ assignmentId: assignment.assignmentId, originalPath: file });
      expect(record.backupPath).toBe(path.join(ready.root, FACTORY_BACKUP_RELATIVE_PATH, assignment.assignmentId, "notes", "plan.md"));
      expect(record.contentDigest).toBe(factoryDigest("the original text\n"));
      expect(factoryDigest(readFileSync(record.backupPath, "utf8"))).toBe(record.contentDigest);
      writeFileSync(file, "the worker's change\n");
      // The first backup counts; a second call keeps it.
      expect(backupFactoryFileBeforeChange(db, { projectRoot: ready.root, projectId: PROJECT_ID, assignmentId: assignment.assignmentId, filePath: "notes/plan.md" }, { now: at(1) })).toMatchObject({ status: "already-backed-up", record: { contentDigest: record.contentDigest } });
      expect(backupFactoryFileBeforeChange(db, { projectRoot: ready.root, projectId: PROJECT_ID, assignmentId: assignment.assignmentId, filePath: "notes/new.md" })).toEqual({ status: "no-file", record: null });
      expect(() => backupFactoryFileBeforeChange(db, { projectRoot: ready.root, projectId: PROJECT_ID, assignmentId: assignment.assignmentId, filePath: "../outside.md" })).toThrow(/not inside the project folder/);
    });
    const readme = readFileSync(path.join(ready.root, FACTORY_BACKUP_RELATIVE_PATH, "README.md"), "utf8");
    expect(readme).toBe(FACTORY_BACKUP_README);
    expect(readme).toContain("How to Get a File Back");
    expect(readme).toContain("older than 30 days");
    expect(readme).toContain("accepted or closed");
    expect(readme).toContain("never removes the installation recovery backups");
  });

  it("does not copy a file in a folder with git", () => {
    const { ready, assignment } = withBackupProject("with-git");
    mkdirSync(path.join(ready.root, ".git"));
    write(ready, (db) => {
      expect(backupFactoryFileBeforeChange(db, { projectRoot: ready.root, projectId: PROJECT_ID, assignmentId: assignment.assignmentId, filePath: "notes/plan.md" })).toEqual({ status: "inside-git", record: null });
      expect(listFactoryBackups(db, PROJECT_ID)).toEqual([]);
    });
  });

  it("removes an assignment's backups when its work is accepted, and never an installation recovery backup", () => {
    const { ready, assignment } = withBackupProject("accepted");
    const installation = [
      path.join(ready.root, ".make-docs/backup/2042-06-01/notes/plan.md"),
      path.join(ready.root, ".make-docs/backup/operations/op-1/1-plan.md"),
    ];
    for (const file of installation) {
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, "installation recovery copy\n");
      utimesSync(file, at(-60 * 24 * 90), at(-60 * 24 * 90));
    }
    write(ready, (db) => {
      const { record } = backupFactoryFileBeforeChange(db, { projectRoot: ready.root, projectId: PROJECT_ID, assignmentId: assignment.assignmentId, filePath: "notes/plan.md" }, { now: T0 });
      expect(cleanupFactoryBackups(db, { projectRoot: ready.root, projectId: PROJECT_ID }, { now: at(1) }).removed).toEqual([]);
      let current = move(ready, db, assignment, "running", "tool-started");
      current = move(ready, db, current, "returned", "result-returned");
      current = move(ready, db, current, "in-review", "sent-to-review");
      move(ready, db, current, "accepted", "review-passed");
      const cleaned = cleanupFactoryBackups(db, { projectRoot: ready.root, projectId: PROJECT_ID }, { now: at(2) });
      expect(cleaned.removed).toEqual([record!.backupPath]);
      expect(cleaned.reasons[record!.backupPath]).toBe("work-finished");
      expect(existsSync(record!.backupPath)).toBe(false);
      expect(listFactoryBackups(db, PROJECT_ID)).toEqual([]);
    });
    for (const file of installation) expect(readFileSync(file, "utf8")).toBe("installation recovery copy\n");
    expect(existsSync(path.join(ready.root, FACTORY_BACKUP_RELATIVE_PATH, "README.md"))).toBe(true);
  });

  it("removes an assignment's backups when its work unit is closed, which needs the assignment final first", () => {
    const { ready, assignment } = withBackupProject("closed");
    write(ready, (db) => {
      const { record } = backupFactoryFileBeforeChange(db, { projectRoot: ready.root, projectId: PROJECT_ID, assignmentId: assignment.assignmentId, filePath: "notes/plan.md" }, { now: T0 });
      const close = () => {
        const unit = readWorkUnit(db, ready.unitStoreId)!;
        const { revision: _revision, ...input } = unit;
        return putWorkUnit(db, { ...input, status: "closed", closeOutcome: "done" }, { expectedVersion: unit.revision, claimId: ready.claimId, now: T0 });
      };
      // W30 R0 P2 re-check: an open assignment stops the close, so the assignment is never stranded without a claim.
      expect(close).toThrow(/factory assignment is still open/);
      expect(readFactoryAssignment(db, PROJECT_ID, assignment.assignmentId)).toMatchObject({ status: "offered" });
      move(ready, db, assignment, "cancelled", "stopped-by-person");
      close();
      expect(cleanupFactoryBackups(db, { projectRoot: ready.root, projectId: PROJECT_ID }, { now: at(1) }).reasons).toEqual({ [record!.backupPath]: "work-finished" });
    });
  });

  it("removes any backup older than 30 days, recorded or not, and keeps a newer one", () => {
    const { ready, assignment } = withBackupProject("old");
    write(ready, (db) => {
      const { record } = backupFactoryFileBeforeChange(db, { projectRoot: ready.root, projectId: PROJECT_ID, assignmentId: assignment.assignmentId, filePath: "notes/plan.md" }, { now: T0 });
      const stray = path.join(ready.root, FACTORY_BACKUP_RELATIVE_PATH, "fa-crashedbefore", "x.md");
      mkdirSync(path.dirname(stray), { recursive: true });
      writeFileSync(stray, "copied, never recorded\n");
      const day = 24 * 60;
      utimesSync(stray, at(-31 * day), at(-31 * day));
      expect(cleanupFactoryBackups(db, { projectRoot: ready.root, projectId: PROJECT_ID }, { now: at(29 * day) }).removed).toEqual([stray]);
      expect(existsSync(record!.backupPath)).toBe(true);
      const cleaned = cleanupFactoryBackups(db, { projectRoot: ready.root, projectId: PROJECT_ID }, { now: at(31 * day) });
      expect(cleaned.reasons).toEqual({ [record!.backupPath]: "older-than-30-days" });
      expect(listFactoryBackups(db, PROJECT_ID)).toEqual([]);
      expect(readdirSync(path.join(ready.root, FACTORY_BACKUP_RELATIVE_PATH)).sort()).toEqual([".gitignore", "README.md"]);
    });
  });
});

describe("W30 R0 P2 keeps the claim ID private in records and copies", () => {
  it("writes no claim ID into any factory table or copy", () => {
    const ready = readyWorkflow("private");
    write(ready, (db) => {
      start(ready, db);
      writeFactoryCopies(db, ready.root, PROJECT_ID);
      for (const table of FACTORY_STORE_TABLE_NAMES) expect(JSON.stringify(db.prepare(`SELECT * FROM ${table}`).all()), table).not.toContain(ready.claimId);
    });
    const folder = path.join(ready.root, FACTORY_COPIES_RELATIVE_PATH);
    for (const name of readdirSync(folder)) expect(readFileSync(path.join(folder, name), "utf8")).not.toContain(ready.claimId);
    expect(readFactoryAssignment).toBeTypeOf("function");
  });
});

describe("W30 R0 P2 project scoping (owner decision 2026-11-23)", () => {
  const PROJECT_SCOPED = ["factory_workflow_plans", "factory_workflow_bindings", "factory_grants", "factory_grant_uses", "factory_assignments", "factory_proof_results", "factory_backups"];

  it("puts the project ID on every project-scoped table and none on the machine tables", () => {
    const tables = physical();
    for (const table of PROJECT_SCOPED) expect(tables[table], table).toContain("project_id");
    for (const table of ["factory_machine_tools", "factory_capability_proofs"]) expect(tables[table]!.some((column) => column.includes("project")), table).toBe(false);
    expect([...PROJECT_SCOPED, "factory_machine_tools", "factory_capability_proofs"].sort()).toEqual([...FACTORY_STORE_TABLE_NAMES].sort());
  });

  it("refuses a missing or unknown project ID in every project-scoped function, and changes nothing", () => {
    const ready = readyWorkflow("scoping");
    const { assignment, grantId } = write(ready, (db) => {
      const started = start(ready, db);
      const grant = saveFactoryGrant(db, { projectId: PROJECT_ID, workflowName: "ship", action: "merge", scope: "standing", runId: null, expiresAt: null, grantedBy: "the owner" }, { now: T0 });
      return { assignment: started, grantId: grant.grantId };
    });
    const dump = (db: StoreDatabase) => FACTORY_STORE_TABLE_NAMES.map((table) => JSON.stringify(db.prepare(`SELECT * FROM ${table}`).all())).join("\n");
    const resolved = resolveFactoryPlan(planInput());
    const calls: Array<[string, (db: StoreDatabase, projectId: string) => unknown]> = [
      ["saveFactoryWorkflowBinding", (db, projectId) => saveFactoryWorkflowBinding(db, { projectId, workflowName: "ship", roles: {}, worktreeMethod: "none", channelRef: null, wakeMethod: "person", wakeRef: null, knownLosses: [], readiness: "draft", currentPlanDigest: null }, { expectedVersion: null })],
      ["readFactoryWorkflowBinding", (db, projectId) => readFactoryWorkflowBinding(db, projectId, "ship")],
      ["markFactoryReadyRevision", (db, projectId) => markFactoryReadyRevision(db, projectId, "ship", ready.planDigest, { expectedVersion: 2 })],
      ["saveFactoryPlanRevision", (db, projectId) => saveFactoryPlanRevision(db, { projectId, workflowName: "ship", plan: resolved.plan })],
      ["readFactoryPlanRevision", (db, projectId) => readFactoryPlanRevision(db, projectId, "ship")],
      ["listFactoryPlanRevisions", (db, projectId) => listFactoryPlanRevisions(db, projectId, "ship")],
      ["saveFactoryGrant", (db, projectId) => saveFactoryGrant(db, { projectId, workflowName: "ship", action: "deploy", scope: "standing", runId: null, expiresAt: null, grantedBy: "the owner" })],
      ["listFactoryGrants", (db, projectId) => listFactoryGrants(db, projectId, "ship")],
      ["revokeFactoryGrant", (db, projectId) => revokeFactoryGrant(db, projectId, grantId, { expectedVersion: 1 })],
      ["useFactoryGrant", (db, projectId) => useFactoryGrant(db, { projectId, workflowName: "ship", action: "merge", runId: "run-1", unitStoreId: "unit-1" })],
      ["startFactoryAssignment", (db, projectId) => startFactoryAssignment(db, { projectId, workflowName: "ship", checkoutId: ready.checkoutId, unitStoreId: ready.unitStoreId, role: "reviewer", toolId: "tool-b", taskHandle: null, runId: "run-1", currentPlanDigest: ready.planDigest }, { claimId: ready.claimId, now: T0 })],
      ["updateFactoryAssignment", (db, projectId) => updateFactoryAssignment(db, projectId, assignment.assignmentId, { status: "running", reason: "tool-started" }, { claimId: ready.claimId, expectedVersion: 1, now: T0 })],
      ["readFactoryAssignment", (db, projectId) => readFactoryAssignment(db, projectId, assignment.assignmentId)],
      ["saveFactoryProofResult", (db, projectId) => saveFactoryProofResult(db, { projectId, workflowName: "ship", outcome: "failed", testTask: "Test", planDigest: ready.planDigest, path: ["builder"], manualSteps: [] }, { expectedVersion: null })],
      ["listFactoryBackups", (db, projectId) => listFactoryBackups(db, projectId)],
      ["backupFactoryFileBeforeChange", (db, projectId) => backupFactoryFileBeforeChange(db, { projectRoot: ready.root, projectId, assignmentId: assignment.assignmentId, filePath: ".make-docs/config.yaml" })],
      ["cleanupFactoryBackups", (db, projectId) => cleanupFactoryBackups(db, { projectRoot: ready.root, projectId })],
      ["writeFactoryCopies", (db, projectId) => writeFactoryCopies(db, ready.root, projectId)],
    ];
    write(ready, (db) => {
      const before = dump(db);
      for (const [name, call] of calls) {
        expect(refusal(() => call(db, "")).refusal, `${name} missing`).toBe("project-not-identified");
        expect(refusal(() => call(db, "no-such-project")).refusal, `${name} unknown`).toBe("project-not-registered");
      }
      expect(dump(db)).toBe(before);
    });
    expect(existsSync(path.join(ready.root, FACTORY_COPIES_RELATIVE_PATH))).toBe(false);
  });

  it("never reaches another project's records, even from the same folder", () => {
    const ready = readyWorkflow("two-projects");
    const other = path.join(temp, "other-project");
    mkdirSync(path.join(other, ".make-docs"), { recursive: true });
    writeFileSync(path.join(other, ".make-docs/config.yaml"), "projectId: other-project\n");
    getInstallationCheckoutId(other, store);
    writeWorkStore(other, () => undefined, { storeRoot: store });
    write(ready, (db) => {
      const assignment = start(ready, db);
      const grant = saveFactoryGrant(db, { projectId: PROJECT_ID, workflowName: "ship", action: "merge", scope: "standing", runId: null, expiresAt: null, grantedBy: "the owner" }, { now: T0 });
      const { record } = backupFactoryFileBeforeChange(db, { projectRoot: ready.root, projectId: PROJECT_ID, assignmentId: assignment.assignmentId, filePath: ".make-docs/config.yaml" }, { now: T0 });
      expect(record).toMatchObject({ projectId: PROJECT_ID });
      expect(readFactoryAssignment(db, "other-project", assignment.assignmentId)).toBeNull();
      expect(readFactoryWorkflowBinding(db, "other-project", "ship")).toBeNull();
      expect(listFactoryGrants(db, "other-project", "ship")).toEqual([]);
      expect(refusal(() => updateFactoryAssignment(db, "other-project", assignment.assignmentId, { status: "running", reason: "tool-started" }, { claimId: ready.claimId, expectedVersion: 1, now: T0 })).refusal).toBe("record-not-found");
      expect(refusal(() => revokeFactoryGrant(db, "other-project", grant.grantId, { expectedVersion: 1 })).refusal).toBe("record-not-found");
      // A cleanup for the other project, run on this folder, removes nothing of this project.
      expect(cleanupFactoryBackups(db, { projectRoot: ready.root, projectId: "other-project" }, { now: at(60 * 24 * 40) }).reasons).toEqual({});
      expect(existsSync(record!.backupPath)).toBe(true);
      expect(listFactoryBackups(db, PROJECT_ID)).toHaveLength(1);
    });
  });
});

/* ------------------------------------------------------------------------ */
/* Independent review fixes                                                 */
/* ------------------------------------------------------------------------ */

const WORK_RECORD = "docs/work/2042-06-01-w1-r0-factory";
const WORK_INDEX = `---
title: "W1 R0 Factory"
kind: "work"
status: "active"
coordinate: "W1 R0"
---

# W1 R0 Factory

## Phase Map

- [01-first.md](01-first.md)
`;
const workPhase = (tasks: string) => `---
title: "Phase 1: First"
kind: "work"
status: "active"
coordinate: "W1 R0 P1"
---

# Phase 1: First

## Stage 1 - Build

### Tasks

${tasks}
### Dependencies

- None.
`;

describe("W30 R0 P2 review: no cascade from work units into factory records (finding 1)", () => {
  it("stops a sync file whose removed unit has an open assignment, keeps the assignment, and later keeps a final one after its unit goes", () => {
    const root = project("sync-guard");
    const writeFile = (relative: string, text: string) => {
      mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
      writeFileSync(path.join(root, relative), text);
    };
    writeFile(`${WORK_RECORD}/00-index.md`, WORK_INDEX);
    writeFile(`${WORK_RECORD}/01-first.md`, workPhase("- [ ] T1: Build the parser.\n- [ ] T2: Write the notes.\n"));
    expect(syncWorkFiles(root, { storeRoot: store, now: T0 }).conflicts).toEqual([]);
    const t2 = () => writeWorkStore(root, (db) => listWorkUnits(db, PROJECT_ID).find((unit) => unit.coordinate === "W1 R0 P1 T2") ?? null, { storeRoot: store, now: T0 });
    const unitStoreId = t2()!.storeId;
    const syncCheckoutId = getInstallationCheckoutId(root, store);
    const claimFor = (db: StoreDatabase) => {
      const unit = readWorkUnit(db, unitStoreId)!;
      const outcome = claimWorkUnit(db, { unitStoreId, claimant: "foreman", taskHandle: "run-1", ttlSeconds: null, expectedVersion: unit.revision, takeover: null }, { now: T0 });
      if (outcome.result === "refused") throw new Error(outcome.refusal);
      return outcome.claim.claimId;
    };
    const assignmentId = writeWorkStore(root, (db) => {
      saveBinding(db);
      const resolved = resolveFactoryPlan(planInput());
      const saved = saveFactoryPlanRevision(db, { projectId: PROJECT_ID, workflowName: "ship", plan: resolved.plan }, { now: T0 });
      saveFactoryProofResult(db, { projectId: PROJECT_ID, workflowName: "ship", outcome: "passed", testTask: "Test", planDigest: saved.revision.planDigest, path: ["builder"], manualSteps: [] }, { expectedVersion: null, now: T0 });
      markFactoryReadyRevision(db, PROJECT_ID, "ship", saved.revision.planDigest, { expectedVersion: 1 });
      const claimId = claimFor(db);
      const assignment = startFactoryAssignment(db, { projectId: PROJECT_ID, workflowName: "ship", checkoutId: syncCheckoutId, unitStoreId, role: "builder", toolId: "tool-a", taskHandle: null, runId: "run-1", currentPlanDigest: saved.revision.planDigest }, { claimId, now: T0 });
      expect(releaseWorkClaim(db, { unitStoreId, claimId, expectedVersion: readWorkUnit(db, unitStoreId)!.revision }).accepted).toBe(true);
      // deleteWorkUnit refuses too.
      expect(() => deleteWorkUnit(db, unitStoreId, { expectedVersion: readWorkUnit(db, unitStoreId)!.revision })).toThrow(/open factory assignment/);
      return assignment.assignmentId;
    }, { storeRoot: store, now: T0 });

    // A person removes T2 from the file: the sync stops that file and deletes nothing.
    writeFile(`${WORK_RECORD}/01-first.md`, workPhase("- [ ] T1: Build the parser.\n"));
    const stopped = syncWorkFiles(root, { storeRoot: store, now: at(1) });
    expect(stopped.conflicts.flatMap((entry) => entry.reasons)).toEqual(["A factory assignment is still open for W1 R0 P1 T2. Finish or cancel it first, then sync again."]);
    expect(t2()).not.toBeNull();
    writeWorkStore(root, (db) => expect(readFactoryAssignment(db, PROJECT_ID, assignmentId)).toMatchObject({ status: "offered" }), { storeRoot: store, now: T0 });

    // After the assignment is final, the unit may leave; the final assignment stays until an explicit scoped cleanup (PRD 38).
    writeWorkStore(root, (db) => {
      const claimId = claimFor(db);
      updateFactoryAssignment(db, PROJECT_ID, assignmentId, { status: "cancelled", reason: "stopped-by-person" }, { claimId, expectedVersion: 1, now: T0 });
      releaseWorkClaim(db, { unitStoreId, claimId, expectedVersion: readWorkUnit(db, unitStoreId)!.revision });
    }, { storeRoot: store, now: T0 });
    const settled = syncWorkFiles(root, { storeRoot: store, now: at(2) });
    expect(settled.deleted.map((entry) => entry.coordinate)).toContain("W1 R0 P1 T2");
    expect(t2()).toBeNull();
    writeWorkStore(root, (db) => expect(readFactoryAssignment(db, PROJECT_ID, assignmentId)).toMatchObject({ status: "cancelled", unitStoreId }), { storeRoot: store, now: T0 });
  });

  it("makes the scoped project cleanup refuse an open assignment, and keep a workflow whole while a backup record of it stays (owner decision 2026-11-24)", () => {
    const ready = readyWorkflow("prune");
    const assignmentId = write(ready, (db) => {
      const assignment = start(ready, db);
      backupFactoryFileBeforeChange(db, { projectRoot: ready.root, projectId: PROJECT_ID, assignmentId: assignment.assignmentId, filePath: ".make-docs/config.yaml" }, { now: T0 });
      return assignment.assignmentId;
    });
    const prune = () => withStoreDatabase(store, (db) => {
      db.prepare("DELETE FROM installation_checkouts WHERE project_id = ?").run(PROJECT_ID);
      db.prepare("DELETE FROM project_register WHERE project_id = ?").run(PROJECT_ID);
      return deletePrunedProjectWorkRows(db, PROJECT_ID, { exportDigest: workProjectDigest(db, PROJECT_ID), now: at(60) });
    });
    const rows = () => withStoreDatabase(store, (db) => ({
      assignments: (db.prepare("SELECT count(*) AS n FROM factory_assignments").get() as { n: number }).n,
      backups: (db.prepare("SELECT count(*) AS n FROM factory_backups").get() as { n: number }).n,
      bindings: (db.prepare("SELECT count(*) AS n FROM factory_workflow_bindings").get() as { n: number }).n,
    }));
    expect(() => prune()).toThrow(/open factory assignment/);
    expect(rows()).toEqual({ assignments: 1, backups: 1, bindings: 1 });
    write(ready, (db) => move(ready, db, readFactoryAssignment(db, PROJECT_ID, assignmentId)!, "cancelled", "stopped-by-person"));
    // A backup record goes only together with its file, and this cleanup removes no file. So the workflow stays whole.
    expect(prune()).toMatchObject({
      factoryRemoved: { factory_assignments: 0, factory_grant_uses: 0, factory_grants: 0, factory_proof_results: 0, factory_workflow_plans: 0, factory_workflow_bindings: 0 },
      factoryKept: { workflows: ["ship"], factory_backups: 1 },
    });
    expect(rows()).toEqual({ assignments: 1, backups: 1, bindings: 1 });
  });

  it("refuses to remove an assignment that a backup record names, for every connection", () => {
    const ready = readyWorkflow("restrict");
    write(ready, (db) => {
      const assignment = start(ready, db);
      backupFactoryFileBeforeChange(db, { projectRoot: ready.root, projectId: PROJECT_ID, assignmentId: assignment.assignmentId, filePath: ".make-docs/config.yaml" }, { now: T0 });
      expect(() => db.prepare("DELETE FROM factory_assignments WHERE assignment_id = ?").run(assignment.assignmentId)).toThrow(/FOREIGN KEY/);
    });
  });
});

describe("W30 R0 P2 review: plan save checks and computes (finding 2)", () => {
  it("runs the never-log check on every text value in the plan and computes both digests from the plan", () => {
    const ready = readyWorkflow("plan-check");
    write(ready, (db) => {
      const resolved = resolveFactoryPlan(planInput({ definition: { ...DEFINITION, roundLimit: 7 } }));
      const saved = saveFactoryPlanRevision(db, { projectId: PROJECT_ID, workflowName: "ship", plan: resolved.plan, configDigest: "0".repeat(64), bindingDigest: "0".repeat(64) } as never, { now: T0 });
      expect(saved.revision).toMatchObject({ configDigest: resolved.configDigest, bindingDigest: resolved.bindingDigest });
      expect(saved.revision.configDigest).toBe(factoryCanonicalDigest((resolved.plan as { definition: unknown }).definition));
      const leaky = JSON.parse(resolved.planJson) as { definition: { roles: { builder: { job: string } } } };
      leaky.definition.roles.builder.job = "Use password: hunter22 here";
      const error = refusal(() => saveFactoryPlanRevision(db, { projectId: PROJECT_ID, workflowName: "ship", plan: leaky }));
      expect(error.refusal).toBe("never-log-field");
      expect(error.message).toContain("plan.definition.roles.builder.job");
      expect(error.message).not.toContain("hunter22");
      const multi = JSON.parse(resolved.planJson) as { binding: { knownLosses: string[] } };
      multi.binding.knownLosses = ["line one\nline two"];
      expect(refusal(() => saveFactoryPlanRevision(db, { projectId: PROJECT_ID, workflowName: "ship", plan: multi })).refusal).toBe("never-log-field");
      expect(refusal(() => saveFactoryPlanRevision(db, { projectId: PROJECT_ID, workflowName: "ship", plan: { workflow: "ship" } })).refusal).toBe("invalid-record");
      expect(listFactoryPlanRevisions(db, PROJECT_ID, "ship").map((revision) => revision.revision)).toEqual([1, 2]);
    });
  });
});

describe("W30 R0 P2 review: a save that changes nothing keeps ready (finding 3)", () => {
  it("keeps ready when the resolved plan has the ready revision's digest, and not otherwise", () => {
    const ready = readyWorkflow("keep-ready");
    write(ready, (db) => {
      let binding = readFactoryWorkflowBinding(db, PROJECT_ID, "ship")!;
      binding = saveFactoryWorkflowBinding(db, { ...binding, readiness: "wired", currentPlanDigest: ready.planDigest }, { expectedVersion: binding.version });
      expect(binding).toMatchObject({ readiness: "ready", readyRevision: 1 });
      binding = saveFactoryWorkflowBinding(db, { ...binding, readiness: "wired", worktreeMethod: "separate-copy", currentPlanDigest: "d".repeat(64) }, { expectedVersion: binding.version });
      expect(binding).toMatchObject({ readiness: "wired", readyRevision: 1 });
      expect(refusal(() => start(ready, db, { currentPlanDigest: "d".repeat(64) })).refusal).toBe("not-ready");
    });
  });
});

describe("W30 R0 P2 review: smaller fixes (findings 5 to 8)", () => {
  it("keeps a backup record and its file together when the checkout folder moved, and removes both after 30 days (finding 5, owner decision 2026-11-24)", () => {
    const ready = readyWorkflow("moving");
    const record = write(ready, (db) => {
      const assignment = start(ready, db);
      return backupFactoryFileBeforeChange(db, { projectRoot: ready.root, projectId: PROJECT_ID, assignmentId: assignment.assignmentId, filePath: ".make-docs/config.yaml" }, { now: T0 }).record!;
    });
    const day = 24 * 60;
    utimesSync(record.backupPath, at(-day), at(-day));
    const moved = path.join(temp, "moved-checkout");
    renameSync(ready.root, moved);
    const movedBackup = path.join(moved, path.relative(ready.root, record.backupPath));
    writeWorkStore(moved, (db) => {
      // Within 30 days the record of the old folder stays, and the moved file is not touched.
      expect(cleanupFactoryBackups(db, { projectRoot: moved, projectId: PROJECT_ID }, { now: at(10 * day) })).toMatchObject({ removed: [], kept: [] });
      expect(existsSync(movedBackup)).toBe(true);
      expect(listFactoryBackups(db, PROJECT_ID)).toHaveLength(1);
      // After 30 days the record is due. The moved file has the record's path inside the project and its digest,
      // so it is the record's file: the file and the record go together, and nothing is dropped alone.
      const cleaned = cleanupFactoryBackups(db, { projectRoot: moved, projectId: PROJECT_ID }, { now: at(31 * day) });
      expect(cleaned.kept).toEqual([]);
      expect(cleaned.removed).toEqual([movedBackup]);
      expect(cleaned.reasons).toEqual({ [movedBackup]: "older-than-30-days" });
      expect(existsSync(movedBackup)).toBe(false);
      expect(listFactoryBackups(db, PROJECT_ID)).toEqual([]);
    }, { storeRoot: store, now: T0 });
  });

  it("lists assignments in the order they were made, after the history trim (finding 6)", () => {
    const ready = readyWorkflow("order");
    write(ready, (db) => {
      let first = start(ready, db);
      for (let index = 0; index < 15; index++) {
        first = move(ready, db, first, "unknown", "handle-not-found", at((index * 2 + 1) / 2));
        first = move(ready, db, first, "running", "handle-checked", at((index * 2 + 2) / 2));
      }
      const second = start(ready, db, { partLabel: "second" }, at(5));
      expect(first.history[0]!.at > second.history[0]!.at).toBe(true);
      expect(listFactoryAssignments(db, PROJECT_ID).map((assignment) => assignment.assignmentId)).toEqual([first.assignmentId, second.assignmentId]);
    });
  });

  it("spends a reset grant only when the round count is above 0 (finding 7)", () => {
    const ready = readyWorkflow("reset-zero");
    write(ready, (db) => {
      saveFactoryGrant(db, { projectId: PROJECT_ID, workflowName: "ship", action: "reset-correction-rounds", scope: "once", runId: null, expiresAt: null, grantedBy: "the owner" }, { now: T0 });
      expect(start(ready, db, { resetRounds: true }).roundCount).toBe(0);
      expect(listFactoryGrants(db, PROJECT_ID, "ship")[0]!.spentAt).toBeNull();
    });
  });

  it("hides a workflow or role name that looks like a token in config errors (finding 8)", () => {
    const secretName = "xq7lm2pz9rt4vb8nw3ks6hd";
    const diagnostics = configDiagnostics(GOOD_BLOCK.replace("    ship-notes:", `    ${secretName}:`).replace("        reviewer:", `        ${secretName}a:`));
    expect(diagnostics.length).toBeGreaterThan(0);
    for (const item of diagnostics) {
      expect(`${item.keyPath} ${item.message}`).not.toContain(secretName);
    }
    expect(diagnostics.some((item) => item.keyPath?.includes("<name hidden>"))).toBe(true);
    expect(factoryConfigStateFieldProblems({ workflows: { [secretName]: { apiToken: "x" } } })).toEqual([
      expect.objectContaining({ path: "workflows.<name hidden>.apiToken" }),
    ]);
  });
});

describe("W30 R0 P2 re-check: no unit closes while its factory assignment is open", () => {
  /** A synced backlog with a ready workflow and an open assignment on W1 R0 P1 T2. The claim stays held. */
  function assignedTask(name: string) {
    const root = project(name);
    const writeFile = (relative: string, text: string) => {
      mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
      writeFileSync(path.join(root, relative), text);
    };
    writeFile(`${WORK_RECORD}/00-index.md`, WORK_INDEX);
    writeFile(`${WORK_RECORD}/01-first.md`, workPhase("- [ ] T1: Build the parser.\n- [ ] T2: Write the notes.\n"));
    expect(syncWorkFiles(root, { storeRoot: store, now: T0 }).conflicts).toEqual([]);
    const taskCheckoutId = getInstallationCheckoutId(root, store);
    const made = writeWorkStore(root, (db) => {
      const unit = listWorkUnits(db, PROJECT_ID).find((candidate) => candidate.coordinate === "W1 R0 P1 T2")!;
      saveBinding(db);
      const resolved = resolveFactoryPlan(planInput());
      const saved = saveFactoryPlanRevision(db, { projectId: PROJECT_ID, workflowName: "ship", plan: resolved.plan }, { now: T0 });
      saveFactoryProofResult(db, { projectId: PROJECT_ID, workflowName: "ship", outcome: "passed", testTask: "Test", planDigest: saved.revision.planDigest, path: ["builder"], manualSteps: [] }, { expectedVersion: null, now: T0 });
      markFactoryReadyRevision(db, PROJECT_ID, "ship", saved.revision.planDigest, { expectedVersion: 1 });
      const claimed = claimWorkUnit(db, { unitStoreId: unit.storeId, claimant: "foreman", taskHandle: "run-1", ttlSeconds: null, expectedVersion: unit.revision, takeover: null }, { now: T0 });
      if (claimed.result === "refused") throw new Error(claimed.refusal);
      const assignment = startFactoryAssignment(db, { projectId: PROJECT_ID, workflowName: "ship", checkoutId: taskCheckoutId, unitStoreId: unit.storeId, role: "builder", toolId: "tool-a", taskHandle: null, runId: "run-1", currentPlanDigest: saved.revision.planDigest }, { claimId: claimed.claim.claimId, now: T0 });
      return { unitStoreId: unit.storeId, claimId: claimed.claim.claimId, assignmentId: assignment.assignmentId };
    }, { storeRoot: store, now: T0 });
    const release = () => writeWorkStore(root, (db) => {
      expect(releaseWorkClaim(db, { unitStoreId: made.unitStoreId, claimId: made.claimId, expectedVersion: readWorkUnit(db, made.unitStoreId)!.revision }).accepted).toBe(true);
    }, { storeRoot: store, now: T0 });
    const unit = () => writeWorkStore(root, (db) => readWorkUnit(db, made.unitStoreId)!, { storeRoot: store, now: T0 });
    const assignment = () => writeWorkStore(root, (db) => readFactoryAssignment(db, PROJECT_ID, made.assignmentId)!, { storeRoot: store, now: T0 });
    return { root, writeFile, release, unit, assignment, ...made };
  }

  it("refuses work close while the assignment is open, and keeps the claim and the assignment", () => {
    const task = assignedTask("work-close");
    const result = workClose(task.root, { storeRoot: store, now: at(1) }, { unit: "W1 R0 P1 T2", claimId: task.claimId, outcome: "done", expectedVersion: task.unit().revision });
    expect(result).toMatchObject({ accepted: false, refusal: "factory-assignment-open" });
    expect(task.unit().status).not.toBe("closed");
    expect(task.assignment()).toMatchObject({ status: "offered" });
    // The holder can still update the assignment through the claim.
    writeWorkStore(task.root, (db) => {
      updateFactoryAssignment(db, PROJECT_ID, task.assignmentId, { status: "cancelled", reason: "stopped-by-person" }, { claimId: task.claimId, expectedVersion: 1, now: at(2) });
    }, { storeRoot: store, now: T0 });
    expect(workClose(task.root, { storeRoot: store, now: at(3) }, { unit: "W1 R0 P1 T2", claimId: task.claimId, outcome: "done", expectedVersion: task.unit().revision })).toMatchObject({ accepted: true });
  });

  it("stops a sync that closes the unit from its file; --keep-file refuses and --keep-store settles it", () => {
    const task = assignedTask("sync-close");
    task.release();
    const file = `${WORK_RECORD}/01-first.md`;
    task.writeFile(file, workPhase("- [ ] T1: Build the parser.\n- [x] T2: Write the notes.\n"));
    const stopped = syncWorkFiles(task.root, { storeRoot: store, now: at(1) });
    expect(stopped.conflicts).toEqual([expect.objectContaining({ path: file, reasons: ["A factory assignment is still open for W1 R0 P1 T2. Finish or cancel it first, then sync again."] })]);
    expect(task.unit().status).not.toBe("closed");
    const keepFile = () => syncWorkFiles(task.root, { storeRoot: store, now: at(2), settle: { targetPath: file, choice: "keep-file", expectedStoreRevision: null } });
    expect(keepFile).toThrow(WorkSettleRefusalError);
    expect(keepFile).toThrow(/factory assignment is still open for W1 R0 P1 T2/);
    expect(task.unit().status).not.toBe("closed");
    const settled = syncWorkFiles(task.root, { storeRoot: store, now: at(3), settle: { targetPath: file, choice: "keep-store", expectedStoreRevision: null } });
    expect(settled.settled).toBeTruthy();
    expect(readFileSync(path.join(task.root, file), "utf8")).toContain("- [ ] T2: Write the notes.");
    expect(syncWorkFiles(task.root, { storeRoot: store, now: at(4) }).conflicts).toEqual([]);
    expect(task.assignment()).toMatchObject({ status: "offered" });
  });

  it("refuses --accept-deletion of a deleted file while a unit in it has an open assignment", () => {
    const task = assignedTask("accept-deletion");
    task.release();
    const file = `${WORK_RECORD}/01-first.md`;
    rmSync(path.join(task.root, file));
    const stopped = syncWorkFiles(task.root, { storeRoot: store, now: at(1) });
    expect(stopped.conflicts.map((entry) => entry.path)).toContain(file);
    const accept = () => syncWorkFiles(task.root, { storeRoot: store, now: at(2), settle: { targetPath: file, choice: "accept-deletion", expectedStoreRevision: null } });
    expect(accept).toThrow(/factory assignment is still open for W1 R0 P1 T2/);
    expect(task.unit().status).not.toBe("closed");
    expect(task.assignment()).toMatchObject({ status: "offered" });
  });
});

describe("W30 R0 P2 owner decisions of 2026-11-23", () => {
  it("records the checkout of each assignment, and refuses a missing, unknown, or other project's checkout (decision 1)", () => {
    const ready = readyWorkflow("checkout");
    const other = path.join(temp, "other-checkout");
    mkdirSync(path.join(other, ".make-docs"), { recursive: true });
    writeFileSync(path.join(other, ".make-docs/config.yaml"), "projectId: another-project\n");
    const otherCheckout = getInstallationCheckoutId(other, store);
    write(ready, (db) => {
      expect(columns(db, "factory_assignments")).toContain("checkout_id");
      expect(refusal(() => start(ready, db, { checkoutId: "" })).refusal).toBe("invalid-record");
      expect(refusal(() => start(ready, db, { checkoutId: undefined as never })).refusal).toBe("invalid-record");
      expect(refusal(() => start(ready, db, { checkoutId: "no-such-checkout" })).refusal).toBe("checkout-not-bound");
      expect(refusal(() => start(ready, db, { checkoutId: otherCheckout })).refusal).toBe("checkout-not-bound");
      expect(db.prepare("SELECT count(*) AS n FROM factory_assignments").get()).toEqual({ n: 0 });
      expect(start(ready, db)).toMatchObject({ checkoutId: ready.checkoutId });
    });
  });

  it("keeps the channel kind and the integration owner in config only, and the copy reads them from the plan (decision 2)", () => {
    const ready = readyWorkflow("config-only");
    write(ready, (db) => {
      const bindingColumns = columns(db, "factory_workflow_bindings");
      expect(bindingColumns).not.toContain("integration_owner");
      expect(bindingColumns).not.toContain("channel_kind");
      expect(bindingColumns).toContain("channel_ref");
      const withOwner = resolveFactoryPlan(planInput({ definition: { ...DEFINITION, integrationOwner: "builder", humanChannel: "messaging-tool" } }));
      saveFactoryPlanRevision(db, { projectId: PROJECT_ID, workflowName: "ship", plan: withOwner.plan }, { now: T0 });
      writeFactoryCopies(db, ready.root, PROJECT_ID);
    });
    const copy = readFileSync(path.join(ready.root, FACTORY_COPIES_RELATIVE_PATH, factoryWorkflowCopyName("ship")), "utf8");
    expect(copy).toContain("- Human channel: messaging-tool.");
    expect(copy).toContain("- Integration owner: builder.");
  });

  it("counts a move from unknown to needs-correction as a round, and refuses one past the limit (decision 3)", () => {
    const ready = readyWorkflow("unknown-round");
    write(ready, (db) => {
      let assignment = move(ready, db, start(ready, db), "running", "tool-started");
      for (let round = 1; round <= 2; round++) {
        assignment = move(ready, db, assignment, "unknown", "handle-not-found");
        assignment = move(ready, db, assignment, "needs-correction", "defects-found");
        expect(assignment.roundCount).toBe(round);
        assignment = move(ready, db, assignment, "running", "correction-sent");
      }
      assignment = move(ready, db, assignment, "unknown", "handle-not-found");
      expect(refusal(() => move(ready, db, assignment, "needs-correction", "defects-found")).refusal).toBe("round-limit-reached");
    });
    expect(nextFactoryRoundCount("unknown", "needs-correction", 0)).toBe(1);
    expect(nextFactoryRoundCount("unknown", "running", 0)).toBe(0);
  });

  it("refuses a custom role with no context list, naming it, and hides a token-like name (decision 4)", () => {
    const custom = (name: string, context = "") => GOOD_BLOCK.replace("        reviewer:", `        ${name}:\n          job: Finds sources.\n          capabilities: [read-write-files]\n          returns: A source list.\n${context}        reviewer:`);
    const missing = configDiagnostics(custom("researcher"));
    expect(missing).toEqual([expect.objectContaining({ code: "invalid-factory-block", keyPath: "factory.workflows.ship-notes.roles.researcher.context" })]);
    expect(missing[0]!.message).toContain('The role "researcher" has no context list. A custom role must list its context kinds, for example [unit-record, requirements].');
    expect(configDiagnostics(custom("researcher", "          context: [unit-record, requirements]\n"))).toEqual([]);
    const secretName = "xq7lm2pz9rt4vb8nw3ks6hd";
    const hidden = configDiagnostics(custom(secretName));
    expect(hidden.map((item) => `${item.keyPath} ${item.message}`).join("\n")).not.toContain(secretName);
    // A token-like name is refused as a name first; the context message hides it too.
    expect(hidden.length).toBeGreaterThan(0);
    expect(factoryRoleNeedsContextMessage(secretName)).toBe('The role "<name hidden>" has no context list. A custom role must list its context kinds, for example [unit-record, requirements].');
    // builder and reviewer keep their contract defaults.
    expect(configDiagnostics(GOOD_BLOCK)).toEqual([]);
  });
});

describe("W30 R0 P2 owner decisions of 2026-11-23, second set", () => {
  it("counts returned or in-review -> unknown -> needs-correction, but not needs-correction -> unknown -> needs-correction", () => {
    const ready = readyWorkflow("unknown-before");
    write(ready, (db) => {
      let assignment = move(ready, db, start(ready, db), "running", "tool-started");
      // returned -> unknown -> needs-correction: one round.
      assignment = move(ready, db, assignment, "returned", "result-returned");
      assignment = move(ready, db, assignment, "unknown", "handle-not-found");
      assignment = move(ready, db, assignment, "needs-correction", "defects-found");
      expect(assignment.roundCount).toBe(1);
      // needs-correction -> unknown -> needs-correction: the round was already counted.
      assignment = move(ready, db, assignment, "unknown", "handle-not-found");
      assignment = move(ready, db, assignment, "needs-correction", "handle-checked");
      expect(assignment.roundCount).toBe(1);
      // in-review -> unknown -> needs-correction: one more round, which reaches the limit of 2.
      assignment = move(ready, db, assignment, "running", "correction-sent");
      assignment = move(ready, db, assignment, "returned", "result-returned");
      assignment = move(ready, db, assignment, "in-review", "sent-to-review");
      assignment = move(ready, db, assignment, "unknown", "handle-not-found");
      assignment = move(ready, db, assignment, "needs-correction", "defects-found");
      expect(assignment.roundCount).toBe(2);
      // At the limit, needs-correction -> unknown -> needs-correction is still allowed: it adds no round.
      assignment = move(ready, db, assignment, "unknown", "handle-not-found");
      expect(move(ready, db, assignment, "needs-correction", "handle-checked").roundCount).toBe(2);
    });
    expect(nextFactoryRoundCount("unknown", "needs-correction", 1, "needs-correction")).toBe(1);
    expect(nextFactoryRoundCount("unknown", "needs-correction", 1, "in-review")).toBe(2);
    expect(nextFactoryRoundCount("unknown", "needs-correction", 1, null)).toBe(2);
  });

  it("accepts a foreman and a front desk with no context list, and refuses only a custom role without one", () => {
    const standard = GOOD_BLOCK.replace("        reviewer:", [
      "        foreman:",
      "          job: Takes ready work and judges results.",
      "          capabilities: [read-write-files, launch-agent]",
      "          returns: Accepted units and escalations.",
      "        front-desk:",
      "          job: Talks to the person and adds quick items.",
      "          capabilities: [message-person, receive-answer]",
      "          returns: The unit and the person's answers.",
      "        reviewer:",
    ].join("\n"));
    expect(configDiagnostics(standard)).toEqual([]);
    const withCustom = standard.replace("        reviewer:", "        researcher:\n          job: Finds sources.\n          capabilities: [read-write-files]\n          returns: A source list.\n        reviewer:");
    expect(configDiagnostics(withCustom).map((item) => item.keyPath)).toEqual(["factory.workflows.ship-notes.roles.researcher.context"]);
  });
});
