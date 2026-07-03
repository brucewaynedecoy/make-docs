/**
 * Shared harness registry (W18 R8 P1, R-CAP-1).
 *
 * One registry, keyed by canonical harness id, serves both capability
 * questions without either side redefining the other:
 *
 * - The packaging-time question — can this harness host a given agentic
 *   primitive (plugin, hook, extension, skill, MCP server)? — is answered
 *   here from the entry's harness capability descriptor
 *   ({@link canHarnessHostPrimitive}).
 * - The run-time question — can this harness execute a given step's required
 *   surface? — stays owned by the W18 R7 runner lineage (PRD 35):
 *   `evaluateHarnessCapabilities` in `operations/playbook` keeps its
 *   semantics and its `HarnessCapabilityRecord` config source unchanged, and
 *   consults this registry only for harness identity — the entry links to the
 *   run-time record through {@link HarnessRegistryEntry.runtimeCapability}
 *   `recordKey`, resolved via {@link resolveRuntimeCapabilityRecordKey}.
 *
 * Implementer decision: the seam is deliberately identity-only. The registry
 * never carries run-time capability values, review statuses, or evaluation
 * logic; it enumerates harnesses and binds each canonical id to both the
 * packaging descriptor and the run-time record key. Adding a harness adds a
 * descriptor (plus an adapter module, fixtures, and conformance scenarios) —
 * never planner or resolver conditionals (R-KEEP-1).
 */

import {
  FIRST_PARTY_HARNESS_CAPABILITY_DESCRIPTORS,
  FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR,
} from "./playbook-packaging/descriptors";
import type {
  HarnessAgenticPrimitive,
  HarnessCapabilityDescriptor,
} from "./playbook-packaging/capability-descriptor";
import { OperationError } from "./types";

export interface HarnessRegistryEntry {
  /** Canonical harness id shared by the packaging and run-time questions. */
  harnessId: string;
  /** Packaging-time knowledge: the harness capability descriptor (R-CAP-2). */
  descriptor: HarnessCapabilityDescriptor;
  /**
   * Identity link to the run-time capability record: the `harness` key of the
   * `harnessCapabilities` config record the W18 R7 evaluation reads. The
   * record itself and its evaluation semantics stay with the runner lineage.
   */
  runtimeCapability: {
    recordKey: string;
  };
}

function toRegistryEntry(descriptor: HarnessCapabilityDescriptor): HarnessRegistryEntry {
  return {
    harnessId: descriptor.harnessId,
    descriptor,
    runtimeCapability: { recordKey: descriptor.harnessId },
  };
}

export const FIRST_PARTY_HARNESS_REGISTRY_ENTRIES: HarnessRegistryEntry[] =
  FIRST_PARTY_HARNESS_CAPABILITY_DESCRIPTORS.map(toRegistryEntry);

export const FIXTURE_FUTURE_HARNESS_REGISTRY_ENTRY: HarnessRegistryEntry = toRegistryEntry(
  FIXTURE_FUTURE_HARNESS_CAPABILITY_DESCRIPTOR,
);

export function listHarnessRegistryEntries(input: {
  includeFixtures?: boolean;
  descriptors?: HarnessCapabilityDescriptor[];
} = {}): HarnessRegistryEntry[] {
  if (input.descriptors) {
    return input.descriptors.map(toRegistryEntry);
  }
  return [
    ...FIRST_PARTY_HARNESS_REGISTRY_ENTRIES,
    ...(input.includeFixtures ? [FIXTURE_FUTURE_HARNESS_REGISTRY_ENTRY] : []),
  ];
}

export function findHarnessRegistryEntry(input: {
  harnessId: string;
  includeFixtures?: boolean;
  descriptors?: HarnessCapabilityDescriptor[];
}): HarnessRegistryEntry | null {
  return (
    listHarnessRegistryEntries(input).find((entry) => entry.harnessId === input.harnessId) ?? null
  );
}

export function getHarnessRegistryEntry(input: {
  harnessId: string;
  includeFixtures?: boolean;
  descriptors?: HarnessCapabilityDescriptor[];
}): HarnessRegistryEntry {
  const entry = findHarnessRegistryEntry(input);
  if (!entry) {
    throw new OperationError(
      `No harness registry entry exists for \`${input.harnessId}\`.`,
    );
  }
  return entry;
}

/**
 * The packaging-time capability question (R-CAP-1): can this harness host the
 * given agentic primitive? `harnessKnown` distinguishes an unregistered
 * harness from a registered harness that lacks the primitive so callers can
 * fail closed on unknown ids (R-ADAPT-5).
 */
export function canHarnessHostPrimitive(input: {
  harnessId: string;
  primitive: HarnessAgenticPrimitive;
  includeFixtures?: boolean;
  descriptors?: HarnessCapabilityDescriptor[];
}): { harnessKnown: boolean; supported: boolean } {
  const entry = findHarnessRegistryEntry(input);
  if (!entry) {
    return { harnessKnown: false, supported: false };
  }
  return {
    harnessKnown: true,
    supported: entry.descriptor.supportedPrimitives.includes(input.primitive),
  };
}

/**
 * Resolves the run-time capability record key for a harness identity. A
 * registered harness resolves through its registry entry; an unregistered
 * harness passes through unchanged so user-configured records for harnesses
 * without descriptors keep working exactly as before (R-SCOPE-1: the run-time
 * semantics are not redefined here).
 */
export function resolveRuntimeCapabilityRecordKey(input: {
  harness: string;
  includeFixtures?: boolean;
  descriptors?: HarnessCapabilityDescriptor[];
}): string {
  const entry = findHarnessRegistryEntry({
    harnessId: input.harness,
    includeFixtures: input.includeFixtures,
    descriptors: input.descriptors,
  });
  return entry?.runtimeCapability.recordKey ?? input.harness;
}
