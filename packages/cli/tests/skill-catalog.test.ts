import { homedir } from "node:os";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  getDesiredSkillAssets,
  getRecommendedSkillChoices,
} from "../src/skill-catalog";
import { defaultSelections } from "../src/profile";
import { mockSkillFetches } from "./helpers";

const ALL_SKILL_NAMES = [
  "archive-docs",
  "cleanup-docs",
  "closeout-commit",
  "closeout-phase",
  "decompose-codebase",
  "work-on-phase",
  "work-on-wave",
];

function enableAllSkills(selections: ReturnType<typeof defaultSelections>): void {
  selections.skills = true;
  selections.selectedSkills = [...ALL_SKILL_NAMES];
}

function hasAsset(
  assets: Awaited<ReturnType<typeof getDesiredSkillAssets>>,
  relativePath: string,
): boolean {
  return assets.some((asset) => asset.relativePath === relativePath);
}

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

    expect(choices.map((choice) => choice.name)).toEqual([
      "archive-docs",
      "decompose-codebase",
      "cleanup-docs",
      "closeout-commit",
      "closeout-phase",
      "work-on-phase",
      "work-on-wave",
    ]);
    expect(choices[0]).toMatchObject({
      name: "archive-docs",
      displayName: "Archive docs",
      sourcePolicyKind: "first-party",
      provenanceKind: "first-party",
      provenanceLabel: "make-docs first-party skill",
      supportedHarnesses: ["claude-code", "codex"],
      purposes: [
        {
          id: "archive-management",
          label: "Archive management",
        },
      ],
    });
  });

  test("builds shared skill payloads with harness entrypoint stubs", async () => {
    const selections = defaultSelections();
    enableAllSkills(selections);

    const assets = await getDesiredSkillAssets(selections);
    const archiveSharedPayload = assets.find(
      (asset) =>
        asset.relativePath === ".make-docs/agentics/skills/archive-docs/SKILL.md",
    );
    const archiveSkillForClaude = assets.find(
      (asset) => asset.relativePath === ".claude/skills/archive-docs/SKILL.md",
    );
    const archiveSkillForCodex = assets.find(
      (asset) => asset.relativePath === ".agents/skills/archive-docs/SKILL.md",
    );

    expect(archiveSharedPayload).toBeDefined();
    expect(archiveSkillForClaude).toBeDefined();
    expect(archiveSkillForCodex).toBeDefined();

    expect(
      hasAsset(
        assets,
        ".make-docs/agentics/skills/archive-docs/references/archive-workflow.md",
      ),
    ).toBe(true);
    expect(
      hasAsset(
        assets,
        ".make-docs/agentics/skills/archive-docs/scripts/trace_relationships.py",
      ),
    ).toBe(true);
    expect(
      hasAsset(
        assets,
        ".make-docs/agentics/skills/archive-docs/agents/openai.yaml",
      ),
    ).toBe(true);
    expect(hasAsset(assets, ".claude/skills/closeout-phase/SKILL.md")).toBe(true);
    expect(hasAsset(assets, ".claude/skills/closeout-commit/SKILL.md")).toBe(true);
    expect(
      hasAsset(
        assets,
        ".make-docs/agentics/skills/closeout-commit/references/closeout-commit-workflow.md",
      ),
    ).toBe(true);
    expect(
      hasAsset(
        assets,
        ".make-docs/agentics/skills/closeout-commit/agents/openai.yaml",
      ),
    ).toBe(true);
    expect(
      hasAsset(
        assets,
        ".make-docs/agentics/skills/closeout-phase/references/closeout-workflow.md",
      ),
    ).toBe(true);
    expect(hasAsset(assets, ".claude/skills/cleanup-docs/SKILL.md")).toBe(true);
    expect(
      hasAsset(
        assets,
        ".make-docs/agentics/skills/cleanup-docs/scripts/check_markdown_style.py",
      ),
    ).toBe(true);
    expect(
      hasAsset(
        assets,
        ".make-docs/agentics/skills/closeout-phase/agents/openai.yaml",
      ),
    ).toBe(true);
    expect(hasAsset(assets, ".claude/skills/work-on-wave/SKILL.md")).toBe(true);
    expect(
      hasAsset(
        assets,
        ".make-docs/agentics/skills/work-on-wave/references/wave-implementation-workflow.md",
      ),
    ).toBe(true);
    expect(
      hasAsset(
        assets,
        ".make-docs/agentics/skills/work-on-wave/agents/openai.yaml",
      ),
    ).toBe(true);
    expect(hasAsset(assets, ".claude/skills/work-on-phase/SKILL.md")).toBe(true);
    expect(
      hasAsset(
        assets,
        ".make-docs/agentics/skills/work-on-phase/references/phase-implementation-workflow.md",
      ),
    ).toBe(true);
    expect(
      hasAsset(
        assets,
        ".make-docs/agentics/skills/work-on-phase/agents/openai.yaml",
      ),
    ).toBe(true);
    expect(
      hasAsset(
        assets,
        ".claude/skills/archive-docs/references/archive-workflow.md",
      ),
    ).toBe(false);
    expect(
      hasAsset(
        assets,
        ".agents/skills/archive-docs/scripts/trace_relationships.py",
      ),
    ).toBe(false);
    expect(
      assets.some((asset) =>
        asset.relativePath.includes("closeout-commit/scripts/closeout_probe.py"),
      ),
    ).toBe(false);
    expect(
      assets.some((asset) =>
        asset.relativePath.includes("closeout-phase/scripts/work_phase_state.py"),
      ),
    ).toBe(false);
    expect(
      assets.some((asset) =>
        asset.relativePath.includes("work-on-wave/scripts/phase_gate.py"),
      ),
    ).toBe(false);
    expect(
      assets.some((asset) =>
        asset.relativePath.includes("work-on-phase/scripts/phase_gate.py"),
      ),
    ).toBe(false);
    expect(archiveSharedPayload?.content).toContain(
      "./references/archive-workflow.md",
    );
    expect(archiveSharedPayload?.content).toContain(
      "./scripts/trace_relationships.py",
    );
    expect(archiveSkillForClaude?.content).toContain(
      "Canonical payload: `.make-docs/agentics/skills/archive-docs/SKILL.md`",
    );
    expect(archiveSkillForClaude?.content).toContain("Purpose summary: Archive management");
    expect(archiveSkillForClaude?.content).toContain(
      "Provenance: make-docs first-party skill; kind: first-party",
    );
    expect(archiveSkillForClaude?.content).toContain(
      "Deterministic make-docs behavior belongs in the TypeScript CLI/shared-core operation domains.",
    );
    expect(archiveSkillForCodex?.content).toContain(
      "Canonical payload: `.make-docs/agentics/skills/archive-docs/SKILL.md`",
    );
  });

  test("uses the home directory for global scope and omits deselected harnesses", async () => {
    const selections = defaultSelections();
    enableAllSkills(selections);
    selections.harnesses.codex = false;
    selections.skillScope = "global";

    const assets = await getDesiredSkillAssets(selections);

    expect(assets.length).toBeGreaterThan(0);
    expect(
      assets.every((asset) =>
        asset.relativePath.startsWith(`${homedir()}/.make-docs/agentics/skills/`) ||
        asset.relativePath.startsWith(`${homedir()}/.claude/skills/`),
      ),
    ).toBe(true);
    expect(
      assets.some((asset) => asset.relativePath.includes(".agents/")),
    ).toBe(false);
  });

  test("explicit all-skill selections include every registry skill", async () => {
    const selections = defaultSelections();
    enableAllSkills(selections);

    const assets = await getDesiredSkillAssets(selections);

    for (const skillName of ALL_SKILL_NAMES) {
      expect(hasAsset(assets, `.make-docs/agentics/skills/${skillName}/SKILL.md`)).toBe(true);
      expect(hasAsset(assets, `.claude/skills/${skillName}/SKILL.md`)).toBe(true);
      expect(hasAsset(assets, `.agents/skills/${skillName}/SKILL.md`)).toBe(true);
    }
  });

  test("selected skills control the desired skill assets", async () => {
    const archiveSelections = defaultSelections();
    archiveSelections.skills = true;
    archiveSelections.selectedSkills = ["archive-docs"];

    const archiveOnly = await getDesiredSkillAssets(archiveSelections);
    expect(
      hasAsset(archiveOnly, ".make-docs/agentics/skills/archive-docs/SKILL.md"),
    ).toBe(true);
    expect(
      hasAsset(
        archiveOnly,
        ".make-docs/agentics/skills/decompose-codebase/SKILL.md",
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
    commitSelections.skills = true;
    commitSelections.selectedSkills = ["closeout-commit"];

    const withCommit = await getDesiredSkillAssets(commitSelections);
    expect(
      hasAsset(withCommit, ".claude/skills/closeout-commit/SKILL.md"),
    ).toBe(true);
    expect(
      hasAsset(
        withCommit,
        ".make-docs/agentics/skills/closeout-commit/references/closeout-commit-workflow.md",
      ),
    ).toBe(true);

    const closeoutSelections = defaultSelections();
    closeoutSelections.skills = true;
    closeoutSelections.selectedSkills = ["closeout-phase"];

    const withCloseout = await getDesiredSkillAssets(closeoutSelections);
    expect(
      hasAsset(withCloseout, ".claude/skills/closeout-phase/SKILL.md"),
    ).toBe(true);
    expect(
      hasAsset(
        withCloseout,
        ".make-docs/agentics/skills/closeout-phase/references/closeout-workflow.md",
      ),
    ).toBe(true);

    const selections = defaultSelections();
    selections.skills = true;
    selections.selectedSkills = ["decompose-codebase"];

    const withDecompose = await getDesiredSkillAssets(selections);
    expect(
      hasAsset(withDecompose, ".claude/skills/decompose-codebase/SKILL.md"),
    ).toBe(true);
    expect(
      hasAsset(
        withDecompose,
        ".make-docs/agentics/skills/decompose-codebase/references/mcp-playbook.md",
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
      hasAsset(
        withDecompose,
        ".make-docs/agentics/skills/decompose-codebase/assets/templates/decomposition-plan.md",
      ),
    ).toBe(true);
    expect(
      hasAsset(
        withDecompose,
        ".make-docs/agentics/skills/decompose-codebase/assets/templates/rebuild-backlog-phase.md",
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
