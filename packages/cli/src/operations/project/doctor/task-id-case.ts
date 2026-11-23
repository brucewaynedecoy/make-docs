/**
 * The `task-id-case` project doctor check (PRD 39 R-DOCTOR-6, PRD 14
 * R-COORD-22). It finds lower-case task IDs in Markdown text and proposes
 * the upper-case form. It reads text only. It never decides what a file
 * means.
 *
 * Agent twin: `make-docs://system/reference/project-doctor.md`. The two
 * forms must find the same lines on the shared fixtures in
 * `tests/fixtures/project-doctor/`. A change to either form needs a review
 * of the other.
 */

export type TaskIdCaseFindingKind = "task-line" | "prose-reference";

export interface TaskIdCaseMatch {
  kind: TaskIdCaseFindingKind;
  /** 1-based line number. */
  line: number;
  /** 1-based column of the `t`, counted in UTF-16 code units. */
  column: number;
  /** Character offset of the `t` in the whole file text. */
  offset: number;
  current: string;
  replacement: string;
}

export type TaskIdCaseFileSkip = "history-record";

/** A task-ID-like text that the check leaves unchanged on purpose, and why. */
export interface TaskIdCaseTextSkip {
  line: number;
  column: number;
  current: string;
  reason: "html-tag";
}

export interface TaskIdCaseScan {
  skipped: TaskIdCaseFileSkip | null;
  matches: TaskIdCaseMatch[];
  skippedText: TaskIdCaseTextSkip[];
}

/** A task checkbox line: `- [ ] t3: ...`, or an older line with no colon, such as `- [x] t3 Write ...`. */
const TASK_LINE = /^- \[[ xX]\] (t[1-9]\d*)(?=:|\s|$)/;
/**
 * An ID token: `t`, `T`, or `A` and a number. Lower-case tokens of one to
 * three digits are findings. Every token with a valid left boundary can
 * anchor a joiner, so mixed lists such as `T1-t3` and `A41-t3` are found.
 */
