import { existsSync, rmSync } from "node:fs";
import path from "node:path";

import type { StoreDatabase } from "../../store/database";
import {
  FACTORY_GRANT_USE_READ_MAX,
  FactoryStoreRefusalError,
  countFactoryGrantUses,
  listFactoryAssignments,
  listFactoryGrantUses,
  listFactoryGrants,
  listFactoryMachineTools,
  listFactoryPlanRevisions,
  listFactoryWorkflowBindings,
  markFactoryReadyRevision,
  readFactoryAssignment,
  readFactoryPlanRevision,
  readFactoryProofResult,
  readFactoryWorkflowBinding,
  readFactoryWorkflowRemovalFacts,
  readFactoryWorkflowRemovalIdentity,
  removeFactoryWorkflowRows,
  revokeFactoryGrant,
  saveFactoryGrant,
  saveFactoryMachineTool,
  saveFactoryPlanRevision,
  saveFactoryProofResult,
  saveFactoryWorkflowBinding,
  startFactoryAssignment,
  updateFactoryAssignment,
  useFactoryGrant,
  useFactoryGrantOnClaim,
  type FactoryAssignmentRecord,
  type FactoryGrantRecord,
  type FactoryGrantUseRecord,
  type FactoryMachineToolRecord,
  type FactoryProofResultRecord,
} from "../../store/factory-store";
import { withStoreReadOnlyDatabase, withStoreWriteDatabase } from "../../store/installation-state";
import { checkWorkUnitWriteClaim, findWorkUnitByCoordinate, listWorkClaims, readWorkUnit } from "../../store/work-store";
import { normalizeWorkUnitReference } from "../work/work-queue/queue";
import { visibleWorkClaim, workUnitLabel, type WorkVisibleClaim } from "../work/work-queue/readiness";
import {
  backupFactoryFileBeforeChange,
  factoryBackupProjectPath,
  cleanupFactoryBackups,
  FACTORY_BACKUP_RELATIVE_PATH,
  FACTORY_BACKUP_BLOCK_FIXES,
  FACTORY_BACKUP_BLOCK_WORDS,
  FactoryBackupFileError,
  factoryBackupFolder,
  factoryBackupKeptLines,
  isInsideGitWorkTree,
  planFactoryWorkflowBackupRemoval,
  removeEmptyFactoryBackupFolders,
  removeFactoryWorkflowBackups,
  removeUnusedFactoryBackupFolder,
  type FactoryBackupCleanupResult,
} from "./backups";
import { writeFactoryCopies, type FactoryCopiesResult } from "./copies";
import {
  bindingForPlan,
  factoryPlanIsWired,
  factoryReadinessWords,
  factoryToolFacts,
  factoryTypeRequiredRoles,
  factoryWorkflowLiveState,
  readFactoryCheckoutConfig,
  readFactoryType,
  type FactoryCheckoutConfig,
  type FactoryDriftEntry,
  type FactoryLiveReadiness,
  type FactoryWorkflowLiveState,
} from "./live-plan";
import { resolveFactoryPlan, factoryCanonicalDigest, factoryPlanRoundLimit, type FactoryJsonValue } from "./plan";
import {
  FACTORY_MACHINE_ACTED_ON,
  factoryProjectActedOn,
  factoryProjectChoiceLine,
  factoryProjectWords,
  type FactoryActedOn,
  type FactoryCheckoutRef,
  type FactoryOperationId,
  type FactoryProjectRefusal,
  type FactoryProjectResolution,
} from "./project-scope";
import {
  FACTORY_FINAL_STATUSES,
  FACTORY_PROOF_OLD_AFTER_DAYS,
  isFinalAssignmentStatus,
  unknownFactoryCapabilities,
  type FactoryAssignmentStatus,
  type FactoryGrantScope,
  type FactoryProofResult,
  type FactoryStatusHistoryCode,
  type FactoryTestOutcome,
  type FactoryToolKind,
  type FactoryToolState,
  type FactoryWakeMethod,
} from "./records";

/**
 * W30 R0 P3 factory operations (PRD 53 R-FACTORY-5, -10, -12, -24 to -28,
 * -33, -41, -49 to -51, -53 to -61, -62 to -65).
 *
 * One function for each `factory` command. The registry operations and the
 * CLI and MCP adapters add only input parsing, so the CLI JSON and the MCP
 * result are the same value (A19). Each function checks and records. None of
 * them launches, schedules, messages, or contacts a tool, and none starts a
 * process or opens a network connection (R-FACTORY-5, A22).
 *
 * Every result names what it acted on, with the human words first
 * (R-FACTORY-64). Every Store refusal is a typed result that changed nothing:
 * each write runs in one Store transaction, and a refusal rolls it back. A
 * claim ID is an input only. No result, record, or copy holds one
 * (R-FACTORY-50, PRD 52 R-WORK-QUEUE-19).
 */

export const FACTORY_READ_TAIL = "Changes nothing.";

export interface FactoryEnv {
  storeRoot: string;
  now: Date;
}

export interface FactoryResultBase {
  operation: FactoryOperationId;
  result: string;
  actedOn: FactoryActedOn;
  lines: string[];
  summary: string;
}

export interface FactoryRefusalResult extends FactoryResultBase {
  result: "refused";
  refusal: string;
  reason: string;
  nextAction: string;
  details: Record<string, unknown>;
}

function finish<T extends Omit<FactoryResultBase, "summary">>(value: T): T & { summary: string } {
  return { ...value, summary: value.lines.join("\n") };
}

/** A typed refusal result. It names the project it refused, or says that no project was named (R-FACTORY-64). */
export function factoryRefusalResult(
  operation: FactoryOperationId,
  actedOn: FactoryActedOn,
  refusal: string,
  reason: string,
  nextAction: string,
  details: Record<string, unknown> = {},
  extraLines: string[] = [],
): FactoryRefusalResult {
  const subject = actedOn.kind === "none" ? "Refused: no project was named." : `Refused for ${actedOn.text}.`;
  const lines = [`${subject} ${reason}`, ...extraLines, `Next: ${nextAction}`, `Reason code: ${refusal}. Nothing changed.`];
  return finish({ operation, result: "refused" as const, actedOn, refusal, reason, nextAction, details, lines });
}

export function factoryProjectRefusalResult(operation: FactoryOperationId, refusal: FactoryProjectRefusal): FactoryRefusalResult {
  return factoryRefusalResult(operation, refusal.actedOn, refusal.refusal, refusal.reason, refusal.nextAction);
}

/** Run one factory step and turn a typed Store refusal into its refusal result. */
function refusable<T>(operation: FactoryOperationId, actedOn: FactoryActedOn, fn: () => T, extra?: (error: FactoryStoreRefusalError) => string[]): T | FactoryRefusalResult {
  try {
    return fn();
  } catch (error) {
    if (error instanceof FactoryStoreRefusalError) {
      return factoryRefusalResult(operation, actedOn, error.refusal, error.reason, error.nextAction, error.details, extra?.(error) ?? []);
    }
    throw error;
  }
}

function refuse(refusal: ConstructorParameters<typeof FactoryStoreRefusalError>[0], reason: string, nextAction: string, details: Record<string, unknown> = {}): never {
  throw new FactoryStoreRefusalError(refusal, reason, nextAction, details);
}

function count(value: number, word: string): string {
  return `${value} ${word}${value === 1 ? "" : "s"}`;
}

/* ------------------------------------------------------------------------ */
/* tools save (machine)                                                     */
/* ------------------------------------------------------------------------ */

export interface FactoryToolSaveInput {
  toolId: string;
  kind: FactoryToolKind;
  label: string;
  state: FactoryToolState;
  reportedVersion: string | null;
  capabilities: string[];
  proofs: Array<{ capabilityId: string; method: string; toolVersion: string | null; provedAt: string; result: FactoryProofResult; notCovered: string[] }>;
  /** The record version that the caller read, or null for a new tool. */
  expectedVersion: number | null;
}

function toolView(tool: FactoryMachineToolRecord) {
  return {
    toolId: tool.toolId,
    kind: tool.kind,
    label: tool.label,
    state: tool.state,
    reportedVersion: tool.reportedVersion,
    capabilities: tool.capabilities,
    proofs: tool.proofs,
    reportedAt: tool.reportedAt,
    version: tool.version,
  };
}

/**
 * `factory tools save` (T2, T7, T15, T16): check and save the machine's
 * tools and their capability proofs. It takes no project (T25). It records
 * each tool's state as the agent reports it, and never runs or contacts a tool.
 */
export function factoryToolsSave(env: FactoryEnv, input: { tools: FactoryToolSaveInput[] }) {
  const operation = "factory.tools.save" as const;
  const actedOn = FACTORY_MACHINE_ACTED_ON;
  return refusable(operation, actedOn, () => {
    const saved = withStoreWriteDatabase(env.storeRoot, (db) => input.tools.map((tool) => saveFactoryMachineTool(db, {
      toolId: tool.toolId,
      kind: tool.kind,
      label: tool.label,
      state: tool.state,
      reportedVersion: tool.reportedVersion,
      capabilities: tool.capabilities,
      proofs: tool.proofs.map((proof) => ({ ...proof, provedAt: new Date(proof.provedAt) })),
    }, { expectedVersion: tool.expectedVersion, now: env.now })));
    const lines = [
      `Saved ${count(saved.length, "tool")} for this machine. Every project on this machine uses this list.`,
      ...saved.map((tool) => `- ${tool.toolId} (${tool.label}): ${tool.state}, version ${tool.reportedVersion ?? "not reported"}, ${count(tool.proofs.length, "proof")}. Record version ${tool.version}.`),
      "Make Docs ran and contacted no tool. Run make-docs factory status in a project to see how this changes its workflows. A project's .make-docs/factory/ copies update at its next factory save or make-docs factory restore.",
    ];
    return finish({ operation, result: "saved" as const, actedOn, tools: saved.map(toolView), lines });
  });
}

/**
 * `factory tools list` (W30 R0 follow-up, R-FACTORY-69): this machine's saved
 * tools, each with its state, its capability proofs, and its record version
 * for `expectedVersion`. It takes no project. It opens a read-only Store
 * session, so it never creates or migrates a Store, and it contacts no tool.
 * Each value it shows passed the never-log check when it was saved.
 */
export function factoryToolsList(env: FactoryEnv) {
  const operation = "factory.tools.list" as const;
  const actedOn = FACTORY_MACHINE_ACTED_ON;
  return refusable(operation, actedOn, () => {
    const tools = withStoreReadOnlyDatabase(env.storeRoot, (db) => listFactoryMachineTools(db)).map(toolView);
    const lines = [
      tools.length === 0
        ? "No tool is saved for this machine yet. Save the tools with make-docs factory tools save."
        : `${count(tools.length, "tool")} saved for this machine. Every project on this machine uses this list.`,
      ...tools.flatMap((tool) => [
        `- ${tool.toolId} (${tool.label}): ${tool.kind}, ${tool.state}, version ${tool.reportedVersion ?? "not reported"}, reported ${tool.reportedAt}. Record version ${tool.version}.`,
        ...(tool.proofs.length === 0 ? ["  No capability proof."] : []),
        ...tool.proofs.map((proof) => `  - ${proof.capabilityId}: ${proof.result} under version ${proof.toolVersion ?? "not reported"} at ${proof.provedAt}, by: ${proof.method.replace(/[.\s]+$/, "")}. Does not cover: ${proof.notCovered.length ? proof.notCovered.join("; ") : "nothing named"}.`),
      ]),
      ...(tools.length === 0 ? [] : ["Give a tool's record version as expectedVersion when you save that tool again."]),
      "Make Docs ran and contacted no tool.",
      FACTORY_READ_TAIL,
    ];
    return finish({ operation, result: "read" as const, actedOn, tools, lines });
  });
}

