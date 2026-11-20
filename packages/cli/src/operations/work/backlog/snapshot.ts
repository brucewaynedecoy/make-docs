import { accessSync, constants, existsSync, lstatSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

import { parseDocument } from "yaml";

import { OperationError } from "../../types.js";
import { BACKLOG_RULES } from "./catalog.js";
import {
  BACKLOG_SNAPSHOT_SCHEMA_VERSION,
  BacklogSnapshotV1Schema,
  type BacklogCoordinateFacts,
  type BacklogDiagnostic,
  type BacklogSnapshotV1,
  type BacklogWorkRecordV1,
  type EvidenceReference,
  type LastUpdatedAtFact,
  type NullableSourcedBoolean,
  type NullableSourcedPhaseNumber,
  type NullableSourcedString,
  type SourcedCount,
  type WorkGitEvidence,
  type WorkPhaseFact,
  type WorkRelationshipFact,
  type WorkScope,
  type WorkSourceLinkFact,
  type WorkTaskFact,
} from "./schemas.js";

const RECORD_DIRECTORY = /^(\d{4}-\d{2}-\d{2})-w([1-9]\d*)-r(0|[1-9]\d*)(?:-|$)/i;
const PHASE_FILE = /^(0[1-9]|[1-9]\d)-.+\.md$/;
const TASK = /^- \[([ xX])\]\s+(?:(t[1-9]\d*):\s*)?(.+?)\s*$/;
const MARKDOWN_LINK = /\[[^\]]+\]\(([^)]+)\)/g;
const COMPLETE_STATUS = /^(?:complete|completed|closed)$/i;
const CHANGE_HISTORY_HEADING = /^(\d{4}-\d{2}-\d{2}) — (W[1-9]\d* R(?:0|[1-9]\d*))(?: P[1-9]\d*)?$/;
const CHANGE_HISTORY_FIELDS = [
  "Kind",
  "Affected scope",
  "Previous scope",
  "Replacement scope",
  "Rationale",
  "PRD decision",
  "Owner approval",
  "Source",
] as const;
const CHANGE_HISTORY_KINDS = new Set(["edit", "revision-phase", "pivot", "rebuild", "revision-wave"]);
const CHANGE_HISTORY_PRD_DECISIONS = new Set(["update-existing", "create", "link-only", "none"]);

type JsonObject = Record<string, unknown>;

interface GitCommandResult {
  status: number | null;
  stdout: string;
  stderr: string;
  errorCode: string | null;
}

export interface BacklogSnapshotSeams {
  now?: () => Date;
  runGit?: (cwd: string, args: string[]) => GitCommandResult;
}

interface ParsedFrontmatter {
  body: string;
  data: JsonObject | null;
  present: boolean;
  malformed: boolean;
  fieldLines: Map<string, number>;
}

interface RecordInventory {
  absolutePath: string;
  recordPath: string;
  scope: WorkScope;
  createdDate: string;
  directoryCoordinate: string;
  discoveredFiles: string[];
}

interface GitContext {
  state: "available" | "unavailable" | "denied" | "not-a-repository";
  revision: string | null;
  /** The target root's path inside the repository, with a trailing slash, or "" at the repository root. */
  prefix: string;
  run(cwd: string, args: string[]): GitCommandResult;
}

interface DateEvidenceResult {
  value: LastUpdatedAtFact;
  gitEvidence: WorkGitEvidence[];
  diagnostics: BacklogDiagnostic[];
  /** Working-tree status for the record's files, or null when Git status is unavailable. */
  statusFacts: { changed: string[]; untracked: Set<string> } | null;
}

/** Tracked and changed record files, or null when Git cannot prove either. */
interface FileCommitFacts {
  tracked: Set<string>;
  changed: Set<string>;
}

export class BacklogSnapshotError extends OperationError {
  readonly code = "BACKLOG-VAL-001";
  readonly ruleId = "BACKLOG-RULE-001";

  constructor(message: string, readonly sourceReason: "source-unavailable" | "source-denied" | "source-unsafe" = "source-unavailable") {
    super(message);
    this.name = "BacklogSnapshotError";
  }
}

function sourceFailureReason(error: unknown): BacklogSnapshotError["sourceReason"] {
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  return code === "EACCES" || code === "EPERM" ? "source-denied" : code === "ELOOP" ? "source-unsafe" : "source-unavailable";
}

function defaultGit(cwd: string, args: string[]): GitCommandResult {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    errorCode: result.error && "code" in result.error ? String(result.error.code) : null,
  };
}

function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}

function relativePath(root: string, absolutePath: string): string {
  return toPosix(path.relative(root, absolutePath));
}

function evidence(
  sourcePath: string,
  field: string | null = null,
  line: number | null = null,
  commit: string | null = null,
): EvidenceReference {
  return { path: sourcePath, line, field, commit };
}

function nullableString(value: string | null, source?: EvidenceReference): NullableSourcedString {
  return { value, evidence: source ? [source] : [] };
}

function nullableBoolean(value: boolean | null, sources: EvidenceReference[] = []): NullableSourcedBoolean {
  return { value, evidence: sources };
}

function count(value: number, sources: EvidenceReference[] = []): SourcedCount {
  return { value, evidence: sources };
}

function ruleFor(code: string) {
  const rule = BACKLOG_RULES.find((candidate) => candidate.diagnosticCode === code);
  if (!rule) throw new Error(`Unknown backlog diagnostic code: ${code}`);
  return rule;
}

function diagnostic(
  code: string,
  recordPath: string | null,
  sourcePath: string | null,
  line: number | null = null,
  detail?: string,
): BacklogDiagnostic {
  const rule = ruleFor(code);
  return {
    code,
    ruleId: rule.id,
    severity: rule.defaultSeverity,
    recordPath,
    path: sourcePath,
    line,
    message: detail ? `${rule.humanMeaning} ${detail}` : rule.humanMeaning,
    reason: rule.trigger,
    remediation: rule.safeNextAction,
  };
}

