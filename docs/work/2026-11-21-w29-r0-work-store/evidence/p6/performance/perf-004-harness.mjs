// PERF-004 harness (W29 R0 P6). Times the installed make-docs CLI on a fresh clone of a project with many backlogs.
// It never reads or writes the real Store: it refuses to run unless every run gets its own temporary
// MAKE_DOCS_HOME and HOME below the work folder you pass.
// Usage: node perf-004-harness.mjs <installed make-docs bin> <git repo to clone> <empty work folder> <out.json> [runs=3] [rounds=5]
import { spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";

const [cli, source, work, outJson, runsArg = "3", roundsArg = "5"] = process.argv.slice(2);
if (!cli || !source || !work || !outJson) throw new Error("usage: perf-004-harness.mjs <cli> <repo> <work folder> <out.json> [runs] [rounds]");
const runs = Number(runsArg);
const rounds = Number(roundsArg);
const workRoot = path.resolve(work);
const realStore = path.join(os.homedir(), ".make-docs");
if (workRoot === realStore || workRoot.startsWith(realStore + path.sep)) throw new Error("The work folder is inside the real Store.");
if (existsSync(workRoot) && readdirSync(workRoot).length > 0) throw new Error("The work folder must be new or empty.");
mkdirSync(workRoot, { recursive: true });

const budgetMs = 30 * 60 * 1000; // Elapsed limit of the profile.
const started = performance.now();
const ms = (value) => Math.round(value * 10) / 10;
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

function run(cwd, env, args, label) {
  const start = performance.now();
  const result = spawnSync(cli, args, { cwd, env, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  const elapsed = performance.now() - start;
  if (result.status !== 0) {
    const error = new Error(`${label} exited ${result.status}: ${(result.stderr || result.stdout).slice(0, 400)}`);
    error.label = label;
    throw error;
  }
  let json = null;
  try {
    json = JSON.parse(result.stdout);
  } catch {
    json = null;
  }
  return { ms: elapsed, json, stdout: result.stdout };
}

function git(cwd, args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout;
}

/** Count and revision sum of the work units in this run's own temporary Store, read only. */
function storeUnitFingerprint(store) {
  const db = new DatabaseSync(path.join(store, "store.db"), { readOnly: true });
  try {
    const row = db.prepare("SELECT COUNT(*) AS units, COALESCE(SUM(revision), 0) AS revisions FROM work_units").get();
    return { units: Number(row.units), revisions: Number(row.revisions) };
  } finally {
    db.close();
  }
}

function workFilesClean(repo) {
  return git(repo, ["status", "--porcelain", "--", "docs/work", ".make-docs/archive/work"]).trim() === "";
}

const syncCounts = (sync) => ({
  imported: sync.imported.length,
  written: sync.written.length,
  removed: sync.removed.length,
  conflicts: sync.conflicts.length,
  unreadable: sync.unreadable.length,
  fileErrors: sync.fileErrors.length,
});

const result = { profile: "PERF-004", profileVersion: 1, note: "Paths, project names, and IDs are left out. Each run used a fresh clone and a fresh temporary Store.", runs: [], stop: null };
const failure = (reason) => {
  result.stop = { reason, elapsedSeconds: ms((performance.now() - started) / 1000) };
};

outer: for (let index = 1; index <= runs; index += 1) {
  if (performance.now() - started > budgetMs) {
    failure("elapsed budget reached");
    break;
  }
  const runRoot = path.join(workRoot, `run-${index}`);
  const repo = path.join(runRoot, "repo");
  const home = path.join(runRoot, "home");
  const store = path.join(runRoot, "store");
  mkdirSync(home, { recursive: true });
  const env = { ...process.env, MAKE_DOCS_HOME: store, HOME: home, USERPROFILE: home, CODEX_HOME: path.join(home, ".codex"), CLAUDE_CONFIG_DIR: path.join(home, ".claude") };
  const record = { run: index, checks: {}, ms: {} };
  try {
    git(workRoot, ["clone", "-q", "--no-hardlinks", source, repo]);
    record.commit = git(repo, ["rev-parse", "--short=8", "HEAD"]).trim();
    // A fresh Store has no record of the clone's saved project ID: the first setup makes the Store and stops
    // on ambiguous ownership, and the second adopts the checkout (as a person does).
    const methods = ["--codex-method", "none", "--claude-code-method", "none", "--github-copilot-method", "none"];
    const initial = spawnSync(cli, ["setup", "--yes", ...methods], { cwd: repo, env, encoding: "utf8" });
    record.setupFirstStatus = JSON.parse(initial.stdout || "{}").status ?? null;
    // The plain setup must make the Store and stop on ownership; anything else is not this workload.
    if (record.setupFirstStatus !== "blocked") throw new Error(`plain setup status ${record.setupFirstStatus}, expected blocked`);
    const setup = run(repo, env, ["setup", "--yes", "--adopt", ...methods], "setup --adopt");
    if (setup.json?.status !== "complete") throw new Error(`setup status ${setup.json?.status}`);
    record.setupMs = ms(setup.ms);
    record.ms.floor = [0, 1, 2].map(() => ms(run(repo, env, ["--version"], "version").ms));
    const first = run(repo, env, ["work", "sync", "--json"], "first import");
    record.ms.firstImport = ms(first.ms);
    record.checks.firstImport = { ...syncCounts(first.json.sync), firstImport: first.json.sync.firstImport, summary: first.json.sync.summary.replace(/\d+ work files/, "<n> work files") };
    record.checks.firstImportWroteNoFile = workFilesClean(repo);
    const firstCounts = record.checks.firstImport;
    if (!record.checks.firstImportWroteNoFile || firstCounts.written || firstCounts.removed || firstCounts.conflicts || firstCounts.unreadable || firstCounts.fileErrors) {
      throw new Error("first import changed a file, or found a conflict, an unreadable file, or a file error");
    }
    record.checks.storeAfterFirstImport = storeUnitFingerprint(store);
    const series = { noChangeSync: [], next: [], status: [], snapshotStore: [], snapshotFiles: [] };
    for (let round = 0; round < rounds; round += 1) {
      const sync = run(repo, env, ["work", "sync", "--json"], "no-change sync");
      const counts = syncCounts(sync.json.sync);
      if (counts.imported || counts.written || counts.removed || counts.conflicts || counts.unreadable || counts.fileErrors) throw new Error(`no-change sync changed something: ${JSON.stringify(counts)}`);
      series.noChangeSync.push(ms(sync.ms));
      const next = run(repo, env, ["work", "next", "--json"], "work next");
      series.next.push(ms(next.ms));
      record.checks.next = { ready: next.json.ready.length, waiting: next.json.waiting.length, syncCheck: next.json.sync.summary };
      const status = run(repo, env, ["work", "status", "--json"], "work status");
      series.status.push(ms(status.ms));
      record.checks.status = { mode: status.json.mode, counts: status.json.counts };
      const snapStore = run(repo, env, ["backlog", "snapshot", "--work-store", "--target-root", ".", "--json"], "snapshot --work-store");
      series.snapshotStore.push(ms(snapStore.ms));
      record.checks.snapshotStore = { workStoreKey: snapStore.json?.workStore !== undefined || snapStore.stdout.includes("\"workStore\""), bytes: snapStore.stdout.length };
      const snapFiles = run(repo, env, ["backlog", "snapshot", "--target-root", ".", "--json"], "snapshot files");
      series.snapshotFiles.push(ms(snapFiles.ms));
      record.checks.snapshotFiles = { workStoreKey: snapFiles.stdout.includes("\"workStore\""), bytes: snapFiles.stdout.length };
    }
    Object.assign(record.ms, series);
    record.checks.workFilesUnchangedAfterRun = workFilesClean(repo);
    record.checks.storeAfterRun = storeUnitFingerprint(store);
    record.checks.storeUnitsUnchangedAfterRun = JSON.stringify(record.checks.storeAfterRun) === JSON.stringify(record.checks.storeAfterFirstImport);
    record.median = Object.fromEntries(Object.entries(series).map(([key, values]) => [key, ms(median(values))]));
    record.median.floor = ms(median(record.ms.floor));
    result.runs.push(record);
    if (!record.checks.workFilesUnchangedAfterRun) throw new Error("a work file changed during the run");
    if (!record.checks.storeUnitsUnchangedAfterRun) throw new Error("a store unit changed during the syncs with no change");
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
const all = (key) => result.runs.flatMap((record) => (Array.isArray(record.ms[key]) ? record.ms[key] : record.ms[key] === undefined ? [] : [record.ms[key]]));
result.summary = Object.fromEntries(
  ["floor", "firstImport", "noChangeSync", "next", "status", "snapshotStore", "snapshotFiles"].map((key) => {
    const values = all(key);
    return [key, values.length ? { samples: values.length, median: ms(median(values)), min: Math.min(...values), max: Math.max(...values) } : null];
  }),
);
result.runtime = { node: process.version, platform: process.platform, arch: process.arch, cpus: os.cpus().length, cpuModel: os.cpus()[0]?.model ?? null, memoryGiB: Math.round(os.totalmem() / 2 ** 30) };
writeFileSync(outJson, `${JSON.stringify(result, null, 1)}\n`);
console.log(JSON.stringify({ stop: result.stop, summary: result.summary }, null, 1));
