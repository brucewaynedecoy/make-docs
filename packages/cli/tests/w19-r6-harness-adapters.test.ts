import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CLAUDE_CODE_HARNESS_ADAPTER,
  CODEX_HARNESS_ADAPTER,
  FIRST_PARTY_HARNESS_ADAPTERS,
  HARNESS_CALLER_IDENTITY_ARG,
  HARNESS_CALLER_IDENTITY_ENV,
  HARNESS_CALLER_REFERENCE_ARG,
  PI_HARNESS_SUPPORT,
  getFirstPartyHarnessAdapter,
  listBoundedHarnessCommandRules,
  encodeHarnessCallerIdentity,
  encodeHarnessCallerIdentityArgument,
  encodeHarnessCallerReference,
  fingerprintEntry,
  parseHarnessCallerIdentity,
  parseHarnessCallerIdentityArgument,
  parseHarnessCallerReference,
  resolveHarnessMethodSupport,
  verifyMakeDocsExecutable,
  type HarnessCommandRule,
  type HarnessCommandRuleAuthority,
  type HarnessAccessReceipt,
  type VerifiedExecutableIdentity,
} from "../src/harness-access/index.js";
import { resolveCliLaunchArgv, runCli } from "../src/cli.js";
import { __setHarnessNativeMutationHookForTests } from "../src/harness-access/native.js";
import {
  listHarnessCommandRules,
  validateRegistryHarnessCommandRules,
} from "../src/operations/registry.js";
import { resolveHarnessOperationPolicy } from "../src/operations/harness-policy.js";
import { createExecutionContext, resolveCliOperationRoute } from "../src/operations/context.js";
import { runSystemSetupCommand } from "../src/setup-system.js";

const roots: string[] = [];

