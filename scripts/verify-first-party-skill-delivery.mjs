#!/usr/bin/env node
// Maintainer evidence runner. It consumes an existing tarball; it never builds,
// updates the source tree, or uses direct Store APIs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const option = (name) => { const i = argv.indexOf(name); return i < 0 ? undefined : argv[i + 1]; };
if (argv.includes('--help') || !option('--tar')) {
  console.log('Usage: node scripts/verify-first-party-skill-delivery.mjs --tar <existing.tgz> [--output <report.json>]');
  console.log('macOS sandbox-exec is required to prove network and source-checkout denial. Installs stay in a new OS temp directory.');
  process.exit(argv.includes('--help') ? 0 : 2);
}
const tarball = fs.realpathSync(option('--tar'));
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'make-docs-skill-proof-'));
const output = path.resolve(option('--output') ?? path.join(scratch, 'report.json'));
const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const names = ['archive-docs', 'cleanup-docs', 'decompose-codebase', 'preflight', 'factory', 'human-experience', 'naive-uat'];
const report = {
  schemaVersion: 1, startedAt: new Date().toISOString(), status: 'running',
  sourceRoot, tarball, tarSha256: hash(fs.readFileSync(tarball)), scratch,
  checks: [], runs: [], limits: [
    'This runner proves artifact bytes, isolated CLI installation, and exposure. It does not prove all Skill instructions or external tools work.',
    'Forced copy exposure proves the copy path on this OS, not a Windows or live harness session.',
    'No real maintainer install, adoption, removal, or direct Store access is performed.',
  ],
};
function record(name, fn) { const evidence = fn(); report.checks.push({ name, result: 'passed', evidence }); return evidence; }
function execute(command, args, options = {}) {
  const r = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 120_000, ...options });
  if (r.error || r.status !== 0) throw new Error(`${command} failed (${r.status}): ${r.error ?? ''}\n${r.stdout ?? ''}\n${r.stderr ?? ''}`);
  return r.stdout;
}
function inventory(root, followRoot = false) {
  if (!fs.existsSync(root)) return [];
  const rows = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir).sort()) {
      const p = path.join(dir, name), stat = fs.lstatSync(p), relative = path.relative(root, p).split(path.sep).join('/');
      if (stat.isSymbolicLink()) rows.push({ path: relative, kind: 'symlink', target: fs.readlinkSync(p) });
      else if (stat.isDirectory()) { rows.push({ path: relative, kind: 'directory' }); walk(p); }
      else if (stat.isFile()) rows.push({ path: relative, kind: 'file', sha256: hash(fs.readFileSync(p)), bytes: stat.size });
      else throw new Error(`Unsupported file type: ${p}`);
    }
  }
  if (!followRoot) assert(!fs.lstatSync(root).isSymbolicLink(), `Unexpected root symlink: ${root}`);
  walk(root); return rows;
}
function filesOnly(rows) { return rows.filter((r) => r.kind !== 'directory'); }
function expectedFiles(skill) {
  const declared = [{ source: skill.entryPoint, installPath: 'SKILL.md' }, ...(skill.assets ?? [])];
  return declared.map(({ source, installPath }) => {
    assert(source && installPath && !path.isAbsolute(source) && !source.split('/').includes('..'));
    assert(!path.isAbsolute(installPath) && !installPath.split('/').includes('..'));
    const file = path.join(sourceRoot, 'packages/skills', skill.name, source);
    assert(fs.lstatSync(file).isFile(), `Declared source must be a regular file: ${file}`);
    const bytes = fs.readFileSync(file);
    return { source, path: installPath, kind: 'file', sha256: hash(bytes), bytes: bytes.length, base64: bytes.toString('base64') };
  }).sort((a, b) => a.path.localeCompare(b.path));
}
// Independent acceptance table. Do not derive expected paths from the product catalog.
const standardLocations = {
  project: {
    codex: { canonical: '.agents/skills', native: { codex: '.agents/skills' } },
    'claude-code': { canonical: '.claude/skills', native: { 'claude-code': '.claude/skills' } },
    both: { canonical: '.agents/skills', native: { codex: '.agents/skills', 'claude-code': '.claude/skills' } },
  },
  global: {
    codex: { canonical: '.agents/skills', native: { codex: '.codex/skills' } },
    'claude-code': { canonical: '.agents/skills', native: { 'claude-code': '.claude/skills' } },
    both: { canonical: '.agents/skills', native: { codex: '.codex/skills', 'claude-code': '.claude/skills' } },
  },
};
function pathExists(file) {
  try { fs.lstatSync(file); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}
function expectedTree(files) {
  const directories = new Set();
  for (const file of files) {
    let parent = path.posix.dirname(file.path);
    while (parent !== '.') { directories.add(parent); parent = path.posix.dirname(parent); }
  }
  return [...files, ...[...directories].map((path) => ({ path, kind: 'directory' }))];
}
function normalize(rows) { return rows.map(({ path, kind, sha256, bytes, target }) => ({ path, kind, ...(kind === 'file' ? { sha256, bytes } : { target }) })).sort((a, b) => a.path.localeCompare(b.path)); }

try {
  const registryBytes = fs.readFileSync(path.join(sourceRoot, 'packages/cli/skill-registry.json'));
  const packageBytes = fs.readFileSync(path.join(sourceRoot, 'packages/cli/package.json'));
  const registry = JSON.parse(registryBytes);
  const skills = registry.skills;
  record('seven first-party declarations', () => { assert.deepEqual(skills.map((s) => s.name).sort(), [...names].sort()); return { names, registrySha256: hash(registryBytes) }; });
  const expected = Object.fromEntries(skills.map((s) => [s.name, expectedFiles(s)]));
  report.sourceInventory = Object.fromEntries(Object.entries(expected).map(([name, rows]) => [name, rows.map(({ base64, ...row }) => row)]));
  record('actual package disk has no Skill mirrors', () => {
    const rows = inventory(path.join(sourceRoot, 'packages'));
    const canonicalFiles = new Set(Object.entries(expected).flatMap(([name, entries]) => entries.map((r) => `skills/${name}/${r.source}`)));
    const mirrors = rows.filter((r) => {
      const parts = r.path.split('/');
      const canonicalHome = parts.length === 2 && parts[0] === 'skills' && names.includes(parts[1]);
      if (r.kind === 'file' && parts.at(-1) === 'SKILL.md') return !canonicalFiles.has(r.path);
      if (['directory', 'symlink'].includes(r.kind) && names.includes(parts.at(-1)) && !canonicalHome) return true;
      if (r.kind === 'symlink') {
        const resolved = path.resolve(path.dirname(path.join(sourceRoot, 'packages', r.path)), r.target);
        if (names.some((name) => resolved === path.join(sourceRoot, 'packages/skills', name) || resolved.startsWith(path.join(sourceRoot, 'packages/skills', name) + path.sep))) return true;
        if (parts.at(-1) === 'skills') return true;
      }
      // An empty retired skills payload root is still a forbidden mirror.
      return r.kind === 'directory' && parts.at(-1) === 'skills' && fs.readdirSync(path.join(sourceRoot, 'packages', r.path)).length === 0;
    });
    assert.deepEqual(mirrors, [], `Replicated or empty Skill trees: ${JSON.stringify(mirrors)}`);
    return { entries: rows.length, directories: rows.filter((r) => r.kind === 'directory').length, symlinks: rows.filter((r) => r.kind === 'symlink').length, symlinkPolicy: 'Record links without recursive traversal; reject Skill mirror names and links targeting canonical Skill homes.', gitIgnoreUsed: false, mirrors };
  });
  const extraction = path.join(scratch, 'extracted'); fs.mkdirSync(extraction);
  const members = execute('tar', ['-tzf', tarball]).trim().split('\n');
  for (const p of members) assert(!path.isAbsolute(p) && !p.split('/').includes('..'), `Unsafe archive member: ${p}`);
  execute('tar', ['-xzf', tarball, '-C', extraction]);
  const packed = path.join(extraction, 'package'), entry = path.join(packed, 'dist/index.js');
  record('packed registry equals source', () => { assert.equal(hash(fs.readFileSync(path.join(packed, 'skill-registry.json'))), hash(registryBytes)); return hash(registryBytes); });
  record('packed package and version equal source', () => { const bytes = fs.readFileSync(path.join(packed, 'package.json')); assert.equal(hash(bytes), hash(packageBytes)); return { version: JSON.parse(bytes).version, packageDigest: hash(bytes) }; });
  const embeddedChunks = fs.readdirSync(path.join(packed, 'dist')).filter((f) => /^virtual_make-docs-first-party-skills-.*\.js$/.test(f));
  assert.equal(embeddedChunks.length, 1, 'Expected one emitted embedded Skill module');
  const { bundle } = await import(pathToFileURL(path.join(packed, 'dist', embeddedChunks[0])).href);
  record('compiled artifacts contain declared embedded bytes', () => {
    assert.deepEqual(inventory(path.join(packed, 'dist')), inventory(path.join(sourceRoot, 'packages/cli/dist')), 'Packed compiled output differs from reviewed build');
    assert.equal(bundle.schemaVersion, 1);
    assert.equal(bundle.packageDigest, hash(packageBytes));
    assert.equal(bundle.registryDigest, hash(registryBytes));
    assert.equal(bundle.digest, hash(JSON.stringify({ packageDigest: bundle.packageDigest, registryDigest: bundle.registryDigest, payloads: bundle.payloads })));
    assert.deepEqual(Object.keys(bundle.payloads).sort(), [...names].sort());
    for (const [name, rows] of Object.entries(expected)) {
      const payload = bundle.payloads[name];
      assert.equal(payload.entryPoint, skills.find((s) => s.name === name).entryPoint);
      assert.deepEqual(payload.assets, skills.find((s) => s.name === name).assets ?? []);
      assert.deepEqual(Object.keys(payload.files).sort(), rows.map((r) => r.source).sort());
      for (const row of rows) {
        assert.equal(payload.files[row.source].sha256, row.sha256, `Embedded hash ${name}/${row.source}`);
        assert.equal(payload.files[row.source].base64, row.base64, `Embedded bytes ${name}/${row.source}`);
      }
    }
    const packedRows = inventory(packed);
    assert(!packedRows.some((r) => r.kind === 'file' && r.path.endsWith('/SKILL.md')), 'Packed duplicate Skill entrypoint tree');
    assert(!packedRows.some((r) => r.kind === 'directory' && r.path.split('/').at(-1) === 'skills'), 'Packed Skill payload directory');
    return { entrySha256: hash(fs.readFileSync(entry)), embeddedChunk: embeddedChunks[0], embeddedChunkSha256: hash(fs.readFileSync(path.join(packed, 'dist', embeddedChunks[0]))), bundleDigest: bundle.digest, registryDigest: bundle.registryDigest, declaredFiles: Object.values(expected).flat().length, archiveMembers: members.length, extractedEntries: packedRows.length };
  });
  assert.equal(process.platform, 'darwin', 'This proof requires macOS sandbox-exec; no weaker offline fallback is accepted');
  const sandbox = '/usr/bin/sandbox-exec'; assert(fs.existsSync(sandbox), 'sandbox-exec unavailable');
  const profile = `(version 1) (allow default) (deny network*) (deny file-read* (subpath ${JSON.stringify(sourceRoot)}))`;
  record('sandbox denies source reads and network', () => {
    const probe = `const fs=require('node:fs');let denied=false;try{fs.readFileSync(${JSON.stringify(path.join(sourceRoot, 'package.json'))})}catch(e){denied=e.code==='EPERM'||e.code==='EACCES'}if(!denied)process.exit(4);const s=require('node:net').createServer();s.on('error',e=>process.exit(e.code==='EPERM'||e.code==='EACCES'?0:5));s.listen(0,'127.0.0.1',()=>process.exit(6));`;
    execute(sandbox, ['-p', profile, process.execPath, '-e', probe], { cwd: scratch });
    return { denied: ['source checkout file reads', 'network including local listen'], profile };
  });
  const cases = names.map((name) => ({ id: `individual-${name}`, selection: name, scope: 'project', harnesses: 'codex', mode: 'symlink' }));
  for (const scope of ['project', 'global']) for (const harnesses of ['codex', 'claude-code', 'both']) for (const mode of ['symlink', 'copy']) cases.push({ id: `all-${scope}-${harnesses}-${mode}`, selection: 'all', scope, harnesses, mode });
  cases.push({ id: 'none', selection: 'none', scope: 'project', harnesses: 'both', mode: 'symlink' }, { id: 'bare', selection: null, scope: 'project', harnesses: 'both', mode: 'symlink' });
  for (const test of cases) {
    const root = path.join(scratch, test.id), project = path.join(root, 'project'), home = path.join(root, 'home');
    fs.mkdirSync(project, { recursive: true }); fs.mkdirSync(home);
    const env = { ...process.env, HOME: home, USERPROFILE: home, CODEX_HOME: path.join(home, '.codex'), CLAUDE_CONFIG_DIR: path.join(home, '.claude'), MAKE_DOCS_HOME: path.join(home, '.make-docs'), XDG_CACHE_HOME: path.join(home, '.cache'), MAKE_DOCS_DISABLE_SKILL_SYMLINKS: test.mode === 'copy' ? '1' : '0', CI: '1', NO_COLOR: '1' };
    const args = ['setup', '--target', project, '--yes', '--skill-scope', test.scope, '--project-resources', 'none'];
    if (test.selection !== null) args.push('--selected-skills', test.selection);
    if (test.harnesses === 'codex') args.push('--no-claude-code');
    if (test.harnesses === 'claude-code') args.push('--no-codex');
    const started = Date.now();
    const stdout = execute(sandbox, ['-p', profile, process.execPath, entry, ...args], { cwd: project, env });
    fs.writeFileSync(path.join(root, 'setup-output.txt'), stdout);
    const selected = test.selection === 'all' ? names : !test.selection || test.selection === 'none' ? [] : [test.selection];
    const installRoot = test.scope === 'global' ? home : project;
    const layout = standardLocations[test.scope][test.harnesses];
    const canonicalRoot = path.join(installRoot, layout.canonical);
    for (const base of [project, home]) assert(!pathExists(path.join(base, '.make-docs/agentics')), `${test.id}: forbidden private Skill layer`);
    const otherScopeRoot = test.scope === 'global' ? project : home;
    for (const relative of ['.agents/skills', '.claude/skills', '.codex/skills']) {
      assert(!pathExists(path.join(otherScopeRoot, relative)), `${test.id}: Skill root created in unselected scope: ${relative}`);
    }
    const allowedRoots = selected.length ? new Set([layout.canonical, ...Object.values(layout.native)]) : new Set();
    for (const relative of ['.agents/skills', '.claude/skills', '.codex/skills']) {
      const dir = path.join(installRoot, relative);
      if (!allowedRoots.has(relative)) assert(!pathExists(dir), `${test.id}: unselected Skill root exists (including empty or link): ${relative}`);
      else assert.deepEqual(fs.readdirSync(dir).sort(), [...selected].sort(), `${test.id}: exact Skill set at ${relative}`);
    }
    for (const name of selected) {
      const target = path.join(canonicalRoot, name);
      assert(fs.lstatSync(target).isDirectory() && !fs.lstatSync(target).isSymbolicLink(), `${test.id}: canonical Skill must be a real directory`);
      assert.deepEqual(normalize(inventory(target)), normalize(expectedTree(expected[name])), `${test.id}: canonical bytes and exact directories ${name}`);
    }
    const exposures = [];
    for (const [harness, native] of Object.entries(layout.native)) {
      const nativeRoot = path.join(installRoot, native);
      for (const name of selected) {
        const exposed = path.join(nativeRoot, name), isLink = fs.lstatSync(exposed).isSymbolicLink();
        const direct = nativeRoot === canonicalRoot;
        const wantedMode = direct ? 'direct' : test.mode === 'symlink' ? 'symlink' : 'copy';
        assert.equal(isLink, wantedMode === 'symlink', `${test.id}: ${harness} exposure type`);
        if (isLink) {
          assert.notEqual(exposed, path.join(canonicalRoot, name), 'Self-link forbidden');
          assert.equal(fs.realpathSync(exposed), fs.realpathSync(path.join(canonicalRoot, name)));
        }
        assert.deepEqual(normalize(inventory(exposed, true)), normalize(expectedTree(expected[name])), `${test.id}: ${harness}/${name} bytes and exact directories`);
        exposures.push({ harness, name, mode: wantedMode, path: path.relative(installRoot, exposed), files: expected[name].length });
      }
    }
    const skillTrees = [...allowedRoots].sort().map((relative) => ({ path: relative, entries: inventory(path.join(installRoot, relative)) }));
    const run = { ...test, result: 'passed', durationMs: Date.now() - started, args, selected, expectedLayout: layout, exposures, skillTrees, privateLayerAbsent: true, unselectedScopeAndHarnessRootsAbsent: true, stdout: path.join(root, 'setup-output.txt') };
    report.runs.push(run); console.log(`PASS ${test.id}`);
    fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  }
  report.status = 'passed';
} catch (error) {
  report.status = 'failed'; report.error = String(error.stack ?? error); process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log(`${report.status}: ${output}`);
  if (report.error) console.error(report.error);
}
