/**
 * W18 R9 P1 coverage: the eight-field support tuple (R-TUPLE-1) and the
 * tuple registry under `conformance/` with its three statuses
 * and verdict-derived transitions (R-REG-1..3, R-BAR-2).
 *
 * Test layer: unit (R-LAYER-1) — pure-function tests over the conformance
 * module and the committed registry data file, no CLI. They prove
 * tuple/registry mechanics and the honesty of the seeded statuses — they are
 * NEVER harness-recognition evidence, and internal tests passing is never
 * evidence that a harness recognizes or can use the output. Real
 * recognition, installation, and invocation evidence comes only from
 * recorded W18 R9 scenario runs meeting the install-discover-invoke-uninstall
 * bar (R-BAR-1, R-LAYER-2, PRD 36 R-TEST-5).
 */

import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import {
  CONFORMANCE_EVIDENCE_BAR_STAGES,
  CONFORMANCE_RUN_VERDICTS,
  CONFORMANCE_SUPPORT_TUPLE_DIMENSIONS,
  CONFORMANCE_TUPLE_REGISTRY_PATH,
  CONFORMANCE_TUPLE_STATUSES,
  CONFORMANCE_TUPLE_STATUS_MEANINGS,
  CONFORMANCE_VERDICT_DERIVATION_RULES,
  bindConformanceSupportTuple,
  bindRunMetadataOntoConformanceTuple,
  conformanceTupleKey,
  deriveConformanceTupleStatus,
  getConformanceTupleEntry,
  isConformanceTupleBound,
  listUnboundConformanceTupleDimensions,
  loadConformanceTupleRegistry,
  queryConformanceTuples,
  runMeetsEvidenceBar,
  runQualifiesForConformanceValidation,
  validateConformanceTupleRegistry,
  type ConformanceRecordedRun,
  type ConformanceSupportTuple,
  type ConformanceTupleRegistry,
  type ConformanceTupleRegistryEntry,
} from "../src/conformance";



import { TEMPLATE_ROOT } from "../src/utils";

const REPO_ROOT = path.resolve(TEMPLATE_ROOT, "..", "..", "..");

const CODEX_PLUGIN_TARGET = {
  harness: "codex",
  outputKind: "plugin",
  surface: "native",
  scope: "project",
} as const;

function unboundCodexTuple(): ConformanceSupportTuple {
  return bindConformanceSupportTuple({
    claim: bindTestClaim({ target: CODEX_PLUGIN_TARGET }),
    generatedOutputKind: "generated-plugin",
  });
}

function qualifyingRun(overrides: Partial<ConformanceRecordedRun> = {}): ConformanceRecordedRun {
  return {
    runId: "run-0001",
    scenario: "packaging/unit-evidence-fixture",
    runDate: "2026-07-04",
    verdict: "pass",
    caveats: [],
    caveatsSurfaced: false,
    evidenceBar: { install: true, discover: true, invoke: true, uninstall: true },
    recordRef: "conformance/results/codex/run-0001.json",
    modelOrProvider: "anthropic",
    runtime: "codex-cli",
    simulated: false,
    ...overrides,
  };
}

