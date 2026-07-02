import { getManifestPath, loadManifest } from "../manifest";
import type { InstallManifest } from "../types";
import type { StoreDatabase } from "./database";
import { resolveProjectIdentity } from "./project-identity";
import { upsertProjectRegistryEntry } from "./state-rows";

/**
 * Install and directory registry mirror (W18 R10 P3, Stage 3; PRD 38
 * R-MIR-1, R-MIR-2).
 *
 * The `projects` table is a MIRROR and index for cross-project queries and
 * quick access. Its canonical source is always each project's
 * `.make-docs/manifest.json`:
 *
 * - The mirror is populated/refreshed FROM manifests (`mirrorProjectManifest`,
 *   invoked by the CLI apply flow at the same seam as the store bootstrap).
 * - Authoritative reads of a project's install record resolve to the
 *   project's manifest, never to the registry
 *   (`readAuthoritativeInstallRecord`).
 * - A stale or deleted registry is rebuildable from manifests without data
 *   loss (`rebuildProjectRegistry`); it is never a second source of truth.
 *
 * This is the `mirror` side of the mirror-versus-relocated distinction
 * encoded in `PROJECT_STATE_TABLE_ROLES` (`project-state.ts`); the
 * project-state facets are `relocated-canonical` with no in-repo copy.
 * Registry paths are local-only data (R-PRIV-1).
 */

export interface MirrorProjectResult {
  status: "mirrored" | "skipped";
  projectId: string | null;
  rootPath: string;
  /** Present when `status` is "skipped": why no mirror row was written. */
  reason: string | null;
}

/**
 * Inserts or refreshes the mirror row for one project from its manifest.
 * Skips (never errors, never invents identity) when the project has no
 * manifest, an unminted manifest, or an unreadable manifest — the mirror can
 * only reflect what the canonical source states.
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
          ? "the manifest predates the stable project identifier; run make-docs to mint it"
          : identity.status === "no-manifest"
            ? "no .make-docs/manifest.json (not a Make Docs install)"
            : `the manifest is unreadable: ${identity.reason}`,
    };
  }

  let manifest = options.manifest ?? null;
  if (!manifest) {
    try {
      manifest = loadManifest(identity.rootPath);
    } catch {
      // The identity resolved, so the manifest was readable a moment ago;
      // mirror the identity with package metadata omitted rather than fail.
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
  manifestPath: string;
  manifest: InstallManifest;
}

/**
 * The authoritative read of a project's install record (R-MIR-1): always the
 * project's `.make-docs/manifest.json`, loaded fresh from the repository.
 * The registry is deliberately not consulted here — mirror rows may be stale
 * and must never override the manifest. Returns null when the project has no
 * loadable manifest (in which case there IS no install record, whatever the
 * registry claims).
 */
export function readAuthoritativeInstallRecord(
  repoRoot: string,
): AuthoritativeInstallRecord | null {
  try {
    const manifest = loadManifest(repoRoot);
    if (!manifest) {
      return null;
    }
    return { manifestPath: getManifestPath(repoRoot), manifest };
  } catch {
    return null;
  }
}

export interface RebuildProjectRegistryResult {
  mirrored: MirrorProjectResult[];
  skipped: MirrorProjectResult[];
}

/**
 * Rebuilds the registry mirror from project manifests (R-MIR-1): drops every
 * mirror row and re-mirrors each supplied project root from its manifest,
 * in one transaction. Because the registry is a mirror, this is lossless —
 * every fact it holds is re-derivable from the manifests. Only registry rows
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
