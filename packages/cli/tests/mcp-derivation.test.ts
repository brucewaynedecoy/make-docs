import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, test } from "vitest";
import {
  callMakeDocsMcpTool,
  deriveMcpToolName,
  listDerivedMcpOperationAccessFacts,
  listDerivedMcpOperationTools,
  MAKE_DOCS_MCP_TOOLS,
  verifyDerivedMcpToolParity,
} from "../src/mcp/tools";
import { listOperationAccessFacts, listOperations } from "../src/operations/registry";
import { loadSqliteDriver } from "../src/store";
import { cleanupTempDir, createTempDir, writeMinimalManifest } from "./helpers";

const sqliteAvailable = loadSqliteDriver().available;

/**
 * W18 R11 P5 conformance pins (R-TEST-1): the MCP operation tool list is
 * DERIVED from the operation registry — parity in both directions, derived
 * spellings for all identifiers including the renames, core-enforced write
 * gating and pending refusal, and context-owned approvals.
 */

const EXPECTED_DERIVED_TOOL_NAMES: Record<string, string> = {
  "prd.authority.validate": "prd_validate",
  "performance.evidence.validate": "performance_validate",
  "work.item.resolve": "work_item_resolve",
  "work.evidence.record": "evidence_record",
  "work.evidence.read": "evidence_read",
  "work.backlog.snapshot": "backlog_snapshot",
  "work.backlog-cache.lookup": "backlog_cache_read",
  "work.backlog-cache.write": "backlog_cache_write",
  "backlog.review.open": "backlog_review_open",
  "backlog.review.refresh": "backlog_review_refresh",
  "resource.list": "resource_list",
  "resource.read": "resource_read",
  "resource.ensure": "resource_ensure",
  "project.surface.ensure": "surface_ensure",
  "project.path-hygiene.repair": "paths_repair",
  "project.path-hygiene.validate": "paths_validate",
  "project.state.status": "project_status",
  "project.state.recover": "project_recover",
  "project.checkout-move.preview": "checkout_move_preview",
  "project.checkout-move.apply": "checkout_move_apply",
  "project.checkout-register.preview": "checkout_register_preview",
  "project.checkout-register.apply": "checkout_register_apply",
  "project.persona.list": "personas",
  "project.layout.preview": "layout_preview",
  "project.layout.prepare": "layout_prepare",
  "project.layout.apply": "layout_apply",
  "project.layout.verify": "layout_verify",
  "lifecycle.start": "lifecycle_start",
  "lifecycle.show": "lifecycle_show",
  "lifecycle.list": "lifecycle_list",
  "lifecycle.checkpoint": "lifecycle_checkpoint",
  "lifecycle.pause": "lifecycle_pause",
  "lifecycle.resume": "lifecycle_resume",
  "lifecycle.attach-evidence": "lifecycle_attach_evidence",
  "lifecycle.complete": "lifecycle_complete",
  "lifecycle.fail": "lifecycle_fail",
  "lifecycle.abandon": "lifecycle_abandon",
  "uat.scenario.validate": "uat_scenario_validate",
  "uat.persona.resolve": "uat_persona_resolve",
  "uat.target.validate": "uat_target_validate",
  "uat.evidence-reference.validate": "uat_evidence_validate",
  "uat.finding.validate": "uat_finding_validate",
  "uat.result.validate": "uat_result_validate",
};

const SUPPORT_EVIDENCE_REF =
  "docs/prd/36-playbook-packaging-compiler-and-harness-adapters.md";

const CODEX_PLUGIN_TARGET = {
  harness: "codex",
  outputKind: "plugin",
  surface: "native",
  scope: "project",
} as const;

const CODEX_PLUGIN_PRECONDITIONS = {
  "harness-supported": "satisfied",
  "project-trusted": "satisfied",
  "symlink-or-copy-mirror": "satisfied",
} as const;

function writeFile(root: string, relativePath: string, content: string): string {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
  return absolutePath;
}

