import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { buildBacklogSnapshot, BacklogReportRecordV1Schema } from '../../../../../../packages/cli/src/operations/work/backlog';
import { backlogCacheWriteInputSchema } from '../../../../../../packages/cli/src/operations/work/backlog/cache-operation';

async function main() {
  const startedAt = new Date().toISOString();
  const root = process.cwd();
  const local = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const output = path.join(root, 'docs/work/2026-09-24-w24-r0-mcp-tool-profiles/evidence/p4/contracts');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'w24-p4-write-2-'));
  const fixture = path.join(temp, 'fixture');
  const store = path.join(temp, 'unconfigured-store');
  const recordPath = 'docs/work/2026-10-03-w1-r0-probe';
  const write = (relative: string, body: string) => { const file = path.join(fixture, relative); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, body); };
  write('.make-docs/config.yaml', 'projectId: w24-p4-complete-write-probe\n');
  write(`${recordPath}/00-index.md`, '---\ntitle: "Probe"\nkind: "work"\nstatus: "active"\ncoordinate: "W1 R0"\n---\n\n# Probe\n\n## Phase Map\n\n| Phase | File |\n| --- | --- |\n| P1 | [Build](01-build.md) |\n');
  write(`${recordPath}/01-build.md`, '---\ntitle: "Phase 1: Build"\nkind: "work"\nstatus: "active"\ncoordinate: "W1 R0 P1"\n---\n\n# Build\n\n## Stage 1 - Build\n\n### Tasks\n\n- [ ] t1: Check the isolated probe.\n');
  const snapshot = buildBacklogSnapshot(fixture);
  assert.equal(snapshot.records.length, 1);
  const records = snapshot.records.map(record => BacklogReportRecordV1Schema.parse({ recordPath: record.recordPath, scope: record.scope, createdAt: record.createdAt, lastUpdatedAt: record.lastUpdatedAt, waveStatus: 'current', statusReason: 'Current isolated probe work.', statusEvidence: [{ path: `${record.recordPath}/00-index.md`, line: 5, field: 'status', commit: null }], facts: [], inferences: [], recommendations: [] }));
  const input = backlogCacheWriteInputSchema.parse({ targetRoot: fixture, snapshot, records });
  const hash = (value: Buffer | string) => crypto.createHash('sha256').update(value).digest('hex');
  const inventory = (directory: string): Record<string, string> => Object.fromEntries(fs.readdirSync(directory, { recursive: true, withFileTypes: true }).filter(entry => entry.isFile()).map(entry => { const file = path.join(entry.parentPath, entry.name); return [path.relative(directory, file), hash(fs.readFileSync(file))]; }).sort(([a], [b]) => a.localeCompare(b)));
  const fixtureBefore = inventory(fixture);
  const identity = JSON.parse(fs.readFileSync(path.join(output, 'runtime-identity-attempt-1.json'), 'utf8'));
  for (const [file, digest] of Object.entries(identity.currentBuild)) assert.equal(hash(fs.readFileSync(path.join(local.paths.current, 'packages/cli/dist', file))), digest);
  const sanitize = (value: unknown) => JSON.parse(JSON.stringify(value).replaceAll(temp, '$WRITE_FIXTURE').replaceAll(local.paths.temp, '$P4_RUNTIME').replaceAll(root, '$REPO'));
  const save = (file: string, value: unknown) => fs.writeFileSync(path.join(output, file), JSON.stringify(sanitize(value), null, 2) + '\n', { flag: 'wx' });
  const authority = { id: 'W24-R0-P4-SDK-WRITE-CORRECTION-2', source: 'Owner request: fix and run the incomplete supplementary SDK wire write probe, inspect product code if a complete valid request gives an unexpected result, then close out and commit W24 R0 P4.', grantedAtDate: '2026-10-03', scope: 'One affected input correction and one complete SDK write-gate/Store-admission pass for backlog and all.', limits: { serverLaunches: 2, writeToolCalls: 6, elapsedMinutes: 15, externalSpend: 0, paidModelRequests: 0 }, earlierBudgetsReset: false, perfMeasurementsAuthorized: false };
  const env = { ...local.env, MAKE_DOCS_HOME: store };
  save('wire-write-attempt-2-authority.json', { coordinate: 'W24 R0 P4', startedAt, authority, input, inputSchemaValid: true, fixtureBefore, runtimeIdentitySha256: hash(fs.readFileSync(path.join(output, 'runtime-identity-attempt-1.json'))), sdkVersion: identity.sdkVersion, node: process.version, scriptSha256: hash(fs.readFileSync(process.argv[1])), launch: { command: process.execPath, args: [path.join(local.paths.current, 'packages/cli/dist/index.js'), 'mcp', '--profile', '$PROFILE'], cwd: fixture }, environment: env });
  const captures: any[] = [];
  const failures: any[] = [];
  for (const profile of ['backlog', 'all']) {
    const client = new Client({ name: 'w24-p4-complete-write-proof', version: '2.0.0' });
    const transport = new StdioClientTransport({ command: process.execPath, args: [path.join(local.paths.current, 'packages/cli/dist/index.js'), 'mcp', '--profile', profile], cwd: fixture, env, stderr: 'pipe' });
    const capture: any = { profile, inputSchemaValid: true, calls: [], stderr: '', cleanup: null };
    transport.stderr?.on('data', bytes => { capture.stderr += bytes.toString(); });
    try {
      await client.connect(transport, { timeout: 30_000 });
      for (const mode of ['omitted', 'false', 'true']) {
        const args = { ...input, ...(mode === 'omitted' ? {} : { allowWrite: mode === 'true' }) };
        const result = await client.callTool({ name: 'make_docs_work_backlog_cache_write', arguments: args }, undefined, { timeout: 10_000 });
        capture.calls.push({ mode, arguments: args, result });
        if (result.isError !== true) failures.push({ profile, mode, reason: 'Expected a gate/admission denial.' });
        if (mode === 'true') { if (result.structuredContent?.code !== 'store-not-configured' || result.structuredContent?.operation !== 'work.backlog-cache.write') failures.push({ profile, mode, reason: 'Expected typed Store admission for the write operation.', result }); }
        else if (!/requires write permission/.test(JSON.stringify(result))) failures.push({ profile, mode, reason: 'Expected write permission gate.', result });
        if (/Invalid arguments|Invalid input/.test(JSON.stringify(result))) failures.push({ profile, mode, reason: 'Complete input unexpectedly rejected.', result });
        if (fs.existsSync(store)) failures.push({ profile, mode, reason: 'A Store path was created.' });
      }
    } catch (error: any) { capture.failure = { name: error.name, message: error.message, code: error.code, data: error.data }; failures.push({ profile, error: capture.failure }); }
    finally { await client.close(); await transport.close(); capture.cleanup = { closed: true, pidAfterClose: transport.pid ?? null }; if (transport.pid !== null) failures.push({ profile, reason: 'Child still has a PID.' }); save(`wire-write-${profile}-attempt-2.json`, capture); captures.push(capture); }
  }
  const fixtureAfter = inventory(fixture);
  assert.deepEqual(fixtureAfter, fixtureBefore);
  for (const [file, digest] of Object.entries(identity.currentBuild)) assert.equal(hash(fs.readFileSync(path.join(local.paths.current, 'packages/cli/dist', file))), digest);
  for (let i = 0; i < 3; i++) assert.deepEqual(captures[0].calls[i]?.result, captures[1].calls[i]?.result);
  const completedAt = new Date().toISOString();
  const summary = { coordinate: 'W24 R0 P4', startedAt, completedAt, authority, outcome: failures.length ? 'unexpected-result' : 'pass', passed: failures.length === 0, serverLaunches: 2, toolCalls: captures.reduce((n, c) => n + c.calls.length, 0), profileParity: true, modes: ['omitted', 'false', 'true'], completeSchemaValidInput: true, reportRecords: records.length, noInputRejection: failures.every(f => f.reason !== 'Complete input unexpectedly rejected.'), noStoreCreated: !fs.existsSync(store), fixtureUnchanged: true, runtimeBuildUnchanged: true, cleanup: captures.map(c => ({ profile: c.profile, ...c.cleanup })), failures, consumed: { affectedCorrections: 1, probePasses: 1, launches: 2, toolCalls: captures.reduce((n, c) => n + c.calls.length, 0), elapsedMs: Date.parse(completedAt) - Date.parse(startedAt), externalSpend: 0, paidModelRequests: 0 }, limits: ['Store admission denied as store-not-configured; no complete allowed Store write or Store handler result is claimed.', 'Earlier immutable failure and independent eight-variant proof remain unchanged.', 'No PERF measurement, host change, runtime build, package install, or live Store action.'] };
  save('wire-write-attempt-2-summary.json', summary);
  console.log(JSON.stringify(sanitize(summary)));
  assert.equal(summary.passed, true);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
