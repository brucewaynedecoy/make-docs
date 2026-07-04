/**
 * W18 R8 P5 (D10) verification suite: the audit layer over the packaging test
 * files that makes the R-TEST-1..5 verification bar explicit, fills the
 * coverage gaps the earlier phases left implicit, and lands the evidence
 * boundary where the tests live.
 *
 * ===========================================================================
 * EVIDENCE BOUNDARY (t8, R-TEST-5)
 * ===========================================================================
 * Real-harness recognition, installation, and invocation are proven ONLY by
 * the conformance design (planned as W18 R9; PRD lineage
 * docs/prd/37-enhance-playbook-and-package-conformance.md) and its
 * tuple-bound evidence bar. Every test in this file and in the other
 * playbook-packaging*.test.ts files asserts SHAPES, GATES, and RECORDS of the
 * compiler and adapters. None of them — individually or together — may be
 * read as evidence that any harness recognizes, installs, or invokes the
 * generated output, and no support wording, README claim, or manifest status
 * may cite this suite as harness-recognition evidence.
 * ===========================================================================
 *
 * Coverage matrix (W18 R8 P5 t1–t9 → R-TEST-1..5). Tests live in the named
 * file; unnamed entries live in this file.
 *
 * t1 / R-TEST-1 — multi-file harness-native tree, not a Make Docs descriptor
 * - "emits a multi-file harness-native tree and never a Make Docs descriptor
 *   payload (R-TEST-1, R-TEST-2)" (playbook-packaging-compiler): the payload
 *   root is a directory tree, and the explicit negative assertion that no
 *   emitted file carries a Make Docs `kind` encodes "fails against the
 *   deleted descriptor-era `renderPackageContent` writer, passes against the
 *   Phase 2 compiler".
 *
 * t2 / R-TEST-2 — Codex plugin shape
 * - ".codex-plugin/plugin.json" + marketplace registration entry: "Codex
 *   plugin output is a `.codex-plugin/plugin.json` folder plus marketplace
 *   entry naming the install path" and "the Codex adapter declares no
 *   `.agents/plugins/{packageId}` plugin path"
 *   (playbook-packaging-adapters); the compiler tree test above pins the
 *   same files end to end.
 *
 * t3 / R-TEST-2 — Codex skills-bundle discovery path
 * - "Codex skills bundles use direct `.agents/skills/{id}/SKILL.md`
 *   discovery with symlink or copy-mirror exposure"
 *   (playbook-packaging-adapters).
 *
 * t4 / R-TEST-3 — fixture-adapter fail-closed, each proving no write
 * - unknown harness: "an unknown harness identifier fails closed before any
 *   write" (playbook-packaging-adapters).
 * - unsupported output kind: "an unsupported output kind stops with
 *   unsupported-output-kind before any write" and "the writer honors fixture
 *   fail-closed resolutions and writes nothing"
 *   (playbook-packaging-adapters).
 * - unsupported surface: "an unsupported surface stops with
 *   unsupported-surface before any write" (playbook-packaging-adapters) plus
 *   the writer-level filesystem before/after proof "an unsupported surface
 *   through the writer leaves the filesystem untouched" here.
 *
 * t5 / R-TEST-4 + R-DEPMAT-1 — dependency materialization per kind
 * - "materializes every dependency kind per R-DEPMAT-1", "bundles playbook
 *   dependencies as additional skills when bundled", and "degrades skill and
 *   plugin dependencies explicitly where the container has no manifest"
 *   (playbook-packaging-compiler), including the operation-identifier (not
 *   command-string) `cli` reference.
 * - "every kind in the R6 dependency vocabulary materializes with a declared
 *   disposition" here closes the vocabulary: `script` and `asset` included,
 *   and the fixture is checked against PLAYBOOK_DEPENDENCY_KINDS so a
 *   vocabulary addition fails this test until it gains coverage.
 *
 * t6 / R-TEST-4 + R-GEN-2 — generation gate, fail before write, all five:
 * - unresolved semantic decisions: compile-level in "routes missing skill
 *   descriptions through review-gated proposals…"
 *   (playbook-packaging-compiler); writer-level no-write proof "unresolved
 *   semantic decisions and unresolved plan decisions fail closed before any
 *   write" here.
 * - ownership conflicts: "stops before overwriting modified generated
 *   package output" (playbook-packaging), including the preserved-content
 *   proof, and "routes user-modified generated outputs to review"
 *   (playbook-packaging).
 * - missing dependencies: "fails closed before any write on missing required
 *   references and stale sources" (playbook-packaging-compiler).
 * - unsupported surfaces: "event-bound steps fail closed for Pi under the
 *   default policy" (playbook-packaging-adapters) and the fixture writer
 *   proof here.
 * - missing conformance evidence: "a plan claiming a support claim for an
 *   unverified adapter fails closed before any write"
 *   (playbook-packaging-adapters) and "a validated claim with an unbound
 *   tuple fails closed; a fully bound tuple passes the gate"
 *   (playbook-packaging-lifecycle).
 *
 * t7 / R-TEST-4 + R-PROV-1..2 — provenance and lifecycle cleanliness
 * - playbook-packaging-lifecycle: "manifest ownership records carry the full
 *   R-PROV-1 provenance per generated file", "the in-tree provenance record
 *   carries the exact R-PROV-1 field list…", the W18 R5 classification
 *   tests, and the real uninstall/backup cleanliness tests.
 *
 * t8 / R-TEST-5 — the evidence boundary is stated where the tests live
 * - the boundary block above, and "every packaging test file states the
 *   R-TEST-5 evidence boundary where the tests live" here.
 *
 * t9 / R-PROV-3 + R-ADAPT-1 — no support status past provisional
 * - "no first-party adapter or planner-built claim advances past provisional
 *   on the strength of this suite" and "a validated claim requires both a
 *   verified adapter contract and a fully bound tuple" here.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, test } from "vitest";
import { createManifest, writeManifest } from "../src/manifest";
import {
  bindPackageSupportTuple,
  capSupportStatusForTupleBinding,
  capSupportStatusForVerification,
  CLAUDE_CODE_HARNESS_CAPABILITY_DESCRIPTOR,
  CODEX_HARNESS_CAPABILITY_DESCRIPTOR,
  createPlaybookPackagePlan,
  FIRST_PARTY_HARNESS_CAPABILITY_DESCRIPTORS,
  FIRST_PARTY_HARNESS_PACKAGE_ADAPTERS,
  FIXTURE_LIMITED_HARNESS_CAPABILITY_DESCRIPTOR,
  FIXTURE_LIMITED_HARNESS_PACKAGE_ADAPTER,
  PI_HARNESS_CAPABILITY_DESCRIPTOR,
  resolvePackageSurface,
  skillDescriptionProposalField,
  writePlaybookPackageOutputs,
} from "../src/operations";
import type { PlaybookPackagePlan, PlaybookPackageTarget } from "../src/operations";
import { PLAYBOOK_DEPENDENCY_KINDS } from "../src/playbook";
import type { PlaybookDependencyKind } from "../src/playbook";
import { defaultSelections, resolveInstallProfile } from "../src/profile";
import { createEmptySystemAssetManifestState } from "../src/system-assets";
import { cleanupTempDir, collectFiles, createTempDir } from "./helpers";

const SUPPORT_EVIDENCE_REF =
  "docs/prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md";
const CODEX_PLUGIN_PRECONDITIONS = {
  "harness-supported": "satisfied",
  "project-trusted": "satisfied",
  "symlink-or-copy-mirror": "satisfied",
} as const;
const TESTS_DIR = path.dirname(fileURLToPath(import.meta.url));

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
      "playbook-packaging-verification-test",
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
      "",
      "## Procedure",
      "",
      "1. Follow the documented steps in order.",
      "",
      "## Gates and Decisions",
      "",
      "- Stop when user review is required.",
      "",
      "## Assists",
      "",
      "- Assists are optional unless the playbook says otherwise.",
      "",
      "## Outputs and Handoff",
      "",
      "- Record the expected output.",
      "",
      "## Validation",
      "",
      "- Confirm the workflow completed.",
      "",
    ].join("\n"),
  );
}

/**
 * The t5 vocabulary fixture: one dependency row per PLAYBOOK_DEPENDENCY_KINDS
 * entry. Kept as an explicit map so the completeness assertion below fails —
 * pointing here — when the R6 vocabulary grows.
 */
