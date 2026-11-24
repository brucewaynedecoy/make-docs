import path from "node:path";
import { z } from "zod";

import {
  STORE_READ_PROJECT_READ_ACCESS,
  STORE_WRITE_PROJECT_READ_ACCESS,
  STORE_WRITE_PROJECT_WRITE_ACCESS,
  type OperationAccess,
} from "../access";
import type { OperationExecutionContext } from "../context";
import type { McpToolMetadata } from "../mcp-metadata";
import type { OperationDefinition, OperationTargetResolution } from "../registry";
import { StoreAccessStateError, makeStoreAccessStateError } from "../store-access";
import type { JsonValue } from "../types";
import {
  FACTORY_OPERATION_SCOPES,
  factoryProjectWords,
  isFactoryProjectRefusal,
  resolveFactoryProject,
  type FactoryOperationId,
  type FactoryProjectResolution,
} from "./project-scope";
import {
  FACTORY_ASSIGNMENT_STATUSES,
  FACTORY_GRANT_SCOPES,
  FACTORY_PROOF_RESULTS,
  FACTORY_STATUS_HISTORY_CODES,
  FACTORY_TEST_OUTCOMES,
  FACTORY_TOOL_KINDS,
  FACTORY_TOOL_STATES,
  FACTORY_WAKE_METHODS,
} from "./records";
import {
  factoryAssignmentList,
  factoryAssignmentStart,
  factoryAssignmentSave,
  factoryBackupSave,
  factoryGrantUse,
  factoryProjectRefusalResult,
  factoryProofSave,
  factoryRestore,
  factoryStatus,
  factoryToolsList,
  factoryToolsSave,
  factoryWorkflowList,
  factoryWorkflowSave,
  factoryWorkflowShow,
  type FactoryEnv,
} from "./service";

/**
 * W30 R0 P3 `factory` operations (PRD 53 R-FACTORY-49, PRD 39 R-RUN-4). The
 * MCP tools are `factory_status` to `factory_restore`, in the `factory`
 * profile and `all`. Each operation checks and records; none launches,
 * schedules, messages, or contacts a tool.
 *
 * Project scope (T25 to T29): `factory tools save` and `factory tools list`
 * act on this machine and take no project. Every other operation acts on one project. A write names
 * it with `targetRoot` or `project` and never uses the current folder; a read
 * may use the current folder's project and says so. `resolveTarget` finds the
 * project before the access check, so the grant of that project's own
 * checkout admits the call, also when the agent works in another folder (T31,
 * PRD 25 R-ACCESS-6, register D-075).
 */

const MCP: McpToolMetadata = { profiles: ["factory"], defaultExposure: "deferred" };
const MACHINE_WRITE_ACCESS: OperationAccess = Object.freeze({ store: "write", project: "none", hostConfig: "none" });
const MACHINE_READ_ACCESS: OperationAccess = Object.freeze({ store: "read", project: "none", hostConfig: "none" });
const READ_SUMMARY = "Changes nothing.";

const targetRoot = z.string().min(1).optional()
  .describe("The project checkout folder. A write names its project with targetRoot or project; it never uses the current folder.");
const project = z.string().trim().min(1).optional()
  .describe("The project name (or project ID) in the Store's project register. A write names its project with targetRoot or project.");
const readTargetRoot = z.string().min(1).optional()
  .describe("The project checkout folder. The default is the project of the current folder, and the result says so.");
const readProject = z.string().trim().min(1).optional()
  .describe("The project name (or project ID) in the Store's project register. The default is the project of the current folder.");
const workflow = z.string().trim().min(1).describe("The workflow name, as the factory block of the config names it.");
const name = z.string().trim().min(1);
/** Free text is checked by the never-log rule in the Store service, which names the field and never the value (T22). */
const text = z.string();

