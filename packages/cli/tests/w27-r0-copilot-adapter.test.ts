import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fingerprintEntry, GITHUB_COPILOT_HARNESS_ADAPTER, sha256, verifyMakeDocsExecutable } from "../src/harness-access/index.js";
import { readNativeMcpConnection } from "../src/harness-access/native.js";
import { prepareSystemSetupCommand, runSystemSetupCommand } from "../src/setup-system.js";
import { MCP_CONNECTION_ID_ENV, MCP_CONNECTION_KEY_ENV } from "../src/mcp-connection.js";
import { matchMcpConnection } from "../src/mcp-connection.js";
import { loadGlobalConfig } from "../src/store/global-config.js";
import { readPendingHarnessSystemOperation } from "../src/store/harness-system-operations.js";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-copilot-"));
  roots.push(root);
  const executable = verifyMakeDocsExecutable({
    executablePath: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist/index.js"),
  });
  return { root, executable };
}

describe("W27 R0 Copilot CLI MCP entry", () => {
  it("writes one reviewed CLI entry and preserves other servers through repeat and removal", () => {
    const { root, executable } = fixture();
    const file = path.join(root, ".copilot/mcp-config.json");
    mkdirSync(path.dirname(file), { recursive: true });
    const other = { type: "local", command: "/bin/true", args: [], tools: ["hello"] };
    writeFileSync(file, JSON.stringify({ userSetting: { keep: true }, mcpServers: { other } }));

    const plan = GITHUB_COPILOT_HARNESS_ADAPTER.plan({ method: "mcp", scope: "machine", root, executable });
    expect(plan).toMatchObject({ state: "missing", changes: [{ entryId: "mcpServers.make-docs", action: "update" }] });
    const applied = GITHUB_COPILOT_HARNESS_ADAPTER.apply({ plan, approved: true, operationId: "w27.copilot.apply", appliedVersion: "2.0.4" });
    expect(applied.verification.state).toBe("current");
    const config = JSON.parse(readFileSync(file, "utf8"));
    expect(config.userSetting).toEqual({ keep: true });
    expect(config.mcpServers.other).toEqual(other);
    expect(config.mcpServers["make-docs"]).toMatchObject({
      type: "local", command: executable.path, args: ["mcp"], tools: ["*"],
      env: { [MCP_CONNECTION_ID_ENV]: expect.any(String), [MCP_CONNECTION_KEY_ENV]: expect.any(String) },
    });

    const repeat = GITHUB_COPILOT_HARNESS_ADAPTER.plan({ method: "mcp", scope: "machine", root, executable, receipt: applied.receipt });
    expect(repeat).toMatchObject({ state: "current", changes: [{ action: "none" }] });
    const removal = GITHUB_COPILOT_HARNESS_ADAPTER.planRemoval({ method: "mcp", scope: "machine", root, executable, receipt: applied.receipt });
    const removed = GITHUB_COPILOT_HARNESS_ADAPTER.applyRemoval({ plan: removal, approved: true });
    expect(removed.verification.state).toBe("missing");
    const after = JSON.parse(readFileSync(file, "utf8"));
    expect(after.mcpServers.other).toEqual(other);
    expect(after.mcpServers["make-docs"]).toBeUndefined();
  });

  it("blocks a user-owned name and a changed receipt entry", () => {
    const { root, executable } = fixture();
    const file = path.join(root, ".copilot/mcp-config.json");
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify({ mcpServers: { "make-docs": { type: "local", command: "/bin/true", args: [], tools: ["*"] } } }));
    expect(GITHUB_COPILOT_HARNESS_ADAPTER.plan({ method: "mcp", scope: "machine", root, executable })).toMatchObject({ state: "blocked", changes: [{ action: "none" }] });
    rmSync(file);
    const plan = GITHUB_COPILOT_HARNESS_ADAPTER.plan({ method: "mcp", scope: "machine", root, executable });
    const applied = GITHUB_COPILOT_HARNESS_ADAPTER.apply({ plan, approved: true, operationId: "w27.copilot.drift", appliedVersion: "2.0.4" });
    const changed = JSON.parse(readFileSync(file, "utf8"));
    changed.mcpServers["make-docs"].tools = ["one"];
    writeFileSync(file, JSON.stringify(changed));
    expect(GITHUB_COPILOT_HARNESS_ADAPTER.plan({ method: "mcp", scope: "machine", root, executable, receipt: applied.receipt })).toMatchObject({ state: "drifted", changes: [{ action: "none" }] });
  });

  it("repairs a receipt-owned prior entry only after review", () => {
    const { root, executable } = fixture();
    const file = path.join(root, ".copilot/mcp-config.json");
    mkdirSync(path.dirname(file), { recursive: true });
    const other = { type: "local", command: "/bin/true", args: [] };
    writeFileSync(file, JSON.stringify({ mcpServers: { other } }));
    const initialPlan = GITHUB_COPILOT_HARNESS_ADAPTER.plan({ method: "mcp", scope: "machine", root, executable });
    const initial = GITHUB_COPILOT_HARNESS_ADAPTER.apply({ plan: initialPlan, approved: true, operationId: "w27.copilot.prior", appliedVersion: "2.0.4" });
    const config = JSON.parse(readFileSync(file, "utf8"));
    const priorEntry = { ...config.mcpServers["make-docs"], tools: ["legacy-tool"] };
    config.mcpServers["make-docs"] = priorEntry;
    writeFileSync(file, JSON.stringify(config));
    const priorReceipt = {
      ...initial.receipt,
      entries: [{
        ...initial.receipt.entries[0]!,
        value: priorEntry,
        entryFingerprint: fingerprintEntry(priorEntry),
        fileFingerprint: sha256(readFileSync(file, "utf8")),
      }],
    };
    const repair = GITHUB_COPILOT_HARNESS_ADAPTER.repair({ method: "mcp", scope: "machine", root, executable, receipt: priorReceipt });
    expect(repair).toMatchObject({ state: "drifted", changes: [{ action: "update", ownership: "make-docs-owned" }] });
    expect(() => GITHUB_COPILOT_HARNESS_ADAPTER.apply({ plan: repair, approved: false, operationId: "w27.copilot.repair", appliedVersion: "2.0.4" })).toThrow("explicit approval");
    expect(JSON.parse(readFileSync(file, "utf8")).mcpServers["make-docs"].tools).toEqual(["legacy-tool"]);
    const repaired = GITHUB_COPILOT_HARNESS_ADAPTER.apply({ plan: repair, approved: true, operationId: "w27.copilot.repair", appliedVersion: "2.0.4" });
    expect(repaired.verification.state).toBe("current");
    const after = JSON.parse(readFileSync(file, "utf8"));
    expect(after.mcpServers.other).toEqual(other);
    expect(after.mcpServers["make-docs"].tools).toEqual(["*"]);
  });

  it("blocks a same-name project entry without changing any file", async () => {
    const { root, executable } = fixture();
    writeFileSync(path.join(root, ".mcp.json"), JSON.stringify({ mcpServers: { "make-docs": { command: "/bin/true" } } }));
    const prepared = await prepareSystemSetupCommand({
      dryRun: true, yes: true, machineRoot: root, targetRoot: root, storeRoot: path.join(root, "store"), executable,
      harnesses: { codex: false, "claude-code": false, "github-copilot": true },
      methods: { "github-copilot": "mcp" },
    });
    expect(prepared.plans[0]).toMatchObject({ harness: "github-copilot", status: "blocked", changed: false });
    expect(prepared.plans[0]?.detail).toContain("shadow the CLI user entry");
    expect(readFileSync(path.join(root, ".mcp.json"), "utf8")).toContain("make-docs");
  });

  it("blocks a custom CLI home and leaves it untouched", async () => {
    const { root, executable } = fixture();
    const prior = process.env.COPILOT_HOME;
    process.env.COPILOT_HOME = path.join(root, "custom-copilot");
    try {
      const prepared = await prepareSystemSetupCommand({
        dryRun: true, yes: true, machineRoot: root, targetRoot: root, storeRoot: path.join(root, "store"), executable,
        harnesses: { codex: false, "claude-code": false, "github-copilot": true },
        methods: { "github-copilot": "mcp" },
      });
      expect(prepared.plans[0]).toMatchObject({ harness: "github-copilot", status: "blocked", changed: false });
      expect(prepared.plans[0]?.detail).toContain("COPILOT_HOME");
    } finally {
      if (prior === undefined) delete process.env.COPILOT_HOME;
      else process.env.COPILOT_HOME = prior;
    }
  });

  it("reviews key rotation and rejects the old key", async () => {
    const { root, executable } = fixture();
    const project = path.join(root, "project");
    mkdirSync(project);
    const options = {
      dryRun: false, yes: true, machineRoot: root, targetRoot: project, storeRoot: path.join(root, "store"), executable,
      harnesses: { codex: false, "claude-code": false, "github-copilot": true },
      methods: { "github-copilot": "mcp" as const },
    };
    expect((await runSystemSetupCommand(options)).status).toBe("configured");
    const before = readNativeMcpConnection(GITHUB_COPILOT_HARNESS_ADAPTER, root)!;
    const review = await prepareSystemSetupCommand({ ...options, dryRun: true, rotateMcp: true });
    expect(review.review).toContain("key replacement");
    expect(review.review).not.toContain(before.key);
    expect(readNativeMcpConnection(GITHUB_COPILOT_HARNESS_ADAPTER, root)).toEqual(before);
    expect((await runSystemSetupCommand({ ...options, rotateMcp: true })).status).toBe("configured");
    const after = readNativeMcpConnection(GITHUB_COPILOT_HARNESS_ADAPTER, root)!;
    expect(after.id).not.toBe(before.id);
    expect(after.key).not.toBe(before.key);
    const harnesses = loadGlobalConfig(options.storeRoot).config.settings.harnesses;
    expect(matchMcpConnection(harnesses, before.id, before.key)).toBeNull();
    expect(matchMcpConnection(harnesses, after.id, after.key)).not.toBeNull();
  });

  it("resumes an interrupted native apply without losing other servers", async () => {
    const { root, executable } = fixture();
    const project = path.join(root, "project");
    mkdirSync(project);
    const file = path.join(root, ".copilot/mcp-config.json");
    mkdirSync(path.dirname(file));
    const other = { type: "local", command: "/bin/true", args: [] };
    writeFileSync(file, JSON.stringify({ mcpServers: { other } }));
    const options = {
      dryRun: false, yes: true, machineRoot: root, targetRoot: project, storeRoot: path.join(root, "store"), executable,
      harnesses: { codex: false, "claude-code": false, "github-copilot": true },
      methods: { "github-copilot": "mcp" as const },
    };
    const interrupted = await runSystemSetupCommand({ ...options, afterNativeApplyForTests() { throw new Error("test interruption"); } });
    expect(interrupted.status).toBe("recovery");
    expect(readPendingHarnessSystemOperation(project, options.storeRoot)).not.toBeNull();
    expect(JSON.parse(readFileSync(file, "utf8")).mcpServers.other).toEqual(other);
    const resumed = await runSystemSetupCommand(options);
    expect(resumed.status).toBe("configured");
    expect(readPendingHarnessSystemOperation(project, options.storeRoot)).toBeNull();
    expect(JSON.parse(readFileSync(file, "utf8")).mcpServers.other).toEqual(other);
  });

  it("uses the built package for Store-free and grant-bound MCP calls", async () => {
    const { root, executable } = fixture();
    const home = path.join(root, "home");
    const project = path.join(root, "project");
    const store = path.join(root, "store");
    mkdirSync(home);
    mkdirSync(project);
    const env = {
      ...process.env,
      HOME: home,
      USERPROFILE: home,
      COPILOT_HOME: path.join(home, ".copilot"),
      MAKE_DOCS_HOME: store,
    };
    const setup = spawnSync(process.execPath, [executable.path, "setup", "--yes", "--json", "--no-codex", "--no-claude-code", "--no-skills", "--github-copilot-method", "mcp", "--target", project], {
      cwd: project, env, encoding: "utf8", timeout: 60_000,
    });
    expect(setup.error, setup.stderr).toBeUndefined();
    expect(setup.status, setup.stderr || setup.stdout).toBe(0);
    const result = JSON.parse(setup.stdout);
    expect(result.status, JSON.stringify({ failedCondition: result.failedCondition, nextAction: result.nextAction, machine: result.machine?.states })).toBe("complete");
    const native = JSON.parse(readFileSync(path.join(home, ".copilot/mcp-config.json"), "utf8"));
    const connection = native.mcpServers["make-docs"].env as Record<string, string>;
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [executable.path, "mcp"],
      cwd: project,
      env: { ...env, ...connection },
      stderr: "pipe",
    });
    const client = new Client({ name: "w27-copilot-local-proof", version: "1.0.0" }, { capabilities: {} });
    await client.connect(transport);
    try {
      const names = (await client.listTools()).tools.map(tool => tool.name);
      expect(names).toContain("resource_list");
      expect(names).toContain("project_status");
      const resource = await client.callTool({ name: "resource_list", arguments: { targetRoot: project } });
      expect(resource.isError, JSON.stringify(resource)).not.toBe(true);
      const status = await client.callTool({ name: "project_status", arguments: { targetRoot: project } });
      expect(status.isError, JSON.stringify(status)).not.toBe(true);
      const denied = await client.callTool({ name: "project_status", arguments: { targetRoot: path.join(root, "other") } });
      expect(denied.isError).toBe(true);
    } finally {
      await client.close();
    }
  }, 75_000);
});
