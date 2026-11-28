// W35 R0 P5 side measure, outside the PERF-007 profile: the time that the installed git hooks add to a commit, by
// the count of work files. It makes one temporary project for each count, with made-up work files, installs the
// hooks through setup, and times a commit with nothing due: with the hooks off, with the hooks in the background
// mode, and with the hooks in the foreground fallback. It also records when the background checkpoint ends.
// It never reads or writes the real Store: each project gets its own temporary MAKE_DOCS_HOME and HOME below the
// work folder you pass. Its git child processes read no global and no system git config.
// Usage: node hook-cost-by-work-files.mjs <make-docs command file> <empty work folder> <out.json> [samples=7] [counts=100,470,1000,2000]
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";

const [cli, work, outJson, samplesArg = "7", countsArg = "100,470,1000,2000"] = process.argv.slice(2);
if (!cli || !work || !outJson) throw new Error("usage: hook-cost-by-work-files.mjs <cli> <work folder> <out.json> [samples] [counts]");
const samples = Number(samplesArg);
const counts = countsArg.split(",").map(Number);
const workRoot = path.resolve(work);
const realStore = path.join(os.homedir(), ".make-docs");
if (workRoot === realStore || workRoot.startsWith(realStore + path.sep)) throw new Error("The work folder is inside the real Store.");
if (existsSync(workRoot) && readdirSync(workRoot).length > 0) throw new Error("The work folder must be new or empty.");
mkdirSync(workRoot, { recursive: true });

const ms = (value) => Math.round(value * 10) / 10;
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const sleep = (time) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, time);

/** One work phase file of a real size: about 12,000 bytes and 7 tasks. */
function phaseText(wave, phase) {
  const filler = "This sentence fills the phase file so that it has the size of a real work file of this repository. ".repeat(16);
  const tasks = Array.from({ length: 7 }, (_, index) => `- [ ] T${index + 1}: Build part ${index + 1} of phase ${phase}. ${filler}`).join("\n");
  return `---\ntitle: "Phase ${phase}: Part ${phase}"\nkind: "work"\nstatus: "active"\ncoordinate: "W${wave} R0 P${phase}"\n---\n\n# Phase ${phase}: Part ${phase}\n\n## Stage 1 - Build\n\n### Tasks\n\n${tasks}\n`;
}

function markLive(file) {
  let mark;
  try { mark = JSON.parse(readFileSync(file, "utf8")); } catch { return false; }
  if (typeof mark.pid !== "number") return Date.now() - Date.parse(mark.at ?? "") < 5000;
  try { process.kill(mark.pid, 0); return true; } catch (error) { return error.code === "EPERM"; }
}

const result = { measure: "hook cost by count of work files", note: "A side measure. It is not a result of PERF-007. Paths and IDs are left out.", samples, rows: [] };

