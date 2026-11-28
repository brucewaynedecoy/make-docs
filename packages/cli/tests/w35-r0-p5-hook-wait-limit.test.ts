import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CHECKPOINT_GIT_HOOK_BACKGROUND_STORE_WAIT_MS, CHECKPOINT_GIT_HOOK_STORE_WAIT_MS, CHECKPOINT_SHORT_COMMAND_LINE, workCheckpoint } from "../src/operations/work/work-queue/checkpoint";
import { GIT_HOOK_RUN_ENV, GIT_HOOK_RUN_FOREGROUND } from "../src/store/git-hook-runs";
import { WORK_REMINDER_LINE } from "../src/operations/work/work-queue/reminder";
import { workAuthority } from "../src/operations/work/work-queue/queue";
import { spawn } from "node:child_process";
import { acquireStoreAccess, formatStoreIssue, waitedSecondsText, STORE_BUSY_TIMEOUT_MS, STORE_OWNER_WAIT_MS, storeBusyTimeoutMs, storeOwnerWaitMs, StoreUnavailableError, waitForStoreAccessToDrain, withStoreWaitLimit } from "../src/store/database";
import { cloneOf, shellQuote } from "./git-hook-proof";
import {
  CLI,
  P1,
  P1_TEXT,
  addProjectFiles,
  bind,
  checkpoint,
  cli,
  commitAll,
  createHookFixture,
  editTask,
  goneCommand,
  holdLockFile,
  holdStore,
  hookRunState,
  installHooks,
  lastHookRunSince,
  project,
  recordHookFact,
  releaseLockFile,
  releaseStore,
  STORE_LOCK_FILES,
  taskText,
  waitForHookRuns,
  type HookFixture,
} from "./git-hook-setup";
import type { GitHookLastRun } from "../src/store/git-hook-runs";

/**
 * W35 R0 P5 Stage 6 (T35 to T37): the waits for the Store of a run that a git
 * hook starts. The owner decided on 2026-11-28 (OD-P5-1 to OD-P5-5) that a git
 * hook starts the checkpoint in the background, and that the short limit of
 * 1,000 ms holds only in the foreground fallback.
 *
 * - A background run waits at most 5,000 ms at each wait for the Store, which
 *   is the normal busy time. It never waits the 30,000 ms of a live Store
 *   owner. The git action is not delayed.
 * - A run in the foreground fallback waits at most 1,000 ms at each wait. The
 *   bound of those tests is a number: the git action may take at most
 *   `HELD_STORE_ADDED_BOUND_MS` longer than the same action with a free Store.
 *   It is the limit and a margin for a shared test machine, and it is less
 *   than the busy time of the Store.
 *
 * `w35-r0-p5-hook-background.test.ts` holds the background start, the survival
 * proof, the overlap proof, and the fallback rule.
 */
const HELD_STORE_ADDED_BOUND_MS = 3_500;

/**
 * The upper time bound of one git action with the installed hook while a live process holds a lock file of the
 * Store: the limit of 1,000 ms, the normal cost of the action with the hook, and a margin for a slow shared test
 * machine. It is 4,500 ms, far below the owner wait time of 30,000 ms that the action took before the fix.
 */
const HELD_LOCK_RUN_BOUND_MS = CHECKPOINT_GIT_HOOK_STORE_WAIT_MS + HELD_STORE_ADDED_BOUND_MS;

/** The most time that a git action with the hooks may take when its hook only starts a background checkpoint. It is far below each wait for the Store. */
const BACKGROUND_COMMIT_BOUND_MS = 900;

/**
 * The upper time bound of a background run that meets one held wait for the Store: the bound of 5,000 ms, the
 * cost of the run, and a margin for a slow shared test machine. It is far below the owner wait time of 30,000 ms.
 */
const BACKGROUND_HELD_RUN_BOUND_MS = CHECKPOINT_GIT_HOOK_BACKGROUND_STORE_WAIT_MS + 4_000;

/** The environment of a run in the foreground fallback: the value that the start code sets for it. */
function foregroundEnv(): NodeJS.ProcessEnv {
  return { ...fixture.proof.env, [GIT_HOOK_RUN_ENV]: GIT_HOOK_RUN_FOREGROUND };
}

let fixture: HookFixture;

beforeEach(() => {
  fixture = createHookFixture("make-docs-w35-p5-wait-");
});

afterEach(() => {
  fixture.cleanup();
});

function timed<T>(run: () => T): { result: T; ms: number } {
  const started = Date.now();
  const result = run();
  return { result, ms: Date.now() - started };
}

