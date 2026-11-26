import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { previewProjectLayout } from "../src/layout-plan";
import { createExecutionContext, OperationWriteDeniedError } from "../src/operations/context";
import { NAME_CATALOG } from "../src/operations/name-catalog";
import { getOperation, invokeOperation, operationCliCommand } from "../src/operations/registry";
import { StoreAccessStateError } from "../src/operations/store-access";
import { CLI_STORE_MAINTENANCE_VERSIONS, typedStoreMaintenanceError } from "../src/operations/setup/store-ops";
import { MAKE_DOCS_MCP_TOOLS, callMakeDocsMcpTool } from "../src/mcp/tools";
import { applyGenericMcpSetup, prepareGenericMcpSetup } from "../src/generic-mcp-setup";
import { verifyMakeDocsExecutable } from "../src/harness-access";
import { MCP_CONNECTION_ID_ENV, MCP_CONNECTION_KEY_ENV } from "../src/mcp-connection";
import { HARNESS_CALLER_IDENTITY_ENV } from "../src/harness-access/contract";
import { renderStoreCheck, renderStoreClean } from "../src/run/setup-store";
import { findNewestStoreBackup, loadSqliteDriver, openStoreForReview, openStoreSqliteConnection, registerStoreWriteGuard, storeWriteGuardTriggerName, withStoreDatabase } from "../src/store/database";
import {
  readDetachedInstallationOperation,
  readInstallationStatus,
  recoverInstallationOperation,
  withInstallationDatabase,
} from "../src/store/installation-state";
import { applyProjectLayout, prepareProjectLayout } from "../src/store/layout-state";
import {
  checkStore,
  cleanStore,
  defaultStoreMaintenanceEnvironment,
  evaluateStoreDecisions,
  evaluateStoreRules,
  listStoreCleanBackups,
  packageManagerIdleProof,
  type StoreCheckReport,
  type StoreCleanReport,
  type StoreMaintenanceEnvironment,
} from "../src/store/maintenance";
import { runRecordedToolOperation, withStoreRemovalLock } from "../src/store/tool-operations";
import { RECEIPT_COLUMNS_EMPTY_REASON, STORE_FIXED_RULE_IDS, STORE_FIXED_RULES, type StoreFixedRuleId } from "../src/store/table-catalog";
import {
  FIXTURE_DEAD_PID,
  FIXTURE_HOST,
  FIXTURE_NOW,
  FIXTURE_VERSIONS,
  STORE_MAINTENANCE_FIXTURES,
  evaluateStoreFixture,
  fixtureLiveness,
  makeFixtureEnv,
  type StoreMaintenanceFixture,
} from "./fixtures/store-maintenance-contract";

const sqliteAvailable = loadSqliteDriver().available;
const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist/index.js");
const ALL_RULES = new Set<StoreFixedRuleId>(STORE_FIXED_RULE_IDS);
/** A process list on which pnpm (SMF-002 `tool-busy`) still runs and npm does not. */
/** Fixtures whose row keys do not collide, so one Store can hold them all. */
const COMBINABLE = STORE_MAINTENANCE_FIXTURES.filter((fixture) => ["SMF-001", "SMF-002", "SMF-003", "SMF-005", "SMF-007", "SMF-009"].includes(fixture.id));
const PROCESS_LIST = ["/sbin/launchd", "node /Users/person/Library/pnpm/.tools/pnpm/9.12.0/node_modules/pnpm/bin/pnpm.cjs add -g", "zsh"];

let temp: string;
let store: string;
beforeEach(() => {
  temp = mkdtempSync(path.join(os.tmpdir(), "make-docs-w32-p4-"));
  store = path.join(temp, "store");
  vi.stubEnv("MAKE_DOCS_HOME", store);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  rmSync(temp, { recursive: true, force: true });
});

function fixtureEnv(overrides: Partial<StoreMaintenanceEnvironment> = {}): StoreMaintenanceEnvironment {
  return {
    now: FIXTURE_NOW,
    versions: FIXTURE_VERSIONS,
    liveness: fixtureLiveness,
    // A case-insensitive volume: the comparison key is the lower-case path.
    comparisonKey: (input) => input.toLowerCase(),
    folderMissing: defaultStoreMaintenanceEnvironment(FIXTURE_VERSIONS).folderMissing,
    processList: () => PROCESS_LIST,
    ...overrides,
  };
}

function seed(fixture: StoreMaintenanceFixture): void {
  const env = makeFixtureEnv(temp);
  withStoreDatabase(store, (db) => {
    db.exec("BEGIN IMMEDIATE");
    fixture.seed(db, env);
    db.exec("COMMIT");
  });
}

/** Every table row, the schema, and user_version, as one comparable value. */
function dump(storeRoot = store, databasePath = path.join(storeRoot, "store.db")): Record<string, string[]> {
  const { db } = openStoreForReview(databasePath, "test dump");
  try {
    const result: Record<string, string[]> = {
      "#schema": (db.prepare("SELECT type, name, tbl_name, sql FROM sqlite_schema ORDER BY type, name").all() as unknown[]).map((row) => JSON.stringify(row)),
      "#user_version": [JSON.stringify(db.prepare("PRAGMA user_version").get())],
    };
    for (const { name } of db.prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as Array<{ name: string }>) {
      result[name] = (db.prepare(`SELECT * FROM "${name}"`).all() as unknown[]).map((row) => JSON.stringify(row)).sort();
    }
    return result;
  } finally {
    db.close();
  }
}

/**
 * Hashes of every file. SQLite's own `-shm` index and an empty `-wal` file
 * are left out: a read-only connection to a WAL Store may create them. A
 * `-wal` file with any frame counts, because it holds written pages.
 */
function fileHashes(root: string): Record<string, string> {
  const out: Record<string, string> = {};
  const visit = (dir: string) => {
    for (const name of readdirSync(dir).sort()) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) visit(full);
      else if (name.endsWith("-shm") || (name.endsWith("-wal") && statSync(full).size === 0)) continue;
      else out[path.relative(root, full)] = createHash("sha256").update(readFileSync(full)).digest("hex");
    }
  };
  if (existsSync(root)) visit(root);
  return out;
}

/** The table and key columns of the candidate query that an expectation key belongs to. */
function locate(rule: StoreFixedRuleId, key: string): { table: string; columns: readonly string[] } {
  const parts = key.split("|").length;
  const query = STORE_FIXED_RULES.find((candidate) => candidate.id === rule)!.candidates.find((candidate) => candidate.key.length === parts)!;
  const table = rule === "STORE-RULE-003" ? "installation_steps" : query.table;
  return { table, columns: rule === "STORE-RULE-008" ? ["checkout_id", "record_path"] : query.key };
}

function readRow(rule: StoreFixedRuleId, key: string): Record<string, unknown> | undefined {
  const { table, columns } = locate(rule, key);
  const values = key.split("|").slice(0, columns.length);
  const { db } = openStoreForReview(path.join(store, "store.db"), "test read");
  try {
    return db.prepare(`SELECT * FROM ${table} WHERE ${columns.map((column) => `CAST(${column} AS TEXT) = ?`).join(" AND ")}`).get(...values) as Record<string, unknown> | undefined;
  } finally {
    db.close();
  }
}

function planned_has(report: StoreCleanReport, table: string): boolean {
  return report.check.rules.some((rule) => rule.act.entries.some((entry) => locate(rule.id, entry.key).table === table));
}

function engineOutcomes(env: StoreMaintenanceEnvironment) {
  const outcomes = new Map<string, Map<string, { outcome: string; ruleOutcome: string }>>();
  return withStoreDatabase(store, (db) => {
    for (const evaluation of evaluateStoreRules(db, env, { simulateRule005: false })) {
      outcomes.set(evaluation.rule.id, new Map(evaluation.rows.map((row) => [row.key, { outcome: row.outcome, ruleOutcome: row.ruleOutcome }])));
    }
    const decisions = evaluateStoreDecisions(db, env);
    return { outcomes, decisions };
  });
}

