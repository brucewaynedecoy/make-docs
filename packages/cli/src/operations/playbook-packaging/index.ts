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
  PackagePlanDryRun,
  PackagePlanFieldProvenance,
  PackagePlanLifecycle,
  PackagePlanReview,
  PackagePlanStop,
  PackagePlanStopReason,
  PackagePlanSupport,
  PackageUnresolvedDecision,
  PlaybookPackageOutputKind,
  PlaybookPackagePlan,
  PlaybookPackagePlannerInput,
  PlaybookPackageReviewStatus,
  PlaybookPackageScope,
  PlaybookPackageSupportStatus,
  PlaybookPackageSurface,
  PlaybookPackageTarget,
  PackageAdapterPreconditionState,
  PackageSurfacePreconditionResult,
  PackageSurfaceResolution,
  PackageSurfaceResolutionInput,
  SourcePlaybookRef,
} from "./types";
export {
  GENERATED_OUTPUT_RECORD_KINDS,
  PACKAGE_ADAPTER_EXPOSURE_MODES,
  PACKAGE_PLAN_FIELD_PROVENANCE,
  PACKAGE_PLAN_STOP_REASONS,
  PLAYBOOK_PACKAGE_OUTPUT_KINDS,
  PLAYBOOK_PACKAGE_REVIEW_STATUSES,
  PLAYBOOK_PACKAGE_SCOPES,
  PLAYBOOK_PACKAGE_SUPPORT_STATUSES,
  PLAYBOOK_PACKAGE_SURFACES,
} from "./types";
export {
  createPlaybookPackagePlan,
  readPlaybookPackagePlan,
  renderPackagePlanDryRunLines,
} from "./planner";
export {
  FIRST_PARTY_HARNESS_PACKAGE_ADAPTERS,
  FIXTURE_FUTURE_HARNESS_PACKAGE_ADAPTER,
  getHarnessPackageAdapter,
  listHarnessPackageAdapters,
} from "./adapters";
export {
  readPackageSurfaceResolution,
  resolvePackageSurface,
} from "./surface-resolution";
export {
  validateGeneratedOutputRecord,
  validateHarnessAdapterDeclaration,
  validateHarnessId,
  validatePackagePlan,
  validatePackageTarget,
} from "./validation";

export const playbookPackagingDomain: OperationDomainDescriptor = {
  name: "playbook-packaging",
  summary: "Playbook package-plan, generated-output, and harness-adapter operations.",
  commands: [
    {
      name: "playbook-package-plan",
      summary: "Create a reviewable Playbook package plan without writing generated outputs.",
      mutates: false,
      renderModes: ["json"],
    },
    {
      name: "playbook-package-surface-resolve",
      summary: "Resolve a Playbook package target through a harness adapter without writing outputs.",
      mutates: false,
      renderModes: ["json"],
    },
  ],
};
