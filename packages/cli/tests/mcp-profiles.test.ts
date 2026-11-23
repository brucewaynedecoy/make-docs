import { afterEach, describe, expect, test, vi } from "vitest";
import {
  MCP_PROFILES,
  assertMcpToolMetadata,
  type McpProfile,
} from "../src/operations/mcp-metadata";
import {
  assertOperationMcpMetadata,
  getOperation,
  isOperationMcpReady,
  listOperationAccessFacts,
} from "../src/operations/registry";
import { listMakeDocsMcpTools } from "../src/mcp/tools";
import { NAME_CATALOG } from "../src/operations/name-catalog";

// Reviewed W24 inventory. Names are independent of runtime assignment logic.
const EXPECTED_PROFILES: Record<McpProfile, string[]> = {
  core: [
    "setup_config_read", "setup_status", "setup_manifest_read", "mcp_domains_list",
    "project_persona_list", "project_state_status", "project_list", "resource_list", "resource_read",
  ],
  setup: [
    "setup_compatibility_check", "setup_config_read", "setup_plan", "setup_status", "setup_manifest_read",
    "project_checkout_preview", "project_checkout_apply", "project_move_preview", "project_move_apply",
    "project_layout_apply", "project_layout_prepare", "project_layout_preview", "project_layout_verify",
    "project_paths_repair", "project_paths_validate", "project_state_recover",
    "project_state_status", "project_surface_ensure", "resource_ensure",
    "project_doctor_check", "project_doctor_fix",
    "setup_store_check", "setup_store_clean",
    "project_markdown_validate", "project_markdown_repair",
  ],
  workflow: [
    "lifecycle_abandon", "lifecycle_attach_evidence", "lifecycle_checkpoint", "lifecycle_complete",
    "lifecycle_fail", "lifecycle_list", "lifecycle_pause", "lifecycle_resume", "lifecycle_show",
    "lifecycle_start", "project_persona_list", "work_evidence_read", "work_evidence_record",
    "work_item_resolve",
    "project_relations_list",
    // W29 R0 P4 work queue (PRD 52 R-WORK-QUEUE-12).
    "work_status", "work_sync", "work_next", "work_claim", "work_release", "work_report", "work_close", "work_export", "work_add",
  ],
  quality: [
    "check_performance_evidence", "check_prd", "project_paths_validate",
    "check_uat_evidence", "check_uat_finding", "check_uat_persona",
    "check_uat_result", "check_uat_scenario", "check_uat_target",
    "project_doctor_check", "project_doctor_fix",
    "check_decomposition", "project_markdown_validate",
  ],
  backlog: [
    "backlog_cache_lookup", "backlog_cache_write", "backlog_review_open", "backlog_review_refresh", "backlog_snapshot",
    "work_status", "work_sync", "work_next", "work_claim", "work_release", "work_report", "work_close", "work_export", "work_add",
  ],
};

/** W34 R0 P1 tools (PRD 25 R-MCP-PROFILE-11). They landed after W33 R0 and have no former names. */
const W34_R0_P1_TOOLS = new Set(["check_decomposition", "project_relations_list", "project_markdown_validate", "project_markdown_repair"]);
/** W29 R0 P4 work queue tools (PRD 25 R-MCP-PROFILE). They landed after W33 R0 and have no former names. */
const W29_R0_P4_TOOLS = new Set(["work_status", "work_sync", "work_next", "work_claim", "work_release", "work_report", "work_close", "work_export", "work_add"]);

