import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  applyGenericMcpSetup,
  genericMcpProjectIntent,
  prepareGenericMcpSetup,
} from "../src/generic-mcp-setup";
import { parseHarnessCallerIdentityValue, verifyMakeDocsExecutable } from "../src/harness-access";
import { createExecutionContext, serializeOperationError } from "../src/operations/context";
import { resolveHarnessOperationPolicy } from "../src/operations/harness-policy";
import { invokeOperation } from "../src/operations/registry";
import { formatCliError } from "../src/run/entry";
import { getGlobalConfigPath } from "../src/store/paths";
import { runSystemSetupCommand } from "../src/setup-system";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function temporary(prefix: string): string {
  const root = mkdtempSync(path.join(os.tmpdir(), prefix));
  roots.push(root);
  return root;
}

function executable() {
  return verifyMakeDocsExecutable({
    executablePath: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist/index.js"),
  });
}

function projectConfig(root: string, content = "{}\n"): void {
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(path.join(root, ".make-docs/config.yaml"), content);
}

async function capture(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("Expected the operation to fail.");
}

describe("W19 R8 scoped Store access", () => {
  it("does not open or create a Store for Store-free work", async () => {
    const root = temporary("make-docs-r8-project-");
    const store = path.join(temporary("make-docs-r8-store-parent-"), "store");
    projectConfig(root);
    let sessions = 0;
    const result = await invokeOperation(
      "resource.list",
      { targetRoot: root },
      createExecutionContext({
        surface: "mcp",
        route: "mcp",
        cwd: root,
        storeRoot: store,
        storeSession: async (_access, _operation, _declared, _target, run) => {
          sessions += 1;
          return run();
        },
      }),
    );
    expect(result.operation).toBe("resource.list");
    expect(sessions).toBe(0);
    expect(existsSync(store)).toBe(false);
  });

  it("does not require project harness access for Store-free MCP work", async () => {
    const root = temporary("make-docs-r8-project-");
    const machine = temporary("make-docs-r8-machine-");
    const store = path.join(temporary("make-docs-r8-store-parent-"), "store");
    projectConfig(root, [
      "harnessIntegrations:",
      "  - harness: codex",
      "    mode: disable",
      "  - harness: claude-code",
      "    mode: disable",
      "",
    ].join("\n"));
    const plan = prepareGenericMcpSetup({
      clientLabel: "other-client",
      storeRoot: store,
      machineRoot: machine,
      executable: executable(),
    });
    const configuration = plan.configuration as {
      mcpServers: { "make-docs": { env: { MAKE_DOCS_HARNESS_CALLER_IDENTITY: string } } };
    };
    const result = await invokeOperation(
      "resource.list",
      { targetRoot: root },
      createExecutionContext({
        surface: "mcp",
        route: "mcp",
        cwd: root,
        storeRoot: store,
        callerIdentityRaw:
          configuration.mcpServers["make-docs"].env.MAKE_DOCS_HARNESS_CALLER_IDENTITY,
      }),
    );
    expect(result.operation).toBe("resource.list");
    expect(existsSync(store)).toBe(false);
  });

  it("returns not-configured before a Store session and preserves one operation scope", async () => {
    const root = temporary("make-docs-r8-project-");
    const store = path.join(temporary("make-docs-r8-store-parent-"), "store");
    projectConfig(root);
    let sessions = 0;
    const error = await capture(invokeOperation(
      "project.state.status",
      { targetRoot: root },
      createExecutionContext({
        surface: "mcp",
        route: "mcp",
        cwd: root,
        storeRoot: store,
        storeSession: async (_access, _operation, _declared, _target, run) => {
          sessions += 1;
          return run();
        },
      }),
    ));
    expect(serializeOperationError(error)).toMatchObject({
      code: "store-not-configured",
      operation: "project.state.status",
      scope: "operation",
      taskCanContinue: true,
      nextAction: expect.stringContaining("make-docs setup"),
    });
    expect(formatCliError(error, false)).toContain("Independent Store-free work can continue");
    expect(JSON.parse(formatCliError(error, true))).toMatchObject({
      code: "store-not-configured",
      scope: "operation",
      taskCanContinue: true,
    });
    expect(sessions).toBe(0);
    expect(existsSync(store)).toBe(false);
  });

  it.each([
    ["store-unavailable", Object.assign(new Error("Store is offline."), { code: "store-unavailable" })],
    ["store-unsafe", Object.assign(new Error("Saved state changed."), { code: "snapshot-drift" })],
  ] as const)("keeps %s scoped to the requested operation", async (code, failure) => {
    const root = temporary("make-docs-r8-project-");
    projectConfig(root);
    const error = await capture(invokeOperation(
      "project.state.status",
      { targetRoot: root },
      createExecutionContext({
        surface: "cli",
        route: "direct-cli",
        cwd: root,
        storeSession: async () => { throw failure; },
      }),
    ));
    expect(serializeOperationError(error)).toMatchObject({
      code,
      operation: "project.state.status",
      scope: "operation",
      taskCanContinue: true,
    });
  });

  it("returns denied when configured policy does not admit the operation", async () => {
    const root = temporary("make-docs-r8-project-");
    projectConfig(root, [
      "harnessIntegrations:",
      "  - harness: codex",
      "    mode: disable",
      "",
    ].join("\n"));
    const error = await capture(invokeOperation(
      "project.state.status",
      { targetRoot: root },
      createExecutionContext({ surface: "mcp", route: "mcp", cwd: root }),
    ));
    expect(serializeOperationError(error)).toMatchObject({
      code: "store-denied",
      operation: "project.state.status",
      scope: "operation",
      taskCanContinue: true,
    });
  });
});

