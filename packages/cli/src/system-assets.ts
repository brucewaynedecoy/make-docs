import type {
  ManifestHashAlgorithm,
  ManifestSystemAssetEntry,
  SystemAssetMaterializationClass,
  SystemAssetMaterializationMode,
  SystemAssetManifestState,
  SystemAssetSelectionTrigger,
} from "./types";
import { DEFAULT_SYSTEM_ASSET_MATERIALIZATION_MODE } from "./types";

const DEFAULT_RECOVERY_GUIDANCE =
  "Rerun make-docs to refresh local system asset provenance from the installed package. If provider-backed resolution is enabled internally, use a reviewed full-snapshot materialization path when provider or cache pins cannot be verified.";

export function createEmptySystemAssetManifestState(): SystemAssetManifestState {
  return {
    mode: DEFAULT_SYSTEM_ASSET_MATERIALIZATION_MODE,
    localBootstrapPaths: [],
    deferredSystemAssetPaths: [],
    materializationClasses: {},
    recoveryGuidance: DEFAULT_RECOVERY_GUIDANCE,
    assets: {},
  };
}

export function createSystemAssetManifestState(options: {
  mode: SystemAssetMaterializationMode;
  sourcePackage: string;
  sourceVersion: string;
  localBootstrapPaths: string[];
  deferredSystemAssetPaths: string[];
  materializationClasses: Record<string, SystemAssetMaterializationClass>;
  expectedFiles: Record<string, { hash: string; sourceId: string }>;
  materializedFiles: Record<string, { hash: string; sourceId: string }>;
}): SystemAssetManifestState {
  const sourceProvider = "package";
  const sourceImmutableRef = `package:${options.sourcePackage}@${options.sourceVersion}`;
  const assets = Object.fromEntries(
    Object.entries(options.materializationClasses).flatMap(
      ([logicalAssetId, materializationClass]) => {
        const expectedFile = options.expectedFiles[logicalAssetId];
        const materializedFile = options.materializedFiles[logicalAssetId];
        if (!expectedFile && !materializedFile) {
          return [];
        }

        return [
          [
            logicalAssetId,
            createManifestSystemAssetEntry({
              mode: options.mode,
              sourcePackage: options.sourcePackage,
              sourceProvider,
              sourceVersion: options.sourceVersion,
              sourceImmutableRef,
              logicalAssetId,
              materializationClass,
              expectedHash: expectedFile?.hash,
              localPath: materializedFile ? logicalAssetId : undefined,
            }),
          ],
        ];
      },
    ),
  );

  return {
    mode: options.mode,
    sourcePackage: options.sourcePackage,
    sourceProvider,
    sourceVersion: options.sourceVersion,
    sourceImmutableRef,
    hashAlgorithm: "sha256",
    localBootstrapPaths: [...options.localBootstrapPaths],
    deferredSystemAssetPaths: [...options.deferredSystemAssetPaths],
    materializationClasses: { ...options.materializationClasses },
    recoveryGuidance: DEFAULT_RECOVERY_GUIDANCE,
    assets,
  };
}

export function createManifestSystemAssetEntry(options: {
  mode: SystemAssetMaterializationMode;
  sourcePackage: string;
  sourceProvider: string;
  sourceVersion: string;
  sourceImmutableRef: string;
  logicalAssetId: string;
  materializationClass: SystemAssetMaterializationClass;
  expectedHash?: string;
  localPath?: string;
}): ManifestSystemAssetEntry {
  return {
    materializationMode: options.mode,
    sourcePackage: options.sourcePackage,
    sourceProvider: options.sourceProvider,
    sourceVersion: options.sourceVersion,
    sourceImmutableRef: options.sourceImmutableRef,
    hashAlgorithm: "sha256",
    expectedHashes: options.expectedHash ? [options.expectedHash] : [],
    logicalAssetId: options.logicalAssetId,
    ...(options.localPath ? { localPath: options.localPath } : {}),
    materializationClass: options.materializationClass,
    offlineExpectation: getOfflineExpectation(options.materializationClass),
    recoveryGuidance: DEFAULT_RECOVERY_GUIDANCE,
    selectionTrigger: getSelectionTrigger(options.materializationClass, options.mode),
  };
}

export function resolveSystemAssetMaterializationSafety(options: {
  logicalAssetId: string;
  materializationMode: SystemAssetMaterializationMode;
  sourceProvider?: string;
  sourceVersion?: string;
  sourceImmutableRef?: string;
  hashAlgorithm: ManifestHashAlgorithm;
  expectedHashes: string[];
  actualHash?: string;
  providerAvailable: boolean;
  cacheHit: boolean;
  reviewedFallbackAllowed: boolean;
}): { status: "provider-approved" | "reviewed-full-snapshot-fallback"; recoveryGuidance: string } {
  assertProviderPin(options);

  if (!options.providerAvailable || !options.cacheHit) {
    if (options.reviewedFallbackAllowed) {
      return {
        status: "reviewed-full-snapshot-fallback",
        recoveryGuidance: `Provider/cache state for ${options.logicalAssetId} is unavailable. Use the reviewed full-snapshot materialization path before writing files.`,
      };
    }

    throw new Error(
      `Provider/cache state for ${options.logicalAssetId} is unavailable. Failing closed; use a reviewed full-snapshot materialization path before writing files.`,
    );
  }

  if (!options.actualHash || !options.expectedHashes.includes(options.actualHash)) {
    throw new Error(
      `Provider/cache state for ${options.logicalAssetId} resolved a different asset version. Expected one of ${options.expectedHashes.join(", ")}; got ${options.actualHash ?? "missing hash"}. Use a reviewed full-snapshot materialization path before writing files.`,
    );
  }

  return {
    status: "provider-approved",
    recoveryGuidance: `Provider/cache pins for ${options.logicalAssetId} matched the expected sha256 hash set.`,
  };
}

function assertProviderPin(options: {
  logicalAssetId: string;
  sourceProvider?: string;
  sourceVersion?: string;
  sourceImmutableRef?: string;
  hashAlgorithm: ManifestHashAlgorithm;
  expectedHashes: string[];
}): void {
  if (!options.sourceProvider) {
    throw new Error(`Provider-backed system asset ${options.logicalAssetId} is missing a provider identity.`);
  }

  if (!options.sourceVersion && !options.sourceImmutableRef) {
    throw new Error(
      `Provider-backed system asset ${options.logicalAssetId} is missing a provider version or immutable ref.`,
    );
  }

  if (options.hashAlgorithm !== "sha256") {
    throw new Error(
      `Provider-backed system asset ${options.logicalAssetId} must use sha256 provenance hashes.`,
    );
  }

  if (options.expectedHashes.length === 0) {
    throw new Error(
      `Provider-backed system asset ${options.logicalAssetId} is missing an expected hash set.`,
    );
  }
}

function getOfflineExpectation(
  materializationClass: SystemAssetMaterializationClass,
): ManifestSystemAssetEntry["offlineExpectation"] {
  return materializationClass === "deferred-system-asset"
    ? "reviewed-full-snapshot-fallback"
    : "local";
}

function getSelectionTrigger(
  materializationClass: SystemAssetMaterializationClass,
  mode: SystemAssetMaterializationMode,
): SystemAssetSelectionTrigger {
  if (materializationClass === "always-local-bootstrap") {
    return "local-bootstrap";
  }

  return mode === DEFAULT_SYSTEM_ASSET_MATERIALIZATION_MODE
    ? "profile-selection"
    : "internal-materialization-mode";
}
