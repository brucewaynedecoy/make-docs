import { existsSync } from "node:fs";

import { getMakeDocsConfigPath } from "../../../config.js";
import { getExistingInstallationCheckoutId, readDeclarativeProjectId } from "../../../store/installation-state.js";
import { listSyncConflicts, listWorkClaims, listWorkUnits, readWorkStore } from "../../../store/work-store.js";
import { WORK_CLAIM_POLICY } from "../work-store/catalog.js";
import type { WorkAuthorityMode, WorkStoreState } from "../work-store/schemas.js";
import { WORK_SYNC_HOLD_REASON, previewWorkSync, readWorkSyncConfig, syncWorkFiles } from "../work-store/sync.js";
import { WORK_FILE_ROOTS } from "../work-store/work-file.js";
import {
  checkOutcome,
  syncOutcome,
  type WorkAuthority,
  type WorkQueueEnv,
  type WorkSyncConflictLine,
  type WorkSyncOutcome,
} from "./queue.js";
import { compareWorkCoordinates, computeWorkReadiness } from "./readiness.js";

/**
 * W35 R0 P1: the core of the project checkpoint (`project.checkpoint.run`,
 * PRD 39 R-CHECKPOINT-CMD). It does all that is due for the work of a
 * project, in a fixed order: authority, sync, claims that ended or end soon,
 * the next ready work, and one summary line.
 *
 * This module is the shared core. The registry operation in
 * `project/checkpoint-ops.ts` calls it for the CLI and the MCP tool. The
 * operation finds the authority and the caller's access first and passes them
 * in (`authority`, `access`, and `readReason`), because the sync step needs
 * more access than the read steps (PRD 25 R-ACCESS-17).
 *
 * It adds no Store table. It reads and writes only what `work sync`,
 * `work status`, and `work next` use.
 */

/** The event names of a trigger run (PRD 39 R-CHECKPOINT-CMD-2). */
export const CHECKPOINT_EVENTS = ["session-start", "files-changed", "turn-end", "commit", "branch-change", "phase-closed"] as const;
export type CheckpointEvent = (typeof CHECKPOINT_EVENTS)[number];

/** The words that refuse an unknown event name, with the list of names. */
export function checkpointEventRefusal(name: string): string {
  return `"${name}" is not a checkpoint event. The events are: ${CHECKPOINT_EVENTS.join(", ")}.`;
}

export function isCheckpointEvent(name: string): name is CheckpointEvent {
  return (CHECKPOINT_EVENTS as readonly string[]).includes(name);
}

/** The checkpoint command, as each result line names it. */
export const CHECKPOINT_COMMAND = "make-docs project checkpoint";

/** Why a trigger run holds a file: it never writes or removes a project file. */
export const CHECKPOINT_TRIGGER_HOLD_REASON = `A hook started this run, so Make Docs writes and removes no project file. Run ${CHECKPOINT_COMMAND} to apply it.`;

/** Why the sync step did not run, or null when it ran. */
export type CheckpointSyncSkip = "read-access-only" | "dry-run" | "branch-change" | "files-authority" | "not-a-project";

/** Why a caller gets the read steps only: it has read access only, or it asked for a dry run. */
export type CheckpointReadReason = "read-access-only" | "dry-run";

/** A claim that ended or ends soon. It never holds the claim ID (PRD 52 R-WORK-QUEUE-19). */
export interface CheckpointClaimLine {
  unit: string;
  coordinate: string;
  claimant: string;
  expiresAt: string;
  state: "ended" | "ends-soon";
  hasTaskHandle: boolean;
  revision: number;
  /** The release command for a claim that ended, or the renew command for a claim that ends soon. */
  command: string;
}

/** One ready unit, in the short form of `work next`. */
export interface CheckpointNextUnit {
  unit: string;
  coordinate: string;
  title: string;
  sourcePath: string | null;
  revision: number;
  claimCommand: string;
}

