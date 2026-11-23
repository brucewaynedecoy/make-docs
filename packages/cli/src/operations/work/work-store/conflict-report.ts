import { WORK_SETTLE_OPTIONS, WORK_SYNC_TABLE } from "./catalog.js";
import type { WorkConflictKind, WorkSettleChoice } from "./schemas.js";

/**
 * W29 R0 P3 conflict report (PRD 52 R-WORK-SYNC-4, R-WORK-SYNC-5,
 * R-WORK-SYNC-11, R-WORK-SYNC-12).
 *
 * A conflict report shows both sides of one work file, the units that the
 * conflict holds, and one settle command for each of the two choices of its
 * kind. The commands are the `make-docs work sync --settle` form from the P1
 * rule catalog and the name catalog (`work.queue.sync`), which W29 R0 P4 T15
 * built.
 */

export interface WorkConflictUnitDifference {
  coordinate: string;
  /** What the file shows, or null when the file does not have the unit. */
  file: string | null;
  /** What the store holds, or null when the store does not have the unit. */
  store: string | null;
}

export interface WorkConflictSide {
  /** The file side: present, and its SHA-256 digest; or missing. The store side: its revision, or no record. */
  present: boolean;
  digest: string | null;
  revision: number | null;
  units: string[];
}

export interface WorkConflictChoice {
  /** A settle choice of `work sync --settle`, or `release` for `work release` of one claimed unit. */
  choice: WorkSettleChoice | "release";
  effect: string;
  command: string;
}

/** A claim that holds a unit of a `claimed` conflict. Never the claim ID. */
export interface WorkConflictClaim {
  coordinate: string;
  claimant: string;
  expiresAt: string;
  live: boolean;
  hasTaskHandle: boolean;
  /** The unit revision, for `--expected-version`. */
  revision: number;
}

/** The meaning of a `claimed` conflict, in plain words. */
export const WORK_CLAIMED_CONFLICT_MEANING =
  "The file closes or removes a unit that a claim still holds, live or expired. An import never acts for a claim holder, so Make Docs stopped this file. The claim ends only through its holder, a takeover, or a release after a check of its task handle. If nobody acts, make-docs setup store check lists an expired claim after 7 days (STORE-DECISION-004).";

/** The `work release` choice for each claim of a `claimed` conflict, then the settle choices. */
export function claimedConflictChoices(path: string, claims: readonly WorkConflictClaim[]): WorkConflictChoice[] {
  const releases = claims.map((claim): WorkConflictChoice => claim.live
    ? {
        choice: "release",
        effect: `${claim.claimant} holds ${claim.coordinate} until ${claim.expiresAt}. The holder releases it with its claim ID, or closes the unit; then the next sync imports the file.`,
        command: `make-docs work release ${claim.coordinate} --claim-id <claim ID> --expected-version ${claim.revision}`,
      }
    : {
        choice: "release",
        effect: `The claim of ${claim.claimant} on ${claim.coordinate} ended at ${claim.expiresAt}. ${claim.hasTaskHandle ? "Check its task handle, then release it" : "It has no task handle, so a person releases it"}; then the next sync imports the file.`,
        command: `make-docs work release ${claim.coordinate} --handle ${claim.hasTaskHandle ? "<stopped|finished|not-found>" : "no-handle"} --expected-version ${claim.revision}`,
      });
  return [...releases, ...settleChoices("claimed", path)];
}

export interface WorkConflictReport {
  path: string;
  kind: WorkConflictKind;
  /** The plain meaning of the sync table row that gave this conflict, or of the import guard that stopped the file. */
  meaning: string;
  /** Why an import guard stopped the file, each naming a unit. Empty for a plain sync table conflict. */
  reasons: string[];
  file: WorkConflictSide;
  store: WorkConflictSide;
  /** The last applied digest of this checkout, or null. */
  lastAppliedDigest: string | null;
  /** The units that wait until a person settles the conflict. Only units of this file. */
  affectedUnits: string[];
  differences: WorkConflictUnitDifference[];
  choices: WorkConflictChoice[];
}

