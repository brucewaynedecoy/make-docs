import { createHash } from "node:crypto";

import type {
  WorkCloseOutcome,
  WorkConflictKind,
  WorkSettleChoice,
  WorkSyncDecision,
  WorkSyncFileState,
  WorkSyncStoreState,
  WorkTrackerConnection,
  WorkUnitStatus,
  WorkWaitReason,
} from "./schemas.js";

/**
 * W29 R0 P1 rule catalog for the work store (PRD 52).
 *
 * Every rule has one CLI form (the operation that applies it) and one agent
 * form (a section of `make-docs://system/reference/work-store.md`). The two
 * forms must give the same answer on the parity fixtures. A change to either
 * form changes the catalog digest and requires a review of the other form.
 */

export const WORK_STORE_RULE_CATALOG_ID = "make-docs.work-store-rules.v1";
export const WORK_STORE_RULE_CATALOG_VERSION = 1;

export const WORK_STORE_AGENT_RESOURCE = "make-docs://system/reference/work-store.md";

export const WORK_STORE_AGENT_SECTIONS = [
  "authority",
  "repo-copy",
  "sync",
  "first-import",
  "units",
  "readiness",
  "claims",
  "report-and-close",
  "tracker-connections",
  "quick-items",
  "project-uris",
] as const;
export type WorkStoreAgentSection = (typeof WORK_STORE_AGENT_SECTIONS)[number];

export const WORK_STORE_OPERATIONS = [
  { id: "work.queue.status", cli: "make-docs work status", mcp: "work_status", writes: false },
  { id: "work.queue.sync", cli: "make-docs work sync", mcp: "work_sync", writes: true },
  { id: "work.queue.next", cli: "make-docs work next", mcp: "work_next", writes: false },
  { id: "work.queue.claim", cli: "make-docs work claim", mcp: "work_claim", writes: true },
  { id: "work.queue.release", cli: "make-docs work release", mcp: "work_release", writes: true },
  { id: "work.queue.report", cli: "make-docs work report", mcp: "work_report", writes: true },
  { id: "work.queue.close", cli: "make-docs work close", mcp: "work_close", writes: true },
  { id: "work.queue.export", cli: "make-docs work export", mcp: "work_export", writes: true },
  { id: "work.queue.add", cli: "make-docs work add", mcp: "work_add", writes: true },
] as const;
export type WorkStoreOperationId = (typeof WORK_STORE_OPERATIONS)[number]["id"];

/**
 * The shared resource read operation. It prints quick items and backlog units by
 * `make-docs://project/<project>/` URI (R-WORK-URI-5). It is not a work operation,
 * so it does not run sync first.
 */
export const WORK_STORE_RESOURCE_READ_OPERATION = "resource.read" as const;
export type WorkStoreRuleOperationId = WorkStoreOperationId | typeof WORK_STORE_RESOURCE_READ_OPERATION;

export type WorkStoreRuleArea =
  | "authority"
  | "repo-copy"
  | "sync"
  | "first-import"
  | "units"
  | "readiness"
  | "claims"
  | "report-and-close"
  | "tracker-connections"
  | "quick-items"
  | "project-uris";

export interface WorkStoreRule {
  id: `WORK-RULE-${string}`;
  title: string;
  area: WorkStoreRuleArea;
  prdRequirements: readonly string[];
  cliForm: readonly WorkStoreRuleOperationId[];
  agentForm: `${typeof WORK_STORE_AGENT_RESOURCE}#${WorkStoreAgentSection}`;
  humanMeaning: string;
}

const agent = (section: WorkStoreAgentSection) =>
  `${WORK_STORE_AGENT_RESOURCE}#${section}` as const;

const ALL_OPERATIONS: readonly WorkStoreOperationId[] = WORK_STORE_OPERATIONS.map(
  (operation) => operation.id,
);

