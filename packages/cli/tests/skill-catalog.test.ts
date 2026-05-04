import { homedir } from "node:os";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  getDesiredSkillAssets,
  getRecommendedSkillChoices,
} from "../src/skill-catalog";
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

  test("returns one recommended skill list for the wizard", () => {
    const choices = getRecommendedSkillChoices();

    expect(choices).toEqual([
      {
        name: "archive-docs",
        description:
          "Relationship-aware archival, staleness detection, deprecation, and impact analysis for docs/ artifacts.",
      },
      {
        name: "closeout-commit",
        description:
          "Capture gaps, write history, and draft commit messages for uncommitted changes.",
      },
      {
        name: "closeout-phase",
        description:
          "Close out completed work backlog phases with checked criteria, guides, gap capture, history, and commit-message drafts.",
      },
      {
        name: "decompose-codebase",
        description: "Plan and reverse-engineer repos into structured PRDs.",
      },
    ]);
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
          asset.relativePath ===
          ".agents/skills/archive-docs/scripts/trace_relationships.py",
      ),
    ).toBe(true);
    expect(
      assets.some(
        (asset) =>
          asset.relativePath ===
          ".claude/skills/archive-docs/agents/openai.yaml",
      ),
    ).toBe(true);
    expect(
      assets.some(
        (asset) =>
          asset.relativePath === ".claude/skills/closeout-phase/SKILL.md",
      ),
    ).toBe(true);
    expect(
      assets.some(
        (asset) =>
          asset.relativePath === ".claude/skills/closeout-commit/SKILL.md",
      ),
    ).toBe(true);
    expect(
      assets.some(
        (asset) =>
          asset.relativePath ===
          ".agents/skills/closeout-commit/references/closeout-commit-workflow.md",
      ),
    ).toBe(true);
    expect(
      assets.some(
        (asset) =>
          asset.relativePath ===
          ".claude/skills/closeout-commit/agents/openai.yaml",
      ),
    ).toBe(true);
    expect(
      assets.some(
        (asset) =>
          asset.relativePath ===
          ".agents/skills/closeout-phase/references/closeout-workflow.md",
      ),
    ).toBe(true);
    expect(
      assets.some(
        (asset) =>
          asset.relativePath ===
          ".claude/skills/closeout-phase/agents/openai.yaml",
      ),
    ).toBe(true);
    expect(archiveSkillForClaude?.content).toContain(
      "./references/archive-workflow.md",
    );
    expect(archiveSkillForClaude?.content).toContain(
      "./scripts/trace_relationships.py",
    );
    expect(archiveSkillForCodex?.content).toContain(
      "./references/archive-workflow.md",
    );
  });

  test("uses the home directory for global scope and omits deselected harnesses", async () => {
    const selections = defaultSelections();
    selections.harnesses.codex = false;
    selections.skillScope = "global";

    const assets = await getDesiredSkillAssets(selections);

    expect(assets.length).toBeGreaterThan(0);
    expect(
      assets.every((asset) =>
        asset.relativePath.startsWith(`${homedir()}/.claude/`),
      ),
    ).toBe(true);
    expect(
      assets.some((asset) => asset.relativePath.includes(".agents/")),
    ).toBe(false);
  });

  test("fresh defaults select every registry skill", async () => {
    const assets = await getDesiredSkillAssets(defaultSelections());

    expect(
      assets.some(
        (asset) =>
          asset.relativePath === ".claude/skills/archive-docs/SKILL.md",
      ),
    ).toBe(true);
    expect(
      assets.some(
        (asset) =>
          asset.relativePath === ".claude/skills/decompose-codebase/SKILL.md",
      ),
    ).toBe(true);
    expect(
      assets.some(
        (asset) =>
          asset.relativePath === ".claude/skills/closeout-phase/SKILL.md",
      ),
    ).toBe(true);
    expect(
      assets.some(
        (asset) =>
          asset.relativePath === ".claude/skills/closeout-commit/SKILL.md",
      ),
    ).toBe(true);
  });

  test("selected skills control the desired skill assets", async () => {
    const archiveSelections = defaultSelections();
    archiveSelections.selectedSkills = ["archive-docs"];

    const archiveOnly = await getDesiredSkillAssets(archiveSelections);
    expect(
      archiveOnly.some(
        (asset) =>
          asset.relativePath === ".claude/skills/decompose-codebase/SKILL.md",
      ),
    ).toBe(false);
    expect(
      archiveOnly.some(
        (asset) =>
          asset.relativePath === ".claude/skills/closeout-phase/SKILL.md",
      ),
    ).toBe(false);
    expect(
      archiveOnly.some(
        (asset) =>
          asset.relativePath === ".claude/skills/closeout-commit/SKILL.md",
      ),
    ).toBe(false);

    const commitSelections = defaultSelections();
    commitSelections.selectedSkills = ["closeout-commit"];

    const withCommit = await getDesiredSkillAssets(commitSelections);
    expect(
      withCommit.some(
        (asset) =>
          asset.relativePath === ".claude/skills/closeout-commit/SKILL.md",
      ),
    ).toBe(true);
    expect(
      withCommit.some(
        (asset) =>
          asset.relativePath ===
          ".agents/skills/closeout-commit/references/closeout-commit-workflow.md",
      ),
    ).toBe(true);

    const closeoutSelections = defaultSelections();
    closeoutSelections.selectedSkills = ["closeout-phase"];

    const withCloseout = await getDesiredSkillAssets(closeoutSelections);
    expect(
      withCloseout.some(
        (asset) =>
          asset.relativePath === ".claude/skills/closeout-phase/SKILL.md",
      ),
    ).toBe(true);
    expect(
      withCloseout.some(
        (asset) =>
          asset.relativePath ===
          ".agents/skills/closeout-phase/references/closeout-workflow.md",
      ),
    ).toBe(true);

    const selections = defaultSelections();
    selections.selectedSkills = ["decompose-codebase"];

    const withDecompose = await getDesiredSkillAssets(selections);
    expect(
      withDecompose.some(
        (asset) =>
          asset.relativePath === ".claude/skills/decompose-codebase/SKILL.md",
      ),
    ).toBe(true);
    expect(
      withDecompose.some(
        (asset) =>
          asset.relativePath ===
          ".agents/skills/decompose-codebase/references/mcp-playbook.md",
      ),
    ).toBe(true);
    expect(
      withDecompose.some(
        (asset) =>
          asset.relativePath === ".claude/skills/closeout-phase/SKILL.md",
      ),
    ).toBe(false);
    expect(
      withDecompose.some(
        (asset) =>
          asset.relativePath === ".claude/skills/closeout-commit/SKILL.md",
      ),
    ).toBe(false);
    expect(
      withDecompose.some(
        (asset) =>
          asset.relativePath ===
          ".claude/skills/decompose-codebase/assets/templates/decomposition-plan.md",
      ),
    ).toBe(true);
    expect(
      withDecompose.some(
        (asset) =>
          asset.relativePath ===
          ".claude/skills/decompose-codebase/assets/templates/rebuild-backlog-phase.md",
      ),
    ).toBe(true);
    expect(
      withDecompose.some(
        (asset) =>
          asset.relativePath ===
          ".claude/skills/decompose-codebase/assets/templates/rebuild-backlog.md",
      ),
    ).toBe(false);
    expect(
      withDecompose.some(
        (asset) =>
          asset.relativePath === ".claude/skills/decompose-codebase/assets/README.md",
      ),
    ).toBe(false);
    expect(
      withDecompose.some(
        (asset) =>
          asset.relativePath ===
          ".claude/skills/decompose-codebase/scripts/test_validate_output.py",
      ),
    ).toBe(false);
  });
});
