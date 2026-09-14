/** Test layer: unit. These tests do not prove real harness support. */
import { describe, expect, test } from "vitest";
import {
  recordValidatedConformanceResultOnRegistryEntry,
  validatePackagingConformanceResultRecord,
  type ConformanceSupportTuple,
  type ConformanceTupleRegistryEntry,
  type PackagingConformanceResultRecord,
} from "../src/conformance";

const HASH = "c".repeat(64);
const tuple: ConformanceSupportTuple = {
  scenario: "setup-access/mcp-store-operations",
  harness: "claude-code",
  connectionMethod: "mcp",
  surface: "mcp",
  scope: "machine",
  modelOrProvider: "anthropic/claude",
  runtime: "node@22-darwin-arm64",
};

function result(overrides: Partial<PackagingConformanceResultRecord> = {}): PackagingConformanceResultRecord {
  return {
    schemaVersion: "conformance.result.v2",
    resultId: "2026-09-14-claude-code-mcp-001",
    scenarioVersion: "2.0.0",
    tuple: { ...tuple },
    runDate: "2026-09-14",
    makeDocsVersion: "2.0.0-rc",
    executablePath: "/tmp/make-docs-conformance-lab/product/dist/index.js",
    executableDigest: HASH,
    behaviorDigest: HASH,
    registryDigest: HASH,
    distributionType: "packed-npm",
    harnessVersion: "claude-code 1.2.3",
    nativeConfigDigest: HASH,
    producedFiles: [".claude.json"],
    relevantDiffs: ["evidence/native-config.diff"],
    exitStatus: 0,
    transcriptLogPointer: "discarded-with-session",
    verdict: "pass",
    reason: "The disposable real harness met the measured evidence bar.",
    caveats: [],
    reviewerStatus: "reviewed",
    supportClaimUse: "nominal-tuple",
    caveatsSurfaced: false,
    evidenceBar: { install: true, discover: true, invoke: true, uninstall: true },
    simulated: false,
    simulationMechanicsRef: null,
    transcriptFormat: "json",
    evidenceReferences: ["evidence/harness.json"],
    ...overrides,
  };
}

function entry(): ConformanceTupleRegistryEntry {
  return {
    id: "claude-code-mcp",
    tuple: { ...tuple },
    status: "provisional",
    evidence: [],
    recordedRuns: [],
    plannedScenarios: [tuple.scenario],
    notes: [],
  };
}

describe("version 2 conformance result contract", () => {
  test("accepts the full exact tuple and required provenance", () => {
    expect(validatePackagingConformanceResultRecord(result())).toEqual(result());
  });

  test.each([
    ["old schema", { ...result(), schemaVersion: "conformance.result.v1" }],
    ["old scenario field", { ...result(), scenarioId: tuple.scenario }],
    ["old model field", { ...result(), modelName: "claude" }],
    ["missing executable digest", { ...result(), executableDigest: undefined }],
    ["missing tuple fact", { ...result(), tuple: { ...tuple, runtime: "" } }],
  ])("rejects %s", (_label, value) => {
    expect(() => validatePackagingConformanceResultRecord(value)).toThrow(/invalid/i);
  });

  test("requires blocked results to make no support claim and assert no bar stage", () => {
    expect(() => validatePackagingConformanceResultRecord(result({
      verdict: "blocked",
      supportClaimUse: "nominal-tuple",
    }))).toThrow(/blocked result must use supportClaimUse none/i);
    expect(() => validatePackagingConformanceResultRecord(result({
      verdict: "blocked",
      supportClaimUse: "none",
    }))).toThrow(/every evidence-bar stage must be false/i);
    expect(() => validatePackagingConformanceResultRecord(result({
      verdict: "blocked",
      supportClaimUse: "none",
      evidenceBar: { install: false, discover: false, invoke: false, uninstall: false },
      exitStatus: null,
    }))).not.toThrow();
  });

  test("promotes only the same exact tuple and rejects a duplicate result", () => {
    const promoted = recordValidatedConformanceResultOnRegistryEntry({
      entry: entry(),
      record: result(),
      recordRef: "conformance/results/claude-code/2026-09-14-mcp-store-operations-001.json",
    });
    expect(promoted.status).toBe("conformance-validated");
    expect(promoted.recordedRuns[0]?.tuple).toEqual(tuple);
    expect(() => recordValidatedConformanceResultOnRegistryEntry({
      entry: promoted,
      record: result(),
      recordRef: promoted.recordedRuns[0]!.recordRef,
    })).toThrow(/already recorded/i);
    expect(() => recordValidatedConformanceResultOnRegistryEntry({
      entry: entry(),
      record: result({ tuple: { ...tuple, runtime: "different" } }),
      recordRef: "conformance/results/claude-code/different.json",
    })).toThrow(/Tuple mismatch/i);
  });

  test("surfaces caveats before a caveated run can qualify", () => {
    const hidden = recordValidatedConformanceResultOnRegistryEntry({
      entry: entry(),
      record: result({
        verdict: "pass-with-caveats",
        caveats: ["Harness behavior can drift without a version change."],
        caveatsSurfaced: false,
        supportClaimUse: "none",
      }),
      recordRef: "conformance/results/claude-code/hidden.json",
    });
    expect(hidden.status).toBe("provisional");
    const surfaced = recordValidatedConformanceResultOnRegistryEntry({
      entry: entry(),
      record: result({
        verdict: "pass-with-caveats",
        caveats: ["Harness behavior can drift without a version change."],
        caveatsSurfaced: true,
      }),
      recordRef: "conformance/results/claude-code/surfaced.json",
    });
    expect(surfaced.status).toBe("conformance-validated");
  });
});
