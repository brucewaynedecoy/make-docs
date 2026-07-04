/**
 * W18 R9 P4 coverage: support-claim governance (t1-t6, PRD 37 R-GOV-1..2).
 * The wording rule is code — public claim wording is DERIVED from the tuple
 * registry, never authored ahead of it — caveats surface in every claim
 * derived from a `pass-with-caveats` run, the lab's one-reviewed-run nominal
 * and repeated-reviewed-runs stronger thresholds are preserved, the W18 R5
 * through W18 R8 provisional claims promote only through the registry, and
 * the declared claim surfaces carry the rule and a registry-bound state
 * marker so wording advancement is mechanical. These checks run ENFORCING in
 * the standard suite following the Phase 3 meta-verification pattern.
 *
 * Test layer: unit (R-LAYER-1) — pure-function tests over the governance code
 * and the committed conformance assets and claim surfaces, no CLI. They prove
 * the WORDING machinery is honest — they are NEVER harness-recognition
 * evidence, and internal tests passing is never evidence that a harness
 * recognizes or can use the output (R-LAYER-2, PRD 36 R-TEST-5). Real
 * recognition, installation, and invocation evidence comes only from recorded
 * W18 R9 scenario runs meeting the R-BAR-1 bar.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import {
  CONFORMANCE_CLAIM_SURFACES,
  CONFORMANCE_CLAIM_SURFACE_SWEEP_ROOTS,
  CONFORMANCE_CLAIM_VOCABULARY_MARKER,
  SUPPORT_CLAIM_STRENGTHS,
  SUPPORT_CLAIM_STRENGTH_THRESHOLDS,
  SUPPORT_CLAIM_WORDING_RULE,
  SUPPORT_CLAIM_WORDING_RULE_CORE,
  bindConformanceSupportTuple,
  capSupportStatusForConformanceRegistry,
  conformanceTupleKey,
  deriveSupportClaimStrength,
  derivePackageSupportStatusCeilingFromRegistry,
  listCommittedResultRecordClaimUseErrors,
  listFirstPartyDescriptorPlacementTuples,
  listPackagingSupportRegistryAgreementErrors,
  listSupportClaimGovernanceErrors,
  loadConformanceTupleRegistry,
  loadPackagingConformanceScenarioSpecs,
  recordConformanceRunOnRegistryEntry,
  renderConformanceSupportClaim,
  renderSupportClaimStateMarker,
  validatePackagingConformanceResultRecord,
  type ConformanceRecordedRun,
  type ConformanceSupportTuple,
  type ConformanceTupleRegistryEntry,
  type PackagingConformanceResultRecord,
} from "../src/conformance";
import { bindPackageSupportTuple } from "../src/operations/playbook-packaging/support-binding";
import { TEMPLATE_ROOT } from "../src/utils";
import { cleanupTempDir, createTempDir } from "./helpers";

const REPO_ROOT = path.resolve(TEMPLATE_ROOT, "..", "..", "..");

function codexPluginTuple(): ConformanceSupportTuple {
  return bindConformanceSupportTuple({
    claim: bindPackageSupportTuple({
      target: { harness: "codex", outputKind: "plugin", surface: "native", scope: "project" },
    }),
    generatedOutputKind: "generated-plugin",
  });
}

function recordedRun(overrides: Partial<ConformanceRecordedRun> = {}): ConformanceRecordedRun {
  return {
    runId: "run-0001",
    scenario: "codex-plugin-marketplace-install",
    runDate: "2026-07-04",
    verdict: "pass",
    caveats: [],
    caveatsSurfaced: false,
    evidenceBar: { install: true, discover: true, invoke: true, uninstall: true },
    recordRef: "docs/assets/conformance/results/run-0001.json",
    modelOrProvider: "anthropic",
    runtime: "codex-cli",
    simulated: false,
    ...overrides,
  };
}

function entryFixture(
  overrides: Partial<ConformanceTupleRegistryEntry> = {},
): ConformanceTupleRegistryEntry {
  return {
    id: "fixture-codex-plugin",
    tuple: codexPluginTuple(),
    status: "provisional",
    evidence: [],
    recordedRuns: [],
    plannedScenarios: [],
    notes: ["Fixture entry."],
    ...overrides,
  };
}

function resultRecordFixture(
  overrides: Partial<PackagingConformanceResultRecord> = {},
): PackagingConformanceResultRecord {
  return validatePackagingConformanceResultRecord({
    schemaVersion: "conformance.result.v1",
    resultId: "run-0001",
    scenarioId: "codex-plugin-marketplace-install",
    scenarioVersion: "1.0.0",
    runDate: "2026-07-04",
    makeDocsVersion: "0.0.0-test",
    harness: "codex",
    modelName: "anthropic",
    providerOrRoutingLayer: "anthropic-api",
    modelVersion: "0.0.0-test",
    runtimeDistribution: "codex-cli",
    runtimeVersion: "0.0.0-test",
    producedFiles: [],
    relevantDiffs: [],
    exitStatus: 0,
    transcriptLogPointer: ".make-docs/conformance/run-0001/transcript.log",
    verdict: "pass",
    reason: "All four bar stages asserted against the real harness.",
    caveats: [],
    reviewerStatus: "reviewed",
    supportClaimUse: "nominal-tuple",
    caveatsSurfaced: false,
    evidenceBar: { install: true, discover: true, invoke: true, uninstall: true },
    simulated: false,
    simulationMechanicsRef: null,
    transcriptFormat: "json",
    ...overrides,
  });
}

/** Writes fixture result records under a temp repo root and returns their runs. */
function writeRecords(
  root: string,
  records: PackagingConformanceResultRecord[],
): ConformanceRecordedRun[] {
  mkdirSync(path.join(root, "docs/assets/conformance/results"), { recursive: true });
  return records.map((record) => {
    const recordRef = `docs/assets/conformance/results/${record.resultId}.json`;
    writeFileSync(path.join(root, recordRef), JSON.stringify(record, null, 2), "utf8");
    return recordedRun({
      runId: record.resultId,
      verdict: record.verdict,
      caveats: [...record.caveats],
      caveatsSurfaced: record.caveatsSurfaced,
      recordRef,
    });
  });
}

