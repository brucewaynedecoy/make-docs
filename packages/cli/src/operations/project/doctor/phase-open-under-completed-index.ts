import { hasUncheckedTaskBox } from "../../work/work-queue/readiness";
import { classifyWorkFilePath, joinWorkFileLines, parseWorkFile, recordedStatusOf, splitWorkFileLines } from "../../work/work-store/work-file";

/**
 * The `phase-open-under-completed-index` doctor check (W29 R0 P6; owner
 * decision of 2026-11-23 on FOLLOW-UP-P6-CLOSED-PARENT, option B).
 *
 * An index status does not cascade to its phases (PRD 52 R-WORK-QUEUE-4 and
 * R-WORK-QUEUE-20). A phase whose status line still says active or open under
 * an index that says completed waits in the work queue for ever. When every
 * task in the phase is checked, the fix sets its status line to completed.
 * Otherwise the finding is report only: a person decides whether the phase is
 * done, superseded, or still open.
 *
 * Agent twin: `make-docs://system/reference/project-doctor.md`.
 */

/** Status line words that this check reads as open. */
export const OPEN_PHASE_STATUS_WORDS: readonly string[] = Object.freeze(["active", "open"]);
/** The status word that the fix writes. An index reads as completed when the work queue reads its status as closed and done, such as `completed` or `complete`. */
export const COMPLETED_INDEX_STATUS = "completed";

/** Whether an index status means completed, with the same status map as the work queue (WORK_RECORDED_STATUS_MAP). */
export function indexIsCompleted(indexStatus: string | null): boolean {
  if (indexStatus === null) return false;
  const pair = recordedStatusOf(indexStatus);
  return pair.status === "closed" && pair.closeOutcome === "done";
}

export interface PhaseOpenUnderCompletedIndexMatch {
  /** The line of the status line. */
  line: number;
  /** The status line as it is. */
  current: string;
  /** The fixed status line, or the same line for a report-only finding. */
  replacement: string;
  /** Whether every task is checked, so the fix may set the status line. */
  fixable: boolean;
  /** The fixed text of the whole file, or null for a report-only finding. */
  after: string | null;
}

/** The recorded status of an index file, in lower case, or null when it has none or cannot be read. */
export function indexRecordedStatus(relativePath: string, text: string): string | null {
  const info = classifyWorkFilePath(relativePath);
  if (!info || info.kind !== "index") return null;
  const parsed = parseWorkFile(relativePath, text);
  if (!parsed.ok) return null;
  return parsed.document.units[0]!.recordedStatus?.trim().toLowerCase() ?? null;
}

const STATUS_LINE = /^(status:\s*)(["']?)([A-Za-z-]+)\2(\s*)$/;

/**
 * Check one phase file against the recorded status of its backlog's index.
 * Returns null when the file is not a phase file, cannot be read as a work
 * file, has no open status line, or the index does not say completed (or
 * another word that the work queue reads as closed and done).
 */
export function scanPhaseOpenUnderCompletedIndex(relativePath: string, text: string, indexStatus: string | null): PhaseOpenUnderCompletedIndexMatch | null {
  if (!indexIsCompleted(indexStatus)) return null;
  const info = classifyWorkFilePath(relativePath);
  if (!info || info.kind !== "phase") return null;
  const parsed = parseWorkFile(relativePath, text);
  if (!parsed.ok) return null;
  const phase = parsed.document.units[0]!;
  if (phase.recordedStatus === null || !OPEN_PHASE_STATUS_WORDS.includes(phase.recordedStatus.trim().toLowerCase())) return null;

  const bom = text.startsWith("﻿") ? "﻿" : "";
  const lines = splitWorkFileLines(text.slice(bom.length));
  if (lines[0]?.text !== "---") return null;
  const end = lines.findIndex((entry, index) => index > 0 && entry.text === "---");
  if (end < 0) return null;
  const at = lines.slice(1, end).findIndex((entry) => STATUS_LINE.test(entry.text));
  if (at < 0) return null;
  const index = at + 1;
  const current = lines[index]!.text;
  const tasks = parsed.document.units.filter((unit) => unit.kind === "task");
  const fixable = tasks.length > 0 && tasks.every((task) => task.recordedStatus === "[x]") && !hasUncheckedTaskBox(text);
  if (!fixable) return { line: index + 1, current, replacement: current, fixable: false, after: null };

  // Keep the key, the spacing, and the quote style; change only the word.
  const replacement = current.replace(STATUS_LINE, (_match, key: string, quote: string, _word: string, tail: string) => `${key}${quote}${COMPLETED_INDEX_STATUS}${quote}${tail}`);
  lines[index] = { ...lines[index]!, text: replacement };
  const after = bom + joinWorkFileLines(lines);
  // The fix must give a file that the work parser reads as completed.
  const check = parseWorkFile(relativePath, after);
  if (!check.ok || check.document.units[0]!.recordedStatus?.toLowerCase() !== COMPLETED_INDEX_STATUS) return null;
  return { line: index + 1, current, replacement, fixable: true, after };
}
