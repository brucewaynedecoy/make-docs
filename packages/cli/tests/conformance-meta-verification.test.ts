/**
 * W18 R9 P3 coverage: the three named test layers declared where the tests
 * live (t1/t2, R-LAYER-1..2) and the D9 meta-verification checks (t3-t5,
 * R-TEST-1..3), run in the standard suite so a regression in the committed
 * tuple registry, the required scenario set, the layer attribution of cited
 * evidence, or the maintainer-only shipping boundary fails the build. The
 * R-TEST-3 exclusion check additionally runs in the packaging validation
 * surface: `tests/consistency.test.ts` (behind `validate:defaults`) for the
 * shipped template trees and `scripts/smoke-pack.mjs` for the npm tarball.
 *
 * ENFORCING: the layer tests read every packaging and conformance suite
 * header, extending the W18 R8 P5 evidence-boundary precedent — a suite that
 * drops its layer declaration or the boundary rule fails here.
 *
 * Test layer: unit (R-LAYER-1) — pure-function tests over the check code and
 * the committed conformance assets, no CLI. They prove the meta-verification
 * machinery and the honesty of the committed registry and specs — they are
 * NEVER harness-recognition evidence, and internal tests passing is never
 * evidence that a harness recognizes or can use the output (R-LAYER-2,
 * PRD 36 R-TEST-5). Real recognition, installation, and invocation evidence
 * comes only from recorded W18 R9 scenario runs meeting the R-BAR-1 bar.
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  CONFORMANCE_ASSET_CONTENT_MARKERS,
  CONFORMANCE_TEST_LAYERS,
  CONFORMANCE_TEST_LAYER_MEANINGS,
  CONFORMANCE_TUPLE_STATUS_MEANINGS,
  CONFORMANCE_VERDICT_DERIVATION_RULES,
  REPOSITORY_TEST_LAYERS,
  REQUIRED_FIRST_PASS_SCENARIOS,
  bindConformanceSupportTuple,
  blockedPackagingResultRecord,
  listConformanceAssetExclusionViolations,
  listConformanceValidatedRunQualificationErrors,
  listCrossLayerCitationErrors,
  listDeclaredTestLayers,
  listRequiredFirstPassScenarioErrors,
  listShippedConformanceAssetErrors,
  loadConformanceTupleRegistry,
  loadPackagingConformanceScenarioSpecs,
  probePackagingScenarioPreconditions,
  recordConformanceRunOnRegistryEntry,
  validateConformanceTupleRegistry,
  validatePackagingConformanceResultRecord,
  type ConformanceRecordedRun,
  type ConformanceSupportTuple,
  type ConformanceTupleRegistryEntry,
  type ScenarioPreconditionExecutor,
} from "../src/conformance";
import { bindPackageSupportTuple } from "../src/operations/playbook-packaging/support-binding";
import { TEMPLATE_ROOT } from "../src/utils";
import { cleanupTempDir, createTempDir } from "./helpers";

const REPO_ROOT = path.resolve(TEMPLATE_ROOT, "..", "..", "..");
const TESTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const CONFORMANCE_README_PATH = path.join(REPO_ROOT, "docs/assets/conformance/README.md");

/** The suites the layer rule is enforced over: the packaging and conformance families. */
function listEnforcedSuiteFiles(): string[] {
  return readdirSync(TESTS_DIR)
    .filter(
      (name) =>
        (name.startsWith("playbook-packaging") || name.startsWith("conformance-")) &&
        name.endsWith(".test.ts"),
    )
    .sort();
}

function headerOf(filePath: string): string {
  const content = readFileSync(filePath, "utf8");
  const headerEnd = content.indexOf("describe(");
  return headerEnd === -1 ? content : content.slice(0, headerEnd);
}

/** Unwraps comment/markdown line breaks so a sentence can be matched whole. */
function normalizeProse(text: string): string {
  return text.replace(/\s*\n\s*\*?\s*/g, " ");
}

function unboundCodexTuple(): ConformanceSupportTuple {
  return bindConformanceSupportTuple({
    claim: bindPackageSupportTuple({
      target: { harness: "codex", outputKind: "plugin", surface: "native", scope: "project" },
    }),
    generatedOutputKind: "generated-plugin",
  });
}

function qualifyingRun(overrides: Partial<ConformanceRecordedRun> = {}): ConformanceRecordedRun {
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
    tuple: unboundCodexTuple(),
    status: "provisional",
    evidence: [],
    recordedRuns: [],
    plannedScenarios: [],
    notes: ["Fixture entry."],
    ...overrides,
  };
}

const failingExecutor: ScenarioPreconditionExecutor = {
  commandSucceeds: () => false,
};
const succeedingExecutor: ScenarioPreconditionExecutor = {
  commandSucceeds: () => true,
};

