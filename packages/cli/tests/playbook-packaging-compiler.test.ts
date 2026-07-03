/**
 * W18 R8 P2 compiler coverage: the multi-file harness-native distributable
 * inventory (R-COMP-1/R-COMP-3, R-TEST-1/R-TEST-2 shape assertions), the
 * exposure-plumbing reuse (R-COMP-2), two-tier generation with recorded
 * provenance and fail-before-write (R-GEN-1/R-GEN-2), and per-kind dependency
 * materialization (R-DEPMAT-1, R-TEST-4).
 *
 * These are SHAPE assertions only: real-harness recognition, installation,
 * and invocation evidence is owned by the W18 R9 conformance lineage, and
 * nothing here may be read as proof that a harness recognizes the output
 * (R-TEST-5).
 */

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { createManifest, loadManifest, writeManifest } from "../src/manifest";
import {
  CODEX_HARNESS_CAPABILITY_DESCRIPTOR,
  compilePackageInventory,
  createPlaybookPackagePlan,
  skillDescriptionProposalField,
  writePlaybookPackageOutputs,
} from "../src/operations";
import type {
  PlaybookPackagePlan,
  PlaybookPackageTarget,
} from "../src/operations";
import { operationCliPath } from "../src/operations/registry";
import { parseAndValidatePlaybook } from "../src/playbook";
import { defaultSelections, resolveInstallProfile } from "../src/profile";
import { createEmptySystemAssetManifestState } from "../src/system-assets";
import { cleanupTempDir, createTempDir } from "./helpers";

const SUPPORT_EVIDENCE_REF = "docs/prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md";
const CODEX_PLUGIN_PRECONDITIONS = {
  "harness-supported": "satisfied",
  "project-trusted": "satisfied",
  "symlink-or-copy-mirror": "satisfied",
} as const;
const CLAUDE_CODE_PRECONDITIONS = {
  "harness-supported": "satisfied",
  "plugin-or-skill-support": "satisfied",
  "symlink-or-copy-mirror": "satisfied",
} as const;

function writeFile(root: string, relativePath: string, content: string): string {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
  return absolutePath;
}

const writeFileDeep = writeFile;

function writeMakeDocsManifest(root: string): void {
  writeManifest(
    root,
    createManifest(
      { name: "@brucewaynedecoy/make-docs", version: "0.0.0-test" },
      resolveInstallProfile(defaultSelections()),
      {},
      [],
      createEmptySystemAssetManifestState(),
      "playbook-packaging-compiler-test",
    ),
  );
}

function richPlaybookDocument(input: {
  title: string;
  persona: string;
  summary?: string | null;
  workflowSteps?: string[];
  dependencyRows?: string[];
}): string {
  const steps = input.workflowSteps ?? [
    "  - id: guard-tools",
    "    title: Guard tool calls",
    "    executor: agent",
    "    role: check",
    "    activation: event-bound",
    "    event: on-pre-tool-use",
    "    uses: [context-server]",
    "    instructions: Guard the tool call before it runs.",
    "  - id: catalog",
    "    title: Catalog the playbooks",
    "    executor: cli",
    "    role: activity",
    "    activation: sequential",
    "    uses: [make-docs-cli]",
    "    operation: playbook.catalog",
    "  - id: review-gate",
    "    title: Review gate",
    "    executor: human",
    "    role: gate",
    "    activation: sequential",
    "    instructions: Review the catalog output before continuing.",
    "    gate:",
    "      resolved_by: maintainer",
    "      evidence: reviewed catalog listing",
    "      unattended: false",
    "    safety:",
    "      mutation_surfaces: [docs/assets/archive/history]",
    "      approval: explicit maintainer approval",
    "      rollback: git checkout the touched files",
  ];
  const dependencyRows = input.dependencyRows ?? [
    "| make-docs-cli | cli | required | playbook.catalog | catalog | none |",
    "| ripgrep | cli | optional | rg | catalog | grep |",
    "| node-packages | package-manager | required | npm | catalog | none |",
    "| context-server | mcp | preferred | context-mode | guard-tools | continue without extra context |",
    "| issue-tracker | external-service | optional | https://example.test/api | review-gate | manual updates |",
    "| review-guide | reference | required | .make-docs/contracts/system/example.md | review-gate | none |",
    "| style-notes | reference | preferred | https://example.test/style-notes | review-gate | none |",
    "| commit-helper | skill | preferred | commit-helper | review-gate | manual commit |",
    "| formatter-plugin | plugin | optional | prettier-plugin | review-gate | manual formatting |",
    "| child-run | playbook | optional | user/child-run | review-gate | skip |",
  ];
  return [
    "---",
    `title: ${input.title}`,
    "kind: playbook",
    "status: accepted",
    `persona: ${input.persona}`,
    "stack: run",
    ...(input.summary === null ? [] : [`summary: ${input.summary ?? `${input.title} summary.`}`]),
    "schemaVersion: make-docs.playbook.v1",
    "workflowSchemaVersion: make-docs.workflow.v1",
    "---",
    "",
    `# ${input.title}`,
    "",
    "## Purpose",
    "",
    `Carry the ${input.title} workflow intent end to end.`,
    "",
    "## When To Use",
    "",
    "Use when a reviewed catalog pass is required before packaging.",
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
    "  id: compiler-fixture",
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
    "Stop at the review gate until the maintainer approves.",
    "",
    "## Outputs And Handoff",
    "",
    "A reviewed catalog record.",
    "",
    "## Validation",
    "",
    "Confirm the catalog output was reviewed.",
    "",
    "## Packaging Notes",
    "",
    "No packaging hints.",
    "",
  ].join("\n");
}

