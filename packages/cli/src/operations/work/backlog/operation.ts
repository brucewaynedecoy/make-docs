import { z } from "zod";

import { STORE_READ_PROJECT_READ_ACCESS } from "../../access.js";
import type { OperationDefinition } from "../../registry.js";
import { buildBacklogSnapshot } from "./snapshot.js";
import { buildBacklogSnapshotForOperation } from "./store-snapshot.js";

export const backlogSnapshotInputSchema = z
  .object({
    targetRoot: z.string().trim().min(1, "targetRoot is required"),
    workStore: z.boolean().optional().describe(
      "Also read the work store when it is the authority: each work file's text from the store, readiness facts on each record and phase, and the read-only sync check. Without it, the snapshot reads the docs/work/ files and has no readiness or workStore key.",
    ),
  })
  .strict();

/**
 * One read-only operation for the full deterministic backlog snapshot. By
 * default it reads the docs/work/ files exactly as before, in every mode, so
 * an installed Skill copy with the older strict schema accepts it. With
 * `workStore: true` (CLI `--work-store`), it reads the work store when the
 * store is the authority and adds the store-mode keys (owner decision
 * 2026-11-23, option A; PRD 51 R-BACKLOG-SNAPSHOT-24, R-BACKLOG-SNAPSHOT-31).
 */
export const workBacklogSnapshotOperation: OperationDefinition<
  z.infer<typeof backlogSnapshotInputSchema>,
  ReturnType<typeof buildBacklogSnapshot>
> = {
  id: "work.backlog.snapshot",
  mcp: { profiles: ["backlog"], defaultExposure: "deferred" },
  summary:
    "Read every live and archived work record into the version 1 deterministic backlog snapshot.",
  mutates: "read",
  // Store-optional read: the handler reads the Store only when the work store is the authority.
  access: STORE_READ_PROJECT_READ_ACCESS,
  storeAdmission: "optional",
  status: "active",
  inputSchema: backlogSnapshotInputSchema,
  handler(input, context) {
    return input.workStore === true
      ? buildBacklogSnapshotForOperation(input.targetRoot, context)
      : buildBacklogSnapshot(input.targetRoot);
  },
};
