/**
 * W18 R8 P3 verified-adapter-contract coverage: verification references and
 * statuses on every adapter declaration with support-claim gating
 * (R-ADAPT-1), the re-verification contract digest, the corrected Codex
 * contract (R-ADAPT-2, R-TEST-2), the Claude Code lowering matrix
 * (R-ADAPT-3), the Pi adapter with no hooks and an extension container
 * (R-ADAPT-4), and the fail-closed paths for unknown and unsupported targets
 * exercised through the fixture adapter (R-ADAPT-5, R-TEST-3).
 *
 * These are SHAPE and GATING assertions only: real-harness recognition,
 * installation, and invocation evidence is owned by the W18 R9 conformance
 * lineage, and nothing here may be read as proof that a harness recognizes
 * the output or that a support claim holds (R-TEST-5).
 *
 * Test layer: integration (R-LAYER-1) — automated repository tests over the
 * adapter surface through the manifest and exposure plumbing. Internal tests
 * passing is never evidence that a harness recognizes or can use the output
 * (R-LAYER-2).
 */

import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { createManifest, writeManifest } from "../src/manifest";
import {
  CLAUDE_CODE_HARNESS_CAPABILITY_DESCRIPTOR,
  CODEX_HARNESS_CAPABILITY_DESCRIPTOR,
  capSupportStatusForVerification,
  computeHarnessContractDigest,
  createPlaybookPackagePlan,
  deriveAdapterDeclarationCore,
  deriveAdapterPathTemplates,
  FIRST_PARTY_HARNESS_CAPABILITY_DESCRIPTORS,
  FIRST_PARTY_HARNESS_PACKAGE_ADAPTERS,
  FIXTURE_FUTURE_HARNESS_PACKAGE_ADAPTER,
  FIXTURE_LIMITED_HARNESS_CAPABILITY_DESCRIPTOR,
  FIXTURE_LIMITED_HARNESS_PACKAGE_ADAPTER,
  getHarnessPackageAdapter,
  listHarnessPackageAdapters,
  PI_HARNESS_CAPABILITY_DESCRIPTOR,
  resolvePackageSurface,
  validateHarnessAdapterDeclaration,
  validateHarnessCapabilityDescriptor,
  writePlaybookPackageOutputs,
} from "../src/operations";
import type { HarnessCapabilityDescriptor, PlaybookPackagePlan } from "../src/operations";
import { defaultSelections, resolveInstallProfile } from "../src/profile";
import { createEmptySystemAssetManifestState } from "../src/system-assets";
import { cleanupTempDir, createTempDir } from "./helpers";

const SUPPORT_EVIDENCE_REF = "docs/prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md";
const PACKAGING_DESIGN_REF =
  "docs/designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md";

const ALL_FIRST_PARTY_ADAPTERS = FIRST_PARTY_HARNESS_PACKAGE_ADAPTERS;
const ALL_ADAPTERS = [
  ...ALL_FIRST_PARTY_ADAPTERS,
  FIXTURE_FUTURE_HARNESS_PACKAGE_ADAPTER,
  FIXTURE_LIMITED_HARNESS_PACKAGE_ADAPTER,
];

function writeFile(root: string, relativePath: string, content: string): string {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
  return absolutePath;
}

function writeMakeDocsManifest(root: string): void {
  writeManifest(
    root,
    createManifest(
      { name: "@brucewaynedecoy/make-docs", version: "0.0.0-test" },
      resolveInstallProfile(defaultSelections()),
      {},
      [],
      createEmptySystemAssetManifestState(),
      "playbook-packaging-adapters-test",
    ),
  );
}

function writeSimplePlaybook(root: string, persona: string, slug: string, title: string): void {
  writeFile(
    root,
    `docs/assets/playbooks/${persona}/${slug}.md`,
    [
      "---",
      `title: ${title}`,
      "kind: playbook",
      "status: accepted",
      `persona: ${persona}`,
      "stack: run",
      `summary: ${title} summary.`,
      "---",
      "",
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
    ].join("\n"),
  );
}

