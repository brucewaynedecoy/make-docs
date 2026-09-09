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
import { getProjectBackupRoot } from "./backup-paths";
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
    for (const directory of [...preparedBackup.materializableDirectories].sort((a, b) => a.backupRelativePath.split(path.sep).length - b.backupRelativePath.split(path.sep).length)) {
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

export function resolveBackupDestinationPlan(
  targetDir: string,
  now: Date,
): BackupDestinationPlan {
  const backupRoot = getProjectBackupRoot(targetDir);
  const dateStamp = formatDateStamp(now);
  const plainDirectory = path.join(backupRoot, dateStamp);
  const existingOrdinals = collectExistingOrdinals(backupRoot, dateStamp);
  const hasPlainDirectory = existsSync(plainDirectory);

  if (!hasPlainDirectory && existingOrdinals.length === 0) {
    return {
      backupRoot,
      dateStamp,
      directoryName: dateStamp,
      destinationDir: plainDirectory,
    };
  }

  const usedOrdinals = new Set(existingOrdinals);
  let promotion: BackupDestinationPlan["promotion"];

  // A completed backup path is a durable payload reference. Never rename it.
  if (hasPlainDirectory) usedOrdinals.add(0);

  const nextOrdinal = Math.max(...usedOrdinals, 0) + 1;
  const directoryName = `${dateStamp}-${formatOrdinal(nextOrdinal)}`;

  return {
    backupRoot,
    dateStamp,
    directoryName,
    destinationDir: path.join(backupRoot, directoryName),
    promotion,
  };
}

function collectExistingOrdinals(backupRoot: string, dateStamp: string): number[] {
  if (!existsSync(backupRoot)) {
    return [];
  }

  const pattern = new RegExp(`^${escapeRegExp(dateStamp)}-(\\d+)$`);
  return readdirSync(backupRoot)
    .map((entryName) => {
      const match = pattern.exec(entryName);
      if (!match) {
        return null;
      }

      return Number.parseInt(match[1] ?? "", 10);
    })
    .filter((value): value is number => Number.isInteger(value))
    .sort((left, right) => left - right);
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

function formatDateStamp(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatOrdinal(ordinal: number): string {
  return String(ordinal).padStart(2, "0");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
