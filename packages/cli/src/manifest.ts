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

  const parsed = JSON.parse(readTextFile(manifestPath)) as InstallManifest & {
    skillFiles?: unknown;
  };
  parsed.skillFiles = migrateSkillFiles(parsed.skillFiles);
  parsed.selections = migrateSelections(parsed.selections, parsed.skillFiles);
  return parsed;
}

export function migrateSelections(
  selections: InstallSelections,
  skillFiles: string[] = [],
): InstallSelections {
  const legacy = selections as InstallSelections & {
    instructionKinds?: Record<string, boolean>;
    optionalSkills?: unknown;
  };
  const migratedOptionalSkills = migrateOptionalSkills(
    legacy.optionalSkills,
    skillFiles,
    legacy.skills ?? true,
  );

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
      optionalSkills: migratedOptionalSkills,
    };
    return migrated;
  }

  return {
    ...legacy,
    skillScope: legacy.skillScope ?? "project",
    optionalSkills: migratedOptionalSkills,
  };
}

export function createManifest(
  packageMeta: PackageMeta,
  profile: InstallProfile,
  files: Record<string, ManifestFileEntry>,
  skillFiles: string[],
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
    skillFiles: Array.from(new Set(skillFiles)).sort(),
  };
}

export function writeManifest(targetDir: string, manifest: InstallManifest): string {
  const manifestPath = getManifestPath(targetDir);
  writeTextFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifestPath;
}

function migrateSkillFiles(skillFiles: unknown): string[] {
  if (Array.isArray(skillFiles)) {
    return skillFiles.filter((value): value is string => typeof value === "string");
  }

  if (isPlainObject(skillFiles)) {
    return Object.keys(skillFiles);
  }

  return [];
}

function migrateOptionalSkills(
  optionalSkills: unknown,
  skillFiles: string[],
  skillsEnabled: boolean,
): string[] {
  if (!skillsEnabled) {
    return [];
  }

  if (Array.isArray(optionalSkills)) {
    return Array.from(
      new Set(optionalSkills.filter((value): value is string => typeof value === "string")),
    ).sort();
  }

  // Preserve existing installs that were created before optional skill selection existed.
  const hasDecomposeCodebase =
    skillFiles.includes(".claude/skills/decompose-codebase/SKILL.md") ||
    skillFiles.includes(".agents/skills/decompose-codebase/SKILL.md") ||
    skillFiles.includes(".claude/skills/decompose-codebase.md") ||
    skillFiles.includes(".agents/skills/decompose-codebase.md");

  return hasDecomposeCodebase ? ["decompose-codebase"] : [];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