function writeEventBoundPlaybook(root: string, persona: string, slug: string, title: string): void {
  writeFile(
    root,
    `docs/assets/playbooks/${persona}/${slug}.playbook.md`,
    [
      "---",
      `title: ${title}`,
      "kind: playbook",
      "status: accepted",
      `persona: ${persona}`,
      "stack: run",
      `summary: ${title} summary.`,
      'schema: "make-docs.playbook.v2"',
      'workflowSchema: make-docs.workflow.v1',
      "---",
      "",
      `# ${title}`,
      "",
      "## Purpose",
      "",
      `Carry the ${title} workflow intent end to end.`,
      "",
      "## When To Use",
      "",
      "Use in adapter contract tests.",
      "",
      "## Inputs",
      "",
      "Repository contracts.",
      "",
      "## Dependencies",
      "",
      "```playbook",
      "dependencies:",
      "  - id: context-server",
      "    kind: mcp",
      "    requirement: preferred",
      "    source: context-mode",
      "    used_by: [guard-tools]",
      "    fallback: continue without extra context",
      "```",
      "",
      "## Workflow",
      "",
      "```playbook",
      "workflow:",
      "  id: adapter-fixture",
      "  state_model: make-docs.workflow-state.v1",
      "  routing: linear",
      "steps:",
      "  - id: guard-tools",
      "    title: Guard tool calls",
      "    executor: agent",
      "    role: check",
      "    activation: event-bound",
      "    event: on-pre-tool-use",
      "    uses: [context-server]",
      "    instructions: Guard the tool call before it runs.",
      "  - id: wrap-up",
      "    title: Wrap up",
      "    executor: agent",
      "    role: activity",
      "    activation: sequential",
      "    instructions: Summarize the run.",
      "```",
      "",
      "## Step Guidance",
      "",
      "Follow the steps in order.",
      "",
      "## Gates",
      "",
      "Stop on unresolved review.",
      "",
      "## Outputs",
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
    ].join("\n"),
  );
}