describe("W35 R0 P5 the wait limit of the Store code (T36, R9, R11)", () => {
  it("the limit is 1,000 ms, it is less than the busy time, and it holds only inside the call that takes it", async () => {
    expect(CHECKPOINT_GIT_HOOK_STORE_WAIT_MS).toBe(1_000);
    // A background run waits the normal busy time of the Store at each wait.
    expect(CHECKPOINT_GIT_HOOK_BACKGROUND_STORE_WAIT_MS).toBe(STORE_BUSY_TIMEOUT_MS);
    expect(CHECKPOINT_GIT_HOOK_BACKGROUND_STORE_WAIT_MS).toBe(5_000);
    expect(withStoreWaitLimit(CHECKPOINT_GIT_HOOK_BACKGROUND_STORE_WAIT_MS, () => [storeBusyTimeoutMs(), storeOwnerWaitMs()])).toEqual([5_000, 5_000]);
    expect(CHECKPOINT_GIT_HOOK_STORE_WAIT_MS).toBeLessThan(STORE_BUSY_TIMEOUT_MS);
    expect(HELD_STORE_ADDED_BOUND_MS).toBeLessThan(STORE_BUSY_TIMEOUT_MS);
    expect(storeBusyTimeoutMs()).toBe(STORE_BUSY_TIMEOUT_MS);
    expect(withStoreWaitLimit(1_000, () => storeBusyTimeoutMs())).toBe(1_000);
    // The limit follows the call across an await, and it never goes above the busy time.
    expect(await withStoreWaitLimit(250, async () => { await new Promise((resolve) => setTimeout(resolve, 5)); return storeBusyTimeoutMs(); })).toBe(250);
    expect(withStoreWaitLimit(60_000, () => storeBusyTimeoutMs())).toBe(STORE_BUSY_TIMEOUT_MS);
    expect(storeBusyTimeoutMs()).toBe(STORE_BUSY_TIMEOUT_MS);
  });
});

describe("W35 R0 P5 the wait time in a Store message", () => {
  it("names whole seconds, rounded down, so a message never names more time than passed", () => {
    expect([waitedSecondsText(5_009), waitedSecondsText(1_010), waitedSecondsText(5_000), waitedSecondsText(1_999), waitedSecondsText(30_177), waitedSecondsText(300), waitedSecondsText(0)])
      .toEqual(["5 seconds", "1 second", "5 seconds", "1 second", "30 seconds", "less than 1 second", "less than 1 second"]);
    expect(formatStoreIssue({ code: "contention-timeout", path: "/store/removal.lock", operation: "wait for Store sessions", retryable: true, attempts: 1, waitedMs: 5_009, cause: "A live process owns it." })).toContain("Make Docs waited 5 seconds to wait for Store sessions");
  });
});

/** Run `fn`, which must end with a Store contention error, and give the time that it took. */
function contentionMs(fn: () => unknown): number {
  const started = Date.now();
  let error: unknown = null;
  try { fn(); } catch (caught) { error = caught; }
  expect(error).toBeInstanceOf(StoreUnavailableError);
  expect((error as StoreUnavailableError).issue.code).toBe("contention-timeout");
  return Date.now() - started;
}

