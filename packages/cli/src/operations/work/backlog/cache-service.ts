import { createHash } from "node:crypto";

import {
  CURRENT_STORE_SCHEMA_VERSION,
  StoreUnavailableError,
  readUserVersion,
  type StoreDatabase,
} from "../../../store/database.js";
import {
  canonicalInstallationPath,
  getExistingInstallationCheckoutId,
  getInstallationCheckoutId,
  withInstallationDatabase,
} from "../../../store/installation-state.js";
import { getStoreDatabasePath } from "../../../store/paths.js";
import { BACKLOG_RULE_CATALOG_VERSION } from "./catalog.js";
import {
  BacklogReportRecordV1Schema,
  type BacklogReportRecordV1,
  type BacklogSnapshotV1,
  type BacklogWorkRecordV1,
} from "./schemas.js";

export const BACKLOG_REVIEW_CACHE_SCHEMA_VERSION = 1;
export const BACKLOG_REVIEW_SKILL_VERSION = 1;
export const BACKLOG_REVIEW_CACHE_FRAGMENT_MAX_BYTES = 65_536;
export const BACKLOG_REVIEW_CACHE_MAX_ENTRIES_PER_CHECKOUT = 512;

export interface BacklogCacheRecordKey {
  recordPath: string;
  recordDigest: string;
  snapshotSchemaVersion: number;
  ruleCatalogVersion: number;
  skillVersion: number;
}

export type BacklogCacheLookupRecord = BacklogCacheRecordKey & (
  | { state: "hit"; fragment: BacklogReportRecordV1 }
  | { state: "miss"; reason: "checkout-not-bound" | "no-exact-match" }
  | { state: "rejected"; reason: string }
);

export interface BacklogCacheLookupResult {
  schemaVersion: 1;
  service: { state: "available"; checkout: "bound" | "unbound" };
  key: {
    snapshotSchemaVersion: number;
    ruleCatalogVersion: number;
    skillVersion: number;
  };
  records: BacklogCacheLookupRecord[];
  counts: { total: number; hits: number; misses: number; rejected: number };
}

export interface BacklogCacheWriteRecordResult extends BacklogCacheRecordKey {
  state: "stored" | "rejected";
  reason?: string;
}

export interface BacklogCacheWriteResult {
  schemaVersion: 1;
  service: { state: "available"; checkout: "bound" | "unbound" };
  key: {
    snapshotSchemaVersion: number;
    ruleCatalogVersion: number;
    skillVersion: number;
  };
  dryRun: boolean;
  records: BacklogCacheWriteRecordResult[];
  counts: { total: number; stored: number; rejected: number; invalidated: number; pruned: number };
}

interface CacheRow {
  record_path: string;
  record_digest: string;
  fragment_json: string;
}

interface CacheWriteOptions {
  dryRun?: boolean;
  maxEntries?: number;
  now?: string;
}

function canonicalJson(value: unknown): string {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize);
    if (!item || typeof item !== "object") return item;
    return Object.fromEntries(
      Object.entries(item as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, normalize(child)]),
    );
  };
  return JSON.stringify(normalize(value));
}

export function backlogRecordDigest(record: BacklogWorkRecordV1): string {
  return createHash("sha256").update(canonicalJson(record)).digest("hex");
}

function keyFor(snapshot: BacklogSnapshotV1, record: BacklogWorkRecordV1): BacklogCacheRecordKey {
  return {
    recordPath: record.recordPath,
    recordDigest: backlogRecordDigest(record),
    snapshotSchemaVersion: snapshot.schemaVersion,
    ruleCatalogVersion: BACKLOG_RULE_CATALOG_VERSION,
    skillVersion: BACKLOG_REVIEW_SKILL_VERSION,
  };
}

function assertSnapshotTarget(targetRoot: string, snapshot: BacklogSnapshotV1): string {
  const canonicalTarget = canonicalInstallationPath(targetRoot);
  if (canonicalInstallationPath(snapshot.targetRoot) !== canonicalTarget) {
    throw new Error("The cache snapshot target does not match the requested project root.");
  }
  return canonicalTarget;
}

