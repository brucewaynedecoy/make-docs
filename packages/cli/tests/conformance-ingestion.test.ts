/**
 * W18 R13 P3 Stage 1 coverage (PRD 43 R-ING-1..2; PRD 44 R-EXEC-1..3): the
 * fail-closed ingestion step that assembles a `conformance.result.v1` record
 * from a driven lab session, deriving every asserted bar-stage boolean SOLELY
 * from instrument outputs and recording every operator contribution as an
 * attestation.
 *
 * Test layer: unit (R-LAYER-1) — pure-function tests over hand-authored
 * synthetic sessions, no CLI and no harness. These prove the machinery's
 * honesty rules only; internal tests passing is never evidence that a harness
 * recognizes or can use the output (R-LAYER-2, PRD 36 R-TEST-5). The discover
 * honesty test in particular proves the OPPOSITE: even a session whose files
 * are all in place cannot claim harness recognition without a harness-listing
 * instrument.
 */

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  CONFORMANCE_INGESTION_PROVENANCE_SCHEMA_VERSION,
  CONFORMANCE_SESSION_MANIFEST_SCHEMA_VERSION,
  bindIngestedResultToRegistryEntry,
  deriveConformanceTupleStatus,
  ingestConformanceLabSession,
  loadConformanceTupleRegistry,
  loadPackagingConformanceScenarioSpec,
  recordConformanceRunOnRegistryEntry,
  validatePackagingConformanceResultRecord,
  writeConformanceResultRecord,
  type ConformanceOperatorAttestations,
  type PackagingConformanceScenarioSpec,
} from "../src/conformance";

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const PLUGIN_SPEC_PATH = path.join(
  REPO_ROOT,
  "conformance",
  "scenarios",
  "packaging",
  "plugin-marketplace-install.json",
);

const PLUGIN_SPEC: PackagingConformanceScenarioSpec = loadPackagingConformanceScenarioSpec(PLUGIN_SPEC_PATH);
const SESSION_ID = "2026-07-06-codex-plugin-marketplace-install";
const PACKAGE_ID = "conformance-plugin-probe";

/** The operator attestations for a fully runnable session (both attestations given). */
function runnableOperator(
  overrides: Partial<ConformanceOperatorAttestations> = {},
): ConformanceOperatorAttestations {
  return {
    modelName: "gpt-5-codex",
    providerOrRoutingLayer: "openai-plus",
    modelVersion: "2026-06",
    runtimeDistribution: "node",
    runtimeVersion: "22.5.0",
    attestedPreconditionIds: ["network-available", "model-routing-available"],
    narrativeReason: "Operator drove the session; see the per-stage narrative for details.",
    transcriptLogPointer: "discarded-with-session",
    transcriptFormat: "non-tty",
    ...overrides,
  };
}

/** Builds a shaped session manifest for the plugin spec. */
function buildManifest(): unknown {
  return {
    schemaVersion: CONFORMANCE_SESSION_MANIFEST_SCHEMA_VERSION,
    sessionId: SESSION_ID,
    scenarioId: PLUGIN_SPEC.scenarioId,
    scenarioVersion: PLUGIN_SPEC.scenarioVersion,
    title: PLUGIN_SPEC.title,
    harness: "codex",
    registryTupleIds: PLUGIN_SPEC.packagingExtension.targets.codex!.registryTupleIds,
    generationInputs: {
      cliVersion: "test-0.0.0",
      descriptorContractDigest: "sha256:test",
      descriptorVerificationStatus: "verified",
      targetParameters: {},
    },
    layout: { kit: "kit", workspace: "workspace", evidence: "evidence" },
    transcriptPolicy: "json-or-non-tty",
    evidenceHomes: { default: "discarded-with-session", retained: "<store-root>/conformance-lab/sessions/x/" },
    executionRules: [],
    preconditions: {
      probes: PLUGIN_SPEC.packagingExtension.preconditions
        .filter((precondition) => precondition.probe === "command-succeeds")
        .map((precondition) => ({ id: precondition.id, description: precondition.description, command: "codex", args: ["--version"] })),
      attestations: PLUGIN_SPEC.packagingExtension.preconditions
        .filter((precondition) => precondition.probe === "operator-attestation")
        .map((precondition) => ({ id: precondition.id, description: precondition.description })),
    },
    sessionSteps: [
      {
        sequence: 1,
        kind: "command",
        barStage: "install",
        performedBy: "instrument",
        instrument: "node kit/instruments/install.mjs",
        command: `cd "$WORKSPACE" && make-docs run package ship --harness codex --output-kind plugin --surface native --scope project --package-id ${PACKAGE_ID} --json agent/conformance-skill-probe`,
        action: null,
        notes: null,
      },
    ],
    expectedEvidence: {
      install: { instrument: "node kit/instruments/install.mjs", outputs: ["evidence/install/commands.json", "evidence/install/placement-inventory.json"], rule: "install" },
      discover: { instrument: "node kit/instruments/discover.mjs", outputs: ["evidence/discover/captures.json"], rule: "discover" },
      invoke: { instrument: "node kit/instruments/invoke.mjs", outputs: ["evidence/invoke/probe-assertion.json"], rule: "invoke" },
      uninstall: { instrument: "node kit/instruments/uninstall.mjs", outputs: ["evidence/uninstall/before-inventory.json", "evidence/uninstall/removal-commands.json", "evidence/uninstall/diff.json"], rule: "uninstall" },
    },
    discoveryKit: null,
  };
}

