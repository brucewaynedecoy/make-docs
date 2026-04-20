import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { getDesiredAssets } from "../src/catalog";
import { defaultSelections, resolveInstallProfile } from "../src/profile";
import { renderBuildableAsset } from "../src/renderers";
import { readPackageFile, TEMPLATE_ROOT } from "../src/utils";

const BUILDABLE_PATHS = [
  "AGENTS.md",
  "CLAUDE.md",
  "docs/AGENTS.md",
  "docs/CLAUDE.md",
  "docs/.templates/AGENTS.md",
  "docs/.templates/CLAUDE.md",
  "docs/.prompts/AGENTS.md",
  "docs/.prompts/CLAUDE.md",
  "docs/.assets/AGENTS.md",
  "docs/.assets/CLAUDE.md",
  "docs/.assets/history/AGENTS.md",
  "docs/.assets/history/CLAUDE.md",
  "docs/.assets/starter-docs/AGENTS.md",
  "docs/.assets/starter-docs/CLAUDE.md",
  "docs/guides/AGENTS.md",
  "docs/guides/CLAUDE.md",
  "docs/.references/design-workflow.md",
  "docs/.references/design-contract.md",
  "docs/.templates/design.md",
];

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
