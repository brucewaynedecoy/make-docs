import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { getDesiredAssets } from "../src/catalog";
import { defaultSelections, resolveInstallProfile } from "../src/profile";
import { renderBuildableAsset } from "../src/renderers";
import { readPackageFile, TEMPLATE_ROOT } from "../src/utils";
import { collectFiles } from "./helpers";

const BUILDABLE_PATHS = [
  "AGENTS.md",
  "CLAUDE.md",
  "docs/AGENTS.md",
  "docs/CLAUDE.md",
  "docs/assets/templates/AGENTS.md",
  "docs/assets/templates/CLAUDE.md",
  "docs/assets/prompts/AGENTS.md",
  "docs/assets/prompts/CLAUDE.md",
  "docs/assets/AGENTS.md",
  "docs/assets/CLAUDE.md",
  "docs/assets/archive/AGENTS.md",
  "docs/assets/archive/CLAUDE.md",
  "docs/assets/history/AGENTS.md",
  "docs/assets/history/CLAUDE.md",
  "docs/assets/references/AGENTS.md",
  "docs/assets/references/CLAUDE.md",
  "docs/guides/AGENTS.md",
  "docs/guides/CLAUDE.md",
  "docs/assets/references/design-workflow.md",
  "docs/assets/references/design-contract.md",
  "docs/assets/templates/design.md",
];

const REPO_ROOT = path.resolve(TEMPLATE_ROOT, "..", "..", "..");
const DECOMPOSE_PACKAGE_ROOT = path.join(REPO_ROOT, "packages", "skills", "decompose-codebase");
const DECOMPOSE_MIRROR_ROOT = path.join(REPO_ROOT, ".agents", "skills", "decompose-codebase");
const DECOMPOSE_CLAUDE_MIRROR_ROOT = path.join(
  REPO_ROOT,
  ".claude",
  "skills",
  "decompose-codebase",
);
const CLOSEOUT_COMMIT_PACKAGE_ROOT = path.join(
  REPO_ROOT,
  "packages",
  "skills",
  "closeout-commit",
);
const CLOSEOUT_COMMIT_MIRROR_ROOT = path.join(
  REPO_ROOT,
  ".agents",
  "skills",
  "closeout-commit",
);
const CLOSEOUT_COMMIT_CLAUDE_MIRROR_ROOT = path.join(
  REPO_ROOT,
  ".claude",
  "skills",
  "closeout-commit",
);
const CLOSEOUT_PACKAGE_ROOT = path.join(REPO_ROOT, "packages", "skills", "closeout-phase");
const CLOSEOUT_MIRROR_ROOT = path.join(REPO_ROOT, ".agents", "skills", "closeout-phase");
const CLOSEOUT_CLAUDE_MIRROR_ROOT = path.join(
  REPO_ROOT,
  ".claude",
  "skills",
  "closeout-phase",
);

const RISK_REGISTER_TEMPLATE_PATHS = [
  "docs/assets/templates/prd-risk-register.md",
  "packages/docs/template/docs/assets/templates/prd-risk-register.md",
  "packages/skills/decompose-codebase/assets/templates/prd-risk-register.md",
];

const DOGFOOD_TEMPLATE_PARITY_PATHS = [
  "docs/assets/templates/prd-risk-register.md",
  "docs/assets/references/output-contract.md",
  "docs/assets/references/prd-change-management.md",
];

function isMirroredDecomposeSkillFile(relativePath: string): boolean {
  return (
    relativePath === "SKILL.md" ||
    relativePath === "agents/openai.yaml" ||
    relativePath === "scripts/probe_environment.py" ||
    relativePath === "scripts/validate_output.py" ||
    relativePath.startsWith("references/") ||
    relativePath.startsWith("assets/templates/")
  );
}

function isPackageOnlyDecomposeSkillFile(relativePath: string): boolean {
  return (
    relativePath === "assets/README.md" ||
    relativePath === "scripts/test_validate_output.py" ||
    relativePath.startsWith("scripts/__pycache__/")
  );
}

describe("default profile consistency", () => {
  test("BUILDABLE_PATHS matches the default profile buildable asset set", () => {
    const profile = resolveInstallProfile(defaultSelections());
    const buildablePaths = getDesiredAssets(profile)
      .filter((asset) => asset.assetClass === "buildable")
      .map((asset) => asset.relativePath)
      .sort();

    expect(buildablePaths).toEqual([...BUILDABLE_PATHS].sort());
  });

  test.each(BUILDABLE_PATHS)(
    "matches the checked-in full-profile source for %s",
    (relativePath) => {
      const profile = resolveInstallProfile(defaultSelections());

      expect(renderBuildableAsset(relativePath, profile)).toBe(readPackageFile(relativePath));
    },
  );
});