function uniqueDiagnostics(values: BacklogDiagnostic[]): BacklogDiagnostic[] {
  const seen = new Set<string>();
  return values.filter((entry) => {
    const key = [entry.code, entry.recordPath, entry.path, entry.line, entry.message].join("\0");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function resolveSafeTargetRoot(input: string): string {
  const targetRoot = path.resolve(input);
  try {
    const stat = lstatSync(targetRoot);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new BacklogSnapshotError(
        "The backlog target root must be one real, readable project directory. Symbolic-link roots are not accepted.",
        "source-unsafe",
      );
    }
    accessSync(targetRoot, constants.R_OK);
    realpathSync(targetRoot);
  } catch (error) {
    if (error instanceof BacklogSnapshotError) throw error;
    throw new BacklogSnapshotError(
      `The backlog target root cannot be read safely: ${targetRoot}. Select a readable project directory.`,
      sourceFailureReason(error),
    );
  }
  return targetRoot;
}

function assertInsideRoot(root: string, candidate: string, label: string): void {
  const relative = path.relative(root, candidate);
  if (relative === "" || relative === ".") return;
  if (relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative)) {
    throw new BacklogSnapshotError(`${label} escapes the selected project root.`, "source-unsafe");
  }
}

function assertNoSymlink(root: string, candidate: string, label: string): void {
  assertInsideRoot(root, candidate, label);
  let current = candidate;
  while (current !== root) {
    if (lstatSync(current).isSymbolicLink()) {
      throw new BacklogSnapshotError(`${label} passes through a symbolic link and cannot be inspected safely.`, "source-unsafe");
    }
    current = path.dirname(current);
  }
}

function discoverRecords(targetRoot: string): RecordInventory[] {
  const roots: Array<{ relative: string; scope: WorkScope }> = [
    { relative: "docs/work", scope: "live" },
    { relative: ".make-docs/archive/work", scope: "archived" },
  ];
  const records: RecordInventory[] = [];
  for (const root of roots) {
    const absoluteRoot = path.join(targetRoot, ...root.relative.split("/"));
    if (!existsSync(absoluteRoot)) continue;
    assertNoSymlink(targetRoot, absoluteRoot, `Backlog directory ${root.relative}`);
    if (!lstatSync(absoluteRoot).isDirectory()) continue;
    for (const entry of readdirSync(absoluteRoot, { withFileTypes: true })) {
      const match = RECORD_DIRECTORY.exec(entry.name);
      if (!match || !entry.isDirectory()) continue;
      const absolutePath = path.join(absoluteRoot, entry.name);
      assertNoSymlink(targetRoot, absolutePath, `Work record ${entry.name}`);
      accessSync(absolutePath, constants.R_OK);
      const recordPath = relativePath(targetRoot, absolutePath);
      const discoveredFiles = readdirSync(absolutePath, { withFileTypes: true })
        .filter((file) => file.isFile() && !file.isSymbolicLink() && file.name.endsWith(".md"))
        .map((file) => `${recordPath}/${file.name}`)
        .sort();
      records.push({
        absolutePath,
        recordPath,
        scope: root.scope,
        createdDate: match[1]!,
        directoryCoordinate: `W${Number(match[2])} R${Number(match[3])}`,
        discoveredFiles,
      });
    }
  }
  return records.sort((left, right) => left.recordPath.localeCompare(right.recordPath));
}

interface PlanDirectory {
  planPath: string;
  scope: WorkScope;
  directoryCoordinate: string;
}

/** Dated W/R plan directories. They feed coordinate facts only and never become work records. */
function discoverPlanDirectories(targetRoot: string): PlanDirectory[] {
  const roots: Array<{ relative: string; scope: WorkScope }> = [
    { relative: "docs/plans", scope: "live" },
    { relative: ".make-docs/archive/plans", scope: "archived" },
  ];
  const plans: PlanDirectory[] = [];
  for (const root of roots) {
    const absoluteRoot = path.join(targetRoot, ...root.relative.split("/"));
    if (!existsSync(absoluteRoot)) continue;
    assertNoSymlink(targetRoot, absoluteRoot, `Plan directory ${root.relative}`);
    if (!lstatSync(absoluteRoot).isDirectory()) continue;
    for (const entry of readdirSync(absoluteRoot, { withFileTypes: true })) {
      const match = RECORD_DIRECTORY.exec(entry.name);
      if (!match || !entry.isDirectory()) continue;
      plans.push({
        planPath: relativePath(targetRoot, path.join(absoluteRoot, entry.name)),
        scope: root.scope,
        directoryCoordinate: `W${Number(match[2])} R${Number(match[3])}`,
      });
    }
  }
  return plans.sort((left, right) => left.planPath.localeCompare(right.planPath));
}

function parseFrontmatter(markdown: string): ParsedFrontmatter {
  if (!markdown.startsWith("---\n")) {
    return { body: markdown, data: null, present: false, malformed: false, fieldLines: new Map() };
  }
  const end = markdown.indexOf("\n---\n", 4);
  if (end === -1) {
    return { body: markdown, data: null, present: true, malformed: true, fieldLines: new Map() };
  }
  const yaml = markdown.slice(4, end);
  const fieldLines = new Map<string, number>();
  for (const [index, line] of yaml.split("\n").entries()) {
    const match = /^(\s*)([A-Za-z_][A-Za-z0-9_]*):/.exec(line);
    if (match && match[1]!.length === 0) fieldLines.set(match[2]!, index + 2);
  }
  const document = parseDocument(yaml, { uniqueKeys: true });
  let data: JsonObject | null = null;
  try {
    const value = document.toJS() as unknown;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) data = value as JsonObject;
  } catch {
    // The partial reader will retain only fields that the YAML library exposed safely.
  }
  return {
    body: markdown.slice(end + 5),
    data,
    present: true,
    malformed: document.errors.length > 0 || data === null,
    fieldLines,
  };
}

function stringField(parsed: ParsedFrontmatter, key: string): string | null {
  const value = parsed.data?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function fieldEvidence(file: string, parsed: ParsedFrontmatter, key: string): EvidenceReference {
  return evidence(file, key, parsed.fieldLines.get(key) ?? null);
}

function section(body: string, name: string): { text: string; startLine: number } | null {
  const lines = body.split("\n");
  const index = lines.findIndex((line) => new RegExp(`^#{2,6}\\s+${name}\\s*$`, "i").test(line));
  if (index === -1) return null;
  const level = /^#+/.exec(lines[index]!)![0].length;
  let end = lines.length;
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const heading = /^(#+)\s+/.exec(lines[cursor]!);
    if (heading && heading[1]!.length <= level) {
      end = cursor;
      break;
    }
  }
  return { text: lines.slice(index + 1, end).join("\n"), startLine: index + 2 };
}

function phaseMapLinks(body: string): Array<{ raw: string; line: number }> {
  const found = section(body, "Phase Map");
  if (!found) return [];
  const links: Array<{ raw: string; line: number }> = [];
  for (const [offset, line] of found.text.split("\n").entries()) {
    for (const match of line.matchAll(MARKDOWN_LINK)) {
      const raw = match[1]!.split("#", 1)[0]!.trim();
      if (PHASE_FILE.test(path.posix.basename(raw))) {
        links.push({ raw, line: found.startLine + offset });
      }
    }
  }
  return links;
}

function safeLinkedPath(targetRoot: string, sourceFile: string, raw: string): string | null {
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith("//") || raw.includes("\\")) return null;
  const absolute = /^(?:docs|\.make-docs|packages)\//.test(raw)
    ? path.resolve(targetRoot, raw)
    : path.resolve(path.dirname(sourceFile), raw);
  const relative = path.relative(targetRoot, absolute);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return null;
  return relativePath(targetRoot, absolute);
}

