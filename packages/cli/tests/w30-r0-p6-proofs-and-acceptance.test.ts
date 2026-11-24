import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { knownLossesLine } from "../src/operations/factory/copies";
import { cleanupTempDir, createTempDir } from "./helpers";

/**
 * W30 R0 P6: the checks that an agent can run without the owner's real tools.
 * The record path of both proofs, the drift test, the version drift test, the
 * backup outside git, and the never-log scan run through the built CLI, as a
 * person's agent runs it. Tool names are generic, such as `tool-a`. Every run
 * uses a temporary MAKE_DOCS_HOME and a temporary HOME, so no test reaches the
 * real Store. These runs record what a foreman would record. They start no
 * agent and send no message, so they are not the two capability proofs of T1
 * and T2. Those need the tools that the owner picks.
 */

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const CLI_PATH = path.resolve(import.meta.dirname, "../dist/index.js");
const TEMPLATE_CONTRACT = path.join(REPO_ROOT, "packages/docs/template/.make-docs/system/contracts/factory-contract.md");

type Value = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

let temp: string;
let store: string;
let home: string;
let elsewhere: string;

beforeEach(() => {
  temp = createTempDir("make-docs-w30-p6-");
  store = path.join(temp, "store");
  home = path.join(temp, "home");
  elsewhere = path.join(temp, "elsewhere");
  mkdirSync(home, { recursive: true });
  mkdirSync(elsewhere, { recursive: true });
});

afterEach(() => {
  cleanupTempDir(temp);
});

/* ------------------------------------------------------------------------ */
/* The built CLI, run from a folder that is not the project                 */
/* ------------------------------------------------------------------------ */

const ENV_SENTINEL = "P6_SENTINEL_ENV_VALUE_7731";
const FILE_SENTINEL = "P6-FILE-CONTENT-SENTINEL-4412";
const CREDENTIAL_SENTINEL = "P6SENTINELCREDENTIAL0123456789abcdef";

function cli(args: string[], cwd = elsewhere): { status: number | null; out: string; value: Value } {
  const result = spawnSync(process.execPath, [CLI_PATH, ...args, "--json"], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, MAKE_DOCS_HOME: store, HOME: home, USERPROFILE: home, P6_SENTINEL: ENV_SENTINEL },
  });
  const out = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  let value: Value = {};
  try {
    value = JSON.parse(result.stdout) as Value;
  } catch {
    try {
      value = JSON.parse(result.stderr) as Value;
    } catch {
      value = {};
    }
  }
  return { status: result.status, out, value };
}

const role = (name: string, job: string, capabilities: string[], returns: string, extra = "") =>
  `        ${name}:\n          job: ${job}\n          capabilities: [${capabilities.join(", ")}]\n          returns: ${returns}\n${extra}`;
const FIVE = ["read-write-files", "run-commands", "launch-agent", "wait-for-agent", "read-agent-result"];
const FOREMAN = role("foreman", "Claim the unit, brief, judge, and accept.", FIVE, "Accepted units and escalations.");
const BUILDER = role("builder", "Build the unit.", ["read-write-files", "run-commands"], "The result and its evidence.");
const REVIEWER = role("reviewer", "Review the result.", ["read-write-files"], "A pass or a defect list.");
const FRONT_DESK = role("front-desk", "Take the scope and carry messages.", ["read-write-files"], "The scope and the answers.");
const RESEARCHER = role("researcher", "Find the sources for one part.", ["read-write-files"], "The sources and notes.", "          context: [unit-record, requirements]\n");
const factoryYaml = (type: string, roles: string, extra = "", channel = "wait-in-session") =>
  `factory:\n  workflows:\n    ship:\n      type: ${type}\n      typeVersion: 1\n      roundLimit: 3\n      roles:\n${roles}${extra}      humanChannel: ${channel}\n`;

