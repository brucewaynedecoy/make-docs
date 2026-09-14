import { describe, expect, test, vi } from "vitest";
import { defaultSelections } from "../src/profile";
import {
  applyUnifiedSetup,
  resolveUnifiedSetupState,
} from "../src/setup-state";
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderSystemPlans, runSystemSetupCommand, SYSTEM_COMMAND_RULE_AUTHORITY } from "../src/setup-system";
import { CODEX_HARNESS_ADAPTER, fingerprintEntry, listBoundedHarnessCommandRules, sha256, verifyMakeDocsExecutable } from "../src/harness-access/index";
import { loadGlobalConfig, writeGlobalConfig } from "../src/store/global-config";
import { readCurrentHarnessIntegrationReceipt, recordHarnessIntegrationReceipt } from "../src/store/harness-integration-receipts";
import { readPendingHarnessSystemOperation } from "../src/store/harness-system-operations";
import { cleanupTempDir, createTempDir } from "./helpers";
import type { Capability, Harness } from "../src/types";
import {
  renderWizardReviewSummary,
  runSelectionWizardWithRenderer,
  type WizardRenderer,
} from "../src/wizard";

describe("W19 R6 unified setup", () => {
  test("fresh setup selects the complete project shape without a capability step", async () => {
    const capabilityStep = vi.fn<WizardRenderer["editCapabilities"]>();
    const renderer: WizardRenderer = {
      editCapabilities: capabilityStep,
      async editHarnesses() {
        return ["codex"] satisfies Harness[];
      },
      async editOptions(state) {
        return state.options;
      },
      async review() {
        return "apply";
      },
    };
    const initial = defaultSelections();
    for (const capability of Object.keys(initial.capabilities) as Capability[]) {
      initial.capabilities[capability] = false;
    }

    const result = await runSelectionWizardWithRenderer(renderer, {
      initialSelections: initial,
      introTitle: "Setup",
      projectState: "fresh",
    });

    expect(capabilityStep).not.toHaveBeenCalled();
    expect(result?.capabilities).toEqual({
      designs: true,
      plans: true,
      prd: true,
      work: true,
    });
  });

  test("repeat setup preserves a partial project shape", () => {
    const selections = defaultSelections();
    selections.capabilities.prd = false;
    selections.capabilities.work = false;

    const state = resolveUnifiedSetupState({
      entry: "setup",
      projectState: "partial",
      selections,
    });

    expect(state.currentCapabilities).toEqual(["designs", "plans"]);
    expect(state.selections.capabilities).toEqual(selections.capabilities);
    expect(state.allowCapabilityExpansion).toBe(false);
  });

  test("review separates computer and project state and explains resource access", () => {
    const summary = renderWizardReviewSummary(
      defaultSelections(),
      undefined,
      [
        { harness: "codex", state: "configured" },
        { harness: "claude-code", state: "detected" },
      ],
    );

    expect(summary).toContain("This computer");
    expect(summary).toContain("Codex: configured");
    expect(summary).toContain("Claude Code: detected");
    expect(summary).toContain("This project");
    expect(summary).toContain("Resource provider reads need no Store access");
    expect(summary).toContain("Local copies reduce CLI dependence");
  });

  test("system success remains valid after one project failure", async () => {
    const applySystem = vi.fn(async () => undefined);
    const verifySystem = vi.fn(async () => true);
    const applyProject = vi.fn(async () => {
      throw new Error("injected project failure");
    });

    const result = await applyUnifiedSetup({
      systemChanged: true,
      projectChanged: true,
      systemApproved: true,
      projectApproved: true,
      applySystem,
      verifySystem,
      applyProject,
    });

    expect(result).toMatchObject({
      status: "partial",
      system: "applied",
      project: "failed",
    });
    expect(result.nextAction).toContain("`make-docs setup`");
    expect(applyProject).toHaveBeenCalledTimes(1);
  });

  test("machine review names access, files, effect, and the none result", () => {
    const review = renderSystemPlans([
      {
        harness: "codex",
        method: "mcp",
        status: "incomplete",
        operations: ["work.item.resolve"],
        machineFiles: [".codex/config.toml"],
        changed: true,
        detail: "Adds one bounded Make Docs MCP entry.",
        apply: async () => undefined,
        verify: async () => true,
      },
    ]);

    expect(review).toContain("Enabled operations: work.item.resolve");
    expect(review).toContain("Native files: .codex/config.toml");
    expect(review).toContain("Effect: Adds one bounded Make Docs MCP entry.");
    expect(review).toContain("None effect");
  });

  test("a no-change repeat invokes no mutation callback", async () => {
    const applySystem = vi.fn(async () => undefined);
    const verifySystem = vi.fn(async () => true);
    const applyProject = vi.fn(async () => undefined);

    const result = await applyUnifiedSetup({
      systemChanged: false,
      projectChanged: false,
      systemApproved: false,
      projectApproved: false,
      applySystem,
      verifySystem,
      applyProject,
    });

    expect(result.status).toBe("unchanged");
    expect(applySystem).not.toHaveBeenCalled();
    expect(verifySystem).not.toHaveBeenCalled();
    expect(applyProject).not.toHaveBeenCalled();
  });

  test("explicit none records global intent without a native harness write", async () => {
    const root = createTempDir("make-docs-system-none-");
    const storeContainer = createTempDir("make-docs-system-none-store-");
    const storeRoot = path.join(storeContainer, "store");
    try {
      const result = await runSystemSetupCommand({
        dryRun: false,
        yes: true,
        harnesses: { codex: true, "claude-code": false },
        methods: { codex: "none" },
        targetRoot: root,
        machineRoot: root,
        storeRoot,
      });
      expect(result).toMatchObject({ status: "skipped-none", scope: "machine" });
      const config = JSON.parse(readFileSync(path.join(storeRoot, "config.json"), "utf8"));
      expect(config.settings.harnesses.codex).toEqual({
        selected: false,
        maximumMethod: null,
        accessCeiling: { store: "none", project: "none", hostConfig: "none" },
      });
    } finally {
      cleanupTempDir(root);
      cleanupTempDir(storeContainer);
    }
  });

  test("an unproved production method remains blocked with one next action", async () => {
    const machineRoot = createTempDir("make-docs-system-blocked-");
    const storeContainer = createTempDir("make-docs-system-blocked-store-");
    try {
      const result = await runSystemSetupCommand({
        dryRun: false,
        yes: true,
        harnesses: { codex: true, "claude-code": false },
        methods: { codex: "command-rules" },
        machineRoot,
        targetRoot: machineRoot,
        storeRoot: path.join(storeContainer, "store"),
      });
      expect(result.status).toBe("blocked");
      expect(result.blocked[0]).toMatchObject({
        harness: "codex",
      });
      expect(result.blocked[0]?.nextAction).toBeTruthy();
    } finally {
      cleanupTempDir(machineRoot);
      cleanupTempDir(storeContainer);
    }
  });

  test("fabricated in-memory conformance stays experimental and unavailable", async () => {
    const machineRoot = createTempDir("make-docs-system-evidence-");
    const storeContainer = createTempDir("make-docs-system-evidence-store-");
    try {
      const result = await runSystemSetupCommand({
        dryRun: false,
        yes: true,
        harnesses: { codex: true, "claude-code": false },
        methods: { codex: "command-rules" },
        machineRoot,
        targetRoot: machineRoot,
        storeRoot: path.join(storeContainer, "store"),
      });
      expect(result.status).toBe("blocked");
      expect(result.blocked[0]?.reason).toContain("exact runtime facts");
      expect(result.configured).toEqual([]);
    } finally {
      cleanupTempDir(machineRoot);
      cleanupTempDir(storeContainer);
    }
  });

  test("non-interactive repeat setup still requires an explicit method", async () => {
    const machineRoot = createTempDir("make-docs-system-intent-");
    const storeContainer = createTempDir("make-docs-system-intent-store-");
    const storeRoot = path.join(storeContainer, "store");
    try {
      const global = loadGlobalConfig(storeRoot).config;
      global.settings.harnesses.codex = {
        selected: true,
        maximumMethod: "command-rules",
        accessCeiling: { store: "read", project: "read", hostConfig: "none" },
      };
      writeGlobalConfig(storeRoot, global);

      await expect(runSystemSetupCommand({
        dryRun: false,
        yes: true,
        harnesses: { codex: true, "claude-code": false },
        machineRoot,
        targetRoot: machineRoot,
        storeRoot,
      })).rejects.toThrow("has no explicit method");
      expect(loadGlobalConfig(storeRoot).config.settings.harnesses.codex).toEqual(
        global.settings.harnesses.codex,
      );
    } finally {
      cleanupTempDir(machineRoot);
      cleanupTempDir(storeContainer);
    }
  });

  test("project harness narrowing is enforced before system planning", async () => {
    const machineRoot = createTempDir("make-docs-system-project-access-");
    const storeContainer = createTempDir("make-docs-system-project-access-store-");
    try {
      await expect(runSystemSetupCommand({
        dryRun: false,
        yes: true,
        harnesses: { codex: true, "claude-code": false },
        methods: { codex: "command-rules" },
        projectHarnessIntegrations: [{
          harness: "codex",
          mode: "narrow",
          method: "mcp",
        }],
        machineRoot,
        targetRoot: machineRoot,
        storeRoot: path.join(storeContainer, "store"),
      })).rejects.toThrow("broader than machine-approved method");
    } finally {
      cleanupTempDir(machineRoot);
      cleanupTempDir(storeContainer);
    }
  });

  test("production setup supplies exact operation-registry rule authority", () => {
    const registryRules = SYSTEM_COMMAND_RULE_AUTHORITY.list();
    const boundedRules = listBoundedHarnessCommandRules(SYSTEM_COMMAND_RULE_AUTHORITY);
    expect(registryRules.length).toBeGreaterThan(0);
    expect(boundedRules.length).toBeGreaterThan(0);
    expect(boundedRules).toEqual(
      SYSTEM_COMMAND_RULE_AUTHORITY.validate(registryRules),
    );

    const forged = registryRules.map((rule, index) =>
      index === 0
        ? { ...rule, commandPrefix: ["make-docs", "forged"] }
        : rule,
    );
    expect(() => SYSTEM_COMMAND_RULE_AUTHORITY.validate(forged)).toThrow(
      "differs from registry authority",
    );
  });

  test("a reviewed adapter plan object cannot enable a production method", async () => {
    const machineRoot = createTempDir("make-docs-system-machine-");
    const storeContainer = createTempDir("make-docs-system-store-");
    const storeRoot = path.join(storeContainer, "store");
    try {
      const executable = verifyMakeDocsExecutable({
        executablePath: path.resolve(
          path.dirname(fileURLToPath(import.meta.url)),
          "../dist/index.js",
        ),
      });
      const commandRules = listBoundedHarnessCommandRules(SYSTEM_COMMAND_RULE_AUTHORITY);
      const reviewedPlan = CODEX_HARNESS_ADAPTER.plan({
        method: "command-rules",
        scope: "machine",
        root: machineRoot,
        executable,
        commandRules,
        commandRuleAuthority: SYSTEM_COMMAND_RULE_AUTHORITY,
      });
      let mutationHookRan = false;
      const interrupted = await runSystemSetupCommand({
        dryRun: false,
        yes: true,
        harnesses: { codex: true, "claude-code": false },
        methods: { codex: "command-rules" },
        ...({ reviewedAdapterPlansForTests: [reviewedPlan] } as Record<string, unknown>),
        afterNativeApplyForTests() {
          mutationHookRan = true;
        },
        machineRoot,
        targetRoot: machineRoot,
        storeRoot,
      });
      expect(interrupted.status).toBe("blocked");
      expect(mutationHookRan).toBe(false);
      expect(() => readFileSync(path.join(machineRoot, ".codex/rules/make-docs.rules"), "utf8")).toThrow();
      expect(() => readCurrentHarnessIntegrationReceipt(machineRoot, storeRoot, "machine", "codex", "command-rules"))
        .toThrow("Store is absent");
      expect(readPendingHarnessSystemOperation(machineRoot, storeRoot)).toBeNull();
    } finally {
      cleanupTempDir(machineRoot);
      cleanupTempDir(storeContainer);
    }
  });

  test("a drift repair plan object cannot bypass the support registry", async () => {
    const machineRoot = createTempDir("make-docs-system-repair-");
    const storeContainer = createTempDir("make-docs-system-repair-store-");
    const storeRoot = path.join(storeContainer, "store");
    try {
      const executable = verifyMakeDocsExecutable({
        executablePath: path.resolve(
          path.dirname(fileURLToPath(import.meta.url)),
          "../dist/index.js",
        ),
      });
      const commandRules = listBoundedHarnessCommandRules(SYSTEM_COMMAND_RULE_AUTHORITY);
      const initialPlan = CODEX_HARNESS_ADAPTER.plan({
        method: "command-rules",
        scope: "machine",
        root: machineRoot,
        executable,
        commandRules,
        commandRuleAuthority: SYSTEM_COMMAND_RULE_AUTHORITY,
      });
      const initial = CODEX_HARNESS_ADAPTER.apply({
        plan: initialPlan,
        approved: true,
        operationId: "system.codex.rules.initial",
        appliedVersion: executable.packageVersion,
        verifiedAt: "2026-09-12T19:00:00.000Z",
      });
      const nativePath = path.join(machineRoot, initial.receipt.entries[0].path);
      const desiredValue = initial.receipt.entries[0].value as string;
      const ownedPriorValue = `${desiredValue}# Prior Make Docs release\n`;
      writeFileSync(nativePath, ownedPriorValue, "utf8");
      const ownershipReceipt = {
        ...initial.receipt,
        operationId: "system.codex.rules.prior-release",
        verifiedAt: "2026-09-12T19:01:00.000Z",
        entries: [{
          ...initial.receipt.entries[0],
          value: ownedPriorValue,
          entryFingerprint: fingerprintEntry(ownedPriorValue),
          fileFingerprint: sha256(ownedPriorValue),
        }],
      };
      recordHarnessIntegrationReceipt(machineRoot, storeRoot, ownershipReceipt);

      const repairPlan = CODEX_HARNESS_ADAPTER.plan({
        method: "command-rules",
        scope: "machine",
        root: machineRoot,
        executable,
        commandRules,
        commandRuleAuthority: SYSTEM_COMMAND_RULE_AUTHORITY,
        receipt: ownershipReceipt,
      });
      expect(repairPlan).toMatchObject({
        state: "drifted",
        changes: [{ action: "update", ownership: "make-docs-owned" }],
      });

      const interrupted = await runSystemSetupCommand({
        dryRun: false,
        yes: true,
        harnesses: { codex: true, "claude-code": false },
        methods: { codex: "command-rules" },
        ...({ reviewedAdapterPlansForTests: [repairPlan] } as Record<string, unknown>),
        afterNativeApplyForTests() {
          throw new Error("must not run");
        },
        machineRoot,
        targetRoot: machineRoot,
        storeRoot,
      });
      expect(interrupted.status).toBe("blocked");
      expect(readFileSync(nativePath, "utf8")).toBe(ownedPriorValue);
      expect(readPendingHarnessSystemOperation(machineRoot, storeRoot)).toBeNull();
      expect(readCurrentHarnessIntegrationReceipt(
        machineRoot,
        storeRoot,
        "machine",
        "codex",
        "command-rules",
      )).toMatchObject({ operationId: ownershipReceipt.operationId });
    } finally {
      cleanupTempDir(machineRoot);
      cleanupTempDir(storeContainer);
    }
  });

  test("blocks a matching user-owned native entry in the production setup path", async () => {
    const machineRoot = createTempDir("make-docs-system-user-owned-");
    const storeContainer = createTempDir("make-docs-system-user-owned-store-");
    const storeRoot = path.join(storeContainer, "store");
    const nativePath = path.join(machineRoot, ".codex/config.toml");
    const userContent = [
      "[mcp_servers.make_docs]",
      'command = "/user/tool"',
      'args = ["serve"]',
      "",
    ].join("\n");
    try {
      mkdirSync(path.dirname(nativePath), { recursive: true });
      writeFileSync(nativePath, userContent, "utf8");
      const executable = verifyMakeDocsExecutable({
        executablePath: path.resolve(
          path.dirname(fileURLToPath(import.meta.url)),
          "../dist/index.js",
        ),
      });
      const userOwnedPlan = CODEX_HARNESS_ADAPTER.plan({
        method: "mcp",
        scope: "machine",
        root: machineRoot,
        executable,
      });
      expect(userOwnedPlan).toMatchObject({
        state: "blocked",
        changes: [{ action: "none", ownership: "unverified" }],
      });

      const result = await runSystemSetupCommand({
        dryRun: false,
        yes: true,
        harnesses: { codex: true, "claude-code": false },
        methods: { codex: "mcp" },
        ...({ reviewedAdapterPlansForTests: [userOwnedPlan] } as Record<string, unknown>),
        machineRoot,
        targetRoot: machineRoot,
        storeRoot,
      });

      expect(result.status).toBe("blocked");
      expect(readFileSync(nativePath, "utf8")).toBe(userContent);
      expect(readPendingHarnessSystemOperation(machineRoot, storeRoot)).toBeNull();
    } finally {
      cleanupTempDir(machineRoot);
      cleanupTempDir(storeContainer);
    }
  });

});
