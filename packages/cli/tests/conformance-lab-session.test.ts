/**
 * W18 R13 P2 coverage (PRD 44 R-NAME-1..2; register item D-024): the
 * lab-session vocabulary — session id, session workspace, session evidence —
 * and the evidence homes that retire the repo-local `.make-docs/conformance/`
 * transcript home: OS-temp disposable session roots by default, the
 * machine-level store's lab area (`<store-root>/conformance-lab/sessions/
 * <session-id>/`) for retained sessions, and result-record
 * `transcriptLogPointer` validation accepting only the store lab area or
 * `discarded-with-session`.
 *
 * Test layer: unit (R-LAYER-1) — pure-function tests over the lab-session
 * naming and evidence-home rules, no CLI. They prove the machinery's honesty
 * rules only: internal tests passing is never evidence that a harness
 * recognizes or can use the output (R-LAYER-2, PRD 36 R-TEST-5).
 */

import path from "node:path";
import { describe, expect, test } from "vitest";
import {
  CONFORMANCE_LAB_SESSIONS_PATH_FRAGMENT,
  CONFORMANCE_TRANSCRIPT_DISCARDED_WITH_SESSION,
  conformanceLabAreaRoot,
  conformanceLabSessionsRoot,
  defaultConformanceSessionRoot,
  listConformanceTranscriptLogPointerErrors,
  mintConformanceLabSessionId,
  retainedConformanceLabSessionPath,
  validateConformanceLabSessionId,
  validatePackagingConformanceResultRecord,
  type PackagingConformanceResultRecord,
} from "../src/conformance";

function baseResultRecord(): PackagingConformanceResultRecord {
  return {
    schemaVersion: "conformance.result.v1",
    resultId: "2026-07-06-fixture-blocked",
    scenarioId: "packaging/fixture-outcome",
    scenarioVersion: "1.0.0",
    runDate: "2026-07-06",
    makeDocsVersion: "test",
    harness: "codex",
    modelName: "unknown",
    providerOrRoutingLayer: "unknown",
    modelVersion: "unknown",
    runtimeDistribution: "node",
    runtimeVersion: "18",
    producedFiles: [],
    relevantDiffs: [],
    exitStatus: null,
    transcriptLogPointer: CONFORMANCE_TRANSCRIPT_DISCARDED_WITH_SESSION,
    verdict: "blocked",
    reason: "Blocked before execution: fixture.",
    caveats: [],
    reviewerStatus: "unreviewed",
    supportClaimUse: "none",
    caveatsSurfaced: false,
    evidenceBar: { install: false, discover: false, invoke: false, uninstall: false },
    simulated: false,
    simulationMechanicsRef: null,
    transcriptFormat: "non-tty",
  };
}

describe("lab-session vocabulary and ids (R-NAME-1)", () => {
  test("mints deterministic date-target-outcome session ids", () => {
    expect(
      mintConformanceLabSessionId({
        date: "2026-07-06",
        harness: "codex",
        outcome: "plugin-marketplace-install",
      }),
    ).toBe("2026-07-06-codex-plugin-marketplace-install");
    expect(
      mintConformanceLabSessionId({
        date: "2026-07-06",
        harness: "codex",
        outcome: "plugin-marketplace-install",
        disambiguator: "2",
      }),
    ).toBe("2026-07-06-codex-plugin-marketplace-install-2");
  });

  test("rejects malformed dates and non-slug session ids", () => {
    expect(() =>
      mintConformanceLabSessionId({ date: "07/06/2026", harness: "codex", outcome: "x" }),
    ).toThrow(/YYYY-MM-DD/);
    expect(() => validateConformanceLabSessionId("Not A Slug")).toThrow(/lowercase hyphenated slug/);
  });
});

describe("evidence homes (R-NAME-2, D-024)", () => {
  test("the retained-session home resolves under <store-root>/conformance-lab/sessions/<session-id>/", () => {
    const storeRoot = "/home/maintainer/.make-docs";
    expect(conformanceLabAreaRoot(storeRoot)).toBe(path.join(storeRoot, "conformance-lab"));
    expect(conformanceLabSessionsRoot(storeRoot)).toBe(
      path.join(storeRoot, "conformance-lab", "sessions"),
    );
    expect(retainedConformanceLabSessionPath({ storeRoot, sessionId: "2026-07-06-codex-x" })).toBe(
      path.join(storeRoot, "conformance-lab", "sessions", "2026-07-06-codex-x"),
    );
  });

  test("the default session root lives under the OS temp root, never a repository", () => {
    const sessionRoot = defaultConformanceSessionRoot({
      sessionId: "2026-07-06-codex-x",
      tempRoot: "/tmp-root",
    });
    expect(sessionRoot).toBe(path.join("/tmp-root", "make-docs-conformance-lab", "2026-07-06-codex-x"));
  });

  test("transcript pointers accept only the store lab area or discarded-with-session", () => {
    expect(
      listConformanceTranscriptLogPointerErrors(CONFORMANCE_TRANSCRIPT_DISCARDED_WITH_SESSION),
    ).toEqual([]);
    // The store root itself is a `.make-docs` directory; the lab-area
    // convention must accept it.
    expect(
      listConformanceTranscriptLogPointerErrors(
        `/home/maintainer/.make-docs/${CONFORMANCE_LAB_SESSIONS_PATH_FRAGMENT}2026-07-06-codex-x/transcript.json`,
      ),
    ).toEqual([]);
    const oldHome = listConformanceTranscriptLogPointerErrors(
      ".make-docs/conformance/2026-07-06-transcript.json",
    );
    expect(oldHome).toHaveLength(1);
    expect(oldHome[0]).toMatch(/D-024/);
    expect(
      listConformanceTranscriptLogPointerErrors("docs/assets/archive/transcript.json"),
    ).toHaveLength(1);
  });

  test("result-record validation enforces the pointer rule", () => {
    expect(() => validatePackagingConformanceResultRecord(baseResultRecord())).not.toThrow();
    expect(() =>
      validatePackagingConformanceResultRecord({
        ...baseResultRecord(),
        transcriptLogPointer: `/home/maintainer/.make-docs/${CONFORMANCE_LAB_SESSIONS_PATH_FRAGMENT}2026-07-06-codex-x/transcript.json`,
      }),
    ).not.toThrow();
    expect(() =>
      validatePackagingConformanceResultRecord({
        ...baseResultRecord(),
        transcriptLogPointer: ".make-docs/conformance/2026-07-06-transcript.json",
      }),
    ).toThrow(/D-024/);
  });
});