describe("W19 R8 setup reachability", () => {
  it("applies one valid machine subplan when another method is blocked", async () => {
    const machine = temporary("make-docs-r8-machine-");
    const store = path.join(temporary("make-docs-r8-store-parent-"), "store");
    let review = "";
    const result = await runSystemSetupCommand({
      dryRun: false,
      yes: true,
      harnesses: { codex: true, "claude-code": true },
      methods: { codex: "mcp", "claude-code": "permission-rules" },
      executable: executable(),
      machineRoot: machine,
      targetRoot: machine,
      storeRoot: store,
      onReview(value) { review = value; },
    });
    expect(result).toMatchObject({
      status: "partial",
      configured: ["codex"],
      blocked: [expect.objectContaining({ harness: "claude-code" })],
    });
    expect(review).toContain("Generic MCP client: available");
    expect(readFileSync(path.join(machine, ".codex/config.toml"), "utf8")).toContain("[mcp_servers.make_docs]");
  });

  it("keeps unsafe launcher failures distinct", () => {
    const root = temporary("make-docs-r8-launchers-");
    const packageBin = executable().path;
    const runner = path.join(root, "node");
    symlinkSync(packageBin, runner);
    expect(() => verifyMakeDocsExecutable({ executablePath: runner })).toThrow(expect.objectContaining({
      code: "executable-runner-forbidden",
      failedRule: "direct-make-docs-launcher",
    }));

    const directory = path.join(root, "directory");
    mkdirSync(directory);
    expect(() => verifyMakeDocsExecutable({ executablePath: directory })).toThrow(expect.objectContaining({
      code: "executable-not-file",
    }));

    const nonExecutable = path.join(root, "make-docs-copy");
    copyFileSync(packageBin, nonExecutable);
    chmodSync(nonExecutable, 0o644);
    expect(() => verifyMakeDocsExecutable({ executablePath: nonExecutable })).toThrow(expect.objectContaining({
      code: "executable-not-executable",
    }));

    const mismatch = path.join(root, "other-make-docs");
    writeFileSync(mismatch, "#!/bin/sh\nexit 0\n", { mode: 0o755 });
    expect(() => verifyMakeDocsExecutable({ executablePath: mismatch })).toThrow(expect.objectContaining({
      code: "executable-package-mismatch",
    }));
  });
});

