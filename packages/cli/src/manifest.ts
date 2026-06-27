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
  InstructionKind,
  ManifestAuditContext,
  ManifestAuditRecord,
  ManifestFileEntry,
  ManifestHashAlgorithm,
  SkillManifestSelectionSource,
  SkillSelectionProvenanceEntry,
  ManifestSystemAssetEntry,
  PackageMeta,
  SystemAssetManifestState,
  SystemAssetMaterializationClass,
  SystemAssetMaterializationMode,
  SystemAssetOfflineExpectation,
  SystemAssetSelectionTrigger,
} from "./types";
import { classifyAgenticSkillFileRole } from "./agentic-skill-roles";
import {
  CAPABILITIES,
  HARNESSES,
  INSTRUCTION_KINDS,
  SYSTEM_ASSET_MATERIALIZATION_CLASSES,
  SYSTEM_ASSET_MATERIALIZATION_MODES,
} from "./types";
import { parseManagedBlock } from "./managed-block";
import { createEmptySystemAssetManifestState } from "./system-assets";
import {
  TOOL_DIRECTORY_CONFLICTS_RELATIVE_DIR,
  TOOL_DIRECTORY_MANIFEST_RELATIVE_PATH,
  TOOL_DIRECTORY_RELATIVE_PATH,
} from "./tool-directory";
import { hashText, normalizeRelativePath, readTextFile, writeTextFile } from "./utils";

export const MANIFEST_SCHEMA_VERSION = 2;
export const MAKE_DOCS_STATE_RELATIVE_DIR = TOOL_DIRECTORY_RELATIVE_PATH;
export const MANIFEST_RELATIVE_PATH = TOOL_DIRECTORY_MANIFEST_RELATIVE_PATH;
export const CONFLICTS_RELATIVE_DIR = TOOL_DIRECTORY_CONFLICTS_RELATIVE_DIR;

export function getManifestPath(targetDir: string): string {
  return path.join(targetDir, MANIFEST_RELATIVE_PATH);
}

export function getManifestFileHash(relativePath: string, content: string): string | null {
  if (!isInstructionManifestPath(relativePath)) {
    return hashText(content);
  }

  const parsed = parseManagedBlock(content);
  return parsed.state === "valid" ? hashText(parsed.body) : null;
}

export function loadManifest(targetDir: string): InstallManifest | null {
  const manifestPath = getManifestPath(targetDir);
  if (!existsSync(manifestPath)) {
    return null;
  }

  const parsed = JSON.parse(readTextFile(manifestPath)) as unknown;
  return validateAndMigrateManifest(parsed, manifestPath);
}

export function migrateSelections(selections: unknown): InstallSelections {
  assertPlainObject(selections, "selections");
  assertNoRemovedAssetFields(selections, "selections");

  const legacy = selections as InstallSelections & {
    instructionKinds?: Record<string, boolean>;
    optionalSkills?: unknown;
    selectedSkills?: unknown;
  };
  if ("optionalSkills" in legacy) {
    throw new Error("selections.optionalSkills is no longer supported");
  }
  const selectedSkills = validateSelectedSkills(legacy.selectedSkills);
  const skillManifest =
    "skillManifest" in legacy && legacy.skillManifest !== undefined
      ? validateSkillManifestSelectionSource(legacy.skillManifest)
      : undefined;
  const skillSelectionProvenance =
    "skillSelectionProvenance" in legacy &&
    legacy.skillSelectionProvenance !== undefined
      ? validateSkillSelectionProvenance(legacy.skillSelectionProvenance)
      : undefined;

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
        codex: validateBoolean(
          ik["AGENTS.md"] ?? false,
          "selections.instructionKinds.AGENTS.md",
        ),
      },
      skills:
        legacy.skills === undefined
          ? false
          : validateBoolean(legacy.skills, "selections.skills"),
      skillScope: validateSkillScope(legacy.skillScope ?? "project"),
      selectedSkills,
      ...(skillManifest === undefined ? {} : { skillManifest }),
      ...(skillSelectionProvenance === undefined
        ? {}
        : { skillSelectionProvenance }),
    };
    return migrated;
  }

  return {
    capabilities: validateCapabilities(legacy.capabilities),
    harnesses: validateHarnesses(legacy.harnesses),
    skills: validateBoolean(legacy.skills, "selections.skills"),
    skillScope: validateSkillScope(legacy.skillScope ?? "project"),
    selectedSkills,
    ...(skillManifest === undefined ? {} : { skillManifest }),
    ...(skillSelectionProvenance === undefined
      ? {}
      : { skillSelectionProvenance }),
  };
}

