import { describe, expect, it } from "vitest";
import {
  classifyCompatibilityState,
  formatCompatibilityClassification,
} from "../src/compatibility";
import {
  COMPATIBILITY_FIXTURE_CASES,
  type CompatibilityFixtureCase,
  createCompatibilityFixture,
} from "./compatibility-fixtures";
import { cleanupTempDir } from "./helpers";

const EXPECTED_CLASSIFICATIONS = {
  "clean-v1": ["clean-v1", "migrate"],
  "clean-v2-full-snapshot": ["clean-v2-full-snapshot", "sync"],
  "clean-v2-provider-backed": ["clean-v2-provider-backed", "sync"],
  "clean-v2-hybrid-pinned-cache": ["clean-v2-hybrid-pinned-cache", "sync"],
  "modified-v1": ["modified-v1", "migrate-with-review"],
  "partial-install": ["partial-install", "migrate-with-review"],
  "malformed-manifest": ["malformed-manifest", "backup-and-reinstall"],
  "missing-manifest-recognizable": [
    "missing-manifest-recognizable",
    "migrate-with-review",
  ],
  "unknown-shape": ["unknown-shape", "manual-review-required"],
  "clean-v2-provider-backed-provider-unavailable": [
    "partial-install",
    "migrate-with-review",
  ],
  "clean-v2-hybrid-pinned-cache-stale-cache-hashes": [
    "partial-install",
    "migrate-with-review",
  ],
  "modified-v1-malformed-managed-block": [
    "modified-v1",
    "migrate-with-review",
  ],
  "missing-manifest-recognizable-canonical-missing-manifest-files": [
    "missing-manifest-recognizable",
    "migrate-with-review",
  ],
  "missing-manifest-recognizable-ambiguous-missing-manifest-files": [
    "missing-manifest-recognizable",
    "backup-and-reinstall",
  ],
  "unknown-shape-non-make-docs-path-collision": [
    "unknown-shape",
    "manual-review-required",
  ],
} as const;

describe("compatibility classifier", () => {
  it.each(COMPATIBILITY_FIXTURE_CASES)(
    "classifies $id with state and disposition evidence",
    async (fixtureCase) => {
      const fixture = await createCompatibilityFixture(fixtureCase);

      try {
        const classification = await classifyCompatibilityState({
          targetDir: fixture.targetDir,
        });
        const expected = EXPECTED_CLASSIFICATIONS[fixtureCase.id];

        expect([classification.state, classification.disposition]).toEqual(expected);
        expect(classification.evidence.manifestTrust).toHaveProperty("present");
        expect(classification.evidence.filesystemTrust).toHaveProperty(
          "managedFilesMatch",
        );
        expect(classification.evidence.bootstrapTrust).toHaveProperty(
          "requiredLocalBootstrapPresent",
        );
        expect(classification.evidence.skillTrust).toHaveProperty(
          "selectedSkillsTrusted",
        );
        expect(classification.evidence.providerCacheTrust).toHaveProperty("trusted");
        expect(formatCompatibilityClassification(classification)[0]).toBe(
          `state=${expected[0]}`,
        );
      } finally {
        cleanupTempDir(fixture.targetDir);
      }
    },
  );

  it("requires trusted provider and cache evidence for clean remote materialization", async () => {
    const providerUnavailable = await classifyFixture(
      "clean-v2-provider-backed-provider-unavailable",
    );
    const staleCache = await classifyFixture(
      "clean-v2-hybrid-pinned-cache-stale-cache-hashes",
    );

    expect(providerUnavailable.evidence.providerCacheTrust.providerAvailable).toBe(
      false,
    );
    expect(providerUnavailable.evidence.providerCacheTrust.trusted).toBe(false);
    expect(staleCache.evidence.providerCacheTrust.cacheUsable).toBe(false);
    expect(staleCache.evidence.providerCacheTrust.staleHashes).toEqual([
      "stale-fixture-hash",
    ]);
  });

  it("keeps malformed and ambiguous fallback states out of clean mutation paths", async () => {
    const malformed = await classifyFixture("malformed-manifest");
    const ambiguous = await classifyFixture(
      "missing-manifest-recognizable-ambiguous-missing-manifest-files",
    );
    const collision = await classifyFixture(
      "unknown-shape-non-make-docs-path-collision",
    );

    expect(malformed.evidence.manifestTrust.parseable).toBe(false);
    expect(ambiguous.evidence.filesystemTrust.ambiguousFallbackPaths).toContain(
      "docs/AGENTS.md",
    );
    expect(collision.evidence.filesystemTrust.nonMakeDocsPathCollisions).toContain(
      "notes/AGENTS.md",
    );
  });
});

async function classifyFixture(id: CompatibilityFixtureCase["id"]) {
  const fixtureCase = COMPATIBILITY_FIXTURE_CASES.find(
    (candidate) => candidate.id === id,
  )!;
  const fixture = await createCompatibilityFixture(fixtureCase);
  try {
    return await classifyCompatibilityState({ targetDir: fixture.targetDir });
  } finally {
    cleanupTempDir(fixture.targetDir);
  }
}
