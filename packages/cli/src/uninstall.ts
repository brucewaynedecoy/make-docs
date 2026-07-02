import os from "node:os";
import path from "node:path";
import { stdout as output } from "node:process";
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
import { loadManifest } from "./manifest";
import {
  pruneProjectFromStore,
  resolveProjectIdentity,
  type ProjectIdentityResolution,
  type PruneProjectFromStoreResult,
} from "./store";
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
  /** Explicit global-store root override, used by tests and sandboxes. */
  storeRoot?: string;
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
      /**
       * Global-store disposition for this project (PRD 38 R-LIFE-1/R-LIFE-2):
       * the project's store rows are pruned and the store's state is always
       * reported, never silently orphaned.
       */
      storeHandling: PruneProjectFromStoreResult;
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

  // Capture the project's identity before any file is removed: the manifest
  // that carries the manifest-minted identifier (R-ID-1) is itself a managed
  // file the removal loop deletes, and store pruning must key by that
  // identifier, never by the directory path (R-ID-2).
  const projectIdentity = resolveProjectIdentity(plan.targetDir);

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

  // Global-store handling (PRD 38 R-LIFE-1/R-LIFE-2). This repo-level
  // uninstall removes managed files from ONE repository, while the
  // machine-level store serves ALL projects: prune exactly this project's
  // rows and always report the store's disposition — the store is never
  // silently orphaned, and store handling never deletes repository content.
  // Machine-level store removal is `removeGlobalStore` in ./store, the seam
  // the tool-level `uninstall` self-management command (W18 R11) surfaces.
  const storeHandling = handleGlobalStoreAfterUninstall({
    targetDir: plan.targetDir,
    projectIdentity,
    storeRoot: options.storeRoot,
    homeDir,
  });

  return {
    status: "completed",
    plan,
    backupResult,
    removedFiles,
    prunedDirectories,
    storeHandling,
  };
}

function handleGlobalStoreAfterUninstall(options: {
  targetDir: string;
  projectIdentity: ProjectIdentityResolution;
  storeRoot: string | undefined;
  homeDir: string;
}): PruneProjectFromStoreResult {
  const { targetDir, projectIdentity, storeRoot, homeDir } = options;
  const result = pruneProjectFromStore({
    repoRoot: targetDir,
    ...(projectIdentity.status === "resolved"
      ? { projectId: projectIdentity.projectId }
      : {}),
    ...(storeRoot ? { storeRoot } : {}),
    homeDir,
  });

  for (const line of describeStoreHandling(result)) {
    output.write(`${line}\n`);
  }

  return result;
}

function describeStoreHandling(result: PruneProjectFromStoreResult): string[] {
  switch (result.status) {
    case "pruned": {
      const lines = [
        `Global store: pruned this project's operational state (project ${result.projectId}) ` +
          `from ${result.storeRoot}.`,
      ];
      if (result.remainingProjects > 0) {
        lines.push(
          `The machine-level store was kept: it still holds state for ${result.remainingProjects} ` +
            `other registered project${result.remainingProjects === 1 ? "" : "s"}.`,
        );
      } else {
        lines.push(
          "No registered projects remain in the machine-level store. It is only removed with the " +
            `make-docs CLI itself; until then it can be safely deleted at ${result.storeRoot} ` +
            "(it holds only operational state, never repository content).",
        );
      }
      return lines;
    }
    case "no-store":
      return [
        `Global store: no store database exists at ${result.storeRoot}; there was nothing to prune.`,
      ];
    case "no-identity":
      return [
        `Global store: no project identifier could be resolved for this install (${result.identityStatus}), ` +
          `so no project-scoped state was ever recorded; the store at ${result.storeRoot} was not modified.`,
      ];
    case "store-unavailable":
      return [
        `Warning: could not prune this project's rows from the global store at ${result.storeRoot} ` +
          `(${result.reason}). The store holds only recoverable operational state; ` +
          "repository content is unaffected.",
      ];
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