const VOCABULARY_DEPENDENCY_KINDS: Record<string, PlaybookDependencyKind> = {
  "make-docs-cli": "cli",
  "node-packages": "package-manager",
  "helper-script": "script",
  "context-server": "mcp",
  "issue-tracker": "external-service",
  "review-guide": "reference",
  "commit-helper": "skill",
  "formatter-plugin": "plugin",
  "child-run": "playbook",
  "brand-logo": "asset",
};

function writeVocabularyPlaybook(root: string): void {
  writeFile(
    root,
    "docs/assets/playbooks/user/full-vocabulary.playbook.md",
    [
      "---",
      "title: Full Vocabulary",
      "kind: playbook",
      "status: accepted",
      "persona: user",
      "stack: run",
      "summary: Full Vocabulary summary.",
      'schema: "make-docs.playbook.v2"',
      'workflowSchema: make-docs.workflow.v1',
      "---",
      "",
      "# Full Vocabulary",
      "",
      "## Purpose",
      "",
      "Carry the Full Vocabulary workflow intent end to end.",
      "",
      "## When To Use",
      "",
      "Use when verifying dependency materialization coverage.",
      "",
      "## Inputs",
      "",
      "Repository contracts.",
      "",
      "## Dependencies",
      "",
      "```playbook",
      "dependencies:",
      // v2 declarations (PRD 40 R-DEP-2..3): machine targets live on
      // `probe`; `source` is prose that adversarially does not begin with
      // the probe token (R-FIX-1).
      "  - id: make-docs-cli",
      "    kind: cli",
      "    requirement: required",
      "    probe: playbook.catalog",
      "    source: package install of the make-docs CLI",
      "    used_by: [catalog]",
      "    fallback: none",
      "  - id: node-packages",
      "    kind: package-manager",
      "    requirement: required",
      "    probe: npm",
      "    source: ships with the Node.js distribution",
      "    used_by: [work]",
      "    fallback: none",
      "  - id: helper-script",
      "    kind: script",
      "    requirement: optional",
      "    source: scripts/helper.sh",
      "    used_by: [work]",
      "    fallback: none",
      "  - id: context-server",
      "    kind: mcp",
      "    requirement: preferred",
      "    probe: context-mode",
      "    source: harness configuration of the context-mode server",
      "    used_by: [work]",
      "    fallback: continue without extra context",
      "  - id: issue-tracker",
      "    kind: external-service",
      "    requirement: optional",
      "    source: https://example.test/api",
      "    used_by: [work]",
      "    fallback: manual updates",
      "  - id: review-guide",
      "    kind: reference",
      "    requirement: required",
      "    source: .make-docs/contracts/system/example.md",
      "    used_by: [work]",
      "    fallback: none",
      "  - id: commit-helper",
      "    kind: skill",
      "    requirement: preferred",
      "    source: marketplace entry for the commit helper",
      "    used_by: [work]",
      "    fallback: manual commit",
      "  - id: formatter-plugin",
      "    kind: plugin",
      "    requirement: optional",
      "    probe: prettier-plugin",
      "    source: marketplace entry for the formatter",
      "    used_by: [work]",
      "    fallback: manual formatting",
      "  - id: child-run",
      "    kind: playbook",
      "    requirement: optional",
      "    probe: user/child-run",
      "    source: the user persona's child-run Playbook",
      "    used_by: [work]",
      "    fallback: skip",
      "  - id: brand-logo",
      "    kind: asset",
      "    requirement: optional",
      "    source: docs/assets/artifacts/logo.png",
      "    used_by: [work]",
      "    fallback: none",
      "```",
      "",
      "## Workflow",
      "",
      "```playbook",
      "workflow:",
      "  id: full-vocabulary",
      "  state_model: make-docs.workflow-state.v1",
      "  routing: linear",
      "steps:",
      "  - id: catalog",
      "    title: Catalog the playbooks",
      "    executor: cli",
      "    role: activity",
      "    activation: sequential",
      "    uses: [make-docs-cli]",
      "    operation: playbook.catalog",
      "  - id: work",
      "    title: Do the work",
      "    executor: agent",
      "    role: activity",
      "    activation: sequential",
      "    instructions: Do the work using the declared dependencies.",
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
      "A materialized dependency record.",
      "",
      "## Validation",
      "",
      "Confirm every dependency kind has a declared disposition.",
      "",
      "## Packaging Notes",
      "",
      "No packaging hints.",
      "",
    ].join("\n"),
  );
}

