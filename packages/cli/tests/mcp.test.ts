import { afterEach, describe, expect, test, vi } from "vitest";
import { runCli } from "../src/cli";
import { createMakeDocsMcpServer } from "../src/mcp/server";
import {
  MAKE_DOCS_MCP_TOOLS,
  callMakeDocsMcpTool,
} from "../src/mcp/tools";
import { cleanupTempDir, createTempDir } from "./helpers";

describe("make-docs MCP runtime", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    vi.restoreAllMocks();
    for (const root of tempRoots.splice(0)) {
      cleanupTempDir(root);
    }
  });

  test("declares a shipped MCP tool surface (6 hand-defined + 25 derived)", () => {
    expect(createMakeDocsMcpServer()).toBeDefined();
    expect(MAKE_DOCS_MCP_TOOLS.map((tool) => tool.name)).toEqual([
      // Hand-defined non-operation tools.
      "make_docs_operation_domains",
      "make_docs_installed_state",
      "make_docs_manifest_read",
      "make_docs_config_read",
      "make_docs_compatibility_classify",
      "make_docs_install_plan",
      // Derived from the operation registry (R-REG-2, R-MIG-3).
      "make_docs_prd_authority_validate",
      "make_docs_project_surface_ensure",
      "make_docs_project_path_hygiene_validate",
      "make_docs_work_item_resolve",
      "make_docs_work_evidence_record",
      "make_docs_work_evidence_read",
      "make_docs_resource_list",
      "make_docs_resource_read",
      "make_docs_resource_ensure",
      "make_docs_lifecycle_start",
      "make_docs_lifecycle_show",
      "make_docs_lifecycle_list",
      "make_docs_lifecycle_checkpoint",
      "make_docs_lifecycle_pause",
      "make_docs_lifecycle_resume",
      "make_docs_lifecycle_attach_evidence",
      "make_docs_lifecycle_complete",
      "make_docs_lifecycle_fail",
      "make_docs_lifecycle_abandon",
      "make_docs_uat_scenario_validate",
      "make_docs_uat_persona_resolve",
      "make_docs_uat_target_validate",
      "make_docs_uat_evidence_reference_validate",
      "make_docs_uat_finding_validate",
      "make_docs_uat_result_validate",
    ]);
  });

  test("exposes no pruned operation on the MCP tool list (R-RUN-2, R-TEST-4)", async () => {
    const toolNames = MAKE_DOCS_MCP_TOOLS.map((tool) => tool.name);
    const prunedToolNames = [
      "make_docs_closeout_probe",
      "make_docs_closeout_validate",
      "make_docs_work_phase_state",
      "make_docs_wave_resolve",
      "make_docs_wave_status",
      "make_docs_phase_plan",
      "make_docs_scope_guard",
      "make_docs_phase_gate",
    ];
    for (const pruned of prunedToolNames) {
      expect(toolNames).not.toContain(pruned);
    }

    const prunedOperationNames = [
      "wave-resolve",
      "wave-status",
      "work-phase-state",
      "phase-plan",
      "phase-gate",
      "scope-guard",
      "closeout-probe",
      "closeout-validate",
      "closeout-history",
    ];
    for (const operation of prunedOperationNames) {
      const spelling = operation.replace(/-/g, "_");
      for (const toolName of toolNames) {
        expect(toolName).not.toContain(spelling);
        expect(toolName).not.toContain(operation);
      }
    }

    for (const pruned of prunedToolNames) {
      await expect(callMakeDocsMcpTool(pruned)).rejects.toThrow("Unknown make-docs MCP tool");
    }
  });

  test("exposes make-docs mcp help from the package CLI", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await runCli(["mcp", "--help"]);

    const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
    expect(output).toContain("make-docs mcp");
    expect(output).toContain("TypeScript-owned make-docs MCP server");
    expect(output).toContain("same operation registry and core used by `make-docs run`");
  });

  test("plans install changes without writing files", async () => {
    const root = createTempDir("make-docs-mcp-plan-");
    tempRoots.push(root);

    const payload = await callMakeDocsMcpTool("make_docs_install_plan", {
      targetDir: root,
    });
    const result = payload.result as {
      actions: Array<{ relativePath: string }>;
      actionCounts: { create: number; generate: number };
      writesFiles: boolean;
    };

    expect(result.writesFiles).toBe(false);
    expect(result.actionCounts.create + result.actionCounts.generate).toBeGreaterThan(0);
    expect(result.actions.map((action) => action.relativePath)).toContain("AGENTS.md");
  });

  test("requires explicit approval before starting a lifecycle run through MCP", async () => {
    await expect(
      callMakeDocsMcpTool("make_docs_lifecycle_start", {
        repoRoot: ".",
        lifecycleStage: "implementation",
      }),
    ).rejects.toThrow("mutates state and requires write permission");
  });

  test("requires explicit approval before changing a lifecycle checkpoint through MCP", async () => {
    await expect(
      callMakeDocsMcpTool("make_docs_lifecycle_checkpoint", {
        repoRoot: ".",
        runId: "test-run",
        expectedVersion: 1,
        checkpoint: "Review complete",
      }),
    ).rejects.toThrow("mutates state and requires write permission");
  });

});
