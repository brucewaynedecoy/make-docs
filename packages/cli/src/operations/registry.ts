import type { ZodType } from "zod";
import {
  OperationApprovalRequiredError,
  OperationPendingError,
  OperationWriteDeniedError,
  type OperationExecutionContext,
} from "./context";
import { packageOperations } from "./package/ops";
import { playbookOperations } from "./playbook/ops";
import { OperationError, type JsonValue } from "./types";
import { workOperations } from "./work/ops";

/**
 * The operation registry (R-REG-1): the single source of truth for which
 * deterministic operations exist. Identifiers follow `domain.verb` or
 * `domain.object.verb` — lowercase, dot-separated, hyphenated multiword
 * segments — and are stable and append-only. The CLI `run` tree, the MCP
 * tool list, and Playbook `operation:` steps are three surfaces derived
 * from or conformance-checked against this registry (R-REG-2, R-SURF-1).
 */

export type OperationMutation = "read" | "write";

/**
 * `active` operations execute today; `pending` identifiers are reserved in
 * the append-only namespace with their semantics owned by a named lineage
 * that has not landed yet (dispatch refuses them with the lineage named).
 */
export type OperationStatus = "active" | "pending";

export interface OperationDefinition<TInput = unknown, TOutput = unknown> {
  /** Stable registry identifier, e.g. `playbook.catalog`. */
  id: string;
  summary: string;
  mutates: OperationMutation;
  status: OperationStatus;
  /** Lineage owning the not-yet-landed semantics when status is `pending`. */
  pendingLineage?: string;
  /** Named approvals the caller must grant before the handler runs. */
  requiredApprovals?: string[];
  /** Typed input contract; surfaces adapt argv/MCP args/step inputs into this. */
  inputSchema: ZodType<TInput>;
  handler(input: TInput, context: OperationExecutionContext): TOutput | Promise<TOutput>;
}

export interface OperationDescriptor {
  id: string;
  domain: string;
  summary: string;
  mutates: OperationMutation;
  status: OperationStatus;
  pendingLineage?: string;
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

export function operationDomain(id: string): string {
  return id.split(".", 1)[0]!;
}

/**
 * CLI display path of an identifier: its dot segments as argv tokens under
 * `make-docs run` (`playbook.catalog` -> `playbook catalog`). This is the
 * single derivation rule the `run` command tree is built from (R-REG-2);
 * surfaces and the runner reuse it rather than hand-maintaining command
 * strings.
 */
export function operationCliPath(id: string): string {
  return id.split(".").join(" ");
}

/**
 * The human CLI command form of a registered operation (R-TIER-1): the
 * command a reader runs by hand when the runner cannot execute the operation
 * itself. Derived from the registry identifier via {@link operationCliPath};
 * throws for unknown identifiers so a Playbook step can never present a
 * command the CLI does not accept.
 */
export function operationCliCommand(id: string): string {
  return `make-docs run ${operationCliPath(getOperation(id).id)}`;
}

function assembleRegistry(): Map<string, OperationDefinition> {
  const registry = new Map<string, OperationDefinition>();
  const definitions: OperationDefinition[] = [
    ...playbookOperations,
    ...packageOperations,
    ...workOperations,
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
    if (definition.status === "pending" && !definition.pendingLineage) {
      throw new Error(`Pending operation \`${definition.id}\` must name its owning lineage.`);
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
    status: definition.status,
    ...(definition.pendingLineage ? { pendingLineage: definition.pendingLineage } : {}),
  }));
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
    );
  }
  if (definition.mutates === "write" && !context.writesAllowed) {
    throw new OperationWriteDeniedError(
      `Operation \`${id}\` mutates state and requires write permission from the calling surface ` +
        "(CLI write flags, MCP allowWrite=true, or a Playbook safety grant).",
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
  const value = (await definition.handler(parsed.data, context)) as JsonValue;
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
