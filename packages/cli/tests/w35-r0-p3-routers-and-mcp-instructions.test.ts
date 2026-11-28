/**
 * W35 R0 P3: the router lines, the trigger text of the work store reference,
 * and the MCP server instructions.
 *
 * - T1 to T4, A30 to A32, A34: the texts, and each installed copy matches its template.
 * - T5, A33: an update applies the new line to an unchanged block, and stops
 *   at a changed block with the person's text kept (PRD 15).
 * - T6, A35: the instructions go only to a profile that lists the work tools.
 * - T7, A36: each text names only current commands and tools of the name
 *   catalog (PRD 39 R-NAME-6), and the check fails on a former or unknown name.
 *
 * Every Store is the temporary Store of the test worker.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";

import { applyInstallPlan, findReviewableManagedFileConflicts, planInstall } from "../src/install";
import { loadManifest, writeManifest } from "../src/manifest";
import { parseManagedBlock, renderManagedBlock } from "../src/managed-block";
import { MCP_WORK_RULE_OPERATIONS, mcpServerInstructions, mcpWorkRuleText, mcpWorkRuleToolNames } from "../src/mcp/instructions";
import { createMakeDocsMcpServer } from "../src/mcp/server";
import { listMakeDocsMcpTools } from "../src/mcp/tools";
import { MCP_SERVER_PROFILES, type McpServerProfile } from "../src/operations/mcp-metadata";
import { NAME_CATALOG, NAME_GROUPS, NON_REGISTRY_COMMANDS, type NameCatalogEntry } from "../src/operations/name-catalog";
import { CHECKPOINT_EVENTS } from "../src/operations/work/work-queue/checkpoint";
import { defaultSelections } from "../src/profile";
import { hashText, PACKAGE_ROOT } from "../src/utils";
import { cleanupTempDir, createTempDir } from "./helpers";

const REPO = path.resolve(PACKAGE_ROOT, "../..");
const TEMPLATE = path.join(REPO, "packages/docs/template");
const read = (root: string, relativePath: string) => readFileSync(path.join(root, relativePath), "utf8");

const ROOT_ROUTERS = ["AGENTS.md", "CLAUDE.md"] as const;
const WORK_ROUTERS = ["docs/work/AGENTS.md", "docs/work/CLAUDE.md"] as const;
const REFERENCE = ".make-docs/system/references/work-store.md";
/** The five template files of the phase (A30). */
const PHASE_FILES = [...ROOT_ROUTERS, ...WORK_ROUTERS, REFERENCE] as const;

/** The root router line, as shipped. The owner reviews this wording. */
const ROOT_LINE =
  "- When the work store is in charge of this project's work (`make-docs work status` says which side is), find work with `make-docs work next`, not with file searches, and run `make-docs project checkpoint` after you change a file under `docs/work/` and after you close a phase. Otherwise, or without the CLI, the `docs/work/` files are the authority.";
/** The `docs/work/` note, as shipped. The owner reviews this wording. */
const WORK_NOTE =
  "- When the work store is present, it is the authority (`make-docs work status` says which side is in charge). Find work with `make-docs work next`, and run `make-docs project checkpoint` after you edit a file here. Without the CLI or a usable Store, these files are the authority: read and edit them directly. For the rules, and to claim, report, or close work, use a valid local `.make-docs/system/references/work-store.md` body or, when it is absent, run `make-docs resource read make-docs://system/reference/work-store.md`.";
/** The work store line of the `docs/work/` router in release 2.1.0, which the note replaces. */
const WORK_LINE_2_1_0 =
  "- To find ready work, or to claim, report, close, or sync it, use a valid local `.make-docs/system/references/work-store.md` body or, when it is absent, run `make-docs resource read make-docs://system/reference/work-store.md`. Without the CLI or a usable Store, `docs/work/` is the authority.";
/** The MCP server instructions, as shipped. The owner reviews this wording. */
const MCP_INSTRUCTIONS =
  "When you start work on this project's backlog, call `project_checkpoint` with no `event`. Add `allowWrite: true` only when your task may change this project's files. When the work store is in charge (`work_status` says which side is), find work with `work_next`, not with file searches, and call `project_checkpoint` with `allowWrite: true` after you change a file under `docs/work/` and after you close a phase. Without a usable Store, the `docs/work/` files are the authority: `project_checkpoint` says so and changes nothing.";

