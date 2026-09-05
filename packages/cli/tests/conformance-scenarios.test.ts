import type { ConformanceSupportTuple } from "../src/conformance";
/**
 * W18 R9 P2 coverage, revised by W18 R13 P1 (PRD 43): the
 * install-discover-invoke-uninstall evidence bar as the packaging scenario
 * shape (t1), bar outcomes bound to the Phase 1 tuple registry (t2,
 * R-BAR-1..2, R-REG-3), faithful-simulation mechanics as a declared
 * binding-level D8 choice recorded in result records (t3), the four
 * harness-agnostic first-pass definitions with Codex target bindings
 * (R-SCHEMA-1..3), honest blocked precondition resolution (t8, R-KEEP-1),
 * and the registry <-> scenario linkage with uncovered-target absence
 * explicit (t9, R-SCEN-2 as re-expressed by R-SCHEMA-2).
 *
 * Test layer: unit (R-LAYER-1) — pure-function tests over the conformance
 * scenario contract and the committed definition/fixture assets, no CLI. They
 * prove the machinery and the honesty of the authored definitions — they are
 * NEVER harness-recognition evidence, and internal tests passing is never
 * evidence that a harness recognizes or can use the output. Real recognition,
 * installation, and invocation evidence comes only from recorded scenario
 * runs against a real (or declared faithfully simulated) harness meeting the
 * R-BAR-1 bar (R-LAYER-2, PRD 36 R-TEST-5).
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import {
  CONFORMANCE_EVIDENCE_BAR_STAGES,
  CONFORMANCE_SCENARIO_SPECS_DIR,
  REQUIRED_FIRST_PASS_SCENARIOS,
  REQUIRED_FIRST_PASS_TARGET,
  bindConformanceSupportTuple,
  blockedPackagingResultRecord,
  getScenarioTargetBinding,
  listConformanceScenarioRegistryLinkageErrors,
  listMissingRequiredFirstPassScenarioIds,
  listUnassertedEvidenceBarStages,
  loadConformanceTupleRegistry,
  loadPackagingConformanceScenarioSpec,
  loadPackagingConformanceScenarioSpecs,
  probePackagingScenarioPreconditions,
  projectPackagingResultToRecordedRun,
  queryConformanceTuples,
  recordConformanceRunOnRegistryEntry,
  scenarioAssertsFullEvidenceBar,
  splitConformanceScenarioId,
  validatePackagingConformanceResultRecord,
  validatePackagingConformanceScenarioSpec,
  type PackagingConformanceResultRecord,
  type PackagingConformanceScenarioSpec,
  type ConformanceTupleRegistryEntry,
  type ScenarioPreconditionExecutor,
} from "../src/conformance";


import { TEMPLATE_ROOT } from "../src/utils";

const REPO_ROOT = path.resolve(TEMPLATE_ROOT, "..", "..", "..");

/* ------------------------------------------------------------------------ */
/* Fixtures                                                                  */
/* ------------------------------------------------------------------------ */

type SpecDocument = Record<string, unknown> & {
  steps: Array<Record<string, unknown>>;
  packagingExtension: Record<string, unknown> & {
    evidenceBar: Record<string, string[]>;
    preconditions: Array<Record<string, unknown>>;
    targets: Record<string, Record<string, unknown>>;
  };
};

