/**
 * W18 R8 P4 Stage 2/3 coverage: provenance, ownership classification, and
 * backup/uninstall safety for the multi-file harness-native payloads.
 *
 * - t4 (R-PROV-1): every generated artifact carries Playbook provenance —
 *   source ref and digest, package profile, adapter id, output kind,
 *   generated files, ownership status, and support status — queryable through
 *   the manifest and audit surfaces, not only the in-tree provenance record.
 * - t5 (R-KEEP-1): manifest and audit records keep distinguishing the seven
 *   W18 R5 classifications for the new payload shape, and generated outputs
 *   never masquerade as Playbook source.
 * - t6 (R-PROV-2): backup and uninstall stay scoped to Make Docs-owned
 *   generated outputs, without orphaning empty managed directories or
 *   deleting user-authored files.
 * - t7 (R-PROV-2, R-SCOPE-1): the backup/uninstall cleanliness PROOF is a
 *   conformance scenario owned by the W18 R9 design; the dependency is
 *   referenced in the conformance record, never reimplemented here.
 * - t8 (R-PROV-3): support claims bind to the exact tuple (scenario, harness,
 *   surface, scope, output kind, model/provider, runtime) and stay
 *   provisional until conformance evidence binds every dimension.
 *
 * These are SHAPE and lifecycle assertions only; real-harness recognition,
 * installation, and invocation evidence is owned by W18 R9 (R-TEST-5).
 *
 * Test layer: integration (R-LAYER-1) — automated repository tests over the
 * lifecycle surface through the manifest and exposure plumbing. Internal
 * tests passing is never evidence that a harness recognizes or can use the
 * output (R-LAYER-2).
 */

import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createAuditReport } from "../src/audit";
import { loadManifest, writeManifest } from "../src/manifest";
import {
  bindPackageSupportTuple,
  capSupportStatusForTupleBinding,
  createPlaybookPackagePlan,
  isPackageSupportTupleBound,
  listUnboundSupportTupleDimensions,
  writePlaybookPackageOutputs,
} from "../src/operations";
import type { PlaybookPackagePlan, PlaybookPackageWriteResult } from "../src/operations";
import { defaultSelections, resolveInstallProfile } from "../src/profile";
import { createEmptySystemAssetManifestState } from "../src/system-assets";
import { runUninstallCommand } from "../src/uninstall";
import { cleanupTempDir, createLegacyTestManifest, createTempDir, mockSkillFetches } from "./helpers";

const SUPPORT_EVIDENCE_REF =
  "docs/prd/36-playbook-packaging-compiler-and-harness-adapters.md";
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

function writeMakeDocsManifest(root: string): void {
  writeManifest(
    root,
    createLegacyTestManifest(
      { name: "@brucewaynedecoy/make-docs", version: "0.0.0-test" },
      resolveInstallProfile(defaultSelections()),
      {},
      [],
      createEmptySystemAssetManifestState(),
      "playbook-packaging-lifecycle-test",
    ),
  );
}

function writePlaybook(root: string, persona: string, slug: string, title: string): string {
  return writeFile(
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

function writeCodexPluginPackage(root: string): {
  plan: PlaybookPackagePlan;
  result: PlaybookPackageWriteResult;
} {
  writeMakeDocsManifest(root);
  writePlaybook(root, "user", "run-stack", "Run Stack");
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
    marketplaceAutoRegistration: false,
    preconditions: CODEX_PLUGIN_PRECONDITIONS,
  });
  expect(result.status).toBe("written");
  return { plan, result };
}

