import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

import { applyGenericMcpSetup, prepareGenericMcpSetup } from "../src/generic-mcp-setup";
import { verifyMakeDocsExecutable } from "../src/harness-access";
import { MCP_CONNECTION_ID_ENV, MCP_CONNECTION_KEY_ENV } from "../src/mcp-connection";
import { readNativeMcpResource } from "../src/mcp/resources";
import { callMakeDocsMcpTool } from "../src/mcp/tools";
import { createExecutionContext } from "../src/operations/context";
import { StoreAccessStateError } from "../src/operations/store-access";
import { FACTORY_OPERATION_IDS, FACTORY_OPERATION_SCOPES } from "../src/operations/factory/project-scope";
import { FACTORY_DRIFT_WORDS } from "../src/operations/factory/live-plan";
import { FACTORY_CAPABILITY_IDS, FACTORY_DRIFT_CODES, FACTORY_REFUSAL_CODES, FACTORY_STATUS_HISTORY_CODES } from "../src/operations/factory/records";
import { leafHelpEntry } from "../src/operations/leaf-help-table";
import { NAME_CATALOG } from "../src/operations/name-catalog";
import { ADMITTED_OPERATION_IDS, getOperation, invokeOperation, listHarnessCommandRules, validateRegistryHarnessCommandRules } from "../src/operations/registry";
import { validateHarnessCommandRules } from "../src/harness-access/contract";
import { ResourceOperationError } from "../src/operations/resource";
import { platform } from "../src/platform";
import { getInstallationCheckoutId, previewInstallationCheckoutMove, registerSeparateInstallationCheckout } from "../src/store/installation-state";
import { claimWorkUnit, createQuickItem, writeWorkStore } from "../src/store/work-store";
import { withStoreDatabase } from "../src/store/database";
import { createLifecycleRun, readLifecycleRun } from "../src/store/lifecycle-runs";
import { adaptRunCliArgv } from "../src/run/cli";
import { cleanupTempDir, createTempDir } from "./helpers";

/**
 * W30 R0 P3: the `factory` operations (A19 to A25, A56 to A63, A73 to A80,
 * A83). Tool names are generic, such as `tool-a`. Every run uses a temporary
 * MAKE_DOCS_HOME, so no test reaches the real Store.
 */

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const CONTRACT = readFileSync(path.join(REPO_ROOT, ".make-docs/system/contracts/factory-contract.md"), "utf8");
const NOW = new Date("2042-06-15T12:00:00.000Z");
const PROJECT_ID = "factory-p3-project";

const WORKFLOW_YAML = (overrides: { roundLimit?: number; typeVersion?: number; type?: string; extraCapability?: string; noForeman?: boolean; noReviewer?: boolean } = {}) => `factory:
  workflows:
    ship:
      type: ${overrides.type ?? "build-then-review"}
      typeVersion: ${overrides.typeVersion ?? 1}
      roundLimit: ${overrides.roundLimit ?? 3}
      roles:
${overrides.noForeman ? "" : `        foreman:
          job: Claim the unit, brief, judge, and accept.
          capabilities: [read-write-files, run-commands, launch-agent, wait-for-agent, read-agent-result]
          returns: Accepted units and escalations.
`}        builder:
          job: Build the unit.
          capabilities: [read-write-files, run-commands${overrides.extraCapability ? `, ${overrides.extraCapability}` : ""}]
          returns: The result and its evidence.
${overrides.noReviewer ? "" : `        reviewer:
          job: Review the result.
          capabilities: [read-write-files]
          returns: A pass or a defect list.
`}      humanChannel: wait-in-session
`;

const TOOLS = (versionA = "1.0", stateA = "available", expected: { a: number | null; b: number | null } = { a: null, b: null }) => [
  {
    toolId: "tool-a",
    kind: "agent-harness",
    label: "Tool A",
    state: stateA,
    reportedVersion: versionA,
    capabilities: ["read-write-files", "run-commands", "launch-agent", "wait-for-agent", "read-agent-result"],
    proofs: [
      { capabilityId: "read-write-files", method: "Wrote and read a scratch file.", toolVersion: "1.0", provedAt: NOW.toISOString(), result: "proved", notCovered: [] },
      { capabilityId: "run-commands", method: "Ran a harmless command.", toolVersion: "1.0", provedAt: NOW.toISOString(), result: "proved", notCovered: ["long output"] },
      { capabilityId: "launch-agent", method: "Started a fresh agent with a one-line brief.", toolVersion: "1.0", provedAt: NOW.toISOString(), result: "proved", notCovered: [] },
      { capabilityId: "wait-for-agent", method: "Waited for that agent to finish.", toolVersion: "1.0", provedAt: NOW.toISOString(), result: "proved", notCovered: [] },
      { capabilityId: "read-agent-result", method: "Read the agent's returned line.", toolVersion: "1.0", provedAt: NOW.toISOString(), result: "proved", notCovered: [] },
    ],
    expectedVersion: expected.a,
  },
  {
    toolId: "tool-b",
    kind: "agent-harness",
    label: "Tool B",
    state: "available",
    reportedVersion: "2.0",
    capabilities: ["read-write-files"],
    proofs: [{ capabilityId: "read-write-files", method: "Wrote and read a scratch file.", toolVersion: "2.0", provedAt: NOW.toISOString(), result: "proved", notCovered: [] }],
    expectedVersion: expected.b,
  },
];

const BINDING = { roles: { foreman: "tool-a", builder: "tool-a", reviewer: "tool-b" }, worktreeMethod: "none", channelRef: null, wakeMethod: "person", wakeRef: null, knownLosses: ["No tool can wake on its own."] };

const roots: string[] = [];
let temp: string;
let store: string;

beforeEach(() => {
  temp = platform.describePath(createTempDir("make-docs-w30-p3-")).canonicalPath;
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
        if (statSync(entry).isDirectory()) unlock(entry);
      }
    };
    unlock(root);
    cleanupTempDir(root);
  }
});

/* ------------------------------------------------------------------------ */
/* Helpers                                                                  */
/* ------------------------------------------------------------------------ */

type Value = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function project(name = "aurora", config = WORKFLOW_YAML(), projectId = PROJECT_ID, bind = true): string {
  const root = path.join(temp, name);
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${projectId}\nprojectName: ${name}\n${config}`);
  const canonical = platform.describePath(root).canonicalPath;
  if (bind) getInstallationCheckoutId(canonical, store);
  return canonical;
}

/** A second bound checkout of the same project (a separate checkout registration). */
function secondCheckout(name: string, config = WORKFLOW_YAML(), projectName = "aurora"): string {
  const root = path.join(temp, name);
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\nprojectName: ${projectName}\n${config}`);
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

