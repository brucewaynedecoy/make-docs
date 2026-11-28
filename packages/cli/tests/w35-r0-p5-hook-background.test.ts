import { spawn, spawnSync } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GIT_HOOK_DEBUG_ENV, GIT_HOOK_RUN_FALLBACK, GIT_HOOK_RUN_MODE, applyGitHookRemoval, listGitHookRecords, planGitHooks, renderGitHookReview } from "../src/git-hooks";
import { CHECKPOINT_GIT_HOOK_STORE_WAIT_MS } from "../src/operations/work/work-queue/checkpoint";
import {
  GIT_HOOK_RUNS_DIR,
  GIT_HOOK_RUN_ENV,
  GIT_HOOK_RUN_FILES,
  GIT_HOOK_RUN_QUEUE_WAIT_MS,
  GIT_HOOK_RUN_STALE_MS,
  GIT_HOOK_RUN_EVENTS,
  beginGitHookRun,
  gitHookRunDir,
  gitHookRunMode,
  removeAllGitHookRunState,
} from "../src/store/git-hook-runs";
import { getExistingInstallationCheckoutId, withInstallationDatabase } from "../src/store/installation-state";
import { removeGlobalStore } from "../src/store/lifecycle";
import { shellQuote } from "./git-hook-proof";
import {
  CLI,
  P1,
  checkpoint,
  cli,
  commitAll,
  createHookFixture,
  editTask,
  envWithPath,
  holdStore,
  hookRunState,
  lastHookRunSince,
  project,
  recordHookFact,
  releaseStore,
  setup,
  setupRemove,
  taskText,
  waitForHookRuns,
  type HookFixture,
} from "./git-hook-setup";

/**
 * W35 R0 P5 Stage 6 (T39 to T43): the background mode of the git hooks, which
 * the owner decided on 2026-11-28 (OD-P5-1 to OD-P5-5).
 *
 * - The start: the hook starts the checkpoint as a process of its own and
 *   returns. Git does not wait, also when a pipe or a tool reads its output.
 * - Survival: the started process is in a session of its own, so a signal to
 *   the process group of git, such as the hang-up signal of a closed terminal,
 *   does not reach it.
 * - Overlap: several commits in quick succession leave the store equal to the
 *   files, and at most one background run waits. The waiting run waits at
 *   most 5 seconds for the working run, and then it works too.
 * - The fallback: when the last background run did not end, the next hook
 *   runs the checkpoint in the foreground, and then the background again.
 *
 * Each test waits, with a bound, until no background run is left, through
 * the run files of the temporary Store. No test leaves a process behind.
 */

/** The most time that a git action may take when its hook only starts a background checkpoint. */
const START_BOUND_MS = 900;

let fixture: HookFixture;

beforeEach(() => {
  fixture = createHookFixture("make-docs-w35-p5-bg-");
});

afterEach(() => {
  fixture.cleanup();
});

function mark(root: string, name: string): { token?: string; pid?: number; at?: string } | null {
  try { return JSON.parse(readFileSync(path.join(hookRunState(fixture, root).dir, name), "utf8")) as { pid?: number }; } catch { return null; }
}

function isAlive(pid: number): boolean {
  try { process.kill(pid, 0); return true; } catch (error) { return (error as NodeJS.ErrnoException).code === "EPERM"; }
}