export const WORK_STORE_RULES: readonly WorkStoreRule[] = Object.freeze([
  {
    id: "WORK-RULE-001",
    title: "Authority mode",
    area: "authority",
    prdRequirements: ["R-WORK-STORE-1", "R-WORK-STORE-2"],
    cliForm: ALL_OPERATIONS,
    agentForm: agent("authority"),
    humanMeaning: "With a usable Store, the work store is the authority. Otherwise the docs/work files are, exactly as before.",
  },
  {
    id: "WORK-RULE-002",
    title: "Status names the mode and its reason",
    area: "authority",
    prdRequirements: ["R-WORK-STORE-3"],
    cliForm: ["work.queue.status"],
    agentForm: agent("authority"),
    humanMeaning: "A person can see which source is in charge of the work and why.",
  },
  {
    id: "WORK-RULE-003",
    title: "Work records only",
    area: "authority",
    prdRequirements: ["R-WORK-STORE-4"],
    cliForm: ["work.queue.sync"],
    agentForm: agent("authority"),
    humanMeaning: "Designs, plans, PRDs, guides, and history stay as repository documents.",
  },
  {
    id: "WORK-RULE-004",
    title: "Links in both directions",
    area: "authority",
    prdRequirements: ["R-WORK-STORE-5"],
    cliForm: ["work.queue.sync", "work.queue.export"],
    agentForm: agent("authority"),
    humanMeaning: "A unit links to its design, plan, PRD sections, and evidence, and those documents keep their links to the unit.",
  },
  {
    id: "WORK-RULE-005",
    title: "Repo copy setting",
    area: "repo-copy",
    prdRequirements: ["R-WORK-STORE-7"],
    cliForm: ["work.queue.sync"],
    agentForm: agent("repo-copy"),
    humanMeaning: "The docs/work copy is on unless the project turns it off.",
  },
  {
    id: "WORK-RULE-006",
    title: "Same file format",
    area: "repo-copy",
    prdRequirements: ["R-WORK-STORE-8"],
    cliForm: ["work.queue.sync", "work.queue.export"],
    agentForm: agent("repo-copy"),
    humanMeaning: "A teammate without a Store sees the same files, names, and templates as before.",
  },
  {
    id: "WORK-RULE-007",
    title: "Remove only an unchanged copy",
    area: "repo-copy",
    prdRequirements: ["R-WORK-STORE-9"],
    cliForm: ["work.queue.sync"],
    agentForm: agent("repo-copy"),
    humanMeaning: "Make Docs never deletes a work file that a person changed.",
  },
  {
    id: "WORK-RULE-008",
    title: "Copies off",
    area: "repo-copy",
    prdRequirements: ["R-WORK-STORE-10"],
    cliForm: ["work.queue.status", "work.queue.export"],
    agentForm: agent("repo-copy"),
    humanMeaning: "With copies off, the store is the only record in this checkout, status says so, and export writes the files on request.",
  },
  {
    id: "WORK-RULE-009",
    title: "Three-way sync",
    area: "sync",
    prdRequirements: ["R-WORK-SYNC-1", "R-WORK-SYNC-2", "R-WORK-SYNC-3", "R-WORK-SYNC-12"],
    cliForm: ["work.queue.sync"],
    agentForm: agent("sync"),
    humanMeaning: "An edit on one side moves to the other side. Nothing is lost silently.",
  },
  {
    id: "WORK-RULE-010",
    title: "Conflict stops only its own file",
    area: "sync",
    prdRequirements: ["R-WORK-SYNC-4", "R-WORK-SYNC-5"],
    cliForm: ["work.queue.sync", "work.queue.next"],
    agentForm: agent("sync"),
    humanMeaning: "When both sides changed, Make Docs shows both and waits for a choice. Other files continue.",
  },
  {
    id: "WORK-RULE-011",
    title: "Unreadable file stays untouched",
    area: "sync",
    prdRequirements: ["R-WORK-SYNC-6"],
    cliForm: ["work.queue.sync"],
    agentForm: agent("sync"),
    humanMeaning: "A file Make Docs cannot read is reported with its first failing line and is never overwritten.",
  },
  {
    id: "WORK-RULE-012",
    title: "Byte-for-byte round trip",
    area: "sync",
    prdRequirements: ["R-WORK-SYNC-7"],
    cliForm: ["work.queue.sync", "work.queue.export"],
    agentForm: agent("sync"),
    humanMeaning: "Writing a file that did not change produces the same bytes, so git shows no change.",
  },
  {
    id: "WORK-RULE-013",
    title: "Sync before each work operation",
    area: "sync",
    prdRequirements: ["R-WORK-SYNC-8"],
    cliForm: ALL_OPERATIONS,
    agentForm: agent("sync"),
    humanMeaning: "Every work command starts from the latest edits on both sides.",
  },
  {
    id: "WORK-RULE-014",
    title: "A deleted file is a conflict",
    area: "sync",
    prdRequirements: ["R-WORK-SYNC-11"],
    cliForm: ["work.queue.sync"],
    agentForm: agent("sync"),
    humanMeaning: "Make Docs does not silently recreate or silently drop the work in a file that a person deleted.",
  },
  {
    id: "WORK-RULE-015",
    title: "First import writes no file",
    area: "first-import",
    prdRequirements: ["R-WORK-SYNC-9"],
    cliForm: ALL_OPERATIONS,
    agentForm: agent("first-import"),
    humanMeaning: "Turning on the work store leaves git clean.",
  },
  {
    id: "WORK-RULE-016",
    title: "Unresolved dependency bullets",
    area: "first-import",
    prdRequirements: ["R-WORK-SYNC-10"],
    cliForm: ["work.queue.sync", "work.queue.next"],
    agentForm: agent("first-import"),
    humanMeaning: "A dependency Make Docs cannot match stays as text and keeps its unit out of the ready list until someone resolves it.",
  },
  {
    id: "WORK-RULE-017",
    title: "Recorded status on import",
    area: "first-import",
    prdRequirements: ["R-WORK-SYNC-9"],
    cliForm: ["work.queue.sync"],
    agentForm: agent("first-import"),
    humanMeaning: "Each recorded status in a work file maps to one work store status, and the recorded text is kept.",
  },
  {
    id: "WORK-RULE-018",
    title: "Stable unit identity",
    area: "units",
    prdRequirements: ["R-WORK-QUEUE-1", "R-WORK-QUEUE-2"],
    cliForm: ALL_OPERATIONS,
    agentForm: agent("units"),
    humanMeaning: "People use the coordinate. The store ID keeps the unit the same when the coordinate changes.",
  },
  {
    id: "WORK-RULE-019",
    title: "Quick items",
    area: "quick-items",
    prdRequirements: ["R-WORK-QUEUE-3", "R-WORK-QUEUE-18"],
    cliForm: ["work.queue.add", "work.queue.next", "work.queue.claim", "work.queue.close", "work.queue.export"],
    agentForm: agent("quick-items"),
    humanMeaning: "A small request can become a task-level unit without a design, plan, or PRD. It lives only in the work store, gets the next plain number, such as task 7, and keeps that number for good.",
  },
  {
    id: "WORK-RULE-020",
    title: "Readiness",
    area: "readiness",
    prdRequirements: ["R-WORK-QUEUE-4", "R-WORK-QUEUE-14"],
    cliForm: ["work.queue.next"],
    agentForm: agent("readiness"),
    humanMeaning: "A unit is ready when everything it needs closed as done or superseded, every gate is met, nobody holds or held it on an expired claim, nothing blocks it, its file has no conflict, and every parent is open.",
  },
  {
    id: "WORK-RULE-021",
    title: "Ready order and wait reasons",
    area: "readiness",
    prdRequirements: ["R-WORK-QUEUE-5"],
    cliForm: ["work.queue.next"],
    agentForm: agent("readiness"),
    humanMeaning: "Ready units come in dependency order, then coordinate order, and every open unit that waits says why.",
  },
  {
    id: "WORK-RULE-022",
    title: "One live claim",
    area: "claims",
    prdRequirements: ["R-WORK-QUEUE-6", "R-WORK-QUEUE-14"],
    cliForm: ["work.queue.claim"],
    agentForm: agent("claims"),
    humanMeaning: "Only one claimant can hold a unit, its parents, or its children at a time.",
  },
  {
    id: "WORK-RULE-023",
    title: "Renewal, expiry, and takeover",
    area: "claims",
    prdRequirements: ["R-WORK-QUEUE-7"],
    cliForm: ["work.queue.claim"],
    agentForm: agent("claims"),
    humanMeaning: "A claim lasts while its holder keeps checking in. Another claimant can take an expired claim only after checking the old task handle.",
  },
  {
    id: "WORK-RULE-024",
    title: "Only the holder reports",
    area: "report-and-close",
    prdRequirements: ["R-WORK-QUEUE-8"],
    cliForm: ["work.queue.report"],
    agentForm: agent("report-and-close"),
    humanMeaning: "A claimed unit changes only through its holder. Anyone can change a unit that nobody holds.",
  },
  {
    id: "WORK-RULE-025",
    title: "Close outcomes",
    area: "report-and-close",
    prdRequirements: ["R-WORK-QUEUE-9"],
    cliForm: ["work.queue.close"],
    agentForm: agent("report-and-close"),
    humanMeaning: "A unit closes as done, cancelled, or superseded. Closing every task does not close the phase.",
  },
  {
    id: "WORK-RULE-026",
    title: "Release",
    area: "claims",
    prdRequirements: ["R-WORK-QUEUE-10"],
    cliForm: ["work.queue.release"],
    agentForm: agent("claims"),
    humanMeaning: "A claimant can let go of a unit without closing it.",
  },
  {
    id: "WORK-RULE-027",
    title: "Two forms, one answer",
    area: "readiness",
    prdRequirements: ["R-WORK-QUEUE-11"],
    cliForm: ["work.queue.next", "work.queue.claim", "work.queue.report", "work.queue.close"],
    agentForm: agent("readiness"),
    humanMeaning: "An agent without the CLI reaches the same answer as the CLI.",
  },
  {
    id: "WORK-RULE-028",
    title: "Tracker connection declaration",
    area: "tracker-connections",
    prdRequirements: ["R-WORK-TRACKER-1"],
    cliForm: ["work.queue.status"],
    agentForm: agent("tracker-connections"),
    humanMeaning: "A connection says which work operations it supports and how Make Docs fields map to the tracker's fields.",
  },
  {
    id: "WORK-RULE-029",
    title: "Field map holds no secrets",
    area: "tracker-connections",
    prdRequirements: ["R-WORK-TRACKER-2"],
    cliForm: ["work.queue.status"],
    agentForm: agent("tracker-connections"),
    humanMeaning: "The committed field map names fields only.",
  },
  {
    id: "WORK-RULE-030",
    title: "Local store is the only current connection",
    area: "tracker-connections",
    prdRequirements: ["R-WORK-TRACKER-3"],
    cliForm: ["work.queue.status"],
    agentForm: agent("tracker-connections"),
    humanMeaning: "Today work lives in the local work store. Other trackers need their own accepted authority.",
  },
  {
    id: "WORK-RULE-031",
    title: "Dependency bullet matching",
    area: "first-import",
    prdRequirements: ["R-WORK-SYNC-13"],
    cliForm: ["work.queue.sync", "work.queue.next"],
    agentForm: agent("first-import"),
    humanMeaning: "A bullet that names coordinates becomes dependencies. A bullet that names none, such as an owner approval, becomes a gate that a person marks as met.",
  },
  {
    id: "WORK-RULE-032",
    title: "Ancestors gate readiness",
    area: "readiness",
    prdRequirements: ["R-WORK-QUEUE-15"],
    cliForm: ["work.queue.next", "work.queue.claim"],
    agentForm: agent("readiness"),
    humanMeaning: "A task in Stage 2 is not ready while Stage 2 still waits for Stage 1.",
  },
  {
    id: "WORK-RULE-033",
    title: "Draft and unknown status wait",
    area: "readiness",
    prdRequirements: ["R-WORK-QUEUE-16"],
    cliForm: ["work.queue.next", "work.queue.claim"],
    agentForm: agent("readiness"),
    humanMeaning: "Work that nobody has approved, or whose status Make Docs cannot read, is never handed to an agent.",
  },
  {
    id: "WORK-RULE-034",
    title: "Claims need a ready unit",
    area: "claims",
    prdRequirements: ["R-WORK-QUEUE-17"],
    cliForm: ["work.queue.claim"],
    agentForm: agent("claims"),
    humanMeaning: "Nobody can claim work that is not ready. The one exception is a takeover of an expired claim after a handle check.",
  },
  {
    id: "WORK-RULE-035",
    title: "Missing store work is a conflict",
    area: "sync",
    prdRequirements: ["R-WORK-SYNC-12"],
    cliForm: ["work.queue.sync"],
    agentForm: agent("sync"),
    humanMeaning: "When the store loses work that a file still holds, a person decides. Make Docs never deletes a shared file on its own.",
  },
  {
    id: "WORK-RULE-036",
    title: "An accepted deletion stays settled",
    area: "sync",
    prdRequirements: ["R-WORK-SYNC-11"],
    cliForm: ["work.queue.sync"],
    agentForm: agent("sync"),
    humanMeaning: "After a person accepts a deletion, no checkout asks again or brings the file back.",
  },
  {
    id: "WORK-RULE-037",
    title: "Project and checkout scope",
    area: "authority",
    prdRequirements: ["R-WORK-STORE-11"],
    cliForm: ALL_OPERATIONS,
    agentForm: agent("authority"),
    humanMeaning: "Work belongs to the project and is shared by its checkouts. Each checkout keeps its own record of what it last wrote, so two worktrees do not fight.",
  },
  {
    id: "WORK-RULE-038",
    title: "Quick items by project URI",
    area: "project-uris",
    prdRequirements: ["R-WORK-URI-1", "R-WORK-URI-2", "R-WORK-URI-4", "R-WORK-URI-5", "R-WORK-URI-6", "R-WORK-URI-7"],
    cliForm: [WORK_STORE_RESOURCE_READ_OPERATION, "work.queue.export"],
    agentForm: agent("project-uris"),
    humanMeaning: "`make-docs://project/make-docs/tasks/` lists that project's quick items, and `.../tasks/7` shows one. The URI always names the project, so it gives the same answer from any folder. Reading changes nothing, and a system-resource read never touches the Store.",
  },
  {
    id: "WORK-RULE-039",
    title: "Backlog by project URI",
    area: "project-uris",
    prdRequirements: ["R-WORK-URI-1", "R-WORK-URI-3", "R-WORK-URI-4", "R-WORK-URI-5", "R-WORK-URI-6"],
    cliForm: [WORK_STORE_RESOURCE_READ_OPERATION],
    agentForm: agent("project-uris"),
    humanMeaning: "`make-docs://project/make-docs/backlog/W29/R0/` lists the phases of W29 R0, and `.../P1/T3` shows one task with why it waits. Any letter case works, and the answer names the exact form.",
  },
  {
    id: "WORK-RULE-040",
    title: "Old phases with every task checked",
    area: "readiness",
    prdRequirements: ["R-WORK-QUEUE-20"],
    cliForm: ["work.queue.next", "work.queue.claim", "work.queue.status"],
    agentForm: agent("readiness"),
    humanMeaning: "A status line decides when a phase has one. A phase with no status line whose tasks are all checked counts as done, and work next says so (doneBy: all-tasks-checked). A phase with no task, or with an unchecked task, keeps its status.",
  },
  // W29 R0 P5 T9: the sync rules that W29 R0 P3 and P4 added to PRD 52, so each has a catalog entry and a parity fixture.
  {
    id: "WORK-RULE-041",
    title: "Same work on both sides",
    area: "sync",
    prdRequirements: ["R-WORK-SYNC-14"],
    cliForm: ["work.queue.sync"],
    agentForm: agent("sync"),
    humanMeaning: "When the file already holds exactly what the store would write, nothing can be lost, so there is no conflict. This also settles a recorded conflict.",
  },
  {
    id: "WORK-RULE-042",
    title: "A move keeps its units",
    area: "sync",
    prdRequirements: ["R-WORK-SYNC-15"],
    cliForm: ["work.queue.sync"],
    agentForm: agent("sync"),
    humanMeaning: "A work file that moves to another backlog folder, such as the archive, with the same coordinate keeps its units. It is not a deleted file.",
  },
  {
    id: "WORK-RULE-043",
    title: "A unit that leaves its file",
    area: "sync",
    prdRequirements: ["R-WORK-SYNC-16"],
    cliForm: ["work.queue.sync"],
    agentForm: agent("sync"),
    humanMeaning: "When a person removes a unit from its file, the store deletes it and names it, but only when it has no claim and the store holds nothing about it that the file cannot show. Otherwise the file stops as a conflict.",
  },
  {
    id: "WORK-RULE-044",
    title: "A file edit never acts for a claim",
    area: "sync",
    prdRequirements: ["R-WORK-SYNC-12", "R-WORK-SYNC-16"],
    cliForm: ["work.queue.sync", "work.queue.release"],
    agentForm: agent("sync"),
    humanMeaning: "A file edit that closes or removes a claimed unit stops that file as a claimed conflict. The choices are to release each claim, or to keep the store. Keeping the file is never offered.",
  },
  {
    id: "WORK-RULE-045",
    title: "Sync hold list",
    area: "sync",
    prdRequirements: ["R-WORK-SYNC-17"],
    cliForm: ["work.queue.sync", "work.queue.status", "work.queue.export"],
    agentForm: agent("sync"),
    humanMeaning: "A work path on the hold list is read, never written or removed, and every result names it.",
  },
  {
    id: "WORK-RULE-046",
    title: "Settle one conflict",
    area: "sync",
    prdRequirements: ["R-WORK-SYNC-18"],
    cliForm: ["work.queue.sync"],
    agentForm: agent("sync"),
    humanMeaning: "A person settles one file's conflict with one of its own choices. A choice that the conflict does not offer, a stale revision, or a changed file is refused with nothing changed.",
  },
  {
    id: "WORK-RULE-047",
    title: "The first sync of a checkout only imports",
    area: "first-import",
    prdRequirements: ["R-WORK-SYNC-9"],
    cliForm: ["work.queue.sync"],
    agentForm: agent("first-import"),
    humanMeaning: "The first sync of a checkout writes and removes no file. It says what the next sync will write or remove.",
  },
  {
    id: "WORK-RULE-048",
    title: "A changed copy with copies off",
    area: "repo-copy",
    prdRequirements: ["R-WORK-STORE-10"],
    cliForm: ["work.queue.sync"],
    agentForm: agent("repo-copy"),
    humanMeaning: "With copies off, a copy that a person changed is imported and kept in that sync, and a later sync removes it. A copy that a person deleted loses its ledger entry.",
  },
  {
    id: "WORK-RULE-049",
    title: "A bullet with the unit's own title",
    area: "first-import",
    prdRequirements: ["R-WORK-SYNC-13"],
    cliForm: ["work.queue.sync", "work.queue.next"],
    agentForm: agent("first-import"),
    humanMeaning: "\"Phase 1 trace and scope.\" for a phase titled \"Phase 1: Trace and Scope\" is a dependency, because the words only name the unit.",
  },
  {
    id: "WORK-RULE-050",
    title: "A claim ID is private",
    area: "claims",
    prdRequirements: ["R-WORK-QUEUE-19"],
    cliForm: ["work.queue.claim", "work.queue.next", "work.queue.status", "work.queue.sync"],
    agentForm: agent("claims"),
    humanMeaning: "A claim ID works like a private key. Only the result of a new claim shows it. Every caller sees the claimant, the task handle, and the claim times.",
  },
  {
    id: "WORK-RULE-051",
    title: "Progress notes and store-only edits",
    area: "report-and-close",
    prdRequirements: ["R-WORK-QUEUE-8"],
    cliForm: ["work.queue.report"],
    agentForm: agent("report-and-close"),
    humanMeaning: "A report keeps one short progress note per unit. Edits that the file cannot show stay in the store, and the report names each one.",
  },
  {
    id: "WORK-RULE-052",
    title: "Read-only operations check sync",
    area: "sync",
    prdRequirements: ["R-WORK-SYNC-8"],
    cliForm: ["work.queue.status", "work.queue.next"],
    agentForm: agent("sync"),
    humanMeaning: "Status and next change nothing. They say what the next sync would import, write, or remove, and which files wait for a person.",
  },
  {
    id: "WORK-RULE-053",
    title: "Without a Store or the CLI",
    area: "authority",
    prdRequirements: ["R-WORK-STORE-2", "R-WORK-STORE-6", "R-WORK-URI-6"],
    cliForm: ["work.queue.next", "work.queue.status", WORK_STORE_RESOURCE_READ_OPERATION],
    agentForm: agent("authority"),
    humanMeaning: "Without a usable Store, the docs/work files are the authority. Work next and project URI reads point to them, and an agent reads them directly with these rules.",
  },
  {
    id: "WORK-RULE-054",
    title: "Export to a folder the caller names",
    area: "repo-copy",
    prdRequirements: ["R-WORK-STORE-10", "R-WORK-STORE-13"],
    cliForm: ["work.queue.export"],
    agentForm: agent("repo-copy"),
    humanMeaning: "Export writes only to a new or empty folder or a new file that the caller names, never into the work folders. A complete export gives a work digest.",
  },
]);