// The W24 inventory under the names before W33 R0 (evidence for W33 R0 P2 A6).
const PRE_W33_PROFILES: Record<McpProfile, string[]> = {
  core: [
    "config", "install_status", "manifest", "domains",
    "personas", "project_status", "project_list", "resource_list", "resource_read",
  ],
  setup: [
    "compatibility", "config", "install_plan", "install_status", "manifest",
    "checkout_register_preview", "checkout_register_apply", "checkout_move_preview", "checkout_move_apply",
    "layout_apply", "layout_prepare", "layout_preview", "layout_verify",
    "paths_repair", "paths_validate", "project_recover",
    "project_status", "surface_ensure", "resource_ensure",
    "project_doctor_check", "project_doctor_fix",
    "setup_store_check", "setup_store_clean",
  ],
  workflow: [
    "lifecycle_abandon", "lifecycle_attach_evidence", "lifecycle_checkpoint", "lifecycle_complete",
    "lifecycle_fail", "lifecycle_list", "lifecycle_pause", "lifecycle_resume", "lifecycle_show",
    "lifecycle_start", "personas", "evidence_read", "evidence_record",
    "work_item_resolve",
  ],
  quality: [
    "performance_validate", "prd_validate", "paths_validate",
    "uat_evidence_validate", "uat_finding_validate", "uat_persona_resolve",
    "uat_result_validate", "uat_scenario_validate", "uat_target_validate",
    "project_doctor_check", "project_doctor_fix",
  ],
  backlog: ["backlog_cache_read", "backlog_cache_write", "backlog_review_open", "backlog_review_refresh", "backlog_snapshot"],
};

describe("W33 R0 P2 profile membership", () => {
  test("keeps the same members in every profile, by operation; only the names change", () => {
    const renamed = new Map(NAME_CATALOG.filter((entry) => entry.formerMcp).map((entry) => [entry.formerMcp!, entry.newMcp]));
    const ready = listMakeDocsMcpTools().filter((tool) => tool.mcpReady !== false);
    for (const profile of MCP_PROFILES) {
      const expected = PRE_W33_PROFILES[profile].map((name) => {
        const next = renamed.get(name);
        expect(next, name).toBeDefined();
        return next!;
      });
      const members = ready.filter((tool) => tool.mcp!.profiles.includes(profile)).map((tool) => tool.name);
      expect(members.filter((name) => !W34_R0_P1_TOOLS.has(name) && !W29_R0_P4_TOOLS.has(name)).sort(), profile).toEqual(expected.sort());
      expect(members.sort(), profile).toEqual([...EXPECTED_PROFILES[profile]].sort());
    }
  });
});

