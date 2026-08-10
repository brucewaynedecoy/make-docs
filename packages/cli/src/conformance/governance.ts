/**
 * The W18 R9 P4 support-claim governance (PRD 20 R-GOV-1..2; W18 R9 P4
 * t1-t6). This module is the human-facing half of the tuple registry: it owns
 * how support claims may be PHRASED anywhere support language appears — docs,
 * READMEs, guides, registry notes, generated package records — and binds that
 * wording to tuple status so no claim runs ahead of its tuple's evidence.
 *
 * The rules encoded here (R-GOV-1, R-GOV-2):
 * - A public claim states only what a `conformance-validated` tuple proves;
 *   until a tuple is conformance-validated, wording MUST distinguish a Make
 *   Docs generated output from a harness-recognized plugin.
 * - A `pass-with-caveats` result surfaces its caveats in any claim derived
 *   from it — the caveats ride the wording itself, never a footnote elsewhere.
 * - The lab thresholds are preserved (PRD 20): one passing, maintainer-
 *   reviewed conformance run per tuple is the minimum for nominal support
 *   wording, and repeated reviewed runs are the stronger threshold for a more
 *   confident claim. Stronger commendation language appears only behind that
 *   stronger threshold.
 *
 * Ownership boundaries (R-SCOPE-1, R-KEEP-1): status derivation stays owned
 * by `registry.ts` (R-REG-2..3) and the bar by `scenario.ts` (R-BAR-1) —
 * governance CONSUMES a derived status and derives wording from it, never the
 * other way around. The reviewer statuses and support-claim uses
 * (`nominal-tuple`, `stronger-claim-candidate`) are the lab's own result
 * vocabulary (PRD 20), consumed unchanged as the threshold inputs.
 *
 * Implementer decisions recorded here (D8 freedoms):
 * - Wording is DERIVED, not authored: {@link renderConformanceSupportClaim}
 *   is the single seam that turns a registry entry into public claim wording,
 *   so the R-GOV-1 rule is code, and hand-authored prose can only ever
 *   restate (never exceed) what the derivation permits.
 * - Review is read from receipts: the compact recorded run deliberately does
 *   not carry `reviewerStatus` (it is a projection, and review happens on the
 *   full result record), so {@link deriveSupportClaimStrength} reads each
 *   qualifying run's committed result record via its `recordRef` — the same
 *   receipts discipline as the Phase 3 R-TEST-1 check. A missing or invalid
 *   record fails closed to unreviewed: a claim can never be stronger than the
 *   evidence a reviewer can actually open.
 * - The registry status and the public claim are two gates, not one: a tuple
 *   can be `conformance-validated` (status derivation needs a qualifying run,
 *   not a review) while public wording stays withheld until the run is
 *   maintainer-reviewed, because the lab's claim gate requires review for any
 *   public wording. Status is evidence bookkeeping; wording is governance.
 * - Claim surfaces are DECLARED data ({@link CONFORMANCE_CLAIM_SURFACES}),
 *   each carrying a machine-checked `support-claim-state` marker (an HTML
 *   comment, invisible to readers) asserting the registry's current
 *   conformance-validated count. When a tuple advances, every claim surface's
 *   marker goes stale and {@link listSupportClaimGovernanceErrors} fails the
 *   build until the surface's wording is reviewed and its marker updated —
 *   that is the t4 mechanical promotion path for wording: claim wording can
 *   advance only when the exact tuple advances, and it cannot silently NOT
 *   advance conversations either. A vocabulary sweep over the reader-facing
 *   roots catches support language appearing on an undeclared surface.
 * - The packaging lineage's support statuses are capped against the registry
 *   ({@link capSupportStatusForConformanceRegistry}) as a maintainer-side
 *   check-layer gate: the registry is maintainer-only content (R-KEEP-1,
 *   R-TEST-3) and is not available to a user-side planner run, so this cap is
 *   enforced by the repository suite over the committed registry and the
 *   first-party descriptors, not by shipping the registry.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  FIRST_PARTY_HARNESS_CAPABILITY_DESCRIPTORS,
} from "../operations/playbook-packaging/descriptors";
import { outputKindForProfile } from "../operations/playbook-packaging/capability-descriptor";
import { OperationError } from "../operations/types";
import type { PlaybookPackageSupportStatus } from "../operations/playbook-packaging/types";
import {
  CONFORMANCE_TUPLE_STATUS_MEANINGS,
  runQualifiesForConformanceValidation,
  type ConformanceRecordedRun,
  type ConformanceTupleRegistry,
  type ConformanceTupleRegistryEntry,
} from "./registry";
import {
  splitConformanceScenarioId,
  validatePackagingConformanceResultRecord,
  type PackagingConformanceResultRecord,
} from "./scenario";
import { conformanceTupleKey, type ConformanceSupportTuple } from "./tuple";

type RegistryTuples = Pick<ConformanceTupleRegistry, "tuples">;

/* --------------------------------------------------------------------------
 * The wording rule and thresholds as data (t1, t3; R-GOV-1..2).
 * ------------------------------------------------------------------------ */

