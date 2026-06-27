import { existsSync, readdirSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  classifyAgenticSkillFileRole,
  formatAgenticSkillFileRole,
} from "./agentic-skill-roles";
import { getDesiredAssets } from "./catalog";
import {
  createAuditPathMetadata,
  getManifestFileHash,
  getManifestAuditContext,
  getManifestPath,
  MANIFEST_RELATIVE_PATH,
} from "./manifest";
import { parseManagedBlock } from "./managed-block";
import { defaultSelections, resolveInstallProfile } from "./profile";
import { getDesiredSkillAssets, getRetiredManagedSkillAssets } from "./skill-catalog";
import {
  loadEffectiveSkillRegistry,
  loadSkillRegistry,
  type SkillRegistry,
} from "./skill-registry";
import { TOOL_DIRECTORY_CONFIG_RELATIVE_PATH } from "./tool-directory";
import {
  HARNESSES,
  type AuditCandidateMetadata,
  type AuditManagedPathMetadata,
  type AuditOwnershipSource,
  type AuditPathKind,
  type AuditPreservedPath,
  type AuditPrunableDirectory,
  type AuditReason,
  type AuditReport,
  type AuditRemovableFile,
  type AuditSkillSelectionReview,
  type AuditSkippedPath,
  type Harness,
  type InstallManifest,
  type InstallSelections,
  type ManifestAuditRecord,
} from "./types";
import { hashText, PACKAGE_ROOT, readTextFile } from "./utils";

const PROJECT_BACKUP_DIRNAME = ".backup";
const SHARED_AGENTICS_SKILL_DIR = ".make-docs/agentics/skills";
const HARNESS_SKILL_DIRS: Record<Harness, string> = {
  "claude-code": ".claude/skills",
  codex: ".agents/skills",
};

export async function createAuditReport(options: {
  targetDir: string;
  manifest?: InstallManifest | null;
  homeDir?: string;
}): Promise<AuditReport> {
  const targetDir = path.resolve(options.targetDir);
  const homeDir = path.resolve(options.homeDir ?? os.homedir());
  const removableFiles = new Map<string, AuditRemovableFile>();
  const preservedPaths = new Map<string, AuditPreservedPath>();
  const skippedPaths = new Map<string, AuditSkippedPath>();

  if (options.manifest) {
    await classifyManifestPresent({
      targetDir,
      homeDir,
      manifest: options.manifest,
      removableFiles,
      preservedPaths,
      skippedPaths,
    });
  } else {
    await classifyManifestMissing({
      targetDir,
      homeDir,
      removableFiles,
      preservedPaths,
      skippedPaths,
    });
  }
  classifyProjectConfig({
    targetDir,
    homeDir,
    preservedPaths,
  });

  const prunableDirectories = classifyPrunableDirectories({
    targetDir,
    homeDir,
    removableFiles: [...removableFiles.values()],
    preservedPaths,
    skippedPaths,
  });

  return {
    mode: options.manifest ? "manifest-present" : "manifest-missing",
    targetDir,
    manifestPath: getManifestPath(targetDir),
    ...(options.manifest
      ? {
          skillSelectionReview: createSkillSelectionReview(
            options.manifest.selections,
          ),
        }
      : {}),
    removableFiles: sortAuditEntries([...removableFiles.values()]),
    prunableDirectories: sortPrunableDirectories(prunableDirectories),
    preservedPaths: sortAuditEntries([...preservedPaths.values()]),
    skippedPaths: sortAuditEntries([...skippedPaths.values()]),
  };
}

