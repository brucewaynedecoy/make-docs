import type { StoreDatabase } from "../../store/database";
import { listFactoryAssignments, listFactoryPlanRevisions, listFactoryWorkflowBindings, readFactoryWorkflowBinding } from "../../store/factory-store";
import type { WorkFactoryUriPath } from "../work/work-store/project-uri";
import { factoryPlanRoundLimit, type FactoryJsonValue } from "./plan";
import { factoryAssignmentView } from "./service";

/**
 * W30 R0 P3 T30 to T32: reads of the approved factory URIs (PRD 53
 * R-FACTORY-66 to R-FACTORY-68, register D-074).
 *
 * The shared project URI reader resolves the project through
 * `project_register` and opens one read-only Store session; this module only
 * renders saved records. It reads no project file, so it never shows the live
 * readiness state, and each read ends with a note to run `factory status` in a
 * checkout. It never shows a grant, a private claim ID, a task handle, file
 * contents, a prompt, or a secret: it reads no grant and no claim, and the
 * saved plan holds none of them (R-FACTORY-24, R-FACTORY-26).
 */

export type FactoryUriData =
  | { family: "factory"; kind: "index"; workflows: Array<{ workflow: string; uri: string; latestRevision: number | null; readyRevision: number | null; savedReadiness: string }> }
  | { family: "factory"; kind: "workflow" | "revision"; workflow: string; revision: { number: number; planDigest: string; configDigest: string; bindingDigest: string; createdAt: string; isReady: boolean; isLatest: boolean; plan: FactoryJsonValue } }
  | { family: "factory"; kind: "revisions"; workflow: string; readyRevision: number | null; revisions: Array<{ number: number; planDigest: string; createdAt: string; isReady: boolean; uri: string }> }
  | {
      family: "factory";
      kind: "assignments";
      assignments: Array<{ unit: string; role: string; partLabel: string; toolId: string; status: string; roundCount: number; roundLimit: number | null; checkedAt: string; planRevision: number; runId: string; workflow: string }>;
    };

export class FactoryUriNotFound extends Error {
  constructor(readonly part: string, message: string) {
    super(message);
    this.name = "FactoryUriNotFound";
  }
}

export function factoryUriLiveNote(projectLabel: string): string {
  return `This read shows saved records only. Run make-docs factory status in a checkout of ${projectLabel} for the live readiness state.`;
}

/** The next step of a factory URI read without a usable Store (R-FACTORY-68). */
export function factoryUriFilesNextStep(project: string): string {
  return `Until the Store is usable, read the .make-docs/factory/ copies in a checkout of project ${project}.`;
}

const TAIL = "Changes nothing.";

