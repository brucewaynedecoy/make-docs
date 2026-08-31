import { OperationError } from "./types";

/**
 * The surface an operation invocation originates from. The three registry
 * surfaces are the CLI `run` command, the MCP tools, and Playbook
 * `operation:` steps (R-SURF-1); `test` exists so the core is invocable
 * without any surface loaded (R-TEST-2).
 */
export type OperationSurface = "cli" | "mcp" | "playbook-step" | "test";

/**
 * Injected execution context for operation handlers (R-CORE-1).
 *
 * Handlers return structured data and perform effects only under this
 * context. Dry-run, write-permission, and approval gating are enforced
 * uniformly by the registry dispatch (`invokeOperation`) from the operation's
 * mutation classification, replacing per-surface write gating such as the
 * MCP `allowWrite` flag.
 */
export interface OperationExecutionContext {
  surface: OperationSurface;
  /** Working directory operations resolve relative paths against. */
  cwd: string;
  /**
   * Whether mutating operations may write. Surfaces set this from their own
   * grant model (CLI flags, MCP `allowWrite`, Playbook safety declarations);
   * enforcement itself happens in the core, not in the surface.
   */
  writesAllowed: boolean;
  /**
   * When true, mutating operations must plan rather than write. Passed
   * through to handlers whose implementations support plan-only execution.
   */
  dryRun: boolean;
  /**
   * Approval tokens granted by the caller (for example a reviewed-overwrite
   * confirmation). Operations that require a named approval check for it
   * here rather than defining a surface-specific flag.
   */
  approvals: ReadonlySet<string>;
  /** Clock injection point; returns an ISO-8601 UTC timestamp. */
  now(): string;
}

export class OperationWriteDeniedError extends OperationError {
  constructor(message: string) {
    super(message);
    this.name = "OperationWriteDeniedError";
  }
}

export class OperationApprovalRequiredError extends OperationError {
  constructor(message: string) {
    super(message);
    this.name = "OperationApprovalRequiredError";
  }
}

/**
 * Raised when a registered identifier's semantics are owned by a lineage
 * that has not landed yet; the identifier is stable and append-only, the
 * behavior arrives behind it.
 */
export class OperationPendingError extends OperationError {
  readonly code = "operation-pending";
  readonly handlerAvailable = false;

  constructor(
    message: string,
    readonly operation: string,
    readonly pendingLineage: string,
  ) {
    super(message);
    this.name = "OperationPendingError";
  }
}

export interface SerializedOperationError {
  [key: string]: unknown;
  code: string;
  message: string;
  operation?: string;
  pendingLineage?: string;
  handlerAvailable?: boolean;
  recovery?: string;
  uri?: string;
  path?: string;
  runId?: string;
  currentStatus?: string;
  allowedStatuses?: string[];
}

/** Stable machine error fields shared by CLI and MCP transport envelopes. */
export function serializeOperationError(error: unknown): SerializedOperationError {
  const record =
    error !== null && typeof error === "object"
      ? (error as Record<string, unknown>)
      : {};
  const message = error instanceof Error ? error.message : String(error);
  return {
    code: typeof record.code === "string" ? record.code : "operation-error",
    message,
    ...(typeof record.operation === "string" ? { operation: record.operation } : {}),
    ...(typeof record.pendingLineage === "string"
      ? { pendingLineage: record.pendingLineage }
      : {}),
    ...(typeof record.handlerAvailable === "boolean"
      ? { handlerAvailable: record.handlerAvailable }
      : {}),
    ...(typeof record.recovery === "string" ? { recovery: record.recovery } : {}),
    ...(typeof record.uri === "string" ? { uri: record.uri } : {}),
    ...(typeof record.path === "string" ? { path: record.path } : {}),
    ...(typeof record.runId === "string" ? { runId: record.runId } : {}),
    ...(typeof record.currentStatus === "string"
      ? { currentStatus: record.currentStatus }
      : {}),
    ...(Array.isArray(record.allowedStatuses) &&
    record.allowedStatuses.every((value) => typeof value === "string")
      ? { allowedStatuses: [...record.allowedStatuses] as string[] }
      : {}),
  };
}

export function createExecutionContext(
  input: {
    surface?: OperationSurface;
    cwd?: string;
    writesAllowed?: boolean;
    dryRun?: boolean;
    approvals?: Iterable<string>;
    now?: () => string;
  } = {},
): OperationExecutionContext {
  return {
    surface: input.surface ?? "test",
    cwd: input.cwd ?? process.cwd(),
    writesAllowed: input.writesAllowed ?? false,
    dryRun: input.dryRun ?? false,
    approvals: new Set(input.approvals ?? []),
    now: input.now ?? (() => new Date().toISOString()),
  };
}
