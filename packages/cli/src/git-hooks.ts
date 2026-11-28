import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import { resolveBackupDestinationPlan } from "./backup-paths";
import { platform } from "./platform";
import { GIT_HOOK_RUN_ENV, GIT_HOOK_RUN_START, gitHookRunDir, removeGitHookRunState } from "./store/git-hook-runs";
import type { StoreDatabase } from "./store/database";
import { getExistingInstallationCheckoutId, withInstallationDatabase } from "./store/installation-state";
import { getStoreDatabasePath } from "./store/paths";

/**
 * W35 R0 P5: the git hooks that setup handles for one project (PRD 07
 * R-SETUP-CLI-15 to R-SETUP-CLI-24, PRD 38 R-HOOK-STATE).
 *
 * Make Docs adds one marked block to each of four hook files of the clone. The
 * block starts `make-docs project checkpoint` as a trigger run in the
 * background, so git does not wait, and it prints nothing (owner decisions
 * OD-P5-1 to OD-P5-5 of 2026-11-28). Only when the last background run of the
 * checkout did not end does the hook run the checkpoint in the foreground
 * (`store/git-hook-runs.ts`). It never fails or blocks a git action.
 *
 * The clone owns the block. Each work tree of a clone uses the same hook
 * files, so the Store keeps one record for the shared git folder of the clone,
 * with the exact block of each hook and the checkouts that selected the hooks.
 * `setup remove` takes a block out only when the last such checkout goes, and
 * only while the block still matches the record.
 *
 * Make Docs never replaces a block that a person changed, and never touches a
 * block that no record of this clone covers, unless the person gave the
 * explicit hook input. Then the plan names each such block before the write,
 * and the old block text goes into a backup that the result names. A record of
 * a clone at another folder is taken over only by the same input, and
 * `setup remove` never takes one over.
 *
 * This module sets no machine-wide git hooks path, and it knows no hook
 * manager by name.
 */

export const GIT_HOOK_NAMES = ["post-commit", "post-merge", "post-rewrite", "post-checkout"] as const;
export type GitHookName = (typeof GIT_HOOK_NAMES)[number];

/** The version of the block text. A change of the block text raises it. */
export const GIT_HOOK_BLOCK_VERSION = 2;

/** How a hook runs the checkpoint, as the setup result and the Store record name it. */
export const GIT_HOOK_RUN_MODE = "background";
/** What a hook does when the last background run of the checkout did not end. */
export const GIT_HOOK_RUN_FALLBACK = "foreground";

/** A person sets this variable to see the error output of a hook. */
export const GIT_HOOK_DEBUG_ENV = "MAKE_DOCS_HOOK_DEBUG";

/** The operation name of the clone-owned record in `tool_operations` (PRD 38 R-HOOK-STATE-1). */
export const GIT_HOOK_RECORD_OPERATION = "setup.git-hooks.receipt-current";
export const GIT_HOOK_RECORD_KEY_PREFIX = "git-hooks:";

/**
 * The marks of git in the middle of an action. The hooks after a commit and
 * after a branch change do nothing while one of them is in the git folder of
 * the work tree. The hooks after a merge and after a rewrite do not read them.
 */
export const GIT_HOOK_STATE_MARKS = ["rebase-merge", "rebase-apply", "MERGE_HEAD", "CHERRY_PICK_HEAD", "BISECT_LOG"] as const;

/** The first line of a hook file that Make Docs creates. */
export const GIT_HOOK_NEW_FILE_FIRST_LINE = "#!/bin/sh\n";

/** A hook file is a shell script when its first line names one of these shells, directly or through `env`. */
const SHELL_FIRST_LINE = /^#!\s*(?:\/usr\/bin\/env\s+(?:-S\s+)?|(?:\/[^\s/]+)*\/)(?:sh|bash|dash|ksh|zsh)(?:\s|$)/;

export const GIT_HOOK_EVENT: Record<GitHookName, "commit" | "branch-change"> = {
  "post-commit": "commit",
  "post-merge": "commit",
  "post-rewrite": "commit",
  "post-checkout": "branch-change",
};

const HOOK_WHEN: Record<GitHookName, string> = {
  "post-commit": "after a commit",
  "post-merge": "after a merge",
  "post-rewrite": "after a rewrite of commits",
  "post-checkout": "after a branch change",
};

export function gitHookStartMarker(hook: GitHookName): string {
  return `# >>> make-docs git hook: ${hook} >>>`;
}

export function gitHookEndMarker(hook: GitHookName): string {
  return `# <<< make-docs git hook: ${hook} <<<`;
}

/** The checkpoint call of a hook, as the review and the block name it. */
export function gitHookCheckpointCommand(hook: GitHookName): string {
  return `make-docs project checkpoint --event ${GIT_HOOK_EVENT[hook]}`;
}

/** A path with forward slashes, which a POSIX shell and git accept on each platform. */
function slashPath(target: string): string {
  return target.split(path.sep).join("/");
}

/** One word of POSIX shell text, in single quotes. */
function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

export interface GitHookCommand {
  /** The full path of the `node` program that ran setup. */
  nodePath: string;
  /** The full path of the Make Docs command file that setup ran. */
  commandFile: string;
}

/** The command that this process runs as, for the recorded path of the block. */
export function currentGitHookCommand(): GitHookCommand {
  const real = (target: string) => {
    try { return realpathSync.native(target); } catch { return path.resolve(target); }
  };
  return { nodePath: slashPath(real(process.execPath)), commandFile: slashPath(real(process.argv[1] ?? "")) };
}

/**
 * The exact block of one hook. It is POSIX shell text only, because git runs a
 * hook with `sh` on each platform. It runs in a subshell at the top of the hook
 * file, so it changes no variable and no folder of the script, it does not read
 * the input of the hook, and an `exec` or an `exit` further down cannot skip it.
 *
 * The command order: the block runs the recorded command first, which is the
 * `node` program and the Make Docs command file of the version that wrote the
 * block. That version knows the events, the background start, and the waits of a git hook. Only
 * when the recorded file or the recorded `node` is gone does the block run
 * `make-docs` from PATH. So an older `make-docs` that is still on PATH cannot
 * run in place of the version that wrote the block.
 *
 * The run mode: the block sets one variable, `MAKE_DOCS_GIT_HOOK_RUN=start`, and runs the checkpoint command.
 * The command itself then starts the checkpoint as a process of its own and returns at once, with no output. The
 * shell text starts no background job: `nohup`, `setsid`, and `disown` are not on each platform, and a job of
 * the hook shell stays in the process group of git. The block still prints what the command prints, which is
 * something only in the foreground fallback.
 */
export function renderGitHookBlock(hook: GitHookName, input: GitHookCommand & { projectFolders: readonly string[] }): string {
  const event = GIT_HOOK_EVENT[hook];
  const folders = [...new Set(input.projectFolders)].sort();
  const lines = [
    gitHookStartMarker(hook),
    `# Make Docs wrote this block (version ${GIT_HOOK_BLOCK_VERSION}). It runs \`${gitHookCheckpointCommand(hook)}\` ${HOOK_WHEN[hook]}.`,
    "# It starts the checkpoint in the background and prints nothing, so git does not wait. It never fails or blocks git.",
    `# Only when the last background run did not end does it run the checkpoint in the foreground. ${GIT_HOOK_DEBUG_ENV}=1 shows the errors of such a run.`,
    "# Do not edit it. `make-docs setup remove` takes it out only while it is unchanged.",
    "(",
    "  set +e +u",
  ];
  if (hook === "post-checkout") lines.push("  [ \"${3:-}\" = 1 ] || exit 0");
  lines.push(
    "  md_top=$(git rev-parse --show-toplevel 2>/dev/null)",
    "  [ -n \"$md_top\" ] || exit 0",
  );
  if (hook === "post-commit" || hook === "post-checkout") {
    lines.push(
      "  md_git=$(git rev-parse --absolute-git-dir 2>/dev/null)",
      `  for md_mark in ${GIT_HOOK_STATE_MARKS.join(" ")}; do`,
      "    if [ -e \"$md_git/$md_mark\" ]; then exit 0; fi",
      "  done",
    );
  }
  lines.push(
    `  md_debug=\${${GIT_HOOK_DEBUG_ENV}:-}`,
    `  md_node=${shellQuote(input.nodePath)}`,
    `  md_file=${shellQuote(input.commandFile)}`,
    "  md_cmd=$(command -v make-docs 2>/dev/null)",
    "  md_node_dir=${md_node%/*}",
    "  if command -v cygpath >/dev/null 2>&1; then md_node_dir=$(cygpath -u \"$md_node_dir\" 2>/dev/null); fi",
    "  if [ -n \"$md_node_dir\" ] && [ -d \"$md_node_dir\" ]; then PATH=$PATH:$md_node_dir; fi",
    "  md_run() {",
    "    if [ -f \"$md_file\" ] && [ -x \"$md_node\" ]; then \"$md_node\" \"$md_file\" \"$@\"",
    "    elif [ -n \"$md_cmd\" ]; then \"$md_cmd\" \"$@\"",
    "    else",
    "      if [ -n \"$md_debug\" ]; then echo 'make-docs git hook: no make-docs command at the recorded path and none on PATH.' >&2; fi",
    "      return 127",
    "    fi",
    "  }",
    `  export ${GIT_HOOK_RUN_ENV}=${GIT_HOOK_RUN_START}`,
    `  for md_folder in ${folders.map(shellQuote).join(" ")}; do`,
    "    md_root=$md_top",
    "    [ \"$md_folder\" = . ] || md_root=$md_top/$md_folder",
    "    [ -f \"$md_root/.make-docs/config.yaml\" ] || continue",
    "    if [ -n \"$md_debug\" ]; then",
    `      md_out=$(md_run project checkpoint --event ${event} --target-root "$md_root")`,
    "    else",
    `      md_out=$(md_run project checkpoint --event ${event} --target-root "$md_root" 2>/dev/null)`,
    "    fi",
    "    md_status=$?",
    "    if [ \"$md_status\" = 0 ] && [ -n \"$md_out\" ]; then printf '%s\\n' \"$md_out\"; fi",
    "  done",
    "  exit 0",
    ") </dev/null || :",
    gitHookEndMarker(hook),
    "",
  );
  return lines.join("\n");
}