describe.skipIf(!sqliteAvailable)("W32 R0 P4 rule engine on the P1 fixture Stores", () => {
  for (const fixture of STORE_MAINTENANCE_FIXTURES) {
    it(`${fixture.id}: reaches the fixture answers and the reference evaluator`, () => {
      seed(fixture);
      const forced = engineOutcomes(fixtureEnv({ activeRules: ALL_RULES }));
      const today = engineOutcomes(fixtureEnv());
      for (const expectation of fixture.expected) {
        if (expectation.target.startsWith("STORE-DECISION")) {
          const found = forced.decisions.some((item) => item.id === expectation.target && item.key === expectation.key);
          expect(found ? "act" : "keep", `${fixture.id} ${expectation.target} ${expectation.key}`).toBe(expectation.outcome);
          continue;
        }
        const row = forced.outcomes.get(expectation.target)?.get(expectation.key);
        expect(row?.ruleOutcome ?? "keep", `${fixture.id} ${expectation.target} ${expectation.key}`).toBe(expectation.outcome);
      }
      // Today an inactive rule never acts, and an active rule gives its own outcome.
      for (const rule of STORE_FIXED_RULES) {
        for (const [key, row] of today.outcomes.get(rule.id) ?? []) {
          if (rule.activation.state === "inactive") expect(row.outcome, `${fixture.id} ${rule.id} ${key}`).toBe("skip");
          else expect(row.outcome, `${fixture.id} ${rule.id} ${key}`).toBe(row.ruleOutcome);
        }
      }
      // The engine and the P1 reference evaluator agree on every candidate.
      const reference = withStoreDatabase(store, (db) => evaluateStoreFixture(db, fixture, makeFixtureEnv(temp), { asIfActive: true }));
      for (const rule of STORE_FIXED_RULES) {
        const engine = Object.fromEntries([...(forced.outcomes.get(rule.id) ?? [])].map(([key, row]) => [key, row.ruleOutcome]));
        expect(engine, `${fixture.id} ${rule.id}`).toEqual(Object.fromEntries(reference.get(rule.id) ?? []));
      }
    });
  }

  it("keeps a lock whose path this computer cannot describe", () => {
    seed(STORE_MAINTENANCE_FIXTURES.find((fixture) => fixture.id === "SMF-001")!);
    const { outcomes } = engineOutcomes(fixtureEnv({ comparisonKey: () => { throw new Error("cannot describe"); } }));
    expect(outcomes.get("STORE-RULE-001")!.get("/fixture/dead")).toEqual({ outcome: "skip", ruleOutcome: "skip" });
  });
});

describe("W32 R0 P4 package-manager-idle proof", () => {
  const metadata = (value: unknown) => JSON.stringify(value);
  const npmUpdate = { manager: "npm", command: "npm install -g @brucewaynedecoy/make-docs@latest", binaryPath: "/opt/homebrew/lib/node_modules/@brucewaynedecoy/make-docs/dist/index.js" };
  const brewUpgrade = { manager: "brew", command: "brew upgrade make-docs", binaryPath: "/opt/homebrew/bin/make-docs" };
  const pnpmUpdate = { manager: "pnpm", command: "pnpm add -g @brucewaynedecoy/make-docs@latest", binaryPath: "/x" };
  const bunUpdate = { manager: "bun", command: "bun add -g @brucewaynedecoy/make-docs@latest", binaryPath: "/x" };
  const idle = ["/sbin/launchd", "-zsh", "/Applications/Ghostty.app/Contents/MacOS/ghostty", "node /opt/homebrew/lib/node_modules/@brucewaynedecoy/make-docs/dist/index.js mcp"];
  const proof = (value: object, lines: string[]) => packageManagerIdleProof(metadata(value), lines).result;

  /** Command lines as `ps -A -ww -o args=` prints them for real package manager runs. */
  const RUNS = {
    npm: [
      "npm install -g @brucewaynedecoy/make-docs@latest",
      "node /opt/homebrew/bin/npm install -g @brucewaynedecoy/make-docs@latest",
      "node /opt/homebrew/lib/node_modules/npm/bin/npm-cli.js install -g @brucewaynedecoy/make-docs@latest",
      "/usr/local/bin/node /usr/local/lib/node_modules/npm/bin/npm-cli.js update -g",
      // npm changes its process title. The title can drop every argument.
      "npm",
      "npm exec",
    ],
    pnpm: [
      "node /Users/person/Library/pnpm/.tools/pnpm/9.12.0/node_modules/pnpm/bin/pnpm.cjs add -g @brucewaynedecoy/make-docs@latest",
      "/Users/person/Library/pnpm/pnpm add -g @brucewaynedecoy/make-docs",
      "pnpm",
    ],
    bun: [
      "/Users/person/.bun/bin/bun add -g @brucewaynedecoy/make-docs@latest",
      "bun install --global",
    ],
    brew: [
      "/opt/homebrew/Library/Homebrew/vendor/portable-ruby/current/bin/ruby -W1 --disable=gems,rubyopt /opt/homebrew/Library/Homebrew/brew.rb upgrade make-docs",
      "/bin/bash -p /opt/homebrew/Library/Homebrew/brew.sh upgrade make-docs",
      "/bin/bash /opt/homebrew/bin/brew update",
    ],
  };

  it("proves idle only when no process names the recorded manager or the make-docs package", () => {
    expect(proof(npmUpdate, idle)).toBe("proven");
    expect(proof(brewUpgrade, idle)).toBe("proven");
    // Another manager's run that does not name make-docs does not refute npm.
    expect(proof(npmUpdate, [...idle, ...RUNS.pnpm.slice(2), "bun install --global"])).toBe("proven");
  });

  for (const [manager, lines] of Object.entries(RUNS)) {
    it(`counts every real ${manager} process line as running, also with a changed process title`, () => {
      const recorded = { npm: npmUpdate, pnpm: pnpmUpdate, bun: bunUpdate, brew: brewUpgrade }[manager as keyof typeof RUNS];
      for (const line of lines) expect(proof(recorded, [...idle, line]), line).toBe("refuted");
    });
  }

  it("counts a process that names the make-docs package as running, whatever the manager", () => {
    // yarn is not a recorded manager, but its run installs make-docs.
    expect(proof(npmUpdate, [...idle, "node /usr/local/bin/yarn global add @brucewaynedecoy/make-docs"])).toBe("refuted");
    expect(proof(npmUpdate, [...idle, RUNS.brew[0]!])).toBe("refuted");
    expect(proof(brewUpgrade, [...idle, RUNS.npm[1]!])).toBe("refuted");
    // A manager that renamed itself but kept the package argument.
    expect(proof(npmUpdate, [...idle, "node-updater make-docs@latest"])).toBe("refuted");
    expect(proof(pnpmUpdate, [...idle, "yarn dlx make-docs"])).toBe("refuted");
  });

  it("gives unknown on any doubt", () => {
    expect(packageManagerIdleProof(metadata(npmUpdate), null).result).toBe("unknown");
    expect(packageManagerIdleProof(metadata(npmUpdate), []).result).toBe("unknown");
    expect(packageManagerIdleProof("{not json", idle).result).toBe("unknown");
    expect(proof({ ...npmUpdate, manager: "yarn", command: "yarn global add make-docs" }, idle)).toBe("unknown");
    expect(proof({ manager: "npm", binaryPath: npmUpdate.binaryPath }, idle)).toBe("unknown");
    expect(proof({ ...npmUpdate, command: "npm " }, idle)).toBe("unknown");
    // A process whose command line the system hides could be the manager or its interpreter.
    expect(proof(npmUpdate, [...idle, "(node)"])).toBe("unknown");
    expect(proof(npmUpdate, [...idle, "(npm)"])).toBe("unknown");
    expect(proof(brewUpgrade, [...idle, "(ruby)"])).toBe("unknown");
    expect(proof(npmUpdate, [...idle, "[kworker/0:1]"])).toBe("proven");
  });

  it("never reads binaryPath: the running Make Docs CLI and MCP server do not refute it", () => {
    expect(proof(npmUpdate, [`node ${npmUpdate.binaryPath} setup store check`, "node /opt/homebrew/bin/make-docs mcp"])).toBe("proven");
  });
});

