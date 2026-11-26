import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runCli } from "../src/cli";
import { loadMakeDocsConfig } from "../src/config";
import { callMakeDocsMcpTool, MAKE_DOCS_MCP_TOOLS } from "../src/mcp/tools";
import { createExecutionContext, serializeOperationError } from "../src/operations/context";
import { getOperation, invokeOperation } from "../src/operations/registry";
import {
  BacklogReportRecordV1Schema,
  buildBacklogSnapshot,
  writeBacklogReviewCache,
  type BacklogSnapshotV1,
} from "../src/operations/work/backlog";
import { buildWorkEvidenceRecord } from "../src/operations/work";
import { renderProjectList } from "../src/run/root-operations";
import {
  attachLifecycleEvidence,
  createLifecycleRun,
  createPlaybookRunRecord,
  pruneProjectFromStore,
  transitionLifecycleRun,
  upsertProjectRegistryEntry,
  upsertWorkEvidence,
  withStoreDatabase,
} from "../src/store";
import { openStoreSqliteConnection } from "../src/store/database";
import {
  acquireInstallationLock,
  applyInstallationCheckoutMove,
  getInstallationCheckoutId,
  importInstallationState,
  previewInstallationCheckoutMove,
  readInstallationStatus,
  readProjectRegisterList,
  recordPlannedFileChange,
  recoverInstallationOperation,
  registerSeparateInstallationCheckout,
  releaseInstallationLock,
  removeInstallationManifest,
  saveInstallationManifest,
  sealInstallationOperation,
  withInstallationDatabase,
  withInstallationOperation,
} from "../src/store/installation-state";
import {
  listRegisteredProjects,
  ProjectIdIsOtherNameError,
  ProjectNameInvalidError,
  ProjectNameTakenError,
  projectNameProblem,
} from "../src/store/project-register";
import { storedRootMatches } from "../src/store/root-path-match";
import { STORE_TABLE_NAMES } from "../src/store/table-catalog";
import { runRecordedToolOperation } from "../src/store/tool-operations";
import { failHarnessSystemOperation, prepareHarnessSystemOperation } from "../src/store/harness-system-operations";
import { CODEX_HARNESS_ADAPTER, verifyMakeDocsExecutable } from "../src/harness-access";
import { defaultSelections, resolveInstallProfile } from "../src/profile";
import { createEmptySystemAssetManifestState } from "../src/system-assets";
import type { InstallManifest } from "../src/types";
import { platform } from "../src/platform";
import { applyGenericMcpSetup, prepareGenericMcpSetup } from "../src/generic-mcp-setup";
import { MCP_CONNECTION_ID_ENV, MCP_CONNECTION_KEY_ENV } from "../src/mcp-connection";
import { spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { parseDocument } from "yaml";
import { cleanupTempDir, createTempDir } from "./helpers";

/**
 * W32 R0 P3: the project register, name refusal, project prune, `project list`,
 * and one test for each row event of the W32 design that names the rows it
 * creates, updates, or removes (A11 to A14).
 */

const roots: string[] = [];
const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist/index.js");
const sha = (text: string) => createHash("sha256").update(text).digest("hex");

beforeEach(() => {
  // No test may reach the real Store. A call that forgets its Store root lands here.
  const guard = createTempDir("make-docs-w32-p3-guard-");
  roots.push(guard);
  vi.stubEnv("MAKE_DOCS_HOME", path.join(guard, "store"));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  while (roots.length) cleanupTempDir(roots.pop()!);
});

function base(prefix = "make-docs-w32-p3-"): string {
  const dir = createTempDir(prefix);
  roots.push(dir);
  return platform.describePath(dir).canonicalPath;
}

function newStore(parent: string): string {
  const store = path.join(parent, "store");
  vi.stubEnv("MAKE_DOCS_HOME", store);
  // Create the Store first, so each event shows only its own rows.
  withStoreDatabase(store, () => undefined);
  return store;
}

function project(parent: string, name: string, config?: Record<string, string>): string {
  const root = path.join(parent, name);
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  if (config) {
    writeFileSync(
      path.join(root, ".make-docs/config.yaml"),
      Object.entries(config).map(([key, value]) => `${key}: ${value}\n`).join(""),
    );
  }
  return platform.describePath(root).canonicalPath;
}

function setConfig(root: string, config: Record<string, string>): void {
  writeFileSync(
    path.join(root, ".make-docs/config.yaml"),
    Object.entries(config).map(([key, value]) => `${key}: ${value}\n`).join(""),
  );
}

type TableRows = Record<string, Map<string, string>>;

function json(value: unknown): string {
  return JSON.stringify(value, (_key, item) => (typeof item === "bigint" ? item.toString() : item));
}

/** Every row of every catalog table, keyed by its primary key. */
function storeRows(store: string): TableRows {
  const databasePath = path.join(store, "store.db");
  const result: TableRows = {};
  if (!existsSync(databasePath)) return result;
  const db = openStoreSqliteConnection(databasePath, { readOnly: true }, "read");
  try {
    for (const table of STORE_TABLE_NAMES) {
      const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string; pk: number }>;
      const key = columns.filter((column) => column.pk > 0).sort((a, b) => a.pk - b.pk).map((column) => column.name);
      const rows = db.prepare(`SELECT * FROM ${table}`).all() as Array<Record<string, unknown>>;
      result[table] = new Map(rows.map((row) => [key.length ? json(key.map((name) => row[name])) : json(row), json(row)]));
    }
  } finally {
    db.close();
  }
  return result;
}

type RowChange = { created?: number; updated?: number; removed?: number };

