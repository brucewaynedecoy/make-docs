import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readPackageMeta } from "../utils";
import { MAKE_DOCS_MCP_TOOLS, callMakeDocsMcpTool } from "./tools";

export function createMakeDocsMcpServer(): McpServer {
  const packageMeta = readPackageMeta();
  const server = new McpServer({
    name: packageMeta.name,
    version: packageMeta.version,
  });

  for (const tool of MAKE_DOCS_MCP_TOOLS) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async (args) => formatMcpToolResult(await callMakeDocsMcpTool(tool.name, args)),
    );
  }

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