describe("template completeness", () => {
  test("every file in the template is covered by the asset pipeline", () => {
    const profile = resolveInstallProfile(defaultSelections());
    const managedPaths = new Set(
      getDesiredAssets(profile).map((asset) => asset.relativePath),
    );

    const templateFiles: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) {
          walk(full);
        } else {
          templateFiles.push(path.relative(TEMPLATE_ROOT, full));
        }
      }
    };
    walk(TEMPLATE_ROOT);

    const unmanaged = templateFiles.filter((file) => !managedPaths.has(file));

    expect(unmanaged).toEqual([]);
  });
});

describe("risk register routing contract", () => {
  test("PRD routers identify the living risk register", () => {
    for (const relativePath of [
      "docs/prd/AGENTS.md",
      "docs/prd/CLAUDE.md",
      "packages/docs/template/docs/prd/AGENTS.md",
      "packages/docs/template/docs/prd/CLAUDE.md",
    ]) {
      const contents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");

      expect(contents).toContain("03-open-questions-and-risk-register.md");
      expect(contents).toContain("living register");
      expect(contents).toContain("do not create separate questions, decisions, risks, gaps");
    }
  });

  test("risk-register templates expose item state fields", () => {
    for (const relativePath of RISK_REGISTER_TEMPLATE_PATHS) {
      const contents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");

      expect(contents).toContain("| Status | Decision | Follow-Up |");
      expect(contents).toContain("`Open`, `Confirming`, `Deferred`, or `Closed`");
      expect(contents).toContain("**Why it matters**");
      expect(contents).toContain("**Recommendation**");
      expect(contents).toContain("**To close**");
    }
  });

  test("dogfood risk-register contracts match the shipped template copies", () => {
    for (const relativePath of DOGFOOD_TEMPLATE_PARITY_PATHS) {
      const dogfoodContents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
      const templateContents = readFileSync(
        path.join(REPO_ROOT, "packages", "docs", "template", relativePath),
        "utf8",
      );

      expect(dogfoodContents).toBe(templateContents);
    }
  });
});

describe("dogfood skill mirror parity", () => {
  test("closeout-commit mirror matches the packaged mapped file set", () => {
    const expectedMirrorFiles = [
      "SKILL.md",
      "agents/openai.yaml",
      "references/closeout-commit-workflow.md",
    ].sort();

    for (const mirrorRoot of [CLOSEOUT_COMMIT_MIRROR_ROOT, CLOSEOUT_COMMIT_CLAUDE_MIRROR_ROOT]) {
      const mirrorFiles = collectFiles(mirrorRoot).sort();

      expect(mirrorFiles).toEqual(expectedMirrorFiles);

      for (const relativePath of expectedMirrorFiles) {
        const packageContents = readFileSync(
          path.join(CLOSEOUT_COMMIT_PACKAGE_ROOT, relativePath),
          "utf8",
        );
        const mirrorContents = readFileSync(path.join(mirrorRoot, relativePath), "utf8");

        expect(mirrorContents).toBe(packageContents);
      }
    }
  });

  test("closeout-phase mirror matches the packaged mapped file set", () => {
    const expectedMirrorFiles = [
      "SKILL.md",
      "agents/openai.yaml",
      "references/closeout-workflow.md",
    ].sort();

    for (const mirrorRoot of [CLOSEOUT_MIRROR_ROOT, CLOSEOUT_CLAUDE_MIRROR_ROOT]) {
      const mirrorFiles = collectFiles(mirrorRoot).sort();

      expect(mirrorFiles).toEqual(expectedMirrorFiles);

      for (const relativePath of expectedMirrorFiles) {
        const packageContents = readFileSync(path.join(CLOSEOUT_PACKAGE_ROOT, relativePath), "utf8");
        const mirrorContents = readFileSync(path.join(mirrorRoot, relativePath), "utf8");

        expect(mirrorContents).toBe(packageContents);
      }
    }
  });

  test("decompose-codebase mirror matches the packaged mapped file set", () => {
    const expectedMirrorFiles = collectFiles(DECOMPOSE_PACKAGE_ROOT)
      .filter((relativePath) => !isPackageOnlyDecomposeSkillFile(relativePath))
      .filter(isMirroredDecomposeSkillFile)
      .sort();

    for (const mirrorRoot of [DECOMPOSE_MIRROR_ROOT, DECOMPOSE_CLAUDE_MIRROR_ROOT]) {
      const mirrorFiles = collectFiles(mirrorRoot).sort();

      expect(mirrorFiles).toEqual(expectedMirrorFiles);

      for (const relativePath of expectedMirrorFiles) {
        const packageContents = readFileSync(
          path.join(DECOMPOSE_PACKAGE_ROOT, relativePath),
          "utf8",
        );
        const mirrorContents = readFileSync(path.join(mirrorRoot, relativePath), "utf8");

        expect(mirrorContents).toBe(packageContents);
      }
    }
  });
});