const toolInput = z.object({
  toolId: name.describe("The tool ID, a lower-case kebab-case name such as tool-a."),
  kind: z.enum(FACTORY_TOOL_KINDS),
  label: text.describe("A short label for people, one line of at most 120 characters."),
  state: z.enum(FACTORY_TOOL_STATES).describe("available, missing, or blocked, as the agent found it."),
  reportedVersion: text.nullable().describe("The version that the tool reports, or null."),
  capabilities: z.array(name).describe("The capability IDs from the factory contract's capability catalog."),
  proofs: z.array(z.object({
    capabilityId: name,
    method: text.describe("How setup proved it, as one short line."),
    toolVersion: text.nullable().describe("The tool version that the proof ran under."),
    provedAt: z.string().min(1).describe("When the proof ran, as an ISO-8601 time."),
    result: z.enum(FACTORY_PROOF_RESULTS),
    notCovered: z.array(text).describe("Each part that the proof did not test, one short line each."),
  }).strict()),
  expectedVersion: z.number().int().positive().nullable().describe("The tool record version that you read, or null for a new tool."),
}).strict();

const toolsSaveInput = z.object({ tools: z.array(toolInput).min(1).max(64) }).strict();

const bindingInput = z.object({
  roles: z.record(name, name).describe("For each role, the bound tool ID."),
  worktreeMethod: name.describe("The working-copy method, as a kebab-case name such as none or worktree."),
  channelRef: text.nullable().default(null).describe("The human channel account, as a reference that holds no secret."),
  wakeMethod: z.enum(FACTORY_WAKE_METHODS),
  wakeRef: text.nullable().default(null).describe("The wake binding, as a reference that holds no secret."),
  knownLosses: z.array(text).default([]).describe("Each known loss that the person accepted, one short line each."),
}).strict();

const grantsInput = z.object({
  add: z.array(z.object({
    action: name.describe("The action, such as merge, deploy, publish, or spend."),
    scope: z.enum(FACTORY_GRANT_SCOPES),
    runId: z.string().min(1).nullable().default(null).describe("The lifecycle run of a run grant; null for other scopes."),
    expiresAt: z.string().min(1).nullable().default(null).describe("An ISO-8601 expiry time, or null."),
    grantedBy: text.describe("Who granted it, as a short label."),
  }).strict()).default([]),
  revoke: z.array(z.object({ grantId: name, expectedVersion: z.number().int().positive() }).strict()).default([]),
}).strict();

const workflowSaveInput = z.object({
  targetRoot,
  project,
  workflow,
  expectedVersion: z.number().int().positive().nullable().default(null).describe("The workflow version that you read, or null for a new workflow. A grant-only save needs none."),
  binding: bindingInput.optional().describe("The saved choices. Leave it out for a grant-only save."),
  readiness: z.literal("ready").optional().describe("Ask for ready. It is refused unless a passed test task ran under the plan that this save gives."),
  grants: grantsInput.optional().describe("Grants to write or revoke. Grants are never part of the plan."),
}).strict().refine((input) => input.binding !== undefined || input.grants !== undefined, "Give binding, grants, or both.");

const workflowShowInput = z.object({
  targetRoot: readTargetRoot,
  project: readProject,
  workflow,
  revision: z.number().int().positive().optional().describe("A kept plan revision number. The default is the latest."),
}).strict();
const workflowListInput = z.object({ targetRoot: readTargetRoot, project: readProject }).strict();

const proofSaveInput = z.object({
  targetRoot,
  project,
  workflow,
  outcome: z.enum(FACTORY_TEST_OUTCOMES),
  testTask: text.describe("The test task, as one short line."),
  planDigest: z.string().min(1).describe("The plan digest that the test task ran under. It must be the current plan's digest."),
  path: z.array(text).min(1).describe("The path that the test task exercised, one short line for each step."),
  manualSteps: z.array(text).default([]).describe("Each open manual step, one short line each."),
  expectedVersion: z.number().int().positive().nullable().default(null).describe("The version of the last result with this outcome, or null for the first."),
}).strict();

