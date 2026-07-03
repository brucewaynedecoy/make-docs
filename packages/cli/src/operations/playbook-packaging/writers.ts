/**
 * Package output writer (W18 R5, rebuilt by W18 R8 P2).
 *
 * The writer stages the compiler's multi-file, harness-native distributable
 * tree — never a Make Docs descriptor (R-COMP-1; the descriptor-payload code
 * path is gone) — through the PRD 28 exposure plumbing unchanged (R-COMP-2):
 * the canonical payload lives under the staging area
 * (`.make-docs/agentics/...`), the exposure mirror lands at the harness path
 * by symlink (directory link to the canonical container) or copy-mirror
 * (managed per-file mirror of the tree), and manifest ownership records track
 * both sides. Only the payload content changed relative to W18 R5: one
 * descriptor file became the compiled inventory, so the canonical side now
 * records one ownership entry per generated file while the exposure side
 * keeps its symlink-directory / copy-mirror-file entry shapes.
 *
 * Every W18 R5 rail is preserved in order (R-KEEP-1): plan validation,
 * surface/adapter resolution, fail-before-write stops (review, semantic
 * proposals, unresolved decisions, ownership conflicts, missing or stale
 * sources, unsupported surfaces — R-GEN-2), reviewed overwrite, manifest and
 * provenance records, backup-reviewed stale-output removal, owned-output-only
 * cleanup, and empty-managed-directory pruning.
 */

import {
  chmodSync,
  existsSync,
  lstatSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadManifest, writeManifest } from "../../manifest";
import { HARNESSES } from "../../types";
import type {
  AgenticArtifactKind,
  AgenticFileRole,
  AgenticOwnershipMetadata,
  Harness,
  ManifestFileEntry,
  PluginSupportStatus,
} from "../../types";
import {
  ensureParentDir,
  hashText,
  normalizeRelativePath,
  readTextFile,
  writeTextFile,
} from "../../utils";
import { listHarnessRegistryEntries } from "../harness-registry";
import { findRepoRoot } from "../shared";
import { OperationError } from "../types";
import {
  compilePackageInventory,
  loadPackageSourcesForWrite,
  type PackageInventory,
  type PackageInventoryFile,
} from "./compiler";
import { resolvePackageSurface } from "./surface-resolution";
import type {
  GeneratedArtifactPlan,
  GeneratedOutputRecord,
  PackagePlanStop,
  PackageSurfaceResolution,
  PlaybookPackagePlan,
  PlaybookPackageWriteInput,
  PlaybookPackageWriteResult,
} from "./types";
import {
  validateGeneratedOutputRecord,
  validatePackagePlan,
} from "./validation";

const PLAYBOOK_PACKAGE_SOURCE_MANIFEST = "make-docs.playbook-packaging";

