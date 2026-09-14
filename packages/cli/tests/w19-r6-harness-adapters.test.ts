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
import { afterEach, describe, expect, it } from "vitest";
import {
  CLAUDE_CODE_HARNESS_ADAPTER,
  CODEX_HARNESS_ADAPTER,
  FIRST_PARTY_HARNESS_ADAPTERS,
  HARNESS_CALLER_IDENTITY_ENV,
  PI_HARNESS_SUPPORT,
  getFirstPartyHarnessAdapter,
  harnessConformanceEvidenceDigest,
  loadHarnessConformanceEvidence,
  listBoundedHarnessCommandRules,
  encodeHarnessCallerIdentity,
  parseHarnessCallerIdentity,
  resolveHarnessMethodSupport,
  verifyMakeDocsExecutable,
  type HarnessCommandRule,
  type HarnessCommandRuleAuthority,
  type HarnessConformanceEvidence,
  type HarnessConformanceEvidenceRecord,
  type VerifiedExecutableIdentity,
} from "../src/harness-access/index.js";
import { __setHarnessNativeMutationHookForTests } from "../src/harness-access/native.js";
import {
  listHarnessCommandRules,
  validateRegistryHarnessCommandRules,
} from "../src/operations/registry.js";

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

describe("W19 R6 bounded first-party harness adapter registry", () => {
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
  });

  it("does not turn implementation tests or detection into a support claim", () => {
    const implementationOnly = resolveHarnessMethodSupport(CODEX_HARNESS_ADAPTER, "mcp");
    expect(implementationOnly).toMatchObject({
      state: "not-run",
      selectable: false,
      publicSupportClaim: false,
    });
    const identity = CODEX_HARNESS_ADAPTER.conformanceIdentity("mcp");
    const inMemoryProof = {
      schemaVersion: 1,
      ...identity,
      resultId: "codex-mcp-real-1",
      verdict: "pass",
      eligible: true,
      assertions: { install: true, discover: true, invoke: true, uninstall: true },
    } satisfies HarnessConformanceEvidence;
    expect(resolveHarnessMethodSupport(CODEX_HARNESS_ADAPTER, "mcp", inMemoryProof)).toMatchObject({
      state: "experimental",
      selectable: false,
      publicSupportClaim: false,
    });

    const { root } = fixture();
    const recordWithoutDigest: Omit<HarnessConformanceEvidenceRecord, "digest"> = {
      schemaVersion: 1,
      provenance: {
        kind: "make-docs-harness-conformance",
        storage: "committed-conformance-registry",
        evidenceId: inMemoryProof.resultId,
        recordedAt: "2026-09-12T18:00:00.000Z",
      },
      evidence: inMemoryProof,
    };
    const evidencePath = path.join(root, "conformance.json");
    writeFileSync(evidencePath, JSON.stringify({
      ...recordWithoutDigest,
      digest: harnessConformanceEvidenceDigest(recordWithoutDigest),
    }));
    const loadedEvidence = loadHarnessConformanceEvidence({ trustedRoot: root, evidencePath });
    const exactProof = resolveHarnessMethodSupport(
      CODEX_HARNESS_ADAPTER,
      "mcp",
      loadedEvidence,
    );
    expect(exactProof).toMatchObject({
      state: "experimental",
      selectable: false,
      publicSupportClaim: false,
    });

    writeFileSync(evidencePath, JSON.stringify({ ...recordWithoutDigest, digest: "0".repeat(64) }));
    expect(() => loadHarnessConformanceEvidence({ trustedRoot: root, evidencePath })).toThrow(
      "digest does not match",
    );
    expect(resolveHarnessMethodSupport(CODEX_HARNESS_ADAPTER, "mcp", loadedEvidence)).toMatchObject({
      state: "experimental",
      selectable: false,
      publicSupportClaim: false,
    });
  });

  it("uses detection only as a native-file suggestion", () => {
    const { root } = fixture();
    expect(CODEX_HARNESS_ADAPTER.detect({ root, scope: "machine" }).state).toBe("not-detected");
    mkdirSync(path.join(root, ".codex"));
    expect(CODEX_HARNESS_ADAPTER.detect({ root, scope: "machine" })).toMatchObject({
      state: "detected",
      evidence: [".codex"],
    });
    expect(resolveHarnessMethodSupport(CODEX_HARNESS_ADAPTER, "mcp").selectable).toBe(false);
  });
});

describe("verified executable and bounded command rules", () => {
  it("rejects a mismatched executable fingerprint and a symbolic-link executable", () => {
    const { root, executable } = fixture();
    expect(() =>
      verifyMakeDocsExecutable({ executablePath: executable.path, expectedSha256: "0".repeat(64) }),
    ).toThrow("fingerprint does not match");
    const linked = path.join(root, "bin", "linked-make-docs");
    mkdirSync(path.dirname(linked), { recursive: true });
    symlinkSync(executable.path, linked);
    expect(() =>
      verifyMakeDocsExecutable({ executablePath: linked, expectedSha256: executable.sha256 }),
    ).toThrow("symbolic link");
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
    const repeated = CODEX_HARNESS_ADAPTER.apply({
      plan: repeat,
      approved: true,
      operationId: "system.codex.mcp.2",
      appliedVersion: "2.0.0-rc",
      verifiedAt: "2026-09-12T18:01:00.000Z",
    });
    expect(repeated.changedPaths).toEqual([]);
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
    expect(rules).toContain(`pattern = ["${executable.path}", "resource", "list"]`);
    expect(rules).not.toContain(" setup ");
    expect(rules).not.toContain(" update ");
    expect(rules).not.toContain(" uninstall ");
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
    expect(JSON.parse(readFileSync(settingsPath, "utf8"))).toMatchObject({
      theme: "dark",
      permissions: {
        allow: expect.arrayContaining([
          "Bash(git status:*)",
          `Bash(${executable.path} resource list:*)`,
          `Bash(${executable.path} resource read:*)`,
        ]),
      },
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
