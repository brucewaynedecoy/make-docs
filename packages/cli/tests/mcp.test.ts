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

  test("declares the exact shipped MCP tool surface", () => {
    expect(createMakeDocsMcpServer()).toBeDefined();
    expect(MAKE_DOCS_MCP_TOOLS.map((tool) => tool.name)).toEqual([
      // Hand-defined non-operation tools.
      "mcp_domains_list",
      "setup_status",
      "setup_manifest_read",
      "setup_config_read",
      "setup_compatibility_check",
      "setup_plan",
      // Derived from the operation registry (R-REG-2, R-MIG-3).
      "check_prd",
      "check_performance_evidence",
      "project_checkout_preview",
      "project_checkout_apply",
      "project_move_preview",
      "project_move_apply",
      "project_state_status",
      "project_list",
      "project_state_recover",
      "project_surface_ensure",
      "project_paths_validate",
      "project_paths_repair",
      "project_persona_list",
      "project_layout_preview",
      "project_layout_prepare",
      "project_layout_apply",
      "project_layout_verify",
      "project_doctor_check",
      "project_doctor_fix",
      "setup_store_check",
      "setup_store_clean",
      "work_item_resolve",
      "work_evidence_record",
      "work_evidence_read",
      "backlog_snapshot",
      "backlog_cache_lookup",
      "backlog_cache_write",
      "backlog_review_open",
      "backlog_review_refresh",
      "resource_list",
      "resource_read",
      "resource_ensure",
      "lifecycle_start",
      "lifecycle_show",
      "lifecycle_list",
      "lifecycle_checkpoint",
      "lifecycle_pause",
      "lifecycle_resume",
      "lifecycle_attach_evidence",
      "lifecycle_complete",
      "lifecycle_fail",
      "lifecycle_abandon",
      "check_uat_scenario",
      "check_uat_persona",
      "check_uat_target",
      "check_uat_evidence",
      "check_uat_finding",
      "check_uat_result",
      // W34 R0 P1 Skill checks (PRD 25 R-MCP-PROFILE-11).
      "check_decomposition",
      "project_relations_list",
      "project_markdown_validate",
      "project_markdown_repair",
      // W29 R0 P4 work queue (PRD 52 R-WORK-QUEUE-12).
      "work_status",
      "work_sync",
      "work_next",
      "work_claim",
      "work_release",
      "work_report",
      "work_close",
      "work_export",
      "work_add",
      // W30 R0 P3 factory (PRD 53 R-FACTORY-49).
      "factory_status",
      "factory_tools_save",
      "factory_workflow_save",
      "factory_workflow_show",
      "factory_workflow_list",
      "factory_proof_save",
      "factory_assignment_start",
      "factory_assignment_save",
      "factory_assignment_list",
      "factory_restore",
      "factory_tools_list",
      "factory_file_backup_save",
      "factory_grant_use_record",
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
    expect(output).toContain("Serve Make Docs tools to agents over MCP.");
    expect(output).toContain("MCP tools run the same operations as the CLI groups.");
    expect(output).toContain("Each MCP tool name is its CLI path with underscores");
  });

  test("plans install changes without writing files", async () => {
    const root = createTempDir("make-docs-mcp-plan-");
    tempRoots.push(root);

    const payload = await callMakeDocsMcpTool("setup_plan", {
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
      callMakeDocsMcpTool("lifecycle_start", {
        repoRoot: ".",
        lifecycleStage: "implementation",
      }),
    ).rejects.toThrow("mutates state and requires write permission");
  });

  test("requires explicit approval before changing a lifecycle checkpoint through MCP", async () => {
    await expect(
      callMakeDocsMcpTool("lifecycle_checkpoint", {
        repoRoot: ".",
        runId: "test-run",
        expectedVersion: 1,
        checkpoint: "Review complete",
      }),
    ).rejects.toThrow("mutates state and requires write permission");
  });

});