/** The three-way sync table (R-WORK-SYNC-1 to R-WORK-SYNC-12). */
export interface WorkSyncTableRow {
  file: WorkSyncFileState;
  store: WorkSyncStoreState | "any";
  projection: "on" | "off" | "any";
  decision: WorkSyncDecision;
  conflictKind: WorkConflictKind | null;
  humanMeaning: string;
}

type Projection = WorkSyncTableRow["projection"];

const conflict = (
  file: WorkSyncFileState,
  store: WorkSyncStoreState | "any",
  projection: Projection,
  conflictKind: WorkConflictKind,
  humanMeaning: string,
): WorkSyncTableRow => ({ file, store, projection, decision: "conflict", conflictKind, humanMeaning });

const row = (
  file: WorkSyncFileState,
  store: WorkSyncStoreState | "any",
  projection: Projection,
  decision: Exclude<WorkSyncDecision, "conflict">,
  humanMeaning: string,
): WorkSyncTableRow => ({ file, store, projection, decision, conflictKind: null, humanMeaning });

const UNCLEAR = "Make Docs cannot tell which side changed this work. A person decides.";
const ACCEPTED = "A person accepted the deletion of this file. Nothing to do.";
/**
 * Owner decision 2026-11-23 (W29 R0 P4 T20, PRD 38 sync ledger row): with
 * copies off, a copy that a person deleted loses its ledger entry, so copies
 * on again write the file with no conflict.
 */
