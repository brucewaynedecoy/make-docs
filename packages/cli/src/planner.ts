import { existsSync } from "node:fs";
import path from "node:path";
import { getDesiredAssets } from "./catalog";
import { getDesiredSkillAssets } from "./skill-catalog";
import type {
  InstallManifest,
  InstallPlan,
  InstallProfile,
  InstructionKind,
  ManagedFileConflictGroup,
  ManagedFileConflictResolution,
  ManagedFileConflictResolutions,
  PackageMeta,
  PlannedAction,
  ResolvedAsset,
} from "./types";
import { INSTRUCTION_KINDS } from "./types";
import { hashText, readTextFile, relativePathToTarget, createRunId } from "./utils";

export async function createInstallPlan(options: {
  targetDir: string;
  packageMeta: PackageMeta;
  profile: InstallProfile;
  existingManifest: InstallManifest | null;
  managedFileConflictResolutions?: ManagedFileConflictResolutions;
}): Promise<InstallPlan> {
  const {
    targetDir,
    packageMeta,
    profile,
    existingManifest,
    managedFileConflictResolutions,
  } = options;
  const desiredAssets = getDesiredAssets(profile);
  const desiredSkillAssets = await getDesiredSkillAssets(profile.selections);
  const desiredSkillFiles = desiredSkillAssets.map((asset) => asset.relativePath);
  const allDesiredAssets = [...desiredAssets, ...desiredSkillAssets];
  const desiredFiles = Object.fromEntries(
    allDesiredAssets.map((asset) => [
      asset.relativePath,
      {
        hash: hashText(asset.content),
        sourceId: asset.sourceId,
      },
    ]),
  );

  const actions: PlannedAction[] = [];
  let conflictsRunId: string | undefined;
  const existingSkillFiles = new Set(existingManifest?.skillFiles ?? []);

  for (const asset of allDesiredAssets) {
    const absolutePath = relativePathToTarget(targetDir, asset.relativePath);
    const desiredHash = hashText(asset.content);

    if (!existsSync(absolutePath)) {
      actions.push({
        type: asset.assetClass === "buildable" ? "generate" : "create",
        relativePath: asset.relativePath,
        sourceId: asset.sourceId,
        content: asset.content,
        contentHash: desiredHash,
      });
      continue;
    }

    const currentContent = readTextFile(absolutePath);
    if (currentContent === asset.content) {
      actions.push({
        type: "noop",
        relativePath: asset.relativePath,
        sourceId: asset.sourceId,
        contentHash: desiredHash,
      });
      continue;
    }

    const currentHash = hashText(currentContent);
    const manifestEntry = existingManifest?.files[asset.relativePath];
    if (manifestEntry && manifestEntry.hash === currentHash) {
      actions.push({
        type: asset.assetClass === "buildable" ? "generate" : "update",
        relativePath: asset.relativePath,
        sourceId: asset.sourceId,
        content: asset.content,
        contentHash: desiredHash,
      });
      continue;
    }

    if (existingSkillFiles.has(asset.relativePath) && !manifestEntry) {
      actions.push({
        type: asset.assetClass === "buildable" ? "generate" : "update",
        relativePath: asset.relativePath,
        sourceId: asset.sourceId,
        content: asset.content,
        contentHash: desiredHash,
        reason: "Managed skill file is missing manifest metadata and will be refreshed.",
      });
      continue;
    }

    const conflictClassification = classifyReviewableManagedFileConflictPath(
      asset.relativePath,
    );
    const conflictResolution = getManagedFileConflictResolution(
      asset.relativePath,
      conflictClassification,
      managedFileConflictResolutions,
    );
    if (conflictClassification && conflictResolution === "overwrite") {
      actions.push({
        type: asset.assetClass === "buildable" ? "generate" : "update",
        relativePath: asset.relativePath,
        sourceId: asset.sourceId,
        content: asset.content,
        contentHash: desiredHash,
        reason: getManagedFileConflictOverwriteReason(conflictClassification.group),
      });
      continue;
    }

    conflictsRunId ??= createRunId();
    actions.push({
      type: "skip-conflict",
      relativePath: asset.relativePath,
      sourceId: asset.sourceId,
      content: asset.content,
      contentHash: desiredHash,
      reason: getManagedFileConflictSkipReason(
        conflictClassification,
        conflictResolution,
        Boolean(manifestEntry),
      ),
    });
  }

  if (existingManifest) {
    for (const [relativePath, manifestEntry] of Object.entries(existingManifest.files)) {
      if (relativePath in desiredFiles) {
        continue;
      }

      const absolutePath = relativePathToTarget(targetDir, relativePath);
      if (!existsSync(absolutePath)) {
        actions.push({
          type: "remove-managed",
          relativePath,
          sourceId: manifestEntry.sourceId,
        });
        continue;
      }

      const currentContent = readTextFile(absolutePath);
      const currentHash = hashText(currentContent);
      if (currentHash === manifestEntry.hash) {
        actions.push({
          type: "remove-managed",
          relativePath,
          sourceId: manifestEntry.sourceId,
        });
        continue;
      }

      conflictsRunId ??= createRunId();
      actions.push({
        type: "skip-conflict",
        relativePath,
        sourceId: manifestEntry.sourceId,
        reason: "Managed file was modified locally and will not be removed automatically.",
      });
    }

    for (const relativePath of existingSkillFiles) {
      if (relativePath in desiredFiles || relativePath in existingManifest.files) {
        continue;
      }

      actions.push({
        type: "remove-managed",
        relativePath,
        sourceId: `skill:${relativePath}`,
      });
    }
  }

  actions.sort((left, right) => left.relativePath.localeCompare(right.relativePath));

  return {
    packageName: packageMeta.name,
    packageVersion: packageMeta.version,
    profile,
    actions,
    desiredFiles,
    desiredSkillFiles: desiredSkillFiles.sort(),
    conflictsRunId,
  };
}