function writeClaudeSkillsBundle(root: string): {
  plan: PlaybookPackagePlan;
  result: PlaybookPackageWriteResult;
} {
  writeMakeDocsManifest(root);
  writePlaybook(root, "user", "run-stack", "Run Stack");
  const plan = createPlaybookPackagePlan({
    repoRoot: root,
    refs: ["user/run-stack"],
    target: {
      harness: "claude-code",
      outputKind: "skills-bundle",
      surface: "agents-standard",
      scope: "project",
    },
    supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
  }).plan;
  const result = writePlaybookPackageOutputs({
    repoRoot: root,
    plan,
    write: true,
    marketplaceAutoRegistration: false,
    preconditions: CLAUDE_CODE_PRECONDITIONS,
  });
  expect(result.status).toBe("written");
  return { plan, result };
}

async function captureUninstall(
  options: Parameters<typeof runUninstallCommand>[0],
): Promise<Awaited<ReturnType<typeof runUninstallCommand>>> {
  const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  try {
    return await runUninstallCommand(options);
  } finally {
    writeSpy.mockRestore();
  }
}

describe("per-artifact provenance through manifest and audit (t4, R-PROV-1)", () => {
  const tempRoots: string[] = [];

  beforeEach(() => {
    mockSkillFetches();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    while (tempRoots.length > 0) {
      cleanupTempDir(tempRoots.pop()!);
    }
  });

  test("manifest ownership records carry the full R-PROV-1 provenance per generated file", async () => {
    const root = createTempDir("make-docs-prov-");
    tempRoots.push(root);
    const { plan, result } = writeCodexPluginPackage(root);

    // The manifest round-trips through its validator, so provenance is a
    // durable, queryable manifest surface — not a write-time-only value.
    const manifest = loadManifest(root)!;
    const sourceDigest = plan.sources[0]!.sourceDigest;
    for (const payloadFile of result.payloadFiles) {
      const entry = manifest.files[`${result.canonicalPath}/${payloadFile}`];
      expect(entry?.agenticOwnership?.packaging).toMatchObject({
        packageId: "run-stack",
        profile: "native",
        adapterId: "codex",
        outputKind: "plugin",
        sourceRefs: ["user/run-stack"],
        sourceDigests: [sourceDigest],
        generatedFile: payloadFile,
        ownershipStatus: "make-docs-managed",
      });
      expect(entry?.agenticOwnership?.supportStatus).toBe("provisional");
    }
    const skillEntry =
      manifest.files[`${result.canonicalPath}/skills/run-stack/SKILL.md`];
    expect(skillEntry?.agenticOwnership?.packaging).toMatchObject({
      category: "skill",
      generationTier: "deterministic",
    });
    // The exposure record carries the same package provenance.
    expect(manifest.files[".codex/plugins/run-stack"]?.agenticOwnership?.packaging).toMatchObject({
      packageId: "run-stack",
      adapterId: "codex",
      category: "exposure",
      generatedFile: ".",
    });

    // Audit records embed the ownership metadata, so provenance is queryable
    // through the audit surface too.
    const report = await createAuditReport({ targetDir: root, manifest });
    const removable = report.removableFiles.find(
      (candidate) => candidate.path === `${result.canonicalPath}/.codex-plugin/plugin.json`,
    );
    expect(removable?.agenticOwnership?.packaging).toMatchObject({
      packageId: "run-stack",
      adapterId: "codex",
      outputKind: "plugin",
      category: "harness-manifest",
    });
  });

  test("the in-tree provenance record carries the exact R-PROV-1 field list plus per-file traceability", () => {
    const root = createTempDir("make-docs-prov-record-");
    tempRoots.push(root);
    const { plan, result } = writeCodexPluginPackage(root);

    const provenance = JSON.parse(readFileSync(
      path.join(root, result.canonicalPath, ".make-docs/provenance.json"),
      "utf8",
    )) as Record<string, unknown> & {
      sources: Array<{ ref: string; digest: string }>;
      generatedFiles: string[];
      files: Array<{ path: string; category: string; tier: string; sourceRefs: string[] }>;
    };
    // R-PROV-1's exact list: source ref and digest, package profile, adapter
    // id, output kind, generated files, ownership status, support status.
    expect(provenance.sources).toEqual([
      { ref: "user/run-stack", digest: plan.sources[0]!.sourceDigest },
    ]);
    expect(provenance.profile).toBe("native");
    expect(provenance.adapterId).toBe("codex");
    expect(provenance.outputKind).toBe("plugin");
    expect(provenance.generatedFiles).toEqual(
      expect.arrayContaining([...result.payloadFiles]),
    );
    expect(provenance.ownershipStatus).toBe("make-docs-managed");
    expect(provenance.supportStatus).toBe("provisional");
    // Per-artifact traceability: every generated file (records included) has
    // a category, generation tier, and source refs.
    for (const generatedFile of provenance.generatedFiles) {
      expect(provenance.files).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: generatedFile, sourceRefs: ["user/run-stack"] }),
      ]));
    }
    expect(provenance.files).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: ".codex-plugin/plugin.json",
        category: "harness-manifest",
        tier: "deterministic",
      }),
      expect.objectContaining({
        path: ".make-docs/conformance.json",
        category: "conformance-record",
      }),
    ]));
  });
});