const COPY_GONE_OFF =
  "Copies are off, and the copy is gone. Make Docs removes this checkout's ledger entry, so when copies go on again it writes the file with no conflict.";

/**
 * Sync states are compared per checkout. File states compare the file with
 * this checkout's ledger entry. Store states compare the record with the
 * revision in that entry, and `removed` means a person accepted the file's
 * deletion in any checkout. A state that normal sync cannot produce is an
 * `unclear` conflict, so a person decides.
 */
export const WORK_SYNC_TABLE: readonly WorkSyncTableRow[] = Object.freeze([
  row("unreadable", "any", "any", "report-unreadable", "Make Docs cannot read the file. It reports the first failing line and leaves the file alone."),
  row("unchanged", "unchanged", "on", "none", "Both sides match. Nothing to do."),
  row("unchanged", "unchanged", "off", "remove-copy", "Copies are off, and nobody changed this copy, so Make Docs removes it."),
  row("unchanged", "changed", "on", "write", "The store changed and the file did not, so Make Docs writes the file."),
  row("unchanged", "changed", "off", "remove-copy", "Copies are off, and nobody changed this copy, so Make Docs removes it."),
  conflict("unchanged", "none", "any", "store-missing", "The store no longer has the work in this file. A person decides whether to import the file again or remove it."),
  conflict("unchanged", "new", "any", "unclear", UNCLEAR),
  row("unchanged", "removed", "any", "remove-copy", "A person accepted this file's deletion, and nobody changed this copy, so Make Docs removes it."),
  row("changed", "unchanged", "any", "import", "A person or a teammate changed the file, so Make Docs imports it."),
  conflict("changed", "changed", "any", "both-changed", "The file and the store both changed. A person decides."),
  conflict("changed", "none", "any", "store-missing", "The file changed, but the store no longer has its work. A person decides."),
  conflict("changed", "new", "any", "unclear", UNCLEAR),
  conflict("changed", "removed", "any", "file-deleted", "A person accepted this file's deletion, but this copy changed. A person decides."),
  row("new", "none", "any", "import", "A new work file appeared, so Make Docs imports it."),
  conflict("new", "new", "any", "unclear", "A new file and new store work use the same path. A person decides."),
  conflict("new", "unchanged", "any", "unclear", UNCLEAR),
  conflict("new", "changed", "any", "unclear", UNCLEAR),
  conflict("new", "removed", "any", "file-deleted", "A person accepted this file's deletion, but the file is back. A person decides."),
  conflict("missing", "unchanged", "on", "file-deleted", "Someone deleted the file. A person decides whether to restore it or accept the deletion."),
  conflict("missing", "changed", "on", "file-deleted", "Someone deleted the file, and the store changed. A person decides."),
  row("missing", "unchanged", "off", "none", COPY_GONE_OFF),
  row("missing", "changed", "off", "none", COPY_GONE_OFF),
  conflict("missing", "new", "any", "unclear", UNCLEAR),
  row("missing", "none", "any", "none", "Neither side has this work. Nothing to do."),
  row("missing", "removed", "any", "none", ACCEPTED),
  row("absent", "new", "on", "write", "The store has new work with no file yet, so Make Docs writes the file."),
  row("absent", "new", "off", "none", "Copies are off, so Make Docs writes no file."),
  row("absent", "none", "any", "none", "Neither side has this work. Nothing to do."),
  conflict("absent", "unchanged", "any", "unclear", UNCLEAR),
  conflict("absent", "changed", "any", "unclear", UNCLEAR),
  row("absent", "removed", "any", "none", ACCEPTED),
]);

