import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { CONFLICTS_RELATIVE_DIR, createManifest, writeManifest } from "./manifest";
import {
  classifyReviewableManagedFileConflictPath,
  createInstallPlan,
  createSkillsOnlyInstallPlan,
} from "./planner";
import { resolveInstallProfile } from "./profile";
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
  ensureParentDir,
  pruneEmptyDirectories,
  readPackageMeta,
  relativePathToTarget,
  writeTextFile,
} from "./utils";

export async function planInstall(options: {
  targetDir: string;
  selections: InstallSelections;
  existingManifest: InstallManifest | null;
  packageMeta?: PackageMeta;
  managedFileConflictResolutions?: ManagedFileConflictResolutions;
  systemAssetMaterializationMode?: SystemAssetMaterializationMode;
  skillRegistry?: SkillRegistry;
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
  const nextFiles = { ...(existingManifest?.files ?? {}) };
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
      if (!options.trackSkillFilesInManifestFiles) {
        delete nextFiles[action.relativePath];
      }
    }

    if (action.type === "remove-managed") {
      nextSkillFiles.delete(action.relativePath);
    }
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
  );
  writeManifest(targetDir, manifest);

  return {
    manifest,
    appliedActions: plan.actions,
    conflictFiles,
  };
}

function applyAction(options: {
  targetDir: string;
  plan: InstallPlan;
  action: PlannedAction;
  nextFiles: Record<string, { hash: string; sourceId: string }>;
  conflictFiles: string[];
}): void {
  const { targetDir, plan, action, nextFiles, conflictFiles } = options;
  const absolutePath = relativePathToTarget(targetDir, action.relativePath);
  const desiredEntry = plan.desiredFiles[action.relativePath];

  switch (action.type) {
    case "create":
    case "update":
    case "generate": {
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
        nextFiles[action.relativePath] = desiredEntry;
      }
      return;
    }
    case "skip": {
      return;
    }
    case "remove-managed": {
      if (existsSync(absolutePath)) {
        rmSync(absolutePath, { force: true });
        pruneEmptyDirectories(path.dirname(absolutePath), targetDir);
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
