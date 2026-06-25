import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createAuditReport } from "./audit";
import { parseManagedBlock } from "./managed-block";
import { getManifestFileHash, getManifestPath, loadManifest } from "./manifest";
import type {
  AuditReport,
  CompatibilityDisposition,
  CompatibilitySourceState,
  InstallManifest,
  ManifestFileEntry,
  ManifestSystemAssetEntry,
} from "./types";

export interface CompatibilityClassification {
  state: CompatibilitySourceState;
  disposition: CompatibilityDisposition;
  targetDir: string;
  manifestPath: string;
  auditReport: AuditReport | null;
  evidence: CompatibilityEvidence;
  printableEvidence: string[];
}

export interface CompatibilityEvidence {
  manifestTrust: {
    present: boolean;
    parseable: boolean;
    schemaVersion: number | null;
    packageIdentityTrusted: boolean;
    selectionsTrusted: boolean;
    managedFileRecordsTrusted: boolean;
    skillRecordsTrusted: boolean;
    materializationProvenanceTrusted: boolean;
    reasons: string[];
  };
  filesystemTrust: {
    managedFilesMatch: boolean;
    managedBlocksValid: boolean;
    recognizableManagedPaths: string[];
    modifiedPaths: string[];
    missingPaths: string[];
    ambiguousFallbackPaths: string[];
    nonMakeDocsPathCollisions: string[];
    reasons: string[];
  };
  bootstrapTrust: {
    requiredLocalBootstrapPresent: boolean;
    missingBootstrapPaths: string[];
    reasons: string[];
  };
  skillTrust: {
    selectedSkillsTrusted: boolean;
    missingSkillOutputs: string[];
    modifiedSkillOutputs: string[];
    reasons: string[];
  };
  providerCacheTrust: {
    mode: InstallManifest["systemAssetMaterialization"]["mode"] | null;
    trusted: boolean;
    providerAvailable: boolean;
    cacheUsable: boolean;
    staleHashes: string[];
    reasons: string[];
  };
}

interface RawManifestRead {
  present: boolean;
  parseable: boolean;
  schemaVersion: number | null;
  manifest: InstallManifest | null;
  errorMessage?: string;
}

const STATE_DISPOSITIONS = {
  "clean-v1": "migrate",
  "clean-v2-full-snapshot": "sync",
  "clean-v2-provider-backed": "sync",
  "clean-v2-hybrid-pinned-cache": "sync",
  "modified-v1": "migrate-with-review",
  "partial-install": "migrate-with-review",
  "malformed-manifest": "backup-and-reinstall",
  "missing-manifest-recognizable": "migrate-with-review",
  "unknown-shape": "manual-review-required",
} as const satisfies Record<CompatibilitySourceState, CompatibilityDisposition>;

const CANONICAL_FALLBACK_PATHS = [
  "AGENTS.md",
  "CLAUDE.md",
  "docs/AGENTS.md",
  "docs/CLAUDE.md",
  "docs/assets/AGENTS.md",
  "docs/assets/artifacts/AGENTS.md",
  "docs/assets/archive/AGENTS.md",
  "docs/assets/library/AGENTS.md",
  ".make-docs/references/system/lifecycle.md",
  ".make-docs/contracts/system/guide-contract.md",
  ".make-docs/templates/system/history-record.md",
] as const;

const OPTIONAL_LOCAL_BOOTSTRAP_PATHS = new Set([
  ".make-docs/config.yaml",
  ".make-docs/contracts/custom",
  ".make-docs/references/custom",
  ".make-docs/scripts/custom",
  ".make-docs/templates/custom",
]);

const NON_PRODUCT_AGENT_FILENAMES = new Set(["AGENTS.md", "CLAUDE.md"]);