describe("adapter verification references and status gating (R-ADAPT-1)", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    while (tempRoots.length > 0) {
      cleanupTempDir(tempRoots.pop()!);
    }
  });

  test("every adapter declaration carries a verification reference and status", () => {
    for (const adapter of ALL_ADAPTERS) {
      expect(adapter.verification.reference.length).toBeGreaterThan(0);
      expect(["provisional", "verified"]).toContain(adapter.verification.status);
    }
    // The declaration derives its verification block from the capability
    // descriptor so the descriptor stays the single home of harness
    // packaging knowledge (R-CAP-2).
    const descriptorsById = new Map(
      [...FIRST_PARTY_HARNESS_CAPABILITY_DESCRIPTORS, FIXTURE_LIMITED_HARNESS_CAPABILITY_DESCRIPTOR]
        .map((descriptor) => [descriptor.harnessId, descriptor]),
    );
    for (const adapter of [...ALL_FIRST_PARTY_ADAPTERS, FIXTURE_LIMITED_HARNESS_PACKAGE_ADAPTER]) {
      expect(adapter.verification).toEqual(descriptorsById.get(adapter.harnessId)!.verification);
    }
    // No adapter ships without one: declarations missing the block fail
    // validation.
    const { verification: _dropped, ...withoutVerification } = FIXTURE_FUTURE_HARNESS_PACKAGE_ADAPTER;
    expect(() => validateHarnessAdapterDeclaration(withoutVerification)).toThrow(
      "harness adapter verification",
    );
  });

  test("statuses reflect exactly what the design confirmed", () => {
    // Codex: the design confirmed the real Codex contract (R-ADAPT-2) and the
    // reference names where.
    const codex = getHarnessPackageAdapter({ harnessId: "codex" });
    expect(codex.verification.status).toBe("verified");
    expect(codex.verification.reference).toContain(PACKAGING_DESIGN_REF);
    expect(codex.verification.reference).toContain("R-ADAPT-2");
    expect(codex.verification.reference).toContain("docs/assets/artifacts/playbook-architecture.md");
    expect(codex.verification.contractDigest).toBe(
      computeHarnessContractDigest(CODEX_HARNESS_CAPABILITY_DESCRIPTOR),
    );
    // Claude Code: declared shapes await review against the actual plugin and
    // skill contract, so the adapter stays provisional (R-ADAPT-3).
    const claude = getHarnessPackageAdapter({ harnessId: "claude-code" });
    expect(claude.verification.status).toBe("provisional");
    expect(claude.verification.provisionalNotes.join(" ")).toContain(
      "actual Claude Code plugin and skill contract",
    );
    // Pi: every path is inferred; only the primitive set and the
    // extension-with-skills container are design-confirmed (R-ADAPT-4).
    const pi = getHarnessPackageAdapter({ harnessId: "pi" });
    expect(pi.verification.status).toBe("provisional");
    expect(pi.verification.provisionalNotes.join(" ")).toContain("inferred");
  });

  test("evidence refs never raise support past provisional for an unverified adapter", () => {
    const root = createTempDir("make-docs-adapter-gate-");
    tempRoots.push(root);
    writeSimplePlaybook(root, "user", "run-stack", "Run Stack");

    // Verified Codex contract: evidence refs are preserved, but the W18 R8 P4
    // tuple-binding cap (R-PROV-3) holds the status provisional — the
    // evidence-owned tuple dimensions (scenario, model/provider, runtime)
    // bind only through W18 R9 conformance evidence, so no validated support
    // wording ships from the packaging lineage. The exact tuple rides on the
    // claim with its unbound dimensions declared.
    const codexPlan = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/run-stack"],
      target: { harness: "codex", outputKind: "plugin", surface: "native", scope: "project" },
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
    }).plan;
    expect(codexPlan.support).toEqual({
      status: "provisional",
      evidenceRefs: [SUPPORT_EVIDENCE_REF],
      tuple: {
        scenario: null,
        harness: "codex",
        surface: "native",
        scope: "project",
        outputKind: "plugin",
        modelOrProvider: null,
        runtime: null,
      },
    });

    // Unverified Claude Code and Pi contracts: the same evidence refs are
    // preserved but the status is capped — no support claim (R-ADAPT-1).
    for (const harness of ["claude-code", "pi"] as const) {
      const plan = createPlaybookPackagePlan({
        repoRoot: root,
        refs: ["user/run-stack"],
        target: { harness, outputKind: "skills-bundle", surface: "agents-standard", scope: "project" },
        supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
      }).plan;
      expect(plan.support).toEqual({
        status: "provisional",
        evidenceRefs: [SUPPORT_EVIDENCE_REF],
        tuple: {
          scenario: null,
          harness,
          surface: "agents-standard",
          scope: "project",
          outputKind: "skills-bundle",
          modelOrProvider: null,
          runtime: null,
        },
      });
      // The gate input is declared in the reviewed plan, never silent.
      expect(plan.deterministicDerivations.adapterVerification).toContain("provisional");
    }
    expect(capSupportStatusForVerification("validated", null)).toBe("provisional");
    expect(
      capSupportStatusForVerification("validated", CODEX_HARNESS_CAPABILITY_DESCRIPTOR.verification),
    ).toBe("validated");
  });

  test("a plan claiming a support claim for an unverified adapter fails closed before any write", () => {
    const root = createTempDir("make-docs-adapter-gate-write-");
    tempRoots.push(root);
    writeMakeDocsManifest(root);
    writeSimplePlaybook(root, "user", "run-stack", "Run Stack");
    const plan = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/run-stack"],
      target: { harness: "claude-code", outputKind: "skills-bundle", surface: "agents-standard", scope: "project" },
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
    }).plan;
    const claimed: PlaybookPackagePlan = {
      ...plan,
      support: { status: "validated", evidenceRefs: [SUPPORT_EVIDENCE_REF] },
    };
    const preconditions = {
      "harness-supported": "satisfied",
      "plugin-or-skill-support": "satisfied",
      "symlink-or-copy-mirror": "satisfied",
    } as const;

    const dryRun = writePlaybookPackageOutputs({ repoRoot: root, plan: claimed, preconditions });
    expect(dryRun.stops).toEqual(expect.arrayContaining([
      expect.objectContaining({
        reason: "missing-support-evidence",
        message: expect.stringContaining("must not carry a support claim"),
      }),
    ]));
    expect(() => writePlaybookPackageOutputs({
      repoRoot: root,
      plan: claimed,
      write: true,
      preconditions,
    })).toThrow("Playbook package write stopped");
    expect(existsSync(path.join(root, ".make-docs/agentics/skills/run-stack"))).toBe(false);
  });
});

