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
 * always agree on what a task line is. The W34 decomposition check still has
 * its own `TASK_LABEL_IN_ACCEPTANCE_RE` for task labels in acceptance lines;
 * W34 R0 P5 T8 moves it to this reader. The project doctor's lower-case finder is a separate text
 * scan on purpose: it reports text, and never decides what a file means.
 */

/** `- [ ] T3: text`, `- [x] t3: text`, or `- [X] text`. Group 1: mark. Group 2: ID. Group 3: text. */
export const TASK_LINE_PATTERN = /^- \[([ xX])\]\s+(?:([tT][1-9]\d*):\s*)?(.+?)\s*$/;

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
