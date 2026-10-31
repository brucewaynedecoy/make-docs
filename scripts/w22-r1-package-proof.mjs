import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { resolveNpmLaunch } from './lib/w22-p6-package-proof.mjs';

const RELEASED_205_SHA512 = '6R85IftsAMGtsICPMOc8fmvnCNWRyhr+gnimzD24G2Pu6Reqt3CWcfnuwMQzhEiX7/4FWjzrq0aOngDRfMdIQA==';
const RELEASED_205_SHA256 = '76b6ee0af960da03f894bd4e0b2c4ca3804dac4e0a490cee6935c844771bb4cd';
const RELEASED_205_URL = 'https://registry.npmjs.org/@brucewaynedecoy/make-docs/-/make-docs-2.0.5.tgz';
const PACKAGE_NAME = '@brucewaynedecoy/make-docs';
const SETUP_FLAGS = ['--yes', '--codex-method', 'none', '--claude-code-method', 'none', '--no-github-copilot', '--no-skills', '--json'];

function option(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0 || !process.argv[index + 1]) throw new Error(`W22 R1 proof requires --${name}.`);
  return path.resolve(process.argv[index + 1]);
}

function optionalOption(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index < 0 ? null : option(name);
}

function digest(file, algorithm, encoding = 'hex') {
  return createHash(algorithm).update(readFileSync(file)).digest(encoding);
}

