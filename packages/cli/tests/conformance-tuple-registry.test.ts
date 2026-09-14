import { afterEach, describe, expect, test } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  CONFORMANCE_SUPPORT_TUPLE_DIMENSIONS,
  CONFORMANCE_TUPLE_STATUS_MEANINGS,
  CONFORMANCE_VERDICT_DERIVATION_RULES,
  PACKAGED_CONFORMANCE_TUPLE_REGISTRY_PATH,
  addProvisionalConformanceTuple,
  conformanceTupleKey,
  getConformanceTupleEntry,
  loadConformanceTupleRegistry,
  loadHistoricalConformanceEvidencePackage,
  queryConformanceTuples,
  validateConformanceSupportTuple,
  validateConformanceTupleRegistry,
  type ConformanceRecordedRun,
  type ConformanceSupportTuple,
  type ConformanceTupleRegistry,
} from "../src/conformance";

const HASH = "a".repeat(64);
const tuple: ConformanceSupportTuple = {
  scenario: "setup-access/mcp-store-operations",
  harness: "codex",
  connectionMethod: "mcp",
  surface: "mcp",
  scope: "machine",
  modelOrProvider: "openai/gpt-5",
  runtime: "node@22-darwin-arm64",
};

function registry(tuples: ConformanceTupleRegistry["tuples"] = []): ConformanceTupleRegistry {
  return {
    record: "make-docs.conformance.tuple-registry",
    schemaVersion: 2,
    statuses: { ...CONFORMANCE_TUPLE_STATUS_MEANINGS },
    verdictDerivation: structuredClone(CONFORMANCE_VERDICT_DERIVATION_RULES),
    tuples,
  };
}

function qualifyingRun(overrides: Partial<ConformanceRecordedRun> = {}): ConformanceRecordedRun {
  return {
    runId: "run-001",
    tuple: { ...tuple },
    runDate: "2026-09-14",
    makeDocsVersion: "2.0.0-rc",
    executableDigest: HASH,
    behaviorDigest: HASH,
    distributionType: "packed-npm",
    harnessVersion: "codex-cli 1.2.3",
    nativeConfigDigest: HASH,
    verdict: "pass",
    caveats: [],
    caveatsSurfaced: false,
    evidenceBar: { install: true, discover: true, invoke: true, uninstall: true },
    recordRef: "conformance/results/codex/2026-09-14/mcp-store-operations-001.json",
    evidenceReferences: ["store-read.json"],
    simulated: false,
    ...overrides,
  };
}

const tempRoots: string[] = [];
afterEach(() => {
  for (const root of tempRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("active conformance tuple registry version 2", () => {
  test("uses the exact seven required tuple fields in canonical order", () => {
    expect(CONFORMANCE_SUPPORT_TUPLE_DIMENSIONS).toEqual([
      "scenario",
      "harness",
      "connectionMethod",
      "surface",
      "scope",
      "modelOrProvider",
      "runtime",
    ]);
    expect(Object.keys(validateConformanceSupportTuple(tuple))).toEqual(CONFORMANCE_SUPPORT_TUPLE_DIMENSIONS);
    expect(conformanceTupleKey(tuple)).toBe(Object.values(tuple).join("/"));
  });

  test.each([
    ["empty", { ...tuple, runtime: "" }],
    ["wildcard", { ...tuple, modelOrProvider: "*" }],
    ["null", { ...tuple, runtime: null }],
    ["old outputKind", { ...tuple, outputKind: "plugin" }],
    ["old generatedOutputKind", { ...tuple, generatedOutputKind: "generated-plugin" }],
  ])("rejects %s active tuple values", (_label, value) => {
    expect(() => validateConformanceSupportTuple(value)).toThrow(/invalid|unrecognized|wildcard/i);
  });

  test("enforces method, scenario, surface, and harness combinations", () => {
    expect(() => validateConformanceSupportTuple({ ...tuple, connectionMethod: "direct-cli" })).toThrow(/requires scenario/i);
    expect(() => validateConformanceSupportTuple({
      ...tuple,
      scenario: "setup-access/bounded-rule-store-operations",
      connectionMethod: "command-rules",
      surface: "cli-command-rules",
      harness: "claude-code",
    })).toThrow(/Codex-only/i);
  });

  test("derives conformance validation only from an exact qualifying run", () => {
    const entry = {
      id: "codex-mcp",
      tuple,
      status: "conformance-validated" as const,
      evidence: [],
      recordedRuns: [qualifyingRun()],
      plannedScenarios: [tuple.scenario],
      notes: [],
    };
    const validated = validateConformanceTupleRegistry(registry([entry]));
    expect(getConformanceTupleEntry(validated, tuple)?.status).toBe("conformance-validated");
    expect(queryConformanceTuples(validated, { harness: "codex", connectionMethod: "mcp" })).toHaveLength(1);
    expect(() => validateConformanceTupleRegistry(registry([{
      ...entry,
      recordedRuns: [qualifyingRun({ tuple: { ...tuple, modelOrProvider: "other" } })],
    }]))).toThrow(/different tuple/i);
  });

  test("rejects asserted status, duplicate identity, and incomplete provenance", () => {
    const provisional = addProvisionalConformanceTuple(registry(), { id: "codex-mcp", tuple });
    expect(provisional.tuples[0]?.status).toBe("provisional");
    expect(() => validateConformanceTupleRegistry(registry([{
      ...provisional.tuples[0]!,
      status: "conformance-validated",
    }]))).toThrow(/derives `provisional`/i);
    expect(() => validateConformanceTupleRegistry(registry([
      provisional.tuples[0]!,
      { ...provisional.tuples[0]!, id: "codex-mcp-copy" },
    ]))).toThrow(/duplicates the exact tuple/i);
    expect(() => validateConformanceTupleRegistry(registry([{
      ...provisional.tuples[0]!,
      status: "conformance-validated",
      recordedRuns: [qualifyingRun({ executableDigest: "short" })],
    }]))).toThrow(/executableDigest/i);
  });

  test("loads the package-relative registry from any working directory", () => {
    const original = process.cwd();
    const other = mkdtempSync(path.join(os.tmpdir(), "make-docs-registry-cwd-"));
    tempRoots.push(other);
    try {
      process.chdir(other);
      const loaded = loadConformanceTupleRegistry();
      expect(loaded.schemaVersion).toBe(2);
      expect(PACKAGED_CONFORMANCE_TUPLE_REGISTRY_PATH).not.toContain(other);
    } finally {
      process.chdir(original);
    }
  });

  test("keeps version 1 readable only through the historical loader", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-history-"));
    tempRoots.push(root);
    const file = path.join(root, "registry-v1.json");
    writeFileSync(file, JSON.stringify({
      record: "make-docs.conformance.tuple-registry",
      schemaVersion: 1,
      tuples: [],
    }));
    expect(() => loadConformanceTupleRegistry({ registryPath: file })).toThrow(/schemaVersion/i);
    expect(loadHistoricalConformanceEvidencePackage(file).schemaVersion).toBe(1);
    const active = path.join(root, "registry-v2.json");
    writeFileSync(active, JSON.stringify(registry()));
    expect(() => loadHistoricalConformanceEvidencePackage(active)).toThrow(/retired version 1/i);
  });
});
