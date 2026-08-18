import path from "node:path";
import { Buffer } from "node:buffer";
import { z } from "zod";
import { loadManifest } from "../../manifest";
import type { ManifestSystemAssetEntry } from "../../types";
import type { OperationExecutionContext } from "../context";
import type { OperationDefinition } from "../registry";
import { OperationError } from "../types";
import { canonicalSystemResourcePath, parseSystemResourceUri } from "./identity";
import { loadInstalledSystemResourceProvider } from "./provider";
import { ensureSystemResource, listSystemResources, readSystemResource } from "./resolver";
import {
  SYSTEM_RESOURCE_ENSURE_APPROVAL,
  SYSTEM_RESOURCE_ORIGINS,
  SYSTEM_RESOURCE_TYPE_DIRECTORIES,
  type ResolvedSystemResource,
  type SystemResourceError,
  type SystemResourceOrigin,
  type SystemResourceProjectContext,
  type SystemResourceProviderInventory,
  type SystemResourceResult,
} from "./types";

const targetRoot = z.string().min(1).optional();
const resourceUri = z.string().min(1);
const resourceOrigin = z.enum(SYSTEM_RESOURCE_ORIGINS).optional();

const resourceListInput = z.object({
  targetRoot,
  type: z.enum(["contract", "prompt", "reference", "template"]).optional(),
  prefix: z.string().min(1).optional(),
  origin: resourceOrigin,
}).strict();
const resourceReadInput = z.object({ uri: resourceUri, targetRoot, origin: resourceOrigin }).strict();
const resourceEnsureInput = z.object({ uri: resourceUri, targetRoot }).strict();

export type ResourceListOperationInput = z.infer<typeof resourceListInput>;
export type ResourceReadOperationInput = z.infer<typeof resourceReadInput>;
export type ResourceEnsureOperationInput = z.infer<typeof resourceEnsureInput>;

export type SerializedSystemResourceMetadata = Omit<ResolvedSystemResource, "content"> & {
  origin: "project-override" | "managed-snapshot" | "installed-machine";
};
export type SerializedSystemResource = SerializedSystemResourceMetadata & {
  content: { encoding: "base64"; data: string };
};

export interface ResourceListOperationOutput {
  schemaVersion: 1;
  targetRoot: string;
  origin: SystemResourceOrigin;
  resources: Array<{
    uri: string;
    result:
      | { ok: true; value: SerializedSystemResourceMetadata }
      | { ok: false; error: SystemResourceError };
  }>;
}

export interface ResourceReadOperationOutput {
  schemaVersion: 1;
  targetRoot: string;
  origin: SystemResourceOrigin;
  resource: SerializedSystemResource;
}

export interface ResourceEnsureOperationOutput {
  targetRoot: string;
  action: "planned" | "created" | "reused";
  path: string;
  resource: SerializedSystemResourceMetadata;
}

export class ResourceOperationError extends OperationError {
  readonly code: SystemResourceError["code"];
  readonly recovery: string;
  readonly uri?: string;
  readonly path?: string;

  constructor(error: SystemResourceError) {
    super(error.message);
    this.name = "ResourceOperationError";
    this.code = error.code;
    this.recovery = error.recovery;
    this.uri = error.uri;
    this.path = error.path;
  }
}

interface ResourceRuntime {
  provider: SystemResourceProviderInventory;
  project: SystemResourceProjectContext;
}

type ResourceRuntimeLoader = (targetRoot: string) => ResourceRuntime;
let runtimeLoaderOverride: ResourceRuntimeLoader | null = null;

/** Test-only seam. Production always loads the installed provider and project manifest. */
export function __setResourceOperationRuntimeForTests(loader: ResourceRuntimeLoader | null): void {
  runtimeLoaderOverride = loader;
}

function unwrap<T>(result: SystemResourceResult<T>): T {
  if (!result.ok) {
    throw new ResourceOperationError(result.error);
  }
  return result.value;
}

function loadRuntime(target: string): ResourceRuntime {
  if (runtimeLoaderOverride) {
    return runtimeLoaderOverride(target);
  }
  const provider = unwrap(loadInstalledSystemResourceProvider());
  return {
    provider,
    project: projectContextFromManifest(target, provider),
  };
}

function projectContextFromManifest(
  projectRoot: string,
  provider: SystemResourceProviderInventory,
): SystemResourceProjectContext {
  const manifest = loadManifest(projectRoot);
  if (!manifest) {
    return { projectRoot, evidence: [] };
  }
  const evidence = provider.resources.flatMap((resource) => {
    const localPath = path.posix.join(
      ".make-docs",
      "system",
      SYSTEM_RESOURCE_TYPE_DIRECTORIES[resource.identity.type],
      resource.identity.path,
    );
    const entry = manifest.systemAssetMaterialization.assets[localPath];
    if (!entry) {
      return [];
    }
    return [manifestEvidence(resource.identity.uri, localPath, entry)];
  });
  return { projectRoot, evidence };
}