async function classifyManifestPresent(options: {
  targetDir: string;
  homeDir: string;
  manifest: InstallManifest;
  removableFiles: Map<string, AuditRemovableFile>;
  preservedPaths: Map<string, AuditPreservedPath>;
  skippedPaths: Map<string, AuditSkippedPath>;
}): Promise<void> {
  const {
    targetDir,
    homeDir,
    manifest,
    removableFiles,
    preservedPaths,
    skippedPaths,
  } = options;
  const auditContext = getManifestAuditContext(targetDir, manifest, homeDir);

  const manifestCandidates = new Map<string, ManifestAuditRecord>();
  for (const record of auditContext.managedFiles) {
    manifestCandidates.set(record.absolutePath, record);
  }
  for (const record of auditContext.skillFiles) {
    manifestCandidates.set(
      record.absolutePath,
      manifestCandidates.get(record.absolutePath) ?? record,
    );
  }
  manifestCandidates.set(
    path.resolve(targetDir, MANIFEST_RELATIVE_PATH),
    createManagedPathRecord(targetDir, homeDir, MANIFEST_RELATIVE_PATH, "managed-state", {
      sourceId: `state:${MANIFEST_RELATIVE_PATH}`,
    }),
  );

  const manifestSkillContentByPath = await loadCanonicalSkillContentByPath(
    targetDir,
    homeDir,
    auditContext.priorSelections,
    [...manifestCandidates.values()].some(
      (record) => record.ownershipSource === "manifest-skill-file",
    ),
  );

  for (const record of sortAuditEntries([...manifestCandidates.values()])) {
    classifyManifestRecord({
      targetDir,
      record,
      manifestSkillContentByPath,
      removableFiles,
      preservedPaths,
      skippedPaths,
    });
  }
}

function classifyManifestRecord(options: {
  targetDir: string;
  record: ManifestAuditRecord;
  manifestSkillContentByPath: Map<string, string> | null;
  removableFiles: Map<string, AuditRemovableFile>;
  preservedPaths: Map<string, AuditPreservedPath>;
  skippedPaths: Map<string, AuditSkippedPath>;
}): void {
  const {
    targetDir,
    record,
    manifestSkillContentByPath,
    removableFiles,
    preservedPaths,
    skippedPaths,
  } = options;

  if (isInsideProjectBackupRoot(targetDir, record.absolutePath)) {
    addSkipped(
      skippedPaths,
      record,
      "excluded",
      createReason(
        "inside-backup-root",
        "Paths inside the project `.backup/` tree are excluded from removal consideration.",
      ),
    );
    return;
  }

  if (record.pathScope === "external") {
    addSkipped(
      skippedPaths,
      record,
      "excluded",
      createReason(
        "outside-supported-roots",
        "This path is outside both the target directory and the user home directory and is preserved conservatively.",
      ),
    );
    return;
  }

  if (!existsSync(record.absolutePath)) {
    addSkipped(
      skippedPaths,
      record,
      "already-absent",
      createReason("already-absent", "The managed path is already absent on disk."),
    );
    return;
  }

  if (!statSync(record.absolutePath).isFile()) {
    addPreserved(
      preservedPaths,
      record,
      createReason(
        "managed-file-modified",
        "The managed file path is no longer a regular file and will be preserved.",
      ),
    );
    return;
  }

  const currentContent = readTextFile(record.absolutePath);
  const currentHash = hashText(currentContent);

  if (record.ownershipSource === "managed-state") {
    addRemovable(
      removableFiles,
      record,
      createReason(
        "managed-state-file",
        "The make-docs manifest is CLI-managed state and is eligible for removal.",
      ),
      currentHash,
      undefined,
    );
    return;
  }

  if (isInstructionPath(record.path)) {
    const currentBlockHash = getManifestFileHash(record.path, currentContent);
    if (currentBlockHash && record.manifestHash && currentBlockHash === record.manifestHash) {
      const parsed = parseManagedBlock(currentContent);
      if (parsed.prefix.trim().length > 0 || parsed.suffix.trim().length > 0) {
        addPreserved(
          preservedPaths,
          record,
          createReason(
            "instruction-content-mismatch",
            "The managed block matches the manifest, but user content exists outside the block so the instruction file is preserved.",
          ),
        );
        return;
      }

      addRemovable(
        removableFiles,
        record,
        createReason(
          "instruction-content-match",
          "The instruction file's managed block matches the manifest and no user content exists outside the block.",
        ),
        currentBlockHash,
        record.manifestHash,
      );
      return;
    }

    if (record.manifestHash && currentHash === record.manifestHash) {
      addRemovable(
        removableFiles,
        record,
        createReason(
          "instruction-content-match",
          "The legacy instruction file still matches the manifest-tracked make-docs content.",
        ),
        currentHash,
        record.manifestHash,
      );
      return;
    }

    addPreserved(
      preservedPaths,
      record,
      createReason(
        "instruction-content-mismatch",
        "The instruction file does not match manifest-tracked make-docs content and will be preserved.",
      ),
    );
    return;
  }

  if (record.manifestHash && currentHash === record.manifestHash) {
    addRemovable(
      removableFiles,
      record,
      createReason(
        "managed-file-hash-match",
        "The file still matches the manifest-tracked make-docs content.",
      ),
      currentHash,
      record.manifestHash,
    );
    return;
  }

  if (record.ownershipSource === "manifest-skill-file") {
    const expectedContent = manifestSkillContentByPath?.get(record.path);
    if (!expectedContent) {
      addPreserved(
        preservedPaths,
        record,
        createReason(
          "manifest-skill-file-without-metadata",
          `The ${formatAuditAgenticRole(record)} is tracked only by the manifest skill list and cannot be proven removable without canonical make-docs content.`,
        ),
      );
      return;
    }

    if (currentContent === expectedContent) {
      addRemovable(
        removableFiles,
        record,
        createReason(
          "managed-skill-file-content-match",
          `The ${formatAuditAgenticRole(record)} exactly matches canonical make-docs skill content.`,
        ),
        currentHash,
        hashText(expectedContent),
      );
      return;
    }

    addPreserved(
      preservedPaths,
      record,
      createReason(
        "manifest-skill-file-content-mismatch",
        `The manifest-tracked ${formatAuditAgenticRole(record)} does not match canonical make-docs skill content and will be preserved.`,
      ),
    );
    return;
  }

  addPreserved(
    preservedPaths,
    record,
    createReason(
      "managed-file-modified",
      "The manifest-tracked file was modified locally and will be preserved.",
    ),
  );
}

