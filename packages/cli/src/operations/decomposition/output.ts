/**
 * W34 R0 P1: decomposition output check (PRD 39 R-SKILL-CHECK-2, R-SKILL-CHECK-7).
 *
 * This is the TypeScript form of the logic that lived in the Python output
 * check of the decompose-codebase Skill (removed in W34 R0 P4). Each script
 * rule has one stable rule ID here. The finding messages keep the script's
 * words, so the same project gives the same findings. The decompose-codebase
 * Skill text is the agent form of these rules and uses the same rule IDs
 * (PRD 25 R-SKILL-RUNTIME-7).
 *
 * Task lines and task IDs come from the shared work phase reader
 * (`parseWorkPhase`, PRD 14 R-COORD-22). A task ID label in an acceptance line
 * comes from the shared task line reader (`readTaskLabel`, W34 R0 P5 T8). Both
 * build on `TASK_ID_SOURCE` in `../work/task-line.ts`, so a task ID rule
 * change is made once.
 */
import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { parseWorkPhase, type PhaseTask } from "../work";
import { readTaskLabel } from "../work/task-line.js";

export interface DecompositionRule {
  id: DecompositionRuleId;
  description: string;
}

/** The one rule list of `check decomposition`. P2 uses the same IDs in the Skill text. */
export const DECOMPOSITION_RULES = [
  { id: "decomposition.prd.root-missing", description: "The project has a docs/prd folder." },
  { id: "decomposition.prd.core-file-missing", description: "docs/prd holds the five core files 00-index.md to 04-glossary.md." },
  { id: "decomposition.prd.legacy-archive", description: "docs/prd has no archive folder. Archived PRD sets live in .make-docs/archive/prds/." },
  { id: "decomposition.prd.root-non-markdown", description: "Each file in the docs/prd root is a Markdown file." },
  { id: "decomposition.prd.file-name", description: "Each PRD file name is NN-slug.md." },
  { id: "decomposition.prd.duplicate-prefix", description: "No two top-level PRD files or folders share a number." },
  { id: "decomposition.prd.file-prefix-range", description: "A top-level PRD file number is 00 to 04, or 05 to 97." },
  { id: "decomposition.prd.backlog-in-prd", description: "Rebuild backlog files live under docs/work, not docs/prd." },
  { id: "decomposition.prd.folder-name", description: "Each PRD subfolder name is NN-slug." },
  { id: "decomposition.prd.folder-prefix-range", description: "A PRD subfolder number is 05 to 97." },
  { id: "decomposition.prd.nested-too-deep", description: "A PRD subfolder holds no folders." },
  { id: "decomposition.prd.nested-non-markdown", description: "A PRD subfolder holds only Markdown files." },
  { id: "decomposition.prd.nested-file-name", description: "Each file in a PRD subfolder is named NN-slug.md." },
  { id: "decomposition.prd.section-missing", description: "Each PRD document has the required `##` sections for its kind: core, subsystem, or reference." },
  { id: "decomposition.prd.anchor-missing", description: "Each anchor section of a PRD document holds a code anchor, such as a backticked path." },
  { id: "decomposition.archive.not-directory", description: ".make-docs/archive/prds is a folder." },
  { id: "decomposition.archive.loose-file", description: ".make-docs/archive/prds holds only dated folders, not files." },
  { id: "decomposition.archive.unexpected-entry", description: ".make-docs/archive/prds holds only folders." },
  { id: "decomposition.archive.folder-name", description: "Each archive folder name is YYYY-MM-DD or YYYY-MM-DD-XX." },
  { id: "decomposition.work.root-missing", description: "The project has a docs/work folder." },
  { id: "decomposition.work.no-backlog", description: "docs/work holds at least one backlog folder." },
  { id: "decomposition.work.loose-file", description: "Each backlog in docs/work is a folder, not a file." },
  { id: "decomposition.work.folder-name", description: "Each backlog folder name is YYYY-MM-DD-wW-rR-slug." },
  { id: "decomposition.work.index-missing", description: "Each backlog folder holds 00-index.md." },
  { id: "decomposition.work.section-missing", description: "A backlog index has Purpose, Phase Map, and Usage Notes. A phase file has Purpose, Overview, and Source PRD Docs." },
  { id: "decomposition.work.nested-folder", description: "A backlog folder holds no folders." },
  { id: "decomposition.work.non-markdown", description: "A backlog folder holds only Markdown files." },
  { id: "decomposition.work.phase-file-name", description: "Each phase file name is NN-slug.md, from 01." },
  { id: "decomposition.work.no-phase-file", description: "Each backlog folder holds at least one phase file." },
  { id: "decomposition.work.no-valid-backlog", description: "docs/work holds at least one backlog folder with a valid name." },
  { id: "decomposition.work.unexpected-entry", description: "docs/work holds only backlog folders." },
  { id: "decomposition.work.stage-missing", description: "Each phase file has at least one `## Stage` section." },
  { id: "decomposition.work.stage-subsection-missing", description: "Each stage has Tasks, Acceptance criteria, and Dependencies subsections." },
  { id: "decomposition.task-id.no-task", description: "Each stage lists at least one task." },
  { id: "decomposition.task-id.line-format", description: "Each task line is `- [ ] TN: ...` or `- [x] TN: ...`. The task ID letter may be t or T." },
  { id: "decomposition.task-id.duplicate", description: "No two tasks in a phase share a task ID. t1 and T1 are the same ID." },
  { id: "decomposition.task-id.sequence", description: "Task IDs count up from T1 across all stages of a phase, with no gap or reset." },
  { id: "decomposition.acceptance.empty", description: "Each stage lists at least one acceptance criterion." },
  { id: "decomposition.acceptance.checkbox", description: "Acceptance criteria are plain bullets, not checkboxes." },
  { id: "decomposition.acceptance.task-id", description: "Acceptance criteria do not start with a task ID." },
  { id: "decomposition.acceptance.bullet", description: "Each acceptance criterion is a plain `- ...` bullet." },
  { id: "decomposition.link.escapes-root", description: "A relative link in docs/prd or docs/work stays inside the project." },
  { id: "decomposition.link.broken", description: "A relative link in docs/prd or docs/work points to a file or folder that exists." },
] as const satisfies ReadonlyArray<{ id: string; description: string }>;