function pathHasSymlink(targetRoot: string, candidate: string): boolean {
  try {
    assertNoSymlink(targetRoot, candidate, `Linked source ${relativePath(targetRoot, candidate)}`);
    return false;
  } catch {
    return true;
  }
}

function parseSourceLink(
  targetRoot: string,
  sourceFile: string,
  sourcePath: string,
  parsed: ParsedFrontmatter,
): { value: WorkSourceLinkFact | null; diagnostic: BacklogDiagnostic | null } {
  const source = parsed.data?.source;
  if (source === null || typeof source !== "object" || Array.isArray(source)) {
    return { value: null, diagnostic: null };
  }
  const raw = (source as JsonObject).path;
  if (typeof raw !== "string" || !raw.trim()) return { value: null, diagnostic: null };
  const sourceEvidence = evidence(sourcePath, "source.path", parsed.fieldLines.get("source") ?? null);
  const targetPath = safeLinkedPath(targetRoot, sourceFile, raw.trim());
  let state: WorkSourceLinkFact["state"] = "valid";
  if (targetPath === null) state = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? "unsupported" : "unsafe";
  else {
    const target = path.join(targetRoot, ...targetPath.split("/"));
    if (!existsSync(target)) state = "missing";
    else if (pathHasSymlink(targetRoot, target)) state = "unsafe";
  }
  const value: WorkSourceLinkFact = {
    sourcePath,
    targetPath,
    state,
    evidence: [sourceEvidence],
  };
  return {
    value,
    diagnostic:
      state === "valid"
        ? null
        : diagnostic("BACKLOG-VAL-009", sourcePath.slice(0, sourcePath.lastIndexOf("/")), sourcePath, sourceEvidence.line),
  };
}

function parseTasks(body: string, phasePath: string): WorkTaskFact[] {
  const tasks: WorkTaskFact[] = [];
  for (const [index, line] of body.split("\n").entries()) {
    const match = TASK.exec(line);
    if (!match) continue;
    const taskEvidence = evidence(phasePath, "task", index + 1);
    const completed = match[1]!.toLowerCase() === "x";
    tasks.push({
      id: nullableString(match[2]?.toUpperCase() ?? null, match[2] ? taskEvidence : undefined),
      phasePath,
      text: { value: match[3]!.trim(), evidence: [taskEvidence] },
      completed: nullableBoolean(completed, [taskEvidence]),
      recordedStatus: nullableString(completed ? "complete" : "open", taskEvidence),
    });
  }
  return tasks;
}

function parseRelationships(
  body: string,
  phasePath: string,
  heading: "Dependencies" | "Blockers",
): WorkRelationshipFact[] {
  const found = section(body, heading);
  if (!found) return [];
  const values: WorkRelationshipFact[] = [];
  for (const [offset, line] of found.text.split("\n").entries()) {
    const match = /^-\s+(.+?)\s*$/.exec(line);
    if (!match || /^(?:none|n\/a)[.!]?$/i.test(match[1]!)) continue;
    const itemEvidence = evidence(phasePath, heading.toLowerCase(), found.startLine + offset);
    const target = /\bW[1-9]\d* R(?:0|[1-9]\d*)(?: P[1-9]\d*)?\b/i.exec(match[1]!)?.[0] ?? null;
    values.push({
      text: { value: match[1]!, evidence: [itemEvidence] },
      target: nullableString(target, target ? itemEvidence : undefined),
      state: "recorded",
      evidence: [itemEvidence],
    });
  }
  return values;
}

function newestFileTime(targetRoot: string, files: string[]): { value: string; path: string } | null {
  let newest: { value: string; path: string; millis: number } | null = null;
  for (const file of files) {
    try {
      const millis = statSync(path.join(targetRoot, ...file.split("/"))).mtimeMs;
      if (!Number.isFinite(millis)) continue;
      if (!newest || millis > newest.millis || (millis === newest.millis && file.localeCompare(newest.path) < 0)) {
        newest = { value: new Date(millis).toISOString(), path: file, millis };
      }
    } catch {
      // An unreadable file is handled by the record reader. Date collection keeps partial facts.
    }
  }
  return newest && { value: newest.value, path: newest.path };
}

function gitContext(targetRoot: string, run: GitContext["run"]): GitContext {
  const top = run(targetRoot, ["rev-parse", "--show-toplevel"]);
  if (top.status !== 0) {
    const combined = `${top.stderr}\n${top.stdout}`;
    const state = top.errorCode === "ENOENT"
      ? "unavailable"
      : /permission denied|operation not permitted|access denied/i.test(combined)
        ? "denied"
        : "not-a-repository";
    return { state, revision: null, prefix: "", run };
  }
  const revision = run(targetRoot, ["rev-parse", "--verify", "HEAD"]);
  const prefixResult = run(targetRoot, ["rev-parse", "--show-prefix"]);
  return {
    state: "available",
    prefix: prefixResult.status === 0 ? toPosix(prefixResult.stdout.trim()) : "",
    revision: revision.status === 0 && /^[a-f0-9]{7,64}$/i.test(revision.stdout.trim())
      ? revision.stdout.trim().toLowerCase()
      : null,
    run,
  };
}

function changedRecordFiles(output: string, discoveredFiles: string[], prefix = ""): {
  changed: string[];
  untracked: Set<string>;
} {
  const changed: string[] = [];
  const untracked = new Set<string>();
  const entries = output.split("\0").filter(Boolean);
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]!;
    if (entry.length < 4) continue;
    const status = entry.slice(0, 2);
    const repositoryPath = toPosix(entry.slice(3));
    // Porcelain paths are repository-root relative; inventory paths are target-root relative.
    const candidate = prefix && repositoryPath.startsWith(prefix) ? repositoryPath.slice(prefix.length) : repositoryPath;
    if ((status.includes("R") || status.includes("C")) && entries[index + 1]) {
      // Porcelain v1 reverses rename/copy paths under -z: the current path is first.
      index += 1;
    }
    if (!discoveredFiles.includes(candidate)) continue;
    changed.push(candidate);
    if (status === "??") untracked.add(candidate);
  }
  return { changed: [...new Set(changed)].sort(), untracked };
}

