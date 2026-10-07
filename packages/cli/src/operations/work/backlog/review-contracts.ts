import { z } from "zod";
import { BacklogLiveEnvelopeV1Schema, BacklogRefreshResultV1Schema, createBacklogRefreshResult } from "./live-contracts.js";
import { BacklogLivePayloadV1Schema, BacklogModelSummaryV1Schema, createBacklogLivePayload } from "./presentation.js";
import { BacklogRecordCountsSchema, BacklogReportRecordV1Schema, BacklogReportV1Schema, BacklogSnapshotV1Schema } from "./schemas.js";

export const backlogReviewOpenInputSchema = z.strictObject({ report: BacklogReportV1Schema, sessionId: z.string().uuid().optional() });
export const backlogReviewRefreshInputSchema = z.strictObject({ envelope: BacklogLiveEnvelopeV1Schema });

const count = z.number().int().nonnegative();
const counts = z.strictObject({ total: count, hits: count, misses: count, rejected: count });
const key = { recordPath: z.string().min(1), recordDigest: z.string().regex(/^[a-f0-9]{64}$/),
  snapshotSchemaVersion: z.literal(1), ruleCatalogVersion: z.number().int().positive(), skillVersion: z.number().int().positive() };
// This validates the existing service result at the transport boundary. It changes no cache rules or storage schema.
const lookupResult = z.strictObject({
  schemaVersion: z.literal(1),
  service: z.strictObject({ state: z.literal("available"), checkout: z.enum(["bound", "unbound"]) }),
  key: z.strictObject({ snapshotSchemaVersion: z.literal(1), ruleCatalogVersion: z.number().int().positive(), skillVersion: z.number().int().positive() }),
  records: z.array(z.discriminatedUnion("state", [
    z.strictObject({ ...key, state: z.literal("hit"), fragment: BacklogReportRecordV1Schema }),
    z.strictObject({ ...key, state: z.literal("miss"), reason: z.enum(["checkout-not-bound", "no-exact-match"]) }),
    z.strictObject({ ...key, state: z.literal("rejected"), reason: z.string() }),
  ])), counts,
}).superRefine((value, context) => {
  if (value.counts.total !== value.records.length || ["hit", "miss", "rejected"].some((state, index) =>
    value.records.filter(record => record.state === state).length !== [value.counts.hits, value.counts.misses, value.counts.rejected][index]) ||
    new Set(value.records.map(record => record.recordPath)).size !== value.records.length) {
    context.addIssue({ code: "custom", message: "Cache counts must describe unique service results." });
  }
});

export const BacklogReviewCacheResultSchema = z.discriminatedUnion("state", [
  z.strictObject({ state: z.literal("available"), result: lookupResult }),
  z.strictObject({ state: z.literal("unavailable"), operation: z.literal("work.backlog-cache.lookup"),
    reason: z.enum(["store-not-configured", "store-unavailable", "store-unsafe", "store-denied", "cache-unavailable"]),
    nextAction: z.literal("Current source facts are available. Continue the review. Restore cache access before a later cache lookup.") }),
  z.strictObject({ state: z.literal("not-attempted"), reason: z.literal("source-unavailable") }),
]);
export type BacklogReviewCacheResult = z.infer<typeof BacklogReviewCacheResultSchema>;

const cacheSummary = z.discriminatedUnion("state", [
  z.strictObject({ state: z.literal("available"), counts }),
  BacklogReviewCacheResultSchema.options[1], BacklogReviewCacheResultSchema.options[2],
]);
const refreshSummary = z.strictObject({
  state: z.enum(["unchanged", "changed", "unavailable"]), reviewState: z.enum(["current", "needs-review", "last-known"]),
  sessionId: z.uuid(), modelId: z.string(), projectKey: z.string(), previousSnapshotId: z.string(), snapshotId: z.string().nullable(),
  reason: z.enum(["source-unavailable", "source-denied", "source-unsafe"]).nullable(),
  changes: z.strictObject({ added: count, changed: count, removed: count }).nullable(),
});
const modelSchema = z.strictObject({
  schemaVersion: z.literal(1), operation: z.literal("backlog.review.refresh"), refresh: refreshSummary,
  currentSnapshot: z.strictObject({ recordCounts: BacklogRecordCountsSchema, diagnosticCount: count }).nullable(),
  cache: cacheSummary, priorReview: BacklogModelSummaryV1Schema,
  limits: z.tuple([z.literal("The prior report remains the last reviewed result. A refresh does not create new review conclusions."),
    z.literal("The full current snapshot, exact change lists, and cache fragments are client-visible data. They are not secret storage.")]),
});