export interface WorkCheckpointResult {
  operation: "project.checkpoint.run";
  /** `direct` with no event, `trigger` with an event. */
  run: "direct" | "trigger";
  event: CheckpointEvent | null;
  /** Who is in charge: the work store, the docs/work/ files, or nobody because the folder is no Make Docs project. */
  authority: WorkAuthorityMode | "not-a-project";
  storeState: WorkStoreState | null;
  reason: string;
  nextAction: string | null;
  /** The checkout that this run synced or checked. */
  checkout: { root: string; checkoutId: string | null };
  /** True when this run was the first sync of the checkout. */
  firstSync: boolean;
  /** True when the first sync of the checkout is not done, and this run did not do it. */
  firstSyncWaits: boolean;
  /** False when the sync step did not run. `syncSkipped` says why. */
  syncRan: boolean;
  syncSkipped: CheckpointSyncSkip | null;
  sync: WorkSyncOutcome | null;
  imported: string[];
  written: string[];
  removed: string[];
  /** Files that wait: for a direct run after a trigger run, or for a caller with write access. */
  waiting: Array<{ path: string; waitsFor: "import" | "write" | "removal" }>;
  conflicts: WorkSyncConflictLine[];
  /** Files on the sync hold list (`work.syncHold`) that differ from the store. No sync writes or removes them, so they are not "due". */
  held: Array<{ path: string; reason: string }>;
  /** Files that differ from the store and that the sync could not write from it, each with the reason of `work sync`. They are not "due". A check that does not sync leaves this list empty. */
  notWritten: Array<{ path: string; reason: string }>;
  /** Work files that Make Docs cannot read. They are not "due". `line` and `message` are null when a read-only check found the file. */
  unreadable: Array<{ path: string; line: number | null; message: string | null }>;
  claims: CheckpointClaimLine[];
  readyCount: number;
  next: CheckpointNextUnit[];
  /**
   * This run imported no file, no file waits for a write or a removal, and no
   * conflict waits. A held file that differs, a file that the sync could not
   * write, and a file that cannot be read do not change this field. The
   * summary line names them.
   */
  nothingDue: boolean;
  /** True for a trigger run with nothing due: the surface prints nothing. */
  quiet: boolean;
  lines: string[];
  summary: string;
}

export interface WorkCheckpointInput {
  event: CheckpointEvent | null;
  /** `write` when the caller may sync. `read` when the caller has Store read and project read access only. */
  access: "write" | "read";
  /** Why `access` is `read`. The default is `read-access-only`. */
  readReason?: CheckpointReadReason | null;
  /** The authority of this checkout, from the rule of `work status`. */
  authority: WorkAuthority;
}

/**
 * The events that a git hook gives (W35 R0 P5, PRD 52 R-WORK-CHECKPOINT-13 and R-WORK-CHECKPOINT-14). A trigger run
 * with one of them prints the short form: the summary line and, when something waits, one line with the command.
 */
export const CHECKPOINT_GIT_HOOK_EVENTS: readonly CheckpointEvent[] = ["commit", "branch-change"];

/**
 * How long a trigger run in the foreground with an event of a git hook, `commit` or `branch-change`, waits at
 * each wait for the Store, in milliseconds (PRD 52 R-WORK-CHECKPOINT-14). It is a fixed rule of the checkpoint,
 * with no input. It bounds each wait for the Store by itself: the busy time of a connection, a shared session, a
 * named lock file, and a checkout writer. It does not bound the work of the run. A direct run, and a trigger run
 * with another event, keep the wait times of the Store. A git hook reaches this bound only in its foreground
 * fallback.
 */
export const CHECKPOINT_GIT_HOOK_STORE_WAIT_MS = 1000;

/**
 * How long a background run that a git hook started waits at each wait for the Store, in milliseconds: the
 * normal busy time of the Store (`STORE_BUSY_TIMEOUT_MS`). Git does not wait for such a run, so it has no short
 * limit. It still never waits the 30,000 ms of a live Store owner.
 */
export const CHECKPOINT_GIT_HOOK_BACKGROUND_STORE_WAIT_MS = 5000;

/** The second line of the short form: the one command that shows and settles what waits. */
export const CHECKPOINT_SHORT_COMMAND_LINE = `Run ${CHECKPOINT_COMMAND} to see and settle what waits.`;

/** How many ready units the short list shows. */
export const CHECKPOINT_NEXT_LIMIT = 3;