function registryDocument(
  entries: ConformanceTupleRegistryEntry[],
): ConformanceTupleRegistry {
  return {
    record: "make-docs.conformance.tuple-registry",
    schemaVersion: 1,
    statuses: { ...CONFORMANCE_TUPLE_STATUS_MEANINGS },
    verdictDerivation: CONFORMANCE_VERDICT_DERIVATION_RULES,
    tuples: entries,
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

describe("the eight-field support tuple (t1/t2, R-TUPLE-1)", () => {
  test("carries exactly the R-TUPLE-1 dimensions in contract order", () => {
    expect(CONFORMANCE_SUPPORT_TUPLE_DIMENSIONS).toEqual([
      "scenario",
      "harness",
      "surface",
      "scope",
      "outputKind",
      "generatedOutputKind",
      "modelOrProvider",
      "runtime",
    ]);
  });

  test("binds from a packaging support-claim tuple with evidence-owned dimensions unbound", () => {
    const tuple = unboundCodexTuple();
    expect(tuple).toEqual({
      scenario: null,
      harness: "codex",
      surface: "native",
      scope: "project",
      outputKind: "plugin",
      generatedOutputKind: "generated-plugin",
      modelOrProvider: null,
      runtime: null,
    });
    // The lab-owned dimensions are run metadata (PRD 20, R-KEEP-1): unbound
    // until a recorded run supplies them.
    expect(listUnboundConformanceTupleDimensions(tuple)).toEqual([
      "scenario",
      "modelOrProvider",
      "runtime",
    ]);
    expect(isConformanceTupleBound(tuple)).toBe(false);
  });

  test("refuses an unresolved `auto` surface: a claim broader than any evidence", () => {
    expect(() =>
      bindConformanceSupportTuple({
        claim: bindTestClaim({
          target: { ...CODEX_PLUGIN_TARGET, surface: "auto" },
        }),
        generatedOutputKind: "generated-plugin",
      }),
    ).toThrow("resolved surface");
  });

  test("run metadata is the only seam that binds scenario, model/provider, and runtime (t2)", () => {
    const bound = bindRunMetadataOntoConformanceTuple(unboundCodexTuple(), {
      scenario: "packaging/unit-evidence-fixture",
      modelOrProvider: "anthropic",
      runtime: "codex-cli",
    });
    expect(isConformanceTupleBound(bound)).toBe(true);
    expect(listUnboundConformanceTupleDimensions(bound)).toEqual([]);
    // The packaging dimensions ride along unchanged.
    expect(bound.harness).toBe("codex");
    expect(bound.outputKind).toBe("plugin");
    expect(bound.generatedOutputKind).toBe("generated-plugin");
  });

  test("the canonical tuple key is deterministic with unbound dimensions spelled `~`", () => {
    expect(conformanceTupleKey(unboundCodexTuple())).toBe(
      "~/codex/native/project/plugin/generated-plugin/~/~",
    );
  });
});

describe("verdict-derivation rules (t5, R-REG-3, R-BAR-1/2)", () => {
  test("the lab verdict vocabulary is consumed unchanged (R-KEEP-1)", () => {
    expect(CONFORMANCE_RUN_VERDICTS).toEqual([
      "pass",
      "pass-with-caveats",
      "inconsistent",
      "unsupported",
      "blocked",
    ]);
    expect(CONFORMANCE_EVIDENCE_BAR_STAGES).toEqual([
      "install",
      "discover",
      "invoke",
      "uninstall",
    ]);
  });

  test("a `pass` meeting the full install-discover-invoke-uninstall bar qualifies", () => {
    expect(runQualifiesForConformanceValidation(qualifyingRun())).toBe(true);
  });

  test("`pass-with-caveats` qualifies only when its caveats are surfaced", () => {
    expect(
      runQualifiesForConformanceValidation(
        qualifyingRun({
          verdict: "pass-with-caveats",
          caveats: ["Marketplace refresh required before discovery."],
          caveatsSurfaced: true,
        }),
      ),
    ).toBe(true);
    expect(
      runQualifiesForConformanceValidation(
        qualifyingRun({
          verdict: "pass-with-caveats",
          caveats: ["Marketplace refresh required before discovery."],
          caveatsSurfaced: false,
        }),
      ),
    ).toBe(false);
    // Surfacing nothing is not surfacing: a caveated pass with no recorded
    // caveats cannot qualify.
    expect(
      runQualifiesForConformanceValidation(
        qualifyingRun({ verdict: "pass-with-caveats", caveats: [], caveatsSurfaced: true }),
      ),
    ).toBe(false);
  });

  test("`inconsistent`, `unsupported`, and `blocked` never advance a tuple, even with a full bar", () => {
    for (const verdict of ["inconsistent", "unsupported", "blocked"] as const) {
      expect(runQualifiesForConformanceValidation(qualifyingRun({ verdict }))).toBe(false);
    }
  });

  test("a missing bar stage disqualifies a passing run (R-BAR-1)", () => {
    for (const stage of CONFORMANCE_EVIDENCE_BAR_STAGES) {
      const run = qualifyingRun();
      run.evidenceBar[stage] = false;
      expect(runMeetsEvidenceBar(run)).toBe(false);
      expect(runQualifiesForConformanceValidation(run)).toBe(false);
    }
  });

  test("status derivation: qualifying run > internal tests > nothing (R-REG-2, R-BAR-2)", () => {
    expect(deriveConformanceTupleStatus({ evidence: [], recordedRuns: [] })).toBe("provisional");
    expect(
      deriveConformanceTupleStatus({
        evidence: [
          {
            kind: "internal-test",
            ref: "packages/cli/tests/playbook-packaging-compiler.test.ts",
            note: "Shape assertions only.",
          },
        ],
        recordedRuns: [],
      }),
    ).toBe("implementation-validated");
    expect(
      deriveConformanceTupleStatus({ evidence: [], recordedRuns: [qualifyingRun()] }),
    ).toBe("conformance-validated");
    // Internal tests alone never advance past implementation-validated, and
    // a blocked run is honest absence of evidence, not evidence (R-BAR-2).
    expect(
      deriveConformanceTupleStatus({
        evidence: [
          {
            kind: "internal-test",
            ref: "packages/cli/tests/playbook-packaging-compiler.test.ts",
            note: "Shape assertions only.",
          },
        ],
        recordedRuns: [qualifyingRun({ verdict: "blocked" })],
      }),
    ).toBe("implementation-validated");
    // A real-harness probe (positive or negative) moves nothing.
    expect(
      deriveConformanceTupleStatus({
        evidence: [
          {
            kind: "real-harness-probe",
            ref: "docs/prd/03-open-questions-and-risk-register.md",
            note: "Negative recognition probe.",
          },
        ],
        recordedRuns: [],
      }),
    ).toBe("provisional");
  });
});

describe("registry validation fails closed (t3/t4, R-REG-1/2)", () => {
  test("a tuple claiming conformance-validated without a qualifying run is rejected", () => {
    const document = registryDocument([
      entryFixture({ status: "conformance-validated" }),
    ]);
    expect(() => validateConformanceTupleRegistry(document)).toThrow(
      "statuses are derived from recorded evidence",
    );
  });

  test("a tuple claiming implementation-validated without internal-test evidence is rejected", () => {
    const document = registryDocument([
      entryFixture({ status: "implementation-validated" }),
    ]);
    expect(() => validateConformanceTupleRegistry(document)).toThrow(
      "statuses are derived from recorded evidence",
    );
  });

  test("a conformance-validated tuple must be fully bound by its run metadata (R-TUPLE-1)", () => {
    const document = registryDocument([
      entryFixture({
        status: "conformance-validated",
        recordedRuns: [qualifyingRun()],
      }),
    ]);
    expect(() => validateConformanceTupleRegistry(document)).toThrow("unbound tuple dimensions");

    const bound = bindRunMetadataOntoConformanceTuple(unboundCodexTuple(), {
      scenario: "packaging/unit-evidence-fixture",
      modelOrProvider: "anthropic",
      runtime: "codex-cli",
    });
    const valid = registryDocument([
      entryFixture({
        tuple: bound,
        status: "conformance-validated",
        recordedRuns: [qualifyingRun()],
      }),
    ]);
    expect(validateConformanceTupleRegistry(valid).tuples[0]?.status).toBe(
      "conformance-validated",
    );
  });

  test("a bound scenario must match the qualifying run's scenario: no claim broader than its evidence", () => {
    const bound = bindRunMetadataOntoConformanceTuple(unboundCodexTuple(), {
      scenario: "some-other-scenario",
      modelOrProvider: "anthropic",
      runtime: "codex-cli",
    });
    const document = registryDocument([
      entryFixture({
        tuple: bound,
        status: "conformance-validated",
        recordedRuns: [qualifyingRun()],
      }),
    ]);
    expect(() => validateConformanceTupleRegistry(document)).toThrow(
      "broader than the evidence",
    );
  });

  test("duplicate exact tuples and duplicate ids are rejected (one entry per tuple)", () => {
    expect(() =>
      validateConformanceTupleRegistry(
        registryDocument([
          entryFixture({ id: "first" }),
          entryFixture({ id: "second" }),
        ]),
      ),
    ).toThrow("one entry per tuple");
    expect(() =>
      validateConformanceTupleRegistry(
        registryDocument([
          entryFixture({ id: "same" }),
          entryFixture({
            id: "same",
            tuple: { ...unboundCodexTuple(), harness: "claude-code" },
          }),
        ]),
      ),
    ).toThrow("Duplicate");
  });

  test("an `auto` surface and unknown statuses are rejected by the schema", () => {
    const withAuto = registryDocument([entryFixture()]);
    (withAuto.tuples[0]!.tuple as { surface: string }).surface = "auto";
    expect(() => validateConformanceTupleRegistry(withAuto)).toThrow("invalid");

    const withBadStatus = registryDocument([entryFixture()]);
    (withBadStatus.tuples[0] as { status: string }).status = "supported";
    expect(() => validateConformanceTupleRegistry(withBadStatus)).toThrow("invalid");
  });

  test("internal-test evidence must name a repository test file (R-BAR-2)", () => {
    const document = registryDocument([
      entryFixture({
        status: "implementation-validated",
        evidence: [
          {
            kind: "internal-test",
            ref: "docs/prd/36-playbook-packaging-compiler-and-harness-adapters.md",
            note: "A PRD is not a test.",
          },
        ],
      }),
    ]);
    expect(() => validateConformanceTupleRegistry(document)).toThrow(
      "not a repository test file",
    );
  });

  test("embedded status meanings and derivation rules cannot drift from the canonical constants (R-REG-1)", () => {
    const driftedMeanings = registryDocument([entryFixture()]);
    driftedMeanings.statuses = {
      ...driftedMeanings.statuses,
      provisional: "Probably fine.",
    };
    expect(() => validateConformanceTupleRegistry(driftedMeanings)).toThrow(
      "status meanings drifted",
    );

    const driftedRules = registryDocument([entryFixture()]);
    (driftedRules as { verdictDerivation: unknown }).verdictDerivation = {
      advancesToConformanceValidated: { verdicts: ["pass", "blocked"] },
    };
    expect(() => validateConformanceTupleRegistry(driftedRules)).toThrow(
      "derivation rules drifted",
    );
  });

  test("a missing registry file fails closed rather than reading as zero claims", () => {
    expect(() =>
      loadConformanceTupleRegistry({ repoRoot: path.join(REPO_ROOT, "packages") }),
    ).toThrow("not found");
  });
});

function bindTestClaim(input: { target: Omit<ConformanceSupportTuple, "scenario" | "modelOrProvider" | "runtime" | "generatedOutputKind" | "surface"> & { surface: "native" | "agents-standard" | "auto" } }) {
  return { ...input.target, scenario: null, modelOrProvider: null, runtime: null };
}
