/**
 * W34 R0 P1: Markdown source style check and repair (PRD 39 R-SKILL-CHECK-4,
 * R-SKILL-CHECK-5, R-SKILL-CHECK-7).
 *
 * This is the TypeScript form of the logic that lived in the Python style
 * check of the cleanup-docs Skill (removed in W34 R0 P4). The block
 * parser, the three rules, and the two fixes follow that script line for line,
 * so the same file gives the same findings. The cleanup-docs Skill text is the
 * agent form of these rules and uses the same rule IDs (PRD 25
 * R-SKILL-RUNTIME-7).
 */
import { existsSync, lstatSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { isProtectedContentPath } from "../../path-hygiene";
import { MANAGED_BLOCK_BEGIN, MANAGED_BLOCK_END } from "../../managed-block";
import { assertManagedPathHasNoSymlinks } from "../../utils";
import { OperationError } from "../types";

/** One rule of the Markdown style check. The ID is shared with the Skill text. */
export interface MarkdownStyleRule {
  id: MarkdownStyleRuleId;
  fixable: boolean;
  description: string;
}

export const MARKDOWN_STYLE_RULE_IDS = [
  "markdown-style.block-spacing",
  "markdown-style.paragraph-wrap",
  "markdown-style.list-continuation-wrap",
] as const;
export type MarkdownStyleRuleId = (typeof MARKDOWN_STYLE_RULE_IDS)[number];

/** The one rule list of `project markdown validate` and `project markdown repair`. */
export const MARKDOWN_STYLE_RULES: readonly MarkdownStyleRule[] = [
  {
    id: "markdown-style.block-spacing",
    fixable: true,
    description: "Put one blank line between two blocks, such as a heading and a paragraph, or a list and a code fence.",
  },
  {
    id: "markdown-style.paragraph-wrap",
    fixable: true,
    description: "Write a top-level paragraph on one source line. Repair joins its lines with one space.",
  },
  {
    id: "markdown-style.list-continuation-wrap",
    fixable: false,
    description: "A list item goes on to an indented next line. Review it by hand. Repair does not change lists.",
  },
];

export interface MarkdownStyleFinding {
  /** Project-relative POSIX path. */
  path: string;
  startLine: number;
  endLine: number;
  ruleId: MarkdownStyleRuleId;
  message: string;
  fixable: boolean;
  confidence: number;
  blockType: string;
  preview: string;
}

interface Block {
  blockType: string;
  start: number;
  end: number;
  protected: boolean;
}

const FENCE_RE = /^\s*(`{3,}|~{3,})/;
const LIST_RE = /^(?<indent>[ \t]*)(?<marker>(?:[-+*]|\d+[.)]))[ \t]+(?:(?<task>\[[ xX]\])[ \t]+)?(?<text>.*)$/;
const HEADING_RE = /^\s{0,3}#{1,6}\s+/;
const HTML_COMMENT_START_RE = /^\s*<!--/;
const HTML_COMMENT_END_RE = /--!?>\s*$/;

/** Python `str.splitlines()`: the line breaks it knows, and no empty last line. */
export function splitLines(text: string): string[] {
  if (text.length === 0) return [];
  const lines = text.split(/\r\n|[\n\r\v\f\x1c\x1d\x1e\x85\u2028\u2029]/);
  if (/(?:\r\n|[\n\r\v\f\x1c\x1d\x1e\x85\u2028\u2029])$/.test(text)) lines.pop();
  return lines;
}

/** Python `str.strip()` for the whitespace that a Markdown line can hold. */
function strip(value: string): string {
  return value.trim();
}

function lstripSpaceTab(value: string): string {
  return value.replace(/^[ \t]+/, "");
}

function frontmatterEnd(lines: string[]): number | null {
  if (lines.length === 0 || strip(lines[0]!) !== "---") return null;
  for (let index = 1; index < lines.length; index += 1) {
    if (strip(lines[index]!) === "---") return index;
  }
  return null;
}

function leadingIndent(line: string): number {
  return line.length - lstripSpaceTab(line).length;
}

function isTable(line: string): boolean {
  const stripped = strip(line);
  return stripped.startsWith("|") && stripped.endsWith("|");
}

function isListItem(line: string): boolean {
  return LIST_RE.test(line);
}

function isListContinuation(lines: string[], index: number): boolean {
  const line = lines[index]!;
  if (!strip(line) || isListItem(line)) return false;
  const indent = leadingIndent(line);
  if (indent === 0) return false;
  let previous = index - 1;
  while (previous >= 0) {
    const previousLine = lines[previous]!;
    if (!strip(previousLine)) return false;
    if (isListItem(previousLine)) return indent > leadingIndent(previousLine);
    previous -= 1;
  }
  return false;
}

function isListLine(lines: string[], index: number): boolean {
  return isListItem(lines[index]!) || isListContinuation(lines, index);
}

function isCodeFence(line: string): boolean {
  return FENCE_RE.test(line.trimStart());
}

function isCommentStart(line: string): boolean {
  return HTML_COMMENT_START_RE.test(line);
}

function isHeading(line: string): boolean {
  return HEADING_RE.test(line);
}

function isBlockquote(line: string): boolean {
  return line.trimStart().startsWith(">");
}

function parseCodeFence(lines: string[], start: number): number {
  const match = FENCE_RE.exec(lines[start]!.trimStart());
  if (!match) return start;
  const marker = match[1]!;
  const fenceChar = marker[0]!;
  const fenceLength = marker.length;
  for (let cursor = start + 1; cursor < lines.length; cursor += 1) {
    const closing = FENCE_RE.exec(lines[cursor]!.trimStart());
    if (closing && closing[1]![0] === fenceChar && closing[1]!.length >= fenceLength) return cursor;
  }
  return lines.length - 1;
}

function parseComment(lines: string[], start: number): number {
  for (let cursor = start; cursor < lines.length; cursor += 1) {
    if (HTML_COMMENT_END_RE.test(lines[cursor]!)) return cursor;
  }
  return lines.length - 1;
}

function listBlockEnd(lines: string[], start: number): number {
  let cursor = start + 1;
  while (cursor < lines.length && isListLine(lines, cursor)) cursor += 1;
  return cursor - 1;
}

function sameTypeBlockEnd(lines: string[], start: number, blockType: "table" | "blockquote" | "indented"): number {
  let cursor = start + 1;
  while (cursor < lines.length) {
    const line = lines[cursor]!;
    if (!strip(line)) break;
    if (blockType === "table" && !isTable(line)) break;
    if (blockType === "blockquote" && !isBlockquote(line)) break;
    if (blockType === "indented" && leadingIndent(line) === 0) break;
    cursor += 1;
  }
  return cursor - 1;
}

function isParagraphLine(lines: string[], index: number): boolean {
  const line = lines[index]!;
  return Boolean(strip(line)) &&
    leadingIndent(line) === 0 &&
    !isHeading(line) &&
    !isCodeFence(line) &&
    !isCommentStart(line) &&
    !isTable(line) &&
    !isBlockquote(line) &&
    !isListItem(line);
}

function paragraphEnd(lines: string[], start: number): number {
  let cursor = start + 1;
  while (cursor < lines.length && isParagraphLine(lines, cursor)) cursor += 1;
  return cursor - 1;
}

function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let index = 0;
  const fmEnd = frontmatterEnd(lines);
  if (fmEnd !== null) {
    blocks.push({ blockType: "frontmatter", start: 0, end: fmEnd, protected: true });
    index = fmEnd + 1;
  }
  while (index < lines.length) {
    const line = lines[index]!;
    if (!strip(line)) {
      index += 1;
      continue;
    }
    let end: number;
    if (isCodeFence(line)) {
      end = parseCodeFence(lines, index);
      blocks.push({ blockType: "code-fence", start: index, end, protected: true });
    } else if (isCommentStart(line)) {
      end = parseComment(lines, index);
      blocks.push({ blockType: "comment", start: index, end, protected: true });
    } else if (isHeading(line)) {
      end = index;
      blocks.push({ blockType: "heading", start: index, end, protected: false });
    } else if (isTable(line)) {
      end = sameTypeBlockEnd(lines, index, "table");
      blocks.push({ blockType: "table", start: index, end, protected: true });
    } else if (isBlockquote(line)) {
      end = sameTypeBlockEnd(lines, index, "blockquote");
      blocks.push({ blockType: "blockquote", start: index, end, protected: true });
    } else if (isListItem(line)) {
      end = listBlockEnd(lines, index);
      blocks.push({ blockType: "list", start: index, end, protected: true });
    } else if (leadingIndent(line) > 0) {
      end = sameTypeBlockEnd(lines, index, "indented");
      blocks.push({ blockType: "indented", start: index, end, protected: true });
    } else {
      end = paragraphEnd(lines, index);
      blocks.push({ blockType: "paragraph", start: index, end, protected: false });
    }
    index = end + 1;
  }
  return blocks;
}

function preview(lines: string[], start: number, end: number): string {
  const text = lines.slice(start, end + 1).map(strip).filter(Boolean).join(" ");
  return Array.from(text).slice(0, 160).join("");
}

function hasBlankBetween(left: Block, right: Block): boolean {
  return right.start > left.end + 1;
}

/** Find every Markdown style problem in one file's text. `filePath` names the file in each finding. */
export function scanMarkdownStyle(filePath: string, text: string): MarkdownStyleFinding[] {
  const lines = splitLines(normalizeNewlines(text));
  const blocks = parseBlocks(lines);
  const findings: MarkdownStyleFinding[] = [];
  for (let index = 0; index + 1 < blocks.length; index += 1) {
    const left = blocks[index]!;
    const right = blocks[index + 1]!;
    if (hasBlankBetween(left, right)) continue;
    findings.push({
      path: filePath,
      startLine: right.start + 1,
      endLine: right.start + 1,
      ruleId: "markdown-style.block-spacing",
      message: `Block \`${right.blockType}\` must be separated from previous \`${left.blockType}\` block by one blank line.`,
      fixable: true,
      confidence: 1.0,
      blockType: `${left.blockType}->${right.blockType}`,
      preview: preview(lines, right.start, right.end),
    });
  }
  for (const block of blocks) {
    if (block.blockType !== "paragraph" || block.start === block.end) continue;
    findings.push({
      path: filePath,
      startLine: block.start + 1,
      endLine: block.end + 1,
      ruleId: "markdown-style.paragraph-wrap",
      message: "Paragraph spans multiple source lines; use one logical source line unless Markdown structure requires otherwise.",
      fixable: true,
      confidence: 0.95,
      blockType: block.blockType,
      preview: preview(lines, block.start, block.end),
    });
  }
  for (const block of blocks) {
    if (block.blockType !== "list") continue;
    for (let index = block.start; index < block.end; index += 1) {
      if (!isListItem(lines[index]!) || !isListContinuation(lines, index + 1)) continue;
      findings.push({
        path: filePath,
        startLine: index + 1,
        endLine: index + 2,
        ruleId: "markdown-style.list-continuation-wrap",
        message: "List item uses wrapped continuation text; prefer one logical list-item line or preserve indentation during manual cleanup.",
        fixable: false,
        confidence: 0.7,
        blockType: block.blockType,
        preview: preview(lines, index, index + 1),
      });
    }
  }
  return findings;
}