function setConfig(root: string, config: string, projectName = "aurora"): void {
  writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\nprojectName: ${projectName}\n${config}`);
}

/** The lifecycle runs that the assignment fixtures use, as active runs of the project. */
function ensureRuns(projectId = PROJECT_ID): void {
  withStoreDatabase(store, (db) => {
    for (const runId of ["run-1", "run-2", "run-9"]) {
      if (!readLifecycleRun(db, projectId, runId)) createLifecycleRun(db, { projectId, runId, lifecycleStage: "implementation", committedAt: NOW.toISOString() });
    }
  });
}

/** A claimed quick item in the project, as the factory foreman holds it, and the fixture lifecycle runs. */
function claimedUnit(root: string, title = "Write the notes"): { unit: string; claimId: string } {
  ensureRuns();
  return writeWorkStore(root, (db, workProject) => {
    const unit = createQuickItem(db, workProject.projectId, { title, body: null, links: [] });
    const claimed = claimWorkUnit(db, { unitStoreId: unit.storeId, claimant: "foreman", taskHandle: "run-1", ttlSeconds: 3600, expectedVersion: unit.revision, takeover: null }, { now: NOW });
    if (claimed.result !== "claimed") throw new Error(`claim refused: ${claimed.refusal}`);
    return { unit: unit.coordinate, claimId: claimed.claim.claimId };
  }, { storeRoot: store, now: NOW });
}

/** Save the tools and the workflow, pass a test task, and return the ready plan digest. */
async function readyWorkflow(root: string, options: { saveTools?: boolean } = {}): Promise<string> {
  if (options.saveTools !== false) expect((await call("factory.tools.save", { tools: TOOLS() })).result).toBe("saved");
  const saved = await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: BINDING });
  expect(saved.result, JSON.stringify(saved)).toBe("saved");
  expect(saved.readiness).toBe("wired");
  const proof = await call("factory.proof.save", { targetRoot: root, workflow: "ship", outcome: "passed", testTask: "Write one line and review it.", planDigest: saved.revision.planDigest, path: ["builder: tool-a", "reviewer: tool-b"], manualSteps: ["Approve the app permission."] });
  expect(proof.result, JSON.stringify(proof)).toBe("saved");
  expect(proof.readiness).toBe("ready");
  return saved.revision.planDigest as string;
}

/* ------------------------------------------------------------------------ */
/* Registry, names, profile, and scope (T1, T10, T25, A25)                  */
/* ------------------------------------------------------------------------ */

describe("W30 R0 P3 registry, names, MCP profile, and scope", () => {
  it("admits the ten factory operations with CLI paths, MCP names of at most 26 characters, leaf help, and the factory profile (T1, T10, A25)", () => {
    expect(FACTORY_OPERATION_IDS.every((id) => (ADMITTED_OPERATION_IDS as readonly string[]).includes(id))).toBe(true);
    for (const id of FACTORY_OPERATION_IDS) {
      const entry = NAME_CATALOG.find((item) => item.id === id)!;
      expect(entry.status, id).toBe("current");
      expect(entry.newCli, id).toBe(id.split(".").join(" "));
      expect(entry.newMcp.length, id).toBeLessThanOrEqual(26);
      expect(getOperation(id).mcp?.profiles, id).toEqual(["factory"]);
      expect(leafHelpEntry(id).summary.length, id).toBeGreaterThan(0);
      if (FACTORY_OPERATION_SCOPES[id].kind === "read") expect(leafHelpEntry(id).summary, id).toMatch(/Changes nothing\.$/);
    }
  });

  it("admits factory assignment save as a native command rule, and every rule passes the setup check (register D-076)", () => {
    const rules = listHarnessCommandRules();
    expect(rules.find((rule) => rule.id === "make-docs.factory.assignment.save")).toMatchObject({
      commandPrefix: ["factory", "assignment", "save"],
      operationIds: ["factory.assignment.save"],
      access: { store: "write", project: "write", hostConfig: "none" },
    });
    // The check that setup runs on the command rules (harness access contract); `update` is a refused word in any rule.
    expect(() => validateHarnessCommandRules(rules, { list: listHarnessCommandRules, validate: validateRegistryHarnessCommandRules })).not.toThrow();
    expect(rules.some((rule) => rule.commandPrefix.includes("update"))).toBe(false);
    expect(FACTORY_OPERATION_IDS.filter((id) => !rules.some((rule) => rule.operationIds.includes(id)))).toEqual([]);
  });

  it("tags each operation as machine-level or project-scoped, as the contract's project scope table lists it (T25)", () => {
    const table = CONTRACT.slice(CONTRACT.indexOf("## Project Scope"), CONTRACT.indexOf("### Name the Project"));
    for (const id of FACTORY_OPERATION_IDS) {
      const row = table.split("\n").find((line) => line.startsWith(`| \`make-docs ${id.split(".").join(" ")}\` |`))!;
      const [, scope, kind] = row.split(" | ");
      expect(FACTORY_OPERATION_SCOPES[id].scope, id).toBe(scope!.toLowerCase());
      expect(FACTORY_OPERATION_SCOPES[id].kind, id).toBe(kind!.toLowerCase());
      expect(getOperation(id).mutates, id).toBe(FACTORY_OPERATION_SCOPES[id].kind);
    }
    // `factory tools save` takes no project input.
    const schema = getOperation("factory.tools.save").inputSchema;
    expect(schema.safeParse({ tools: TOOLS(), targetRoot: temp }).success).toBe(false);
    expect(schema.safeParse({ tools: TOOLS(), project: "aurora" }).success).toBe(false);
  });

  it("keeps one reason code list in code that matches the contract lists (T23, A63)", () => {
    const list = (label: string) => [...CONTRACT.split("\n").find((line) => line.startsWith(`${label}: `))!.matchAll(/`([a-z-]+)`/g)].map((match) => match[1]);
    expect([...FACTORY_DRIFT_CODES]).toEqual(list("Drift codes"));
    expect([...FACTORY_REFUSAL_CODES]).toEqual(list("Refusal codes"));
    expect([...FACTORY_STATUS_HISTORY_CODES]).toEqual(list("Status history codes"));
    // Released codes are only ever added. This list fails when one is removed or renamed.
    const released = ["not-ready", "claim-not-held", "illegal-move", "final-status", "round-limit-reached", "assignment-open", "plan-digest-mismatch", "proof-missing", "unknown-capability", "type-version-mismatch", "grant-missing", "grant-out-of-scope", "grant-spent", "grant-expired", "never-log-field", "project-missing", "project-not-found", "project-mismatch", "project-checkout-unclear"];
    for (const code of released) expect(FACTORY_REFUSAL_CODES as readonly string[], code).toContain(code);
    for (const code of FACTORY_DRIFT_CODES) expect(FACTORY_DRIFT_WORDS[code].length, code).toBeGreaterThan(10);
  });

  it("keeps the capability IDs equal to the contract catalog, and fails when a released ID is removed or renamed (T16)", () => {
    const table = CONTRACT.slice(CONTRACT.indexOf("## Capability Catalog"), CONTRACT.indexOf("The catalog can grow."));
    const ids = table.split("\n").filter((line) => line.startsWith("| `")).map((line) => /^\| `([a-z-]+)`/.exec(line)![1]);
    expect([...FACTORY_CAPABILITY_IDS]).toEqual(ids);
    const released = ["read-write-files", "run-commands", "launch-agent", "wait-for-agent", "read-agent-result", "wake-on-schedule", "wake-on-event", "message-person", "receive-answer", "isolate-working-copy", "edit-code"];
    for (const id of released) expect(FACTORY_CAPABILITY_IDS as readonly string[], id).toContain(id);
  });

  it("parses the CLI flags into the same inputs as MCP, including --run as a value for status", () => {
    expect(adaptRunCliArgv(["factory", "status", "--run", "run-7", "--project", "aurora"]).invocation.input).toEqual({ project: "aurora", run: "run-7" });
    expect(adaptRunCliArgv(["factory", "assignment", "start", "7", "--workflow", "ship", "--role", "builder", "--run-id", "run-1", "--claim-id", "wc-12345678", "--target-root", temp]).invocation.input).toEqual({
      unit: "7", workflow: "ship", role: "builder", runId: "run-1", claimId: "wc-12345678", resetRounds: false, targetRoot: temp,
    });
    expect(adaptRunCliArgv(["factory", "workflow", "save", "ship", "--grants-json", "{\"add\":[]}", "--project", "aurora"]).invocation.input).toEqual({ workflow: "ship", grants: { add: [] }, project: "aurora" });
  });
});

/* ------------------------------------------------------------------------ */
/* Project scope (T26 to T29, A74 to A77)                                   */
/* ------------------------------------------------------------------------ */