describe("three named test layers, declared where the tests live (t1/t2, R-LAYER-1..2)", () => {
  test("the layer vocabulary is exactly the R-LAYER-1 set with its meanings", () => {
    expect(CONFORMANCE_TEST_LAYERS).toEqual(["unit", "integration", "conformance"]);
    expect(REPOSITORY_TEST_LAYERS).toEqual(["unit", "integration"]);
    expect(CONFORMANCE_TEST_LAYER_MEANINGS.unit).toContain("pure functions without a CLI");
    expect(CONFORMANCE_TEST_LAYER_MEANINGS.integration).toContain("CLI and MCP surfaces");
    expect(CONFORMANCE_TEST_LAYER_MEANINGS.integration).toContain(
      "manifest and exposure plumbing",
    );
    expect(CONFORMANCE_TEST_LAYER_MEANINGS.conformance).toContain("real-harness");
    expect(CONFORMANCE_TEST_LAYER_MEANINGS.conformance).toContain("maintainer lab");
  });

  test("every packaging and conformance suite names exactly one repository layer and records the boundary rule", () => {
    const enforced = listEnforcedSuiteFiles();
    // The packaging family (rails, capability, compiler, adapters, seam,
    // lifecycle, verification, and the R12 experience file when present)
    // plus the three conformance suites.
    expect(enforced.length).toBeGreaterThanOrEqual(10);
    for (const name of enforced) {
      const header = headerOf(path.join(TESTS_DIR, name));
      const layers = listDeclaredTestLayers(header);
      expect(layers, `${name} must declare exactly one Test layer marker (R-LAYER-1)`).toHaveLength(
        1,
      );
      expect(
        REPOSITORY_TEST_LAYERS as readonly string[],
        `${name} declares layer \`${layers[0]}\`; repository suites are unit or integration only (R-LAYER-2)`,
      ).toContain(layers[0]);
      // The boundary rule lives where the unit and integration tests live
      // (t2): internal tests passing is never harness-recognition evidence.
      expect(header, `${name} must record the R-LAYER-2 boundary rule in its header`).toContain(
        "R-LAYER-2",
      );
      expect(
        normalizeProse(header),
        `${name} must spell out the internal-tests-are-not-evidence rule`,
      ).toMatch(/never evidence that a harness recognizes or can use the output/);
    }
  });

  test("no repository test file claims the conformance layer", () => {
    for (const name of readdirSync(TESTS_DIR).filter((entry) => entry.endsWith(".test.ts"))) {
      const layers = listDeclaredTestLayers(headerOf(path.join(TESTS_DIR, name)));
      expect(
        layers,
        `${name} claims the conformance layer; the conformance layer is the maintainer lab, never a repository suite (R-LAYER-2)`,
      ).not.toContain("conformance");
    }
  });

  test("the conformance layer is named where its assets live", () => {
    const readme = readFileSync(CONFORMANCE_README_PATH, "utf8");
    expect(readme).toContain("Test layer: conformance");
    expect(normalizeProse(readme)).toMatch(
      /never evidence that a harness recognizes or can use the output/,
    );
  });

  test("listDeclaredTestLayers parses markers strictly from headers", () => {
    expect(listDeclaredTestLayers(" * Test layer: unit (R-LAYER-1).\n")).toEqual(["unit"]);
    expect(
      listDeclaredTestLayers(" * Test layer: unit.\n * Test layer: integration.\n"),
    ).toEqual(["unit", "integration"]);
    // Unknown tokens surface for flagging rather than vanishing.
    expect(listDeclaredTestLayers(" * Test layer: end-to-end.\n")).toEqual(["end-to-end"]);
    expect(listDeclaredTestLayers("no marker here")).toEqual([]);
  });
});

