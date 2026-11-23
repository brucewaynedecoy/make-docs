import { OperationError } from "./types";
import type { OperationAccess, StoreAccess } from "./access";
import { acquireStoreAccess } from "../store/database";
import {
  validateInstallationStoreRoot,
  withInstallationDatabase,
} from "../store/installation-state";
import { getStoreDatabasePath, resolveStoreRoot } from "../store/paths";
import { lstatSync } from "node:fs";
import { makeStoreAccessStateError } from "./store-access";
import {
  HARNESS_CALLER_IDENTITY_ENV,
  parseHarnessCallerIdentityValue,
  type HarnessCallerReference,
} from "../harness-access/contract";

/**
 * The surface an operation invocation originates from. The registry
 * surfaces are the CLI commands and MCP tools; `test` keeps the core invocable
 * without any surface loaded (R-TEST-2).
 */
export type OperationSurface = "cli" | "mcp" | "test";
export type OperationRoute = "direct-cli" | "mcp" | "native-rule" | "test";

export interface CliOperationLaunch {
  route: Extract<OperationRoute, "direct-cli" | "native-rule">;
  callerIdentityRaw?: string;
  callerReference?: HarnessCallerReference;
}

/** Resolve and validate the caller identity once at the CLI boundary. */
export function resolveCliOperationLaunch(
  callerIdentityRaw = process.env[HARNESS_CALLER_IDENTITY_ENV],
  callerReference?: HarnessCallerReference,
): CliOperationLaunch {
  if (callerIdentityRaw && callerReference) {
    throw new OperationError("The Make Docs harness caller identity and reference cannot be used together.");
  }
  if (callerReference) return Object.freeze({ route: "native-rule", callerReference });
  if (!callerIdentityRaw) return Object.freeze({ route: "direct-cli" });
  try {
    parseHarnessCallerIdentityValue(callerIdentityRaw);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new OperationError(`The Make Docs harness caller identity is invalid: ${detail}`);
  }
  return Object.freeze({ route: "native-rule", callerIdentityRaw });
}

/** Resolve the explicit CLI route from the product-owned native launch carrier. */
export function resolveCliOperationRoute(
  callerIdentityRaw = process.env[HARNESS_CALLER_IDENTITY_ENV],
  callerReference?: HarnessCallerReference,
): Extract<OperationRoute, "direct-cli" | "native-rule"> {
  return resolveCliOperationLaunch(callerIdentityRaw, callerReference).route;
}

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
  route: OperationRoute;
  /** Exact harness identity captured by the calling surface. */
  callerIdentityRaw?: string;
  /** Parsed compact caller reference captured at the CLI boundary. */
  callerReference?: HarnessCallerReference;
  /** MCP connection proof captured from the host environment. */
  mcpConnectionId?: string;
  mcpConnectionKey?: string;
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
  reason?: string;
  nextAction?: string;
  /** The new command or tool name when an old name was used (PRD 39 R-MIG-1). */
  renamedTo?: string;
  scope?: "operation";
  taskCanContinue?: boolean;
  details?: Record<string, unknown>;
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
    ...(typeof record.reason === "string" ? { reason: record.reason } : {}),
    ...(typeof record.nextAction === "string" ? { nextAction: record.nextAction } : {}),
    ...(typeof record.renamedTo === "string" ? { renamedTo: record.renamedTo } : {}),
    ...(record.scope === "operation" ? { scope: "operation" as const } : {}),
    ...(typeof record.taskCanContinue === "boolean"
      ? { taskCanContinue: record.taskCanContinue }
      : {}),
    ...(record.details && typeof record.details === "object" && !Array.isArray(record.details)
      ? { details: { ...(record.details as Record<string, unknown>) } }
      : {}),
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
    route?: OperationRoute;
    callerIdentityRaw?: string;
    callerReference?: HarnessCallerReference;
    mcpConnectionId?: string;
    mcpConnectionKey?: string;
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
    route: input.route ?? "test",
    ...(input.callerIdentityRaw ? { callerIdentityRaw: input.callerIdentityRaw } : {}),
    ...(input.callerReference ? { callerReference: input.callerReference } : {}),
    ...(input.mcpConnectionId ? { mcpConnectionId: input.mcpConnectionId } : {}),
    ...(input.mcpConnectionKey ? { mcpConnectionKey: input.mcpConnectionKey } : {}),
    cwd: input.cwd ?? process.cwd(),
    writesAllowed: input.writesAllowed ?? false,
    dryRun: input.dryRun ?? false,
    approvals: new Set(input.approvals ?? []),
    withStoreSession: storeSession,
    storeRoot,
    now: input.now ?? (() => new Date().toISOString()),
  };
}

/**
 * The files step of a work queue command without a usable Store. It matches
 * `WORK_FILES_NEXT_STEP` in `work/work-queue/files-fallback.ts` (a test checks
 * this); it is repeated here so that the session does not load the work code.
 */
export const WORK_FILES_STEP =
  "Until the Store is usable, the docs/work/ files are the authority. Read them directly, or run make-docs backlog snapshot, which reads them without the Store.";

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

    if (operation === "setup.store.check") {
      // Store check must also read a Store that was changed outside Make Docs
      // (PRD 38 R-WRITE-GUARD-4), so it skips the guarded admission open. The
      // handler classifies the Store and opens it read only with the guard
      // check off. A missing Store is refused here, before any lease file is made.
      if (!lstatSync(getStoreDatabasePath(storeRoot), { throwIfNoEntry: false })) {
        throw makeStoreAccessStateError({
          code: "store-unavailable",
          operation,
          reason: `The Store at ${getStoreDatabasePath(storeRoot)} does not exist. Nothing was checked.`,
          nextAction: "Run make-docs setup first.",
          details: { maintenanceCode: "store-absent" },
        });
      }
      const release = acquireStoreAccess(storeRoot);
      try {
        return await run();
      } finally {
        release();
      }
    }

    // Store clean must not create or prepare a Store, so its admission opens read only.
    const readOnly = access === "read" || operation === "setup.store.clean" || operation.startsWith("project.checkout-move.") || operation.startsWith("project.checkout-register.");
    // Register D-069, owner option B (2026-11-23): an operation never creates a
    // missing Store. Only setup initializes one (PRD 38 R-DB-4, R-TEST-12). A
    // write admission would create it, so a missing Store database is refused
    // here, before any folder, database, WAL, SHM, or lease file is made, with
    // the same typed outcome that the reads give (PRD 52 R-WORK-STORE-2).
    // A read admission opens read only and already refuses a missing Store without creating one.
    if (!readOnly && !lstatSync(getStoreDatabasePath(storeRoot), { throwIfNoEntry: false })) {
      throw makeStoreAccessStateError({
        code: "store-unavailable",
        operation,
        reason: "This computer has no Make Docs Store. Nothing changed, and Make Docs created no Store.",
        nextAction: operation.startsWith("work.queue.")
          ? `Run make-docs setup to create the Store, then run this command again. ${WORK_FILES_STEP}`
          : "Run make-docs setup to create the Store, then run this command again.",
        details: { maintenanceCode: "store-absent" },
      });
    }

    // Prove the selected Store is safe and usable before the handler runs.
    // The outer shared session then stays active while nested handler access
    // reuses the same process lease.
    withInstallationDatabase(
      targetRoot,
      (database) => database.prepare("SELECT 1 AS admitted").get(),
      { storeRoot, readOnly },
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
