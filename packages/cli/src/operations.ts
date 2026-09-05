export {
  createExecutionContext,
  OperationApprovalRequiredError,
  OperationPendingError,
  OperationWriteDeniedError,
} from "./operations/context";
export type { OperationExecutionContext, OperationSurface } from "./operations/context";
export {
  acquireProjectMigrationLock,
  assertProjectMigrationLockActive,
  assertReviewedMigrationSnapshotCurrent,
  classifyMigrationCompatibility,
  createReviewedMigrationSnapshot,
  createVerifiedMigrationBackup,
  executeInstallPlanMigration,
  ImmutableMigrationCoordinator,
  LEGACY_COMPATIBILITY_OPERATION_IDS,
  MIGRATION_CHECKPOINTS,
  MIGRATION_ROUTING_SURFACES,
  MigrationSafetyError,
  applyMigrationRoutingSurface,
  planMigrationRoutingSurface,
  releaseProjectMigrationLock,
  removeTrustedPythonPathHelper,
  restoreMigrationBackup,
  verifyMigrationBackup,
} from "./migration";
export type {
  InstallPlanMigrationResult,
  MigrationAffectedPath,
  MigrationCheckpointReceipt,
  MigrationCompatibilityClassification,
  MigrationCompatibilityFacets,
  MigrationFilesystemState,
  MigrationPathDisposition,
  MigrationReceiptStatus,
  MigrationRoutingSurface,
  MigrationStoreState,
  ProjectMigrationLock,
  ReviewedMigrationSnapshot,
  VerifiedMigrationBackup,
} from "./migration";
export {
  failingPathHygieneFindings,
  fixRepositoryRootPaths,
  PATH_HYGIENE_ALLOW_TOKEN,
  scanPathHygieneManifest,
  scanPathHygieneText,
  validateProjectPathHygiene,
} from "./path-hygiene";
export type {
  PathHygieneFinding,
  PathHygieneFindingKind,
  PathHygieneScanResult,
  PathHygieneValidationResult,
} from "./path-hygiene";
export {
  getOperation,
  hasOperation,
  invokeOperation,
  listOperations,
  OPERATION_ID_PATTERN,
  operationDomain,
} from "./operations/registry";
export type {
  OperationDefinition,
  OperationDescriptor,
  OperationInvocation,
  OperationMutation,
  OperationStatus,
} from "./operations/registry";
export {
  buildCloseoutProbe,
  runCloseoutHistory,
  runCloseoutValidate,
} from "./operations/closeout";
export {
  buildCheckpoint,
  buildPhaseGateReport,
  buildScopeReport,
} from "./operations/lifecycle";
export {
  isActionPrefixedPrdFilename,
  PRD_AUTHORITY_DIAGNOSTIC_CODES,
  validatePrdAuthority,
} from "./operations/prd";
export type {
  PrdAuthorityDiagnostic,
  PrdAuthorityDiagnosticCode,
  PrdAuthorityValidationReport,
} from "./operations/prd";
export { OperationError } from "./operations/types";
export type { JsonValue } from "./operations/types";
export {
  buildPhasePlan,
  buildWaveStatus,
  parseWorkPhase,
  renderPhasePlan,
  resolveWaveTarget,
} from "./operations/work";
export type {
  Coordinate,
  PhaseState,
  PhaseTask,
  WaveResolution,
} from "./operations/work";
