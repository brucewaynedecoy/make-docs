import { z } from "zod";
import type { OperationAccess } from "../access";
import type { OperationDefinition } from "../registry";
import type { OperationExecutionContext } from "../context";
import { makeStoreAccessStateError } from "../store-access";
import { OperationError, type JsonValue } from "../types";
import { BACKLOG_RULE_CATALOG_VERSION } from "../work/backlog/catalog";
import { BACKLOG_REVIEW_SKILL_VERSION } from "../work/backlog/cache-key";
import { BACKLOG_SNAPSHOT_SCHEMA_VERSION } from "../work/backlog/schemas";
import {
  StoreMaintenanceStateError,
  checkStore,
  cleanStore,
  defaultStoreMaintenanceEnvironment,
} from "../../store/maintenance";
import type { StoreMaintenanceVersions } from "../../store/table-catalog";

/** Store read only. Store maintenance is machine-wide and reads no project files. */
export const STORE_READ_ACCESS: OperationAccess = Object.freeze({ store: "read", project: "none", hostConfig: "none" });
/** The Store write permission (PRD 39 R-STORE-CMD-4). */
export const STORE_WRITE_ACCESS: OperationAccess = Object.freeze({ store: "write", project: "none", hostConfig: "none" });

/** The backlog cache versions of this CLI, for STORE-RULE-008. */
export const CLI_STORE_MAINTENANCE_VERSIONS: StoreMaintenanceVersions = Object.freeze({
  snapshotSchemaVersion: BACKLOG_SNAPSHOT_SCHEMA_VERSION,
  ruleCatalogVersion: BACKLOG_RULE_CATALOG_VERSION,
  skillVersion: BACKLOG_REVIEW_SKILL_VERSION,
});

const targetRoot = z.string().min(1).optional()
  .describe("Optional project folder for harness access checks. The Store is machine-wide, so the result does not depend on it.");
const checkInput = z.object({ targetRoot }).strict();
const cleanInput = z.object({
  targetRoot,
  yes: z.boolean().default(false)
    .describe("Set true to confirm the clean. A non-interactive run needs it (CLI --yes). The CLI asks once in an interactive run."),
}).strict();

export const SETUP_STORE_CHECK_OPERATION = "setup.store.check";
export const SETUP_STORE_CLEAN_OPERATION = "setup.store.clean";

/**
 * Map a maintenance refusal to the typed Store outcomes (PRD 39 R-STORE-CMD-5).
 * A busy or changing Store is `store-unavailable` with `retryable: true`.
 */
export function typedStoreMaintenanceError(operation: string, error: unknown): unknown {
  if (!(error instanceof StoreMaintenanceStateError)) return error;
  if (error.code === "confirmation-required") return new OperationError(`${error.message} Next: ${error.nextAction}`);
  const retryable = error.code === "store-busy" || error.code === "store-changing";
  return makeStoreAccessStateError({
    code: error.code === "store-unsafe" || error.code === "store-changed-outside" ? "store-unsafe" : "store-unavailable",
    operation,
    reason: error.message,
    nextAction: error.nextAction,
    details: { maintenanceCode: error.code, retryable, ...error.details },
  });
}

function typedStoreOutcome(operation: string, run: () => unknown): JsonValue {
  try {
    return run() as JsonValue;
  } catch (error) {
    throw typedStoreMaintenanceError(operation, error);
  }
}

function environment(context: OperationExecutionContext) {
  return defaultStoreMaintenanceEnvironment(CLI_STORE_MAINTENANCE_VERSIONS, new Date(context.now()));
}

export const setupStoreOperations: OperationDefinition[] = [{
  id: SETUP_STORE_CHECK_OPERATION,
  mcp: { profiles: ["setup"], defaultExposure: "deferred" },
  summary: "Check the Make Docs Store: what each fixed maintenance rule would remove, the items that need a decision, and the crash leftovers that block this computer. Reads only, also on a Store that was changed outside Make Docs.",
  mutates: "read",
  access: STORE_READ_ACCESS,
  status: "active",
  inputSchema: checkInput,
  handler(raw, context) {
    checkInput.parse(raw);
    return typedStoreOutcome(SETUP_STORE_CHECK_OPERATION, () => checkStore(context.storeRoot, environment(context)));
  },
}, {
  id: SETUP_STORE_CLEAN_OPERATION,
  mcp: { profiles: ["setup"], defaultExposure: "deferred" },
  summary: "Back up the Make Docs Store, keep the three newest backups, remove only the rows that the fixed maintenance rules prove in one transaction, vacuum the file, and report how to restore it.",
  mutates: "write",
  access: STORE_WRITE_ACCESS,
  status: "active",
  inputSchema: cleanInput,
  handler(raw, context) {
    const input = cleanInput.parse(raw);
    return typedStoreOutcome(SETUP_STORE_CLEAN_OPERATION, () => {
      if (!input.yes && !context.dryRun) {
        throw new StoreMaintenanceStateError(
          "confirmation-required",
          "Clean changes the Store, so it needs one confirmation. Nothing was changed.",
          context.surface === "mcp"
            ? "Review the setup_store_check result, then call setup_store_clean again with yes: true and allowWrite: true."
            : "Run make-docs setup store check to review, then run make-docs setup store clean --yes, or run it in a terminal to answer one prompt.",
        );
      }
      return cleanStore(context.storeRoot, environment(context), { dryRun: context.dryRun });
    });
  },
}];
