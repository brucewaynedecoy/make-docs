import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseAndValidatePlaybook, type PlaybookModel } from "../../playbook";
import { listHarnessRegistryEntries } from "../harness-registry";
import { resolvePlaybook } from "../playbook";
import { findRepoRoot, repoRelativePath } from "../shared";
import { OperationError, type JsonValue } from "../types";
import {
  buildPackageDistributable,
  deriveImpliedAgentics,
  projectPlaybookToSkill,
  type PackageDistributable,
} from "./distributable";
import {
  PLAYBOOK_PACKAGE_OUTPUT_KINDS,
  PLAYBOOK_PACKAGE_SCOPES,
  PLAYBOOK_PACKAGE_SURFACES,
  type AgentAssistedProposal,
  type GeneratedArtifactPlan,
  type PackagePlanDryRun,
  type PackagePlanFieldProvenance,
  type PackagePlanStop,
  type PackagePlanSupport,
  type PackageUnresolvedDecision,
  type PlaybookPackagePlan,
  type PlaybookPackagePlannerInput,
  type SourcePlaybookRef,
} from "./types";
import { validatePackagePlan, validatePackageTarget } from "./validation";

const MARKDOWN_LINK_PATTERN = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)|^\s*\[[^\]]+\]:\s+(\S+)/gm;

export function createPlaybookPackagePlan(input: PlaybookPackagePlannerInput): PackagePlanDryRun {
  const repoRoot = findRepoRoot(input.repoRoot);
  const target = validatePackageTarget(input.target);
  const stops: PackagePlanStop[] = [];
  const sources = resolveSourcePlaybooks({
    repoRoot,
    refs: input.refs,
    requestedStack: input.requestedStack,
    stops,
  });
  for (const source of sources) {
    stops.push(...validateSourceLinks(repoRoot, source));
  }

  const packageId = input.packageId ?? derivePackageId(sources);
  const title = input.title ?? deriveTitle(sources);
  const summary = input.summary ?? deriveSummary(sources);
  const fieldProvenance: Record<string, PackagePlanFieldProvenance> = {
    packageId: input.packageId ? "user-supplied" : "deterministic",
    title: input.title ? "user-supplied" : "deterministic",
    summary: input.summary ? "user-supplied" : "deterministic",
    target: "user-supplied",
    sources: "deterministic",
    generatedArtifacts: "deterministic",
    support: input.supportEvidenceRefs?.length ? "user-supplied" : "unresolved",
  };
  const generatedArtifacts = planGeneratedArtifacts({
    packageId,
    sourceRefs: sources.map((source) => source.ref),
    target,
  });
  // Two-granularities distributable (W18 R8 P1, R-CAP-3/R-CAP-4): the parsed
  // W18 R6 model supplies the implied agentics, the harness capability
  // descriptor drives adapter-side container selection, and every degradation
  // or fail-closed stop is declared in the plan — the planner itself stays
  // harness-neutral by delegating through the shared harness registry.
  const distributable = buildPlanDistributable({ repoRoot, sources, input, target });
  stops.push(...distributable.containerSelection.stops);
  fieldProvenance.distributable = "deterministic";
  fieldProvenance["distributable.unsupportedPrimitivePolicy"] = input.unsupportedPrimitivePolicy
    ? "user-supplied"
    : "deterministic";
  const agentAssistedProposals: AgentAssistedProposal[] = [];
  const unresolvedDecisions: PackageUnresolvedDecision[] = [];

  if (sources.length > 1 && !input.summary) {
    agentAssistedProposals.push({
      field: "summary",
      value: summary,
      reason: "Multi-Playbook package summaries may need semantic review before publication.",
    });
    fieldProvenance.summary = "agent-proposed";
  }
  if (target.surface === "auto") {
    unresolvedDecisions.push({
      id: "surface-resolution",
      question: "Select a concrete adapter-ranked surface before package outputs are written.",
    });
    stops.push({
      reason: "manual-review-required",
      message: "`auto` surface requires adapter resolution and review before writes.",
    });
    fieldProvenance["target.surface"] = "unresolved";
  }
  if (!input.supportEvidenceRefs || input.supportEvidenceRefs.length === 0) {
    stops.push({
      reason: "missing-support-evidence",
      message: "Support claims remain provisional until evidence refs are supplied for the exact package tuple.",
    });
  }
  for (const output of input.existingGeneratedOutputs ?? []) {
    if (output.state !== "clean-managed") {
      stops.push({
        reason: output.state === "modified-managed" ? "ownership-review-required" : "manual-review-required",
        message: `Existing generated output at ${output.path} is ${output.state} and requires review before writes.`,
        path: output.path,
      });
    }
  }

  const reviewRequired = stops.length > 0 || agentAssistedProposals.length > 0 || unresolvedDecisions.length > 0;
  const reviewStatus = input.reviewStatus ?? (reviewRequired ? "required" : "not-required");
  const plan = validatePackagePlan({
    schemaVersion: 1,
    packageId,
    title,
    summary,
    sources,
    target,
    generatedArtifacts,
    deterministicDerivations: buildDerivations(sources, packageId, generatedArtifacts, distributable),
    agentAssistedProposals,
    unresolvedDecisions,
    fieldProvenance,
    review: {
      required: reviewRequired,
      status: reviewStatus,
      ...(input.reviewedBy ? { reviewedBy: input.reviewedBy } : {}),
      ...(reviewRequired ? { reason: buildReviewReason(stops, agentAssistedProposals, unresolvedDecisions) } : {}),
    },
    support: buildSupport(input.supportEvidenceRefs),
    lifecycle: {
      backupBeforeOverwrite: true,
      uninstallDisposition: target.scope === "export-only" ? "export-only" : "preserve-for-review",
      preservesUserModifiedFiles: true,
    },
    validationRequirements: [
      "playbook-source-validation",
      "relative-link-validation",
      "package-plan-review",
      "support-claim-evidence",
    ],
    distributable,
  });
  const status = reviewRequired
    ? stops.some((stop) => stop.reason === "source-invalid" || stop.reason === "unresolved-target" || stop.reason === "ambiguous-source" || stop.reason === "manual-review-required")
      ? "manual-review-required"
      : "review-required"
    : "ready";
  if (input.nonInteractive && status !== "ready") {
    throw new OperationError(`Package planning stopped before writes: ${stops.map((stop) => stop.reason).join(", ") || "review-required"}.`);
  }
  return {
    status,
    plan,
    stops,
    lines: renderPackagePlanDryRunLines(plan, stops),
    writesPlanned: false,
  };
}