const PROVED_AT = new Date().toISOString();
const proof = (capabilityId: string, version: string) => ({ capabilityId, method: "Ran the proof with a known result.", toolVersion: version, provedAt: PROVED_AT, result: "proved", notCovered: [] });
const tool = (toolId: string, label: string, kind: string, version: string, capabilities: string[], expectedVersion: number | null) => ({
  toolId, kind, label, state: "available", reportedVersion: version, capabilities, proofs: capabilities.map((id) => proof(id, version)), expectedVersion,
});
const saveTools = (tools: unknown[]) => cli(["factory", "tools", "save", "--tools-json", JSON.stringify({ tools })]);
const savedTool = (toolId: string): Value => (cli(["factory", "tools", "list"]).value.tools as Value[]).find((row) => row.toolId === toolId)!;
/** Save one tool again as an agent reports it, with the record version that `factory tools list` gave. */
function reportTool(toolId: string, changes: Value) {
  const row = savedTool(toolId);
  const version = (row.version ?? row.recordVersion) as number;
  const proofs = (row.proofs as Value[]).map(({ capabilityId, method, toolVersion, provedAt, result, notCovered }) => ({ capabilityId, method, toolVersion, provedAt, result, notCovered }));
  return saveTools([{ toolId, kind: row.kind, label: row.label, state: row.state, reportedVersion: row.reportedVersion, capabilities: row.capabilities, proofs, expectedVersion: version, ...changes }]);
}

/** `make-docs setup` with every harness skipped and no Skills, then the factory block. */
function project(name: string, yaml: string, options: { git?: boolean } = {}): string {
  const root = path.join(temp, name);
  mkdirSync(root, { recursive: true });
  if (options.git) expect(spawnSync("git", ["init", "-q"], { cwd: root }).status).toBe(0);
  const setup = cli(["setup", "--yes", "--no-codex", "--no-claude-code", "--no-github-copilot", "--no-skills"], root);
  expect(setup.value.status, setup.out).toBe("complete");
  const file = path.join(root, ".make-docs/config.yaml");
  const projectId = /projectId: (\S+)/.exec(readFileSync(file, "utf8"))![1];
  writeFileSync(file, `harnessIntegrations: []\nresourceProjection: []\nprojectId: ${projectId}\nprojectName: ${name}\n${yaml}`);
  return root;
}

function readyWorkflow(root: string, binding: Value, paths: string[]): Value {
  const saved = cli(["factory", "workflow", "save", "ship", "--binding-json", JSON.stringify(binding), "--target-root", root]);
  expect(saved.value.result, saved.out).toBe("saved");
  expect(cli(["factory", "workflow", "show", "ship", "--target-root", root]).value.live.readiness).toBe("wired");
  const passed = cli(["factory", "proof", "save", "ship", "--outcome", "passed", "--test-task", "Write one line and review it.", "--plan-digest", saved.value.revision.planDigest, ...paths.flatMap((step) => ["--path", step]), "--target-root", root]);
  expect(passed.value.readiness, passed.out).toBe("ready");
  return saved.value;
}

interface Claim { unit: string; claimId: string; runId: string; revision: number; root: string }

function claimUnit(root: string, title: string): Claim {
  const added = cli(["work", "add", title, "--target-root", root]);
  const unit = String(added.value.number);
  expect(unit, added.out).toMatch(/^\d+$/);
  const next = cli(["work", "next", "--level", "quick-item", "--claimant", "foreman-1", "--target-root", root]);
  const ready = (next.value.ready as Value[]).find((entry) => String(entry.coordinate) === unit)!;
  expect(ready, next.out).toBeDefined();
  const claimed = cli(["work", "claim", unit, "--claimant", "foreman-1", "--expected-version", String(ready.revision), "--task-handle", "foreman-session", "--target-root", root]);
  expect(claimed.value.result, claimed.out).toBe("claimed");
  const runId = `run-p6-${path.basename(root)}-${unit}`;
  expect(cli(["lifecycle", "start", "--stage", "implementation", "--run-id", runId, "--checkpoint", `Quick item ${unit}: claimed.`, "--repo-root", root]).status).toBe(0);
  return { unit, claimId: claimed.value.claimId as string, runId, revision: claimed.value.revision as number, root };
}

const startArgs = (claim: Claim, roleName: string, part = "main") => ["factory", "assignment", "start", claim.unit, "--workflow", "ship", "--role", roleName, "--part", part, "--run-id", claim.runId, "--claim-id", claim.claimId, "--target-root", claim.root];