describe("W30 R0 P3 project scope", () => {
  it("refuses each project write that names no project, also inside a project folder, and changes nothing (A74)", async () => {
    const root = project();
    await call("factory.tools.save", { tools: TOOLS() });
    const before = dump();
    const writes: Array<[string, Record<string, unknown>]> = [
      ["factory.workflow.save", { workflow: "ship", binding: BINDING }],
      ["factory.workflow.save", { workflow: "ship", grants: { add: [{ action: "merge", scope: "standing", grantedBy: "the owner" }] } }],
      ["factory.proof.save", { workflow: "ship", outcome: "passed", testTask: "Test", planDigest: "a".repeat(64), path: ["builder"] }],
      ["factory.assignment.start", { workflow: "ship", unit: "1", role: "builder", runId: "run-1" }],
      ["factory.assignment.save", { assignmentId: "fa-x", expectedVersion: 1 }],
      ["factory.restore", {}],
    ];
    for (const [id, input] of writes) {
      const value = await call(id, input, root);
      expect(value, id).toMatchObject({ result: "refused", refusal: "project-missing", actedOn: { kind: "none" } });
      expect(value.lines[0], id).toBe("Refused: no project was named. This factory write names no project, so nothing changed. A factory write never uses the current folder.");
      expect(value.nextAction, id).toContain("--target-root <path> or --project <name>");
      expect(value.nextAction, id).toContain("targetRoot or project");
    }
    expect(dump()).toBe(before);
    expect(existsSync(path.join(root, ".make-docs/factory"))).toBe(false);
  });

  it("acts on the same project by --project and by --target-root, and refuses an unknown name, a mismatch, and an unclear checkout (A75)", async () => {
    const root = project();
    project("other", "", "other-project");
    await call("factory.tools.save", { tools: TOOLS() });
    const byPath = await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: BINDING });
    const byName = await call("factory.workflow.save", { project: "aurora", workflow: "ship", binding: BINDING, expectedVersion: byPath.version });
    expect(byName.actedOn).toEqual(byPath.actedOn);
    expect(byName.actedOn).toMatchObject({ kind: "project", projectName: "aurora", projectId: PROJECT_ID, chosenBy: "named" });
    expect(byName.revision).toMatchObject({ number: 1, created: false });
    const before = dump();
    expect(await call("factory.workflow.save", { project: "nobody", workflow: "ship", binding: BINDING })).toMatchObject({ result: "refused", refusal: "project-not-found" });
    const mismatch = await call("factory.workflow.save", { project: "other", targetRoot: root, workflow: "ship", binding: BINDING });
    expect(mismatch).toMatchObject({ result: "refused", refusal: "project-mismatch" });
    expect(mismatch.reason).toContain(`project aurora (${PROJECT_ID})`);
    expect(mismatch.reason).toContain("project other (other-project)");
    secondCheckout("aurora-two");
    const unclear = await call("factory.workflow.save", { project: "aurora", workflow: "ship", binding: BINDING, expectedVersion: byName.version });
    expect(unclear).toMatchObject({ result: "refused", refusal: "project-checkout-unclear", actedOn: { kind: "project", projectName: "aurora" } });
    expect(unclear.reason).toContain("it has 2 bound checkouts");
    expect(unclear.nextAction).toContain("--target-root");
    // A grant-only save reads no project file, but its grant belongs to one checkout, so it names one (review item 7).
    expect(await call("factory.workflow.save", { project: "aurora", workflow: "ship", grants: { add: [{ action: "merge", scope: "standing", grantedBy: "the owner" }] } })).toMatchObject({ result: "refused", refusal: "project-checkout-unclear" });
    const grant = await call("factory.workflow.save", { targetRoot: root, workflow: "ship", grants: { add: [{ action: "merge", scope: "standing", grantedBy: "the owner" }] } });
    expect(grant).toMatchObject({ result: "saved", grantOnly: true });
    expect(JSON.parse(dump()).find(([table]: [string]) => table === "factory_workflow_plans")[1]).toEqual(JSON.parse(before).find(([table]: [string]) => table === "factory_workflow_plans")[1]);
  });

  it("names this machine for tools save, and the project for every project result (A76)", async () => {
    const root = project();
    const tools = await call("factory.tools.save", { tools: TOOLS() });
    expect(tools.actedOn).toEqual({ kind: "machine", text: "this machine" });
    expect(tools.lines[0]).toBe("Saved 2 tools for this machine. Every project on this machine uses this list.");
    const saved = await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: BINDING });
    expect(saved.lines[0]).toBe(`Saved workflow ship for project aurora (${PROJECT_ID}).`);
    for (const [id, input] of [
      ["factory.workflow.show", { workflow: "ship", targetRoot: root }],
      ["factory.workflow.list", { targetRoot: root }],
      ["factory.assignment.list", { targetRoot: root }],
      ["factory.status", { targetRoot: root }],
      ["factory.restore", { targetRoot: root }],
    ] as Array<[string, Record<string, unknown>]>) {
      const value = await call(id, input);
      expect(value.actedOn, id).toMatchObject({ kind: "project", projectName: "aurora", projectId: PROJECT_ID });
      expect(value.lines[0], id).toContain(`project aurora (${PROJECT_ID})`);
    }
  });

  it("reads the current folder's project and says so, says named for --project, and refuses a folder that is not a project (A77, T29)", async () => {
    const root = project();
    await call("factory.tools.save", { tools: TOOLS() });
    await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: BINDING });
    const fromFolder = await call("factory.workflow.list", {}, root);
    expect(fromFolder.actedOn.chosenBy).toBe("current-folder");
    expect(fromFolder.lines[0]).toBe(`Project: project aurora (${PROJECT_ID}), taken from the current folder. Name another with --project <name> or --target-root <path>.`);
    const named = await call("factory.workflow.list", { project: "aurora" }, temp);
    expect(named.actedOn.chosenBy).toBe("named");
    expect(named.lines[0]).toBe(`Project: project aurora (${PROJECT_ID}), as named.`);
    const plain = path.join(temp, "plain");
    mkdirSync(plain);
    for (const id of ["factory.workflow.list", "factory.assignment.list", "factory.status"]) {
      expect(await call(id, {}, plain), id).toMatchObject({ result: "refused", refusal: "project-missing" });
    }
    expect(await call("factory.workflow.show", { workflow: "ship" }, plain)).toMatchObject({ result: "refused", refusal: "project-missing" });
  });
});

/* ------------------------------------------------------------------------ */
/* Save operations (T2 to T7, T15 to T19, A19 to A22, A58, A60)             */
/* ------------------------------------------------------------------------ */

describe("W30 R0 P3 save operations", () => {
  it("checks tools and proofs, refuses an unknown capability, and keeps expected versions (T2, T7, T15, T16)", async () => {
    project();
    const saved = await call("factory.tools.save", { tools: TOOLS() });
    expect(saved.tools.map((tool: Value) => [tool.toolId, tool.version])).toEqual([["tool-a", 1], ["tool-b", 1]]);
    expect(await call("factory.tools.save", { tools: TOOLS() })).toMatchObject({ result: "refused", refusal: "version-conflict" });
    const unknown = TOOLS("1.0", "available", { a: 1, b: 1 });
    unknown[0]!.capabilities = ["read-write-files", "teleport"];
    const refused = await call("factory.tools.save", { tools: unknown });
    expect(refused).toMatchObject({ result: "refused", refusal: "unknown-capability", details: { capabilityIds: ["teleport"] } });
    const badProof = TOOLS("1.0", "available", { a: 1, b: 1 });
    (badProof[0]!.proofs[0] as Value).result = "maybe";
    await expect(call("factory.tools.save", { tools: badProof })).rejects.toThrow(/Invalid input/);
    // A refused list changes no tool.
    const second = await call("factory.tools.save", { tools: TOOLS("1.1", "available", { a: 1, b: 1 }) });
    expect(second.tools.map((tool: Value) => [tool.toolId, tool.version, tool.reportedVersion])).toEqual([["tool-a", 2, "1.1"], ["tool-b", 2, "2.0"]]);
  });

  it("saves a workflow as wired, refuses ready without a passed proof and names it, and saves no new revision for no change (T3, T18, A20, A60)", async () => {
    const root = project();
    await call("factory.tools.save", { tools: TOOLS() });
    const asked = await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: BINDING, readiness: "ready" });
    expect(asked).toMatchObject({ result: "refused", refusal: "proof-missing" });
    expect(asked.reason).toContain("The missing proof is the passed test task of workflow ship under that plan.");
    const first = await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: BINDING });
    expect(first).toMatchObject({ readiness: "wired", revision: { number: 1, created: true }, readyRevision: null });
    expect(first.copies.written).toEqual([".gitignore", "tools.md", "workflow-ship.md"]);
    const again = await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: BINDING, expectedVersion: first.version });
    expect(again.revision).toEqual({ ...first.revision, created: false });
    // The same inputs in another key order give the same digest.
    setConfig(root, `factory:
  workflows:
    ship:
      humanChannel: wait-in-session
      roles:
        foreman:
          returns: Accepted units and escalations.
          capabilities: [wait-for-agent, read-agent-result, launch-agent, run-commands, read-write-files]
          job: Claim the unit, brief, judge, and accept.
        reviewer:
          returns: A pass or a defect list.
          capabilities: [read-write-files]
          job: Review the result.
        builder:
          returns: The result and its evidence.
          capabilities: [run-commands, read-write-files]
          job: Build the unit.
      roundLimit: 3
      typeVersion: 1
      type: build-then-review
`);
    const reordered = await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: { ...BINDING, roles: { reviewer: "tool-b", builder: "tool-a", foreman: "tool-a" } }, expectedVersion: again.version });
    expect(reordered.revision).toMatchObject({ number: 1, created: false, planDigest: first.revision.planDigest });
    // No plan step, condition, or branch field exists.
    const show = await call("factory.workflow.show", { targetRoot: root, workflow: "ship" });
    expect(Object.keys(show.revision.plan).sort()).toEqual(["binding", "definition", "moveTableVersion", "roleTools", "type", "workflow"]);
  });

  it("refuses a type version that does not match the type file, and an unknown capability in the config (T16, T18)", async () => {
    const root = project("aurora", WORKFLOW_YAML({ typeVersion: 2 }));
    await call("factory.tools.save", { tools: TOOLS() });
    const mismatch = await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: BINDING });
    expect(mismatch).toMatchObject({ result: "refused", refusal: "type-version-mismatch" });
    expect(mismatch.reason).toBe("The config names version 2 of type build-then-review, but the type file states version 1.");
    setConfig(root, WORKFLOW_YAML({ extraCapability: "teleport" }));
    expect(await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: BINDING })).toMatchObject({ result: "refused", refusal: "unknown-capability" });
  });

  it("records a proof only for the current plan and makes it ready on a pass (T4, T19)", async () => {
    const root = project();
    await call("factory.tools.save", { tools: TOOLS() });
    const saved = await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: BINDING });
    const wrong = await call("factory.proof.save", { targetRoot: root, workflow: "ship", outcome: "passed", testTask: "Test", planDigest: "b".repeat(64), path: ["builder"] });
    expect(wrong).toMatchObject({ result: "refused", refusal: "plan-digest-mismatch" });
    const failed = await call("factory.proof.save", { targetRoot: root, workflow: "ship", outcome: "failed", testTask: "Test", planDigest: saved.revision.planDigest, path: ["builder"] });
    expect(failed).toMatchObject({ result: "saved", readiness: "wired", readyRevision: null });
    const passed = await call("factory.proof.save", { targetRoot: root, workflow: "ship", outcome: "passed", testTask: "Test", planDigest: saved.revision.planDigest, path: ["builder"] });
    expect(passed).toMatchObject({ result: "saved", readiness: "ready", readyRevision: 1 });
    expect(passed.lines[1]).toBe("Plan revision 1 is now the ready revision. The workflow is ready and takes new work.");
  });

  it("refuses a passed test task for a draft plan: only a wired plan becomes ready", async () => {
    const root = project();
    // No tool is saved, so both roles are bound to missing tools and the plan is draft.
    const saved = await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: BINDING });
    expect(saved.readiness).toBe("draft");
    const refused = await call("factory.proof.save", { targetRoot: root, workflow: "ship", outcome: "passed", testTask: "Test", planDigest: saved.revision.planDigest, path: ["builder"] });
    expect(refused).toMatchObject({ result: "refused", refusal: "not-ready", details: { readiness: "draft" } });
    expect((await call("factory.workflow.show", { targetRoot: root, workflow: "ship" })).live.readiness).toBe("draft");
  });

  it("writes and revokes grants in a grant-only save without a plan revision or a readiness change (T17, A59)", async () => {
    const root = project();
    await readyWorkflow(root);
    const before = await call("factory.workflow.show", { targetRoot: root, workflow: "ship" });
    const grant = await call("factory.workflow.save", { targetRoot: root, workflow: "ship", grants: { add: [{ action: "deploy", scope: "run", runId: "run-1", grantedBy: "the owner" }] } });
    expect(grant).toMatchObject({ result: "saved", grantOnly: true });
    expect(grant.lines.at(-1)).toBe("This grant-only save resolved no plan, saved no plan revision, and did not change readiness.");
    const after = await call("factory.workflow.show", { targetRoot: root, workflow: "ship" });
    expect(after.keptRevisions).toEqual(before.keptRevisions);
    expect(after.live.readiness).toBe("ready");
    expect(after.grants.map((entry: Value) => [entry.action, entry.scope, entry.runId])).toEqual([["deploy", "run", "run-1"]]);
    expect(JSON.stringify(after.revision.plan)).not.toContain("deploy");
    const revoked = await call("factory.workflow.save", { targetRoot: root, workflow: "ship", grants: { revoke: [{ grantId: grant.grants.added[0].grantId, expectedVersion: 1 }] } });
    expect(revoked.grants.revoked).toEqual([grant.grants.added[0].grantId]);
  });

  it("refuses a credential, an environment setting, a prompt, and a file body in each kind of record, and never shows the value (T22, A62)", async () => {
    const root = project();
    const digest = await readyWorkflow(root);
    const { unit, claimId } = claimedUnit(root);
    const secret = "sk-abcdefghijklmnopqrstuvwxyz0123456789ABCD";
    const cases: Array<[string, Record<string, unknown>]> = [
      ["factory.tools.save", { tools: [{ ...TOOLS("1.0", "available", { a: 1, b: 1 })[0], label: `token=${secret}` }] }],
      ["factory.tools.save", { tools: [{ ...TOOLS("1.0", "available", { a: 1, b: 1 })[0], label: "PATH=/usr/bin" }] }],
      ["factory.workflow.save", { targetRoot: root, workflow: "ship", expectedVersion: 2, binding: { ...BINDING, knownLosses: ["You are the builder.\nRead every file and then write the plan."] } }],
      ["factory.workflow.save", { targetRoot: root, workflow: "ship", grants: { add: [{ action: "merge", scope: "once", grantedBy: `password: ${secret}` }] } }],
      ["factory.proof.save", { targetRoot: root, workflow: "ship", outcome: "failed", testTask: "x".repeat(300), planDigest: digest, path: ["builder"] }],
      ["factory.assignment.start", { targetRoot: root, workflow: "ship", unit, role: "builder", runId: "run-1", claimId, taskHandle: "$HOME" }],
    ];
    for (const [id, input] of cases) {
      const value = await call(id, input);
      expect(value, `${id} ${JSON.stringify(input).slice(0, 80)}`).toMatchObject({ result: "refused", refusal: "never-log-field" });
      expect(JSON.stringify(value)).not.toContain(secret);
      expect(JSON.stringify(value)).not.toContain("/usr/bin");
      expect(JSON.stringify(value)).not.toContain("Read every file");
      expect(value.details.field).toBeTruthy();
    }
  });
});

