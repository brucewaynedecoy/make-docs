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
import { createPlaybookPackagePlan } from "../src/operations";
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
  "playbook.validate": "make_docs_playbook_validate",
  "playbook.catalog": "make_docs_playbook_catalog",
  "playbook.resolve": "make_docs_playbook_resolve",
  "playbook.capabilities": "make_docs_playbook_capabilities",
  "playbook.start": "make_docs_playbook_start",
  "playbook.invoke": "make_docs_playbook_invoke",
  "playbook.status": "make_docs_playbook_status",
  "playbook.next": "make_docs_playbook_next",
  "playbook.advance": "make_docs_playbook_advance",
  "playbook.gate": "make_docs_playbook_gate",
  "playbook.resume": "make_docs_playbook_resume",
  "playbook.close": "make_docs_playbook_close",
  "playbook.run.export": "make_docs_playbook_run_export",
  "playbook.run.import": "make_docs_playbook_run_import",
  "package.plan": "make_docs_package_plan",
  "package.surface-resolve": "make_docs_package_surface_resolve",
  "package.write": "make_docs_package_write",
  // Appended by W18 R12 P3 (PRD 41 R-GRAM-3): ship derives like every other
  // operation; this is the ONLY agent-facing surface change of the round.
  "package.ship": "make_docs_package_ship",
  "prd.authority.validate": "make_docs_prd_authority_validate",
  "work.item.resolve": "make_docs_work_item_resolve",
  "work.evidence.record": "make_docs_work_evidence_record",
  "work.evidence.read": "make_docs_work_evidence_read",
  "resource.list": "make_docs_resource_list",
  "resource.read": "make_docs_resource_read",
  "resource.ensure": "make_docs_resource_ensure",
  "project.surface.ensure": "make_docs_project_surface_ensure",
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