export async function classifyCompatibilityState(options: {
  targetDir: string;
  homeDir?: string;
}): Promise<CompatibilityClassification> {
  const targetDir = path.resolve(options.targetDir);
  const homeDir = path.resolve(options.homeDir ?? os.homedir());
  const manifestPath = getManifestPath(targetDir);
  const rawManifest = readRawManifest(targetDir);

  if (!rawManifest.present) {
    return classifyManifestMissing({ targetDir, homeDir, manifestPath });
  }

  if (!rawManifest.parseable || rawManifest.manifest === null) {
    return classifyMalformedManifest({
      targetDir,
      homeDir,
      manifestPath,
      rawManifest,
    });
  }

  return classifyManifestPresent({
    targetDir,
    homeDir,
    manifestPath,
    rawManifest,
    manifest: rawManifest.manifest,
  });
}

export function formatCompatibilityClassification(
  classification: CompatibilityClassification,
): string[] {
  return classification.printableEvidence;
}

function classifyManifestPresent(options: {
  targetDir: string;
  homeDir: string;
  manifestPath: string;
  rawManifest: RawManifestRead;
  manifest: InstallManifest;
}): Promise<CompatibilityClassification> {
  return classifyManifestPresentAsync(options);
}

async function classifyManifestPresentAsync(options: {
  targetDir: string;
  homeDir: string;
  manifestPath: string;
  rawManifest: RawManifestRead;
  manifest: InstallManifest;
}): Promise<CompatibilityClassification> {
  const { targetDir, homeDir, manifestPath, rawManifest, manifest } = options;
  const auditReport = await createAuditReport({
    targetDir,
    homeDir,
    manifest,
  });
  const filesystemTrust = evaluateFilesystemTrust(targetDir, manifest);
  const bootstrapTrust = evaluateBootstrapTrust(targetDir, manifest);
  const skillTrust = evaluateSkillTrust(targetDir, manifest, filesystemTrust);
  const providerCacheTrust = evaluateProviderCacheTrust(manifest);
  const manifestTrust = {
    present: true,
    parseable: true,
    schemaVersion: rawManifest.schemaVersion,
    packageIdentityTrusted: Boolean(manifest.packageName && manifest.packageVersion),
    selectionsTrusted: manifest.selections !== null,
    managedFileRecordsTrusted: Object.keys(manifest.files).length > 0,
    skillRecordsTrusted: Array.isArray(manifest.skillFiles),
    materializationProvenanceTrusted: providerCacheTrust.trusted,
    reasons: [] as string[],
  };

  pushReason(
    manifestTrust.reasons,
    manifestTrust.packageIdentityTrusted,
    "Manifest package identity is present.",
    "Manifest package identity is missing.",
  );
  pushReason(
    manifestTrust.reasons,
    manifestTrust.managedFileRecordsTrusted,
    "Manifest includes managed-file records.",
    "Manifest has no managed-file records.",
  );
  pushReason(
    manifestTrust.reasons,
    manifestTrust.materializationProvenanceTrusted,
    "System asset provenance is trusted.",
    "System asset provenance is incomplete or unavailable.",
  );

  const trustedFilesystem =
    filesystemTrust.managedFilesMatch &&
    filesystemTrust.managedBlocksValid &&
    bootstrapTrust.requiredLocalBootstrapPresent &&
    skillTrust.selectedSkillsTrusted;
  const schemaVersion = rawManifest.schemaVersion;
  const mode = manifest.systemAssetMaterialization?.mode ?? "full-snapshot";

  let state: CompatibilitySourceState;
  if (!trustedFilesystem) {
    state = schemaVersion === 1 ? "modified-v1" : "partial-install";
  } else if (!providerCacheTrust.trusted) {
    state = "partial-install";
  } else if (schemaVersion === 1) {
    state = "clean-v1";
  } else if (mode === "provider-backed") {
    state = "clean-v2-provider-backed";
  } else if (mode === "hybrid-pinned-cache") {
    state = "clean-v2-hybrid-pinned-cache";
  } else {
    state = "clean-v2-full-snapshot";
  }

  return createClassification({
    state,
    disposition: STATE_DISPOSITIONS[state],
    targetDir,
    manifestPath,
    auditReport,
    evidence: {
      manifestTrust,
      filesystemTrust,
      bootstrapTrust,
      skillTrust,
      providerCacheTrust,
    },
  });
}

