import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const root = process.cwd();
const output = path.join(root, 'docs/work/2026-09-24-w24-r0-mcp-tool-profiles/evidence/p4/contracts');
const oldCommit = '793868a9468ff0bd5471261503b24b303cb1b4f5';
const candidateCommit = 'cced2bcbb71a4380e1dfbc10b7e2ef549dc271a2';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const hashFile = file => sha(fs.readFileSync(file));
const save = (name, value) => fs.writeFileSync(path.join(output, name), `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : entry.isFile() ? [path.join(directory, entry.name)] : []);
const tree = directory => Object.fromEntries(walk(directory).sort().map(file => [path.relative(directory, file), hashFile(file)]));
const started = Date.now();
const retained = JSON.parse(fs.readFileSync(path.join(root, 'docs/work/2026-09-24-w24-r0-mcp-tool-profiles/evidence/p3/source-identity-final.json')));
for (const section of ['source', 'build']) for (const [file, expected] of Object.entries(retained[section])) assert.equal(hashFile(path.join(root, file)), expected, file);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'w24-p4-contracts-'));
const old = path.join(temp, 'old');
const current = path.join(temp, 'current');
const fixture = path.join(temp, 'fixture');
const isolatedHome = path.join(temp, 'home');
for (const directory of [old, current, fixture, isolatedHome]) fs.mkdirSync(directory);
const archive = path.join(temp, 'old.tar');
fs.writeFileSync(archive, execFileSync('git', ['archive', oldCommit], { cwd: root, maxBuffer: 256 * 1024 * 1024 }));
execFileSync('tar', ['-xf', archive, '-C', old]);
assert.equal(hashFile(path.join(old, 'package-lock.json')), hashFile(path.join(root, 'package-lock.json')));
const dependencyTree = tree(path.join(root, 'node_modules'));
fs.cpSync(path.join(root, 'node_modules'), path.join(old, 'node_modules'), { recursive: true, verbatimSymlinks: true });
assert.deepEqual(tree(path.join(old, 'node_modules')), dependencyTree);
const build = spawnSync('npm', ['run', 'build', '-w', 'packages/cli'], { cwd: old, encoding: 'utf8', timeout: 60_000 });
fs.writeFileSync(path.join(output, 'historical-build-attempt-1.txt'), `${build.stdout}${build.stderr}`, { flag: 'wx' });
assert.equal(build.status, 0, 'historical export build');
// Provider bytes are a fixture input, separate from historical source/build.
// Both launches use the same P3 provider input. No file is copied back.
fs.cpSync(path.join(root, 'packages/docs/template'), path.join(old, 'packages/docs/template'), { recursive: true, force: true });
for (const relative of ['packages/cli/dist', 'packages/docs/template']) fs.cpSync(path.join(root, relative), path.join(current, relative), { recursive: true });
fs.copyFileSync(path.join(root, 'packages/cli/package.json'), path.join(current, 'packages/cli/package.json'));
fs.copyFileSync(path.join(root, 'package-lock.json'), path.join(current, 'package-lock.json'));
fs.cpSync(path.join(root, 'node_modules'), path.join(current, 'node_modules'), { recursive: true, verbatimSymlinks: true });
fs.mkdirSync(path.join(fixture, '.make-docs'));
fs.mkdirSync(path.join(fixture, 'docs'));
fs.writeFileSync(path.join(fixture, 'docs/note.md'), 'Portable project knowledge.\n');
fs.writeFileSync(path.join(fixture, '.make-docs/config.json'), `${JSON.stringify({ profile: 'complete', selections: {} })}\n`);
const providerInput = tree(path.join(current, 'packages/docs/template'));
assert.deepEqual(tree(path.join(old, 'packages/docs/template')), providerInput);
const env = { PATH: process.env.PATH, HOME: isolatedHome, TMPDIR: temp, MAKE_DOCS_HOME: path.join(temp, 'unconfigured-store'), MAKE_DOCS_CALLER_IDENTITY: '' };
const sanitize = value => JSON.parse(JSON.stringify(value).replaceAll(temp, '$TEMP').replaceAll(root, '$REPO'));
const identity = {
  coordinate: 'W24 R0 P4', startedAt: new Date(started).toISOString(), completedAt: new Date().toISOString(),
  source: { oldCommit, candidateCommit, currentHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), oldArchiveSha256: hashFile(archive), oldRuntimeSourceDigest: sha(JSON.stringify(tree(path.join(old, 'packages/cli/src')))), candidateRuntimeSourceDigest: sha(JSON.stringify(tree(path.join(root, 'packages/cli/src')))) },
  reusedP3: { sourceCount: Object.keys(retained.source).length, buildCount: Object.keys(retained.build).length, allHashesMatch: true, identityFileSha256: hashFile(path.join(root, 'docs/work/2026-09-24-w24-r0-mcp-tool-profiles/evidence/p3/source-identity-final.json')) },
  lockSha256: hashFile(path.join(root, 'package-lock.json')), dependencyTreeDigest: sha(JSON.stringify(dependencyTree)), dependencyFileCount: Object.keys(dependencyTree).length,
  node: { version: process.version, platform: process.platform, arch: process.arch, executable: process.execPath },
  packageVersion: JSON.parse(fs.readFileSync(path.join(root, 'packages/cli/package.json'))).version,
  sdkVersion: JSON.parse(fs.readFileSync(path.join(root, 'node_modules/@modelcontextprotocol/sdk/package.json'))).version,
  zodVersion: JSON.parse(fs.readFileSync(path.join(root, 'node_modules/zod/package.json'))).version,
  oldBuild: tree(path.join(old, 'packages/cli/dist')), currentBuild: tree(path.join(current, 'packages/cli/dist')),
  providerInputDigest: sha(JSON.stringify(providerInput)), providerInput, fixtureInput: tree(fixture),
  environment: env, paths: { temp, old, current, fixture },
  launch: { command: process.execPath, oldArgs: [path.join(old, 'packages/cli/dist/index.js'), 'mcp'], currentArgs: [path.join(current, 'packages/cli/dist/index.js'), 'mcp'], cwd: fixture },
  budget: { buildCount: 1, packageInstalls: 0, elapsedMs: Date.now() - started },
  scope: 'Source-to-source old-launch compatibility with same provider bytes/config fixture. Not a fresh installation, upgrade, host proof, or historical performance comparison.',
};
save('runtime-identity-attempt-1.json', sanitize(identity));
fs.writeFileSync(path.join(temp, 'runtime-local.json'), `${JSON.stringify({ ...identity, env }, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ localManifest: path.join(temp, 'runtime-local.json'), identity: 'runtime-identity-attempt-1.json', elapsedMs: identity.budget.elapsedMs }));
