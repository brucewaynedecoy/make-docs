import type { Capability, InstallProfile, InstructionKind } from "./types";
import { INSTRUCTION_KINDS } from "./types";

const FOUNDATION_ROUTER_DIRECTORIES = [
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

const LEGACY_INCOMPLETE_FOUNDATION_DIRECTORIES = FOUNDATION_ROUTER_DIRECTORIES
  .filter((directory) => directory !== "docs/assets");

const CAPABILITY_ROUTER_DIRECTORIES: ReadonlyArray<readonly [Capability, string]> = [
  ["designs", "docs/designs"],
  ["plans", "docs/plans"],
  ["prd", "docs/prd"],
  ["work", "docs/work"],
];

const ON_DEMAND_ROUTER_DIRECTORIES = [
  ".make-docs/archive",
  "docs/artifacts",
] as const;

const RETIRED_TEMPLATE_CHILD_ROUTER_DIRECTORIES = [
  "docs/assets/archive",
  "docs/assets/artifacts",
  "docs/assets/library",
  "docs/assets/playbooks",
] as const;

export function getFoundationRouterPaths(instructionKind: InstructionKind): string[] {
  return FOUNDATION_ROUTER_DIRECTORIES.map((directory) =>
    directory === "" ? instructionKind : `${directory}/${instructionKind}`
  );
}

export function getConfiguredRouterPaths(
  profile: InstallProfile,
  instructionKind: InstructionKind,
): string[] {
  const paths = getFoundationRouterPaths(instructionKind);
  for (const [capability, directory] of CAPABILITY_ROUTER_DIRECTORIES) {
    if (profile.capabilityState[capability].effectiveSelection) {
      paths.push(`${directory}/${instructionKind}`);
    }
  }
  return paths;
}

export function getLegacyIncompleteRouterPaths(
  instructionKind: InstructionKind,
): string[] {
  return LEGACY_INCOMPLETE_FOUNDATION_DIRECTORIES.map((directory) =>
    directory === "" ? instructionKind : `${directory}/${instructionKind}`
  );
}

export function getLegacyAssetsOnDemandRouterPaths(
  instructionKind: InstructionKind,
): string[] {
  return [`docs/assets/${instructionKind}`];
}

export function getOnDemandRouterPaths(instructionKind: InstructionKind): string[] {
  return ON_DEMAND_ROUTER_DIRECTORIES.map((directory) =>
    `${directory}/${instructionKind}`
  );
}

export function isRetiredTemplateOwnedChildRouterPath(relativePath: string): boolean {
  return RETIRED_TEMPLATE_CHILD_ROUTER_DIRECTORIES.some((directory) =>
    INSTRUCTION_KINDS.some((instructionKind) =>
      relativePath === `${directory}/${instructionKind}`
    )
  );
}

export function isConfiguredRouterPath(
  profile: InstallProfile,
  relativePath: string,
  instructionKind: InstructionKind,
): boolean {
  return getConfiguredRouterPaths(profile, instructionKind).includes(relativePath);
}