describe("W19 R8 generic MCP profile", () => {
  it("creates bounded proof, repeats, rotates, verifies project access, and removes safely", () => {
    const root = temporary("make-docs-r8-project-");
    const store = path.join(temporary("make-docs-r8-store-parent-"), "store");
    projectConfig(root);
    const first = prepareGenericMcpSetup({
      clientLabel: "other-client",
      storeRoot: store,
      machineRoot: root,
      executable: executable(),
    });
    expect(first).toMatchObject({ changed: true, harnessId: "generic-mcp-other-client" });
    const config = first.configuration as {
      mcpServers: { "make-docs": { env: { MAKE_DOCS_HARNESS_CALLER_IDENTITY: string } } };
    };
    const identityRaw = config.mcpServers["make-docs"].env.MAKE_DOCS_HARNESS_CALLER_IDENTITY;
    const identity = parseHarnessCallerIdentityValue(identityRaw);
    expect(identity.kind).toBe("make-docs-generic-mcp-caller");
    applyGenericMcpSetup(first);
    const globalBytes = readFileSync(getGlobalConfigPath(store), "utf8");
    expect(globalBytes).toContain("proofSha256");
    if (identity.kind === "make-docs-generic-mcp-caller") {
      expect(globalBytes).not.toContain(identity.proof);
    }

    const repeat = prepareGenericMcpSetup({
      clientLabel: "other-client",
      storeRoot: store,
      executable: executable(),
    });
    expect(repeat).toMatchObject({ changed: false, state: "current", configuration: null });

    const rotated = prepareGenericMcpSetup({
      clientLabel: "other-client",
      action: "rotate",
      storeRoot: store,
      machineRoot: root,
      executable: executable(),
    });
    expect(rotated.configurationDigest).not.toBe(first.configurationDigest);
    applyGenericMcpSetup(rotated);

    const intent = genericMcpProjectIntent(rotated);
    projectConfig(root, [
      "harnessIntegrations:",
      `  - harness: ${intent.harness}`,
      `    mode: ${intent.mode}`,
      `    method: ${intent.method}`,
      "    accessCeiling:",
      "      store: write",
      "      project: write",
      "      hostConfig: none",
      "",
    ].join("\n"));
    const rotatedConfig = rotated.configuration as typeof config;
    const rotatedIdentity = rotatedConfig.mcpServers["make-docs"].env.MAKE_DOCS_HARNESS_CALLER_IDENTITY;
    expect(resolveHarnessOperationPolicy({
      operation: "project.state.status",
      route: "mcp",
      targetRoot: root,
      storeRoot: store,
      callerIdentityRaw: rotatedIdentity,
    })).toMatchObject({
      configured: true,
      verified: true,
      harnesses: ["generic-mcp-other-client"],
      methods: ["mcp"],
    });
    expect(() => resolveHarnessOperationPolicy({
      operation: "project.state.status",
      route: "mcp",
      targetRoot: root,
      storeRoot: store,
      callerIdentityRaw: identityRaw,
    })).toThrow(/proof is absent, stale, or does not match/);

    const changedRoot = prepareGenericMcpSetup({
      clientLabel: "changed-root",
      storeRoot: store,
      machineRoot: path.join(root, "other-machine"),
      executable: executable(),
    });
    const changedRootConfig = changedRoot.configuration as typeof config;
    applyGenericMcpSetup(changedRoot);
    const changedRootIdentity = changedRootConfig.mcpServers["make-docs"].env.MAKE_DOCS_HARNESS_CALLER_IDENTITY;
    projectConfig(root, [
      "harnessIntegrations:",
      "  - harness: generic-mcp-changed-root",
      "    mode: narrow",
      "    method: mcp",
      "",
    ].join("\n"));
    expect(resolveHarnessOperationPolicy({
      operation: "project.state.status",
      route: "mcp",
      targetRoot: root,
      storeRoot: store,
      callerIdentityRaw: changedRootIdentity,
    })).toMatchObject({ verified: true });

    const loaded = JSON.parse(readFileSync(getGlobalConfigPath(store), "utf8")) as {
      settings: { harnesses: Record<string, { configurationDigest?: string }> };
    };
    loaded.settings.harnesses["generic-mcp-changed-root"].configurationDigest = "0".repeat(64);
    writeFileSync(getGlobalConfigPath(store), `${JSON.stringify(loaded, null, 2)}\n`);
    expect(() => resolveHarnessOperationPolicy({
      operation: "project.state.status",
      route: "mcp",
      targetRoot: root,
      storeRoot: store,
      callerIdentityRaw: changedRootIdentity,
    })).toThrow(/configuration does not match/);

    const removal = prepareGenericMcpSetup({
      clientLabel: "other-client",
      action: "remove",
      storeRoot: store,
    });
    expect(removal.changed).toBe(true);
    applyGenericMcpSetup(removal);
    expect(readFileSync(getGlobalConfigPath(store), "utf8")).not.toContain("generic-mcp-other-client");
  });

  it("rejects unsafe labels and never names a client-owned file", () => {
    expect(() => prepareGenericMcpSetup({
      clientLabel: "../../client",
      executable: executable(),
    })).toThrow("stable lowercase label");
    const plan = prepareGenericMcpSetup({
      clientLabel: "safe-client",
      storeRoot: path.join(temporary("make-docs-r8-store-parent-"), "store"),
      executable: executable(),
    });
    expect(plan.review).toContain("will not edit client-owned files");
  });
});
