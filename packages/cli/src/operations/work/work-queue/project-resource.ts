import { Buffer } from "node:buffer";

import { findWorkUnitByCoordinate, listWorkClaims, listWorkUnits, readWorkStoreAt, resolveWorkProject } from "../../../store/work-store.js";
import type { StoreDatabase } from "../../../store/database.js";
import { WORK_PROJECT_URI_PREFIX, parseWorkProjectUri, type WorkProjectUriTarget } from "../work-store/project-uri.js";
import type { WorkLink, WorkUnitKind, WorkUnitRecord } from "../work-store/schemas.js";
import { renderWorkTasksList } from "./queue.js";
import {
  WorkReadiness,
  compareWorkCoordinates,
  workUnitLabel,
  type WorkDoneBy,
  type WorkVisibleClaim,
  type WorkWaitReasonEntry,
} from "./readiness.js";

/**
 * W29 R0 P4 T10 and T11: reads of `make-docs://project/<project>/` URIs
 * (PRD 52 R-WORK-URI-1 to R-WORK-URI-7).
 *
 * The project is named in full, by project name or project ID, and resolves
 * only through `project_register`. Nothing here reads the current folder, a
 * target path, or a checkout, so a URI gives the same result from any folder.
 * Each read opens one read-only Store session. A system-resource read never
 * reaches this code.
 *
 * Sync conflicts belong to one checkout (R-WORK-STORE-11), and a project URI
 * names no checkout, so readiness here leaves them out and the text says so.
 */

export const WORK_PROJECT_RESOURCE_MEDIA_TYPE = "text/markdown" as const;

/** True when the URI is a project-resource URI, in any letter case of its prefix. */
export function isWorkProjectUri(uri: string): boolean {
  return uri.slice(0, WORK_PROJECT_URI_PREFIX.length).toLowerCase() === WORK_PROJECT_URI_PREFIX;
}

/** A refused or unmatched project URI, with the URI and the part that did not match. */
export class WorkProjectUriError extends Error {
  constructor(
    readonly code: "invalid-resource-uri" | "resource-not-found",
    message: string,
    readonly recovery: string,
    readonly uri: string,
    readonly part: string | null,
  ) {
    super(message);
    this.name = "WorkProjectUriError";
  }
}

export interface WorkProjectReadiness {
  /** `closed` and `done` units have no wait reasons. `done` is the all-tasks-checked fallback. */
  state: "ready" | "waiting" | "closed" | "done";
  doneBy: WorkDoneBy | null;
  reasons: WorkWaitReasonEntry[];
}

export interface WorkProjectUnitView {
  uri: string;
  storeId: string;
  coordinate: string;
  label: string;
  kind: WorkUnitKind;
  title: string;
  status: WorkUnitRecord["status"];
  recordedStatus: string | null;
  closeOutcome: WorkUnitRecord["closeOutcome"];
  sourcePath: string | null;
  archived: boolean;
  revision: number;
  readiness: WorkProjectReadiness;
  /** The claim as any caller may see it. It never holds the claim ID (R-WORK-QUEUE-19). */
  claim: WorkVisibleClaim | null;
  links: WorkLink[];
  /** The coordinate of the parent unit, so a phase's task list names each task's stage. */
  parentCoordinate: string | null;
}

export interface WorkQuickItemView {
  uri: string;
  storeId: string;
  number: string;
  label: string;
  title: string;
  body: string | null;
  status: WorkUnitRecord["status"];
  closeOutcome: WorkUnitRecord["closeOutcome"];
  revision: number;
  claim: WorkVisibleClaim | null;
  links: WorkLink[];
}

export type WorkProjectResourceData =
  | { family: "tasks"; kind: "list"; items: Array<Pick<WorkQuickItemView, "uri" | "number" | "label" | "title" | "status" | "closeOutcome">> }
  | { family: "tasks"; kind: "item"; item: WorkQuickItemView }
  | { family: "backlog"; kind: "list" | "unit"; unit: WorkProjectUnitView | null; children: WorkProjectUnitView[] };