async function classifyManifestMissing(options: {
  targetDir: string;
  homeDir: string;
  removableFiles: Map<string, AuditRemovableFile>;
  preservedPaths: Map<string, AuditPreservedPath>;
  skippedPaths: Map<string, AuditSkippedPath>;
}): Promise<void> {
  const { targetDir, homeDir, removableFiles, preservedPaths, skippedPaths } = options;
  const fallbackSelections = defaultSelections();
  const fallbackProfile = resolveInstallProfile(fallbackSelections);
  const fallbackCandidates = new Map<string, AuditManagedPathMetadata>();
  const canonicalContentByPath = new Map<string, string>();

  for (const asset of getDesiredAssets(fallbackProfile)) {
    const record = createManagedPathRecord(targetDir, homeDir, asset.relativePath, "fallback", {
      sourceId: asset.sourceId,
    });
    fallbackCandidates.set(record.absolutePath, record);
    canonicalContentByPath.set(record.path, asset.content);
  }

  fallbackCandidates.set(
    path.resolve(targetDir, MANIFEST_RELATIVE_PATH),
    createManagedPathRecord(targetDir, homeDir, MANIFEST_RELATIVE_PATH, "managed-state", {
      sourceId: `state:${MANIFEST_RELATIVE_PATH}`,
    }),
  );

  const knownSkillRoots = getKnownSkillRoots(targetDir, homeDir);
  const existingSkillRoots = knownSkillRoots.filter((root) => existsSync(root.absolutePath));
  const scopeRootFetchFailures = new Set<"project" | "home">();

  if (existingSkillRoots.some((root) => root.pathScope === "project")) {
    const skillRecords = await loadFallbackSkillCandidates({
      targetDir,
      homeDir,
      selections: {
        ...fallbackSelections,
        skillScope: "project",
      },
    });
    if (skillRecords) {
      for (const record of skillRecords) {
        fallbackCandidates.set(record.record.absolutePath, record.record);
        canonicalContentByPath.set(record.record.path, record.content);
      }
    } else {
      scopeRootFetchFailures.add("project");
    }
  }

  if (existingSkillRoots.some((root) => root.pathScope === "home")) {
    const skillRecords = await loadFallbackSkillCandidates({
      targetDir,
      homeDir,
      selections: {
        ...fallbackSelections,
        skillScope: "global",
      },
    });
    if (skillRecords) {
      for (const record of skillRecords) {
        fallbackCandidates.set(record.record.absolutePath, record.record);
        canonicalContentByPath.set(record.record.path, record.content);
      }
    } else {
      scopeRootFetchFailures.add("home");
    }
  }

  for (const record of sortAuditEntries([...fallbackCandidates.values()])) {
    classifyFallbackRecord({
      targetDir,
      record,
      canonicalContentByPath,
      removableFiles,
      preservedPaths,
      skippedPaths,
    });
  }

  for (const skillRoot of existingSkillRoots) {
    const hasExistingManagedCandidateDescendant = [...fallbackCandidates.values()].some(
      (record) =>
        existsSync(record.absolutePath) && isWithinRoot(skillRoot.absolutePath, record.absolutePath),
    );
    if (
      scopeRootFetchFailures.has(skillRoot.pathScope) ||
      !hasExistingManagedCandidateDescendant
    ) {
      addPreserved(
        preservedPaths,
        skillRoot,
        createReason(
          "fallback-ambiguous",
          "The selected-agentics skill root exists, but fallback mode cannot prove which contents are make-docs-managed.",
        ),
      );
    }
  }
}

