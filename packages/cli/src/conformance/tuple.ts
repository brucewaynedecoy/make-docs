/**
 * The W18 R9 support tuple for generated Playbook distributables (PRD 37
 * R-TUPLE-1; W18 R9 P1 t1/t2).
 *
 * A support claim for a generated output binds to the exact eight-field
 * tuple: scenario, harness, surface, scope, output kind, generated-output
 * kind, model or provider, and runtime. This EXTENDS two owned shapes and
 * redefines neither (R-SCOPE-1, R-KEEP-1):
 *
 * - The lab's scenario-harness-model tuple (PRD 20): `scenario`,
 *   `modelOrProvider`, and `runtime` are run metadata captured from a
 *   recorded conformance run, never embedded in scenario logic. They stay
 *   `null` on a registry tuple until a recorded run binds them via
 *   {@link bindRunMetadataOntoConformanceTuple}.
 * - The packaging lineage's seven-dimension claim tuple
 *   (`PackageSupportClaimTuple`, W18 R8 P4, PRD 36 R-PROV-3): the packaging
 *   dimensions — harness, surface, scope, output kind — are CONSUMED from
 *   that shape via {@link bindConformanceSupportTuple}, and the PRD 36
 *   distributable vocabulary (`native`/`agents-standard` surfaces,
 *   `project`/`global`/`export-only` scopes, `plugin`/`skills-bundle` output
 *   kinds) is reused from its constants, not restated.
 *
 * The one dimension this lineage adds over the packaging claim tuple is
 * `generatedOutputKind`: the ownership-record kind of the artifact actually
 * generated (`generated-plugin`, `generated-skills-bundle`, ...), reusing the
 * packaging lineage's `GeneratedOutputRecordKind` vocabulary. It captures
 * what was produced, while `outputKind` captures what was requested — the
 * two differ for exposure records (symlinks, copy mirrors, export-only
 * files), so evidence for a generated plugin never silently covers its
 * exposure artifacts.
 *
 * Implementer decisions recorded here (D8 freedoms):
 * - A registry tuple's `surface` is always a concrete surface — `auto` is a
 *   resolution request, not a surface a harness recognizes, so a tuple with
 *   `auto` would be a claim broader than any evidence (R-TUPLE-1).
 *   {@link bindConformanceSupportTuple} therefore refuses an unresolved
 *   claim tuple.
 * - The canonical tuple key ({@link conformanceTupleKey}) is the ordered
 *   dimension values joined with `/`, unbound dimensions spelled `~`, so
 *   tuple identity is deterministic and queryable without parsing.
 */

import { OperationError } from "../operations/types";
import {
  PACKAGE_SUPPORT_TUPLE_DIMENSIONS,
  type PackageSupportClaimTuple,
} from "../operations/playbook-packaging/support-binding";
import type {
  GeneratedOutputRecordKind,
  PlaybookPackageOutputKind,
  PlaybookPackageScope,
  PlaybookPackageSurface,
} from "../operations/playbook-packaging/types";

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
export type ConformanceTupleSurface = Exclude<PlaybookPackageSurface, "auto">;

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
  scope: PlaybookPackageScope;
  outputKind: PlaybookPackageOutputKind;
  generatedOutputKind: GeneratedOutputRecordKind;
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
  claim: PackageSupportClaimTuple;
  generatedOutputKind: GeneratedOutputRecordKind;
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

/**
 * The dimension this lineage adds over the packaging claim tuple. Exposed so
 * the parity test (and future readers) can assert the extension relationship
 * — consume and extend, never redefine (R-SCOPE-1) — as data.
 */
export const CONFORMANCE_TUPLE_ADDED_DIMENSIONS = CONFORMANCE_SUPPORT_TUPLE_DIMENSIONS.filter(
  (dimension) =>
    !(PACKAGE_SUPPORT_TUPLE_DIMENSIONS as readonly string[]).includes(dimension),
);
