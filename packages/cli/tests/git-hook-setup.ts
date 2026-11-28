import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, vi } from "vitest";

import { applyGitHooks, GIT_HOOK_NAMES, type GitHookApplyResult, type GitHookCommand, type GitHookName } from "../src/git-hooks";
import { HARNESS_CALLER_IDENTITY_ENV } from "../src/harness-access/contract";
import type { WorkCheckpointResult } from "../src/operations/work/work-queue/checkpoint";
import type { WorkUnitRecord } from "../src/operations/work/work-store/schemas";
import { platform } from "../src/platform";
import { GIT_HOOK_RUNS_DIR, GIT_HOOK_RUN_STALE_MS, readGitHookRunState, type GitHookLastRun, type GitHookRunState } from "../src/store/git-hook-runs";
import { getInstallationCheckoutId, previewInstallationCheckoutMove, registerSeparateInstallationCheckout } from "../src/store/installation-state";
import { getStoreDatabasePath } from "../src/store/paths";
import { listWorkUnits, readWorkStore } from "../src/store/work-store";
import { createGitProof, shellPath, shellQuote, systemPathFolders, type GitProof, type GitResult } from "./git-hook-proof";

/**
 * W35 R0 P5: the helper of the git hook tests of setup. It extends the helper
 * of the P4 proofs. Each test works only inside one temporary folder, with a
 * temporary Store at a fixed, checked path inside it, a temporary home folder,
 * and empty files in place of the global and the system git config. No test
 * installs a hook in a real repository.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const CLI = path.resolve(HERE, "../dist/index.js");
export const PROJECT_ID = "aurora-w35-p5-hooks";
export const RECORD = "docs/work/2042-06-01-w1-r0-aurora";
export const INDEX = `${RECORD}/00-index.md`;
export const P1 = `${RECORD}/01-first.md`;
export const TASK = "W1 R0 P1 T1";

export const INDEX_TEXT = `---
title: "W1 R0 Aurora"
kind: "work"
status: "active"
coordinate: "W1 R0"
---

# W1 R0 Aurora
`;

export const P1_TEXT = `---
title: "Phase 1: First"
kind: "work"
status: "active"
coordinate: "W1 R0 P1"
---

# Phase 1: First

## Stage 1 - Build

### Tasks

- [ ] T1: Build the parser.
- [ ] T2: Write the writer.
`;

export interface Run { status: number | null; stdout: string; stderr: string }

export interface HookFixture {
  proof: GitProof;
  store: string;
  /** A folder that holds a `make-docs` command file, as an install puts one on PATH. */
  binDir: string;
  /** The command that setup would record in a block: the node program and the built CLI. */
  command: GitHookCommand;
  /** The environment of a git action in a terminal: the command folder is on PATH. */
  onPath: NodeJS.ProcessEnv;
  /** The environment of a git action from an app: the system folders only, so only the recorded path can work. */
  shortPath: NodeJS.ProcessEnv;
  /** The environment of a git action whose hooks can reach no Store: the Store folder does not exist. */
  noStore: NodeJS.ProcessEnv;
  /** The Store folder of `noStore`. No hook creates it. */
  noStoreDir: string;
  /**
   * Run git and do not wait for the background checkpoint that a hook starts. `proof.git` of this fixture waits
   * for it, so that each test reads the Store after the run ended and leaves no process behind.
   */
  gitNoWait: GitProof["git"];
  cleanup(): void;
}

/** What a git action of a hook test gives: the result of git, and what the background checkpoint of its hook printed to nowhere. */
export interface HookGitResult extends GitResult {
  /** The output of the last background checkpoint that ended after this git action started. Empty when none ran. */
  hookOutput: string;
  /** The file of that run, or null. */
  background: GitHookLastRun | null;
}

/** How long a test waits for the background checkpoints of a hook to end. It is far above the waits of a run. */
export const HOOK_RUN_WAIT_MS = 45_000;

function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** The run folders of the temporary Store: one for each checkout whose hook started a run. */
function runDirs(store: string): string[] {
  const base = path.join(store, GIT_HOOK_RUNS_DIR);
  if (!existsSync(base)) return [];
  return readdirSync(base).map((name) => path.join(base, name));
}

