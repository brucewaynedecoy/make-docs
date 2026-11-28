import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { preparePlannedFileChange, sealInstallationOperation, withInstallationOperation } from "./store/installation-state";
import { createAuditReport } from "./audit";
import { getProjectBackupRoot, resolveBackupDestinationPlan } from "./backup-paths";
import { getLifecycleRenderer } from "./lifecycle-ui";
import { loadManifest } from "./manifest";
import type {
  AuditReport,
  AuditPrunableDirectory,
  AuditRemovableFile,
  BackupCommandOptions,
  BackupDestinationPlan,
  BackupExecutionResult,
} from "./types";
import { ensureParentDir } from "./utils";

// The plan of the backup folder lives with the backup paths, so that a module with no review UI can use it.
export { resolveBackupDestinationPlan };

type CopyableAuditRemovableFile = AuditRemovableFile & {
  backupRelativePath: string;
};

type MaterializableAuditDirectory = AuditPrunableDirectory & {
  backupRelativePath: string;
};

export type PrepareBackupExecutionOptions = {
  targetDir: string;
  homeDir?: string;
  now?: Date;
  auditReport?: AuditReport;
  destinationPlan?: BackupDestinationPlan | null;
};

export type PreparedBackupExecution = {
  targetDir: string;
  auditReport: AuditReport;
  destinationPlan: BackupDestinationPlan | null;
  copyableFiles: CopyableAuditRemovableFile[];
  materializableDirectories: MaterializableAuditDirectory[];
};

export function compareBackupRelativePathDepth(
  left: string,
  right: string,
): number {
  const depth = (value: string) => value.split(/[\\/]+/u).filter(Boolean).length;
  return depth(left) - depth(right);
}

export async function runBackupCommand(
  options: BackupCommandOptions,
): Promise<BackupExecutionResult> {
  const renderer = getLifecycleRenderer();
  renderer.beginWorkflow("make-docs setup backup");
  const preparedBackup = await prepareBackupExecution(options);

  renderer.renderBackupAuditSummary({
    auditReport: preparedBackup.auditReport,
    destinationDir: preparedBackup.destinationPlan?.destinationDir ?? null,
    copyableFiles: preparedBackup.copyableFiles,
    materializableDirectories: preparedBackup.materializableDirectories,
  });

  if (!hasBackupWork(preparedBackup)) {
    renderer.renderBackupNoopSummary();
    return createNoopBackupResult(preparedBackup);
  }

  const destinationPlan = preparedBackup.destinationPlan;
  if (!destinationPlan) {
    throw new Error(
      "Backup destination plan is required when audited entries are copyable.",
    );
  }

  const shouldProceed = await renderer.confirmBackupRun(options.permissions);
  if (!shouldProceed) {
    renderer.renderBackupCancelled();
    return {
      status: "cancelled",
      targetDir: preparedBackup.targetDir,
      destinationDir: destinationPlan.destinationDir,
      auditReport: preparedBackup.auditReport,
      copiedFiles: [],
      materializedDirectories: [],
    };
  }

  const result = executePreparedBackup(preparedBackup);
  renderer.renderBackupCompletionSummary(result);
  return result;
}

export async function prepareBackupExecution(
  options: PrepareBackupExecutionOptions,
): Promise<PreparedBackupExecution> {
  const targetDir = path.resolve(options.targetDir);
  const homeDir = path.resolve(options.homeDir ?? os.homedir());
  const auditReport =
    options.auditReport ??
    (await createAuditReport({
      targetDir,
      manifest: loadManifest(targetDir),
      homeDir,
    }));

  const copyableFiles = auditReport.removableFiles.filter(hasBackupRelativePath);
  const materializableDirectories = auditReport.prunableDirectories.filter(
    hasBackupRelativePath,
  );
  const materializableManagedDirectories = auditReport.removableFiles
    .filter((entry) => entry.kind === "directory")
    .filter(hasBackupRelativePath)
    .map((entry): MaterializableAuditDirectory => ({
      ...entry,
      kind: "directory",
      removableDescendantPaths: [],
      preservedDescendantPaths: [],
    }));
  const hasCopyableEntries =
    copyableFiles.length > 0 ||
    materializableDirectories.length > 0 ||
    materializableManagedDirectories.length > 0;
  const hasProvidedDestinationPlan = Object.hasOwn(options, "destinationPlan");
  const destinationPlan = hasCopyableEntries
    ? hasProvidedDestinationPlan
      ? options.destinationPlan ?? null
      : resolveBackupDestinationPlan(targetDir, options.now ?? new Date())
    : null;

  if (hasCopyableEntries && !destinationPlan) {
    throw new Error(
      "Backup destination plan is required when audited entries are copyable.",
    );
  }

  return {
    targetDir,
    auditReport,
    destinationPlan,
    copyableFiles: copyableFiles.filter((entry) => entry.kind === "file"),
    materializableDirectories: [
      ...materializableDirectories,
      ...materializableManagedDirectories,
    ],
  };
}

