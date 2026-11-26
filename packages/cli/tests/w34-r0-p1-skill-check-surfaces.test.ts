/**
 * W34 R0 P1 surfaces (A3 to A7): CLI and MCP parity in plain and JSON output,
 * repair preview and write permission, the Persona guide folders, the rule ID
 * lists, the help, and PRD 25 R-MCP-PROFILE-11 against the profile lists in code.
 */
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callMakeDocsMcpTool, listMakeDocsMcpTools } from "../src/mcp/tools";
import { createExecutionContext, OperationWriteDeniedError } from "../src/operations/context";
import {
  DECOMPOSITION_RULES,
  DECOMPOSITION_RULE_IDS,
  renderDecompositionValidation,
  validateDecompositionOutput,
  type DecompositionValidationResult,
} from "../src/operations/decomposition/output";
import {
  holdsManagedBlock,
  MARKDOWN_STYLE_RULES,
  MARKDOWN_STYLE_RULE_IDS,
  renderMarkdownStyleRepair,
  renderMarkdownStyleValidate,
  validateMarkdownStyle,
  type MarkdownStyleRepairResult,
  type MarkdownStyleValidateResult,
} from "../src/operations/project/markdown-style";
import {
  RELATION_KIND_IDS,
  listProjectRelations,
  renderProjectRelations,
  type ProjectRelationsResult,
} from "../src/operations/project/relations";
import { getOperation, invokeOperation, operationCliCommand } from "../src/operations/registry";
import { renderOperationLeafHelp, resolveLeafHelp } from "../src/run/leaf-help";
import { runRunCommand } from "../src/run/cli";
import { runProjectCommand } from "../src/run/root-operations";
import { HARNESS_CALLER_IDENTITY_ENV } from "../src/harness-access/contract";
import { PACKAGE_ROOT } from "../src/utils";

const REPO_ROOT = path.resolve(PACKAGE_ROOT, "../..");

async function captureStdout(run: () => Promise<void>): Promise<string> {
  const chunks: string[] = [];
  const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
    chunks.push(String(chunk));
    return true;
  });
  try {
    await run();
  } finally {
    spy.mockRestore();
  }
  return chunks.join("");
}

async function captureStderr(run: () => Promise<void>): Promise<string> {
  const chunks: string[] = [];
  const spy = vi.spyOn(process.stderr, "write").mockImplementation((chunk: unknown) => {
    chunks.push(String(chunk));
    return true;
  });
  try {
    await run();
  } finally {
    spy.mockRestore();
  }
  return chunks.join("");
}

function write(root: string, relative: string, text: string): void {
  const file = path.join(root, relative);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, text);
}

function snapshot(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else out[path.relative(dir, absolute)] = readFileSync(absolute, "utf8");
    }
  };
  walk(dir);
  return out;
}

