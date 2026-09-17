import { OperationError } from "./types";

export type StoreAccessState =
  | "store-not-configured"
  | "store-unavailable"
  | "store-unsafe"
  | "store-denied";

/** A Store failure is scoped to one operation. It is not a task-wide stop. */
export class StoreAccessStateError extends OperationError {
  readonly name = "StoreAccessStateError";
  readonly scope = "operation" as const;
  readonly taskCanContinue = true;

  constructor(
    readonly code: StoreAccessState,
    readonly operation: string,
    readonly reason: string,
    readonly nextAction: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(
      `${reason} Only operation '${operation}' stopped. Independent Store-free work can continue. ` +
        `Next: ${nextAction}`,
    );
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
