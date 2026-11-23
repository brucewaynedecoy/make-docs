import type { ZodType } from "zod";
import path from "node:path";
import type {
  HarnessCallerReference,
  HarnessCommandRule,
  HarnessCommandRuleAuthority,
  HarnessConnectionMethod,
} from "../harness-access/contract";
import {
  assertOperationAccess,
  cloneOperationAccess,
  type OperationAccess,
} from "./access";
import {
  OperationApprovalRequiredError,
  OperationPendingError,
  OperationWriteDeniedError,
  type OperationExecutionContext,
} from "./context";
import { lifecycleOperations } from "./lifecycle/registry-ops";
import { performanceEvidenceOperations } from "./performance-evidence/ops";
import { projectOperations } from "./project/ops";
import { projectLayoutOperations } from "./project/layout";
import { projectDoctorOperations } from "./project/doctor/ops";
import { setupStoreOperations } from "./setup/store-ops";
import { uatOperations } from "./uat/ops";
import { prdOperations } from "./prd/ops";
import { resourceOperations } from "./resource/ops";
import { OperationError, type JsonValue } from "./types";
import { workOperations } from "./work/ops";
import { backlogReviewOperations } from "./work/backlog/review-operation";
import {
  accessAtMost,
  assertHarnessOperationAllowed,
  resolveProjectHarnessAccessProjection,
} from "./harness-policy";
import { StoreAccessStateError, makeStoreAccessStateError } from "./store-access";
import { storeChangedOutsideNextAction } from "../store/database";
import { assertMcpToolMetadata, type McpToolMetadata } from "./mcp-metadata";
import { leafHelpEntry } from "./leaf-help-table";

/**
 * The operation registry (R-REG-1): the single source of truth for which
 * deterministic operations exist. Identifiers follow `domain.verb` or
 * `domain.object.verb` — lowercase, dot-separated, hyphenated multiword
 * segments — and are stable and append-only. The CLI groups and the MCP
 * tool list are surfaces derived from or conformance-checked against this
 * registry (R-REG-2, R-SURF-1).
 */

export type OperationMutation = "read" | "write";

/**
 * `active` operations execute today; `pending` identifiers are reserved in
 * the append-only namespace with their semantics owned by a named lineage
 * that has not landed yet (dispatch refuses them with the lineage named).
 */
export type OperationStatus = "active" | "pending";

/** PRD 39 R-TOP-1: the top-level groups. `run` is not a group. */
export type OperationCliRoot =
  | "setup"
  | "project"
  | "resource"
  | "work"
  | "backlog"
  | "lifecycle"
  | "factory"
  | "check"
  | "mcp"
  | "update"
  | "uninstall";

export interface OperationCliProjection {
  root: OperationCliRoot;
  path: string;
  command: string;
}

export interface OperationDefinition<TInput = unknown, TOutput = unknown> {
  /** Stable registry identifier, e.g. `resource.list`. */
  id: string;
  summary: string;
  mutates: OperationMutation;
  /** Exact Store, project, and host-config access needed by this operation. */
  access: OperationAccess;
  /** Optional read-only sub-operations must obtain their own Store admission. */
  storeAdmission?: "required" | "optional";
  status: OperationStatus;
  /** Required for MCP-ready operations; independent of admission and access. */
  mcp?: McpToolMetadata;
  /** Strict app result contract. Transport uses it instead of the generic JSON formatter. */
  mcpResultSchema?: ZodType;
  /** Lineage owning the not-yet-landed semantics when status is `pending`. */
  pendingLineage?: string;
  /** Named approvals the caller must grant before the handler runs. */
  requiredApprovals?: string[];
  /** Typed input contract; surfaces adapt argv/MCP args/step inputs into this. */
  inputSchema: ZodType<TInput>;
  /** Active operations have one handler. Pending reservations have none. */
  handler?(input: TInput, context: OperationExecutionContext): TOutput | Promise<TOutput>;
}

export interface OperationDescriptor {
  id: string;
  domain: string;
  summary: string;
  mutates: OperationMutation;
  access: OperationAccess;
  storeAdmission?: "required" | "optional";
  status: OperationStatus;
  pendingLineage?: string;
  cli: OperationCliProjection;
}

