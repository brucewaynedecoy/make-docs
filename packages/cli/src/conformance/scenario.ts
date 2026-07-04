/**
 * The W18 R9 packaging conformance scenario contract and evidence bar
 * (PRD 37 R-BAR-1..2, R-SCEN-1..2, R-KEEP-1; W18 R9 P2 t1-t9).
 *
 * The install-discover-invoke-uninstall bar is implemented here as the
 * scenario SHAPE for packaging conformance (t1): a packaging scenario spec
 * declares, per bar stage, the assertions a run must prove, and the recording
 * seam ({@link recordConformanceRunOnRegistryEntry}) binds run outcomes onto
 * the Phase 1 tuple registry (t2) — a qualifying `pass`, or
 * `pass-with-caveats` with surfaced caveats, that met every stage advances
 * the tuple to `conformance-validated`; nothing else advances anything, and
 * internal tests stay capped at `implementation-validated` by the Phase 1
 * derivation this module reuses rather than reimplements.
 *
 * Ownership boundaries (R-SCOPE-1, R-KEEP-1): the lab's scenario protocol
 * from PRD 20 is consumed unchanged. `schemaVersion` stays
 * `conformance.scenario.v1` / `conformance.result.v1`, the lab's required
 * spec and result fields keep their exact names and meanings (see
 * `docs/assets/library/developer/conformance-lab-scenario-and-result-contracts.md`),
 * scenarios stay model-agnostic with model, provider, and runtime captured as
 * run metadata, the five verdicts are reused from `registry.ts`, and a
 * scenario that cannot run for a missing precondition resolves `blocked`
 * rather than inventing evidence. Everything packaging-specific is additive,
 * carried under the spec's `packagingExtension` key so the extension boundary
 * is visible in the data itself.
 *
 * Implementer decisions recorded here (D8 freedoms):
 * - Spec format: one JSON document per scenario under
 *   `docs/assets/conformance/scenarios/<scenarioId>.json` (the lab permits
 *   YAML or JSON; JSON matches the tuple registry's no-parser-dependency
 *   choice, and the filename-equals-scenarioId rule keeps specs addressable
 *   without opening them).
 * - Faithful-simulation mechanics (t3): a spec's
 *   `packagingExtension.harnessExecution` declares `real-harness` or
 *   `faithful-simulation`; the simulation mode MUST document its reviewed
 *   mechanics in the spec, every result record states `simulated` (with a
 *   `simulationMechanicsRef` naming the mechanics used), and the recording
 *   seam refuses a run whose simulation posture disagrees with its scenario's
 *   declared mode. The four first-pass Codex scenarios all declare
 *   `real-harness`: no faithful simulation of Codex exists yet, so simulation
 *   never silently substitutes for the real harness.
 * - Precondition probes (t8): preconditions carry cheap, local, read-only
 *   probes — `command-succeeds` for harness CLI availability and
 *   authentication, `operator-attestation` for network and model routing,
 *   which cannot be probed without spending them. An unmet precondition
 *   resolves to an honest `blocked` result record
 *   ({@link blockedPackagingResultRecord}) with `supportClaimUse: "none"` and
 *   an all-false evidence bar, which never advances a tuple.
 * - Bar completeness (t1): a spec must assert every one of the four stages to
 *   be bar-eligible ({@link scenarioAssertsFullEvidenceBar}), and the
 *   recording seam refuses a run claiming a stage its scenario does not
 *   assert — so a scenario missing any assertion structurally cannot advance
 *   a tuple (R-BAR-1).
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { OperationError } from "../operations/types";
import {
  CONFORMANCE_EVIDENCE_BAR_STAGES,
  CONFORMANCE_RUN_VERDICTS,
  deriveConformanceTupleStatus,
  runQualifiesForConformanceValidation,
  type ConformanceEvidenceBarStage,
  type ConformanceRecordedRun,
  type ConformanceTupleRegistryEntry,
} from "./registry";
import { bindRunMetadataOntoConformanceTuple } from "./tuple";

/** The lab's safety modes (PRD 20, R-KEEP-1): consumed, never redefined. */
export const CONFORMANCE_SCENARIO_SAFETY_MODES = [
  "read-only",
  "dry-run",
  "temp-fixture-apply",
  "destructive-temp-fixture-apply",
  "external-provider-run",
] as const;
export type ConformanceScenarioSafetyMode =
  (typeof CONFORMANCE_SCENARIO_SAFETY_MODES)[number];