function readRunDir(dir: string): { busy: boolean; last: GitHookLastRun | null } {
  const mark = (name: string) => {
    try { return JSON.parse(readFileSync(path.join(dir, name), "utf8")) as { pid?: number; at?: string }; } catch { return null; }
  };
  const live = (name: string) => {
    const value = mark(name);
    if (!value) return false;
    const age = Date.now() - Date.parse(value.at ?? "");
    if (!(age < GIT_HOOK_RUN_STALE_MS)) return false;
    if (typeof value.pid !== "number") return age < 5000;
    try { process.kill(value.pid, 0); return true; } catch (error) { return (error as NodeJS.ErrnoException).code === "EPERM"; }
  };
  return { busy: ["started.json", "pending.json", "working.json"].some(live), last: mark("last.json") as GitHookLastRun | null };
}

/**
 * Wait until no background checkpoint of a hook runs for any checkout of the temporary Store. The wait is bounded,
 * and it throws at the bound, so no test ends with a process that still runs or with a folder that is in use.
 */
export function waitForHookRuns(store: string, timeoutMs = HOOK_RUN_WAIT_MS): void {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (!runDirs(store).some((dir) => readRunDir(dir).busy)) return;
    if (Date.now() >= deadline) throw new Error(`A background checkpoint of a git hook still runs after ${timeoutMs} ms in ${store}.`);
    sleepSync(25);
  }
}

/** The last background checkpoint of any checkout of the Store that ended at or after `sinceMs`. */
export function lastHookRunSince(store: string, sinceMs: number): GitHookLastRun | null {
  const runs = runDirs(store).map((dir) => readRunDir(dir).last).filter((run): run is GitHookLastRun => run !== null && Date.parse(run.endedAt) >= sinceMs);
  runs.sort((left, right) => left.endedAt.localeCompare(right.endedAt));
  return runs.at(-1) ?? null;
}

/** The run files of one checkout. */
export function hookRunState(fixture: HookFixture, root: string): GitHookRunState {
  return readGitHookRunState(fixture.store, root);
}

/** A PATH as an app can pass it to git: the system folders only. */
export function shortPathValue(): string {
  return systemPathFolders().join(path.delimiter);
}

export function envWithPath(proof: GitProof, value: string, extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const [key, entry] of Object.entries(proof.env)) if (key.toUpperCase() !== "PATH") env[key] = entry;
  env.PATH = value;
  return { ...env, ...extra };
}

function currentPath(proof: GitProof): string {
  const key = Object.keys(proof.env).find((entry) => entry.toUpperCase() === "PATH");
  return key ? proof.env[key] ?? "" : "";
}

/**
 * Make the fixture of one test. It points `MAKE_DOCS_HOME` of this process and of each child process at the temporary
 * Store, and it stops when that value is empty, because an empty value means the real Store.
 */