export type DecompositionRuleId = (typeof DECOMPOSITION_RULES)[number]["id"];

export const DECOMPOSITION_RULE_IDS: readonly DecompositionRuleId[] = DECOMPOSITION_RULES.map((rule) => rule.id);

export interface DecompositionFinding {
  ruleId: DecompositionRuleId;
  /** Project-relative POSIX path of the file or folder. */
  path: string;
  /** The source line, when the finding is about one line. */
  line?: number;
  message: string;
}

export interface DecompositionValidationResult {
  schemaVersion: 1;
  operation: "decomposition.output.validate";
  targetRoot: string;
  status: "passed" | "failed";
  summary: string;
  totals: {
    findings: number;
    files: number;
    byRule: Partial<Record<DecompositionRuleId, number>>;
  };
  rules: readonly DecompositionRule[];
  findings: DecompositionFinding[];
}

const ROOT_FILE_RE = /^(\d{2})-[a-z0-9][a-z0-9-]*\.md$/;
const ROOT_DIR_RE = /^(\d{2})-[a-z0-9][a-z0-9-]*$/;
const WORK_DIR_RE = /^\d{4}-\d{2}-\d{2}-w\d+-r\d+-[a-z0-9][a-z0-9-]*$/;
const WORK_PHASE_FILE_RE = /^(0[1-9]|[1-9]\d)-[a-z0-9][a-z0-9-]*\.md$/;
const ARCHIVE_DIR_RE = /^\d{4}-\d{2}-\d{2}(?:-\d{2})?$/;
const ANCHOR_RE = /`[^`\n]*(?:\/|\\)[^`\n]*`|`[^`\n]*\.[A-Za-z0-9_-]+(?::\d+(?::\d+)?)?`/;
/** A Markdown link. Exported for the ported tests. */
export const LINK_RE = /\[[^\]]+\]\(([^)]+)\)/g;
const FENCE_RE = /^(`{3,}|~{3,})/;
const INLINE_CODE_RE = /(`{1,2})(?!`)(.+?)(?<!`)\1(?!`)/g;
const UNESCAPED_SPACE_RE = /(?<!\\) /;
const ACCEPTANCE_CHECKBOX_RE = /^- \[[ xX]\]\s+/;
const INSTRUCTION_FILES = new Set(["AGENTS.md", "CLAUDE.md"]);

interface DocRule {
  required: string[];
  anchorSections: string[];
}

