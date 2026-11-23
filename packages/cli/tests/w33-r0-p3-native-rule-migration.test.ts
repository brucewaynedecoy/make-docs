import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  CLAUDE_CODE_HARNESS_ADAPTER,
  CODEX_HARNESS_ADAPTER,
  fingerprintEntry,
  listBoundedHarnessCommandRules,
  verifyMakeDocsExecutable,
  type HarnessAccessReceipt,
  type HarnessAdapter,
  type HarnessCommandRule,
  type HarnessCommandRuleAuthority,
} from "../src/harness-access/index.js";
import { NAME_CATALOG } from "../src/operations/name-catalog.js";
import { listHarnessCommandRules, validateRegistryHarnessCommandRules } from "../src/operations/registry.js";
import { runSystemSetupCommand } from "../src/setup-system.js";
import {
  readCurrentHarnessIntegrationReceipt,
  recordHarnessIntegrationReceipt,
} from "../src/store/harness-integration-receipts.js";

/**
 * W33 R0 P3: a machine that installed native command rules before W33 R0 has
 * rules for the old `run ...` paths. `verify` must report them as drift, and
 * `make-docs setup` must plan an update that a person approves. Nothing else
 * may break: user rules stay, and the repeat is current.
 *
 * Every root is a temp folder. No real harness configuration or Store is read.
 */
const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function tempDir(prefix: string): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), prefix));
  roots.push(dir);
  return dir;
}

const AUTHORITY: HarnessCommandRuleAuthority = Object.freeze({
  list: listHarnessCommandRules,
  validate: validateRegistryHarnessCommandRules,
});
const RULES: readonly HarnessCommandRule[] = listBoundedHarnessCommandRules(AUTHORITY);

/** The command words each rule had before W33 R0, from the name catalog. */
function formerPrefix(rule: HarnessCommandRule): string[] {
  const operationId = rule.operationIds[0]!;
  const entry = NAME_CATALOG.find((candidate) => candidate.id === operationId);
  return (entry?.formerCli ?? rule.commandPrefix.join(" ")).split(" ");
}

