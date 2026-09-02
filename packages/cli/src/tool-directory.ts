import {
  SYSTEM_ASSET_MATERIALIZATION_MODES,
  type SystemAssetMaterializationMode,
} from "./types";
import { normalizeRelativePath } from "./utils";

export const TOOL_DIRECTORY_RELATIVE_PATH = ".make-docs";
export const TOOL_DIRECTORY_MANIFEST_RELATIVE_PATH = `${TOOL_DIRECTORY_RELATIVE_PATH}/manifest.json`;
export const TOOL_DIRECTORY_CONFLICTS_RELATIVE_DIR = `${TOOL_DIRECTORY_RELATIVE_PATH}/conflicts`;
export const TOOL_DIRECTORY_RUNS_RELATIVE_DIR = `${TOOL_DIRECTORY_RELATIVE_PATH}/runs`;
export const TOOL_DIRECTORY_CONFIG_RELATIVE_PATH = `${TOOL_DIRECTORY_RELATIVE_PATH}/config.yaml`;
export const TOOL_DIRECTORY_SYSTEM_RELATIVE_PATH = `${TOOL_DIRECTORY_RELATIVE_PATH}/system`;

export const TOOL_RESOURCE_FAMILIES = [
  "contracts",
  "prompts",
  "references",
  "templates",
] as const;

export type ToolResourceFamily = (typeof TOOL_RESOURCE_FAMILIES)[number];

export const RESERVED_AGENTICS_FAMILIES = ["skills", "plugins"] as const;

export type ReservedAgenticsFamily = (typeof RESERVED_AGENTICS_FAMILIES)[number];

export const TOOL_DIRECTORY_RUNTIME_STATE_PATHS = [
  TOOL_DIRECTORY_MANIFEST_RELATIVE_PATH,
  TOOL_DIRECTORY_CONFLICTS_RELATIVE_DIR,
  TOOL_DIRECTORY_RUNS_RELATIVE_DIR,
] as const;

export const TOOL_DIRECTORY_LOCAL_BOOTSTRAP_PATHS = [
  TOOL_DIRECTORY_MANIFEST_RELATIVE_PATH,
  TOOL_DIRECTORY_CONFIG_RELATIVE_PATH,
] as const;

export const TOOL_RESOURCE_MATERIALIZATION_MODES =
  SYSTEM_ASSET_MATERIALIZATION_MODES;

export type ToolResourceMaterializationMode = SystemAssetMaterializationMode;

export const LEGACY_TOOL_RESOURCE_FAMILIES = [
  "contracts",
  "prompts",
  "references",
  "templates",
] as const;

export type LegacyToolResourceFamily =
  (typeof LEGACY_TOOL_RESOURCE_FAMILIES)[number];

export const LEGACY_TOOL_RESOURCE_ROOTS = {
  contracts: ".make-docs/contracts/system",
  prompts: ".make-docs/prompts/system",
  references: ".make-docs/references/system",
  templates: ".make-docs/templates/system",
} as const satisfies Record<LegacyToolResourceFamily, string>;

const EARLIER_LEGACY_TOOL_RESOURCE_ROOTS = {
  prompts: "docs/assets/prompts",
  references: "docs/assets/references",
  templates: "docs/assets/templates",
} as const;

const LEGACY_REFERENCE_CONTRACT_FILES = new Set([
  "commit-message-convention.md",
  "coverage-pass-contract.md",
  "design-contract.md",
  "guide-contract.md",
  "history-record-contract.md",
  "output-contract.md",
]);

export type SystemToolResourceMigrationFixture = {
  currentPath: string;
  family: LegacyToolResourceFamily;
  targetPath: string;
  tier: "system";
};

export function getToolResourcePath(family: ToolResourceFamily): string {
  return `${TOOL_DIRECTORY_SYSTEM_RELATIVE_PATH}/${family}`;
}

export function getToolResourcePaths(): string[] {
  return TOOL_RESOURCE_FAMILIES.map(getToolResourcePath);
}

export function getReservedAgenticsPath(family: ReservedAgenticsFamily): string {
  return `${TOOL_DIRECTORY_RELATIVE_PATH}/agentics/${family}`;
}

export function isToolDirectorySystemResourcePath(relativePath: string): boolean {
  const normalized = normalizeRelativePath(relativePath);
  return TOOL_RESOURCE_FAMILIES.some((family) =>
    pathContainsOrEquals(normalized, getToolResourcePath(family)),
  );
}

