import { homedir } from "node:os";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { getDesiredSkillAssets } from "../src/skill-catalog";
import { defaultSelections } from "../src/profile";
import { mockSkillFetches } from "./helpers";

describe("skill catalog", () => {
  beforeEach(() => {
    mockSkillFetches();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("returns no assets when skills are disabled", async () => {
    const selections = defaultSelections();
    selections.skills = false;

    await expect(getDesiredSkillAssets(selections)).resolves.toEqual([]);
  });

  test("builds harness-specific skill directories with supporting files", async () => {
    const assets = await getDesiredSkillAssets(defaultSelections());
    const archiveSkillForClaude = assets.find(
      (asset) => asset.relativePath === ".claude/skills/archive-docs/SKILL.md",
    );
    const archiveSkillForCodex = assets.find(
      (asset) => asset.relativePath === ".agents/skills/archive-docs/SKILL.md",
    );

    expect(archiveSkillForClaude).toBeDefined();
    expect(archiveSkillForCodex).toBeDefined();
    expect(
      assets.some(
        (asset) =>
          asset.relativePath ===
          ".claude/skills/archive-docs/references/archive-workflow.md",
      ),
    ).toBe(true);
    expect(
      assets.some(
        (asset) =>
          asset.relativePath === ".agents/skills/archive-docs/scripts/trace_relationships.py",
      ),
    ).toBe(true);
    expect(
      assets.some(
        (asset) => asset.relativePath === ".claude/skills/archive-docs/agents/openai.yaml",
      ),
    ).toBe(true);
    expect(archiveSkillForClaude?.content).toContain("./references/archive-workflow.md");
    expect(archiveSkillForClaude?.content).toContain("./scripts/trace_relationships.py");
    expect(archiveSkillForCodex?.content).toContain("./references/archive-workflow.md");
  });

  test("uses the home directory for global scope and omits deselected harnesses", async () => {
    const selections = defaultSelections();
    selections.harnesses.codex = false;
    selections.skillScope = "global";

    const assets = await getDesiredSkillAssets(selections);

    expect(assets.length).toBeGreaterThan(0);
    expect(
      assets.every((asset) => asset.relativePath.startsWith(`${homedir()}/.claude/`)),
    ).toBe(true);
    expect(assets.some((asset) => asset.relativePath.includes(".agents/"))).toBe(false);
  });

  test("installs optional skills only when explicitly selected", async () => {
    const withoutOptional = await getDesiredSkillAssets(defaultSelections());
    expect(
      withoutOptional.some(
        (asset) => asset.relativePath === ".claude/skills/decompose-codebase/SKILL.md",
      ),
    ).toBe(false);

    const selections = defaultSelections();
    selections.optionalSkills = ["decompose-codebase"];

    const withOptional = await getDesiredSkillAssets(selections);
    expect(
      withOptional.some(
        (asset) => asset.relativePath === ".claude/skills/decompose-codebase/SKILL.md",
      ),
    ).toBe(true);
    expect(
      withOptional.some(
        (asset) =>
          asset.relativePath === ".agents/skills/decompose-codebase/references/mcp-playbook.md",
      ),
    ).toBe(true);
  });
});