export function sha256Text(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/* ------------------------------------------------------------------------ */
/* The hook files                                                           */
/* ------------------------------------------------------------------------ */

export interface GitHookFile {
  name: GitHookName;
  /** The full path of the hook file. */
  path: string;
  exists: boolean;
  /** The bytes of the file as text, or null when the file does not exist. */
  text: string | null;
  /** False for an existing file with no executable mode, on a platform with file modes. */
  executable: boolean;
  /** The Make Docs block in the file, from its first marker to the line end after its last marker, or null. */
  block: string | null;
  /** Where the block starts in `text`. */
  blockStart: number;
}

export interface GitHookInspection {
  /** `ready`: the four hook files can take the block. `refused`: one clear reason, and no change. `unavailable`: no git work tree. */
  status: "ready" | "refused" | "unavailable";
  reason: string | null;
  /** The top folder of the work tree. */
  top: string | null;
  /** The shared git folder of the clone, which each work tree of the clone gives. */
  gitCommonDir: string | null;
  hooksDir: string | null;
  /** The Make Docs project folder, from the top folder of the work tree. `.` is the top folder. */
  projectFolder: string | null;
  /** The top folder of each work tree that git lists for this clone. */
  worktrees: string[];
  files: GitHookFile[];
}

interface GitRun { status: number | null; stdout: string }

function git(cwd: string, args: string[]): GitRun {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", windowsHide: true });
  if (result.error) return { status: null, stdout: "" };
  return { status: result.status, stdout: result.stdout ?? "" };
}

function realNative(target: string): string {
  try { return realpathSync.native(target); } catch { return path.resolve(target); }
}

/** Find the Make Docs block of one hook in the text of a hook file. `malformed` when the markers do not form one block. */
export function findGitHookBlock(text: string, hook: GitHookName): { block: string; start: number } | "malformed" | null {
  const startMarker = gitHookStartMarker(hook);
  const endMarker = gitHookEndMarker(hook);
  const first = text.indexOf(startMarker);
  const last = text.indexOf(endMarker);
  if (first === -1 && last === -1) return null;
  if (first === -1 || last === -1 || last < first) return "malformed";
  if (text.indexOf(startMarker, first + 1) !== -1 || text.indexOf(endMarker, last + 1) !== -1) return "malformed";
  // The marker starts its line.
  if (first > 0 && text[first - 1] !== "\n") return "malformed";
  let end = last + endMarker.length;
  if (text.startsWith("\r\n", end)) end += 2;
  else if (text[end] === "\n") end += 1;
  return { block: text.slice(first, end), start: first };
}

/**
 * True for a script with two languages: its first lines are shell text that starts another program on the same
 * file, such as `exec node "$0" "$@"`, and the rest is text for that program. The mark is a line that is not a
 * comment and holds both the word `exec` and `$0` as one whole word (also as `"$0"` and `${0}`). A line that
 * only builds another path from `$0`, such as `exec "$(dirname "$0")/run"`, starts another file and is plain shell.
 */
export function startsAnotherProgramOnItself(text: string): boolean {
  return text.split("\n").some((line) => {
    const trimmed = line.trim();
    return !trimmed.startsWith("#") && /(^|[^A-Za-z0-9_])exec([^A-Za-z0-9_]|$)/.test(trimmed) && /(^|\s)["']?\$(0|\{0\})["']?(\s|;|$)/.test(trimmed);
  });
}

function refusal(inspection: Omit<GitHookInspection, "status" | "reason">, reason: string): GitHookInspection {
  return { ...inspection, status: "refused", reason: `${reason} Make Docs changed no hook file.` };
}

/**
 * Read the git facts and the four hook files of the work tree that holds
 * `projectRoot`. It changes nothing. It refuses, with one reason, when another
 * tool owns the hooks: a hooks path is set, the hooks folder or a hook file is
 * a symbolic link, or a hook file is not a shell script.
 */
export function inspectGitHooks(projectRoot: string): GitHookInspection {
  const none = { top: null, gitCommonDir: null, hooksDir: null, projectFolder: null, worktrees: [] as string[], files: [] as GitHookFile[] };
  if (!existsSync(projectRoot)) return { ...none, status: "unavailable", reason: "This project is not in a git work tree, so it has no git hooks." };
  const root = realNative(projectRoot);
  const topRun = git(root, ["rev-parse", "--show-toplevel"]);
  if (topRun.status !== 0 || topRun.stdout.trim() === "") {
    return { ...none, status: "unavailable", reason: topRun.status === null ? "The git command was not found, so Make Docs can install no git hook." : "This project is not in a git work tree, so it has no git hooks." };
  }
  const top = realNative(path.resolve(root, topRun.stdout.trim()));
  const relative = path.relative(top, root);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return { ...none, status: "unavailable", reason: "The project folder is not inside the git work tree that git reports." };
  }
  const projectFolder = relative === "" ? "." : slashPath(relative);
  const gitCommonDir = realNative(path.resolve(root, git(root, ["rev-parse", "--git-common-dir"]).stdout.trim()));
  const hooksRun = git(root, ["rev-parse", "--git-path", "hooks"]).stdout.trim();
  const defaultHooksDir = path.join(gitCommonDir, "hooks");
  const worktrees = git(root, ["worktree", "list", "--porcelain"]).stdout.split("\n")
    .filter((line) => line.startsWith("worktree "))
    .map((line) => line.slice("worktree ".length).replace(/\r$/, ""))
    .filter((folder) => existsSync(folder))
    .map((folder) => realNative(folder));
  const base = { top, gitCommonDir, hooksDir: defaultHooksDir, projectFolder, worktrees, files: [] as GitHookFile[] };

  // Check 1: a hooks path is set, in any scope.
  const setting = git(root, ["config", "--show-scope", "--get-all", "core.hooksPath"]);
  if (setting.status === 0 && setting.stdout.trim() !== "") {
    const entries = setting.stdout.split("\n").filter((line) => line.trim() !== "").map((line) => {
      const [scope, ...value] = line.replace(/\r$/, "").split("\t");
      return `${value.join("\t")} (scope: ${scope})`;
    });
    return refusal(base, `Another tool owns the git hooks here: the git setting core.hooksPath points to ${entries.join(", ")}.`);
  }
  const reportedHooksDir = hooksRun === "" ? defaultHooksDir : path.resolve(root, hooksRun);
  if (!platform.samePath(realNative(reportedHooksDir), realNative(defaultHooksDir))) {
    return refusal(base, `Another tool owns the git hooks here: git uses the hooks folder ${reportedHooksDir}, and not the hooks folder of this clone.`);
  }
  const hooksDirStat = lstatSync(defaultHooksDir, { throwIfNoEntry: false });
  if (hooksDirStat?.isSymbolicLink()) {
    return refusal(base, `Another tool owns the git hooks here: the hooks folder ${defaultHooksDir} is a symbolic link.`);
  }
  if (hooksDirStat && !hooksDirStat.isDirectory()) {
    return refusal(base, `The hooks path ${defaultHooksDir} is not a folder.`);
  }

  const files: GitHookFile[] = [];
  for (const name of GIT_HOOK_NAMES) {
    const file = path.join(defaultHooksDir, name);
    const stat = lstatSync(file, { throwIfNoEntry: false });
    if (!stat) {
      files.push({ name, path: file, exists: false, text: null, executable: true, block: null, blockStart: -1 });
      continue;
    }
    // Check 2: a link points to a file that another tool owns.
    if (stat.isSymbolicLink()) return refusal({ ...base, files }, `Another tool owns the hook file ${file}: it is a symbolic link.`);
    if (!stat.isFile()) return refusal({ ...base, files }, `The hook path ${file} is not a file.`);
    const bytes = readFileSync(file);
    // Check 3: the hook file is not a shell script.
    if (bytes.includes(0)) return refusal({ ...base, files }, `The hook file ${file} is not a shell script: it is a binary file.`);
    const text = bytes.toString("utf8");
    if (Buffer.compare(Buffer.from(text, "utf8"), bytes) !== 0) return refusal({ ...base, files }, `The hook file ${file} is not a shell script: it is not UTF-8 text.`);
    const firstLine = text.split("\n", 1)[0]!.replace(/\r$/, "");
    if (!SHELL_FIRST_LINE.test(firstLine)) {
      return refusal({ ...base, files }, text === ""
        ? `The hook file ${file} is not a shell script: it is empty.`
        : `The hook file ${file} is not a shell script: its first line does not name sh, bash, dash, ksh, or zsh.`);
    }
    const found = findGitHookBlock(text, name);
    // Check 4: the script starts another program on this same file. That program reads the whole file in its own
    // language, so a block of shell text on line 2 would break the hook. The Make Docs block itself is not read here.
    const outside = found && found !== "malformed" ? `${text.slice(0, found.start)}${text.slice(found.start + found.block.length)}` : text;
    if (startsAnotherProgramOnItself(outside)) {
      return refusal({ ...base, files }, `The hook file ${file} is not a plain shell script: it starts another program on this same file (a line with \`exec\` and \`$0\` as one word), and that program reads the whole file. A block of shell text would break it.`);
    }
    if (found === "malformed") {
      return refusal({ ...base, files }, `The hook file ${file} holds a damaged Make Docs block: its two marker lines do not form one block. Take the marker lines and the lines between them out by hand, then run setup again.`);
    }
    files.push({
      name,
      path: file,
      exists: true,
      text,
      executable: platform.kind === "win32" ? true : (stat.mode & 0o111) !== 0,
      block: found ? found.block : null,
      blockStart: found ? found.start : -1,
    });
  }
  return { ...base, files, status: "ready", reason: null };
}

/* ------------------------------------------------------------------------ */
/* The clone-owned record                                                   */
/* ------------------------------------------------------------------------ */

export interface GitHookRecordEntry {
  /** The exact block that Make Docs wrote. */
  block: string;
  blockSha256: string;
  /** True when Make Docs created the hook file. */
  createdFile: boolean;
  /** True when Make Docs added a line end after the first line, because the file had none. */
  addedLineEnd: boolean;
}

export interface GitHookRecord {
  schemaVersion: 1;
  blockVersion: number;
  /** The shared git folder of the clone, with forward slashes. */
  gitCommonDir: string;
  hooksDir: string;
  nodePath: string;
  commandFile: string;
  /** How the blocks of this record run the checkpoint: `background`. A record of block version 1 has no value, and its blocks run in the foreground. */
  runMode?: string;
  /** What a hook does when the last background run of the checkout did not end: `foreground`. */
  runFallback?: string;
  hooks: Partial<Record<GitHookName, GitHookRecordEntry>>;
  /** The bound checkouts that selected the hooks, each with its project folder from the top of its work tree. */
  checkouts: Array<{ checkoutId: string; projectFolder: string }>;
  appliedVersion: string;
  recordedAt: string;
}

export function gitHookRecordKey(gitCommonDir: string): string {
  return `${GIT_HOOK_RECORD_KEY_PREFIX}${sha256Text(slashPath(gitCommonDir))}`;
}

function isGitHookRecord(value: unknown): value is GitHookRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record.schemaVersion === 1 && typeof record.gitCommonDir === "string" && typeof record.hooks === "object" && record.hooks !== null &&
    Array.isArray(record.checkouts) && record.checkouts.every((entry) => typeof entry === "object" && entry !== null && typeof (entry as { checkoutId?: unknown }).checkoutId === "string" && typeof (entry as { projectFolder?: unknown }).projectFolder === "string");
}