const assignmentStartInput = z.object({
  targetRoot,
  project,
  workflow,
  unit: z.string().trim().min(1).describe("The work unit: a coordinate such as W29 R0 P4, or a quick item number."),
  role: name,
  partLabel: name.optional().describe("The part label of this job. The default is main."),
  toolId: name.optional().describe("The tool doing the job. It must be the tool that the ready plan binds to the role, which is the default."),
  taskHandle: z.string().min(1).optional().describe("A handle that another agent can check, such as a task or session ID."),
  runId: z.string().min(1).describe("The lifecycle run of the claim: a run of this project that has not ended."),
  claimId: z.string().optional().describe("Your private claim ID of the unit's live claim. It is checked and never saved or shown."),
  resetRounds: z.boolean().default(false).describe("Spend a once grant for reset-correction-rounds, so the new assignment starts at round 0."),
}).strict();

const assignmentUpdateInput = z.object({
  targetRoot,
  project,
  assignmentId: name.describe("The assignment ID from assignment start or assignment list."),
  expectedVersion: z.number().int().positive().describe("The assignment version that you read."),
  claimId: z.string().optional().describe("Your private claim ID of the unit's live claim. It is checked and never saved or shown."),
  status: z.enum(FACTORY_ASSIGNMENT_STATUSES).optional().describe("The new status. Leave it out to record a check only."),
  reason: z.enum(FACTORY_STATUS_HISTORY_CODES).optional().describe("The status history reason code of a move."),
  taskHandle: z.string().min(1).optional().describe("A new task handle."),
  grantUse: name.optional().describe("Record the use of a grant for this action, such as merge."),
}).strict();

const assignmentListInput = z.object({
  targetRoot: readTargetRoot,
  project: readProject,
  workflow: name.optional().describe("Only this workflow."),
  all: z.boolean().default(false).describe("Also list final assignments."),
}).strict();

const restoreInput = z.object({ targetRoot, project }).strict();
/** `factory tools list` takes no input: it acts on this machine. */
const toolsListInput = z.object({}).strict();
const backupSaveInput = z.object({
  targetRoot,
  project,
  assignmentId: name.describe("The assignment ID of the job whose worker changes the files."),
  claimId: z.string().optional().describe("Your private claim ID of the unit's live claim. It is checked and never saved or shown."),
  files: z.array(z.string().min(1).max(4096)).min(1).max(64).describe("Each file to back up before the worker changes it, as a path inside the checkout."),
}).strict();
const grantUseInput = z.object({
  targetRoot,
  project,
  unit: z.string().trim().min(1).describe("The claimed work unit: a coordinate such as W29 R0 P4, or a quick item number. Each of its assignments is final."),
  workflow,
  action: name.describe("The action that the grant permits, such as merge."),
  runId: z.string().min(1).describe("The lifecycle run of the unit's assignments."),
  claimId: z.string().optional().describe("Your private claim ID of the unit's live claim. It is checked and never saved or shown."),
}).strict();
const statusInput = z.object({
  targetRoot: readTargetRoot,
  project: readProject,
  run: z.string().min(1).optional().describe("Show only this lifecycle run."),
}).strict();

const json = (value: unknown) => value as JsonValue;

function envOf(context: OperationExecutionContext): FactoryEnv {
  return { storeRoot: context.storeRoot, now: new Date(context.now()) };
}

/** The resolved project of each parsed input, from `resolveTarget` to the handler. */
const RESOLVED = new WeakMap<object, FactoryProjectResolution>();

function accessWords(access: OperationAccess): string {
  return access.store === "write" ? "Store write" : "Store read";
}

/**
 * The target of a factory call (T26, T27, T31). A machine call is admitted by
 * the grant of the folder where it runs. A project call resolves its project
 * first: a typed project refusal returns as the result and changes nothing,
 * and otherwise that project's own checkout gives the grant that admits it.
 */
