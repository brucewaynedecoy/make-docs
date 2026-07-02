import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __setLifecycleRendererForTests,
  type LifecycleRenderer,
} from "../src/lifecycle-ui";
import { loadManifest } from "../src/manifest";
import {
  CURRENT_STORE_SCHEMA_VERSION,
  GLOBAL_CONFIG_FILE,
  GLOBAL_MANIFEST_FILE,
  STORE_DATABASE_FILE,
  bootstrapGlobalStore,
  getStoreDatabasePath,
  listPlaybookRunRecords,
  listProjectRegistryEntries,
  listWorkEvidence,
  loadSqliteDriver,
  pruneProjectFromStore,
  readProjectRegistryEntry,
  readUserVersion,
  removeGlobalStore,
  upsertPlaybookRunRecord,
  upsertProjectRegistryEntry,
  upsertWorkEvidence,
  withStoreDatabase,
} from "../src/store";
import { runUninstallCommand } from "../src/uninstall";
import {
  cleanupTempDir,
  createTempDir,
  installMakeDocsTarget,
  mockHomeDirectory,
  writeMinimalManifest,
} from "./helpers";

const CLI_SRC_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
);

const driver = loadSqliteDriver();
const sqliteAvailable = driver.available;

/**
 * Seeds one project's rows across all three project-scoped tables so pruning
 * tests can prove exact-one-project row deletion (R-LIFE-2, R-TEST-4).
 */
function seedProjectRows(storeRoot: string, projectId: string, rootPath: string): void {
  withStoreDatabase(storeRoot, (db) => {
    upsertProjectRegistryEntry(db, {
      projectId,
      rootPath,
      packageName: "make-docs-test",
      packageVersion: "0.0.0-test",
    });
    upsertPlaybookRunRecord(db, {
      projectId,
      runId: `${projectId}-run-1`,
      record: { status: "created" },
    });
    upsertWorkEvidence(db, {
      projectId,
      waveSlug: "2026-07-01-w18-r10-global-store-and-project-state",
      phasePath: "docs/work/2026-07-01-w18-r10-global-store-and-project-state/04-lifecycle-and-privacy.md",
      evidenceKind: "validation",
      payload: { status: "passed" },
      repoRoot: rootPath,
    });
  });
}

function readAllProjectRows(storeRoot: string, projectId: string) {
  return withStoreDatabase(storeRoot, (db) => ({
    registry: readProjectRegistryEntry(db, projectId),
    runs: listPlaybookRunRecords(db, projectId),
    evidence: listWorkEvidence(db, { projectId }),
  }));
}

function createApprovingLifecycleRenderer(): LifecycleRenderer {
  return {
    beginWorkflow() {},
    renderBackupAuditSummary() {},
    async confirmBackupRun() {
      return true;
    },
    renderBackupNoopSummary() {},
    renderBackupCancelled() {},
    renderBackupCompletionSummary() {},
    renderUninstallWarning() {},
    async confirmUninstallWarning() {
      return true;
    },
    renderUninstallAuditSummary() {},
    async confirmUninstallRun() {
      return true;
    },
    renderUninstallCancelled() {},
    renderUninstallCompletionSummary() {},
    renderUninstallFailureSummary() {},
  };
}

async function captureUninstall(
  options: Parameters<typeof runUninstallCommand>[0],
) {
  const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  try {
    const result = await runUninstallCommand(options);
    const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
    return { result, output };
  } finally {
    writeSpy.mockRestore();
  }
}