function classifyFallbackRecord(options: {
  targetDir: string;
  record: AuditManagedPathMetadata;
  canonicalContentByPath: Map<string, string>;
  removableFiles: Map<string, AuditRemovableFile>;
  preservedPaths: Map<string, AuditPreservedPath>;
  skippedPaths: Map<string, AuditSkippedPath>;
}): void {
  const {
    targetDir,
    record,
    canonicalContentByPath,
    removableFiles,
    preservedPaths,
    skippedPaths,
  } = options;

  if (isInsideProjectBackupRoot(targetDir, record.absolutePath)) {
    addSkipped(
      skippedPaths,
      record,
      "excluded",
      createReason(
        "inside-backup-root",
        "Paths inside the project `.backup/` tree are excluded from removal consideration.",
      ),
    );
    return;
  }

  if (record.pathScope === "external") {
    addSkipped(
      skippedPaths,
      record,
      "excluded",
      createReason(
        "outside-supported-roots",
        "This path is outside both the target directory and the user home directory and cannot be removed in fallback mode.",
      ),
    );
    return;
  }

  if (!existsSync(record.absolutePath)) {
    addSkipped(
      skippedPaths,
      record,
      "already-absent",
      createReason("already-absent", "The candidate path is already absent on disk."),
    );
    return;
  }

  if (!statSync(record.absolutePath).isFile()) {
    addPreserved(
      preservedPaths,
      record,
      createReason(
        "fallback-ambiguous",
        "Fallback mode found a non-file at an expected make-docs-managed file path and will preserve it.",
      ),
    );
    return;
  }

  const currentContent = readTextFile(record.absolutePath);
  const currentHash = hashText(currentContent);

  if (record.ownershipSource === "managed-state") {
    if (looksLikeMakeDocsManifest(record.absolutePath)) {
      addRemovable(
        removableFiles,
        record,
        createReason(
          "managed-state-file",
          "The make-docs manifest matches the generated manifest shape and is eligible for removal.",
        ),
        currentHash,
        undefined,
      );
    } else {
      addPreserved(
        preservedPaths,
        record,
        createReason(
          "fallback-ambiguous",
          "Fallback mode found make-docs state at the expected path, but its contents do not match the generated manifest shape.",
        ),
      );
    }
    return;
  }

  if (isInstructionPath(record.path)) {
    const expectedContent = canonicalContentByPath.get(record.path);
    const currentBlockHash = getManifestFileHash(record.path, currentContent);
    const expectedBlockHash =
      typeof expectedContent === "string"
        ? getManifestFileHash(record.path, expectedContent)
        : null;
    const parsed = parseManagedBlock(currentContent);
    const blockOnly =
      parsed.state === "valid" &&
      parsed.prefix.trim().length === 0 &&
      parsed.suffix.trim().length === 0;

    if (
      typeof expectedContent === "string" &&
      (currentContent === expectedContent ||
        (blockOnly && currentBlockHash && currentBlockHash === expectedBlockHash))
    ) {
      addRemovable(
        removableFiles,
        record,
        createReason(
          "fallback-root-fingerprint-match",
          "The instruction file matches canonical make-docs content in fallback mode.",
        ),
        currentHash,
        expectedBlockHash ?? hashText(expectedContent),
      );
      return;
    }

    addPreserved(
      preservedPaths,
      record,
      createReason(
        "fallback-root-fingerprint-mismatch",
        "The instruction file does not match canonical make-docs content and will be preserved.",
      ),
    );
    return;
  }

  const expectedContent = canonicalContentByPath.get(record.path);
  if (typeof expectedContent === "string" && currentContent === expectedContent) {
    addRemovable(
      removableFiles,
      record,
      createReason(
        "fallback-canonical-content-match",
        "The file exactly matches canonical make-docs content in fallback mode.",
      ),
      currentHash,
      hashText(expectedContent),
    );
    return;
  }

  addPreserved(
    preservedPaths,
    record,
    createReason(
      "fallback-ambiguous",
      "Fallback mode cannot prove that this existing path is safe to remove.",
    ),
  );
}

