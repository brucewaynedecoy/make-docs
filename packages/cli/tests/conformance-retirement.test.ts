/**
 * Test layer: unit (R-LAYER-1).
 * Internal tests are never evidence that a harness recognizes or can use the output (R-LAYER-2).
 */
import { createHash } from "node:crypto";
import { readFileSync, mkdtempSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, test, expect } from "vitest";
import { TEMPLATE_ROOT } from "../src/utils";
import { loadPackagingConformanceScenarioSpecs, loadPackagingConformanceScenarioSpec,
  loadConformanceTupleRegistry, RETIRED_CONFORMANCE_SCENARIOS, runQualifiesForConformanceValidation,
  generateConformanceKit, generateFirstPassConformanceKitSuite, listLabTargetErrors,
  type ConformanceRecordedRun } from "../src/conformance";
const ROOT = path.resolve(TEMPLATE_ROOT, "..", "..", "..");
const SOURCE_HASHES = {
  "conformance/scenarios/packaging/dependency-check-both-directions.json": "08b82c7510e689513ba7878be960dc9a72c5a9b739a68ab38793c852fa13593b",
  "conformance/scenarios/packaging/plugin-marketplace-install.json": "0c3b642b39750bb9032abe4b8daf96ca320fbb57e56755ae587962462cbd1ab6",
  "conformance/scenarios/packaging/skills-bundle-discovery-invocation.json": "15ed9699a073428265999e84319f5d0a816790f169d1ba1fc722b6d05efaa10c",
  "conformance/scenarios/packaging/uninstall-backup-cleanliness.json": "da5b785af11cbb6a0183dd79fdd32fcab85715e9c29a7220860c5d7768207fa0",
  "conformance/fixtures/agent/conformance-dependency-probe.playbook.md": "fa480397ecd64f3273f27b6943e0a8f7a861026c5b74110a101601d060e718b5",
  "conformance/fixtures/agent/conformance-skill-probe.playbook.md": "4f8c9a24a717bf0da916b5df45c3a4a5a69745daa21166371933e769c1c477dd",
  "conformance/history/w19-r1-p8-tuple-registry.json": "8f50865b37a2a628212b6da4050883a39f859e9c400b5cd5a6f06ea31113d4d2"
} as const;

describe("P8 retired coverage and retained lab tools", () => {
  test("all four definitions and source fixtures retain their exact historical bytes", () => {
    for (const [file, hash] of Object.entries(SOURCE_HASHES)) {
      expect(createHash("sha256").update(readFileSync(path.join(ROOT, file))).digest("hex"), file).toBe(hash);
    }
  });
  test("current coverage and support mappings exclude the old cases", () => {
    expect(loadPackagingConformanceScenarioSpecs({ repoRoot: ROOT })).toEqual([]);
    expect(loadConformanceTupleRegistry({ repoRoot: ROOT }).tuples).toEqual([]);
    for (const id of RETIRED_CONFORMANCE_SCENARIOS) {
      expect(loadPackagingConformanceScenarioSpec(path.join(ROOT, "conformance/scenarios", id + ".json")).scenarioId).toBe(id);
      const run = { scenario: id, verdict: "pass", evidenceBar: { install: true, discover: true, invoke: true, uninstall: true } } as ConformanceRecordedRun;
      expect(runQualifiesForConformanceValidation(run)).toBe(false);
    }
  });
  test("retired kit and first-pass generation fail before creating a session", async () => {
    const sessionRoot = path.join(mkdtempSync(path.join(os.tmpdir(), "p8-conformance-")), "session");
    const spec = loadPackagingConformanceScenarioSpec(path.join(ROOT, "conformance/scenarios/packaging/plugin-marketplace-install.json"));
    await expect(generateConformanceKit({ spec, harness: "codex", repoRoot: ROOT, sessionRoot })).rejects.toThrow("retired");
    await expect(generateFirstPassConformanceKitSuite({ sessionsRoot: sessionRoot, repoRoot: ROOT })).rejects.toThrow("retired");
    expect(existsSync(sessionRoot)).toBe(false);
  });
  test("explicit lab targets retain path and verification guards", () => {
    expect(listLabTargetErrors({ harnessId: "fixture", placementRoots: ["../escape"], verification: { status: "provisional" }, labInterrogation: {
      versionCommand: null, launchCommand: null, invocationEvidence: null, workspaceNotes: [], knownGaps: [],
      listingCaptures: [{ id: "capture", description: "fixture", status: "verified", reference: "fixture", form: { kind: "directory-listing", path: "../escape" } }],
    } })).toEqual(["placement roots must be workspace-relative", "capture paths must be workspace-relative", "verified lab claims require a verified target"]);
  });
});
