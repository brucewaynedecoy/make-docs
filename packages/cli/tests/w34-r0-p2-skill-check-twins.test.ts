/**
 * W34 R0 P2 twin rule ID test (PRD 25 R-SKILL-RUNTIME-7, PRD 39 R-SKILL-CHECK-7).
 *
 * Each Skill check operation and its agent form in the Skill text share one
 * rule ID list. This test reads the rule list of each operation and the
 * Markdown text of its Skill, and fails when a rule ID exists on one side
 * only. It also checks the MCP tool, CLI command, manual review order of the
 * Skill text, and that the three Skills name no script path and no MCP server.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { DECOMPOSITION_RULE_IDS } from "../src/operations/decomposition/output";
import { MARKDOWN_STYLE_RULE_IDS } from "../src/operations/project/markdown-style";
import { RELATION_KIND_IDS } from "../src/operations/project/relations";
import { PACKAGE_ROOT } from "../src/utils";

const SKILLS_ROOT = path.resolve(PACKAGE_ROOT, "../skills");

interface TwinSpec {
  skill: string;
  prefix: string;
  operationIds: readonly string[];
  mcpTools: readonly string[];
  cliCommands: readonly string[];
}

const TWINS: readonly TwinSpec[] = [
  {
    skill: "decompose-codebase",
    prefix: "decomposition.",
    operationIds: DECOMPOSITION_RULE_IDS,
    mcpTools: ["check_decomposition"],
    cliCommands: ["make-docs check decomposition"],
  },
  {
    skill: "archive-docs",
    prefix: "relations.",
    operationIds: RELATION_KIND_IDS,
    mcpTools: ["project_relations_list"],
    cliCommands: ["make-docs project relations list"],
  },
  {
    skill: "cleanup-docs",
    prefix: "markdown-style.",
    operationIds: MARKDOWN_STYLE_RULE_IDS,
    mcpTools: ["project_markdown_validate", "project_markdown_repair"],
    cliCommands: ["make-docs project markdown validate", "make-docs project markdown repair"],
  },
];

/** Every Markdown file of a Skill, outside its `scripts/` folder. */
function skillMarkdownFiles(skillRoot: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(skillRoot).sort()) {
    const full = path.join(skillRoot, name);
    if (statSync(full).isDirectory()) {
      if (name === "scripts") continue;
      files.push(...skillMarkdownFiles(full));
    } else if (name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files;
}

function skillTextFiles(skillRoot: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(skillRoot).sort()) {
    const full = path.join(skillRoot, name);
    if (statSync(full).isDirectory()) {
      if (name === "scripts") continue;
      files.push(...skillTextFiles(full));
    } else if (/\.(md|ya?ml)$/.test(name)) {
      files.push(full);
    }
  }
  return files;
}

/** Rule IDs that the Skill text names in inline code, such as `` `markdown-style.block-spacing` ``. */
export function skillRuleIds(texts: readonly string[], prefix: string): Set<string> {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp("`(" + escaped + "[a-z0-9-]+(?:\\.[a-z0-9-]+)*)`", "g");
  const ids = new Set<string>();
  for (const text of texts) for (const match of text.matchAll(pattern)) ids.add(match[1]!);
  return ids;
}

export interface TwinComparison {
  operationOnly: string[];
  skillOnly: string[];
}

export function compareTwinRuleIds(operationIds: readonly string[], texts: readonly string[], prefix: string): TwinComparison {
  const skillIds = skillRuleIds(texts, prefix);
  const operation = new Set(operationIds);
  return {
    operationOnly: [...operation].filter((id) => !skillIds.has(id)).sort(),
    skillOnly: [...skillIds].filter((id) => !operation.has(id)).sort(),
  };
}

function readSkillTexts(skill: string): string[] {
  return skillMarkdownFiles(path.join(SKILLS_ROOT, skill)).map((file) => readFileSync(file, "utf8"));
}