const ID_TOKEN = /[tTA][1-9]\d*/g;
/** An HTML tag, such as `<a id="t3">` or `</span>`. Its text is never changed. */
const HTML_TAG = /<\/?[A-Za-z][A-Za-z0-9-]*(?:\s[^<>]*)?\/?>/g;
/** An HTML tag that opens at the end of a line and closes on a later line, such as `<a` then `id="t3">`. */
const HTML_TAG_OPEN_AT_END = /<\/?[A-Za-z][A-Za-z0-9-]*(?:\s[^<>]*)?$/;
const HTML_TOKEN = /(?<![A-Za-z0-9_])t[1-9]\d{0,2}(?![A-Za-z0-9_])/g;
const BOM = "\uFEFF";
const FENCE_OPEN = /^\s*(`{3,}|~{3,})/;
const FRONTMATTER_KIND = /^kind:\s*["']?([A-Za-z-]+)["']?\s*$/;
const REFERENCE_DEFINITION = /^ {0,3}\[[^\]]+\]:/;
const BARE_URL = /[A-Za-z][A-Za-z0-9+.-]*:\/\/[^\s<>]+/g;
const AUTOLINK = /<[A-Za-z][A-Za-z0-9+.-]*:[^\s<>]*>/g;
const MASK = "\u0000";

/** Characters that may come right before a prose task ID. */
const PREVIOUS_OK = new Set([" ", "\t", "(", "[", "{", "\"", "'", "*", "~", "|", ",", ";", "\u201C", "\u2018"]);
/** Characters that may come right after a prose task ID. */
const NEXT_OK = new Set([" ", "\t", ")", "]", "}", "\"", "'", "*", "~", "|", ",", ";", ":", "!", "?", "\u201D", "\u2019"]);
/** Separators that may join task IDs in a list or a range. */
const JOINERS = new Set(["/", "-", "–", "—"]);

/**
 * Scan one Markdown file. A leading byte order mark is ignored. Skips, in
 * order: a history record (front matter on line 1 with `kind: history`),
 * fenced code blocks, reference link definitions, inline code spans, link
 * targets, autolinks, bare URLs, and HTML tags (reported in `skippedText`).
 */
export function scanTaskIdCase(text: string): TaskIdCaseScan {
  const bomLength = text.startsWith(BOM) ? BOM.length : 0;
  const lines = splitLines(text.slice(bomLength)).map((entry) => ({ ...entry, offset: entry.offset + bomLength }));
  if (frontmatterKind(lines.map((entry) => entry.content)) === "history") {
    return { skipped: "history-record", matches: [], skippedText: [] };
  }
  const matches: TaskIdCaseMatch[] = [];
  const skippedText: TaskIdCaseTextSkip[] = [];
  let fence: { char: string; length: number } | null = null;
  let inTag = false;
  lines.forEach((entry, index) => {
    const content = entry.content;
    if (fence) {
      const close = new RegExp(`^\\s*${fence.char === "`" ? "`" : "~"}{${fence.length},}\\s*$`);
      if (close.test(content)) fence = null;
      return;
    }
    const open = FENCE_OPEN.exec(content);
    if (open) {
      fence = { char: open[1]![0]!, length: open[1]!.length };
      inTag = false;
      return;
    }
    const lineNumber = index + 1;
    const { masked, htmlTokens, inTag: stillInTag } = maskLine(content, inTag);
    inTag = stillInTag;
    for (const token of htmlTokens) skippedText.push({ line: lineNumber, column: token.index + 1, current: token.value, reason: "html-tag" });
    const taskLine = TASK_LINE.exec(content);
    let proseStart = 0;
    if (taskLine) {
      const column = content.indexOf(taskLine[1]!);
      matches.push(buildMatch("task-line", lineNumber, column, entry.offset, taskLine[1]!));
      proseStart = column + taskLine[1]!.length;
    }
    for (const candidate of proseCandidates(masked, proseStart, taskLine ? proseStart : -1)) {
      matches.push(buildMatch("prose-reference", lineNumber, candidate.index, entry.offset, candidate.value));
    }
  });
  return { skipped: null, matches, skippedText };
}

/** Apply matches to the text. Each replacement changes one `t` to `T`. */
export function applyTaskIdCase(text: string, matches: readonly TaskIdCaseMatch[]): string {
  const chars = [...text.split("")];
  for (const match of matches) {
    if (text.slice(match.offset, match.offset + match.current.length) !== match.current || chars[match.offset] !== "t") {
      throw new Error(`The text at line ${match.line}, column ${match.column} is not ${match.current}.`);
    }
    chars[match.offset] = "T";
  }
  return chars.join("");
}

function buildMatch(kind: TaskIdCaseFindingKind, line: number, index: number, lineOffset: number, current: string): TaskIdCaseMatch {
  return {
    kind,
    line,
    column: index + 1,
    offset: lineOffset + index,
    current,
    replacement: `T${current.slice(1)}`,
  };
}

function splitLines(text: string): Array<{ content: string; offset: number }> {
  const result: Array<{ content: string; offset: number }> = [];
  let offset = 0;
  for (const raw of text.split("\n")) {
    const content = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
    result.push({ content, offset });
    offset += raw.length + 1;
  }
  return result;
}

function frontmatterKind(lines: string[]): string | null {
  if (lines[0] !== "---") return null;
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (line === "---" || line === "...") return null;
    const kind = FRONTMATTER_KIND.exec(line);
    if (kind) return kind[1]!.toLowerCase();
  }
  return null;
}

/** Replace skipped text with a mask character, keeping every column. */
function maskLine(source: string, inTag: boolean): { masked: string; htmlTokens: Array<{ index: number; value: string }>; inTag: boolean } {
  const htmlTokens: Array<{ index: number; value: string }> = [];
  const collect = (text: string, offset: number) => {
    HTML_TOKEN.lastIndex = 0;
    for (let token = HTML_TOKEN.exec(text); token; token = HTML_TOKEN.exec(text)) {
      htmlTokens.push({ index: offset + token.index, value: token[0] });
    }
  };
  const chars = source.split("");
  const mask = (start: number, end: number) => {
    for (let index = start; index < end; index += 1) chars[index] = MASK;
  };
  // An HTML tag open from an earlier line runs to the first `>`. A blank line ends it.
  if (inTag) {
    if (source.trim() === "") return { masked: source, htmlTokens, inTag: false };
    const close = source.indexOf(">");
    const end = close < 0 ? source.length : close + 1;
    collect(source.slice(0, end), 0);
    mask(0, end);
    if (close < 0) return { masked: chars.join(""), htmlTokens, inTag: true };
  } else if (REFERENCE_DEFINITION.test(source)) {
    const end = source.indexOf("]:") + 2;
    return { masked: source.slice(0, end) + MASK.repeat(source.length - end), htmlTokens, inTag: false };
  }
  const line = chars.join("");
  // Inline code: a run of N backticks to the next run of exactly N backticks.
  for (let index = 0; index < line.length;) {
    if (line[index] !== "`") { index += 1; continue; }
    let runEnd = index;
    while (line[runEnd] === "`") runEnd += 1;
    const run = runEnd - index;
    let search = runEnd;
    let closed = -1;
    while (search < line.length) {
      if (line[search] !== "`") { search += 1; continue; }
      let closeEnd = search;
      while (line[closeEnd] === "`") closeEnd += 1;
      if (closeEnd - search === run) { closed = closeEnd; break; }
      search = closeEnd;
    }
    if (closed < 0) { index = runEnd; continue; }
    mask(index, closed);
    index = closed;
  }
  let current = chars.join("");
  // Link and image targets: `](target)`. Link text stays prose.
  for (let index = current.indexOf("]("); index >= 0; index = current.indexOf("](", index + 2)) {
    let depth = 0;
    let end = -1;
    for (let cursor = index + 1; cursor < current.length; cursor += 1) {
      if (current[cursor] === "(") depth += 1;
      else if (current[cursor] === ")") {
        depth -= 1;
        if (depth === 0) { end = cursor; break; }
      }
    }
    mask(index + 2, end < 0 ? current.length : end);
    current = chars.join("");
  }
  for (const pattern of [AUTOLINK, BARE_URL]) {
    pattern.lastIndex = 0;
    for (let match = pattern.exec(current); match; match = pattern.exec(current)) {
      mask(match.index, match.index + match[0].length);
    }
    current = chars.join("");
  }
  // HTML tags: report each task-ID-like word inside, such as id="t3", then mask the tag.
  HTML_TAG.lastIndex = 0;
  for (let match = HTML_TAG.exec(current); match; match = HTML_TAG.exec(current)) {
    collect(match[0], match.index);
    mask(match.index, match.index + match[0].length);
  }
  // A tag that opens here and closes on a later line.
  current = chars.join("");
  const open = HTML_TAG_OPEN_AT_END.exec(current);
  if (open) {
    collect(open[0], open.index);
    mask(open.index, current.length);
    return { masked: chars.join(""), htmlTokens, inTag: true };
  }
  return { masked: chars.join(""), htmlTokens, inTag: false };
}

