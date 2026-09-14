import type { ZodType } from "zod";
import path from "node:path";
import type {
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
import { projectOperations } from "./project/ops";
import { projectLayoutOperations } from "./project/layout";
import { uatOperations } from "./uat/ops";
import { prdOperations } from "./prd/ops";
import { resourceOperations } from "./resource/ops";
import { OperationError, type JsonValue } from "./types";
import { workOperations } from "./work/ops";
import {
  accessAtMost,
  assertHarnessOperationAllowed,
  resolveProjectHarnessAccessProjection,
} from "./harness-policy";

/**
 * The operation registry (R-REG-1): the single source of truth for which
 * deterministic operations exist. Identifiers follow `domain.verb` or
 * `domain.object.verb` — lowercase, dot-separated, hyphenated multiword
 * segments — and are stable and append-only. The CLI `run` tree, the MCP
 * tool list are surfaces derived
 * from or conformance-checked against this registry (R-REG-2, R-SURF-1).
 */

export type OperationMutation = "read" | "write";

/**
 * `active` operations execute today; `pending` identifiers are reserved in
 * the append-only namespace with their semantics owned by a named lineage
 * that has not landed yet (dispatch refuses them with the lineage named).
 */
export type OperationStatus = "active" | "pending";

export type OperationCliRoot =
  | "setup"
  | "project"
  | "resource"
  | "run"
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
  status: OperationStatus;
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
  status: OperationStatus;
  pendingLineage?: string;
  cli: OperationCliProjection;
}