export interface OperationAccessFact {
  operation: string;
  status: OperationStatus;
  cli: OperationCliProjection;
  access: OperationAccess;
  storeAdmission?: "required" | "optional";
  mcpReady: boolean;
  commandRuleCandidate: boolean;
}

export interface OperationInvocation<TOutput = JsonValue> {
  operation: string;
  value: TOutput;
  provenance: {
    operation: string;
    domain: string;
    source: OperationExecutionContext["surface"];
  };
}

const SEGMENT = "[a-z][a-z0-9]*(?:-[a-z0-9]+)*";
export const OPERATION_ID_PATTERN = new RegExp(`^${SEGMENT}\\.${SEGMENT}(?:\\.${SEGMENT})?$`);

export const ADMITTED_OPERATION_IDS = [
  "prd.authority.validate",
  "performance.evidence.validate",
  "work.item.resolve",
  "work.evidence.record",
  "work.evidence.read",
  "work.backlog.snapshot",
  "work.backlog-cache.lookup",
  "work.backlog-cache.write",
  "backlog.review.open",
  "backlog.review.refresh",
  "resource.list",
  "resource.read",
  "resource.ensure",
  "project.state.status",
  "project.state.recover",
  "project.checkout-move.preview",
  "project.checkout-move.apply",
  "project.checkout-register.preview",
  "project.checkout-register.apply",
  "project.persona.list",
  "project.register.list",
  "project.layout.preview",
  "project.layout.prepare",
  "project.layout.apply",
  "project.layout.verify",
  "project.surface.ensure",
  "project.path-hygiene.validate",
  "project.path-hygiene.repair",
  "project.doctor.check",
  "project.doctor.fix",
  "setup.store.check",
  "setup.store.clean",
  "lifecycle.start",
  "lifecycle.show",
  "lifecycle.list",
  "lifecycle.checkpoint",
  "lifecycle.pause",
  "lifecycle.resume",
  "lifecycle.attach-evidence",
  "lifecycle.complete",
  "lifecycle.fail",
  "lifecycle.abandon",
  "uat.scenario.validate",
  "uat.persona.resolve",
  "uat.target.validate",
  "uat.evidence-reference.validate",
  "uat.finding.validate",
  "uat.result.validate",
] as const;

/**
 * Canonical CLI projection of each admitted operation (PRD 39 R-TOP-1,
 * R-TOP-3, R-NAME): the top-level group and the path under it. W33 R0 P2
 * moved every operation to its group from the name catalog
 * (`name-catalog.ts`). The MCP tool name is derived from this path
 * (R-NAME-3), so the two cannot drift.
 */
const ADMITTED_CLI_PATHS: Record<(typeof ADMITTED_OPERATION_IDS)[number], [OperationCliRoot, string]> = {
  "prd.authority.validate": ["check", "prd"],
  "performance.evidence.validate": ["check", "performance-evidence"],
  "work.item.resolve": ["work", "item resolve"],
  "work.evidence.record": ["work", "evidence record"],
  "work.evidence.read": ["work", "evidence read"],
  "work.backlog.snapshot": ["backlog", "snapshot"],
  "work.backlog-cache.lookup": ["backlog", "cache lookup"],
  "work.backlog-cache.write": ["backlog", "cache write"],
  "backlog.review.open": ["backlog", "review open"],
  "backlog.review.refresh": ["backlog", "review refresh"],
  "resource.list": ["resource", "list"],
  "resource.read": ["resource", "read"],
  "resource.ensure": ["resource", "ensure"],
  "project.state.status": ["project", "state status"],
  "project.state.recover": ["project", "state recover"],
  "project.checkout-move.preview": ["project", "move preview"],
  "project.checkout-move.apply": ["project", "move apply"],
  "project.checkout-register.preview": ["project", "checkout preview"],
  "project.checkout-register.apply": ["project", "checkout apply"],
  "project.persona.list": ["project", "persona list"],
  "project.register.list": ["project", "list"],
  "project.layout.preview": ["project", "layout preview"],
  "project.layout.prepare": ["project", "layout prepare"],
  "project.layout.apply": ["project", "layout apply"],
  "project.layout.verify": ["project", "layout verify"],
  "project.surface.ensure": ["project", "surface ensure"],
  "project.path-hygiene.validate": ["project", "paths validate"],
  "project.path-hygiene.repair": ["project", "paths repair"],
  "project.doctor.check": ["project", "doctor check"],
  "project.doctor.fix": ["project", "doctor fix"],
  "setup.store.check": ["setup", "store check"],
  "setup.store.clean": ["setup", "store clean"],
  "lifecycle.start": ["lifecycle", "start"],
  "lifecycle.show": ["lifecycle", "show"],
  "lifecycle.list": ["lifecycle", "list"],
  "lifecycle.checkpoint": ["lifecycle", "checkpoint"],
  "lifecycle.pause": ["lifecycle", "pause"],
  "lifecycle.resume": ["lifecycle", "resume"],
  "lifecycle.attach-evidence": ["lifecycle", "attach-evidence"],
  "lifecycle.complete": ["lifecycle", "complete"],
  "lifecycle.fail": ["lifecycle", "fail"],
  "lifecycle.abandon": ["lifecycle", "abandon"],
  "uat.scenario.validate": ["check", "uat scenario"],
  "uat.persona.resolve": ["check", "uat persona"],
  "uat.target.validate": ["check", "uat target"],
  "uat.evidence-reference.validate": ["check", "uat evidence"],
  "uat.finding.validate": ["check", "uat finding"],
  "uat.result.validate": ["check", "uat result"],
};