describe("W24 R0 P1 MCP metadata", () => {
  afterEach(() => {
    vi.doUnmock("../src/operations/prd/ops");
    vi.resetModules();
  });

  test("assigns all 67 ready tools, including checkout move, with all equal to the intent union", () => {
    const ready = listMakeDocsMcpTools().filter((tool) => tool.mcpReady !== false);
    const names = ready.map((tool) => tool.name);
    // 54 before W34 R0 P1, which added 4 (PRD 25 R-MCP-PROFILE-11), and W29 R0 P4 added 9.
    expect(names).toHaveLength(67);
    expect(new Set(names).size).toBe(67);
    for (const tool of ready) {
      expect(() => assertMcpToolMetadata(tool.name, tool.mcp)).not.toThrow();
    }
    const union = new Set<string>();
    for (const profile of MCP_PROFILES) {
      const members = ready.filter((tool) => tool.mcp!.profiles.includes(profile));
      expect(members.map((tool) => tool.name).sort()).toEqual(
        EXPECTED_PROFILES[profile].sort(),
      );
      for (const tool of members) union.add(tool.name);
    }
    expect([...union].sort()).toEqual([...names].sort());
  });

  test("copies registry metadata without changing schemas, descriptions, access or admission", () => {
    const facts = new Map(listOperationAccessFacts().map((fact) => [fact.operation, fact]));
    for (const tool of listMakeDocsMcpTools()) {
      if (!tool.operation) continue;
      const definition = getOperation(tool.operation);
      expect(tool.mcp).toEqual(definition.mcp);
      expect(tool.mcp).not.toBe(definition.mcp);
      expect(tool.mcp!.profiles).not.toBe(definition.mcp!.profiles);
      expect(tool.access).toEqual(facts.get(tool.operation)!.access);
      expect(tool.mcpReady).toBe(facts.get(tool.operation)!.mcpReady);
      expect(tool.description).toContain(definition.summary);
      expect(definition.handler).toBeTypeOf("function");
      if ("shape" in definition.inputSchema) {
        for (const [key, schema] of Object.entries(definition.inputSchema.shape as object)) {
          expect(tool.inputSchema[key]).toBe(schema);
        }
      }
    }
  });

  test("shared assignments retain one descriptor and one input contract", () => {
    const tools = listMakeDocsMcpTools();
    for (const name of [
      "setup_config_read", "setup_status", "setup_manifest_read",
      "project_state_status", "project_persona_list",
      "project_paths_validate",
    ]) {
      const matches = tools.filter((tool) => tool.name === name);
      expect(matches).toHaveLength(1);
      const tool = matches[0];
      expect(tool.mcp!.profiles).toHaveLength(2);
      for (const profile of tool.mcp!.profiles) {
        expect(tools.filter((member) => member.mcp!.profiles.includes(profile))).toContain(tool);
      }
    }
  });

  test("returned metadata cannot change later lists or the canonical registry", () => {
    const original = listMakeDocsMcpTools();
    const changed = listMakeDocsMcpTools();
    for (const tool of changed) {
      tool.mcp!.profiles.splice(0);
      tool.mcp!.defaultExposure = tool.mcp!.defaultExposure === "eager" ? "deferred" : "eager";
    }
    expect(listMakeDocsMcpTools()).toEqual(original);
    expect(getOperation("resource.read").mcp!.profiles).toEqual(["core"]);
  });

  test.each([
    [undefined, "declare profile metadata"],
    [null, "declare profile metadata"],
    [{ profiles: [], defaultExposure: "eager" }, "nonempty profile set"],
    [{ profiles: "core", defaultExposure: "eager" }, "nonempty profile set"],
    [{ profiles: ["core", "unknown"], defaultExposure: "eager" }, "unknown profile"],
    [{ profiles: ["all"], defaultExposure: "eager" }, "unknown profile"],
    [{ profiles: ["core", "core"], defaultExposure: "eager" }, "duplicate profiles"],
    [{ profiles: ["core"] }, "default exposure"],
    [{ profiles: ["core"], defaultExposure: "hidden" }, "default exposure"],
  ])("rejects malformed metadata %j", (metadata, reason) => {
    expect(() => assertMcpToolMetadata("test.tool", metadata)).toThrow(reason);
  });

  test("readiness remains independent of membership and default exposure", () => {
    const definition = getOperation("resource.read");
    for (const mcp of [undefined, { profiles: ["setup"] as McpProfile[], defaultExposure: "deferred" as const }]) {
      const candidate = { ...definition, mcp };
      expect(isOperationMcpReady(candidate)).toBe(true);
    }
    const pending = { ...definition, status: "pending" as const, mcp: undefined, handler: undefined };
    expect(isOperationMcpReady(pending)).toBe(false);
    expect(() => assertOperationMcpMetadata(pending)).not.toThrow();
    const hostAccess = { ...definition, access: { ...definition.access, hostConfig: "write" as const }, mcp: undefined };
    expect(isOperationMcpReady(hostAccess)).toBe(false);
    expect(() => assertOperationMcpMetadata(hostAccess)).not.toThrow();
    expect(() => assertOperationMcpMetadata({ ...pending, status: "active", handler: definition.handler })).toThrow("declare profile metadata");
  });

  test.each([
    undefined,
    { profiles: [], defaultExposure: "eager" },
    { profiles: ["unknown"], defaultExposure: "eager" },
  ])("refuses registry startup for a newly ready tool with invalid metadata %j", async (mcp) => {
    const definition = { ...getOperation("prd.authority.validate"), mcp };
    vi.resetModules();
    vi.doMock("../src/operations/prd/ops", () => ({ prdOperations: [definition] }));
    await expect(import("../src/operations/registry")).rejects.toThrow("MCP tool prd.authority.validate");
  });
});
