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
