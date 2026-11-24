/**
 * W30 R0 P4: the `factory-setup` Skill (PRD 53 R-FACTORY-1 to -3, -8 to -16,
 * -21, -24, -35, -36, -43, -48, -55, -57, -60; PRD 08 R-SKILL-BUNDLE-3, -5,
 * -7; PRD 25 R-SKILL-RUNTIME-7).
 *
 * Twin checks: the Skill text is the agent form of the factory setup rules.
 * It must name the same CLI commands, MCP tools, reason codes, capability
 * IDs, record values, and contract rule IDs as the code and the contract,
 * and no name on one side only. Fixture runs then follow the Skill's own
 * steps, with the Skill's own example config and binding, through the real
 * operations to a saved `ready` workflow (A29, A30, A32, A66).
 *
 * Tool names are generic (`tool-a` to `tool-h`). Every run uses a temporary
 * MAKE_DOCS_HOME, so no test reaches the real Store.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

import { createExecutionContext } from "../src/operations/context";
import { FactoryWorkflowDefinitionSchema, parseFactoryConfigBlock } from "../src/operations/factory/config-block";
import { FACTORY_SHIPPED_TYPES } from "../src/operations/factory/live-plan";
import { FACTORY_OPERATION_SCOPES, type FactoryOperationId } from "../src/operations/factory/project-scope";
import * as FACTORY_RECORDS from "../src/operations/factory/records";
import {
  FACTORY_CAPABILITY_IDS,
  FACTORY_CONTEXT_KINDS,
  FACTORY_DEFAULT_CONTEXT,
  FACTORY_DRIFT_CODES,
  FACTORY_GRANT_SCOPES,
  FACTORY_PROOF_RESULTS,
  FACTORY_READINESS_STATES,
  FACTORY_REFUSAL_CODES,
  FACTORY_STANDARD_ROLES,
  FACTORY_TOOL_KINDS,
  FACTORY_TOOL_STATES,
  FACTORY_WAKE_METHODS,
} from "../src/operations/factory/records";
import { leafHelpEntry } from "../src/operations/leaf-help-table";
import { getOperation, invokeOperation } from "../src/operations/registry";
import { platform } from "../src/platform";
import { getInstallationCheckoutId } from "../src/store/installation-state";
import { FACTORY_STORE_SERVICE_REFUSALS } from "../src/store/factory-store";
import { PACKAGE_ROOT } from "../src/utils";
import { cleanupTempDir, createTempDir } from "./helpers";

const REPO_ROOT = path.resolve(PACKAGE_ROOT, "..", "..");
const SKILL_ROOT = path.resolve(PACKAGE_ROOT, "../skills/factory-setup");
const CONTRACT = readFileSync(path.join(REPO_ROOT, ".make-docs/system/contracts/factory-contract.md"), "utf8");
const REGISTRY = JSON.parse(readFileSync(path.join(PACKAGE_ROOT, "skill-registry.json"), "utf8")) as {
  skills: Array<{ name: string; description: string; purposes: string[]; assets: Array<{ source: string; installPath: string }> }>;
};

/* ------------------------------------------------------------------------ */
/* Skill text                                                               */
/* ------------------------------------------------------------------------ */

function skillFiles(root = SKILL_ROOT): string[] {
  const files: string[] = [];
  for (const name of readdirSync(root).sort()) {
    const full = path.join(root, name);
    if (statSync(full).isDirectory()) files.push(...skillFiles(full));
    else files.push(full);
  }
  return files;
}

const FILES = skillFiles();
const TEXTS = FILES.map((file) => ({ file: path.relative(SKILL_ROOT, file), text: readFileSync(file, "utf8") }));
const ALL_TEXT = TEXTS.map((entry) => entry.text).join("\n");
const SKILL_MD = readFileSync(path.join(SKILL_ROOT, "SKILL.md"), "utf8");
const reference = (name: string) => readFileSync(path.join(SKILL_ROOT, "references", name), "utf8");

