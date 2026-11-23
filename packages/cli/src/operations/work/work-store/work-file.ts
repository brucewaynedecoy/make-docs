import path from "node:path";

import { parseDocument } from "yaml";

import { readTaskLine } from "../task-line.js";
import { WORK_RECORDED_STATUS_MAP } from "./catalog.js";
import { readDependencyBullet } from "./dependency-bullets.js";
import type { WorkCloseOutcome, WorkLink, WorkUnitStatus } from "./schemas.js";

/**
 * W29 R0 P3 work file parser and writer (PRD 52 R-WORK-SYNC-6,
 * R-WORK-SYNC-7, R-WORK-STORE-8).
 *
 * The parser reads one `docs/work/` index or phase file into a lossless
 * document: every line with its own line ending, plus the units that the file
 * records (a revision or a phase, its stages, and its tasks) and where each
 * one sits. The writer renders a document back to text. A line whose unit the
 * store did not change keeps its exact bytes, so parse then write gives the
 * same bytes (A10). A changed unit changes only its own part of its own line.
 *
 * Public functions, kept small for later readers (such as the W34
 * decomposition check):
 *
 * - {@link classifyWorkFilePath}: is a repository path a work file, and which unit does it hold.
 * - {@link parseWorkFile}: bytes to a document, or a failure with the first failing line.
 * - {@link renderWorkFile}: a document and the store's unit states to text.
 * - {@link workFileUnitStates}: the unit states that a document itself records.
 * - {@link recordedStatusOf}: the work store status of a recorded status text.
 *
 * Task lines come from the shared reader in `../task-line.ts`, which reads
 * `t` and `T` as the same ID. The writer writes `T` in every task line that it
 * changes, and leaves every other line as written.
 */

export const WORK_FILE_ROOTS = ["docs/work", ".make-docs/archive/work"] as const;
export type WorkFileRoot = (typeof WORK_FILE_ROOTS)[number];

/** The largest work file the store can hold as one unit body (PRD 38 work store records). */
export const WORK_FILE_MAX_CHARACTERS = 65_536;
/** The longest title the store keeps. A longer title is cut, and the full text stays in the file. */
export const WORK_UNIT_TITLE_MAX = 1_024;

const RECORD_DIRECTORY = /^(\d{4}-\d{2}-\d{2})-w([1-9]\d*)-r(0|[1-9]\d*)(?:-|$)/i;
const PHASE_FILE = /^(0[1-9]|[1-9]\d)-.+\.md$/;
const INDEX_FILE = "00-index.md";

export interface WorkFilePathInfo {
  /** The repository-relative path, with `/`. */
  path: string;
  root: WorkFileRoot;
  /** The backlog folder, such as `docs/work/2026-11-21-w29-r0-work-store`. */
  recordPath: string;
  kind: "index" | "phase";
  /** `W29 R0` for an index, `W29 R0 P3` for a phase file. */
  coordinate: string;
  waveCoordinate: string;
  revisionCoordinate: string;
}

/**
 * Say whether a repository-relative path is a work file. A work file is the
 * `00-index.md` or a numbered phase file directly inside a dated `w<n>-r<n>`
 * backlog folder under `docs/work/` or `.make-docs/archive/work/`. Every
 * other file, such as `evidence.md`, is a linked document and never synced.
 */
export function classifyWorkFilePath(relativePath: string): WorkFilePathInfo | null {
  const normalized = relativePath.split("\\").join("/");
  for (const root of WORK_FILE_ROOTS) {
    if (!normalized.startsWith(`${root}/`)) continue;
    const rest = normalized.slice(root.length + 1).split("/");
    if (rest.length !== 2) return null;
    const [folder, file] = rest as [string, string];
    const record = RECORD_DIRECTORY.exec(folder);
    if (!record) return null;
    const waveCoordinate = `W${Number(record[2])}`;
    const revisionCoordinate = `${waveCoordinate} R${Number(record[3])}`;
    const recordPath = `${root}/${folder}`;
    if (file === INDEX_FILE) {
      return { path: normalized, root, recordPath, kind: "index", coordinate: revisionCoordinate, waveCoordinate, revisionCoordinate };
    }
    const phase = PHASE_FILE.exec(file);
    if (!phase) return null;
    return {
      path: normalized,
      root,
      recordPath,
      kind: "phase",
      coordinate: `${revisionCoordinate} P${Number(phase[1])}`,
      waveCoordinate,
      revisionCoordinate,
    };
  }
  return null;
}