export function writePlaybookPackageOutputs(
  input: PlaybookPackageWriteInput,
): PlaybookPackageWriteResult {
  const repoRoot = findRepoRoot(input.repoRoot);
  const homeDir = path.resolve(input.homeDir ?? os.homedir());
  const plan = validatePackagePlan(input.plan);
  const artifact = primaryGeneratedArtifact(plan);
  const canonicalRoot = normalizePathForManifest(artifact.path, homeDir);
  const surfaceResolution = input.surfaceResolution ??
    resolvePackageSurface({
      target: plan.target,
      packageId: plan.packageId,
      platform: input.platform,
      symlinkAvailable: input.symlinkAvailable,
      preconditions: input.preconditions,
    });

  // Compile the harness-native inventory before any write decision: source
  // staleness, container support, dependency materialization, and semantic
  // resolution all fail closed here (R-GEN-2, R-SCOPE-1).
  const descriptor = listHarnessRegistryEntries({ descriptors: input.descriptors })
    .find((entry) => entry.harnessId === plan.target.harness)?.descriptor ?? null;
  const loaded = loadPackageSourcesForWrite({ repoRoot, plan });
  const inventory: PackageInventory = loaded.stops.length === 0
    ? compilePackageInventory({ repoRoot, plan, descriptor, sources: loaded.sources })
    : emptyInventory(plan);

  const stops = [
    ...planWriteStops(plan),
    ...surfaceResolution.stops,
    ...loaded.stops,
    ...inventory.stops,
    ...manifestStops(repoRoot, plan),
    ...existingOutputStops({
      repoRoot,
      homeDir,
      plan,
      canonicalRoot,
      inventory,
      surfaceResolution,
      reviewedOverwrite: input.reviewedOverwrite === true,
    }),
    ...staleOutputStops(input.staleOutputs ?? [], input.backupSnapshotReviewed === true),
  ];
  const records = createGeneratedOutputRecords({
    plan,
    artifact,
    canonicalRoot,
    surfaceResolution,
  });
  const canWrite = stops.length === 0;
  if (input.write && !canWrite) {
    throw new OperationError(`Playbook package write stopped: ${stops.map((stop) => stop.reason).join(", ")}.`);
  }

  const filesWritten: string[] = [];
  const staleOutputsRemoved: string[] = [];
  let manifestUpdated = false;
  if (input.write && canWrite) {
    for (const file of inventory.files) {
      writeManagedFile({
        repoRoot,
        homeDir,
        relativePath: joinRelative(canonicalRoot, file.path),
        content: file.content,
        executable: file.executable,
        reviewedOverwrite: input.reviewedOverwrite === true,
      });
      filesWritten.push(joinRelative(canonicalRoot, file.path));
    }

    if (plan.target.scope !== "export-only") {
      writeExposure({
        repoRoot,
        homeDir,
        canonicalRoot,
        inventory,
        surfaceResolution,
        reviewedOverwrite: input.reviewedOverwrite === true,
      });
      filesWritten.push(exposureRootPath(surfaceResolution));
      manifestUpdated = updateInstallManifest({
        repoRoot,
        plan,
        canonicalRoot,
        inventory,
        surfaceResolution,
      });
    }

    staleOutputsRemoved.push(...removeReviewedStaleOutputs({
      repoRoot,
      homeDir,
      records: input.staleOutputs ?? [],
      backupSnapshotReviewed: input.backupSnapshotReviewed === true,
      manifestUpdated,
    }));
  }

  const status = resultStatus(plan, stops, input.write === true);
  return {
    status,
    packageId: plan.packageId,
    outputKind: plan.target.outputKind,
    scope: plan.target.scope,
    canonicalPath: canonicalRoot,
    ...(surfaceResolution.path ? { exposurePath: exposureRootPath(surfaceResolution) } : {}),
    exposureMode: surfaceResolution.exposureMode,
    payloadFiles: inventory.files.map((file) => file.path),
    records,
    filesWritten,
    manifestUpdated,
    staleOutputsRemoved,
    stops,
    lines: renderWriteLines({
      plan,
      canonicalRoot,
      inventory,
      exposurePath: surfaceResolution.path ? exposureRootPath(surfaceResolution) : undefined,
      exposureMode: surfaceResolution.exposureMode,
      stops,
      write: input.write === true,
      manifestUpdated,
    }),
  };
}

export function readPlaybookPackageWrite(input: PlaybookPackageWriteInput): {
  value: PlaybookPackageWriteResult;
  provenance: {
    domain: "playbook-packaging";
    operation: "playbook-package-write";
    source: "shared";
    target: string;
  };
} {
  return {
    value: writePlaybookPackageOutputs(input),
    provenance: {
      domain: "playbook-packaging",
      operation: "playbook-package-write",
      source: "shared",
      target: input.plan.packageId,
    },
  };
}

function primaryGeneratedArtifact(plan: PlaybookPackagePlan): GeneratedArtifactPlan {
  const artifact = plan.generatedArtifacts.find(
    (candidate) => candidate.outputKind === plan.target.outputKind,
  );
  if (!artifact) {
    throw new OperationError("Package plan does not include an artifact for the target output kind.");
  }
  return artifact;
}