/** The lab's reviewer statuses and support-claim uses (PRD 20, R-KEEP-1). */
export const CONFORMANCE_REVIEWER_STATUSES = [
  "unreviewed",
  "reviewed",
  "needs-follow-up",
  "rejected",
] as const;
export const CONFORMANCE_SUPPORT_CLAIM_USES = [
  "none",
  "nominal-tuple",
  "stronger-claim-candidate",
] as const;

/** The lab's schema identifiers, consumed unchanged (R-KEEP-1). */
export const CONFORMANCE_SCENARIO_SCHEMA_VERSION = "conformance.scenario.v1";
export const CONFORMANCE_RESULT_SCHEMA_VERSION = "conformance.result.v1";

/** Repo-relative home of the packaging scenario specs (R-SCEN-1). */
export const CONFORMANCE_SCENARIO_SPECS_DIR = "docs/assets/conformance/scenarios";

/**
 * The four required R-SCEN-1 first-pass scenarios, Codex first, mapped to the
 * user-visible outcome each must prove. Phase 3's R-TEST-2 runnability check
 * consumes this constant; absence of any of these specs is a failure, never a
 * silent gap.
 */
export const REQUIRED_FIRST_PASS_SCENARIOS = {
  "codex-skills-bundle-discovery-invocation":
    "a generated skills bundle appears as a skill in the target harness and can be invoked",
  "codex-plugin-marketplace-install":
    "a generated plugin appears through a marketplace, installs, exposes its bundled skills, and is usable in a new thread",
  "codex-dependency-check-both-directions":
    "generated dependency checks surface missing tools and pass when the dependencies are present",
  "codex-uninstall-backup-cleanliness":
    "uninstall and backup remove managed generated outputs without orphaning empty managed directories or deleting user-authored files",
} as const;
export type RequiredFirstPassScenarioId = keyof typeof REQUIRED_FIRST_PASS_SCENARIOS;

/**
 * Precondition kinds a packaging scenario may declare (t8). Each maps onto
 * the lab's blocked-verdict causes: missing harness, missing credentials,
 * missing network, missing model routing, or a missing fixture input.
 */
export const CONFORMANCE_SCENARIO_PRECONDITION_KINDS = [
  "harness-cli",
  "harness-auth",
  "network",
  "model-routing",
  "fixture",
] as const;
export type ConformanceScenarioPreconditionKind =
  (typeof CONFORMANCE_SCENARIO_PRECONDITION_KINDS)[number];

const slugSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]*$/, "ids are lowercase hyphenated slugs");

const barStageSchema = z.enum(CONFORMANCE_EVIDENCE_BAR_STAGES);

/**
 * A scenario step: an ordered command or human/harness action per the lab's
 * step shape, optionally tagged with the bar stage it serves. A command step
 * whose transcript is consumed as evidence must pin `--json`
 * (`transcript: "evidence-json"`) or run non-TTY
 * (`transcript: "evidence-non-tty"`), so the render layer never enters
 * evidence (PRD 41 R-SEQ-2; register item R-026).
 */
const commandStepSchema = z.object({
  kind: z.literal("command"),
  run: z.string().min(1),
  transcript: z.enum(["evidence-json", "evidence-non-tty", "context"]).default("context"),
  barStage: barStageSchema.optional(),
  notes: z.string().min(1).optional(),
});
const harnessActionStepSchema = z.object({
  kind: z.literal("harness-action"),
  action: z.string().min(1),
  barStage: barStageSchema.optional(),
  notes: z.string().min(1).optional(),
});
const humanActionStepSchema = z.object({
  kind: z.literal("human-action"),
  action: z.string().min(1),
  barStage: barStageSchema.optional(),
  notes: z.string().min(1).optional(),
});
const assertionStepSchema = z.object({
  kind: z.literal("assertion"),
  assert: z.string().min(1),
  barStage: barStageSchema.optional(),
  notes: z.string().min(1).optional(),
});
const stepSchema = z.discriminatedUnion("kind", [
  commandStepSchema,
  harnessActionStepSchema,
  humanActionStepSchema,
  assertionStepSchema,
]);
export type PackagingConformanceScenarioStep = z.infer<typeof stepSchema>;

const preconditionProbeSchema = z.discriminatedUnion("check", [
  z.object({
    check: z.literal("command-succeeds"),
    command: z.string().min(1),
    args: z.array(z.string().min(1)),
  }),
  z.object({ check: z.literal("operator-attestation") }),
]);

