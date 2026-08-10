/**
 * The W18 R9 conformance tuple registry (PRD 20 R-REG-1..3; W18 R9 P1
 * t3-t6).
 *
 * The set of support tuples and their statuses lives in ONE queryable data
 * file — `conformance/tuple-registry.json` at the repo root — not in prose, so
 * support status cannot drift from documentation (R-REG-1). This module owns
 * the file's schema, the three statuses and their meanings (R-REG-2), the
 * verdict-derivation rules for status transitions (R-REG-3), and the
 * fail-closed loader every consumer (later-phase scenarios, meta-verification
 * checks, claim governance) queries through.
 *
 * Ownership boundaries (R-SCOPE-1, R-KEEP-1):
 * - The verdict vocabulary — `pass`, `pass-with-caveats`, `inconsistent`,
 *   `unsupported`, `blocked` — is the lab's (PRD 20) and is consumed here
 *   unchanged; a scenario that cannot run for a missing precondition reports
 *   `blocked` rather than inventing evidence.
 * - The registry data file is maintainer-only in-repo project content under
 *   the repo-root `conformance/` directory (relocated from
 *   `docs/assets/conformance/` per PRD 43), deliberately NOT authored
 *   upstream in `packages/docs/template/` — a stated exception to the
 *   upstream-first rule, because conformance is maintainer evidence
 *   infrastructure, not shipped product. It must stay out of the shipped
 *   template, the packaged copy, and npm tarballs (enforced outward by the
 *   Phase 3 R-TEST-3 exclusion check).
 *
 * Implementer decisions recorded here (D8 freedoms):
 * - Registry file format: a single versioned JSON document. JSON keeps the
 *   registry queryable by any tool without a parser dependency, and one file
 *   keeps tuple identity enforceable (unique keys) in one place. The file
 *   redundantly EMBEDS the status meanings and verdict-derivation rules as
 *   data, and {@link validateConformanceTupleRegistry} fails closed when the
 *   embedded copies drift from the canonical constants in this module — so
 *   neither the code nor the file can quietly diverge.
 * - Statuses are stored AND derived: every entry records its status, and
 *   validation recomputes {@link deriveConformanceTupleStatus} from the
 *   entry's evidence, failing closed on any mismatch. That makes the
 *   Phase 3 R-TEST-1 assertion (`conformance-validated` requires a
 *   qualifying recorded run) structural from day one.
 * - Recorded runs carry a compact projection of the lab result contract
 *   (scenario, verdict, caveats, run date, record ref, model/provider,
 *   runtime) plus the explicit D4 evidence-bar stage results; the full
 *   result records land beside the registry with the Phase 2 scenarios.
 * - Real-harness observations that do NOT meet the bar (like the negative
 *   Codex recognition probe of 2026-07-03 recorded on register item R-021)
 *   are carried as `real-harness-probe` evidence refs: they inform and warn,
 *   but they never advance a status — only internal-test refs support
 *   `implementation-validated` and only qualifying recorded runs support
 *   `conformance-validated`.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  GENERATED_OUTPUT_RECORD_KINDS,
  PLAYBOOK_PACKAGE_OUTPUT_KINDS,
  PLAYBOOK_PACKAGE_SCOPES,
} from "../operations/playbook-packaging/types";
import { OperationError } from "../operations/types";
import {
  conformanceTupleKey,
  isConformanceTupleBound,
  type ConformanceSupportTuple,
  type ConformanceTupleSurface,
} from "./tuple";

/** The lab's verdict vocabulary (PRD 20, R-KEEP-1): consumed, never redefined. */
export const CONFORMANCE_RUN_VERDICTS = [
  "pass",
  "pass-with-caveats",
  "inconsistent",
  "unsupported",
  "blocked",
] as const;
export type ConformanceRunVerdict = (typeof CONFORMANCE_RUN_VERDICTS)[number];

/** Verdicts that never advance a tuple to `conformance-validated` (R-REG-3). */
export const CONFORMANCE_NON_ADVANCING_VERDICTS = [
  "inconsistent",
  "unsupported",
  "blocked",
] as const satisfies readonly ConformanceRunVerdict[];

/** The three tuple statuses (R-REG-2): each tuple carries exactly one. */
export const CONFORMANCE_TUPLE_STATUSES = [
  "provisional",
  "implementation-validated",
  "conformance-validated",
] as const;
export type ConformanceTupleStatus = (typeof CONFORMANCE_TUPLE_STATUSES)[number];