afterEach(() => {
  __setHarnessNativeMutationHookForTests(null);
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixture(): { root: string; executable: VerifiedExecutableIdentity } {
  const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-harness-"));
  roots.push(root);
  const executablePath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../dist/index.js",
  );
  return {
    root,
    executable: verifyMakeDocsExecutable({ executablePath }),
  };
}

const COMMAND_RULE_AUTHORITY: HarnessCommandRuleAuthority = Object.freeze({
  list: listHarnessCommandRules,
  validate: validateRegistryHarnessCommandRules,
});
const REGISTRY_RULES: readonly HarnessCommandRule[] = listBoundedHarnessCommandRules(
  COMMAND_RULE_AUTHORITY,
);

function makeCallerIdentityRaw(
  root: string,
  executable: VerifiedExecutableIdentity,
  method: "mcp" | "command-rules" = "command-rules",
): string {
  return encodeHarnessCallerIdentity({
    schemaVersion: 1,
    kind: "make-docs-harness-caller",
    adapterId: CODEX_HARNESS_ADAPTER.id,
    adapterVersion: CODEX_HARNESS_ADAPTER.version,
    harnessId: "codex",
    connectionMethod: method,
    scope: "machine",
    root: realpathSync(root),
    executable,
  });
}

function makeClaudeCallerIdentity(
  root: string,
  executable: VerifiedExecutableIdentity,
) {
  return {
    schemaVersion: 1,
    kind: "make-docs-harness-caller",
    adapterId: CLAUDE_CODE_HARNESS_ADAPTER.id,
    adapterVersion: CLAUDE_CODE_HARNESS_ADAPTER.version,
    harnessId: "claude-code",
    connectionMethod: "permission-rules",
    scope: "machine",
    root: realpathSync(root),
    executable,
  } as const;
}

describe("W19 R6 static first-party harness adapters", () => {
  it("contains Codex and Claude Code while Pi stays explicitly unsupported", () => {
    expect(FIRST_PARTY_HARNESS_ADAPTERS.map(adapter => adapter.harnessId)).toEqual([
      "codex",
      "claude-code",
    ]);
    expect(getFirstPartyHarnessAdapter("pi")).toBeUndefined();
    expect(PI_HARNESS_SUPPORT).toMatchObject({
      harnessId: "pi",
      state: "unsupported",
      publicSupportClaim: false,
    });
    expect(CODEX_HARNESS_ADAPTER.methods.map(method => method.id)).toEqual([
      "mcp",
      "command-rules",
    ]);
    expect(CLAUDE_CODE_HARNESS_ADAPTER.methods.map(method => method.id)).toEqual([
      "mcp",
      "permission-rules",
    ]);
    expect(CODEX_HARNESS_ADAPTER.executableNames).toEqual(["codex"]);
    expect(CLAUDE_CODE_HARNESS_ADAPTER.executableNames).toEqual(["claude"]);
    expect(CODEX_HARNESS_ADAPTER.methods).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "mcp",
        availability: "available",
        ownedEntries: ["mcp_servers.make_docs"],
        allowedStoreOperations: "active-operation-registry",
      }),
      expect.objectContaining({
        id: "command-rules",
        availability: "available",
        ownedEntries: ["make-docs.command-rules"],
        allowedStoreOperations: "bounded-command-rule-registry",
      }),
    ]));
    expect(CLAUDE_CODE_HARNESS_ADAPTER.methods).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "mcp",
        availability: "available",
        ownedEntries: ["mcpServers.make-docs"],
      }),
      expect.objectContaining({
        id: "permission-rules",
        availability: "blocked",
        ownedEntries: ["permissions.allow.make-docs"],
        blocker: expect.stringContaining("does not select or preserve"),
      }),
    ]));
  });

  it("selects methods only from the static adapter declarations", () => {
    expect(resolveHarnessMethodSupport(CODEX_HARNESS_ADAPTER, "mcp")).toMatchObject({
      state: "available",
      selectable: true,
    });
    expect(resolveHarnessMethodSupport(CLAUDE_CODE_HARNESS_ADAPTER, "mcp")).toMatchObject({
      state: "available",
      selectable: true,
    });
    expect(resolveHarnessMethodSupport(CLAUDE_CODE_HARNESS_ADAPTER, "permission-rules")).toMatchObject({
      state: "blocked",
      selectable: false,
      reason: expect.stringContaining("does not select or preserve"),
      nextAction: expect.stringContaining("Claude Code MCP"),
    });
  });

  it("uses detection only as a native-file suggestion", () => {
    const { root } = fixture();
    expect(CODEX_HARNESS_ADAPTER.detect({ root, scope: "machine", path: "" }).state).toBe("not-detected");
    mkdirSync(path.join(root, ".codex"));
    expect(CODEX_HARNESS_ADAPTER.detect({ root, scope: "machine", path: "" })).toMatchObject({
      state: "detected",
      evidence: [".codex"],
    });
    expect(resolveHarnessMethodSupport(CODEX_HARNESS_ADAPTER, "mcp").selectable).toBe(true);
  });

  it("distinguishes the trusted direct CLI route from identity-required agent routes", () => {
    const { root, executable } = fixture();
    const storeRoot = path.join(root, "store");
    const identity = makeCallerIdentityRaw(root, executable);
    expect(resolveCliOperationRoute(undefined)).toBe("direct-cli");
    expect(resolveCliOperationRoute(identity)).toBe("native-rule");
    expect(() => resolveCliOperationRoute("receipt-bound-native-identity"))
      .toThrow("harness caller identity is invalid");
    expect(resolveHarnessOperationPolicy({
      route: "direct-cli",
      targetRoot: root,
      storeRoot,
      callerIdentityRaw: "",
    })).toMatchObject({
      verified: true,
      access: { store: "write", project: "write", hostConfig: "none" },
    });
    for (const route of ["mcp", "native-rule"] as const) {
      expect(resolveHarnessOperationPolicy({
        route,
        targetRoot: root,
        storeRoot,
        callerIdentityRaw: "",
      })).toMatchObject({
        verified: false,
        access: { store: "none", project: "none", hostConfig: "none" },
        reason: expect.stringContaining("no harness-proved native launch identity"),
      });
    }
  });

  it("accepts one leading CLI caller identity and rejects unsafe placements", () => {
    const { root, executable } = fixture();
    const identity = makeCallerIdentityRaw(root, executable);
    const identityArgument = encodeHarnessCallerIdentityArgument(parseHarnessCallerIdentity(identity));
    expect(resolveCliLaunchArgv([
      HARNESS_CALLER_IDENTITY_ARG,
      identityArgument,
      "project",
      "state",
      "status",
    ], undefined)).toEqual({
      argv: ["project", "state", "status"],
      launch: { route: "native-rule", callerIdentityRaw: identity },
    });
    expect(resolveCliLaunchArgv([
      HARNESS_CALLER_IDENTITY_ARG,
      identityArgument,
      "resource",
      "list",
    ], identity).launch.route).toBe("native-rule");
    expect(() => resolveCliLaunchArgv(["project", HARNESS_CALLER_IDENTITY_ARG, identityArgument], undefined))
      .toThrow("must come before the public command");
    expect(() => resolveCliLaunchArgv([
      HARNESS_CALLER_IDENTITY_ARG,
      identityArgument,
      HARNESS_CALLER_IDENTITY_ARG,
      identityArgument,
      "project",
    ], undefined)).toThrow("can be given only once");
    expect(() => resolveCliLaunchArgv([HARNESS_CALLER_IDENTITY_ARG], undefined))
      .toThrow("requires one caller identity");
    expect(() => resolveCliLaunchArgv([HARNESS_CALLER_IDENTITY_ARG, identityArgument], undefined))
      .toThrow("must be followed by a public command");
    expect(() => resolveCliLaunchArgv([
      HARNESS_CALLER_IDENTITY_ARG,
      "not-base64url!",
      "project",
    ], undefined)).toThrow("harness caller identity is invalid");
    expect(() => resolveCliLaunchArgv([
      HARNESS_CALLER_IDENTITY_ARG,
      identityArgument,
      "project",
    ], makeCallerIdentityRaw(root, { ...executable, sha256: "0".repeat(64) })))
      .toThrow("command and environment harness caller identities do not match");
  });

  it("accepts one leading Claude caller reference and rejects conflicts and unsafe placements", () => {
    const { root, executable } = fixture();
    const reference = encodeHarnessCallerReference(makeClaudeCallerIdentity(root, executable));
    const parsed = parseHarnessCallerReference(reference);
    expect(parsed).toMatchObject({
      raw: reference,
      harnessId: "claude-code",
      connectionMethod: "permission-rules",
      adapterVersion: 1,
      root: realpathSync(root),
      identitySha256: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
    expect(resolveCliOperationRoute(undefined, parsed)).toBe("native-rule");
    expect(createExecutionContext({ callerReference: parsed }).callerReference).toEqual(parsed);
    expect(resolveCliLaunchArgv([
      HARNESS_CALLER_REFERENCE_ARG,
      reference,
      "project",
      "state",
      "status",
    ], undefined)).toEqual({
      argv: ["project", "state", "status"],
      launch: { route: "native-rule", callerReference: parsed },
    });
    expect(() => resolveCliLaunchArgv([
      "project",
      HARNESS_CALLER_REFERENCE_ARG,
      reference,
    ], undefined)).toThrow("must come before the public command");
    expect(() => resolveCliLaunchArgv([
      HARNESS_CALLER_REFERENCE_ARG,
      reference,
      HARNESS_CALLER_REFERENCE_ARG,
      reference,
      "project",
    ], undefined)).toThrow("can be given only once");
    expect(() => resolveCliLaunchArgv([HARNESS_CALLER_REFERENCE_ARG], undefined))
      .toThrow("requires one caller reference");
    expect(() => resolveCliLaunchArgv([HARNESS_CALLER_REFERENCE_ARG, reference], undefined))
      .toThrow("must be followed by a public command");
    expect(() => resolveCliLaunchArgv([
      HARNESS_CALLER_REFERENCE_ARG,
      `${reference.slice(0, -1)}g`,
      "project",
    ], undefined)).toThrow("caller reference is invalid");
    expect(() => resolveCliLaunchArgv([
      HARNESS_CALLER_REFERENCE_ARG,
      reference,
      HARNESS_CALLER_IDENTITY_ARG,
      encodeHarnessCallerIdentityArgument(makeClaudeCallerIdentity(root, executable)),
      "project",
    ], undefined)).toThrow("identity and reference cannot be used together");
    expect(() => resolveCliLaunchArgv([
      HARNESS_CALLER_REFERENCE_ARG,
      reference,
      "project",
    ], encodeHarnessCallerIdentity(makeClaudeCallerIdentity(root, executable))))
      .toThrow("reference and environment identity cannot be used together");
    const relativeRoot = Buffer.from("relative/root", "utf8").toString("base64url");
    expect(() => parseHarnessCallerReference(
      `claude-code.permission-rules.v1.${relativeRoot}.${"0".repeat(64)}`,
    )).toThrow("absolute normalized path");
    const missingRoot = Buffer.from(path.join(root, "missing"), "utf8").toString("base64url");
    expect(() => parseHarnessCallerReference(
      `claude-code.permission-rules.v1.${missingRoot}.${"0".repeat(64)}`,
    )).toThrow("does not exist");
    expect(() => encodeHarnessCallerReference({
      ...makeClaudeCallerIdentity(root, executable),
      harnessId: "codex",
      connectionMethod: "command-rules",
    })).toThrow("Claude Code permission-rules v1");
  });

  it("keeps the internal caller option out of public help", async () => {
    const writes: string[] = [];
    const write = vi.spyOn(process.stdout, "write").mockImplementation((value: any) => {
      writes.push(String(value));
      return true;
    });
    try {
      await runCli(["--help"]);
    } finally {
      write.mockRestore();
    }
    expect(writes.join("\n")).not.toContain(HARNESS_CALLER_IDENTITY_ARG);
    expect(writes.join("\n")).not.toContain(HARNESS_CALLER_REFERENCE_ARG);
  });

  it("verifies exact MCP and native-rule routes after product setup", async () => {
    for (const method of ["mcp", "command-rules"] as const) {
      const { root, executable } = fixture();
      const storeContainer = mkdtempSync(path.join(os.tmpdir(), "make-docs-harness-store-"));
      roots.push(storeContainer);
      const storeRoot = path.join(storeContainer, "store");
      const setup = await runSystemSetupCommand({
        dryRun: false,
        yes: true,
        harnesses: { codex: true, "claude-code": false },
        methods: { codex: method },
        executable,
        machineRoot: root,
        targetRoot: root,
        storeRoot,
      });
      expect(setup.status).toBe("configured");
      const callerIdentityRaw = makeCallerIdentityRaw(root, executable, method);
      const route = method === "mcp" ? "mcp" : "native-rule";
      expect(resolveHarnessOperationPolicy({
        route,
        targetRoot: root,
        storeRoot,
        callerIdentityRaw,
        commandRuleAuthority: COMMAND_RULE_AUTHORITY,
      })).toMatchObject({
        verified: true,
        harnesses: ["codex"],
        methods: [method],
      });
      expect(() => resolveHarnessOperationPolicy({
        route: route === "mcp" ? "native-rule" : "mcp",
        targetRoot: root,
        storeRoot,
        callerIdentityRaw,
        commandRuleAuthority: COMMAND_RULE_AUTHORITY,
      })).toThrow(route === "mcp" ? "native-rule route" : "MCP route");
    }
  });
});