/** Python text mode reads `\r\n` and `\r` as `\n`. */
function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

function fixBlockSpacing(text: string): string {
  const lines = splitLines(text);
  const blocks = parseBlocks(lines);
  const insertAfter = new Set<number>();
  for (let index = 0; index + 1 < blocks.length; index += 1) {
    if (!hasBlankBetween(blocks[index]!, blocks[index + 1]!)) insertAfter.add(blocks[index]!.end);
  }
  const output: string[] = [];
  lines.forEach((line, index) => {
    output.push(line);
    if (insertAfter.has(index)) output.push("");
  });
  return output.join("\n") + (text.endsWith("\n") ? "\n" : "");
}

function fixParagraphWraps(text: string): string {
  const lines = splitLines(text);
  const paragraphs = new Map<number, Block>();
  for (const block of parseBlocks(lines)) {
    if (block.blockType === "paragraph" && block.start < block.end) paragraphs.set(block.start, block);
  }
  const output: string[] = [];
  let index = 0;
  while (index < lines.length) {
    const block = paragraphs.get(index);
    if (block === undefined) {
      output.push(lines[index]!);
      index += 1;
      continue;
    }
    output.push(lines.slice(block.start, block.end + 1).map(strip).join(" "));
    index = block.end + 1;
  }
  return output.join("\n") + (text.endsWith("\n") ? "\n" : "");
}

