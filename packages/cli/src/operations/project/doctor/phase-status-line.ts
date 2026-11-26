import { hasUncheckedTaskBox } from "../../work/work-queue/readiness";
import { classifyWorkFilePath, joinWorkFileLines, parseWorkFile, splitWorkFileLines } from "../../work/work-store/work-file";

/**
 * The `phase-status-line` doctor check (W29 R0 P5 T10; owner decision of
 * 2026-11-23 on W29 R0 P4 review finding 7; PRD 52 R-WORK-QUEUE-20).
 *
 * A phase file with no status line whose tasks are all checked counts as done
 * only through the all-tasks-checked fallback. The check proposes the status
 * line that its tasks show, so the fallback is needed less over time. It uses
 * the same parser and the same unchecked-box rule as the work queue, so the
 * check and `work next` name the same phases.
 *
 * Agent twin: `make-docs://system/reference/project-doctor.md`.
 */

/** Every task is checked, so the status line says so. `completed` is the most common recorded word for done. */
export const PHASE_STATUS_LINE_VALUE = "completed";
export const PHASE_STATUS_LINE = `status: "${PHASE_STATUS_LINE_VALUE}"`;

export interface PhaseStatusLineMatch {
  /** The line of the new status line in the fixed text. */
  line: number;
  current: "";
  replacement: typeof PHASE_STATUS_LINE;
  /** The fixed text of the whole file. */
  after: string;
  /** True when the file had no front matter, so the fix adds front matter that holds only the status line. */
  addsFrontMatter: boolean;
}

const BOM = "﻿";

/**
 * Check one file. `relativePath` is repository-relative, such as
 * `docs/work/2026-01-01-w1-r0-sample/01-phase.md`. Returns null when the file
 * is not a phase file, cannot be read as a work file, has a status line, has no
 * task, or has an unchecked task or checkbox.
 */
export function scanPhaseStatusLine(relativePath: string, text: string): PhaseStatusLineMatch | null {
  const info = classifyWorkFilePath(relativePath);
  if (!info || info.kind !== "phase") return null;
  const parsed = parseWorkFile(relativePath, text);
  if (!parsed.ok) return null;
  const phase = parsed.document.units[0]!;
  if (phase.recordedStatus !== null) return null;
  const tasks = parsed.document.units.filter((unit) => unit.kind === "task");
  if (tasks.length === 0 || tasks.some((task) => task.recordedStatus !== "[x]")) return null;
  if (hasUncheckedTaskBox(text)) return null;

  const bom = text.startsWith(BOM) ? BOM : "";
  const body = text.slice(bom.length);
  // The first line's ending is the file's own form. A file can mix endings, so each line keeps its own.
  const firstLineEnd = (/^[^\n]*?(\r?\n)/.exec(body)?.[1] ?? "\n") as "\n" | "\r\n";
  let after: string;
  let line: number;
  let addsFrontMatter = false;
  if (/^---\r?\n/.test(body)) {
    // Insert the status line after `kind:`, or after `title:`, or first: the order of the work phase template.
    const lines = splitWorkFileLines(body);
    const end = lines.findIndex((entry, index) => index > 0 && entry.text === "---");
    if (end < 0) return null;
    const find = (key: string) => lines.slice(1, end).findIndex((entry) => entry.text.startsWith(`${key}:`));
    const kind = find("kind");
    const title = find("title");
    const at = (kind >= 0 ? kind : title >= 0 ? title : -1) + 2;
    lines.splice(at, 0, { text: PHASE_STATUS_LINE, eol: firstLineEnd });
    after = bom + joinWorkFileLines(lines);
    line = at + 1;
  } else {
    const eol = firstLineEnd;
    after = `${bom}---${eol}${PHASE_STATUS_LINE}${eol}---${eol}${eol}${body}`;
    line = 2;
    addsFrontMatter = true;
  }
  // The fix must give a file that the work parser reads with the new status.
  const check = parseWorkFile(relativePath, after);
  if (!check.ok || check.document.units[0]!.recordedStatus !== PHASE_STATUS_LINE_VALUE) return null;
  return { line, current: "", replacement: PHASE_STATUS_LINE, after, addsFrontMatter };
}