/** One small project with a finding for each command. */
function fixtureProject(root: string): void {
  write(root, ".make-docs/config.yaml", "personas:\n  - slug: reviewer\n    label: Reviewer\n    description: Reviews the docs.\n    primitive: user\n");
  write(root, "docs/prd/00-index.md", "## Purpose\nIndex.\n## Reading Order\nOrder.\n## Document Map\nMap.\n## Source Anchors\n`src/`\n## Audience Paths\nPaths.\n");
  write(root, "docs/prd/01-product-overview.md", "## Purpose\nPO.\n## Users\n`u.py`\n## Key Capabilities\n`k.py`\n## System Boundaries\n`s.py`\n## Current Limitations\n`l.py`\n## Source Anchors\n`src/`\n");
  write(root, "docs/prd/02-architecture-overview.md", "## Purpose\nAO.\n## Topology\n`t.py`\n## Module Map\n`m.py`\n## Runtime Boundaries\n`r.py`\n## Data Flow\n`d.py`\n## Configuration Surfaces\n`c.py`\n## Source Anchors\n`src/`\n");
  write(root, "docs/prd/03-open-questions-and-risk-register.md", "## Purpose\nOQ.\n## Confirmed Drift\n`cd.py`\n## Open Questions\n`oq.py`\n## Rebuild Risks\n`rr.py`\n");
  write(root, "docs/designs/2026-01-01-example.md", "# Example design\nA design paragraph that wraps\nonto a second line.\n");
  write(root, "docs/plans/2026-01-02-w1-r0-example/00-overview.md", "# Plan\n\nFrom the [design](../../designs/2026-01-01-example.md#decision).\n");
  write(root, "docs/work/2026-01-03-w1-r0-example/00-index.md", "## Purpose\nIdx.\n## Phase Map\nMap.\n## Usage Notes\nNotes.\n");
  write(
    root,
    "docs/work/2026-01-03-w1-r0-example/01-phase.md",
    "## Purpose\nP.\n## Overview\nFrom the [plan](../../plans/2026-01-02-w1-r0-example/00-overview.md).\n## Source PRD Docs\n- [Missing](../../prd/09-missing.md)\n## Stage 1 - Build\n### Tasks\n- [ ] T1: First.\n- [ ] T3: Third.\n### Acceptance criteria\n- [ ] Done.\n### Dependencies\n- None.\n",
  );
  write(root, ".make-docs/archive/history/2026-01-04-w1-r0-p1-example.md", "---\ncoordinate: \"W1 R0 P1\"\n---\n# History\n");
  write(root, ".make-docs/archive/history/2026-01-05-w2-r10-other.md", "---\ncoordinate: \"W2 R10\"\n---\n# Other history\n");
  write(root, "docs/plans/2026-01-06-w2-r1-short/00-overview.md", "# A plan for W2 R1\n");
  write(root, "docs/assets/reviewer/review-guide.md", "---\nrelated:\n  - ../../plans/2026-01-02-w1-r0-example/\n---\n# Review guide\n");
  write(root, "docs/assets/undeclared/stray.md", "---\nrelated:\n  - ../../plans/2026-01-02-w1-r0-example/\n---\n# Not a Persona folder\n");
}

let temp: string;
let root: string;

