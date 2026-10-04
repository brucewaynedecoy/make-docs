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

// Reviewed W24 inventory. Names are independent of runtime assignment logic.
const EXPECTED_PROFILES: Record<McpProfile, string[]> = {
  core: [
    "config_read", "installed_state", "manifest_read", "operation_domains",
    "project_persona_list", "project_state_status", "resource_list", "resource_read",
  ],
  setup: [
    "compatibility_classify", "config_read", "install_plan", "installed_state", "manifest_read",
    "project_layout_apply", "project_layout_prepare", "project_layout_preview", "project_layout_verify",
    "project_path_hygiene_repair", "project_path_hygiene_validate", "project_state_recover",
    "project_state_status", "project_surface_ensure", "resource_ensure",
  ],
  workflow: [
    "lifecycle_abandon", "lifecycle_attach_evidence", "lifecycle_checkpoint", "lifecycle_complete",
    "lifecycle_fail", "lifecycle_list", "lifecycle_pause", "lifecycle_resume", "lifecycle_show",
    "lifecycle_start", "project_persona_list", "work_evidence_read", "work_evidence_record",
    "work_item_resolve",
  ],
  quality: [
    "performance_evidence_validate", "prd_authority_validate", "project_path_hygiene_validate",
    "uat_evidence_reference_validate", "uat_finding_validate", "uat_persona_resolve",
    "uat_result_validate", "uat_scenario_validate", "uat_target_validate",
  ],
  backlog: ["backlog_review_open", "backlog_review_refresh", "work_backlog_cache_lookup", "work_backlog_cache_write", "work_backlog_snapshot"],
};

describe("W24 R0 P1 MCP metadata", () => {
  afterEach(() => {
    vi.doUnmock("../src/operations/prd/ops");
    vi.resetModules();
  });

  test("assigns all 45 ready tools, including the W25 review pair, with all equal to the intent union", () => {
    const ready = listMakeDocsMcpTools().filter((tool) => tool.mcpReady !== false);
    const names = ready.map((tool) => tool.name);
    expect(names).toHaveLength(45);
    expect(new Set(names).size).toBe(45);
    for (const tool of ready) {
      expect(() => assertMcpToolMetadata(tool.name, tool.mcp)).not.toThrow();
    }
    const union = new Set<string>();
    for (const profile of MCP_PROFILES) {
      const members = ready.filter((tool) => tool.mcp!.profiles.includes(profile));
      expect(members.map((tool) => tool.name).sort()).toEqual(
        EXPECTED_PROFILES[profile].map((name) => `make_docs_${name}`).sort(),
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
      "make_docs_config_read", "make_docs_installed_state", "make_docs_manifest_read",
      "make_docs_project_state_status", "make_docs_project_persona_list",
      "make_docs_project_path_hygiene_validate",
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
