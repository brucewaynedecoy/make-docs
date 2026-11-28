import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

import { STORE_DATABASE_FILE, resolveStoreRoot } from "./paths";

/**
 * W35 R0 P5 (owner decisions OD-P5-1 to OD-P5-5 of 2026-11-28): how a git hook
 * starts the checkpoint.
 *
 * The hook block sets `MAKE_DOCS_GIT_HOOK_RUN=start` and runs
 * `make-docs project checkpoint --event <event>`. This module then decides the
 * run mode, before the CLI loads the rest of its code:
 *
 * - Background, the normal mode: this process starts the same command again
 *   as a process of its own session, with its input, output, and error output
 *   sent to nowhere, and ends at once with exit code 0. It prints nothing. So
 *   git does not wait for the checkpoint.
 * - Foreground fallback: when the last background run of this checkout did
 *   not end and is not running now, this process runs the checkpoint itself,
 *   with the short wait limit and the short output of a git hook. Then it
 *   starts a background run too. When that run ends, the next hook uses the
 *   background mode again.
 *
 * The facts of the runs of one checkout are small files in one folder of the
 * Store folder, `git-hook-runs/<digest of the project folder>/`. They are no
 * part of the Store database, and no file of the project. This module must
 * stay small: it loads before the CLI, at each git action.
 */

/** The hook block sets this variable. A person does not set it. */
export const GIT_HOOK_RUN_ENV = "MAKE_DOCS_GIT_HOOK_RUN";
/** The value that the hook block sets. */
export const GIT_HOOK_RUN_START = "start";
/** The value of a run in the foreground fallback. */
export const GIT_HOOK_RUN_FOREGROUND = "foreground";
/** The start of the value of a background run. A token follows it. */
export const GIT_HOOK_RUN_BACKGROUND_PREFIX = "background:";

/** The folder of the run files, in the Store folder. */
export const GIT_HOOK_RUNS_DIR = "git-hook-runs";
/** The files of one checkout in that folder. `setup remove` and Store removal take out only these names. */
export const GIT_HOOK_RUN_FILES = ["started.json", "pending.json", "working.json", "last.json", "foreground.json"] as const;

/** How long a background run waits for an earlier background run of the same checkout, in milliseconds. */
export const GIT_HOOK_RUN_QUEUE_WAIT_MS = 5000;
/** After this time a file that names a live process is taken as left behind, in milliseconds. */
export const GIT_HOOK_RUN_STALE_MS = 60_000;
/** The most characters of output and of error output that the file of the last run keeps. */
export const GIT_HOOK_RUN_OUTPUT_LIMIT = 4000;

export type GitHookRunMode = "background" | "foreground";

/** The run mode of this process, from the variable of the hook block. Null for each other run. */
export function gitHookRunMode(env: NodeJS.ProcessEnv = process.env): GitHookRunMode | null {
  const value = env[GIT_HOOK_RUN_ENV] ?? "";
  if (value.startsWith(GIT_HOOK_RUN_BACKGROUND_PREFIX)) return "background";
  if (value === GIT_HOOK_RUN_FOREGROUND) return "foreground";
  return null;
}

interface RunMark { token?: string; pid?: number; at?: string; event?: string | null }

export interface GitHookLastRun {
  schemaVersion: 1;
  mode: "background";
  /** `ran`: the checkpoint ran to its end. `covered`: another background run of this checkout waited, and it reads the files later, so this run did nothing. */
  outcome: "ran" | "covered";
  event: string | null;
  root: string;
  pid: number;
  startedAt: string;
  endedAt: string;
  /** The exit code of the checkpoint. 1 with a Store that was held for the whole wait, or with a shell that may not use the Store. */
  exitCode: number;
  /** What the checkpoint wrote on standard output, which a background run sends to nowhere. */
  output: string;
  /** What the checkpoint wrote on standard error. */
  errorOutput: string;
}

