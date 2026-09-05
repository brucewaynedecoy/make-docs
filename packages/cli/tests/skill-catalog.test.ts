import { homedir } from "node:os";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  getDesiredSkillAssets,
  getRecommendedSkillChoices,
} from "../src/skill-catalog";
import { defaultSelections } from "../src/profile";
import type {
  ResolvedAsset,
  ResolvedSkillExposureAsset,
} from "../src/types";
import { mockSkillFetches } from "./helpers";

const ALL_SKILL_NAMES = [
  "archive-docs",
  "cleanup-docs",
  "decompose-codebase",
];

// Withdrawn from the shipped registry by the D-020 stopgap; regeneration is
// owned by the Q-022 agentics production pipeline.
const WITHDRAWN_SKILL_NAMES = [
  "closeout-commit",
  "closeout-phase",
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

function findExposure(
  assets: Awaited<ReturnType<typeof getDesiredSkillAssets>>,
  relativePath: string,
): ResolvedSkillExposureAsset | undefined {
  return assets.find(
    (asset): asset is ResolvedSkillExposureAsset =>
      asset.kind === "skill-exposure" && asset.relativePath === relativePath,
  );
}

function findFileAsset(
  assets: Awaited<ReturnType<typeof getDesiredSkillAssets>>,
  relativePath: string,
): ResolvedAsset | undefined {
  return assets.find(
    (asset): asset is ResolvedAsset =>
      asset.kind !== "skill-exposure" && asset.relativePath === relativePath,
  );
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
      "naive-uat",
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

  test("builds shared skill payloads with native harness exposures", async () => {
    const selections = defaultSelections();
    enableAllSkills(selections);

    const assets = await getDesiredSkillAssets(selections);
    const archiveSharedPayload = findFileAsset(
      assets,
      ".make-docs/agentics/skills/archive-docs/SKILL.md",
    );
    const archiveSkillForClaude = findExposure(
      assets,
      ".claude/skills/archive-docs",
    );
    const archiveSkillForCodex = findExposure(
      assets,
      ".agents/skills/archive-docs",
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
    expect(hasAsset(assets, ".claude/skills/cleanup-docs")).toBe(true);
    expect(
      hasAsset(
        assets,
        ".make-docs/agentics/skills/cleanup-docs/scripts/check_markdown_style.py",
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
    for (const withdrawnSkill of WITHDRAWN_SKILL_NAMES) {
      expect(
        assets.some((asset) =>
          asset.relativePath.includes(`/${withdrawnSkill}/`) ||
          asset.relativePath.endsWith(`/${withdrawnSkill}`),
        ),
      ).toBe(false);
    }
    expect(archiveSharedPayload?.content).toContain(
      "./references/archive-workflow.md",
    );
    expect(archiveSharedPayload?.content).toContain(
      "./scripts/trace_relationships.py",
    );
    expect(archiveSkillForClaude?.kind).toBe("skill-exposure");
    expect(archiveSkillForClaude?.skillExposure).toMatchObject({
      harness: "claude-code",
      canonicalPayloadPath: ".make-docs/agentics/skills/archive-docs",
      exposurePath: ".claude/skills/archive-docs",
      symlinkTarget: "../../.make-docs/agentics/skills/archive-docs",
      preferredMode: "symlink",
    });
    expect(archiveSkillForClaude?.copyMirrorAssets.map((asset) => asset.relativePath)).toContain(
      ".claude/skills/archive-docs/SKILL.md",
    );
    expect(archiveSkillForClaude?.copyMirrorAssets.find((asset) => asset.relativePath.endsWith("SKILL.md"))?.content).toContain(
      "./references/archive-workflow.md",
    );
    expect(archiveSkillForCodex?.kind).toBe("skill-exposure");
    expect(archiveSkillForCodex?.skillExposure.harness).toBe("codex");
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
      expect(hasAsset(assets, `.claude/skills/${skillName}`)).toBe(true);
      expect(hasAsset(assets, `.agents/skills/${skillName}`)).toBe(true);
      expect(findExposure(assets, `.claude/skills/${skillName}`)?.copyMirrorAssets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            relativePath: `.claude/skills/${skillName}/SKILL.md`,
          }),
        ]),
      );
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
          asset.relativePath === ".claude/skills/cleanup-docs",
      ),
    ).toBe(false);

    // Manifests that still select a withdrawn lifecycle skill resolve to no
    // assets for it: the registry no longer carries the entry (D-020 stopgap).
    const withdrawnSelections = defaultSelections();
    withdrawnSelections.skills = true;
    withdrawnSelections.selectedSkills = [...WITHDRAWN_SKILL_NAMES];

    const withWithdrawn = await getDesiredSkillAssets(withdrawnSelections);
    expect(withWithdrawn).toEqual([]);

    const selections = defaultSelections();
    selections.skills = true;
    selections.selectedSkills = ["decompose-codebase"];

    const withDecompose = await getDesiredSkillAssets(selections);
    expect(
      hasAsset(withDecompose, ".claude/skills/decompose-codebase"),
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
          asset.relativePath === ".claude/skills/archive-docs",
      ),
    ).toBe(false);
    expect(
      withDecompose.some(
        (asset) =>
          asset.relativePath === ".claude/skills/cleanup-docs",
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