function classifyPrunableDirectories(options: {
  targetDir: string;
  homeDir: string;
  removableFiles: AuditRemovableFile[];
  preservedPaths: Map<string, AuditPreservedPath>;
  skippedPaths: Map<string, AuditSkippedPath>;
}): AuditPrunableDirectory[] {
  const { targetDir, homeDir, removableFiles, preservedPaths, skippedPaths } = options;
  const removableFileSet = new Set(removableFiles.map((entry) => entry.absolutePath));
  const prunableDirectories = new Map<string, AuditPrunableDirectory>();
  const removableDescendantsByDirectory = new Map<string, Set<string>>();

  for (const removableFile of removableFiles) {
    const boundary =
      removableFile.pathScope === "project"
        ? targetDir
        : removableFile.pathScope === "home"
          ? homeDir
          : null;
    if (!boundary) {
      continue;
    }

    for (const directoryPath of getCandidateParentDirectories(
      removableFile.absolutePath,
      boundary,
      targetDir,
    )) {
      if (!removableDescendantsByDirectory.has(directoryPath)) {
        removableDescendantsByDirectory.set(directoryPath, new Set());
      }
      removableDescendantsByDirectory.get(directoryPath)?.add(removableFile.path);
    }
  }

  const sortedDirectoryCandidates = [...removableDescendantsByDirectory.keys()].sort(
    (left, right) =>
      createAuditPathMetadata(targetDir, left, "directory", homeDir).ordering.pruneSortKey.localeCompare(
        createAuditPathMetadata(targetDir, right, "directory", homeDir).ordering.pruneSortKey,
      ),
  );

  for (const directoryPath of sortedDirectoryCandidates) {
    if (!existsSync(directoryPath)) {
      continue;
    }

    const metadata = createAuditPathMetadata(targetDir, directoryPath, "directory", homeDir);
    const remainingEntries = getRemainingDirectoryEntries(
      directoryPath,
      removableFileSet,
      prunableDirectories,
    );
    if (remainingEntries.length === 0) {
      const pruneReason = createReason(
        "directory-eligible-for-prune",
        "The directory becomes empty after removing audited make-docs-managed descendants.",
      );
      prunableDirectories.set(directoryPath, {
        ...metadata,
        kind: "directory",
        reason: pruneReason.message,
        reasonCode: pruneReason.code,
        removableDescendantPaths: [...(removableDescendantsByDirectory.get(directoryPath) ?? [])].sort(),
        preservedDescendantPaths: [],
      });
      continue;
    }

    const preservedDescendantPaths = describeBlockingDescendants(
      targetDir,
      homeDir,
      remainingEntries,
      preservedPaths,
      skippedPaths,
    );
    addPreserved(
      preservedPaths,
      metadata,
      createReason(
        preservedDescendantPaths.length > 0
          ? "directory-contains-preserved-descendants"
          : "directory-contains-unmanaged-descendants",
        preservedDescendantPaths.length > 0
          ? "The directory still contains preserved descendants after subtracting removable make-docs paths."
          : "The directory still contains unmanaged descendants after subtracting removable make-docs paths.",
      ),
      preservedDescendantPaths,
    );
  }

  return [...prunableDirectories.values()];
}

