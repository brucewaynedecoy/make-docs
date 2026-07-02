import { existsSync, readdirSync, rmdirSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import { withStoreDatabase } from "./database";
import {
  GLOBAL_CONFIG_FILE,
  GLOBAL_MANIFEST_FILE,
  STORE_DATABASE_FILE,
  getStoreDatabasePath,
  resolveStoreRoot,
  type ResolveStoreRootOptions,
} from "./paths";
import { resolveProjectIdentity } from "./project-identity";
import { deleteProjectRows, listProjectRegistryEntries } from "./state-rows";

/**
 * Store lifecycle behavior (W18 R10 P4; PRD 38 R-LIFE-1, R-LIFE-2).
 *
 * Two seams live here:
 *
 * - {@link pruneProjectFromStore} — project removal. Deletes exactly one
 *   project's rows, keyed by the manifest-minted project identifier, leaving
 *   every other project's rows untouched (R-LIFE-2). Today's repo-level
 *   `make-docs uninstall` calls it; the W18 R11 CLI reorganization's
 *   `setup remove` surfaces the same function.
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
}

export type PruneProjectFromStoreResult =
  | {
      status: "pruned";
      storeRoot: string;
      projectId: string;
      /** Registry-mirror rows left for other projects after the prune. */
      remainingProjects: number;
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
 * manifest-minted project identifier (R-LIFE-2). All three project-scoped
 * tables are cleared in one transaction via {@link deleteProjectRows}; rows
 * of every other project are untouched. Never creates a store database and
 * never throws.
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
      deleteProjectRows(db, resolvedProjectId);
      return {
        status: "pruned" as const,
        storeRoot,
        projectId: resolvedProjectId,
        remainingProjects: listProjectRegistryEntries(db).length,
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

/** The complete set of files the store ever writes under its root. */
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

  const projectMarkers = entries.filter((entry) =>
    PROJECT_MAKE_DOCS_MARKERS.includes(entry),
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
    result.warnings.push(
      `The store directory ${storeRoot} was kept because it contains entries the store does not own: ` +
        `${result.retainedEntries.join(", ")}.`,
    );
  }

  result.status = "retained";
  return result;
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