export interface WorkSettleOption {
  choice: WorkSettleChoice;
  effect: string;
  command: string;
}

const settle = (choice: WorkSettleChoice, effect: string): WorkSettleOption => ({
  choice,
  effect,
  command: `make-docs work sync --settle <path> --${choice}`,
});

/** The two settle choices for each conflict kind, each with its own words (R-WORK-SYNC-4). */
export const WORK_SETTLE_OPTIONS: Readonly<Record<WorkConflictKind, readonly WorkSettleOption[]>> = Object.freeze({
  "both-changed": [
    settle("keep-file", "Keep the file. Make Docs imports it and replaces the store's version."),
    settle("keep-store", "Keep the store. Make Docs rewrites the file from the store."),
  ],
  "file-deleted": [
    settle("restore", "Restore the file from the store, and keep its work open."),
    settle("accept-deletion", "Accept the deletion. Make Docs closes the file's units as superseded, and every checkout removes its unchanged copy."),
  ],
  "store-missing": [
    settle("reimport", "Import the file's work into the store again."),
    settle("remove-file", "Remove the file. Make Docs removes it only if nobody changed it, and otherwise keeps it and reports it."),
  ],
  unclear: [
    settle("keep-file", "Keep the file. Make Docs imports it and replaces the store's version."),
    settle("keep-store", "Keep the store. Make Docs rewrites the file from the store."),
  ],
  // The other choice of a `claimed` conflict is `make-docs work release` for each claimed unit,
  // which the conflict report names with its unit and revision. `--keep-file` is not offered:
  // an import never acts for a claim holder (owner T18 and finding 9).
  claimed: [
    settle("keep-store", "Keep the store. Make Docs rewrites the file from the store, so the claimed unit stays open for its claim."),
  ],
});