/* ------------------------------------------------------------------------ */
/* Document model                                                           */
/* ------------------------------------------------------------------------ */

export interface WorkFileLine {
  /** The line without its line ending. */
  text: string;
  /** The line ending as written. Only the last line may have none. */
  eol: "" | "\n" | "\r\n";
}

export type ParsedWorkUnitKind = "revision" | "phase" | "stage" | "task";

export interface WorkFileBullet {
  text: string;
  line: number;
}

export interface ParsedWorkUnit {
  kind: ParsedWorkUnitKind;
  coordinate: string;
  /** The parent coordinate: the wave for a revision, the revision for a phase, the phase for a stage, the stage or phase for a task. */
  parentCoordinate: string;
  /** The display title, at most {@link WORK_UNIT_TITLE_MAX} characters. */
  title: string;
  /** A task's full text. Null for other units. */
  text: string | null;
  /** The recorded status text: the front matter `status` of a file unit, `[x]` or `[ ]` for a task, or null. */
  recordedStatus: string | null;
  /** The 1-based line where the unit starts. */
  line: number;
  /** Bullets under `### Dependencies` that belong to this unit. */
  dependencyBullets: WorkFileBullet[];
  /** Bullets under `### Blockers` that belong to this unit. */
  blockerBullets: WorkFileBullet[];
  /** Outbound links to repository documents. Only the file unit has them. */
  links: WorkLink[];
}

export type WorkFileDiagnosticCode = "duplicate-task-id" | "task-without-id" | "task-outside-phase";

/** A part of a readable file that is not a unit. The file text keeps it. */
export interface WorkFileDiagnostic {
  code: WorkFileDiagnosticCode;
  line: number;
  message: string;
}

export interface WorkFileDocument {
  info: WorkFilePathInfo;
  /** The exact text. Joining every line with its line ending gives it back. */
  text: string;
  lines: WorkFileLine[];
  /** The file unit first, then stages and tasks in file order. */
  units: ParsedWorkUnit[];
  diagnostics: WorkFileDiagnostic[];
  /** Where the front matter `status` sits, so the writer can change only its value. */
  statusField: { line: number; before: string; quote: "" | "\"" | "'"; after: string } | null;
}

export type WorkFileParseFailureCode =
  | "not-a-work-file"
  | "invalid-utf8"
  | "too-large"
  | "front-matter-unclosed"
  | "front-matter-invalid"
  | "front-matter-field"
  | "coordinate-mismatch"
  | "code-fence-unclosed"
  | "comment-unclosed"
  | "duplicate-stage";

/** The file cannot be read. It stays untouched (R-WORK-SYNC-6). */
export interface WorkFileParseFailure {
  path: string;
  code: WorkFileParseFailureCode;
  /** The first failing line, 1-based. */
  line: number;
  message: string;
}

export type WorkFileParseResult = { ok: true; document: WorkFileDocument } | { ok: false; failure: WorkFileParseFailure };

/* ------------------------------------------------------------------------ */
/* Parser                                                                   */
/* ------------------------------------------------------------------------ */

