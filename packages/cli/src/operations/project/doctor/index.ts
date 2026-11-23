import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  canonicalInstallationPath,
  getActiveInstallationOperationId,
  getExistingInstallationCheckoutId,
  preparePlannedFileChange,
  readDeclarativeProjectId,
  readInstallationOperationBackups,
  sealInstallationOperation,
  withInstallationOperation,
} from "../../../store/installation-state";
import { writeTextFile } from "../../../utils";
import { OperationError } from "../../types";
import { applyTaskIdCase, scanTaskIdCase, type TaskIdCaseFindingKind, type TaskIdCaseMatch, type TaskIdCaseTextSkip } from "./task-id-case";

/**
 * Project doctor (PRD 39 R-DOCTOR). `check` reads only and returns a review
 * digest. `fix` writes only the changes that the digest names, through the
 * reviewed installation write path with its backup and conflict rules.
 *
 * Agent twin: `make-docs://system/reference/project-doctor.md`. A change to
 * either form needs a review of the other.
 */

export const DOCTOR_FIX_OPERATION = "project.doctor.fix";
/**
 * Router files are managed by Make Docs. Their task IDs are fixed upstream
 * and reseeded. Names compare without regard to letter case.
 */
const ROUTER_FILES = new Set(["agents.md", "claude.md"]);

export interface DoctorCheckDefinition {
  id: "task-id-case";
  scope: string;
  description: string;
  fix: string | null;
}

/** The one check list (R-DOCTOR-2). Later checks append here with their own design decision. */
export const DOCTOR_CHECKS: readonly DoctorCheckDefinition[] = Object.freeze([
  Object.freeze({
    id: "task-id-case" as const,
    scope: "Markdown files under docs/work/",
    description: "A task ID uses a lower-case t, such as t3. Make Docs writes task IDs with an upper-case T, such as T3.",
    fix: "Change the t to T. The number and all other text stay the same.",
  }),
]);

/** Accepted risks. Each one is shown in every check result and has a fixture. */
export const DOCTOR_NOTES: readonly string[] = Object.freeze([
  "A prose finding is a lower-case t and a number that stands alone as a word. It can be something that is not a task ID, such as a table label or a product name. Review each prose finding before you run the fix.",
  "The check does not find a task ID in a form it cannot tell apart from other text: inside a word or a snake_case name, after a dot, after a slash or dash that does not follow an ID, with four or more digits, in a range without a second t (t1-6), in emphasis written with underscores (_t3_), or inside an HTML tag. Text inside an HTML tag, such as id=\"t3\", is listed as left unchanged, also when the tag runs over more than one line.",
  "The edge of a skipped part (inline code, a link target, a URL, or an HTML tag) counts as a word edge. So text glued to such a part is found, such as t3 in word<span>t3</span>word, `code`t3, or <https://example.com>t3. Review these findings with the rest.",
]);

export interface DoctorFinding {
  check: "task-id-case";
  kind: TaskIdCaseFindingKind;
  file: string;
  line: number;
  column: number;
  current: string;
  replacement: string;
  lineText: string;
  fixedLineText: string;
}

export interface DoctorFileRead {
  path: string;
  sha256: string;
}

export interface DoctorSkippedFile {
  path: string;
  reason: "history-record" | "managed-router" | "symbolic-link" | "hard-link" | "not-utf8-text";
}

/** Task-ID-like text inside a file that the check leaves unchanged on purpose. */
export interface DoctorSkippedText extends TaskIdCaseTextSkip {
  file: string;
}

export interface DoctorCheckResult {
  schemaVersion: 1;
  targetRoot: string;
  status: "clean" | "findings";
  summary: string;
  totals: {
    findings: number;
    lines: number;
    filesWithFindings: number;
    filesRead: number;
    filesSkipped: number;
    filesExcluded: number;
    textSkipped: number;
    byCheck: Record<string, { taskLines: number; proseReferences: number }>;
  };
  checks: DoctorCheckDefinition[];
  exclusions: string[];
  notes: string[];
  findings: DoctorFinding[];
  skipped: DoctorSkippedFile[];
  skippedText: DoctorSkippedText[];
  files: DoctorFileRead[];
  reviewDigest: string;
  nextAction: string;
}