function executableFixture() {
  return verifyMakeDocsExecutable({
    executablePath: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist/index.js"),
  });
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

interface Case {
  harness: "codex" | "claude-code";
  method: "command-rules" | "permission-rules";
  adapter: HarnessAdapter;
  nativeFile: (root: string) => string;
  /** Turn the current managed entry into the one an older install wrote. */
  makeOld: (content: string) => { content: string; value: string | string[] };
  hasOldPaths: (content: string) => boolean;
}

const CASES: Case[] = [
  {
    harness: "codex",
    method: "command-rules",
    adapter: CODEX_HARNESS_ADAPTER,
    nativeFile: (root) => path.join(root, ".codex", "rules", "make-docs.rules"),
    makeOld: (content) => {
      let old = content;
      for (const rule of RULES) {
        const now = `, ${rule.commandPrefix.map((word) => JSON.stringify(word)).join(", ")}], decision`;
        const before = `, ${formerPrefix(rule).map((word) => JSON.stringify(word)).join(", ")}], decision`;
        old = old.replace(now, before);
      }
      return { content: old, value: old };
    },
    hasOldPaths: (content) => content.includes(`"run", "prd", "authority", "validate"]`),
  },
  {
    harness: "claude-code",
    method: "permission-rules",
    adapter: CLAUDE_CODE_HARNESS_ADAPTER,
    nativeFile: (root) => path.join(root, ".claude", "settings.json"),
    makeOld: (content) => {
      const settings = JSON.parse(content) as { permissions: { allow: string[] } };
      const owned: string[] = [];
      settings.permissions.allow = settings.permissions.allow.map((value) => {
        const rule = RULES.find((candidate) => value.endsWith(` ${candidate.commandPrefix.join(" ")}:*)`));
        if (!rule) return value;
        const old = value.replace(` ${rule.commandPrefix.join(" ")}:*)`, ` ${formerPrefix(rule).join(" ")}:*)`);
        owned.push(old);
        return old;
      });
      // An install writes its owned rules sorted, so the receipt holds them sorted.
      return { content: `${JSON.stringify(settings, null, 2)}\n`, value: owned.sort() };
    },
    hasOldPaths: (content) => content.includes(" run prd authority validate:*)"),
  },
];

function makeOldReceipt(receipt: HarnessAccessReceipt, old: { content: string; value: string | string[] }): HarnessAccessReceipt {
  return {
    ...receipt,
    operationId: `${receipt.operationId}.before-w33`,
    entries: receipt.entries.map((entry) => ({
      ...entry,
      value: old.value,
      entryFingerprint: fingerprintEntry(old.value),
      fileFingerprint: sha256(old.content),
    })),
  };
}

function verifyState(testCase: Case, root: string, executable: ReturnType<typeof executableFixture>, receipt: HarnessAccessReceipt) {
  return testCase.adapter.verify({
    method: testCase.method,
    scope: "machine",
    root,
    executable,
    commandRules: RULES,
    commandRuleAuthority: AUTHORITY,
    receipt,
  });
}

/** Verify reports drift, and the adapter plans one update that needs approval. */
function expectDriftAndApprovalGate(
  testCase: Case,
  root: string,
  executable: ReturnType<typeof executableFixture>,
  oldReceipt: HarnessAccessReceipt,
  oldContent: string,
) {
  const verification = verifyState(testCase, root, executable, oldReceipt);
  expect(verification.state).toBe("drifted");
  // Codex reads the whole managed file, so the reason names the reviewed intent.
  // Claude Code reads only the rules it expects, so the old rules differ from the receipt.
  expect(verification.reason).toContain(
    testCase.harness === "codex" ? "does not match the current reviewed intent" : "differs from the verified receipt",
  );
  const plan = testCase.adapter.plan({
    method: testCase.method,
    scope: "machine",
    root,
    executable,
    commandRules: RULES,
    commandRuleAuthority: AUTHORITY,
    receipt: oldReceipt,
  });
  expect(plan).toMatchObject({ state: "drifted", changes: [{ action: "update" }] });
  expect(() => testCase.adapter.apply({
    plan,
    approved: false,
    operationId: "system.w33.p3.unapproved",
    appliedVersion: "2.1.0",
  })).toThrow("explicit approval");
  expect(readFileSync(testCase.nativeFile(root), "utf8")).toBe(oldContent);
  return plan;
}

describe("W33 R0 P3 old native command rules after the rename", () => {
  it("the old rules differ from the new ones only where a path was renamed", () => {
    const renamed = RULES.filter((rule) => formerPrefix(rule).join(" ") !== rule.commandPrefix.join(" "));
    expect(renamed.length).toBeGreaterThan(0);
    expect(renamed.some((rule) => formerPrefix(rule)[0] === "run")).toBe(true);
    for (const rule of RULES) expect(rule.commandPrefix[0]).not.toBe("run");
  });

  it("codex: verify reports old run-path rules as drift, and `make-docs setup` plans an update a person approves", async () => {
    const testCase = CASES.find((candidate) => candidate.harness === "codex")!;
    const root = tempDir("make-docs-w33-p3-native-");
    const storeRoot = path.join(tempDir("make-docs-w33-p3-native-store-"), "store");
    const executable = executableFixture();
    const setupOptions = {
      harnesses: { codex: true, "claude-code": false },
      methods: { codex: "command-rules" },
      executable,
      machineRoot: root,
      targetRoot: root,
      storeRoot,
    } as const;

    const initial = await runSystemSetupCommand({ ...setupOptions, dryRun: false, yes: true });
    expect(initial.blocked).toEqual([]);
    expect(initial.status).toBe("configured");
    const receipt = readCurrentHarnessIntegrationReceipt(root, storeRoot, "machine", "codex", "command-rules");
    expect(receipt).toMatchObject({ result: "verified" });

    // Make the machine look like an install from before W33 R0.
    const nativePath = testCase.nativeFile(root);
    const old = testCase.makeOld(readFileSync(nativePath, "utf8"));
    expect(testCase.hasOldPaths(old.content)).toBe(true);
    writeFileSync(nativePath, old.content);
    const oldReceipt = makeOldReceipt(receipt!, old);
    recordHarnessIntegrationReceipt(root, storeRoot, oldReceipt);

    expectDriftAndApprovalGate(testCase, root, executable, oldReceipt, old.content);

    // `make-docs setup` previews the update and names the approve command.
    let review = "";
    const preview = await runSystemSetupCommand({
      ...setupOptions,
      dryRun: true,
      yes: false,
      onReview: (text) => { review = text; },
    });
    expect(preview.status).toBe("partial");
    expect(preview.blocked).toEqual([]);
    expect(preview.nextAction).toBe("Run `make-docs setup system --yes` to apply the reviewed machine changes.");
    expect(review).toContain("Codex");
    expect(readFileSync(nativePath, "utf8")).toBe(old.content);

    // The person approves. The rules now use the new paths.
    const applied = await runSystemSetupCommand({ ...setupOptions, dryRun: false, yes: true });
    expect(applied.status).toBe("configured");
    const updated = readFileSync(nativePath, "utf8");
    expect(testCase.hasOldPaths(updated)).toBe(false);
    expect(updated).not.toContain(`"run", `);
    expect(updated).toContain(`, "check", "prd"], decision`);

    // No other breakage: the repeat changes nothing, and verify is current.
    const repeat = await runSystemSetupCommand({ ...setupOptions, dryRun: false, yes: true });
    expect(repeat.status).toBe("unchanged");
    expect(readFileSync(nativePath, "utf8")).toBe(updated);
    const current = readCurrentHarnessIntegrationReceipt(root, storeRoot, "machine", "codex", "command-rules");
    expect(verifyState(testCase, root, executable, current!).state).toBe("current");
  });

  it("claude-code: verify reports old run-path permission rules as drift, and the approved update keeps user rules", () => {
    // Setup does not offer Claude Code permission rules today, so this checks the adapter directly.
    const testCase = CASES.find((candidate) => candidate.harness === "claude-code")!;
    const root = tempDir("make-docs-w33-p3-native-");
    const executable = executableFixture();
    const nativePath = testCase.nativeFile(root);
    mkdirSync(path.dirname(nativePath), { recursive: true });
    writeFileSync(nativePath, `${JSON.stringify({ theme: "dark", permissions: { allow: ["Bash(git status:*)"] } }, null, 2)}\n`);
    const planInput = {
      method: testCase.method,
      scope: "machine" as const,
      root,
      executable,
      commandRules: RULES,
      commandRuleAuthority: AUTHORITY,
    };
    const initial = testCase.adapter.apply({
      plan: testCase.adapter.plan(planInput),
      approved: true,
      operationId: "system.w33.p3.seed",
      appliedVersion: "2.0.9",
    });

    const old = testCase.makeOld(readFileSync(nativePath, "utf8"));
    expect(testCase.hasOldPaths(old.content)).toBe(true);
    writeFileSync(nativePath, old.content);
    const oldReceipt = makeOldReceipt(initial.receipt, old);

    const plan = expectDriftAndApprovalGate(testCase, root, executable, oldReceipt, old.content);
    const upgraded = testCase.adapter.apply({
      plan,
      approved: true,
      operationId: "system.w33.p3.upgrade",
      appliedVersion: "2.1.0",
    });
    const updated = readFileSync(nativePath, "utf8");
    expect(testCase.hasOldPaths(updated)).toBe(false);
    expect(updated).toContain(" check prd:*)");
    const settings = JSON.parse(updated) as { theme: string; permissions: { allow: string[] } };
    expect(settings.theme).toBe("dark");
    expect(settings.permissions.allow).toContain("Bash(git status:*)");
    expect(settings.permissions.allow.filter((value) => / run (prd|work|lifecycle|uat|backlog|performance) /.test(value))).toEqual([]);
    expect(testCase.adapter.plan({ ...planInput, receipt: upgraded.receipt }))
      .toMatchObject({ state: "current", changes: [{ action: "none" }] });
    expect(verifyState(testCase, root, executable, upgraded.receipt).state).toBe("current");
  });
});