/**
 * The R-REG-2 status meanings, embedded verbatim in the registry file so the
 * data file is self-describing; validation rejects a file whose embedded
 * meanings drift from these.
 */
export const CONFORMANCE_TUPLE_STATUS_MEANINGS: Record<ConformanceTupleStatus, string> = {
  provisional:
    "No conformance evidence yet; the output may be generated but its recognition and usability are unverified.",
  "implementation-validated":
    "Internal unit and integration tests prove the generated files and structure, but no real-harness evidence exists.",
  "conformance-validated":
    "A real-harness scenario has met the install-discover-invoke-uninstall evidence bar (R-BAR-1).",
};

/** The D4 evidence-bar stages, in bar order (R-BAR-1): install, discover, invoke, uninstall. */
export const CONFORMANCE_EVIDENCE_BAR_STAGES = [
  "install",
  "discover",
  "invoke",
  "uninstall",
] as const;
export type ConformanceEvidenceBarStage = (typeof CONFORMANCE_EVIDENCE_BAR_STAGES)[number];

/**
 * The verdict-derivation rules (R-REG-3, R-BAR-2) as data, embedded verbatim
 * in the registry file. `conformance-validated` requires a `pass`, or a
 * `pass-with-caveats` whose caveats are surfaced, from a run meeting every
 * evidence-bar stage; `inconsistent`, `unsupported`, and `blocked` never
 * advance a tuple; `implementation-validated` requires only internal file
 * and structure tests and no harness, and a tuple never skips from
 * `provisional` to `conformance-validated` without meeting the bar.
 */
export const CONFORMANCE_VERDICT_DERIVATION_RULES = {
  advancesToConformanceValidated: {
    verdicts: ["pass", "pass-with-caveats"] as const,
    passWithCaveatsRequiresSurfacedCaveats: true,
    requiredEvidenceBarStages: CONFORMANCE_EVIDENCE_BAR_STAGES,
  },
  neverAdvances: CONFORMANCE_NON_ADVANCING_VERDICTS,
  implementationValidatedRequires:
    "internal-test evidence refs only; internal tests are never harness-recognition evidence (R-BAR-2, R-LAYER-2)",
  realHarnessProbesNeverAdvance:
    "real-harness-probe evidence refs record observations outside the lab protocol; they never advance a status in either direction",
  faithfulSimulation:
    "R-BAR-1 admits a faithfully simulated harness: every recorded run states `simulated`, a simulated run may advance a tuple only when its scenario spec declares reviewed faithful-simulation mechanics (D8), and its result record names the mechanics used",
} as const;

/**
 * A compact recorded conformance run: the projection of the lab result
 * contract (PRD 20) the registry needs to derive a status, plus the explicit
 * D4 evidence-bar stage results. `recordRef` points at the compact
 * normalized result record committed beside the registry (the lab's
 * source-control evidence class); raw transcripts stay in the disposable
 * lab-session workspace or the machine-level store's lab area, never
 * repo-local (PRD 44 R-NAME-2; register item D-024).
 */
export interface ConformanceRecordedRun {
  runId: string;
  /** Lab scenario id; run metadata that binds the tuple's `scenario` dimension. */
  scenario: string;
  runDate: string;
  verdict: ConformanceRunVerdict;
  caveats: string[];
  /** `pass-with-caveats` advances a tuple only when its caveats are surfaced (R-REG-3). */
  caveatsSurfaced: boolean;
  /** Which D4 bar stages the run asserted; all four are required to advance (R-BAR-1). */
  evidenceBar: Record<ConformanceEvidenceBarStage, boolean>;
  /** Repo-relative path of the compact normalized result record. */
  recordRef: string;
  modelOrProvider: string;
  runtime: string;
  /**
   * True when the run executed against a faithfully simulated harness rather
   * than the real one (R-BAR-1 admits both; W18 R9 P2 t3). A simulated run
   * may qualify only when its scenario spec declares reviewed
   * faithful-simulation mechanics per D8 — enforced by the recording seam in
   * `scenario.ts` — and its result record names the mechanics used.
   */
  simulated: boolean;
}

export const CONFORMANCE_EVIDENCE_REF_KINDS = ["internal-test", "real-harness-probe"] as const;
export type ConformanceEvidenceRefKind = (typeof CONFORMANCE_EVIDENCE_REF_KINDS)[number];

/**
 * A non-run evidence link. `internal-test` refs are the only support for
 * `implementation-validated` and MUST name the repository test file that
 * proves the generated files and structure; `real-harness-probe` refs record
 * out-of-protocol real-harness observations (positive or negative) and never
 * move a status.
 */