describe("W18 R5 ownership classifications on the new payloads (t5, R-KEEP-1)", () => {
  const tempRoots: string[] = [];

  beforeEach(() => {
    mockSkillFetches();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    while (tempRoots.length > 0) {
      cleanupTempDir(tempRoots.pop()!);
    }
  });

  test("plugin payload, exposure, user, and modified files classify distinctly", async () => {
    const root = createTempDir("make-docs-classify-");
    tempRoots.push(root);
    const { result } = writeCodexPluginPackage(root);

    // Generated outputs never masquerade as Playbook source: the source stays
    // out of manifest ownership, while the write result distinguishes the
    // record kinds.
    const manifest = loadManifest(root)!;
    expect(manifest.files["docs/assets/playbooks/user/run-stack.md"]).toBeUndefined();
    expect(result.records.map((record) => record.recordKind)).toEqual([
      "source-playbook",
      "generated-plugin",
      "symlink-exposure",
    ]);

    // A user-authored file inside the managed container and a locally
    // modified generated file.
    writeFile(root, `${result.canonicalPath}/USER-NOTES.md`, "# Mine\n");
    writeFile(root, `${result.canonicalPath}/scripts-user-owned.sh`, "echo mine\n");
    const modifiedPath = `${result.canonicalPath}/registration/marketplace.json`;
    writeFile(root, modifiedPath, "{\"plugins\":[{\"id\":\"edited-by-user\"}]}\n");

    const report = await createAuditReport({ targetDir: root, manifest });
    const removableByPath = new Map(
      report.removableFiles.map((candidate) => [candidate.path, candidate]),
    );
    const preservedByPath = new Map(
      report.preservedPaths.map((candidate) => [candidate.path, candidate]),
    );

    // Clean generated payload files: removable as managed plugin content.
    expect(removableByPath.get(`${result.canonicalPath}/.codex-plugin/plugin.json`)?.reasonCode)
      .toBe("managed-plugin-file-content-match");
    expect(removableByPath.get(`${result.canonicalPath}/skills/run-stack/SKILL.md`)?.reasonCode)
      .toBe("managed-plugin-file-content-match");
    // The symlink exposure keeps its own classification.
    expect(removableByPath.get(".codex/plugins/run-stack")?.reasonCode)
      .toBe("managed-plugin-exposure-symlink-match");
    // The locally modified generated file is preserved, never removed.
    expect(preservedByPath.get(modifiedPath)?.reasonCode)
      .toBe("manifest-plugin-file-content-mismatch");
    // User-authored files are never removal candidates.
    expect(removableByPath.has(`${result.canonicalPath}/USER-NOTES.md`)).toBe(false);
    expect(removableByPath.has(`${result.canonicalPath}/scripts-user-owned.sh`)).toBe(false);
    // The source Playbook is never a removal candidate.
    expect(removableByPath.has("docs/assets/playbooks/user/run-stack.md")).toBe(false);
    // The container directory cannot be pruned while user files remain.
    expect(
      report.prunableDirectories.some((directory) => directory.path === result.canonicalPath),
    ).toBe(false);
  });

  test("skills-bundle payloads and symlink exposures classify and stay removable", async () => {
    const root = createTempDir("make-docs-classify-skills-");
    tempRoots.push(root);
    const { result } = writeClaudeSkillsBundle(root);

    expect(lstatSync(path.join(root, ".agents/skills/run-stack")).isSymbolicLink()).toBe(true);
    const manifest = loadManifest(root)!;
    const report = await createAuditReport({ targetDir: root, manifest });
    const removableByPath = new Map(
      report.removableFiles.map((candidate) => [candidate.path, candidate]),
    );

    // Canonical payload files: manifest-hash-matched managed files.
    expect(removableByPath.get(`${result.canonicalPath}/SKILL.md`)?.reasonCode)
      .toBe("managed-file-hash-match");
    // The skills-bundle exposure symlink classifies through its recorded
    // canonical payload target instead of being orphaned as "modified".
    expect(removableByPath.get(".agents/skills/run-stack")?.reasonCode)
      .toBe("managed-skill-exposure-symlink-match");
    // A retargeted exposure is preserved for review, not removed.
    const retargetedRoot = createTempDir("make-docs-classify-retarget-");
    tempRoots.push(retargetedRoot);
    writeClaudeSkillsBundle(retargetedRoot);
    const exposurePath = path.join(retargetedRoot, ".agents/skills/run-stack");
    const { symlinkSync, unlinkSync } = await import("node:fs");
    unlinkSync(exposurePath);
    mkdirSync(path.join(retargetedRoot, "elsewhere"), { recursive: true });
    symlinkSync(path.join(retargetedRoot, "elsewhere"), exposurePath, "dir");
    const retargetedReport = await createAuditReport({
      targetDir: retargetedRoot,
      manifest: loadManifest(retargetedRoot)!,
    });
    expect(
      retargetedReport.preservedPaths.find(
        (candidate) => candidate.path === ".agents/skills/run-stack",
      )?.reasonCode,
    ).toBe("manifest-skill-exposure-mismatch");
  });
});