describe.skipIf(!sqliteAvailable)("W32 R0 P4 setup store check (A15)", () => {
  it("writes nothing, reports in plain words first, and lists skips, decisions, and leftovers", () => {
    for (const fixture of COMBINABLE) seed(fixture);
    const before = fileHashes(store);
    const report = checkStore(store, fixtureEnv());
    expect(fileHashes(store)).toEqual(before);
    for (const fixture of STORE_MAINTENANCE_FIXTURES) {
      const own = path.join(temp, `store-${fixture.id}`);
      withStoreDatabase(own, (db) => { db.exec("BEGIN IMMEDIATE"); fixture.seed(db, makeFixtureEnv(temp)); db.exec("COMMIT"); });
      const ownBefore = fileHashes(own);
      checkStore(own, fixtureEnv());
      expect(fileHashes(own), fixture.id).toEqual(ownBefore);
    }
    expect(report.changedNothing).toBe(true);
    expect(report.summary).toMatch(/^Clean would remove or trim \d+ rows \(about [\d.]+ (B|KB|MB)\) under \d+ rules\./);
    expect(report.summary).toContain("Nothing was changed.");
    const rule = (id: StoreFixedRuleId) => report.rules.find((entry) => entry.id === id)!;
    expect(rule("STORE-RULE-002").state).toBe("inactive");
    expect(rule("STORE-RULE-002").act.rows).toBe(0);
    expect(rule("STORE-RULE-002").skipped.entries.find((entry) => entry.key === "tool-abandoned")!.reason).toContain("Once on, it would act on this row.");
    expect(rule("STORE-RULE-001").skipped.entries.find((entry) => entry.key === "/fixture/remote")!.reason).toContain("cannot be checked from this computer");
    expect(rule("STORE-RULE-004").state).toBe("active");
    expect(rule("STORE-RULE-005").state).toBe("active");
    expect(rule("STORE-RULE-004").act.entries.map((entry) => entry.key)).toEqual(expect.arrayContaining(["op-old", "op-rolled", "op-old-remove"]));
    expect(rule("STORE-RULE-004").skipped.entries.map((entry) => entry.key)).toEqual(expect.arrayContaining(["op-handoff", "op-no-receipt", "op-stale-receipt"]));
    expect(rule("STORE-RULE-001").act.bytes).toBeGreaterThan(0);
    expect(report.decisions.map((item) => item.id)).toEqual(expect.arrayContaining(["STORE-DECISION-001", "STORE-DECISION-002", "STORE-DECISION-003"]));
    const leftovers = new Set(report.leftovers.map((leftover) => leftover.id));
    for (const id of ["STORE-LEFTOVER-001", "STORE-LEFTOVER-002", "STORE-LEFTOVER-003", "STORE-LEFTOVER-004", "STORE-LEFTOVER-005", "STORE-LEFTOVER-006", "STORE-LEFTOVER-007"]) {
      expect(leftovers.has(id as never), id).toBe(true);
    }
    expect(report.leftovers.find((leftover) => leftover.id === "STORE-LEFTOVER-001" && leftover.key === "/fixture/dead")!.clearedByClean).toBe(true);
    expect(report.leftovers.find((leftover) => leftover.id === "STORE-LEFTOVER-007")!.nextAction).toContain("make-docs project layout verify op-layout");
    const text = renderStoreCheck(report);
    expect(text.split("\n")[0]).toBe(`Store check: ${report.summary}`);
    expect(text).toContain("STORE-RULE-002 Abandoned tool update or uninstall (not on yet)");
    expect(text).toContain("Needs your decision (never removed by a rule):");
    expect(text).toContain("Crash leftovers that block this computer:");
    expect(text).toContain("Next: Run make-docs setup store clean");
  });

  it("plans STORE-RULE-003 and 004 after STORE-RULE-005 removes the same operation's plans, and clean does it in one run", () => {
    seed(STORE_MAINTENANCE_FIXTURES.find((fixture) => fixture.id === "SMF-004")!);
    const report = checkStore(store, fixtureEnv());
    const rule = (id: StoreFixedRuleId) => report.rules.find((entry) => entry.id === id)!;
    expect(rule("STORE-RULE-003").act.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "op-1|1", reason: expect.stringContaining("After STORE-RULE-005") }),
      expect.objectContaining({ key: "op-atomic|1", reason: expect.stringContaining("After STORE-RULE-005") }),
    ]));
    expect(rule("STORE-RULE-004").act.entries.map((entry) => entry.key).sort()).toEqual(["op-1", "op-atomic"]);
    const clean = cleanStore(store, fixtureEnv());
    const changed = Object.fromEntries(clean.rules.map((entry) => [entry.id, entry.changed]));
    expect(changed).toMatchObject({ "STORE-RULE-005": 4, "STORE-RULE-003": 2, "STORE-RULE-004": 2 });
    expect(clean.totals.skippedRows).toBe(0);
    // The pending operation's plan and intent, and the recent plan, stay.
    for (const key of ["c-plans|snapshot|detached:op-10", "c-plans|backup|atomic:op-10:1", "c-plans|snapshot|detached:op-recent", "c-plans|snapshot|detached:op-missing"]) {
      expect(readRow("STORE-RULE-005", key), key).toBeDefined();
    }
  });

  it("gives the same result through the registry for the CLI and an MCP caller, and the MCP tool is read only in setup", async () => {
    seed(STORE_MAINTENANCE_FIXTURES.find((fixture) => fixture.id === "SMF-007")!);
    const now = () => FIXTURE_NOW.toISOString();
    const project = path.join(temp, "project");
    mkdirSync(project);
    const before = fileHashes(store);
    const cli = (await invokeOperation("setup.store.check", {}, createExecutionContext({ surface: "cli", route: "direct-cli", storeRoot: store, cwd: project, now }))).value;
    const mcpShaped = (await invokeOperation("setup.store.check", {}, createExecutionContext({ surface: "test", storeRoot: store, cwd: project, now, storeSession: async (_access, _operation, _declared, _root, run) => run() }))).value;
    expect(cli).toEqual(mcpShaped);
    expect((cli as unknown as StoreCheckReport).rules.find((rule) => rule.id === "STORE-RULE-008")!.act.rows).toBe(2);
    expect(fileHashes(store)).toEqual(before);
    const tool = MAKE_DOCS_MCP_TOOLS.find((candidate) => candidate.name === "setup_store_check")!;
    expect(tool.mcp!.profiles).toEqual(["setup"]);
    expect(getOperation("setup.store.check")).toMatchObject({ mutates: "read", access: { store: "read", project: "none", hostConfig: "none" } });
    expect(getOperation("setup.store.clean")).toMatchObject({ mutates: "write", access: { store: "write", project: "none", hostConfig: "none" } });
    expect(MAKE_DOCS_MCP_TOOLS.find((candidate) => candidate.name === "setup_store_clean")!.mcp!.profiles).toEqual(["setup"]);
    expect(operationCliCommand("setup.store.check")).toBe("make-docs setup store check [--json]");
    expect(NAME_CATALOG.filter((entry) => entry.id.startsWith("setup.store."))).toEqual([
      expect.objectContaining({ id: "setup.store.check", status: "current", currentCli: "setup store check", currentMcp: "setup_store_check" }),
      expect.objectContaining({ id: "setup.store.clean", status: "current", currentCli: "setup store clean", currentMcp: "setup_store_clean" }),
    ]);
  });

  it("reads a Store that was changed outside Make Docs, without writing, and clean refuses it as store-unsafe", async () => {
    seed(STORE_MAINTENANCE_FIXTURES.find((fixture) => fixture.id === "SMF-007")!);
    const { DatabaseSync } = await import("node:sqlite");
    const raw = new DatabaseSync(path.join(store, "store.db"));
    raw.exec(`DROP TRIGGER ${storeWriteGuardTriggerName("backlog_review_cache", "delete")}`);
    raw.close();
    const before = fileHashes(store);
    const project = path.join(temp, "project");
    mkdirSync(project);
    const ctx = (writesAllowed: boolean) => createExecutionContext({ surface: "cli", route: "direct-cli", storeRoot: store, cwd: project, writesAllowed, now: () => FIXTURE_NOW.toISOString() });
    const report = (await invokeOperation("setup.store.check", {}, ctx(false))).value as unknown as StoreCheckReport;
    expect(report.store.guardIntact).toBe(false);
    expect(report.store.guardProblems).toEqual(["Table backlog_review_cache has no BEFORE DELETE guard trigger."]);
    expect(report.summary).toContain("The Store was changed outside Make Docs.");
    expect(report.notes[0]).toContain("Check read it without writing. Clean refuses");
    expect(report.nextAction).toContain("Do not write the Store.");
    expect(fileHashes(store)).toEqual(before);
    const refusal = await invokeOperation("setup.store.clean", { yes: true }, ctx(true)).catch((error: unknown) => error);
    expect(refusal).toBeInstanceOf(StoreAccessStateError);
    expect(refusal).toMatchObject({ code: "store-unsafe" });
    expect((refusal as StoreAccessStateError).nextAction).toContain("make-docs setup store check");
    expect(() => cleanStore(store, fixtureEnv())).toThrow(/changed outside Make Docs/);
    expect(fileHashes(store)).toEqual(before);
  });

  it("returns the typed Store outcome for a missing Store and writes no Store file", async () => {
    const project = path.join(temp, "project");
    mkdirSync(project);
    for (const id of ["setup.store.check", "setup.store.clean"]) {
      const error = await invokeOperation(id, id === "setup.store.clean" ? { yes: true } : {}, createExecutionContext({ surface: "cli", route: "direct-cli", storeRoot: store, cwd: project, writesAllowed: true })).catch((caught: unknown) => caught);
      expect(error, id).toBeInstanceOf(StoreAccessStateError);
      expect(error, id).toMatchObject({ code: "store-unavailable" });
    }
    expect(existsSync(store)).toBe(false);
  });
});

