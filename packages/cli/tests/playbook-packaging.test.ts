import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  createPlaybookPackagePlan,
  runOperationsCommand,
  validateGeneratedOutputRecord,
  validateHarnessAdapterDeclaration,
  validatePackagePlan,
} from "../src/operations";
import type {
  GeneratedOutputRecord,
  HarnessPackageAdapterDeclaration,
  PlaybookPackagePlan,
} from "../src/operations";
import { cleanupTempDir, createTempDir } from "./helpers";

function writeFile(root: string, relativePath: string, content: string): string {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
  return absolutePath;
}

function playbookBody(title: string, extra: string[] = []): string {
  return [
    `# ${title}`,
    "",
    "## Purpose",
    "",
    "Use this playbook when the matching workflow goal is active.",
    "",
    "## Inputs and Authority",
    "",
    "- User request.",
    "- Repo-local Make Docs contracts.",
    ...extra,
    "",
    "## Procedure",
    "",
    "1. Resolve the playbook.",
    "2. Follow the documented steps in order.",
    "",
    "## Gates and Decisions",
    "",
    "- Stop when user review is required.",
    "",
    "## Assists",
    "",
    "- CLI, MCP, plugin, subagent, or skill assists are optional unless the playbook says otherwise.",
    "",
    "## Outputs and Handoff",
    "",
    "- Record the expected output or handoff artifact.",
    "",
    "## Validation",
    "",
    "- Confirm the workflow completed or report why it stopped.",
    "",
  ].join("\n");
}

function writePlaybook(
  root: string,
  persona: string,
  slug: string,
  stack: "build" | "run",
  title = slug,
  options: { bodyExtra?: string[]; runMetadata?: string[] } = {},
): string {
  return writeFile(
    root,
    `docs/assets/playbooks/${persona}/${slug}.md`,
    [
      "---",
      `title: ${title}`,
      "kind: playbook",
      "status: accepted",
      `persona: ${persona}`,
      `stack: ${stack}`,
      `summary: ${title} summary.`,
      ...(options.runMetadata ?? []),
      "---",
      "",
      playbookBody(title, options.bodyExtra),
    ].join("\n"),
  );
}

function validPackagePlan(overrides: Partial<PlaybookPackagePlan> = {}): PlaybookPackagePlan {
  return {
    schemaVersion: 1,
    packageId: "product-development-review",
    title: "Product Development Review",
    summary: "Package a review Playbook for a supported harness.",
    sources: [
      {
        ref: "developer/review",
        path: "docs/assets/playbooks/developer/review.md",
        persona: "developer",
        slug: "review",
        stack: "run",
        sourceDigest: "sha256:abc123",
        title: "Review",
      },
    ],
    target: {
      harness: "codex",
      outputKind: "plugin",
      surface: "native",
      scope: "project",
    },
    generatedArtifacts: [
      {
        path: ".make-docs/agentics/plugins/product-development-review/plugin.json",
        recordKind: "generated-plugin",
        outputKind: "plugin",
        surface: "native",
        sourceRefs: ["developer/review"],
      },
    ],
    deterministicDerivations: {
      sourceDigest: "sha256:abc123",
    },
    agentAssistedProposals: [],
    unresolvedDecisions: [],
    fieldProvenance: {
      packageId: "deterministic",
      title: "deterministic",
      summary: "deterministic",
      target: "user-supplied",
      sources: "deterministic",
      generatedArtifacts: "deterministic",
      support: "unresolved",
    },
    review: {
      required: false,
      status: "not-required",
    },
    support: {
      status: "unvalidated",
      evidenceRefs: [],
    },
    lifecycle: {
      backupBeforeOverwrite: true,
      uninstallDisposition: "remove-managed",
      preservesUserModifiedFiles: true,
    },
    validationRequirements: ["package-plan-schema"],
    ...overrides,
  };
}

function validGeneratedOutputRecord(
  overrides: Partial<GeneratedOutputRecord> = {},
): GeneratedOutputRecord {
  return {
    schemaVersion: 1,
    recordKind: "generated-skills-bundle",
    path: ".make-docs/agentics/skills/review/SKILL.md",
    sourceRefs: ["developer/review"],
    sourceDigests: ["sha256:abc123"],
    target: {
      harness: "claude-code",
      outputKind: "skills-bundle",
      surface: "agents-standard",
      scope: "project",
    },
    support: {
      status: "provisional",
      evidenceRefs: ["docs/prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md"],
    },
    lifecycle: {
      backupBeforeOverwrite: true,
      uninstallDisposition: "preserve-for-review",
      preservesUserModifiedFiles: true,
    },
    reviewStatus: "approved",
    ...overrides,
  };
}

