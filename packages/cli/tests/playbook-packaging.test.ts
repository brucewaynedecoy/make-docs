import { describe, expect, test } from "vitest";
import {
  validateGeneratedOutputRecord,
  validateHarnessAdapterDeclaration,
  validatePackagePlan,
} from "../src/operations";
import type {
  GeneratedOutputRecord,
  HarnessPackageAdapterDeclaration,
  PlaybookPackagePlan,
} from "../src/operations";

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
});
