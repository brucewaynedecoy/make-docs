import { z } from "zod";
import type { OperationExecutionContext } from "../../context";
import {
  PLAYBOOK_PACKAGE_REVIEW_STATUSES,
  UNSUPPORTED_PRIMITIVE_POLICIES,
  type PackagePlanDryRun,
  type PackagePlanStop,
  type PlaybookPackageWriteResult,
} from "../../playbook-packaging";
import {
  invokeOperation,
  operationCliCommand,
  type OperationDefinition,
} from "../../registry";
import type { JsonValue } from "../../types";
import {
  packagePlatformSchema,
  packagePreconditionStatesSchema,
  packageTargetSchema,
} from "./shared";

/**
 * `package.ship` (W18 R12 P3; PRD 41 R-GRAM-3): the composite single-entry
 * packaging operation. A real registered operation per the W18 R11 parity
 * rule (every CLI path mirrors a registry identifier — no CLI-only
 * composites), surfaced as `run package ship` and derived to MCP like every
 * other operation.
 *
 * Semantics: execute plan -> preview -> write THROUGH THE OPERATION CORE
 * (each leg is a nested `invokeOperation` of the registered granular
 * operation, so validation, write gating, dry-run, and named approvals are
 * enforced uniformly), aborting at the FIRST stop, unresolved proposal, or
 * warning with guidance naming the granular command to continue with. The
 * write leg runs only after a clean plan and a clean full-pipeline preview,
 * so every PRD 36 fail-before-write rail is preserved unchanged — ship never
 * widens what `package.write` allows; it only removes ceremony from the
 * zero-unresolved path.
 */

const inputSchema = z.object({
  repoRoot: z.string().optional(),
  homeDir: z.string().optional(),
  refs: z.array(z.string().min(1)).min(1),
  requestedStack: z.enum(["build", "run"]).nullable().optional(),
  target: packageTargetSchema,
  packageId: z.string().optional(),
  title: z.string().optional(),
  summary: z.string().optional(),
  reviewStatus: z.enum(PLAYBOOK_PACKAGE_REVIEW_STATUSES).optional(),
  reviewedBy: z.string().optional(),
  supportEvidenceRefs: z.array(z.string()).optional(),
  unsupportedPrimitivePolicy: z.enum(UNSUPPORTED_PRIMITIVE_POLICIES).optional(),
  platform: packagePlatformSchema.optional(),
  symlinkAvailable: z.boolean().optional(),
  preconditions: packagePreconditionStatesSchema.optional(),
});

type PackageShipInput = z.infer<typeof inputSchema>;

export type PackageShipStage = "plan" | "preview" | "write";

export interface PackageShipResult {
  /** `shipped` wrote outputs; `planned` is the dry-run pass; `aborted` stopped. */
  status: "shipped" | "planned" | "aborted";
  /** The pipeline leg the composite finished or aborted at. */
  stage: PackageShipStage;
  /** On abort: the granular command to continue with (R-GRAM-3); null when shipped. */
  guidance: string | null;
  plan: PackagePlanDryRun | null;
  preview: PlaybookPackageWriteResult | null;
  write: PlaybookPackageWriteResult | null;
  /** The stops of the aborting leg; empty when the composite ran end-to-end. */
  stops: PackagePlanStop[];
  lines: string[];
}

/**
 * The CLI spelling of the `package.preview` intent. Preview is a CLI spelling
 * over `package.write` with the dry-run context (R-GRAM-2), not a registry
 * identifier, so the guidance string is derived from the write identifier's
 * CLI path with the leading verb swapped — kept adjacent to the abort logic
 * so grammar changes surface here.
 */
function previewCliCommand(): string {
  return operationCliCommand("package.write").replace(/ write$/, " preview");
}

function abortResult(input: {
  stage: PackageShipStage;
  guidance: string;
  plan: PackagePlanDryRun | null;
  preview?: PlaybookPackageWriteResult | null;
  stops: PackagePlanStop[];
  reasonLine: string;
}): PackageShipResult {
  return {
    status: "aborted",
    stage: input.stage,
    guidance: input.guidance,
    plan: input.plan,
    preview: input.preview ?? null,
    write: null,
    stops: input.stops,
    lines: [
      `Package ship aborted at ${input.stage}: ${input.reasonLine}`,
      ...input.stops.map((stop) => `Stop: ${stop.reason} - ${stop.message}`),
      `Continue with: ${input.guidance}`,
    ],
  };
}

