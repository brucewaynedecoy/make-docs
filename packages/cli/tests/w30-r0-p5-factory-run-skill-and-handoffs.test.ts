import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parse as parseYaml } from "yaml";

import { loadMakeDocsConfig } from "../src/config";
import { createExecutionContext } from "../src/operations/context";
import { FACTORY_FLOOR_REFUSAL, FactoryWorkflowDefinitionSchema } from "../src/operations/factory/config-block";
import { readyFactoryWorkflowsForCheckout } from "../src/operations/factory/handoff";
import { FACTORY_OPERATION_IDS, FACTORY_OPERATION_SCOPES } from "../src/operations/factory/project-scope";
import {
  FACTORY_CAPABILITY_IDS,
  FACTORY_CLAIM_SIZES,
  FACTORY_GRANT_SCOPES,
  FACTORY_RESET_ROUNDS_ACTION,
  FACTORY_CONTEXT_KINDS,
  FACTORY_DEFAULT_CONTEXT,
  FACTORY_DRIFT_CODES,
  FACTORY_REFUSAL_CODES,
  FACTORY_STATUS_HISTORY_CODES,
  FACTORY_STATUS_MOVES,
} from "../src/operations/factory/records";
import { leafHelpEntry } from "../src/operations/leaf-help-table";
import { NAME_CATALOG } from "../src/operations/name-catalog";
import { ADMITTED_OPERATION_IDS, getOperation, invokeOperation } from "../src/operations/registry";
import { createBacklogActionMessage, parseBacklogActionMessage, resolveBacklogAgentMessage } from "../src/operations/work/backlog/agent-contracts";
import { backlogModelId, backlogSnapshotId, createBacklogLiveEnvelope } from "../src/operations/work/backlog/live-contracts";
import { createBacklogLivePayload } from "../src/operations/work/backlog/presentation";
import { WORK_CLAIM_POLICY } from "../src/operations/work/work-store/catalog";
import { WORK_HANDLE_OBSERVATIONS } from "../src/operations/work/work-store/schemas";
import { platform } from "../src/platform";
import { getInstallationCheckoutId } from "../src/store/installation-state";
import { PRESENTATION_SESSION_ID, smallPresentationReport } from "./fixtures/backlog-presentation";
import { cleanupTempDir, createTempDir } from "./helpers";

/**
 * W30 R0 P5: the factory run Skill and the backlog review handoff (A33 to
 * A42, A67 to A69, A81, A82). Tool names are generic, such as `tool-a`. Every
 * run uses a temporary MAKE_DOCS_HOME, so no test reaches the real Store.
 */

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const SKILL_ROOT = path.join(REPO_ROOT, "packages/skills/factory");
const BACKLOG_SKILL_ROOT = path.join(REPO_ROOT, "packages/skills/backlog-review");
const CONTRACT = readFileSync(path.join(REPO_ROOT, ".make-docs/system/contracts/factory-contract.md"), "utf8");
const NOW = new Date("2042-06-15T12:00:00.000Z");
const PROJECT_ID = "factory-p5-project";

const skillFiles = (): Array<[string, string]> => {
  const files: Array<[string, string]> = [["SKILL.md", readFileSync(path.join(SKILL_ROOT, "SKILL.md"), "utf8")]];
  for (const name of readdirSync(path.join(SKILL_ROOT, "references")).filter((entry) => !entry.startsWith(".")).sort()) files.push([`references/${name}`, readFileSync(path.join(SKILL_ROOT, "references", name), "utf8")]);
  return files;
};
const SKILL_TEXT = () => skillFiles().map(([, text]) => text).join("\n");

/* ------------------------------------------------------------------------ */
/* Fixture project                                                          */
/* ------------------------------------------------------------------------ */

type Value = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type WorkflowType = "build-then-review" | "lead-and-specialists" | "staged-backlog";

const FOREMAN = `        foreman:
          job: Claim the unit, brief, judge, and accept.
          capabilities: [read-write-files, run-commands, launch-agent, wait-for-agent, read-agent-result]
          returns: Accepted units and escalations.
`;
const BUILDER = `        builder:
          job: Build the unit.
          capabilities: [read-write-files, run-commands]
          returns: The result and its evidence.
`;
const REVIEWER = `        reviewer:
          job: Review the result.
          capabilities: [read-write-files]
          returns: A pass or a defect list.
`;
const RESEARCHER = `        researcher:
          job: Find the sources for one part.
          capabilities: [read-write-files]
          returns: The sources and notes.
          context: [unit-record, requirements]
`;
const FRONT_DESK = `        front-desk:
          job: Take the scope and carry messages.
          capabilities: [read-write-files]
          returns: The scope and the answers.
`;

function workflowYaml(type: WorkflowType, options: { roundLimit?: number; extra?: string } = {}): string {
  const roles = type === "lead-and-specialists" ? FOREMAN + BUILDER + RESEARCHER + REVIEWER : type === "staged-backlog" ? FRONT_DESK + FOREMAN + BUILDER + REVIEWER : FOREMAN + BUILDER + REVIEWER;
  return `factory:
  workflows:
    ship:
      type: ${type}
      typeVersion: 1
      roundLimit: ${options.roundLimit ?? 3}
      roles:
${roles}${type === "lead-and-specialists" ? "      integrationOwner: foreman\n" : ""}${options.extra ?? ""}      humanChannel: wait-in-session
`;
}

const PROOF = (capabilityId: string, version: string) => ({ capabilityId, method: "Ran the proof with a known result.", toolVersion: version, provedAt: NOW.toISOString(), result: "proved", notCovered: [] });
const TOOLS = [
  {
    toolId: "tool-a", kind: "agent-harness", label: "Tool A", state: "available", reportedVersion: "1.0",
    capabilities: ["read-write-files", "run-commands", "launch-agent", "wait-for-agent", "read-agent-result"],
    proofs: ["read-write-files", "run-commands", "launch-agent", "wait-for-agent", "read-agent-result"].map((id) => PROOF(id, "1.0")),
    expectedVersion: null,
  },
  { toolId: "tool-b", kind: "agent-harness", label: "Tool B", state: "available", reportedVersion: "2.0", capabilities: ["read-write-files"], proofs: [PROOF("read-write-files", "2.0")], expectedVersion: null },
];
const bindingFor = (type: WorkflowType) => ({
  roles: {
    foreman: "tool-a", builder: "tool-a", reviewer: "tool-b",
    ...(type === "lead-and-specialists" ? { researcher: "tool-a" } : {}),
    ...(type === "staged-backlog" ? { "front-desk": "tool-a" } : {}),
  },
  worktreeMethod: "none", channelRef: null, wakeMethod: "person", wakeRef: null, knownLosses: ["No tool can wake on its own."],
});

let temp: string;
let store: string;
/** A folder that is not the project: the foreman works here (A81). */
let elsewhere: string;

beforeEach(() => {
  temp = platform.describePath(createTempDir("make-docs-w30-p5-")).canonicalPath;
  store = path.join(temp, "store");
  elsewhere = path.join(temp, "elsewhere");
  mkdirSync(elsewhere, { recursive: true });
  vi.stubEnv("MAKE_DOCS_HOME", store);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  cleanupTempDir(temp);
});

