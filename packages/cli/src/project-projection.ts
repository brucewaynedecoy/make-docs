import { Buffer } from "node:buffer";
import { getManifestFileHash } from "./manifest";
import { loadInstalledSystemResourceProvider } from "./operations/resource/provider";
import {
  SYSTEM_RESOURCE_TYPE_DIRECTORIES,
  type SystemResourceProviderInventory,
} from "./operations/resource/types";
import type {
  InstallProfile,
  Harness,
  InstructionKind,
  ManifestFileEntry,
  ManifestRouterOwnershipEntry,
  PackageMeta,
  PlannedAction,
  ProjectResourceType,
  ResolvedAsset,
  ResourceProjectionManifestState,
  RouterOwnershipManifestState,
} from "./types";
import { HARNESS_TO_INSTRUCTION } from "./types";
import { parseManagedBlock } from "./managed-block";
import {
  getConfiguredRouterPaths,
  isConfiguredRouterPath,
} from "./router-paths";
import { readPackageFile } from "./utils";

const P4_OPERATION_LINEAGE = "W19 R1 P4" as const;
export type ProjectSurface = "archive" | "artifacts" | "assets";

export function normalizeProjectResourceSelection(
  values: readonly ProjectResourceType[],
): ProjectResourceType[] {
  return Array.from(new Set(values)).sort(compareCodeUnits);
}