export interface OperationAccessFact {
  operation: string;
  status: OperationStatus;
  cli: OperationCliProjection;
  access: OperationAccess;
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
  "work.item.resolve",
  "work.evidence.record",
  "work.evidence.read",
  "resource.list",
  "resource.read",
  "resource.ensure",
  "project.state.status",
  "project.state.recover",
  "project.persona.list",
  "project.layout.preview",
  "project.layout.prepare",
  "project.layout.apply",
  "project.layout.verify",
  "project.surface.ensure",
  "project.path-hygiene.validate",
  "project.path-hygiene.repair",
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

const ADMITTED_CLI_PATHS: Record<(typeof ADMITTED_OPERATION_IDS)[number], [OperationCliRoot, string]> = {
  "prd.authority.validate": ["run", "prd authority validate"],
  "work.item.resolve": ["run", "work item resolve"],
  "work.evidence.record": ["run", "work evidence record"],
  "work.evidence.read": ["run", "work evidence read"],
  "resource.list": ["resource", "list"],
  "resource.read": ["resource", "read"],
  "resource.ensure": ["resource", "ensure"],
  "project.state.status": ["project", "state status"],
  "project.state.recover": ["project", "state recover"],
  "project.persona.list": ["project", "persona list"],
  "project.layout.preview": ["project", "layout preview"],
  "project.layout.prepare": ["project", "layout prepare"],
  "project.layout.apply": ["project", "layout apply"],
  "project.layout.verify": ["project", "layout verify"],
  "project.surface.ensure": ["project", "surface ensure"],
  "project.path-hygiene.validate": ["project", "path-hygiene validate"],
  "project.path-hygiene.repair": ["project", "path-hygiene repair"],
  "lifecycle.start": ["run", "lifecycle start"],
  "lifecycle.show": ["run", "lifecycle show"],
  "lifecycle.list": ["run", "lifecycle list"],
  "lifecycle.checkpoint": ["run", "lifecycle checkpoint"],
  "lifecycle.pause": ["run", "lifecycle pause"],
  "lifecycle.resume": ["run", "lifecycle resume"],
  "lifecycle.attach-evidence": ["run", "lifecycle attach-evidence"],
  "lifecycle.complete": ["run", "lifecycle complete"],
  "lifecycle.fail": ["run", "lifecycle fail"],
  "lifecycle.abandon": ["run", "lifecycle abandon"],
  "uat.scenario.validate": ["run", "uat scenario validate"],
  "uat.persona.resolve": ["run", "uat persona resolve"],
  "uat.target.validate": ["run", "uat target validate"],
  "uat.evidence-reference.validate": ["run", "uat evidence-reference validate"],
  "uat.finding.validate": ["run", "uat finding validate"],
  "uat.result.validate": ["run", "uat result validate"],
};

const ADMITTED_CLI_USAGES: Partial<Record<(typeof ADMITTED_OPERATION_IDS)[number], string>> = {
  "project.persona.list": "make-docs project persona list [--target-root <path>] [--json]",
  "project.layout.preview": "make-docs project layout preview [--map <source>=<destination>] [--target-root <path>] [--json]",
  "project.layout.prepare": "make-docs project layout prepare --review <digest> --mode cli|manual [--map <source>=<destination>] [--target-root <path>] [--json]",
  "project.layout.apply": "make-docs project layout apply <operation-id> [--target-root <path>] [--json]",
  "project.layout.verify": "make-docs project layout verify <operation-id> [--target-root <path>] [--json]",
  "project.state.status": "make-docs project state status [--json]",
  "project.state.recover": "make-docs project state recover <operation-id> --resume|--rollback [--dry-run] [--json]",
  "resource.read": "make-docs resource read <uri>",
  "resource.ensure": "make-docs resource ensure <uri>",
  "project.surface.ensure":
    "make-docs project surface ensure <archive|artifacts|assets>",
  "project.path-hygiene.validate": "make-docs project path-hygiene validate",
  "project.path-hygiene.repair": "make-docs project path-hygiene repair",
};

export function operationDomain(id: string): string {
  return id.split(".", 1)[0]!;
}

/**
 * CLI display path of an identifier: its dot segments as argv tokens under
 * `make-docs run` (`resource.list` -> `resource list`). This is the
 * single derivation rule the `run` command tree is built from (R-REG-2);
 * surfaces and the runner reuse it rather than hand-maintaining command
 * strings.
 */
export function operationCliPath(id: string): string {
  return ADMITTED_CLI_PATHS[id as keyof typeof ADMITTED_CLI_PATHS]?.[1] ?? id.split(".").join(" ");
}

export function operationCliProjection(id: string): OperationCliProjection {
  getOperation(id);
  const [root, cliPath] = ADMITTED_CLI_PATHS[id as keyof typeof ADMITTED_CLI_PATHS] ?? [
    "run",
    id.split(".").join(" "),
  ];
  return {
    root,
    path: cliPath,
    command:
      ADMITTED_CLI_USAGES[id as keyof typeof ADMITTED_CLI_USAGES] ??
      `make-docs ${root} ${cliPath}`,
  };
}

/**
 * The human CLI command form of a registered operation (R-TIER-1): the
 * command a reader runs by hand when the runner cannot execute the operation
 * itself. Derived from the registry identifier via {@link operationCliPath};
 * throws for unknown identifiers so a caller can never present a
 * command the CLI does not accept.
 */
export function operationCliCommand(id: string): string {
  return operationCliProjection(id).command;
}

function assembleRegistry(): Map<string, OperationDefinition> {
  const registry = new Map<string, OperationDefinition>();
  const definitions: OperationDefinition[] = [
    ...prdOperations,
    ...projectOperations,
    ...projectLayoutOperations,
    ...workOperations,
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
    mcpReady:
      operation.status === "active" && operation.access.hostConfig === "none",
    commandRuleCandidate:
      operation.status === "active" &&
      operation.access.hostConfig === "none" &&
      !operation.id.startsWith("lifecycle.") &&
      operation.id !== "project.state.recover",
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
): HarnessCommandRule[] {
  const projection = resolveProjectHarnessAccessProjection(targetRoot, method);
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
  const run = async () => {
    if (definition.access.store !== "none" && (context.surface === "cli" || context.surface === "mcp")) {
      const authority: HarnessCommandRuleAuthority = {
        list: listHarnessCommandRules,
        validate: validateRegistryHarnessCommandRules,
      };
      assertHarnessOperationAllowed({
        operation: id,
        required: definition.access,
        targetRoot,
        storeRoot: context.storeRoot,
        commandRuleAuthority: authority,
      });
    }
    return (await handler(parsed.data, context)) as JsonValue;
  };
  const value = definition.access.store === "none"
    ? await run()
    : await context.withStoreSession(
        definition.access.store,
        id,
        definition.access,
        targetRoot,
        run,
      );
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

function operationTargetRoot(input: unknown, fallback: string): string {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    const record = input as Record<string, unknown>;
    const candidate = typeof record.targetRoot === "string"
      ? record.targetRoot
      : typeof record.targetDir === "string"
        ? record.targetDir
        : undefined;
    if (candidate) return path.resolve(candidate);
  }
  return path.resolve(fallback);
}