function project(config: string, name = "aurora"): string {
  const root = path.join(temp, name);
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\nprojectName: ${name}\n${config}`);
  const canonical = platform.describePath(root).canonicalPath;
  getInstallationCheckoutId(canonical, store);
  return canonical;
}

/** The factory and lifecycle records. The work store keeps the claim ID itself, as its own private key, so it is left out. */
function dump(): string {
  const db = new DatabaseSync(path.join(store, "store.db"), { readOnly: true });
  try {
    const tables = (db.prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND (name LIKE 'factory_%' OR name LIKE 'lifecycle_%') ORDER BY name").all() as Array<{ name: string }>).map((row) => row.name);
    return JSON.stringify(tables.map((table) => [table, db.prepare(`SELECT * FROM ${table}`).all()]));
  } finally {
    db.close();
  }
}

/**
 * A scripted foreman that follows the run Skill. It works in a folder that is
 * not the project, and it checks that each call names the project (A81).
 */
class Foreman {
  calls: Array<{ id: string; input: Record<string, unknown> }> = [];
  messages: string[] = [];
  now = NOW;
  constructor(readonly root: string, readonly name = "aurora") {}

  async call(id: string, input: Record<string, unknown>, now = this.now): Promise<Value> {
    this.calls.push({ id, input });
    const context = createExecutionContext({ surface: "test", writesAllowed: true, storeRoot: store, cwd: elsewhere, now: () => now.toISOString() });
    return (await invokeOperation(id, input, context)).value as Value;
  }

  /** Name the project, as the Skill says: --project for factory calls, the checkout path for work and lifecycle calls. */
  factory(id: string, input: Record<string, unknown>, now?: Date) {
    return this.call(id, { project: this.name, ...input }, now);
  }
  work(id: string, input: Record<string, unknown>, now?: Date) {
    return this.call(id, { targetRoot: this.root, ...input }, now);
  }
  lifecycle(id: string, input: Record<string, unknown>, now?: Date) {
    return this.call(id, { repoRoot: this.root, ...input }, now);
  }

  /** The person hears each floor event as one self-contained message, with the project named (T11, T21). */
  escalate(parts: { happened: string; need: string; required: boolean; blocks: string; after: string }): string {
    const message = [
      `Project ${this.name}: ${parts.happened}`,
      "",
      `What happened: ${parts.happened}`,
      `What I need: ${parts.need}`,
      `Required or optional: ${parts.required ? "Required." : "Optional."}`,
      `What it blocks: ${parts.blocks}`,
      `After you answer: ${parts.after}`,
    ].join("\n");
    this.messages.push(message);
    return message;
  }
}

async function readyWorkflow(foreman: Foreman, type: WorkflowType): Promise<void> {
  expect((await foreman.call("factory.tools.save", { tools: TOOLS })).result).toBe("saved");
  const saved = await foreman.call("factory.workflow.save", { targetRoot: foreman.root, workflow: "ship", binding: bindingFor(type) });
  expect(saved.result, JSON.stringify(saved)).toBe("saved");
  const proof = await foreman.call("factory.proof.save", { targetRoot: foreman.root, workflow: "ship", outcome: "passed", testTask: "Write one line and review it.", planDigest: saved.revision.planDigest, path: ["builder: tool-a", "reviewer: tool-b"] });
  expect(proof.readiness, JSON.stringify(proof)).toBe("ready");
}

/** Load (T1), take a quick item, claim it, and open its run (T4, T6). */
async function claimUnit(foreman: Foreman, title = "Write the notes", ttlSeconds?: number): Promise<{ unit: string; claimId: string; runId: string; version: number }> {
  const shown = await foreman.factory("factory.workflow.show", { workflow: "ship" });
  expect(shown.live.readiness).toBe("ready");
  const added = await foreman.work("work.queue.add", { title });
  expect(added.number, JSON.stringify(added)).toMatch(/^\d+$/);
  const unit = String(added.number);
  const next = await foreman.work("work.queue.next", { level: "quick-item", claimant: "foreman-1" });
  const ready = next.ready.find((entry: Value) => String(entry.coordinate) === unit);
  expect(ready, JSON.stringify(next)).toBeDefined();
  const claimed = await foreman.work("work.queue.claim", { unit, claimant: "foreman-1", expectedVersion: ready.revision, taskHandle: "foreman-session-1", ...(ttlSeconds ? { ttlSeconds } : {}) });
  expect(claimed.result, JSON.stringify(claimed)).toBe("claimed");
  const runId = `run-p5-${unit}`;
  await foreman.lifecycle("lifecycle.start", { lifecycleStage: "implementation", runId, checkpoint: `Quick item ${unit}: claimed.` });
  return { unit, claimId: claimed.claimId, runId, version: claimed.revision };
}

/** One job, from start to the given status, with the Skill's reason codes. */
async function job(foreman: Foreman, claim: { unit: string; claimId: string; runId: string }, role: string, part = "main") {
  const started = await foreman.factory("factory.assignment.start", { workflow: "ship", unit: claim.unit, role, partLabel: part, runId: claim.runId, claimId: claim.claimId, targetRoot: foreman.root });
  expect(started.result, JSON.stringify(started)).toBe("started");
  let version = started.assignment.version as number;
  const id = started.assignment.assignmentId as string;
  const move = async (status: string, reason: string, extra: Record<string, unknown> = {}) => {
    const value = await foreman.factory("factory.assignment.save", { assignmentId: id, expectedVersion: version, claimId: claim.claimId, status, reason, ...extra });
    if (value.result === "updated") version = value.assignment.version;
    return value;
  };
  return { id, started, move, version: () => version };
}

/** Build, review in a separate session, and accept: the loop of every type for one part. */
async function buildAndReview(foreman: Foreman, claim: { unit: string; claimId: string; runId: string }, part = "main", builderRole = "builder") {
  const builder = await job(foreman, claim, builderRole, part);
  expect(await builder.move("running", "tool-started", { taskHandle: `builder-${part}` })).toMatchObject({ result: "updated" });
  expect(await builder.move("returned", "result-returned")).toMatchObject({ result: "updated" });
  expect(await builder.move("in-review", "sent-to-review")).toMatchObject({ result: "updated" });
  const reviewer = await job(foreman, claim, "reviewer", part);
  expect(reviewer.started.assignment.toolId).toBe("tool-b");
  for (const [status, reason] of [["running", "tool-started"], ["returned", "result-returned"], ["in-review", "sent-to-review"], ["accepted", "review-passed"]]) {
    expect(await reviewer.move(status, reason), `${status}`).toMatchObject({ result: "updated" });
  }
  expect(await builder.move("accepted", "review-passed")).toMatchObject({ result: "updated", assignment: { status: "accepted" } });
  return { builder, reviewer };
}

async function unitRevision(foreman: Foreman, unit: string, claimant: string): Promise<number> {
  const next = await foreman.work("work.queue.next", { level: "quick-item", claimant });
  const entry = [...(next.ready ?? []), ...(next.waiting ?? [])].find((item: Value) => String(item.coordinate) === unit);
  return entry?.revision ?? 1;
}

async function closeUnit(foreman: Foreman, claim: { unit: string; claimId: string; runId: string }): Promise<Value> {
  const next = await foreman.work("work.queue.next", { level: "quick-item", claimant: "foreman-1" });
  const entry = [...(next.ready ?? []), ...(next.waiting ?? [])].find((item: Value) => String(item.coordinate) === claim.unit);
  return foreman.work("work.queue.close", { unit: claim.unit, expectedVersion: entry?.revision ?? 1, claimId: claim.claimId });
}

/** Every factory call named the project, and no call relied on the current folder (A81). */
function expectEveryCallNamesTheProject(foreman: Foreman): void {
  for (const { id, input } of foreman.calls) {
    if (id === "factory.tools.save") {
      expect(input.project ?? input.targetRoot, id).toBeUndefined();
      continue;
    }
    if (id.startsWith("factory.")) expect(input.project ?? input.targetRoot, id).toBeDefined();
    else if (id.startsWith("work.")) expect(input.targetRoot, id).toBe(foreman.root);
    else if (id.startsWith("lifecycle.")) expect(input.repoRoot, id).toBe(foreman.root);
  }
  for (const message of foreman.messages) expect(message).toContain(`Project ${foreman.name}`);
}

/* ------------------------------------------------------------------------ */
/* Skill text and its twin in code                                          */
/* ------------------------------------------------------------------------ */

/* ------------------------------------------------------------------------ */
/* Twin checker: each Skill list and table, both ways, against the code      */
/* ------------------------------------------------------------------------ */

type SkillFiles = Record<string, string>;
const skillFileMap = (): SkillFiles => Object.fromEntries(skillFiles());

/** The backticked values of the bullet list right after the line that holds `marker`. */
function bulletsAfter(text: string, marker: string): string[] | null {
  const lines = text.split("\n");
  const at = lines.findIndex((line) => line.includes(marker));
  if (at < 0) return null;
  const values: string[] = [];
  for (const line of lines.slice(at + 1)) {
    const match = /^\s*- `([^`]+)`\s*$/.exec(line);
    if (match) values.push(match[1]!);
    else if (line.trim() !== "" || values.length > 0) break;
  }
  return values;
}

/** The rows of the table whose header starts with `| <header> |`, as cell lists. */
function tableRows(text: string, header: string): string[][] | null {
  const lines = text.split("\n");
  const at = lines.findIndex((line) => line.startsWith(`| ${header} |`));
  if (at < 0) return null;
  const rows: string[][] = [];
  for (const line of lines.slice(at + 2)) {
    if (!line.startsWith("|")) break;
    rows.push(line.slice(1, -1).split(" | ").map((cell) => cell.trim()));
  }
  return rows;
}
const codesIn = (cell: string) => [...cell.matchAll(/`([a-z][a-z0-9-]*)`/g)].map((match) => match[1]!);

/** Required flag groups of a leaf usage: each flag outside brackets; `a|b` gives one group with two choices. */
function requiredFlagGroups(usage: string): string[][] {
  let outside = usage;
  while (/\[[^[\]]*\]/.test(outside)) outside = outside.replace(/\[[^[\]]*\]/g, " ");
  return outside.split(/\s+/).filter((token) => token.startsWith("--")).map((token) => token.split("|").map((part) => part.replace(/<.*$/, "")).filter((part) => part.startsWith("--")));
}

const minutes = (seconds: number) => (seconds % 3600 === 0 && seconds >= 3600 ? `${seconds / 3600} hours` : `${seconds / 60} minutes`);

/** Every difference between the Skill text and the code. Empty means they agree. */
function twinProblems(files: SkillFiles): string[] {
  const problems: string[] = [];
  const same = (label: string, found: readonly string[] | null, expected: readonly string[]) => {
    if (found === null) problems.push(`${label}: the list is missing`);
    else if (JSON.stringify([...found]) !== JSON.stringify([...expected])) problems.push(`${label}: ${JSON.stringify(found)} is not ${JSON.stringify(expected)}`);
  };
  const loop = files["references/run-loop.md"] ?? "";
  const rules = files["references/working-rules.md"] ?? "";
  const messages = files["references/messages.md"] ?? "";
  const all = Object.values(files).join("\n");
  same("status history codes", bulletsAfter(loop, "These are the status history codes:"), FACTORY_STATUS_HISTORY_CODES);
  same("drift codes", tableRows(rules, "Drift code")?.map((row) => codesIn(row[0]!)[0] ?? row[0]!) ?? null, FACTORY_DRIFT_CODES);
  same("refusal codes", tableRows(rules, "Refusal code")?.map((row) => codesIn(row[0]!)[0] ?? row[0]!) ?? null, FACTORY_REFUSAL_CODES);
  same("project refusal codes", tableRows(messages, "Code")?.map((row) => codesIn(row[0]!)[0] ?? row[0]!) ?? null, FACTORY_REFUSAL_CODES.filter((code) => code.startsWith("project-")));
  same("grant scopes", tableRows(rules, "Grant scope")?.map((row) => codesIn(row[0]!)[0] ?? row[0]!) ?? null, FACTORY_GRANT_SCOPES);
  same("reset action", [.../for the action `([a-z-]+)`/g[Symbol.matchAll](all)].map((match) => match[1]!).filter((value, index, list) => list.indexOf(value) === index), [FACTORY_RESET_ROUNDS_ACTION]);
  same("claim sizes", bulletsAfter(loop, "These are the claim sizes:"), FACTORY_CLAIM_SIZES);
  same("default claim size", [/The default is `([a-z]+)`\. These are the claim sizes/.exec(loop)?.[1] ?? "none"], [FactoryWorkflowDefinitionSchema.parse({ type: "build-then-review", typeVersion: 1, roles: { builder: { job: "Build.", capabilities: ["read-write-files"], returns: "A result." } }, humanChannel: "wait-in-session" }).limits.claimSize]);
  same("handle values", bulletsAfter(loop, "It is one of these values:"), WORK_HANDLE_OBSERVATIONS);
  same("capability IDs", bulletsAfter(rules, "These are the capability IDs:"), FACTORY_CAPABILITY_IDS);
  same("claim time", tableRows(loop, "Claim time")?.map((row) => row[1]!) ?? null, [WORK_CLAIM_POLICY.checkEverySeconds, WORK_CLAIM_POLICY.defaultTtlSeconds, WORK_CLAIM_POLICY.minTtlSeconds, WORK_CLAIM_POLICY.maxTtlSeconds].map(minutes));
  // The move table, both ways.
  const moves: Record<string, string[]> = {};
  for (const row of tableRows(loop, "From") ?? []) {
    const next = row[1] === "None" ? [] : codesIn(row[1]!);
    for (const status of codesIn(row[0]!)) moves[status] = next;
  }
  same("move table", Object.entries(moves).map(([from, to]) => `${from}>${to.join(",")}`), Object.entries(FACTORY_STATUS_MOVES).map(([from, to]) => `${from}>${to.join(",")}`));
  // The context lists.
  const contextRow = (label: string) => tableRows(rules, "Role")?.find((row) => row[0] === label)?.slice(1).flatMap(codesIn) ?? null;
  same("builder context", contextRow("Builder (default)"), FACTORY_DEFAULT_CONTEXT.builder!);
  same("reviewer context", contextRow("Reviewer (default)"), FACTORY_DEFAULT_CONTEXT.reviewer!);
  same("context kinds", (() => { const line = rules.split("\n").find((entry) => entry.startsWith("The fixed context kinds are")); return line ? codesIn(line.split(". ")[0]!) : null; })(), FACTORY_CONTEXT_KINDS);
  // Each reason that a move names is a status history code.
  for (const match of all.matchAll(/(?:--reason |reason `)([a-z-]+)/g)) if (!(FACTORY_STATUS_HISTORY_CODES as readonly string[]).includes(match[1]!)) problems.push(`reason ${match[1]} is not a status history code`);
  // Each command is current, its flags are in its leaf help, and it gives every required flag.
  const current = NAME_CATALOG.filter((entry) => entry.status === "current" && (ADMITTED_OPERATION_IDS as readonly string[]).includes(entry.id));
  const byPath = new Map(current.map((entry) => [entry.newCli, entry.id]));
  for (const match of all.matchAll(/`make-docs ([^`]+)`/g)) {
    const command = match[1]!;
    if (!command.includes("<")) continue; // a command name in prose, such as `make-docs work release`
    const words = command.split(" ");
    let id: string | undefined;
    for (let length = words.length; length > 0 && !id; length -= 1) id = byPath.get(words.slice(0, length).join(" "));
    if (!id) {
      problems.push(`${command}: no current command`);
      continue;
    }
    const help = leafHelpEntry(id);
    const known = help.usage + " " + help.options.map((option) => option.name).join(" ");
    const flags: string[] = command.match(/--[a-z][a-z-]*/g) ?? [];
    for (const flag of flags) if (!new RegExp(`${flag}(?![a-z-])`).test(known)) problems.push(`${command}: ${flag} is not in the leaf help`);
    for (const group of requiredFlagGroups(help.usage)) if (!group.some((flag) => flags.includes(flag))) problems.push(`${command}: a required flag is missing: ${group.join(" or ")}`);
  }
  const mcpNames = new Set(current.map((entry) => entry.newMcp));
  for (const match of all.matchAll(/MCP `([a-z]+(?:_[a-z]+)+)`/g)) if (!mcpNames.has(match[1]!)) problems.push(`MCP ${match[1]} is not a current tool`);
  return problems;
}

describe("W30 R0 P5 run Skill text", () => {
  it("replaces the profiles and old Store references, stays explicit-only, and its registry entry ships every reference (T1, T2)", () => {
    const names = readdirSync(path.join(SKILL_ROOT, "references")).filter((entry) => !entry.startsWith(".")).sort();
    expect(names).toEqual(["messages.md", "run-loop.md", "working-rules.md"]);
    expect(parseYaml(readFileSync(path.join(SKILL_ROOT, "agents/openai.yaml"), "utf8")).policy.allow_implicit_invocation).toBe(false);
    const registry = JSON.parse(readFileSync(path.join(REPO_ROOT, "packages/cli/skill-registry.json"), "utf8"));
    const entry = registry.skills.find((skill: Value) => skill.name === "factory");
    expect(entry.assets.map((asset: Value) => asset.source).sort()).toEqual(["agents/openai.yaml", ...names.map((name) => `references/${name}`)]);
    const text = SKILL_TEXT();
    expect(text).not.toMatch(/\bprofiles?\b/i);
    expect(text).toContain("This Skill runs only when it is named.");
    // The installed copy in this repository matches the source.
    for (const [file, body] of skillFiles()) expect(readFileSync(path.join(REPO_ROOT, ".agents/skills/factory", file), "utf8"), file).toBe(body);
  });

  it("names no particular tool, harness, vendor, model, or messaging product (tool-agnostic)", () => {
    const text = `${SKILL_TEXT()}\n${readFileSync(path.join(SKILL_ROOT, "agents/openai.yaml"), "utf8")}`;
    for (const word of ["codex", "claude", "openai", "anthropic", "gpt", "gemini", "copilot", "cursor", "tmux", "slack", "telegram", "discord", "whatsapp", "imessage", "cron", "launchd", "vscode", "jetbrains", "github", "ollama", "llama"]) {
      expect(text.toLowerCase(), word).not.toMatch(new RegExp(`\\b${word}\\b`));
    }
  });

  it("agrees with the code in every list and table, both ways (twin)", () => {
    expect(twinProblems(skillFileMap())).toEqual([]);
    const text = SKILL_TEXT();
    for (const id of ["factory.status", "factory.workflow.show", "factory.workflow.save", "factory.assignment.start", "factory.assignment.save", "factory.assignment.list"]) {
      expect(text, id).toContain(`make-docs ${id.split(".").join(" ")}`);
    }
    expect(text).toContain("`factory-assignment-open`");
    expect(FACTORY_DEFAULT_CONTEXT.reviewer).not.toContain("builder-summary");
  });

  it("finds each planted miss in the Skill text (twin)", () => {
    const plants: Array<[string, string, string, string]> = [
      ["history code missing", "references/run-loop.md", "- `scope-changed`\n", ""],
      ["history code extra", "references/run-loop.md", "- `scope-changed`\n", "- `scope-changed`\n- `work-paused`\n"],
      ["drift code missing", "references/working-rules.md", "| `permission-lost` |", "| `permission-gone` |"],
      ["refusal code missing", "references/working-rules.md", "| `grant-expired` | The grant's time ran out. | Ask the person: floor event 1. |\n", ""],
      ["refusal code extra", "references/working-rules.md", "| `never-log-field` |", "| `never-log-value` |"],
      ["project refusal missing", "references/messages.md", "| `project-mismatch` |", "| `project-conflict` |"],
      ["grant scope missing", "references/working-rules.md", "| `standing` | Every run of the workflow, until the person revokes it. |\n", ""],
      ["reset action renamed", "references/working-rules.md", "for the action `reset-correction-rounds`", "for the action `reset-rounds`"],
      ["claim size missing", "references/run-loop.md", "   - `stage`\n", ""],
      ["default claim size", "references/run-loop.md", "The default is `phase`. These are the claim sizes", "The default is `task`. These are the claim sizes"],
      ["handle value missing", "references/run-loop.md", "     - `no-handle`\n", ""],
      ["capability missing", "references/working-rules.md", "- `edit-code`\n", ""],
      ["claim time changed", "references/run-loop.md", "| Check at least every | 10 minutes |", "| Check at least every | 15 minutes |"],
      ["move table changed", "references/run-loop.md", "| `offered` | `running`, `unknown`, `failed`, `cancelled` |", "| `offered` | `running`, `accepted`, `unknown`, `failed`, `cancelled` |"],
      ["context changed", "references/working-rules.md", "| Reviewer (default) | `unit-record`, `requirements`, `project-files`, `candidate-result`, `evidence-links` |", "| Reviewer (default) | `unit-record`, `requirements`, `project-files`, `candidate-result`, `evidence-links`, `builder-summary` |"],
      ["required flag missing", "references/run-loop.md", "--expected-version <n> --claim-id <claim-id> --status cancelled", "--claim-id <claim-id> --status cancelled"],
      ["unknown flag", "references/run-loop.md", "--takeover-from <old-claimant> --handle <seen>", "--takeover-from <old-claimant> --seen <seen>"],
      ["unknown reason", "references/run-loop.md", "--status running --reason tool-started", "--status running --reason started"],
      ["unknown command", "references/run-loop.md", "`make-docs work next --level", "`make-docs work list --level"],
    ];
    expect(plants.length).toBeGreaterThanOrEqual(15);
    for (const [label, file, before, after] of plants) {
      const files = skillFileMap();
      expect(files[file]!.includes(before), `${label}: the plant site is in the Skill`).toBe(true);
      const planted = files[file]!.replace(before, after);
      expect(planted, label).not.toBe(files[file]);
      expect(twinProblems({ ...files, [file]: planted }).length, label).toBeGreaterThan(0);
    }
  });

  it("names the project in every factory, work, and lifecycle command, and never relies on the current folder (T20, A81)", () => {
    for (const [file, text] of skillFiles()) {
      for (const match of text.matchAll(/`make-docs ((?:factory|work|lifecycle) [^`]+)`/g)) {
        const command = match[1]!;
        if (/^factory status$|^work (?:report|evidence record) --note/.test(command)) continue;
        if (!command.includes("<")) continue; // a bare command name in prose, such as `make-docs work report --note`
        if (command.startsWith("factory ")) expect(command, `${file}: ${command}`).toMatch(/--project <name>|--target-root <checkout>/);
        else if (command.startsWith("work evidence") || command.startsWith("lifecycle ")) expect(command, `${file}: ${command}`).toContain("--repo-root <checkout>");
        else expect(command, `${file}: ${command}`).toContain("--target-root <checkout>");
      }
    }
    const skill = readFileSync(path.join(SKILL_ROOT, "SKILL.md"), "utf8");
    expect(skill).toContain("Never take the project from the folder where you work");
    expect(skill).toContain("Name the project in every message to the person.");
    for (const code of ["project-missing", "project-not-found", "project-mismatch", "project-checkout-unclear"]) expect(skill, code).toContain(`\`${code}\``);
  });

  it("names every rule that the contract gives to the run Skill, and only rule IDs that the contract has (twin)", () => {
    const rows = CONTRACT.slice(CONTRACT.indexOf("## Rule Catalog")).split("\n").filter((line) => /^\| `[a-z-]+` \|/.test(line));
    const ids = new Set(rows.map((row) => /^\| `([a-z-]+)`/.exec(row)![1]!));
    const text = SKILL_TEXT();
    const backlog = readFileSync(path.join(BACKLOG_SKILL_ROOT, "SKILL.md"), "utf8");
    const named = [...`${text}\n${backlog}`.matchAll(/rules? `([a-z-]+)`(?: and `([a-z-]+)`)?/g)].flatMap((match) => [match[1], match[2]]).filter(Boolean) as string[];
    expect(named.length).toBeGreaterThan(15);
    for (const id of named) expect(ids.has(id), id).toBe(true);
    for (const row of rows.filter((line) => line.split(" | ").at(-1)!.includes("W30 R0 P5"))) {
      const id = /^\| `([a-z-]+)`/.exec(row)![1]!;
      expect(named, id).toContain(id);
    }
  });

  it("gives each message form the six parts, names the project, and holds no claim ID (T11, T12, T21, A39, A40)", () => {
    const messages = readFileSync(path.join(SKILL_ROOT, "references/messages.md"), "utf8");
    const blocks = [...messages.matchAll(/```text\n([\s\S]*?)```/g)].map((match) => match[1]!);
    expect(blocks.length).toBe(5);
    for (const block of blocks.slice(0, 4)) {
      expect(block).toMatch(/^Project <project name>/);
      for (const part of ["What happened:", "What I need:", "Required or optional:", "What it blocks:", "After you answer:"]) expect(block, part).toContain(part);
      expect(block).not.toMatch(/\bwc-[a-z0-9]{8,}/);
    }
    const acceptance = blocks[3]!;
    expect(acceptance).toContain("Evidence: <link>");
    expect(acceptance).toMatch(/<unit 1>[\s\S]*<unit 2>/);
    expect(blocks[4]).toMatch(/^Project <project name>, workflow <workflow>/);
    // The five floor events are listed in the order of the contract.
    const floor = CONTRACT.slice(CONTRACT.indexOf("### Escalation Floor"), CONTRACT.indexOf("### Message Rules"));
    expect([...messages.matchAll(/^\d\. /gm)].length).toBeGreaterThanOrEqual(5);
    expect(floor).toContain("5. Work that is ready for the person to accept");
    expect(messages).toContain("5. Work that is ready for the person to accept at the end of the given scope.");
  });
});

/* ------------------------------------------------------------------------ */
/* Fixture runs                                                             */
/* ------------------------------------------------------------------------ */

describe("W30 R0 P5 fixture runs", () => {
  it("refuses a workflow that is not ready, and the refusal names the fix (A33, T1)", async () => {
    const root = project(workflowYaml("build-then-review"));
    const foreman = new Foreman(root);
    await foreman.call("factory.tools.save", { tools: TOOLS });
    await foreman.call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: bindingFor("build-then-review") });
    const shown = await foreman.factory("factory.workflow.show", { workflow: "ship" });
    expect(shown.live.readiness).toBe("wired");
    expect(shown.live.nextStep).toContain("factory proof save");
    const added = await foreman.work("work.queue.add", { title: "Write the notes" });
    const claimed = await foreman.work("work.queue.claim", { unit: String(added.number), claimant: "foreman-1", expectedVersion: added.revision });
    await foreman.lifecycle("lifecycle.start", { lifecycleStage: "implementation", runId: "run-p5-wired" });
    const refused = await foreman.factory("factory.assignment.start", { workflow: "ship", unit: String(added.number), role: "builder", runId: "run-p5-wired", claimId: claimed.claimId, targetRoot: root });
    expect(refused).toMatchObject({ result: "refused", refusal: "not-ready" });
    expect(refused.nextAction).toMatch(/\S/);
    const skill = readFileSync(path.join(SKILL_ROOT, "SKILL.md"), "utf8");
    expect(skill).toContain("Refuse a workflow that is not `ready`");
    expect(skill).toContain("`wired`: run the `factory-setup` Skill to pass the test task");
  });

  it.each(["build-then-review", "lead-and-specialists", "staged-backlog"] as const)("completes one unit with the %s type, from another folder, naming the project in every call (A34, A81)", async (type) => {
    const root = project(workflowYaml(type));
    const foreman = new Foreman(root);
    await readyWorkflow(foreman, type);
    const claim = await claimUnit(foreman);
    if (type === "lead-and-specialists") {
      // Each part is its own job with its own part label (T17), and the reviewer built no part.
      await buildAndReview(foreman, claim, "research", "researcher");
      await buildAndReview(foreman, claim, "draft");
    } else {
      await buildAndReview(foreman, claim);
    }
    const open = await foreman.factory("factory.assignment.list", { workflow: "ship" });
    expect(open.assignments ?? []).toEqual([]);
    const closed = await closeUnit(foreman, claim);
    expect(closed.accepted, JSON.stringify(closed)).toBe(true);
    if (type === "staged-backlog") {
      // The acceptance request goes out once, at the end of the scope.
      const message = foreman.escalate({ happened: `quick item ${claim.unit} is ready for you to accept.`, need: "Accept the result, or name what to change.", required: true, blocks: "The next scope.", after: "The factory records your answer." });
      expect(message).toContain("Required or optional: Required.");
    }
    expectEveryCallNamesTheProject(foreman);
    expect(dump()).not.toContain(claim.claimId);
  });

  it("refuses to close a unit while an assignment is open (factory-assignment-open)", async () => {
    const root = project(workflowYaml("build-then-review"));
    const foreman = new Foreman(root);
    await readyWorkflow(foreman, "build-then-review");
    const claim = await claimUnit(foreman);
    const builder = await job(foreman, claim, "builder");
    await builder.move("running", "tool-started", { taskHandle: "builder-main" });
    const refused = await closeUnit(foreman, claim);
    expect(JSON.stringify(refused)).toContain("factory-assignment-open");
  });

  it("checks the handle after a lost reply and sends no duplicate job (A35, T5)", async () => {
    const root = project(workflowYaml("build-then-review"));
    const foreman = new Foreman(root);
    await readyWorkflow(foreman, "build-then-review");
    const claim = await claimUnit(foreman);
    const builder = await job(foreman, claim, "builder");
    // The tool's reply is lost: the assignment becomes unknown, and nothing is sent again first.
    expect(await builder.move("unknown", "handle-not-found")).toMatchObject({ result: "updated", assignment: { status: "unknown" } });
    const duplicate = await foreman.factory("factory.assignment.start", { workflow: "ship", unit: claim.unit, role: "builder", runId: claim.runId, claimId: claim.claimId, targetRoot: root });
    expect(duplicate).toMatchObject({ result: "refused", refusal: "assignment-open" });
    // The handle check finds the job running: settle it with handle-checked.
    expect(await builder.move("running", "handle-checked", { taskHandle: "builder-main" })).toMatchObject({ result: "updated", assignment: { status: "running" } });
    const all = await foreman.factory("factory.assignment.list", { workflow: "ship", all: true });
    expect(all.assignments.filter((entry: Value) => entry.role === "builder")).toHaveLength(1);
    expectEveryCallNamesTheProject(foreman);
  });

  it("takes over an expired claim only after the handle check, on the same revision and round count (A36, A67)", async () => {
    const root = project(workflowYaml("build-then-review"));
    const first = new Foreman(root);
    await readyWorkflow(first, "build-then-review");
    const claim = await claimUnit(first, "Write the notes", 1200);
    const builder = await job(first, claim, "builder");
    await builder.move("running", "tool-started", { taskHandle: "builder-main" });
    await builder.move("returned", "result-returned");
    expect(await builder.move("needs-correction", "defects-found")).toMatchObject({ assignment: { roundCount: 1, planRevision: 1 } });
    await builder.move("running", "correction-sent");
    // The first foreman stops. After the claim time, a second foreman checks the handle first.
    const second = new Foreman(root);
    second.now = new Date(NOW.getTime() + 1300_000);
    const listed = await second.factory("factory.assignment.list", { workflow: "ship" });
    const open = listed.assignments.find((entry: Value) => entry.role === "builder");
    expect(open).toMatchObject({ status: "running", planRevision: 1, roundCount: 1 });
    const next = await second.work("work.queue.next", { level: "quick-item", claimant: "foreman-2" });
    const entry = [...(next.ready ?? []), ...(next.waiting ?? [])].find((item: Value) => String(item.coordinate) === claim.unit);
    const revision = entry?.revision ?? claim.version;
    const stillRunning = await second.work("work.queue.claim", { unit: claim.unit, claimant: "foreman-2", expectedVersion: revision, takeoverFrom: "foreman-1", handle: "running" });
    expect(stillRunning.result).toBe("refused");
    const taken = await second.work("work.queue.claim", { unit: claim.unit, claimant: "foreman-2", expectedVersion: revision, takeoverFrom: "foreman-1", handle: "stopped", taskHandle: "foreman-session-2" });
    expect(taken.result, JSON.stringify(taken)).toBe("claimed");
    // Load the exact revision that the assignment names, and go on with the same round count.
    const revisionShown = await second.factory("factory.workflow.show", { workflow: "ship", revision: open.planRevision });
    expect(revisionShown.revision).toMatchObject({ number: 1, isReady: true });
    const moved = await second.factory("factory.assignment.save", { assignmentId: open.assignmentId, expectedVersion: open.version, claimId: taken.claimId, status: "returned", reason: "taken-over" });
    expect(moved).toMatchObject({ result: "updated", assignment: { roundCount: 1, planRevision: 1 } });
    // The old claim ID no longer works.
    expect(await second.factory("factory.assignment.save", { assignmentId: open.assignmentId, expectedVersion: moved.assignment.version, claimId: claim.claimId })).toMatchObject({ result: "refused", refusal: "claim-not-held" });
    // The second foreman's own claim runs out: it takes it over from itself after the handle check, with a new task handle.
    second.now = new Date(NOW.getTime() + 2 * 1300_000 + 1800_000);
    const own = await second.work("work.queue.claim", { unit: claim.unit, claimant: "foreman-2", expectedVersion: await unitRevision(second, claim.unit, "foreman-2"), takeoverFrom: "foreman-2", handle: "stopped", taskHandle: "foreman-session-3" });
    expect(own.result, JSON.stringify(own)).toBe("claimed");
    expectEveryCallNamesTheProject(first);
    expectEveryCallNamesTheProject(second);
  });

  it("needs the new task handle at a takeover, or the next takeover has no handle to check (T5)", async () => {
    const root = project(workflowYaml("build-then-review"));
    const foreman = new Foreman(root);
    await readyWorkflow(foreman, "build-then-review");
    const claim = await claimUnit(foreman, "Write the notes", 1200);
    foreman.now = new Date(NOW.getTime() + 1300_000);
    const noHandle = await foreman.work("work.queue.claim", { unit: claim.unit, claimant: "foreman-2", expectedVersion: await unitRevision(foreman, claim.unit, "foreman-2"), takeoverFrom: "foreman-1", handle: "stopped" });
    expect(noHandle.result, JSON.stringify(noHandle)).toBe("claimed");
    foreman.now = new Date(NOW.getTime() + 2 * 1300_000 + 1800_000);
    const next = await foreman.work("work.queue.claim", { unit: claim.unit, claimant: "foreman-3", expectedVersion: await unitRevision(foreman, claim.unit, "foreman-3"), takeoverFrom: "foreman-2", handle: "stopped" });
    expect(next.result).toBe("refused");
    expect(JSON.stringify(next)).toMatch(/no-handle/);
  });

  it("stops at the round limit, gets round-limit-reached, and escalates with the evidence (A37, A67, T16)", async () => {
    const root = project(workflowYaml("build-then-review", { roundLimit: 1 }));
    const foreman = new Foreman(root);
    await readyWorkflow(foreman, "build-then-review");
    const claim = await claimUnit(foreman);
    const builder = await job(foreman, claim, "builder");
    await builder.move("running", "tool-started", { taskHandle: "builder-main" });
    await builder.move("returned", "result-returned");
    expect(await builder.move("needs-correction", "defects-found")).toMatchObject({ assignment: { roundCount: 1 } });
    await builder.move("running", "correction-sent");
    await builder.move("returned", "result-returned");
    const refused = await builder.move("needs-correction", "defects-found");
    expect(refused).toMatchObject({ result: "refused", refusal: "round-limit-reached" });
    const message = foreman.escalate({
      happened: `the fix for quick item ${claim.unit} stopped after 1 correction round. The CLI refused another round (code round-limit-reached: the job used its limit).`,
      need: "Allow more rounds, or change the requirement.",
      required: true,
      blocks: `Quick item ${claim.unit}.`,
      after: "The factory sends the defects back with your choice, then reviews again.",
    });
    for (const part of ["What happened:", "What I need:", "Required or optional:", "What it blocks:", "After you answer:"]) expect(message).toContain(part);
    // An illegal move is refused too.
    expect(await builder.move("accepted", "review-passed")).toMatchObject({ result: "refused", refusal: "illegal-move" });
    // The person allows more rounds: a once grant, the old assignment cancelled, and a new one with reset rounds (T16).
    const grant = await foreman.factory("factory.workflow.save", { workflow: "ship", grants: { add: [{ action: "reset-correction-rounds", scope: "once", grantedBy: "the owner" }] }, targetRoot: root });
    expect(grant).toMatchObject({ result: "saved", grantOnly: true });
    expect(await builder.move("cancelled", "round-limit-reached")).toMatchObject({ result: "updated", assignment: { status: "cancelled", roundCount: 1 } });
    const fresh = await foreman.factory("factory.assignment.start", { workflow: "ship", unit: claim.unit, role: "builder", runId: claim.runId, claimId: claim.claimId, resetRounds: true, targetRoot: root });
    expect(fresh).toMatchObject({ result: "started", assignment: { roundCount: 0, status: "offered" } });
    const grants = (await foreman.factory("factory.workflow.show", { workflow: "ship" })).grants;
    expect(grants.find((entry: Value) => entry.action === "reset-correction-rounds")).toMatchObject({ state: "spent" });
    // Without a reset grant, a new assignment keeps the count.
    expect(await foreman.factory("factory.assignment.start", { workflow: "ship", unit: claim.unit, role: "builder", runId: claim.runId, claimId: claim.claimId, resetRounds: true, targetRoot: root })).toMatchObject({ result: "refused" });
    expectEveryCallNamesTheProject(foreman);
  });

  it("records the merge grant in the same save that accepts a unit, and asks again on a spent once grant without merging (A68, T18)", async () => {
    const root = project(workflowYaml("build-then-review"));
    const foreman = new Foreman(root);
    await readyWorkflow(foreman, "build-then-review");
    let merges = 0;
    /** Review a unit to in-review, then accept it with the merge grant use in one save, as the Skill says. */
    const acceptAndMerge = async (title: string) => {
      const claim = await claimUnit(foreman, title);
      const builder = await job(foreman, claim, "builder");
      await builder.move("running", "tool-started", { taskHandle: `builder-${claim.unit}` });
      await builder.move("returned", "result-returned");
      await builder.move("in-review", "sent-to-review");
      const accept = () => builder.move("accepted", "review-passed", { grantUse: "merge" });
      return { claim, builder, accept };
    };
    await foreman.factory("factory.workflow.save", { workflow: "ship", grants: { add: [{ action: "merge", scope: "once", grantedBy: "the owner" }] }, targetRoot: root });
    const first = await acceptAndMerge("First unit");
    const used = await first.accept();
    expect(used).toMatchObject({ result: "updated", assignment: { status: "accepted" }, grant: { action: "merge", state: "spent" } });
    merges += 1;
    // After the accept, the grant use is refused as final-status; after the close, as claim-not-held.
    expect(await first.builder.move("accepted", "review-passed", { grantUse: "merge" })).toMatchObject({ result: "refused", refusal: "final-status" });
    expect((await closeUnit(foreman, first.claim)).accepted).toBe(true);
    expect(await foreman.factory("factory.assignment.save", { assignmentId: first.builder.id, expectedVersion: first.builder.version(), claimId: first.claim.claimId, grantUse: "merge" })).toMatchObject({ result: "refused", refusal: "claim-not-held" });
    // The second unit: the once grant is spent, so the accept and the grant use are refused together.
    const second = await acceptAndMerge("Second unit");
    const refused = await second.accept();
    expect(refused).toMatchObject({ result: "refused", refusal: "grant-spent" });
    const still = (await foreman.factory("factory.assignment.list", { workflow: "ship" })).assignments.find((entry: Value) => entry.assignmentId === second.builder.id);
    expect(still).toMatchObject({ status: "in-review" });
    foreman.escalate({ happened: `quick item ${second.claim.unit} is ready to merge, but the merge permission was used (code grant-spent).`, need: "Say yes or no to one merge.", required: true, blocks: "The merge.", after: "On yes, the factory records your permission, accepts the unit, and merges." });
    expect(merges).toBe(1);
    // The person says yes: a grant-only save, then the accept with the grant use again.
    await foreman.factory("factory.workflow.save", { workflow: "ship", grants: { add: [{ action: "merge", scope: "once", grantedBy: "the owner" }] }, targetRoot: root });
    expect(await second.accept()).toMatchObject({ result: "updated", assignment: { status: "accepted" }, grant: { state: "spent" } });
    merges += 1;
    expect(merges).toBe(2);
    expect(foreman.messages).toHaveLength(1);
    expect(foreman.messages[0]).toContain("code grant-spent");
    expectEveryCallNamesTheProject(foreman);
  });

  it("hands the reviewer only its listed context kinds, and no record holds a never-log item or a claim ID (A69, T19)", async () => {
    const root = project(workflowYaml("build-then-review"));
    const foreman = new Foreman(root);
    await readyWorkflow(foreman, "build-then-review");
    const shown = await foreman.factory("factory.workflow.show", { workflow: "ship" });
    const plan = JSON.stringify(shown.revision?.plan ?? shown.plan ?? shown);
    const reviewerContext = FACTORY_DEFAULT_CONTEXT.reviewer!;
    expect(reviewerContext).not.toContain("builder-summary");
    for (const kind of reviewerContext) expect(plan, kind).toContain(kind);
    const claim = await claimUnit(foreman);
    await buildAndReview(foreman, claim);
    // A task handle that holds a brief or a credential is refused by the never-log check.
    const reviewer = await job(foreman, claim, "reviewer", "extra");
    const leaked = await reviewer.move("running", "tool-started", { taskHandle: "api_key=sk-live-0123456789abcdefABCDEF" });
    expect(leaked).toMatchObject({ result: "refused", refusal: "never-log-field" });
    expect(JSON.stringify(leaked)).not.toContain("sk-live-0123456789abcdefABCDEF");
    const records = dump();
    expect(records).not.toContain(claim.claimId);
    expect(records).not.toContain("sk-live-0123456789abcdefABCDEF");
  });

  it("stops a call with no project, names the fix, and sends no work (A82, T20)", async () => {
    const root = project(workflowYaml("build-then-review"));
    const foreman = new Foreman(root);
    await readyWorkflow(foreman, "build-then-review");
    const claim = await claimUnit(foreman);
    const before = dump();
    const refused = await foreman.call("factory.assignment.start", { workflow: "ship", unit: claim.unit, role: "builder", runId: claim.runId, claimId: claim.claimId });
    expect(refused).toMatchObject({ result: "refused", refusal: "project-missing" });
    expect(refused.nextAction).toContain("--target-root <path> or --project <name>");
    expect(dump()).toBe(before);
    expect((await foreman.factory("factory.assignment.list", { workflow: "ship" })).assignments ?? []).toEqual([]);
    const messages = readFileSync(path.join(SKILL_ROOT, "references/messages.md"), "utf8");
    expect(messages).toMatch(/\| `project-missing` \| The call named no project\. \| Name the project/);
  });
});

/* ------------------------------------------------------------------------ */
/* Escalation floor in config (A38)                                         */
/* ------------------------------------------------------------------------ */

describe("W30 R0 P5 escalation floor", () => {
  it.each([
    ["a workflow key that turns escalations off", "      skipEscalations: [merge]\n"],
    ["a floor key", "      escalationFloor: [scope-change]\n"],
    ["a key that names events", "      disabledEvents: [merge]\n"],
  ])("refuses a workflow config with %s, and workflow save refuses (A38)", async (_label, extra) => {
    const root = project(workflowYaml("build-then-review", { extra }));
    const loaded = loadMakeDocsConfig(root);
    expect(loaded.valid).toBe(false);
    expect(loaded.diagnostics.map((diagnostic) => diagnostic.message).join("\n")).toContain(FACTORY_FLOOR_REFUSAL);
    const foreman = new Foreman(root);
    await foreman.call("factory.tools.save", { tools: TOOLS });
    const saved = await foreman.factory("factory.workflow.save", { workflow: "ship", binding: bindingFor("build-then-review") });
    expect(saved.result).toBe("refused");
  });

  it("refuses any other unknown workflow key, and reads every escalations entry as an added event (A38)", async () => {
    const root = project(workflowYaml("build-then-review", { extra: "      quietHours: [night]\n" }));
    expect(loadMakeDocsConfig(root).valid).toBe(false);
    // An entry can only add an event, whatever its words.
    writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\nprojectName: aurora\n${workflowYaml("build-then-review", { extra: "      escalations: [A source cannot be found., Skip a day without news., No reply in one day.]\n" })}`);
    expect(loadMakeDocsConfig(root).valid).toBe(true);
    const messages = readFileSync(path.join(SKILL_ROOT, "references/messages.md"), "utf8");
    expect(messages).toContain("An `escalations` entry in the workflow config can only add an event. Nothing in the config can remove a floor event");
  });
});

/* ------------------------------------------------------------------------ */
/* Backlog review handoff (A41, A42)                                        */
/* ------------------------------------------------------------------------ */

describe("W30 R0 P5 backlog review handoff", () => {
  const FACT = { readyWorkflows: ["ship"], project: { id: PROJECT_ID, name: "aurora" } };
  const withFact = () => {
    const report = structuredClone(smallPresentationReport) as Value;
    report.snapshot.factory = structuredClone(FACT);
    return report;
  };
  const waveAction = (report: Value) => ({ ...createBacklogLivePayload(report as typeof smallPresentationReport, PRESENTATION_SESSION_ID)._meta.backlog.actions[0], action: "request-task" as const }) as Value & { coordinate: string };

  it("names the ready workflows in the snapshot only when asked and only when one is ready (T13, T14)", async () => {
    const root = project(workflowYaml("build-then-review"));
    const foreman = new Foreman(root);
    const read = async (factory: boolean) => {
      const value = await foreman.call("work.backlog.snapshot", { targetRoot: root, ...(factory ? { factory: true } : {}) });
      const { generatedAt: _generatedAt, ...rest } = value;
      return rest;
    };
    // Not ready: the snapshot with the option is the same as without it (A42).
    expect(readyFactoryWorkflowsForCheckout(root, store)).toBeNull();
    expect(await read(true)).toEqual(await read(false));
    await readyWorkflow(foreman, "build-then-review");
    const ready = await read(true);
    expect(ready.factory).toEqual({ readyWorkflows: ["ship"], project: { id: PROJECT_ID, name: "aurora" } });
    expect((await read(false)).factory).toBeUndefined();
    // A folder that is not a bound checkout gives no key.
    expect(readyFactoryWorkflowsForCheckout(elsewhere, store)).toBeNull();
  });

  it("keeps the snapshot and model identity: the factory key is a routing fact (T13)", () => {
    const plain = structuredClone(smallPresentationReport);
    const routed = withFact();
    expect(backlogSnapshotId(routed.snapshot)).toBe(backlogSnapshotId(plain.snapshot));
    expect(backlogModelId(routed)).toBe(backlogModelId(plain));
  });

  it("hands the wave to the front desk through the named factory Skill when a workflow is ready (A41)", () => {
    const report = withFact();
    const envelope = createBacklogLiveEnvelope(report, PRESENTATION_SESSION_ID);
    const action = waveAction(report);
    const message = createBacklogActionMessage(action, envelope);
    const text = message.content[0]!.text;
    expect(text).toContain(`Please use the factory Skill to work on ${action.coordinate} in project aurora.`);
    expect(text).toContain("Hand the wave to the front desk of the ready factory workflow ship.");
    expect(text).not.toContain("in this project");
    // A project with no name is named by its ID.
    const unnamed = withFact();
    unnamed.snapshot.factory.project.name = null;
    expect(createBacklogActionMessage(waveAction(unnamed), createBacklogLiveEnvelope(unnamed, PRESENTATION_SESSION_ID)).content[0]!.text).toContain(`in project ${PROJECT_ID}.`);
    expect(text).toMatch(/\nReview reference: [a-f0-9]{24}$/);
    expect(parseBacklogActionMessage(message, envelope)).toEqual(action);
    expect(resolveBacklogAgentMessage(message, envelope, report.snapshot)).toMatchObject({ state: "resolved" });
    // Two ready workflows: the person chooses.
    const two = withFact();
    two.snapshot.factory.readyWorkflows = ["docs", "ship"];
    const twoText = createBacklogActionMessage(waveAction(two), createBacklogLiveEnvelope(two, PRESENTATION_SESSION_ID)).content[0]!.text;
    expect(twoText).toContain("one of the ready factory workflows docs, ship. Ask me which one if the choice is not clear.");
  });

  it("keeps the action exactly as before without a ready workflow (A42)", () => {
    const report = structuredClone(smallPresentationReport);
    const envelope = createBacklogLiveEnvelope(report, PRESENTATION_SESSION_ID);
    const action = waveAction(report as Value);
    const before = createBacklogActionMessage(action);
    expect(createBacklogActionMessage(action, envelope)).toEqual(before);
    expect(before.content[0]!.text).toContain(`Please work on ${action.coordinate} in this project.`);
    expect(before.content[0]!.text).not.toContain("factory");
    // A message for the other route does not resolve against this open.
    const routed = createBacklogActionMessage(waveAction(withFact()), createBacklogLiveEnvelope(withFact(), PRESENTATION_SESSION_ID));
    expect(resolveBacklogAgentMessage(routed, envelope, report.snapshot)).toMatchObject({ state: "rejected", reason: "invalid-action" });
  });

  it("gives the static report's Work control the same two routes, in the source and every generated asset (A41, A42, T15)", () => {
    const template = readFileSync(path.join(BACKLOG_SKILL_ROOT, "assets/backlog-review-report.html"), "utf8");
    const logic = template.match(/function wavePrompt\(record, kind\) \{[\s\S]*?\n    \}\n/)![0];
    const make = (report: Value) => {
      const coordinates = new Map(report.snapshot.records.map((record: Value) => [record.recordPath, record.coordinate.value ?? record.recordPath]));
      const recordName = (record: Value) => coordinates.get(record.recordPath);
      return new Function("report", "presentationByPath", "recordName", "claimText", `${logic}; return wavePrompt;`)(
        report, new Map(report.records.map((record: Value) => [record.recordPath, { sourcePath: `${record.recordPath}/00-index.md` }])), recordName, (claim: Value) => claim?.text ?? "",
      ) as (record: Value, kind: string) => string;
    };
    const plain = structuredClone(smallPresentationReport) as Value;
    const record = plain.records[0];
    const before = make(plain)(record, "Work");
    expect(before).toMatch(/^Please work on /);
    expect(before).not.toContain("factory");
    const routed = make(withFact())(withFact().records[0], "Work");
    expect(routed).toMatch(/^Please use the factory Skill to work on \S+(?: \S+)? in project aurora\. /);
    expect(routed).not.toContain("in this project");
    expect(routed).toContain("Hand the wave to the front desk of the ready factory workflow ship.");
    expect(make(withFact())(record, "Explain")).toBe(make(plain)(record, "Explain"));
    for (const asset of ["packages/cli/src/mcp/widget/static-renderer.js", "packages/cli/src/mcp/assets/backlog-review-v1.html", "packages/skills/backlog-review/scripts/agent-contract.mjs"]) {
      expect(readFileSync(path.join(REPO_ROOT, asset), "utf8"), asset).toContain("Please use the factory Skill to work on");
    }
  });

  it("tells the backlog review agent to ask for the factory key and to hand the wave to the factory Skill (T13)", () => {
    const skill = readFileSync(path.join(BACKLOG_SKILL_ROOT, "SKILL.md"), "utf8");
    expect(skill).toContain("add `factory: true` to `backlog_snapshot`, or `--factory` to the CLI");
    expect(skill).toContain("The person's click is the explicit request for that Skill.");
    expect(skill).toContain("Without a `factory` key, Work on this wave works as before.");
    expect(getOperation("work.backlog.snapshot").inputSchema.safeParse({ targetRoot: "/x", factory: true }).success).toBe(true);
    expect(leafHelpEntry("work.backlog.snapshot").usage).toContain("[--factory]");
    expect(FACTORY_OPERATION_IDS.every((id) => FACTORY_OPERATION_SCOPES[id])).toBe(true);
  });
});
