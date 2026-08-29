import os from "node:os";
import path from "node:path";
import { lstatSync, readFileSync } from "node:fs";
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
  /** Retained for caller compatibility. Project removal does not use Store paths. */
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

  let backupResult: BackupExecutionResult | null = null;

  if (plan.backupRequested) {
    try {
      const preparedBackup = await prepareBackupExecution({
        targetDir,
        homeDir,
        now: options.now,
        auditReport: plan.auditReport,
        destinationPlan: plan.backupDestinationPlan,
      });
      backupResult = executePreparedBackup(preparedBackup);
    } catch (error) {
      throw createUninstallError(
        `Backup failed before uninstall removal began: ${toErrorMessage(error)}`,
      );
    }
  }

  const removedFiles: string[] = [];
  const prunedDirectories: string[] = [];

  try {
    for (const removableFile of plan.auditReport.removableFiles) {
      assertNotInsideBackupRoot(plan.targetDir, removableFile.absolutePath);
      assertRemovalEvidenceCurrent(removableFile);
      const removed =
        removableFile.kind === "directory"
          ? fileUtils.removeManagedPathIfPresent(removableFile.absolutePath)
          : fileUtils.removeFileIfPresent(removableFile.absolutePath);
      if (removed) {
        removedFiles.push(removableFile.path);
      }
    }

    for (const prunableDirectory of plan.auditReport.prunableDirectories) {
      assertNotInsideBackupRoot(plan.targetDir, prunableDirectory.absolutePath);
      if (fileUtils.pruneDirectoryIfEmpty(prunableDirectory.absolutePath)) {
        prunedDirectories.push(prunableDirectory.path);
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
    reason: "Project removal does not change machine-level Store rows in W19 R1 P4.",
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
      `Refusing to remove a path inside project backup state (${backupRoot}): ${candidatePath}`,
    );
  }
}

function createUninstallError(message: string): Error {
  return new Error(message);
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