describe("re-verification requirement via the contract digest (R-ADAPT-1)", () => {
  test("the contract digest is a deterministic function of the declared contract surface", () => {
    expect(computeHarnessContractDigest(CODEX_HARNESS_CAPABILITY_DESCRIPTOR)).toBe(
      computeHarnessContractDigest(CODEX_HARNESS_CAPABILITY_DESCRIPTOR),
    );
    expect(computeHarnessContractDigest(CODEX_HARNESS_CAPABILITY_DESCRIPTOR)).not.toBe(
      computeHarnessContractDigest(CLAUDE_CODE_HARNESS_CAPABILITY_DESCRIPTOR),
    );
  });

  test("changing a verified adapter's declared paths invalidates the verification", () => {
    const codex = CODEX_HARNESS_CAPABILITY_DESCRIPTOR;
    const withDriftedPlacement: HarnessCapabilityDescriptor = {
      ...codex,
      containers: [
        {
          ...codex.containers[0]!,
          layout: {
            ...codex.containers[0]!.layout,
            placements: codex.containers[0]!.layout.placements.map((placement) =>
              placement.scope === "project"
                ? { ...placement, pathTemplate: ".agents/plugins/{packageId}" }
                : placement,
            ),
          },
        },
        ...codex.containers.slice(1),
      ],
    };
    expect(() => validateHarnessCapabilityDescriptor(withDriftedPlacement)).toThrow(
      "changed since verification",
    );
    expect(() => validateHarnessCapabilityDescriptor(withDriftedPlacement)).toThrow("re-verify");
  });

  test("changing a verified adapter's manifest shape or registration steps invalidates the verification", () => {
    const codex = CODEX_HARNESS_CAPABILITY_DESCRIPTOR;
    const withDriftedManifest: HarnessCapabilityDescriptor = {
      ...codex,
      containers: [
        {
          ...codex.containers[0]!,
          layout: { ...codex.containers[0]!.layout, manifestFilename: "plugin.json" },
        },
        ...codex.containers.slice(1),
      ],
    };
    expect(() => validateHarnessCapabilityDescriptor(withDriftedManifest)).toThrow(
      "changed since verification",
    );

    // The drifted registration file stays non-empty so the marketplace-entry
    // consistency invariant (P4, R-MKT-1) passes and the digest drift itself
    // is what fails validation.
    const withDriftedRegistration: HarnessCapabilityDescriptor = {
      ...codex,
      containers: [
        {
          ...codex.containers[0]!,
          layout: {
            ...codex.containers[0]!.layout,
            registrationFiles: [".agents/plugins/other-marketplace.json"],
          },
        },
        ...codex.containers.slice(1),
      ],
    };
    expect(() => validateHarnessCapabilityDescriptor(withDriftedRegistration)).toThrow(
      "changed since verification",
    );
  });

  test("a verified claim without a recorded digest is rejected and provisional contracts need none", () => {
    expect(() => validateHarnessCapabilityDescriptor({
      ...CODEX_HARNESS_CAPABILITY_DESCRIPTOR,
      verification: {
        ...CODEX_HARNESS_CAPABILITY_DESCRIPTOR.verification,
        contractDigest: null,
      },
    })).toThrow("without a recorded contract digest");
    // Provisional contracts change freely — they claim nothing to invalidate —
    // but must say what remains unverified.
    expect(validateHarnessCapabilityDescriptor(PI_HARNESS_CAPABILITY_DESCRIPTOR)).toBe(
      PI_HARNESS_CAPABILITY_DESCRIPTOR,
    );
    expect(() => validateHarnessCapabilityDescriptor({
      ...PI_HARNESS_CAPABILITY_DESCRIPTOR,
      verification: {
        ...PI_HARNESS_CAPABILITY_DESCRIPTOR.verification,
        provisionalNotes: [],
      },
    })).toThrow("provisionalNotes");
  });
});