function emptyInventory(plan: PlaybookPackagePlan): PackageInventory {
  return {
    containerId: plan.distributable?.containerSelection.containerId ?? null,
    containerKind: plan.distributable?.containerSelection.containerKind ?? null,
    profile: plan.distributable?.profile ?? (plan.target.outputKind === "plugin" ? "native" : "portable"),
    manifestPath: null,
    skillPaths: {},
    files: [],
    dependencies: [],
    stops: [],
  };
}

function planWriteStops(plan: PlaybookPackagePlan): PackagePlanStop[] {
  const stops: PackagePlanStop[] = [];
  if (plan.target.surface === "auto") {
    stops.push({
      reason: "manual-review-required",
      message: "`auto` surface must be resolved to a concrete adapter surface before writing.",
    });
  }
  if (plan.review.status === "required" || plan.review.status === "rejected") {
    stops.push({
      reason: "manual-review-required",
      message: `Package plan review status is ${plan.review.status}.`,
    });
  }
  if (plan.review.required && plan.review.status !== "approved") {
    stops.push({
      reason: "manual-review-required",
      message: "Package plan requires review approval before writing.",
    });
  }
  if (plan.agentAssistedProposals.length > 0 && plan.review.status !== "approved") {
    stops.push({
      reason: "semantic-review-required",
      message: "Agent-assisted package-plan proposals require review approval before writing.",
    });
  }
  if (plan.unresolvedDecisions.length > 0) {
    stops.push({
      reason: "manual-review-required",
      message: "Package plan has unresolved decisions.",
    });
  }
  if (plan.support.status === "unsupported") {
    stops.push({
      reason: "unsupported-output-kind",
      message: "Package plan support status is unsupported.",
    });
  }
  return stops;
}

function manifestStops(repoRoot: string, plan: PlaybookPackagePlan): PackagePlanStop[] {
  if (plan.target.scope === "export-only" || loadManifest(repoRoot)) {
    return [];
  }
  return [
    {
      reason: "manual-review-required",
      message: "Installed package outputs require an existing Make Docs manifest.",
    },
  ];
}

function existingOutputStops(input: {
  repoRoot: string;
  homeDir: string;
  plan: PlaybookPackagePlan;
  canonicalRoot: string;
  inventory: PackageInventory;
  surfaceResolution: PackageSurfaceResolution;
  reviewedOverwrite: boolean;
}): PackagePlanStop[] {
  if (input.reviewedOverwrite) {
    return [];
  }
  const stops: PackagePlanStop[] = [];
  for (const file of input.inventory.files) {
    const relativePath = joinRelative(input.canonicalRoot, file.path);
    const absolutePath = absoluteManagedPath(input.repoRoot, input.homeDir, relativePath);
    if (existsSync(absolutePath) && readTextFile(absolutePath) !== file.content) {
      stops.push({
        reason: "ownership-review-required",
        message: `Existing generated package output at ${relativePath} differs and requires reviewed overwrite.`,
        path: relativePath,
      });
    }
  }
  if (input.plan.target.scope === "export-only" || input.inventory.files.length === 0) {
    return stops;
  }
  const exposureRoot = exposureRootPath(input.surfaceResolution);
  if (input.surfaceResolution.exposureMode === "symlink") {
    const exposureAbsolutePath = absoluteManagedPath(input.repoRoot, input.homeDir, exposureRoot);
    if (existsSync(exposureAbsolutePath) && !lstatSync(exposureAbsolutePath).isSymbolicLink()) {
      stops.push({
        reason: "ownership-review-required",
        message: `Existing harness exposure at ${exposureRoot} requires reviewed overwrite.`,
        path: exposureRoot,
      });
    }
  }
  if (input.surfaceResolution.exposureMode === "copy-mirror") {
    for (const file of input.inventory.files) {
      const mirrorPath = joinRelative(exposureRoot, file.path);
      const absolutePath = absoluteManagedPath(input.repoRoot, input.homeDir, mirrorPath);
      if (existsSync(absolutePath) && readTextFile(absolutePath) !== file.content) {
        stops.push({
          reason: "ownership-review-required",
          message: `Existing harness exposure at ${mirrorPath} differs and requires reviewed overwrite.`,
          path: mirrorPath,
        });
      }
    }
  }
  return stops;
}

