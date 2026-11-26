import { existsSync, lstatSync } from "node:fs";

import { getMakeDocsConfigPath } from "../../../config.js";
import { getStoreDatabasePath } from "../../../store/paths.js";
import { WORK_STORE_ABSENT_NEXT_ACTION } from "../../../store/work-store.js";
import type { OperationAccess } from "../../access.js";
import type { OperationExecutionContext } from "../../context.js";
import { assertHarnessOperationAllowed } from "../../harness-policy.js";
import { StoreAccessStateError, makeStoreAccessStateError } from "../../store-access.js";

/**
 * W29 R0 P4 second pass: a work read without a usable Store (PRD 52
 * R-WORK-STORE-2, R-WORK-URI-6). The read still returns the existing typed
 * Store outcome, with the same code. Its next step also tells the reader that
 * the `docs/work/` files are the authority and how to read them. The read does
 * not read or rank the files itself.
 */

/** The work roots that are the authority without a usable Store. */
export const WORK_FILE_AUTHORITY_ROOTS = ["docs/work/", ".make-docs/archive/work/"] as const;

/** The plain next step of a work read in a checkout without a usable Store. */
export const WORK_FILES_NEXT_STEP =
  "Until the Store is usable, the docs/work/ files are the authority. Read them directly, or run make-docs backlog snapshot --target-root . in the checkout, which reads them without the Store.";

/** The plain next step of a project URI read without a usable Store (R-WORK-URI-6). */
export function workProjectFilesNextStep(project: string): string {
  return `Until the Store is usable, read the docs/work/ files of project ${project} directly in a checkout of it, or run make-docs backlog snapshot --target-root . there, which reads them without the Store.`;
}

/** The same typed Store outcome, with a next step that also names the docs/work/ files. */
export function pointToWorkFiles(error: StoreAccessStateError, filesStep: string): StoreAccessStateError {
  const nextAction = error.nextAction.includes(filesStep) ? error.nextAction : `${error.nextAction} ${filesStep}`.trim();
  return makeStoreAccessStateError({
    code: error.code,
    operation: error.operation,
    reason: error.reason,
    nextAction,
    details: { ...error.details, authority: "files", workFiles: [...WORK_FILE_AUTHORITY_ROOTS] },
  });
}

/**
 * Run a Store read for a work read. On the CLI and MCP it first checks the
 * harness policy, as the registry does for a required Store admission. With
 * `session`, it runs inside the shared Store session for the checkout at
 * `root`; without it, `run` opens its own read-only session. Any Store failure
 * becomes its typed Store outcome, pointed at the `docs/work/` files.
 */
export async function runWorkStoreRead<T>(
  input: {
    operation: string;
    access: OperationAccess;
    root: string;
    context: OperationExecutionContext;
    filesStep: string;
    session: boolean;
    /**
     * A project URI read (PRD 52 R-WORK-URI-5). The harness grant of the folder
     * where the agent works decides, and a Store read grant there allows every
     * project URI. An agent whose folder is not a Make Docs project is refused
     * without being told to set that folder up.
     */
    projectUri?: boolean;
    /** The caller already ran {@link checkWorkHarness}. */
    harnessChecked?: boolean;
  },
  run: () => T | Promise<T>,
): Promise<T> {
  const { context } = input;
  // The registry imports the work operations, so it is loaded only when it is needed.
  const { scopeStoreAccessFailure } = await import("../../registry.js");
  try {
    // An absent Store gives one next step: create it (W29 R0 P4 second pass review item 5).
    // This is a file check only; it reads no Store state.
    if (!lstatSync(getStoreDatabasePath(context.storeRoot), { throwIfNoEntry: false })) {
      throw makeStoreAccessStateError({
        code: "store-unavailable",
        operation: input.operation,
        reason: "This computer has no Make Docs Store, so the work store cannot be read. Nothing changed.",
        nextAction: WORK_STORE_ABSENT_NEXT_ACTION,
      });
    }
    const agentRoute = (context.surface === "cli" || context.surface === "mcp") && context.route !== "test" && context.route !== "direct-cli";
    if (input.projectUri && agentRoute && !existsSync(getMakeDocsConfigPath(input.root))) {
      throw makeStoreAccessStateError({
        code: "store-not-configured",
        operation: input.operation,
        reason: `The folder where this agent works, ${input.root}, is not a Make Docs project, so the agent has no Store read grant for project URIs. A Store read grant in the project where the agent works allows every project URI.`,
        nextAction: "Start the agent in a Make Docs project whose harness access allows Store read, then read the project URI from there.",
        details: { projectRoot: input.root },
      });
    }
    if (!input.harnessChecked) await checkWorkHarness(input);
    return input.session
      ? await context.withStoreSession("read", input.operation, input.access, input.root, run)
      : await run();
  } catch (error) {
    const scoped = scopeStoreAccessFailure(error, input.operation, input.root);
    if (scoped instanceof StoreAccessStateError) throw pointToWorkFiles(scoped, input.filesStep);
    throw scoped;
  }
}

/**
 * The harness policy check of a work read, as the registry runs it for a
 * required Store admission, on the CLI and MCP only. It reads harness access
 * and the caller's grant, and no work store state. A project URI read names
 * the folder where the agent works in its refusal.
 */
export async function checkWorkHarness(input: {
  operation: string;
  access: OperationAccess;
  root: string;
  context: OperationExecutionContext;
  projectUri?: boolean;
}): Promise<void> {
  const { context } = input;
  if ((context.surface !== "cli" && context.surface !== "mcp") || context.route === "test") return;
  const { listHarnessCommandRules, validateRegistryHarnessCommandRules } = await import("../../registry.js");
  try {
    assertHarnessOperationAllowed({
      operation: input.operation,
      required: input.access,
      targetRoot: input.root,
      storeRoot: context.storeRoot,
      route: context.route,
      callerIdentityRaw: context.callerIdentityRaw,
      callerReference: context.callerReference,
      mcpConnectionId: context.mcpConnectionId,
      mcpConnectionKey: context.mcpConnectionKey,
      commandRuleAuthority: { list: listHarnessCommandRules, validate: validateRegistryHarnessCommandRules },
    });
  } catch (error) {
    if (!input.projectUri || !(error instanceof StoreAccessStateError)) throw error;
    // The grant is the one of the folder where the agent works, never of the project that the URI names.
    throw makeStoreAccessStateError({
      code: error.code,
      operation: error.operation,
      reason: `${error.reason} A project URI read uses the harness grant of the folder where the agent works: a Store read grant there allows every project URI.`,
      nextAction: error.nextAction,
      details: error.details,
    });
  }
}