const CODEX_PLUGIN_TARGET: PlaybookPackageTarget = {
  harness: "codex",
  outputKind: "plugin",
  surface: "native",
  scope: "project",
};

describe("dependency vocabulary completeness (t5, R-TEST-4, R-DEPMAT-1)", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    while (tempRoots.length > 0) {
      cleanupTempDir(tempRoots.pop()!);
    }
  });

  test("every kind in the R6 dependency vocabulary materializes with a declared disposition", () => {
    // Completeness gate: the fixture must exercise the full vocabulary. When
    // PLAYBOOK_DEPENDENCY_KINDS grows, this fails until the new kind gains a
    // fixture row and an expected disposition below.
    expect(new Set(Object.values(VOCABULARY_DEPENDENCY_KINDS))).toEqual(
      new Set(PLAYBOOK_DEPENDENCY_KINDS),
    );

    const root = createTempDir("make-docs-verification-vocab-");
    tempRoots.push(root);
    writeMakeDocsManifest(root);
    writeFile(root, ".make-docs/contracts/system/example.md", "# Example Contract\n\nAuthority text.\n");
    writeVocabularyPlaybook(root);

    const plan = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/full-vocabulary"],
      target: CODEX_PLUGIN_TARGET,
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
    }).plan;
    const result = writePlaybookPackageOutputs({
      repoRoot: root,
      plan,
      write: true,
      preconditions: CODEX_PLUGIN_PRECONDITIONS,
    });
    expect(result.status).toBe("written");

    const declarations = JSON.parse(readFileSync(
      path.join(root, result.canonicalPath, ".make-docs/dependencies.json"),
      "utf8",
    )) as { dependencies: Array<Record<string, unknown>> };
    const byId = new Map(declarations.dependencies.map((entry) => [entry.id, entry]));

    // Every declared kind rides the record with its R-DEPMAT-1 disposition.
    for (const [id, kind] of Object.entries(VOCABULARY_DEPENDENCY_KINDS)) {
      expect(byId.get(id), `dependency ${id} (${kind}) missing`).toMatchObject({ kind });
    }
    // cli on Make Docs itself: the stable operation identifier — never a CLI
    // command string — is the reference (R-DEPMAT-1, R-SCOPE-1).
    expect(byId.get("make-docs-cli")).toMatchObject({
      disposition: "check-script",
      operation: "playbook.catalog",
    });
    expect(readFileSync(path.join(root, result.canonicalPath, "checks/make-docs-cli.sh"), "utf8"))
      .toContain("# stable-reference: operation:playbook.catalog");
    // package-manager: deterministic check script plus human instructions.
    expect(byId.get("node-packages")).toMatchObject({ disposition: "check-script" });
    // script and asset: documented-only dispositions — declared, never silent.
    expect(byId.get("helper-script")).toMatchObject({ disposition: "documented-only" });
    expect(String(byId.get("helper-script")!.instructions)).toContain("scripts/helper.sh");
    expect(byId.get("brand-logo")).toMatchObject({ disposition: "documented-only" });
    expect(String(byId.get("brand-logo")!.instructions)).toContain("docs/assets/artifacts/logo.png");
    // mcp and external-service: metadata plus a runtime availability check.
    expect(byId.get("context-server")).toMatchObject({
      disposition: "metadata-with-runtime-check",
    });
    expect(byId.get("issue-tracker")).toMatchObject({
      disposition: "metadata-with-runtime-check",
    });
    // reference: copied where redistribution is allowed (in-repo authority).
    expect(byId.get("review-guide")).toMatchObject({ disposition: "copied-reference" });
    // skill and plugin: harness-native manifest references on this container.
    expect(byId.get("commit-helper")).toMatchObject({ disposition: "manifest-reference" });
    expect(byId.get("formatter-plugin")).toMatchObject({ disposition: "manifest-reference" });
    // playbook: referenced when not bundled.
    expect(byId.get("child-run")).toMatchObject({ disposition: "referenced-playbook" });
  });
});

