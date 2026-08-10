/**
 * Support-claim tuple binding (W18 R8 P4, R-PROV-3).
 *
 * Every support claim for a generated output is bound to the exact tuple of
 * scenario, harness, surface, scope, output kind, model or provider, and
 * runtime, and stays provisional until conformance evidence exists for that
 * exact tuple. The packaging lineage owns the binding record; the evidence
 * that binds the open dimensions — the conformance scenario, the model or
 * provider, and the runtime — is owned by the W18 R9 conformance lineage
 * (PRD 20) and its tuple registry, never by unit or integration tests here
 * (PRD 36 R-TEST-5). A dimension no evidence has bound yet is `null`, and a
 * `validated` status is capped to `provisional` while any dimension is
 * unbound, mirroring the R-ADAPT-1 verification cap.
 */

import type {
  PlaybookPackageOutputKind,
  PlaybookPackageScope,
  PlaybookPackageSupportStatus,
  PlaybookPackageSurface,
  PlaybookPackageTarget,
} from "./types";

export const PACKAGE_SUPPORT_TUPLE_DIMENSIONS = [
  "scenario",
  "harness",
  "surface",
  "scope",
  "outputKind",
  "modelOrProvider",
  "runtime",
] as const;
export type PackageSupportTupleDimension = (typeof PACKAGE_SUPPORT_TUPLE_DIMENSIONS)[number];

/**
 * The exact R-PROV-3 tuple a support claim binds to. `scenario`,
 * `modelOrProvider`, and `runtime` are `null` until W18 R9 conformance
 * evidence binds them; `surface` counts as unbound while it is still `auto`.
 */
export interface PackageSupportClaimTuple {
  scenario: string | null;
  harness: string;
  surface: PlaybookPackageSurface;
  scope: PlaybookPackageScope;
  outputKind: PlaybookPackageOutputKind;
  modelOrProvider: string | null;
  runtime: string | null;
}

/** Binds the target-owned dimensions; evidence-owned dimensions default to unbound. */
export function bindPackageSupportTuple(input: {
  target: PlaybookPackageTarget;
  scenario?: string | null;
  modelOrProvider?: string | null;
  runtime?: string | null;
}): PackageSupportClaimTuple {
  return {
    scenario: input.scenario ?? null,
    harness: input.target.harness,
    surface: input.target.surface,
    scope: input.target.scope,
    outputKind: input.target.outputKind,
    modelOrProvider: input.modelOrProvider ?? null,
    runtime: input.runtime ?? null,
  };
}

/** Dimensions of the tuple no evidence (or resolution) has bound yet. */
export function listUnboundSupportTupleDimensions(
  tuple: PackageSupportClaimTuple,
): PackageSupportTupleDimension[] {
  const unbound: PackageSupportTupleDimension[] = [];
  if (tuple.scenario === null) {
    unbound.push("scenario");
  }
  if (tuple.surface === "auto") {
    unbound.push("surface");
  }
  if (tuple.modelOrProvider === null) {
    unbound.push("modelOrProvider");
  }
  if (tuple.runtime === null) {
    unbound.push("runtime");
  }
  return unbound;
}

export function isPackageSupportTupleBound(tuple: PackageSupportClaimTuple): boolean {
  return listUnboundSupportTupleDimensions(tuple).length === 0;
}

/**
 * The R-PROV-3 tuple gate: a `validated` support claim whose tuple has any
 * unbound dimension is capped to `provisional`. Evidence refs alone never
 * validate a claim — only the W18 R9 evidence bar binds the open dimensions,
 * so no public support wording ships from the packaging lineage.
 */
export function capSupportStatusForTupleBinding(
  status: PlaybookPackageSupportStatus,
  tuple: PackageSupportClaimTuple | null | undefined,
): PlaybookPackageSupportStatus {
  if (status === "validated" && (!tuple || !isPackageSupportTupleBound(tuple))) {
    return "provisional";
  }
  return status;
}