/* ------------------------------------------------------------------------ */
/* workflow save (project)                                                  */
/* ------------------------------------------------------------------------ */

export interface FactoryBindingInput {
  roles: Record<string, string>;
  worktreeMethod: string;
  channelRef: string | null;
  wakeMethod: FactoryWakeMethod;
  wakeRef: string | null;
  knownLosses: string[];
}

export interface FactoryGrantAddInput {
  action: string;
  scope: FactoryGrantScope;
  runId: string | null;
  expiresAt: string | null;
  grantedBy: string;
}

export interface FactoryWorkflowSaveInput {
  workflow: string;
  expectedVersion: number | null;
  binding?: FactoryBindingInput;
  /** Ask for `ready`. It is refused unless a passed test task ran under the plan that this save gives (T3, A20). */
  readiness?: "ready";
  grants?: { add: FactoryGrantAddInput[]; revoke: Array<{ grantId: string; expectedVersion: number }> };
}

function grantView(grant: FactoryGrantRecord, now: Date) {
  const nowText = now.toISOString();
  const state = grant.expiresAt !== null && grant.expiresAt <= nowText ? "expired" : grant.scope === "once" && grant.spentAt !== null ? "spent" : "usable";
  return {
    grantId: grant.grantId,
    action: grant.action,
    scope: grant.scope,
    runId: grant.runId,
    expiresAt: grant.expiresAt,
    spentAt: grant.spentAt,
    grantedBy: grant.grantedBy,
    grantedAt: grant.grantedAt,
    state,
    version: grant.version,
  };
}

/** One recorded grant use, as a result shows it: IDs, the action, the scope, the unit, the run, and the time. No content. */
function grantUseView(db: StoreDatabase, use: FactoryGrantUseRecord) {
  const unit = readWorkUnit(db, use.unitStoreId);
  return { useId: use.useId, grantId: use.grantId, action: use.action, scope: use.scope, unit: unit ? workUnitLabel(unit) : use.unitStoreId, runId: use.runId, usedAt: use.usedAt };
}

function grantUseLine(use: ReturnType<typeof grantUseView>): string {
  return `- ${use.action}: ${use.scope} grant ${use.grantId}, for ${use.unit}, lifecycle run ${use.runId}, at ${use.usedAt}.`;
}

function grantLine(grant: ReturnType<typeof grantView>): string {
  const scope = grant.scope === "run" ? `run ${grant.runId}` : grant.scope;
  return `- ${grant.action}: ${scope}, ${grant.state}${grant.expiresAt ? `, ends ${grant.expiresAt}` : ""}. Granted by ${grant.grantedBy} at ${grant.grantedAt}. Grant ID ${grant.grantId}, version ${grant.version}.`;
}

function writeGrants(db: StoreDatabase, project: FactoryProjectResolution, workflow: string, grants: FactoryWorkflowSaveInput["grants"], now: Date) {
  const added: FactoryGrantRecord[] = [];
  for (const grant of grants?.add ?? []) {
    added.push(saveFactoryGrant(db, {
      projectId: project.projectId,
      workflowName: workflow,
      action: grant.action,
      scope: grant.scope,
      runId: grant.runId,
      expiresAt: grant.expiresAt === null ? null : new Date(grant.expiresAt),
      grantedBy: grant.grantedBy,
    }, { now }));
  }
  const revoked: string[] = [];
  for (const grant of grants?.revoke ?? []) {
    const own = listFactoryGrants(db, project.projectId, workflow).some((candidate) => candidate.grantId === grant.grantId);
    if (!own) refuse("record-not-found", `Workflow ${workflow} has no grant ${grant.grantId}.`, "Read the grants with make-docs factory workflow show, then revoke one of them.");
    revokeFactoryGrant(db, project.projectId, grant.grantId, { expectedVersion: grant.expectedVersion });
    revoked.push(grant.grantId);
  }
  return { added, revoked };
}

/** The checkout facts that a project write reads: its config entry and its type (T18). */
function checkoutPlanSources(checkout: FactoryCheckoutRef, workflow: string) {
  const config = readFactoryCheckoutConfig(checkout.root);
  if (!config.ok) refuse("invalid-record", config.reason, "Fix the config file of the checkout, then save again.");
  const definition = config.workflows[workflow];
  if (!definition) {
    refuse("invalid-record", `The config of this checkout has no factory.workflows.${workflow} entry.`, "Add the workflow's portable choices to the factory block of .make-docs/config.yaml first.", { field: "workflow" });
  }
  // T16: every capability ID that a role needs is in the catalog (R-FACTORY-53).
  const unknown = unknownFactoryCapabilities(Object.values(definition.roles).flatMap((role) => role.capabilities));
  if (unknown.length > 0) {
    refuse("unknown-capability", `The capability IDs ${unknown.join(", ")} are not in the capability catalog.`, "Use a capability ID from make-docs://system/contract/factory-contract.md.", { capabilityIds: unknown });
  }
  const type = readFactoryType(checkout.root, definition.type);
  if (!type.ok) {
    if (type.code === "type-name-clash") refuse("invalid-record", type.reason, `Rename the project type to a new name and name it in the config. Nothing was saved. Drift code: type-name-clash.`, { driftCode: "type-name-clash" });
    refuse(type.code === "type-not-found" ? "record-not-found" : "invalid-record", type.reason, "Name a shipped type or a project type in the config.");
  }
  // T3: the config has each standard role that the type's Roles table names.
  const missingRoles = factoryTypeRequiredRoles(type.roles).filter((role) => !Object.hasOwn(definition.roles, role));
  if (missingRoles.length > 0) {
    refuse("invalid-record", `Workflow type ${definition.type} needs the roles ${missingRoles.join(", ")}, which the config entry of workflow ${workflow} does not have.`, "Add each role to the workflow's entry in the factory block of .make-docs/config.yaml, with its job, capabilities, and returns, then save again.", { roles: missingRoles });
  }
  // T18: the config names the type version that the type file states (R-FACTORY-61).
  if (definition.typeVersion !== type.facts.version) {
    refuse("type-version-mismatch", `The config names version ${definition.typeVersion} of type ${definition.type}, but the type file states version ${type.facts.version}.`, `Set typeVersion: ${type.facts.version} for this workflow in the config after you check the type's changes.`, { typeVersion: type.facts.version });
  }
  return { definition, type };
}

/**
 * `factory workflow save` (T3, T7, T16 to T18): check and save one
 * workflow's choices and binding, and save a new plan revision when the plan
 * changed. A save never makes a revision the `ready` revision. With only
 * grants, it is a grant-only save: it writes or revokes grants and resolves
 * no plan, saves no revision, and does not change readiness (T17).
 */
export function factoryWorkflowSave(env: FactoryEnv, project: FactoryProjectResolution, input: FactoryWorkflowSaveInput) {
  const operation = "factory.workflow.save" as const;
  const actedOn = factoryProjectActedOn(project);
  const words = factoryProjectWords(project);
  if (!input.binding) {
    return refusable(operation, actedOn, () => {
      const written = withStoreWriteDatabase(env.storeRoot, (db) => writeGrants(db, project, input.workflow, input.grants, env.now));
      const lines = [
        `Saved the grants of workflow ${input.workflow} for ${words}: ${count(written.added.length, "grant")} added, ${count(written.revoked.length, "grant")} revoked.`,
        ...written.added.map((grant) => grantLine(grantView(grant, env.now))),
        ...written.revoked.map((grantId) => `- Revoked grant ${grantId}.`),
        "This grant-only save resolved no plan, saved no plan revision, and did not change readiness.",
      ];
      return finish({ operation, result: "saved" as const, actedOn, workflow: input.workflow, grantOnly: true, grants: { added: written.added.map((grant) => grantView(grant, env.now)), revoked: written.revoked }, lines });
    });
  }
  const binding = input.binding;
  return refusable(operation, actedOn, () => {
    const checkout = project.checkout!;
    const { definition, type } = checkoutPlanSources(checkout, input.workflow);
    const unknownRoles = Object.keys(binding.roles).filter((role) => !(role in definition.roles));
    if (unknownRoles.length > 0) {
      refuse("invalid-record", `The binding names the roles ${unknownRoles.join(", ")}, which the config entry of workflow ${input.workflow} does not have.`, "Bind only the roles that the config entry lists.", { roles: unknownRoles });
    }
    const outcome = withStoreWriteDatabase(env.storeRoot, (db) => {
      const tools = listFactoryMachineTools(db);
      const plan = resolveFactoryPlan({ workflowName: input.workflow, definition, type: type.facts, binding: bindingForPlan(binding), tools: factoryToolFacts(tools) });
      const allBound = Object.keys(definition.roles).every((role) => binding.roles[role] !== undefined);
      const readiness = allBound && factoryPlanIsWired(plan.plan) ? "wired" as const : "draft" as const;
      const before = readFactoryWorkflowBinding(db, project.projectId, input.workflow);
      if (input.readiness === "ready") {
        const ready = before?.readyRevision === null || before?.readyRevision === undefined ? null : readFactoryPlanRevision(db, project.projectId, input.workflow, before.readyRevision);
        if (!ready || ready.planDigest !== plan.planDigest) {
          refuse(
            "proof-missing",
            `No passed test task ran under the plan that this save gives (plan digest ${plan.planDigest}). The missing proof is the passed test task of workflow ${input.workflow} under that plan.`,
            "Save the workflow without asking for ready, run the test task under its plan revision, and record the result with make-docs factory proof save.",
            { planDigest: plan.planDigest },
          );
        }
      }
      const saved = saveFactoryWorkflowBinding(db, {
        projectId: project.projectId,
        workflowName: input.workflow,
        roles: binding.roles,
        worktreeMethod: binding.worktreeMethod,
        channelRef: binding.channelRef,
        wakeMethod: binding.wakeMethod,
        wakeRef: binding.wakeRef,
        knownLosses: binding.knownLosses,
        readiness,
        currentPlanDigest: plan.planDigest,
      }, { expectedVersion: input.expectedVersion });
      const revision = saveFactoryPlanRevision(db, { projectId: project.projectId, workflowName: input.workflow, plan: plan.plan }, { now: env.now });
      const grants = input.grants ? writeGrants(db, project, input.workflow, input.grants, env.now) : { added: [], revoked: [] };
      return { saved, revision, plan, grants };
    });
    const copies = writeCopies(env, project, checkout);
    const { saved, revision, plan, grants } = outcome;
    const isReady = saved.readyRevision === revision.revision.revision;
    const state: FactoryLiveReadiness = isReady ? "ready" : saved.readiness;
    const next = isReady
      ? "The workflow takes new work."
      : state === "wired"
        ? `Run the test task under plan revision ${revision.revision.revision} and record it with make-docs factory proof save --plan-digest ${plan.planDigest}.`
        : "Bind a tool to each role and prove each capability it needs, then save again.";
    const lines = [
      `Saved workflow ${input.workflow} for ${words}.`,
      `Plan revision ${revision.revision.revision}${revision.created ? " (new)" : " (unchanged: a kept revision has this plan)"}. Readiness: ${factoryReadinessWords(state)}.`,
      ...(revision.removed.length ? [`Removed older plan revisions ${revision.removed.join(", ")} under the keep rule.`] : []),
      ...(grants.added.length || grants.revoked.length ? [`Grants: ${count(grants.added.length, "grant")} added, ${count(grants.revoked.length, "grant")} revoked.`] : []),
      `Next: ${next}`,
      `Copies: wrote ${copies.written.length} files in ${path.relative(checkout.root, copies.folder) || "."} of checkout ${checkout.root}.`,
    ];
    return finish({
      operation,
      result: "saved" as const,
      actedOn,
      workflow: input.workflow,
      grantOnly: false,
      readiness: state,
      version: saved.version,
      revision: { number: revision.revision.revision, planDigest: revision.revision.planDigest, configDigest: revision.revision.configDigest, bindingDigest: revision.revision.bindingDigest, created: revision.created },
      readyRevision: saved.readyRevision,
      removedRevisions: revision.removed,
      grants: { added: grants.added.map((grant) => grantView(grant, env.now)), revoked: grants.revoked },
      checkout: { checkoutId: checkout.checkoutId, root: checkout.root },
      copies: { written: copies.written, removed: copies.removed },
      lines,
    });
  });
}

