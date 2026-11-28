import { removeInstallationPath } from "./installation-files";
import os from "node:os";
import path from "node:path";
import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import {
  executePreparedBackup,
  prepareBackupExecution,
  resolveBackupDestinationPlan,
} from "./backup";
import { getProjectBackupStateRoots, isWithinRoot } from "./backup-paths";
import { createAuditReport } from "./audit";
import {
  getLifecycleRenderer,
} from "./lifecycle-ui";
import { getManifestFileHash, loadManifest } from "./manifest";
import { resolveProjectIdentity } from "./store";
import { getExistingInstallationCheckoutId, recordPlannedFileChange, removeInstallationManifest, withInstallationOperation } from "./store/installation-state";
import { resolveStoreRoot } from "./store/paths";
import { removeGitHookRunState } from "./store/git-hook-runs";
import { applyGitHookRemoval, planGitHookRemoval, type GitHookRemovalPlan, type GitHookRemovalResult } from "./git-hooks";
import type {
  AuditReport,
  BackupDestinationPlan,
  BackupExecutionResult,
  LifecyclePermissionsMode,
  LifecycleMutationReceipt,
  PlannedAction,
} from "./types";
import * as fileUtils from "./utils";
import { createLifecycleMutationReceipt } from "./lifecycle-plan";

export interface UninstallCommandOptions {
  targetDir: string;
  backup: boolean;
  permissions: LifecyclePermissionsMode;
  auditReport?: AuditReport;
  homeDir?: string;
  now?: Date;
  /** Explicit global Store root override. */
  storeRoot?: string;
}

export interface UninstallReviewPlan {
  targetDir: string;
  backupRequested: boolean;
  backupDestinationPlan: BackupDestinationPlan | null;
  backupDestinationDir: string | null;
  auditReport: AuditReport;
  classificationSnapshotId: string;
}

export type UninstallExecutionResult =
  | {
      status: "cancelled";
      checkpoint: "warning" | "final";
      plan: UninstallReviewPlan | null;
    }
  | {
      status: "completed";
      plan: UninstallReviewPlan;
      backupResult: BackupExecutionResult | null;
      removedFiles: string[];
      prunedDirectories: string[];
      /** Project removal preserves machine-level Store rows in W19 R1 P4. */
      storeHandling: { status: "preserved"; reason: string };
      receipt?: LifecycleMutationReceipt;
      /** W35 R0 P5: what removal did with the git hooks of this checkout. */
      gitHooks?: GitHookRemovalResult;
    };

