import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  buildPackageDistributable,
  canHarnessHostPrimitive,
  CLAUDE_CODE_HARNESS_CAPABILITY_DESCRIPTOR,
  CODEX_HARNESS_CAPABILITY_DESCRIPTOR,
  createPlaybookPackagePlan,
  deriveAdapterPathTemplates,
  deriveImpliedAgentics,
  evaluateHarnessCapabilities,
  FIRST_PARTY_HARNESS_CAPABILITY_DESCRIPTORS,
  FIRST_PARTY_HARNESS_PACKAGE_ADAPTERS,
  FIRST_PARTY_HARNESS_REGISTRY_ENTRIES,
  FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR,
  listHarnessRegistryEntries,
  PI_HARNESS_CAPABILITY_DESCRIPTOR,
  profileForOutputKind,
  projectPlaybookToSkill,
  resolveRuntimeCapabilityRecordKey,
  selectPackageContainer,
  validateHarnessCapabilityDescriptor,
  validatePackagePlan,
} from "../src/operations";
import type {
  HarnessCapabilityDescriptor,
  SourcePlaybookRef,
} from "../src/operations";
import { parseAndValidatePlaybook } from "../src/playbook";
import { cleanupTempDir, createTempDir } from "./helpers";

const SUPPORT_EVIDENCE_REF = "docs/prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md";

const ALL_DESCRIPTORS: HarnessCapabilityDescriptor[] = [
  ...FIRST_PARTY_HARNESS_CAPABILITY_DESCRIPTORS,
  FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR,
];

function writeFile(root: string, relativePath: string, content: string): string {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
  return absolutePath;
}

function workflowPlaybookDocument(title: string, options: {
  persona?: string;
  workflowSteps?: string[];
  dependencyRows?: string[];
} = {}): string {
  const persona = options.persona ?? "user";
  const steps = options.workflowSteps ?? [
    "  - id: guard-tools",
    "    title: Guard tool calls",
    "    executor: agent",
    "    role: check",
    "    activation: event-bound",
    "    event: on-pre-tool-use",
    "    uses: [context-server]",
    "    instructions: Guard the tool call.",
    "  - id: wrap-up",
    "    title: Wrap up",
    "    executor: agent",
    "    role: activity",
    "    activation: sequential",
    "    instructions: Summarize the run.",
  ];
  const dependencyRows = options.dependencyRows ?? [
    "| context-server | mcp | preferred | npm install context-server | guard-tools | continue without extra context |",
  ];
  return [
    "---",
    `title: ${title}`,
    "kind: playbook",
    "status: accepted",
    `persona: ${persona}`,
    "stack: run",
    `summary: ${title} summary.`,
    "schemaVersion: make-docs.playbook.v1",
    "workflowSchemaVersion: make-docs.workflow.v1",
    "---",
    "",
    `# ${title}`,
    "",
    "## Purpose",
    "",
    "Exercise capability-descriptor packaging.",
    "",
    "## When To Use",
    "",
    "Use in packaging capability tests.",
    "",
    "## Inputs And Authority",
    "",
    "Repository contracts.",
    "",
    "## Dependencies",
    "",
    "| ID | Kind | Requirement | Source | Used By | Fallback |",
    "| --- | --- | --- | --- | --- | --- |",
    ...dependencyRows,
    "",
    "## Workflow Contract",
    "",
    "```playbook",
    "workflow:",
    "  id: capability-fixture",
    "  state_model: make-docs.workflow-state.v1",
    "  routing: linear",
    "steps:",
    ...steps,
    "```",
    "",
    "## Step Guidance",
    "",
    "Follow the steps in order.",
    "",
    "## Gates And Decisions",
    "",
    "Stop on unresolved review.",
    "",
    "## Outputs And Handoff",
    "",
    "A run summary.",
    "",
    "## Validation",
    "",
    "Confirm the workflow completed.",
    "",
    "## Packaging Notes",
    "",
    "No packaging hints.",
    "",
  ].join("\n");
}

function writeWorkflowPlaybook(root: string, persona: string, slug: string, title: string): string {
  return writeFile(
    root,
    `docs/assets/playbooks/${persona}/${slug}.playbook.md`,
    workflowPlaybookDocument(title, { persona }),
  );
}

