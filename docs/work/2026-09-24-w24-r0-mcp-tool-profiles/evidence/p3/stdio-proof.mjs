import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync, spawnSync } from 'node:child_process';

const root = process.argv[2] || '<REPO_ROOT>';
const captureSuffix = process.argv[3] || 'final';
const require = createRequire(path.join(root, 'packages/cli/package.json'));
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const phase = path.join(root, 'docs/work/2026-09-24-w24-r0-mcp-tool-profiles/evidence');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const save = (relative, value) => {
  const extension = path.extname(relative);
  const stem = relative.slice(0, -extension.length);
  const destination = path.join(phase, `${stem}-${captureSuffix}${extension}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
};
const catalogPath = 'packages/docs/template/.make-docs/system-resources.catalog.json';
const catalog = JSON.parse(fs.readFileSync(path.join(root, catalogPath), 'utf8'));
const intents = ['core', 'setup', 'workflow', 'quality', 'backlog'];
const counts = { core: 7, setup: 7, workflow: 48, quality: 33, backlog: 8, all: 62, default: 62 };
const toolCounts = { core: 8, setup: 15, workflow: 14, quality: 9, backlog: 3, all: 43, default: 43 };
const ui = 'ui://make-docs/backlog-review/v1.html';
const expected = profile => catalog.mcpResources.filter(entry => profile === 'all' || profile === 'default' || entry.profiles.includes(profile)).map(entry => entry.uri).sort();
const runCli = args => {
  const result = spawnSync(process.execPath, ['packages/cli/dist/index.js', ...args], { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  return { command: `node packages/cli/dist/index.js ${args.join(' ')}`, exitCode: result.status, stdout: result.stdout, stderr: result.stderr };
};
const sourcePaths = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean).map(line => line.slice(3)).filter(file => (file.startsWith('packages/cli/src/') || file.startsWith('packages/cli/tests/') || file.startsWith('packages/docs/template/.make-docs/') || file.startsWith('.make-docs/system') || file.startsWith('docs/assets/')) && fs.existsSync(path.join(root, file))).sort();
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
const identity = {
  coordinate: 'W24 R0 P3', capturedAt: new Date().toISOString(), branch: execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).trim(), baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  source: Object.fromEntries(sourcePaths.map(file => [file, hash(fs.readFileSync(path.join(root, file)))])),
  build: Object.fromEntries(walk(path.join(root, 'packages/cli/dist')).filter(file => file.endsWith('.js')).sort().map(file => [path.relative(root, file), hash(fs.readFileSync(file))])),
  scope: 'Tested local precommit candidate and build. No installed-host, package publication, HTTP, or production acceptance.',
};
save('p3/source-identity.json', identity);
const cliBefore = runCli(['resource', 'list', '--target', root, '--format', 'json']);
assert.equal(cliBefore.exitCode, 0, cliBefore.stderr);
const cliList = JSON.parse(cliBefore.stdout);
assert.deepEqual(cliList.resources.map(entry => entry.uri).sort(), expected('all'));
save('a7/cli-resource-list.json', { command: cliBefore.command, exitCode: cliBefore.exitCode, result: cliList });
const metadata = { capturedAt: new Date().toISOString(), catalog: catalogPath, assignments: catalog.mcpResources, catalogSha256: hash(fs.readFileSync(path.join(root, catalogPath))), exactInventoryCount: cliList.resources.length, expectedCounts: counts, checks: {} };
assert.equal(new Set(catalog.mcpResources.map(entry => entry.uri)).size, catalog.mcpResources.length);
for (const entry of catalog.mcpResources) {
  assert.ok(entry.profiles.length > 0);
  assert.equal(new Set(entry.profiles).size, entry.profiles.length);
  assert.ok(entry.profiles.every(profile => intents.includes(profile)));
}
assert.deepEqual([...new Set(intents.flatMap(expected))].sort(), expected('all'));
metadata.checks = { explicitUniqueUriAssignments: true, nonemptyKnownUniqueProfiles: true, exactCanonicalInventory: true, exactAllUnion: true };
save('a6/catalog-metadata.json', metadata);

const raw = { capturedAt: new Date().toISOString(), transport: 'stdio', profiles: {} };
const allReads = new Map();
const reads = { capturedAt: new Date().toISOString(), comparisons: [], coreToolParity: [] };
const denials = { capturedAt: new Date().toISOString(), attempts: [] };
const summarizeRead = result => result.contents.map(content => ({ uri: content.uri, mimeType: content.mimeType, byteLength: Buffer.from(content.blob, 'base64').length, sha256: hash(Buffer.from(content.blob, 'base64')), metadata: content._meta }));
const deny = async (client, profile, uri, reason) => {
  let caught;
  try { const result = await client.readResource({ uri }); throw new Error(`Denied URI returned a result: ${JSON.stringify(result)}`); }
  catch (error) { caught = error; }
  const observed = { profile, uri, reason, code: caught.code, message: caught.message, data: caught.data };
  denials.attempts.push(observed);
  assert.equal(caught.code, -32602);
  assert.equal(caught.data?.makeDocs?.code, 'resource-not-found');
  assert.equal(caught.data?.makeDocs?.recovery, 'Choose a URI from resources/list for this profile.');
  assert.equal(caught.data?.makeDocs?.uri, uri);
  assert.ok(caught.message.includes(`not available in MCP profile ${profile === 'default' ? 'all' : profile}`));
  assert.ok(!JSON.stringify(caught.data).includes('"blob"'));
  assert.ok(!JSON.stringify(caught.data).includes('"contents"'));
  observed.noResourceBytes = true;
};

try {
  for (const profile of ['all', 'default', ...intents]) {
    process.stdout.write(`Stdio ${profile}\n`);
    const args = ['packages/cli/dist/index.js', 'mcp', ...(profile === 'default' ? [] : ['--profile', profile])];
    const transport = new StdioClientTransport({ command: process.execPath, args, cwd: root, env: { ...process.env }, stderr: 'pipe' });
    let stderr = '';
    transport.stderr?.on('data', chunk => { stderr += chunk.toString(); });
    const client = new Client({ name: 'make-docs-w24-r0-p3-evidence', version: '1.0.0' });
    try {
      await client.connect(transport);
      const list = await client.listResources();
      const tools = await client.listTools();
      raw.profiles[profile] = { launch: args, resources: list, tools, stderr };
      assert.deepEqual(list.resources.map(entry => entry.uri).sort(), expected(profile));
      assert.equal(list.resources.length, counts[profile]);
      assert.equal(new Set(list.resources.map(entry => entry.uri)).size, counts[profile]);
      assert.equal(tools.tools.length, toolCounts[profile]);
      assert.ok(!list.resources.some(entry => entry.uri === ui));
      for (const entry of list.resources) {
        const result = await client.readResource({ uri: entry.uri });
        if (profile === 'all') allReads.set(entry.uri, result);
        else assert.deepEqual(result, allReads.get(entry.uri));
        reads.comparisons.push({ profile, uri: entry.uri, equalToAll: true, result: summarizeRead(result) });
      }
      const hidden = expected('all').find(uri => !expected(profile).includes(uri));
      if (hidden) await deny(client, profile, hidden, 'known URI outside selected profile');
      await deny(client, profile, 'make-docs://system/reference/w24-r0-p3-missing.md', 'unknown URI');
      await deny(client, profile, ui, 'reserved W25 UI is not live');
      if (profile === 'core' || profile === 'all' || profile === 'default') {
        const toolList = await client.callTool({ name: 'make_docs_resource_list', arguments: { targetRoot: root } });
        assert.ok(!toolList.isError);
        assert.deepEqual(toolList.structuredContent.result, cliList);
        assert.equal(toolList.structuredContent.result.resources.length, 62);
        const readUri = expected('all').find(uri => !expected('core').includes(uri));
        const cliRead = runCli(['resource', 'read', readUri, '--target', root, '--format', 'json']);
        assert.equal(cliRead.exitCode, 0, cliRead.stderr);
        const readValue = JSON.parse(cliRead.stdout);
        const toolRead = await client.callTool({ name: 'make_docs_resource_read', arguments: { uri: readUri, targetRoot: root } });
        assert.ok(!toolRead.isError);
        assert.deepEqual(toolRead.structuredContent.result, readValue);
        const native = allReads.get(readUri).contents[0];
        const { content, ...rest } = readValue.resource;
        assert.equal(native.blob, content.data);
        assert.equal(native.mimeType, readValue.resource.mediaType);
        assert.deepEqual(native._meta.makeDocs, rest);
        reads.coreToolParity.push({ profile, listResultEqualsCli: true, resourceCount: 62, readUri, readResultEqualsCli: true, nativeAllBytesAndProvenanceEqualCli: true, readUriIsHiddenFromCoreNative: true, toolRead });
      }
      raw.profiles[profile].stderr = stderr;
    } finally { await client.close(); await transport.close(); }
  }
  assert.deepEqual(raw.profiles.default.resources, raw.profiles.all.resources);
  assert.deepEqual(raw.profiles.default.tools, raw.profiles.all.tools);
  for (const profile of intents) {
    for (const tool of raw.profiles[profile].tools.tools) assert.deepEqual(tool, raw.profiles.all.tools.tools.find(candidate => candidate.name === tool.name));
  }
  const cliAfter = runCli(['resource', 'list', '--target', root, '--format', 'json']);
  assert.equal(cliAfter.exitCode, 0, cliAfter.stderr);
  assert.deepEqual(JSON.parse(cliAfter.stdout), cliList);
  const help = runCli(['mcp', '--help']);
  assert.equal(help.exitCode, 0, help.stderr);
  for (const profile of [...intents, 'all']) assert.ok(help.stdout.includes(profile));
  assert.ok(/default.*all/i.test(help.stdout));
  save('a10/cli-help.txt', help.stdout);
  const invalid = runCli(['mcp', '--profile', 'unrecognized']);
  assert.equal(invalid.exitCode, 1);
  assert.equal(invalid.stdout, '');
  for (const profile of [...intents, 'all']) assert.ok(invalid.stderr.includes(profile));
  save('a10/cli-invalid-profile.json', invalid);
  raw.checks = { exactProfileLists: true, exactAllUnion: true, defaultEqualsAllResourcesAndTools: true, sharedToolWireContractsEqualAll: true, p2ToolCountsUnchanged: true, reservedUiAbsentFromAllLiveLists: true, cliResourceInventoryUnchangedAfterProfileLaunches: true, noHttpAdapterOrHostSetup: true };
  reads.passed = true;
  denials.passed = true;
  raw.passed = true;
} catch (error) {
  raw.passed = false;
  raw.failure = { message: error.message, stack: error.stack };
  process.exitCode = 1;
} finally {
  raw.endedAt = new Date().toISOString();
  save('a9/stdio-results.json', raw);
  save('a7/allowed-read-and-cli-parity.json', reads);
  save('a8/native-denied-reads.json', denials);
  const unchanged = Object.entries(identity.source).every(([file, digest]) => hash(fs.readFileSync(path.join(root, file))) === digest) && Object.entries(identity.build).every(([file, digest]) => hash(fs.readFileSync(path.join(root, file))) === digest);
  save('p3/stdio-proof-results.json', { capturedAt: new Date().toISOString(), passed: raw.passed, sourceAndBuildUnchanged: unchanged, nativeReads: reads.comparisons.length, allBaselineReads: reads.comparisons.filter(read => read.profile === 'all').length, readComparisons: reads.comparisons.filter(read => read.profile !== 'all').length, deniedReads: denials.attempts.length, resourceCounts: counts, toolCounts, failure: raw.failure });
  if (!unchanged) process.exitCode = 1;
  process.stdout.write(`${JSON.stringify({ passed: raw.passed, sourceAndBuildUnchanged: unchanged, nativeReads: reads.comparisons.length, readComparisons: reads.comparisons.filter(read => read.profile !== 'all').length, deniedReads: denials.attempts.length, failure: raw.failure })}\n`);
}
