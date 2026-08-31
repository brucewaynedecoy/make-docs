import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli } from "../src/cli";
import { loadManifest } from "../src/manifest";
import {
  CURRENT_STORE_SCHEMA_VERSION,
  GLOBAL_CONFIG_FILE,
  GLOBAL_MANIFEST_FILE,
  STORE_DATABASE_FILE,
  StoreSchemaNewerError,
  bootstrapGlobalStore,
  defaultGlobalConfig,
  deleteProjectRows,
  getStoreDatabasePath,
  listProjectRegistryEntries,
  listWorkEvidence,
  loadGlobalConfig,
  loadGlobalManifest,
  loadSqliteDriver,
  openStoreDatabase,
  readPlaybookRunRecord,
  readProjectRegistryEntry,
  readUserVersion,
  resolveStoreRoot,
  upsertPlaybookRunRecord,
  upsertProjectRegistryEntry,
  upsertWorkEvidence,
  withStoreDatabase,
  writeGlobalConfig,
} from "../src/store";
import { cleanupTempDir, collectFiles, createTempDir } from "./helpers";

const driver = loadSqliteDriver();
const sqliteAvailable = driver.available;

const ISO_TIMESTAMP_RE =
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})/g;

// Two independent installs mint two distinct random project identifiers
// (W18 R10 P2, R-ID-1) — a per-install value like the timestamps, unrelated
// to the store's presence — so byte-identity comparisons normalize it.
const PROJECT_ID_LINE_RE = /"projectId": "[0-9a-f-]{36}"/g;

function bootstrapInto(storeRoot: string) {
  return bootstrapGlobalStore({
    storeRoot,
    packageMeta: { name: "make-docs-test", version: "0.0.0-test" },
  });
}

describe("store paths", () => {
  it("prefers the explicit storeRoot, then MAKE_DOCS_HOME, then the home directory", () => {
    const explicit = resolveStoreRoot({
      storeRoot: "/tmp/explicit-store",
      env: { MAKE_DOCS_HOME: "/tmp/env-store" },
      homeDir: "/tmp/home",
    });
    expect(explicit).toBe(path.resolve("/tmp/explicit-store"));

    const fromEnv = resolveStoreRoot({
      env: { MAKE_DOCS_HOME: "/tmp/env-store" },
      homeDir: "/tmp/home",
    });
    expect(fromEnv).toBe(path.resolve("/tmp/env-store"));

    const fromHome = resolveStoreRoot({ env: {}, homeDir: "/tmp/home" });
    expect(fromHome).toBe(path.join("/tmp/home", ".make-docs"));
  });
});

