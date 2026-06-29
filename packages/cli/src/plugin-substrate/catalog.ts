import * as os from "node:os";
import path from "node:path";
import type {
  AgenticOwnershipMetadata,
  ManifestFileEntry,
  PluginArtifactMetadata,
  PluginExposureMetadata,
  ResolvedPluginExposureAsset,
  ResolvedPluginPayloadAsset,
} from "../types";
import { getReservedAgenticsPath } from "../tool-directory";
import { hashText, normalizeRelativePath } from "../utils";
import type {
  PluginArtifactDefinition,
  PluginDryRunLineOptions,
  PluginHarnessExposureDeclaration,
  PluginResolutionOptions,
  PluginSubstrateResolution,
} from "./types";
import { validatePluginArtifactDefinition, validatePluginHarnessExposureDeclaration } from "./validation";
import { formatAgenticFileRole } from "../agentic-skill-roles";

export const SHARED_AGENTICS_PLUGIN_DIR = getReservedAgenticsPath("plugins");

export function resolvePluginPayloadRoot(
  pluginId: string,
  options: PluginResolutionOptions,
): string {
  return getInstallPath(getInstallRoot(options), SHARED_AGENTICS_PLUGIN_DIR, pluginId);
}

export function resolvePluginSubstrate(
  definition: PluginArtifactDefinition,
  options: PluginResolutionOptions,
  exposureDeclarations: PluginHarnessExposureDeclaration[] = [],
): PluginSubstrateResolution {
  const plugin = createPluginArtifactMetadata(definition, options);
  const canonicalPayloadPath = resolvePluginPayloadRoot(definition.pluginId, options);
  const payloadAssets = buildPluginPayloadAssets(definition, options);
  const exposureAssets = exposureDeclarations
    .filter((declaration) => definition.supportedHarnesses.includes(declaration.harness))
    .map((declaration) =>
      buildPluginExposureAsset(definition, options, declaration, payloadAssets),
    )
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));

  return {
    plugin,
    canonicalPayloadPath,
    payloadAssets,
    exposureAssets,
  };
}