describe("verified executable and bounded command rules", () => {
  it("accepts an exact package-manager link and rejects a mismatched fingerprint", () => {
    const { root, executable } = fixture();
    expect(() =>
      verifyMakeDocsExecutable({ executablePath: executable.path, expectedSha256: "0".repeat(64) }),
    ).toThrow("fingerprint does not match");
    const linked = path.join(root, "bin", "linked-make-docs");
    mkdirSync(path.dirname(linked), { recursive: true });
    symlinkSync(executable.path, linked);
    expect(verifyMakeDocsExecutable({
      executablePath: linked,
      expectedSha256: executable.sha256,
    })).toMatchObject({
      launchPath: linked,
      path: executable.path,
      sha256: executable.sha256,
    });
  });

  it("rejects a broken link with stable repair detail", () => {
    const { root } = fixture();
    const linked = path.join(root, "bin", "make-docs");
    mkdirSync(path.dirname(linked), { recursive: true });
    symlinkSync(path.join(root, "missing-package-bin"), linked);
    try {
      verifyMakeDocsExecutable({ executablePath: linked });
      throw new Error("Expected executable verification to fail.");
    } catch (error) {
      expect(error).toMatchObject({
        code: "executable-link-broken",
        launchPath: linked,
        resolvedPath: null,
        failedRule: "resolved-package-bin",
        nextAction: expect.stringContaining("Repair or reinstall"),
      });
    }
  });

  it("rejects an arbitrary executable script even when its caller supplies the matching hash", () => {
    const { root, executable } = fixture();
    const arbitrary = path.join(root, "make-docs");
    writeFileSync(arbitrary, "#!/bin/sh\nexit 0\n", { mode: 0o755 });
    expect(() =>
      verifyMakeDocsExecutable({
        executablePath: arbitrary,
        expectedSha256: createHash("sha256").update("#!/bin/sh\nexit 0\n").digest("hex"),
      }),
    ).toThrow("not the exact Make Docs package binary");
  });

  it("rejects broad and lifecycle command grants", () => {
    const { root, executable } = fixture();
    expect(() =>
      CODEX_HARNESS_ADAPTER.plan({
        method: "command-rules",
        scope: "machine",
        root,
        executable,
        commandRuleAuthority: COMMAND_RULE_AUTHORITY,
        commandRules: [
          {
            id: "make-docs.resource.read",
            commandPrefix: ["resource"],
            operationIds: ["resource.read"],
            access: { store: "none", project: "read", hostConfig: "none" },
          },
        ],
      }),
    ).toThrow("too broad");
    expect(() =>
      CODEX_HARNESS_ADAPTER.plan({
        method: "command-rules",
        scope: "machine",
        root,
        executable,
        commandRuleAuthority: COMMAND_RULE_AUTHORITY,
        commandRules: [
          {
            id: "make-docs.lifecycle.start",
            commandPrefix: ["run", "lifecycle", "start"],
            operationIds: ["lifecycle.start"],
            access: { store: "write", project: "none", hostConfig: "none" },
          },
        ],
      }),
    ).toThrow("lifecycle or recovery");
  });

  it("rejects registry mismatches, arbitrary prefixes, and an extra executable token", () => {
    const { root, executable } = fixture();
    const resourceRead = REGISTRY_RULES.find(rule => rule.operationIds[0] === "resource.read")!;
    for (const commandRules of [
      [{ ...resourceRead, operationIds: ["resource.list"] }],
      [{ ...resourceRead, access: { ...resourceRead.access, store: "write" as const } }],
      [{ ...resourceRead, id: "make-docs.arbitrary.safe", commandPrefix: ["safe", "words"] }],
      [{ ...resourceRead, commandPrefix: ["make-docs", ...resourceRead.commandPrefix] }],
      [{ ...resourceRead, commandPrefix: ["npx", ...resourceRead.commandPrefix] }],
      [{ ...resourceRead, id: "make-docs.setup.system", commandPrefix: ["setup", "system"] }],
    ]) {
      expect(() => CODEX_HARNESS_ADAPTER.plan({
        method: "command-rules",
        scope: "machine",
        root,
        executable,
        commandRuleAuthority: COMMAND_RULE_AUTHORITY,
        commandRules,
      })).toThrow();
    }
  });

  it("fails closed when the operation registry authority is absent", () => {
    const { root, executable } = fixture();
    expect(() => CODEX_HARNESS_ADAPTER.plan({
      method: "command-rules",
      scope: "machine",
      root,
      executable,
      commandRules: REGISTRY_RULES,
    })).toThrow("operation registry validation authority");
  });
});