export interface DoctorChangedFile {
  path: string;
  changes: number;
  backup: string | null;
}

export interface DoctorFixResult {
  schemaVersion: 1;
  targetRoot: string;
  status: "fixed" | "unchanged";
  summary: string;
  reviewDigest: string;
  exclusions: string[];
  operationId: string | null;
  changedFiles: DoctorChangedFile[];
  undo: {
    method: "git" | "backup" | "none";
    instructions: string;
    command: string | null;
    /** Changed files that git does not track. Undo these from their backup. */
    notTrackedByGit: string[];
  };
  nextAction: string;
}

interface InternalScan {
  result: DoctorCheckResult;
  plans: Array<{ path: string; sha256: string; before: string; after: string; changes: number }>;
}

const sha256 = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");

function canonicalJson(value: unknown): string {
  const sort = (entry: unknown): unknown => Array.isArray(entry)
    ? entry.map(sort)
    : entry && typeof entry === "object"
      ? Object.fromEntries(Object.keys(entry as Record<string, unknown>).sort().map((key) => [key, sort((entry as Record<string, unknown>)[key])]))
      : entry;
  return JSON.stringify(sort(value));
}

/** Normalize repeated `--exclude` paths. Traversal, absolute, missing, and linked paths fail closed (R-DOCTOR-5). */
export function normalizeDoctorExclusions(root: string, raw: readonly string[]): string[] {
  const result = new Set<string>();
  for (const value of raw) {
    const fail = (why: string): never => {
      throw new OperationError(`The --exclude path ${JSON.stringify(value)} ${why} Nothing was read or changed.`);
    };
    if (typeof value !== "string" || value.trim() === "" || value !== value.trim()) fail("is empty or has spaces at its ends.");
    if (path.isAbsolute(value) || /^[A-Za-z]:/.test(value) || value.startsWith("~")) fail("must be relative to the project folder.");
    if (value.includes("\\")) fail("must use forward slashes.");
    const segments = value.replace(/^\.\//, "").replace(/\/+$/, "").split("/");
    if (segments.some((segment) => segment === ".." )) fail("must not use .. to leave a folder.");
    if (segments.some((segment) => segment === "" || segment === ".")) fail("has an empty or . part.");
    const onDisk: string[] = [];
    const absolute = path.resolve(root, ...segments);
    if (absolute !== root && !absolute.startsWith(root + path.sep)) fail("is outside the project.");
    // Read each parent folder and require an exact name match. A file system
    // that ignores letter case must not let `Docs/Work` pass for `docs/work`.
    let cursor = root;
    for (const segment of segments) {
      const parent = lstatSync(cursor, { throwIfNoEntry: false });
      const names = parent?.isDirectory() && !parent.isSymbolicLink() ? readdirSync(cursor) : [];
      // Compare in Unicode NFC form, so an accent written two ways still matches.
      const wanted = segment.normalize("NFC");
      const match = names.find((name) => name.normalize("NFC") === wanted);
      if (match === undefined) {
        fail(names.some((name) => name.normalize("NFC").toLowerCase() === wanted.toLowerCase())
          ? "does not match the exact letter case of a project path. Use the same upper and lower case as the folder or file name."
          : "does not exist in the project. Check the spelling, the letter case, and any accents.");
      }
      onDisk.push(match!);
      cursor = path.join(cursor, match!);
      if (lstatSync(cursor)!.isSymbolicLink()) fail("passes through a symbolic link.");
    }
    // Store the name as it is on disk, so the exclusion matches the walked paths.
    result.add(onDisk.join("/"));
  }
  return [...result].sort();
}

function isExcluded(relative: string, exclusions: readonly string[]): boolean {
  return exclusions.some((exclusion) => relative === exclusion || relative.startsWith(`${exclusion}/`));
}

function listMarkdown(root: string, relativeDir: string, exclusions: readonly string[], counts: { excluded: number }, skipped: DoctorSkippedFile[]): string[] {
  const absoluteDir = path.join(root, ...relativeDir.split("/"));
  assertRealFolder(absoluteDir, relativeDir);
  const files: string[] = [];
  for (const entry of readdirSync(absoluteDir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
    const relative = `${relativeDir}/${entry.name}`;
    const isMarkdown = entry.name.toLowerCase().endsWith(".md");
    if (isExcluded(relative, exclusions)) {
      counts.excluded += entry.isDirectory() ? countMarkdown(root, relative) : isMarkdown ? 1 : 0;
      continue;
    }
    if (entry.isSymbolicLink()) {
      // A link to a folder stops the run. The doctor never follows it.
      if (statSync(path.join(absoluteDir, entry.name), { throwIfNoEntry: false })?.isDirectory()) {
        throw new OperationError(`${relative} is a symbolic link to a folder. The doctor does not follow links. Nothing was read or changed.`);
      }
      if (isMarkdown) skipped.push({ path: relative, reason: "symbolic-link" });
      continue;
    }
    if (entry.isDirectory()) files.push(...listMarkdown(root, relative, exclusions, counts, skipped));
    else if (entry.isFile() && isMarkdown) files.push(relative);
  }
  return files;
}

function assertRealFolder(absolute: string, relative: string): void {
  if (lstatSync(absolute, { throwIfNoEntry: false })?.isSymbolicLink()) {
    throw new OperationError(`${relative} is a symbolic link. The doctor does not follow links. Nothing was read or changed.`);
  }
}

/** Quote one shell word with single quotes, so a copied command keeps the exact path. */
export function shellQuote(value: string): string {
  return /^[A-Za-z0-9_./:@%+=-]+$/.test(value) ? value : `'${value.replace(/'/g, "'\\''")}'`;
}

function countMarkdown(root: string, relativeDir: string): number {
  let count = 0;
  for (const entry of readdirSync(path.join(root, ...relativeDir.split("/")), { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) count += countMarkdown(root, `${relativeDir}/${entry.name}`);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) count += 1;
  }
  return count;
}

function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

function lineAt(text: string, line: number): string {
  const raw = text.split("\n")[line - 1] ?? "";
  return raw.endsWith("\r") ? raw.slice(0, -1) : raw;
}

function scanProject(projectRoot: string, rawExclusions: readonly string[]): InternalScan {
  const root = canonicalInstallationPath(projectRoot);
  if (!lstatSync(root, { throwIfNoEntry: false })?.isDirectory()) {
    throw new OperationError(`The project folder does not exist: ${root}.`);
  }
  const exclusions = normalizeDoctorExclusions(root, rawExclusions);
  const skipped: DoctorSkippedFile[] = [];
  const counts = { excluded: 0 };
  const scope = "docs/work";
  // Check each part of the scope path, so a link at docs or docs/work stops the run.
  let scopeStat: ReturnType<typeof lstatSync> | undefined;
  for (const part of ["docs", scope]) {
    scopeStat = lstatSync(path.join(root, ...part.split("/")), { throwIfNoEntry: false });
    assertRealFolder(path.join(root, ...part.split("/")), part);
    if (!scopeStat?.isDirectory()) { scopeStat = undefined; break; }
  }
  const candidates = scopeStat?.isDirectory() && !isExcluded(scope, exclusions)
    ? listMarkdown(root, scope, exclusions, counts, skipped)
    : [];
  if (scopeStat?.isDirectory() && isExcluded(scope, exclusions)) counts.excluded += countMarkdown(root, scope);
  const files: DoctorFileRead[] = [];
  const findings: DoctorFinding[] = [];
  const skippedText: DoctorSkippedText[] = [];
  const plans: InternalScan["plans"] = [];
  for (const relative of candidates) {
    // The scope is docs/work only, so .make-docs/archive/ is never read.
    if (ROUTER_FILES.has(path.posix.basename(relative).toLowerCase())) {
      skipped.push({ path: relative, reason: "managed-router" });
      continue;
    }
    const absolute = path.join(root, ...relative.split("/"));
    const stat = lstatSync(absolute);
    if (stat.isSymbolicLink() || !stat.isFile()) {
      skipped.push({ path: relative, reason: "symbolic-link" });
      continue;
    }
    // A hard-linked file shares its bytes with another path, maybe outside the project.
    if (stat.nlink > 1) {
      skipped.push({ path: relative, reason: "hard-link" });
      continue;
    }
    const bytes = readFileSync(absolute);
    const digest = sha256(bytes);
    files.push({ path: relative, sha256: digest });
    const text = bytes.toString("utf8");
    if (!Buffer.from(text, "utf8").equals(bytes)) {
      skipped.push({ path: relative, reason: "not-utf8-text" });
      continue;
    }
    const scan = scanTaskIdCase(text);
    if (scan.skipped) {
      skipped.push({ path: relative, reason: scan.skipped });
      continue;
    }
    for (const text of scan.skippedText) skippedText.push({ file: relative, ...text });
    if (scan.matches.length === 0) continue;
    const after = applyTaskIdCase(text, scan.matches);
    for (const match of scan.matches) findings.push(toFinding(relative, match, text, after));
    plans.push({ path: relative, sha256: digest, before: text, after, changes: scan.matches.length });
  }
  const lines = new Set(findings.map((finding) => `${finding.file}:${finding.line}`)).size;
  const taskLines = findings.filter((finding) => finding.kind === "task-line").length;
  const proseReferences = findings.length - taskLines;
  const reviewDigest = sha256(canonicalJson({
    schemaVersion: 1,
    checks: DOCTOR_CHECKS.map((check) => check.id),
    exclusions,
    files,
    skipped,
    skippedText,
    findings: findings.map(({ check, kind, file, line, column, current, replacement }) => ({ check, kind, file, line, column, current, replacement })),
  }));
  const excludeArgs = exclusions.map((exclusion) => ` --exclude ${shellQuote(exclusion)}`).join("");
  const clean = findings.length === 0;
  const result: DoctorCheckResult = {
    schemaVersion: 1,
    targetRoot: root,
    status: clean ? "clean" : "findings",
    summary: clean
      ? `No problems found in ${plural(files.length, "file")}. Nothing changed.`
      : `Found ${plural(findings.length, "lower-case task ID")} on ${plural(lines, "line")} in ${plural(plans.length, "file")}: ${plural(taskLines, "task line")} and ${plural(proseReferences, "prose reference")}. Nothing changed.`,
    totals: {
      findings: findings.length,
      lines,
      filesWithFindings: plans.length,
      filesRead: files.length,
      filesSkipped: skipped.length,
      filesExcluded: counts.excluded,
      textSkipped: skippedText.length,
      byCheck: { "task-id-case": { taskLines, proseReferences } },
    },
    checks: DOCTOR_CHECKS.map((check) => ({ ...check })),
    exclusions,
    notes: [...DOCTOR_NOTES],
    findings,
    skipped,
    skippedText,
    files,
    reviewDigest,
    nextAction: clean
      ? "No fix is needed."
      : `Review each finding. Then run: make-docs project doctor fix --review ${reviewDigest}${excludeArgs} --target-root ${shellQuote(root)}`,
  };
  return { result, plans };
}

function toFinding(file: string, match: TaskIdCaseMatch, before: string, after: string): DoctorFinding {
  return {
    check: "task-id-case",
    kind: match.kind,
    file,
    line: match.line,
    column: match.column,
    current: match.current,
    replacement: match.replacement,
    lineText: lineAt(before, match.line),
    fixedLineText: lineAt(after, match.line),
  };
}

/** `project doctor check`: reads only. */
export function checkProjectDoctor(projectRoot: string, exclusions: readonly string[] = []): DoctorCheckResult {
  return scanProject(projectRoot, exclusions).result;
}

function changedSince(reviewed: readonly DoctorFileRead[], current: readonly DoctorFileRead[]): string[] {
  const now = new Map(current.map((file) => [file.path, file.sha256]));
  const then = new Map(reviewed.map((file) => [file.path, file.sha256]));
  const changed = new Set<string>();
  for (const [file, digest] of then) if (now.get(file) !== digest) changed.add(file);
  for (const file of now.keys()) if (!then.has(file)) changed.add(file);
  return [...changed].sort();
}

/** Ask git whether this folder is inside a git work tree. Any git error means no. */
function hasGit(root: string): boolean {
  const result = spawnSync("git", ["-C", root, "rev-parse", "--is-inside-work-tree"], { encoding: "utf8", timeout: 10_000, env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } });
  return result.status === 0 && result.stdout.trim() === "true";
}

/** Quote one shell word with single quotes, always. */
function singleQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

/** The subset of paths that git tracks in this folder. Any git error means none. */
function gitTrackedFiles(root: string, files: readonly string[]): Set<string> {
  if (!hasGit(root) || files.length === 0) return new Set();
  const result = spawnSync("git", ["-C", root, "ls-files", "-z", "--", ...files], { encoding: "utf8", timeout: 10_000, env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } });
  if (result.status !== 0 || typeof result.stdout !== "string") return new Set();
  return new Set(result.stdout.split("\0").filter(Boolean));
}