function modelFor(envelope: z.infer<typeof BacklogLiveEnvelopeV1Schema>, snapshot: z.infer<typeof BacklogSnapshotV1Schema> | null,
  refresh: z.infer<typeof BacklogRefreshResultV1Schema>, cache: BacklogReviewCacheResult) {
  return modelSchema.parse({ schemaVersion: 1, operation: "backlog.review.refresh",
    refresh: { state: refresh.state, reviewState: refresh.reviewState, sessionId: refresh.sessionId, modelId: refresh.modelId,
      projectKey: refresh.projectKey, previousSnapshotId: refresh.previousSnapshotId, snapshotId: refresh.snapshotId,
      reason: refresh.state === "unavailable" ? refresh.reason : null,
      changes: refresh.state === "unavailable" ? null : { added: refresh.added.length, changed: refresh.changed.length, removed: refresh.removed.length } },
    currentSnapshot: snapshot ? { recordCounts: snapshot.recordCounts, diagnosticCount: snapshot.diagnostics.length } : null,
    cache: cache.state === "available" ? { state: cache.state, counts: cache.result.counts } : cache,
    priorReview: createBacklogLivePayload(envelope.report, envelope.sessionId).structuredContent,
    limits: ["The prior report remains the last reviewed result. A refresh does not create new review conclusions.",
      "The full current snapshot, exact change lists, and cache fragments are client-visible data. They are not secret storage."],
  });
}

function narrationFor(model: z.infer<typeof modelSchema>): string {
  const result = model.refresh;
  const lines = [result.state === "unavailable"
    ? `Refresh unavailable (${result.reason}). The prior report is last known. Check source access, then refresh again.`
    : result.state === "changed"
      ? `Source changed: ${result.changes!.added} added, ${result.changes!.changed} changed, and ${result.changes!.removed} removed records. The prior report needs a new review. Ask the active agent to review the current facts.`
      : "Source unchanged. The prior reviewed report is current for this snapshot."];
  if (model.cache.state === "available") lines.push(`Exact cache lookup: ${model.cache.counts.hits} hits, ${model.cache.counts.misses} misses, and ${model.cache.counts.rejected} rejected fragments. Cached fragments do not replace a new review.`);
  else if (model.cache.state === "unavailable") lines.push(`Cache lookup unavailable (${model.cache.reason}). ${model.cache.nextAction}`);
  else lines.push("Cache lookup was not attempted because current source facts are unavailable.");
  lines.push(model.limits[0]);
  return lines.join("\n");
}

export const BacklogReviewRefreshPayloadV1Schema = z.strictObject({
  content: z.tuple([z.strictObject({ type: z.literal("text"), text: z.string() })]),
  structuredContent: modelSchema,
  _meta: z.strictObject({ backlog: z.strictObject({ schemaVersion: z.literal(1), dataBoundary: z.literal("client-visible-not-secret"),
    envelope: BacklogLiveEnvelopeV1Schema, currentSnapshot: BacklogSnapshotV1Schema.nullable(),
    refresh: BacklogRefreshResultV1Schema, cache: BacklogReviewCacheResultSchema }) }),
}).superRefine((value, context) => {
  const { envelope, currentSnapshot, refresh, cache } = value._meta.backlog;
  const expected = createBacklogRefreshResult(envelope, currentSnapshot ? { state: "available", snapshot: currentSnapshot }
    : { state: "unavailable", reason: refresh.state === "unavailable" ? refresh.reason : "source-unavailable" });
  if (JSON.stringify(expected) !== JSON.stringify(refresh) ||
    JSON.stringify(modelFor(envelope, currentSnapshot, refresh, cache)) !== JSON.stringify(value.structuredContent) ||
    narrationFor(value.structuredContent) !== value.content[0].text ||
    (currentSnapshot === null ? cache.state !== "not-attempted" : cache.state === "not-attempted")) {
    context.addIssue({ code: "custom", message: "Refresh output must describe the same current facts, prior review, and cache result." });
  }
});
export type BacklogReviewRefreshPayloadV1 = z.infer<typeof BacklogReviewRefreshPayloadV1Schema>;

export function createBacklogReviewRefreshPayload(envelopeInput: unknown, snapshotInput: unknown | null,
  refreshInput: unknown, cacheInput: unknown): BacklogReviewRefreshPayloadV1 {
  const envelope = BacklogLiveEnvelopeV1Schema.parse(envelopeInput);
  const snapshot = snapshotInput === null ? null : BacklogSnapshotV1Schema.parse(snapshotInput);
  const refresh = BacklogRefreshResultV1Schema.parse(refreshInput);
  const cache = BacklogReviewCacheResultSchema.parse(cacheInput);
  const model = modelFor(envelope, snapshot, refresh, cache);
  return BacklogReviewRefreshPayloadV1Schema.parse({ content: [{ type: "text", text: narrationFor(model) }], structuredContent: model,
    _meta: { backlog: { schemaVersion: 1, dataBoundary: "client-visible-not-secret", envelope, currentSnapshot: snapshot, refresh, cache } } });
}

export { BacklogLivePayloadV1Schema };
