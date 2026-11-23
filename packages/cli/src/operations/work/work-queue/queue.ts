import { existsSync, lstatSync, mkdirSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";

import { classifyStoreCheckpoint9State } from "../../../store/database.js";
import {
  canonicalInstallationPath,
  getExistingInstallationCheckoutId,
  readDeclarativeProjectId,
} from "../../../store/installation-state.js";
import {
  WorkStoreRefusalError,
  checkWorkUnitWriteClaim,
  claimWorkUnit,
  createQuickItem,
  findWorkUnitByCoordinate,
  listSyncConflicts,
  listWorkClaims,
  listWorkUnits,
  putWorkUnit,
  readWorkClaim,
  readWorkStore,
  readWorkUnit,
  readWorkUnitNote,
  releaseExpiredWorkClaim,
  releaseWorkClaim,
  resolveWorkProject,
  setWorkUnitNote,
  workUnitNoteProblem,
  writeWorkStore,
  type WorkUnitInput,
  type WorkUnitNote,
} from "../../../store/work-store.js";
import { OperationError } from "../../types.js";
import { WORK_CLAIM_POLICY, WORK_LOCAL_TRACKER_CONNECTION } from "../work-store/catalog.js";
import { type WorkConflictReport } from "../work-store/conflict-report.js";
import {
  WORK_CLAIM_TTL_BOUNDS,
  type WorkAuthorityMode,
  type WorkClaimRefusal,
  type WorkCloseOutcome,
  type WorkHandleObservation,
  type WorkLink,
  type WorkStoreState,
  type WorkUnitKind,
  type WorkUnitRecord,
  type WorkUpdateRefusal,
} from "../work-store/schemas.js";
import {
  previewWorkSync,
  readWorkSyncConfig,
  syncWorkFiles,
  workStoreOnlyEdits,
  type WorkProjection,
  type WorkSettleInput,
  type WorkSettleOutcome,
  type WorkStoreOnlyEdit,
  type WorkSyncPreview,
  type WorkSyncReport,
} from "../work-store/sync.js";
import { WORK_FILE_ROOTS, parseWorkFile, renderWorkFile } from "../work-store/work-file.js";
import {
  WorkReadiness,
  computeWorkReadiness,
  visibleWorkClaim,
  workUnitLabel,
  type WorkFallbackDone,
  type WorkQueueItem,
  type WorkVisibleClaim,
  type WorkWaitReasonEntry,
} from "./readiness.js";

/**
 * W29 R0 P4 work queue service (PRD 52 R-WORK-STORE-1 to R-WORK-STORE-3,
 * R-WORK-SYNC-8, R-WORK-QUEUE-3 to R-WORK-QUEUE-18). The `work` operations call
 * these functions; the CLI and MCP add presentation only.
 *
 * Every work operation syncs first (R-WORK-SYNC-8, T2). A write operation runs
 * a real sync before its own change. A read-only operation (`work status` and
 * `work next`) runs a read-only sync check, which changes nothing and names
 * what the next sync would do, because a read-only operation never writes.
 * Each result carries its sync outcome.
 */

export const READ_ONLY_TAIL = "Changes nothing.";

function count(value: number, word: string): string {
  return `${value} ${word}${value === 1 ? "" : "s"}`;
}

export interface WorkQueueEnv {
  storeRoot: string;
  now: Date;
}

/* ------------------------------------------------------------------------ */
/* Sync outcome                                                             */
/* ------------------------------------------------------------------------ */

export interface WorkSyncConflictLine {
  path: string;
  kind: WorkConflictReport["kind"];
  meaning: string;
  reasons: string[];
  affectedUnits: string[];
  choices: Array<{ choice: string; effect: string; command: string }>;
}

/** The sync part of every work result: compact, human words first. */
export interface WorkSyncOutcome {
  /** `sync` for a real sync, `check` for the read-only check of a read operation. */
  ran: "sync" | "check";
  summary: string;
  firstImport: boolean;
  imported: string[];
  written: string[];
  removed: string[];
  deleted: string[];
  conflicts: WorkSyncConflictLine[];
  unreadable: Array<{ path: string; line: number; message: string }>;
  held: Array<{ path: string; reason: string }>;
  notWritten: Array<{ path: string; reason: string }>;
  fileErrors: Array<{ path: string; operation: string; code: string }>;
  settled: WorkSettleOutcome | null;
  /** For a check: each file that the next sync changes or that waits for a person. */
  pending: Array<{ path: string; decision: string; conflictKind: string | null; held: boolean }>;
}

function conflictLine(report: WorkConflictReport): WorkSyncConflictLine {
  return {
    path: report.path,
    kind: report.kind,
    meaning: report.meaning,
    reasons: report.reasons,
    affectedUnits: report.affectedUnits,
    // The report's own choices: a `claimed` conflict names a release for each claimed unit (re-check finding 4).
    choices: report.choices.map((choice) => ({ choice: choice.choice, effect: choice.effect, command: choice.command })),
  };
}

export function syncOutcome(report: WorkSyncReport): WorkSyncOutcome {
  return {
    ran: "sync",
    summary: report.summary,
    firstImport: report.firstImport,
    imported: report.files.filter((file) => file.action === "imported").map((file) => file.path),
    written: report.written,
    removed: report.removed,
    deleted: report.deleted.map((entry) => entry.coordinate),
    conflicts: report.conflicts.map(conflictLine),
    unreadable: report.unreadable.map((entry) => ({ path: entry.path, line: entry.line, message: entry.message })),
    held: report.held,
    notWritten: report.notWritten.map((entry) => ({ path: entry.path, reason: entry.reason })),
    fileErrors: report.fileErrors.map((entry) => ({ path: entry.path, operation: entry.operation, code: entry.code })),
    settled: report.settled,
    pending: [],
  };
}

export function checkOutcome(preview: WorkSyncPreview): WorkSyncOutcome {
  return {
    ran: "check",
    summary: preview.summary,
    firstImport: preview.firstImport,
    imported: [],
    written: [],
    removed: [],
    deleted: [],
    conflicts: preview.conflicts.map(conflictLine),
    unreadable: [],
    held: [],
    notWritten: [],
    fileErrors: [],
    settled: null,
    pending: preview.pending.map((file) => ({ path: file.path, decision: file.decision, conflictKind: file.conflictKind, held: file.held })),
  };
}

/* ------------------------------------------------------------------------ */
/* Units by reference                                                       */
/* ------------------------------------------------------------------------ */

/**
 * Read a unit reference: a coordinate in any letter case (`w29 r0 p4 t3`), a
 * quick item number (`7` or `task 7`), or a store ID (`wu-...`).
 */
export function normalizeWorkUnitReference(reference: string): { kind: "coordinate" | "quick" | "store-id"; value: string } {
  const text = reference.trim().replace(/\s+/g, " ");
  if (/^wu-[a-z0-9]+$/.test(text)) return { kind: "store-id", value: text };
  const quick = /^(?:task )?([1-9]\d*)$/i.exec(text);
  if (quick) return { kind: "quick", value: quick[1]! };
  return { kind: "coordinate", value: text.split(" ").map((part) => part.toUpperCase()).join(" ") };
}

export class WorkUnitNotFoundError extends OperationError {
  readonly code = "work-unit-not-found";
  readonly nextAction = "Run make-docs work next to see the units of this project, or make-docs work sync if the file changed.";
  constructor(readonly reference: string) {
    super(`No work unit matches "${reference}" in this project, so this command changed no unit. Run make-docs work next to see the units of this project, or make-docs work sync if the file changed.`);
    this.name = "WorkUnitNotFoundError";
  }
}

function findUnit(db: Parameters<typeof readWorkUnit>[0], projectId: string, reference: string): WorkUnitRecord {
  const ref = normalizeWorkUnitReference(reference);
  const found = ref.kind === "store-id"
    ? readWorkUnit(db, ref.value)
    : findWorkUnitByCoordinate(db, projectId, ref.value);
  if (!found || found.projectId !== projectId) throw new WorkUnitNotFoundError(reference);
  if (ref.kind === "quick" && found.kind !== "quick-item") throw new WorkUnitNotFoundError(reference);
  return found;
}

function projectIdOf(root: string): string {
  const projectId = readDeclarativeProjectId(root);
  if (!projectId) {
    throw new WorkStoreRefusalError("project-not-identified", "The project has no projectId in .make-docs/config.yaml.", "Run make-docs setup in this project first.");
  }
  return projectId;
}

/** Units, claims, and this checkout's conflicts, for readiness. */
function queueState(db: Parameters<typeof readWorkUnit>[0], projectId: string, checkoutId: string | null) {
  return {
    units: listWorkUnits(db, projectId),
    claims: listWorkClaims(db, projectId),
    conflicts: checkoutId ? listSyncConflicts(db, checkoutId).map((row) => row.conflict) : [],
  };
}

/* ------------------------------------------------------------------------ */
/* Authority (R-WORK-STORE-1 to R-WORK-STORE-3)                             */
/* ------------------------------------------------------------------------ */

export interface WorkAuthority {
  mode: WorkAuthorityMode;
  storeState: WorkStoreState;
  /** Human words: which source is in charge and why. */
  reason: string;
  nextAction: string | null;
  detail: Record<string, string | number | boolean | null>;
}

const FILES_NEXT = "Read and edit the docs/work/ files directly. They are the authority until the Store is usable.";

/**
 * The authority mode and its reason. `denied` comes from the harness policy,
 * which the caller checks first, so it is passed in.
 */
export function workAuthority(root: string, storeRoot: string, denied: { reason: string; nextAction: string } | null): WorkAuthority {
  if (denied) {
    return {
      mode: "files",
      storeState: "denied",
      reason: `The docs/work/ files are the authority, because this caller may not use the Store: ${denied.reason}`,
      nextAction: denied.nextAction,
      detail: { storeRoot },
    };
  }
  const classification = classifyStoreCheckpoint9State(storeRoot);
  if (classification.state === "absent") {
    return {
      mode: "files",
      storeState: "not-configured",
      reason: "The docs/work/ files are the authority, because this computer has no Make Docs Store.",
      nextAction: `Run make-docs setup to create the Store. ${FILES_NEXT}`,
      detail: { storeRoot, databasePath: classification.databasePath },
    };
  }
  if (classification.state === "supported-legacy") {
    return {
      mode: "files",
      storeState: "unavailable",
      reason: `The docs/work/ files are the authority, because the Store uses schema ${classification.schemaVersion}, which has no work store.`,
      nextAction: `Run make-docs setup to update the Store. ${FILES_NEXT}`,
      detail: { storeRoot, schemaVersion: classification.schemaVersion },
    };
  }
  if (classification.state !== "supported-current") {
    return {
      mode: "files",
      storeState: "unsafe",
      reason: `The docs/work/ files are the authority, because the Store is not safe to use (${classification.state}): ${classification.reason}`,
      nextAction: `Run make-docs project state status and review the Store. ${FILES_NEXT}`,
      detail: { storeRoot, classification: classification.state },
    };
  }
  const checkoutId = getExistingInstallationCheckoutId(root, storeRoot);
  if (!checkoutId) {
    return {
      mode: "files",
      storeState: "unavailable",
      reason: "The docs/work/ files are the authority, because this checkout is not bound to the Store.",
      nextAction: `Run make-docs setup in this checkout. ${FILES_NEXT}`,
      detail: { storeRoot, schemaVersion: classification.schemaVersion },
    };
  }
  return {
    mode: "store",
    storeState: "usable",
    reason: "The work store is the authority, because this checkout is bound to a usable Store. The docs/work/ files are its repo copy.",
    nextAction: null,
    detail: { storeRoot, schemaVersion: classification.schemaVersion, checkoutId },
  };
}

/* ------------------------------------------------------------------------ */
/* status                                                                   */
/* ------------------------------------------------------------------------ */

export interface WorkStatusResult {
  operation: "work.queue.status";
  mode: WorkAuthorityMode;
  storeState: WorkStoreState;
  reason: string;
  nextAction: string | null;
  detail: WorkAuthority["detail"];
  projection: WorkProjection;
  syncHold: string[];
  tracker: { connection: string; operations: readonly string[] };
  counts: { units: number; open: number; ready: number; waiting: number; quickItems: number; claims: number } | null;
  sync: WorkSyncOutcome | null;
  lines: string[];
  summary: string;
}

export function workStatus(root: string, env: WorkQueueEnv, authority: WorkAuthority): WorkStatusResult {
  const config = readWorkSyncConfig(root);
  const lines: string[] = [authority.reason];
  let counts: WorkStatusResult["counts"] = null;
  let sync: WorkSyncOutcome | null = null;
  if (authority.mode === "store") {
    sync = checkOutcome(previewWorkSync(root, { storeRoot: env.storeRoot, now: env.now }));
    const projectId = readDeclarativeProjectId(root) ?? "";
    const checkoutId = getExistingInstallationCheckoutId(root, env.storeRoot);
    counts = readWorkStore(root, (db) => {
      const state = queueState(db, projectId, checkoutId);
      const readiness = new WorkReadiness({ now: env.now, claimant: null, ...state });
      const open = state.units.filter((unit) => !readiness.isClosed(unit) && !readiness.isArchived(unit));
      const ready = open.filter((unit) => readiness.isReady(unit, null)).length;
      return {
        units: state.units.length,
        open: open.length,
        ready,
        waiting: open.length - ready,
        quickItems: state.units.filter((unit) => unit.kind === "quick-item").length,
        claims: state.claims.filter((claim) => claim.expiresAt > env.now.toISOString()).length,
      };
    }, { storeRoot: env.storeRoot });
    lines.push(
      config.projection === "on"
        ? "Repo copies are on: sync keeps the docs/work/ files and the store the same."
        : "Repo copies are off: the store is the only record of this work in this checkout. Run make-docs work export to write the files.",
    );
    lines.push(`${count(counts.open, "open unit")}: ${counts.ready} ready, ${counts.waiting} waiting. ${count(counts.quickItems, "quick item")}. ${count(counts.claims, "live claim")}.`);
    lines.push(sync.summary);
    for (const conflict of sync.conflicts) {
      lines.push(`Conflict in ${conflict.path} (${conflict.kind}): ${conflict.meaning}`);
      for (const choice of conflict.choices) lines.push(`  ${choice.effect} Run: ${choice.command}`);
    }
  } else if (authority.nextAction) {
    lines.push(`Next: ${authority.nextAction}`);
  }
  if (config.syncHold.length > 0) lines.push(`Sync never writes these held paths: ${config.syncHold.join(", ")}.`);
  lines.push(READ_ONLY_TAIL);
  return {
    operation: "work.queue.status",
    mode: authority.mode,
    storeState: authority.storeState,
    reason: authority.reason,
    nextAction: authority.nextAction,
    detail: authority.detail,
    projection: config.projection,
    syncHold: config.syncHold,
    tracker: { connection: WORK_LOCAL_TRACKER_CONNECTION.id, operations: WORK_LOCAL_TRACKER_CONNECTION.operations },
    counts,
    sync,
    lines,
    summary: lines.join("\n"),
  };
}

/* ------------------------------------------------------------------------ */
/* sync                                                                     */
/* ------------------------------------------------------------------------ */

export interface WorkSyncResult {
  operation: "work.queue.sync";
  sync: WorkSyncOutcome;
  lines: string[];
  summary: string;
}

/** Run sync, or settle one conflict and then sync (T15). Unusable Store states throw their typed outcome. */
export function workSync(root: string, env: WorkQueueEnv, settle: WorkSettleInput | null): WorkSyncResult {
  const report = syncWorkFiles(root, { storeRoot: env.storeRoot, now: env.now, ...(settle ? { settle } : {}) });
  const sync = syncOutcome(report);
  const lines = [
    ...(report.settled ? [`Settled ${report.settled.path} (${report.settled.kind}) with --${report.settled.choice}: ${report.settled.effect}`] : []),
    report.summary,
  ];
  return { operation: "work.queue.sync", sync, lines, summary: lines.join("\n") };
}

/** Sync first, for a write operation (R-WORK-SYNC-8). */
function syncFirst(root: string, env: WorkQueueEnv): WorkSyncOutcome {
  return syncOutcome(syncWorkFiles(root, { storeRoot: env.storeRoot, now: env.now }));
}

/* ------------------------------------------------------------------------ */
/* next                                                                     */
/* ------------------------------------------------------------------------ */

export interface WorkNextResult {
  operation: "work.queue.next";
  level: WorkUnitKind;
  claimant: string | null;
  ready: WorkQueueItem[];
  waiting: WorkQueueItem[];
  /** Phases with no status line that count as done because every task is checked (finding 7). */
  doneByFallback: WorkFallbackDone[];
  sync: WorkSyncOutcome;
  lines: string[];
  summary: string;
}

export function workNext(
  root: string,
  env: WorkQueueEnv,
  query: { level: WorkUnitKind; includeQuickItems: boolean; claimant: string | null; limit: number | null },
): WorkNextResult {
  const sync = checkOutcome(previewWorkSync(root, { storeRoot: env.storeRoot, now: env.now }));
  const projectId = projectIdOf(root);
  const checkoutId = getExistingInstallationCheckoutId(root, env.storeRoot);
  const result = readWorkStore(root, (db) => computeWorkReadiness({
    now: env.now,
    claimant: query.claimant,
    query: { level: query.level, includeQuickItems: query.includeQuickItems },
    ...queueState(db, projectId, checkoutId),
  }), { storeRoot: env.storeRoot });
  const ready = query.limit === null ? result.ready : result.ready.slice(0, query.limit);
  const lines: string[] = [];
  lines.push(
    result.ready.length === 0
      ? `No ${query.level} is ready.`
      : `Ready ${query.level === "quick-item" ? "quick items" : `${query.level}s`} (${result.ready.length}), in order. Read each unit's revision with --json, for --expected-version:`,
  );
  for (const item of ready) lines.push(`  ${item.label}: ${item.title}${item.sourcePath ? ` (${item.sourcePath})` : ""}`);
  if (ready.length < result.ready.length) lines.push(`  ... and ${result.ready.length - ready.length} more. Use --json for the full list.`);
  if (result.doneByFallback.length > 0) {
    const shown = result.doneByFallback.slice(0, 5).map((entry) => entry.coordinate).join(", ");
    const more = result.doneByFallback.length > 5 ? `, and ${result.doneByFallback.length - 5} more (--json lists them)` : "";
    lines.push(`${count(result.doneByFallback.length, "phase")} with no status line ${result.doneByFallback.length === 1 ? "counts" : "count"} as done, because every task is checked (doneBy: all-tasks-checked): ${shown}${more}. A status line in the file decides instead.`);
  }
  if (result.waiting.length > 0) {
    lines.push(`Waiting (${result.waiting.length}):`);
    for (const item of result.waiting) {
      lines.push(`  ${item.label}: ${item.title}`);
      for (const reason of item.reasons) lines.push(`    - ${reason.text} Next: ${reason.nextAction}`);
    }
  }
  lines.push(sync.summary);
  lines.push(READ_ONLY_TAIL);
  return {
    operation: "work.queue.next",
    level: query.level,
    claimant: query.claimant,
    ready,
    waiting: result.waiting,
    doneByFallback: result.doneByFallback,
    sync,
    lines,
    summary: lines.join("\n"),
  };
}

/* ------------------------------------------------------------------------ */
/* claim                                                                    */
/* ------------------------------------------------------------------------ */

export interface WorkClaimInput {
  unit: string;
  claimant: string;
  taskHandle: string | null;
  ttlSeconds: number | null;
  expectedVersion: number;
  /** Your claim ID, to renew your live claim (T13). A new claim needs none. */
  claimId?: string | null;
  /**
   * A takeover of an expired claim names the previous claimant, which every
   * caller can see, and what the handle check saw. The claim ID stays private
   * to its holder (owner decision 2026-11-23, W29 R0 P4 T13).
   */
  takeover: { previousClaimant: string; handleObservation: WorkHandleObservation } | null;
}

export interface WorkClaimResultValue {
  operation: "work.queue.claim";
  unit: string;
  result: "claimed" | "renewed" | "refused";
  refusal: WorkClaimRefusal | null;
  /**
   * The claim ID, only in the result of a new claim (`claimed`). A claim ID
   * works like a private key (T13): a renewal, a refusal, `work next`, and
   * `work status` never show it.
   */
  claimId: string | null;
  /** The claim as any caller may see it, without its ID. */
  claim: WorkVisibleClaim | null;
  /** Why the unit is not ready, for a `not-ready` refusal. */
  reasons: WorkWaitReasonEntry[];
  /** The unit revision after the claim, for `--expected-version` of report, close, and release. */
  revision: number | null;
  sync: WorkSyncOutcome;
  lines: string[];
  summary: string;
}

const CLAIM_REFUSAL_TEXT: Record<WorkClaimRefusal, string> = {
  "unit-not-found": "The unit does not exist.",
  "unit-closed": "The unit is closed.",
  "not-ready": "The unit is not ready.",
  "already-claimed": "The unit has a live claim. Its holder renews it with --claim-id; nobody else can claim it now.",
  "takeover-needs-handle-check": "The claim on the unit ran out. Check the old task handle, then take it over with --takeover-from and --handle.",
  "previous-holder-still-working": "The old task still runs, so the takeover waits.",
  "ancestor-claimed": "Another claimant holds a unit that contains this one.",
  "descendant-claimed": "Another claimant holds a unit inside this one.",
  "no-handle-to-check": "The expired claim has no task handle to check, so a person releases it with make-docs work release.",
  "version-conflict": "The unit or its claim changed since you read it. Read it again and use its current version.",
};

/** Reasons a claim may pass on to the Store service, which gives its own refusal for them. */
const CLAIM_SERVICE_REASONS = new Set(["claimed", "claim-expired", "ancestor-claimed"]);

function assertClaimTtl(ttl: number | null): void {
  if (ttl !== null && (ttl < WORK_CLAIM_TTL_BOUNDS.minSeconds || ttl > WORK_CLAIM_TTL_BOUNDS.maxSeconds)) {
    throw new OperationError(`A claim lasts between ${WORK_CLAIM_TTL_BOUNDS.minSeconds / 60} minutes and ${WORK_CLAIM_TTL_BOUNDS.maxSeconds / 3600} hours. Nothing changed.`);
  }
}

export function workClaim(root: string, env: WorkQueueEnv, input: WorkClaimInput): WorkClaimResultValue {
  // Inputs are checked before the sync, so a refused input changes nothing.
  assertClaimTtl(input.ttlSeconds);
  const sync = syncFirst(root, env);
  const checkoutId = getExistingInstallationCheckoutId(root, env.storeRoot);
  return writeWorkStore(root, (db, project) => {
    const unit = findUnit(db, project.projectId, input.unit);
    const state = queueState(db, project.projectId, checkoutId);
    const readiness = new WorkReadiness({ now: env.now, claimant: input.claimant, ...state });
    const reasons = readiness.reasonsFor(unit, input.claimant);
    const blocking = reasons.filter((reason) => !CLAIM_SERVICE_REASONS.has(reason.reason));
    const label = workUnitLabel(unit);
    const finish = (
      result: WorkClaimResultValue["result"],
      refusal: WorkClaimRefusal | null,
      claim: WorkVisibleClaim | null,
      why: WorkWaitReasonEntry[],
      claimId: string | null = null,
    ): WorkClaimResultValue => {
      const revision = readWorkUnit(db, unit.storeId)?.revision ?? null;
      const lines: string[] = [];
      if (result === "refused") {
        lines.push(`Not claimed: ${label}. ${CLAIM_REFUSAL_TEXT[refusal!]}`, ...why.map((reason) => `  - ${reason.text} Next: ${reason.nextAction}`));
        if (claim) lines.push(`  Claimant: ${claim.claimant}. Ends: ${claim.expiresAt}.`);
        lines.push("This claim changed no unit.");
      } else if (result === "claimed") {
        lines.push(
          `Claimed ${label} for ${input.claimant} until ${claim!.expiresAt}.`,
          `Claim ID: ${claimId}. Unit revision: ${revision}.`,
          "Keep the claim ID private, like a key: Make Docs shows it only now. Report, close, release, and renew need it.",
          `Renew at least every ${WORK_CLAIM_POLICY.checkEverySeconds / 60} minutes: make-docs work claim ${unit.coordinate} --claimant ${input.claimant} --claim-id <claim ID> --expected-version ${revision}`,
        );
      } else {
        lines.push(`Renewed your claim on ${label} until ${claim!.expiresAt}. Unit revision: ${revision}.`);
      }
      lines.push(sync.summary);
      return { operation: "work.queue.claim", unit: unit.coordinate, result, refusal, claimId, claim, reasons: why, revision, sync, lines, summary: lines.join("\n") };
    };
    if (unit.status === "closed") return finish("refused", "unit-closed", null, []);
    if (readiness.doneBy(unit)) {
      const refused = finish("refused", "unit-closed", null, []);
      // Re-check finding 6: a phase done by the fallback is not closed in the store; it counts as done.
      refused.lines[0] = `Not claimed: ${label}. The unit counts as done.`;
      refused.lines.splice(1, 0, "  It has no status line, and every task is checked, so it counts as done (doneBy: all-tasks-checked). A status line in its file decides instead.");
      refused.summary = refused.lines.join("\n");
      return refused;
    }
    // R-WORK-QUEUE-17: a unit that is not ready cannot be claimed. A takeover may wait only on its expired claim.
    if (blocking.length > 0) return finish("refused", "not-ready", null, blocking);
    let previousClaimId: string | null = null;
    if (input.takeover) {
      const existing = readWorkClaim(db, unit.storeId);
      if (!existing || existing.claimant !== input.takeover.previousClaimant) {
        return finish("refused", "version-conflict", existing ? visibleWorkClaim(existing, input.claimant, env.now) : null, []);
      }
      previousClaimId = existing.claimId;
    }
    const outcome = claimWorkUnit(db, {
      unitStoreId: unit.storeId,
      claimant: input.claimant,
      claimId: input.claimId ?? null,
      taskHandle: input.taskHandle,
      ttlSeconds: input.ttlSeconds,
      expectedVersion: input.expectedVersion,
      takeover: input.takeover && previousClaimId ? { previousClaimId, handleObservation: input.takeover.handleObservation } : null,
    }, { now: env.now });
    // T13: the Store service returns the other claimant's claim on a refusal. No caller sees its ID here.
    const visible = outcome.claim ? visibleWorkClaim(outcome.claim, input.claimant, env.now) : null;
    if (outcome.result === "refused") return finish("refused", outcome.refusal, visible, []);
    if (outcome.result === "renewed") return finish("renewed", null, visible, []);
    return finish("claimed", null, visible, [], outcome.claim.claimId);
  }, { storeRoot: env.storeRoot, now: env.now });
}

/* ------------------------------------------------------------------------ */
/* release                                                                  */
/* ------------------------------------------------------------------------ */

export interface WorkUpdateResultValue {
  operation: "work.queue.release" | "work.queue.report" | "work.queue.close";
  unit: string;
  accepted: boolean;
  refusal: WorkUpdateRefusal | null;
  revision: number | null;
  /** Whether the unit is ready after the change, for the caller. */
  readyAfter: boolean;
  /** Store edits of this unit's file that the file copy does not show (T16). */
  storeOnlyEdits: WorkStoreOnlyEdit[];
  /** The unit's latest progress note and its time (register D-066). */
  note: WorkUnitNote | null;
  sync: WorkSyncOutcome;
  lines: string[];
  summary: string;
}

/** What the claim on a unit is now, for refusal words that never name a claim ID. */
type ClaimState = "none" | "live" | "expired";

function claimStateOf(db: Parameters<typeof readWorkUnit>[0], storeId: string, now: Date): ClaimState {
  const claim = readWorkClaim(db, storeId);
  if (!claim) return "none";
  return claim.expiresAt > now.toISOString() ? "live" : "expired";
}

function updateRefusalText(refusal: WorkUpdateRefusal, state: ClaimState, operation: WorkUpdateResultValue["operation"]): string {
  switch (refusal) {
    case "not-claim-holder":
      if (state === "none") {
        return operation === "work.queue.release" ? "The unit has no claim to release." : "The unit has no claim, and this request names one. Send it without --claim-id.";
      }
      if (state === "expired") return operation === "work.queue.release" ? "The claim ran out, and this claim ID is not its ID. Release it without --claim-id." : "This claim ID does not hold the unit.";
      return "A live claim holds the unit, and this request does not name its claim ID. Only the holder changes or releases a claimed unit.";
    case "claim-expired":
      return "Your claim ran out, and a plain claim cannot renew it. Take the unit over with make-docs work claim --takeover-from <your claimant> --handle <seen>, or release it with make-docs work release --handle <seen>, then retry.";
    case "version-conflict":
      return "The unit changed since you read it. Read it again and use its current version.";
    case "unit-closed":
      return "The unit is closed.";
    case "handle-check-needed":
      return "The unit's claim ran out. Check the old task handle first, then send what you saw with --handle: stopped, finished, or not-found, or no-handle when the claim has no task handle.";
    case "previous-holder-still-working":
      return "The old task still runs, so its expired claim stays. Wait for it to stop or finish.";
  }
}

function updateResult(
  db: Parameters<typeof readWorkUnit>[0],
  env: WorkQueueEnv,
  checkoutId: string | null,
  operation: WorkUpdateResultValue["operation"],
  unit: WorkUnitRecord,
  outcome: { accepted: boolean; refusal: WorkUpdateRefusal | null },
  sync: WorkSyncOutcome,
  done: string,
  claimBefore: ClaimState,
): WorkUpdateResultValue {
  const fresh = readWorkUnit(db, unit.storeId) ?? unit;
  const state = queueState(db, fresh.projectId, checkoutId);
  const readiness = new WorkReadiness({ now: env.now, claimant: null, ...state });
  const readyAfter = readiness.isReady(fresh, null);
  const edits = fileStoreOnlyEdits(db, fresh);
  const label = workUnitLabel(fresh);
  const note = readWorkUnitNote(db, fresh.storeId);
  const lines = outcome.accepted
    ? [done, `Unit revision: ${fresh.revision}.`, ...(operation === "work.queue.report" && note ? [`Latest note (${note.noteAt}): ${note.note}`] : []), ...(edits.length > 0 ? ["Store-only edits (the file copy does not show them):", ...edits.map((edit) => `  - ${edit.text}`)] : [])]
    : [`Not changed: ${label}. ${updateRefusalText(outcome.refusal!, claimBefore, operation)}`];
  lines.push(sync.summary);
  return {
    operation,
    unit: fresh.coordinate,
    accepted: outcome.accepted,
    refusal: outcome.refusal,
    revision: fresh.revision,
    readyAfter,
    storeOnlyEdits: edits,
    note,
    sync,
    lines,
    summary: lines.join("\n"),
  };
}

/** The store-only edits of the file that holds a unit (T16). */
function fileStoreOnlyEdits(db: Parameters<typeof readWorkUnit>[0], unit: WorkUnitRecord): WorkStoreOnlyEdit[] {
  if (!unit.sourcePath) return [];
  const units = listWorkUnits(db, unit.projectId).filter((candidate) => candidate.sourcePath === unit.sourcePath && candidate.kind !== "wave");
  const fileUnit = units.find((candidate) => (candidate.kind === "revision" || candidate.kind === "phase") && candidate.body !== null && candidate.sourcePath === unit.sourcePath);
  return workStoreOnlyEdits(units, fileUnit?.body ?? null, unit.sourcePath);
}

export function workRelease(
  root: string,
  env: WorkQueueEnv,
  input: { unit: string; claimId: string | null; expectedVersion: number; handleObservation?: WorkHandleObservation | null },
): WorkUpdateResultValue {
  const sync = syncFirst(root, env);
  const checkoutId = getExistingInstallationCheckoutId(root, env.storeRoot);
  return writeWorkStore(root, (db, project) => {
    const unit = findUnit(db, project.projectId, input.unit);
    const label = workUnitLabel(unit);
    const before = claimStateOf(db, unit.storeId, env.now);
    if (input.claimId === null) {
      const outcome = releaseExpiredWorkClaim(db, { unitStoreId: unit.storeId, expectedVersion: input.expectedVersion, handleObservation: input.handleObservation ?? null }, { now: env.now });
      return updateResult(db, env, checkoutId, "work.queue.release", unit, outcome, sync, `Released the expired claim of ${outcome.releasedClaimant ?? "a claimant"} on ${label}. The unit is open again.`, before);
    }
    const outcome = releaseWorkClaim(db, { unitStoreId: unit.storeId, claimId: input.claimId, expectedVersion: input.expectedVersion });
    return updateResult(db, env, checkoutId, "work.queue.release", unit, outcome, sync, `Released your claim on ${label}. The unit is open again.`, before);
  }, { storeRoot: env.storeRoot, now: env.now });
}

/* ------------------------------------------------------------------------ */
/* report                                                                   */
/* ------------------------------------------------------------------------ */

export interface WorkReportInput {
  unit: string;
  claimId: string | null;
  status: "open" | "in-progress" | "blocked" | null;
  evidencePath: string | null;
  clearBlockers: boolean;
  metGates: string[];
  /** The latest progress note: one line of plain text, at most 256 characters (register D-066). */
  note?: string | null;
  expectedVersion: number;
}

export function workReport(root: string, env: WorkQueueEnv, input: WorkReportInput): WorkUpdateResultValue {
  // Inputs are checked before the sync, so a refused input changes nothing.
  const note = input.note ?? null;
  if (input.status === null && input.evidencePath === null && !input.clearBlockers && input.metGates.length === 0 && note === null) {
    throw new OperationError("A report changes the status, adds a note, links evidence, clears blockers, or records a met gate. Nothing changed.");
  }
  if (note !== null) {
    const problem = workUnitNoteProblem(note);
    if (problem) throw new OperationError(`${problem} Nothing changed.`);
  }
  if (input.evidencePath !== null) assertEvidencePath(root, input.evidencePath);
  if (input.metGates.length > 0) assertGatesKnown(root, env, input.unit, input.metGates);
  const sync = syncFirst(root, env);
  const checkoutId = getExistingInstallationCheckoutId(root, env.storeRoot);
  return writeWorkStore(root, (db, project) => {
    const unit = findUnit(db, project.projectId, input.unit);
    const before = claimStateOf(db, unit.storeId, env.now);
    const refuse = (refusal: WorkUpdateRefusal) =>
      updateResult(db, env, checkoutId, "work.queue.report", unit, { accepted: false, refusal }, sync, "", before);
    if (unit.status === "closed") return refuse("unit-closed");
    if (unit.revision !== input.expectedVersion) return refuse("version-conflict");
    const claimRefusal = checkWorkUnitWriteClaim(db, unit.storeId, input.claimId, env.now);
    if (claimRefusal) return refuse(claimRefusal);
    const unknownGates = input.metGates.filter((text) => !unit.gates.some((gate) => gate.sourceText === text));
    if (unknownGates.length > 0) {
      // The gate was there before the sync; the sync changed it. The report changed nothing.
      throw new OperationError(`${workUnitLabel(unit)} no longer has a gate with this text after the sync: ${unknownGates.map((text) => `"${text}"`).join(", ")}. This report changed nothing. Run make-docs work next to see its gates.`);
    }
    const changes: string[] = [];
    let status = input.status ?? unit.status;
    let blockers = unit.blockers;
    if (input.clearBlockers && unit.blockers.length > 0) {
      blockers = [];
      changes.push(`cleared ${count(unit.blockers.length, "blocker")}`);
    }
    // R-WORK-QUEUE-8: clearing the last blocker of a blocked unit reopens it.
    if (input.clearBlockers && input.status === null && unit.status === "blocked") status = "open";
    if (status !== unit.status) changes.push(`status ${unit.status} to ${status}`);
    const gates = unit.gates.map((gate) => (input.metGates.includes(gate.sourceText) && !gate.met ? { ...gate, met: true } : gate));
    const metNow = gates.filter((gate, index) => gate.met && !unit.gates[index]!.met).length;
    if (metNow > 0) changes.push(`recorded ${count(metNow, "gate")} as met`);
    let links: WorkLink[] = unit.links;
    if (input.evidencePath !== null && !unit.links.some((link) => link.kind === "evidence" && link.path === input.evidencePath)) {
      links = [...unit.links, { direction: "outbound", kind: "evidence", path: input.evidencePath, anchor: null }];
      changes.push(`linked evidence ${input.evidencePath}`);
    }
    const label = workUnitLabel(unit);
    let revision = unit.revision;
    if (changes.length > 0) {
      const next: WorkUnitInput = { ...unitInput(unit), status, blockers, gates, links };
      revision = putWorkUnit(db, next, { expectedVersion: unit.revision, claimId: input.claimId, now: env.now }).revision;
    }
    if (note !== null) {
      setWorkUnitNote(db, unit.storeId, note, { expectedVersion: revision, now: env.now });
      changes.push("recorded a note");
    }
    if (changes.length === 0) {
      return updateResult(db, env, checkoutId, "work.queue.report", unit, { accepted: true, refusal: null }, sync, `Nothing to change on ${label}: it already shows this report.`, before);
    }
    return updateResult(db, env, checkoutId, "work.queue.report", unit, { accepted: true, refusal: null }, sync, `Reported on ${label}: ${changes.join(", ")}.`, before);
  }, { storeRoot: env.storeRoot, now: env.now });
}

function unitInput(record: WorkUnitRecord): WorkUnitInput {
  const { revision: _revision, ...rest } = record;
  return rest;
}

function assertEvidencePath(root: string, evidencePath: string): void {
  const absolute = path.join(root, ...evidencePath.split("/"));
  if (!existsSync(absolute)) {
    throw new OperationError(`The file ${evidencePath} does not exist in this project. Give a repository-relative path to an existing file. Nothing changed.`);
  }
}

/** Check gate texts against the store before the sync (read only), so a typo changes nothing. */
function assertGatesKnown(root: string, env: WorkQueueEnv, reference: string, metGates: readonly string[]): void {
  const projectId = projectIdOf(root);
  const unit = readWorkStore(root, (db) => {
    try {
      return findUnit(db, projectId, reference);
    } catch {
      return null;
    }
  }, { storeRoot: env.storeRoot });
  // A unit that only the sync brings in is checked after the sync.
  if (!unit) return;
  const unknown = metGates.filter((text) => !unit.gates.some((gate) => gate.sourceText === text));
  if (unknown.length > 0) {
    throw new OperationError(`${workUnitLabel(unit)} has no gate with this text: ${unknown.map((text) => `"${text}"`).join(", ")}. Gates: ${unit.gates.map((gate) => `"${gate.sourceText}"`).join(", ") || "none"}. Nothing changed.`);
  }
}

/* ------------------------------------------------------------------------ */
/* close                                                                    */
/* ------------------------------------------------------------------------ */

export function workClose(
  root: string,
  env: WorkQueueEnv,
  input: { unit: string; claimId: string | null; outcome: WorkCloseOutcome; expectedVersion: number; handleObservation?: WorkHandleObservation | null },
): WorkUpdateResultValue {
  const sync = syncFirst(root, env);
  const checkoutId = getExistingInstallationCheckoutId(root, env.storeRoot);
  const config = readWorkSyncConfig(root);
  return writeWorkStore(root, (db, project) => {
    const unit = findUnit(db, project.projectId, input.unit);
    const before = claimStateOf(db, unit.storeId, env.now);
    const refuse = (refusal: WorkUpdateRefusal) =>
      updateResult(db, env, checkoutId, "work.queue.close", unit, { accepted: false, refusal }, sync, "", before);
    if (unit.status === "closed") return refuse("unit-closed");
    if (unit.revision !== input.expectedVersion) return refuse("version-conflict");
    const claimRefusal = checkWorkUnitWriteClaim(db, unit.storeId, input.claimId, env.now, { closing: true, handleObservation: input.handleObservation ?? null });
    if (claimRefusal) return refuse(claimRefusal);
    putWorkUnit(db, { ...unitInput(unit), status: "closed", closeOutcome: input.outcome }, {
      expectedVersion: unit.revision,
      claimId: input.claimId,
      handleObservation: input.handleObservation ?? null,
      now: env.now,
    });
    const label = workUnitLabel(unit);
    // Only a file that sync can write shows the close: copies on, and not on the hold list.
    const held = unit.sourcePath !== null && config.syncHold.some((hold) => unit.sourcePath === hold || unit.sourcePath!.startsWith(`${hold}/`));
    const copyNote = unit.sourcePath && config.projection === "on" && !held ? ` The next sync shows it in ${unit.sourcePath}.` : "";
    return updateResult(
      db, env, checkoutId, "work.queue.close", unit, { accepted: true, refusal: null }, sync,
      `Closed ${label} as ${input.outcome}, and released its claim. Closing every task does not close its phase.${copyNote}`,
      before,
    );
  }, { storeRoot: env.storeRoot, now: env.now });
}

/* ------------------------------------------------------------------------ */
/* add                                                                      */
/* ------------------------------------------------------------------------ */

export interface WorkAddResultValue {
  operation: "work.queue.add";
  number: string;
  label: string;
  title: string;
  revision: number;
  sync: WorkSyncOutcome;
  lines: string[];
  summary: string;
}

export function workAdd(
  root: string,
  env: WorkQueueEnv,
  input: { title: string; body: string | null; requestPath: string | null },
): WorkAddResultValue {
  // Inputs are checked before the sync, so a refused input changes nothing.
  if (input.requestPath !== null) assertEvidencePath(root, input.requestPath);
  const sync = syncFirst(root, env);
  return writeWorkStore(root, (db, project) => {
    const links: WorkLink[] = input.requestPath ? [{ direction: "outbound", kind: "request", path: input.requestPath, anchor: null }] : [];
    const item = createQuickItem(db, project.projectId, { title: input.title, body: input.body, links });
    const label = workUnitLabel(item);
    // The `make-docs://project/<project>/tasks/<n>` read lands with W29 R0 P4 T10; until then the result names no URI.
    const lines = [`Added ${label}: ${item.title}. It lives only in the work store. Unit revision: ${item.revision}.`, sync.summary];
    return {
      operation: "work.queue.add",
      number: item.coordinate,
      label,
      title: item.title,
      revision: item.revision,
      sync,
      lines,
      summary: lines.join("\n"),
    };
  }, { storeRoot: env.storeRoot, now: env.now });
}

/* ------------------------------------------------------------------------ */
/* export                                                                   */
/* ------------------------------------------------------------------------ */

/**
 * The text of a project's quick item list. One renderer serves the `tasks`
 * URI list read and `work export --quick` (R-WORK-URI-7). It shows each
 * number, title, status, and close outcome, and never a claim ID.
 */
export function renderWorkTasksList(project: string, items: readonly WorkUnitRecord[]): string {
  const quick = items.filter((item) => item.kind === "quick-item").sort((left, right) => Number(left.coordinate) - Number(right.coordinate));
  const lines = [`# Quick items of ${project}`, ""];
  if (quick.length === 0) lines.push("This project has no quick items.");
  for (const item of quick) {
    const state = item.status === "closed" ? `closed (${item.closeOutcome})` : item.status;
    lines.push(`- task ${item.coordinate}: ${item.title} [${state}]`);
  }
  return `${lines.join("\n")}\n`;
}

export interface WorkExportResultValue {
  operation: "work.queue.export";
  written: string[];
  skipped: Array<{ path: string; reason: string }>;
  quick: { path: string; count: number } | null;
  sync: WorkSyncOutcome;
  lines: string[];
  summary: string;
}

/**
 * True when `child` is `parent` or under it. macOS and Windows folders are
 * usually case-insensitive, so there the compare ignores letter case: a path
 * part that does not exist yet keeps the case that was typed (re-check finding 1).
 */
function isInside(parent: string, child: string): boolean {
  const fold = process.platform === "darwin" || process.platform === "win32";
  const a = fold ? parent.toLowerCase() : parent;
  const b = fold ? child.toLowerCase() : child;
  const relative = path.relative(a, b);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

/**
 * The real path that writing `target` would reach: the real path of its
 * deepest existing folder, with the rest of the path after it. It follows
 * every symbolic link on the way, so `/var` and `/private/var` compare equal,
 * and it reads the stored letter case of each existing part.
 */
export function realWriteTarget(target: string): string {
  const absolute = path.resolve(target);
  const rest: string[] = [];
  let current = absolute;
  for (;;) {
    const entry = lstatSync(current, { throwIfNoEntry: false });
    if (entry) {
      // A dangling symbolic link has no real path; refuse it as the link itself.
      try {
        // The native real path gives the stored letter case, so `Docs/Work` reads as `docs/work`.
        return path.join(realpathSync.native(current), ...rest.reverse());
      } catch {
        throw new OperationError(`${absolute} passes through a broken symbolic link at ${current}. Nothing changed.`);
      }
    }
    const parent = path.dirname(current);
    if (parent === current) return absolute;
    rest.push(path.basename(current));
    current = parent;
  }
}

/** Folders that export never writes into: the work files that sync owns, every held path, and `.make-docs/`. */
function exportForbiddenZones(root: string): Array<{ path: string; why: string }> {
  const real = realWriteTarget(root);
  const zones = [
    { path: path.join(real, "docs", "work"), why: "docs/work/ holds the work files that sync owns" },
    { path: path.join(real, ".make-docs"), why: ".make-docs/ holds the project config, system resources, and the work archive" },
  ];
  for (const hold of readWorkSyncConfig(root).syncHold) {
    zones.push({ path: realWriteTarget(path.join(root, ...hold.split("/"))), why: `${hold} is on the sync hold list` });
  }
  return zones;
}

function assertExportDestination(root: string, destination: string, flag: string): void {
  const real = realWriteTarget(destination);
  for (const zone of exportForbiddenZones(root)) {
    if (isInside(zone.path, real)) {
      throw new OperationError(`${flag} would write ${real}, and ${zone.why}. Name a folder or file outside it. Nothing changed.`);
    }
  }
}

/**
 * Write repo copies on request (R-WORK-STORE-10) to a new or empty folder the
 * caller names, and quick items to a new file the caller names (R-WORK-URI-7).
 * Export never writes under `docs/work/`, `.make-docs/`, or a held path, never
 * follows a symbolic link into them, and never replaces a file. Every check
 * runs before the sync, so a refused export changes nothing.
 */
export function workExport(
  root: string,
  env: WorkQueueEnv,
  input: { to: string | null; quick: string | null; paths: string[] },
): WorkExportResultValue {
  if (input.to === null && input.quick === null) {
    throw new OperationError("Name where to write: --to <folder> for backlog files, or --quick <file> for quick items. Nothing changed.");
  }
  const toTarget = input.to === null ? null : path.resolve(root, input.to);
  const quickTarget = input.quick === null ? null : path.resolve(root, input.quick);
  if (toTarget !== null) {
    // Every exported file lands under <to>/docs/work/ or <to>/.make-docs/archive/work/.
    assertExportDestination(root, toTarget, "--to");
    for (const workRoot of WORK_FILE_ROOTS) assertExportDestination(root, path.join(toTarget, ...workRoot.split("/")), "--to");
    const real = realWriteTarget(toTarget);
    const entry = lstatSync(real, { throwIfNoEntry: false });
    if (entry && (!entry.isDirectory() || readdirSync(real).length > 0)) {
      throw new OperationError(`--to must name a new or empty folder, so export replaces no file. ${toTarget} is not one. Nothing changed.`);
    }
  }
  if (quickTarget !== null) {
    assertExportDestination(root, quickTarget, "--quick");
    if (lstatSync(quickTarget, { throwIfNoEntry: false })) {
      throw new OperationError(`--quick must name a new file, so export replaces no file. ${quickTarget} exists. Nothing changed.`);
    }
  }
  const projectId = projectIdOf(root);
  const sync = syncFirst(root, env);
  return readWorkStore(root, (db) => {
    const units = listWorkUnits(db, projectId);
    const written: string[] = [];
    const skipped: Array<{ path: string; reason: string }> = [];
    let quick: WorkExportResultValue["quick"] = null;
    if (toTarget !== null) {
      const filePaths = [...new Set(units.filter((unit) => unit.sourcePath && unit.kind !== "wave" && unit.kind !== "quick-item" && unit.copyState === "kept").map((unit) => unit.sourcePath!))].sort();
      const wanted = input.paths.length === 0 ? filePaths : filePaths.filter((file) => input.paths.some((prefix) => file === prefix.replace(/\/+$/, "") || file.startsWith(`${prefix.replace(/\/+$/, "")}/`)));
      for (const file of wanted) {
        const fileUnits = units.filter((unit) => unit.sourcePath === file && unit.kind !== "wave");
        const fileUnit = fileUnits.find((unit) => (unit.kind === "revision" || unit.kind === "phase") && unit.body !== null);
        const parsed = fileUnit?.body ? parseWorkFile(file, fileUnit.body) : null;
        if (!parsed?.ok) {
          skipped.push({ path: file, reason: "The store has no readable text for this file." });
          continue;
        }
        const rendered = renderWorkFile(parsed.document, fileUnits.map((unit) => {
          const shown = parsed.document.units.find((candidate) => candidate.coordinate === unit.coordinate);
          return {
            coordinate: unit.coordinate,
            kind: unit.kind as "revision" | "phase" | "stage" | "task",
            status: unit.status,
            closeOutcome: unit.closeOutcome,
            title: shown && unit.kind !== "task" ? shown.title : unit.title,
            text: unit.kind === "task" ? unit.body : null,
            blockers: shown ? shown.blockerBullets.map((bullet) => bullet.text) : [],
            gates: [],
          };
        }));
        if (!rendered.ok) {
          skipped.push({ path: file, reason: rendered.reason });
          continue;
        }
        const destination = path.join(toTarget, ...file.split("/"));
        // Check each destination again: a folder made since the first check must not lead into a forbidden zone.
        assertExportDestination(root, destination, "--to");
        mkdirSync(path.dirname(destination), { recursive: true });
        writeFileSync(destination, rendered.text, { encoding: "utf8", flag: "wx" });
        written.push(destination);
      }
    }
    if (quickTarget !== null) {
      assertExportDestination(root, quickTarget, "--quick");
      const register = resolveWorkProject(db, { kind: "id", value: projectId });
      const text = renderWorkTasksList(register?.projectName ?? projectId, units);
      mkdirSync(path.dirname(quickTarget), { recursive: true });
      writeFileSync(quickTarget, text, { encoding: "utf8", flag: "wx" });
      quick = { path: quickTarget, count: units.filter((unit) => unit.kind === "quick-item").length };
    }
    const lines = [
      ...(toTarget !== null ? [`Exported ${count(written.length, "work file")} from the store to ${toTarget}.`] : []),
      ...skipped.map((entry) => `  Skipped ${entry.path}: ${entry.reason}`),
      ...(quick ? [`Wrote ${count(quick.count, "quick item")} to ${quick.path}.`] : []),
      sync.summary,
    ];
    return { operation: "work.queue.export", written, skipped, quick, sync, lines, summary: lines.join("\n") };
  }, { storeRoot: env.storeRoot });
}

export type { WorkQueueItem, WorkVisibleClaim };
