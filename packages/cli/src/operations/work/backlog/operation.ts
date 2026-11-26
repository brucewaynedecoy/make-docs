import { z } from "zod";

import { STORE_READ_PROJECT_READ_ACCESS } from "../../access.js";
import type { OperationExecutionContext } from "../../context.js";
import type { OperationDefinition } from "../../registry.js";
import { buildBacklogSnapshot, resolveSafeTargetRoot } from "./snapshot.js";
import { buildBacklogSnapshotForOperation } from "./store-snapshot.js";
import { readyFactoryWorkflowsForCheckout } from "../../factory/handoff.js";
import { checkWorkHarness } from "../work-queue/files-fallback.js";
import { BacklogSnapshotV1Schema, type BacklogSnapshotV1 } from "./schemas.js";

export const backlogSnapshotInputSchema = z
  .object({
    targetRoot: z.string().trim().min(1, "targetRoot is required"),
    workStore: z.boolean().optional().describe(
      "Also read the work store when it is the authority: each work file's text from the store, readiness facts on each record and phase, and the read-only sync check. Without it, the snapshot reads the docs/work/ files and has no readiness or workStore key.",
    ),
    factory: z.boolean().optional().describe(
      "Also name the project's ready factory workflows in a factory key, so that the Work on this wave action hands a wave to the factory. Without a ready workflow, or without a usable Store, the snapshot has no factory key and is the same as without this option.",
    ),
  })
  .strict();

/**
 * W30 R0 P5 T13 and T14: add the ready factory workflows of this checkout.
 * Any failure, a missing grant included, leaves the snapshot as it was, so the
 * action keeps its behavior from before this phase.
 */
async function withFactoryFact(snapshot: BacklogSnapshotV1, targetRoot: string, context: OperationExecutionContext): Promise<BacklogSnapshotV1> {
  const root = resolveSafeTargetRoot(targetRoot);
  try {
    await checkWorkHarness({ operation: "work.backlog.snapshot", access: STORE_READ_PROJECT_READ_ACCESS, root, context });
  } catch {
    return snapshot;
  }
  const fact = readyFactoryWorkflowsForCheckout(root, context.storeRoot);
  return fact ? BacklogSnapshotV1Schema.parse({ ...snapshot, factory: fact }) : snapshot;
}

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
  async handler(input, context) {
    const snapshot = input.workStore === true
      ? await buildBacklogSnapshotForOperation(input.targetRoot, context)
      : buildBacklogSnapshot(input.targetRoot);
    return input.factory === true ? withFactoryFact(snapshot, input.targetRoot, context) : snapshot;
  },
};
