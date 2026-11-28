// PERF-006 harness (W35 R0 P2). Times a sample of installed make-docs commands with the reminder check and with no check.
// It never reads or writes the real Store: every run gets its own temporary MAKE_DOCS_HOME and HOME below the work
// folder you pass, and it refuses a work folder inside the real Store.
// Usage: node perf-006-harness.mjs <install with the check> <install for the build with no check> <git repo to clone> <empty work folder> <out.json> [runs=3] [rounds=5]
// Each install is a folder where `npm install <candidate tarball>` ran. The harness changes the second one:
// in its bundle, the function workReminderFor returns null in its first statement.
import { spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";

const [installCheck, installNoCheck, source, work, outJson, runsArg = "3", roundsArg = "5"] = process.argv.slice(2);
if (!installCheck || !installNoCheck || !source || !work || !outJson) throw new Error("usage: perf-006-harness.mjs <install with check> <install no check> <repo> <work folder> <out.json> [runs] [rounds]");
const runs = Number(runsArg);
const rounds = Number(roundsArg);
const workRoot = path.resolve(work);
const realStore = path.join(os.homedir(), ".make-docs");
if (workRoot === realStore || workRoot.startsWith(realStore + path.sep)) throw new Error("The work folder is inside the real Store.");
if (existsSync(workRoot) && readdirSync(workRoot).length > 0) throw new Error("The work folder must be new or empty.");
mkdirSync(workRoot, { recursive: true });

const REMINDER = "Work files wait for sync. Run: make-docs project checkpoint";
const WAIT_FILE = "docs/work/2026-11-27-w35-r0-agent-checkpoints-and-triggers/07-acceptance.md";
const binOf = (install) => path.join(path.resolve(install), "node_modules", ".bin", "make-docs");
const distOf = (install) => path.join(path.resolve(install), "node_modules", "@brucewaynedecoy", "make-docs", "dist");

/** Make the build with no check: exactly one place in exactly one bundle file changes. */
function removeCheck(install) {
  const marker = /(async function workReminderFor\([^)]*\) \{\n)/g;
  const done = "/* PERF-006: no check */ return null;";
  let changed = 0;
  let already = 0;
  for (const name of readdirSync(distOf(install))) {
    if (!name.endsWith(".js")) continue;
    const file = path.join(distOf(install), name);
    const text = readFileSync(file, "utf8");
    if (text.includes(done)) { already += 1; continue; }
    const hits = text.match(marker)?.length ?? 0;
    if (hits === 0) continue;
    if (hits !== 1) throw new Error(`${name} holds ${hits} places to change, expected 1.`);
    writeFileSync(file, text.replace(marker, `$1  ${done}\n`));
    changed += 1;
  }
  if (changed + already !== 1) throw new Error(`The build with no check needs exactly one changed bundle file, found ${changed + already}.`);
}
function hasCheck(install) {
  return readdirSync(distOf(install)).filter((name) => name.endsWith(".js")).some((name) => {
    const text = readFileSync(path.join(distOf(install), name), "utf8");
    return /async function workReminderFor\(/.test(text) && !text.includes("PERF-006: no check");
  });
}
removeCheck(installNoCheck);
if (!hasCheck(installCheck)) throw new Error("The first install does not hold the reminder check.");
if (hasCheck(installNoCheck)) throw new Error("The second install still holds the reminder check.");
const BUILDS = [["noCheck", binOf(installNoCheck)], ["check", binOf(installCheck)]];

const started = performance.now();
const budgetMs = 30 * 60 * 1000;
const ms = (value) => Math.round(value * 10) / 10;
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

function run(cli, cwd, env, args, label) {
  const start = performance.now();
  const result = spawnSync(cli, args, { cwd, env, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  const elapsed = performance.now() - start;
  if (result.status !== 0) throw new Error(`${label} exited ${result.status}: ${(result.stderr || result.stdout).slice(0, 400)}`);
  let json = null;
  try { json = JSON.parse(result.stdout); } catch { json = null; }
  return { ms: elapsed, json, stdout: result.stdout, stderr: result.stderr };
}

function git(cwd, args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout;
}

function storeUnits(store) {
  const db = new DatabaseSync(path.join(store, "store.db"), { readOnly: true });
  try { return Number(db.prepare("SELECT COUNT(*) AS units FROM work_units").get().units); } finally { db.close(); }
}

/** The sample: one command or more from each group of the reminder set. `syncsFirst` commands import a waiting file themselves. */
const COMMANDS = [
  { key: "projectStateStatus", group: "project", args: () => ["project", "state", "status", "--json"] },
  { key: "lifecycleList", group: "lifecycle", args: () => ["lifecycle", "list", "--json"] },
  { key: "factoryStatus", group: "factory", args: () => ["factory", "status", "--json"] },
  { key: "workEvidenceRead", group: "work", args: () => ["work", "evidence", "read", "W35 R0 P1", "--json"] },
  { key: "resourceEnsureDryRun", group: "resource", args: () => ["resource", "ensure", "make-docs://system/reference/lifecycle.md", "--allow-write", "--approve", "resource-projection-write", "--dry-run"] },
  { key: "backlogSnapshotStore", group: "work", runsSyncCheck: true, args: () => ["backlog", "snapshot", "--work-store", "--target-root", ".", "--json"] },
  { key: "workAdd", group: "work", syncsFirst: true, args: (n) => ["work", "add", `PERF-006 sample ${n}`, "--json"] },
];

const result = { profile: "PERF-006", profileVersion: 1, note: "Paths, project names, and IDs are left out. Each run used a fresh clone and a fresh temporary Store. noCheck is the same package with the reminder check taken out.", runs: [], stop: null };
const failure = (reason) => { result.stop = { reason, elapsedSeconds: ms((performance.now() - started) / 1000) }; };
const count = (text, needle) => text.split(needle).length - 1;

outer: for (let index = 1; index <= runs; index += 1) {
  if (performance.now() - started > budgetMs) { failure("elapsed budget reached"); break; }
  const runRoot = path.join(workRoot, `run-${index}`);
  const repo = path.join(runRoot, "repo");
  const home = path.join(runRoot, "home");
  const store = path.join(runRoot, "store");
  mkdirSync(home, { recursive: true });
  const env = { ...process.env, MAKE_DOCS_HOME: store, HOME: home, USERPROFILE: home, CODEX_HOME: path.join(home, ".codex"), CLAUDE_CONFIG_DIR: path.join(home, ".claude") };
  if (!env.MAKE_DOCS_HOME) throw new Error("MAKE_DOCS_HOME is empty.");
  const record = { run: index, checks: {}, ms: {} };
  const cli = BUILDS[1][1];
  let sample = 0;
  try {
    git(workRoot, ["clone", "-q", "--no-hardlinks", source, repo]);
    record.commit = git(repo, ["rev-parse", "--short=8", "HEAD"]).trim();
    const methods = ["--codex-method", "none", "--claude-code-method", "none", "--github-copilot-method", "none"];
    const initial = spawnSync(cli, ["setup", "--yes", ...methods], { cwd: repo, env, encoding: "utf8" });
    record.setupFirstStatus = JSON.parse(initial.stdout || "{}").status ?? null;
    if (record.setupFirstStatus !== "blocked") throw new Error(`plain setup status ${record.setupFirstStatus}, expected blocked`);
    const setup = run(cli, repo, env, ["setup", "--yes", "--adopt", ...methods], "setup --adopt");
    if (setup.json?.status !== "complete") throw new Error(`setup status ${setup.json?.status}`);
    const first = run(cli, repo, env, ["work", "sync", "--json"], "first import");
    record.checks.workFilesImported = first.json.sync.imported.length;
    if (first.json.sync.conflicts.length || first.json.sync.unreadable.length) throw new Error("first import found a conflict or an unreadable file");
    record.checks.storeUnits = storeUnits(store);
    record.ms.floor = {};
    for (const [build, bin] of BUILDS) record.ms.floor[build] = [0, 1, 2].map(() => ms(run(bin, repo, env, ["--version"], "version").ms));
    const series = {};
    const reminders = { nothingWaits: {}, oneFileWaits: {} };
    for (const state of ["nothingWaits", "oneFileWaits"]) {
      if (state === "nothingWaits") {
        const check = run(cli, repo, env, ["work", "status", "--json"], "work status");
        if (check.json.filesWaitingForImport.length !== 0) throw new Error("a file waits for import before the first state");
      }
      for (let round = 0; round < rounds; round += 1) {
        for (const command of COMMANDS) {
          for (const [build, bin] of BUILDS) {
            sample += 1;
            if (state === "oneFileWaits") appendFileSync(path.join(repo, WAIT_FILE), `\n<!-- PERF-006 sample ${sample} -->\n`);
            const out = run(bin, repo, env, command.args(sample), `${command.key} ${state} ${build}`);
            const key = `${command.key}.${state}.${build}`;
            (series[key] ??= []).push(ms(out.ms));
            const lines = count(out.stderr, REMINDER);
            reminders[state][`${command.key}.${build}`] = (reminders[state][`${command.key}.${build}`] ?? 0) + lines;
            if (out.stdout.includes(REMINDER)) throw new Error(`${key}: the reminder line is on standard output`);
            const expected = state === "oneFileWaits" && build === "check" && !command.syncsFirst ? 1 : 0;
            if (lines !== expected) throw new Error(`${key}: ${lines} reminder lines, expected ${expected}`);
            if (command.syncsFirst) {
              const imported = out.json.sync.imported.length;
              if (imported !== (state === "oneFileWaits" ? 1 : 0)) throw new Error(`${key}: its own sync imported ${imported} files`);
            }
          }
        }
      }
      if (state === "oneFileWaits") {
        const changed = git(repo, ["status", "--porcelain", "--", "docs/work", ".make-docs/archive/work"]).trim().split("\n").filter(Boolean);
        record.checks.workFilesChangedByHarness = changed.length;
        if (changed.length !== 1 || !changed[0].endsWith(WAIT_FILE)) throw new Error(`unexpected work file changes: ${changed.length}`);
      }
    }
    record.ms.series = series;
    record.checks.reminderLines = reminders;
    record.median = Object.fromEntries(Object.entries(series).map(([key, values]) => [key, ms(median(values))]));
    result.runs.push(record);
  } catch (error) {
    record.error = String(error.message ?? error);
    if (!result.runs.includes(record)) result.runs.push(record);
    failure(`first failure in run ${index}: ${record.error}`);
    break outer;
  } finally {
    rmSync(runRoot, { recursive: true, force: true });
  }
}

if (!result.stop) result.stop = { reason: `all ${runs} runs done`, elapsedSeconds: ms((performance.now() - started) / 1000) };
const stat = (values) => (values.length ? { samples: values.length, median: ms(median(values)), min: Math.min(...values), max: Math.max(...values) } : null);
result.summary = { floor: {}, commands: [] };
for (const [build] of BUILDS) result.summary.floor[build] = stat(result.runs.flatMap((record) => record.ms.floor?.[build] ?? []));
for (const command of COMMANDS) {
  for (const state of ["nothingWaits", "oneFileWaits"]) {
    const of = (build) => stat(result.runs.flatMap((record) => record.ms.series?.[`${command.key}.${state}.${build}`] ?? []));
    const noCheck = of("noCheck");
    const check = of("check");
    result.summary.commands.push({ command: command.key, group: command.group, syncsFirst: command.syncsFirst === true, runsSyncCheckItself: command.runsSyncCheck === true, state, noCheck, check, addedMs: noCheck && check ? ms(check.median - noCheck.median) : null });
  }
}
result.summary.largestAddedMs = Math.max(...result.summary.commands.map((entry) => entry.addedMs ?? -Infinity));
result.runtime = { node: process.version, platform: process.platform, arch: process.arch, cpus: os.cpus().length, cpuModel: os.cpus()[0]?.model ?? null, memoryGiB: Math.round(os.totalmem() / 2 ** 30) };
writeFileSync(outJson, `${JSON.stringify(result, null, 1)}\n`);
console.log(JSON.stringify({ stop: result.stop, floor: result.summary.floor, largestAddedMs: result.summary.largestAddedMs, commands: result.summary.commands.map((entry) => `${entry.command} ${entry.state}: ${entry.noCheck?.median} -> ${entry.check?.median} (+${entry.addedMs})`) }, null, 1));