describe("pruneProjectFromStore (R-LIFE-2)", () => {
  let workDir: string;
  let storeRoot: string;

  beforeEach(() => {
    workDir = createTempDir("make-docs-store-lifecycle-");
    storeRoot = path.join(workDir, "store-root");
  });

  afterEach(() => {
    cleanupTempDir(workDir);
  });

  it("prunes exactly one project's rows across every table, leaving other projects untouched", () => {
    if (!sqliteAvailable) {
      return;
    }

    const repoA = path.join(workDir, "repo-a");
    const repoB = path.join(workDir, "repo-b");
    mkdirSync(repoA, { recursive: true });
    mkdirSync(repoB, { recursive: true });
    const projectA = writeMinimalManifest(repoA);
    const projectB = writeMinimalManifest(repoB);

    bootstrapGlobalStore({ storeRoot });
    seedProjectRows(storeRoot, projectA, repoA);
    seedProjectRows(storeRoot, projectB, repoB);

    // Identity is resolved from repo A's manifest, never from its path.
    const result = pruneProjectFromStore({ repoRoot: repoA, storeRoot });
    expect(result).toEqual({
      status: "pruned",
      storeRoot,
      projectId: projectA,
      remainingProjects: 1,
    });

    const rowsA = readAllProjectRows(storeRoot, projectA);
    expect(rowsA.registry).toBeNull();
    expect(rowsA.runs).toEqual([]);
    expect(rowsA.evidence).toEqual([]);

    const rowsB = readAllProjectRows(storeRoot, projectB);
    expect(rowsB.registry?.projectId).toBe(projectB);
    expect(rowsB.registry?.rootPath).toBe(repoB);
    expect(rowsB.runs).toHaveLength(1);
    expect(rowsB.runs[0]?.record).toEqual({ status: "created" });
    expect(rowsB.evidence).toHaveLength(1);
    expect(rowsB.evidence[0]?.payload).toEqual({ status: "passed" });

    expect(
      withStoreDatabase(storeRoot, (db) => listProjectRegistryEntries(db)),
    ).toHaveLength(1);
  });

  it("reports a missing project identity explicitly instead of falling back to path-keyed pruning", () => {
    if (!sqliteAvailable) {
      return;
    }

    bootstrapGlobalStore({ storeRoot });
    const projectA = "11111111-1111-4111-8111-111111111111";
    seedProjectRows(storeRoot, projectA, "/tmp/somewhere-else");

    const repoWithoutManifest = path.join(workDir, "no-manifest-repo");
    mkdirSync(repoWithoutManifest, { recursive: true });

    const result = pruneProjectFromStore({ repoRoot: repoWithoutManifest, storeRoot });
    expect(result).toEqual({
      status: "no-identity",
      storeRoot,
      identityStatus: "no-manifest",
    });

    // Nothing was pruned: identity, not path, keys project-scoped state.
    expect(readAllProjectRows(storeRoot, projectA).registry?.projectId).toBe(projectA);
  });

  it("reports no-store without creating a database when none exists", () => {
    const repo = path.join(workDir, "repo");
    mkdirSync(repo, { recursive: true });
    writeMinimalManifest(repo);
    mkdirSync(storeRoot, { recursive: true });

    const result = pruneProjectFromStore({ repoRoot: repo, storeRoot });
    expect(result).toEqual({ status: "no-store", storeRoot });
    expect(existsSync(getStoreDatabasePath(storeRoot))).toBe(false);
  });
});

describe("removeGlobalStore (R-LIFE-1)", () => {
  let workDir: string;
  let storeRoot: string;

  beforeEach(() => {
    workDir = createTempDir("make-docs-store-remove-");
    storeRoot = path.join(workDir, "store-root");
  });

  afterEach(() => {
    cleanupTempDir(workDir);
  });

  it("removes the store files and the store root", () => {
    bootstrapGlobalStore({ storeRoot });

    const result = removeGlobalStore({ storeRoot });
    expect(result.status).toBe("removed");
    expect(result.removedFiles).toContain(GLOBAL_CONFIG_FILE);
    expect(result.removedFiles).toContain(GLOBAL_MANIFEST_FILE);
    if (sqliteAvailable) {
      expect(result.removedFiles).toContain(STORE_DATABASE_FILE);
    }
    expect(result.retainedEntries).toEqual([]);
    expect(existsSync(storeRoot)).toBe(false);
  });

  it("reports not-found when the store does not exist", () => {
    const result = removeGlobalStore({ storeRoot });
    expect(result.status).toBe("not-found");
    expect(result.removedFiles).toEqual([]);
  });

  it("retains entries the store does not own instead of deleting them", () => {
    bootstrapGlobalStore({ storeRoot });
    const strayPath = path.join(storeRoot, "user-notes.txt");
    writeFileSync(strayPath, "not store-owned\n", "utf8");

    const result = removeGlobalStore({ storeRoot });
    expect(result.status).toBe("retained");
    expect(result.retainedEntries).toEqual(["user-notes.txt"]);
    expect(result.warnings.join("\n")).toContain("user-notes.txt");
    expect(existsSync(strayPath)).toBe(true);
    expect(existsSync(path.join(storeRoot, GLOBAL_CONFIG_FILE))).toBe(false);
  });

  it("refuses to touch a directory that looks like a project .make-docs directory", () => {
    // A misconfigured store root pointing at a repository's .make-docs/
    // (which also carries a manifest.json) must never lose repository content.
    mkdirSync(path.join(storeRoot, "templates"), { recursive: true });
    writeFileSync(path.join(storeRoot, "config.yaml"), "labels: {}\n", "utf8");
    writeFileSync(
      path.join(storeRoot, "manifest.json"),
      '{"schemaVersion":2}\n',
      "utf8",
    );

    const result = removeGlobalStore({ storeRoot });
    expect(result.status).toBe("refused");
    expect(result.removedFiles).toEqual([]);
    expect(result.warnings.join("\n")).toContain("config.yaml");
    expect(existsSync(path.join(storeRoot, "manifest.json"))).toBe(true);
    expect(existsSync(path.join(storeRoot, "config.yaml"))).toBe(true);
    expect(readdirSync(storeRoot).sort()).toEqual([
      "config.yaml",
      "manifest.json",
      "templates",
    ]);
  });
});

