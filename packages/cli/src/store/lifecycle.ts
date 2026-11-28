import { existsSync, readdirSync, rmdirSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import { STORE_CLEAN_BACKUP_PATTERN, STORE_CLEAN_PARTIAL_BACKUP_PATTERN, withStoreDatabase } from "./database";
import {
  GLOBAL_CONFIG_FILE,
  GLOBAL_MANIFEST_FILE,
  STORE_DATABASE_FILE,
  getStoreDatabasePath,
  resolveStoreRoot,
  type ResolveStoreRootOptions,
} from "./paths";
import { GIT_HOOK_RUNS_DIR, removeAllGitHookRunState } from "./git-hook-runs";
import { resolveProjectIdentity } from "./project-identity";
import { deleteProjectRows, type DeleteProjectRowsResult } from "./state-rows";
import { WorkStoreRefusalError, deletePrunedProjectWorkRows, type DeletePrunedProjectWorkRowsResult } from "./work-store";

/**
 * Store lifecycle behavior (W18 R10 P4; PRD 38 R-LIFE-1, R-LIFE-2).
 *
 * Two seams live here:
 *
 * - {@link pruneProjectFromStore} — project removal. Deletes exactly one
 *   project's current rows, keyed by the manifest-minted project identifier,
 *   leaving every other project's rows untouched (R-LIFE-2). No command calls
 *   it today; `setup remove` does not prune Store rows.
 *
 * - {@link removeGlobalStore} — machine-level store removal. The behavior the
 *   tool-level `uninstall` self-management command (W18 R11 lineage) calls
 *   when the CLI itself is removed, so the store is removed or the user is
 *   informed — never silently orphaned (R-LIFE-1).
 *
 * Repository content is never deleted by either seam, by construction:
 * pruning writes only inside the store database, and store removal unlinks
 * only the fixed, known store filenames under the resolved store root and
 * refuses directories that look like a project `.make-docs/` directory.
 * Neither function throws; every failure degrades to an explicit result,
 * because the store holds recoverable operational state, not project
 * knowledge (R-DB-4).
 */

export interface PruneProjectFromStoreOptions extends ResolveStoreRootOptions {
  /** Repository root whose project rows should be pruned. */
  repoRoot: string;
  /**
   * Pre-resolved project identifier. Callers that must capture identity
   * before the project manifest disappears (the uninstall flow removes
   * `.make-docs/manifest.json`) resolve it first and pass it here; when
   * omitted, identity is resolved from the repository manifest.
   */
  projectId?: string;
  /**
   * The `workDigest` of a complete `work export` of this project. With it, a
   * prune that removes the project's register row also removes the project's
   * work rows, when they still match the digest (W29 R0 P4 T12). Without it,
   * the work rows stay.
   */
  workExportDigest?: string;
}

/** What a prune did with the project's work store rows (W29 R0 P4 T12). */
export type PruneWorkRowsOutcome =
  | {
      status: "removed";
      removed: DeletePrunedProjectWorkRowsResult["removed"];
      /** The project's factory rows that went with the work rows (W30 R0 review, 2026-11-24). */
      factoryRemoved: DeletePrunedProjectWorkRowsResult["factoryRemoved"];
      /** The workflows that stay whole, because a backup record of theirs stays. */
      factoryKept: DeletePrunedProjectWorkRowsResult["factoryKept"];
    }
  | { status: "kept"; reason: string };

export type PruneProjectFromStoreResult =
  | {
      status: "pruned";
      storeRoot: string;
      projectId: string;
      /** Projects left in `project_register` after the prune, without this project (R-REGISTER-4). */
      remainingProjects: number;
      /** Rows removed, by table. `playbook_runs` and `projects` are never removed. */
      removed: DeleteProjectRowsResult["removed"];
      /** True when the register row stays because a checkout of the project is still bound. */
      registerRowKept: boolean;
      /** The project's work rows: kept, unless a complete export's digest was given and still matches. */
      workRows: PruneWorkRowsOutcome;
    }
  | { status: "no-store"; storeRoot: string }
  | {
      status: "no-identity";
      storeRoot: string;
      identityStatus: "unminted" | "no-manifest" | "unreadable";
    }
  | { status: "store-unavailable"; storeRoot: string; reason: string };

/**
 * Prunes one project's rows from the global store, keyed by the
 * manifest-minted project identifier (R-LIFE-2, R-REGISTER-4). The rows that
 * {@link deleteProjectRows} names are removed in one transaction; legacy
 * `playbook_runs` and `projects` rows and every other project's rows are
 * untouched. The remaining projects are counted from `project_register`.
 * Never creates a store database and never throws. It has no caller: a
 * reviewed command in a later design adds one (W32 R0 design, "Row events").
 */
export function pruneProjectFromStore(
  options: PruneProjectFromStoreOptions,
): PruneProjectFromStoreResult {
  const storeRoot = resolveStoreRoot(options);

  let projectId = options.projectId;
  if (!projectId) {
    const identity = resolveProjectIdentity(options.repoRoot);
    if (identity.status !== "resolved") {
      return { status: "no-identity", storeRoot, identityStatus: identity.status };
    }
    projectId = identity.projectId;
  }
  const resolvedProjectId = projectId;

  if (!existsSync(getStoreDatabasePath(storeRoot))) {
    return { status: "no-store", storeRoot };
  }

  try {
    return withStoreDatabase(storeRoot, (db) => {
      const result = deleteProjectRows(db, resolvedProjectId);
      let workRows: PruneWorkRowsOutcome;
      if (options.workExportDigest === undefined) {
        workRows = { status: "kept", reason: "No work export digest was given, so the project's work rows stay." };
      } else if (result.registerRowKept) {
        workRows = { status: "kept", reason: "A checkout of the project is still bound, so its work rows stay." };
      } else {
        try {
          // The factory report goes back too: what went, and each workflow that stays because a backup record of it stays (PRD 52 R-WORK-STORE-13).
          const cleaned = deletePrunedProjectWorkRows(db, resolvedProjectId, { exportDigest: options.workExportDigest });
          workRows = { status: "removed", removed: cleaned.removed, factoryRemoved: cleaned.factoryRemoved, factoryKept: cleaned.factoryKept };
        } catch (error) {
          if (!(error instanceof WorkStoreRefusalError)) throw error;
          workRows = { status: "kept", reason: error.reason };
        }
      }
      return {
        status: "pruned" as const,
        storeRoot,
        projectId: resolvedProjectId,
        remainingProjects: result.remainingProjects,
        removed: result.removed,
        registerRowKept: result.registerRowKept,
        workRows,
      };
    });
  } catch (error) {
    return {
      status: "store-unavailable",
      storeRoot,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

/** Quarantine files created by database recovery are store-owned too. */
const STORE_QUARANTINE_FILE_PREFIX = `${STORE_DATABASE_FILE}.corrupt-`;

/**
 * The store files that removal deletes. Removal keeps the Store backups
 * (`store.db.bridge-v<from>-to-v<to>-<id>.backup` and the clean backup folder
 * `backup/`) and names them in `keptBackups`. Any other entry, such as a lock
 * or lease file that a running command still holds, is kept and reported
 * with the entries the Store does not own.
 */
const KNOWN_STORE_FILES = new Set([
  GLOBAL_CONFIG_FILE,
  GLOBAL_MANIFEST_FILE,
  STORE_DATABASE_FILE,
  `${STORE_DATABASE_FILE}-wal`,
  `${STORE_DATABASE_FILE}-shm`,
]);

/**
 * Entries whose presence marks a project `.make-docs/` directory rather than
 * the machine-level store. If the resolved store root contains any of these
 * (for example through a misconfigured `MAKE_DOCS_HOME`), removal refuses to
 * touch anything: repository content is never deleted by store handling.
 */
const PROJECT_MAKE_DOCS_MARKERS = [
  "config.yaml",
  "contracts",
  "references",
  "templates",
  "scripts",
  "agentics",
  "backup",
  "conflicts",
  "runs",
];

export interface RemoveGlobalStoreOptions extends ResolveStoreRootOptions {}

export interface RemoveGlobalStoreResult {
  status: "removed" | "not-found" | "retained" | "refused";
  storeRoot: string;
  /** Store root-relative names of the files that were removed. */
  removedFiles: string[];
  /** Store root-relative names of entries that were kept. */
  retainedEntries: string[];
  /**
   * Store root-relative paths of the Store backup files that removal kept on
   * purpose (`backup/store-clean-*.db` and `store.db.bridge-*.backup`).
   */
  keptBackups: string[];
  warnings: string[];
}

/**
 * Removes the machine-level global store (R-LIFE-1). This is the removal
 * behavior tool-level `uninstall` invokes so the store is never silently
 * orphaned when the CLI itself is removed.
 *
 * Structural safety: only the fixed, known store filenames (and database
 * quarantine files) are ever unlinked, non-recursively, directly under the
 * resolved store root; the root directory itself is removed only when it is
 * empty afterwards. Anything unexpected is retained and reported, and a root
 * that looks like a project `.make-docs/` directory is refused outright —
 * repository content cannot be deleted by this function. Never throws.
 */
export function removeGlobalStore(
  options: RemoveGlobalStoreOptions = {},
): RemoveGlobalStoreResult {
  const storeRoot = resolveStoreRoot(options);
  const result: RemoveGlobalStoreResult = {
    status: "not-found",
    storeRoot,
    removedFiles: [],
    retainedEntries: [],
    keptBackups: [],
    warnings: [],
  };

  let entries: string[];
  try {
    if (!existsSync(storeRoot) || !statSync(storeRoot).isDirectory()) {
      return result;
    }
    entries = readdirSync(storeRoot).sort();
  } catch (error) {
    result.status = "retained";
    result.warnings.push(
      `Could not read the make-docs global store at ${storeRoot} (${toMessage(error)}); nothing was removed.`,
    );
    return result;
  }

  // `backup/` marks a project `.make-docs/` folder, except the Store's own
  // clean backup folder (W32 R0 P4): next to `store.db`, it holds only
  // `store-clean-*.db` backups, `.store-clean-*.db.partial` files, and the
  // file browser's own `.DS_Store` or `Thumbs.db`.
  const backupFolder = entries.includes(STORE_DATABASE_FILE) ? readStoreBackupFolder(path.join(storeRoot, "backup")) : null;
  if (backupFolder && backupFolder.otherFiles.length > 0) {
    result.status = "refused";
    result.retainedEntries = entries;
    result.warnings.push(
      `Refusing to remove ${storeRoot}: its backup folder has other files (${backupFolder.otherFiles.join(", ")}), ` +
        "so Make Docs cannot tell that it holds only Store backups. No files were removed. " +
        "Move those files out of the backup folder, then run the removal again.",
    );
    return result;
  }
  const storeBackupFolder = backupFolder !== null;
  const projectMarkers = entries.filter((entry) =>
    PROJECT_MAKE_DOCS_MARKERS.includes(entry) && !(entry === "backup" && storeBackupFolder),
  );
  if (projectMarkers.length > 0) {
    result.status = "refused";
    result.retainedEntries = entries;
    result.warnings.push(
      `Refusing to remove ${storeRoot}: it contains ${projectMarkers.join(", ")}, ` +
        "which marks a project .make-docs/ directory, not the machine-level store. " +
        "No files were removed; repository content is never deleted by store handling.",
    );
    return result;
  }

  for (const entry of entries) {
    // W35 R0 P5: the folder of the git hook run files. Removal takes out only its known files, and keeps the
    // folder when something else is in it.
    if (entry === GIT_HOOK_RUNS_DIR) {
      if (removeAllGitHookRunState(storeRoot)) result.removedFiles.push(entry);
      else result.retainedEntries.push(entry);
      continue;
    }
    const isStoreFile =
      KNOWN_STORE_FILES.has(entry) || entry.startsWith(STORE_QUARANTINE_FILE_PREFIX);
    if (!isStoreFile) {
      result.retainedEntries.push(entry);
      continue;
    }
    try {
      unlinkSync(path.join(storeRoot, entry));
      result.removedFiles.push(entry);
    } catch (error) {
      result.retainedEntries.push(entry);
      result.warnings.push(
        `Could not remove ${path.join(storeRoot, entry)} (${toMessage(error)}).`,
      );
    }
  }

  if (result.retainedEntries.length === 0) {
    try {
      rmdirSync(storeRoot);
      result.status = "removed";
      return result;
    } catch (error) {
      result.warnings.push(
        `Could not remove the store directory ${storeRoot} (${toMessage(error)}).`,
      );
    }
  } else {
    const backupEntries = result.retainedEntries.filter((entry) => entry === "backup" ? storeBackupFolder : STORE_BRIDGE_BACKUP_PATTERN.test(entry));
    result.keptBackups = backupEntries.flatMap((entry) => entry === "backup" ? backupFolder!.backups.map((name) => `backup/${name}`) : [entry]);
    const others = result.retainedEntries.filter((entry) => !backupEntries.includes(entry));
    if (others.length > 0) {
      result.warnings.push(
        `The store directory ${storeRoot} was kept because it contains entries the store does not own: ` +
          `${others.join(", ")}.`,
      );
    }
  }

  result.status = "retained";
  return result;
}

/** A schema bridge backup next to `store.db`. */
const STORE_BRIDGE_BACKUP_PATTERN = /^store\.db\.bridge-.+\.backup$/;
/** Files that a file browser adds to any folder. They do not make the backup folder foreign. */
const FILE_BROWSER_FILES = new Set([".DS_Store", "Thumbs.db"]);

/**
 * Sort the entries of `<store>/backup/`: finished Store clean backups, and
 * other files. Partial clean backups and file browser files are neither.
 * Null when the folder is absent or unreadable.
 */
function readStoreBackupFolder(folder: string): { backups: string[]; otherFiles: string[] } | null {
  try {
    if (!statSync(folder).isDirectory()) return null;
    const names = readdirSync(folder).sort();
    return {
      // A partial file is not a usable backup, so it is kept but not counted.
      backups: names.filter((name) => STORE_CLEAN_BACKUP_PATTERN.test(name)),
      otherFiles: names.filter((name) => !STORE_CLEAN_BACKUP_PATTERN.test(name) && !STORE_CLEAN_PARTIAL_BACKUP_PATTERN.test(name) && !FILE_BROWSER_FILES.has(name)),
    };
  } catch {
    return null;
  }
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