export interface WorkWaitReasonText {
  reason: WorkWaitReason;
  /** `{name}` placeholders are filled from the unit and its related records. */
  template: string;
  nextAction: string;
}

/** The words that `work next` uses for each open unit that waits. */
export const WORK_WAIT_REASON_TEXT: Readonly<Record<WorkWaitReason, WorkWaitReasonText>> = Object.freeze({
  draft: {
    reason: "draft",
    template: "Is a draft, so it is not approved to start.",
    nextAction: "Change its status in {path} to active when it is approved.",
  },
  "status-unknown": {
    reason: "status-unknown",
    template: "Has a status that Make Docs does not know: \"{recorded}\".",
    nextAction: "Change its status in {path} to a known value, such as active or completed.",
  },
  "dependency-open": {
    reason: "dependency-open",
    template: "Waits for {dependency} to close.",
    nextAction: "Finish or close {dependency}.",
  },
  "dependency-cancelled": {
    reason: "dependency-cancelled",
    template: "Needs {dependency}, which was cancelled.",
    nextAction: "Decide whether this unit still makes sense. Change the dependency in {path}, or close this unit with `make-docs work close`.",
  },
  "dependency-unresolved": {
    reason: "dependency-unresolved",
    template: "Names {text}, but no unit has that coordinate.",
    nextAction: "Fix the coordinate in {path}.",
  },
  "gate-open": {
    reason: "gate-open",
    template: "Waits for this condition: \"{text}\".",
    nextAction: "When the condition is true, record it as met with `make-docs work report`.",
  },
  blocked: {
    reason: "blocked",
    template: "Blocked: {text}.",
    nextAction: "Clear the blocker with `make-docs work report`, or remove it from {path}. Clearing the last blocker reopens the unit.",
  },
  claimed: {
    reason: "claimed",
    template: "Claimed by {claimant}. The claim ends at {expiresAt} unless {claimant} renews it.",
    nextAction: "Wait for {claimant} to finish or release it.",
  },
  "claim-expired": {
    reason: "claim-expired",
    template: "Was claimed by {claimant}, but the claim ended at {expiresAt}.",
    nextAction: "Check {claimant}'s task, then take the unit over with `make-docs work claim`, or ask a person to release it with `make-docs work release`.",
  },
  "ancestor-claimed": {
    reason: "ancestor-claimed",
    template: "Part of {ancestor}, which {claimant} has claimed.",
    nextAction: "Wait for {claimant} to finish or release {ancestor}.",
  },
  "ancestor-closed": {
    reason: "ancestor-closed",
    template: "Part of {ancestor}, which is closed.",
    nextAction: "Close this unit as superseded with `make-docs work close`, or reopen {ancestor} by changing its status in {path}.",
  },
  "ancestor-waiting": {
    reason: "ancestor-waiting",
    template: "Part of {ancestor}, which is not ready yet.",
    nextAction: "Run `make-docs work next --level {ancestorKind}` to see why {ancestor} waits.",
  },
  "sync-conflict": {
    reason: "sync-conflict",
    template: "Its file {path} has a sync conflict.",
    nextAction: "Settle the conflict with one of the commands in `make-docs work status`.",
  },
});

