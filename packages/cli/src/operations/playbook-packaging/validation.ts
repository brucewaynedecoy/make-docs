import { OperationError, type JsonValue } from "../types";
import {
  GENERATED_OUTPUT_RECORD_KINDS,
  PACKAGE_ADAPTER_EXPOSURE_MODES,
  PACKAGE_PLAN_FIELD_PROVENANCE,
  PLAYBOOK_PACKAGE_OUTPUT_KINDS,
  PLAYBOOK_PACKAGE_REVIEW_STATUSES,
  PLAYBOOK_PACKAGE_SCOPES,
  PLAYBOOK_PACKAGE_SUPPORT_STATUSES,
  PLAYBOOK_PACKAGE_SURFACES,
  type AgentAssistedProposal,
  type GeneratedArtifactPlan,
  type GeneratedOutputRecord,
  type GeneratedOutputRecordKind,
  type HarnessPackageAdapterDeclaration,
  type PackageAdapterConformanceRequirement,
  type PackageAdapterLifecycleRule,
  type PackageAdapterPathTemplate,
  type PackageAdapterPrecondition,
  type PackagePlanFieldProvenance,
  type PackagePlanLifecycle,
  type PackagePlanReview,
  type PackagePlanSupport,
  type PackageUnresolvedDecision,
  type PlaybookPackageOutputKind,
  type PlaybookPackagePlan,
  type PlaybookPackageReviewStatus,
  type PlaybookPackageScope,
  type PlaybookPackageSurface,
  type PlaybookPackageTarget,
  type PlaybookPackageSupportStatus,
  type SourcePlaybookRef,
  type PackageAdapterExposureMode,
} from "./types";

export function validatePackagePlan(value: unknown): PlaybookPackagePlan {
  const record = requireRecord(value, "package plan");
  const plan: PlaybookPackagePlan = {
    schemaVersion: requireLiteral(record.schemaVersion, 1, "package plan schemaVersion"),
    packageId: requireNonEmptyString(record.packageId, "package plan packageId"),
    title: requireNonEmptyString(record.title, "package plan title"),
    summary: requireNonEmptyString(record.summary, "package plan summary"),
    sources: requireRecordArray(record.sources, "package plan sources").map(validateSourcePlaybookRef),
    target: validatePackageTarget(record.target),
    generatedArtifacts: requireRecordArray(record.generatedArtifacts, "package plan generatedArtifacts")
      .map(validateGeneratedArtifactPlan),
    deterministicDerivations: validateStringRecord(record.deterministicDerivations, "package plan deterministicDerivations"),
    agentAssistedProposals: requireRecordArray(record.agentAssistedProposals, "package plan agentAssistedProposals")
      .map(validateAgentAssistedProposal),
    unresolvedDecisions: requireRecordArray(record.unresolvedDecisions, "package plan unresolvedDecisions")
      .map(validateUnresolvedDecision),
    fieldProvenance: validateFieldProvenance(record.fieldProvenance, "package plan fieldProvenance"),
    review: validatePackagePlanReview(record.review),
    support: validatePackagePlanSupport(record.support),
    lifecycle: validatePackagePlanLifecycle(record.lifecycle),
    validationRequirements: requireStringArray(record.validationRequirements, "package plan validationRequirements"),
  };

  if (plan.sources.length === 0) {
    throw new OperationError("Package plan must include at least one source Playbook.");
  }
  assertReviewState(plan);
  return plan;
}

export function validateGeneratedOutputRecord(value: unknown): GeneratedOutputRecord {
  const record = requireRecord(value, "generated output record");
  const target = record.target === undefined ? undefined : validatePackageTarget(record.target);
  const support = record.support === undefined ? undefined : validatePackagePlanSupport(record.support);
  return {
    schemaVersion: requireLiteral(record.schemaVersion, 1, "generated output record schemaVersion"),
    recordKind: requireEnum(record.recordKind, GENERATED_OUTPUT_RECORD_KINDS, "generated output record recordKind"),
    path: requireNonEmptyString(record.path, "generated output record path"),
    sourceRefs: requireStringArray(record.sourceRefs, "generated output record sourceRefs"),
    sourceDigests: requireStringArray(record.sourceDigests, "generated output record sourceDigests"),
    ...(target ? { target } : {}),
    ...(support ? { support } : {}),
    lifecycle: validatePackagePlanLifecycle(record.lifecycle),
    reviewStatus: requireEnum(record.reviewStatus, PLAYBOOK_PACKAGE_REVIEW_STATUSES, "generated output record reviewStatus"),
  };
}

