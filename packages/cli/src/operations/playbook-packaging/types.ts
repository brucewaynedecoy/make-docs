import type { JsonValue } from "../types";
import type {
  HarnessCapabilityDescriptor,
  HarnessDescriptorVerification,
} from "./capability-descriptor";
import type { PackageDistributable, UnsupportedPrimitivePolicy } from "./distributable";

export const PLAYBOOK_PACKAGE_OUTPUT_KINDS = ["plugin", "skills-bundle"] as const;
export const PLAYBOOK_PACKAGE_SURFACES = ["native", "agents-standard", "auto"] as const;
export const PLAYBOOK_PACKAGE_SCOPES = ["project", "global", "export-only"] as const;
export const PLAYBOOK_PACKAGE_REVIEW_STATUSES = [
  "not-required",
  "required",
  "approved",
  "rejected",
] as const;
export const PLAYBOOK_PACKAGE_SUPPORT_STATUSES = [
  "unvalidated",
  "validated",
  "unsupported",
  "provisional",
] as const;
export const PACKAGE_PLAN_FIELD_PROVENANCE = [
  "deterministic",
  "user-supplied",
  "agent-proposed",
  "unresolved",
] as const;
export const PACKAGE_PLAN_STOP_REASONS = [
  "source-invalid",
  "unresolved-target",
  "ambiguous-source",
  "manual-review-required",
  "semantic-review-required",
  "ownership-review-required",
  "unsafe-rewrite",
  "unsupported-output-kind",
  "unsupported-surface",
  "missing-support-evidence",
] as const;
export const GENERATED_OUTPUT_RECORD_KINDS = [
  "source-playbook",
  "generated-plugin",
  "generated-skills-bundle",
  "generated-adapter",
  "symlink-exposure",
  "copy-mirror",
  "export-only-file",
  "user-authored-file",
  "legacy-generated-output",
] as const;
export const PACKAGE_ADAPTER_EXPOSURE_MODES = [
  "symlink",
  "copy-mirror",
  "generated-adapter",
  "export-only",
] as const;

export type PlaybookPackageOutputKind = (typeof PLAYBOOK_PACKAGE_OUTPUT_KINDS)[number];
export type PlaybookPackageSurface = (typeof PLAYBOOK_PACKAGE_SURFACES)[number];
export type PlaybookPackageScope = (typeof PLAYBOOK_PACKAGE_SCOPES)[number];
export type PlaybookPackageReviewStatus = (typeof PLAYBOOK_PACKAGE_REVIEW_STATUSES)[number];
export type PlaybookPackageSupportStatus = (typeof PLAYBOOK_PACKAGE_SUPPORT_STATUSES)[number];
export type PackagePlanFieldProvenance = (typeof PACKAGE_PLAN_FIELD_PROVENANCE)[number];
export type PackagePlanStopReason = (typeof PACKAGE_PLAN_STOP_REASONS)[number];
export type GeneratedOutputRecordKind = (typeof GENERATED_OUTPUT_RECORD_KINDS)[number];
export type PackageAdapterExposureMode = (typeof PACKAGE_ADAPTER_EXPOSURE_MODES)[number];

export interface SourcePlaybookRef {
  ref: string;
  path: string;
  persona: string;
  slug: string;
  stack: "build" | "run";
  sourceDigest: string;
  title?: string;
}

export interface PlaybookPackageTarget {
  harness: string;
  outputKind: PlaybookPackageOutputKind;
  surface: PlaybookPackageSurface;
  scope: PlaybookPackageScope;
}

export interface GeneratedArtifactPlan {
  path: string;
  recordKind: GeneratedOutputRecordKind;
  outputKind: PlaybookPackageOutputKind;
  surface: PlaybookPackageSurface;
  sourceRefs: string[];
}

export interface AgentAssistedProposal {
  field: string;
  value: JsonValue;
  reason: string;
}

export interface PackageUnresolvedDecision {
  id: string;
  question: string;
}

export interface PackagePlanReview {
  required: boolean;
  status: PlaybookPackageReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reason?: string;
}

export interface PackagePlanSupport {
  status: PlaybookPackageSupportStatus;
  evidenceRefs: string[];
}

export interface PackagePlanLifecycle {
  backupBeforeOverwrite: boolean;
  uninstallDisposition: "remove-managed" | "preserve-for-review" | "export-only";
  preservesUserModifiedFiles: boolean;
}

export interface PackagePlanStop {
  reason: PackagePlanStopReason;
  message: string;
  ref?: string;
  path?: string;
}

export interface PlaybookPackagePlan {
  schemaVersion: 1;
  packageId: string;
  title: string;
  summary: string;
  sources: SourcePlaybookRef[];
  target: PlaybookPackageTarget;
  generatedArtifacts: GeneratedArtifactPlan[];
  deterministicDerivations: Record<string, string>;
  agentAssistedProposals: AgentAssistedProposal[];
  unresolvedDecisions: PackageUnresolvedDecision[];
  fieldProvenance: Record<string, PackagePlanFieldProvenance>;
  review: PackagePlanReview;
  support: PackagePlanSupport;
  lifecycle: PackagePlanLifecycle;
  validationRequirements: string[];
  /**
   * Two-granularities distributable record (W18 R8 P1, R-CAP-3/R-CAP-4):
   * skills at authoring granularity, implied agentics, and the declared
   * container selection with any degradations. Optional so pre-W18 R8 plan
   * payloads keep validating.
   */
  distributable?: PackageDistributable;
}

export interface PackagePlanDryRun {
  status: "ready" | "review-required" | "manual-review-required";
  plan: PlaybookPackagePlan;
  stops: PackagePlanStop[];
  lines: string[];
  writesPlanned: false;
}