describe("R-GOV-2 thresholds: derived from reviewed receipts (t3)", () => {
  test("the strength vocabulary carries the lab's thresholds as data", () => {
    expect(SUPPORT_CLAIM_STRENGTHS).toEqual(["no-public-claim", "nominal", "stronger"]);
    expect(SUPPORT_CLAIM_STRENGTH_THRESHOLDS.nominal).toContain("one");
    expect(SUPPORT_CLAIM_STRENGTH_THRESHOLDS.nominal).toContain("R-GOV-2");
    expect(SUPPORT_CLAIM_STRENGTH_THRESHOLDS.stronger).toContain("maintainer-reviewed");
    expect(SUPPORT_CLAIM_STRENGTH_THRESHOLDS.stronger).toContain("stronger-claim-candidate");
  });

  test("no qualifying run, an unreviewed run, or a missing record all fail closed to no-public-claim", () => {
    const root = createTempDir("make-docs-governance-strength-");
    try {
      // No qualifying run at all.
      expect(
        deriveSupportClaimStrength(entryFixture(), { repoRoot: root }).strength,
      ).toBe("no-public-claim");
      // A qualifying run whose record is missing contributes nothing.
      const missing = deriveSupportClaimStrength(
        entryFixture({ recordedRuns: [recordedRun()] }),
        { repoRoot: root },
      );
      expect(missing.strength).toBe("no-public-claim");
      expect(missing.reasons.join("\n")).toContain("no valid committed result record");
      // A qualifying run whose record is unreviewed keeps the gate closed.
      const runs = writeRecords(root, [resultRecordFixture({ reviewerStatus: "unreviewed" })]);
      const unreviewed = deriveSupportClaimStrength(
        entryFixture({ recordedRuns: runs }),
        { repoRoot: root },
      );
      expect(unreviewed.strength).toBe("no-public-claim");
      expect(unreviewed.reasons.join("\n")).toContain("maintainer review");
    } finally {
      cleanupTempDir(root);
    }
  });

  test("one reviewed qualifying run is nominal; repeated reviewed runs with a candidate are stronger", () => {
    const root = createTempDir("make-docs-governance-strength-");
    try {
      const oneReviewed = writeRecords(root, [resultRecordFixture()]);
      expect(
        deriveSupportClaimStrength(entryFixture({ recordedRuns: oneReviewed }), {
          repoRoot: root,
        }).strength,
      ).toBe("nominal");
      // Two reviewed runs without a stronger-claim-candidate stay nominal.
      const twoNominal = writeRecords(root, [
        resultRecordFixture({ resultId: "run-0002" }),
        resultRecordFixture({ resultId: "run-0003" }),
      ]);
      expect(
        deriveSupportClaimStrength(entryFixture({ recordedRuns: twoNominal }), {
          repoRoot: root,
        }).strength,
      ).toBe("nominal");
      // Two reviewed runs with a reviewed stronger-claim-candidate meet the bar.
      const stronger = writeRecords(root, [
        resultRecordFixture({ resultId: "run-0004" }),
        resultRecordFixture({
          resultId: "run-0005",
          supportClaimUse: "stronger-claim-candidate",
        }),
      ]);
      expect(
        deriveSupportClaimStrength(entryFixture({ recordedRuns: stronger }), {
          repoRoot: root,
        }).strength,
      ).toBe("stronger");
    } finally {
      cleanupTempDir(root);
    }
  });
});