describe("W35 R0 P5 the limit bounds each wait for a live Store owner, and it reaches no other caller (review finding M1)", () => {
  it("outside the limit a caller waits the owner wait time, and inside the limit each owner wait is the limit", () => {
    expect(STORE_OWNER_WAIT_MS).toBe(30_000);
    expect(storeOwnerWaitMs()).toBe(STORE_OWNER_WAIT_MS);
    expect(withStoreWaitLimit(CHECKPOINT_GIT_HOOK_STORE_WAIT_MS, () => storeOwnerWaitMs())).toBe(1_000);
    expect(storeOwnerWaitMs()).toBe(STORE_OWNER_WAIT_MS);
  });

  it.each(STORE_LOCK_FILES)("a held %s ends the wait for a Store session at the limit, and a caller with no limit waits its full time", async (name) => {
    project(fixture, "aurora", { hooks: false });
    const held = await holdLockFile(fixture, name);
    try {
      // Inside the limit: the wait ends at the limit, also when the caller gave a longer time.
      const limited = contentionMs(() => withStoreWaitLimit(300, () => acquireStoreAccess(fixture.store)));
      expect(limited).toBeGreaterThanOrEqual(250);
      expect(limited).toBeLessThan(1_500);
      expect(contentionMs(() => withStoreWaitLimit(300, () => acquireStoreAccess(fixture.store, false, 20_000)))).toBeLessThan(1_500);
      // Outside the limit: the caller waits the time that it gave. Nothing cut it.
      const free = contentionMs(() => acquireStoreAccess(fixture.store, false, 2_000));
      expect(free).toBeGreaterThanOrEqual(1_900);
    } finally {
      await releaseLockFile(held);
    }
    // With the owner gone and its file removed, a session opens at once.
    acquireStoreAccess(fixture.store)();
  }, 60_000);

  it("the wait for other Store sessions to end is cut inside the limit only", async () => {
    project(fixture, "aurora", { hooks: false });
    // Another live process holds a shared session of the Store.
    const session = spawn(process.execPath, ["--input-type=module", "-e", `import { DatabaseSync } from "node:sqlite"; process.stdout.write("ready\\n"); process.stdin.on("end", () => process.exit(0)); process.stdin.resume();`], { cwd: fixture.proof.root, env: fixture.proof.env });
    await new Promise<void>((resolve) => session.stdout.on("data", () => resolve()));
    const sessionDir = path.join(fixture.store, "store-access.lock");
    const release = acquireStoreAccess(fixture.store);
    // Give this session to the helper process, as a session of another live process.
    const own = (await import("node:fs")).readdirSync(sessionDir);
    expect(own.length).toBeGreaterThan(0);
    const leaseFile = path.join(sessionDir, own[0]!);
    const lease = JSON.parse(readFileSync(leaseFile, "utf8")) as Record<string, unknown>;
    writeFileSync(leaseFile, JSON.stringify({ ...lease, pid: session.pid }));
    try {
      expect(contentionMs(() => withStoreWaitLimit(300, () => waitForStoreAccessToDrain(fixture.store)))).toBeLessThan(1_500);
      expect(contentionMs(() => waitForStoreAccessToDrain(fixture.store, 2_000))).toBeGreaterThanOrEqual(1_900);
    } finally {
      writeFileSync(leaseFile, JSON.stringify(lease));
      release();
      await new Promise<void>((resolve) => { session.on("close", () => resolve()); session.stdin.end(); });
    }
  }, 60_000);
});

/** The time that a background run took, from its start to its end, in milliseconds. */
function runMs(run: GitHookLastRun | null): number {
  expect(run).not.toBeNull();
  return Date.parse(run!.endedAt) - Date.parse(run!.startedAt);
}

/** Run git with the hooks and do not wait for the background checkpoint. The time is the time of the git action alone. */
function gitTimed(cwd: string, args: string[]): { result: { status: number | null; stdout: string; stderr: string }; ms: number; since: number } {
  const since = Date.now() - 5;
  const run = timed(() => fixture.gitNoWait(cwd, args, { env: fixture.onPath, allowFailure: true }));
  return { ...run, since };
}