function recordDates(
  targetRoot: string,
  inventory: RecordInventory,
  git: GitContext,
): DateEvidenceResult {
  const diagnostics: BacklogDiagnostic[] = [];
  const gitEvidence: WorkGitEvidence[] = [];
  const changed = git.state === "available"
    ? git.run(targetRoot, ["status", "--porcelain=v1", "-z", "--untracked-files=all", "--", ...inventory.discoveredFiles])
    : null;
  const knownStatus = changed?.status === 0
    ? changedRecordFiles(changed.stdout, inventory.discoveredFiles, git.prefix)
    : null;
  const statusFacts = knownStatus ?? { changed: [], untracked: new Set<string>() };
  const changedPaths = statusFacts.changed;
  if (changedPaths.length > 0) {
    const newest = newestFileTime(targetRoot, changedPaths);
    if (newest) {
      for (const file of changedPaths.sort()) {
        const modified = newestFileTime(targetRoot, [file]);
        gitEvidence.push({
          kind: statusFacts.untracked.has(file)
            ? "untracked-file"
            : "working-tree-change",
          path: file,
          commit: null,
          committedAt: null,
          modifiedAt: modified?.value ?? null,
          evidence: [evidence(file)],
        });
      }
      return {
        value: {
          value: newest.value,
          precision: "millisecond",
          source: "working-tree-mtime",
          evidence: [evidence(newest.path)],
          diagnosticCodes: [],
        },
        gitEvidence,
        diagnostics,
        statusFacts: knownStatus,
      };
    }
  }

  if (git.state === "available" && changed?.status === 0 && inventory.discoveredFiles.length > 0) {
    const history = git.run(targetRoot, [
      "log",
      "-1",
      "--format=%H%x00%cI%x00",
      "--name-only",
      "-z",
      "--",
      ...inventory.discoveredFiles,
    ]);
    if (history.status === 0 && history.stdout.trim()) {
      const [commit, committedAt, sourcePath = inventory.discoveredFiles[0]] = history.stdout
        .split("\0")
        .map((value) => value.trim())
        .filter(Boolean);
      if (commit && committedAt) {
        const value = new Date(committedAt).toISOString();
        gitEvidence.push({
          kind: "last-updated-commit",
          path: sourcePath!,
          commit: commit.toLowerCase(),
          committedAt: value,
          modifiedAt: null,
          evidence: [evidence(sourcePath!, null, null, commit.toLowerCase())],
        });
        return {
          value: {
            value,
            precision: "millisecond",
            source: "git-commit",
            evidence: [evidence(sourcePath!, null, null, commit.toLowerCase())],
            diagnosticCodes: [],
          },
          gitEvidence,
          diagnostics,
          statusFacts: knownStatus,
        };
      }
    }
  }

  diagnostics.push(diagnostic("BACKLOG-VAL-010", inventory.recordPath, inventory.discoveredFiles[0] ?? inventory.recordPath));
  gitEvidence.push({
    kind: "history-unavailable",
    path: inventory.discoveredFiles[0] ?? null,
    commit: null,
    committedAt: null,
    modifiedAt: null,
    evidence: inventory.discoveredFiles[0] ? [evidence(inventory.discoveredFiles[0])] : [],
  });
  const fileTime = newestFileTime(targetRoot, inventory.discoveredFiles);
  if (fileTime) {
    return {
      value: {
        value: fileTime.value,
        precision: "millisecond",
        source: "filesystem-mtime",
        evidence: [evidence(fileTime.path)],
        diagnosticCodes: ["BACKLOG-VAL-010"],
      },
      gitEvidence,
      diagnostics,
      statusFacts: knownStatus,
    };
  }
  diagnostics.push(diagnostic("BACKLOG-VAL-011", inventory.recordPath, inventory.recordPath));
  return {
    value: {
      value: inventory.createdDate,
      precision: "date",
      source: "created-at-fallback",
      evidence: [evidence(`${inventory.recordPath}/`, "directory name")],
      diagnosticCodes: ["BACKLOG-VAL-010", "BACKLOG-VAL-011"],
    },
    gitEvidence,
    diagnostics,
    statusFacts: knownStatus,
  };
}

function fileCommitFacts(
  targetRoot: string,
  inventory: RecordInventory,
  git: GitContext,
  statusFacts: DateEvidenceResult["statusFacts"],
): FileCommitFacts | null {
  if (git.state !== "available" || statusFacts === null || inventory.discoveredFiles.length === 0) return null;
  // Without --full-name, ls-files prints paths relative to the target root, like the inventory.
  const listed = git.run(targetRoot, ["ls-files", "-z", "--", ...inventory.discoveredFiles]);
  if (listed.status !== 0) return null;
  return {
    tracked: new Set(listed.stdout.split("\0").filter(Boolean).map(toPosix)),
    changed: new Set(statusFacts.changed),
  };
}

/** True only when every file is tracked and has no uncommitted change. */
function committedFact(facts: FileCommitFacts | null, files: string[]): NullableSourcedBoolean {
  if (facts === null || files.length === 0) return nullableBoolean(null);
  return nullableBoolean(
    files.every((file) => facts.tracked.has(file) && !facts.changed.has(file)),
    files.map((file) => evidence(file, "git status")),
  );
}

/**
 * Remove HTML comments with a comment-aware scan instead of one regular-expression pass.
 * An unterminated `<!--` runs to the end of the text, as in HTML. The scan repeats when a
 * removal joins two fragments into a new `<!--`, so the result never contains a comment opener.
 * `replace` lets a caller keep line breaks in place of each removed comment.
 */
export function stripHtmlComments(text: string, replace: (comment: string) => string = () => ""): string {
  let current = text;
  while (current.includes("<!--")) {
    let output = "";
    let cursor = 0;
    for (;;) {
      const start = current.indexOf("<!--", cursor);
      if (start === -1) {
        output += current.slice(cursor);
        break;
      }
      output += current.slice(cursor, start);
      const end = current.indexOf("-->", start + 4);
      const stop = end === -1 ? current.length : end + 3;
      output += replace(current.slice(start, stop));
      cursor = stop;
    }
    // Each pass removes at least one complete opener, so the loop always ends.
    current = output;
  }
  return current;
}