interface EvidenceOptions {
  install?: boolean;
  invoke?: boolean;
  uninstall?: boolean;
  /** "none" | "placement-only" | "recognition-ok" | "recognition-empty". */
  discover?: "none" | "placement-only" | "recognition-ok" | "recognition-empty";
}

function writeJson(sessionRoot: string, relative: string, value: unknown): void {
  const absolute = path.join(sessionRoot, relative);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
}

/** Writes a synthetic session (manifest + selected evidence) into a temp root. */
function writeSyntheticSession(sessionRoot: string, evidence: EvidenceOptions): void {
  writeJson(sessionRoot, "kit/manifest.json", buildManifest());

  if (evidence.install !== false) {
    writeJson(sessionRoot, "evidence/install/commands.json", {
      schemaVersion: "conformance.instrument-output.v1",
      stage: "install",
      commands: [{ command: "make-docs run package ship ...", exitCode: 0 }],
    });
    writeJson(sessionRoot, "evidence/install/placement-inventory.json", {
      schemaVersion: "conformance.instrument-output.v1",
      stage: "install",
      roots: [".codex/plugins", ".agents/plugins", ".agents/skills"],
      entries: [
        { path: ".codex/plugins/conformance-plugin-probe/.codex-plugin/plugin.json", kind: "file", bytes: 42, sha256: "sha256:aa" },
        { path: ".agents/plugins/marketplace.json", kind: "file", bytes: 10, sha256: "sha256:bb" },
      ],
    });
  }

  const discoverMode = evidence.discover ?? "placement-only";
  if (discoverMode !== "none") {
    const captures: unknown[] = [
      { id: "plugin-install-root-listing", kind: "directory-listing", status: "verified", entryCount: 2, listing: "evidence/discover/plugin-install-root-listing.json" },
      { id: "marketplace-manifest-read", kind: "manifest-read", status: "verified", path: ".agents/plugins/marketplace.json", exists: true, sha256: "sha256:bb", content: "evidence/discover/marketplace-manifest-read.content" },
    ];
    if (discoverMode === "recognition-ok" || discoverMode === "recognition-empty") {
      captures.push({ id: "plugins-list", kind: "command-output", status: "verified", exitCode: 0, stdout: "evidence/discover/plugins-list.stdout.txt" });
      const stdoutPath = path.join(sessionRoot, "evidence/discover/plugins-list.stdout.txt");
      mkdirSync(path.dirname(stdoutPath), { recursive: true });
      writeFileSync(
        stdoutPath,
        discoverMode === "recognition-ok" ? `installed plugins:\n- ${PACKAGE_ID}\n` : "installed plugins:\n(none)\n",
      );
    }
    writeJson(sessionRoot, "evidence/discover/captures.json", {
      schemaVersion: "conformance.instrument-output.v1",
      stage: "discover",
      captures,
    });
  }

  if (evidence.invoke !== false) {
    writeJson(sessionRoot, "evidence/invoke/probe-assertion.json", {
      schemaVersion: "conformance.instrument-output.v1",
      stage: "invoke",
      transcriptFile: "evidence/invoke/probe-transcript.txt",
      exists: true,
      sha256: "sha256:cc",
      markers: [{ marker: "MAKE-DOCS-CONFORMANCE-SKILL-PROBE-OK", found: true }],
    });
  }

  if (evidence.uninstall !== false) {
    writeJson(sessionRoot, "evidence/uninstall/before-inventory.json", {
      schemaVersion: "conformance.instrument-output.v1",
      stage: "uninstall",
      phase: "before",
      entries: [{ path: ".codex/plugins/conformance-plugin-probe/.codex-plugin/plugin.json", kind: "file", sha256: "sha256:aa" }],
    });
    writeJson(sessionRoot, "evidence/uninstall/removal-commands.json", {
      schemaVersion: "conformance.instrument-output.v1",
      stage: "uninstall",
      commands: [{ command: "make-docs setup remove --backup --yes", exitCode: 0 }],
    });
    writeJson(sessionRoot, "evidence/uninstall/diff.json", {
      schemaVersion: "conformance.instrument-output.v1",
      stage: "uninstall",
      phase: "remove",
      removed: [".codex/plugins/conformance-plugin-probe/.codex-plugin/plugin.json", ".agents/plugins/marketplace.json"],
      added: [".make-docs/backup/2026-07-06/manifest.json"],
      modified: [],
      unchangedCount: 3,
      emptyManagedDirs: [],
    });
  }
}