describe("corrected Codex contract (R-ADAPT-2, R-TEST-2)", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    while (tempRoots.length > 0) {
      cleanupTempDir(tempRoots.pop()!);
    }
  });

  test("the Codex adapter declares no `.agents/plugins/{packageId}` plugin path", () => {
    const templates = deriveAdapterPathTemplates(CODEX_HARNESS_CAPABILITY_DESCRIPTOR);
    const pluginTemplates = templates.filter((template) => template.outputKind === "plugin");
    expect(pluginTemplates.length).toBeGreaterThan(0);
    for (const template of templates) {
      expect(template.template).not.toContain(".agents/plugins/");
    }
    expect(pluginTemplates).toEqual(expect.arrayContaining([
      expect.objectContaining({ surface: "native", scope: "project", template: ".codex/plugins/{packageId}" }),
      expect.objectContaining({
        surface: "native",
        scope: "global",
        template: "<user-home>/.codex/plugins/{packageId}",
      }),
    ]));
    // `.agents/plugins/` holds only the marketplace registration file.
    expect(
      CODEX_HARNESS_CAPABILITY_DESCRIPTOR.containers[0]!.layout.registrationFiles,
    ).toEqual([".agents/plugins/marketplace.json"]);
    expect(CODEX_HARNESS_CAPABILITY_DESCRIPTOR.containers[0]!.layout.manifestFilename).toBe(
      ".codex-plugin/plugin.json",
    );
  });

  test("Codex plugin output is a `.codex-plugin/plugin.json` folder plus marketplace entry naming the install path", () => {
    const root = createTempDir("make-docs-codex-contract-");
    tempRoots.push(root);
    writeMakeDocsManifest(root);
    writeSimplePlaybook(root, "user", "run-stack", "Run Stack");
    const plan = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/run-stack"],
      target: { harness: "codex", outputKind: "plugin", surface: "native", scope: "project" },
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
    }).plan;

    const result = writePlaybookPackageOutputs({
      repoRoot: root,
      plan,
      write: true,
      preconditions: {
        "harness-supported": "satisfied",
        "project-trusted": "satisfied",
        "symlink-or-copy-mirror": "satisfied",
      },
    });

    expect(result.status).toBe("written");
    // The Codex plugin payload is the Phase 2 compiler's harness-native
    // artifact tree, not a descriptor (R-ADAPT-2, R-COMP-1); shape only, not
    // recognition evidence (R-TEST-5).
    expect(result.payloadFiles).toEqual(expect.arrayContaining([
      ".codex-plugin/plugin.json",
      "skills/run-stack/SKILL.md",
      "registration/marketplace.json",
    ]));
    expect(result.exposurePath).toBe(".codex/plugins/run-stack");
    expect(lstatSync(path.join(root, ".codex/plugins/run-stack")).isSymbolicLink()).toBe(true);
    expect(existsSync(path.join(root, ".codex/plugins/run-stack/.codex-plugin/plugin.json"))).toBe(true);
    // The generated marketplace entry registers the plugin folder at the
    // declared install path; the user's marketplace is never auto-mutated
    // (R-MKT-1).
    const marketplace = JSON.parse(readFileSync(
      path.join(root, result.canonicalPath, "registration/marketplace.json"),
      "utf8",
    )) as { plugins: Array<{ id: string; source: { type: string; path: string } }> };
    expect(marketplace.plugins[0]).toMatchObject({
      id: "run-stack",
      source: { type: "path", path: ".codex/plugins/run-stack" },
    });
    expect(existsSync(path.join(root, ".agents/plugins/marketplace.json"))).toBe(false);
    expect(existsSync(path.join(root, ".agents/plugins/run-stack"))).toBe(false);
  });

  test("Codex skills bundles use direct `.agents/skills/{id}/SKILL.md` discovery with symlink or copy-mirror exposure", () => {
    const symlinked = resolvePackageSurface({
      packageId: "run-stack",
      target: { harness: "codex", outputKind: "skills-bundle", surface: "agents-standard", scope: "project" },
      preconditions: {
        "harness-supported": "satisfied",
        "project-trusted": "satisfied",
        "symlink-or-copy-mirror": "satisfied",
      },
    });
    expect(symlinked).toMatchObject({
      status: "ready",
      path: ".agents/skills/run-stack/SKILL.md",
      exposureMode: "symlink",
    });

    const mirrored = resolvePackageSurface({
      packageId: "run-stack",
      platform: "windows",
      symlinkAvailable: false,
      target: { harness: "codex", outputKind: "skills-bundle", surface: "agents-standard", scope: "project" },
      preconditions: {
        "harness-supported": "satisfied",
        "project-trusted": "satisfied",
        "symlink-or-copy-mirror": "satisfied",
      },
    });
    expect(mirrored).toMatchObject({
      path: ".agents/skills/run-stack/SKILL.md",
      exposureMode: "copy-mirror",
      fallbackUsed: true,
    });
  });
});

