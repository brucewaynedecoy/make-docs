import { Buffer } from "node:buffer";
import { loadInstalledSystemResourceProvider } from "./operations/resource/provider";
import {
  SYSTEM_RESOURCE_TYPE_DIRECTORIES,
  type SystemResourceProviderInventory,
} from "./operations/resource/types";
import type {
  InstallProfile,
  ManifestFileEntry,
  PlannedAction,
  ProjectResourceType,
  ResolvedAsset,
  ResourceProjectionManifestState,
} from "./types";
import { HARNESS_TO_INSTRUCTION } from "./types";
import { parseManagedBlock } from "./managed-block";
import { readPackageFile } from "./utils";

const P4_OPERATION_LINEAGE = "W19 R1 P4" as const;

export function normalizeProjectResourceSelection(
  values: readonly ProjectResourceType[],
): ProjectResourceType[] {
  return Array.from(new Set(values)).sort(compareCodeUnits);
}

export function buildSelectedResourceProjection(options: {
  profile: InstallProfile;
  selectionTrigger: "setup-selection" | "reconfigure-selection";
  provider?: SystemResourceProviderInventory;
}): {
  assets: ResolvedAsset[];
  state: ResourceProjectionManifestState;
} {
  const selectedTypes = normalizeProjectResourceSelection(
    options.profile.selections.resourceProjection ?? [],
  );
  const provider = options.provider ?? unwrapProvider(loadInstalledSystemResourceProvider());
  const selectedSet = new Set<ProjectResourceType>(selectedTypes);
  const selectedResources = provider.resources
    .filter((resource) => selectedSet.has(resource.identity.type))
    .sort((left, right) => compareCodeUnits(left.identity.uri, right.identity.uri));
  const assets = selectedResources.map((resource): ResolvedAsset => {
    const managedDestination = projectionPath(
      resource.identity.type,
      resource.identity.path,
    );
    return {
      relativePath: managedDestination,
      assetClass: "scoped-static",
      sourceId: `resource:${resource.identity.uri}`,
      content: Buffer.from(resource.readContent()).toString("utf8"),
    };
  });
  const resources = Object.fromEntries(
    selectedResources.map((resource) => {
      const managedDestination = projectionPath(
        resource.identity.type,
        resource.identity.path,
      );
      return [
        resource.identity.uri,
        {
          uri: resource.identity.uri,
          type: resource.identity.type,
          resourcePath: resource.identity.path,
          managedDestination,
          ownershipClass: "managed-projection" as const,
          provenanceState: "verified" as const,
          providerPackage: provider.provider.identity.packageName,
          providerVersion: provider.provider.identity.version,
          providerImmutableRef: provider.provider.identity.immutableRef,
          sourceDigest: resource.digest,
          installedDigest: resource.digest,
          hashAlgorithm: "sha256" as const,
          selectionTrigger: options.selectionTrigger,
          operationLineage: P4_OPERATION_LINEAGE,
          competingClaims: [],
        },
      ];
    }),
  );
  return {
    assets,
    state: {
      selectedTypes,
      provider: {
        ownershipClass: "installed-provider",
        provenanceState: "verified",
        packageName: provider.provider.identity.packageName,
        version: provider.provider.identity.version,
        immutableRef: provider.provider.identity.immutableRef,
        inventoryDigest: provider.provider.inventoryDigest,
      },
      resources,
    },
  };
}

export function createThinRouterAssets(profile: InstallProfile): ResolvedAsset[] {
  const assets: ResolvedAsset[] = [];
  for (const [harness, instructionKind] of Object.entries(HARNESS_TO_INSTRUCTION)) {
    if (!profile.selections.harnesses[harness as keyof typeof HARNESS_TO_INSTRUCTION]) {
      continue;
    }
    for (const relativePath of [instructionKind, `docs/${instructionKind}`]) {
      assets.push({
        relativePath,
        assetClass: "scoped-static",
        sourceId: `router:${harness}:${relativePath}`,
        content: readThinRouterContent(relativePath),
      });
    }
  }
  return assets.sort((left, right) => compareCodeUnits(left.relativePath, right.relativePath));
}

export function applyP4ManifestOwnership(
  relativePath: string,
  entry: ManifestFileEntry,
): ManifestFileEntry {
  if (relativePath === "AGENTS.md" || relativePath === "CLAUDE.md" || /\/AGENTS\.md$|\/CLAUDE\.md$/.test(relativePath)) {
    return { ...entry, ownershipClass: "managed-block" };
  }
  if (entry.skillExposure || entry.agenticOwnership) {
    return { ...entry, ownershipClass: "selected-skill" };
  }
  if (entry.sourceId.startsWith("resource:")) {
    return { ...entry, ownershipClass: "managed-projection" };
  }
  return { ...entry, ownershipClass: "managed-snapshot" };
}

export function resourceProjectionStops(
  actions: readonly PlannedAction[],
): string[] {
  return actions
    .filter(
      (action) =>
        action.sourceId?.startsWith("resource:") &&
        (action.type === "skip-conflict" || action.type === "update-conflict"),
    )
    .map((action) => action.relativePath)
    .sort(compareCodeUnits);
}

export function getThinRouterManagedBody(relativePath: string): string {
  const parsed = parseManagedBlock(readThinRouterContent(relativePath));
  if (parsed.state !== "valid" || parsed.body === null) {
    throw new Error(`Upstream thin router is malformed: ${relativePath}.`);
  }
  return parsed.body;
}

function readThinRouterContent(relativePath: string): string {
  if (!/^(?:docs\/)?(?:AGENTS|CLAUDE)\.md$/.test(relativePath)) {
    throw new Error(`Unsupported thin router path: ${relativePath}.`);
  }
  const content = readPackageFile(relativePath);
  const parsed = parseManagedBlock(content);
  if (
    parsed.state !== "valid" ||
    parsed.prefix.trim() !== "" ||
    parsed.suffix.trim() !== ""
  ) {
    throw new Error(`Upstream thin router must contain one managed block: ${relativePath}.`);
  }
  return content;
}

function projectionPath(type: ProjectResourceType, resourcePath: string): string {
  return `.make-docs/system/${SYSTEM_RESOURCE_TYPE_DIRECTORIES[type]}/${resourcePath}`;
}

function unwrapProvider(
  result: ReturnType<typeof loadInstalledSystemResourceProvider>,
): SystemResourceProviderInventory {
  if (!result.ok) {
    throw new Error(
      `Installed system-resource provider is unavailable: ${result.error.message}`,
    );
  }
  return result.value;
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