export function buildSelectedResourceProjection(options: {
  profile: InstallProfile;
  selectionTrigger: "setup-selection" | "reconfigure-selection";
  provider?: SystemResourceProviderInventory;
  verifiedAt?: string;
  existingState?: ResourceProjectionManifestState;
}): {
  assets: ResolvedAsset[];
  state: ResourceProjectionManifestState;
} {
  const selectedTypes = normalizeProjectResourceSelection(
    options.profile.selections.resourceProjection ?? [],
  );
  const provider = options.provider ?? unwrapProvider(loadInstalledSystemResourceProvider());
  const verifiedAt = options.verifiedAt ?? new Date().toISOString();
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
      const previous = options.existingState?.resources[resource.identity.uri];
      const lastVerifiedAt = previous?.provenanceState === "verified" &&
        previous.providerPackage === provider.provider.identity.packageName &&
        previous.providerVersion === provider.provider.identity.version &&
        previous.providerImmutableRef === provider.provider.identity.immutableRef &&
        previous.sourceDigest === resource.digest &&
        previous.installedDigest === resource.digest
        ? previous.lastVerifiedAt
        : verifiedAt;
      return [
        resource.identity.uri,
        {
          uri: resource.identity.uri,
          type: resource.identity.type,
          resourcePath: resource.identity.path,
          managedDestination,
          ownershipClass: "managed-snapshot" as const,
          provenanceState: "verified" as const,
          providerPackage: provider.provider.identity.packageName,
          providerVersion: provider.provider.identity.version,
          providerImmutableRef: provider.provider.identity.immutableRef,
          materializationMode: "provider-backed-copy" as const,
          sourceDigest: resource.digest,
          installedDigest: resource.digest,
          hashAlgorithm: "sha256" as const,
          lastVerifiedAt,
          lifecycleDisposition: "active" as const,
          adoptionReceipt: null,
          selectionTrigger: options.selectionTrigger,
          operationLineage: P4_OPERATION_LINEAGE,
          provenanceEvidence: [
            `provider-inventory:sha256:${provider.provider.inventoryDigest}`,
            `resource:${resource.identity.uri}`,
          ],
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
    for (const relativePath of getConfiguredRouterPaths(profile, instructionKind)) {
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

export function createRouterOwnershipManifestState(
  profile: InstallProfile,
  assets: ResolvedAsset[],
  options: {
    packageMeta: PackageMeta;
    verifiedAt?: string;
    existingState?: RouterOwnershipManifestState;
  },
): RouterOwnershipManifestState {
  const configuredHarnesses = Object.entries(profile.selections.harnesses)
    .filter(([, selected]) => selected)
    .map(([harness]) => harness as Harness)
    .sort(compareCodeUnits);
  const routers = Object.fromEntries(
    assets.map((asset) => {
      const match = /^router:([^:]+):(.+)$/.exec(asset.sourceId);
      if (!match) {
        throw new Error(`Router asset ${asset.relativePath} has an invalid source identity.`);
      }
      const harness = match[1] as Harness;
      const instructionKind = HARNESS_TO_INSTRUCTION[harness];
      if (!instructionKind || instructionKind !== routerInstructionKind(asset.relativePath)) {
        throw new Error(`Router asset ${asset.relativePath} does not match harness ${harness}.`);
      }
      return [asset.relativePath, createRouterOwnershipManifestEntry({
        asset,
        harness,
        instructionKind,
        profile,
        packageMeta: options.packageMeta,
        verifiedAt: options.verifiedAt ?? new Date().toISOString(),
        previous: options.existingState?.routers[asset.relativePath],
      })];
    }),
  );

  return {
    configuredHarnesses,
    operationLineage: P4_OPERATION_LINEAGE,
    routers,
  };
}

export function createRouterOwnershipManifestEntry(options: {
  asset: ResolvedAsset;
  harness: Harness;
  instructionKind: InstructionKind;
  profile: InstallProfile;
  packageMeta: PackageMeta;
  verifiedAt: string;
  previous?: ManifestRouterOwnershipEntry;
}): ManifestRouterOwnershipEntry {
  const expectedSourceHash = getRouterContentHash(options.asset);
  const sourceImmutableRef = `package:${options.packageMeta.name}@${options.packageMeta.version}`;
  const routerClass = isConfiguredRouterPath(
    options.profile,
    options.asset.relativePath,
    options.instructionKind,
  )
    ? "bootstrap"
    : "on-demand-surface";
  const previous = options.previous;
  const lastVerifiedAt = previous?.provenanceState === "verified" &&
    previous.sourceId === options.asset.sourceId &&
    previous.sourcePackage === options.packageMeta.name &&
    previous.sourceVersion === options.packageMeta.version &&
    previous.sourceImmutableRef === sourceImmutableRef &&
    previous.expectedSourceHash === expectedSourceHash &&
    previous.installedHash === expectedSourceHash
    ? previous.lastVerifiedAt
    : options.verifiedAt;
  return {
    relativePath: options.asset.relativePath,
    harness: options.harness,
    instructionKind: options.instructionKind,
    ownershipClass: "managed-snapshot",
    routerClass,
    sourceId: options.asset.sourceId,
    sourcePackage: options.packageMeta.name,
    sourceVersion: options.packageMeta.version,
    sourceImmutableRef,
    materializationMode: "managed-block",
    provenanceState: "verified",
    provenanceEvidence: [
      `package:${options.packageMeta.name}@${options.packageMeta.version}`,
      `managed-source:${options.asset.sourceId}`,
    ],
    competingClaims: [],
    hashAlgorithm: "sha256",
    expectedSourceHash,
    installedHash: expectedSourceHash,
    lastVerifiedAt,
    lifecycleDisposition: "active",
    adoptionReceipt: null,
  };
}

export function createProjectSurfaceRouterAssets(
  profile: InstallProfile,
  surface: ProjectSurface,
): ResolvedAsset[] {
  const directory = {
    archive: ".make-docs/archive",
    artifacts: "docs/artifacts",
    assets: "docs/assets",
  }[surface];
  return Object.entries(HARNESS_TO_INSTRUCTION)
    .filter(([harness]) => profile.selections.harnesses[harness as Harness])
    .map(([harness, instructionKind]) => {
      const relativePath = `${directory}/${instructionKind}`;
      return {
        relativePath,
        assetClass: "scoped-static" as const,
        sourceId: `router:${harness}:${relativePath}`,
        content: surface === "assets"
          ? readThinRouterContent(relativePath)
          : renderProjectSurfaceRouter(surface),
      };
    })
    .sort((left, right) => compareCodeUnits(left.relativePath, right.relativePath));
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

function routerInstructionKind(relativePath: string): InstructionKind | null {
  const fileName = relativePath.split("/").at(-1);
  return fileName === "AGENTS.md" || fileName === "CLAUDE.md" ? fileName : null;
}

function getRouterContentHash(asset: ResolvedAsset): string {
  const digest = getManifestFileHash(asset.relativePath, asset.content);
  if (digest === null) {
    throw new Error(`Router asset ${asset.relativePath} has a malformed managed block.`);
  }
  return digest;
}

function renderProjectSurfaceRouter(surface: ProjectSurface): string {
  const body = {
    archive: [
      "# Archive Router",
      "",
      "This directory stores Make Docs-managed archive and provenance records.",
      "",
      "- Use a valid local history-record contract and template first. If either body is absent, read its stable system-resource URI with `make-docs resource read`.",
      "- Keep non-authoritative source and analysis inputs in `docs/artifacts/`.",
      "- Keep Persona-scoped reader assets and testing evidence in `docs/assets/<persona-slug>/`.",
      "- Do not infer optional Skills, plugins, Playbooks, Protocols, or unavailable policy from this router.",
    ],
    artifacts: [
      "# Artifacts Router",
      "",
      "This directory stores non-authoritative source and analysis inputs.",
      "",
      "- Do not treat material here as design, PRD, decision, risk, or implementation authority.",
      "- Link an artifact from the authoritative document that reviews or adopts it.",
      "- Keep Make Docs-managed archive and provenance records in `.make-docs/archive/`.",
      "- Do not infer optional Skills, plugins, Playbooks, Protocols, or unavailable policy from this router.",
    ],
    assets: [
      "# Persona Assets Router",
      "",
      "This directory stores Persona-scoped reader assets and testing evidence.",
      "",
      "- Use `docs/assets/<persona-slug>/` for reader assets and guides.",
      "- Use `docs/assets/<persona-slug>/testing/` for Naive-UAT packets, runs, findings, and approved evidence.",
      "- Use valid local coverage, guide, deferred-obligation, and Naive-UAT resources first. Read an absent body by stable URI with `make-docs resource read`.",
      "- Do not infer optional Skills, plugins, Playbooks, Protocols, or unavailable policy from this router.",
    ],
  }[surface].join("\n");
  return `<!-- make-docs:begin -->\n${body}\n<!-- make-docs:end -->\n`;
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
