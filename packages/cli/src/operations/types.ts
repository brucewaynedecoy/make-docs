export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export class OperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OperationError";
  }
}

export type OperationDomainName =
  | "closeout"
  | "work"
  | "lifecycle"
  | "prd";

export interface OperationProvenance {
  domain: OperationDomainName;
  operation: string;
  source: "cli" | "mcp" | "test" | "shared";
  target?: string;
}

export type OperationRenderMode = "json" | "markdown" | "text";

/**
 * One registry operation as surfaced by `listOperationDomains()` (R-REG-2):
 * keyed by its stable registry identifier, with the mutation classification
 * flattened to a boolean and the registry lifecycle status carried through.
 */
export interface OperationCommandDescriptor {
  id: string;
  summary: string;
  mutates: boolean;
  status: "active" | "pending";
}

/** Registry operations grouped by their identifier's domain segment. */
export interface OperationDomainDescriptor {
  name: string;
  commands: OperationCommandDescriptor[];
}

export interface OperationResult<TValue = JsonValue> {
  value: TValue;
  provenance: OperationProvenance;
}
