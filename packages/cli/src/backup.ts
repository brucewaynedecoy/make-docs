import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { createAuditReport } from "./audit";
import {
  confirmBackupRun,
  renderBackupAuditSummary,
  renderBackupCancelled,
  renderBackupCompletionSummary,
  renderBackupNoopSummary,
} from "./lifecycle-ui";
import { loadManifest } from "./manifest";
import type {
  AuditPrunableDirectory,
  AuditRemovableFile,
  BackupCommandOptions,
  BackupDestinationPlan,
  BackupExecutionResult,
} from "./types";
import { ensureParentDir } from "./utils";

const PROJECT_BACKUP_DIRNAME = ".backup";

export async function runBackupCommand(
  options: BackupCommandOptions,
): Promise<BackupExecutionResult> {
  const targetDir = path.resolve(options.targetDir);
  const homeDir = path.resolve(options.homeDir ?? os.homedir());
  const manifest = loadManifest(targetDir);
  const auditReport = await createAuditReport({
    targetDir,
    manifest,
    homeDir,
  });

  const copyableFiles = auditReport.removableFiles.filter(hasBackupRelativePath);
  const materializableDirectories = auditReport.prunableDirectories.filter(
    hasBackupRelativePath,
  );
  const hasCopyableEntries =
    copyableFiles.length > 0 || materializableDirectories.length > 0;
  const destinationPlan = hasCopyableEntries
    ? resolveBackupDestinationPlan(targetDir, options.now ?? new Date())
    : null;

  renderBackupAuditSummary({
    auditReport,
    destinationDir: destinationPlan?.destinationDir ?? null,
  });

  if (!hasCopyableEntries) {
    renderBackupNoopSummary();
    return {
      status: "noop",
      targetDir,
      destinationDir: null,
      auditReport,
      copiedFiles: [],
      materializedDirectories: [],
    };
  }

  const shouldProceed = await confirmBackupRun(options.permissions);
  if (!shouldProceed) {
    renderBackupCancelled();
    return {
      status: "cancelled",
      targetDir,
      destinationDir: destinationPlan.destinationDir,
      auditReport,
      copiedFiles: [],
      materializedDirectories: [],
    };
  }

  ensureBackupDestination(destinationPlan);
  const copiedFiles = copyAuditedFiles(copyableFiles, destinationPlan.destinationDir);
  const materializedDirectories = materializePrunableDirectories(
    materializableDirectories,
    destinationPlan.destinationDir,
  );

  const result: BackupExecutionResult = {
    status: "completed",
    targetDir,
    destinationDir: destinationPlan.destinationDir,
    auditReport,
    copiedFiles,
    materializedDirectories,
  };
  renderBackupCompletionSummary(result);
  return result;
}

function resolveBackupDestinationPlan(
  targetDir: string,
  now: Date,
): BackupDestinationPlan {
  const backupRoot = path.join(targetDir, PROJECT_BACKUP_DIRNAME);
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

  if (hasPlainDirectory) {
    const promotionOrdinal = findLowestAvailableOrdinal(usedOrdinals);
    const promotedName = `${dateStamp}-${formatOrdinal(promotionOrdinal)}`;
    promotion = {
      from: plainDirectory,
      to: path.join(backupRoot, promotedName),
    };
    usedOrdinals.add(promotionOrdinal);
  }

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

function ensureBackupDestination(plan: BackupDestinationPlan): void {
  mkdirSync(plan.backupRoot, { recursive: true });

  if (plan.promotion) {
    if (existsSync(plan.promotion.to)) {
      throw new Error(
        `Cannot promote existing backup to ${plan.promotion.to} because that destination already exists.`,
      );
    }
    renameSync(plan.promotion.from, plan.promotion.to);
  }

  if (existsSync(plan.destinationDir)) {
    throw new Error(
      `Backup destination already exists: ${plan.destinationDir}. Re-run the command to resolve a fresh destination.`,
    );
  }

  mkdirSync(plan.destinationDir, { recursive: true });
}

function copyAuditedFiles(
  removableFiles: AuditRemovableFile[],
  destinationDir: string,
): string[] {
  const copiedFiles: string[] = [];

  for (const removableFile of removableFiles) {
    if (!removableFile.backupRelativePath) {
      continue;
    }

    const destinationPath = path.join(
      destinationDir,
      removableFile.backupRelativePath,
    );
    ensureParentDir(destinationPath);
    copyFileSync(removableFile.absolutePath, destinationPath);
    copiedFiles.push(removableFile.backupRelativePath);
  }

  return copiedFiles;
}

function materializePrunableDirectories(
  prunableDirectories: AuditPrunableDirectory[],
  destinationDir: string,
): string[] {
  const materializedDirectories = new Set<string>();

  for (const directory of prunableDirectories) {
    const relativePath = directory.backupRelativePath;
    if (!relativePath || relativePath === ".") {
      continue;
    }

    mkdirSync(path.join(destinationDir, relativePath), { recursive: true });
    materializedDirectories.add(relativePath);
  }

  return [...materializedDirectories].sort();
}

function hasBackupRelativePath<T extends { backupRelativePath: string | null }>(
  entry: T,
): entry is T & { backupRelativePath: string } {
  return typeof entry.backupRelativePath === "string";
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