export function isReservedAgenticsPath(relativePath: string): boolean {
  const normalized = normalizeRelativePath(relativePath);
  return RESERVED_AGENTICS_FAMILIES.some((family) =>
    pathContainsOrEquals(normalized, getReservedAgenticsPath(family)),
  );
}

export function isToolDirectoryRuntimeStatePath(relativePath: string): boolean {
  const normalized = normalizeRelativePath(relativePath);
  return TOOL_DIRECTORY_RUNTIME_STATE_PATHS.some((runtimePath) =>
    pathContainsOrEquals(normalized, runtimePath),
  );
}

export function isToolDirectoryLocalBootstrapPath(
  relativePath: string,
): boolean {
  const normalized = normalizeRelativePath(relativePath);
  return TOOL_DIRECTORY_LOCAL_BOOTSTRAP_PATHS.some(
    (bootstrapPath) => normalized === bootstrapPath,
  );
}

export function getLocalBootstrapPathsForMaterializationMode(
  _mode: ToolResourceMaterializationMode,
): string[] {
  return [...TOOL_DIRECTORY_LOCAL_BOOTSTRAP_PATHS];
}

export function getLegacyToolResourceFamily(
  relativePath: string,
): LegacyToolResourceFamily | null {
  const normalized = normalizeRelativePath(relativePath);

  for (const family of LEGACY_TOOL_RESOURCE_FAMILIES) {
    if (pathContainsOrEquals(normalized, LEGACY_TOOL_RESOURCE_ROOTS[family])) {
      return family;
    }
  }

  for (const [family, root] of Object.entries(EARLIER_LEGACY_TOOL_RESOURCE_ROOTS)) {
    if (pathContainsOrEquals(normalized, root)) {
      return family as LegacyToolResourceFamily;
    }
  }

  return null;
}

export function getSystemToolResourceMigrationTarget(
  relativePath: string,
): string | null {
  const normalized = normalizeRelativePath(relativePath);

  for (const family of LEGACY_TOOL_RESOURCE_FAMILIES) {
    const root = LEGACY_TOOL_RESOURCE_ROOTS[family];
    const resourcePath = getContainedRelativePath(root, normalized);
    if (resourcePath !== null) {
      return resourcePath === ""
        ? getToolResourcePath(family)
        : `${getToolResourcePath(family)}/${resourcePath}`;
    }
  }

  for (const [legacyFamily, root] of Object.entries(EARLIER_LEGACY_TOOL_RESOURCE_ROOTS)) {
    const resourcePath = getContainedRelativePath(root, normalized);
    if (resourcePath === null) {
      continue;
    }
    const family =
      legacyFamily === "references" && LEGACY_REFERENCE_CONTRACT_FILES.has(resourcePath)
        ? "contracts"
        : legacyFamily;
    return resourcePath === ""
      ? getToolResourcePath(family as ToolResourceFamily)
      : `${getToolResourcePath(family as ToolResourceFamily)}/${resourcePath}`;
  }

  return null;
}

export function createSystemToolResourceMigrationFixture(
  relativePath: string,
): SystemToolResourceMigrationFixture | null {
  const normalized = normalizeRelativePath(relativePath);
  const family = getLegacyToolResourceFamily(normalized);
  const targetPath = getSystemToolResourceMigrationTarget(normalized);

  if (family === null || targetPath === null) {
    return null;
  }

  return {
    currentPath: normalized,
    family,
    targetPath,
    tier: "system",
  };
}

export function createSystemToolResourceMigrationFixtures(
  relativePaths: readonly string[],
): SystemToolResourceMigrationFixture[] {
  return relativePaths
    .map(createSystemToolResourceMigrationFixture)
    .filter(
      (fixture): fixture is SystemToolResourceMigrationFixture =>
        fixture !== null,
    )
    .sort((left, right) => left.currentPath.localeCompare(right.currentPath));
}

function pathContainsOrEquals(candidate: string, prefix: string): boolean {
  return candidate === prefix || candidate.startsWith(`${prefix}/`);
}

function getContainedRelativePath(
  root: string,
  candidate: string,
): string | null {
  if (candidate === root) {
    return "";
  }

  if (!candidate.startsWith(`${root}/`)) {
    return null;
  }

  return candidate.slice(root.length + 1);
}
