import { isRetiredConformanceScenario } from "./historical-contract";
/**
 * The packaging conformance scenario contract and evidence bar
 * (PRD 43 R-BAR-1..2, R-ORG-1, R-SCHEMA-1..3, R-DISC-1;
 * W18 R9 P2 t1-t9; W18 R13 P1 t1-t3).
 *
 * The install-discover-invoke-uninstall bar is implemented here as the
 * scenario SHAPE for packaging conformance (t1): a packaging scenario
 * definition declares, per bar stage, the assertions a run must prove, and
 * the recording seam ({@link recordConformanceRunOnRegistryEntry}) binds run
 * outcomes onto the Phase 1 tuple registry (t2) — a qualifying `pass`, or
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
 * Definitions by domain, evidence by target (PRD 43, register item D-025):
 * scenario definitions are harness-agnostic. A definition id is
 * domain-qualified (`<domain>/<outcome>`, e.g.
 * `packaging/plugin-marketplace-install`) and never carries a harness token;
 * everything that names an execution target — `harnessExecution`, the
 * registry tuple linkage, and target-specific precondition probes — lives in
 * the extension's `targets` map keyed by harness id. The retired
 * `futureHarnesses` list is replaced structurally (R-SCHEMA-2): a harness
 * with no entry in a definition's `targets` map is an uncovered target whose
 * absence the registry's scenario-absence notes report; it is never implied
 * as covered, and the extension schema is strict so a definition carrying
 * top-level `harness`, `futureHarnesses`, or the retired `characterization`
 * spelling fails validation.
 *
 * Implementer decisions recorded here (D8 freedoms; W18 R13 P1):
 * - Spec format: one JSON document per definition under
 *   `conformance/scenarios/<domain>/<outcome>.json` (the lab permits YAML or
 *   JSON; JSON matches the tuple registry's no-parser-dependency choice, and
 *   the path-equals-scenarioId rule keeps definitions addressable without
 *   opening them). The first and only current domain is `packaging`;
 *   `playbook-runs` is the named future domain, created only when its first
 *   definition lands (R-ORG-1).
 * - Faithful-simulation mechanics (t3): a target binding's `harnessExecution`
 *   declares `real-harness` or `faithful-simulation`; the simulation mode
 *   MUST document its reviewed mechanics in the binding, every result record
 *   states `simulated` (with a `simulationMechanicsRef` naming the mechanics
 *   used), and the recording seam refuses a run whose simulation posture
 *   disagrees with its scenario's declared mode. The four first-pass Codex
 *   bindings all declare `real-harness`: no faithful simulation of Codex
 *   exists, so simulation never silently substitutes for the real harness.
 * - Precondition template vs. per-target probes (t1, R-SCHEMA-1): the
 *   definition-level precondition template declares WHICH preconditions exist
 *   and which are attestation-only (`command-succeeds` marks a probeable
 *   precondition; `operator-attestation` marks network and model routing,
 *   which cannot be probed without spending them), while the concrete probe
 *   command for every probeable precondition lives on each target binding —
 *   target knowledge never sits in the definition body. An unmet
 *   precondition resolves to an honest `blocked` result record
 *   ({@link blockedPackagingResultRecord}) with `supportClaimUse: "none"` and
 *   an all-false evidence bar, which never advances a tuple.
 * - The discovery kit (t2, R-DISC-1): the R-021 characterization preamble is
 *   renamed and generalized to `discoveryKit`, carried on a target binding
 *   (the plugin definition's Codex binding carries it) with the
 *   `resolvesProbe` linkage to register item R-021 preserved verbatim.
 * - Transcript homes (register item D-024, PRD 44 R-NAME-2): no default ever
 *   names a repo-local transcript home. A blocked-before-execution record's
 *   transcript pointer defaults to `discarded-with-session`; retained raw
 *   evidence belongs to the machine-level store's lab area.
 * - Bar completeness (t1): a definition must assert every one of the four
 *   stages to be bar-eligible ({@link scenarioAssertsFullEvidenceBar}), and
 *   the recording seam refuses a run claiming a stage its scenario does not
 *   assert — so a scenario missing any assertion structurally cannot advance
 *   a tuple (R-BAR-1).
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { OperationError } from "../operations/types";
import {
  CONFORMANCE_TRANSCRIPT_DISCARDED_WITH_SESSION,
  listConformanceTranscriptLogPointerErrors,
} from "./lab-session";
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

/**
 * Repo-relative home of the packaging scenario definitions. Definitions are
 * harness-agnostic and organize by scenario domain under
 * `conformance/scenarios/<domain>/<outcome>.json` (PRD 43 R-ORG-1; home
 * governed by PRD 43).
 */