describe("W34 R0 P2 Skill check twins", () => {
  for (const twin of TWINS) {
    it(`${twin.skill} names every ${twin.prefix}* rule ID of its operation, and no other`, () => {
      expect(twin.operationIds.length).toBeGreaterThan(0);
      expect(compareTwinRuleIds(twin.operationIds, readSkillTexts(twin.skill), twin.prefix)).toEqual({
        operationOnly: [],
        skillOnly: [],
      });
    });

    it(`${twin.skill} names the MCP tool, then the CLI command, then the manual review`, () => {
      const skillMd = readFileSync(path.join(SKILLS_ROOT, twin.skill, "SKILL.md"), "utf8");
      const mcp = skillMd.indexOf(`\`${twin.mcpTools[0]}\``);
      const cli = skillMd.indexOf(twin.cliCommands[0]!);
      const manual = skillMd.indexOf("Manual review:", cli);
      expect(mcp, "MCP tool").toBeGreaterThan(-1);
      expect(cli, "CLI command").toBeGreaterThan(mcp);
      expect(manual, "manual review step").toBeGreaterThan(cli);
      for (const tool of twin.mcpTools) expect(skillMd).toContain(`\`${tool}\``);
      for (const command of twin.cliCommands) expect(skillMd).toContain(command);
      expect(skillMd).toContain("says that it is a manual review");
      expect(skillMd).toContain("`agent-reviewed`");
      expect(skillMd).toContain("does not say that a Make Docs check ran");
      expect(skillMd).toContain("without the person's consent");
    });

    it(`${twin.skill} names no script path`, () => {
      for (const file of skillTextFiles(path.join(SKILLS_ROOT, twin.skill))) {
        const text = readFileSync(file, "utf8");
        expect(text, path.relative(SKILLS_ROOT, file)).not.toMatch(/\.py\b/);
        expect(text, path.relative(SKILLS_ROOT, file)).not.toContain("scripts/");
      }
    });
  }

  it("the three Skills name no MCP server and no vendor delegation tool (PD-1)", () => {
    for (const skill of ["decompose-codebase", "archive-docs", "cleanup-docs"]) {
      for (const file of skillTextFiles(path.join(SKILLS_ROOT, skill))) {
        const text = readFileSync(file, "utf8");
        expect(text, path.relative(SKILLS_ROOT, file)).not.toMatch(/jdocmunch|jcodemunch|probe_environment|spawn_agent/);
      }
    }
  });

  it("cleanup-docs asks for agreement before a manual repair", () => {
    const skillMd = readFileSync(path.join(SKILLS_ROOT, "cleanup-docs", "SKILL.md"), "utf8");
    expect(skillMd).toContain("A manual repair needs the person's agreement before you change a file.");
  });

  describe("fixtures", () => {
    const operationIds = ["fixture.alpha", "fixture.beta"];

    it("passes when both sides name the same IDs", () => {
      expect(compareTwinRuleIds(operationIds, ["Rules: `fixture.alpha` and `fixture.beta`."], "fixture.")).toEqual({
        operationOnly: [],
        skillOnly: [],
      });
    });

    it("fails on a rule ID in the operation only", () => {
      expect(compareTwinRuleIds(operationIds, ["Rules: `fixture.alpha`."], "fixture.")).toEqual({
        operationOnly: ["fixture.beta"],
        skillOnly: [],
      });
    });

    it("fails on a rule ID in the Skill text only", () => {
      expect(
        compareTwinRuleIds(operationIds, ["Rules: `fixture.alpha`, `fixture.beta`, and `fixture.gamma`."], "fixture."),
      ).toEqual({ operationOnly: [], skillOnly: ["fixture.gamma"] });
    });

    it("reads only inline code with the prefix", () => {
      const texts = ["fixture.beta in prose, `project.fixture.alpha`, and `fixture.alpha.sub`."];
      expect([...skillRuleIds(texts, "fixture.")]).toEqual(["fixture.alpha.sub"]);
    });
  });
});