export async function createSkillsOnlyInstallPlan(options: {
  targetDir: string;
  packageMeta: PackageMeta;
  profile: InstallProfile;
  existingManifest: InstallManifest | null;
  remove: boolean;
}): Promise<InstallPlan> {
  const { targetDir, packageMeta, profile, existingManifest, remove } = options;
  const desiredSkillAssets = remove ? [] : await getDesiredSkillAssets(profile.selections);
  const desiredSkillFiles = desiredSkillAssets.map((asset) => asset.relativePath);
  const desiredFiles = Object.fromEntries(
    desiredSkillAssets.map((asset) => [
      asset.relativePath,
      {
        hash: hashText(asset.content),
        sourceId: asset.sourceId,
      },
    ]),
  );
  const previousSkillContent = await getPreviousSkillContentByPath(existingManifest);
  const existingSkillFiles = new Set(existingManifest?.skillFiles ?? []);
  const actions: PlannedAction[] = [];
  let conflictsRunId: string | undefined;

  if (!remove) {
    for (const asset of desiredSkillAssets) {
      const action = planDesiredSkillAsset({
        targetDir,
        asset,
        existingManifest,
        existingSkillFiles,
        previousSkillContent,
      });
      if (action.type === "skip-conflict") {
        conflictsRunId ??= createRunId();
      }
      actions.push(action);
    }
  }

  if (existingManifest) {
    for (const relativePath of existingSkillFiles) {
      if (relativePath in desiredFiles) {
        continue;
      }

      const action = planStaleSkillFile({
        targetDir,
        relativePath,
        existingManifest,
        previousSkillContent,
      });
      if (action.type === "skip-conflict") {
        conflictsRunId ??= createRunId();
      }
      actions.push(action);
    }
  }

  actions.sort((left, right) => left.relativePath.localeCompare(right.relativePath));

  return {
    packageName: packageMeta.name,
    packageVersion: packageMeta.version,
    profile,
    actions,
    desiredFiles,
    desiredSkillFiles: desiredSkillFiles.sort(),
    conflictsRunId,
  };
}

function planDesiredSkillAsset(options: {
  targetDir: string;
  asset: ResolvedAsset;
  existingManifest: InstallManifest | null;
  existingSkillFiles: Set<string>;
  previousSkillContent: Map<string, string>;
}): PlannedAction {
  const { targetDir, asset, existingManifest, existingSkillFiles, previousSkillContent } =
    options;
  const absolutePath = relativePathToTarget(targetDir, asset.relativePath);
  const desiredHash = hashText(asset.content);

  if (!existsSync(absolutePath)) {
    return {
      type: "create",
      relativePath: asset.relativePath,
      sourceId: asset.sourceId,
      content: asset.content,
      contentHash: desiredHash,
    };
  }

  const currentContent = readTextFile(absolutePath);
  if (currentContent === asset.content) {
    return {
      type: "noop",
      relativePath: asset.relativePath,
      sourceId: asset.sourceId,
      contentHash: desiredHash,
    };
  }

  const currentHash = hashText(currentContent);
  const manifestEntry = existingManifest?.files[asset.relativePath];
  if (manifestEntry && manifestEntry.hash === currentHash) {
    return {
      type: "update",
      relativePath: asset.relativePath,
      sourceId: asset.sourceId,
      content: asset.content,
      contentHash: desiredHash,
    };
  }

  const previousContent = previousSkillContent.get(asset.relativePath);
  if (
    existingSkillFiles.has(asset.relativePath) &&
    previousContent !== undefined &&
    currentContent === previousContent
  ) {
    return {
      type: "update",
      relativePath: asset.relativePath,
      sourceId: asset.sourceId,
      content: asset.content,
      contentHash: desiredHash,
      reason: "Managed skill file will be refreshed.",
    };
  }

  return {
    type: "skip-conflict",
    relativePath: asset.relativePath,
    sourceId: asset.sourceId,
    content: asset.content,
    contentHash: desiredHash,
    reason: existingSkillFiles.has(asset.relativePath)
      ? "Managed skill file was modified locally."
      : "Unmanaged skill file already exists with different content.",
  };
}

