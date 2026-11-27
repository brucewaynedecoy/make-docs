import path from "node:path";
import { z } from "zod";

import { STORE_READ_PROJECT_READ_ACCESS, STORE_WRITE_PROJECT_WRITE_ACCESS } from "../access";
import type { OperationExecutionContext } from "../context";
import type { OperationDefinition } from "../registry";
import { StoreAccessStateError } from "../store-access";
import type { JsonValue } from "../types";
import {
  CHECKPOINT_EVENTS,
  checkpointEventRefusal,
  checkpointNotAProject,
  isMakeDocsProject,
  workCheckpoint,
  type CheckpointReadReason,
} from "../work/work-queue/checkpoint";
import { checkWorkHarness } from "../work/work-queue/files-fallback";
import { workAuthority } from "../work/work-queue/queue";

/**
 * W35 R0 P1: the project checkpoint operation (PRD 39 R-CHECKPOINT-CMD, PRD 52
 * R-WORK-CHECKPOINT). One registry operation with one MCP tool
 * (`project_checkpoint`) and one CLI command (`make-docs project checkpoint`).
 *
 * It declares the access of its sync step, Store write and project write, and
 * the `step` Store admission (PRD 25 R-ACCESS-17). So the registry skips
 * three things before the handler, and this handler does each one: the caller
 * check (the read access first, as `work status` does, and the write access
 * only when the sync step would run), the surface write permission, and the
 * Store session. The registry keeps every other check, and also the guard
 * that refuses a production Store operation with no explicit route. A caller with read access only, and a call from a surface that did not
 * allow writes, get the read steps and a result that says the sync did not run.
 */

export const PROJECT_CHECKPOINT_OPERATION_ID = "project.checkpoint.run";

const checkpointInput = z.object({
  targetRoot: z.string().min(1).optional()
    .describe("The project folder. The default is the current folder."),
  event: z.enum(CHECKPOINT_EVENTS, { error: (issue) => checkpointEventRefusal(String(issue.input)) }).optional()
    .describe("Only a hook gives this. It names what happened: session-start, files-changed, turn-end, commit, branch-change, or phase-closed. With it, the run imports only, writes no project file, and reports nothing when nothing is due. Leave it out for a direct run."),
}).strict();

/** The caller's refusal for `access`, or null when the caller has it. Any other error is thrown. */
async function harnessRefusal(
  access: typeof STORE_READ_PROJECT_READ_ACCESS,
  root: string,
  context: OperationExecutionContext,
): Promise<StoreAccessStateError | null> {
  try {
    await checkWorkHarness({ operation: PROJECT_CHECKPOINT_OPERATION_ID, access, root, context });
    return null;
  } catch (error) {
    if (error instanceof StoreAccessStateError) return error;
    throw error;
  }
}

/**
 * A refusal reason can hold many lines, such as one line for each problem of a
 * broken project config. The checkpoint gives the first line and the count of
 * the other lines, and the next step names the command that shows the rest.
 */
export function firstReasonLine(reason: string): string {
  const [first, ...rest] = reason.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
  if (first === undefined || rest.length === 0) return reason;
  return `${first.replace(/[.:]$/, "")} (${rest.length} more ${rest.length === 1 ? "line" : "lines"} not shown).`;
}

export const projectCheckpointOperations: OperationDefinition[] = [{
  id: PROJECT_CHECKPOINT_OPERATION_ID,
  summary: "Do all that is due for the work of this project: sync the docs/work/ files and the work store, name each conflict with its settle commands, list each claim that ended or ends soon, and list the next ready work. This is not lifecycle_checkpoint, which records one step of one lifecycle run.",
  mutates: "write",
  access: STORE_WRITE_PROJECT_WRITE_ACCESS,
  // PRD 25 R-ACCESS-17: the handler checks the write access at the sync step.
  storeAdmission: "step",
  status: "active",
  mcp: { profiles: ["backlog", "workflow"], defaultExposure: "deferred" },
  inputSchema: checkpointInput,
  async handler(raw, context) {
    const input = checkpointInput.parse(raw);
    const root = path.resolve(input.targetRoot ?? context.cwd);
    const event = input.event ?? null;
    // A folder that is not a Make Docs project: one line, and no Store is read.
    if (!isMakeDocsProject(root)) return checkpointNotAProject(root, event) as unknown as JsonValue;
    const env = { storeRoot: context.storeRoot, now: new Date(context.now()) };

    // Step 1: who is in charge, with the rule of `work status`. A caller with no Store access gets the files.
    const noRead = await harnessRefusal(STORE_READ_PROJECT_READ_ACCESS, root, context);
    const authority = workAuthority(root, context.storeRoot, noRead ? { reason: firstReasonLine(noRead.reason), nextAction: noRead.nextAction } : null);
    if (authority.mode !== "store") {
      return workCheckpoint(root, env, { event, access: "read", readReason: null, authority }) as unknown as JsonValue;
    }

    // Step 2 needs more access than the other steps, so this is where the write access is checked.
    let readReason: CheckpointReadReason | null = null;
    if (context.dryRun) readReason = "dry-run";
    else if (!context.writesAllowed) readReason = "read-access-only";
    else if (await harnessRefusal(STORE_WRITE_PROJECT_WRITE_ACCESS, root, context)) readReason = "read-access-only";
    const writes = readReason === null && event !== "branch-change";
    return await context.withStoreSession(
      writes ? "write" : "read",
      PROJECT_CHECKPOINT_OPERATION_ID,
      writes ? STORE_WRITE_PROJECT_WRITE_ACCESS : STORE_READ_PROJECT_READ_ACCESS,
      root,
      () => workCheckpoint(root, env, { event, access: readReason === null ? "write" : "read", readReason, authority }) as unknown as JsonValue,
    );
  },
}];
