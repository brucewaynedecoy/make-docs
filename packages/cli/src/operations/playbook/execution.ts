import { spawnSync } from "node:child_process";
import {
  createExecutionContext,
  OperationApprovalRequiredError,
  OperationPendingError,
  OperationWriteDeniedError,
  type OperationExecutionContext,
} from "../context";
import {
  PLAYBOOK_RUN_OUTPUT_EVIDENCE_LIMIT,
  type PlaybookRunExecutionEvidence,
} from "./run-state";

/**
 * Deterministic step execution for the Run Playbook engine (W18 R7 P3;
 * PRD 35 R-MODE-1, R-TIER-1).
 *
 * A `deterministic` step declares exactly one executable invocation form:
 * `operation` (a stable Make Docs operation registry identifier) or
 * `command` (an external command line Make Docs does not own). This module
 * executes both forms — the operation through the operation core's uniform
 * dispatch, the command through the shell — and captures each structured
 * result as a {@link PlaybookRunExecutionEvidence} record. It also resolves
 * the CLI-absent presentation form: the human `make-docs run ...` command a
 * reader runs by hand when the calling surface cannot execute.
 *
 * Three-tier degradation guarantee (W18 R7 P4; PRD 35 R-TIER-1), realized
 * against the SAME Playbook source and proven end to end in
 * `tests/playbook-three-tiers.test.ts`:
 *
 * - Tier 1 — neither Make Docs nor the CLI present: there is no engine. The
 *   Playbook is structured Markdown documentation (narrative sections plus
 *   the readable workflow contract with per-step instructions) that a reader
 *   executes by hand, with nothing in this package required.
 * - Tier 2 — Make Docs resources present, no CLI: an agent reads the same
 *   structure through the repository's resources and the operation
 *   registry's documented command forms ({@link resolveOperationCliCommand},
 *   derived from `operationCliPath`, never hand-maintained) and executes the
 *   steps itself, without run tracking and without touching the global store.
 * - Tier 3 — CLI present: the full engine (`./progression`) runs, executes
 *   deterministic steps through this module, and records every transition in
 *   the global store keyed by (project id, run id).
 *
 * The execution happens BEFORE the run-state transition in
 * `advancePlaybookRun`, so a thrown execution error leaves the stored run
 * state untouched — the run never records an outcome it did not observe.
 */

/** Ten-minute ceiling on external step commands so a hung command cannot hang the engine (D9 implementer decision). */
export const PLAYBOOK_STEP_COMMAND_TIMEOUT_MS = 600_000;

export interface DeterministicExecutionResult {
  outcome: "completed" | "failed";
  evidence: PlaybookRunExecutionEvidence;
}

/**
 * The operation registry, loaded lazily: the registry statically imports the
 * playbook operation modules, which re-export this engine, so a static
 * import here would create a module-initialization cycle. Deterministic
 * execution resolves the live binding at call time instead.
 */
async function operationRegistry(): Promise<typeof import("../registry")> {
  return import("../registry");
}

/**
 * Derives the execution context a Playbook `operation:` step runs under.
 * The Playbook step is the third registry surface (R-SURF-1): it inherits
 * the advancing caller's write permission, dry-run, and approvals — the
 * uniform operation-core gating still applies to the nested invocation —
 * and resolves relative paths against the run's repository root.
 */
export function playbookStepExecutionContext(
  repoRoot: string,
  parent: OperationExecutionContext | undefined,
): OperationExecutionContext {
  return createExecutionContext({
    surface: "playbook-step",
    cwd: repoRoot,
    writesAllowed: parent?.writesAllowed ?? false,
    dryRun: parent?.dryRun ?? false,
    approvals: parent?.approvals ?? [],
    now: parent?.now,
  });
}

/**
 * Executes a deterministic step's `operation` through the operation core
 * (R-MODE-1). Success and handler failure both resolve to a structured
 * evidence record; gating refusals (write denied, missing approval, pending
 * identifier) and unknown identifiers are re-thrown untouched because they
 * mean the surface or the Playbook is misconfigured, not that the step ran
 * and failed.
 */
