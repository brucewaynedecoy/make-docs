import { createHash } from "node:crypto";
import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, rmdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { isWithinRoot } from "../../backup-paths";
import { assertManagedPathHasNoSymlinks } from "../../utils";
import type { StoreDatabase } from "../../store/database";
import {
  deleteFactoryBackupRecord,
  listFactoryBackups,
  listFactoryBackupsForFinishedWork,
  readFactoryBackup,
  recordFactoryBackup,
  type FactoryBackupRecord,
} from "../../store/factory-store";

/**
 * W30 R0 P2 file backups outside git (PRD 53 R-FACTORY-44 to R-FACTORY-46).
 *
 * In a folder without git, the factory copies a file to
 * `.make-docs/backup/factory/<assignment>/<path>` before a worker changes it,
 * and the Store records the file, its digest, and the assignment. Cleanup
 * removes an assignment's backups when its work is accepted or closed, and
 * any backup older than 30 days. It runs during normal factory operations.
 *
 * Cleanup works only inside `.make-docs/backup/factory/`. Installation
 * recovery backups live beside it, in `.make-docs/backup/<date>/` and
 * `.make-docs/backup/operations/`, and cleanup never reads or removes them.
 */

export const FACTORY_BACKUP_RELATIVE_PATH = ".make-docs/backup/factory";
export const FACTORY_BACKUP_MAX_AGE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The note in the backup folder (T14). It states the cleanup rule and how to get a file back. */
export const FACTORY_BACKUP_README = `# Factory Backups

Make Docs writes this folder. It holds copies of files from before a factory worker changed them, in a project folder without git.

## How to Get a File Back

1. Find the folder of the job. Each folder in this folder is named after one factory assignment.
2. Inside it, the backup has the same path as the original file in your project. For example, \`<assignment>/notes/plan.md\` is the copy of \`notes/plan.md\`.
3. Copy the backup over the changed file. You can also compare the two files first.

Make Docs does not change a backup after it writes it. The Store records each backup with its file, its digest, and its assignment.

## When Backups Are Removed

- When the work of the assignment is accepted or closed, Make Docs removes the assignment's backups.
- Make Docs removes any backup older than 30 days.
- Cleanup runs during normal factory commands. It removes files only in this folder. It never removes the installation recovery backups in the other folders of \`.make-docs/backup/\`.

Git ignores this folder. Its own \`.gitignore\` file does that.
`;

export const FACTORY_BACKUP_GITIGNORE = "*\n";

const OWN_FILES = new Set(["README.md", ".gitignore"]);

function sha256File(file: string): string {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

/** True when the folder or one of its parents holds a `.git` entry (a work tree or a linked worktree). */
export function isInsideGitWorkTree(folder: string): boolean {
  let current = path.resolve(folder);
  for (;;) {
    if (existsSync(path.join(current, ".git"))) return true;
    const parent = path.dirname(current);
    if (parent === current) return false;
    current = parent;
  }
}

export function factoryBackupFolder(projectRoot: string): string {
  return path.join(projectRoot, ...FACTORY_BACKUP_RELATIVE_PATH.split("/"));
}

/** Make the backup folder with its README and its own `.gitignore` (T14). */
export function ensureFactoryBackupFolder(projectRoot: string): string {
  assertManagedPathHasNoSymlinks(projectRoot, FACTORY_BACKUP_RELATIVE_PATH);
  const folder = factoryBackupFolder(projectRoot);
  mkdirSync(folder, { recursive: true });
  const readme = path.join(folder, "README.md");
  if (!existsSync(readme) || readFileSync(readme, "utf8") !== FACTORY_BACKUP_README) writeFileSync(readme, FACTORY_BACKUP_README, "utf8");
  const ignore = path.join(folder, ".gitignore");
  if (!existsSync(ignore) || readFileSync(ignore, "utf8") !== FACTORY_BACKUP_GITIGNORE) writeFileSync(ignore, FACTORY_BACKUP_GITIGNORE, "utf8");
  return folder;
}

export type FactoryBackupOutcome =
  | { status: "inside-git"; record: null }
  | { status: "no-file"; record: null }
  | { status: "backed-up" | "already-backed-up"; record: FactoryBackupRecord };

/**
 * Back up one file before a worker changes it (T12, A16). In a folder with
 * git, nothing is copied: git keeps the history. A file that does not exist
 * yet needs no backup. The first backup of a file for an assignment is the
 * one that counts, so a later call keeps it. The copy is checked against the
 * original's digest before the Store records it, and a failed record removes
 * the copy.
 */
export function backupFactoryFileBeforeChange(
  db: StoreDatabase,
  request: { projectRoot: string; projectId: string; assignmentId: string; filePath: string },
  options: { now?: Date } = {},
): FactoryBackupOutcome {
  const projectRoot = path.resolve(request.projectRoot);
  // The project ID is explicit and checked against project_register; it is never derived from the folder.
  listFactoryBackups(db, request.projectId);
  if (isInsideGitWorkTree(projectRoot)) return { status: "inside-git", record: null };
  const original = path.resolve(projectRoot, request.filePath);
  const relative = path.relative(projectRoot, original);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) throw new Error(`The file ${request.filePath} is not inside the project folder.`);
  if (isWithinRoot(path.join(projectRoot, ".make-docs", "backup"), original) || isWithinRoot(path.join(projectRoot, ".make-docs", "factory"), original)) {
    throw new Error(`The file ${request.filePath} is in a folder that Make Docs owns, so the factory does not back it up.`);
  }
  if (!/^fa-[a-z0-9]{8,64}$/.test(request.assignmentId)) throw new Error("The assignment ID is not a factory assignment ID.");
  const existing = readFactoryBackup(db, request.projectId, request.assignmentId, original);
  if (existing) return { status: "already-backed-up", record: existing };
  if (!existsSync(original)) return { status: "no-file", record: null };
  if (!lstatSync(original).isFile()) throw new Error(`The file ${request.filePath} is not a regular file.`);
  assertManagedPathHasNoSymlinks(projectRoot, relative);
  const folder = ensureFactoryBackupFolder(projectRoot);
  const backupPath = path.join(folder, request.assignmentId, relative);
  mkdirSync(path.dirname(backupPath), { recursive: true });
  const digest = sha256File(original);
  copyFileSync(original, backupPath);
  try {
    if (sha256File(backupPath) !== digest) throw new Error(`The backup of ${request.filePath} does not match the original.`);
    const record = recordFactoryBackup(db, request.projectId, { assignmentId: request.assignmentId, originalPath: original, backupPath, contentDigest: digest }, options);
    return { status: "backed-up", record };
  } catch (error) {
    rmSync(backupPath, { force: true });
    throw error;
  }
}