function validHarnessAdapter(
  overrides: Partial<HarnessPackageAdapterDeclaration> = {},
): HarnessPackageAdapterDeclaration {
  return {
    harnessId: "future-harness",
    supportedOutputKinds: ["plugin", "skills-bundle"],
    supportedSurfaces: ["native", "agents-standard"],
    supportedScopes: ["project", "global", "export-only"],
    pathTemplates: [
      {
        surface: "native",
        scope: "project",
        template: ".future/plugins/{packageId}/",
      },
      {
        surface: "agents-standard",
        scope: "project",
        template: ".agents/skills/{skillName}/",
      },
    ],
    preconditions: [
      {
        id: "project-trusted",
        description: "Project must be trusted by the harness before standard skill locations are used.",
        required: true,
      },
    ],
    preferredExposureMode: "symlink",
    fallbackExposureMode: "copy-mirror",
    ownershipClasses: ["generated-plugin", "generated-skills-bundle", "symlink-exposure", "copy-mirror"],
    lifecycleRules: [
      {
        id: "preserve-user-modified",
        description: "Preserve modified generated output for review.",
      },
    ],
    conformanceRequirements: [
      {
        id: "package-output-smoke",
        description: "Generated package output must pass harness fixture validation.",
        required: true,
      },
    ],
    ...overrides,
  };
}