function writeCopies(env: FactoryEnv, project: FactoryProjectResolution, checkout: FactoryCheckoutRef): FactoryCopiesResult {
  return withStoreReadOnlyDatabase(env.storeRoot, (db) => writeFactoryCopies(db, checkout.root, project.projectId));
}

/* ------------------------------------------------------------------------ */
/* proof save (project)                                                     */
/* ------------------------------------------------------------------------ */

export interface FactoryProofSaveInput {
  workflow: string;
  outcome: FactoryTestOutcome;
  testTask: string;
  planDigest: string;
  path: string[];
  manualSteps: string[];
  expectedVersion: number | null;
}

/**
 * `factory proof save` (T4, T19): record a test task result for the plan
 * digest that the test ran under. The digest must be the current plan's
 * digest and a kept revision's digest (`plan-digest-mismatch`). On a pass,
 * that revision becomes the `ready` revision.
 */
export function factoryProofSave(env: FactoryEnv, project: FactoryProjectResolution, input: FactoryProofSaveInput) {
  const operation = "factory.proof.save" as const;
  const actedOn = factoryProjectActedOn(project);
  return refusable(operation, actedOn, () => {
    const checkout = project.checkout!;
    const config = readFactoryCheckoutConfig(checkout.root);
    const outcome = withStoreWriteDatabase(env.storeRoot, (db) => {
      const live = factoryWorkflowLiveState(db, { projectId: project.projectId, workflowName: input.workflow, root: checkout.root, config });
      if (live.currentPlanDigest === null) {
        refuse("plan-digest-mismatch", `The current plan of workflow ${input.workflow} cannot be resolved: ${live.reason ?? "it has drifted"}.`, live.nextStep ?? "Save the workflow first.");
      }
      if (live.currentPlanDigest !== input.planDigest) {
        refuse("plan-digest-mismatch", `The digest is not the current plan's digest of workflow ${input.workflow}. The current plan digest is ${live.currentPlanDigest}.`, "Run the test task under the current plan revision and record that digest.", { currentPlanDigest: live.currentPlanDigest });
      }
      // Only a wired plan moves to ready (factory contract, Readiness): each role bound, each needed capability proved.
      if (input.outcome === "passed" && live.readiness !== "wired" && live.readiness !== "ready") {
        refuse("not-ready", `Workflow ${input.workflow} is ${live.readiness}: not every role is bound to an available tool with each capability proved, so a passed test task cannot make it ready.`, live.nextStep ?? "Bind and prove each role, save the workflow, and run the test task again.", { readiness: live.readiness });
      }
      const result = saveFactoryProofResult(db, {
        projectId: project.projectId,
        workflowName: input.workflow,
        outcome: input.outcome,
        testTask: input.testTask,
        planDigest: input.planDigest,
        path: input.path,
        manualSteps: input.manualSteps,
      }, { expectedVersion: input.expectedVersion, now: env.now });
      const binding = readFactoryWorkflowBinding(db, project.projectId, input.workflow)!;
      const after = input.outcome === "passed" ? markFactoryReadyRevision(db, project.projectId, input.workflow, input.planDigest, { expectedVersion: binding.version }) : binding;
      // The latest test result for a plan decides (owner decision 2026-11-24): a failed test of the ready plan ended its ready state.
      return { result, binding: after, revision: live.matchedRevision, readyEnded: input.outcome === "failed" && live.readiness === "ready" };
    });
    const copies = writeCopies(env, project, checkout);
    const passed = input.outcome === "passed";
    const lines = [
      `Saved a ${input.outcome} test task for workflow ${input.workflow} of ${factoryProjectWords(project)}, under plan revision ${outcome.revision ?? "unknown"}.`,
      passed
        ? `Plan revision ${outcome.binding.readyRevision} is now the ready revision. The workflow is ready and takes new work.`
        : outcome.readyEnded
          ? `The workflow was ready, and this failed test task ends that: the latest test result for a plan decides. It is now wired and takes no new work. Reason code: test-failed. Fix what the test task found, then run the test task again and record a pass with make-docs factory proof save --plan-digest ${input.planDigest}.`
          : "The workflow did not become ready. Reason code: test-failed. Fix what the test task found, save the workflow, and run the test task again.",
      ...(input.manualSteps.length ? ["Open manual steps:", ...input.manualSteps.map((step) => `- ${step}`)] : []),
      `Copies: wrote ${copies.written.length} files in checkout ${checkout.root}.`,
    ];
    return finish({
      operation,
      result: "saved" as const,
      actedOn,
      workflow: input.workflow,
      outcome: input.outcome,
      planDigest: input.planDigest,
      revision: outcome.revision,
      readiness: outcome.binding.readiness,
      readinessCode: passed ? null : "test-failed" as const,
      readyEnded: outcome.readyEnded,
      readyRevision: outcome.binding.readyRevision,
      proofVersion: outcome.result.version,
      copies: { written: copies.written, removed: copies.removed },
      lines,
    });
  });
}

/* ------------------------------------------------------------------------ */
/* assignments                                                              */
/* ------------------------------------------------------------------------ */

function unitOf(db: StoreDatabase, projectId: string, reference: string) {
  const ref = normalizeWorkUnitReference(reference);
  const found = ref.kind === "store-id" ? readWorkUnit(db, ref.value) : findWorkUnitByCoordinate(db, projectId, ref.value);
  if (!found || found.projectId !== projectId || (ref.kind === "quick" && found.kind !== "quick-item")) {
    refuse("record-not-found", `No work unit matches "${reference}" in this project.`, "Run make-docs work next to see the units of this project.", { unit: reference });
  }
  return found;
}

/** An assignment as a result shows it. It never holds a claim ID (R-FACTORY-50). */
export function factoryAssignmentView(db: StoreDatabase, assignment: FactoryAssignmentRecord) {
  const unit = readWorkUnit(db, assignment.unitStoreId);
  const plan = readFactoryPlanRevision(db, assignment.projectId, assignment.workflowName, assignment.planRevision);
  return {
    assignmentId: assignment.assignmentId,
    workflow: assignment.workflowName,
    unit: unit ? workUnitLabel(unit) : assignment.unitStoreId,
    unitTitle: unit?.title ?? null,
    role: assignment.role,
    partLabel: assignment.partLabel,
    toolId: assignment.toolId,
    taskHandle: assignment.taskHandle,
    status: assignment.status,
    roundCount: assignment.roundCount,
    roundLimit: plan ? factoryPlanRoundLimit(plan.planJson) : null,
    checkedAt: assignment.checkedAt,
    planRevision: assignment.planRevision,
    planDigest: assignment.planDigest,
    runId: assignment.runId,
    checkoutId: assignment.checkoutId,
    history: assignment.history,
    version: assignment.version,
  };
}
export type FactoryAssignmentView = ReturnType<typeof factoryAssignmentView>;

function assignmentLine(view: FactoryAssignmentView): string {
  const rounds = view.roundLimit === null ? `round ${view.roundCount}` : `round ${view.roundCount} of ${view.roundLimit}`;
  return `- ${view.unit} (${view.role}, part ${view.partLabel}): tool ${view.toolId}, ${view.status}, last check ${view.checkedAt}; ${rounds}. Assignment ${view.assignmentId}, version ${view.version}.`;
}

export interface FactoryAssignmentStartInput {
  workflow: string;
  unit: string;
  role: string;
  partLabel?: string;
  toolId?: string;
  taskHandle?: string;
  runId: string;
  claimId?: string;
  resetRounds?: boolean;
}

/**
 * `factory assignment start` (T5, T13, T21, T24, T33): record a new
 * assignment under the `ready` revision, in the checkout that the call named.
 * Only the holder of the unit's live claim starts it, with the private claim
 * ID, which is never saved or shown.
 */
export function factoryAssignmentStart(env: FactoryEnv, project: FactoryProjectResolution, input: FactoryAssignmentStartInput) {
  const operation = "factory.assignment.start" as const;
  const actedOn = factoryProjectActedOn(project);
  let drift: FactoryDriftEntry[] = [];
  let notReady: string[] = [];
  return refusable(operation, actedOn, () => {
    const checkout = project.checkout!;
    const config = readFactoryCheckoutConfig(checkout.root);
    const view = withStoreWriteDatabase(env.storeRoot, (db) => {
      const unit = unitOf(db, project.projectId, input.unit);
      const live = factoryWorkflowLiveState(db, { projectId: project.projectId, workflowName: input.workflow, root: checkout.root, config });
      drift = live.drift;
      // A not-ready refusal says why and names the next step, also after a failed test task (code test-failed).
      notReady = live.readiness === "ready" || live.drift.length > 0
        ? []
        : [`- The workflow is ${factoryReadinessWords(live.readiness, live.readinessCode)}.${live.reason ? ` ${live.reason}` : ""}${live.nextStep ? ` Next: ${live.nextStep}` : ""}`];
      const binding = readFactoryWorkflowBinding(db, project.projectId, input.workflow);
      const ready = binding?.readyRevision === null || binding?.readyRevision === undefined ? null : readFactoryPlanRevision(db, project.projectId, input.workflow, binding.readyRevision);
      // When the workflow is not ready, the Store service refuses with `not-ready`; the tool name below only has to be well formed.
      let toolId = input.toolId ?? binding?.roles[input.role] ?? "unbound";
      if (ready && ready.planDigest === live.currentPlanDigest) {
        // The job's role and tool come from the ready plan (R-FACTORY-27, R-FACTORY-58). The contract has no substitute
        // tool: another tool is bound through setup, which saves a new plan that needs its own test task.
        const roleTools = ((JSON.parse(ready.planJson) as { roleTools?: Record<string, { toolId: string } | null> }).roleTools ?? {});
        if (!Object.hasOwn(roleTools, input.role)) {
          refuse("invalid-record", `The ready plan of workflow ${input.workflow} has no ${input.role} role. Its roles are ${Object.keys(roleTools).join(", ")}.`, "Start the assignment for one of the plan's roles. A new role needs a config change, a workflow save, and a passed test task.", { field: "role" });
        }
        const bound = roleTools[input.role]?.toolId ?? null;
        if (bound === null) refuse("invalid-record", `The ready plan of workflow ${input.workflow} binds no tool to the ${input.role} role.`, "Bind a tool to the role with factory setup, which saves the workflow and needs a passed test task.", { field: "toolId" });
        if (input.toolId !== undefined && input.toolId !== bound) {
          refuse("invalid-record", `Tool ${input.toolId} is not the tool that the ready plan binds to the ${input.role} role. The bound tool is ${bound}.`, `Leave the tool out, or name ${bound}. To use another tool, bind it with factory setup, which saves the workflow and needs a passed test task.`, { field: "toolId" });
        }
        toolId = bound;
      }
      // The assignment's lifecycle run is a run of this project that has not ended, so a run grant can never outlive a mistyped run.
      const run = db.prepare("SELECT status FROM runs WHERE project_id = ? AND run_id = ?").get(project.projectId, input.runId) as { status: string } | undefined;
      if (!run) {
        refuse("record-not-found", `${factoryProjectWords(project)} has no lifecycle run ${input.runId}.`, "Start the run with make-docs lifecycle start, or name a run that make-docs lifecycle list shows.", { field: "runId" });
      }
      if (run.status === "completed" || run.status === "failed" || run.status === "abandoned") {
        refuse("invalid-record", `Lifecycle run ${input.runId} is ${run.status}, so it takes no new assignment.`, "Start a new lifecycle run for the claim with make-docs lifecycle start.", { field: "runId" });
      }
      const assignment = startFactoryAssignment(db, {
        projectId: project.projectId,
        workflowName: input.workflow,
        checkoutId: checkout.checkoutId,
        unitStoreId: unit.storeId,
        role: input.role,
        partLabel: input.partLabel,
        toolId,
        taskHandle: input.taskHandle ?? null,
        runId: input.runId,
        currentPlanDigest: live.currentPlanDigest ?? "",
        resetRounds: input.resetRounds ?? false,
      }, { claimId: input.claimId ?? "", now: env.now });
      return factoryAssignmentView(db, assignment);
    });
    const lines = [
      `Started an assignment for ${view.unit} (${view.role}, part ${view.partLabel}) in ${factoryProjectWords(project)}, checkout ${checkout.root}.`,
      `Tool ${view.toolId}, status ${view.status}, under plan revision ${view.planRevision}, lifecycle run ${view.runId}. Round count ${view.roundCount}.`,
      `Assignment ID: ${view.assignmentId}. Version ${view.version}.`,
    ];
    return finish({ operation, result: "started" as const, actedOn, assignment: view, checkout: { checkoutId: checkout.checkoutId, root: checkout.root }, lines });
  }, (error) => (error.refusal === "not-ready" ? [...drift.map((entry) => `- ${entry.code}: ${entry.text} Next: ${entry.nextStep}`), ...notReady] : []));
}

