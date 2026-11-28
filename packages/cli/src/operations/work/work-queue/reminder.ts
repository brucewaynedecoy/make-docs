import { STORE_READ_PROJECT_READ_ACCESS, type OperationAccess } from "../../access.js";
import type { OperationExecutionContext } from "../../context.js";
import { previewWorkSync, type WorkSyncPreview } from "../work-store/sync.js";
import { CHECKPOINT_COMMAND, isMakeDocsProject } from "./checkpoint.js";
import { checkWorkHarness } from "./files-fallback.js";
import { CHECKPOINT_STEP, workAuthority, workImportWait } from "./queue.js";

/**
 * W35 R0 P2: the reminder (PRD 52 R-WORK-REMIND, PRD 39 R-RENDER-4).
 *
 * A Make Docs command that already has Store read access in a project says in
 * one line when work files wait for import. The operation runner
 * (`invokeOperation` in `operations/registry.ts`) runs the check after the
 * handler returns, on the state that the operation left. The CLI prints the
 * line on standard error, and an MCP tool result carries it as one field.
 *
 * The check is the exact read-only sync check of `work status` and `work next`
 * (design OD-6 option A). It changes nothing.
 */

/** The reminder line. It names the checkpoint command. */
export const WORK_REMINDER_LINE = `Work files wait for sync. Run: ${CHECKPOINT_COMMAND}`;

/**
 * The reminder as an MCP tool result carries it (PRD 25 R-MCP-REMIND-1). It
 * names the command and the tool, in the form of the first line of `work next`,
 * because an agent with MCP only cannot run the command.
 */
export const WORK_REMINDER_MCP_LINE = `Work files wait for sync. Run: ${CHECKPOINT_STEP}`;

/**
 * Operations of the set that run no reminder check of their own (PRD 39
 * R-RENDER-5). `work.backlog.snapshot` reads no Store state by default (PRD 51
 * R-BACKLOG-SNAPSHOT-24), so it gives the reminder only from the sync check
 * that it ran itself with the work store option.
 */
export const WORK_REMINDER_OWN_CHECK_ONLY_OPERATION_IDS = ["work.backlog.snapshot"] as const;

/**
 * True when an operation result is a refusal: the operation returned, and its
 * result says that it did not do the work. The CLI ends such a command with
 * exit code 1, and no reminder goes with it (PRD 39 R-RENDER-4, PRD 25
 * R-MCP-REMIND-1).
 */
export function isRefusedOperationValue(value: unknown): boolean {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record.result === "refused" || record.accepted === false;
}

/**
 * Operations with Store read access in a project that show no reminder:
 * `work status` and `work next` say the same in their own result, and
 * `work sync` and the checkpoint do the sync.
 */
export const WORK_REMINDER_EXCLUDED_OPERATION_IDS = [
  "work.queue.status",
  "work.queue.next",
  "work.queue.sync",
  "project.checkpoint.run",
] as const;

/** The operation facts that decide the reminder set. */
export interface ReminderOperationFacts {
  id: string;
  status: "active" | "pending";
  access: OperationAccess;
  storeAdmission?: "required" | "optional" | "handler" | "step";
}

/**
 * True when the operation is in the reminder set: it is active, it runs in a
 * Make Docs project, its declared access includes a Store read, and it is not
 * one of the four excluded operations. An operation with Store access and no
 * project access names no project, so it is not in the set.
 */
export function isReminderOperation(operation: ReminderOperationFacts): boolean {
  return operation.status === "active" &&
    operation.access.store !== "none" &&
    operation.access.project !== "none" &&
    !(WORK_REMINDER_EXCLUDED_OPERATION_IDS as readonly string[]).includes(operation.id);
}

/** The work files that the next checkpoint run would import. A conflict and a file that waits for a write or a removal do not count. */
export function workFilesWaitingForImport(preview: WorkSyncPreview): string[] {
  return workImportWait(preview).files;
}

/** The reminder line for a sync check result, or null when no file waits for import. */
export function workReminderOf(preview: WorkSyncPreview): string | null {
  return workFilesWaitingForImport(preview).length > 0 ? WORK_REMINDER_LINE : null;
}

interface ReminderRunState {
  /** How many operations run inside this context now. Only the outermost one checks. */
  depth: number;
  /** A sync check that a read-only handler already ran, so the reminder does not run it again. */
  noted: { root: string; preview: WorkSyncPreview } | null;
}