export interface WorkProjectResourceRead {
  schemaVersion: 1;
  kind: "project-resource";
  /** The URI as the caller wrote it. */
  requestedUri: string;
  /** The canonical URI (R-WORK-URI-4). */
  uri: string;
  project: { name: string | null; projectId: string };
  mediaType: typeof WORK_PROJECT_RESOURCE_MEDIA_TYPE;
  byteLength: number;
  text: string;
  content: { encoding: "base64"; data: string };
  data: WorkProjectResourceData;
}

const CONFLICT_NOTE =
  "Sync conflicts belong to one checkout, so this read does not show them. Run make-docs work next in a checkout to see them.";
const READ_ONLY_TAIL = "Changes nothing.";

function notFound(uri: string, part: string, message: string): WorkProjectUriError {
  return new WorkProjectUriError(
    "resource-not-found",
    message,
    "Check the project name and the coordinate. Run make-docs project list to see the projects that the Store knows.",
    uri,
    part,
  );
}

/** The canonical URI of one unit under the read's project part. */
function unitUri(base: string, unit: Pick<WorkUnitRecord, "kind" | "coordinate">): string {
  if (unit.kind === "quick-item") return `${base}tasks/${unit.coordinate}`;
  const parts = unit.coordinate.split(" ");
  const leaf = unit.kind === "stage" || unit.kind === "task";
  return `${base}backlog/${parts.join("/")}${leaf ? "" : "/"}`;
}

function claimText(claim: WorkVisibleClaim | null): string {
  if (!claim) return "none";
  const handle = claim.taskHandle ? ` (task handle ${claim.taskHandle})` : "";
  return claim.live
    ? `held by ${claim.claimant} until ${claim.expiresAt}${handle}`
    : `by ${claim.claimant}, ended at ${claim.expiresAt}${handle}. It keeps the unit waiting until a takeover or a release after a check of its task handle`;
}

function stateText(view: Pick<WorkProjectUnitView, "status" | "closeOutcome" | "recordedStatus">): string {
  const status = view.status === "closed" ? `closed (${view.closeOutcome})` : view.status;
  return view.recordedStatus !== null ? `${status}; the file records "${view.recordedStatus}"` : status;
}

function readinessWord(readiness: WorkProjectReadiness): string {
  return readiness.state === "done" ? "counts as done (doneBy: all-tasks-checked)" : readiness.state;
}

