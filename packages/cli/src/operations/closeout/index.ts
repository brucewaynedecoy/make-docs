import { buildCloseoutProbe } from "../../operations";
import type {
  JsonValue,
  OperationDomainDescriptor,
  OperationResult,
} from "../types";

export const closeoutDomain: OperationDomainDescriptor = {
  name: "closeout",
  summary: "Closeout probing, validation planning, and history-generation operations.",
  commands: [
    {
      name: "closeout-probe",
      summary: "Summarize changed files, contracts, coordinates, risks, and validation hints.",
      mutates: false,
      renderModes: ["json"],
    },
    {
      name: "closeout-validate",
      summary: "Build or run closeout validation commands from a closeout probe.",
      mutates: false,
      renderModes: ["json"],
    },
    {
      name: "closeout-history",
      summary: "Render or write the closeout history record for a probe and phase state.",
      mutates: true,
      renderModes: ["json", "markdown"],
    },
  ],
};

export function probeCloseout(input: {
  repoRoot: string;
  scope: "auto" | "staged" | "unstaged" | "full";
}): OperationResult<Record<string, JsonValue>> {
  return {
    value: buildCloseoutProbe(input),
    provenance: {
      domain: "closeout",
      operation: "closeout-probe",
      source: "shared",
      target: input.repoRoot,
    },
  };
}