/* ------------------------------------------------------------------------ */
/* Live readiness, drift, and status (T8, T9, T20, T21, A23, A24, A58, A61) */
/* ------------------------------------------------------------------------ */

describe("W30 R0 P3 live readiness and drift", () => {
  it("shows ready, then drifted with the code and one next step for each change, and ready again after the undo (A24, A58, A61)", async () => {
    const root = project();
    await readyWorkflow(root);
    const state = async () => (await call("factory.workflow.show", { targetRoot: root, workflow: "ship" })).live;
    expect((await state()).readiness).toBe("ready");

    // A new tool version.
    await call("factory.tools.save", { tools: TOOLS("1.1", "available", { a: 1, b: 1 }) });
    let live = await state();
    expect(live.readiness).toBe("drifted");
    expect(live.drift.map((entry: Value) => entry.code)).toEqual(["tool-version-changed"]);
    // One tool that fills two roles gives one entry that names both.
    expect(live.drift[0]).toMatchObject({ role: "builder, foreman", toolId: "tool-a" });
    expect(live.drift[0].text).toBe("Tool tool-a for the builder and foreman roles reports version 1.1, but its proof is for version 1.0.");
    expect(live.drift[0].nextStep).toContain("If version 1.0 comes back, the workflow is ready again with no new step.");
    await call("factory.tools.save", { tools: TOOLS("1.0", "available", { a: 2, b: 2 }) });
    expect((await state()).readiness).toBe("ready");

    // A missing tool and a blocked tool.
    await call("factory.tools.save", { tools: TOOLS("1.0", "missing", { a: 3, b: 3 }) });
    expect((await state()).drift.map((entry: Value) => entry.code)).toEqual(["tool-missing"]);
    await call("factory.tools.save", { tools: TOOLS("1.0", "blocked", { a: 4, b: 4 }) });
    expect((await state()).drift.map((entry: Value) => entry.code)).toEqual(["permission-lost"]);
    await call("factory.tools.save", { tools: TOOLS("1.0", "available", { a: 5, b: 5 }) });
    expect((await state()).readiness).toBe("ready");

    // A config edit by hand, then its undo.
    setConfig(root, WORKFLOW_YAML({ roundLimit: 2 }));
    live = await state();
    expect(live.drift.map((entry: Value) => entry.code)).toEqual(["config-changed"]);
    setConfig(root, WORKFLOW_YAML());
    expect((await state()).readiness).toBe("ready");

    // A save of the edit gives wired: the new plan needs its own test task.
    setConfig(root, WORKFLOW_YAML({ roundLimit: 2 }));
    const saved = await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: BINDING, expectedVersion: 2 });
    expect(saved).toMatchObject({ readiness: "wired", revision: { number: 2, created: true }, readyRevision: 1 });
    expect((await state()).readiness).toBe("wired");
  });

  it("shows type-changed for a changed project type and type-name-clash for a project type with a shipped name (A61)", async () => {
    const typeText = (extra = "") => `# Local Review\n\n## Purpose\n\nOne builder, one reviewer.\n\nType version: 1.\n\n## Roles\n\n| Role | Job | Capabilities needed |\n| --- | --- | --- |\n| Builder | Builds. | \`read-write-files\` |\n| Reviewer | Reviews. | \`read-write-files\` |\n${extra}`;
    const root = project("aurora", WORKFLOW_YAML({ type: "local-review" }));
    const folder = path.join(root, "docs/assets/project/factory/workflows");
    mkdirSync(folder, { recursive: true });
    writeFileSync(path.join(folder, "local-review.md"), typeText());
    await readyWorkflow(root);
    writeFileSync(path.join(folder, "local-review.md"), typeText("\n## Limits\n\nNone.\n"));
    const show = await call("factory.workflow.show", { targetRoot: root, workflow: "ship" });
    expect(show.live.drift.map((entry: Value) => entry.code)).toEqual(["type-changed"]);
    writeFileSync(path.join(folder, "local-review.md"), typeText());
    expect((await call("factory.workflow.show", { targetRoot: root, workflow: "ship" })).live.readiness).toBe("ready");
    writeFileSync(path.join(folder, "build-then-review.md"), typeText());
    setConfig(root, WORKFLOW_YAML());
    const clash = await call("factory.workflow.show", { targetRoot: root, workflow: "ship" });
    expect(clash.live).toMatchObject({ readiness: "drifted", drift: [{ code: "type-name-clash" }] });
  });

  it("status groups one project by checkout, then by lifecycle run, with each checkout's own readiness, and --run shows one (T8, T33, A23, A83)", async () => {
    const first = project();
    await readyWorkflow(first);
    const second = secondCheckout("aurora-two");
    const one = claimedUnit(first, "First unit");
    const two = claimedUnit(first, "Second unit");
    const startedOne = await call("factory.assignment.start", { targetRoot: first, workflow: "ship", unit: one.unit, role: "builder", runId: "run-1", claimId: one.claimId });
    expect(startedOne, JSON.stringify(startedOne)).toMatchObject({ result: "started" });
    const startedTwo = await call("factory.assignment.start", { targetRoot: second, workflow: "ship", unit: two.unit, role: "builder", runId: "run-2", claimId: two.claimId });
    expect(startedTwo, JSON.stringify(startedTwo)).toMatchObject({ result: "started" });
    expect(startedOne.assignment.checkoutId).toBe(startedOne.checkout.checkoutId);
    expect(startedTwo.assignment.checkoutId).toBe(startedTwo.checkout.checkoutId);
    expect(startedOne.assignment.checkoutId).not.toBe(startedTwo.assignment.checkoutId);
    // The second checkout's config changed by hand, so only its group drifts.
    setConfig(second, WORKFLOW_YAML({ roundLimit: 1 }));
    // Two checkouts: a grant belongs to one checkout, so a name alone is refused (review item 7).
    const byName = await call("factory.status", { project: "aurora" });
    expect(byName).toMatchObject({ result: "refused", refusal: "project-checkout-unclear" });
    expect(byName.reason).toContain("belongs to one checkout, and project aurora (factory-p3-project) gives no single checkout: it has 2 bound checkouts.");
    expect(byName.reason.match(/belongs to one checkout/g)).toHaveLength(1);
    expect(byName.nextAction).toContain("--target-root");
    const status = await call("factory.status", { targetRoot: first });
    expect(status.checkouts).toHaveLength(2);
    const byRoot = Object.fromEntries(status.checkouts.map((group: Value) => [group.root, group]));
    expect(byRoot[first].workflows[0].readiness).toBe("ready");
    expect(byRoot[second].workflows[0].readiness).toBe("drifted");
    expect(byRoot[first].runs.map((run: Value) => run.runId)).toEqual(["run-1"]);
    expect(byRoot[second].runs.map((run: Value) => run.runId)).toEqual(["run-2"]);
    // Human words first: the unit, its tool, its state, and the last check time.
    const firstRow = status.lines.findIndex((line: string) => line.includes("task 1 (builder, part main)"));
    expect(status.lines[firstRow]).toBe(`    - task 1 (builder, part main): tool tool-a (Tool A), offered, last check ${NOW.toISOString()}; round 0 of 3; claimed by foreman until 2042-06-15T13:00:00.000Z.`);
    expect(status.lines.at(-1)).toBe("Changes nothing.");
    const onlyTwo = await call("factory.status", { targetRoot: first, run: "run-2" });
    expect(onlyTwo.checkouts.map((group: Value) => group.root)).toEqual([second]);
    // A checkout that cannot be read shows unknown readiness and why.
    writeFileSync(path.join(second, ".make-docs/config.yaml"), "projectId: [\n");
    const broken = await call("factory.status", { targetRoot: first });
    const brokenGroup = broken.checkouts.find((group: Value) => group.root === second);
    expect(brokenGroup).toMatchObject({ readable: false });
    expect(broken.lines).toContain(`Checkout ${second}:`);
    expect(broken.lines.some((line: string) => line.startsWith("  Readiness: unknown."))).toBe(true);
  });
});

