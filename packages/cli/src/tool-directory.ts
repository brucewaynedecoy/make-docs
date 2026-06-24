import { normalizeRelativePath } from "./utils";

export const TOOL_DIRECTORY_RELATIVE_PATH = ".make-docs";
export const TOOL_DIRECTORY_MANIFEST_RELATIVE_PATH = `${TOOL_DIRECTORY_RELATIVE_PATH}/manifest.json`;
export const TOOL_DIRECTORY_CONFLICTS_RELATIVE_DIR = `${TOOL_DIRECTORY_RELATIVE_PATH}/conflicts`;
export const TOOL_DIRECTORY_RUNS_RELATIVE_DIR = `${TOOL_DIRECTORY_RELATIVE_PATH}/runs`;
export const TOOL_DIRECTORY_CONFIG_RELATIVE_PATH = `${TOOL_DIRECTORY_RELATIVE_PATH}/config.yaml`;

export const TOOL_RESOURCE_FAMILIES = [
  "contracts",
  "references",
  "templates",
  "prompts",
  "scripts",
] as const;

export type ToolResourceFamily = (typeof TOOL_RESOURCE_FAMILIES)[number];

export const TOOL_RESOURCE_TIERS = ["system", "custom"] as const;

export type ToolResourceTier = (typeof TOOL_RESOURCE_TIERS)[number];

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

export const TOOL_RESOURCE_MATERIALIZATION_MODES = [
  "full-snapshot",
  "provider-backed",
  "hybrid-pinned-cache",
] as const;

export type ToolResourceMaterializationMode =
  (typeof TOOL_RESOURCE_MATERIALIZATION_MODES)[number];

export const LEGACY_TOOL_RESOURCE_FAMILIES = [
  "prompts",
  "references",
  "templates",
] as const satisfies readonly ToolResourceFamily[];

export type LegacyToolResourceFamily =
  (typeof LEGACY_TOOL_RESOURCE_FAMILIES)[number];

export const LEGACY_TOOL_RESOURCE_ROOTS = {
  prompts: "docs/assets/prompts",
  references: "docs/assets/references",
  templates: "docs/assets/templates",
} as const satisfies Record<LegacyToolResourceFamily, string>;

export type SystemToolResourceMigrationFixture = {
  currentPath: string;
  family: LegacyToolResourceFamily;
  targetPath: string;
  tier: "system";
};

export function getToolResourceTierPath(
  family: ToolResourceFamily,
  tier: ToolResourceTier,
): string {
  return `${TOOL_DIRECTORY_RELATIVE_PATH}/${family}/${tier}`;
}

export function getReservedAgenticsPath(family: ReservedAgenticsFamily): string {
  return `${TOOL_DIRECTORY_RELATIVE_PATH}/agentics/${family}`;
}

export function getToolResourceTierPaths(): string[] {
  return TOOL_RESOURCE_FAMILIES.flatMap((family) =>
    TOOL_RESOURCE_TIERS.map((tier) => getToolResourceTierPath(family, tier)),
  );
}

export function isToolDirectorySystemResourcePath(relativePath: string): boolean {
  return isToolDirectoryResourcePath(relativePath, "system");
}

export function isToolDirectoryCustomResourcePath(relativePath: string): boolean {
  return isToolDirectoryResourcePath(relativePath, "custom");
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

  return null;
}

export function getSystemToolResourceMigrationTarget(
  relativePath: string,
): string | null {
  const normalized = normalizeRelativePath(relativePath);
  const family = getLegacyToolResourceFamily(normalized);
  if (family === null) {
    return null;
  }

  const relativeResourcePath = getContainedRelativePath(
    LEGACY_TOOL_RESOURCE_ROOTS[family],
    normalized,
  );
  if (relativeResourcePath === null) {
    return null;
  }

  const systemRoot = getToolResourceTierPath(family, "system");
  return relativeResourcePath === ""
    ? systemRoot
    : `${systemRoot}/${relativeResourcePath}`;
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

function isToolDirectoryResourcePath(
  relativePath: string,
  tier: ToolResourceTier,
): boolean {
  const normalized = normalizeRelativePath(relativePath);
  return TOOL_RESOURCE_FAMILIES.some((family) =>
    pathContainsOrEquals(normalized, getToolResourceTierPath(family, tier)),
  );
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
