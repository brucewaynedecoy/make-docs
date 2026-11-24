import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

import { applyGenericMcpSetup, prepareGenericMcpSetup } from "../src/generic-mcp-setup";
import { verifyMakeDocsExecutable } from "../src/harness-access";
import { validateHarnessCommandRules } from "../src/harness-access/contract";
import { MCP_CONNECTION_ID_ENV, MCP_CONNECTION_KEY_ENV } from "../src/mcp-connection";
import { callMakeDocsMcpTool } from "../src/mcp/tools";
import { createExecutionContext } from "../src/operations/context";
import { FACTORY_OPERATION_SCOPES } from "../src/operations/factory/project-scope";
import { leafHelpEntry } from "../src/operations/leaf-help-table";
import { NAME_CATALOG } from "../src/operations/name-catalog";
import { ADMITTED_OPERATION_IDS, getOperation, invokeOperation, listHarnessCommandRules, validateRegistryHarnessCommandRules } from "../src/operations/registry";
import { platform } from "../src/platform";
import { adaptRunCliArgv } from "../src/run/cli";
import { withStoreDatabase } from "../src/store/database";
import { getInstallationCheckoutId, previewInstallationCheckoutMove, registerSeparateInstallationCheckout } from "../src/store/installation-state";
import { createLifecycleRun, readLifecycleRun } from "../src/store/lifecycle-runs";
import { claimWorkUnit, createQuickItem, writeWorkStore } from "../src/store/work-store";
import { cleanupTempDir, createTempDir } from "./helpers";

/**
 * W30 R0 follow-up commands (owner decisions 2026-11-23, PRD 53 R-FACTORY-69
 * to R-FACTORY-71): `factory tools list`, `factory file-backup save`, and
 * `factory grant-use record`. Tool names are generic, such as `tool-a`. Every
 * run uses a temporary MAKE_DOCS_HOME, so no test reaches the real Store.
 */

const NOW = new Date("2042-06-15T12:00:00.000Z");
const PROJECT_ID = "factory-follow-up-project";
const FOLLOW_UP_IDS = ["factory.tools.list", "factory.file-backup.save", "factory.grant-use.record"] as const;
const CLI_PATH = path.resolve(import.meta.dirname, "../dist/index.js");

const WORKFLOW_YAML = `factory:
  workflows:
    ship:
      type: build-then-review
      typeVersion: 1
      roundLimit: 3
      roles:
        foreman:
          job: Claim the unit, brief, judge, and accept.
          capabilities: [read-write-files, run-commands, launch-agent, wait-for-agent, read-agent-result]
          returns: Accepted units and escalations.
        builder:
          job: Build the unit.
          capabilities: [read-write-files, run-commands]
          returns: The result and its evidence.
        reviewer:
          job: Review the result.
          capabilities: [read-write-files]
          returns: A pass or a defect list.
      humanChannel: wait-in-session
`;

const proof = (capabilityId: string, method: string, toolVersion: string, notCovered: string[] = []) => ({ capabilityId, method, toolVersion, provedAt: NOW.toISOString(), result: "proved", notCovered });

const TOOLS = (expected: { a: number | null; b: number | null } = { a: null, b: null }) => [
  {
    toolId: "tool-a",
    kind: "agent-harness",
    label: "Tool A",
    state: "available",
    reportedVersion: "1.0",
    capabilities: ["read-write-files", "run-commands", "launch-agent", "wait-for-agent", "read-agent-result"],
    proofs: [
      proof("read-write-files", "Wrote and read a scratch file.", "1.0"),
      proof("run-commands", "Ran a harmless command.", "1.0", ["long output"]),
      proof("launch-agent", "Started a fresh agent with a one-line brief.", "1.0"),
      proof("wait-for-agent", "Waited for that agent to finish.", "1.0"),
      proof("read-agent-result", "Read the agent's returned line.", "1.0"),
    ],
    expectedVersion: expected.a,
  },
  {
    toolId: "tool-b",
    kind: "agent-harness",
    label: "Tool B",
    state: "blocked",
    reportedVersion: "2.0",
    capabilities: ["read-write-files"],
    proofs: [proof("read-write-files", "Wrote and read a scratch file.", "2.0")],
    expectedVersion: expected.b,
  },
];

const BINDING = { roles: { foreman: "tool-a", builder: "tool-a", reviewer: "tool-a" }, worktreeMethod: "none", channelRef: null, wakeMethod: "person", wakeRef: null, knownLosses: [] };

const roots: string[] = [];
let temp: string;
let store: string;

beforeEach(() => {
  temp = platform.describePath(createTempDir("make-docs-w30-follow-up-")).canonicalPath;
  roots.push(temp);
  store = path.join(temp, "store");
  vi.stubEnv("MAKE_DOCS_HOME", store);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  while (roots.length) {
    const root = roots.pop()!;
    const unlock = (folder: string) => {
      if (!existsSync(folder)) return;
      for (const name of readdirSync(folder)) {
        const entry = path.join(folder, name);
        try {
          chmodSync(entry, 0o755);
        } catch {
          // Best effort.
        }
        // A test can leave a broken symbolic link, which has no target to read.
        if (statSync(entry, { throwIfNoEntry: false })?.isDirectory()) unlock(entry);
      }
    };
    unlock(root);
    cleanupTempDir(root);
  }
});

type Value = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function project(name = "aurora"): string {
  const root = path.join(temp, name);
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\nprojectName: ${name}\n${WORKFLOW_YAML}`);
  const canonical = platform.describePath(root).canonicalPath;
  getInstallationCheckoutId(canonical, store);
  return canonical;
}

function secondCheckout(name: string): string {
  const root = path.join(temp, name);
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\nprojectName: aurora\n${WORKFLOW_YAML}`);
  const canonical = platform.describePath(root).canonicalPath;
  const preview = previewInstallationCheckoutMove(canonical, undefined, store);
  registerSeparateInstallationCheckout(canonical, preview.separateReviewDigest!, store);
  return canonical;
}

async function call(id: string, input: Record<string, unknown>, cwd = temp, now = NOW): Promise<Value> {
  const invocation = await invokeOperation(id, input, createExecutionContext({ surface: "test", writesAllowed: true, storeRoot: store, cwd, now: () => now.toISOString() }));
  return invocation.value as Value;
}