/* ------------------------------------------------------------------------ */
/* Assignments, claims, moves, rounds, and grants (T5, T12 to T14, T17, T24) */
/* ------------------------------------------------------------------------ */

describe("W30 R0 P3 review fixes", () => {
  it("starts an assignment only for a role of the ready plan and only with its bound tool (review item 1)", async () => {
    const root = project();
    await readyWorkflow(root);
    const { unit, claimId } = claimedUnit(root);
    const base = { targetRoot: root, workflow: "ship", unit, runId: "run-1", claimId };
    const unknownRole = await call("factory.assignment.start", { ...base, role: "researcher" });
    expect(unknownRole).toMatchObject({ result: "refused", refusal: "invalid-record", details: { field: "role" } });
    expect(unknownRole.reason).toBe("The ready plan of workflow ship has no researcher role. Its roles are builder, foreman, reviewer.");
    const unknownTool = await call("factory.assignment.start", { ...base, role: "builder", toolId: "tool-z" });
    expect(unknownTool).toMatchObject({ result: "refused", refusal: "invalid-record", details: { field: "toolId" } });
    // tool-b is available and proved, but it is bound to the reviewer, not to the builder. The contract has no substitute tool.
    const unbound = await call("factory.assignment.start", { ...base, role: "builder", toolId: "tool-b" });
    expect(unbound).toMatchObject({ result: "refused", refusal: "invalid-record" });
    expect(unbound.reason).toBe("Tool tool-b is not the tool that the ready plan binds to the builder role. The bound tool is tool-a.");
    expect(JSON.stringify([unknownRole, unknownTool, unbound])).not.toContain("--tool");
    expect(await call("factory.assignment.start", { ...base, role: "builder", toolId: "tool-a" })).toMatchObject({ result: "started", assignment: { toolId: "tool-a" } });
    expect(await call("factory.assignment.start", { ...base, role: "reviewer" })).toMatchObject({ result: "started", assignment: { toolId: "tool-b" } });
  });

  it("refuses a workflow save whose config lacks a role that the type's Roles table names (review item 2)", async () => {
    const root = project("aurora", WORKFLOW_YAML({ noForeman: true, noReviewer: true }));
    await call("factory.tools.save", { tools: TOOLS() });
    const refused = await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: { ...BINDING, roles: { builder: "tool-a" } } });
    expect(refused).toMatchObject({ result: "refused", refusal: "invalid-record", details: { roles: ["foreman", "reviewer"] } });
    expect(refused.reason).toBe("Workflow type build-then-review needs the roles foreman, reviewer, which the config entry of workflow ship does not have.");
    expect((await call("factory.workflow.show", { targetRoot: root, workflow: "ship" }))).toMatchObject({ result: "refused", refusal: "record-not-found" });
    setConfig(root, WORKFLOW_YAML({ noForeman: true }));
    expect((await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: BINDING })).details).toEqual({ roles: ["foreman"] });
  });

  it("names only config-changed when only the config changed a role's capabilities (review item 3)", async () => {
    const root = project();
    await readyWorkflow(root);
    setConfig(root, WORKFLOW_YAML({ extraCapability: "edit-code" }));
    const live = (await call("factory.workflow.show", { targetRoot: root, workflow: "ship" })).live;
    expect(live.readiness).toBe("drifted");
    expect(live.drift.map((entry: Value) => entry.code)).toEqual(["config-changed"]);
  });

  it("names every role and every capability in one merged drift line for a tool that fills two roles (re-check item 1)", async () => {
    const root = project();
    await readyWorkflow(root);
    // tool-a fills the builder and the foreman. The builder needs run-commands; only the foreman needs launch-agent.
    const tools = TOOLS("1.0", "available", { a: 1, b: 1 });
    for (const proof of tools[0]!.proofs) if (proof.capabilityId === "run-commands" || proof.capabilityId === "launch-agent") proof.result = "contradicted";
    expect((await call("factory.tools.save", { tools })).result).toBe("saved");
    const live = (await call("factory.workflow.show", { targetRoot: root, workflow: "ship" })).live;
    expect(live.readiness).toBe("drifted");
    const contradicted = live.drift.filter((entry: Value) => entry.code === "proof-contradicted");
    expect(contradicted).toHaveLength(1);
    expect(contradicted[0]).toMatchObject({
      role: "builder, foreman",
      toolId: "tool-a",
      text: "A proof of launch-agent, run-commands for tool tool-a (builder and foreman roles) was contradicted.",
      nextStep: "Bind a tool to the builder and foreman roles that has launch-agent, run-commands proved, or prove it again with make-docs factory tools save, then save the workflow.",
    });
    for (const entry of live.drift) expect(`${entry.text} ${entry.nextStep}`, entry.code).not.toMatch(/builder and foreman role(?!s)/);
  });

  it("refuses an assignment for a lifecycle run that the project does not have, or that has ended (review item 4)", async () => {
    const root = project();
    await readyWorkflow(root);
    const { unit, claimId } = claimedUnit(root);
    const base = { targetRoot: root, workflow: "ship", unit, role: "builder", claimId };
    const mistyped = await call("factory.assignment.start", { ...base, runId: "run-l" });
    expect(mistyped).toMatchObject({ result: "refused", refusal: "record-not-found", details: { field: "runId" } });
    expect(mistyped.reason).toBe(`project aurora (${PROJECT_ID}) has no lifecycle run run-l.`);
    await call("lifecycle.abandon", { repoRoot: root, storeRoot: store, runId: "run-2", expectedVersion: 1 });
    const ended = await call("factory.assignment.start", { ...base, runId: "run-2" });
    expect(ended).toMatchObject({ result: "refused", refusal: "invalid-record" });
    expect(ended.reason).toBe("Lifecycle run run-2 is abandoned, so it takes no new assignment.");
    expect(await call("factory.assignment.start", { ...base, runId: "run-1" })).toMatchObject({ result: "started" });
  });

  it("says plainly that a workflow removed from the config cannot be removed yet, and what to do now (review item 6)", async () => {
    const root = project();
    await readyWorkflow(root);
    setConfig(root, "");
    const live = (await call("factory.workflow.show", { targetRoot: root, workflow: "ship" })).live;
    expect(live).toMatchObject({ readiness: "drifted", drift: [{ code: "config-changed" }] });
    expect(live.nextStep).toBe("Make Docs cannot remove a saved workflow yet. To use it again, put its entry back in .make-docs/config.yaml. To stop using it, leave it as it is: a drifted workflow takes no new work and changes nothing else.");
    expect(JSON.stringify(live)).not.toContain("run factory setup again");
  });

  it("refuses a --project call on a project with two checkouts, because a grant belongs to one checkout, and accepts --target-root (review item 7)", async () => {
    const first = project();
    await readyWorkflow(first);
    const second = secondCheckout("aurora-two");
    for (const [id, input] of [
      ["factory.status", { project: "aurora" }],
      ["factory.workflow.list", { project: "aurora" }],
      ["factory.assignment.list", { project: "aurora" }],
      ["factory.workflow.show", { project: "aurora", workflow: "ship" }],
      ["factory.assignment.save", { project: "aurora", assignmentId: "fa-none", expectedVersion: 1 }],
    ] as Array<[string, Record<string, unknown>]>) {
      const value = await call(id, input);
      expect(value, id).toMatchObject({ result: "refused", refusal: "project-checkout-unclear", actedOn: { kind: "project", projectName: "aurora" } });
      expect(value.nextAction, id).toContain("--target-root <path>");
    }
    for (const root of [first, second]) {
      expect((await call("factory.workflow.list", { project: "aurora", targetRoot: root })).actedOn).toMatchObject({ kind: "project", projectName: "aurora" });
    }
  });
});