const RUN_STATE = new WeakMap<OperationExecutionContext, ReminderRunState>();

function runState(context: OperationExecutionContext): ReminderRunState {
  let state = RUN_STATE.get(context);
  if (!state) {
    state = { depth: 0, noted: null };
    RUN_STATE.set(context, state);
  }
  return state;
}

/** The runner calls this before a handler. It returns true for the outermost operation of the context. */
export function enterReminderScope(context: OperationExecutionContext): boolean {
  const state = runState(context);
  state.depth += 1;
  if (state.depth === 1) state.noted = null;
  return state.depth === 1;
}

/** The runner calls this after a handler, also when the handler failed. */
export function leaveReminderScope(context: OperationExecutionContext): void {
  const state = runState(context);
  state.depth = Math.max(0, state.depth - 1);
}

/**
 * A read-only handler that already ran the sync check gives its result here
 * (`work.backlog.snapshot` in store mode). The reminder of the same command
 * then reuses it and reads no work file a second time.
 */
export function noteWorkSyncCheck(context: OperationExecutionContext, root: string, preview: WorkSyncPreview): void {
  runState(context).noted = { root, preview };
}

/** A seam for tests only: it replaces the sync check, for example to force an error inside it. */
let checkOverride: ((root: string) => WorkSyncPreview) | null = null;
export function setWorkReminderCheckForTests(check: ((root: string) => WorkSyncPreview) | null): void {
  checkOverride = check;
}

/** How many times the reminder ran its own sync check in this process. For tests of the reuse. */
let ownChecks = 0;
export function workReminderOwnCheckCount(): number {
  return ownChecks;
}

/**
 * The reminder line of one operation run, or null. It runs after the handler
 * returned. Any error is dropped: the reminder never changes a result or an
 * exit code.
 *
 * Order: the set, then the project, then the caller's Store read access for an
 * operation that the registry did not admit to the Store itself, then the
 * authority rule, then the sync check. An operation that runs no check of its
 * own stops first, with no Store read, when its handler noted no sync check.
 */
export async function workReminderFor(
  operation: ReminderOperationFacts & { mutates: "read" | "write" },
  targetRoot: string,
  context: OperationExecutionContext,
): Promise<string | null> {
  try {
    if (!isReminderOperation(operation)) return null;
    const ownCheckOnly = (WORK_REMINDER_OWN_CHECK_ONLY_OPERATION_IDS as readonly string[]).includes(operation.id);
    // The default snapshot reads no Store state (PRD 51 R-BACKLOG-SNAPSHOT-24): no check, and no line.
    if (ownCheckOnly && runState(context).noted?.root !== targetRoot) return null;
    if (!isMakeDocsProject(targetRoot)) return null;
    const admission = operation.storeAdmission ?? "required";
    // The registry checked a `required` operation against its declared access, which includes a Store read.
    // An `optional` or `handler` operation got no such check, so the same check for a Store read runs here first.
    if (admission !== "required") {
      await checkWorkHarness({ operation: operation.id, access: STORE_READ_PROJECT_READ_ACCESS, root: targetRoot, context });
    }
    if (workAuthority(targetRoot, context.storeRoot, null).mode !== "store") return null;
    const noted = runState(context).noted;
    let preview: WorkSyncPreview;
    // A result that a read-only operation noted is still true when it ends. A write operation may have changed the state.
    if (noted && noted.root === targetRoot && (ownCheckOnly || (operation.mutates === "read" && checkOverride === null))) {
      preview = noted.preview;
    } else {
      ownChecks += 1;
      preview = checkOverride
        ? checkOverride(targetRoot)
        : previewWorkSync(targetRoot, { storeRoot: context.storeRoot, now: new Date(context.now()) });
    }
    return workReminderOf(preview);
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------------ */
/* The CLI line                                                             */
/* ------------------------------------------------------------------------ */

let pendingCliReminder: string | null = null;

/** The runner keeps the line of a CLI command here. One slot, so one command run prints at most one line. */
export function holdCliReminder(line: string | null): void {
  pendingCliReminder = line;
}

/** Take the held line, and clear it. The CLI entry prints it on standard error after the normal output, when the command ends with exit code 0. */
export function takeCliReminder(): string | null {
  const line = pendingCliReminder;
  pendingCliReminder = null;
  return line;
}
