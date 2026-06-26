import {
  buildCheckpoint,
  buildPhaseGateReport,
  buildScopeReport,
} from "../../operations";
import type {
  JsonValue,
  OperationDomainDescriptor,
  OperationResult,
} from "../types";

export const lifecycleDomain: OperationDomainDescriptor = {
  name: "lifecycle",
  summary: "Phase checkpoint, scope-guard, and phase-gate lifecycle operations.",
  commands: [
    {
      name: "checkpoint",
      summary: "Persist phase progress, validation, review, closeout, and commit evidence.",
      mutates: true,
      renderModes: ["json"],
    },
    {
      name: "scope-guard",
      summary: "Compare changed files against declared phase scope and allowed derived files.",
      mutates: false,
      renderModes: ["json"],
    },
    {
      name: "phase-gate",
      summary: "Check whether a phase has task, validation, review, closeout, and commit evidence.",
      mutates: false,
      renderModes: ["json"],
    },
  ],
};

export function checkpointPhase(input: Parameters<typeof buildCheckpoint>[0]): OperationResult<Record<string, JsonValue>> {
  return {
    value: buildCheckpoint(input),
    provenance: {
      domain: "lifecycle",
      operation: "checkpoint",
      source: "shared",
      target: input.target,
    },
  };
}

export function guardPhaseScope(input: {
  target: string;
  changed?: string[];
}): OperationResult<Record<string, JsonValue>> {
  return {
    value: buildScopeReport(input.target, input.changed),
    provenance: {
      domain: "lifecycle",
      operation: "scope-guard",
      source: "shared",
      target: input.target,
    },
  };
}

export function gatePhase(input: {
  target: string;
  commitPolicy?: string;
}): OperationResult<Record<string, JsonValue>> {
  return {
    value: buildPhaseGateReport(input.target, input.commitPolicy),
    provenance: {
      domain: "lifecycle",
      operation: "phase-gate",
      source: "shared",
      target: input.target,
    },
  };
}
