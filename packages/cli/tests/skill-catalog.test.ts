import { homedir } from "node:os";
import { describe, expect, test } from "vitest";
import { getDesiredSkillAssets } from "../src/skill-catalog";
import { defaultSelections } from "../src/profile";

describe("skill catalog", () => {
  test("returns no assets when skills are disabled", () => {
    const selections = defaultSelections();
    selections.skills = false;

    expect(getDesiredSkillAssets(selections)).toEqual([]);
  });

  test("builds harness-specific skill and asset paths and rewrites references", () => {
    const assets = getDesiredSkillAssets(defaultSelections());
    const archiveSkillForClaude = assets.find(
      (asset) => asset.relativePath === ".claude/skills/archive-docs-archive.md",
    );
    const archiveSkillForCodex = assets.find(
      (asset) => asset.relativePath === ".agents/skills/archive-docs-archive.md",
    );

    expect(archiveSkillForClaude).toBeDefined();
    expect(archiveSkillForCodex).toBeDefined();
    expect(
      assets.some(
        (asset) =>
          asset.relativePath ===
          ".claude/skill-assets/archive-docs/references/archive-workflow.md",
      ),
    ).toBe(true);
    expect(
      assets.some(
        (asset) =>
          asset.relativePath === ".agents/skill-assets/archive-docs/scripts/trace_relationships.py",
      ),
    ).toBe(true);
    expect(archiveSkillForClaude?.content).toContain(
      "../skill-assets/archive-docs/references/archive-workflow.md",
    );
    expect(archiveSkillForClaude?.content).toContain(
      "../skill-assets/archive-docs/scripts/trace_relationships.py",
    );
    expect(archiveSkillForCodex?.content).toContain(
      "../skill-assets/archive-docs/references/archive-workflow.md",
    );
  });

  test("uses the home directory for global scope and omits deselected harnesses", () => {
    const selections = defaultSelections();
    selections.harnesses.codex = false;
    selections.skillScope = "global";

    const assets = getDesiredSkillAssets(selections);

    expect(assets.length).toBeGreaterThan(0);
    expect(
      assets.every((asset) => asset.relativePath.startsWith(`${homedir()}/.claude/`)),
    ).toBe(true);
    expect(assets.some((asset) => asset.relativePath.includes(".agents/"))).toBe(false);
  });
});