async function runShipPipeline(
  input: PackageShipInput,
  context: OperationExecutionContext,
): Promise<PackageShipResult> {
  const planInput = {
    repoRoot: input.repoRoot,
    refs: input.refs,
    requestedStack: input.requestedStack,
    target: input.target,
    packageId: input.packageId,
    title: input.title,
    summary: input.summary,
    reviewStatus: input.reviewStatus,
    reviewedBy: input.reviewedBy,
    supportEvidenceRefs: input.supportEvidenceRefs,
    unsupportedPrimitivePolicy: input.unsupportedPrimitivePolicy,
  };
  const planInvocation = await invokeOperation("package.plan", planInput, context);
  const plan = planInvocation.value as unknown as PackagePlanDryRun;

  // First-stop abort (R-GRAM-3): any stop, agent-assisted proposal, or
  // unresolved decision means the plan needs human judgment; ship stops
  // before the pipeline touches anything and names the plan command.
  if (
    plan.status !== "ready" ||
    plan.stops.length > 0 ||
    plan.plan.agentAssistedProposals.length > 0 ||
    plan.plan.unresolvedDecisions.length > 0
  ) {
    return abortResult({
      stage: "plan",
      guidance: `${operationCliCommand("package.plan")} (review the plan, resolve every item, then re-run ship or continue granularly)`,
      plan,
      stops: plan.stops,
      reasonLine:
        plan.stops.length > 0
          ? `the plan reported ${plan.stops.length} stop(s).`
          : "the plan carries unresolved proposals or decisions requiring review.",
    });
  }

  const writeInput = {
    repoRoot: input.repoRoot,
    homeDir: input.homeDir,
    plan: plan.plan as unknown as JsonValue,
    platform: input.platform,
    symlinkAvailable: input.symlinkAvailable,
    preconditions: input.preconditions,
  };

  // Preview leg: the FULL write pipeline with no writes — every diagnostic,
  // stop, and generated-output record — via the operation core's dry-run
  // context, exactly what `run package preview` spells (R-GRAM-1).
  const previewInvocation = await invokeOperation("package.write", writeInput, {
    ...context,
    dryRun: true,
  });
  const preview = previewInvocation.value as unknown as PlaybookPackageWriteResult;
  if (preview.stops.length > 0 || preview.status !== "ready") {
    return abortResult({
      stage: "preview",
      guidance: `${previewCliCommand()} (inspect the stops, then ${operationCliCommand("package.write")} once resolved)`,
      plan,
      preview,
      stops: preview.stops,
      reasonLine: `the write pipeline reported ${preview.stops.length} stop(s) before writing.`,
    });
  }

  // Write leg: the classification write this operation's `mutates: "write"`
  // declares. The nested `package.write` recomputes every fail-before-write
  // stop itself and throws rather than writing if anything changed since the
  // preview. Under a dry-run context this leg plans instead of writing.
  const writeInvocation = await invokeOperation("package.write", writeInput, context);
  const write = writeInvocation.value as unknown as PlaybookPackageWriteResult;
  const dryRun = context.dryRun;
  return {
    status: dryRun ? "planned" : "shipped",
    stage: "write",
    guidance: null,
    plan,
    preview,
    write,
    stops: [],
    lines: [
      `Package ship ${dryRun ? "planned (dry-run)" : "completed"}: ${write.packageId}`,
      `Plan: ready (no stops, no unresolved items)`,
      `Preview: ready (full pipeline, no writes)`,
      `Write: ${write.status}`,
      ...write.filesWritten.map((file) => `- wrote: ${file}`),
      `Manifest updated: ${write.manifestUpdated ? "yes" : "no"}`,
    ],
  };
}

const definition: OperationDefinition<PackageShipInput> = {
  id: "package.ship",
  summary:
    "Ship a Playbook package end-to-end (plan, preview, write) through the operation core, aborting at the first stop, unresolved proposal, or warning with granular-command guidance.",
  mutates: "write",
  status: "active",
  inputSchema,
  handler(input, context) {
    return runShipPipeline(input, context) as unknown as Promise<JsonValue>;
  },
};

export const packageShipOperation = definition as OperationDefinition;