export function createManifest(
  packageMeta: PackageMeta,
  profile: InstallProfile,
  files: Record<string, ManifestFileEntry>,
  skillFiles: string[],
  systemAssetMaterialization: SystemAssetManifestState,
): InstallManifest {
  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    packageName: packageMeta.name,
    packageVersion: packageMeta.version,
    updatedAt: new Date().toISOString(),
    profileId: profile.profileId,
    selections: profile.selections,
    effectiveCapabilities: profile.effectiveCapabilities,
    systemAssetMaterialization,
    files,
    skillFiles: Array.from(new Set(skillFiles)).sort(),
  };
}

export function writeManifest(
  targetDir: string,
  manifest: InstallManifest,
): string {
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
      createManifestAuditRecord(
        targetDir,
        homeDir,
        managedPath,
        "manifest-file",
        entry,
      ),
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
  const projectRelativePath = getContainedRelativePath(
    normalizedTargetDir,
    absolutePath,
  );
  const homeRelativePath = getContainedRelativePath(
    normalizedHomeDir,
    absolutePath,
  );

  const pathScope =
    projectRelativePath !== null
      ? "project"
      : homeRelativePath !== null
        ? "home"
        : "external";
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
    displayPath === "."
      ? 0
      : displayPath.split("/").filter((segment) => segment.length > 0).length;
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
    return skillFiles.filter(
      (value): value is string => typeof value === "string",
    );
  }

  if (isPlainObject(skillFiles)) {
    return Object.keys(skillFiles);
  }

  return [];
}

function validateAndMigrateManifest(
  value: unknown,
  manifestPath: string,
): InstallManifest {
  try {
    assertPlainObject(value, "manifest");
    assertNoRemovedAssetFields(value, "manifest");

    if (!("skillFiles" in value)) {
      throw new Error("manifest.skillFiles is required");
    }

    const skillFiles = migrateSkillFiles(value.skillFiles);
    const selections = migrateSelections(value.selections);
    const files = validateManifestFiles(value.files);

    const schemaVersion = validateNumber(
      value.schemaVersion,
      "manifest.schemaVersion",
    );
    if (schemaVersion !== 1 && schemaVersion !== MANIFEST_SCHEMA_VERSION) {
      throw new Error(
        `manifest.schemaVersion must be 1 or ${MANIFEST_SCHEMA_VERSION}`,
      );
    }
    const systemAssetMaterialization =
      "systemAssetMaterialization" in value
        ? validateSystemAssetManifestState(value.systemAssetMaterialization)
        : createEmptySystemAssetManifestState();

    return {
      schemaVersion: MANIFEST_SCHEMA_VERSION,
      packageName: validateString(value.packageName, "manifest.packageName"),
      packageVersion: validateString(
        value.packageVersion,
        "manifest.packageVersion",
      ),
      updatedAt: validateString(value.updatedAt, "manifest.updatedAt"),
      profileId: validateString(value.profileId, "manifest.profileId"),
      selections,
      effectiveCapabilities: validateEffectiveCapabilities(
        value.effectiveCapabilities,
      ),
      systemAssetMaterialization,
      files,
      skillFiles,
    };
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "invalid manifest shape";
    throw new Error(
      `Stale or malformed make-docs manifest at ${manifestPath}: ${reason}. Fix or remove the stale manifest and rerun bare \`make-docs\` to rebuild it.`,
    );
  }
}

function assertNoRemovedAssetFields(
  value: Record<string, unknown>,
  label: string,
): void {
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
    harnesses[harness] = validateBoolean(
      value[harness],
      `selections.harnesses.${harness}`,
    );
  }

  return harnesses;
}

function validateSkillScope(value: unknown): InstallSelections["skillScope"] {
  if (value !== "project" && value !== "global") {
    throw new Error("selections.skillScope must be project or global");
  }

  return value;
}

function validateManifestFiles(
  value: unknown,
): Record<string, ManifestFileEntry> {
  assertPlainObject(value, "manifest.files");
  const files: Record<string, ManifestFileEntry> = {};

  for (const [managedPath, entry] of Object.entries(value)) {
    assertPlainObject(entry, `manifest.files.${managedPath}`);
    files[managedPath] = {
      hash: validateString(entry.hash, `manifest.files.${managedPath}.hash`),
      sourceId: validateString(
        entry.sourceId,
        `manifest.files.${managedPath}.sourceId`,
      ),
      ...("systemAsset" in entry
        ? {
            systemAsset: validateManifestSystemAssetEntry(
              entry.systemAsset,
              `manifest.files.${managedPath}.systemAsset`,
            ),
          }
        : {}),
    };
  }

  return files;
}