function windowsNpmCommands() {
  if (process.platform !== 'win32') return [];
  try {
    return execFileSync('where.exe', ['npm.cmd'], {encoding: 'utf8'}).split(/\r?\n/u).map(item => item.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function npmInstall(tarball, prefix) {
  const launch = resolveNpmLaunch({npmCommandPaths: windowsNpmCommands()});
  mkdirSync(prefix, {recursive: true});
  execFileSync(launch.file, [...launch.prefixArgs, 'install', '--prefix', prefix, '--cache', path.join(prefix, '.npm-cache'), '--ignore-scripts', '--no-audit', '--no-fund', tarball], {
    cwd: prefix, stdio: 'pipe', encoding: 'utf8', timeout: 120000,
  });
  const packageRoot = path.join(prefix, 'node_modules', ...PACKAGE_NAME.split('/'));
  assert.ok(existsSync(packageRoot), `Package install is missing ${packageRoot}`);
  return path.join(packageRoot, 'dist', 'index.js');
}

function npmVersion() {
  const launch = resolveNpmLaunch({npmCommandPaths: windowsNpmCommands()});
  return execFileSync(launch.file, [...launch.prefixArgs, '--version'], {encoding: 'utf8'}).trim();
}

function run(bin, args, store) {
  const result = execFileSync(process.execPath, [bin, ...args], {
    cwd: path.dirname(store), env: {...process.env, MAKE_DOCS_HOME: store}, encoding: 'utf8', timeout: 120000,
  });
  return args.includes('--json') ? JSON.parse(result) : result.trim();
}

function durable(store) {
  const db = new DatabaseSync(path.join(store, 'store.db'), {readOnly: true});
  try {
    const tables = ['projects', 'installation_checkouts', 'installation_ledgers', 'installation_operations', 'installation_steps', 'installation_migration_records', 'installation_transfers'];
    return Object.fromEntries(tables.map(table => [table, db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()]));
  } finally {
    db.close();
  }
}

function row(state, root) {
  // Windows can use a short name before the unique temporary fixture directory.
  const relative = value => {
    const normalized = path.resolve(value).replaceAll('\\', '/').toLowerCase();
    const marker = `/${path.basename(temp).toLowerCase()}/`;
    const start = normalized.lastIndexOf(marker);
    assert.ok(start >= 0, `Checkout path is outside the test fixture: ${value}`);
    return normalized.slice(start + marker.length);
  };
  const target = relative(root);
  return state.installation_checkouts.find(item => relative(item.root_path) === target);
}

function instructionBytes(root) {
  return Object.fromEntries(['AGENTS.md', 'CLAUDE.md'].map(name => [name, readFileSync(path.join(root, name)).toString('base64')]));
}

function addUserText(root) {
  for (const name of ['AGENTS.md', 'CLAUDE.md']) {
    const file = path.join(root, name);
    writeFileSync(file, Buffer.concat([Buffer.from('user prefix\n'), readFileSync(file), Buffer.from('\nuser suffix\n')]));
  }
}

const candidateTarball = option('candidate');
const candidatePackage = option('candidate-package-json');
const expectedVersion = JSON.parse(readFileSync(candidatePackage, 'utf8')).version;
const temp = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'make-docs-w22-r1-package-')));
try {
  const releasedTarball = optionalOption('released-205') ?? (process.env.MAKE_DOCS_RELEASED_205_TARBALL ? path.resolve(process.env.MAKE_DOCS_RELEASED_205_TARBALL) : path.join(temp, 'released-205.tgz'));
  if (!existsSync(releasedTarball)) {
    const response = await fetch(RELEASED_205_URL);
    if (!response.ok) throw new Error(`Released 2.0.5 download failed: HTTP ${response.status}`);
    writeFileSync(releasedTarball, Buffer.from(await response.arrayBuffer()));
  }
  assert.equal(digest(releasedTarball, 'sha512', 'base64'), RELEASED_205_SHA512);
  assert.equal(digest(releasedTarball, 'sha256'), RELEASED_205_SHA256);
  const oldBin = npmInstall(releasedTarball, path.join(temp, 'old-install'));
  const candidateBin = npmInstall(candidateTarball, path.join(temp, 'candidate-install'));
  const oldMetadata = JSON.parse(readFileSync(path.resolve(path.dirname(oldBin), '..', 'package.json'), 'utf8'));
  const candidateMetadata = JSON.parse(readFileSync(path.resolve(path.dirname(candidateBin), '..', 'package.json'), 'utf8'));
  assert.equal(oldMetadata.name, PACKAGE_NAME);
  assert.equal(oldMetadata.version, '2.0.5');
  assert.equal(candidateMetadata.name, PACKAGE_NAME);
  assert.equal(candidateMetadata.version, expectedVersion);
  assert.equal(run(oldBin, ['--version'], path.join(temp, 'store')), '2.0.5');
  assert.equal(run(candidateBin, ['--version'], path.join(temp, 'store')), expectedVersion);
  const store = path.join(temp, 'store');
  const buildos = path.join(temp, 'buildos');
  const oldKit = path.join(buildos, 'kits', 'make-blueprint');
  mkdirSync(oldKit, {recursive: true});
  for (const root of [buildos, oldKit]) {
    const result = run(oldBin, ['setup', '--target', root, ...SETUP_FLAGS], store);
    assert.equal(result.status, 'complete');
  }
  const seeded = durable(store);
  const rootId = row(seeded, buildos);
  const kitId = row(seeded, oldKit);
  assert.ok(rootId && kitId, JSON.stringify(seeded.installation_checkouts.map(item => item.root_path)));
  assert.notEqual(rootId.project_id, kitId.project_id);
  assert.notEqual(rootId.checkout_id, kitId.checkout_id);
  cpSync(buildos, path.join(temp, 'seed-project-copy'), {recursive: true});
  cpSync(store, path.join(temp, 'seed-store-copy'), {recursive: true});
  addUserText(buildos);
  addUserText(oldKit);
  const rootBytes = instructionBytes(buildos);
  const kitBytes = instructionBytes(oldKit);
  const moved = path.join(temp, 'make-kit');
  const movedKit = path.join(moved, 'kits', 'make-blueprint');
  renameSync(buildos, moved);
  const before = durable(store);
  const setupReview = run(candidateBin, ['setup', '--target', moved, ...SETUP_FLAGS], store);
  assert.equal(setupReview.status, 'blocked');
  assert.equal(setupReview.checkoutMove.status, 'ready');
  assert.deepEqual(durable(store), before, 'Setup review wrote durable Store state');
  const rootInstructions = path.join(moved, 'AGENTS.md');
  const safeInstructions = readFileSync(rootInstructions);
  writeFileSync(rootInstructions, Buffer.concat([safeInstructions, Buffer.from('\n<!-- make-docs:begin -->\n')]));
  const unsafePreview = run(candidateBin, ['project', 'checkout-move', 'preview', '--target-root', moved, '--json'], store);
  assert.equal(unsafePreview.candidates.find(item => item.checkoutId === rootId.checkout_id)?.available, false);
  const unsafeText = run(candidateBin, ['project', 'checkout-move', 'preview', '--target-root', moved], store);
  assert.match(unsafeText, /Available: no/u);
  assert.match(unsafeText, /Blocker:/u);
  assert.deepEqual(durable(store), before, 'Unsafe preview wrote durable Store state');
  writeFileSync(rootInstructions, safeInstructions);
  const rootPreview = run(candidateBin, ['project', 'checkout-move', 'preview', '--target-root', moved, '--json'], store);
  const rootChoice = rootPreview.candidates.find(item => item.checkoutId === rootId.checkout_id);
  assert.equal(rootChoice.available, true);
  const rootPreviewText = run(candidateBin, ['project', 'checkout-move', 'preview', '--target-root', moved], store);
  assert.match(rootPreviewText, /Checkout move: ready/u);
  assert.ok(rootPreviewText.includes(`Source: ${rootChoice.sourceRoot} (${rootId.checkout_id})`));
  assert.ok(rootPreviewText.includes(`Review: ${rootChoice.reviewDigest}`));
  assert.deepEqual(durable(store), before, 'Move preview wrote durable Store state');
  const rootMove = run(candidateBin, ['project', 'checkout-move', 'apply', '--target-root', moved, '--source-checkout', rootId.checkout_id, '--source-root', rootChoice.sourceRoot, '--review', rootChoice.reviewDigest, '--json'], store);
  assert.equal(rootMove.status, 'completed');
  const rootRetryText = run(candidateBin, ['project', 'checkout-move', 'apply', '--target-root', moved, '--source-checkout', rootId.checkout_id, '--source-root', rootChoice.sourceRoot, '--review', rootChoice.reviewDigest], store);
  assert.match(rootRetryText, /Checkout move: already-completed/u);
  assert.ok(rootRetryText.includes(`Checkout ID: ${rootId.checkout_id}`));
  assert.ok(rootRetryText.includes(`Source: ${rootChoice.sourceRoot}`));
  assert.match(rootRetryText, /Project files: unchanged/u);
  assert.match(rootRetryText, /Next:/u);
  const afterRoot = durable(store);
  assert.equal(row(afterRoot, moved)?.checkout_id, rootId.checkout_id);
  assert.deepEqual(afterRoot.installation_checkouts.find(item => item.checkout_id === kitId.checkout_id), kitId, 'Root approval changed the kit record');
  assert.deepEqual(afterRoot.installation_ledgers, before.installation_ledgers);
  assert.deepEqual(afterRoot.installation_operations, before.installation_operations);
  assert.deepEqual(afterRoot.installation_steps, before.installation_steps);
  assert.deepEqual(instructionBytes(moved), rootBytes);
  assert.deepEqual(instructionBytes(movedKit), kitBytes);
  const kitPreview = run(candidateBin, ['project', 'checkout-move', 'preview', '--target-root', movedKit, '--json'], store);
  const kitChoice = kitPreview.candidates.find(item => item.checkoutId === kitId.checkout_id);
  assert.equal(kitChoice.available, true);
  const kitMove = run(candidateBin, ['project', 'checkout-move', 'apply', '--target-root', movedKit, '--source-checkout', kitId.checkout_id, '--source-root', kitChoice.sourceRoot, '--review', kitChoice.reviewDigest, '--json'], store);
  assert.equal(kitMove.status, 'completed');
  const afterKit = durable(store);
  assert.equal(row(afterKit, movedKit)?.checkout_id, kitId.checkout_id);
  assert.deepEqual(afterKit.installation_ledgers, before.installation_ledgers);
  assert.deepEqual(afterKit.installation_operations, before.installation_operations);
  assert.deepEqual(afterKit.installation_steps, before.installation_steps);
  assert.equal(afterKit.installation_migration_records.length, before.installation_migration_records.length + 2);
  assert.deepEqual(instructionBytes(moved), rootBytes);
  assert.deepEqual(instructionBytes(movedKit), kitBytes);
  for (const root of [moved, movedKit]) {
    const upgrade = run(candidateBin, ['setup', '--target', root, ...SETUP_FLAGS], store);
    assert.equal(upgrade.status, 'complete');
    assert.equal(upgrade.checkoutMove, null);
    for (const name of ['AGENTS.md', 'CLAUDE.md']) {
      const content = readFileSync(path.join(root, name), 'utf8');
      assert.ok(content.startsWith('user prefix\n'));
      assert.ok(content.endsWith('\nuser suffix\n'));
    }
  }
  const afterUpgrade = durable(store);
  for (const root of [moved, movedKit]) {
    const repeat = run(candidateBin, ['setup', '--target', root, ...SETUP_FLAGS], store);
    assert.equal(repeat.status, 'complete');
    assert.equal(repeat.checkoutMove, null);
    assert.equal(repeat.project.changed, false);
  }
  const afterRepeat = durable(store);
  assert.equal(row(afterRepeat, moved)?.checkout_id, rootId.checkout_id);
  assert.equal(row(afterRepeat, movedKit)?.checkout_id, kitId.checkout_id);
  assert.deepEqual(afterRepeat.installation_operations, afterUpgrade.installation_operations);
  assert.deepEqual(afterRepeat.installation_steps, afterUpgrade.installation_steps);
  assert.deepEqual(afterRepeat.installation_migration_records.filter(item => item.kind === 'receipt'), afterUpgrade.installation_migration_records.filter(item => item.kind === 'receipt'));
  const movedAgain = path.join(temp, 'make-kit-again');
  renameSync(moved, movedAgain);
  const beforeOldReader = durable(store);
  const oldReader = spawnSync(process.execPath, [oldBin, 'project', 'surface', 'ensure', 'artifacts'], {
    cwd: movedAgain, env: {...process.env, MAKE_DOCS_HOME: store}, encoding: 'utf8', timeout: 120000,
  });
  assert.notEqual(oldReader.status, 0, 'Released 2.0.5 accepted unfamiliar move evidence');
  assert.match(`${oldReader.stdout}\n${oldReader.stderr}`, /does not have verified installation evidence in the Store/i);
  assert.deepEqual(durable(store), beforeOldReader, 'Old reader changed durable Store state');
  console.log(JSON.stringify({status: 'passed', source: RELEASED_205_URL, released205: {integrity: `sha512-${RELEASED_205_SHA512}`, sha256: RELEASED_205_SHA256}, candidate: {version: expectedVersion, sha256: digest(candidateTarball, 'sha256')}, runtime: {node: process.version, npm: npmVersion(), os: process.platform}, rootCheckoutId: rootId.checkout_id, kitCheckoutId: kitId.checkout_id, receiptCount: 2}));
} finally {
  rmSync(temp, {recursive: true, force: true});
}