/**
 * Claim timing (R-WORK-QUEUE-7). A claimant renews its claim at each check,
 * and checks at least every `checkEverySeconds`. One claim lasts at most
 * `maxTtlSeconds` past its latest renewal. Renewal has no total limit.
 */
export const WORK_CLAIM_POLICY = Object.freeze({
  defaultTtlSeconds: 30 * 60,
  checkEverySeconds: 10 * 60,
  minTtlSeconds: 20 * 60,
  maxTtlSeconds: 24 * 60 * 60,
});

/** A dependency on a unit is met when that unit closed as one of these. */
export const WORK_DEPENDENCY_MET_OUTCOMES: readonly WorkCloseOutcome[] = Object.freeze(["done", "superseded"]);

export interface WorkDependencyPattern {
  name: string;
  description: string;
  examples: readonly string[];
}

/**
 * How a dependency bullet becomes dependencies (R-WORK-SYNC-13). A bare
 * phase resolves inside the bullet's own revision, and a bare stage or task
 * resolves inside the bullet's own phase. A `### Dependencies` section belongs
 * to the stage whose heading it sits under, or to the phase when it sits before
 * the first stage. Status words such as "complete",
 * "accepted", or "unlocked" are ignored. A bullet that is only a file path or
 * code span is a reference. Any other bullet that names no coordinate is a gate.
 */
export const WORK_DEPENDENCY_PATTERNS: readonly WorkDependencyPattern[] = Object.freeze([
  {
    name: "full coordinate",
    description: "A wave, revision, phase, stage, or task coordinate.",
    examples: ["W22 R2 P4", "W29 R0 is complete."],
  },
  {
    name: "phase in this revision",
    description: "P or Phase and a number, resolved in the bullet's revision.",
    examples: ["P2 is complete.", "P1 accepted.", "Phase 2.", "Phases 1 through 4."],
  },
  {
    name: "stage",
    description: "Stage and a number, resolved in the bullet's phase, or in the named phase.",
    examples: ["Stage 1.", "P2 Stage 3 is complete."],
  },
  {
    name: "task in this phase",
    description: "T and a number, resolved in the bullet's phase. Older files use a lower-case t, which means the same task.",
    examples: ["T2", "t2"],
  },
  {
    name: "range and list",
    description: "A range with \"to\", \"through\", or a dash, and lists joined by commas or \"and\".",
    examples: ["P1 to P3 and P5 are complete.", "Stages 1 through 3.", "Stages 1-3.", "Stages 1\u20132.", "Stages 2 and 3 accepted."],
  },
  {
    name: "none",
    description: "A bullet that says there is no dependency, such as \"None\" or \"parallel with\" a unit. It holds nothing.",
    examples: ["None.", "None (parallel with Stage 1)."],
  },
  {
    name: "condition",
    description: "A bullet that names coordinates and also states a condition beyond status words. It is a gate that links those units.",
    examples: ["The owner approved P8 Stage 1 for release."],
  },
  {
    name: "reference",
    description: "A bullet that is only a file path or a code span. It is kept as a link and does not hold the unit.",
    examples: ["`packages/cli/src/cli.ts`"],
  },
  {
    name: "gate",
    description: "A bullet that names no coordinate. It becomes a gate that a person marks as met.",
    examples: ["The owner approves this package.", "Make Docs 2.0.8 ships."],
  },
]);

/**
 * Ready order (R-WORK-QUEUE-5): dependency order first, then coordinate
 * order. Coordinates compare part by part, with numbers compared as numbers,
 * so P10 comes after P2. Quick items come after every coordinate, by number.
 */