describe("W30 R0 P3 assignments", () => {
  it("refuses a start that is not ready, without the claim ID, or with a wrong one, and never shows a claim ID (T21, T24, A21, A73)", async () => {
    const root = project();
    await call("factory.tools.save", { tools: TOOLS() });
    await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: BINDING });
    const { unit, claimId } = claimedUnit(root);
    const notReady = await call("factory.assignment.start", { targetRoot: root, workflow: "ship", unit, role: "builder", runId: "run-1", claimId });
    expect(notReady).toMatchObject({ result: "refused", refusal: "not-ready" });
    const saved = await call("factory.workflow.show", { targetRoot: root, workflow: "ship" });
    await call("factory.proof.save", { targetRoot: root, workflow: "ship", outcome: "passed", testTask: "Test", planDigest: saved.live.currentPlanDigest, path: ["builder"] });
    expect(await call("factory.assignment.start", { targetRoot: root, workflow: "ship", unit, role: "builder", runId: "run-1" })).toMatchObject({ result: "refused", refusal: "claim-not-held" });
    expect(await call("factory.assignment.start", { targetRoot: root, workflow: "ship", unit, role: "builder", runId: "run-1", claimId: "wc-notmine00" })).toMatchObject({ result: "refused", refusal: "claim-not-held" });
    const started = await call("factory.assignment.start", { targetRoot: root, workflow: "ship", unit, role: "builder", runId: "run-1", claimId });
    expect(started).toMatchObject({ result: "started", assignment: { status: "offered", planRevision: 1, roundCount: 0 } });
    const update = await call("factory.assignment.save", { targetRoot: root, assignmentId: started.assignment.assignmentId, expectedVersion: 1, status: "running", reason: "tool-started" });
    expect(update).toMatchObject({ result: "refused", refusal: "claim-not-held" });
    const outputs = [started, update, await call("factory.assignment.list", { targetRoot: root }), await call("factory.status", { targetRoot: root }), await call("factory.restore", { targetRoot: root })];
    for (const output of outputs) expect(JSON.stringify(output)).not.toContain(claimId);
    expect(dump()).not.toContain(claimId);
    for (const name of readdirSync(path.join(root, ".make-docs/factory"))) expect(readFileSync(path.join(root, ".make-docs/factory", name), "utf8")).not.toContain(claimId);
  });

  it("accepts the moves in the table, refuses others and changes to final assignments, counts rounds, and stops at the limit (T12 to T14, A56, A57)", async () => {
    const root = project("aurora", WORKFLOW_YAML({ roundLimit: 2 }));
    await readyWorkflow(root);
    const { unit, claimId } = claimedUnit(root);
    const started = await call("factory.assignment.start", { targetRoot: root, workflow: "ship", unit, role: "builder", runId: "run-1", claimId });
    let version = started.assignment.version as number;
    const id = started.assignment.assignmentId as string;
    const move = async (status: string, reason: string) => {
      const value = await call("factory.assignment.save", { project: "aurora", assignmentId: id, expectedVersion: version, claimId, status, reason });
      if (value.result === "updated") version = value.assignment.version;
      return value;
    };
    expect(await move("accepted", "review-passed")).toMatchObject({ result: "refused", refusal: "illegal-move" });
    expect(await move("running", "tool-started")).toMatchObject({ result: "updated", moved: true });
    expect(await move("returned", "result-returned")).toMatchObject({ assignment: { roundCount: 0 } });
    expect(await move("needs-correction", "defects-found")).toMatchObject({ assignment: { roundCount: 1 } });
    expect(await move("running", "correction-sent")).toMatchObject({ result: "updated" });
    expect(await move("unknown", "handle-not-found")).toMatchObject({ result: "updated" });
    expect(await move("needs-correction", "defects-found")).toMatchObject({ assignment: { roundCount: 2 } });
    expect(await move("unknown", "handle-not-found")).toMatchObject({ result: "updated" });
    // The status before `unknown` was already needs-correction, so no round is added, also at the limit.
    expect(await move("needs-correction", "defects-found")).toMatchObject({ result: "updated", assignment: { roundCount: 2 } });
    expect(await move("running", "correction-sent")).toMatchObject({ result: "updated" });
    expect(await move("returned", "result-returned")).toMatchObject({ result: "updated" });
    expect(await move("needs-correction", "defects-found")).toMatchObject({ result: "refused", refusal: "round-limit-reached" });
    // A check only changes the last check time.
    const check = await call("factory.assignment.save", { targetRoot: root, assignmentId: id, expectedVersion: version, claimId }, temp, new Date(NOW.getTime() + 60_000));
    expect(check).toMatchObject({ result: "updated", moved: false, assignment: { status: "returned", checkedAt: "2042-06-15T12:01:00.000Z" } });
    version = check.assignment.version;
    expect(check.assignment.history.length).toBeLessThanOrEqual(20);
    expect(await move("cancelled", "stopped-by-person")).toMatchObject({ result: "updated" });
    expect(await move("running", "tool-started")).toMatchObject({ result: "refused", refusal: "final-status" });
    // A second open assignment for one job is refused; another part label runs alongside.
    const again = await call("factory.assignment.start", { targetRoot: root, workflow: "ship", unit, role: "builder", runId: "run-1", claimId });
    expect(again).toMatchObject({ result: "started", assignment: { roundCount: 2 } });
    expect(await call("factory.assignment.start", { targetRoot: root, workflow: "ship", unit, role: "builder", runId: "run-1", claimId })).toMatchObject({ result: "refused", refusal: "assignment-open" });
    expect(await call("factory.assignment.start", { targetRoot: root, workflow: "ship", unit, role: "builder", partLabel: "research", runId: "run-1", claimId })).toMatchObject({ result: "started", assignment: { partLabel: "research", roundCount: 0 } });
    // A once grant for reset-correction-rounds starts the next assignment of the job at 0, and is spent.
    expect(await call("factory.assignment.save", { targetRoot: root, assignmentId: again.assignment.assignmentId, expectedVersion: again.assignment.version, claimId, status: "cancelled", reason: "stopped-by-person" })).toMatchObject({ result: "updated" });
    await call("factory.workflow.save", { targetRoot: root, workflow: "ship", grants: { add: [{ action: "reset-correction-rounds", scope: "once", grantedBy: "the owner" }] } });
    const reset = await call("factory.assignment.start", { targetRoot: root, workflow: "ship", unit, role: "builder", runId: "run-1", claimId, resetRounds: true });
    expect(reset).toMatchObject({ result: "started", assignment: { roundCount: 0 } });
    const grants = (await call("factory.workflow.show", { targetRoot: root, workflow: "ship" })).grants;
    expect(grants.find((grant: Value) => grant.action === "reset-correction-rounds")).toMatchObject({ state: "spent" });
  });

  it("checks moves and rounds against the assignment's own plan revision after a newer revision exists (T21, A61)", async () => {
    const root = project("aurora", WORKFLOW_YAML({ roundLimit: 3 }));
    await readyWorkflow(root);
    const { unit, claimId } = claimedUnit(root);
    const started = await call("factory.assignment.start", { targetRoot: root, workflow: "ship", unit, role: "builder", runId: "run-1", claimId });
    // A newer plan revision with a round limit of 1.
    setConfig(root, WORKFLOW_YAML({ roundLimit: 1 }));
    const saved = await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: BINDING, expectedVersion: 2 });
    expect(saved.revision.number).toBe(2);
    expect((await call("factory.workflow.show", { targetRoot: root, workflow: "ship", revision: 1 })).revision).toMatchObject({ number: 1, isReady: true, isLatest: false });
    let version = started.assignment.version as number;
    for (const [status, reason] of [["running", "tool-started"], ["returned", "result-returned"], ["needs-correction", "defects-found"], ["running", "correction-sent"], ["returned", "result-returned"], ["needs-correction", "defects-found"]]) {
      const value = await call("factory.assignment.save", { targetRoot: root, assignmentId: started.assignment.assignmentId, expectedVersion: version, claimId, status, reason });
      expect(value, `${status} ${JSON.stringify(value.refusal)}`).toMatchObject({ result: "updated", assignment: { planRevision: 1, roundLimit: 3 } });
      version = value.assignment.version;
    }
  });

  it("records grant uses: refuses each grant code, spends a once grant once, and keeps a run grant to its own run (T17, A59)", async () => {
    const root = project();
    await readyWorkflow(root);
    const { unit, claimId } = claimedUnit(root);
    const started = await call("factory.assignment.start", { targetRoot: root, workflow: "ship", unit, role: "builder", runId: "run-1", claimId });
    let version = started.assignment.version as number;
    const use = async (action: string, now = NOW) => {
      const value = await call("factory.assignment.save", { targetRoot: root, assignmentId: started.assignment.assignmentId, expectedVersion: version, claimId, grantUse: action }, temp, now);
      if (value.result === "updated") version = value.assignment.version;
      return value;
    };
    expect(await use("merge")).toMatchObject({ result: "refused", refusal: "grant-missing" });
    await call("factory.workflow.save", { targetRoot: root, workflow: "ship", grants: { add: [
      { action: "merge", scope: "once", grantedBy: "the owner" },
      { action: "deploy", scope: "run", runId: "run-2", grantedBy: "the owner" },
      { action: "publish", scope: "standing", expiresAt: new Date(NOW.getTime() + 60_000).toISOString(), grantedBy: "the owner" },
    ] } });
    expect(await use("merge")).toMatchObject({ result: "updated", grant: { action: "merge", scope: "once", state: "spent" } });
    expect(await use("merge")).toMatchObject({ result: "refused", refusal: "grant-spent" });
    expect(await use("deploy")).toMatchObject({ result: "refused", refusal: "grant-out-of-scope" });
    expect(await use("publish")).toMatchObject({ result: "updated", grant: { scope: "standing" } });
    expect(await use("publish", new Date(NOW.getTime() + 120_000))).toMatchObject({ result: "refused", refusal: "grant-expired" });
  });
});