export function readFactoryUri(
  db: StoreDatabase,
  input: { projectId: string; projectLabel: string; base: string; canonical: string; path: WorkFactoryUriPath },
): { text: string; data: FactoryUriData } {
  const { projectId, projectLabel, base, path } = input;
  const factoryBase = `${base}factory/`;
  const note = factoryUriLiveNote(projectLabel);
  const workflowUri = (workflow: string) => `${factoryBase}workflows/${workflow}`;
  const end = (lines: string[]) => `${[...lines, "", note, TAIL].join("\n")}\n`;
  if (path.kind === "unlisted") {
    throw new FactoryUriNotFound(path.part, `${input.canonical} is not a factory path. The factory paths are factory/, factory/workflows/<name>, factory/workflows/<name>/revisions/, factory/workflows/<name>/revisions/<n>, and factory/assignments/.`);
  }
  if (path.kind === "index") {
    const workflows = listFactoryWorkflowBindings(db, projectId).map((binding) => ({
      workflow: binding.workflowName,
      uri: workflowUri(binding.workflowName),
      latestRevision: listFactoryPlanRevisions(db, projectId, binding.workflowName).at(-1)?.revision ?? null,
      readyRevision: binding.readyRevision,
      savedReadiness: binding.readiness,
    }));
    const lines = [`# Factory of ${projectLabel}`, "", input.canonical, ""];
    lines.push(workflows.length === 0 ? "Workflows: none saved." : `Workflows (${workflows.length}):`);
    for (const entry of workflows) {
      lines.push(`- ${entry.workflow}: latest revision ${entry.latestRevision ?? "none"}, ready revision ${entry.readyRevision ?? "none"}. ${entry.uri}`);
    }
    lines.push("", `Open assignments: ${factoryBase}assignments/`);
    return { text: end(lines), data: { family: "factory", kind: "index", workflows } };
  }
  if (path.kind === "assignments") {
    const assignments = listFactoryAssignments(db, projectId, { openOnly: true }).map((assignment) => {
      const view = factoryAssignmentView(db, assignment);
      return { unit: view.unit, role: view.role, partLabel: view.partLabel, toolId: view.toolId, status: view.status, roundCount: view.roundCount, roundLimit: view.roundLimit, checkedAt: view.checkedAt, planRevision: view.planRevision, runId: view.runId, workflow: view.workflow };
    });
    const lines = [`# Open factory assignments of ${projectLabel}`, "", input.canonical, ""];
    lines.push(assignments.length === 0 ? "No open assignment." : `Open assignments (${assignments.length}):`);
    for (const row of assignments) {
      lines.push(`- ${row.unit} (${row.role}, part ${row.partLabel}): tool ${row.toolId}, ${row.status}, round ${row.roundCount}${row.roundLimit === null ? "" : ` of ${row.roundLimit}`}, last check ${row.checkedAt}, plan revision ${row.planRevision} of ${row.workflow}, lifecycle run ${row.runId}.`);
    }
    return { text: end(lines), data: { family: "factory", kind: "assignments", assignments } };
  }
  const binding = readFactoryWorkflowBinding(db, projectId, path.workflow);
  if (!binding) throw new FactoryUriNotFound(path.workflow, `Project ${projectLabel} has no saved factory workflow named ${path.workflow}.`);
  const revisions = listFactoryPlanRevisions(db, projectId, path.workflow);
  const latest = revisions.at(-1) ?? null;
  if (path.kind === "revisions") {
    const rows = revisions.map((revision) => ({ number: revision.revision, planDigest: revision.planDigest, createdAt: revision.createdAt, isReady: revision.revision === binding.readyRevision, uri: `${workflowUri(path.workflow)}/revisions/${revision.revision}` }));
    const lines = [`# Plan revisions of workflow ${path.workflow} in ${projectLabel}`, "", input.canonical, ""];
    lines.push(rows.length === 0 ? "Kept revisions: none." : `Kept revisions (${rows.length}):`);
    for (const row of rows) lines.push(`- Revision ${row.number}${row.isReady ? " (ready)" : ""}: digest ${row.planDigest}, saved ${row.createdAt}. ${row.uri}`);
    return { text: end(lines), data: { family: "factory", kind: "revisions", workflow: path.workflow, readyRevision: binding.readyRevision, revisions: rows } };
  }
  const shown = path.kind === "workflow" ? latest : revisions.find((revision) => revision.revision === path.revision) ?? null;
  if (!shown) {
    throw new FactoryUriNotFound(
      path.kind === "revision" ? String(path.revision) : path.workflow,
      path.kind === "revision" ? `Workflow ${path.workflow} of ${projectLabel} keeps no plan revision ${path.revision}.` : `Workflow ${path.workflow} of ${projectLabel} has no saved plan revision.`,
    );
  }
  const plan = JSON.parse(shown.planJson) as FactoryJsonValue;
  const isReady = shown.revision === binding.readyRevision;
  const lines = [
    `# Workflow ${path.workflow} of ${projectLabel}: plan revision ${shown.revision}`,
    "",
    input.canonical,
    "",
    `- Revision: ${shown.revision}${shown.revision === latest?.revision ? " (the latest)" : ""}. ${isReady ? "It is the ready revision." : `It is not the ready revision. The ready revision is ${binding.readyRevision ?? "none"}.`}`,
    `- Plan digest: ${shown.planDigest}`,
    `- Config digest: ${shown.configDigest}`,
    `- Binding digest: ${shown.bindingDigest}`,
    `- Saved: ${shown.createdAt}`,
    `- Round limit: ${factoryPlanRoundLimit(shown.planJson) ?? "none"}`,
    "",
    "```json",
    JSON.stringify(plan, null, 2),
    "```",
  ];
  return {
    text: end(lines),
    data: {
      family: "factory",
      kind: path.kind,
      workflow: path.workflow,
      revision: { number: shown.revision, planDigest: shown.planDigest, configDigest: shown.configDigest, bindingDigest: shown.bindingDigest, createdAt: shown.createdAt, isReady, isLatest: shown.revision === latest?.revision, plan },
    },
  };
}
