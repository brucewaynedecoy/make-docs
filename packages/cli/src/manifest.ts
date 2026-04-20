import os from "node:os";
import { existsSync } from "node:fs";
import path from "node:path";
import type {
  AuditPathKind,
  AuditPathMetadata,
  InstallManifest,
  InstallProfile,
  InstallSelections,
  ManifestAuditContext,
  ManifestAuditRecord,
  ManifestFileEntry,
  PackageMeta,
} from "./types";
import { normalizeRelativePath, readTextFile, writeTextFile } from "./utils";

export const MANIFEST_SCHEMA_VERSION = 1;
export const STARTER_DOCS_STATE_RELATIVE_DIR = "docs/.assets/starter-docs";
export const MANIFEST_RELATIVE_PATH = `${STARTER_DOCS_STATE_RELATIVE_DIR}/manifest.json`;
export const CONFLICTS_RELATIVE_DIR = `${STARTER_DOCS_STATE_RELATIVE_DIR}/conflicts`;

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

export function getManifestAuditContext(
  targetDir: string,
  manifest: InstallManifest,
  homeDir = os.homedir(),
): ManifestAuditContext {
  const managedFiles = Object.entries(manifest.files)
    .map(([managedPath, entry]) =>
      createManifestAuditRecord(targetDir, homeDir, managedPath, "manifest-file", entry),
    )
    .sort(compareAuditRecords);

  const skillFiles = Array.from(new Set(manifest.skillFiles))
    .map((managedPath) =>
      createManifestAuditRecord(
        targetDir,
        homeDir,
        managedPath,
        "manifest-skill-file",
        manifest.files[managedPath],
      ),
    )
    .sort(compareAuditRecords);

  return {
    manifestPath: getManifestPath(targetDir),
    managedFiles,
    skillFiles,
    priorSelections: structuredClone(manifest.selections),
  };
}

export function createAuditPathMetadata(
  targetDir: string,
  auditPath: string,
  kind: AuditPathKind,
  homeDir = os.homedir(),
): AuditPathMetadata {
  const normalizedTargetDir = path.resolve(targetDir);
  const absolutePath = path.isAbsolute(auditPath)
    ? path.normalize(auditPath)
    : path.resolve(normalizedTargetDir, auditPath);
  const normalizedHomeDir = path.resolve(homeDir);
  const projectRelativePath = getContainedRelativePath(normalizedTargetDir, absolutePath);
  const homeRelativePath = getContainedRelativePath(normalizedHomeDir, absolutePath);

  const pathScope =
    projectRelativePath !== null ? "project" : homeRelativePath !== null ? "home" : "external";
  const displayPath =
    pathScope === "project"
      ? normalizeRelativePath(projectRelativePath ?? auditPath)
      : normalizeRelativePath(absolutePath);
  const backupRelativePath =
    pathScope === "project"
      ? normalizeRelativePath(projectRelativePath ?? auditPath)
      : pathScope === "home"
        ? normalizeRelativePath(path.join("_home", homeRelativePath ?? ""))
        : null;
  const depth =
    displayPath === "." ? 0 : displayPath.split("/").filter((segment) => segment.length > 0).length;
  const scopeOrder = pathScope === "project" ? 0 : pathScope === "home" ? 1 : 2;

  return {
    path: displayPath,
    absolutePath,
    kind,
    scope: pathScope,
    pathScope,
    backupRelativePath,
    backup: {
      scope: pathScope === "external" ? null : pathScope,
      relativePath: backupRelativePath,
    },
    ordering: {
      scopeOrder,
      depth,
      sortKey: `${scopeOrder}:${displayPath}`,
      pruneSortKey: `${scopeOrder}:${String(10_000 - depth).padStart(5, "0")}:${displayPath}`,
    },
  };
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

function createManifestAuditRecord(
  targetDir: string,
  homeDir: string,
  managedPath: string,
  ownershipSource: ManifestAuditRecord["ownershipSource"],
  manifestEntry?: ManifestFileEntry,
): ManifestAuditRecord {
  return {
    ...createAuditPathMetadata(targetDir, managedPath, "file", homeDir),
    ownershipSource,
    sourceId: manifestEntry?.sourceId,
    manifestHash: manifestEntry?.hash,
  };
}

function compareAuditRecords(left: ManifestAuditRecord, right: ManifestAuditRecord): number {
  return left.ordering.sortKey.localeCompare(right.ordering.sortKey);
}

function getContainedRelativePath(root: string, candidate: string): string | null {
  const relative = path.relative(root, candidate);
  if (relative === "") {
    return ".";
  }

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }

  return relative;
}