export async function runUninstallCommand(
  options: UninstallCommandOptions,
): Promise<UninstallExecutionResult> {
  const renderer = getLifecycleRenderer();
  const targetDir = path.resolve(options.targetDir);
  const homeDir = path.resolve(options.homeDir ?? os.homedir());
  const backupDestinationPlan = options.backup
    ? resolveBackupDestinationPlan(targetDir, options.now ?? new Date())
    : null;
  const backupDestinationDir = backupDestinationPlan?.destinationDir ?? null;

  renderer.beginWorkflow("make-docs setup remove");
  renderer.renderUninstallWarning({
    targetDir,
    backupDestinationDir,
  });

  const warningApproved = await renderer.confirmUninstallWarning(
    options.permissions,
  );
  if (!warningApproved) {
    renderer.renderUninstallCancelled();
    return {
      status: "cancelled",
      checkpoint: "warning",
      plan: null,
    };
  }

  const auditReport =
    options.auditReport ??
    (await loadAuditReport({
      targetDir,
      homeDir,
    }));

  const plan: UninstallReviewPlan = {
    targetDir,
    backupRequested: options.backup,
    backupDestinationPlan,
    backupDestinationDir,
    auditReport,
    classificationSnapshotId: fileUtils.hashText(JSON.stringify(auditReport)),
  };

  renderer.renderUninstallAuditSummary({
    auditReport,
    backupDestinationDir,
  });

  // W35 R0 P5 (PRD 07 R-SETUP-CLI-24): the git hooks are outside the project folder, so the audit
  // does not hold them. The review names what removal does with each hook file, before the person approves.
  const hookStoreRoot = options.storeRoot ?? resolveStoreRoot();
  let hookCheckoutId: string | null = null;
  let hookRemovalPlan: GitHookRemovalPlan | null = null;
  try {
    hookCheckoutId = getExistingInstallationCheckoutId(targetDir, hookStoreRoot);
    hookRemovalPlan = planGitHookRemoval(targetDir, hookStoreRoot, hookCheckoutId);
  } catch {
    // No usable Store or no bound checkout: this checkout has no git hook record to remove.
  }
  if (hookRemovalPlan && hookRemovalPlan.lines.length > 0) process.stdout.write(`${hookRemovalPlan.lines.join("\n")}\n`);

  const finalApproved = await renderer.confirmUninstallRun({
    permissions: options.permissions,
    backupRequested: options.backup,
  });
  if (!finalApproved) {
    renderer.renderUninstallCancelled();
    return {
      status: "cancelled",
      checkpoint: "final",
      plan,
    };
  }

  // Capture the project identity before removal. The returned receipt uses
  // this identity after the removal loop deletes the manifest.
  const projectIdentity = resolveProjectIdentity(plan.targetDir);
  const manifest = loadManifest(plan.targetDir);

  const preparedBackup = plan.backupRequested ? await prepareBackupExecution({
    targetDir, homeDir, now: options.now, auditReport: plan.auditReport,
    destinationPlan: plan.backupDestinationPlan,
  }) : null;

  const removal = withInstallationOperation(targetDir, "setup.remove", (): UninstallExecutionResult => {
    removeInstallationManifest(targetDir);
    let backupResult: BackupExecutionResult | null = null;
    if (preparedBackup) {
      try { backupResult = executePreparedBackup(preparedBackup); }
      catch (error) { throw new Error(`Backup failed before uninstall removal began: ${error instanceof Error ? error.message : String(error)}`, { cause: error }); }
    }

    const removedFiles: string[] = [];
    const prunedDirectories: string[] = [];

    try {
      for (const removableFile of plan.auditReport.removableFiles) {
        assertNotInsideBackupRoot(plan.targetDir, removableFile.absolutePath);
        assertRemovalEvidenceCurrent(removableFile);
        const removed = removeInstallationPath(targetDir, removableFile.path);
        if (removed) {
          removedFiles.push(removableFile.path);
        }
      }

      for (const prunableDirectory of plan.auditReport.prunableDirectories) {
        if (path.resolve(prunableDirectory.absolutePath) === path.resolve(homeDir, ".make-docs")) continue;
        assertNotInsideBackupRoot(plan.targetDir, prunableDirectory.absolutePath);
        if (existsSync(prunableDirectory.absolutePath) && readdirSync(prunableDirectory.absolutePath).length === 0) {
          recordPlannedFileChange(targetDir, prunableDirectory.path, { kind: "missing" }, () => {
            if (fileUtils.pruneDirectoryIfEmpty(prunableDirectory.absolutePath)) prunedDirectories.push(prunableDirectory.path);
          });
        }
      }
    } catch (error) {
      renderer.renderUninstallFailureSummary({
        auditReport: plan.auditReport,
        removedFiles,
        prunedDirectories,
        backupResult,
        errorMessage: toErrorMessage(error),
      });
      throw createUninstallError(
        `Uninstall partially completed after removing ${removedFiles.length} file(s) and pruning ${prunedDirectories.length} director${prunedDirectories.length === 1 ? "y" : "ies"}: ${toErrorMessage(error)}`,
      );
    }

    renderer.renderUninstallCompletionSummary({
      auditReport: plan.auditReport,
      removedFiles,
      prunedDirectories,
      backupResult,
    });

    // Project removal preserves machine-level Store rows. Machine-level Store
    // removal remains a separate product operation.
    const storeHandling = {
      status: "preserved" as const,
      reason: "Installation state records removal. Other projects and general lifecycle evidence remain in the Store.",
    };
    const receiptActions: PlannedAction[] = [
      ...removedFiles.map((relativePath) => ({ type: "remove-managed" as const, disposition: "remove" as const, relativePath })),
      ...plan.auditReport.preservedPaths.map((entry) => ({ type: "noop" as const, disposition: "preserve" as const, relativePath: entry.path })),
    ];
    const didMutate = removedFiles.length > 0
      || prunedDirectories.length > 0
      || Boolean(backupResult?.destinationDir);
    const receipt = didMutate
      ? createLifecycleMutationReceipt({
          operation: "setup.remove",
          projectId: projectIdentity.status === "resolved" ? projectIdentity.projectId : "unresolved",
          manifestSchemaVersion: manifest?.schemaVersion ?? 3,
          profileId: manifest?.profileId ?? "unresolved",
          selectedResourceTypes: manifest?.selections.resourceProjection ?? [],
          actions: receiptActions,
          backupReferences: backupResult?.destinationDir ? [backupResult.destinationDir] : [],
        })
      : undefined;

    return {
      status: "completed",
      plan,
      backupResult,
      removedFiles,
      prunedDirectories,
      storeHandling,
      ...(receipt ? { receipt } : {}),
    };
  }, { storeRoot: options.storeRoot, projectId: manifest?.projectId });

  // The hooks go after the project files, and a hook problem never fails the removal of the project.
  // A bound checkout of a clone with hooks has a folder of run files also when it is not in the hook record. The
  // folder goes with the project, in each case.
  if (removal.status === "completed") {
    try { removeGitHookRunState(hookStoreRoot, targetDir); } catch { /* The run files are small, and Store removal takes them out. */ }
  }
  if (removal.status !== "completed" || !hookRemovalPlan || hookRemovalPlan.status === "none" || hookRemovalPlan.status === "unavailable") return removal;
  let gitHooks: GitHookRemovalResult;
  try {
    gitHooks = applyGitHookRemoval(targetDir, hookStoreRoot, hookCheckoutId, options.now);
  } catch (error) {
    gitHooks = { ...hookRemovalPlan, status: "unavailable", reason: toErrorMessage(error), hooks: [], recordRemoved: false, lines: [`Git hooks: Make Docs could not change the hook files, so it left them and their Store record as they are. ${toErrorMessage(error).split("\n")[0]}`] };
  }
  process.stdout.write(`${renderGitHookRemovalReport(gitHooks)}\n`);
  return { ...removal, gitHooks };
}