const CORE_DOC_RULES: Record<string, DocRule> = {
  "docs/prd/00-index.md": {
    required: ["Purpose", "Reading Order", "Document Map", "Source Anchors", "Audience Paths"],
    anchorSections: ["Source Anchors"],
  },
  "docs/prd/01-product-overview.md": {
    required: ["Purpose", "Users", "Key Capabilities", "System Boundaries", "Current Limitations", "Source Anchors"],
    anchorSections: ["Users", "Key Capabilities", "System Boundaries", "Current Limitations", "Source Anchors"],
  },
  "docs/prd/02-architecture-overview.md": {
    required: ["Purpose", "Topology", "Module Map", "Runtime Boundaries", "Data Flow", "Configuration Surfaces", "Source Anchors"],
    anchorSections: ["Topology", "Module Map", "Runtime Boundaries", "Data Flow", "Configuration Surfaces", "Source Anchors"],
  },
  "docs/prd/03-open-questions-and-risk-register.md": {
    required: ["Purpose", "Confirmed Drift", "Open Questions", "Rebuild Risks", "Source Anchors"],
    anchorSections: ["Confirmed Drift", "Open Questions", "Rebuild Risks", "Source Anchors"],
  },
  "docs/prd/04-glossary.md": {
    required: ["Purpose", "Terms", "Source Anchors"],
    anchorSections: ["Source Anchors"],
  },
};

const SUBSYSTEM_RULE: DocRule = {
  required: ["Purpose", "Scope", "Component and Capability Map", "Contracts and Data", "Integrations", "Rebuild Notes", "Source Anchors"],
  anchorSections: ["Scope", "Component and Capability Map", "Contracts and Data", "Integrations", "Rebuild Notes", "Source Anchors"],
};
const REFERENCE_RULE: DocRule = { required: ["Purpose", "Reference", "Source Anchors"], anchorSections: ["Reference", "Source Anchors"] };
const BACKLOG_INDEX_RULE: DocRule = { required: ["Purpose", "Phase Map", "Usage Notes"], anchorSections: [] };
const BACKLOG_PHASE_RULE: DocRule = { required: ["Purpose", "Overview", "Source PRD Docs"], anchorSections: [] };
const REFERENCE_KEYWORDS = ["reference", "references", "api", "schema", "schemas", "config", "configuration", "contracts", "data-model", "data-models"];

/** Python `str.splitlines()`. */
function splitLines(text: string): string[] {
  if (text.length === 0) return [];
  const lines = text.split(/\r\n|[\n\r\v\f\x1c\x1d\x1e\x85\u2028\u2029]/);
  if (/(?:\r\n|[\n\r\v\f\x1c\x1d\x1e\x85\u2028\u2029])$/.test(text)) lines.pop();
  return lines;
}

/** Python `str.splitlines(keepends=True)`. */
function splitLinesKeepEnds(text: string): string[] {
  const out: string[] = [];
  const pattern = /\r\n|[\n\r\v\f\x1c\x1d\x1e\x85\u2028\u2029]/g;
  let start = 0;
  for (const match of text.matchAll(pattern)) {
    const end = match.index! + match[0].length;
    out.push(text.slice(start, end));
    start = end;
  }
  if (start < text.length) out.push(text.slice(start));
  return out;
}

/** Python text mode reads `\r\n` and `\r` as `\n`. */
function readTextFile(filePath: string): string {
  return readFileSync(filePath, "utf8").replace(/\r\n?/g, "\n");
}

/** `##` sections by title. A repeated title keeps its first place and its last body, as a Python dict does. */
export function parseSections(text: string): Map<string, string> {
  const sections = new Map<string, string[]>();
  let current: string | null = null;
  for (const line of splitLines(text)) {
    if (line.startsWith("## ")) {
      current = line.slice(3).trim();
      sections.set(current, []);
      continue;
    }
    if (current !== null) sections.get(current)!.push(line);
  }
  return new Map([...sections].map(([title, body]) => [title, body.join("\n").trim()]));
}

function hasAnchor(text: string): boolean {
  return ANCHOR_RE.test(text);
}

/**
 * Blank fenced code blocks and remove inline code spans, so the link rule
 * does not read code as a link. The line count stays the same.
 */