function planStaleSkillFile(options: {
  targetDir: string;
  relativePath: string;
  existingManifest: InstallManifest;
  previousSkillContent: Map<string, string>;
}): PlannedAction {
  const { targetDir, relativePath, existingManifest, previousSkillContent } = options;
  const manifestEntry = existingManifest.files[relativePath];
  const absolutePath = relativePathToTarget(targetDir, relativePath);

  if (!existsSync(absolutePath)) {
    return {
      type: "remove-managed",
      relativePath,
      sourceId: manifestEntry?.sourceId ?? `skill:${relativePath}`,
    };
  }

  const currentContent = readTextFile(absolutePath);
  const currentHash = hashText(currentContent);
  if (manifestEntry && manifestEntry.hash === currentHash) {
    return {
      type: "remove-managed",
      relativePath,
      sourceId: manifestEntry.sourceId,
    };
  }

  const previousContent = previousSkillContent.get(relativePath);
  if (!manifestEntry && (previousContent === undefined || currentContent === previousContent)) {
    return {
      type: "remove-managed",
      relativePath,
      sourceId: `skill:${relativePath}`,
    };
  }

  return {
    type: "skip-conflict",
    relativePath,
    sourceId: manifestEntry?.sourceId ?? `skill:${relativePath}`,
    reason: "Managed skill file was modified locally and will not be removed automatically.",
  };
}

async function getPreviousSkillContentByPath(
  existingManifest: InstallManifest | null,
): Promise<Map<string, string>> {
  if (!existingManifest) {
    return new Map();
  }

  const selections = structuredClone(existingManifest.selections);
  selections.skills = true;
  try {
    const previousAssets = await getDesiredSkillAssets(selections);
    return new Map(previousAssets.map((asset) => [asset.relativePath, asset.content]));
  } catch {
    return new Map();
  }
}

function getManagedFileConflictResolution(
  relativePath: string,
  classification: ReviewableManagedFileConflictClassification | null,
  managedFileConflictResolutions?: ManagedFileConflictResolutions,
): ManagedFileConflictResolution | null {
  if (!classification) {
    return null;
  }

  return managedFileConflictResolutions?.[relativePath] ?? null;
}

type ReviewableManagedFileConflictClassification = {
  group: ManagedFileConflictGroup;
  instructionKind?: InstructionKind;
};

export function classifyReviewableManagedFileConflictPath(
  relativePath: string,
): ReviewableManagedFileConflictClassification | null {
  if (relativePath.startsWith("docs/assets/references/")) {
    return {
      group: "references",
      instructionKind: getInstructionKindForPath(relativePath) ?? undefined,
    };
  }

  if (relativePath.startsWith("docs/assets/templates/")) {
    return {
      group: "templates",
      instructionKind: getInstructionKindForPath(relativePath) ?? undefined,
    };
  }

  const instructionKind = getInstructionKindForPath(relativePath);
  if (instructionKind) {
    return {
      group: "agent-instructions",
      instructionKind,
    };
  }

  return null;
}

function getInstructionKindForPath(relativePath: string): InstructionKind | null {
  const basename = path.posix.basename(relativePath);
  return INSTRUCTION_KINDS.includes(basename as InstructionKind)
    ? (basename as InstructionKind)
    : null;
}

function getManagedFileConflictOverwriteReason(group: ManagedFileConflictGroup): string {
  switch (group) {
    case "agent-instructions":
      return "Overwrite existing conflicting agent instruction file.";
    case "references":
      return "Overwrite existing conflicting reference file.";
    case "templates":
      return "Overwrite existing conflicting template file.";
  }
}

function getManagedFileConflictSkipReason(
  classification: ReviewableManagedFileConflictClassification | null,
  resolution: ManagedFileConflictResolution | null,
  isManifestOwned: boolean,
): string {
  if (!classification) {
    return isManifestOwned
      ? "Managed file was modified locally."
      : "Unmanaged file already exists with different content.";
  }

  if (resolution === "skip") {
    return `Existing conflicting ${getManagedFileConflictGroupLabel(
      classification.group,
    )} was explicitly skipped.`;
  }

  return `Existing conflicting ${getManagedFileConflictGroupLabel(
    classification.group,
  )} was skipped because no overwrite resolution was provided.`;
}

function getManagedFileConflictGroupLabel(group: ManagedFileConflictGroup): string {
  switch (group) {
    case "agent-instructions":
      return "agent instruction file";
    case "references":
      return "reference file";
    case "templates":
      return "template file";
  }
}