beforeEach(() => {
  temp = mkdtempSync(path.join(os.tmpdir(), "w34-p1-surfaces-"));
  root = path.join(temp, "project");
  fixtureProject(root);
  vi.stubEnv("MAKE_DOCS_HOME", path.join(temp, "store"));
  vi.stubEnv(HARNESS_CALLER_IDENTITY_ENV, "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(temp, { recursive: true, force: true });
  process.exitCode = 0;
});

describe("W34 R0 P1 A3: the CLI and MCP give the same result", () => {
  it("check decomposition: JSON, plain words, and every MCP profile that has it", async () => {
    const cli = JSON.parse(await captureStdout(() => runRunCommand(["check", "decomposition", "--target-root", root, "--json"]))) as DecompositionValidationResult;
    expect(process.exitCode).toBe(1);
    const quality = (await callMakeDocsMcpTool("check_decomposition", { targetRoot: root }, { profile: "quality" })).result;
    expect(cli).toEqual(quality);
    expect((await callMakeDocsMcpTool("check_decomposition", { targetRoot: root }, { profile: "all" })).result).toEqual(quality);
    await expect(callMakeDocsMcpTool("check_decomposition", { targetRoot: root }, { profile: "setup" })).rejects.toThrow("Unknown make-docs MCP tool");
    expect(cli).toEqual(validateDecompositionOutput(root));
    const plain = await captureStdout(() => runRunCommand(["check", "decomposition", "--target-root", root], { isTty: true }));
    expect(plain).toBe(`${renderDecompositionValidation(cli).join("\n")}\n`);
  });

  it("project relations list: JSON and plain words through the CLI, and the workflow and all profiles", async () => {
    const cli = JSON.parse(await captureStdout(() => runProjectCommand(["relations", "list", "--target-root", root, "--json"]))) as ProjectRelationsResult;
    const workflow = (await callMakeDocsMcpTool("project_relations_list", { targetRoot: root }, { profile: "workflow" })).result;
    expect(cli).toEqual(workflow);
    expect((await callMakeDocsMcpTool("project_relations_list", { targetRoot: root }, { profile: "all" })).result).toEqual(workflow);
    const focused = JSON.parse(
      await captureStdout(() => runProjectCommand(["relations", "list", "--path", "docs/plans/2026-01-02-w1-r0-example", "--target-root", root, "--json"])),
    );
    expect(focused).toEqual((await callMakeDocsMcpTool("project_relations_list", { targetRoot: root, path: "docs/plans/2026-01-02-w1-r0-example" }, { profile: "workflow" })).result);
    const plain = await captureStdout(() => runProjectCommand(["relations", "list", "--target-root", root]));
    expect(plain).toBe(renderProjectRelations(cli));
  });

  it("project markdown validate: JSON and plain words, and the setup, quality, and all profiles", async () => {
    const cli = JSON.parse(await captureStdout(() => runProjectCommand(["markdown", "validate", "--target-root", root, "--json"]))) as MarkdownStyleValidateResult;
    expect(process.exitCode).toBe(1);
    for (const profile of ["setup", "quality", "all"] as const) {
      expect((await callMakeDocsMcpTool("project_markdown_validate", { targetRoot: root }, { profile })).result, profile).toEqual(cli);
    }
    expect(cli).toEqual(validateMarkdownStyle({ targetRoot: root }));
    const plain = await captureStdout(() => runProjectCommand(["markdown", "validate", "--target-root", root]));
    expect(plain).toBe(renderMarkdownStyleValidate(cli));
  });

  it("project markdown repair: the same preview and the same repair through the CLI and MCP", async () => {
    const twin = path.join(temp, "twin");
    fixtureProject(twin);
    const cliPreview = JSON.parse(await captureStdout(() => runProjectCommand(["markdown", "repair", "--target-root", root, "--json"]))) as MarkdownStyleRepairResult;
    const mcpPreview = (await callMakeDocsMcpTool("project_markdown_repair", { targetRoot: root, allowWrite: true }, { profile: "setup" })).result;
    expect(cliPreview).toEqual(mcpPreview);
    expect(cliPreview).toMatchObject({ status: "previewed", dryRun: true, changedFiles: [] });
    const plainPreview = await captureStdout(() => runProjectCommand(["markdown", "repair", "--target-root", root]));
    expect(plainPreview).toBe(renderMarkdownStyleRepair(cliPreview));

    const cliRepair = JSON.parse(await captureStdout(() => runProjectCommand(["markdown", "repair", "--apply", "--target-root", root, "--json"]))) as MarkdownStyleRepairResult;
    const mcpRepair = (await callMakeDocsMcpTool("project_markdown_repair", { targetRoot: twin, allowWrite: true, apply: true }, { profile: "all" })).result as MarkdownStyleRepairResult;
    const withoutRoot = (value: MarkdownStyleRepairResult) => JSON.parse(JSON.stringify(value).split(value.targetRoot).join("<root>"));
    expect(withoutRoot(cliRepair)).toEqual(withoutRoot(mcpRepair));
    expect(cliRepair).toMatchObject({ status: "repaired", dryRun: false });
    expect(cliRepair.changedFiles).toEqual(cliPreview.changes.map((change) => change.path));
    expect(cliRepair.changedFiles).toContain("docs/designs/2026-01-01-example.md");
    expect(snapshot(root)).toEqual(snapshot(twin));
    expect(readFileSync(path.join(root, "docs/designs/2026-01-01-example.md"), "utf8")).toBe("# Example design\n\nA design paragraph that wraps onto a second line.\n");
  });
});

describe("W34 R0 P1 A4: repair previews first and needs write permission", () => {
  it("--dry-run and the default write nothing", async () => {
    const before = snapshot(root);
    const dry = JSON.parse(await captureStdout(() => runProjectCommand(["markdown", "repair", "--dry-run", "--target-root", root, "--json"]))) as MarkdownStyleRepairResult;
    expect(dry).toMatchObject({ status: "previewed", dryRun: true, changedFiles: [] });
    expect(dry.changes.map((change) => change.path)).toContain("docs/designs/2026-01-01-example.md");
    await captureStdout(() => runProjectCommand(["markdown", "repair", "--target-root", root]));
    expect(snapshot(root)).toEqual(before);
    const conflict = await captureStderr(() => runProjectCommand(["markdown", "repair", "--apply", "--dry-run", "--target-root", root]));
    expect(conflict).toBe("Markdown style error: --apply and --dry-run cannot be combined.\n");
    expect(process.exitCode).toBe(2);
    expect(snapshot(root)).toEqual(before);
  });

  it("an MCP dry run with apply writes nothing", async () => {
    const before = snapshot(root);
    const result = (await callMakeDocsMcpTool("project_markdown_repair", { targetRoot: root, allowWrite: true, apply: true, dryRun: true }, { profile: "setup" })).result;
    expect(result).toMatchObject({ status: "previewed", dryRun: true });
    expect(snapshot(root)).toEqual(before);
  });

  it("refuses without write permission and changes nothing", async () => {
    const before = snapshot(root);
    await expect(callMakeDocsMcpTool("project_markdown_repair", { targetRoot: root, apply: true }, { profile: "setup" })).rejects.toBeInstanceOf(OperationWriteDeniedError);
    await expect(
      invokeOperation("project.markdown-style.repair", { targetRoot: root, apply: true }, createExecutionContext({ writesAllowed: false, cwd: root })),
    ).rejects.toBeInstanceOf(OperationWriteDeniedError);
    expect(snapshot(root)).toEqual(before);
    expect(getOperation("project.markdown-style.repair")).toMatchObject({ mutates: "write", access: { project: "write", store: "none", hostConfig: "none" } });
  });

  it("the read-only commands change nothing", async () => {
    const before = snapshot(root);
    await captureStdout(() => runRunCommand(["check", "decomposition", "--target-root", root, "--json"]));
    await captureStdout(() => runProjectCommand(["relations", "list", "--target-root", root]));
    await captureStdout(() => runProjectCommand(["markdown", "validate", "--target-root", root]));
    expect(snapshot(root)).toEqual(before);
    for (const id of ["decomposition.output.validate", "project.relations.list", "project.markdown-style.validate"]) {
      expect(getOperation(id), id).toMatchObject({ mutates: "read", access: { project: "read", store: "none", hostConfig: "none" } });
    }
  });

  it("a path outside the project fails closed", async () => {
    expect(await captureStderr(() => runProjectCommand(["markdown", "validate", "--path", "../outside", "--target-root", root]))).toContain("outside the project");
    expect(process.exitCode).toBe(2);
    await expect(runProjectCommand(["relations", "list", "--path", "../outside", "--target-root", root])).rejects.toThrow("outside the project");
  });
});

describe("W34 R0 P1 A6: relations come from the Persona set, and each names its kind and source", () => {
  it("finds a guide in a custom Persona folder and leaves out a folder that is not a Persona", () => {
    const result = listProjectRelations({ targetRoot: root });
    const guides = result.folders.filter((folder) => folder.type === "guide");
    expect(guides.map((folder) => [folder.folder, folder.persona])).toEqual([
      ["docs/assets/user", "user"],
      ["docs/assets/maintainer", "maintainer"],
      ["docs/assets/reviewer", "reviewer"],
    ]);
    const paths = result.artifacts.map((artifact) => artifact.path);
    expect(paths).toContain("docs/assets/reviewer/review-guide.md");
    expect(paths).not.toContain("docs/assets/undeclared/stray.md");
    const guide = result.artifacts.find((artifact) => artifact.path === "docs/assets/reviewer/review-guide.md")!;
    expect(guide).toMatchObject({ type: "guide", persona: "reviewer" });
    expect(guide.lateral).toEqual([
      { target: "docs/plans/2026-01-02-w1-r0-example/", kind: "relations.related-front-matter", sourceFile: "docs/assets/reviewer/review-guide.md" },
    ]);
  });

  it("names the kind and the source file of every relation", () => {
    const result = listProjectRelations({ targetRoot: root });
    const relations = result.artifacts.flatMap((artifact) => [...artifact.upstream, ...artifact.downstream, ...artifact.lateral]);
    expect(relations.length).toBeGreaterThan(0);
    for (const relation of relations) {
      expect(RELATION_KIND_IDS).toContain(relation.kind);
      expect(relation.sourceFile).toMatch(/^(docs|\.make-docs)\//);
    }
    expect(new Set(relations.map((relation) => relation.kind))).toEqual(new Set(RELATION_KIND_IDS));
    const plan = result.artifacts.find((artifact) => artifact.path === "docs/plans/2026-01-02-w1-r0-example/")!;
    // A link with a #fragment still names its file (the script kept the fragment and missed it).
    expect(plan.upstream).toContainEqual({ target: "docs/designs/2026-01-01-example.md", kind: "relations.markdown-link", sourceFile: "docs/plans/2026-01-02-w1-r0-example/00-overview.md" });
    // A W/R coordinate does not match a longer number: W2 R10 does not match w2-r1.
    const short = result.artifacts.find((artifact) => artifact.path === "docs/plans/2026-01-06-w2-r1-short/")!;
    expect(short.lateral.filter((relation) => relation.kind === "relations.history-coordinate")).toEqual([]);
  });

  it("--path shows one artifact with its inbound and outbound relations", () => {
    const result = listProjectRelations({ targetRoot: root, path: "docs/plans/2026-01-02-w1-r0-example/" });
    expect(result.focus).toBe("docs/plans/2026-01-02-w1-r0-example/");
    expect(result.artifacts.map((artifact) => artifact.path)).toEqual(["docs/plans/2026-01-02-w1-r0-example/"]);
    const plan = result.artifacts[0]!;
    expect(plan.upstream.map((relation) => relation.target)).toContain("docs/designs/2026-01-01-example.md");
    expect(plan.downstream.map((relation) => relation.target)).toContain("docs/work/2026-01-03-w1-r0-example/");
    expect(plan.lateral.map((relation) => relation.target)).toEqual(expect.arrayContaining(["docs/assets/reviewer/review-guide.md", ".make-docs/archive/history/2026-01-04-w1-r0-p1-example.md"]));
    expect(listProjectRelations({ targetRoot: root, path: "docs/plans/none" }).summary).toMatch(/^No artifact matches docs\/plans\/none\. Read \d+ artifacts\. Changes nothing\.$/);
  });
});

describe("W34 R0 P1 A7: plain words first, totals before detail, each finding with its rule ID", () => {
  it("check decomposition", () => {
    const lines = renderDecompositionValidation(validateDecompositionOutput(root));
    expect(lines[0]).toMatch(/^Decomposition output check: failed\. Found \d+ findings in \d+ files or folders\. Changed nothing\.$/);
    expect(lines[2]).toMatch(/^By rule: /);
    const text = lines.join("\n");
    expect(text).toContain("  decomposition.task-id.sequence (line 10): task item in '## Stage 1 - Build' expected T2 but found T3");
    expect(text).toContain("  decomposition.acceptance.checkbox: acceptance criteria in '## Stage 1 - Build' must be plain bullets, not checkboxes: - [ ] Done.");
    expect(text).toContain("  decomposition.link.broken: broken link -> ../../prd/09-missing.md");
    expect(text).toContain("  decomposition.prd.core-file-missing: missing required core PRD file");
  });

  it("project markdown validate and repair", () => {
    const validate = renderMarkdownStyleValidate(validateMarkdownStyle({ targetRoot: root }));
    expect(validate.split("\n")[0]).toMatch(/^Markdown style check: Checked \d+ Markdown files\. Found \d+ findings in \d+ files: \d+ repair can fix, \d+ to review by hand\. Changes nothing\.$/);
    expect(validate).toContain("  markdown-style.paragraph-wrap (lines 2-3, repair can fix): Paragraph spans multiple source lines;");
  });

  it("project relations list", () => {
    const text = renderProjectRelations(listProjectRelations({ targetRoot: root }));
    expect(text.split("\n")[0]).toMatch(/^Document relations: Read \d+ artifacts and found \d+ relations: \d+ Markdown links, \d+ related: entries, \d+ history coordinates, and \d+ same-slug guesses\. Changes nothing\.$/);
    expect(text).toContain("  lateral -> docs/plans/2026-01-02-w1-r0-example/ [relations.related-front-matter, in docs/assets/reviewer/review-guide.md]");
  });
});

describe("W34 R0 P1 rule ID lists (R-SKILL-CHECK-7)", () => {
  it("each operation has one list of unique IDs under one prefix", () => {
    for (const [ids, prefix] of [[DECOMPOSITION_RULE_IDS, "decomposition."], [MARKDOWN_STYLE_RULE_IDS, "markdown-style."], [RELATION_KIND_IDS, "relations."]] as const) {
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(id.startsWith(prefix), id).toBe(true);
    }
    expect(DECOMPOSITION_RULES.every((rule) => rule.description.length > 0)).toBe(true);
    expect(MARKDOWN_STYLE_RULES.map((rule) => [rule.id, rule.fixable])).toEqual([
      ["markdown-style.block-spacing", true],
      ["markdown-style.paragraph-wrap", true],
      ["markdown-style.list-continuation-wrap", false],
    ]);
  });

  it("every finding names a rule in its operation's list", () => {
    for (const finding of validateDecompositionOutput(root).findings) expect(DECOMPOSITION_RULE_IDS).toContain(finding.ruleId);
    for (const finding of validateMarkdownStyle({ targetRoot: root }).findings) expect(MARKDOWN_STYLE_RULE_IDS).toContain(finding.ruleId);
  });
});

describe("W34 R0 P1 help", () => {
  const paths: Array<[string, string]> = [
    ["decomposition.output.validate", "check decomposition"],
    ["project.relations.list", "project relations list"],
    ["project.markdown-style.validate", "project markdown validate"],
    ["project.markdown-style.repair", "project markdown repair"],
  ];

  it.each(paths)("%s answers --help and -h from its leaf help", (id, cli) => {
    for (const flag of ["--help", "-h"]) {
      expect(resolveLeafHelp([...cli.split(" "), flag])).toBe(renderOperationLeafHelp(id));
    }
    expect(operationCliCommand(id).startsWith(`make-docs ${cli}`)).toBe(true);
    const help = renderOperationLeafHelp(id);
    expect(help).toContain(`make-docs ${cli}`);
    expect(help).toContain("--json");
  });
});

describe("W34 R0 P1 A5: PRD 25 R-MCP-PROFILE-11 matches the profile lists in code", () => {
  it("names each tool's profiles and access as the code does", () => {
    const prd25 = readFileSync(path.join(REPO_ROOT, "docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md"), "utf8");
    const line = prd25.split("\n").find((candidate) => candidate.startsWith("- R-MCP-PROFILE-11 "))!;
    expect(line).toBeDefined();
    const fromPrd = new Map<string, string[]>();
    for (const match of line.matchAll(/`([a-z_]+)` belongs to ((?:`[a-z]+`(?:, and |, | and )?)+)\./g)) {
      fromPrd.set(match[1]!, [...match[2]!.matchAll(/`([a-z]+)`/g)].map((found) => found[1]!).sort());
    }
    const tools = new Map(listMakeDocsMcpTools().map((tool) => [tool.name, tool]));
    const expected = new Map<string, string[]>();
    for (const name of ["check_decomposition", "project_relations_list", "project_markdown_validate", "project_markdown_repair"]) {
      expected.set(name, [...tools.get(name)!.mcp!.profiles, "all"].sort());
    }
    expect(fromPrd).toEqual(expected);
    expect(line).toContain("`check_decomposition`, `project_relations_list`, and `project_markdown_validate` read only");
    expect(line).toContain("`project_markdown_repair` needs the existing project write permission");
    expect(tools.get("project_markdown_repair")!.access).toMatchObject({ project: "write" });
  });
});

describe("W34 R0 P1 review fixes", () => {
  const ROUTER = "# Docs router\n<!-- make-docs:begin -->\n# Managed\nWrapped managed\ntext in a block.\n<!-- make-docs:end -->\n";

  function addOwnedFiles(): void {
    write(root, "docs/AGENTS.md", ROUTER);
    write(root, "docs/designs/CLAUDE.md", "# Router\nNo blank line here.\n");
    write(root, "docs/notes/with-block.md", ROUTER);
    write(root, "docs/node_modules/pkg/readme.md", "# Package\nWrapped\ntext.\n");
    write(root, "node_modules/pkg/readme.md", "# Package\nWrapped\ntext.\n");
    write(root, ".make-docs/backup/old.md", "# Backup\nWrapped\ntext.\n");
    write(root, ".make-docs/archive/history/old-wrapped.md", "# History\nWrapped\ntext.\n");
    write(root, "README.md", "# Readme\nWrapped\ntext.\n");
  }

  it("fix 1: validate and repair skip routers, managed blocks, and protected folders, and name each one", async () => {
    addOwnedFiles();
    const owned = ["docs/AGENTS.md", "docs/designs/CLAUDE.md", "docs/notes/with-block.md", "docs/node_modules/pkg/readme.md", "node_modules/pkg/readme.md", ".make-docs/backup/old.md", ".make-docs/archive/history/old-wrapped.md"];
    const before = Object.fromEntries(owned.map((file) => [file, readFileSync(path.join(root, file), "utf8")]));
    const validate = validateMarkdownStyle({ targetRoot: root });
    expect(validate.skipped).toEqual([
      { path: "docs/AGENTS.md", reason: "router-file" },
      { path: "docs/designs/CLAUDE.md", reason: "router-file" },
      { path: "docs/node_modules", reason: "protected-folder" },
      { path: "docs/notes/with-block.md", reason: "managed-block" },
    ]);
    const repair = JSON.parse(await captureStdout(() => runProjectCommand(["markdown", "repair", "--apply", "--target-root", root, "--json"]))) as MarkdownStyleRepairResult;
    expect(repair.skipped).toEqual(validate.skipped);
    for (const file of owned) expect(readFileSync(path.join(root, file), "utf8"), file).toBe(before[file]);
    // `--path .` reaches the whole project but still skips the protected folders.
    const whole = validateMarkdownStyle({ targetRoot: root, paths: ["."] });
    const files = new Set(whole.findings.map((finding) => finding.path));
    expect(files.has("README.md")).toBe(true);
    for (const file of owned) expect(files.has(file), file).toBe(false);
    expect(whole.skipped).toEqual(expect.arrayContaining([
      { path: "node_modules", reason: "protected-folder" },
      { path: ".make-docs/backup", reason: "protected-folder" },
      { path: ".make-docs/archive", reason: "protected-folder" },
    ]));
    // A protected folder named by --path fails closed.
    expect(() => validateMarkdownStyle({ targetRoot: root, paths: ["node_modules"] })).toThrow("protected folder");
    const plain = renderMarkdownStyleValidate(whole);
    expect(plain).toContain("Skipped: node_modules (protected folder, as project paths validate skips it)");
    expect(plain).toContain("Skipped: docs/AGENTS.md (instruction router file)");
    expect(plain).toContain("Skipped: docs/notes/with-block.md (holds a make-docs managed block)");
  });

  it("D-067: a file that only mentions the managed block marker is checked, not skipped", () => {
    write(root, "docs/notes/mentions-marker.md", "# Notes\nThe `<!-- make-docs:begin -->` marker opens a block.\nWrapped\ntext.\n");
    write(root, "docs/notes/real-block.md", "# Notes\n\n  <!-- make-docs:begin -->\nmanaged\n<!-- make-docs:end -->\n");
    const result = validateMarkdownStyle({ targetRoot: root, paths: ["docs/notes"] });
    expect(result.skipped).toContainEqual({ path: "docs/notes/real-block.md", reason: "managed-block" });
    expect(result.skipped.map((skip) => skip.path)).not.toContain("docs/notes/mentions-marker.md");
    expect(result.findings.some((finding) => finding.path === "docs/notes/mentions-marker.md")).toBe(true);
    expect(holdsManagedBlock("Use `<!-- make-docs:begin -->` here.")).toBe(false);
    expect(holdsManagedBlock("text\r\n<!-- make-docs:end -->\r\n")).toBe(true);
  });

  it("fix 3: the preview shows each exact change, and the edits give the repaired text", async () => {
    const preview = JSON.parse(await captureStdout(() => runProjectCommand(["markdown", "repair", "--path", "docs/designs", "--target-root", root, "--json"]))) as MarkdownStyleRepairResult;
    const change = preview.changes[0]!;
    expect(change.before).toBe("# Example design\nA design paragraph that wraps\nonto a second line.\n");
    expect(change.after).toBe("# Example design\n\nA design paragraph that wraps onto a second line.\n");
    expect(change.edits).toEqual([
      { ruleId: "markdown-style.block-spacing", startLine: 2, endLine: 2, removed: [], added: [""] },
      { ruleId: "markdown-style.paragraph-wrap", startLine: 2, endLine: 3, removed: ["A design paragraph that wraps", "onto a second line."], added: ["A design paragraph that wraps onto a second line."] },
    ]);
    for (const item of preview.changes) {
      const lines = item.before.replace(/\r\n?/g, "\n").split("\n");
      for (const edit of [...item.edits].reverse()) lines.splice(edit.startLine - 1, edit.removed.length, ...edit.added);
      expect(lines.join("\n"), item.path).toBe(item.after.replace(/\r\n/g, "\n"));
    }
    const text = await captureStdout(() => runProjectCommand(["markdown", "repair", "--path", "docs/designs", "--target-root", root]));
    expect(text).toContain([
      "Would change: docs/designs/2026-01-01-example.md (3 lines -> 3 lines)",
      "  markdown-style.block-spacing: add a blank line before line 2",
      "  markdown-style.paragraph-wrap: join lines 2-3 into one line",
      "    - A design paragraph that wraps",
      "    - onto a second line.",
      "    + A design paragraph that wraps onto a second line.",
    ].join("\n"));
  });

  it("fix 4: exit codes match project paths validate and repair", async () => {
    const clean = path.join(temp, "clean");
    write(clean, "docs/clean.md", "# Clean\n\nOne line.\n");
    await captureStdout(() => runProjectCommand(["markdown", "validate", "--target-root", clean]));
    expect(process.exitCode).toBe(0);
    await captureStdout(() => runProjectCommand(["markdown", "validate", "--target-root", root]));
    expect(process.exitCode).toBe(1);
    await captureStdout(() => runProjectCommand(["markdown", "repair", "--path", "docs/designs", "--target-root", root]));
    expect(process.exitCode).toBe(1);
    await captureStdout(() => runProjectCommand(["markdown", "repair", "--apply", "--path", "docs/designs", "--target-root", root]));
    expect(process.exitCode).toBe(0);
    write(root, "docs/lists/list.md", "- A list item that wraps\n  onto a second line.\n");
    await captureStdout(() => runProjectCommand(["markdown", "repair", "--apply", "--path", "docs/lists", "--target-root", root]));
    expect(process.exitCode).toBe(1);
    expect(await captureStderr(() => runProjectCommand(["markdown", "validate", "--path", "docs/none", "--target-root", root]))).toContain("does not exist");
    expect(process.exitCode).toBe(2);
    // The paths pair uses the same codes.
    await captureStdout(() => runProjectCommand(["markdown", "validate", "--target-root", clean]));
    expect(renderOperationLeafHelp("project.markdown-style.validate")).toContain("Exit codes: 0 when it finds nothing, 1 when it finds a problem, 2 on an error");
    expect(renderOperationLeafHelp("project.markdown-style.repair")).toContain("Exit codes: 0 when no finding is left, 1 when a finding is left, 2 on an error");
  });

  it("fix 5: check decomposition skips a symbolic link in docs/prd and docs/work", () => {
    try {
      symlinkSync(path.join(temp, "outside.md"), path.join(root, "docs/prd/05-linked.md"));
      writeFileSync(path.join(temp, "outside.md"), "[gone](./missing.md)\n");
    } catch {
      return; // This platform cannot make links.
    }
    const result = validateDecompositionOutput(root);
    expect(result.findings.filter((finding) => finding.path === "docs/prd/05-linked.md" && finding.ruleId !== "decomposition.prd.file-name")).toEqual([]);
  });

  it("fix 6: relations list names each docs/assets folder that is not a Persona", async () => {
    const json = JSON.parse(await captureStdout(() => runProjectCommand(["relations", "list", "--target-root", root, "--json"]))) as ProjectRelationsResult;
    expect(json.skippedFolders).toEqual([{ folder: "docs/assets/undeclared", reason: "not-a-persona" }]);
    const text = await captureStdout(() => runProjectCommand(["relations", "list", "--target-root", root]));
    expect(text).toContain("Skipped: docs/assets/undeclared (not a configured Persona folder; make-docs project persona list shows the Personas)");
    write(root, "docs/assets/project/shared.md", "# Shared\n");
    expect(listProjectRelations({ targetRoot: root }).skippedFolders).toEqual([{ folder: "docs/assets/undeclared", reason: "not-a-persona" }]);
  });
});