describe("store bootstrap (stage 1)", () => {
  let storeRoot: string;

  beforeEach(() => {
    storeRoot = path.join(createTempDir("make-docs-store-"), "store-root");
  });

  afterEach(() => {
    cleanupTempDir(path.dirname(storeRoot));
  });

  it("creates the store with global config, global manifest, and the SQLite database", () => {
    const report = bootstrapInto(storeRoot);

    expect(existsSync(path.join(storeRoot, GLOBAL_CONFIG_FILE))).toBe(true);
    expect(existsSync(path.join(storeRoot, GLOBAL_MANIFEST_FILE))).toBe(true);
    expect(report.configCreated).toBe(true);
    expect(report.manifestCreated).toBe(true);

    if (sqliteAvailable) {
      expect(existsSync(path.join(storeRoot, STORE_DATABASE_FILE))).toBe(true);
      expect(report.databaseStatus).toBe("created");
      expect(report.schemaVersion).toBe(CURRENT_STORE_SCHEMA_VERSION);
      expect(report.warnings).toEqual([]);
    } else {
      expect(report.databaseStatus).toBe("unavailable");
      expect(report.warnings.join("\n")).toContain("node:sqlite");
    }

    const manifest = loadGlobalManifest(storeRoot);
    expect(manifest).not.toBeNull();
    expect(manifest?.lastBootstrap?.packageName).toBe("make-docs-test");
    expect(manifest?.database.status).toBe(report.databaseStatus);
  });

  it("is idempotent and never clobbers existing global config values", () => {
    bootstrapInto(storeRoot);

    const custom = defaultGlobalConfig();
    custom.settings.selfUpdate = "off";
    custom.settings.marketplaceAutoRegistration = true;
    writeGlobalConfig(storeRoot, custom);

    const report = bootstrapInto(storeRoot);
    expect(report.configCreated).toBe(false);

    const loaded = loadGlobalConfig(storeRoot);
    expect(loaded.loadedFromDisk).toBe(true);
    expect(loaded.config.settings.selfUpdate).toBe("off");
    expect(loaded.config.settings.marketplaceAutoRegistration).toBe(true);
  });

  it("only ever holds operational files, never template assets", () => {
    bootstrapInto(storeRoot);
    const entries = readdirSync(storeRoot).sort();
    for (const entry of entries) {
      expect(
        entry === GLOBAL_CONFIG_FILE ||
          entry === GLOBAL_MANIFEST_FILE ||
          entry.startsWith(STORE_DATABASE_FILE),
      ).toBe(true);
      expect(entry.endsWith(".md")).toBe(false);
    }
  });

  it("degrades global config to defaults with a warning when the file is invalid JSON", () => {
    mkdirSync(storeRoot, { recursive: true });
    writeFileSync(path.join(storeRoot, GLOBAL_CONFIG_FILE), "{not json", "utf8");

    const loaded = loadGlobalConfig(storeRoot);
    expect(loaded.loadedFromDisk).toBe(false);
    expect(loaded.config).toEqual(defaultGlobalConfig());
    expect(loaded.warnings.join("\n")).toContain("not valid JSON");
  });
});

describe("global config separation from project config (R-STORE-2)", () => {
  it("never reads machine settings from a project .make-docs/config.yaml", () => {
    const projectDir = createTempDir("make-docs-project-");
    const storeRoot = path.join(createTempDir("make-docs-store-"), "store-root");
    try {
      // A project config that (incorrectly) tries to set machine-level keys.
      mkdirSync(path.join(projectDir, ".make-docs"), { recursive: true });
      writeFileSync(
        path.join(projectDir, ".make-docs", "config.yaml"),
        "settings:\n  selfUpdate: auto\n  marketplaceAutoRegistration: true\n",
        "utf8",
      );

      bootstrapInto(storeRoot);
      const loaded = loadGlobalConfig(storeRoot);
      // The global config loader only reads the store root; project files
      // cannot set machine-level settings.
      expect(loaded.config.settings.selfUpdate).toBe("prompt");
      expect(loaded.config.settings.marketplaceAutoRegistration).toBe(false);
    } finally {
      cleanupTempDir(projectDir);
      cleanupTempDir(path.dirname(storeRoot));
    }
  });
});