function manifestEvidence(uri: string, localPath: string, entry: ManifestSystemAssetEntry) {
  return {
    uri,
    selected: true,
    ownership: "managed-projection" as const,
    expectedDigest: entry.expectedHashes[0] ?? "",
    ...(entry.sourceImmutableRef ? { providerImmutableRef: entry.sourceImmutableRef } : {}),
    localPath,
  };
}

function withoutContent(
  resource: Omit<ResolvedSystemResource, "content">,
): SerializedSystemResourceMetadata {
  return { ...resource, origin: serializedOrigin(resource.source) };
}

function withContent(resource: ResolvedSystemResource): SerializedSystemResource {
  const { content, ...metadata } = resource;
  return {
    ...metadata,
    origin: serializedOrigin(resource.source),
    content: {
      encoding: "base64",
      data: Buffer.from(content).toString("base64"),
    },
  };
}

function serializedOrigin(
  source: ResolvedSystemResource["source"],
): SerializedSystemResourceMetadata["origin"] {
  if (source === "provider") return "installed-machine";
  if (source === "managed-projection") return "managed-snapshot";
  return "project-override";
}

async function listHandler(
  input: z.infer<typeof resourceListInput>,
  context: OperationExecutionContext,
): Promise<ResourceListOperationOutput> {
  const root = path.resolve(input.targetRoot ?? context.cwd);
  const runtime = loadRuntime(root);
  const origin = input.origin ?? "effective";
  const prefix = input.prefix ? unwrap(canonicalSystemResourcePath(input.prefix)) : null;
  const listed = unwrap(listSystemResources(runtime.provider, runtime.project, origin));
  return {
    schemaVersion: 1,
    targetRoot: root,
    origin,
    resources: listed.resources
      .filter((entry) => {
        const identity = entry.result.ok
          ? entry.result.value.identity
          : unwrap(parseSystemResourceUri(entry.uri));
        return (
          (!input.type || identity.type === input.type) &&
          (!prefix || identity.path === prefix || identity.path.startsWith(`${prefix}/`))
        );
      })
      .map((entry) => ({
        uri: entry.uri,
        result: entry.result.ok
          ? { ok: true, value: withoutContent(entry.result.value) }
          : { ok: false, error: entry.result.error },
      })),
  };
}

async function readHandler(
  input: z.infer<typeof resourceReadInput>,
  context: OperationExecutionContext,
): Promise<ResourceReadOperationOutput> {
  const root = path.resolve(input.targetRoot ?? context.cwd);
  const runtime = loadRuntime(root);
  const origin = input.origin ?? "effective";
  const read = unwrap(readSystemResource(input.uri, runtime.provider, runtime.project, origin));
  return { schemaVersion: 1, targetRoot: root, origin, resource: withContent(read.resource) };
}

async function ensureHandler(
  input: z.infer<typeof resourceEnsureInput>,
  context: OperationExecutionContext,
): Promise<ResourceEnsureOperationOutput> {
  const root = path.resolve(input.targetRoot ?? context.cwd);
  const runtime = loadRuntime(root);
  const ensured = unwrap(
    ensureSystemResource({
      uri: input.uri,
      provider: runtime.provider,
      project: runtime.project,
      execution: context,
    }),
  );
  return {
    targetRoot: root,
    action: ensured.action,
    path: ensured.path,
    resource: withoutContent(ensured.resource),
  };
}

export const resourceListOperation: OperationDefinition<
  ResourceListOperationInput,
  ResourceListOperationOutput
> = {
  id: "resource.list",
  summary: "List the stable system-resource URI inventory with resolution provenance.",
  mutates: "read",
  status: "active",
  inputSchema: resourceListInput,
  handler: listHandler,
};

export const resourceReadOperation: OperationDefinition<
  ResourceReadOperationInput,
  ResourceReadOperationOutput
> = {
  id: "resource.read",
  summary: "Read one system resource with exact bytes, media type, and provenance.",
  mutates: "read",
  status: "active",
  inputSchema: resourceReadInput,
  handler: readHandler,
};

export const resourceEnsureOperation: OperationDefinition<
  ResourceEnsureOperationInput,
  ResourceEnsureOperationOutput
> = {
  id: "resource.ensure",
  summary: "Materialize one selected managed projection under explicit write permission.",
  mutates: "write",
  status: "active",
  requiredApprovals: [SYSTEM_RESOURCE_ENSURE_APPROVAL],
  inputSchema: resourceEnsureInput,
  handler: ensureHandler,
};

export const resourceOperations: OperationDefinition[] = [
  resourceListOperation as OperationDefinition,
  resourceReadOperation as OperationDefinition,
  resourceEnsureOperation as OperationDefinition,
];