const STAGE_HEADING = /^##\s+Stage\s+([1-9]\d*)\b\s*(?:[-–—:]\s*)?(.*?)\s*$/;
const LEVEL_HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const SECTION_HEADING = /^(#{2,3})\s+(Dependencies|Blockers)\s*$/i;
const BULLET = /^- (?!\[[ xX]\]\s)(.+?)\s*$/;
const FENCE_OPEN = /^\s{0,3}(`{3,}|~{3,})/;
const MARKDOWN_LINK = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const STATUS_LINE = /^(status:\s*)(["']?)(.*?)\2(\s*(?:#.*)?)$/;
const BOM = "\uFEFF";

function fail(info: { path: string }, code: WorkFileParseFailureCode, line: number, message: string): WorkFileParseResult {
  return { ok: false, failure: { path: info.path, code, line, message } };
}

/** Split text into lines that keep their line endings. */
export function splitWorkFileLines(text: string): WorkFileLine[] {
  const lines: WorkFileLine[] = [];
  let start = 0;
  for (;;) {
    const newline = text.indexOf("\n", start);
    if (newline < 0) {
      lines.push({ text: text.slice(start), eol: "" });
      break;
    }
    const crlf = newline > start && text[newline - 1] === "\r";
    lines.push({ text: text.slice(start, crlf ? newline - 1 : newline), eol: crlf ? "\r\n" : "\n" });
    start = newline + 1;
  }
  return lines;
}

function decodeStrict(bytes: Uint8Array): { text: string } | { line: number } {
  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    // Find the first line whose bytes do not decode.
    let line = 1;
    let start = 0;
    for (let index = 0; index <= bytes.length; index += 1) {
      if (index === bytes.length || bytes[index] === 0x0a) {
        try {
          new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(start, index));
        } catch {
          return { line };
        }
        line += 1;
        start = index + 1;
      }
    }
    return { line: 1 };
  }
}

function truncateTitle(value: string): string {
  const title = value.trim() === "" ? "(untitled)" : value.trim();
  return title.length <= WORK_UNIT_TITLE_MAX ? title : `${title.slice(0, WORK_UNIT_TITLE_MAX - 1)}…`;
}

/**
 * Parse one work file. `relativePath` is the repository-relative path, which
 * gives the file's coordinate. A failure names the first failing line, and
 * the caller must leave the file untouched.
 */
export function parseWorkFile(relativePath: string, content: Uint8Array | string): WorkFileParseResult {
  const info = classifyWorkFilePath(relativePath);
  if (!info) return fail({ path: relativePath }, "not-a-work-file", 1, "The path is not a work index or phase file.");
  let text: string;
  if (typeof content === "string") text = content;
  else {
    const decoded = decodeStrict(content);
    if ("line" in decoded) return fail(info, "invalid-utf8", decoded.line, "The line is not valid UTF-8 text.");
    text = decoded.text;
  }
  if (text.length > WORK_FILE_MAX_CHARACTERS) {
    return fail(info, "too-large", 1, `The file has ${text.length} characters, and the work store holds at most ${WORK_FILE_MAX_CHARACTERS} for one file.`);
  }
  const lines = splitWorkFileLines(text);
  const content0 = (index: number) => (index === 0 ? lines[0]!.text.replace(BOM, "") : lines[index]!.text);

  // Front matter.
  let bodyStart = 0;
  let statusField: WorkFileDocument["statusField"] = null;
  let frontmatterTitle: string | null = null;
  let frontmatterStatus: string | null = null;
  let sourcePath: string | null = null;
  if (content0(0) === "---") {
    let end = -1;
    for (let index = 1; index < lines.length; index += 1) {
      if (lines[index]!.text === "---") {
        end = index;
        break;
      }
    }
    if (end < 0) return fail(info, "front-matter-unclosed", 1, "The front matter opens on line 1 and never closes with `---`.");
    const yaml = lines.slice(1, end).map((line) => line.text).join("\n");
    const document = parseDocument(yaml, { uniqueKeys: true, prettyErrors: false });
    if (document.errors.length > 0) {
      const offset = document.errors[0]!.pos?.[0] ?? 0;
      const yamlLine = yaml.slice(0, offset).split("\n").length;
      return fail(info, "front-matter-invalid", yamlLine + 1, `The front matter is not valid YAML: ${document.errors[0]!.message.split("\n")[0]}`);
    }
    const data = document.toJS() as unknown;
    if (data !== null && (typeof data !== "object" || Array.isArray(data))) {
      return fail(info, "front-matter-invalid", 2, "The front matter is not a YAML map.");
    }
    const fields = (data ?? {}) as Record<string, unknown>;
    const fieldLine = (key: string) => {
      const index = lines.slice(1, end).findIndex((line) => line.text.startsWith(`${key}:`));
      return index < 0 ? 1 : index + 2;
    };
    if (fields.title !== undefined) {
      if (typeof fields.title !== "string") return fail(info, "front-matter-field", fieldLine("title"), "The front matter `title` is not text.");
      frontmatterTitle = fields.title;
    }
    if (fields.coordinate !== undefined) {
      if (typeof fields.coordinate !== "string" || fields.coordinate.trim() !== info.coordinate) {
        return fail(
          info,
          "coordinate-mismatch",
          fieldLine("coordinate"),
          `The front matter coordinate ${JSON.stringify(fields.coordinate)} does not match ${info.coordinate}, which the folder and file name give.`,
        );
      }
    }
    if (fields.status !== undefined && fields.status !== null) {
      const line = fieldLine("status");
      const match = typeof fields.status === "string" ? STATUS_LINE.exec(lines[line - 1]!.text) : null;
      if (!match || match[3] !== fields.status) {
        return fail(info, "front-matter-field", line, "The front matter `status` must be one line of text, such as `status: \"active\"`.");
      }
      frontmatterStatus = fields.status;
      statusField = { line, before: match[1]!, quote: match[2] as "" | "\"" | "'", after: match[4]! };
    }
    const source = fields.source;
    if (source !== null && typeof source === "object" && !Array.isArray(source)) {
      const raw = (source as Record<string, unknown>).path;
      if (typeof raw === "string" && raw.trim()) sourcePath = raw.trim();
    }
    bodyStart = end + 1;
  }

  const fileUnit: ParsedWorkUnit = {
    kind: info.kind === "index" ? "revision" : "phase",
    coordinate: info.coordinate,
    parentCoordinate: info.kind === "index" ? info.waveCoordinate : info.revisionCoordinate,
    title: "",
    text: null,
    recordedStatus: frontmatterStatus,
    line: 1,
    dependencyBullets: [],
    blockerBullets: [],
    links: [],
  };
  const units: ParsedWorkUnit[] = [fileUnit];
  const diagnostics: WorkFileDiagnostic[] = [];
  const taskIds = new Map<string, number>();
  const stageNumbers = new Map<number, number>();
  let heading1: string | null = null;
  let stage: ParsedWorkUnit | null = null;
  let section: { kind: "Dependencies" | "Blockers"; level: number; owner: ParsedWorkUnit } | null = null;
  let fence: { char: string; length: number; line: number } | null = null;
  let comment: number | null = null;
  const linkTargets: Array<{ raw: string }> = [];

  for (let index = bodyStart; index < lines.length; index += 1) {
    const line = content0(index);
    const lineNumber = index + 1;
    if (comment !== null) {
      if (line.includes("-->")) comment = null;
      continue;
    }
    if (fence) {
      const close = new RegExp(`^\\s{0,3}${fence.char === "`" ? "`" : "~"}{${fence.length},}\\s*$`);
      if (close.test(line)) fence = null;
      continue;
    }
    const open = FENCE_OPEN.exec(line);
    if (open) {
      fence = { char: open[1]![0]!, length: open[1]!.length, line: lineNumber };
      continue;
    }
    // An HTML comment block starts a line (CommonMark HTML block type 2). A `<!--` in inline code is text.
    const commentStart = /^ {0,3}<!--/.test(line) ? line.indexOf("<!--") : -1;
    if (commentStart >= 0 && !line.includes("-->", commentStart + 4)) {
      comment = lineNumber;
      continue;
    }
    for (const match of line.matchAll(MARKDOWN_LINK)) linkTargets.push({ raw: match[1]! });

    const heading = LEVEL_HEADING.exec(line);
    if (heading) {
      const level = heading[1]!.length;
      if (level === 1 && heading1 === null) heading1 = heading[2]!;
      if (section && level <= section.level) section = null;
      if (level <= 2) stage = null;
      const stageHeading = info.kind === "phase" ? STAGE_HEADING.exec(line) : null;
      if (stageHeading) {
        const number = Number(stageHeading[1]);
        const earlier = stageNumbers.get(number);
        if (earlier !== undefined) {
          return fail(info, "duplicate-stage", lineNumber, `Stage ${number} is also on line ${earlier}, so the stage cannot have one coordinate.`);
        }
        stageNumbers.set(number, lineNumber);
        stage = {
          kind: "stage",
          coordinate: `${info.coordinate} S${number}`,
          parentCoordinate: info.coordinate,
          title: truncateTitle(stageHeading[2] || `Stage ${number}`),
          text: null,
          recordedStatus: null,
          line: lineNumber,
          dependencyBullets: [],
          blockerBullets: [],
          links: [],
        };
        units.push(stage);
      }
      const sectionHeading = SECTION_HEADING.exec(line);
      if (sectionHeading) {
        const kind = sectionHeading[2]!.toLowerCase() === "dependencies" ? "Dependencies" : "Blockers";
        section = { kind, level: sectionHeading[1]!.length, owner: stage ?? fileUnit };
      }
      continue;
    }

    const task = readTaskLine(line);
    if (task) {
      if (info.kind !== "phase") {
        diagnostics.push({ code: "task-outside-phase", line: lineNumber, message: "A task line in an index file is kept as text. It is not a work unit." });
        continue;
      }
      if (!task.id) {
        diagnostics.push({ code: "task-without-id", line: lineNumber, message: "A task line without an ID is kept as text. It is not a work unit." });
        continue;
      }
      const earlier = taskIds.get(task.id);
      if (earlier !== undefined) {
        diagnostics.push({
          code: "duplicate-task-id",
          line: lineNumber,
          message: `${task.id} is also on line ${earlier}. The first line is the unit, and this line is kept as text.`,
        });
        continue;
      }
      taskIds.set(task.id, lineNumber);
      units.push({
        kind: "task",
        coordinate: `${info.coordinate} ${task.id}`,
        parentCoordinate: stage?.coordinate ?? info.coordinate,
        title: truncateTitle(task.text),
        text: task.text,
        recordedStatus: task.checked ? "[x]" : "[ ]",
        line: lineNumber,
        dependencyBullets: [],
        blockerBullets: [],
        links: [],
      });
      continue;
    }

    if (section) {
      const bullet = BULLET.exec(line);
      if (bullet) {
        const target = section.kind === "Dependencies" ? section.owner.dependencyBullets : section.owner.blockerBullets;
        target.push({ text: bullet[1]!, line: lineNumber });
      }
    }
  }
  if (fence) return fail(info, "code-fence-unclosed", fence.line, "A code fence opens here and never closes.");
  if (comment !== null) return fail(info, "comment-unclosed", comment, "An HTML comment opens here and never closes.");

  fileUnit.title = truncateTitle(frontmatterTitle ?? heading1 ?? path.posix.basename(info.path, ".md"));
  fileUnit.links = outboundLinks(info, sourcePath, linkTargets);
  // A blocker bullet that says there is no blocker holds nothing.
  for (const unit of units) unit.blockerBullets = unit.blockerBullets.filter((bullet) => !/^(?:none|n\/a)\b/i.test(bullet.text));

  return { ok: true, document: { info, text, lines, units, diagnostics, statusField } };
}