describe.skipIf(!sqliteAvailable)("W32 R0 P4 setup store clean (A16, A17)", () => {
  for (const fixture of STORE_MAINTENANCE_FIXTURES) {
    it(`${fixture.id}: removes only the rows its active rules prove, and the backup restores the Store exactly`, () => {
      seed(fixture);
      const start = dump();
      const env = fixtureEnv();
      const report = cleanStore(store, env);
      const after = dump();
      const touched = new Set<string>();
      for (const expectation of fixture.expected) {
        if (expectation.target.startsWith("STORE-DECISION")) continue;
        const rule = STORE_FIXED_RULES.find((candidate) => candidate.id === expectation.target)!;
        const acts = report.check.rules.find((entry) => entry.id === rule.id)!.act.entries.some((entry) => entry.key === expectation.key);
        if (expectation.outcome === "act" && rule.activation.state === "active") expect(acts, `${fixture.id} ${rule.id} ${expectation.key} planned`).toBe(true);
        const row = readRow(rule.id, expectation.key);
        const label = `${fixture.id} ${rule.id} ${expectation.key}`;
        if (!acts) {
          // A keep or skip row stays exactly as it was.
          if (row) expect(start[locate(rule.id, expectation.key).table], label).toContain(JSON.stringify(row));
          continue;
        }
        touched.add(locate(rule.id, expectation.key).table);
        if (rule.action === "delete-row") expect(row, label).toBeUndefined();
        if (rule.action === "strip-saved-bytes") {
          expect(String(row!.before_json) + String(row!.after_json), label).not.toContain("contentBase64");
        }
        if (rule.action === "null-full-ledgers") {
          expect(row!.before_ledger === null || row!.before_ledger === "null", label).toBe(true);
          expect(row!.after_ledger === null || row!.after_ledger === "null", label).toBe(true);
          expect(row!.step_count, label).not.toBeNull();
        }
      }
      // Every row that no active rule acts on stays exactly as it was. Tables no rule touched are identical.
      for (const table of Object.keys(start)) {
        if (!touched.has(table) && !planned_has(report, table)) expect(after[table], `${fixture.id} ${table}`).toEqual(start[table]);
      }
      // In each table, exactly the rows that the check planned changed.
      const planned = new Map<string, number>();
      for (const rule of report.check.rules) {
        for (const entry of rule.act.entries) {
          const table = locate(rule.id, entry.key).table;
          planned.set(table, (planned.get(table) ?? 0) + 1);
        }
      }
      for (const table of Object.keys(start)) {
        const removedOrChanged = start[table]!.filter((row) => !after[table]!.includes(row));
        expect(removedOrChanged.length, `${fixture.id} ${table}`).toBe(planned.get(table) ?? 0);
      }
      const acted = report.totals.changedRows;
      if (acted === 0) {
        expect(report.backup).toBeNull();
        expect(after).toEqual(start);
        return;
      }
      expect(report.backup!.path.startsWith(path.join(store, "backup") + path.sep)).toBe(true);
      if (process.platform !== "win32") expect(statSync(report.backup!.path).mode & 0o777).toBe(0o600);
      expect(report.restore).toEqual([
        "Stop every Make Docs command and MCP server on this computer.",
        `Copy ${report.backup!.path} over ${path.join(store, "store.db")}.`,
        `Delete ${path.join(store, "store.db")}-wal and ${path.join(store, "store.db")}-shm if they exist.`,
        "Run make-docs project state status in a project to check the Store.",
      ]);
      // Restore by the reported steps reproduces every row, the schema, and user_version.
      copyFileSync(report.backup!.path, path.join(store, "store.db"));
      rmSync(path.join(store, "store.db-wal"), { force: true });
      rmSync(path.join(store, "store.db-shm"), { force: true });
      expect(dump()).toEqual(start);
      // The restored Store opens through Make Docs with its guard intact.
      withStoreDatabase(store, (db) => db.prepare("SELECT 1").get());
    });
  }

  it("never removes a keep row, a decision item, or project content, and reports each rule, space, backup, and restore", () => {
    for (const fixture of COMBINABLE) seed(fixture);
    withStoreDatabase(store, (db) => {
      db.prepare("INSERT INTO work_evidence VALUES (?,?,?,?,?,?,?)").run("project-runs", "w1", "docs/work/x.md", "decision", '{"ok":true}', "/repo", "2030-01-01T00:00:00.000Z");
      db.prepare("INSERT INTO installation_ledgers VALUES (?,?,?)").run("c-present", '{"files":{}}', "2030-01-01T00:00:00.000Z");
    });
    const start = dump();
    const report = cleanStore(store, fixtureEnv());
    const after = dump();
    for (const table of ["work_evidence", "runs", "run_evidence", "installation_checkouts", "installation_ledgers", "playbook_runs", "projects", "project_register", "store_schema_journal", "store_migration_receipts", "installation_transfers"]) {
      expect(after[table], table).toEqual(start[table]);
    }
    // Decision items stay: the missing-folder checkout, the forgotten runs, the pending legacy recovery.
    expect(after.installation_operations!.some((row) => row.includes('"op-legacy"') && row.includes('"pending"'))).toBe(true);
    expect(report.rules.find((rule) => rule.id === "STORE-RULE-002")!.changed).toBe(0);
    expect(report.rules.find((rule) => rule.id === "STORE-RULE-006")!.changed).toBe(0);
    expect(report.space.vacuumed).toBe(true);
    expect(report.space.freedBytes).toBe(Math.max(0, report.space.beforeBytes - report.space.afterBytes));
    const text = renderStoreClean(report);
    expect(text.split("\n")[0]).toBe(`Store clean: ${report.summary}`);
    expect(text).toContain("Each rule:");
    expect(text).toContain(`Backup: ${report.backup!.path}`);
    expect(text).toContain("To restore this backup:");
    expect(text).toMatch(/Space: .* before, .* after, .* freed\./);
  });

  it("keeps the three newest clean backups and never removes another file in the backup folder", () => {
    seed(STORE_MAINTENANCE_FIXTURES.find((fixture) => fixture.id === "SMF-007")!);
    mkdirSync(path.join(store, "backup"), { recursive: true });
    writeFileSync(path.join(store, "backup", "notes.txt"), "keep me\n");
    const made: string[] = [];
    for (let run = 0; run < 5; run++) {
      withStoreDatabase(store, (db) => {
        db.prepare("INSERT OR IGNORE INTO backlog_review_cache VALUES (?,?,?,?,?,?,?,?,?)").run("c-cache", `docs/work/old-${run}.md`, "a".repeat(64), 1, 1, 1, "{}", "2030-01-01T00:00:00.000Z", "2030-01-01T00:00:00.000Z");
      });
      const report = cleanStore(store, fixtureEnv({ now: new Date(FIXTURE_NOW.getTime() + run * 60_000) }));
      made.push(report.backup!.path);
    }
    expect(listStoreCleanBackups(store)).toEqual(made.slice(2).reverse());
    expect(readdirSync(path.join(store, "backup")).sort()).toEqual([...made.slice(2).map((file) => path.basename(file)), "notes.txt"].sort());
  });

  it("changes nothing and makes no backup in a dry run or when no rule proves a row", async () => {
    seed(STORE_MAINTENANCE_FIXTURES.find((fixture) => fixture.id === "SMF-007")!);
    const before = fileHashes(store);
    const dry = cleanStore(store, fixtureEnv(), { dryRun: true });
    expect(dry).toMatchObject({ dryRun: true, backup: null, totals: { changedRows: 0 } });
    expect(dry.check.totals.actRows).toBe(2);
    expect(fileHashes(store)).toEqual(before);
    cleanStore(store, fixtureEnv());
    const settled = fileHashes(path.join(store));
    const empty = cleanStore(store, fixtureEnv());
    expect(empty).toMatchObject({ backup: null, totals: { changedRows: 0 } });
    expect(empty.summary).toContain("No backup was made");
    expect(fileHashes(store)).toEqual(settled);
  });

  it("needs the write permission and one confirmation", async () => {
    seed(STORE_MAINTENANCE_FIXTURES.find((fixture) => fixture.id === "SMF-007")!);
    const project = path.join(temp, "project");
    mkdirSync(project);
    const ctx = (writesAllowed: boolean, dryRun = false) => createExecutionContext({ surface: "cli", route: "direct-cli", storeRoot: store, cwd: project, writesAllowed, dryRun });
    const before = fileHashes(store);
    await expect(invokeOperation("setup.store.clean", { yes: true }, ctx(false))).rejects.toBeInstanceOf(OperationWriteDeniedError);
    await expect(invokeOperation("setup.store.clean", {}, ctx(true))).rejects.toThrow(/needs one confirmation/);
    expect(fileHashes(store)).toEqual(before);
    const dry = (await invokeOperation("setup.store.clean", {}, ctx(true, true))).value as unknown as StoreCleanReport;
    expect(dry.dryRun).toBe(true);
    expect(fileHashes(store)).toEqual(before);
    const done = (await invokeOperation("setup.store.clean", { yes: true }, ctx(true))).value as unknown as StoreCleanReport;
    expect(done.totals.changedRows).toBe(2);
  });
});