function parseRecord(json: string): GitHookRecord | null {
  try {
    const value = JSON.parse(json) as unknown;
    return isGitHookRecord(value) ? value : null;
  } catch {
    return null;
  }
}

/** Each git hook record of the Store, with its key. Store care names them (PRD 38 R-HOOK-STATE-6). */
export function listGitHookRecords(db: StoreDatabase): Array<{ key: string; record: GitHookRecord }> {
  const rows = db.prepare("SELECT operation_id, metadata_json FROM tool_operations WHERE operation=? AND status='completed' ORDER BY operation_id").all(GIT_HOOK_RECORD_OPERATION) as Array<{ operation_id: string; metadata_json: string }>;
  return rows.flatMap((row) => {
    const record = parseRecord(row.metadata_json);
    return record ? [{ key: row.operation_id, record }] : [];
  });
}

function writeRecord(db: StoreDatabase, key: string, record: GitHookRecord): void {
  db.prepare(
    "INSERT INTO tool_operations (operation_id,operation,status,pid,hostname,metadata_json,started_at,finished_at) VALUES (?,?,'completed',?,?,?,?,?) ON CONFLICT(operation_id) DO UPDATE SET status='completed',metadata_json=excluded.metadata_json,finished_at=excluded.finished_at",
  ).run(key, GIT_HOOK_RECORD_OPERATION, process.pid, platform.hostname, JSON.stringify(record), record.recordedAt, record.recordedAt);
}

function deleteRecord(db: StoreDatabase, key: string): void {
  db.prepare("DELETE FROM tool_operations WHERE operation_id=? AND operation=? AND status='completed'").run(key, GIT_HOOK_RECORD_OPERATION);
}

/** A record of a clone at another folder that could be the record of this clone before it moved. */
export interface GitHookRecordCandidate {
  key: string;
  /** The shared git folder that the record names. It is not there now. */
  gitCommonDir: string;
}

export interface GitHookRecordLookup {
  key: string;
  record: GitHookRecord | null;
  /**
   * The key of a record of another folder that this run takes over. The record is
   * that one, and a write moves it to `key`. It is set only with the explicit hook input.
   */
  movedFromKey: string | null;
  /**
   * A record that this clone could take over: no record exists for this clone, the git folder of that record is
   * not there now, and each of its blocks is in the hook files of this clone, byte for byte. The same bytes prove
   * nothing: a copy of a clone holds them too. So this is only a candidate, which the plan names for the person.
   */
  candidate: GitHookRecordCandidate | null;
}

/**
 * The record of the clone. The key is a digest of the path of the shared git folder, so only the clone at that
 * path owns the record. A clone that moved has no record under its new key. A record of another folder is taken
 * over only when `takeOver` is set, which is the explicit hook input of setup, and only when exactly one
 * candidate exists. `setup remove` never sets it.
 */
function lookupRecord(db: StoreDatabase, inspection: GitHookInspection, takeOver: boolean): GitHookRecordLookup {
  const key = gitHookRecordKey(inspection.gitCommonDir!);
  const records = listGitHookRecords(db);
  const own = records.find((entry) => entry.key === key);
  if (own) return { key, record: own.record, movedFromKey: null, candidate: null };
  const moved = records.filter((entry) => {
    if (existsSync(entry.record.gitCommonDir)) return false;
    const names = Object.keys(entry.record.hooks) as GitHookName[];
    return names.length > 0 && names.every((name) => inspection.files.find((file) => file.name === name)?.block === entry.record.hooks[name]!.block);
  });
  const candidate = moved.length === 1 ? { key: moved[0]!.key, gitCommonDir: moved[0]!.record.gitCommonDir } : null;
  if (candidate && takeOver) return { key, record: moved[0]!.record, movedFromKey: candidate.key, candidate };
  return { key, record: null, movedFromKey: null, candidate };
}

export interface GitHookRecordFacts extends GitHookRecordLookup {
  /** The checkouts that hold the blocks now: each one has a Store checkout whose folder exists. */
  live: Array<{ checkoutId: string; projectFolder: string; root: string }>;
  /** The checkouts of the record that do not hold the blocks now, each with the folder that the Store has for it, or null. */
  gone: Array<{ checkoutId: string; projectFolder: string; recordedRoot: string | null }>;
}

const NO_RECORD_FACTS = (key: string): GitHookRecordFacts => ({ key, record: null, movedFromKey: null, candidate: null, live: [], gone: [] });

/**
 * The record of the clone with the checkouts that hold the blocks now. A checkout whose Store row or whose folder is
 * gone does not hold them. When the clone moved and its checkout got a new Store ID at the new path, that checkout
 * takes the place of the gone one with the same project folder.
 */