/**
 * The repair text: block spacing first, then paragraph joins, as the script's
 * `--fix` did. A file that used `\r\n` keeps `\r\n` (the script wrote `\n`).
 */
export function fixMarkdownStyle(text: string): string {
  const crlf = text.includes("\r\n");
  const fixed = fixParagraphWraps(fixBlockSpacing(normalizeNewlines(text)));
  return crlf ? fixed.replace(/\n/g, "\r\n") : fixed;
}

// Project scope.

/**
 * Exact edits of one repair, on the file's lines (`\n` line ends). Each edit
 * removes `removed` at `startLine` and puts `added` there. A block-spacing
 * edit removes nothing and adds one blank line before `startLine`. Applying
 * the edits from the last to the first gives the repaired text.
 */
export interface MarkdownStyleEdit {
  ruleId: Extract<MarkdownStyleRuleId, "markdown-style.block-spacing" | "markdown-style.paragraph-wrap">;
  startLine: number;
  endLine: number;
  removed: string[];
  added: string[];
}

/** The exact edits that `fixMarkdownStyle` makes, in file order. */
export function markdownStyleEdits(text: string): MarkdownStyleEdit[] {
  const lines = splitLines(normalizeNewlines(text));
  const blocks = parseBlocks(lines);
  const edits: MarkdownStyleEdit[] = [];
  for (let index = 0; index + 1 < blocks.length; index += 1) {
    const right = blocks[index + 1]!;
    if (hasBlankBetween(blocks[index]!, right)) continue;
    edits.push({ ruleId: "markdown-style.block-spacing", startLine: right.start + 1, endLine: right.start + 1, removed: [], added: [""] });
  }
  for (const block of blocks) {
    if (block.blockType !== "paragraph" || block.start === block.end) continue;
    const removed = lines.slice(block.start, block.end + 1);
    edits.push({ ruleId: "markdown-style.paragraph-wrap", startLine: block.start + 1, endLine: block.end + 1, removed, added: [removed.map(strip).join(" ")] });
  }
  // A blank line goes before a joined paragraph that starts on the same line.
  return edits.sort((left, right) => left.startLine - right.startLine || (left.ruleId === "markdown-style.block-spacing" ? -1 : 1));
}

