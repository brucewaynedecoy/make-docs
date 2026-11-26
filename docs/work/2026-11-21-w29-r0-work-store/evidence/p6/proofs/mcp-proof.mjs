// Installed MCP proof: call work_status, work_next, work_claim, and work_close over stdio on the installed package,
// and compare work_next with the CLI JSON. Usage: node mcp-proof.mjs <sdk esm dir> <make-docs bin> <project> <connection env json>
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const [sdkDir, bin, project, envFile] = process.argv.slice(2);
const { Client } = await import(path.join(sdkDir, "client/index.js"));
const { StdioClientTransport } = await import(path.join(sdkDir, "client/stdio.js"));
const env = { ...process.env, ...JSON.parse(readFileSync(envFile, "utf8")) };
const transport = new StdioClientTransport({ command: bin, args: ["mcp"], cwd: project, env, stderr: "pipe" });
const client = new Client({ name: "w29-p6-installed-proof", version: "1.0.0" }, { capabilities: {} });
await client.connect(transport);
const text = (result) => result.content?.map((part) => part.text ?? "").join("") ?? "";
const parse = (result) => {
  if (result.structuredContent) return result.structuredContent;
  try { return JSON.parse(text(result)); } catch { return null; }
};
const call = async (name, args) => {
  const result = await client.callTool({ name, arguments: { targetRoot: project, ...args } });
  return { isError: result.isError === true, value: parse(result), raw: text(result) };
};
try {
  const tools = (await client.listTools()).tools.map((tool) => tool.name).filter((name) => name.startsWith("work_"));
  console.log("work tools:", tools.join(", "));
  const status = await call("work_status", {});
  console.log("work_status:", status.isError ? `error ${status.raw.slice(0, 300)}` : status.value?.result?.summary);
  const next = await call("work_next", { level: "task" });
  const mcpNext = next.value?.result;
  const cli = spawnSync(bin, ["work", "next", "--level", "task", "--json"], { cwd: project, env, encoding: "utf8" });
  const cliNext = JSON.parse(cli.stdout);
  const pick = (r) => JSON.stringify({ ready: r.ready, waiting: r.waiting, summary: r.summary });
  console.log("work_next isError:", next.isError, "same ready/waiting/summary as CLI JSON:", pick(mcpNext) === pick(cliNext));
  const t2 = mcpNext.ready.find((unit) => unit.coordinate === "W1 R0 P1 T2");
  const refused = await call("work_claim", { unit: "W1 R0 P1 T2", claimant: "mcp-agent", expectedVersion: t2.revision });
  console.log("work_claim without allowWrite:", refused.isError ? refused.raw.slice(0, 200) : "accepted (unexpected)");
  const claim = await call("work_claim", { unit: "W1 R0 P1 T2", claimant: "mcp-agent", expectedVersion: t2.revision, allowWrite: true });
  const claimValue = claim.value?.result;
  console.log("work_claim:", claim.isError ? `error ${claim.raw.slice(0, 300)}` : claimValue.summary.split("\n")[0], "| claim ID shown once:", Boolean(claimValue?.claimId));
  const close = await call("work_close", { unit: "W1 R0 P1 T2", claimId: claimValue.claimId, expectedVersion: claimValue.revision, allowWrite: true });
  const closeValue = close.value?.result;
  console.log("work_close:", close.isError ? `error ${close.raw.slice(0, 300)}` : closeValue.summary.split("\n")[0]);
} finally {
  await client.close();
}