function managedBody(text: string): string {
  const parsed = parseManagedBlock(text);
  if (parsed.state !== "valid" || parsed.body === null) throw new Error("The router has no valid managed block.");
  return parsed.body;
}

/* ------------------------------------------------------------------------ */
/* Template and installed copy (T4, A30)                                    */
/* ------------------------------------------------------------------------ */

/**
 * One problem for each file whose installed copy differs from its template.
 * The root routers of a project can hold the project's own text outside the
 * managed block, so the compare is: the template file is the block, byte for
 * byte, and the installed block is the same block. Every other file is
 * compared whole.
 */
function copyProblems(templateRoot: string, installedRoot: string, files: readonly string[] = PHASE_FILES): string[] {
  const problems: string[] = [];
  for (const file of files) {
    const template = read(templateRoot, file);
    const installed = read(installedRoot, file);
    if ((ROOT_ROUTERS as readonly string[]).includes(file)) {
      const block = renderManagedBlock(managedBody(template));
      if (template !== `${block}\n`) problems.push(`${file}: the template holds text outside its managed block.`);
      const parsed = parseManagedBlock(installed);
      if (parsed.state !== "valid" || parsed.body !== managedBody(template) || !installed.includes(block)) {
        problems.push(`${file}: the installed managed block differs from the template.`);
      }
    } else if (!Buffer.from(installed).equals(Buffer.from(template))) {
      problems.push(`${file}: the installed copy differs from the template.`);
    }
  }
  return problems;
}

describe("W35 R0 P3 each installed copy matches its template (T4, A30)", () => {
  it("the five template files and their installed copies are byte-identical", () => {
    expect(copyProblems(TEMPLATE, REPO)).toEqual([]);
    // The docs/work/ routers and the reference have no text of this repository, so they match whole.
    for (const file of [...WORK_ROUTERS, REFERENCE]) expect(readFileSync(path.join(REPO, file)).equals(readFileSync(path.join(TEMPLATE, file))), file).toBe(true);
    // The root routers of this repository keep their own text after the block.
    for (const file of ROOT_ROUTERS) {
      const installed = read(REPO, file);
      expect(installed.startsWith(read(TEMPLATE, file)), file).toBe(true);
      expect(installed, file).toContain("# Maintainer Dogfooding");
    }
  });

  it("the two files of each router pair are the same", () => {
    expect(read(TEMPLATE, "AGENTS.md")).toBe(read(TEMPLATE, "CLAUDE.md"));
    expect(read(TEMPLATE, "docs/work/AGENTS.md")).toBe(read(TEMPLATE, "docs/work/CLAUDE.md"));
    expect(read(REPO, "AGENTS.md")).toBe(read(REPO, "CLAUDE.md"));
  });

  it("fails when a template file and its installed copy differ", () => {
    const templateRoot = createTempDir();
    const installedRoot = createTempDir();
    try {
      for (const root of [templateRoot, installedRoot]) {
        for (const file of PHASE_FILES) {
          mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
          writeFileSync(path.join(root, file), read(TEMPLATE, file));
        }
      }
      expect(copyProblems(templateRoot, installedRoot)).toEqual([]);
      // Text outside the block of an installed root router is the project's own, so it is no problem.
      writeFileSync(path.join(installedRoot, "AGENTS.md"), `${read(TEMPLATE, "AGENTS.md")}\n# Project text\n`);
      expect(copyProblems(templateRoot, installedRoot)).toEqual([]);
      writeFileSync(path.join(installedRoot, "CLAUDE.md"), read(TEMPLATE, "CLAUDE.md").replace("make-docs project checkpoint", "make-docs work sync"));
      writeFileSync(path.join(installedRoot, "docs/work/AGENTS.md"), `${read(TEMPLATE, "docs/work/AGENTS.md")}\n`);
      writeFileSync(path.join(installedRoot, REFERENCE), read(TEMPLATE, REFERENCE).replace("### When to Run It", "### When To Run It"));
      expect(copyProblems(templateRoot, installedRoot)).toEqual([
        "CLAUDE.md: the installed managed block differs from the template.",
        "docs/work/AGENTS.md: the installed copy differs from the template.",
        `${REFERENCE}: the installed copy differs from the template.`,
      ]);
    } finally {
      cleanupTempDir(templateRoot);
      cleanupTempDir(installedRoot);
    }
  });
});