function count(value: number, word: string, plural = `${word}s`): string {
  return `${value} ${value === 1 ? word : plural}`;
}

function base(root: string, input: Pick<WorkCheckpointInput, "event">): Pick<WorkCheckpointResult, "operation" | "run" | "event" | "firstSync" | "firstSyncWaits" | "sync" | "imported" | "written" | "removed" | "waiting" | "conflicts" | "held" | "notWritten" | "unreadable" | "claims" | "readyCount" | "next"> & { checkout: { root: string; checkoutId: string | null } } {
  return {
    operation: "project.checkpoint.run",
    run: input.event === null ? "direct" : "trigger",
    event: input.event,
    checkout: { root, checkoutId: null },
    firstSync: false,
    firstSyncWaits: false,
    sync: null,
    imported: [],
    written: [],
    removed: [],
    waiting: [],
    conflicts: [],
    held: [],
    notWritten: [],
    unreadable: [],
    claims: [],
    readyCount: 0,
    next: [],
  };
}

/** The result in a folder that is not a Make Docs project: one line, and nothing else happens. */
export function checkpointNotAProject(root: string, event: CheckpointEvent | null): WorkCheckpointResult {
  const reason = `${root} is not a Make Docs project, so the checkpoint did nothing.`;
  return {
    ...base(root, { event }),
    authority: "not-a-project",
    storeState: null,
    reason,
    nextAction: null,
    syncRan: false,
    syncSkipped: "not-a-project",
    nothingDue: true,
    quiet: event !== null,
    lines: [reason],
    summary: reason,
  };
}

/** True when the folder holds a Make Docs project config. A file check only: it reads no Store. */
export function isMakeDocsProject(root: string): boolean {
  return existsSync(getMakeDocsConfigPath(root));
}

/**
 * Run the checkpoint for the project at `root`. The caller found the authority
 * and the caller's access first. Without a usable Store the result is one line
 * and nothing is read or written.
 */
