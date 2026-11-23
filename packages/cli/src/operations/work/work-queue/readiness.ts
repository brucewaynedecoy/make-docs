import {
  WORK_DEPENDENCY_MET_OUTCOMES,
  WORK_READY_ORDER,
  WORK_RECORDED_STATUS_MAP,
  WORK_WAIT_REASON_TEXT,
} from "../work-store/catalog.js";
import {
  WORK_WAIT_REASONS,
  type WorkClaimRecord,
  type WorkNextQuery,
  type WorkSyncConflictRecord,
  type WorkUnitKind,
  type WorkUnitRecord,
  type WorkWaitReason,
} from "../work-store/schemas.js";

/**
 * W29 R0 P4 readiness and ready order (PRD 52 R-WORK-QUEUE-4, R-WORK-QUEUE-5,
 * R-WORK-QUEUE-14 to R-WORK-QUEUE-16; rule catalog WORK-RULE-020, -021, -032,
 * -033). This is the CLI form of the `readiness` section of
 * `make-docs://system/reference/work-store.md`. It reads records only, so the
 * P1 readiness fixtures run against it directly.
 *
 * Two owner decisions of 2026-11-23 (W29 R0 P4 T17) live here:
 *
 * - A wave unit is ready when all its revisions are closed. Each open revision
 *   is named as a `dependency-open` reason. The ancestor check of a revision
 *   leaves this rule out, so a revision never waits for its own wave.
 * - Archived backlogs never show in `work next`: a unit whose work file is under
 *   `.make-docs/archive/work/`, and a wave whose revisions are all archived, is
 *   left out of both lists. Archived units still count as dependencies.
 *
 * And one of 2026-11-23 for older backlogs (W29 R0 P4 review finding 7,
 * WORK-RULE-040): a status line is the authority when it is present. A phase
 * with no status line whose tasks are all checked counts as done for
 * readiness, and the result says so (`doneBy: "all-tasks-checked"`). A phase
 * with no task, or with an unchecked task, keeps its status. The store record
 * does not change.
 */

/** Why a unit counts as done for readiness without a closed status. */
export type WorkDoneBy = "all-tasks-checked";

export interface WorkFallbackDone {
  storeId: string;
  coordinate: string;
  sourcePath: string | null;
  doneBy: WorkDoneBy;
}

export const WORK_ARCHIVE_ROOT = ".make-docs/archive/work/";

export interface WorkWaitReasonEntry {
  reason: WorkWaitReason;
  /** Human words, filled from the catalog template. */
  text: string;
  /** One next action for this reason. */
  nextAction: string;
  /** The coordinate the reason names, such as a dependency or an ancestor, when it names one. */
  coordinate: string | null;
}

/**
 * The claim on a unit, as any caller may see it. It never holds the claim ID:
 * a claim ID works like a private key (owner decision 2026-11-23, W29 R0 P4
 * T13), and only the result of a new claim gives it, once, to its holder.
 */
export interface WorkVisibleClaim {
  claimant: string;
  taskHandle: string | null;
  claimedAt: string;
  renewedAt: string;
  expiresAt: string;
  live: boolean;
  /** True when the caller named this claimant. It proves nothing and reveals nothing. */
  namedByCaller: boolean;
}

export interface WorkQueueItem {
  storeId: string;
  coordinate: string;
  /** Human name: `task 7` for a quick item, the coordinate otherwise. */
  label: string;
  kind: WorkUnitKind;
  title: string;
  status: WorkUnitRecord["status"];
  recordedStatus: string | null;
  sourcePath: string | null;
  revision: number;
  claim: WorkVisibleClaim | null;
  reasons: WorkWaitReasonEntry[];
}

export interface WorkReadinessInput {
  now: Date | string;
  /** The caller's claimant name, or null. */
  claimant: string | null;
  query: WorkNextQuery;
  units: readonly WorkUnitRecord[];
  claims: readonly WorkClaimRecord[];
  conflicts: readonly Pick<WorkSyncConflictRecord, "targetPath" | "affectedUnitStoreIds">[];
}

export interface WorkReadinessResult {
  ready: WorkQueueItem[];
  waiting: WorkQueueItem[];
  /** Phases that count as done by the all-tasks-checked fallback (finding 7), so neither list shows them. */
  doneByFallback: WorkFallbackDone[];
}