function assertCacheSchema(db: StoreDatabase, storeRoot: string): void {
  const version = readUserVersion(db);
  if (version === CURRENT_STORE_SCHEMA_VERSION) return;
  throw new StoreUnavailableError({
    code: "schema-unknown",
    path: getStoreDatabasePath(storeRoot),
    operation: "use backlog review cache",
    retryable: false,
    attempts: 1,
    waitedMs: 0,
    cause:
      `The Store uses schema version ${version}. The backlog review cache requires version ` +
      `${CURRENT_STORE_SCHEMA_VERSION}. Run the reviewed Make Docs update or setup flow before retrying cache use.`,
  });
}

function fragmentPrivacyIssue(fragment: BacklogReportRecordV1, targetRoot: string): string | null {
  const serialized = JSON.stringify(fragment);
  if (Buffer.byteLength(serialized, "utf8") > BACKLOG_REVIEW_CACHE_FRAGMENT_MAX_BYTES) {
    return `fragment exceeds ${BACKLOG_REVIEW_CACHE_FRAGMENT_MAX_BYTES} bytes`;
  }
  const absolutePath = /(^|[\s"'`(])(?:file:\/\/\/|\/[A-Za-z0-9._~-][^\s"'<>]*|[A-Za-z]:\\[^\s"'<>]*)/m;
  const secretValue = /(?:api[_-]?key|password|secret|token)\s*[:=]\s*\S+/i;
  if (serialized.includes(targetRoot) || absolutePath.test(serialized)) {
    return "fragment contains an absolute local path";
  }
  if (secretValue.test(serialized)) {
    return "fragment appears to contain a secret value";
  }
  return null;
}

function fragmentIssue(
  fragmentRaw: unknown,
  snapshotRecord: BacklogWorkRecordV1,
  targetRoot: string,
): { fragment: BacklogReportRecordV1 | null; reason: string | null } {
  const parsed = BacklogReportRecordV1Schema.safeParse(fragmentRaw);
  if (!parsed.success) {
    return { fragment: null, reason: "cached fragment does not match the report-record contract" };
  }
  const fragment = parsed.data;
  if (
    fragment.recordPath !== snapshotRecord.recordPath ||
    fragment.scope !== snapshotRecord.scope ||
    canonicalJson(fragment.createdAt) !== canonicalJson(snapshotRecord.createdAt) ||
    canonicalJson(fragment.lastUpdatedAt) !== canonicalJson(snapshotRecord.lastUpdatedAt)
  ) {
    return { fragment: null, reason: "cached fragment does not match current deterministic facts" };
  }
  const privacy = fragmentPrivacyIssue(fragment, targetRoot);
  return privacy
    ? { fragment: null, reason: privacy }
    : { fragment, reason: null };
}

function countsForLookup(records: BacklogCacheLookupRecord[]): BacklogCacheLookupResult["counts"] {
  return {
    total: records.length,
    hits: records.filter((record) => record.state === "hit").length,
    misses: records.filter((record) => record.state === "miss").length,
    rejected: records.filter((record) => record.state === "rejected").length,
  };
}