describe("Codex native access lifecycle", () => {
  it("emits receipt-bound caller identities for both MCP adapters and detects tampering", () => {
    for (const adapter of [CODEX_HARNESS_ADAPTER, CLAUDE_CODE_HARNESS_ADAPTER]) {
      const { root, executable } = fixture();
      const plan = adapter.plan({ method: "mcp", scope: "machine", root, executable });
      const plannedValue = plan.changes[0].afterEntryValue;
      let encoded: string;
      if (adapter.harnessId === "codex") {
        const line = String(plannedValue)
          .split("\n")
          .find(candidate => candidate.startsWith(`${HARNESS_CALLER_IDENTITY_ENV} = `));
        expect(line).toBeDefined();
        encoded = JSON.parse(line!.slice(line!.indexOf("=") + 1).trim()) as string;
      } else {
        const entry = plannedValue as Record<string, unknown>;
        encoded = (entry.env as Record<string, string>)[HARNESS_CALLER_IDENTITY_ENV];
      }

      const identity = parseHarnessCallerIdentity(encoded);
      expect(identity).toMatchObject({
        schemaVersion: 1,
        kind: "make-docs-harness-caller",
        adapterId: adapter.id,
        adapterVersion: adapter.version,
        harnessId: adapter.harnessId,
        connectionMethod: "mcp",
        scope: "machine",
        root: realpathSync(root),
        executable,
      });
      expect(encodeHarnessCallerIdentity(identity)).toBe(encoded);
      expect(() => parseHarnessCallerIdentity(JSON.stringify({
        ...identity,
        unverified: true,
      }))).toThrow("invalid object shape");

      const applied = adapter.apply({
        plan,
        approved: true,
        operationId: `system.${adapter.harnessId}.mcp.identity`,
        appliedVersion: "2.0.0-rc",
      });
      const tampered = encodeHarnessCallerIdentity({
        ...identity,
        connectionMethod: adapter.harnessId === "codex" ? "command-rules" : "permission-rules",
      });
      const nativePath = adapter.methods.find(method => method.id === "mcp")!.nativeFile("machine");
      const absolutePath = path.join(root, nativePath);
      writeFileSync(
        absolutePath,
        readFileSync(absolutePath, "utf8").replace(JSON.stringify(encoded), JSON.stringify(tampered)),
      );
      const drift = adapter.plan({
        method: "mcp",
        scope: "machine",
        root,
        executable,
        receipt: applied.receipt,
      });
      expect(drift).toMatchObject({ state: "drifted", changes: [{ action: "none" }] });
    }
  });

  it("plans, applies, verifies, and repeats an exact MCP block without changing user TOML", () => {
    const { root, executable } = fixture();
    const configPath = path.join(root, ".codex", "config.toml");
    mkdirSync(path.dirname(configPath), { recursive: true });
    writeFileSync(configPath, 'model = "gpt-test"\n');

    const plan = CODEX_HARNESS_ADAPTER.plan({ method: "mcp", scope: "machine", root, executable });
    expect(plan).toMatchObject({ state: "missing", changes: [{ action: "update", ownership: "missing" }] });
    expect(plan.changes[0]).not.toHaveProperty("beforeContent");
    expect(plan.changes[0]).not.toHaveProperty("afterContent");
    expect(plan.changes[0].afterEntryValue).toContain("[mcp_servers.make_docs]");

    const applied = CODEX_HARNESS_ADAPTER.apply({
      plan,
      approved: true,
      operationId: "system.codex.mcp.1",
      appliedVersion: "2.0.0-rc",
      verifiedAt: "2026-09-12T18:00:00.000Z",
    });
    expect(applied.verification.state).toBe("current");
    expect(readFileSync(configPath, "utf8")).toContain('model = "gpt-test"');
    expect(applied.receipt).toMatchObject({
      appliedVersion: "2.0.0-rc",
      verificationResult: "passed",
      recoveryStatus: "complete",
      entries: [{ ownership: "make-docs" }],
    });

    const repeat = CODEX_HARNESS_ADAPTER.plan({
      method: "mcp",
      scope: "machine",
      root,
      executable,
      receipt: applied.receipt,
    });
    expect(repeat).toMatchObject({ state: "current", changes: [{ action: "none" }] });
    expect(CODEX_HARNESS_ADAPTER.repair({
      method: "mcp",
      scope: "machine",
      root,
      executable,
      receipt: applied.receipt,
    })).toEqual(repeat);
    const repeated = CODEX_HARNESS_ADAPTER.apply({
      plan: repeat,
      approved: true,
      operationId: "system.codex.mcp.2",
      appliedVersion: "2.0.0-rc",
      verifiedAt: "2026-09-12T18:01:00.000Z",
    });
    expect(repeated.changedPaths).toEqual([]);
  });

  it("preserves repeated Codex TOML array tables through plan, apply, repeat, and removal", () => {
    const { root, executable } = fixture();
    const configPath = path.join(root, ".codex", "config.toml");
    mkdirSync(path.dirname(configPath), { recursive: true });
    const skills = Array.from({ length: 21 }, (_, index) => [
      "[[skills.config]]",
      `name = "skill-${index + 1}"`,
      `enabled = ${index % 2 === 0}`,
      "[skills.config.metadata]",
      `source = "fixture-${index + 1}"`,
    ].join("\n")).join("\n\n");
    const original = `model = "gpt-test"\n\n${skills}\n`;
    writeFileSync(configPath, original);

    const plan = CODEX_HARNESS_ADAPTER.plan({ method: "mcp", scope: "machine", root, executable });
    expect(plan).toMatchObject({ state: "missing", changes: [{ action: "update" }] });
    expect(readFileSync(configPath, "utf8")).toBe(original);

    const applied = CODEX_HARNESS_ADAPTER.apply({
      plan,
      approved: true,
      operationId: "system.codex.mcp.array-tables",
      appliedVersion: "2.0.0-rc",
    });
    expect(applied.verification.state).toBe("current");
    const configured = readFileSync(configPath, "utf8");
    expect(configured.startsWith(original)).toBe(true);
    expect(configured.match(/^\[\[skills\.config\]\]$/gm)).toHaveLength(21);
    expect(configured).toContain("# make-docs:begin harness-access codex mcp");

    const repeat = CODEX_HARNESS_ADAPTER.plan({
      method: "mcp",
      scope: "machine",
      root,
      executable,
      receipt: applied.receipt,
    });
    expect(repeat).toMatchObject({ state: "current", changes: [{ action: "none" }] });

    const removal = CODEX_HARNESS_ADAPTER.planRemoval({
      method: "mcp",
      scope: "machine",
      root,
      executable,
      receipt: applied.receipt,
    });
    const removed = CODEX_HARNESS_ADAPTER.applyRemoval({ plan: removal, approved: true });
    expect(removed.verification.state).toBe("missing");
    expect(readFileSync(configPath, "utf8")).toBe(original);
  });

  it.each([
    {
      name: "a duplicate key in one array element",
      content: '[[skills.config]]\nname = "one"\nname = "two"\n',
      reason: "duplicate or conflicting assignment",
    },
    {
      name: "a duplicate normal table",
      content: '[skills.config]\nname = "one"\n[skills.config]\n',
      reason: "duplicate or conflicting table header",
    },
    {
      name: "a normal-table and array-table collision",
      content: '[skills.config]\nname = "one"\n[[skills.config]]\n',
      reason: "duplicate or conflicting table header",
    },
    {
      name: "an array table below a value parent",
      content: 'skills = "not-a-table"\n[[skills.config]]\n',
      reason: "duplicate or conflicting table header",
    },
  ])("blocks $name without changing Codex TOML", ({ content, reason }) => {
    const { root, executable } = fixture();
    const configPath = path.join(root, ".codex", "config.toml");
    mkdirSync(path.dirname(configPath), { recursive: true });
    writeFileSync(configPath, content);

    const plan = CODEX_HARNESS_ADAPTER.plan({ method: "mcp", scope: "machine", root, executable });

    expect(plan).toMatchObject({ state: "blocked", changes: [{ action: "none" }] });
    expect(plan.changes[0].blockedReason).toContain(reason);
    expect(readFileSync(configPath, "utf8")).toBe(content);
  });

  it("preserves a matching user-owned MCP table and a changed managed block", () => {
    const { root, executable } = fixture();
    const configPath = path.join(root, ".codex", "config.toml");
    mkdirSync(path.dirname(configPath), { recursive: true });
    writeFileSync(configPath, '[mcp_servers.make_docs]\ncommand = "/user/tool"\n');
    const userOwned = CODEX_HARNESS_ADAPTER.plan({
      method: "mcp",
      scope: "machine",
      root,
      executable,
    });
    expect(userOwned).toMatchObject({ state: "blocked", changes: [{ action: "none" }] });
    expect(readFileSync(configPath, "utf8")).toContain('/user/tool');

    rmSync(configPath);
    const initial = CODEX_HARNESS_ADAPTER.plan({ method: "mcp", scope: "machine", root, executable });
    const applied = CODEX_HARNESS_ADAPTER.apply({
      plan: initial,
      approved: true,
      operationId: "system.codex.mcp.owned",
      appliedVersion: "2.0.0-rc",
    });
    writeFileSync(configPath, readFileSync(configPath, "utf8").replace('args = ["mcp"]', 'args = ["mcp", "changed"]'));
    const drift = CODEX_HARNESS_ADAPTER.plan({
      method: "mcp",
      scope: "machine",
      root,
      executable,
      receipt: applied.receipt,
    });
    expect(drift).toMatchObject({ state: "drifted", changes: [{ action: "none" }] });
    expect(drift.changes[0].blockedReason).toContain("Preserve it");
  });

  it("blocks malformed Codex TOML without rewriting it", () => {
    const { root, executable } = fixture();
    const configPath = path.join(root, ".codex", "config.toml");
    mkdirSync(path.dirname(configPath), { recursive: true });
    writeFileSync(configPath, "features = [\n");
    const plan = CODEX_HARNESS_ADAPTER.plan({ method: "mcp", scope: "machine", root, executable });
    expect(plan).toMatchObject({ state: "blocked", changes: [{ action: "none" }] });
    expect(plan.changes[0].blockedReason).toContain("unfinished collection");
    expect(readFileSync(configPath, "utf8")).toBe("features = [\n");
  });

  it("blocks a balanced but invalid Codex TOML value before planning a write", () => {
    const { root, executable } = fixture();
    const configPath = path.join(root, ".codex", "config.toml");
    mkdirSync(path.dirname(configPath), { recursive: true });
    const malformed = "broken = ???\n";
    writeFileSync(configPath, malformed);

    const plan = CODEX_HARNESS_ADAPTER.plan({ method: "mcp", scope: "machine", root, executable });

    expect(plan).toMatchObject({ state: "blocked", changes: [{ action: "none" }] });
    expect(plan.changes[0].blockedReason).toContain("invalid TOML value");
    expect(readFileSync(configPath, "utf8")).toBe(malformed);
  });

  it("blocks malformed or ambiguous multiline Codex TOML without appending", () => {
    const { root, executable } = fixture();
    const configPath = path.join(root, ".codex", "config.toml");
    mkdirSync(path.dirname(configPath), { recursive: true });
    const malformed = 'notes = """unfinished\n';
    writeFileSync(configPath, malformed);
    const plan = CODEX_HARNESS_ADAPTER.plan({ method: "mcp", scope: "machine", root, executable });
    expect(plan).toMatchObject({ state: "blocked", changes: [{ action: "none" }] });
    expect(plan.changes[0].blockedReason).toContain("multiline TOML");
    expect(readFileSync(configPath, "utf8")).toBe(malformed);
  });

  it("rejects a symbolic-link parent and a parent replacement after review", () => {
    const { root, executable } = fixture();
    const outside = mkdtempSync(path.join(os.tmpdir(), "make-docs-harness-outside-"));
    roots.push(outside);
    symlinkSync(outside, path.join(root, ".codex"));
    expect(() => CODEX_HARNESS_ADAPTER.plan({
      method: "mcp",
      scope: "machine",
      root,
      executable,
    })).toThrow("symbolic link");

    rmSync(path.join(root, ".codex"));
    const plan = CODEX_HARNESS_ADAPTER.plan({ method: "mcp", scope: "machine", root, executable });
    symlinkSync(outside, path.join(root, ".codex"));
    expect(() => CODEX_HARNESS_ADAPTER.apply({
      plan,
      approved: true,
      operationId: "system.codex.race",
      appliedVersion: "2.0.0-rc",
    })).toThrow("symbolic link");
    expect(existsSync(path.join(outside, "config.toml"))).toBe(false);
  });

  it("rejects parent and target swaps at the final native mutation boundary", () => {
    const parentFixture = fixture();
    const parentConfig = path.join(parentFixture.root, ".codex", "config.toml");
    const parentDirectory = path.dirname(parentConfig);
    const movedParent = path.join(parentFixture.root, ".codex-reviewed");
    const outside = mkdtempSync(path.join(os.tmpdir(), "make-docs-harness-outside-"));
    roots.push(outside);
    mkdirSync(parentDirectory, { recursive: true });
    writeFileSync(parentConfig, 'model = "gpt-test"\n');
    const parentPlan = CODEX_HARNESS_ADAPTER.plan({
      method: "mcp",
      scope: "machine",
      root: parentFixture.root,
      executable: parentFixture.executable,
    });
    __setHarnessNativeMutationHookForTests(() => {
      __setHarnessNativeMutationHookForTests(null);
      renameSync(parentDirectory, movedParent);
      symlinkSync(outside, parentDirectory);
    });

    expect(() => CODEX_HARNESS_ADAPTER.apply({
      plan: parentPlan,
      approved: true,
      operationId: "system.codex.parent-boundary-race",
      appliedVersion: "2.0.0-rc",
    })).toThrow("symbolic link");
    expect(existsSync(path.join(outside, "config.toml"))).toBe(false);
    expect(readFileSync(path.join(movedParent, "config.toml"), "utf8")).toBe('model = "gpt-test"\n');

    const targetFixture = fixture();
    const targetConfig = path.join(targetFixture.root, ".codex", "config.toml");
    const savedTarget = path.join(targetFixture.root, ".codex", "config.reviewed.toml");
    const original = 'model = "gpt-test"\n';
    mkdirSync(path.dirname(targetConfig), { recursive: true });
    writeFileSync(targetConfig, original);
    const targetPlan = CODEX_HARNESS_ADAPTER.plan({
      method: "mcp",
      scope: "machine",
      root: targetFixture.root,
      executable: targetFixture.executable,
    });
    __setHarnessNativeMutationHookForTests(() => {
      __setHarnessNativeMutationHookForTests(null);
      renameSync(targetConfig, savedTarget);
      writeFileSync(targetConfig, original);
    });

    expect(() => CODEX_HARNESS_ADAPTER.apply({
      plan: targetPlan,
      approved: true,
      operationId: "system.codex.target-boundary-race",
      appliedVersion: "2.0.0-rc",
    })).toThrow("target changed after review");
    expect(readFileSync(targetConfig, "utf8")).toBe(original);
  });

  it("writes only a reviewed bounded Codex rule file", () => {
    const { root, executable } = fixture();
    const plan = CODEX_HARNESS_ADAPTER.plan({
      method: "command-rules",
      scope: "machine",
      root,
      executable,
      commandRuleAuthority: COMMAND_RULE_AUTHORITY,
      commandRules: REGISTRY_RULES,
    });
    const rules = String(plan.changes[0].afterEntryValue ?? "");
    expect(rules).toContain(
      `pattern = ["${executable.path}", "${HARNESS_CALLER_IDENTITY_ARG}", `,
    );
    expect(rules).toContain(`, "resource", "list"]`);
    expect(rules).not.toContain("/usr/bin/env");
    expect(rules).not.toContain(`${HARNESS_CALLER_IDENTITY_ENV}=`);
    expect(rules).not.toContain(" setup ");
    expect(rules).not.toContain(" update ");
    expect(rules).not.toContain(" uninstall ");

    const stateRule = rules.split("\n").find(line => line.includes(', "project", "state", "status"]'));
    expect(stateRule).toBeDefined();
    const patternText = stateRule!.match(/pattern = (\[.*\]), decision/)?.[1];
    expect(patternText).toBeDefined();
    const pattern = JSON.parse(patternText!) as string[];
    expect(pattern.slice(0, 2)).toEqual([executable.path, HARNESS_CALLER_IDENTITY_ARG]);
    expect(pattern[2]).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(parseHarnessCallerIdentityArgument(pattern[2])).toMatchObject({
      schemaVersion: 1,
      adapterVersion: 1,
      connectionMethod: "command-rules",
      executable,
    });
  });

  it("marks the old environment-based managed Codex rule as drifted", () => {
    const { root, executable } = fixture();
    const initialPlan = CODEX_HARNESS_ADAPTER.plan({
      method: "command-rules",
      scope: "machine",
      root,
      executable,
      commandRuleAuthority: COMMAND_RULE_AUTHORITY,
      commandRules: REGISTRY_RULES,
    });
    const applied = CODEX_HARNESS_ADAPTER.apply({
      plan: initialPlan,
      approved: true,
      operationId: "system.codex.rules.old-carrier",
      appliedVersion: "2.0.0-rc",
    });
    const rulePath = path.join(root, ".codex", "rules", "make-docs.rules");
    const currentRules = readFileSync(rulePath, "utf8");
    const firstPattern = currentRules.match(/pattern = (\[.*\]), decision/)?.[1];
    expect(firstPattern).toBeDefined();
    const currentPrefix = (JSON.parse(firstPattern!) as string[]).slice(0, 3);
    const callerIdentityRaw = encodeHarnessCallerIdentity(
      parseHarnessCallerIdentityArgument(currentPrefix[2]),
    );
    const oldPrefix = [
      "/usr/bin/env",
      `${HARNESS_CALLER_IDENTITY_ENV}=${callerIdentityRaw}`,
      executable.path,
    ];
    const currentPrefixText = currentPrefix.map(word => JSON.stringify(word)).join(", ");
    const oldPrefixText = oldPrefix.map(word => JSON.stringify(word)).join(", ");
    const oldRules = currentRules.replaceAll(currentPrefixText, oldPrefixText);
    writeFileSync(rulePath, oldRules);
    const oldReceipt = {
      ...applied.receipt,
      entries: applied.receipt.entries.map(entry => ({
        ...entry,
        value: oldRules,
        entryFingerprint: fingerprintEntry(oldRules),
      })),
    };

    const replacement = CODEX_HARNESS_ADAPTER.plan({
      method: "command-rules",
      scope: "machine",
      root,
      executable,
      commandRuleAuthority: COMMAND_RULE_AUTHORITY,
      commandRules: REGISTRY_RULES,
      receipt: oldReceipt,
    });
    expect(replacement).toMatchObject({
      state: "drifted",
      changes: [{ action: "update", ownership: "make-docs-owned" }],
    });
    expect(() => CODEX_HARNESS_ADAPTER.apply({
      plan: replacement,
      approved: false,
      operationId: "system.codex.rules.replace-old-carrier",
      appliedVersion: "2.0.0-rc",
    })).toThrow("explicit approval");
    expect(readFileSync(rulePath, "utf8")).toBe(oldRules);
  });
});