export interface FactoryAssignmentSaveInput {
  assignmentId: string;
  expectedVersion: number;
  claimId?: string;
  status?: FactoryAssignmentStatus;
  reason?: FactoryStatusHistoryCode;
  taskHandle?: string;
  /** Record the use of a grant for this action (T17). */
  grantUse?: string;
}

/**
 * `factory assignment save` (T5, T12 to T14, T17, T24): move an assignment
 * along the move table, count correction rounds against the assignment's own
 * plan revision, record a check, or record the use of a grant. Only the
 * holder of the unit's live claim updates it.
 */
export function factoryAssignmentSave(env: FactoryEnv, project: FactoryProjectResolution, input: FactoryAssignmentSaveInput) {
  const operation = "factory.assignment.save" as const;
  const actedOn = factoryProjectActedOn(project);
  return refusable(operation, actedOn, () => {
    const outcome = withStoreWriteDatabase(env.storeRoot, (db) => {
      const current = readFactoryAssignment(db, project.projectId, input.assignmentId);
      if (!current) refuse("record-not-found", "The assignment does not exist in this project.", "Read the assignments with make-docs factory assignment list.");
      const status = input.status ?? current.status;
      if (status !== current.status && input.reason === undefined) {
        refuse("invalid-record", "A status move needs a reason code.", "Give --reason with a status history code from the factory contract.", { field: "reason" });
      }
      const updated = updateFactoryAssignment(db, project.projectId, input.assignmentId, {
        status,
        reason: input.reason ?? "handle-checked",
        ...(input.taskHandle === undefined ? {} : { taskHandle: input.taskHandle }),
      }, { claimId: input.claimId ?? "", expectedVersion: input.expectedVersion, now: env.now });
      const grant = input.grantUse === undefined
        ? null
        : useFactoryGrant(db, { projectId: project.projectId, workflowName: updated.workflowName, action: input.grantUse, runId: updated.runId, unitStoreId: updated.unitStoreId }, { now: env.now });
      return { before: current.status, view: factoryAssignmentView(db, updated), grant, grantUse: grant ? grantUseView(db, grant.use) : null };
    });
    const cleanup = cleanBackups(env, project, outcome.view.checkoutId);
    const moved = outcome.before !== outcome.view.status;
    const lines = [
      moved
        ? `Moved the assignment for ${outcome.view.unit} (${outcome.view.role}, part ${outcome.view.partLabel}) in ${factoryProjectWords(project)} from ${outcome.before} to ${outcome.view.status}.`
        : `Recorded a check of the assignment for ${outcome.view.unit} (${outcome.view.role}, part ${outcome.view.partLabel}) in ${factoryProjectWords(project)}. It stays ${outcome.view.status}.`,
      `Round count ${outcome.view.roundCount}${outcome.view.roundLimit === null ? "" : ` of ${outcome.view.roundLimit}`}. Last check ${outcome.view.checkedAt}. Version ${outcome.view.version}.`,
      ...(outcome.grant ? [`Used the ${outcome.grant.scope} grant for ${outcome.grant.action}${outcome.grant.scope === "once" ? ", which is now spent" : ""}.`] : []),
      ...(isFinalAssignmentStatus(outcome.view.status) ? [`The assignment is ${outcome.view.status}, which is final.`] : []),
      ...(cleanup && cleanup.removed.length ? [`Removed ${count(cleanup.removed.length, "factory backup")} of finished or old work.`] : []),
      ...factoryBackupKeptLines(cleanup?.kept ?? []),
    ];
    return finish({
      operation,
      result: "updated" as const,
      actedOn,
      moved,
      assignment: outcome.view,
      grant: outcome.grant ? grantView(outcome.grant, env.now) : null,
      grantUse: outcome.grantUse,
      backupCleanup: cleanup ? { removed: cleanup.removed.length, kept: cleanup.kept } : null,
      lines,
    });
  });
}

/* ------------------------------------------------------------------------ */
/* backup save and grant use (W30 R0 follow-up, project writes)             */
/* ------------------------------------------------------------------------ */

export interface FactoryBackupSaveInput {
  assignmentId: string;
  claimId?: string;
  /** Each file, as a path inside the checkout: relative to the checkout folder, or absolute. */
  files: string[];
}

/** The claim rule of a factory write that the Store service does not own. The refusal never repeats the claim ID. */
function assertUnitClaimHeld(db: StoreDatabase, unitStoreId: string, claimId: string | undefined, now: Date): void {
  if (typeof claimId !== "string" || claimId.length === 0 || checkWorkUnitWriteClaim(db, unitStoreId, claimId, now) !== null) {
    refuse("claim-not-held", "The caller does not hold the live claim of this work unit.", "Claim the unit with make-docs work claim, or check the claim's task handle before a takeover.", { unitStoreId });
  }
}

/**
 * `factory file-backup save` (W30 R0 follow-up, R-FACTORY-70): before a worker
 * changes a file in a checkout folder without git, copy the file to
 * `.make-docs/backup/factory/` and record the file, its digest, and its
 * assignment, through the P2 backup function. Only the holder of the unit's
 * live claim saves a backup, for an open assignment, in the checkout that the
 * assignment runs in.
 *
 * In a folder with git the result is `not-needed`, not a refusal: git is the
 * undo there (R-FACTORY-44), so nothing is copied or recorded, and the call
 * did no harm. Every file of one call is backed up, or none is: a failure
 * rolls the records back and removes the copies that this call made.
 */
export function factoryBackupSave(env: FactoryEnv, project: FactoryProjectResolution, input: FactoryBackupSaveInput) {
  const operation = "factory.file-backup.save" as const;
  const actedOn = factoryProjectActedOn(project);
  const words = factoryProjectWords(project);
  return refusable(operation, actedOn, () => {
    const checkout = project.checkout!;
    const made: string[] = [];
    const folder = factoryBackupFolder(checkout.root);
    const folderExisted = existsSync(folder);
    try {
      const outcome = withStoreWriteDatabase(env.storeRoot, (db) => {
        const assignment = readFactoryAssignment(db, project.projectId, input.assignmentId);
        if (!assignment) refuse("record-not-found", "The assignment does not exist in this project.", "Read the assignments with make-docs factory assignment list.");
        assertUnitClaimHeld(db, assignment.unitStoreId, input.claimId, env.now);
        if (isFinalAssignmentStatus(assignment.status)) {
          refuse("final-status", `The assignment is ${assignment.status}, which is final, so no worker changes a file for it.`, "Start a new assignment for a job that must run again, then save the backup for that assignment.", { status: assignment.status });
        }
        if (assignment.checkoutId !== checkout.checkoutId) {
          refuse("invalid-record", "The assignment runs in another checkout of this project, so its backups belong in that checkout.", "Name the checkout of the assignment with --target-root <path> (MCP targetRoot).", { field: "targetRoot" });
        }
        const view = factoryAssignmentView(db, assignment);
        if (isInsideGitWorkTree(checkout.root)) return { view, git: true as const, files: [] };
        const files = input.files.map((file) => {
          let saved;
          try {
            saved = backupFactoryFileBeforeChange(db, { projectRoot: checkout.root, projectId: project.projectId, assignmentId: assignment.assignmentId, filePath: file }, { now: env.now });
          } catch (error) {
            if (error instanceof FactoryStoreRefusalError) throw error;
            // The backup function gives plain words for a file it cannot back up. Any other error gets a plain line too:
            // never a raw system error, an absolute path, or file contents.
            const reason = error instanceof FactoryBackupFileError ? error.message : "One of the files cannot be backed up.";
            refuse("invalid-record", reason, "Name a regular file inside the checkout that this account can read, outside the folders that Make Docs owns.", { field: "file" });
          }
          if (saved.status === "backed-up") made.push(saved.record.backupPath);
          const original = path.resolve(checkout.root, file);
          return {
            file: path.relative(checkout.root, original).split(path.sep).join("/"),
            status: saved.status as "backed-up" | "already-backed-up" | "no-file",
            backup: saved.record ? path.relative(checkout.root, saved.record.backupPath).split(path.sep).join("/") : null,
            contentDigest: saved.record?.contentDigest ?? null,
            backedUpAt: saved.record?.backedUpAt ?? null,
          };
        });
        return { view, git: false as const, files };
      });
      const job = `${outcome.view.unit} (${outcome.view.role}, part ${outcome.view.partLabel})`;
      const base = { operation, actedOn, assignmentId: outcome.view.assignmentId, checkout: { checkoutId: checkout.checkoutId, root: checkout.root } };
      if (outcome.git) {
        const lines = [
          `No backup is needed for ${words}, checkout ${checkout.root}: the folder uses git, and git is the undo there.`,
          `Make Docs copied no file and recorded no backup for the assignment of ${job}. Nothing changed.`,
        ];
        return finish({ ...base, result: "not-needed" as const, git: true, files: [], lines });
      }
      const statusWords = { "backed-up": "backed up", "already-backed-up": "already backed up for this assignment, and the first backup stays", "no-file": "no file yet, so no backup is needed" } as const;
      const lines = [
        `Saved the backups of ${count(outcome.files.length, "file")} for the assignment of ${job} in ${words}, checkout ${checkout.root}.`,
        ...outcome.files.map((file) => `- ${file.file}: ${statusWords[file.status]}.${file.backup ? ` Backup ${file.backup}, digest ${file.contentDigest}.` : ""}`),
        `The backups are in ${FACTORY_BACKUP_RELATIVE_PATH}/, and its README.md says how to get a file back. Make Docs removes them when the work is accepted or closed, or after 30 days.`,
      ];
      return finish({ ...base, result: "saved" as const, git: false, files: outcome.files, lines });
    } catch (error) {
      // The Store transaction rolled the records back. Remove only the copies that this call made, so no unrecorded
      // copy stays. A backup of another call is never removed.
      for (const backupPath of made) {
        rmSync(backupPath, { force: true });
        removeEmptyFactoryBackupFolders(path.dirname(backupPath), folder);
      }
      // A refused call that created the backup folder removes it again, also when it made no copy, but only when the
      // folder holds just its own README.md and .gitignore.
      if (!folderExisted) removeUnusedFactoryBackupFolder(checkout.root);
      throw error;
    }
  });
}