function job(claim: Claim, roleName: string, part = "main") {
  const started = cli(startArgs(claim, roleName, part));
  expect(started.value.result, started.out).toBe("started");
  let version = started.value.assignment.version as number;
  const id = started.value.assignment.assignmentId as string;
  const move = (status: string, reason: string, extra: string[] = []) => {
    const moved = cli(["factory", "assignment", "save", id, "--expected-version", String(version), "--claim-id", claim.claimId, "--status", status, "--reason", reason, ...extra, "--target-root", claim.root]);
    if (moved.value.result === "updated") version = moved.value.assignment.version as number;
    return moved;
  };
  const moves = (steps: Array<[string, string]>) => {
    for (const [status, reason] of steps) expect(move(status, reason).value.result, `${roleName} ${part}: ${status}`).toBe("updated");
  };
  return { id, toolId: started.value.assignment.toolId as string, move, moves };
}

const TO_REVIEW: Array<[string, string]> = [["running", "tool-started"], ["returned", "result-returned"], ["in-review", "sent-to-review"]];

function closeUnit(claim: Claim): void {
  const closed = cli(["work", "close", claim.unit, "--expected-version", String(claim.revision), "--claim-id", claim.claimId, "--target-root", claim.root]);
  expect(closed.value.accepted, closed.out).toBe(true);
}

const filesIn = (dir: string): string[] =>
  existsSync(dir) ? (readdirSync(dir, { recursive: true }) as string[]).map(String).filter((entry) => statSync(path.join(dir, entry)).isFile()).sort() : [];

const liveOf = (root: string): Value => cli(["factory", "workflow", "show", "ship", "--target-root", root]).value.live as Value;

/* ------------------------------------------------------------------------ */
/* The record path of the proofs, through the built CLI                     */
/* ------------------------------------------------------------------------ */