function parseFixtureModel(title: string, options: Parameters<typeof workflowPlaybookDocument>[1] = {}) {
  return parseAndValidatePlaybook({
    sourcePath: "docs/assets/playbooks/user/capability-fixture.playbook.md",
    source: workflowPlaybookDocument(title, options),
  }).model;
}

function sourceRef(overrides: Partial<SourcePlaybookRef> = {}): SourcePlaybookRef {
  return {
    ref: "user/run-stack",
    path: "docs/assets/playbooks/user/run-stack.md",
    persona: "user",
    slug: "run-stack",
    stack: "run",
    sourceDigest: "sha256:abc123",
    title: "Run Stack",
    ...overrides,
  };
}

describe("harness capability descriptors and shared registry", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    while (tempRoots.length > 0) {
      cleanupTempDir(tempRoots.pop()!);
    }
  });

  test("every first-party harness and the fixture carry a structurally complete descriptor", () => {
    expect(ALL_DESCRIPTORS.map((descriptor) => descriptor.harnessId)).toEqual([
      "codex",
      "claude-code",
      "pi",
      "future-harness",
    ]);
    for (const descriptor of ALL_DESCRIPTORS) {
      expect(validateHarnessCapabilityDescriptor(descriptor)).toBe(descriptor);
      expect(descriptor.supportedPrimitives).toContain("skill");
      expect(descriptor.containers.length).toBeGreaterThan(0);
      for (const container of descriptor.containers) {
        expect(container.layout.placements.length).toBeGreaterThan(0);
        expect(container.hostedPrimitives).toContain("skill");
      }
      expect(descriptor.registration.autoRegister).toBe(false);
      expect(descriptor.registration.description.length).toBeGreaterThan(0);
      expect(descriptor.supportedExposureModes.length).toBeGreaterThan(0);
      expect(descriptor.preconditions.length).toBeGreaterThan(0);
      // Every descriptor carries a verification reference and status
      // (R-ADAPT-1); no verification status is recognition evidence — that
      // bar is owned by the W18 R9 conformance lineage (R-TEST-5).
      expect(["provisional", "verified"]).toContain(descriptor.verification.status);
      expect(descriptor.verification.reference.length).toBeGreaterThan(0);
    }
    // Phase 3 statuses reflect exactly what the design confirmed: the Codex
    // contract is verified (R-ADAPT-2), while Claude Code awaits review
    // against the actual contract (R-ADAPT-3) and every Pi path is inferred
    // (R-ADAPT-4).
    expect(CODEX_HARNESS_CAPABILITY_DESCRIPTOR.verification.status).toBe("verified");
    expect(CLAUDE_CODE_HARNESS_CAPABILITY_DESCRIPTOR.verification.status).toBe("provisional");
    expect(PI_HARNESS_CAPABILITY_DESCRIPTOR.verification.status).toBe("provisional");
    expect(FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR.verification.status).toBe("provisional");
  });

  test("descriptor validation rejects structural violations", () => {
    const base = FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR;
    expect(() => validateHarnessCapabilityDescriptor({
      ...base,
      supportedPrimitives: ["plugin"] as never,
    })).toThrow("must support at least the `skill` primitive");
    expect(() => validateHarnessCapabilityDescriptor({
      ...base,
      containers: [],
    })).toThrow("at least one distributable container");
    expect(() => validateHarnessCapabilityDescriptor({
      ...base,
      lifecycleEventMap: {
        "on-pre-tool-use": { hookPoint: "PreToolUse", description: "Guard." },
      },
    })).toThrow("does not declare the `hook` primitive");
    expect(() => validateHarnessCapabilityDescriptor({
      ...base,
      containers: [
        base.containers[0]!,
        { ...base.containers[0]!, containerId: "future-plugin-copy" },
      ],
    })).toThrow("duplicate native placement");
    expect(() => validateHarnessCapabilityDescriptor({
      ...base,
      registration: { ...base.registration, autoRegister: true as never },
    })).toThrow("must not auto-register");
    expect(() => validateHarnessCapabilityDescriptor({
      ...base,
      harnessId: "generic",
    })).toThrow("not a harness id");
  });

  test("descriptors are the carrier of adapter paths and manifest shapes", () => {
    // Every first-party adapter derives its path templates from its
    // descriptor; nothing declares harness paths outside the descriptor
    // (R-CAP-2, superseding the assumed W18 R5 `path templates`).
    const descriptorsById = new Map(
      ALL_DESCRIPTORS.map((descriptor) => [descriptor.harnessId, descriptor]),
    );
    for (const adapter of FIRST_PARTY_HARNESS_PACKAGE_ADAPTERS) {
      const descriptor = descriptorsById.get(adapter.harnessId)!;
      expect(adapter.pathTemplates).toEqual(deriveAdapterPathTemplates(descriptor));
      expect(adapter.preconditions).toEqual(descriptor.preconditions);
      expect(adapter.preferredExposureMode).toBe(descriptor.preferredExposureMode);
      expect(adapter.fallbackExposureMode).toBe(descriptor.fallbackExposureMode);
    }
    // The verified Codex container knowledge lives on the descriptor for the
    // Phase 2 writer and Phase 3 contract correction to consume (R-ADAPT-2).
    const codexPlugin = CODEX_HARNESS_CAPABILITY_DESCRIPTOR.containers.find(
      (container) => container.profile === "native",
    )!;
    expect(codexPlugin.layout.manifestFilename).toBe(".codex-plugin/plugin.json");
    expect(codexPlugin.layout.registrationFiles).toContain(".agents/plugins/marketplace.json");
  });

  test("one registry answers the packaging-time capability question", () => {
    expect(listHarnessRegistryEntries().map((entry) => entry.harnessId)).toEqual([
      "codex",
      "claude-code",
      "pi",
    ]);
    expect(canHarnessHostPrimitive({ harnessId: "claude-code", primitive: "hook" })).toEqual({
      harnessKnown: true,
      supported: true,
    });
    expect(canHarnessHostPrimitive({ harnessId: "codex", primitive: "hook" })).toEqual({
      harnessKnown: true,
      supported: false,
    });
    expect(canHarnessHostPrimitive({ harnessId: "pi", primitive: "extension" })).toEqual({
      harnessKnown: true,
      supported: true,
    });
    expect(canHarnessHostPrimitive({ harnessId: "pi", primitive: "hook" })).toEqual({
      harnessKnown: true,
      supported: false,
    });
    expect(canHarnessHostPrimitive({ harnessId: "unknown-harness", primitive: "skill" })).toEqual({
      harnessKnown: false,
      supported: false,
    });
  });

  test("the same registry links harness identity to the run-time capability record", () => {
    // The registry serves identity only; the run-time record and evaluation
    // semantics stay owned by the W18 R7 lineage (R-CAP-1, R-SCOPE-1).
    for (const entry of FIRST_PARTY_HARNESS_REGISTRY_ENTRIES) {
      expect(entry.runtimeCapability.recordKey).toBe(entry.harnessId);
    }
    expect(resolveRuntimeCapabilityRecordKey({ harness: "codex" })).toBe("codex");
    expect(resolveRuntimeCapabilityRecordKey({ harness: "some-unregistered" })).toBe(
      "some-unregistered",
    );

    const root = createTempDir("make-docs-harness-registry-runtime-");
    tempRoots.push(root);
    execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
    writeFile(
      root,
      ".make-docs/config.yaml",
      [
        "harnessCapabilities:",
        "  - harness: codex",
        "    reviewStatus: reviewed",
        "    capabilities:",
        "      goal_managed_execution: true",
        "",
      ].join("\n"),
    );
    const evaluation = evaluateHarnessCapabilities({
      repoRoot: root,
      harness: "codex",
      requiredCapabilities: ["goal_managed_execution"],
    });
    expect(evaluation.record?.harness).toBe("codex");
    expect(evaluation.status).toBe("ready");
  });
});