describe.skipIf(!existsSync(CLI))("W35 R0 P5 a git action with the installed hooks while a live process holds a lock file of the Store (review finding M1)", () => {
  it.each(STORE_LOCK_FILES)("with a held %s, a commit returns at once and prints nothing, and its background run waits 5,000 ms and not 30,000 ms", async (name) => {
    const root = project(fixture);
    fixture.proof.write(root, "warm.txt", "warm\n");
    commitAll(fixture, root);
    editTask(fixture.proof, root, "Build the new parser.");
    fixture.proof.git(root, ["add", "-A"]);
    const held = await holdLockFile(fixture, name);
    let commit;
    let background;
    let foreground;
    try {
      commit = gitTimed(root, ["commit", "-q", "-m", "Change a work file"]);
      waitForHookRuns(fixture.store);
      background = lastHookRunSince(fixture.store, commit.since);
      // A run in the foreground fallback has the short limit: it ends after about 1,000 ms.
      foreground = timed(() => cli(fixture, root, ["project", "checkpoint", "--event", "commit", "--target-root", root], foregroundEnv()));
    } finally {
      await releaseLockFile(held);
    }
    recordHookFact(fixture.proof, "lock-file-held", { lock: name, commitMs: commit.ms, backgroundRunMs: runMs(background), foregroundRunMs: foreground.ms, backgroundBoundMs: BACKGROUND_HELD_RUN_BOUND_MS, foregroundBoundMs: HELD_LOCK_RUN_BOUND_MS });
    // The git action did not wait for the lock.
    expect(`${commit.result.status}:${commit.result.stdout}${commit.result.stderr}`).toBe("0:");
    expect(commit.ms).toBeLessThan(BACKGROUND_COMMIT_BOUND_MS);
    // The background run waited the normal time of 5,000 ms and gave up. Before the fix of the review a run waited 30,000 ms here.
    expect(background).toMatchObject({ outcome: "ran", exitCode: 1, output: "" });
    expect(background!.errorOutput).toContain("store-unavailable");
    expect(runMs(background)).toBeGreaterThanOrEqual(CHECKPOINT_GIT_HOOK_BACKGROUND_STORE_WAIT_MS - 100);
    expect(runMs(background)).toBeLessThan(BACKGROUND_HELD_RUN_BOUND_MS);
    // The foreground fallback run waited the short limit.
    expect(foreground.result.status).toBe(1);
    expect(foreground.ms).toBeGreaterThanOrEqual(CHECKPOINT_GIT_HOOK_STORE_WAIT_MS - 100);
    expect(foreground.ms).toBeLessThan(HELD_LOCK_RUN_BOUND_MS);
    // Nothing was imported. With the lock free, the next commit imports the file.
    expect(taskText(fixture, root)).toBe("Build the parser.");
    fixture.proof.write(root, "next.txt", "next\n");
    expect(commitAll(fixture, root).hookOutput).toBe("Checkpoint: 1 file imported.\n");
  }, 120_000);

  it("a direct run, and a trigger run with an event that no git hook gives, keep the owner wait time while a lock file is held", async () => {
    const root = project(fixture);
    const held = await holdLockFile(fixture, "removal.lock");
    const runs = [["project", "checkpoint", "--target-root", root], ["project", "checkpoint", "--event", "turn-end", "--target-root", root], ["work", "status", "--target-root", root]]
      .map((args) => {
        const child = spawn(process.execPath, [CLI, ...args], { cwd: root, env: fixture.proof.env, stdio: "ignore" });
        const done = new Promise<number | null>((resolve) => child.on("close", (status) => resolve(status)));
        return { args, child, done, ended: false };
      });
    for (const run of runs) void run.done.then(() => { run.ended = true; });
    try {
      // Well after the limit of a background run of a git hook, each of these commands still waits for the owner.
      await new Promise((resolve) => setTimeout(resolve, CHECKPOINT_GIT_HOOK_BACKGROUND_STORE_WAIT_MS + 1_500));
      expect(runs.map((run) => run.ended)).toEqual([false, false, false]);
    } finally {
      await releaseLockFile(held);
    }
    // The owner let go inside the wait time, so each command then ends well.
    expect(await Promise.all(runs.map((run) => run.done))).toEqual([0, 0, 0]);
  }, 120_000);
});