export const CONFORMANCE_SCENARIO_SPECS_DIR = "conformance/scenarios";

/**
 * The execution target the required first-pass definitions must bind
 * (PRD 43 R-SCHEMA-3): the required set remains exactly the four packaging
 * outcomes bound to Codex targets.
 */
export const REQUIRED_FIRST_PASS_TARGET = "codex";

/**
 * The four required first-pass scenario outcomes (PRD 43 R-SCEN-1,
 * R-SCHEMA-3), keyed by their domain-qualified, harness-agnostic
 * ids and mapped to the user-visible outcome each must prove. The R-TEST-2
 * runnability check consumes this constant; absence of any of these
 * definitions is a failure, never a silent gap.
 */
/** The former first-pass packaging cases are retired. No replacement set is approved. */
export const REQUIRED_FIRST_PASS_SCENARIOS: Record<string, string> = {};
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

/**
 * A scenario definition id is domain-qualified: `<domain>/<outcome>`, both
 * parts lowercase hyphenated slugs, no harness token anywhere (PRD 43
 * R-ORG-1; register item D-025).
 */
const scenarioIdSchema = z
  .string()
  .regex(
    /^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*$/,
    "scenario ids are domain-qualified (`<domain>/<outcome>`) lowercase hyphenated slugs",
  );

/** Splits a domain-qualified scenario id into its domain and outcome parts. */
export function splitConformanceScenarioId(scenarioId: string): {
  domain: string;
  outcome: string;
} {
  const separator = scenarioId.indexOf("/");
  if (separator === -1) {
    throw new OperationError(
      `Scenario id \`${scenarioId}\` is not domain-qualified; ids are \`<domain>/<outcome>\` (R-ORG-1).`,
    );
  }
  return {
    domain: scenarioId.slice(0, separator),
    outcome: scenarioId.slice(separator + 1),
  };
}

const barStageSchema = z.enum(CONFORMANCE_EVIDENCE_BAR_STAGES);

/**
 * A scenario step: an ordered command or human/harness action per the lab's
 * step shape, optionally tagged with the bar stage it serves. A command step
 * whose transcript is consumed as evidence must pin `--json`
 * (`transcript: "evidence-json"`) or run non-TTY
 * (`transcript: "evidence-non-tty"`), so the render layer never enters
 * evidence (PRD 39 R-SEQ-2; register item R-026).
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

/**
 * The definition-level precondition TEMPLATE (t8; PRD 43 R-SCHEMA-1): which
 * preconditions exist and which are attestation-only. `command-succeeds`
 * marks a probeable precondition whose concrete probe command lives on each
 * target binding ({@link targetBindingSchema}); `operator-attestation` marks
 * the expensive preconditions (network, model routing) that cannot be probed
 * without spending them and require explicit operator attestation at run
 * time.
 */
const preconditionTemplateSchema = z
  .object({
    id: slugSchema,
    kind: z.enum(CONFORMANCE_SCENARIO_PRECONDITION_KINDS),
    description: z.string().min(1),
    probe: z.enum(["command-succeeds", "operator-attestation"]),
    /**
     * Always `blocked` (R-KEEP-1): the value is embedded so every definition
     * states, in its own data, that an unmet precondition is honest absence
     * of evidence, never invented evidence.
     */
    onUnmet: z.literal("blocked"),
  })
  .strict();
export type PackagingScenarioPrecondition = z.infer<typeof preconditionTemplateSchema>;

/** A target binding's concrete probe command for one probeable precondition. */
const preconditionProbeCommandSchema = z
  .object({
    command: z.string().min(1),
    args: z.array(z.string().min(1)),
  })
  .strict();
export type PackagingScenarioPreconditionProbeCommand = z.infer<
  typeof preconditionProbeCommandSchema