export function readPlaybookPackagePlan(input: PlaybookPackagePlannerInput): {
  value: JsonValue;
  provenance: {
    domain: "playbook-packaging";
    operation: "playbook-package-plan";
    source: "shared";
    target?: string;
  };
} {
  return {
    value: createPlaybookPackagePlan(input) as unknown as JsonValue,
    provenance: {
      domain: "playbook-packaging",
      operation: "playbook-package-plan",
      source: "shared",
      target: input.refs.join(","),
    },
  };
}

export function renderPackagePlanDryRunLines(plan: PlaybookPackagePlan, stops: PackagePlanStop[]): string[] {
  return [
    `Package plan: ${plan.packageId}`,
    `Target: ${plan.target.harness} ${plan.target.outputKind} ${plan.target.surface} ${plan.target.scope}`,
    `Sources: ${plan.sources.map((source) => `${source.ref}@${source.sourceDigest}`).join(", ")}`,
    `Generated artifacts: ${plan.generatedArtifacts.length}`,
    ...plan.generatedArtifacts.map((artifact) => `- ${artifact.recordKind}: ${artifact.path}`),
    ...renderDistributableLines(plan.distributable),
    `Review: ${plan.review.status}${plan.review.required ? " required" : ""}`,
    `Support: ${plan.support.status}`,
    `Writes planned: no`,
    ...(stops.length === 0 ? ["Stops: none"] : ["Stops:", ...stops.map((stop) => `- ${stop.reason}: ${stop.message}`)]),
  ];
}