export function validateHarnessAdapterDeclaration(value: unknown): HarnessPackageAdapterDeclaration {
  const record = requireRecord(value, "harness adapter declaration");
  const adapter: HarnessPackageAdapterDeclaration = {
    harnessId: validateHarnessId(record.harnessId, "harness adapter harnessId"),
    supportedOutputKinds: requireEnumArray(
      record.supportedOutputKinds,
      PLAYBOOK_PACKAGE_OUTPUT_KINDS,
      "harness adapter supportedOutputKinds",
    ),
    supportedSurfaces: requireEnumArray(
      record.supportedSurfaces,
      PLAYBOOK_PACKAGE_SURFACES,
      "harness adapter supportedSurfaces",
    ),
    supportedScopes: requireEnumArray(record.supportedScopes, PLAYBOOK_PACKAGE_SCOPES, "harness adapter supportedScopes"),
    pathTemplates: requireRecordArray(record.pathTemplates, "harness adapter pathTemplates")
      .map(validateAdapterPathTemplate),
    preconditions: requireRecordArray(record.preconditions, "harness adapter preconditions")
      .map(validateAdapterPrecondition),
    preferredExposureMode: requireEnum(
      record.preferredExposureMode,
      PACKAGE_ADAPTER_EXPOSURE_MODES,
      "harness adapter preferredExposureMode",
    ),
    fallbackExposureMode: requireEnum(
      record.fallbackExposureMode,
      PACKAGE_ADAPTER_EXPOSURE_MODES,
      "harness adapter fallbackExposureMode",
    ),
    ownershipClasses: requireEnumArray(
      record.ownershipClasses,
      GENERATED_OUTPUT_RECORD_KINDS,
      "harness adapter ownershipClasses",
    ),
    lifecycleRules: requireRecordArray(record.lifecycleRules, "harness adapter lifecycleRules")
      .map(validateAdapterLifecycleRule),
    conformanceRequirements: requireRecordArray(
      record.conformanceRequirements,
      "harness adapter conformanceRequirements",
    ).map(validateAdapterConformanceRequirement),
  };

  if (adapter.supportedOutputKinds.length === 0) {
    throw new OperationError("Harness adapter must support at least one output kind.");
  }
  if (adapter.supportedSurfaces.length === 0) {
    throw new OperationError("Harness adapter must support at least one surface.");
  }
  for (const template of adapter.pathTemplates) {
    if (!adapter.supportedOutputKinds.includes(template.outputKind)) {
      throw new OperationError(`Harness adapter path template uses unsupported output kind \`${template.outputKind}\`.`);
    }
    if (!adapter.supportedSurfaces.includes(template.surface)) {
      throw new OperationError(`Harness adapter path template uses unsupported surface \`${template.surface}\`.`);
    }
    if (!adapter.supportedScopes.includes(template.scope)) {
      throw new OperationError(`Harness adapter path template uses unsupported scope \`${template.scope}\`.`);
    }
  }
  return adapter;
}

export function validatePackageTarget(value: unknown): PlaybookPackageTarget {
  const record = requireRecord(value, "package target");
  return {
    harness: validateHarnessId(record.harness, "package target harness"),
    outputKind: requireEnum(record.outputKind, PLAYBOOK_PACKAGE_OUTPUT_KINDS, "package target outputKind"),
    surface: requireEnum(record.surface, PLAYBOOK_PACKAGE_SURFACES, "package target surface"),
    scope: requireEnum(record.scope, PLAYBOOK_PACKAGE_SCOPES, "package target scope"),
  };
}

export function validateHarnessId(value: unknown, label = "harness id"): string {
  const harnessId = requireNonEmptyString(value, label);
  if (harnessId === "generic") {
    throw new OperationError("`generic` is a surface/profile concept, not a harness id.");
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(harnessId)) {
    throw new OperationError(`${label} must be a lowercase slug.`);
  }
  return harnessId;
}

