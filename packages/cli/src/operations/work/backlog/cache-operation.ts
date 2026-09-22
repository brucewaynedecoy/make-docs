import { z } from "zod";

import {
  STORE_READ_PROJECT_READ_ACCESS,
  STORE_WRITE_PROJECT_READ_ACCESS,
} from "../../access.js";
import type { OperationDefinition } from "../../registry.js";
import {
  lookupBacklogReviewCache,
  writeBacklogReviewCache,
} from "./cache-service.js";
import {
  BacklogReportRecordV1Schema,
  BacklogSnapshotV1Schema,
} from "./schemas.js";

export const backlogCacheLookupInputSchema = z
  .object({
    targetRoot: z.string().trim().min(1, "targetRoot is required"),
    snapshot: BacklogSnapshotV1Schema,
  })
  .strict();

export const backlogCacheWriteInputSchema = z
  .object({
    targetRoot: z.string().trim().min(1, "targetRoot is required"),
    snapshot: BacklogSnapshotV1Schema,
    records: z.array(BacklogReportRecordV1Schema).min(1).max(10_000),
  })
  .strict();

export const workBacklogCacheLookupOperation: OperationDefinition<
  z.infer<typeof backlogCacheLookupInputSchema>,
  ReturnType<typeof lookupBacklogReviewCache>
> = {
  id: "work.backlog-cache.lookup",
  summary:
    "Read exact reusable per-record backlog review fragments from the optional Global Store cache.",
  mutates: "read",
  access: STORE_READ_PROJECT_READ_ACCESS,
  status: "active",
  inputSchema: backlogCacheLookupInputSchema,
  handler(input, context) {
    return lookupBacklogReviewCache(input.targetRoot, input.snapshot, context.storeRoot);
  },
};

export const workBacklogCacheWriteOperation: OperationDefinition<
  z.infer<typeof backlogCacheWriteInputSchema>,
  ReturnType<typeof writeBacklogReviewCache>
> = {
  id: "work.backlog-cache.write",
  summary:
    "Save validated per-record backlog review fragments in the optional rebuildable Global Store cache.",
  mutates: "write",
  access: STORE_WRITE_PROJECT_READ_ACCESS,
  status: "active",
  inputSchema: backlogCacheWriteInputSchema,
  handler(input, context) {
    return writeBacklogReviewCache(
      input.targetRoot,
      input.snapshot,
      input.records,
      context.storeRoot,
      { dryRun: context.dryRun, now: context.now() },
    );
  },
};
