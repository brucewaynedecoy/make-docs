import { WORK_SETTLE_OPTIONS, WORK_SYNC_TABLE } from "./catalog.js";
import type { WorkConflictKind, WorkSettleChoice } from "./schemas.js";

/**
 * W29 R0 P3 conflict report (PRD 52 R-WORK-SYNC-4, R-WORK-SYNC-5,
 * R-WORK-SYNC-11, R-WORK-SYNC-12).
 *
 * A conflict report shows both sides of one work file, the units that the
 * conflict holds, and one settle command for each of the two choices of its
 * kind. The commands are the planned `make-docs work sync --settle` form from
 * the P1 rule catalog and the name catalog (`work.queue.sync`). P4 builds the
 * command; P3 only names it.
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
  choice: WorkSettleChoice;
  effect: string;
  command: string;
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
}): WorkConflictReport {
  const reasons = input.reasons ?? [];
  return {
    path: input.path,
    kind: input.kind,
    meaning: reasons.length > 0
      ? "Make Docs stopped this file instead of importing it, so no store data is lost and no claim is overridden. A person decides."
      : syncRowMeaning(input.fileState, input.storeState, input.projection),
    reasons,
    file: input.file,
    store: input.store,
    lastAppliedDigest: input.lastAppliedDigest,
    affectedUnits: input.affectedUnits,
    differences: input.differences,
    choices: settleChoices(input.kind, input.path),
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
