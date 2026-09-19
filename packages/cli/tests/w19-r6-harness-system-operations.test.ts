import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  CODEX_HARNESS_ADAPTER,
  verifyMakeDocsExecutable,
  type HarnessAccessPlan,
  type HarnessCommandRule,
  type HarnessCommandRuleAuthority,
} from "../src/harness-access";
import {
  completeHarnessSystemOperation,
  failHarnessSystemOperation,
  prepareHarnessSystemOperation,
  readPendingHarnessSystemOperation,
} from "../src/store/harness-system-operations";
import { recordHarnessIntegrationReceipt } from "../src/store/harness-integration-receipts";
import {
  acquireInstallationLock,
  releaseInstallationLock,
  withInstallationOperation,
} from "../src/store/installation-state";
import { cleanupTempDir, createTempDir } from "./helpers";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) cleanupTempDir(root);
});

function fixture() {
  const base = createTempDir("make-docs-harness-journal-");
  roots.push(base);
  const targetRoot = path.join(base, "project");
  const nativeRoot = path.join(base, "home");
  const storeRoot = path.join(base, "store");
  mkdirSync(targetRoot);
  mkdirSync(nativeRoot);
  const executablePath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../dist/index.js",
  );
  const executable = verifyMakeDocsExecutable({ executablePath });
  const plan = CODEX_HARNESS_ADAPTER.plan({
    method: "mcp",
    scope: "machine",
    root: nativeRoot,
    executable,
  });
  return { base, targetRoot, nativeRoot, storeRoot, executable, plan };
}

function prepare(input: ReturnType<typeof fixture>) {
  return prepareHarnessSystemOperation({
    targetRoot: input.targetRoot,
    storeRoot: input.storeRoot,
    adapterId: CODEX_HARNESS_ADAPTER.id,
    harnessId: CODEX_HARNESS_ADAPTER.harnessId,
    plan: input.plan,
    appliedVersion: input.executable.packageVersion,
    verifiedAt: "2026-09-12T19:00:00.000Z",
  });
}

describe("W19 R6 Store-owned harness system operations", () => {
  it("resumes the exact saved plan and completes only after its receipt is stored", () => {
    const input = fixture();
    const pending = prepare(input);

    expect(readPendingHarnessSystemOperation(
      input.targetRoot,
      input.storeRoot,
      pending.operationId,
    )).toEqual(pending);

    const applied = CODEX_HARNESS_ADAPTER.apply({
      plan: pending.plan,
      approved: true,
      operationId: pending.operationId,
      appliedVersion: pending.appliedVersion,
      verifiedAt: pending.verifiedAt,
    });
    expect(readFileSync(path.join(input.nativeRoot, ".codex/config.toml"), "utf8")).toContain(
      `command = ${JSON.stringify(input.executable.path)}`,
    );
    expect(() => completeHarnessSystemOperation(
      input.targetRoot,
      input.storeRoot,
      pending,
      applied.receipt,
    )).toThrow("no exact verified Store receipt");
    expect(readPendingHarnessSystemOperation(input.targetRoot, input.storeRoot)).toEqual(pending);

    recordHarnessIntegrationReceipt(input.targetRoot, input.storeRoot, applied.receipt);
    completeHarnessSystemOperation(
      input.targetRoot,
      input.storeRoot,
      pending,
      applied.receipt,
    );
    expect(readPendingHarnessSystemOperation(input.targetRoot, input.storeRoot)).toBeNull();
  });

  it("rejects changed target or plan evidence and blocks another Store writer", () => {
    const writerInput = fixture();
    const lock = acquireInstallationLock(writerInput.targetRoot, writerInput.storeRoot);
    try {
      expect(() => prepare(writerInput)).toThrow("Store operation is already pending");
    } finally {
      releaseInstallationLock(lock);
    }

    const input = fixture();
    const pending = prepare(input);
    const otherTarget = path.join(input.base, "other-project");
    expect(() => readPendingHarnessSystemOperation(
      otherTarget,
      input.storeRoot,
      pending.operationId,
    )).toThrow("invalid Store evidence");

    const changedPlan: HarnessAccessPlan = {
      ...pending.plan,
      nextAction: "This is not the saved reviewed plan.",
    };
    expect(() => failHarnessSystemOperation(
      input.targetRoot,
      input.storeRoot,
      { ...pending, plan: changedPlan },
      { reason: "Known test failure.", changeOutcome: "none" },
    )).toThrow("invalid Store evidence");
    expect(readPendingHarnessSystemOperation(input.targetRoot, input.storeRoot)).toEqual(pending);

    failHarnessSystemOperation(
      input.targetRoot,
      input.storeRoot,
      pending,
      { reason: "Known test failure.", changeOutcome: "none" },
    );
    expect(readPendingHarnessSystemOperation(input.targetRoot, input.storeRoot)).toBeNull();
  });

  it("journals only a drift repair proved by the exact prior ownership receipt", () => {
    const input = fixture();
    withInstallationOperation(input.targetRoot, "test.prepare-store", () => undefined, {
      storeRoot: input.storeRoot,
    });
    const ruleA: HarnessCommandRule = {
      id: "make-docs.resource.list",
      commandPrefix: ["resource", "list"],
      operationIds: ["resource.list"],
      access: { store: "none", project: "none", hostConfig: "none" },
    };
    const ruleB: HarnessCommandRule = {
      id: "make-docs.resource.read",
      commandPrefix: ["resource", "read"],
      operationIds: ["resource.read"],
      access: { store: "none", project: "none", hostConfig: "none" },
    };
    let currentRules: readonly HarnessCommandRule[] = [ruleA];
    const authority: HarnessCommandRuleAuthority = {
      list: () => currentRules,
      validate(rules) {
        if (JSON.stringify(rules) !== JSON.stringify(currentRules)) {
          throw new Error("Rules differ from the test authority.");
        }
        return rules;
      },
    };
    const firstPlan = CODEX_HARNESS_ADAPTER.plan({
      method: "command-rules",
      scope: "machine",
      root: input.nativeRoot,
      executable: input.executable,
      commandRules: currentRules,
      commandRuleAuthority: authority,
    });
    const first = CODEX_HARNESS_ADAPTER.apply({
      plan: firstPlan,
      approved: true,
      operationId: "initial-owned-rules",
      appliedVersion: input.executable.packageVersion,
      verifiedAt: "2026-09-12T18:00:00.000Z",
    });
    recordHarnessIntegrationReceipt(input.targetRoot, input.storeRoot, first.receipt);

    currentRules = [ruleA, ruleB];
    const repairPlan = CODEX_HARNESS_ADAPTER.plan({
      method: "command-rules",
      scope: "machine",
      root: input.nativeRoot,
      executable: input.executable,
      commandRules: currentRules,
      commandRuleAuthority: authority,
      receipt: first.receipt,
    });
    expect(repairPlan).toMatchObject({
      state: "drifted",
      changes: [{ action: "update", ownership: "make-docs-owned" }],
    });
    const pending = prepareHarnessSystemOperation({
      targetRoot: input.targetRoot,
      storeRoot: input.storeRoot,
      adapterId: CODEX_HARNESS_ADAPTER.id,
      harnessId: CODEX_HARNESS_ADAPTER.harnessId,
      plan: repairPlan,
      appliedVersion: input.executable.packageVersion,
      verifiedAt: "2026-09-12T20:05:00.000Z",
    });
    expect(pending.ownershipReceipt).toEqual(first.receipt);
    expect(readPendingHarnessSystemOperation(
      input.targetRoot,
      input.storeRoot,
      pending.operationId,
    )).toEqual(pending);
  });
});
