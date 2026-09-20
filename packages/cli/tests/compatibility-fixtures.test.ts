import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseManagedBlock } from "../src/managed-block";
import {
  COMPATIBILITY_DEFAULT_DISPOSITIONS,
  COMPATIBILITY_FIXTURE_CASES,
  COMPATIBILITY_SOURCE_STATES,
  createCompatibilityFixture,
} from "./compatibility-fixtures";
import { cleanupTempDir } from "./helpers";

describe("compatibility fixtures", () => {
  it("covers every PRD 18 source state and default disposition", () => {
    const fixtureStates = new Set(
      COMPATIBILITY_FIXTURE_CASES.map((fixtureCase) => fixtureCase.state),
    );
    const fixtureDispositions = new Set(
      COMPATIBILITY_FIXTURE_CASES.map((fixtureCase) => fixtureCase.disposition),
    );

    expect(fixtureStates).toEqual(new Set(COMPATIBILITY_SOURCE_STATES));
    expect(fixtureDispositions).toEqual(
      new Set(Object.values(COMPATIBILITY_DEFAULT_DISPOSITIONS)),
    );
  });

  it.each(COMPATIBILITY_FIXTURE_CASES)(
    "creates reusable fixture $id",
    async (fixtureCase) => {
      const fixture = await createCompatibilityFixture(fixtureCase);

      try {
        expect(existsSync(fixture.targetDir)).toBe(true);
        expect(fixture.disposition).toBe(
          COMPATIBILITY_DEFAULT_DISPOSITIONS[fixture.state],
        );

        if (fixture.state === "unknown-shape") {
          expect(fixture.manifest).toBeNull();
          return;
        }

        if (fixture.state === "malformed-manifest") {
          expect(fixture.manifest).toBeNull();
          expect(readFileSync(fixture.manifestPath, "utf8")).toContain(
            "malformed",
          );
          return;
        }

        if (fixture.state === "missing-manifest-recognizable") {
          expect(existsSync(fixture.manifestPath)).toBe(false);
          expect(fixture.manifest).toBeNull();
          return;
        }

        expect(fixture.manifest).not.toBeNull();
      } finally {
        cleanupTempDir(fixture.targetDir);
      }
    },
  );

  it("materializes named edge variants for future classifier tests", async () => {
    const providerUnavailable = await createCompatibilityFixture(
      COMPATIBILITY_FIXTURE_CASES.find(
        (fixtureCase) => fixtureCase.variant === "provider-unavailable",
      )!,
    );
    const staleCacheHashes = await createCompatibilityFixture(
      COMPATIBILITY_FIXTURE_CASES.find(
        (fixtureCase) => fixtureCase.variant === "stale-cache-hashes",
      )!,
    );
    const malformedManagedBlock = await createCompatibilityFixture(
      COMPATIBILITY_FIXTURE_CASES.find(
        (fixtureCase) => fixtureCase.variant === "malformed-managed-block",
      )!,
    );

    try {
      const providerEntry = Object.values(
        providerUnavailable.manifest!.systemAssetMaterialization.assets,
      )[0];
      const cacheEntry = Object.values(
        staleCacheHashes.manifest!.systemAssetMaterialization.assets,
      )[0];
      const managedBlock = parseManagedBlock(
        readFileSync(`${malformedManagedBlock.targetDir}/AGENTS.md`, "utf8"),
      );

      expect(providerEntry.sourceProvider).toBe("unavailable-test-provider");
      expect(cacheEntry.expectedHashes).toEqual(["stale-fixture-hash"]);
      expect(managedBlock.state).toBe("malformed");
    } finally {
      cleanupTempDir(providerUnavailable.targetDir);
      cleanupTempDir(staleCacheHashes.targetDir);
      cleanupTempDir(malformedManagedBlock.targetDir);
    }
  });
});
