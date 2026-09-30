import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { serializeOperationError } from "../operations/context";
import { readPackageMeta } from "../utils";
import { createAppResourceCatalog, MCP_APP_MIME_TYPE, type AppResource } from "./app-resources";
import { listNativeMcpResources, readNativeMcpResource } from "./resources";
import { callMakeDocsMcpTool, listMakeDocsMcpTools } from "./tools";

export interface MakeDocsMcpServerOptions {
  /** Static UI assets. Tool handlers still use the existing SDK tool registry. */
  appResources?: readonly AppResource[];
}

export function createMakeDocsMcpServer(options: MakeDocsMcpServerOptions = {}): McpServer {
  const appResources = createAppResourceCatalog(options.appResources ?? []);
  const packageMeta = readPackageMeta();
  const server = new McpServer({
    name: packageMeta.name,
    version: packageMeta.version,
  });

  for (const tool of listMakeDocsMcpTools().filter((candidate) => candidate.mcpReady !== false)) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async (args) => {
        try {
          return formatMcpToolResult(await callMakeDocsMcpTool(tool.name, args));
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
    resources: [...(await listNativeMcpResources()).resources, ...appResources.list()],
  }));
  server.server.setRequestHandler(ReadResourceRequestSchema, async (request) =>
    appResources.read(request.params.uri) ?? readNativeMcpResource(request.params.uri),
  );

  return server;
}

export async function runMcpServer(): Promise<void> {
  const server = createMakeDocsMcpServer();
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
