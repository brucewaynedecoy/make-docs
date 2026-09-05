/** Explicit inputs for shared lab instruments. No target is enabled by default. */
export type LabVerificationStatus = "provisional" | "verified";
interface LabClaim { command: string; args: string[]; status: LabVerificationStatus; reference: string }
export interface LabInterrogation {
  versionCommand: LabClaim | null;
  launchCommand: LabClaim | null;
  listingCaptures: {
    id: string; description: string; status: LabVerificationStatus; reference: string;
    form: { kind: "command-output"; command: string; args: string[] }
      | { kind: "directory-listing"; path: string }
      | { kind: "manifest-read"; path: string };
  }[];
  invocationEvidence: { description: string; status: LabVerificationStatus; reference: string } | null;
  workspaceNotes: string[];
  knownGaps: string[];
}
export interface ConformanceLabTarget {
  harnessId: string;
  placementRoots: string[];
  verification: { status: LabVerificationStatus };
  labInterrogation: LabInterrogation | null;
}

/** Preserve the lab path and verification guards without the retired compiler descriptor. */
export function listLabTargetErrors(target: ConformanceLabTarget): string[] {
  const errors: string[] = [];
  const localPath = (value: string) => value.length > 0 && !value.startsWith("/") && !value.includes("\\") && !value.split("/").includes("..");
  for (const root of target.placementRoots) {
    if (!localPath(root)) errors.push("placement roots must be workspace-relative");
  }
  const block = target.labInterrogation;
  if (!block) return errors;
  const ids = new Set<string>();
  for (const capture of block.listingCaptures) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(capture.id) || ids.has(capture.id)) errors.push("capture ids must be unique lowercase slugs");
    ids.add(capture.id);
    if (capture.form.kind !== "command-output" && !localPath(capture.form.path)) errors.push("capture paths must be workspace-relative");
  }
  for (const claim of [block.versionCommand, block.launchCommand, block.invocationEvidence, ...block.listingCaptures]) {
    if (claim?.status === "verified" && target.verification.status !== "verified") errors.push("verified lab claims require a verified target");
  }
  return errors;
}