function getRemainingDirectoryEntries(
  directoryPath: string,
  removableFileSet: Set<string>,
  prunableDirectories: Map<string, AuditPrunableDirectory>,
): string[] {
  return readdirSync(directoryPath)
    .map((entry) => path.join(directoryPath, entry))
    .filter((entryPath) => !removableFileSet.has(entryPath) && !prunableDirectories.has(entryPath));
}

function describeBlockingDescendants(
  targetDir: string,
  homeDir: string,
  entryPaths: string[],
  preservedPaths: Map<string, AuditPreservedPath>,
  skippedPaths: Map<string, AuditSkippedPath>,
): string[] {
  const described = new Set<string>();

  for (const entryPath of entryPaths) {
    const preserved = findRecordedDescendant(entryPath, preservedPaths);
    if (preserved) {
      described.add(preserved.path);
      continue;
    }

    const skipped = findRecordedDescendant(entryPath, skippedPaths);
    if (skipped) {
      described.add(skipped.path);
      continue;
    }

    described.add(
      createAuditPathMetadata(targetDir, entryPath, getExistingPathKind(entryPath), homeDir).path,
    );
  }

  return [...described].sort();
}

function findRecordedDescendant<T extends AuditCandidateMetadata>(
  rootPath: string,
  records: Map<string, T>,
): T | null {
  for (const record of records.values()) {
    if (isWithinRoot(rootPath, record.absolutePath)) {
      return record;
    }
  }

  return null;
}

function getCandidateParentDirectories(
  absoluteFilePath: string,
  boundary: string,
  targetDir: string,
): string[] {
  const directories: string[] = [];
  let current = path.dirname(absoluteFilePath);
  const normalizedBoundary = path.resolve(boundary);

  while (current !== normalizedBoundary && isWithinRoot(normalizedBoundary, current)) {
    if (isInsideProjectBackupRoot(targetDir, current)) {
      break;
    }

    directories.push(current);
    current = path.dirname(current);
  }

  return directories;
}

function classifyProjectConfig(options: {
  targetDir: string;
  homeDir: string;
  preservedPaths: Map<string, AuditPreservedPath>;
}): void {
  const { targetDir, homeDir, preservedPaths } = options;
  const absolutePath = path.join(targetDir, TOOL_DIRECTORY_CONFIG_RELATIVE_PATH);
  if (!existsSync(absolutePath)) {
    return;
  }

  addPreserved(
    preservedPaths,
    createCandidatePathRecord(
      targetDir,
      homeDir,
      TOOL_DIRECTORY_CONFIG_RELATIVE_PATH,
      getExistingPathKind(absolutePath),
      "project-config",
    ),
    createReason(
      "project-config-preserved",
      "The make-docs config file is project-owned local configuration and is preserved separately from managed files, conflicts, provider state, and cache state.",
    ),
  );
}