function recordFacts(db: StoreDatabase, inspection: GitHookInspection, checkoutId: string | null, takeOver: boolean): GitHookRecordFacts {
  const lookup = lookupRecord(db, inspection, takeOver);
  if (!lookup.record) return { ...lookup, live: [], gone: [] };
  const read = db.prepare("SELECT root_path FROM installation_checkouts WHERE checkout_id=?");
  const recordedRootOf = (id: string): string | null => (read.get(id) as { root_path: string } | undefined)?.root_path ?? null;
  const rootOf = (id: string): string | null => {
    const root = recordedRootOf(id);
    return root !== null && existsSync(root) ? root : null;
  };
  const live = lookup.record.checkouts.flatMap((entry) => {
    const root = rootOf(entry.checkoutId);
    return root === null ? [] : [{ ...entry, root }];
  });
  const gone = lookup.record.checkouts.filter((entry) => rootOf(entry.checkoutId) === null).map((entry) => ({ ...entry, recordedRoot: recordedRootOf(entry.checkoutId) }));
  if (lookup.movedFromKey && checkoutId !== null && !live.some((entry) => entry.checkoutId === checkoutId) &&
      lookup.record.checkouts.some((entry) => entry.projectFolder === inspection.projectFolder && !live.some((other) => other.checkoutId === entry.checkoutId))) {
    const root = rootOf(checkoutId);
    if (root !== null) live.push({ checkoutId, projectFolder: inspection.projectFolder!, root });
  }
  return { ...lookup, live, gone };
}

function storeHasDatabase(storeRoot: string): boolean {
  return existsSync(getStoreDatabasePath(storeRoot));
}

/** Read the record of the clone. A Store that is absent or cannot be read gives no record. `takeOver` is the explicit hook input. */
export function readGitHookRecord(projectRoot: string, storeRoot: string, inspection: GitHookInspection, checkoutId: string | null = null, takeOver = false): GitHookRecordFacts {
  const key = inspection.gitCommonDir ? gitHookRecordKey(inspection.gitCommonDir) : "";
  if (!inspection.gitCommonDir || !storeHasDatabase(storeRoot)) return NO_RECORD_FACTS(key);
  try {
    return withInstallationDatabase(projectRoot, (db) => recordFacts(db, inspection, checkoutId, takeOver), { storeRoot, readOnly: true });
  } catch {
    return NO_RECORD_FACTS(key);
  }
}

/* ------------------------------------------------------------------------ */
/* The setup plan                                                           */
/* ------------------------------------------------------------------------ */

/**
 * - `absent`: the file holds no block, and no record names one.
 * - `missing`: the record names a block, and the file holds none.
 * - `current`: the block equals the record and the block that setup would write.
 * - `outdated`: the block equals the record, and setup would write another block.
 * - `drifted`: the block differs from the record.
 * - `unrecorded`: the file holds a block, and the Store holds no record of it.
 */
export type GitHookState = "absent" | "missing" | "current" | "outdated" | "drifted" | "unrecorded";

export type GitHookAction = "create-file" | "add-block" | "replace-block" | "record-block" | "none" | "keep";

export interface GitHookPlanEntry {
  name: GitHookName;
  path: string;
  state: GitHookState;
  action: GitHookAction;
  /** The exact block that setup writes, or would write. */
  block: string;
  runs: string;
  /** True for an existing hook file with no executable mode. Setup does not change the mode. */
  notExecutable: boolean;
  /** True when the write replaces a block that a person changed or that no record covers. Its old text goes into a backup first. */
  backup: boolean;
}

/** A block that Make Docs does not touch without the explicit hook input. */
export interface GitHookKeptBlock {
  name: GitHookName;
  path: string;
  /** `drifted`: a person changed it. `unrecorded`: no record of this clone covers it. */
  state: "drifted" | "unrecorded";
  /** True when the block differs from the one that setup would write. */
  differs: boolean;
}

export interface GitHookPlan {
  status: "ready" | "refused" | "unavailable";
  reason: string | null;
  hooksDir: string | null;
  gitCommonDir: string | null;
  projectFolder: string | null;
  hooks: GitHookPlanEntry[];
  /** True when this checkout is in the record of the clone. */
  selected: boolean;
  /** True when an apply would change a hook file or the record. */
  changed: boolean;
  /** True when the plan was built for the explicit hook input (`make-docs setup --git-hooks`). */
  explicit: boolean;
  /**
   * The blocks that this run keeps: a person changed them, or no record of this clone covers them, and the run has
   * no explicit hook input. When one block is kept, the run changes no hook file and no record, as for a refused
   * hook file. Empty with the explicit hook input.
   */
  kept: GitHookKeptBlock[];
  /** The record of a clone at another folder that this run moves to this clone. Set only with the explicit hook input. */
  takeover: GitHookRecordCandidate | null;
  /** A record that this clone could take over with the explicit hook input. The plan only names it. */
  candidate: GitHookRecordCandidate | null;
  command: GitHookCommand;
  /** How each block runs the checkpoint: in the background. Git does not wait, and the hook prints nothing. */
  runMode: typeof GIT_HOOK_RUN_MODE;
  /** What a hook does when the last background run of this checkout did not end: it runs the checkpoint in the foreground. */
  runFallback: typeof GIT_HOOK_RUN_FALLBACK;
  /** The folder in the Store folder that holds the facts of the hook runs of this checkout. */
  runStateDir: string;
  /** A digest of each fact that the plan was built from. Apply refuses when it changed after the review. */
  fingerprint: string;
}

export interface PlanGitHooksInput {
  projectRoot: string;
  storeRoot: string;
  /** The checkout ID of this project in the Store, or null before the first setup. */
  checkoutId?: string | null;
  command?: GitHookCommand;
  /**
   * True only for the explicit hook input (`make-docs setup --git-hooks`). Without it, Make Docs keeps each block
   * that a person changed and each block that no record of this clone covers, and it takes no record over.
   */
  explicit?: boolean;
}

function checkoutIdOf(projectRoot: string, storeRoot: string): string | null {
  if (!storeHasDatabase(storeRoot)) return null;
  try {
    return getExistingInstallationCheckoutId(projectRoot, storeRoot);
  } catch {
    return null;
  }
}

/** The project folders that the block names: the folder of each other checkout that holds the blocks, and the folder of this one. */
function projectFoldersFor(checkoutId: string | null, projectFolder: string, live: GitHookRecordFacts["live"]): string[] {
  const folders = new Set(live.filter((entry) => entry.checkoutId !== checkoutId).map((entry) => entry.projectFolder));
  folders.add(projectFolder);
  return [...folders].sort();
}

/** Build the plan that the hook review shows. It changes nothing. */
export function planGitHooks(input: PlanGitHooksInput): GitHookPlan {
  const command = input.command ?? currentGitHookCommand();
  const inspection = inspectGitHooks(input.projectRoot);
  const explicit = input.explicit === true;
  const empty = { hooksDir: inspection.hooksDir, gitCommonDir: inspection.gitCommonDir, projectFolder: inspection.projectFolder, hooks: [] as GitHookPlanEntry[], selected: false, changed: false, explicit, kept: [] as GitHookKeptBlock[], takeover: null, candidate: null, command, runMode: GIT_HOOK_RUN_MODE, runFallback: GIT_HOOK_RUN_FALLBACK, runStateDir: slashPath(gitHookRunDir(input.storeRoot, input.projectRoot)) } as const;
  if (inspection.status !== "ready") {
    return { ...empty, status: inspection.status, reason: inspection.reason, fingerprint: sha256Text(JSON.stringify([inspection.status, inspection.reason])) };
  }
  const checkoutId = input.checkoutId === undefined ? checkoutIdOf(input.projectRoot, input.storeRoot) : input.checkoutId;
  const facts = readGitHookRecord(input.projectRoot, input.storeRoot, inspection, checkoutId, explicit);
  const { record, live } = facts;
  const folders = projectFoldersFor(checkoutId, inspection.projectFolder!, live);
  const selected = checkoutId !== null && live.some((entry) => entry.checkoutId === checkoutId);
  const kept: GitHookKeptBlock[] = [];
  let hooks = inspection.files.map((file): GitHookPlanEntry => {
    const block = renderGitHookBlock(file.name, { ...command, projectFolders: folders });
    const recorded = record?.hooks[file.name] ?? null;
    let state: GitHookState;
    if (file.block === null) state = recorded ? "missing" : "absent";
    else if (!recorded) state = "unrecorded";
    else if (file.block !== recorded.block) state = "drifted";
    else state = file.block === block ? "current" : "outdated";
    let action: GitHookAction;
    if (state === "absent" || state === "missing") action = file.exists ? "add-block" : "create-file";
    else if (state === "current") action = "none";
    else if (state === "unrecorded") action = file.block === block ? "record-block" : "replace-block";
    else action = "replace-block";
    // A block that a person changed, and a block that no record of this clone covers, need the explicit hook input.
    const guarded = state === "drifted" || state === "unrecorded";
    if (guarded && !explicit) kept.push({ name: file.name, path: file.path, state: state as "drifted" | "unrecorded", differs: file.block !== block });
    return { name: file.name, path: file.path, state, action, block, runs: gitHookCheckpointCommand(file.name), notExecutable: file.exists && !file.executable, backup: guarded && action === "replace-block" };
  });
  // One kept block keeps all four hook files as they are, as one refused hook file refuses all four.
  if (kept.length > 0) hooks = hooks.map((entry) => ({ ...entry, action: "keep", backup: false }));
  // A take-over moves the record, so it is a change also when no byte of a hook file changes.
  const changed = kept.length === 0 && (!selected || facts.movedFromKey !== null || hooks.some((entry) => entry.action !== "none"));
  return {
    ...empty,
    status: "ready",
    reason: null,
    hooks,
    selected,
    changed,
    kept,
    takeover: facts.movedFromKey && facts.candidate ? facts.candidate : null,
    candidate: facts.movedFromKey ? null : facts.candidate,
    fingerprint: sha256Text(JSON.stringify([inspection.files.map((file) => [file.path, file.text]), record, folders, command, explicit, facts.candidate])),
  };
}