describe("Claude Code adapter lowering matrix (R-ADAPT-3)", () => {
  test("plugin, skill, and portable-profile targets lower to the declared paths", () => {
    const preconditions = {
      "harness-supported": "satisfied",
      "plugin-or-skill-support": "satisfied",
      "symlink-or-copy-mirror": "satisfied",
    } as const;
    const matrix = [
      {
        target: { harness: "claude-code", outputKind: "plugin", surface: "native", scope: "project" },
        path: ".claude/plugins/run-stack/plugin.json",
      },
      {
        target: { harness: "claude-code", outputKind: "skills-bundle", surface: "native", scope: "project" },
        path: ".claude/skills/run-stack/SKILL.md",
      },
      {
        target: { harness: "claude-code", outputKind: "skills-bundle", surface: "agents-standard", scope: "project" },
        path: ".agents/skills/run-stack/SKILL.md",
      },
    ] as const;
    for (const entry of matrix) {
      const resolution = resolvePackageSurface({
        packageId: "run-stack",
        target: entry.target,
        preconditions,
      });
      expect(resolution.status).toBe("ready");
      expect(resolution.path).toBe(entry.path);
    }
  });

  test("event-bound steps lower to the descriptor's Claude Code hook points", () => {
    // The descriptor is the single home of the hook-point map (R-CAP-2); the
    // compiler consumes it when emitting hooks/hooks.json (covered end-to-end
    // in playbook-packaging-compiler.test.ts).
    expect(CLAUDE_CODE_HARNESS_CAPABILITY_DESCRIPTOR.lifecycleEventMap).toMatchObject({
      "on-session-start": expect.objectContaining({ hookPoint: "SessionStart" }),
      "on-session-end": expect.objectContaining({ hookPoint: "SessionEnd" }),
      "on-user-prompt-submit": expect.objectContaining({ hookPoint: "UserPromptSubmit" }),
      "on-pre-tool-use": expect.objectContaining({ hookPoint: "PreToolUse" }),
      "on-post-tool-use": expect.objectContaining({ hookPoint: "PostToolUse" }),
    });
    expect(CLAUDE_CODE_HARNESS_CAPABILITY_DESCRIPTOR.supportedPrimitives).toContain("hook");
  });
});

