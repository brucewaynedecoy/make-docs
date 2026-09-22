import { accessSync, constants, existsSync, lstatSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

import { parseDocument } from "yaml";

import { OperationError } from "../../types.js";
import { BACKLOG_RULES } from "./catalog.js";
import {
  BacklogSnapshotV1Schema,
  type BacklogDiagnostic,
  type BacklogSnapshotV1,
  type BacklogWorkRecordV1,
  type EvidenceReference,
  type LastUpdatedAtFact,
  type NullableSourcedBoolean,
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
  run(cwd: string, args: string[]): GitCommandResult;
}

interface DateEvidenceResult {
  value: LastUpdatedAtFact;
  gitEvidence: WorkGitEvidence[];
  diagnostics: BacklogDiagnostic[];
}

export class BacklogSnapshotError extends OperationError {
  readonly code = "BACKLOG-VAL-001";
  readonly ruleId = "BACKLOG-RULE-001";

  constructor(message: string) {
    super(message);
    this.name = "BacklogSnapshotError";
  }
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
      );
    }
    accessSync(targetRoot, constants.R_OK);
    realpathSync(targetRoot);
  } catch (error) {
    if (error instanceof BacklogSnapshotError) throw error;
    throw new BacklogSnapshotError(
      `The backlog target root cannot be read safely: ${targetRoot}. Select a readable project directory.`,
    );
  }
  return targetRoot;
}

function assertInsideRoot(root: string, candidate: string, label: string): void {
  const relative = path.relative(root, candidate);
  if (relative === "" || relative === ".") return;
  if (relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative)) {
    throw new BacklogSnapshotError(`${label} escapes the selected project root.`);
  }
}

function assertNoSymlink(root: string, candidate: string, label: string): void {
  assertInsideRoot(root, candidate, label);
  let current = candidate;
  while (current !== root) {
    if (lstatSync(current).isSymbolicLink()) {
      throw new BacklogSnapshotError(`${label} passes through a symbolic link and cannot be inspected safely.`);
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
    return { state, revision: null, run };
  }
  const revision = run(targetRoot, ["rev-parse", "--verify", "HEAD"]);
  return {
    state: "available",
    revision: revision.status === 0 && /^[a-f0-9]{7,64}$/i.test(revision.stdout.trim())
      ? revision.stdout.trim().toLowerCase()
      : null,
    run,
  };
}

function changedRecordFiles(output: string, discoveredFiles: string[]): {
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
    const candidate = toPosix(entry.slice(3));
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
  const statusFacts = changed?.status === 0
    ? changedRecordFiles(changed.stdout, inventory.discoveredFiles)
    : { changed: [], untracked: new Set<string>() };
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
  };
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
    taskCounts,
    phases,
    dependencies: phases.flatMap((phase) => phase.dependencies),
    blockers: phases.flatMap((phase) => phase.blockers),
    closeout: emptyCloseout(inventory.recordPath, inventory.scope, tasks),
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
  try {
    inventory = discoverRecords(targetRoot);
  } catch (error) {
    if (error instanceof BacklogSnapshotError) throw error;
    throw new BacklogSnapshotError(
      "The backlog record roots cannot be read safely. Check access to docs/work and .make-docs/archive/work, then retry.",
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
    schemaVersion: 1,
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
    records,
    diagnostics: uniqueDiagnostics(diagnostics).sort((left, right) =>
      [left.recordPath ?? "", left.code, left.path ?? "", left.line ?? 0]
        .join("\0")
        .localeCompare([right.recordPath ?? "", right.code, right.path ?? "", right.line ?? 0].join("\0")),
    ),
  };
  return BacklogSnapshotV1Schema.parse(snapshot);
}