function validateSourcePlaybookRef(record: Record<string, JsonValue>): SourcePlaybookRef {
  return {
    ref: requireNonEmptyString(record.ref, "source Playbook ref"),
    path: requireNonEmptyString(record.path, "source Playbook path"),
    persona: requireNonEmptyString(record.persona, "source Playbook persona"),
    slug: requireNonEmptyString(record.slug, "source Playbook slug"),
    stack: requireEnum(record.stack, ["build", "run"] as const, "source Playbook stack"),
    sourceDigest: requireNonEmptyString(record.sourceDigest, "source Playbook digest"),
    ...(typeof record.title === "string" ? { title: record.title } : {}),
  };
}

function validateGeneratedArtifactPlan(record: Record<string, JsonValue>): GeneratedArtifactPlan {
  return {
    path: requireNonEmptyString(record.path, "generated artifact path"),
    recordKind: requireEnum(record.recordKind, GENERATED_OUTPUT_RECORD_KINDS, "generated artifact recordKind"),
    outputKind: requireEnum(record.outputKind, PLAYBOOK_PACKAGE_OUTPUT_KINDS, "generated artifact outputKind"),
    surface: requireEnum(record.surface, PLAYBOOK_PACKAGE_SURFACES, "generated artifact surface"),
    sourceRefs: requireStringArray(record.sourceRefs, "generated artifact sourceRefs"),
  };
}

function validateAgentAssistedProposal(record: Record<string, JsonValue>): AgentAssistedProposal {
  return {
    field: requireNonEmptyString(record.field, "agent-assisted proposal field"),
    value: requireJsonValue(record.value, "agent-assisted proposal value"),
    reason: requireNonEmptyString(record.reason, "agent-assisted proposal reason"),
  };
}

function validateUnresolvedDecision(record: Record<string, JsonValue>): PackageUnresolvedDecision {
  return {
    id: requireNonEmptyString(record.id, "unresolved decision id"),
    question: requireNonEmptyString(record.question, "unresolved decision question"),
  };
}

function validateFieldProvenance(value: unknown, label: string): Record<string, PackagePlanFieldProvenance> {
  const record = requireRecord(value, label);
  return Object.fromEntries(
    Object.entries(record).map(([key, item]) => [
      key,
      requireEnum(item, PACKAGE_PLAN_FIELD_PROVENANCE, `${label}.${key}`),
    ]),
  );
}

function validatePackagePlanReview(value: unknown): PackagePlanReview {
  const record = requireRecord(value, "package plan review");
  return {
    required: requireBoolean(record.required, "package plan review required"),
    status: requireEnum(record.status, PLAYBOOK_PACKAGE_REVIEW_STATUSES, "package plan review status"),
    ...(typeof record.reviewedBy === "string" ? { reviewedBy: record.reviewedBy } : {}),
    ...(typeof record.reviewedAt === "string" ? { reviewedAt: record.reviewedAt } : {}),
    ...(typeof record.reason === "string" ? { reason: record.reason } : {}),
  };
}

function validatePackagePlanSupport(value: unknown): PackagePlanSupport {
  const record = requireRecord(value, "package plan support");
  return {
    status: requireEnum(record.status, PLAYBOOK_PACKAGE_SUPPORT_STATUSES, "package plan support status"),
    evidenceRefs: requireStringArray(record.evidenceRefs, "package plan support evidenceRefs"),
  };
}

function validatePackagePlanLifecycle(value: unknown): PackagePlanLifecycle {
  const record = requireRecord(value, "package plan lifecycle");
  return {
    backupBeforeOverwrite: requireBoolean(record.backupBeforeOverwrite, "package plan lifecycle backupBeforeOverwrite"),
    uninstallDisposition: requireEnum(
      record.uninstallDisposition,
      ["remove-managed", "preserve-for-review", "export-only"] as const,
      "package plan lifecycle uninstallDisposition",
    ),
    preservesUserModifiedFiles: requireBoolean(
      record.preservesUserModifiedFiles,
      "package plan lifecycle preservesUserModifiedFiles",
    ),
  };
}

