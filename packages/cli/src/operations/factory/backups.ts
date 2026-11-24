import { createHash } from "node:crypto";
import { accessSync, constants, copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, rmdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { isWithinRoot } from "../../backup-paths";
import { assertManagedPathHasNoSymlinks } from "../../utils";
import type { StoreDatabase } from "../../store/database";
import { splitFactoryBackupPath } from "../../store/factory-backup-path";
import {
  deleteFactoryBackupRecord,
  listFactoryBackups,
  listFactoryBackupsForFinishedWork,
  listFactoryBackupsOfWorkflow,
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
 * A backup record and its file stay together (owner decision 2026-11-24).
 * Cleanup removes a record only together with its file, in the checkout that
 * the call acts on. A record whose file is in another checkout, or in a folder
 * that moved or is gone, stays, and the result reports it with the path
 * inside the project only.
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
- Make Docs removes a backup and its Store record together. A record whose file is in another checkout stays until a factory command runs in that checkout.
- When a person removes a saved workflow with \`make-docs factory workflow clean\`, Make Docs removes the backups of that workflow too.

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

/**
 * A file that the factory cannot back up. The message is plain words for a
 * person: it names the file by its path inside the project, and it never
 * holds an absolute path or a raw system error.
 */
export class FactoryBackupFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FactoryBackupFileError";
  }
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
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new FactoryBackupFileError(`The file ${path.basename(original) || "that was named"} is not inside the project folder.`);
  }
  // Messages name the file by its path inside the project, never by an absolute path.
  const name = relative.split(path.sep).join("/");
  if (isWithinRoot(path.join(projectRoot, ".make-docs", "backup"), original) || isWithinRoot(path.join(projectRoot, ".make-docs", "factory"), original)) {
    throw new FactoryBackupFileError(`The file ${name} is in a folder that Make Docs owns, so the factory does not back it up.`);
  }
  if (!/^fa-[a-z0-9]{8,64}$/.test(request.assignmentId)) throw new FactoryBackupFileError("The assignment ID is not a factory assignment ID.");
  const existing = readFactoryBackup(db, request.projectId, request.assignmentId, original);
  if (existing) return { status: "already-backed-up", record: existing };
  // Look at the path itself first, so a symbolic link is refused, also a broken one that points at no file.
  let stat;
  try {
    stat = lstatSync(original, { throwIfNoEntry: false });
  } catch {
    throw new FactoryBackupFileError(`The file ${name} cannot be read, so the factory cannot back it up.`);
  }
  if (!stat) return { status: "no-file", record: null };
  if (stat.isSymbolicLink()) throw new FactoryBackupFileError(`The file ${name} is a symbolic link, so the factory does not back it up.`);
  if (!stat.isFile()) throw new FactoryBackupFileError(`The file ${name} is not a regular file.`);
  try {
    assertManagedPathHasNoSymlinks(projectRoot, relative);
  } catch {
    throw new FactoryBackupFileError(`The path of the file ${name} goes through a symbolic link, so the factory does not back it up.`);
  }
  const folder = ensureFactoryBackupFolder(projectRoot);
  const backupPath = path.join(folder, request.assignmentId, relative);
  try {
    let digest: string;
    try {
      mkdirSync(path.dirname(backupPath), { recursive: true });
      digest = sha256File(original);
      copyFileSync(original, backupPath);
      if (sha256File(backupPath) !== digest) throw new FactoryBackupFileError(`The backup of ${name} does not match the original.`);
    } catch (error) {
      if (error instanceof FactoryBackupFileError) throw error;
      // A system error, such as no permission to read the file. The message says so in plain words.
      throw new FactoryBackupFileError(`The file ${name} cannot be read or copied, so the factory cannot back it up. Check that this account can read the file.`);
    }
    const record = recordFactoryBackup(db, request.projectId, { assignmentId: request.assignmentId, originalPath: original, backupPath, contentDigest: digest }, options);
    return { status: "backed-up", record };
  } catch (error) {
    // Remove only what this call made for this file: its copy, and the folders that are empty now.
    rmSync(backupPath, { force: true });
    removeEmptyFactoryBackupFolders(path.dirname(backupPath), folder);
    throw error;
  }
}

/**
 * Remove the backup folder that a refused call created, but only when it
 * holds nothing except its own `README.md` and `.gitignore`. A folder with a
 * backup of another call stays as it is.
 */
export function removeUnusedFactoryBackupFolder(projectRoot: string): boolean {
  const folder = factoryBackupFolder(path.resolve(projectRoot));
  if (!existsSync(folder) || readdirSync(folder).some((entry) => !OWN_FILES.has(entry))) return false;
  for (const entry of OWN_FILES) rmSync(path.join(folder, entry), { force: true });
  rmdirSync(folder);
  removeEmptyFactoryBackupFolders(path.dirname(folder), path.join(path.resolve(projectRoot), ".make-docs"));
  return true;
}

/** A bound checkout of the project, as cleanup needs it to say where a kept record's file is. */
export interface FactoryBackupCheckout {
  checkoutId: string;
  root: string;
  exists: boolean;
}

/**
 * A backup record that is due for removal but stays, because Make Docs cannot
 * remove its file safely now (owner decision 2026-11-24). It holds no absolute
 * path.
 */
export interface FactoryBackupKept {
  /** The backup file, as its path inside the project: `.make-docs/backup/factory/<assignment>/<path>`. */
  backup: string;
  assignmentId: string;
  /**
   * `other-checkout`: the file is in another bound checkout on this machine.
   * `checkout-missing`: its folder moved, is gone, or is not bound.
   * `unsafe-path`: a part of the path below the checkout folder is a symbolic link or is not a folder, so nothing is deleted through it.
   * `locked`: this account cannot delete in the file's folder.
   * `delete-failed`: the checks passed, but the delete itself failed.
   * `changed-file`: only in the reviewed removal. The recorded path is not found, and a reachable checkout holds something at the same path inside the project that is not proved to be the record's file.
   */
  where: "other-checkout" | "checkout-missing" | "unsafe-path" | "locked" | "delete-failed" | "changed-file";
  /** The bound checkout that holds the file, when one does. */
  checkoutId: string | null;
  /** Why the record is due. */
  due: "work-finished" | "older-than-30-days" | "workflow-removed";
}

export interface FactoryBackupCleanupResult {
  /** Backup files removed, as absolute paths. Each recorded one went together with its Store record. */
  removed: string[];
  /** Why each was removed. */
  reasons: Record<string, "work-finished" | "older-than-30-days" | "unrecorded-older-than-30-days">;
  /** Records that are due but stay. Nothing was dropped. */
  kept: FactoryBackupKept[];
}

/**
 * The path of a backup file inside its project, from the factory backup folder
 * on. It never holds the checkout folder. With the record's assignment ID it
 * uses the shared split, at the last backup folder marker that the assignment
 * ID follows, so a backed-up file whose own path holds the marker still gives
 * the right path. Without one, or for a path that has no such part, it splits
 * at the last plain marker.
 */
export function factoryBackupProjectPath(backupPath: string, assignmentId?: string, originalPath?: string): string {
  const split = assignmentId === undefined ? null : splitFactoryBackupPath(path.resolve(backupPath), assignmentId, originalPath);
  if (split) return split.projectPath;
  const parts = path.resolve(backupPath).split(path.sep);
  const marker = FACTORY_BACKUP_RELATIVE_PATH.split("/");
  for (let index = parts.length - marker.length; index >= 0; index--) {
    if (marker.every((word, offset) => parts[index + offset] === word)) return parts.slice(index).join("/");
  }
  return `${FACTORY_BACKUP_RELATIVE_PATH}/${parts.at(-1) ?? ""}`;
}

function inBackupFolder(root: string, backupPath: string): boolean {
  const folder = factoryBackupFolder(path.resolve(root));
  return isWithinRoot(folder, backupPath) && path.resolve(backupPath) !== folder;
}

/** What Make Docs finds at a backup path before it deletes there. */
export type FactoryBackupPathState = "file" | "absent" | "unsafe-path" | "locked";

/**
 * Look at a backup path before a delete (W30 R0 review, 2026-11-24). Each
 * part of the path below the checkout folder is read with `lstat`: the
 * `.make-docs`, `backup`, and `factory` folders, each folder under them, and
 * the file. A part that is a symbolic link, a middle part that is not a
 * folder, and a last part that is not a regular file give `unsafe-path`. The
 * real path of the file's folder must also be the folder that the path
 * names, so no link can send a delete outside the backup folder. `locked`
 * means that this account cannot delete in the file's folder. It never
 * follows a link, and it changes nothing.
 */
export function factoryBackupPathState(root: string, backupPath: string): FactoryBackupPathState {
  const base = path.resolve(root);
  const target = path.resolve(backupPath);
  if (!inBackupFolder(base, target)) return "unsafe-path";
  const parts = path.relative(base, target).split(path.sep);
  let current = base;
  try {
    for (let index = 0; index < parts.length; index++) {
      current = path.join(current, parts[index]!);
      const stat = lstatSync(current, { throwIfNoEntry: false });
      if (!stat) return "absent";
      if (stat.isSymbolicLink()) return "unsafe-path";
      const last = index === parts.length - 1;
      if (last ? !stat.isFile() : !stat.isDirectory()) return "unsafe-path";
    }
    const folder = path.dirname(target);
    if (realpathSync(folder) !== path.join(realpathSync(base), path.relative(base, folder))) return "unsafe-path";
    accessSync(folder, constants.W_OK | constants.X_OK);
  } catch {
    // The path cannot be read or its folder cannot be changed. Make Docs deletes nothing there.
    return "locked";
  }
  return "file";
}

function keptBackup(
  record: FactoryBackupRecord,
  checkouts: readonly FactoryBackupCheckout[],
  due: FactoryBackupKept["due"],
  where?: FactoryBackupBlock,
  backupPath = record.backupPath,
): FactoryBackupKept {
  const holder = checkouts.find((checkout) => inBackupFolder(checkout.root, backupPath)) ?? null;
  return {
    // The path inside the project is the record's own, also when the file was found in a folder that moved.
    backup: factoryBackupProjectPath(record.backupPath, record.assignmentId, record.originalPath),
    assignmentId: record.assignmentId,
    where: where ?? (holder?.exists ? "other-checkout" : "checkout-missing"),
    checkoutId: holder?.checkoutId ?? null,
    due,
  };
}

function showKept(entries: readonly FactoryBackupKept[]): string {
  return `${entries.slice(0, 5).map((entry) => entry.backup).join(", ")}${entries.length > 5 ? `, and ${entries.length - 5} more` : ""}`;
}

/** The words for one reason that a backup file cannot be removed now. */
export const FACTORY_BACKUP_BLOCK_WORDS = Object.freeze({
  "unsafe-path": "A part of the path is a symbolic link, or is not a folder or a regular file. Make Docs deletes nothing through a link.",
  locked: "This account cannot delete in that folder.",
  // The checks passed and the delete still failed. The cause is not known here, so the words stay general.
  "delete-failed": "The delete did not work. The file or its folder can be locked or protected.",
} as const);

/** The smallest fix for each reason, in plain words. */
export const FACTORY_BACKUP_BLOCK_FIXES = Object.freeze({
  "unsafe-path": "Replace the link with the real folder, or remove the link.",
  locked: "Make the folder writable for this account.",
  "delete-failed": "Check that this account can delete the file: its folder must be writable, and the file must not be locked or protected.",
} as const);
export type FactoryBackupBlock = keyof typeof FACTORY_BACKUP_BLOCK_WORDS;

/** One plain line for each kind of record that cleanup kept. It names paths inside the project only. */
export function factoryBackupKeptLines(kept: readonly FactoryBackupKept[]): string[] {
  if (kept.length === 0) return [];
  const of = (where: FactoryBackupKept["where"]) => kept.filter((entry) => entry.where === where);
  const other = of("other-checkout");
  const missing = of("checkout-missing");
  const unsafe = of("unsafe-path");
  const locked = of("locked");
  const failed = of("delete-failed");
  const together = "A record goes only together with its file.";
  return [
    ...(other.length ? [`Kept ${other.length} backup record(s) whose file is in another checkout of this project: ${showKept(other)}. ${together} Run make-docs factory restore --target-root <that checkout> to clean up there.`] : []),
    ...(missing.length ? [`Kept ${missing.length} backup record(s) whose checkout folder moved or is gone: ${showKept(missing)}. ${together} Bring the folder back, or leave the record: it changes nothing else.`] : []),
    ...(unsafe.length ? [`Kept ${unsafe.length} backup record(s) and deleted no file for them: ${showKept(unsafe)}. ${FACTORY_BACKUP_BLOCK_WORDS["unsafe-path"]} Replace the link with the real folder, or remove the link, then run the command again.`] : []),
    ...(locked.length ? [`Kept ${locked.length} backup record(s) whose file this account cannot delete: ${showKept(locked)}. ${together} Make the folder writable for this account, then run the command again.`] : []),
    ...(failed.length ? [`Kept ${failed.length} backup record(s) whose file could not be deleted: ${showKept(failed)}. ${FACTORY_BACKUP_BLOCK_WORDS["delete-failed"]} ${FACTORY_BACKUP_BLOCK_FIXES["delete-failed"]} Then run the command again.`] : []),
  ];
}

/**
 * The one call that deletes a backup file. It is an object so that a test can
 * make one delete fail after the checks passed.
 */
export const factoryBackupFileRemover = {
  remove(file: string): void {
    rmSync(file);
  },
};

/**
 * Remove one backup file inside `root`'s factory backup folder, and the
 * folders that are empty now. It checks the path first with
 * {@link factoryBackupPathState} and deletes only a regular file that no link
 * leads to. Returns `removed`, `absent` when no file was there, or the reason
 * that it deleted nothing: `unsafe-path` or `locked` from the check, or
 * `delete-failed` when the check passed and the delete still failed. It never
 * throws a system error.
 */
function removeBackupFile(root: string, backupPath: string): "removed" | "absent" | FactoryBackupBlock {
  const state = factoryBackupPathState(root, backupPath);
  if (state === "unsafe-path" || state === "locked") return state;
  if (state === "file") {
    try {
      factoryBackupFileRemover.remove(backupPath);
    } catch {
      return "delete-failed";
    }
    if (lstatSync(backupPath, { throwIfNoEntry: false })) return "delete-failed";
  }
  try {
    removeEmptyFactoryBackupFolders(path.dirname(backupPath), factoryBackupFolder(path.resolve(root)));
  } catch {
    // An empty folder that cannot be removed is harmless: the file and its record are gone together.
  }
  return state === "file" ? "removed" : "absent";
}

/** Remove a folder and its parents while they are empty, up to and never including `root`. It stops at anything that is not a real folder. */
export function removeEmptyFactoryBackupFolders(folder: string, root: string): void {
  let current = folder;
  while (isWithinRoot(root, current) && current !== root) {
    const stat = lstatSync(current, { throwIfNoEntry: false });
    if (!stat || !stat.isDirectory() || readdirSync(current).length > 0) return;
    rmdirSync(current);
    current = path.dirname(current);
  }
}

/**
 * Clean up the factory backups of one project (T13, A17). The project ID is
 * explicit; the folder only says where that project's backup files are. It removes
 * the backups of an assignment whose work is accepted or closed, and every
 * backup older than 30 days, with its Store record. A record and its file go
 * together: the file first, then the record. A due record whose file is not in
 * this checkout's folder stays, and `kept` reports it; the cleanup of the
 * checkout that holds the file removes both. A due record whose path goes
 * through a symbolic link, or whose file this account cannot delete, stays
 * too, and no file is deleted for it. A file in the folder that
 * has no record and is older than 30 days is removed too. Only files inside
 * `.make-docs/backup/factory/` are ever removed, so installation recovery
 * backups stay.
 */
export function cleanupFactoryBackups(
  db: StoreDatabase,
  request: { projectRoot: string; projectId: string; checkouts?: readonly FactoryBackupCheckout[] },
  options: { now?: Date } = {},
): FactoryBackupCleanupResult {
  const projectRoot = request.projectRoot;
  const records = listFactoryBackups(db, request.projectId);
  const root = factoryBackupFolder(path.resolve(projectRoot));
  const result: FactoryBackupCleanupResult = { removed: [], reasons: {}, kept: [] };
  const now = (options.now ?? new Date()).getTime();
  const cutoff = new Date(now - FACTORY_BACKUP_MAX_AGE_DAYS * DAY_MS).toISOString();
  const checkouts = request.checkouts ?? [];
  const inFolder = (record: FactoryBackupRecord) => inBackupFolder(projectRoot, record.backupPath);
  const finishedAll = new Set(listFactoryBackupsForFinishedWork(db, request.projectId).map((record) => record.backupPath));
  const dueReason = (record: FactoryBackupRecord) => (finishedAll.has(record.backupPath) ? "work-finished" as const : record.backedUpAt < cutoff ? "older-than-30-days" as const : null);
  /** Remove one due record's file at `file`, then the record. A file that cannot be removed safely keeps its record. */
  const removeTogether = (record: FactoryBackupRecord, file: string, due: "work-finished" | "older-than-30-days"): void => {
    // The file first, then its record: a failure between the two leaves a record with no file, never a file with no record.
    const outcome = removeBackupFile(projectRoot, file);
    if (outcome !== "removed" && outcome !== "absent") {
      result.kept.push(keptBackup(record, checkouts, due, outcome, file));
      return;
    }
    deleteFactoryBackupRecord(db, request.projectId, record.backupPath);
    result.removed.push(file);
    result.reasons[file] = due;
  };
  // A due record whose file is not in this checkout stays, and the result reports it (owner decision 2026-11-24).
  // Nothing is dropped: the cleanup of the checkout that holds the file removes the file and the record together.
  // A checkout folder that moved keeps its backup files, but each record still names the old folder. The file of
  // such a record is the one at the same path inside this checkout with the recorded digest, while the old path
  // holds no file. That file is this record's file, so the two still go together.
  const movedHere = new Map<string, string>();
  // A file that is the recorded backup of another record is that record's own file, never a moved one (round 5).
  const recordedHere = new Set(records.map((record) => path.resolve(record.backupPath)));
  for (const record of records) {
    if (inFolder(record)) continue;
    const here = path.join(path.resolve(projectRoot), ...factoryBackupProjectPath(record.backupPath, record.assignmentId, record.originalPath).split("/"));
    if (!inBackupFolder(projectRoot, here) || recordedHere.has(path.resolve(here)) || lstatSync(record.backupPath, { throwIfNoEntry: false })) continue;
    try {
      if (factoryBackupPathState(projectRoot, here) === "file" && sha256File(here) === record.contentDigest) movedHere.set(record.backupPath, here);
    } catch {
      // A file that cannot be read is not proved to be this record's file.
    }
  }
  for (const record of records) {
    const due = dueReason(record);
    if (inFolder(record) || !due) continue;
    const here = movedHere.get(record.backupPath);
    if (here) removeTogether(record, here, due);
    else result.kept.push(keptBackup(record, checkouts, due));
  }
  for (const record of records.filter(inFolder)) {
    const due = dueReason(record);
    if (due) removeTogether(record, record.backupPath, due);
  }
  result.kept.sort((left, right) => (left.backup < right.backup ? -1 : left.backup > right.backup ? 1 : 0));
  result.removed.sort();
  // The sweep of old unrecorded files runs only in a real backup folder that no link leads to.
  const rootStat = lstatSync(root, { throwIfNoEntry: false });
  if (!rootStat?.isDirectory()) return result;
  try {
    assertManagedPathHasNoSymlinks(projectRoot, FACTORY_BACKUP_RELATIVE_PATH);
  } catch {
    return result;
  }
  // A file that another project recorded is never an unrecorded file of this one.
  const recorded = new Set(db.prepare("SELECT backup_path FROM factory_backups").all().map((row) => path.resolve((row as { backup_path: string }).backup_path)));
  // The file of a record from before the folder moved is recorded too, so the sweep leaves it.
  for (const here of movedHere.values()) recorded.add(path.resolve(here));
  const sweep = (folder: string): void => {
    let names: string[];
    try {
      names = readdirSync(folder);
    } catch {
      return;
    }
    for (const name of names) {
      const entry = path.join(folder, name);
      if (folder === root && OWN_FILES.has(name)) continue;
      const stat = lstatSync(entry, { throwIfNoEntry: false });
      // A link is never followed and never removed here.
      if (!stat || stat.isSymbolicLink()) continue;
      if (stat.isDirectory()) {
        sweep(entry);
        try {
          removeEmptyFactoryBackupFolders(entry, root);
        } catch {
          // A folder that cannot be removed stays.
        }
        continue;
      }
      if (!stat.isFile() || recorded.has(path.resolve(entry))) continue;
      if (stat.mtimeMs < now - FACTORY_BACKUP_MAX_AGE_DAYS * DAY_MS && removeBackupFile(projectRoot, entry) === "removed") {
        result.removed.push(entry);
        result.reasons[entry] = "unrecorded-older-than-30-days";
      }
    }
  };
  sweep(root);
  result.removed.sort();
  return result;
}

/** One backup record that the reviewed removal drops with no file (owner decision D-078, option B, 2026-11-24). */
export interface FactoryBackupDropped {
  /** The backup file that the record names, as its path inside the project. */
  backup: string;
  assignmentId: string;
  /** The bound checkout whose folder is not found, or null when no bound checkout holds the path. */
  checkoutId: string | null;
  /** Internal: the record's own key. The removal deletes by it, so two records with one name both go. No result shows it. */
  backupPath: string;
}

/** One file that the reviewed removal deletes for a backup record. */
export interface FactoryBackupFile {
  root: string;
  checkoutId: string;
  /** The file to delete: the recorded path, or the same path inside a checkout folder that moved. */
  file: string;
  /** The SHA-256 of the bytes that are in the file now, or null when no file is there or it cannot be read. */
  diskDigest: string | null;
}

export interface FactoryWorkflowBackupPlan {
  /**
   * Records whose file is in a bound checkout folder on this machine. The removal deletes each file and then the
   * record. A record has one file, except after a folder move when more than one reachable checkout holds the same
   * path with the recorded hash: then each of those files is this record's file, and each one goes.
   */
  inReach: Array<{ record: FactoryBackupRecord; files: FactoryBackupFile[] }>;
  /**
   * Records whose files are not found on this computer now: no reachable checkout holds the path, and nothing is at
   * the path. The folder was removed or renamed, or it is on a drive that is not connected. The reviewed removal drops
   * each record with no file, and the review lists each one by name. If the files still exist, they stay.
   */
  dropped: FactoryBackupDropped[];
  /** Records whose file is still on this machine, in a folder that is not a bound checkout. They stay, so the removal stops. */
  outOfReach: FactoryBackupKept[];
  /** In-reach records whose file Make Docs cannot delete safely now: a link in the path, or no permission. They stop the removal before any delete. */
  blocked: FactoryBackupKept[];
  /**
   * Records whose recorded path is not found, while a reachable checkout holds something at the same path inside the
   * project that is not proved to be the record's file: other bytes, a link in the path, or a file that cannot be
   * read. The record is not dropped, and the removal stops.
   */
  changed: Array<FactoryBackupKept & { where: "changed-file" }>;
}

/**
 * Sort the backup records of one workflow for its reviewed removal (owner
 * decisions 2026-11-24, register D-078 option B and D-079 option A). It
 * reads only.
 *
 * - In reach: the file is inside the factory backup folder of a bound
 *   checkout of the project whose folder is on this machine, also another
 *   checkout than the one that the call names (D-079). A checkout folder that
 *   moved is handled as in cleanup: the file at the same path inside a
 *   reachable checkout, with the recorded hash, is the record's file. When
 *   more than one reachable checkout holds such a file, each one is the
 *   record's file, so each one goes and the review counts each one. Each
 *   in-reach path is checked with {@link factoryBackupPathState}, and the
 *   bytes on the disk are hashed, so the review digest changes when a file
 *   changes.
 * - Changed: the recorded path is not found, and a reachable checkout holds
 *   something at the same path inside the project that is not proved to be
 *   the record's file. The record stays, and the removal stops.
 * - Dropped: no reachable checkout holds the path or anything at the same
 *   path inside the project, and nothing is at the recorded path. The files
 *   are not found on this computer now, so the removal drops the record with
 *   no file (D-078). The software cannot know that the files are gone for
 *   good: if they still exist, they stay, and no later cleanup finds them.
 * - Out of reach: something is still at the path, in a folder that is not a
 *   bound checkout, or the path cannot be read. The record stays, and the
 *   removal stops.
 */
export function planFactoryWorkflowBackupRemoval(
  db: StoreDatabase,
  request: { projectId: string; workflowName: string; checkouts: readonly FactoryBackupCheckout[] },
): FactoryWorkflowBackupPlan {
  const plan: FactoryWorkflowBackupPlan = { inReach: [], dropped: [], outOfReach: [], blocked: [], changed: [] };
  const reachable = request.checkouts.filter((checkout) => checkout.exists);
  const diskDigest = (file: string): string | null => {
    try {
      return sha256File(file);
    } catch {
      return null;
    }
  };
  const workflowRecords = listFactoryBackupsOfWorkflow(db, request.projectId, request.workflowName);
  const recordedPaths = new Set(workflowRecords.map((record) => path.resolve(record.backupPath)));
  for (const record of workflowRecords) {
    const holder = reachable.find((checkout) => inBackupFolder(checkout.root, record.backupPath));
    if (holder) {
      const state = factoryBackupPathState(holder.root, record.backupPath);
      plan.inReach.push({ record, files: [{ root: holder.root, checkoutId: holder.checkoutId, file: record.backupPath, diskDigest: state === "file" ? diskDigest(record.backupPath) : null }] });
      if (state === "unsafe-path" || state === "locked") plan.blocked.push(keptBackup(record, request.checkouts, "workflow-removed", state));
      continue;
    }
    let present: boolean;
    try {
      present = lstatSync(record.backupPath, { throwIfNoEntry: false }) !== undefined;
    } catch {
      // The path cannot be read, so it is not proved absent.
      present = true;
    }
    if (present) {
      plan.outOfReach.push(keptBackup(record, request.checkouts, "workflow-removed"));
      continue;
    }
    // The folder moved: the same path inside a reachable checkout, with the recorded hash, is this record's file.
    // Every reachable checkout is looked at, so no copy stays behind and the first folder name never decides.
    const projectPath = factoryBackupProjectPath(record.backupPath, record.assignmentId, record.originalPath);
    const matches: FactoryBackupFile[] = [];
    let unproved: FactoryBackupCheckout | null = null;
    for (const checkout of reachable) {
      const file = path.join(path.resolve(checkout.root), ...projectPath.split("/"));
      if (!inBackupFolder(checkout.root, file)) continue;
      // A file that is the recorded backup of another record of this workflow is that record's own file. It goes
      // with that record, and it is counted once (round 5).
      if (recordedPaths.has(path.resolve(file))) continue;
      const state = factoryBackupPathState(checkout.root, file);
      if (state === "absent") continue;
      if (state === "file" && diskDigest(file) === record.contentDigest) matches.push({ root: checkout.root, checkoutId: checkout.checkoutId, file, diskDigest: record.contentDigest });
      else unproved ??= checkout;
    }
    if (unproved) {
      // Something is at the record's path inside the project, but it is not proved to be the record's file.
      plan.changed.push({ backup: projectPath, assignmentId: record.assignmentId, where: "changed-file", checkoutId: unproved.checkoutId, due: "workflow-removed" });
      continue;
    }
    if (matches.length > 0) {
      plan.inReach.push({ record, files: matches });
      continue;
    }
    const named = request.checkouts.find((checkout) => inBackupFolder(checkout.root, record.backupPath)) ?? null;
    plan.dropped.push({ backup: projectPath, assignmentId: record.assignmentId, checkoutId: named?.checkoutId ?? null, backupPath: record.backupPath });
  }
  return plan;
}

export interface FactoryWorkflowBackupRemoval {
  /** The backups whose files and record went, as paths inside the project. */
  removed: string[];
  /** How many files were deleted. It is more than `removed` when a record had a copy in more than one checkout. */
  filesRemoved: number;
  /** The records that were dropped with no file, because their files are not found on this computer now, as paths inside the project. */
  dropped: string[];
  /** The backups that stay with their records, as paths inside the project. It is empty when every backup went. */
  kept: string[];
  /** The backup at which the removal stopped, and why. Null when every backup went. */
  stoppedAt: { backup: string; why: FactoryBackupBlock } | null;
}

/**
 * Remove each in-reach backup of a workflow removal: each file first, then
 * the record. Each path is checked again just before its delete. When one
 * file cannot be removed, it stops there: the records of the backups whose
 * files all went are deleted, and every other record stays, so the Store
 * matches the disk. When every file went, it drops the records whose files
 * are not found on this computer, each by its own key. It never throws a
 * system error.
 */
export function removeFactoryWorkflowBackups(db: StoreDatabase, projectId: string, plan: FactoryWorkflowBackupPlan): FactoryWorkflowBackupRemoval {
  const result: FactoryWorkflowBackupRemoval = { removed: [], filesRemoved: 0, dropped: [], kept: [], stoppedAt: null };
  for (const entry of plan.inReach) {
    const backup = factoryBackupProjectPath(entry.record.backupPath, entry.record.assignmentId, entry.record.originalPath);
    if (result.stoppedAt) {
      result.kept.push(backup);
      continue;
    }
    for (const target of entry.files) {
      const outcome = removeBackupFile(target.root, target.file);
      if (outcome !== "removed" && outcome !== "absent") {
        result.stoppedAt = { backup, why: outcome };
        break;
      }
      if (outcome === "removed") result.filesRemoved++;
    }
    if (result.stoppedAt) {
      // A copy of this backup is still on the disk, so its record stays.
      result.kept.push(backup);
      continue;
    }
    deleteFactoryBackupRecord(db, projectId, entry.record.backupPath);
    result.removed.push(backup);
  }
  if (result.stoppedAt) {
    // The removal is not complete, so the records with no file stay too. The next review lists them again.
    result.kept.push(...plan.dropped.map((entry) => entry.backup));
    return result;
  }
  for (const entry of plan.dropped) {
    deleteFactoryBackupRecord(db, projectId, entry.backupPath);
    result.dropped.push(entry.backup);
  }
  return result;
}
