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
      "domains",
      "install_status",
      "manifest",
      "config",
      "compatibility",
      "install_plan",
      // Derived from the operation registry (R-REG-2, R-MIG-3).
      "prd_validate",
      "performance_validate",
      "project_status",
      "project_recover",
      "surface_ensure",
      "paths_validate",
      "paths_repair",
      "personas",
      "layout_preview",
      "layout_prepare",
      "layout_apply",
      "layout_verify",
      "work_item_resolve",
      "evidence_record",
      "evidence_read",
      "backlog_snapshot",
      "backlog_cache_read",
      "backlog_cache_write",
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
      "uat_scenario_validate",
      "uat_persona_resolve",
      "uat_target_validate",
      "uat_evidence_validate",
      "uat_finding_validate",
      "uat_result_validate",
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

    const payload = await callMakeDocsMcpTool("install_plan", {
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