/* ------------------------------------------------------------------------ */
/* The texts (T1 to T3, A31, A32, A34)                                      */
/* ------------------------------------------------------------------------ */

describe("W35 R0 P3 the router lines (T1, T2, A31)", () => {
  it.each(ROOT_ROUTERS)("the managed block of the root %s holds the one work store line", (file) => {
    const lines = managedBody(read(TEMPLATE, file)).split("\n");
    expect(lines.filter((line) => line.includes("work store"))).toEqual([ROOT_LINE]);
    // The root block stays inside its budget of 12 lines, with its two marker lines.
    expect(renderManagedBlock(managedBody(read(TEMPLATE, file))).split("\n").length).toBeLessThanOrEqual(12);
  });

  it.each(WORK_ROUTERS)("the managed block of %s holds the note in place of the 2.1.0 line", (file) => {
    const body = managedBody(read(TEMPLATE, file));
    expect(body.split("\n").filter((line) => line.includes("work store"))).toEqual([WORK_NOTE]);
    expect(body).not.toContain("To find ready work");
    // The note replaced one line, so the block has the line count of release 2.1.0.
    expect(body.replace(WORK_NOTE, WORK_LINE_2_1_0).split("\n")).toHaveLength(body.split("\n").length);
  });

  it.each([["the root router line", ROOT_LINE], ["the docs/work/ note", WORK_NOTE]])("%s names who is in charge, the read command, and the checkpoint, and holds without a Store", (_name, line) => {
    // Who is in charge, and the command that says so.
    expect(line).toMatch(/^- When the work store is (in charge|present)/);
    expect(line).toContain("`make-docs work status` says which side is");
    // The read command and the checkpoint command.
    expect(line).toContain("with `make-docs work next`");
    expect(line).toContain("run `make-docs project checkpoint` after you");
    // What holds in every other case: without the CLI, without a usable Store, and in a checkout that is not bound.
    expect(line).toMatch(/(Otherwise, or without the CLI, the `docs\/work\/`|Without the CLI or a usable Store, these) files are the authority/);
    // A direct run: the line gives no event.
    expect(line).not.toContain("--event");
    // No sentence is an unconditional claim that the store is in charge.
    for (const sentence of line.replace(/^- /, "").split(/(?<=\.) /)) {
      expect(sentence, sentence).toMatch(/^(When the work store is|Find work with|Otherwise, or without the CLI|Without the CLI or a usable Store|For the rules)/);
    }
  });
});