describe("generation gate fail-before-write proofs (t4, t6, R-TEST-3, R-GEN-2)", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    while (tempRoots.length > 0) {
      cleanupTempDir(tempRoots.pop()!);
    }
  });

  test("an unsupported surface through the writer leaves the filesystem untouched", () => {
    const root = createTempDir("make-docs-verification-surface-");
    tempRoots.push(root);
    writeMakeDocsManifest(root);
    writeSimplePlaybook(root, "user", "run-stack", "Run Stack");
    const fixtureAdapters = [
      ...FIRST_PARTY_HARNESS_PACKAGE_ADAPTERS,
      FIXTURE_LIMITED_HARNESS_PACKAGE_ADAPTER,
    ];
    const fixtureDescriptors = [
      ...FIRST_PARTY_HARNESS_CAPABILITY_DESCRIPTORS,
      FIXTURE_LIMITED_HARNESS_CAPABILITY_DESCRIPTOR,
    ];

    // The limited fixture harness declares no agents-standard surface for its
    // plugin container, so the surface is unsupported (R-ADAPT-5).
    const planned = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/run-stack"],
      target: {
        harness: "fixture-limited",
        outputKind: "plugin",
        surface: "agents-standard",
        scope: "project",
      },
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
      descriptors: fixtureDescriptors,
    });
    const resolution = resolvePackageSurface({
      packageId: planned.plan.packageId,
      adapters: fixtureAdapters,
      target: planned.plan.target,
    });
    expect(resolution.status).toBe("unsupported");
    expect(resolution.stops).toEqual([
      expect.objectContaining({ reason: "unsupported-surface" }),
    ]);

    // Filesystem before/after proof: neither the dry run nor the refused
    // write leaves any trace — no canonical payload, no exposure, no partial
    // tree (R-TEST-3 acceptance: the stop proves no write occurred).
    const filesBefore = collectFiles(root);
    const dryRun = writePlaybookPackageOutputs({
      repoRoot: root,
      plan: planned.plan,
      surfaceResolution: resolution,
      descriptors: fixtureDescriptors,
    });
    expect(dryRun.stops).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: "unsupported-surface" }),
    ]));
    expect(dryRun.filesWritten).toEqual([]);
    expect(() => writePlaybookPackageOutputs({
      repoRoot: root,
      plan: planned.plan,
      surfaceResolution: resolution,
      descriptors: fixtureDescriptors,
      write: true,
    })).toThrow("Playbook package write stopped");
    expect(collectFiles(root)).toEqual(filesBefore);
  });

  test("unresolved semantic decisions and unresolved plan decisions fail closed before any write", () => {
    const root = createTempDir("make-docs-verification-gate-");
    tempRoots.push(root);
    writeMakeDocsManifest(root);
    writeSimplePlaybook(root, "user", "run-stack", "Run Stack");
    const plan = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/run-stack"],
      target: CODEX_PLUGIN_TARGET,
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
    }).plan;
    const filesBefore = collectFiles(root);

    // Unapproved agent-assisted proposal: the semantic gate stops the writer
    // (the compile-level twin lives in playbook-packaging-compiler.test.ts).
    const proposalField = skillDescriptionProposalField("run-stack");
    const withProposal: PlaybookPackagePlan = {
      ...plan,
      agentAssistedProposals: [
        {
          field: proposalField,
          value: "Use the Run Stack workflow from the user/run-stack Playbook.",
          reason: "Semantic description proposed for review.",
        },
      ],
      fieldProvenance: { ...plan.fieldProvenance, [proposalField]: "agent-proposed" },
      review: { required: true, status: "required" },
    };
    const proposalDryRun = writePlaybookPackageOutputs({
      repoRoot: root,
      plan: withProposal,
      preconditions: CODEX_PLUGIN_PRECONDITIONS,
    });
    expect(proposalDryRun.stops).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: "semantic-review-required" }),
    ]));
    expect(proposalDryRun.filesWritten).toEqual([]);
    expect(() => writePlaybookPackageOutputs({
      repoRoot: root,
      plan: withProposal,
      write: true,
      preconditions: CODEX_PLUGIN_PRECONDITIONS,
    })).toThrow("Playbook package write stopped");

    // An unresolved plan decision stops the writer the same way.
    const withDecision: PlaybookPackagePlan = {
      ...plan,
      unresolvedDecisions: [
        { id: "container-choice", question: "Which container should host the bundle?" },
      ],
      review: { required: true, status: "required" },
    };
    const decisionDryRun = writePlaybookPackageOutputs({
      repoRoot: root,
      plan: withDecision,
      preconditions: CODEX_PLUGIN_PRECONDITIONS,
    });
    expect(decisionDryRun.stops).toEqual(expect.arrayContaining([
      expect.objectContaining({
        reason: "manual-review-required",
        message: expect.stringContaining("unresolved decisions"),
      }),
    ]));
    expect(() => writePlaybookPackageOutputs({
      repoRoot: root,
      plan: withDecision,
      write: true,
      preconditions: CODEX_PLUGIN_PRECONDITIONS,
    })).toThrow("Playbook package write stopped");

    // Fail BEFORE write: no canonical payload, no exposure, nothing at all.
    expect(existsSync(path.join(root, ".make-docs/agentics/plugins/run-stack"))).toBe(false);
    expect(collectFiles(root)).toEqual(filesBefore);
  });
});

