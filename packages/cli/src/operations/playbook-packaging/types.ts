import type { JsonValue } from "../types";

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
  review: PackagePlanReview;
  support: PackagePlanSupport;
  lifecycle: PackagePlanLifecycle;
  validationRequirements: string[];
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
}