export interface FactoryBackupCleanupResult {
  /** Backup files removed, as absolute paths. */
  removed: string[];
  /** Why each was removed. */
  reasons: Record<string, "work-finished" | "older-than-30-days" | "unrecorded-older-than-30-days">;
  /**
   * Records older than 30 days whose file is outside this checkout, such as in
   * a checkout that moved. Cleanup removed the record and left the file; the
   * cleanup of the folder that holds it removes it as an unrecorded file.
   */
  recordsOnly: string[];
}

function removeEmptyFolders(folder: string, root: string): void {
  let current = folder;
  while (isWithinRoot(root, current) && current !== root) {
    if (!existsSync(current) || readdirSync(current).length > 0) return;
    rmdirSync(current);
    current = path.dirname(current);
  }
}

/**
 * Clean up the factory backups of one project (T13, A17). The project ID is
 * explicit; the folder only says where that project's backup files are. It removes
 * the backups of an assignment whose work is accepted or closed, and every
 * backup older than 30 days, with its Store record. The 30-day rule applies to
 * every backup record of the project, also one whose file is in another
 * checkout folder, but a file is deleted only inside this checkout's folder. A file in the folder that
 * has no record and is older than 30 days is removed too. Only files inside
 * `.make-docs/backup/factory/` are ever removed, so installation recovery
 * backups stay.
 */
export function cleanupFactoryBackups(
  db: StoreDatabase,
  request: { projectRoot: string; projectId: string },
  options: { now?: Date } = {},
): FactoryBackupCleanupResult {
  const projectRoot = request.projectRoot;
  const records = listFactoryBackups(db, request.projectId);
  const root = factoryBackupFolder(path.resolve(projectRoot));
  const result: FactoryBackupCleanupResult = { removed: [], reasons: {}, recordsOnly: [] };
  const now = (options.now ?? new Date()).getTime();
  const cutoff = new Date(now - FACTORY_BACKUP_MAX_AGE_DAYS * DAY_MS).toISOString();
  const inFolder = (record: FactoryBackupRecord) => isWithinRoot(root, record.backupPath) && path.resolve(record.backupPath) !== root;
  // The 30-day rule for records whose file is not in this checkout: remove the record only.
  for (const record of records) {
    if (inFolder(record) || record.backedUpAt >= cutoff) continue;
    deleteFactoryBackupRecord(db, request.projectId, record.backupPath);
    result.recordsOnly.push(record.backupPath);
  }
  result.recordsOnly.sort();
  if (!existsSync(root)) return result;
  assertManagedPathHasNoSymlinks(projectRoot, FACTORY_BACKUP_RELATIVE_PATH);
  const finished = new Set(listFactoryBackupsForFinishedWork(db, request.projectId).filter(inFolder).map((record) => record.backupPath));
  const ours = records.filter(inFolder);
  for (const record of ours) {
    const reason = finished.has(record.backupPath) ? "work-finished" : record.backedUpAt < cutoff ? "older-than-30-days" : null;
    if (!reason) continue;
    if (existsSync(record.backupPath) && lstatSync(record.backupPath).isFile()) rmSync(record.backupPath, { force: true });
    deleteFactoryBackupRecord(db, request.projectId, record.backupPath);
    removeEmptyFolders(path.dirname(record.backupPath), root);
    result.removed.push(record.backupPath);
    result.reasons[record.backupPath] = reason;
  }
  // A file that another project recorded is never an unrecorded file of this one.
  const recorded = new Set(db.prepare("SELECT backup_path FROM factory_backups").all().map((row) => path.resolve((row as { backup_path: string }).backup_path)));
  const sweep = (folder: string): void => {
    if (!existsSync(folder)) return;
    for (const name of readdirSync(folder)) {
      const entry = path.join(folder, name);
      if (folder === root && OWN_FILES.has(name)) continue;
      const stat = lstatSync(entry);
      if (stat.isSymbolicLink()) continue;
      if (stat.isDirectory()) {
        sweep(entry);
        removeEmptyFolders(entry, root);
        continue;
      }
      if (!stat.isFile() || recorded.has(path.resolve(entry))) continue;
      if (statSync(entry).mtimeMs < now - FACTORY_BACKUP_MAX_AGE_DAYS * DAY_MS) {
        rmSync(entry, { force: true });
        result.removed.push(entry);
        result.reasons[entry] = "unrecorded-older-than-30-days";
      }
    }
  };
  sweep(root);
  result.removed.sort();
  return result;
}
