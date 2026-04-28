import os from "node:os";
import { existsSync } from "node:fs";
import path from "node:path";
import type {
  AuditPathKind,
  AuditPathMetadata,
  Capability,
  InstallManifest,
  InstallProfile,
  InstallSelections,
  ManifestAuditContext,
  ManifestAuditRecord,
  ManifestFileEntry,
  PackageMeta,
} from "./types";
import { CAPABILITIES, HARNESSES } from "./types";
import { normalizeRelativePath, readTextFile, writeTextFile } from "./utils";

export const MANIFEST_SCHEMA_VERSION = 1;
export const MAKE_DOCS_STATE_RELATIVE_DIR = ".make-docs";
export const MANIFEST_RELATIVE_PATH = `${MAKE_DOCS_STATE_RELATIVE_DIR}/manifest.json`;
export const CONFLICTS_RELATIVE_DIR = `${MAKE_DOCS_STATE_RELATIVE_DIR}/conflicts`;

export function getManifestPath(targetDir: string): string {
  return path.join(targetDir, MANIFEST_RELATIVE_PATH);
}

export function loadManifest(targetDir: string): InstallManifest | null {
  const manifestPath = getManifestPath(targetDir);
  if (!existsSync(manifestPath)) {
    return null;
  }

  const parsed = JSON.parse(readTextFile(manifestPath)) as unknown;
  return validateAndMigrateManifest(parsed, manifestPath);
}

export function migrateSelections(
  selections: unknown,
  skillFiles: string[] = [],
): InstallSelections {
  assertPlainObject(selections, "selections");
  assertNoRemovedAssetFields(selections, "selections");

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
    assertPlainObject(legacy.instructionKinds, "selections.instructionKinds");
    const ik = legacy.instructionKinds;
    const migrated: InstallSelections = {
      capabilities: validateCapabilities(legacy.capabilities),
      harnesses: {
        "claude-code": validateBoolean(
          ik["CLAUDE.md"] ?? false,
          "selections.instructionKinds.CLAUDE.md",
        ),
        codex: validateBoolean(ik["AGENTS.md"] ?? false, "selections.instructionKinds.AGENTS.md"),
      },
      skills:
        legacy.skills === undefined ? true : validateBoolean(legacy.skills, "selections.skills"),
      skillScope: validateSkillScope(legacy.skillScope ?? "project"),
      optionalSkills: migratedOptionalSkills,
    };
    return migrated;
  }

  return {
    capabilities: validateCapabilities(legacy.capabilities),
    harnesses: validateHarnesses(legacy.harnesses),
    skills: validateBoolean(legacy.skills, "selections.skills"),
    skillScope: validateSkillScope(legacy.skillScope ?? "project"),
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

function validateAndMigrateManifest(value: unknown, manifestPath: string): InstallManifest {
  try {
    assertPlainObject(value, "manifest");
    assertNoRemovedAssetFields(value, "manifest");

    if (!("skillFiles" in value)) {
      throw new Error("manifest.skillFiles is required");
    }

    const skillFiles = migrateSkillFiles(value.skillFiles);
    const selections = migrateSelections(value.selections, skillFiles);
    const files = validateManifestFiles(value.files);

    const schemaVersion = validateNumber(value.schemaVersion, "manifest.schemaVersion");
    if (schemaVersion !== MANIFEST_SCHEMA_VERSION) {
      throw new Error(`manifest.schemaVersion must be ${MANIFEST_SCHEMA_VERSION}`);
    }

    return {
      schemaVersion,
      packageName: validateString(value.packageName, "manifest.packageName"),
      packageVersion: validateString(value.packageVersion, "manifest.packageVersion"),
      updatedAt: validateString(value.updatedAt, "manifest.updatedAt"),
      profileId: validateString(value.profileId, "manifest.profileId"),
      selections,
      effectiveCapabilities: validateEffectiveCapabilities(value.effectiveCapabilities),
      files,
      skillFiles,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "invalid manifest shape";
    throw new Error(
      `Stale or malformed make-docs manifest at ${manifestPath}: ${reason}. Fix or remove the stale manifest and rerun bare \`make-docs\` to rebuild it.`,
    );
  }
}

function assertNoRemovedAssetFields(value: Record<string, unknown>, label: string): void {
  for (const field of ["prompts", "templatesMode", "referencesMode"]) {
    if (field in value) {
      throw new Error(`${label}.${field} is no longer supported`);
    }
  }
}

function validateCapabilities(value: unknown): Record<Capability, boolean> {
  assertPlainObject(value, "selections.capabilities");
  const capabilities = {} as Record<Capability, boolean>;

  for (const capability of CAPABILITIES) {
    capabilities[capability] = validateBoolean(
      value[capability],
      `selections.capabilities.${capability}`,
    );
  }

  return capabilities;
}

function validateHarnesses(value: unknown): InstallSelections["harnesses"] {
  assertPlainObject(value, "selections.harnesses");
  const harnesses = {} as InstallSelections["harnesses"];

  for (const harness of HARNESSES) {
    harnesses[harness] = validateBoolean(value[harness], `selections.harnesses.${harness}`);
  }

  return harnesses;
}

function validateSkillScope(value: unknown): InstallSelections["skillScope"] {
  if (value !== "project" && value !== "global") {
    throw new Error("selections.skillScope must be project or global");
  }

  return value;
}

function validateManifestFiles(value: unknown): Record<string, ManifestFileEntry> {
  assertPlainObject(value, "manifest.files");
  const files: Record<string, ManifestFileEntry> = {};

  for (const [managedPath, entry] of Object.entries(value)) {
    assertPlainObject(entry, `manifest.files.${managedPath}`);
    files[managedPath] = {
      hash: validateString(entry.hash, `manifest.files.${managedPath}.hash`),
      sourceId: validateString(entry.sourceId, `manifest.files.${managedPath}.sourceId`),
    };
  }

  return files;
}

function validateEffectiveCapabilities(value: unknown): Capability[] {
  if (!Array.isArray(value)) {
    throw new Error("manifest.effectiveCapabilities must be an array");
  }

  return value.map((capability, index) => {
    if (typeof capability !== "string" || !CAPABILITIES.includes(capability as Capability)) {
      throw new Error(`manifest.effectiveCapabilities.${index} must be a valid capability`);
    }
    return capability as Capability;
  });
}

function validateString(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new Error(`${label} must be a string`);
  }

  return value;
}

function validateNumber(value: unknown, label: string): number {
  if (typeof value !== "number") {
    throw new Error(`${label} must be a number`);
  }

  return value;
}

function validateBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
  }

  return value;
}

function assertPlainObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!isPlainObject(value)) {
    throw new Error(`${label} must be an object`);
  }
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
