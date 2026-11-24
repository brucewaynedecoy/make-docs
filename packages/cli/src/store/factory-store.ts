import { randomUUID } from "node:crypto";
import { OperationError } from "../operations/types";
import {
  FACTORY_ASSIGNMENT_STATUSES,
  FACTORY_FINAL_STATUSES,
  FACTORY_GRANT_SCOPES,
  FACTORY_HANDLE_MAX,
  FACTORY_MAIN_PART_LABEL,
  FACTORY_PART_LABEL_MAX,
  FACTORY_PROOF_RESULTS,
  FACTORY_READINESS_STATES,
  FACTORY_RESET_ROUNDS_ACTION,
  FACTORY_STATUS_HISTORY_CODES,
  FACTORY_TEST_OUTCOMES,
  FACTORY_TOOL_KINDS,
  FACTORY_TOOL_STATES,
  FACTORY_WAKE_METHODS,
  appendFactoryStatusHistory,
  factoryFieldProblemCode,
  factoryFreeTextProblem,
  factoryHandleProblem,
  factoryStatusMoveRefusal,
  describeFactoryFieldProblem,
  isFactoryName,
  isFinalAssignmentStatus,
  nextFactoryRoundCount,
  factoryStatusBeforeLatest,
  unknownFactoryCapabilities,
  type FactoryAssignmentStatus,
  type FactoryFieldProblemKind,
  type FactoryGrantScope,
  type FactoryProofResult,
  type FactoryReadiness,
  type FactoryRefusalCode,
  type FactoryStatusHistoryCode,
  type FactoryStatusHistoryEntry,
  type FactoryTestOutcome,
  type FactoryToolKind,
  type FactoryToolState,
  type FactoryWakeMethod,
} from "../operations/factory/records";
import { factoryCanonicalDigest, factoryCanonicalJson, factoryDigest, factoryPlanRevisionsToKeep, factoryPlanRoundLimit } from "../operations/factory/plan";
import type { StoreDatabase } from "./database";
import { readProjectRegisterRow } from "./project-register";
import { checkWorkUnitWriteClaim } from "./work-store";

/**
 * W30 R0 P2 factory Store service (PRD 53 R-FACTORY-10, R-FACTORY-15,
 * R-FACTORY-23, R-FACTORY-24, R-FACTORY-26 to R-FACTORY-28, R-FACTORY-41,
 * R-FACTORY-44, R-FACTORY-50, R-FACTORY-56 to R-FACTORY-58).
 *
 * This is the only code that reads and writes the schema v9 factory tables
 * (`factory-store-schema.ts`). It takes an open Store connection, as the work
 * store service does; the P3 commands open it with the existing write
 * permission and Store outcomes. Every write that changes a saved record
 * gives the record version it read (`expectedVersion`). A plan revision, a
 * grant, and a backup record are only ever added or removed, never changed.
 * Each write is atomic: inside a caller's transaction it is a savepoint, and
 * alone it is its own transaction.
 *
 * The service enforces the rules that the records own: the never-log check
 * on every field, one open assignment for each job, the status move table and
 * its final states, the round count against the plan revision's round
 * limit, the 20 newest status history entries, grant scopes, and the plan
 * revision keep rule. A claim ID is only checked, never saved or returned
 * (R-FACTORY-50). This phase adds no public operation.
 *
 * Project scoping (owner decision 2026-11-23): every function for a
 * project-scoped table (bindings, plan revisions, grants, assignments, test
 * task results, and backup records) takes the project ID from
 * `project_register` as an explicit argument, and never derives it from a
 * folder, a path, or a name. A missing project ID is refused with
 * `project-not-identified`, and one that `project_register` does not hold
 * with `project-not-registered`; nothing changes. A record of another project
 * is not found. Machine tools and capability proofs belong to the machine and
 * take no project ID.
 */

/** Service refusals besides the contract's reason codes. They follow the work store service. */
export const FACTORY_STORE_SERVICE_REFUSALS = ["version-conflict", "record-not-found", "invalid-record", "project-not-identified", "project-not-registered", "checkout-not-bound"] as const;
export type FactoryStoreRefusal = FactoryRefusalCode | (typeof FACTORY_STORE_SERVICE_REFUSALS)[number];

/** Typed refusal of a factory Store write. Nothing changed. */
export class FactoryStoreRefusalError extends OperationError {
  readonly code = "factory-store-refused";
  constructor(
    readonly refusal: FactoryStoreRefusal,
    readonly reason: string,
    readonly nextAction: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(`${reason} Make Docs refused this factory write, and nothing changed. ${nextAction}`);
    this.name = "FactoryStoreRefusalError";
  }
}

function refuse(refusal: FactoryStoreRefusal, reason: string, nextAction: string, details: Record<string, unknown> = {}): never {
  throw new FactoryStoreRefusalError(refusal, reason, nextAction, details);
}

const RE_READ = "Read the record again, then retry the write with its current version.";
const FIX_FIELD = "Write only IDs, short labels, times, digests, and reason codes. Secrets stay in the tools that own them.";

let savepointCounter = 0;

function atomic<T>(db: StoreDatabase, fn: () => T): T {
  const name = `factory_store_${++savepointCounter}`;
  db.exec(`SAVEPOINT ${name}`);
  try {
    const result = fn();
    db.exec(`RELEASE ${name}`);
    return result;
  } catch (error) {
    try {
      db.exec(`ROLLBACK TO ${name}`);
      db.exec(`RELEASE ${name}`);
    } catch {
      // The savepoint may already be gone.
    }
    throw error;
  }
}

function changes(result: { changes?: number | bigint }): number {
  return Number(result.changes ?? 0);
}

/* ------------------------------------------------------------------------ */
/* Field checks                                                             */
/* ------------------------------------------------------------------------ */

function fieldRefusal(field: string, problem: FactoryFieldProblemKind): never {
  refuse(factoryFieldProblemCode(problem), describeFactoryFieldProblem(field, problem), FIX_FIELD, { field });
}

function checkText(field: string, value: unknown, max?: number): string {
  const problem = factoryFreeTextProblem(value, max);
  if (problem) fieldRefusal(field, problem);
  return value as string;
}

function checkOptionalText(field: string, value: unknown, max?: number): string | null {
  return value === null || value === undefined ? null : checkText(field, value, max);
}

function checkHandle(field: string, value: unknown, max = FACTORY_HANDLE_MAX): string {
  const problem = factoryHandleProblem(value, max);
  if (problem) fieldRefusal(field, problem);
  return value as string;
}

function checkName(field: string, value: unknown, max?: number): string {
  if (!isFactoryName(value, max)) refuse("invalid-record", `The field ${field} is not a lower-case kebab-case name.`, "Use lower-case letters, digits, and single hyphens.", { field });
  return value;
}

function checkOneOf<T extends string>(field: string, value: unknown, allowed: readonly T[]): T {
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    refuse("invalid-record", `The field ${field} is not one of ${allowed.join(", ")}.`, "Use one of the listed values.", { field });
  }
  return value as T;
}

function checkTextList(field: string, value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value) || value.length > maxItems) refuse("invalid-record", `The field ${field} is not a list of at most ${maxItems} lines.`, FIX_FIELD, { field });
  return value.map((item, index) => checkText(`${field}[${index}]`, item));
}

/**
 * The project ID of a project-scoped call: given explicitly, and held by
 * `project_register` (owner decision 2026-11-23). It is never derived from a
 * folder, a path, or a name.
 */
function checkProjectId(db: StoreDatabase, value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    refuse("project-not-identified", "The call names no project ID.", "Give the projectId from project_register, as the project config names it.", { field: "projectId" });
  }
  if (value.length > 160 || !readProjectRegisterRow(db, value)) {
    refuse("project-not-registered", "The project register does not hold that project ID.", "Run make-docs setup in the project, or give the projectId of a registered project.", { field: "projectId" });
  }
  return value;
}

function checkRunId(field: string, value: unknown): string {
  return checkHandle(field, value, 160);
}

function checkTime(field: string, value: Date): string {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) refuse("invalid-record", `The field ${field} is not a valid time.`, "Give a valid time.", { field });
  return value.toISOString();
}

function newStoreId(prefix: "fg-" | "fa-" | "fu-"): string {
  return `${prefix}${randomUUID().replaceAll("-", "")}`;
}

/* ------------------------------------------------------------------------ */
/* Machine tools and capability proofs (T4, T18)                            */
/* ------------------------------------------------------------------------ */