export function operationDomain(id: string): string {
  return id.split(".", 1)[0]!;
}

/**
 * CLI path of an identifier under its group (`project.checkout-move.preview`
 * -> `move preview` under `project`). The registry's explicit projection is
 * the only source; surfaces reuse it rather than hand-maintaining command
 * strings.
 */
export function operationCliPath(id: string): string {
  return operationCliProjection(id).path;
}

/** Full CLI path after `make-docs`: the group and the path (`project move preview`). */
export function operationFullCliPath(id: string): string {
  const projection = operationCliProjection(id);
  return `${projection.root} ${projection.path}`;
}

function operationUsageLine(id: string, path: string): string {
  const usage = leafHelpEntry(id).usage;
  return usage ? `${path} ${usage}` : path;
}

export function operationCliProjection(id: string): OperationCliProjection {
  getOperation(id);
  const projection = ADMITTED_CLI_PATHS[id as keyof typeof ADMITTED_CLI_PATHS];
  if (projection === undefined) {
    throw new OperationError(`Operation \`${id}\` has no CLI projection.`);
  }
  const [root, cliPath] = projection;
  return {
    root,
    path: cliPath,
    // W33 R0 P5: the usage line comes from the command's help entry, so
    // `operationCliCommand`, group help, and `--help` name the same flags.
    command: operationUsageLine(id, `make-docs ${root} ${cliPath}`),
  };
}

/**
 * The human CLI command form of a registered operation (R-TIER-1): the
 * command a reader runs by hand when the runner cannot execute the operation
 * itself. Read from the registry CLI projection via {@link operationCliProjection};
 * throws for unknown identifiers so a caller can never present a
 * command the CLI does not accept.
 */
export function operationCliCommand(id: string): string {
  return operationCliProjection(id).command;
}

/** MCP admission depends on executable status and host access, never profiles. */
export function isOperationMcpReady(
  operation: Pick<OperationDefinition, "status" | "access">,
): boolean {
  return operation.status === "active" && operation.access.hostConfig === "none";
}

export function assertOperationMcpMetadata(definition: OperationDefinition): void {
  if (isOperationMcpReady(definition) || definition.mcp !== undefined) {
    assertMcpToolMetadata(definition.id, definition.mcp);
  }
  if (Boolean(definition.mcp?.uiResourceUri) !== Boolean(definition.mcpResultSchema)) {
    throw new Error(`Operation ${definition.id} must declare its UI resource URI and strict MCP result schema together.`);
  }
}