describe("R-GOV-1 wording derivation: the single claim-rendering seam (t1, t2)", () => {
  test("below conformance-validated, wording distinguishes a generated output from a harness-recognized plugin", () => {
    const root = createTempDir("make-docs-governance-wording-");
    try {
      for (const status of ["provisional", "implementation-validated"] as const) {
        const claim = renderConformanceSupportClaim(
          entryFixture({
            status,
            evidence:
              status === "implementation-validated"
                ? [{ kind: "internal-test", ref: "tests/x.test.ts", note: "n" }]
                : [],
          }),
          { repoRoot: root },
        );
        expect(claim.strength).toBe("no-public-claim");
        expect(claim.wording).toContain("Make Docs generated output");
        expect(claim.wording).toContain("not a `codex`-recognized plugin");
        expect(claim.wording).toContain(`\`${status}\``);
        expect(claim.wording).not.toContain("Conformance-validated for exactly this tuple");
      }
    } finally {
      cleanupTempDir(root);
    }
  });

  test("conformance-validated without a reviewed run still withholds public wording (two gates, not one)", () => {
    const root = createTempDir("make-docs-governance-wording-");
    try {
      const runs = writeRecords(root, [resultRecordFixture({ reviewerStatus: "unreviewed" })]);
      const boundTuple: ConformanceSupportTuple = {
        ...codexPluginTuple(),
        scenario: "codex-plugin-marketplace-install",
        modelOrProvider: "anthropic",
        runtime: "codex-cli",
      };
      const claim = renderConformanceSupportClaim(
        entryFixture({ tuple: boundTuple, status: "conformance-validated", recordedRuns: runs }),
        { repoRoot: root },
      );
      expect(claim.strength).toBe("no-public-claim");
      expect(claim.wording).toContain("not maintainer-reviewed");
      expect(claim.wording).toContain("not a `codex`-recognized plugin");
    } finally {
      cleanupTempDir(root);
    }
  });

  test("a reviewed claim states only the exact tuple, and pass-with-caveats embeds every caveat (t2)", () => {
    const root = createTempDir("make-docs-governance-wording-");
    try {
      const caveats = [
        "Discovery required a workspace trust prompt.",
        "Invocation verified for one bundled skill only.",
      ];
      const runs = writeRecords(root, [
        resultRecordFixture({
          verdict: "pass-with-caveats",
          caveats,
          caveatsSurfaced: true,
        }),
      ]);
      const boundTuple: ConformanceSupportTuple = {
        ...codexPluginTuple(),
        scenario: "codex-plugin-marketplace-install",
        modelOrProvider: "anthropic",
        runtime: "codex-cli",
      };
      const entry = entryFixture({
        tuple: boundTuple,
        status: "conformance-validated",
        recordedRuns: runs,
      });
      const claim = renderConformanceSupportClaim(entry, { repoRoot: root });
      expect(claim.strength).toBe("nominal");
      expect(claim.wording).toContain(
        `Conformance-validated for exactly this tuple (\`${conformanceTupleKey(boundTuple)}\`)`,
      );
      expect(claim.wording).toContain("codex-plugin-marketplace-install");
      expect(claim.wording).toContain("install-discover-invoke-uninstall");
      // Every caveat rides the wording itself, never a footnote elsewhere.
      expect(claim.caveats).toEqual(caveats);
      for (const caveat of caveats) {
        expect(claim.wording).toContain(caveat);
      }
      // Nominal wording never uses the stronger commendation.
      expect(claim.wording).toContain("Nominal support");
      expect(claim.wording).not.toContain("Stronger claim");
      expect(claim.wording).toContain("nothing beyond the exact tuple");
    } finally {
      cleanupTempDir(root);
    }
  });

  test("stronger commendation language appears only behind repeated reviewed runs", () => {
    const root = createTempDir("make-docs-governance-wording-");
    try {
      const runs = writeRecords(root, [
        resultRecordFixture({ resultId: "run-0006" }),
        resultRecordFixture({
          resultId: "run-0007",
          supportClaimUse: "stronger-claim-candidate",
        }),
      ]);
      const boundTuple: ConformanceSupportTuple = {
        ...codexPluginTuple(),
        scenario: "codex-plugin-marketplace-install",
        modelOrProvider: "anthropic",
        runtime: "codex-cli",
      };
      const claim = renderConformanceSupportClaim(
        entryFixture({ tuple: boundTuple, status: "conformance-validated", recordedRuns: runs }),
        { repoRoot: root },
      );
      expect(claim.strength).toBe("stronger");
      expect(claim.wording).toContain("Stronger claim: 2 maintainer-reviewed qualifying runs");
    } finally {
      cleanupTempDir(root);
    }
  });
});