/** Declared container selection and degradations, visible in the reviewed plan (R-CAP-4). */
function renderDistributableLines(distributable: PackageDistributable | undefined): string[] {
  if (!distributable) {
    return [];
  }
  const selection = distributable.containerSelection;
  return [
    `Distributable: ${distributable.profile} profile via ${selection.containerId ? `${selection.containerKind} \`${selection.containerId}\`` : "no resolved container"}${distributable.bundle ? " (bundle)" : ""}`,
    `Skills: ${distributable.skills.map((skill) => skill.skillId).join(", ")}`,
    ...(selection.declaredDegradations.length === 0
      ? []
      : ["Declared degradations:", ...selection.declaredDegradations.map((degradation) => `- ${degradation}`)]),
  ];
}

function resolveSourcePlaybooks(input: {
  repoRoot: string;
  refs: string[];
  requestedStack?: "build" | "run" | null;
  stops: PackagePlanStop[];
}): SourcePlaybookRef[] {
  if (input.refs.length === 0) {
    throw new OperationError("At least one source Playbook ref is required.");
  }
  const sources: SourcePlaybookRef[] = [];
  const seen = new Set<string>();
  for (const ref of input.refs) {
    try {
      const resolution = resolvePlaybook({
        repoRoot: input.repoRoot,
        ref,
        requestedStack: input.requestedStack,
      });
      const filePath = path.join(input.repoRoot, resolution.entry.path);
      const source: SourcePlaybookRef = {
        ref: resolution.entry.ref,
        path: resolution.entry.path,
        persona: resolution.entry.persona,
        slug: resolution.entry.slug,
        stack: resolution.entry.stack,
        sourceDigest: digestFile(filePath),
        title: resolution.entry.title,
      };
      if (!seen.has(source.ref)) {
        sources.push(source);
        seen.add(source.ref);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      input.stops.push({ reason: classifySourceError(message), message, ref });
    }
  }
  if (sources.length === 0) {
    throw new OperationError(`No valid source Playbooks resolved. ${input.stops.map((stop) => stop.message).join(" ")}`);
  }
  return sources;
}

function validateSourceLinks(repoRoot: string, source: SourcePlaybookRef): PackagePlanStop[] {
  const absolutePath = path.join(repoRoot, source.path);
  const body = stripMarkdownCode(readFileSync(absolutePath, "utf8"));
  const stops: PackagePlanStop[] = [];
  for (const target of extractMarkdownTargets(body)) {
    if (isExternalTarget(target) || target.startsWith("#")) {
      continue;
    }
    const [fileTarget] = target.split("#", 1);
    if (!fileTarget) {
      continue;
    }
    const decoded = safeDecode(fileTarget);
    const resolved = path.resolve(path.dirname(absolutePath), decoded);
    const relative = repoRelativePath(resolved, repoRoot) ?? decoded;
    if (!existsSync(resolved)) {
      stops.push({
        reason: "unresolved-target",
        message: `Playbook ${source.ref} links to missing target ${target}.`,
        ref: source.ref,
        path: relative,
      });
    }
  }
  return stops;
}

function extractMarkdownTargets(markdown: string): string[] {
  const targets: string[] = [];
  for (const match of markdown.matchAll(MARKDOWN_LINK_PATTERN)) {
    const target = match[1] ?? match[2];
    if (target) {
      targets.push(target.trim());
    }
  }
  return targets;
}

function stripMarkdownCode(markdown: string): string {
  const withoutFences = markdown.replace(/```[\s\S]*?```/g, "");
  return withoutFences.replace(/`[^`\n]*`/g, "");
}