describe.skipIf(!existsSync(CLI))("W35 R0 P5 a git action with the installed hooks while another process holds the Store (T36, T37; A62l, A62r, A62s, A62t)", () => {
  it("a commit returns at once and prints nothing, its background run waits 5,000 ms and gives up, and the next commit imports the file", async () => {
    const root = project(fixture);
    // The normal time of a commit with the hook, with a free Store and nothing due.
    fixture.proof.write(root, "warm.txt", "warm\n");
    commitAll(fixture, root);
    fixture.proof.write(root, "normal.txt", "normal\n");
    fixture.proof.git(root, ["add", "-A"]);
    const normal = gitTimed(root, ["commit", "-q", "-m", "Normal"]);
    waitForHookRuns(fixture.store);
    expect(`${normal.result.status}:${normal.result.stdout}${normal.result.stderr}`).toBe("0:");

    editTask(fixture.proof, root, "Build the new parser.");
    fixture.proof.git(root, ["add", "-A"]);
    const holder = await holdStore(fixture);
    let held;
    let background;
    try {
      held = gitTimed(root, ["commit", "-q", "-m", "Change a work file"]);
      waitForHookRuns(fixture.store);
      background = lastHookRunSince(fixture.store, held.since);
    } finally {
      await releaseStore(holder);
    }
    recordHookFact(fixture.proof, "store-held-commit", { exit: held.result.status, output: `${held.result.stdout}${held.result.stderr}`, normalMs: normal.ms, heldMs: held.ms, backgroundRunMs: runMs(background), commitBoundMs: BACKGROUND_COMMIT_BOUND_MS });
    expect(`${held.result.status}:${held.result.stdout}${held.result.stderr}`).toBe("0:");
    // The commit was not delayed by the held Store.
    expect(held.ms).toBeLessThan(BACKGROUND_COMMIT_BOUND_MS);
    // The background run waited the normal busy time of the Store, and then it gave up.
    expect(background).toMatchObject({ outcome: "ran", exitCode: 1, output: "" });
    expect(runMs(background)).toBeGreaterThanOrEqual(CHECKPOINT_GIT_HOOK_BACKGROUND_STORE_WAIT_MS - 100);
    expect(runMs(background)).toBeLessThan(BACKGROUND_HELD_RUN_BOUND_MS);
    // The commit is done, the work tree is as git left it, and the file was not imported.
    expect(fixture.proof.git(root, ["status", "--porcelain"]).stdout).toBe("");
    expect(taskText(fixture, root)).toBe("Build the parser.");
    // Until the next checkpoint, `work status` and the reminder line count the file as waiting.
    const status = JSON.parse(cli(fixture, root, ["work", "status", "--target-root", root, "--json"]).stdout) as { filesWaitingForImport: string[] };
    expect(status.filesWaitingForImport).toEqual([P1]);
    expect(cli(fixture, root, ["project", "state", "status", "--target-root", root]).stderr).toContain(WORK_REMINDER_LINE);
    // The next commit imports the file.
    fixture.proof.write(root, "next.txt", "next\n");
    const next = commitAll(fixture, root);
    expect([next.output, next.hookOutput]).toEqual(["", "Checkpoint: 1 file imported.\n"]);
    expect(taskText(fixture, root)).toBe("Build the new parser.");
  }, 120_000);

  it("when the other process frees the Store inside the wait, the background run waits and then syncs, and the commit is not delayed", async () => {
    const root = project(fixture);
    editTask(fixture.proof, root, "Build the new parser.");
    fixture.proof.git(root, ["add", "-A"]);
    const holder = await holdStore(fixture);
    let held;
    try {
      held = gitTimed(root, ["commit", "-q", "-m", "Change a work file"]);
      // The Store stays held for a time that is longer than the short limit and shorter than the normal wait.
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    } finally {
      await releaseStore(holder);
    }
    waitForHookRuns(fixture.store);
    const background = lastHookRunSince(fixture.store, held.since);
    recordHookFact(fixture.proof, "store-held-then-free", { commitMs: held.ms, backgroundRunMs: runMs(background), output: background?.output });
    expect(`${held.result.status}:${held.result.stdout}${held.result.stderr}`).toBe("0:");
    expect(held.ms).toBeLessThan(BACKGROUND_COMMIT_BOUND_MS);
    expect(background).toMatchObject({ outcome: "ran", exitCode: 0, output: "Checkpoint: 1 file imported.\n" });
    expect(runMs(background)).toBeGreaterThanOrEqual(1_500);
    expect(taskText(fixture, root)).toBe("Build the new parser.");
  }, 120_000);

  it("after a commit whose background run gave up, a direct run of the checkpoint imports the file", async () => {
    const root = project(fixture);
    editTask(fixture.proof, root, "Build the new parser.");
    fixture.proof.git(root, ["add", "-A"]);
    const holder = await holdStore(fixture);
    let held;
    try {
      held = fixture.proof.git(root, ["commit", "-q", "-m", "Change a work file"], { env: fixture.onPath, allowFailure: true });
    } finally {
      await releaseStore(holder);
    }
    expect(`${held.status}:${held.stdout}${held.stderr}`).toBe("0:");
    expect(taskText(fixture, root)).toBe("Build the parser.");
    expect(checkpoint(fixture, root).imported).toEqual([P1]);
    expect(taskText(fixture, root)).toBe("Build the new parser.");
  }, 120_000);

  it("a true merge returns at once and prints nothing, its background run gives up, and the next checkpoint imports the pulled file", async () => {
    const origin = fixture.proof.bare("origin.git");
    const seed = fixture.proof.repo("seed");
    addProjectFiles(fixture.proof, seed);
    fixture.proof.git(seed, ["remote", "add", "origin", origin]);
    fixture.proof.git(seed, ["push", "-q", "origin", "main"]);
    const mine = bind(fixture, cloneOf(fixture.proof, origin, "mine"));
    expect(checkpoint(fixture, mine).firstSync).toBe(true);
    installHooks(fixture, mine);
    const other = cloneOf(fixture.proof, origin, "other");
    const push = (text: string, file: string) => {
      fixture.proof.git(other, ["pull", "-q", "--no-rebase", "--no-edit"]);
      if (file === P1) editTask(fixture.proof, other, text); else fixture.proof.write(other, file, text);
      fixture.proof.git(other, ["add", "-A"]);
      fixture.proof.git(other, ["commit", "-q", "-m", `Change ${file}`]);
      fixture.proof.git(other, ["push", "-q", "origin", "main"]);
    };
    // The normal time of a true merge with the hook, with a free Store and nothing due.
    push("one\n", "one.txt");
    fixture.proof.commit(mine, "mine-1.txt", "mine\n", "A local commit");
    const normal = gitTimed(mine, ["pull", "-q", "--no-rebase", "--no-edit"]);
    waitForHookRuns(fixture.store);
    expect(`${normal.result.status}:${normal.result.stdout}${normal.result.stderr}`).toBe("0:");

    push("Build the pulled parser.", P1);
    fixture.proof.commit(mine, "mine-2.txt", "mine\n", "A second local commit");
    const holder = await holdStore(fixture);
    let held;
    let background;
    try {
      held = gitTimed(mine, ["pull", "-q", "--no-rebase", "--no-edit"]);
      waitForHookRuns(fixture.store);
      background = lastHookRunSince(fixture.store, held.since);
    } finally {
      await releaseStore(holder);
    }
    recordHookFact(fixture.proof, "store-held-merge", { exit: held.result.status, output: `${held.result.stdout}${held.result.stderr}`, normalMs: normal.ms, heldMs: held.ms, backgroundRunMs: runMs(background) });
    expect(`${held.result.status}:${held.result.stdout}${held.result.stderr}`).toBe("0:");
    // A pull also fetches, so its bound is the normal time of the same pull and the bound of a hook start.
    expect(held.ms - normal.ms).toBeLessThan(BACKGROUND_COMMIT_BOUND_MS);
    expect(background).toMatchObject({ outcome: "ran", exitCode: 1 });
    expect(readFileSync(path.join(mine, P1), "utf8")).toContain("Build the pulled parser.");
    expect(taskText(fixture, mine)).toBe("Build the parser.");
    expect(checkpoint(fixture, mine).imported).toEqual([P1]);
    expect(taskText(fixture, mine)).toBe("Build the pulled parser.");
  }, 180_000);

  it("a direct run waits the busy time of the Store, a foreground run for a commit waits the short limit, a background run waits the normal time, and a run for a branch change does not wait", async () => {
    const root = project(fixture);
    editTask(fixture.proof, root, "Build the new parser.");
    const holder = await holdStore(fixture);
    let direct;
    let branchChange;
    let trigger;
    let fallback;
    let background;
    try {
      trigger = timed(() => cli(fixture, root, ["project", "checkpoint", "--event", "commit", "--target-root", root]));
      fallback = timed(() => cli(fixture, root, ["project", "checkpoint", "--event", "commit", "--target-root", root], foregroundEnv()));
      // The process of a background run, started here by hand with the value that the start code gives it.
      background = timed(() => cli(fixture, root, ["project", "checkpoint", "--event", "commit", "--target-root", root], { ...fixture.proof.env, [GIT_HOOK_RUN_ENV]: "background:a-test-token" }));
      branchChange = timed(() => cli(fixture, root, ["project", "checkpoint", "--event", "branch-change", "--target-root", root]));
      direct = timed(() => cli(fixture, root, ["project", "checkpoint", "--target-root", root]));
    } finally {
      await releaseStore(holder);
    }
    const round = (ms: number) => Math.round(ms / 100) * 100;
    recordHookFact(fixture.proof, "store-held-direct-run", { directExit: direct.result.status, directMs: round(direct.ms), triggerExit: trigger.result.status, triggerMs: round(trigger.ms), fallbackMs: round(fallback.ms), backgroundMs: round(background.ms), branchChangeMs: round(branchChange.ms) });
    const waited = (run: { result: { stderr: string } }) => (JSON.parse(run.result.stderr.trim()) as { details: { issue: { code: string; waitedMs: number } } }).details.issue;
    // The direct run keeps the busy time of the Store.
    expect(direct.result.status).toBe(1);
    expect(direct.ms).toBeGreaterThanOrEqual(STORE_BUSY_TIMEOUT_MS - 100);
    expect(waited(direct).waitedMs).toBe(STORE_BUSY_TIMEOUT_MS);
    // A trigger run for a commit in the foreground keeps its typed Store result and its exit code 1. The hook block hides both.
    for (const run of [trigger, fallback]) {
      expect(run.result.status).toBe(1);
      expect(run.result.stdout).toBe("");
      expect(waited(run)).toMatchObject({ code: "contention-timeout", waitedMs: CHECKPOINT_GIT_HOOK_STORE_WAIT_MS });
      expect(run.ms).toBeLessThan(direct.ms);
    }
    // A background run waits the normal busy time, and not the short limit.
    expect(background.result.status).toBe(1);
    expect(waited(background)).toMatchObject({ code: "contention-timeout", waitedMs: CHECKPOINT_GIT_HOOK_BACKGROUND_STORE_WAIT_MS });
    expect(background.ms).toBeGreaterThanOrEqual(CHECKPOINT_GIT_HOOK_BACKGROUND_STORE_WAIT_MS - 100);
    // The check of a branch change only reads, so it does not wait for the write lock.
    expect(branchChange.result.status).toBe(0);
    expect(branchChange.result.stdout).toBe(`Checkpoint: 1 file waits.\n${CHECKPOINT_SHORT_COMMAND_LINE}\n`);
    expect(taskText(fixture, root)).toBe("Build the parser.");
  }, 120_000);

  it("a first sync that has the Store is not cut by a limit: a commit whose hook run is the first sync imports every work file", () => {
    const repo = fixture.proof.repo("many");
    addProjectFiles(fixture.proof, repo);
    // More work files, so the first sync does real work.
    for (let index = 2; index <= 60; index += 1) {
      const number = String(index).padStart(2, "0");
      fixture.proof.write(repo, `docs/work/2042-06-01-w1-r0-aurora/${number}-phase.md`, P1_TEXT.replace("Phase 1: First", `Phase ${index}: More`).replace("W1 R0 P1", `W1 R0 P${index}`).replace("# Phase 1: First", `# Phase ${index}: More`));
    }
    const root = bind(fixture, repo);
    installHooks(fixture, root);
    const result = commitAll(fixture, root);
    expect(result.status).toBe(0);
    expect([result.output, result.hookOutput]).toEqual(["", "Checkpoint: 61 files imported.\n"]);
    expect(taskText(fixture, root)).toBe("Build the parser.");
  }, 120_000);
});

