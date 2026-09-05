import { randomUUID } from "node:crypto";
import os from "node:os";
import { existsSync } from "node:fs";
import path from "node:path";

/** Trusted bytes of the shipped contract retired by W19 R1 P8; never a current resource. */
export const RETIRED_PLAYBOOK_CONTRACT_PATH = ".make-docs/contracts/system/playbook-contract.md";
export const RETIRED_PLAYBOOK_CONTRACT_HASH = "3f7a1e18bedfb129ebba712a035dd08be413059b7402a6b29951417c1902ee11";

export function hasTrustedRetiredPlaybookContractOwnership(
  entry: { hash?: string; sourceId?: string; ownershipClass?: string } | undefined,
): boolean {
  return Boolean(entry && entry.sourceId === `file:${RETIRED_PLAYBOOK_CONTRACT_PATH}` &&
    entry.hash === RETIRED_PLAYBOOK_CONTRACT_HASH &&
    (entry.ownershipClass === undefined || entry.ownershipClass === "managed-snapshot"));
}
import type {
  AgenticExposureMode,
  AgenticFileRole,
  AgenticOwnershipMetadata,
  AgenticPackagingProvenance,
  AgenticPathKind,
  AuditPathKind,
  AuditPathMetadata,
  Capability,
  InstallManifest,
  InstallProfile,
  InstallSelections,
  InstructionKind,
  ManifestAuditContext,
  ManifestAuditRecord,
  ManifestAdoptionReceipt,
  ManifestFileEntry,
  ManifestHashAlgorithm,
  ManifestLifecycleDisposition,
  ManifestOwnershipClass,
  ManifestProvenanceState,
  ManifestProvenanceClaim,
  SkillManifestSelectionSource,
  SkillSelectionProvenanceEntry,
  SkillExposureMetadata,
  ManifestSystemAssetEntry,
  PackageMeta,
  PluginManifestSelectionSource,
  PluginSelectionProvenanceEntry,
  PluginSourceKind,
  PluginSupportStatus,
  PluginTrustPolicy,
  PluginTrustPolicyKind,
  SystemAssetManifestState,
  SystemAssetMaterializationClass,
  SystemAssetMaterializationMode,
  SystemAssetOfflineExpectation,
  SystemAssetSelectionTrigger,
  ProjectResourceType,
  ResourceProjectionManifestState,
  RouterOwnershipManifestState,
} from "./types";
import { classifyAgenticSkillFileRole } from "./agentic-skill-roles";
import {
  CAPABILITIES,
  HARNESSES,
  INSTRUCTION_KINDS,
  SYSTEM_ASSET_MATERIALIZATION_CLASSES,
  SYSTEM_ASSET_MATERIALIZATION_MODES,
  PROJECT_RESOURCE_TYPES,
} from "./types";
import { parseManagedBlock } from "./managed-block";
import { resolveInstallProfile } from "./profile";
import {
  getConfiguredRouterPaths,
  getLegacyAssetsOnDemandRouterPaths,
  getLegacyIncompleteRouterPaths,
  getOnDemandRouterPaths,
} from "./router-paths";
import { createEmptySystemAssetManifestState } from "./system-assets";
import {
  TOOL_DIRECTORY_CONFLICTS_RELATIVE_DIR,
  TOOL_DIRECTORY_MANIFEST_RELATIVE_PATH,
  TOOL_DIRECTORY_RELATIVE_PATH,
} from "./tool-directory";
import {
  assertManagedPathHasNoSymlinks,
  hashText,
  normalizeRelativePath,
  readTextFile,
  writeTextFile,
} from "./utils";

export const MANIFEST_SCHEMA_VERSION = 4;
export const MAKE_DOCS_STATE_RELATIVE_DIR = TOOL_DIRECTORY_RELATIVE_PATH;
export const MANIFEST_RELATIVE_PATH = TOOL_DIRECTORY_MANIFEST_RELATIVE_PATH;
export const CONFLICTS_RELATIVE_DIR = TOOL_DIRECTORY_CONFLICTS_RELATIVE_DIR;

export function getManifestPath(targetDir: string): string {
  return path.join(targetDir, MANIFEST_RELATIVE_PATH);
}

/**
 * Mints a stable project identifier (W18 R10; PRD 38 R-ID-1).
 *
 * D10 implementer decision: a random UUID (v4), minted exactly once at setup
 * and persisted in `.make-docs/manifest.json`. It is deliberately NOT derived
 * from the directory path, git remote, or any environment detail, so it is
 * stable across clones, moves, and worktrees by construction — the identifier
 * travels with the manifest file, and nothing about the machine or location
 * can change it. The full decision record lives in
 * `packages/cli/src/store/README.md` (Project identifier generation).
 *
 * Callers must never invoke this when a manifest already carries a
 * `projectId`; re-minting would orphan the project's global-store rows.
 */
export function mintProjectId(): string {
  return randomUUID();
}

export function getManifestFileHash(relativePath: string, content: string): string | null {
  if (!isInstructionManifestPath(relativePath)) {
    return hashText(content);
  }

  const parsed = parseManagedBlock(content);
  return parsed.state === "valid" && parsed.body !== null
    ? hashText(parsed.body)
    : null;
}

export function loadManifest(targetDir: string): InstallManifest | null {
  assertManagedPathHasNoSymlinks(targetDir, MANIFEST_RELATIVE_PATH);
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

  const legacy = selections;
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
  const plugins =
    legacy.plugins === undefined
      ? false
      : validateBoolean(legacy.plugins, "selections.plugins");
  const pluginScope = validatePluginScope(legacy.pluginScope ?? "project");
  const selectedPlugins = validateSelectedPlugins(legacy.selectedPlugins ?? []);
  const pluginManifest =
    "pluginManifest" in legacy && legacy.pluginManifest !== undefined
      ? validatePluginManifestSelectionSource(legacy.pluginManifest)
      : undefined;
  const pluginSelectionProvenance =
    "pluginSelectionProvenance" in legacy &&
    legacy.pluginSelectionProvenance !== undefined
      ? validatePluginSelectionProvenance(legacy.pluginSelectionProvenance)
      : undefined;
  const resourceProjection =
    "resourceProjection" in legacy && legacy.resourceProjection !== undefined
      ? validateResourceProjectionSelection(legacy.resourceProjection)
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
      plugins,
      pluginScope,
      selectedPlugins,
      ...(pluginManifest === undefined ? {} : { pluginManifest }),
      ...(pluginSelectionProvenance === undefined
        ? {}
        : { pluginSelectionProvenance }),
      ...(resourceProjection === undefined ? {} : { resourceProjection }),
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
    plugins,
    pluginScope,
    selectedPlugins,
    ...(pluginManifest === undefined ? {} : { pluginManifest }),
    ...(pluginSelectionProvenance === undefined
      ? {}
      : { pluginSelectionProvenance }),
    ...(resourceProjection === undefined ? {} : { resourceProjection }),
  };
}