function validateSystemAssetManifestState(value: unknown): SystemAssetManifestState {
  assertPlainObject(value, "manifest.systemAssetMaterialization");
  const mode = validateSystemAssetMaterializationMode(
    value.mode,
    "manifest.systemAssetMaterialization.mode",
  );
  const localBootstrapPaths = validateStringArray(
    value.localBootstrapPaths,
    "manifest.systemAssetMaterialization.localBootstrapPaths",
  );
  const deferredSystemAssetPaths = validateStringArray(
    value.deferredSystemAssetPaths,
    "manifest.systemAssetMaterialization.deferredSystemAssetPaths",
  );
  const materializationClasses = validateMaterializationClasses(
    value.materializationClasses,
  );
  const assets = validateSystemAssetEntries(value.assets);

  return {
    mode,
    ...("sourcePackage" in value
      ? {
          sourcePackage: validateString(
            value.sourcePackage,
            "manifest.systemAssetMaterialization.sourcePackage",
          ),
        }
      : {}),
    ...("sourceProvider" in value
      ? {
          sourceProvider: validateString(
            value.sourceProvider,
            "manifest.systemAssetMaterialization.sourceProvider",
          ),
        }
      : {}),
    ...("sourceVersion" in value
      ? {
          sourceVersion: validateString(
            value.sourceVersion,
            "manifest.systemAssetMaterialization.sourceVersion",
          ),
        }
      : {}),
    ...("sourceImmutableRef" in value
      ? {
          sourceImmutableRef: validateString(
            value.sourceImmutableRef,
            "manifest.systemAssetMaterialization.sourceImmutableRef",
          ),
        }
      : {}),
    ...("hashAlgorithm" in value
      ? {
          hashAlgorithm: validateHashAlgorithm(
            value.hashAlgorithm,
            "manifest.systemAssetMaterialization.hashAlgorithm",
          ),
        }
      : {}),
    localBootstrapPaths,
    deferredSystemAssetPaths,
    materializationClasses,
    recoveryGuidance: validateString(
      value.recoveryGuidance,
      "manifest.systemAssetMaterialization.recoveryGuidance",
    ),
    assets,
  };
}

function validateSystemAssetEntries(
  value: unknown,
): Record<string, ManifestSystemAssetEntry> {
  assertPlainObject(value, "manifest.systemAssetMaterialization.assets");
  const assets: Record<string, ManifestSystemAssetEntry> = {};

  for (const [logicalAssetId, entry] of Object.entries(value)) {
    assets[logicalAssetId] = validateManifestSystemAssetEntry(
      entry,
      `manifest.systemAssetMaterialization.assets.${logicalAssetId}`,
    );
  }

  return assets;
}

function validateManifestSystemAssetEntry(
  value: unknown,
  label: string,
): ManifestSystemAssetEntry {
  assertPlainObject(value, label);
  const materializationMode = validateSystemAssetMaterializationMode(
    value.materializationMode,
    `${label}.materializationMode`,
  );
  const hashAlgorithm = validateHashAlgorithm(value.hashAlgorithm, `${label}.hashAlgorithm`);
  const expectedHashes = validateStringArray(value.expectedHashes, `${label}.expectedHashes`);
  const materializationClass = validateMaterializationClass(
    value.materializationClass,
    `${label}.materializationClass`,
  );
  const offlineExpectation = validateOfflineExpectation(
    value.offlineExpectation,
    `${label}.offlineExpectation`,
  );
  const selectionTrigger = validateSelectionTrigger(
    value.selectionTrigger,
    `${label}.selectionTrigger`,
  );

  return {
    materializationMode,
    ...("sourcePackage" in value
      ? { sourcePackage: validateString(value.sourcePackage, `${label}.sourcePackage`) }
      : {}),
    ...("sourceProvider" in value
      ? { sourceProvider: validateString(value.sourceProvider, `${label}.sourceProvider`) }
      : {}),
    ...("sourceVersion" in value
      ? { sourceVersion: validateString(value.sourceVersion, `${label}.sourceVersion`) }
      : {}),
    ...("sourceImmutableRef" in value
      ? {
          sourceImmutableRef: validateString(
            value.sourceImmutableRef,
            `${label}.sourceImmutableRef`,
          ),
        }
      : {}),
    hashAlgorithm,
    expectedHashes,
    logicalAssetId: validateString(value.logicalAssetId, `${label}.logicalAssetId`),
    ...("localPath" in value
      ? { localPath: validateString(value.localPath, `${label}.localPath`) }
      : {}),
    materializationClass,
    offlineExpectation,
    recoveryGuidance: validateString(value.recoveryGuidance, `${label}.recoveryGuidance`),
    selectionTrigger,
  };
}