/** The rows that an event created, updated, or removed, by table. Unchanged tables are left out. */
function rowEvents(before: TableRows, after: TableRows): Record<string, RowChange> {
  const changes: Record<string, RowChange> = {};
  for (const table of STORE_TABLE_NAMES) {
    const old = before[table] ?? new Map<string, string>();
    const now = after[table] ?? new Map<string, string>();
    let created = 0;
    let updated = 0;
    let removed = 0;
    for (const [key, value] of now) {
      if (!old.has(key)) created += 1;
      else if (old.get(key) !== value) updated += 1;
    }
    for (const key of old.keys()) if (!now.has(key)) removed += 1;
    if (created || updated || removed) {
      changes[table] = { ...(created ? { created } : {}), ...(updated ? { updated } : {}), ...(removed ? { removed } : {}) };
    }
  }
  return changes;
}

function event<T>(store: string, run: () => T): { result: T; rows: Record<string, RowChange> } {
  const before = storeRows(store);
  const result = run();
  return { result, rows: rowEvents(before, storeRows(store)) };
}

async function asyncEvent<T>(store: string, run: () => Promise<T>): Promise<{ result: T; rows: Record<string, RowChange> }> {
  const before = storeRows(store);
  const result = await run();
  return { result, rows: rowEvents(before, storeRows(store)) };
}

function register(store: string): Array<{ project_id: string; project_name: string | null }> {
  const db = openStoreSqliteConnection(path.join(store, "store.db"), { readOnly: true }, "read");
  try {
    return db.prepare("SELECT project_id, project_name FROM project_register ORDER BY project_id").all() as Array<{ project_id: string; project_name: string | null }>;
  } finally {
    db.close();
  }
}

function manifestFor(root: string, projectId: string): InstallManifest {
  const profile = resolveInstallProfile(defaultSelections());
  writeFileSync(path.join(root, "owned.md"), "owned text");
  return {
    schemaVersion: 2, packageName: "@brucewaynedecoy/make-docs", packageVersion: "2.0.9",
    updatedAt: "2026-11-22T00:00:00.000Z", profileId: profile.profileId,
    selections: profile.selections, effectiveCapabilities: profile.effectiveCapabilities,
    systemAssetMaterialization: createEmptySystemAssetManifestState(),
    files: { "owned.md": { hash: sha("owned text"), sourceId: "provider:owned.md", ownershipClass: "managed-snapshot" } },
    skillFiles: [], projectId,
  };
}

/** A bound checkout with a ledger, made through the installation operation path. */
function installed(store: string, root: string, projectId: string): { checkoutId: string; manifest: InstallManifest } {
  const manifest = manifestFor(root, projectId);
  withInstallationOperation(root, "test.ledger", () => saveInstallationManifest(root, manifest), { storeRoot: store, projectId });
  return { checkoutId: getInstallationCheckoutId(root, store), manifest };
}

function workRecord(root: string): string {
  const wave = path.join(root, "docs/work/2042-06-01-w1-r0-wave");
  mkdirSync(wave, { recursive: true });
  writeFileSync(path.join(wave, "00-index.md"), `---\ntitle: "Wave"\nkind: "work"\nstatus: "active"\ncoordinate: "W1 R0"\n---\n\n# Wave\n\n## Phase Map\n\n| Phase | File |\n| --- | --- |\n| P1 | [Build](01-build.md) |\n`);
  writeFileSync(path.join(wave, "01-build.md"), `---\ntitle: "Phase 1: Build"\nkind: "work"\nstatus: "active"\ncoordinate: "W1 R0 P1"\n---\n\n# Build\n\n## Stage 1 - Build\n\n### Tasks\n\n- [ ] T1: Build it\n`);
  return path.join(wave, "01-build.md");
}

function fragments(snapshot: BacklogSnapshotV1) {
  return snapshot.records.map((record) => BacklogReportRecordV1Schema.parse({
    recordPath: record.recordPath, scope: record.scope, createdAt: record.createdAt, lastUpdatedAt: record.lastUpdatedAt,
    waveStatus: record.scope === "live" ? "current" : null, statusReason: "Current work",
    statusEvidence: [{ path: `${record.recordPath}/00-index.md`, line: 1, field: "status", commit: null }],
    facts: [{ class: "fact", text: "The work record is active.", evidence: [{ path: `${record.recordPath}/00-index.md`, line: 1, field: "status", commit: null }] }],
    inferences: [], recommendations: [],
  }));
}

const setupFlags = ["--yes", "--codex-method", "none", "--claude-code-method", "none", "--no-github-copilot", "--no-skills", "--project-resources", "none", "--json"];

async function cli(store: string, args: string[]): Promise<string> {
  vi.stubEnv("MAKE_DOCS_HOME", store);
  const output = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  try {
    await runCli(args);
    return output.mock.calls.map((call) => String(call[0])).join("");
  } finally {
    output.mockRestore();
  }
}

function spawnText(args: string[], store: string): string {
  const result = spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", env: { ...process.env, MAKE_DOCS_HOME: store } });
  if (result.status !== 0) throw new Error(`CLI failed: ${result.stderr || result.stdout}`);
  return result.stdout;
}

function spawnCli(args: string[], store: string): Record<string, any> {
  return JSON.parse(spawnText(args, store)) as Record<string, any>;
}

function caseInsensitiveVolume(dir: string): boolean {
  const probe = path.join(dir, "CaseProbe");
  mkdirSync(probe);
  return existsSync(path.join(dir, "caseprobe"));
}

