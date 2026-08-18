import {
  getPromptPaths,
  getPlaybookDefaultPaths,
  getPromptsDirInstalled,
  getReferenceDirInstalled,
  getReferencePaths,
  getScriptPaths,
  getTemplateDirInstalled,
  getTemplatePaths,
} from "./rules";
import {
  TOOL_RESOURCE_FAMILIES,
  getLocalBootstrapPathsForMaterializationMode,
  getToolResourceTierPath,
} from "./tool-directory";
import type {
  InstallProfile,
  InstructionKind,
  ResolvedAsset,
  SystemAssetMaterializationMode,
  SystemAssetMaterializationPlan,
} from "./types";
import { DEFAULT_SYSTEM_ASSET_MATERIALIZATION_MODE } from "./types";
import { getActiveInstructionKinds } from "./types";
import { readPackageFile } from "./utils";

const LOCAL_PROMPT_PROJECTION_ROOT = ".make-docs/system/prompts/";
const INSTALLED_PROMPT_SOURCE_ROOT = ".make-docs/prompts/system/";

function getPackageSourcePath(relativePath: string): string {
  if (relativePath.startsWith(LOCAL_PROMPT_PROJECTION_ROOT)) {
    return `${INSTALLED_PROMPT_SOURCE_ROOT}${relativePath.slice(LOCAL_PROMPT_PROJECTION_ROOT.length)}`;
  }

  return relativePath;
}

function buildAsset(relativePath: string): ResolvedAsset {
  const sourcePath = getPackageSourcePath(relativePath);
  return {
    relativePath,
    assetClass: "scoped-static",
    sourceId: `file:${sourcePath}`,
    content: readPackageFile(sourcePath),
  };
}

function addInstructionAssets(
  profile: InstallProfile,
  activeInstructionKind: InstructionKind,
  relativePaths: Set<string>,
): void {
  relativePaths.add(activeInstructionKind);
  relativePaths.add(`docs/${activeInstructionKind}`);
  relativePaths.add(`docs/assets/${activeInstructionKind}`);
  relativePaths.add(`docs/assets/artifacts/${activeInstructionKind}`);
  relativePaths.add(`docs/assets/library/${activeInstructionKind}`);
  relativePaths.add(`docs/assets/playbooks/${activeInstructionKind}`);
  relativePaths.add(`docs/assets/archive/${activeInstructionKind}`);

  if (profile.capabilityState.designs.effectiveSelection) {
    relativePaths.add(`docs/designs/${activeInstructionKind}`);
  }

  if (profile.capabilityState.plans.effectiveSelection) {
    relativePaths.add(`docs/plans/${activeInstructionKind}`);
  }

  if (profile.capabilityState.prd.effectiveSelection) {
    relativePaths.add(`docs/prd/${activeInstructionKind}`);
  }

  if (profile.capabilityState.work.effectiveSelection) {
    relativePaths.add(`docs/work/${activeInstructionKind}`);
  }

  if (getReferenceDirInstalled(profile)) {
    relativePaths.add(`.make-docs/${activeInstructionKind}`);
    relativePaths.add(`.make-docs/contracts/system/${activeInstructionKind}`);
    relativePaths.add(`.make-docs/references/system/${activeInstructionKind}`);
  }

  if (getTemplateDirInstalled(profile)) {
    relativePaths.add(`.make-docs/templates/system/${activeInstructionKind}`);
  }

  if (getPromptsDirInstalled(profile)) {
    relativePaths.add(`.make-docs/system/prompts/${activeInstructionKind}`);
  }
}

export function getDesiredAssets(profile: InstallProfile): ResolvedAsset[] {
  return getDesiredAssetsForMaterializationMode(
    profile,
    DEFAULT_SYSTEM_ASSET_MATERIALIZATION_MODE,
  );
}