/** The R-GOV-1 wording rule, verbatim, for embedding wherever support language appears. */
export const SUPPORT_CLAIM_WORDING_RULE =
  "A public claim states only what a `conformance-validated` tuple proves; until a tuple is " +
  "conformance-validated, wording distinguishes a Make Docs generated output from a " +
  "harness-recognized plugin, and a `pass-with-caveats` result surfaces its caveats in any claim (R-GOV-1).";

/**
 * The machine-checked core of the wording rule: every declared claim surface
 * must carry this phrase, so the rule is encoded where the support language
 * lives (t1), not only in this module.
 */
export const SUPPORT_CLAIM_WORDING_RULE_CORE =
  "states only what a `conformance-validated` tuple proves";

/** The R-GOV-2 claim strengths, weakest first. */
export const SUPPORT_CLAIM_STRENGTHS = ["no-public-claim", "nominal", "stronger"] as const;
export type SupportClaimStrength = (typeof SUPPORT_CLAIM_STRENGTHS)[number];

/**
 * The R-GOV-2 thresholds as data, preserving the lab's claim gate (PRD 20):
 * review is required for ANY public wording, one reviewed qualifying run is
 * the nominal minimum, and repeated reviewed runs — with a reviewed record
 * marked `stronger-claim-candidate` — are the stronger threshold.
 */
export const SUPPORT_CLAIM_STRENGTH_THRESHOLDS: Record<SupportClaimStrength, string> = {
  "no-public-claim":
    "No maintainer-reviewed qualifying run exists for the tuple; wording distinguishes a Make Docs generated output from a harness-recognized plugin (R-GOV-1).",
  nominal:
    "At least one maintainer-reviewed qualifying run meeting the install-discover-invoke-uninstall bar exists for the exact tuple — the lab's one-run minimum (R-GOV-2).",
  stronger:
    "Repeated (two or more) maintainer-reviewed qualifying runs exist for the exact tuple, at least one marked `stronger-claim-candidate` by its reviewer — the lab's stronger threshold (R-GOV-2).",
};

/* --------------------------------------------------------------------------
 * Claim strength: derived from reviewed receipts (t3; R-GOV-2).
 * ------------------------------------------------------------------------ */

export interface SupportClaimStrengthDerivation {
  strength: SupportClaimStrength;
  /** Qualifying runs on the entry (R-REG-3 qualification, review not yet applied). */
  qualifyingRuns: ConformanceRecordedRun[];
  /** The subset whose committed result records read `reviewerStatus: "reviewed"`. */
  reviewedQualifyingRuns: ConformanceRecordedRun[];
  /** Why the strength landed where it did, human-readable. */
  reasons: string[];
}

function readCommittedResultRecord(
  repoRoot: string,
  recordRef: string,
): PackagingConformanceResultRecord | null {
  const recordPath = path.join(repoRoot, recordRef);
  if (!existsSync(recordPath)) {
    return null;
  }
  try {
    return validatePackagingConformanceResultRecord(
      JSON.parse(readFileSync(recordPath, "utf8")) as unknown,
    );
  } catch {
    return null;
  }
}