describe("adapter support statuses stay provisional (t9, R-PROV-3, R-ADAPT-1)", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    while (tempRoots.length > 0) {
      cleanupTempDir(tempRoots.pop()!);
    }
  });

  test("no first-party adapter or planner-built claim advances past provisional on the strength of this suite", () => {
    // Adapter contract verification statuses never exceed the vocabulary the
    // design confirmed, and verification status is NOT a support claim.
    for (const adapter of FIRST_PARTY_HARNESS_PACKAGE_ADAPTERS) {
      expect(["provisional", "verified"]).toContain(adapter.verification.status);
    }
    for (const descriptor of FIRST_PARTY_HARNESS_CAPABILITY_DESCRIPTORS) {
      expect(["provisional", "verified"]).toContain(descriptor.verification.status);
    }

    // Every first-party harness target yields a provisional support claim
    // bound to its exact tuple, with the evidence-owned dimensions (scenario,
    // model/provider, runtime) explicitly unbound: nothing in this suite —
    // shape tests, gate tests, or lifecycle tests — advances a support status,
    // because that evidence bar is owned by the W18 R9 conformance design
    // (R-TEST-5).
    const targets: PlaybookPackageTarget[] = [
      { harness: "codex", outputKind: "plugin", surface: "native", scope: "project" },
      { harness: "codex", outputKind: "skills-bundle", surface: "agents-standard", scope: "project" },
      { harness: "claude-code", outputKind: "skills-bundle", surface: "agents-standard", scope: "project" },
      { harness: "pi", outputKind: "skills-bundle", surface: "agents-standard", scope: "project" },
    ];
    const root = createTempDir("make-docs-verification-status-");
    tempRoots.push(root);
    writeSimplePlaybook(root, "user", "run-stack", "Run Stack");
    for (const target of targets) {
      const plan = createPlaybookPackagePlan({
        repoRoot: root,
        refs: ["user/run-stack"],
        target,
        supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
      }).plan;
      expect(plan.support.status, `${target.harness}/${target.outputKind}`).toBe("provisional");
      expect(plan.support.tuple).toEqual({
        scenario: null,
        harness: target.harness,
        surface: target.surface,
        scope: target.scope,
        outputKind: target.outputKind,
        modelOrProvider: null,
        runtime: null,
      });
    }
  });

  test("a validated claim requires both a verified adapter contract and a fully bound tuple", () => {
    const target = {
      harness: "codex",
      outputKind: "plugin",
      surface: "native",
      scope: "project",
    } as const;
    const boundTuple = bindPackageSupportTuple({
      target,
      scenario: "w18-r9/codex-plugin-install-discover-invoke-uninstall",
      modelOrProvider: "anthropic",
      runtime: "codex-cli",
    });

    // Missing either leg caps the claim to provisional.
    expect(capSupportStatusForVerification("validated", null)).toBe("provisional");
    expect(capSupportStatusForVerification(
      "validated",
      CLAUDE_CODE_HARNESS_CAPABILITY_DESCRIPTOR.verification,
    )).toBe("provisional");
    expect(capSupportStatusForVerification(
      "validated",
      PI_HARNESS_CAPABILITY_DESCRIPTOR.verification,
    )).toBe("provisional");
    expect(capSupportStatusForTupleBinding(
      "validated",
      bindPackageSupportTuple({ target }),
    )).toBe("provisional");

    // Both legs together — the future W18 R9 promotion path — pass the caps.
    expect(capSupportStatusForVerification(
      "validated",
      CODEX_HARNESS_CAPABILITY_DESCRIPTOR.verification,
    )).toBe("validated");
    expect(capSupportStatusForTupleBinding("validated", boundTuple)).toBe("validated");
  });
});

describe("the R-TEST-5 evidence boundary is recorded where the tests live (t8)", () => {
  test("every packaging test file states the R-TEST-5 evidence boundary", () => {
    const packagingTestFiles = readdirSync(TESTS_DIR)
      .filter((name) => name.startsWith("playbook-packaging") && name.endsWith(".test.ts"))
      .sort();
    // The full packaging suite: rails, capability, compiler, adapters,
    // registration seam, lifecycle, and this verification file.
    expect(packagingTestFiles.length).toBeGreaterThanOrEqual(7);
    for (const name of packagingTestFiles) {
      // The boundary must live in the file header — before any test runs —
      // so no reader can mistake shape or gating coverage for recognition
      // evidence (R-TEST-5).
      const content = readFileSync(path.join(TESTS_DIR, name), "utf8");
      const header = content.slice(0, content.indexOf("describe("));
      expect(header, `${name} must state the R-TEST-5 boundary in its header`)
        .toContain("R-TEST-5");
      expect(header, `${name} must name recognition evidence as W18 R9-owned`)
        .toMatch(/recognition/);
      expect(header, `${name} must reference the W18 R9 conformance owner`)
        .toContain("W18 R9");
    }
  });
});