export function getDesiredAssetsForMaterializationMode(
  profile: InstallProfile,
  mode: SystemAssetMaterializationMode,
): ResolvedAsset[] {
  const relativePaths = getDesiredSystemAssetPaths(profile);
  const materializedPaths =
    mode === DEFAULT_SYSTEM_ASSET_MATERIALIZATION_MODE
      ? relativePaths
      : filterMaterializedLocalBootstrapAssetPaths(profile, mode, relativePaths);

  return Array.from(materializedPaths)
    .sort()
    .map((relativePath) => buildAsset(relativePath));
}

export function getSystemAssetMaterializationPlan(
  profile: InstallProfile,
  mode: SystemAssetMaterializationMode = DEFAULT_SYSTEM_ASSET_MATERIALIZATION_MODE,
): SystemAssetMaterializationPlan {
  const allSystemAssetPaths = Array.from(getDesiredSystemAssetPaths(profile)).sort();
  const localBootstrapPaths = getLocalBootstrapSystemAssetPaths(profile, mode);
  const localBootstrapPathSet = new Set(localBootstrapPaths);
  const deferredSystemAssetPaths =
    mode === DEFAULT_SYSTEM_ASSET_MATERIALIZATION_MODE
      ? []
      : allSystemAssetPaths.filter((relativePath) => !localBootstrapPathSet.has(relativePath));
  const materializationClasses = Object.fromEntries([
    ...localBootstrapPaths.map((relativePath) => [
      relativePath,
      "always-local-bootstrap" as const,
    ]),
    ...allSystemAssetPaths
      .filter((relativePath) => !localBootstrapPathSet.has(relativePath))
      .map((relativePath) => [
        relativePath,
        mode === DEFAULT_SYSTEM_ASSET_MATERIALIZATION_MODE
          ? ("materialized-system-asset" as const)
          : ("deferred-system-asset" as const),
      ]),
  ]);

  return {
    mode,
    localBootstrapPaths,
    deferredSystemAssetPaths,
    materializationClasses,
  };
}

export function getLocalBootstrapSystemAssetPaths(
  profile: InstallProfile,
  mode: SystemAssetMaterializationMode,
): string[] {
  return Array.from(
    new Set([
      ...getLocalBootstrapPathsForMaterializationMode(mode),
      ...getLocalCustomOverlayPaths(),
      ...getLocalBootstrapInstructionRouterPaths(profile),
    ]),
  ).sort();
}

function getDesiredSystemAssetPaths(profile: InstallProfile): Set<string> {
  const relativePaths = new Set<string>();

  for (const referencePath of getReferencePaths(profile)) {
    relativePaths.add(referencePath);
  }

  for (const templatePath of getTemplatePaths(profile)) {
    relativePaths.add(templatePath);
  }

  for (const promptPath of getPromptPaths(profile)) {
    relativePaths.add(promptPath);
  }

  for (const scriptPath of getScriptPaths(profile)) {
    relativePaths.add(scriptPath);
  }

  for (const playbookPath of getPlaybookDefaultPaths(profile)) {
    relativePaths.add(playbookPath);
  }

  for (const instructionKind of getActiveInstructionKinds(profile.selections)) {
    addInstructionAssets(profile, instructionKind, relativePaths);
  }

  return relativePaths;
}

function filterMaterializedLocalBootstrapAssetPaths(
  profile: InstallProfile,
  mode: SystemAssetMaterializationMode,
  relativePaths: Set<string>,
): Set<string> {
  const localBootstrapPaths = new Set(getLocalBootstrapSystemAssetPaths(profile, mode));
  return new Set(
    Array.from(relativePaths).filter((relativePath) =>
      localBootstrapPaths.has(relativePath),
    ),
  );
}

function getLocalBootstrapInstructionRouterPaths(profile: InstallProfile): string[] {
  const relativePaths = new Set<string>();

  for (const instructionKind of getActiveInstructionKinds(profile.selections)) {
    relativePaths.add(instructionKind);
    relativePaths.add(`docs/${instructionKind}`);
  }

  return Array.from(relativePaths).sort();
}

function getLocalCustomOverlayPaths(): string[] {
  return TOOL_RESOURCE_FAMILIES.map((family) =>
    getToolResourceTierPath(family, "custom"),
  ).sort();
}