/**
 * Derives the R-GOV-2 claim strength for a registry entry from its qualifying
 * runs and their committed, maintainer-reviewed result records. Fails closed
 * everywhere: a qualifying run whose record is missing, invalid, or not
 * `reviewed` contributes nothing to public wording — a claim can never be
 * stronger than the evidence a reviewer actually reviewed.
 */
export function deriveSupportClaimStrength(
  entry: Pick<ConformanceTupleRegistryEntry, "recordedRuns">,
  options: { repoRoot: string },
): SupportClaimStrengthDerivation {
  const qualifyingRuns = entry.recordedRuns.filter(runQualifiesForConformanceValidation);
  const reasons: string[] = [];
  if (qualifyingRuns.length === 0) {
    reasons.push("no qualifying recorded run exists for the tuple (R-REG-3)");
    return { strength: "no-public-claim", qualifyingRuns, reviewedQualifyingRuns: [], reasons };
  }
  const reviewedQualifyingRuns: ConformanceRecordedRun[] = [];
  let strongerCandidate = false;
  for (const run of qualifyingRuns) {
    const record = readCommittedResultRecord(options.repoRoot, run.recordRef);
    if (record === null) {
      reasons.push(
        `run \`${run.runId}\` has no valid committed result record at \`${run.recordRef}\`; it contributes nothing to public wording`,
      );
      continue;
    }
    if (record.reviewerStatus !== "reviewed") {
      reasons.push(
        `run \`${run.runId}\` is \`${record.reviewerStatus}\`; public wording requires maintainer review (R-GOV-2)`,
      );
      continue;
    }
    reviewedQualifyingRuns.push(run);
    if (record.supportClaimUse === "stronger-claim-candidate") {
      strongerCandidate = true;
    }
  }
  if (reviewedQualifyingRuns.length === 0) {
    reasons.push("no qualifying run is maintainer-reviewed; the claim gate stays closed");
    return { strength: "no-public-claim", qualifyingRuns, reviewedQualifyingRuns, reasons };
  }
  if (reviewedQualifyingRuns.length >= 2 && strongerCandidate) {
    reasons.push(
      `${reviewedQualifyingRuns.length} reviewed qualifying runs with a reviewed stronger-claim-candidate meet the stronger threshold (R-GOV-2)`,
    );
    return { strength: "stronger", qualifyingRuns, reviewedQualifyingRuns, reasons };
  }
  reasons.push(
    `${reviewedQualifyingRuns.length} reviewed qualifying run(s) meet the nominal one-run minimum (R-GOV-2)`,
  );
  return { strength: "nominal", qualifyingRuns, reviewedQualifyingRuns, reasons };
}

/* --------------------------------------------------------------------------
 * Wording derivation: the single claim-rendering seam (t1, t2; R-GOV-1).
 * ------------------------------------------------------------------------ */

export interface ConformanceSupportClaim {
  tupleKey: string;
  status: ConformanceTupleRegistryEntry["status"];
  strength: SupportClaimStrength;
  /** The complete permitted public wording; prose may restate, never exceed it. */
  wording: string;
  /** Caveats carried by the claim; each is embedded verbatim in `wording` (t2). */
  caveats: string[];
}

function claimSubject(tuple: ConformanceSupportTuple): { subject: string; noun: string } {
  const noun = tuple.outputKind === "plugin" ? "plugin" : "skills bundle";
  return {
    subject:
      `the generated ${noun} output for \`${tuple.harness}\` ` +
      `(surface \`${tuple.surface}\`, scope \`${tuple.scope}\`, generated kind \`${tuple.generatedOutputKind}\`)`,
    noun,
  };
}

/**
 * Derives the permitted public claim wording for a registry entry (R-GOV-1).
 * Below `conformance-validated` — and at `conformance-validated` without a
 * reviewed run — the wording explicitly distinguishes a Make Docs generated
 * output from a harness-recognized plugin. At nominal or stronger strength
 * the wording states only what the exact tuple proves — the scenario, the
 * bar, the run metadata — and embeds every caveat carried by the qualifying
 * reviewed runs (t2), with stronger-commendation language appearing only
 * behind the stronger threshold (R-GOV-2).
 */
