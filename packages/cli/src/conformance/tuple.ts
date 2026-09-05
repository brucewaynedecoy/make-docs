/** Exact evidence tuple. Legacy values remain readable without the retired compiler. */
import { OperationError } from "../operations/types";
import type { ConformanceOutputKind, ConformanceScope, ConformanceRecordKind } from "./historical-contract";

/**
 * The eight R-TUPLE-1 dimensions in contract order. The first seven are the
 * packaging claim-tuple dimensions (consumed from W18 R8 P4's
 * `PACKAGE_SUPPORT_TUPLE_DIMENSIONS`) with `generatedOutputKind` inserted
 * after `outputKind`; a conformance test pins that relationship so neither
 * lineage can drift from the other silently.
 */
export const CONFORMANCE_SUPPORT_TUPLE_DIMENSIONS = [
  "scenario",
  "harness",
  "surface",
  "scope",
  "outputKind",
  "generatedOutputKind",
  "modelOrProvider",
  "runtime",
] as const;
export type ConformanceSupportTupleDimension =
  (typeof CONFORMANCE_SUPPORT_TUPLE_DIMENSIONS)[number];

/** A concrete, harness-recognizable surface: never the `auto` request. */
export type ConformanceTupleSurface = "native" | "agents-standard";

/**
 * The exact tuple a conformance support claim binds to (R-TUPLE-1). The
 * evidence-owned dimensions — `scenario`, `modelOrProvider`, `runtime` — are
 * `null` until a recorded run binds them (they are run metadata per PRD 20's
 * lab contract, R-KEEP-1); the packaging dimensions are always bound.
 */
export interface ConformanceSupportTuple {
  scenario: string | null;
  harness: string;
  surface: ConformanceTupleSurface;
  scope: ConformanceScope;
  outputKind: ConformanceOutputKind;
  generatedOutputKind: ConformanceRecordKind;
  modelOrProvider: string | null;
  runtime: string | null;
}

/**
 * Extends a packaging support-claim tuple (W18 R8 P4, R-PROV-3) into the
 * eight-field conformance tuple by binding the generated-output kind. The
 * claim tuple is consumed as-is — its evidence-owned dimensions ride along
 * unchanged — so the two lineages share one set of dimension values. An
 * unresolved `auto` surface is refused: it is a claim broader than any
 * evidence could be (R-TUPLE-1).
 */
export function bindConformanceSupportTuple(input: {
  claim: Omit<ConformanceSupportTuple, "generatedOutputKind" | "surface"> & { surface: ConformanceTupleSurface | "auto" };
  generatedOutputKind: ConformanceRecordKind;
}): ConformanceSupportTuple {
  if (input.claim.surface === "auto") {
    throw new OperationError(
      "A conformance support tuple requires a resolved surface: `auto` is a resolution request, " +
        "not a surface a harness recognizes, so binding it would make the claim broader than its evidence (R-TUPLE-1).",
    );
  }
  return {
    scenario: input.claim.scenario,
    harness: input.claim.harness,
    surface: input.claim.surface,
    scope: input.claim.scope,
    outputKind: input.claim.outputKind,
    generatedOutputKind: input.generatedOutputKind,
    modelOrProvider: input.claim.modelOrProvider,
    runtime: input.claim.runtime,
  };
}

/**
 * Binds the lab-owned run metadata — scenario id, model or provider, and
 * runtime — onto a tuple (t2). This is the ONLY seam that binds the
 * evidence-owned dimensions: they are run metadata per PRD 20's result
 * contract (R-KEEP-1), so nothing in the packaging or registry code may
 * invent them, and a recorded conformance run is the only source.
 */
export function bindRunMetadataOntoConformanceTuple(
  tuple: ConformanceSupportTuple,
  runMetadata: { scenario: string; modelOrProvider: string; runtime: string },
): ConformanceSupportTuple {
  return {
    ...tuple,
    scenario: runMetadata.scenario,
    modelOrProvider: runMetadata.modelOrProvider,
    runtime: runMetadata.runtime,
  };
}

/** Dimensions of the tuple no recorded run has bound yet. */
export function listUnboundConformanceTupleDimensions(
  tuple: ConformanceSupportTuple,
): ConformanceSupportTupleDimension[] {
  const unbound: ConformanceSupportTupleDimension[] = [];
  if (tuple.scenario === null) {
    unbound.push("scenario");
  }
  if (tuple.modelOrProvider === null) {
    unbound.push("modelOrProvider");
  }
  if (tuple.runtime === null) {
    unbound.push("runtime");
  }
  return unbound;
}

export function isConformanceTupleBound(tuple: ConformanceSupportTuple): boolean {
  return listUnboundConformanceTupleDimensions(tuple).length === 0;
}

/**
 * Canonical tuple identity: the eight dimension values in contract order
 * joined with `/`, unbound dimensions spelled `~`. Deterministic, so the
 * registry can enforce one entry per exact tuple.
 */
export function conformanceTupleKey(tuple: ConformanceSupportTuple): string {
  return CONFORMANCE_SUPPORT_TUPLE_DIMENSIONS.map(
    (dimension) => tuple[dimension] ?? "~",
  ).join("/");
}