export interface ConformanceTupleEvidenceRef {
  kind: ConformanceEvidenceRefKind;
  /** Repo-relative path (or register anchor) where the evidence lives. */
  ref: string;
  note: string;
}

export interface ConformanceTupleRegistryEntry {
  /** Human-oriented unique slug; tuple identity itself is the canonical key. */
  id: string;
  tuple: ConformanceSupportTuple;
  status: ConformanceTupleStatus;
  evidence: ConformanceTupleEvidenceRef[];
  recordedRuns: ConformanceRecordedRun[];
  /**
   * Domain-qualified ids of authored scenario definitions under
   * `conformance/scenarios/<domain>/` whose target binding for this entry's
   * harness targets this tuple (W18 R9 P2 t9; ids revised by PRD 43
   * R-SCHEMA-3). Forward-looking linkage only: a
   * planned scenario is not evidence, never affects status derivation, and
   * never binds the tuple's `scenario` dimension — only a recorded run does
   * (R-TUPLE-1). An explicitly empty list is itself a statement: no authored
   * scenario targets this tuple yet, so its absence is reported rather than
   * implied as covered (R-SCEN-2).
   */
  plannedScenarios: string[];
  notes: string[];
}

export const CONFORMANCE_TUPLE_REGISTRY_RECORD = "make-docs.conformance.tuple-registry";

export interface ConformanceTupleRegistry {
  record: typeof CONFORMANCE_TUPLE_REGISTRY_RECORD;
  schemaVersion: 1;
  statuses: Record<ConformanceTupleStatus, string>;
  verdictDerivation: typeof CONFORMANCE_VERDICT_DERIVATION_RULES;
  tuples: ConformanceTupleRegistryEntry[];
}

/** Repo-relative registry home (PRD 20 R-REG-1; PRD 43 R-HOME-1). */
export const CONFORMANCE_TUPLE_REGISTRY_PATH = "conformance/tuple-registry.json";

/** A run meets the D4 bar only when every stage was asserted (R-BAR-1). */
export function runMeetsEvidenceBar(run: ConformanceRecordedRun): boolean {
  return CONFORMANCE_EVIDENCE_BAR_STAGES.every((stage) => run.evidenceBar[stage] === true);
}

/**
 * The R-REG-3 derivation rule for a single run: a tuple MAY advance to
 * `conformance-validated` only on a `pass`, or a `pass-with-caveats` whose
 * caveats are surfaced, that meets the D4 bar. `inconsistent`,
 * `unsupported`, and `blocked` never qualify — a blocked scenario is honest
 * absence of evidence, not evidence.
 */
export function runQualifiesForConformanceValidation(run: ConformanceRecordedRun): boolean {
  if (!runMeetsEvidenceBar(run)) {
    return false;
  }
  if (run.verdict === "pass") {
    return true;
  }
  if (run.verdict === "pass-with-caveats") {
    return run.caveatsSurfaced && run.caveats.length > 0;
  }
  return false;
}

/**
 * Derives an entry's status from its evidence (R-REG-2, R-REG-3, R-BAR-2):
 * `conformance-validated` on any qualifying recorded run, otherwise
 * `implementation-validated` when internal-test refs exist, otherwise
 * `provisional`. `real-harness-probe` refs are deliberately ignored in both
 * directions, and non-qualifying runs (including `blocked`) never advance —
 * or demote — a tuple; they stay recorded as honest history.
 */
export function deriveConformanceTupleStatus(
  entry: Pick<ConformanceTupleRegistryEntry, "evidence" | "recordedRuns">,
): ConformanceTupleStatus {
  if (entry.recordedRuns.some(runQualifiesForConformanceValidation)) {
    return "conformance-validated";
  }
  if (entry.evidence.some((evidenceRef) => evidenceRef.kind === "internal-test")) {
    return "implementation-validated";
  }
  return "provisional";
}

const CONFORMANCE_TUPLE_SURFACES = ["native", "agents-standard"] as const;

const tupleSchema = z.object({
  scenario: z.string().min(1).nullable(),
  harness: z.string().min(1),
  // Never `auto`: a registry tuple is exact, and `auto` would be a claim
  // broader than its evidence (R-TUPLE-1).
  surface: z.enum(CONFORMANCE_TUPLE_SURFACES),
  scope: z.enum(PLAYBOOK_PACKAGE_SCOPES),
  outputKind: z.enum(PLAYBOOK_PACKAGE_OUTPUT_KINDS),
  generatedOutputKind: z.enum(GENERATED_OUTPUT_RECORD_KINDS),
  modelOrProvider: z.string().min(1).nullable(),
  runtime: z.string().min(1).nullable(),
});