describe("local bootstrap independence (R-STORE-3, R-KEEP-2)", () => {
  const originalStoreHome = process.env.MAKE_DOCS_HOME;

  afterEach(() => {
    process.env.MAKE_DOCS_HOME = originalStoreHome;
  });

  it("installs byte-identical managed content with and without an existing store", async () => {
    const targetWithoutStore = createTempDir("make-docs-target-a-");
    const targetWithStore = createTempDir("make-docs-target-b-");
    const freshStore = path.join(createTempDir("make-docs-store-a-"), "store");
    const populatedStore = path.join(createTempDir("make-docs-store-b-"), "store");
    try {
      // Pre-populate one store with config, manifest, database, and rows.
      const report = bootstrapInto(populatedStore);
      if (sqliteAvailable && report.databaseStatus !== "unavailable") {
        withStoreDatabase(populatedStore, (db) => {
          upsertProjectRegistryEntry(db, {
            projectId: "someone-elses-project",
            rootPath: "/somewhere/else",
          });
        });
      }

      process.env.MAKE_DOCS_HOME = freshStore;
      await runCli(["setup", "--yes", "--target", targetWithoutStore]);

      process.env.MAKE_DOCS_HOME = populatedStore;
      await runCli(["setup", "--yes", "--target", targetWithStore]);

      const migrationStatePrefix = ".make-docs/state/";
      const filesWithout = collectFiles(targetWithoutStore)
        .filter((relativePath) => !relativePath.startsWith(migrationStatePrefix));
      const filesWith = collectFiles(targetWithStore)
        .filter((relativePath) => !relativePath.startsWith(migrationStatePrefix));
      expect(filesWith).toEqual(filesWithout);

      for (const relativePath of filesWithout) {
        const left = readFileSync(path.join(targetWithoutStore, relativePath), "utf8")
          .replace(ISO_TIMESTAMP_RE, "TIMESTAMP")
          .replace(PROJECT_ID_LINE_RE, '"projectId": "PROJECT_ID"');
        const right = readFileSync(path.join(targetWithStore, relativePath), "utf8")
          .replace(ISO_TIMESTAMP_RE, "TIMESTAMP")
          .replace(PROJECT_ID_LINE_RE, '"projectId": "PROJECT_ID"');
        expect(right, `content mismatch for ${relativePath}`).toBe(left);
      }
    } finally {
      cleanupTempDir(targetWithoutStore);
      cleanupTempDir(targetWithStore);
      cleanupTempDir(path.dirname(freshStore));
      cleanupTempDir(path.dirname(populatedStore));
    }
  }, 60_000);

  it("bootstraps the store and upserts the registry mirror when the CLI applies an install", async () => {
    const targetDir = createTempDir("make-docs-target-");
    const storeRoot = path.join(createTempDir("make-docs-store-"), "store");
    try {
      process.env.MAKE_DOCS_HOME = storeRoot;
      await runCli(["setup", "--yes", "--target", targetDir]);

      expect(existsSync(path.join(storeRoot, GLOBAL_CONFIG_FILE))).toBe(true);
      expect(existsSync(path.join(storeRoot, GLOBAL_MANIFEST_FILE))).toBe(true);
      if (sqliteAvailable) {
        expect(existsSync(path.join(storeRoot, STORE_DATABASE_FILE))).toBe(true);

        // The apply flow refreshes the install registry mirror at the same
        // seam as the store bootstrap (W18 R10 P3 Stage 3, R-MIR-1), keyed by
        // the manifest-minted identifier with the path as metadata only.
        const manifest = loadManifest(targetDir);
        expect(manifest?.projectId).toBeDefined();
        withStoreDatabase(storeRoot, (db) => {
          const entry = readProjectRegistryEntry(db, manifest!.projectId!);
          expect(entry?.rootPath).toBe(path.resolve(targetDir));
          expect(entry?.packageName).toBe(manifest?.packageName);
          expect(entry?.packageVersion).toBe(manifest?.packageVersion);
        });
      }
    } finally {
      cleanupTempDir(targetDir);
      cleanupTempDir(path.dirname(storeRoot));
    }
  }, 60_000);
});

