import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { spawn } from "node:child_process";
import { once } from "node:events";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  getMakeDocsConfigPath,
  loadMakeDocsConfig,
  resolveEffectiveHarnessIntegration,
} from "../src/config";
import {
  CODEX_HARNESS_ADAPTER,
  HARNESS_CALLER_IDENTITY_ENV,
  encodeHarnessCallerIdentity,
  fingerprintEntry,
  sha256,
  validateHarnessCommandRules,
  verifyMakeDocsExecutable,
} from "../src/harness-access";
import { callMakeDocsMcpTool, listMakeDocsMcpTools } from "../src/mcp/tools";
import { createExecutionContext } from "../src/operations/context";
import { assertOperationAccess } from "../src/operations/access";
import {
  invokeOperation,
  listCommandRuleCandidates,
  listHarnessCommandRules,
  listOperationAccessFacts,
  listOperations,
  validateRegistryHarnessCommandRules,
} from "../src/operations/registry";
import {
  defaultGlobalConfig,
  loadGlobalConfig,
  writeGlobalConfig,
} from "../src/store/global-config";
import {
  isHarnessIntegrationReceipt,
  listHarnessIntegrationReceiptHistory,
  readCurrentHarnessIntegrationReceipt,
  readHarnessIntegrationReceipt,
  recordHarnessIntegrationReceipt,
  recordHarnessIntegrationReceiptObservation,
  type StoredHarnessIntegrationReceipt,
} from "../src/store/harness-integration-receipts";
import type {
  HarnessAccessReceipt,
  HarnessCommandRuleAuthority,
} from "../src/harness-access";
import { withInstallationOperation } from "../src/store/installation-state";
import { recoverDeadStoreLeases } from "../src/store/lease-recovery";

const tempDirs: string[] = [];
const originalStoreRoot = process.env.MAKE_DOCS_HOME;
const originalCallerIdentity = process.env[HARNESS_CALLER_IDENTITY_ENV];
const COMMAND_RULE_AUTHORITY = {
  list: listHarnessCommandRules,
  validate: validateRegistryHarnessCommandRules,
} satisfies HarnessCommandRuleAuthority;

function tempDir(name: string): string {
  const dir = path.join(
    os.tmpdir(),
    `${name}-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  mkdirSync(dir, { recursive: true });
  tempDirs.push(dir);
  return dir;
}

async function waitUntilExists(file: string): Promise<void> {
  for (let attempt = 0; attempt < 200; attempt++) {
    if (existsSync(file)) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Timed out waiting for ${file}.`);
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  if (originalStoreRoot === undefined) delete process.env.MAKE_DOCS_HOME;
  else process.env.MAKE_DOCS_HOME = originalStoreRoot;
  if (originalCallerIdentity === undefined) delete process.env[HARNESS_CALLER_IDENTITY_ENV];
  else process.env[HARNESS_CALLER_IDENTITY_ENV] = originalCallerIdentity;
});

