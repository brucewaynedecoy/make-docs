import type {
  AgenticScope,
  Harness,
  PluginArtifactMetadata,
  PluginExposureMetadata,
  PluginSourceManifestMetadata,
  PluginSupportStatus,
  PluginTrustPolicy,
  ResolvedPluginExposureAsset,
  ResolvedPluginPayloadAsset,
} from "../types";

export type PluginExposureKind = "native" | "generated-adapter";

export interface PluginPayloadFile {
  installPath: string;
  content: string;
}

export interface PluginArtifactDefinition {
  pluginId: string;
  title: string;
  summary: string;
  status: PluginArtifactMetadata["status"];
  sourceManifest: PluginSourceManifestMetadata;
  ref?: string;
  version?: string;
  digest: string;
  provenance: string;
  trustPolicy: PluginTrustPolicy;
  supportedHarnesses: Harness[];
  supportStatus: PluginSupportStatus;
  payload: PluginPayloadFile[];
}

export interface PluginResolutionOptions {
  scope: AgenticScope;
  homeDir?: string;
}

export interface PluginHarnessExposureDeclaration {
  harness: Harness;
  exposureKind: PluginExposureKind;
  pathTemplate: string;
  adapterContent?: string;
  adapterDigest?: string;
}

export type PluginSubstrateAsset =
  | ResolvedPluginPayloadAsset
  | ResolvedPluginExposureAsset;

export interface PluginSubstrateResolution {
  plugin: PluginArtifactMetadata;
  canonicalPayloadPath: string;
  payloadAssets: ResolvedPluginPayloadAsset[];
  exposureAssets: ResolvedPluginExposureAsset[];
}

export interface PluginDryRunLineOptions {
  includeCopyMirrors?: boolean;
}