describe("uninstall global-store handling (R-LIFE-1, R-LIFE-2, R-TEST-4)", () => {
  let workDir: string;
  let storeRoot: string;
  let homeDir: string;
  let restoreHome: () => void;

  beforeEach(() => {
    workDir = createTempDir("make-docs-uninstall-store-");
    storeRoot = path.join(workDir, "store-root");
    homeDir = path.join(workDir, "home");
    mkdirSync(homeDir, { recursive: true });
    restoreHome = mockHomeDirectory(homeDir);
    __setLifecycleRendererForTests(createApprovingLifecycleRenderer());
  });

  afterEach(() => {
    __setLifecycleRendererForTests(null);
    restoreHome();
    vi.restoreAllMocks();
    cleanupTempDir(workDir);
  });

  it("prunes only the uninstalled project's rows, keeps the store for other projects, and never touches repository backups", async () => {
    if (!sqliteAvailable) {
      return;
    }

    const targetDir = path.join(workDir, "target");
    mkdirSync(targetDir, { recursive: true });
    await installMakeDocsTarget(targetDir);
    const projectId = loadManifest(targetDir)?.projectId;
    expect(projectId).toBeTruthy();

    // PRD 32 protected paths: legacy root backup state and .make-docs/backup
    // snapshots must survive uninstall unchanged, store handling included.
    const legacyBackupFile = path.join(targetDir, ".backup", "legacy-note.md");
    mkdirSync(path.dirname(legacyBackupFile), { recursive: true });
    writeFileSync(legacyBackupFile, "protected legacy backup\n", "utf8");
    const repoBackupFile = path.join(
      targetDir,
      ".make-docs",
      "backup",
      "2026-01-01",
      "snapshot-note.md",
    );
    mkdirSync(path.dirname(repoBackupFile), { recursive: true });
    writeFileSync(repoBackupFile, "protected repo backup snapshot\n", "utf8");

    bootstrapGlobalStore({ storeRoot });
    seedProjectRows(storeRoot, projectId as string, targetDir);
    const otherProjectId = "22222222-2222-4222-8222-222222222222";
    seedProjectRows(storeRoot, otherProjectId, "/tmp/other-project");

    const { result, output } = await captureUninstall({
      targetDir,
      backup: false,
      permissions: "allow-all",
      homeDir,
      storeRoot,
    });

    expect(result.status).toBe("completed");
    if (result.status !== "completed") {
      throw new Error("expected completed uninstall");
    }
    expect(result.storeHandling).toEqual({
      status: "pruned",
      storeRoot,
      projectId,
      remainingProjects: 1,
    });
    expect(output).toContain("Global store: pruned this project's operational state");
    expect(output).toContain("still holds state for 1 other registered project");

    // Exactly one project's rows were pruned (R-TEST-4).
    const prunedRows = readAllProjectRows(storeRoot, projectId as string);
    expect(prunedRows.registry).toBeNull();
    expect(prunedRows.runs).toEqual([]);
    expect(prunedRows.evidence).toEqual([]);
    const otherRows = readAllProjectRows(storeRoot, otherProjectId);
    expect(otherRows.registry?.projectId).toBe(otherProjectId);
    expect(otherRows.runs).toHaveLength(1);
    expect(otherRows.evidence).toHaveLength(1);

    // The store itself is kept for the other project, and repository content
    // — including PRD 32 protected backup state — is untouched by store
    // handling (R-LIFE-1: no repository file is deleted).
    expect(existsSync(getStoreDatabasePath(storeRoot))).toBe(true);
    expect(readFileSync(legacyBackupFile, "utf8")).toBe("protected legacy backup\n");
    expect(readFileSync(repoBackupFile, "utf8")).toBe(
      "protected repo backup snapshot\n",
    );
  });

  it("reports how to remove the store when the last registered project is pruned", async () => {
    if (!sqliteAvailable) {
      return;
    }

    const targetDir = path.join(workDir, "target");
    mkdirSync(targetDir, { recursive: true });
    await installMakeDocsTarget(targetDir);
    const projectId = loadManifest(targetDir)?.projectId;
    expect(projectId).toBeTruthy();

    bootstrapGlobalStore({ storeRoot });
    seedProjectRows(storeRoot, projectId as string, targetDir);

    const { result, output } = await captureUninstall({
      targetDir,
      backup: false,
      permissions: "allow-all",
      homeDir,
      storeRoot,
    });

    expect(result.status).toBe("completed");
    if (result.status !== "completed") {
      throw new Error("expected completed uninstall");
    }
    expect(result.storeHandling.status).toBe("pruned");
    if (result.storeHandling.status === "pruned") {
      expect(result.storeHandling.remainingProjects).toBe(0);
    }
    expect(output).toContain("No registered projects remain in the machine-level store.");
    expect(output).toContain(storeRoot);
  });

  it("still reports the store disposition when no store database exists", async () => {
    const targetDir = path.join(workDir, "target");
    mkdirSync(targetDir, { recursive: true });
    await installMakeDocsTarget(targetDir);

    const { result, output } = await captureUninstall({
      targetDir,
      backup: false,
      permissions: "allow-all",
      homeDir,
      storeRoot,
    });

    expect(result.status).toBe("completed");
    if (result.status !== "completed") {
      throw new Error("expected completed uninstall");
    }
    expect(result.storeHandling).toEqual({ status: "no-store", storeRoot });
    expect(output).toContain(
      `Global store: no store database exists at ${storeRoot}`,
    );
  });
});