/** Quote a path for a shell command when it needs it. */
export function shellPath(value: string): string {
  return /^[A-Za-z0-9._/@+-]+$/.test(value) ? value : `'${value.replaceAll("'", "'\\''")}'`;
}

/** The two settle choices of a conflict kind, with the exact command for this path. */
export function settleChoices(kind: WorkConflictKind, path: string): WorkConflictChoice[] {
  return WORK_SETTLE_OPTIONS[kind].map((option) => ({
    choice: option.choice,
    effect: option.effect,
    command: option.command.replace("<path>", shellPath(path)),
  }));
}

/** The plain meaning of the sync table row for this file state, store state, and setting. */
export function syncRowMeaning(file: string, store: string, projection: "on" | "off"): string {
  const row = WORK_SYNC_TABLE.find(
    (candidate) =>
      candidate.file === file &&
      (candidate.store === "any" || candidate.store === store) &&
      (candidate.projection === "any" || candidate.projection === projection),
  );
  return row?.humanMeaning ?? "Make Docs cannot tell which side changed this work. A person decides.";
}

export function buildWorkConflictReport(input: {
  path: string;
  kind: WorkConflictKind;
  fileState: string;
  storeState: string;
  projection: "on" | "off";
  file: WorkConflictSide;
  store: WorkConflictSide;
  lastAppliedDigest: string | null;
  affectedUnits: string[];
  differences: WorkConflictUnitDifference[];
  reasons?: string[];
  /** The claims of a `claimed` conflict, for its release choices. */
  claims?: readonly WorkConflictClaim[];
  /** True when an import guard stopped the file, also when its recorded conflict is shown later with no reasons. */
  stoppedByGuard?: boolean;
}): WorkConflictReport {
  const reasons = input.reasons ?? [];
  return {
    path: input.path,
    kind: input.kind,
    meaning: input.kind === "claimed"
      ? WORK_CLAIMED_CONFLICT_MEANING
      : reasons.length > 0 || input.stoppedByGuard
        ? "Make Docs stopped this file instead of importing it, so no store data is lost and no claim is overridden. A person decides."
        : syncRowMeaning(input.fileState, input.storeState, input.projection),
    reasons,
    file: input.file,
    store: input.store,
    lastAppliedDigest: input.lastAppliedDigest,
    affectedUnits: input.affectedUnits,
    differences: input.differences,
    choices: input.kind === "claimed" ? claimedConflictChoices(input.path, input.claims ?? []) : settleChoices(input.kind, input.path),
  };
}

const shortDigest = (digest: string | null) => (digest ? digest.slice(0, 12) : "none");

/** Human words first: what happened, what waits, and the two commands. */
export function formatWorkConflictReport(report: WorkConflictReport): string {
  const lines = [
    `Sync stopped for ${report.path}.`,
    report.meaning,
    ...report.reasons,
    `File: ${report.file.present ? `present (sha256 ${shortDigest(report.file.digest)})` : "missing"}.`,
    `Store: ${report.store.present ? `revision ${report.store.revision}, ${report.store.units.length} unit${report.store.units.length === 1 ? "" : "s"}` : "no record of this work"}.`,
  ];
  if (report.differences.length > 0) {
    lines.push("What differs:");
    for (const difference of report.differences.slice(0, 20)) {
      lines.push(`- ${difference.coordinate}: file ${difference.file ?? "(none)"}; store ${difference.store ?? "(none)"}.`);
    }
    if (report.differences.length > 20) lines.push(`- And ${report.differences.length - 20} more.`);
  }
  lines.push(
    report.affectedUnits.length > 0
      ? `These units wait until you choose: ${report.affectedUnits.join(", ")}. Other files continue.`
      : "No unit waits, because the store has no work for this file. Other files continue.",
  );
  lines.push("Choose one:");
  for (const choice of report.choices) lines.push(`- ${choice.effect} Run: ${choice.command}`);
  return lines.join("\n");
}