describe("Pi adapter: skills, MCP, and extensions but no hooks (R-ADAPT-4)", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    while (tempRoots.length > 0) {
      cleanupTempDir(tempRoots.pop()!);
    }
  });

  test("the Pi adapter is a descriptor-derived declaration requiring no planner conditionals (R-KEEP-1)", () => {
    const pi = getHarnessPackageAdapter({ harnessId: "pi" });
    const derived = deriveAdapterDeclarationCore(PI_HARNESS_CAPABILITY_DESCRIPTOR);
    expect(pi.pathTemplates).toEqual(derived.pathTemplates);
    expect(pi.preconditions).toEqual(derived.preconditions);
    expect(pi.verification).toEqual(derived.verification);
    expect(listHarnessPackageAdapters().map((adapter) => adapter.harnessId)).toContain("pi");
    // The primitive set matches R-ADAPT-4 exactly: no hooks.
    expect(PI_HARNESS_CAPABILITY_DESCRIPTOR.supportedPrimitives).toEqual([
      "skill",
      "extension",
      "mcp-server",
    ]);
    expect(PI_HARNESS_CAPABILITY_DESCRIPTOR.supportedPrimitives).not.toContain("hook");
    expect(Object.keys(PI_HARNESS_CAPABILITY_DESCRIPTOR.lifecycleEventMap)).toEqual([]);
  });

  test("the native profile lowers to an extension bundled with skills and never emits hook artifacts", () => {
    const root = createTempDir("make-docs-pi-write-");
    tempRoots.push(root);
    writeMakeDocsManifest(root);
    writeEventBoundPlaybook(root, "user", "hooked-stack", "Hooked Stack");
    const plan = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/hooked-stack"],
      target: { harness: "pi", outputKind: "plugin", surface: "native", scope: "project" },
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
      unsupportedPrimitivePolicy: "degrade",
    }).plan;
    // outputKind `plugin` is the richest native container, which Pi realizes
    // as an extension (R-CAP-3).
    expect(plan.distributable?.containerSelection).toMatchObject({
      status: "degraded",
      containerId: "pi-extension",
      containerKind: "extension",
    });
    // The event-bound step degrades to a documented skill instruction — a
    // declared choice, never silent (R-CAP-4).
    expect(plan.distributable?.containerSelection.declaredDegradations.join(" ")).toContain(
      "does not support hooks",
    );
    // Unverified Pi contract: provisional output only (R-ADAPT-1).
    expect(plan.support.status).toBe("provisional");

    const result = writePlaybookPackageOutputs({
      repoRoot: root,
      plan,
      write: true,
      preconditions: {
        "harness-supported": "satisfied",
        "symlink-or-copy-mirror": "satisfied",
      },
    });
    expect(result.status).toBe("written");
    expect(result.exposurePath).toBe(".pi/extensions/hooked-stack");
    expect(result.payloadFiles).toEqual(expect.arrayContaining([
      "extension.json",
      "skills/hooked-stack/SKILL.md",
    ]));
    // Never a hook artifact (R-ADAPT-4).
    expect(result.payloadFiles).not.toContain("hooks/hooks.json");
    const manifest = JSON.parse(readFileSync(
      path.join(root, result.canonicalPath, "extension.json"),
      "utf8",
    )) as Record<string, unknown>;
    expect(manifest.hooks).toBeUndefined();
    expect(manifest.skills).toEqual([
      { id: "hooked-stack", path: "skills/hooked-stack/SKILL.md" },
    ]);
    // The degraded event binding is documented in the skill text.
    const skill = readFileSync(
      path.join(root, result.canonicalPath, "skills/hooked-stack/SKILL.md"),
      "utf8",
    );
    expect(skill).toContain("degrades to a documented skill instruction");
  });

  test("event-bound steps fail closed for Pi under the default policy (R-CAP-4)", () => {
    const root = createTempDir("make-docs-pi-failclosed-");
    tempRoots.push(root);
    writeEventBoundPlaybook(root, "user", "hooked-stack", "Hooked Stack");
    const result = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/hooked-stack"],
      target: { harness: "pi", outputKind: "plugin", surface: "native", scope: "project" },
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
    });
    expect(result.plan.distributable?.containerSelection.status).toBe("unsupported");
    expect(result.stops).toEqual(expect.arrayContaining([
      expect.objectContaining({
        reason: "unsupported-surface",
        message: expect.stringContaining("does not support hooks"),
      }),
    ]));
  });

  test("the Pi portable profile lowers to agents-standard skills", () => {
    const resolution = resolvePackageSurface({
      packageId: "run-stack",
      target: { harness: "pi", outputKind: "skills-bundle", surface: "agents-standard", scope: "project" },
      preconditions: {
        "harness-supported": "satisfied",
        "symlink-or-copy-mirror": "satisfied",
      },
    });
    expect(resolution.status).toBe("ready");
    expect(resolution.path).toBe(".agents/skills/run-stack/SKILL.md");
  });
});

