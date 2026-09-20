import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, describe, expect, it } from "vitest";
import { HARNESS_CALLER_IDENTITY_ENV } from "../src/harness-access";

const roots: string[] = [];
const candidateEntry = process.env.MAKE_DOCS_R8_TEST_CLI ??
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist/index.js");

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function temporary(prefix: string): string {
  const root = mkdtempSync(path.join(os.tmpdir(), prefix));
  roots.push(root);
  return root;
}

describe("W19 R8 installed mid-task access", () => {
  it("continues Store-free work, refreshes access, and retries only the failed operation", async () => {
    const fixture = temporary("make-docs-r8-installed-");
    const project = path.join(fixture, "project");
    const home = path.join(fixture, "home");
    const store = path.join(fixture, "store");
    mkdirSync(project);
    mkdirSync(home);
    const baseEnv = {
      ...process.env,
      HOME: home,
      USERPROFILE: home,
      CODEX_HOME: path.join(home, ".codex"),
      CLAUDE_CONFIG_DIR: path.join(home, ".claude"),
      MAKE_DOCS_HOME: store,
    };
    const cli = (args: string[]) => {
      const child = spawnSync(process.execPath, [candidateEntry, ...args], {
        cwd: project,
        env: baseEnv,
        encoding: "utf8",
        timeout: 30_000,
      });
      expect(child.error, child.stderr).toBeUndefined();
      expect(child.status, child.stderr || child.stdout).toBe(0);
      return JSON.parse(child.stdout) as Record<string, unknown>;
    };

    cli([
      "setup", "--yes", "--codex-method", "none", "--claude-code-method", "none",
      "--no-skills", "--target", project, "--json",
    ]);
    const machine = cli([
      "setup", "system", "--yes", "--codex-method", "none", "--claude-code-method", "none",
      "--generic-mcp-client", "live-client", "--target", project, "--json",
    ]);
    const generic = machine.genericMcp as {
      configuration: { mcpServers: { "make-docs": { env: Record<string, string> } } };
    };
    const callerIdentity = generic.configuration.mcpServers["make-docs"].env[HARNESS_CALLER_IDENTITY_ENV];
    expect(callerIdentity).toBeTruthy();

    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [candidateEntry, "mcp"],
      cwd: project,
      env: { ...baseEnv, [HARNESS_CALLER_IDENTITY_ENV]: callerIdentity },
      stderr: "pipe",
    });
    const client = new Client({ name: "make-docs-r8-mid-task", version: "1.0.0" }, { capabilities: {} });
    await client.connect(transport);
    try {
      const independentBefore = await client.callTool({
        name: "make_docs_resource_list",
        arguments: { targetRoot: project },
      });
      expect(independentBefore.isError, JSON.stringify(independentBefore)).not.toBe(true);

      const blocked = await client.callTool({
        name: "make_docs_project_state_status",
        arguments: { targetRoot: project },
      });
      expect(blocked.isError).toBe(true);
      expect(JSON.stringify(blocked)).toContain("store-not-configured");
      expect(JSON.stringify(blocked)).toContain("taskCanContinue");
      expect(JSON.stringify(blocked)).toContain("--generic-mcp-client live-client");

      cli([
        "setup", "--yes", "--codex-method", "none", "--claude-code-method", "none",
        "--generic-mcp-client", "live-client", "--target", project, "--json",
      ]);

      const retried = await client.callTool({
        name: "make_docs_project_state_status",
        arguments: { targetRoot: project },
      });
      expect(retried.isError, JSON.stringify(retried)).not.toBe(true);

      const independentAfter = await client.callTool({
        name: "make_docs_resource_list",
        arguments: { targetRoot: project },
      });
      expect(independentAfter.isError).not.toBe(true);
      expect(independentAfter.content).toEqual(independentBefore.content);
    } finally {
      await client.close();
    }

    expect(readFileSync(path.join(project, ".make-docs/config.yaml"), "utf8")).toContain(
      "generic-mcp-live-client",
    );
    expect(existsSync(path.join(project, ".make-docs/state"))).toBe(false);
    expect(existsSync(path.join(project, ".make-docs/store.db"))).toBe(false);
  }, 60_000);
});
