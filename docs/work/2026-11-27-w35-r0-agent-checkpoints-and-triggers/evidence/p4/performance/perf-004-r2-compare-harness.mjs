// W35 R0 P4 review correction: a comparison, in one session, of the build with the sync core fix and the build
// with the sync core as it was before the fix. This is a side measure beside PERF-004-R2. It is not part of the
// PERF-004 workload, and it is not a result of that profile.
// The two builds differ in one source file only. Both run on the same clone and on the same temporary Store, and
// the samples alternate, so that a slow moment of the machine reaches both builds.
// It never reads or writes the real Store: the run gets its own temporary MAKE_DOCS_HOME and HOME below the work
// folder you pass.
// Usage: node perf-004-r2-compare-harness.mjs <dist/index.js of the fixed build> <dist/index.js of the old build>
//          <git repo to clone> <empty work folder> <out.json> [samples=25]
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";

const [fixedCli, oldCli, source, work, outJson, samplesArg = "25"] = process.argv.slice(2);
if (!fixedCli || !oldCli || !source || !work || !outJson) throw new Error("usage: perf-004-r2-compare-harness.mjs <fixed cli> <old cli> <repo> <work folder> <out.json> [samples]");
const samples = Number(samplesArg);
if (!Number.isInteger(samples) || samples < 1) throw new Error("The sample count must be a whole number above 0.");
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
// Drop each git variable of the caller, so the clone cannot reach another repository through one.
const env = {};
for (const [key, value] of Object.entries(process.env)) if (!/^GIT_/i.test(key)) env[key] = value;
Object.assign(env, { MAKE_DOCS_HOME: store, HOME: home, USERPROFILE: home, CODEX_HOME: path.join(home, ".codex"), CLAUDE_CONFIG_DIR: path.join(home, ".claude"), GIT_CONFIG_GLOBAL: emptyConfig, GIT_CONFIG_SYSTEM: emptyConfig, GIT_CONFIG_NOSYSTEM: "1" });
if (!env.MAKE_DOCS_HOME || !env.MAKE_DOCS_HOME.startsWith(workRoot)) throw new Error("The Store of the run is not inside the work folder.");

const builds = { fixed: path.resolve(fixedCli), old: path.resolve(oldCli) };
const commands = {
  "work sync": ["work", "sync", "--json"],
  "project checkpoint": ["project", "checkpoint", "--json"],
};

function run(build, args, label) {
  const start = performance.now();
  const out = spawnSync(process.execPath, [builds[build], ...args], { cwd: repo, env, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const elapsed = performance.now() - start;
  if (out.status !== 0) throw new Error(`${label} (${build}) exited ${out.status}: ${(out.stderr || out.stdout).slice(0, 300)}`);
  return { ms: elapsed, json: JSON.parse(out.stdout) };
}

/** Stop when a run with no change did change something, so that each sample measures the same work. */
function checkNoChange(command, json) {
  if (command === "work sync") {
    const sync = json.sync;
    if (sync.imported.length || sync.written.length || sync.removed.length || sync.conflicts.length) throw new Error("a sync with no change changed something");
    return;
  }
  if (json.syncRan !== true) throw new Error("the checkpoint did not run the sync");
  if (json.imported.length || json.written.length || json.conflicts.length || json.waiting.length) throw new Error("a checkpoint with no change changed something");
}

const result = {
  measure: "sync-core-fix-same-session-comparison",
  note: "Paths, project names, and IDs are left out. Times are in milliseconds, for one CLI process from spawn to exit.",
  samplesPerBuildAndCommand: samples,
  order: "For each sample and each command, both builds run one after the other. The build that runs first changes with each sample.",
  commands: {},
};
const startedAt = performance.now();
try {
  const clone = spawnSync("git", ["clone", "-q", "--no-hardlinks", source, repo], { cwd: workRoot, env, encoding: "utf8" });
  if (clone.status !== 0) throw new Error(`git clone failed: ${clone.stderr}`);
  const methods = ["--codex-method", "none", "--claude-code-method", "none", "--github-copilot-method", "none"];
  // A plain setup makes the Store and stops on ownership. The second setup adopts the checkout.
  spawnSync(process.execPath, [builds.fixed, "setup", "--yes", ...methods], { cwd: repo, env, encoding: "utf8" });
  if (run("fixed", ["setup", "--yes", "--adopt", ...methods], "setup --adopt").json.status !== "complete") throw new Error("setup --adopt did not complete");
  const first = run("fixed", ["work", "sync", "--json"], "first import");
  result.workFiles = first.json.sync.imported.length;
  // One run of each command with each build that is not counted, so that no sample is the first run of a build.
  for (const [command, args] of Object.entries(commands)) for (const build of Object.keys(builds)) checkNoChange(command, run(build, args, `warm ${command}`).json);

  for (const command of Object.keys(commands)) result.commands[command] = { fixed: [], old: [] };
  for (let sample = 0; sample < samples; sample += 1) {
    for (const [command, args] of Object.entries(commands)) {
      const order = sample % 2 === 0 ? ["fixed", "old"] : ["old", "fixed"];
      for (const build of order) {
        const one = run(build, args, command);
        checkNoChange(command, one.json);
        result.commands[command][build].push(ms(one.ms));
      }
    }
  }
  const status = spawnSync("git", ["status", "--porcelain", "--", "docs/work"], { cwd: repo, env, encoding: "utf8" });
  result.workFilesChangedByTheRuns = status.stdout.split("\n").filter((entry) => entry !== "").length;

  result.summary = {};
  for (const [command, byBuild] of Object.entries(result.commands)) {
    const pairs = byBuild.fixed.map((value, index) => value - byBuild.old[index]);
    result.summary[command] = {
      fixedMedian: ms(median(byBuild.fixed)),
      fixedRange: [Math.min(...byBuild.fixed), Math.max(...byBuild.fixed)],
      oldMedian: ms(median(byBuild.old)),
      oldRange: [Math.min(...byBuild.old), Math.max(...byBuild.old)],
      fixedMinusOldOfMedians: ms(median(byBuild.fixed) - median(byBuild.old)),
      medianOfPairDifferences: ms(median(pairs)),
      pairsWhereFixedIsSlower: pairs.filter((value) => value > 0).length,
    };
  }
} finally {
  rmSync(workRoot, { recursive: true, force: true });
}
result.harnessSeconds = Math.round((performance.now() - startedAt) / 1000);
result.builds = Object.fromEntries(Object.entries(builds).map(([name, file]) => [name, { entrySha256: createHash("sha256").update(readFileSync(file)).digest("hex") }]));
result.runtime = { node: process.version, platform: process.platform, arch: process.arch };
writeFileSync(outJson, `${JSON.stringify(result, null, 1)}\n`);
console.log(JSON.stringify(result.summary, null, 1));