export function renderConformanceSupportClaim(
  entry: ConformanceTupleRegistryEntry,
  options: { repoRoot: string },
): ConformanceSupportClaim {
  const tupleKey = conformanceTupleKey(entry.tuple);
  const { subject, noun } = claimSubject(entry.tuple);
  const distinguish = (detail: string): string =>
    `${subject} is a Make Docs generated output, not a \`${entry.tuple.harness}\`-recognized ${noun}. ${detail}`;
  if (entry.status !== "conformance-validated") {
    return {
      tupleKey,
      status: entry.status,
      strength: "no-public-claim",
      wording: distinguish(
        `Support status: \`${entry.status}\` — ${CONFORMANCE_TUPLE_STATUS_MEANINGS[entry.status]}`,
      ),
      caveats: [],
    };
  }
  const derivation = deriveSupportClaimStrength(entry, options);
  if (derivation.strength === "no-public-claim") {
    return {
      tupleKey,
      status: entry.status,
      strength: "no-public-claim",
      wording: distinguish(
        "A qualifying recorded run exists but is not maintainer-reviewed; public wording stays withheld until review (R-GOV-2).",
      ),
      caveats: [],
    };
  }
  const caveats = [
    ...new Set(derivation.reviewedQualifyingRuns.flatMap((run) => run.caveats)),
  ];
  const latest = derivation.reviewedQualifyingRuns.at(-1)!;
  const parts = [
    `Conformance-validated for exactly this tuple (\`${tupleKey}\`): scenario ` +
      `\`${latest.scenario}\` met the install-discover-invoke-uninstall bar on ` +
      `\`${entry.tuple.harness}\` (${latest.runDate}, model/provider \`${latest.modelOrProvider}\`, ` +
      `runtime \`${latest.runtime}\`${latest.simulated ? ", faithfully simulated harness" : ""}).`,
  ];
  if (derivation.strength === "stronger") {
    parts.push(
      `Stronger claim: ${derivation.reviewedQualifyingRuns.length} maintainer-reviewed qualifying runs (R-GOV-2).`,
    );
  } else {
    parts.push("Nominal support: the lab's one-reviewed-run minimum (R-GOV-2).");
  }
  if (caveats.length > 0) {
    parts.push(`Caveats: ${caveats.join("; ")}.`);
  }
  parts.push("This claims nothing beyond the exact tuple (R-TUPLE-1).");
  return {
    tupleKey,
    status: entry.status,
    strength: derivation.strength,
    wording: parts.join(" "),
    caveats,
  };
}

/* --------------------------------------------------------------------------
 * Mechanical promotion for the packaging lineage (t4, t5; R-GOV-1, R-REG-3).
 * ------------------------------------------------------------------------ */

/**
 * The highest packaging support status the registry permits for a tuple: the
 * W18 R5/PRD 36 generated-output claims and the W18 R8 adapter support
 * statuses may read `validated` only when the exact registry tuple is
 * `conformance-validated` — an unregistered tuple permits nothing beyond
 * `provisional`, so no parallel or prose-only support surface can exist
 * (R-REG-1).
 */
export function derivePackageSupportStatusCeilingFromRegistry(
  entry: ConformanceTupleRegistryEntry | null,
): Extract<PlaybookPackageSupportStatus, "provisional" | "validated"> {
  return entry !== null && entry.status === "conformance-validated" ? "validated" : "provisional";
}

/**
 * The registry cap, composing with the W18 R8 verification and tuple-binding
 * caps: a `validated` claim whose registry tuple is not `conformance-validated`
 * is held at `provisional`. This is the third, maintainer-side gate — the
 * registry is maintainer-only content, so this cap is enforced by the
 * repository suite over the committed registry, not at user-side plan time.
 */
export function capSupportStatusForConformanceRegistry(
  status: PlaybookPackageSupportStatus,
  entry: ConformanceTupleRegistryEntry | null,
): PlaybookPackageSupportStatus {
  if (status === "validated" && derivePackageSupportStatusCeilingFromRegistry(entry) !== "validated") {
    return "provisional";
  }
  return status;
}

/**
 * The first-party descriptor placement tuples — the exact claims the W18 R5
 * through W18 R8 lineages carry as provisional — rebuilt from the descriptors
 * so the promotion wiring can be checked against the packaging source of
 * truth rather than a hand-copied list.
 */
