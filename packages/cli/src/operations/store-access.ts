import { OperationError } from "./types";

export type StoreAccessState =
  | "store-not-configured"
  | "store-unavailable"
  | "store-unsafe"
  | "store-denied";

/**
 * A Store issue text can already end with the same next action (for example
 * `formatStoreIssue` for a Store changed outside Make Docs). The scoped error
 * states the next action once, so it is removed from the end of the reason.
 */
export function withoutRepeatedNextAction(reason: string, nextAction: string): string {
  const action = nextAction.trim();
  const text = reason.trimEnd();
  if (!action || !text.endsWith(action) || text.length === action.length) return reason;
  return text.slice(0, text.length - action.length).trimEnd();
}

/** A Store failure is scoped to one operation. It is not a task-wide stop. */
export class StoreAccessStateError extends OperationError {
  readonly name = "StoreAccessStateError";
  readonly scope = "operation" as const;
  readonly taskCanContinue = true;
  readonly reason: string;

  constructor(
    readonly code: StoreAccessState,
    readonly operation: string,
    reason: string,
    readonly nextAction: string,
    readonly details: Record<string, unknown> = {},
  ) {
    const statedOnce = withoutRepeatedNextAction(reason, nextAction);
    super(
      `${statedOnce} Only operation '${operation}' stopped. Independent Store-free work can continue. ` +
        `Next: ${nextAction}`,
    );
    this.reason = statedOnce;
  }
}

export function makeStoreAccessStateError(input: {
  code: StoreAccessState;
  operation: string;
  reason: string;
  nextAction: string;
  details?: Record<string, unknown>;
}): StoreAccessStateError {
  return new StoreAccessStateError(
    input.code,
    input.operation,
    input.reason,
    input.nextAction,
    input.details,
  );
}