// Finds a live section: outside HTML comments and outside code. Code is literal text, so a `<!--` in a fenced block or an inline code span opens no comment, and a heading inside a fenced block starts no section. Comments are blanked with their line breaks kept, so line numbers stay exact.
function liveSection(body: string, name: string): { text: string; startLine: number } | null {
  const code: string[] = [];
  const keep = (text: string) => `\u0000${code.push(text) - 1}\u0000`;
  const blanked = stripHtmlComments(maskCode(body, keep), (comment) => comment.replace(/[^\n]/g, ""));
  // Look up headings while code is still masked, then return the section text with its code restored.
  const found = section(blanked, name);
  if (!found) return null;
  const restore = (text: string) => text.replace(/\u0000(\d+)\u0000/g, (_match, index: string) => code[Number(index)] ?? "");
  return { text: restore(found.text), startLine: found.startLine };
}

// Masks fenced code blocks and inline code spans outside HTML comments. Comment and fence state are tracked together, so a fence marker inside a comment is ignored and a comment delimiter inside code stays literal.
function maskCode(body: string, keep: (text: string) => string): string {
  let fence: string | null = null;
  let inComment = false;
  return body.split("\n").map((line) => {
    if (fence !== null) {
      // A closing fence is a run of the opener's character only, at least as long, then optional spaces or tabs.
      // A CRLF line keeps its `\r` after the split, so it is allowed before the end.
      const closer = /^ {0,3}(`{3,}|~{3,})[ \t]*\r?$/.exec(line);
      if (closer && closer[1]![0] === fence[0] && closer[1]!.length >= fence.length) fence = null;
      return keep(line);
    }
    if (!inComment) {
      const opener = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
      // A backtick fence's info string cannot contain a backtick, so such a line is inline code, not a fence.
      if (opener && !(opener[1]![0] === "`" && opener[2]!.includes("`"))) {
        fence = opener[1]!;
        return keep(line);
      }
    }
    let output = "";
    let cursor = 0;
    while (cursor < line.length) {
      if (inComment) {
        const close = line.indexOf("-->", cursor);
        if (close === -1) {
          output += line.slice(cursor);
          cursor = line.length;
          break;
        }
        output += line.slice(cursor, close + 3);
        cursor = close + 3;
        inComment = false;
        continue;
      }
      const tick = line.indexOf("`", cursor);
      const open = line.indexOf("<!--", cursor);
      if (open !== -1 && (tick === -1 || open < tick)) {
        output += line.slice(cursor, open + 4);
        cursor = open + 4;
        inComment = true;
        continue;
      }
      if (tick === -1) break;
      const span = inlineCodeEnd(line, tick);
      output += line.slice(cursor, tick) + (span === -1 ? line.slice(tick, nextNonTick(line, tick)) : keep(line.slice(tick, span)));
      cursor = span === -1 ? nextNonTick(line, tick) : span;
    }
    return output + line.slice(cursor);
  }).join("\n");
}

function nextNonTick(line: string, from: number): number {
  let cursor = from;
  while (line[cursor] === "`") cursor += 1;
  return cursor;
}

// Returns the index just past the inline code span that opens at `open`, or -1 when the backtick run is never closed by a run of the same length.
function inlineCodeEnd(line: string, open: number): number {
  const width = nextNonTick(line, open) - open;
  for (let search = open + width; search < line.length;) {
    const candidate = line.indexOf("`", search);
    if (candidate === -1) return -1;
    const after = nextNonTick(line, candidate);
    if (after - candidate === width) return after;
    search = after;
  }
  return -1;
}

function bodyLineOffset(markdown: string, body: string): number {
  return markdown.slice(0, markdown.length - body.length).split("\n").length - 1;
}

function closeoutNotesFact(body: string, phasePath: string, lineOffset: number): NullableSourcedBoolean {
  const found = liveSection(body, "Closeout Notes");
  if (!found) return nullableBoolean(false, [evidence(phasePath, "Closeout Notes")]);
  const content = found.text.trim();
  return nullableBoolean(
    content.length > 0 && !content.includes("{{"),
    [evidence(phasePath, "Closeout Notes", lineOffset + found.startLine - 1)],
  );
}

function nextPhaseFact(inventory: RecordInventory, linkedPhasePaths: string[] = []): NullableSourcedPhaseNumber {
  let highest: { number: number; file: string } | null = null;
  // Linked phase files count even when the linked file is missing, so the next number never collides.
  for (const file of [...inventory.discoveredFiles, ...linkedPhasePaths]) {
    const name = path.posix.basename(file);
    if (!PHASE_FILE.test(name)) continue;
    const number = Number(/^([0-9]+)/.exec(name)![1]);
    if (!highest || number > highest.number) highest = { number, file };
  }
  return highest
    ? { value: highest.number + 1, evidence: [evidence(highest.file, "phase file number")] }
    : { value: 1, evidence: [evidence(`${inventory.recordPath}/`, "no numbered phase file")] };
}

function changeHistoryDiagnostics(
  body: string,
  lineOffset: number,
  indexPath: string,
  recordPath: string,
  expectedWave: string,
): BacklogDiagnostic[] {
  const found = liveSection(body, "Change History");
  if (!found) return [];
  const lines = found.text.split("\n");
  const entries: Array<{ heading: string; level: number; line: number; fields: Map<string, string> }> = [];
  for (const [offset, line] of lines.entries()) {
    const fileLine = lineOffset + found.startLine + offset;
    const heading = /^(#{3,6})\s+(.+?)\s*$/.exec(line);
    if (heading) {
      entries.push({ heading: heading[2]!, level: heading[1]!.length, line: fileLine, fields: new Map() });
      continue;
    }
    const field = /^-\s+([^:]+):\s*(.*?)\s*$/.exec(line);
    if (field && entries.length > 0) entries.at(-1)!.fields.set(field[1]!.trim(), field[2]!);
  }
  const results: BacklogDiagnostic[] = [];
  const report = (line: number, detail: string) =>
    results.push(diagnostic("BACKLOG-VAL-017", recordPath, indexPath, line, detail));
  let previousDate: string | null = null;
  for (const entry of entries) {
    const label = `Entry "${entry.heading}"`;
    if (entry.level !== 3) {
      report(entry.line, `${label} uses a level-${entry.level} heading; write it as \`### ${entry.heading}\`.`);
    }
    const heading = CHANGE_HISTORY_HEADING.exec(entry.heading);
    const date = heading?.[1] ?? null;
    if (!heading || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
      report(entry.line, `${label} does not use the heading form \`YYYY-MM-DD — <coordinate>\`.`);
    } else if (heading[2] !== expectedWave) {
      report(entry.line, `${label} names ${heading[2]}, but this record is ${expectedWave}.`);
    }
    const missing = CHANGE_HISTORY_FIELDS.filter((name) => {
      const value = entry.fields.get(name);
      return value === undefined || value.trim() === "" || value.includes("{{");
    });
    if (missing.length > 0) report(entry.line, `${label} is missing ${missing.join(", ")}.`);
    const kind = entry.fields.get("Kind")?.replace(/`/g, "").trim();
    if (kind && !kind.includes("{{") && !CHANGE_HISTORY_KINDS.has(kind)) {
      report(entry.line, `${label} uses Kind "${kind}", which is not edit, revision-phase, pivot, rebuild, or revision-wave.`);
    }
    const decision = entry.fields.get("PRD decision")?.replace(/`/g, "").trim().split(/\s/, 1)[0];
    if (decision && !decision.includes("{{") && !CHANGE_HISTORY_PRD_DECISIONS.has(decision)) {
      report(entry.line, `${label} uses PRD decision "${decision}", which is not update-existing, create, link-only, or none.`);
    }
    if (date && heading) {
      if (previousDate && date < previousDate) report(entry.line, `${label} is dated before the entry above it; keep the newest entry last.`);
      previousDate = date;
    }
  }
  return results;
}

function coordinateFacts(inventory: RecordInventory[], plans: PlanDirectory[]): BacklogCoordinateFacts {
  const waves = new Map<number, { revisions: Set<number>; recordPaths: string[]; planPaths: string[]; scopes: WorkScope[] }>();
  const add = (coordinate: string, scope: WorkScope, item: { recordPath?: string; planPath?: string }) => {
    const match = /^W(\d+) R(\d+)$/.exec(coordinate);
    if (!match) return;
    const wave = Number(match[1]);
    const entry = waves.get(wave) ?? { revisions: new Set<number>(), recordPaths: [], planPaths: [], scopes: [] };
    entry.revisions.add(Number(match[2]));
    if (item.recordPath) entry.recordPaths.push(item.recordPath);
    if (item.planPath) entry.planPaths.push(item.planPath);
    entry.scopes.push(scope);
    waves.set(wave, entry);
  };
  for (const record of inventory) add(record.directoryCoordinate, record.scope, { recordPath: record.recordPath });
  for (const plan of plans) add(plan.directoryCoordinate, plan.scope, { planPath: plan.planPath });
  const facts = [...waves.entries()]
    .sort(([left], [right]) => left - right)
    .map(([wave, entry]) => {
      const revisions = [...entry.revisions].sort((left, right) => left - right);
      return {
        wave,
        revisions,
        nextRevision: revisions.at(-1)! + 1,
        archived: entry.scopes.every((scope) => scope === "archived"),
        recordPaths: entry.recordPaths.sort(),
        planPaths: entry.planPaths.sort(),
      };
    });
  return { highestWave: facts.at(-1)?.wave ?? null, waves: facts };
}

function emptyCloseout(recordPath: string, scope: WorkScope, tasks: WorkTaskFact[]) {
  const taskEvidence = tasks.flatMap((task) => task.completed.evidence);
  return {
    tasksComplete: nullableBoolean(tasks.length === 0 ? null : tasks.every((task) => task.completed.value === true), taskEvidence),
    closeoutAccepted: nullableBoolean(null),
    committed: nullableBoolean(null),
    closedHistory: nullableBoolean(null),
    released: nullableBoolean(null),
    archived: nullableBoolean(scope === "archived", [evidence(recordPath, "archive namespace")]),
  };
}

function unsupportedRecord(
  inventory: RecordInventory,
  dates: DateEvidenceResult,
): BacklogWorkRecordV1 {
  return {
    recordPath: inventory.recordPath,
    scope: inventory.scope,
    sourceShape: { state: "unsupported", standard: null, diagnosticCodes: ["BACKLOG-VAL-004"] },
    discoveredFiles: inventory.discoveredFiles,
    coordinate: nullableString(inventory.directoryCoordinate, evidence(inventory.recordPath, "directory name")),
    title: nullableString(null),
    recordedStatus: nullableString(null),
    createdAt: {
      value: inventory.createdDate,
      precision: "date",
      source: "directory-name",
      evidence: [evidence(inventory.recordPath, "directory name")],
      diagnosticCodes: [],
    },
    lastUpdatedAt: dates.value,
    phaseCount: count(0),
    nextPhase: { value: null, evidence: [] },
    taskCounts: { total: count(0), complete: count(0), incomplete: count(0), unknown: count(0) },
    phases: [],
    dependencies: [],
    blockers: [],
    closeout: null,
    sourceLinks: [],
    gitEvidence: [],
  };
}

function readRecord(
  targetRoot: string,
  inventory: RecordInventory,
  git: GitContext,
): { record: BacklogWorkRecordV1; diagnostics: BacklogDiagnostic[] } {
  const dates = recordDates(targetRoot, inventory, git);
  const diagnostics = [...dates.diagnostics];
  const commitFacts = fileCommitFacts(targetRoot, inventory, git, dates.statusFacts);
  const indexPath = `${inventory.recordPath}/00-index.md`;
  const indexAbsolute = path.join(targetRoot, ...indexPath.split("/"));
  if (!inventory.discoveredFiles.includes(indexPath)) {
    diagnostics.push(
      diagnostic("BACKLOG-VAL-002", inventory.recordPath, indexPath),
      diagnostic("BACKLOG-VAL-004", inventory.recordPath, indexPath),
    );
    return { record: unsupportedRecord(inventory, dates), diagnostics };
  }

  let indexText: string;
  try {
    indexText = readFileSync(indexAbsolute, "utf8");
  } catch {
    diagnostics.push(
      diagnostic("BACKLOG-VAL-002", inventory.recordPath, indexPath),
      diagnostic("BACKLOG-VAL-004", inventory.recordPath, indexPath),
    );
    return { record: unsupportedRecord(inventory, dates), diagnostics };
  }
  const parsedIndex = parseFrontmatter(indexText);
  if (!parsedIndex.present) {
    diagnostics.push(diagnostic("BACKLOG-VAL-004", inventory.recordPath, indexPath));
    return { record: unsupportedRecord(inventory, dates), diagnostics };
  }

  const indexCoordinate = stringField(parsedIndex, "coordinate");
  const title = stringField(parsedIndex, "title");
  const recordedStatus = stringField(parsedIndex, "status");
  const kind = stringField(parsedIndex, "kind");
  const validCoordinate = indexCoordinate !== null && /^W[1-9]\d* R(?:0|[1-9]\d*)$/.test(indexCoordinate);
  const supported = !parsedIndex.malformed && kind === "work" && validCoordinate && title !== null && recordedStatus !== null;
  if (!supported) diagnostics.push(diagnostic("BACKLOG-VAL-003", inventory.recordPath, indexPath));

  const linkedPhasePaths: string[] = [];
  const interpretedPhasePaths: string[] = [];
  const phases: WorkPhaseFact[] = [];
  const phaseLinks = phaseMapLinks(parsedIndex.body);
  for (const link of phaseLinks) {
    const resolved = safeLinkedPath(targetRoot, indexAbsolute, link.raw);
    if (resolved === null || !resolved.startsWith(`${inventory.recordPath}/`) || !PHASE_FILE.test(path.posix.basename(resolved))) {
      diagnostics.push(diagnostic("BACKLOG-VAL-006", inventory.recordPath, indexPath, link.line));
      continue;
    }
    if (!linkedPhasePaths.includes(resolved)) linkedPhasePaths.push(resolved);
    const absolute = path.join(targetRoot, ...resolved.split("/"));
    if (
      !inventory.discoveredFiles.includes(resolved) ||
      !existsSync(absolute) ||
      !lstatSync(absolute).isFile() ||
      lstatSync(absolute).isSymbolicLink()
    ) {
      diagnostics.push(diagnostic("BACKLOG-VAL-006", inventory.recordPath, indexPath, link.line));
      continue;
    }
    let phaseText: string;
    try {
      phaseText = readFileSync(absolute, "utf8");
    } catch {
      diagnostics.push(diagnostic("BACKLOG-VAL-006", inventory.recordPath, resolved));
      continue;
    }
    const parsedPhase = parseFrontmatter(phaseText);
    const coordinate = stringField(parsedPhase, "coordinate");
    const phaseTitle = stringField(parsedPhase, "title");
    const phaseStatus = stringField(parsedPhase, "status");
    const phaseKind = stringField(parsedPhase, "kind");
    const expectedWave = indexCoordinate ?? inventory.directoryCoordinate;
    const phaseNumber = Number(/^([0-9]+)/.exec(path.posix.basename(resolved))?.[1]);
    const validPhase =
      parsedPhase.present &&
      !parsedPhase.malformed &&
      phaseKind === "work" &&
      coordinate === `${expectedWave} P${phaseNumber}` &&
      phaseTitle !== null &&
      phaseStatus !== null;
    if (!validPhase) {
      diagnostics.push(diagnostic("BACKLOG-VAL-006", inventory.recordPath, resolved));
      continue;
    }
    const source = parseSourceLink(targetRoot, absolute, resolved, parsedPhase);
    if (source.diagnostic) diagnostics.push({ ...source.diagnostic, recordPath: inventory.recordPath });
    const tasks = parseTasks(parsedPhase.body, resolved);
    const dependencies = parseRelationships(parsedPhase.body, resolved, "Dependencies");
    const blockers = parseRelationships(parsedPhase.body, resolved, "Blockers");
    phases.push({
      phasePath: resolved,
      phaseMapLinked: true,
      coordinate: nullableString(coordinate, fieldEvidence(resolved, parsedPhase, "coordinate")),
      title: nullableString(phaseTitle, fieldEvidence(resolved, parsedPhase, "title")),
      recordedStatus: nullableString(phaseStatus, fieldEvidence(resolved, parsedPhase, "status")),
      tasks,
      dependencies,
      blockers,
      sourceLinks: source.value ? [source.value] : [],
      closeoutNotesPresent: closeoutNotesFact(parsedPhase.body, resolved, bodyLineOffset(phaseText, parsedPhase.body)),
      committed: committedFact(commitFacts, [resolved]),
    });
    interpretedPhasePaths.push(resolved);
  }

  const unlinkedCurrentPhasePaths: string[] = [];
  for (const file of inventory.discoveredFiles.filter((candidate) => PHASE_FILE.test(path.posix.basename(candidate)))) {
    if (linkedPhasePaths.includes(file)) continue;
    try {
      const candidate = parseFrontmatter(readFileSync(path.join(targetRoot, ...file.split("/")), "utf8"));
      if (candidate.present && stringField(candidate, "kind") === "work" && /^W[1-9]\d* R(?:0|[1-9]\d*) P[1-9]\d*$/.test(stringField(candidate, "coordinate") ?? "")) {
        unlinkedCurrentPhasePaths.push(file);
        diagnostics.push(diagnostic("BACKLOG-VAL-007", inventory.recordPath, file));
      }
    } catch {
      // Unreadable unlinked files do not become interpreted facts.
    }
  }

  const indexSource = parseSourceLink(targetRoot, indexAbsolute, indexPath, parsedIndex);
  if (indexSource.diagnostic) diagnostics.push({ ...indexSource.diagnostic, recordPath: inventory.recordPath });
  const tasks = phases.flatMap((phase) => phase.tasks);
  const taskEvidence = tasks.flatMap((task) => task.completed.evidence);
  const taskCounts = {
    total: count(tasks.length, taskEvidence),
    complete: count(tasks.filter((task) => task.completed.value === true).length, taskEvidence),
    incomplete: count(tasks.filter((task) => task.completed.value === false).length, taskEvidence),
    unknown: count(tasks.filter((task) => task.completed.value === null).length, taskEvidence),
  };
  if (
    recordedStatus !== null &&
    ((COMPLETE_STATUS.test(recordedStatus) && taskCounts.incomplete.value > 0) ||
      (!COMPLETE_STATUS.test(recordedStatus) && taskCounts.total.value > 0 && taskCounts.complete.value === taskCounts.total.value))
  ) {
    diagnostics.push(diagnostic("BACKLOG-VAL-008", inventory.recordPath, indexPath, parsedIndex.fieldLines.get("status") ?? null));
  }
  if (supported) {
    diagnostics.push(
      ...changeHistoryDiagnostics(
        parsedIndex.body,
        bodyLineOffset(indexText, parsedIndex.body),
        indexPath,
        inventory.recordPath,
        indexCoordinate!,
      ),
    );
  }

  const record: BacklogWorkRecordV1 = {
    recordPath: inventory.recordPath,
    scope: inventory.scope,
    sourceShape: {
      state: supported ? "supported" : "partial",
      standard: "current-frontmatter",
      diagnosticCodes: supported ? [] : ["BACKLOG-VAL-003"],
    },
    discoveredFiles: inventory.discoveredFiles,
    coordinate: nullableString(validCoordinate ? indexCoordinate : null, validCoordinate ? fieldEvidence(indexPath, parsedIndex, "coordinate") : undefined),
    title: nullableString(title, title ? fieldEvidence(indexPath, parsedIndex, "title") : undefined),
    recordedStatus: nullableString(recordedStatus, recordedStatus ? fieldEvidence(indexPath, parsedIndex, "status") : undefined),
    createdAt: {
      value: inventory.createdDate,
      precision: "date",
      source: "directory-name",
      evidence: [evidence(inventory.recordPath, "directory name")],
      diagnosticCodes: [],
    },
    lastUpdatedAt: dates.value,
    phaseCount: count(phases.length, [evidence(indexPath, "Phase Map")]),
    nextPhase: nextPhaseFact(inventory, linkedPhasePaths),
    taskCounts,
    phases,
    dependencies: phases.flatMap((phase) => phase.dependencies),
    blockers: phases.flatMap((phase) => phase.blockers),
    closeout: {
      ...emptyCloseout(inventory.recordPath, inventory.scope, tasks),
      committed: committedFact(commitFacts, [indexPath, ...linkedPhasePaths]),
    },
    sourceLinks: [indexSource.value, ...phases.flatMap((phase) => phase.sourceLinks)].filter((value): value is WorkSourceLinkFact => value !== null),
    gitEvidence: dates.gitEvidence,
  };

  // Keep the phase-map result explicit in diagnostics even though the public snapshot stores only its interpreted set.
  void unlinkedCurrentPhasePaths;
  return { record, diagnostics: uniqueDiagnostics(diagnostics) };
}

function projectIdentity(targetRoot: string): BacklogSnapshotV1["project"] {
  const configPath = ".make-docs/config.yaml";
  const absolute = path.join(targetRoot, ".make-docs", "config.yaml");
  let id: string | null = null;
  const readableManifest =
    existsSync(absolute) &&
    !lstatSync(absolute).isSymbolicLink() &&
    !pathHasSymlink(targetRoot, absolute);
  if (readableManifest) {
    try {
      const document = parseDocument(readFileSync(absolute, "utf8"), { uniqueKeys: true });
      const value = document.errors.length === 0 ? (document.toJS() as JsonObject | null) : null;
      id = typeof value?.projectId === "string" && value.projectId.trim() ? value.projectId.trim() : null;
    } catch {
      id = null;
    }
  }
  return { id, name: path.basename(targetRoot), manifestPath: readableManifest ? configPath : null };
}

function addDuplicateCoordinateDiagnostics(
  records: BacklogWorkRecordV1[],
  diagnostics: BacklogDiagnostic[],
): void {
  const byCoordinate = new Map<string, BacklogWorkRecordV1[]>();
  for (const record of records) {
    if (!record.coordinate.value) continue;
    const group = byCoordinate.get(record.coordinate.value) ?? [];
    group.push(record);
    byCoordinate.set(record.coordinate.value, group);
  }
  for (const [coordinate, group] of byCoordinate) {
    if (group.length < 2) continue;
    for (const record of group) {
      diagnostics.push(
        diagnostic(
          "BACKLOG-VAL-005",
          record.recordPath,
          record.coordinate.evidence[0]?.path ?? record.recordPath,
          record.coordinate.evidence[0]?.line ?? null,
          `The duplicate coordinate is ${coordinate}.`,
        ),
      );
    }
  }
}

export function buildBacklogSnapshot(
  targetRootInput: string,
  seams: BacklogSnapshotSeams = {},
): BacklogSnapshotV1 {
  const targetRoot = resolveSafeTargetRoot(targetRootInput);
  let inventory: RecordInventory[];
  let plans: PlanDirectory[];
  try {
    inventory = discoverRecords(targetRoot);
    plans = discoverPlanDirectories(targetRoot);
  } catch (error) {
    if (error instanceof BacklogSnapshotError) throw error;
    throw new BacklogSnapshotError(
      "The backlog record roots cannot be read safely. Check access to docs/work, docs/plans, and their .make-docs/archive directories, then retry.",
      sourceFailureReason(error),
    );
  }
  const run = seams.runGit ?? defaultGit;
  const git = gitContext(targetRoot, run);
  const results = inventory.map((record) => readRecord(targetRoot, record, git));
  const records = results.map((result) => result.record);
  const diagnostics = results.flatMap((result) => result.diagnostics);
  addDuplicateCoordinateDiagnostics(records, diagnostics);
  const gitFallbackUsed = diagnostics.some((entry) => entry.code === "BACKLOG-VAL-010");
  const gitCapabilityState = git.state === "available" && gitFallbackUsed ? "partial" : git.state;
  const gitDiagnosticCodes = gitCapabilityState === "available" ? [] : ["BACKLOG-VAL-010"];
  const snapshot: BacklogSnapshotV1 = {
    schemaVersion: BACKLOG_SNAPSHOT_SCHEMA_VERSION,
    generatedAt: (seams.now ?? (() => new Date()))().toISOString(),
    targetRoot,
    project: projectIdentity(targetRoot),
    gitRevision: git.revision,
    capabilities: {
      repositoryFiles: { state: "available", diagnosticCodes: [] },
      git: { state: gitCapabilityState, diagnosticCodes: gitDiagnosticCodes },
      store: { state: "not-used", diagnosticCodes: [] },
      sourceLinks: { state: "available", diagnosticCodes: [] },
    },
    recordCounts: {
      found: records.length,
      live: records.filter((record) => record.scope === "live").length,
      archived: records.filter((record) => record.scope === "archived").length,
    },
    coordinates: coordinateFacts(inventory, plans),
    records,
    diagnostics: uniqueDiagnostics(diagnostics).sort((left, right) =>
      [left.recordPath ?? "", left.code, left.path ?? "", left.line ?? 0]
        .join("\0")
        .localeCompare([right.recordPath ?? "", right.code, right.path ?? "", right.line ?? 0].join("\0")),
    ),
  };
  return BacklogSnapshotV1Schema.parse(snapshot);
}