/**
 * One line for the blocks that a run keeps, with the next step. It is the reason of a run that changes no hook
 * because a person changed a block, or because no record of this clone covers a block.
 */
export function gitHookKeptLine(plan: Pick<GitHookPlan, "kept" | "candidate" | "hooksDir">): string {
  const drifted = plan.kept.filter((entry) => entry.state === "drifted");
  if (drifted.length > 0) {
    return `The Make Docs block in ${drifted.map((entry) => entry.path).join(", ")} was changed after Make Docs wrote it. Make Docs keeps ${drifted.length === 1 ? "it" : "each one"} and changes no hook in this run. To replace ${drifted.length === 1 ? "it" : "them"} and keep a backup of the old block text, run \`make-docs setup --git-hooks\`.`;
  }
  const names = plan.kept.map((entry) => entry.name).join(", ");
  const from = plan.candidate ? ` The Store holds a record of the same blocks for the git folder ${plan.candidate.gitCommonDir}, which is not there now.` : "";
  const differs = plan.kept.some((entry) => entry.differs);
  const step = plan.candidate
    ? "When this clone moved from that folder, run `make-docs setup --git-hooks` here to move that record to this clone."
    : `To record them for this clone${differs ? ", and to replace each block that differs with a backup of its old text" : ""}, run \`make-docs setup --git-hooks\`.`;
  return `This folder has Make Docs hook blocks that no record of this clone covers (${names}, in ${plan.hooksDir}). Make Docs keeps them and changes no hook in this run.${from} ${step}`;
}

function actionWords(entry: GitHookPlanEntry): string {
  switch (entry.action) {
    case "create-file": return "Make Docs creates this file, with the executable mode, and puts the block in it.";
    case "add-block": return entry.state === "missing"
      ? "The Store has a record of a Make Docs block here, and the file holds none. Make Docs adds the block after the first line and keeps every other byte."
      : "This file exists. Make Docs adds the block after the first line and keeps every other byte.";
    case "replace-block": return entry.state === "drifted"
      ? `The Make Docs block here was changed after Make Docs wrote it. Because you gave \`--git-hooks\`, Make Docs replaces the block. It first keeps the old block text in a backup below ${GIT_HOOK_BACKUP_FOLDER} of this project, and the result names that file. It keeps every other byte.`
      : entry.state === "unrecorded"
        ? `This file holds a Make Docs block that differs and that no record of this clone covers. Because you gave \`--git-hooks\`, Make Docs replaces the block. It first keeps the old block text in a backup below ${GIT_HOOK_BACKUP_FOLDER} of this project, and the result names that file. It keeps every other byte.`
        : "Make Docs replaces its block with a newer one and keeps every other byte.";
    case "record-block": return "This file holds the same block, and no record of this clone covers it. Because you gave `--git-hooks`, Make Docs records it and changes no byte.";
    case "none": return "The block is current. No change.";
    case "keep": return entry.state === "drifted"
      ? "The Make Docs block here was changed after Make Docs wrote it. Make Docs keeps it. No change."
      : entry.state === "unrecorded"
        ? "This file holds a Make Docs block that no record of this clone covers. Make Docs keeps it. No change."
        : "No change in this run.";
  }
}

/** Where the old text of a replaced block goes: the backup folder of the project, which setup also uses. */
export const GIT_HOOK_BACKUP_FOLDER = ".make-docs/backup/";

/** The command that a hook runs, as the review names it. */
export function gitHookCommandWords(command: GitHookCommand): string {
  return `Each hook runs the Make Docs command at the recorded path: ${command.nodePath} ${command.commandFile}. That is the version that writes the block. Only when that file or that \`node\` program is gone does a hook run \`make-docs\` from PATH.`;
}

/** The limits of the hooks, which the review names before the person selects them. */
export function gitHookReviewLimits(runStateDir?: string): string[] {
  return [
    "A hook prints nothing, also when something is due, because the checkpoint ends after git returned. To see the result, run `make-docs work status`. The next Make Docs command also shows the reminder line when files wait.",
    "The hooks act only in a checkout that is bound to the Store. A new work tree of this clone is not bound until `make-docs project checkout apply` runs there. Until then the hooks do nothing there and say nothing.",
    "These git actions do not reach the checkpoint through a hook: `git reset --hard`, `git am`, and a cherry-pick with no conflict. The reminder line of the next Make Docs command and the next commit cover them.",
    "While another Make Docs process holds the Store or one of its locks, the background checkpoint waits at most 5 seconds at each wait for the Store. Then it syncs, or it gives up and the next checkpoint imports the file. Git does not wait in either case. The checkpoint reads each file below `docs/work/`, so it takes longer in a project with more work files, and that time is not added to the git action.",
    "At most one background checkpoint of a checkout waits. A hook run that finds a waiting one ends at once, because the waiting one reads the files later. The waiting one waits at most 5 seconds for the working one. Then it works too, so two can work at the same time when one takes longer than 5 seconds.",
    "The foreground fallback: when the last background checkpoint of this checkout did not end and is not running, such as in a shell that stops each process that a command started, the next hook runs the checkpoint in the foreground. Git then waits for it. That run waits at most 1 second at each wait for the Store, and it prints the summary line and the command when something is due. It then starts a background checkpoint again. When that one ends, the next hook uses the background again. A hook cannot know before its run that a shell will stop the background checkpoint, so the first hook run in such a shell syncs nothing.",
    `Make Docs keeps the facts of the hook runs of this checkout in the Store folder${runStateDir ? `, in ${runStateDir}` : ""}: \`last.json\` holds the result of the last background checkpoint with its output, and \`foreground.json\` names the last foreground fallback. No file of the project changes.`,
    "A hook does nothing, and says nothing, when the shell that runs it may not use the Store, such as a restricted command shell of an agent tool.",
    "The block holds two paths of this computer: the `node` program and the Make Docs command file. A hook runs the command at these paths first, so the version that wrote the block runs, and not another `make-docs` on PATH. The paths can go stale when you move, update, or remove them. Then a hook runs `make-docs` from PATH, or does nothing when none is there. Run `make-docs setup --git-hooks` again to record them again.",
    "Make Docs keeps a block that you changed, and a block that no record of this clone covers. Only `make-docs setup --git-hooks` replaces or records such a block, and it keeps a backup of the old text of a block that it replaces.",
    "Make Docs refuses a hook file that starts another program on itself (a line with `exec` and `$0` as one word), because a block of shell text would break that file.",
    "Make Docs knows no other hook tool by name. When another tool writes a hook file again, it can remove the Make Docs block. A later `make-docs setup` then reports the block as missing.",
    "On a platform with file modes, git does not run a hook file that is not executable. Make Docs names such a file and does not change its mode.",
    `To see the error output of a foreground run of a hook, set ${GIT_HOOK_DEBUG_ENV}=1 for one git command. A background checkpoint prints nothing with that variable too, and \`last.json\` holds its error output.`,
  ];
}

