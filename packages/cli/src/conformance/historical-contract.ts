/** Data vocabulary for historical receipts. This does not expose a compiler or claim current support. */
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