export function listFirstPartyDescriptorPlacementTuples(): ConformanceSupportTuple[] {
  const tuples: ConformanceSupportTuple[] = [];
  for (const descriptor of FIRST_PARTY_HARNESS_CAPABILITY_DESCRIPTORS) {
    for (const container of descriptor.containers) {
      const outputKind = outputKindForProfile(container.profile);
      for (const placement of container.layout.placements) {
        tuples.push({
          scenario: null,
          harness: descriptor.harnessId,
          surface: placement.surface,
          scope: placement.scope,
          outputKind,
          generatedOutputKind:
            placement.scope === "export-only"
              ? "export-only-file"
              : outputKind === "plugin"
                ? "generated-plugin"
                : "generated-skills-bundle",
          modelOrProvider: null,
          runtime: null,
        });
      }
    }
  }
  return tuples;
}

/**
 * Asserts the t4/t5 wiring between the packaging lineage and the registry:
 * every first-party descriptor placement claim has exactly one registry tuple
 * (its promotion path), every registry tuple anchors back to a descriptor
 * placement (no parallel support surface, R-REG-1), no tuple below
 * `conformance-validated` permits a ceiling above `provisional` — so an
 * adapter status advances beyond provisional only through tuple evidence
 * (PRD 36 R-ADAPT-1, R-PROV-3) — and a tuple with no authored scenario and no
 * evidence states its absence in notes rather than implying coverage
 * (R-SCEN-2). Returns human-readable errors; empty means the wiring holds.
 */
export function listPackagingSupportRegistryAgreementErrors(input: {
  registry: RegistryTuples;
}): string[] {
  const errors: string[] = [];
  const entriesByKey = new Map(
    input.registry.tuples.map((entry) => [conformanceTupleKey(entry.tuple), entry]),
  );
  const placementKeys = new Set<string>();
  for (const tuple of listFirstPartyDescriptorPlacementTuples()) {
    const key = conformanceTupleKey(tuple);
    placementKeys.add(key);
    if (!entriesByKey.has(key)) {
      errors.push(
        `first-party placement tuple \`${key}\` has no registry entry; a provisional claim without ` +
          "a registry tuple has no promotion path (R-GOV-1, R-REG-3)",
      );
    }
  }
  for (const entry of input.registry.tuples) {
    const boundKey = conformanceTupleKey({
      ...entry.tuple,
      scenario: null,
      modelOrProvider: null,
      runtime: null,
    });
    if (!placementKeys.has(boundKey)) {
      errors.push(
        `registry entry \`${entry.id}\` anchors to no first-party descriptor placement; support ` +
          "surfaces stay in one registry, never in parallel (R-REG-1)",
      );
    }
    const ceiling = derivePackageSupportStatusCeilingFromRegistry(entry);
    if (entry.status !== "conformance-validated" && ceiling !== "provisional") {
      errors.push(
        `registry entry \`${entry.id}\` at \`${entry.status}\` permits ceiling \`${ceiling}\`; ` +
          "a status advances beyond provisional only through tuple evidence (R-GOV-1, PRD 36 R-ADAPT-1/R-PROV-3)",
      );
    }
    if (
      capSupportStatusForConformanceRegistry("validated", entry) === "validated" &&
      entry.status !== "conformance-validated"
    ) {
      errors.push(
        `registry entry \`${entry.id}\` lets a validated claim through without conformance evidence (R-GOV-1)`,
      );
    }
    if (
      entry.plannedScenarios.length === 0 &&
      entry.evidence.length === 0 &&
      entry.recordedRuns.length === 0 &&
      entry.notes.length === 0
    ) {
      errors.push(
        `registry entry \`${entry.id}\` has no scenario, evidence, run, or note; absence must be ` +
          "reported, never implied as covered (R-SCEN-2)",
      );
    }
  }
  return errors;
}

/* --------------------------------------------------------------------------
 * Claim surfaces: the wording rule encoded where support language lives
 * (t1, t4, t6; R-GOV-1).
 * ------------------------------------------------------------------------ */

export interface ConformanceClaimSurface {
  /** Repo-relative path of a doc that carries public support language. */
  relativePath: string;
  label: string;
}

