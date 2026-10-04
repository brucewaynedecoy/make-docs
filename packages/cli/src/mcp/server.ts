import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { serializeOperationError } from "../operations/context";
import { parseMcpServerProfile, type McpProfileOptions } from "../operations/mcp-metadata";
import { readPackageMeta } from "../utils";
import { createAppResourceCatalog, MCP_APP_MIME_TYPE, type AppResource } from "./app-resources";
import { listNativeMcpResources, readNativeMcpResource } from "./resources";
import { callMakeDocsMcpTool, listMakeDocsMcpTools } from "./tools";

export interface MakeDocsMcpServerOptions extends McpProfileOptions {
  /** Static UI assets. Tool handlers still use the existing SDK tool registry. */
  appResources?: readonly AppResource[];
}

export function createMakeDocsMcpServer(options: MakeDocsMcpServerOptions = {}): McpServer {
  const profile = parseMcpServerProfile(options.profile);
  // W25 P4 must assign app profiles before proof assets can join a task profile.
  if (options.appResources?.length && profile !== "all") {
    throw new Error(
      "MCP app proof resources require the all profile. Use all or omit appResources for a task profile.",
    );
  }
  const appResources = createAppResourceCatalog(options.appResources ?? []);
  const packageMeta = readPackageMeta();
  const server = new McpServer({
    name: packageMeta.name,
    version: packageMeta.version,
  });

  for (const tool of listMakeDocsMcpTools(process.cwd(), { profile })) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async (args) => {
        try {
          return formatMcpToolResult(await callMakeDocsMcpTool(tool.name, args, { profile }));
        } catch (error) {
          return formatMcpToolError(error);
        }
      },
    );
  }

  server.server.registerCapabilities({
    resources: {},
    ...(options.appResources?.length ? {
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

function formatMcpToolResult(value: unknown) {
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
