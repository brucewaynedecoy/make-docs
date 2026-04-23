import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  getOptionalSkills,
  getRequiredSkills,
  loadSkillRegistry,
} from "../src/skill-registry";
import { PACKAGE_ROOT } from "../src/utils";

describe("skill registry", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("ships a registry schema file alongside the packaged registry", () => {
    const registryPath = path.join(PACKAGE_ROOT, "skill-registry.json");
    const registry = JSON.parse(readFileSync(registryPath, "utf8")) as {
      $schema?: string;
    };
    const packageJson = JSON.parse(
      readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf8"),
    ) as { files?: string[] };

    expect(typeof registry.$schema).toBe("string");
    expect(existsSync(path.join(PACKAGE_ROOT, registry.$schema!))).toBe(true);
    expect(packageJson.files).toContain("skill-registry.schema.json");
  });

  test("loads the packaged registry with one required and one optional skill", () => {
    const registry = loadSkillRegistry(PACKAGE_ROOT);

    expect(registry.skills.map((skill) => skill.name)).toEqual([
      "archive-docs",
      "decompose-codebase",
    ]);
    expect(getRequiredSkills(registry).map((skill) => skill.name)).toEqual(["archive-docs"]);
    expect(getOptionalSkills(registry).map((skill) => skill.name)).toEqual([
      "decompose-codebase",
    ]);
  });

  test("declares the retained decompose skill asset surface", () => {
    const registry = loadSkillRegistry(PACKAGE_ROOT);
    const decomposeSkill = registry.skills.find((skill) => skill.name === "decompose-codebase");

    expect(decomposeSkill?.assets).toEqual([
      { source: "agents/openai.yaml", installPath: "agents/openai.yaml" },
      { source: "scripts/probe_environment.py", installPath: "scripts/probe_environment.py" },
      { source: "scripts/validate_output.py", installPath: "scripts/validate_output.py" },
      {
        source: "references/planning-workflow.md",
        installPath: "references/planning-workflow.md",
      },
      {
        source: "references/execution-workflow.md",
        installPath: "references/execution-workflow.md",
      },
      { source: "references/mcp-playbook.md", installPath: "references/mcp-playbook.md" },
      { source: "references/output-contract.md", installPath: "references/output-contract.md" },
      {
        source: "references/harness-capability-matrix.md",
        installPath: "references/harness-capability-matrix.md",
      },
      {
        source: "assets/templates/decomposition-plan.md",
        installPath: "assets/templates/decomposition-plan.md",
      },
      { source: "assets/templates/prd-index.md", installPath: "assets/templates/prd-index.md" },
      {
        source: "assets/templates/prd-overview.md",
        installPath: "assets/templates/prd-overview.md",
      },
      {
        source: "assets/templates/prd-architecture.md",
        installPath: "assets/templates/prd-architecture.md",
      },
      {
        source: "assets/templates/prd-subsystem.md",
        installPath: "assets/templates/prd-subsystem.md",
      },
      {
        source: "assets/templates/prd-reference.md",
        installPath: "assets/templates/prd-reference.md",
      },
      {
        source: "assets/templates/prd-risk-register.md",
        installPath: "assets/templates/prd-risk-register.md",
      },
      {
        source: "assets/templates/prd-glossary.md",
        installPath: "assets/templates/prd-glossary.md",
      },
      {
        source: "assets/templates/rebuild-backlog-index.md",
        installPath: "assets/templates/rebuild-backlog-index.md",
      },
      {
        source: "assets/templates/rebuild-backlog-phase.md",
        installPath: "assets/templates/rebuild-backlog-phase.md",
      },
    ]);
  });

  test("rejects local skill sources", () => {
    const packageRoot = mkdtempSync(path.join(os.tmpdir(), "make-docs-skill-registry-"));
    try {
      mkdirSync(packageRoot, { recursive: true });
      writeFileSync(
        path.join(packageRoot, "skill-registry.json"),
        JSON.stringify(
          {
            skills: [
              {
                name: "local-only",
                source: "local:packages/skills/local-only",
                entryPoint: "SKILL.md",
                installName: "local-only",
                required: false,
                description: "invalid",
                assets: [],
              },
            ],
          },
          null,
          2,
        ),
        "utf8",
      );

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const registry = loadSkillRegistry(packageRoot);

      expect(registry.skills).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        "Skill registry entry `local-only` must use a remote source URL; skipping.",
      );
    } finally {
      rmSync(packageRoot, { recursive: true, force: true });
    }
  });
});