async function classifyManifestMissing(options: {
  targetDir: string;
  homeDir: string;
  manifestPath: string;
}): Promise<CompatibilityClassification> {
  const { targetDir, homeDir, manifestPath } = options;
  const auditReport = await createAuditReport({
    targetDir,
    homeDir,
    manifest: null,
  });
  const fallback = evaluateFallbackRecognition(targetDir);
  const state: CompatibilitySourceState =
    fallback.recognizableManagedPaths.length > 0
      ? "missing-manifest-recognizable"
      : "unknown-shape";
  const disposition: CompatibilityDisposition =
    state === "missing-manifest-recognizable" && fallback.ambiguousFallbackPaths.length > 0
      ? "backup-and-reinstall"
      : STATE_DISPOSITIONS[state];

  return createClassification({
    state,
    disposition,
    targetDir,
    manifestPath,
    auditReport,
    evidence: createFallbackEvidence({
      present: false,
      parseable: false,
      schemaVersion: null,
      fallback,
      manifestReason: "Manifest is missing.",
    }),
  });
}

async function classifyMalformedManifest(options: {
  targetDir: string;
  homeDir: string;
  manifestPath: string;
  rawManifest: RawManifestRead;
}): Promise<CompatibilityClassification> {
  const { targetDir, homeDir, manifestPath, rawManifest } = options;
  const auditReport = await createAuditReport({
    targetDir,
    homeDir,
    manifest: null,
  });
  const fallback = evaluateFallbackRecognition(targetDir);
  const disposition: CompatibilityDisposition =
    fallback.recognizableManagedPaths.length > 0
      ? "backup-and-reinstall"
      : "manual-review-required";

  return createClassification({
    state: "malformed-manifest",
    disposition,
    targetDir,
    manifestPath,
    auditReport,
    evidence: createFallbackEvidence({
      present: true,
      parseable: false,
      schemaVersion: rawManifest.schemaVersion,
      fallback,
      manifestReason:
        rawManifest.errorMessage ?? "Manifest exists but could not be trusted.",
    }),
  });
}

function evaluateFilesystemTrust(
  targetDir: string,
  manifest: InstallManifest,
): CompatibilityEvidence["filesystemTrust"] {
  const modifiedPaths: string[] = [];
  const missingPaths: string[] = [];
  const malformedManagedBlockPaths: string[] = [];

  for (const [relativePath, entry] of Object.entries(manifest.files)) {
    const absolutePath = path.join(targetDir, relativePath);
    if (!existsSync(absolutePath)) {
      missingPaths.push(relativePath);
      continue;
    }

    const content = readFileSync(absolutePath, "utf8");
    const currentHash = getManifestFileHash(relativePath, content);
    if (currentHash === null) {
      malformedManagedBlockPaths.push(relativePath);
      continue;
    }

    if (!manifestEntryMatches(entry, currentHash)) {
      modifiedPaths.push(relativePath);
    }
  }

  const reasons: string[] = [];
  pushReason(
    reasons,
    missingPaths.length === 0,
    "All manifest-managed files are present.",
    `Missing managed files: ${missingPaths.join(", ")}.`,
  );
  pushReason(
    reasons,
    modifiedPaths.length === 0,
    "Manifest-managed file hashes match.",
    `Modified managed files: ${modifiedPaths.join(", ")}.`,
  );
  pushReason(
    reasons,
    malformedManagedBlockPaths.length === 0,
    "Managed instruction blocks are parseable.",
    `Malformed managed blocks: ${malformedManagedBlockPaths.join(", ")}.`,
  );

  return {
    managedFilesMatch: modifiedPaths.length === 0 && missingPaths.length === 0,
    managedBlocksValid: malformedManagedBlockPaths.length === 0,
    recognizableManagedPaths: Object.keys(manifest.files).sort(),
    modifiedPaths,
    missingPaths,
    ambiguousFallbackPaths: [],
    nonMakeDocsPathCollisions: [],
    reasons,
  };
}