const preconditionSchema = z.object({
  id: slugSchema,
  kind: z.enum(CONFORMANCE_SCENARIO_PRECONDITION_KINDS),
  description: z.string().min(1),
  probe: preconditionProbeSchema,
  /**
   * Always `blocked` (R-KEEP-1): the value is embedded so every spec states,
   * in its own data, that an unmet precondition is honest absence of
   * evidence, never invented evidence.
   */
  onUnmet: z.literal("blocked"),
});
export type PackagingScenarioPrecondition = z.infer<typeof preconditionSchema>;

const harnessExecutionSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("real-harness"), simulationMechanics: z.null() }),
  z.object({
    mode: z.literal("faithful-simulation"),
    /** The reviewed D8 simulation mechanics; required so simulation is never undeclared. */
    simulationMechanics: z.string().min(1),
  }),
]);

/**
 * The characterization preamble (t5; register item R-021). Before asserting
 * the bar, a scenario carrying this block first characterizes what the real
 * harness version accepts — e.g. a hand-minimal plugin independent of Make
 * Docs establishing the marketplace source shape and plugin layout Codex
 * actually recognizes — then diffs the generated shapes against that ground
 * truth. This is the recorded plan for resolving a negative recognition
 * probe: bar assertions run only after ground truth exists, so a failure
 * distinguishes "our shapes are wrong" from "the harness cannot do this".
 */
const characterizationSchema = z.object({
  purpose: z.string().min(1),
  resolvesProbe: z.object({
    registerItem: z.string().min(1),
    ref: z.string().min(1),
    summary: z.string().min(1),
  }),
  ordering: z.literal("before-bar-assertions"),
  groundTruthSteps: z.array(stepSchema).min(1),
  diffTargets: z.array(z.string().min(1)).min(1),
  recordedIn: z.string().min(1),
});
export type PackagingScenarioCharacterization = z.infer<typeof characterizationSchema>;

const evidenceBarAssertionsSchema = z.object({
  install: z.array(z.string().min(1)),
  discover: z.array(z.string().min(1)),
  invoke: z.array(z.string().min(1)),
  uninstall: z.array(z.string().min(1)),
});

const packagingExtensionSchema = z.object({
  harness: z.string().min(1),
  /** Registry entry ids (not tuple keys) this scenario's runs may land on. */
  registryTupleIds: z.array(slugSchema).min(1),
  /** Per-stage assertions; all four stages non-empty makes the spec bar-eligible (R-BAR-1). */
  evidenceBar: evidenceBarAssertionsSchema,
  preconditions: z.array(preconditionSchema).min(1),
  harnessExecution: harnessExecutionSchema,
  /** Evidence transcripts pin `--json` or run non-TTY (R-026, PRD 41 R-SEQ-2). */
  transcriptPolicy: z.literal("json-or-non-tty"),
  /** Nothing destructive against a maintainer working tree (R-KEEP-1). */
  workspacePolicy: z.literal("disposable-fixture-workspace"),
  /** Repo-relative v2-form source Playbooks the scenario packages. */
  fixturePlaybooks: z.array(z.string().min(1)).min(1),
  /** Harness variants deliberately NOT covered by this spec (R-SCEN-2). */
  futureHarnesses: z.array(
    z.object({
      harness: z.string().min(1),
      status: z.literal("future"),
      note: z.string().min(1),
    }),
  ),
  characterization: characterizationSchema.optional(),
});

