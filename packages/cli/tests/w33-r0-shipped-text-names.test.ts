/**
 * W33 R0 P4 shipped-text test (PRD 39 R-NAME-6).
 *
 * Shipped text must name only commands and MCP tools that the name catalog
 * has. The scan reads inline code and fenced code blocks. It fails on a
 * `make-docs <path>` that is not a catalog, setup, or group path, and on an
 * MCP tool name that is a former catalog name. A Requirement History or
 * Change History section, and the table rows right after a
 * `<!-- make-docs:former-names -->` marker line, may keep the names they recorded.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { NAME_CATALOG, NAME_GROUPS, NON_REGISTRY_COMMANDS, type NameCatalogEntry } from "../src/operations/name-catalog";
import { PACKAGE_ROOT } from "../src/utils";

const REPO_ROOT = path.resolve(PACKAGE_ROOT, "../..");

/** The marker that lets the table rows right after it (lines that start with `|`) keep former names on purpose. */
const FORMER_NAMES_MARKER = "<!-- make-docs:former-names -->";

const HISTORY_HEADING = /^(#{1,6})\s.*\b(Requirement History|Change History)\b/;

interface StaleName {
  line: number;
  kind: "cli" | "mcp";
  name: string;
  current?: string;
}

interface CommandTree {
  leaves: Set<string>;
  branches: Set<string>;
  formerCli: Map<string, string>;
  formerMcp: Map<string, string>;
}

function buildCommandTree(entries: readonly NameCatalogEntry[]): CommandTree {
  const leaves = new Set<string>([...NON_REGISTRY_COMMANDS]);
  for (const item of entries) {
    // An MCP-only entry (ND-10) has no CLI command.
    if (item.status === "current" && item.currentCli === null) continue;
    leaves.add(item.newCli);
  }
  const branches = new Set<string>(NAME_GROUPS);
  for (const leaf of leaves) {
    const words = leaf.split(" ");
    for (let size = 1; size < words.length; size += 1) branches.add(words.slice(0, size).join(" "));
  }
  const newMcp = new Set(entries.map((item) => item.newMcp));
  const formerCli = new Map<string, string>();
  const formerMcp = new Map<string, string>();
  for (const item of entries) {
    if (item.formerCli && item.formerCli !== item.newCli) formerCli.set(item.formerCli, item.newCli);
    // One-word former names (`personas`, `config`, ...) are common words, so only snake-case names are checked.
    if (item.formerMcp && item.formerMcp.includes("_") && !newMcp.has(item.formerMcp)) formerMcp.set(item.formerMcp, item.newMcp);
  }
  return { leaves, branches, formerCli, formerMcp };
}

/** Lines that count: history sections and marked blocks are blanked, keeping line numbers. */
function currentTextLines(markdown: string): string[] {
  const lines = markdown.replace(/^﻿/, "").split(/\r?\n/);
  let historyLevel = 0;
  let marked = false;
  return lines.map((line) => {
    const heading = line.match(/^(#{1,6})\s/);
    if (heading) {
      if (historyLevel && heading[1]!.length <= historyLevel) historyLevel = 0;
      const history = !historyLevel && line.match(HISTORY_HEADING);
      if (history) historyLevel = history[1]!.length;
    }
    if (historyLevel) return "";
    if (line.trim() === FORMER_NAMES_MARKER) {
      marked = true;
      return "";
    }
    if (marked) {
      if (/^\s*\|/.test(line)) return "";
      // Any line that is not a table row ends the marked table, and that line counts.
      marked = false;
    }
    return line;
  });
}

/** Code text per line: fenced code block lines whole, and each inline code span on its own line. */
function codeTextLines(lines: readonly string[]): string[] {
  let fence: string | null = null;
  return lines.map((line) => {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      if (fenceMatch && fenceMatch[1]!.startsWith(fence)) fence = null;
      return fence ? line : "";
    }
    if (fenceMatch) {
      fence = fenceMatch[1]!;
      return "";
    }
    return [...line.matchAll(/(`+)([^`]+?)\1/g)].map((found) => found[2]!).join("\n");
  });
}

const COMMAND_WORD = /^[a-z][a-z0-9-]*$/;

/**
 * A command starts a code line or span, or follows a shell joiner (`&&`,
 * `||`, `;`, `|`, `(`) or a `$` prompt. Environment assignments such as
 * `MAKE_DOCS_HOME=x` may come first. The program is `make-docs`,
 * `npx [-y] [@brucewaynedecoy/]make-docs[@<tag>]`, or
 * `node <path>/dist/index.js`. Prose inside a code block, such as an example
 * commit message, is not a command.
 */
const COMMAND_START = new RegExp(
  [
    String.raw`(?:^|&&|\|\||[;|($])[ \t]*`,
    String.raw`(?:[A-Z_][A-Z0-9_]*=\S*[ \t]+)*`,
    String.raw`(?:make-docs|npx[ \t]+(?:(?:-y|--yes)[ \t]+)?(?:@brucewaynedecoy\/)?make-docs(?:@[^\s/]+)?|node[ \t]+(?:\S*\/)?dist\/index\.js)`,
    String.raw`(?=[ \t])([^\n;&|]*)`,
  ].join(""),
  "gm",
);

/** A code span or code line that starts with a former `run` root path, with no program before it. */
const BARE_RUN = /^[ \t]*(run[ \t]+(?:work|backlog|lifecycle|factory|prd|performance|uat)\b[^\n;&|]*)/gm;

const SNAKE_TOKEN = /(?<![\w-])[a-z][a-z0-9]*(?:_[a-z0-9]+)+(?![\w-])/g;

function checkCommand(words: readonly string[], tree: CommandTree): { ok: boolean; current?: string } {
  if (words.length === 0) return { ok: true };
  if (tree.branches.has(words.join(" "))) return { ok: true };
  for (const [former, current] of tree.formerCli) {
    const formerWords = former.split(" ");
    if (formerWords.every((word, index) => words[index] === word)) return { ok: false, current };
  }
  let leafSize = 0;
  for (let size = words.length; size > 0; size -= 1) {
    if (tree.leaves.has(words.slice(0, size).join(" "))) {
      leafSize = size;
      break;
    }
  }
  if (leafSize === 0) return { ok: tree.branches.has(words.join(" ")) };
  // A word after a full command is an argument, unless it reaches into a deeper known path.
  if (leafSize < words.length && tree.branches.has(words.slice(0, leafSize + 1).join(" "))) return { ok: false };
  return { ok: true };
}

function findStaleNames(markdown: string, tree: CommandTree): StaleName[] {
  const problems: StaleName[] = [];
  codeTextLines(currentTextLines(markdown)).forEach((code, index) => {
    if (!code) return;
    const commandTails = [
      ...[...code.matchAll(COMMAND_START)].map((found) => found[1]!),
      ...[...code.matchAll(BARE_RUN)].map((found) => found[1]!),
    ];
    for (const tail of commandTails) {
      const words: string[] = [];
      for (const token of tail.trim().split(/[ \t]+/)) {
        if (!COMMAND_WORD.test(token)) break;
        words.push(token);
      }
      const result = checkCommand(words, tree);
      if (!result.ok) problems.push({ line: index + 1, kind: "cli", name: `make-docs ${words.join(" ")}`, current: result.current });
    }
    for (const found of code.matchAll(SNAKE_TOKEN)) {
      const current = tree.formerMcp.get(found[0]);
      if (current) problems.push({ line: index + 1, kind: "mcp", name: found[0], current });
    }
  });
  return problems;
}

function walk(root: string, accept: (file: string) => boolean): string[] {
  if (!existsSync(root)) return [];
  if (statSync(root).isFile()) return accept(root) ? [root] : [];
  const files: string[] = [];
  for (const name of readdirSync(root)) {
    if (name === "node_modules" || name === "__pycache__") continue;
    files.push(...walk(path.join(root, name), accept));
  }
  return files;
}

const isMarkdown = (file: string) => file.endsWith(".md");

/** Shipped text under PRD 39 R-NAME-6, as repository-relative paths. */
function shippedTextFiles(repoRoot = REPO_ROOT): string[] {
  const template = path.join(repoRoot, "packages/docs/template");
  const templateFiles = walk(template, isMarkdown);
  const dogfood = templateFiles.map((file) => path.join(repoRoot, path.relative(template, file)));
  const routers = walk(path.join(repoRoot, "docs"), (file) => /[\\/](AGENTS|CLAUDE)\.md$/.test(file));
  const files = [
    ...templateFiles,
    ...dogfood,
    ...walk(path.join(repoRoot, "packages/skills"), isMarkdown),
    ...walk(path.join(repoRoot, ".agents/skills"), isMarkdown),
    ...[
      "README.md",
      "AGENTS.md",
      "CLAUDE.md",
      "CONTRIBUTING.md",
      "RELEASING.md",
      "SECURITY.md",
      ".github/PULL_REQUEST_TEMPLATE.md",
      "packages/cli/README.md",
      "packages/docs/README.md",
      "packages/cli/src/README.md",
      "packages/cli/src/store/README.md",
    ].map((file) => path.join(repoRoot, file)),
    ...walk(path.join(repoRoot, "docs/assets/user"), isMarkdown),
    ...walk(path.join(repoRoot, "docs/assets/maintainer"), isMarkdown),
    // The register records decisions as they were made, so it keeps the names it recorded.
    ...walk(path.join(repoRoot, "docs/prd"), isMarkdown).filter((file) => !file.endsWith("03-open-questions-and-risk-register.md")),
    ...routers,
  ];
  return [...new Set(files.filter((file) => existsSync(file)).map((file) => path.relative(repoRoot, file).split(path.sep).join("/")))].sort();
}

const TREE = buildCommandTree(NAME_CATALOG);

describe("W33 R0 P4 shipped text names only current commands and tools (PRD 39 R-NAME-6)", () => {
  it("covers the template, the dogfood copy, Skills, READMEs, guides, and current PRDs", () => {
    const files = shippedTextFiles();
    for (const expected of [
      "packages/docs/template/docs/prd/CLAUDE.md",
      "docs/prd/CLAUDE.md",
      ".make-docs/system/references/naive-uat-validation.md",
      "packages/skills/backlog-review/SKILL.md",
      ".agents/skills/backlog-review/references/cache.md",
      "packages/skills/naive-uat/SKILL.md",
      "README.md",
      "packages/cli/README.md",
      "CONTRIBUTING.md",
      "RELEASING.md",
      "SECURITY.md",
      ".github/PULL_REQUEST_TEMPLATE.md",
      "packages/cli/src/store/README.md",
      "docs/assets/user/cli-lifecycle-managing-installations.md",
      "docs/prd/00-index.md",
      "docs/prd/39-cli-command-model-and-operation-registry.md",
    ]) {
      expect(files, expected).toContain(expected);
    }
    expect(files).not.toContain("docs/prd/03-open-questions-and-risk-register.md");
    for (const excluded of ["docs/assets/project/", "docs/plans/", "docs/designs/", "docs/work/2026-"]) {
      // Router files under these folders are shipped routers, so only other files are excluded.
      expect(files.some((file) => file.startsWith(excluded) && !/\/(AGENTS|CLAUDE)\.md$/.test(file)), excluded).toBe(false);
    }
    expect(files.some((file) => file.startsWith(".make-docs/archive/history/"))).toBe(false);
    expect(files.length).toBeGreaterThan(200);
  });

  it("finds no former or unknown command or tool name", () => {
    const problems: string[] = [];
    for (const file of shippedTextFiles()) {
      for (const stale of findStaleNames(readFileSync(path.join(REPO_ROOT, file), "utf8"), TREE)) {
        problems.push(`${file}:${stale.line}: ${stale.kind} \`${stale.name}\`${stale.current ? ` -> \`${stale.current}\`` : ""}`);
      }
    }
    expect(problems).toEqual([]);
  });
});

describe("W33 R0 P4 shipped-text scan fails on stale names", () => {
  const scan = (markdown: string) => findStaleNames(markdown, TREE).map((item) => `${item.line}:${item.kind}:${item.name}:${item.current ?? ""}`);

  it("flags former CLI paths and names the current one", () => {
    expect(scan("Run `make-docs run prd authority validate --target-root .`.")).toEqual(["1:cli:make-docs run prd authority validate:check prd"]);
    expect(scan("```bash\nmake-docs project path-hygiene validate --format json\n```")).toEqual([
      "2:cli:make-docs project path-hygiene validate:project paths validate",
    ]);
    expect(scan("`make-docs project checkout-move preview`")).toEqual(["1:cli:make-docs project checkout-move preview:project move preview"]);
    expect(scan("`make-docs run lifecycle <verb>`")).toEqual(["1:cli:make-docs run lifecycle:"]);
    expect(scan("```bash\nnpm run build && npx make-docs run work backlog snapshot --json\n```")).toEqual([
      "2:cli:make-docs run work backlog snapshot:backlog snapshot",
    ]);
    expect(scan("Run `make-docs run factory restore`.")).toEqual(["1:cli:make-docs run factory restore:"]);
  });

  it("flags env prefixes, npx package specs, node dist/index.js, and bare `run` spans", () => {
    expect(scan("`MAKE_DOCS_HOME=/tmp/x make-docs run lifecycle list`")).toEqual(["1:cli:make-docs run lifecycle list:lifecycle list"]);
    expect(scan("```bash\nFOO=1 BAR=2 make-docs project path-hygiene repair\n```")).toEqual([
      "2:cli:make-docs project path-hygiene repair:project paths repair",
    ]);
    expect(scan("`npx @brucewaynedecoy/make-docs@latest run prd authority validate`")).toEqual(["1:cli:make-docs run prd authority validate:check prd"]);
    expect(scan("`npx -y @brucewaynedecoy/make-docs@2.0.9 run uat result validate`")).toEqual(["1:cli:make-docs run uat result validate:check uat result"]);
    expect(scan("`npx make-docs project checkout-register apply`")).toEqual(["1:cli:make-docs project checkout-register apply:project checkout apply"]);
    expect(scan("```bash\nnode packages/cli/dist/index.js run prd authority validate --target-root .\n```")).toEqual([
      "2:cli:make-docs run prd authority validate:check prd",
    ]);
    expect(scan("`node ../make-docs/packages/cli/dist/index.js run work evidence read`")).toEqual(["1:cli:make-docs run work evidence read:work evidence read"]);
    expect(scan("`node dist/index.js check prd-authority`")).toEqual(["1:cli:make-docs check prd-authority:"]);
    expect(scan("Use `run work backlog snapshot` or `run lifecycle <verb>`.")).toEqual([
      "1:cli:make-docs run work backlog snapshot:backlog snapshot",
      "1:cli:make-docs run lifecycle:",
    ]);
    for (const root of ["work", "backlog", "lifecycle", "factory", "prd", "performance", "uat"]) {
      expect(scan(`\`run ${root} x\``), root).toHaveLength(1);
    }
  });

  it("accepts a known group or branch path with only flags after it", () => {
    expect(scan("Run `make-docs setup store`, `make-docs setup store --help`, `make-docs check uat --help`, and `make-docs backlog review`.")).toEqual([]);
    expect(scan("`MAKE_DOCS_HOME=/tmp/x npx @brucewaynedecoy/make-docs@latest check prd` and `node packages/cli/dist/index.js backlog snapshot`")).toEqual([]);
    expect(scan("`npm run build`, `run package`, and `run the setup` are not former paths.")).toEqual([]);
  });

  it("flags an unknown path and a wrong word after a full command", () => {
    expect(scan("`make-docs check prd-authority`")).toEqual(["1:cli:make-docs check prd-authority:"]);
    expect(scan("`make-docs backlog cache read`")).toEqual(["1:cli:make-docs backlog cache read:"]);
    expect(scan("`make-docs setup store fix`")).toEqual(["1:cli:make-docs setup store fix:"]);
  });

  it("flags a former MCP tool name", () => {
    expect(scan("Call `backlog_cache_read` first.")).toEqual(["1:mcp:backlog_cache_read:backlog_cache_lookup"]);
    expect(scan('```json\n{"tool": "checkout_move_preview"}\n```')).toEqual(["2:mcp:checkout_move_preview:project_move_preview"]);
  });

  it("accepts current paths, groups, arguments, and prose", () => {
    expect(
      scan(
        [
          "Run `make-docs check prd --target-root <project>` and `make-docs backlog cache lookup \\`.",
          "Use `make-docs lifecycle <verb>`, `make-docs project surface ensure archive`, `make-docs work item resolve 'W18 R11 P2'`.",
          "Run `make-docs`, `make-docs --help`, `make-docs setup --yes`, `make-docs setup system --dry-run`, and `make-docs mcp`.",
          "Read `make-docs://system/reference/lifecycle.md` with `npx @brucewaynedecoy/make-docs@latest setup`.",
          "The make-docs run step and the make-docs CLI are prose, not code.",
          "Planned: `make-docs work next`, `make-docs factory workflow save`. Tools: `check_prd`, `project_state_status`.",
          "```text",
          "plan: moves make-docs runtime state out of docs/.",
          "```",
        ].join("\n"),
      ),
    ).toEqual([]);
  });

  it("skips Requirement History, Change History, and a marked migration table", () => {
    const markdown = [
      "# Doc",
      "",
      FORMER_NAMES_MARKER,
      "| Former | Current |",
      "| --- | --- |",
      "| `make-docs run prd authority validate` | `make-docs check prd` |",
      "",
      "Then `make-docs run lifecycle start` is stale.",
      "",
      "## Requirement History",
      "",
      "### 2026-11-22 — W33 R0",
      "",
      "- Previous contract: `make-docs run work backlog snapshot` and `evidence_record`.",
      "",
      "## Change History",
      "",
      "- `prd_validate` was the tool.",
      "",
      "## Source Anchors",
      "",
      "- `make-docs project path-hygiene repair`",
    ].join("\n");
    expect(scan(markdown)).toEqual(["8:cli:make-docs run lifecycle start:lifecycle start", "22:cli:make-docs project path-hygiene repair:project paths repair"]);
  });

  it("hides only the table rows right after the marker", () => {
    const markdown = [
      FORMER_NAMES_MARKER,
      "| Former | Current |",
      "| --- | --- |",
      "| `make-docs run lifecycle list` | `make-docs lifecycle list` |",
      "After the table: `make-docs run lifecycle show`.",
      "",
      FORMER_NAMES_MARKER,
      "",
      "| `make-docs run lifecycle pause` | after a blank line |",
      "",
      FORMER_NAMES_MARKER,
      "Not a table: `make-docs run lifecycle resume`.",
    ].join("\n");
    expect(scan(markdown)).toEqual([
      "5:cli:make-docs run lifecycle show:lifecycle show",
      "9:cli:make-docs run lifecycle pause:lifecycle pause",
      "12:cli:make-docs run lifecycle resume:lifecycle resume",
    ]);
  });

  it("knows no MCP-only entry as a CLI command", () => {
    expect(TREE.leaves.has("setup status")).toBe(false);
    expect(TREE.leaves.has("mcp domains list")).toBe(false);
    expect(TREE.leaves.has("check prd")).toBe(true);
  });
});
