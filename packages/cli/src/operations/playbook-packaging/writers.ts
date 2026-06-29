import {
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
  AgenticPathKind,
  AgenticScope,
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
import { findRepoRoot } from "../shared";
import { OperationError } from "../types";
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
  const canonicalPath = normalizePathForManifest(artifact.path, repoRoot, homeDir);
  const surfaceResolution = input.surfaceResolution ??
    resolvePackageSurface({
      target: plan.target,
      packageId: plan.packageId,
      platform: input.platform,
      symlinkAvailable: input.symlinkAvailable,
      preconditions: input.preconditions,
    });
  const stops = [
    ...planWriteStops(plan),
    ...surfaceResolution.stops,
    ...manifestStops(repoRoot, plan),
    ...existingOutputStops({
      repoRoot,
      homeDir,
      plan,
      artifact,
      surfaceResolution,
      reviewedOverwrite: input.reviewedOverwrite === true,
    }),
    ...staleOutputStops(input.staleOutputs ?? [], input.backupSnapshotReviewed === true),
  ];
  const records = createGeneratedOutputRecords({
    plan,
    artifact,
    canonicalPath,
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
    const content = renderPackageContent(plan);
    writeManagedText({
      repoRoot,
      homeDir,
      relativePath: artifact.path,
      content,
      reviewedOverwrite: input.reviewedOverwrite === true,
    });
    filesWritten.push(canonicalPath);

    if (plan.target.scope !== "export-only") {
      writeExposure({
        repoRoot,
        homeDir,
        plan,
        artifact,
        surfaceResolution,
        content,
        reviewedOverwrite: input.reviewedOverwrite === true,
      });
      if (surfaceResolution.path) {
        filesWritten.push(exposureManifestPath(plan, surfaceResolution));
      }
      manifestUpdated = updateInstallManifest({
        repoRoot,
        plan,
        artifact,
        content,
        canonicalPath,
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
    canonicalPath,
    ...(surfaceResolution.path ? { exposurePath: exposureManifestPath(plan, surfaceResolution) } : {}),
    exposureMode: surfaceResolution.exposureMode,
    records,
    filesWritten,
    manifestUpdated,
    staleOutputsRemoved,
    stops,
    lines: renderWriteLines({
      plan,
      canonicalPath,
      exposurePath: surfaceResolution.path ? exposureManifestPath(plan, surfaceResolution) : undefined,
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
  artifact: GeneratedArtifactPlan;
  surfaceResolution: PackageSurfaceResolution;
  reviewedOverwrite: boolean;
}): PackagePlanStop[] {
  if (input.reviewedOverwrite) {
    return [];
  }
  const stops: PackagePlanStop[] = [];
  const content = renderPackageContent(input.plan);
  const canonicalAbsolutePath = absoluteManagedPath(input.repoRoot, input.homeDir, input.artifact.path);
  if (existsSync(canonicalAbsolutePath) && readTextFile(canonicalAbsolutePath) !== content) {
    stops.push({
      reason: "ownership-review-required",
      message: `Existing generated package output at ${input.artifact.path} differs and requires reviewed overwrite.`,
      path: input.artifact.path,
    });
  }
  if (input.plan.target.scope === "export-only") {
    return stops;
  }
  const exposurePath = exposureManifestPath(input.plan, input.surfaceResolution);
  const exposureAbsolutePath = absoluteManagedPath(input.repoRoot, input.homeDir, exposurePath);
  if (existsSync(exposureAbsolutePath)) {
    const stats = lstatSync(exposureAbsolutePath);
    if (!stats.isSymbolicLink()) {
      stops.push({
        reason: "ownership-review-required",
        message: `Existing harness exposure at ${exposurePath} requires reviewed overwrite.`,
        path: exposurePath,
      });
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

function writeManagedText(input: {
  repoRoot: string;
  homeDir: string;
  relativePath: string;
  content: string;
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
}

function writeExposure(input: {
  repoRoot: string;
  homeDir: string;
  plan: PlaybookPackagePlan;
  artifact: GeneratedArtifactPlan;
  surfaceResolution: PackageSurfaceResolution;
  content: string;
  reviewedOverwrite: boolean;
}): void {
  if (input.surfaceResolution.exposureMode === "copy-mirror") {
    writeManagedText({
      repoRoot: input.repoRoot,
      homeDir: input.homeDir,
      relativePath: copyMirrorFilePath(input.surfaceResolution, input.artifact),
      content: input.content,
      reviewedOverwrite: input.reviewedOverwrite,
    });
    return;
  }
  if (input.surfaceResolution.exposureMode !== "symlink") {
    return;
  }

  const exposurePath = exposureManifestPath(input.plan, input.surfaceResolution);
  const exposureAbsolutePath = absoluteManagedPath(input.repoRoot, input.homeDir, exposurePath);
  const canonicalDirectory = path.dirname(absoluteManagedPath(input.repoRoot, input.homeDir, input.artifact.path));
  if (existsSync(exposureAbsolutePath)) {
    if (!input.reviewedOverwrite && !lstatSync(exposureAbsolutePath).isSymbolicLink()) {
      throw new OperationError(`Refusing to replace non-symlink exposure at ${exposurePath}.`);
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
  artifact: GeneratedArtifactPlan;
  content: string;
  canonicalPath: string;
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
    manifest.skillFiles = Array.from(new Set([
      ...manifest.skillFiles,
      input.canonicalPath,
      exposureManifestPath(input.plan, input.surfaceResolution),
    ])).sort();
  }
  manifest.updatedAt = new Date().toISOString();
  writeManifest(input.repoRoot, manifest);
  return true;
}

function createManifestEntries(input: {
  plan: PlaybookPackagePlan;
  artifact: GeneratedArtifactPlan;
  content: string;
  canonicalPath: string;
  surfaceResolution: PackageSurfaceResolution;
}): Record<string, ManifestFileEntry> {
  const artifactKind: AgenticArtifactKind = input.plan.target.outputKind === "plugin" ? "plugin" : "skill";
  const canonicalRole: AgenticFileRole = artifactKind === "plugin" ? "plugin-payload" : "shared-payload";
  const canonicalEntry: ManifestFileEntry = {
    hash: hashText(input.content),
    sourceId: sourceId(input.plan, "payload", input.canonicalPath),
    agenticOwnership: ownership({
      plan: input.plan,
      artifactKind,
      role: canonicalRole,
      pathKind: "file",
      canonicalPayloadPath: input.canonicalPath,
    }),
  };
  const exposurePath = exposureManifestPath(input.plan, input.surfaceResolution);
  const exposureRole: AgenticFileRole = exposureRoleFor(input.plan, input.surfaceResolution);
  const exposurePathKind: AgenticPathKind = input.surfaceResolution.exposureMode === "symlink"
    ? "directory"
    : "file";
  return {
    [input.canonicalPath]: canonicalEntry,
    [exposurePath]: {
      hash: input.surfaceResolution.exposureMode === "symlink"
        ? hashText(JSON.stringify({
            target: input.canonicalPath,
            mode: input.surfaceResolution.exposureMode,
          }))
        : hashText(input.content),
      sourceId: sourceId(input.plan, input.surfaceResolution.exposureMode, exposurePath),
      agenticOwnership: ownership({
        plan: input.plan,
        artifactKind,
        role: exposureRole,
        pathKind: exposurePathKind,
        canonicalPayloadPath: input.canonicalPath,
        exposurePath,
        exposureMode: input.surfaceResolution.exposureMode === "export-only"
          ? undefined
          : input.surfaceResolution.exposureMode,
      }),
    },
  };
}

function createGeneratedOutputRecords(input: {
  plan: PlaybookPackagePlan;
  artifact: GeneratedArtifactPlan;
  canonicalPath: string;
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
      path: input.canonicalPath,
    }));
    return records;
  }
  records.push(validateGeneratedOutputRecord({
    ...base,
    recordKind: input.artifact.recordKind,
    path: input.canonicalPath,
  }));
  records.push(validateGeneratedOutputRecord({
    ...base,
    recordKind: input.surfaceResolution.exposureMode === "copy-mirror"
      ? "copy-mirror"
      : "symlink-exposure",
    path: exposureManifestPath(input.plan, input.surfaceResolution),
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

function renderPackageContent(plan: PlaybookPackagePlan): string {
  if (plan.target.outputKind === "plugin") {
    return `${JSON.stringify({
      schemaVersion: 1,
      kind: "make-docs.playbook-package.plugin",
      packageId: plan.packageId,
      title: plan.title,
      summary: plan.summary,
      target: plan.target,
      sources: plan.sources.map((source) => ({
        ref: source.ref,
        path: source.path,
        digest: source.sourceDigest,
        stack: source.stack,
      })),
      support: plan.support,
      lifecycle: plan.lifecycle,
      validationRequirements: plan.validationRequirements,
      generatedBy: "make-docs",
    }, null, 2)}\n`;
  }
  return [
    "---",
    `name: ${plan.packageId}`,
    `description: ${quoteYaml(plan.summary)}`,
    "makeDocsGenerated: true",
    `makeDocsPackageId: ${plan.packageId}`,
    `makeDocsOutputKind: ${plan.target.outputKind}`,
    `makeDocsTargetHarness: ${plan.target.harness}`,
    `makeDocsTargetSurface: ${plan.target.surface}`,
    `makeDocsTargetScope: ${plan.target.scope}`,
    "sourcePlaybooks:",
    ...plan.sources.map((source) => `  - ref: ${source.ref}`),
    "---",
    "",
    `# ${plan.title}`,
    "",
    plan.summary,
    "",
    "## Source Playbooks",
    "",
    ...plan.sources.map((source) => `- ${source.ref} (${source.sourceDigest})`),
    "",
  ].join("\n");
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
  canonicalPath: string;
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
    `Canonical output: ${input.canonicalPath}`,
    ...(input.exposurePath ? [`Harness exposure: ${input.exposurePath} (${input.exposureMode})`] : []),
    `Writes executed: ${input.write && input.stops.length === 0 ? "yes" : "no"}`,
    `Manifest updated: ${input.manifestUpdated ? "yes" : "no"}`,
    ...input.stops.map((stop) => `Stop: ${stop.reason} - ${stop.message}`),
  ];
}

function exposureManifestPath(
  plan: PlaybookPackagePlan,
  surfaceResolution: PackageSurfaceResolution,
): string {
  if (surfaceResolution.exposureMode === "copy-mirror") {
    return copyMirrorFilePath(surfaceResolution, primaryGeneratedArtifact(plan));
  }
  if (surfaceResolution.path.endsWith("/SKILL.md") || surfaceResolution.path.endsWith("/plugin.json")) {
    return normalizeRelativePath(path.dirname(surfaceResolution.path));
  }
  return surfaceResolution.path;
}

function copyMirrorFilePath(
  surfaceResolution: PackageSurfaceResolution,
  artifact: GeneratedArtifactPlan,
): string {
  if (surfaceResolution.path.endsWith("/SKILL.md") || surfaceResolution.path.endsWith("/plugin.json")) {
    return surfaceResolution.path;
  }
  return normalizeRelativePath(path.join(surfaceResolution.path, path.basename(artifact.path)));
}

function exposureRoleFor(
  plan: PlaybookPackagePlan,
  surfaceResolution: PackageSurfaceResolution,
): AgenticFileRole {
  if (plan.target.outputKind === "plugin") {
    return surfaceResolution.exposureMode === "copy-mirror"
      ? "plugin-copy-mirror"
      : "plugin-native-exposure";
  }
  return surfaceResolution.exposureMode === "copy-mirror" ? "copy-mirror" : "native-exposure";
}

function ownership(input: {
  plan: PlaybookPackagePlan;
  artifactKind: AgenticArtifactKind;
  role: AgenticFileRole;
  pathKind: AgenticPathKind;
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
      ? { scope: input.plan.target.scope as AgenticScope }
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

function normalizePathForManifest(value: string, _repoRoot: string, homeDir: string): string {
  if (value.startsWith("<user-home>/")) {
    return normalizeRelativePath(path.join(homeDir, value.slice("<user-home>/".length)));
  }
  if (path.isAbsolute(value)) {
    return normalizeRelativePath(value);
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

function quoteYaml(value: string): string {
  return JSON.stringify(value);
}

function isKnownHarness(value: string): value is Harness {
  return (HARNESSES as readonly string[]).includes(value);
}