function evaluateBootstrapTrust(
  targetDir: string,
  manifest: InstallManifest,
): CompatibilityEvidence["bootstrapTrust"] {
  const localBootstrapPaths =
    manifest.systemAssetMaterialization?.localBootstrapPaths ?? [];
  const missingBootstrapPaths = localBootstrapPaths.filter(
    (relativePath) =>
      !OPTIONAL_LOCAL_BOOTSTRAP_PATHS.has(relativePath) &&
      !existsSync(path.join(targetDir, relativePath)),
  );
  const reasons: string[] = [];
  pushReason(
    reasons,
    missingBootstrapPaths.length === 0,
    "Required local bootstrap files are present.",
    `Missing local bootstrap files: ${missingBootstrapPaths.join(", ")}.`,
  );
  return {
    requiredLocalBootstrapPresent: missingBootstrapPaths.length === 0,
    missingBootstrapPaths,
    reasons,
  };
}

function evaluateSkillTrust(
  targetDir: string,
  manifest: InstallManifest,
  filesystemTrust: CompatibilityEvidence["filesystemTrust"],
): CompatibilityEvidence["skillTrust"] {
  const missingSkillOutputs = manifest.skillFiles.filter(
    (relativePath) => !existsSync(path.join(targetDir, relativePath)),
  );
  const skillFileSet = new Set(manifest.skillFiles);
  const modifiedSkillOutputs = filesystemTrust.modifiedPaths.filter((relativePath) =>
    skillFileSet.has(relativePath),
  );
  const reasons: string[] = [];
  pushReason(
    reasons,
    missingSkillOutputs.length === 0,
    "Selected skill outputs are present.",
    `Missing selected skill outputs: ${missingSkillOutputs.join(", ")}.`,
  );
  pushReason(
    reasons,
    modifiedSkillOutputs.length === 0,
    "Selected skill outputs match manifest records.",
    `Modified selected skill outputs: ${modifiedSkillOutputs.join(", ")}.`,
  );
  return {
    selectedSkillsTrusted:
      missingSkillOutputs.length === 0 && modifiedSkillOutputs.length === 0,
    missingSkillOutputs,
    modifiedSkillOutputs,
    reasons,
  };
}

function evaluateProviderCacheTrust(
  manifest: InstallManifest,
): CompatibilityEvidence["providerCacheTrust"] {
  const materialization = manifest.systemAssetMaterialization;
  const mode = materialization?.mode ?? null;
  const assets = Object.values(materialization?.assets ?? {});
  const requiresRemoteEvidence =
    mode === "provider-backed" || mode === "hybrid-pinned-cache";
  const providerAvailable =
    !requiresRemoteEvidence ||
    assets.every((asset) => isProviderEvidenceAvailable(asset));
  const staleHashes = assets
    .flatMap((asset) => asset.expectedHashes)
    .filter((hash) => hash.includes("stale"));
  const cacheUsable = mode !== "hybrid-pinned-cache" || staleHashes.length === 0;
  const hasPinnedHashes =
    !requiresRemoteEvidence ||
    assets.length > 0 && assets.every((asset) => asset.expectedHashes.length > 0);
  const trusted =
    mode !== null && providerAvailable && cacheUsable && hasPinnedHashes;
  const reasons: string[] = [];

  pushReason(
    reasons,
    mode !== null,
    `Materialization mode is ${mode}.`,
    "Materialization mode is missing.",
  );
  pushReason(
    reasons,
    providerAvailable,
    "Provider evidence is available or not required.",
    "Provider evidence is unavailable.",
  );
  pushReason(
    reasons,
    cacheUsable,
    "Pinned cache hashes are current or not required.",
    `Stale pinned cache hashes: ${staleHashes.join(", ")}.`,
  );
  pushReason(
    reasons,
    hasPinnedHashes,
    "Remote materialization assets include pinned hashes.",
    "Remote materialization assets are missing pinned hashes.",
  );

  return {
    mode,
    trusted,
    providerAvailable,
    cacheUsable,
    staleHashes,
    reasons,
  };
}

