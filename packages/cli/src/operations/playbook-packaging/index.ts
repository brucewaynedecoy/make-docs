import type { OperationDomainDescriptor } from "../types";
export type {
  AgentAssistedProposal,
  GeneratedArtifactPlan,
  GeneratedOutputRecord,
  GeneratedOutputRecordKind,
  HarnessPackageAdapterDeclaration,
  PackageAdapterConformanceRequirement,
  PackageAdapterExposureMode,
  PackageAdapterLifecycleRule,
  PackageAdapterPathTemplate,
  PackageAdapterPrecondition,
  PackagePlanLifecycle,
  PackagePlanReview,
  PackagePlanSupport,
  PackageUnresolvedDecision,
  PlaybookPackageOutputKind,
  PlaybookPackagePlan,
  PlaybookPackageReviewStatus,
  PlaybookPackageScope,
  PlaybookPackageSupportStatus,
  PlaybookPackageSurface,
  PlaybookPackageTarget,
  SourcePlaybookRef,
} from "./types";
export {
  GENERATED_OUTPUT_RECORD_KINDS,
  PACKAGE_ADAPTER_EXPOSURE_MODES,
  PLAYBOOK_PACKAGE_OUTPUT_KINDS,
  PLAYBOOK_PACKAGE_REVIEW_STATUSES,
  PLAYBOOK_PACKAGE_SCOPES,
  PLAYBOOK_PACKAGE_SUPPORT_STATUSES,
  PLAYBOOK_PACKAGE_SURFACES,
} from "./types";
export {
  validateGeneratedOutputRecord,
  validateHarnessAdapterDeclaration,
  validateHarnessId,
  validatePackagePlan,
  validatePackageTarget,
} from "./validation";

export const playbookPackagingDomain: OperationDomainDescriptor = {
  name: "playbook-packaging",
  summary: "Playbook package-plan, generated-output, and harness-adapter schema operations.",
  commands: [],
};