function specDocument(): SpecDocument {
  return {
    schemaVersion: "conformance.scenario.v1",
    scenarioId: "packaging/fixture-scenario",
    scenarioVersion: "1.0.0",
    title: "Fixture scenario",
    sourceRequirements: ["docs/prd/43-conformance-scenario-model-and-execution-kits.md#requirements"],
    safetyMode: "external-provider-run",
    requiresNetwork: true,
    requiresCredentials: true,
    destructive: false,
    prerequisites: ["Node.js >= 18."],
    steps: [
      {
        kind: "command",
        run: "make-docs run package ship --harness codex --output-kind plugin --surface native --scope project --package-id fixture --support-evidence-ref conformance/tuple-registry.json#fixture-codex-plugin --json agent/fixture",
        transcript: "evidence-json",
        barStage: "install",
      },
      { kind: "harness-action", action: "List the harness surface.", barStage: "discover" },
      { kind: "assertion", assert: "The probe marker appears.", barStage: "invoke" },
      {
        kind: "command",
        run: "make-docs setup remove --backup --yes < /dev/null",
        transcript: "evidence-non-tty",
        barStage: "uninstall",
      },
    ],
    expectedEvidence: ["Evidence for all four bar stages."],
    artifactPolicy: "local-generated",
    supportClaimScope: "scenario-harness-model-provider-runtime",
    packagingExtension: {
      domain: "packaging",
      evidenceBar: {
        install: ["Install asserted."],
        discover: ["Discover asserted."],
        invoke: ["Invoke asserted."],
        uninstall: ["Uninstall asserted."],
      },
      preconditions: [
        {
          id: "harness-cli-available",
          kind: "harness-cli",
          description: "The target harness CLI is on PATH.",
          probe: "command-succeeds",
          onUnmet: "blocked",
        },
        {
          id: "harness-authenticated",
          kind: "harness-auth",
          description: "The target harness CLI is signed in.",
          probe: "command-succeeds",
          onUnmet: "blocked",
        },
        {
          id: "network-available",
          kind: "network",
          description: "Network access attested by the operator.",
          probe: "operator-attestation",
          onUnmet: "blocked",
        },
        {
          id: "model-routing-available",
          kind: "model-routing",
          description: "Model routing attested by the operator.",
          probe: "operator-attestation",
          onUnmet: "blocked",
        },
      ],
      transcriptPolicy: "json-or-non-tty",
      workspacePolicy: "disposable-fixture-workspace",
      fixturePlaybooks: [
        "conformance/fixtures/agent/conformance-skill-probe.playbook.md",
      ],
      targets: {
        codex: {
          registryTupleIds: ["fixture-codex-plugin"],
          harnessExecution: { mode: "real-harness", simulationMechanics: null },
          preconditionProbes: {
            "harness-cli-available": { command: "codex", args: ["--version"] },
            "harness-authenticated": { command: "codex", args: ["login", "status"] },
          },
        },
      },
    },
  };
}

function validSpec(mutate?: (document: SpecDocument) => void): PackagingConformanceScenarioSpec {
  const document = specDocument();
  mutate?.(document);
  return validatePackagingConformanceScenarioSpec(document);
}

function resultRecordFixture(
  overrides: Partial<PackagingConformanceResultRecord> = {},
): PackagingConformanceResultRecord {
  return {
    schemaVersion: "conformance.result.v1",
    resultId: "2026-07-04-fixture-scenario-codex-npm-cli",
    scenarioId: "packaging/fixture-scenario",
    scenarioVersion: "1.0.0",
    runDate: "2026-07-04",
    makeDocsVersion: "0.0.0-test",
    harness: "codex",
    modelName: "gpt-5",
    providerOrRoutingLayer: "openai",
    modelVersion: "unknown",
    runtimeDistribution: "npm-cli",
    runtimeVersion: "node>=18",
    producedFiles: [],
    relevantDiffs: [],
    exitStatus: 0,
    transcriptLogPointer: "discarded-with-session",
    verdict: "pass",
    reason: "All four bar stages asserted against the fixture workspace.",
    caveats: [],
    reviewerStatus: "reviewed",
    supportClaimUse: "nominal-tuple",
    caveatsSurfaced: false,
    evidenceBar: { install: true, discover: true, invoke: true, uninstall: true },
    simulated: false,
    simulationMechanicsRef: null,
    transcriptFormat: "json",
    ...overrides,
  };
}

function entryFixture(
  overrides: Partial<ConformanceTupleRegistryEntry> = {},
): ConformanceTupleRegistryEntry {
  return {
    id: "fixture-codex-plugin",
    tuple: bindConformanceSupportTuple({
      claim: bindTestClaim({
        target: { harness: "codex", outputKind: "plugin", surface: "native", scope: "project" },
      }),
      generatedOutputKind: "generated-plugin",
    }),
    status: "provisional",
    evidence: [],
    recordedRuns: [],
    plannedScenarios: ["packaging/fixture-scenario"],
    notes: ["Fixture entry."],
    ...overrides,
  };
}