describe.skipIf(!sqliteAvailable)("store database (stage 2)", () => {
  let storeRoot: string;

  beforeEach(() => {
    storeRoot = path.join(createTempDir("make-docs-store-db-"), "store");
  });

  afterEach(() => {
    cleanupTempDir(path.dirname(storeRoot));
  });

  it("records the schema version and preserves data across repeated bootstraps", () => {
    bootstrapInto(storeRoot);

    withStoreDatabase(storeRoot, (db) => {
      expect(readUserVersion(db)).toBe(CURRENT_STORE_SCHEMA_VERSION);
      upsertProjectRegistryEntry(db, {
        projectId: "proj-1",
        rootPath: "/tmp/project-one",
        packageName: "make-docs-test",
        packageVersion: "0.0.0-test",
      });
    });

    // Re-running bootstrap (the `update` seam) re-applies pending migrations
    // without disturbing existing rows or the recorded version.
    const report = bootstrapInto(storeRoot);
    expect(report.databaseStatus).toBe("ready");
    expect(report.schemaVersion).toBe(CURRENT_STORE_SCHEMA_VERSION);

    withStoreDatabase(storeRoot, (db) => {
      expect(readUserVersion(db)).toBe(CURRENT_STORE_SCHEMA_VERSION);
      expect(readProjectRegistryEntry(db, "proj-1")?.rootPath).toBe("/tmp/project-one");
    });
  });

  it("detects a newer-schema database explicitly and leaves it untouched", () => {
    if (!driver.available) {
      return;
    }
    bootstrapInto(storeRoot);
    const databasePath = getStoreDatabasePath(storeRoot);

    // Simulate a database written by a future CLI.
    const db = new driver.sqlite.DatabaseSync(databasePath);
    db.exec(`PRAGMA user_version = ${CURRENT_STORE_SCHEMA_VERSION + 1}`);
    db.exec("CREATE TABLE future_marker (id INTEGER PRIMARY KEY)");
    db.close();

    expect(() => openStoreDatabase(storeRoot)).toThrowError(StoreSchemaNewerError);
    try {
      openStoreDatabase(storeRoot);
    } catch (error) {
      expect(error).toBeInstanceOf(StoreSchemaNewerError);
      expect((error as StoreSchemaNewerError).message).toContain(
        `schema version ${CURRENT_STORE_SCHEMA_VERSION + 1}`,
      );
      expect((error as StoreSchemaNewerError).message).toContain("Update make-docs");
    }

    const report = bootstrapInto(storeRoot);
    expect(report.databaseStatus).toBe("schema-newer");
    expect(report.warnings.join("\n")).toContain("newer");

    // Untouched: version and future table both survive.
    const verify = new driver.sqlite.DatabaseSync(databasePath);
    const version = verify.prepare("PRAGMA user_version").get() as {
      user_version: number;
    };
    expect(Number(version.user_version)).toBe(CURRENT_STORE_SCHEMA_VERSION + 1);
    const marker = verify
      .prepare("SELECT name FROM sqlite_master WHERE name = 'future_marker'")
      .get();
    expect(marker).toBeDefined();
    verify.close();
  });

  it("enables WAL and tolerates interleaved writes from two connections", () => {
    bootstrapInto(storeRoot);
    const first = openStoreDatabase(storeRoot);
    const second = openStoreDatabase(storeRoot);
    try {
      const mode = first.db.prepare("PRAGMA journal_mode").get() as {
        journal_mode: string;
      };
      expect(mode.journal_mode).toBe("wal");

      for (let index = 0; index < 25; index += 1) {
        upsertWorkEvidence(index % 2 === 0 ? first.db : second.db, {
          projectId: "proj-concurrent",
          waveSlug: "w18-r10",
          phasePath: `docs/work/example/0${index}.md`,
          evidenceKind: "validation-passed",
          payload: { index },
        });
      }

      const rows = listWorkEvidence(first.db, { projectId: "proj-concurrent" });
      expect(rows).toHaveLength(25);
    } finally {
      first.db.close();
      second.db.close();
    }
  });

  it("tolerates concurrent writes from a second process without corruption or deadlock", async () => {
    bootstrapInto(storeRoot);
    const databasePath = getStoreDatabasePath(storeRoot);
    const childRows = 40;
    const parentRows = 40;

    const childScript = `
      const { DatabaseSync } = require("node:sqlite");
      const db = new DatabaseSync(process.env.STORE_DB_PATH);
      db.exec("PRAGMA busy_timeout = 5000");
      db.exec("PRAGMA journal_mode = WAL");
      const stmt = db.prepare(
        "INSERT INTO work_evidence (project_id, wave_slug, phase_path, evidence_kind, payload, repo_root, recorded_at) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?)"
      );
      for (let i = 0; i < ${childRows}; i += 1) {
        stmt.run("proj-child", "w18-r10", "phase-" + i, "review-passed", "{}", null, new Date().toISOString());
      }
      db.close();
    `;

    // --no-warnings suppresses the ExperimentalWarning node:sqlite still
    // emits on some Node lines, which would pollute the stderr assertion.
    const child = spawn(process.execPath, ["--no-warnings", "-e", childScript], {
      env: { ...process.env, STORE_DB_PATH: databasePath },
      stdio: ["ignore", "ignore", "pipe"],
    });
    let childStderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      childStderr += chunk.toString();
    });
    const childExit = new Promise<number>((resolve) => {
      child.on("close", (code) => resolve(code ?? -1));
    });

    // Parent writes concurrently, one short-lived connection per write, which
    // is the documented locking discipline under contention.
    for (let index = 0; index < parentRows; index += 1) {
      withStoreDatabase(storeRoot, (db) => {
        upsertWorkEvidence(db, {
          projectId: "proj-parent",
          waveSlug: "w18-r10",
          phasePath: `phase-${index}`,
          evidenceKind: "closeout-approved",
          payload: { index },
        });
      });
      if (index % 8 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 2));
      }
    }

    const exitCode = await childExit;
    expect(childStderr).toBe("");
    expect(exitCode).toBe(0);

    withStoreDatabase(storeRoot, (db) => {
      const check = db.prepare("PRAGMA quick_check").get() as {
        quick_check: string;
      };
      expect(check.quick_check).toBe("ok");
      expect(listWorkEvidence(db, { projectId: "proj-child" })).toHaveLength(childRows);
      expect(listWorkEvidence(db, { projectId: "proj-parent" })).toHaveLength(parentRows);
    });
  }, 30_000);

  it("carries the install registry and both project-state facets, and prunes all rows for one project", () => {
    bootstrapInto(storeRoot);
    withStoreDatabase(storeRoot, (db) => {
      upsertProjectRegistryEntry(db, {
        projectId: "proj-a",
        rootPath: "/tmp/project-a",
        packageName: "make-docs-test",
        packageVersion: "0.0.0-test",
      });
      upsertProjectRegistryEntry(db, {
        projectId: "proj-b",
        rootPath: "/tmp/project-b",
      });
      upsertPlaybookRunRecord(db, {
        projectId: "proj-a",
        runId: "run-1",
        record: { status: "running", currentStep: "step-2" },
      });
      upsertWorkEvidence(db, {
        projectId: "proj-a",
        waveSlug: "w18-r10",
        phasePath: "docs/work/2026-07-01-w18-r10/01-phase.md",
        evidenceKind: "validation-passed",
        payload: { approvedBy: "reviewer" },
        repoRoot: "/tmp/project-a",
      });
      upsertWorkEvidence(db, {
        projectId: "proj-b",
        waveSlug: "w1-r0",
        phasePath: "docs/work/other/01-phase.md",
        evidenceKind: "review-waived",
        payload: {},
      });

      const run = readPlaybookRunRecord(db, "proj-a", "run-1");
      expect(run?.record).toEqual({ status: "running", currentStep: "step-2" });

      const evidence = listWorkEvidence(db, { projectId: "proj-a" });
      expect(evidence).toHaveLength(1);
      expect(evidence[0]?.payload).toEqual({ approvedBy: "reviewer" });
      expect(evidence[0]?.repoRoot).toBe("/tmp/project-a");

      // Project pruning leaves every other project intact.
      deleteProjectRows(db, "proj-a");
      expect(readProjectRegistryEntry(db, "proj-a")).toBeNull();
      expect(readPlaybookRunRecord(db, "proj-a", "run-1")).toBeNull();
      expect(listWorkEvidence(db, { projectId: "proj-a" })).toHaveLength(0);
      expect(readProjectRegistryEntry(db, "proj-b")?.rootPath).toBe("/tmp/project-b");
      expect(listWorkEvidence(db, { projectId: "proj-b" })).toHaveLength(1);
      expect(listProjectRegistryEntries(db).map((entry) => entry.projectId)).toEqual([
        "proj-b",
      ]);
    });
  });
});