/** The hook review that setup shows before it writes: each hook path, what happens to it, what the block runs, and the exact block. */
export function renderGitHookReview(plan: GitHookPlan): string {
  if (plan.status !== "ready") return `Git hooks: ${plan.reason}`;
  const lines = [
    `Make Docs can add one marked block to each of four git hook files of this clone, in ${plan.hooksDir}.`,
    "Run mode: background. Each block starts the checkpoint in the background after the git action and returns, so git does not wait. A block never fails or blocks git, and it prints nothing. To see the result, run `make-docs work status`, or read the reminder line of the next Make Docs command.",
    "Fallback: foreground. Only when the last background checkpoint of this checkout did not end does a hook run the checkpoint in the foreground, and then git waits for it.",
    "Each work tree of this clone uses these hook files. Make Docs sets no machine-wide git hooks path.",
    gitHookCommandWords(plan.command),
    "",
  ];
  if (plan.takeover) {
    lines.push(
      `The Store holds a record of these same blocks for the git folder ${plan.takeover.gitCommonDir}, which is not there now (record ${plan.takeover.key}). This run moves that record to this clone, because you gave \`--git-hooks\`.`,
      "Do this only when this clone moved from that folder. A copy of a clone holds the same blocks. When that folder comes back, the clone there has blocks with no record, and `make-docs setup --git-hooks` there records them again.",
      "",
    );
  }
  const replaced = plan.hooks.filter((entry) => entry.backup);
  if (replaced.length > 0) {
    lines.push(`This run replaces ${replaced.length === 1 ? "a block" : `${replaced.length} blocks`} that Make Docs did not write in this form, and keeps a backup of each old block text below ${GIT_HOOK_BACKUP_FOLDER}:`, ...replaced.map((entry) => `- ${entry.path}`), "");
  }
  for (const entry of plan.hooks) {
    lines.push(`${entry.path}`);
    lines.push(`- ${actionWords(entry)}`);
    lines.push(`- It runs: ${entry.runs}${entry.name === "post-checkout" ? " (after a branch change only; it imports nothing and only reports)" : " (it imports changed docs/work/ files into the work store and writes no project file)"}`);
    if (entry.notExecutable) lines.push("- This file is not executable, so git does not run it on a platform with file modes. Make Docs does not change its mode. To let git run it: chmod +x on this file.");
  }
  lines.push("", "Limits:");
  for (const limit of gitHookReviewLimits(plan.runStateDir)) lines.push(`- ${limit}`);
  for (const entry of plan.hooks) {
    lines.push("", `The exact block for ${entry.name}:`, entry.block.replace(/\n$/, ""));
  }
  lines.push("", "`make-docs setup remove` takes these blocks out again, and only while they are unchanged.");
  return lines.join("\n");
}

/** One line for each hook: its state, for a repeat setup that changes nothing. */
export function renderGitHookStatus(plan: GitHookPlan): string[] {
  if (plan.status !== "ready") return [];
  const words: Record<GitHookState, string> = {
    absent: "no block",
    missing: "missing: the Store has a record of the block, and the file holds none",
    current: "current",
    outdated: "current, and a newer block is ready",
    drifted: "drifted: the block was changed after Make Docs wrote it, and Make Docs keeps it",
    unrecorded: "a Make Docs block that no record of this clone covers, and Make Docs keeps it",
  };
  return plan.hooks.map((entry) => `- ${entry.path}: ${words[entry.state]}${entry.notExecutable ? "; the file is not executable, so git does not run it on a platform with file modes" : ""}`);
}

/* ------------------------------------------------------------------------ */
/* Apply                                                                    */
/* ------------------------------------------------------------------------ */

function writeHookFile(file: string, text: string, mode: number | null): void {
  const temporary = `${file}.make-docs-${process.pid}.tmp`;
  writeFileSync(temporary, text, mode === null ? {} : { mode });
  try {
    if (mode !== null && platform.kind !== "win32") chmodSync(temporary, mode);
    renameSync(temporary, file);
  } catch (error) {
    rmSync(temporary, { force: true });
    throw error;
  }
}

/** The text of a hook file with the block put in: right after the first line. */
function insertBlock(text: string, block: string): { text: string; addedLineEnd: boolean } {
  const lineEnd = text.indexOf("\n");
  if (lineEnd === -1) return { text: `${text}\n${block}`, addedLineEnd: true };
  return { text: `${text.slice(0, lineEnd + 1)}${block}${text.slice(lineEnd + 1)}`, addedLineEnd: false };
}

export interface GitHookApplyResult {
  status: "installed" | "current" | "refused" | "unavailable";
  reason: string | null;
  /** `backupFile` is the file that holds the old text of a block that this run replaced. */
  hooks: Array<{ name: GitHookName; path: string; action: GitHookAction; backupFile?: string }>;
  /** The git folder of the record that this run took over, or null. */
  tookOverFrom?: string | null;
}

/** Keep the old text of one block in the backup folder of the project, before the block is replaced. */
function backupBlock(backupDir: string, name: GitHookName, block: string): string {
  const file = path.join(backupDir, "git-hooks", `${name}.block`);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, block, { flag: "wx" });
  return file;
}

export interface ApplyGitHooksInput extends PlanGitHooksInput {
  /** The fingerprint of the plan that the person reviewed. */
  reviewedFingerprint?: string;
  appliedVersion: string;
  now?: Date;
}

/**
 * Write the blocks and the record. The checkout must be bound to the Store.
 * It changes only the Make Docs block of each hook file, and it writes nothing
 * when the hook files or the record changed after the review.
 *
 * Without `explicit` it writes nothing when one block was changed by a person
 * or has no record of this clone, and it takes no record over. With `explicit`
 * it keeps the old text of each such block that it replaces in a backup file,
 * before the write, and the result names the file.
 */
export function applyGitHooks(input: ApplyGitHooksInput): GitHookApplyResult {
  const checkoutId = input.checkoutId ?? checkoutIdOf(input.projectRoot, input.storeRoot);
  if (!checkoutId) {
    return { status: "refused", reason: "This checkout is not bound to the Store, so Make Docs can record no git hook for it. Make Docs changed no hook file.", hooks: [] };
  }
  const explicit = input.explicit === true;
  const plan = planGitHooks({ ...input, checkoutId, explicit });
  if (plan.status !== "ready") return { status: plan.status, reason: plan.reason, hooks: [] };
  if (plan.kept.length > 0) return { status: "refused", reason: gitHookKeptLine(plan), hooks: [] };
  if (input.reviewedFingerprint !== undefined && input.reviewedFingerprint !== plan.fingerprint) {
    return { status: "refused", reason: "The hook files or their Store record changed after the review. Make Docs changed no hook file. Run setup again to review the current state.", hooks: [] };
  }
  const inspection = inspectGitHooks(input.projectRoot);
  if (inspection.status !== "ready") return { status: inspection.status, reason: inspection.reason, hooks: [] };
  const recordedAt = (input.now ?? new Date()).toISOString();
  return withInstallationDatabase(input.projectRoot, (db) => {
    const lookup = recordFacts(db, inspection, checkoutId, explicit);
    const previous = lookup.record;
    // The same rule again, on the bytes that this write reads: no block that differs from the record of this clone
    // is touched without the explicit hook input.
    const guarded = inspection.files.filter((file) => file.block !== null && (previous?.hooks[file.name]?.block ?? null) !== file.block);
    if (guarded.length > 0 && !explicit) {
      return { status: "refused" as const, reason: `The Make Docs block in ${guarded.map((file) => file.path).join(", ")} was changed, or no record of this clone covers it. Make Docs changed no hook file. To replace or record it, run \`make-docs setup --git-hooks\`.`, hooks: [] };
    }
    let backupDir: string | null = null;
    const wasSelected = lookup.live.some((entry) => entry.checkoutId === checkoutId);
    const others = lookup.live.filter((entry) => entry.checkoutId !== checkoutId).map((entry) => ({ checkoutId: entry.checkoutId, projectFolder: entry.projectFolder }));
    const checkouts = [...others, { checkoutId, projectFolder: inspection.projectFolder! }].sort((left, right) => left.checkoutId.localeCompare(right.checkoutId));
    const folders = [...new Set(checkouts.map((entry) => entry.projectFolder))].sort();
    const hooks: GitHookRecord["hooks"] = {};
    const done: GitHookApplyResult["hooks"] = [];
    mkdirSync(inspection.hooksDir!, { recursive: true });
    for (const file of inspection.files) {
      const block = renderGitHookBlock(file.name, { ...plan.command, projectFolders: folders });
      const recorded = previous?.hooks[file.name] ?? null;
      if (!file.exists) {
        writeHookFile(file.path, `${GIT_HOOK_NEW_FILE_FIRST_LINE}${block}`, 0o755);
        hooks[file.name] = { block, blockSha256: sha256Text(block), createdFile: true, addedLineEnd: false };
        done.push({ name: file.name, path: file.path, action: "create-file" });
      } else if (file.block === null) {
        const inserted = insertBlock(file.text!, block);
        writeHookFile(file.path, inserted.text, lstatSync(file.path).mode & 0o777);
        hooks[file.name] = { block, blockSha256: sha256Text(block), createdFile: false, addedLineEnd: inserted.addedLineEnd };
        done.push({ name: file.name, path: file.path, action: "add-block" });
      } else if (file.block === block) {
        hooks[file.name] = { block, blockSha256: sha256Text(block), createdFile: recorded?.createdFile ?? false, addedLineEnd: recorded?.addedLineEnd ?? false };
        done.push({ name: file.name, path: file.path, action: recorded?.block === block ? "none" : "record-block" });
      } else {
        // A block that is not the one of the record: its old text goes into a backup before the write.
        let backupFile: string | undefined;
        if (recorded?.block !== file.block) {
          backupDir ??= resolveBackupDestinationPlan(input.projectRoot, input.now ?? new Date()).destinationDir;
          backupFile = backupBlock(backupDir, file.name, file.block);
        }
        const text = `${file.text!.slice(0, file.blockStart)}${block}${file.text!.slice(file.blockStart + file.block.length)}`;
        writeHookFile(file.path, text, lstatSync(file.path).mode & 0o777);
        hooks[file.name] = { block, blockSha256: sha256Text(block), createdFile: recorded?.createdFile ?? false, addedLineEnd: recorded?.addedLineEnd ?? false };
        done.push({ name: file.name, path: file.path, action: "replace-block", ...(backupFile ? { backupFile } : {}) });
      }
    }
    const record: GitHookRecord = {
      schemaVersion: 1,
      blockVersion: GIT_HOOK_BLOCK_VERSION,
      gitCommonDir: slashPath(inspection.gitCommonDir!),
      hooksDir: slashPath(inspection.hooksDir!),
      nodePath: plan.command.nodePath,
      commandFile: plan.command.commandFile,
      runMode: GIT_HOOK_RUN_MODE,
      runFallback: GIT_HOOK_RUN_FALLBACK,
      hooks,
      checkouts,
      appliedVersion: input.appliedVersion,
      recordedAt,
    };
    if (lookup.movedFromKey) deleteRecord(db, lookup.movedFromKey);
    writeRecord(db, lookup.key, record);
    const changed = done.some((entry) => entry.action !== "none") || !wasSelected || lookup.movedFromKey !== null;
    return { status: changed ? "installed" as const : "current" as const, reason: null, hooks: done, tookOverFrom: lookup.movedFromKey ? previous?.gitCommonDir ?? null : null };
  }, { storeRoot: input.storeRoot });
}