describe("two-granularities distributable model", () => {
  test("one Playbook projects to exactly one skill and bundles stay one distributable", () => {
    const single = buildPackageDistributable({
      harnessId: "codex",
      descriptor: CODEX_HARNESS_CAPABILITY_DESCRIPTOR,
      outputKind: "plugin",
      skills: [projectPlaybookToSkill(sourceRef())],
      impliedAgentics: [],
    });
    expect(single.skills).toEqual([
      expect.objectContaining({ skillId: "run-stack", sourceRef: "user/run-stack" }),
    ]);
    expect(single.bundle).toBe(false);

    const bundle = buildPackageDistributable({
      harnessId: "codex",
      descriptor: CODEX_HARNESS_CAPABILITY_DESCRIPTOR,
      outputKind: "plugin",
      skills: [
        projectPlaybookToSkill(sourceRef()),
        projectPlaybookToSkill(sourceRef({
          ref: "developer/review-stack",
          path: "docs/assets/playbooks/developer/review-stack.md",
          persona: "developer",
          slug: "review-stack",
          title: "Review Stack",
        })),
      ],
      impliedAgentics: [],
    });
    expect(bundle.bundle).toBe(true);
    expect(bundle.skills.map((skill) => skill.skillId)).toEqual(["run-stack", "review-stack"]);
    expect(bundle.containerSelection.containerId).toBe("codex-plugin");
  });

  test("colliding skill slugs across personas gain deterministic persona qualifiers", () => {
    const bundle = buildPackageDistributable({
      harnessId: "codex",
      descriptor: CODEX_HARNESS_CAPABILITY_DESCRIPTOR,
      outputKind: "skills-bundle",
      skills: [
        projectPlaybookToSkill(sourceRef({ ref: "user/review", slug: "review" })),
        projectPlaybookToSkill(sourceRef({ ref: "developer/review", persona: "developer", slug: "review" })),
      ],
      impliedAgentics: [],
    });
    expect(bundle.skills.map((skill) => skill.skillId)).toEqual([
      "user-review",
      "developer-review",
    ]);
  });

  test("outputKind maps to profiles and each harness realizes its own richest native container", () => {
    expect(profileForOutputKind("plugin")).toBe("native");
    expect(profileForOutputKind("skills-bundle")).toBe("portable");

    const codex = selectPackageContainer({
      descriptor: CODEX_HARNESS_CAPABILITY_DESCRIPTOR,
      outputKind: "plugin",
      impliedAgentics: [],
    });
    expect(codex.containerKind).toBe("plugin");

    // `plugin` is not hardcoded as the only native container: Pi's richest
    // native container is an extension (R-CAP-3, R-ADAPT-4).
    const pi = selectPackageContainer({
      descriptor: PI_HARNESS_CAPABILITY_DESCRIPTOR,
      outputKind: "plugin",
      impliedAgentics: [],
    });
    expect(pi.containerKind).toBe("extension");
    expect(pi.containerId).toBe("pi-extension");

    const portable = selectPackageContainer({
      descriptor: CLAUDE_CODE_HARNESS_CAPABILITY_DESCRIPTOR,
      outputKind: "skills-bundle",
      impliedAgentics: [],
    });
    expect(portable.profile).toBe("portable");
    expect(portable.containerKind).toBe("skills-directory");
  });

  test("container selection picks the richest container for the chosen profile", () => {
    const descriptor: HarnessCapabilityDescriptor = validateHarnessCapabilityDescriptor({
      ...FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR,
      harnessId: "two-native",
      containers: [
        {
          ...FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR.containers[0]!,
          containerId: "lean-plugin",
          richness: 1,
        },
        {
          ...FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR.containers[0]!,
          containerId: "rich-plugin",
          richness: 5,
          layout: {
            ...FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR.containers[0]!.layout,
            placements: [
              { surface: "native", scope: "global", pathTemplate: "<user-home>/.two/{packageId}" },
            ],
          },
        },
        FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR.containers[1]!,
      ],
    });
    const selection = selectPackageContainer({
      descriptor,
      outputKind: "plugin",
      impliedAgentics: [],
    });
    expect(selection.containerId).toBe("rich-plugin");
  });

  test("a profile without a container fails closed as an unsupported output kind", () => {
    const nativeOnly = validateHarnessCapabilityDescriptor({
      ...FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR,
      harnessId: "native-only",
      containers: [FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR.containers[0]!],
    });
    const selection = selectPackageContainer({
      descriptor: nativeOnly,
      outputKind: "skills-bundle",
      impliedAgentics: [],
    });
    expect(selection.status).toBe("unsupported");
    expect(selection.stops).toEqual([
      expect.objectContaining({ reason: "unsupported-output-kind" }),
    ]);
  });
});

