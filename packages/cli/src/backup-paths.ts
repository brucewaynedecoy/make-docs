import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

import type { BackupDestinationPlan } from "./types";

export const PROJECT_BACKUP_RELATIVE_PATH = ".make-docs/backup";
export const LEGACY_PROJECT_BACKUP_RELATIVE_PATH = ".backup";

export function getProjectBackupRoot(targetDir: string): string {
  return path.resolve(targetDir, PROJECT_BACKUP_RELATIVE_PATH);
}

export function getLegacyProjectBackupRoot(targetDir: string): string {
  return path.resolve(targetDir, LEGACY_PROJECT_BACKUP_RELATIVE_PATH);
}

export function getProjectBackupStateRoots(targetDir: string): string[] {
  return [
    getProjectBackupRoot(targetDir),
    getLegacyProjectBackupRoot(targetDir),
  ];
}

export function isInsideProjectBackupStateRoot(
  targetDir: string,
  candidatePath: string,
): boolean {
  return getProjectBackupStateRoots(targetDir).some((backupRoot) =>
    isWithinRoot(backupRoot, candidatePath),
  );
}

export function isWithinRoot(rootPath: string, candidatePath: string): boolean {
  const relative = path.relative(path.resolve(rootPath), path.resolve(candidatePath));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

/** The folder of the next backup of a project: the date, and a number when that date already has a backup. It creates nothing. */
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