/**
 * Find prose candidates from left to right. Each `t`, `T`, or `A` token whose
 * left boundary is valid can anchor a joiner (`/`, `-`, `–`, `—`) that comes
 * right after it. That follows chains such as `t1/t2/t4`, `T1-t3`, and
 * `t1-t6/A41`, and it rejects paths such as `a/t3/t4`. Only lower-case
 * tokens of one to three digits with a valid right boundary are findings.
 */
function proseCandidates(masked: string, start: number, taskLineEnd: number): Array<{ index: number; value: string }> {
  const found: Array<{ index: number; value: string }> = [];
  let anchorEnd = taskLineEnd;
  ID_TOKEN.lastIndex = start;
  for (let match = ID_TOKEN.exec(masked); match; match = ID_TOKEN.exec(masked)) {
    const index = match.index;
    const value = match[0];
    const end = index + value.length;
    if (value.length > 4) continue;
    if (!previousAllowed(masked, index, anchorEnd)) continue;
    anchorEnd = end;
    if (value[0] === "t" && nextAllowed(masked, end)) found.push({ index, value });
  }
  return found;
}

function previousAllowed(text: string, index: number, anchorEnd: number): boolean {
  if (index === 0) return true;
  const previous = text[index - 1]!;
  // The edge of a skipped part (code, link target, URL, or HTML tag) is a word boundary.
  if (PREVIOUS_OK.has(previous) || previous === MASK) return true;
  return JOINERS.has(previous) && anchorEnd === index - 1;
}

function nextAllowed(text: string, end: number): boolean {
  if (end === text.length) return true;
  const next = text[end]!;
  const after = text[end + 1];
  if (NEXT_OK.has(next) || next === MASK) return true;
  if (next === ".") return after === undefined || after === " " || after === "\t" || after === ")" || after === "\"" || after === "'" || after === "*";
  if (JOINERS.has(next)) return /^[tTA][1-9]/.test(text.slice(end + 1, end + 3));
  return false;
}