export function executePreparedBackup(
  preparedBackup: PreparedBackupExecution,
): BackupExecutionResult {
  if (!hasBackupWork(preparedBackup)) {
    return createNoopBackupResult(preparedBackup);
  }

  if (!preparedBackup.destinationPlan) {
    throw new Error(
      "Backup destination plan is required before copying audited backup entries.",
    );
  }

  return withInstallationOperation(preparedBackup.targetDir, "setup.backup", () => {
    const targetDir = preparedBackup.targetDir;
    const destination = preparedBackup.destinationPlan!.destinationDir;
    if (preparedBackup.destinationPlan!.promotion) throw new Error("Create a fresh backup plan. Existing backup paths must remain stable.");
    if (existsSync(destination)) throw new Error(`Backup destination already exists: ${destination}. Re-run the command to resolve a fresh destination.`);
    const changes: Array<() => void> = [preparePlannedFileChange(targetDir, path.relative(targetDir, destination), { kind: "directory" }, () => mkdirSync(destination, { recursive: true }))];
    const copiedFiles: string[] = [];
    const materializedDirectories: string[] = [];
    for (const directory of [...preparedBackup.materializableDirectories].sort((a, b) =>
      compareBackupRelativePathDepth(a.backupRelativePath, b.backupRelativePath))) {
      const relative = directory.backupRelativePath;
      if (!relative || relative === ".") continue;
      const absolute = path.join(destination, relative);
      changes.push(preparePlannedFileChange(targetDir, path.relative(targetDir, absolute), { kind: "directory" }, () => mkdirSync(absolute, { recursive: true })));
      materializedDirectories.push(relative);
    }
    for (const file of preparedBackup.copyableFiles) {
      const destinationPath = path.join(destination, file.backupRelativePath);
      const content = readFileSync(file.absolutePath);
      changes.push(preparePlannedFileChange(targetDir, path.relative(targetDir, destinationPath), { kind: "file", content }, () => {
        ensureParentDir(destinationPath);
        copyFileSync(file.absolutePath, destinationPath);
      }));
      copiedFiles.push(file.backupRelativePath);
    }
    sealInstallationOperation(targetDir);
    for (const change of changes) change();

    return {
      status: "completed",
      targetDir: preparedBackup.targetDir,
      destinationDir: preparedBackup.destinationPlan!.destinationDir,
      auditReport: preparedBackup.auditReport,
      copiedFiles,
      materializedDirectories,
    };
  });
}

function findLowestAvailableOrdinal(usedOrdinals: Set<number>): number {
  let ordinal = 1;
  while (usedOrdinals.has(ordinal)) {
    ordinal += 1;
  }
  return ordinal;
}

function hasBackupRelativePath<T extends { backupRelativePath: string | null }>(
  entry: T,
): entry is T & { backupRelativePath: string } {
  return typeof entry.backupRelativePath === "string";
}

function hasBackupWork(preparedBackup: PreparedBackupExecution): boolean {
  return (
    preparedBackup.copyableFiles.length > 0 ||
    preparedBackup.materializableDirectories.length > 0
  );
}

function createNoopBackupResult(
  preparedBackup: PreparedBackupExecution,
): BackupExecutionResult {
  return {
    status: "noop",
    targetDir: preparedBackup.targetDir,
    destinationDir: null,
    auditReport: preparedBackup.auditReport,
    copiedFiles: [],
    materializedDirectories: [],
  };
}

