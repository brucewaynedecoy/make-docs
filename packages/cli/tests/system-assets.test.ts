import { describe, expect, test } from "vitest";
import { resolveSystemAssetMaterializationSafety } from "../src/system-assets";

const BASE_OPTIONS = {
  logicalAssetId: "docs/work/AGENTS.md",
  materializationMode: "provider-backed" as const,
  sourceProvider: "package",
  sourceVersion: "1.0.0",
  sourceImmutableRef: "package:make-docs@1.0.0",
  hashAlgorithm: "sha256" as const,
  expectedHashes: ["expected-sha"],
  actualHash: "expected-sha",
  providerAvailable: true,
  cacheHit: true,
  reviewedFallbackAllowed: false,
};

describe("system asset materialization safety", () => {
  test("approves provider-backed writes only when provider pins and hashes match", () => {
    expect(resolveSystemAssetMaterializationSafety(BASE_OPTIONS)).toEqual({
      status: "provider-approved",
      recoveryGuidance:
        "Provider/cache pins for docs/work/AGENTS.md matched the expected sha256 hash set.",
    });
  });

  test("fails closed when provider identity, version, or hash set is missing", () => {
    expect(() =>
      resolveSystemAssetMaterializationSafety({
        ...BASE_OPTIONS,
        sourceProvider: undefined,
      }),
    ).toThrow("missing a provider identity");

    expect(() =>
      resolveSystemAssetMaterializationSafety({
        ...BASE_OPTIONS,
        sourceVersion: undefined,
        sourceImmutableRef: undefined,
      }),
    ).toThrow("missing a provider version or immutable ref");

    expect(() =>
      resolveSystemAssetMaterializationSafety({
        ...BASE_OPTIONS,
        expectedHashes: [],
      }),
    ).toThrow("missing an expected hash set");
  });

  test("falls back to reviewed full-snapshot materialization when provider/cache is unavailable", () => {
    expect(
      resolveSystemAssetMaterializationSafety({
        ...BASE_OPTIONS,
        providerAvailable: false,
        reviewedFallbackAllowed: true,
      }),
    ).toEqual({
      status: "reviewed-full-snapshot-fallback",
      recoveryGuidance:
        "Provider/cache state for docs/work/AGENTS.md is unavailable. Use the reviewed full-snapshot materialization path before writing files.",
    });
  });

  test("does not silently accept provider/cache outage or a different asset version", () => {
    expect(() =>
      resolveSystemAssetMaterializationSafety({
        ...BASE_OPTIONS,
        cacheHit: false,
      }),
    ).toThrow("Failing closed; use a reviewed full-snapshot materialization path");

    expect(() =>
      resolveSystemAssetMaterializationSafety({
        ...BASE_OPTIONS,
        actualHash: "different-sha",
      }),
    ).toThrow("resolved a different asset version");
  });
});