describe.skipIf(!sqliteAvailable)("W32 R0 P4 compare-and-change (R-MAINT-7)", () => {
  it("skips a row that changed after the check and keeps its new value", () => {
    seed(STORE_MAINTENANCE_FIXTURES.find((fixture) => fixture.id === "SMF-003")!);
    const changed = JSON.stringify({ kind: "file", digest: "changed", contentBase64: "Y2hhbmdlZA==" });
    const report = cleanStore(store, fixtureEnv(), {
      testHooks: { afterPlan: (db) => { db.prepare("UPDATE installation_steps SET after_json = ? WHERE operation_id = 'op-old' AND ordinal = 2").run(changed); } },
    });
    const rule003 = report.rules.find((rule) => rule.id === "STORE-RULE-003")!;
    expect(rule003.changed).toBe(1);
    expect(rule003.skipped.entries.find((entry) => entry.key === "op-old|2")!.reason).toContain("It changed after the check");
    expect(readRow("STORE-RULE-003", "op-old|2")!.after_json).toBe(changed);
    expect(String(readRow("STORE-RULE-003", "op-old|5")!.after_json)).not.toContain("contentBase64");
  });

  it("skips a lock whose owner came back, and a lock that a new pending operation now guards", () => {
    seed(STORE_MAINTENANCE_FIXTURES.find((fixture) => fixture.id === "SMF-001")!);
    let alive = false;
    const report = cleanStore(store, fixtureEnv({ liveness: (pid, host) => (alive && pid === FIXTURE_DEAD_PID ? "alive" : fixtureLiveness(pid, host)) }), {
      testHooks: { afterPlan: () => { alive = true; } },
    });
    const rule001 = report.rules.find((rule) => rule.id === "STORE-RULE-001")!;
    expect(rule001.changed).toBe(0);
    expect(rule001.skipped.entries.find((entry) => entry.key === "/fixture/dead")!.reason).toContain("It changed after the check: Its owner process is still running.");
    expect(readRow("STORE-RULE-001", "/fixture/dead")).toBeDefined();
  });

  it("takes the backup again when another connection commits between the backup and the write lock", () => {
    seed(STORE_MAINTENANCE_FIXTURES.find((fixture) => fixture.id === "SMF-007")!);
    const report = cleanStore(store, fixtureEnv(), {
      testHooks: {
        afterBackup: (attempt) => {
          if (attempt > 0) return;
          const other = openStoreSqliteConnection(path.join(store, "store.db"), {}, "test writer");
          try { other.prepare("INSERT INTO runs (project_id, run_id, run_type, lifecycle_stage, status, checkpoint, version, metadata, started_at, updated_at, finished_at) VALUES ('p','late','lifecycle','implementation','active',NULL,1,'{}',?,?,NULL)").run(FIXTURE_NOW.toISOString(), FIXTURE_NOW.toISOString()); } finally { other.close(); }
        },
      },
    });
    expect(report.totals.changedRows).toBe(2);
    expect(listStoreCleanBackups(store)).toEqual([report.backup!.path]);
    // The backup holds the late run: it is the exact start state of the transaction.
    const backup = dump(store, report.backup!.path);
    expect(backup.runs!.some((row) => row.includes('"late"'))).toBe(true);
  });
});

describe.skipIf(!sqliteAvailable)("W32 R0 P4 rules 002 and 006 with the rule forced on", () => {
  it("marks an abandoned tool update failed and keeps a busy one pending", () => {
    seed(STORE_MAINTENANCE_FIXTURES.find((fixture) => fixture.id === "SMF-002")!);
    const report = cleanStore(store, fixtureEnv({ activeRules: ALL_RULES }));
    expect(report.rules.find((rule) => rule.id === "STORE-RULE-002")!.changed).toBe(1);
    const abandoned = readRow("STORE-RULE-002", "tool-abandoned")!;
    expect(abandoned.status).toBe("failed");
    expect(JSON.parse(String(abandoned.metadata_json))).toMatchObject({ manager: "npm", outcome: "abandoned", reason: "abandoned", changeOutcome: "unknown" });
    for (const key of ["tool-busy", "tool-live", "tool-remote", "tool-unchecked", "machine-setup"]) expect(readRow("STORE-RULE-002", key)!.status, key).toBe("pending");
  });

  it("removes only the unbound barrier whose lock is gone", () => {
    seed(STORE_MAINTENANCE_FIXTURES.find((fixture) => fixture.id === "SMF-005")!);
    cleanStore(store, fixtureEnv({ activeRules: ALL_RULES }));
    expect(readRow("STORE-RULE-006", "c-q-gone|quiescence|legacy")).toBeUndefined();
    for (const id of ["held", "bad", "pending", "imported", "bound"]) expect(readRow("STORE-RULE-006", `c-q-${id}|quiescence|legacy`), id).toBeDefined();
  });
});

