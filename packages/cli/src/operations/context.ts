import { OperationError } from "./types";
import type { OperationAccess, StoreAccess } from "./access";
import { acquireStoreAccess } from "../store/database";
import {
  validateInstallationStoreRoot,
  withInstallationDatabase,
} from "../store/installation-state";
import { resolveStoreRoot } from "../store/paths";

/**
 * The surface an operation invocation originates from. The registry
 * surfaces are the CLI commands and MCP tools; `test` keeps the core invocable
 * without any surface loaded (R-TEST-2).
 */
export type OperationSurface = "cli" | "mcp" | "test";

export type OperationStoreSession = <T>(
  access: Exclude<StoreAccess, "none">,
  operation: string,
  declaredAccess: OperationAccess,
  targetRoot: string,
  run: () => T | Promise<T>,
) => Promise<T>;

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
   * grant model (CLI flags or MCP `allowWrite`);
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
  /** Required Store session gate. `store: none` operations never call it. */
  withStoreSession: OperationStoreSession;
  /** Store root used by the shared session gate and harness policy. */
  storeRoot: string;
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
  issue?: {
    code: string;
    path: string;
    operation: string;
    systemCode?: string;
    retryable: boolean;
    attempts: number;
    waitedMs: number;
    cause: string;
  };
}

/** Stable machine error fields shared by CLI and MCP transport envelopes. */
export function serializeOperationError(error: unknown): SerializedOperationError {
  const record =
    error !== null && typeof error === "object"
      ? (error as Record<string, unknown>)
      : {};
  const message = error instanceof Error ? error.message : String(error);
  const issue = record.issue !== null && typeof record.issue === "object"
    ? record.issue as Record<string, unknown>
    : null;
  const serializedIssue = issue &&
    typeof issue.code === "string" &&
    typeof issue.path === "string" &&
    typeof issue.operation === "string" &&
    typeof issue.retryable === "boolean" &&
    typeof issue.attempts === "number" &&
    typeof issue.waitedMs === "number" &&
    typeof issue.cause === "string"
    ? {
        code: issue.code,
        path: issue.path,
        operation: issue.operation,
        ...(typeof issue.systemCode === "string" ? { systemCode: issue.systemCode } : {}),
        retryable: issue.retryable,
        attempts: issue.attempts,
        waitedMs: issue.waitedMs,
        cause: issue.cause,
      }
    : null;
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
    ...(serializedIssue ? { issue: serializedIssue } : {}),
  };
}

export function createExecutionContext(
  input: {
    surface?: OperationSurface;
    cwd?: string;
    writesAllowed?: boolean;
    dryRun?: boolean;
    approvals?: Iterable<string>;
    storeRoot?: string;
    /** Explicit test seam. Production callers use the shared Store session gate. */
    storeSession?: OperationStoreSession;
    /** Legacy test seam. It replaces Store admission only when explicitly supplied. */
    admitStoreAccess?: (
      access: Exclude<StoreAccess, "none">,
      operation: string,
      declaredAccess: OperationAccess,
    ) => void | Promise<void>;
    now?: () => string;
  } = {},
): OperationExecutionContext {
  const storeRoot = input.storeRoot ?? resolveStoreRoot();
  const storeSession = input.storeSession ?? (input.admitStoreAccess
    ? async <T>(
        access: Exclude<StoreAccess, "none">,
        operation: string,
        declaredAccess: OperationAccess,
        _targetRoot: string,
        run: () => T | Promise<T>,
      ): Promise<T> => {
        await input.admitStoreAccess!(access, operation, declaredAccess);
        return await run();
      }
    : createProductionStoreSession(storeRoot));
  return {
    surface: input.surface ?? "test",
    cwd: input.cwd ?? process.cwd(),
    writesAllowed: input.writesAllowed ?? false,
    dryRun: input.dryRun ?? false,
    approvals: new Set(input.approvals ?? []),
    withStoreSession: storeSession,
    storeRoot,
    now: input.now ?? (() => new Date().toISOString()),
  };
}

function createProductionStoreSession(explicitStoreRoot?: string): OperationStoreSession {
  return async <T>(
    access: Exclude<StoreAccess, "none">,
    operation: string,
    _declaredAccess: OperationAccess,
    targetRoot: string,
    run: () => T | Promise<T>,
  ): Promise<T> => {
    const storeRoot = validateInstallationStoreRoot(
      targetRoot,
      explicitStoreRoot ?? resolveStoreRoot(),
    );

    // Prove the selected Store is safe and usable before the handler runs.
    // The outer shared session then stays active while nested handler access
    // reuses the same process lease.
    withInstallationDatabase(
      targetRoot,
      (database) => database.prepare("SELECT 1 AS admitted").get(),
      { storeRoot, readOnly: access === "read" },
    );
    const release = acquireStoreAccess(storeRoot);
    if (operation === "project.state.recover") {
      // Recovery must enter through production Store admission, but it cannot
      // retain its own shared lease while it proves that every prior lease is
      // dead. Release only this admitted lease. The recovery guard still
      // blocks new access, and any other live session still blocks recovery.
      release();
      return await run();
    }
    try {
      return await run();
    } finally {
      release();
    }
  };
}