describe("W35 R0 P3 the trigger text of the work store reference (T3, A32)", () => {
  const section = read(TEMPLATE, REFERENCE).split(/^### When to Run It$/m)[1]!.split(/^## /m)[0]!;

  it("sits in the Checkpoint section and names the three moments", () => {
    const checkpoint = read(TEMPLATE, REFERENCE).split(/^## Checkpoint$/m)[1]!.split(/^## /m)[0]!;
    expect(checkpoint).toContain("### When to Run It");
    expect(checkpoint).toContain("[When to Run It](#when-to-run-it)");
    expect(section).toContain("1. At the start of a session, before you find or pick work.");
    expect(section).toContain("2. After you edit a file under `docs/work/`.");
    expect(section).toContain("3. After you close a phase.");
  });

  it("says that each moment is a direct run, names the six events, and says that only a hook starts a trigger run", () => {
    expect(section).toContain("Each of the three is a direct run: run `make-docs project checkpoint` with no `--event`, or call the `project_checkpoint` tool with no `event`.");
    // The tool writes only with the write permission. Without it, the tool gives the read steps.
    expect(section).toContain("The tool syncs only with `allowWrite: true`, and without it gives the read steps and says that the sync did not run.");
    expect(CHECKPOINT_EVENTS).toHaveLength(6);
    const events = CHECKPOINT_EVENTS.map((event) => `\`${event}\``);
    expect(section).toContain(`The checkpoint knows six events: ${events.slice(0, 5).join(", ")}, and ${events[5]}.`);
    expect(section).toContain("only a hook starts a trigger run");
    expect(section).toContain("the `docs/work/` files are the authority");
  });
});

describe("W35 R0 P3 changes no work file (A34)", () => {
  it("the note lives in the router, and no backlog file of the template holds it", () => {
    expect(readdirSync(path.join(TEMPLATE, "docs/work"), { recursive: true }).map(String).sort()).toEqual(["AGENTS.md", "CLAUDE.md"]);
  });
});

/* ------------------------------------------------------------------------ */
/* Names (T7, A36)                                                          */
/* ------------------------------------------------------------------------ */

const CURRENT = NAME_CATALOG.filter((item) => item.status === "current");
const CHECKPOINT = NAME_CATALOG.find((item) => item.id === "project.checkpoint.run")!;

interface NameRules {
  /** The CLI command that the text must name. */
  requiredCli?: string;
  /** The MCP tool that the text must name. */
  requiredMcp?: string;
  /** When set, every snake-case code span must be one of these tools. */
  tools?: readonly string[];
}

/**
 * One problem for each command or tool in the code spans of `text` that the
 * catalog does not hold as a current name, and for each required name that
 * the text lacks. It is stricter than the shipped-text scan of W33 R0 P4: a
 * path must be a current command, and with `tools` an unknown tool name fails.
 */
function nameProblems(text: string, rules: NameRules, catalog: readonly NameCatalogEntry[] = NAME_CATALOG): string[] {
  const current = catalog.filter((item) => item.status === "current");
  const leaves = new Set<string>([...NON_REGISTRY_COMMANDS, ...current.filter((item) => item.cliCommand).map((item) => item.newCli)]);
  const branches = new Set<string>(NAME_GROUPS);
  for (const leaf of leaves) leaf.split(" ").forEach((_word, index, words) => branches.add(words.slice(0, index + 1).join(" ")));
  const formerMcp = new Set(catalog.flatMap((item) => (item.formerMcp && item.formerMcp !== item.newMcp ? [item.formerMcp] : [])));
  const problems: string[] = [];
  const spans = [...text.matchAll(/`([^`]+)`/g)].map((found) => found[1]!);
  for (const span of spans) {
    const command = /^make-docs((?: [a-z][a-z0-9-]*)+)/.exec(span);
    if (command) {
      const words = command[1]!.trim().split(" ");
      let known = 0;
      for (let size = words.length; size > 0 && known === 0; size -= 1) if (leaves.has(words.slice(0, size).join(" "))) known = size;
      // A word after a full command is an argument, unless it reaches into a deeper known path.
      if (known === 0 || (known < words.length && branches.has(words.slice(0, known + 1).join(" ")))) problems.push(`unknown command: make-docs ${words.join(" ")}`);
    }
    if (/^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(span)) {
      if (formerMcp.has(span)) problems.push(`former tool: ${span}`);
      else if (rules.tools && !rules.tools.includes(span)) problems.push(`unknown tool: ${span}`);
    }
  }
  if (rules.requiredCli && !spans.some((span) => span === `make-docs ${rules.requiredCli}`)) problems.push(`missing command: make-docs ${rules.requiredCli}`);
  if (rules.requiredMcp && !spans.includes(rules.requiredMcp)) problems.push(`missing tool: ${rules.requiredMcp}`);
  return problems;
}

describe("W35 R0 P3 each text names only current catalog names (T7, A36, PRD 39 R-NAME-6)", () => {
  const currentTools = CURRENT.map((item) => item.newMcp);

  it("the checkpoint entry is current, with the names that the texts use", () => {
    expect([CHECKPOINT.status, CHECKPOINT.newCli, CHECKPOINT.newMcp]).toEqual(["current", "project checkpoint", "project_checkpoint"]);
  });

  it("the root router line and the docs/work/ note name the current checkpoint command", () => {
    for (const file of [...ROOT_ROUTERS, ...WORK_ROUTERS]) {
      for (const root of [TEMPLATE, REPO]) {
        const line = managedBody(read(root, file)).split("\n").find((candidate) => candidate.includes("work store"))!;
        expect(nameProblems(line, { requiredCli: CHECKPOINT.newCli, tools: currentTools }), file).toEqual([]);
      }
    }
  });

  it("the trigger text of the reference names the current checkpoint command and tool", () => {
    for (const root of [TEMPLATE, REPO]) {
      const section = read(root, REFERENCE).split(/^### When to Run It$/m)[1]!.split(/^## /m)[0]!;
      expect(nameProblems(section, { requiredCli: CHECKPOINT.newCli, requiredMcp: CHECKPOINT.newMcp, tools: currentTools })).toEqual([]);
      // The whole reference names no unknown command and no former tool.
      expect(nameProblems(read(root, REFERENCE), { requiredCli: CHECKPOINT.newCli, requiredMcp: CHECKPOINT.newMcp })).toEqual([]);
    }
  });

  it("the MCP instructions name the current checkpoint tool, and only tools of the catalog", () => {
    expect(nameProblems(mcpWorkRuleText()!, { requiredMcp: CHECKPOINT.newMcp, tools: currentTools })).toEqual([]);
    expect(mcpWorkRuleToolNames()).toEqual(["project_checkpoint", "work_status", "work_next"]);
    expect(MCP_WORK_RULE_OPERATIONS.map((id) => CURRENT.find((item) => item.id === id)?.newMcp)).toEqual(mcpWorkRuleToolNames());
  });

  it("fails on a fixture with an unknown command or tool", () => {
    expect(nameProblems(ROOT_LINE.replace("make-docs project checkpoint", "make-docs project sync-all"), { requiredCli: CHECKPOINT.newCli })).toEqual([
      "unknown command: make-docs project sync-all",
      "missing command: make-docs project checkpoint",
    ]);
    expect(nameProblems(WORK_NOTE.replace("make-docs work next", "make-docs work list"), { requiredCli: CHECKPOINT.newCli })).toEqual(["unknown command: make-docs work list"]);
    expect(nameProblems("Run `make-docs project checkpoint run`.", {})).toEqual([]);
    expect(nameProblems("Run `make-docs work evidence write`.", {})).toEqual(["unknown command: make-docs work evidence write"]);
    expect(nameProblems(MCP_INSTRUCTIONS.replaceAll("project_checkpoint", "project_checkpoint_run"), { requiredMcp: CHECKPOINT.newMcp, tools: currentTools })).toEqual([
      "unknown tool: project_checkpoint_run",
      "unknown tool: project_checkpoint_run",
      "unknown tool: project_checkpoint_run",
      "missing tool: project_checkpoint",
    ]);
  });

  it("fails on a fixture with a former name", () => {
    expect(nameProblems("Run `make-docs run work backlog snapshot` after an edit.", { requiredCli: CHECKPOINT.newCli })).toEqual([
      "unknown command: make-docs run work backlog snapshot",
      "missing command: make-docs project checkpoint",
    ]);
    expect(nameProblems("Run `make-docs project path-hygiene validate`.", {})).toEqual(["unknown command: make-docs project path-hygiene validate"]);
    expect(nameProblems("Call `backlog_cache_read` first.", {})).toEqual(["former tool: backlog_cache_read"]);
  });

  it("fails when the catalog no longer holds the checkpoint as a current name", () => {
    const planned = NAME_CATALOG.map((item) => (item.id === CHECKPOINT.id ? { ...item, status: "planned" as const } : item));
    expect(nameProblems(ROOT_LINE, { requiredCli: CHECKPOINT.newCli }, planned)).toEqual(["unknown command: make-docs project checkpoint"]);
    const renamed = NAME_CATALOG.map((item) => (item.id === CHECKPOINT.id ? { ...item, newCli: "project settle", newMcp: "project_settle" } : item));
    expect(nameProblems(ROOT_LINE, { requiredCli: "project settle" }, renamed)).toEqual([
      "unknown command: make-docs project checkpoint",
      "missing command: make-docs project settle",
    ]);
    expect(nameProblems(MCP_INSTRUCTIONS, { requiredMcp: "project_settle", tools: renamed.map((item) => item.newMcp) }, renamed)).toContain("missing tool: project_settle");
  });
});

/* ------------------------------------------------------------------------ */
/* MCP server instructions (T6, A35)                                        */
/* ------------------------------------------------------------------------ */

async function connect(profile: McpServerProfile): Promise<{ instructions: string | undefined; tools: string[] }> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createMakeDocsMcpServer({ profile });
  const client = new Client({ name: "w35-r0-p3-test", version: "1.0.0" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  try {
    return { instructions: client.getInstructions(), tools: (await client.listTools()).tools.map((tool) => tool.name) };
  } finally {
    await client.close();
    await server.close();
  }
}

describe("W35 R0 P3 MCP server instructions (T6, A35, PRD 25 R-MCP-INSTR)", () => {
  const WITH_WORK: readonly McpServerProfile[] = ["all", "backlog", "workflow"];

  it("the text is the pinned text, and its tool names come from the catalog", () => {
    expect(mcpWorkRuleText()).toBe(MCP_INSTRUCTIONS);
  });

  it("the text tells an agent that starts work on the backlog to run the checkpoint, as a direct run, in conditional words", () => {
    expect(MCP_INSTRUCTIONS).toMatch(/^When you start work on this project's backlog, call `project_checkpoint` with no `event`\. /);
    expect(MCP_INSTRUCTIONS).toContain("When the work store is in charge (`work_status` says which side is), find work with `work_next`");
    expect(MCP_INSTRUCTIONS).toContain("call `project_checkpoint` with `allowWrite: true` after you change a file under `docs/work/` and after you close a phase");
    expect(MCP_INSTRUCTIONS).toContain("Without a usable Store, the `docs/work/` files are the authority");
    // It names no event, so an agent that obeys it makes a direct run.
    for (const event of CHECKPOINT_EVENTS) expect(MCP_INSTRUCTIONS, event).not.toContain(event);
    expect(MCP_INSTRUCTIONS).not.toContain("make-docs ");
  });

  it("the text asks for the write permission only with a condition, and never as a standing order", () => {
    const sentences = MCP_INSTRUCTIONS.split(/(?<=\.) /);
    expect(sentences).toHaveLength(4);
    // The first call has no write permission in its own sentence.
    expect(sentences[0]).not.toContain("allowWrite");
    // Each sentence that names the write permission ties it to a change of project files.
    const withWrite = sentences.filter((sentence) => sentence.includes("allowWrite"));
    expect(withWrite).toHaveLength(2);
    expect(withWrite[0]).toBe("Add `allowWrite: true` only when your task may change this project's files.");
    expect(withWrite[1]).toMatch(/with `allowWrite: true` after you change a file under `docs\/work\/` and after you close a phase\.$/);
    // No sentence orders a call at the start of every session.
    expect(MCP_INSTRUCTIONS).not.toMatch(/At the start of (a|every|each) session/);
  });

  it.each(MCP_SERVER_PROFILES)("the %s profile sends the work rule only when it lists the work tools", async (profile) => {
    const { instructions, tools } = await connect(profile);
    const hasWorkTool = tools.some((name) => name.startsWith("work_") || name === "project_checkpoint");
    if (WITH_WORK.includes(profile)) {
      expect(instructions).toBe(MCP_INSTRUCTIONS);
      // The connection lists every tool that its instructions name.
      expect(nameProblems(instructions!, { requiredMcp: CHECKPOINT.newMcp, tools })).toEqual([]);
      for (const name of mcpWorkRuleToolNames()!) expect(tools, name).toContain(name);
    } else {
      expect(instructions).toBeUndefined();
      // A profile with no work rule lists none of the tools that the rule names.
      for (const name of mcpWorkRuleToolNames()!) expect(tools, name).not.toContain(name);
      expect(hasWorkTool && tools.includes("work_next")).toBe(false);
    }
  });

  it("the profiles with a work tool are exactly all, backlog, and workflow", () => {
    const withRule = MCP_SERVER_PROFILES.filter((profile) => mcpServerInstructions(listMakeDocsMcpTools(process.cwd(), { profile }).map((tool) => tool.name)) !== undefined);
    expect([...withRule].sort()).toEqual([...WITH_WORK].sort());
  });

  it("sends no work rule when one of its tools is not listed", () => {
    const names = mcpWorkRuleToolNames()!;
    expect(mcpServerInstructions(names)).toBe(MCP_INSTRUCTIONS);
    for (const missing of names) expect(mcpServerInstructions(names.filter((name) => name !== missing)), missing).toBeUndefined();
    expect(mcpServerInstructions([])).toBeUndefined();
  });

  it("sends no instructions, and does not throw, when the catalog does not hold a tool of the rule as a current name", () => {
    const listed = mcpWorkRuleToolNames()!;
    for (const id of MCP_WORK_RULE_OPERATIONS) {
      const planned = NAME_CATALOG.map((item) => (item.id === id ? { ...item, status: "planned" as const } : item));
      expect(mcpWorkRuleToolNames(planned), id).toBeUndefined();
      expect(mcpWorkRuleText(planned), id).toBeUndefined();
      expect(mcpServerInstructions(listed, planned), id).toBeUndefined();
      const absent = NAME_CATALOG.filter((item) => item.id !== id);
      expect(() => mcpServerInstructions(listed, absent), id).not.toThrow();
      expect(mcpServerInstructions(listed, absent), id).toBeUndefined();
    }
    // The name test is the guard: with the real catalog, the three names are current and the text exists.
    expect(mcpWorkRuleToolNames()).toEqual(["project_checkpoint", "work_status", "work_next"]);
    expect(mcpWorkRuleText()).toBe(MCP_INSTRUCTIONS);
  });
});

/* ------------------------------------------------------------------------ */
/* The update path (T5, A33, PRD 15)                                        */
/* ------------------------------------------------------------------------ */

/** The managed body of a router as release 2.1.0 shipped it: the body of today without the text of this phase. */
function bodyOf2_1_0(file: string): string {
  const body = managedBody(read(TEMPLATE, file));
  const old = (ROOT_ROUTERS as readonly string[]).includes(file) ? body.replace(`${ROOT_LINE}\n`, "") : body.replace(WORK_NOTE, WORK_LINE_2_1_0);
  if (old === body) throw new Error(`${file} does not hold the text of this phase.`);
  return old;
}

const ROUTERS = [...ROOT_ROUTERS, ...WORK_ROUTERS] as const;
const PERSON_LINE = "- A person added this line inside the block.";
const OUTSIDE = "\n# My Own Notes\n\nKeep this text.\n";

/**
 * A project as release 2.1.0 left it: each of the four routers holds its 2.1.0
 * block, and the install record holds the hash of that block. `changed` names
 * the routers whose block a person changed after that, with own text after it.
 */
async function projectAt2_1_0(targetDir: string, changed: readonly string[]) {
  const selections = defaultSelections();
  const first = await planInstall({ targetDir, selections, existingManifest: null });
  applyInstallPlan({ targetDir, plan: first, existingManifest: null });
  const manifest = loadManifest(targetDir)!;
  for (const file of ROUTERS) {
    const old = bodyOf2_1_0(file);
    expect(manifest.files[file], file).toBeDefined();
    manifest.files[file]!.hash = hashText(old);
    const asset = manifest.systemAssetMaterialization?.assets?.[file];
    if (asset) asset.expectedHashes = [hashText(old)];
    const owner = manifest.routerOwnership?.routers[file] as { expectedSourceHash?: string; installedHash?: string } | undefined;
    if (owner) {
      owner.expectedSourceHash = hashText(old);
      owner.installedHash = hashText(old);
    }
    const text = changed.includes(file) ? `${renderManagedBlock(`${old.replace(/\n$/, "")}\n${PERSON_LINE}\n`)}\n${OUTSIDE}` : `${renderManagedBlock(old)}\n`;
    writeFileSync(path.join(targetDir, file), text, "utf8");
  }
  writeManifest(targetDir, manifest);
  return { selections, manifest: loadManifest(targetDir)! };
}

describe("W35 R0 P3 the update path of the managed blocks (T5, A33, PRD 15)", () => {
  it("the 2.1.0 bodies differ from today's only by the text of this phase", () => {
    for (const file of ROOT_ROUTERS) expect(bodyOf2_1_0(file).split("\n")).toHaveLength(managedBody(read(TEMPLATE, file)).split("\n").length - 1);
    for (const file of ROUTERS) expect(bodyOf2_1_0(file)).not.toContain("make-docs project checkpoint");
    // The SHA-256 of each router file in the released 2.1.0 package (git tag v2.1.0).
    expect(hashText(`${renderManagedBlock(bodyOf2_1_0("AGENTS.md"))}\n`)).toBe("f853bac8cea8de2d342d5f97412e2be8a31537813fd0872d35e73d1b3828793c");
    expect(hashText(`${renderManagedBlock(bodyOf2_1_0("docs/work/AGENTS.md"))}\n`)).toBe("e65810f826adf265a14db9c580ac9e23fdcb310e716bbca23bb6191fcc124c24");
  });

  it("an update applies the new line to each unchanged block", async () => {
    const targetDir = createTempDir();
    try {
      const { selections, manifest } = await projectAt2_1_0(targetDir, []);
      const plan = await planInstall({ targetDir, selections, existingManifest: manifest });
      expect(findReviewableManagedFileConflicts(plan)).toEqual([]);
      for (const file of ROUTERS) expect(plan.actions.find((action) => action.relativePath === file), file).toMatchObject({ type: "update" });
      applyInstallPlan({ targetDir, plan, existingManifest: manifest });
      for (const file of ROUTERS) expect(read(targetDir, file), file).toBe(read(TEMPLATE, file));
      expect(read(targetDir, "AGENTS.md")).toContain(ROOT_LINE);
      expect(read(targetDir, "docs/work/AGENTS.md")).toContain(WORK_NOTE);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  it("a changed block goes to conflict review, and nothing is overwritten", async () => {
    const targetDir = createTempDir();
    try {
      const changed = ["AGENTS.md", "docs/work/AGENTS.md"];
      const { selections, manifest } = await projectAt2_1_0(targetDir, changed);
      const before = new Map(ROUTERS.map((file) => [file, read(targetDir, file)]));
      const plan = await planInstall({ targetDir, selections, existingManifest: manifest });
      expect(findReviewableManagedFileConflicts(plan).map((conflict) => conflict.relativePath).sort()).toEqual([...changed].sort());
      for (const file of changed) expect(plan.actions.find((action) => action.relativePath === file), file).toMatchObject({ type: "skip-conflict" });
      // An apply with a conflict that nobody reviewed stops, and it writes no router.
      expect(() => applyInstallPlan({ targetDir, plan, existingManifest: manifest })).toThrow();
      for (const file of ROUTERS) expect(read(targetDir, file), file).toBe(before.get(file));
      for (const file of changed) {
        expect(read(targetDir, file), file).toContain(PERSON_LINE);
        expect(read(targetDir, file), file).toContain(OUTSIDE);
      }
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  it("a reviewed overwrite replaces only the block and keeps the person's text outside it", async () => {
    const targetDir = createTempDir();
    try {
      const changed = ["AGENTS.md", "docs/work/AGENTS.md"];
      const { selections, manifest } = await projectAt2_1_0(targetDir, changed);
      const plan = await planInstall({
        targetDir,
        selections,
        existingManifest: manifest,
        managedFileConflictResolutions: Object.fromEntries(changed.map((file) => [file, "overwrite" as const])),
      });
      expect(findReviewableManagedFileConflicts(plan)).toEqual([]);
      applyInstallPlan({ targetDir, plan, existingManifest: manifest });
      for (const file of changed) {
        const text = read(targetDir, file);
        expect(managedBody(text), file).toBe(managedBody(read(TEMPLATE, file)));
        expect(text, file).toContain(OUTSIDE);
        expect(text, file).not.toContain(PERSON_LINE);
      }
    } finally {
      cleanupTempDir(targetDir);
    }
  });
});