describe.skipIf(!sqliteAvailable)("W32 R0 P4 crash leftovers (A18)", () => {
  it("clears a dead-owner lock, and then tool update, uninstall, and Store removal work again", async () => {
    const project = path.join(temp, "project");
    mkdirSync(project);
    withStoreDatabase(store, (db) => {
      db.prepare("INSERT INTO installation_locks VALUES (?,?,?,?,?)").run(path.join(temp, "crashed"), "token-crashed", FIXTURE_DEAD_PID, FIXTURE_HOST, FIXTURE_NOW.toISOString());
    });
    const metadata = { manager: "npm", command: "npm install -g @brucewaynedecoy/make-docs@latest", binaryPath: "/x" };
    await expect(runRecordedToolOperation(project, store, "tool.update", metadata, async () => ({ exitCode: 0 }))).rejects.toThrow(/checkout writer is pending/);
    expect(() => withStoreRemovalLock(project, store, () => "removed")).toThrow(/Store removal is blocked/);
    const check = checkStore(store, fixtureEnv());
    expect(check.leftovers).toEqual([expect.objectContaining({ id: "STORE-LEFTOVER-001", clearedByClean: true })]);
    expect(cleanStore(store, fixtureEnv()).totals.changedRows).toBe(1);
    expect(checkStore(store, fixtureEnv()).leftovers).toEqual([]);
    await expect(runRecordedToolOperation(project, store, "tool.update", metadata, async () => ({ exitCode: 0 }))).resolves.toMatchObject({ result: { exitCode: 0 } });
    await expect(runRecordedToolOperation(project, store, "tool.uninstall", metadata, async () => ({ exitCode: 0 }))).resolves.toMatchObject({ result: { exitCode: 0 } });
    expect(withStoreRemovalLock(project, store, () => "removed")).toBe("removed");
  });

  it("keeps a lock that guards an unfinished change and names the recovery command", () => {
    seed(STORE_MAINTENANCE_FIXTURES.find((fixture) => fixture.id === "SMF-001")!);
    const report = checkStore(store, fixtureEnv());
    expect(report.leftovers.find((leftover) => leftover.key === "/fixture/guarded")).toMatchObject({ id: "STORE-LEFTOVER-005", clearedByClean: false });
    expect(report.leftovers.find((leftover) => leftover.key === "/fixture/guarded")!.nextAction).toContain("make-docs project state recover");
    cleanStore(store, fixtureEnv());
    expect(readRow("STORE-RULE-001", "/fixture/guarded")).toBeDefined();
  });
});

describe.skipIf(!sqliteAvailable)("W32 R0 P4 rules 004 and 005 against the real readers", () => {
  it("prunes a finished layout operation's plan, saved bytes, and ledgers, and layout apply and recover still read it as complete", () => {
    const project = path.join(temp, "project");
    mkdirSync(path.join(project, "docs/artifacts"), { recursive: true });
    writeFileSync(path.join(project, "docs/artifacts/note.md"), "# Shared note\n");
    const prepared = prepareProjectLayout(project, previewProjectLayout(project).digest, "cli", [], store);
    expect(applyProjectLayout(project, prepared.operationId, "apply", false, store)).toMatchObject({ status: "completed" });
    const files = fileHashes(project);
    const statusBefore = readInstallationStatus(project, store);
    const ledgerBefore = withInstallationDatabase(project, (db) => db.prepare("SELECT * FROM installation_ledgers").all(), { storeRoot: store, readOnly: true });
    // Forty days later the operation is past the retention window.
    const later = defaultStoreMaintenanceEnvironment(CLI_STORE_MAINTENANCE_VERSIONS, new Date(Date.now() + 40 * 24 * 60 * 60 * 1000));
    const report = cleanStore(store, { ...later, liveness: () => "unknown" });
    const changed = (id: StoreFixedRuleId) => report.rules.find((rule) => rule.id === id)!.changed;
    // Its plan and atomic write intent go, then its saved bytes. A bare layout has no ledgers for STORE-RULE-004.
    expect(changed("STORE-RULE-005")).toBe(2);
    expect(changed("STORE-RULE-003")).toBeGreaterThanOrEqual(1);
    expect(report.totals.skippedRows).toBe(0);
    expect(readDetachedInstallationOperation(project, prepared.operationId, "project.layout.prepare", store, { allowPruned: true })).toEqual({ status: "completed", plan: null, planPruned: true });
    expect(applyProjectLayout(project, prepared.operationId, "apply", false, store)).toMatchObject({ status: "already-complete", planPruned: true });
    expect(recoverInstallationOperation(project, prepared.operationId, "resume", true, store)).toMatchObject({ status: "completed", conflicts: [] });
    expect(recoverInstallationOperation(project, prepared.operationId, "rollback", true, store).status).toBe("completed");
    expect(withInstallationDatabase(project, (db) => db.prepare("SELECT * FROM installation_ledgers").all(), { storeRoot: store, readOnly: true })).toEqual(ledgerBefore);
    expect(readInstallationStatus(project, store).status).toBe(statusBefore.status);
    expect(fileHashes(project)).toEqual(files);
  });
});

describe.skipIf(!sqliteAvailable || !existsSync(CLI))("W32 R0 P4 built CLI", () => {
  const run = (args: string[]) => spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", cwd: mkdirSync(path.join(temp, "cwd"), { recursive: true }) ?? path.join(temp, "cwd"), env: { ...process.env, MAKE_DOCS_HOME: store, [HARNESS_CALLER_IDENTITY_ENV]: "" } });

  it("checks, refuses a non-interactive clean without --yes, and cleans with --yes", () => {
    seed(STORE_MAINTENANCE_FIXTURES.find((fixture) => fixture.id === "SMF-007")!);
    const help = run(["setup", "store", "--help"]);
    expect(help.stdout).toContain("make-docs setup store clean [--yes] [--dry-run] [--json]");
    const text = run(["setup", "store", "check"]);
    expect(text.status, text.stderr).toBe(0);
    expect(text.stdout.split("\n")[0]).toMatch(/^Store check: Clean would remove or trim 2 rows/);
    const json = JSON.parse(run(["setup", "store", "check", "--json"]).stdout) as StoreCheckReport;
    expect(json.kind).toBe("store-check");
    const before = fileHashes(store);
    const refused = run(["setup", "store", "clean"]);
    expect(refused.status).not.toBe(0);
    expect(refused.stderr + refused.stdout).toContain("needs one confirmation");
    expect(fileHashes(store)).toEqual(before);
    const cleaned = run(["setup", "store", "clean", "--yes", "--json"]);
    expect(cleaned.status, cleaned.stderr).toBe(0);
    const report = JSON.parse(cleaned.stdout) as StoreCleanReport;
    expect(report.totals.changedRows).toBe(2);
    expect(existsSync(report.backup!.path)).toBe(true);
  });
});