function staleOutputStops(
  records: GeneratedOutputRecord[],
  backupSnapshotReviewed: boolean,
): PackagePlanStop[] {
  if (records.length === 0 || backupSnapshotReviewed) {
    return [];
  }
  return records.map((record) => ({
    reason: "manual-review-required" as const,
    message: `Stale generated output at ${record.path} requires a reviewed backup snapshot before removal.`,
    path: record.path,
  }));
}

function writeManagedFile(input: {
  repoRoot: string;
  homeDir: string;
  relativePath: string;
  content: string;
  executable: boolean;
  reviewedOverwrite: boolean;
}): void {
  const absolutePath = absoluteManagedPath(input.repoRoot, input.homeDir, input.relativePath);
  if (existsSync(absolutePath) && readTextFile(absolutePath) !== input.content) {
    if (!input.reviewedOverwrite) {
      throw new OperationError(`Refusing to overwrite modified output at ${input.relativePath}.`);
    }
    rmSync(absolutePath, { recursive: true, force: true });
  }
  writeTextFile(absolutePath, input.content);
  if (input.executable) {
    chmodSync(absolutePath, 0o755);
  }
}

/**
 * PRD 28 exposure plumbing, unchanged (R-COMP-2): the symlink mode links the
 * harness path to the canonical container directory; the copy-mirror mode
 * writes a managed mirror of the payload tree under the harness path.
 */
function writeExposure(input: {
  repoRoot: string;
  homeDir: string;
  canonicalRoot: string;
  inventory: PackageInventory;
  surfaceResolution: PackageSurfaceResolution;
  reviewedOverwrite: boolean;
}): void {
  const exposureRoot = exposureRootPath(input.surfaceResolution);
  if (input.surfaceResolution.exposureMode === "copy-mirror") {
    for (const file of input.inventory.files) {
      writeManagedFile({
        repoRoot: input.repoRoot,
        homeDir: input.homeDir,
        relativePath: joinRelative(exposureRoot, file.path),
        content: file.content,
        executable: file.executable,
        reviewedOverwrite: input.reviewedOverwrite,
      });
    }
    return;
  }
  if (input.surfaceResolution.exposureMode !== "symlink") {
    return;
  }

  const exposureAbsolutePath = absoluteManagedPath(input.repoRoot, input.homeDir, exposureRoot);
  const canonicalDirectory = absoluteManagedPath(input.repoRoot, input.homeDir, input.canonicalRoot);
  if (existsSync(exposureAbsolutePath)) {
    if (!input.reviewedOverwrite && !lstatSync(exposureAbsolutePath).isSymbolicLink()) {
      throw new OperationError(`Refusing to replace non-symlink exposure at ${exposureRoot}.`);
    }
    rmSync(exposureAbsolutePath, { recursive: true, force: true });
  }
  ensureParentDir(exposureAbsolutePath);
  symlinkSync(
    normalizeRelativePath(path.relative(path.dirname(exposureAbsolutePath), canonicalDirectory)),
    exposureAbsolutePath,
    "dir",
  );
}