let tmpRoot: string;

beforeEach(() => {
  tmpRoot = mkdtempSync(path.join(os.tmpdir(), "md-ingest-"));
});

afterEach(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
});

function ingest(evidence: EvidenceOptions, operator = runnableOperator(), runDate = "2026-07-06") {
  const sessionRoot = path.join(tmpRoot, "session");
  writeSyntheticSession(sessionRoot, evidence);
  return ingestConformanceLabSession({ sessionRoot, spec: PLUGIN_SPEC, operator, runDate, sequence: 1 });
}

describe("blocked honesty (R-EXEC-3)", () => {
  test("an unattested operator-attestation precondition blocks the session", () => {
    const result = ingest({}, runnableOperator({ attestedPreconditionIds: ["network-available"] }));
    expect(result.record.verdict).toBe("blocked");
    expect(result.record.supportClaimUse).toBe("none");
    expect(result.record.evidenceBar).toEqual({ install: false, discover: false, invoke: false, uninstall: false });
    expect(result.assembly.blocked).toBe(true);
    expect(result.assembly.unmetPreconditions.map((entry) => entry.id)).toEqual(["model-routing-available"]);
    expect(() => validatePackagingConformanceResultRecord(result.record)).not.toThrow();
  });

  test("an operator-reported unmet probeable precondition blocks the session", () => {
    const result = ingest({}, runnableOperator({ unmetProbeablePreconditionIds: ["harness-cli-available"] }));
    expect(result.record.verdict).toBe("blocked");
    expect(result.assembly.unmetPreconditions.map((entry) => entry.id)).toContain("harness-cli-available");
  });
});

describe("fail-closed measurement (R-ING-1)", () => {
  test("a missing instrument output yields false for that stage — no narrative rescue", () => {
    const result = ingest({ install: false });
    expect(result.record.evidenceBar.install).toBe(false);
    const installMeasurement = result.assembly.measured.find((entry) => entry.stage === "install")!;
    expect(installMeasurement.outputsPresent).toBe(false);
    expect(installMeasurement.value).toBe(false);
    // The operator's confident narrative cannot flip a missing measurement.
    expect(result.record.verdict).toBe("unsupported");
  });

  test("a session with no instrument outputs yields an all-false bar the seam does not advance", () => {
    const result = ingest({ install: false, discover: "none", invoke: false, uninstall: false });
    expect(result.record.evidenceBar).toEqual({ install: false, discover: false, invoke: false, uninstall: false });
    expect(result.record.verdict).toBe("unsupported");

    const registry = loadConformanceTupleRegistry({ repoRoot: REPO_ROOT });
    const entry = registry.tuples.find((candidate) => candidate.id === "codex-plugin-native-project")!;
    const statusBefore = entry.status;
    const advanced = bindIngestedResultToRegistryEntry({ entry, spec: PLUGIN_SPEC, result });
    expect(advanced.status).toBe(statusBefore);
    expect(advanced.status).not.toBe("conformance-validated");
  });
});

describe("the discover honesty rule (register item R-021)", () => {
  test("placement surfaces alone never confirm discover — files written is not harness recognition", () => {
    // install, invoke, uninstall all pass; discover has only placement
    // captures (directory listing + manifest read of files WE wrote).
    const result = ingest({ discover: "placement-only" });
    expect(result.record.evidenceBar.install).toBe(true);
    expect(result.record.evidenceBar.invoke).toBe(true);
    expect(result.record.evidenceBar.uninstall).toBe(true);
    // The crux: everything is "in place", yet discover stays FALSE.
    expect(result.record.evidenceBar.discover).toBe(false);
    expect(result.record.verdict).toBe("unsupported");
    const discoverCaveat = result.record.caveats.find((caveat) => caveat.includes("discover"));
    expect(discoverCaveat).toBeDefined();
    expect(discoverCaveat).toMatch(/R-021/);
    expect(discoverCaveat).toMatch(/narrative context, never evidence/);
  });

  test("a verified harness-listing command that shows the package confirms discover", () => {
    const result = ingest({ discover: "recognition-ok" });
    expect(result.record.evidenceBar.discover).toBe(true);
    expect(result.record.evidenceBar).toEqual({ install: true, discover: true, invoke: true, uninstall: true });
    expect(result.record.verdict).toBe("pass");
    expect(result.record.supportClaimUse).toBe("nominal-tuple");
  });

  test("a harness-listing command whose output omits the package does not confirm discover", () => {
    const result = ingest({ discover: "recognition-empty" });
    expect(result.record.evidenceBar.discover).toBe(false);
    expect(result.record.verdict).toBe("unsupported");
    expect(result.record.caveats.some((caveat) => caveat.includes("plugins-list"))).toBe(true);
  });
});