async function loadCanonicalSkillContentByPath(
  targetDir: string,
  homeDir: string,
  selections: InstallSelections,
  shouldLoad: boolean,
): Promise<Map<string, string> | null> {
  if (!shouldLoad) {
    return new Map();
  }

  try {
    const skillRegistry = loadSavedSkillRegistry(selections);
    const [assets, retiredAssets] = await Promise.all([
      getDesiredSkillAssets(selections, skillRegistry),
      getRetiredManagedSkillAssets(selections, skillRegistry),
    ]);
    return new Map(
      [...assets, ...retiredAssets].map((asset) => {
        const record = createManagedPathRecord(
          targetDir,
          homeDir,
          asset.relativePath,
          "manifest-skill-file",
          { sourceId: asset.sourceId },
        );
        return [record.path, asset.content] as const;
      }),
    );
  } catch {
    return null;
  }
}

function createSkillSelectionReview(
  selections: InstallSelections,
): AuditSkillSelectionReview {
  return {
    skillsEnabled: selections.skills,
    skillScope: selections.skillScope,
    selectedSkills: [...selections.selectedSkills].sort(),
    ...(selections.skillManifest
      ? { skillManifest: structuredClone(selections.skillManifest) }
      : {}),
    skillSelectionProvenance: [
      ...(selections.skillSelectionProvenance ?? []),
    ].sort((left, right) => left.skillName.localeCompare(right.skillName)),
  };
}

function loadSavedSkillRegistry(selections: InstallSelections): SkillRegistry {
  const savedManifest = selections.skillManifest;
  if (!savedManifest || savedManifest.source === "built-in") {
    return loadSkillRegistry(PACKAGE_ROOT);
  }

  if (savedManifest.source === "file" && savedManifest.path) {
    return loadEffectiveSkillRegistry({
      packageRoot: PACKAGE_ROOT,
      manifestReference: savedManifest.path,
    }).registry;
  }

  throw new Error(
    "Saved remote-pinned skill manifests require explicit migration review before lifecycle audit expansion.",
  );
}

async function loadFallbackSkillCandidates(options: {
  targetDir: string;
  homeDir: string;
  selections: InstallSelections;
}): Promise<Array<{ record: AuditManagedPathMetadata; content: string }> | null> {
  try {
    const assets = await getDesiredSkillAssets(options.selections);
    return assets.map((asset) => ({
      record: createManagedPathRecord(
        options.targetDir,
        options.homeDir,
        asset.relativePath,
        "fallback",
        { sourceId: asset.sourceId },
      ),
      content: asset.content,
    }));
  } catch {
    return null;
  }
}

function getKnownSkillRoots(
  targetDir: string,
  homeDir: string,
): Array<AuditCandidateMetadata & { pathScope: "project" | "home" }> {
  return [
    createCandidatePathRecord(
      targetDir,
      homeDir,
      path.join(targetDir, SHARED_AGENTICS_SKILL_DIR),
      "directory",
      "fallback",
    ) as AuditCandidateMetadata & { pathScope: "project" },
    createCandidatePathRecord(
      targetDir,
      homeDir,
      path.join(homeDir, SHARED_AGENTICS_SKILL_DIR),
      "directory",
      "fallback",
    ) as AuditCandidateMetadata & { pathScope: "home" },
    ...HARNESSES.flatMap((harness) => [
      createCandidatePathRecord(
        targetDir,
        homeDir,
        path.join(targetDir, HARNESS_SKILL_DIRS[harness]),
        "directory",
        "fallback",
      ) as AuditCandidateMetadata & { pathScope: "project" },
      createCandidatePathRecord(
        targetDir,
        homeDir,
        path.join(homeDir, HARNESS_SKILL_DIRS[harness]),
        "directory",
        "fallback",
      ) as AuditCandidateMetadata & { pathScope: "home" },
    ]),
  ];
}

