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

describe("dogfood skill mirror parity", () => {
  test("decompose-codebase mirror matches the packaged mapped file set", () => {
    const expectedMirrorFiles = collectFiles(DECOMPOSE_PACKAGE_ROOT)
      .filter((relativePath) => !isPackageOnlyDecomposeSkillFile(relativePath))
      .filter(isMirroredDecomposeSkillFile)
      .sort();
    const mirrorFiles = collectFiles(DECOMPOSE_MIRROR_ROOT).sort();

    expect(mirrorFiles).toEqual(expectedMirrorFiles);

    for (const relativePath of expectedMirrorFiles) {
      const packageContents = readFileSync(
        path.join(DECOMPOSE_PACKAGE_ROOT, relativePath),
        "utf8",
      );
      const mirrorContents = readFileSync(
        path.join(DECOMPOSE_MIRROR_ROOT, relativePath),
        "utf8",
      );

      expect(mirrorContents).toBe(packageContents);
    }
  });
});
