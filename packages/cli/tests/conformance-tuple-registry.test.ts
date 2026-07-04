/**
 * W18 R9 P1 coverage: the eight-field support tuple (R-TUPLE-1) and the
 * tuple registry under `docs/assets/conformance/` with its three statuses
 * and verdict-derived transitions (R-REG-1..3, R-BAR-2).
 *
 * Layer: these are UNIT tests over the conformance module and the committed
 * registry data file. They prove tuple/registry mechanics and the honesty of
 * the seeded statuses — they are NEVER harness-recognition evidence. Real
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
  CONFORMANCE_TUPLE_ADDED_DIMENSIONS,
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
import { outputKindForProfile } from "../src/operations/playbook-packaging/capability-descriptor";
import { FIRST_PARTY_HARNESS_CAPABILITY_DESCRIPTORS } from "../src/operations/playbook-packaging/descriptors";
import {
  PACKAGE_SUPPORT_TUPLE_DIMENSIONS,
  bindPackageSupportTuple,
} from "../src/operations/playbook-packaging/support-binding";
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
    claim: bindPackageSupportTuple({ target: CODEX_PLUGIN_TARGET }),
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

  test("extends the W18 R8 P4 packaging claim tuple by exactly the generated-output kind (R-SCOPE-1)", () => {
    // Consume-and-extend, never redefine: the seven packaging claim
    // dimensions all appear, in the same relative order, and the single
    // addition is `generatedOutputKind` inserted after `outputKind`.
    const packagingDims = [...PACKAGE_SUPPORT_TUPLE_DIMENSIONS];
    const withoutAddition = CONFORMANCE_SUPPORT_TUPLE_DIMENSIONS.filter(
      (dimension) => dimension !== "generatedOutputKind",
    );
    expect(withoutAddition).toEqual(packagingDims);
    expect(CONFORMANCE_TUPLE_ADDED_DIMENSIONS).toEqual(["generatedOutputKind"]);
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
        claim: bindPackageSupportTuple({
          target: { ...CODEX_PLUGIN_TARGET, surface: "auto" },
        }),
        generatedOutputKind: "generated-plugin",
      }),
    ).toThrow("resolved surface");
  });

  test("run metadata is the only seam that binds scenario, model/provider, and runtime (t2)", () => {
    const bound = bindRunMetadataOntoConformanceTuple(unboundCodexTuple(), {
      scenario: "codex-plugin-marketplace-install",
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
      scenario: "codex-plugin-marketplace-install",
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
            ref: "docs/prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md",
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

describe("the seeded W18 R8 adapter registry (t6, R-REG-1..3)", () => {
  const registry = loadConformanceTupleRegistry({ repoRoot: REPO_ROOT });

  test("lives at the R-REG-1 home and validates against the fail-closed loader", () => {
    expect(CONFORMANCE_TUPLE_REGISTRY_PATH).toBe(
      "docs/assets/conformance/tuple-registry.json",
    );
    expect(registry.record).toBe("make-docs.conformance.tuple-registry");
    expect(registry.tuples.length).toBeGreaterThan(0);
  });

  test("carries exactly the first-party adapter placement tuples: registry and descriptors cannot drift", () => {
    // Every W18 R8 first-party descriptor placement — (harness, surface,
    // scope) per container profile — must appear as exactly one registry
    // tuple, and the registry must carry nothing else. The generated-output
    // kind is the ownership-record kind the writer emits: export-only scopes
    // produce `export-only-file` records; installed scopes produce the
    // generated container record.
    const expected = new Set<string>();
    for (const descriptor of FIRST_PARTY_HARNESS_CAPABILITY_DESCRIPTORS) {
      for (const container of descriptor.containers) {
        const outputKind = outputKindForProfile(container.profile);
        for (const placement of container.layout.placements) {
          const generatedOutputKind =
            placement.scope === "export-only"
              ? "export-only-file"
              : outputKind === "plugin"
                ? "generated-plugin"
                : "generated-skills-bundle";
          expected.add(
            conformanceTupleKey({
              scenario: null,
              harness: descriptor.harnessId,
              surface: placement.surface,
              scope: placement.scope,
              outputKind,
              generatedOutputKind,
              modelOrProvider: null,
              runtime: null,
            }),
          );
        }
      }
    }
    const actual = new Set(registry.tuples.map((entry) => conformanceTupleKey(entry.tuple)));
    expect([...actual].sort()).toEqual([...expected].sort());
    expect(registry.tuples).toHaveLength(expected.size);
  });

  test("represents the absence of real-harness evidence honestly: nothing is conformance-validated", () => {
    expect(queryConformanceTuples(registry, { status: "conformance-validated" })).toEqual([]);
    for (const entry of registry.tuples) {
      expect(entry.recordedRuns, entry.id).toEqual([]);
      // Every unproven tuple keeps its evidence-owned dimensions unbound.
      expect(listUnboundConformanceTupleDimensions(entry.tuple), entry.id).toEqual([
        "scenario",
        "modelOrProvider",
        "runtime",
      ]);
      expect(CONFORMANCE_TUPLE_STATUSES).toContain(entry.status);
    }
  });

  test("every status links to its evidence: internal-test refs exist on disk, provisional entries say why", () => {
    for (const entry of registry.tuples) {
      if (entry.status === "implementation-validated") {
        const internalRefs = entry.evidence.filter(
          (evidenceRef) => evidenceRef.kind === "internal-test",
        );
        expect(internalRefs.length, entry.id).toBeGreaterThan(0);
        for (const evidenceRef of internalRefs) {
          expect(
            existsSync(path.join(REPO_ROOT, evidenceRef.ref)),
            `${entry.id}: ${evidenceRef.ref}`,
          ).toBe(true);
          // The R-TEST-5/R-LAYER-2 boundary rides every citation: internal
          // tests are never harness-recognition evidence.
          expect(evidenceRef.note, entry.id).toMatch(/never harness recognition/i);
        }
      } else {
        // Provisional entries carry no internal-test refs (or they would
        // derive differently) and explain the evidence gap in notes.
        expect(entry.status, entry.id).toBe("provisional");
        expect(entry.notes.length, entry.id).toBeGreaterThan(0);
      }
    }
  });

  test("the negative Codex recognition probe (R-021) is recorded and advances nothing", () => {
    const entry = getConformanceTupleEntry(registry, unboundCodexTuple());
    expect(entry).not.toBeNull();
    expect(entry!.id).toBe("codex-plugin-native-project");
    const probe = entry!.evidence.find(
      (evidenceRef) => evidenceRef.kind === "real-harness-probe",
    );
    expect(probe).toBeDefined();
    expect(probe!.ref).toBe("docs/prd/03-open-questions-and-risk-register.md");
    expect(probe!.note).toContain("NEGATIVE");
    expect(probe!.note).toContain("Codex v0.142.4");
    // The probe neither advances nor demotes: the status stays exactly what
    // the internal file-and-structure tests derive.
    expect(entry!.status).toBe("implementation-validated");
    expect(deriveConformanceTupleStatus(entry!)).toBe("implementation-validated");
  });

  test("Pi tuples report future-scenario absence rather than implying coverage (R-SCEN-2)", () => {
    const piEntries = queryConformanceTuples(registry, { harness: "pi" });
    expect(piEntries.length).toBeGreaterThan(0);
    for (const entry of piEntries) {
      expect(entry.recordedRuns, entry.id).toEqual([]);
      expect(entry.notes.join(" "), entry.id).toContain("R-SCEN-2");
    }
  });

  test("the registry is queryable by exact dimension and status (R-REG-1)", () => {
    const codexPlugins = queryConformanceTuples(registry, {
      harness: "codex",
      outputKind: "plugin",
    });
    expect(codexPlugins.map((entry) => entry.id).sort()).toEqual([
      "codex-plugin-native-export-only",
      "codex-plugin-native-global",
      "codex-plugin-native-project",
    ]);
    const implementationValidated = queryConformanceTuples(registry, {
      status: "implementation-validated",
    });
    expect(implementationValidated.map((entry) => entry.id).sort()).toEqual([
      "claude-code-plugin-native-project",
      "claude-code-skills-bundle-agents-standard-project",
      "codex-plugin-native-export-only",
      "codex-plugin-native-project",
      "pi-plugin-native-project",
    ]);
    // `null` matches only unbound dimensions; every seeded tuple is unbound.
    expect(queryConformanceTuples(registry, { scenario: null })).toHaveLength(
      registry.tuples.length,
    );
  });
});
