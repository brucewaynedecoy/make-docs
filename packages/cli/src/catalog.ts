import { getPromptPaths, getReferenceDirInstalled, getReferencePaths, getTemplateDirInstalled, getTemplatePaths, getPromptsDirInstalled } from "./rules";
import { renderBuildableAsset, isBuildablePath } from "./renderers";
import type { InstallProfile, InstructionKind, ResolvedAsset } from "./types";
import { getActiveInstructionKinds } from "./types";
import { readPackageFile } from "./utils";

function buildAsset(profile: InstallProfile, relativePath: string): ResolvedAsset {
  const assetClass = isBuildablePath(relativePath) ? "buildable" : "scoped-static";
  const content =
    assetClass === "buildable"
      ? renderBuildableAsset(relativePath, profile)
      : readPackageFile(relativePath);

  return {
    relativePath,
    assetClass,
    sourceId:
      assetClass === "buildable" ? `build:${relativePath}` : `file:${relativePath}`,
    content,
  };
}

function addInstructionAssets(
  profile: InstallProfile,
  activeInstructionKind: InstructionKind,
  relativePaths: Set<string>,
): void {
  relativePaths.add(activeInstructionKind);
  relativePaths.add(`docs/${activeInstructionKind}`);
  relativePaths.add(`docs/.assets/${activeInstructionKind}`);
  relativePaths.add(`docs/.assets/history/${activeInstructionKind}`);
  relativePaths.add(`docs/.assets/starter-docs/${activeInstructionKind}`);
  relativePaths.add(`docs/guides/${activeInstructionKind}`);
  relativePaths.add(`docs/.archive/${activeInstructionKind}`);

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
    relativePaths.add(`docs/.references/${activeInstructionKind}`);
  }

  if (getTemplateDirInstalled(profile)) {
    relativePaths.add(`docs/.templates/${activeInstructionKind}`);
  }

  if (getPromptsDirInstalled(profile)) {
    relativePaths.add(`docs/.prompts/${activeInstructionKind}`);
  }
}

export function getDesiredAssets(profile: InstallProfile): ResolvedAsset[] {
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

  for (const instructionKind of getActiveInstructionKinds(profile.selections)) {
    addInstructionAssets(profile, instructionKind, relativePaths);
  }

  return Array.from(relativePaths)
    .sort()
    .map((relativePath) => buildAsset(profile, relativePath));
}