describe("R-TEST-1: no conformance-validated tuple without a qualifying recorded run (t3)", () => {
  test("the committed registry passes the check end to end, with record receipts", () => {
    const registry = loadConformanceTupleRegistry({ repoRoot: REPO_ROOT });
    expect(
      listConformanceValidatedRunQualificationErrors({ registry, repoRoot: REPO_ROOT }),
    ).toEqual([]);
  });

  test("a tuple claiming conformance-validated without a qualifying run is flagged and rejected", () => {
    const blockedRun = qualifyingRun({
      verdict: "blocked",
      evidenceBar: { install: false, discover: false, invoke: false, uninstall: false },
    });
    const entry = entryFixture({ status: "conformance-validated", recordedRuns: [blockedRun] });
    // The meta check names the violation...
    const errors = listConformanceValidatedRunQualificationErrors({
      registry: { tuples: [entry] },
    });
    expect(errors).toEqual([expect.stringContaining("R-TEST-1")]);
    // ...and the fail-closed loader rejects the same document structurally,
    // so the claim cannot even load (R-REG-2/3): defense in depth.
    expect(() =>
      validateConformanceTupleRegistry({
        record: "make-docs.conformance.tuple-registry",
        schemaVersion: 1,
        statuses: { ...CONFORMANCE_TUPLE_STATUS_MEANINGS },
        verdictDerivation: CONFORMANCE_VERDICT_DERIVATION_RULES,
        tuples: [entry],
      }),
    ).toThrow(/derives/);
  });

  test("a qualifying run understated as a lower status is flagged in the other direction", () => {
    const boundTuple: ConformanceSupportTuple = {
      ...unboundCodexTuple(),
      scenario: "codex-plugin-marketplace-install",
      modelOrProvider: "anthropic",
      runtime: "codex-cli",
    };
    const entry = entryFixture({
      tuple: boundTuple,
      status: "provisional",
      recordedRuns: [qualifyingRun()],
    });
    expect(
      listConformanceValidatedRunQualificationErrors({ registry: { tuples: [entry] } }),
    ).toEqual([expect.stringContaining("R-REG-3")]);
  });

  test("a recorded run whose result record is not committed is not evidence", () => {
    const boundTuple: ConformanceSupportTuple = {
      ...unboundCodexTuple(),
      scenario: "codex-plugin-marketplace-install",
      modelOrProvider: "anthropic",
      runtime: "codex-cli",
    };
    const entry = entryFixture({
      tuple: boundTuple,
      status: "conformance-validated",
      recordedRuns: [qualifyingRun({ recordRef: "docs/assets/conformance/results/missing.json" })],
    });
    // Without a repoRoot the run shape qualifies; with the receipts check the
    // missing committed record is a violation.
    expect(listConformanceValidatedRunQualificationErrors({ registry: { tuples: [entry] } })).toEqual(
      [],
    );
    expect(
      listConformanceValidatedRunQualificationErrors({
        registry: { tuples: [entry] },
        repoRoot: REPO_ROOT,
      }),
    ).toEqual([expect.stringContaining("not committed")]);
  });
});

describe("R-TEST-2: required first-pass scenarios exist and are runnable-or-blocked (t4)", () => {
  test("the committed scenario set passes the check against the committed registry", () => {
    const registry = loadConformanceTupleRegistry({ repoRoot: REPO_ROOT });
    const specs = loadPackagingConformanceScenarioSpecs({ repoRoot: REPO_ROOT });
    expect(
      listRequiredFirstPassScenarioErrors({ specs, registry, repoRoot: REPO_ROOT }),
    ).toEqual([]);
  });

  test("a missing required scenario is a named failure, never a silent gap", () => {
    const registry = loadConformanceTupleRegistry({ repoRoot: REPO_ROOT });
    const specs = loadPackagingConformanceScenarioSpecs({ repoRoot: REPO_ROOT }).filter(
      (spec) => spec.scenarioId !== "codex-plugin-marketplace-install",
    );
    const errors = listRequiredFirstPassScenarioErrors({ specs, registry, repoRoot: REPO_ROOT });
    expect(errors.join("\n")).toContain("codex-plugin-marketplace-install");
    expect(errors.join("\n")).toContain("R-TEST-2");
  });

  test("an unavailable harness resolves every required scenario to blocked, and blocked never advances", () => {
    const registry = loadConformanceTupleRegistry({ repoRoot: REPO_ROOT });
    const specs = loadPackagingConformanceScenarioSpecs({ repoRoot: REPO_ROOT });
    const entriesById = new Map(registry.tuples.map((entry) => [entry.id, entry]));
    const requiredIds = Object.keys(REQUIRED_FIRST_PASS_SCENARIOS);
    for (const spec of specs.filter((candidate) => requiredIds.includes(candidate.scenarioId))) {
      // No Codex CLI anywhere: the probe honestly reports not-runnable.
      const report = probePackagingScenarioPreconditions(spec, { executor: failingExecutor });
      expect(report.runnable, spec.scenarioId).toBe(false);
      const record = blockedPackagingResultRecord({
        spec,
        unmet: report.unmet,
        runDate: "2026-07-04",
        makeDocsVersion: "0.0.0-test",
        runtimeDistribution: "codex-cli",
        runtimeVersion: "0.0.0-test",
      });
      expect(validatePackagingConformanceResultRecord(record).verdict).toBe("blocked");
      // Recording the blocked run is honest history: status and tuple stay
      // exactly as they were — blocked never silently passes (R-KEEP-1).
      const targetEntry = entriesById.get(spec.packagingExtension.registryTupleIds[0]!)!;
      const updated = recordConformanceRunOnRegistryEntry({
        entry: targetEntry,
        spec,
        record,
        recordRef: `docs/assets/conformance/results/${record.resultId}.json`,
      });
      expect(updated.status).toBe(targetEntry.status);
      expect(updated.tuple).toEqual(targetEntry.tuple);
      expect(updated.recordedRuns.at(-1)?.verdict).toBe("blocked");
    }
  });

  test("expensive preconditions require explicit operator attestation even when local probes pass", () => {
    const specs = loadPackagingConformanceScenarioSpecs({ repoRoot: REPO_ROOT });
    for (const spec of specs) {
      const report = probePackagingScenarioPreconditions(spec, { executor: succeedingExecutor });
      expect(report.runnable, spec.scenarioId).toBe(false);
      const unmetKinds = new Set(report.unmet.map((outcome) => outcome.kind));
      expect(unmetKinds).toContain("network");
      expect(unmetKinds).toContain("model-routing");
    }
  });
});