describe("W19 R6 operation access", () => {
  it("publishes one complete access declaration for every operation", () => {
    const operations = listOperations();
    const facts = listOperationAccessFacts();
    expect(facts.map((fact) => fact.operation).sort()).toEqual(
      operations.map((operation) => operation.id).sort(),
    );
    for (const operation of operations) {
      expect(Object.keys(operation.access).sort(), operation.id).toEqual([
        "hostConfig",
        "project",
        "store",
      ]);
      expect(["none", "read", "write"]).toContain(operation.access.store);
      expect(["none", "read", "write"]).toContain(operation.access.project);
      expect(["none", "write"]).toContain(operation.access.hostConfig);
    }
    expect(listCommandRuleCandidates().every((fact) => fact.access.hostConfig === "none")).toBe(true);
    const rules = listHarnessCommandRules();
    expect(validateRegistryHarnessCommandRules(rules)).toBe(rules);
    expect(validateHarnessCommandRules(rules, COMMAND_RULE_AUTHORITY)).toHaveLength(
      listCommandRuleCandidates().length,
    );
    for (const rule of rules) {
      const fact = facts.find((candidate) => candidate.operation === rule.operationIds[0])!;
      expect(rule.commandPrefix).toEqual([fact.cli.root, ...fact.cli.path.split(" ")]);
      expect(rule.commandPrefix[0]).not.toBe("make-docs");
      expect(rule.access).toEqual({ ...fact.access, hostConfig: "none" });
    }
    expect(() => assertOperationAccess(
      "unsafe.write",
      { store: "none", project: "none", hostConfig: "none" },
      "write",
    )).toThrow("must declare the state that it writes");
  });

  it("does not admit or create a Store for store-free resource reads", async () => {
    const targetRoot = tempDir("make-docs-r6-resource");
    const storeRoot = path.join(tempDir("make-docs-r6-store-parent"), "absent-store");
    const context = createExecutionContext({ cwd: targetRoot, storeRoot });

    await expect(invokeOperation("resource.list", { targetRoot }, context)).resolves.toMatchObject({
      operation: "resource.list",
    });
    expect(existsSync(storeRoot)).toBe(false);
    await expect(invokeOperation("project.state.status", { targetRoot }, context)).rejects.toThrow(
      "Store is absent",
    );
    expect(existsSync(storeRoot)).toBe(false);
  });

  it("bypasses busy, unsafe, and unreadable Store state for store-free reads", async () => {
    const targetRoot = tempDir("make-docs-r6-resource-blocked-store");
    const storeRoot = path.join(tempDir("make-docs-r6-blocked-store-parent"), "store");
    withInstallationOperation(targetRoot, "test.prepare-store", () => undefined, { storeRoot });
    const context = createExecutionContext({ cwd: targetRoot, storeRoot });
    const resourceRead = () => invokeOperation("resource.list", { targetRoot }, context);
    const storeRead = () => invokeOperation("project.state.status", { targetRoot }, context);

    const removalLock = path.join(storeRoot, "removal.lock");
    writeFileSync(removalLock, JSON.stringify({
      token: "live-removal",
      pid: process.pid,
      hostname: os.hostname(),
      startedAt: new Date().toISOString(),
    }), { mode: 0o600 });
    await expect(resourceRead()).resolves.toMatchObject({ operation: "resource.list" });
    await expect(storeRead()).rejects.toThrow("already owns the exclusive Store lock");
    rmSync(removalLock);

    const unsafePath = path.join(storeRoot, "store-access.lock");
    symlinkSync(path.join(storeRoot, "outside"), unsafePath);
    await expect(resourceRead()).resolves.toMatchObject({ operation: "resource.list" });
    await expect(storeRead()).rejects.toThrow(/symbolic|Unsafe/i);
    rmSync(unsafePath);

    if (process.platform !== "win32") {
      chmodSync(storeRoot, 0o000);
      try {
        await expect(resourceRead()).resolves.toMatchObject({ operation: "resource.list" });
        await expect(storeRead()).rejects.toThrow(/access|permission/i);
      } finally {
        chmodSync(storeRoot, 0o700);
      }
    }
  });

  it("admits recovery without treating its own session as a prior live owner", async () => {
    const targetRoot = tempDir("make-docs-r6-recovery-admission");
    const storeRoot = path.join(tempDir("make-docs-r6-recovery-store-parent"), "store");
    withInstallationOperation(targetRoot, "test.prepare-store", () => undefined, { storeRoot });
    const context = createExecutionContext({ cwd: targetRoot, storeRoot, writesAllowed: true });
    const access = { store: "write", project: "write", hostConfig: "none" } as const;
    const recover = () => context.withStoreSession(
      "write",
      "project.state.recover",
      access,
      targetRoot,
      () => recoverDeadStoreLeases(storeRoot),
    );

    await expect(recover()).resolves.toEqual({ removed: [] });

    const ready = path.join(tempDir("make-docs-r6-live-owner"), "ready");
    const release = path.join(path.dirname(ready), "release");
    const accessDirectory = path.join(storeRoot, "store-access.lock");
    const liveSession = path.join(accessDirectory, "external-live.json");
    const script = [
      "const fs = require('node:fs');",
      "const os = require('node:os');",
      `fs.mkdirSync(${JSON.stringify(accessDirectory)}, { recursive: true, mode: 0o700 });`,
      `fs.writeFileSync(${JSON.stringify(liveSession)}, JSON.stringify({ version: 1, token: 'external-live', pid: process.pid, hostname: os.hostname(), startedAt: new Date().toISOString() }), { mode: 0o600 });`,
      `fs.writeFileSync(${JSON.stringify(ready)}, 'ready');`,
      `while (!fs.existsSync(${JSON.stringify(release)})) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);`,
      `fs.rmSync(${JSON.stringify(liveSession)}, { force: true });`,
    ].join("\n");
    const child = spawn(process.execPath, ["-e", script], { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (value) => { stderr += String(value); });
    try {
      await waitUntilExists(ready);
      await expect(recover()).rejects.toThrow("live process owns");
      expect(existsSync(liveSession)).toBe(true);
    } finally {
      writeFileSync(release, "release");
      const [code] = await once(child, "exit");
      expect(code, stderr).toBe(0);
    }
  });
});

describe("W19 R6 harness intent", () => {
  function writeProjectHarnessIntent(targetRoot: string, lines: string[]): void {
    const file = getMakeDocsConfigPath(targetRoot);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, [...lines, ""].join("\n"));
  }

  function configureVerifiedCodexMcp(
    targetRoot: string,
    storeRoot: string,
    nativeRoot: string,
  ): void {
    withInstallationOperation(targetRoot, "test.prepare-store", () => undefined, { storeRoot });
    const executable = verifyMakeDocsExecutable({
      executablePath: path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../dist/index.js",
      ),
    });
    const plan = CODEX_HARNESS_ADAPTER.plan({
      method: "mcp",
      scope: "machine",
      root: nativeRoot,
      executable,
    });
    const applied = CODEX_HARNESS_ADAPTER.apply({
      plan,
      approved: true,
      operationId: "runtime-project-policy",
      appliedVersion: executable.packageVersion,
      verifiedAt: "2026-09-12T20:00:00.000Z",
    });
    recordHarnessIntegrationReceipt(targetRoot, storeRoot, applied.receipt);
    expect(readCurrentHarnessIntegrationReceipt(
      targetRoot,
      storeRoot,
      "machine",
      "codex",
      "mcp",
    )).toEqual(applied.receipt);
    const global = defaultGlobalConfig();
    global.settings.harnesses.codex = {
      selected: true,
      maximumMethod: "mcp",
      accessCeiling: { store: "write", project: "write", hostConfig: "none" },
    };
    writeGlobalConfig(storeRoot, global);
    process.env.MAKE_DOCS_HOME = storeRoot;
    process.env[HARNESS_CALLER_IDENTITY_ENV] = encodeHarnessCallerIdentity({
      schemaVersion: 1,
      kind: "make-docs-harness-caller",
      adapterId: CODEX_HARNESS_ADAPTER.id,
      adapterVersion: CODEX_HARNESS_ADAPTER.version,
      harnessId: CODEX_HARNESS_ADAPTER.harnessId,
      connectionMethod: "mcp",
      scope: "machine",
      root: nativeRoot,
      executable,
    });
  }

  it("keeps unknown global config fields while adding per-harness machine intent", () => {
    const storeRoot = tempDir("make-docs-r6-global-config");
    const config = defaultGlobalConfig();
    config.futureRoot = { retained: true };
    config.settings.futureSetting = "retained";
    config.settings.harnesses.codex = {
      selected: true,
      maximumMethod: "mcp",
      accessCeiling: { store: "write", project: "write", hostConfig: "none" },
      futureHarnessSetting: 7,
    };
    writeGlobalConfig(storeRoot, config);

    const loaded = loadGlobalConfig(storeRoot);
    expect(loaded.warnings).toEqual([]);
    expect(loaded.config.settings.harnesses.codex).toEqual({
      selected: true,
      maximumMethod: "mcp",
      accessCeiling: { store: "write", project: "write", hostConfig: "none" },
      futureHarnessSetting: 7,
    });
    writeGlobalConfig(storeRoot, loaded.config);
    const raw = JSON.parse(readFileSync(loaded.path, "utf8"));
    expect(raw.futureRoot).toEqual({ retained: true });
    expect(raw.settings.futureSetting).toBe("retained");
    expect(raw.settings.harnesses.codex.futureHarnessSetting).toBe(7);
  });

  it("loads project inherit, narrow, and disable intent outside harnessCapabilities", () => {
    const targetRoot = tempDir("make-docs-r6-project-config");
    const file = getMakeDocsConfigPath(targetRoot);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, [
      "harnessIntegrations:",
      "  - harness: codex",
      "    mode: inherit",
      "  - harness: claude-code",
      "    mode: narrow",
      "    method: permission-rules",
      "    accessCeiling:",
      "      store: read",
      "      project: read",
      "      hostConfig: none",
      "  - harness: future-harness",
      "    mode: disable",
      "",
    ].join("\n"));
    const loaded = loadMakeDocsConfig(targetRoot);
    expect(loaded.valid).toBe(true);
    expect(loaded.config.harnessCapabilities).toEqual([]);
    expect(loaded.config.harnessIntegrations).toEqual([
      { harness: "codex", mode: "inherit" },
      {
        harness: "claude-code",
        mode: "narrow",
        method: "permission-rules",
        accessCeiling: { store: "read", project: "read", hostConfig: "none" },
      },
      { harness: "future-harness", mode: "disable" },
    ]);
  });

  it("rejects a method that belongs to a different first-party harness", () => {
    const storeRoot = tempDir("make-docs-r6-invalid-global-method");
    const config = defaultGlobalConfig();
    config.settings.harnesses["claude-code"] = {
      selected: true,
      maximumMethod: "command-rules",
      accessCeiling: { store: "write", project: "write", hostConfig: "none" },
    };
    writeGlobalConfig(storeRoot, config);
    const loaded = loadGlobalConfig(storeRoot);
    expect(loaded.config.settings.harnesses["claude-code"]).toBeUndefined();
    expect(loaded.warnings.join("\n")).toContain("does not admit command-rules");
  });

  it("lets project intent narrow or disable but never widen machine approval", () => {
    const machine = {
      selected: true,
      maximumMethod: "command-rules",
      accessCeiling: { store: "read", project: "write", hostConfig: "none" } as const,
    };
    expect(resolveEffectiveHarnessIntegration(undefined, machine, "codex")).toEqual({
      enabled: true,
      method: "command-rules",
      access: machine.accessCeiling,
      source: "machine",
    });
    expect(resolveEffectiveHarnessIntegration(
      { harness: "codex", mode: "disable" },
      machine,
      "codex",
    )).toEqual({
      enabled: false,
      method: null,
      access: { store: "none", project: "none", hostConfig: "none" },
      source: "project-disable",
    });
    expect(() => resolveEffectiveHarnessIntegration(
      { harness: "codex", mode: "narrow", method: "mcp" },
      machine,
      "codex",
    )).toThrow("broader than machine-approved");

    expect(() => resolveEffectiveHarnessIntegration(
      {
        harness: "codex",
        mode: "narrow",
        accessCeiling: { store: "write", project: "read", hostConfig: "none" },
      },
      machine,
      "codex",
    )).toThrow("broader than the machine-approved access ceiling");
    expect(resolveEffectiveHarnessIntegration(
      {
        harness: "codex",
        mode: "narrow",
        accessCeiling: { store: "none", project: "read", hostConfig: "none" },
      },
      machine,
      "codex",
    )).toMatchObject({
      enabled: true,
      method: "command-rules",
      access: { store: "none", project: "read", hostConfig: "none" },
    });
  });

  it("blocks production MCP operation access and exposure when the project disables a harness", async () => {
    const targetRoot = tempDir("make-docs-r6-runtime-disable-project");
    const storeRoot = tempDir("make-docs-r6-runtime-disable-store");
    withInstallationOperation(targetRoot, "test.prepare-store", () => undefined, { storeRoot });
    process.env.MAKE_DOCS_HOME = storeRoot;
    delete process.env[HARNESS_CALLER_IDENTITY_ENV];
    writeProjectHarnessIntent(targetRoot, [
      "harnessIntegrations:",
      "  - harness: codex",
      "    mode: disable",
    ]);

    const tools = listMakeDocsMcpTools(targetRoot);
    expect(tools.find((tool) => tool.operation === "project.state.status")?.mcpReady).toBe(false);
    expect(tools.find((tool) => tool.operation === "resource.list")?.mcpReady).toBe(true);
    await expect(callMakeDocsMcpTool("make_docs_project_state_status", { targetRoot }))
      .rejects.toThrow("does not allow operation 'project.state.status'");
    await expect(callMakeDocsMcpTool("make_docs_resource_list", { targetRoot }))
      .resolves.toMatchObject({ operation: "resource.list", mcpReady: true });
  });

  it("uses a verified caller and project ceiling to allow reads but block writes", async () => {
    const targetRoot = tempDir("make-docs-r6-runtime-narrow-project");
    const storeRoot = tempDir("make-docs-r6-runtime-narrow-store");
    const nativeRoot = tempDir("make-docs-r6-runtime-narrow-home");
    configureVerifiedCodexMcp(targetRoot, storeRoot, nativeRoot);
    writeProjectHarnessIntent(targetRoot, [
      "harnessIntegrations:",
      "  - harness: codex",
      "    mode: narrow",
      "    accessCeiling:",
      "      store: read",
      "      project: read",
      "      hostConfig: none",
    ]);

    const tools = listMakeDocsMcpTools(targetRoot);
    expect(tools.find((tool) => tool.operation === "project.state.status")?.mcpReady).toBe(true);
    expect(tools.find((tool) => tool.operation === "project.surface.ensure")?.mcpReady).toBe(false);
    await expect(callMakeDocsMcpTool("make_docs_project_state_status", { targetRoot }))
      .resolves.toMatchObject({
        operation: "project.state.status",
        access: { store: "read", project: "read", hostConfig: "none" },
        mcpReady: true,
      });
    await expect(callMakeDocsMcpTool("make_docs_project_surface_ensure", {
      targetRoot,
      surface: "assets",
      allowWrite: true,
    })).rejects.toThrow("does not allow operation 'project.surface.ensure'");
  });
});

