/** Data vocabulary for historical receipts. This does not expose a compiler or claim current support. */
import { existsSync, readFileSync } from "node:fs";
import { OperationError } from "../operations/types";
export const CONFORMANCE_OUTPUT_KINDS = ["plugin", "skills-bundle"] as const;
export const CONFORMANCE_SCOPES = ["project", "global", "export-only"] as const;
export const CONFORMANCE_RECORD_KINDS = [
  "source-playbook", "generated-plugin", "generated-skills-bundle", "generated-adapter",
  "symlink-exposure", "copy-mirror", "export-only-file", "user-authored-file", "legacy-generated-output",
] as const;
export type ConformanceOutputKind = (typeof CONFORMANCE_OUTPUT_KINDS)[number];
export type ConformanceScope = (typeof CONFORMANCE_SCOPES)[number];
export type ConformanceRecordKind = (typeof CONFORMANCE_RECORD_KINDS)[number];
export const RETIRED_CONFORMANCE_SCENARIOS = [
  "packaging/dependency-check-both-directions",
  "packaging/plugin-marketplace-install",
  "packaging/skills-bundle-discovery-invocation",
  "packaging/uninstall-backup-cleanliness",
] as const;
export function isRetiredConformanceScenario(id: string | null): boolean {
  return id !== null && (RETIRED_CONFORMANCE_SCENARIOS as readonly string[]).includes(id);
}

export interface HistoricalConformanceEvidencePackage {
  record: "make-docs.conformance.tuple-registry";
  schemaVersion: 1;
  tuples: unknown[];
  [key: string]: unknown;
}

/** Read version 1 evidence only for audit. It cannot enter active support resolution. */
export function loadHistoricalConformanceEvidencePackage(
  evidencePath: string,
): HistoricalConformanceEvidencePackage {
  if (!existsSync(evidencePath)) throw new OperationError(`Historical conformance evidence was not found at \`${evidencePath}\`.`);
  let value: unknown;
  try {
    value = JSON.parse(readFileSync(evidencePath, "utf8"));
  } catch (error) {
    throw new OperationError(`Historical conformance evidence is not valid JSON: ${String(error)}`);
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new OperationError("Historical conformance evidence must be an object.");
  }
  const record = value as Partial<HistoricalConformanceEvidencePackage>;
  if (record.record !== "make-docs.conformance.tuple-registry" || record.schemaVersion !== 1 || !Array.isArray(record.tuples)) {
    throw new OperationError("Historical conformance evidence must use the retired version 1 registry shape.");
  }
  return Object.freeze(value as HistoricalConformanceEvidencePackage);
}