function updateInstallManifest(input: {
  repoRoot: string;
  plan: PlaybookPackagePlan;
  canonicalRoot: string;
  inventory: PackageInventory;
  surfaceResolution: PackageSurfaceResolution;
}): boolean {
  const manifest = loadManifest(input.repoRoot);
  if (!manifest) {
    throw new OperationError("Installed package outputs require an existing Make Docs manifest.");
  }
  const entries = createManifestEntries(input);
  manifest.files = {
    ...manifest.files,
    ...entries,
  };
  if (input.plan.target.outputKind === "skills-bundle") {
    const exposureRoot = exposureRootPath(input.surfaceResolution);
    const skillPaths = Object.values(input.inventory.skillPaths);
    manifest.skillFiles = Array.from(new Set([
      ...manifest.skillFiles,
      ...skillPaths.map((skillPath) => joinRelative(input.canonicalRoot, skillPath)),
      exposureRoot,
    ])).sort();
  }
  manifest.updatedAt = new Date().toISOString();
  writeManifest(input.repoRoot, manifest);
  return true;
}

/**
 * Manifest ownership records track both the canonical payload and the
 * exposure mirror (R-COMP-2): one entry per generated payload file plus the
 * W18 R5 exposure entry shapes — a directory entry for symlink exposure and
 * per-file entries for copy mirrors.
 */
function createManifestEntries(input: {
  plan: PlaybookPackagePlan;
  canonicalRoot: string;
  inventory: PackageInventory;
  surfaceResolution: PackageSurfaceResolution;
}): Record<string, ManifestFileEntry> {
  const artifactKind: AgenticArtifactKind = input.plan.target.outputKind === "plugin" ? "plugin" : "skill";
  const canonicalRole: AgenticFileRole = artifactKind === "plugin" ? "plugin-payload" : "shared-payload";
  const entries: Record<string, ManifestFileEntry> = {};
  for (const file of input.inventory.files) {
    const canonicalPath = joinRelative(input.canonicalRoot, file.path);
    entries[canonicalPath] = {
      hash: hashText(file.content),
      sourceId: sourceId(input.plan, "payload", canonicalPath),
      agenticOwnership: ownership({
        plan: input.plan,
        artifactKind,
        role: canonicalRole,
        pathKind: "file",
        canonicalPayloadPath: canonicalPath,
      }),
    };
  }

  const exposureRoot = exposureRootPath(input.surfaceResolution);
  if (input.surfaceResolution.exposureMode === "symlink") {
    const exposureRole: AgenticFileRole = artifactKind === "plugin"
      ? "plugin-native-exposure"
      : "native-exposure";
    entries[exposureRoot] = {
      hash: hashText(JSON.stringify({
        target: input.canonicalRoot,
        mode: input.surfaceResolution.exposureMode,
      })),
      sourceId: sourceId(input.plan, "symlink", exposureRoot),
      agenticOwnership: ownership({
        plan: input.plan,
        artifactKind,
        role: exposureRole,
        pathKind: "directory",
        canonicalPayloadPath: input.canonicalRoot,
        exposurePath: exposureRoot,
        exposureMode: "symlink",
      }),
    };
  }
  if (input.surfaceResolution.exposureMode === "copy-mirror") {
    const exposureRole: AgenticFileRole = artifactKind === "plugin" ? "plugin-copy-mirror" : "copy-mirror";
    for (const file of input.inventory.files) {
      const mirrorPath = joinRelative(exposureRoot, file.path);
      entries[mirrorPath] = {
        hash: hashText(file.content),
        sourceId: sourceId(input.plan, "copy-mirror", mirrorPath),
        agenticOwnership: ownership({
          plan: input.plan,
          artifactKind,
          role: exposureRole,
          pathKind: "file",
          canonicalPayloadPath: joinRelative(input.canonicalRoot, file.path),
          exposurePath: mirrorPath,
          exposureMode: "copy-mirror",
        }),
      };
    }
  }
  return entries;
}

