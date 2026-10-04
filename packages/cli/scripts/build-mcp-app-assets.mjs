import { readFile, writeFile } from "node:fs/promises";

const source = new URL("../src/mcp/assets/backlog-review-v1.html", import.meta.url);
const output = new URL("../src/mcp/assets/backlog-review-v1.ts", import.meta.url);
const html = await readFile(source, "utf8");
const moduleText = "// Generated from backlog-review-v1.html by scripts/build-mcp-app-assets.mjs.\n"
  + `export default ${JSON.stringify(html)};\n`;
if (process.argv.includes("--check")) {
  if (await readFile(output, "utf8") !== moduleText) throw new Error("Embedded MCP app bytes differ from the source HTML. Run scripts/build-mcp-app-assets.mjs.");
} else {
  await writeFile(output, moduleText, "utf8");
}
