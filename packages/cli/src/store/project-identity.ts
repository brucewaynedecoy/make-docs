import { existsSync } from "node:fs";
import path from "node:path";
import { getManifestPath, loadManifest } from "../manifest";

/**
 * Project-identity resolution seam (W18 R10 P2; PRD 38 R-ID-1, R-ID-2).
 *
 * This is the ONLY supported way to obtain the `project_id` that keys a
 * repository's project-scoped rows in the store: read the manifest-minted
 * identifier from the project's `.make-docs/manifest.json`. Identity is never
 * derived from the directory path, git remote, or environment — the resolved
 * `rootPath` is returned as secondary lookup/display metadata only and must
 * never be used as a row key.
 *
 * Consumers: the W18 R7 Playbook runner's run-state storage and the W18 R11
 * retained work operations (the work-execution evidence record/read pair)
 * resolve identity through this seam before touching `state-rows.ts`.
 *
 * Every non-`resolved` outcome is explicit so callers handle it deliberately
 * rather than falling back to path-keyed state:
 * - `no-manifest`: the directory is not a Make Docs install; there is no
 *   identity and no project-scoped state to attribute.
 * - `unminted`: a valid pre-identifier manifest (written before W18 R10).
 *   Never an error — the caller reports that running `make-docs` will mint
 *   the identifier, and records nothing until then.
 * - `unreadable`: the manifest exists but cannot be parsed; the existing
 *   manifest-repair guidance applies (PRD 05 lifecycle behavior is owned by
 *   the manifest module, not re-derived here).
 */
export type ProjectIdentityResolution =
  | {
      status: "resolved";
      /** The manifest-minted stable project identifier (the store row key). */
      projectId: string;
      /** Resolved repo root — secondary lookup/display metadata, never identity. */
      rootPath: string;
      manifestPath: string;
    }
  | { status: "unminted"; rootPath: string; manifestPath: string }
  | { status: "no-manifest"; rootPath: string; manifestPath: string }
  | { status: "unreadable"; rootPath: string; manifestPath: string; reason: string };

/**
 * Resolves a repository's stable project identity from its
 * `.make-docs/manifest.json`. Pure read: never mints, never rewrites the
 * manifest, and never touches the store database.
 */
export function resolveProjectIdentity(repoRoot: string): ProjectIdentityResolution {
  const rootPath = path.resolve(repoRoot);
  const manifestPath = getManifestPath(rootPath);

  if (!existsSync(manifestPath)) {
    return { status: "no-manifest", rootPath, manifestPath };
  }

  try {
    const manifest = loadManifest(rootPath);
    if (!manifest) {
      return { status: "no-manifest", rootPath, manifestPath };
    }
    if (!manifest.projectId) {
      return { status: "unminted", rootPath, manifestPath };
    }
    return { status: "resolved", projectId: manifest.projectId, rootPath, manifestPath };
  } catch (error) {
    return {
      status: "unreadable",
      rootPath,
      manifestPath,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
