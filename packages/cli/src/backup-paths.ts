import path from "node:path";

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
