import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { fileURLToPath } from "node:url";
import { createProofServer } from "./mcp-app-proof";

// Native resource operations use cwd. A desktop host has no project cwd by default.
const args = process.argv.slice(2);
if (args.length !== 0 && !(args.length === 2 && args[0] === "--transport" && args[1] === "stdio")) {
  process.stderr.write(JSON.stringify({
    route: "chat-fallback",
    code: "unsupported-transport",
    message: "This proof supports stdio. Continue in chat or connect a host that supports stdio. No task was created.",
  }) + "\n");
  process.exitCode = 1;
} else {
  process.chdir(fileURLToPath(new URL("../../../../", import.meta.url)));
  await createProofServer().connect(new StdioServerTransport());
}
