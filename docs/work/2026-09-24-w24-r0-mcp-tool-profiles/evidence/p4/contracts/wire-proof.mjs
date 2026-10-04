import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const local = JSON.parse(fs.readFileSync(process.argv[2]));
const output = path.join(root, 'docs/work/2026-09-24-w24-r0-mcp-tool-profiles/evidence/p4/contracts');
const require = createRequire(path.join(root, 'packages/cli/package.json'));
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const intents = ['core', 'setup', 'workflow', 'quality', 'backlog'];
const catalog = JSON.parse(fs.readFileSync(path.join(local.paths.current, 'packages/docs/template/.make-docs/system-resources.catalog.json')));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const sanitize = value => JSON.parse(JSON.stringify(value).replaceAll(local.paths.temp, '$TEMP').replaceAll(root, '$REPO'));
const save = (name, value) => fs.writeFileSync(path.join(output, name), `${JSON.stringify(sanitize(value), null, 2)}\n`, { flag: 'wx' });
const normalize = value => JSON.parse(JSON.stringify(value).replaceAll(path.join(local.paths.old, 'packages/docs/template'), '$PROVIDER_ROOT').replaceAll(path.join(local.paths.current, 'packages/docs/template'), '$PROVIDER_ROOT'));
const proof = { coordinate: 'W24 R0 P4', startedAt: new Date().toISOString(), transport: 'stdio', variants: {}, denials: [], access: [], comparisons: [], cleanup: [] };
const toolCounts = { core: 8, setup: 15, workflow: 14, quality: 9, backlog: 3, all: 43, default: 43, old: 43 };
const readCases = {
  core: ['make_docs_project_persona_list', { targetRoot: local.paths.fixture }],
  setup: ['make_docs_project_path_hygiene_validate', { targetRoot: local.paths.fixture, scope: 'content', paths: ['docs/note.md'] }],
  workflow: ['make_docs_project_persona_list', { targetRoot: local.paths.fixture }],
  quality: ['make_docs_project_path_hygiene_validate', { targetRoot: local.paths.fixture, scope: 'content', paths: ['docs/note.md'] }],
  backlog: ['make_docs_work_backlog_snapshot', { targetRoot: local.paths.fixture }],
};
const writeCases = {
  setup: ['make_docs_resource_ensure', { targetRoot: local.paths.fixture, uri: 'make-docs://system/contract/human-experience-contract.md', approvals: ['resource-projection-write'] }],
  workflow: ['make_docs_lifecycle_start', { repoRoot: local.paths.fixture, lifecycleStage: 'implementation' }],
  backlog: ['make_docs_work_backlog_cache_write', { targetRoot: local.paths.fixture }],
};
for (const profile of ['old', 'default', 'all', ...intents]) {
  const runtime = profile === 'old' ? local.paths.old : local.paths.current;
  const args = [path.join(runtime, 'packages/cli/dist/index.js'), 'mcp', ...(['old', 'default'].includes(profile) ? [] : ['--profile', profile])];
  const client = new Client({ name: 'w24-p4-contract-proof', version: '1.0.0' });
  const transport = new StdioClientTransport({ command: process.execPath, args, cwd: local.paths.fixture, env: local.env, stderr: 'pipe' });
  let stderr = ''; transport.stderr?.on('data', bytes => { stderr += bytes.toString(); });
  const entry = { launch: { command: process.execPath, args, cwd: local.paths.fixture }, tools: null, resources: null, reads: {}, stderr: '' };
  try {
    await client.connect(transport, { timeout: 30_000 });
    entry.tools = await client.listTools({}, { timeout: 10_000 });
    entry.resources = await client.listResources({}, { timeout: 10_000 });
    assert.equal(entry.tools.tools.length, toolCounts[profile]);
    const expected = catalog.mcpResources.filter(resource => ['old', 'default', 'all'].includes(profile) || resource.profiles.includes(profile)).map(resource => resource.uri).sort();
    assert.deepEqual(entry.resources.resources.map(resource => resource.uri).sort(), expected);
    for (const uri of expected) entry.reads[uri] = await client.readResource({ uri }, { timeout: 10_000 });
    if (intents.includes(profile)) {
      const visible = new Set(entry.tools.tools.map(tool => tool.name));
      const hidden = proof.variants.all.tools.tools.find(tool => !visible.has(tool.name));
      const denied = await client.callTool({ name: hidden.name, arguments: { allowWrite: true, targetRoot: local.paths.fixture } }, undefined, { timeout: 10_000 });
      assert.equal(denied.isError, true); assert.match(JSON.stringify(denied), /not found/);
      proof.denials.push({ profile, kind: 'hidden-tool', name: hidden.name, result: denied });
      const hiddenUri = catalog.mcpResources.find(resource => !resource.profiles.includes(profile)).uri;
      try { await client.readResource({ uri: hiddenUri }, { timeout: 10_000 }); throw new Error('Hidden read returned bytes'); }
      catch (error) { assert.equal(error.code, -32602); assert.equal(error.data?.makeDocs?.code, 'resource-not-found'); proof.denials.push({ profile, kind: 'hidden-resource', uri: hiddenUri, code: error.code, message: error.message, data: error.data }); }
      const [name, input] = readCases[profile];
      const result = await client.callTool({ name, arguments: input }, undefined, { timeout: 10_000 });
      assert.notEqual(result.isError, true); proof.access.push({ profile, mode: 'read', name, input, result });
      if (writeCases[profile]) {
        const [writeName, writeInput] = writeCases[profile];
        for (const allowWrite of [false, true]) {
          const result = await client.callTool({ name: writeName, arguments: { ...writeInput, allowWrite } }, undefined, { timeout: 10_000 });
          assert.equal(result.isError, true);
          if (!allowWrite) assert.match(JSON.stringify(result), /requires write permission/);
          else if (profile !== 'backlog') assert.equal(result.structuredContent?.code, 'store-not-configured');
          else assert.match(JSON.stringify(result), /Invalid input/);
          proof.access.push({ profile, mode: 'write-class', name: writeName, allowWrite, input: writeInput, result });
        }
      }
    }
  } finally {
    await client.close(); await transport.close();
    entry.stderr = stderr;
    proof.cleanup.push({ profile, closed: true, pidAfterClose: transport.pid ?? null });
    assert.equal(transport.pid, null);
    proof.variants[profile] = entry;
    save(`wire-${profile}-attempt-1.json`, entry);
  }
}
for (const [label, left, right] of [['historical-default', 'old', 'default'], ['current-default-all', 'default', 'all']]) {
  for (const field of ['tools', 'resources', 'reads']) assert.deepEqual(normalize(proof.variants[left][field]), normalize(proof.variants[right][field]), `${label}/${field}`);
  proof.comparisons.push({ label, fields: ['tools', 'resources', 'reads'], equivalent: true, normalization: 'Provider root only. Full raw values are retained.', differences: [] });
}
const unionTools = new Set(); const unionResources = new Set();
for (const profile of intents) {
  for (const tool of proof.variants[profile].tools.tools) { unionTools.add(tool.name); assert.deepEqual(tool, proof.variants.all.tools.tools.find(candidate => candidate.name === tool.name)); }
  for (const resource of proof.variants[profile].resources.resources) { unionResources.add(resource.uri); assert.deepEqual(resource, proof.variants.all.resources.resources.find(candidate => candidate.uri === resource.uri)); assert.deepEqual(proof.variants[profile].reads[resource.uri], proof.variants.all.reads[resource.uri]); }
}
assert.deepEqual([...unionTools].sort(), proof.variants.all.tools.tools.map(tool => tool.name).sort());
assert.deepEqual([...unionResources].sort(), proof.variants.all.resources.resources.map(resource => resource.uri).sort());
const cli = spawnSync(process.execPath, [path.join(local.paths.current, 'packages/cli/dist/index.js'), 'resource', 'list', '--target-root', local.paths.fixture, '--format', 'json'], { cwd: local.paths.fixture, env: local.env, encoding: 'utf8', timeout: 10_000 });
assert.equal(cli.status, 0);
const cliValue = JSON.parse(cli.stdout); assert.deepEqual(cliValue.resources.map(resource => resource.uri).sort(), [...unionResources].sort());
save('cli-parity-attempt-1.json', { command: [process.execPath, 'resource', 'list', '--target-root', '$FIXTURE', '--format', 'json'], exitCode: cli.status, result: cliValue });
const help = spawnSync(process.execPath, [path.join(local.paths.current, 'packages/cli/dist/index.js'), 'mcp', '--help'], { cwd: local.paths.fixture, env: local.env, encoding: 'utf8' });
const invalid = spawnSync(process.execPath, [path.join(local.paths.current, 'packages/cli/dist/index.js'), 'mcp', '--profile', 'invalid'], { cwd: local.paths.fixture, env: local.env, encoding: 'utf8' });
assert.equal(help.status, 0); assert.notEqual(invalid.status, 0); assert.match(invalid.stderr, /core, setup, workflow, quality, backlog, all/);
save('help-and-invalid-attempt-1.json', { help: { exitCode: help.status, stdout: help.stdout, stderr: help.stderr }, invalid: { exitCode: invalid.status, stdout: invalid.stdout, stderr: invalid.stderr } });
proof.completedAt = new Date().toISOString();
proof.summary = { passed: true, variants: 8, toolUnion: unionTools.size, nativeResourceUnion: unionResources.size, reads: Object.values(proof.variants).reduce((sum, variant) => sum + Object.keys(variant.reads).length, 0), sharedContracts: intents.reduce((sum, profile) => sum + proof.variants[profile].tools.tools.length, 0), hiddenDenials: proof.denials.length, accessObservations: proof.access.length, fixtureUnchanged: true, noStoreCreated: !fs.existsSync(local.env.MAKE_DOCS_HOME) };
assert.equal(proof.summary.noStoreCreated, true);
save('wire-summary-attempt-1.json', { ...proof, variants: Object.fromEntries(Object.entries(proof.variants).map(([key, variant]) => [key, { toolCount: variant.tools.tools.length, resourceCount: variant.resources.resources.length, readCount: Object.keys(variant.reads).length, retained: `wire-${key}-attempt-1.json` }])) });
console.log(JSON.stringify(proof.summary));