export interface FactoryGrantUseInput {
  unit: string;
  workflow: string;
  action: string;
  runId: string;
  claimId?: string;
}

/**
 * `factory grant-use record` (W30 R0 follow-up, R-FACTORY-71): record the use of a
 * grant on the live claim of a unit whose assignments are all final. It is
 * for an action at the end of a scope, such as the merge after the person
 * accepts the whole scope. It needs the claim's private claim ID, checks the
 * grant exactly as `factory assignment save` does, and adds one use row
 * (PRD 53 R-FACTORY-72). A unit with an open assignment is
 * refused with `assignment-open`, because `factory assignment save` records
 * that use.
 */
export function factoryGrantUse(env: FactoryEnv, project: FactoryProjectResolution, input: FactoryGrantUseInput) {
  const operation = "factory.grant-use.record" as const;
  const actedOn = factoryProjectActedOn(project);
  return refusable(operation, actedOn, () => {
    const outcome = withStoreWriteDatabase(env.storeRoot, (db) => {
      const unit = unitOf(db, project.projectId, input.unit);
      const grant = useFactoryGrantOnClaim(db, { projectId: project.projectId, workflowName: input.workflow, action: input.action, runId: input.runId, unitStoreId: unit.storeId }, { claimId: input.claimId ?? "", now: env.now });
      return { unit: workUnitLabel(unit), grant: grantView(grant, env.now), use: grantUseView(db, grant.use) };
    });
    const { grant, use } = outcome;
    const lines = [
      `Recorded the use of the ${grant.scope} grant for ${grant.action} on the claim of ${outcome.unit} in ${factoryProjectWords(project)}.`,
      `Workflow ${input.workflow}, lifecycle run ${input.runId}, at ${use.usedAt}. Grant ID ${grant.grantId}. Use ID ${use.useId}.`,
      ...(grant.scope === "once" ? ["The once grant is now spent."] : []),
      "Do the action now. Make Docs did not do it.",
    ];
    return finish({ operation, result: "used" as const, actedOn, unit: outcome.unit, workflow: input.workflow, action: grant.action, runId: input.runId, usedAt: use.usedAt, grant, grantUse: use, lines });
  });
}

/** Backup cleanup during a normal factory command (R-FACTORY-45). It runs only in a checkout folder that is on this machine. */
function cleanBackups(env: FactoryEnv, project: FactoryProjectResolution, checkoutId: string): FactoryBackupCleanupResult | null {
  const checkout = project.checkouts.find((candidate) => candidate.checkoutId === checkoutId && candidate.exists) ?? (project.checkout?.checkoutId === checkoutId ? project.checkout : null);
  if (!checkout) return null;
  return withStoreWriteDatabase(env.storeRoot, (db) => cleanupFactoryBackups(db, { projectRoot: checkout.root, projectId: project.projectId, checkouts: project.checkouts }, { now: env.now }));
}

/** `factory assignment list` (T29): a project's assignments. It reads only. */
export function factoryAssignmentList(env: FactoryEnv, project: FactoryProjectResolution, input: { workflow?: string; all?: boolean }) {
  const operation = "factory.assignment.list" as const;
  const actedOn = factoryProjectActedOn(project);
  return refusable(operation, actedOn, () => {
    const views = withStoreReadOnlyDatabase(env.storeRoot, (db) => listFactoryAssignments(db, project.projectId, { workflowName: input.workflow, openOnly: !input.all }).map((assignment) => factoryAssignmentView(db, assignment)));
    const lines = [
      factoryProjectChoiceLine(project),
      views.length === 0
        ? `No ${input.all ? "" : "open "}assignment${input.workflow ? ` of workflow ${input.workflow}` : ""}.`
        : `${count(views.length, input.all ? "assignment" : "open assignment")}${input.workflow ? ` of workflow ${input.workflow}` : ""}:`,
      ...views.map((view) => `${assignmentLine(view)} Run ${view.runId}.`),
      FACTORY_READ_TAIL,
    ];
    return finish({ operation, result: "read" as const, actedOn, assignments: views, lines });
  });
}

/* ------------------------------------------------------------------------ */
/* workflow show and list (project reads)                                   */
/* ------------------------------------------------------------------------ */

function liveStateFor(db: StoreDatabase, project: FactoryProjectResolution, workflow: string, checkout: FactoryCheckoutRef | null, config: FactoryCheckoutConfig | null): FactoryWorkflowLiveState {
  if (!checkout || !config) {
    const binding = readFactoryWorkflowBinding(db, project.projectId, workflow);
    const revisions = listFactoryPlanRevisions(db, project.projectId, workflow);
    return {
      workflowName: workflow,
      readiness: "unknown",
      readinessCode: null,
      reason: `The live state needs one checkout, and ${factoryProjectWords(project)} has ${count(project.checkouts.length, "bound checkout")}.`,
      currentPlanDigest: null,
      matchedRevision: null,
      readyRevision: binding?.readyRevision ?? null,
      latestRevision: revisions.at(-1)?.revision ?? null,
      drift: [],
      plan: null,
      typeVersion: null,
      nextStep: "Name one checkout with --target-root <path>, or run the command in a checkout.",
    };
  }
  return factoryWorkflowLiveState(db, { projectId: project.projectId, workflowName: workflow, root: checkout.root, config });
}

function liveView(state: FactoryWorkflowLiveState) {
  const { plan: _plan, ...rest } = state;
  return rest;
}

/** A drift entry with its one smallest fix only: what `factory status`, `factory workflow list`, and a refusal give. */
function smallestFixOnly(entry: FactoryDriftEntry): FactoryDriftEntry {
  const { otherStep: _otherStep, ...rest } = entry;
  return rest;
}

/** The live state without any second fix. Only `factory workflow show` keeps the second fix of a drift entry. */
function liveSummaryView(state: FactoryWorkflowLiveState) {
  return { ...liveView(state), drift: state.drift.map(smallestFixOnly) };
}

function liveLines(state: FactoryWorkflowLiveState, indent = "", withOtherStep = false): string[] {
  const head = `${indent}Workflow ${state.workflowName}: ${factoryReadinessWords(state.readiness, state.readinessCode)}.${state.reason ? ` ${state.reason}` : ""}`;
  const revisions = `${indent}  Ready revision: ${state.readyRevision ?? "none"}. Latest revision: ${state.latestRevision ?? "none"}.`;
  const drift = state.drift.map((entry) => `${indent}  - ${entry.code}: ${entry.text} Next: ${entry.nextStep}${withOtherStep && entry.otherStep ? ` If that cannot work: ${entry.otherStep}` : ""}`);
  const next = state.drift.length === 0 && state.nextStep ? [`${indent}  Next: ${state.nextStep}`] : [];
  return [head, revisions, ...drift, ...next];
}

function proofView(result: FactoryProofResultRecord | null) {
  return result ? { outcome: result.outcome, testTask: result.testTask, planDigest: result.planDigest, path: result.path, manualSteps: result.manualSteps, recordedAt: result.recordedAt, version: result.version } : null;
}

/**
 * `factory workflow show` (T20, T21): one workflow's latest or named
 * revision, the current plan digest from the live sources, the `ready`
 * revision, each drift reason code in plain words, and the grants beside the
 * plan. It writes nothing.
 */
export function factoryWorkflowShow(env: FactoryEnv, project: FactoryProjectResolution, input: { workflow: string; revision?: number; usesBefore?: string }) {
  const operation = "factory.workflow.show" as const;
  const actedOn = factoryProjectActedOn(project);
  return refusable(operation, actedOn, () => {
    const checkout = project.checkout;
    const config = checkout ? readFactoryCheckoutConfig(checkout.root) : null;
    return withStoreReadOnlyDatabase(env.storeRoot, (db) => {
      const binding = readFactoryWorkflowBinding(db, project.projectId, input.workflow);
      if (!binding) refuse("record-not-found", `${factoryProjectWords(project)} has no saved workflow named ${input.workflow}.`, "Run make-docs factory workflow list to see the saved workflows.", { workflow: input.workflow });
      const revisions = listFactoryPlanRevisions(db, project.projectId, input.workflow);
      const shown = input.revision === undefined ? revisions.at(-1) ?? null : revisions.find((revision) => revision.revision === input.revision) ?? null;
      if (input.revision !== undefined && !shown) {
        refuse("record-not-found", `Workflow ${input.workflow} keeps no plan revision ${input.revision}. Kept revisions: ${revisions.map((revision) => revision.revision).join(", ") || "none"}.`, "Name a kept revision, or leave it out for the latest.", { revision: input.revision });
      }
      const live = liveStateFor(db, project, input.workflow, checkout, config);
      // Spent and expired grants stay until the workflow is removed (owner decision 2026-11-24). The result shows every
      // usable grant and the newest spent or expired ones, and gives the totals.
      const allGrants = listFactoryGrants(db, project.projectId, input.workflow).map((grant) => grantView(grant, env.now));
      const pastGrants = allGrants.filter((grant) => grant.state !== "usable");
      const shownPast = new Set(pastGrants.slice(-FACTORY_GRANT_USE_READ_MAX).map((grant) => grant.grantId));
      const grants = allGrants.filter((grant) => grant.state === "usable" || shownPast.has(grant.grantId));
      const grantTotals = { all: allGrants.length, usable: allGrants.length - pastGrants.length, spentOrExpired: pastGrants.length, shown: grants.length };
      // The newest recorded uses, also of a revoked grant (R-FACTORY-72). Beside the plan, never in it, and never in a copy.
      // One page of at most 50. `usesBefore` reads the page of the uses just older than one use, so every use can be read.
      const grantUses = listFactoryGrantUses(db, project.projectId, input.workflow, { beforeUseId: input.usesBefore }).map((use) => grantUseView(db, use));
      const grantUseTotal = countFactoryGrantUses(db, project.projectId, input.workflow);
      const olderGrantUses = grantUses.length === 0 ? 0 : countFactoryGrantUses(db, project.projectId, input.workflow, { beforeUseId: grantUses[0]!.useId });
      const olderUsesBefore = olderGrantUses > 0 ? grantUses[0]!.useId : null;
      const passed = proofView(readFactoryProofResult(db, project.projectId, input.workflow, "passed"));
      const failed = proofView(readFactoryProofResult(db, project.projectId, input.workflow, "failed"));
      const shownWords = shown
        ? `Plan revision ${shown.revision}${shown.revision === revisions.at(-1)?.revision ? " (the latest)" : ""}, saved ${shown.createdAt}. ${shown.revision === binding.readyRevision ? "It is the ready revision." : "It is not the ready revision."}`
        : "No plan revision is saved yet.";
      const lines = [
        factoryProjectChoiceLine(project),
        ...(checkout ? [`Checkout: ${checkout.root}.`] : []),
        ...liveLines(live, "", true),
        `  Current plan digest: ${live.currentPlanDigest ?? "unknown"}.`,
        shownWords,
        `Grants (beside the plan, never in it): ${grants.length === 0 ? "none." : ""}`,
        ...grants.map(grantLine),
        ...(grantTotals.shown < grantTotals.all ? [`Shown: ${grantTotals.shown} of ${count(grantTotals.all, "grant")}. The other ${grantTotals.all - grantTotals.shown} are older spent or expired grants. They stay until the workflow is removed.`] : []),
        `Grant uses (one line for each recorded use, also of a revoked grant): ${grantUses.length === 0 ? "none." : ""}`,
        ...grantUses.map(grantUseLine),
        ...(grantUses.length < grantUseTotal
          ? [`Shown: ${input.usesBefore === undefined ? "the newest " : ""}${grantUses.length} of ${count(grantUseTotal, "grant use")}${input.usesBefore === undefined ? "" : `, the ones just older than ${input.usesBefore}`}. They stay until the workflow is removed.${olderUsesBefore ? ` ${count(olderGrantUses, "older use")} ${olderGrantUses === 1 ? "is" : "are"} not shown. Read the next page with --uses-before ${olderUsesBefore} (MCP usesBefore).` : ""}`]
          : []),
        ...(passed?.manualSteps.length ? ["Open manual steps:", ...passed.manualSteps.map((step) => `- ${step}`)] : []),
        FACTORY_READ_TAIL,
      ];
      return finish({
        operation,
        result: "read" as const,
        actedOn,
        workflow: input.workflow,
        checkout: checkout ? { checkoutId: checkout.checkoutId, root: checkout.root } : null,
        binding: {
          roles: binding.roles,
          worktreeMethod: binding.worktreeMethod,
          channelRef: binding.channelRef,
          wakeMethod: binding.wakeMethod,
          wakeRef: binding.wakeRef,
          knownLosses: binding.knownLosses,
          savedReadiness: binding.readiness,
          version: binding.version,
        },
        live: liveView(live),
        revision: shown
          ? { number: shown.revision, planDigest: shown.planDigest, configDigest: shown.configDigest, bindingDigest: shown.bindingDigest, createdAt: shown.createdAt, isReady: shown.revision === binding.readyRevision, isLatest: shown.revision === revisions.at(-1)?.revision, plan: JSON.parse(shown.planJson) as FactoryJsonValue }
          : null,
        keptRevisions: revisions.map((revision) => revision.revision),
        grants,
        grantTotals,
        grantUses,
        grantUseTotal,
        grantUseShownMax: FACTORY_GRANT_USE_READ_MAX,
        usesBefore: input.usesBefore ?? null,
        olderGrantUses,
        olderUsesBefore,
        proofs: { passed, failed },
        lines,
      });
    });
  });
}