/* ------------------------------------------------------------------------ */
/* Removal                                                                  */
/* ------------------------------------------------------------------------ */

export interface GitHookRemovalEntry {
  name: GitHookName;
  path: string;
  /**
   * - `remove-block`: the block matches the record, so exactly the block goes.
   * - `remove-file`: Make Docs created the file and it holds nothing else, so the file goes.
   * - `keep-changed`: the block was changed, so it stays, with a report.
   * - `keep-shared`: another bound checkout of the clone uses the block, and no byte changes.
   * - `update-block`: another checkout stays. The block stays in the file, and Make Docs writes it again with no line for the project folder of this checkout.
   * - `gone`: the file holds no block.
   */
  action: "remove-block" | "remove-file" | "keep-changed" | "keep-shared" | "update-block" | "gone";
}

export interface GitHookRemovalPlan {
  /**
   * - `none`: this checkout has no git hook record.
   * - `shared`: other bound checkouts keep the blocks.
   * - `held`: no other bound checkout remains, and a work tree of this clone that is not bound can be a checkout of the record at a new folder. The blocks and the record stay.
   * - `last`: the blocks and the record go.
   * - `unavailable`: the hook files cannot be read safely.
   */
  status: "none" | "shared" | "held" | "last" | "unavailable";
  reason: string | null;
  hooks: GitHookRemovalEntry[];
  /** The folders of the other bound checkouts of the clone that keep the blocks. */
  remaining: string[];
  /** Checkout IDs of the record whose folder is gone. They do not keep the block. */
  goneCheckouts: string[];
  /** The work trees of this clone that keep the blocks in the `held` case. */
  heldFor: string[];
  /** Hook files that hold a Make Docs block that no record of this clone covers. Removal leaves them. */
  unrecorded: string[];
  lines: string[];
}

interface RemovalFacts {
  inspection: GitHookInspection;
  facts: GitHookRecordFacts;
}

const REMOVAL_WORDS: Record<GitHookRemovalEntry["action"], string> = {
  "remove-block": "Make Docs removes its block and keeps every other byte.",
  "remove-file": "Make Docs created this file and it holds nothing else, so Make Docs removes the file.",
  "keep-changed": "The block was changed after Make Docs wrote it, so Make Docs keeps it. To remove it, take out its two marker lines and the lines between them by hand.",
  "keep-shared": "The block stays, with no change.",
  "update-block": "The block stays. Make Docs writes it again with no line for the project folder of this checkout, and keeps every other byte.",
  gone: "The file holds no Make Docs block. No change.",
};

/**
 * The work trees of this clone that can be a checkout of the record at a new folder: git lists the work tree, no
 * bound checkout of the record is in it, it is not the work tree of this checkout, and it holds a Make Docs
 * project in the project folder of a checkout whose recorded folder is gone.
 */
function movedWorkTrees(inspection: GitHookInspection, facts: GitHookRecordFacts, checkoutId: string | null): string[] {
  const gone = facts.gone.filter((entry) => entry.checkoutId !== checkoutId);
  if (gone.length === 0) return [];
  const taken = new Set([...facts.live.map((entry) => entry.root), ...(inspection.top ? [inspection.top] : [])].map((folder) => realNative(folder)));
  return inspection.worktrees.filter((top) => {
    if (inspection.top && platform.samePath(top, inspection.top)) return false;
    return gone.some((entry) => {
      const root = entry.projectFolder === "." ? top : path.join(top, entry.projectFolder);
      return !taken.has(realNative(root)) && existsSync(path.join(root, ".make-docs", "config.yaml"));
    });
  });
}

function removalPlanFrom(removal: RemovalFacts | null, checkoutId: string | null, unavailable: string | null): GitHookRemovalPlan {
  const empty: GitHookRemovalPlan = { status: "none", reason: null, hooks: [], remaining: [], goneCheckouts: [], heldFor: [], unrecorded: [], lines: [] };
  if (unavailable !== null) return { ...empty, status: "unavailable", reason: unavailable, lines: [`Git hooks: ${unavailable}`] };
  if (!removal) return empty;
  const { inspection, facts } = removal;
  const { live } = facts;
  const record = facts.record;
  if (!record) {
    const unrecorded = inspection.files.filter((file) => file.block !== null).map((file) => file.path);
    return {
      ...empty,
      unrecorded,
      lines: unrecorded.length === 0 ? [] : [
        "Git hooks: these hook files hold a Make Docs block, and no record of this clone covers it. So `setup remove` leaves each block and removes no record.",
        ...unrecorded.map((file) => `- ${file}`),
        ...(facts.candidate ? [`The Store holds a record of the same blocks for the git folder ${facts.candidate.gitCommonDir}, which is not there now. \`setup remove\` does not take that record over and does not delete it. When this clone moved from that folder, stop here and run \`make-docs setup --git-hooks\` first: it moves that record to this clone, and then \`make-docs setup remove\` takes the blocks out.`] : []),
        "To remove a block by hand, take out its two marker lines and the lines between them.",
      ],
    };
  }
  if (checkoutId === null || !live.some((entry) => entry.checkoutId === checkoutId)) return empty;
  const others = live.filter((entry) => entry.checkoutId !== checkoutId);
  const gone = facts.gone.filter((entry) => entry.checkoutId !== checkoutId);
  const goneCheckouts = gone.map((entry) => entry.checkoutId);
  const goneLines = gone.length === 0 ? [] : [
    `Git hooks: ${gone.length} other checkout${gone.length === 1 ? "" : "s"} of this clone selected the hooks, and ${gone.length === 1 ? "its recorded folder is" : "their recorded folders are"} gone:`,
    ...gone.map((entry) => `- ${entry.recordedRoot ?? `checkout ${entry.checkoutId}, with no folder in the Store`}`),
  ];
  if (others.length > 0) {
    const folders = [...new Set(others.map((entry) => entry.projectFolder))].sort();
    const hooks = inspection.files.map((file): GitHookRemovalEntry => {
      const recorded = record.hooks[file.name];
      if (file.block === null || !recorded) return { name: file.name, path: file.path, action: "gone" };
      if (file.block !== recorded.block) return { name: file.name, path: file.path, action: "keep-changed" };
      const next = renderGitHookBlock(file.name, { nodePath: record.nodePath, commandFile: record.commandFile, projectFolders: folders });
      return { name: file.name, path: file.path, action: next === file.block ? "keep-shared" : "update-block" };
    });
    return {
      ...empty,
      status: "shared",
      hooks,
      remaining: others.map((entry) => entry.root),
      goneCheckouts,
      lines: [
        `Git hooks: the Make Docs blocks stay in ${inspection.hooksDir}. ${others.length === 1 ? "Another bound checkout" : `${others.length} other bound checkouts`} of this clone ${others.length === 1 ? "uses" : "use"} them:`,
        ...others.map((entry) => `- ${entry.root}`),
        ...hooks.map((entry) => `- ${entry.path}: ${REMOVAL_WORDS[entry.action]}`),
        "Make Docs removes the blocks when `make-docs setup remove` runs in the last of these checkouts.",
        ...goneLines,
        ...(gone.length === 0 ? [] : [`${gone.length === 1 ? "It does" : "They do"} not keep the blocks.`]),
      ],
    };
  }
  // No other bound checkout remains. A checkout whose folder moved is not bound at its new folder, so the Store
  // sees it as gone. When git still lists a work tree that can be that checkout, the blocks stay.
  const heldFor = movedWorkTrees(inspection, facts, checkoutId);
  if (heldFor.length > 0) {
    const hooks = inspection.files.map((file): GitHookRemovalEntry => {
      const recorded = record.hooks[file.name];
      if (file.block === null || !recorded) return { name: file.name, path: file.path, action: "gone" };
      return { name: file.name, path: file.path, action: file.block !== recorded.block ? "keep-changed" : "keep-shared" };
    });
    return {
      ...empty,
      status: "held",
      hooks,
      goneCheckouts,
      heldFor,
      lines: [
        ...goneLines,
        `Git hooks: the Make Docs blocks stay in ${inspection.hooksDir}, with no change, and their Store record stays. Git lists ${heldFor.length === 1 ? "a work tree" : "work trees"} of this clone that can be ${gone.length === 1 ? "that checkout" : "one of those checkouts"} at a new folder, and each work tree of this clone uses these hook files:`,
        ...heldFor.map((folder) => `- ${folder}`),
        "This checkout leaves the record. To remove the blocks later: bind that work tree with `make-docs project checkout apply` there, run `make-docs setup --git-hooks` there, and then `make-docs setup remove` there. When that work tree needs no hook, take out the two marker lines of each block and the lines between them by hand.",
      ],
    };
  }
  const hooks = inspection.files.map((file): GitHookRemovalEntry => {
    const recorded = record.hooks[file.name];
    if (file.block === null || !recorded) return { name: file.name, path: file.path, action: "gone" };
    if (file.block !== recorded.block) return { name: file.name, path: file.path, action: "keep-changed" };
    const rest = textWithoutBlock(file, recorded);
    return { name: file.name, path: file.path, action: recorded.createdFile && rest === GIT_HOOK_NEW_FILE_FIRST_LINE ? "remove-file" : "remove-block" };
  });
  const keepsChanged = hooks.some((entry) => entry.action === "keep-changed");
  return {
    ...empty,
    status: "last",
    hooks,
    goneCheckouts,
    lines: [
      `Git hooks: this is the last bound checkout of this clone that selected the hooks, so Make Docs removes its blocks from ${inspection.hooksDir} and removes their Store record.`,
      ...hooks.map((entry) => `- ${entry.path}: ${REMOVAL_WORDS[entry.action]}`),
      ...(keepsChanged ? ["A block that stays has no Store record after this. A later setup keeps it too. Only `make-docs setup --git-hooks` replaces it, and it keeps a backup of the old block text."] : []),
      ...goneLines,
      ...(gone.length === 0 ? [] : [`${gone.length === 1 ? "It does" : "They do"} not keep the blocks, and git lists no work tree of this clone that can be ${gone.length === 1 ? "that checkout" : "one of them"} at a new folder.`]),
    ],
  };
}