describe("W32 R0 P3 row events (A11)", () => {
  it("Store create: writes only the schema journal and leaves the register empty", () => {
    const parent = base();
    const store = path.join(parent, "store");
    const { rows } = event(store, () => withStoreDatabase(store, () => undefined));
    // Schema journal rows for versions 3 to 9 (W30 R0 P2 added 9).
    expect(rows).toEqual({ store_schema_journal: { created: 7 } });
    expect(register(store)).toEqual([]);
  });

  it("setup and install apply: binds the checkout, writes the ledger and its operation, and creates the register row", async () => {
    const parent = base();
    const store = newStore(parent);
    const root = project(parent, "fresh");
    const { rows } = await asyncEvent(store, () => cli(store, ["setup", "--target", root, ...setupFlags]));
    expect(Object.keys(rows).sort()).toEqual([
      "installation_checkouts",
      "installation_ledgers",
      "installation_migration_records",
      "installation_operations",
      "installation_steps",
      "project_register",
    ]);
    expect(rows.installation_checkouts).toEqual({ created: 1 });
    expect(rows.installation_ledgers).toEqual({ created: 1 });
    expect(rows.project_register).toEqual({ created: 1 });
    const projectId = (readInstallationStatus(root, store) as { projectId: string }).projectId;
    // Setup writes the folder name as the name of a new project (R-ID-8), and the commit records it.
    expect(register(store)).toEqual([{ project_id: projectId, project_name: "fresh" }]);

    // A later setup records the config name on the same row (R-ID-8).
    const configPath = path.join(root, ".make-docs/config.yaml");
    const config = parseDocument(readFileSync(configPath, "utf8"));
    config.set("projectName", "fresh-docs");
    writeFileSync(configPath, config.toString());
    const again = await asyncEvent(store, () => cli(store, ["setup", "--target", root, ...setupFlags]));
    expect(again.rows.project_register).toEqual({ updated: 1 });
    expect(again.rows.installation_checkouts).toBeUndefined();
    expect(register(store)).toEqual([{ project_id: projectId, project_name: "fresh-docs" }]);
  }, 60_000);

  it("adoption: a clone adopted into a second Store gets its checkout, ledger, and register row", async () => {
    const parent = base();
    const storeA = path.join(parent, "store-a");
    const storeB = path.join(parent, "store-b");
    const projectA = project(parent, "project-a");
    expect(JSON.parse(await cli(storeA, ["setup", "--target", projectA, ...setupFlags])).status).toBe("complete");
    const other = project(parent, "other");
    expect(JSON.parse(await cli(storeB, ["setup", "--target", other, ...setupFlags])).status).toBe("complete");
    const projectB = path.join(parent, "project-b");
    cpSync(projectA, projectB, { recursive: true });
    const projectId = (readInstallationStatus(projectA, storeA) as { projectId: string }).projectId;
    const before = storeRows(storeB);
    const adopted = JSON.parse(await cli(storeB, ["setup", "--adopt", "--target", projectB, ...setupFlags]));
    expect(adopted.status, adopted.failedCondition).toBe("complete");
    const rows = rowEvents(before, storeRows(storeB));
    expect(rows.installation_checkouts).toEqual({ created: 1 });
    expect(rows.installation_ledgers).toEqual({ created: 1 });
    expect(rows.project_register).toEqual({ created: 1 });
    expect(rows.installation_operations?.created).toBeGreaterThan(0);
    expect(Object.keys(rows).filter((table) => !table.startsWith("installation_") && table !== "project_register")).toEqual([]);
    expect(register(storeB).map((row) => row.project_id)).toContain(projectId);
  }, 90_000);

  it("legacy import: binds the checkout, saves the records and the pending recovery, and creates the register row", () => {
    const parent = base();
    const store = newStore(parent);
    const root = project(parent, "legacy", { projectId: "legacy-project", projectName: "legacy-docs" });
    const { rows } = event(store, () => importInstallationState(root, {
      manifest: null,
      records: [{ kind: "receipt", id: `sha256:${"a".repeat(64)}`, value: { kept: true } }],
      importId: "w22-p5:legacy-import-1",
      sources: [{ relativePath: ".make-docs/manifest.json", digest: "a".repeat(64) }],
      recoveryRequired: true,
    }, store));
    expect(rows).toEqual({
      installation_checkouts: { created: 1 },
      installation_migration_records: { created: 2 },
      installation_operations: { created: 1 },
      project_register: { created: 1 },
    });
    expect(register(store)).toEqual([{ project_id: "legacy-project", project_name: "legacy-docs" }]);
  });

  it("checkout register: adds one checkout and refreshes the register row", () => {
    const parent = base();
    const store = newStore(parent);
    const root = project(parent, "source", { projectId: "shared-project" });
    installed(store, root, "shared-project");
    const second = path.join(parent, "second");
    cpSync(root, second, { recursive: true });
    const preview = previewInstallationCheckoutMove(second, undefined, store);
    expect(preview.separateReviewDigest).toMatch(/^[a-f0-9]{64}$/);
    const { rows } = event(store, () => registerSeparateInstallationCheckout(second, preview.separateReviewDigest!, store));
    expect(rows).toEqual({ installation_checkouts: { created: 1 }, project_register: { updated: 1 } });
  });

  it("checkout move: changes one checkout path, saves the move receipt, and refreshes the register row", () => {
    const parent = base();
    const store = newStore(parent);
    const root = project(parent, "before-move", { projectId: "moving-project" });
    const { checkoutId } = installed(store, root, "moving-project");
    const moved = path.join(parent, "after-move");
    renameSync(root, moved);
    const preview = previewInstallationCheckoutMove(moved, checkoutId, store);
    const candidate = preview.candidates.find((item) => item.checkoutId === checkoutId)!;
    expect(candidate.blockers).toEqual([]);
    const { rows } = event(store, () => applyInstallationCheckoutMove(moved, checkoutId, root, candidate.reviewDigest!, store));
    expect(rows).toEqual({
      installation_checkouts: { updated: 1 },
      installation_migration_records: { created: 1 },
      project_register: { updated: 1 },
    });
  });

  it("setup remove: removes the ledger, records its operation, and keeps the checkout and register row", () => {
    const parent = base();
    const store = newStore(parent);
    const root = project(parent, "removed", { projectId: "removed-project" });
    installed(store, root, "removed-project");
    const { rows } = event(store, () => withInstallationOperation(root, "setup.remove", () => removeInstallationManifest(root), { storeRoot: store }));
    expect(rows).toEqual({
      installation_ledgers: { removed: 1 },
      installation_operations: { created: 1 },
      project_register: { updated: 1 },
    });
  });

  it("tool update and uninstall: each writes one tool operation row and nothing for a project", async () => {
    const parent = base();
    const store = newStore(parent);
    const root = project(parent, "tool-host");
    for (const operation of ["tool.update", "tool.uninstall"] as const) {
      const { rows } = await asyncEvent(store, () => runRecordedToolOperation(root, store, operation, {
        manager: "npm", command: "npm install --global @brucewaynedecoy/make-docs", binaryPath: "/usr/local/bin/make-docs",
      }, async () => ({ exitCode: 0 })));
      expect(rows).toEqual({ tool_operations: { created: 1 } });
    }
  });

  it("machine harness setup: writes one tool operation row and nothing for a project", () => {
    const parent = base();
    const store = newStore(parent);
    const root = project(parent, "harness-host");
    const nativeRoot = path.join(parent, "home");
    mkdirSync(nativeRoot);
    const executable = verifyMakeDocsExecutable({
      executablePath: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist/index.js"),
    });
    const plan = CODEX_HARNESS_ADAPTER.plan({ method: "mcp", scope: "machine", root: nativeRoot, executable });
    const { rows } = event(store, () => {
      const pending = prepareHarnessSystemOperation({
        targetRoot: root, storeRoot: store, adapterId: CODEX_HARNESS_ADAPTER.id, harnessId: CODEX_HARNESS_ADAPTER.harnessId,
        plan, appliedVersion: executable.packageVersion, verifiedAt: "2026-11-22T00:00:00.000Z",
      });
      failHarnessSystemOperation(root, store, pending, { reason: "The test stops before native writes.", changeOutcome: "none" });
    });
    expect(rows).toEqual({ tool_operations: { created: 1 } });
  });

  it("project recover: closes the failed operation, restores its ledger, and refreshes the register row", () => {
    const parent = base();
    const store = newStore(parent);
    const root = project(parent, "recovered", { projectId: "recovered-project" });
    installed(store, root, "recovered-project");
    expect(() => withInstallationOperation(root, "test.change", () => { throw new Error("stop"); }, { storeRoot: store })).toThrow(/Failed operation/);
    const operationId = withInstallationDatabase(root, (db) => (db.prepare("SELECT operation_id FROM installation_operations WHERE status='failed'").get() as { operation_id: string }).operation_id, { storeRoot: store, readOnly: true });
    const { result, rows } = event(store, () => recoverInstallationOperation(root, operationId, "rollback", false, store));
    expect(result.status).toBe("rolled-back");
    expect(rows).toEqual({
      installation_ledgers: { updated: 1 },
      installation_operations: { updated: 1 },
      project_register: { updated: 1 },
    });
  });

  it("lifecycle start, change, and evidence: write the lifecycle rows and the register row together", async () => {
    const parent = base();
    const store = newStore(parent);
    const root = project(parent, "lifecycle", { projectId: "lifecycle-project", projectName: "lifecycle-docs" });
    const times = ["2026-11-22T00:00:00.000Z", "2026-11-22T00:01:00.000Z", "2026-11-22T00:02:00.000Z"];
    const context = () => createExecutionContext({ surface: "test", writesAllowed: true, now: () => times[0]! });
    const input = { repoRoot: root, storeRoot: store, runId: "run-1" };
    const start = await asyncEvent(store, () => invokeOperation("lifecycle.start", { ...input, lifecycleStage: "work" }, context()));
    expect(start.rows).toEqual({ runs: { created: 1 }, project_register: { created: 1 } });
    expect(register(store)).toEqual([{ project_id: "lifecycle-project", project_name: "lifecycle-docs" }]);
    times.shift();
    const change = await asyncEvent(store, () => invokeOperation("lifecycle.pause", { ...input, expectedVersion: 1 }, context()));
    expect(change.rows).toEqual({ runs: { updated: 1 }, project_register: { updated: 1 } });
    times.shift();
    const evidence = await asyncEvent(store, () => invokeOperation("lifecycle.attach-evidence", {
      ...input, expectedVersion: 2, evidenceId: "evidence-1", evidenceKind: "test-report", projectPath: "docs/assets/report.json",
    }, context()));
    expect(evidence.rows).toEqual({ run_evidence: { created: 1 }, runs: { updated: 1 }, project_register: { updated: 1 } });

    // A taken name stops the lifecycle write and leaves no lifecycle row.
    const other = project(parent, "other", { projectId: "other-project", projectName: "lifecycle-docs" });
    const before = storeRows(store);
    const refused = await invokeOperation("lifecycle.start", { repoRoot: other, storeRoot: store, runId: "run-2", lifecycleStage: "work" }, context())
      .then(() => null, (error: unknown) => error);
    expect(serializeOperationError(refused).code).toBe("project-name-taken");
    expect(rowEvents(before, storeRows(store))).toEqual({});
  });

  it("Store lifecycle functions without a project root write only lifecycle rows", () => {
    const parent = base();
    const store = newStore(parent);
    const start = event(store, () => withStoreDatabase(store, (db) => createLifecycleRun(db, {
      projectId: "lifecycle-project", runId: "run-1", lifecycleStage: "work", committedAt: "2026-11-22T00:00:00.000Z",
    })));
    expect(start.rows).toEqual({ runs: { created: 1 } });
    const change = event(store, () => withStoreDatabase(store, (db) => transitionLifecycleRun(db, {
      operation: "lifecycle.pause", projectId: "lifecycle-project", runId: "run-1", expectedVersion: 1,
      nextStatus: "paused", committedAt: "2026-11-22T00:01:00.000Z",
    })));
    expect(change.rows).toEqual({ runs: { updated: 1 } });
    const evidence = event(store, () => withStoreDatabase(store, (db) => attachLifecycleEvidence(db, {
      projectId: "lifecycle-project", runId: "run-1", expectedVersion: 2, evidenceId: "evidence-1",
      evidenceKind: "test-report", referenceType: "project-path", reference: "docs/assets/report.json",
      digest: `sha256:${"a".repeat(64)}`, committedAt: "2026-11-22T00:02:00.000Z",
    })));
    expect(evidence.rows).toEqual({ run_evidence: { created: 1 }, runs: { updated: 1 } });
  });

  it("work evidence record: writes the evidence row and the register row together", () => {
    const parent = base();
    const store = newStore(parent);
    const root = project(parent, "evidence", { projectId: "evidence-project", projectName: "evidence-docs" });
    const phase = workRecord(root);
    const { rows } = event(store, () => buildWorkEvidenceRecord({
      target: phase, repoRoot: root, storeRoot: store, evidenceKind: "validation", payload: { status: "passed" },
    }));
    expect(rows).toEqual({ work_evidence: { created: 1 }, project_register: { created: 1 } });
    expect(register(store)).toEqual([{ project_id: "evidence-project", project_name: "evidence-docs" }]);
  });

  it("backlog cache write: binds the checkout, writes the cache rows, and creates the register row", () => {
    const parent = base();
    const store = newStore(parent);
    const root = project(parent, "backlog", { projectId: "backlog-project" });
    workRecord(root);
    const snapshot = buildBacklogSnapshot(root);
    const { rows } = event(store, () => writeBacklogReviewCache(root, snapshot, fragments(snapshot), store));
    expect(rows).toEqual({
      installation_checkouts: { created: 1 },
      backlog_review_cache: { created: 1 },
      project_register: { created: 1 },
    });
  });

  it("project prune: removes only the project's current rows, keeps playbook_runs and the legacy table, and counts the register", () => {
    const parent = base();
    const store = newStore(parent);
    const root = project(parent, "pruned", { projectId: "pruned-project" });
    installed(store, root, "pruned-project");
    const other = project(parent, "kept", { projectId: "kept-project" });
    installed(store, other, "kept-project");
    withStoreDatabase(store, (db) => {
      for (const projectId of ["pruned-project", "kept-project"]) {
        upsertWorkEvidence(db, { projectId, waveSlug: "w1-r0", phasePath: "docs/work/x/01.md", evidenceKind: "validation", payload: { ok: true } });
        createLifecycleRun(db, { projectId, runId: "run-1", lifecycleStage: "work", committedAt: "2026-11-22T00:00:00.000Z" });
        attachLifecycleEvidence(db, {
          projectId, runId: "run-1", expectedVersion: 1, evidenceId: "e-1", evidenceKind: "test-report",
          referenceType: "project-path", reference: "docs/assets/r.json", digest: `sha256:${"b".repeat(64)}`, committedAt: "2026-11-22T00:01:00.000Z",
        });
        createPlaybookRunRecord(db, { projectId, runId: "legacy-run", record: { opaque: true } });
        upsertProjectRegistryEntry(db, { projectId, rootPath: "/legacy/path" });
      }
    });
    const { result, rows } = event(store, () => pruneProjectFromStore({ repoRoot: root, storeRoot: store }));
    expect(rows).toEqual({ run_evidence: { removed: 1 }, runs: { removed: 1 }, work_evidence: { removed: 1 } });
    expect(result).toMatchObject({
      status: "pruned", projectId: "pruned-project", remainingProjects: 1, registerRowKept: true,
      removed: { run_evidence: 1, runs: 1, work_evidence: 1, project_register: 0 },
    });
  });

  it("project prune: removes the register row once no checkout of the project is bound", () => {
    const parent = base();
    const store = newStore(parent);
    const root = project(parent, "evidence-only", { projectId: "evidence-only" });
    buildWorkEvidenceRecord({ target: workRecord(root), repoRoot: root, storeRoot: store, evidenceKind: "validation", payload: { ok: true } });
    const { result, rows } = event(store, () => pruneProjectFromStore({ repoRoot: root, storeRoot: store }));
    expect(rows).toEqual({ work_evidence: { removed: 1 }, project_register: { removed: 1 } });
    expect(result).toMatchObject({ remainingProjects: 0, registerRowKept: false });
  });
});

