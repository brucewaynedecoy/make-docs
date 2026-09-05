import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, test } from "vitest";
import {
  callMakeDocsMcpTool,
  deriveMcpToolName,
  listDerivedMcpOperationTools,
  MAKE_DOCS_MCP_TOOLS,
  verifyDerivedMcpToolParity,
} from "../src/mcp/tools";
import { listOperations } from "../src/operations/registry";
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
  "prd.authority.validate": "make_docs_prd_authority_validate",
  "work.item.resolve": "make_docs_work_item_resolve",
  "work.evidence.record": "make_docs_work_evidence_record",
  "work.evidence.read": "make_docs_work_evidence_read",
  "resource.list": "make_docs_resource_list",
  "resource.read": "make_docs_resource_read",
  "resource.ensure": "make_docs_resource_ensure",
  "project.surface.ensure": "make_docs_project_surface_ensure",
  "project.path-hygiene.validate": "make_docs_project_path_hygiene_validate",
  "lifecycle.start": "make_docs_lifecycle_start",
  "lifecycle.show": "make_docs_lifecycle_show",
  "lifecycle.list": "make_docs_lifecycle_list",
  "lifecycle.checkpoint": "make_docs_lifecycle_checkpoint",
  "lifecycle.pause": "make_docs_lifecycle_pause",
  "lifecycle.resume": "make_docs_lifecycle_resume",
  "lifecycle.attach-evidence": "make_docs_lifecycle_attach_evidence",
  "lifecycle.complete": "make_docs_lifecycle_complete",
  "lifecycle.fail": "make_docs_lifecycle_fail",
  "lifecycle.abandon": "make_docs_lifecycle_abandon",
  "uat.scenario.validate": "make_docs_uat_scenario_validate",
  "uat.persona.resolve": "make_docs_uat_persona_resolve",
  "uat.target.validate": "make_docs_uat_target_validate",
  "uat.evidence-reference.validate": "make_docs_uat_evidence_reference_validate",
  "uat.finding.validate": "make_docs_uat_finding_validate",
  "uat.result.validate": "make_docs_uat_result_validate",
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

  test("tool names are exactly the derived spellings for all 25 identifiers", () => {
    const registryIds = listOperations().map((operation) => operation.id);
    expect(registryIds).toHaveLength(25);
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

  test("write operations without allowWrite are refused by the core, not the tool", async () => {
    await expect(callMakeDocsMcpTool("make_docs_work_evidence_record", {})).rejects.toThrow(
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
    const writeTool = descriptors.get("make_docs_work_evidence_record")!;
    expect(writeTool.description).toContain("allowWrite=true");
    expect(Object.keys(writeTool.inputSchema)).toEqual(
      expect.arrayContaining(["allowWrite", "dryRun", "approvals"]),
    );

    // The progression identifiers are active with derived typed inputs:
    // playbook.next is a read tool with no allowWrite argument, and
    // Current lifecycle tools expose typed inputs and core write gating.
    const nextTool = descriptors.get("make_docs_lifecycle_show")!;
    expect(nextTool.description).not.toContain("Pending");
    expect(Object.keys(nextTool.inputSchema)).toEqual(
      expect.arrayContaining(["runId", "dryRun", "approvals"]),
    );
    expect(Object.keys(nextTool.inputSchema)).not.toContain("allowWrite");
    const advanceTool = descriptors.get("make_docs_lifecycle_checkpoint")!;
    expect(Object.keys(advanceTool.inputSchema)).toEqual(
      expect.arrayContaining(["runId", "checkpoint", "expectedVersion", "allowWrite"]),
    );

    const readTool = descriptors.get("make_docs_lifecycle_list")!;
    expect(Object.keys(readTool.inputSchema)).not.toContain("allowWrite");
    expect(Object.keys(readTool.inputSchema)).toEqual(
      expect.arrayContaining(["repoRoot", "dryRun", "approvals"]),
    );
  });
});
