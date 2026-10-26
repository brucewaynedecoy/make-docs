import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, readlinkSync, existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

// Acceptance-only harness. It makes no PERF-002 observation and no host claim.
async function main() {
const stage = process.argv[2];
if (!stage || !path.isAbsolute(stage)) throw new Error("Pass the absolute disposable P7 stage.");
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const packageRoot = path.join(stage, "qualified-install/node_modules/@brucewaynedecoy/make-docs");
const project = path.join(stage, "project"), store = path.join(stage, "store");
const skill = path.join(project, ".agents/skills/backlog-review");
const requireCandidate = createRequire(path.join(packageRoot, "package.json"));
const { Client } = await import(pathToFileURL(requireCandidate.resolve("@modelcontextprotocol/sdk/client/index.js")));
const { StdioClientTransport } = await import(pathToFileURL(requireCandidate.resolve("@modelcontextprotocol/sdk/client/stdio.js")));
const portable = await import(pathToFileURL(path.join(skill, "scripts/report-contract.mjs")));
const agent = await import(pathToFileURL(path.join(skill, "scripts/agent-contract.mjs")));
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const records = [];
const evidence = path.join(stage, "technical"); mkdirSync(evidence, { recursive: true });

function fileTree(root) {
  const files = [];
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) files.push([path.relative(root, absolute), sha(readFileSync(absolute))]);
      else if (entry.isSymbolicLink()) files.push([path.relative(root, absolute), `symlink:${readlinkSync(absolute)}`]);
      else throw new Error("Unexpected non-file in proof tree.");
    }
  }
  visit(root); return files.sort((a, b) => a[0].localeCompare(b[0]));
}
function check(name, value) { assert(value, name); records.push({ name, pass: true }); }
async function connection(profile, storeRoot = store, caller) {
  const env = { ...process.env, MAKE_DOCS_HOME: storeRoot };
  delete env.MAKE_DOCS_HARNESS_CALLER_IDENTITY;
  if (caller) env.MAKE_DOCS_HARNESS_CALLER_IDENTITY = caller;
  const client = new Client({ name: "w25-p7-installed-proof", version: "1" }, {
    capabilities: { extensions: { "io.modelcontextprotocol/ui": { mimeTypes: ["text/html;profile=mcp-app"] } } },
  });
  await client.connect(new StdioClientTransport({ command: process.execPath,
    args: [path.join(packageRoot, "dist/index.js"), "mcp", "--profile", profile], cwd: project, env, stderr: "pipe" }));
  return client;
}
check("installed helper has no task-creation or registered task-prompt exports",
  !Object.keys(agent).some(name => /fulfilBacklogTaskRequest|BacklogTaskPrompt|BacklogWaveTaskPrompt|BACKLOG_TASK_PROMPT/.test(name)));
const baselineFiles = fileTree(project), baselineStore = fileTree(store);
const profiles = ["core", "setup", "workflow", "quality", "backlog", "all"], toolSets = {};
for (const profile of profiles) {
  const client = await connection(profile);
  try {
    const tools = (await client.listTools()).tools, resources = (await client.listResources()).resources;
    toolSets[profile] = tools.map(tool => tool.name).sort();
    check(`${profile}: unique tools`, new Set(toolSets[profile]).size === tools.length);
    check(`${profile}: request resolver absent`, !tools.some(tool => tool.name === "make_docs_backlog_review_request_resolve"));
    check(`${profile}: no backlog task prompt capability`, client.getServerCapabilities()?.prompts === undefined);
    const ui = resources.filter(resource => resource.uri.startsWith("ui://"));
    check(`${profile}: correct UI membership`, ui.length === (["backlog", "all"].includes(profile) ? 1 : 0));
    for (const name of ["make_docs_backlog_review_open", "make_docs_backlog_review_refresh"]) {
      const tool = tools.find(item => item.name === name);
      check(`${profile}: ${name} exposure`, Boolean(tool) === ["backlog", "all"].includes(profile));
      if (tool) check(`${profile}: ${name} metadata`, tool._meta?.ui?.resourceUri === "ui://make-docs/backlog-review/v1.html");
    }
    if (ui.length) {
      check(`${profile}: current resource description`, ui[0].description === "View the current backlog report with local search, filters, theme, Data, print, and download. Refresh and agent requests depend on host support. Continue in chat if live delivery is unavailable.");
      const item = (await client.readResource({ uri: ui[0].uri })).contents[0];
      check(`${profile}: source/installed resource bytes`, item.text === readFileSync(path.join(repo, "packages/cli/src/mcp/assets/backlog-review-v1.html"), "utf8"));
      check(`${profile}: MIME`, item.mimeType === "text/html;profile=mcp-app");
      assert.deepEqual(item._meta.ui.csp, { connectDomains: [], resourceDomains: [], frameDomains: [], baseUriDomains: [] });
      check(`${profile}: CSP has no external domain`, true);
    }
  } finally { await client.close(); }
}
assert.deepEqual(toolSets.all, [...new Set(profiles.filter(p => p !== "all").flatMap(p => toolSets[p]))].sort());
check("all is exact profile union", true);