const recordedRunSchema = z.object({
  runId: z.string().min(1),
  scenario: z.string().min(1),
  runDate: z.string().min(1),
  verdict: z.enum(CONFORMANCE_RUN_VERDICTS),
  caveats: z.array(z.string().min(1)),
  caveatsSurfaced: z.boolean(),
  evidenceBar: z.object({
    install: z.boolean(),
    discover: z.boolean(),
    invoke: z.boolean(),
    uninstall: z.boolean(),
  }),
  recordRef: z.string().min(1),
  modelOrProvider: z.string().min(1),
  runtime: z.string().min(1),
  simulated: z.boolean(),
});

const evidenceRefSchema = z.object({
  kind: z.enum(CONFORMANCE_EVIDENCE_REF_KINDS),
  ref: z.string().min(1),
  note: z.string().min(1),
});

const registryEntrySchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]*$/, "entry ids are lowercase hyphenated slugs"),
  tuple: tupleSchema,
  status: z.enum(CONFORMANCE_TUPLE_STATUSES),
  evidence: z.array(evidenceRefSchema),
  recordedRuns: z.array(recordedRunSchema),
  plannedScenarios: z.array(
    z
      .string()
      .regex(
        /^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*$/,
        "planned scenario ids are domain-qualified (`<domain>/<outcome>`) lowercase hyphenated slugs (PRD 43 R-SCHEMA-3)",
      ),
  ),
  notes: z.array(z.string().min(1)),
});

const registrySchema = z.object({
  record: z.literal(CONFORMANCE_TUPLE_REGISTRY_RECORD),
  schemaVersion: z.literal(1),
  statuses: z.record(z.string(), z.string()),
  verdictDerivation: z.unknown(),
  tuples: z.array(registryEntrySchema),
});

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

/**
 * Validates a parsed registry document and fails closed on every invariant
 * the contract fixes: exactly one valid status per tuple with unique tuple
 * identity (R-REG-2), the recorded status equal to the evidence-derived
 * status — so no tuple can claim `conformance-validated` without a
 * qualifying recorded run, and no non-qualifying verdict can have advanced
 * one (R-REG-3, R-BAR-2, pre-figuring the Phase 3 R-TEST-1 check) — and the
 * embedded status meanings and derivation rules byte-equal to the canonical
 * constants so file and code cannot drift (R-REG-1).
 */
export function validateConformanceTupleRegistry(document: unknown): ConformanceTupleRegistry {
  const parsed = registrySchema.safeParse(document);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(document)"}: ${issue.message}`)
      .join("; ");
    throw new OperationError(`Conformance tuple registry is invalid: ${issues}`);
  }
  const registry = parsed.data as ConformanceTupleRegistry;
  if (stableJson(registry.statuses) !== stableJson(CONFORMANCE_TUPLE_STATUS_MEANINGS)) {
    throw new OperationError(
      "Conformance tuple registry status meanings drifted from the canonical R-REG-2 meanings; " +
        "update conformance/tuple-registry.json and CONFORMANCE_TUPLE_STATUS_MEANINGS together in review.",
    );
  }
  if (stableJson(registry.verdictDerivation) !== stableJson(CONFORMANCE_VERDICT_DERIVATION_RULES)) {
    throw new OperationError(
      "Conformance tuple registry verdict-derivation rules drifted from the canonical R-REG-3 rules; " +
        "update conformance/tuple-registry.json and CONFORMANCE_VERDICT_DERIVATION_RULES together in review.",
    );
  }
  const seenIds = new Set<string>();
  const seenTupleKeys = new Set<string>();
  for (const entry of registry.tuples) {
    const label = `conformance tuple registry entry \`${entry.id}\``;
    if (seenIds.has(entry.id)) {
      throw new OperationError(`Duplicate ${label}.`);
    }
    seenIds.add(entry.id);
    const key = conformanceTupleKey(entry.tuple);
    if (seenTupleKeys.has(key)) {
      throw new OperationError(
        `${label} duplicates the exact tuple \`${key}\`; the registry carries one entry per tuple (R-REG-2).`,
      );
    }
    seenTupleKeys.add(key);
    const derived = deriveConformanceTupleStatus(entry);
    if (entry.status !== derived) {
      throw new OperationError(
        `${label} records status \`${entry.status}\` but its evidence derives \`${derived}\`; ` +
          "statuses are derived from recorded evidence and cannot be asserted (R-REG-2, R-REG-3).",
      );
    }
    if (entry.status === "conformance-validated" && !isConformanceTupleBound(entry.tuple)) {
      throw new OperationError(
        `${label} is conformance-validated with unbound tuple dimensions; the evidence-owned ` +
          "dimensions bind from the qualifying run's metadata (R-TUPLE-1).",
      );
    }
    for (const run of entry.recordedRuns) {
      if (
        runQualifiesForConformanceValidation(run) &&
        entry.tuple.scenario !== null &&
        entry.tuple.scenario !== run.scenario
      ) {
        throw new OperationError(
          `${label} binds scenario \`${entry.tuple.scenario}\` but its qualifying run recorded ` +
            `\`${run.scenario}\`; a claim may not be broader than the evidence for its exact tuple (R-TUPLE-1).`,
        );
      }
    }
    if (new Set(entry.plannedScenarios).size !== entry.plannedScenarios.length) {
      throw new OperationError(
        `${label} lists a planned scenario more than once; the linkage is one id per scenario spec.`,
      );
    }
    for (const evidenceRef of entry.evidence) {
      if (evidenceRef.kind === "internal-test" && !/\.test\.ts$/.test(evidenceRef.ref)) {
        throw new OperationError(
          `${label} cites internal-test evidence \`${evidenceRef.ref}\` that is not a repository test file; ` +
            "implementation-validated rests only on internal file and structure tests (R-BAR-2).",
        );
      }
    }
  }
  return registry;
}

