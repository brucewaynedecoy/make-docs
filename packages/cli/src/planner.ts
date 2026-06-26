import { existsSync } from "node:fs";
import path from "node:path";
import {
  getDesiredAssetsForMaterializationMode,
  getSystemAssetMaterializationPlan,
} from "./catalog";
import { getManifestFileHash } from "./manifest";
import { parseManagedBlock, upsertManagedBlock } from "./managed-block";
import { getDesiredSkillAssets, getRetiredManagedSkillAssets } from "./skill-catalog";
import { createSystemAssetManifestState } from "./system-assets";
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
  SystemAssetMaterializationMode,
  SystemAssetManifestState,
} from "./types";
import { DEFAULT_SYSTEM_ASSET_MATERIALIZATION_MODE, INSTRUCTION_KINDS } from "./types";
import { hashText, readTextFile, relativePathToTarget, createRunId } from "./utils";

export async function createInstallPlan(options: {
  targetDir: string;
  packageMeta: PackageMeta;
  profile: InstallProfile;
  existingManifest: InstallManifest | null;
  managedFileConflictResolutions?: ManagedFileConflictResolutions;
  systemAssetMaterializationMode?: SystemAssetMaterializationMode;
}): Promise<InstallPlan> {
  const {
    targetDir,
    packageMeta,
    profile,
    existingManifest,
    managedFileConflictResolutions,
    systemAssetMaterializationMode = DEFAULT_SYSTEM_ASSET_MATERIALIZATION_MODE,
  } = options;
  const systemAssetMaterialization = getSystemAssetMaterializationPlan(
    profile,
    systemAssetMaterializationMode,
  );
  const desiredAssets = getDesiredAssetsForMaterializationMode(
    profile,
    systemAssetMaterializationMode,
  );
  const fullSnapshotAssets = getDesiredAssetsForMaterializationMode(
    profile,
    DEFAULT_SYSTEM_ASSET_MATERIALIZATION_MODE,
  );
  const desiredSkillAssets = await getDesiredSkillAssets(profile.selections);
  const desiredSkillFiles = desiredSkillAssets.map((asset) => asset.relativePath);
  const desiredSkillFileSet = new Set(desiredSkillFiles);
  const previousSkillContent = await getPreviousSkillContentByPath(existingManifest);
  const allDesiredAssets = [...desiredAssets, ...desiredSkillAssets];
  const baseDesiredFiles = Object.fromEntries(
    allDesiredAssets.map((asset) => [
      asset.relativePath,
      {
        hash: getManifestHashForAsset(asset),
        sourceId: asset.sourceId,
      },
    ]),
  );
  const systemAssetManifestState = createSystemAssetManifestState({
    mode: systemAssetMaterialization.mode,
    sourcePackage: packageMeta.name,
    sourceVersion: packageMeta.version,
    localBootstrapPaths: systemAssetMaterialization.localBootstrapPaths,
    deferredSystemAssetPaths: systemAssetMaterialization.deferredSystemAssetPaths,
    materializationClasses: systemAssetMaterialization.materializationClasses,
    expectedFiles: Object.fromEntries(
      fullSnapshotAssets.map((asset) => [
        asset.relativePath,
        {
          hash: getManifestHashForAsset(asset),
          sourceId: asset.sourceId,
        },
      ]),
    ),
    materializedFiles: baseDesiredFiles,
  });
  const desiredFiles = Object.fromEntries(
    Object.entries(baseDesiredFiles).map(([relativePath, entry]) => [
      relativePath,
      systemAssetManifestState.assets[relativePath]
        ? {
            ...entry,
            systemAsset: systemAssetManifestState.assets[relativePath],
          }
        : entry,
    ]),
  );

  const actions: PlannedAction[] = [];
  let conflictsRunId: string | undefined;
  const existingSkillFiles = new Set(existingManifest?.skillFiles ?? []);

  for (const asset of allDesiredAssets) {
    const absolutePath = relativePathToTarget(targetDir, asset.relativePath);
    const desiredHash = getManifestHashForAsset(asset);

    if (!existsSync(absolutePath)) {
      actions.push({
        type: "create",
        relativePath: asset.relativePath,
        sourceId: asset.sourceId,
        content: asset.content,
        contentHash: desiredHash,
      });
      continue;
    }

    const currentContent = readTextFile(absolutePath);
    const manifestEntry = existingManifest?.files[asset.relativePath];
    const currentHash = getCurrentManifestHash(asset.relativePath, currentContent);
    if (currentHash === desiredHash) {
      actions.push({
        type: "noop",
        relativePath: asset.relativePath,
        sourceId: asset.sourceId,
        contentHash: desiredHash,
      });
      continue;
    }

    const migrationContent = getInstructionMigrationContent(
      asset,
      currentContent,
      manifestEntry,
      currentHash,
    );
    if (migrationContent) {
      actions.push({
        type: "update",
        relativePath: asset.relativePath,
        sourceId: asset.sourceId,
        content: migrationContent.content,
        contentHash: desiredHash,
        reason: migrationContent.reason,
      });
      continue;
    }

    const conflictClassification = classifyReviewableManagedFileConflictPath(
      asset.relativePath,
      { isDesiredSkillAsset: desiredSkillFileSet.has(asset.relativePath) },
    );
    const conflictResolution = getManagedFileConflictResolution(
      asset.relativePath,
      conflictClassification,
      managedFileConflictResolutions,
    );
    if (conflictClassification && conflictResolution === "overwrite") {
      const content = getPlannedUpdateContent(asset, currentContent);
      actions.push({
        type: "update",
        relativePath: asset.relativePath,
        sourceId: asset.sourceId,
        content,
        contentHash: desiredHash,
        reason: getManagedFileConflictOverwriteReason(conflictClassification),
      });
      continue;
    }

    if (conflictClassification && conflictResolution === "skip") {
      actions.push({
        type: "skip",
        relativePath: asset.relativePath,
        sourceId: asset.sourceId,
        contentHash: desiredHash,
        reason: getManagedFileConflictSkipReason(
          conflictClassification,
          conflictResolution,
          Boolean(manifestEntry),
        ),
      });
      continue;
    }

    conflictsRunId ??= createRunId();
    actions.push({
      type: "skip-conflict",
      relativePath: asset.relativePath,
      sourceId: asset.sourceId,
      content: getPlannedUpdateContent(asset, currentContent),
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
      const currentHash = getCurrentManifestHash(relativePath, currentContent);
      const legacyFullFileHash = hashText(currentContent);
      const isCleanInstructionBlock =
        isInstructionPath(relativePath) &&
        currentHash === manifestEntry.hash &&
        instructionHasNoOutsideContent(currentContent);

      if (
        currentHash === manifestEntry.hash &&
        (!isInstructionPath(relativePath) || isCleanInstructionBlock)
      ) {
        actions.push({
          type: "remove-managed",
          relativePath,
          sourceId: manifestEntry.sourceId,
        });
        continue;
      }

      if (isInstructionPath(relativePath) && legacyFullFileHash === manifestEntry.hash) {
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
        reason:
          "Existing managed file differs from the recorded manifest and will not be removed automatically.",
      });
    }

    for (const relativePath of existingSkillFiles) {
      if (relativePath in desiredFiles || relativePath in existingManifest.files) {
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
    systemAssetMaterialization: systemAssetManifestState,
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
    systemAssetMaterialization: createSkillsOnlySystemAssetMaterializationPlan(),
    actions,
    desiredFiles,
    desiredSkillFiles: desiredSkillFiles.sort(),
    conflictsRunId,
  };
}

function createSkillsOnlySystemAssetMaterializationPlan(): SystemAssetManifestState {
  return {
    mode: DEFAULT_SYSTEM_ASSET_MATERIALIZATION_MODE,
    localBootstrapPaths: [],
    deferredSystemAssetPaths: [],
    materializationClasses: {},
    recoveryGuidance:
      "Skills-only sync preserves existing system asset provenance when a manifest is already present.",
    assets: {},
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
      ? "Existing managed skill file differs from the desired skill content."
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
    reason:
      "Existing managed file differs from the recorded manifest and will not be removed automatically.",
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
    const [previousAssets, retiredAssets] = await Promise.all([
      getDesiredSkillAssets(selections),
      getRetiredManagedSkillAssets(selections),
    ]);
    return new Map(
      [...previousAssets, ...retiredAssets].map((asset) => [
        asset.relativePath,
        asset.content,
      ]),
    );
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
  scope?: "file" | "managed-block";
};

export function classifyReviewableManagedFileConflictPath(
  relativePath: string,
  options: { isDesiredSkillAsset?: boolean } = {},
): ReviewableManagedFileConflictClassification | null {
  if (options.isDesiredSkillAsset || isSkillAssetPath(relativePath)) {
    return {
      group: "skills",
      instructionKind: getInstructionKindForPath(relativePath) ?? undefined,
    };
  }

  if (
    relativePath.startsWith(".make-docs/contracts/") ||
    relativePath.startsWith(".make-docs/references/") ||
    relativePath.startsWith("docs/assets/references/")
  ) {
    return {
      group: "references",
      instructionKind: getInstructionKindForPath(relativePath) ?? undefined,
    };
  }

  if (
    relativePath.startsWith(".make-docs/templates/") ||
    relativePath.startsWith("docs/assets/templates/")
  ) {
    return {
      group: "templates",
      instructionKind: getInstructionKindForPath(relativePath) ?? undefined,
    };
  }

  if (relativePath.startsWith("docs/assets/prompts/")) {
    return {
      group: "prompts",
      instructionKind: getInstructionKindForPath(relativePath) ?? undefined,
    };
  }

  const instructionKind = getInstructionKindForPath(relativePath);
  if (instructionKind) {
    return {
      group: "agent-instructions",
      instructionKind,
      scope: "managed-block",
    };
  }

  return {
    group: "managed-files",
  };
}

function getInstructionKindForPath(relativePath: string): InstructionKind | null {
  const basename = path.posix.basename(relativePath);
  return INSTRUCTION_KINDS.includes(basename as InstructionKind)
    ? (basename as InstructionKind)
    : null;
}

function isSkillAssetPath(relativePath: string): boolean {
  return (
    relativePath.startsWith(".claude/skills/") ||
    relativePath.startsWith(".claude/skill-assets/") ||
    relativePath.startsWith(".agents/skills/") ||
    relativePath.startsWith(".agents/skill-assets/")
  );
}

function getManagedFileConflictOverwriteReason(
  classification: ReviewableManagedFileConflictClassification,
): string {
  if (classification.scope === "managed-block") {
    return "Reassert the make-docs managed block inside the existing agent instruction file.";
  }

  switch (classification.group) {
    case "agent-instructions":
      return "Overwrite existing conflicting agent instruction file.";
    case "managed-files":
      return "Overwrite existing conflicting managed file.";
    case "prompts":
      return "Overwrite existing conflicting prompt file.";
    case "references":
      return "Overwrite existing conflicting reference file.";
    case "skills":
      return "Overwrite existing conflicting skill file.";
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
      ? "Existing managed file differs from the recorded manifest."
      : "Unmanaged file already exists with different content.";
  }

  if (resolution === "skip") {
    if (classification.scope === "managed-block") {
      return "Existing conflicting make-docs managed block was explicitly kept.";
    }

    return `Existing conflicting ${getManagedFileConflictGroupLabel(
      classification.group,
    )} was explicitly skipped.`;
  }

  if (classification.scope === "managed-block") {
    return "Existing conflicting make-docs managed block was skipped because no reassert resolution was provided.";
  }

  return `Existing conflicting ${getManagedFileConflictGroupLabel(
    classification.group,
  )} was skipped because no overwrite resolution was provided.`;
}

function getManagedFileConflictGroupLabel(group: ManagedFileConflictGroup): string {
  switch (group) {
    case "agent-instructions":
      return "agent instruction file";
    case "managed-files":
      return "managed file";
    case "prompts":
      return "prompt file";
    case "references":
      return "reference file";
    case "skills":
      return "skill file";
    case "templates":
      return "template file";
  }
}

function getManifestHashForAsset(asset: ResolvedAsset): string {
  const manifestHash = getManifestFileHash(asset.relativePath, asset.content);
  if (manifestHash === null) {
    throw new Error(`Instruction asset ${asset.relativePath} is missing a valid managed block.`);
  }

  return manifestHash;
}

function getCurrentManifestHash(relativePath: string, content: string): string | null {
  return getManifestFileHash(relativePath, content);
}

function getPlannedUpdateContent(asset: ResolvedAsset, currentContent: string): string {
  if (!isInstructionPath(asset.relativePath)) {
    return asset.content;
  }

  const parsed = parseManagedBlock(asset.content);
  if (parsed.state !== "valid" || parsed.body === null) {
    return asset.content;
  }

  return upsertManagedBlock(currentContent, parsed.body).content;
}

function isInstructionPath(relativePath: string): boolean {
  return getInstructionKindForPath(relativePath) !== null;
}

function instructionHasNoOutsideContent(content: string): boolean {
  const parsed = parseManagedBlock(content);
  return (
    parsed.state === "valid" &&
    parsed.prefix.trim().length === 0 &&
    parsed.suffix.trim().length === 0
  );
}

function getInstructionMigrationContent(
  asset: ResolvedAsset,
  currentContent: string,
  manifestEntry: InstallManifest["files"][string] | undefined,
  currentHash: string | null,
): { content: string; reason: string } | null {
  if (!isInstructionPath(asset.relativePath)) {
    return null;
  }

  const currentBlock = parseManagedBlock(currentContent);
  if (currentBlock.state !== "absent") {
    if (
      currentBlock.state === "valid" &&
      currentHash !== null &&
      manifestEntry?.hash === currentHash
    ) {
      return {
        content: getPlannedUpdateContent(asset, currentContent),
        reason: "Refresh the manifest-owned instruction block to the current routing.",
      };
    }

    return null;
  }

  if (manifestEntry) {
    if (manifestEntry.hash !== hashText(currentContent)) {
      return null;
    }

    return {
      content: asset.content,
      reason: "Migrate legacy instruction file to the managed-block model.",
    };
  }

  return {
    content: getPlannedUpdateContent(asset, currentContent),
    reason: "Insert the make-docs managed block into the existing instruction file.",
  };
}