describe("W32 R0 P3 project names (A12)", () => {
  it("refuses a name that another project holds, names that project, and changes no row", () => {
    const parent = base();
    const store = newStore(parent);
    const alpha = project(parent, "alpha", { projectId: "alpha-project", projectName: "docs" });
    installed(store, alpha, "alpha-project");
    const beta = project(parent, "beta", { projectId: "beta-project", projectName: "docs" });
    const before = storeRows(store);
    let refused: unknown;
    try {
      withInstallationOperation(beta, "test.ledger", () => undefined, { storeRoot: store });
    } catch (error) {
      refused = error;
    }
    expect(refused).toBeInstanceOf(ProjectNameTakenError);
    const serialized = serializeOperationError(refused);
    expect(serialized.code).toBe("project-name-taken");
    expect(serialized.message).toContain("alpha-project");
    expect(serialized.message).toContain(alpha);
    expect(serialized.details).toMatchObject({ projectName: "docs", holderProjectId: "alpha-project", holderCheckouts: [alpha] });
    expect(rowEvents(before, storeRows(store))).toEqual({});

    // Work evidence and the backlog cache refuse the same name and leave no row.
    const phase = workRecord(beta);
    const evidenceBefore = storeRows(store);
    expect(() => buildWorkEvidenceRecord({ target: phase, repoRoot: beta, storeRoot: store, evidenceKind: "validation", payload: {} })).toThrow(ProjectNameTakenError);
    expect(rowEvents(evidenceBefore, storeRows(store))).toEqual({});
    const snapshot = buildBacklogSnapshot(beta);
    expect(() => writeBacklogReviewCache(beta, snapshot, fragments(snapshot), store)).toThrow(ProjectNameTakenError);
    expect(register(store)).toEqual([{ project_id: "alpha-project", project_name: "docs" }]);
  });

  it("records a changed name at the next write, and the old name is free again", () => {
    const parent = base();
    const store = newStore(parent);
    const alpha = project(parent, "alpha", { projectId: "alpha-project", projectName: "docs" });
    installed(store, alpha, "alpha-project");
    setConfig(alpha, { projectId: "alpha-project", projectName: "alpha-docs" });
    withInstallationOperation(alpha, "test.touch", () => undefined, { storeRoot: store });
    const beta = project(parent, "beta", { projectId: "beta-project", projectName: "docs" });
    withInstallationOperation(beta, "test.touch", () => undefined, { storeRoot: store });
    expect(register(store)).toEqual([
      { project_id: "alpha-project", project_name: "alpha-docs" },
      { project_id: "beta-project", project_name: "docs" },
    ]);
    // Removing projectName clears the recorded name.
    setConfig(beta, { projectId: "beta-project" });
    withInstallationOperation(beta, "test.touch", () => undefined, { storeRoot: store });
    expect(register(store)[1]).toEqual({ project_id: "beta-project", project_name: null });
  });

  function failedOperation(store: string, root: string, seal: boolean): string {
    expect(() => withInstallationOperation(root, "test.change", () => {
      recordPlannedFileChange(root, "notes.md", { kind: "file", content: "new notes\n" }, () => writeFileSync(path.join(root, "notes.md"), "new notes\n"));
      if (seal) sealInstallationOperation(root);
      throw new Error("stop");
    }, { storeRoot: store })).toThrow(/Failed operation/);
    return withInstallationDatabase(root, (db) => (db.prepare("SELECT operation_id FROM installation_operations WHERE status='failed'").get() as { operation_id: string }).operation_id, { storeRoot: store, readOnly: true });
  }

  for (const mode of ["rollback", "resume"] as const) {
    it(`a ${mode} finishes when the config name now clashes, keeps the stored name, and reports it`, () => {
      const parent = base();
      const store = newStore(parent);
      const alpha = project(parent, "alpha", { projectId: "alpha-project", projectName: "docs" });
      installed(store, alpha, "alpha-project");
      const beta = project(parent, "beta", { projectId: "beta-project", projectName: "beta-docs" });
      installed(store, beta, "beta-project");
      const operationId = failedOperation(store, beta, mode === "resume");
      setConfig(beta, { projectId: "beta-project", projectName: "docs" });
      const result = recoverInstallationOperation(beta, operationId, mode, false, store) as Record<string, any>;
      expect(result.status).toBe(mode === "resume" ? "completed" : "rolled-back");
      expect(result.projectNameConflict).toMatchObject({ code: "project-name-taken", keptName: "beta-docs" });
      expect(result.projectNameConflict.reason).toContain("alpha-project");
      expect(existsSync(path.join(beta, "notes.md"))).toBe(mode === "resume");
      expect(withInstallationDatabase(beta, (db) => (db.prepare("SELECT status FROM installation_operations WHERE operation_id=?").get(operationId) as { status: string }).status, { storeRoot: store, readOnly: true }))
        .toBe(mode === "resume" ? "completed" : "rolled-back");
      expect(register(store)).toEqual([
        { project_id: "alpha-project", project_name: "docs" },
        { project_id: "beta-project", project_name: "beta-docs" },
      ]);
    });
  }

  it("a name changed during a running operation does not block its commit; the next start refuses it", () => {
    const parent = base();
    const store = newStore(parent);
    const alpha = project(parent, "alpha", { projectId: "alpha-project", projectName: "docs" });
    installed(store, alpha, "alpha-project");
    const beta = project(parent, "beta", { projectId: "beta-project" });
    installed(store, beta, "beta-project");
    withInstallationOperation(beta, "test.change", () => setConfig(beta, { projectId: "beta-project", projectName: "docs" }), { storeRoot: store });
    expect(withInstallationDatabase(beta, (db) => db.prepare("SELECT status FROM installation_operations WHERE operation='test.change'").get(), { storeRoot: store, readOnly: true }))
      .toEqual({ status: "completed" });
    expect(register(store)[1]).toEqual({ project_id: "beta-project", project_name: null });
    expect(() => withInstallationOperation(beta, "test.touch", () => undefined, { storeRoot: store })).toThrow(ProjectNameTakenError);
  });

  it("refuses a write whose project ID is another project's name", () => {
    const parent = base();
    const store = newStore(parent);
    const alpha = project(parent, "alpha", { projectId: "alpha-project", projectName: "gamma-project" });
    installed(store, alpha, "alpha-project");
    const gamma = project(parent, "gamma", { projectId: "gamma-project" });
    const before = storeRows(store);
    let refused: unknown;
    try {
      withInstallationOperation(gamma, "test.touch", () => undefined, { storeRoot: store });
    } catch (error) {
      refused = error;
    }
    expect(refused).toBeInstanceOf(ProjectIdIsOtherNameError);
    expect(serializeOperationError(refused)).toMatchObject({ code: "project-id-is-other-name", details: { projectId: "gamma-project", holderProjectId: "alpha-project", holderCheckouts: [alpha] } });
    expect(rowEvents(before, storeRows(store))).toEqual({});
  });

  it("refuses a name in the wrong form or one that is another project's ID", () => {
    expect(projectNameProblem("docs-2")).toBeNull();
    expect(projectNameProblem("a".repeat(64))).toBeNull();
    expect(projectNameProblem("a".repeat(65))).toMatch(/1 to 64/);
    expect(projectNameProblem("Docs")).toMatch(/lower-case/);
    expect(projectNameProblem("2docs")).toMatch(/start with a letter/);
    expect(projectNameProblem("docs_site")).toMatch(/lower-case/);
    expect(projectNameProblem("abcdef01-2345-6789-abcd-ef0123456789")).toMatch(/project ID/);

    const parent = base();
    const store = newStore(parent);
    const bad = project(parent, "bad", { projectId: "bad-project", projectName: "Bad_Name" });
    expect(loadMakeDocsConfig(bad).diagnostics.map((item) => item.code)).toEqual(["invalid-project-name"]);
    expect(() => withInstallationOperation(bad, "test.touch", () => undefined, { storeRoot: store })).toThrow(ProjectNameInvalidError);

    const alpha = project(parent, "alpha", { projectId: "alpha-project" });
    installed(store, alpha, "alpha-project");
    const clash = project(parent, "clash", { projectId: "clash-project", projectName: "alpha-project" });
    expect(() => withInstallationOperation(clash, "test.touch", () => undefined, { storeRoot: store })).toThrow(/project ID of another project/);
    // A project may use its own ID as its name.
    const own = project(parent, "own", { projectId: "own-project", projectName: "own-project" });
    withInstallationOperation(own, "test.touch", () => undefined, { storeRoot: store });
    expect(register(store).find((row) => row.project_id === "own-project")?.project_name).toBe("own-project");
    expect(register(store).map((row) => row.project_id)).not.toContain("bad-project");
  });
});

