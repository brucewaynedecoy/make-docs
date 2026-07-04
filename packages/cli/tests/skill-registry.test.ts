import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  getSkillRegistryNames,
  loadSkillRegistry,
  type SkillRegistry,
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

    const schema = JSON.parse(
      readFileSync(path.join(PACKAGE_ROOT, registry.$schema!), "utf8"),
    ) as {
      properties?: {
        manifestId?: unknown;
        purposes?: unknown;
        sourcePolicy?: unknown;
      };
      $defs?: {
        skill?: {
          properties?: Record<string, unknown>;
        };
      };
    };
    expect(schema.properties?.manifestId).toBeDefined();
    expect(schema.properties?.purposes).toBeDefined();
    expect(schema.properties?.sourcePolicy).toBeDefined();
    expect(schema.$defs?.skill?.properties).not.toHaveProperty("required");
  });

  test("loads the packaged registry with recommended skills only", () => {
    const registry = loadSkillRegistry(PACKAGE_ROOT);

    expect(registry.schemaVersion).toBe(1);
    expect(registry.manifestId).toBe("make-docs.first-party");
    expect(registry.sourcePolicy.kind).toBe("first-party");
    expect(registry.purposes.map((purpose) => purpose.id)).toEqual([
      "archive-management",
      "codebase-decomposition",
      "documentation-maintenance",
      "lifecycle-closeout",
      "workflow-execution",
      "plan-creation",
      "migration-support",
    ]);
    expect(registry.skills.map((skill) => skill.name)).toEqual([
      "archive-docs",
      "cleanup-docs",
      "decompose-codebase",
    ]);
    expect(getSkillRegistryNames(registry)).toEqual([
      "archive-docs",
      "cleanup-docs",
      "decompose-codebase",
    ]);
    expect(
      registry.skills.every((skill) => !("required" in skill)),
    ).toBe(true);
    expect(
      registry.skills.every(
        (skill) =>
          skill.displayName &&
          skill.purposes.length > 0 &&
          skill.supportedHarnesses.includes("codex") &&
          skill.supportedHarnesses.includes("claude-code") &&
          skill.provenance.kind === "first-party",
      ),
    ).toBe(true);
  });

  test("withdraws the D-020 lifecycle skills from the shipped registry", () => {
    const registry = loadSkillRegistry(PACKAGE_ROOT);
    const withdrawnSkills = [
      "closeout-commit",
      "closeout-phase",
      "work-on-phase",
      "work-on-wave",
    ];

    for (const withdrawnSkill of withdrawnSkills) {
      expect(
        registry.skills.find((skill) => skill.name === withdrawnSkill),
      ).toBeUndefined();
    }
  });

  test("keeps the canonical purpose registry intact after the lifecycle skill withdrawal", () => {
    const registry = loadSkillRegistry(PACKAGE_ROOT);
    const skillPurposeIds = new Set(
      registry.skills.flatMap((skill) => skill.purposes),
    );

    // The withdrawn lifecycle skills were the only occupants of these two
    // canonical purposes; the purposes remain declared (PRD 27 taxonomy) but
    // ship no skills until the Q-022 pipeline regenerates them.
    expect(registry.purposes.map((purpose) => purpose.id)).toContain(
      "lifecycle-closeout",
    );
    expect(registry.purposes.map((purpose) => purpose.id)).toContain(
      "workflow-execution",
    );
    expect(skillPurposeIds.has("lifecycle-closeout")).toBe(false);
    expect(skillPurposeIds.has("workflow-execution")).toBe(false);
  });

  test("declares the cleanup docs skill asset surface", () => {
    const registry = loadSkillRegistry(PACKAGE_ROOT);
    const cleanupSkill = registry.skills.find(
      (skill) => skill.name === "cleanup-docs",
    );

    expect(cleanupSkill?.assets).toEqual([
      { source: "agents/openai.yaml", installPath: "agents/openai.yaml" },
      {
        source: "scripts/check_markdown_style.py",
        installPath: "scripts/check_markdown_style.py",
      },
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

  test("rejects local skill sources in first-party manifests", () => {
    const packageRoot = mkdtempSync(path.join(os.tmpdir(), "make-docs-skill-registry-"));
    try {
      mkdirSync(packageRoot, { recursive: true });
      writeFileSync(
        path.join(packageRoot, "skill-registry.json"),
        JSON.stringify(
          createManifest({
            skills: [
              {
                name: "local-only",
                displayName: "Local only",
                source: "local:packages/skills/local-only",
                entryPoint: "SKILL.md",
                installName: "local-only",
                description: "invalid",
                purposes: ["documentation-maintenance"],
                supportedHarnesses: ["codex"],
                provenance: {
                  kind: "first-party",
                  label: "make-docs first-party skill",
                },
                assets: [],
              },
            ],
          }),
          null,
          2,
        ),
        "utf8",
      );

      expect(() => loadSkillRegistry(packageRoot)).toThrow(
        "must use a remote source URL unless the manifest source policy is local",
      );
    } finally {
      rmSync(packageRoot, { recursive: true, force: true });
    }
  });

  test("rejects duplicate purpose ids", () => {
    expect(() =>
      loadRegistryFromManifest(
        createManifest({
          purposes: [
            createPurpose({ id: "documentation-maintenance" }),
            createPurpose({ id: "documentation-maintenance" }),
          ],
        }),
      ),
    ).toThrow("duplicate purpose id `documentation-maintenance`");
  });

  test("rejects unnamespaced third-party purpose ids", () => {
    expect(() =>
      loadRegistryFromManifest(
        createManifest({
          sourcePolicy: {
            kind: "local",
            label: "Local test registry",
          },
          purposes: [
            createPurpose({
              id: "release-readiness",
              provenance: {
                kind: "local",
                label: "Local test purpose",
              },
            }),
          ],
          skills: [
            createSkill({
              purposes: ["release-readiness"],
              provenance: {
                kind: "local",
                label: "Local test skill",
              },
              source: "local:release-readiness",
            }),
          ],
        }),
      ),
    ).toThrow("third-party purpose id `release-readiness` must be namespaced");
  });

  test("rejects first-party purpose collisions without first-party provenance", () => {
    expect(() =>
      loadRegistryFromManifest(
        createManifest({
          sourcePolicy: {
            kind: "local",
            label: "Local test registry",
          },
          purposes: [
            createPurpose({
              id: "documentation-maintenance",
              provenance: {
                kind: "local",
                label: "Local test purpose",
              },
            }),
          ],
          skills: [
            createSkill({
              purposes: ["documentation-maintenance"],
              provenance: {
                kind: "local",
                label: "Local test skill",
              },
              source: "local:docs-cleanup",
            }),
          ],
        }),
      ),
    ).toThrow(
      "purpose `documentation-maintenance` collides with a first-party purpose id without first-party provenance",
    );
  });

  test("rejects skill entries that reference missing purposes", () => {
    expect(() =>
      loadRegistryFromManifest(
        createManifest({
          skills: [createSkill({ purposes: ["missing-purpose"] })],
        }),
      ),
    ).toThrow("skill `test-skill` references missing purpose `missing-purpose`");
  });

  test("rejects missing source policy and provenance metadata", () => {
    const manifest = createManifest();
    delete (manifest as { sourcePolicy?: unknown }).sourcePolicy;
    delete (manifest.skills[0] as { provenance?: unknown }).provenance;

    expect(() => loadRegistryFromManifest(manifest)).toThrow(
      "manifest is missing required `sourcePolicy` metadata",
    );
    expect(() => loadRegistryFromManifest(manifest)).toThrow(
      "skill `test-skill` provenance is missing required provenance metadata",
    );
  });
});

function loadRegistryFromManifest(manifest: SkillRegistry): SkillRegistry {
  const packageRoot = mkdtempSync(path.join(os.tmpdir(), "make-docs-skill-registry-"));
  try {
    mkdirSync(packageRoot, { recursive: true });
    writeFileSync(
      path.join(packageRoot, "skill-registry.json"),
      JSON.stringify(manifest, null, 2),
      "utf8",
    );
    return loadSkillRegistry(packageRoot);
  } finally {
    rmSync(packageRoot, { recursive: true, force: true });
  }
}

function createManifest(
  overrides: Partial<SkillRegistry> = {},
): SkillRegistry {
  return {
    schemaVersion: 1,
    manifestId: "make-docs.first-party",
    displayName: "Test registry",
    description: "Test manifest",
    sourcePolicy: {
      kind: "first-party",
      label: "First-party test registry",
      allowRemoteSkillSources: true,
    },
    purposes: [createPurpose()],
    skills: [createSkill()],
    ...overrides,
  };
}

function createPurpose(
  overrides: Partial<SkillRegistry["purposes"][number]> = {},
): SkillRegistry["purposes"][number] {
  return {
    id: "documentation-maintenance",
    label: "Documentation maintenance",
    description: "Test documentation maintenance purpose.",
    order: 10,
    provenance: {
      kind: "first-party",
      label: "make-docs canonical purpose",
      manifestId: "make-docs.first-party",
    },
    ...overrides,
  };
}

function createSkill(
  overrides: Partial<SkillRegistry["skills"][number]> = {},
): SkillRegistry["skills"][number] {
  return {
    name: "test-skill",
    displayName: "Test skill",
    source: "https://github.com/brucewaynedecoy/make-docs/tree/main/packages/skills/test-skill",
    entryPoint: "SKILL.md",
    installName: "test-skill",
    description: "Test skill.",
    purposes: ["documentation-maintenance"],
    supportedHarnesses: ["codex", "claude-code"],
    provenance: {
      kind: "first-party",
      label: "make-docs first-party skill",
      repository: "brucewaynedecoy/make-docs",
      ref: "main",
    },
    assets: [],
    ...overrides,
  };
}