export function createManifest(
  packageMeta: PackageMeta,
  profile: InstallProfile,
  files: Record<string, ManifestFileEntry>,
  skillFiles: string[],
  systemAssetMaterialization: SystemAssetManifestState,
  projectId: string,
  routerOwnership: RouterOwnershipManifestState,
  resourceProjection: ResourceProjectionManifestState,
): InstallManifest {
  if (!routerOwnership || !resourceProjection) {
    throw new Error(
      "Schema 4 manifests require router ownership and resource projection proof.",
    );
  }
  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    projectId,
    packageName: packageMeta.name,
    packageVersion: packageMeta.version,
    updatedAt: new Date().toISOString(),
    profileId: profile.profileId,
    selections: profile.selections,
    effectiveCapabilities: profile.effectiveCapabilities,
    systemAssetMaterialization,
    routerOwnership,
    resourceProjection,
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
    const packageName = validateString(value.packageName, "manifest.packageName");
    const packageVersion = validateString(value.packageVersion, "manifest.packageVersion");

    const schemaVersion = validateNumber(
      value.schemaVersion,
      "manifest.schemaVersion",
    );
    if (
      schemaVersion !== 1 &&
      schemaVersion !== 2 &&
      schemaVersion !== 3 &&
      schemaVersion !== MANIFEST_SCHEMA_VERSION
    ) {
      throw new Error(
        `manifest.schemaVersion must be 1, 2, 3, or ${MANIFEST_SCHEMA_VERSION}`,
      );
    }
    if (schemaVersion === MANIFEST_SCHEMA_VERSION) {
      if (!("routerOwnership" in value) || value.routerOwnership === undefined) {
        throw new Error("manifest.routerOwnership is required for schemaVersion 4");
      }
      if (!("resourceProjection" in value) || value.resourceProjection === undefined) {
        throw new Error("manifest.resourceProjection is required for schemaVersion 4");
      }
    }
    const systemAssetMaterialization =
      "systemAssetMaterialization" in value
        ? validateSystemAssetManifestState(value.systemAssetMaterialization)
        : createEmptySystemAssetManifestState();

    // Stable project identity (W18 R10; PRD 38 R-ID-1). Manifests written
    // before the identifier existed simply lack the field: they load
    // unchanged and stay fully valid — never rejected, never rewritten here.
    // The identifier is minted for them on the next install apply. A present
    // identifier is validated and preserved verbatim; it is never
    // regenerated or normalized.
    const projectId =
      "projectId" in value && value.projectId !== undefined
        ? validateProjectId(value.projectId)
        : undefined;
    const resourceProjection =
      "resourceProjection" in value && value.resourceProjection !== undefined
        ? validateResourceProjectionManifestState(
            value.resourceProjection,
            selections.resourceProjection,
            { name: packageName, version: packageVersion },
            files,
            systemAssetMaterialization,
          )
        : undefined;
    const routerOwnership =
      "routerOwnership" in value && value.routerOwnership !== undefined
        ? validateRouterOwnershipManifestState(
            value.routerOwnership,
            files,
            selections,
            { name: packageName, version: packageVersion },
          )
        : undefined;

    return {
      schemaVersion,
      ...(projectId === undefined ? {} : { projectId }),
      packageName,
      packageVersion,
      updatedAt: validateString(value.updatedAt, "manifest.updatedAt"),
      profileId: validateString(value.profileId, "manifest.profileId"),
      selections,
      effectiveCapabilities: validateEffectiveCapabilities(
        value.effectiveCapabilities,
      ),
      systemAssetMaterialization,
      ...(routerOwnership ? { routerOwnership } : {}),
      ...(resourceProjection ? { resourceProjection } : {}),
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

function validatePluginScope(value: unknown): InstallSelections["pluginScope"] {
  if (value !== "project" && value !== "global") {
    throw new Error("selections.pluginScope must be project or global");
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
      ...(entry.ownershipClass === undefined
        ? {}
        : {
            ownershipClass: validateManifestOwnershipClass(
              entry.ownershipClass,
              `manifest.files.${managedPath}.ownershipClass`,
            ),
          }),
      ...("skillExposure" in entry
        ? {
            skillExposure: validateSkillExposureMetadata(
              entry.skillExposure,
              `manifest.files.${managedPath}.skillExposure`,
            ),
          }
        : {}),
      ...("agenticOwnership" in entry
        ? {
            agenticOwnership: validateAgenticOwnershipMetadata(
              entry.agenticOwnership,
              `manifest.files.${managedPath}.agenticOwnership`,
            ),
          }
        : {}),
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

function validateResourceProjectionSelection(value: unknown): ProjectResourceType[] {
  if (!Array.isArray(value)) {
    throw new Error("selections.resourceProjection must be an array");
  }
  return Array.from(
    new Set(
      value.map((item, index) => {
        if (
          typeof item !== "string" ||
          !PROJECT_RESOURCE_TYPES.includes(item as ProjectResourceType)
        ) {
          throw new Error(
            `selections.resourceProjection.${index} must be contract, prompt, reference, or template`,
          );
        }
        return item as ProjectResourceType;
      }),
    ),
  ).sort();
}

function validateManifestOwnershipClass(
  value: unknown,
  label: string,
): ManifestOwnershipClass {
  if (
    value !== "managed-snapshot" &&
    value !== "managed-block" &&
    value !== "project-owned" &&
    value !== "runtime-state" &&
    value !== "selected-skill" &&
    value !== "installed-provider" &&
    value !== "managed-projection" &&
    value !== "project-override"
  ) {
    throw new Error(`${label} must be a valid ownership class`);
  }
  return value;
}

function validateManifestProvenanceState(
  value: unknown,
  label: string,
): ManifestProvenanceState {
  if (
    value !== "verified" &&
    value !== "incomplete" &&
    value !== "ambiguous" &&
    value !== "contradictory"
  ) {
    throw new Error(`${label} must be a valid provenance state`);
  }
  return value;
}

function validateLocalOwnershipProof(
  value: Record<string, unknown>,
  options: {
    label: string;
    packageMeta: PackageMeta;
    ownershipClass: "managed-snapshot" | "project-owned";
    expectedMaterializationMode: "managed-block";
  },
) {
  const sourcePackage = validateString(value.sourcePackage, `${options.label}.sourcePackage`);
  const sourceVersion = validateString(value.sourceVersion, `${options.label}.sourceVersion`);
  const sourceImmutableRef = validateString(
    value.sourceImmutableRef,
    `${options.label}.sourceImmutableRef`,
  );
  if (
    sourcePackage !== options.packageMeta.name ||
    sourceVersion !== options.packageMeta.version ||
    sourceImmutableRef !== `package:${options.packageMeta.name}@${options.packageMeta.version}`
  ) {
    throw new Error(`${options.label} source identity must equal the manifest package`);
  }
  const provenanceState = validateManifestProvenanceState(
    value.provenanceState,
    `${options.label}.provenanceState`,
  );
  return {
    sourcePackage,
    sourceVersion,
    sourceImmutableRef,
    materializationMode: validateExactString(
      value.materializationMode,
      options.expectedMaterializationMode,
      `${options.label}.materializationMode`,
    ),
    provenanceState,
    provenanceEvidence: validateNonEmptyStringArray(
      value.provenanceEvidence,
      `${options.label}.provenanceEvidence`,
    ),
    competingClaims: validateProvenanceClaims(
      value.competingClaims,
      `${options.label}.competingClaims`,
      provenanceState,
    ),
    hashAlgorithm: validateExactString(
      value.hashAlgorithm,
      "sha256",
      `${options.label}.hashAlgorithm`,
    ),
    expectedSourceHash: validateSha256Digest(
      value.expectedSourceHash,
      `${options.label}.expectedSourceHash`,
    ),
    installedHash: validateSha256Digest(
      value.installedHash,
      `${options.label}.installedHash`,
    ),
    lastVerifiedAt: validateIsoTimestamp(
      value.lastVerifiedAt,
      `${options.label}.lastVerifiedAt`,
    ),
    lifecycleDisposition: validateLifecycleDisposition(
      value.lifecycleDisposition,
      `${options.label}.lifecycleDisposition`,
    ),
    adoptionReceipt: validateAdoptionReceipt(
      value.adoptionReceipt,
      `${options.label}.adoptionReceipt`,
      options.ownershipClass,
    ),
  };
}

function validateProvenanceClaims(
  value: unknown,
  label: string,
  state: ManifestProvenanceState,
): ManifestProvenanceClaim[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  const claims = value.map((claim, index) => {
    const claimLabel = `${label}.${index}`;
    assertPlainObject(claim, claimLabel);
    return {
      sourcePackage: validateString(claim.sourcePackage, `${claimLabel}.sourcePackage`),
      sourceVersion: validateString(claim.sourceVersion, `${claimLabel}.sourceVersion`),
      sourceImmutableRef: validateString(
        claim.sourceImmutableRef,
        `${claimLabel}.sourceImmutableRef`,
      ),
      evidenceRefs: validateNonEmptyStringArray(
        claim.evidenceRefs,
        `${claimLabel}.evidenceRefs`,
      ),
    };
  });
  const expectsClaims = state === "ambiguous" || state === "contradictory";
  if (expectsClaims && claims.length < 2) {
    throw new Error(`${label} must retain at least two evidenced source claims for ${state} provenance`);
  }
  if (!expectsClaims && claims.length !== 0) {
    throw new Error(`${label} must be empty unless provenance is ambiguous or contradictory`);
  }
  return claims;
}

function validateAdoptionReceipt(
  value: unknown,
  label: string,
  ownershipClass: "managed-snapshot" | "project-owned",
): ManifestAdoptionReceipt | null {
  if (ownershipClass === "managed-snapshot") {
    if (value !== null) {
      throw new Error(`${label} must be null for managed-snapshot ownership`);
    }
    return null;
  }
  assertPlainObject(value, label);
  if (value.priorOwnershipClass !== "managed-snapshot") {
    throw new Error(`${label}.priorOwnershipClass must be managed-snapshot`);
  }
  return {
    receiptId: validateString(value.receiptId, `${label}.receiptId`),
    adoptedAt: validateIsoTimestamp(value.adoptedAt, `${label}.adoptedAt`),
    priorOwnershipClass: "managed-snapshot",
    evidenceRefs: validateNonEmptyStringArray(value.evidenceRefs, `${label}.evidenceRefs`),
  };
}

function validateNonEmptyStringArray(value: unknown, label: string): string[] {
  const values = validateStringArray(value, label);
  if (values.length === 0) {
    throw new Error(`${label} must not be empty`);
  }
  return values;
}

function validateExactString<T extends string>(value: unknown, expected: T, label: string): T {
  if (value !== expected) {
    throw new Error(`${label} must be ${expected}`);
  }
  return expected;
}

function validateIsoTimestamp(value: unknown, label: string): string {
  const timestamp = validateString(value, label);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(timestamp) || Number.isNaN(Date.parse(timestamp))) {
    throw new Error(`${label} must be an ISO 8601 UTC timestamp`);
  }
  return timestamp;
}

function validateLifecycleDisposition(value: unknown, label: string): ManifestLifecycleDisposition {
  if (
    value !== "active" &&
    value !== "preserved-export" &&
    value !== "superseded-managed" &&
    value !== "conflict"
  ) {
    throw new Error(`${label} must be a valid lifecycle disposition`);
  }
  return value;
}

function validateRouterOwnershipManifestState(
  value: unknown,
  files: Record<string, ManifestFileEntry>,
  selections: InstallSelections,
  packageMeta: PackageMeta,
): RouterOwnershipManifestState {
  assertPlainObject(value, "manifest.routerOwnership");
  if (value.operationLineage !== "W19 R1 P4") {
    throw new Error("manifest.routerOwnership.operationLineage must be W19 R1 P4");
  }
  const configuredHarnesses = validateStringArray(
    value.configuredHarnesses,
    "manifest.routerOwnership.configuredHarnesses",
  ).map((harness, index) => {
    if (!HARNESSES.includes(harness as (typeof HARNESSES)[number])) {
      throw new Error(
        `manifest.routerOwnership.configuredHarnesses.${index} must be a valid harness`,
      );
    }
    return harness as (typeof HARNESSES)[number];
  });
  if (new Set(configuredHarnesses).size !== configuredHarnesses.length) {
    throw new Error("manifest.routerOwnership.configuredHarnesses must not contain duplicates");
  }
  const expectedHarnesses = configuredHarnesses.slice().sort();
  const selectedHarnesses = Object.entries(selections.harnesses)
    .filter(([, selected]) => selected)
    .map(([harness]) => harness as (typeof HARNESSES)[number])
    .sort();
  if (JSON.stringify(expectedHarnesses) !== JSON.stringify(selectedHarnesses)) {
    throw new Error(
      "manifest.routerOwnership.configuredHarnesses must exactly equal selections.harnesses",
    );
  }
  const profile = resolveInstallProfile(selections);
  assertPlainObject(value.routers, "manifest.routerOwnership.routers");
  const routers: RouterOwnershipManifestState["routers"] = {};
  const transitionalLegacyOnDemandPaths = new Set<string>();
  for (const [relativePath, rawEntry] of Object.entries(value.routers)) {
    assertPlainObject(rawEntry, `manifest.routerOwnership.routers.${relativePath}`);
    const entryPath = validateString(
      rawEntry.relativePath,
      `manifest.routerOwnership.routers.${relativePath}.relativePath`,
    );
    if (entryPath !== relativePath || normalizeRelativePath(entryPath) !== entryPath) {
      throw new Error(
        `manifest.routerOwnership.routers.${relativePath}.relativePath must equal its canonical map key`,
      );
    }
    const harness = validateString(
      rawEntry.harness,
      `manifest.routerOwnership.routers.${relativePath}.harness`,
    ) as (typeof HARNESSES)[number];
    if (!HARNESSES.includes(harness) || !expectedHarnesses.includes(harness)) {
      throw new Error(
        `manifest.routerOwnership.routers.${relativePath}.harness must be configured`,
      );
    }
    const instructionKind = validateString(
      rawEntry.instructionKind,
      `manifest.routerOwnership.routers.${relativePath}.instructionKind`,
    ) as InstructionKind;
    if (!INSTRUCTION_KINDS.includes(instructionKind)) {
      throw new Error(
        `manifest.routerOwnership.routers.${relativePath}.instructionKind must be valid`,
      );
    }
    const expectedInstruction =
      harness === "codex" ? "AGENTS.md" : "CLAUDE.md";
    if (instructionKind !== expectedInstruction) {
      throw new Error(
        `manifest.routerOwnership.routers.${relativePath}.instructionKind must match its harness`,
      );
    }
    if (rawEntry.ownershipClass !== "managed-snapshot" && rawEntry.ownershipClass !== "project-owned") {
      throw new Error(
        `manifest.routerOwnership.routers.${relativePath}.ownershipClass must be managed-snapshot or project-owned`,
      );
    }
    const routerClass = rawEntry.routerClass;
    if (routerClass !== "bootstrap" && routerClass !== "on-demand-surface") {
      throw new Error(
        `manifest.routerOwnership.routers.${relativePath}.routerClass must be bootstrap or on-demand-surface`,
      );
    }
    const allowedPaths = routerClass === "bootstrap"
      ? getConfiguredRouterPaths(profile, instructionKind)
      : getOnDemandRouterPaths(instructionKind);
    const isTransitionalLegacyOnDemandPath =
      routerClass === "on-demand-surface" &&
      getLegacyAssetsOnDemandRouterPaths(instructionKind).includes(relativePath);
    if (!allowedPaths.includes(relativePath) && !isTransitionalLegacyOnDemandPath) {
      throw new Error(
        `manifest.routerOwnership.routers.${relativePath} is not an allowed ${routerClass} router path`,
      );
    }
    if (isTransitionalLegacyOnDemandPath) {
      transitionalLegacyOnDemandPaths.add(relativePath);
    }
    const sourceId = validateString(
      rawEntry.sourceId,
      `manifest.routerOwnership.routers.${relativePath}.sourceId`,
    );
    if (sourceId !== `router:${harness}:${relativePath}`) {
      throw new Error(
        `manifest.routerOwnership.routers.${relativePath}.sourceId must match its harness and path`,
      );
    }
    const expectedFileOwnership = rawEntry.ownershipClass === "managed-snapshot"
      ? "managed-block"
      : "project-owned";
    if (
      files[relativePath]?.sourceId !== sourceId ||
      files[relativePath]?.ownershipClass !== expectedFileOwnership
    ) {
      throw new Error(
        `manifest.routerOwnership.routers.${relativePath} must match manifest.files ownership`,
      );
    }
    const proof = validateLocalOwnershipProof(rawEntry, {
      label: `manifest.routerOwnership.routers.${relativePath}`,
      packageMeta,
      ownershipClass: rawEntry.ownershipClass,
      expectedMaterializationMode: "managed-block",
    });
    if (
      proof.expectedSourceHash !== files[relativePath]?.hash ||
      proof.installedHash !== files[relativePath]?.hash
    ) {
      throw new Error(
        `manifest.routerOwnership.routers.${relativePath} hashes must match manifest.files`,
      );
    }
    routers[relativePath] = {
      relativePath,
      harness,
      instructionKind,
      ownershipClass: rawEntry.ownershipClass,
      routerClass,
      sourceId,
      ...proof,
    };
  }
  const bootstrapPaths = Object.values(routers)
    .filter((router) => router.routerClass === "bootstrap")
    .map((router) => router.relativePath)
    .sort();
  const legacyBootstrapPaths = expectedHarnesses.flatMap((harness) => {
    const instructionKind = harness === "codex" ? "AGENTS.md" : "CLAUDE.md";
    return getLegacyIncompleteRouterPaths(instructionKind);
  }).sort();
  const isExactLegacyIncompleteInput =
    JSON.stringify(bootstrapPaths) === JSON.stringify(legacyBootstrapPaths);
  if (transitionalLegacyOnDemandPaths.size > 0 && !isExactLegacyIncompleteInput) {
    throw new Error(
      "manifest.routerOwnership.routers may use legacy docs/assets on-demand entries only with the exact legacy bootstrap set",
    );
  }
  if (!isExactLegacyIncompleteInput) {
    for (const harness of expectedHarnesses) {
      const instructionKind = harness === "codex" ? "AGENTS.md" : "CLAUDE.md";
      for (const relativePath of getConfiguredRouterPaths(profile, instructionKind)) {
        if (!routers[relativePath]) {
          throw new Error(
            `manifest.routerOwnership.routers must include bootstrap router ${relativePath}`,
          );
        }
      }
    }
  }
  for (const [relativePath, file] of Object.entries(files)) {
    if (!file.sourceId.startsWith("router:")) {
      continue;
    }
    const router = routers[relativePath];
    if (!router || router.sourceId !== file.sourceId) {
      throw new Error(
        `manifest.routerOwnership.routers must include managed router ${relativePath}`,
      );
    }
  }
  return {
    configuredHarnesses: expectedHarnesses,
    operationLineage: "W19 R1 P4",
    routers,
  };
}

function validateResourceProjectionManifestState(
  value: unknown,
  selectedResourceTypes: ProjectResourceType[] | undefined,
  packageMeta: PackageMeta,
  files: Record<string, ManifestFileEntry>,
  systemAssetMaterialization: SystemAssetManifestState,
): ResourceProjectionManifestState {
  assertPlainObject(value, "manifest.resourceProjection");
  const selectedTypes = validateResourceProjectionSelection(value.selectedTypes);
  if (
    JSON.stringify(selectedTypes) !== JSON.stringify(selectedResourceTypes ?? [])
  ) {
    throw new Error(
      "manifest.resourceProjection.selectedTypes must equal selections.resourceProjection",
    );
  }
  assertPlainObject(value.provider, "manifest.resourceProjection.provider");
  assertPlainObject(value.resources, "manifest.resourceProjection.resources");
  if (
    value.provider.ownershipClass !== "installed-provider" ||
    value.provider.provenanceState !== "verified"
  ) {
    throw new Error(
      "manifest.resourceProjection.provider must have installed-provider ownership and verified provenance",
    );
  }
  const provider = {
    ownershipClass: "installed-provider" as const,
    provenanceState: "verified" as const,
    packageName: validateString(
      value.provider.packageName,
      "manifest.resourceProjection.provider.packageName",
    ),
    version: validateString(
      value.provider.version,
      "manifest.resourceProjection.provider.version",
    ),
    immutableRef: validateString(
      value.provider.immutableRef,
      "manifest.resourceProjection.provider.immutableRef",
    ),
    inventoryDigest: validateSha256Digest(
      value.provider.inventoryDigest,
      "manifest.resourceProjection.provider.inventoryDigest",
    ),
  };
  const resources: ResourceProjectionManifestState["resources"] = {};
  for (const [uri, rawEntry] of Object.entries(value.resources)) {
    assertPlainObject(rawEntry, `manifest.resourceProjection.resources.${uri}`);
    const type = validateResourceProjectionSelection([rawEntry.type])[0];
    if (!type) {
      throw new Error(`manifest.resourceProjection.resources.${uri}.type is required`);
    }
    const entryUri = validateString(
      rawEntry.uri,
      `manifest.resourceProjection.resources.${uri}.uri`,
    );
    if (entryUri !== uri) {
      throw new Error(
        `manifest.resourceProjection.resources.${uri}.uri must equal its map key`,
      );
    }
    if (!selectedTypes.includes(type)) {
      throw new Error(
        `manifest.resourceProjection.resources.${uri}.type must be selected`,
      );
    }
    const resourcePath = validateCanonicalResourcePath(
      rawEntry.resourcePath,
      `manifest.resourceProjection.resources.${uri}.resourcePath`,
    );
    const managedDestination = validateString(
      rawEntry.managedDestination,
      `manifest.resourceProjection.resources.${uri}.managedDestination`,
    );
    const typeDirectory = {
      contract: "contracts",
      prompt: "prompts",
      reference: "references",
      template: "templates",
    }[type];
    const canonicalDestination = `.make-docs/system/${typeDirectory}/${resourcePath}`;
    const canonicalUri = `make-docs://system/${type}/${resourcePath}`;
    if (uri !== canonicalUri || entryUri !== canonicalUri) {
      throw new Error(
        `manifest.resourceProjection.resources.${uri} must use canonical URI ${canonicalUri}`,
      );
    }
    if (managedDestination !== canonicalDestination) {
      throw new Error(
        `manifest.resourceProjection.resources.${uri}.managedDestination must be ${canonicalDestination}`,
      );
    }
    const ownershipClass = rawEntry.ownershipClass;
    if (ownershipClass !== "managed-snapshot" && ownershipClass !== "project-owned") {
      throw new Error(
        `manifest.resourceProjection.resources.${uri}.ownershipClass must be managed-snapshot or project-owned`,
      );
    }
    const selectionTrigger = rawEntry.selectionTrigger;
    if (selectionTrigger !== "setup-selection" && selectionTrigger !== "reconfigure-selection") {
      throw new Error(
        `manifest.resourceProjection.resources.${uri}.selectionTrigger must be setup-selection or reconfigure-selection`,
      );
    }
    if (rawEntry.operationLineage !== "W19 R1 P4") {
      throw new Error(
        `manifest.resourceProjection.resources.${uri}.operationLineage must be W19 R1 P4`,
      );
    }
    if (rawEntry.hashAlgorithm !== "sha256") {
      throw new Error(
        `manifest.resourceProjection.resources.${uri}.hashAlgorithm must be sha256`,
      );
    }
    const providerPackage = validateString(
      rawEntry.providerPackage,
      `manifest.resourceProjection.resources.${uri}.providerPackage`,
    );
    const providerVersion = validateString(
      rawEntry.providerVersion,
      `manifest.resourceProjection.resources.${uri}.providerVersion`,
    );
    const providerImmutableRef = validateString(
      rawEntry.providerImmutableRef,
      `manifest.resourceProjection.resources.${uri}.providerImmutableRef`,
    );
    if (
      providerPackage !== provider.packageName ||
      providerVersion !== provider.version ||
      providerImmutableRef !== provider.immutableRef
    ) {
      throw new Error(
        `manifest.resourceProjection.resources.${uri} provider identity must equal manifest.resourceProjection.provider`,
      );
    }
    if (
      providerPackage !== packageMeta.name ||
      providerVersion !== packageMeta.version
    ) {
      throw new Error(
        `manifest.resourceProjection.resources.${uri} provider identity must equal the manifest package`,
      );
    }
    const provenanceState = validateManifestProvenanceState(
      rawEntry.provenanceState,
      `manifest.resourceProjection.resources.${uri}.provenanceState`,
    );
    const provenanceEvidence = validateNonEmptyStringArray(
      rawEntry.provenanceEvidence,
      `manifest.resourceProjection.resources.${uri}.provenanceEvidence`,
    );
    const competingClaims = validateProvenanceClaims(
      rawEntry.competingClaims,
      `manifest.resourceProjection.resources.${uri}.competingClaims`,
      provenanceState,
    );
    const adoptionReceipt = validateAdoptionReceipt(
      rawEntry.adoptionReceipt,
      `manifest.resourceProjection.resources.${uri}.adoptionReceipt`,
      ownershipClass,
    );
    const sourceDigest = validateSha256Digest(
      rawEntry.sourceDigest,
      `manifest.resourceProjection.resources.${uri}.sourceDigest`,
    );
    const installedDigest = validateSha256Digest(
      rawEntry.installedDigest,
      `manifest.resourceProjection.resources.${uri}.installedDigest`,
    );
    const fileEntry = files[managedDestination];
    const expectedFileOwnership = ownershipClass === "managed-snapshot"
      ? "managed-projection"
      : "project-owned";
    if (
      fileEntry?.sourceId !== `resource:${uri}` ||
      fileEntry.ownershipClass !== expectedFileOwnership ||
      fileEntry.hash !== installedDigest
    ) {
      throw new Error(
        `manifest.resourceProjection.resources.${uri} must match managed manifest.files ownership`,
      );
    }
    resources[uri] = {
      uri: entryUri,
      type,
      resourcePath,
      managedDestination,
      ownershipClass,
      provenanceState,
      providerPackage,
      providerVersion,
      providerImmutableRef,
      materializationMode: validateExactString(
        rawEntry.materializationMode,
        "provider-backed-copy",
        `manifest.resourceProjection.resources.${uri}.materializationMode`,
      ),
      sourceDigest,
      installedDigest,
      hashAlgorithm: "sha256",
      lastVerifiedAt: validateIsoTimestamp(
        rawEntry.lastVerifiedAt,
        `manifest.resourceProjection.resources.${uri}.lastVerifiedAt`,
      ),
      lifecycleDisposition: validateLifecycleDisposition(
        rawEntry.lifecycleDisposition,
        `manifest.resourceProjection.resources.${uri}.lifecycleDisposition`,
      ),
      adoptionReceipt,
      selectionTrigger,
      operationLineage: "W19 R1 P4",
      provenanceEvidence,
      competingClaims,
    };
  }
  const requiredResources = new Map<string, string>();
  const selectedDirectories = new Set(
    selectedTypes.map((type) => ({
      contract: "contracts",
      prompt: "prompts",
      reference: "references",
      template: "templates",
    })[type]),
  );
  for (const asset of Object.values(systemAssetMaterialization.assets)) {
    const localPath = asset.localPath;
    if (
      !localPath ||
      asset.materializationClass !== "deferred-system-asset" ||
      asset.selectionTrigger !== "internal-materialization-mode"
    ) {
      continue;
    }
    const match = /^\.make-docs\/system\/(contracts|prompts|references|templates)\/(.+)$/.exec(localPath);
    if (!match || !selectedDirectories.has(match[1])) {
      continue;
    }
    const type = ({
      contracts: "contract",
      prompts: "prompt",
      references: "reference",
      templates: "template",
    } as const)[match[1] as "contracts" | "prompts" | "references" | "templates"];
    requiredResources.set(`make-docs://system/${type}/${match[2]}`, localPath);
  }
  for (const [relativePath, file] of Object.entries(files)) {
    if (!file.sourceId.startsWith("resource:")) {
      continue;
    }
    const uri = file.sourceId.slice("resource:".length);
    if (!resources[uri] || resources[uri].managedDestination !== relativePath) {
      throw new Error(
        `manifest.resourceProjection.resources must include managed resource ${uri}`,
      );
    }
  }
  for (const [uri, localPath] of requiredResources) {
    if (!resources[uri] || resources[uri].managedDestination !== localPath) {
      throw new Error(
        `manifest.resourceProjection.resources must include selected provider resource ${uri}`,
      );
    }
  }
  for (const uri of Object.keys(resources)) {
    if (!requiredResources.has(uri)) {
      throw new Error(
        `manifest.resourceProjection.resources contains unselected or unmaterialized resource ${uri}`,
      );
    }
  }
  return {
    selectedTypes,
    provider,
    resources,
  };
}

function validateCanonicalResourcePath(value: unknown, label: string): string {
  const resourcePath = validateString(value, label);
  const segments = resourcePath.split("/");
  if (
    resourcePath.startsWith("/") ||
    resourcePath.includes("\\") ||
    segments.some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    throw new Error(`${label} must be a canonical relative resource path`);
  }
  return resourcePath;
}

function validateSha256Digest(value: unknown, label: string): string {
  const digest = validateString(value, label);
  if (!/^[a-f0-9]{64}$/.test(digest)) {
    throw new Error(`${label} must be a lowercase sha256 digest`);
  }
  return digest;
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

function validateProjectId(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(
      "manifest.projectId must be a non-empty string (the stable project identifier minted at setup)",
    );
  }

  return value;
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

function validateSelectedPlugins(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new Error("selections.selectedPlugins must be an array");
  }

  return Array.from(
    new Set(
      value.map((pluginId, index) =>
        validateString(pluginId, `selections.selectedPlugins.${index}`),
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

function validatePluginManifestSelectionSource(
  value: unknown,
): PluginManifestSelectionSource {
  assertPlainObject(value, "selections.pluginManifest");
  const source = validatePluginSourceKind(
    value.source,
    "selections.pluginManifest.source",
  );
  const sourcePolicyKind = validatePluginTrustPolicyKind(
    value.sourcePolicyKind,
    "selections.pluginManifest.sourcePolicyKind",
  );

  return {
    manifestId: validateString(
      value.manifestId,
      "selections.pluginManifest.manifestId",
    ),
    displayName: validateString(
      value.displayName,
      "selections.pluginManifest.displayName",
    ),
    sourcePolicyKind,
    source,
    ...("path" in value
      ? { path: validateString(value.path, "selections.pluginManifest.path") }
      : {}),
    ...("digest" in value
      ? {
          digest: validateString(
            value.digest,
            "selections.pluginManifest.digest",
          ),
        }
      : {}),
  };
}

function validatePluginSelectionProvenance(
  value: unknown,
): PluginSelectionProvenanceEntry[] {
  if (!Array.isArray(value)) {
    throw new Error("selections.pluginSelectionProvenance must be an array");
  }

  return value.map((entry, index) => {
    assertPlainObject(entry, `selections.pluginSelectionProvenance.${index}`);
    const sourcePolicyKind = validatePluginTrustPolicyKind(
      entry.sourcePolicyKind,
      `selections.pluginSelectionProvenance.${index}.sourcePolicyKind`,
    );
    const provenanceKind = validatePluginTrustPolicyKind(
      entry.provenanceKind,
      `selections.pluginSelectionProvenance.${index}.provenanceKind`,
    );
    const supportedHarnesses = validateStringArray(
      entry.supportedHarnesses,
      `selections.pluginSelectionProvenance.${index}.supportedHarnesses`,
    ).map((harness) => {
      if (harness !== "claude-code" && harness !== "codex") {
        throw new Error(
          `selections.pluginSelectionProvenance.${index}.supportedHarnesses contains unsupported harness ${harness}`,
        );
      }
      return harness;
    });

    return {
      pluginId: validateString(
        entry.pluginId,
        `selections.pluginSelectionProvenance.${index}.pluginId`,
      ),
      title: validateString(
        entry.title,
        `selections.pluginSelectionProvenance.${index}.title`,
      ),
      manifestId: validateString(
        entry.manifestId,
        `selections.pluginSelectionProvenance.${index}.manifestId`,
      ),
      manifestDisplayName: validateString(
        entry.manifestDisplayName,
        `selections.pluginSelectionProvenance.${index}.manifestDisplayName`,
      ),
      sourcePolicyKind,
      supportedHarnesses,
      pluginSource: validatePluginSourceKind(
        entry.pluginSource,
        `selections.pluginSelectionProvenance.${index}.pluginSource`,
      ),
      provenanceKind,
      provenanceLabel: validateString(
        entry.provenanceLabel,
        `selections.pluginSelectionProvenance.${index}.provenanceLabel`,
      ),
      supportStatus: validatePluginSupportStatus(
        entry.supportStatus,
        `selections.pluginSelectionProvenance.${index}.supportStatus`,
      ),
      ...("repository" in entry
        ? {
            repository: validateString(
              entry.repository,
              `selections.pluginSelectionProvenance.${index}.repository`,
            ),
          }
        : {}),
      ...("ref" in entry
        ? {
            ref: validateString(
              entry.ref,
              `selections.pluginSelectionProvenance.${index}.ref`,
            ),
          }
        : {}),
      ...("digest" in entry
        ? {
            digest: validateString(
              entry.digest,
              `selections.pluginSelectionProvenance.${index}.digest`,
            ),
          }
        : {}),
    };
  });
}

function validateSkillExposureMetadata(
  value: unknown,
  label: string,
): SkillExposureMetadata {
  assertPlainObject(value, label);
  const harness = validateHarnessValue(value.harness, `${label}.harness`);
  const scope = validateSkillScope(value.scope);
  const preferredMode = validateString(value.preferredMode, `${label}.preferredMode`);
  if (preferredMode !== "symlink") {
    throw new Error(`${label}.preferredMode must be symlink`);
  }

  return {
    skillName: validateString(value.skillName, `${label}.skillName`),
    installName: validateString(value.installName, `${label}.installName`),
    harness,
    scope,
    canonicalPayloadPath: validateString(
      value.canonicalPayloadPath,
      `${label}.canonicalPayloadPath`,
    ),
    exposurePath: validateString(value.exposurePath, `${label}.exposurePath`),
    symlinkTarget: validateString(value.symlinkTarget, `${label}.symlinkTarget`),
    preferredMode,
    ...("mode" in value
      ? { mode: validateSkillExposureMode(value.mode, `${label}.mode`) }
      : {}),
    ...("copyMirrorSource" in value
      ? {
          copyMirrorSource: validateString(
            value.copyMirrorSource,
            `${label}.copyMirrorSource`,
          ),
        }
      : {}),
    ...("fallbackReason" in value
      ? {
          fallbackReason: validateString(
            value.fallbackReason,
            `${label}.fallbackReason`,
          ),
        }
      : {}),
    ...("legacyStub" in value
      ? { legacyStub: validateBoolean(value.legacyStub, `${label}.legacyStub`) }
      : {}),
  };
}

function validateHarnessValue(value: unknown, label: string): SkillExposureMetadata["harness"] {
  if (!HARNESSES.includes(value as SkillExposureMetadata["harness"])) {
    throw new Error(`${label} must be a supported harness`);
  }
  return value as SkillExposureMetadata["harness"];
}

function validateSkillExposureMode(
  value: unknown,
  label: string,
): NonNullable<SkillExposureMetadata["mode"]> {
  if (value !== "symlink" && value !== "copy-mirror") {
    throw new Error(`${label} must be symlink or copy-mirror`);
  }
  return value;
}

function validateAgenticOwnershipMetadata(
  value: unknown,
  label: string,
): AgenticOwnershipMetadata {
  assertPlainObject(value, label);
  const artifactKind = validateAgenticArtifactKind(
    value.artifactKind,
    `${label}.artifactKind`,
  );
  const role = validateAgenticFileRole(value.role, `${label}.role`);
  if (artifactKind === "skill" && !isSkillAgenticRole(role)) {
    throw new Error(`${label}.role must be a skill ownership role`);
  }
  if (artifactKind === "plugin" && !isPluginAgenticRole(role)) {
    throw new Error(`${label}.role must be a plugin ownership role`);
  }

  return {
    artifactKind,
    role,
    id: validateString(value.id, `${label}.id`),
    pathKind: validateAgenticPathKind(value.pathKind, `${label}.pathKind`),
    ...("scope" in value
      ? { scope: validateSkillScope(value.scope) }
      : {}),
    ...("harness" in value
      ? { harness: validateHarnessValue(value.harness, `${label}.harness`) }
      : {}),
    ...("canonicalPayloadPath" in value
      ? {
          canonicalPayloadPath: validateString(
            value.canonicalPayloadPath,
            `${label}.canonicalPayloadPath`,
          ),
        }
      : {}),
    ...("exposurePath" in value
      ? {
          exposurePath: validateString(value.exposurePath, `${label}.exposurePath`),
        }
      : {}),
    ...("exposureMode" in value
      ? {
          exposureMode: validateAgenticExposureMode(
            value.exposureMode,
            `${label}.exposureMode`,
          ),
        }
      : {}),
    ...("sourceManifest" in value
      ? {
          sourceManifest: validateString(
            value.sourceManifest,
            `${label}.sourceManifest`,
          ),
        }
      : {}),
    ...("ref" in value ? { ref: validateString(value.ref, `${label}.ref`) } : {}),
    ...("version" in value
      ? { version: validateString(value.version, `${label}.version`) }
      : {}),
    ...("digest" in value
      ? { digest: validateString(value.digest, `${label}.digest`) }
      : {}),
    ...("provenance" in value
      ? {
          provenance: validateString(value.provenance, `${label}.provenance`),
        }
      : {}),
    ...("trustPolicy" in value
      ? {
          trustPolicy: validatePluginTrustPolicy(
            value.trustPolicy,
            `${label}.trustPolicy`,
          ),
        }
      : {}),
    ...("supportStatus" in value
      ? {
          supportStatus: validatePluginSupportStatus(
            value.supportStatus,
            `${label}.supportStatus`,
          ),
        }
      : {}),
    ...("packaging" in value
      ? {
          packaging: validateAgenticPackagingProvenance(
            value.packaging,
            `${label}.packaging`,
          ),
        }
      : {}),
  };
}

/**
 * Per-artifact Playbook-packaging provenance (W18 R8 P4, R-PROV-1): source
 * refs and digests, package profile, adapter id, output kind, generated file,
 * category, and generation tier ride on the manifest ownership record so the
 * manifest and audit surfaces stay the queryable provenance carriers.
 */
function validateAgenticPackagingProvenance(
  value: unknown,
  label: string,
): AgenticPackagingProvenance {
  assertPlainObject(value, label);
  const profile = value.profile;
  if (profile !== "native" && profile !== "portable") {
    throw new Error(`${label}.profile must be native or portable`);
  }
  const outputKind = value.outputKind;
  if (outputKind !== "plugin" && outputKind !== "skills-bundle") {
    throw new Error(`${label}.outputKind must be plugin or skills-bundle`);
  }
  const generationTier = value.generationTier;
  if (
    generationTier !== undefined &&
    generationTier !== "deterministic" &&
    generationTier !== "agent-proposed"
  ) {
    throw new Error(`${label}.generationTier must be deterministic or agent-proposed`);
  }
  if (value.ownershipStatus !== "make-docs-managed") {
    throw new Error(`${label}.ownershipStatus must be make-docs-managed`);
  }
  return {
    packageId: validateString(value.packageId, `${label}.packageId`),
    profile,
    adapterId: validateString(value.adapterId, `${label}.adapterId`),
    outputKind,
    sourceRefs: validateStringArray(value.sourceRefs, `${label}.sourceRefs`),
    sourceDigests: validateStringArray(value.sourceDigests, `${label}.sourceDigests`),
    generatedFile: validateString(value.generatedFile, `${label}.generatedFile`),
    category: validateString(value.category, `${label}.category`),
    ...(generationTier !== undefined ? { generationTier } : {}),
    ownershipStatus: "make-docs-managed",
  };
}

function validateAgenticArtifactKind(value: unknown, label: string): "skill" | "plugin" {
  if (value !== "skill" && value !== "plugin") {
    throw new Error(`${label} must be skill or plugin`);
  }
  return value;
}

function validateAgenticFileRole(value: unknown, label: string): AgenticFileRole {
  if (
    value !== "shared-payload" &&
    value !== "native-exposure" &&
    value !== "copy-mirror" &&
    value !== "generated-stub" &&
    value !== "legacy-duplicated-payload" &&
    value !== "plugin-payload" &&
    value !== "plugin-native-exposure" &&
    value !== "plugin-copy-mirror" &&
    value !== "plugin-generated-adapter" &&
    value !== "plugin-legacy-generated-output"
  ) {
    throw new Error(`${label} must be a supported agentic ownership role`);
  }
  return value;
}

function isSkillAgenticRole(role: AgenticFileRole): boolean {
  return (
    role === "shared-payload" ||
    role === "native-exposure" ||
    role === "copy-mirror" ||
    role === "generated-stub" ||
    role === "legacy-duplicated-payload"
  );
}

function isPluginAgenticRole(role: AgenticFileRole): boolean {
  return (
    role === "plugin-payload" ||
    role === "plugin-native-exposure" ||
    role === "plugin-copy-mirror" ||
    role === "plugin-generated-adapter" ||
    role === "plugin-legacy-generated-output"
  );
}

function validateAgenticPathKind(value: unknown, label: string): AgenticPathKind {
  if (value !== "file" && value !== "directory") {
    throw new Error(`${label} must be file or directory`);
  }
  return value;
}

function validateAgenticExposureMode(
  value: unknown,
  label: string,
): AgenticExposureMode {
  if (
    value !== "symlink" &&
    value !== "copy-mirror" &&
    value !== "generated-adapter"
  ) {
    throw new Error(`${label} must be symlink, copy-mirror, or generated-adapter`);
  }
  return value;
}

function validatePluginTrustPolicy(value: unknown, label: string): PluginTrustPolicy {
  assertPlainObject(value, label);
  const kind = validatePluginTrustPolicyKind(value.kind, `${label}.kind`);
  return {
    kind,
    ...("description" in value
      ? { description: validateString(value.description, `${label}.description`) }
      : {}),
  };
}

function validatePluginTrustPolicyKind(
  value: unknown,
  label: string,
): PluginTrustPolicyKind {
  if (
    value !== "first-party" &&
    value !== "local-reviewed" &&
    value !== "remote-pinned" &&
    value !== "manual-review-required"
  ) {
    throw new Error(`${label} must be a supported trust policy`);
  }
  return value;
}

function validatePluginSourceKind(value: unknown, label: string): PluginSourceKind {
  if (value !== "built-in" && value !== "file" && value !== "remote-pinned") {
    throw new Error(`${label} must be built-in, file, or remote-pinned`);
  }
  return value;
}

function validatePluginSupportStatus(
  value: unknown,
  label: string,
): PluginSupportStatus {
  if (
    value !== "provisional" &&
    value !== "implementation-validated" &&
    value !== "conformance-validated" &&
    value !== "unsupported"
  ) {
    throw new Error(`${label} must be a supported plugin support status`);
  }
  return value;
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
  const kind =
    manifestEntry?.agenticOwnership?.pathKind ??
    (manifestEntry?.skillExposure ? "directory" : "file");

  return {
    ...createAuditPathMetadata(targetDir, managedPath, kind, homeDir),
    ownershipSource,
    sourceId: manifestEntry?.sourceId,
    manifestHash: manifestEntry?.hash,
    skillExposure: manifestEntry?.skillExposure,
    agenticOwnership: manifestEntry?.agenticOwnership,
    ...(manifestEntry?.agenticOwnership?.role
      ? { agenticRole: manifestEntry.agenticOwnership.role }
      : agenticRole
        ? { agenticRole }
        : {}),
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
