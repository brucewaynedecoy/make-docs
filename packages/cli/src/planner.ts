import { existsSync, lstatSync, readdirSync, readlinkSync, statSync } from "node:fs";
import path from "node:path";
import {
  getDesiredAssetsForMaterializationMode,
  getSystemAssetMaterializationPlan,
} from "./catalog";
import { classifyAgenticSkillFileRole } from "./agentic-skill-roles";
import { getManifestFileHash, MANIFEST_RELATIVE_PATH, RETIRED_PLAYBOOK_CONTRACT_PATH,
  RETIRED_PLAYBOOK_CONTRACT_HASH, hasTrustedRetiredPlaybookContractOwnership } from "./manifest";
import { parseManagedBlock, upsertManagedBlock } from "./managed-block";
import { getDesiredSkillAssets, getRetiredManagedSkillAssets } from "./skill-catalog";
import type { SkillRegistry } from "./skill-registry";
import { createSystemAssetManifestState } from "./system-assets";
import {
  getSystemToolResourceMigrationTarget,
  isToolDirectorySystemResourcePath,
} from "./tool-directory";
import {
  applyP4ManifestOwnership,
  buildSelectedResourceProjection,
  createProjectSurfaceRouterAssets,
  createRouterOwnershipManifestState,
  createThinRouterAssets,
  resourceProjectionStops,
} from "./project-projection";
import {
  annotateLifecycleActions,
  createLifecyclePlanSnapshot,
} from "./lifecycle-plan";
import { isRetiredTemplateOwnedChildRouterPath } from "./router-paths";
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
  ResolvedInstallAsset,
  ResolvedSkillExposureAsset,
  SystemAssetMaterializationMode,
  SystemAssetManifestState,
} from "./types";
import { DEFAULT_SYSTEM_ASSET_MATERIALIZATION_MODE, INSTRUCTION_KINDS } from "./types";
import {
  assertManagedPathHasNoSymlinks,
  createRunId,
  hashText,
  readTextFile,
  relativePathToTarget,
} from "./utils";