export function lookupBacklogReviewCache(
  targetRoot: string,
  snapshot: BacklogSnapshotV1,
  storeRoot: string,
): BacklogCacheLookupResult {
  const root = assertSnapshotTarget(targetRoot, snapshot);
  const keys = snapshot.records.map((record) => keyFor(snapshot, record));
  withInstallationDatabase(root, (db) => assertCacheSchema(db, storeRoot), {
    storeRoot,
    readOnly: true,
  });
  const checkoutId = getExistingInstallationCheckoutId(root, storeRoot);
  if (!checkoutId) {
    const records = keys.map((key): BacklogCacheLookupRecord => ({
      ...key,
      state: "miss",
      reason: "checkout-not-bound",
    }));
    return {
      schemaVersion: BACKLOG_REVIEW_CACHE_SCHEMA_VERSION,
      service: { state: "available", checkout: "unbound" },
      key: {
        snapshotSchemaVersion: snapshot.schemaVersion,
        ruleCatalogVersion: BACKLOG_RULE_CATALOG_VERSION,
        skillVersion: BACKLOG_REVIEW_SKILL_VERSION,
      },
      records,
      counts: countsForLookup(records),
    };
  }

  const rows = withInstallationDatabase(root, (db) => {
    assertCacheSchema(db, storeRoot);
    return db.prepare(`
      SELECT record_path, record_digest, fragment_json
      FROM backlog_review_cache
      WHERE checkout_id = ?
        AND snapshot_schema_version = ?
        AND rule_catalog_version = ?
        AND skill_version = ?
    `).all(
      checkoutId,
      snapshot.schemaVersion,
      BACKLOG_RULE_CATALOG_VERSION,
      BACKLOG_REVIEW_SKILL_VERSION,
    ) as unknown as CacheRow[];
  }, { storeRoot, readOnly: true });

  const rowByKey = new Map(rows.map((row) => [`${row.record_path}\0${row.record_digest}`, row]));
  const snapshotByPath = new Map(snapshot.records.map((record) => [record.recordPath, record]));
  const records = keys.map((key): BacklogCacheLookupRecord => {
    const row = rowByKey.get(`${key.recordPath}\0${key.recordDigest}`);
    if (!row) return { ...key, state: "miss", reason: "no-exact-match" };
    let value: unknown;
    try {
      value = JSON.parse(row.fragment_json);
    } catch {
      return { ...key, state: "rejected", reason: "cached fragment is not valid JSON" };
    }
    const checked = fragmentIssue(value, snapshotByPath.get(key.recordPath)!, root);
    return checked.fragment
      ? { ...key, state: "hit", fragment: checked.fragment }
      : { ...key, state: "rejected", reason: checked.reason! };
  });

  return {
    schemaVersion: BACKLOG_REVIEW_CACHE_SCHEMA_VERSION,
    service: { state: "available", checkout: "bound" },
    key: {
      snapshotSchemaVersion: snapshot.schemaVersion,
      ruleCatalogVersion: BACKLOG_RULE_CATALOG_VERSION,
      skillVersion: BACKLOG_REVIEW_SKILL_VERSION,
    },
    records,
    counts: countsForLookup(records),
  };
}

function sqliteChanges(result: { changes?: number | bigint }): number {
  return Number(result.changes ?? 0);
}