export const WORK_READY_ORDER = Object.freeze({
  partOrder: ["W", "R", "P", "S", "T"] as const,
  numbersCompareAsNumbers: true,
  quickItemsLast: true,
});

export interface WorkRecordedStatusMapping {
  recorded: readonly string[];
  status: WorkUnitStatus;
  closeOutcome: WorkCloseOutcome | null;
}

/**
 * How first import and sync map a recorded status to a work store status.
 * Matching ignores case. The recorded text stays on the unit. A value that is
 * not listed maps to `open`, and the unit waits with `status-unknown`.
 */
export const WORK_RECORDED_STATUS_MAP: readonly WorkRecordedStatusMapping[] = Object.freeze([
  { recorded: ["complete", "completed", "closed", "done", "[x]"], status: "closed", closeOutcome: "done" },
  { recorded: ["cancelled", "canceled"], status: "closed", closeOutcome: "cancelled" },
  { recorded: ["superseded"], status: "closed", closeOutcome: "superseded" },
  { recorded: ["blocked"], status: "blocked", closeOutcome: null },
  { recorded: ["in-progress", "in progress"], status: "in-progress", closeOutcome: null },
  { recorded: ["draft", "planned", "proposed"], status: "draft", closeOutcome: null },
  { recorded: ["active", "open", "incomplete", "[ ]"], status: "open", closeOutcome: null },
]);

export const WORK_LOCAL_TRACKER_CONNECTION: WorkTrackerConnection = Object.freeze({
  id: "local",
  title: "Local work store",
  operations: ["next", "claim", "report", "close"],
  fieldMap: {
    unit: "unit",
    status: "status",
    dependencies: "dependencies",
    claim: "claim",
    links: "links",
  },
}) as WorkTrackerConnection;

export interface WorkStoreFieldRegisterEntry {
  /** The start of the matching R-MIN row in PRD 38. */
  rowLabel: string;
  schema: "WorkUnitRecord" | "WorkSyncLedgerEntry" | "WorkSyncConflictRecord" | "WorkClaimRecord" | "WorkConfigBlock";
  /** Each schema field and the phrase that names it in the R-MIN row. */
  fields: Readonly<Record<string, string>>;
}

/** Ties every contract field to its PRD 38 R-MIN row, so drift fails a test. */
export const WORK_STORE_FIELD_REGISTER: readonly WorkStoreFieldRegisterEntry[] = Object.freeze<WorkStoreFieldRegisterEntry[]>([
  {
    rowLabel: "Work store records (schema v8)",
    schema: "WorkUnitRecord",
    fields: {
      projectId: "project ID",
      storeId: "unit store ID",
      kind: "kind",
      coordinate: "coordinate",
      parentStoreId: "parent",
      title: "title and body text",
      body: "title and body text",
      recordedStatus: "recorded status",
      status: "status",
      closeOutcome: "close outcome",
      dependencies: "dependencies",
      unresolvedDependencies: "unresolved dependency text",
      gates: "gates and whether each is met",
      blockers: "blockers",
      links: "links to repo documents",
      sourcePath: "source path",
      copyState: "repo copy state",
      revision: "record revision",
    },
  },
  {
    rowLabel: "Work sync ledger",
    schema: "WorkSyncLedgerEntry",
    fields: {
      checkoutId: "checkout ID",
      targetPath: "target path",
      unitStoreIds: "unit or file identity",
      digestAlgorithm: "last applied digest and algorithm",
      lastAppliedDigest: "last applied digest and algorithm",
      storeRevision: "store revision at that write",
      syncedAt: "sync time",
    },
  },
  {
    rowLabel: "Work sync conflicts",
    schema: "WorkSyncConflictRecord",
    fields: {
      checkoutId: "checkout ID",
      targetPath: "target path",
      kind: "conflict kind",
      fileDigest: "both revisions or digests",
      ledgerDigest: "both revisions or digests",
      storeRevision: "both revisions or digests",
      affectedUnitStoreIds: "affected units",
      detectedAt: "detection time",
    },
  },
  {
    rowLabel: "Work claims",
    schema: "WorkClaimRecord",
    fields: {
      projectId: "project ID",
      claimId: "claim ID",
      unitStoreId: "unit store ID",
      claimant: "claimant",
      taskHandle: "task handle reference",
      claimedAt: "claim time",
      renewedAt: "renewal time",
      expiresAt: "expiry time",
      takeoverObservation: "takeover handle observation",
    },
  },
  {
    rowLabel: "Project config `work` and `factory` blocks",
    schema: "WorkConfigBlock",
    fields: {
      projection: "repo copy setting",
      syncHold: "sync hold list",
      tracker: "tracker map",
    },
  },
]);

export function workStoreRuleCatalogDigest(): string {
  const body = JSON.stringify({
    id: WORK_STORE_RULE_CATALOG_ID,
    version: WORK_STORE_RULE_CATALOG_VERSION,
    rules: WORK_STORE_RULES,
    syncTable: WORK_SYNC_TABLE,
    settleOptions: WORK_SETTLE_OPTIONS,
    waitReasons: WORK_WAIT_REASON_TEXT,
    claimPolicy: WORK_CLAIM_POLICY,
    dependencyMet: WORK_DEPENDENCY_MET_OUTCOMES,
    dependencyPatterns: WORK_DEPENDENCY_PATTERNS,
    readyOrder: WORK_READY_ORDER,
    recordedStatus: WORK_RECORDED_STATUS_MAP,
    resourceRead: WORK_STORE_RESOURCE_READ_OPERATION,
  });
  return `sha256:${createHash("sha256").update(body).digest("hex")}`;
}