/** `factory workflow list` (T29): every workflow of the project, saved or in the config. It reads only. */
export function factoryWorkflowList(env: FactoryEnv, project: FactoryProjectResolution) {
  const operation = "factory.workflow.list" as const;
  const actedOn = factoryProjectActedOn(project);
  return refusable(operation, actedOn, () => {
    const checkout = project.checkout;
    const config = checkout ? readFactoryCheckoutConfig(checkout.root) : null;
    return withStoreReadOnlyDatabase(env.storeRoot, (db) => {
      const names = new Set(listFactoryWorkflowBindings(db, project.projectId).map((binding) => binding.workflowName));
      if (config?.ok) for (const name of Object.keys(config.workflows)) names.add(name);
      const states = [...names].sort().map((name) => liveStateFor(db, project, name, checkout, config));
      const lines = [
        factoryProjectChoiceLine(project),
        ...(checkout ? [`Checkout: ${checkout.root}.`] : []),
        ...(config && !config.ok ? [`The config of this checkout cannot be read: ${config.reason}`] : []),
        states.length === 0 ? "No factory workflow is in the config or saved yet." : `${count(states.length, "workflow")}:`,
        ...states.flatMap((state) => liveLines(state, "- ")),
        FACTORY_READ_TAIL,
      ];
      return finish({ operation, result: "read" as const, actedOn, checkout: checkout ? { checkoutId: checkout.checkoutId, root: checkout.root } : null, workflows: states.map(liveSummaryView), lines });
    });
  });
}

/* ------------------------------------------------------------------------ */
/* workflow clean (project write, owner decision 2026-11-24)                */
/* ------------------------------------------------------------------------ */

/**
 * The words for a backup record that goes with no file (register D-078, option B; wording of round 4). The software
 * cannot know that the files are gone for good, so the words say what it found and what happens to a file that still exists.
 */
export const FACTORY_BACKUP_NOT_FOUND_WORDS =
  "The files are not found on this computer now (removed, renamed, or on a drive that is not connected). If a file still exists, it stays where it is, and no later Make Docs cleanup finds it:";

/** The order in which a workflow removal deletes, as the result lists the counts. */
const FACTORY_REMOVAL_ORDER = ["factory_backups", "factory_assignments", "factory_grant_uses", "factory_grants", "factory_proof_results", "factory_workflow_plans", "factory_workflow_bindings"] as const;
const FACTORY_REMOVAL_WORDS: Readonly<Record<(typeof FACTORY_REMOVAL_ORDER)[number], string>> = Object.freeze({
  factory_backups: "backup record",
  factory_assignments: "final assignment",
  factory_grant_uses: "grant use",
  factory_grants: "grant",
  factory_proof_results: "test task result",
  factory_workflow_plans: "plan revision",
  factory_workflow_bindings: "saved binding",
});

/**
 * `factory workflow clean` (W30 R0 P6 T15, owner decision 2026-11-24): the
 * reviewed removal of one saved workflow's Store rows. New behavior.
 *
 * Without a review digest it is the review: it changes nothing, lists what a
 * removal would delete, and gives the review digest. With `review` it
 * removes, but only when the digest still matches, so the person approved
 * exactly what goes. It refuses while an assignment of the workflow is open
 * (`assignment-open`), and while a backup record's file is still on this
 * computer in a folder that is not a bound checkout
 * (`backup-file-out-of-reach`): a backup record goes only together with its
 * file. It reaches the backup files in every bound checkout of the project
 * (register D-079, option A). It drops a record whose files are not found on
 * this computer now, after the review listed it by name (register D-078,
 * option B). It cannot know that they are gone for good: a file that still
 * exists stays, and no later cleanup finds it. Before its first delete it checks
 * that every backup file can be deleted safely, and refuses a symbolic link in
 * a path (`backup-path-unsafe`) and a folder that it cannot change
 * (`backup-file-locked`). When a delete still fails, the result is `stopped`:
 * it names what went and what stayed, and the Store matches the disk. It deletes in order: the backup
 * files and their records, the final assignments with their status history,
 * the grant uses, the grants, the test task results, the plan revisions, and
 * the binding. Then it writes the `.make-docs/factory/` copies again. It
 * never edits the config file.
 */