function dump(): string {
  const db = new DatabaseSync(path.join(store, "store.db"), { readOnly: true });
  try {
    const tables = (db.prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND name LIKE 'factory_%' ORDER BY name").all() as Array<{ name: string }>).map((row) => row.name);
    return JSON.stringify(tables.map((table) => [table, db.prepare(`SELECT * FROM ${table}`).all()]));
  } finally {
    db.close();
  }
}

function claimedUnit(root: string, title = "Write the notes"): { unit: string; claimId: string } {
  withStoreDatabase(store, (db) => {
    for (const runId of ["run-1", "run-2"]) {
      if (!readLifecycleRun(db, PROJECT_ID, runId)) createLifecycleRun(db, { projectId: PROJECT_ID, runId, lifecycleStage: "implementation", committedAt: NOW.toISOString() });
    }
  });
  return writeWorkStore(root, (db, workProject) => {
    const unit = createQuickItem(db, workProject.projectId, { title, body: null, links: [] });
    const claimed = claimWorkUnit(db, { unitStoreId: unit.storeId, claimant: "foreman", taskHandle: "run-1", ttlSeconds: 3600, expectedVersion: unit.revision, takeover: null }, { now: NOW });
    if (claimed.result !== "claimed") throw new Error(`claim refused: ${claimed.refusal}`);
    return { unit: unit.coordinate, claimId: claimed.claim.claimId };
  }, { storeRoot: store, now: NOW });
}

async function readyWorkflow(root: string, saveTools = true): Promise<void> {
  if (saveTools) expect((await call("factory.tools.save", { tools: TOOLS().map((tool) => ({ ...tool, state: "available" })) })).result).toBe("saved");
  const saved = await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: BINDING });
  expect(saved.result, JSON.stringify(saved)).toBe("saved");
  const passed = await call("factory.proof.save", { targetRoot: root, workflow: "ship", outcome: "passed", testTask: "Write one line and review it.", planDigest: saved.revision.planDigest, path: ["builder: tool-a"], manualSteps: [] });
  expect(passed.readiness, JSON.stringify(passed)).toBe("ready");
}

/** A ready workflow, a claimed unit, and one open builder assignment. */
async function openJob(root: string): Promise<{ unit: string; claimId: string; assignmentId: string; version: number }> {
  await readyWorkflow(root);
  const { unit, claimId } = claimedUnit(root);
  const started = await call("factory.assignment.start", { targetRoot: root, workflow: "ship", unit, role: "builder", runId: "run-1", claimId });
  expect(started.result, JSON.stringify(started)).toBe("started");
  return { unit, claimId, assignmentId: started.assignment.assignmentId, version: started.assignment.version };
}

/** Move the builder's assignment along the move table to `accepted`, so that every assignment of the unit is final. */
async function acceptJob(root: string, job: { claimId: string; assignmentId: string; version: number }): Promise<Value> {
  let version = job.version;
  let last: Value = {};
  for (const [status, reason] of [["running", "tool-started"], ["returned", "result-returned"], ["in-review", "sent-to-review"], ["accepted", "review-passed"]]) {
    last = await call("factory.assignment.save", { targetRoot: root, assignmentId: job.assignmentId, expectedVersion: version, claimId: job.claimId, status, reason });
    expect(last.result, JSON.stringify(last)).toBe("updated");
    version = last.assignment.version;
  }
  return last;
}

function runCliIn(cwd: string, args: string[]) {
  return spawnSync(process.execPath, [CLI_PATH, ...args], { cwd, encoding: "utf8", env: { ...process.env, MAKE_DOCS_HOME: store } });
}

/* ------------------------------------------------------------------------ */
/* Registry, names, and native command rules                                */
/* ------------------------------------------------------------------------ */

describe("W30 R0 follow-up registry, names, and native command rules", () => {
  it("admits the three operations with CLI paths, MCP names of at most 26 characters, leaf help, the factory profile, and their scope", () => {
    const expected: Record<string, { cli: string; mcp: string; scope: "machine" | "project"; kind: "read" | "write"; needsCheckout: boolean }> = {
      "factory.tools.list": { cli: "factory tools list", mcp: "factory_tools_list", scope: "machine", kind: "read", needsCheckout: false },
      "factory.file-backup.save": { cli: "factory file-backup save", mcp: "factory_file_backup_save", scope: "project", kind: "write", needsCheckout: true },
      "factory.grant-use.record": { cli: "factory grant-use record", mcp: "factory_grant_use_record", scope: "project", kind: "write", needsCheckout: false },
    };
    for (const id of FOLLOW_UP_IDS) {
      expect((ADMITTED_OPERATION_IDS as readonly string[]).includes(id), id).toBe(true);
      const entry = NAME_CATALOG.find((item) => item.id === id)!;
      expect(entry, id).toMatchObject({ status: "current", newCli: expected[id]!.cli, newMcp: expected[id]!.mcp });
      expect(entry.newMcp.length, id).toBeLessThanOrEqual(26);
      const operation = getOperation(id);
      expect(operation.mcp?.profiles, id).toEqual(["factory"]);
      expect(operation.mutates, id).toBe(expected[id]!.kind);
      expect(FACTORY_OPERATION_SCOPES[id], id).toEqual({ scope: expected[id]!.scope, kind: expected[id]!.kind, needsCheckout: expected[id]!.needsCheckout });
      expect(leafHelpEntry(id).summary, id).toBe(operation.summary);
    }
    // A read says that it changes nothing.
    expect(getOperation("factory.tools.list").summary).toMatch(/Changes nothing\.$/);
    expect(getOperation("factory.tools.list").access).toEqual({ store: "read", project: "none", hostConfig: "none" });
    expect(getOperation("factory.file-backup.save").access).toEqual({ store: "write", project: "write", hostConfig: "none" });
    expect(getOperation("factory.grant-use.record").access).toEqual({ store: "write", project: "read", hostConfig: "none" });
  });

  it("admits each command as a native command rule, and every rule passes the setup check (register D-077)", () => {
    const rules = listHarnessCommandRules();
    const authority = { list: listHarnessCommandRules, validate: validateRegistryHarnessCommandRules };
    expect(rules.find((rule) => rule.id === "make-docs.factory.tools.list")).toMatchObject({ commandPrefix: ["factory", "tools", "list"], operationIds: ["factory.tools.list"], access: { store: "read", project: "none", hostConfig: "none" } });
    expect(rules.find((rule) => rule.id === "make-docs.factory.file-backup.save")).toMatchObject({ commandPrefix: ["factory", "file-backup", "save"], operationIds: ["factory.file-backup.save"], access: { store: "write", project: "write", hostConfig: "none" } });
    expect(rules.find((rule) => rule.id === "make-docs.factory.grant-use.record")).toMatchObject({ commandPrefix: ["factory", "grant-use", "record"], operationIds: ["factory.grant-use.record"], access: { store: "write", project: "read", hostConfig: "none" } });
    // The check that setup runs on the command rules (harness access contract).
    expect(() => validateHarnessCommandRules(rules, authority)).not.toThrow();
    // No rule holds a refused word. That is why the backup command is not `factory backup save`.
    for (const word of ["update", "backup", "remove", "setup", "uninstall"]) expect(rules.some((rule) => rule.commandPrefix.includes(word)), word).toBe(false);
    const refusedName = rules.map((rule) => (rule.id === "make-docs.factory.file-backup.save" ? { ...rule, commandPrefix: ["factory", "backup", "save"] } : rule));
    expect(() => validateHarnessCommandRules(refusedName, { list: () => refusedName, validate: validateRegistryHarnessCommandRules })).toThrow(/cannot approve backup/);
  });

  it("maps each CLI path and flag to the same input that MCP takes", () => {
    expect(adaptRunCliArgv(["factory", "tools", "list"]).invocation.input).toEqual({});
    expect(adaptRunCliArgv(["factory", "file-backup", "save", "fa-12345678", "--file", "notes/plan.md", "--file", "notes/more.md", "--claim-id", "wc-12345678", "--project", "aurora"]).invocation.input).toEqual({
      assignmentId: "fa-12345678", files: ["notes/plan.md", "notes/more.md"], claimId: "wc-12345678", project: "aurora",
    });
    expect(adaptRunCliArgv(["factory", "grant-use", "record", "7", "--workflow", "ship", "--action", "merge", "--run-id", "run-1", "--claim-id", "wc-12345678", "--target-root", temp]).invocation.input).toEqual({
      unit: "7", workflow: "ship", action: "merge", runId: "run-1", claimId: "wc-12345678", targetRoot: temp,
    });
  });
});

