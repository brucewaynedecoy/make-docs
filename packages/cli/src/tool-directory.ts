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
