import { describe, expect, test } from "vitest";
import { getDesiredAssets } from "../src/catalog";
import {
  MANAGED_BLOCK_BEGIN,
  MANAGED_BLOCK_END,
  parseManagedBlock,
} from "../src/managed-block";
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
  test("renders Codex root instructions as a single fallback managed block", () => {
    const profile = resolveInstallProfile(defaultSelections());
    const rendered = renderBuildableAsset("AGENTS.md", profile);
    const parsed = parseManagedBlock(rendered);

    expect(countOccurrences(rendered, MANAGED_BLOCK_BEGIN)).toBe(1);
    expect(countOccurrences(rendered, MANAGED_BLOCK_END)).toBe(1);
    expect(parsed.prefix).toBe("");
    expect(parsed.suffix).toBe("\n");
    expect(parsed.body).not.toContain(".make-docs/AGENTS.md");
    expect(parsed.body).not.toContain("@.make-docs/CLAUDE.md");
    expect(parsed.body).toContain("read the same-named instruction file in `docs/`");
    expect(parsed.body).toContain("read `docs/assets/references/lifecycle.md`");
  });

  test("renders Claude root instructions as the same inline managed block", () => {
    const profile = resolveInstallProfile(defaultSelections());
    const rendered = renderBuildableAsset("CLAUDE.md", profile);
    const parsed = parseManagedBlock(rendered);

    expect(countOccurrences(rendered, MANAGED_BLOCK_BEGIN)).toBe(1);
    expect(countOccurrences(rendered, MANAGED_BLOCK_END)).toBe(1);
    expect(parsed.prefix).toBe("");
    expect(parsed.suffix).toBe("\n");
    expect(rendered).toBe(renderBuildableAsset("AGENTS.md", profile));
    expect(parsed.body).not.toContain("@.make-docs/CLAUDE.md");
    expect(parsed.body).toContain("read the same-named instruction file in `docs/`");
    expect(parsed.body).toContain("read `docs/assets/references/lifecycle.md`");
  });

  test("does not track dedicated instruction files as managed assets", () => {
    const profile = resolveInstallProfile(defaultSelections());
    const assets = getDesiredAssets(profile);

    expect(assets.map((asset) => asset.relativePath)).not.toEqual(
      expect.arrayContaining([".make-docs/AGENTS.md", ".make-docs/CLAUDE.md"]),
    );
  });

  test("renders a docs router without missing capabilities", () => {
    const selections = defaultSelections();
    selections.capabilities.plans = false;

    const profile = resolveInstallProfile(selections);
    const rendered = renderBuildableAsset("docs/AGENTS.md", profile);

    expect(rendered).toContain("docs/designs/");
    expect(rendered).toContain("docs/assets/references/path-and-link-hygiene.md");
    expect(rendered).toContain("docs/assets/history/");
    expect(rendered).not.toContain("docs/guides/agent");
    expect(rendered).not.toContain("docs/plans/");
    expect(rendered).not.toContain("docs/prd/");
    expect(rendered).not.toContain("docs/work/");
  });

  test("renders the canonical risk-register route for PRD-enabled profiles", () => {
    const profile = resolveInstallProfile(defaultSelections());
    const rendered = renderBuildableAsset("docs/AGENTS.md", profile);

    expect(rendered).toContain("docs/prd/03-open-questions-and-risk-register.md");
    expect(rendered).toContain("do not create separate questions, decisions, risks, gaps");
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
    expect(rendered).toContain("npx @brucewaynedecoy/make-docs@next reconfigure");
    expect(rendered).not.toContain("npx make-docs update --reconfigure");
  });

});

function countOccurrences(content: string, needle: string): number {
  return content.split(needle).length - 1;
}