describe("implied agentics, container mapping, and declared degradation", () => {
  test("implied agentics derive from the parsed W18 R6 model's steps and dependencies", () => {
    const model = parseFixtureModel("Capability Fixture");
    const agentics = deriveImpliedAgentics({ model, sourceRef: "user/capability-fixture" });
    expect(agentics).toEqual([
      expect.objectContaining({
        primitive: "hook",
        stepId: "guard-tools",
        event: "on-pre-tool-use",
      }),
      expect.objectContaining({ primitive: "mcp-server", stepId: null }),
    ]);
  });

  test("a Playbook without a workflow contract implies no step agentics", () => {
    const model = parseAndValidatePlaybook({
      sourcePath: "docs/assets/playbooks/user/legacy.md",
      source: "# Legacy\n\n## Purpose\n\nLegacy shape without a workflow block.\n",
    }).model;
    expect(deriveImpliedAgentics({ model, sourceRef: "user/legacy" })).toEqual([]);
  });

  test("event-bound steps lower to hook points only where the descriptor declares support", () => {
    const model = parseFixtureModel("Capability Fixture");
    const agentics = deriveImpliedAgentics({ model, sourceRef: "user/capability-fixture" });

    const claude = selectPackageContainer({
      descriptor: CLAUDE_CODE_HARNESS_CAPABILITY_DESCRIPTOR,
      outputKind: "plugin",
      impliedAgentics: agentics,
    });
    expect(claude.status).toBe("ready");
    expect(claude.lowerings).toEqual([
      expect.objectContaining({
        disposition: "native",
        hookPoint: "PreToolUse",
      }),
      expect.objectContaining({ disposition: "native", hookPoint: null }),
    ]);

    // Claude Code supports hooks but declares no hook point for git events;
    // the unmapped event degrades or fails closed per R-CAP-4 (R-CAP-5).
    const gitEventModel = parseFixtureModel("Git Event Fixture", {
      workflowSteps: [
        "  - id: guard-commit",
        "    title: Guard commits",
        "    executor: agent",
        "    role: check",
        "    activation: event-bound",
        "    event: on-pre-commit",
        "    instructions: Guard the commit.",
      ],
      dependencyRows: ["| conventions | reference | preferred | contracts | guard-commit | continue |"],
    });
    const gitAgentics = deriveImpliedAgentics({ model: gitEventModel, sourceRef: "user/git-event" });
    const unmapped = selectPackageContainer({
      descriptor: CLAUDE_CODE_HARNESS_CAPABILITY_DESCRIPTOR,
      outputKind: "plugin",
      impliedAgentics: gitAgentics,
      policy: "degrade",
    });
    expect(unmapped.status).toBe("degraded");
    expect(unmapped.lowerings[0]).toMatchObject({
      disposition: "degraded-skill-instruction",
      hookPoint: null,
    });
    expect(unmapped.declaredDegradations[0]).toContain("on-pre-commit");
  });

  test("unsupported primitives fail closed by default with declared unsupported-surface stops", () => {
    const model = parseFixtureModel("Capability Fixture");
    const agentics = deriveImpliedAgentics({ model, sourceRef: "user/capability-fixture" });
    const selection = selectPackageContainer({
      descriptor: FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR,
      outputKind: "plugin",
      impliedAgentics: agentics,
    });
    expect(selection.policy).toBe("fail-closed");
    expect(selection.status).toBe("unsupported");
    expect(selection.stops).toEqual([
      expect.objectContaining({ reason: "unsupported-surface" }),
      expect.objectContaining({ reason: "unsupported-surface" }),
    ]);
    // Never silent: every lowering carries its declaration (R-CAP-4).
    expect(selection.lowerings.every((lowering) => lowering.declaration.length > 0)).toBe(true);
  });

  test("the degrade policy emits documented manual steps and skill instructions instead of stops", () => {
    const model = parseFixtureModel("Capability Fixture");
    const agentics = deriveImpliedAgentics({ model, sourceRef: "user/capability-fixture" });
    const selection = selectPackageContainer({
      descriptor: FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR,
      outputKind: "plugin",
      impliedAgentics: agentics,
      policy: "degrade",
    });
    expect(selection.status).toBe("degraded");
    expect(selection.stops).toEqual([]);
    expect(selection.lowerings.map((lowering) => lowering.disposition)).toEqual([
      "degraded-skill-instruction",
      "degraded-manual-step",
    ]);
    expect(selection.declaredDegradations).toHaveLength(2);
  });
});