function validateMaterializationClasses(
  value: unknown,
): Record<string, SystemAssetMaterializationClass> {
  assertPlainObject(value, "manifest.systemAssetMaterialization.materializationClasses");
  const classes: Record<string, SystemAssetMaterializationClass> = {};

  for (const [logicalAssetId, materializationClass] of Object.entries(value)) {
    classes[logicalAssetId] = validateMaterializationClass(
      materializationClass,
      `manifest.systemAssetMaterialization.materializationClasses.${logicalAssetId}`,
    );
  }

  return classes;
}

function validateEffectiveCapabilities(value: unknown): Capability[] {
  if (!Array.isArray(value)) {
    throw new Error("manifest.effectiveCapabilities must be an array");
  }

  return value.map((capability, index) => {
    if (
      typeof capability !== "string" ||
      !CAPABILITIES.includes(capability as Capability)
    ) {
      throw new Error(
        `manifest.effectiveCapabilities.${index} must be a valid capability`,
      );
    }
    return capability as Capability;
  });
}

function validateSystemAssetMaterializationMode(
  value: unknown,
  label: string,
): SystemAssetMaterializationMode {
  if (
    typeof value !== "string" ||
    !SYSTEM_ASSET_MATERIALIZATION_MODES.includes(
      value as SystemAssetMaterializationMode,
    )
  ) {
    throw new Error(`${label} must be a valid system asset materialization mode`);
  }

  return value as SystemAssetMaterializationMode;
}

function validateMaterializationClass(
  value: unknown,
  label: string,
): SystemAssetMaterializationClass {
  if (
    typeof value !== "string" ||
    !SYSTEM_ASSET_MATERIALIZATION_CLASSES.includes(
      value as SystemAssetMaterializationClass,
    )
  ) {
    throw new Error(`${label} must be a valid system asset materialization class`);
  }

  return value as SystemAssetMaterializationClass;
}

function validateHashAlgorithm(value: unknown, label: string): ManifestHashAlgorithm {
  if (value !== "sha256") {
    throw new Error(`${label} must be sha256`);
  }

  return value;
}

function validateOfflineExpectation(
  value: unknown,
  label: string,
): SystemAssetOfflineExpectation {
  if (
    value !== "local" &&
    value !== "cache-or-provider" &&
    value !== "reviewed-full-snapshot-fallback"
  ) {
    throw new Error(`${label} must be a valid offline expectation`);
  }

  return value;
}

function validateSelectionTrigger(
  value: unknown,
  label: string,
): SystemAssetSelectionTrigger {
  if (
    value !== "local-bootstrap" &&
    value !== "profile-selection" &&
    value !== "internal-materialization-mode"
  ) {
    throw new Error(`${label} must be a valid selection trigger`);
  }

  return value;
}

function validateStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }

  return value.map((item, index) => validateString(item, `${label}.${index}`));
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