const scenarioSpecSchema = z
  .object({
    schemaVersion: z.literal(CONFORMANCE_SCENARIO_SCHEMA_VERSION),
    scenarioId: slugSchema,
    scenarioVersion: z.string().min(1),
    title: z.string().min(1),
    sourceRequirements: z.array(z.string().min(1)).min(1),
    safetyMode: z.enum(CONFORMANCE_SCENARIO_SAFETY_MODES),
    requiresNetwork: z.boolean(),
    requiresCredentials: z.boolean(),
    destructive: z.boolean(),
    prerequisites: z.array(z.string().min(1)),
    steps: z.array(stepSchema).min(1),
    expectedEvidence: z.array(z.string().min(1)).min(1),
    artifactPolicy: z.enum(["local-generated", "redacted-review-bundle"]),
    supportClaimScope: z.literal("scenario-harness-model-provider-runtime"),
    packagingExtension: packagingExtensionSchema,
  })
  .superRefine((spec, context) => {
    if (spec.destructive && spec.safetyMode !== "destructive-temp-fixture-apply") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["safetyMode"],
        message:
          "a destructive scenario must use the destructive-temp-fixture-apply safety mode (PRD 20, R-KEEP-1)",
      });
    }
    const preconditionIds = new Set<string>();
    for (const precondition of spec.packagingExtension.preconditions) {
      if (preconditionIds.has(precondition.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["packagingExtension", "preconditions"],
          message: `duplicate precondition id \`${precondition.id}\``,
        });
      }
      preconditionIds.add(precondition.id);
    }
    const preconditionKinds = new Set(
      spec.packagingExtension.preconditions.map((precondition) => precondition.kind),
    );
    if (spec.requiresCredentials && !preconditionKinds.has("harness-auth")) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["packagingExtension", "preconditions"],
        message:
          "requiresCredentials is true but no harness-auth precondition resolves the missing-credentials case to blocked (R-KEEP-1)",
      });
    }
    if (spec.requiresNetwork && !preconditionKinds.has("network")) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["packagingExtension", "preconditions"],
        message:
          "requiresNetwork is true but no network precondition resolves the missing-network case to blocked (R-KEEP-1)",
      });
    }
    const allSteps: PackagingConformanceScenarioStep[] = [
      ...spec.steps,
      ...(spec.packagingExtension.characterization?.groundTruthSteps ?? []),
    ];
    for (const step of allSteps) {
      if (step.kind !== "command") {
        continue;
      }
      if (/(^|\s)--write(\s|$)/.test(step.run)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["steps"],
          message:
            "`--write` is retired; scenario scripts use the plan/preview/write/ship packaging grammar (PRD 41 R-GRAM-2, register item R-026)",
        });
      }
      if (step.transcript === "evidence-json" && !step.run.includes("--json")) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["steps"],
          message: `an evidence-json command must pin --json so rendered TTY text never enters evidence (R-026): \`${step.run}\``,
        });
      }
    }
  });
export type PackagingConformanceScenarioSpec = z.infer<typeof scenarioSpecSchema>;

/** Bar stages the spec declares no assertion for; non-empty means not bar-eligible. */
export function listUnassertedEvidenceBarStages(
  spec: PackagingConformanceScenarioSpec,
): ConformanceEvidenceBarStage[] {
  return CONFORMANCE_EVIDENCE_BAR_STAGES.filter(
    (stage) => spec.packagingExtension.evidenceBar[stage].length === 0,
  );
}

/**
 * The bar is exactly install, discover, invoke, and uninstall (R-BAR-1): a
 * spec asserting anything less can never advance a tuple, because
 * {@link recordConformanceRunOnRegistryEntry} refuses a run claiming a stage
 * its scenario does not assert and qualification requires all four stages.
 */
export function scenarioAssertsFullEvidenceBar(
  spec: PackagingConformanceScenarioSpec,
): boolean {
  return listUnassertedEvidenceBarStages(spec).length === 0;
}

/** Validates a parsed scenario spec document, failing closed with every issue named. */
export function validatePackagingConformanceScenarioSpec(
  document: unknown,
): PackagingConformanceScenarioSpec {
  const parsed = scenarioSpecSchema.safeParse(document);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(document)"}: ${issue.message}`)
      .join("; ");
    throw new OperationError(`Packaging conformance scenario spec is invalid: ${issues}`);
  }
  return parsed.data;
}

/** Loads one spec file; the filename (minus `.json`) must equal its scenarioId. */
export function loadPackagingConformanceScenarioSpec(
  specPath: string,
): PackagingConformanceScenarioSpec {
  if (!existsSync(specPath)) {
    throw new OperationError(
      `Packaging conformance scenario spec not found at \`${specPath}\` (R-SCEN-1).`,
    );
  }
  let document: unknown;
  try {
    document = JSON.parse(readFileSync(specPath, "utf8")) as unknown;
  } catch (error) {
    throw new OperationError(
      `Packaging conformance scenario spec at \`${specPath}\` is not valid JSON: ${String(error)}`,
    );
  }
  const spec = validatePackagingConformanceScenarioSpec(document);
  const expectedName = `${spec.scenarioId}.json`;
  if (path.basename(specPath) !== expectedName) {
    throw new OperationError(
      `Scenario spec file \`${path.basename(specPath)}\` must be named after its scenarioId: \`${expectedName}\`.`,
    );
  }
  return spec;
}

/**
 * Loads every authored scenario spec from the maintainer repo. Fails closed:
 * a missing directory, an empty directory, or a duplicate scenarioId is an
 * error, so absence can never read as coverage (R-SCEN-2).
 */