describe("W19 R6 harness receipts", () => {
  function receipt(scope: "machine" | "project", suffix = ""): HarnessAccessReceipt {
    const packageRoot = "/usr/local/lib/node_modules/@brucewaynedecoy/make-docs";
    const binRelativePath = "dist/index.js";
    const executablePath = path.resolve(packageRoot, binRelativePath);
    const value = { command: executablePath };
    return {
      schemaVersion: 1,
      operationId: `operation-${scope}${suffix}`,
      adapterId: "make-docs.codex",
      adapterVersion: 1,
      harnessId: "codex",
      connectionMethod: "mcp",
      scope,
      executable: {
        kind: "make-docs",
        path: executablePath,
        sha256: sha256("reviewed executable"),
        size: 19,
        productMarker: "@brucewaynedecoy/make-docs:package-bin",
        packageName: "@brucewaynedecoy/make-docs",
        packageVersion: "2.0.0-rc",
        packageRoot,
        binRelativePath,
      },
      appliedVersion: "2.0.0-rc",
      verifiedAt: "2026-09-12T12:00:00.000Z",
      entries: [{
        entryId: "make-docs-mcp",
        path: ".codex/config.toml",
        ownership: "make-docs",
        beforeEntryFingerprint: null,
        beforeFileFingerprint: null,
        beforeValue: null,
        entryFingerprint: fingerprintEntry(value),
        fileFingerprint: sha256("reviewed native file"),
        value,
      }],
      result: "verified",
      verificationResult: "passed",
      driftState: "current",
      recoveryStatus: "complete",
    };
  }

  it("requires exact ownership fingerprints", () => {
    const value = receipt("machine");
    expect(isHarnessIntegrationReceipt(value)).toBe(true);
    value.entries[0]!.value = { command: "/different/make-docs" };
    expect(isHarnessIntegrationReceipt(value)).toBe(false);
  });

  it("stores machine and project receipts in existing Store records", () => {
    const targetRoot = tempDir("make-docs-r6-receipt-project");
    const storeRoot = path.join(tempDir("make-docs-r6-receipt-store-parent"), "store");
    const machine = receipt("machine");
    recordHarnessIntegrationReceipt(targetRoot, storeRoot, machine);
    expect(readHarnessIntegrationReceipt(
      targetRoot,
      storeRoot,
      "machine",
      machine.operationId,
    )).toEqual(machine);
    expect(readCurrentHarnessIntegrationReceipt(
      targetRoot,
      storeRoot,
      "machine",
      "codex",
      "mcp",
    )).toEqual(machine);

    const nextMachine = receipt("machine", "-next");
    nextMachine.verifiedAt = "2026-09-12T13:00:00.000Z";
    recordHarnessIntegrationReceipt(targetRoot, storeRoot, nextMachine);
    expect(readCurrentHarnessIntegrationReceipt(
      targetRoot,
      storeRoot,
      "machine",
      "codex",
      "mcp",
    )).toEqual(nextMachine);
    expect(listHarnessIntegrationReceiptHistory(targetRoot, storeRoot, "machine")
      .map((receipt) => receipt.operationId)).toEqual([
        nextMachine.operationId,
        machine.operationId,
      ]);

    const drifted: StoredHarnessIntegrationReceipt = {
      ...nextMachine,
      verifiedAt: "2026-09-12T14:00:00.000Z",
      result: "partial",
      verificationResult: "failed",
      driftState: "drifted",
      recoveryStatus: "recovery-required",
    };
    recordHarnessIntegrationReceiptObservation(targetRoot, storeRoot, drifted);
    expect(listHarnessIntegrationReceiptHistory(targetRoot, storeRoot, "machine")[0]).toEqual(drifted);
    expect(readCurrentHarnessIntegrationReceipt(
      targetRoot,
      storeRoot,
      "machine",
      "codex",
      "mcp",
    )).toEqual(nextMachine);

    withInstallationOperation(targetRoot, "test.bind-project", () => undefined, { storeRoot });
    const project = receipt("project");
    recordHarnessIntegrationReceipt(targetRoot, storeRoot, project);
    expect(readHarnessIntegrationReceipt(
      targetRoot,
      storeRoot,
      "project",
      project.operationId,
    )).toEqual(project);
    expect(readCurrentHarnessIntegrationReceipt(
      targetRoot,
      storeRoot,
      "project",
      "codex",
      "mcp",
    )).toEqual(project);
  });
});