>;

const harnessExecutionSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("real-harness"), simulationMechanics: z.null() }),
  z.object({
    mode: z.literal("faithful-simulation"),
    /** The reviewed D8 simulation mechanics; required so simulation is never undeclared. */
    simulationMechanics: z.string().min(1),
  }),
]);

/**
 * The discovery kit (PRD 43 R-DISC-1; register item R-021): the renamed and
 * generalized characterization preamble. Before asserting the bar, a target
 * binding carrying this block first records ground truth for what the real
 * harness version accepts — e.g. a hand-minimal plugin independent of Make
 * Docs establishing the marketplace source shape and plugin layout the
 * harness actually recognizes — then diffs the generated shapes against that
 * ground truth. This is the recorded plan for resolving a negative
 * recognition probe: bar assertions run only after ground truth exists, so a
 * failure distinguishes "our shapes are wrong" from "the harness cannot do
 * this". Discovery findings feed descriptor corrections, never evidence-bar
 * relaxations.
 */
const discoveryKitSchema = z
  .object({
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
  })
  .strict();
export type PackagingScenarioDiscoveryKit = z.infer<typeof discoveryKitSchema>;

/**
 * One execution-target binding (PRD 43 R-SCHEMA-1..2): everything that names
 * a target lives here, keyed by harness id in the extension's `targets` map.
 * A harness with no binding is an uncovered target — a reported gap, never
 * implied coverage (the structural replacement for the retired
 * `futureHarnesses` list).
 */
const targetBindingSchema = z
  .object({
    /** Registry entry ids (not tuple keys) this target's runs may land on. */
    registryTupleIds: z.array(slugSchema).min(1),
    harnessExecution: harnessExecutionSchema,
    /**
     * Concrete probe commands, one per probeable (`command-succeeds`)
     * precondition in the definition-level template — validated exhaustive
     * and exact by the spec-level refinement.
     */
    preconditionProbes: z.record(z.string(), preconditionProbeCommandSchema),
    /** Optional target-specific parameters consumed by kit generation. */
    parameters: z.record(z.string(), z.string()).optional(),
    /** The first-run discovery kit, when this binding precedes bar assertion (R-DISC-1). */
    discoveryKit: discoveryKitSchema.optional(),
  })
  .strict();
export type PackagingScenarioTargetBinding = z.infer<typeof targetBindingSchema>;

const evidenceBarAssertionsSchema = z.object({
  install: z.array(z.string().min(1)),
  discover: z.array(z.string().min(1)),
  invoke: z.array(z.string().min(1)),
  uninstall: z.array(z.string().min(1)),
});

/**
 * The packaging extension (PRD 43 R-SCHEMA-1): the
 * definition-level, target-independent fields plus the per-target `targets`
 * map. Strict by design so the superseded spellings — top-level `harness`,
 * `harnessExecution`, `registryTupleIds`, `futureHarnesses`, and
 * `characterization` — are rejected rather than silently ignored.
 */
const packagingExtensionSchema = z
  .object({
    /** The scenario domain this definition belongs to; must equal the id's prefix (R-ORG-1). */
    domain: slugSchema,
    /** Per-stage assertions; all four stages non-empty makes the spec bar-eligible (R-BAR-1). */
    evidenceBar: evidenceBarAssertionsSchema,
    /** The definition-level precondition template (probeable vs. attestation-only). */
    preconditions: z.array(preconditionTemplateSchema).min(1),
    /** Evidence transcripts pin `--json` or run non-TTY (R-026, PRD 39 R-SEQ-2). */
    transcriptPolicy: z.literal("json-or-non-tty"),
    /** Nothing destructive against a maintainer working tree (R-KEEP-1). */
    workspacePolicy: z.literal("disposable-fixture-workspace"),
    /** Repo-relative v2-form source Playbooks the scenario packages. */
    fixturePlaybooks: z.array(z.string().min(1)),
    /** Execution-target bindings keyed by harness id (R-SCHEMA-1..2). */
    targets: z.record(slugSchema, targetBindingSchema),
  })
  .strict();

