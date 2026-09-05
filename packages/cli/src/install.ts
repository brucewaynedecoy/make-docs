import { existsSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import path from "node:path";
import {
  CONFLICTS_RELATIVE_DIR,
  createManifest,
  MANIFEST_RELATIVE_PATH,
  mintProjectId,
  RETIRED_PLAYBOOK_CONTRACT_PATH,
  writeManifest,
} from "./manifest";
import {
  classifyReviewableManagedFileConflictPath,
  createInstallPlan,
  createSkillsOnlyInstallPlan,
} from "./planner";
import { resolveInstallProfile } from "./profile";
import { isRetiredTemplateOwnedChildRouterPath } from "./router-paths";
import type { SkillRegistry } from "./skill-registry";
import type {
  ApplyResult,
  InstallManifest,
  InstallPlan,
  InstallSelections,
  ManagedFileConflictGroup,
  ManagedFileConflictResolutions,
  PackageMeta,
  PlannedAction,
  ReviewableManagedFileConflict,
  SystemAssetMaterializationMode,
} from "./types";
import {
  assertManagedPathHasNoSymlinks,
  ensureParentDir,
  pruneEmptyDirectories,
  readPackageMeta,
  relativePathToTarget,
  writeTextFile,
} from "./utils";
import {
  assertLifecyclePlanSnapshotCurrent,
  createLifecycleMutationReceipt,
} from "./lifecycle-plan";

export async function planInstall(options: {
  targetDir: string;
  selections: InstallSelections;
  existingManifest: InstallManifest | null;
  packageMeta?: PackageMeta;
  managedFileConflictResolutions?: ManagedFileConflictResolutions;
  systemAssetMaterializationMode?: SystemAssetMaterializationMode;
  skillRegistry?: SkillRegistry;
  operation?: "setup" | "setup.reconfigure" | "setup.sync";
}): Promise<InstallPlan> {
  const packageMeta = options.packageMeta ?? readPackageMeta();
  const profile = resolveInstallProfile(options.selections);

  return createInstallPlan({
    targetDir: options.targetDir,
    packageMeta,
    profile,
    existingManifest: options.existingManifest,
    managedFileConflictResolutions: options.managedFileConflictResolutions,
    systemAssetMaterializationMode: options.systemAssetMaterializationMode,
    skillRegistry: options.skillRegistry,
    operation: options.operation,
  });
}

export async function planSkillsOnlyInstall(options: {
  targetDir: string;
  selections: InstallSelections;
  existingManifest: InstallManifest | null;
  remove: boolean;
  packageMeta?: PackageMeta;
  skillRegistry?: SkillRegistry;
}): Promise<InstallPlan> {
  const packageMeta = options.packageMeta ?? readPackageMeta();
  const profile = resolveInstallProfile(options.selections);

  return createSkillsOnlyInstallPlan({
    targetDir: options.targetDir,
    packageMeta,
    profile,
    existingManifest: options.existingManifest,
    remove: options.remove,
    skillRegistry: options.skillRegistry,
  });
}

export function findReviewableManagedFileConflicts(
  plan: InstallPlan,
): ReviewableManagedFileConflict[] {
  return plan.actions
    .flatMap((action) => {
      if (
        action.type !== "skip-conflict" ||
        typeof action.content !== "string" ||
        !action.reason
      ) {
        return [];
      }

      const classification = classifyReviewableManagedFileConflictPath(action.relativePath);
      if (!classification || !action.sourceId) {
        return [];
      }

      return [
        {
          relativePath: action.relativePath,
          group: classification.group,
          sourceId: action.sourceId,
          reason: action.reason,
          ...(classification.instructionKind
            ? { instructionKind: classification.instructionKind }
            : {}),
          ...(classification.scope ? { scope: classification.scope } : {}),
        },
      ];
    })
    .sort(compareReviewableManagedFileConflicts);
}

export function applyInstallPlan(options: {
  targetDir: string;
  plan: InstallPlan;
  existingManifest: InstallManifest | null;
}): ApplyResult {
  if ((options.plan.stops?.length ?? 0) > 0) {
    throw new Error(
      `Cannot apply install plan because ownership or managed-block evidence is not trusted: ${options.plan.stops!.join(", ")}.`,
    );
  }
  const unresolvedConflicts = findReviewableManagedFileConflicts(options.plan);
  if (unresolvedConflicts.length > 0) {
    const paths = unresolvedConflicts.map((conflict) => conflict.relativePath).join(", ");
    throw new Error(`Cannot apply install plan with unresolved managed-file conflicts: ${paths}.`);
  }

  return applyInstallPlanInternal({
    ...options,
    trackSkillFilesInManifestFiles: true,
  });
}

export function applySkillsOnlyInstallPlan(options: {
  targetDir: string;
  plan: InstallPlan;
  existingManifest: InstallManifest | null;
}): ApplyResult {
  return applyInstallPlanInternal({
    ...options,
    trackSkillFilesInManifestFiles: false,
  });
}

function applyInstallPlanInternal(options: {
  targetDir: string;
  plan: InstallPlan;
  existingManifest: InstallManifest | null;
  trackSkillFilesInManifestFiles: boolean;
}): ApplyResult {
  const { targetDir, plan, existingManifest } = options;
  if (plan.actions.some((action) => action.type === "remove-managed" &&
      action.relativePath === RETIRED_PLAYBOOK_CONTRACT_PATH)) {
    throw new Error("Retired Playbook contract removal requires reviewed migration checkpoint 11.");
  }
  const p4ProjectionSelected = plan.profile.selections.resourceProjection !== undefined;
  if (p4ProjectionSelected) {
    assertManagedPathHasNoSymlinks(targetDir, MANIFEST_RELATIVE_PATH);
    for (const action of plan.actions) {
      if (isP4ProjectionAction(action)) {
        assertManagedPathHasNoSymlinks(targetDir, action.relativePath);
      }
    }
  }
  if (plan.classificationSnapshot) {
    assertLifecyclePlanSnapshotCurrent(targetDir, plan.classificationSnapshot);
  }
  if (
    !plan.forceManifestWrite &&
    existingManifest &&
    existingManifest.projectId &&
    plan.actions.every((action) => action.type === "noop") &&
    existingManifest.schemaVersion === 4 &&
    JSON.stringify(existingManifest.selections) === JSON.stringify(plan.profile.selections) &&
    JSON.stringify(existingManifest.routerOwnership ?? null) ===
      JSON.stringify(plan.routerOwnership ?? null) &&
    JSON.stringify(existingManifest.resourceProjection ?? null) ===
      JSON.stringify(plan.resourceProjection ?? null)
  ) {
    return {
      manifest: existingManifest,
      appliedActions: plan.actions,
      conflictFiles: [],
      mutationApplied: false,
    };
  }
  const nextFiles: Record<string, import("./types").ManifestFileEntry> = {
    ...(existingManifest?.files ?? {}),
  };
  const nextSkillFiles = new Set(existingManifest?.skillFiles ?? []);
  const desiredSkillFiles = new Set(plan.desiredSkillFiles);
  const conflictFiles: string[] = [];

  mkdirSync(targetDir, { recursive: true });

  for (const action of plan.actions) {
    applyAction({
      targetDir,
      plan,
      action,
      nextFiles,
      conflictFiles,
    });

    if (
      desiredSkillFiles.has(action.relativePath) &&
      (action.type === "create" ||
        action.type === "update" ||
        action.type === "generate" ||
        action.type === "noop")
    ) {
      nextSkillFiles.add(action.relativePath);
    }

    if (action.type === "remove-managed") {
      nextSkillFiles.delete(action.relativePath);
    }
  }

  // Stable project identity (W18 R10; PRD 38 R-ID-1): mint the identifier
  // exactly once — on the first apply that writes a manifest — and preserve
  // it verbatim on every later sync, reconfigure, or skills-only apply.
  // Pre-identifier manifests (no `projectId`) are migrated here explicitly:
  // the apply already rewrites the manifest, so the minted identifier rides
  // the same write. An existing identifier is NEVER re-minted or changed.
  const projectId = existingManifest?.projectId ?? mintProjectId();
  const routerOwnership = plan.routerOwnership ?? existingManifest?.routerOwnership;
  const resourceProjection = plan.resourceProjection ?? existingManifest?.resourceProjection;
  if (!routerOwnership || !resourceProjection) {
    throw new Error(
      "Schema 4 install apply requires router ownership and resource projection proof.",
    );
  }

  const manifest = createManifest(
    {
      name: plan.packageName,
      version: plan.packageVersion,
    },
    plan.profile,
    nextFiles,
    Array.from(nextSkillFiles).sort(),
    options.trackSkillFilesInManifestFiles
      ? plan.systemAssetMaterialization
      : (existingManifest?.systemAssetMaterialization ?? plan.systemAssetMaterialization),
    projectId,
    routerOwnership,
    resourceProjection,
  );
  const receipt = createLifecycleMutationReceipt({
    operation: plan.operation ?? "setup",
    projectId,
    manifestSchemaVersion: manifest.schemaVersion,
    profileId: manifest.profileId,
    selectedResourceTypes: manifest.selections.resourceProjection ?? [],
    actions: plan.actions,
    committedAt: manifest.updatedAt,
  });
  if (p4ProjectionSelected) {
    assertManagedPathHasNoSymlinks(targetDir, MANIFEST_RELATIVE_PATH);
  }
  writeManifest(targetDir, manifest);

  return {
    manifest,
    appliedActions: plan.actions,
    conflictFiles,
    receipt,
    mutationApplied: true,
  };
}

function applyAction(options: {
  targetDir: string;
  plan: InstallPlan;
  action: PlannedAction;
  nextFiles: Record<string, import("./types").ManifestFileEntry>;
  conflictFiles: string[];
}): void {
  const { targetDir, plan, action, nextFiles, conflictFiles } = options;
  const absolutePath = relativePathToTarget(targetDir, action.relativePath);
  const desiredEntry = plan.desiredFiles[action.relativePath];
  if (
    (
      plan.profile.selections.resourceProjection !== undefined &&
      isP4ProjectionAction(action)
    ) ||
    (
      action.type === "remove-managed" &&
      isRetiredTemplateOwnedChildRouterPath(action.relativePath)
    ) ||
    action.type === "strip-managed-block"
  ) {
    assertManagedPathHasNoSymlinks(targetDir, action.relativePath);
  }

  switch (action.type) {
    case "create":
    case "update":
    case "generate": {
      if (action.skillExposure) {
        if (!desiredEntry) {
          throw new Error(`Missing desired manifest entry for ${action.relativePath}.`);
        }

        nextFiles[action.relativePath] = applySkillExposureAction({
          targetDir,
          action,
          desiredEntry,
        });
        return;
      }

      if (typeof action.content !== "string" || !desiredEntry) {
        throw new Error(`Missing content for ${action.type} action on ${action.relativePath}.`);
      }

      writeTextFile(absolutePath, action.content);
      nextFiles[action.relativePath] = desiredEntry;
      return;
    }
    case "update-conflict": {
      if (typeof action.content !== "string") {
        throw new Error(`Missing content for ${action.type} action on ${action.relativePath}.`);
      }

      writeTextFile(absolutePath, action.content);
      delete nextFiles[action.relativePath];
      return;
    }
    case "noop": {
      if (desiredEntry) {
        nextFiles[action.relativePath] = action.skillExposure
          ? {
              ...desiredEntry,
              skillExposure: action.skillExposure,
            }
          : desiredEntry;
      }
      return;
    }
    case "skip": {
      return;
    }
    case "strip-managed-block": {
      if (typeof action.content !== "string") {
        throw new Error(`Missing preserved content for ${action.type} action on ${action.relativePath}.`);
      }
      writeTextFile(absolutePath, action.content);
      delete nextFiles[action.relativePath];
      return;
    }
    case "remove-managed": {
      if (existsSync(absolutePath)) {
        rmSync(absolutePath, { force: true, recursive: true });
        pruneRemovedManagedPathParents(targetDir, action.relativePath, absolutePath);
      }
      delete nextFiles[action.relativePath];
      return;
    }
    case "skip-conflict": {
      if (typeof action.content === "string" && plan.conflictsRunId) {
        const conflictPath = path.join(
          targetDir,
          CONFLICTS_RELATIVE_DIR,
          plan.conflictsRunId,
          toConflictRelativePath(action.relativePath),
        );
        ensureParentDir(conflictPath);
        writeTextFile(conflictPath, action.content);
        conflictFiles.push(conflictPath);
      }
      return;
    }
    default: {
      const exhaustiveCheck: never = action.type;
      throw new Error(`Unhandled action type: ${exhaustiveCheck}`);
    }
  }
}

function isP4ProjectionAction(action: PlannedAction): boolean {
  return action.sourceId?.startsWith("router:") === true ||
    action.sourceId?.startsWith("resource:") === true;
}

function applySkillExposureAction(options: {
  targetDir: string;
  action: PlannedAction;
  desiredEntry: NonNullable<InstallPlan["desiredFiles"][string]>;
}): NonNullable<InstallPlan["desiredFiles"][string]> {
  const { targetDir, action, desiredEntry } = options;
  if (!action.skillExposure || !action.copyMirrorAssets) {
    throw new Error(`Missing skill exposure metadata for ${action.relativePath}.`);
  }

  const absolutePath = relativePathToTarget(targetDir, action.relativePath);
  if (existsSync(absolutePath)) {
    rmSync(absolutePath, { recursive: true, force: true });
  }
  ensureParentDir(absolutePath);

  if (process.env.MAKE_DOCS_DISABLE_SKILL_SYMLINKS !== "1") {
    try {
      symlinkSync(action.skillExposure.symlinkTarget, absolutePath, "dir");
      return {
        ...desiredEntry,
        skillExposure: {
          ...action.skillExposure,
          mode: "symlink",
        },
      };
    } catch (error) {
      writeCopyMirror(action.copyMirrorAssets, targetDir);
      return {
        ...desiredEntry,
        skillExposure: {
          ...action.skillExposure,
          mode: "copy-mirror",
          fallbackReason: toErrorMessage(error),
        },
      };
    }
  }

  writeCopyMirror(action.copyMirrorAssets, targetDir);
  return {
    ...desiredEntry,
    skillExposure: {
      ...action.skillExposure,
      mode: "copy-mirror",
      fallbackReason: "Symlink creation disabled by MAKE_DOCS_DISABLE_SKILL_SYMLINKS=1.",
    },
  };
}

function writeCopyMirror(assets: PlannedAction["copyMirrorAssets"], targetDir: string): void {
  if (!assets) {
    return;
  }

  for (const asset of assets) {
    writeTextFile(relativePathToTarget(targetDir, asset.relativePath), asset.content);
  }
}

function pruneRemovedManagedPathParents(
  targetDir: string,
  relativePath: string,
  absolutePath: string,
): void {
  const boundary = getRemoveManagedPruneBoundary(targetDir, relativePath, absolutePath);
  if (!boundary) {
    return;
  }

  pruneEmptyDirectories(path.dirname(absolutePath), boundary);
}

function getRemoveManagedPruneBoundary(
  targetDir: string,
  relativePath: string,
  absolutePath: string,
): string | null {
  if (!path.isAbsolute(relativePath)) {
    return targetDir;
  }

  return getGlobalSelectedAgenticsPruneBoundary(absolutePath);
}

function getGlobalSelectedAgenticsPruneBoundary(absolutePath: string): string | null {
  const segments = path.resolve(absolutePath).split(path.sep);
  const agenticsIndex = segments.lastIndexOf("agentics");
  if (agenticsIndex < 1 || segments[agenticsIndex - 1] !== ".make-docs") {
    return null;
  }

  return segments.slice(0, agenticsIndex).join(path.sep) || path.sep;
}

function compareReviewableManagedFileConflicts(
  left: ReviewableManagedFileConflict,
  right: ReviewableManagedFileConflict,
): number {
  const leftGroup = MANAGED_FILE_CONFLICT_GROUP_ORDER[left.group];
  const rightGroup = MANAGED_FILE_CONFLICT_GROUP_ORDER[right.group];

  return leftGroup - rightGroup || left.relativePath.localeCompare(right.relativePath);
}

const MANAGED_FILE_CONFLICT_GROUP_ORDER: Record<ManagedFileConflictGroup, number> = {
  "agent-instructions": 0,
  references: 1,
  templates: 2,
  prompts: 3,
  skills: 4,
  "managed-files": 5,
};

function toConflictRelativePath(relativePath: string): string {
  const segments = relativePath.split(/[/\\]+/).filter(Boolean);
  const safeSegments = segments.filter((segment) => segment !== "." && segment !== "..");

  if (path.isAbsolute(relativePath)) {
    const [first, ...rest] = safeSegments;
    const drive = first?.replace(/:$/, "");
    return path.join("__absolute__", ...(drive ? [drive, ...rest] : rest));
  }

  return path.join(...safeSegments);
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
