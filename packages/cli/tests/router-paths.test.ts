import { describe, expect, it } from "vitest";
import { defaultSelections, resolveInstallProfile } from "../src/profile";
import { createThinRouterAssets } from "../src/project-projection";
import {
  getConfiguredRouterPaths,
  getFoundationRouterPaths,
  getOnDemandRouterPaths,
} from "../src/router-paths";
import type {
  Capability,
  Harness,
  InstallSelections,
  InstructionKind,
  ProjectResourceType,
} from "../src/types";

const FOUNDATION_DIRECTORIES = [
  "",
  "docs",
  "docs/assets",
  ".make-docs",
  ".make-docs/system",
  ".make-docs/system/contracts",
  ".make-docs/system/prompts",
  ".make-docs/system/references",
  ".make-docs/system/templates",
] as const;

const CAPABILITY_DIRECTORIES: Record<Capability, string> = {
  designs: "docs/designs",
  plans: "docs/plans",
  prd: "docs/prd",
  work: "docs/work",
};

function selectionsFor(options: {
  capabilities?: Capability[];
  harnesses?: Harness[];
  resourceProjection?: ProjectResourceType[];
}): InstallSelections {
  const selections = defaultSelections();
  const capabilities = new Set(options.capabilities ?? []);
  const harnesses = new Set(options.harnesses ?? ["codex", "claude-code"]);
  for (const capability of Object.keys(selections.capabilities) as Capability[]) {
    selections.capabilities[capability] = capabilities.has(capability);
  }
  for (const harness of Object.keys(selections.harnesses) as Harness[]) {
    selections.harnesses[harness] = harnesses.has(harness);
  }
  selections.resourceProjection = options.resourceProjection ?? [];
  return selections;
}

function expectedPaths(
  instructionKind: InstructionKind,
  capabilities: Capability[],
): string[] {
  return [
    ...FOUNDATION_DIRECTORIES.map((directory) =>
      directory === "" ? instructionKind : `${directory}/${instructionKind}`
    ),
    ...capabilities.map((capability) =>
      `${CAPABILITY_DIRECTORIES[capability]}/${instructionKind}`
    ),
  ];
}

describe("configured router path authority", () => {
  it("returns nine foundation and four effective capability surfaces", () => {
    const profile = resolveInstallProfile(defaultSelections());
    expect(getFoundationRouterPaths("AGENTS.md")).toHaveLength(9);
    expect(getConfiguredRouterPaths(profile, "AGENTS.md")).toEqual([
      "AGENTS.md",
      "docs/AGENTS.md",
      "docs/assets/AGENTS.md",
      ".make-docs/AGENTS.md",
      ".make-docs/system/AGENTS.md",
      ".make-docs/system/contracts/AGENTS.md",
      ".make-docs/system/prompts/AGENTS.md",
      ".make-docs/system/references/AGENTS.md",
      ".make-docs/system/templates/AGENTS.md",
      "docs/designs/AGENTS.md",
      "docs/plans/AGENTS.md",
      "docs/prd/AGENTS.md",
      "docs/work/AGENTS.md",
    ]);
    expect(getConfiguredRouterPaths(profile, "CLAUDE.md")).toHaveLength(13);
  });

  it("uses effective capability dependencies and ignores resource projection", () => {
    const selections = defaultSelections();
    selections.capabilities.prd = false;
    selections.capabilities.work = true;
    selections.resourceProjection = ["contract", "prompt", "reference", "template"];
    const profile = resolveInstallProfile(selections);
    const paths = getConfiguredRouterPaths(profile, "AGENTS.md");
    expect(paths).toContain("docs/designs/AGENTS.md");
    expect(paths).toContain("docs/plans/AGENTS.md");
    expect(paths).not.toContain("docs/prd/AGENTS.md");
    expect(paths).not.toContain("docs/work/AGENTS.md");
    expect(paths).toHaveLength(11);

    selections.resourceProjection = [];
    expect(getConfiguredRouterPaths(resolveInstallProfile(selections), "AGENTS.md"))
      .toEqual(paths);
  });

  it.each([
    ["no document types", [], []],
    ["designs", ["designs"], ["designs"]],
    ["plans", ["plans"], ["plans"]],
    ["designs and plans", ["designs", "plans"], ["designs", "plans"]],
    ["prd with its plans dependency", ["plans", "prd"], ["plans", "prd"]],
    [
      "designs and prd with its plans dependency",
      ["designs", "plans", "prd"],
      ["designs", "plans", "prd"],
    ],
    [
      "work with its plans and prd dependencies",
      ["plans", "prd", "work"],
      ["plans", "prd", "work"],
    ],
    [
      "all document types",
      ["designs", "plans", "prd", "work"],
      ["designs", "plans", "prd", "work"],
    ],
  ] as const)("returns the exact topology for %s", (_label, selected, effective) => {
    const profile = resolveInstallProfile(selectionsFor({
      capabilities: [...selected],
    }));

    expect(profile.effectiveCapabilities).toEqual(effective);
    expect(getConfiguredRouterPaths(profile, "AGENTS.md"))
      .toEqual(expectedPaths("AGENTS.md", [...effective]));
    expect(getConfiguredRouterPaths(profile, "CLAUDE.md"))
      .toEqual(expectedPaths("CLAUDE.md", [...effective]));
  });

  it.each([
    ["AGENTS only", ["codex"], ["AGENTS.md"]],
    ["Claude only", ["claude-code"], ["CLAUDE.md"]],
    ["both harnesses", ["codex", "claude-code"], ["AGENTS.md", "CLAUDE.md"]],
  ] as const)("materializes the exact %s router set", (_label, harnesses, kinds) => {
    const capabilities: Capability[] = ["designs", "plans", "prd", "work"];
    const profile = resolveInstallProfile(selectionsFor({
      capabilities,
      harnesses: [...harnesses],
    }));
    const actual = createThinRouterAssets(profile)
      .map((asset) => asset.relativePath)
      .sort();
    const expected = kinds
      .flatMap((kind) => expectedPaths(kind, capabilities))
      .sort();

    expect(actual).toEqual(expected);
  });

  it.each([
    ["no", []],
    ["one", ["contract"]],
    ["all", ["contract", "prompt", "reference", "template"]],
  ] as const)("keeps router topology unchanged with %s resource projection", (_label, projection) => {
    const capabilities: Capability[] = ["designs", "plans", "prd", "work"];
    const profile = resolveInstallProfile(selectionsFor({
      capabilities,
      resourceProjection: [...projection],
    }));

    expect(createThinRouterAssets(profile).map((asset) => asset.relativePath).sort())
      .toEqual([
        ...expectedPaths("AGENTS.md", capabilities),
        ...expectedPaths("CLAUDE.md", capabilities),
      ].sort());
  });

  it("keeps archive and artifacts separate from configured routes", () => {
    expect(getOnDemandRouterPaths("AGENTS.md")).toEqual([
      ".make-docs/archive/AGENTS.md",
      "docs/artifacts/AGENTS.md",
    ]);
    expect(getOnDemandRouterPaths("CLAUDE.md")).toEqual([
      ".make-docs/archive/CLAUDE.md",
      "docs/artifacts/CLAUDE.md",
    ]);
  });
});
