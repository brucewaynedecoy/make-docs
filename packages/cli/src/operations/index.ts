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
  exportPlaybookRun,
  importPlaybookRun,
  inspectPlaybookRunState,
  invokePlaybook,
  PLAYBOOK_ADVANCE_OUTCOMES,
  PLAYBOOK_CATALOG_OPERATION_ID,
  PLAYBOOK_GATE_DECISION_VALUES,
  PLAYBOOK_RUN_EXPORT_FORMAT,
  PLAYBOOK_RUN_EXPORT_FORMAT_VERSION,
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
  ExportPlaybookRunInput,
  ExportPlaybookRunResult,
  ImportPlaybookRunInput,
  ImportPlaybookRunResult,
  PlaybookContractCatalog,
  PlaybookContractCatalogEntry,
  PlaybookRunExportArtifact,
  PlaybookRunNextReport,
  PlaybookRunState,
  PlaybookRunTerminalStatus,
  PlaybookValidationDiagnostic,
  PlaybookValidationReport,
  PlaybookValidationResult,
} from "./playbook";
export {
  AGENTIC_LOWERING_DISPOSITIONS,
  buildPackageDistributable,
  CLAUDE_CODE_HARNESS_CAPABILITY_DESCRIPTOR,
  CODEX_HARNESS_CAPABILITY_DESCRIPTOR,
  CONTAINER_SELECTION_STATUSES,
  DEFAULT_UNSUPPORTED_PRIMITIVE_POLICY,
  deriveAdapterDeclarationCore,
  deriveAdapterPathTemplates,
  deriveImpliedAgentics,
  DISTRIBUTABLE_PROFILES,
  FIRST_PARTY_HARNESS_CAPABILITY_DESCRIPTORS,
  FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR,
  GENERATED_OUTPUT_RECORD_KINDS,
  HARNESS_AGENTIC_PRIMITIVES,
  HARNESS_CONTAINER_KINDS,
  outputKindForProfile,
  PACKAGE_ADAPTER_EXPOSURE_MODES,
  PI_HARNESS_CAPABILITY_DESCRIPTOR,
  PLAYBOOK_PACKAGE_OUTPUT_KINDS,
  PLAYBOOK_PACKAGE_REVIEW_STATUSES,
  PLAYBOOK_PACKAGE_SCOPES,
  PLAYBOOK_PACKAGE_SUPPORT_STATUSES,
  PLAYBOOK_PACKAGE_SURFACES,
  profileForOutputKind,
  projectPlaybookToSkill,
  selectPackageContainer,
  UNSUPPORTED_PRIMITIVE_POLICIES,
  validateGeneratedOutputRecord,
  validateHarnessAdapterDeclaration,
  validateHarnessCapabilityDescriptor,
  validateHarnessId,
  validatePackageDistributable,
  validatePackagePlan,
  validatePackageTarget,
} from "./playbook-packaging";
export type {
  AgenticLowering,
  AgenticLoweringDisposition,
  ContainerSelectionStatus,
  DistributableProfile,
  HarnessAgenticPrimitive,
  HarnessCapabilityDescriptor,
  HarnessContainerDeclaration,
  HarnessContainerKind,
  ImpliedAgentic,
  PackageContainerSelection,
  PackageDistributable,
  PlaybookSkillProjection,
  UnsupportedPrimitivePolicy,
} from "./playbook-packaging";
export {
  canHarnessHostPrimitive,
  findHarnessRegistryEntry,
  FIRST_PARTY_HARNESS_REGISTRY_ENTRIES,
  FIXTURE_FUTURE_HARNESS_REGISTRY_ENTRY,
  getHarnessRegistryEntry,
  listHarnessRegistryEntries,
  resolveRuntimeCapabilityRecordKey,
} from "./harness-registry";
export type { HarnessRegistryEntry } from "./harness-registry";
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