export async function createInstallPlan(options: {
  targetDir: string;
  packageMeta: PackageMeta;
  profile: InstallProfile;
  existingManifest: InstallManifest | null;
  managedFileConflictResolutions?: ManagedFileConflictResolutions;
  systemAssetMaterializationMode?: SystemAssetMaterializationMode;
  skillRegistry?: SkillRegistry;
  operation?: "setup" | "setup.reconfigure" | "setup.sync";
}): Promise<InstallPlan> {
  const {
    targetDir,
    packageMeta,
    profile,
    existingManifest,
    managedFileConflictResolutions,
    systemAssetMaterializationMode = DEFAULT_SYSTEM_ASSET_MATERIALIZATION_MODE,
    skillRegistry,
    operation = existingManifest ? "setup.sync" : "setup",
  } = options;
  const p4ProjectionSelected = profile.selections.resourceProjection !== undefined;
  if (p4ProjectionSelected) {
    assertManagedPathHasNoSymlinks(targetDir, MANIFEST_RELATIVE_PATH);
  }
  const effectiveMaterializationMode = p4ProjectionSelected
    ? "provider-backed"
    : systemAssetMaterializationMode;
  const systemAssetMaterialization = getSystemAssetMaterializationPlan(
    profile,
    effectiveMaterializationMode,
  );
  let desiredAssets = getDesiredAssetsForMaterializationMode(
    profile,
    effectiveMaterializationMode,
  );
  const verifiedAt = new Date().toISOString();
  const selectedProjection = buildSelectedResourceProjection({
    profile,
    selectionTrigger:
      operation === "setup.reconfigure"
        ? "reconfigure-selection"
        : "setup-selection",
    verifiedAt,
    existingState: existingManifest?.resourceProjection,
  });
  const thinRouterAssets = createThinRouterAssets(profile);
  const carriedOnDemandRouterAssets = getCarriedOnDemandRouterAssets({
    targetDir,
    profile,
    existingManifest,
  });
  const routerAssets = [...thinRouterAssets, ...carriedOnDemandRouterAssets];
  const thinRouterPaths = new Set(
    thinRouterAssets.map((asset) => asset.relativePath),
  );
  const fullSnapshotAssets = getDesiredAssetsForMaterializationMode(
    profile,
    DEFAULT_SYSTEM_ASSET_MATERIALIZATION_MODE,
  );
  const preserveManagedSnapshotAssets = p4ProjectionSelected && existingManifest !== null;
  const preservedFullSnapshotAssets = preserveManagedSnapshotAssets
    ? fullSnapshotAssets.filter((asset) =>
        existingManifest.files[asset.relativePath]?.systemAsset?.localPath === asset.relativePath &&
        existingManifest.files[asset.relativePath]?.systemAsset?.expectedHashes.includes(
          existingManifest.files[asset.relativePath]!.hash,
        ) === true &&
        !(
          isToolDirectorySystemResourcePath(asset.relativePath) &&
          !isInstructionPath(asset.relativePath)
        ),
      )
    : [];
  desiredAssets = [
    ...desiredAssets.filter((asset) => !thinRouterPaths.has(asset.relativePath)),
    ...preservedFullSnapshotAssets.filter((asset) => !thinRouterPaths.has(asset.relativePath)),
    ...thinRouterAssets,
    ...carriedOnDemandRouterAssets,
    ...(selectedProjection?.assets ?? []),
  ]
    .filter((asset, index, assets) =>
      assets.findIndex((candidate) => candidate.relativePath === asset.relativePath) === index,
    )
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));
  const desiredSkillAssets = await getDesiredSkillAssets(
    profile.selections,
    skillRegistry,
  );
  const desiredSkillFiles = desiredSkillAssets.map((asset) => asset.relativePath);
  const desiredSkillFileSet = new Set(desiredSkillFiles);
  const previousSkillContent = await getPreviousSkillContentByPath(existingManifest);
  const allDesiredAssets: ResolvedInstallAsset[] = [
    ...desiredAssets,
    ...desiredSkillAssets,
  ];
  const baseDesiredFiles = Object.fromEntries(
    allDesiredAssets.map((asset) => [
      asset.relativePath,
      {
        hash: getManifestHashForAsset(asset),
        sourceId: asset.sourceId,
        ...(isSkillExposureAsset(asset)
          ? { skillExposure: asset.skillExposure }
          : {}),
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
      applyP4ManifestOwnership(
        relativePath,
        systemAssetManifestState.assets[relativePath]
          ? {
            ...entry,
            systemAsset: systemAssetManifestState.assets[relativePath],
          }
          : entry,
      ),
    ]),
  );
  let forceManifestWrite = existingManifest !== null && Object.entries(desiredFiles)
    .some(([relativePath, entry]) =>
      JSON.stringify(existingManifest.files[relativePath] ?? null) !== JSON.stringify(entry),
    );

  const actions: PlannedAction[] = [];
  let conflictsRunId: string | undefined;
  const existingSkillFiles = new Set(existingManifest?.skillFiles ?? []);

  for (const asset of allDesiredAssets) {
    if (desiredSkillFileSet.has(asset.relativePath)) {
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
      continue;
    }

    if (isSkillExposureAsset(asset)) {
      throw new Error(
        `Skill exposure asset ${asset.relativePath} is missing from the desired skill file set.`,
      );
    }
    if (p4ProjectionSelected) {
      assertManagedPathHasNoSymlinks(targetDir, asset.relativePath);
    }

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

    if (
      asset.sourceId.startsWith("resource:") &&
      !hasVerifiedResourceOwnership(existingManifest, asset.relativePath, asset.sourceId)
    ) {
      conflictsRunId ??= createRunId();
      actions.push({
        type: "skip-conflict",
        relativePath: asset.relativePath,
        sourceId: asset.sourceId,
        content: asset.content,
        contentHash: desiredHash,
        reason:
          "Existing resource path lacks verified URI, provider, digest, destination, and ownership evidence.",
      });
      continue;
    }

    if (
      isInstructionPath(asset.relativePath) &&
      parseManagedBlock(currentContent).state === "malformed"
    ) {
      conflictsRunId ??= createRunId();
      actions.push({
        type: "skip-conflict",
        relativePath: asset.relativePath,
        sourceId: asset.sourceId,
        content: asset.content,
        contentHash: desiredHash,
        reason: "The managed block is malformed or duplicated. Repair it before setup can continue.",
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

    if (
      manifestEntry &&
      currentHash === manifestEntry.hash &&
      manifestEntry.sourceId === asset.sourceId &&
      manifestEntry.systemAsset?.logicalAssetId === asset.relativePath &&
      manifestEntry.systemAsset.localPath === asset.relativePath &&
      manifestEntry.systemAsset.expectedHashes.includes(manifestEntry.hash)
    ) {
      actions.push({
        type: "update",
        relativePath: asset.relativePath,
        sourceId: asset.sourceId,
        content: asset.content,
        contentHash: desiredHash,
        reason: "Refresh the verified clean managed system asset.",
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

      if (manifestEntry.ownershipClass === "project-owned") {
        actions.push({
          type: "skip",
          relativePath,
          sourceId: manifestEntry.sourceId,
          reason: "Preserve project-owned content outside the current managed asset set.",
        });
        continue;
      }

      if (relativePath === RETIRED_PLAYBOOK_CONTRACT_PATH) {
        let clean = false;
        try {
          assertManagedPathHasNoSymlinks(targetDir, relativePath);
          const retiredPath = relativePathToTarget(targetDir, relativePath);
          clean = hasTrustedRetiredPlaybookContractOwnership(manifestEntry) &&
            (!existsSync(retiredPath) || (lstatSync(retiredPath).isFile() &&
              hashText(readTextFile(retiredPath)) === RETIRED_PLAYBOOK_CONTRACT_HASH));
        } catch { /* An unsafe or ambiguous legacy path is preserved. */ }
        actions.push({
          type: clean ? "remove-managed" : "skip",
          relativePath,
          sourceId: manifestEntry.sourceId,
          ...(clean ? { contentHash: RETIRED_PLAYBOOK_CONTRACT_HASH } : {}),
          reason: clean
            ? "Retire the verified shipped Playbook contract at checkpoint 11 after backup."
            : "Preserve the legacy Playbook contract because trusted ownership and unchanged regular-file bytes are not proved.",
        });
        continue;
      }

      const absolutePath = relativePathToTarget(targetDir, relativePath);
      if (
        p4ProjectionSelected ||
        isInstructionPath(relativePath) ||
        isPreservedLegacyPlaybook(relativePath) ||
        isRetiredTemplateOwnedChildRouterPath(relativePath)
      ) {
        assertManagedPathHasNoSymlinks(targetDir, relativePath);
      }
      if (isPreservedLegacyPlaybook(relativePath) && existsSync(absolutePath)) {
        if (!lstatSync(absolutePath).isFile()) {
          conflictsRunId ??= createRunId();
          actions.push({
            type: "skip-conflict",
            relativePath,
            sourceId: manifestEntry.sourceId,
            reason:
              "Legacy Playbook adoption stopped because the preserved path is not a regular file.",
          });
          continue;
        }
        const currentHash = hashText(readTextFile(absolutePath));
        const projectSourceId = `project:${relativePath}`;
        desiredFiles[relativePath] = {
          hash: currentHash,
          sourceId: projectSourceId,
          ownershipClass: "project-owned",
        };
        forceManifestWrite = true;
        actions.push({
          type: "noop",
          relativePath,
          sourceId: projectSourceId,
          contentHash: currentHash,
          reason:
            "Adopt the preserved legacy Playbook as project-owned content after the shipped default retires.",
        });
        continue;
      }

      if (!existsSync(absolutePath)) {
        actions.push({
          type: "remove-managed",
          relativePath,
          sourceId: manifestEntry.sourceId,
        });
        continue;
      }

      if (manifestEntry.skillExposure) {
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
        continue;
      }

      if (!lstatSync(absolutePath).isFile()) {
        conflictsRunId ??= createRunId();
        actions.push({
          type: "skip-conflict",
          relativePath,
          sourceId: manifestEntry.sourceId,
          reason:
            "Existing managed file path is no longer a regular file and will not be removed automatically.",
        });
        continue;
      }

      if (
        manifestEntry.sourceId.startsWith("resource:") &&
        !hasVerifiedResourceOwnership(existingManifest, relativePath, manifestEntry.sourceId)
      ) {
        conflictsRunId ??= createRunId();
        actions.push({
          type: "skip-conflict",
          relativePath,
          sourceId: manifestEntry.sourceId,
          reason:
            "Resource removal stopped because verified URI, provider, digest, destination, and ownership evidence is incomplete.",
        });
        continue;
      }

      const currentContent = readTextFile(absolutePath);
      const currentHash = getCurrentManifestHash(relativePath, currentContent);
      const legacyFullFileHash = hashText(currentContent);
      const legacyMigrationTarget = getSystemToolResourceMigrationTarget(relativePath);
      const parsedInstructionBlock = isInstructionPath(relativePath)
        ? parseManagedBlock(currentContent)
        : null;
      const isCleanInstructionBlock =
        parsedInstructionBlock?.state === "valid" &&
        currentHash === manifestEntry.hash &&
        instructionHasNoOutsideContent(currentContent);
      const hasOutsideInstructionContent =
        parsedInstructionBlock?.state === "valid" &&
        (
          parsedInstructionBlock.prefix.trim().length > 0 ||
          parsedInstructionBlock.suffix.trim().length > 0
        );

      if (
        legacyMigrationTarget &&
        !hasVerifiedLegacySystemResourceOwnership(
          existingManifest,
          relativePath,
          manifestEntry,
        )
      ) {
        conflictsRunId ??= createRunId();
        actions.push({
          type: "skip-conflict",
          relativePath,
          sourceId: manifestEntry.sourceId,
          reason:
            `Legacy system resource migration or removal at ${relativePath} stopped because managed ownership and trusted hashes are incomplete.`,
        });
        continue;
      }

      if (
        currentHash === manifestEntry.hash &&
        (!isInstructionPath(relativePath) || isCleanInstructionBlock)
      ) {
        actions.push({
          type: "remove-managed",
          relativePath,
          sourceId: manifestEntry.sourceId,
          ...(legacyMigrationTarget && legacyMigrationTarget in desiredFiles
            ? {
                reason:
                  `Remove verified legacy system resource after ${legacyMigrationTarget} is materialized.`,
              }
            : {}),
        });
        continue;
      }

      if (currentHash === manifestEntry.hash && hasOutsideInstructionContent) {
        actions.push({
          type: "strip-managed-block",
          relativePath,
          sourceId: manifestEntry.sourceId,
          content: `${parsedInstructionBlock.prefix}${parsedInstructionBlock.suffix}`,
          reason: "Remove the clean managed block and preserve project content outside it.",
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

  const annotatedActions = annotateLifecycleActions(actions
    .map(withAgenticRole)
    .sort(comparePlannedActions));
  const stops = Array.from(new Set([
    ...resourceProjectionStops(annotatedActions),
    ...annotatedActions
      .filter((action) => action.reason?.includes("managed block is malformed"))
      .map((action) => action.relativePath),
  ])).sort();

  return {
    packageName: packageMeta.name,
    packageVersion: packageMeta.version,
    profile,
    systemAssetMaterialization: systemAssetManifestState,
    actions: annotatedActions,
    desiredFiles,
    desiredSkillFiles: desiredSkillFiles.sort(),
    conflictsRunId,
    operation,
    routerOwnership: createRouterOwnershipManifestState(profile, routerAssets, {
      packageMeta,
      verifiedAt,
      existingState: existingManifest?.routerOwnership,
    }),
    resourceProjection: selectedProjection.state,
    classificationSnapshot: createLifecyclePlanSnapshot(
      targetDir,
      annotatedActions,
      [MANIFEST_RELATIVE_PATH],
    ),
    stops,
    forceManifestWrite,
  };
}

function isPreservedLegacyPlaybook(relativePath: string): boolean {
  return [
    "docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md",
    "docs/assets/playbooks/agent/naive-uat-facilitator.playbook.md",
    "docs/assets/playbooks/user/naive-uat-tester.playbook.md",
  ].includes(relativePath);
}

export async function createSkillsOnlyInstallPlan(options: {
  targetDir: string;
  packageMeta: PackageMeta;
  profile: InstallProfile;
  existingManifest: InstallManifest | null;
  remove: boolean;
  skillRegistry?: SkillRegistry;
}): Promise<InstallPlan> {
  const { targetDir, packageMeta, profile, existingManifest, remove, skillRegistry } = options;
  const desiredSkillAssets = remove
    ? []
    : await getDesiredSkillAssets(profile.selections, skillRegistry);
  const desiredSkillFiles = desiredSkillAssets.map((asset) => asset.relativePath);
  const desiredFiles = Object.fromEntries(
    desiredSkillAssets.map((asset) => [
      asset.relativePath,
      {
        hash: getManifestHashForAsset(asset),
        sourceId: asset.sourceId,
        ...(isSkillExposureAsset(asset)
          ? { skillExposure: asset.skillExposure }
          : {}),
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

  const annotatedActions = actions
    .map(withAgenticRole)
    .sort(comparePlannedActions);

  const needsCurrentOwnershipProof =
    !(remove && !existingManifest) &&
    (!existingManifest?.routerOwnership || !existingManifest.resourceProjection);
  const proofPlan = needsCurrentOwnershipProof
    ? await createInstallPlan({
        targetDir,
        packageMeta,
        profile: {
          ...profile,
          selections: {
            ...profile.selections,
            resourceProjection: [],
          },
        },
        existingManifest,
        operation: existingManifest ? "setup.sync" : "setup",
      })
    : null;
  const routerActions = proofPlan?.actions.filter((action) =>
    action.sourceId?.startsWith("router:"),
  ) ?? [];
  const routerDesiredFiles = Object.fromEntries(
    Object.entries(proofPlan?.desiredFiles ?? {}).filter(([, entry]) =>
      entry.sourceId.startsWith("router:"),
    ),
  );

  return {
    packageName: packageMeta.name,
    packageVersion: packageMeta.version,
    profile,
    systemAssetMaterialization:
      proofPlan?.systemAssetMaterialization ?? createSkillsOnlySystemAssetMaterializationPlan(),
    actions: [...routerActions, ...annotatedActions].sort(comparePlannedActions),
    desiredFiles: { ...routerDesiredFiles, ...desiredFiles },
    desiredSkillFiles: desiredSkillFiles.sort(),
    conflictsRunId,
    routerOwnership: proofPlan?.routerOwnership ?? existingManifest?.routerOwnership,
    resourceProjection: proofPlan?.resourceProjection ?? existingManifest?.resourceProjection,
  };
}

function withAgenticRole(action: PlannedAction): PlannedAction {
  if (action.skillExposure) {
    return {
      ...action,
      agenticRole:
        action.skillExposure.mode === "copy-mirror"
          ? "copy-mirror"
          : "native-exposure",
    };
  }

  const agenticRole = classifyAgenticSkillFileRole({
    relativePath: action.relativePath,
    sourceId: action.sourceId,
  });

  return agenticRole ? { ...action, agenticRole } : action;
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
  asset: ResolvedInstallAsset;
  existingManifest: InstallManifest | null;
  existingSkillFiles: Set<string>;
  previousSkillContent: Map<string, string>;
}): PlannedAction {
  const { targetDir, asset, existingManifest, existingSkillFiles, previousSkillContent } =
    options;

  if (isSkillExposureAsset(asset)) {
    return planDesiredSkillExposure({
      targetDir,
      asset,
      existingManifest,
      previousSkillContent,
    });
  }

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

function planDesiredSkillExposure(options: {
  targetDir: string;
  asset: ResolvedSkillExposureAsset;
  existingManifest: InstallManifest | null;
  previousSkillContent: Map<string, string>;
}): PlannedAction {
  const { targetDir, asset, existingManifest, previousSkillContent } = options;
  const absolutePath = relativePathToTarget(targetDir, asset.relativePath);
  const desiredHash = getSkillExposureHash(asset);
  const manifestEntry = existingManifest?.files[asset.relativePath];
  const baseAction = {
    relativePath: asset.relativePath,
    sourceId: asset.sourceId,
    skillExposure: asset.skillExposure,
    copyMirrorAssets: asset.copyMirrorAssets,
    contentHash: desiredHash,
  };

  if (!existsSync(absolutePath)) {
    return {
      ...baseAction,
      type: "create",
    };
  }

  const existingExposure = classifyExistingSkillExposure(targetDir, asset);
  if (existingExposure === "symlink" || existingExposure === "copy-mirror") {
    return {
      ...baseAction,
      type: "noop",
      skillExposure: {
        ...asset.skillExposure,
        mode: existingExposure,
      },
    };
  }

  if (existingExposure === "legacy-clean-managed") {
    return {
      ...baseAction,
      type: "update",
      reason: "Clean managed harness stub or duplicated payload will be replaced with a native skill exposure.",
    };
  }

  if (manifestEntry?.hash === getSkillExposureHash(asset)) {
    return {
      ...baseAction,
      type: "update",
      reason: "Managed native skill exposure will be refreshed.",
    };
  }

  if (
    isCleanManifestOwnedLegacySkillExposureDirectory(
      targetDir,
      asset.relativePath,
      existingManifest,
    )
  ) {
    return {
      ...baseAction,
      type: "update",
      reason:
        "Clean manifest-owned harness stub or duplicated payload will be replaced with a native skill exposure.",
    };
  }

  if (isCleanLegacySkillExposureDirectory(targetDir, asset.relativePath, previousSkillContent)) {
    return {
      ...baseAction,
      type: "update",
      reason: "Clean legacy managed skill directory will be replaced with a native skill exposure.",
    };
  }

  return {
    ...baseAction,
    type: "skip-conflict",
    reason:
      "Existing harness skill path is not a managed native exposure and will not be replaced automatically.",
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

  const stats = lstatSync(absolutePath);
  if (!stats.isFile()) {
      if (
        (manifestEntry?.skillExposure || isSkillExposurePath(relativePath)) &&
        isManagedSkillExposurePath(
          absolutePath,
          targetDir,
          relativePath,
          previousSkillContent,
          manifestEntry?.skillExposure,
        )
      ) {
        return {
          type: "remove-managed",
          relativePath,
          sourceId: manifestEntry?.sourceId ?? `skill:${relativePath}`,
        skillExposure: manifestEntry?.skillExposure,
      };
    }

    return {
      type: "skip-conflict",
      relativePath,
      sourceId: manifestEntry?.sourceId ?? `skill:${relativePath}`,
      reason:
        "Existing managed skill path is no longer a regular file and will not be removed automatically.",
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
      [...retiredAssets, ...previousAssets]
        .flatMap((asset) =>
          isSkillExposureAsset(asset) ? asset.copyMirrorAssets : [asset],
        )
        .map((asset) => [asset.relativePath, asset.content]),
    );
  } catch {
    return new Map();
  }
}

function classifyExistingSkillExposure(
  targetDir: string,
  asset: ResolvedSkillExposureAsset,
): "symlink" | "copy-mirror" | "legacy-clean-managed" | "conflict" {
  const absolutePath = relativePathToTarget(targetDir, asset.relativePath);
  const stats = lstatSync(absolutePath);

  if (stats.isSymbolicLink()) {
    const currentTarget = path.resolve(
      path.dirname(absolutePath),
      readlinkSync(absolutePath),
    );
    const expectedTarget = relativePathToTarget(
      targetDir,
      asset.skillExposure.canonicalPayloadPath,
    );
    return path.resolve(currentTarget) === path.resolve(expectedTarget)
      ? "symlink"
      : "conflict";
  }

  if (!stats.isDirectory()) {
    return "conflict";
  }

  if (copyMirrorMatches(asset.copyMirrorAssets, targetDir, asset.relativePath)) {
    return "copy-mirror";
  }

  return "conflict";
}

function isCleanManifestOwnedLegacySkillExposureDirectory(
  targetDir: string,
  relativePath: string,
  existingManifest: InstallManifest | null,
): boolean {
  const absolutePath = relativePathToTarget(targetDir, relativePath);
  if (!existingManifest || !existsSync(absolutePath) || !lstatSync(absolutePath).isDirectory()) {
    return false;
  }

  const descendantPaths = listDescendantFilePaths(absolutePath).map((filePath) =>
    normalizeSkillDescendantPath(targetDir, relativePath, filePath),
  );
  if (descendantPaths.length === 0) {
    return false;
  }

  return descendantPaths.every((descendantPath) => {
    const manifestEntry = existingManifest.files[descendantPath];
    return (
      manifestEntry !== undefined &&
      isLegacySkillSourceId(manifestEntry.sourceId) &&
      getManifestFileHash(
        descendantPath,
        readTextFile(relativePathToTarget(targetDir, descendantPath)),
      ) === manifestEntry.hash
    );
  });
}

function isLegacySkillSourceId(sourceId: string): boolean {
  return (
    sourceId.startsWith("skill-stub:") ||
    sourceId.startsWith("skill:") ||
    sourceId.startsWith("skill-asset:") ||
    sourceId.startsWith("retired-skill-asset:")
  );
}

function isCleanLegacySkillExposureDirectory(
  targetDir: string,
  relativePath: string,
  previousSkillContent: Map<string, string>,
): boolean {
  const absolutePath = relativePathToTarget(targetDir, relativePath);
  if (!existsSync(absolutePath) || !lstatSync(absolutePath).isDirectory()) {
    return false;
  }

  const descendantPaths = listDescendantFilePaths(absolutePath).map((filePath) =>
    normalizeSkillDescendantPath(targetDir, relativePath, filePath),
  );
  if (descendantPaths.length === 0) {
    return true;
  }

  return descendantPaths.every((descendantPath) => {
    const expectedContent = previousSkillContent.get(descendantPath);
    return (
      expectedContent !== undefined &&
      readTextFile(relativePathToTarget(targetDir, descendantPath)) === expectedContent
    );
  });
}

function copyMirrorMatches(
  copyMirrorAssets: ResolvedAsset[],
  targetDir: string,
  exposurePath: string,
): boolean {
  const absoluteExposurePath = relativePathToTarget(targetDir, exposurePath);
  if (!existsSync(absoluteExposurePath) || !lstatSync(absoluteExposurePath).isDirectory()) {
    return false;
  }

  const expectedContentByPath = new Map(
    copyMirrorAssets.map((asset) => [normalizePlanPath(asset.relativePath), asset.content]),
  );
  const existingFiles = listDescendantFilePaths(absoluteExposurePath).map((filePath) =>
    normalizeSkillDescendantPath(targetDir, exposurePath, filePath),
  );

  if (existingFiles.length !== expectedContentByPath.size) {
    return false;
  }

  return existingFiles.every((relativePath) => {
    const expectedContent = expectedContentByPath.get(relativePath);
    return (
      expectedContent !== undefined &&
      readTextFile(relativePathToTarget(targetDir, relativePath)) === expectedContent
    );
  });
}

function listDescendantFilePaths(root: string): string[] {
  const entries = readdirSync(root, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      return listDescendantFilePaths(entryPath);
    }
    if (entry.isFile()) {
      return [entryPath];
    }
    return [];
  });
}

function isManagedSkillExposurePath(
  absolutePath: string,
  targetDir: string,
  relativePath: string,
  previousSkillContent: Map<string, string>,
  manifestSkillExposure?: InstallManifest["files"][string]["skillExposure"],
): boolean {
  const stats = lstatSync(absolutePath);
  if (stats.isSymbolicLink()) {
    if (manifestSkillExposure?.canonicalPayloadPath) {
      return skillExposureSymlinkTargetMatches(
        absolutePath,
        targetDir,
        manifestSkillExposure.canonicalPayloadPath,
      );
    }

    return skillExposureDescendantsMatch(targetDir, relativePath, previousSkillContent);
  }
  return (
    stats.isDirectory() &&
    isCleanLegacySkillExposureDirectory(targetDir, relativePath, previousSkillContent)
  );
}

function skillExposureSymlinkTargetMatches(
  absolutePath: string,
  targetDir: string,
  canonicalPayloadPath: string,
): boolean {
  const currentTarget = path.resolve(path.dirname(absolutePath), readlinkSync(absolutePath));
  const expectedTarget = relativePathToTarget(targetDir, canonicalPayloadPath);
  return path.resolve(currentTarget) === path.resolve(expectedTarget);
}

function skillExposureDescendantsMatch(
  targetDir: string,
  relativePath: string,
  previousSkillContent: Map<string, string>,
): boolean {
  const absolutePath = relativePathToTarget(targetDir, relativePath);
  if (!existsSync(absolutePath) || !statSync(absolutePath).isDirectory()) {
    return false;
  }

  const descendantPaths = listDescendantFilePaths(absolutePath).map((filePath) =>
    normalizeSkillDescendantPath(targetDir, relativePath, filePath),
  );

  return descendantPaths.every((descendantPath) => {
    const expectedContent = previousSkillContent.get(descendantPath);
    return (
      expectedContent !== undefined &&
      readTextFile(relativePathToTarget(targetDir, descendantPath)) === expectedContent
    );
  });
}

function normalizeSkillDescendantPath(
  targetDir: string,
  skillRootPath: string,
  descendantPath: string,
): string {
  return path.isAbsolute(skillRootPath)
    ? normalizePlanPath(descendantPath)
    : normalizePlanPath(path.relative(targetDir, descendantPath));
}

function isSkillExposurePath(relativePath: string): boolean {
  const normalizedPath = normalizePlanPath(relativePath);
  return (
    normalizedPath.startsWith(".claude/skills/") ||
    normalizedPath.startsWith(".agents/skills/") ||
    normalizedPath.includes("/.claude/skills/") ||
    normalizedPath.includes("/.agents/skills/")
  );
}

function comparePlannedActions(left: PlannedAction, right: PlannedAction): number {
  const leftLegacyRemoval = isLegacySystemResourceRemoval(left);
  const rightLegacyRemoval = isLegacySystemResourceRemoval(right);
  if (leftLegacyRemoval !== rightLegacyRemoval) {
    return leftLegacyRemoval ? 1 : -1;
  }
  if (left.relativePath === right.relativePath) {
    return getActionOrder(left) - getActionOrder(right);
  }

  if (isDescendantPath(right.relativePath, left.relativePath)) {
    return getAncestorActionOrder(left) - getDescendantActionOrder(right);
  }

  if (isDescendantPath(left.relativePath, right.relativePath)) {
    return getDescendantActionOrder(left) - getAncestorActionOrder(right);
  }

  return left.relativePath.localeCompare(right.relativePath);
}

function isLegacySystemResourceRemoval(action: PlannedAction): boolean {
  return (
    action.type === "remove-managed" &&
    action.reason?.startsWith("Remove verified legacy system resource after ") === true
  );
}

function hasVerifiedLegacySystemResourceOwnership(
  manifest: InstallManifest,
  relativePath: string,
  entry: InstallManifest["files"][string],
): boolean {
  if (entry.ownershipClass === "managed-projection") {
    return hasVerifiedResourceOwnership(manifest, relativePath, entry.sourceId);
  }
  if (entry.ownershipClass === "managed-block") {
    return (
      entry.sourceId === `file:${relativePath}` ||
      entry.sourceId.startsWith("router:")
    );
  }
  if (
    entry.ownershipClass !== undefined &&
    entry.ownershipClass !== "managed-snapshot"
  ) {
    return false;
  }
  return (
    entry.sourceId === `file:${relativePath}` &&
    entry.systemAsset?.logicalAssetId === relativePath &&
    entry.systemAsset.hashAlgorithm === "sha256" &&
    entry.systemAsset.expectedHashes.includes(entry.hash)
  );
}

function getActionOrder(action: PlannedAction): number {
  return action.type === "remove-managed" ? 0 : 1;
}

function getAncestorActionOrder(action: PlannedAction): number {
  return action.skillExposure && action.type !== "remove-managed" ? 2 : 1;
}

function getDescendantActionOrder(action: PlannedAction): number {
  return action.type === "remove-managed" ? 0 : 1;
}

function isDescendantPath(candidate: string, possibleAncestor: string): boolean {
  const normalizedCandidate = normalizePlanPath(candidate);
  const normalizedAncestor = normalizePlanPath(possibleAncestor);
  return normalizedCandidate.startsWith(`${normalizedAncestor}/`);
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
    relativePath.startsWith(".make-docs/agentics/skills/") ||
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

function getManifestHashForAsset(asset: ResolvedInstallAsset): string {
  if (isSkillExposureAsset(asset)) {
    return getSkillExposureHash(asset);
  }

  const manifestHash = getManifestFileHash(asset.relativePath, asset.content);
  if (manifestHash === null) {
    throw new Error(`Instruction asset ${asset.relativePath} is missing a valid managed block.`);
  }

  return manifestHash;
}

function getSkillExposureHash(asset: ResolvedSkillExposureAsset): string {
  return hashText(
    JSON.stringify({
      canonicalPayloadPath: normalizePlanPath(asset.skillExposure.canonicalPayloadPath),
      copyMirrorHashes: asset.copyMirrorAssets.map((copyAsset) => [
        normalizePlanPath(path.relative(asset.relativePath, copyAsset.relativePath)),
        hashText(copyAsset.content),
      ]),
      exposurePath: normalizePlanPath(asset.skillExposure.exposurePath),
      harness: asset.skillExposure.harness,
      installName: asset.skillExposure.installName,
      preferredMode: asset.skillExposure.preferredMode,
      skillName: asset.skillExposure.skillName,
      symlinkTarget: normalizePlanPath(asset.skillExposure.symlinkTarget),
    }),
  );
}

function isSkillExposureAsset(
  asset: ResolvedInstallAsset,
): asset is ResolvedSkillExposureAsset {
  return asset.kind === "skill-exposure";
}

function normalizePlanPath(relativePath: string): string {
  return relativePath.replace(/\\/g, "/");
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

function hasVerifiedResourceOwnership(
  manifest: InstallManifest | null,
  relativePath: string,
  sourceId: string,
): boolean {
  if (!manifest?.resourceProjection || !sourceId.startsWith("resource:")) {
    return false;
  }
  const uri = sourceId.slice("resource:".length);
  const entry = manifest.resourceProjection.resources[uri];
  const manifestFile = manifest.files[relativePath];
  return Boolean(
    entry &&
      entry.uri === uri &&
      entry.managedDestination === relativePath &&
      entry.ownershipClass === "managed-snapshot" &&
      entry.provenanceState === "verified" &&
      entry.lifecycleDisposition === "active" &&
      entry.competingClaims.length === 0 &&
      entry.sourceDigest === entry.installedDigest &&
      manifestFile?.ownershipClass === "managed-projection" &&
      manifestFile.sourceId === sourceId &&
      manifestFile.hash === entry.installedDigest,
  );
}

function getCarriedOnDemandRouterAssets(options: {
  targetDir: string;
  profile: InstallProfile;
  existingManifest: InstallManifest | null;
}): ResolvedAsset[] {
  if (!options.existingManifest?.routerOwnership) {
    return [];
  }
  const surfaceDirectories = {
    archive: ".make-docs/archive",
    artifacts: "docs/artifacts",
  } as const;
  const assets: ResolvedAsset[] = [];
  for (const [surface, directory] of Object.entries(surfaceDirectories)) {
    if (!existsSync(path.join(options.targetDir, directory))) {
      continue;
    }
    for (const asset of createProjectSurfaceRouterAssets(
      options.profile,
      surface as keyof typeof surfaceDirectories,
    )) {
      const proof = options.existingManifest.routerOwnership.routers[asset.relativePath];
      const file = options.existingManifest.files[asset.relativePath];
      if (
        proof?.routerClass === "on-demand-surface" &&
        proof.provenanceState === "verified" &&
        proof.ownershipClass === "managed-snapshot" &&
        proof.lifecycleDisposition === "active" &&
        proof.sourceId === asset.sourceId &&
        file?.sourceId === asset.sourceId &&
        file.ownershipClass === "managed-block"
      ) {
        assets.push(asset);
      }
    }
  }
  return assets.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}
