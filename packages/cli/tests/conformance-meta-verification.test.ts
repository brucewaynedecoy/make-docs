/** Test layer: unit. These checks prove evidence honesty, not harness support. */
import { afterEach, describe, expect, test } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  CONFORMANCE_TUPLE_STATUS_MEANINGS,
  CONFORMANCE_VERDICT_DERIVATION_RULES,
  isConformanceAssetPath,
  listConformanceAssetExclusionViolations,
  listConformanceValidatedRunQualificationErrors,
  listRequiredFirstPassScenarioErrors,
  listShippedConformanceAssetErrors,
  loadConformanceTupleRegistry,
  projectPackagingResultToRecordedRun,
  type ConformanceSupportTuple,
  type ConformanceTupleRegistry,
  type PackagingConformanceResultRecord,
} from "../src/conformance";
import { TEMPLATE_ROOT } from "../src/utils";

const REPO_ROOT = path.resolve(TEMPLATE_ROOT, "..", "..", "..");
const HASH = "e".repeat(64);
const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

const tuple: ConformanceSupportTuple = {
  scenario: "setup-access/direct-resource-read",
  harness: "codex",
  connectionMethod: "direct-cli",
  surface: "cli-resource",
  scope: "machine",
  modelOrProvider: "openai/gpt-5",
  runtime: "node@22-darwin-arm64",
};

function result(): PackagingConformanceResultRecord {
  return {
    schemaVersion: "conformance.result.v2",
    resultId: "2026-09-14-codex-direct-cli-001",
    scenarioVersion: "2.0.0",
    tuple,
    runDate: "2026-09-14",
    makeDocsVersion: "2.0.0-rc",
    executablePath: "/tmp/make-docs-conformance-lab/product/dist/index.js",
    executableDigest: HASH,
    behaviorDigest: HASH,
    registryDigest: HASH,
    distributionType: "packed-npm",
    harnessVersion: "codex-cli 1.2.3",
    nativeConfigDigest: HASH,
    producedFiles: [],
    relevantDiffs: ["evidence/resource-read.json"],
    exitStatus: 0,
    transcriptLogPointer: "discarded-with-session",
    verdict: "pass",
    reason: "Store-free resource reads passed.",
    caveats: [],
    reviewerStatus: "reviewed",
    supportClaimUse: "nominal-tuple",
    caveatsSurfaced: false,
    evidenceBar: { install: true, discover: true, invoke: true, uninstall: true },
    simulated: false,
    simulationMechanicsRef: null,
    transcriptFormat: "json",
    evidenceReferences: ["evidence/resource-read.json"],
  };
}

function registry(recordRef: string): ConformanceTupleRegistry {
  const run = projectPackagingResultToRecordedRun(result(), recordRef);
  return {
    record: "make-docs.conformance.tuple-registry",
    schemaVersion: 2,
    statuses: { ...CONFORMANCE_TUPLE_STATUS_MEANINGS },
    verdictDerivation: structuredClone(CONFORMANCE_VERDICT_DERIVATION_RULES),
    tuples: [{
      id: "codex-direct-resource-read",
      tuple,
      status: "conformance-validated",
      evidence: [],
      recordedRuns: [run],
      plannedScenarios: [tuple.scenario],
      notes: [],
    }],
  };
}

describe("version 2 conformance meta-verification", () => {
  test("requires each qualifying registry run to match its committed result", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-meta-"));
    roots.push(root);
    const ref = "conformance/results/codex/2026-09-14-direct-resource-read-001.json";
    expect(listConformanceValidatedRunQualificationErrors({ registry: registry(ref), repoRoot: root }))
      .toEqual([expect.stringContaining("not committed")]);
    mkdirSync(path.dirname(path.join(root, ref)), { recursive: true });
    writeFileSync(path.join(root, ref), JSON.stringify(result()));
    expect(listConformanceValidatedRunQualificationErrors({ registry: registry(ref), repoRoot: root }))
      .toEqual([]);
  });

  test("allows only the exact packaged registry asset", () => {
    expect(isConformanceAssetPath("conformance/tuple-registry.json")).toBe(false);
    expect(isConformanceAssetPath("conformance/scenarios/setup-access.json")).toBe(true);
    const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-package-tree-"));
    roots.push(root);
    mkdirSync(path.join(root, "conformance", "scenarios"), { recursive: true });
    writeFileSync(path.join(root, "conformance", "tuple-registry.json"), JSON.stringify({
      record: "make-docs.conformance.tuple-registry",
      schemaVersion: 2,
    }));
    writeFileSync(path.join(root, "conformance", "scenarios", "forbidden.json"), "{}");
    const violations = listConformanceAssetExclusionViolations({ root, label: "candidate" });
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain("scenarios/forbidden.json");
  });

  test("rejects a relocated registry and result schema marker", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-package-tree-"));
    roots.push(root);
    mkdirSync(path.join(root, "other"), { recursive: true });
    writeFileSync(path.join(root, "other", "tuple-registry.json"), "{}");
    writeFileSync(path.join(root, "other", "renamed.json"), "conformance.result.v2");
    const violations = listConformanceAssetExclusionViolations({ root, label: "candidate" });
    expect(violations).toHaveLength(2);
  });

  test("keeps the shipped templates free of lab assets", () => {
    expect(listShippedConformanceAssetErrors({ repoRoot: REPO_ROOT })).toEqual([]);
  });

  test("has no implied retired first-pass scenario requirement", () => {
    const current = loadConformanceTupleRegistry({ repoRoot: REPO_ROOT });
    const retiredFirstPassRegistry = {
      tuples: current.tuples.filter((entry) =>
        entry.plannedScenarios.some((scenario) => scenario.startsWith("packaging/")),
      ),
    };
    expect(listRequiredFirstPassScenarioErrors({
      specs: [],
      registry: retiredFirstPassRegistry,
      repoRoot: REPO_ROOT,
    }))
      .toEqual([]);
  });
});
