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

export type OperationDomainName = "closeout" | "work" | "lifecycle";

export interface OperationProvenance {
  domain: OperationDomainName;
  operation: string;
  source: "cli" | "mcp" | "test" | "shared";
  target?: string;
}

export type OperationRenderMode = "json" | "markdown" | "text";

export interface OperationCommandDescriptor {
  name: string;
  summary: string;
  mutates: boolean;
  renderModes: OperationRenderMode[];
}

export interface OperationDomainDescriptor {
  name: OperationDomainName;
  summary: string;
  commands: OperationCommandDescriptor[];
}

export interface OperationResult<TValue = JsonValue> {
  value: TValue;
  provenance: OperationProvenance;
}