export function writeBacklogReviewCache(
  targetRoot: string,
  snapshot: BacklogSnapshotV1,
  fragments: BacklogReportRecordV1[],
  storeRoot: string,
  options: CacheWriteOptions = {},
): BacklogCacheWriteResult {
  const root = assertSnapshotTarget(targetRoot, snapshot);
  const snapshotByPath = new Map(snapshot.records.map((record) => [record.recordPath, record]));
  const seen = new Set<string>();
  const records: BacklogCacheWriteRecordResult[] = fragments.map((raw) => {
    const snapshotRecord = snapshotByPath.get(raw.recordPath);
    const fallbackKey: BacklogCacheRecordKey = snapshotRecord
      ? keyFor(snapshot, snapshotRecord)
      : {
          recordPath: raw.recordPath,
          recordDigest: createHash("sha256").update(raw.recordPath).digest("hex"),
          snapshotSchemaVersion: snapshot.schemaVersion,
          ruleCatalogVersion: BACKLOG_RULE_CATALOG_VERSION,
          skillVersion: BACKLOG_REVIEW_SKILL_VERSION,
        };
    if (!snapshotRecord) return { ...fallbackKey, state: "rejected", reason: "record is absent from the current snapshot" };
    if (seen.has(raw.recordPath)) return { ...fallbackKey, state: "rejected", reason: "record appears more than once" };
    seen.add(raw.recordPath);
    const checked = fragmentIssue(raw, snapshotRecord, root);
    return checked.fragment
      ? { ...fallbackKey, state: "stored" }
      : { ...fallbackKey, state: "rejected", reason: checked.reason! };
  });

  const accepted = records.filter((record) => record.state === "stored");
  withInstallationDatabase(root, (db) => assertCacheSchema(db, storeRoot), {
    storeRoot,
    readOnly: true,
  });
  const existingCheckoutId = getExistingInstallationCheckoutId(root, storeRoot);
  if (options.dryRun) {
    return {
      schemaVersion: BACKLOG_REVIEW_CACHE_SCHEMA_VERSION,
      service: {
        state: "available",
        checkout: existingCheckoutId ? "bound" : "unbound",
      },
      key: {
        snapshotSchemaVersion: snapshot.schemaVersion,
        ruleCatalogVersion: BACKLOG_RULE_CATALOG_VERSION,
        skillVersion: BACKLOG_REVIEW_SKILL_VERSION,
      },
      dryRun: true,
      records,
      counts: {
        total: records.length,
        stored: accepted.length,
        rejected: records.length - accepted.length,
        invalidated: 0,
        pruned: 0,
      },
    };
  }

  if (accepted.length === 0) {
    return {
      schemaVersion: BACKLOG_REVIEW_CACHE_SCHEMA_VERSION,
      service: {
        state: "available",
        checkout: existingCheckoutId ? "bound" : "unbound",
      },
      key: {
        snapshotSchemaVersion: snapshot.schemaVersion,
        ruleCatalogVersion: BACKLOG_RULE_CATALOG_VERSION,
        skillVersion: BACKLOG_REVIEW_SKILL_VERSION,
      },
      dryRun: false,
      records,
      counts: {
        total: records.length,
        stored: 0,
        rejected: records.length,
        invalidated: 0,
        pruned: 0,
      },
    };
  }

  const checkoutId = existingCheckoutId ?? getInstallationCheckoutId(root, storeRoot);
  const timestamp = options.now ?? new Date().toISOString();
  const fragmentByPath = new Map(fragments.map((fragment) => [fragment.recordPath, fragment]));
  const maxEntries = Math.max(1, Math.min(
    options.maxEntries ?? BACKLOG_REVIEW_CACHE_MAX_ENTRIES_PER_CHECKOUT,
    BACKLOG_REVIEW_CACHE_MAX_ENTRIES_PER_CHECKOUT,
  ));
  let invalidated = 0;
  let pruned = 0;

  withInstallationDatabase(root, (db) => {
    assertCacheSchema(db, storeRoot);
    db.exec("BEGIN IMMEDIATE");
    try {
      for (const record of accepted) {
        invalidated += sqliteChanges(db.prepare(`
          DELETE FROM backlog_review_cache
          WHERE checkout_id = ? AND record_path = ? AND NOT (
            record_digest = ? AND
            snapshot_schema_version = ? AND
            rule_catalog_version = ? AND
            skill_version = ?
          )
        `).run(
          checkoutId,
          record.recordPath,
          record.recordDigest,
          record.snapshotSchemaVersion,
          record.ruleCatalogVersion,
          record.skillVersion,
        ));
        db.prepare(`
          INSERT INTO backlog_review_cache (
            checkout_id, record_path, record_digest, snapshot_schema_version,
            rule_catalog_version, skill_version, fragment_json, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (
            checkout_id, record_path, record_digest, snapshot_schema_version,
            rule_catalog_version, skill_version
          ) DO UPDATE SET fragment_json = excluded.fragment_json, updated_at = excluded.updated_at
        `).run(
          checkoutId,
          record.recordPath,
          record.recordDigest,
          record.snapshotSchemaVersion,
          record.ruleCatalogVersion,
          record.skillVersion,
          JSON.stringify(fragmentByPath.get(record.recordPath)),
          timestamp,
          timestamp,
        );
      }
      const overflow = (db.prepare(`
        SELECT rowid
        FROM backlog_review_cache
        WHERE checkout_id = ?
        ORDER BY updated_at DESC, record_path, record_digest
      `).all(checkoutId) as unknown as Array<{ rowid: number | bigint }>).slice(maxEntries);
      for (const row of overflow) {
        pruned += sqliteChanges(
          db.prepare("DELETE FROM backlog_review_cache WHERE rowid = ?").run(row.rowid),
        );
      }
      db.exec("COMMIT");
    } catch (error) {
      try {
        db.exec("ROLLBACK");
      } catch {
        // SQLite can roll back the transaction before this handler runs.
      }
      throw error;
    }
  }, { storeRoot });

  return {
    schemaVersion: BACKLOG_REVIEW_CACHE_SCHEMA_VERSION,
    service: { state: "available", checkout: "bound" },
    key: {
      snapshotSchemaVersion: snapshot.schemaVersion,
      ruleCatalogVersion: BACKLOG_RULE_CATALOG_VERSION,
      skillVersion: BACKLOG_REVIEW_SKILL_VERSION,
    },
    dryRun: false,
    records,
    counts: {
      total: records.length,
      stored: accepted.length,
      rejected: records.length - accepted.length,
      invalidated,
      pruned,
    },
  };
}