function writeRichPlaybook(
  root: string,
  persona: string,
  slug: string,
  title: string,
  options: { summary?: string | null; workflowSteps?: string[]; dependencyRows?: string[] } = {},
): void {
  writeFileDeep(
    root,
    `docs/assets/playbooks/${persona}/${slug}.playbook.md`,
    richPlaybookDocument({ title, persona, ...options }),
  );
}

function codexPluginTarget(scope: PlaybookPackageTarget["scope"] = "project"): PlaybookPackageTarget {
  return { harness: "codex", outputKind: "plugin", surface: "native", scope };
}

function setupRichRepo(root: string): void {
  writeMakeDocsManifest(root);
  writeFileDeep(root, ".make-docs/contracts/system/example.md", "# Example Contract\n\nAuthority text.\n");
  writeRichPlaybook(root, "user", "rich-stack", "Rich Stack");
}

function planRichCodexPlugin(root: string): PlaybookPackagePlan {
  return createPlaybookPackagePlan({
    repoRoot: root,
    refs: ["user/rich-stack"],
    target: codexPluginTarget(),
    supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
    // Codex declares no hook support; the event-bound step degrades to a
    // documented skill instruction rather than failing closed (R-CAP-4).
    unsupportedPrimitivePolicy: "degrade",
  }).plan;
}