describe("W32 R0 P3 project list (A14)", () => {
  function fixtureStore() {
    const parent = base();
    const store = newStore(parent);
    const named = project(parent, "named", { projectId: "named-project", projectName: "handbook" });
    installed(store, named, "named-project");
    const gone = project(parent, "gone", { projectId: "gone-project" });
    installed(store, gone, "gone-project");
    renameSync(gone, path.join(parent, "gone-elsewhere"));
    // A checkout bound before schema v7 has no register row until its next Store write.
    const unregistered = project(parent, "unregistered", { projectId: "unregistered-project" });
    getInstallationCheckoutId(unregistered, store);
    withInstallationDatabase(unregistered, (db) => db.prepare("DELETE FROM project_register WHERE project_id='unregistered-project'").run(), { storeRoot: store });
    return { parent, store, named, gone, unregistered };
  }

  it("lists each project by name first, with ID, checkouts, last seen time, and missing folders in plain words", () => {
    const { store, named, gone, unregistered } = fixtureStore();
    const before = storeRows(store);
    const list = readProjectRegisterList(named, store);
    expect(rowEvents(before, storeRows(store))).toEqual({});
    expect(list.projects.map((entry) => [entry.name, entry.projectId, entry.registered])).toEqual([
      ["handbook", "named-project", true],
      [null, "gone-project", true],
      [null, "unregistered-project", false],
    ]);
    expect(list.projects[1]).toMatchObject({ missingCheckouts: [gone], checkouts: [{ rootPath: gone, folder: "missing", folderNote: "The folder is missing. It was moved or deleted." }] });
    expect(list.projects[2]).toMatchObject({ lastSeenAt: null, checkouts: [{ rootPath: unregistered, folder: "present" }] });
    expect(list.counts).toEqual({ projects: 3, checkouts: 3, missingCheckouts: 1, unregistered: 1 });
    expect(list.summary).toBe("The Store knows 3 projects with 3 checkouts. 1 checkout folder is missing.");
    const text = renderProjectList(list);
    expect(text.split("\n").slice(0, 3)).toEqual(["The Store knows 3 projects with 3 checkouts. 1 checkout folder is missing.", "", "handbook"]);
    expect(text).toContain(`    ${gone}\n      The folder is missing. It was moved or deleted.`);
    expect(text).toContain("  Last seen: not recorded yet. The next Make Docs write for this project records it.");
  });

  it("gives the same result through the CLI and MCP, reads only, and returns the typed Store outcomes", async () => {
    const parent = base();
    const store = path.join(parent, "store");
    const named = project(parent, "named");
    const genericPlan = prepareGenericMcpSetup({ clientLabel: "p3-list", storeRoot: store, executable: verifyMakeDocsExecutable({ executablePath: CLI }) });
    const connection = (genericPlan.configuration as { mcpServers: { "make-docs": { env: Record<string, string> } } }).mcpServers["make-docs"].env;
    applyGenericMcpSetup(genericPlan);
    expect(spawnCli(["setup", "--target", named, "--yes", "--no-codex", "--no-claude-code", "--no-skills", "--generic-mcp-client", "p3-list", "--json"], store).status).toBe("complete");
    vi.stubEnv("MAKE_DOCS_HOME", store);
    vi.stubEnv(MCP_CONNECTION_ID_ENV, connection.MAKE_DOCS_MCP_CONNECTION_ID);
    vi.stubEnv(MCP_CONNECTION_KEY_ENV, connection.MAKE_DOCS_MCP_CONNECTION_KEY);
    const gone = project(parent, "gone", { projectId: "gone-project", projectName: "old-notes" });
    installed(store, gone, "gone-project");
    renameSync(gone, path.join(parent, "gone-elsewhere"));

    const before = storeRows(store);
    const cliValue = spawnCli(["project", "list", "--target-root", named, "--json"], store);
    const mcp = await callMakeDocsMcpTool("project_list", { targetRoot: named });
    expect(mcp).toMatchObject({ operation: "project.register.list" });
    expect(mcp.result).toEqual(cliValue);
    expect(rowEvents(before, storeRows(store))).toEqual({});
    expect(cliValue.projects.map((entry: { name: string | null }) => entry.name)).toEqual(["named", "old-notes"]);
    expect(cliValue.projects[1].checkouts[0]).toMatchObject({ rootPath: gone, folder: "missing", folderNote: "The folder is missing. It was moved or deleted." });
    const text = spawnText(["project", "list", "--target-root", named], store);
    expect(text).toContain("old-notes\n  Project ID: gone-project");
    expect(text).toContain(`    ${gone}\n      The folder is missing. It was moved or deleted.`);

    // R-STORE-CMD-5: the existing typed Store outcomes. A missing Store gives
    // `store-unavailable` through the CLI and `store-denied` through MCP.
    const missingCli = spawnSync(process.execPath, [CLI, "project", "list", "--target-root", named, "--json"], { encoding: "utf8", env: { ...process.env, MAKE_DOCS_HOME: path.join(parent, "missing-store") } });
    expect(missingCli.status).toBe(1);
    expect(JSON.parse(missingCli.stdout || missingCli.stderr)).toMatchObject({ ok: false, code: "store-unavailable", operation: "project.register.list" });
    vi.stubEnv("MAKE_DOCS_HOME", path.join(parent, "missing-store"));
    await expect(callMakeDocsMcpTool("project_list", { targetRoot: named })).rejects.toMatchObject({ code: "store-denied" });
    expect(existsSync(path.join(parent, "missing-store"))).toBe(false);
    const unsafe = path.join(parent, "unsafe-store");
    cpSync(store, unsafe, { recursive: true });
    const raw = new DatabaseSync(path.join(unsafe, "store.db"));
    raw.exec("PRAGMA user_version=999");
    raw.close();
    vi.stubEnv("MAKE_DOCS_HOME", unsafe);
    await expect(callMakeDocsMcpTool("project_list", { targetRoot: named })).rejects.toMatchObject({ code: "store-unsafe" });
    const other = project(parent, "unconfigured");
    vi.stubEnv("MAKE_DOCS_HOME", store);
    await expect(callMakeDocsMcpTool("project_list", { targetRoot: other })).rejects.toMatchObject({ code: "store-not-configured" });
  }, 120_000);

  it("is registered as a read-only core and all tool named project_list", async () => {
    const definition = getOperation("project.register.list");
    expect(definition).toMatchObject({ mutates: "read", status: "active", access: { store: "read", project: "read", hostConfig: "none" } });
    expect(definition.mcp?.profiles).toEqual(["core"]);
    const tool = MAKE_DOCS_MCP_TOOLS.find((candidate) => candidate.name === "project_list");
    expect(tool).toBeDefined();
    const parent = base();
    const store = path.join(parent, "absent-store");
    const root = project(parent, "lonely");
    const error = await invokeOperation("project.register.list", { targetRoot: root }, createExecutionContext({
      surface: "cli", route: "direct-cli", writesAllowed: false, storeRoot: store,
    })).then(() => null, (failure: unknown) => failure);
    expect(serializeOperationError(error).code).toMatch(/^store-(not-configured|unavailable|unsafe|denied)$/);
    expect(existsSync(path.join(store, "store.db"))).toBe(false);
  });

  it("an empty Store lists no projects", () => {
    const parent = base();
    const store = newStore(parent);
    const db = openStoreSqliteConnection(path.join(store, "store.db"), { readOnly: true }, "read");
    try {
      expect(listRegisteredProjects(db)).toMatchObject({ projects: [], summary: "The Store knows no projects yet." });
    } finally {
      db.close();
    }
  });
});