describe("mechanical promotion for the W18 R5..R8 provisional claims (t4, t5)", () => {
  const registry = loadConformanceTupleRegistry({ repoRoot: REPO_ROOT });

  test("the committed registry wires every first-party lineage claim to its promotion path", () => {
    expect(listPackagingSupportRegistryAgreementErrors({ registry })).toEqual([]);
    // The descriptor placements and the registry are the same twenty claims.
    expect(listFirstPartyDescriptorPlacementTuples()).toHaveLength(registry.tuples.length);
  });

  test("the registry ceiling holds every claim at provisional until its exact tuple advances", () => {
    for (const entry of registry.tuples) {
      // No tuple is conformance-validated today, so no claim may read validated.
      expect(derivePackageSupportStatusCeilingFromRegistry(entry), entry.id).toBe("provisional");
      expect(capSupportStatusForConformanceRegistry("validated", entry), entry.id).toBe(
        "provisional",
      );
      // Non-validated statuses pass through the cap untouched.
      expect(capSupportStatusForConformanceRegistry("provisional", entry), entry.id).toBe(
        "provisional",
      );
      expect(capSupportStatusForConformanceRegistry("unsupported", entry), entry.id).toBe(
        "unsupported",
      );
    }
    // An unregistered tuple has no promotion path at all.
    expect(derivePackageSupportStatusCeilingFromRegistry(null)).toBe("provisional");
    expect(capSupportStatusForConformanceRegistry("validated", null)).toBe("provisional");
  });

  test("a qualifying recorded run advances the exact tuple, flips its ceiling, and stales every claim surface marker", () => {
    const specs = loadPackagingConformanceScenarioSpecs({ repoRoot: REPO_ROOT });
    const spec = specs.find((s) => s.scenarioId === "codex-plugin-marketplace-install")!;
    const entry = registry.tuples.find((e) => e.id === "codex-plugin-native-project")!;
    const record = resultRecordFixture({ resultId: "run-promotion-fixture" });
    const advanced = recordConformanceRunOnRegistryEntry({
      entry,
      spec,
      record,
      recordRef: "docs/assets/conformance/results/run-promotion-fixture.json",
    });
    // The exact tuple advances and its wording ceiling advances with it —
    // and ONLY this tuple: every other entry's ceiling is untouched.
    expect(advanced.status).toBe("conformance-validated");
    expect(derivePackageSupportStatusCeilingFromRegistry(advanced)).toBe("validated");
    expect(capSupportStatusForConformanceRegistry("validated", advanced)).toBe("validated");
    // The state marker every claim surface carries goes stale, so the
    // governance check forces a wording review on the same change (t4).
    const advancedRegistry = {
      tuples: registry.tuples.map((e) => (e.id === entry.id ? advanced : e)),
    };
    expect(renderSupportClaimStateMarker(advancedRegistry)).not.toBe(
      renderSupportClaimStateMarker(registry),
    );
    const errors = listSupportClaimGovernanceErrors({
      registry: advancedRegistry,
      repoRoot: REPO_ROOT,
    });
    const staleErrors = errors.filter((error) => error.includes("stale support-claim-state"));
    expect(staleErrors).toHaveLength(CONFORMANCE_CLAIM_SURFACES.length);
  });

  test("blocked and future-harness absence stays visible: Pi entries report absence rather than implying coverage", () => {
    const piEntries = registry.tuples.filter((entry) => entry.tuple.harness === "pi");
    expect(piEntries.length).toBeGreaterThan(0);
    for (const entry of piEntries) {
      expect(entry.status, entry.id).not.toBe("conformance-validated");
      expect(entry.plannedScenarios, entry.id).toEqual([]);
      expect(entry.notes.join(" "), entry.id).toContain("R-SCEN-2");
    }
    // Dropping an entry's notes makes the absence silent — and flagged.
    const silenced = {
      tuples: registry.tuples.map((entry) =>
        entry.id === "pi-plugin-native-global" ? { ...entry, notes: [] } : entry,
      ),
    };
    expect(
      listPackagingSupportRegistryAgreementErrors({ registry: silenced }).join("\n"),
    ).toContain("R-SCEN-2");
  });

  test("an unanchored registry entry or a placement without an entry breaks the wiring loudly", () => {
    const rogue = entryFixture({
      id: "rogue-harness-entry",
      tuple: { ...codexPluginTuple(), harness: "rogue-harness" },
    });
    expect(
      listPackagingSupportRegistryAgreementErrors({
        registry: { tuples: [...registry.tuples, rogue] },
      }).join("\n"),
    ).toContain("anchors to no first-party descriptor placement");
    expect(
      listPackagingSupportRegistryAgreementErrors({
        registry: { tuples: registry.tuples.slice(1) },
      }).join("\n"),
    ).toContain("has no registry entry");
  });
});

