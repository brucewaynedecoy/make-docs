import { platform } from "../platform";
import type { StoreDatabase } from "./database";

/**
 * Path matching for Store rows that name a checkout folder (W32 R0 P3).
 *
 * A commit no longer respells `installation_checkouts.root_path` (W32 R0 P2
 * T7), so a folder renamed only by letter case keeps its old spelling in the
 * Store. A query that compares `root_path` exactly can then miss its own
 * checkout's work or lock. These helpers compare with the platform comparison
 * key, as checkout lookup does.
 *
 * A match is `same` (the platform keys agree), `different`, or `unknown` (a
 * path could not be resolved, and a lower-case comparison says the paths may
 * name one folder). A caller that blocks work treats `unknown` as the same
 * folder, so doubt stops work. A caller that removes a row acts only on
 * `same`: recovery deletes a dead lock only when its path matches by the
 * platform key, and refuses on `unknown`.
 */
export type RootPathMatch = "same" | "different" | "unknown";

export function compareStoredRoot(stored: string, root: string, storedKey?: string | null): RootPathMatch {
  if (stored === root) return "same";
  let rootKey: string;
  try {
    rootKey = platform.comparisonKey(root);
  } catch {
    return looseMatch(stored, root);
  }
  if (storedKey !== undefined && storedKey !== null && storedKey === rootKey) return "same";
  try {
    return platform.comparisonKey(stored) === rootKey ? "same" : "different";
  } catch {
    return looseMatch(stored, root);
  }
}

/** True when the stored path names the folder `root` or may name it. Use it only to block work. */
export function storedRootMatches(stored: string, root: string, storedKey?: string | null): boolean {
  return compareStoredRoot(stored, root, storedKey) !== "different";
}

/** A comparison that matches more paths than the platform key, never fewer. */
function looseMatch(stored: string, root: string): RootPathMatch {
  return stored.toLocaleLowerCase("en-US") === root.toLocaleLowerCase("en-US") ? "unknown" : "different";
}

export interface InstallationLockRow {
  root_path: string;
  token: string;
  pid: number;
  hostname: string;
  /** How the lock path matched: `same` by the platform key, or `unknown` on doubt. */
  match: Exclude<RootPathMatch, "different">;
}

/** Every `installation_locks` row that names the folder `root`, in any spelling, or may name it. */
export function findInstallationLocks(db: StoreDatabase, root: string): InstallationLockRow[] {
  const rows = db.prepare("SELECT root_path,token,pid,hostname FROM installation_locks ORDER BY root_path").all() as unknown as Array<Omit<InstallationLockRow, "match">>;
  return rows.flatMap((row) => {
    const match = compareStoredRoot(row.root_path, root);
    return match === "different" ? [] : [{ ...row, match }];
  });
}