export function assertOperationStoreAdmission(
  definition: Pick<OperationDefinition, "id" | "mutates" | "access" | "storeAdmission">,
): void {
  const admission = definition.storeAdmission ?? "required";
  if (admission !== "required" && admission !== "optional") {
    throw new Error(`Operation ${definition.id} declares unknown Store admission.`);
  }
  if (admission === "optional" && (definition.mutates !== "read" || definition.access.store !== "read")) {
    throw new Error(`Optional Store admission requires a read-only operation with Store read access: ${definition.id}.`);
  }
}

function assembleRegistry(): Map<string, OperationDefinition> {
  const registry = new Map<string, OperationDefinition>();
  const definitions: OperationDefinition[] = [
    ...prdOperations,
    ...performanceEvidenceOperations,
    ...projectOperations,
    ...projectLayoutOperations,
    ...projectDoctorOperations,
    ...setupStoreOperations,
    ...workOperations,
    ...backlogReviewOperations,
    ...resourceOperations,
    ...lifecycleOperations,
    ...uatOperations,
  ];
  for (const definition of definitions) {
    if (!OPERATION_ID_PATTERN.test(definition.id)) {
      throw new Error(
        `Operation identifier \`${definition.id}\` violates the registry convention: ` +
          "lowercase dot-separated `domain.verb` or `domain.object.verb` with hyphenated multiword segments.",
      );
    }
    if (registry.has(definition.id)) {
      throw new Error(`Duplicate operation identifier in registry: \`${definition.id}\`.`);
    }
    assertOperationAccess(definition.id, definition.access, definition.mutates);
    assertOperationStoreAdmission(definition);
    assertOperationMcpMetadata(definition);
    if (definition.status === "pending" && !definition.pendingLineage) {
      throw new Error(`Pending operation \`${definition.id}\` must name its owning lineage.`);
    }
    if (definition.status === "pending" && definition.handler !== undefined) {
      throw new Error(`Pending operation \`${definition.id}\` must not claim a handler.`);
    }
    if (definition.status === "active" && definition.handler === undefined) {
      throw new Error(`Active operation \`${definition.id}\` must claim exactly one handler.`);
    }
    registry.set(definition.id, definition);
  }
  return registry;
}

const REGISTRY: Map<string, OperationDefinition> = assembleRegistry();

export function listOperations(): OperationDescriptor[] {
  return [...REGISTRY.values()].map((definition) => ({
    id: definition.id,
    domain: operationDomain(definition.id),
    summary: definition.summary,
    mutates: definition.mutates,
    access: cloneOperationAccess(definition.access),
    ...(definition.storeAdmission ? { storeAdmission: definition.storeAdmission } : {}),
    status: definition.status,
    cli: operationCliProjection(definition.id),
    ...(definition.pendingLineage ? { pendingLineage: definition.pendingLineage } : {}),
  }));
}

/** Structured access facts used by MCP, command-rule, setup, and conformance adapters. */
export function listOperationAccessFacts(): OperationAccessFact[] {
  return listAdmittedOperations().map((operation) => ({
    operation: operation.id,
    status: operation.status,
    cli: operation.cli,
    access: cloneOperationAccess(operation.access),
    ...(operation.storeAdmission ? { storeAdmission: operation.storeAdmission } : {}),
    mcpReady: isOperationMcpReady(operation),
    commandRuleCandidate:
      operation.status === "active" &&
      operation.access.hostConfig === "none" &&
      !operation.id.startsWith("lifecycle.") &&
      operation.id !== "project.state.recover" &&
      // A native command rule can never approve the `setup` word
      // (harness-access/contract.ts FORBIDDEN_COMMAND_WORDS), so Store
      // maintenance runs from a person's terminal or through MCP.
      operation.cli.root !== "setup",
  }));
}

/** The smallest canonical executable commands that a native rule adapter may review. */
export function listCommandRuleCandidates(): OperationAccessFact[] {
  return listOperationAccessFacts().filter((fact) => fact.commandRuleCandidate);
}

/** Exact native command-rule inputs, derived from admitted operation facts. */
export function listHarnessCommandRules(): HarnessCommandRule[] {
  return listCommandRuleCandidates().map((fact) => Object.freeze({
    id: `make-docs.${fact.operation}`,
    // The adapter adds the reviewed executable. These are argv tokens only.
    commandPrefix: Object.freeze([fact.cli.root, ...fact.cli.path.split(" ")]),
    operationIds: Object.freeze([fact.operation]),
    access: Object.freeze({
      store: fact.access.store,
      project: fact.access.project,
      hostConfig: "none" as const,
    }),
  }));
}