describe("backup and uninstall scoped to owned outputs (t6, R-PROV-2)", () => {
  const tempRoots: string[] = [];

  beforeEach(() => {
    mockSkillFetches();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    while (tempRoots.length > 0) {
      cleanupTempDir(tempRoots.pop()!);
    }
  });

  test("uninstalling a written plugin package removes only owned files and keeps user content", async () => {
    const root = createTempDir("make-docs-uninstall-plugin-");
    tempRoots.push(root);
    const { result } = writeCodexPluginPackage(root);
    const userNotePath = `${result.canonicalPath}/USER-NOTES.md`;
    writeFile(root, userNotePath, "# Mine\n");

    const uninstall = await captureUninstall({
      targetDir: root,
      backup: true,
      permissions: "allow-all",
    });
    expect(uninstall.status).toBe("completed");
    if (uninstall.status !== "completed") {
      throw new Error("unreachable");
    }

    // Backup captured exactly the audited owned outputs, never user files or
    // Playbook source.
    const copied = uninstall.backupResult?.copiedFiles ?? [];
    expect(copied).toEqual(expect.arrayContaining([
      `${result.canonicalPath}/.codex-plugin/plugin.json`,
    ]));
    expect(copied).not.toContain(userNotePath);
    expect(copied).not.toContain("docs/assets/playbooks/user/run-stack.md");

    // Owned outputs removed: canonical payload and the harness exposure.
    expect(existsSync(path.join(root, result.canonicalPath, ".codex-plugin/plugin.json"))).toBe(false);
    expect(existsSync(path.join(root, ".codex/plugins/run-stack"))).toBe(false);
    // No orphaned empty managed directories at the harness path.
    expect(existsSync(path.join(root, ".codex"))).toBe(false);
    // User-authored content and the source Playbook are untouched, and the
    // directory that still holds user content is not deleted.
    expect(readFileSync(path.join(root, userNotePath), "utf8")).toBe("# Mine\n");
    expect(existsSync(path.join(root, "docs/assets/playbooks/user/run-stack.md"))).toBe(true);
  });

  test("uninstalling a clean skills bundle leaves no orphaned exposure or empty managed directory", async () => {
    const root = createTempDir("make-docs-uninstall-skills-");
    tempRoots.push(root);
    const { result } = writeClaudeSkillsBundle(root);
    expect(existsSync(path.join(root, ".agents/skills/run-stack"))).toBe(true);

    const uninstall = await captureUninstall({
      targetDir: root,
      backup: false,
      permissions: "allow-all",
    });
    expect(uninstall.status).toBe("completed");
    if (uninstall.status !== "completed") {
      throw new Error("unreachable");
    }

    expect(uninstall.removedFiles).toEqual(expect.arrayContaining([
      `${result.canonicalPath}/SKILL.md`,
      ".agents/skills/run-stack",
    ]));
    // The exposure symlink is gone and its parents are pruned rather than
    // orphaned empty.
    expect(existsSync(path.join(root, ".agents"))).toBe(false);
    // The canonical staging tree is pruned once its owned files are removed.
    expect(existsSync(path.join(root, ".make-docs/agentics"))).toBe(false);
    // The source Playbook survives.
    expect(existsSync(path.join(root, "docs/assets/playbooks/user/run-stack.md"))).toBe(true);
  });
});