describe("claim surfaces: the wording rule encoded where support language lives (t1, t6)", () => {
  const registry = loadConformanceTupleRegistry({ repoRoot: REPO_ROOT });

  test("the committed claim surfaces pass the governance check end to end", () => {
    expect(listSupportClaimGovernanceErrors({ registry, repoRoot: REPO_ROOT })).toEqual([]);
  });

  test("the rule constants carry R-GOV-1 verbatim and the core phrase is a substring of the rule", () => {
    expect(SUPPORT_CLAIM_WORDING_RULE).toContain(SUPPORT_CLAIM_WORDING_RULE_CORE);
    expect(SUPPORT_CLAIM_WORDING_RULE).toContain("harness-recognized plugin");
    expect(SUPPORT_CLAIM_WORDING_RULE).toContain("surfaces its caveats");
  });

  test("every declared claim surface is inside a swept root, so the sweep can police the declaration", () => {
    for (const surface of CONFORMANCE_CLAIM_SURFACES) {
      expect(
        CONFORMANCE_CLAIM_SURFACE_SWEEP_ROOTS.some(
          (root) => surface.relativePath === root || surface.relativePath.startsWith(`${root}/`),
        ),
        surface.relativePath,
      ).toBe(true);
    }
  });

  test("a missing marker, a stale marker, a missing rule, and a missing registry reference are all flagged", () => {
    const root = createTempDir("make-docs-governance-surfaces-");
    try {
      const marker = renderSupportClaimStateMarker({ tuples: [entryFixture()] });
      const compliant =
        `${marker}\nSupport wording ${SUPPORT_CLAIM_WORDING_RULE_CORE} (see tuple-registry.json).\n`;
      const [readme, userGuide, devGuide, labGuide] = CONFORMANCE_CLAIM_SURFACES;
      const write = (surface: { relativePath: string }, content: string) => {
        const absolute = path.join(root, surface.relativePath);
        mkdirSync(path.dirname(absolute), { recursive: true });
        writeFileSync(absolute, content, "utf8");
      };
      write(readme!, compliant);
      // Stale marker: asserts a count the registry does not derive.
      write(
        userGuide!,
        `<!-- support-claim-state: conformance-validated=5/20 -->\n` +
          `Support wording ${SUPPORT_CLAIM_WORDING_RULE_CORE} (see tuple-registry.json).\n`,
      );
      // Missing rule core.
      write(devGuide!, `${marker}\nSee tuple-registry.json.\n`);
      // Missing registry reference.
      write(labGuide!, `${marker}\nSupport wording ${SUPPORT_CLAIM_WORDING_RULE_CORE}.\n`);
      const errors = listSupportClaimGovernanceErrors({
        registry: { tuples: [entryFixture()] },
        repoRoot: root,
      });
      expect(errors.join("\n")).toContain("stale support-claim-state marker");
      expect(errors.join("\n")).toContain("wording-rule core");
      expect(errors.join("\n")).toContain("does not reference the tuple registry home");
      // A surface with no marker at all is flagged too.
      write(readme!, `Support wording ${SUPPORT_CLAIM_WORDING_RULE_CORE} (tuple-registry.json).\n`);
      expect(
        listSupportClaimGovernanceErrors({
          registry: { tuples: [entryFixture()] },
          repoRoot: root,
        }).join("\n"),
      ).toContain("carries no support-claim-state marker");
    } finally {
      cleanupTempDir(root);
    }
  });

  test("support-status vocabulary on an undeclared reader-facing doc is flagged by the sweep", () => {
    const root = createTempDir("make-docs-governance-sweep-");
    try {
      for (const surface of CONFORMANCE_CLAIM_SURFACES) {
        const absolute = path.join(root, surface.relativePath);
        mkdirSync(path.dirname(absolute), { recursive: true });
        writeFileSync(
          absolute,
          `${renderSupportClaimStateMarker({ tuples: [] })}\n` +
            `Support wording ${SUPPORT_CLAIM_WORDING_RULE_CORE} (tuple-registry.json).\n`,
          "utf8",
        );
      }
      writeFileSync(
        path.join(root, "docs/assets/library/rogue-claims.md"),
        `This output is ${CONFORMANCE_CLAIM_VOCABULARY_MARKER} everywhere!\n`,
        "utf8",
      );
      const errors = listSupportClaimGovernanceErrors({
        registry: { tuples: [] },
        repoRoot: root,
      });
      expect(errors.join("\n")).toContain("docs/assets/library/rogue-claims.md");
      expect(errors.join("\n")).toContain("not a declared claim surface");
    } finally {
      cleanupTempDir(root);
    }
  });

  test("traceability holds end to end: surface -> registry -> tuple -> recorded run receipts (t6)", () => {
    // Every claim surface names the registry home, the registry loads
    // fail-closed, and the Phase 3 receipts check guarantees any recorded run
    // resolves to its committed result record — so following links from a
    // public claim reaches the tuple, its status, and the run that justified
    // it. Today the chain ends honestly at "no recorded runs".
    for (const entry of registry.tuples) {
      expect(entry.recordedRuns, entry.id).toEqual([]);
      expect(entry.status, entry.id).not.toBe("conformance-validated");
    }
    // The derived wording for every committed tuple distinguishes the
    // generated output from a harness-recognized plugin — no public claim
    // exists ahead of the evidence (R-GOV-1).
    for (const entry of registry.tuples) {
      const claim = renderConformanceSupportClaim(entry, { repoRoot: REPO_ROOT });
      expect(claim.strength, entry.id).toBe("no-public-claim");
      expect(claim.wording, entry.id).toContain("Make Docs generated output");
      expect(claim.wording, entry.id).toContain("-recognized");
      expect(claim.tupleKey).toBe(conformanceTupleKey(entry.tuple));
    }
  });
});

