import { describe, expect, test } from "vitest";
import { defaultSelections, resolveInstallProfile } from "../src/profile";
import { renderBuildableAsset } from "../src/renderers";
import { readPackageFile } from "../src/utils";

const ASSETS_ROUTER_PATHS = [
  "docs/assets/AGENTS.md",
  "docs/assets/CLAUDE.md",
  "docs/assets/archive/AGENTS.md",
  "docs/assets/archive/CLAUDE.md",
  "docs/assets/history/AGENTS.md",
  "docs/assets/history/CLAUDE.md",
  "docs/assets/references/AGENTS.md",
  "docs/assets/references/CLAUDE.md",
];

describe("buildable renderers", () => {
  test("renders a docs router without missing capabilities", () => {
    const selections = defaultSelections();
    selections.capabilities.plans = false;

    const profile = resolveInstallProfile(selections);
    const rendered = renderBuildableAsset("docs/AGENTS.md", profile);

    expect(rendered).toContain("docs/designs/");
    expect(rendered).toContain("docs/assets/history/");
    expect(rendered).not.toContain("docs/guides/agent");
    expect(rendered).not.toContain("docs/plans/");
    expect(rendered).not.toContain("docs/prd/");
    expect(rendered).not.toContain("docs/work/");
  });

  test.each(ASSETS_ROUTER_PATHS)(
    "renders %s for reduced profiles",
    (relativePath) => {
      const selections = defaultSelections();
      selections.capabilities.designs = false;
      selections.capabilities.plans = false;
      selections.capabilities.prd = false;
      selections.capabilities.work = false;

      const profile = resolveInstallProfile(selections);

      expect(renderBuildableAsset(relativePath, profile)).toBe(readPackageFile(relativePath));
    },
  );

  test("removes prompt links from design workflow when plans are absent", () => {
    const selections = defaultSelections();
    selections.capabilities.plans = false;

    const profile = resolveInstallProfile(selections);
    const rendered = renderBuildableAsset("docs/assets/references/design-workflow.md", profile);

    expect(rendered).toContain("planning-not-installed");
    expect(rendered).not.toContain("designs-to-plan.prompt.md");
    expect(rendered).not.toContain("docs/assets/prompts/");
    expect(rendered).toContain("npx make-docs reconfigure");
    expect(rendered).not.toContain("npx make-docs update --reconfigure");
  });

  test("removes prompt links from design workflow when prompts are disabled", () => {
    const selections = defaultSelections();
    selections.prompts = false;

    const profile = resolveInstallProfile(selections);
    const rendered = renderBuildableAsset("docs/assets/references/design-workflow.md", profile);

    expect(rendered).toContain("Prompt links are unavailable in this profile");
    expect(rendered).not.toContain("docs/assets/prompts/");
    expect(rendered).toContain("npx make-docs reconfigure");
    expect(rendered).not.toContain("npx make-docs update --reconfigure");
  });
});