export function stripCodeRegions(text: string): string {
  const result: string[] = [];
  let inFence = false;
  let fenceMarker = "";
  for (const line of splitLinesKeepEnds(text)) {
    const stripped = line.trimStart();
    const match = FENCE_RE.exec(stripped);
    if (!inFence) {
      if (match) {
        inFence = true;
        fenceMarker = match[1]![0]!.repeat(match[1]!.length);
        result.push("\n");
        continue;
      }
    } else {
      // CommonMark: the closing fence uses the same character and is at least as long.
      if (match && match[1]![0] === fenceMarker[0] && match[1]!.length >= fenceMarker.length) {
        inFence = false;
        fenceMarker = "";
        result.push("\n");
        continue;
      }
      result.push("\n");
      continue;
    }
    result.push(line.replace(INLINE_CODE_RE, ""));
  }
  return result.join("");
}

/** False when a link target cannot be a file path, such as code that looks like a link. */
export function isPlausibleLinkTarget(target: string): boolean {
  if (target.includes(",")) return false;
  if (target.includes("...")) return false;
  if (target && (`'"`.includes(target[0]!) || `'"`.includes(target[target.length - 1]!))) return false;
  if (UNESCAPED_SPACE_RE.test(target)) return false;
  return true;
}

function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}

function isRelativeTo(candidate: string, base: string): boolean {
  const relative = path.relative(base, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

/** Python `Path.resolve()` without `strict`: follow links in the part that exists. */
function resolvePath(value: string): string {
  let existing = path.resolve(value);
  const rest: string[] = [];
  while (!existsSync(existing)) {
    const parent = path.dirname(existing);
    if (parent === existing) break;
    rest.unshift(path.basename(existing));
    existing = parent;
  }
  let real = existing;
  try {
    real = realpathSync(existing);
  } catch {
    // Keep the lexical path.
  }
  return path.join(real, ...rest);
}

function comparePathParts(left: string, right: string): number {
  const a = left.split(path.sep);
  const b = right.split(path.sep);
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    if (a[index] !== b[index]) return a[index]! < b[index]! ? -1 : 1;
  }
  return a.length - b.length;
}

function sortedChildren(directory: string): string[] {
  return readdirSync(directory).sort().map((name) => path.join(directory, name));
}

function isFile(target: string): boolean {
  try {
    return statSync(target).isFile();
  } catch {
    return false;
  }
}

function isDirectory(target: string): boolean {
  try {
    return statSync(target).isDirectory();
  } catch {
    return false;
  }
}

/** Markdown files under a folder, sorted as Python sorts paths. Symbolic links are skipped. */
function markdownFiles(root: string, excludePrefixes: readonly string[] = []): string[] {
  if (!existsSync(root)) return [];
  const excluded = excludePrefixes.map(resolvePath);
  const files: string[] = [];
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      // A symbolic link is skipped, so the link rules never read outside the project.
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith(".md")) files.push(full);
    }
  };
  if (isDirectory(root)) walk(root);
  return files
    .sort(comparePathParts)
    .filter((file) => !excluded.some((prefix) => isRelativeTo(resolvePath(file), prefix)));
}

class FindingList {
  readonly findings: DecompositionFinding[] = [];

  constructor(private readonly root: string) {}

  add(ruleId: DecompositionRuleId, target: string, message: string, line?: number): void {
    this.findings.push({
      ruleId,
      path: toPosix(path.relative(this.root, target)) || ".",
      ...(line !== undefined ? { line } : {}),
      message,
    });
  }
}

function classifyPrdDoc(relative: string): "core" | "misplaced-backlog" | "reference" | "subsystem" {
  if (relative in CORE_DOC_RULES) return "core";
  if (path.posix.basename(relative).toLowerCase().includes("backlog")) return "misplaced-backlog";
  const lowered = relative.toLowerCase();
  if (REFERENCE_KEYWORDS.some((keyword) => lowered.includes(keyword))) return "reference";
  return "subsystem";
}

function validateRequiredSections(file: string, sections: Map<string, string>, required: string[], ruleId: DecompositionRuleId, out: FindingList): void {
  for (const heading of required) {
    if (!sections.has(heading)) out.add(ruleId, file, `missing required section '## ${heading}'`);
  }
}

function validateAnchorSections(file: string, sections: Map<string, string>, anchorSections: string[], out: FindingList): void {
  for (const heading of anchorSections) {
    const body = sections.get(heading);
    if (body === undefined) continue;
    if (!hasAnchor(body)) out.add("decomposition.prd.anchor-missing", file, `section '## ${heading}' does not contain a code anchor`);
  }
}