export function loadPackagingConformanceScenarioSpecs(
  input: { repoRoot?: string } = {},
): PackagingConformanceScenarioSpec[] {
  const specsDir = path.join(
    input.repoRoot ?? path.resolve("."),
    CONFORMANCE_SCENARIO_SPECS_DIR,
  );
  if (!existsSync(specsDir)) {
    throw new OperationError(
      `Packaging conformance scenario specs directory not found at \`${specsDir}\`; ` +
        `specs are maintainer-only in-repo content under ${CONFORMANCE_SCENARIO_SPECS_DIR} (R-SCEN-1).`,
    );
  }
  const files = readdirSync(specsDir)
    .filter((name) => name.endsWith(".json"))
    .sort();
  if (files.length === 0) {
    throw new OperationError(
      `No packaging conformance scenario specs found under \`${specsDir}\` (R-SCEN-1).`,
    );
  }
  const specs = files.map((name) => loadPackagingConformanceScenarioSpec(path.join(specsDir, name)));
  const seen = new Set<string>();
  for (const spec of specs) {
    if (seen.has(spec.scenarioId)) {
      throw new OperationError(`Duplicate scenario spec id \`${spec.scenarioId}\`.`);
    }
    seen.add(spec.scenarioId);
  }
  return specs;
}

/* --------------------------------------------------------------------------
 * Precondition probing (t8): honest blocked resolution.
 * ------------------------------------------------------------------------ */

/** Injectable executor so probing is testable without a harness on PATH. */
export interface ScenarioPreconditionExecutor {
  commandSucceeds(command: string, args: string[]): boolean;
}

/** The real executor: cheap, local, read-only probes with a hard timeout. */
export function createLocalScenarioPreconditionExecutor(): ScenarioPreconditionExecutor {
  return {
    commandSucceeds(command, args) {
      try {
        const result = spawnSync(command, args, { stdio: "ignore", timeout: 15_000 });
        return result.status === 0;
      } catch {
        return false;
      }
    },
  };
}

export interface ScenarioPreconditionProbeOutcome {
  id: string;
  kind: ConformanceScenarioPreconditionKind;
  description: string;
  satisfied: boolean;
  reason: string;
}

export interface ScenarioPreconditionProbeReport {
  runnable: boolean;
  outcomes: ScenarioPreconditionProbeOutcome[];
  unmet: ScenarioPreconditionProbeOutcome[];
}

/**
 * Probes every declared precondition. `command-succeeds` probes run locally;
 * `operator-attestation` preconditions (network, model routing) are satisfied
 * only when the operator explicitly attests the precondition id — the default
 * is unmet, so an unattended probe honestly resolves `blocked` rather than
 * assuming the expensive preconditions hold.
 */
export function probePackagingScenarioPreconditions(
  spec: PackagingConformanceScenarioSpec,
  options: { executor: ScenarioPreconditionExecutor; attestations?: string[] },
): ScenarioPreconditionProbeReport {
  const attestations = new Set(options.attestations ?? []);
  const outcomes = spec.packagingExtension.preconditions.map(
    (precondition): ScenarioPreconditionProbeOutcome => {
      if (precondition.probe.check === "command-succeeds") {
        const { command, args } = precondition.probe;
        const satisfied = options.executor.commandSucceeds(command, args);
        return {
          id: precondition.id,
          kind: precondition.kind,
          description: precondition.description,
          satisfied,
          reason: satisfied
            ? `\`${command} ${args.join(" ")}\` succeeded`
            : `\`${command} ${args.join(" ")}\` did not succeed`,
        };
      }
      const satisfied = attestations.has(precondition.id);
      return {
        id: precondition.id,
        kind: precondition.kind,
        description: precondition.description,
        satisfied,
        reason: satisfied
          ? "attested by the operator for this run"
          : "not attested; this precondition requires explicit operator attestation at run time",
      };
    },
  );
  const unmet = outcomes.filter((outcome) => !outcome.satisfied);
  return { runnable: unmet.length === 0, outcomes, unmet };
}

/* --------------------------------------------------------------------------
 * Result records (t2, t3): the compact committed evidence class.
 * ------------------------------------------------------------------------ */