function factoryTarget(operation: FactoryOperationId, access: OperationAccess) {
  return (input: unknown, context: OperationExecutionContext): OperationTargetResolution => {
    if (FACTORY_OPERATION_SCOPES[operation].scope === "machine") return { targetRoot: path.resolve(context.cwd) };
    const record = input as { targetRoot?: string; project?: string; binding?: unknown };
    const needsCheckout = operation === "factory.workflow.save" ? record.binding !== undefined : undefined;
    const resolution = resolveFactoryProject(record, { operation, cwd: context.cwd, storeRoot: context.storeRoot, needsCheckout });
    if (isFactoryProjectRefusal(resolution)) return { refusal: json(factoryProjectRefusalResult(operation, resolution)) };
    RESOLVED.set(input as object, resolution);
    const words = factoryProjectWords(resolution);
    return {
      targetRoot: resolution.harnessRoot,
      // R-FACTORY-67: without the acted-on project's own grant, the call is `store-denied`, names the project, and says how to grant it.
      // A project with no harness access configuration gives this caller no grant either.
      explainDenial: (error: StoreAccessStateError) => makeStoreAccessStateError({
        code: error.code === "store-not-configured" ? "store-denied" : error.code,
        operation: error.operation,
        reason: `${error.reason} This call acts on ${words}, so that project's own grant decides, also when the agent works in another folder.`,
        nextAction: error.code === "store-denied" || error.code === "store-not-configured"
          ? `Allow ${accessWords(access)} for this agent in ${words}: run \`make-docs setup --target ${JSON.stringify(resolution.harnessRoot)}\` and grant ${accessWords(access)} to this harness, then retry.`
          : error.nextAction,
        details: { ...error.details, projectId: resolution.projectId, projectName: resolution.projectName },
      }),
    };
  };
}

function resolutionOf(operation: FactoryOperationId, input: object, context: OperationExecutionContext): FactoryProjectResolution {
  const known = RESOLVED.get(input);
  if (known) return known;
  // A direct handler call (tests) resolves the same way.
  const resolution = resolveFactoryProject(input as { targetRoot?: string; project?: string }, { operation, cwd: context.cwd, storeRoot: context.storeRoot });
  if (isFactoryProjectRefusal(resolution)) throw new Error(`${operation}: ${resolution.reason}`);
  return resolution;
}

function definition<T extends z.ZodTypeAny>(
  id: FactoryOperationId,
  summary: string,
  access: OperationAccess,
  schema: T,
  run: (input: z.infer<T>, context: OperationExecutionContext, project: FactoryProjectResolution | null) => unknown,
): OperationDefinition {
  const scope = FACTORY_OPERATION_SCOPES[id];
  return {
    id,
    summary,
    mutates: scope.kind,
    access,
    // A machine call opens its own Store session with no project folder (T25).
    ...(scope.scope === "machine" ? { storeAdmission: "handler" as const } : {}),
    status: "active",
    mcp: MCP,
    inputSchema: schema,
    resolveTarget: factoryTarget(id, access),
    handler(raw, context) {
      const input = raw as z.infer<T>;
      const resolved = scope.scope === "machine" ? null : resolutionOf(id, input as object, context);
      return json(run(input, context, resolved));
    },
  };
}