function textWithoutBlock(file: GitHookFile, recorded: GitHookRecordEntry): string {
  const text = file.text!;
  let start = file.blockStart;
  const end = file.blockStart + file.block!.length;
  // Make Docs added a line end after the first line of a file that had none. It goes with the block.
  if (recorded.addedLineEnd && end === text.length && start > 0 && text[start - 1] === "\n") start -= 1;
  return `${text.slice(0, start)}${text.slice(end)}`;
}

/** The record facts of a removal. Removal reads only the record under the key of this clone, and takes no record over. */
function removalFacts(db: StoreDatabase, inspection: GitHookInspection, checkoutId: string | null): RemovalFacts {
  return { inspection, facts: recordFacts(db, inspection, checkoutId, false) };
}

/** What `setup remove` would do with the git hooks of this checkout. It changes nothing. */
export function planGitHookRemoval(projectRoot: string, storeRoot: string, checkoutId?: string | null): GitHookRemovalPlan {
  if (!storeHasDatabase(storeRoot)) return removalPlanFrom(null, null, null);
  const inspection = inspectGitHooks(projectRoot);
  if (inspection.status === "unavailable") return removalPlanFrom(null, null, null);
  const id = checkoutId === undefined ? checkoutIdOf(projectRoot, storeRoot) : checkoutId;
  try {
    return withInstallationDatabase(projectRoot, (db) => {
      if (inspection.status === "refused") {
        const key = inspection.gitCommonDir ? gitHookRecordKey(inspection.gitCommonDir) : "";
        const record = listGitHookRecords(db).find((entry) => entry.key === key)?.record ?? null;
        if (!record || id === null || !record.checkouts.some((entry) => entry.checkoutId === id)) return removalPlanFrom(null, null, null);
        return removalPlanFrom(null, id, `Make Docs cannot remove its blocks safely, so it leaves the hook files and the Store record ${key} as they are. ${inspection.reason}`);
      }
      return removalPlanFrom(removalFacts(db, inspection, id), id, null);
    }, { storeRoot, readOnly: true });
  } catch {
    return removalPlanFrom(null, null, null);
  }
}

export interface GitHookRemovalResult extends GitHookRemovalPlan {
  /** True when the Store record of the clone was removed. */
  recordRemoved: boolean;
}

/**
 * Take the git hooks of this checkout out, as {@link planGitHookRemoval} says. It removes only a block that still
 * matches the record, and it reads, writes, and deletes only the record under the key of this clone.
 */
export function applyGitHookRemoval(projectRoot: string, storeRoot: string, checkoutId: string | null, now = new Date()): GitHookRemovalResult {
  const planned = planGitHookRemoval(projectRoot, storeRoot, checkoutId);
  if (planned.status === "none" || planned.status === "unavailable") return { ...planned, recordRemoved: false };
  const inspection = inspectGitHooks(projectRoot);
  if (inspection.status !== "ready") return { ...removalPlanFrom(null, checkoutId, inspection.reason ?? "The hook files cannot be read."), recordRemoved: false };
  return withInstallationDatabase(projectRoot, (db) => {
    const removal = removalFacts(db, inspection, checkoutId);
    const plan = removalPlanFrom(removal, checkoutId, null);
    const { facts } = removal;
    const record = facts.record;
    if (!record || plan.status === "none" || plan.status === "unavailable") return { ...plan, recordRemoved: false };
    if (plan.status === "shared" || plan.status === "held") {
      // In the `held` case the checkouts whose folder is gone stay in the record, so that one of them holds the
      // blocks again when its work tree is bound at its new folder.
      const checkouts = plan.status === "held"
        ? record.checkouts.filter((entry) => entry.checkoutId !== checkoutId)
        : facts.live.filter((entry) => entry.checkoutId !== checkoutId).map(({ checkoutId: id, projectFolder }) => ({ checkoutId: id, projectFolder }));
      const folders = [...new Set(checkouts.map((entry) => entry.projectFolder))].sort();
      const hooks: GitHookRecord["hooks"] = { ...record.hooks };
      for (const entry of plan.hooks) {
        if (entry.action !== "update-block") continue;
        const file = inspection.files.find((candidate) => candidate.name === entry.name)!;
        const block = renderGitHookBlock(entry.name, { nodePath: record.nodePath, commandFile: record.commandFile, projectFolders: folders });
        writeHookFile(file.path, `${file.text!.slice(0, file.blockStart)}${block}${file.text!.slice(file.blockStart + file.block!.length)}`, lstatSync(file.path).mode & 0o777);
        hooks[entry.name] = { ...record.hooks[entry.name]!, block, blockSha256: sha256Text(block) };
      }
      // A block that was written again holds the block text of this version, so the record names this version.
      const rewritten = plan.hooks.some((entry) => entry.action === "update-block");
      writeRecord(db, facts.key, { ...record, ...(rewritten ? { blockVersion: GIT_HOOK_BLOCK_VERSION, runMode: GIT_HOOK_RUN_MODE, runFallback: GIT_HOOK_RUN_FALLBACK } : {}), hooks, checkouts, recordedAt: now.toISOString() });
      removeGitHookRunState(storeRoot, projectRoot);
      return { ...plan, recordRemoved: false };
    }
    for (const entry of plan.hooks) {
      const file = inspection.files.find((candidate) => candidate.name === entry.name)!;
      if (entry.action === "remove-file") rmSync(file.path, { force: true });
      else if (entry.action === "remove-block") writeHookFile(file.path, textWithoutBlock(file, record.hooks[entry.name]!), lstatSync(file.path).mode & 0o777);
    }
    deleteRecord(db, facts.key);
    // The run files of this checkout go with its hooks. They are files of the Store folder, and no row.
    removeGitHookRunState(storeRoot, projectRoot);
    return { ...plan, recordRemoved: true };
  }, { storeRoot });
}