describe("W30 R0 P6 record path through the built CLI", () => {
  it("runs two units with one correction, the backup outside git, both drift tests, a two-tool unit with one grant, and the never-log scan (A43 to A47, A71, A72: record path only)", () => {
    // With no Store, the machine read gives the typed Store outcome and creates no Store.
    const early = cli(["factory", "tools", "list"]);
    expect(early.value.code, early.out).toBe("store-unavailable");
    expect(existsSync(store)).toBe(false);

    /* The smallest setup: one tool with the five capabilities, "wait in session", a folder without git. */
    const aurora = project("aurora", factoryYaml("staged-backlog", FRONT_DESK + FOREMAN + BUILDER + REVIEWER));
    expect(existsSync(path.join(aurora, ".git"))).toBe(false);
    expect(saveTools([tool("tool-a", "Tool A", "agent-harness", "1.0", FIVE, null)]).value.result).toBe("saved");
    readyWorkflow(aurora, { roles: { "front-desk": "tool-a", foreman: "tool-a", builder: "tool-a", reviewer: "tool-a" }, worktreeMethod: "none", channelRef: null, wakeMethod: "person", wakeRef: null, knownLosses: ["No tool can wake on its own."] }, ["builder: tool-a", "reviewer: tool-a"]);
    // The copy prints an accepted known loss with one full stop, not two.
    const copy = readFileSync(path.join(aurora, ".make-docs/factory/workflow-ship.md"), "utf8");
    expect(copy).toContain("- Accepted known losses: No tool can wake on its own.\n");

    // Unit 1: a backup before the change (A47), one correction round, then the accept.
    const target = path.join(aurora, "notes.md");
    writeFileSync(target, `Before the change. ${FILE_SENTINEL}\n`);
    const unit1 = claimUnit(aurora, "Write the notes");
    const builder1 = job(unit1, "builder");
    const backupDir = path.join(aurora, ".make-docs/backup/factory");
    const backup = cli(["factory", "file-backup", "save", builder1.id, "--file", "notes.md", "--claim-id", unit1.claimId, "--target-root", aurora]);
    expect(backup.value.result, backup.out).toBe("saved");
    expect(backup.out).not.toContain(FILE_SENTINEL);
    expect(backup.out).not.toContain(unit1.claimId);
    expect(filesIn(backupDir)).toEqual([".gitignore", "README.md", `${builder1.id}/notes.md`]);
    expect(readFileSync(path.join(backupDir, ".gitignore"), "utf8")).toBe("*\n");
    const readme = readFileSync(path.join(backupDir, "README.md"), "utf8");
    expect(readme).toMatch(/30 days/);
    expect(readme).toMatch(/accepted or closed/);
    expect(existsSync(path.join(aurora, ".gitignore"))).toBe(false);
    writeFileSync(target, "After the change.\n");
    builder1.moves(TO_REVIEW);
    const review1 = job(unit1, "reviewer");
    review1.moves([...TO_REVIEW, ["accepted", "defects-found"]]);
    expect(builder1.move("needs-correction", "defects-found").value.assignment.roundCount).toBe(1);
    builder1.moves([["running", "correction-sent"], ["returned", "result-returned"], ["in-review", "sent-to-review"]]);
    job(unit1, "reviewer").moves([...TO_REVIEW, ["accepted", "review-passed"]]);
    expect(filesIn(backupDir)).toContain(`${builder1.id}/notes.md`);
    expect(builder1.move("accepted", "review-passed").value.assignment.status).toBe("accepted");
    // The accept removes the backup file and its record together.
    expect(filesIn(backupDir)).toEqual([".gitignore", "README.md"]);
    closeUnit(unit1);

    // Unit 2: a clean pass.
    const unit2 = claimUnit(aurora, "Write the summary");
    const builder2 = job(unit2, "builder");
    builder2.moves(TO_REVIEW);
    job(unit2, "reviewer").moves([...TO_REVIEW, ["accepted", "review-passed"]]);
    expect(builder2.move("accepted", "review-passed").value.assignment.roundCount).toBe(0);
    closeUnit(unit2);
    const all = cli(["factory", "assignment", "list", "--all", "--target-root", aurora]).value.assignments as Value[];
    expect(all.map((entry) => `${entry.role}:${entry.status}:${entry.roundCount}`).sort()).toEqual(["builder:accepted:0", "builder:accepted:1", "reviewer:accepted:0", "reviewer:accepted:0", "reviewer:accepted:0"]);

    /* A folder with git: no backup is needed, and nothing is written. */
    const borealis = project("borealis", factoryYaml("build-then-review", FOREMAN + BUILDER + REVIEWER), { git: true });
    const binding = { roles: { foreman: "tool-a", builder: "tool-a", reviewer: "tool-a" }, worktreeMethod: "none", channelRef: null, wakeMethod: "person", wakeRef: null, knownLosses: [] };
    readyWorkflow(borealis, binding, ["builder: tool-a"]);
    writeFileSync(path.join(borealis, "notes.md"), "One line.\n");
    const unit3 = claimUnit(borealis, "Write the notes");
    const builder3 = job(unit3, "builder");
    expect(cli(["factory", "file-backup", "save", builder3.id, "--file", "notes.md", "--claim-id", unit3.claimId, "--target-root", borealis]).value.result).toBe("not-needed");
    expect(filesIn(path.join(borealis, ".make-docs/backup/factory")).filter((entry) => entry.endsWith("notes.md"))).toEqual([]);

    /* Drift test (A46): a wired tool is gone. */
    expect(reportTool("tool-a", { state: "missing" }).value.result).toBe("saved");
    const drifted = liveOf(borealis);
    expect(drifted.readiness).toBe("drifted");
    expect((drifted.drift as Value[]).map((entry) => entry.code ?? entry)).toContain("tool-missing");
    const status = cli(["factory", "status", "--target-root", borealis]).value.summary as string;
    expect(status).toMatch(/Workflow ship: drifted: something changed without a save, so it takes no new work/);
    // One fix step, the smallest one, and never two joined by "or" (A46, owner decision 2026-11-24).
    const missingLine = status.split("\n").find((line) => line.includes("tool-missing:"))!;
    expect(missingLine.trim()).toBe("- tool-missing: Tool tool-a for the builder, foreman and reviewer roles is missing on this machine. Next: Bring tool-a back and report it with make-docs factory tools save.");
    expect(missingLine).not.toMatch(/, or | or bind/);
    const statusJson = cli(["factory", "status", "--target-root", borealis]).value;
    expect(JSON.stringify(statusJson)).not.toContain("otherStep");
    expect(JSON.stringify(cli(["factory", "workflow", "list", "--target-root", borealis]).value)).not.toContain("Bind another tool");
    // Only `factory workflow show` also gives the second way, after the first.
    const shownDrift = cli(["factory", "workflow", "show", "ship", "--target-root", borealis]).value;
    expect(shownDrift.live.drift[0]).toMatchObject({ nextStep: "Bring tool-a back and report it with make-docs factory tools save.", otherStep: "Bind another tool to the builder, foreman and reviewer roles with make-docs factory workflow save." });
    expect(shownDrift.summary).toContain("Next: Bring tool-a back and report it with make-docs factory tools save. If that cannot work: Bind another tool to the builder, foreman and reviewer roles with make-docs factory workflow save.");
    const refused = cli(startArgs(unit3, "reviewer"));
    expect(refused.value).toMatchObject({ result: "refused", refusal: "not-ready" });
    expect(refused.status).toBe(1);
    expect(refused.value.summary).toContain("Next: Bring tool-a back and report it with make-docs factory tools save.\n");
    expect(refused.out).not.toContain("Bind another tool");
    expect(cli(["factory", "assignment", "list", "--all", "--target-root", borealis]).value.assignments).toHaveLength(1);
    // The tool comes back: the plan of the ready revision is back, with no new test task.
    expect(reportTool("tool-a", { state: "available" }).value.result).toBe("saved");
    expect(liveOf(borealis).readiness).toBe("ready");

    /* Version drift test (A71): the tool reports a new version. */
    expect(reportTool("tool-a", { reportedVersion: "1.1" }).value.result).toBe("saved");
    const versionDrift = liveOf(borealis);
    expect(versionDrift.readiness).toBe("drifted");
    expect((versionDrift.drift as Value[]).map((entry) => entry.code ?? entry)).toEqual(["tool-version-changed"]);
    const versionStatus = cli(["factory", "status", "--target-root", borealis]).value.summary as string;
    expect(versionStatus).toMatch(/tool-version-changed: .*reports version 1\.1, but its proof is for version 1\.0\. Next: Prove tool-a again and save it with make-docs factory tools save, save the workflow, and pass a new test task\./);
    expect(cli(startArgs(unit3, "reviewer")).value).toMatchObject({ result: "refused", refusal: "not-ready" });
    // The re-proof: each proof again, a workflow save (a new revision), and a new passed test task.
    const row = savedTool("tool-a");
    expect(saveTools([{ toolId: "tool-a", kind: row.kind, label: row.label, state: "available", reportedVersion: "1.1", capabilities: row.capabilities, proofs: FIVE.map((id) => proof(id, "1.1")), expectedVersion: row.version ?? row.recordVersion }]).value.result).toBe("saved");
    expect(liveOf(borealis).readiness).toBe("drifted");
    const shown = cli(["factory", "workflow", "show", "ship", "--target-root", borealis]).value;
    const resaved = cli(["factory", "workflow", "save", "ship", "--binding-json", JSON.stringify(binding), "--expected-version", String(shown.binding.version), "--target-root", borealis]);
    expect(resaved.value.revision, resaved.out).toMatchObject({ number: 2, created: true });
    expect(liveOf(borealis).readiness).toBe("wired");
    expect(cli(startArgs(unit3, "reviewer")).value).toMatchObject({ result: "refused", refusal: "not-ready" });
    const passedVersion = cli(["factory", "workflow", "show", "ship", "--target-root", borealis]).value.proofs.passed.version as number;
    expect(cli(["factory", "proof", "save", "ship", "--outcome", "passed", "--test-task", "Write one line and review it.", "--plan-digest", resaved.value.revision.planDigest, "--path", "builder: tool-a", "--expected-version", String(passedVersion), "--target-root", borealis]).value.readiness).toBe("ready");
    expect(cli(["factory", "assignment", "list", "--all", "--target-root", borealis]).value.assignments).toHaveLength(1);

    /* Two tools, a channel outside the session, lead and specialists, and one grant. */
    expect(saveTools([tool("tool-b", "Tool B", "agent-harness", "2.0", ["read-write-files"], null), tool("channel-a", "Channel A", "messaging-tool", "3.0", ["message-person", "receive-answer"], null)]).value.result).toBe("saved");
    const cascade = project("cascade", factoryYaml("lead-and-specialists", FOREMAN + BUILDER + RESEARCHER + REVIEWER, "      integrationOwner: foreman\n", "messaging-tool"));
    readyWorkflow(cascade, { roles: { foreman: "tool-a", builder: "tool-a", researcher: "tool-b", reviewer: "tool-b" }, worktreeMethod: "none", channelRef: "channel-a", wakeMethod: "person", wakeRef: null, knownLosses: ["No tool can wake on its own."] }, ["researcher: tool-b", "builder: tool-a", "reviewer: tool-b"]);
    const unit4 = claimUnit(cascade, "Write the market report");
    const research = job(unit4, "researcher", "research");
    const draft = job(unit4, "builder", "draft");
    expect([research.toolId, draft.toolId]).toEqual(["tool-b", "tool-a"]);
    research.moves(TO_REVIEW);
    draft.moves(TO_REVIEW);
    const review4 = job(unit4, "reviewer", "draft");
    expect(review4.toolId).toBe("tool-b");
    review4.moves([...TO_REVIEW, ["accepted", "review-passed"]]);
    research.moves([["accepted", "review-passed"]]);
    // Floor event 1: the merge needs a grant. Without one, the accept is refused, and the assignment stays in review.
    const noGrant = draft.move("accepted", "review-passed", ["--grant-use", "merge"]);
    expect(noGrant.value).toMatchObject({ result: "refused", refusal: "grant-missing" });
    // The foreman records the person's answer with a grant-only save. Then the same accept works.
    const grant = cli(["factory", "workflow", "save", "ship", "--grants-json", JSON.stringify({ add: [{ action: "merge", scope: "once", grantedBy: "owner" }] }), "--target-root", cascade]);
    expect(grant.value, grant.out).toMatchObject({ result: "saved", grantOnly: true });
    expect(draft.move("accepted", "review-passed", ["--grant-use", "merge"]).value.assignment.status).toBe("accepted");
    expect(cli(["factory", "workflow", "show", "ship", "--target-root", cascade]).value.grantUseTotal).toBe(1);
    closeUnit(unit4);

    /* Two checks that the Rule Catalog names as built: one human channel kind, and no silent replace of a shipped type. */
    const cascadeConfig = path.join(cascade, ".make-docs/config.yaml");
    const withChannel = readFileSync(cascadeConfig, "utf8");
    writeFileSync(cascadeConfig, withChannel.replace("      humanChannel: messaging-tool\n", ""));
    const noChannel = cli(["factory", "workflow", "show", "ship", "--target-root", cascade]);
    expect(noChannel.out).toContain("factory.workflows.ship.humanChannel");
    expect(noChannel.status).not.toBe(0);
    writeFileSync(cascadeConfig, withChannel);
    const clashFile = path.join(cascade, "docs/assets/project/factory/workflows/lead-and-specialists.md");
    mkdirSync(path.dirname(clashFile), { recursive: true });
    writeFileSync(clashFile, "# A project type with a shipped name\n");
    expect((liveOf(cascade).drift as Value[]).map((entry) => entry.code)).toEqual(["type-name-clash"]);
    const clashSave = cli(["factory", "workflow", "save", "ship", "--binding-json", JSON.stringify({ roles: { foreman: "tool-a", builder: "tool-a", researcher: "tool-b", reviewer: "tool-b" }, worktreeMethod: "none", channelRef: "channel-a", wakeMethod: "person", wakeRef: null, knownLosses: [] }), "--expected-version", String(cli(["factory", "workflow", "show", "ship", "--target-root", cascade]).value.binding.version), "--target-root", cascade]);
    expect(clashSave.value).toMatchObject({ result: "refused", refusal: "invalid-record" });
    spawnSync("rm", [clashFile]);
    expect(liveOf(cascade).readiness).toBe("ready");

    /* Never-log scan (A72). First, the CLI refuses a credential and an environment setting, and shows neither. */
    const unit5 = claimUnit(cascade, "Check the never-log rule");
    const builder5 = job(unit5, "builder");
    const credential = builder5.move("running", "tool-started", ["--task-handle", `token=sk-${CREDENTIAL_SENTINEL}`]);
    expect(credential.value).toMatchObject({ result: "refused", refusal: "never-log-field" });
    expect(credential.out).not.toContain(CREDENTIAL_SENTINEL);
    const setting = builder5.move("running", "tool-started", ["--task-handle", `P6_SENTINEL=${ENV_SENTINEL}`]);
    expect(setting.value).toMatchObject({ result: "refused", refusal: "never-log-field" });
    expect(setting.out).not.toContain(ENV_SENTINEL);
    builder5.moves([["cancelled", "stopped-by-foreman"]]);
    for (const root of [aurora, borealis, cascade]) expect(cli(["factory", "restore", "--target-root", root]).status).toBe(0);

    const claimIds = [unit1, unit2, unit3, unit4, unit5].map((claim) => claim.claimId);
    const planted = [FILE_SENTINEL, "Before the change", "After the change", ENV_SENTINEL, CREDENTIAL_SENTINEL];
    const hits: string[] = [];
    const db = new DatabaseSync(path.join(store, "store.db"), { readOnly: true });
    try {
      const tables = (db.prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND (name LIKE 'factory_%' OR name LIKE 'lifecycle_%') ORDER BY name").all() as Array<{ name: string }>).map((entry) => entry.name);
      const factoryTables = tables.filter((name) => name.startsWith("factory_"));
      expect(factoryTables).toEqual(["factory_assignments", "factory_backups", "factory_capability_proofs", "factory_grant_uses", "factory_grants", "factory_machine_tools", "factory_proof_results", "factory_workflow_bindings", "factory_workflow_plans"]);
      for (const table of tables) {
        const rows = db.prepare(`SELECT * FROM ${table}`).all() as Value[];
        const text = JSON.stringify(rows);
        // The claim ID is the work queue's own private key. No factory or lifecycle record holds it.
        for (const needle of [...planted, ...claimIds]) if (text.includes(needle)) hits.push(`${table}: ${claimIds.includes(needle) ? "a claim ID" : needle}`);
        if (!table.startsWith("factory_")) continue;
        const columns = (db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>).map((column) => column.name);
        // No column for a never-log item. A digest column holds a hash, never contents.
        for (const column of columns) if (/prompt|brief|transcript|password|secret|token|api_?key|content|environment|env_/i.test(column) && !column.endsWith("_digest")) hits.push(`${table}.${column}: a column for a never-log item`);
        // A record holds one-line values only.
        for (const entry of rows) for (const [key, value] of Object.entries(entry)) if (typeof value === "string" && value.includes("\n")) hits.push(`${table}.${key}: a value with a line break`);
      }
      expect(db.prepare("SELECT count(*) AS n FROM factory_workflow_plans").get()).toEqual({ n: 4 });
      // The counts that the evidence report states.
      expect(db.prepare("SELECT count(*) AS n FROM factory_machine_tools").get()).toEqual({ n: 3 });
      expect(db.prepare("SELECT count(*) AS n FROM factory_capability_proofs").get()).toEqual({ n: 8 });
      expect(db.prepare("SELECT count(*) AS n FROM factory_proof_results").get()).toEqual({ n: 3 });
      expect(db.prepare("SELECT count(*) AS n FROM factory_workflow_bindings").get()).toEqual({ n: 3 });
      expect(db.prepare("SELECT count(*) AS n FROM factory_grants").get()).toEqual({ n: 1 });
      expect(db.prepare("SELECT count(*) AS n FROM factory_grant_uses").get()).toEqual({ n: 1 });
      expect(db.prepare("SELECT count(*) AS n FROM factory_backups").get()).toEqual({ n: 0 });
      // Each status history entry holds a status, a time, and a reason code, and no free text.
      const assignments = db.prepare("SELECT * FROM factory_assignments").all() as Value[];
      expect(assignments).toHaveLength(10);
      const historyColumn = Object.keys(assignments[0]).find((key) => /history/i.test(key))!;
      for (const assignment of assignments) for (const entry of JSON.parse(assignment[historyColumn] as string) as Value[]) expect(Object.keys(entry).sort()).toEqual(["at", "reason", "status"]);
    } finally {
      db.close();
    }
    // The planted values are nowhere in the bytes of the Store file.
    const bytes = readFileSync(path.join(store, "store.db")).toString("latin1");
    for (const needle of planted) if (bytes.includes(needle)) hits.push(`store.db bytes: ${needle}`);
    // The copies hold no planted value, no claim ID, and no grant.
    for (const root of [aurora, borealis, cascade]) {
      const copies = filesIn(path.join(root, ".make-docs/factory"));
      expect(copies).toEqual([".gitignore", "tools.md", "workflow-ship.md"]);
      for (const file of copies) {
        const text = readFileSync(path.join(root, ".make-docs/factory", file), "utf8");
        for (const needle of [...planted, ...claimIds]) if (text.includes(needle)) hits.push(`${path.basename(root)} copy ${file}: ${claimIds.includes(needle) ? "a claim ID" : needle}`);
        if (/\bfg-[0-9a-f]{8,}|Granted by/.test(text)) hits.push(`${path.basename(root)} copy ${file}: a grant`);
      }
    }
    expect(hits).toEqual([]);
  }, 300_000);
});

/* ------------------------------------------------------------------------ */
/* The rule catalog and the shipped text                                    */
/* ------------------------------------------------------------------------ */

describe("W30 R0 P6 rule catalog and shipped text", () => {
  it("marks each built check with \"Built in\", and leaves no planned row and no interim note (T14)", () => {
    const contract = readFileSync(TEMPLATE_CONTRACT, "utf8");
    const catalog = contract.slice(contract.indexOf("\n## Rule Catalog\n"));
    const rows = catalog.split("\n").filter((line) => line.startsWith("| `"));
    expect(rows.length).toBeGreaterThanOrEqual(90);
    const checks = rows.map((line) => line.split(" | ")[3] ?? "");
    expect(checks.filter((check) => check.startsWith("Planned in"))).toEqual([]);
    for (const check of checks) expect(check).toMatch(/^(Built in W\d+ R\d+ P\d+ T\d+[ :,]|Contract-only\. \S)/);
    expect(rows).toHaveLength(90);
    expect(checks.filter((check) => check.startsWith("Built in"))).toHaveLength(60);
    expect(checks.filter((check) => check.startsWith("Contract-only. "))).toHaveLength(30);
    // Three rows said "Contract-only" for a check that the CLI makes (review of 2026-11-24).
    const checkOf = (id: string) => rows.find((line) => line.startsWith(`| \`${id}\` |`))!.split(" | ")[3];
    expect(checkOf("only-ready-takes-work")).toMatch(/^Built in W30 R0 P3 T21: `factory\.assignment\.start` refuses a workflow that is not `ready` with `not-ready`\./);
    expect(checkOf("no-silent-replace")).toMatch(/^Built in W30 R0 P3 T3 and T21: /);
    expect(checkOf("one-human-channel")).toMatch(/^Built in W30 R0 P2 T20: /);
    expect(catalog).toContain("No row is planned now.");
    expect(catalog).not.toContain("W30 R0 P6 updates the Check column");
    // No row says that a later task "builds" a check that is in the CLI now, and no row names the retired command word.
    expect(catalog).not.toMatch(/W\d+ R\d+ P\d+ T\d+ builds /);
    expect(catalog).not.toContain("`.update`");
    expect(readFileSync(path.join(REPO_ROOT, ".make-docs/system/contracts/factory-contract.md"), "utf8")).toBe(contract);
  });

  it("ends the known-loss line of the copy with one full stop, and keeps an ellipsis", () => {
    expect(knownLossesLine([])).toBe("none.");
    expect(knownLossesLine(["No tool can wake on its own."])).toBe("No tool can wake on its own.");
    expect(knownLossesLine(["No wake", "No phone channel."])).toBe("No wake; No phone channel.");
    expect(knownLossesLine(["First loss.", "Second loss"])).toBe("First loss; Second loss.");
    expect(knownLossesLine(["Slow tools, weak channel..."])).toBe("Slow tools, weak channel...");
    expect(knownLossesLine(["To be named...", "No wake."])).toBe("To be named...; No wake.");
  });

  it("names no particular tool in the factory source text that a person or an agent reads (T8)", () => {
    // The same two lists as the W30 R0 P1 resource test. The Skill tests of P4 and P5 hold wider lists for the Skills.
    const productNames = /\b(whatsapp|imessage|gmail|tmux|zellij|crontab|launchd|systemd|claude|anthropic|openai|chatgpt|gpt-?\d|github|gitlab|jira|trello|asana|kubernetes|ollama|vercel|jetbrains|vs ?code|vscode|iterm2?|windsurf|pushover|ntfy)\b/i;
    const brandForms = /\b(Slack|Discord|Telegram|Notion|Codex|Gemini|Copilot|Mistral|Llama|Microsoft Teams|Google Chat|Signal app|Linear app|Zoom app|Amazon Bedrock|Vertex AI|Cursor IDE|Zed editor|Warp terminal|GNU Screen)\b/;
    const sourceRoot = path.join(REPO_ROOT, "packages/cli/src");
    const files = [
      ...filesIn(path.join(sourceRoot, "operations/factory")).map((entry) => path.join("operations/factory", entry)),
      ...readdirSync(path.join(sourceRoot, "store")).filter((entry) => entry.startsWith("factory-")).map((entry) => path.join("store", entry)),
    ];
    expect(files.length).toBeGreaterThan(5);
    for (const file of files) {
      const text = readFileSync(path.join(sourceRoot, file), "utf8");
      expect(text.match(productNames)?.[0], file).toBeUndefined();
      expect(text.match(brandForms)?.[0], file).toBeUndefined();
    }
  });
});