function validateAdapterPathTemplate(record: Record<string, JsonValue>): PackageAdapterPathTemplate {
  return {
    outputKind: requireEnum(record.outputKind, PLAYBOOK_PACKAGE_OUTPUT_KINDS, "adapter path template outputKind"),
    surface: requireEnum(record.surface, PLAYBOOK_PACKAGE_SURFACES, "adapter path template surface"),
    scope: requireEnum(record.scope, PLAYBOOK_PACKAGE_SCOPES, "adapter path template scope"),
    template: requireNonEmptyString(record.template, "adapter path template template"),
  };
}

function validateAdapterPrecondition(record: Record<string, JsonValue>): PackageAdapterPrecondition {
  return {
    id: requireNonEmptyString(record.id, "adapter precondition id"),
    description: requireNonEmptyString(record.description, "adapter precondition description"),
    required: requireBoolean(record.required, "adapter precondition required"),
  };
}

function validateAdapterLifecycleRule(record: Record<string, JsonValue>): PackageAdapterLifecycleRule {
  return {
    id: requireNonEmptyString(record.id, "adapter lifecycle rule id"),
    description: requireNonEmptyString(record.description, "adapter lifecycle rule description"),
  };
}

function validateAdapterConformanceRequirement(record: Record<string, JsonValue>): PackageAdapterConformanceRequirement {
  return {
    id: requireNonEmptyString(record.id, "adapter conformance requirement id"),
    description: requireNonEmptyString(record.description, "adapter conformance requirement description"),
    required: requireBoolean(record.required, "adapter conformance requirement required"),
  };
}

function assertReviewState(plan: PlaybookPackagePlan): void {
  const reviewRequired = plan.agentAssistedProposals.length > 0 || plan.unresolvedDecisions.length > 0;
  if (!reviewRequired) {
    return;
  }
  if (!plan.review.required || plan.review.status === "not-required") {
    throw new OperationError("Package plan requires semantic or decision review but review state is not required.");
  }
}

function requireRecord(value: unknown, label: string): Record<string, JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new OperationError(`${label} must be an object.`);
  }
  return value as Record<string, JsonValue>;
}

function requireRecordArray(value: unknown, label: string): Array<Record<string, JsonValue>> {
  if (!Array.isArray(value)) {
    throw new OperationError(`${label} must be an array.`);
  }
  return value.map((item, index) => requireRecord(item, `${label}[${index}]`));
}

function requireStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.length === 0)) {
    throw new OperationError(`${label} must be an array of non-empty strings.`);
  }
  return [...value];
}

function requireEnumArray<TValue extends string>(
  value: unknown,
  allowed: readonly TValue[],
  label: string,
): TValue[] {
  if (!Array.isArray(value)) {
    throw new OperationError(`${label} must be an array.`);
  }
  return value.map((item) => requireEnum(item, allowed, label));
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new OperationError(`${label} must be a non-empty string.`);
  }
  return value;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new OperationError(`${label} must be a boolean.`);
  }
  return value;
}

function requireLiteral<TValue extends string | number | boolean>(
  value: unknown,
  expected: TValue,
  label: string,
): TValue {
  if (value !== expected) {
    throw new OperationError(`${label} must be ${String(expected)}.`);
  }
  return expected;
}

function requireEnum<TValue extends string>(
  value: unknown,
  allowed: readonly TValue[],
  label: string,
): TValue {
  if (typeof value !== "string" || !allowed.includes(value as TValue)) {
    throw new OperationError(`${label} must be one of: ${allowed.join(", ")}.`);
  }
  return value as TValue;
}

function requireJsonValue(value: unknown, label: string): JsonValue {
  if (value === undefined || typeof value === "function" || typeof value === "symbol") {
    throw new OperationError(`${label} must be JSON-serializable.`);
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => requireJsonValue(item, `${label}[${index}]`));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, requireJsonValue(item, `${label}.${key}`)]),
    );
  }
  return value as JsonValue;
}

function validateStringRecord(value: unknown, label: string): Record<string, string> {
  const record = requireRecord(value, label);
  for (const [key, item] of Object.entries(record)) {
    requireNonEmptyString(item, `${label}.${key}`);
  }
  return record as Record<string, string>;
}