/** Every inline code span, such as `` `tool-missing` ``, outside fenced blocks. */
function inlineCode(text: string): string[] {
  const withoutFences = text.replace(/```[\s\S]*?```/g, "");
  return [...withoutFences.matchAll(/`([^`\n]+)`/g)].map((match) => match[1]!);
}

/** The lines of every fenced code block. */
function fencedLines(text: string): string[] {
  return [...text.matchAll(/```[a-z]*\n([\s\S]*?)```/g)].flatMap((match) => match[1]!.split("\n"));
}

function fencedBlock(text: string, language: string): string {
  const match = new RegExp("```" + language + "\\n([\\s\\S]*?)```").exec(text);
  if (!match) throw new Error(`No ${language} block.`);
  return match[1]!;
}

/** The rule IDs of the contract's Rule Catalog, with their Check column. */
function contractRuleRows(): Map<string, string> {
  const section = CONTRACT.slice(CONTRACT.indexOf("## Rule Catalog"));
  const rows = new Map<string, string>();
  for (const match of section.matchAll(/^\| `([a-z0-9-]+)` \|.*\| ([^|]*) \|$/gm)) rows.set(match[1]!, match[2]!);
  return rows;
}
const RULES = contractRuleRows();

/** The project-scoped factory operations that the setup Skill uses, and the machine one. */
const SETUP_OPERATIONS: readonly FactoryOperationId[] = [
  "factory.workflow.list",
  "factory.workflow.show",
  "factory.tools.list",
  "factory.tools.save",
  "factory.workflow.save",
  "factory.proof.save",
  "factory.restore",
  "factory.status",
];
const cliOf = (id: string) => `make-docs ${id.replaceAll(".", " ")}`;
const mcpOf = (id: string) => id.replaceAll(".", "_");

/** Refusal and Store outcome codes that a setup step can meet, and that the Skill must explain. */
const SETUP_REFUSALS = [
  "project-missing",
  "project-not-found",
  "project-mismatch",
  "project-checkout-unclear",
  "project-not-identified",
  "never-log-field",
  "unknown-capability",
  "type-version-mismatch",
  "plan-digest-mismatch",
  "not-ready",
  "version-conflict",
  "invalid-record",
];
/** The Store outcomes that a factory operation can give. A factory call that names a project gives `store-denied`, never `store-not-configured`. */
const STORE_OUTCOMES = ["store-unavailable", "store-denied", "store-unsafe"];

/** Rules that the setup Skill applies: each contract row whose check names W30 R0 P4, and the setup rows that the CLI also checks. */
const SETUP_RULES = [
  ...[...RULES].filter(([, check]) => /W30 R0 P4/.test(check)).map(([id]) => id),
  "tool-agnostic",
  "opt-in",
  "needs-cli-and-store",
  "match-by-capability",
  "unproved-stays-visible",
  "proof-record",
  "reprove-on-version-change",
  "machine-records-shared",
  "manual-steps-listed",
  "ready-needs-proof",
  "plan-generated",
  "type-version",
  "role-context",
  "grant-scope",
  "grant-written",
  "grants-not-committed",
  "never-log",
  "writes-name-project",
  "machine-commands-no-project",
  "results-name-project",
  "custom-role-context",
  "no-silent-replace",
];

/** Other inline names that the Skill may use: config values, examples, and the CLI's own name. */
const OTHER_NAMES = ["make-docs", "wait-in-session", "messaging-tool", "factory-setup", "tool-a"];

describe("W30 R0 P4 factory-setup Skill bundle", () => {
  it("ships exactly the files that the registry declares, explicit-only and off by default (T1, R-FACTORY-48)", () => {
    const entry = REGISTRY.skills.find((skill) => skill.name === "factory-setup");
    expect(entry, "registry entry").toBeDefined();
    expect(entry!.purposes).toEqual(["workflow-execution"]);
    expect(entry!.description).toMatch(/Explicit use only\.$/);
    const declared = ["SKILL.md", ...entry!.assets.map((asset) => asset.source)].sort();
    expect(FILES.map((file) => path.relative(SKILL_ROOT, file).split(path.sep).join("/")).sort()).toEqual(declared);
    for (const asset of entry!.assets) expect(asset.installPath).toBe(asset.source);
    const metadata = parseYaml(readFileSync(path.join(SKILL_ROOT, "agents/openai.yaml"), "utf8")) as { policy: { allow_implicit_invocation: boolean } };
    expect(metadata.policy.allow_implicit_invocation).toBe(false);
    const front = parseYaml(SKILL_MD.split("---")[1]!) as { name: string; description: string };
    expect(front.name).toBe("factory-setup");
    expect(front.description).toContain("Use only when the user explicitly requests $factory-setup");
  });

  it("ships no Python and no script (R-SKILL-BUNDLE-7)", () => {
    expect(existsSync(path.join(SKILL_ROOT, "scripts"))).toBe(false);
    for (const { file, text } of TEXTS) {
      expect(file).not.toMatch(/\.pyc?$|__pycache__/);
      expect(text, file).not.toMatch(/\.py\b/);
      expect(text, file).not.toContain("scripts/");
    }
  });

  it("names no particular app, harness, provider, multiplexer, scheduler, or messaging tool (A28, R-FACTORY-1)", () => {
    // This list can never be complete. It catches common names only. W30 R0 P6 T8 still searches the shipped
    // files for tool names. Names that are also common English words (such as a word for a terminal window,
    // a chat network, or a pet) are left out, so they do not fail plain text.
    const names = new RegExp(
      "\\b(" +
        [
          // Agent harnesses, coding agents, and model providers.
          "claude", "codex", "copilot", "cursor", "gemini", "openai", "anthropic", "chatgpt", "gpt-?\\d", "ollama", "mistral", "llama",
          "deepseek", "qwen", "grok", "xai", "cohere", "perplexity", "bedrock", "vertex ai", "azure", "aws", "huggingface", "hugging face",
          "replit", "devin", "cline", "roo code", "sourcegraph", "cody", "tabnine", "kiro", "opencode", "aider", "windsurf", "jules", "junie",
          "github", "gitlab", "vscode", "vs code", "jetbrains", "t3", "jcodemunch", "jdocmunch", "jdatamunch",
          "spawn_agent", "delegate_task", "subagent_type",
          // Terminals and terminal multiplexers.
          "tmux", "zellij", "byobu", "wezterm", "alacritty", "iterm2?", "ghostty", "konsole", "tilix", "conemu", "windows terminal", "tabby",
          // Schedulers.
          "cron", "crontab", "anacron", "launchd", "launchctl", "systemd", "task scheduler", "airflow",
          // Messaging and notification tools.
          "slack", "discord", "telegram", "whatsapp", "imessage", "twilio", "ntfy", "pushover", "pushbullet", "gotify", "apprise",
          "mattermost", "rocket\\.chat", "wechat", "viber", "skype", "zoom", "webex", "microsoft teams", "google chat", "hangouts",
          "messenger", "pagerduty", "opsgenie", "gmail", "outlook", "zapier", "ifttt", "n8n",
        ].join("|") +
        ")\\b",
      "i",
    );
    for (const { file, text } of TEXTS) expect(text, file).not.toMatch(names);
    expect(REGISTRY.skills.find((skill) => skill.name === "factory-setup")!.description).not.toMatch(names);
  });

  it("never asks for an install, a sign-in, a payment, or an authentication change on the person's behalf (T13)", () => {
    expect(SKILL_MD).toContain("Never install, sign in, pay, or change authentication for the person.");
    expect(reference("wire-and-prove.md")).toContain("Never fix a sign-in, a permission, a payment, or an install yourself.");
    expect(reference("summary.md")).toContain("Setup never does one for the person.");
  });

  it("shows at most two options in one question, and names where the other choices are (T5)", () => {
    expect(SKILL_MD).toContain("Show at most two options: the recommendation and the one best other choice.");
    const interview = reference("interview.md");
    expect(interview).toContain("Show at most two options in one question: your recommendation and the one best other choice");
    // Proof A finding 6: a dialog that can hold several questions still shows one.
    expect(interview).toContain("Ask one decision at a time. When a choice control can show more than one question in one dialog, still show one question in each dialog.");
    for (const section of ["Workflow Types section", "Waking section", "Grants section"]) expect(interview, section).toContain(section);
    expect(reference("interview.md").match(/Show two options/g)?.length ?? 0).toBeGreaterThanOrEqual(5);
  });

  it("reads the saved tools with factory tools list, and never uses the tools copy as a source (T3, R-FACTORY-69)", () => {
    const find = reference("find-and-read.md");
    expect(find).toContain("Run `factory_tools_list`, or `make-docs factory tools list`. This command acts on this machine and takes no project.");
    expect(find).toContain("Use the record version that the read shows as the `expectedVersion`.");
    expect(find).toContain("Never use the `.make-docs/factory/tools.md` copy as a source.");
    expect(find).toContain("never take an `expectedVersion` from it");
    expect(find).not.toMatch(/hint/);
    expect(reference("interview.md")).not.toMatch(/not built yet|stops and asks/);
    expect(reference("wire-and-prove.md")).toContain("use the record version (`version`) that `factory tools list` shows for it");
    expect(reference("wire-and-prove.md")).toContain("use the version that the refusal names (`details.currentVersion`)");
  });

  it("names the never-log list (R-FACTORY-14, never-log)", () => {
    for (const item of ["file contents", "prompts or briefs", "environment values", "transcripts", "credentials"]) expect(SKILL_MD).toContain(item);
  });
});

describe("W30 R0 P4 factory-setup twin of the CLI", () => {
  it("names each setup command with its MCP tool first, then the CLI command, then a labeled manual path (R-SKILL-RUNTIME-7)", () => {
    const table = SKILL_MD.slice(SKILL_MD.indexOf("## How to Call Make Docs"), SKILL_MD.indexOf("## Step 0"));
    for (const id of SETUP_OPERATIONS) {
      const operation = getOperation(id);
      expect(operation.mcp?.profiles, id).toContain("factory");
      const row = table.split("\n").find((line) => line.includes(`\`${mcpOf(id)}\``));
      expect(row, id).toBeDefined();
      expect(row!.indexOf(`\`${mcpOf(id)}\``), id).toBeLessThan(row!.indexOf(`\`${cliOf(id)}\``));
      expect(row!, id).toContain(FACTORY_OPERATION_SCOPES[id].scope === "machine" ? "Machine" : "Project");
      expect(row!, id).toContain(FACTORY_OPERATION_SCOPES[id].kind === "read" ? "read" : "write");
    }
    expect(table.indexOf("Manual path:")).toBeGreaterThan(table.lastIndexOf(cliOf("factory.status")));
  });

  it("names only factory commands and MCP tools that exist, and never an assignment command (setup starts no work)", () => {
    const commands = new Set([...ALL_TEXT.matchAll(/make-docs factory ([a-z]+(?: [a-z]+)?)/g)].map((match) => match[1]!));
    for (const command of commands) {
      const words = command.split(" ");
      const id = words.length === 2 && ["save", "show", "list", "start"].includes(words[1]!) ? `factory.${words.join(".")}` : `factory.${words[0]}`;
      expect(SETUP_OPERATIONS, command).toContain(id);
    }
    const tools = new Set([...ALL_TEXT.matchAll(/\bfactory_[a-z_]+\b/g)].map((match) => match[0]));
    expect([...tools].sort()).toEqual(SETUP_OPERATIONS.map(mcpOf).sort());
    expect(ALL_TEXT).not.toMatch(/factory assignment|factory_assignment/);
  });

  it("uses only flags that each command's own help names, and names the project in every project write (writes-name-project)", () => {
    const lines = [...fencedLines(ALL_TEXT), ...inlineCode(ALL_TEXT)].map((line) => line.trim()).filter((line) => line.startsWith("make-docs factory ") && line.includes("--"));
    expect(lines.length).toBeGreaterThan(5);
    for (const line of lines) {
      const id = SETUP_OPERATIONS.find((candidate) => line.startsWith(`${cliOf(candidate)} `) || line === cliOf(candidate));
      expect(id, line).toBeDefined();
      const help = leafHelpEntry(id!);
      const known = new Set([...(help.options ?? []).map((option) => option.name.split(" ")[0]!), ...help.usage.matchAll(/--[a-z-]+/g)].map((flag) => (typeof flag === "string" ? flag : flag[0])));
      for (const flag of line.matchAll(/--[a-z-]+/g)) expect(known, `${line}: ${flag[0]}`).toContain(flag[0]);
      const scope = FACTORY_OPERATION_SCOPES[id!];
      if (scope.scope === "machine") expect(line, line).not.toMatch(/--target-root|--project/);
      else if (scope.kind === "write") expect(line, line).toMatch(/--target-root|--project/);
    }
  });

  it("names every drift code and every refusal and Store outcome that a setup step can meet", () => {
    const named = new Set(inlineCode(ALL_TEXT));
    for (const code of [...FACTORY_DRIFT_CODES, ...SETUP_REFUSALS, ...STORE_OUTCOMES]) expect(named, code).toContain(code);
    // Each refusal named in the Skill is a code that the CLI can give.
    for (const code of SETUP_REFUSALS) expect([...FACTORY_REFUSAL_CODES, ...FACTORY_STORE_SERVICE_REFUSALS], code).toContain(code);
  });

  it("names every capability ID, record value, and default context list exactly as the code holds them", () => {
    const named = new Set(inlineCode(ALL_TEXT));
    for (const value of [
      ...FACTORY_CAPABILITY_IDS,
      ...FACTORY_CONTEXT_KINDS,
      ...FACTORY_TOOL_KINDS,
      ...FACTORY_TOOL_STATES,
      ...FACTORY_PROOF_RESULTS,
      ...FACTORY_GRANT_SCOPES,
      ...FACTORY_WAKE_METHODS,
      ...FACTORY_READINESS_STATES.filter((state) => state !== "drifted"),
      ...FACTORY_SHIPPED_TYPES,
    ]) {
      expect(named, value).toContain(value);
    }
    // The proof table has one row for each catalog capability, in catalog order.
    const proofRows = [...reference("wire-and-prove.md").matchAll(/^\| `([a-z-]+)` \| /gm)].map((match) => match[1]);
    expect(proofRows).toEqual([...FACTORY_CAPABILITY_IDS]);
    const list = (items: readonly string[]) => `${items.slice(0, -1).map((item) => `\`${item}\``).join(", ")}, and \`${items.at(-1)}\``;
    expect(reference("interview.md")).toContain(`a builder gets ${list(FACTORY_DEFAULT_CONTEXT.builder!)}`);
    expect(reference("interview.md")).toContain(`A reviewer gets ${list(FACTORY_DEFAULT_CONTEXT.reviewer!)}, and never \`builder-summary\``);
  });

  it("names each setup rule of the contract's Rule Catalog, and no rule ID or code that the code and contract do not have", () => {
    const named = new Set(inlineCode(ALL_TEXT));
    expect(SETUP_RULES.filter((id) => !RULES.has(id))).toEqual([]);
    expect(SETUP_RULES.filter((id) => !named.has(id))).toEqual([]);
    const known = new Set<string>([
      ...RULES.keys(),
      ...FACTORY_DRIFT_CODES,
      ...FACTORY_REFUSAL_CODES,
      ...FACTORY_STORE_SERVICE_REFUSALS,
      ...STORE_OUTCOMES,
      "store-not-configured",
      ...FACTORY_CAPABILITY_IDS,
      ...FACTORY_CONTEXT_KINDS,
      ...FACTORY_TOOL_KINDS,
      ...FACTORY_STANDARD_ROLES,
      ...FACTORY_SHIPPED_TYPES,
      ...OTHER_NAMES,
    ]);
    const kebab = [...named].filter((token) => /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/.test(token));
    expect(kebab.filter((token) => !known.has(token)).sort()).toEqual([]);
    // One-word values and field paths are checked against real results in the fixture runs below.
  });

  it("keeps its example config entry valid under the config check, with no grant, tool ID, or path (grants-not-committed)", () => {
    const block = parseYaml(fencedBlock(reference("save-and-test.md"), "yaml")) as { factory: unknown };
    const parsed = parseFactoryConfigBlock(block.factory);
    const workflow = parsed.workflows.main!;
    expect(workflow.type).toBe("build-then-review");
    expect(Object.keys(workflow.roles).sort()).toEqual([...FACTORY_STANDARD_ROLES].sort());
    expect(JSON.stringify(block)).not.toMatch(/grant|tool-[a-z]|\//);
  });
});

