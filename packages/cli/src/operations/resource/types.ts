import type { OperationExecutionContext } from "../context";

export const SYSTEM_RESOURCE_TYPES = [
  "contract",
  "prompt",
  "reference",
  "template",
] as const;

export type SystemResourceType = (typeof SYSTEM_RESOURCE_TYPES)[number];

export const SYSTEM_RESOURCE_TYPE_DIRECTORIES: Record<SystemResourceType, string> = {
  contract: "contracts",
  prompt: "prompts",
  reference: "references",
  template: "templates",
};

export interface SystemResourceCatalogRule {
  readonly type: SystemResourceType;
  readonly include: readonly string[];
  readonly exclude: readonly string[];
}

export const SYSTEM_RESOURCE_ERROR_CODES = [
  "invalid-resource-type",
  "invalid-resource-uri",
  "invalid-resource-path",
  "duplicate-resource-identity",
  "provider-catalog-invalid",
  "provider-unavailable",
  "unsafe-root",
  "symlink-not-allowed",
  "root-escape",
  "invalid-project-evidence",
  "provenance-untrusted",
  "resource-conflict",
  "resource-not-found",
  "write-not-authorized",
  "approval-required",
  "projection-not-selected",
  "override-not-materializable",
  "filesystem-error",
] as const;

export type SystemResourceErrorCode = (typeof SYSTEM_RESOURCE_ERROR_CODES)[number];

export interface SystemResourceError {
  code: SystemResourceErrorCode;
  message: string;
  recovery: string;
  uri?: string;
  path?: string;
}

export type SystemResourceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: SystemResourceError };

export interface SystemResourceIdentity {
  type: SystemResourceType;
  path: string;
  uri: string;
}

export type SystemResourceProviderSource = "development" | "packed" | "test";

export interface SystemResourceProviderIdentity {
  packageName: string;
  version: string;
  immutableRef: string;
  source: SystemResourceProviderSource;
}

export interface SystemResourceProviderMetadata {
  identity: SystemResourceProviderIdentity;
  root: string;
  catalogPath: string;
  catalogRules: readonly SystemResourceCatalogRule[];
  inventoryDigest: string;
}

export interface SystemResourceProviderEntry {
  readonly identity: SystemResourceIdentity;
  readonly mediaType: string;
  readonly digest: string;
  readonly byteLength: number;
  readonly sourcePath: string;
  readonly readContent: () => Uint8Array;
}

export interface SystemResourceProviderInventory {
  provider: SystemResourceProviderMetadata;
  resources: readonly SystemResourceProviderEntry[];
}

export interface LoadSystemResourceProviderInput {
  root: string;
  packageName: string;
  version: string;
  immutableRef?: string;
  source: SystemResourceProviderSource;
  catalogRelativePath?: string;
}

export type SystemResourceProjectOwnership =
  | "managed-projection"
  | "project-override";

export interface SystemResourceProjectEvidence {
  uri: string;
  selected: boolean;
  ownership: SystemResourceProjectOwnership;
  expectedDigest: string;
  providerImmutableRef?: string;
  localPath?: string;
}

export interface SystemResourceFileFingerprint {
  size: number;
  mtimeMs: number;
  ctimeMs: number;
  device: number;
  inode: number;
}

export interface SystemResourceDigestEvidence {
  path: string;
  fingerprint: SystemResourceFileFingerprint;
  digest: string;
}

export type SystemResourceDigestSource = "computed" | "reused";

export interface SystemResourceProjectContext {
  projectRoot: string;
  evidence: readonly SystemResourceProjectEvidence[];
  digestEvidence?: readonly SystemResourceDigestEvidence[];
}

export type SystemResourceResolutionState =
  | "provider-only"
  | "clean-projection"
  | "explicit-override";

export type SystemResourceResolvedSource =
  | "provider"
  | "managed-projection"
  | "project-override";

export const SYSTEM_RESOURCE_ORIGINS = ["effective", "local", "installed"] as const;

export type SystemResourceOrigin = (typeof SYSTEM_RESOURCE_ORIGINS)[number];

export interface SystemResourceProvenance {
  source: SystemResourceResolvedSource;
  provider: SystemResourceProviderIdentity | null;
  projectOwnership: SystemResourceProjectOwnership | null;
  localPath: string | null;
  expectedDigest: string | null;
  actualDigest: string;
  digestSource: SystemResourceDigestSource;
}

export interface ResolvedSystemResource {
  identity: SystemResourceIdentity;
  state: SystemResourceResolutionState;
  source: SystemResourceResolvedSource;
  mediaType: string;
  digest: string;
  byteLength: number;
  provenance: SystemResourceProvenance;
  content: Uint8Array;
  digestEvidence?: SystemResourceDigestEvidence;
}

export interface ListedSystemResource {
  uri: string;
  result: SystemResourceResult<Omit<ResolvedSystemResource, "content">>;
}

export interface SystemResourceList {
  resources: readonly ListedSystemResource[];
}

export interface SystemResourceRead {
  resource: ResolvedSystemResource;
}

export const SYSTEM_RESOURCE_ENSURE_APPROVAL = "resource-projection-write";

export type SystemResourceEnsureAction = "planned" | "created" | "reused";

export interface SystemResourceEnsure {
  action: SystemResourceEnsureAction;
  path: string;
  resource: Omit<ResolvedSystemResource, "content">;
}

export interface EnsureSystemResourceInput {
  uri: string;
  provider: SystemResourceProviderInventory;
  project: SystemResourceProjectContext;
  execution: OperationExecutionContext;
}