function linkLines(links: readonly WorkLink[]): string[] {
  if (links.length === 0) return ["- Links: none"];
  return ["- Links:", ...links.map((link) => `  - ${link.direction} ${link.kind}: ${link.path}${link.anchor ? `#${link.anchor}` : ""}`)];
}

class ProjectView {
  private readonly readiness: WorkReadiness;
  private readonly children = new Map<string | null, WorkUnitRecord[]>();
  private readonly byId: Map<string, WorkUnitRecord>;

  constructor(
    private readonly base: string,
    readonly units: WorkUnitRecord[],
    claims: ReturnType<typeof listWorkClaims>,
    now: Date,
  ) {
    this.readiness = new WorkReadiness({ now, claimant: null, units, claims, conflicts: [] });
    this.byId = new Map(units.map((unit) => [unit.storeId, unit]));
    for (const unit of units) {
      if (unit.kind === "quick-item") continue;
      this.children.set(unit.parentStoreId, [...(this.children.get(unit.parentStoreId) ?? []), unit]);
    }
    for (const list of this.children.values()) list.sort((left, right) => compareWorkCoordinates(left.coordinate, right.coordinate));
  }

  childrenOf(unit: WorkUnitRecord | null): WorkUnitRecord[] {
    return this.children.get(unit?.storeId ?? null) ?? [];
  }

  /** A phase shows its stages and tasks; any other unit shows its direct children. */
  listFor(unit: WorkUnitRecord | null): WorkUnitRecord[] {
    if (unit?.kind !== "phase") return this.childrenOf(unit);
    const out: WorkUnitRecord[] = [];
    for (const child of this.childrenOf(unit)) {
      out.push(child);
      if (child.kind === "stage") out.push(...this.childrenOf(child));
    }
    return out;
  }

  view(unit: WorkUnitRecord): WorkProjectUnitView {
    const doneBy = this.readiness.doneBy(unit);
    const reasons = this.readiness.reasonsFor(unit, null);
    const state: WorkProjectReadiness["state"] = unit.status === "closed" ? "closed" : doneBy !== null ? "done" : reasons.length === 0 ? "ready" : "waiting";
    const claim = this.readiness.item(unit, null, reasons).claim;
    return {
      uri: unitUri(this.base, unit),
      storeId: unit.storeId,
      coordinate: unit.coordinate,
      label: workUnitLabel(unit),
      kind: unit.kind,
      title: unit.title,
      status: unit.status,
      recordedStatus: unit.recordedStatus,
      closeOutcome: unit.closeOutcome,
      sourcePath: unit.sourcePath,
      archived: this.readiness.isArchived(unit),
      revision: unit.revision,
      readiness: { state, doneBy, reasons },
      claim,
      links: unit.links,
      parentCoordinate: unit.parentStoreId ? this.byId.get(unit.parentStoreId)?.coordinate ?? null : null,
    };
  }

  quick(unit: WorkUnitRecord): WorkQuickItemView {
    return {
      uri: unitUri(this.base, unit),
      storeId: unit.storeId,
      number: unit.coordinate,
      label: workUnitLabel(unit),
      title: unit.title,
      body: unit.body,
      status: unit.status,
      closeOutcome: unit.closeOutcome,
      revision: unit.revision,
      claim: this.readiness.item(unit, null, []).claim,
      links: unit.links,
    };
  }
}

function renderUnit(view: WorkProjectUnitView, children: WorkProjectUnitView[]): string {
  const lines = [`# ${view.label}: ${view.title}`, "", view.uri, ""];
  lines.push(`- Kind: ${view.kind}`);
  lines.push(`- Status: ${stateText(view)}`);
  lines.push(`- Readiness: ${readinessWord(view.readiness)}`);
  for (const reason of view.readiness.reasons) lines.push(`  - ${reason.text} Next: ${reason.nextAction}`);
  lines.push(`- Claim: ${claimText(view.claim)}`);
  lines.push(`- File: ${view.sourcePath ?? "none"}${view.archived ? " (archived)" : ""}`);
  lines.push(...linkLines(view.links));
  lines.push("", ...renderChildren(view.kind, children));
  return lines.join("\n");
}

const CHILD_HEADING: Record<string, string> = {
  root: "Waves",
  wave: "Revisions",
  revision: "Phases",
  phase: "Stages and tasks",
  stage: "Tasks",
};

function renderChildren(kind: WorkUnitKind | "root", children: WorkProjectUnitView[]): string[] {
  const heading = CHILD_HEADING[kind];
  if (!heading) return [];
  if (children.length === 0) return [`${heading}: none.`];
  const lines = [`${heading} (${children.length}):`];
  for (const child of children) {
    const indent = kind === "phase" && child.kind === "task" && child.parentCoordinate !== null && child.parentCoordinate.split(" ").length === 4 ? "  " : "";
    lines.push(`${indent}- ${child.label}: ${child.title} [${stateText({ ...child, recordedStatus: null })}; ${readinessWord(child.readiness)}] ${child.uri}`);
  }
  return lines;
}

function backlogCoordinateMissing(view: ProjectView, coordinate: string): string {
  const parts = coordinate.split(" ");
  for (let length = 1; length <= parts.length; length += 1) {
    const prefix = parts.slice(0, length).join(" ");
    if (!view.units.some((unit) => unit.coordinate === prefix)) return prefix;
  }
  return coordinate;
}

function readTarget(
  db: StoreDatabase,
  projectId: string,
  base: string,
  canonical: string,
  projectLabel: string,
  target: WorkProjectUriTarget,
  now: Date,
): { text: string; data: WorkProjectResourceData } {
  const units = listWorkUnits(db, projectId);
  const view = new ProjectView(base, units, listWorkClaims(db, projectId), now);
  if (target.family === "tasks") {
    if (target.item === null) {
      // One renderer for this read and `work export --quick` (R-WORK-URI-7).
      const text = renderWorkTasksList(projectLabel, units);
      const items = units
        .filter((unit) => unit.kind === "quick-item")
        .sort((left, right) => Number(left.coordinate) - Number(right.coordinate))
        .map((unit) => {
          const item = view.quick(unit);
          return { uri: item.uri, number: item.number, label: item.label, title: item.title, status: item.status, closeOutcome: item.closeOutcome };
        });
      return { text, data: { family: "tasks", kind: "list", items } };
    }
    const unit = units.find((candidate) => candidate.kind === "quick-item" && candidate.coordinate === target.item);
    if (!unit) throw notFound(canonical, target.item, `Project ${projectLabel} has no quick item ${target.item}.`);
    const item = view.quick(unit);
    const lines = [`# ${item.label}: ${item.title}`, "", item.uri, ""];
    lines.push(`- Status: ${item.status === "closed" ? `closed (${item.closeOutcome})` : item.status}`);
    lines.push(`- Claim: ${claimText(item.claim)}`);
    lines.push(...linkLines(item.links));
    lines.push("", item.body ?? "This quick item has no body.");
    return { text: `${lines.join("\n")}\n\n${READ_ONLY_TAIL}\n`, data: { family: "tasks", kind: "item", item } };
  }

  if (target.coordinate === null) {
    const children = view.listFor(null).map((child) => view.view(child));
    const lines = [`# Backlog of ${projectLabel}`, "", canonical, "", ...renderChildren("root", children), "", CONFLICT_NOTE, READ_ONLY_TAIL];
    return { text: `${lines.join("\n")}\n`, data: { family: "backlog", kind: "list", unit: null, children } };
  }
  const unit = findWorkUnitByCoordinate(db, projectId, target.coordinate);
  if (!unit || unit.kind === "quick-item") {
    const missing = backlogCoordinateMissing(view, target.coordinate);
    throw notFound(canonical, missing, `Project ${projectLabel} has no ${missing}.`);
  }
  const children = view.listFor(unit).map((child) => view.view(child));
  const text = `${renderUnit(view.view(unit), children)}\n\n${CONFLICT_NOTE}\n${READ_ONLY_TAIL}\n`;
  return { text, data: { family: "backlog", kind: target.isList ? "list" : "unit", unit: view.view(unit), children } };
}

/**
 * Read one project URI. It parses the URI, opens one read-only Store session
 * at `storeRoot`, resolves the project through `project_register`, and renders
 * the read. An unusable Store throws its existing typed Store error; the
 * caller points it at the `docs/work/` files (R-WORK-URI-6).
 */
export function readWorkProjectResource(uri: string, env: { storeRoot: string; now: Date }): WorkProjectResourceRead {
  const parsed = parseWorkProjectUri(uri);
  if (!parsed.ok) {
    throw new WorkProjectUriError(
      "invalid-resource-uri",
      `${parsed.reason} The URI ${uri} is not a valid project URI.`,
      "Write make-docs://project/<project>/tasks/, .../tasks/<n>, or .../backlog/ with coordinate parts such as W29/R0/P1/T3.",
      uri,
      null,
    );
  }
  return readWorkStoreAt(env.storeRoot, (db) => {
    const project = resolveWorkProject(db, parsed.project);
    if (!project) {
      throw notFound(parsed.canonical, parsed.project.value, `The Store knows no project named ${parsed.project.value}.`);
    }
    const base = `${WORK_PROJECT_URI_PREFIX}${parsed.project.value}/`;
    const label = project.projectName ?? project.projectId;
    const { text, data } = readTarget(db, project.projectId, base, parsed.canonical, label, parsed.target, env.now);
    const bytes = Buffer.from(text, "utf8");
    return {
      schemaVersion: 1,
      kind: "project-resource",
      requestedUri: uri,
      uri: parsed.canonical,
      project: { name: project.projectName, projectId: project.projectId },
      mediaType: WORK_PROJECT_RESOURCE_MEDIA_TYPE,
      byteLength: bytes.byteLength,
      text,
      content: { encoding: "base64", data: bytes.toString("base64") },
      data,
    };
  });
}