/* ------------------------------------------------------------------------ */
/* Fixture runs                                                             */
/* ------------------------------------------------------------------------ */

type Value = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const NOW = new Date("2042-06-15T12:00:00.000Z");
const PROJECT_ID = "factory-p4-project";
const CONFIG = parseYaml(fencedBlock(reference("save-and-test.md"), "yaml")) as { factory: { workflows: { main: Value } } };
const SMALLEST_BINDING = JSON.parse(fencedBlock(reference("wire-and-prove.md"), "json")) as Value;
const FIVE = ["read-write-files", "run-commands", "launch-agent", "wait-for-agent", "read-agent-result"];

let temp: string;
let store: string;

beforeEach(() => {
  temp = platform.describePath(createTempDir("make-docs-w30-p4-")).canonicalPath;
  store = path.join(temp, "store");
  vi.stubEnv("MAKE_DOCS_HOME", store);
});

afterEach(() => {
  vi.unstubAllEnvs();
  cleanupTempDir(temp);
});

/** A project checkout whose config has the given factory block. */
function project(factory: unknown): string {
  const root = path.join(temp, "aurora");
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\nprojectName: aurora\n${stringifyYaml({ factory })}`);
  const canonical = platform.describePath(root).canonicalPath;
  getInstallationCheckoutId(canonical, store);
  return canonical;
}

/** One tool, as Step 4 records it: a proof for each capability, under the version the tool reports. */
function tool(toolId: string, capabilities: string[], version = "1.0", expectedVersion: number | null = null, proofVersion = version) {
  return {
    toolId,
    kind: "agent-harness",
    label: `Tool ${toolId.slice(5).toUpperCase()}`,
    state: "available",
    reportedVersion: version,
    capabilities,
    proofs: capabilities.map((capabilityId) => ({
      capabilityId,
      method: "Ran the catalog proof with a scratch file.",
      toolVersion: proofVersion,
      provedAt: NOW.toISOString(),
      result: "proved",
      notCovered: capabilityId === "read-write-files" ? ["files outside the project"] : [],
    })),
    expectedVersion,
  };
}

async function call(id: string, input: Record<string, unknown>, cwd = temp): Promise<Value> {
  const invocation = await invokeOperation(id, input, createExecutionContext({ surface: "test", writesAllowed: true, storeRoot: store, cwd, now: () => NOW.toISOString() }));
  return invocation.value as Value;
}

/** Step 5: save the workflow, run the test task under its revision, and save the proof with the same digest. */
async function saveAndProve(root: string, binding: Value, options: { expectedVersion?: number | null; grants?: Value } = {}) {
  const saved = await call("factory.workflow.save", { targetRoot: root, workflow: "main", binding, expectedVersion: options.expectedVersion ?? null, ...(options.grants ? { grants: options.grants } : {}) });
  expect(saved.result, JSON.stringify(saved)).toBe("saved");
  expect(saved.readiness).toBe("wired");
  const digest = saved.revision.planDigest as string;
  // The proof's expected version is the last result with the same outcome, from workflow show (save and test, step 5).
  const shown = await call("factory.workflow.show", { targetRoot: root, workflow: "main" });
  const proof = await call("factory.proof.save", {
    expectedVersion: shown.proofs.passed?.version ?? null,
    targetRoot: root,
    workflow: "main",
    outcome: "passed",
    testTask: "Write the code word in a new scratch file and review it.",
    planDigest: digest,
    path: Object.entries(binding.roles as Record<string, string>).map(([role, id]) => `${role}: ${id}`),
    manualSteps: [],
  });
  expect(proof.result, JSON.stringify(proof)).toBe("saved");
  expect(proof.readiness).toBe("ready");
  return { saved, digest, proof };
}

/** The facts of the closing summary, read from the Store as the summary reference says (A31, A64). */
function summaryFacts(shown: Value) {
  const plan = shown.revision.plan as Value;
  return {
    readiness: shown.live.readiness,
    roles: Object.fromEntries(Object.entries(plan.roleTools as Record<string, Value>).map(([role, facts]) => [role, {
      tool: facts.toolId,
      version: facts.reportedVersion,
      results: [...new Set(Object.values(facts.capabilities as Record<string, Value>).map((capability) => capability.result))],
    }])),
    wake: shown.binding.wakeMethod,
    channel: plan.definition.humanChannel,
    knownLosses: shown.binding.knownLosses,
    revision: shown.revision.number,
    digest: shown.revision.planDigest,
  };
}

/* ------------------------------------------------------------------------ */
/* One-word values and field paths                                          */
/* ------------------------------------------------------------------------ */

type ZodLike = { _zod: { def: Record<string, any> } }; // eslint-disable-line @typescript-eslint/no-explicit-any

/** The schema one step inside a wrapper (optional, default, pipe, and so on), or the schema itself. */
function unwrapSchema(schema: ZodLike): ZodLike {
  let current = schema;
  for (;;) {
    const def = current._zod.def;
    if (def.innerType) current = def.innerType;
    else if (def.type === "pipe") current = def.in;
    else if (def.type === "lazy") current = def.getter();
    else return current;
  }
}

/** Every key that a schema accepts, at any depth. */
function schemaKeys(schema: ZodLike, into = new Set<string>()): Set<string> {
  const def = unwrapSchema(schema)._zod.def;
  if (def.type === "object") for (const [key, child] of Object.entries(def.shape as Record<string, ZodLike>)) { into.add(key); schemaKeys(child, into); }
  else if (def.type === "array") schemaKeys(def.element, into);
  else if (def.type === "record") schemaKeys(def.valueType, into);
  return into;
}

/** True when a dotted path names a field that the schema accepts. A record accepts any key. */
function schemaHasPath(schema: ZodLike, segments: readonly string[]): boolean {
  let current: ZodLike = schema;
  for (const segment of segments) {
    const def = unwrapSchema(current)._zod.def;
    if (def.type === "object" && segment in def.shape) current = def.shape[segment];
    else if (def.type === "record") current = def.valueType;
    else if (def.type === "array") return schemaHasPath(def.element, [segment]);
    else return false;
  }
  return true;
}

function valueKeys(value: unknown, into = new Set<string>()): Set<string> {
  if (Array.isArray(value)) for (const item of value) valueKeys(item, into);
  else if (value && typeof value === "object") for (const [key, child] of Object.entries(value)) { into.add(key); valueKeys(child, into); }
  return into;
}

function valueHasPath(value: unknown, segments: readonly string[]): boolean {
  let current = value as Value | null | undefined;
  for (const segment of segments) {
    if (!current || typeof current !== "object" || !(segment in current)) return false;
    current = current[segment];
  }
  return true;
}

/**
 * Words that the Skill uses in inline code that are not code values or field names: the config root key,
 * the two working-copy method examples and the default workflow name that the operations' input help and
 * the Skill give, JSON `null`, and the grant actions that the factory contract names.
 */
const OTHER_WORDS = ["factory", "none", "worktree", "main", "null", "merge", "deploy", "publish", "spend"];

/**
 * The one-word values and the field paths in inline code that neither the code nor a real result knows.
 * Known: every string value of the factory record lists, every key of a setup operation's input schema
 * and of the config entry schema, and every key of the real results; a path must resolve in one of them.
 */
function unknownWordsAndPaths(texts: readonly string[], results: readonly unknown[]): string[] {
  const inputs = SETUP_OPERATIONS.map((id) => getOperation(id).inputSchema as unknown as ZodLike);
  const config = FactoryWorkflowDefinitionSchema as unknown as ZodLike;
  const words = new Set<string>(OTHER_WORDS);
  for (const value of Object.values(FACTORY_RECORDS)) if (Array.isArray(value)) for (const item of value) if (typeof item === "string") words.add(item);
  for (const schema of [...inputs, config]) schemaKeys(schema, words);
  for (const result of results) valueKeys(result, words);
  const tokens = new Set(texts.flatMap((text) => inlineCode(text)));
  const unknown: string[] = [];
  for (const token of tokens) {
    if (/^[a-z][a-zA-Z]*$/.test(token)) {
      if (!words.has(token)) unknown.push(token);
    } else if (/^[a-z][a-zA-Z]*(?:\.[a-z][a-zA-Z]*)+$/.test(token)) {
      const segments = token.split(".");
      const known = results.some((result) => valueHasPath(result, segments)) || [...inputs, config].some((schema) => schemaHasPath(schema, segments));
      if (!known) unknown.push(token);
    }
  }
  return unknown.sort();
}

describe("W30 R0 P4 factory-setup fixture runs", () => {
  it("stops and names the Store and its fix when the Store is missing, and saves nothing (A26)", async () => {
    const absent = path.join(temp, "no-store");
    vi.stubEnv("MAKE_DOCS_HOME", absent);
    const error = (await invokeOperation("factory.tools.save", { tools: [tool("tool-a", FIVE)] }, createExecutionContext({ surface: "test", writesAllowed: true, storeRoot: absent, cwd: temp })).catch((caught: unknown) => caught)) as { code: string; reason: string };
    expect(error.code).toBe("store-unavailable");
    expect(error.reason).toContain("make-docs setup");
    expect(existsSync(absent)).toBe(false);
    const step0 = SKILL_MD.slice(SKILL_MD.indexOf("## Step 0"), SKILL_MD.indexOf("## Step 1"));
    expect(step0).toContain("| `store-unavailable` | A usable Make Docs Store | Run `make-docs setup` in the project. |");
    expect(step0).toContain("| No MCP tool and no `make-docs` command | The Make Docs CLI |");
    expect(step0).toContain("Save nothing.");
  });

  it("refuses a project write that names no project, as the Skill says, and changes nothing (writes-name-project)", async () => {
    const root = project(CONFIG.factory);
    expect((await call("factory.tools.save", { tools: [tool("tool-a", FIVE)] })).result).toBe("saved");
    const refused = await call("factory.workflow.save", { workflow: "main", binding: SMALLEST_BINDING }, root);
    expect(refused.refusal).toBe("project-missing");
    // The config entry is there, but nothing was saved: no plan revision, and the workflow stays a draft.
    const listed = await call("factory.workflow.list", { targetRoot: root });
    expect(listed.workflows.map((entry: Value) => [entry.workflowName, entry.readiness, entry.latestRevision])).toEqual([["main", "draft", null]]);
  });

  it("reaches a saved ready workflow for the smallest setup, with the Skill's own config and binding (A29, A66)", async () => {
    const root = project(CONFIG.factory);
    expect((await call("factory.tools.save", { tools: [tool("tool-a", FIVE)] })).result).toBe("saved");
    const { saved, digest } = await saveAndProve(root, SMALLEST_BINDING);
    expect(saved.revision.number).toBe(1);
    const shown = await call("factory.workflow.show", { targetRoot: root, workflow: "main" });
    expect(shown.live.readiness).toBe("ready");
    expect(shown.revision.planDigest).toBe(digest);
    expect(shown.revision.isReady).toBe(true);
    const facts = summaryFacts(shown);
    expect(facts.roles).toEqual(Object.fromEntries(["builder", "foreman", "front-desk", "reviewer"].map((role) => [role, { tool: "tool-a", version: "1.0", results: ["proved"] }])));
    expect(facts).toMatchObject({ wake: "person", channel: "wait-in-session", revision: 1 });
    expect(facts.knownLosses).toEqual(["No tool can wake on its own, so the factory runs only while a session is open."]);
  });

  it("reaches a saved ready workflow for a multi-tool setup, with the same roles on tools with other names, and lists the grant beside the plan (A30, A65)", async () => {
    const workflow = structuredClone(CONFIG.factory.workflows.main);
    workflow.humanChannel = "messaging-tool";
    workflow.roles["front-desk"].capabilities = ["message-person", "receive-answer"];
    workflow.roles.builder.capabilities = ["read-write-files", "run-commands", "edit-code"];
    const root = project({ workflows: { main: workflow } });
    const tools = [
      tool("tool-c", ["message-person", "receive-answer"], "3.2"),
      tool("tool-d", FIVE, "2.0"),
      tool("tool-e", ["read-write-files", "run-commands", "edit-code"], "5.1"),
      tool("tool-f", ["read-write-files", "run-commands"], "1.4"),
      tool("tool-g", ["wake-on-schedule"], "0.9"),
    ];
    expect((await call("factory.tools.save", { tools })).result).toBe("saved");
    const binding = {
      roles: { "front-desk": "tool-c", foreman: "tool-d", builder: "tool-e", reviewer: "tool-f" },
      worktreeMethod: "worktree",
      channelRef: "person-channel",
      wakeMethod: "schedule",
      wakeRef: "every-10-minutes",
      knownLosses: ["Tool G can wake only on a schedule, not when an agent finishes."],
    };
    const grants = { add: [{ action: "merge", scope: "once", runId: null, expiresAt: "2042-07-01T00:00:00.000Z", grantedBy: "the person" }], revoke: [] };
    await saveAndProve(root, binding, { grants });
    const shown = await call("factory.workflow.show", { targetRoot: root, workflow: "main" });
    const facts = summaryFacts(shown);
    expect(facts.readiness).toBe("ready");
    expect(Object.keys(facts.roles).sort()).toEqual(Object.keys(SMALLEST_BINDING.roles).sort());
    expect(facts.roles).toMatchObject({ "front-desk": { tool: "tool-c", version: "3.2" }, foreman: { tool: "tool-d" }, builder: { tool: "tool-e" }, reviewer: { tool: "tool-f", version: "1.4", results: ["proved"] } });
    expect(facts).toMatchObject({ wake: "schedule", channel: "messaging-tool" });
    expect(shown.grants).toHaveLength(1);
    expect(shown.grants[0]).toMatchObject({ action: "merge", scope: "once", state: "usable" });
    expect(JSON.stringify(shown.revision.plan)).not.toContain("merge");
    expect(readFileSync(path.join(root, ".make-docs/config.yaml"), "utf8")).not.toContain("merge");
  });

  it("on a rerun with one changed binding, shows the change, proves that boundary again, and reaches ready under a new revision (A32, T12)", async () => {
    const root = project(CONFIG.factory);
    expect((await call("factory.tools.save", { tools: [tool("tool-a", FIVE), tool("tool-b", ["read-write-files", "run-commands"])] })).result).toBe("saved");
    const first = await saveAndProve(root, SMALLEST_BINDING);
    // Rerun Step 1: read the saved workflow.
    const before = await call("factory.workflow.show", { targetRoot: root, workflow: "main" });
    const next = { ...SMALLEST_BINDING, roles: { ...SMALLEST_BINDING.roles, reviewer: "tool-h" } };
    // Rerun Step 4: show what changed, old and new.
    const changed = Object.keys(next.roles).filter((role) => before.binding.roles[role] !== next.roles[role]).map((role) => `${role}: ${before.binding.roles[role]} -> ${next.roles[role]}`);
    expect(changed).toEqual(["reviewer: tool-a -> tool-h"]);
    // Without a proof for the new boundary, the plan is not wired.
    const unproved = await call("factory.workflow.save", { targetRoot: root, workflow: "main", binding: next, expectedVersion: before.binding.version });
    expect(unproved.result).toBe("saved");
    expect(unproved.readiness).toBe("draft");
    // Rerun Step 5: prove the changed boundary again, then save, test, and prove.
    expect((await call("factory.tools.save", { tools: [tool("tool-h", ["read-write-files", "run-commands"])] })).result).toBe("saved");
    const again = await call("factory.workflow.show", { targetRoot: root, workflow: "main" });
    const stale = await call("factory.proof.save", { targetRoot: root, workflow: "main", outcome: "passed", testTask: "Old digest.", planDigest: first.digest, path: ["reviewer: tool-a"], manualSteps: [] });
    expect(stale.refusal).toBe("plan-digest-mismatch");
    const second = await saveAndProve(root, next, { expectedVersion: again.binding.version });
    expect(second.digest).not.toBe(first.digest);
    const shown = await call("factory.workflow.show", { targetRoot: root, workflow: "main" });
    expect(shown.live.readiness).toBe("ready");
    expect(shown.revision.number).toBeGreaterThan(1);
    expect(summaryFacts(shown).roles.reviewer).toEqual({ tool: "tool-h", version: "1.0", results: ["proved"] });
    expect((await call("factory.workflow.list", { targetRoot: root })).workflows).toHaveLength(1);
  });

  it("after a new tool version, drifts with tool-version-changed, and reaches ready again after the proofs, a save, and a new test task (T14)", async () => {
    const root = project(CONFIG.factory);
    const saved = await call("factory.tools.save", { tools: [tool("tool-a", FIVE)] });
    await saveAndProve(root, SMALLEST_BINDING);
    const recordVersion = saved.tools[0].version as number;
    expect((await call("factory.tools.save", { tools: [tool("tool-a", FIVE, "1.1", recordVersion, "1.0")] })).result).toBe("saved");
    const drifted = await call("factory.workflow.show", { targetRoot: root, workflow: "main" });
    expect(drifted.live.readiness).toBe("drifted");
    expect(drifted.live.drift.map((entry: Value) => entry.code)).toContain("tool-version-changed");
    expect((await call("factory.tools.save", { tools: [tool("tool-a", FIVE, "1.1", recordVersion + 1)] })).result).toBe("saved");
    await saveAndProve(root, SMALLEST_BINDING, { expectedVersion: drifted.binding.version });
    const shown = await call("factory.workflow.show", { targetRoot: root, workflow: "main" });
    expect(shown.live.readiness).toBe("ready");
    expect(summaryFacts(shown).roles.foreman).toEqual({ tool: "tool-a", version: "1.1", results: ["proved"] });
  });

  it("names only one-word values and field paths that the code or a real result knows (twin check)", async () => {
    const root = project(CONFIG.factory);
    const tools = await call("factory.tools.save", { tools: [tool("tool-a", FIVE)] });
    const conflict = await call("factory.tools.save", { tools: [tool("tool-a", FIVE)] });
    expect(conflict.refusal).toBe("version-conflict");
    const saved = await call("factory.workflow.save", { targetRoot: root, workflow: "main", binding: SMALLEST_BINDING, grants: { add: [{ action: "merge", scope: "once", runId: null, expiresAt: null, grantedBy: "the person" }], revoke: [] } });
    const failed = await call("factory.proof.save", { targetRoot: root, workflow: "main", outcome: "failed", testTask: "A failed test task.", planDigest: saved.revision.planDigest, path: ["builder: tool-a"], manualSteps: [] });
    const passed = await call("factory.proof.save", { targetRoot: root, workflow: "main", outcome: "passed", testTask: "A passed test task.", planDigest: saved.revision.planDigest, path: ["builder: tool-a"], manualSteps: [] });
    const shown = await call("factory.workflow.show", { targetRoot: root, workflow: "main" });
    expect(shown.proofs.failed).not.toBeNull();
    const results = [tools, conflict, await call("factory.tools.list", {}), saved, failed, passed, shown, await call("factory.workflow.list", { targetRoot: root }), await call("factory.status", { targetRoot: root })];
    expect(unknownWordsAndPaths(TEXTS.map((entry) => entry.text), results)).toEqual([]);
    // Planted names that the code does not have must fail.
    expect(unknownWordsAndPaths(["Use `halted`, `webhook`, and `binding.revisionVersion`."], results)).toEqual(["binding.revisionVersion", "halted", "webhook"]);
  });

  it("writes and revokes grants with the Skill's own grants file, in a grant-only save that changes no plan (T16, rerun)", async () => {
    const root = project(CONFIG.factory);
    expect((await call("factory.tools.save", { tools: [tool("tool-a", FIVE)] })).result).toBe("saved");
    await saveAndProve(root, SMALLEST_BINDING, { grants: { add: [{ action: "deploy", scope: "standing", runId: null, expiresAt: null, grantedBy: "the person" }], revoke: [] } });
    const before = await call("factory.workflow.show", { targetRoot: root, workflow: "main" });
    const old = before.grants[0];
    const example = JSON.parse(fencedBlock(reference("save-and-test.md"), "json")) as { add: Value[]; revoke: Value[] };
    expect(Object.keys(example).sort()).toEqual(["add", "revoke"]);
    const grants = { add: example.add, revoke: example.revoke.map((entry) => ({ ...entry, grantId: old.grantId, expectedVersion: old.version })) };
    const saved = await call("factory.workflow.save", { targetRoot: root, workflow: "main", grants });
    expect(saved.result, JSON.stringify(saved)).toBe("saved");
    expect(saved.grantOnly).toBe(true);
    expect(saved.grants.revoked).toEqual([old.grantId]);
    const after = await call("factory.workflow.show", { targetRoot: root, workflow: "main" });
    expect(after.grants.map((grant: Value) => [grant.action, grant.scope])).toEqual([["merge", "once"]]);
    expect(after.live.readiness).toBe("ready");
    expect(after.revision.number).toBe(before.revision.number);
  });

  it("refuses a grant without a scope (A65)", async () => {
    const root = project(CONFIG.factory);
    await expect(call("factory.workflow.save", { targetRoot: root, workflow: "main", grants: { add: [{ action: "merge", grantedBy: "the person" }], revoke: [] } })).rejects.toThrow(/Invalid input|scope/);
  });

  it("keeps the two sample summaries complete, with neutral tool names (A31, A64)", () => {
    const summary = reference("summary.md");
    const samples = summary.split("## Sample: ").slice(1);
    expect(samples).toHaveLength(2);
    for (const sample of samples) {
      for (const part of ["**Roles.**", "**Wake.**", "**Human channel.**", "**Test task.**", "**Known losses you accepted.**", "**Grants.**", "**Open manual steps.**", "**Next.**"]) expect(sample, part).toContain(part);
      expect(sample).toMatch(/version \d/);
      expect(sample).toMatch(/proved/i);
      expect(sample).toMatch(/plan revision \d/);
    }
    expect(samples[0]).toContain("The factory runs only while you keep a session open.");
    expect(samples[1]).toMatch(/Do: .* Why: .* (Required|Optional)\. Unblocks: /);
  });
});
