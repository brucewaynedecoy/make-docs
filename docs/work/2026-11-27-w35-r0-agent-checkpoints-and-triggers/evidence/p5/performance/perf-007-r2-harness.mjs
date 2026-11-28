// PERF-007 harness for the requalification of W35 R0 P5 (result PERF-007-R2). It is the harness of PERF-007-R1 with
// one stated difference: the hooks are the blocks that `make-docs setup --git-hooks` installs, and not proof hooks.
// It times git actions in a fresh clone of a project with many backlogs: with no hook, with the installed hooks in
// their normal mode (the background), and with the installed hooks in the foreground fallback. The harness makes the
// fallback happen before each timed action: it leaves the start mark of a background run whose process is gone.
// It never reads or writes the real Store: each run gets its own temporary MAKE_DOCS_HOME and HOME below the work
// folder you pass. It installs hooks only in its own temporary clones, through setup. Its git child processes read
// no global and no system git config, and they contact no network.
// Usage: node perf-007-r2-harness.mjs <make-docs command file> <git repo to clone> <empty work folder> <out.json> [runs=3] [rounds=5]
import { spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";

const [cli, source, work, outJson, runsArg = "3", roundsArg = "5"] = process.argv.slice(2);
if (!cli || !source || !work || !outJson) throw new Error("usage: perf-007-harness.mjs <cli> <repo> <work folder> <out.json> [runs] [rounds]");
const runs = Number(runsArg);
const rounds = Number(roundsArg);
const workRoot = path.resolve(work);
const realStore = path.join(os.homedir(), ".make-docs");
if (workRoot === realStore || workRoot.startsWith(realStore + path.sep)) throw new Error("The work folder is inside the real Store.");
if (existsSync(workRoot) && readdirSync(workRoot).length > 0) throw new Error("The work folder must be new or empty.");
mkdirSync(workRoot, { recursive: true });

const budgetMs = 60 * 60 * 1000; // Elapsed limit of the harness.
const started = performance.now();
const ms = (value) => Math.round(value * 10) / 10;
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const sleep = (time) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, time);

const MODES = ["none", "background", "fallback"];
const ACTIONS = ["commit", "merge", "rewrite", "branchChange"];
const STATES = ["noChange", "oneWorkFile"];
const HOOKS = { "post-commit": "commit", "post-merge": "commit", "post-rewrite": "commit", "post-checkout": "branch-change" };

/** True while the process of a run mark lives. */
function markLive(file) {
  let mark;
  try { mark = JSON.parse(readFileSync(file, "utf8")); } catch { return false; }
  if (typeof mark.pid !== "number") return Date.now() - Date.parse(mark.at ?? "") < 5000;
  try { process.kill(mark.pid, 0); return true; } catch (error) { return error.code === "EPERM"; }
}

function storeFingerprint(store) {
  const db = new DatabaseSync(path.join(store, "store.db"), { readOnly: true });
  try {
    const row = db.prepare("SELECT COUNT(*) AS units, COALESCE(SUM(revision), 0) AS revisions FROM work_units").get();
    return `${Number(row.units)}:${Number(row.revisions)}`;
  } finally {
    db.close();
  }
}

const result = {
  profile: "PERF-007",
  profileVersion: 1,
  result: "PERF-007-R2",
  difference: "The hooks are the blocks that setup installs (block version 2), in the background mode and in the foreground fallback.",
  note: "Paths, project names, and IDs are left out. Each run used fresh clones and fresh temporary Stores.",
  runs: [],
  stop: null,
};
const failure = (reason) => {
  result.stop = { reason, elapsedSeconds: ms((performance.now() - started) / 1000) };
};

