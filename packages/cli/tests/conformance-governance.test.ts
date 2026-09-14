/** Test layer: unit. Claim checks never prove harness recognition. */
import { afterEach, describe, expect, test } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  conformanceResultRecordRelativePath,
  deriveSupportClaimStrength,
  listCommittedResultRecordClaimUseErrors,
  projectPackagingResultToRecordedRun,
  renderConformanceSupportClaim,
  renderSupportClaimStateMarker,
  type ConformanceSupportTuple,
  type ConformanceTupleRegistryEntry,
  type PackagingConformanceResultRecord,
} from "../src/conformance";

const HASH = "d".repeat(64);
const tuple: ConformanceSupportTuple = {
  scenario: "setup-access/bounded-rule-store-operations",
  harness: "codex",
  connectionMethod: "command-rules",
  surface: "cli-command-rules",
  scope: "machine",
  modelOrProvider: "openai/gpt-5",
  runtime: "node@22-darwin-arm64",
};
const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function record(overrides: Partial<PackagingConformanceResultRecord> = {}): PackagingConformanceResultRecord {
  return {
    schemaVersion: "conformance.result.v2",
    resultId: "2026-09-14-codex-command-rules-001",
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
    producedFiles: [".codex/rules/make-docs.rules"],
    relevantDiffs: ["evidence/rules.diff"],
    exitStatus: 0,
    transcriptLogPointer: "discarded-with-session",
    verdict: "pass",
    reason: "The reviewed disposable run passed.",
    caveats: [],
    reviewerStatus: "reviewed",
    supportClaimUse: "nominal-tuple",
    caveatsSurfaced: false,
    evidenceBar: { install: true, discover: true, invoke: true, uninstall: true },
    simulated: false,
    simulationMechanicsRef: null,
    transcriptFormat: "json",
    evidenceReferences: ["evidence/codex-command.json"],
    ...overrides,
  };
}

function writeRecord(root: string, value: PackagingConformanceResultRecord, ref: string): void {
  const file = path.join(root, ref);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value));
}

function entry(value?: PackagingConformanceResultRecord, ref?: string): ConformanceTupleRegistryEntry {
  const runs = value && ref ? [projectPackagingResultToRecordedRun(value, ref)] : [];
  return {
    id: "codex-command-rules",
    tuple,
    status: runs.length ? "conformance-validated" : "provisional",
    evidence: [],
    recordedRuns: runs,
    plannedScenarios: [tuple.scenario],
    notes: [],
  };
}

describe("version 2 support claim governance", () => {
  test("withholds a recognition claim below conformance validation", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-claim-"));
    roots.push(root);
    const claim = renderConformanceSupportClaim(entry(), { repoRoot: root });
    expect(claim.strength).toBe("no-public-claim");
    expect(claim.wording).toContain("generated output");
    expect(claim.wording).toContain("not a `codex`-recognized");
  });

  test("requires a committed maintainer-reviewed result for nominal wording", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-claim-"));
    roots.push(root);
    const ref = "conformance/results/codex/2026-09-14-bounded-rule-store-operations-001.json";
    const value = record();
    const validatedEntry = entry(value, ref);
    expect(deriveSupportClaimStrength(validatedEntry, { repoRoot: root }).strength).toBe("no-public-claim");
    writeRecord(root, value, ref);
    expect(deriveSupportClaimStrength(validatedEntry, { repoRoot: root }).strength).toBe("nominal");
    const claim = renderConformanceSupportClaim(validatedEntry, { repoRoot: root });
    expect(claim.wording).toContain("Conformance-validated for exactly this tuple");
    expect(claim.wording).toContain("openai/gpt-5");
    expect(claim.wording).toContain("node@22-darwin-arm64");
  });

  test("surfaces every caveat in permitted wording", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-claim-"));
    roots.push(root);
    const ref = "conformance/results/codex/2026-09-14-bounded-rule-store-operations-001.json";
    const caveat = "The harness can change without a version change.";
    const value = record({
      verdict: "pass-with-caveats",
      caveats: [caveat],
      caveatsSurfaced: true,
    });
    writeRecord(root, value, ref);
    const claim = renderConformanceSupportClaim(entry(value, ref), { repoRoot: root });
    expect(claim.caveats).toEqual([caveat]);
    expect(claim.wording).toContain(caveat);
  });

  test("rejects claim use for failed or unreviewed stronger records", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-claim-"));
    roots.push(root);
    writeRecord(root, record({ verdict: "unsupported" }), "conformance/results/codex/failed.json");
    writeRecord(root, record({ supportClaimUse: "stronger-claim-candidate", reviewerStatus: "unreviewed" }), "conformance/results/codex/unreviewed.json");
    const errors = listCommittedResultRecordClaimUseErrors({ repoRoot: root });
    expect(errors.some(error => error.includes("only pass"))).toBe(true);
    expect(errors.some(error => error.includes("reviewerStatus"))).toBe(true);
  });

  test("uses stable result paths and support-state counts", () => {
    expect(conformanceResultRecordRelativePath({
      harness: "claude-code",
      runDate: "2026-09-14",
      scenarioId: "setup-access/direct-resource-read",
      sequence: 2,
    })).toBe("conformance/results/claude-code/2026-09-14-direct-resource-read-002.json");
    expect(renderSupportClaimStateMarker({ tuples: [entry(), { ...entry(), id: "validated", status: "conformance-validated" }] }))
      .toBe("<!-- support-claim-state: conformance-validated=1/2 -->");
  });
});