const RECORD_REF = "conformance/results/codex/2026-07-04-fixture-scenario-001.json";

function record(
  entry: ConformanceTupleRegistryEntry,
  recordOverrides: Partial<PackagingConformanceResultRecord> = {},
  spec: PackagingConformanceScenarioSpec = validSpec(),
): ConformanceTupleRegistryEntry {
  return recordConformanceRunOnRegistryEntry({
    entry,
    spec,
    record: resultRecordFixture(recordOverrides),
    recordRef: RECORD_REF,
  });
}

/* ------------------------------------------------------------------------ */
/* Stage 1: the evidence bar as the scenario shape                           */
/* ------------------------------------------------------------------------ */

describe("the packaging scenario definition contract (t1, R-BAR-1, R-SCHEMA-1..2)", () => {
  test("a conformant definition validates and asserts the full install-discover-invoke-uninstall bar", () => {
    const spec = validSpec();
    expect(scenarioAssertsFullEvidenceBar(spec)).toBe(true);
    expect(listUnassertedEvidenceBarStages(spec)).toEqual([]);
  });

  test("dropping any single stage's assertions makes the definition bar-ineligible", () => {
    for (const stage of CONFORMANCE_EVIDENCE_BAR_STAGES) {
      const spec = validSpec((document) => {
        document.packagingExtension.evidenceBar[stage] = [];
      });
      expect(scenarioAssertsFullEvidenceBar(spec)).toBe(false);
      expect(listUnassertedEvidenceBarStages(spec)).toEqual([stage]);
    }
  });

  test("scenario ids are domain-qualified with no harness token in the id form (R-ORG-1, D-025)", () => {
    expect(() =>
      validSpec((document) => {
        document.scenarioId = "codex-fixture-scenario";
      }),
    ).toThrow("domain-qualified");
    expect(splitConformanceScenarioId("packaging/fixture-scenario")).toEqual({
      domain: "packaging",
      outcome: "fixture-scenario",
    });
    expect(() => splitConformanceScenarioId("fixture-scenario")).toThrow("domain-qualified");
  });

  test("the extension's domain must equal the scenario id's domain prefix (R-ORG-1)", () => {
    expect(() =>
      validSpec((document) => {
        document.packagingExtension.domain = "playbook-runs";
      }),
    ).toThrow("domain prefix");
  });

  test("the superseded harness-identity spellings are rejected (R-SCHEMA-1..2, R-DISC-1)", () => {
    // Top-level `harness` was deleted from the extension.
    expect(() =>
      validSpec((document) => {
        document.packagingExtension.harness = "codex";
      }),
    ).toThrow("invalid");
    // `futureHarnesses` is retired: absence from `targets` is the reported gap.
    expect(() =>
      validSpec((document) => {
        document.packagingExtension.futureHarnesses = [];
      }),
    ).toThrow("invalid");
    // The `characterization` spelling is renamed to `discoveryKit`.
    expect(() =>
      validSpec((document) => {
        document.packagingExtension.characterization = { purpose: "stale spelling" };
      }),
    ).toThrow("invalid");
    // Definition-level harnessExecution and registryTupleIds moved into targets.
    expect(() =>
      validSpec((document) => {
        document.packagingExtension.harnessExecution = {
          mode: "real-harness",
          simulationMechanics: null,
        };
      }),
    ).toThrow("invalid");
    expect(() =>
      validSpec((document) => {
        document.packagingExtension.registryTupleIds = ["fixture-codex-plugin"];
      }),
    ).toThrow("invalid");
  });

  test("every probeable template precondition needs a probe command on every target binding (R-SCHEMA-1)", () => {
    expect(() =>
      validSpec((document) => {
        delete (
          document.packagingExtension.targets.codex!.preconditionProbes as Record<
            string,
            unknown
          >
        )["harness-authenticated"];
      }),
    ).toThrow("no probe command");
    // A probe for an attestation-only precondition is misplaced target knowledge.
    expect(() =>
      validSpec((document) => {
        (
          document.packagingExtension.targets.codex!.preconditionProbes as Record<
            string,
            unknown
          >
        )["network-available"] = { command: "ping", args: ["-c", "1", "example.com"] };
      }),
    ).toThrow("not a probeable precondition");
  });

  test("an uncovered target is a reported gap, never implied coverage (R-SCHEMA-2)", () => {
    const spec = validSpec();
    expect(() => getScenarioTargetBinding(spec, "claude-code")).toThrow("reported gap");
    expect(() => getScenarioTargetBinding(spec, "pi")).toThrow("covered targets: codex");
    expect(getScenarioTargetBinding(spec, "codex").registryTupleIds).toEqual([
      "fixture-codex-plugin",
    ]);
  });

  test("the retired `--write` flag is rejected in scenario scripts (R-026, PRD 41)", () => {
    expect(() =>
      validSpec((document) => {
        document.steps.push({
          kind: "command",
          run: "make-docs run package write --plan-json plan.json --write",
        });
      }),
    ).toThrow("retired");
  });

  test("an evidence-json command step must pin --json so rendered text never enters evidence (R-026)", () => {
    expect(() =>
      validSpec((document) => {
        document.steps.push({
          kind: "command",
          run: "make-docs run package preview --harness codex",
          transcript: "evidence-json",
        });
      }),
    ).toThrow("--json");
  });

  test("a destructive scenario must use the destructive temp-fixture safety mode (R-KEEP-1)", () => {
    expect(() =>
      validSpec((document) => {
        document.destructive = true;
      }),
    ).toThrow("destructive-temp-fixture-apply");
  });

  test("declared credential and network requirements must have blocked-resolving preconditions (t8)", () => {
    expect(() =>
      validSpec((document) => {
        document.packagingExtension.preconditions =
          document.packagingExtension.preconditions.filter(
            (precondition) => precondition.kind !== "harness-auth",
          );
        delete (
          document.packagingExtension.targets.codex!.preconditionProbes as Record<
            string,
            unknown
          >
        )["harness-authenticated"];
      }),
    ).toThrow("harness-auth");
    expect(() =>
      validSpec((document) => {
        document.packagingExtension.preconditions =
          document.packagingExtension.preconditions.filter(
            (precondition) => precondition.kind !== "network",
          );
      }),
    ).toThrow("network");
  });

  test("faithful simulation must declare its reviewed mechanics on the binding; real-harness must not (t3, D8)", () => {
    expect(() =>
      validSpec((document) => {
        document.packagingExtension.targets.codex!.harnessExecution = {
          mode: "faithful-simulation",
          simulationMechanics: null,
        };
      }),
    ).toThrow("invalid");
    expect(
      getScenarioTargetBinding(
        validSpec((document) => {
          document.packagingExtension.targets.codex!.harnessExecution = {
            mode: "faithful-simulation",
            simulationMechanics:
              "Reviewed local harness double replaying recorded Codex listing responses.",
          };
        }),
        "codex",
      ).harnessExecution.mode,
    ).toBe("faithful-simulation");
    expect(() =>
      validSpec((document) => {
        document.packagingExtension.targets.codex!.harnessExecution = {
          mode: "real-harness",
          simulationMechanics: "not allowed here",
        };
      }),
    ).toThrow("invalid");
  });

  test("duplicate precondition ids and foreign schema versions are rejected", () => {
    expect(() =>
      validSpec((document) => {
        document.packagingExtension.preconditions.push({
          ...document.packagingExtension.preconditions[0]!,
        });
      }),
    ).toThrow("duplicate precondition");
    expect(() =>
      validSpec((document) => {
        document.schemaVersion = "conformance.scenario.v2";
      }),
    ).toThrow("invalid");
  });
});