export interface MarkdownStyleScope {
  targetRoot: string;
  /** Project-relative files or folders. The default is `docs`. */
  paths?: readonly string[];
}

/**
 * Why a file or folder is left out. Repair never changes these, and validate
 * does not read them, so both see the same files:
 * - `protected-folder`: a folder that `project paths validate` also skips,
 *   such as `node_modules`, `.git`, `.make-docs/backup`, or `.make-docs/archive`.
 * - `router-file`: an `AGENTS.md` or `CLAUDE.md` instruction router.
 * - `managed-block`: a file that holds a `<!-- make-docs:begin -->` block,
 *   which `make-docs setup` owns.
 */
export type MarkdownStyleSkipReason = "protected-folder" | "router-file" | "managed-block";

export interface MarkdownStyleSkip {
  path: string;
  reason: MarkdownStyleSkipReason;
}

export interface MarkdownStyleValidateResult {
  schemaVersion: 1;
  operation: "project.markdown-style.validate";
  targetRoot: string;
  status: "clean" | "findings";
  summary: string;
  scope: string[];
  totals: {
    filesChecked: number;
    filesSkipped: number;
    filesWithFindings: number;
    findings: number;
    fixable: number;
    manualReview: number;
    byRule: Record<MarkdownStyleRuleId, number>;
  };
  rules: readonly MarkdownStyleRule[];
  skipped: MarkdownStyleSkip[];
  findings: MarkdownStyleFinding[];
}

