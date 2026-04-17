import { existsSync } from "node:fs";
import path from "node:path";
import type {
  InstallManifest,
  InstallProfile,
  InstallSelections,
  ManifestFileEntry,
  PackageMeta,
} from "./types";
import { readTextFile, writeTextFile } from "./utils";

export const MANIFEST_SCHEMA_VERSION = 1;
export const MANIFEST_RELATIVE_PATH = "docs/.starter-docs/manifest.json";

export function getManifestPath(targetDir: string): string {
  return path.join(targetDir, MANIFEST_RELATIVE_PATH);
}

export function loadManifest(targetDir: string): InstallManifest | null {
  const manifestPath = getManifestPath(targetDir);
  if (!existsSync(manifestPath)) {
    return null;
  }

  const parsed = JSON.parse(readTextFile(manifestPath)) as InstallManifest;
  parsed.selections = migrateSelections(parsed.selections);
  return parsed;
}

export function migrateSelections(selections: InstallSelections): InstallSelections {
  const legacy = selections as InstallSelections & {
    instructionKinds?: Record<string, boolean>;
  };

  if (legacy.instructionKinds && !legacy.harnesses) {
    const ik = legacy.instructionKinds;
    const migrated: InstallSelections = {
      capabilities: legacy.capabilities,
      prompts: legacy.prompts,
      templatesMode: legacy.templatesMode,
      referencesMode: legacy.referencesMode,
      harnesses: {
        "claude-code": ik["CLAUDE.md"] ?? false,
        codex: ik["AGENTS.md"] ?? false,
      },
      skills: legacy.skills ?? true,
      skillScope: legacy.skillScope ?? "project",
    };
    return migrated;
  }

  return {
    ...legacy,
    skillScope: legacy.skillScope ?? "project",
  };
}

export function createManifest(
  packageMeta: PackageMeta,
  profile: InstallProfile,
  files: Record<string, ManifestFileEntry>,
): InstallManifest {
  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    packageName: packageMeta.name,
    packageVersion: packageMeta.version,
    updatedAt: new Date().toISOString(),
    profileId: profile.profileId,
    selections: profile.selections,
    effectiveCapabilities: profile.effectiveCapabilities,
    files,
  };
}

export function writeManifest(targetDir: string, manifest: InstallManifest): string {
  const manifestPath = getManifestPath(targetDir);
  writeTextFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifestPath;
}