/** `project doctor fix`: writes only the changes that the review digest names (R-DOCTOR-4). */
export function fixProjectDoctor(input: {
  projectRoot: string;
  review: string;
  exclusions?: readonly string[];
  reviewedFiles?: readonly DoctorFileRead[];
  storeRoot?: string;
  dryRun?: boolean;
  /** The calling surface names the option that lists the reviewed files. */
  caller?: "cli" | "mcp";
}): DoctorFixResult {
  const { result, plans } = scanProject(input.projectRoot, input.exclusions ?? []);
  const root = result.targetRoot;
  if (result.reviewDigest !== input.review) {
    const changed = input.reviewedFiles ? changedSince(input.reviewedFiles, result.files) : [];
    throw new OperationError(changed.length
      ? `The fix stopped. These files changed after the check: ${changed.join(", ")}. Nothing changed. Run make-docs project doctor check again and review the new digest.`
      : `The fix stopped. The review digest does not match the project now. A file changed after the check, or the --exclude options are not the same as in the check. Nothing changed. Run make-docs project doctor check again with the same --exclude options, and review the new digest. To have the fix name each changed file, ${input.caller === "mcp" ? "pass the check result's files list as reviewedFiles" : "pass the saved check result with --check-json"}.`);
  }
  const base = { schemaVersion: 1 as const, targetRoot: root, reviewDigest: result.reviewDigest, exclusions: result.exclusions };
  if (plans.length === 0) {
    return {
      ...base,
      status: "unchanged",
      summary: "No problems to fix. Nothing changed.",
      operationId: null,
      changedFiles: [],
      undo: { method: "none", instructions: "Nothing changed, so there is nothing to undo.", command: null, notTrackedByGit: [] },
      nextAction: "No fix is needed.",
    };
  }
  if (!readDeclarativeProjectId(root)) {
    throw new OperationError("The fix stopped. This folder has no Make Docs project ID in .make-docs/config.yaml. Run make-docs setup first. Nothing changed.");
  }
  if (!getExistingInstallationCheckoutId(root, input.storeRoot)) {
    throw new OperationError("The fix stopped. This checkout is not registered in the Make Docs Store. Run make-docs setup first. Nothing changed.");
  }
  if (input.dryRun) {
    return {
      ...base,
      status: "unchanged",
      summary: `Dry run. The fix would change ${plural(result.totals.findings, "task ID")} in ${plural(plans.length, "file")}. Nothing changed.`,
      operationId: null,
      changedFiles: plans.map((plan) => ({ path: plan.path, changes: plan.changes, backup: null })),
      undo: { method: "none", instructions: "Nothing changed, so there is nothing to undo.", command: null, notTrackedByGit: [] },
      nextAction: `Run the same fix command without --dry-run to apply it.`,
    };
  }
  const assertReviewedBytes = (plan: InternalScan["plans"][number]) => {
    const absolute = path.join(root, ...plan.path.split("/"));
    const stat = lstatSync(absolute, { throwIfNoEntry: false });
    if (!stat?.isFile() || stat.isSymbolicLink() || stat.nlink > 1 || sha256(readFileSync(absolute)) !== plan.sha256) {
      throw new OperationError(`The fix stopped. This file changed after the check: ${plan.path}. Run make-docs project doctor check again and review the new digest.`);
    }
  };
  plans.forEach(assertReviewedBytes);
  let operationId: string | null = null;
  withInstallationOperation(root, DOCTOR_FIX_OPERATION, () => {
    operationId = getActiveInstallationOperationId(root);
    const changes = plans.map((plan) => preparePlannedFileChange(
      root,
      plan.path,
      { kind: "file", content: plan.after },
      () => writeTextFile(path.join(root, ...plan.path.split("/")), plan.after),
    ));
    plans.forEach(assertReviewedBytes);
    sealInstallationOperation(root);
    for (const change of changes) change();
  }, { storeRoot: input.storeRoot });
  const backups = new Map(operationId
    ? readInstallationOperationBackups(root, operationId, input.storeRoot).map((entry) => [entry.relativePath, entry.backup])
    : []);
  const changedFiles = plans.map((plan) => ({ path: plan.path, changes: plan.changes, backup: backups.get(plan.path) ?? null }));
  const tracked = gitTrackedFiles(root, changedFiles.map((file) => file.path));
  const trackedFiles = changedFiles.filter((file) => tracked.has(file.path));
  const notTrackedByGit = changedFiles.filter((file) => !tracked.has(file.path)).map((file) => file.path);
  const backupNote = notTrackedByGit.length
    ? ` Git does not track ${plural(notTrackedByGit.length, "changed file")}: ${notTrackedByGit.join(", ")}. To undo ${notTrackedByGit.length === 1 ? "it" : "them"}, copy each backup file back over its changed file.`
    : "";
  return {
    ...base,
    status: "fixed",
    summary: `Changed ${plural(result.totals.findings, "task ID")} on ${plural(result.totals.lines, "line")} in ${plural(changedFiles.length, "file")}. No other text changed.`,
    operationId,
    changedFiles,
    undo: trackedFiles.length
      ? {
          method: "git",
          instructions: `Git tracks ${plural(trackedFiles.length, "changed file")}. Run git diff to see the change. To undo it, run the git command. That command also drops any earlier uncommitted edit in those files. Each backup file holds the exact bytes from before the fix.${backupNote}`,
          // -C names the project folder, so the command works from any current folder.
          command: `git -C ${singleQuote(root)} restore -- ${trackedFiles.map((file) => singleQuote(file.path)).join(" ")}`,
          notTrackedByGit,
        }
      : {
          method: "backup",
          instructions: `${hasGit(root) ? "Git does not track these files." : "This folder has no git."} To undo the fix, copy each backup file back over its changed file.`,
          command: null,
          notTrackedByGit,
        },
    nextAction: `Run make-docs project doctor check${result.exclusions.map((exclusion) => ` --exclude ${shellQuote(exclusion)}`).join("")} --target-root ${shellQuote(root)} to confirm that it finds nothing.`,
  };
}
