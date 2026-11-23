import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StoreAccessStateError, withoutRepeatedNextAction } from "../src/operations/store-access";
import { CLI_STORE_MAINTENANCE_VERSIONS } from "../src/operations/setup/store-ops";
import { renderStoreClean } from "../src/run/setup-store";
import { STORE_MIGRATIONS, STORE_WRITE_GUARD_LIMIT, storeWriteGuardTriggerName, withStoreDatabase } from "../src/store/database";
import { STORE_LEGACY_SCHEMA_NEXT_ACTION } from "../src/store/installation-state";
import { removeGlobalStore } from "../src/store/lifecycle";
import { checkStore, cleanStore, defaultStoreMaintenanceEnvironment } from "../src/store/maintenance";
import { runToolUninstallCommand } from "../src/self/uninstall-tool";
import { renderStoreCheck } from "../src/run/setup-store";
import { FIXTURE_NOW, FIXTURE_VERSIONS, STORE_MAINTENANCE_FIXTURES, makeFixtureEnv } from "./fixtures/store-maintenance-contract";

/**
 * W32 R0 P5 wording fixes found on a copy of a real Store: each Store refusal
 * states its next action once, a legacy schema names `make-docs setup`, a
 * setup name refusal names the project name, status states the write guard
 * limit (PRD 38 R-WRITE-GUARD-6), and help says who runs the Store commands.
 */
const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist/index.js");
const SETUP_FLAGS = ["--yes", "--no-codex", "--no-claude-code", "--no-github-copilot", "--no-skills"];

let temp: string;
let store: string;
let home: string;
beforeEach(() => {
  temp = mkdtempSync(path.join(os.tmpdir(), "make-docs-w32-p5-"));
  store = path.join(temp, "store");
  home = path.join(temp, "home");
  mkdirSync(home);
});
afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(temp, { recursive: true, force: true });
});

function cli(args: string[], storeRoot = store) {
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: "utf8",
    env: { ...process.env, HOME: home, MAKE_DOCS_HOME: storeRoot },
  });
}

function gitProject(name: string): string {
  const root = path.join(temp, name);
  mkdirSync(root);
  writeFileSync(path.join(root, "README.md"), "# project\n");
  return root;
}

