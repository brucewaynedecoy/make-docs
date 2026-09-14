import { afterEach, describe, expect, test } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  CONFORMANCE_TUPLE_STATUS_MEANINGS,
  CONFORMANCE_VERDICT_DERIVATION_RULES,
  addProvisionalConformanceTuple,
  getConformanceTupleEntry,
  ingestSetupAccessLabSession,
  validatePackagingConformanceResultRecord,
  type ConformanceSupportTuple,
  type ConformanceTupleRegistry,
  type SetupAccessLabManifest,
  type SetupAccessLabMeasurements,
} from "../src/conformance";

const HASH = "b".repeat(64);
const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function baseRegistry(): ConformanceTupleRegistry {
  return {
    record: "make-docs.conformance.tuple-registry",
    schemaVersion: 2,
    statuses: { ...CONFORMANCE_TUPLE_STATUS_MEANINGS },
    verdictDerivation: structuredClone(CONFORMANCE_VERDICT_DERIVATION_RULES),
    tuples: [],
  };
}

function createSession(input: {
  tuple?: ConformanceSupportTuple;
  measurements?: Partial<SetupAccessLabMeasurements["measured"]>;
  caveats?: string[];
} = {}): { root: string; tuple: ConformanceSupportTuple } {
  const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-setup-access-ingest-"));
  roots.push(root);
  const tuple: ConformanceSupportTuple = input.tuple ?? {
    scenario: "setup-access/mcp-store-operations",
    harness: "codex",
    connectionMethod: "mcp",
    surface: "mcp",
    scope: "machine",
    modelOrProvider: "openai/gpt-5",
    runtime: "node@22-darwin-arm64",
  };
  const provisional = addProvisionalConformanceTuple(baseRegistry(), {
    id: "lab-exact-tuple",
    tuple,
    plannedScenario: tuple.scenario,
  });
  const provisionalPath = path.join(root, "tuple-registry.provisional.json");
  writeFileSync(provisionalPath, JSON.stringify(provisional));
  const manifest: SetupAccessLabManifest = {
    schemaVersion: "make-docs.setup-access-lab.v2",
    runDate: "2026-09-14",
    harnessVersion: "codex-cli 1.2.3",
    tuple,
    package: {
      sourceTarball: "/tmp/make-docs-conformance-lab/input.tgz",
      copiedTarball: "/tmp/make-docs-conformance-lab/copied.tgz",
      tarballDigest: HASH,
      packageRoot: "/tmp/make-docs-conformance-lab/product",
      executablePath: "/tmp/make-docs-conformance-lab/product/dist/index.js",
      executableDigest: HASH,
      behaviorDigest: HASH,
      makeDocsVersion: "2.0.0-rc",
      distributionType: "packed-npm",
    },
    registry: {
      source: "/repo/conformance/tuple-registry.json",
      sourceDigest: HASH,
      provisional: provisionalPath,
      provisionalDigest: HASH,
      status: "provisional",
    },
    session: {
      root,
      home: path.join(root, "home"),
      project: path.join(root, "project"),
      store: path.join(root, "store"),
      evidence: path.join(root, "evidence"),
    },
    native: {
      applied: tuple.connectionMethod !== "direct-cli",
      verified: true,
      files: tuple.connectionMethod === "direct-cli" ? [] : [".codex/config.toml"],
      nativeConfigDigest: HASH,
      receipt: null,
      userContentSeed: {
        path: path.join(root, "home", "user-content-seed.txt"),
        evidence: path.join(root, "evidence", "user-content-seed.json"),
        digest: HASH,
      },
    },
    promotion: {
      supportStatusChanged: false,
      resultWritten: false,
      nextAction: "Measure the disposable real-harness session.",
    },
  };
  mkdirSync(path.join(root, "evidence"), { recursive: true });
  writeFileSync(path.join(root, "manifest.json"), JSON.stringify(manifest));
  const measurements: SetupAccessLabMeasurements = {
    schemaVersion: "make-docs.setup-access-measurements.v2",
    tuple,
    measured: {
      nativeFiles: true,
      callerOrLaunchIdentity: true,
      methodIdentity: true,
      storeRead: true,
      storeWrite: true,
      rejectedAccess: true,
      storeFreeResourceRead: true,
      storeSessionOpenedForResourceRead: false,
      cleanup: true,
      userContentPreserved: true,
      ...input.measurements,
    },
    evidenceReferences: ["evidence/harness-transcript.json"],
    caveats: input.caveats ?? [],
    transcriptLogPointer: "discarded-with-session",
    transcriptFormat: "json",
  };
  writeFileSync(path.join(root, "evidence", "measurements.json"), JSON.stringify(measurements));
  return { root, tuple };
}

describe("setup-access version 2 ingestion", () => {
  test("records the exact tuple and complete product and harness provenance", () => {
    const session = createSession();
    const ingested = ingestSetupAccessLabSession({
      sessionRoot: session.root,
      reviewerStatus: "reviewed",
      reason: "The disposable Codex MCP run met every measured condition.",
    });
    expect(() => validatePackagingConformanceResultRecord(ingested.record)).not.toThrow();
    expect(ingested.record.tuple).toEqual(session.tuple);
    expect(ingested.record).toMatchObject({
      schemaVersion: "conformance.result.v2",
      makeDocsVersion: "2.0.0-rc",
      executableDigest: HASH,
      behaviorDigest: HASH,
      registryDigest: HASH,
      distributionType: "packed-npm",
      harnessVersion: "codex-cli 1.2.3",
      nativeConfigDigest: HASH,
      reviewerStatus: "reviewed",
      supportClaimUse: "nominal-tuple",
      verdict: "pass",
    });
    expect(getConformanceTupleEntry(ingested.promotedRegistry, session.tuple)?.status)
      .toBe("conformance-validated");
  });

  test("keeps incomplete measurements blocked and provisional", () => {
    const session = createSession({ measurements: { storeWrite: null } });
    const ingested = ingestSetupAccessLabSession({ sessionRoot: session.root });
    expect(ingested.record.verdict).toBe("blocked");
    expect(ingested.record.evidenceBar).toEqual({
      install: false,
      discover: false,
      invoke: false,
      uninstall: false,
    });
    expect(getConformanceTupleEntry(ingested.promotedRegistry, session.tuple)?.status)
      .toBe("provisional");
  });

  test("requires Store-free direct reads to avoid a Store session", () => {
    const tuple: ConformanceSupportTuple = {
      scenario: "setup-access/direct-resource-read",
      harness: "claude-code",
      connectionMethod: "direct-cli",
      surface: "cli-resource",
      scope: "machine",
      modelOrProvider: "anthropic/claude",
      runtime: "node@22-darwin-arm64",
    };
    const failed = createSession({
      tuple,
      measurements: { storeSessionOpenedForResourceRead: true },
    });
    expect(ingestSetupAccessLabSession({ sessionRoot: failed.root }).record.verdict).toBe("unsupported");
    const passed = createSession({ tuple });
    expect(ingestSetupAccessLabSession({ sessionRoot: passed.root }).record.verdict).toBe("pass");
  });

  test("rejects evidence for a different exact tuple", () => {
    const session = createSession();
    const measurementsPath = path.join(session.root, "evidence", "measurements.json");
    const measurements = JSON.parse(readFileSync(measurementsPath, "utf8"));
    measurements.tuple.modelOrProvider = "different-provider";
    writeFileSync(measurementsPath, JSON.stringify(measurements));
    expect(() => ingestSetupAccessLabSession({ sessionRoot: session.root })).toThrow(/does not match/i);
  });
});