/**
 * The declared public claim surfaces: every reader-facing doc where support
 * language for generated Playbook distributables appears. Each must carry the
 * wording-rule core phrase, a reference to the tuple registry home (the t6
 * traceability entry point: surface -> registry -> tuple -> recorded run ->
 * committed result record), and a current `support-claim-state` marker.
 * Adding support language to a new doc requires declaring it here — the
 * vocabulary sweep below fails otherwise.
 */
export const CONFORMANCE_CLAIM_SURFACES: readonly ConformanceClaimSurface[] = [
  {
    relativePath: "conformance/README.md",
    label: "conformance assets README",
  },
  {
    relativePath: "docs/assets/library/user/playbooks-packaging-shareable-agent-workflows.md",
    label: "user packaging guide",
  },
  {
    relativePath:
      "docs/assets/library/developer/playbooks-development-packaging-and-harness-adapters.md",
    label: "developer packaging guide",
  },
  {
    relativePath:
      "docs/assets/library/developer/conformance-lab-scenario-and-result-contracts.md",
    label: "developer conformance-lab guide",
  },
] as const;

/**
 * Reader-facing roots swept for support-status vocabulary appearing outside a
 * declared claim surface. Design, plan, PRD, work, and artifact docs are the
 * lineage's own authority chain — they define the vocabulary — and are
 * deliberately not swept.
 */
export const CONFORMANCE_CLAIM_SURFACE_SWEEP_ROOTS = [
  "docs/assets/library",
  "conformance",
  "README.md",
  "packages/cli/README.md",
] as const;

/** The status vocabulary whose presence makes a reader-facing doc a claim surface. */
export const CONFORMANCE_CLAIM_VOCABULARY_MARKER = "conformance-validated";

const SUPPORT_CLAIM_STATE_MARKER_PATTERN =
  /<!--\s*support-claim-state:\s*conformance-validated=(\d+)\/(\d+)\s*-->/g;

/**
 * Renders the `support-claim-state` marker each claim surface must carry: the
 * count of `conformance-validated` tuples over the total. When a tuple
 * advances, every surface's marker goes stale and the governance check fails
 * until the surface's wording is reviewed and re-marked — wording advancement
 * is therefore mechanical, bound to the exact tuple advancing (t4).
 */
export function renderSupportClaimStateMarker(registry: RegistryTuples): string {
  const validated = registry.tuples.filter(
    (entry) => entry.status === "conformance-validated",
  ).length;
  return `<!-- support-claim-state: conformance-validated=${validated}/${registry.tuples.length} -->`;
}

function walkMarkdownFiles(root: string): string[] {
  const files: string[] = [];
  const pending: string[] = [root];
  while (pending.length > 0) {
    const current = pending.pop()!;
    for (const dirent of readdirSync(current, { withFileTypes: true })) {
      if (dirent.name === "node_modules" || dirent.name === ".git") {
        continue;
      }
      const absolute = path.join(current, dirent.name);
      if (dirent.isDirectory()) {
        pending.push(absolute);
      } else if (dirent.name.endsWith(".md")) {
        files.push(absolute);
      }
    }
  }
  return files.sort();
}

/**
 * The t1/t2/t3/t6 governance check, run in the standard repository suite over
 * the committed registry and docs (following the Phase 3 meta-verification
 * pattern). It asserts:
 *
 * - every declared claim surface exists, carries the R-GOV-1 wording-rule
 *   core phrase, references the tuple registry home (the traceability entry
 *   point), and carries a `support-claim-state` marker matching the
 *   registry's actual conformance-validated count (t1, t4, t6);
 * - no reader-facing doc under the sweep roots uses the support-status
 *   vocabulary without being a declared claim surface (t1);
 * - every committed result record honors the claim-use gates: a
 *   `stronger-claim-candidate` must be maintainer-reviewed, any claim use
 *   above `none` requires a qualifying verdict, and a caveated record put to
 *   claim use must surface its caveats (t2, t3);
 * - every conformance-validated entry's derived claim embeds each caveat its
 *   reviewed qualifying runs carry (t2).
 *
 * Empty means governance holds. Nothing here is a support claim: a green
 * governance run proves the WORDING machinery is honest, not that any harness
 * recognizes any output (R-KEEP-1, R-LAYER-2).
 */