export function createHookFixture(prefix: string): HookFixture {
  const proof = createGitProof(prefix);
  const store = path.join(proof.root, "store");
  vi.stubEnv("MAKE_DOCS_HOME", store);
  vi.stubEnv(HARNESS_CALLER_IDENTITY_ENV, "");
  // The product code runs git in this process. So this process gets the same isolation as each git child process:
  // no inherited git variable, and empty files in place of the global and the system git config of the person.
  for (const key of Object.keys(process.env)) if (/^GIT_/i.test(key)) vi.stubEnv(key, undefined as unknown as string);
  for (const key of ["GIT_CONFIG_GLOBAL", "GIT_CONFIG_SYSTEM", "GIT_CONFIG_NOSYSTEM", "GIT_CEILING_DIRECTORIES", "GIT_TERMINAL_PROMPT", "GIT_ALLOW_PROTOCOL"]) vi.stubEnv(key, proof.env[key]!);
  expect(process.env.GIT_CONFIG_GLOBAL).toBe(proof.globalConfig);
  expect(process.env.MAKE_DOCS_HOME).toBe(store);
  expect(store.startsWith(proof.root)).toBe(true);
  proof.env.MAKE_DOCS_HOME = store;
  proof.env[HARNESS_CALLER_IDENTITY_ENV] = "";
  // Each git action of a hook test waits for the background checkpoint that its hook started.
  const gitNoWait = proof.git;
  proof.git = (cwd, args, options) => {
    const started = Date.now() - 5;
    const result = gitNoWait(cwd, args, options);
    waitForHookRuns(store);
    const background = lastHookRunSince(store, started);
    return Object.assign(result, { hookOutput: background?.output ?? "", background }) as HookGitResult;
  };
  const binDir = proof.folder("install-bin");
  writeFileSync(path.join(binDir, "make-docs"), `#!/bin/sh\nexec ${shellQuote(process.execPath)} ${shellQuote(CLI)} "$@"\n`, { mode: 0o755 });
  return {
    proof,
    store,
    binDir,
    // On a computer with file modes the recorded `node` is the one of the helper folder, which holds only `node`.
    // The block adds the folder of the recorded `node` to the end of PATH, and the real folder of `node` can hold
    // an installed `make-docs`.
    command: { nodePath: shellPath(process.platform === "win32" ? process.execPath : path.join(proof.nodeDir, "node")), commandFile: shellPath(CLI) },
    onPath: envWithPath(proof, [binDir, currentPath(proof)].join(path.delimiter)),
    shortPath: envWithPath(proof, shortPathValue()),
    noStore: envWithPath(proof, [binDir, currentPath(proof)].join(path.delimiter), { MAKE_DOCS_HOME: path.join(proof.root, "no-store") }),
    noStoreDir: path.join(proof.root, "no-store"),
    gitNoWait,
    cleanup() {
      // No background checkpoint may run when the temporary folder goes.
      try { waitForHookRuns(store); } catch { /* The bound passed. The folder removal reports what is left. */ }
      vi.restoreAllMocks();
      vi.unstubAllEnvs();
      proof.cleanup();
    },
  };
}

