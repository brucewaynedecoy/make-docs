/**
 * W18 R9 P2 coverage: the install-discover-invoke-uninstall evidence bar as
 * the packaging scenario shape (t1), bar outcomes bound to the Phase 1 tuple
 * registry (t2, R-BAR-1..2, R-REG-3), faithful-simulation mechanics as a
 * declared spec-level D8 choice recorded in result records (t3), the four
 * Codex-first first-pass scenario specs (t4-t7, R-SCEN-1), honest blocked
 * precondition resolution (t8, R-KEEP-1), and the registry <-> scenario
 * linkage with Pi absence explicit (t9, R-SCEN-2).
 *
 * Layer: these are UNIT tests over the conformance scenario contract and the
 * committed spec/fixture assets. They prove the machinery and the honesty of
 * the authored specs — they are NEVER harness-recognition evidence. Real
 * recognition, installation, and invocation evidence comes only from
 * recorded scenario runs against a real (or declared faithfully simulated)
 * harness meeting the R-BAR-1 bar (R-LAYER-2, PRD 36 R-TEST-5).
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import {
  CONFORMANCE_EVIDENCE_BAR_STAGES,
  CONFORMANCE_SCENARIO_SPECS_DIR,
  REQUIRED_FIRST_PASS_SCENARIOS,
  bindConformanceSupportTuple,
  blockedPackagingResultRecord,
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
  validatePackagingConformanceResultRecord,
  validatePackagingConformanceScenarioSpec,
  type PackagingConformanceResultRecord,
  type PackagingConformanceScenarioSpec,
  type ConformanceTupleRegistryEntry,
  type ScenarioPreconditionExecutor,
} from "../src/conformance";
import { parseAndValidatePlaybook } from "../src/playbook";
import { bindPackageSupportTuple } from "../src/operations/playbook-packaging/support-binding";
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
  };
};

function specDocument(): SpecDocument {
  return {
    schemaVersion: "conformance.scenario.v1",
    scenarioId: "fixture-scenario",
    scenarioVersion: "1.0.0",
    title: "Fixture scenario",
    sourceRequirements: ["docs/prd/37-enhance-playbook-and-package-conformance.md"],
    safetyMode: "external-provider-run",
    requiresNetwork: true,
    requiresCredentials: true,
    destructive: false,
    prerequisites: ["Node.js >= 18."],
    steps: [
      {
        kind: "command",
        run: "make-docs run package ship --harness codex --output-kind plugin --surface native --scope project --package-id fixture --json agent/fixture",
        transcript: "evidence-json",
        barStage: "install",
      },
      { kind: "harness-action", action: "List the harness surface.", barStage: "discover" },
      { kind: "assertion", assert: "The probe marker appears.", barStage: "invoke" },
      {
        kind: "command",
        run: "make-docs setup remove --backup < /dev/null",
        transcript: "evidence-non-tty",
        barStage: "uninstall",
      },
    ],
    expectedEvidence: ["Evidence for all four bar stages."],
    artifactPolicy: "local-generated",
    supportClaimScope: "scenario-harness-model-provider-runtime",
    packagingExtension: {
      harness: "codex",
      registryTupleIds: ["fixture-codex-plugin"],
      evidenceBar: {
        install: ["Install asserted."],
        discover: ["Discover asserted."],
        invoke: ["Invoke asserted."],
        uninstall: ["Uninstall asserted."],
      },
      preconditions: [
        {
          id: "codex-cli-available",
          kind: "harness-cli",
          description: "The Codex CLI is on PATH.",
          probe: { check: "command-succeeds", command: "codex", args: ["--version"] },
          onUnmet: "blocked",
        },
        {
          id: "codex-authenticated",
          kind: "harness-auth",
          description: "The Codex CLI is signed in.",
          probe: { check: "command-succeeds", command: "codex", args: ["login", "status"] },
          onUnmet: "blocked",
        },
        {
          id: "network-available",
          kind: "network",
          description: "Network access attested by the operator.",
          probe: { check: "operator-attestation" },
          onUnmet: "blocked",
        },
        {
          id: "model-routing-available",
          kind: "model-routing",
          description: "Model routing attested by the operator.",
          probe: { check: "operator-attestation" },
          onUnmet: "blocked",
        },
      ],
      harnessExecution: { mode: "real-harness", simulationMechanics: null },
      transcriptPolicy: "json-or-non-tty",
      workspacePolicy: "disposable-fixture-workspace",
      fixturePlaybooks: [
        "docs/assets/conformance/fixtures/agent/conformance-skill-probe.playbook.md",
      ],
      futureHarnesses: [],
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
    scenarioId: "fixture-scenario",
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
    transcriptLogPointer: ".make-docs/conformance/run-fixture/transcript.log",
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
      claim: bindPackageSupportTuple({
        target: { harness: "codex", outputKind: "plugin", surface: "native", scope: "project" },
      }),
      generatedOutputKind: "generated-plugin",
    }),
    status: "provisional",
    evidence: [],
    recordedRuns: [],
    plannedScenarios: ["fixture-scenario"],
    notes: ["Fixture entry."],
    ...overrides,
  };
}

const RECORD_REF = "docs/assets/conformance/results/2026-07-04-fixture-scenario.json";

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

describe("the packaging scenario spec contract (t1, R-BAR-1)", () => {
  test("a conformant spec validates and asserts the full install-discover-invoke-uninstall bar", () => {
    const spec = validSpec();
    expect(scenarioAssertsFullEvidenceBar(spec)).toBe(true);
    expect(listUnassertedEvidenceBarStages(spec)).toEqual([]);
  });

  test("dropping any single stage's assertions makes the spec bar-ineligible", () => {
    for (const stage of CONFORMANCE_EVIDENCE_BAR_STAGES) {
      const spec = validSpec((document) => {
        document.packagingExtension.evidenceBar[stage] = [];
      });
      expect(scenarioAssertsFullEvidenceBar(spec)).toBe(false);
      expect(listUnassertedEvidenceBarStages(spec)).toEqual([stage]);
    }
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

  test("faithful simulation must declare its reviewed mechanics; real-harness must not (t3, D8)", () => {
    expect(() =>
      validSpec((document) => {
        document.packagingExtension.harnessExecution = {
          mode: "faithful-simulation",
          simulationMechanics: null,
        };
      }),
    ).toThrow("invalid");
    expect(
      validSpec((document) => {
        document.packagingExtension.harnessExecution = {
          mode: "faithful-simulation",
          simulationMechanics:
            "Reviewed local harness double replaying recorded Codex listing responses.",
        };
      }).packagingExtension.harnessExecution.mode,
    ).toBe("faithful-simulation");
    expect(() =>
      validSpec((document) => {
        document.packagingExtension.harnessExecution = {
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
    expect(advanced.tuple.scenario).toBe("fixture-scenario");
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

  test("scenario, target-tuple, and harness mismatches are refused (R-TUPLE-1)", () => {
    expect(() => record(entryFixture(), { scenarioId: "some-other-scenario" })).toThrow(
      "belongs to scenario",
    );
    expect(() => record(entryFixture({ id: "an-untargeted-entry" }))).toThrow(
      "does not target",
    );
    expect(() => record(entryFixture(), { harness: "claude-code" })).toThrow(
      "Harness mismatch",
    );
  });

  test("simulation posture must match the scenario's declared mode, and declared simulation can advance (t3)", () => {
    expect(() =>
      record(entryFixture(), { simulated: true, simulationMechanicsRef: "docs/x.md" }),
    ).toThrow("simulated=true");

    const simulationSpec = validSpec((document) => {
      document.packagingExtension.harnessExecution = {
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
        simulationMechanicsRef: "docs/assets/conformance/scenarios/fixture-scenario.json",
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
  });
});

describe("precondition probes resolve blocked honestly (t8, R-KEEP-1)", () => {
  const everythingAvailable: ScenarioPreconditionExecutor = {
    commandSucceeds: () => true,
  };
  const codexMissing: ScenarioPreconditionExecutor = {
    commandSucceeds: (command) => command !== "codex",
  };

  test("a missing harness CLI and unattested expensive preconditions block the run", () => {
    const report = probePackagingScenarioPreconditions(validSpec(), {
      executor: codexMissing,
    });
    expect(report.runnable).toBe(false);
    expect(report.unmet.map((outcome) => outcome.id).sort()).toEqual([
      "codex-authenticated",
      "codex-cli-available",
      "model-routing-available",
      "network-available",
    ]);
  });

  test("attestation is explicit: network and model routing default to unmet even with the CLI present", () => {
    const unattested = probePackagingScenarioPreconditions(validSpec(), {
      executor: everythingAvailable,
    });
    expect(unattested.runnable).toBe(false);
    expect(unattested.unmet.map((outcome) => outcome.kind).sort()).toEqual([
      "model-routing",
      "network",
    ]);
    const attested = probePackagingScenarioPreconditions(validSpec(), {
      executor: everythingAvailable,
      attestations: ["network-available", "model-routing-available"],
    });
    expect(attested.runnable).toBe(true);
    expect(attested.unmet).toEqual([]);
  });

  test("an unmet precondition resolves to a valid blocked result record that advances nothing", () => {
    const spec = validSpec();
    const report = probePackagingScenarioPreconditions(spec, { executor: codexMissing });
    const blocked = blockedPackagingResultRecord({
      spec,
      unmet: report.unmet,
      runDate: "2026-07-04",
      makeDocsVersion: "0.0.0-test",
      runtimeDistribution: "local-source",
      runtimeVersion: "node>=18",
    });
    // The blocked record is honest by construction and passes the lab rules.
    expect(validatePackagingConformanceResultRecord(blocked).verdict).toBe("blocked");
    expect(blocked.supportClaimUse).toBe("none");
    expect(blocked.reason).toContain("codex-cli-available");
    expect(Object.values(blocked.evidenceBar)).toEqual([false, false, false, false]);

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
      scenario: "fixture-scenario",
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

/* ------------------------------------------------------------------------ */
/* Stage 2: the authored Codex-first first-pass specs                        */
/* ------------------------------------------------------------------------ */