const client = await connection("backlog");
let report, payload, compactFixtureProof = null;
try {
  const result = await client.callTool({ name: "make_docs_work_backlog_snapshot", arguments: { targetRoot: project } });
  check("installed snapshot succeeds", result.isError !== true);
  const snapshot = result.structuredContent.result;
  check("small fixture has one exact record", snapshot.records.length === 1);
  report = {
    schemaVersion: 1, generatedAt: snapshot.generatedAt, targetRoot: snapshot.targetRoot, project: snapshot.project,
    projectLead: null, snapshot,
    tallies: { workRecordsFound: 1, workRecordsStillInScope: 1, historicalRecords: 0, archivedRecords: 0 },
    records: snapshot.records.map(record => ({ recordPath: record.recordPath, scope: record.scope,
      createdAt: record.createdAt, lastUpdatedAt: record.lastUpdatedAt, waveStatus: "current",
      statusReason: "This synthetic source has one open task for a fixture review.",
      statusEvidence: [{ path: `${record.recordPath}/01-check-fixture.md`, line: 10, field: "task", commit: null }],
      facts: [{ class: "fact", text: "The synthetic phase has one open task.", evidence: [{ path: `${record.recordPath}/01-check-fixture.md`, line: 10, field: "task", commit: null }] }],
      inferences: [{ class: "inference", text: "This disposable record needs a fixture review.", evidence: [{ path: `${record.recordPath}/01-check-fixture.md`, line: 10, field: "task", commit: null }], confidence: "high", limits: ["This is a test fixture, not source repository review."] }],
      recommendations: [{ class: "recommendation", text: "Review the synthetic record.", evidence: [], rationale: "The fixture has an open task.", limits: ["No task implementation is authorized."] }],
    })), attentionFindings: [], recommendationOrder: [], diagnostics: snapshot.diagnostics,
  };
  if (existsSync(path.join(stage, "small-report.json"))) {
    report = JSON.parse(readFileSync(path.join(stage, "small-report.json"), "utf8"));
    agent.validateBacklogRebuiltModel(report, snapshot);
  } else {
    report = portable.createBacklogPresentation(report).report;
    writeFileSync(path.join(stage, "small-snapshot.json"), JSON.stringify(snapshot, null, 2) + "\n", { flag: "wx" });
    writeFileSync(path.join(stage, "small-report.json"), JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
  }
  const prepared = agent.prepareBacklogAgentOpen(report, snapshot);
  payload = await client.callTool({ name: "make_docs_backlog_review_open", arguments: prepared.openInput });
  check("installed canonical open succeeds", payload.isError !== true);
  const confirmed = agent.confirmBacklogAgentOpen(prepared, payload);
  check("candidate authority confirms actual own open", confirmed.state === "confirmed");
  assert.deepEqual(payload._meta.backlog.envelope.report, report);
  check("live keeps full report meaning", true);
  check("model text does not leak full client report", !payload.content[0].text.includes("This is one synthetic disposable work record."));
  const refresh = await client.callTool({ name: "make_docs_backlog_review_refresh", arguments: { envelope: confirmed.authoritativeEnvelope } });
  check("installed current refresh succeeds", refresh.isError !== true);
  check("exact unchanged refresh", refresh._meta.backlog.refresh.state === "unchanged");
  const malformed = await client.callTool({ name: "make_docs_backlog_review_open", arguments: { report, instruction: "execute" } });
  check("unknown instruction rejected", malformed.isError === true);
  const denied = await client.callTool({ name: "make_docs_work_backlog_cache_write", arguments: { targetRoot: project, snapshot, records: report.records } });
  check("write gate rejects absent allowWrite", denied.isError === true);
  check("no static report created by live/open/refresh", !fileTree(project).some(([name]) => name.endsWith(".html") && !name.includes("/skills/")));
  if (!existsSync(path.join(stage, "small-open-payload.json"))) writeFileSync(path.join(stage, "small-open-payload.json"), JSON.stringify(payload, null, 2) + "\n", { flag: "wx" });
  const template = readFileSync(path.join(skill, "assets/backlog-review-report.html"), "utf8");
  const html = portable.renderBacklogStaticHtml(report, template);
  const embedded = html.match(/<script id="backlog-report-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
  assert.deepEqual(JSON.parse(embedded), report); check("explicit static keeps exact full report", true);
  if (!existsSync(path.join(stage, "small-static-report.html"))) writeFileSync(path.join(stage, "small-static-report.html"), html, { flag: "wx" });
  else assert.equal(readFileSync(path.join(stage, "small-static-report.html"), "utf8"), html);
  const chat = portable.renderBacklogChatSummary(report);
  check("chat summary keeps status reason", chat.includes(report.records[0].statusReason));
  if (process.argv.includes("--compact-fixture")) {
    const fixtureRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../fixtures");
    const fixtureBytes = readFileSync(path.join(fixtureRoot, "backlog-73-report.json"));
    const manifest = JSON.parse(readFileSync(path.join(fixtureRoot, "manifest.json"), "utf8"));
    assert.equal(sha(fixtureBytes), manifest.report.sha256, "The frozen report changed.");
    const frozenReport = JSON.parse(fixtureBytes);
    const frozenPrepared = agent.prepareBacklogAgentOpen(frozenReport, frozenReport.snapshot);
    const frozenPayload = await client.callTool({ name: "make_docs_backlog_review_open", arguments: frozenPrepared.openInput });
    check("installed frozen 73-report replay succeeds", frozenPayload.isError !== true);
    const frozenConfirmed = agent.confirmBacklogAgentOpen(frozenPrepared, frozenPayload);
    check("frozen replay confirms independent own open", frozenConfirmed.state === "confirmed");
    assert.equal(frozenPayload._meta.backlog, undefined);
    const encoded = frozenPayload._meta.backlogEncoded;
    assert.deepEqual(Object.keys(encoded).sort(), ["schemaVersion", "encoding", "byteLength", "sha256", "data"].sort());
    assert.equal(encoded.schemaVersion, 1);
    assert.equal(encoded.encoding, "gzip-base64");
    assert(encoded.byteLength > 512 * 1024 && encoded.byteLength <= 16_000_000);
    assert(encoded.data.length <= 8_000_000);
    const restoredBytes = gunzipSync(Buffer.from(encoded.data, "base64"), { maxOutputLength: 16_000_000 });
    assert.equal(restoredBytes.byteLength, encoded.byteLength);
    assert.equal(sha(restoredBytes), encoded.sha256);
    const restoredBacklog = JSON.parse(restoredBytes.toString("utf8"));
    assert.deepEqual(restoredBacklog.envelope.report, frozenReport);
    assert.equal(JSON.stringify(restoredBacklog.envelope.report), JSON.stringify(frozenPrepared.openInput.report));
    check("compact replay restores exact full report bytes", true);
    check("compact report stays in hidden metadata", !JSON.stringify(frozenPayload.structuredContent).includes(encoded.data)
      && !JSON.stringify(frozenPayload.content).includes(encoded.data));
    const wireBytes = Buffer.byteLength(JSON.stringify(frozenPayload));
    check("compact serialized reply stays below observed host cutoff", wireBytes < 1_000_000);
    const snapshotArg = process.argv.indexOf("--current-snapshot-file");
    assert(snapshotArg >= 0, "Pass the complete current snapshot captured through the exact installed CLI.");
    const currentSnapshotPath = process.argv[snapshotArg + 1];
    const currentSnapshotBytes = readFileSync(currentSnapshotPath);
    const capturedCurrentSnapshot = JSON.parse(currentSnapshotBytes);
    assert.equal(capturedCurrentSnapshot.targetRoot, frozenReport.targetRoot);
    assert.equal(capturedCurrentSnapshot.records.length, 73);
    check("complete installed CLI current snapshot is available", true);
    const frozenRefresh = await client.callTool({ name: "make_docs_backlog_review_refresh",
      arguments: { envelope: frozenConfirmed.authoritativeEnvelope } });
    check("installed frozen report refresh succeeds", frozenRefresh.isError !== true);
    const refreshEncoded = frozenRefresh._meta.backlogEncoded;
    assert.equal(frozenRefresh._meta.backlog, undefined);
    assert.deepEqual(Object.keys(refreshEncoded).sort(), ["schemaVersion", "encoding", "byteLength", "sha256", "data"].sort());
    assert.equal(refreshEncoded.schemaVersion, 1);
    assert.equal(refreshEncoded.encoding, "gzip-base64");
    assert(refreshEncoded.byteLength > 512 * 1024 && refreshEncoded.byteLength <= 16_000_000);
    assert(refreshEncoded.data.length <= 8_000_000);
    const refreshBytes = gunzipSync(Buffer.from(refreshEncoded.data, "base64"), { maxOutputLength: 16_000_000 });
    assert.equal(refreshBytes.byteLength, refreshEncoded.byteLength);
    assert.equal(sha(refreshBytes), refreshEncoded.sha256);
    const refreshBacklog = JSON.parse(refreshBytes.toString("utf8"));
    assert.deepEqual(refreshBacklog.envelope, frozenConfirmed.authoritativeEnvelope);
    assert.deepEqual(refreshBacklog.envelope.report, frozenReport);
    assert.equal(JSON.stringify(refreshBacklog.envelope.report), JSON.stringify(frozenPrepared.openInput.report));
    assert.deepEqual(refreshBacklog.currentSnapshot, { ...capturedCurrentSnapshot, generatedAt: refreshBacklog.currentSnapshot.generatedAt },
      "Current facts changed between the separate snapshot and refresh captures.");
    const { generatedAt: _captureTime, ...currentFacts } = refreshBacklog.currentSnapshot;
    const sortedJson = value => Array.isArray(value) ? value.map(sortedJson) : value && typeof value === "object"
      ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, sortedJson(entry)])) : value;
    assert.equal(refreshBacklog.refresh.snapshotId, sha(JSON.stringify(sortedJson({ contract: "backlog-snapshot/v1", facts: currentFacts }))));
    assert.equal(refreshBacklog.refresh.previousSnapshotId, frozenConfirmed.authoritativeEnvelope.snapshotId);
    assert.equal(refreshBacklog.refresh.modelId, frozenConfirmed.authoritativeEnvelope.modelId);
    check("compact refresh restores exact prior report and current facts", true);
    check("compact refresh keeps prior and current version bindings", true);
    const refreshWireBytes = Buffer.byteLength(JSON.stringify(frozenRefresh));
    check("compact refresh serialized reply stays below observed host cutoff", refreshWireBytes < 1_000_000);
    compactFixtureProof = { kind: "frozen 73-record response replay", records: frozenReport.records.length,
      reportFileSha256: sha(fixtureBytes), retainedReportJsonSha256: sha(JSON.stringify(frozenReport)),
      preparedCanonicalReportJsonSha256: sha(JSON.stringify(frozenPrepared.openInput.report)),
      decodedCanonicalReportJsonSha256: sha(JSON.stringify(restoredBacklog.envelope.report)),
      retainedReportValuesExact: true, canonicalKeyOrder: "Existing strict schema normalization precedes transport encoding.",
      rawBacklogBytes: encoded.byteLength, rawBacklogSha256: encoded.sha256, wireBytes, lossless: true,
      refresh: { state: refreshBacklog.refresh.state, rawBacklogBytes: refreshEncoded.byteLength,
        rawBacklogSha256: refreshEncoded.sha256, wireBytes: refreshWireBytes,
        currentFactsMatchSeparateSnapshot: true, captureTimesMayDiffer: true,
        currentSnapshotSha256: sha(JSON.stringify(refreshBacklog.currentSnapshot)),
        priorReportExact: true, versionBindingsExact: true },
      currentCapture: { route: "Exact installed CLI work backlog snapshot", path: currentSnapshotPath,
        fileBytes: currentSnapshotBytes.byteLength, fileSha256: sha(currentSnapshotBytes), generatedAt: capturedCurrentSnapshot.generatedAt },
      outputBound: 16_000_000, outputBoundReason: "A full refresh keeps both the prior report and current facts; the unchanged 73-record response is near 8 MB.",
      nativeDisplayProved: false, perfObservations: 0 };
    writeFileSync(path.join(evidence, "installed-compact-fixture-proof.json"), JSON.stringify(compactFixtureProof, null, 2) + "\n", { flag: "wx" });
    writeFileSync(path.join(stage, "frozen-73-open-payload.json"), JSON.stringify(frozenPayload) + "\n", { flag: "wx" });
    writeFileSync(path.join(stage, "frozen-73-refresh-payload.json"), JSON.stringify(frozenRefresh) + "\n", { flag: "wx" });
  }
  assert.deepEqual(fileTree(project), baselineFiles); check("read-only product calls keep project bytes", true);
  assert.deepEqual(fileTree(store), baselineStore); check("read-only product calls keep Store bytes", true);
} finally { await client.close(); }
const sourceSkillRoot = path.join(repo, "packages/skills/backlog-review");
const skillDefinition = JSON.parse(readFileSync(path.join(packageRoot, "skill-registry.json"), "utf8")).skills.find(item => item.name === "backlog-review");
for (const relative of [skillDefinition.entryPoint, ...skillDefinition.assets.map(asset => asset.installPath)]) {
  check(`installed Skill bytes: ${relative}`, sha(readFileSync(path.join(skill, relative))) === sha(readFileSync(path.join(sourceSkillRoot, relative))));
}
const packageInfo = JSON.parse(readFileSync(path.join(packageRoot, "package.json"), "utf8"));
const receipt = { harnessVersion: "W25-R0-P7-INSTALLED-1", mode: "automated-functional", perfObservations: 0,
  candidate: JSON.parse(readFileSync(path.join(stage, "qualifying-candidate.json"), "utf8")),
  package: { name: packageInfo.name, version: packageInfo.version, installedRoot: packageRoot },
  fixture: { kind: "one-wave synthetic functional", snapshotSha256: sha(readFileSync(path.join(stage, "small-snapshot.json"))),
    reportSha256: sha(readFileSync(path.join(stage, "small-report.json"))), records: report.records.length, accepted70Equivalent: false },
  resource: { sha256: sha(readFileSync(path.join(repo, "packages/cli/src/mcp/assets/backlog-review-v1.html"))) },
  profileTools: toolSets, checks: records, passed: records.length, compactFixtureProof,
  limits: ["No real-host render, fresh real-backlog agent assembly, PERF timing, agent work, or release is proved."] };
writeFileSync(path.join(evidence, "installed-proof.json"), JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ receipt: path.join(evidence, "installed-proof.json"), passed: records.length,
  smallReport: path.join(stage, "small-report.json"), staticReport: path.join(stage, "small-static-report.html") }, null, 2));
}
await main().catch(error => {
  console.error(JSON.stringify({ name: error.name, message: error.issues ? "Schema validation failed." : error.message,
    issues: error.issues?.map(issue => ({ path: issue.path, message: issue.message })) }));
  process.exitCode = 1;
});