/** Project-aware rule facts. Machine installation still uses the full authority list. */
export function listEffectiveHarnessCommandRules(
  targetRoot: string,
  method: HarnessConnectionMethod,
  callerIdentityRaw?: string,
  callerReference?: HarnessCallerReference,
): HarnessCommandRule[] {
  const projection = resolveProjectHarnessAccessProjection(
    targetRoot,
    method,
    callerIdentityRaw,
    callerReference,
  );
  return listHarnessCommandRules().filter((rule) => accessAtMost(rule.access, projection.access));
}

/** Reject any command-rule list that is not an exact registry projection. */
export function validateRegistryHarnessCommandRules(
  rules: readonly HarnessCommandRule[],
): readonly HarnessCommandRule[] {
  const expected = listHarnessCommandRules();
  const byId = new Map(expected.map((rule) => [rule.id, rule]));
  if (rules.length !== expected.length) {
    throw new Error("Harness command rules must contain every exact registry candidate once.");
  }
  const seen = new Set<string>();
  for (const rule of rules) {
    const canonical = byId.get(rule.id);
    if (!canonical || seen.has(rule.id)) {
      throw new Error(`Harness command rule is not a unique registry candidate: ${rule.id}.`);
    }
    seen.add(rule.id);
    if (
      !sameStrings(rule.commandPrefix, canonical.commandPrefix) ||
      !sameStrings(rule.operationIds, canonical.operationIds) ||
      !sameAccess(rule.access, canonical.access)
    ) {
      throw new Error(`Harness command rule differs from registry authority: ${rule.id}.`);
    }
  }
  return rules;
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sameAccess(left: OperationAccess, right: OperationAccess): boolean {
  return left.store === right.store &&
    left.project === right.project &&
    left.hostConfig === right.hostConfig;
}

export function listAdmittedOperations(): OperationDescriptor[] {
  return ADMITTED_OPERATION_IDS.map((id) => describeOperation(id));
}

function describeOperation(id: string): OperationDescriptor {
  const definition = getOperation(id);
  return {
    id: definition.id,
    domain: operationDomain(definition.id),
    summary: definition.summary,
    mutates: definition.mutates,
    access: cloneOperationAccess(definition.access),
    ...(definition.storeAdmission ? { storeAdmission: definition.storeAdmission } : {}),
    status: definition.status,
    cli: operationCliProjection(definition.id),
    ...(definition.pendingLineage ? { pendingLineage: definition.pendingLineage } : {}),
  };
}

export function hasOperation(id: string): boolean {
  return REGISTRY.has(id);
}

export function getOperation(id: string): OperationDefinition {
  const definition = REGISTRY.get(id);
  if (!definition) {
    throw new OperationError(`Unknown operation identifier: \`${id}\`.`);
  }
  return definition;
}

/**
 * Uniform dispatch for every registry surface (R-CORE-1): validates the
 * typed input, enforces the mutation classification against the injected
 * context's write permission and approvals, refuses pending identifiers
 * with their owning lineage named, and returns structured data with
 * provenance. Surfaces must route through this seam and add presentation
 * only.
 */
export async function invokeOperation(
  id: string,
  input: unknown,
  context: OperationExecutionContext,
): Promise<OperationInvocation> {
  const definition = getOperation(id);
  assertOperationStoreAdmission(definition);
  if (definition.status === "pending") {
    throw new OperationPendingError(
      `Operation \`${id}\` is a reserved registry identifier; its semantics land with ${definition.pendingLineage}.`,
      id,
      definition.pendingLineage!,
    );
  }
  if (definition.mutates === "write" && !context.writesAllowed) {
    throw new OperationWriteDeniedError(
      `Operation \`${id}\` mutates state and requires write permission from the calling surface ` +
        "(CLI write flags or MCP allowWrite=true).",
    );
  }
  for (const approval of definition.requiredApprovals ?? []) {
    if (!context.approvals.has(approval)) {
      throw new OperationApprovalRequiredError(
        `Operation \`${id}\` requires the \`${approval}\` approval from the calling surface.`,
      );
    }
  }
  const parsed = definition.inputSchema.safeParse(input ?? {});
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(input)"}: ${issue.message}`)
      .join("; ");
    throw new OperationError(`Invalid input for operation \`${id}\`: ${issues}`);
  }
  const handler = definition.handler;
  if (!handler) {
    throw new OperationError(`Active operation \`${id}\` has no handler.`);
  }
  const targetRoot = operationTargetRoot(parsed.data, context.cwd);
  if (
    (context.surface === "cli" || context.surface === "mcp") &&
    definition.access.store !== "none" && definition.storeAdmission !== "optional"
  ) {
    if (context.route === "test") {
      throw new OperationError("A production Store operation needs an explicit route.");
    }
    const authority: HarnessCommandRuleAuthority = {
      list: listHarnessCommandRules,
      validate: validateRegistryHarnessCommandRules,
    };
    assertHarnessOperationAllowed({
      operation: id,
      required: definition.access,
      targetRoot,
      storeRoot: context.storeRoot,
      route: context.route,
      callerIdentityRaw: context.callerIdentityRaw,
      callerReference: context.callerReference,
      mcpConnectionId: context.mcpConnectionId,
      mcpConnectionKey: context.mcpConnectionKey,
      commandRuleAuthority: authority,
    });
  }
  const run = async () => {
    return (await handler(parsed.data, context)) as JsonValue;
  };
  let value: JsonValue;
  try {
    value = definition.access.store === "none" || definition.storeAdmission === "optional"
      ? await run()
      : await context.withStoreSession(
          definition.access.store,
          id,
          definition.access,
          targetRoot,
          run,
        );
  } catch (error) {
    throw scopeStoreAccessFailure(error, id, targetRoot);
  }
  return {
    operation: id,
    value,
    provenance: {
      operation: id,
      domain: operationDomain(id),
      source: context.surface,
    },
  };
}