async function until(check: () => boolean, what: string, timeoutMs = 15_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!check()) {
    if (Date.now() >= deadline) throw new Error(`Not seen in ${timeoutMs} ms: ${what}`);
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

/** Stage one edit of the task and commit it with the hooks, with no wait for the background run. */
function commitNoWait(root: string, text: string, env: NodeJS.ProcessEnv = fixture.onPath): { status: number | null; output: string; ms: number; since: number } {
  editTask(fixture.proof, root, text);
  fixture.gitNoWait(root, ["add", "-A"]);
  const since = Date.now() - 5;
  const result = fixture.gitNoWait(root, ["commit", "-q", "-m", text], { env, allowFailure: true });
  return { status: result.status, output: `${result.stdout}${result.stderr}`, ms: Date.now() - since - 5, since };
}

describe.skipIf(!existsSync(CLI))("W35 R0 P5 the background start (T39; A62w, A62x)", () => {
  it("a commit returns before the checkpoint ends and prints nothing, and the store has the edit when the background run ended", async () => {
    const root = project(fixture);
    // Another process holds the Store, so the background run cannot end before git returns.
    const holder = await holdStore(fixture);
    let commit;
    try {
      commit = commitNoWait(root, "Build the new parser.");
      // Git is back, the run still waits, and the store does not have the edit yet.
      expect(`${commit.status}:${commit.output}`).toBe("0:");
      expect(commit.ms).toBeLessThan(START_BOUND_MS);
      await until(() => mark(root, "working.json") !== null, "the working mark of the background run");
      expect(hookRunState(fixture, root).busy).toBe(true);
    } finally {
      await releaseStore(holder);
    }
    expect(taskText(fixture, root) === "Build the parser." || taskText(fixture, root) === "Build the new parser.").toBe(true);
    waitForHookRuns(fixture.store);
    const run = lastHookRunSince(fixture.store, commit.since);
    expect(run).toMatchObject({ mode: "background", outcome: "ran", event: "commit", exitCode: 0, output: "Checkpoint: 1 file imported.\n", errorOutput: "" });
    expect(taskText(fixture, root)).toBe("Build the new parser.");
    expect(fixture.proof.git(root, ["status", "--porcelain"]).stdout).toBe("");
    // The start mark is gone, so the next hook knows that this run ended.
    expect(mark(root, "started.json")).toBeNull();
    recordHookFact(fixture.proof, "background-start", { commitMs: commit.ms, output: commit.output, storeAfterRun: "has the edit" });
  }, 60_000);

  it("git returns at once also when a pipe reads its output, and when a tool captures its output", async () => {
    const root = project(fixture);
    const times: Record<string, number> = {};
    for (const step of ["plain", "piped", "captured"] as const) {
      // Each call gets its own full Store wait. No later run can hide an earlier run that held a pipe.
      editTask(fixture.proof, root, `Build parser ${step}.`);
      fixture.gitNoWait(root, ["add", "-A"]);
      const holder = await holdStore(fixture);
      const started = Date.now();
      let returnedAt: number | null = null;
      let busyAtReturn = false;
      let result: { status: number | null; output: string } | null = null;
      try {
        if (step === "plain") {
          // Files give a baseline with no output pipe between the test and git.
          const outputFile = path.join(fixture.proof.root, "plain-output");
          const fd = openSync(outputFile, "w");
          try {
            const plain = spawnSync(fixture.proof.gitPath, ["commit", "-m", step], { cwd: root, env: fixture.onPath, stdio: ["ignore", fd, fd], timeout: 30_000 });
            result = { status: plain.status, output: readFileSync(outputFile, "utf8") };
          } finally {
            closeSync(fd);
          }
        } else if (step === "piped") {
          // `cat` ends only when every writer of the pipe closed it.
          const piped = spawnSync("sh", ["-c", `${shellQuote(fixture.proof.gitPath)} commit -m piped 2>&1 | cat`], { cwd: root, env: fixture.onPath, encoding: "utf8", timeout: 30_000 });
          result = { status: piped.status, output: `${piped.stdout ?? ""}${piped.stderr ?? ""}` };
        } else {
          result = await new Promise<{ status: number | null; output: string }>((resolve, reject) => {
            const child = spawn(fixture.proof.gitPath, ["commit", "-m", step], { cwd: root, env: fixture.onPath, stdio: ["ignore", "pipe", "pipe"], timeout: 30_000 });
            let output = "";
            child.stdout.on("data", (chunk) => { output += String(chunk); });
            child.stderr.on("data", (chunk) => { output += String(chunk); });
            child.on("error", reject);
            // `close` waits for both output pipes as well as the process.
            child.on("close", (status) => resolve({ status, output }));
          });
        }
        returnedAt = Date.now();
        times[step] = returnedAt - started;
        busyAtReturn = hookRunState(fixture, root).busy;
        recordHookFact(fixture.proof, "background-start-returned", { step, startedAt: new Date(started).toISOString(), returnedAt: new Date(returnedAt).toISOString(), wallMs: times[step], busyAtReturn });
        // Keep the Store held until this run ends, so its full wait is measured even when git was slow.
        waitForHookRuns(fixture.store);
      } finally {
        const run = lastHookRunSince(fixture.store, started);
        recordHookFact(fixture.proof, "background-start-run", {
          step, wallMs: times[step] ?? null, plainMs: times.plain ?? null,
          extraMs: times[step] === undefined ? null : times[step]! - times.plain!,
          busyAtReturn, startedAt: run?.startedAt ?? null, endedAt: run?.endedAt ?? null,
          backgroundRunMs: run ? Date.parse(run.endedAt) - Date.parse(run.startedAt) : null,
          returnedBeforeRunEndMs: run && returnedAt !== null ? Date.parse(run.endedAt) - returnedAt : null,
          run,
        });
        await releaseStore(holder);
      }
      const run = lastHookRunSince(fixture.store, started);
      expect(result?.status).toBe(0);
      expect(result?.output).toContain(step);
      expect(result?.output).not.toContain("Checkpoint");
      expect(run).toMatchObject({ mode: "background", outcome: "ran", event: "commit", exitCode: 1 });
      expect(Date.parse(run!.startedAt)).toBeGreaterThanOrEqual(started);
      expect(Date.parse(run!.endedAt) - Date.parse(run!.startedAt)).toBeGreaterThanOrEqual(4900);
      // A slow start may exceed 900 ms. Waiting for the checkpoint must still fail, on every platform.
      expect(busyAtReturn).toBe(true);
      expect(Date.parse(run!.endedAt) - returnedAt!).toBeGreaterThan(1000);
    }
    checkpoint(fixture, root);
    expect(taskText(fixture, root)).toBe("Build parser captured.");
    recordHookFact(fixture.proof, "background-start-piped", times);
  }, 120_000);

  it("the hooks after a merge, a rewrite, and a branch change start the background run in the same way, and a branch change imports nothing", () => {
    const root = project(fixture);
    editTask(fixture.proof, root, "Build the new parser.");
    // A branch change: the hook prints nothing, and its background run only reports.
    const branch = fixture.proof.git(root, ["checkout", "-q", "-b", "topic"], { env: fixture.onPath });
    expect(`${branch.status}:${branch.stdout}${branch.stderr}`).toBe("0:");
    expect(lastHookRunSince(fixture.store, 0)).toMatchObject({ event: "branch-change", outcome: "ran", exitCode: 0, output: "Checkpoint: 1 file waits.\nRun make-docs project checkpoint to see and settle what waits.\n" });
    expect(taskText(fixture, root)).toBe("Build the parser.");
    // An amended commit: two hooks, no line, and the store has the edit after the runs.
    commitAll(fixture, root);
    editTask(fixture.proof, root, "Build the newest parser.");
    fixture.proof.git(root, ["add", "-A"]);
    const amend = fixture.proof.git(root, ["commit", "-q", "--amend", "-m", "Amended"], { env: fixture.onPath });
    expect(`${amend.status}:${amend.stdout}${amend.stderr}`).toBe("0:");
    expect(taskText(fixture, root)).toBe("Build the newest parser.");
    expect(checkpoint(fixture, root).nothingDue).toBe(true);
  }, 60_000);
});

describe.skipIf(!existsSync(CLI))("W35 R0 P5 the background run survives the end of what started it (T40; A62y)", () => {
  it.skipIf(process.platform === "win32")("the run is the leader of its own process group, and a hang-up signal to the group of git does not stop it", async () => {
    const root = project(fixture);
    const holder = await holdStore(fixture);
    let pid = 0;
    let shell;
    try {
      editTask(fixture.proof, root, "Build the new parser.");
      fixture.gitNoWait(root, ["add", "-A"]);
      // A shell in a process group of its own, as the shell of a terminal has one. It commits and then stays.
      shell = spawn("sh", ["-c", `${shellQuote(fixture.proof.gitPath)} commit -q -m hang-up; sleep 30`], { cwd: root, env: fixture.onPath, detached: true, stdio: "ignore" });
      const ended = new Promise<NodeJS.Signals | null>((resolve) => shell!.on("close", (_status: number | null, signal: NodeJS.Signals | null) => resolve(signal)));
      await until(() => typeof mark(root, "working.json")?.pid === "number", "the working mark of the background run");
      pid = mark(root, "working.json")!.pid!;
      // The run leads a process group of its own: a signal 0 to that group finds it. It is not in the group of the shell.
      expect(() => process.kill(-pid, 0)).not.toThrow();
      expect(pid).not.toBe(shell.pid);
      // The terminal closes: the hang-up signal goes to each process of the group of the shell.
      process.kill(-shell.pid!, "SIGHUP");
      expect(await ended).toBe("SIGHUP");
      await new Promise((resolve) => setTimeout(resolve, 300));
      // The background run still runs, and it still waits for the Store.
      expect(isAlive(pid)).toBe(true);
      expect(hookRunState(fixture, root).busy).toBe(true);
    } finally {
      if (shell?.pid) { try { process.kill(-shell.pid, "SIGKILL"); } catch { /* It is gone. */ } }
      await releaseStore(holder);
    }
    waitForHookRuns(fixture.store);
    // The process ends a moment after it removed its start mark.
    await until(() => !isAlive(pid), "the end of the background process");
    expect(lastHookRunSince(fixture.store, 0)).toMatchObject({ pid, outcome: "ran", exitCode: 0, output: "Checkpoint: 1 file imported.\n" });
    expect(taskText(fixture, root)).toBe("Build the new parser.");
    recordHookFact(fixture.proof, "background-survives-hang-up", { ownProcessGroup: true, afterHangUp: "runs to its end and imports" });
  }, 60_000);

  it("the run goes on after the process that ran git ended, and it leaves no process behind", async () => {
    const root = project(fixture);
    const holder = await holdStore(fixture);
    let pid = 0;
    try {
      editTask(fixture.proof, root, "Build the new parser.");
      fixture.gitNoWait(root, ["add", "-A"]);
      const parent = spawn(fixture.proof.gitPath, ["commit", "-q", "-m", "parent ends"], { cwd: root, env: fixture.onPath, stdio: "ignore" });
      expect(await new Promise<number | null>((resolve) => parent.on("close", (status) => resolve(status)))).toBe(0);
      await until(() => typeof mark(root, "working.json")?.pid === "number", "the working mark of the background run");
      pid = mark(root, "working.json")!.pid!;
      // Git and the hook shell are gone, and the run is there.
      expect(isAlive(pid)).toBe(true);
    } finally {
      await releaseStore(holder);
    }
    waitForHookRuns(fixture.store);
    await until(() => !isAlive(pid), "the end of the background process");
    expect(taskText(fixture, root)).toBe("Build the new parser.");
    // No run file of a live run is left: only the file of the last run.
    expect(readdirSync(hookRunState(fixture, root).dir).sort()).toEqual(["last.json"]);
  }, 60_000);
});

describe.skipIf(!existsSync(CLI))("W35 R0 P5 overlapping background runs (T41; A62z)", () => {
  it("ten commits in a loop, and then one direct checkpoint: the store agrees with the files, and no outcome is lost", () => {
    const root = project(fixture);
    const started = Date.now();
    for (let index = 1; index <= 10; index += 1) {
      const commit = commitNoWait(root, `Build parser ${index}.`);
      expect(`${commit.status}:${commit.output}`).toBe("0:");
    }
    const loopMs = Date.now() - started;
    waitForHookRuns(fixture.store);
    expect(taskText(fixture, root)).toBe("Build parser 10.");
    // A direct run finds nothing due: the hook runs lost no edit, and no file waits.
    const direct = checkpoint(fixture, root);
    expect([direct.nothingDue, direct.imported, direct.waiting, direct.conflicts]).toEqual([true, [], [], []]);
    expect(fixture.proof.git(root, ["status", "--porcelain"]).stdout).toBe("");
    expect(readdirSync(hookRunState(fixture, root).dir).sort()).toEqual(["last.json"]);
    recordHookFact(fixture.proof, "ten-commits-in-a-loop", { loopMs, store: "equal to the files", direct: "nothing due" });
  }, 120_000);

  it("at most one background run of a checkout waits, and a run that finds a waiting run ends at once", async () => {
    const root = project(fixture);
    const holder = await holdStore(fixture);
    const pids: number[] = [];
    let alive: number[] = [];
    let covered = 0;
    try {
      // Six commits while the Store is held. The first run works, and it waits for the Store.
      for (let index = 1; index <= 6; index += 1) {
        const commit = commitNoWait(root, `Build parser ${index}.`);
        expect(`${commit.status}:${commit.output}`).toBe("0:");
        const pid = mark(root, "started.json")?.pid;
        if (typeof pid === "number") pids.push(pid);
        if (index === 1) await until(() => mark(root, "working.json") !== null, "the working mark of the first run");
        if (index === 2) await until(() => mark(root, "pending.json") !== null, "the pending mark of the second run");
      }
      expect(new Set(pids).size).toBe(6);
      // The third to the sixth run found the waiting run, so each one ended at once.
      await until(() => pids.slice(2).every((pid) => !isAlive(pid)), "the end of each covered run");
      alive = pids.filter(isAlive);
      covered = pids.length - alive.length;
      expect(alive).toEqual(pids.slice(0, 2));
      expect(mark(root, "working.json")?.pid).toBe(pids[0]);
      expect(mark(root, "pending.json")?.pid).toBe(pids[1]);
    } finally {
      await releaseStore(holder);
    }
    waitForHookRuns(fixture.store);
    // The waiting run read the files after the last commit, so the store holds the last edit.
    expect(taskText(fixture, root)).toBe("Build parser 6.");
    expect(checkpoint(fixture, root).nothingDue).toBe(true);
    expect(pids.some(isAlive)).toBe(false);
    recordHookFact(fixture.proof, "pile-up-bound", { started: pids.length, aliveWhileHeld: alive.length, endedAtOnce: covered, queueWaitMs: GIT_HOOK_RUN_QUEUE_WAIT_MS });
  }, 120_000);
});

describe.skipIf(!existsSync(CLI))("W35 R0 P5 a working run that lasts longer than the wait of the waiting run (T41; A62z)", () => {
  it("the waiting run waits about 5 seconds for a working run that still lives, then it works too, and the store agrees with the files at the end", async () => {
    const root = project(fixture);
    const dir = hookRunState(fixture, root).dir;
    mkdirSync(dir, { recursive: true });
    // A working run that lasts longer than the wait: a live process that the test controls holds the working mark.
    const long = spawn(process.execPath, ["-e", "process.stdin.on('end', () => process.exit(0)); process.stdin.resume();"], { cwd: fixture.proof.root, env: fixture.proof.env, stdio: ["pipe", "ignore", "ignore"] });
    const longEnded = new Promise<void>((resolve) => long.on("close", () => resolve()));
    let run;
    let both = false;
    try {
      const refresh = () => writeFileSync(path.join(dir, "working.json"), JSON.stringify({ token: "a-long-working-run", pid: long.pid, at: new Date().toISOString() }));
      refresh();
      const commit = commitNoWait(root, "Build the new parser.");
      expect(`${commit.status}:${commit.output}`).toBe("0:");
      // The new run waits: it holds the pending mark, and the store does not have the edit.
      await until(() => typeof mark(root, "pending.json")?.pid === "number", "the pending mark of the waiting run");
      const waiting = mark(root, "pending.json")!.pid!;
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      expect(mark(root, "pending.json")?.pid).toBe(waiting);
      expect(taskText(fixture, root)).toBe("Build the parser.");
      // After the wait the run works too: the working mark is its own now, while the long run still lives.
      await until(() => mark(root, "working.json")?.pid === waiting, "the working mark of the run that waited", 20_000);
      both = isAlive(long.pid!);
      waitForHookRuns(fixture.store);
      run = lastHookRunSince(fixture.store, commit.since);
    } finally {
      long.stdin.end();
      await longEnded;
    }
    expect(both).toBe(true);
    // The run waited the bound for the working run, and not longer, and then it imported.
    const ms = Date.parse(run!.endedAt) - Date.parse(run!.startedAt);
    expect(ms).toBeGreaterThanOrEqual(GIT_HOOK_RUN_QUEUE_WAIT_MS - 200);
    expect(ms).toBeLessThan(GIT_HOOK_RUN_QUEUE_WAIT_MS + 5_000);
    expect(run).toMatchObject({ outcome: "ran", exitCode: 0, output: "Checkpoint: 1 file imported.\n" });
    // The store agrees with the files: a direct run finds nothing due.
    expect(taskText(fixture, root)).toBe("Build the new parser.");
    const direct = checkpoint(fixture, root);
    expect([direct.nothingDue, direct.imported, direct.waiting, direct.conflicts]).toEqual([true, [], [], []]);
    expect(fixture.proof.git(root, ["status", "--porcelain"]).stdout).toBe("");
    recordHookFact(fixture.proof, "working-run-longer-than-the-wait", { waitedMs: ms, bothAtTheSameTime: both, store: "equal to the files" });
  }, 60_000);
});

describe.skipIf(!existsSync(CLI))("W35 R0 P5 the foreground fallback (T42; A62aa, A62ab)", () => {
  it("after a background run that was stopped, the next hook runs the checkpoint in the foreground and prints, and the hook after it uses the background again", async () => {
    const root = project(fixture);
    const holder = await holdStore(fixture);
    let stopped = 0;
    try {
      commitNoWait(root, "Build parser 1.");
      await until(() => typeof mark(root, "working.json")?.pid === "number", "the working mark of the background run");
      stopped = mark(root, "working.json")!.pid!;
      // Something stops the run before its end, as a shell that stops each process that a command started.
      process.kill(stopped, "SIGKILL");
      await until(() => !isAlive(stopped), "the end of the stopped run");
    } finally {
      await releaseStore(holder);
    }
    // The run left its start mark, and its process is gone.
    expect(mark(root, "started.json")?.pid).toBe(stopped);
    expect(taskText(fixture, root)).toBe("Build the parser.");

    // The next hook: the foreground. Git waits, and the hook prints the short form.
    editTask(fixture.proof, root, "Build parser 2.");
    const fallback = commitAll(fixture, root);
    expect(`${fallback.status}:${fallback.output}`).toBe("0:Checkpoint: 1 file imported.\n");
    expect(taskText(fixture, root)).toBe("Build parser 2.");
    const told = JSON.parse(readFileSync(path.join(hookRunState(fixture, root).dir, "foreground.json"), "utf8")) as { event: string; reason: string; previous: { pid: number } };
    expect(told).toMatchObject({ event: "commit", previous: { pid: stopped } });
    expect(told.reason).toBe("The last background run of this checkout did not end, and its process is not running.");
    // The fallback also started a background run, and that one ended.
    expect(fallback.background).toMatchObject({ outcome: "ran", exitCode: 0, output: "" });
    expect(mark(root, "started.json")).toBeNull();

    // The hook after it: the background again, with no line.
    editTask(fixture.proof, root, "Build parser 3.");
    const again = commitAll(fixture, root);
    expect([again.output, again.hookOutput]).toEqual(["", "Checkpoint: 1 file imported.\n"]);
    expect(taskText(fixture, root)).toBe("Build parser 3.");
    recordHookFact(fixture.proof, "foreground-fallback", { first: "background run stopped, nothing synced", second: "foreground, one line, synced", third: "background again" });
  }, 60_000);

  it("while each background run is stopped, each next hook stays in the foreground", async () => {
    const root = project(fixture);
    // A start mark of a run that never ended, and whose process is gone, before each commit.
    const dir = hookRunState(fixture, root).dir;
    const leave = () => { mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, "started.json"), JSON.stringify({ token: "gone", pid: 2 ** 22 + 12345, at: new Date().toISOString(), event: "commit" })); };
    for (const text of ["Build parser 1.", "Build parser 2."]) {
      leave();
      editTask(fixture.proof, root, text);
      const commit = commitAll(fixture, root);
      expect(`${commit.status}:${commit.output}`).toBe("0:Checkpoint: 1 file imported.\n");
      expect(taskText(fixture, root)).toBe(text);
    }
  }, 60_000);

  it("a start mark that names a live process is taken as left behind after the stale time", () => {
    const root = project(fixture);
    const dir = hookRunState(fixture, root).dir;
    mkdirSync(dir, { recursive: true });
    // This test process lives, but the mark is older than the stale time, so no run of 60 seconds is assumed.
    writeFileSync(path.join(dir, "started.json"), JSON.stringify({ token: "old", pid: process.pid, at: new Date(Date.now() - GIT_HOOK_RUN_STALE_MS - 1_000).toISOString(), event: "commit" }));
    editTask(fixture.proof, root, "Build the new parser.");
    expect(commitAll(fixture, root).output).toBe("Checkpoint: 1 file imported.\n");
    // A young mark of a live process is a run that still works: the hook starts the background, and prints nothing.
    editTask(fixture.proof, root, "Build the newest parser.");
    fixture.gitNoWait(root, ["add", "-A"]);
    writeFileSync(path.join(dir, "started.json"), JSON.stringify({ token: "young", pid: process.pid, at: new Date().toISOString(), event: "commit" }));
    const since = Date.now() - 5;
    const commit = fixture.gitNoWait(root, ["commit", "-q", "-m", "Young mark"], { env: fixture.onPath });
    expect(`${commit.status}:${commit.stdout}${commit.stderr}`).toBe("0:");
    waitForHookRuns(fixture.store);
    expect(lastHookRunSince(fixture.store, since)).toMatchObject({ outcome: "ran", output: "Checkpoint: 1 file imported.\n" });
    expect(taskText(fixture, root)).toBe("Build the newest parser.");
  }, 60_000);

  it("a foreground fallback run waits the short limit for a held Store and gives up quietly, and the debug switch shows its error output", async () => {
    const root = project(fixture);
    const dir = hookRunState(fixture, root).dir;
    const leave = () => { mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, "started.json"), JSON.stringify({ token: "gone", pid: 2 ** 22 + 12345, at: new Date().toISOString(), event: "commit" })); };
    const holder = await holdStore(fixture);
    let quiet;
    let loud;
    try {
      leave();
      editTask(fixture.proof, root, "Build parser 1.");
      fixture.gitNoWait(root, ["add", "-A"]);
      let started = Date.now();
      const first = fixture.gitNoWait(root, ["commit", "-q", "-m", "Quiet"], { env: fixture.onPath, allowFailure: true });
      quiet = { ...first, ms: Date.now() - started };
      // The background run that the fallback started must not be the reason for the next foreground run.
      waitForHookRuns(fixture.store);
      leave();
      fixture.proof.write(root, "note.txt", "note\n");
      fixture.gitNoWait(root, ["add", "-A"]);
      started = Date.now();
      const second = fixture.gitNoWait(root, ["commit", "-q", "-m", "Loud"], { env: envWithPath(fixture.proof, fixture.onPath.PATH!, { [GIT_HOOK_DEBUG_ENV]: "1" }), allowFailure: true });
      loud = { ...second, ms: Date.now() - started };
      waitForHookRuns(fixture.store);
    } finally {
      await releaseStore(holder);
    }
    // Quietly: no output, exit code 0, and the git action waited about the short limit, and not the busy time.
    expect(`${quiet.status}:${quiet.stdout}${quiet.stderr}`).toBe("0:");
    expect(quiet.ms).toBeGreaterThanOrEqual(CHECKPOINT_GIT_HOOK_STORE_WAIT_MS - 100);
    expect(quiet.ms).toBeLessThan(CHECKPOINT_GIT_HOOK_STORE_WAIT_MS + 3_500);
    // With the debug switch, the foreground run shows the typed Store result on standard error.
    expect(loud.status).toBe(0);
    expect(loud.stdout).toBe("");
    expect(loud.stderr).toContain("store-unavailable");
    expect(taskText(fixture, root)).toBe("Build the parser.");
    expect(checkpoint(fixture, root).imported).toEqual([P1]);
    recordHookFact(fixture.proof, "foreground-fallback-held-store", { quietMs: quiet.ms, quiet: "no output, exit 0", debug: "error output on standard error" });
  }, 120_000);
});

