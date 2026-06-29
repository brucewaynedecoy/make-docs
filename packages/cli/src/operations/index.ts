import { closeoutDomain } from "./closeout";
import { lifecycleDomain } from "./lifecycle";
import { playbookDomain } from "./playbook";
import { playbookPackagingDomain } from "./playbook-packaging";
import type { OperationDomainDescriptor, OperationDomainName } from "./types";
import { workDomain } from "./work";

export type {
  JsonValue,
  OperationCommandDescriptor,
  OperationDomainDescriptor,
  OperationDomainName,
  OperationProvenance,
  OperationRenderMode,
  OperationResult,
} from "./types";
export { OperationError } from "./types";
export { closeoutDomain, probeCloseout } from "./closeout";
export { lifecycleDomain, checkpointPhase, gatePhase, guardPhaseScope } from "./lifecycle";
export {
  buildPlaybookCatalog,
  createPlaybookRunState,
  evaluateHarnessCapabilities,
  inspectPlaybookRunState,
  invokePlaybook,
  playbookDomain,
  readHarnessCapabilityEvaluation,
  readPlaybookCatalog,
  readPlaybookResolution,
  readPlaybookRunState,
  resolvePlaybook,
  writePlaybookInvocation,
  writePlaybookRunState,
} from "./playbook";
export {
  GENERATED_OUTPUT_RECORD_KINDS,
  PACKAGE_ADAPTER_EXPOSURE_MODES,
  PLAYBOOK_PACKAGE_OUTPUT_KINDS,
  PLAYBOOK_PACKAGE_REVIEW_STATUSES,
  PLAYBOOK_PACKAGE_SCOPES,
  PLAYBOOK_PACKAGE_SUPPORT_STATUSES,
  PLAYBOOK_PACKAGE_SURFACES,
  playbookPackagingDomain,
  validateGeneratedOutputRecord,
  validateHarnessAdapterDeclaration,
  validateHarnessId,
  validatePackagePlan,
  validatePackageTarget,
} from "./playbook-packaging";
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
} from "./playbook-packaging";
export {
  planWorkPhase,
  readWaveStatus,
  readWorkPhaseState,
  resolveWorkWave,
  workDomain,
} from "./work";

const DOMAINS = [closeoutDomain, workDomain, lifecycleDomain, playbookDomain, playbookPackagingDomain] as const;

export function listOperationDomains(): OperationDomainDescriptor[] {
  return DOMAINS.map((domain) => ({
    ...domain,
    commands: domain.commands.map((command) => ({ ...command })),
  }));
}

export function getOperationDomain(name: OperationDomainName): OperationDomainDescriptor {
  const domain = DOMAINS.find((candidate) => candidate.name === name);
  if (!domain) {
    throw new Error(`Unknown operation domain: ${name}`);
  }
  return {
    ...domain,
    commands: domain.commands.map((command) => ({ ...command })),
  };
}
