import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { serializeOperationError } from "../operations/context";
import { parseMcpServerProfile, type McpProfileOptions } from "../operations/mcp-metadata";
import { readPackageMeta } from "../utils";
import { listNativeMcpResources, readNativeMcpResource } from "./resources";
import { callMakeDocsMcpTool, listMakeDocsMcpTools } from "./tools";

export function createMakeDocsMcpServer(options: McpProfileOptions = {}): McpServer {
  const profile = parseMcpServerProfile(options.profile);
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

  server.server.registerCapabilities({ resources: {} });
  server.server.setRequestHandler(ListResourcesRequestSchema, async () =>
    listNativeMcpResources(process.cwd(), { profile }),
  );
  server.server.setRequestHandler(ReadResourceRequestSchema, async (request) =>
    readNativeMcpResource(request.params.uri, process.cwd(), { profile }),
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
