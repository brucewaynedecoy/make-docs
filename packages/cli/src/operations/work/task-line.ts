/**
 * The shared task line reader (PRD 14 R-COORD-22, PRD 51
 * R-BACKLOG-SNAPSHOT-33, PRD 52 R-WORK-SYNC-7).
 *
 * A task line is a top-level Markdown checkbox item, such as
 * `- [ ] T3: Write the parser.` The ID letter may be `t` or `T`; both name the
 * same task, and every result uses `T`. A task line may have no ID, as in
 * older files: `- [x] Write the parser.`
 *
 * The backlog snapshot and the work store parser use this one reader, so they
 * always agree on what a task line is. The task ID rule has one home:
 * `TASK_ID_SOURCE`. This file builds `TASK_LINE_PATTERN` and
 * `TASK_LABEL_PATTERN` from it, and the work phase reader (`parseWorkPhase`
 * in `./index.ts`) builds its task line pattern from it. The W34
 * decomposition check reads task lines through `parseWorkPhase` and task
 * labels in acceptance lines through `readTaskLabel` (W34 R0 P5 T8). The
 * project doctor's lower-case finder is a separate text scan on purpose: it
 * reports text, and never decides what a file means.
 */

/** The task ID rule: `t` or `T`, then a whole number from 1 with no leading zero. A regular expression source with no group. */
export const TASK_ID_SOURCE = "[tT][1-9]\\d*";

/** `- [ ] T3: text`, `- [x] t3: text`, or `- [X] text`. Group 1: mark. Group 2: ID. Group 3: text. */
export const TASK_LINE_PATTERN = new RegExp(`^- \\[([ xX])\\]\\s+(?:(${TASK_ID_SOURCE}):\\s*)?(.+?)\\s*$`);

/**
 * `- T3: text` or `- t3: text`: a plain bullet that starts with a task ID label
 * and has no checkbox. Group 1: ID. A task line (with a checkbox) does not
 * match. The decomposition check uses it to find a task ID in an acceptance
 * criterion (`decomposition.acceptance.task-id`).
 */
export const TASK_LABEL_PATTERN = new RegExp(`^- (${TASK_ID_SOURCE}):`);

export interface TaskLine {
  /** The mark character as written: a space, `x`, or `X`. */
  mark: " " | "x" | "X";
  /** True when the mark is `x` or `X`. */
  checked: boolean;
  /** The canonical task ID with an upper-case `T`, such as `T3`, or null when the line has no ID. */
  id: string | null;
  /** The ID exactly as written, such as `t3`, or null. */
  idAsWritten: string | null;
  /** The task text, trimmed. */
  text: string;
  /** Column spans (0-based, end exclusive) of the parts, so a writer can change one part and keep the rest. */
  spans: {
    mark: { start: number; end: number };
    id: { start: number; end: number } | null;
    text: { start: number; end: number };
  };
}

/**
 * Read one line as a task line, or return null. The line must not include its
 * line ending. Reading never changes the text.
 */
export function readTaskLine(line: string): TaskLine | null {
  const match = TASK_LINE_PATTERN.exec(line);
  if (!match) return null;
  const mark = match[1] as TaskLine["mark"];
  const idAsWritten = match[2] ?? null;
  const text = match[3]!;
  // `- [` is three characters, so the mark is at column 3.
  const markSpan = { start: 3, end: 4 };
  let cursor = 6; // after `- [x]`
  while (cursor < line.length && /\s/.test(line[cursor]!)) cursor += 1;
  const idSpan = idAsWritten ? { start: cursor, end: cursor + idAsWritten.length } : null;
  const textStart = idAsWritten ? line.indexOf(text, idSpan!.end + 1) : line.indexOf(text, cursor);
  return {
    mark,
    checked: mark !== " ",
    id: idAsWritten ? canonicalTaskId(idAsWritten) : null,
    idAsWritten,
    text,
    spans: { mark: markSpan, id: idSpan, text: { start: textStart, end: textStart + text.length } },
  };
}

/** `t3` and `T3` are the same task ID. The canonical form uses `T`. */
export function canonicalTaskId(id: string): string {
  return `T${id.slice(1)}`;
}

export interface TaskLabel {
  /** The canonical task ID with an upper-case `T`, such as `T3`. */
  id: string;
  /** The ID exactly as written, such as `t3`. */
  idAsWritten: string;
}

/**
 * Read the task ID label at the start of a plain bullet, such as `- T3: text`,
 * or return null. A task line with a checkbox returns null; use `readTaskLine`
 * for it. Reading never changes the text.
 */
export function readTaskLabel(line: string): TaskLabel | null {
  const match = TASK_LABEL_PATTERN.exec(line);
  if (!match) return null;
  const idAsWritten = match[1]!;
  return { id: canonicalTaskId(idAsWritten), idAsWritten };
}