describe("attestations are structurally distinguishable from measurements (R-EXEC-2)", () => {
  test("measured booleans and attested metadata live in separate provenance branches", () => {
    const result = ingest({ discover: "recognition-ok" });
    expect(result.assembly.schemaVersion).toBe(CONFORMANCE_INGESTION_PROVENANCE_SCHEMA_VERSION);
    expect(result.assembly.measured.map((entry) => entry.stage)).toEqual(["install", "discover", "invoke", "uninstall"]);
    expect(result.assembly.attested.modelName).toBe("gpt-5-codex");
    // Every measured stage names the instrument outputs it read.
    for (const measurement of result.assembly.measured) {
      expect(measurement.outputsPresent).toBe(true);
    }
  });

  test("changing operator narrative and metadata never changes a measured boolean", () => {
    const base = ingest({ discover: "placement-only" });
    const embellished = ingest(
      { discover: "placement-only" },
      runnableOperator({
        modelName: "different-model",
        narrativeReason: "Everything worked perfectly and Codex definitely recognized the plugin.",
      }),
    );
    expect(embellished.record.evidenceBar).toEqual(base.record.evidenceBar);
    expect(embellished.record.evidenceBar.discover).toBe(false);
  });
});

describe("pass path advances the tuple through the one seam (R-ING-2)", () => {
  test("a full instrument-confirmed pass advances the tuple to conformance-validated", () => {
    const result = ingest({ discover: "recognition-ok" });
    expect(result.record.verdict).toBe("pass");
    const registry = loadConformanceTupleRegistry({ repoRoot: REPO_ROOT });
    const entry = registry.tuples.find((candidate) => candidate.id === "codex-plugin-native-project")!;
    const advanced = bindIngestedResultToRegistryEntry({ entry, spec: PLUGIN_SPEC, result });
    expect(advanced.status).toBe("conformance-validated");
    expect(deriveConformanceTupleStatus(advanced)).toBe("conformance-validated");
  });

  test("bindIngestedResultToRegistryEntry is a pass-through to the one recording seam", () => {
    const result = ingest({ discover: "recognition-ok" });
    const registry = loadConformanceTupleRegistry({ repoRoot: REPO_ROOT });
    const entry = registry.tuples.find((candidate) => candidate.id === "codex-plugin-native-project")!;
    const viaHelper = bindIngestedResultToRegistryEntry({ entry, spec: PLUGIN_SPEC, result });
    const viaSeam = recordConformanceRunOnRegistryEntry({
      entry,
      spec: PLUGIN_SPEC,
      record: result.record,
      recordRef: result.recordRef,
    });
    expect(viaHelper).toEqual(viaSeam);
  });
});

describe("committing the record (t4, R-TEST-1 receipts)", () => {
  test("writes the record to conformance/results/<harness>/ and round-trips byte-equal", () => {
    const result = ingest({ discover: "recognition-ok" });
    expect(result.recordRef).toBe(
      "conformance/results/codex/2026-07-06-plugin-marketplace-install-001.json",
    );
    const repoRoot = path.join(tmpRoot, "repo");
    mkdirSync(repoRoot, { recursive: true });
    const written = writeConformanceResultRecord({ result, repoRoot, writeProvenance: true });
    const reread = JSON.parse(readFileSync(written, "utf8")) as unknown;
    const revalidated = validatePackagingConformanceResultRecord(reread);
    expect(revalidated).toEqual(result.record);
    // Provenance sidecar exists and names its schema.
    const provenance = JSON.parse(
      readFileSync(written.replace(/\.json$/, ".provenance.json"), "utf8"),
    ) as { schemaVersion: string };
    expect(provenance.schemaVersion).toBe(CONFORMANCE_INGESTION_PROVENANCE_SCHEMA_VERSION);
  });
});

describe("manifest / definition cross-checks", () => {
  test("a manifest whose scenarioVersion drifts from the definition fails closed", () => {
    const sessionRoot = path.join(tmpRoot, "drift");
    writeSyntheticSession(sessionRoot, {});
    const manifestPath = path.join(sessionRoot, "kit", "manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { scenarioVersion: string };
    manifest.scenarioVersion = "9.9.9";
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    expect(() =>
      ingestConformanceLabSession({ sessionRoot, spec: PLUGIN_SPEC, operator: runnableOperator(), runDate: "2026-07-06", sequence: 1 }),
    ).toThrow(/scenarioVersion/);
  });
});
