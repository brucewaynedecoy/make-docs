import { loadManifest } from "../manifest";
import type { InstallManifest } from "../types";
import type { StoreDatabase } from "./database";
import { getStoreDatabasePath, resolveStoreRoot } from "./paths";
import { resolveProjectIdentity } from "./project-identity";
import { upsertProjectRegistryEntry } from "./state-rows";

/**
 * The legacy `projects` table remains a subordinate discovery index.
 * Current installation authority is the Store installation ledger. Local
 * declarative identity locates the project; it never proves applied ownership.
 * Rebuilding this index cannot recover a missing installation ledger or
 * reinterpret opaque legacy run rows as current installation state.
 */

export interface MirrorProjectResult {
  status: "mirrored" | "skipped";
  projectId: string | null;
  rootPath: string;
  /** Present when `status` is "skipped": why no mirror row was written. */
  reason: string | null;
}

/**
 * Refreshes discovery metadata from declared identity and the Store ledger.
 * Unresolved identity is skipped without minting or inferring ownership.
 */
export function mirrorProjectManifest(
  db: StoreDatabase,
  options: { repoRoot: string; manifest?: InstallManifest | null; now?: string },
): MirrorProjectResult {
  const identity = resolveProjectIdentity(options.repoRoot);
  if (identity.status !== "resolved") {
    return {
      status: "skipped",
      projectId: null,
      rootPath: identity.rootPath,
      reason:
        identity.status === "unminted"
          ? "the project has no stable declaration; run make-docs setup"
          : identity.status === "no-manifest"
            ? "no declarative project identity (run make-docs setup)"
            : `the project identity is unreadable: ${identity.reason}`,
    };
  }

  let manifest = options.manifest ?? null;
  if (!manifest) {
    try {
      manifest = loadManifest(identity.rootPath);
    } catch {
      // Discovery can retain declarative identity when installation state
      // is unavailable; this does not establish applied file ownership.
      manifest = null;
    }
  }

  upsertProjectRegistryEntry(db, {
    projectId: identity.projectId,
    rootPath: identity.rootPath,
    packageName: manifest?.packageName ?? null,
    packageVersion: manifest?.packageVersion ?? null,
    now: options.now,
  });
  return {
    status: "mirrored",
    projectId: identity.projectId,
    rootPath: identity.rootPath,
    reason: null,
  };
}

export interface AuthoritativeInstallRecord {
  source: "store";
  /** Compatibility field: a Store ledger reference, never a local manifest. */
  manifestPath: string;
  manifest: InstallManifest;
}

/** Read the Store installation ledger. A stale discovery row cannot replace it. */
export function readAuthoritativeInstallRecord(
  repoRoot: string,
): AuthoritativeInstallRecord | null {
  try {
    const manifest = loadManifest(repoRoot);
    if (!manifest) {
      return null;
    }
    return {
      source: "store",
      manifestPath: `${getStoreDatabasePath(resolveStoreRoot())}#installation-ledger/${manifest.projectId}`,
      manifest,
    };
  } catch {
    return null;
  }
}

export interface RebuildProjectRegistryResult {
  mirrored: MirrorProjectResult[];
  skipped: MirrorProjectResult[];
}

/**
 * Rebuilds the discovery mirror from Store installation ledgers (R-MIR-1): drops every
 * mirror row and refreshes each supplied project root from its ledger,
 * in one transaction. Because the registry is a mirror, this is lossless —
 * installation metadata comes from preserved Store ledgers. Only discovery rows
 * are dropped; the relocated-canonical project-state rows (run-state and
 * work-execution evidence) are untouched.
 */
export function rebuildProjectRegistry(
  db: StoreDatabase,
  repoRoots: string[],
  options: { now?: string } = {},
): RebuildProjectRegistryResult {
  const mirrored: MirrorProjectResult[] = [];
  const skipped: MirrorProjectResult[] = [];
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("DELETE FROM projects").run();
    for (const repoRoot of repoRoots) {
      const result = mirrorProjectManifest(db, { repoRoot, now: options.now });
      (result.status === "mirrored" ? mirrored : skipped).push(result);
    }
    db.exec("COMMIT");
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // The transaction may already be rolled back.
    }
    throw error;
  }
  return { mirrored, skipped };
}