function setProjectName(root: string, name: string): void {
  const file = path.join(root, ".make-docs/config.yaml");
  const text = readFileSync(file, "utf8");
  // Setup writes a flow-style YAML map. Add the key as its first entry.
  writeFileSync(file, text.replace(/^\{\n/, `{\n  projectName: ${name},\n`));
}

function count(text: string, part: string): number {
  return text.split(part).length - 1;
}

describe("W32 R0 P5 Store wording", () => {
  it("states a repeated next action once in a scoped Store error", () => {
    const action = "Do not write the Store. Run make-docs setup store check to review it.";
    expect(withoutRepeatedNextAction(`The Store was changed. No project files changed. ${action}`, action))
      .toBe("The Store was changed. No project files changed.");
    expect(withoutRepeatedNextAction("Other reason.", action)).toBe("Other reason.");
    expect(withoutRepeatedNextAction(action, action)).toBe(action);
    const error = new StoreAccessStateError("store-unsafe", "project.register.list", `Changed. ${action}`, action);
    expect(error.reason).toBe("Changed.");
    expect(count(error.message, action)).toBe(1);
  });

  it("names the Store change once when a guard trigger was dropped outside Make Docs", () => {
    const root = gitProject("alpha");
    expect(cli(["setup", "--target", root, ...SETUP_FLAGS]).status).toBe(0);
    const raw = new DatabaseSync(path.join(store, "store.db"));
    raw.exec(`DROP TRIGGER ${storeWriteGuardTriggerName("installation_locks", "delete")}`);
    raw.close();
    const result = cli(["project", "list", "--target-root", root, "--json"]);
    expect(result.status).toBe(1);
    const refusal = JSON.parse(result.stdout || result.stderr) as { code: string; message: string; reason: string; nextAction: string };
    expect(refusal.code).toBe("store-unsafe");
    expect(refusal.reason).toContain("changed outside Make Docs");
    expect(refusal.reason).not.toContain("Do not write the Store.");
    expect(refusal.nextAction).toContain("make-docs setup store check");
    expect(count(refusal.message, "Do not write the Store.")).toBe(1);
  }, 60_000);

  it("names make-docs setup for a Store at a legacy schema", () => {
    mkdirSync(store, { recursive: true });
    const db = new DatabaseSync(path.join(store, "store.db"));
    for (const migration of STORE_MIGRATIONS.filter((candidate) => candidate.version <= 6)) {
      for (const statement of migration.statements) db.exec(statement);
      db.exec(`PRAGMA user_version=${migration.version}`);
    }
    db.close();
    const root = gitProject("alpha");
    const result = cli(["project", "list", "--target-root", root, "--json"]);
    const refusal = JSON.parse(result.stdout || result.stderr) as { code: string; message: string; reason: string; nextAction: string };
    expect(refusal.code).toBe("store-unavailable");
    expect(refusal.reason).toContain("supported legacy schema 6");
    expect(refusal.nextAction).toBe(STORE_LEGACY_SCHEMA_NEXT_ACTION);
    expect(count(refusal.message, STORE_LEGACY_SCHEMA_NEXT_ACTION)).toBe(1);
    expect(refusal.message).not.toContain("Restore access to the configured Make Docs Store");
  });

  it("gives a setup name refusal its own next action and reports no Store change", () => {
    const alpha = gitProject("alpha");
    const beta = gitProject("beta");
    expect(cli(["setup", "--target", alpha, ...SETUP_FLAGS]).status).toBe(0);
    setProjectName(alpha, "docs");
    expect(cli(["setup", "--target", alpha, ...SETUP_FLAGS]).status).toBe(0);
    expect(cli(["setup", "--target", beta, ...SETUP_FLAGS]).status).toBe(0);
    setProjectName(beta, "docs");
    const json = JSON.parse(cli(["setup", "--target", beta, ...SETUP_FLAGS, "--json"]).stdout) as {
      status: string;
      failedCondition: string;
      nextAction: string;
      store: { mutationState: string; nextAction: string };
    };
    expect(json.status).toBe("blocked");
    expect(json.failedCondition).toContain('The project name "docs" belongs to another project');
    expect(json.failedCondition).toContain("Make Docs refused this Store write.");
    expect(json.failedCondition).not.toContain("Choose another projectName");
    expect(json.nextAction).toBe("Choose another projectName in .make-docs/config.yaml, then run `make-docs setup` again.");
    expect(json.store).toMatchObject({ mutationState: "none", nextAction: json.nextAction });
    // A non-interactive setup writes the canonical result even without --json.
    const repeat = cli(["setup", "--target", beta, ...SETUP_FLAGS]).stdout;
    expect(repeat).not.toContain("Correct the reported Store prerequisite");
  }, 120_000);

  it("states the write guard limit in project state status (R-WRITE-GUARD-6)", () => {
    const root = gitProject("alpha");
    expect(cli(["setup", "--target", root, ...SETUP_FLAGS]).status).toBe(0);
    const status = JSON.parse(cli(["project", "state", "status", "--target-root", root, "--json"]).stdout) as {
      storeIntegrity: { writeGuard: { state: string; limit: string } };
    };
    expect(status.storeIntegrity.writeGuard).toEqual({ state: "intact", limit: STORE_WRITE_GUARD_LIMIT });
    expect(STORE_WRITE_GUARD_LIMIT).toContain("detects it at the next Store open");
    const text = cli(["project", "state", "status", "--target-root", root]).stdout;
    expect(text).toContain(`Store write guard: on. ${STORE_WRITE_GUARD_LIMIT}`);
  }, 60_000);

  it("states the clean dry run summary, Store line, and next action once", () => {
    withStoreDatabase(store, () => undefined);
    const report = cleanStore(store, defaultStoreMaintenanceEnvironment(CLI_STORE_MAINTENANCE_VERSIONS), { dryRun: true });
    const text = renderStoreClean(report);
    expect(text.split("\n")[0]).toBe(`Store clean: ${report.summary}`);
    expect(text).not.toContain("Store check:");
    expect(count(text, "Next: ")).toBe(1);
    expect(count(text, "Store: ")).toBe(1);
    expect(text).toContain("(schema 7,");
    expect(text).toContain("Fixed rules:");
  });

  it("Store removal keeps the clean backup folder and names the kept backups", () => {
    withStoreDatabase(store, () => undefined);
    mkdirSync(path.join(store, "backup"));
    writeFileSync(path.join(store, "backup", "store-clean-20261224T120000000Z-a3f4ed99.db"), "backup");
    writeFileSync(path.join(store, "backup", ".DS_Store"), "finder");
    writeFileSync(path.join(store, "backup", "Thumbs.db"), "explorer");
    writeFileSync(path.join(store, "store.db.bridge-v6-to-v7-old.backup"), "bridge");
    const removed = removeGlobalStore({ storeRoot: store });
    expect(removed.status).toBe("retained");
    expect(removed.removedFiles).toContain("store.db");
    expect(removed.retainedEntries.sort()).toEqual(["backup", "store.db.bridge-v6-to-v7-old.backup"]);
    expect(removed.keptBackups.sort()).toEqual(["backup/store-clean-20261224T120000000Z-a3f4ed99.db", "store.db.bridge-v6-to-v7-old.backup"]);
    expect(removed.warnings).toEqual([]);
    expect(readFileSync(path.join(store, "backup", "store-clean-20261224T120000000Z-a3f4ed99.db"), "utf8")).toBe("backup");
  });

  it("Store removal refuses a backup folder with other files and says so plainly", () => {
    withStoreDatabase(store, () => undefined);
    mkdirSync(path.join(store, "backup"));
    writeFileSync(path.join(store, "backup", "store-clean-20261224T120000000Z-a3f4ed99.db"), "backup");
    writeFileSync(path.join(store, "backup", "managed-file.md"), "project backup");
    const removed = removeGlobalStore({ storeRoot: store });
    expect(removed.status).toBe("refused");
    expect(removed.removedFiles).toEqual([]);
    expect(removed.warnings.join("\n")).toContain("its backup folder has other files (managed-file.md)");
    expect(removed.warnings.join("\n")).not.toContain("marks a project .make-docs/ directory");
    expect(existsSync(path.join(store, "store.db"))).toBe(true);
  });

  it("uninstall --remove-store after a clean names the kept backups before and after, and never says the Store is preserved", async () => {
    const fixture = STORE_MAINTENANCE_FIXTURES.find((candidate) => candidate.id === "SMF-007")!;
    withStoreDatabase(store, (db) => {
      db.exec("BEGIN IMMEDIATE");
      fixture.seed(db, makeFixtureEnv(temp));
      db.exec("COMMIT");
    });
    const clean = cleanStore(store, defaultStoreMaintenanceEnvironment(FIXTURE_VERSIONS));
    expect(clean.backup).not.toBeNull();
    const lines: string[] = [];
    const result = await runToolUninstallCommand({
      yes: true,
      removeStore: true,
      storeRoot: store,
      argv1: "/Users/tester/.npm/_npx/1a2b3c4d/node_modules/@brucewaynedecoy/make-docs/dist/cli.js",
      execPath: "/usr/local/bin/node",
      realpath: (candidate: string) => candidate,
      exec: vi.fn(async () => ({ exitCode: 0 })),
      output: { write: (text: string) => { lines.push(text); } },
    });
    const rendered = lines.join("\n");
    const backupFolder = `${path.join(store, "backup")}${path.sep}`;
    // (a) Before the change: Store backups stay, and the folder is named.
    expect(rendered).toContain(`Store backups stay in ${backupFolder}`);
    expect(rendered).not.toContain("all stored history and recovery records will be deleted");
    // (b) After the change: the Store is removed and the backups are kept.
    expect(result.storeRemoval?.status).toBe("retained");
    expect(rendered).toContain(`Removed the Store. Kept 1 backup at ${backupFolder}. Delete them yourself if you no longer need them.`);
    expect(rendered).not.toContain("partially removed");
    // (c) No preserved line when the Store was removed.
    expect(rendered).not.toContain("The global Store is preserved");
    expect(existsSync(path.join(store, "store.db"))).toBe(false);
    expect(readdirSync(path.join(store, "backup"))).toEqual([path.basename(clean.backup!.path)]);
  });

  it("says how many rows wait for the 30-day window and when the first can go", () => {
    const fixture = STORE_MAINTENANCE_FIXTURES.find((candidate) => candidate.id === "SMF-003")!;
    withStoreDatabase(store, (db) => {
      db.exec("BEGIN IMMEDIATE");
      fixture.seed(db, makeFixtureEnv(temp));
      db.exec("COMMIT");
    });
    const day = 24 * 60 * 60 * 1000;
    // 75 days before the fixture clock, every fixture operation that a rule trims is still inside the window.
    const early = defaultStoreMaintenanceEnvironment(FIXTURE_VERSIONS, new Date(FIXTURE_NOW.getTime() - 75 * day));
    const report = checkStore(store, early);
    expect(report.totals.actRows).toBe(0);
    expect(report.waiting).not.toBeNull();
    // op-old-remove finished 80 days before the fixture clock, so its window ends 50 days before it.
    const firstDate = new Date(FIXTURE_NOW.getTime() - 50 * day).toISOString().slice(0, 10);
    expect(report.waiting).toMatchObject({ retentionDays: 30, firstDate });
    const rows = report.waiting!.rows;
    expect(report.summary).toContain(`Clean would remove nothing. ${rows} rows wait for the 30-day window; the first can go on ${firstDate}.`);
    expect(renderStoreCheck(report)).toContain(`${rows} rows wait for the 30-day window; the first can go on ${firstDate}.`);
    const before = readFileSync(path.join(store, "store.db"));
    const noop = cleanStore(store, early);
    expect(noop.backup).toBeNull();
    expect(noop.summary).toBe(`Clean removed nothing: no fixed rule proves a row now. ${rows} rows wait for the 30-day window; the first can go on ${firstDate}. No backup was made, and the Store did not change.`);
    expect(readFileSync(path.join(store, "store.db")).equals(before)).toBe(true);
    // At the fixture clock some rows act and the 5-day-old operation still waits.
    const now = checkStore(store, defaultStoreMaintenanceEnvironment(FIXTURE_VERSIONS, FIXTURE_NOW));
    expect(now.totals.actRows).toBeGreaterThan(0);
    expect(now.summary).toMatch(/\d+ more rows? waits? for the 30-day window; the first can go on 2042-07-10\./);
    // Once every window has passed, the waiting rows act and nothing waits.
    const later = checkStore(store, defaultStoreMaintenanceEnvironment(FIXTURE_VERSIONS, new Date(FIXTURE_NOW.getTime() + 31 * day)));
    expect(later.totals.actRows).toBe(rows);
    expect(later.waiting).toBeNull();
  });

  it("names the next check date when only waiting rows remain, and says nothing waits on an empty Store", () => {
    withStoreDatabase(store, () => undefined);
    const empty = checkStore(store, defaultStoreMaintenanceEnvironment(CLI_STORE_MAINTENANCE_VERSIONS));
    expect(empty.waiting).toBeNull();
    expect(empty.nextAction).toBe("Nothing to do.");
    const fixture = STORE_MAINTENANCE_FIXTURES.find((candidate) => candidate.id === "SMF-003")!;
    withStoreDatabase(store, (db) => {
      db.exec("BEGIN IMMEDIATE");
      fixture.seed(db, makeFixtureEnv(temp));
      // Leave only finished operations, so no crash leftover or decision item remains.
      db.exec("DELETE FROM installation_steps WHERE operation_id = 'op-pending'");
      db.exec("DELETE FROM installation_operations WHERE operation_id = 'op-pending'");
      db.exec("COMMIT");
    });
    const env = { ...defaultStoreMaintenanceEnvironment(FIXTURE_VERSIONS, new Date(FIXTURE_NOW.getTime() - 75 * 24 * 60 * 60 * 1000)), folderMissing: () => "refuted" as const };
    const report = checkStore(store, env);
    expect(report.decisions).toEqual([]);
    expect(report.leftovers).toEqual([]);
    expect(report.nextAction).toBe(`Run make-docs setup store check again on or after ${report.waiting!.firstDate}.`);
  });

  it("explains --target-root and who runs the Store commands in help", () => {
    const list = cli(["project", "list", "--help"]).stdout;
    expect(list).toContain("The list always shows every project in the Store");
    expect(list).toContain("It does not filter the list.");
    const storeHelp = cli(["setup", "store", "--help"]).stdout;
    expect(storeHelp).toContain("Run these commands yourself in a terminal.");
    expect(storeHelp).toContain("setup_store_check");
  });
});