function isExternalTarget(target: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("//");
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function digestFile(filePath: string): string {
  return `sha256:${createHash("sha256").update(readFileSync(filePath)).digest("hex")}`;
}

function classifySourceError(message: string): PackagePlanStop["reason"] {
  if (message.startsWith("Ambiguous")) {
    return "ambiguous-source";
  }
  if (message.includes("No playbook found") || message.includes("does not exist")) {
    return "unresolved-target";
  }
  return "source-invalid";
}

function derivePackageId(sources: SourcePlaybookRef[]): string {
  return sources.map((source) => source.slug).join("-");
}

function deriveTitle(sources: SourcePlaybookRef[]): string {
  if (sources.length === 1) {
    return sources[0]!.title ?? sources[0]!.slug;
  }
  return `${sources[0]!.title ?? sources[0]!.slug} Bundle`;
}

function deriveSummary(sources: SourcePlaybookRef[]): string {
  return sources.length === 1
    ? `Package ${sources[0]!.ref} for a supported harness.`
    : `Package ${sources.length} Playbooks for a supported harness.`;
}

function planGeneratedArtifacts(input: {
  packageId: string;
  sourceRefs: string[];
  target: PlaybookPackagePlan["target"];
}): GeneratedArtifactPlan[] {
  const sharedAgenticsRoot = input.target.scope === "global"
    ? "<user-home>/.make-docs/agentics"
    : ".make-docs/agentics";
  const basePath = input.target.scope === "export-only"
    ? `.make-docs/exports/playbook-packages/${input.packageId}`
    : input.target.outputKind === "plugin"
      ? `${sharedAgenticsRoot}/plugins/${input.packageId}`
      : `${sharedAgenticsRoot}/skills/${input.packageId}`;
  const artifactPath = input.target.outputKind === "plugin"
    ? `${basePath}/plugin.json`
    : `${basePath}/SKILL.md`;
  return [
    {
      path: artifactPath,
      recordKind: input.target.scope === "export-only"
        ? "export-only-file"
        : input.target.outputKind === "plugin"
          ? "generated-plugin"
          : "generated-skills-bundle",
      outputKind: input.target.outputKind,
      surface: input.target.surface,
      sourceRefs: input.sourceRefs,
    },
  ];
}

function buildDerivations(
  sources: SourcePlaybookRef[],
  packageId: string,
  generatedArtifacts: GeneratedArtifactPlan[],
  distributable: PackageDistributable,
): Record<string, string> {
  return {
    packageId,
    sourceDigests: sources.map((source) => `${source.ref}=${source.sourceDigest}`).join(";"),
    generatedArtifacts: generatedArtifacts.map((artifact) => artifact.path).join(";"),
    // Container selection and degradation provenance (R-CAP-4): the declared
    // choice is recorded deterministically, never silent.
    distributableProfile: distributable.profile,
    distributableSkills: distributable.skills.map((skill) => skill.skillId).join(";"),
    unsupportedPrimitivePolicy: distributable.containerSelection.policy,
    ...(distributable.containerSelection.containerId
      ? { distributableContainer: distributable.containerSelection.containerId }
      : {}),
    ...(distributable.containerSelection.declaredDegradations.length > 0
      ? { declaredDegradations: distributable.containerSelection.declaredDegradations.join(" | ") }
      : {}),
  };
}

/**
 * Parses each source through the W18 R6 model (fail-soft; the model is never
 * re-derived from ad-hoc Markdown scans, R-SCOPE-1), projects one skill per
 * Playbook, derives the implied agentics, and runs descriptor-driven
 * container selection through the shared harness registry (R-CAP-3, R-CAP-4).
 */
function buildPlanDistributable(context: {
  repoRoot: string;
  sources: SourcePlaybookRef[];
  input: PlaybookPackagePlannerInput;
  target: PlaybookPackagePlan["target"];
}): PackageDistributable {
  const models = new Map<string, PlaybookModel>();
  for (const source of context.sources) {
    const absolutePath = path.join(context.repoRoot, source.path);
    const { model } = parseAndValidatePlaybook({
      sourcePath: source.path,
      source: readFileSync(absolutePath, "utf8"),
    });
    models.set(source.ref, model);
  }
  const descriptor = listHarnessRegistryEntries({ descriptors: context.input.descriptors })
    .find((entry) => entry.harnessId === context.target.harness)?.descriptor ?? null;
  return buildPackageDistributable({
    harnessId: context.target.harness,
    descriptor,
    outputKind: context.target.outputKind,
    skills: context.sources.map((source) => projectPlaybookToSkill(source, models.get(source.ref))),
    impliedAgentics: context.sources.flatMap((source) => {
      const model = models.get(source.ref);
      return model ? deriveImpliedAgentics({ model, sourceRef: source.ref }) : [];
    }),
    ...(context.input.unsupportedPrimitivePolicy
      ? { policy: context.input.unsupportedPrimitivePolicy }
      : {}),
  });
}

function buildReviewReason(
  stops: PackagePlanStop[],
  proposals: AgentAssistedProposal[],
  decisions: PackageUnresolvedDecision[],
): string {
  const reasons = [
    ...stops.map((stop) => stop.reason),
    ...proposals.map((proposal) => `proposal:${proposal.field}`),
    ...decisions.map((decision) => `decision:${decision.id}`),
  ];
  return reasons.length === 0 ? "No review required." : `Review required for ${[...new Set(reasons)].join(", ")}.`;
}

function buildSupport(evidenceRefs: string[] | undefined): PackagePlanSupport {
  return evidenceRefs && evidenceRefs.length > 0
    ? { status: "validated", evidenceRefs }
    : { status: "provisional", evidenceRefs: [] };
}

export function assertPlannerEnumsAreCurrent(): void {
  for (const value of PLAYBOOK_PACKAGE_OUTPUT_KINDS) {
    if (value !== "plugin" && value !== "skills-bundle") {
      throw new OperationError(`Unsupported package output kind: ${value}`);
    }
  }
  for (const value of PLAYBOOK_PACKAGE_SURFACES) {
    if (value !== "native" && value !== "agents-standard" && value !== "auto") {
      throw new OperationError(`Unsupported package surface: ${value}`);
    }
  }
  for (const value of PLAYBOOK_PACKAGE_SCOPES) {
    if (value !== "project" && value !== "global" && value !== "export-only") {
      throw new OperationError(`Unsupported package scope: ${value}`);
    }
  }
}
