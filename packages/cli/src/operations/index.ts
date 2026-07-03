import { listOperations } from "./registry";
import type { OperationDomainDescriptor } from "./types";

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
export { probeCloseout } from "./closeout";
export { checkpointPhase, gatePhase, guardPhaseScope } from "./lifecycle";
export {
  advancePlaybookRun,
  buildPlaybookCatalog,
  catalogPlaybooks,
  closePlaybookRun,
  computePlaybookRunNext,
  createPlaybookRunState,
  evaluateHarnessCapabilities,
  inspectPlaybookRunState,
  invokePlaybook,
  PLAYBOOK_ADVANCE_OUTCOMES,
  PLAYBOOK_CATALOG_OPERATION_ID,
  PLAYBOOK_GATE_DECISION_VALUES,
  PLAYBOOK_RUN_TERMINAL_STATUSES,
  PLAYBOOK_VALIDATE_OPERATION_ID,
  readHarnessCapabilityEvaluation,
  readPlaybookCatalog,
  readPlaybookContractCatalog,
  readPlaybookResolution,
  readPlaybookRunState,
  readPlaybookValidation,
  recordPlaybookRunGate,
  resolvePlaybook,
  resumePlaybookRun,
  transitionPlaybookRunState,
  validatePlaybooks,
  writePlaybookInvocation,
  writePlaybookRunState,
} from "./playbook";
export type {
  PlaybookContractCatalog,
  PlaybookContractCatalogEntry,
  PlaybookRunNextReport,
  PlaybookRunState,
  PlaybookRunTerminalStatus,
  PlaybookValidationDiagnostic,
  PlaybookValidationReport,
  PlaybookValidationResult,
} from "./playbook";
export {
  GENERATED_OUTPUT_RECORD_KINDS,
  PACKAGE_ADAPTER_EXPOSURE_MODES,
  PLAYBOOK_PACKAGE_OUTPUT_KINDS,
  PLAYBOOK_PACKAGE_REVIEW_STATUSES,
  PLAYBOOK_PACKAGE_SCOPES,
  PLAYBOOK_PACKAGE_SUPPORT_STATUSES,
  PLAYBOOK_PACKAGE_SURFACES,
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
} from "./work";

/**
 * Domain listing derived from the operation registry (R-REG-2, R-RUN-2):
 * groups `listOperations()` identifiers by their domain segment so surfaces
 * such as `make_docs_operation_domains` advertise exactly the registry —
 * pruned legacy operations never appear here.
 */
export function listOperationDomains(): OperationDomainDescriptor[] {
  const domains = new Map<string, OperationDomainDescriptor>();
  for (const operation of listOperations()) {
    let domain = domains.get(operation.domain);
    if (!domain) {
      domain = { name: operation.domain, commands: [] };
      domains.set(operation.domain, domain);
    }
    domain.commands.push({
      id: operation.id,
      summary: operation.summary,
      mutates: operation.mutates === "write",
      status: operation.status,
    });
  }
  return [...domains.values()];
}