/** The lines that a person sees after removal handled the git hooks. */
export function renderGitHookRemovalReport(result: GitHookRemovalResult): string {
  if (result.status === "unavailable") return result.lines.join("\n");
  if (result.status === "shared") {
    const updated = result.hooks.filter((entry) => entry.action === "update-block");
    return [
      "Git hooks: the Make Docs blocks stay, because another bound checkout of this clone uses them:",
      ...result.remaining.map((root) => `- ${root}`),
      ...(updated.length === 0 ? [] : ["Make Docs wrote these blocks again, with no line for the project folder of this checkout, and kept every other byte:", ...updated.map((entry) => `- ${entry.path}`)]),
      "This checkout is no longer in their Store record.",
    ].join("\n");
  }
  if (result.status === "held") {
    return [
      "Git hooks: the Make Docs blocks stay, with no change, and their Store record stays. Git lists a work tree of this clone that can be a checkout of the record at a new folder:",
      ...result.heldFor.map((root) => `- ${root}`),
      "This checkout is no longer in their Store record.",
    ].join("\n");
  }
  const done: Record<string, string> = {
    "remove-block": "the Make Docs block was removed, and every other byte stays",
    "remove-file": "the file was removed, because Make Docs created it and it held nothing else",
    "keep-changed": "kept: the block was changed after Make Docs wrote it. It has no Store record now, and a later setup keeps it unless you give `--git-hooks`. To remove it, take out its two marker lines and the lines between them by hand",
    "keep-shared": "kept",
    "update-block": "kept",
    gone: "no Make Docs block was in the file",
  };
  return [
    "Git hooks: removed for this clone. The Store holds no git hook record for it now.",
    ...result.hooks.map((entry) => `- ${entry.path}: ${done[entry.action]}`),
  ].join("\n");
}

function assertRemovalEvidenceCurrent(entry: AuditReport["removableFiles"][number]): void {
  let stats;
  try {
    stats = lstatSync(entry.absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
  if (stats.isSymbolicLink()) return;
  if (entry.kind === "directory") {
    if (!stats.isDirectory()) throw new Error(`Removal entry changed type: ${entry.path}`);
    return;
  }
  if (!stats.isFile()) throw new Error(`Removal entry changed type: ${entry.path}`);
  if (entry.currentHash) {
    const content = readFileSync(entry.absolutePath, "utf8");
    const currentHash = getManifestFileHash(entry.path, content) ?? fileUtils.hashText(content);
    if (currentHash !== entry.currentHash) {
      throw new Error(`Removal evidence changed after review: ${entry.path}`);
    }
  }
}

async function loadAuditReport(options: {
  targetDir: string;
  homeDir: string;
}): Promise<AuditReport> {
  const manifest = loadManifest(options.targetDir);
  return createAuditReport({
    targetDir: options.targetDir,
    manifest,
    homeDir: options.homeDir,
  });
}

function assertNotInsideBackupRoot(targetDir: string, candidatePath: string): void {
  const normalizedCandidate = path.resolve(candidatePath);
  const backupRoot = getProjectBackupStateRoots(targetDir).find((root) =>
    isWithinRoot(root, normalizedCandidate),
  );

  if (backupRoot) {
    throw new Error(
      `Refusing to remove a path inside project backup payloads (${backupRoot}): ${candidatePath}`,
    );
  }
}

function createUninstallError(message: string): Error {
  return new Error(message);
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