/** Classify the links of a file into the link kinds of PRD 52 R-WORK-STORE-5. Other links are dropped. */
function outboundLinks(info: WorkFilePathInfo, sourcePath: string | null, targets: Array<{ raw: string }>): WorkLink[] {
  const links: WorkLink[] = [];
  const seen = new Set<string>();
  const add = (raw: string) => {
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith("//") || raw.includes("\\") || raw.startsWith("#")) return;
    const [target, anchorText] = raw.split("#", 2) as [string, string | undefined];
    if (!target) return;
    const resolved = /^(?:docs|\.make-docs|packages)\//.test(target)
      ? path.posix.normalize(target)
      : path.posix.normalize(path.posix.join(path.posix.dirname(info.path), target));
    if (resolved.startsWith("../") || resolved === ".." || resolved.startsWith("/") || resolved.split("/").includes("..")) return;
    const kind = linkKind(resolved);
    if (!kind) return;
    const anchor = anchorText && anchorText.length <= 512 ? anchorText : null;
    const key = `${kind}\u0000${resolved}\u0000${anchor ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    links.push({ direction: "outbound", kind, path: resolved, anchor });
  };
  if (sourcePath) add(sourcePath);
  for (const target of targets) add(target.raw);
  return links;
}

function linkKind(resolved: string): WorkLink["kind"] | null {
  const inArea = (area: string) => resolved.startsWith(`docs/${area}/`) || resolved.startsWith(`.make-docs/archive/${area}/`);
  if (path.posix.basename(resolved) === "evidence.md" || /\/evidence\//.test(resolved)) return "evidence";
  if (inArea("designs")) return "design";
  if (inArea("plans")) return "plan";
  if (inArea("prd")) return "prd-section";
  if (inArea("work") && resolved.endsWith(".md")) return "work-file";
  return null;
}

/* ------------------------------------------------------------------------ */
/* Status                                                                   */
/* ------------------------------------------------------------------------ */

export interface WorkStatusPair {
  status: WorkUnitStatus;
  closeOutcome: WorkCloseOutcome | null;
}

/**
 * The work store status of a recorded status text (the P1 recorded status
 * map). Matching ignores case. A value that is not listed, and no value, map
 * to `open`. The work queue reports an unknown value as `status-unknown`.
 */
export function recordedStatusOf(recorded: string | null): WorkStatusPair {
  if (recorded === null) return { status: "open", closeOutcome: null };
  const value = recorded.trim().toLowerCase();
  const mapping = WORK_RECORDED_STATUS_MAP.find((entry) => entry.recorded.includes(value));
  return mapping ? { status: mapping.status, closeOutcome: mapping.closeOutcome } : { status: "open", closeOutcome: null };
}

/** The word the writer records for a status that a file unit's front matter must change to. */
export function recordedStatusWord(pair: WorkStatusPair): string {
  if (pair.status === "closed") return pair.closeOutcome === "done" ? "complete" : (pair.closeOutcome ?? "complete");
  return pair.status === "open" ? "active" : pair.status;
}

/* ------------------------------------------------------------------------ */
/* Writer                                                                   */
/* ------------------------------------------------------------------------ */

/** What the store holds for one unit of a file, in the fields the file can show. */
export interface WorkFileUnitState {
  coordinate: string;
  kind: ParsedWorkUnitKind;
  status: WorkUnitStatus;
  closeOutcome: WorkCloseOutcome | null;
  title: string;
  /** A task's full text. */
  text: string | null;
  /** Blocker texts, in file order. */
  blockers: readonly string[];
  /** Gate texts, in file order. */
  gates: readonly string[];
}

export type WorkFileRenderResult =
  | { ok: true; text: string; changedUnits: string[] }
  | { ok: false; coordinate: string; reason: string };

/** The gate texts of a unit's dependency bullets. Gate-ness does not depend on which units exist. */
export function gateBullets(unit: ParsedWorkUnit): WorkFileBullet[] {
  return unit.dependencyBullets.filter((bullet) => readDependencyBullet(bullet.text, unit.coordinate, () => true).gate);
}

/** The unit states that a document records, before any store change. */
export function workFileUnitStates(document: WorkFileDocument): WorkFileUnitState[] {
  return document.units.map((unit) => {
    const pair = recordedStatusOf(unit.recordedStatus);
    return {
      coordinate: unit.coordinate,
      kind: unit.kind,
      status: pair.status,
      closeOutcome: pair.closeOutcome,
      title: unit.title,
      text: unit.text,
      blockers: unit.blockerBullets.map((bullet) => bullet.text),
      gates: gateBullets(unit).map((bullet) => bullet.text),
    };
  });
}

function isSubsequence(items: readonly string[], within: readonly string[]): boolean {
  let cursor = 0;
  for (const value of within) if (cursor < items.length && items[cursor] === value) cursor += 1;
  return cursor === items.length;
}

function sameList(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

/**
 * Render a document with the store's unit states. Each unit's own line
 * changes only where the store's value differs from what the line shows:
 *
 * - A task's mark follows whether the store closed it, and its text follows
 *   the store's text. The task ID is then written with `T`.
 * - A file unit's front matter `status` follows the store's status. A value
 *   that already maps to the store's status stays as written.
 * - A status that the file cannot show (a stage's status, a task that is in
 *   progress, a phase with no `status` field) stays in the store only.
 *
 * The writer refuses, and changes nothing, when the store adds or removes a
 * unit, or changes a title other than a task's, a blocker, or a gate: those
 * edits have no file form yet. Every other line keeps its exact bytes.
 */
export function renderWorkFile(document: WorkFileDocument, states: readonly WorkFileUnitState[]): WorkFileRenderResult {
  const byCoordinate = new Map(states.map((state) => [state.coordinate, state]));
  if (byCoordinate.size !== states.length) {
    return { ok: false, coordinate: document.info.coordinate, reason: "The store names one coordinate twice." };
  }
  const lines = document.lines.map((line) => ({ ...line }));
  const changedUnits: string[] = [];
  const recorded = new Set(document.units.map((unit) => unit.coordinate));
  for (const state of states) {
    if (!recorded.has(state.coordinate)) {
      return { ok: false, coordinate: state.coordinate, reason: "The store has a unit that the file does not record, and the writer does not add units." };
    }
  }
  for (const unit of document.units) {
    const state = byCoordinate.get(unit.coordinate);
    if (!state) {
      return { ok: false, coordinate: unit.coordinate, reason: "The file records a unit that the store does not have, and the writer does not remove units." };
    }
    if (state.kind !== unit.kind) return { ok: false, coordinate: unit.coordinate, reason: `The store records a ${state.kind}, and the file records a ${unit.kind}.` };
    if (!sameList(state.blockers, unit.blockerBullets.map((bullet) => bullet.text))) {
      return { ok: false, coordinate: unit.coordinate, reason: "The store changed the blockers, and the writer does not change blocker bullets." };
    }
    // Each store gate is still one of the unit's dependency bullets, in order. Whether a
    // bullet that names a unit by its title is a gate depends on other files, so the
    // writer checks only that the store added or changed no gate text.
    if (!isSubsequence(state.gates, unit.dependencyBullets.map((bullet) => bullet.text))) {
      return { ok: false, coordinate: unit.coordinate, reason: "The store changed the gate texts, and the writer does not change dependency bullets." };
    }
    if (unit.kind === "task") {
      const index = unit.line - 1;
      const current = lines[index]!;
      // A byte order mark before a task on line 1 stays where it is.
      const bom = index === 0 && current.text.startsWith(BOM) ? BOM : "";
      const lineText = current.text.slice(bom.length);
      const task = readTaskLine(lineText);
      if (!task || !task.spans.id) return { ok: false, coordinate: unit.coordinate, reason: "The task line moved in the stored text, so the writer cannot find it." };
      const wantChecked = state.status === "closed";
      const wantText = state.text ?? task.text;
      if (wantChecked === task.checked && wantText === task.text) continue;
      const mark = wantChecked === task.checked ? task.mark : wantChecked ? "x" : " ";
      const id = task.spans.id;
      current.text = bom +
        lineText.slice(0, task.spans.mark.start) + mark + lineText.slice(task.spans.mark.end, id.start) +
        `T${task.id!.slice(1)}` + lineText.slice(id.end, task.spans.text.start) + wantText + lineText.slice(task.spans.text.end);
      changedUnits.push(unit.coordinate);
      continue;
    }
    if (state.title !== unit.title) {
      return { ok: false, coordinate: unit.coordinate, reason: `The store changed the ${unit.kind} title, and the writer changes only task text.` };
    }
    if ((unit.kind === "phase" || unit.kind === "revision") && document.statusField) {
      const shown = recordedStatusOf(unit.recordedStatus);
      if (shown.status === state.status && shown.closeOutcome === state.closeOutcome) continue;
      const field = document.statusField;
      const word = recordedStatusWord(state);
      lines[field.line - 1]!.text = `${field.before}${field.quote}${word}${field.quote}${field.after}`;
      changedUnits.push(unit.coordinate);
    }
  }
  return { ok: true, text: lines.map((line) => line.text + line.eol).join(""), changedUnits };
}

/** Join a document's lines back into text, with no store change. */
export function joinWorkFileLines(lines: readonly WorkFileLine[]): string {
  return lines.map((line) => line.text + line.eol).join("");
}