describe("support claims bind to the exact tuple (t7, t8, R-PROV-2, R-PROV-3)", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    while (tempRoots.length > 0) {
      cleanupTempDir(tempRoots.pop()!);
    }
  });

  test("the tuple carries all seven dimensions and unbound dimensions cap the status", () => {
    const target = {
      harness: "codex",
      outputKind: "plugin",
      surface: "native",
      scope: "project",
    } as const;
    const unbound = bindPackageSupportTuple({ target });
    expect(unbound).toEqual({
      scenario: null,
      harness: "codex",
      surface: "native",
      scope: "project",
      outputKind: "plugin",
      modelOrProvider: null,
      runtime: null,
    });
    expect(listUnboundSupportTupleDimensions(unbound)).toEqual([
      "scenario",
      "modelOrProvider",
      "runtime",
    ]);
    expect(isPackageSupportTupleBound(unbound)).toBe(false);
    expect(capSupportStatusForTupleBinding("validated", unbound)).toBe("provisional");
    expect(capSupportStatusForTupleBinding("provisional", unbound)).toBe("provisional");

    // An auto surface counts as unbound until resolution.
    expect(listUnboundSupportTupleDimensions(
      bindPackageSupportTuple({ target: { ...target, surface: "auto" } }),
    )).toContain("surface");

    const bound = bindPackageSupportTuple({
      target,
      scenario: "w18-r9/codex-plugin-install-discover-invoke-uninstall",
      modelOrProvider: "anthropic",
      runtime: "codex-cli",
    });
    expect(isPackageSupportTupleBound(bound)).toBe(true);
    expect(capSupportStatusForTupleBinding("validated", bound)).toBe("validated");
  });

  test("a validated claim with an unbound tuple fails closed; a fully bound tuple passes the gate", () => {
    const root = createTempDir("make-docs-tuple-gate-");
    tempRoots.push(root);
    writeMakeDocsManifest(root);
    writePlaybook(root, "user", "run-stack", "Run Stack");
    const target = {
      harness: "codex",
      outputKind: "plugin",
      surface: "native",
      scope: "project",
    } as const;
    const plan = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/run-stack"],
      target,
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
    }).plan;
    // Planner-built claims stay provisional with the tuple recorded and its
    // evidence-owned dimensions declared unbound (t8 acceptance: no public
    // support wording ships from this work).
    expect(plan.support.status).toBe("provisional");
    expect(plan.support.tuple).toMatchObject({ scenario: null, modelOrProvider: null, runtime: null });

    // A hand-claimed validated status without a bound tuple fails closed even
    // against the verified Codex contract.
    const claimed: PlaybookPackagePlan = {
      ...plan,
      support: { ...plan.support, status: "validated" },
    };
    const stopped = writePlaybookPackageOutputs({
      repoRoot: root,
      plan: claimed,
      marketplaceAutoRegistration: false,
      preconditions: CODEX_PLUGIN_PRECONDITIONS,
    });
    expect(stopped.stops).toEqual(expect.arrayContaining([
      expect.objectContaining({
        reason: "missing-support-evidence",
        message: expect.stringContaining("tuple dimension(s) scenario, modelOrProvider, runtime"),
      }),
    ]));

    // Binding every dimension satisfies the tuple gate (the future W18 R9
    // promotion path); the conformance record then carries the bound tuple.
    const bound: PlaybookPackagePlan = {
      ...plan,
      support: {
        status: "validated",
        evidenceRefs: [SUPPORT_EVIDENCE_REF],
        tuple: bindPackageSupportTuple({
          target,
          scenario: "w18-r9/codex-plugin-install-discover-invoke-uninstall",
          modelOrProvider: "anthropic",
          runtime: "codex-cli",
        }),
      },
    };
    const result = writePlaybookPackageOutputs({
      repoRoot: root,
      plan: bound,
      write: true,
      marketplaceAutoRegistration: false,
      preconditions: CODEX_PLUGIN_PRECONDITIONS,
    });
    expect(result.status).toBe("written");
    const conformance = JSON.parse(readFileSync(
      path.join(root, result.canonicalPath, ".make-docs/conformance.json"),
      "utf8",
    )) as {
      tuple: Record<string, unknown>;
      tupleBinding: { unboundDimensions: string[] };
      cleanlinessScenario: { owner: string; requirement: string };
    };
    expect(conformance.tuple).toEqual({
      scenario: "w18-r9/codex-plugin-install-discover-invoke-uninstall",
      harness: "codex",
      surface: "native",
      scope: "project",
      outputKind: "plugin",
      modelOrProvider: "anthropic",
      runtime: "codex-cli",
    });
    expect(conformance.tupleBinding.unboundDimensions).toEqual([]);
  });

  test("the conformance record references the W18 R9 cleanliness scenario instead of defining it (t7)", () => {
    const root = createTempDir("make-docs-cleanliness-ref-");
    tempRoots.push(root);
    writeMakeDocsManifest(root);
    writePlaybook(root, "user", "run-stack", "Run Stack");
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
      marketplaceAutoRegistration: false,
      preconditions: CODEX_PLUGIN_PRECONDITIONS,
    });

    const conformance = JSON.parse(readFileSync(
      path.join(root, result.canonicalPath, ".make-docs/conformance.json"),
      "utf8",
    )) as {
      tuple: Record<string, unknown>;
      tupleBinding: { unboundDimensions: string[]; note: string };
      cleanlinessScenario: { owner: string; requirement: string };
      note: string;
    };
    // The default (unbound) tuple record carries all seven dimensions.
    expect(conformance.tuple).toEqual({
      scenario: null,
      harness: "codex",
      surface: "native",
      scope: "project",
      outputKind: "plugin",
      modelOrProvider: null,
      runtime: null,
    });
    expect(conformance.tupleBinding.unboundDimensions).toEqual([
      "scenario",
      "modelOrProvider",
      "runtime",
    ]);
    // t7: the R-PROV-2 cleanliness proof is referenced as W18 R9-owned.
    expect(conformance.cleanlinessScenario.owner).toContain(
      "43-conformance-scenario-model-and-execution-kits",
    );
    expect(conformance.cleanlinessScenario.requirement).toContain("without orphaning");
    expect(conformance.note).toContain("not harness-recognition evidence");
  });
});