describe("Claude Code native access lifecycle", () => {
  it("preserves unknown MCP entries and removes only its receipt-owned entry", () => {
    const { root, executable } = fixture();
    const configPath = path.join(root, ".claude.json");
    writeFileSync(
      configPath,
      JSON.stringify({ theme: "dark", mcpServers: { existing: { command: "/user/server" } } }, null, 2),
    );
    const plan = CLAUDE_CODE_HARNESS_ADAPTER.plan({
      method: "mcp",
      scope: "machine",
      root,
      executable,
    });
    const applied = CLAUDE_CODE_HARNESS_ADAPTER.apply({
      plan,
      approved: true,
      operationId: "system.claude.mcp.1",
      appliedVersion: "2.0.0-rc",
    });
    const configured = JSON.parse(readFileSync(configPath, "utf8"));
    expect(configured).toMatchObject({
      theme: "dark",
      mcpServers: {
        existing: { command: "/user/server" },
        "make-docs": { command: executable.path, args: ["mcp"] },
      },
    });

    const removal = CLAUDE_CODE_HARNESS_ADAPTER.planRemoval({
      method: "mcp",
      scope: "machine",
      root,
      executable,
      receipt: applied.receipt,
    });
    const removed = CLAUDE_CODE_HARNESS_ADAPTER.applyRemoval({ plan: removal, approved: true });
    expect(removed.verification.state).toBe("missing");
    expect(JSON.parse(readFileSync(configPath, "utf8"))).toEqual({
      theme: "dark",
      mcpServers: { existing: { command: "/user/server" } },
    });
  });

  it("adds and removes only exact permission rules while preserving user settings", () => {
    const { root, executable } = fixture();
    const settingsPath = path.join(root, ".claude", "settings.json");
    mkdirSync(path.dirname(settingsPath), { recursive: true });
    writeFileSync(
      settingsPath,
      JSON.stringify({ theme: "dark", permissions: { allow: ["Bash(git status:*)"] } }, null, 2),
    );
    const plan = CLAUDE_CODE_HARNESS_ADAPTER.plan({
      method: "permission-rules",
      scope: "machine",
      root,
      executable,
      commandRuleAuthority: COMMAND_RULE_AUTHORITY,
      commandRules: REGISTRY_RULES,
    });
    const applied = CLAUDE_CODE_HARNESS_ADAPTER.apply({
      plan,
      approved: true,
      operationId: "system.claude.rules.1",
      appliedVersion: "2.0.0-rc",
    });
    const configured = JSON.parse(readFileSync(settingsPath, "utf8"));
    expect(configured).toMatchObject({
      theme: "dark",
      permissions: {
        allow: expect.arrayContaining([
          "Bash(git status:*)",
        ]),
      },
    });
    const allowed = configured.permissions.allow as string[];
    expect(allowed.some(value => value.includes(
      `${executable.path} ${HARNESS_CALLER_REFERENCE_ARG} claude-code.permission-rules.v1.`
    ) && value.includes(" resource list:*") && value.startsWith("Bash("))).toBe(true);
    expect(allowed.some(value => value.includes(
      `${executable.path} ${HARNESS_CALLER_REFERENCE_ARG} claude-code.permission-rules.v1.`
    ) && value.includes(" resource read:*") && value.startsWith("Bash("))).toBe(true);
    const makeDocsRules = allowed.filter(value => value.includes(HARNESS_CALLER_REFERENCE_ARG));
    expect(makeDocsRules).toHaveLength(REGISTRY_RULES.length);
    expect(makeDocsRules.join("\n")).not.toContain(HARNESS_CALLER_IDENTITY_ENV);
    expect(makeDocsRules.join("\n")).not.toContain("/usr/bin/env");
    expect(makeDocsRules.join("\n")).not.toContain("{\"");
    expect(makeDocsRules.join("\n")).not.toMatch(/\b(setup|update|uninstall)\b/);
    const callerReference = makeDocsRules[0].split(" ")[2];
    expect(parseHarnessCallerReference(callerReference)).toMatchObject({
      harnessId: "claude-code",
      connectionMethod: "permission-rules",
      root: realpathSync(root),
    });

    const removal = CLAUDE_CODE_HARNESS_ADAPTER.planRemoval({
      method: "permission-rules",
      scope: "machine",
      root,
      executable,
      receipt: applied.receipt,
    });
    CLAUDE_CODE_HARNESS_ADAPTER.applyRemoval({ plan: removal, approved: true });
    expect(JSON.parse(readFileSync(settingsPath, "utf8"))).toEqual({
      theme: "dark",
      permissions: { allow: ["Bash(git status:*)"] },
    });
  });

  it("replaces only receipt-owned legacy Claude rules and keeps user permission order", () => {
    const { root, executable } = fixture();
    const settingsPath = path.join(root, ".claude", "settings.json");
    const initialPlan = CLAUDE_CODE_HARNESS_ADAPTER.plan({
      method: "permission-rules",
      scope: "machine",
      root,
      executable,
      commandRuleAuthority: COMMAND_RULE_AUTHORITY,
      commandRules: REGISTRY_RULES,
    });
    const initial = CLAUDE_CODE_HARNESS_ADAPTER.apply({
      plan: initialPlan,
      approved: true,
      operationId: "system.claude.rules.reference-seed",
      appliedVersion: "2.0.0-rc",
    });
    const rawIdentity = encodeHarnessCallerIdentity(makeClaudeCallerIdentity(root, executable));
    const legacyRules = [...REGISTRY_RULES]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map(rule => `Bash(/usr/bin/env ${HARNESS_CALLER_IDENTITY_ENV}=${rawIdentity} ${executable.path} ${rule.commandPrefix.join(" ")}:*)`)
      .sort();
    const userRules = ["Bash(git status:*)", "Read(./docs/**)"];
    const legacyContent = `${JSON.stringify({
      theme: "dark",
      permissions: { allow: [userRules[0], ...legacyRules, userRules[1]] },
    }, null, 2)}\n`;
    writeFileSync(settingsPath, legacyContent);
    const legacyReceipt: HarnessAccessReceipt = {
      ...initial.receipt,
      operationId: "system.claude.rules.legacy",
      entries: [{
        ...initial.receipt.entries[0],
        value: legacyRules,
        entryFingerprint: fingerprintEntry(legacyRules),
        fileFingerprint: createHash("sha256").update(legacyContent).digest("hex"),
      }],
    };

    const upgrade = CLAUDE_CODE_HARNESS_ADAPTER.plan({
      method: "permission-rules",
      scope: "machine",
      root,
      executable,
      receipt: legacyReceipt,
      commandRuleAuthority: COMMAND_RULE_AUTHORITY,
      commandRules: REGISTRY_RULES,
    });
    expect(upgrade).toMatchObject({ state: "drifted", changes: [{ action: "update" }] });
    expect(() => CLAUDE_CODE_HARNESS_ADAPTER.apply({
      plan: upgrade,
      approved: false,
      operationId: "system.claude.rules.upgrade",
      appliedVersion: "2.0.0-rc",
    })).toThrow("explicit approval");
    const upgraded = CLAUDE_CODE_HARNESS_ADAPTER.apply({
      plan: upgrade,
      approved: true,
      operationId: "system.claude.rules.upgrade",
      appliedVersion: "2.0.0-rc",
    });
    const allowed = JSON.parse(readFileSync(settingsPath, "utf8")).permissions.allow as string[];
    expect(allowed.filter(value => userRules.includes(value))).toEqual(userRules);
    expect(allowed.join("\n")).not.toContain("/usr/bin/env");
    expect(allowed.filter(value => value.includes(HARNESS_CALLER_REFERENCE_ARG)))
      .toHaveLength(REGISTRY_RULES.length);
    const repeat = CLAUDE_CODE_HARNESS_ADAPTER.plan({
      method: "permission-rules",
      scope: "machine",
      root,
      executable,
      receipt: upgraded.receipt,
      commandRuleAuthority: COMMAND_RULE_AUTHORITY,
      commandRules: REGISTRY_RULES,
    });
    expect(repeat).toMatchObject({ state: "current", changes: [{ action: "none" }] });

    const extraLegacy = `${legacyRules[0]} extra`;
    writeFileSync(settingsPath, `${JSON.stringify({ permissions: { allow: [...legacyRules, extraLegacy] } }, null, 2)}\n`);
    const incompleteOwnership = CLAUDE_CODE_HARNESS_ADAPTER.plan({
      method: "permission-rules",
      scope: "machine",
      root,
      executable,
      receipt: legacyReceipt,
      commandRuleAuthority: COMMAND_RULE_AUTHORITY,
      commandRules: REGISTRY_RULES,
    });
    expect(incompleteOwnership).toMatchObject({ state: "blocked", changes: [{ action: "none" }] });
    expect(incompleteOwnership.changes[0].blockedReason).toContain("no exact ownership receipt");
  });

  it("blocks malformed JSON, symbolic-link native files, and user-owned matching entries", () => {
    const { root, executable } = fixture();
    writeFileSync(path.join(root, ".claude.json"), "{not json");
    const malformed = CLAUDE_CODE_HARNESS_ADAPTER.plan({
      method: "mcp",
      scope: "machine",
      root,
      executable,
    });
    expect(malformed).toMatchObject({ state: "blocked", changes: [{ action: "none" }] });
    expect(malformed.changes[0].blockedReason).toContain("malformed");

    writeFileSync(
      path.join(root, ".claude.json"),
      JSON.stringify({ mcpServers: { "make-docs": { command: executable.path, args: ["mcp"] } } }),
    );
    const userOwned = CLAUDE_CODE_HARNESS_ADAPTER.plan({
      method: "mcp",
      scope: "machine",
      root,
      executable,
    });
    expect(userOwned.state).toBe("blocked");

    rmSync(path.join(root, ".claude.json"));
    const outside = path.join(root, "outside.json");
    writeFileSync(outside, "{}");
    symlinkSync(outside, path.join(root, ".claude.json"));
    expect(() =>
      CLAUDE_CODE_HARNESS_ADAPTER.plan({
        method: "mcp",
        scope: "machine",
        root,
        executable,
      }),
    ).toThrow("symbolic link");
  });
});