describe("planner integration for the distributable model", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    while (tempRoots.length > 0) {
      cleanupTempDir(tempRoots.pop()!);
    }
  });

  test("plans fail closed on harnesses lacking implied agentics under the default policy", () => {
    const root = createTempDir("make-docs-capability-plan-");
    tempRoots.push(root);
    writeWorkflowPlaybook(root, "user", "hooked-stack", "Hooked Stack");

    const result = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/hooked-stack"],
      target: { harness: "codex", outputKind: "plugin", surface: "native", scope: "project" },
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
    });

    expect(result.stops).toEqual(expect.arrayContaining([
      expect.objectContaining({
        reason: "unsupported-surface",
        message: expect.stringContaining("does not support hooks"),
      }),
    ]));
    expect(result.plan.distributable?.containerSelection.status).toBe("unsupported");
    expect(result.plan.review.required).toBe(true);
  });

  test("plans declare degradations in the plan and provenance under the degrade policy", () => {
    const root = createTempDir("make-docs-capability-plan-");
    tempRoots.push(root);
    writeWorkflowPlaybook(root, "user", "hooked-stack", "Hooked Stack");

    const result = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/hooked-stack"],
      target: { harness: "codex", outputKind: "plugin", surface: "native", scope: "project" },
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
      unsupportedPrimitivePolicy: "degrade",
    });

    expect(result.status).toBe("ready");
    const distributable = result.plan.distributable!;
    expect(distributable.skills.map((skill) => skill.skillId)).toEqual(["hooked-stack"]);
    expect(distributable.containerSelection).toMatchObject({
      status: "degraded",
      containerId: "codex-plugin",
      policy: "degrade",
    });
    expect(distributable.containerSelection.declaredDegradations).toHaveLength(1);
    // The declared choice is recorded in plan provenance, never silent (R-CAP-4).
    expect(result.plan.fieldProvenance["distributable.unsupportedPrimitivePolicy"]).toBe("user-supplied");
    expect(result.plan.deterministicDerivations.unsupportedPrimitivePolicy).toBe("degrade");
    expect(result.plan.deterministicDerivations.declaredDegradations).toContain("does not support hooks");
    expect(result.lines).toEqual(expect.arrayContaining([
      "Declared degradations:",
    ]));
    // Plans carrying the distributable survive validation and JSON round-trips.
    expect(validatePackagePlan(JSON.parse(JSON.stringify(result.plan)))).toEqual(result.plan);
  });

  test("event-bound steps compile natively on harnesses whose descriptor maps the event", () => {
    const root = createTempDir("make-docs-capability-plan-");
    tempRoots.push(root);
    writeWorkflowPlaybook(root, "user", "hooked-stack", "Hooked Stack");

    const result = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/hooked-stack"],
      target: { harness: "claude-code", outputKind: "plugin", surface: "native", scope: "project" },
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
    });

    expect(result.status).toBe("ready");
    const selection = result.plan.distributable!.containerSelection;
    expect(selection.status).toBe("ready");
    expect(selection.lowerings).toEqual(expect.arrayContaining([
      expect.objectContaining({ disposition: "native", hookPoint: "PreToolUse" }),
    ]));
  });

  test("plans fail closed on unknown harnesses without a descriptor", () => {
    const root = createTempDir("make-docs-capability-plan-");
    tempRoots.push(root);
    writeWorkflowPlaybook(root, "user", "hooked-stack", "Hooked Stack");

    const result = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/hooked-stack"],
      target: { harness: "mystery-harness", outputKind: "plugin", surface: "native", scope: "project" },
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
    });

    expect(result.stops).toEqual(expect.arrayContaining([
      expect.objectContaining({
        reason: "unsupported-surface",
        message: expect.stringContaining("No harness capability descriptor is registered"),
      }),
    ]));
    expect(result.plan.distributable?.containerSelection.containerId).toBeNull();
  });

  test("descriptor overrides keep future-harness planning additive", () => {
    const root = createTempDir("make-docs-capability-plan-");
    tempRoots.push(root);
    writeWorkflowPlaybook(root, "user", "hooked-stack", "Hooked Stack");

    const result = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/hooked-stack"],
      target: { harness: "future-harness", outputKind: "plugin", surface: "native", scope: "project" },
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
      descriptors: ALL_DESCRIPTORS,
      unsupportedPrimitivePolicy: "degrade",
    });

    expect(result.plan.distributable?.containerSelection).toMatchObject({
      harnessId: "future-harness",
      containerId: "future-plugin",
      status: "degraded",
    });
  });
});