describe("playbook packaging schema foundation", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    vi.restoreAllMocks();
    for (const root of tempRoots.splice(0)) {
      cleanupTempDir(root);
    }
  });

  test("accepts serializable package plans for plugin outputs", () => {
    const plan = validatePackagePlan(validPackagePlan());

    expect(JSON.parse(JSON.stringify(plan))).toEqual(plan);
    expect(plan.target).toEqual({
      harness: "codex",
      outputKind: "plugin",
      surface: "native",
      scope: "project",
    });
  });

  test("rejects unknown output kinds", () => {
    expect(() => validatePackagePlan({
      ...validPackagePlan(),
      target: {
        harness: "codex",
        outputKind: "workflow",
        surface: "native",
        scope: "project",
      },
    })).toThrow("outputKind must be one of: plugin, skills-bundle");
  });

  test("rejects unknown surfaces", () => {
    expect(() => validatePackagePlan({
      ...validPackagePlan(),
      target: {
        harness: "codex",
        outputKind: "plugin",
        surface: "generic",
        scope: "project",
      },
    })).toThrow("surface must be one of: native, agents-standard, auto");
  });

  test("rejects generic as a harness id", () => {
    expect(() => validatePackagePlan({
      ...validPackagePlan(),
      target: {
        harness: "generic",
        outputKind: "skills-bundle",
        surface: "agents-standard",
        scope: "project",
      },
    })).toThrow("`generic` is a surface/profile concept, not a harness id");
  });

  test("requires review state when semantic proposals or unresolved decisions exist", () => {
    expect(() => validatePackagePlan({
      ...validPackagePlan({
        agentAssistedProposals: [
          {
            field: "summary",
            value: "A sharper harness-native summary.",
            reason: "The source Playbook summary is too broad for skill discovery.",
          },
        ],
        review: {
          required: false,
          status: "not-required",
        },
      }),
    })).toThrow("requires semantic or decision review");

    expect(validatePackagePlan(validPackagePlan({
      agentAssistedProposals: [
        {
          field: "summary",
          value: "A sharper harness-native summary.",
          reason: "The source Playbook summary is too broad for skill discovery.",
        },
      ],
      review: {
        required: true,
        status: "approved",
        reviewedBy: "maintainer",
      },
    })).review.status).toBe("approved");
  });

  test("distinguishes generated-output ownership classes", () => {
    const record = validateGeneratedOutputRecord(validGeneratedOutputRecord());

    expect(record.recordKind).toBe("generated-skills-bundle");
    expect(record.target?.surface).toBe("agents-standard");

    expect(() => validateGeneratedOutputRecord(validGeneratedOutputRecord({
      recordKind: "managed-file" as GeneratedOutputRecord["recordKind"],
    }))).toThrow("recordKind must be one of");
  });

  test("validates adapter declarations and future harness surface additivity", () => {
    const adapter = validateHarnessAdapterDeclaration(validHarnessAdapter());

    expect(adapter.harnessId).toBe("future-harness");
    expect(adapter.supportedOutputKinds).toEqual(["plugin", "skills-bundle"]);
    expect(adapter.supportedSurfaces).toContain("agents-standard");
    expect(adapter.pathTemplates.map((template) => template.surface)).toEqual([
      "native",
      "agents-standard",
    ]);
  });

  test("rejects adapter path templates for unsupported surfaces", () => {
    expect(() => validateHarnessAdapterDeclaration(validHarnessAdapter({
      supportedSurfaces: ["native"],
    }))).toThrow("unsupported surface `agents-standard`");
  });

  test("creates deterministic single-Playbook package plans without writes", () => {
    const root = createTempDir("make-docs-package-plan-");
    tempRoots.push(root);
    writeFile(root, ".make-docs/contracts/system/example.md", "# Example\n");
    writePlaybook(root, "user", "run-stack", "run", "Run Stack", {
      bodyExtra: ["- Load [Example](../../../../.make-docs/contracts/system/example.md)."],
      runMetadata: [
        "run:",
        "  output_surfaces:",
        "    - docs/assets/archive/history",
      ],
    });

    const first = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/run-stack"],
      requestedStack: "run",
      target: {
        harness: "codex",
        outputKind: "plugin",
        surface: "native",
        scope: "project",
      },
      supportEvidenceRefs: ["docs/prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md"],
    });
    const second = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["Run Stack"],
      requestedStack: "run",
      target: {
        harness: "codex",
        outputKind: "plugin",
        surface: "native",
        scope: "project",
      },
      supportEvidenceRefs: ["docs/prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md"],
    });

    expect(second.plan).toEqual(first.plan);
    expect(first.status).toBe("ready");
    expect(first.writesPlanned).toBe(false);
    expect(first.plan.sources[0]).toMatchObject({
      ref: "user/run-stack",
      sourceDigest: expect.stringMatching(/^sha256:/),
    });
    expect(first.plan.generatedArtifacts).toEqual([
      expect.objectContaining({
        path: ".make-docs/agentics/plugins/run-stack/plugin.json",
        recordKind: "generated-plugin",
      }),
    ]);
    expect(first.lines).toContain("Writes planned: no");
  });

  test("creates multi-Playbook skills-bundle plans with semantic review", () => {
    const root = createTempDir("make-docs-package-plan-");
    tempRoots.push(root);
    writePlaybook(root, "user", "run-stack", "run", "Run Stack");
    writePlaybook(root, "developer", "review-stack", "run", "Review Stack");

    const result = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/run-stack", "developer/review-stack"],
      requestedStack: "run",
      target: {
        harness: "claude-code",
        outputKind: "skills-bundle",
        surface: "agents-standard",
        scope: "project",
      },
    });

    expect(result.status).toBe("review-required");
    expect(result.plan.agentAssistedProposals).toEqual([
      expect.objectContaining({
        field: "summary",
      }),
    ]);
    expect(result.plan.generatedArtifacts).toEqual([
      expect.objectContaining({
        path: ".make-docs/agentics/skills/run-stack-review-stack/SKILL.md",
        recordKind: "generated-skills-bundle",
      }),
    ]);
    expect(result.plan.fieldProvenance.summary).toBe("agent-proposed");
  });

  test("fails closed for broken relative Playbook links before writing", () => {
    const root = createTempDir("make-docs-package-plan-");
    tempRoots.push(root);
    writePlaybook(root, "user", "broken-link", "run", "Broken Link", {
      bodyExtra: ["- Load [Missing](./missing.md)."],
    });

    const result = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/broken-link"],
      target: {
        harness: "codex",
        outputKind: "plugin",
        surface: "native",
        scope: "project",
      },
    });

    expect(result.status).toBe("manual-review-required");
    expect(result.stops).toEqual([
      expect.objectContaining({
        reason: "unresolved-target",
        path: "docs/assets/playbooks/user/missing.md",
      }),
      expect.objectContaining({
        reason: "missing-support-evidence",
      }),
    ]);
  });

  test("fails closed for ambiguous source refs and non-interactive review stops", () => {
    const root = createTempDir("make-docs-package-plan-");
    tempRoots.push(root);
    writePlaybook(root, "user", "review", "run", "Review");
    writePlaybook(root, "developer", "review", "build", "Review");

    expect(() => createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["review"],
      target: {
        harness: "codex",
        outputKind: "plugin",
        surface: "native",
        scope: "project",
      },
    })).toThrow("No valid source Playbooks resolved");

    expect(() => createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/review"],
      target: {
        harness: "codex",
        outputKind: "plugin",
        surface: "auto",
        scope: "project",
      },
      nonInteractive: true,
    })).toThrow("Package planning stopped before writes");
  });

  test("routes user-modified generated outputs to review", () => {
    const root = createTempDir("make-docs-package-plan-");
    tempRoots.push(root);
    writePlaybook(root, "user", "run-stack", "run", "Run Stack");

    const result = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/run-stack"],
      target: {
        harness: "codex",
        outputKind: "plugin",
        surface: "native",
        scope: "project",
      },
      existingGeneratedOutputs: [
        {
          path: ".make-docs/agentics/plugins/run-stack/plugin.json",
          state: "modified-managed",
        },
      ],
    });

    expect(result.status).toBe("review-required");
    expect(result.stops).toEqual(expect.arrayContaining([
      expect.objectContaining({
        reason: "ownership-review-required",
        path: ".make-docs/agentics/plugins/run-stack/plugin.json",
      }),
    ]));
  });

  test("exposes package-plan dry-run output through the CLI operation", async () => {
    const root = createTempDir("make-docs-package-plan-");
    tempRoots.push(root);
    writePlaybook(root, "user", "run-stack", "run", "Run Stack");
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await runOperationsCommand([
      "playbook-package-plan",
      "--repo-root",
      root,
      "--source",
      "user/run-stack",
      "--harness",
      "codex",
      "--output-kind",
      "plugin",
      "--surface",
      "native",
      "--scope",
      "project",
      "--support-evidence-ref",
      "docs/prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md",
    ]);

    const output = writeSpy.mock.calls.map((call) => String(call[0])).join("");
    const parsed = JSON.parse(output) as ReturnType<typeof createPlaybookPackagePlan>;
    expect(parsed.plan.packageId).toBe("run-stack");
    expect(parsed.writesPlanned).toBe(false);
    expect(parsed.lines).toContain("Writes planned: no");
  });
});