export interface GitHookForegroundRun {
  schemaVersion: 1;
  at: string;
  event: string | null;
  root: string;
  reason: string;
  /** The process number and the start time of the background run that did not end. */
  previous: { pid: number | null; at: string | null };
}

function slashPath(target: string): string {
  return target.split(path.sep).join("/");
}

function realRoot(root: string): string {
  try { return realpathSync.native(root); } catch { return path.resolve(root); }
}

/** The folder of the run files of one checkout. The name is a digest of the project folder, so each work tree has its own. */
export function gitHookRunDir(storeRoot: string, projectRoot: string): string {
  const digest = createHash("sha256").update(slashPath(realRoot(projectRoot))).digest("hex");
  return path.join(storeRoot, GIT_HOOK_RUNS_DIR, digest);
}

function readJson<T>(file: string): T | null {
  try {
    const value = JSON.parse(readFileSync(file, "utf8")) as unknown;
    return typeof value === "object" && value !== null ? value as T : null;
  } catch {
    return null;
  }
}

function writeJson(file: string, value: unknown, flag: "w" | "wx" = "w"): void {
  if (flag === "wx") {
    writeFileSync(file, `${JSON.stringify(value)}\n`, { flag: "wx", mode: 0o600 });
    return;
  }
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value)}\n`, { mode: 0o600 });
  // On Windows a rename onto a file that another process has open can fail for a moment. So the rename is tried
  // again a few times, for at most about 50 ms in all.
  for (let attempt = 0; ; attempt += 1) {
    try {
      renameSync(temporary, file);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (attempt >= RENAME_RETRIES || (code !== "EPERM" && code !== "EBUSY" && code !== "EACCES")) {
        remove(temporary);
        throw error;
      }
      sleep(RENAME_RETRY_MS);
    }
  }
}

const RENAME_RETRIES = 5;
const RENAME_RETRY_MS = 10;

function sleep(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function remove(file: string): void {
  try { unlinkSync(file); } catch { /* It is gone, or it cannot go. Both are fine here. */ }
}

function alive(pid: unknown): boolean {
  if (typeof pid !== "number" || !Number.isSafeInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // No right to signal the process means that it exists.
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

function ageMs(mark: RunMark, now: number): number {
  const at = typeof mark.at === "string" ? Date.parse(mark.at) : Number.NaN;
  return Number.isFinite(at) ? now - at : Number.POSITIVE_INFINITY;
}

/** True while the process of a mark runs, and the mark is not older than the stale time. */
function markIsLive(mark: RunMark | null, now: number): boolean {
  if (!mark) return false;
  const age = ageMs(mark, now);
  if (age >= GIT_HOOK_RUN_STALE_MS) return false;
  // A start mark has no process number for a moment, between its write and the start of the process.
  if (mark.pid === undefined) return age < 5000;
  return alive(mark.pid);
}

interface HookCall { event: string | null; root: string }

/** The events that a git hook block gives. Only a call with one of them can start in the background. */
export const GIT_HOOK_RUN_EVENTS: readonly string[] = ["commit", "branch-change"];

/**
 * The checkpoint call of a hook block: `project checkpoint` with the event `commit` or `branch-change`, and
 * with no `--json`. Null for each other command, for each other event, and for a call that asks for JSON: such a
 * call ignores the variable of the block and runs as without it. A hook block never passes `--json`, and a call
 * with `--json` must print its JSON, so it never starts in the background.
 */
function hookCall(argv: readonly string[], cwd: string): HookCall | null {
  if (argv[0] !== "project" || argv[1] !== "checkpoint") return null;
  let event: string | null = null;
  let root = cwd;
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--json") return null;
    if (argv[index] === "--event") event = argv[index + 1] ?? null;
    else if (argv[index] === "--target-root" && argv[index + 1]) root = path.resolve(cwd, argv[index + 1]!);
  }
  return event !== null && GIT_HOOK_RUN_EVENTS.includes(event) ? { event, root } : null;
}

/** The folder of the run files, made when it does not exist. Null with no usable Store, or when the folder cannot be written. */
function usableRunDir(call: HookCall, env: NodeJS.ProcessEnv): string | null {
  try {
    const storeRoot = resolveStoreRoot({ env });
    if (!existsSync(path.join(storeRoot, STORE_DATABASE_FILE))) return null;
    if (!existsSync(path.join(call.root, ".make-docs", "config.yaml"))) return null;
    const dir = gitHookRunDir(storeRoot, call.root);
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    return dir;
  } catch {
    return null;
  }
}

/**
 * Start the background run: the same command, as a process with its own session (its own process group on
 * Windows), with no input, no output, and no error output. This process does not wait for it.
 */
function startBackgroundRun(dir: string, call: HookCall, argv: readonly string[], env: NodeJS.ProcessEnv): boolean {
  const token = `${process.pid}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const at = new Date().toISOString();
  try {
    writeJson(path.join(dir, "started.json"), { token, at, event: call.event } satisfies RunMark);
    const child = spawn(process.execPath, [...process.execArgv, process.argv[1]!, ...argv], {
      cwd: process.cwd(),
      env: { ...env, [GIT_HOOK_RUN_ENV]: `${GIT_HOOK_RUN_BACKGROUND_PREFIX}${token}` },
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    // A start that fails gives an `error` event later. The start mark then stays, and the next hook runs in the foreground.
    child.on("error", () => {});
    // The process number goes into the mark only while the mark is still of this run. A run that ended very fast
    // removed its mark already, and a second write would leave a mark of a process that is gone.
    if (typeof child.pid === "number" && readJson<RunMark>(path.join(dir, "started.json"))?.token === token) {
      writeJson(path.join(dir, "started.json"), { token, pid: child.pid, at, event: call.event } satisfies RunMark);
    }
    child.unref();
    return typeof child.pid === "number";
  } catch {
    return false;
  }
}

export type GitHookStartResult =
  /** Not a call of a hook block. The CLI runs as it always does. */
  | { kind: "none" }
  /** The background run was started. This process ends now, with exit code 0 and no output. */
  | { kind: "started" }
  /** This process runs the checkpoint in the foreground. `after` runs when it ended. */
  | { kind: "foreground"; after: () => void }
  /** This process is the background run. `skip` is true when another run covers it. */
  | { kind: "background"; skip: boolean };

/**
 * Decide what this process is, at the start of the CLI. It changes `env` for the foreground fallback, so that the
 * checkpoint knows its mode. It never throws.
 */
export function beginGitHookRun(argv: readonly string[], env: NodeJS.ProcessEnv = process.env, cwd = process.cwd()): GitHookStartResult {
  const value = env[GIT_HOOK_RUN_ENV] ?? "";
  if (value === "") return { kind: "none" };
  const call = hookCall(argv, cwd);
  if (!call) return { kind: "none" };
  try {
    if (value.startsWith(GIT_HOOK_RUN_BACKGROUND_PREFIX)) {
      return { kind: "background", skip: beginBackgroundRun(call, value.slice(GIT_HOOK_RUN_BACKGROUND_PREFIX.length), env) };
    }
    if (value !== GIT_HOOK_RUN_START) return { kind: "none" };
    const dir = usableRunDir(call, env);
    // No usable Store, no Make Docs project, or a shell that may not write the Store folder: the checkpoint runs
    // here, as before, and it does nothing or reports with read access only.
    if (dir === null) {
      env[GIT_HOOK_RUN_ENV] = GIT_HOOK_RUN_FOREGROUND;
      return { kind: "foreground", after: () => {} };
    }
    const now = Date.now();
    const started = readJson<RunMark>(path.join(dir, "started.json"));
    if (started === null || markIsLive(started, now)) {
      if (startBackgroundRun(dir, call, argv, env)) return { kind: "started" };
      env[GIT_HOOK_RUN_ENV] = GIT_HOOK_RUN_FOREGROUND;
      return { kind: "foreground", after: () => {} };
    }
    // The last background run of this checkout left its start mark, and its process is gone: it did not end.
    try {
      writeJson(path.join(dir, "foreground.json"), {
        schemaVersion: 1,
        at: new Date(now).toISOString(),
        event: call.event,
        root: slashPath(realRoot(call.root)),
        reason: "The last background run of this checkout did not end, and its process is not running.",
        previous: { pid: typeof started.pid === "number" ? started.pid : null, at: typeof started.at === "string" ? started.at : null },
      } satisfies GitHookForegroundRun);
    } catch { /* The report file is not needed for the run. */ }
    env[GIT_HOOK_RUN_ENV] = GIT_HOOK_RUN_FOREGROUND;
    const startEnv = { ...env, [GIT_HOOK_RUN_ENV]: GIT_HOOK_RUN_START };
    return { kind: "foreground", after: () => { startBackgroundRun(dir, call, argv, startEnv); } };
  } catch {
    return { kind: "none" };
  }
}

/**
 * The start of a background run. At most one background run of a checkout waits: a run that finds a waiting run
 * ends at once, because the waiting run reads the files after this moment. The waiting run waits at most 5
 * seconds for the working run. Then it works too, so two runs of one checkout can work at the same time when one
 * takes longer than that. The sync core keeps the data safe then (register entry R-041). The result is true when
 * this run must end with no checkpoint.
 */
function beginBackgroundRun(call: HookCall, token: string, env: NodeJS.ProcessEnv): boolean {
  const startedAt = new Date().toISOString();
  const root = slashPath(realRoot(call.root));
  let dir: string | null = null;
  try {
    dir = gitHookRunDir(resolveStoreRoot({ env }), call.root);
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  } catch {
    dir = null;
  }
  let output = "";
  let errorOutput = "";
  let outcome: GitHookLastRun["outcome"] = "ran";
  let working = false;
  let finished = false;
  const finish = () => {
    if (finished || dir === null) return;
    finished = true;
    try {
      if (working && readJson<RunMark>(path.join(dir, "working.json"))?.pid === process.pid) remove(path.join(dir, "working.json"));
      writeJson(path.join(dir, "last.json"), {
        schemaVersion: 1,
        mode: "background",
        outcome,
        event: call.event,
        root,
        pid: process.pid,
        startedAt,
        endedAt: new Date().toISOString(),
        exitCode: typeof process.exitCode === "number" ? process.exitCode : Number(process.exitCode ?? 0) || 0,
        output,
        errorOutput,
      } satisfies GitHookLastRun);
      // The start mark goes last: a hook that finds no start mark knows that this run ended.
      if (readJson<RunMark>(path.join(dir, "started.json"))?.token === token) remove(path.join(dir, "started.json"));
    } catch { /* A file that cannot be written leaves the start mark, and the next hook runs in the foreground. */ }
  };
  process.on("exit", finish);
  if (dir === null) return false;

  // One run waits at most. Another run that waits has not read the work files yet, so it covers this one.
  const pendingFile = path.join(dir, "pending.json");
  const own: RunMark = { token, pid: process.pid, at: startedAt };
  let pending = false;
  for (let attempt = 0; attempt < 2 && !pending; attempt += 1) {
    try {
      writeJson(pendingFile, own, "wx");
      pending = true;
    } catch {
      if (markIsLive(readJson<RunMark>(pendingFile), Date.now())) {
        outcome = "covered";
        finish();
        return true;
      }
      remove(pendingFile);
    }
  }
  if (!pending) {
    // Another run took the place in the same moment. It covers this one.
    outcome = "covered";
    finish();
    return true;
  }

  // Wait for the run that works now, for a bounded time. Then this run works too, also when the other one still
  // works, and the next run can wait.
  const workingFile = path.join(dir, "working.json");
  const deadline = Date.now() + GIT_HOOK_RUN_QUEUE_WAIT_MS;
  while (Date.now() < deadline && markIsLive(readJson<RunMark>(workingFile), Date.now())) sleep(50);
  try { writeJson(workingFile, { token, pid: process.pid, at: new Date().toISOString() } satisfies RunMark); working = true; } catch { /* The run goes on with no mark. */ }
  remove(pendingFile);

  // Keep what the checkpoint prints, for the file of the last run. Nothing reaches a terminal: the output of this process goes to nowhere.
  const keep = (text: string, chunk: unknown): string => (text.length >= GIT_HOOK_RUN_OUTPUT_LIMIT ? text : `${text}${typeof chunk === "string" ? chunk : Buffer.isBuffer(chunk) ? chunk.toString("utf8") : ""}`.slice(0, GIT_HOOK_RUN_OUTPUT_LIMIT));
  const outWrite = process.stdout.write.bind(process.stdout);
  const errWrite = process.stderr.write.bind(process.stderr);
  process.stdout.write = ((chunk: unknown, ...rest: unknown[]) => { output = keep(output, chunk); return (outWrite as (...args: unknown[]) => boolean)(chunk, ...rest); }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: unknown, ...rest: unknown[]) => { errorOutput = keep(errorOutput, chunk); return (errWrite as (...args: unknown[]) => boolean)(chunk, ...rest); }) as typeof process.stderr.write;
  return false;
}