/* ------------------------------------------------------------------------ */
/* factory tools list (R-FACTORY-69)                                        */
/* ------------------------------------------------------------------------ */

describe("W30 R0 follow-up factory tools list", () => {
  it("reads this machine's saved tools with their states, proofs, and record versions, and changes nothing", async () => {
    project();
    expect((await call("factory.tools.save", { tools: TOOLS() })).result).toBe("saved");
    const before = dump();
    const listed = await call("factory.tools.list", {});
    expect(listed).toMatchObject({ operation: "factory.tools.list", result: "read", actedOn: { kind: "machine", text: "this machine" } });
    expect(listed.tools.map((tool: Value) => [tool.toolId, tool.state, tool.reportedVersion, tool.version])).toEqual([["tool-a", "available", "1.0", 1], ["tool-b", "blocked", "2.0", 1]]);
    expect(listed.tools[0].proofs.find((entry: Value) => entry.capabilityId === "run-commands")).toMatchObject({ toolVersion: "1.0", provedAt: NOW.toISOString(), result: "proved", notCovered: ["long output"] });
    expect(listed.lines[0]).toBe("2 tools saved for this machine. Every project on this machine uses this list.");
    expect(listed.summary).toContain("- tool-b (Tool B): agent-harness, blocked, version 2.0");
    expect(listed.summary).toContain("  - run-commands: proved under version 1.0 at 2042-06-15T12:00:00.000Z, by: Ran a harmless command. Does not cover: long output.");
    expect(listed.summary).not.toContain("..");
    expect(listed.summary).toContain("Record version 1.");
    expect(listed.lines.at(-1)).toBe("Changes nothing.");
    expect(dump()).toBe(before);
    // The record version is the expectedVersion of the next save of that tool.
    const again = await call("factory.tools.save", { tools: TOOLS({ a: listed.tools[0].version, b: listed.tools[1].version }) });
    expect(again.result, JSON.stringify(again)).toBe("saved");
    expect((await call("factory.tools.list", {})).tools.map((tool: Value) => tool.version)).toEqual([2, 2]);
  });

  it("gives the same answer from any folder, and takes no project", async () => {
    const root = project();
    await call("factory.tools.save", { tools: TOOLS() });
    const plain = path.join(temp, "plain");
    mkdirSync(plain);
    expect(await call("factory.tools.list", {}, plain)).toEqual(await call("factory.tools.list", {}, root));
    await expect(call("factory.tools.list", { project: "aurora" })).rejects.toThrow();
    await expect(call("factory.tools.list", { targetRoot: root })).rejects.toThrow();
  });

  it("says so when no tool is saved, and never creates or migrates a Store", async () => {
    // No Store yet: the typed Store outcome, and still no Store.
    const error = await call("factory.tools.list", {}).catch((caught: unknown) => caught as Error & { code?: string });
    expect(error).toBeInstanceOf(Error);
    expect(String((error as { code?: string }).code ?? (error as Error).message)).toContain("store-unavailable");
    expect(existsSync(store)).toBe(false);
    project();
    const empty = await call("factory.tools.list", {});
    expect(empty.tools).toEqual([]);
    expect(empty.lines[0]).toBe("No tool is saved for this machine yet. Save the tools with make-docs factory tools save.");
    expect(empty.lines.at(-1)).toBe("Changes nothing.");
  });

  it("shows no never-log content: a tool save with a secret is refused, so no list can show it", async () => {
    project();
    const secret = "sk-ant-api03-ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const refused = await call("factory.tools.save", { tools: TOOLS().map((tool) => ({ ...tool, label: `token ${secret}` })) });
    expect(refused).toMatchObject({ result: "refused", refusal: "never-log-field" });
    await call("factory.tools.save", { tools: TOOLS() });
    const listed = await call("factory.tools.list", {});
    expect(JSON.stringify(listed)).not.toContain(secret);
    // The result holds only the fields of the tool record.
    expect(Object.keys(listed.tools[0]).sort()).toEqual(["capabilities", "kind", "label", "proofs", "reportedAt", "reportedVersion", "state", "toolId", "version"]);
  });
});

/* ------------------------------------------------------------------------ */
/* factory file-backup save (R-FACTORY-70)                                  */
/* ------------------------------------------------------------------------ */