describe("fail-closed paths through the fixture adapter (R-ADAPT-5, R-TEST-3)", () => {
  const tempRoots: string[] = [];
  const fixtureAdapters = [...FIRST_PARTY_HARNESS_PACKAGE_ADAPTERS, FIXTURE_LIMITED_HARNESS_PACKAGE_ADAPTER];
  const fixtureDescriptors = [
    ...FIRST_PARTY_HARNESS_CAPABILITY_DESCRIPTORS,
    FIXTURE_LIMITED_HARNESS_CAPABILITY_DESCRIPTOR,
  ];

  afterEach(() => {
    while (tempRoots.length > 0) {
      cleanupTempDir(tempRoots.pop()!);
    }
  });

  test("an unknown harness identifier fails closed before any write", () => {
    const root = createTempDir("make-docs-unknown-harness-");
    tempRoots.push(root);
    writeMakeDocsManifest(root);
    writeSimplePlaybook(root, "user", "run-stack", "Run Stack");

    // Planner: the unknown harness is a declared stop, not a silent pass.
    const planned = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/run-stack"],
      target: { harness: "mystery-harness", outputKind: "plugin", surface: "native", scope: "project" },
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
    });
    expect(planned.stops).toEqual(expect.arrayContaining([
      expect.objectContaining({
        reason: "unsupported-surface",
        message: expect.stringContaining("No harness capability descriptor is registered"),
      }),
    ]));

    // Surface resolution and the writer refuse the unknown id outright.
    expect(() => resolvePackageSurface({
      packageId: "run-stack",
      target: { harness: "mystery-harness", outputKind: "plugin", surface: "native", scope: "project" },
    })).toThrow("No package adapter registered");
    expect(() => writePlaybookPackageOutputs({
      repoRoot: root,
      plan: planned.plan,
      write: true,
    })).toThrow("No package adapter registered");
    expect(existsSync(path.join(root, ".make-docs/agentics/plugins/run-stack"))).toBe(false);
  });

  test("an unsupported output kind stops with unsupported-output-kind before any write", () => {
    // The limited fixture harness declares no portable container, so
    // skills-bundle output is an unsupported output kind.
    const resolution = resolvePackageSurface({
      packageId: "run-stack",
      adapters: fixtureAdapters,
      target: { harness: "fixture-limited", outputKind: "skills-bundle", surface: "agents-standard", scope: "project" },
    });
    expect(resolution.status).toBe("unsupported");
    expect(resolution.stops).toEqual([
      expect.objectContaining({ reason: "unsupported-output-kind" }),
    ]);

    const root = createTempDir("make-docs-fixture-kind-");
    tempRoots.push(root);
    writeSimplePlaybook(root, "user", "run-stack", "Run Stack");
    const planned = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/run-stack"],
      target: { harness: "fixture-limited", outputKind: "skills-bundle", surface: "agents-standard", scope: "project" },
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
      descriptors: fixtureDescriptors,
    });
    expect(planned.stops).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: "unsupported-output-kind" }),
    ]));
  });

  test("an unsupported surface stops with unsupported-surface before any write", () => {
    const resolution = resolvePackageSurface({
      packageId: "run-stack",
      adapters: fixtureAdapters,
      target: { harness: "fixture-limited", outputKind: "plugin", surface: "agents-standard", scope: "project" },
    });
    expect(resolution.status).toBe("unsupported");
    expect(resolution.stops).toEqual([
      expect.objectContaining({ reason: "unsupported-surface" }),
    ]);
  });

  test("a scope the adapter cannot honor stops before any write", () => {
    const resolution = resolvePackageSurface({
      packageId: "run-stack",
      adapters: fixtureAdapters,
      target: { harness: "fixture-limited", outputKind: "plugin", surface: "native", scope: "global" },
    });
    expect(resolution.status).toBe("unsupported");
    // Consistent with the existing W18 R5 stop reasons: an un-honorable
    // scope routes to manual review rather than a silent fallback.
    expect(resolution.stops).toEqual([
      expect.objectContaining({
        reason: "manual-review-required",
        message: expect.stringContaining("does not support global scope"),
      }),
    ]);
  });

  test("the writer honors fixture fail-closed resolutions and writes nothing", () => {
    const root = createTempDir("make-docs-fixture-write-");
    tempRoots.push(root);
    writeMakeDocsManifest(root);
    writeSimplePlaybook(root, "user", "run-stack", "Run Stack");
    const planned = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/run-stack"],
      target: { harness: "fixture-limited", outputKind: "skills-bundle", surface: "agents-standard", scope: "project" },
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
      descriptors: fixtureDescriptors,
    });
    const resolution = resolvePackageSurface({
      packageId: planned.plan.packageId,
      adapters: fixtureAdapters,
      target: planned.plan.target,
    });

    const dryRun = writePlaybookPackageOutputs({
      repoRoot: root,
      plan: planned.plan,
      surfaceResolution: resolution,
      descriptors: fixtureDescriptors,
    });
    expect(dryRun.stops).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: "unsupported-output-kind" }),
    ]));
    expect(dryRun.filesWritten).toEqual([]);

    expect(() => writePlaybookPackageOutputs({
      repoRoot: root,
      plan: planned.plan,
      surfaceResolution: resolution,
      descriptors: fixtureDescriptors,
      write: true,
    })).toThrow("Playbook package write stopped");
    expect(existsSync(path.join(root, ".make-docs/agentics/skills/run-stack"))).toBe(false);
  });
});