function scopeStoreAccessFailure(error: unknown, operation: string, targetRoot: string): unknown {
  if (error instanceof StoreAccessStateError) return error;
  const record = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const code = typeof record.code === "string" ? record.code : "";
  const issue = record.issue && typeof record.issue === "object"
    ? record.issue as Record<string, unknown>
    : null;
  if (code === "store-unavailable") {
    const changedOutside = issue?.code === "changed-outside" && typeof issue.path === "string";
    const unsafe = changedOutside || issue?.code === "corrupt" || issue?.code === "schema-newer" || issue?.code === "schema-unknown";
    return makeStoreAccessStateError({
      code: unsafe ? "store-unsafe" : "store-unavailable",
      operation,
      reason: error instanceof Error ? error.message : String(error),
      nextAction: changedOutside
        ? storeChangedOutsideNextAction(path.dirname(String(issue!.path)))
        : unsafe
        ? `Run \`make-docs project state status --target-root ${JSON.stringify(targetRoot)}\` and review the Store state.`
        : typeof record.nextAction === "string" && record.nextAction
        ? record.nextAction
        : "Restore access to the configured Make Docs Store, then retry only this operation.",
      details: { projectRoot: targetRoot, ...(issue ? { issue: { ...issue } } : {}) },
    });
  }
  if (["writer-active", "ownership-unverified", "recovery-required", "snapshot-drift"].includes(code)) {
    return makeStoreAccessStateError({
      code: "store-unsafe",
      operation,
      reason: error instanceof Error ? error.message : String(error),
      nextAction: `Run \`make-docs project state status --target-root ${JSON.stringify(targetRoot)}\` and use its exact recovery action.`,
      details: { projectRoot: targetRoot, priorCode: code },
    });
  }
  return error;
}

function operationTargetRoot(input: unknown, fallback: string): string {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    const record = input as Record<string, unknown>;
    const candidate = typeof record.targetRoot === "string"
      ? record.targetRoot
      : typeof record.targetDir === "string"
        ? record.targetDir
        : typeof record.repoRoot === "string"
          ? record.repoRoot
        : undefined;
    if (candidate) return path.resolve(candidate);
  }
  return path.resolve(fallback);
}