function subsectionLines(sectionBody: string, heading: string): string[] | null {
  let currentHeading: string | null = null;
  const lines: string[] = [];
  let found = false;
  for (const line of splitLines(sectionBody)) {
    if (line.startsWith("### ")) {
      currentHeading = line.slice(4).trim();
      if (currentHeading === heading) found = true;
      continue;
    }
    if (currentHeading === heading) lines.push(line);
  }
  return found ? lines : null;
}

function significantLines(lines: string[]): string[] {
  return lines.map((line) => line.trim()).filter((line) => line && !line.startsWith("<!--"));
}

function validateArchiveRoot(archiveRoot: string, out: FindingList): void {
  if (!existsSync(archiveRoot)) return;
  if (!isDirectory(archiveRoot)) {
    out.add("decomposition.archive.not-directory", archiveRoot, ".make-docs/archive/prds must be a directory");
    return;
  }
  for (const entry of sortedChildren(archiveRoot)) {
    const name = path.basename(entry);
    if (name.startsWith(".")) continue;
    if (isFile(entry)) {
      out.add("decomposition.archive.loose-file", entry, ".make-docs/archive/prds must contain dated directories only");
      continue;
    }
    if (!isDirectory(entry)) {
      out.add("decomposition.archive.unexpected-entry", entry, "unexpected entry in .make-docs/archive/prds");
      continue;
    }
    if (!ARCHIVE_DIR_RE.test(name)) {
      out.add("decomposition.archive.folder-name", entry, "archive directories must use YYYY-MM-DD or YYYY-MM-DD-XX naming");
    }
  }
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function validatePrdStructure(root: string, out: FindingList): void {
  const prdRoot = path.join(root, "docs", "prd");
  if (!existsSync(prdRoot)) {
    out.add("decomposition.prd.root-missing", prdRoot, "missing docs/prd directory");
    return;
  }
  for (const name of ["00-index.md", "01-product-overview.md", "02-architecture-overview.md", "03-open-questions-and-risk-register.md", "04-glossary.md"]) {
    const file = path.join(prdRoot, name);
    if (!existsSync(file)) out.add("decomposition.prd.core-file-missing", file, "missing required core PRD file");
  }
  const seenPrefixes = new Map<number, string>();
  for (const child of sortedChildren(prdRoot)) {
    const name = path.basename(child);
    if (name.startsWith(".") || INSTRUCTION_FILES.has(name)) continue;
    if (name === "archive") {
      out.add("decomposition.prd.legacy-archive", child, "legacy archive namespace is no longer supported; use .make-docs/archive/prds/");
      continue;
    }
    if (isFile(child)) {
      if (path.extname(name) !== ".md") {
        out.add("decomposition.prd.root-non-markdown", child, "unexpected non-markdown file in docs/prd root");
        continue;
      }
      const match = ROOT_FILE_RE.exec(name);
      if (!match) {
        out.add("decomposition.prd.file-name", child, "root PRD file must use NN-slug.md naming");
        continue;
      }
      const prefix = Number(match[1]);
      if (seenPrefixes.has(prefix)) out.add("decomposition.prd.duplicate-prefix", child, `duplicate top-level PRD prefix ${pad2(prefix)}`);
      seenPrefixes.set(prefix, child);
      if (![0, 1, 2, 3, 4].includes(prefix) && !(prefix >= 5 && prefix <= 97)) {
        out.add("decomposition.prd.file-prefix-range", child, "top-level PRD prefix must be 05-97 or a fixed core number");
      }
      if (name.includes("backlog")) out.add("decomposition.prd.backlog-in-prd", child, "rebuild backlog files must live under docs/work, not docs/prd");
      continue;
    }
    if (isDirectory(child)) {
      const match = ROOT_DIR_RE.exec(name);
      if (!match) {
        out.add("decomposition.prd.folder-name", child, "PRD subfolders must use NN-slug naming");
        continue;
      }
      const prefix = Number(match[1]);
      if (seenPrefixes.has(prefix)) out.add("decomposition.prd.duplicate-prefix", child, `duplicate top-level PRD prefix ${pad2(prefix)}`);
      seenPrefixes.set(prefix, child);
      if (!(prefix >= 5 && prefix <= 97)) out.add("decomposition.prd.folder-prefix-range", child, "PRD subfolder prefix must be between 05 and 97");
      for (const nested of sortedChildren(child)) {
        if (isDirectory(nested)) {
          out.add("decomposition.prd.nested-too-deep", nested, "nested PRD directories deeper than one level are not allowed");
          continue;
        }
        if (path.extname(nested) !== ".md") {
          out.add("decomposition.prd.nested-non-markdown", nested, "nested PRD entries must be markdown files");
          continue;
        }
        if (!ROOT_FILE_RE.test(path.basename(nested))) out.add("decomposition.prd.nested-file-name", nested, "nested PRD files must use NN-slug.md naming");
      }
    }
  }
}

function validatePrdDocs(root: string, out: FindingList): void {
  const prdRoot = path.join(root, "docs", "prd");
  for (const file of markdownFiles(prdRoot, [path.join(prdRoot, "archive")])) {
    if (INSTRUCTION_FILES.has(path.basename(file))) continue;
    const sections = parseSections(readTextFile(file));
    const relative = toPosix(path.relative(root, file));
    const kind = classifyPrdDoc(relative);
    if (kind === "misplaced-backlog") continue;
    const rule = kind === "core" ? CORE_DOC_RULES[relative]! : kind === "reference" ? REFERENCE_RULE : SUBSYSTEM_RULE;
    validateRequiredSections(file, sections, rule.required, "decomposition.prd.section-missing", out);
    validateAnchorSections(file, sections, rule.anchorSections, out);
  }
}

/** The task lines that the shared work phase reader finds, by line number. */
function sharedReaderTasks(file: string): Map<number, PhaseTask> {
  return new Map(parseWorkPhase(file).tasks.map((task) => [task.line, task]));
}

/** Line numbers of the significant lines in each stage's Tasks subsection, in file order. */
function taskSubsectionLineNumbers(text: string): Map<string, number[]> {
  const byStage = new Map<string, number[]>();
  let stage: string | null = null;
  let subsection: string | null = null;
  splitLines(text).forEach((line, index) => {
    if (line.startsWith("## ")) {
      const title = line.slice(3).trim();
      stage = title.startsWith("Stage ") ? title : null;
      subsection = null;
      if (stage !== null) byStage.set(stage, []);
      return;
    }
    if (stage === null) return;
    if (line.startsWith("### ")) {
      subsection = line.slice(4).trim();
      return;
    }
    const trimmed = line.trim();
    if (subsection === "Tasks" && trimmed && !trimmed.startsWith("<!--")) byStage.get(stage)!.push(index + 1);
  });
  return byStage;
}

function validateWorkPhaseDoc(file: string, text: string, sections: Map<string, string>, out: FindingList): void {
  validateRequiredSections(file, sections, BACKLOG_PHASE_RULE.required, "decomposition.work.section-missing", out);
  const stageItems = [...sections].filter(([title]) => title.startsWith("Stage "));
  if (stageItems.length === 0) out.add("decomposition.work.stage-missing", file, "work phase must contain at least one '## Stage ...' section");
  const tasksByLine = sharedReaderTasks(file);
  const taskLineNumbers = taskSubsectionLineNumbers(text);
  let expectedTaskNumber = 1;
  const seenTaskNumbers = new Set<number>();
  for (const [stageTitle, stageBody] of stageItems) {
    for (const heading of ["Tasks", "Acceptance criteria", "Dependencies"]) {
      if (subsectionLines(stageBody, heading) === null) {
        out.add("decomposition.work.stage-subsection-missing", file, `stage '## ${stageTitle}' missing required subsection '### ${heading}'`);
      }
    }
    const taskLines = subsectionLines(stageBody, "Tasks");
    if (taskLines !== null) {
      const items = significantLines(taskLines);
      if (items.length === 0) out.add("decomposition.task-id.no-task", file, `stage '## ${stageTitle}' must include at least one task item`);
      const lineNumbers = taskLineNumbers.get(stageTitle) ?? [];
      items.forEach((item, index) => {
        const lineNumber = lineNumbers.length === items.length ? lineNumbers[index] : undefined;
        const task = lineNumber !== undefined ? tasksByLine.get(lineNumber) : undefined;
        if (task === undefined) {
          out.add("decomposition.task-id.line-format", file, `task item in '## ${stageTitle}' must use '- [ ] TN: ...' or '- [x] TN: ...': ${item}`, lineNumber);
          return;
        }
        const taskNumber = Number(task.id.slice(1));
        if (seenTaskNumbers.has(taskNumber)) out.add("decomposition.task-id.duplicate", file, `duplicate task id T${taskNumber}`, lineNumber);
        if (taskNumber !== expectedTaskNumber) {
          out.add("decomposition.task-id.sequence", file, `task item in '## ${stageTitle}' expected T${expectedTaskNumber} but found T${taskNumber}`, lineNumber);
        }
        seenTaskNumbers.add(taskNumber);
        expectedTaskNumber += 1;
      });
    }
    const acceptanceLines = subsectionLines(stageBody, "Acceptance criteria");
    if (acceptanceLines !== null) {
      const items = significantLines(acceptanceLines);
      if (items.length === 0) out.add("decomposition.acceptance.empty", file, `stage '## ${stageTitle}' must include at least one acceptance criterion`);
      for (const item of items) {
        if (ACCEPTANCE_CHECKBOX_RE.test(item)) {
          out.add("decomposition.acceptance.checkbox", file, `acceptance criteria in '## ${stageTitle}' must be plain bullets, not checkboxes: ${item}`);
        } else if (readTaskLabel(item) !== null) {
          out.add("decomposition.acceptance.task-id", file, `acceptance criteria in '## ${stageTitle}' must not use task ids: ${item}`);
        } else if (!item.startsWith("- ")) {
          out.add("decomposition.acceptance.bullet", file, `acceptance criteria in '## ${stageTitle}' must use plain '- ...' bullets: ${item}`);
        }
      }
    }
  }
}

function validateBacklog(root: string, out: FindingList): void {
  const workRoot = path.join(root, "docs", "work");
  if (!existsSync(workRoot)) {
    out.add("decomposition.work.root-missing", workRoot, "missing docs/work directory");
    return;
  }
  const entries = sortedChildren(workRoot).filter((entry) => {
    const name = path.basename(entry);
    return !name.startsWith(".") && !INSTRUCTION_FILES.has(name);
  });
  if (entries.length === 0) {
    out.add("decomposition.work.no-backlog", workRoot, "no work backlog directory found");
    return;
  }
  let validEntries = 0;
  for (const entry of entries) {
    if (isFile(entry)) {
      out.add("decomposition.work.loose-file", entry, "backlog entries must be directories named YYYY-MM-DD-w{W}-r{R}-<slug>");
      continue;
    }
    if (isDirectory(entry)) {
      if (!WORK_DIR_RE.test(path.basename(entry))) {
        out.add("decomposition.work.folder-name", entry, "work directories must use YYYY-MM-DD-w{W}-r{R}-<slug> naming");
        continue;
      }
      validEntries += 1;
      const indexFile = path.join(entry, "00-index.md");
      if (!isFile(indexFile)) {
        out.add("decomposition.work.index-missing", indexFile, "work directory must contain 00-index.md");
      } else {
        validateRequiredSections(indexFile, parseSections(readTextFile(indexFile)), BACKLOG_INDEX_RULE.required, "decomposition.work.section-missing", out);
      }
      let phaseFileCount = 0;
      for (const nested of sortedChildren(entry)) {
        const name = path.basename(nested);
        if (name.startsWith(".") || INSTRUCTION_FILES.has(name)) continue;
        if (nested === indexFile) continue;
        if (isDirectory(nested)) {
          out.add("decomposition.work.nested-folder", nested, "work directories must not contain nested directories");
          continue;
        }
        if (path.extname(name) !== ".md") {
          out.add("decomposition.work.non-markdown", nested, "work directory entries must be markdown files");
          continue;
        }
        if (!WORK_PHASE_FILE_RE.test(name)) {
          out.add("decomposition.work.phase-file-name", nested, "work phase files must use 01-<slug>.md style naming");
          continue;
        }
        phaseFileCount += 1;
        const text = readTextFile(nested);
        validateWorkPhaseDoc(nested, text, parseSections(text), out);
      }
      if (phaseFileCount === 0) out.add("decomposition.work.no-phase-file", entry, "work directory must contain at least one phase file using 01-<slug>.md naming");
      continue;
    }
    out.add("decomposition.work.unexpected-entry", entry, "unexpected entry in docs/work");
  }
  if (validEntries === 0) out.add("decomposition.work.no-valid-backlog", workRoot, "no valid work backlog directory found");
}

/**
 * The link rules for one folder: each relative link outside code must stay in
 * the project and point to something that exists. Exported for the ported tests.
 */
export function checkLinksInTree(
  treeRoot: string,
  resolvedProjectRoot: string,
  excludePrefixes: readonly string[] = [],
  findingRoot: string = resolvedProjectRoot,
): DecompositionFinding[] {
  const out = new FindingList(findingRoot);
  for (const file of markdownFiles(treeRoot, excludePrefixes)) {
    const text = stripCodeRegions(readTextFile(file));
    for (const match of text.matchAll(LINK_RE)) {
      const rawTarget = match[1]!;
      const target = rawTarget.trim();
      if (!target || target.startsWith("#") || target.includes("://") || target.startsWith("mailto:")) continue;
      if (!isPlausibleLinkTarget(target)) continue;
      const targetPath = target.split("#", 1)[0]!;
      const resolved = resolvePath(path.join(path.dirname(file), targetPath));
      if (!isRelativeTo(resolved, resolvedProjectRoot)) {
        out.add("decomposition.link.escapes-root", file, `link escapes repo root -> ${rawTarget}`);
        continue;
      }
      if (!existsSync(resolved)) out.add("decomposition.link.broken", file, `broken link -> ${rawTarget}`);
    }
  }
  return out.findings;
}

function validateLinks(root: string, out: FindingList): void {
  const prdRoot = path.join(root, "docs", "prd");
  const workRoot = path.join(root, "docs", "work");
  const resolvedRoot = resolvePath(root);
  out.findings.push(...checkLinksInTree(prdRoot, resolvedRoot, [path.join(prdRoot, "archive")], root));
  out.findings.push(...checkLinksInTree(workRoot, resolvedRoot, [], root));
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** `check decomposition`: every rule of the decompose-codebase output contract. Changes nothing. */
export function validateDecompositionOutput(targetRootInput: string): DecompositionValidationResult {
  const targetRoot = path.resolve(targetRootInput);
  if (!isDirectory(targetRoot)) throw new Error(`The project folder ${targetRoot} does not exist.`);
  const out = new FindingList(targetRoot);
  validatePrdStructure(targetRoot, out);
  validatePrdDocs(targetRoot, out);
  validateArchiveRoot(path.join(targetRoot, ".make-docs", "archive", "prds"), out);
  validateBacklog(targetRoot, out);
  validateLinks(targetRoot, out);
  const findings = out.findings;
  const byRule: Partial<Record<DecompositionRuleId, number>> = {};
  for (const finding of findings) byRule[finding.ruleId] = (byRule[finding.ruleId] ?? 0) + 1;
  const files = new Set(findings.map((finding) => finding.path)).size;
  return {
    schemaVersion: 1,
    operation: "decomposition.output.validate",
    targetRoot,
    status: findings.length === 0 ? "passed" : "failed",
    summary: findings.length === 0
      ? "The decomposition output follows every rule. Changed nothing."
      : `Found ${plural(findings.length, "finding")} in ${files} ${files === 1 ? "file or folder" : "files or folders"}. Changed nothing.`,
    totals: { findings: findings.length, files, byRule },
    rules: DECOMPOSITION_RULES,
    findings,
  };
}

/** The script's line for one finding: `<absolute path>: <message>`. Used by the side-by-side evidence. */
export function scriptFormFinding(result: Pick<DecompositionValidationResult, "targetRoot">, finding: DecompositionFinding): string {
  return `${finding.path === "." ? result.targetRoot : path.join(result.targetRoot, finding.path)}: ${finding.message}`;
}

/** Plain words for `check decomposition`: the totals first, then each finding with its rule ID. */
export function renderDecompositionValidation(result: DecompositionValidationResult): string[] {
  const lines = [`Decomposition output check: ${result.status}. ${result.summary}`, `Project: ${result.targetRoot}`];
  if (result.findings.length === 0) return lines;
  lines.push(`By rule: ${Object.entries(result.totals.byRule).map(([id, count]) => `${id} ${count}`).join(", ")}.`);
  // One heading for each file, in the order of its first finding. JSON keeps the check order.
  const byFile = new Map<string, DecompositionFinding[]>();
  for (const finding of result.findings) byFile.set(finding.path, [...(byFile.get(finding.path) ?? []), finding]);
  for (const [file, findings] of byFile) {
    lines.push("", file);
    for (const finding of findings) {
      lines.push(`  ${finding.ruleId}${finding.line !== undefined ? ` (line ${finding.line})` : ""}: ${finding.message}`);
    }
  }
  lines.push("", "Next: fix each finding, then run make-docs check decomposition again.");
  return lines;
}