describe("the four Codex-first first-pass specs (t4-t7, R-SCEN-1)", () => {
  const specs = loadPackagingConformanceScenarioSpecs({ repoRoot: REPO_ROOT });
  const specsById = new Map(specs.map((spec) => [spec.scenarioId, spec]));

  test("exactly the required first-pass scenarios are authored, none missing, none extra", () => {
    expect(specs.map((spec) => spec.scenarioId).sort()).toEqual(
      Object.keys(REQUIRED_FIRST_PASS_SCENARIOS).sort(),
    );
    expect(listMissingRequiredFirstPassScenarioIds(specs)).toEqual([]);
  });

  test("every spec targets Codex, asserts the full bar, and declares the lab safety protocol (t8)", () => {
    for (const spec of specs) {
      const label = spec.scenarioId;
      expect(spec.packagingExtension.harness, label).toBe("codex");
      expect(scenarioAssertsFullEvidenceBar(spec), label).toBe(true);
      expect(spec.safetyMode, label).toBe("external-provider-run");
      expect(spec.destructive, label).toBe(false);
      expect(spec.packagingExtension.workspacePolicy, label).toBe(
        "disposable-fixture-workspace",
      );
      expect(spec.packagingExtension.transcriptPolicy, label).toBe("json-or-non-tty");
      // No undeclared simulation: the first pass is the real harness or blocked.
      expect(spec.packagingExtension.harnessExecution.mode, label).toBe("real-harness");
      const kinds = new Set<string>(
        spec.packagingExtension.preconditions.map((precondition) => precondition.kind),
      );
      for (const kind of ["harness-cli", "harness-auth", "network", "model-routing"]) {
        expect(kinds.has(kind), `${label}: ${kind}`).toBe(true);
      }
      for (const precondition of spec.packagingExtension.preconditions) {
        expect(precondition.onUnmet, `${label}: ${precondition.id}`).toBe("blocked");
      }
      const futureHarnessIds = spec.packagingExtension.futureHarnesses.map(
        (future) => future.harness,
      );
      expect(futureHarnessIds, label).toEqual(["claude-code", "pi"]);
    }
  });

  test("scenario scripts use the remediated grammar and pin --json for evidence transcripts (R-026)", () => {
    for (const spec of specs) {
      const steps = [
        ...spec.steps,
        ...(spec.packagingExtension.characterization?.groundTruthSteps ?? []),
      ];
      for (const step of steps) {
        if (step.kind !== "command") {
          continue;
        }
        expect(step.run, spec.scenarioId).not.toMatch(/(^|\s)--write(\s|$)/);
        if (step.run.includes("make-docs run package")) {
          expect(step.transcript, `${spec.scenarioId}: ${step.run}`).toBe("evidence-json");
          expect(step.run, spec.scenarioId).toContain("--json");
          expect(step.run, spec.scenarioId).toMatch(
            /make-docs run package (plan|preview|write|ship)/,
          );
        }
      }
    }
  });

  test("scenario source Playbooks exist and are valid v2-form documents (R-026)", () => {
    const fixturePaths = new Set(
      specs.flatMap((spec) => spec.packagingExtension.fixturePlaybooks),
    );
    expect(fixturePaths.size).toBeGreaterThan(0);
    for (const fixturePath of fixturePaths) {
      const absolute = path.join(REPO_ROOT, fixturePath);
      expect(existsSync(absolute), fixturePath).toBe(true);
      const { model, diagnostics } = parseAndValidatePlaybook({
        sourcePath: absolute,
        source: readFileSync(absolute, "utf8"),
      });
      const errors = diagnostics.filter((diagnostic) => diagnostic.severity === "error");
      expect(errors, `${fixturePath}: ${errors.map((e) => e.message).join("; ")}`).toEqual([]);
      expect(model.frontmatter.schemaVersion?.value, fixturePath).toBe("make-docs.playbook.v2");
      expect(model.runnable, fixturePath).toBe(true);
    }
  });

  test("the dependency-check spec binds to probe-based checks with a source-vs-probe fixture (t6, PRD 40 R-DEP-3/R-FIX-1)", () => {
    const spec = specsById.get("codex-dependency-check-both-directions")!;
    expect(spec).toBeDefined();
    const fixturePath = spec.packagingExtension.fixturePlaybooks[0]!;
    const absolute = path.join(REPO_ROOT, fixturePath);
    const { model } = parseAndValidatePlaybook({
      sourcePath: absolute,
      source: readFileSync(absolute, "utf8"),
    });
    const checkable = model.dependencies.entries.filter((dependency) =>
      ["cli", "package-manager"].includes(dependency.kind.value ?? ""),
    );
    expect(checkable.length).toBeGreaterThanOrEqual(3);
    // At least one entry's source prose does not begin with the binary name,
    // so a Source-derived check would probe the wrong token (R-FIX-1).
    const divergent = checkable.filter(
      (dependency) =>
        dependency.probeDeclared &&
        !dependency.source.value.startsWith(dependency.probe.value),
    );
    expect(divergent.map((dependency) => dependency.id.value)).toContain("rg");
    // Both directions: a deliberately absent probe target is declared.
    const absent = checkable.find(
      (dependency) => dependency.probe.value === "make-docs-conformance-absent-probe",
    );
    expect(absent).toBeDefined();
    // The scenario's expectations name the probe binding, never source prose.
    expect(spec.packagingExtension.evidenceBar.install.join(" ")).toContain("probe");
    expect(spec.packagingExtension.evidenceBar.invoke.join(" ")).toContain(
      "make-docs-conformance-absent-probe",
    );
  });

  test("the plugin spec carries the characterization preamble resolving the R-021 probe (t5)", () => {
    const spec = specsById.get("codex-plugin-marketplace-install")!;
    const characterization = spec.packagingExtension.characterization;
    expect(characterization).toBeDefined();
    expect(characterization!.ordering).toBe("before-bar-assertions");
    expect(characterization!.resolvesProbe.registerItem).toBe("R-021");
    expect(characterization!.resolvesProbe.ref).toBe(
      "docs/prd/03-open-questions-and-risk-register.md",
    );
    expect(characterization!.groundTruthSteps.length).toBeGreaterThan(0);
    // Ground truth is established independent of Make Docs, then diffed.
    const groundTruthText = JSON.stringify(characterization!.groundTruthSteps);
    expect(groundTruthText).toContain("hand-minimal");
    expect(characterization!.diffTargets.join(" ")).toContain("marketplace source shape");
    expect(characterization!.diffTargets.join(" ")).toContain("install root layout");
    // The bar itself covers the new-thread usability outcome (R-SCEN-1).
    expect(spec.packagingExtension.evidenceBar.invoke.join(" ")).toContain(
      "started after installation",
    );
  });

  test("the uninstall-and-backup spec owns the PRD 36 R-PROV-2 cleanliness outcome (t7)", () => {
    const spec = specsById.get("codex-uninstall-backup-cleanliness")!;
    expect(spec.sourceRequirements).toContain(
      "docs/prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md",
    );
    const uninstallAssertions = spec.packagingExtension.evidenceBar.uninstall.join(" ");
    expect(uninstallAssertions).toContain("orphaning");
    expect(uninstallAssertions).toContain("user-authored");
    expect(uninstallAssertions).toContain("R-PROV-2");
    expect(uninstallAssertions).toContain("backup");
  });

  test("spec filenames equal their scenario ids and load individually", () => {
    for (const spec of specs) {
      const specPath = path.join(
        REPO_ROOT,
        CONFORMANCE_SCENARIO_SPECS_DIR,
        `${spec.scenarioId}.json`,
      );
      expect(existsSync(specPath), spec.scenarioId).toBe(true);
      expect(loadPackagingConformanceScenarioSpec(specPath).scenarioId).toBe(spec.scenarioId);
    }
  });
});

