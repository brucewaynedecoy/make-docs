import path from "node:path";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { createExecutionContext } from "../operations/context";
import { invokeOperation } from "../operations/registry";
import { ResourceOperationError } from "../operations/resource";

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

/** Native resources/list adapter over the same resource.list handler as CLI and tools. */
export async function listNativeMcpResources(targetRoot = process.cwd()) {
  const invocation = await invokeOperation(
    "resource.list",
    { targetRoot: path.resolve(targetRoot) },
    createExecutionContext({ surface: "mcp", cwd: targetRoot }),
  ).catch(throwNativeResourceError);
  const value = invocation.value as unknown as ResourceListValue;
  return {
    resources: value.resources.map((entry) => {
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
export async function readNativeMcpResource(uri: string, targetRoot = process.cwd()) {
  const invocation = await invokeOperation(
    "resource.read",
    { uri, targetRoot: path.resolve(targetRoot) },
    createExecutionContext({ surface: "mcp", cwd: targetRoot }),
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
