import os from "node:os";
import path from "node:path";
import {
  executePreparedBackup,
  prepareBackupExecution,
  resolveBackupDestinationPlan,
} from "./backup";
import { createAuditReport } from "./audit";
import {
  getLifecycleRenderer,
} from "./lifecycle-ui";
import { loadManifest } from "./manifest";
import type {
  AuditReport,
  BackupDestinationPlan,
  BackupExecutionResult,
  LifecyclePermissionsMode,
} from "./types";
import * as fileUtils from "./utils";

export interface UninstallCommandOptions {
  targetDir: string;
  backup: boolean;
  permissions: LifecyclePermissionsMode;
  auditReport?: AuditReport;
  homeDir?: string;
  now?: Date;
}

export interface UninstallReviewPlan {
  targetDir: string;
  backupRequested: boolean;
  backupDestinationPlan: BackupDestinationPlan | null;
  backupDestinationDir: string | null;
  auditReport: AuditReport;
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

  renderer.beginWorkflow("make-docs uninstall");
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
      if (fileUtils.removeFileIfPresent(removableFile.absolutePath)) {
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

  return {
    status: "completed",
    plan,
    backupResult,
    removedFiles,
    prunedDirectories,
  };
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
  const backupRoot = path.resolve(targetDir, ".backup");
  const normalizedCandidate = path.resolve(candidatePath);
  const relativePath = path.relative(backupRoot, normalizedCandidate);

  if (relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))) {
    throw new Error(`Refusing to remove a path inside the project backup root: ${candidatePath}`);
  }
}

function createUninstallError(message: string): Error {
  return new Error(message);
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