describe("bar outcomes bind to the Phase 1 registry (t2, R-BAR-2, R-REG-3)", () => {
  test("a qualifying `pass` meeting all four stages advances the tuple and binds run metadata", () => {
    const advanced = record(entryFixture());
    expect(advanced.status).toBe("conformance-validated");
    expect(advanced.tuple.scenario).toBe("packaging/fixture-scenario");
    expect(advanced.tuple.modelOrProvider).toBe("gpt-5");
    expect(advanced.tuple.runtime).toBe("npm-cli");
    expect(advanced.recordedRuns).toHaveLength(1);
    expect(advanced.recordedRuns[0]?.recordRef).toBe(RECORD_REF);
  });

  test("`pass-with-caveats` advances only with surfaced caveats", () => {
    const surfaced = record(entryFixture(), {
      verdict: "pass-with-caveats",
      caveats: ["Marketplace refresh required before discovery."],
      caveatsSurfaced: true,
    });
    expect(surfaced.status).toBe("conformance-validated");
    expect(surfaced.recordedRuns[0]?.caveats).toEqual([
      "Marketplace refresh required before discovery.",
    ]);

    const unsurfaced = record(entryFixture(), {
      verdict: "pass-with-caveats",
      caveats: ["Marketplace refresh required before discovery."],
      caveatsSurfaced: false,
      supportClaimUse: "none",
    });
    expect(unsurfaced.status).toBe("provisional");
    expect(unsurfaced.tuple.scenario).toBeNull();
  });

  test("no verdict below the bar ever advances, and blocked runs stay honest history", () => {
    for (const verdict of ["inconsistent", "unsupported"] as const) {
      const unchanged = record(entryFixture(), {
        verdict,
        supportClaimUse: "none",
        reviewerStatus: "unreviewed",
      });
      expect(unchanged.status).toBe("provisional");
      expect(unchanged.recordedRuns).toHaveLength(1);
    }
    const blocked = record(entryFixture(), {
      verdict: "blocked",
      supportClaimUse: "none",
      evidenceBar: { install: false, discover: false, invoke: false, uninstall: false },
      reviewerStatus: "unreviewed",
    });
    expect(blocked.status).toBe("provisional");
    expect(blocked.tuple.scenario).toBeNull();
    expect(blocked.recordedRuns[0]?.verdict).toBe("blocked");
  });

  test("internal tests cap at implementation-validated even after a blocked run (R-BAR-2, R-LAYER-2)", () => {
    const entry = entryFixture({
      status: "implementation-validated",
      evidence: [
        {
          kind: "internal-test",
          ref: "packages/cli/tests/playbook-packaging-compiler.test.ts",
          note: "Shape assertions only; never harness recognition.",
        },
      ],
    });
    const afterBlocked = record(entry, {
      verdict: "blocked",
      supportClaimUse: "none",
      evidenceBar: { install: false, discover: false, invoke: false, uninstall: false },
      reviewerStatus: "unreviewed",
    });
    expect(afterBlocked.status).toBe("implementation-validated");
  });

  test("a missing bar stage in the record never qualifies (R-BAR-1)", () => {
    for (const stage of CONFORMANCE_EVIDENCE_BAR_STAGES) {
      const evidenceBar = { install: true, discover: true, invoke: true, uninstall: true };
      evidenceBar[stage] = false;
      const unchanged = record(entryFixture(), { evidenceBar, supportClaimUse: "none" });
      expect(unchanged.status, stage).toBe("provisional");
    }
  });

  test("a run may not claim a bar stage its scenario does not assert: incomplete scenarios cannot advance (t1)", () => {
    const spec = validSpec((document) => {
      document.packagingExtension.evidenceBar.uninstall = [];
    });
    expect(() => record(entryFixture(), {}, spec)).toThrow("cannot advance");
    // The same record with the unasserted stage honestly false records fine
    // and does not advance: the bar is all four stages, always.
    const unchanged = record(
      entryFixture(),
      {
        evidenceBar: { install: true, discover: true, invoke: true, uninstall: false },
        supportClaimUse: "none",
      },
      spec,
    );
    expect(unchanged.status).toBe("provisional");
  });

  test("scenario, target-tuple, target-coverage, and harness mismatches are refused (R-TUPLE-1, R-SCHEMA-2)", () => {
    expect(() => record(entryFixture(), { scenarioId: "packaging/some-other-scenario" })).toThrow(
      "belongs to scenario",
    );
    expect(() => record(entryFixture({ id: "an-untargeted-entry" }))).toThrow(
      "does not target",
    );
    // A record run on an uncovered harness is refused as a reported gap.
    expect(() => record(entryFixture(), { harness: "claude-code" })).toThrow(
      "reported gap",
    );
    // A covered harness still may not land on another harness's tuple.
    const crossHarnessSpec = validSpec((document) => {
      document.packagingExtension.targets["claude-code"] = {
        registryTupleIds: ["fixture-codex-plugin"],
        harnessExecution: { mode: "real-harness", simulationMechanics: null },
        preconditionProbes: {
          "harness-cli-available": { command: "claude", args: ["--version"] },
          "harness-authenticated": { command: "claude", args: ["auth", "status"] },
        },
      };
    });
    expect(() => record(entryFixture(), { harness: "claude-code" }, crossHarnessSpec)).toThrow(
      "Harness mismatch",
    );
  });

  test("simulation posture must match the binding's declared mode, and declared simulation can advance (t3)", () => {
    expect(() =>
      record(entryFixture(), { simulated: true, simulationMechanicsRef: "docs/x.md" }),
    ).toThrow("simulated=true");

    const simulationSpec = validSpec((document) => {
      document.packagingExtension.targets.codex!.harnessExecution = {
        mode: "faithful-simulation",
        simulationMechanics:
          "Reviewed local harness double replaying recorded Codex listing responses.",
      };
    });
    expect(() => record(entryFixture(), {}, simulationSpec)).toThrow("simulated=false");
    const advanced = record(
      entryFixture(),
      {
        simulated: true,
        simulationMechanicsRef:
          "conformance/scenarios/packaging/fixture-scenario.json",
      },
      simulationSpec,
    );
    expect(advanced.status).toBe("conformance-validated");
    expect(advanced.recordedRuns[0]?.simulated).toBe(true);
  });

  test("result records enforce the lab honesty rules structurally", () => {
    expect(() =>
      validatePackagingConformanceResultRecord(
        resultRecordFixture({
          verdict: "blocked",
          evidenceBar: { install: false, discover: false, invoke: false, uninstall: false },
        }),
      ),
    ).toThrow("supportClaimUse none");
    expect(() =>
      validatePackagingConformanceResultRecord(
        resultRecordFixture({ verdict: "blocked", supportClaimUse: "none" }),
      ),
    ).toThrow("absence of evidence");
    expect(() =>
      validatePackagingConformanceResultRecord(
        resultRecordFixture({ simulated: true, simulationMechanicsRef: null }),
      ),
    ).toThrow("simulation");
    expect(() =>
      validatePackagingConformanceResultRecord(
        resultRecordFixture({ simulated: false, simulationMechanicsRef: "docs/x.md" }),
      ),
    ).toThrow("must not cite");
    // A harness-named (non-domain-qualified) scenario id no longer validates.
    expect(() =>
      validatePackagingConformanceResultRecord(
        resultRecordFixture({ scenarioId: "codex-fixture-scenario" }),
      ),
    ).toThrow("domain-qualified");
  });
});