describe("MCP derivation parity (R-REG-2, R-MIG-3, R-CORE-1)", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    while (tempRoots.length > 0) {
      cleanupTempDir(tempRoots.pop()!);
    }
  });

  test("every registry identifier has exactly one derived MCP tool and vice versa", () => {
    const parity = verifyDerivedMcpToolParity();
    expect(parity).toEqual({
      missingOperations: [],
      unknownOperations: [],
      misderivedNames: [],
      duplicateNames: [],
    });

    // The check reads the live registry: a deliberately injected mismatch
    // must fail in both directions.
    const derived = listDerivedMcpOperationTools();
    const filtered = derived.filter((tool) => tool.operation !== "resource.list");
    expect(verifyDerivedMcpToolParity(filtered).missingOperations).toContain("resource.list");

    const withUnknown = [
      ...derived,
      { name: "make_docs_bogus_operation", operation: "bogus.operation" },
    ];
    expect(verifyDerivedMcpToolParity(withUnknown).unknownOperations).toContain("bogus.operation");

    const withDuplicate = [...derived, derived[0]!];
    const duplicateParity = verifyDerivedMcpToolParity(withDuplicate);
    expect(duplicateParity.duplicateNames).toContain(derived[0]!.name);
    expect(duplicateParity.missingOperations).toContain(derived[0]!.operation);

    const misspelled = derived.map((tool) =>
      tool.operation === "lifecycle.show"
        ? { ...tool, name: "make_docs_playbook_run_read" }
        : tool,
    );
    expect(verifyDerivedMcpToolParity(misspelled).misderivedNames).toContain(
      "make_docs_playbook_run_read",
    );
  });

  test("tool names are exactly the derived spellings for every admitted identifier", () => {
    const registryIds = listOperations().map((operation) => operation.id);
    expect(new Set(registryIds).size).toBe(registryIds.length);
    expect(Object.keys(EXPECTED_DERIVED_TOOL_NAMES).sort()).toEqual([...registryIds].sort());

    const derivedByOperation = new Map(
      listDerivedMcpOperationTools().map((tool) => [tool.operation, tool.name]),
    );
    for (const [operation, expectedName] of Object.entries(EXPECTED_DERIVED_TOOL_NAMES)) {
      expect(derivedByOperation.get(operation), operation).toBe(expectedName);
      expect(deriveMcpToolName(operation)).toBe(expectedName);
    }
  });

  test("the rename is a hard cutover: old run_* tool names are gone (R-MIG-1)", async () => {
    const toolNames = MAKE_DOCS_MCP_TOOLS.map((tool) => tool.name);
    for (const oldName of [
      "make_docs_playbook_run_start",
      "make_docs_playbook_run_invoke",
      "make_docs_playbook_run_read",
    ]) {
      expect(toolNames).not.toContain(oldName);
      await expect(callMakeDocsMcpTool(oldName)).rejects.toThrow("Unknown make-docs MCP tool");
    }
  });

  test("W26 R1 removes every prior MCP tool name", async () => {
    const oldNames = [
      "make_docs_operation_domains",
      "make_docs_installed_state",
      "make_docs_manifest_read",
      "make_docs_config_read",
      "make_docs_compatibility_classify",
      "make_docs_install_plan",
      ...Object.keys(EXPECTED_DERIVED_TOOL_NAMES).map(
        (operation) => `make_docs_${operation.replace(/[.-]/g, "_")}`,
      ),
    ];
    const currentNames = new Set(MAKE_DOCS_MCP_TOOLS.map((tool) => tool.name));
    expect(oldNames).toHaveLength(6 + Object.keys(EXPECTED_DERIVED_TOOL_NAMES).length);
    for (const oldName of oldNames) {
      expect(currentNames.has(oldName), oldName).toBe(false);
      await expect(callMakeDocsMcpTool(oldName)).rejects.toThrow("Unknown make-docs MCP tool");
    }
  });

  test("write operations without allowWrite are refused by the core, not the tool", async () => {
    await expect(callMakeDocsMcpTool("evidence_record", {})).rejects.toThrow(
      "Operation `work.evidence.record` mutates state and requires write permission from the calling surface",
    );

    // No per-tool write conditional survives in the MCP adapter (R-CORE-1).
    const toolsSource = readFileSync(
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/mcp/tools.ts"),
      "utf8",
    );
    expect(toolsSource).not.toContain("allowWrite !== true");
  });

  test("derived descriptors mark write operations and carry operation input schemas", () => {
    const descriptors = new Map(MAKE_DOCS_MCP_TOOLS.map((tool) => [tool.name, tool]));
    const writeTool = descriptors.get("evidence_record")!;
    expect(writeTool.description).toContain("allowWrite=true");
    expect(Object.keys(writeTool.inputSchema)).toEqual(
      expect.arrayContaining(["allowWrite", "dryRun", "approvals"]),
    );

    // The progression identifiers are active with derived typed inputs:
    // playbook.next is a read tool with no allowWrite argument, and
    // Current lifecycle tools expose typed inputs and core write gating.
    const nextTool = descriptors.get("lifecycle_show")!;
    expect(nextTool.description).not.toContain("Pending");
    expect(Object.keys(nextTool.inputSchema)).toEqual(
      expect.arrayContaining(["runId", "dryRun", "approvals"]),
    );
    expect(Object.keys(nextTool.inputSchema)).not.toContain("allowWrite");
    const advanceTool = descriptors.get("lifecycle_checkpoint")!;
    expect(Object.keys(advanceTool.inputSchema)).toEqual(
      expect.arrayContaining(["runId", "checkpoint", "expectedVersion", "allowWrite"]),
    );

    const readTool = descriptors.get("lifecycle_list")!;
    expect(Object.keys(readTool.inputSchema)).not.toContain("allowWrite");
    expect(Object.keys(readTool.inputSchema)).toEqual(
      expect.arrayContaining(["repoRoot", "dryRun", "approvals"]),
    );

    const backlogTool = descriptors.get("backlog_snapshot")!;
    expect(Object.keys(backlogTool.inputSchema)).toEqual(
      expect.arrayContaining(["targetRoot", "dryRun", "approvals"]),
    );
    expect(Object.keys(backlogTool.inputSchema)).not.toContain("allowWrite");
  });

  test("derived descriptors publish exact registry access and MCP readiness", () => {
    const registryFacts = new Map(
      listOperationAccessFacts().map((fact) => [fact.operation, fact]),
    );
    const mcpFacts = listDerivedMcpOperationAccessFacts();
    expect(mcpFacts).toHaveLength(registryFacts.size);
    for (const fact of mcpFacts) {
      const registry = registryFacts.get(fact.operation)!;
      expect(fact.access, fact.operation).toEqual(registry.access);
      expect(fact.mcpReady, fact.operation).toBe(registry.mcpReady);
      const descriptor = MAKE_DOCS_MCP_TOOLS.find((tool) => tool.name === fact.name)!;
      expect(descriptor.access, fact.operation).toEqual(registry.access);
      expect(descriptor.mcpReady, fact.operation).toBe(registry.mcpReady);
      expect(descriptor.description, fact.operation).toContain(
        `Access: Store ${registry.access.store}; project ${registry.access.project}; host configuration ${registry.access.hostConfig}.`,
      );
    }
    expect(registryFacts.get("resource.read")?.mcpReady).toBe(true);
  });
});