function createManagedPathRecord(
  targetDir: string,
  homeDir: string,
  auditPath: string,
  ownershipSource: AuditOwnershipSource,
  options?: {
    sourceId?: string;
    manifestHash?: string;
  },
): ManifestAuditRecord {
  const agenticRole = classifyAgenticSkillFileRole({
    relativePath: auditPath,
    sourceId: options?.sourceId,
  });

  return {
    ...createAuditPathMetadata(targetDir, auditPath, "file", homeDir),
    ownershipSource,
    sourceId: options?.sourceId,
    manifestHash: options?.manifestHash,
    ...(agenticRole ? { agenticRole } : {}),
  };
}

function createCandidatePathRecord(
  targetDir: string,
  homeDir: string,
  auditPath: string,
  kind: AuditPathKind,
  ownershipSource?: AuditOwnershipSource,
): AuditCandidateMetadata {
  const agenticRole = classifyAgenticSkillFileRole({ relativePath: auditPath });

  return {
    ...createAuditPathMetadata(targetDir, auditPath, kind, homeDir),
    ownershipSource,
    ...(agenticRole ? { agenticRole } : {}),
  };
}

function addRemovable(
  removableFiles: Map<string, AuditRemovableFile>,
  record: AuditManagedPathMetadata,
  reason: AuditReason,
  currentHash?: string,
  expectedHash?: string,
): void {
  removableFiles.set(record.absolutePath, {
    ...record,
    kind: "file",
    reason: reason.message,
    reasonCode: reason.code,
    currentHash,
    expectedHash,
  });
}

function addPreserved(
  preservedPaths: Map<string, AuditPreservedPath>,
  record: AuditCandidateMetadata,
  reason: AuditReason,
  preservedDescendantPaths?: string[],
): void {
  preservedPaths.set(record.absolutePath, {
    ...record,
    reason: reason.message,
    reasonCode: reason.code,
    preservedDescendantPaths,
  });
}

function addSkipped(
  skippedPaths: Map<string, AuditSkippedPath>,
  record: AuditCandidateMetadata,
  status: AuditSkippedPath["status"],
  reason: AuditReason,
): void {
  skippedPaths.set(record.absolutePath, {
    ...record,
    reason: reason.message,
    reasonCode: reason.code,
    status,
  });
}

function createReason(code: AuditReason["code"], message: string): AuditReason {
  return { code, message };
}

function formatAuditAgenticRole(record: AuditManagedPathMetadata): string {
  return formatAgenticSkillFileRole(record.agenticRole) ?? "skill file";
}

function isInstructionPath(auditPath: string): boolean {
  const basename = path.posix.basename(auditPath);
  return basename === "AGENTS.md" || basename === "CLAUDE.md";
}

function isInsideProjectBackupRoot(targetDir: string, absolutePath: string): boolean {
  return isWithinRoot(path.join(targetDir, PROJECT_BACKUP_DIRNAME), absolutePath);
}

function isWithinRoot(rootPath: string, candidatePath: string): boolean {
  const relative = path.relative(path.resolve(rootPath), path.resolve(candidatePath));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function getExistingPathKind(absolutePath: string): AuditPathKind {
  return statSync(absolutePath).isDirectory() ? "directory" : "file";
}

function looksLikeMakeDocsManifest(filePath: string): boolean {
  try {
    const raw = JSON.parse(readTextFile(filePath)) as Record<string, unknown>;
    return (
      typeof raw.schemaVersion === "number" &&
      typeof raw.packageName === "string" &&
      typeof raw.packageVersion === "string" &&
      typeof raw.profileId === "string" &&
      typeof raw.updatedAt === "string" &&
      typeof raw.selections === "object" &&
      raw.selections !== null &&
      typeof raw.files === "object" &&
      raw.files !== null
    );
  } catch {
    return false;
  }
}

function sortAuditEntries<T extends { ordering: { sortKey: string } }>(entries: T[]): T[] {
  return [...entries].sort((left, right) =>
    left.ordering.sortKey.localeCompare(right.ordering.sortKey),
  );
}

function sortPrunableDirectories(entries: AuditPrunableDirectory[]): AuditPrunableDirectory[] {
  return [...entries].sort((left, right) =>
    left.ordering.pruneSortKey.localeCompare(right.ordering.pruneSortKey),
  );
}