describe("W35 R0 P5 the start code (T39, T42)", () => {
  it("only the variable of the hook block with a checkpoint call of a hook changes how the CLI starts", () => {
    const root = project(fixture, "aurora", { hooks: false });
    const call = ["project", "checkpoint", "--event", "commit", "--target-root", root];
    const env = (value?: string): NodeJS.ProcessEnv => ({ ...fixture.proof.env, ...(value === undefined ? {} : { [GIT_HOOK_RUN_ENV]: value }) });
    // No variable: each command starts as before.
    expect(beginGitHookRun(call, env(), root)).toEqual({ kind: "none" });
    // The variable with another command, with a direct run, or with an unknown value changes nothing.
    expect(beginGitHookRun(["work", "status"], env("start"), root)).toEqual({ kind: "none" });
    expect(beginGitHookRun(["project", "checkpoint", "--target-root", root], env("start"), root)).toEqual({ kind: "none" });
    expect(beginGitHookRun(call, env("something"), root)).toEqual({ kind: "none" });
    expect(beginGitHookRun(call, env("foreground"), root)).toEqual({ kind: "none" });
    // Only the two events of a git hook can start in the background. Each other event ignores the variable.
    for (const event of ["session-start", "files-changed", "turn-end", "phase-closed", "not-an-event"]) {
      expect(beginGitHookRun(["project", "checkpoint", "--event", event, "--target-root", root], env("start"), root), event).toEqual({ kind: "none" });
    }
    expect(GIT_HOOK_RUN_EVENTS).toEqual(["commit", "branch-change"]);
    // A call that asks for JSON never starts in the background, with each event and at each place of the option.
    expect(beginGitHookRun([...call, "--json"], env("start"), root)).toEqual({ kind: "none" });
    expect(beginGitHookRun(["project", "checkpoint", "--json", "--event", "branch-change", "--target-root", root], env("start"), root)).toEqual({ kind: "none" });
    // No call above made a run file.
    expect(existsSync(gitHookRunDir(fixture.store, root))).toBe(false);
    // The run mode that the checkpoint reads.
    expect([gitHookRunMode(env()), gitHookRunMode(env("start")), gitHookRunMode(env("foreground")), gitHookRunMode(env("background:x"))]).toEqual([null, null, "foreground", "background"]);
  });

  it("with no usable Store, and in a folder that is no Make Docs project, the start code runs the checkpoint in the foreground and starts no process", () => {
    const root = project(fixture, "aurora", { hooks: false });
    const call = ["project", "checkpoint", "--event", "commit", "--target-root", root];
    const noStore: NodeJS.ProcessEnv = { ...fixture.noStore, [GIT_HOOK_RUN_ENV]: "start" };
    const first = beginGitHookRun(call, noStore, root);
    expect(first.kind).toBe("foreground");
    expect(noStore[GIT_HOOK_RUN_ENV]).toBe("foreground");
    expect(existsSync(fixture.noStoreDir)).toBe(false);
    const plain = fixture.proof.folder("plain-folder");
    const other: NodeJS.ProcessEnv = { ...fixture.proof.env, [GIT_HOOK_RUN_ENV]: "start" };
    expect(beginGitHookRun(["project", "checkpoint", "--event", "commit", "--target-root", plain], other, plain).kind).toBe("foreground");
    // No run folder was made for a folder that is no project.
    expect(existsSync(gitHookRunDir(fixture.store, plain))).toBe(false);
  });

  it.skipIf(!existsSync(CLI))("with the variable, a call with another event and a call with --json print what they print without it, and start no background run", () => {
    const root = project(fixture, "aurora", { hooks: false });
    editTask(fixture.proof, root, "Build the new parser.");
    const withVariable = { ...fixture.proof.env, [GIT_HOOK_RUN_ENV]: "start" };
    // Another event: the full trigger output, in the foreground, as without the variable.
    const session = cli(fixture, root, ["project", "checkpoint", "--event", "session-start", "--target-root", root], withVariable);
    expect(session.status).toBe(0);
    expect(session.stdout.split("\n")[0]).toBe("Checkpoint: 1 file imported.");
    expect(session.stdout.split("\n").length).toBeGreaterThan(2);
    expect(taskText(fixture, root)).toBe("Build the new parser.");
    // The event of a git hook with --json: the JSON result, in the foreground.
    editTask(fixture.proof, root, "Build the newest parser.");
    const json = cli(fixture, root, ["project", "checkpoint", "--event", "commit", "--target-root", root, "--json"], withVariable);
    expect(json.status).toBe(0);
    expect(JSON.parse(json.stdout)).toMatchObject({ run: "trigger", event: "commit", imported: [P1] });
    expect(taskText(fixture, root)).toBe("Build the newest parser.");
    // Neither call made a run file or started a process.
    expect(existsSync(hookRunState(fixture, root).dir)).toBe(false);
  });

  it.skipIf(!existsSync(CLI))("setup remove takes out the run folder of a checkout that is not in the hook record", () => {
    const repo = fixture.proof.repo("plain-setup");
    expect(setup(fixture, repo, ["--yes"]).gitHooks).toMatchObject({ status: "none" });
    const root = fixture.proof.git(repo, ["rev-parse", "--show-toplevel"]).stdout.trim();
    // A hook of the clone, which another checkout selected, started a run here: this checkout has a run folder.
    const result = cli(fixture, root, ["project", "checkpoint", "--event", "commit", "--target-root", root], { ...fixture.proof.env, [GIT_HOOK_RUN_ENV]: "start" });
    expect(`${result.status}:${result.stdout}${result.stderr}`).toBe("0:");
    waitForHookRuns(fixture.store);
    const dir = hookRunState(fixture, root).dir;
    expect(readdirSync(dir)).toEqual(["last.json"]);
    setupRemove(fixture, root);
    expect(existsSync(dir)).toBe(false);
  });

  it.skipIf(!existsSync(CLI))("a person who gives the variable by hand with a checkpoint call gets no output and exit code 0, and the store has the edit after the run", () => {
    const root = project(fixture, "aurora", { hooks: false });
    editTask(fixture.proof, root, "Build the new parser.");
    const result = cli(fixture, root, ["project", "checkpoint", "--event", "commit", "--target-root", root], { ...fixture.proof.env, [GIT_HOOK_RUN_ENV]: "start" });
    expect(`${result.status}:${result.stdout}${result.stderr}`).toBe("0:");
    waitForHookRuns(fixture.store);
    expect(taskText(fixture, root)).toBe("Build the new parser.");
  });
});