const resultRecordSchema = z
  .object({
    // The lab result contract (PRD 20), field names preserved verbatim.
    schemaVersion: z.literal(CONFORMANCE_RESULT_SCHEMA_VERSION),
    resultId: z.string().min(1),
    scenarioId: slugSchema,
    scenarioVersion: z.string().min(1),
    runDate: z.string().min(1),
    makeDocsVersion: z.string().min(1),
    harness: z.string().min(1),
    modelName: z.string().min(1),
    providerOrRoutingLayer: z.string().min(1),
    modelVersion: z.string().min(1),
    runtimeDistribution: z.string().min(1),
    runtimeVersion: z.string().min(1),
    producedFiles: z.array(z.string().min(1)),
    relevantDiffs: z.array(z.string().min(1)),
    exitStatus: z.number().int().nullable(),
    transcriptLogPointer: z.string().min(1),
    verdict: z.enum(CONFORMANCE_RUN_VERDICTS),
    reason: z.string().min(1),
    caveats: z.array(z.string().min(1)),
    reviewerStatus: z.enum(CONFORMANCE_REVIEWER_STATUSES),
    supportClaimUse: z.enum(CONFORMANCE_SUPPORT_CLAIM_USES),
    // The packaging extension (PRD 37): additive fields only.
    caveatsSurfaced: z.boolean(),
    evidenceBar: z.object({
      install: z.boolean(),
      discover: z.boolean(),
      invoke: z.boolean(),
      uninstall: z.boolean(),
    }),
    simulated: z.boolean(),
    simulationMechanicsRef: z.string().min(1).nullable(),
    transcriptFormat: z.enum(["json", "non-tty"]),
  })
  .superRefine((record, context) => {
    if (record.verdict === "blocked") {
      if (record.supportClaimUse !== "none") {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["supportClaimUse"],
          message: "a blocked result must use supportClaimUse none (PRD 20, R-KEEP-1)",
        });
      }
      if (CONFORMANCE_EVIDENCE_BAR_STAGES.some((stage) => record.evidenceBar[stage])) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["evidenceBar"],
          message:
            "a blocked run asserted nothing: every evidence-bar stage must be false — blocked is honest absence of evidence, not evidence (R-KEEP-1)",
        });
      }
    }
    if (record.simulated && record.simulationMechanicsRef === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["simulationMechanicsRef"],
        message:
          "a simulated run must name the reviewed faithful-simulation mechanics it used (D8, W18 R9 P2 t3)",
      });
    }
    if (!record.simulated && record.simulationMechanicsRef !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["simulationMechanicsRef"],
        message: "a real-harness run must not cite simulation mechanics",
      });
    }
  });
export type PackagingConformanceResultRecord = z.infer<typeof resultRecordSchema>;

export function validatePackagingConformanceResultRecord(
  document: unknown,
): PackagingConformanceResultRecord {
  const parsed = resultRecordSchema.safeParse(document);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(document)"}: ${issue.message}`)
      .join("; ");
    throw new OperationError(`Packaging conformance result record is invalid: ${issues}`);
  }
  return parsed.data;
}

/**
 * Builds the honest `blocked` result record for a scenario whose
 * preconditions did not resolve (t8): verdict `blocked`, no bar stage
 * asserted, `supportClaimUse: "none"`, model and provider `unknown` because
 * no run reached a model. Recording this run on a tuple never advances it.
 */