describe("update-shaped store migration (R-LIFE-3)", () => {
  let workDir: string;
  let storeRoot: string;

  beforeEach(() => {
    workDir = createTempDir("make-docs-store-migrate-");
    storeRoot = path.join(workDir, "store-root");
  });

  afterEach(() => {
    cleanupTempDir(workDir);
  });

  it("applies pending schema migrations to an existing older database at the bootstrap seam", () => {
    if (!sqliteAvailable || !driver.available) {
      return;
    }

    // Simulate a database created before the current schema: a valid SQLite
    // file whose user_version is behind CURRENT_STORE_SCHEMA_VERSION.
    mkdirSync(storeRoot, { recursive: true });
    const databasePath = getStoreDatabasePath(storeRoot);
    const rawDb = new driver.sqlite.DatabaseSync(databasePath);
    rawDb.exec("PRAGMA user_version = 0");
    rawDb.close();

    // The update-shaped flow (`runCli` apply on an existing install) runs
    // `bootstrapGlobalStore`, which opens the database and applies every
    // pending migration.
    const report = bootstrapGlobalStore({ storeRoot });
    expect(report.databaseStatus).toBe("ready");
    expect(report.schemaVersion).toBe(CURRENT_STORE_SCHEMA_VERSION);

    withStoreDatabase(storeRoot, (db) => {
      expect(readUserVersion(db)).toBe(CURRENT_STORE_SCHEMA_VERSION);
      // The migrated schema is fully usable.
      upsertProjectRegistryEntry(db, {
        projectId: "33333333-3333-4333-8333-333333333333",
        rootPath: "/tmp/migrated-project",
      });
      expect(listProjectRegistryEntries(db)).toHaveLength(1);
    });
  });
});

describe("store privacy (R-PRIV-1)", () => {
  it("keeps the store module free of network-capable imports", () => {
    const storeDir = path.join(CLI_SRC_ROOT, "store");
    const sources = readdirSync(storeDir)
      .filter((entry) => entry.endsWith(".ts"))
      .map((entry) => ({
        file: path.join("src", "store", entry),
        content: readFileSync(path.join(storeDir, entry), "utf8"),
      }));
    expect(sources.length).toBeGreaterThan(0);

    // The store records every registered project's path (local-only data):
    // no store source may open a network path, so store rows structurally
    // cannot be transmitted from inside the module.
    const networkPattern = /\bfetch\s*\(|node:https?|from ["']undici["']|from ["']axios["']/;
    for (const source of sources) {
      expect(
        networkPattern.test(source.content),
        `${source.file} must not contain network calls or imports (R-PRIV-1)`,
      ).toBe(false);
    }
  });

  it("keeps the CLI's only network path free of store imports", () => {
    // Audit result recorded in src/store/README.md: `src/skill-resolver.ts`
    // holds the only outbound network call in the CLI. It must never import
    // the store, so no store data can reach a network-bound payload builder.
    const skillResolver = readFileSync(
      path.join(CLI_SRC_ROOT, "skill-resolver.ts"),
      "utf8",
    );
    expect(/from ["']\.{1,2}\/store/.test(skillResolver)).toBe(false);
    expect(skillResolver).not.toContain("MAKE_DOCS_HOME");
  });
});
