import { readDeclarativeProjectId } from "./installation-state";
import { existsSync } from "node:fs";
import path from "node:path";
import { getManifestPath, loadManifest } from "../manifest";

/** Read the portable declarative identity without creating or changing project state.
 * Installation ownership is separate and belongs to the Store checkout binding.
 */
export type ProjectIdentityResolution =
  | {
      status: "resolved";
      /** Stable project identifier from declarative config. */
      projectId: string;
      /** Resolved repo root — secondary lookup/display metadata, never identity. */
      rootPath: string;
      manifestPath: string;
    }
  | { status: "unminted"; rootPath: string; manifestPath: string }
  | { status: "no-manifest"; rootPath: string; manifestPath: string }
  | { status: "unreadable"; rootPath: string; manifestPath: string; reason: string };

export function resolveProjectIdentity(repoRoot: string): ProjectIdentityResolution {
  const rootPath = path.resolve(repoRoot);
  const manifestPath = getManifestPath(rootPath);


  try {
    const projectId = readDeclarativeProjectId(rootPath);
    if (projectId) return { status: "resolved", projectId, rootPath, manifestPath: path.join(rootPath, ".make-docs/config.yaml") };
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