export function buildPluginPayloadAssets(
  definition: PluginArtifactDefinition,
  options: PluginResolutionOptions,
): ResolvedPluginPayloadAsset[] {
  validatePluginArtifactDefinition(definition);
  const plugin = createPluginArtifactMetadata(definition, options);
  const canonicalPayloadPath = resolvePluginPayloadRoot(definition.pluginId, options);

  return definition.payload
    .map((payloadFile) => {
      const relativePath = getInstallPath(canonicalPayloadPath, payloadFile.installPath);
      return {
        kind: "plugin-payload" as const,
        relativePath,
        assetClass: "static" as const,
        sourceId: getPluginPayloadAssetSourceId(definition.pluginId, payloadFile.installPath),
        content: payloadFile.content,
        pluginArtifact: plugin,
        agenticOwnership: createPluginOwnership({
          plugin,
          role: "plugin-payload",
          pathKind: "file",
          canonicalPayloadPath,
        }),
      };
    })
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

export function buildPluginExposureAsset(
  definition: PluginArtifactDefinition,
  options: PluginResolutionOptions,
  declaration: PluginHarnessExposureDeclaration,
  payloadAssets = buildPluginPayloadAssets(definition, options),
): ResolvedPluginExposureAsset {
  validatePluginArtifactDefinition(definition);
  validatePluginHarnessExposureDeclaration(declaration);
  const plugin = createPluginArtifactMetadata(definition, options);
  const canonicalPayloadPath = resolvePluginPayloadRoot(definition.pluginId, options);
  const exposurePath = getInstallPath(
    getInstallRoot(options),
    renderPluginPathTemplate(declaration.pathTemplate, definition.pluginId),
  );

  if (declaration.exposureKind === "generated-adapter") {
    const adapterContent =
      declaration.adapterContent ??
      createDefaultGeneratedAdapterContent(plugin, canonicalPayloadPath);
    const agenticOwnership = createPluginOwnership({
      plugin,
      role: "plugin-generated-adapter",
      pathKind: "file",
      canonicalPayloadPath,
      exposurePath,
      exposureMode: "generated-adapter",
    });
    const generatedAdapterAsset: ResolvedPluginPayloadAsset = {
      kind: "plugin-payload",
      relativePath: exposurePath,
      assetClass: "static",
      sourceId: getPluginGeneratedAdapterSourceId(definition.pluginId, declaration.harness),
      content: adapterContent,
      pluginArtifact: plugin,
      agenticOwnership,
    };

    return {
      kind: "plugin-exposure",
      relativePath: exposurePath,
      assetClass: "static",
      sourceId: getPluginGeneratedAdapterSourceId(definition.pluginId, declaration.harness),
      pluginArtifact: plugin,
      agenticOwnership,
      pluginExposure: {
        pluginId: definition.pluginId,
        harness: declaration.harness,
        scope: options.scope,
        canonicalPayloadPath,
        exposurePath,
        preferredMode: "symlink",
        mode: "generated-adapter",
        generatedAdapterSourceId: generatedAdapterAsset.sourceId,
        generatedAdapterDigest: declaration.adapterDigest ?? hashText(adapterContent),
      },
      copyMirrorAssets: [],
      generatedAdapterAsset,
    };
  }

  const copyMirrorAssets = payloadAssets.map((asset) => {
    const pluginRelativePath = normalizeRelativePath(
      path.relative(canonicalPayloadPath, asset.relativePath),
    );
    const relativePath = getInstallPath(exposurePath, pluginRelativePath);

    return {
      ...asset,
      relativePath,
      sourceId: getPluginCopyMirrorAssetSourceId(
        declaration.harness,
        definition.pluginId,
        pluginRelativePath,
      ),
      agenticOwnership: createPluginOwnership({
        plugin,
        role: "plugin-copy-mirror",
        pathKind: "file",
        canonicalPayloadPath,
        exposurePath: relativePath,
        exposureMode: "copy-mirror",
      }),
    };
  });

  const pluginExposure: PluginExposureMetadata = {
    pluginId: definition.pluginId,
    harness: declaration.harness,
    scope: options.scope,
    canonicalPayloadPath,
    exposurePath,
    preferredMode: "symlink",
    symlinkTarget: normalizeRelativePath(
      path.relative(path.dirname(exposurePath), canonicalPayloadPath),
    ),
    copyMirrorSource: canonicalPayloadPath,
  };

  return {
    kind: "plugin-exposure",
    relativePath: exposurePath,
    assetClass: "static",
    sourceId: getPluginExposureSourceId(definition.pluginId, declaration.harness),
    pluginArtifact: plugin,
    agenticOwnership: createPluginOwnership({
      plugin,
      role: "plugin-native-exposure",
      pathKind: "directory",
      canonicalPayloadPath,
      exposurePath,
      exposureMode: "symlink",
    }),
    pluginExposure,
    copyMirrorAssets,
  };
}

export function createPluginManifestFileEntries(
  assets: PluginSubstrateResolution | PluginSubstrateResolution[],
): Record<string, ManifestFileEntry> {
  const resolutions = Array.isArray(assets) ? assets : [assets];
  const entries: Record<string, ManifestFileEntry> = {};

  for (const resolution of resolutions) {
    for (const payload of resolution.payloadAssets) {
      entries[payload.relativePath] = createPluginManifestEntry(payload);
    }
    for (const exposure of resolution.exposureAssets) {
      entries[exposure.relativePath] = {
        hash: hashText(JSON.stringify(exposure.pluginExposure)),
        sourceId: exposure.sourceId,
        agenticOwnership: exposure.agenticOwnership,
      };
      if (exposure.pluginExposure.mode === "copy-mirror") {
        for (const mirror of exposure.copyMirrorAssets) {
          entries[mirror.relativePath] = createPluginManifestEntry(mirror);
        }
      }
      if (exposure.generatedAdapterAsset) {
        entries[exposure.generatedAdapterAsset.relativePath] =
          createPluginManifestEntry(exposure.generatedAdapterAsset);
      }
    }
  }

  return entries;
}

export function formatPluginSubstrateDryRunLines(
  resolution: PluginSubstrateResolution,
  options: PluginDryRunLineOptions = {},
): string[] {
  const lines = resolution.payloadAssets.map((asset) =>
    formatPluginAssetLine(asset.agenticOwnership, asset.relativePath),
  );

  for (const exposure of resolution.exposureAssets) {
    lines.push(formatPluginAssetLine(exposure.agenticOwnership, exposure.relativePath));
    if (options.includeCopyMirrors) {
      lines.push(
        ...exposure.copyMirrorAssets.map((asset) =>
          formatPluginAssetLine(asset.agenticOwnership, asset.relativePath),
        ),
      );
    }
    if (exposure.generatedAdapterAsset) {
      lines.push(
        formatPluginAssetLine(
          exposure.generatedAdapterAsset.agenticOwnership,
          exposure.generatedAdapterAsset.relativePath,
        ),
      );
    }
  }

  return Array.from(new Set(lines)).sort();
}

function createPluginArtifactMetadata(
  definition: PluginArtifactDefinition,
  options: PluginResolutionOptions,
): PluginArtifactMetadata {
  validatePluginArtifactDefinition(definition);
  return {
    pluginId: definition.pluginId,
    title: definition.title,
    summary: definition.summary,
    status: definition.status,
    sourceManifest: definition.sourceManifest,
    ...(definition.ref ? { ref: definition.ref } : {}),
    ...(definition.version ? { version: definition.version } : {}),
    digest: definition.digest,
    provenance: definition.provenance,
    trustPolicy: definition.trustPolicy,
    supportedHarnesses: [...definition.supportedHarnesses],
    scope: options.scope,
    supportStatus: definition.supportStatus,
    ...(definition.workflowBundles
      ? { workflowBundles: structuredClone(definition.workflowBundles) }
      : {}),
    ...(definition.packageBoundary
      ? { packageBoundary: structuredClone(definition.packageBoundary) }
      : {}),
  };
}

function createPluginOwnership(options: {
  plugin: PluginArtifactMetadata;
  role: AgenticOwnershipMetadata["role"];
  pathKind: AgenticOwnershipMetadata["pathKind"];
  canonicalPayloadPath: string;
  exposurePath?: string;
  exposureMode?: AgenticOwnershipMetadata["exposureMode"];
}): AgenticOwnershipMetadata {
  return {
    artifactKind: "plugin",
    role: options.role,
    id: options.plugin.pluginId,
    pathKind: options.pathKind,
    scope: options.plugin.scope,
    canonicalPayloadPath: options.canonicalPayloadPath,
    ...(options.exposurePath ? { exposurePath: options.exposurePath } : {}),
    ...(options.exposureMode ? { exposureMode: options.exposureMode } : {}),
    sourceManifest: options.plugin.sourceManifest.manifestId,
    ...(options.plugin.ref ? { ref: options.plugin.ref } : {}),
    ...(options.plugin.version ? { version: options.plugin.version } : {}),
    digest: options.plugin.digest,
    provenance: options.plugin.provenance,
    trustPolicy: options.plugin.trustPolicy,
    supportStatus: options.plugin.supportStatus,
  };
}

function createPluginManifestEntry(
  asset: ResolvedPluginPayloadAsset,
): ManifestFileEntry {
  return {
    hash: hashText(asset.content),
    sourceId: asset.sourceId,
    agenticOwnership: asset.agenticOwnership,
  };
}

function formatPluginAssetLine(
  ownership: AgenticOwnershipMetadata,
  relativePath: string,
): string {
  return `- ${formatAgenticFileRole(ownership.role) ?? "plugin artifact"}: ${relativePath}`;
}

function renderPluginPathTemplate(template: string, pluginId: string): string {
  return normalizeRelativePath(template.replaceAll("{pluginId}", pluginId));
}

function createDefaultGeneratedAdapterContent(
  plugin: PluginArtifactMetadata,
  canonicalPayloadPath: string,
): string {
  return `${JSON.stringify(
    {
      pluginId: plugin.pluginId,
      title: plugin.title,
      canonicalPayloadPath,
      generatedBy: "make-docs",
    },
    null,
    2,
  )}\n`;
}

function getInstallRoot(options: PluginResolutionOptions): string {
  return options.scope === "project" ? "." : options.homeDir ?? os.homedir();
}

function getInstallPath(...segments: string[]): string {
  return normalizeRelativePath(path.join(...segments));
}

function getPluginPayloadAssetSourceId(
  pluginId: string,
  installPath: string,
): string {
  return `plugin-payload-asset:${pluginId}:${installPath}`;
}

function getPluginExposureSourceId(pluginId: string, harness: string): string {
  return `plugin-exposure:${harness}:${pluginId}`;
}

function getPluginCopyMirrorAssetSourceId(
  harness: string,
  pluginId: string,
  installPath: string,
): string {
  return `plugin-copy-mirror-asset:${harness}:${pluginId}:${installPath}`;
}

function getPluginGeneratedAdapterSourceId(
  pluginId: string,
  harness: string,
): string {
  return `plugin-generated-adapter:${harness}:${pluginId}`;
}