/** Run the built CLI with the temporary Store. */
export function cli(fixture: HookFixture, cwd: string, args: string[], env: NodeJS.ProcessEnv = fixture.proof.env): Run {
  expect(env.MAKE_DOCS_HOME).toBe(fixture.store);
  const result = spawnSync(process.execPath, [CLI, ...args], { cwd, env, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

export interface SetupJson {
  status: string;
  failedCondition: string | null;
  project: { state: string };
  gitHooks: null | {
    selection: string;
    preferenceOn: boolean;
    newProject: boolean;
    status: string;
    message: string | null;
    hooksDir: string | null;
    hooks: Array<{ name: string; path: string; state: string; action: string; runs: string; notExecutable: boolean; block?: string; backup?: boolean; backupFile?: string }>;
    kept: Array<{ name: string; path: string; state: string }>;
    takeoverFrom: string | null;
    command: { nodePath: string; commandFile: string };
  };
}

/** Run project setup with no agent tool, in the non-interactive form. The result is the setup JSON. */
export function setup(fixture: HookFixture, repo: string, args: string[] = []): SetupJson {
  const result = cli(fixture, repo, ["setup", "--no-codex", "--no-claude-code", "--no-skills", ...args]);
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  return JSON.parse(result.stdout) as SetupJson;
}

/** Run `setup remove` with approval. The result is what a person sees. */
export function setupRemove(fixture: HookFixture, repo: string): string {
  const result = cli(fixture, repo, ["setup", "remove", "--yes"]);
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  return result.stdout;
}

/** The folder from which the machine step runs. The Store must be outside it, so it is not the temporary root. */
export function machineFolder(fixture: HookFixture): string {
  return fixture.proof.folder("machine-step");
}

/**
 * Bind a second work tree of a project as a separate checkout, with the reviewed step of the CLI, and set it up.
 * A work tree with a project ID and no installed record needs the explicit adopt choice (PRD 07 R-SETUP-CLI-14).
 */
export function setupSecondCheckout(fixture: HookFixture, folder: string, args: string[] = []): SetupJson {
  const preview = JSON.parse(cli(fixture, folder, ["project", "checkout", "preview", "--json"]).stdout) as { separateReviewDigest?: string; reviewDigest?: string };
  const apply = cli(fixture, folder, ["project", "checkout", "apply", "--review", String(preview.separateReviewDigest ?? preview.reviewDigest), "--json"]);
  expect(apply.status, `${apply.stdout}\n${apply.stderr}`).toBe(0);
  return setup(fixture, folder, ["--adopt", "--yes", ...args]);
}

/** Set the machine preference through the machine step of setup. */
export function setPreference(fixture: HookFixture, value: "yes" | "no"): Run {
  const result = cli(fixture, machineFolder(fixture), ["setup", "system", "--no-codex", "--no-claude-code", "--git-hooks-for-new-projects", value, "--yes", "--json"]);
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  return result;
}

export function readPreference(fixture: HookFixture): unknown {
  const file = path.join(fixture.store, "config.json");
  if (!existsSync(file)) return undefined;
  return (JSON.parse(readFileSync(file, "utf8")) as { settings?: Record<string, unknown> }).settings?.gitHooksForNewProjects;
}

/** Add the Make Docs files of the fixture project to a repository, and commit them. */
export function addProjectFiles(proof: GitProof, repo: string, folder = "."): void {
  const at = (relative: string) => (folder === "." ? relative : `${folder}/${relative}`);
  proof.write(repo, at(".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\nprojectName: aurora\n`);
  proof.write(repo, at(INDEX), INDEX_TEXT);
  proof.write(repo, at(P1), P1_TEXT);
  proof.git(repo, ["add", "-A"]);
  proof.git(repo, ["commit", "-q", "-m", "Add the project files"]);
}

/** Bind a checkout to the temporary Store. A second checkout of one project binds as a separate checkout. */
export function bind(fixture: HookFixture, projectRoot: string, options: { separate?: boolean } = {}): string {
  expect(process.env.MAKE_DOCS_HOME).toBe(fixture.store);
  const root = platform.describePath(projectRoot).canonicalPath;
  if (options.separate) registerSeparateInstallationCheckout(root, previewInstallationCheckoutMove(root, undefined, fixture.store).separateReviewDigest!, fixture.store);
  else getInstallationCheckoutId(root, fixture.store);
  return root;
}

export function checkpoint(fixture: HookFixture, root: string, args: string[] = []): WorkCheckpointResult {
  const result = cli(fixture, root, ["project", "checkpoint", "--target-root", root, "--json", ...args]);
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout) as WorkCheckpointResult;
}

export function units(fixture: HookFixture, root: string): WorkUnitRecord[] {
  return readWorkStore(root, (db) => listWorkUnits(db, PROJECT_ID), { storeRoot: fixture.store });
}

export function taskText(fixture: HookFixture, root: string): string | null {
  return units(fixture, root).find((unit) => unit.coordinate === TASK)?.body ?? null;
}

/** Install the four blocks through the product code, with the built CLI as the recorded command. */
export function installHooks(fixture: HookFixture, root: string, command: GitHookCommand = fixture.command, options: { explicit?: boolean } = {}): GitHookApplyResult {
  expect(process.env.MAKE_DOCS_HOME).toBe(fixture.store);
  return applyGitHooks({ projectRoot: root, storeRoot: fixture.store, appliedVersion: "test", command, ...(options.explicit ? { explicit: true } : {}) });
}

/**
 * A recorded command that does not exist, with the real `node`. The block runs the recorded command first, so a
 * test that needs the `make-docs` command from PATH installs the hooks with this one.
 */
export function goneCommand(fixture: HookFixture): GitHookCommand {
  return { nodePath: fixture.command.nodePath, commandFile: shellPath(path.join(fixture.proof.root, "gone", "make-docs.js")) };
}

/** A project in a new repository, bound, with its first sync done, and with the four hooks when asked. */
export function project(fixture: HookFixture, name = "aurora", options: { hooks?: boolean } = {}): string {
  const repo = fixture.proof.repo(name);
  addProjectFiles(fixture.proof, repo);
  const root = bind(fixture, repo);
  expect(checkpoint(fixture, root).firstSync).toBe(true);
  expect(taskText(fixture, root)).toBe("Build the parser.");
  if (options.hooks !== false) expect(installHooks(fixture, root).status).toBe("installed");
  return root;
}

export function editTask(proof: GitProof, repo: string, text: string, folder = "."): void {
  proof.write(repo, folder === "." ? P1 : `${folder}/${P1}`, P1_TEXT.replace("Build the parser.", text));
}

/** Add each change and commit, with the given environment. The result holds what git and the hooks printed. */
export function commitAll(fixture: HookFixture, repo: string, env: NodeJS.ProcessEnv = fixture.onPath, message = "Change a work file"): HookGitResult & { output: string } {
  fixture.proof.git(repo, ["add", "-A"]);
  const result = hookGit(fixture, repo, ["commit", "-q", "-m", message], { env, allowFailure: true });
  return { ...result, output: `${result.stdout}${result.stderr}` };
}

/** Run git with the hooks, wait for the background checkpoint, and give what that checkpoint printed to nowhere. */
export function hookGit(fixture: HookFixture, cwd: string, args: string[], options?: { allowFailure?: boolean; env?: NodeJS.ProcessEnv }): HookGitResult {
  return fixture.proof.git(cwd, args, options) as HookGitResult;
}

export function hookFile(proof: GitProof, repo: string, name: GitHookName): string {
  return path.join(proof.hooksDir(repo), name);
}

export function hookTexts(proof: GitProof, repo: string): Record<string, string | null> {
  return Object.fromEntries(GIT_HOOK_NAMES.map((name) => {
    const file = hookFile(proof, repo, name);
    return [name, existsSync(file) ? readFileSync(file, "utf8") : null];
  }));
}

/** A helper process: take the Store write lock, say so, and let go when the test closes its input. */
const HOLDER = `
const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync(process.argv[1]);
db.exec("BEGIN IMMEDIATE");
process.stdout.write("held\\n");
process.stdin.on("end", () => { db.exec("COMMIT"); db.close(); });
process.stdin.resume();
`;

export function holdStore(fixture: HookFixture): Promise<ChildProcessWithoutNullStreams> {
  expect(fixture.proof.env.MAKE_DOCS_HOME).toBe(fixture.store);
  const holder = spawn(process.execPath, ["-e", HOLDER, getStoreDatabasePath(fixture.store)], { cwd: fixture.proof.root, env: fixture.proof.env });
  return new Promise((resolve, reject) => {
    let errors = "";
    holder.stdout.on("data", (chunk) => { if (String(chunk).includes("held")) resolve(holder); });
    holder.stderr.on("data", (chunk) => { errors += String(chunk); });
    holder.on("error", reject);
    holder.on("close", (status) => reject(new Error(`The lock helper ended with status ${status}. ${errors}`)));
  });
}

export function releaseStore(holder: ChildProcessWithoutNullStreams): Promise<void> {
  return new Promise((resolve) => {
    holder.on("close", () => resolve());
    holder.stdin.end();
  });
}

export const STORE_LOCK_FILES = ["removal.lock", "installation-bootstrap.lock", "installation-lease-recovery.lock"] as const;

export interface HeldLockFile { owner: ChildProcessWithoutNullStreams; file: string }

/**
 * Hold one named lock file of the temporary Store, as a live Store owner does: the file names a helper process
 * that still runs. The Store code then waits for that owner. The helper does nothing and ends when the test
 * closes its input.
 */
export function holdLockFile(fixture: HookFixture, name: string): Promise<HeldLockFile> {
  expect(fixture.proof.env.MAKE_DOCS_HOME).toBe(fixture.store);
  const file = path.join(fixture.store, name);
  expect(file.startsWith(fixture.proof.root)).toBe(true);
  const owner = spawn(process.execPath, ["-e", "process.stdout.write('alive\\n'); process.stdin.on('end', () => process.exit(0)); process.stdin.resume();"], { cwd: fixture.proof.root, env: fixture.proof.env });
  return new Promise((resolve, reject) => {
    owner.on("error", reject);
    owner.stdout.on("data", (chunk) => {
      if (!String(chunk).includes("alive")) return;
      writeFileSync(file, JSON.stringify({ token: "held-by-a-test", pid: owner.pid, hostname: platform.hostname, startedAt: new Date().toISOString() }), { mode: 0o600 });
      resolve({ owner, file });
    });
  });
}

export function releaseLockFile(held: HeldLockFile): Promise<void> {
  return new Promise((resolve) => {
    held.owner.on("close", () => { rmSync(held.file, { force: true }); resolve(); });
    held.owner.stdin.end();
  });
}

/** One line for the run log, as the P4 proofs write it, with the platform and the git version. */
export function recordHookFact(proof: Pick<GitProof, "gitVersion">, fact: string, seen: unknown): void {
  process.stdout.write(`W35-R0-P5-GIT-HOOK ${JSON.stringify({ platform: process.platform, git: proof.gitVersion, fact, seen })}\n`);
}