function createGeneratedOutputRecords(input: {
  plan: PlaybookPackagePlan;
  artifact: GeneratedArtifactPlan;
  canonicalRoot: string;
  surfaceResolution: PackageSurfaceResolution;
}): GeneratedOutputRecord[] {
  const sourceDigests = input.plan.sources.map((source) => source.sourceDigest);
  const base = {
    schemaVersion: 1 as const,
    sourceRefs: input.plan.sources.map((source) => source.ref),
    sourceDigests,
    target: input.plan.target,
    support: input.plan.support,
    lifecycle: input.plan.lifecycle,
    reviewStatus: input.plan.review.status,
  };
  const records: GeneratedOutputRecord[] = input.plan.sources.map((source) =>
    validateGeneratedOutputRecord({
      ...base,
      recordKind: "source-playbook",
      path: source.path,
      sourceRefs: [source.ref],
      sourceDigests: [source.sourceDigest],
    }),
  );
  if (input.plan.target.scope === "export-only") {
    records.push(validateGeneratedOutputRecord({
      ...base,
      recordKind: "export-only-file",
      path: input.canonicalRoot,
    }));
    return records;
  }
  records.push(validateGeneratedOutputRecord({
    ...base,
    recordKind: input.artifact.recordKind,
    path: input.canonicalRoot,
  }));
  records.push(validateGeneratedOutputRecord({
    ...base,
    recordKind: input.surfaceResolution.exposureMode === "copy-mirror"
      ? "copy-mirror"
      : "symlink-exposure",
    path: exposureRootPath(input.surfaceResolution),
  }));
  return records;
}

function removeReviewedStaleOutputs(input: {
  repoRoot: string;
  homeDir: string;
  records: GeneratedOutputRecord[];
  backupSnapshotReviewed: boolean;
  manifestUpdated: boolean;
}): string[] {
  if (!input.backupSnapshotReviewed) {
    return [];
  }
  const removed: string[] = [];
  for (const record of input.records) {
    const absolutePath = absoluteManagedPath(input.repoRoot, input.homeDir, record.path);
    if (existsSync(absolutePath)) {
      rmSync(absolutePath, { recursive: true, force: true });
      removed.push(record.path);
    }
  }
  if (removed.length > 0 && input.manifestUpdated) {
    const manifest = loadManifest(input.repoRoot);
    if (manifest) {
      for (const record of input.records) {
        delete manifest.files[record.path];
      }
      manifest.updatedAt = new Date().toISOString();
      writeManifest(input.repoRoot, manifest);
    }
  }
  pruneEmptyAgenticsDirectories(input.repoRoot, removed);
  return removed;
}

function resultStatus(
  plan: PlaybookPackagePlan,
  stops: PackagePlanStop[],
  wrote: boolean,
): PlaybookPackageWriteResult["status"] {
  if (stops.some((stop) => stop.reason === "manual-review-required")) {
    return "manual-review-required";
  }
  if (stops.length > 0) {
    return "review-required";
  }
  if (!wrote) {
    return "ready";
  }
  return plan.target.scope === "export-only" ? "exported" : "written";
}

function renderWriteLines(input: {
  plan: PlaybookPackagePlan;
  canonicalRoot: string;
  inventory: PackageInventory;
  exposurePath?: string;
  exposureMode: string;
  stops: PackagePlanStop[];
  write: boolean;
  manifestUpdated: boolean;
}): string[] {
  return [
    `Package write: ${input.plan.packageId}`,
    `Output kind: ${input.plan.target.outputKind}`,
    `Scope: ${input.plan.target.scope}`,
    `Canonical output: ${input.canonicalRoot}`,
    `Payload files: ${input.inventory.files.length}`,
    ...input.inventory.files.map((file) => `- ${file.category}: ${file.path}`),
    ...(input.exposurePath ? [`Harness exposure: ${input.exposurePath} (${input.exposureMode})`] : []),
    `Writes executed: ${input.write && input.stops.length === 0 ? "yes" : "no"}`,
    `Manifest updated: ${input.manifestUpdated ? "yes" : "no"}`,
    ...input.stops.map((stop) => `Stop: ${stop.reason} - ${stop.message}`),
  ];
}

/**
 * The exposure mirror root at the harness path: placement templates that name
 * the container's manifest or skill file expose the containing directory,
 * which the symlink or copy mirror fills with the payload tree.
 */