describe.skipIf(!existsSync(CLI))("W35 R0 P5 the run of each hook of a git action (T35; A62q, A62u)", () => {
  it("a commit, a rewrite, and a true merge print nothing, and the store holds each edit after the background run ended", () => {
    const origin = fixture.proof.bare("origin.git");
    const seed = fixture.proof.repo("seed");
    addProjectFiles(fixture.proof, seed);
    fixture.proof.git(seed, ["remote", "add", "origin", origin]);
    fixture.proof.git(seed, ["push", "-q", "origin", "main"]);
    const mine = bind(fixture, cloneOf(fixture.proof, origin, "mine"));
    checkpoint(fixture, mine);
    installHooks(fixture, mine);
    const other = cloneOf(fixture.proof, origin, "other");

    // A commit: git prints nothing from the hook, and the background run imported the file.
    editTask(fixture.proof, mine, "Build parser A.");
    const commit = commitAll(fixture, mine);
    expect([commit.output, commit.hookOutput]).toEqual(["", "Checkpoint: 1 file imported.\n"]);
    expect(taskText(fixture, mine)).toBe("Build parser A.");

    // A rewrite: an amended commit with another change of the work file.
    editTask(fixture.proof, mine, "Build parser B.");
    fixture.proof.git(mine, ["add", "-A"]);
    const amend = fixture.proof.git(mine, ["commit", "-q", "--amend", "-m", "Amended"], { env: fixture.onPath });
    expect(`${amend.stdout}${amend.stderr}`).toBe("");
    expect(taskText(fixture, mine)).toBe("Build parser B.");
    fixture.proof.git(mine, ["push", "-q", "origin", "main"]);

    // A true merge: another clone pushed an edit of the work file, and this clone has a local commit.
    fixture.proof.git(other, ["pull", "-q", "--no-rebase", "--no-edit"]);
    fixture.proof.write(other, P1, P1_TEXT.replace("Build the parser.", "Build parser C."));
    fixture.proof.git(other, ["add", "-A"]);
    fixture.proof.git(other, ["commit", "-q", "-m", "Edit in the other clone"]);
    fixture.proof.git(other, ["push", "-q", "origin", "main"]);
    fixture.proof.commit(mine, "mine.txt", "mine\n", "A local commit");
    const merge = fixture.proof.git(mine, ["pull", "-q", "--no-rebase", "--no-edit"], { env: fixture.onPath });
    expect(`${merge.stdout}${merge.stderr}`).toBe("");
    expect(taskText(fixture, mine)).toBe("Build parser C.");
    expect(fixture.proof.git(mine, ["status", "--porcelain"]).stdout).toBe("");
    // Each background run ended: no run file names a live process, and a direct run finds nothing due.
    expect(hookRunState(fixture, mine).busy).toBe(false);
    expect(checkpoint(fixture, mine).nothingDue).toBe(true);
    recordHookFact(fixture.proof, "background-run", { commit: "no line; the store has the edit after the run", rewrite: "no line; the store has the edit after the run", merge: "no line; the store has the edit after the run" });
  }, 120_000);

  it("an amended commit runs two hooks, and each one starts the checkpoint, because the hook after a rewrite does not skip the amend case", () => {
    // The recorded command file is gone, so each hook uses the command on PATH, which records each call.
    const root = project(fixture, "aurora", { hooks: false });
    installHooks(fixture, root, goneCommand(fixture));
    // A command file on PATH that records each call and then runs the built CLI.
    const calls = path.join(fixture.proof.root, "calls.log");
    writeFileSync(path.join(fixture.binDir, "make-docs"), `#!/bin/sh\nprintf '%s\\n' "$*" >> ${shellQuote(calls)}\nexec ${shellQuote(process.execPath)} ${shellQuote(CLI)} "$@"\n`, { mode: 0o755 });
    editTask(fixture.proof, root, "Build the new parser.");
    commitAll(fixture, root);
    writeFileSync(calls, "");
    editTask(fixture.proof, root, "Build the newest parser.");
    fixture.proof.git(root, ["add", "-A"]);
    const amend = fixture.proof.git(root, ["commit", "-q", "--amend", "-m", "Amended"], { env: fixture.onPath });
    expect(amend.status).toBe(0);
    const seen = readFileSync(calls, "utf8").trim().split("\n");
    expect(seen).toHaveLength(2);
    for (const call of seen) expect(call.startsWith("project checkpoint --event commit --target-root ")).toBe(true);
    // Neither hook printed a line. After the background runs, the store holds the amended text.
    expect(`${amend.stdout}${amend.stderr}`).toBe("");
    expect(taskText(fixture, root)).toBe("Build the newest parser.");
    recordHookFact(fixture.proof, "amend-starts-two-checkpoints", { calls: seen.length, output: "no line" });
  });
});