export function workCheckpoint(root: string, env: WorkQueueEnv, input: WorkCheckpointInput): WorkCheckpointResult {
  const { authority, event } = input;
  if (!isMakeDocsProject(root)) return checkpointNotAProject(root, event);
  const trigger = event !== null;

  /* Step 1: who is in charge (the rule of `work status`). */
  if (authority.mode !== "store") {
    const line = `${authority.reason} The checkpoint synced nothing.`;
    // A direct run names the next command in plain words. A trigger run prints nothing here.
    const lines = authority.nextAction ? [line, authority.nextAction] : [line];
    return {
      ...base(root, input),
      authority: authority.mode,
      storeState: authority.storeState,
      reason: authority.reason,
      nextAction: authority.nextAction,
      syncRan: false,
      syncSkipped: "files-authority",
      nothingDue: true,
      quiet: trigger,
      lines,
      summary: lines.join("\n"),
    };
  }

  const result = base(root, input);
  result.checkout.checkoutId = getExistingInstallationCheckoutId(root, env.storeRoot);

  /* Step 2: sync. A trigger run only imports. A branch change and a caller with read access only check. */
  const checkOnly = input.access === "read" || event === "branch-change";
  let syncRan = false;
  let syncSkipped: CheckpointSyncSkip | null = null;
  let newConflicts = 0;
  if (checkOnly) {
    syncSkipped = input.access === "read" ? input.readReason ?? "read-access-only" : "branch-change";
    const preview = previewWorkSync(root, { storeRoot: env.storeRoot, now: env.now });
    result.sync = checkOutcome(preview);
    result.firstSyncWaits = preview.firstImport;
    result.conflicts = result.sync.conflicts;
    for (const file of preview.pending) {
      if (file.recorded) continue;
      if (file.decision === "import") result.waiting.push({ path: file.path, waitsFor: "import" });
      else if (file.decision === "write" && !file.held) result.waiting.push({ path: file.path, waitsFor: "write" });
      else if (file.decision === "remove-copy" && !file.held) result.waiting.push({ path: file.path, waitsFor: "removal" });
      else if (file.decision === "conflict") newConflicts += 1;
      // A held file that differs is never written or removed, so it does not wait.
      else if (file.held && (file.decision === "write" || file.decision === "remove-copy")) result.held.push({ path: file.path, reason: WORK_SYNC_HOLD_REASON });
      else if (file.decision === "report-unreadable") result.unreadable.push({ path: file.path, line: null, message: null });
    }
  } else {
    syncRan = true;
    // A trigger run reuses the write holds of sync: one hold for each work
    // root, after the holds of the project config. So it imports under the one
    // sync table and writes and removes no project file.
    const configHolds = readWorkSyncConfig(root).syncHold.map((folder) => ({ folder, reason: WORK_SYNC_HOLD_REASON }));
    const report = syncWorkFiles(root, {
      storeRoot: env.storeRoot,
      now: env.now,
      ...(trigger ? { holdWrites: [...configHolds, ...WORK_FILE_ROOTS.map((folder) => ({ folder, reason: CHECKPOINT_TRIGGER_HOLD_REASON }))] } : {}),
    });
    result.sync = syncOutcome(report);
    result.firstSync = report.firstImport;
    result.imported = result.sync.imported;
    result.written = report.written;
    result.removed = report.removed;
    result.conflicts = result.sync.conflicts;
    result.unreadable = result.sync.unreadable;
    // A file that the writer refused, with the reason of `work sync`. The next sync tries again and gives the same answer, so it does not wait.
    result.notWritten = result.sync.notWritten;
    // The holds of the project config, as `work sync` reports them. The holds of a trigger run are files that wait.
    result.held = report.held.filter((hold) => hold.reason !== CHECKPOINT_TRIGGER_HOLD_REASON);
    const decisionOf = new Map(report.files.map((file) => [file.path, file.decision]));
    const waitsFor = (path: string) => (decisionOf.get(path) === "remove-copy" ? "removal" as const : "write" as const);
    if (trigger) {
      for (const hold of report.held) {
        if (hold.reason === CHECKPOINT_TRIGGER_HOLD_REASON) result.waiting.push({ path: hold.path, waitsFor: waitsFor(hold.path) });
      }
    }
    // The first sync of a checkout only imports, so its writes and removals wait for the next sync.
    for (const path of report.deferred.write) result.waiting.push({ path, waitsFor: "write" });
    for (const path of report.deferred.remove) result.waiting.push({ path, waitsFor: "removal" });
    // A file that the file system refused stays as it was, and the next sync tries again.
    for (const failure of report.fileErrors) result.waiting.push({ path: failure.path, waitsFor: failure.operation === "remove" ? "removal" : "write" });
  }

  /* Steps 3 and 4: claims that ended or end soon, and the next ready work. Both read only. */
  const projectId = readDeclarativeProjectId(root) ?? "";
  const nowText = env.now.toISOString();
  const soonText = new Date(env.now.getTime() + WORK_CLAIM_POLICY.checkEverySeconds * 1000).toISOString();
  const read = readWorkStore(root, (db) => {
    const units = listWorkUnits(db, projectId);
    const claims = listWorkClaims(db, projectId);
    const conflicts = result.checkout.checkoutId ? listSyncConflicts(db, result.checkout.checkoutId).map((row) => row.conflict) : [];
    return { units, claims, readiness: computeWorkReadiness({ now: env.now, claimant: null, query: { level: "phase", includeQuickItems: true }, units, claims, conflicts }) };
  }, { storeRoot: env.storeRoot });
  const unitById = new Map(read.units.map((unit) => [unit.storeId, unit]));
  for (const claim of read.claims) {
    const unit = unitById.get(claim.unitStoreId);
    if (!unit || claim.expiresAt > soonText) continue;
    const ended = claim.expiresAt <= nowText;
    const label = unit.kind === "quick-item" ? `task ${unit.coordinate}` : unit.coordinate;
    result.claims.push({
      unit: label,
      coordinate: unit.coordinate,
      claimant: claim.claimant,
      expiresAt: claim.expiresAt,
      state: ended ? "ended" : "ends-soon",
      hasTaskHandle: claim.taskHandle !== null,
      revision: unit.revision,
      command: ended
        ? `make-docs work release ${unit.coordinate} --handle ${claim.taskHandle !== null ? "<stopped|finished|not-found>" : "no-handle"} --expected-version ${unit.revision}`
        : `make-docs work claim ${unit.coordinate} --claimant ${claim.claimant} --claim-id <claim ID> --expected-version ${unit.revision}`,
    });
  }
  // A fixed order: the claim that ended first comes first, then the coordinate decides.
  result.claims.sort((left, right) => left.expiresAt.localeCompare(right.expiresAt) || compareWorkCoordinates(left.coordinate, right.coordinate));
  result.readyCount = read.readiness.ready.length;
  result.next = read.readiness.ready.slice(0, CHECKPOINT_NEXT_LIMIT).map((item) => ({
    unit: item.label,
    coordinate: item.coordinate,
    title: item.title,
    sourcePath: item.sourcePath,
    revision: item.revision,
    claimCommand: `make-docs work claim ${item.coordinate} --claimant <name> --expected-version ${item.revision}`,
  }));

  /* Step 5: one summary line, first. */
  const conflictCount = result.conflicts.length + newConflicts;
  const nothingDue = result.imported.length === 0 && result.written.length === 0 && result.removed.length === 0 && result.waiting.length === 0 && conflictCount === 0;
  const lines: string[] = [];
  const heldCount = result.held.length;
  const unreadableCount = result.unreadable.length;
  const notWrittenCount = result.notWritten.length;
  if (nothingDue) {
    // The "match" sentence is true only when no held file differs, the sync wrote every file that it had to write, and every work file can be read.
    const notes = [
      heldCount > 0 ? `${count(heldCount, "held file")} ${heldCount === 1 ? "differs" : "differ"} from the work store, and sync never writes ${heldCount === 1 ? "it" : "them"}.` : null,
      notWrittenCount > 0 ? `${count(notWrittenCount, "file")} ${notWrittenCount === 1 ? "differs" : "differ"} from the work store, and sync cannot write ${notWrittenCount === 1 ? "it" : "them"}.` : null,
      unreadableCount > 0 ? `Make Docs cannot read ${count(unreadableCount, "work file")}.` : null,
    ].filter((note): note is string => note !== null);
    lines.push(`Checkpoint: nothing is due. ${notes.length === 0 ? "The work files and the work store match." : notes.join(" ")}`);
  } else {
    const pieces = [
      result.imported.length > 0 ? `${count(result.imported.length, "file")} imported` : null,
      result.written.length > 0 ? `${count(result.written.length, "file")} written` : null,
      result.removed.length > 0 ? `${count(result.removed.length, "copy", "copies")} removed` : null,
      result.waiting.length > 0 ? `${count(result.waiting.length, "file")} ${result.waiting.length === 1 ? "waits" : "wait"}` : null,
      conflictCount > 0 ? `${count(conflictCount, "conflict")} ${conflictCount === 1 ? "waits" : "wait"} for a person` : null,
      heldCount > 0 ? `${count(heldCount, "held file")} ${heldCount === 1 ? "differs" : "differ"} from the work store` : null,
      notWrittenCount > 0 ? `${count(notWrittenCount, "file")} not written` : null,
      unreadableCount > 0 ? `${count(unreadableCount, "work file")} cannot be read` : null,
    ].filter((piece): piece is string => piece !== null);
    lines.push(`Checkpoint: ${pieces.join(", ")}.`);
  }
  lines.push(
    result.firstSync
      ? `Checkout: ${root}. This run was the first sync of this checkout. A first sync only imports: it imported ${count(result.imported.length, "file")} and wrote and removed no file.`
      : result.firstSyncWaits
        ? `Checkout: ${root}. This checkout has not synced yet, and this run did not sync it.`
        : `Checkout: ${root}.`,
  );
  if (syncSkipped === "read-access-only") {
    lines.push(`The sync waits: ${count(result.waiting.length, "file")} ${result.waiting.length === 1 ? "waits" : "wait"}. This caller has read access only, so a caller with write access must run ${CHECKPOINT_COMMAND}.`);
  } else if (syncSkipped === "dry-run") {
    lines.push(`Dry run: the sync did not run, and nothing changed. ${count(result.waiting.length, "file")} ${result.waiting.length === 1 ? "waits" : "wait"}.`);
  } else if (syncSkipped === "branch-change") {
    lines.push(`The branch changed, so this run imported nothing: ${count(result.waiting.length, "file")} ${result.waiting.length === 1 ? "waits" : "wait"}. Run ${CHECKPOINT_COMMAND} to sync.`);
  } else if (trigger && result.waiting.length > 0) {
    lines.push(`A hook started this run, so it wrote and removed no project file. Run ${CHECKPOINT_COMMAND} to apply what waits.`);
  } else if (result.waiting.length > 0) {
    lines.push(`Run ${CHECKPOINT_COMMAND} again to apply what waits.`);
  }
  for (const path of result.imported) lines.push(`  Imported: ${path}`);
  for (const path of result.written) lines.push(`  Wrote: ${path}`);
  for (const path of result.removed) lines.push(`  Removed: ${path}`);
  for (const file of result.waiting) lines.push(`  Waits for ${file.waitsFor === "import" ? "an import" : file.waitsFor === "write" ? "a write" : "a removal"}: ${file.path}`);
  if (newConflicts > 0) lines.push(`${count(newConflicts, "file")} would stop as a new conflict in the next sync. make-docs work status names each one.`);
  for (const conflict of result.conflicts) {
    lines.push(`Conflict in ${conflict.path} (${conflict.kind}): ${conflict.meaning}`);
    for (const choice of conflict.choices) lines.push(`  ${choice.effect} Run: ${choice.command}`);
  }
  for (const hold of result.held) lines.push(`Held, not written: ${hold.path}. ${hold.reason}`);
  // The words of `work sync` ("N file(s) not written: path (reason)"), with one line for each file.
  for (const entry of result.notWritten) lines.push(`Not written: ${entry.path} (${entry.reason})`);
  for (const entry of result.unreadable) {
    lines.push(entry.line === null
      ? `Cannot read ${entry.path}. The file is untouched. ${syncSkipped === "read-access-only" ? `A direct run of ${CHECKPOINT_COMMAND} by a caller with write access names the line.` : `A direct run of ${CHECKPOINT_COMMAND} names the line.`}`
      : `Cannot read ${entry.path}, line ${entry.line}: ${entry.message} The file is untouched.`);
  }
  for (const claim of result.claims) {
    lines.push(
      claim.state === "ended"
        ? `Claim ended: ${claim.unit}, claimed by ${claim.claimant}, ended at ${claim.expiresAt}. Check the task, then release it: ${claim.command}`
        : `Claim ends soon: ${claim.unit}, claimed by ${claim.claimant}, ends at ${claim.expiresAt}. The holder renews it: ${claim.command}`,
    );
  }
  if (result.readyCount === 0) {
    lines.push("No phase is ready.");
  } else {
    lines.push(`Ready work (${result.readyCount}). Next:`);
    for (const item of result.next) lines.push(`  ${item.unit}: ${item.title}${item.sourcePath ? ` (${item.sourcePath})` : ""}`);
    if (result.readyCount > result.next.length) lines.push(`  ... and ${result.readyCount - result.next.length} more. Run make-docs work next for the full list.`);
    lines.push(`Claim the first one: ${result.next[0]!.claimCommand}`);
  }

  // W35 R0 P5: a git hook prints the summary line and the command, and no other line. The fields above keep each detail.
  if (event !== null && CHECKPOINT_GIT_HOOK_EVENTS.includes(event) && !nothingDue) {
    const summaryLine = lines[0]!;
    const attention = result.waiting.length + conflictCount + heldCount + notWrittenCount + unreadableCount > 0;
    lines.length = 0;
    if (syncSkipped === "read-access-only") {
      lines.push(`${summaryLine} This caller has read access only, so a caller with write access must run ${CHECKPOINT_COMMAND}.`);
    } else {
      lines.push(summaryLine);
      if (attention) lines.push(CHECKPOINT_SHORT_COMMAND_LINE);
    }
  }

  return {
    ...result,
    authority: "store",
    storeState: authority.storeState,
    reason: authority.reason,
    nextAction: authority.nextAction,
    syncRan,
    syncSkipped,
    nothingDue,
    quiet: trigger && nothingDue,
    lines,
    summary: lines.join("\n"),
  };
}