describe("packaging compiler distributable inventory (W18 R8 P2)", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    while (tempRoots.length > 0) {
      cleanupTempDir(tempRoots.pop()!);
    }
  });

  test("emits a multi-file harness-native tree and never a Make Docs descriptor payload (R-TEST-1, R-TEST-2)", () => {
    const root = createTempDir("make-docs-compiler-tree-");
    tempRoots.push(root);
    setupRichRepo(root);
    const plan = planRichCodexPlugin(root);

    const result = writePlaybookPackageOutputs({
      repoRoot: root,
      plan,
      write: true,
      preconditions: CODEX_PLUGIN_PRECONDITIONS,
    });

    expect(result.status).toBe("written");
    // Multi-file tree, not a single payload file.
    expect(result.payloadFiles.length).toBeGreaterThan(5);
    expect(result.canonicalPath).toBe(".make-docs/agentics/plugins/rich-stack");
    // The verified Codex plugin shape: a folder containing
    // `.codex-plugin/plugin.json` plus a marketplace registration file
    // (R-ADAPT-2; shape only, not recognition evidence — R-TEST-5).
    expect(result.payloadFiles).toEqual(expect.arrayContaining([
      ".codex-plugin/plugin.json",
      "skills/rich-stack/SKILL.md",
      "registration/marketplace.json",
      ".make-docs/provenance.json",
      ".make-docs/lifecycle.json",
      ".make-docs/conformance.json",
      ".make-docs/dependencies.json",
      ".make-docs/registration.json",
    ]));
    // R-COMP-1: no output file is a Make Docs descriptor; nothing carries a
    // Make Docs kind as its manifest type.
    for (const relativePath of result.payloadFiles) {
      const content = readFileSync(path.join(root, result.canonicalPath, relativePath), "utf8");
      expect(content).not.toContain("\"kind\": \"make-docs");
    }
    const harnessManifest = JSON.parse(readFileSync(
      path.join(root, result.canonicalPath, ".codex-plugin/plugin.json"),
      "utf8",
    )) as Record<string, unknown>;
    expect(harnessManifest.name).toBe("rich-stack");
    expect(harnessManifest.skills).toEqual([
      { id: "rich-stack", path: "skills/rich-stack/SKILL.md" },
    ]);
    // The symlink exposure exposes the whole harness-native folder at the
    // Codex plugin path (R-COMP-2 plumbing unchanged).
    expect(readFileSync(
      path.join(root, ".codex/plugins/rich-stack/.codex-plugin/plugin.json"),
      "utf8",
    )).toContain("\"name\": \"rich-stack\"");
  });

  test("preserves skill intent, triggers, step instructions, references, and safety boundaries (R-COMP-3)", () => {
    const root = createTempDir("make-docs-compiler-skill-");
    tempRoots.push(root);
    setupRichRepo(root);
    const plan = planRichCodexPlugin(root);

    writePlaybookPackageOutputs({
      repoRoot: root,
      plan,
      write: true,
      preconditions: CODEX_PLUGIN_PRECONDITIONS,
    });

    const skill = readFileSync(
      path.join(root, ".make-docs/agentics/plugins/rich-stack/skills/rich-stack/SKILL.md"),
      "utf8",
    );
    // Frontmatter identity and trigger description.
    expect(skill).toContain("name: rich-stack");
    expect(skill).toContain("description: \"Rich Stack summary.\"");
    // Workflow intent and when-to-use narrative, extracted, not summarized away.
    expect(skill).toContain("Carry the Rich Stack workflow intent end to end.");
    expect(skill).toContain("Use when a reviewed catalog pass is required before packaging.");
    // Step instructions preserved verbatim.
    expect(skill).toContain("Guard the tool call before it runs.");
    expect(skill).toContain("Review the catalog output before continuing.");
    // Operation steps carry the stable identifier; the CLI form is derived.
    expect(skill).toContain("`playbook.catalog`");
    expect(skill).toContain(`make-docs run ${operationCliPath("playbook.catalog")}`);
    // Gate semantics and safety boundaries.
    expect(skill).toContain("resolved by maintainer");
    expect(skill).toContain("mutates docs/assets/archive/history");
    expect(skill).toContain("rollback: git checkout the touched files");
    // References: copied authority sources link into the tree, external
    // sources stay links (R-DEPMAT-1 `reference`).
    expect(skill).toContain("[review-guide](../../references/review-guide/example.md)");
    expect(skill).toContain("style-notes: https://example.test/style-notes");
    // The degraded event-bound step is declared in the skill text (R-CAP-4/R-CAP-5).
    expect(skill).toContain("degrades to a documented skill instruction");
  });

  test("materializes every dependency kind per R-DEPMAT-1 (R-TEST-4)", () => {
    const root = createTempDir("make-docs-compiler-depmat-");
    tempRoots.push(root);
    setupRichRepo(root);
    const plan = planRichCodexPlugin(root);

    const result = writePlaybookPackageOutputs({
      repoRoot: root,
      plan,
      write: true,
      preconditions: CODEX_PLUGIN_PRECONDITIONS,
    });
    const canonical = path.join(root, result.canonicalPath);

    // cli on Make Docs itself: the stable operation identifier is the
    // reference; the human command is derived from the registry at compile
    // time and would survive CLI reorganization (R-DEPMAT-1, R-SCOPE-1).
    const makeDocsCheck = readFileSync(path.join(canonical, "checks/make-docs-cli.sh"), "utf8");
    expect(makeDocsCheck).toContain("# stable-reference: operation:playbook.catalog");
    expect(makeDocsCheck).toContain(`make-docs run ${operationCliPath("playbook.catalog")}`);
    expect(statSync(path.join(canonical, "checks/make-docs-cli.sh")).mode & 0o111).not.toBe(0);
    // Plain cli and package-manager: deterministic check scripts.
    expect(readFileSync(path.join(canonical, "checks/ripgrep.sh"), "utf8")).toContain("command -v rg");
    expect(readFileSync(path.join(canonical, "checks/node-packages.sh"), "utf8")).toContain("command -v npm");
    // mcp and external-service: Make Docs metadata plus a runtime availability check.
    const mcpCheck = readFileSync(path.join(canonical, "checks/context-server.sh"), "utf8");
    expect(mcpCheck).toContain("MAKE_DOCS_DEP_CONTEXT_SERVER_AVAILABLE");
    expect(mcpCheck).toContain("exit 3");
    const declarations = JSON.parse(
      readFileSync(path.join(canonical, ".make-docs/dependencies.json"), "utf8"),
    ) as { dependencies: Array<Record<string, unknown>> };
    const byId = new Map(declarations.dependencies.map((entry) => [entry.id, entry]));
    expect(byId.get("context-server")).toMatchObject({
      disposition: "metadata-with-runtime-check",
      metadata: { runtimeCheck: { type: "mcp-server-available", target: "context-mode" } },
    });
    expect(byId.get("issue-tracker")).toMatchObject({
      disposition: "metadata-with-runtime-check",
      metadata: {
        runtimeCheck: { type: "external-service-available", target: "https://example.test/api" },
      },
    });
    // skill and plugin: harness-native manifest references where supported.
    expect(byId.get("commit-helper")).toMatchObject({
      disposition: "manifest-reference",
      manifestReference: { section: "skills", id: "commit-helper" },
    });
    expect(byId.get("formatter-plugin")).toMatchObject({
      disposition: "manifest-reference",
      manifestReference: { section: "plugins", id: "prettier-plugin" },
    });
    const harnessManifest = JSON.parse(
      readFileSync(path.join(canonical, ".codex-plugin/plugin.json"), "utf8"),
    ) as { dependencies?: { skills?: string[]; plugins?: string[] }; mcpServers?: unknown[] };
    expect(harnessManifest.dependencies?.skills).toEqual(["commit-helper"]);
    expect(harnessManifest.dependencies?.plugins).toEqual(["prettier-plugin"]);
    expect(harnessManifest.mcpServers).toEqual([{ id: "context-server", source: "context-mode" }]);
    // reference: copied where redistribution is allowed, linked otherwise.
    expect(readFileSync(path.join(canonical, "references/review-guide/example.md"), "utf8"))
      .toContain("Authority text.");
    expect(byId.get("style-notes")).toMatchObject({ disposition: "linked-reference" });
    // playbook not bundled here: referenced, not included.
    expect(byId.get("child-run")).toMatchObject({ disposition: "referenced-playbook" });
    // The stable operation reference also rides the metadata record.
    expect(byId.get("make-docs-cli")).toMatchObject({ operation: "playbook.catalog" });
  });

  test("bundles playbook dependencies as additional skills when bundled (R-DEPMAT-1)", () => {
    const root = createTempDir("make-docs-compiler-bundle-");
    tempRoots.push(root);
    writeMakeDocsManifest(root);
    writeFileDeep(root, ".make-docs/contracts/system/example.md", "# Example\n");
    writeRichPlaybook(root, "user", "parent-run", "Parent Run", {
      workflowSteps: [
        "  - id: delegate",
        "    title: Delegate to the child playbook",
        "    executor: child-playbook",
        "    role: activity",
        "    activation: sequential",
        "    uses: [child-run]",
        "    instructions: Run the child playbook.",
      ],
      dependencyRows: ["| child-run | playbook | required | user/child-run | delegate | none |"],
    });
    writeRichPlaybook(root, "user", "child-run", "Child Run", {
      workflowSteps: [
        "  - id: do-work",
        "    title: Do the child work",
        "    executor: agent",
        "    role: activity",
        "    activation: sequential",
        "    instructions: Do the child work.",
      ],
      dependencyRows: ["| conventions | reference | optional | contracts | do-work | none |"],
    });

    const plan = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/parent-run", "user/child-run"],
      target: { harness: "claude-code", outputKind: "skills-bundle", surface: "agents-standard", scope: "project" },
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
      summary: "Parent and child playbooks bundled together.",
    }).plan;
    const result = writePlaybookPackageOutputs({
      repoRoot: root,
      plan,
      write: true,
      preconditions: CLAUDE_CODE_PRECONDITIONS,
    });

    expect(result.status).toBe("written");
    // A multi-skill portable bundle: root index skill plus one skill per
    // Playbook (authoring granularity is one skill per Playbook, R-CAP-3).
    expect(result.payloadFiles).toEqual(expect.arrayContaining([
      "SKILL.md",
      "parent-run/SKILL.md",
      "child-run/SKILL.md",
    ]));
    const declarations = JSON.parse(readFileSync(
      path.join(root, result.canonicalPath, ".make-docs/dependencies.json"),
      "utf8",
    )) as { dependencies: Array<Record<string, unknown>> };
    const childDep = declarations.dependencies.find((entry) => entry.id === "child-run");
    expect(childDep).toMatchObject({
      disposition: "bundled-skill",
      metadata: { bundledSkillId: "child-run" },
    });
  });

  test("degrades skill and plugin dependencies explicitly where the container has no manifest (R-DEPMAT-1, R-CAP-4)", () => {
    const root = createTempDir("make-docs-compiler-degrade-");
    tempRoots.push(root);
    writeMakeDocsManifest(root);
    writeFileDeep(root, ".make-docs/contracts/system/example.md", "# Example\n");
    writeRichPlaybook(root, "user", "lean-stack", "Lean Stack", {
      workflowSteps: [
        "  - id: work",
        "    title: Work",
        "    executor: agent",
        "    role: activity",
        "    activation: sequential",
        "    uses: [commit-helper]",
        "    instructions: Do the work.",
      ],
      dependencyRows: [
        "| commit-helper | skill | preferred | commit-helper | work | manual commit |",
      ],
    });

    const plan = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/lean-stack"],
      target: { harness: "claude-code", outputKind: "skills-bundle", surface: "agents-standard", scope: "project" },
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
    }).plan;
    const result = writePlaybookPackageOutputs({
      repoRoot: root,
      plan,
      write: true,
      preconditions: CLAUDE_CODE_PRECONDITIONS,
    });

    expect(result.status).toBe("written");
    // The portable skills directory has no harness manifest: the dependency
    // degrades to a declared, documented manual step — never silently.
    const declarations = JSON.parse(readFileSync(
      path.join(root, result.canonicalPath, ".make-docs/dependencies.json"),
      "utf8",
    )) as { dependencies: Array<Record<string, unknown>> };
    expect(declarations.dependencies[0]).toMatchObject({
      id: "commit-helper",
      disposition: "declared-degradation",
    });
    expect(String(declarations.dependencies[0]!.declaration)).toContain("degrades to a documented manual step");
    const skill = readFileSync(path.join(root, result.canonicalPath, "SKILL.md"), "utf8");
    expect(skill).toContain("Manual step: install the `commit-helper` skill");
    expect(skill).toContain("Declared degradation:");
  });

  test("compiles event-bound steps to hook points where the descriptor maps them (R-CAP-5)", () => {
    const root = createTempDir("make-docs-compiler-hooks-");
    tempRoots.push(root);
    setupRichRepo(root);
    const plan = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/rich-stack"],
      target: { harness: "claude-code", outputKind: "plugin", surface: "native", scope: "project" },
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
    }).plan;

    const result = writePlaybookPackageOutputs({
      repoRoot: root,
      plan,
      write: true,
      preconditions: CLAUDE_CODE_PRECONDITIONS,
    });

    expect(result.status).toBe("written");
    const hooks = JSON.parse(readFileSync(
      path.join(root, result.canonicalPath, "hooks/hooks.json"),
      "utf8",
    )) as { hooks: Array<Record<string, unknown>> };
    expect(hooks.hooks).toEqual([
      expect.objectContaining({
        hookPoint: "PreToolUse",
        event: "on-pre-tool-use",
        stepId: "guard-tools",
        instructions: "Guard the tool call before it runs.",
      }),
    ]);
    const manifest = JSON.parse(readFileSync(
      path.join(root, result.canonicalPath, "plugin.json"),
      "utf8",
    )) as Record<string, unknown>;
    expect(manifest.hooks).toBe("hooks/hooks.json");
  });

  test("records the two-tier generation boundary in field provenance and the provenance record (R-GEN-1)", () => {
    const root = createTempDir("make-docs-compiler-tiers-");
    tempRoots.push(root);
    setupRichRepo(root);
    const plan = planRichCodexPlugin(root);

    expect(plan.fieldProvenance).toMatchObject({
      inventory: "deterministic",
      manifestStructure: "deterministic",
      dependencyChecks: "deterministic",
      digests: "deterministic",
      "skills.rich-stack.description": "deterministic",
    });

    const result = writePlaybookPackageOutputs({
      repoRoot: root,
      plan,
      write: true,
      preconditions: CODEX_PLUGIN_PRECONDITIONS,
    });
    const provenance = JSON.parse(readFileSync(
      path.join(root, result.canonicalPath, ".make-docs/provenance.json"),
      "utf8",
    )) as {
      generationTiers: Record<string, string[]>;
      generatedFiles: string[];
      adapterId: string;
      profile: string;
      outputKind: string;
      supportStatus: string;
      sources: Array<{ ref: string; digest: string }>;
    };
    expect(provenance.adapterId).toBe("codex");
    expect(provenance.profile).toBe("native");
    expect(provenance.outputKind).toBe("plugin");
    expect(provenance.sources[0]).toMatchObject({
      ref: "user/rich-stack",
      digest: expect.stringMatching(/^sha256:/),
    });
    expect(provenance.generationTiers.deterministic).toEqual(expect.arrayContaining([
      "inventory",
      "manifestStructure",
      "dependencyChecks",
      "digests",
    ]));
    expect(provenance.generatedFiles).toEqual(expect.arrayContaining(result.payloadFiles));
  });

  test("routes missing skill descriptions through review-gated proposals that gain authority on acceptance (R-GEN-1)", () => {
    // The run-resolution catalog already requires a frontmatter summary, so a
    // summary-less skill reaches the compiler only through a hand-carried
    // plan; the compiler must still gate its description on plan acceptance.
    const root = createTempDir("make-docs-compiler-proposal-");
    tempRoots.push(root);
    const sourceText = "# Quiet Stack\n\n## Purpose\n\nQuiet workflow.\n";
    const source = {
      ref: "user/quiet-stack",
      path: "docs/assets/playbooks/user/quiet-stack.md",
      persona: "user",
      slug: "quiet-stack",
      stack: "run" as const,
      sourceDigest: "sha256:test",
      title: "Quiet Stack",
    };
    const compiled = {
      source,
      model: parseAndValidatePlaybook({ sourcePath: source.path, source: sourceText }).model,
      sourceText,
    };
    const proposal = {
      field: skillDescriptionProposalField("quiet-stack"),
      value: "Use the Quiet Stack workflow from the user/quiet-stack Playbook.",
      reason: "The source Playbook has no authored summary.",
    };
    const basePlan: PlaybookPackagePlan = {
      schemaVersion: 1,
      packageId: "quiet-stack",
      title: "Quiet Stack",
      summary: "Quiet Stack package.",
      sources: [source],
      target: codexPluginTarget(),
      generatedArtifacts: [
        {
          path: ".make-docs/agentics/plugins/quiet-stack",
          recordKind: "generated-plugin",
          outputKind: "plugin",
          surface: "native",
          sourceRefs: [source.ref],
        },
      ],
      deterministicDerivations: {},
      agentAssistedProposals: [proposal],
      unresolvedDecisions: [],
      fieldProvenance: { [proposal.field]: "agent-proposed" },
      review: { required: true, status: "required" },
      support: { status: "provisional", evidenceRefs: [] },
      lifecycle: {
        backupBeforeOverwrite: true,
        uninstallDisposition: "preserve-for-review",
        preservesUserModifiedFiles: true,
      },
      validationRequirements: ["package-plan-review"],
    };

    // Unresolved semantic decision: the compiler fails closed before writes (R-GEN-2).
    const pending = compilePackageInventory({
      repoRoot: root,
      plan: basePlan,
      descriptor: CODEX_HARNESS_CAPABILITY_DESCRIPTOR,
      sources: [compiled],
    });
    expect(pending.stops).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: "semantic-review-required" }),
    ]));

    // On plan acceptance the proposal gains authority and compiles into the
    // skill description, recorded as agent-proposed tier content.
    const approved = compilePackageInventory({
      repoRoot: root,
      plan: {
        ...basePlan,
        review: { required: true, status: "approved", reviewedBy: "maintainer" },
      },
      descriptor: CODEX_HARNESS_CAPABILITY_DESCRIPTOR,
      sources: [compiled],
    });
    expect(approved.stops).toEqual([]);
    const skillFile = approved.files.find((file) => file.path === "skills/quiet-stack/SKILL.md")!;
    expect(skillFile.tier).toBe("agent-proposed");
    expect(skillFile.content).toContain(
      "Use the Quiet Stack workflow from the user/quiet-stack Playbook.",
    );
  });

  test("fails closed before any write on missing required references and stale sources (R-GEN-2)", () => {
    const root = createTempDir("make-docs-compiler-failclosed-");
    tempRoots.push(root);
    writeMakeDocsManifest(root);
    writeFileDeep(root, ".make-docs/contracts/system/example.md", "# Example\n");
    // Missing required reference: the plan itself carries the stop.
    writeRichPlaybook(root, "user", "missing-ref", "Missing Ref", {
      workflowSteps: [
        "  - id: work",
        "    title: Work",
        "    executor: agent",
        "    role: activity",
        "    activation: sequential",
        "    uses: [gone-guide]",
        "    instructions: Do the work.",
      ],
      dependencyRows: ["| gone-guide | reference | required | docs/never/was-here.md | work | none |"],
    });
    const missing = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/missing-ref"],
      target: codexPluginTarget(),
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
    });
    expect(missing.status).toBe("manual-review-required");
    expect(missing.stops).toEqual(expect.arrayContaining([
      expect.objectContaining({
        reason: "unresolved-target",
        message: expect.stringContaining("gone-guide"),
      }),
    ]));
    expect(() => writePlaybookPackageOutputs({
      repoRoot: root,
      plan: missing.plan,
      write: true,
      preconditions: CODEX_PLUGIN_PRECONDITIONS,
    })).toThrow("Playbook package write stopped");

    // Stale source: the reviewed plan's digests no longer match the file.
    writeRichPlaybook(root, "user", "drifting", "Drifting");
    const plan = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/drifting"],
      target: codexPluginTarget(),
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
      unsupportedPrimitivePolicy: "degrade",
    }).plan;
    writeFile(
      root,
      "docs/assets/playbooks/user/drifting.playbook.md",
      `${richPlaybookDocument({ title: "Drifting", persona: "user" })}\nEdited after planning.\n`,
    );
    const stale = writePlaybookPackageOutputs({
      repoRoot: root,
      plan,
      preconditions: CODEX_PLUGIN_PRECONDITIONS,
    });
    expect(stale.stops).toEqual(expect.arrayContaining([
      expect.objectContaining({
        reason: "manual-review-required",
        message: expect.stringContaining("digest mismatch"),
      }),
    ]));
    expect(() => writePlaybookPackageOutputs({
      repoRoot: root,
      plan,
      write: true,
      preconditions: CODEX_PLUGIN_PRECONDITIONS,
    })).toThrow("Playbook package write stopped");
    expect(existsSync(path.join(root, ".make-docs/agentics/plugins/drifting"))).toBe(false);
  });

  test("keeps the PRD 28 plumbing: per-file ownership records for canonical payload and copy mirrors (R-COMP-2)", () => {
    const root = createTempDir("make-docs-compiler-plumbing-");
    tempRoots.push(root);
    setupRichRepo(root);
    const plan = planRichCodexPlugin(root);
    const result = writePlaybookPackageOutputs({
      repoRoot: root,
      plan,
      write: true,
      preconditions: CODEX_PLUGIN_PRECONDITIONS,
    });

    const manifest = loadManifest(root)!;
    // Every canonical payload file carries an ownership record so uninstall
    // removes only Make Docs-owned outputs (R-PROV-1, R-PROV-2).
    for (const relativePath of result.payloadFiles) {
      const entry = manifest.files[`${result.canonicalPath}/${relativePath}`];
      expect(entry?.agenticOwnership).toMatchObject({
        artifactKind: "plugin",
        role: "plugin-payload",
        id: "rich-stack",
        sourceManifest: "make-docs.playbook-packaging",
        canonicalPayloadPath: `${result.canonicalPath}/${relativePath}`,
      });
    }
    // The symlink exposure keeps the W18 R5 directory-entry shape.
    expect(manifest.files[".codex/plugins/rich-stack"]?.agenticOwnership).toMatchObject({
      role: "plugin-native-exposure",
      pathKind: "directory",
      exposureMode: "symlink",
      canonicalPayloadPath: result.canonicalPath,
    });

    // Copy-mirror exposure mirrors the whole tree with per-file records.
    const mirrorRoot = createTempDir("make-docs-compiler-mirror-");
    tempRoots.push(mirrorRoot);
    setupRichRepo(mirrorRoot);
    const mirrorPlan = planRichCodexPlugin(mirrorRoot);
    const mirrored = writePlaybookPackageOutputs({
      repoRoot: mirrorRoot,
      plan: mirrorPlan,
      write: true,
      platform: "windows",
      symlinkAvailable: false,
      preconditions: CODEX_PLUGIN_PRECONDITIONS,
    });
    expect(mirrored.exposureMode).toBe("copy-mirror");
    expect(readFileSync(
      path.join(mirrorRoot, ".codex/plugins/rich-stack/.codex-plugin/plugin.json"),
      "utf8",
    )).toContain("\"name\": \"rich-stack\"");
    const mirrorManifest = loadManifest(mirrorRoot)!;
    expect(
      mirrorManifest.files[".codex/plugins/rich-stack/.codex-plugin/plugin.json"]?.agenticOwnership,
    ).toMatchObject({
      role: "plugin-copy-mirror",
      exposureMode: "copy-mirror",
      canonicalPayloadPath: `${mirrored.canonicalPath}/.codex-plugin/plugin.json`,
    });
  });

  test("generates registration files without auto-registering (R-MKT-1)", () => {
    const root = createTempDir("make-docs-compiler-registration-");
    tempRoots.push(root);
    setupRichRepo(root);
    const plan = planRichCodexPlugin(root);
    const result = writePlaybookPackageOutputs({
      repoRoot: root,
      plan,
      write: true,
      preconditions: CODEX_PLUGIN_PRECONDITIONS,
    });

    const marketplace = JSON.parse(readFileSync(
      path.join(root, result.canonicalPath, "registration/marketplace.json"),
      "utf8",
    )) as { plugins: Array<Record<string, unknown>> };
    expect(marketplace.plugins[0]).toMatchObject({ id: "rich-stack" });
    const registration = JSON.parse(readFileSync(
      path.join(root, result.canonicalPath, ".make-docs/registration.json"),
      "utf8",
    )) as { autoRegister: boolean; files: Array<Record<string, unknown>> };
    expect(registration.autoRegister).toBe(false);
    expect(registration.files[0]).toMatchObject({
      generatedAt: "registration/marketplace.json",
      installAt: ".agents/plugins/marketplace.json",
    });
    // The user's marketplace file is never touched: only the generated copy
    // inside the distributable exists (the seam itself is Phase 4).
    expect(existsSync(path.join(root, ".agents/plugins/marketplace.json"))).toBe(false);
  });
});