describe.skipIf(!sqliteAvailable)("store recovery (R-DB-4)", () => {
  let storeRoot: string;

  beforeEach(() => {
    storeRoot = path.join(createTempDir("make-docs-store-recovery-"), "store");
  });

  afterEach(() => {
    cleanupTempDir(path.dirname(storeRoot));
  });

  it("re-establishes state after the database is deleted", () => {
    bootstrapInto(storeRoot);
    withStoreDatabase(storeRoot, (db) => {
      upsertProjectRegistryEntry(db, { projectId: "proj-1", rootPath: "/tmp/p1" });
    });

    rmSync(getStoreDatabasePath(storeRoot), { force: true });
    rmSync(`${getStoreDatabasePath(storeRoot)}-wal`, { force: true });
    rmSync(`${getStoreDatabasePath(storeRoot)}-shm`, { force: true });

    // The next access recreates the database and state can be re-established.
    withStoreDatabase(storeRoot, (db, open) => {
      expect(open.created).toBe(true);
      expect(listProjectRegistryEntries(db)).toHaveLength(0);
      upsertProjectRegistryEntry(db, { projectId: "proj-1", rootPath: "/tmp/p1" });
      expect(readProjectRegistryEntry(db, "proj-1")).not.toBeNull();
    });
  });

  it("quarantines a corrupt database and reports recoverable operational-state loss", () => {
    bootstrapInto(storeRoot);
    const databasePath = getStoreDatabasePath(storeRoot);
    rmSync(`${databasePath}-wal`, { force: true });
    rmSync(`${databasePath}-shm`, { force: true });
    writeFileSync(databasePath, "this is definitely not a sqlite database", "utf8");

    const report = bootstrapInto(storeRoot);
    expect(report.databaseStatus).toBe("recovered");
    expect(report.warnings.join("\n")).toContain("recoverable operational-state loss");
    expect(report.warnings.join("\n")).toContain("no project knowledge");

    const quarantined = readdirSync(storeRoot).filter((entry) =>
      entry.includes(".corrupt-"),
    );
    expect(quarantined.length).toBeGreaterThan(0);

    withStoreDatabase(storeRoot, (db) => {
      expect(readUserVersion(db)).toBe(CURRENT_STORE_SCHEMA_VERSION);
      expect(listProjectRegistryEntries(db)).toHaveLength(0);
    });
  });

  it("keeps repository reads available but fails setup closed when the database is corrupt", async () => {
    const originalStoreHome = process.env.MAKE_DOCS_HOME;
    const targetDir = createTempDir("make-docs-target-");
    try {
      process.env.MAKE_DOCS_HOME = storeRoot;
      await runCli(["setup", "--yes", "--target", targetDir]);
      expect(loadManifest(targetDir)).not.toBeNull();

      // Corrupt the store, then read the repository and re-run the installer.
      const databasePath = getStoreDatabasePath(storeRoot);
      rmSync(`${databasePath}-wal`, { force: true });
      rmSync(`${databasePath}-shm`, { force: true });
      writeFileSync(databasePath, "garbage", "utf8");
      const corruptBytes = readFileSync(databasePath);
      const manifestBefore = readFileSync(
        path.join(targetDir, ".make-docs", "manifest.json"),
        "utf8",
      );

      expect(loadManifest(targetDir)).not.toBeNull();
      await expect(runCli(["setup", "--yes", "--target", targetDir])).rejects.toMatchObject({
        classification: { state: "corrupt" },
      });
      expect(loadManifest(targetDir)).not.toBeNull();
      expect(readFileSync(path.join(targetDir, ".make-docs", "manifest.json"), "utf8"))
        .toBe(manifestBefore);
      expect(readFileSync(databasePath)).toEqual(corruptBytes);
      expect(readdirSync(storeRoot).some((entry) => entry.includes(".corrupt-"))).toBe(false);
    } finally {
      process.env.MAKE_DOCS_HOME = originalStoreHome;
      cleanupTempDir(targetDir);
    }
  }, 60_000);
});