export interface MarkdownStylePlannedChange {
  path: string;
  /** Each fixable finding that the change fixes. */
  fixes: Array<Pick<MarkdownStyleFinding, "ruleId" | "startLine" | "endLine" | "preview">>;
  /** The exact edits, line by line. */
  edits: MarkdownStyleEdit[];
  linesBefore: number;
  linesAfter: number;
  /** The whole file before and after the repair. */
  before: string;
  after: string;
}

export interface MarkdownStyleRepairResult {
  schemaVersion: 1;
  operation: "project.markdown-style.repair";
  targetRoot: string;
  status: "clean" | "previewed" | "repaired";
  dryRun: boolean;
  summary: string;
  scope: string[];
  totals: MarkdownStyleValidateResult["totals"] & { filesToChange: number; filesChanged: number };
  rules: readonly MarkdownStyleRule[];
  skipped: MarkdownStyleSkip[];
  findings: MarkdownStyleFinding[];
  changes: MarkdownStylePlannedChange[];
  changedFiles: string[];
  /** Findings that repair does not fix. Review them by hand. */
  manualReview: MarkdownStyleFinding[];
  nextAction: string;
}

const ROUTER_FILES = new Set(["agents.md", "claude.md"]);
const MANAGED_BLOCK_LINES = new Set([MANAGED_BLOCK_BEGIN, MANAGED_BLOCK_END]);

/**
 * True when a line of the file is a managed block marker on its own, as
 * `make-docs setup` writes it. A file that only mentions the marker in a
 * sentence or in inline code holds no managed block (register D-067).
 */
export function holdsManagedBlock(text: string): boolean {
  return text.split(/\r?\n/).some((line) => MANAGED_BLOCK_LINES.has(line.trim()));
}

function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}

function insideRoot(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function comparePathParts(left: string, right: string): number {
  const a = left.split("/");
  const b = right.split("/");
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    if (a[index] !== b[index]) return a[index]! < b[index]! ? -1 : 1;
  }
  return a.length - b.length;
}

interface ScopeWalk {
  root: string;
  files: Set<string>;
  skipped: Map<string, MarkdownStyleSkipReason>;
}

function considerFile(walk: ScopeWalk, relative: string): void {
  if (!relative.toLowerCase().endsWith(".md")) return;
  if (ROUTER_FILES.has(path.posix.basename(relative).toLowerCase())) {
    walk.skipped.set(relative, "router-file");
    return;
  }
  walk.files.add(relative);
}

function walkMarkdown(walk: ScopeWalk, relativeDirectory: string): void {
  const directory = relativeDirectory === "." ? walk.root : path.join(walk.root, relativeDirectory);
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const relative = relativeDirectory === "." ? entry.name : `${relativeDirectory}/${entry.name}`;
    if (isProtectedContentPath(relative)) {
      if (entry.isDirectory()) walk.skipped.set(relative, "protected-folder");
      continue;
    }
    if (entry.isDirectory()) walkMarkdown(walk, relative);
    else if (entry.isFile()) considerFile(walk, relative);
  }
}

/**
 * The project-relative Markdown files in scope, in the script's order, and
 * what was left out. It uses the `project paths validate` skip rules and
 * leaves out router files. Files with a managed block are left out when read.
 */