const scenarioSpecSchema = z
  .object({
    schemaVersion: z.literal(CONFORMANCE_SCENARIO_SCHEMA_VERSION),
    scenarioId: scenarioIdSchema,
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
    const { domain } = splitConformanceScenarioId(spec.scenarioId);
    if (spec.packagingExtension.domain !== domain) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["packagingExtension", "domain"],
        message:
          `domain \`${spec.packagingExtension.domain}\` does not match the scenario id's ` +
          `domain prefix \`${domain}\` (R-ORG-1)`,
      });
    }
    const preconditionIds = new Set<string>();
    const probeablePreconditionIds = new Set<string>();
    for (const precondition of spec.packagingExtension.preconditions) {
      if (preconditionIds.has(precondition.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["packagingExtension", "preconditions"],
          message: `duplicate precondition id \`${precondition.id}\``,
        });
      }
      preconditionIds.add(precondition.id);
      if (precondition.probe === "command-succeeds") {
        probeablePreconditionIds.add(precondition.id);
      }
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
    // Every target binding must carry a concrete probe command for exactly
    // the probeable preconditions: a probeable precondition without a probe
    // cannot resolve blocked honestly, and a probe for an attestation-only
    // or undeclared precondition is target knowledge with no template home.
    for (const [harness, binding] of Object.entries(spec.packagingExtension.targets)) {
      for (const preconditionId of probeablePreconditionIds) {
        if (!(preconditionId in binding.preconditionProbes)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["packagingExtension", "targets", harness, "preconditionProbes"],
            message:
              `target \`${harness}\` carries no probe command for probeable precondition ` +
              `\`${preconditionId}\` (R-SCHEMA-1)`,
          });
        }
      }
      for (const preconditionId of Object.keys(binding.preconditionProbes)) {
        if (!probeablePreconditionIds.has(preconditionId)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["packagingExtension", "targets", harness, "preconditionProbes"],
            message:
              `target \`${harness}\` carries a probe command for \`${preconditionId}\`, which is ` +
              "not a probeable precondition in the definition's template (R-SCHEMA-1)",
          });
        }
      }
    }
    const allSteps: PackagingConformanceScenarioStep[] = [
      ...spec.steps,
      ...Object.values(spec.packagingExtension.targets).flatMap(
        (binding) => binding.discoveryKit?.groundTruthSteps ?? [],
      ),
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
            "`--write` is retired; scenario scripts use the plan/preview/write/ship packaging grammar (PRD 39 R-GRAM-2, register item R-026)",
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

/**
 * Resolves one execution-target binding, failing closed when the harness has
 * no entry in the definition's `targets` map: an uncovered target is a
 * reported gap, never implied coverage (PRD 43 R-SCHEMA-2, R-SCEN-2).
 */
export function getScenarioTargetBinding(
  spec: PackagingConformanceScenarioSpec,
  harness: string,
): PackagingScenarioTargetBinding {
  const binding = spec.packagingExtension.targets[harness];
  if (!binding) {
    const covered = Object.keys(spec.packagingExtension.targets).sort();
    throw new OperationError(
      `Scenario \`${spec.scenarioId}\` binds no \`${harness}\` target; covered targets: ` +
        `${covered.length > 0 ? covered.join(", ") : "(none)"}. An uncovered target is a ` +
        "reported gap, never implied coverage (R-SCHEMA-2, R-SCEN-2).",
    );
  }
  return binding;
}

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

/**
 * Loads one definition file. The domain-qualified scenario id must equal the
 * file's `<domain>/<outcome>.json` path tail, so a definition is addressable
 * from its id without opening it (R-ORG-1).
 */
export function loadPackagingConformanceScenarioSpec(
  specPath: string,
): PackagingConformanceScenarioSpec {
  if (!existsSync(specPath)) {
    throw new OperationError(
      `Packaging conformance scenario definition not found at \`${specPath}\` (R-ORG-1).`,
    );
  }
  let document: unknown;
  try {
    document = JSON.parse(readFileSync(specPath, "utf8")) as unknown;
  } catch (error) {
    throw new OperationError(
      `Packaging conformance scenario definition at \`${specPath}\` is not valid JSON: ${String(error)}`,
    );
  }
  const spec = validatePackagingConformanceScenarioSpec(document);
  const expectedTail = `${spec.scenarioId}.json`;
  const normalized = specPath.split(path.sep).join("/");
  if (!normalized.endsWith(`/${expectedTail}`)) {
    throw new OperationError(
      `Scenario definition at \`${specPath}\` must live at its domain-qualified id path: ` +
        `\`${CONFORMANCE_SCENARIO_SPECS_DIR}/${expectedTail}\` (R-ORG-1).`,
    );
  }
  return spec;
}

/**
 * Loads every authored scenario definition from the maintainer repo,
 * recursing into the `scenarios/<domain>/` layout (R-ORG-1). Fails closed: a
 * missing directory, an empty directory, a definition file outside a domain
 * subdirectory, or a duplicate scenarioId is an error, so absence can never
 * read as coverage (R-SCEN-2).
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
      `Packaging conformance scenario definitions directory not found at \`${specsDir}\`; ` +
        `definitions are maintainer-only in-repo content under ${CONFORMANCE_SCENARIO_SPECS_DIR}/<domain>/ (R-ORG-1).`,
    );
  }
  const entries = readdirSync(specsDir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const strayFiles = entries.filter(
    (entry) => entry.isFile() && entry.name.endsWith(".json"),
  );
  if (strayFiles.length > 0) {
    throw new OperationError(
      `Scenario definitions must live under a domain subdirectory (\`${CONFORMANCE_SCENARIO_SPECS_DIR}/<domain>/\`), ` +
        `found flat file(s): ${strayFiles.map((entry) => entry.name).join(", ")} (R-ORG-1).`,
    );
  }
  const specPaths: string[] = [];
  for (const domainEntry of entries.filter((entry) => entry.isDirectory())) {
    const domainDir = path.join(specsDir, domainEntry.name);
    for (const name of readdirSync(domainDir)
      .filter((fileName) => fileName.endsWith(".json"))
      .sort()) {
      specPaths.push(path.join(domainDir, name));
    }
  }
  if (specPaths.length === 0) {
    throw new OperationError(
      `No packaging conformance scenario definitions found under \`${specsDir}\` (R-ORG-1).`,
    );
  }
  const specs = specPaths.map((specPath) => loadPackagingConformanceScenarioSpec(specPath));
  const seen = new Set<string>();
  for (const spec of specs) {
    if (seen.has(spec.scenarioId)) {
      throw new OperationError(`Duplicate scenario definition id \`${spec.scenarioId}\`.`);
    }
    seen.add(spec.scenarioId);
  }
  return specs.filter((spec) => !isRetiredConformanceScenario(spec.scenarioId));
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
 * Probes every declared precondition for one execution target. Probeable
 * (`command-succeeds`) preconditions run the target binding's concrete probe
 * command locally; `operator-attestation` preconditions (network, model
 * routing) are satisfied only when the operator explicitly attests the
 * precondition id — the default is unmet, so an unattended probe honestly
 * resolves `blocked` rather than assuming the expensive preconditions hold.
 * A harness with no target binding fails closed as an uncovered target.
 */
export function probePackagingScenarioPreconditions(
  spec: PackagingConformanceScenarioSpec,
  options: {
    harness: string;
    executor: ScenarioPreconditionExecutor;
    attestations?: string[];
  },
): ScenarioPreconditionProbeReport {
  const binding = getScenarioTargetBinding(spec, options.harness);
  const attestations = new Set(options.attestations ?? []);
  const outcomes = spec.packagingExtension.preconditions.map(
    (precondition): ScenarioPreconditionProbeOutcome => {
      if (precondition.probe === "command-succeeds") {
        const probe = binding.preconditionProbes[precondition.id];
        if (!probe) {
          // Unreachable for a validated spec (the schema requires exhaustive
          // probe coverage), kept fail-closed for hand-built inputs.
          return {
            id: precondition.id,
            kind: precondition.kind,
            description: precondition.description,
            satisfied: false,
            reason: `target \`${options.harness}\` declares no probe command for this precondition`,
          };
        }
        const satisfied = options.executor.commandSucceeds(probe.command, probe.args);
        return {
          id: precondition.id,
          kind: precondition.kind,
          description: precondition.description,
          satisfied,
          reason: satisfied
            ? `\`${probe.command} ${probe.args.join(" ")}\` succeeded`
            : `\`${probe.command} ${probe.args.join(" ")}\` did not succeed`,
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
    scenarioId: scenarioIdSchema,
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
    // The packaging extension (PRD 43): additive fields only.
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
    // Evidence-home honesty (PRD 44 R-NAME-2, register item D-024): the
    // transcript pointer states `discarded-with-session` or points into the
    // machine-level store's lab area — never a repo-local home.
    for (const pointerError of listConformanceTranscriptLogPointerErrors(
      record.transcriptLogPointer,
    )) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["transcriptLogPointer"],
        message: pointerError,
      });
    }
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
 * preconditions did not resolve on one execution target (t8): verdict
 * `blocked`, no bar stage asserted, `supportClaimUse: "none"`, model and
 * provider `unknown` because no run reached a model. Recording this run on a
 * tuple never advances it. The default transcript pointer states
 * `discarded-with-session` — a blocked-before-execution session produced no
 * transcript to keep, and no default ever names a repo-local transcript home
 * (D-024).
 */
export function blockedPackagingResultRecord(input: {
  spec: PackagingConformanceScenarioSpec;
  harness: string;
  unmet: ScenarioPreconditionProbeOutcome[];
  runDate: string;
  makeDocsVersion: string;
  runtimeDistribution: string;
  runtimeVersion: string;
  transcriptLogPointer?: string;
}): PackagingConformanceResultRecord {
  // Fails closed when the harness is uncovered: even a blocked record may
  // not imply a target binding that does not exist (R-SCHEMA-2).
  getScenarioTargetBinding(input.spec, input.harness);
  if (input.unmet.length === 0) {
    throw new OperationError(
      "A blocked result record requires at least one unmet precondition; a runnable scenario must run instead.",
    );
  }
  const { outcome } = splitConformanceScenarioId(input.spec.scenarioId);
  const unmetSummary = input.unmet
    .map((probeOutcome) => `${probeOutcome.id} (${probeOutcome.reason})`)
    .join("; ");
  return {
    schemaVersion: CONFORMANCE_RESULT_SCHEMA_VERSION,
    resultId: `${input.runDate}-${outcome}-blocked`,
    scenarioId: input.spec.scenarioId,
    scenarioVersion: input.spec.scenarioVersion,
    runDate: input.runDate,
    makeDocsVersion: input.makeDocsVersion,
    harness: input.harness,
    modelName: "unknown",
    providerOrRoutingLayer: "unknown",
    modelVersion: "unknown",
    runtimeDistribution: input.runtimeDistribution,
    runtimeVersion: input.runtimeVersion,
    producedFiles: [],
    relevantDiffs: [],
    exitStatus: null,
    transcriptLogPointer:
      input.transcriptLogPointer ?? CONFORMANCE_TRANSCRIPT_DISCARDED_WITH_SESSION,
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
 * - the record must belong to the given scenario, and the scenario must bind
 *   the record's harness as a target whose `registryTupleIds` include the
 *   entry id, on the same harness as the entry's tuple;
 * - the record may not claim a bar stage the scenario does not assert — so a
 *   scenario missing any assertion structurally cannot advance a tuple;
 * - the record's simulation posture must match the target binding's declared
 *   harness-execution mode (t3);
 * - a qualifying run binds the evidence-owned tuple dimensions from its run
 *   metadata; a non-qualifying run (including `blocked`) is recorded as
 *   honest history and advances nothing. Internal-test evidence continues to
 *   cap at `implementation-validated` via the Phase 1 derivation.
 *
 * The seam's SEMANTICS are unchanged by the W18 R13 schema revision (PRD 43
 * R-ING-2): the same refusals fire for the same reasons; only where the
 * target knowledge lives moved (the `targets` map instead of a top-level
 * `harness`).
 */
export function recordConformanceRunOnRegistryEntry(input: {
  entry: ConformanceTupleRegistryEntry;
  spec: PackagingConformanceScenarioSpec;
  record: PackagingConformanceResultRecord;
  /** Repo-relative path where the compact result record is committed. */
  recordRef: string;
}): ConformanceTupleRegistryEntry {
  if (isRetiredConformanceScenario(input.spec.scenarioId)) {
    throw new OperationError("Retired conformance scenarios cannot record current support evidence.");
  }
  const { entry, spec, record, recordRef } = input;
  const label = `conformance tuple registry entry \`${entry.id}\``;
  if (record.scenarioId !== spec.scenarioId) {
    throw new OperationError(
      `Result record \`${record.resultId}\` belongs to scenario \`${record.scenarioId}\`, not \`${spec.scenarioId}\`.`,
    );
  }
  const binding = getScenarioTargetBinding(spec, record.harness);
  if (!binding.registryTupleIds.includes(entry.id)) {
    throw new OperationError(
      `Scenario \`${spec.scenarioId}\` does not target ${label} on harness \`${record.harness}\`; ` +
        "a run may land only on a tuple its scenario's target binding declares (R-TUPLE-1).",
    );
  }
  if (entry.tuple.harness !== record.harness) {
    throw new OperationError(
      `Harness mismatch: ${label} is \`${entry.tuple.harness}\` but the record ran ` +
        `\`${record.harness}\`; evidence never crosses harnesses (R-TUPLE-1).`,
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
  const specSimulates = binding.harnessExecution.mode === "faithful-simulation";
  if (record.simulated !== specSimulates) {
    throw new OperationError(
      `Result record \`${record.resultId}\` records simulated=${String(record.simulated)} but scenario ` +
        `\`${spec.scenarioId}\` declares ${binding.harnessExecution.mode} for target \`${record.harness}\`; ` +
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
 * scenario definitions: every `plannedScenarios` id resolves to a loaded
 * definition that binds the entry's harness as a target whose
 * `registryTupleIds` include the entry, every target binding's
 * `registryTupleIds` resolves to an entry on the same harness whose
 * `plannedScenarios` carries the definition back, and a planned scenario
 * never pre-binds the tuple's `scenario` dimension. Returns human-readable
 * errors; empty means the linkage holds.
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
          `entry \`${entry.id}\` plans scenario \`${scenarioId}\` but no definition with that id is authored under ${CONFORMANCE_SCENARIO_SPECS_DIR}`,
        );
        continue;
      }
      const binding = spec.packagingExtension.targets[entry.tuple.harness];
      if (!binding) {
        errors.push(
          `entry \`${entry.id}\` (harness \`${entry.tuple.harness}\`) plans scenario \`${scenarioId}\` ` +
            `which binds no \`${entry.tuple.harness}\` target; an uncovered target is a reported gap (R-SCHEMA-2)`,
        );
        continue;
      }
      if (!binding.registryTupleIds.includes(entry.id)) {
        errors.push(
          `entry \`${entry.id}\` plans scenario \`${scenarioId}\` but that definition's ` +
            `\`${entry.tuple.harness}\` target binding does not target the entry`,
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
    for (const [harness, binding] of Object.entries(spec.packagingExtension.targets)) {
      for (const entryId of binding.registryTupleIds) {
        const entry = entriesById.get(entryId);
        if (!entry) {
          errors.push(
            `scenario \`${spec.scenarioId}\` (target \`${harness}\`) targets registry entry \`${entryId}\` which does not exist`,
          );
          continue;
        }
        if (entry.tuple.harness !== harness) {
          errors.push(
            `scenario \`${spec.scenarioId}\` binds target \`${harness}\` onto entry \`${entryId}\` ` +
              `whose tuple harness is \`${entry.tuple.harness}\`; evidence never crosses harnesses (R-TUPLE-1)`,
          );
        }
        if (!entry.plannedScenarios.includes(spec.scenarioId)) {
          errors.push(
            `scenario \`${spec.scenarioId}\` targets entry \`${entryId}\` but the entry does not plan it back; the linkage is bidirectional (t9)`,
          );
        }
      }
    }
  }
  return errors;
}

/** The required first-pass scenario ids not yet authored as definitions (R-SCHEMA-3, pre-figuring R-TEST-2). */
export function listMissingRequiredFirstPassScenarioIds(
  specs: PackagingConformanceScenarioSpec[],
): RequiredFirstPassScenarioId[] {
  const authored = new Set(specs.map((spec) => spec.scenarioId));
  return (Object.keys(REQUIRED_FIRST_PASS_SCENARIOS) as RequiredFirstPassScenarioId[]).filter(
    (scenarioId) => !authored.has(scenarioId),
  );
}
