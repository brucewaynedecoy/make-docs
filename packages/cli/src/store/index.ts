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
  StoreSchemaNewerError,
  StoreUnavailableError,
  applyStoreMigrations,
  loadSqliteDriver,
  openStoreDatabase,
  readUserVersion,
  withStoreDatabase,
  type OpenStoreDatabaseResult,
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
  bootstrapGlobalStore,
  type StoreBootstrapOptions,
  type StoreBootstrapReport,
} from "./bootstrap";