function writePlaybook(root: string, persona: string, slug: string, title: string): string {
  return writeFile(
    root,
    `docs/assets/playbooks/${persona}/${slug}.md`,
    [
      "---",
      `title: ${title}`,
      "kind: playbook",
      "status: accepted",
      `persona: ${persona}`,
      "stack: run",
      `summary: ${title} summary.`,
      "---",
      "",
      `# ${title}`,
      "",
      "## Purpose",
      "",
      "Use this playbook when the matching workflow goal is active.",
      "",
      "## Inputs and Authority",
      "",
      "- User request.",
      "",
      "## Procedure",
      "",
      "1. Resolve the playbook.",
      "",
      "## Gates and Decisions",
      "",
      "- Stop when user review is required.",
      "",
      "## Assists",
      "",
      "- Assists are optional unless the playbook says otherwise.",
      "",
      "## Outputs and Handoff",
      "",
      "- Record the expected output or handoff artifact.",
      "",
      "## Validation",
      "",
      "- Confirm the workflow completed or report why it stopped.",
      "",
    ].join("\n"),
  );
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
    const filtered = derived.filter((tool) => tool.operation !== "playbook.catalog");
    expect(verifyDerivedMcpToolParity(filtered).missingOperations).toContain("playbook.catalog");

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
      tool.operation === "playbook.status"
        ? { ...tool, name: "make_docs_playbook_run_read" }
        : tool,
    );
    expect(verifyDerivedMcpToolParity(misspelled).misderivedNames).toContain(
      "make_docs_playbook_run_read",
    );
  });

  test("tool names are exactly the derived spellings for all 42 identifiers", () => {
    const registryIds = listOperations().map((operation) => operation.id);
    expect(registryIds).toHaveLength(42);
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
    await expect(callMakeDocsMcpTool("make_docs_package_write", {})).rejects.toThrow(
      "Operation `package.write` mutates state and requires write permission from the calling surface",
    );

    // No per-tool write conditional survives in the MCP adapter (R-CORE-1).
    const toolsSource = readFileSync(
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/mcp/tools.ts"),
      "utf8",
    );
    expect(toolsSource).not.toContain("allowWrite !== true");
  });

  test("the W18 R7 progression write tools are core-gated behind allowWrite", async () => {
    // The identifiers reserved for the W18 R7 state machine are active; the
    // mutating ones refuse without allowWrite exactly like every other write.
    for (const writeId of [
      "playbook.advance",
      "playbook.gate",
      "playbook.resume",
      "playbook.close",
    ]) {
      await expect(
        callMakeDocsMcpTool(deriveMcpToolName(writeId), { runId: "run-1" }),
      ).rejects.toThrow(
        `Operation \`${writeId}\` mutates state and requires write permission from the calling surface`,
      );
    }
  });

  test.skipIf(!sqliteAvailable)(
    "the progression operations behave identically through the derived MCP tools (t11)",
    async () => {
      const root = createTempDir("make-docs-mcp-progression-");
      tempRoots.push(root);
      writeMinimalManifest(root);
      const storeRoot = path.join(createTempDir("make-docs-mcp-progression-store-"), "store");
      tempRoots.push(path.dirname(storeRoot));
      writeFile(
        root,
        "docs/assets/playbooks/user/ship.playbook.md",
        [
          "---",
          'title: "Ship"',
          'kind: "playbook"',
          'persona: "user"',
          'status: "accepted"',
          'stack: "run"',
          'summary: "Ship summary."',
          'schema: "make-docs.playbook.v2"',
          'workflowSchema: "make-docs.workflow.v1"',
          "---",
          "",
          "# Ship",
          "",
          "## Purpose",
          "",
          "Ship the workflow.",
          "",
          "## When To Use",
          "",
          "Use in MCP parity tests.",
          "",
          "## Inputs",
          "",
          "- User direction first.",
          "",
          "## Dependencies",
          "",
          "```playbook",
          "dependencies:",
          "  - id: make-docs-cli",
          "    kind: cli",
          "    requirement: required",
          "    source: package install",
          "    used_by: [check]",
          "    fallback: stop with install guidance",
          "```",
          "",
          "## Workflow",
          "",
          "```playbook",
          "workflow:",
          "  id: ship",
          "  state_model: make-docs.workflow-state.v1",
          "  routing: linear",
          "steps:",
          "  - id: check",
          "    title: Check the playbook catalog",
          "    executor: cli",
          "    role: check",
          "    activation: sequential",
          "    mode: deterministic",
          "    requires: [make-docs-cli]",
          "    operation: playbook.catalog",
          "  - id: record",
          "    title: Record the handoff",
          "    executor: agent",
          "    role: activity",
          "    activation: sequential",
          "    instructions: Record the handoff artifact.",
          "```",
          "",
          "## Step Guidance",
          "",
          "Run the steps in order.",
          "",
          "## Gates",
          "",
          "- None.",
          "",
          "## Outputs",
          "",
          "- Record the handoff artifact.",
          "",
          "## Validation",
          "",
          "- Every step reports an outcome.",
          "",
          "## Packaging Notes",
          "",
          "No packaging hints.",
          "",
        ].join("\n"),
      );
      const shared = { repoRoot: root, storeRoot, runId: "mcp-run" };

      const started = await callMakeDocsMcpTool("make_docs_playbook_start", {
        ...shared,
        ref: "user/ship",
        harness: "codex",
        allowWrite: true,
      });
      const startedState = (started.result as { state: Record<string, unknown> }).state;
      expect(startedState.cursor).toEqual({ kind: "step", id: "check" });

      const next = await callMakeDocsMcpTool("make_docs_playbook_next", shared);
      expect(next.result).toEqual(
        expect.objectContaining({
          position: "step",
          next: expect.objectContaining({ stepId: "check" }),
        }),
      );

      const advanced = await callMakeDocsMcpTool("make_docs_playbook_advance", {
        ...shared,
        outcome: "completed",
        evidenceRefs: ["mcp-evidence.md"],
        allowWrite: true,
      });
      // W18 R7 P3: advance returns the transitioned state plus the
      // mode-execution report.
      expect(advanced.result).toEqual(
        expect.objectContaining({
          state: expect.objectContaining({
            cursor: { kind: "step", id: "record" },
            evidenceRefs: ["mcp-evidence.md"],
          }),
          execution: expect.objectContaining({ action: "recorded", outcome: "completed" }),
        }),
      );

      const closed = await callMakeDocsMcpTool("make_docs_playbook_close", {
        ...shared,
        terminalStatus: "completed",
        allowWrite: true,
      });
      expect(closed.result).toEqual(
        expect.objectContaining({ status: "completed", terminalStatus: "completed" }),
      );

      const status = await callMakeDocsMcpTool("make_docs_playbook_status", shared);
      expect(status.result).toEqual(expect.objectContaining({ terminalStatus: "completed" }));
    },
  );

  test("named approvals flow through the context to the implementation", async () => {
    const root = createTempDir("make-docs-mcp-derivation-approvals-");
    tempRoots.push(root);
    writeMinimalManifest(root);
    writePlaybook(root, "user", "run-stack", "Run Stack");
    const plan = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/run-stack"],
      target: CODEX_PLUGIN_TARGET,
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
    }).plan;
    const artifact = plan.generatedArtifacts.find(
      (candidate) => candidate.outputKind === plan.target.outputKind,
    )!;
    // Pre-existing, differing generated output inside the canonical payload
    // tree: the impl stops unless the caller granted the reviewed-overwrite
    // approval. Since W18 R8 P2 the artifact path is the container root of
    // the compiled multi-file distributable.
    writeFile(root, `${artifact.path}/.codex-plugin/plugin.json`, "{ \"stale\": true }\n");

    const withoutApproval = await callMakeDocsMcpTool("make_docs_package_write", {
      repoRoot: root,
      plan,
      preconditions: CODEX_PLUGIN_PRECONDITIONS,
      allowWrite: true,
      dryRun: true,
    });
    const blocked = withoutApproval.result as { stops: Array<{ reason: string }> };
    expect(blocked.stops.map((stop) => stop.reason)).toContain("ownership-review-required");

    const withApproval = await callMakeDocsMcpTool("make_docs_package_write", {
      repoRoot: root,
      plan,
      preconditions: CODEX_PLUGIN_PRECONDITIONS,
      allowWrite: true,
      dryRun: true,
      approvals: ["reviewed-overwrite"],
    });
    const ready = withApproval.result as { stops: Array<{ reason: string }>; status: string };
    expect(ready.stops).toEqual([]);
    expect(ready.status).toBe("ready");
  });

  test("dryRun rides the context: package.write plans without writing", async () => {
    const root = createTempDir("make-docs-mcp-derivation-dry-run-");
    tempRoots.push(root);
    writeMinimalManifest(root);
    writePlaybook(root, "user", "run-stack", "Run Stack");
    const plan = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/run-stack"],
      target: CODEX_PLUGIN_TARGET,
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
    }).plan;

    const payload = await callMakeDocsMcpTool("make_docs_package_write", {
      repoRoot: root,
      plan,
      preconditions: CODEX_PLUGIN_PRECONDITIONS,
      allowWrite: true,
      dryRun: true,
    });
    const result = payload.result as { status: string; lines: string[] };
    expect(result.status).toBe("ready");
    expect(result.lines).toContain("Writes executed: no");
  });

  test("derived descriptors mark write operations and carry operation input schemas", () => {
    const descriptors = new Map(MAKE_DOCS_MCP_TOOLS.map((tool) => [tool.name, tool]));
    const writeTool = descriptors.get("make_docs_package_write")!;
    expect(writeTool.description).toContain("allowWrite=true");
    expect(Object.keys(writeTool.inputSchema)).toEqual(
      expect.arrayContaining(["allowWrite", "dryRun", "approvals"]),
    );

    // The progression identifiers are active with derived typed inputs:
    // playbook.next is a read tool with no allowWrite argument, and
    // playbook.advance is a write tool exposing its typed input contract.
    const nextTool = descriptors.get("make_docs_playbook_next")!;
    expect(nextTool.description).not.toContain("Pending");
    expect(Object.keys(nextTool.inputSchema)).toEqual(
      expect.arrayContaining(["runId", "dryRun", "approvals"]),
    );
    expect(Object.keys(nextTool.inputSchema)).not.toContain("allowWrite");
    const advanceTool = descriptors.get("make_docs_playbook_advance")!;
    expect(Object.keys(advanceTool.inputSchema)).toEqual(
      expect.arrayContaining(["runId", "outcome", "evidenceRefs", "allowWrite"]),
    );

    const readTool = descriptors.get("make_docs_playbook_catalog")!;
    expect(Object.keys(readTool.inputSchema)).not.toContain("allowWrite");
    expect(Object.keys(readTool.inputSchema)).toEqual(
      expect.arrayContaining(["repoRoot", "dryRun", "approvals"]),
    );
  });
});