export function markdownStyleFiles(scope: MarkdownStyleScope): { scope: string[]; files: string[]; skipped: MarkdownStyleSkip[] } {
  const root = path.resolve(scope.targetRoot);
  if (!existsSync(root) || !statSync(root).isDirectory()) throw new OperationError(`The project folder ${root} does not exist.`);
  const explicit = Boolean(scope.paths && scope.paths.length > 0);
  const requested = explicit ? [...scope.paths!] : ["docs"];
  const walk: ScopeWalk = { root, files: new Set(), skipped: new Map() };
  const shown: string[] = [];
  for (const raw of requested) {
    const absolute = path.resolve(root, raw);
    if (!insideRoot(root, absolute)) {
      throw new OperationError(`The path \`${raw}\` is outside the project. Give a path inside ${root}.`);
    }
    const relative = toPosix(path.relative(root, absolute)) || ".";
    shown.push(relative);
    if (relative !== "." && isProtectedContentPath(relative)) {
      throw new OperationError(`The path \`${raw}\` is in a protected folder that Make Docs does not check, such as node_modules or .make-docs/backup.`);
    }
    if (!existsSync(absolute)) {
      if (explicit) throw new OperationError(`The path \`${raw}\` does not exist in the project.`);
      continue;
    }
    if (relative !== ".") assertManagedPathHasNoSymlinks(root, relative);
    const stat = lstatSync(absolute);
    if (stat.isFile()) considerFile(walk, relative);
    else if (stat.isDirectory()) walkMarkdown(walk, relative);
  }
  const skipped = [...walk.skipped].map(([skippedPath, reason]) => ({ path: skippedPath, reason }));
  return {
    scope: shown,
    files: [...walk.files].sort(comparePathParts),
    skipped: skipped.sort((left, right) => comparePathParts(left.path, right.path)),
  };
}

function emptyByRule(): Record<MarkdownStyleRuleId, number> {
  return Object.fromEntries(MARKDOWN_STYLE_RULE_IDS.map((id) => [id, 0])) as Record<MarkdownStyleRuleId, number>;
}