export function blockedPackagingResultRecord(input: {
  spec: PackagingConformanceScenarioSpec;
  unmet: ScenarioPreconditionProbeOutcome[];
  runDate: string;
  makeDocsVersion: string;
  runtimeDistribution: string;
  runtimeVersion: string;
  transcriptLogPointer?: string;
}): PackagingConformanceResultRecord {
  if (input.unmet.length === 0) {
    throw new OperationError(
      "A blocked result record requires at least one unmet precondition; a runnable scenario must run instead.",
    );
  }
  const unmetSummary = input.unmet
    .map((outcome) => `${outcome.id} (${outcome.reason})`)
    .join("; ");
  return {
    schemaVersion: CONFORMANCE_RESULT_SCHEMA_VERSION,
    resultId: `${input.runDate}-${input.spec.scenarioId}-blocked`,
    scenarioId: input.spec.scenarioId,
    scenarioVersion: input.spec.scenarioVersion,
    runDate: input.runDate,
    makeDocsVersion: input.makeDocsVersion,
    harness: input.spec.packagingExtension.harness,
    modelName: "unknown",
    providerOrRoutingLayer: "unknown",
    modelVersion: "unknown",
    runtimeDistribution: input.runtimeDistribution,
    runtimeVersion: input.runtimeVersion,
    producedFiles: [],
    relevantDiffs: [],
    exitStatus: null,
    transcriptLogPointer:
      input.transcriptLogPointer ?? ".make-docs/conformance/(not-created)/transcript.log",
    verdict: "blocked",
    reason: `Blocked before execution: unmet preconditions — ${unmetSummary}.`,
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

/**
 * Projects a result record into the compact recorded-run shape the tuple
 * registry stores. The tuple's `modelOrProvider` dimension binds to the
 * model name when one was captured, else the provider or routing layer —
 * run metadata either way, exactly as PRD 20's result contract owns it.
 */
export function projectPackagingResultToRecordedRun(
  record: PackagingConformanceResultRecord,
  recordRef: string,
): ConformanceRecordedRun {
  return {
    runId: record.resultId,
    scenario: record.scenarioId,
    runDate: record.runDate,
    verdict: record.verdict,
    caveats: [...record.caveats],
    caveatsSurfaced: record.caveatsSurfaced,
    evidenceBar: { ...record.evidenceBar },
    recordRef,
    modelOrProvider:
      record.modelName !== "unknown" ? record.modelName : record.providerOrRoutingLayer,
    runtime: record.runtimeDistribution,
    simulated: record.simulated,
  };
}

/* --------------------------------------------------------------------------
 * Binding bar outcomes onto the registry (t2).
 * ------------------------------------------------------------------------ */

/**
 * Records a scenario run on a registry entry and rederives its status
 * (R-REG-3, R-BAR-1..2). This is the single seam between a result record and
 * the Phase 1 registry, and it fails closed on every mismatch that could
 * make a claim broader than its evidence:
 *
 * - the record must belong to the given scenario, and the scenario must
 *   target the entry (its `registryTupleIds` include the entry id) on the
 *   same harness;
 * - the record may not claim a bar stage the scenario does not assert — so a
 *   scenario missing any assertion structurally cannot advance a tuple;
 * - the record's simulation posture must match the scenario's declared
 *   harness-execution mode (t3);
 * - a qualifying run binds the evidence-owned tuple dimensions from its run
 *   metadata; a non-qualifying run (including `blocked`) is recorded as
 *   honest history and advances nothing. Internal-test evidence continues to
 *   cap at `implementation-validated` via the Phase 1 derivation.
 */
export function recordConformanceRunOnRegistryEntry(input: {
  entry: ConformanceTupleRegistryEntry;
  spec: PackagingConformanceScenarioSpec;
  record: PackagingConformanceResultRecord;
  /** Repo-relative path where the compact result record is committed. */
  recordRef: string;
}): ConformanceTupleRegistryEntry {
  const { entry, spec, record, recordRef } = input;
  const label = `conformance tuple registry entry \`${entry.id}\``;
  if (record.scenarioId !== spec.scenarioId) {
    throw new OperationError(
      `Result record \`${record.resultId}\` belongs to scenario \`${record.scenarioId}\`, not \`${spec.scenarioId}\`.`,
    );
  }
  if (!spec.packagingExtension.registryTupleIds.includes(entry.id)) {
    throw new OperationError(
      `Scenario \`${spec.scenarioId}\` does not target ${label}; a run may land only on a tuple its scenario declares (R-TUPLE-1).`,
    );
  }
  if (
    entry.tuple.harness !== spec.packagingExtension.harness ||
    record.harness !== spec.packagingExtension.harness
  ) {
    throw new OperationError(
      `Harness mismatch: ${label} is \`${entry.tuple.harness}\`, scenario \`${spec.scenarioId}\` targets ` +
        `\`${spec.packagingExtension.harness}\`, and the record ran \`${record.harness}\`; evidence never crosses harnesses (R-TUPLE-1).`,
    );
  }
  const unasserted = listUnassertedEvidenceBarStages(spec);
  const overclaimed = CONFORMANCE_EVIDENCE_BAR_STAGES.filter(
    (stage) => record.evidenceBar[stage] && unasserted.includes(stage),
  );
  if (overclaimed.length > 0) {
    throw new OperationError(
      `Result record \`${record.resultId}\` claims bar stage(s) ${overclaimed.join(", ")} that scenario ` +
        `\`${spec.scenarioId}\` declares no assertion for; a scenario missing an assertion cannot advance a tuple (R-BAR-1).`,
    );
  }
  const specSimulates = spec.packagingExtension.harnessExecution.mode === "faithful-simulation";
  if (record.simulated !== specSimulates) {
    throw new OperationError(
      `Result record \`${record.resultId}\` records simulated=${String(record.simulated)} but scenario ` +
        `\`${spec.scenarioId}\` declares ${spec.packagingExtension.harnessExecution.mode}; ` +
        "simulation is a reviewed spec-level choice, never a per-run improvisation (D8, t3).",
    );
  }
  const run = projectPackagingResultToRecordedRun(record, recordRef);
  const qualifies = runQualifiesForConformanceValidation(run);
  if (qualifies && entry.tuple.scenario !== null && entry.tuple.scenario !== run.scenario) {
    throw new OperationError(
      `${label} is already bound to scenario \`${entry.tuple.scenario}\`; a qualifying run for ` +
        `\`${run.scenario}\` belongs on its own tuple (R-TUPLE-1).`,
    );
  }
  const recordedRuns = [...entry.recordedRuns, run];
  const tuple = qualifies
    ? bindRunMetadataOntoConformanceTuple(entry.tuple, {
        scenario: run.scenario,
        modelOrProvider: run.modelOrProvider,
        runtime: run.runtime,
      })
    : entry.tuple;
  return {
    ...entry,
    tuple,
    recordedRuns,
    status: deriveConformanceTupleStatus({ evidence: entry.evidence, recordedRuns }),
  };
}

/* --------------------------------------------------------------------------
 * Registry <-> scenario linkage (t9).
 * ------------------------------------------------------------------------ */

/**
 * Verifies the bidirectional linkage between registry entries and authored
 * scenario specs: every `plannedScenarios` id resolves to a loaded spec that
 * targets the entry on the same harness, every spec's `registryTupleIds`
 * resolves to an entry whose `plannedScenarios` carries the spec back, and a
 * planned scenario never pre-binds the tuple's `scenario` dimension. Returns
 * human-readable errors; empty means the linkage holds.
 */
export function listConformanceScenarioRegistryLinkageErrors(
  registry: { tuples: ConformanceTupleRegistryEntry[] },
  specs: PackagingConformanceScenarioSpec[],
): string[] {
  const errors: string[] = [];
  const specsById = new Map(specs.map((spec) => [spec.scenarioId, spec]));
  const entriesById = new Map(registry.tuples.map((entry) => [entry.id, entry]));
  for (const entry of registry.tuples) {
    for (const scenarioId of entry.plannedScenarios) {
      const spec = specsById.get(scenarioId);
      if (!spec) {
        errors.push(
          `entry \`${entry.id}\` plans scenario \`${scenarioId}\` but no spec with that id is authored under ${CONFORMANCE_SCENARIO_SPECS_DIR}`,
        );
        continue;
      }
      if (!spec.packagingExtension.registryTupleIds.includes(entry.id)) {
        errors.push(
          `entry \`${entry.id}\` plans scenario \`${scenarioId}\` but that spec does not target the entry`,
        );
      }
      if (spec.packagingExtension.harness !== entry.tuple.harness) {
        errors.push(
          `entry \`${entry.id}\` (harness \`${entry.tuple.harness}\`) plans scenario \`${scenarioId}\` which targets harness \`${spec.packagingExtension.harness}\``,
        );
      }
      if (entry.tuple.scenario !== null && entry.recordedRuns.length === 0) {
        errors.push(
          `entry \`${entry.id}\` has a bound scenario dimension without a recorded run; planned scenarios never bind the dimension (R-TUPLE-1)`,
        );
      }
    }
    if (new Set(entry.plannedScenarios).size !== entry.plannedScenarios.length) {
      errors.push(`entry \`${entry.id}\` lists a planned scenario more than once`);
    }
  }
  for (const spec of specs) {
    for (const entryId of spec.packagingExtension.registryTupleIds) {
      const entry = entriesById.get(entryId);
      if (!entry) {
        errors.push(
          `scenario \`${spec.scenarioId}\` targets registry entry \`${entryId}\` which does not exist`,
        );
        continue;
      }
      if (!entry.plannedScenarios.includes(spec.scenarioId)) {
        errors.push(
          `scenario \`${spec.scenarioId}\` targets entry \`${entryId}\` but the entry does not plan it back; the linkage is bidirectional (t9)`,
        );
      }
    }
  }
  return errors;
}

/** The required first-pass scenario ids not yet authored as specs (R-SCEN-1, pre-figuring R-TEST-2). */
export function listMissingRequiredFirstPassScenarioIds(
  specs: PackagingConformanceScenarioSpec[],
): RequiredFirstPassScenarioId[] {
  const authored = new Set(specs.map((spec) => spec.scenarioId));
  return (Object.keys(REQUIRED_FIRST_PASS_SCENARIOS) as RequiredFirstPassScenarioId[]).filter(
    (scenarioId) => !authored.has(scenarioId),
  );
}