describe("committed result-record claim-use gates (t2, t3)", () => {
  test("an absent results directory is honest absence, not an error", () => {
    const root = createTempDir("make-docs-governance-results-");
    try {
      expect(listCommittedResultRecordClaimUseErrors({ repoRoot: root })).toEqual([]);
    } finally {
      cleanupTempDir(root);
    }
  });

  test("claim-use gates flag unreviewed stronger candidates, non-qualifying claim use, and unsurfaced caveats", () => {
    const root = createTempDir("make-docs-governance-results-");
    try {
      writeRecords(root, [
        // Legitimate: reviewed nominal pass.
        resultRecordFixture({ resultId: "ok-0001" }),
        // Stronger candidate without review (t3).
        resultRecordFixture({
          resultId: "bad-0002",
          supportClaimUse: "stronger-claim-candidate",
          reviewerStatus: "unreviewed",
        }),
        // Caveated record put to claim use without surfacing (t2).
        resultRecordFixture({
          resultId: "bad-0003",
          verdict: "pass-with-caveats",
          caveats: ["needs trust prompt"],
          caveatsSurfaced: false,
        }),
        // Non-qualifying verdict put to claim use.
        resultRecordFixture({
          resultId: "bad-0004",
          verdict: "inconsistent",
        }),
      ]);
      const errors = listCommittedResultRecordClaimUseErrors({ repoRoot: root });
      expect(errors).toHaveLength(3);
      expect(errors.join("\n")).toContain("bad-0002");
      expect(errors.join("\n")).toContain("maintainer review");
      expect(errors.join("\n")).toContain("bad-0003");
      expect(errors.join("\n")).toContain("caveats must be surfaced");
      expect(errors.join("\n")).toContain("bad-0004");
      expect(errors.join("\n")).toContain("inconsistent");
    } finally {
      cleanupTempDir(root);
    }
  });
});
