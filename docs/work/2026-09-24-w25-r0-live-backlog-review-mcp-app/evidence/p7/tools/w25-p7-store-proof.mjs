import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";

// Installed acceptance proof only. All fault files stay in the disposable stage.
async function main() {
  const stage = process.argv[2];
  if (!stage || !path.isAbsolute(stage)) throw new Error("Pass the absolute disposable P7 stage.");
  const packageRoot = path.join(stage, "qualified-install/node_modules/@brucewaynedecoy/make-docs");
  const cli = path.join(packageRoot, "dist/index.js"), project = path.join(stage, "project");
  const root = mkdtempSync(path.join(stage, "store-matrix-"));
  const requireCandidate = createRequire(path.join(packageRoot, "package.json"));
  const { Client } = await import(pathToFileURL(requireCandidate.resolve("@modelcontextprotocol/sdk/client/index.js")));
  const { StdioClientTransport } = await import(pathToFileURL(requireCandidate.resolve("@modelcontextprotocol/sdk/client/stdio.js")));
  const { parse, stringify } = requireCandidate("yaml");
  const agent = await import(pathToFileURL(path.join(project, ".agents/skills/backlog-review/scripts/agent-contract.mjs")));
  const report = JSON.parse(readFileSync(path.join(stage, "small-report.json"), "utf8"));
  const sha = bytes => createHash("sha256").update(bytes).digest("hex");
  const checks = [], states = [];
  const check = (name, condition) => { assert(condition, name); checks.push({ name, pass: true }); };
  function tree(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
      const full = path.join(directory, entry.name);
      return entry.isDirectory() ? tree(full).map(([name, hash]) => [entry.name + "/" + name, hash])
        : [[entry.name, entry.isSymbolicLink() ? "link:" + readlinkSync(full) : sha(readFileSync(full))]];
    }).sort(([a], [b]) => a.localeCompare(b));
  }
  function environment(storeRoot, caller) {
    const env = { ...process.env, MAKE_DOCS_HOME: storeRoot };
    delete env.MAKE_DOCS_HARNESS_CALLER_IDENTITY;
    if (caller) env.MAKE_DOCS_HARNESS_CALLER_IDENTITY = caller;
    return env;
  }
  async function connection(target, storeRoot, caller) {
    const client = new Client({ name: "w25-p7-installed-store-proof", version: "1" });
    await client.connect(new StdioClientTransport({ command: process.execPath,
      args: [cli, "mcp", "--profile", "backlog"], cwd: target, env: environment(storeRoot, caller), stderr: "pipe" }));
    return client;
  }
  function assertPreserved(name, payload, expectedReport, reason) {
    check(name + ": current source succeeds", payload.isError !== true && payload._meta.backlog.currentSnapshot !== null);
    check(name + ": exact typed cache limit (actual " + payload._meta.backlog.cache.reason + ")", payload._meta.backlog.cache.state === "unavailable" && payload._meta.backlog.cache.reason === reason);
    assert.deepEqual(payload._meta.backlog.envelope.report, expectedReport);
    check(name + ": full prior review remains", true);
    check(name + ": unchanged source facts", payload._meta.backlog.refresh.state === "unchanged");
    states.push({ name, reason: payload._meta.backlog.cache.reason, refresh: payload._meta.backlog.refresh.state });
  }
  const noHarness = path.join(root, "no-harness-project"); cpSync(project, noHarness, { recursive: true });
  const configPath = path.join(noHarness, ".make-docs/config.yaml");
  const config = parse(readFileSync(configPath, "utf8")); config.harnessIntegrations = [];
  writeFileSync(configPath, stringify(config));
  const cloneBefore = tree(noHarness), projectBefore = tree(project), storeBefore = tree(path.join(stage, "store"));
  const noHarnessClient = await connection(noHarness, path.join(root, "absent-store"));
  try {
    const snapshot = (await noHarnessClient.callTool({ name: "make_docs_work_backlog_snapshot", arguments: { targetRoot: noHarness } })).structuredContent.result;
    const cloneReport = { ...report, targetRoot: snapshot.targetRoot, project: snapshot.project, snapshot, diagnostics: snapshot.diagnostics,
      records: report.records.map(record => { const source = snapshot.records.find(item => item.recordPath === record.recordPath);
        return { ...record, createdAt: source.createdAt, lastUpdatedAt: source.lastUpdatedAt }; }) };
    const prepared = agent.prepareBacklogAgentOpen(cloneReport, snapshot);
    const payload = await noHarnessClient.callTool({ name: "make_docs_backlog_review_refresh", arguments: { envelope: prepared.candidateEnvelope } });
    assertPreserved("missing harness configuration", payload, cloneReport, "store-not-configured");
  } finally { await noHarnessClient.close(); }
  assert.deepEqual(tree(noHarness), cloneBefore); check("missing configuration: project bytes unchanged", true);

  const deniedClient = await connection(project, path.join(stage, "store"));
  try {
    const prepared = agent.prepareBacklogAgentOpen(report, report.snapshot);
    const payload = await deniedClient.callTool({ name: "make_docs_backlog_review_refresh", arguments: { envelope: prepared.candidateEnvelope } });
    assertPreserved("unidentified current caller", payload, report, "store-denied");
    const cacheWrite = await agent.attemptBacklogAgentCacheWrite(report, report.snapshot,
      input => deniedClient.callTool({ name: "make_docs_work_backlog_cache_write", arguments: input }));
    check("optional cache write: resolved denial is unavailable", cacheWrite.cache.state === "unavailable");
    assert.deepEqual(cacheWrite.report, report); check("optional cache write: complete current report survives", true);
  } finally { await deniedClient.close(); }

  const envelopePath = path.join(root, "envelope.json");
  writeFileSync(envelopePath, JSON.stringify(agent.prepareBacklogAgentOpen(report, report.snapshot).candidateEnvelope), { flag: "wx" });
  const inaccessible = path.join(root, "file-as-store"); writeFileSync(inaccessible, "Not a Store directory.\n", { flag: "wx" });
  const corrupt = path.join(root, "corrupt-store"); mkdirSync(corrupt);
  writeFileSync(path.join(corrupt, "store.db"), "Not a SQLite database.\n", { flag: "wx" });
  const unsafe = path.join(root, "newer-schema-store"); mkdirSync(unsafe);
  const db = new DatabaseSync(path.join(unsafe, "store.db")); db.exec("PRAGMA user_version=999"); db.close();
  for (const [name, storeRoot, reason, directory] of [["unavailable Store", inaccessible, "store-unavailable", false],
    ["corrupt SQLite file", corrupt, "cache-unavailable", true], ["unsafe newer schema", unsafe, "store-unsafe", true]]) {
    const before = directory ? tree(storeRoot) : sha(readFileSync(storeRoot));
    const result = spawnSync(process.execPath, [cli, "run", "backlog", "review", "refresh", "--envelope-json", envelopePath, "--json"],
      { cwd: project, env: environment(storeRoot), encoding: "utf8" });
    assert.equal(result.status, 0, name + ": source result succeeds");
    const payload = JSON.parse(result.stdout); assertPreserved(name, payload, report, reason);
    assert.deepEqual(directory ? tree(storeRoot) : sha(readFileSync(storeRoot)), before);
    check(name + ": fault input is not repaired or written", true);
  }
  assert.deepEqual(tree(project), projectBefore); check("all fault routes: project bytes unchanged", true);
  assert.deepEqual(tree(path.join(stage, "store")), storeBefore); check("all fault routes: existing Store bytes unchanged", true);
  const receiptPath = path.join(stage, "technical/installed-store-proof.json");
  writeFileSync(receiptPath, JSON.stringify({ harnessVersion: "W25-R0-P7-STORE-1", candidateSha256:
    JSON.parse(readFileSync(path.join(stage, "qualifying-candidate.json"))).sha256,
    perfObservations: 0, states, checks, passed: checks.length,
    limits: ["Temporary faults only. No access grant, cache success, real-host render, or PERF observation is claimed."] }, null, 2) + "\n", { flag: "wx" });
  console.log(JSON.stringify({ receiptPath, passed: checks.length }, null, 2));
}
await main().catch(error => { console.error(JSON.stringify({ name: error.name, message: error.issues ? "Schema validation failed." : error.message,
  issues: error.issues?.map(issue => ({ path: issue.path, message: issue.message })) })); process.exitCode = 1; });
