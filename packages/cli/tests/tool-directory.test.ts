import { describe, expect, test } from "vitest";

import {
  RESERVED_AGENTICS_FAMILIES,
  TOOL_DIRECTORY_CONFIG_RELATIVE_PATH,
  TOOL_DIRECTORY_RUNTIME_STATE_PATHS,
  TOOL_RESOURCE_FAMILIES,
  getReservedAgenticsPath,
  getToolResourceTierPath,
  getToolResourceTierPaths,
  isReservedAgenticsPath,
  isToolDirectoryCustomResourcePath,
  isToolDirectoryRuntimeStatePath,
  isToolDirectorySystemResourcePath,
} from "../src/tool-directory";

describe("tool directory model", () => {
  test("defines system and custom tiers for each tool resource family", () => {
    expect(getToolResourceTierPaths()).toEqual([
      ".make-docs/contracts/system",
      ".make-docs/contracts/custom",
      ".make-docs/references/system",
      ".make-docs/references/custom",
      ".make-docs/templates/system",
      ".make-docs/templates/custom",
      ".make-docs/prompts/system",
      ".make-docs/prompts/custom",
      ".make-docs/scripts/system",
      ".make-docs/scripts/custom",
    ]);

    for (const family of TOOL_RESOURCE_FAMILIES) {
      expect(isToolDirectorySystemResourcePath(getToolResourceTierPath(family, "system"))).toBe(
        true,
      );
      expect(isToolDirectoryCustomResourcePath(`${getToolResourceTierPath(family, "custom")}/local.md`)).toBe(
        true,
      );
    }
  });

  test("keeps runtime state separate from project-owned config and docs assets", () => {
    expect(TOOL_DIRECTORY_RUNTIME_STATE_PATHS).toEqual([
      ".make-docs/manifest.json",
      ".make-docs/conflicts",
      ".make-docs/runs",
    ]);
    expect(TOOL_DIRECTORY_CONFIG_RELATIVE_PATH).toBe(".make-docs/config.yaml");
    expect(isToolDirectoryRuntimeStatePath(".make-docs/manifest.json")).toBe(true);
    expect(isToolDirectoryRuntimeStatePath(".make-docs/conflicts/run/file.md")).toBe(true);
    expect(isToolDirectoryRuntimeStatePath(".make-docs/runs/current/state.json")).toBe(true);
    expect(isToolDirectoryRuntimeStatePath(".make-docs/config.yaml")).toBe(false);
    expect(isToolDirectoryRuntimeStatePath("docs/assets/templates/work-phase.md")).toBe(false);
  });

  test("reserves agentics paths without treating them as resource tiers", () => {
    expect(RESERVED_AGENTICS_FAMILIES).toEqual(["skills", "plugins"]);
    expect(getReservedAgenticsPath("skills")).toBe(".make-docs/agentics/skills");
    expect(getReservedAgenticsPath("plugins")).toBe(".make-docs/agentics/plugins");
    expect(isReservedAgenticsPath(".make-docs/agentics/skills/work-on-wave")).toBe(true);
    expect(isReservedAgenticsPath(".make-docs/agentics/plugins/run-playbook")).toBe(true);
    expect(isToolDirectorySystemResourcePath(".make-docs/agentics/skills/work-on-wave")).toBe(false);
    expect(isToolDirectoryCustomResourcePath(".make-docs/agentics/plugins/run-playbook")).toBe(false);
  });
});