export function factoryWorkflowClean(env: FactoryEnv, project: FactoryProjectResolution, input: { workflow: string; review?: string }) {
  const operation = "factory.workflow.clean" as const;
  const actedOn = factoryProjectActedOn(project);
  const words = factoryProjectWords(project);
  return refusable(operation, actedOn, () => {
    const checkout = project.checkout!;
    const config = readFactoryCheckoutConfig(checkout.root);
    const inConfig = config.ok && Object.hasOwn(config.workflows, input.workflow);
    const read = (db: StoreDatabase) => {
      const facts = readFactoryWorkflowRemovalFacts(db, project.projectId, input.workflow);
      if (!facts) refuse("record-not-found", `${words} has no saved workflow named ${input.workflow}.`, "Run make-docs factory workflow list to see the saved workflows.", { workflow: input.workflow });
      const backups = planFactoryWorkflowBackupRemoval(db, { projectId: project.projectId, workflowName: input.workflow, checkouts: project.checkouts });
      // The digest binds the review to the exact records that the person approved, not only to their counts: each
      // record's identity and version, each plan digest, and each backup record with its file's recorded hash. It
      // also binds what is on the disk: for each backup file, the checkout that holds it and the SHA-256 of its bytes
      // now, and each record that goes without a file. So a record that was added, removed, replaced, or changed, and
      // a backup file whose bytes changed, each give `review-mismatch`.
      const reviewDigest = factoryCanonicalDigest({
        operation,
        projectId: project.projectId,
        workflow: input.workflow,
        openAssignments: facts.openAssignments,
        records: readFactoryWorkflowRemovalIdentity(db, project.projectId, input.workflow) as FactoryJsonValue,
        // Each file that goes: after a folder move, one record can have a copy in more than one checkout, and each copy is bound.
        backupFiles: backups.inReach.flatMap((entry) => entry.files.map((target) => [factoryBackupProjectPath(entry.record.backupPath, entry.record.assignmentId, entry.record.originalPath), target.checkoutId, target.diskDigest])).sort(),
        backupsDropped: backups.dropped.map((entry) => [entry.backup, entry.assignmentId]).sort(),
        backupsChanged: backups.changed.map((entry) => [entry.backup, entry.checkoutId]).sort(),
        backupsOutOfReach: backups.outOfReach.map((entry) => entry.backup).sort(),
        backupsBlocked: backups.blocked.map((entry) => [entry.backup, entry.where]).sort(),
      } as FactoryJsonValue);
      return { facts, backups, reviewDigest };
    };
    // The assignment count of the Store holds every assignment. An open one is not final, and the removal never deletes
    // it: it refuses while one is open. So the review line counts only the final ones, and the refusal line names the open ones.
    const countLines = (counts: Record<(typeof FACTORY_REMOVAL_ORDER)[number], number>, dropped = 0, open = 0) => FACTORY_REMOVAL_ORDER.map((table) =>
      `- ${count(table === "factory_assignments" ? counts[table] - open : counts[table], FACTORY_REMOVAL_WORDS[table])}${table !== "factory_backups" ? "" : dropped === 0 ? ", each with its backup file" : `: ${counts[table] - dropped} with ${counts[table] - dropped === 1 ? "its" : "their"} backup file, and ${dropped} dropped with no file`}.`);
    const openLine = (state: ReturnType<typeof read>) => `${count(state.facts.openAssignments, "assignment")} of this workflow ${state.facts.openAssignments === 1 ? "is" : "are"} open. Finish or cancel each one with make-docs factory assignment save first.`;
    // A file that is still on this machine, in a folder that is not a bound checkout. A record whose files are not
    // found on this computer does not stop the removal (register D-078, option B): the review lists it, and the removal drops it.
    const outOfReachLine = (state: ReturnType<typeof read>) => {
      const entries = state.backups.outOfReach;
      return `${count(entries.length, "backup record")} of this workflow ${entries.length === 1 ? "names a file" : "name files"} that ${entries.length === 1 ? "is" : "are"} still on this computer, in a folder that is not a bound checkout of this project: ${entries.slice(0, 5).map((entry) => entry.backup).join(", ")}${entries.length > 5 ? ", and more" : ""}. A backup record goes only together with its file. Bind the folder with make-docs setup, or remove the folder, then review again.`;
    };
    // A backup file that cannot be deleted safely stops the removal before the first delete (W30 R0 review, 2026-11-24).
    const blockedLine = (state: ReturnType<typeof read>, where: "unsafe-path" | "locked") => {
      const entries = state.backups.blocked.filter((entry) => entry.where === where);
      return `${count(entries.length, "backup file")} of this workflow cannot be deleted: ${entries.slice(0, 5).map((entry) => entry.backup).join(", ")}${entries.length > 5 ? ", and more" : ""}. ${FACTORY_BACKUP_BLOCK_WORDS[where]} ${FACTORY_BACKUP_BLOCK_FIXES[where]}`;
    };
    const hasBlocked = (state: ReturnType<typeof read>, where: "unsafe-path" | "locked") => state.backups.blocked.some((entry) => entry.where === where);
    // The recorded path is not found, and a reachable checkout holds something at the same path inside the project
    // that is not proved to be the record's file. The record is not dropped, and nothing is deleted (round 4, F3).
    const changedLine = (state: ReturnType<typeof read>) => {
      const entries = state.backups.changed;
      return `${count(entries.length, "backup record")} of this workflow ${entries.length === 1 ? "names a file" : "name files"} that moved, and the file at the same place in a checkout of this project is not proved to be the recorded one: ${entries.slice(0, 5).map((entry) => entry.backup).join(", ")}${entries.length > 5 ? ", and more" : ""}. Its bytes are not the recorded ones, or it cannot be read safely. Make Docs does not delete it, and does not drop the record. Look at the file: put the recorded backup back, or move the file away yourself, then review again.`;
    };
    const blockers = (state: ReturnType<typeof read>) => [
      ...(state.facts.openAssignments > 0 ? [openLine(state)] : []),
      ...(state.backups.outOfReach.length > 0 ? [outOfReachLine(state)] : []),
      ...(state.backups.changed.length > 0 ? [changedLine(state)] : []),
      ...(["unsafe-path", "locked"] as const).filter((where) => hasBlocked(state, where)).map((where) => blockedLine(state, where)),
    ];
    // What goes on the disk, by checkout (register D-079, option A): the removal reaches every bound checkout of the
    // project whose folder is on this machine, and the review names each one.
    const byCheckout = (state: ReturnType<typeof read>) => project.checkouts
      .map((candidate) => ({ checkoutId: candidate.checkoutId, root: candidate.root, files: state.backups.inReach.reduce((total, entry) => total + entry.files.filter((target) => target.checkoutId === candidate.checkoutId).length, 0) }))
      .filter((entry) => entry.files > 0);
    // After a folder move, one record can have a copy in more than one checkout. Each copy is listed and counted (round 4, F2).
    const copyLines = (state: ReturnType<typeof read>) => state.backups.inReach.filter((entry) => entry.files.length > 1).map((entry) =>
      `- ${factoryBackupProjectPath(entry.record.backupPath, entry.record.assignmentId, entry.record.originalPath)}: ${entry.files.length} copies of this one backup go, in ${entry.files.map((target) => `checkout ${target.root}`).join(" and ")}.`);
    const fileCount = (state: ReturnType<typeof read>) => state.backups.inReach.reduce((total, entry) => total + entry.files.length, 0);
    const backupLines = (state: ReturnType<typeof read>) => [
      ...(byCheckout(state).length ? ["Backup files that the removal deletes, by checkout:", ...byCheckout(state).map((entry) => `- ${count(entry.files, "backup file")} in checkout ${entry.root}${entry.checkoutId === checkout.checkoutId ? " (the checkout of this call)" : ""}.`)] : []),
      ...copyLines(state),
      ...(state.backups.dropped.length
        ? [
            `${count(state.backups.dropped.length, "backup record")} ${state.backups.dropped.length === 1 ? "goes" : "go"} with no file. ${FACTORY_BACKUP_NOT_FOUND_WORDS}`,
            ...state.backups.dropped.map((entry) => `- ${entry.backup}: record dropped, files not reachable.`),
          ]
        : []),
    ];
    const otherCheckouts = project.checkouts.filter((candidate) => candidate.checkoutId !== checkout.checkoutId);
    const copiesNote = otherCheckouts.length === 0
      ? []
      : [`Only the copies of this checkout were written again. This project has ${count(otherCheckouts.length, "other bound checkout")}: run make-docs factory restore --target-root <that checkout> in each one to write its copies again.`];
    const configLine = inConfig
      ? `The config of checkout ${checkout.root} still has the entry factory.workflows.${input.workflow}. Make Docs never edits it. While it stays, the workflow shows as draft: in the config, but not saved.`
      : `The config of checkout ${checkout.root} has no entry for this workflow, so nothing of it stays.`;
    if (input.review === undefined) {
      const state = withStoreReadOnlyDatabase(env.storeRoot, read);
      const blocked = blockers(state);
      const lines = [
        `Review: removing saved workflow ${input.workflow} from ${words} would delete these Store records, in this order:`,
        ...countLines(state.facts.counts, state.backups.dropped.length, state.facts.openAssignments),
        ...backupLines(state),
        ...(blocked.length ? ["The removal is refused now:", ...blocked.map((line) => `- ${line}`)] : []),
        configLine,
        "A removal cannot be undone. The machine's tool list stays, and so do the project's other workflows and its work.",
        blocked.length
          ? "Fix what is named above, then review again."
          : `To remove it, run: make-docs factory workflow clean ${input.workflow} --review ${state.reviewDigest}, and name the project the same way.`,
        "This review changed nothing.",
      ];
      return finish({
        operation,
        result: "reviewed" as const,
        actedOn,
        workflow: input.workflow,
        reviewDigest: state.reviewDigest,
        removable: blocked.length === 0,
        openAssignments: state.facts.openAssignments,
        counts: state.facts.counts,
        backupFiles: fileCount(state),
        backupsByCheckout: byCheckout(state),
        // The record's own key stays inside: a result names a backup only by its path inside the project.
        backupsDropped: state.backups.dropped.map(({ backupPath: _key, ...shown }) => shown),
        backupsChanged: state.backups.changed,
        backupsOutOfReach: state.backups.outOfReach,
        backupsBlocked: state.backups.blocked,
        inConfig,
        checkout: { checkoutId: checkout.checkoutId, root: checkout.root },
        lines,
      });
    }
    const removed = withStoreWriteDatabase(env.storeRoot, (db) => {
      const state = read(db);
      if (state.reviewDigest !== input.review) {
        refuse("review-mismatch", `The review digest does not match workflow ${input.workflow} as it is now: something changed since the review, or the digest is of another workflow.`, `Review again with make-docs factory workflow clean ${input.workflow}, then use the new digest.`, { field: "review" });
      }
      if (state.facts.openAssignments > 0) {
        refuse("assignment-open", `Workflow ${input.workflow} has ${count(state.facts.openAssignments, "open assignment")}, so it stays.`, "Finish or cancel each open assignment with make-docs factory assignment save, then review the removal again.", { openAssignments: state.facts.openAssignments });
      }
      if (state.backups.outOfReach.length > 0) {
        refuse("backup-file-out-of-reach", outOfReachLine(state), `Then review again with make-docs factory workflow clean ${input.workflow}, and use the new digest.`, { backups: state.backups.outOfReach });
      }
      if (state.backups.changed.length > 0) {
        refuse("backup-file-changed", changedLine(state), `Then review again with make-docs factory workflow clean ${input.workflow}, and use the new digest.`, { backups: state.backups.changed });
      }
      // Before the first delete: every backup file can be deleted safely. A link in a path, or a folder that this
      // account cannot change, refuses the removal here, and nothing changes.
      for (const where of ["unsafe-path", "locked"] as const) {
        if (!hasBlocked(state, where)) continue;
        refuse(
          where === "unsafe-path" ? "backup-path-unsafe" : "backup-file-locked",
          blockedLine(state, where),
          `Then review again with make-docs factory workflow clean ${input.workflow}, and use the new digest.`,
          { backups: state.backups.blocked.filter((entry) => entry.where === where) },
        );
      }
      // Each backup file goes first, then its record, then the rest in order. The Store rows go in one transaction.
      const files = removeFactoryWorkflowBackups(db, project.projectId, state.backups);
      if (files.stoppedAt) {
        // A delete failed after the checks passed. The records of the files that went are deleted with them, and
        // every other record stays, so the Store matches the disk. This transaction commits exactly that.
        return { stopped: files };
      }
      const rest = removeFactoryWorkflowRows(db, project.projectId, input.workflow, { expectedVersion: state.facts.bindingVersion });
      return { counts: { ...rest, factory_backups: files.removed.length + files.dropped.length }, backupFiles: files.filesRemoved, dropped: files.dropped, byCheckout: byCheckout(state) };
    });
    if ("stopped" in removed) {
      const { stoppedAt, removed: went, kept } = removed.stopped!;
      const list = (entries: readonly string[]) => `${entries.slice(0, 10).join(", ")}${entries.length > 10 ? `, and ${entries.length - 10} more` : ""}`;
      const refusal = stoppedAt!.why === "unsafe-path" ? "backup-path-unsafe" as const : "backup-file-locked" as const;
      const reason = `Make Docs could not delete the backup file ${stoppedAt!.backup}. ${FACTORY_BACKUP_BLOCK_WORDS[stoppedAt!.why]}`;
      const nextAction = `${FACTORY_BACKUP_BLOCK_FIXES[stoppedAt!.why]} Then review again with make-docs factory workflow clean ${input.workflow}, name the project the same way, and use the new digest.`;
      const lines = [
        `Stopped: the removal of saved workflow ${input.workflow} from ${words} is not complete. ${reason}`,
        went.length ? `Removed ${count(went.length, "backup file")} with ${went.length === 1 ? "its record" : "their records"}: ${list(went)}.` : "Removed no backup file.",
        `Kept ${count(kept.length, "backup file")} with ${kept.length === 1 ? "its record" : "their records"}: ${list(kept)}.`,
        "Every other record of the workflow stays: its assignments, grant uses, grants, test task results, plan revisions, and binding. The Store matches the files on the disk.",
        `Next: ${nextAction}`,
        `Reason code: ${refusal}.`,
      ];
      return finish({
        operation,
        result: "stopped" as const,
        // The CLI exits 1 for a result that was not accepted.
        accepted: false as const,
        actedOn,
        workflow: input.workflow,
        refusal,
        reason,
        nextAction,
        backupsRemoved: went,
        backupsKept: kept,
        stoppedAt,
        checkout: { checkoutId: checkout.checkoutId, root: checkout.root },
        lines,
      });
    }
    const copies = writeCopies(env, project, checkout);
    const lines = [
      `Removed saved workflow ${input.workflow} from ${words}. Deleted, in this order:`,
      ...countLines(removed.counts!, removed.dropped!.length),
      ...(removed.byCheckout!.length ? ["Backup files deleted, by checkout:", ...removed.byCheckout!.map((entry) => `- ${count(entry.files, "backup file")} in checkout ${entry.root}.`)] : []),
      ...(removed.dropped!.length ? [`Backup records dropped with no file. ${FACTORY_BACKUP_NOT_FOUND_WORDS}`, ...removed.dropped!.map((backup) => `- ${backup}: record dropped, files not reachable.`)] : []),
      configLine,
      `Copies: wrote ${copies.written.length} files in checkout ${checkout.root}${copies.removed.length ? `, and removed ${copies.removed.join(", ")}` : ""}.`,
      ...copiesNote,
      "The machine's tool list stays, and so do the project's other workflows and its work.",
    ];
    return finish({
      operation,
      result: "removed" as const,
      actedOn,
      workflow: input.workflow,
      counts: removed.counts!,
      backupFilesRemoved: removed.backupFiles!,
      backupsByCheckout: removed.byCheckout!,
      backupsDropped: removed.dropped!,
      inConfig,
      checkout: { checkoutId: checkout.checkoutId, root: checkout.root },
      copies: { written: copies.written, removed: copies.removed },
      otherCheckouts: otherCheckouts.length,
      lines,
    });
  });
}

/* ------------------------------------------------------------------------ */
/* restore (project)                                                        */
/* ------------------------------------------------------------------------ */

