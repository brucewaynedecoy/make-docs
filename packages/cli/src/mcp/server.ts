import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { getOperation } from "../operations/registry";
import { serializeOperationError } from "../operations/context";
import { OperationError } from "../operations/types";
import { parseMcpServerProfile, type McpProfileOptions } from "../operations/mcp-metadata";
import { readPackageMeta } from "../utils";
import { createAppResourceCatalog, MCP_APP_MIME_TYPE, type AppResource } from "./app-resources";
import { listNativeMcpResources, readNativeMcpResource } from "./resources";
import { callMakeDocsMcpTool, listActiveMcpMigrationAliases, listMakeDocsMcpTools } from "./tools";
import { defaultAppResources } from "./default-app-resources";
import { encodeBacklogToolResult } from "./backlog-transport";

export interface MakeDocsMcpServerOptions extends McpProfileOptions {
  /** Static UI assets. Tool handlers still use the existing SDK tool registry. */
  appResources?: readonly AppResource[];
}

export function createMakeDocsMcpServer(options: MakeDocsMcpServerOptions = {}): McpServer {
  const profile = parseMcpServerProfile(options.profile);
  // Unassigned proof resources remain an explicit all-profile test option.
  if (options.appResources?.length && profile !== "all") {
    throw new Error(
      "MCP app proof resources require the all profile. Use all or omit appResources for a task profile.",
    );
  }
  const appResources = createAppResourceCatalog([...defaultAppResources(profile), ...(options.appResources ?? [])]);
  const packageMeta = readPackageMeta();
  const server = new McpServer({
    name: packageMeta.name,
    version: packageMeta.version,
  });

  // PRD 39 R-MIG-1, R-MIG-3: old tool names answer calls but never appear in
  // `tools/list`. This must run before the first tool is registered.
  const aliases = listActiveMcpMigrationAliases({ profile });
  const aliasHiding = hideToolsFromList(server, new Set(aliases.map((alias) => alias.formerMcp)));
  const tools = listMakeDocsMcpTools(process.cwd(), { profile });
  const registrations = [
    ...tools.map((tool) => ({ name: tool.name, tool })),
    ...aliases.map((alias) => ({ name: alias.formerMcp, tool: tools.find((tool) => tool.name === alias.newMcp)! })),
  ];
  for (const { name, tool } of registrations) {
    const definition = tool.operation ? getOperation(tool.operation) : null;
    // Preserve the canonical schema's strict/loose policy, including the context-only argument projection.
    const inputSchema = definition?.inputSchema instanceof z.ZodObject
      ? definition.inputSchema.safeExtend(tool.inputSchema) : tool.inputSchema;
    server.registerTool<z.ZodType, typeof inputSchema>(
      name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema,
        ...(tool._meta ? { _meta: tool._meta } : {}),
      },
      async (args) => {
        try {
          return formatMcpToolResult(await callMakeDocsMcpTool(name, args, { profile }));
        } catch (error) {
          return formatMcpToolError(error);
        }
      },
    );
  }
  // Fail loudly rather than serve old names in `tools/list`.
  aliasHiding.assertWrapped();

  server.server.registerCapabilities({
    resources: {},
    ...(appResources.list().length ? {
      extensions: { "io.modelcontextprotocol/ui": { mimeTypes: [MCP_APP_MIME_TYPE] } },
    } : {}),
  });
  server.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [...(await listNativeMcpResources(process.cwd(), { profile })).resources, ...appResources.list()],
  }));
  server.server.setRequestHandler(ReadResourceRequestSchema, async (request) =>
    appResources.read(request.params.uri) ?? readNativeMcpResource(request.params.uri, process.cwd(), { profile }),
  );

  return server;
}

export async function runMcpServer(options: McpProfileOptions = {}): Promise<void> {
  const server = createMakeDocsMcpServer(options);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

/**
 * Server startup fails with this error when the old MCP names could not be
 * kept out of `tools/list` (PRD 39 R-MIG-3). A server that lists old names
 * must never start.
 */
export class McpAliasHidingError extends OperationError {
  readonly code = "mcp-alias-hiding-unavailable";
  readonly nextAction = "Report this Make Docs defect. Old MCP tool names would appear in tools/list.";

  constructor() {
    super("The MCP server could not keep old tool names out of tools/list: the SDK did not set its tools/list handler through the wrapper.");
    this.name = "McpAliasHidingError";
  }
}

/**
 * Keep the named tools out of `tools/list`. The SDK sets its list handler when
 * the first tool is registered; this wraps that handler and drops the names.
 * Calls to the names still reach their registered handlers. Call
 * `assertWrapped()` after the tools are registered: it throws
 * {@link McpAliasHidingError} when the SDK never set the list handler through
 * the wrapper, for example after an SDK change.
 */
export function hideToolsFromList(
  server: Pick<McpServer, "server">,
  hidden: ReadonlySet<string>,
): { assertWrapped(): void } {
  if (hidden.size === 0) return { assertWrapped() {} };
  let wrapped = false;
  const protocol = server.server;
  const setRequestHandler = protocol.setRequestHandler.bind(protocol);
  type ListToolsHandler = (...args: unknown[]) => Promise<{ tools: Array<{ name: string }> }>;
  protocol.setRequestHandler = ((schema: unknown, handler: unknown) => {
    if (schema !== ListToolsRequestSchema) {
      return (setRequestHandler as (schema: unknown, handler: unknown) => void)(schema, handler);
    }
    wrapped = true;
    const listTools = handler as ListToolsHandler;
    return (setRequestHandler as (schema: unknown, handler: unknown) => void)(schema, async (...args: unknown[]) => {
      const result = await listTools(...args);
      return { ...result, tools: result.tools.filter((tool) => !hidden.has(tool.name)) };
    });
  }) as typeof protocol.setRequestHandler;
  return {
    assertWrapped() {
      if (!wrapped) throw new McpAliasHidingError();
    },
  };
}

function formatMcpToolResult(value: unknown) {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const invocation = value as Record<string, unknown>;
    if (typeof invocation.operation === "string") {
      const schema = getOperation(invocation.operation).mcpResultSchema;
      if (schema) {
        const result = encodeBacklogToolResult(schema.parse(invocation.result) as CallToolResult);
        // An old tool name adds `renamedTo` to the result (PRD 39 R-MIG-1).
        return typeof invocation.renamedTo === "string" ? withRenamedTo(result, invocation.renamedTo) : result;
      }
    }
  }
  const structuredContent =
    value !== null && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : { value };

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(structuredContent, null, 2),
      },
    ],
    structuredContent,
  };
}

function withRenamedTo(result: CallToolResult, renamedTo: string): CallToolResult {
  return {
    ...result,
    ...(result.structuredContent ? { structuredContent: { ...result.structuredContent, renamedTo } } : {}),
    _meta: { ...(result._meta ?? {}), renamedTo },
  };
}

function formatMcpToolError(error: unknown) {
  const structuredContent = serializeOperationError(error);
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(structuredContent, null, 2),
      },
    ],
    structuredContent,
  };
}