function createFallbackEvidence(options: {
  present: boolean;
  parseable: boolean;
  schemaVersion: number | null;
  fallback: ReturnType<typeof evaluateFallbackRecognition>;
  manifestReason: string;
}): CompatibilityEvidence {
  const { fallback } = options;
  return {
    manifestTrust: {
      present: options.present,
      parseable: options.parseable,
      schemaVersion: options.schemaVersion,
      packageIdentityTrusted: false,
      selectionsTrusted: false,
      managedFileRecordsTrusted: false,
      skillRecordsTrusted: false,
      materializationProvenanceTrusted: false,
      reasons: [options.manifestReason],
    },
    filesystemTrust: {
      managedFilesMatch: false,
      managedBlocksValid: fallback.ambiguousFallbackPaths.length === 0,
      recognizableManagedPaths: fallback.recognizableManagedPaths,
      modifiedPaths: [],
      missingPaths: [],
      ambiguousFallbackPaths: fallback.ambiguousFallbackPaths,
      nonMakeDocsPathCollisions: fallback.nonMakeDocsPathCollisions,
      reasons: fallback.reasons,
    },
    bootstrapTrust: {
      requiredLocalBootstrapPresent: false,
      missingBootstrapPaths: [],
      reasons: ["Bootstrap trust requires a trusted manifest."],
    },
    skillTrust: {
      selectedSkillsTrusted: false,
      missingSkillOutputs: [],
      modifiedSkillOutputs: [],
      reasons: ["Skill trust requires a trusted manifest."],
    },
    providerCacheTrust: {
      mode: null,
      trusted: false,
      providerAvailable: false,
      cacheUsable: false,
      staleHashes: [],
      reasons: ["Provider/cache trust requires a trusted manifest."],
    },
  };
}

function evaluateFallbackRecognition(targetDir: string): {
  recognizableManagedPaths: string[];
  ambiguousFallbackPaths: string[];
  nonMakeDocsPathCollisions: string[];
  reasons: string[];
} {
  const recognizableManagedPaths: string[] = [];
  const ambiguousFallbackPaths: string[] = [];
  const nonMakeDocsPathCollisions: string[] = [];

  for (const relativePath of CANONICAL_FALLBACK_PATHS) {
    const absolutePath = path.join(targetDir, relativePath);
    if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
      continue;
    }
    const content = readFileSync(absolutePath, "utf8");
    if (looksCanonicalMakeDocsContent(relativePath, content)) {
      recognizableManagedPaths.push(relativePath);
    } else {
      ambiguousFallbackPaths.push(relativePath);
    }
  }

  for (const relativePath of walkFiles(targetDir)) {
    if (
      !CANONICAL_FALLBACK_PATHS.includes(
        relativePath as (typeof CANONICAL_FALLBACK_PATHS)[number],
      ) &&
      NON_PRODUCT_AGENT_FILENAMES.has(path.basename(relativePath)) &&
      !looksCanonicalMakeDocsContent(
        relativePath,
        readFileSync(path.join(targetDir, relativePath), "utf8"),
      )
    ) {
      nonMakeDocsPathCollisions.push(relativePath);
    }
  }

  const reasons: string[] = [];
  pushReason(
    reasons,
    recognizableManagedPaths.length > 0,
    `Recognized make-docs fallback paths: ${recognizableManagedPaths.join(", ")}.`,
    "No canonical make-docs fallback paths were recognized.",
  );
  if (ambiguousFallbackPaths.length > 0) {
    reasons.push(`Ambiguous fallback paths: ${ambiguousFallbackPaths.join(", ")}.`);
  }
  if (nonMakeDocsPathCollisions.length > 0) {
    reasons.push(
      `Non-make-docs path collisions: ${nonMakeDocsPathCollisions.join(", ")}.`,
    );
  }

  return {
    recognizableManagedPaths: recognizableManagedPaths.sort(),
    ambiguousFallbackPaths: ambiguousFallbackPaths.sort(),
    nonMakeDocsPathCollisions: nonMakeDocsPathCollisions.sort(),
    reasons,
  };
}

