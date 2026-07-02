import { existsSync, readFileSync } from "node:fs";
import { getGlobalManifestPath, STORE_DATABASE_FILE } from "./paths";
import { writeStoreJsonFile } from "./json-files";

/**
 * Global manifest: tool-level state for the machine-level store (R-STORE-1).
 * It records what bootstrapped the store and the operational status of the
 * SQLite database. It is not the project install manifest — each project's
 * `<repo>/.make-docs/manifest.json` remains the canonical install record
 * (R-MIR-1); this file carries only tool-level state.
 */

export const GLOBAL_MANIFEST_SCHEMA_VERSION = 1;

export type StoreDatabaseStatus =
  | "ready"
  | "created"
  | "recovered"
  | "schema-newer"
  | "unavailable";

export interface GlobalManifestBootstrapRecord {
  packageName: string;
  packageVersion: string;
  nodeVersion: string;
  at: string;
}

export interface GlobalManifestDatabaseRecord {
  file: string;
  schemaVersion: number | null;
  status: StoreDatabaseStatus;
}

export interface GlobalManifest {
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  lastBootstrap: GlobalManifestBootstrapRecord | null;
  database: GlobalManifestDatabaseRecord;
}

export function defaultGlobalManifest(now: string): GlobalManifest {
  return {
    schemaVersion: GLOBAL_MANIFEST_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    lastBootstrap: null,
    database: {
      file: STORE_DATABASE_FILE,
      schemaVersion: null,
      status: "unavailable",
    },
  };
}

/**
 * Loads the global manifest, tolerating a missing or unreadable file by
 * returning null; callers recreate it, because it is recoverable operational
 * state rather than project knowledge.
 */
export function loadGlobalManifest(storeRoot: string): GlobalManifest | null {
  const manifestPath = getGlobalManifestPath(storeRoot);
  if (!existsSync(manifestPath)) {
    return null;
  }
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch {
    return null;
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const nowFallback = new Date().toISOString();
  const database =
    typeof record.database === "object" && record.database !== null && !Array.isArray(record.database)
      ? (record.database as Record<string, unknown>)
      : {};
  return {
    schemaVersion:
      typeof record.schemaVersion === "number"
        ? record.schemaVersion
        : GLOBAL_MANIFEST_SCHEMA_VERSION,
    createdAt: typeof record.createdAt === "string" ? record.createdAt : nowFallback,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : nowFallback,
    lastBootstrap: normalizeBootstrapRecord(record.lastBootstrap),
    database: {
      file: typeof database.file === "string" ? database.file : STORE_DATABASE_FILE,
      schemaVersion:
        typeof database.schemaVersion === "number" ? database.schemaVersion : null,
      status: normalizeDatabaseStatus(database.status),
    },
  };
}

export function writeGlobalManifest(storeRoot: string, manifest: GlobalManifest): string {
  const manifestPath = getGlobalManifestPath(storeRoot);
  writeStoreJsonFile(manifestPath, manifest);
  return manifestPath;
}

function normalizeBootstrapRecord(value: unknown): GlobalManifestBootstrapRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.packageName !== "string" ||
    typeof record.packageVersion !== "string" ||
    typeof record.nodeVersion !== "string" ||
    typeof record.at !== "string"
  ) {
    return null;
  }
  return {
    packageName: record.packageName,
    packageVersion: record.packageVersion,
    nodeVersion: record.nodeVersion,
    at: record.at,
  };
}

function normalizeDatabaseStatus(value: unknown): StoreDatabaseStatus {
  if (
    value === "ready" ||
    value === "created" ||
    value === "recovered" ||
    value === "schema-newer" ||
    value === "unavailable"
  ) {
    return value;
  }
  return "unavailable";
}
