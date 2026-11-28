// W35 R0 P4 T22: the time that a second sync waits for the Store while the first one works. This is a side measure
// beside PERF-004-R2. It is not part of the PERF-004 workload, which runs one process at a time.
// It never reads or writes the real Store: the run gets its own temporary MAKE_DOCS_HOME and HOME below the work
// folder you pass.
// Usage: node perf-004-r2-wait-harness.mjs <installed make-docs bin> <git repo to clone> <empty work folder> <out.json> [rounds=5]
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";

const [cli, source, work, outJson, roundsArg = "5"] = process.argv.slice(2);
if (!cli || !source || !work || !outJson) throw new Error("usage: perf-004-r2-wait-harness.mjs <cli> <repo> <work folder> <out.json> [rounds]");
const rounds = Number(roundsArg);
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
const repo = path.join(workRoot, "repo");
const home = path.join(workRoot, "home");
const store = path.join(workRoot, "store");
mkdirSync(home, { recursive: true });
const emptyConfig = path.join(workRoot, "empty.gitconfig");
writeFileSync(emptyConfig, "");
const env = { ...process.env, MAKE_DOCS_HOME: store, HOME: home, USERPROFILE: home, CODEX_HOME: path.join(home, ".codex"), CLAUDE_CONFIG_DIR: path.join(home, ".claude"), GIT_CONFIG_GLOBAL: emptyConfig, GIT_CONFIG_SYSTEM: emptyConfig, GIT_CONFIG_NOSYSTEM: "1" };
if (!env.MAKE_DOCS_HOME.startsWith(workRoot)) throw new Error("The Store of the run is not inside the work folder.");

function run(args, label) {
  const start = performance.now();
  const out = spawnSync(cli, args, { cwd: repo, env, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (out.status !== 0) throw new Error(`${label} exited ${out.status}: ${(out.stderr || out.stdout).slice(0, 300)}`);
  return { ms: performance.now() - start, json: JSON.parse(out.stdout) };
}

function start(args) {
  return new Promise((resolve, reject) => {
    const began = performance.now();
    const child = spawn(cli, args, { cwd: repo, env });
    let stdout = "";
    child.stdout.on("data", (chunk) => { stdout += String(chunk); });
    child.on("error", reject);
    child.on("close", (status) => resolve({ status, ms: performance.now() - began, stdout }));
  });
}

const result = { measure: "second-sync-wait", note: "Paths, project names, and IDs are left out.", single: [], pairFirst: [], pairSecond: [] };
try {
  const clone = spawnSync("git", ["clone", "-q", "--no-hardlinks", source, repo], { cwd: workRoot, env, encoding: "utf8" });
  if (clone.status !== 0) throw new Error(`git clone failed: ${clone.stderr}`);
  const methods = ["--codex-method", "none", "--claude-code-method", "none", "--github-copilot-method", "none"];
  spawnSync(cli, ["setup", "--yes", ...methods], { cwd: repo, env, encoding: "utf8" });
  if (run(["setup", "--yes", "--adopt", ...methods], "setup --adopt").json.status !== "complete") throw new Error("setup --adopt did not complete");
  const first = run(["work", "sync", "--json"], "first import");
  result.workFiles = first.json.sync.imported.length;
  for (let round = 0; round < rounds; round += 1) {
    result.single.push(ms(run(["work", "sync", "--json"], "single sync").ms));
    // Two syncs with no change, started at the same time. The one that ends last waited for the other one.
    const pair = await Promise.all([start(["work", "sync", "--json"]), start(["work", "sync", "--json"])]);
    for (const one of pair) {
      if (one.status !== 0) throw new Error(`a sync of the pair exited ${one.status}`);
      const sync = JSON.parse(one.stdout).sync;
      if (sync.imported.length || sync.written.length || sync.removed.length || sync.conflicts.length) throw new Error("a sync of the pair changed something");
    }
    const times = pair.map((one) => one.ms).sort((a, b) => a - b);
    result.pairFirst.push(ms(times[0]));
    result.pairSecond.push(ms(times[1]));
  }
  result.summary = {
    singleMedian: ms(median(result.single)),
    pairFirstMedian: ms(median(result.pairFirst)),
    pairSecondMedian: ms(median(result.pairSecond)),
    secondWaitsMedian: ms(median(result.pairSecond) - median(result.single)),
  };
} finally {
  rmSync(workRoot, { recursive: true, force: true });
}
result.runtime = { node: process.version, platform: process.platform, arch: process.arch };
writeFileSync(outJson, `${JSON.stringify(result, null, 1)}\n`);
console.log(JSON.stringify(result.summary, null, 1));