export async function executeDeterministicOperation(input: {
  operationId: string;
  operationInput: Record<string, unknown>;
  context: OperationExecutionContext;
}): Promise<DeterministicExecutionResult> {
  const registry = await operationRegistry();
  // Unknown identifiers throw here, before any execution (fail-closed).
  registry.getOperation(input.operationId);
  try {
    const invocation = await registry.invokeOperation(
      input.operationId,
      input.operationInput,
      input.context,
    );
    const summary = truncateForEvidence(JSON.stringify(invocation.value) ?? "null");
    return {
      outcome: "completed",
      evidence: {
        form: "operation",
        operation: input.operationId,
        command: null,
        exitCode: null,
        stdoutTail: null,
        stderrTail: null,
        resultSummary: summary.text,
        errorMessage: null,
        truncated: summary.truncated,
      },
    };
  } catch (error) {
    if (isExecutionRefusal(error)) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    return {
      outcome: "failed",
      evidence: {
        form: "operation",
        operation: input.operationId,
        command: null,
        exitCode: null,
        stdoutTail: null,
        stderrTail: null,
        resultSummary: null,
        errorMessage: truncateForEvidence(message).text,
        truncated: false,
      },
    };
  }
}

/**
 * Executes a deterministic step's external `command` through the shell
 * (R-MODE-1), capturing the exit code and output tails as structured
 * evidence. A non-zero exit code, a timeout, and a spawn failure all report
 * `failed` — the engine records what happened and routes the failure; it
 * never throws a shell result away.
 */
export function executeDeterministicCommand(input: {
  commandRun: string;
  repoRoot: string;
}): DeterministicExecutionResult {
  const result = spawnSync(input.commandRun, {
    shell: true,
    cwd: input.repoRoot,
    encoding: "utf8",
    timeout: PLAYBOOK_STEP_COMMAND_TIMEOUT_MS,
  });
  const stdout = truncateForEvidence(result.stdout ?? "");
  const stderr = truncateForEvidence(result.stderr ?? "");
  const exitCode = result.status;
  const errorMessage = result.error
    ? result.error.message
    : exitCode === null
      ? `Command terminated without an exit code${result.signal ? ` (signal ${result.signal})` : ""}.`
      : null;
  return {
    outcome: exitCode === 0 ? "completed" : "failed",
    evidence: {
      form: "command",
      operation: null,
      command: input.commandRun,
      exitCode,
      stdoutTail: stdout.text,
      stderrTail: stderr.text,
      resultSummary: null,
      errorMessage,
      truncated: stdout.truncated || stderr.truncated,
    },
  };
}

/**
 * Resolves the human CLI command form a reader runs by hand when the runner
 * cannot execute (R-MODE-1, R-TIER-1): derived from the operation registry's
 * single CLI-path rule, never a hand-maintained string, and validated
 * against the registry so an unknown identifier is refused instead of
 * presented.
 */
export async function resolveOperationCliCommand(operationId: string): Promise<string> {
  const registry = await operationRegistry();
  return registry.operationCliCommand(operationId);
}

/**
 * Gating refusals are advance-level errors, not step failures: write denial,
 * a missing named approval, and a pending identifier all mean the calling
 * surface or the Playbook is misconfigured, so they propagate (leaving run
 * state untouched) instead of recording a `failed` outcome the step never
 * produced.
 */
function isExecutionRefusal(error: unknown): boolean {
  return (
    error instanceof OperationWriteDeniedError ||
    error instanceof OperationApprovalRequiredError ||
    error instanceof OperationPendingError
  );
}

function truncateForEvidence(text: string): { text: string | null; truncated: boolean } {
  if (!text) {
    return { text: text === "" ? "" : null, truncated: false };
  }
  if (text.length <= PLAYBOOK_RUN_OUTPUT_EVIDENCE_LIMIT) {
    return { text, truncated: false };
  }
  // Keep the tail: failures usually surface at the end of a stream.
  return { text: text.slice(-PLAYBOOK_RUN_OUTPUT_EVIDENCE_LIMIT), truncated: true };
}