export interface FactoryCapabilityProof {
  capabilityId: string;
  /** How setup proved it, as one short line. */
  method: string;
  /** The tool version that the agent reported when it ran the proof. */
  toolVersion: string | null;
  provedAt: string;
  result: FactoryProofResult;
  /** Each part of the capability that the proof did not test, one short line each. */
  notCovered: string[];
}

export interface FactoryMachineToolInput {
  toolId: string;
  kind: FactoryToolKind;
  label: string;
  state: FactoryToolState;
  reportedVersion: string | null;
  capabilities: string[];
  proofs: Array<Omit<FactoryCapabilityProof, "provedAt"> & { provedAt: Date }>;
}

export interface FactoryMachineToolRecord {
  toolId: string;
  kind: FactoryToolKind;
  label: string;
  state: FactoryToolState;
  reportedVersion: string | null;
  capabilities: string[];
  reportedAt: string;
  proofs: FactoryCapabilityProof[];
  version: number;
}

interface ToolRow {
  tool_id: string;
  tool_kind: FactoryToolKind;
  tool_label: string;
  state: FactoryToolState;
  reported_version: string | null;
  capabilities_json: string;
  reported_at: string;
  entry_version: number | bigint;
}

interface ProofRow {
  capability_id: string;
  method: string;
  tool_version: string | null;
  proved_at: string;
  result: FactoryProofResult;
  not_covered_json: string;
}

function toTool(db: StoreDatabase, row: ToolRow): FactoryMachineToolRecord {
  const proofs = (db.prepare("SELECT * FROM factory_capability_proofs WHERE tool_id = ? ORDER BY capability_id").all(row.tool_id) as unknown as ProofRow[]).map((proof) => ({
    capabilityId: proof.capability_id,
    method: proof.method,
    toolVersion: proof.tool_version,
    provedAt: proof.proved_at,
    result: proof.result,
    notCovered: JSON.parse(proof.not_covered_json) as string[],
  }));
  return {
    toolId: row.tool_id,
    kind: row.tool_kind,
    label: row.tool_label,
    state: row.state,
    reportedVersion: row.reported_version,
    capabilities: JSON.parse(row.capabilities_json) as string[],
    reportedAt: row.reported_at,
    proofs,
    version: Number(row.entry_version),
  };
}

export function readFactoryMachineTool(db: StoreDatabase, toolId: string): FactoryMachineToolRecord | null {
  const row = db.prepare("SELECT * FROM factory_machine_tools WHERE tool_id = ?").get(toolId) as ToolRow | undefined;
  return row ? toTool(db, row) : null;
}

/** The machine's tool list. Every project on the machine reads the same rows (R-FACTORY-15). */
export function listFactoryMachineTools(db: StoreDatabase): FactoryMachineToolRecord[] {
  return (db.prepare("SELECT * FROM factory_machine_tools ORDER BY tool_id").all() as unknown as ToolRow[]).map((row) => toTool(db, row));
}

/**
 * Save one machine tool and replace its proofs in one write (R-FACTORY-10,
 * R-FACTORY-15). `expectedVersion` is null for a new tool, or the record
 * version that the caller read. An unknown capability ID is refused with
 * `unknown-capability` (R-FACTORY-53).
 */