describe.skipIf(!sqliteAvailable || !existsSync(CLI))("W32 R0 P4 real setup, MCP parity, and the removal handoff", () => {
  const cli = (args: string[], cwd: string) => spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", cwd, env: { ...process.env, MAKE_DOCS_HOME: store, [HARNESS_CALLER_IDENTITY_ENV]: "" } });
  const json = (args: string[], cwd: string) => {
    const result = cli(args, cwd);
    if (result.status !== 0) throw new Error(`CLI failed: ${result.stderr || result.stdout}`);
    return JSON.parse(result.stdout) as Record<string, any>;
  };
  const days = (count: number) => defaultStoreMaintenanceEnvironment(CLI_STORE_MAINTENANCE_VERSIONS, new Date(Date.now() + count * 24 * 60 * 60 * 1000));

  it("matches CLI and MCP check results, honors the MCP access ceiling, nulls old setup ledgers, and keeps the removal handoff", async () => {
    const project = path.join(temp, "project");
    mkdirSync(project);
    const plan = prepareGenericMcpSetup({ clientLabel: "p4-store", storeRoot: store, executable: verifyMakeDocsExecutable({ executablePath: CLI }) });
    const connection = (plan.configuration as { mcpServers: { "make-docs": { env: Record<string, string> } } }).mcpServers["make-docs"].env;
    applyGenericMcpSetup(plan);
    const first = json(["setup", "--target", project, "--yes", "--no-codex", "--no-claude-code", "--no-skills", "--generic-mcp-client", "p4-store", "--json"], temp);
    expect(first.status, JSON.stringify(first).slice(0, 2000)).toBe("complete");
    vi.stubEnv(MCP_CONNECTION_ID_ENV, connection.MAKE_DOCS_MCP_CONNECTION_ID!);
    vi.stubEnv(MCP_CONNECTION_KEY_ENV, connection.MAKE_DOCS_MCP_CONNECTION_KEY!);
    const configPath = path.join(project, ".make-docs/config.yaml");
    const { parse } = await import("yaml");
    const initialConfig = readFileSync(configPath, "utf8");
    const projectId = (parse(initialConfig) as { projectId: string }).projectId;
    const intent = (storeAccess: "read" | "write") => writeFileSync(configPath, JSON.stringify({
      projectId,
      harnessIntegrations: [{ harness: "generic-mcp-p4-store", mode: "narrow", method: "mcp", accessCeiling: { store: storeAccess, project: "read", hostConfig: "none" } }],
    }));

    // CLI and MCP give the same check, and neither writes the Store.
    intent("read");
    const before = fileHashes(store);
    const fromCli = json(["setup", "store", "check", "--json"], project);
    const fromMcp = (await callMakeDocsMcpTool("setup_store_check", { targetRoot: project }, { profile: "setup" })) as { operation: string; result: Record<string, unknown> };
    expect(fromMcp.operation).toBe("setup.store.check");
    const { checkedAt: _cliTime, ...cliBody } = fromCli;
    const { checkedAt: _mcpTime, ...mcpBody } = fromMcp.result;
    expect(mcpBody).toEqual(cliBody);
    expect((await callMakeDocsMcpTool("setup_store_check", { targetRoot: project }, { profile: "all" })).result).toMatchObject({ kind: "store-check" });
    expect(fileHashes(store)).toEqual(before);
    // Clean needs allowWrite and a Store write ceiling.
    await expect(callMakeDocsMcpTool("setup_store_clean", { targetRoot: project, yes: true }, { profile: "setup" })).rejects.toBeInstanceOf(OperationWriteDeniedError);
    await expect(callMakeDocsMcpTool("setup_store_clean", { targetRoot: project, yes: true, allowWrite: true }, { profile: "setup" })).rejects.toMatchObject({ code: "store-denied" });
    expect(fileHashes(store)).toEqual(before);
    intent("write");
    const mcpClean = (await callMakeDocsMcpTool("setup_store_clean", { targetRoot: project, yes: true, allowWrite: true }, { profile: "setup" })).result as unknown as StoreCleanReport;
    expect(mcpClean.kind).toBe("store-clean");
    writeFileSync(configPath, initialConfig);

    // Forty days later, STORE-RULE-004 nulls the setup ledgers. Status and a second setup still work.
    const env40 = days(40);
    const ledgers = () => withInstallationDatabase(project, (db) => db.prepare("SELECT operation, status, before_ledger IS NULL AS before_null, after_ledger IS NULL AS after_null, after_ledger_digest FROM installation_operations ORDER BY created_at").all(), { storeRoot: store, readOnly: true }) as Array<Record<string, unknown>>;
    const current = () => withInstallationDatabase(project, (db) => db.prepare("SELECT manifest_json FROM installation_ledgers").all(), { storeRoot: store, readOnly: true });
    const ledgerBefore = current();
    const forty = cleanStore(store, env40);
    expect(forty.rules.find((rule) => rule.id === "STORE-RULE-004")!.changed).toBeGreaterThanOrEqual(1);
    expect(ledgers().filter((row) => row.status === "completed").every((row) => row.after_null === 1 && typeof row.after_ledger_digest === "string")).toBe(true);
    expect(current()).toEqual(ledgerBefore);
    expect(json(["project", "state", "status", "--target-root", project, "--json"], temp).storeAvailable).toBe(true);
    const second = json(["setup", "--target", project, "--yes", "--no-codex", "--no-claude-code", "--no-skills", "--json"], temp);
    expect(second.status, JSON.stringify({ failed: second.failedCondition, next: second.nextAction, recovery: second.projectRecovery })).toBe("complete");

    // After removal, the latest completed setup.remove keeps its full before-ledger, so setup after removal still works.
    const removed = cli(["setup", "remove", "--target", project, "--yes"], temp);
    expect(removed.status, removed.stderr).toBe(0);
    const eighty = cleanStore(store, days(80));
    const handoff = eighty.check.rules.find((rule) => rule.id === "STORE-RULE-004")!.skipped.entries;
    expect(handoff.some((entry) => entry.reason?.includes("latest completed removal"))).toBe(true);
    const removal = ledgers().filter((row) => row.operation === "setup.remove").at(-1)!;
    expect(removal.before_null).toBe(0);
    const again = cli(["setup", "--target", project, "--yes", "--no-codex", "--no-claude-code", "--no-skills", "--json"], temp);
    expect(again.status, again.stderr || again.stdout).toBe(0);
  }, 120_000);
});

