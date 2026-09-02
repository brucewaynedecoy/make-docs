import { describe, expect, test } from "vitest";

import {
  LEGACY_TOOL_RESOURCE_FAMILIES,
  LEGACY_TOOL_RESOURCE_ROOTS,
  RESERVED_AGENTICS_FAMILIES,
  TOOL_DIRECTORY_CONFIG_RELATIVE_PATH,
  TOOL_DIRECTORY_LOCAL_BOOTSTRAP_PATHS,
  TOOL_DIRECTORY_RUNTIME_STATE_PATHS,
  TOOL_RESOURCE_MATERIALIZATION_MODES,
  TOOL_RESOURCE_FAMILIES,
  createSystemToolResourceMigrationFixtures,
  getLegacyToolResourceFamily,
  getLocalBootstrapPathsForMaterializationMode,
  getReservedAgenticsPath,
  getSystemToolResourceMigrationTarget,
  getToolResourcePath,
  getToolResourcePaths,
  isReservedAgenticsPath,
  isToolDirectoryLocalBootstrapPath,
  isToolDirectoryRuntimeStatePath,
  isToolDirectorySystemResourcePath,
} from "../src/tool-directory";

describe("tool directory model", () => {
  test("defines one current system tree for each resource family", () => {
    expect(getToolResourcePaths()).toEqual([
      ".make-docs/system/contracts",
      ".make-docs/system/prompts",
      ".make-docs/system/references",
      ".make-docs/system/templates",
    ]);

    for (const family of TOOL_RESOURCE_FAMILIES) {
      expect(isToolDirectorySystemResourcePath(getToolResourcePath(family))).toBe(true);
    }
    expect(isToolDirectorySystemResourcePath(".make-docs/contracts/custom/local.md")).toBe(false);
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
    expect(isToolDirectoryRuntimeStatePath(".make-docs/system/templates/work-phase.md")).toBe(false);
  });

  test("reserves agentics paths without treating them as resource tiers", () => {
    expect(RESERVED_AGENTICS_FAMILIES).toEqual(["skills", "plugins"]);
    expect(getReservedAgenticsPath("skills")).toBe(".make-docs/agentics/skills");
    expect(getReservedAgenticsPath("plugins")).toBe(".make-docs/agentics/plugins");
    expect(isReservedAgenticsPath(".make-docs/agentics/skills/work-on-wave")).toBe(true);
    expect(isReservedAgenticsPath(".make-docs/agentics/plugins/run-playbook")).toBe(true);
    expect(isToolDirectorySystemResourcePath(".make-docs/agentics/skills/work-on-wave")).toBe(false);
  });

  test("maps current docs assets tool resources to system migration targets", () => {
    expect(LEGACY_TOOL_RESOURCE_FAMILIES).toEqual([
      "contracts",
      "prompts",
      "references",
      "templates",
    ]);
    expect(LEGACY_TOOL_RESOURCE_ROOTS).toEqual({
      contracts: ".make-docs/contracts/system",
      prompts: ".make-docs/prompts/system",
      references: ".make-docs/references/system",
      templates: ".make-docs/templates/system",
    });

    expect(
      getLegacyToolResourceFamily(
        "docs/assets/prompts/work-to-guides.prompt.md",
      ),
    ).toBe("prompts");
    expect(
      getLegacyToolResourceFamily("docs/assets/references/lifecycle.md"),
    ).toBe("references");
    expect(
      getLegacyToolResourceFamily("docs/assets/templates/work-phase.md"),
    ).toBe("templates");
    expect(getLegacyToolResourceFamily("docs/assets/archive/history/session.md")).toBeNull();
    expect(
      getLegacyToolResourceFamily(
        ".make-docs/system/prompts/work-to-guides.prompt.md",
      ),
    ).toBeNull();

    expect(
      getSystemToolResourceMigrationTarget(
        "docs/assets/prompts/work-to-guides.prompt.md",
      ),
    ).toBe(".make-docs/system/prompts/work-to-guides.prompt.md");
    expect(
      getSystemToolResourceMigrationTarget(
        "docs/assets/references/lifecycle.md",
      ),
    ).toBe(".make-docs/system/references/lifecycle.md");
    expect(
      getSystemToolResourceMigrationTarget(
        "docs/assets/references/guide-contract.md",
      ),
    ).toBe(".make-docs/system/contracts/guide-contract.md");
    expect(
      getSystemToolResourceMigrationTarget("docs/assets/templates/work-phase.md"),
    ).toBe(".make-docs/system/templates/work-phase.md");
    expect(
      getSystemToolResourceMigrationTarget("docs/assets/archive/design.md"),
    ).toBeNull();
  });

  test("creates stable migration fixtures for current system resources only", () => {
    expect(
      createSystemToolResourceMigrationFixtures([
        "docs/assets/templates/work-phase.md",
        "docs/assets/archive/history/session.md",
        "docs/assets/prompts/work-to-guides.prompt.md",
        "docs/assets/references/lifecycle.md",
      ]),
    ).toEqual([
      {
        currentPath: "docs/assets/prompts/work-to-guides.prompt.md",
        family: "prompts",
        targetPath: ".make-docs/system/prompts/work-to-guides.prompt.md",
        tier: "system",
      },
      {
        currentPath: "docs/assets/references/lifecycle.md",
        family: "references",
        targetPath: ".make-docs/system/references/lifecycle.md",
        tier: "system",
      },
      {
        currentPath: "docs/assets/templates/work-phase.md",
        family: "templates",
        targetPath: ".make-docs/system/templates/work-phase.md",
        tier: "system",
      },
    ]);
  });

  test("keeps local bootstrap paths materialized in every resource mode", () => {
    expect(TOOL_RESOURCE_MATERIALIZATION_MODES).toEqual([
      "full-snapshot",
      "provider-backed",
      "hybrid-pinned-cache",
    ]);
    expect(TOOL_DIRECTORY_LOCAL_BOOTSTRAP_PATHS).toEqual([
      ".make-docs/manifest.json",
      ".make-docs/config.yaml",
    ]);

    for (const mode of TOOL_RESOURCE_MATERIALIZATION_MODES) {
      expect(getLocalBootstrapPathsForMaterializationMode(mode)).toEqual([
        ".make-docs/manifest.json",
        ".make-docs/config.yaml",
      ]);
    }

    expect(isToolDirectoryLocalBootstrapPath(".make-docs/manifest.json")).toBe(
      true,
    );
    expect(isToolDirectoryLocalBootstrapPath(".make-docs/config.yaml")).toBe(
      true,
    );
    expect(isToolDirectoryLocalBootstrapPath(".make-docs/conflicts/run-id")).toBe(
      false,
    );
    expect(
      isToolDirectoryLocalBootstrapPath(
        ".make-docs/system/prompts/work-to-guides.prompt.md",
      ),
    ).toBe(false);
  });
});
