import { z } from "zod";

import { PROJECT_READ_ACCESS } from "../../access.js";
import type { OperationDefinition } from "../../registry.js";
import { buildBacklogSnapshot } from "./snapshot.js";

export const backlogSnapshotInputSchema = z
  .object({
    targetRoot: z.string().trim().min(1, "targetRoot is required"),
  })
  .strict();

/** One Store-free, read-only operation for the full deterministic backlog snapshot. */
export const workBacklogSnapshotOperation: OperationDefinition<
  z.infer<typeof backlogSnapshotInputSchema>,
  ReturnType<typeof buildBacklogSnapshot>
> = {
  id: "work.backlog.snapshot",
  summary:
    "Read every live and archived work record into the version 1 deterministic backlog snapshot.",
  mutates: "read",
  access: PROJECT_READ_ACCESS,
  status: "active",
  inputSchema: backlogSnapshotInputSchema,
  handler(input) {
    return buildBacklogSnapshot(input.targetRoot);
  },
};