function totalsFor(filesChecked: number, filesSkipped: number, findings: readonly MarkdownStyleFinding[]): MarkdownStyleValidateResult["totals"] {
  const byRule = emptyByRule();
  for (const finding of findings) byRule[finding.ruleId] += 1;
  const fixable = findings.filter((finding) => finding.fixable).length;
  return {
    filesChecked,
    filesSkipped,
    filesWithFindings: new Set(findings.map((finding) => finding.path)).size,
    findings: findings.length,
    fixable,
    manualReview: findings.length - fixable,
    byRule,
  };
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function readProjectText(root: string, relative: string): string {
  assertManagedPathHasNoSymlinks(root, relative);
  return readFileSync(path.join(root, relative), "utf8");
}

/** Read each file in scope. A file with a managed block moves to the skipped list. */
function readScope(input: MarkdownStyleScope): { targetRoot: string; scope: string[]; texts: Array<[string, string]>; skipped: MarkdownStyleSkip[] } {
  const targetRoot = path.resolve(input.targetRoot);
  const { scope, files, skipped } = markdownStyleFiles({ ...input, targetRoot });
  const texts: Array<[string, string]> = [];
  for (const file of files) {
    const text = readProjectText(targetRoot, file);
    if (holdsManagedBlock(text)) skipped.push({ path: file, reason: "managed-block" });
    else texts.push([file, text]);
  }
  skipped.sort((left, right) => comparePathParts(left.path, right.path));
  return { targetRoot, scope, texts, skipped };
}

function skippedText(count: number): string {
  return count > 0 ? ` Skipped ${count} ${count === 1 ? "file or folder" : "files or folders"} that Make Docs owns or protects.` : "";
}

/** `project markdown validate`: report the style findings. Changes nothing. */
export function validateMarkdownStyle(input: MarkdownStyleScope): MarkdownStyleValidateResult {
  const { targetRoot, scope, texts, skipped } = readScope(input);
  const findings = texts.flatMap(([file, text]) => scanMarkdownStyle(file, text));
  const totals = totalsFor(texts.length, skipped.length, findings);
  const summary = findings.length === 0
    ? `Checked ${plural(texts.length, "Markdown file")}. No style findings.${skippedText(skipped.length)} Changes nothing.`
    : `Checked ${plural(texts.length, "Markdown file")}. Found ${plural(findings.length, "finding")} in ${plural(totals.filesWithFindings, "file")}: ${totals.fixable} repair can fix, ${totals.manualReview} to review by hand.${skippedText(skipped.length)} Changes nothing.`;
  return {
    schemaVersion: 1,
    operation: "project.markdown-style.validate",
    targetRoot,
    status: findings.length === 0 ? "clean" : "findings",
    summary,
    scope,
    totals,
    rules: MARKDOWN_STYLE_RULES,
    skipped,
    findings,
  };
}

/**
 * `project markdown repair`: make only the fixes that the script made with
 * `--fix`, in the files that validate reads. Without `apply`, or in a dry
 * run, it shows each exact change and writes nothing.
 */
export function repairMarkdownStyle(input: MarkdownStyleScope & { apply: boolean }): MarkdownStyleRepairResult {
  const { targetRoot, scope, texts, skipped } = readScope(input);
  const findings: MarkdownStyleFinding[] = [];
  const planned: MarkdownStylePlannedChange[] = [];
  for (const [file, before] of texts) {
    const fileFindings = scanMarkdownStyle(file, before);
    findings.push(...fileFindings);
    const fixes = fileFindings.filter((finding) => finding.fixable);
    if (fixes.length === 0) continue;
    const after = fixMarkdownStyle(before);
    if (after === before) continue;
    planned.push({
      path: file,
      fixes: fixes.map(({ ruleId, startLine, endLine, preview: text }) => ({ ruleId, startLine, endLine, preview: text })),
      edits: markdownStyleEdits(before),
      linesBefore: splitLines(before).length,
      linesAfter: splitLines(after).length,
      before,
      after,
    });
  }
  const changedFiles: string[] = [];
  if (input.apply) {
    for (const change of planned) {
      if (readProjectText(targetRoot, change.path) !== change.before) {
        throw new OperationError(`The file ${change.path} changed during the repair. Run the repair again.`);
      }
    }
    for (const change of planned) {
      assertManagedPathHasNoSymlinks(targetRoot, change.path);
      writeFileSync(path.join(targetRoot, change.path), change.after);
      changedFiles.push(change.path);
    }
  }
  const manualReview = findings.filter((finding) => !finding.fixable);
  const totals = { ...totalsFor(texts.length, skipped.length, findings), filesToChange: planned.length, filesChanged: changedFiles.length };
  const status: MarkdownStyleRepairResult["status"] = planned.length === 0 ? "clean" : input.apply ? "repaired" : "previewed";
  const manualText = manualReview.length > 0 ? ` ${plural(manualReview.length, "finding")} need review by hand.` : "";
  const summary = status === "clean"
    ? `Checked ${plural(texts.length, "Markdown file")}. Nothing to repair.${manualText}${skippedText(skipped.length)} Changed nothing.`
    : status === "previewed"
      ? `Checked ${plural(texts.length, "Markdown file")}. Repair would change ${plural(planned.length, "file")}.${manualText}${skippedText(skipped.length)} Changed nothing.`
      : `Checked ${plural(texts.length, "Markdown file")}. Repaired ${plural(changedFiles.length, "file")}.${manualText}${skippedText(skipped.length)}`;
  const nextAction = status === "previewed"
    ? "Review the planned changes. Then run `make-docs project markdown repair --apply` with the same paths."
    : status === "repaired"
      ? "Review the changed files, for example with `git diff`."
      : manualReview.length > 0
        ? "Review the list continuation findings by hand."
        : "None.";
  return {
    schemaVersion: 1,
    operation: "project.markdown-style.repair",
    targetRoot,
    status,
    dryRun: !input.apply,
    summary,
    scope,
    totals,
    rules: MARKDOWN_STYLE_RULES,
    skipped,
    findings,
    changes: planned,
    changedFiles,
    manualReview,
    nextAction,
  };
}

/**
 * The command exit code, as `project paths validate` and `project paths repair`
 * set it: 0 when no finding is left, 1 when a finding is left. An error exits 2.
 * After `repair --apply`, only the findings that repair does not fix are left.
 */
export function markdownStyleExitCode(result: MarkdownStyleValidateResult | MarkdownStyleRepairResult): 0 | 1 {
  if (result.operation === "project.markdown-style.validate") return result.findings.length === 0 ? 0 : 1;
  const left = result.status === "repaired" ? result.manualReview.length : result.findings.length;
  return left === 0 ? 0 : 1;
}

const SKIP_REASONS: Record<MarkdownStyleSkipReason, string> = {
  "protected-folder": "protected folder, as project paths validate skips it",
  "router-file": "instruction router file",
  "managed-block": "holds a make-docs managed block",
};

function skippedLines(skipped: readonly MarkdownStyleSkip[]): string[] {
  return skipped.map((item) => `Skipped: ${item.path} (${SKIP_REASONS[item.reason]})`);
}

function findingLines(findings: readonly MarkdownStyleFinding[]): string[] {
  const lines: string[] = [];
  let file = "";
  for (const finding of findings) {
    if (finding.path !== file) {
      file = finding.path;
      lines.push("", file);
    }
    const where = finding.startLine === finding.endLine ? `line ${finding.startLine}` : `lines ${finding.startLine}-${finding.endLine}`;
    lines.push(`  ${finding.ruleId} (${where}, ${finding.fixable ? "repair can fix" : "review by hand"}): ${finding.message}`);
    lines.push(`    ${finding.preview}`);
  }
  return lines;
}

/** Plain words for `project markdown validate`: the totals first, then each finding. */
export function renderMarkdownStyleValidate(result: MarkdownStyleValidateResult): string {
  const lines = [`Markdown style check: ${result.summary}`, `Project: ${result.targetRoot}`, `Scope: ${result.scope.join(", ")}`];
  lines.push(...skippedLines(result.skipped));
  if (result.findings.length > 0) {
    lines.push(
      `By rule: ${MARKDOWN_STYLE_RULE_IDS.map((id) => `${id} ${result.totals.byRule[id]}`).join(", ")}.`,
      ...findingLines(result.findings),
      "",
      "Next: review a sample of the findings, then run `make-docs project markdown repair` to see the planned fixes.",
    );
  }
  lines.push("");
  return lines.join("\n");
}

/** Plain words for `project markdown repair`: the totals first, then each exact change. */
export function renderMarkdownStyleRepair(result: MarkdownStyleRepairResult): string {
  const lines = [`Markdown style repair: ${result.summary}`, `Project: ${result.targetRoot}`, `Scope: ${result.scope.join(", ")}`];
  lines.push(...skippedLines(result.skipped));
  for (const change of result.changes) {
    lines.push("", `${result.status === "repaired" ? "Changed" : "Would change"}: ${change.path} (${change.linesBefore} lines -> ${change.linesAfter} lines)`);
    for (const edit of change.edits) {
      if (edit.ruleId === "markdown-style.block-spacing") {
        lines.push(`  ${edit.ruleId}: add a blank line before line ${edit.startLine}`);
        continue;
      }
      lines.push(`  ${edit.ruleId}: join lines ${edit.startLine}-${edit.endLine} into one line`);
      for (const removed of edit.removed) lines.push(`    - ${removed}`);
      for (const added of edit.added) lines.push(`    + ${added}`);
    }
  }
  if (result.manualReview.length > 0) {
    lines.push("", "Review by hand (repair does not change these):", ...findingLines(result.manualReview).filter((line) => line !== ""));
  }
  lines.push("", `Next: ${result.nextAction}`, "");
  return lines.join("\n");
}
