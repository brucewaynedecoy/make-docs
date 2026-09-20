import { existsSync, mkdirSync } from "node:fs";
import {
  CURRENT_STORE_SCHEMA_VERSION,
  openStoreDatabase,
  StoreSchemaNewerError,
  StoreUnavailableError,
} from "./database";
import { defaultGlobalConfig, writeGlobalConfig } from "./global-config";
import {
  defaultGlobalManifest,
  loadGlobalManifest,
  writeGlobalManifest,
  type StoreDatabaseStatus,
} from "./global-manifest";
import {
  getGlobalConfigPath,
  getGlobalManifestPath,
  getStoreDatabasePath,
  resolveStoreRoot,
  type ResolveStoreRootOptions,
} from "./paths";

/**
 * Global-store bootstrap (R-STORE-1): when Make Docs is installed on a
 * system, ensure `~/.make-docs/` exists with the global config, the global
 * manifest, and the SQLite database, and apply any pending schema migrations.
 *
 * The bootstrap is strictly additive to the machine-level store: it never
 * reads from or writes to the target repository, so local repository
 * bootstrap behavior is byte-identical with and without the store
 * (R-STORE-3). It also never throws — every failure becomes a warning,
 * because the store holds recoverable operational state, not project
 * knowledge (R-DB-4).
 */

export interface StoreBootstrapOptions extends ResolveStoreRootOptions {
  packageMeta?: { name: string; version: string };
  now?: () => Date;
}

export interface StoreBootstrapReport {
  storeRoot: string;
  configPath: string;
  configCreated: boolean;
  manifestPath: string;
  manifestCreated: boolean;
  databasePath: string;
  databaseStatus: StoreDatabaseStatus;
  /** Schema version recorded in the database, when it is usable. */
  schemaVersion: number | null;
  warnings: string[];
}

export function bootstrapGlobalStore(
  options: StoreBootstrapOptions = {},
): StoreBootstrapReport {
  const storeRoot = resolveStoreRoot(options);
  const now = (options.now ?? (() => new Date()))().toISOString();
  const report: StoreBootstrapReport = {
    storeRoot,
    configPath: getGlobalConfigPath(storeRoot),
    configCreated: false,
    manifestPath: getGlobalManifestPath(storeRoot),
    manifestCreated: false,
    databasePath: getStoreDatabasePath(storeRoot),
    databaseStatus: "unavailable",
    schemaVersion: null,
    warnings: [],
  };

  try {
    mkdirSync(storeRoot, { recursive: true, mode: 0o700 });
  } catch (error) {
    report.warnings.push(
      `Could not create the make-docs global store at ${storeRoot} (${toMessage(error)}). ` +
        "Operational state will not be recorded; repository content is unaffected.",
    );
    return report;
  }

  // Global config: create with defaults when missing; never overwrite an
  // existing file, because it carries user-set machine-level settings.
  try {
    if (!existsSync(report.configPath)) {
      writeGlobalConfig(storeRoot, defaultGlobalConfig());
      report.configCreated = true;
    }
  } catch (error) {
    report.warnings.push(
      `Could not write the global config at ${report.configPath} (${toMessage(error)}).`,
    );
  }

  // SQLite database: create, verify, and migrate. Failures degrade.
  try {
    const open = openStoreDatabase(storeRoot);
    try {
      report.schemaVersion = open.schemaVersion;
      if (open.recovered) {
        report.databaseStatus = "recovered";
        report.warnings.push(
          `The make-docs store database at ${open.databasePath} was unreadable and has been recreated ` +
            `(the old file was kept at ${open.quarantinedPath ?? "a quarantine path"}). ` +
            "This is recoverable operational-state loss (run state and recorded sign-offs); " +
            "no project knowledge or repository content was lost, and state can be re-established.",
        );
      } else {
        report.databaseStatus = open.created ? "created" : "ready";
      }
    } finally {
      open.db.close();
    }
  } catch (error) {
    if (error instanceof StoreSchemaNewerError) {
      report.databaseStatus = "schema-newer";
      report.schemaVersion = error.databaseSchemaVersion;
      report.warnings.push(error.message);
    } else if (error instanceof StoreUnavailableError) {
      report.databaseStatus = "unavailable";
      report.warnings.push(error.message);
    } else {
      report.databaseStatus = "unavailable";
      report.warnings.push(
        `Could not open the make-docs store database at ${report.databasePath} (${toMessage(error)}). ` +
          "Repository operations are unaffected.",
      );
    }
  }

  // Global manifest: create or refresh tool-level state last so it reflects
  // the database outcome of this bootstrap.
  try {
    const existing = loadGlobalManifest(storeRoot);
    const manifest = existing ?? defaultGlobalManifest(now);
    report.manifestCreated = existing === null;
    manifest.updatedAt = now;
    manifest.lastBootstrap = {
      packageName: options.packageMeta?.name ?? "make-docs",
      packageVersion: options.packageMeta?.version ?? "unknown",
      nodeVersion: process.version,
      at: now,
    };
    manifest.database = {
      file: "store.db",
      schemaVersion:
        report.databaseStatus === "unavailable" ? manifest.database.schemaVersion : report.schemaVersion,
      status: report.databaseStatus,
    };
    writeGlobalManifest(storeRoot, manifest);
  } catch (error) {
    report.warnings.push(
      `Could not write the global manifest at ${report.manifestPath} (${toMessage(error)}).`,
    );
  }

  return report;
}

/** Convenience re-export so callers can assert the expected schema version. */
export { CURRENT_STORE_SCHEMA_VERSION };

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