function exposureRootPath(surfaceResolution: PackageSurfaceResolution): string {
  const exposurePath = surfaceResolution.path;
  if (
    exposurePath.endsWith("/SKILL.md") ||
    exposurePath.endsWith("/plugin.json") ||
    exposurePath.endsWith("/extension.json")
  ) {
    return normalizeRelativePath(path.dirname(exposurePath));
  }
  return exposurePath;
}

function joinRelative(root: string, relativePath: string): string {
  return normalizeRelativePath(`${root}/${relativePath}`);
}

function ownership(input: {
  plan: PlaybookPackagePlan;
  artifactKind: AgenticArtifactKind;
  role: AgenticFileRole;
  pathKind: AgenticOwnershipMetadata["pathKind"];
  canonicalPayloadPath?: string;
  exposurePath?: string;
  exposureMode?: AgenticOwnershipMetadata["exposureMode"];
}): AgenticOwnershipMetadata {
  return {
    artifactKind: input.artifactKind,
    role: input.role,
    id: input.plan.packageId,
    pathKind: input.pathKind,
    ...(input.plan.target.scope === "project" || input.plan.target.scope === "global"
      ? { scope: input.plan.target.scope }
      : {}),
    ...(isKnownHarness(input.plan.target.harness) ? { harness: input.plan.target.harness } : {}),
    ...(input.canonicalPayloadPath ? { canonicalPayloadPath: input.canonicalPayloadPath } : {}),
    ...(input.exposurePath ? { exposurePath: input.exposurePath } : {}),
    ...(input.exposureMode ? { exposureMode: input.exposureMode } : {}),
    sourceManifest: PLAYBOOK_PACKAGE_SOURCE_MANIFEST,
    ref: `playbook-package:${input.plan.packageId}`,
    digest: input.plan.sources.map((source) => source.sourceDigest).join(","),
    provenance: "generated from Make Docs Playbook package plan",
    trustPolicy: {
      kind: input.plan.review.status === "approved" ? "local-reviewed" : "first-party",
      description: "Generated from a Make Docs Playbook package plan.",
    },
    supportStatus: supportStatus(input.plan.support.status),
  };
}

function supportStatus(status: PlaybookPackagePlan["support"]["status"]): PluginSupportStatus {
  switch (status) {
    case "validated":
      return "conformance-validated";
    case "unsupported":
      return "unsupported";
    case "provisional":
    case "unvalidated":
      return "provisional";
  }
}

function sourceId(plan: PlaybookPackagePlan, kind: string, relativePath: string): string {
  return `playbook-package:${plan.packageId}:${kind}:${relativePath}`;
}

function normalizePathForManifest(value: string, homeDir: string): string {
  if (value.startsWith("<user-home>/")) {
    return normalizeRelativePath(path.join(homeDir, value.slice("<user-home>/".length)));
  }
  return normalizeRelativePath(value);
}

function absoluteManagedPath(repoRoot: string, homeDir: string, value: string): string {
  if (value.startsWith("<user-home>/")) {
    return path.join(homeDir, value.slice("<user-home>/".length));
  }
  if (path.isAbsolute(value)) {
    return value;
  }
  return path.join(repoRoot, value);
}

function pruneEmptyAgenticsDirectories(repoRoot: string, relativePaths: string[]): void {
  const boundary = path.join(repoRoot, ".make-docs", "agentics");
  for (const relativePath of relativePaths) {
    if (!relativePath.startsWith(".make-docs/agentics/")) {
      continue;
    }
    let current = path.dirname(path.join(repoRoot, relativePath));
    while (current.startsWith(boundary) && current !== boundary) {
      try {
        rmSync(current, { recursive: false });
      } catch {
        break;
      }
      current = path.dirname(current);
    }
  }
}

function isKnownHarness(value: string): value is Harness {
  return (HARNESSES as readonly string[]).includes(value);
}