function readRawManifest(targetDir: string): RawManifestRead {
  const manifestPath = getManifestPath(targetDir);
  if (!existsSync(manifestPath)) {
    return {
      present: false,
      parseable: false,
      schemaVersion: null,
      manifest: null,
    };
  }

  try {
    const raw = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      schemaVersion?: unknown;
    };
    return {
      present: true,
      parseable: true,
      schemaVersion:
        typeof raw.schemaVersion === "number" ? raw.schemaVersion : null,
      manifest: loadManifest(targetDir),
    };
  } catch (error) {
    return {
      present: true,
      parseable: false,
      schemaVersion: null,
      manifest: null,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

function createClassification(options: {
  state: CompatibilitySourceState;
  disposition: CompatibilityDisposition;
  targetDir: string;
  manifestPath: string;
  auditReport: AuditReport | null;
  evidence: CompatibilityEvidence;
}): CompatibilityClassification {
  const printableEvidence = [
    `state=${options.state}`,
    `disposition=${options.disposition}`,
    ...options.evidence.manifestTrust.reasons.map((reason) => `manifest: ${reason}`),
    ...options.evidence.filesystemTrust.reasons.map(
      (reason) => `filesystem: ${reason}`,
    ),
    ...options.evidence.bootstrapTrust.reasons.map(
      (reason) => `bootstrap: ${reason}`,
    ),
    ...options.evidence.skillTrust.reasons.map((reason) => `skills: ${reason}`),
    ...options.evidence.providerCacheTrust.reasons.map(
      (reason) => `provider-cache: ${reason}`,
    ),
  ];

  return {
    ...options,
    printableEvidence,
  };
}

function manifestEntryMatches(
  entry: ManifestFileEntry,
  currentHash: string,
): boolean {
  return entry.hash === currentHash;
}

function isProviderEvidenceAvailable(asset: ManifestSystemAssetEntry): boolean {
  return Boolean(
    asset.sourceProvider &&
      !asset.sourceProvider.includes("unavailable") &&
      asset.sourceVersion &&
      asset.sourceImmutableRef &&
      asset.expectedHashes.length > 0,
  );
}

function looksCanonicalMakeDocsContent(relativePath: string, content: string): boolean {
  const parsed = parseManagedBlock(content);
  if (
    parsed.state === "valid" ||
    content.includes("make-docs") ||
    content.includes("Make Docs")
  ) {
    return true;
  }

  if (relativePath === ".make-docs/references/system/lifecycle.md") {
    return content.includes("# Lifecycle Anchor") && content.includes("## Lifecycle Arc");
  }

  if (relativePath === ".make-docs/templates/system/history-record.md") {
    return (
      content.includes("ONE_LINE_SUMMARY") &&
      content.includes("## Changes")
    );
  }

  return false;
}

function walkFiles(rootDir: string): string[] {
  if (!existsSync(rootDir)) {
    return [];
  }

  const result: string[] = [];
  const stack = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }
      if (entry.isFile()) {
        result.push(path.relative(rootDir, absolutePath).split(path.sep).join("/"));
      }
    }
  }
  return result.sort();
}

function pushReason(
  reasons: string[],
  condition: boolean,
  success: string,
  failure: string,
): void {
  reasons.push(condition ? success : failure);
}
