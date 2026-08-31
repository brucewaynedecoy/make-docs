/**
 * Machine-level global store at `~/.make-docs/` (W18 R10; PRD 38).
 *
 * This module is the library seam for all operational-state storage. It is
 * consumed by the CLI install flow (store bootstrap), and it is the seam the
 * W18 R7 Playbook runner and the retained work-execution evidence operations
 * (W18 R11) build on. See ./README.md for the recorded D10 implementer
 * decisions (driver, schema, migrations, locking, file formats).
 */

export {
  GLOBAL_CONFIG_FILE,
  GLOBAL_MANIFEST_FILE,
  STORE_DATABASE_FILE,
  STORE_DIR_NAME,
  STORE_ROOT_ENV_VAR,
  getGlobalConfigPath,
  getGlobalManifestPath,
  getStoreDatabasePath,
  resolveStoreRoot,
  type ResolveStoreRootOptions,
} from "./paths";

export {
  DEFAULT_GLOBAL_CONFIG_SETTINGS,
  GLOBAL_CONFIG_SCHEMA_VERSION,
  defaultGlobalConfig,
  loadGlobalConfig,
  writeGlobalConfig,
  type GlobalConfig,
  type GlobalConfigSettings,
  type LoadedGlobalConfig,
  type SelfUpdatePreference,
} from "./global-config";

export {
  GLOBAL_MANIFEST_SCHEMA_VERSION,
  defaultGlobalManifest,
  loadGlobalManifest,
  writeGlobalManifest,
  type GlobalManifest,
  type GlobalManifestBootstrapRecord,
  type GlobalManifestDatabaseRecord,
  type StoreDatabaseStatus,
} from "./global-manifest";

export {
  CURRENT_STORE_SCHEMA_VERSION,
  STORE_BUSY_TIMEOUT_MS,
  STORE_MIGRATIONS,
  StoreMigrationRequiredError,
  StoreCheckpoint9StateError,
  StoreSchemaNewerError,
  StoreUnavailableError,
  applyStoreMigrations,
  classifyStoreCheckpoint9State,
  inspectStoreCheckpoint9Requirement,
  loadSqliteDriver,
  migrateStoreDatabaseAtCheckpoint9,
  openStoreDatabase,
  readStoreCheckpoint9JournalEntry,
  readUserVersion,
  withStoreDatabase,
  type OpenStoreDatabaseResult,
  type StoreCheckpoint9MigrationResult,
  type StoreCheckpoint9Classification,
  type StoreCheckpoint9JournalEntry,
  type StoreCheckpoint9Requirement,
  type UnsafeStoreCheckpoint9Classification,
  type SqliteDriverResult,
  type StoreDatabase,
  type StoreMigration,
} from "./database";

export {
  PlaybookRunExistsError,
  PlaybookRunNotFoundError,
  createPlaybookRunRecord,
  deleteProjectRows,
  listPlaybookRunRecords,
  listProjectRegistryEntries,
  listWorkEvidence,
  readPlaybookRunRecord,
  readProjectRegistryEntry,
  transitionPlaybookRunRecord,
  upsertPlaybookRunRecord,
  upsertProjectRegistryEntry,
  upsertWorkEvidence,
  type PlaybookRunRow,
  type ProjectRegistryEntry,
  type WorkEvidenceRow,
} from "./state-rows";

export {
  LIFECYCLE_MUTATION_OPERATIONS,
  LIFECYCLE_RUN_TYPES,
  LIFECYCLE_STAGES,
  LIFECYCLE_STATUSES,
  LifecycleRunExistsError,
  LifecycleRunNotFoundError,
  LifecycleVersionConflictError,
  attachLifecycleEvidence,
  createLifecycleRun,
  createLifecycleStoreMutationReceipt,
  listLifecycleEvidence,
  listLifecycleRuns,
  readLifecycleRun,
  transitionLifecycleRun,
  type LifecycleEvidenceRow,
  type LifecycleMetadata,
  type LifecycleMetadataValue,
  type LifecycleMutationOperation,
  type LifecycleRunRow,
  type LifecycleRunType,
  type LifecycleStage,
  type LifecycleStatus,
  type LifecycleStoreMutationReceipt,
  type LifecycleStoreMutationResult,
} from "./lifecycle-runs";

export {
  PROJECT_STATE_TABLE_ROLES,
  listWaveEvidence,
  readWorkItemEvidence,
  recordWorkEvidence,
  type ProjectStateTableRole,
  type WorkItemIdentity,
} from "./project-state";

export {
  mirrorProjectManifest,
  readAuthoritativeInstallRecord,
  rebuildProjectRegistry,
  type AuthoritativeInstallRecord,
  type MirrorProjectResult,
  type RebuildProjectRegistryResult,
} from "./registry-mirror";

export {
  resolveProjectIdentity,
  type ProjectIdentityResolution,
} from "./project-identity";

export {
  pruneProjectFromStore,
  removeGlobalStore,
  type PruneProjectFromStoreOptions,
  type PruneProjectFromStoreResult,
  type RemoveGlobalStoreOptions,
  type RemoveGlobalStoreResult,
} from "./lifecycle";

export {
  bootstrapGlobalStore,
  type StoreBootstrapOptions,
  type StoreBootstrapReport,
} from "./bootstrap";