/* ------------------------------------------------------------------------ */
/* Factory URIs (T30 to T32, A78, A80)                                      */
/* ------------------------------------------------------------------------ */

async function readUri(uri: string, cwd: string): Promise<Value> {
  return call("resource.read", { uri }, cwd);
}

describe("W30 R0 P3 factory URIs", () => {
  it("gives the same answer from any folder, ends with the status note, shows run IDs, and shows no grant, claim ID, or prompt (A78, A80)", async () => {
    const root = project();
    await readyWorkflow(root);
    await call("factory.workflow.save", { targetRoot: root, workflow: "ship", grants: { add: [{ action: "merge", scope: "standing", grantedBy: "the owner" }] } });
    const { unit, claimId } = claimedUnit(root);
    await call("factory.assignment.start", { targetRoot: root, workflow: "ship", unit, role: "builder", runId: "run-9", claimId, taskHandle: "thread-77" });
    const plain = path.join(temp, "plain");
    mkdirSync(plain);
    const uris = [
      "make-docs://project/aurora/factory/",
      "make-docs://project/aurora/factory/workflows/ship",
      "make-docs://project/aurora/factory/workflows/ship/revisions/",
      "make-docs://project/aurora/factory/workflows/ship/revisions/1",
      "make-docs://project/aurora/factory/assignments/",
    ];
    for (const uri of uris) {
      const fromProject = await readUri(uri, root);
      const fromPlain = await readUri(uri, plain);
      expect(fromPlain.text, uri).toBe(fromProject.text);
      expect(fromProject.uri, uri).toBe(uri);
      expect(fromProject.text, uri).toContain("Run make-docs factory status in a checkout of aurora for the live readiness state.\nChanges nothing.\n");
      for (const hidden of [claimId, "merge", "fg-", "thread-77"]) expect(fromProject.text, `${uri} ${hidden}`).not.toContain(hidden);
      expect(JSON.stringify(fromProject.data), uri).not.toContain(claimId);
    }
    const assignments = await readUri("make-docs://project/aurora/factory/assignments/", plain);
    expect(assignments.text).toContain("lifecycle run run-9");
    expect(assignments.data.assignments[0]).toMatchObject({ unit: "task 1", role: "builder", partLabel: "main", toolId: "tool-a", status: "offered", roundCount: 0, planRevision: 1, runId: "run-9" });
    const index = await readUri("make-docs://project/aurora/factory/", plain);
    expect(index.data.workflows).toEqual([{ workflow: "ship", uri: "make-docs://project/aurora/factory/workflows/ship", latestRevision: 1, readyRevision: 1, savedReadiness: "ready" }]);
  });

  it("refuses an unknown project and an unlisted factory path with resource-not-found, and creates no Store (A78, T32)", async () => {
    const root = project();
    await readyWorkflow(root);
    for (const uri of [
      "make-docs://project/nobody/factory/",
      "make-docs://project/aurora/factory/workflows/",
      "make-docs://project/aurora/factory/workflows/ship/revisions/9",
      "make-docs://project/aurora/factory/tools",
      "make-docs://project/aurora/factory/workflows/ship@abc",
      "make-docs://project/aurora/factory/workflows/missing",
    ]) {
      const error = await readUri(uri, root).catch((caught: unknown) => caught);
      expect(error, uri).toBeInstanceOf(ResourceOperationError);
      expect((error as ResourceOperationError).code, uri).toBe("resource-not-found");
    }
    const absent = path.join(temp, "no-store");
    vi.stubEnv("MAKE_DOCS_HOME", absent);
    const error = (await invokeOperation("resource.read", { uri: "make-docs://project/aurora/factory/" }, createExecutionContext({ surface: "test", storeRoot: absent, cwd: root })).catch((caught: unknown) => caught)) as { code: string; nextAction: string };
    expect(error.code).toBe("store-unavailable");
    expect(error.nextAction).toContain("read the .make-docs/factory/ copies in a checkout of project aurora");
    expect(existsSync(absent)).toBe(false);
  });
});

/* ------------------------------------------------------------------------ */
/* No process, no network (A22)                                             */
/* ------------------------------------------------------------------------ */

