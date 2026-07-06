/**
 * The W18 R9 P3 three named test layers (PRD 37 R-LAYER-1..2; W18 R9 P3
 * t1/t2).
 *
 * Coverage is organized into three NAMED layers so one layer's passing never
 * masquerades as another's (R-LAYER-1): unit tests cover the operation core,
 * parser, and validator as pure functions without a CLI; integration tests
 * cover the CLI and MCP surfaces over the core, including the manifest and
 * exposure plumbing; and conformance tests cover the real-harness user
 * outcome per tuple through the maintainer lab. Unit and integration tests
 * are automated repository tests; the conformance layer is the maintainer
 * lab — it is NOT a repository test suite, and no `*.test.ts` file may claim
 * it (R-LAYER-2).
 *
 * The boundary rule this module carries as data (R-LAYER-2, aligning with
 * PRD 36 R-TEST-5): internal tests passing is never evidence that a harness
 * recognizes or can use the output. That rule is the direct corrective for
 * the failure mode that let the descriptor output look correct while not
 * being recognized.
 *
 * Implementer decisions recorded here (D8 freedoms):
 * - Layer naming lives WHERE THE TESTS LIVE (t1): each packaging-related
 *   repository suite declares exactly one `Test layer: <layer>` marker line
 *   in its file-header comment, machine-checked by the Phase 3
 *   meta-verification suite; the conformance layer is named in
 *   `conformance/README.md`, where its assets live.
 * - The marker is a plain header line rather than code so the declaration is
 *   the first thing a reader sees, before any test runs — the same placement
 *   rule the W18 R8 P5 evidence boundary uses.
 */

/** The three named layers, in altitude order (R-LAYER-1). */
export const CONFORMANCE_TEST_LAYERS = ["unit", "integration", "conformance"] as const;
export type ConformanceTestLayer = (typeof CONFORMANCE_TEST_LAYERS)[number];

/** What each layer — and only that layer — covers (R-LAYER-1). */
export const CONFORMANCE_TEST_LAYER_MEANINGS: Record<ConformanceTestLayer, string> = {
  unit: "Covers the operation core, parser, and validator as pure functions without a CLI.",
  integration:
    "Covers the CLI and MCP surfaces over the core, including the manifest and exposure plumbing.",
  conformance:
    "Covers the real-harness user outcome per tuple through the maintainer lab; never an automated repository test.",
};

/**
 * The layers an automated repository test may declare (R-LAYER-2): unit and
 * integration only. The conformance layer is the maintainer lab, so a
 * repository test claiming it would be exactly the substitution the layer
 * rule forbids.
 */
export const REPOSITORY_TEST_LAYERS = ["unit", "integration"] as const satisfies readonly ConformanceTestLayer[];

/**
 * The R-LAYER-2 boundary rule, verbatim, for embedding wherever unit and
 * integration tests live (PRD 36 R-TEST-5 alignment).
 */
export const TEST_LAYER_BOUNDARY_RULE =
  "Internal tests passing is never evidence that a harness recognizes or can use the output (R-LAYER-2; PRD 36 R-TEST-5).";

/**
 * The header marker each repository suite uses to name its layer where the
 * tests live (t1). Exactly one marker per file; the layer token must be one
 * of {@link REPOSITORY_TEST_LAYERS} for a `*.test.ts` file.
 */
const TEST_LAYER_MARKER_PATTERN = /^\s*\*\s*Test layer:\s*([a-z-]+)/gm;

/**
 * Every layer token declared by `Test layer:` markers in a test-file header
 * (the comment text before the first `describe(`). Unknown tokens are
 * returned as-is so the caller can flag them rather than silently ignoring a
 * typo'd layer.
 */
export function listDeclaredTestLayers(header: string): string[] {
  return [...header.matchAll(TEST_LAYER_MARKER_PATTERN)].map((match) => match[1]!);
}
