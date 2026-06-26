import {
  buildPhasePlan,
  buildWaveStatus,
  parseWorkPhase,
  resolveWaveTarget,
  type PhaseState,
  type WaveResolution,
} from "../../operations";
import type {
  JsonValue,
  OperationDomainDescriptor,
  OperationResult,
} from "../types";

export const workDomain: OperationDomainDescriptor = {
  name: "work",
  summary: "Wave, phase, and work-backlog inspection and planning operations.",
  commands: [
    {
      name: "work-phase-state",
      summary: "Parse one work phase document into deterministic task and validation state.",
      mutates: false,
      renderModes: ["json"],
    },
    {
      name: "wave-resolve",
      summary: "Resolve a wave or phase coordinate/path to the active work target.",
      mutates: false,
      renderModes: ["json"],
    },
    {
      name: "wave-status",
      summary: "Summarize wave phase completion and any saved phase state.",
      mutates: false,
      renderModes: ["json"],
    },
    {
      name: "phase-plan",
      summary: "Build the implementation plan for the next incomplete phase.",
      mutates: false,
      renderModes: ["json", "markdown"],
    },
  ],
};

export function readWorkPhaseState(phasePath: string): OperationResult<PhaseState> {
  return {
    value: parseWorkPhase(phasePath),
    provenance: {
      domain: "work",
      operation: "work-phase-state",
      source: "shared",
      target: phasePath,
    },
  };
}

export function resolveWorkWave(target: string): OperationResult<WaveResolution> {
  return {
    value: resolveWaveTarget(target),
    provenance: {
      domain: "work",
      operation: "wave-resolve",
      source: "shared",
      target,
    },
  };
}

export function readWaveStatus(target: string): OperationResult<Record<string, JsonValue>> {
  return {
    value: buildWaveStatus(target),
    provenance: {
      domain: "work",
      operation: "wave-status",
      source: "shared",
      target,
    },
  };
}

export function planWorkPhase(target: string): OperationResult<Record<string, JsonValue>> {
  return {
    value: buildPhasePlan(target),
    provenance: {
      domain: "work",
      operation: "phase-plan",
      source: "shared",
      target,
    },
  };
}