export interface GitHookRunState {
  dir: string;
  /** True while a background run of this checkout is started, waits, or works. */
  busy: boolean;
  last: GitHookLastRun | null;
  foreground: GitHookForegroundRun | null;
}

/** Read the run files of one checkout. It changes nothing. */
export function readGitHookRunState(storeRoot: string, projectRoot: string): GitHookRunState {
  const dir = gitHookRunDir(storeRoot, projectRoot);
  const now = Date.now();
  const busy = ["started.json", "pending.json", "working.json"].some((name) => markIsLive(readJson<RunMark>(path.join(dir, name)), now));
  return { dir, busy, last: readJson<GitHookLastRun>(path.join(dir, "last.json")), foreground: readJson<GitHookForegroundRun>(path.join(dir, "foreground.json")) };
}

/** Take out the run files of one checkout, and the folder when it is empty then. It removes only the known file names. */
export function removeGitHookRunState(storeRoot: string, projectRoot: string): void {
  removeRunDir(gitHookRunDir(storeRoot, projectRoot));
  try { rmdirSync(path.join(storeRoot, GIT_HOOK_RUNS_DIR)); } catch { /* Other checkouts have files there. */ }
}

/** A file that a write of a run file left behind when its process was stopped: `<run file>.<process number>.tmp`. */
const LEFT_WRITE_FILE = /^(?:started|pending|working|last|foreground)\.json\.\d+\.tmp$/;

function removeRunDir(dir: string): boolean {
  for (const name of GIT_HOOK_RUN_FILES) remove(path.join(dir, name));
  try {
    for (const name of readdirSync(dir)) if (LEFT_WRITE_FILE.test(name)) remove(path.join(dir, name));
  } catch { /* The folder is gone, or it cannot be read. The removal below gives the answer. */ }
  try {
    rmdirSync(dir);
    return true;
  } catch {
    return !existsSync(dir);
  }
}

/**
 * Take out the whole folder of the run files, for the removal of the Store. It removes only folders with a digest
 * name and only the known file names in them. The result is false when something else is there, and that stays.
 */
export function removeAllGitHookRunState(storeRoot: string): boolean {
  const base = path.join(storeRoot, GIT_HOOK_RUNS_DIR);
  let names: string[];
  try { names = readdirSync(base); } catch { return !existsSync(base); }
  let clean = true;
  for (const name of names) {
    if (!/^[0-9a-f]{64}$/.test(name) || !removeRunDir(path.join(base, name))) clean = false;
  }
  if (!clean) return false;
  try {
    rmdirSync(base);
    return true;
  } catch {
    return false;
  }
}