/**
 * Loads and validates the tuple registry from the maintainer repo. Fails
 * closed — a missing or invalid registry is an error, never an empty
 * registry, so no consumer can mistake absence for zero claims.
 */
export function loadConformanceTupleRegistry(
  input: { repoRoot?: string; registryPath?: string } = {},
): ConformanceTupleRegistry {
  const registryPath =
    input.registryPath ??
    path.join(input.repoRoot ?? path.resolve("."), CONFORMANCE_TUPLE_REGISTRY_PATH);
  if (!existsSync(registryPath)) {
    throw new OperationError(
      `Conformance tuple registry not found at \`${registryPath}\`; the registry is maintainer-only ` +
        `in-repo content at ${CONFORMANCE_TUPLE_REGISTRY_PATH} (R-REG-1).`,
    );
  }
  let document: unknown;
  try {
    document = JSON.parse(readFileSync(registryPath, "utf8")) as unknown;
  } catch (error) {
    throw new OperationError(
      `Conformance tuple registry at \`${registryPath}\` is not valid JSON: ${String(error)}`,
    );
  }
  return validateConformanceTupleRegistry(document);
}

/** Exact-match filter over the queryable dimensions plus status. */
export interface ConformanceTupleQuery {
  scenario?: string | null;
  harness?: string;
  surface?: ConformanceTupleSurface;
  scope?: ConformanceSupportTuple["scope"];
  outputKind?: ConformanceSupportTuple["outputKind"];
  generatedOutputKind?: ConformanceSupportTuple["generatedOutputKind"];
  modelOrProvider?: string | null;
  runtime?: string | null;
  status?: ConformanceTupleStatus;
}

/**
 * Queries registry entries by exact dimension/status match (R-REG-1's
 * queryability, code-side). Omitted fields match anything; `null` matches
 * only unbound dimensions.
 */
export function queryConformanceTuples(
  registry: ConformanceTupleRegistry,
  query: ConformanceTupleQuery = {},
): ConformanceTupleRegistryEntry[] {
  return registry.tuples.filter((entry) => {
    if (query.status !== undefined && entry.status !== query.status) {
      return false;
    }
    const dimensions = [
      "scenario",
      "harness",
      "surface",
      "scope",
      "outputKind",
      "generatedOutputKind",
      "modelOrProvider",
      "runtime",
    ] as const;
    return dimensions.every(
      (dimension) => query[dimension] === undefined || entry.tuple[dimension] === query[dimension],
    );
  });
}

/** Resolves the single entry for an exact tuple, or null when unregistered. */
export function getConformanceTupleEntry(
  registry: ConformanceTupleRegistry,
  tuple: ConformanceSupportTuple,
): ConformanceTupleRegistryEntry | null {
  const key = conformanceTupleKey(tuple);
  return registry.tuples.find((entry) => conformanceTupleKey(entry.tuple) === key) ?? null;
}