function assertPlainObject(
  value: unknown,
  label: string,
): asserts value is Record<string, unknown> {
  if (!isPlainObject(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function validateSelectedSkills(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new Error("selections.selectedSkills must be an array");
  }

  return Array.from(
    new Set(
      value.map((skill, index) =>
        validateString(skill, `selections.selectedSkills.${index}`),
      ),
    ),
  ).sort();
}

function validateSkillManifestSelectionSource(
  value: unknown,
): SkillManifestSelectionSource {
  assertPlainObject(value, "selections.skillManifest");
  const source = validateString(value.source, "selections.skillManifest.source");
  if (
    source !== "built-in" &&
    source !== "file" &&
    source !== "remote-pinned"
  ) {
    throw new Error(
      "selections.skillManifest.source must be built-in, file, or remote-pinned",
    );
  }

  const sourcePolicyKind = validateString(
    value.sourcePolicyKind,
    "selections.skillManifest.sourcePolicyKind",
  );
  if (
    sourcePolicyKind !== "first-party" &&
    sourcePolicyKind !== "local" &&
    sourcePolicyKind !== "remote-pinned"
  ) {
    throw new Error(
      "selections.skillManifest.sourcePolicyKind must be first-party, local, or remote-pinned",
    );
  }

  return {
    manifestId: validateString(
      value.manifestId,
      "selections.skillManifest.manifestId",
    ),
    displayName: validateString(
      value.displayName,
      "selections.skillManifest.displayName",
    ),
    sourcePolicyKind,
    source,
    ...("path" in value
      ? { path: validateString(value.path, "selections.skillManifest.path") }
      : {}),
    ...("digest" in value
      ? {
          digest: validateString(
            value.digest,
            "selections.skillManifest.digest",
          ),
        }
      : {}),
  };
}

function validateSkillSelectionProvenance(
  value: unknown,
): SkillSelectionProvenanceEntry[] {
  if (!Array.isArray(value)) {
    throw new Error("selections.skillSelectionProvenance must be an array");
  }

  return value.map((entry, index) => {
    assertPlainObject(entry, `selections.skillSelectionProvenance.${index}`);
    const sourcePolicyKind = validateString(
      entry.sourcePolicyKind,
      `selections.skillSelectionProvenance.${index}.sourcePolicyKind`,
    );
    if (
      sourcePolicyKind !== "first-party" &&
      sourcePolicyKind !== "local" &&
      sourcePolicyKind !== "remote-pinned"
    ) {
      throw new Error(
        `selections.skillSelectionProvenance.${index}.sourcePolicyKind must be first-party, local, or remote-pinned`,
      );
    }

    const provenanceKind = validateString(
      entry.provenanceKind,
      `selections.skillSelectionProvenance.${index}.provenanceKind`,
    );
    if (
      provenanceKind !== "first-party" &&
      provenanceKind !== "local" &&
      provenanceKind !== "remote-pinned" &&
      provenanceKind !== "third-party"
    ) {
      throw new Error(
        `selections.skillSelectionProvenance.${index}.provenanceKind must be first-party, local, remote-pinned, or third-party`,
      );
    }

    const supportedHarnesses = validateStringArray(
      entry.supportedHarnesses,
      `selections.skillSelectionProvenance.${index}.supportedHarnesses`,
    ).map((harness) => {
      if (harness !== "claude-code" && harness !== "codex") {
        throw new Error(
          `selections.skillSelectionProvenance.${index}.supportedHarnesses contains unsupported harness ${harness}`,
        );
      }
      return harness;
    });

    return {
      skillName: validateString(
        entry.skillName,
        `selections.skillSelectionProvenance.${index}.skillName`,
      ),
      displayName: validateString(
        entry.displayName,
        `selections.skillSelectionProvenance.${index}.displayName`,
      ),
      manifestId: validateString(
        entry.manifestId,
        `selections.skillSelectionProvenance.${index}.manifestId`,
      ),
      manifestDisplayName: validateString(
        entry.manifestDisplayName,
        `selections.skillSelectionProvenance.${index}.manifestDisplayName`,
      ),
      sourcePolicyKind,
      purposeIds: validateStringArray(
        entry.purposeIds,
        `selections.skillSelectionProvenance.${index}.purposeIds`,
      ),
      purposeLabels: validateStringArray(
        entry.purposeLabels,
        `selections.skillSelectionProvenance.${index}.purposeLabels`,
      ),
      supportedHarnesses,
      skillSource: validateString(
        entry.skillSource,
        `selections.skillSelectionProvenance.${index}.skillSource`,
      ),
      provenanceKind,
      provenanceLabel: validateString(
        entry.provenanceLabel,
        `selections.skillSelectionProvenance.${index}.provenanceLabel`,
      ),
      ...("repository" in entry
        ? {
            repository: validateString(
              entry.repository,
              `selections.skillSelectionProvenance.${index}.repository`,
            ),
          }
        : {}),
      ...("ref" in entry
        ? {
            ref: validateString(
              entry.ref,
              `selections.skillSelectionProvenance.${index}.ref`,
            ),
          }
        : {}),
      ...("digest" in entry
        ? {
            digest: validateString(
              entry.digest,
              `selections.skillSelectionProvenance.${index}.digest`,
            ),
          }
        : {}),
    };
  });
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
  const agenticRole = classifyAgenticSkillFileRole({
    relativePath: managedPath,
    sourceId: manifestEntry?.sourceId,
  });

  return {
    ...createAuditPathMetadata(targetDir, managedPath, "file", homeDir),
    ownershipSource,
    sourceId: manifestEntry?.sourceId,
    manifestHash: manifestEntry?.hash,
    ...(agenticRole ? { agenticRole } : {}),
  };
}

function compareAuditRecords(
  left: ManifestAuditRecord,
  right: ManifestAuditRecord,
): number {
  return left.ordering.sortKey.localeCompare(right.ordering.sortKey);
}

function isInstructionManifestPath(relativePath: string): boolean {
  const basename = path.posix.basename(normalizeRelativePath(relativePath));
  return INSTRUCTION_KINDS.includes(basename as InstructionKind);
}

function getContainedRelativePath(
  root: string,
  candidate: string,
): string | null {
  const relative = path.relative(root, candidate);
  if (relative === "") {
    return ".";
  }

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }

  return relative;
}