describe("W32 R0 P3 root_path comparison (P2 follow-up)", () => {
  it("matches a stored spelling by the platform key and keeps doubt safe", () => {
    const parent = base();
    expect(storedRootMatches(parent, parent)).toBe(true);
    expect(storedRootMatches(path.join(parent, "other"), parent)).toBe(false);
    expect(storedRootMatches("/stored/spelling", parent, platform.comparisonKey(parent))).toBe(true);
  });

  it("treats a case-renamed checkout's own work as its own, and its old lock and pending work as guarding it", () => {
    const parent = base();
    if (!caseInsensitiveVolume(parent)) return; // Only a case-insensitive volume can rename by case alone.
    const store = newStore(parent);
    const upper = project(parent, "CaseProject", { projectId: "case-project" });
    const { manifest } = installed(store, upper, "case-project");
    const lower = path.join(parent, "caseproject");
    renameSync(upper, `${upper}-tmp`);
    renameSync(`${upper}-tmp`, lower);
    const root = platform.describePath(lower).canonicalPath;
    expect(root).toBe(lower);
    const stored = withInstallationDatabase(root, (db) => (db.prepare("SELECT root_path FROM installation_checkouts").get() as { root_path: string }).root_path, { storeRoot: store, readOnly: true });
    expect(stored).toBe(upper);

    // Own pending work is not another checkout's claim (installation-state.ts pending path claims).
    withInstallationOperation(root, "test.ledger", () => saveInstallationManifest(root, { ...manifest, updatedAt: "2026-11-22T01:00:00.000Z" }), { storeRoot: store, projectId: "case-project" });

    // A dead lock saved under the old spelling still guards the folder.
    withInstallationDatabase(root, (db) => db.prepare("INSERT INTO installation_locks VALUES (?,?,?,?,?)").run(upper, "old-token", 999_999_999, platform.hostname, "2026-11-22T00:00:00.000Z"), { storeRoot: store });
    expect(() => acquireInstallationLock(root, store)).toThrow(/stopped|cannot verify/);
    expect(readInstallationStatus(root, store).nextAction).toBe("Wait for the active writer.");

    // A failed operation on the old spelling blocks machine setup for the new spelling.
    withInstallationDatabase(root, (db) => db.prepare("DELETE FROM installation_locks WHERE root_path=?").run(upper), { storeRoot: store });
    expect(() => withInstallationOperation(root, "test.change", () => { throw new Error("stop"); }, { storeRoot: store })).toThrow(/Failed operation/);
    const nativeRoot = path.join(parent, "home");
    mkdirSync(nativeRoot);
    const executable = verifyMakeDocsExecutable({ executablePath: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist/index.js") });
    const plan = CODEX_HARNESS_ADAPTER.plan({ method: "mcp", scope: "machine", root: nativeRoot, executable });
    expect(() => prepareHarnessSystemOperation({
      targetRoot: root, storeRoot: store, adapterId: CODEX_HARNESS_ADAPTER.id, harnessId: CODEX_HARNESS_ADAPTER.harnessId,
      plan, appliedVersion: executable.packageVersion, verifiedAt: "2026-11-22T00:00:00.000Z",
    })).toThrow(/already pending/);
    const lock = acquireInstallationLock(root, store);
    releaseInstallationLock(lock);
    expect(os.platform()).toBeTruthy();
  });
});