export function listSupportClaimGovernanceErrors(input: {
  registry: RegistryTuples;
  repoRoot: string;
}): string[] {
  const errors: string[] = [];
  const expectedMarker = renderSupportClaimStateMarker(input.registry);
  const declaredPaths = new Set(
    CONFORMANCE_CLAIM_SURFACES.map((surface) => surface.relativePath),
  );
  for (const surface of CONFORMANCE_CLAIM_SURFACES) {
    const absolute = path.join(input.repoRoot, surface.relativePath);
    if (!existsSync(absolute)) {
      errors.push(
        `${surface.label} not found at \`${surface.relativePath}\`; a declared claim surface must exist (R-GOV-1)`,
      );
      continue;
    }
    const content = readFileSync(absolute, "utf8");
    if (!content.includes(SUPPORT_CLAIM_WORDING_RULE_CORE)) {
      errors.push(
        `${surface.label} does not carry the R-GOV-1 wording-rule core ` +
          `("${SUPPORT_CLAIM_WORDING_RULE_CORE}"); the rule is encoded wherever support language appears (t1)`,
      );
    }
    if (!content.includes("tuple-registry.json") && !content.includes("conformance/README.md")) {
      errors.push(
        `${surface.label} does not reference the tuple registry home; a public claim must be ` +
          "traceable to its tuple, status, and recorded run (t6, R-REG-1)",
      );
    }
    const markers = [...content.matchAll(SUPPORT_CLAIM_STATE_MARKER_PATTERN)];
    if (markers.length === 0) {
      errors.push(
        `${surface.label} carries no support-claim-state marker; expected \`${expectedMarker}\` (t4)`,
      );
      continue;
    }
    for (const marker of markers) {
      if (marker[0].replace(/\s+/g, " ") !== expectedMarker) {
        errors.push(
          `${surface.label} carries stale support-claim-state marker \`${marker[0]}\`; the registry ` +
            `now derives \`${expectedMarker}\` — review this surface's wording and update the marker ` +
            "in the same change (t4, R-GOV-1)",
        );
      }
    }
  }
  for (const root of CONFORMANCE_CLAIM_SURFACE_SWEEP_ROOTS) {
    const absolute = path.join(input.repoRoot, root);
    if (!existsSync(absolute)) {
      continue;
    }
    const candidates = absolute.endsWith(".md") ? [absolute] : walkMarkdownFiles(absolute);
    for (const candidate of candidates) {
      const relative = path.relative(input.repoRoot, candidate).split(path.sep).join("/");
      if (declaredPaths.has(relative)) {
        continue;
      }
      if (readFileSync(candidate, "utf8").includes(CONFORMANCE_CLAIM_VOCABULARY_MARKER)) {
        errors.push(
          `\`${relative}\` uses the support-status vocabulary but is not a declared claim surface; ` +
            "declare it in CONFORMANCE_CLAIM_SURFACES so the wording rule is encoded there too (t1, R-GOV-1)",
        );
      }
    }
  }
  errors.push(...listCommittedResultRecordClaimUseErrors(input));
  for (const entry of input.registry.tuples) {
    if (entry.status !== "conformance-validated") {
      continue;
    }
    const claim = renderConformanceSupportClaim(entry, { repoRoot: input.repoRoot });
    for (const caveat of claim.caveats) {
      if (!claim.wording.includes(caveat)) {
        errors.push(
          `registry entry \`${entry.id}\` derives a claim that omits caveat "${caveat}"; a ` +
            "pass-with-caveats result surfaces its caveats in any claim derived from it (t2, R-GOV-1)",
        );
      }
    }
  }
  return errors;
}

/**
 * Repo-relative home of the committed compact result records (home revised
 * by PRD 43; result-record contract owned by PRD 44): evidence organizes by
 * execution target at `conformance/results/<harness>/`, with the
 * model-or-provider and runtime dimensions inside each record. No
 * speculative directory is pre-created — the first `<harness>/` directory
 * appears with the first committed record.
 */
export const CONFORMANCE_RESULT_RECORDS_DIR = "conformance/results";

