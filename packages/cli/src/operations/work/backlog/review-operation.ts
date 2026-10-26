import { randomUUID } from "node:crypto";
import type { z } from "zod";
import { PROJECT_READ_ACCESS, STORE_READ_PROJECT_READ_ACCESS } from "../../access.js";
import type { OperationDefinition } from "../../registry.js";
import { createBacklogRefreshResult } from "./live-contracts.js";
import { createBacklogLivePayload, BacklogLivePayloadV1Schema, type BacklogLivePayloadV1 } from "./presentation.js";
import { BacklogSnapshotV1Schema } from "./schemas.js";
import { backlogSourceFailureReason } from "./source-failure.js";
import { backlogReviewOpenInputSchema, backlogReviewRefreshInputSchema, BacklogReviewRefreshPayloadV1Schema,
  createBacklogReviewRefreshPayload, BacklogReviewCacheResultSchema, type BacklogReviewCacheResult, type BacklogReviewRefreshPayloadV1 } from "./review-contracts.js";

export const BACKLOG_REVIEW_UI_URI = "ui://make-docs/backlog-review/v1.html";
const metadata = { profiles: ["backlog" as const], defaultExposure: "deferred" as const, uiResourceUri: BACKLOG_REVIEW_UI_URI };

export const backlogReviewOpenOperation: OperationDefinition<z.infer<typeof backlogReviewOpenInputSchema>, BacklogLivePayloadV1> = {
  id: "backlog.review.open", summary: "Open a validated backlog report with a new live session and a useful chat summary.",
  mutates: "read", access: PROJECT_READ_ACCESS, status: "active", mcp: metadata,
  inputSchema: backlogReviewOpenInputSchema, mcpResultSchema: BacklogLivePayloadV1Schema,
  handler: input => createBacklogLivePayload(input.report, input.sessionId ?? randomUUID()),
};

export const backlogReviewRefreshOperation: OperationDefinition<z.infer<typeof backlogReviewRefreshInputSchema>, BacklogReviewRefreshPayloadV1> = {
  id: "backlog.review.refresh", summary: "Read current backlog facts and one optional exact cache lookup. Keep the prior reviewed report.",
  mutates: "read", access: STORE_READ_PROJECT_READ_ACCESS, storeAdmission: "optional", status: "active", mcp: metadata,
  inputSchema: backlogReviewRefreshInputSchema, mcpResultSchema: BacklogReviewRefreshPayloadV1Schema,
  async handler(input, context) {
    const { invokeOperation } = await import("../../registry.js");
    const { envelope } = input;
    const targetRoot = envelope.report.snapshot.targetRoot;
    let snapshot;
    try {
      const current = await invokeOperation("work.backlog.snapshot", { targetRoot }, context);
      snapshot = BacklogSnapshotV1Schema.parse(current.value);
    } catch (error) {
      const refresh = createBacklogRefreshResult(envelope, { state: "unavailable", reason: backlogSourceFailureReason(error) });
      return createBacklogReviewRefreshPayload(envelope, null, refresh, { state: "not-attempted", reason: "source-unavailable" });
    }
    // A project identity change is rejected. Cache availability cannot excuse a wrong project.
    const refresh = createBacklogRefreshResult(envelope, { state: "available", snapshot });
    let cache: BacklogReviewCacheResult;
    try {
      const lookup = await invokeOperation("work.backlog-cache.lookup", { targetRoot, snapshot }, context);
      cache = BacklogReviewCacheResultSchema.parse({ state: "available", result: lookup.value });
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      const reason = ["store-not-configured", "store-unavailable", "store-unsafe", "store-denied"].includes(code)
        ? code as Extract<BacklogReviewCacheResult, { state: "unavailable" }>["reason"] : "cache-unavailable";
      cache = { state: "unavailable", operation: "work.backlog-cache.lookup", reason,
        nextAction: "Current source facts are available. Continue the review. Restore cache access before a later cache lookup." };
    }
    return createBacklogReviewRefreshPayload(envelope, snapshot, refresh, cache);
  },
};

export const backlogReviewOperations = [backlogReviewOpenOperation, backlogReviewRefreshOperation];