/** One clone with its own Store and home folder, for one or two hook modes. */
function makeSite(runRoot, label) {
  const site = path.join(runRoot, label);
  const repo = path.join(site, "repo");
  const home = path.join(site, "home");
  const store = path.join(site, "store");
  const noHooks = path.join(site, "no-hooks");
  const emptyConfig = path.join(site, "empty.gitconfig");
  const log = path.join(site, "hook.log");
  mkdirSync(home, { recursive: true });
  mkdirSync(noHooks, { recursive: true });
  writeFileSync(emptyConfig, "");
  const env = {};
  for (const [key, value] of Object.entries(process.env)) if (!/^GIT_/i.test(key)) env[key] = value;
  Object.assign(env, {
    PATH: [path.dirname(cli), process.env.PATH].join(path.delimiter),
    MAKE_DOCS_HOME: store,
    HOME: home,
    USERPROFILE: home,
    CODEX_HOME: path.join(home, ".codex"),
    CLAUDE_CONFIG_DIR: path.join(home, ".claude"),
    GIT_CONFIG_GLOBAL: emptyConfig,
    GIT_CONFIG_SYSTEM: emptyConfig,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CEILING_DIRECTORIES: site,
    GIT_TERMINAL_PROMPT: "0",
    GIT_ALLOW_PROTOCOL: "file",
    GIT_AUTHOR_NAME: "Proof Author",
    GIT_AUTHOR_EMAIL: "author@example.invalid",
    GIT_COMMITTER_NAME: "Proof Author",
    GIT_COMMITTER_EMAIL: "author@example.invalid",
    GIT_EDITOR: "true",
    GIT_MERGE_AUTOEDIT: "no",
  });
  if (!env.MAKE_DOCS_HOME || !env.MAKE_DOCS_HOME.startsWith(workRoot)) throw new Error("The Store of a run is not inside the work folder.");
  const rawGit = (cwd, args) => {
    const start = performance.now();
    const out = spawnSync("git", args, { cwd, env, encoding: "utf8" });
    return { ms: performance.now() - start, status: out.status, output: `${out.stdout ?? ""}${out.stderr ?? ""}` };
  };
  const git = (args) => {
    const out = rawGit(repo, args);
    if (out.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${out.output.slice(0, 300)}`);
    return out;
  };
  /** A git command of the preparation: it runs no hook. */
  const prep = (args) => git(["-c", `core.hooksPath=${noHooks}`, ...args]);
  const make = (args, label2) => {
    const out = spawnSync(cli, args, { cwd: repo, env, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    if (out.status !== 0) throw new Error(`${label2} exited ${out.status}: ${(out.stderr || out.stdout).slice(0, 300)}`);
    return out.stdout;
  };
  const clone = rawGit(workRoot, ["clone", "-q", "--no-hardlinks", source, repo]);
  if (clone.status !== 0) throw new Error(`git clone failed: ${clone.output.slice(0, 300)}`);
  git(["config", "core.autocrlf", "false"]);
  git(["config", "commit.gpgsign", "false"]);
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]).output.trim();
  const methods = ["--codex-method", "none", "--claude-code-method", "none", "--github-copilot-method", "none"];
  const initial = spawnSync(cli, ["setup", "--yes", ...methods], { cwd: repo, env, encoding: "utf8" });
  const status = JSON.parse(initial.stdout || "{}").status ?? null;
  if (status !== "blocked") throw new Error(`plain setup status ${status}, expected blocked`);
  if (JSON.parse(make(["setup", "--yes", "--adopt", ...methods], "setup --adopt")).status !== "complete") throw new Error("setup --adopt did not complete");
  // Setup can write project files. The measure starts from a clean work tree, so the harness commits them.
  prep(["add", "-A"]);
  if (prep(["status", "--porcelain"]).output.trim() !== "") prep(["commit", "-q", "-m", "The files of setup"]);
  const workFile = git(["ls-files", "docs/work/*/01-*.md"]).output.split("\n").filter(Boolean)[0];
  if (!workFile) throw new Error("The clone has no work phase file.");
  const hooksDir = path.resolve(repo, git(["rev-parse", "--git-path", "hooks"]).output.trim());
  if (!hooksDir.startsWith(site)) throw new Error("The hooks folder is outside the temporary clone.");
  let counter = 0;
  let runDir = null;
  return {
    repo, env, store, log, branch, workFile, git, prep, make,
    /** Install the four blocks through setup. The mode with no hook installs nothing. */
    installHooks(mode) {
      if (mode === "none" || runDir !== null) return;
      const done = JSON.parse(make(["setup", "--yes", "--git-hooks", ...methods], "setup --git-hooks"));
      if (done.gitHooks?.status !== "installed" || done.gitHooks.runMode !== "background") throw new Error(`setup did not install the hooks: ${done.gitHooks?.status}`);
      runDir = done.gitHooks.runStateDir;
      if (!runDir.startsWith(store.split(path.sep).join("/"))) throw new Error("The run files are outside the temporary Store.");
      for (const name of Object.keys(HOOKS)) if (!readFileSync(path.join(hooksDir, name), "utf8").includes("export MAKE_DOCS_GIT_HOOK_RUN=start")) throw new Error(`${name} holds no block of the background mode`);
      // Setup can write a backup folder or a project file. The measure starts from a clean work tree.
      prep(["add", "-A"]);
      if (prep(["status", "--porcelain"]).output.trim() !== "") prep(["commit", "-q", "-m", "The files of setup with hooks"]);
    },
    /** Make the next hook fall back to the foreground: leave the start mark of a background run whose process is gone. */
    forceFallback() {
      mkdirSync(runDir, { recursive: true });
      writeFileSync(path.join(runDir, "started.json"), JSON.stringify({ token: "perf-007-r2", pid: 4194304 + 4242, at: new Date().toISOString(), event: "commit" }));
    },
    runFile(name) {
      try { return JSON.parse(readFileSync(path.join(runDir, name), "utf8")); } catch { return null; }
    },
    clearRunFiles() {
      for (const name of ["last.json", "foreground.json"]) rmSync(path.join(runDir, name), { force: true });
    },
    /** Change one file and stage it: a work file, or a file that sync does not read. */
    stageChange(state) {
      counter += 1;
      const target = state === "oneWorkFile" ? workFile : "perf-007-notes.txt";
      appendFileSync(path.join(repo, target), state === "oneWorkFile" ? `\n<!-- perf-007 ${label} ${counter} -->\n` : `line ${counter}\n`);
      prep(["add", "--", target]);
    },
    next() {
      counter += 1;
      return counter;
    },
    /** Wait until each background checkpoint that a hook started has ended: no run file names a live process. */
    settle() {
      const deadline = Date.now() + 60_000;
      for (;;) {
        if (!["started.json", "pending.json", "working.json"].some((name) => markLive(path.join(runDir, name)))) return;
        if (Date.now() > deadline) throw new Error("a background checkpoint did not end in 60 seconds");
        sleep(5);
      }
    },
  };
}

/** How many checkpoints the hooks of one action start. An amended commit runs two hooks. */
const EXPECTED_HOOKS = { commit: 1, merge: 1, rewrite: 2, branchChange: 1 };

/** One timed git action. The preparation runs with no hook and outside the measure. */
function sample(site, mode, action, state) {
  const id = site.next();
  let timed;
  let after = () => {};
  if (action === "commit") {
    site.stageChange(state);
    timed = ["commit", "-q", "-m", `Commit ${id}`];
  } else if (action === "rewrite") {
    site.stageChange(state);
    timed = ["commit", "-q", "--amend", "-m", `Amended ${id}`];
  } else if (action === "merge") {
    // A true merge: one commit on a side branch, and one commit on the main branch.
    site.prep(["checkout", "-q", "-b", `side-${id}`]);
    site.stageChange(state);
    site.prep(["commit", "-q", "-m", `Side ${id}`]);
    site.prep(["checkout", "-q", site.branch]);
    writeFileSync(path.join(site.repo, `perf-007-main-${id}.txt`), "main\n");
    site.prep(["add", "-A"]);
    site.prep(["commit", "-q", "-m", `Main ${id}`]);
    timed = ["merge", "-q", "--no-ff", "--no-edit", `side-${id}`];
  } else {
    // A branch change to a branch whose work file differs, or does not differ, from the store.
    site.prep(["checkout", "-q", "-b", `other-${id}`]);
    site.stageChange(state);
    site.prep(["commit", "-q", "-m", `Other ${id}`]);
    site.prep(["checkout", "-q", site.branch]);
    timed = ["checkout", "-q", `other-${id}`];
    after = () => site.prep(["checkout", "-q", site.branch]);
  }
  const before = storeFingerprint(site.store);
  if (mode !== "none") site.clearRunFiles();
  if (mode === "fallback") site.forceFallback();
  const out = site.git(timed);
  let settleMs = 0;
  let last = null;
  let foreground = null;
  if (mode !== "none") {
    const start = performance.now();
    site.settle();
    settleMs = performance.now() - start;
    last = site.runFile("last.json");
    foreground = site.runFile("foreground.json");
  }
  const clean = site.prep(["status", "--porcelain"]).output.trim() === "";
  const storeChanged = storeFingerprint(site.store) !== before;
  after();
  // Correctness. A hook changes no project file. An import happens only for a changed work file, and never for a branch change.
  if (!clean) throw new Error(`${mode} ${action} ${state}: the work tree is not clean after the action`);
  const expectImport = mode !== "none" && state === "oneWorkFile" && action !== "branchChange";
  if (storeChanged !== expectImport) throw new Error(`${mode} ${action} ${state}: store changed=${storeChanged}, expected ${expectImport}`);
  // Each background checkpoint ran to its end, with exit code 0.
  if (mode !== "none" && (!last || last.exitCode !== 0)) throw new Error(`${mode} ${action} ${state}: no background run ended with exit code 0: ${JSON.stringify(last)}`);
  // The foreground fallback ran only in its mode.
  if ((foreground !== null) !== (mode === "fallback")) throw new Error(`${mode} ${action} ${state}: foreground fallback seen=${foreground !== null}`);
  const printed = out.output.trim() !== "";
  // What a person sees. The background mode prints nothing, in each state. The foreground fallback prints when something is due.
  const expectPrint = mode === "fallback" && state === "oneWorkFile";
  if (printed !== expectPrint) throw new Error(`${mode} ${action} ${state}: printed=${printed}, expected ${expectPrint}: ${out.output.slice(0, 200)}`);
  return { ms: ms(out.ms), afterReturnMs: ms(settleMs), firstLine: printed ? out.output.trim().split("\n")[0].replace(/\d+/g, "<n>") : null, lines: printed ? out.output.trim().split("\n").length : 0 };
}

outer: for (let index = 1; index <= runs; index += 1) {
  if (performance.now() - started > budgetMs) {
    failure("elapsed budget reached");
    break;
  }
  const runRoot = path.join(workRoot, `run-${index}`);
  const record = { run: index, ms: {}, afterReturnMs: {}, firstSync: {}, seen: {} };
  try {
    // Clone A: no hook, and then the installed hooks in the background mode. Clone B: the installed hooks in the foreground fallback.
    const sites = { none: makeSite(runRoot, "a"), fallback: makeSite(runRoot, "b") };
    sites.background = sites.none;
    record.commit = sites.none.git(["rev-parse", "--short=8", "HEAD~0"]).output.trim();
    record.floor = [0, 1, 2].map(() => {
      const start = performance.now();
      sites.none.make(["--version"], "version");
      return ms(performance.now() - start);
    });
    for (const mode of MODES) {
      const site = sites[mode];
      site.installHooks(mode);
      if (mode !== "none") {
        // The first sync of the checkout, started by the hook after a commit. No sync ran in this clone before.
        const unitsBefore = storeFingerprint(site.store);
        if (!unitsBefore.startsWith("0:")) throw new Error(`${mode}: the Store holds work units before the first sync`);
        site.stageChange("noChange");
        if (mode === "fallback") site.forceFallback();
        const out = site.git(["commit", "-q", "-m", "First sync"]);
        const start = performance.now();
        site.settle();
        const afterReturn = performance.now() - start;
        const units = Number(storeFingerprint(site.store).split(":")[0]);
        if (units === 0) throw new Error(`${mode}: the first sync imported no unit`);
        if (site.prep(["status", "--porcelain"]).output.trim() !== "") throw new Error(`${mode}: the first sync changed a project file`);
        record.firstSync[mode] = { ms: ms(out.ms), afterReturnMs: ms(afterReturn), units, firstLine: out.output.trim() ? out.output.trim().split("\n")[0].replace(/\d+/g, "<n>") : null };
      } else {
        // The rounds with no hook need no Store. The first sync of clone A comes with the installed hooks.
      }
      for (let round = 0; round < rounds; round += 1) {
        for (const action of ACTIONS) {
          for (const state of STATES) {
            const key = `${mode}.${action}.${state}`;
            const one = sample(site, mode, action, state);
            (record.ms[key] ??= []).push(one.ms);
            (record.afterReturnMs[key] ??= []).push(one.afterReturnMs);
            record.seen[key] = { firstLine: one.firstLine, lines: one.lines };
          }
        }
      }
    }
    result.runs.push(record);
  } catch (error) {
    record.error = String(error.message ?? error);
    result.runs.push(record);
    failure(`first failure in run ${index}: ${record.error}`);
    break outer;
  } finally {
    rmSync(runRoot, { recursive: true, force: true });
  }
}

if (!result.stop) result.stop = { reason: `all ${runs} runs done`, elapsedSeconds: ms((performance.now() - started) / 1000) };
const stat = (values) => (values.length ? { samples: values.length, median: ms(median(values)), min: Math.min(...values), max: Math.max(...values) } : null);
const all = (field, key) => result.runs.flatMap((record) => record[field]?.[key] ?? []);
result.summary = { floor: stat(result.runs.flatMap((record) => record.floor ?? [])), actions: {}, firstSync: {} };
for (const action of ACTIONS) {
  for (const state of STATES) {
    const none = stat(all("ms", `none.${action}.${state}`));
    const row = { none };
    for (const mode of ["background", "fallback"]) {
      const timed = stat(all("ms", `${mode}.${action}.${state}`));
      row[mode] = timed && none ? { ...timed, adds: ms(timed.median - none.median), afterReturnMedian: stat(all("afterReturnMs", `${mode}.${action}.${state}`))?.median ?? null } : timed;
    }
    result.summary.actions[`${action}.${state}`] = row;
  }
}
for (const mode of ["background", "fallback"]) {
  const samples = result.runs.map((record) => record.firstSync?.[mode]).filter(Boolean);
  result.summary.firstSync[mode] = samples.length ? { ...stat(samples.map((one) => one.ms)), afterReturnMedian: ms(median(samples.map((one) => one.afterReturnMs))), units: samples[0].units } : null;
}
result.runtime = { node: process.version, platform: process.platform, arch: process.arch, cpus: os.cpus().length, cpuModel: os.cpus()[0]?.model ?? null, memoryGiB: Math.round(os.totalmem() / 2 ** 30), git: spawnSync("git", ["--version"], { encoding: "utf8" }).stdout.trim() };
writeFileSync(outJson, `${JSON.stringify(result, null, 1)}\n`);
console.log(JSON.stringify({ stop: result.stop, summary: result.summary }, null, 1));