export function saveFactoryMachineTool(
  db: StoreDatabase,
  input: FactoryMachineToolInput,
  options: { expectedVersion: number | null; now?: Date },
): FactoryMachineToolRecord {
  const toolId = checkName("toolId", input.toolId);
  const kind = checkOneOf("kind", input.kind, FACTORY_TOOL_KINDS);
  const label = checkText("label", input.label);
  const state = checkOneOf("state", input.state, FACTORY_TOOL_STATES);
  const reportedVersion = checkOptionalText("reportedVersion", input.reportedVersion, 64);
  if (!Array.isArray(input.capabilities) || input.capabilities.length > 64) refuse("invalid-record", "The field capabilities is not a list of at most 64 capability IDs.", FIX_FIELD, { field: "capabilities" });
  const capabilities = [...new Set(input.capabilities.map((id, index) => checkName(`capabilities[${index}]`, id)))].sort();
  const proofs = (input.proofs ?? []).map((proof, index) => ({
    capabilityId: checkName(`proofs[${index}].capabilityId`, proof.capabilityId),
    method: checkText(`proofs[${index}].method`, proof.method),
    toolVersion: checkOptionalText(`proofs[${index}].toolVersion`, proof.toolVersion, 64),
    provedAt: checkTime(`proofs[${index}].provedAt`, proof.provedAt),
    result: checkOneOf(`proofs[${index}].result`, proof.result, FACTORY_PROOF_RESULTS),
    notCovered: checkTextList(`proofs[${index}].notCovered`, proof.notCovered, 16),
  }));
  const unknown = unknownFactoryCapabilities([...capabilities, ...proofs.map((proof) => proof.capabilityId)]);
  if (unknown.length > 0) {
    refuse("unknown-capability", `The capability IDs ${unknown.join(", ")} are not in the capability catalog.`, "Use a capability ID from make-docs://system/contract/factory-contract.md.", { capabilityIds: unknown });
  }
  if (new Set(proofs.map((proof) => proof.capabilityId)).size !== proofs.length) refuse("invalid-record", "A tool has one proof for each capability.", "Give each capability one proof.");
  const now = (options.now ?? new Date()).toISOString();
  return atomic(db, () => {
    const current = db.prepare("SELECT entry_version FROM factory_machine_tools WHERE tool_id = ?").get(toolId) as { entry_version: number | bigint } | undefined;
    assertVersion(`Machine tool ${toolId}`, current ? Number(current.entry_version) : null, options.expectedVersion);
    const entryVersion = (options.expectedVersion ?? 0) + 1;
    if (current) {
      db.prepare(
        `UPDATE factory_machine_tools SET tool_kind = ?, tool_label = ?, state = ?, reported_version = ?, capabilities_json = ?, reported_at = ?, entry_version = ?
         WHERE tool_id = ? AND entry_version = ?`,
      ).run(kind, label, state, reportedVersion, JSON.stringify(capabilities), now, entryVersion, toolId, options.expectedVersion);
    } else {
      db.prepare(
        `INSERT INTO factory_machine_tools (tool_id, tool_kind, tool_label, state, reported_version, capabilities_json, reported_at, entry_version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(toolId, kind, label, state, reportedVersion, JSON.stringify(capabilities), now, entryVersion);
    }
    db.prepare("DELETE FROM factory_capability_proofs WHERE tool_id = ?").run(toolId);
    const insert = db.prepare(
      `INSERT INTO factory_capability_proofs (tool_id, capability_id, method, tool_version, proved_at, result, not_covered_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const proof of proofs) insert.run(toolId, proof.capabilityId, proof.method, proof.toolVersion, proof.provedAt, proof.result, JSON.stringify(proof.notCovered));
    return readFactoryMachineTool(db, toolId)!;
  });
}

function assertVersion(what: string, current: number | null, expected: number | null): void {
  if (expected === null && current !== null) refuse("version-conflict", `${what} already exists at version ${current}.`, RE_READ, { currentVersion: current });
  if (expected !== null && current === null) refuse("record-not-found", `${what} does not exist.`, RE_READ);
  if (expected !== null && current !== expected) refuse("version-conflict", `${what} is at version ${current}, not ${expected}.`, RE_READ, { currentVersion: current });
}

/* ------------------------------------------------------------------------ */
/* Workflow bindings (T2, T18)                                              */
/* ------------------------------------------------------------------------ */

export interface FactoryWorkflowBindingInput {
  projectId: string;
  workflowName: string;
  /** For each role, the bound tool ID. */
  roles: Record<string, string>;
  worktreeMethod: string;
  /** The human channel account, as a reference that holds no secret. The channel kind and the integration owner live only in config (owner decision 2026-11-23). */
  channelRef: string | null;
  wakeMethod: FactoryWakeMethod;
  wakeRef: string | null;
  knownLosses: string[];
  /** The readiness that the save leaves. A save never makes a workflow `ready` (R-FACTORY-50, R-FACTORY-57). */
  readiness: Exclude<FactoryReadiness, "ready">;
  /**
   * The digest of the plan that the caller resolved from the three live
   * sources with this binding, or null when it resolved none. When it equals
   * the `ready` revision's digest, the workflow stays `ready` (R-FACTORY-12).
   */
  currentPlanDigest: string | null;
}

export interface FactoryWorkflowBindingRecord extends Omit<FactoryWorkflowBindingInput, "readiness" | "currentPlanDigest"> {
  readyRevision: number | null;
  readiness: FactoryReadiness;
  version: number;
}

interface BindingRow {
  project_id: string;
  workflow_name: string;
  roles_json: string;
  worktree_method: string;
  channel_ref: string | null;
  wake_method: FactoryWakeMethod;
  wake_ref: string | null;
  known_losses_json: string;
  ready_revision: number | bigint | null;
  readiness: FactoryReadiness;
  entry_version: number | bigint;
}

function toBinding(row: BindingRow): FactoryWorkflowBindingRecord {
  return {
    projectId: row.project_id,
    workflowName: row.workflow_name,
    roles: JSON.parse(row.roles_json) as Record<string, string>,
    worktreeMethod: row.worktree_method,
    channelRef: row.channel_ref,
    wakeMethod: row.wake_method,
    wakeRef: row.wake_ref,
    knownLosses: JSON.parse(row.known_losses_json) as string[],
    readyRevision: row.ready_revision === null ? null : Number(row.ready_revision),
    readiness: row.readiness,
    version: Number(row.entry_version),
  };
}

function bindingRow(db: StoreDatabase, projectId: string, workflowName: string): BindingRow | undefined {
  return db.prepare("SELECT * FROM factory_workflow_bindings WHERE project_id = ? AND workflow_name = ?").get(projectId, workflowName) as BindingRow | undefined;
}

export function readFactoryWorkflowBinding(db: StoreDatabase, projectId: string, workflowName: string): FactoryWorkflowBindingRecord | null {
  checkProjectId(db, projectId);
  const row = bindingRow(db, projectId, workflowName);
  return row ? toBinding(row) : null;
}

export function listFactoryWorkflowBindings(db: StoreDatabase, projectId: string): FactoryWorkflowBindingRecord[] {
  checkProjectId(db, projectId);
  return (db.prepare("SELECT * FROM factory_workflow_bindings WHERE project_id = ? ORDER BY workflow_name").all(projectId) as unknown as BindingRow[]).map(toBinding);
}

/**
 * Save a workflow's binding (T2, T18). It never sets the `ready` revision
 * and never makes the workflow `ready`: only a passed test task does that,
 * through {@link markFactoryReadyRevision}. A save keeps the `ready`
 * revision. When the plan that the caller resolved has the `ready` revision's
 * digest, the save leaves the workflow `ready`, so a save that changes
 * nothing, or a fix that restores the exact plan, needs no new test task
 * (R-FACTORY-12).
 */
export function saveFactoryWorkflowBinding(
  db: StoreDatabase,
  input: FactoryWorkflowBindingInput,
  options: { expectedVersion: number | null },
): FactoryWorkflowBindingRecord {
  const projectId = checkProjectId(db, input.projectId);
  const workflowName = checkName("workflowName", input.workflowName);
  if (input.readiness === ("ready" as FactoryReadiness)) {
    refuse("proof-missing", "A workflow save never makes a workflow ready.", "Pass a test task under the saved plan revision, then record it with factory proof save.");
  }
  const readiness = checkOneOf("readiness", input.readiness, FACTORY_READINESS_STATES.filter((state) => state !== "ready"));
  if (!input.roles || typeof input.roles !== "object" || Array.isArray(input.roles) || Object.keys(input.roles).length > 32) {
    refuse("invalid-record", "The field roles is not a map of at most 32 roles to tool IDs.", FIX_FIELD, { field: "roles" });
  }
  const roles = Object.fromEntries(Object.entries(input.roles).sort(([left], [right]) => (left < right ? -1 : 1)).map(([role, tool]) => [checkName("roles", role), checkName(`roles.${role}`, tool)]));
  const worktreeMethod = checkName("worktreeMethod", input.worktreeMethod);
  const channelRef = checkOptionalText("channelRef", input.channelRef);
  const wakeMethod = checkOneOf("wakeMethod", input.wakeMethod, FACTORY_WAKE_METHODS);
  const wakeRef = checkOptionalText("wakeRef", input.wakeRef);
  const knownLosses = checkTextList("knownLosses", input.knownLosses, 32);
  return atomic(db, () => {
    const current = bindingRow(db, projectId, workflowName);
    assertVersion(`Workflow ${workflowName}`, current ? Number(current.entry_version) : null, options.expectedVersion);
    const entryVersion = (options.expectedVersion ?? 0) + 1;
    const readyDigest = current?.ready_revision === null || current?.ready_revision === undefined
      ? null
      : (db.prepare("SELECT plan_digest FROM factory_workflow_plans WHERE project_id = ? AND workflow_name = ? AND revision = ?").get(projectId, workflowName, Number(current.ready_revision)) as { plan_digest: string } | undefined)?.plan_digest ?? null;
    const saved: FactoryReadiness = readyDigest !== null && input.currentPlanDigest === readyDigest ? "ready" : readiness;
    const values = [JSON.stringify(roles), worktreeMethod, channelRef, wakeMethod, wakeRef, JSON.stringify(knownLosses), saved, entryVersion];
    if (current) {
      db.prepare(
        `UPDATE factory_workflow_bindings SET roles_json = ?, worktree_method = ?, channel_ref = ?, wake_method = ?, wake_ref = ?,
           known_losses_json = ?, readiness = ?, entry_version = ? WHERE project_id = ? AND workflow_name = ? AND entry_version = ?`,
      ).run(...values, projectId, workflowName, options.expectedVersion);
    } else {
      db.prepare(
        `INSERT INTO factory_workflow_bindings (roles_json, worktree_method, channel_ref, wake_method, wake_ref, known_losses_json, readiness, entry_version,
           project_id, workflow_name, ready_revision) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      ).run(...values, projectId, workflowName);
    }
    return readFactoryWorkflowBinding(db, projectId, workflowName)!;
  });
}

/**
 * Make a saved revision the `ready` revision after a passed test task
 * (R-FACTORY-57). It refuses with `plan-digest-mismatch` a digest that has no
 * kept revision, and with `proof-missing` when the latest passed test task
 * did not run under that digest. The P3 proof save also checks that the
 * digest is the current plan's digest.
 */
export function markFactoryReadyRevision(
  db: StoreDatabase,
  projectId: string,
  workflowName: string,
  planDigest: string,
  options: { expectedVersion: number },
): FactoryWorkflowBindingRecord {
  checkProjectId(db, projectId);
  return atomic(db, () => {
    const current = bindingRow(db, projectId, workflowName);
    assertVersion(`Workflow ${workflowName}`, current ? Number(current.entry_version) : null, options.expectedVersion);
    const revision = findFactoryPlanRevisionByDigest(db, projectId, workflowName, planDigest);
    if (!revision) refuse("plan-digest-mismatch", "No kept plan revision of this workflow has that digest.", "Save the workflow first, then run the test task under its plan revision.");
    const passed = readFactoryProofResult(db, projectId, workflowName, "passed");
    if (!passed || passed.planDigest !== planDigest) {
      refuse("proof-missing", "No passed test task ran under that plan revision.", "Run the test task under that plan revision and record it with factory proof save.");
    }
    db.prepare(
      "UPDATE factory_workflow_bindings SET ready_revision = ?, readiness = 'ready', entry_version = entry_version + 1 WHERE project_id = ? AND workflow_name = ? AND entry_version = ?",
    ).run(revision.revision, projectId, workflowName, options.expectedVersion);
    return readFactoryWorkflowBinding(db, projectId, workflowName)!;
  });
}

/* ------------------------------------------------------------------------ */
/* Plan revisions (T16)                                                     */
/* ------------------------------------------------------------------------ */

export interface FactoryPlanRevisionRecord {
  projectId: string;
  workflowName: string;
  revision: number;
  planDigest: string;
  planJson: string;
  configDigest: string;
  bindingDigest: string;
  createdAt: string;
}

interface PlanRow {
  project_id: string;
  workflow_name: string;
  revision: number | bigint;
  plan_digest: string;
  plan_json: string;
  config_digest: string;
  binding_digest: string;
  created_at: string;
}

function toPlan(row: PlanRow): FactoryPlanRevisionRecord {
  return {
    projectId: row.project_id,
    workflowName: row.workflow_name,
    revision: Number(row.revision),
    planDigest: row.plan_digest,
    planJson: row.plan_json,
    configDigest: row.config_digest,
    bindingDigest: row.binding_digest,
    createdAt: row.created_at,
  };
}

/** The latest (newest saved) revision, or one named revision. */
export function readFactoryPlanRevision(db: StoreDatabase, projectId: string, workflowName: string, revision?: number): FactoryPlanRevisionRecord | null {
  checkProjectId(db, projectId);
  const row = revision === undefined
    ? db.prepare("SELECT * FROM factory_workflow_plans WHERE project_id = ? AND workflow_name = ? ORDER BY revision DESC LIMIT 1").get(projectId, workflowName)
    : db.prepare("SELECT * FROM factory_workflow_plans WHERE project_id = ? AND workflow_name = ? AND revision = ?").get(projectId, workflowName, revision);
  return row ? toPlan(row as unknown as PlanRow) : null;
}

export function findFactoryPlanRevisionByDigest(db: StoreDatabase, projectId: string, workflowName: string, planDigest: string): FactoryPlanRevisionRecord | null {
  checkProjectId(db, projectId);
  const row = db.prepare("SELECT * FROM factory_workflow_plans WHERE project_id = ? AND workflow_name = ? AND plan_digest = ?").get(projectId, workflowName, planDigest);
  return row ? toPlan(row as unknown as PlanRow) : null;
}

/** Every kept revision of a workflow, oldest first. */
export function listFactoryPlanRevisions(db: StoreDatabase, projectId: string, workflowName: string): FactoryPlanRevisionRecord[] {
  checkProjectId(db, projectId);
  return (db.prepare("SELECT * FROM factory_workflow_plans WHERE project_id = ? AND workflow_name = ? ORDER BY revision").all(projectId, workflowName) as unknown as PlanRow[]).map(toPlan);
}

export interface FactoryPlanSaveResult {
  revision: FactoryPlanRevisionRecord;
  /** False when a kept revision already had this digest. */
  created: boolean;
  /** The revision numbers that this save removed under the keep rule. */
  removed: number[];
}

/**
 * Save a resolved plan as a revision (R-FACTORY-56, R-FACTORY-57). The plan
 * is written as canonical JSON and its digest is computed here, so a caller
 * cannot give a digest that does not match the bytes. A new revision is
 * added only when no kept revision has this digest. In the same write, the
 * keep rule removes every revision that is not the `ready` revision, not
 * named by an open assignment, and not one of the 10 newest others. The
 * workflow's binding must exist. This never makes a revision `ready`.
 */
export function saveFactoryPlanRevision(
  db: StoreDatabase,
  input: { projectId: string; workflowName: string; plan: unknown },
  options: { now?: Date } = {},
): FactoryPlanSaveResult {
  const projectId = checkProjectId(db, input.projectId);
  const workflowName = checkName("workflowName", input.workflowName);
  if (!input.plan || typeof input.plan !== "object" || Array.isArray(input.plan)) refuse("invalid-record", "The plan is not a JSON object.", "Give the plan that the plan resolver made.");
  const plan = input.plan as Record<string, unknown>;
  for (const part of ["definition", "binding"] as const) {
    if (!plan[part] || typeof plan[part] !== "object" || Array.isArray(plan[part])) refuse("invalid-record", `The plan has no ${part} object.`, "Give the plan that the plan resolver made.", { field: part });
  }
  let planJson: string;
  let configDigest: string;
  let bindingDigest: string;
  try {
    planJson = factoryCanonicalJson(plan);
    // The digests come from the plan itself, never from the caller.
    configDigest = factoryCanonicalDigest(plan.definition);
    bindingDigest = factoryCanonicalDigest(plan.binding);
  } catch (error) {
    refuse("invalid-record", `The plan cannot be written as canonical JSON: ${(error as Error).message}`, "Give the plan that the plan resolver made.");
  }
  // The never-log check runs on every text value in the plan (R-FACTORY-26, R-FACTORY-59).
  const visit = (node: unknown, at: string, key: string): void => {
    if (typeof node === "string") {
      if (key.endsWith("Digest") && /^[0-9a-f]{64}$/.test(node)) return;
      const problem = factoryFreeTextProblem(node);
      if (problem) fieldRefusal(`plan${at}`, problem);
      return;
    }
    if (Array.isArray(node)) node.forEach((item, index) => visit(item, `${at}[${index}]`, key));
    else if (node && typeof node === "object") for (const [child, value] of Object.entries(node)) visit(value, `${at}.${child}`, child);
  };
  visit(plan, "", "");
  const planDigest = factoryDigest(planJson);
  const createdAt = (options.now ?? new Date()).toISOString();
  return atomic(db, () => {
    if (!bindingRow(db, projectId, workflowName)) refuse("record-not-found", `Workflow ${workflowName} has no saved binding.`, "Save the workflow binding in the same write.");
    const existing = findFactoryPlanRevisionByDigest(db, projectId, workflowName, planDigest);
    let revision: FactoryPlanRevisionRecord;
    let created = false;
    if (existing) {
      revision = existing;
    } else {
      const newest = db.prepare("SELECT max(revision) AS n FROM factory_workflow_plans WHERE project_id = ? AND workflow_name = ?").get(projectId, workflowName) as { n: number | bigint | null };
      const number = Number(newest.n ?? 0) + 1;
      db.prepare(
        `INSERT INTO factory_workflow_plans (project_id, workflow_name, revision, plan_digest, plan_json, config_digest, binding_digest, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(projectId, workflowName, number, planDigest, planJson, configDigest, bindingDigest, createdAt);
      revision = readFactoryPlanRevision(db, projectId, workflowName, number)!;
      created = true;
    }
    const removed = pruneFactoryPlanRevisions(db, projectId, workflowName);
    return { revision, created, removed };
  });
}

/** Apply the keep rule to one workflow's revisions and return the removed revision numbers. */
function pruneFactoryPlanRevisions(db: StoreDatabase, projectId: string, workflowName: string): number[] {
  const revisions = (db.prepare("SELECT revision FROM factory_workflow_plans WHERE project_id = ? AND workflow_name = ?").all(projectId, workflowName) as Array<{ revision: number | bigint }>).map((row) => Number(row.revision));
  const binding = bindingRow(db, projectId, workflowName);
  const ready = binding?.ready_revision === null || binding?.ready_revision === undefined ? null : Number(binding.ready_revision);
  const open = (db.prepare(
    `SELECT DISTINCT plan_revision FROM factory_assignments WHERE project_id = ? AND workflow_name = ? AND status NOT IN (${FACTORY_FINAL_STATUSES.map(() => "?").join(",")})`,
  ).all(projectId, workflowName, ...FACTORY_FINAL_STATUSES) as Array<{ plan_revision: number | bigint }>).map((row) => Number(row.plan_revision));
  const keep = factoryPlanRevisionsToKeep(revisions, ready, open);
  const removed = revisions.filter((revision) => !keep.has(revision)).sort((left, right) => left - right);
  const remove = db.prepare("DELETE FROM factory_workflow_plans WHERE project_id = ? AND workflow_name = ? AND revision = ?");
  for (const revision of removed) remove.run(projectId, workflowName, revision);
  return removed;
}

/* ------------------------------------------------------------------------ */
/* Grants (T19)                                                             */
/* ------------------------------------------------------------------------ */

export interface FactoryGrantInput {
  projectId: string;
  workflowName: string;
  action: string;
  scope: FactoryGrantScope;
  /** The lifecycle run of a `run` grant, and null for any other scope. */
  runId: string | null;
  expiresAt: Date | null;
  grantedBy: string;
}

export interface FactoryGrantRecord {
  grantId: string;
  projectId: string;
  workflowName: string;
  action: string;
  scope: FactoryGrantScope;
  runId: string | null;
  expiresAt: string | null;
  spentAt: string | null;
  grantedBy: string;
  grantedAt: string;
  version: number;
}

interface GrantRow {
  grant_id: string;
  project_id: string;
  workflow_name: string;
  action: string;
  scope: FactoryGrantScope;
  run_id: string | null;
  expires_at: string | null;
  spent_at: string | null;
  granted_by: string;
  granted_at: string;
  entry_version: number | bigint;
}

function toGrant(row: GrantRow): FactoryGrantRecord {
  return {
    grantId: row.grant_id,
    projectId: row.project_id,
    workflowName: row.workflow_name,
    action: row.action,
    scope: row.scope,
    runId: row.run_id,
    expiresAt: row.expires_at,
    spentAt: row.spent_at,
    grantedBy: row.granted_by,
    grantedAt: row.granted_at,
    version: Number(row.entry_version),
  };
}

export function listFactoryGrants(db: StoreDatabase, projectId: string, workflowName: string): FactoryGrantRecord[] {
  checkProjectId(db, projectId);
  return (db.prepare("SELECT * FROM factory_grants WHERE project_id = ? AND workflow_name = ? ORDER BY granted_at, grant_id").all(projectId, workflowName) as unknown as GrantRow[]).map(toGrant);
}

/**
 * Write one grant (R-FACTORY-24). A grant-only save calls only this: it
 * resolves no plan, saves no revision, and does not change readiness. A
 * `run` grant names its lifecycle run; no other scope does.
 */
export function saveFactoryGrant(db: StoreDatabase, input: FactoryGrantInput, options: { now?: Date } = {}): FactoryGrantRecord {
  const projectId = checkProjectId(db, input.projectId);
  const workflowName = checkName("workflowName", input.workflowName);
  const action = checkName("action", input.action);
  const scope = checkOneOf("scope", input.scope, FACTORY_GRANT_SCOPES);
  const runId = input.runId === null ? null : checkRunId("runId", input.runId);
  if ((scope === "run") !== (runId !== null)) refuse("invalid-record", "A run grant names its lifecycle run, and no other grant names one.", "Give a run ID only for a run grant.", { field: "runId" });
  const grantedBy = checkText("grantedBy", input.grantedBy);
  const now = options.now ?? new Date();
  const expiresAt = input.expiresAt === null ? null : checkTime("expiresAt", input.expiresAt);
  if (expiresAt !== null && expiresAt <= now.toISOString()) refuse("invalid-record", "The expiry time is not after the grant time.", "Give an expiry time in the future.", { field: "expiresAt" });
  return atomic(db, () => {
    if (!bindingRow(db, projectId, workflowName)) refuse("record-not-found", `Workflow ${workflowName} has no saved binding.`, "Save the workflow before its grants.");
    const grantId = newStoreId("fg-");
    db.prepare(
      `INSERT INTO factory_grants (grant_id, project_id, workflow_name, action, scope, run_id, expires_at, spent_at, granted_by, granted_at, entry_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, 1)`,
    ).run(grantId, projectId, workflowName, action, scope, runId, expiresAt, grantedBy, now.toISOString());
    return toGrant(db.prepare("SELECT * FROM factory_grants WHERE grant_id = ?").get(grantId) as unknown as GrantRow);
  });
}

/** Revoke one grant of a project. The row is removed (R-FACTORY-24: retain until the person revokes it). Its use rows stay (R-FACTORY-72). */
export function revokeFactoryGrant(db: StoreDatabase, projectId: string, grantId: string, options: { expectedVersion: number }): void {
  checkProjectId(db, projectId);
  atomic(db, () => {
    const row = db.prepare("SELECT entry_version FROM factory_grants WHERE grant_id = ? AND project_id = ?").get(grantId, projectId) as { entry_version: number | bigint } | undefined;
    assertVersion(`Grant ${grantId}`, row ? Number(row.entry_version) : null, options.expectedVersion);
    db.prepare("DELETE FROM factory_grants WHERE grant_id = ? AND entry_version = ?").run(grantId, options.expectedVersion);
  });
}

/** One recorded use of a grant (R-FACTORY-72). It holds enough of the grant to be read after a revoke. */
export interface FactoryGrantUseRecord {
  useId: string;
  projectId: string;
  workflowName: string;
  grantId: string;
  action: string;
  scope: FactoryGrantScope;
  unitStoreId: string;
  runId: string;
  usedAt: string;
}

interface GrantUseRow {
  use_id: string;
  project_id: string;
  workflow_name: string;
  grant_id: string;
  action: string;
  scope: FactoryGrantScope;
  unit_store_id: string;
  run_id: string;
  used_at: string;
}

function toGrantUse(row: GrantUseRow): FactoryGrantUseRecord {
  return { useId: row.use_id, projectId: row.project_id, workflowName: row.workflow_name, grantId: row.grant_id, action: row.action, scope: row.scope, unitStoreId: row.unit_store_id, runId: row.run_id, usedAt: row.used_at };
}

/** Every recorded grant use of one workflow, oldest first, also of a grant that was revoked. */
export function listFactoryGrantUses(db: StoreDatabase, projectId: string, workflowName: string): FactoryGrantUseRecord[] {
  checkProjectId(db, projectId);
  return (db.prepare("SELECT * FROM factory_grant_uses WHERE project_id = ? AND workflow_name = ? ORDER BY used_at, rowid").all(projectId, workflowName) as unknown as GrantUseRow[]).map(toGrantUse);
}

type GrantUseRefusal = Extract<FactoryRefusalCode, "grant-missing" | "grant-out-of-scope" | "grant-spent" | "grant-expired">;

/** A lifecycle run has ended when its status is final. */
function lifecycleRunEnded(db: StoreDatabase, projectId: string, runId: string): boolean {
  const run = db.prepare("SELECT status FROM runs WHERE project_id = ? AND run_id = ?").get(projectId, runId) as { status: string } | undefined;
  return run !== undefined && (run.status === "completed" || run.status === "failed" || run.status === "abandoned");
}

/** Why one grant cannot be used now for a run, or null when it can. A `run` grant holds until its run ends. */
function grantUseRefusal(db: StoreDatabase, grant: GrantRow, runId: string | null, now: string): GrantUseRefusal | null {
  if (grant.expires_at !== null && grant.expires_at <= now) return "grant-expired";
  if (grant.scope === "once" && grant.spent_at !== null) return "grant-spent";
  if (grant.scope === "run" && (grant.run_id !== runId || lifecycleRunEnded(db, grant.project_id, grant.run_id!))) return "grant-out-of-scope";
  return null;
}

/**
 * Record the use of a grant for an action (R-FACTORY-24). A `standing`
 * grant is used first, then a `run` grant of this run, then an unspent
 * `once` grant, which this use spends. When no grant can be used, the
 * refusal is `grant-missing` when no grant names the action, and otherwise
 * the reason of the newest grant that names it: `grant-expired`,
 * `grant-spent`, or `grant-out-of-scope`.
 */
export function useFactoryGrant(
  db: StoreDatabase,
  request: { projectId: string; workflowName: string; action: string; runId: string; unitStoreId: string; scopes?: readonly FactoryGrantScope[] },
  options: { now?: Date } = {},
): FactoryGrantRecord & { use: FactoryGrantUseRecord } {
  checkProjectId(db, request.projectId);
  const action = checkName("action", request.action);
  // Every use names its lifecycle run and its work unit, so each use row can be read alone.
  const runId = checkRunId("runId", request.runId);
  if (typeof request.unitStoreId !== "string" || request.unitStoreId.length === 0 || request.unitStoreId.length > 160) {
    refuse("invalid-record", "The grant use names no work unit.", "Give the work unit that the action is for.", { field: "unitStoreId" });
  }
  const now = (options.now ?? new Date()).toISOString();
  return atomic(db, () => {
    const named = db.prepare("SELECT * FROM factory_grants WHERE project_id = ? AND workflow_name = ? AND action = ? ORDER BY granted_at DESC, grant_id DESC").all(request.projectId, request.workflowName, action) as unknown as GrantRow[];
    if (named.length === 0) refuse("grant-missing", `No grant names the action ${action}.`, "Ask the person through the human channel.", { action });
    const grants = request.scopes ? named.filter((grant) => request.scopes!.includes(grant.scope)) : named;
    if (grants.length === 0) refuse("grant-out-of-scope", `No grant for the action ${action} has the scope that this use needs.`, "Ask the person through the human channel.", { action });
    const order: Record<FactoryGrantScope, number> = { standing: 0, run: 1, once: 2 };
    const usable = grants.filter((grant) => grantUseRefusal(db, grant, request.runId, now) === null).sort((left, right) => order[left.scope] - order[right.scope]);
    const chosen = usable[0];
    if (!chosen) {
      const reason = grantUseRefusal(db, grants[0]!, request.runId, now)!;
      refuse(reason, `No grant for the action ${action} holds now.`, "Ask the person through the human channel.", { action });
    }
    if (chosen.scope === "once") {
      const spent = changes(db.prepare("UPDATE factory_grants SET spent_at = ?, entry_version = entry_version + 1 WHERE grant_id = ? AND spent_at IS NULL").run(now, chosen.grant_id));
      if (spent !== 1) refuse("grant-spent", `The grant for the action ${action} was spent.`, "Ask the person through the human channel.", { action });
    }
    // One row for each use, in the same transaction as the grant check (R-FACTORY-72). A refusal above writes none,
    // so two callers that race for one once grant leave one row. The row holds no content and no claim ID.
    const useId = newStoreId("fu-");
    db.prepare(
      "INSERT INTO factory_grant_uses (use_id, project_id, workflow_name, grant_id, action, scope, unit_store_id, run_id, used_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(useId, request.projectId, request.workflowName, chosen.grant_id, action, chosen.scope, request.unitStoreId, runId, now);
    const grant = toGrant(db.prepare("SELECT * FROM factory_grants WHERE grant_id = ?").get(chosen.grant_id) as unknown as GrantRow);
    return { ...grant, use: toGrantUse(db.prepare("SELECT * FROM factory_grant_uses WHERE use_id = ?").get(useId) as unknown as GrantUseRow) };
  });
}

/**
 * Record the use of a grant on the live claim of a unit that has no open
 * assignment (R-FACTORY-71, owner decision 2026-11-23). It is the path for an
 * action at the end of a scope, such as the merge after the person accepts the
 * whole scope. Only the holder of the unit's live claim records it, and the
 * claim ID is checked, never saved. Every assignment of the unit is final, and
 * one of them ran under the named workflow and lifecycle run, so the run is
 * never a mistyped one. The grant checks are those of {@link useFactoryGrant}.
 */
export function useFactoryGrantOnClaim(
  db: StoreDatabase,
  request: { projectId: string; workflowName: string; action: string; runId: string; unitStoreId: string },
  options: { claimId: string; now?: Date },
): FactoryGrantRecord & { use: FactoryGrantUseRecord } {
  const now = options.now ?? new Date();
  const projectId = checkProjectId(db, request.projectId);
  const workflowName = checkName("workflowName", request.workflowName);
  checkName("action", request.action);
  const runId = checkRunId("runId", request.runId);
  return atomic(db, () => {
    const unit = db.prepare("SELECT project_id FROM work_units WHERE store_id = ?").get(request.unitStoreId) as { project_id: string } | undefined;
    if (!unit || unit.project_id !== projectId) refuse("record-not-found", "The work unit does not exist in this project.", "Sync the work store, then read the unit again.", { unitStoreId: request.unitStoreId });
    assertClaimHeld(db, request.unitStoreId, options.claimId, now);
    const rows = db.prepare("SELECT workflow_name, run_id, status FROM factory_assignments WHERE project_id = ? AND unit_store_id = ?").all(projectId, request.unitStoreId) as unknown as Array<{ workflow_name: string; run_id: string; status: FactoryAssignmentStatus }>;
    if (rows.some((row) => !isFinalAssignmentStatus(row.status))) {
      refuse("assignment-open", "The unit has an open assignment, so the grant use belongs on that assignment.", "Record the use with make-docs factory assignment save --grant-use <action>, or settle the open assignment first.", { unitStoreId: request.unitStoreId });
    }
    if (!rows.some((row) => row.workflow_name === workflowName && row.run_id === runId)) {
      refuse("record-not-found", `The unit has no assignment of workflow ${workflowName} under lifecycle run ${runId}.`, "Name the workflow and the lifecycle run of the unit's assignments, as make-docs factory assignment list --all shows them.", { field: "runId" });
    }
    return useFactoryGrant(db, { projectId, workflowName, action: request.action, runId, unitStoreId: request.unitStoreId }, { now });
  });
}

/* ------------------------------------------------------------------------ */
/* Assignments (T3, T17)                                                    */
/* ------------------------------------------------------------------------ */

export interface FactoryAssignmentRecord {
  assignmentId: string;
  projectId: string;
  workflowName: string;
  /** The `installation_checkouts` checkout that the assignment runs in (owner decision 2026-11-23). */
  checkoutId: string;
  unitStoreId: string;
  role: string;
  partLabel: string;
  toolId: string;
  taskHandle: string | null;
  runId: string;
  status: FactoryAssignmentStatus;
  checkedAt: string;
  roundCount: number;
  planRevision: number;
  planDigest: string;
  history: FactoryStatusHistoryEntry[];
  version: number;
}

interface AssignmentRow {
  assignment_id: string;
  project_id: string;
  workflow_name: string;
  checkout_id: string;
  unit_store_id: string;
  role: string;
  part_label: string;
  tool_id: string;
  task_handle: string | null;
  run_id: string;
  status: FactoryAssignmentStatus;
  checked_at: string;
  round_count: number | bigint;
  plan_revision: number | bigint;
  plan_digest: string;
  history_json: string;
  entry_version: number | bigint;
}

function toAssignment(row: AssignmentRow): FactoryAssignmentRecord {
  return {
    assignmentId: row.assignment_id,
    projectId: row.project_id,
    workflowName: row.workflow_name,
    checkoutId: row.checkout_id,
    unitStoreId: row.unit_store_id,
    role: row.role,
    partLabel: row.part_label,
    toolId: row.tool_id,
    taskHandle: row.task_handle,
    runId: row.run_id,
    status: row.status,
    checkedAt: row.checked_at,
    roundCount: Number(row.round_count),
    planRevision: Number(row.plan_revision),
    planDigest: row.plan_digest,
    history: JSON.parse(row.history_json) as FactoryStatusHistoryEntry[],
    version: Number(row.entry_version),
  };
}

function assignmentRow(db: StoreDatabase, assignmentId: string): AssignmentRow | undefined {
  return db.prepare("SELECT * FROM factory_assignments WHERE assignment_id = ?").get(assignmentId) as AssignmentRow | undefined;
}

export function readFactoryAssignment(db: StoreDatabase, projectId: string, assignmentId: string): FactoryAssignmentRecord | null {
  checkProjectId(db, projectId);
  const row = assignmentRow(db, assignmentId);
  return row && row.project_id === projectId ? toAssignment(row) : null;
}

/** A project's assignments, optionally of one workflow or only the open ones, oldest first. */
export function listFactoryAssignments(db: StoreDatabase, projectId: string, options: { workflowName?: string; openOnly?: boolean } = {}): FactoryAssignmentRecord[] {
  checkProjectId(db, projectId);
  // Insert order (rowid), not the first history entry, which the 20-entry trim drops.
  const rows = db.prepare("SELECT * FROM factory_assignments WHERE project_id = ? ORDER BY rowid").all(projectId) as unknown as AssignmentRow[];
  return rows
    .filter((row) => options.workflowName === undefined || row.workflow_name === options.workflowName)
    .filter((row) => !options.openOnly || !isFinalAssignmentStatus(row.status))
    .map(toAssignment);
}

/** The claim rule of an assignment write: only the holder of the unit's live claim starts or updates it (R-FACTORY-50). */
function assertClaimHeld(db: StoreDatabase, unitStoreId: string, claimId: string, now: Date): void {
  if (typeof claimId !== "string" || claimId.length === 0 || checkWorkUnitWriteClaim(db, unitStoreId, claimId, now) !== null) {
    // The refusal never repeats the claim ID.
    refuse("claim-not-held", "The caller does not hold the live claim of this work unit.", "Claim the unit with make-docs work claim, or check the claim's task handle before a takeover.", { unitStoreId });
  }
}

export interface FactoryAssignmentStartInput {
  projectId: string;
  workflowName: string;
  /** The `installation_checkouts` checkout that the assignment runs in (owner decision 2026-11-23). */
  checkoutId: string;
  unitStoreId: string;
  role: string;
  /** `main` for a unit with one part. */
  partLabel?: string;
  toolId: string;
  taskHandle: string | null;
  runId: string;
  /**
   * The digest of the current plan, which the caller computed from the three
   * live sources. The start is refused with `not-ready` unless it is the
   * `ready` revision's digest.
   */
  currentPlanDigest: string;
  /** Spend a `once` `reset-correction-rounds` grant, so the new assignment starts at round 0. */
  resetRounds?: boolean;
}

/**
 * Start an assignment for one job (R-FACTORY-27, R-FACTORY-41,
 * R-FACTORY-58). Only the holder of the unit's live claim starts it, and the
 * claim ID is checked, never saved. It runs under the `ready` revision and is
 * refused with `not-ready` when the workflow is not `ready`, and with
 * `assignment-open` while the job has an open assignment. It starts at the
 * round count of the job's last assignment, unless it spends a `once`
 * `reset-correction-rounds` grant, and then it starts at 0.
 */
export function startFactoryAssignment(
  db: StoreDatabase,
  input: FactoryAssignmentStartInput,
  options: { claimId: string; now?: Date },
): FactoryAssignmentRecord {
  const now = options.now ?? new Date();
  const nowText = now.toISOString();
  const projectId = checkProjectId(db, input.projectId);
  const workflowName = checkName("workflowName", input.workflowName);
  const role = checkName("role", input.role);
  const partLabel = checkName("partLabel", input.partLabel ?? FACTORY_MAIN_PART_LABEL, FACTORY_PART_LABEL_MAX);
  const toolId = checkName("toolId", input.toolId);
  const taskHandle = input.taskHandle === null ? null : checkHandle("taskHandle", input.taskHandle);
  const runId = checkRunId("runId", input.runId);
  if (typeof input.checkoutId !== "string" || input.checkoutId.trim().length === 0 || input.checkoutId.length > 160) {
    refuse("invalid-record", "The assignment names no checkout.", "Give the checkout ID of the one checkout that runs the assignment.", { field: "checkoutId" });
  }
  const checkoutId = input.checkoutId;
  return atomic(db, () => {
    // Exactly one checkout of this project, bound in installation_checkouts (owner decision 2026-11-23).
    const checkout = db.prepare("SELECT project_id FROM installation_checkouts WHERE checkout_id = ?").get(checkoutId) as { project_id: string } | undefined;
    if (!checkout || checkout.project_id !== projectId) {
      refuse("checkout-not-bound", "The checkout is not a bound checkout of this project.", "Run the assignment from a checkout of the project that make-docs setup bound.", { field: "checkoutId" });
    }
    const unit = db.prepare("SELECT project_id FROM work_units WHERE store_id = ?").get(input.unitStoreId) as { project_id: string } | undefined;
    if (!unit || unit.project_id !== projectId) refuse("record-not-found", "The work unit does not exist in this project.", "Sync the work store, then read the unit again.", { unitStoreId: input.unitStoreId });
    assertClaimHeld(db, input.unitStoreId, options.claimId, now);
    const binding = bindingRow(db, projectId, workflowName);
    if (!binding) refuse("record-not-found", `Workflow ${workflowName} has no saved binding.`, "Run factory setup for this workflow first.");
    const ready = binding.ready_revision === null ? null : readFactoryPlanRevision(db, projectId, workflowName, Number(binding.ready_revision));
    // Live readiness (R-FACTORY-12): the current plan must have the `ready` revision's digest. The saved readiness is a note, not the gate.
    if (!ready || ready.planDigest !== input.currentPlanDigest) {
      refuse("not-ready", `Workflow ${workflowName} is not ready, so it takes no new work.`, "Check the workflow with factory workflow show and fix what it names.", { workflowName });
    }
    const open = db.prepare(
      `SELECT 1 FROM factory_assignments WHERE unit_store_id = ? AND role = ? AND part_label = ? AND status NOT IN (${FACTORY_FINAL_STATUSES.map(() => "?").join(",")})`,
    ).get(input.unitStoreId, role, partLabel, ...FACTORY_FINAL_STATUSES);
    if (open) refuse("assignment-open", "This job already has an open assignment.", "Update the open assignment, or close it before a new one.", { unitStoreId: input.unitStoreId, role, partLabel });
    const previous = db.prepare(
      "SELECT round_count FROM factory_assignments WHERE unit_store_id = ? AND role = ? AND part_label = ? ORDER BY rowid DESC LIMIT 1",
    ).get(input.unitStoreId, role, partLabel) as { round_count: number | bigint } | undefined;
    let roundCount = previous ? Number(previous.round_count) : 0;
    if (input.resetRounds && roundCount > 0) {
      // Only a once grant resets the count, and this start spends it (R-FACTORY-41). A count of 0 needs no reset, so the grant stays.
      useFactoryGrant(db, { projectId, workflowName, action: FACTORY_RESET_ROUNDS_ACTION, runId, unitStoreId: input.unitStoreId, scopes: ["once"] }, { now });
      roundCount = 0;
    }
    const assignmentId = newStoreId("fa-");
    const history: FactoryStatusHistoryEntry[] = [{ status: "offered", at: nowText, reason: "assigned" }];
    db.prepare(
      `INSERT INTO factory_assignments (assignment_id, project_id, workflow_name, checkout_id, unit_store_id, role, part_label, tool_id, task_handle, run_id, status, checked_at,
         round_count, plan_revision, plan_digest, history_json, entry_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'offered', ?, ?, ?, ?, ?, 1)`,
    ).run(assignmentId, projectId, workflowName, checkoutId, input.unitStoreId, role, partLabel, toolId, taskHandle, runId, nowText, roundCount, ready.revision, ready.planDigest, JSON.stringify(history));
    return readFactoryAssignment(db, projectId, assignmentId)!;
  });
}

export interface FactoryAssignmentUpdateInput {
  /** The new status. The same status only records a check. */
  status: FactoryAssignmentStatus;
  /** The status history reason code of a move. */
  reason: FactoryStatusHistoryCode;
  /** A new task handle, or undefined to keep the current one. */
  taskHandle?: string | null;
}

/**
 * Update an assignment (R-FACTORY-28, R-FACTORY-41). Only the holder of the
 * unit's live claim updates it. A final assignment never changes
 * (`final-status`). A move must be in the move table (`illegal-move`). A move
 * from `returned` or `in-review` to `needs-correction` adds one round, and a
 * move that would take the count past the round limit of the assignment's
 * plan revision is refused with `round-limit-reached`. An update that keeps
 * the status changes only the last check time and adds no history entry.
 */
export function updateFactoryAssignment(
  db: StoreDatabase,
  projectId: string,
  assignmentId: string,
  update: FactoryAssignmentUpdateInput,
  options: { claimId: string; expectedVersion: number; now?: Date },
): FactoryAssignmentRecord {
  const now = options.now ?? new Date();
  const nowText = now.toISOString();
  checkProjectId(db, projectId);
  const status = checkOneOf("status", update.status, FACTORY_ASSIGNMENT_STATUSES);
  const reason = checkOneOf("reason", update.reason, FACTORY_STATUS_HISTORY_CODES);
  const taskHandle = update.taskHandle === undefined || update.taskHandle === null ? update.taskHandle : checkHandle("taskHandle", update.taskHandle);
  return atomic(db, () => {
    const row = assignmentRow(db, assignmentId);
    if (!row || row.project_id !== projectId) refuse("record-not-found", "The assignment does not exist in this project.", RE_READ);
    assertClaimHeld(db, row.unit_store_id, options.claimId, now);
    if (isFinalAssignmentStatus(row.status)) refuse("final-status", `The assignment is ${row.status}, which is final.`, "Start a new assignment for a job that must run again.", { status: row.status });
    if (Number(row.entry_version) !== options.expectedVersion) refuse("version-conflict", `The assignment is at version ${Number(row.entry_version)}, not ${options.expectedVersion}.`, RE_READ, { currentVersion: Number(row.entry_version) });
    const moveRefusal = factoryStatusMoveRefusal(row.status, status);
    if (moveRefusal) refuse(moveRefusal, `The move from ${row.status} to ${status} is not in the status move table.`, "Use a move that the factory contract allows.", { from: row.status, to: status });
    // The status before `unknown` comes from the history, whose newest entry is the current status (owner decision 2026-11-23).
    const rounds = nextFactoryRoundCount(row.status, status, Number(row.round_count), factoryStatusBeforeLatest(JSON.parse(row.history_json) as FactoryStatusHistoryEntry[]));
    if (rounds !== Number(row.round_count)) {
      const plan = readFactoryPlanRevision(db, row.project_id, row.workflow_name, Number(row.plan_revision));
      const limit = plan ? factoryPlanRoundLimit(plan.planJson) : null;
      if (limit === null) refuse("invalid-record", "The assignment's plan revision has no round limit.", "Check the workflow with factory workflow show.");
      if (rounds > limit) refuse("round-limit-reached", `This job has reached its round limit of ${limit}.`, "Escalate to the person: the correction loop stops here.", { roundLimit: limit, roundCount: Number(row.round_count) });
    }
    const moved = status !== row.status;
    const history = moved ? appendFactoryStatusHistory(JSON.parse(row.history_json) as FactoryStatusHistoryEntry[], { status, at: nowText, reason }) : (JSON.parse(row.history_json) as FactoryStatusHistoryEntry[]);
    const nextHandle = taskHandle === undefined ? row.task_handle : taskHandle;
    const written = changes(db.prepare(
      `UPDATE factory_assignments SET status = ?, checked_at = ?, round_count = ?, task_handle = ?, history_json = ?, entry_version = entry_version + 1
       WHERE assignment_id = ? AND entry_version = ?`,
    ).run(status, nowText, rounds, nextHandle, JSON.stringify(history), assignmentId, options.expectedVersion));
    if (written !== 1) refuse("version-conflict", "The assignment changed while it was being updated.", RE_READ);
    return readFactoryAssignment(db, projectId, assignmentId)!;
  });
}

/* ------------------------------------------------------------------------ */
/* Test task results                                                        */
/* ------------------------------------------------------------------------ */

export interface FactoryProofResultRecord {
  projectId: string;
  workflowName: string;
  outcome: FactoryTestOutcome;
  testTask: string;
  planDigest: string;
  path: string[];
  manualSteps: string[];
  recordedAt: string;
  version: number;
}

interface ProofResultRow {
  project_id: string;
  workflow_name: string;
  outcome: FactoryTestOutcome;
  test_task: string;
  plan_digest: string;
  path_json: string;
  manual_steps_json: string;
  recorded_at: string;
  entry_version: number | bigint;
}

export function readFactoryProofResult(db: StoreDatabase, projectId: string, workflowName: string, outcome: FactoryTestOutcome): FactoryProofResultRecord | null {
  checkProjectId(db, projectId);
  const row = db.prepare("SELECT * FROM factory_proof_results WHERE project_id = ? AND workflow_name = ? AND outcome = ?").get(projectId, workflowName, outcome) as ProofResultRow | undefined;
  return row
    ? {
        projectId: row.project_id,
        workflowName: row.workflow_name,
        outcome: row.outcome,
        testTask: row.test_task,
        planDigest: row.plan_digest,
        path: JSON.parse(row.path_json) as string[],
        manualSteps: JSON.parse(row.manual_steps_json) as string[],
        recordedAt: row.recorded_at,
        version: Number(row.entry_version),
      }
    : null;
}

/**
 * Record a test task result (R-FACTORY-12, R-FACTORY-57). The digest must be
 * a kept revision's digest, or the save is refused with
 * `plan-digest-mismatch`. A result replaces the last one of the same outcome.
 * It does not make the revision `ready`; {@link markFactoryReadyRevision}
 * does that after a pass.
 */
export function saveFactoryProofResult(
  db: StoreDatabase,
  input: { projectId: string; workflowName: string; outcome: FactoryTestOutcome; testTask: string; planDigest: string; path: string[]; manualSteps: string[] },
  options: { expectedVersion: number | null; now?: Date },
): FactoryProofResultRecord {
  const projectId = checkProjectId(db, input.projectId);
  const workflowName = checkName("workflowName", input.workflowName);
  const outcome = checkOneOf("outcome", input.outcome, FACTORY_TEST_OUTCOMES);
  const testTask = checkText("testTask", input.testTask);
  const path = checkTextList("path", input.path, 32);
  if (path.length === 0) refuse("invalid-record", "The path exercised names at least one step.", FIX_FIELD, { field: "path" });
  const manualSteps = checkTextList("manualSteps", input.manualSteps, 16);
  const recordedAt = (options.now ?? new Date()).toISOString();
  return atomic(db, () => {
    if (!findFactoryPlanRevisionByDigest(db, projectId, workflowName, input.planDigest)) {
      refuse("plan-digest-mismatch", "No kept plan revision of this workflow has that digest.", "Run the test task under a saved plan revision.");
    }
    const current = db.prepare("SELECT entry_version FROM factory_proof_results WHERE project_id = ? AND workflow_name = ? AND outcome = ?").get(projectId, workflowName, outcome) as { entry_version: number | bigint } | undefined;
    assertVersion(`The ${outcome} test task result of workflow ${workflowName}`, current ? Number(current.entry_version) : null, options.expectedVersion);
    db.prepare("DELETE FROM factory_proof_results WHERE project_id = ? AND workflow_name = ? AND outcome = ?").run(projectId, workflowName, outcome);
    db.prepare(
      `INSERT INTO factory_proof_results (project_id, workflow_name, outcome, test_task, plan_digest, path_json, manual_steps_json, recorded_at, entry_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(projectId, workflowName, outcome, testTask, input.planDigest, JSON.stringify(path), JSON.stringify(manualSteps), recordedAt, (options.expectedVersion ?? 0) + 1);
    return readFactoryProofResult(db, projectId, workflowName, outcome)!;
  });
}

/* ------------------------------------------------------------------------ */
/* Backup records (T12)                                                     */
/* ------------------------------------------------------------------------ */

export interface FactoryBackupRecord {
  projectId: string;
  assignmentId: string;
  originalPath: string;
  backupPath: string;
  contentDigest: string;
  backedUpAt: string;
}

interface BackupRow {
  project_id: string;
  assignment_id: string;
  original_path: string;
  backup_path: string;
  content_digest: string;
  backed_up_at: string;
}

function toBackup(row: BackupRow): FactoryBackupRecord {
  return { projectId: row.project_id, assignmentId: row.assignment_id, originalPath: row.original_path, backupPath: row.backup_path, contentDigest: row.content_digest, backedUpAt: row.backed_up_at };
}

export function readFactoryBackup(db: StoreDatabase, projectId: string, assignmentId: string, originalPath: string): FactoryBackupRecord | null {
  checkProjectId(db, projectId);
  const row = db.prepare("SELECT * FROM factory_backups WHERE project_id = ? AND assignment_id = ? AND original_path = ?").get(projectId, assignmentId, originalPath) as BackupRow | undefined;
  return row ? toBackup(row) : null;
}

/** Every backup record of one project, oldest first. */
export function listFactoryBackups(db: StoreDatabase, projectId: string): FactoryBackupRecord[] {
  checkProjectId(db, projectId);
  return (db.prepare("SELECT * FROM factory_backups WHERE project_id = ? ORDER BY backed_up_at, backup_path").all(projectId) as unknown as BackupRow[]).map(toBackup);
}

/** Record one backup of an assignment of the project. The assignment must belong to that project. */
export function recordFactoryBackup(db: StoreDatabase, projectId: string, record: Omit<FactoryBackupRecord, "backedUpAt" | "projectId">, options: { now?: Date } = {}): FactoryBackupRecord {
  checkProjectId(db, projectId);
  if (!/^[0-9a-f]{64}$/.test(record.contentDigest)) refuse("invalid-record", "The content digest is not a SHA-256 digest.", "Give the digest of the backup bytes.", { field: "contentDigest" });
  const backedUpAt = (options.now ?? new Date()).toISOString();
  return atomic(db, () => {
    const assignment = assignmentRow(db, record.assignmentId);
    if (!assignment || assignment.project_id !== projectId) refuse("record-not-found", "The assignment of this backup does not exist in this project.", RE_READ);
    db.prepare("INSERT INTO factory_backups (project_id, assignment_id, original_path, backup_path, content_digest, backed_up_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(projectId, record.assignmentId, record.originalPath, record.backupPath, record.contentDigest, backedUpAt);
    return readFactoryBackup(db, projectId, record.assignmentId, record.originalPath)!;
  });
}

export function deleteFactoryBackupRecord(db: StoreDatabase, projectId: string, backupPath: string): void {
  checkProjectId(db, projectId);
  db.prepare("DELETE FROM factory_backups WHERE project_id = ? AND backup_path = ?").run(projectId, backupPath);
}

/**
 * The backup records of one project whose assignment's work is accepted or
 * closed: the assignment is `accepted`, or its work unit is closed
 * (R-FACTORY-45).
 */
export function listFactoryBackupsForFinishedWork(db: StoreDatabase, projectId: string): FactoryBackupRecord[] {
  checkProjectId(db, projectId);
  return (db.prepare(
    `SELECT b.* FROM factory_backups b
       JOIN factory_assignments a ON a.assignment_id = b.assignment_id
       LEFT JOIN work_units u ON u.store_id = a.unit_store_id
      WHERE b.project_id = ? AND (a.status = 'accepted' OR u.status = 'closed')
      ORDER BY b.backed_up_at, b.backup_path`,
  ).all(projectId) as unknown as BackupRow[]).map(toBackup);
}
