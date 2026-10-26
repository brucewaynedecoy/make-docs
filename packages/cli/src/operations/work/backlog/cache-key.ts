import { createHash } from "node:crypto";
import { BACKLOG_RULE_CATALOG_VERSION } from "./catalog.js";
import type { BacklogSnapshotV1, BacklogWorkRecordV1 } from "./schemas.js";

export const BACKLOG_REVIEW_CACHE_SCHEMA_VERSION = 1;
export const BACKLOG_REVIEW_SKILL_VERSION = 1;

export function canonicalJson(value: unknown): string {
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

export function backlogCacheRecordKey(snapshot: BacklogSnapshotV1, record: BacklogWorkRecordV1) {
  return {
    recordPath: record.recordPath,
    recordDigest: backlogRecordDigest(record),
    snapshotSchemaVersion: snapshot.schemaVersion,
    ruleCatalogVersion: BACKLOG_RULE_CATALOG_VERSION,
    skillVersion: BACKLOG_REVIEW_SKILL_VERSION,
  };
}