describe.skipIf(!sqliteAvailable)("W32 R0 P4 review fixes", () => {
  const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const daysAgo = (days: number) => new Date(FIXTURE_NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  const receipt = (scope: "machine" | "project", operationId: string, days: number) => JSON.stringify({ scope, harnessId: "claude", connectionMethod: scope === "machine" ? "mcp" : "skill", operationId, verifiedAt: daysAgo(days), result: "verified", entries: [] });

  it("keeps the current receipt plus exactly 10 older receipts, as each setup writes them (finding 1)", () => {
    // Each setup writes a history copy and moves the current pointer to it (harness-integration-receipts.ts).
    // The current receipt also has a later observation row.
    withStoreDatabase(store, (db) => {
      db.exec("BEGIN IMMEDIATE");
      db.prepare("INSERT INTO installation_checkouts (checkout_id, project_id, root_path, created_at, root_path_key, verified_at, verification_json) VALUES ('c-h','p-h','/fixture/h',?, '/fixture/h', ?, '{}')").run(daysAgo(400), daysAgo(400));
      const tool = db.prepare("INSERT INTO tool_operations VALUES (?,?,'completed',1,'h',?,?,?)");
      const record = db.prepare("INSERT INTO installation_migration_records VALUES ('c-h','receipt',?,?)");
      for (let n = 1; n <= 15; n++) {
        tool.run(`harness-receipt:${uuid(n)}`, "setup.system.receipt", receipt("machine", uuid(n), 100 - n), daysAgo(100 - n), daysAgo(100 - n));
        record.run(uuid(100 + n), receipt("project", uuid(100 + n), 100 - n));
      }
      tool.run("harness-receipt-current:machine:claude:mcp", "setup.system.receipt-current", receipt("machine", uuid(15), 85), daysAgo(85), daysAgo(85));
      tool.run(`harness-receipt-observation:${"b".repeat(32)}`, "setup.system.receipt-observation", receipt("machine", uuid(15), 1), daysAgo(1), daysAgo(1));
      record.run("harness-receipt-current:project:claude:skill", receipt("project", uuid(115), 85));
      record.run(`harness-receipt-observation:${"c".repeat(32)}`, receipt("project", uuid(115), 1));
      db.exec("COMMIT");
    });
    const report = cleanStore(store, fixtureEnv());
    expect(report.rules.find((rule) => rule.id === "STORE-RULE-009")!.changed).toBe(8);
    const { db } = openStoreForReview(path.join(store, "store.db"), "test read");
    try {
      const machine = (db.prepare("SELECT json_extract(metadata_json, '$.operationId') AS id FROM tool_operations WHERE operation = 'setup.system.receipt'").all() as Array<{ id: string }>).map((row) => row.id).sort();
      const project = (db.prepare("SELECT record_id AS id FROM installation_migration_records WHERE record_id GLOB '00000000-*'").all() as Array<{ id: string }>).map((row) => row.id).sort();
      // The current receipt (15) and exactly the 10 older receipts 5 to 14.
      expect(machine).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(uuid));
      expect(project).toEqual([105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115].map(uuid));
      expect(machine.filter((id) => id !== uuid(15))).toHaveLength(10);
      expect(project.filter((id) => id !== uuid(115))).toHaveLength(10);
      // The current pointers and the current receipt's observations stay.
      expect(db.prepare("SELECT count(*) AS n FROM tool_operations WHERE operation IN ('setup.system.receipt-current', 'setup.system.receipt-observation')").get()).toEqual({ n: 2 });
      expect(db.prepare("SELECT count(*) AS n FROM installation_migration_records WHERE record_id LIKE 'harness-receipt-%'").get()).toEqual({ n: 2 });
    } finally {
      db.close();
    }
  });

  const seedCache = () => withStoreDatabase(store, (db) => {
    db.prepare("INSERT OR IGNORE INTO installation_checkouts (checkout_id, project_id, root_path, created_at, root_path_key, verified_at, verification_json) VALUES ('c-cache','p','/fixture/cache',?, '/fixture/cache', ?, '{}')").run(daysAgo(400), daysAgo(400));
    db.prepare("INSERT INTO backlog_review_cache VALUES ('c-cache', ?, ?, 1, 1, 1, '{}', ?, ?)").run(`docs/work/old-${Math.random()}.md`, "a".repeat(64), daysAgo(3), daysAgo(3));
  });
  const backupFolder = () => path.join(store, "backup");
  const cleanFiles = () => (existsSync(backupFolder()) ? readdirSync(backupFolder()) : []).filter((name) => name.includes("store-clean-")).sort();

  it("leaves no store-clean file and no partial file when any step of a clean fails (finding 3)", async () => {
    seedCache();
    const good = cleanStore(store, fixtureEnv()).backup!.path;
    expect(cleanFiles()).toEqual([path.basename(good)]);
    // One row that every failed clean below would remove.
    seedCache();
    const failures: Array<[string, () => unknown]> = [
      ["verify", () => { return cleanStore(store, fixtureEnv({ now: new Date(FIXTURE_NOW.getTime() + 1000) }), { testHooks: { afterVacuumInto: (partial) => writeFileSync(partial, "") } }); }],
      ["apply", () => cleanStore(store, fixtureEnv({ now: new Date(FIXTURE_NOW.getTime() + 2000) }), { testHooks: { afterLock: () => { throw new Error("injected apply failure"); } } })],
      ["schema", () => cleanStore(store, fixtureEnv({ now: new Date(FIXTURE_NOW.getTime() + 3000) }), { testHooks: { afterLock: (db) => db.exec("PRAGMA user_version = 10") } })],
    ];
    if (process.platform !== "win32") {
      failures.push(["vacuum into", () => {
        chmodSync(backupFolder(), 0o500);
        try { return cleanStore(store, fixtureEnv({ now: new Date(FIXTURE_NOW.getTime() + 4000) })); } finally { chmodSync(backupFolder(), 0o700); }
      }]);
    }
    let lockHolder: ReturnType<typeof openStoreSqliteConnection> | null = null;
    failures.push(["begin immediate", () => {
      lockHolder = openStoreSqliteConnection(path.join(store, "store.db"), {}, "test lock holder");
      return cleanStore(store, fixtureEnv({ now: new Date(FIXTURE_NOW.getTime() + 5000) }), { testHooks: { busyTimeoutMs: 50, afterBackup: () => lockHolder!.exec("BEGIN IMMEDIATE") } });
    }]);
    for (const [step, run] of failures) {
      const before = dump();
      expect(run, step).toThrow();
      expect(cleanFiles(), step).toEqual([path.basename(good)]);
      expect(dump(), step).toEqual(before);
      if (lockHolder) { (lockHolder as { exec(sql: string): void; close(): void }).exec("ROLLBACK"); (lockHolder as { close(): void }).close(); lockHolder = null; }
    }
    expect(listStoreCleanBackups(store)).toEqual([good]);
    // The row is still there, and a clean that can run removes it now.
    expect(cleanStore(store, fixtureEnv({ now: new Date(FIXTURE_NOW.getTime() + 6000) })).totals.changedRows).toBe(1);
  });

  it("returns a typed retryable result when the Store is busy (finding 4)", async () => {
    seedCache();
    const holder = openStoreSqliteConnection(path.join(store, "store.db"), {}, "test lock holder");
    let error: unknown;
    try {
      cleanStore(store, fixtureEnv(), { testHooks: { busyTimeoutMs: 50, afterBackup: () => holder.exec("BEGIN IMMEDIATE") } });
    } catch (caught) {
      error = caught;
    } finally {
      holder.exec("ROLLBACK");
      holder.close();
    }
    expect(error).toMatchObject({ code: "store-busy", details: { retryable: true } });
    expect(String((error as Error).message)).not.toMatch(/database is locked/);
    const typed = typedStoreMaintenanceError("setup.store.clean", error);
    expect(typed).toBeInstanceOf(StoreAccessStateError);
    expect(typed).toMatchObject({ code: "store-unavailable", details: { maintenanceCode: "store-busy", retryable: true } });
    expect((typed as StoreAccessStateError).nextAction).toContain("run make-docs setup store clean again");
    expect(cleanFiles()).toEqual([]);
  });

  it("never lets an empty or stray store-clean file displace a good backup (finding 3)", () => {
    const made: string[] = [];
    for (let run = 0; run < 3; run++) {
      seedCache();
      made.push(cleanStore(store, fixtureEnv({ now: new Date(FIXTURE_NOW.getTime() + run * 60_000) })).backup!.path);
    }
    // A stray empty file and a non-Store file with newer clean names.
    writeFileSync(path.join(backupFolder(), "store-clean-20990101T000000000Z-deadbeef.db"), "");
    writeFileSync(path.join(backupFolder(), "store-clean-20990102T000000000Z-cafef00d.db"), "not a database".padEnd(4096, "x"));
    expect(listStoreCleanBackups(store)).toEqual([...made].reverse());
    expect(findNewestStoreBackup(store)).toBe(made[2]);
    seedCache();
    const fourth = cleanStore(store, fixtureEnv({ now: new Date(FIXTURE_NOW.getTime() + 10 * 60_000) }));
    // Rotation keeps the three newest verified backups and leaves the stray files alone.
    expect(fourth.backup!.removedOldBackups).toEqual([made[0]]);
    expect(listStoreCleanBackups(store)).toEqual([fourth.backup!.path, made[2], made[1]]);
    expect(findNewestStoreBackup(store)).toBe(fourth.backup!.path);
    expect(cleanFiles()).toContain("store-clean-20990101T000000000Z-deadbeef.db");
  });

  it("gives the same rule 004 reason in check and clean when the receipt columns are empty and a plan exists (finding 5)", () => {
    withStoreDatabase(store, (db) => {
      db.exec("BEGIN IMMEDIATE");
      db.prepare("INSERT INTO installation_checkouts (checkout_id, project_id, root_path, created_at, root_path_key, verified_at, verification_json) VALUES ('c-p','p','/fixture/p',?, '/fixture/p', ?, '{}')").run(daysAgo(400), daysAgo(400));
      db.prepare("INSERT INTO installation_operations (operation_id, checkout_id, operation, status, before_ledger, after_ledger, created_at, finished_at, plan_complete) VALUES ('op-plan','c-p','project.layout.prepare','completed','{\"files\":{}}','{\"files\":{\"a.md\":{}}}',?,?,1)").run(daysAgo(100), daysAgo(60));
      db.prepare("INSERT INTO installation_migration_records VALUES ('c-p','snapshot','detached:op-plan','{\"digest\":\"x\",\"plan\":{}}')").run();
      db.exec("COMMIT");
    });
    const check = checkStore(store, fixtureEnv());
    const checked = check.rules.find((rule) => rule.id === "STORE-RULE-004")!;
    expect(checked.act.rows).toBe(0);
    expect(checked.skipped.entries).toEqual([expect.objectContaining({ key: "op-plan", reason: RECEIPT_COLUMNS_EMPTY_REASON })]);
    const clean = cleanStore(store, fixtureEnv());
    const cleaned = clean.rules.find((rule) => rule.id === "STORE-RULE-004")!;
    expect(cleaned.changed).toBe(0);
    expect(cleaned.skipped.entries).toEqual([expect.objectContaining({ key: "op-plan", reason: RECEIPT_COLUMNS_EMPTY_REASON })]);
    // Rule 005 still removes the finished plan.
    expect(clean.rules.find((rule) => rule.id === "STORE-RULE-005")!.changed).toBe(1);
  });

  it("refuses inside the transaction when the schema version is not the current one, and changes nothing (finding 6)", () => {
    seedCache();
    const before = dump();
    expect(() => cleanStore(store, fixtureEnv(), { testHooks: { afterLock: (db) => db.exec("PRAGMA user_version = 6") } }))
      .toThrow(/The Store schema is 6 inside the clean transaction, not 9\. Clean changed nothing\./);
    expect(dump()).toEqual(before);
    expect(cleanFiles()).toEqual([]);
  });
});