describe.skipIf(!existsSync(CLI))("W35 R0 P5 the run mode in setup, in the record, and the run files (T43; A62ac)", () => {
  it("the hook review, the setup JSON result, and the Store record state the background mode and the foreground fallback", () => {
    const repo = fixture.proof.repo("fresh");
    const done = setup(fixture, repo, ["--yes", "--git-hooks"]);
    expect(done.gitHooks).toMatchObject({ status: "installed", runMode: "background", runFallback: "foreground" });
    const root = fixture.proof.git(repo, ["rev-parse", "--show-toplevel"]).stdout.trim();
    expect((done.gitHooks as unknown as { runStateDir: string }).runStateDir.endsWith(path.basename(gitHookRunDir(fixture.store, root)))).toBe(true);
    expect([GIT_HOOK_RUN_MODE, GIT_HOOK_RUN_FALLBACK]).toEqual(["background", "foreground"]);
    const record = withInstallationDatabase(root, (db) => listGitHookRecords(db), { storeRoot: fixture.store, readOnly: true })[0]!.record;
    expect([record.blockVersion, record.runMode, record.runFallback]).toEqual([2, "background", "foreground"]);
    const review = renderGitHookReview(planGitHooks({ projectRoot: root, storeRoot: fixture.store, command: fixture.command }));
    // The mode, what the person sees, and where the person finds the result.
    expect(review).toContain("Run mode: background.");
    expect(review).toContain("so git does not wait");
    expect(review).toContain("it prints nothing");
    expect(review).toContain("`make-docs work status`");
    expect(review).toContain("the reminder line of the next Make Docs command");
    expect(review).toContain("Fallback: foreground.");
    expect(review).toContain("waits at most 5 seconds at each wait for the Store");
    expect(review).toContain("waits at most 1 second at each wait for the Store");
    expect(review).toContain(`in ${(done.gitHooks as unknown as { runStateDir: string }).runStateDir}`);
    expect(review).not.toContain("runs the checkpoint in the foreground after the git action");
  });

  it("the run files are in the Store folder and not in the project, each work tree has its own folder, and setup remove takes the files of its checkout out", () => {
    const root = project(fixture);
    editTask(fixture.proof, root, "Build the new parser.");
    commitAll(fixture, root);
    const dir = hookRunState(fixture, root).dir;
    expect(dir.startsWith(path.join(fixture.store, GIT_HOOK_RUNS_DIR))).toBe(true);
    expect(readdirSync(dir)).toEqual(["last.json"]);
    // The hook wrote nothing into the project: git sees no change, and no ignored file.
    expect(fixture.proof.git(root, ["status", "--porcelain", "--ignored"]).stdout).toBe("");
    // Another folder has another run folder.
    expect(gitHookRunDir(fixture.store, path.join(fixture.proof.root, "elsewhere"))).not.toBe(dir);
    const removed = applyGitHookRemoval(root, fixture.store, getExistingInstallationCheckoutId(root, fixture.store));
    expect(removed.status).toBe("last");
    expect(existsSync(dir)).toBe(false);
    expect(existsSync(path.join(fixture.store, GIT_HOOK_RUNS_DIR))).toBe(false);
  });

  it("the removal of the Store takes the folder of the run files out, and keeps it when a file there is not a run file", () => {
    const store = fixture.proof.folder("a-store");
    const digest = "a".repeat(64);
    const dir = path.join(store, GIT_HOOK_RUNS_DIR, digest);
    mkdirSync(dir, { recursive: true });
    for (const name of GIT_HOOK_RUN_FILES) writeFileSync(path.join(dir, name), "{}\n");
    writeFileSync(path.join(dir, "note.txt"), "a file of a person\n");
    expect(removeAllGitHookRunState(store)).toBe(false);
    expect(readdirSync(dir)).toEqual(["note.txt"]);
    rmSync(path.join(dir, "note.txt"));
    for (const name of GIT_HOOK_RUN_FILES) writeFileSync(path.join(dir, name), "{}\n");
    // A file that a stopped write left behind goes with the run files.
    writeFileSync(path.join(dir, "last.json.4242.tmp"), "{}\n");
    writeFileSync(path.join(store, "store.db"), "");
    const result = removeGlobalStore({ storeRoot: store });
    expect(result.removedFiles).toContain(GIT_HOOK_RUNS_DIR);
    expect(existsSync(path.join(store, GIT_HOOK_RUNS_DIR))).toBe(false);
  });
});