describe("W35 R0 P5 the short output of a trigger run for a git event (T3, T26; A50, A62g)", () => {
  it("a caller with read access only gets the one line with the count of waiting files and the command", () => {
    const root = project(fixture, "aurora", { hooks: false });
    editTask(fixture.proof, root, "Build the new parser.");
    const authority = workAuthority(root, fixture.store, null);
    expect(authority.mode).toBe("store");
    for (const event of ["commit", "branch-change"] as const) {
      const result = workCheckpoint(root, { storeRoot: fixture.store, now: new Date() }, { event, access: "read", readReason: "read-access-only", authority });
      expect(result.lines).toEqual(["Checkpoint: 1 file waits. This caller has read access only, so a caller with write access must run make-docs project checkpoint."]);
      expect(result.summary.includes("\n")).toBe(false);
      expect([result.quiet, result.syncRan]).toEqual([false, false]);
    }
    // With nothing due, the same caller gets no line.
    fixture.proof.write(root, P1, P1_TEXT);
    expect(workCheckpoint(root, { storeRoot: fixture.store, now: new Date() }, { event: "commit", access: "read", readReason: "read-access-only", authority }).quiet).toBe(true);
    // A trigger run with another event, and a direct run, keep the full output.
    editTask(fixture.proof, root, "Build the new parser.");
    expect(workCheckpoint(root, { storeRoot: fixture.store, now: new Date() }, { event: "turn-end", access: "read", readReason: "read-access-only", authority }).lines.length).toBeGreaterThan(2);
    expect(workCheckpoint(root, { storeRoot: fixture.store, now: new Date() }, { event: null, access: "read", readReason: "read-access-only", authority }).lines.length).toBeGreaterThan(2);
  });

  it("the short form never holds a claim ID, a file path, or a list of ready work", () => {
    const root = project(fixture, "aurora", { hooks: false });
    editTask(fixture.proof, root, "Build the new parser.");
    const authority = workAuthority(root, fixture.store, null);
    const result = workCheckpoint(root, { storeRoot: fixture.store, now: new Date() }, { event: "commit", access: "write", readReason: null, authority });
    expect(result.lines).toEqual(["Checkpoint: 1 file imported."]);
    expect(result.next.length).toBeGreaterThan(0);
    expect(result.summary).not.toMatch(/claim|Ready work|docs\/work/);
  });
});