describe("W30 R0 P3 checks and records only", () => {
  it("starts no process and opens no network connection in any factory operation (A22)", async () => {
    // The factory code imports no process or network module. An ES module export cannot be spied on, so the imports are checked.
    const sources = [
      ...readdirSync(path.join(REPO_ROOT, "packages/cli/src/operations/factory")).filter((name) => name.endsWith(".ts")).map((name) => path.join(REPO_ROOT, "packages/cli/src/operations/factory", name)),
      path.join(REPO_ROOT, "packages/cli/src/store/factory-store.ts"),
    ];
    for (const file of sources) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/from "node:(child_process|net|http|https|dgram|tls|worker_threads)"/);
      // A database call such as db.exec( is not a process; a bare call is.
      expect(source, file).not.toMatch(/(?<![\w.])(fetch|spawn|spawnSync|exec|execSync|execFile|execFileSync|fork)\(/);
    }
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const root = project();
    await readyWorkflow(root);
    const { unit, claimId } = claimedUnit(root);
    const started = await call("factory.assignment.start", { targetRoot: root, workflow: "ship", unit, role: "builder", runId: "run-1", claimId });
    await call("factory.assignment.save", { targetRoot: root, assignmentId: started.assignment.assignmentId, expectedVersion: 1, claimId, status: "running", reason: "tool-started" });
    for (const [id, input] of [
      ["factory.status", { targetRoot: root }],
      ["factory.workflow.show", { targetRoot: root, workflow: "ship" }],
      ["factory.workflow.list", { targetRoot: root }],
      ["factory.assignment.list", { targetRoot: root, all: true }],
      ["factory.restore", { targetRoot: root }],
    ] as Array<[string, Record<string, unknown>]>) await call(id, input);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------------ */
/* MCP grants and CLI parity (T31, A19, A79)                                */
/* ------------------------------------------------------------------------ */

const CLI_PATH = path.resolve(import.meta.dirname, "../dist/index.js");

function runCliIn(cwd: string, args: string[]) {
  return spawnSync(process.execPath, [CLI_PATH, ...args], { cwd, encoding: "utf8", env: { ...process.env, MAKE_DOCS_HOME: store } });
}

describe("W30 R0 P3 MCP grants and CLI parity", () => {
  /** A project set up with a generic MCP client grant, as an agent's working folder. */
  function grantedHome(): string {
    const home = path.join(temp, "home");
    mkdirSync(home);
    const plan = prepareGenericMcpSetup({ clientLabel: "p3-grants", storeRoot: store, executable: verifyMakeDocsExecutable({ executablePath: CLI_PATH }) });
    const connection = (plan.configuration as { mcpServers: { "make-docs": { env: Record<string, string> } } }).mcpServers["make-docs"].env;
    applyGenericMcpSetup(plan);
    const setup = runCliIn(home, ["setup", "--target", home, "--yes", "--no-codex", "--no-claude-code", "--no-skills", "--generic-mcp-client", "p3-grants", "--json"]);
    expect(setup.status, setup.stdout + setup.stderr).toBe(0);
    vi.stubEnv(MCP_CONNECTION_ID_ENV, connection.MAKE_DOCS_MCP_CONNECTION_ID!);
    vi.stubEnv(MCP_CONNECTION_KEY_ENV, connection.MAKE_DOCS_MCP_CONNECTION_KEY!);
    return platform.describePath(home).canonicalPath;
  }

  /** A project that setup made with the same generic MCP client grant, with the factory block added. */
  function grantedProject(name: string): { root: string; projectId: string } {
    const root = path.join(temp, name);
    mkdirSync(root);
    const setup = runCliIn(root, ["setup", "--target", root, "--yes", "--no-codex", "--no-claude-code", "--no-skills", "--generic-mcp-client", "p3-grants", "--json"]);
    expect(setup.status, setup.stdout + setup.stderr).toBe(0);
    const file = path.join(root, ".make-docs/config.yaml");
    const config: Record<string, unknown> = { ...(parseYaml(readFileSync(file, "utf8")) as Record<string, unknown>), projectName: name, ...(parseYaml(WORKFLOW_YAML()) as Record<string, unknown>) };
    writeFileSync(file, stringifyYaml(config));
    const canonical = platform.describePath(root).canonicalPath;
    // A Store write records the project name in the project register.
    writeWorkStore(canonical, () => null, { storeRoot: store, now: NOW });
    return { root: canonical, projectId: String(config.projectId) };
  }

  it("reads another project's factory URI with the working folder's grant, and refuses a folder that is not a project (A79)", async () => {
    const home = grantedHome();
    const aurora = project();
    await readyWorkflow(aurora);
    const tool = (await callMakeDocsMcpTool("resource_read", { uri: "make-docs://project/aurora/factory/", targetRoot: home })).result as { text: string };
    expect(tool.text).toContain("# Factory of aurora");
    const native = await readNativeMcpResource("make-docs://project/aurora/factory/workflows/ship", home);
    expect(native.contents[0]!.text).toContain("It is the ready revision.");
    const plain = path.join(temp, "plain");
    mkdirSync(plain);
    const error = (await callMakeDocsMcpTool("resource_read", { uri: "make-docs://project/aurora/factory/", targetRoot: plain }).catch((caught: unknown) => caught)) as StoreAccessStateError;
    expect(error.code).toBe("store-not-configured");
    expect(error.message).not.toContain("make-docs setup");
  });

  it("admits a factory MCP read and write by the acted-on project's own grant, and refuses them as store-denied without it (A79)", async () => {
    const home = grantedHome();
    const aurora = project();
    await readyWorkflow(aurora);
    // The working project's own grant admits a call that acts on it.
    const own = (await callMakeDocsMcpTool("factory_status", { targetRoot: home })).result as Value;
    expect(own.actedOn).toMatchObject({ kind: "project", chosenBy: "named" });
    // Another project without its own grant: refused, named, and told how to grant it.
    for (const [name, args] of [
      ["factory_status", { project: "aurora" }],
      ["factory_workflow_list", { project: "aurora" }],
      ["factory_restore", { project: "aurora", allowWrite: true }],
    ] as Array<[string, Record<string, unknown>]>) {
      const error = (await callMakeDocsMcpTool(name, args).catch((caught: unknown) => caught)) as StoreAccessStateError;
      expect(error, name).toBeInstanceOf(StoreAccessStateError);
      expect(error.code, name).toBe("store-denied");
      expect(error.reason, name).toContain(`This call acts on project aurora (${PROJECT_ID})`);
      expect(error.nextAction, name).toContain(`make-docs setup --target ${JSON.stringify(aurora)}`);
    }
    // A project with its own grant: the same calls work from the agent's other folder.
    const boreal = grantedProject("boreal");
    await readyWorkflow(boreal.root, { saveTools: false });
    const read = (await callMakeDocsMcpTool("factory_status", { project: "boreal" })).result as Value;
    expect(read.actedOn).toMatchObject({ kind: "project", projectName: "boreal", projectId: boreal.projectId, chosenBy: "named" });
    const write = (await callMakeDocsMcpTool("factory_restore", { project: "boreal", allowWrite: true })).result as Value;
    expect(write).toMatchObject({ result: "restored", actedOn: { projectName: "boreal" } });
    const save = (await callMakeDocsMcpTool("factory_workflow_save", { project: "boreal", workflow: "ship", allowWrite: true, grants: { add: [{ action: "merge", scope: "once", grantedBy: "the owner" }] } })).result as Value;
    expect(save).toMatchObject({ result: "saved", grantOnly: true });
  });

  it("gives the same result in CLI JSON and MCP for reads and for each save operation's refusal (A19, A76)", async () => {
    const home = grantedHome();
    const aurora = grantedProject("aurora").root;
    await readyWorkflow(aurora);
    // An MCP server runs in the agent's working folder; a machine call is admitted by that folder's grant.
    vi.spyOn(process, "cwd").mockReturnValue(home);
    const cli = (args: string[], cwd = aurora) => {
      const run = runCliIn(cwd, [...args, "--json"]);
      return JSON.parse(run.stdout) as Value;
    };
    const mcp = async (name: string, args: Record<string, unknown>) => (await callMakeDocsMcpTool(name, args)).result as Value;
    expect(cli(["factory", "workflow", "list", "--target-root", aurora])).toEqual(await mcp("factory_workflow_list", { targetRoot: aurora }));
    expect(cli(["factory", "workflow", "show", "ship", "--target-root", aurora])).toEqual(await mcp("factory_workflow_show", { targetRoot: aurora, workflow: "ship" }));
    expect(cli(["factory", "assignment", "list", "--project", "aurora"])).toEqual(await mcp("factory_assignment_list", { project: "aurora" }));
    const badTools = JSON.stringify(TOOLS().map((tool) => ({ ...tool, capabilities: ["teleport"] })));
    const refusals: Array<[string[], string, Record<string, unknown>]> = [
      [["factory", "tools", "save", "--tools-json", badTools], "factory_tools_save", { tools: JSON.parse(badTools) }],
      [["factory", "workflow", "save", "ship", "--binding-json", JSON.stringify(BINDING)], "factory_workflow_save", { workflow: "ship", binding: BINDING }],
      [["factory", "proof", "save", "ship", "--outcome", "passed", "--test-task", "Test", "--plan-digest", "a".repeat(64), "--path", "builder", "--project", "aurora"], "factory_proof_save", { project: "aurora", workflow: "ship", outcome: "passed", testTask: "Test", planDigest: "a".repeat(64), path: ["builder"] }],
      [["factory", "assignment", "start", "1", "--workflow", "ship", "--role", "builder", "--run-id", "run-1", "--project", "aurora"], "factory_assignment_start", { project: "aurora", workflow: "ship", unit: "1", role: "builder", runId: "run-1" }],
      [["factory", "assignment", "save", "fa-none", "--expected-version", "1", "--project", "aurora"], "factory_assignment_save", { project: "aurora", assignmentId: "fa-none", expectedVersion: 1 }],
      [["factory", "restore"], "factory_restore", {}],
    ];
    for (const [args, name, input] of refusals) {
      const fromCli = cli(args);
      expect(fromCli.result, name).toBe("refused");
      expect(fromCli, name).toEqual(await mcp(name, { ...input, allowWrite: true }));
    }
  });
});