/**
 * True when a phase file's text has an unchecked checkbox in a `Tasks`
 * section, at any indent and with or without a task ID. The phase unit keeps
 * its file text as its body. Fenced code is skipped.
 */
export function hasUncheckedTaskBox(body: string | null): boolean {
  if (body === null) return false;
  let inTasks = false;
  let fence: string | null = null;
  for (const line of body.split(/\r?\n/)) {
    const fenceMatch = /^\s*(```|~~~)/.exec(line);
    if (fenceMatch) {
      fence = fence === null ? fenceMatch[1]! : fence === fenceMatch[1] ? null : fence;
      continue;
    }
    if (fence !== null) continue;
    const heading = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (heading) {
      inTasks = /^tasks\b/i.test(heading[2]!);
      continue;
    }
    if (inTasks && /^\s*(?:[-*+]|\d+[.)])\s+\[ \]/.test(line)) return true;
  }
  return false;
}

/** A quick item is written `task 7` in human text (R-WORK-QUEUE-18). */
export function workUnitLabel(unit: Pick<WorkUnitRecord, "kind" | "coordinate">): string {
  return unit.kind === "quick-item" ? `task ${unit.coordinate}` : unit.coordinate;
}

/**
 * Coordinate order (R-WORK-QUEUE-5): part by part, in W, R, P, S, T order, with
 * numbers compared as numbers. Quick items come after every coordinate, by number.
 */
export function compareWorkCoordinates(left: string, right: string): number {
  const quick = (value: string) => /^\d+$/.test(value);
  if (quick(left) || quick(right)) {
    if (quick(left) && quick(right)) return Number(left) - Number(right);
    return quick(left) ? 1 : -1;
  }
  const order = WORK_READY_ORDER.partOrder as readonly string[];
  const parts = (value: string) => value.split(" ").map((part) => ({ letter: part[0]!, number: Number(part.slice(1)) }));
  const a = parts(left);
  const b = parts(right);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const x = a[index];
    const y = b[index];
    if (!x) return -1;
    if (!y) return 1;
    if (x.letter !== y.letter) return order.indexOf(x.letter) - order.indexOf(y.letter);
    if (x.number !== y.number) return x.number - y.number;
  }
  return 0;
}

/** True when a recorded status is not one Make Docs knows (R-WORK-QUEUE-16). */
export function isUnknownRecordedStatus(recorded: string | null): boolean {
  if (recorded === null) return false;
  const value = recorded.trim().toLowerCase();
  return !WORK_RECORDED_STATUS_MAP.some((entry) => entry.recorded.includes(value));
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{([a-zA-Z]+)\}/g, (match, key: string) => values[key] ?? match);
}

function reasonEntry(reason: WorkWaitReason, values: Record<string, string>, coordinate: string | null = null, workDone = false): WorkWaitReasonEntry {
  const text = WORK_WAIT_REASON_TEXT[reason];
  const nextAction = workDone && text.nextActionWhenDone ? text.nextActionWhenDone : text.nextAction;
  return { reason, text: fill(text.template, values), nextAction: fill(nextAction, values), coordinate };
}

function isArchived(unit: Pick<WorkUnitRecord, "sourcePath">): boolean {
  return unit.sourcePath !== null && unit.sourcePath.startsWith(WORK_ARCHIVE_ROOT);
}

/** Show a claim to any caller, without its claim ID (T13). */
export function visibleWorkClaim(claim: WorkClaimRecord, caller: string | null, now: Date): WorkVisibleClaim {
  return {
    claimant: claim.claimant,
    taskHandle: claim.taskHandle,
    claimedAt: claim.claimedAt,
    renewedAt: claim.renewedAt,
    expiresAt: claim.expiresAt,
    live: claim.expiresAt > now.toISOString(),
    namedByCaller: caller !== null && claim.claimant === caller,
  };
}

/** The readiness of every unit of a project, as the queue reads it. */
export class WorkReadiness {
  readonly now: Date;
  readonly nowText: string;
  private readonly byId: Map<string, WorkUnitRecord>;
  private readonly children: Map<string, WorkUnitRecord[]>;
  private readonly claimByUnit: Map<string, WorkClaimRecord>;
  private readonly conflictPaths: Set<string>;
  private readonly conflictUnits: Set<string>;
  private readonly ownCache = new Map<string, WorkWaitReasonEntry[]>();
  private readonly doneCache = new Map<string, WorkDoneBy | null>();

  constructor(private readonly input: Omit<WorkReadinessInput, "query">) {
    this.now = typeof input.now === "string" ? new Date(input.now) : input.now;
    this.nowText = this.now.toISOString();
    this.byId = new Map(input.units.map((unit) => [unit.storeId, unit]));
    this.children = new Map();
    for (const unit of input.units) {
      if (unit.parentStoreId === null) continue;
      this.children.set(unit.parentStoreId, [...(this.children.get(unit.parentStoreId) ?? []), unit]);
    }
    this.claimByUnit = new Map(input.claims.map((claim) => [claim.unitStoreId, claim]));
    this.conflictPaths = new Set(input.conflicts.map((conflict) => conflict.targetPath));
    this.conflictUnits = new Set(input.conflicts.flatMap((conflict) => conflict.affectedUnitStoreIds));
  }

  unit(storeId: string): WorkUnitRecord | null {
    return this.byId.get(storeId) ?? null;
  }

  claimOf(storeId: string): WorkClaimRecord | null {
    return this.claimByUnit.get(storeId) ?? null;
  }

  private tasksUnder(unit: WorkUnitRecord): WorkUnitRecord[] {
    const tasks: WorkUnitRecord[] = [];
    const visit = (parent: WorkUnitRecord) => {
      for (const child of this.children.get(parent.storeId) ?? []) {
        if (child.kind === "task") tasks.push(child);
        else visit(child);
      }
    };
    visit(unit);
    return tasks;
  }

  /**
   * Finding 7 (owner decision 2026-11-23): a phase with no status line, open in
   * the store, whose tasks are all checked, counts as done. A status line, a
   * status that the store recorded, no task, or one unchecked task keeps it open.
   */
  doneBy(unit: WorkUnitRecord): WorkDoneBy | null {
    const cached = this.doneCache.get(unit.storeId);
    if (cached !== undefined) return cached;
    let result: WorkDoneBy | null = null;
    if (unit.kind === "phase" && unit.recordedStatus === null && unit.status === "open") {
      const tasks = this.tasksUnder(unit);
      // Re-check finding 3: an unchecked checkbox in a Tasks section, such as an indented one with no task
      // ID, is not a unit, but it is still open work, so the phase does not count as done.
      if (tasks.length > 0 && tasks.every((task) => task.status === "closed") && !hasUncheckedTaskBox(unit.body)) result = "all-tasks-checked";
    }
    this.doneCache.set(unit.storeId, result);
    return result;
  }

  /** Closed in the store, or done by the fallback. */
  isClosed(unit: WorkUnitRecord): boolean {
    return unit.status === "closed" || this.doneBy(unit) !== null;
  }

  private isLive(claim: WorkClaimRecord): boolean {
    return claim.expiresAt > this.nowText;
  }

  /** A wave is archived when it has revisions and every one is archived. */
  isArchived(unit: WorkUnitRecord): boolean {
    if (unit.kind === "wave") {
      const revisions = this.children.get(unit.storeId) ?? [];
      return revisions.length > 0 && revisions.every((revision) => isArchived(revision));
    }
    return isArchived(unit);
  }

  private ancestors(unit: WorkUnitRecord): WorkUnitRecord[] {
    const chain: WorkUnitRecord[] = [];
    const seen = new Set<string>([unit.storeId]);
    let parentId = unit.parentStoreId;
    while (parentId !== null && !seen.has(parentId)) {
      seen.add(parentId);
      const parent = this.byId.get(parentId);
      if (!parent) break;
      chain.push(parent);
      parentId = parent.parentStoreId;
    }
    return chain;
  }

  /**
   * The unit's own reasons apart from claims, the wave rule, and ancestors: its
   * status, dependencies, gates, blockers, and its file's sync conflict.
   */
  private ownReasons(unit: WorkUnitRecord): WorkWaitReasonEntry[] {
    const cached = this.ownCache.get(unit.storeId);
    if (cached) return cached;
    const reasons: WorkWaitReasonEntry[] = [];
    const path = unit.sourcePath ?? "the work store";
    if (unit.status === "draft") reasons.push(reasonEntry("draft", { path }));
    if (isUnknownRecordedStatus(unit.recordedStatus)) {
      reasons.push(reasonEntry("status-unknown", { path, recorded: unit.recordedStatus ?? "" }));
    }
    for (const dependency of unit.dependencies) {
      const target = this.byId.get(dependency.dependsOnStoreId);
      if (!target) {
        reasons.push(reasonEntry("dependency-unresolved", { path, text: dependency.sourceText }, null));
        continue;
      }
      const name = workUnitLabel(target);
      if (!this.isClosed(target)) reasons.push(reasonEntry("dependency-open", { path, dependency: name }, target.coordinate));
      else if (target.status === "closed" && !WORK_DEPENDENCY_MET_OUTCOMES.includes(target.closeOutcome!)) {
        reasons.push(reasonEntry("dependency-cancelled", { path, dependency: name }, target.coordinate));
      }
    }
    for (const unresolved of unit.unresolvedDependencies) {
      reasons.push(reasonEntry("dependency-unresolved", { path, text: unresolved.sourceText }));
    }
    for (const gate of unit.gates) if (!gate.met) reasons.push(reasonEntry("gate-open", { path, text: gate.sourceText }));
    if (unit.status === "blocked" || unit.blockers.length > 0) {
      // The template ends the sentence with a period. A blocker's own final period goes, and a
      // text that already ends in "?" or "!" keeps its mark with no period after it (W29 R0 P6).
      const text = unit.blockers.length > 0 ? unit.blockers.map((blocker) => blocker.text.replace(/\.+$/, "")).join("; ") : "the unit is marked blocked";
      const entry = reasonEntry("blocked", { path, text });
      entry.text = entry.text.replace(/([?!])\.$/, "$1");
      reasons.push(entry);
    }
    if ((unit.sourcePath !== null && this.conflictPaths.has(unit.sourcePath)) || this.conflictUnits.has(unit.storeId)) {
      reasons.push(reasonEntry("sync-conflict", { path }));
    }
    this.ownCache.set(unit.storeId, reasons);
    return reasons;
  }

  /** Whether an ancestor is open and would be ready apart from claims (R-WORK-QUEUE-4, R-WORK-QUEUE-15). */
  private ancestorWaits(ancestor: WorkUnitRecord): boolean {
    return this.ownReasons(ancestor).length > 0;
  }

  /**
   * Whether a unit's own work is done: it has at least one task below it, and
   * every task is closed as done (each was checked in its file). A task's own
   * work is never done here, because an open task is not done.
   */
  private workDone(unit: WorkUnitRecord): boolean {
    const tasks: WorkUnitRecord[] = [];
    const visit = (parent: WorkUnitRecord) => {
      for (const child of this.children.get(parent.storeId) ?? []) {
        if (child.kind === "task") tasks.push(child);
        else visit(child);
      }
    };
    if (unit.kind === "task") return false;
    visit(unit);
    return tasks.length > 0 && tasks.every((task) => task.status === "closed" && task.closeOutcome === "done");
  }

  /** Every reason a unit waits for the caller. An empty list means ready. Closed units have no reasons. */
  reasonsFor(unit: WorkUnitRecord, claimant: string | null): WorkWaitReasonEntry[] {
    if (this.isClosed(unit)) return [];
    const reasons = [...this.ownReasons(unit)];
    // T17: a wave is ready when all its revisions are closed.
    if (unit.kind === "wave") {
      for (const revision of (this.children.get(unit.storeId) ?? []).filter((child) => child.kind === "revision")) {
        if (revision.status !== "closed") {
          reasons.push(reasonEntry("dependency-open", { path: unit.sourcePath ?? "the work store", dependency: revision.coordinate }, revision.coordinate));
        }
      }
    }
    const claim = this.claimByUnit.get(unit.storeId);
    if (claim) {
      const values = { claimant: claim.claimant, expiresAt: claim.expiresAt };
      reasons.push(reasonEntry(this.isLive(claim) ? "claimed" : "claim-expired", values));
    }
    for (const ancestor of this.ancestors(unit)) {
      const path = ancestor.sourcePath ?? "the work store";
      const ancestorClaim = this.claimByUnit.get(ancestor.storeId);
      if (ancestorClaim && this.isLive(ancestorClaim) && ancestorClaim.claimant !== claimant) {
        reasons.push(reasonEntry("ancestor-claimed", { ancestor: ancestor.coordinate, claimant: ancestorClaim.claimant }, ancestor.coordinate));
      }
      if (this.isClosed(ancestor)) {
        const values = { ancestor: ancestor.coordinate, path, unitPath: unit.sourcePath ?? "the work store", coordinate: unit.coordinate };
        reasons.push(reasonEntry("ancestor-closed", values, ancestor.coordinate, this.workDone(unit)));
      } else if (this.ancestorWaits(ancestor)) {
        reasons.push(reasonEntry("ancestor-waiting", { ancestor: ancestor.coordinate, ancestorKind: ancestor.kind, path }, ancestor.coordinate));
      }
    }
    const order = WORK_WAIT_REASONS as readonly string[];
    return reasons
      .map((entry, index) => ({ entry, index }))
      .sort((left, right) => order.indexOf(left.entry.reason) - order.indexOf(right.entry.reason) || left.index - right.index)
      .map(({ entry }) => entry);
  }

  item(unit: WorkUnitRecord, claimant: string | null, reasons = this.reasonsFor(unit, claimant)): WorkQueueItem {
    const claim = this.claimByUnit.get(unit.storeId);
    return {
      storeId: unit.storeId,
      coordinate: unit.coordinate,
      label: workUnitLabel(unit),
      kind: unit.kind,
      title: unit.title,
      status: unit.status,
      recordedStatus: unit.recordedStatus,
      sourcePath: unit.sourcePath,
      revision: unit.revision,
      claim: claim ? visibleWorkClaim(claim, claimant, this.now) : null,
      reasons,
    };
  }

  /** True when the unit is ready for the caller. */
  isReady(unit: WorkUnitRecord, claimant: string | null): boolean {
    return !this.isClosed(unit) && this.reasonsFor(unit, claimant).length === 0;
  }

  /** Every phase, not archived, that counts as done by the fallback. */
  fallbackDone(): WorkFallbackDone[] {
    return this.input.units
      .filter((unit) => !this.isArchived(unit) && this.doneBy(unit) !== null)
      .sort((left, right) => compareWorkCoordinates(left.coordinate, right.coordinate))
      .map((unit) => ({ storeId: unit.storeId, coordinate: unit.coordinate, sourcePath: unit.sourcePath, doneBy: this.doneBy(unit)! }));
  }
}

/** Ready units in dependency order, then coordinate order (R-WORK-QUEUE-5). */
function readyOrder(ready: WorkUnitRecord[]): WorkUnitRecord[] {
  const sorted = [...ready].sort((left, right) => compareWorkCoordinates(left.coordinate, right.coordinate));
  const inSet = new Set(sorted.map((unit) => unit.storeId));
  const placed = new Set<string>();
  const out: WorkUnitRecord[] = [];
  const visit = (unit: WorkUnitRecord, trail: Set<string>) => {
    if (placed.has(unit.storeId) || trail.has(unit.storeId)) return;
    trail.add(unit.storeId);
    for (const dependency of unit.dependencies) {
      const target = sorted.find((candidate) => candidate.storeId === dependency.dependsOnStoreId);
      if (target && inSet.has(target.storeId)) visit(target, trail);
    }
    placed.add(unit.storeId);
    out.push(unit);
  };
  for (const unit of sorted) visit(unit, new Set());
  return out;
}

/**
 * `work next`: ready units of the asked level and every open unit of that level
 * that waits, with each reason and one next action for each reason.
 */
export function computeWorkReadiness(input: WorkReadinessInput): WorkReadinessResult {
  const readiness = new WorkReadiness(input);
  const level = input.query.level;
  const candidates = input.units.filter((unit) =>
    !readiness.isClosed(unit) &&
    (unit.kind === level || (input.query.includeQuickItems && unit.kind === "quick-item")) &&
    !readiness.isArchived(unit));
  const ready: WorkUnitRecord[] = [];
  const waiting: WorkQueueItem[] = [];
  for (const unit of candidates) {
    const reasons = readiness.reasonsFor(unit, input.claimant);
    if (reasons.length === 0) ready.push(unit);
    else waiting.push(readiness.item(unit, input.claimant, reasons));
  }
  waiting.sort((left, right) => compareWorkCoordinates(left.coordinate, right.coordinate));
  return { ready: readyOrder(ready).map((unit) => readiness.item(unit, input.claimant, [])), waiting, doneByFallback: readiness.fallbackDone() };
}