describe("cross-layer citation honesty (t1, R-LAYER-1..2)", () => {
  test("every internal-test evidence ref on the committed registry cites one named repository layer", () => {
    const registry = loadConformanceTupleRegistry({ repoRoot: REPO_ROOT });
    expect(listCrossLayerCitationErrors({ registry, repoRoot: REPO_ROOT })).toEqual([]);
  });

  test("a citation of a missing, unlayered, or conformance-claiming suite is flagged", () => {
    const root = createTempDir("make-docs-meta-citation-");
    try {
      mkdirSync(path.join(root, "tests"), { recursive: true });
      writeFileSync(
        path.join(root, "tests/unlayered.test.ts"),
        "/** No layer marker here. */\ndescribe(\"x\", () => {});\n",
        "utf8",
      );
      writeFileSync(
        path.join(root, "tests/lab-claiming.test.ts"),
        "/**\n * Test layer: conformance (bogus).\n */\ndescribe(\"x\", () => {});\n",
        "utf8",
      );
      const registry = {
        tuples: [
          entryFixture({
            evidence: [
              { kind: "internal-test" as const, ref: "tests/missing.test.ts", note: "n" },
              { kind: "internal-test" as const, ref: "tests/unlayered.test.ts", note: "n" },
              { kind: "internal-test" as const, ref: "tests/lab-claiming.test.ts", note: "n" },
            ],
            status: "implementation-validated" as const,
          }),
        ],
      };
      const errors = listCrossLayerCitationErrors({ registry, repoRoot: root });
      expect(errors).toHaveLength(3);
      expect(errors[0]).toContain("does not exist");
      expect(errors[1]).toContain("exactly one");
      expect(errors[2]).toContain("never the conformance layer");
    } finally {
      cleanupTempDir(root);
    }
  });
});

describe("R-TEST-3: conformance assets never ship (t5)", () => {
  // A green exclusion result is an exclusion fact, not a support claim: it
  // proves maintainer assets stayed maintainer-only, nothing about whether
  // any harness recognizes any output (R-KEEP-1).
  test("the shipped template and the packaged copy carry no conformance assets", () => {
    expect(listShippedConformanceAssetErrors({ repoRoot: REPO_ROOT })).toEqual([]);
  });

  test("the walker detects assets by path, basename, and content marker — including relocations", () => {
    const root = createTempDir("make-docs-meta-exclusion-");
    try {
      mkdirSync(path.join(root, "docs/assets/conformance/scenarios"), { recursive: true });
      writeFileSync(
        path.join(root, "docs/assets/conformance/scenarios/some-spec.json"),
        "{}",
        "utf8",
      );
      mkdirSync(path.join(root, "relocated"), { recursive: true });
      writeFileSync(path.join(root, "relocated/tuple-registry.json"), "{}", "utf8");
      writeFileSync(
        path.join(root, "relocated/renamed-registry.json"),
        JSON.stringify({ record: CONFORMANCE_ASSET_CONTENT_MARKERS[0] }),
        "utf8",
      );
      writeFileSync(path.join(root, "relocated/innocent.md"), "# Just a doc\n", "utf8");
      const violations = listConformanceAssetExclusionViolations({
        root,
        label: "fixture tree",
      });
      expect(violations).toHaveLength(3);
      expect(violations.join("\n")).toContain("docs/assets/conformance/scenarios/some-spec.json");
      expect(violations.join("\n")).toContain("relocated/tuple-registry.json");
      expect(violations.join("\n")).toContain("relocated/renamed-registry.json");
      expect(violations.join("\n")).not.toContain("innocent.md");
    } finally {
      cleanupTempDir(root);
    }
  });

  test("a clean tree and a missing optional tree produce no violations", () => {
    const root = createTempDir("make-docs-meta-clean-");
    try {
      writeFileSync(path.join(root, "README.md"), "# Clean\n", "utf8");
      expect(listConformanceAssetExclusionViolations({ root, label: "clean tree" })).toEqual([]);
      expect(
        listConformanceAssetExclusionViolations({
          root: path.join(root, "does-not-exist"),
          label: "absent tree",
        }),
      ).toEqual([]);
    } finally {
      cleanupTempDir(root);
    }
  });
});