export const factoryOperations: OperationDefinition[] = [
  definition(
    "factory.status",
    `Show one project's factory: one group for each checkout that runs one, then each lifecycle run, with readiness, claimed units, tools, states, and last checks in plain words. ${READ_SUMMARY}`,
    STORE_READ_PROJECT_READ_ACCESS,
    statusInput,
    (input, context, resolved) => factoryStatus(envOf(context), resolved!, { run: input.run, cwd: context.cwd }),
  ),
  definition(
    "factory.tools.save",
    "Check and save this machine's agent tools and their capability proofs, as the agent reports them. It takes no project and contacts no tool.",
    MACHINE_WRITE_ACCESS,
    toolsSaveInput,
    (input, context) => factoryToolsSave(envOf(context), input),
  ),
  definition(
    "factory.workflow.save",
    "Check and save one workflow's choices and tool bindings, and save a new plan revision when the plan changed; or write or revoke grants only.",
    STORE_WRITE_PROJECT_WRITE_ACCESS,
    workflowSaveInput,
    (input, context, resolved) => factoryWorkflowSave(envOf(context), resolved!, input),
  ),
  definition(
    "factory.workflow.show",
    `Show one workflow's latest or named plan revision, its live readiness and drift reasons, and its grants beside the plan. ${READ_SUMMARY}`,
    STORE_READ_PROJECT_READ_ACCESS,
    workflowShowInput,
    (input, context, resolved) => factoryWorkflowShow(envOf(context), resolved!, input),
  ),
  definition(
    "factory.workflow.list",
    `List one project's factory workflows with their live readiness. ${READ_SUMMARY}`,
    STORE_READ_PROJECT_READ_ACCESS,
    workflowListInput,
    (_input, context, resolved) => factoryWorkflowList(envOf(context), resolved!),
  ),
  definition(
    "factory.proof.save",
    "Save a test task result for the current plan, and make that plan revision the ready revision when the test task passed.",
    STORE_WRITE_PROJECT_WRITE_ACCESS,
    proofSaveInput,
    (input, context, resolved) => factoryProofSave(envOf(context), resolved!, input),
  ),
  definition(
    "factory.assignment.start",
    "Record a new assignment of one job to a tool, under the ready plan revision, in the checkout that the call names. Only the holder of the unit's claim starts it.",
    STORE_WRITE_PROJECT_READ_ACCESS,
    assignmentStartInput,
    (input, context, resolved) => factoryAssignmentStart(envOf(context), resolved!, input),
  ),
  definition(
    "factory.assignment.save",
    "Move an assignment along the status move table, record a check, or record the use of a grant. Only the holder of the unit's claim updates it.",
    STORE_WRITE_PROJECT_WRITE_ACCESS,
    assignmentUpdateInput,
    (input, context, resolved) => factoryAssignmentSave(envOf(context), resolved!, input),
  ),
  definition(
    "factory.assignment.list",
    `List one project's open factory assignments, or every assignment. ${READ_SUMMARY}`,
    STORE_READ_PROJECT_READ_ACCESS,
    assignmentListInput,
    (input, context, resolved) => factoryAssignmentList(envOf(context), resolved!, input),
  ),
  definition(
    "factory.restore",
    "Write the .make-docs/factory/ copies of one checkout again from the Store, with the latest plan revisions and no grant.",
    STORE_WRITE_PROJECT_WRITE_ACCESS,
    restoreInput,
    (_input, context, resolved) => factoryRestore(envOf(context), resolved!),
  ),
  // W30 R0 follow-up commands (owner decisions 2026-11-23, PRD 53 R-FACTORY-69 to R-FACTORY-71).
  definition(
    "factory.tools.list",
    `List this machine's saved agent tools with their states, capability proofs, and record versions. It takes no project and contacts no tool. ${READ_SUMMARY}`,
    MACHINE_READ_ACCESS,
    toolsListInput,
    (_input, context) => factoryToolsList(envOf(context)),
  ),
  definition(
    "factory.file-backup.save",
    "Back up files before a worker changes them in a checkout folder without git, and record each file, its digest, and its assignment. In a folder with git, no backup is needed. Only the holder of the unit's claim saves one.",
    STORE_WRITE_PROJECT_WRITE_ACCESS,
    backupSaveInput,
    (input, context, resolved) => factoryBackupSave(envOf(context), resolved!, input),
  ),
  definition(
    "factory.grant-use.record",
    "Record the use of a grant on the live claim of a unit whose assignments are all final, before an action at the end of a scope. Only the holder of the unit's claim records it.",
    STORE_WRITE_PROJECT_READ_ACCESS,
    grantUseInput,
    (input, context, resolved) => factoryGrantUse(envOf(context), resolved!, input),
  ),
];

/** True for a factory result that was refused. The CLI prints it and exits 1. */
export function isRefusedFactoryResult(value: JsonValue): boolean {
  return value !== null && typeof value === "object" && !Array.isArray(value) && value.result === "refused";
}