for (const count of counts) {
  const site = path.join(workRoot, `files-${count}`);
  const repo = path.join(site, "repo");
  const home = path.join(site, "home");
  const store = path.join(site, "store");
  const noHooks = path.join(site, "no-hooks");
  const emptyConfig = path.join(site, "empty.gitconfig");
  for (const folder of [repo, home, noHooks]) mkdirSync(folder, { recursive: true });
  writeFileSync(emptyConfig, "");
  const env = {};
  for (const [key, value] of Object.entries(process.env)) if (!/^GIT_/i.test(key)) env[key] = value;
  Object.assign(env, {
    PATH: [path.dirname(cli), process.env.PATH].join(path.delimiter),
    MAKE_DOCS_HOME: store, HOME: home, USERPROFILE: home, CODEX_HOME: path.join(home, ".codex"), CLAUDE_CONFIG_DIR: path.join(home, ".claude"),
    GIT_CONFIG_GLOBAL: emptyConfig, GIT_CONFIG_SYSTEM: emptyConfig, GIT_CONFIG_NOSYSTEM: "1", GIT_CEILING_DIRECTORIES: site, GIT_TERMINAL_PROMPT: "0",
    GIT_AUTHOR_NAME: "Proof Author", GIT_AUTHOR_EMAIL: "author@example.invalid", GIT_COMMITTER_NAME: "Proof Author", GIT_COMMITTER_EMAIL: "author@example.invalid",
  });
  if (!env.MAKE_DOCS_HOME || !env.MAKE_DOCS_HOME.startsWith(workRoot)) throw new Error("The Store of a project is not inside the work folder.");
  const git = (args) => {
    const start = performance.now();
    const out = spawnSync("git", args, { cwd: repo, env, encoding: "utf8" });
    if (out.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${`${out.stdout}${out.stderr}`.slice(0, 300)}`);
    return { ms: performance.now() - start, output: `${out.stdout}${out.stderr}` };
  };
  const prep = (args) => git(["-c", `core.hooksPath=${noHooks}`, ...args]);
  const make = (args) => {
    const out = spawnSync(cli, args, { cwd: repo, env, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    if (out.status !== 0) throw new Error(`make-docs ${args.join(" ")} exited ${out.status}: ${(out.stderr || out.stdout).slice(0, 300)}`);
    return out.stdout;
  };
  git(["init", "-q", "--initial-branch=main"]);
  git(["config", "commit.gpgsign", "false"]);
  const methods = ["--codex-method", "none", "--claude-code-method", "none", "--github-copilot-method", "none"];
  make(["setup", "--yes", ...methods]);
  // 20 phase files for each backlog folder, as in the earlier side measure.
  let written = 0;
  for (let wave = 1; written < count; wave += 1) {
    const folder = path.join(repo, "docs", "work", `2042-06-01-w${wave}-r0-made-up-${wave}`);
    mkdirSync(folder, { recursive: true });
    writeFileSync(path.join(folder, "00-index.md"), `---\ntitle: "W${wave} R0 Made Up"\nkind: "work"\nstatus: "active"\ncoordinate: "W${wave} R0"\n---\n\n# W${wave} R0 Made Up\n`);
    written += 1;
    for (let phase = 1; phase <= 19 && written < count; phase += 1) {
      writeFileSync(path.join(folder, `${String(phase).padStart(2, "0")}-part.md`), phaseText(wave, phase));
      written += 1;
    }
  }
  prep(["add", "-A"]);
  prep(["commit", "-q", "-m", "The project and its work files"]);
  const done = JSON.parse(make(["setup", "--yes", "--git-hooks", ...methods]));
  if (done.gitHooks?.status !== "installed") throw new Error(`setup did not install the hooks: ${done.gitHooks?.status}`);
  const runDir = done.gitHooks.runStateDir;
  prep(["add", "-A"]);
  if (prep(["status", "--porcelain"]).output.trim() !== "") prep(["commit", "-q", "-m", "The files of setup"]);
  const settle = () => {
    const start = performance.now();
    const deadline = Date.now() + 120_000;
    while (["started.json", "pending.json", "working.json"].some((name) => markLive(path.join(runDir, name)))) {
      if (Date.now() > deadline) throw new Error("a background checkpoint did not end in 120 seconds");
      sleep(5);
    }
    return performance.now() - start;
  };
  let counter = 0;
  const stage = () => {
    counter += 1;
    writeFileSync(path.join(repo, "notes.txt"), `line ${counter}\n`);
    prep(["add", "--", "notes.txt"]);
  };
  // The first sync of the checkout, in a commit with the hooks in the background mode. One run.
  stage();
  const first = git(["commit", "-q", "-m", "First sync"]);
  const firstSync = { commitMs: ms(first.ms), endsAfterMs: ms(settle()) };
  if (first.output.trim() !== "") throw new Error("the background mode printed a line");
  const row = { workFiles: written, firstSync, none: [], background: [], backgroundEndsAfter: [], fallback: [] };
  for (let index = 0; index < samples; index += 1) {
    stage();
    row.none.push(ms(prep(["commit", "-q", "-m", `No hook ${index}`]).ms));
    stage();
    const background = git(["commit", "-q", "-m", `Background ${index}`]);
    row.backgroundEndsAfter.push(ms(settle()));
    row.background.push(ms(background.ms));
    if (background.output.trim() !== "") throw new Error("the background mode printed a line");
    stage();
    // The foreground fallback: the start mark of a background run whose process is gone.
    writeFileSync(path.join(runDir, "started.json"), JSON.stringify({ token: "side-measure", pid: 4194304 + 4242, at: new Date().toISOString(), event: "commit" }));
    row.fallback.push(ms(git(["commit", "-q", "-m", `Fallback ${index}`]).ms));
    settle();
  }
  if (prep(["status", "--porcelain"]).output.trim() !== "") throw new Error("the work tree is not clean after the measure");
  const none = median(row.none);
  row.summary = {
    noHookMedian: ms(none),
    backgroundAdds: ms(median(row.background) - none),
    backgroundEndsAfterMedian: ms(median(row.backgroundEndsAfter)),
    fallbackAdds: ms(median(row.fallback) - none),
  };
  result.rows.push(row);
  console.log(JSON.stringify({ workFiles: written, firstSync, ...row.summary }));
  rmSync(site, { recursive: true, force: true });
}

result.runtime = { node: process.version, platform: process.platform, arch: process.arch, cpus: os.cpus().length, cpuModel: os.cpus()[0]?.model ?? null, memoryGiB: Math.round(os.totalmem() / 2 ** 30), git: spawnSync("git", ["--version"], { encoding: "utf8" }).stdout.trim() };
writeFileSync(outJson, `${JSON.stringify(result, null, 1)}\n`);