export interface PlaybookPackagePlannerInput {
  repoRoot?: string;
  refs: string[];
  requestedStack?: "build" | "run" | null;
  target: PlaybookPackageTarget;
  packageId?: string;
  title?: string;
  summary?: string;
  reviewStatus?: PlaybookPackageReviewStatus;
  reviewedBy?: string;
  supportEvidenceRefs?: string[];
  nonInteractive?: boolean;
  /**
   * Declared handling for Playbook-implied agentics the harness cannot host:
   * degrade to documented manual steps/skill instructions or fail closed with
   * unsupported-surface stops; defaults to fail-closed (R-CAP-4).
   */
  unsupportedPrimitivePolicy?: UnsupportedPrimitivePolicy;
  /** Capability-descriptor override for tests and additive future harnesses. */
  descriptors?: HarnessCapabilityDescriptor[];
  existingGeneratedOutputs?: Array<{
    path: string;
    state: "clean-managed" | "modified-managed" | "user-authored" | "legacy-generated";
  }>;
}

export interface GeneratedOutputRecord {
  schemaVersion: 1;
  recordKind: GeneratedOutputRecordKind;
  path: string;
  sourceRefs: string[];
  sourceDigests: string[];
  target?: PlaybookPackageTarget;
  support?: PackagePlanSupport;
  lifecycle: PackagePlanLifecycle;
  reviewStatus: PlaybookPackageReviewStatus;
}

export interface PackageAdapterPrecondition {
  id: string;
  description: string;
  required: boolean;
}

export interface PackageAdapterPathTemplate {
  outputKind: PlaybookPackageOutputKind;
  surface: PlaybookPackageSurface;
  scope: PlaybookPackageScope;
  template: string;
}

export interface PackageAdapterLifecycleRule {
  id: string;
  description: string;
}

export interface PackageAdapterConformanceRequirement {
  id: string;
  description: string;
  required: boolean;
}

export interface HarnessPackageAdapterDeclaration {
  harnessId: string;
  supportedOutputKinds: PlaybookPackageOutputKind[];
  supportedSurfaces: PlaybookPackageSurface[];
  supportedScopes: PlaybookPackageScope[];
  pathTemplates: PackageAdapterPathTemplate[];
  preconditions: PackageAdapterPrecondition[];
  preferredExposureMode: PackageAdapterExposureMode;
  fallbackExposureMode: PackageAdapterExposureMode;
  ownershipClasses: GeneratedOutputRecordKind[];
  lifecycleRules: PackageAdapterLifecycleRule[];
  conformanceRequirements: PackageAdapterConformanceRequirement[];
  /**
   * Where the adapter's declared contract was confirmed and how far that
   * confirmation goes (W18 R8 P3, R-ADAPT-1): every adapter declaration —
   * not just its capability descriptor — carries the verification reference
   * and status, and an unverified adapter is gated to export-only or
   * provisional output without a support claim.
   */
  verification: HarnessDescriptorVerification;
}

export type PackageAdapterPreconditionState = "satisfied" | "unknown" | "unsupported";

export interface PackageSurfacePreconditionResult extends PackageAdapterPrecondition {
  state: PackageAdapterPreconditionState;
}

export interface PackageSurfaceResolutionInput {
  target: PlaybookPackageTarget;
  packageId: string;
  platform?: "posix" | "windows";
  symlinkAvailable?: boolean;
  preconditions?: Record<string, PackageAdapterPreconditionState>;
  adapters?: HarnessPackageAdapterDeclaration[];
}

export interface PackageSurfaceResolution {
  status: "ready" | "manual-review-required" | "unsupported";
  harnessId: string;
  outputKind: PlaybookPackageOutputKind;
  requestedSurface: PlaybookPackageSurface;
  surface: Exclude<PlaybookPackageSurface, "auto">;
  scope: PlaybookPackageScope;
  path: string;
  exposureMode: PackageAdapterExposureMode;
  fallbackExposureMode: PackageAdapterExposureMode;
  fallbackUsed: boolean;
  preconditions: PackageSurfacePreconditionResult[];
  lifecycleRules: PackageAdapterLifecycleRule[];
  conformanceRequirements: PackageAdapterConformanceRequirement[];
  stops: PackagePlanStop[];
}

export interface PlaybookPackageWriteInput {
  repoRoot?: string;
  homeDir?: string;
  plan: PlaybookPackagePlan;
  surfaceResolution?: PackageSurfaceResolution;
  /** Capability-descriptor override for tests and additive future harnesses. */
  descriptors?: HarnessCapabilityDescriptor[];
  platform?: "posix" | "windows";
  symlinkAvailable?: boolean;
  preconditions?: Record<string, PackageAdapterPreconditionState>;
  write?: boolean;
  reviewedOverwrite?: boolean;
  backupSnapshotReviewed?: boolean;
  staleOutputs?: GeneratedOutputRecord[];
}

export interface PlaybookPackageWriteResult {
  status: "ready" | "written" | "exported" | "review-required" | "manual-review-required";
  packageId: string;
  outputKind: PlaybookPackageOutputKind;
  scope: PlaybookPackageScope;
  canonicalPath: string;
  exposurePath?: string;
  exposureMode: PackageAdapterExposureMode;
  /** Canonical-root-relative paths of the compiled distributable inventory (R-COMP-3). */
  payloadFiles: string[];
  records: GeneratedOutputRecord[];
  filesWritten: string[];
  manifestUpdated: boolean;
  staleOutputsRemoved: string[];
  stops: PackagePlanStop[];
  lines: string[];
}