/* ------------------------------------------------------------------------ */
/* Registry linkage and honest absence                                       */
/* ------------------------------------------------------------------------ */

describe("registry <-> scenario linkage (t9, R-SCEN-2)", () => {
  const registry = loadConformanceTupleRegistry({ repoRoot: REPO_ROOT });
  const specs = loadPackagingConformanceScenarioSpecs({ repoRoot: REPO_ROOT });

  test("the committed linkage is bidirectionally consistent and binds no scenario dimension", () => {
    expect(listConformanceScenarioRegistryLinkageErrors(registry, specs)).toEqual([]);
    for (const entry of registry.tuples) {
      // Planned scenarios are forward-looking only: every tuple stays unbound
      // and unadvanced until a real run is recorded.
      expect(entry.tuple.scenario, entry.id).toBeNull();
      expect(entry.recordedRuns, entry.id).toEqual([]);
    }
  });

  test("the Codex first-pass targets plan their scenarios; every other tuple states an empty plan", () => {
    const planned = new Map(
      registry.tuples.map((entry) => [entry.id, [...entry.plannedScenarios].sort()]),
    );
    expect(planned.get("codex-plugin-native-project")).toEqual([
      "codex-plugin-marketplace-install",
      "codex-uninstall-backup-cleanliness",
    ]);
    expect(planned.get("codex-skills-bundle-native-project")).toEqual([
      "codex-dependency-check-both-directions",
      "codex-skills-bundle-discovery-invocation",
      "codex-uninstall-backup-cleanliness",
    ]);
    expect(planned.get("codex-skills-bundle-agents-standard-project")).toEqual([
      "codex-dependency-check-both-directions",
      "codex-skills-bundle-discovery-invocation",
    ]);
    for (const entry of registry.tuples) {
      if (
        ![
          "codex-plugin-native-project",
          "codex-skills-bundle-native-project",
          "codex-skills-bundle-agents-standard-project",
        ].includes(entry.id)
      ) {
        expect(entry.plannedScenarios, entry.id).toEqual([]);
      }
    }
  });

  test("Pi tuples report scenario absence explicitly, never implied coverage (R-SCEN-2)", () => {
    const piEntries = queryConformanceTuples(registry, { harness: "pi" });
    expect(piEntries.length).toBeGreaterThan(0);
    for (const entry of piEntries) {
      expect(entry.plannedScenarios, entry.id).toEqual([]);
      expect(entry.notes.join(" "), entry.id).toContain("scenario-absence");
      expect(entry.notes.join(" "), entry.id).toContain("R-SCEN-2");
    }
  });

  test("broken linkage is detected in both directions", () => {
    const withUnknownPlan = registry.tuples.map((entry) =>
      entry.id === "codex-plugin-native-global"
        ? { ...entry, plannedScenarios: ["a-scenario-nobody-wrote"] }
        : entry,
    );
    expect(
      listConformanceScenarioRegistryLinkageErrors({ tuples: withUnknownPlan }, specs).join(" "),
    ).toContain("a-scenario-nobody-wrote");

    const withDroppedPlan = registry.tuples.map((entry) =>
      entry.id === "codex-plugin-native-project" ? { ...entry, plannedScenarios: [] } : entry,
    );
    expect(
      listConformanceScenarioRegistryLinkageErrors({ tuples: withDroppedPlan }, specs).join(" "),
    ).toContain("bidirectional");
  });

  test("the R-021 characterization plan is recorded on the probed tuple's notes", () => {
    const entry = registry.tuples.find((candidate) => candidate.id === "codex-plugin-native-project");
    expect(entry).toBeDefined();
    expect(entry!.notes.join(" ")).toContain("characterization preamble");
    expect(entry!.plannedScenarios).toContain("codex-plugin-marketplace-install");
  });
});