/** `factory restore` (T6): write the `.make-docs/factory/` copies of one checkout again from the Store, and clean up old backups. */
export function factoryRestore(env: FactoryEnv, project: FactoryProjectResolution) {
  const operation = "factory.restore" as const;
  const actedOn = factoryProjectActedOn(project);
  return refusable(operation, actedOn, () => {
    const checkout = project.checkout!;
    const copies = writeCopies(env, project, checkout);
    const cleanup = cleanBackups(env, project, checkout.checkoutId);
    const lines = [
      `Wrote the factory copies of ${factoryProjectWords(project)} again in checkout ${checkout.root}: ${copies.written.join(", ")}.`,
      ...(copies.removed.length ? [`Removed copies that the Store no longer backs: ${copies.removed.join(", ")}.`] : []),
      "The copies hold no grant. Make Docs never reads them as input.",
      ...(cleanup && cleanup.removed.length ? [`Removed ${count(cleanup.removed.length, "factory backup")} of finished or old work.`] : []),
      ...factoryBackupKeptLines(cleanup?.kept ?? []),
    ];
    return finish({
      operation,
      result: "restored" as const,
      actedOn,
      checkout: { checkoutId: checkout.checkoutId, root: checkout.root },
      copies: { folder: copies.folder, written: copies.written, removed: copies.removed },
      backupCleanup: cleanup ? { removed: cleanup.removed.length, kept: cleanup.kept } : null,
      lines,
    });
  });
}

/* ------------------------------------------------------------------------ */
/* status (project read)                                                    */
/* ------------------------------------------------------------------------ */

function isInside(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

interface StatusRow extends FactoryAssignmentView {
  toolLabel: string | null;
  toolState: string | null;
  claim: Omit<WorkVisibleClaim, "namedByCaller"> | null;
}

/**
 * `factory status` (T8, T9, T29, T33, register D-073): one project, with one
 * group for each running factory, by checkout and then by lifecycle run. Each
 * checkout group shows its own readiness from that checkout's config file and
 * type file. A checkout with an open assignment gets a group, and so does the
 * checkout that the call named or ran in. `run` shows one lifecycle run.
 * Human words come first; the exact detail follows in the machine fields.
 */
export function factoryStatus(env: FactoryEnv, project: FactoryProjectResolution, input: { run?: string; cwd: string }) {
  const operation = "factory.status" as const;
  const actedOn = factoryProjectActedOn(project);
  return refusable(operation, actedOn, () => withStoreReadOnlyDatabase(env.storeRoot, (db) => {
    const tools = listFactoryMachineTools(db);
    const toolsById = new Map(tools.map((tool) => [tool.toolId, tool]));
    const open = listFactoryAssignments(db, project.projectId, { openOnly: true });
    const claims = new Map(listWorkClaims(db, project.projectId).map((claim) => [claim.unitStoreId, claim]));
    const callCheckout = project.checkout ?? project.checkouts.find((checkout) => checkout.exists && isInside(checkout.root, input.cwd)) ?? null;
    const groupIds = new Set<string>(open.map((assignment) => assignment.checkoutId));
    if (callCheckout) groupIds.add(callCheckout.checkoutId);
    const bindings = listFactoryWorkflowBindings(db, project.projectId);
    const groups = [...groupIds].map((checkoutId) => {
      const checkout = project.checkouts.find((candidate) => candidate.checkoutId === checkoutId) ?? null;
      const config: FactoryCheckoutConfig = !checkout
        ? { ok: false, reason: "The checkout is no longer bound to this project." }
        : !checkout.exists
          ? { ok: false, reason: "The checkout folder is gone from this machine." }
          : readFactoryCheckoutConfig(checkout.root);
      const names = new Set(bindings.map((binding) => binding.workflowName));
      if (config.ok) for (const name of Object.keys(config.workflows)) names.add(name);
      const workflows = [...names].sort().map((name) => factoryWorkflowLiveState(db, { projectId: project.projectId, workflowName: name, root: checkout?.root ?? "", config, tools }));
      const manualSteps = [...names].sort().flatMap((name) => (readFactoryProofResult(db, project.projectId, name, "passed")?.manualSteps ?? []).map((step) => ({ workflow: name, step })));
      const runIds = [...new Set(open.filter((assignment) => assignment.checkoutId === checkoutId).map((assignment) => assignment.runId))].sort();
      const runs = runIds.map((runId) => ({
        runId,
        assignments: open.filter((assignment) => assignment.checkoutId === checkoutId && assignment.runId === runId).map((assignment): StatusRow => {
          const view = factoryAssignmentView(db, assignment);
          const tool = toolsById.get(view.toolId) ?? null;
          const claim = claims.get(assignment.unitStoreId);
          const visible = claim ? visibleWorkClaim(claim, null, env.now) : null;
          return { ...view, toolLabel: tool?.label ?? null, toolState: tool?.state ?? null, claim: visible ? { claimant: visible.claimant, taskHandle: visible.taskHandle, claimedAt: visible.claimedAt, renewedAt: visible.renewedAt, expiresAt: visible.expiresAt, live: visible.live } : null };
        }),
      }));
      return {
        checkoutId,
        root: checkout?.root ?? null,
        thisCheckout: callCheckout?.checkoutId === checkoutId,
        readable: config.ok,
        reason: config.ok ? null : config.reason,
        workflows: workflows.map(liveSummaryView),
        manualSteps,
        runs,
      };
    }).sort((left, right) => Number(right.thisCheckout) - Number(left.thisCheckout) || String(left.root).localeCompare(String(right.root)));
    const shown = input.run === undefined
      ? groups
      : groups.map((group) => ({ ...group, runs: group.runs.filter((run) => run.runId === input.run) })).filter((group) => group.runs.length > 0);
    const assigned = new Set(open.map((assignment) => assignment.unitStoreId));
    const claimedOnly = [...claims.values()].filter((claim) => claim.expiresAt > env.now.toISOString() && !assigned.has(claim.unitStoreId)).map((claim) => {
      const unit = readWorkUnit(db, claim.unitStoreId);
      return { unit: unit ? workUnitLabel(unit) : claim.unitStoreId, claimant: claim.claimant, expiresAt: claim.expiresAt };
    });
    // The age of each bound tool's proofs (owner decision 2026-11-24). A proof older than 30 days is called old; that
    // changes no readiness. Only an agent can check a tool again.
    const boundRoles = new Map<string, Array<{ workflow: string; role: string }>>();
    for (const binding of bindings) {
      for (const [role, toolId] of Object.entries(binding.roles)) boundRoles.set(toolId, [...(boundRoles.get(toolId) ?? []), { workflow: binding.workflowName, role }]);
    }
    const dayMs = 24 * 60 * 60 * 1000;
    const ageDays = (time: string) => Math.max(0, Math.floor((env.now.getTime() - new Date(time).getTime()) / dayMs));
    const boundTools = [...boundRoles.keys()].sort().map((toolId) => {
      const tool = toolsById.get(toolId) ?? null;
      const proofs = (tool?.proofs ?? []).map((proof) => {
        const days = ageDays(proof.provedAt);
        return { capabilityId: proof.capabilityId, result: proof.result, toolVersion: proof.toolVersion, provedAt: proof.provedAt, ageDays: days, old: days > FACTORY_PROOF_OLD_AFTER_DAYS };
      });
      return {
        toolId,
        label: tool?.label ?? null,
        state: tool?.state ?? null,
        reportedVersion: tool?.reportedVersion ?? null,
        reportedAt: tool?.reportedAt ?? null,
        reportedAgeDays: tool ? ageDays(tool.reportedAt) : null,
        roles: boundRoles.get(toolId)!,
        proofs,
        oldestProofAgeDays: proofs.length ? Math.max(...proofs.map((proof) => proof.ageDays)) : null,
        hasOldProof: proofs.some((proof) => proof.old),
      };
    });
    const dayWords = (days: number) => (days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"} ago`);
    const lines = [`Factory status for ${factoryProjectWords(project)}${project.chosenBy === "named" ? ", as named" : ", taken from the current folder"}.`];
    if (input.run !== undefined) lines.push(`Only lifecycle run ${input.run}.`);
    if (shown.length === 0) {
      lines.push(input.run === undefined ? "No factory runs here, and no checkout of this project was named or is the current folder." : `No open assignment runs under lifecycle run ${input.run}.`);
    }
    for (const group of shown) {
      lines.push(`Checkout ${group.root ?? group.checkoutId}${group.thisCheckout ? " (the checkout of this call)" : ""}:`);
      if (!group.readable) lines.push(`  Readiness: unknown. ${group.reason}`);
      for (const workflow of groups.find((candidate) => candidate.checkoutId === group.checkoutId)!.workflows) {
        if (!group.readable) continue;
        const revision = workflow.matchedRevision !== null ? ` Plan revision ${workflow.matchedRevision}.` : workflow.readyRevision !== null ? ` Ready revision ${workflow.readyRevision}.` : "";
        lines.push(`  Workflow ${workflow.workflowName}: ${factoryReadinessWords(workflow.readiness, workflow.readinessCode)}.${revision}${workflow.reason ? ` ${workflow.reason}` : ""}`);
        for (const entry of workflow.drift) lines.push(`    - ${entry.code}: ${entry.text} Next: ${entry.nextStep}`);
        if (workflow.drift.length === 0 && workflow.readiness !== "ready" && workflow.nextStep) lines.push(`    Next: ${workflow.nextStep}`);
      }
      if (group.manualSteps.length) lines.push("  Open manual steps:", ...group.manualSteps.map((entry) => `    - ${entry.workflow}: ${entry.step}`));
      if (group.runs.length === 0) lines.push("  No open assignment.");
      for (const run of group.runs) {
        lines.push(`  Lifecycle run ${run.runId}:`);
        for (const row of run.assignments) {
          const tool = row.toolLabel ? `${row.toolId} (${row.toolLabel}${row.toolState && row.toolState !== "available" ? `, ${row.toolState}` : ""})` : row.toolId;
          const claim = row.claim ? (row.claim.live ? `claimed by ${row.claim.claimant} until ${row.claim.expiresAt}` : `claim by ${row.claim.claimant} ended ${row.claim.expiresAt}`) : "no claim";
          lines.push(`    - ${row.unit} (${row.role}, part ${row.partLabel}): tool ${tool}, ${row.status}, last check ${row.checkedAt}; round ${row.roundCount}${row.roundLimit === null ? "" : ` of ${row.roundLimit}`}; ${claim}.`);
        }
      }
    }
    if (input.run === undefined && claimedOnly.length) {
      lines.push("Claimed units with no open assignment:", ...claimedOnly.map((entry) => `- ${entry.unit}: claimed by ${entry.claimant} until ${entry.expiresAt}.`));
    }
    if (input.run === undefined && boundTools.length) {
      lines.push(`Bound tools of this machine, with the age of each proof. A proof older than ${FACTORY_PROOF_OLD_AFTER_DAYS} days is old:`);
      for (const tool of boundTools) {
        if (tool.state === null) {
          lines.push(`- ${tool.toolId}: not in this machine's tool list. Report it with make-docs factory tools save.`);
          continue;
        }
        lines.push(`- ${tool.toolId} (${tool.label}): ${tool.state}, version ${tool.reportedVersion ?? "not reported"}, last reported ${dayWords(tool.reportedAgeDays!)}.${tool.proofs.length === 0 ? " No capability proof." : ""}`);
        for (const proof of tool.proofs) {
          lines.push(`  - ${proof.capabilityId}: ${proof.result} ${dayWords(proof.ageDays)}${proof.old ? `. Old: older than ${FACTORY_PROOF_OLD_AFTER_DAYS} days. Check the tool again and save it with make-docs factory tools save` : ""}.`);
        }
      }
    }
    lines.push(FACTORY_READ_TAIL);
    return finish({
      operation,
      result: "read" as const,
      actedOn,
      run: input.run ?? null,
      proofOldAfterDays: FACTORY_PROOF_OLD_AFTER_DAYS,
      boundTools: input.run === undefined ? boundTools : [],
      checkouts: shown,
      claimedWithoutAssignment: input.run === undefined ? claimedOnly : [],
      finalStatuses: [...FACTORY_FINAL_STATUSES],
      lines,
    });
  }));
}