/**
 * Derives the committed home of one compact result record (PRD 43 R-ORG-2;
 * W18 R13 P1 t7): `conformance/results/<harness>/<YYYY-MM-DD>-<outcome-slug>-<seq>.json`.
 * The ingest step (Phase 3) writes records here; the tuple registry remains
 * the single queryable index across all targets — this layout is storage,
 * not a second query surface. Implementer decision: the sequence number is
 * zero-padded to three digits so records sort stably within a day.
 */
export function conformanceResultRecordRelativePath(input: {
  harness: string;
  runDate: string;
  scenarioId: string;
  sequence: number;
}): string {
  if (!Number.isInteger(input.sequence) || input.sequence < 1) {
    throw new OperationError(
      `Result record sequence must be a positive integer, got ${String(input.sequence)}.`,
    );
  }
  const { outcome } = splitConformanceScenarioId(input.scenarioId);
  const sequence = String(input.sequence).padStart(3, "0");
  return `${CONFORMANCE_RESULT_RECORDS_DIR}/${input.harness}/${input.runDate}-${outcome}-${sequence}.json`;
}

/** Recursively lists every `.json` under a root, as root-relative posix paths. */
function listResultRecordFiles(root: string): string[] {
  const files: string[] = [];
  const pending: string[] = [""];
  while (pending.length > 0) {
    const current = pending.pop()!;
    for (const dirent of readdirSync(path.join(root, current), { withFileTypes: true })) {
      const relative = current === "" ? dirent.name : `${current}/${dirent.name}`;
      if (dirent.isDirectory()) {
        pending.push(relative);
      } else if (dirent.name.endsWith(".json")) {
        files.push(relative);
      }
    }
  }
  return files.sort();
}

/**
 * The claim-use gates over every committed result record (t2, t3; R-GOV-2):
 * `stronger-claim-candidate` requires maintainer review, any claim use above
 * `none` requires a qualifying verdict, and a caveated record put to claim
 * use must surface its caveats. The directory may be absent — no run has been
 * recorded — which is honest absence, not an error. The walk recurses so the
 * PRD 43 R-ORG-2 `results/<harness>/` layout is fully covered — a committed
 * record can never sit outside these gates by nesting.
 */
export function listCommittedResultRecordClaimUseErrors(input: {
  repoRoot: string;
}): string[] {
  const errors: string[] = [];
  const resultsDir = path.join(input.repoRoot, CONFORMANCE_RESULT_RECORDS_DIR);
  if (!existsSync(resultsDir)) {
    return errors;
  }
  for (const name of listResultRecordFiles(resultsDir)) {
    const relative = `${CONFORMANCE_RESULT_RECORDS_DIR}/${name}`;
    let record: PackagingConformanceResultRecord;
    try {
      record = validatePackagingConformanceResultRecord(
        JSON.parse(readFileSync(path.join(resultsDir, name), "utf8")) as unknown,
      );
    } catch (error) {
      errors.push(`committed result record \`${relative}\` does not validate: ${String(error)}`);
      continue;
    }
    if (record.supportClaimUse === "none") {
      continue;
    }
    if (record.verdict !== "pass" && record.verdict !== "pass-with-caveats") {
      errors.push(
        `committed result record \`${relative}\` puts verdict \`${record.verdict}\` to claim use ` +
          `\`${record.supportClaimUse}\`; only pass and caveat-surfaced pass-with-caveats support claims (R-REG-3)`,
      );
    }
    if (record.verdict === "pass-with-caveats" && (!record.caveatsSurfaced || record.caveats.length === 0)) {
      errors.push(
        `committed result record \`${relative}\` puts an unsurfaced pass-with-caveats to claim use; ` +
          "caveats must be surfaced in any claim derived from it (t2, R-GOV-1)",
      );
    }
    if (
      record.supportClaimUse === "stronger-claim-candidate" &&
      record.reviewerStatus !== "reviewed"
    ) {
      errors.push(
        `committed result record \`${relative}\` is a stronger-claim-candidate but reviewerStatus is ` +
          `\`${record.reviewerStatus}\`; the stronger threshold is repeated runs WITH maintainer review (t3, R-GOV-2)`,
      );
    }
  }
  return errors;
}