describe("precondition probes resolve blocked honestly per target (t8, R-KEEP-1)", () => {
  const everythingAvailable: ScenarioPreconditionExecutor = {
    commandSucceeds: () => true,
  };
  const codexMissing: ScenarioPreconditionExecutor = {
    commandSucceeds: (command) => command !== "codex",
  };

  test("a missing harness CLI and unattested expensive preconditions block the run", () => {
    const report = probePackagingScenarioPreconditions(validSpec(), {
      harness: "codex",
      executor: codexMissing,
    });
    expect(report.runnable).toBe(false);
    expect(report.unmet.map((outcome) => outcome.id).sort()).toEqual([
      "harness-authenticated",
      "harness-cli-available",
      "model-routing-available",
      "network-available",
    ]);
  });

  test("probing an uncovered target fails closed as a reported gap (R-SCHEMA-2)", () => {
    expect(() =>
      probePackagingScenarioPreconditions(validSpec(), {
        harness: "pi",
        executor: everythingAvailable,
      }),
    ).toThrow("reported gap");
  });

  test("attestation is explicit: network and model routing default to unmet even with the CLI present", () => {
    const unattested = probePackagingScenarioPreconditions(validSpec(), {
      harness: "codex",
      executor: everythingAvailable,
    });
    expect(unattested.runnable).toBe(false);
    expect(unattested.unmet.map((outcome) => outcome.kind).sort()).toEqual([
      "model-routing",
      "network",
    ]);
    const attested = probePackagingScenarioPreconditions(validSpec(), {
      harness: "codex",
      executor: everythingAvailable,
      attestations: ["network-available", "model-routing-available"],
    });
    expect(attested.runnable).toBe(true);
    expect(attested.unmet).toEqual([]);
  });

  test("an unmet precondition resolves to a valid blocked result record that advances nothing", () => {
    const spec = validSpec();
    const report = probePackagingScenarioPreconditions(spec, {
      harness: "codex",
      executor: codexMissing,
    });
    const blocked = blockedPackagingResultRecord({
      spec,
      harness: "codex",
      unmet: report.unmet,
      runDate: "2026-07-04",
      makeDocsVersion: "0.0.0-test",
      runtimeDistribution: "local-source",
      runtimeVersion: "node>=18",
    });
    // The blocked record is honest by construction and passes the lab rules.
    expect(validatePackagingConformanceResultRecord(blocked).verdict).toBe("blocked");
    expect(blocked.supportClaimUse).toBe("none");
    expect(blocked.reason).toContain("harness-cli-available");
    expect(Object.values(blocked.evidenceBar)).toEqual([false, false, false, false]);
    // The transcript pointer never names a repo-local home (D-024): a
    // blocked-before-execution session has no transcript to keep.
    expect(blocked.transcriptLogPointer).toBe("discarded-with-session");

    const entry = recordConformanceRunOnRegistryEntry({
      entry: entryFixture(),
      spec,
      record: blocked,
      recordRef: RECORD_REF,
    });
    expect(entry.status).toBe("provisional");
    expect(entry.tuple.scenario).toBeNull();
    expect(entry.recordedRuns[0]?.verdict).toBe("blocked");
  });

  test("a runnable scenario cannot be spelled blocked: an empty unmet list is refused", () => {
    expect(() =>
      blockedPackagingResultRecord({
        spec: validSpec(),
        harness: "codex",
        unmet: [],
        runDate: "2026-07-04",
        makeDocsVersion: "0.0.0-test",
        runtimeDistribution: "local-source",
        runtimeVersion: "node>=18",
      }),
    ).toThrow("must run instead");
  });

  test("projection carries the run metadata and simulation posture into the registry shape", () => {
    const run = projectPackagingResultToRecordedRun(resultRecordFixture(), RECORD_REF);
    expect(run).toMatchObject({
      runId: "2026-07-04-fixture-scenario-codex-npm-cli",
      scenario: "packaging/fixture-scenario",
      modelOrProvider: "gpt-5",
      runtime: "npm-cli",
      simulated: false,
      recordRef: RECORD_REF,
    });
    // Model-agnostic fallback: an unknown model binds the provider instead.
    expect(
      projectPackagingResultToRecordedRun(
        resultRecordFixture({ modelName: "unknown" }),
        RECORD_REF,
      ).modelOrProvider,
    ).toBe("openai");
  });
});

function bindTestClaim(input: { target: Omit<ConformanceSupportTuple, "scenario" | "modelOrProvider" | "runtime" | "generatedOutputKind" | "surface"> & { surface: "native" | "agents-standard" | "auto" } }) {
  return { ...input.target, scenario: null, modelOrProvider: null, runtime: null };
}