describe("W30 R0 follow-up factory file-backup save", () => {
  const CONTENT = "The first plan.\nSecond line of the plan.\n";

  function writeNotes(root: string): void {
    mkdirSync(path.join(root, "notes"), { recursive: true });
    writeFileSync(path.join(root, "notes/plan.md"), CONTENT);
    writeFileSync(path.join(root, "notes/more.md"), "More.\n");
  }

  it("outside git, copies each file before the change and records the file, its hash, and its assignment", async () => {
    const root = project();
    writeNotes(root);
    const job = await openJob(root);
    const saved = await call("factory.file-backup.save", { targetRoot: root, assignmentId: job.assignmentId, claimId: job.claimId, files: ["notes/plan.md", path.join(root, "notes/more.md"), "notes/new.md"] });
    expect(saved, JSON.stringify(saved)).toMatchObject({ operation: "factory.file-backup.save", result: "saved", git: false, actedOn: { kind: "project", projectName: "aurora", projectId: PROJECT_ID, chosenBy: "named" } });
    expect(saved.files.map((file: Value) => [file.file, file.status])).toEqual([["notes/plan.md", "backed-up"], ["notes/more.md", "backed-up"], ["notes/new.md", "no-file"]]);
    const backup = path.join(root, ".make-docs/backup/factory", job.assignmentId, "notes/plan.md");
    expect(saved.files[0].backup).toBe(`.make-docs/backup/factory/${job.assignmentId}/notes/plan.md`);
    expect(readFileSync(backup, "utf8")).toBe(CONTENT);
    expect(saved.files[0].contentDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(saved.lines[0]).toContain(`in project aurora (${PROJECT_ID}), checkout ${root}.`);
    // The folder note and its own .gitignore (R-FACTORY-46).
    expect(readFileSync(path.join(root, ".make-docs/backup/factory/README.md"), "utf8")).toContain("How to Get a File Back");
    expect(readFileSync(path.join(root, ".make-docs/backup/factory/.gitignore"), "utf8")).toBe("*\n");
    // The Store record: paths, the digest, and the assignment. No file contents, and no claim ID.
    const records = dump();
    expect(records).toContain(saved.files[0].contentDigest);
    expect(records).toContain(job.assignmentId);
    for (const text of [records, JSON.stringify(saved)]) {
      expect(text).not.toContain("The first plan.");
      expect(text).not.toContain(job.claimId);
    }
    // The first backup stays: a later call after a change keeps it.
    writeFileSync(path.join(root, "notes/plan.md"), "Changed by the worker.\n");
    const again = await call("factory.file-backup.save", { targetRoot: root, assignmentId: job.assignmentId, claimId: job.claimId, files: ["notes/plan.md"] });
    expect(again.files).toMatchObject([{ file: "notes/plan.md", status: "already-backed-up", contentDigest: saved.files[0].contentDigest }]);
    expect(readFileSync(backup, "utf8")).toBe(CONTENT);
    // The cleanup of R-FACTORY-45 still removes the backups when the work is accepted.
    const accepted = await acceptJob(root, job);
    expect(accepted.backupCleanup).toMatchObject({ removed: 2 });
    expect(existsSync(backup)).toBe(false);
  });

  it("in a folder with git, reports not-needed and changes nothing", async () => {
    const root = project();
    writeNotes(root);
    const job = await openJob(root);
    mkdirSync(path.join(root, ".git"));
    const before = dump();
    const result = await call("factory.file-backup.save", { targetRoot: root, assignmentId: job.assignmentId, claimId: job.claimId, files: ["notes/plan.md"] });
    expect(result).toMatchObject({ result: "not-needed", git: true, files: [], actedOn: { kind: "project", projectName: "aurora" } });
    expect(result.lines[0]).toContain("the folder uses git, and git is the undo there.");
    expect(result.lines.at(-1)).toContain("Nothing changed.");
    expect(existsSync(path.join(root, ".make-docs/backup"))).toBe(false);
    expect(dump()).toBe(before);
    // The claim still decides: a caller without it gets no answer about the folder.
    expect(await call("factory.file-backup.save", { targetRoot: root, assignmentId: job.assignmentId, claimId: "wc-notmine00", files: ["notes/plan.md"] })).toMatchObject({ result: "refused", refusal: "claim-not-held" });
  });

  it("refuses without the project, the claim, an open assignment, or a file it can back up, and changes nothing", async () => {
    const root = project();
    writeNotes(root);
    const job = await openJob(root);
    const before = dump();
    const base = { targetRoot: root, assignmentId: job.assignmentId, claimId: job.claimId, files: ["notes/plan.md"] };
    const refusals: Array<[Record<string, unknown>, string]> = [
      [{ ...base, targetRoot: undefined }, "project-missing"],
      [{ ...base, targetRoot: undefined, project: "nowhere" }, "project-not-found"],
      [{ ...base, claimId: undefined }, "claim-not-held"],
      [{ ...base, claimId: "wc-notmine00" }, "claim-not-held"],
      [{ ...base, assignmentId: "fa-0000000000" }, "record-not-found"],
      [{ ...base, files: ["../outside.md"] }, "invalid-record"],
      [{ ...base, files: [".make-docs/config.yaml", ".make-docs/factory/tools.md"] }, "invalid-record"],
      [{ ...base, files: ["notes"] }, "invalid-record"],
      // Every file of one call is backed up, or none is.
      [{ ...base, files: ["notes/plan.md", "notes"] }, "invalid-record"],
    ];
    for (const [input, refusal] of refusals) {
      const clean = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
      const refused = await call("factory.file-backup.save", clean, root);
      expect(refused, `${refusal}: ${JSON.stringify(refused)}`).toMatchObject({ result: "refused", refusal });
      expect(refused.lines.at(-1), refusal).toContain("Nothing changed.");
      expect(JSON.stringify(refused), refusal).not.toContain(job.claimId);
      expect(dump(), refusal).toBe(before);
    }
    // No copy and no folder stays from a refused call.
    expect(existsSync(path.join(root, ".make-docs/backup"))).toBe(false);
    // A final assignment takes no backup.
    await acceptJob(root, job);
    expect(await call("factory.file-backup.save", base)).toMatchObject({ result: "refused", refusal: "final-status" });
  });

  it("leaves nothing behind when a refused call created the backup folder and made no copy, and says so in plain words", async () => {
    const root = project();
    writeNotes(root);
    const job = await openJob(root);
    const before = dump();
    chmodSync(path.join(root, "notes/plan.md"), 0o000);
    try {
      const refused = await call("factory.file-backup.save", { targetRoot: root, assignmentId: job.assignmentId, claimId: job.claimId, files: ["notes/plan.md"] });
      expect(refused, JSON.stringify(refused)).toMatchObject({ result: "refused", refusal: "invalid-record", details: { field: "file" } });
      expect(refused.reason).toBe("The file notes/plan.md cannot be read or copied, so the factory cannot back it up. Check that this account can read the file.");
      // No raw system error and no absolute path.
      expect(JSON.stringify(refused)).not.toMatch(/EACCES|EPERM|ENOENT|permission denied/i);
      expect(refused.summary).not.toContain(root);
      // The call created the folder and made no copy, so it removed what it created.
      expect(existsSync(path.join(root, ".make-docs/backup"))).toBe(false);
      expect(dump()).toBe(before);
      // The same with a readable file first: the copy of this call goes too.
      const mixed = await call("factory.file-backup.save", { targetRoot: root, assignmentId: job.assignmentId, claimId: job.claimId, files: ["notes/more.md", "notes/plan.md"] });
      expect(mixed).toMatchObject({ result: "refused", refusal: "invalid-record" });
      expect(existsSync(path.join(root, ".make-docs/backup"))).toBe(false);
      expect(dump()).toBe(before);
    } finally {
      chmodSync(path.join(root, "notes/plan.md"), 0o644);
    }
  });

  it("on a refused call removes only its own copies, and never the backups of another call", async () => {
    const root = project();
    writeNotes(root);
    const job = await openJob(root);
    const first = await call("factory.file-backup.save", { targetRoot: root, assignmentId: job.assignmentId, claimId: job.claimId, files: ["notes/plan.md"] });
    expect(first.result, JSON.stringify(first)).toBe("saved");
    const kept = path.join(root, ".make-docs/backup/factory", job.assignmentId, "notes/plan.md");
    const before = dump();
    const refused = await call("factory.file-backup.save", { targetRoot: root, assignmentId: job.assignmentId, claimId: job.claimId, files: ["notes/more.md", "notes"] });
    expect(refused).toMatchObject({ result: "refused", refusal: "invalid-record" });
    expect(readFileSync(kept, "utf8")).toBe(CONTENT);
    expect(existsSync(path.join(root, ".make-docs/backup/factory", job.assignmentId, "notes/more.md"))).toBe(false);
    expect(readdirSync(path.join(root, ".make-docs/backup/factory")).sort()).toEqual([".gitignore", "README.md", job.assignmentId].sort());
    expect(dump()).toBe(before);
    // A second job in a folder that already holds a backup: its refused call removes nothing of the first job.
    const second = claimedUnit(root, "Another unit");
    const started = await call("factory.assignment.start", { targetRoot: root, workflow: "ship", unit: second.unit, role: "builder", runId: "run-2", claimId: second.claimId });
    const other = await call("factory.file-backup.save", { targetRoot: root, assignmentId: started.assignment.assignmentId, claimId: second.claimId, files: ["notes/more.md", "../outside.md"] });
    expect(other).toMatchObject({ result: "refused", refusal: "invalid-record" });
    expect(readFileSync(kept, "utf8")).toBe(CONTENT);
    expect(readdirSync(path.join(root, ".make-docs/backup/factory")).sort()).toEqual([".gitignore", "README.md", job.assignmentId].sort());
  });

  it("refuses a symbolic link, also a broken one, and a path through a linked folder", async () => {
    const root = project();
    writeNotes(root);
    const job = await openJob(root);
    symlinkSync(path.join(root, "notes/plan.md"), path.join(root, "notes/link.md"));
    symlinkSync(path.join(root, "notes/gone.md"), path.join(root, "notes/broken.md"));
    symlinkSync(path.join(root, "notes"), path.join(root, "linked"));
    const before = dump();
    for (const [file, words] of [
      ["notes/link.md", "The file notes/link.md is a symbolic link, so the factory does not back it up."],
      ["notes/broken.md", "The file notes/broken.md is a symbolic link, so the factory does not back it up."],
      ["linked/plan.md", "The path of the file linked/plan.md goes through a symbolic link, so the factory does not back it up."],
    ]) {
      const refused = await call("factory.file-backup.save", { targetRoot: root, assignmentId: job.assignmentId, claimId: job.claimId, files: [file] });
      expect(refused, `${file}: ${JSON.stringify(refused)}`).toMatchObject({ result: "refused", refusal: "invalid-record", reason: words });
      expect(refused.summary, file).not.toContain(root);
      expect(existsSync(path.join(root, ".make-docs/backup")), file).toBe(false);
      expect(dump(), file).toBe(before);
    }
  });

  it("gives a plain message when the CLI call names no file", () => {
    expect(() => adaptRunCliArgv(["factory", "file-backup", "save", "fa-12345678", "--project", "aurora"])).toThrow("`factory file-backup save` names no file. Give --file <path>.");
  });

  it("refuses a checkout that the assignment does not run in", async () => {
    const root = project();
    writeNotes(root);
    const other = secondCheckout("aurora-b");
    const job = await openJob(root);
    mkdirSync(path.join(other, "notes"), { recursive: true });
    writeFileSync(path.join(other, "notes/plan.md"), CONTENT);
    const refused = await call("factory.file-backup.save", { targetRoot: other, assignmentId: job.assignmentId, claimId: job.claimId, files: ["notes/plan.md"] });
    expect(refused).toMatchObject({ result: "refused", refusal: "invalid-record", details: { field: "targetRoot" } });
    expect(existsSync(path.join(other, ".make-docs/backup"))).toBe(false);
    // A project name alone gives no single checkout.
    expect(await call("factory.file-backup.save", { project: "aurora", assignmentId: job.assignmentId, claimId: job.claimId, files: ["notes/plan.md"] })).toMatchObject({ result: "refused", refusal: "project-checkout-unclear" });
  });
});

/* ------------------------------------------------------------------------ */
/* factory grant-use record (R-FACTORY-71)                                  */
/* ------------------------------------------------------------------------ */

describe("W30 R0 follow-up factory grant-use record", () => {
  const grantsOf = async (root: string) => (await call("factory.workflow.show", { targetRoot: root, workflow: "ship" })).grants as Value[];

  it("records a grant use on the live claim when every assignment is final, with the grant checks of assignment save", async () => {
    const root = project();
    const job = await openJob(root);
    await acceptJob(root, job);
    const use = (action: string, now = NOW) => call("factory.grant-use.record", { targetRoot: root, unit: job.unit, workflow: "ship", action, runId: "run-1", claimId: job.claimId }, temp, now);
    expect(await use("merge")).toMatchObject({ result: "refused", refusal: "grant-missing" });
    await call("factory.workflow.save", { targetRoot: root, workflow: "ship", grants: { add: [
      { action: "merge", scope: "once", grantedBy: "the owner" },
      { action: "deploy", scope: "run", runId: "run-2", grantedBy: "the owner" },
      { action: "publish", scope: "standing", expiresAt: new Date(NOW.getTime() + 60_000).toISOString(), grantedBy: "the owner" },
      { action: "spend", scope: "run", runId: "run-1", grantedBy: "the owner" },
    ] } });
    const at = new Date(NOW.getTime() + 1_000);
    const used = await use("merge", at);
    expect(used, JSON.stringify(used)).toMatchObject({
      operation: "factory.grant-use.record",
      result: "used",
      actedOn: { kind: "project", projectName: "aurora", projectId: PROJECT_ID, chosenBy: "named" },
      workflow: "ship",
      action: "merge",
      runId: "run-1",
      usedAt: at.toISOString(),
      grant: { action: "merge", scope: "once", state: "spent", spentAt: at.toISOString() },
      grantUse: { action: "merge", scope: "once", runId: "run-1", usedAt: at.toISOString() },
    });
    expect(used.lines[0]).toContain(`Recorded the use of the once grant for merge on the claim of`);
    expect(used.lines[0]).toContain(`in project aurora (${PROJECT_ID}).`);
    expect(used.lines.at(-1)).toBe("Do the action now. Make Docs did not do it.");
    expect(await use("merge", at)).toMatchObject({ result: "refused", refusal: "grant-spent" });
    expect(await use("deploy", at)).toMatchObject({ result: "refused", refusal: "grant-out-of-scope" });
    expect(await use("spend", at)).toMatchObject({ result: "used", grant: { scope: "run", state: "usable", spentAt: null, version: 1 }, grantUse: { runId: "run-1" } });
    expect(await use("publish", at)).toMatchObject({ result: "used", grant: { scope: "standing", version: 1 }, grantUse: { usedAt: at.toISOString() } });
    expect(await use("publish", new Date(NOW.getTime() + 120_000))).toMatchObject({ result: "refused", refusal: "grant-expired" });
    // One row for each recorded use, and none for a refused use. No grant row holds a use.
    const shown = await call("factory.workflow.show", { targetRoot: root, workflow: "ship" });
    expect(shown.grantUses.map((entry: Value) => [entry.action, entry.scope, entry.unit, entry.runId, entry.usedAt])).toEqual([
      ["merge", "once", used.unit, "run-1", at.toISOString()],
      ["spend", "run", used.unit, "run-1", at.toISOString()],
      ["publish", "standing", used.unit, "run-1", at.toISOString()],
    ]);
    expect(Object.keys(shown.grantUses[0]).sort()).toEqual(["action", "grantId", "runId", "scope", "unit", "usedAt", "useId"].sort());
    expect(shown.summary).toContain("Grant uses (one line for each recorded use, also of a revoked grant):");
    expect(shown.summary).toContain(`- merge: once grant ${used.grant.grantId}, for ${used.unit}, lifecycle run run-1, at ${at.toISOString()}.`);
    expect(Object.keys(shown.grants[0])).not.toContain("lastUsedAt");
  });

  it("refuses without the project, the claim, or final assignments of that workflow and run, never shows the claim ID, and changes nothing", async () => {
    const root = project();
    const job = await openJob(root);
    await call("factory.workflow.save", { targetRoot: root, workflow: "ship", grants: { add: [{ action: "merge", scope: "standing", grantedBy: "the owner" }] } });
    const base = { targetRoot: root, unit: job.unit, workflow: "ship", action: "merge", runId: "run-1", claimId: job.claimId };
    const outputs: Value[] = [];
    // An open assignment keeps the use on the assignment path.
    const open = await call("factory.grant-use.record", base);
    expect(open).toMatchObject({ result: "refused", refusal: "assignment-open" });
    expect(open.nextAction).toContain("make-docs factory assignment save --grant-use <action>");
    outputs.push(open);
    await acceptJob(root, job);
    const before = dump();
    const other = claimedUnit(root, "Another unit");
    const refusals: Array<[Record<string, unknown>, string]> = [
      [{ ...base, targetRoot: undefined }, "project-missing"],
      [{ ...base, claimId: undefined }, "claim-not-held"],
      [{ ...base, claimId: "wc-notmine00" }, "claim-not-held"],
      [{ ...base, claimId: other.claimId }, "claim-not-held"],
      [{ ...base, unit: "999" }, "record-not-found"],
      [{ ...base, runId: "run-2" }, "record-not-found"],
      [{ ...base, workflow: "other" }, "record-not-found"],
      // A claimed unit that never had an assignment has no run to name.
      [{ ...base, unit: other.unit, claimId: other.claimId }, "record-not-found"],
      [{ ...base, action: "deploy" }, "grant-missing"],
    ];
    for (const [input, refusal] of refusals) {
      const clean = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
      const refused = await call("factory.grant-use.record", clean, root);
      expect(refused, `${refusal}: ${JSON.stringify(refused)}`).toMatchObject({ result: "refused", refusal });
      expect(dump(), refusal).toBe(before);
      outputs.push(refused);
    }
    const used = await call("factory.grant-use.record", base);
    expect(used.result, JSON.stringify(used)).toBe("used");
    outputs.push(used);
    // After the claim runs out, the caller no longer holds it.
    expect(await call("factory.grant-use.record", base, temp, new Date(NOW.getTime() + 2 * 3600_000))).toMatchObject({ result: "refused", refusal: "claim-not-held" });
    for (const output of outputs) {
      expect(JSON.stringify(output)).not.toContain(job.claimId);
      expect(JSON.stringify(output)).not.toContain(other.claimId);
    }
    expect(dump()).not.toContain(job.claimId);
  });

  it("keeps one row for each use of a standing grant, on both paths, and keeps the rows after a revoke (R-FACTORY-72)", async () => {
    const root = project();
    const job = await openJob(root);
    await call("factory.workflow.save", { targetRoot: root, workflow: "ship", grants: { add: [{ action: "spend", scope: "standing", grantedBy: "the owner" }] } });
    // The first use, on the open assignment.
    const first = await call("factory.assignment.save", { targetRoot: root, assignmentId: job.assignmentId, expectedVersion: job.version, claimId: job.claimId, grantUse: "spend" });
    expect(first, JSON.stringify(first)).toMatchObject({ result: "updated", grant: { action: "spend", version: 1 }, grantUse: { action: "spend", scope: "standing", runId: "run-1", usedAt: NOW.toISOString() } });
    await acceptJob(root, { ...job, version: first.assignment.version });
    // The second use, on the live claim, at a later time.
    const later = new Date(NOW.getTime() + 5_000);
    const second = await call("factory.grant-use.record", { targetRoot: root, unit: job.unit, workflow: "ship", action: "spend", runId: "run-1", claimId: job.claimId }, temp, later);
    expect(second, JSON.stringify(second)).toMatchObject({ result: "used", grantUse: { usedAt: later.toISOString() } });
    const uses = async () => (await call("factory.workflow.show", { targetRoot: root, workflow: "ship" })).grantUses as Value[];
    expect((await uses()).map((entry) => [entry.grantId, entry.action, entry.scope, entry.runId, entry.usedAt])).toEqual([
      [first.grant.grantId, "spend", "standing", "run-1", NOW.toISOString()],
      [first.grant.grantId, "spend", "standing", "run-1", later.toISOString()],
    ]);
    // A use does not change a standing grant, so the version that the person read still revokes it.
    expect(await call("factory.workflow.save", { targetRoot: root, workflow: "ship", grants: { revoke: [{ grantId: first.grant.grantId, expectedVersion: 1 }] } })).toMatchObject({ result: "saved" });
    const after = await call("factory.workflow.show", { targetRoot: root, workflow: "ship" });
    expect(after.grants).toEqual([]);
    // The revoke keeps both use rows, and each one still names its grant, action, and scope.
    expect(after.grantUses.map((entry: Value) => [entry.grantId, entry.action, entry.scope])).toEqual([[first.grant.grantId, "spend", "standing"], [first.grant.grantId, "spend", "standing"]]);
    // No use row, result, or copy holds the claim ID. The copies and the URI reads hold no use.
    expect(dump()).not.toContain(job.claimId);
    await call("factory.restore", { targetRoot: root });
    for (const name of readdirSync(path.join(root, ".make-docs/factory"))) {
      const copy = readFileSync(path.join(root, ".make-docs/factory", name), "utf8");
      expect(copy, name).not.toContain(second.grantUse.useId);
      expect(copy, name).not.toMatch(/grant use/i);
    }
    for (const uri of ["make-docs://project/aurora/factory/", "make-docs://project/aurora/factory/workflows/ship", "make-docs://project/aurora/factory/assignments/"]) {
      const read = await call("resource.read", { uri, targetRoot: root });
      expect(JSON.stringify(read), uri).not.toContain(second.grantUse.useId);
      expect(JSON.stringify(read), uri).not.toContain(first.grant.grantId);
    }
  });

  it("keeps one row when two callers use one once grant at the same time", async () => {
    const root = project();
    const job = await openJob(root);
    await acceptJob(root, job);
    await call("factory.workflow.save", { targetRoot: root, workflow: "ship", grants: { add: [{ action: "merge", scope: "once", grantedBy: "the owner" }] } });
    const base = { targetRoot: root, unit: job.unit, workflow: "ship", action: "merge", runId: "run-1", claimId: job.claimId };
    const results = await Promise.all([call("factory.grant-use.record", base), call("factory.grant-use.record", base), call("factory.grant-use.record", base)]);
    expect(results.map((result) => result.refusal ?? result.result).sort()).toEqual(["grant-spent", "grant-spent", "used"]);
    const shown = await call("factory.workflow.show", { targetRoot: root, workflow: "ship" });
    expect(shown.grantUses).toHaveLength(1);
    expect(shown.grants).toMatchObject([{ action: "merge", state: "spent" }]);
  });

  it("guards the use rows against a direct write, and a refused use writes no row", async () => {
    const root = project();
    const job = await openJob(root);
    await acceptJob(root, job);
    await call("factory.workflow.save", { targetRoot: root, workflow: "ship", grants: { add: [{ action: "merge", scope: "run", runId: "run-2", grantedBy: "the owner" }] } });
    expect(await call("factory.grant-use.record", { targetRoot: root, unit: job.unit, workflow: "ship", action: "merge", runId: "run-1", claimId: job.claimId })).toMatchObject({ result: "refused", refusal: "grant-out-of-scope" });
    expect((await call("factory.workflow.show", { targetRoot: root, workflow: "ship" })).grantUses).toEqual([]);
    const raw = new DatabaseSync(path.join(store, "store.db"));
    try {
      const triggers = (raw.prepare("SELECT name FROM sqlite_schema WHERE type = 'trigger' AND tbl_name = 'factory_grant_uses' ORDER BY name").all() as Array<{ name: string }>).map((row) => row.name);
      expect(triggers).toEqual(["make_docs_guard_factory_grant_uses_delete", "make_docs_guard_factory_grant_uses_insert", "make_docs_guard_factory_grant_uses_update"]);
      expect(() => raw.exec("DELETE FROM factory_grant_uses")).toThrow();
      expect(() => raw.exec("INSERT INTO factory_grant_uses (use_id, project_id, workflow_name, grant_id, action, scope, unit_store_id, run_id, used_at) VALUES ('fu-00000000', 'p', 'ship', 'fg-00000000', 'merge', 'once', 'u', 'r', '2042-06-15T12:00:00.000Z')")).toThrow();
    } finally {
      raw.close();
    }
  });
});

/* ------------------------------------------------------------------------ */
/* The Skills use the commands                                              */
/* ------------------------------------------------------------------------ */

describe("W30 R0 follow-up Skill text", () => {
  const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
  const read = (...parts: string[]) => readFileSync(path.join(REPO_ROOT, ...parts), "utf8");
  const RUN_FILES = ["SKILL.md", "references/run-loop.md", "references/working-rules.md", "references/messages.md"];

  it("has the run Skill save a backup before a worker changes a file outside git, with no interim stop-and-ask rule (P5 T10)", () => {
    const rules = read("packages/skills/factory/references/working-rules.md");
    const loop = read("packages/skills/factory/references/run-loop.md");
    expect(rules).toContain("`make-docs factory file-backup save <assignment> --file <path> --claim-id <claim-id> --target-root <checkout>` (MCP `factory_file_backup_save`)");
    expect(loop).toContain("save a backup of each file that the job will change, before the job starts (rule `backup-before-change`)");
    for (const word of ["backed-up", "already-backed-up", "no-file", "not-needed"]) expect(rules, word).toContain(`\`${word}\``);
    const all = RUN_FILES.map((file) => read("packages/skills/factory", file)).join("\n");
    expect(all).not.toMatch(/No factory command saves a backup|stop and ask the person|backup capability is missing/);
    expect(read("packages/skills/factory-setup/references/interview.md")).toContain("the run Skill saves a backup of each file before a worker changes it");
  });

  it("has the run Skill record an end-of-scope grant use on the live claim, with no blocked follow-up text", () => {
    const all = RUN_FILES.map((file) => read("packages/skills/factory", file)).join("\n");
    const command = "`make-docs factory grant-use record <unit> --workflow <workflow> --action <action> --run-id <run-id> --claim-id <claim-id> --project <name>`";
    for (const file of ["SKILL.md", "references/run-loop.md", "references/working-rules.md"]) expect(read("packages/skills/factory", file), file).toContain(command);
    expect(all).toContain("### An Action at the End of the Scope");
    expect(all).toContain("do not close the unit and do not complete its lifecycle run yet");
    expect(all).not.toMatch(/A later version of the CLI|has no way to record its grant use yet|cannot record the grant use for it yet/);
  });

  it("keeps the installed copy of the run Skill identical to its source", () => {
    for (const file of RUN_FILES) expect(read(".agents/skills/factory", file), file).toBe(read("packages/skills/factory", file));
  });

  it("follows the end-of-scope steps: accept, keep the claim, record the use, act, then close", async () => {
    const root = project();
    const job = await openJob(root);
    await acceptJob(root, job);
    await call("factory.workflow.save", { targetRoot: root, workflow: "ship", grants: { add: [{ action: "merge", scope: "run", runId: "run-1", grantedBy: "the owner" }] } });
    // The unit stays claimed and open while the person decides, and status shows the claimed unit with no open assignment.
    const status = await call("factory.status", { targetRoot: root });
    expect(status.claimedWithoutAssignment).toHaveLength(1);
    const base = { targetRoot: root, unit: job.unit, workflow: "ship", action: "merge", runId: "run-1", claimId: job.claimId };
    expect(await call("factory.grant-use.record", base)).toMatchObject({ result: "used", grant: { scope: "run", state: "usable" } });
    // Then the unit closes with the same claim, and the claim is gone.
    const unit = await call("work.queue.next", { targetRoot: root, level: "quick-item", claimant: "foreman" });
    const entry = [...(unit.ready ?? []), ...(unit.waiting ?? []), ...(unit.claimed ?? [])].find((item: Value) => String(item.coordinate) === job.unit);
    const closed = await call("work.queue.close", { targetRoot: root, unit: job.unit, expectedVersion: entry?.revision ?? 1, claimId: job.claimId });
    expect(closed.accepted, JSON.stringify(closed)).toBe(true);
    expect(await call("factory.grant-use.record", base)).toMatchObject({ result: "refused", refusal: "claim-not-held" });
  });
});

/* ------------------------------------------------------------------------ */
/* CLI and MCP parity                                                       */
/* ------------------------------------------------------------------------ */

describe("W30 R0 follow-up CLI and MCP parity", () => {
  function grantedHome(): string {
    const home = path.join(temp, "home");
    mkdirSync(home);
    const plan = prepareGenericMcpSetup({ clientLabel: "follow-up", storeRoot: store, executable: verifyMakeDocsExecutable({ executablePath: CLI_PATH }) });
    const connection = (plan.configuration as { mcpServers: { "make-docs": { env: Record<string, string> } } }).mcpServers["make-docs"].env;
    applyGenericMcpSetup(plan);
    const setup = runCliIn(home, ["setup", "--target", home, "--yes", "--no-codex", "--no-claude-code", "--no-skills", "--generic-mcp-client", "follow-up", "--json"]);
    expect(setup.status, setup.stdout + setup.stderr).toBe(0);
    vi.stubEnv(MCP_CONNECTION_ID_ENV, connection.MAKE_DOCS_MCP_CONNECTION_ID!);
    vi.stubEnv(MCP_CONNECTION_KEY_ENV, connection.MAKE_DOCS_MCP_CONNECTION_KEY!);
    return platform.describePath(home).canonicalPath;
  }

  function grantedProject(name: string): string {
    const root = path.join(temp, name);
    mkdirSync(root);
    const setup = runCliIn(root, ["setup", "--target", root, "--yes", "--no-codex", "--no-claude-code", "--no-skills", "--generic-mcp-client", "follow-up", "--json"]);
    expect(setup.status, setup.stdout + setup.stderr).toBe(0);
    const file = path.join(root, ".make-docs/config.yaml");
    const config: Record<string, unknown> = { ...(parseYaml(readFileSync(file, "utf8")) as Record<string, unknown>), projectName: name, ...(parseYaml(WORKFLOW_YAML) as Record<string, unknown>) };
    writeFileSync(file, stringifyYaml(config));
    const canonical = platform.describePath(root).canonicalPath;
    writeWorkStore(canonical, () => null, { storeRoot: store, now: NOW });
    return canonical;
  }

  it("gives the same result in CLI JSON and MCP for the read and each refusal, with the right exit codes", async () => {
    const home = grantedHome();
    const aurora = grantedProject("aurora");
    expect((await call("factory.tools.save", { tools: TOOLS() })).result).toBe("saved");
    // An MCP server runs in the agent's working folder; a machine call is admitted by that folder's grant.
    vi.spyOn(process, "cwd").mockReturnValue(home);
    const cli = (args: string[], cwd = aurora) => {
      const run = runCliIn(cwd, [...args, "--json"]);
      return { status: run.status, value: JSON.parse(run.stdout) as Value };
    };
    const mcp = async (name: string, args: Record<string, unknown>) => (await callMakeDocsMcpTool(name, args)).result as Value;
    const listed = cli(["factory", "tools", "list"], home);
    expect(listed.status).toBe(0);
    expect(listed.value).toEqual(await mcp("factory_tools_list", {}));
    expect(listed.value).toMatchObject({ result: "read", actedOn: { kind: "machine" } });
    // The human words of the read name the machine and end with the read note.
    expect(listed.value.lines[0]).toBe("2 tools saved for this machine. Every project on this machine uses this list.");
    expect(listed.value.lines.at(-1)).toBe("Changes nothing.");
    const refusals: Array<[string[], string, Record<string, unknown>, string]> = [
      [["factory", "file-backup", "save", "fa-0000000000", "--file", "notes/plan.md"], "factory_file_backup_save", { assignmentId: "fa-0000000000", files: ["notes/plan.md"] }, "project-missing"],
      [["factory", "file-backup", "save", "fa-0000000000", "--file", "notes/plan.md", "--claim-id", "wc-notmine00", "--project", "aurora"], "factory_file_backup_save", { project: "aurora", assignmentId: "fa-0000000000", files: ["notes/plan.md"], claimId: "wc-notmine00" }, "record-not-found"],
      [["factory", "grant-use", "record", "1", "--workflow", "ship", "--action", "merge", "--run-id", "run-1"], "factory_grant_use_record", { unit: "1", workflow: "ship", action: "merge", runId: "run-1" }, "project-missing"],
      [["factory", "grant-use", "record", "1", "--workflow", "ship", "--action", "merge", "--run-id", "run-1", "--claim-id", "wc-notmine00", "--target-root", aurora], "factory_grant_use_record", { targetRoot: aurora, unit: "1", workflow: "ship", action: "merge", runId: "run-1", claimId: "wc-notmine00" }, "record-not-found"],
    ];
    for (const [args, name, input, refusal] of refusals) {
      const fromCli = cli(args);
      expect(fromCli.status, name).toBe(1);
      expect(fromCli.value, name).toMatchObject({ result: "refused", refusal });
      expect(fromCli.value, name).toEqual(await mcp(name, { ...input, allowWrite: true }));
      expect(JSON.stringify(fromCli.value), name).not.toContain("wc-notmine00");
    }
  });
});
