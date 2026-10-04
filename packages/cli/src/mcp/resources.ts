import path from "node:path";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { HARNESS_CALLER_IDENTITY_ENV } from "../harness-access/contract";
import { createExecutionContext } from "../operations/context";
import { parseMcpServerProfile, type McpProfileOptions } from "../operations/mcp-metadata";
import { invokeOperation } from "../operations/registry";
import { ResourceOperationError } from "../operations/resource";
import { getSystemResourceMcpProfiles } from "../operations/resource/mcp-profiles";
import { loadInstalledSystemResourceProvider } from "../operations/resource/provider";
import { isMcpResourceInProfile } from "./resource-profiles";

interface ResourceListValue {
  targetRoot: string;
  resources: Array<{
    uri: string;
    result:
      | { ok: true; value: Record<string, unknown> }
      | { ok: false; error: Record<string, unknown> };
  }>;
}

interface ResourceReadValue {
  targetRoot: string;
  resource: Record<string, unknown> & {
    identity: { uri: string; path: string };
    mediaType: string;
    byteLength: number;
    content: { encoding: "base64"; data: string };
  };
}

function throwNativeResourceError(error: unknown): never {
  if (error instanceof ResourceOperationError) {
    throw new McpError(ErrorCode.InvalidParams, error.message, {
      makeDocs: {
        code: error.code,
        recovery: error.recovery,
        ...(error.uri ? { uri: error.uri } : {}),
        ...(error.path ? { path: error.path } : {}),
      },
    });
  }
  throw error;
}

function nativeResourceProfiles() {
  const provider = loadInstalledSystemResourceProvider();
  if (!provider.ok) throwNativeResourceError(new ResourceOperationError(provider.error));
  const assignments = getSystemResourceMcpProfiles(provider.value);
  if (!assignments.ok) throwNativeResourceError(new ResourceOperationError(assignments.error));
  return assignments.value;
}

/** Native resources/list adapter over the same resource.list handler as CLI and tools. */
export async function listNativeMcpResources(
  targetRoot = process.cwd(),
  options: McpProfileOptions = {},
) {
  const profile = parseMcpServerProfile(options.profile);
  const assignments = nativeResourceProfiles();
  const invocation = await invokeOperation(
    "resource.list",
    { targetRoot: path.resolve(targetRoot) },
    createExecutionContext({
      surface: "mcp",
      route: "mcp",
      callerIdentityRaw: process.env[HARNESS_CALLER_IDENTITY_ENV],
      cwd: targetRoot,
    }),
  ).catch(throwNativeResourceError);
  const value = invocation.value as unknown as ResourceListValue;
  return {
    resources: value.resources.filter((entry) =>
      isMcpResourceInProfile(assignments[entry.uri] ?? [], profile),
    ).map((entry) => {
      if (!entry.result.ok) {
        return {
          uri: entry.uri,
          name: entry.uri,
          description: "Unavailable Make Docs system resource.",
          _meta: { makeDocs: { error: entry.result.error } },
        };
      }
      return {
        uri: entry.uri,
        name: entry.uri,
        description: "Make Docs system resource.",
        mimeType: String(entry.result.value.mediaType),
        size: Number(entry.result.value.byteLength),
        _meta: { makeDocs: entry.result.value },
      };
    }),
  };
}

/** Native resources/read adapter over the same resource.read handler as CLI and tools. */
export async function readNativeMcpResource(
  uri: string,
  targetRoot = process.cwd(),
  options: McpProfileOptions = {},
) {
  const profile = parseMcpServerProfile(options.profile);
  const assignments = nativeResourceProfiles();
  if (!isMcpResourceInProfile(assignments[uri] ?? [], profile)) {
    throwNativeResourceError(new ResourceOperationError({
      code: "resource-not-found",
      message: `Resource ${uri} is not available in MCP profile ${profile}.`,
      recovery: "Choose a URI from resources/list for this profile.",
      uri,
    }));
  }
  const invocation = await invokeOperation(
    "resource.read",
    { uri, targetRoot: path.resolve(targetRoot) },
    createExecutionContext({
      surface: "mcp",
      route: "mcp",
      callerIdentityRaw: process.env[HARNESS_CALLER_IDENTITY_ENV],
      cwd: targetRoot,
    }),
  ).catch(throwNativeResourceError);
  const value = invocation.value as unknown as ResourceReadValue;
  const { content, ...metadata } = value.resource;
  return {
    contents: [
      {
        uri: value.resource.identity.uri,
        mimeType: value.resource.mediaType,
        blob: content.data,
        _meta: { makeDocs: metadata },
      },
    ],
  };
}
