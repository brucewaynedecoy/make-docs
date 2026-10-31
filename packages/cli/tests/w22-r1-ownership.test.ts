import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../src/cli';
import { renderManagedBlock } from '../src/managed-block';
import { defaultSelections, resolveInstallProfile } from '../src/profile';
import { createEmptySystemAssetManifestState } from '../src/system-assets';
import { canonicalInstallationPath, getInstallationCheckoutId, saveInstallationManifest, withInstallationDatabase, withInstallationOperation, previewInstallationCheckoutMove, applyInstallationCheckoutMove, registerSeparateInstallationCheckout, readInstallationStatus } from '../src/store/installation-state';
import { listOperations } from '../src/operations/registry';
import { callMakeDocsMcpTool, MAKE_DOCS_MCP_TOOLS } from '../src/mcp/tools';
import { applyGenericMcpSetup, prepareGenericMcpSetup } from '../src/generic-mcp-setup';
import { verifyMakeDocsExecutable } from '../src/harness-access';
import { MCP_CONNECTION_ID_ENV, MCP_CONNECTION_KEY_ENV } from '../src/mcp-connection';
import type { InstallManifest } from '../src/types';

const sha = (text: string) => createHash('sha256').update(text).digest('hex');
const fixtures: string[] = [];
const block = (body: string, prefix = '', suffix = '') => `${prefix}${renderManagedBlock(body)}${suffix}`;

function released205ContentDigest(root: string, manifest: InstallManifest): string {
  const facts = Object.keys(manifest.files).sort().map(relative => [
    relative, `file:${sha(readFileSync(path.join(root, relative), 'utf8'))}`,
  ]);
  return sha(JSON.stringify(facts));
}

function fixture() {
  const parent = mkdtempSync(path.join(os.tmpdir(), 'make-docs-w22-r1-'));
  fixtures.push(parent);
  const root = path.join(parent, 'project');
  const store = path.join(parent, 'store');
  mkdirSync(root);
  const profile = resolveInstallProfile(defaultSelections());
  const files = {
    'AGENTS.md': { hash: sha('root rules\n'), sourceId: 'router:codex:AGENTS.md', ownershipClass: 'managed-block' as const },
    'CLAUDE.md': { hash: sha('claude rules\n'), sourceId: 'router:claude-code:CLAUDE.md', ownershipClass: 'managed-block' as const },
    'owned.md': { hash: sha('owned text'), sourceId: 'provider:owned.md', ownershipClass: 'managed-snapshot' as const },
  };
  const manifest: InstallManifest = {
    schemaVersion: 2, packageName: '@brucewaynedecoy/make-docs', packageVersion: '2.0.5',
    updatedAt: '2026-10-31T00:00:00.000Z', profileId: profile.profileId,
    selections: profile.selections, effectiveCapabilities: profile.effectiveCapabilities,
    systemAssetMaterialization: createEmptySystemAssetManifestState(), files, skillFiles: [],
  };
  writeFileSync(path.join(root, 'AGENTS.md'), block('root rules\n', 'user root\n', '\nroot tail'));
  writeFileSync(path.join(root, 'CLAUDE.md'), block('claude rules\n', 'user claude\n', '\nclaude tail'));
  writeFileSync(path.join(root, 'owned.md'), 'owned text');
  withInstallationOperation(root, 'test.seed', () => {}, { storeRoot: store });
  const projectId = withInstallationDatabase(root, db => (db.prepare('SELECT project_id FROM installation_checkouts').get() as { project_id: string }).project_id, { storeRoot: store, readOnly: true });
  manifest.projectId = projectId;
  withInstallationOperation(root, 'test.ledger', () => saveInstallationManifest(root, manifest), { storeRoot: store, projectId });
  const checkoutId = getInstallationCheckoutId(root, store);
  return { parent, root, store, checkoutId, manifest };
}

function move(f: ReturnType<typeof fixture>) {
  const moved = path.join(f.parent, 'moved');
  renameSync(f.root, moved);
  return moved;
}

function reviewedMove(f: ReturnType<typeof fixture>, moved: string) {
  const preview = previewInstallationCheckoutMove(moved, f.checkoutId, f.store);
  const candidate = preview.candidates.find(item => item.checkoutId === f.checkoutId);
  expect(candidate?.blockers).toEqual([]);
  expect(candidate?.reviewDigest).toMatch(/^[a-f0-9]{64}$/);
  return applyInstallationCheckoutMove(moved, f.checkoutId, f.root, candidate!.reviewDigest!, f.store);
}

function verification(f: ReturnType<typeof fixture>) {
  return withInstallationDatabase(f.root, db => {
    const row = db.prepare('SELECT root_path,verification_json FROM installation_checkouts WHERE checkout_id=?').get(f.checkoutId) as { root_path: string; verification_json: string };
    return { rootPath: row.root_path, evidence: JSON.parse(row.verification_json) };
  }, { storeRoot: f.store, readOnly: true });
}

function savedRows(f: ReturnType<typeof fixture>) {
  return withInstallationDatabase(f.root, db => ({
    checkout: db.prepare('SELECT * FROM installation_checkouts WHERE checkout_id=?').get(f.checkoutId),
    ledger: db.prepare('SELECT * FROM installation_ledgers WHERE checkout_id=?').get(f.checkoutId),
    operations: db.prepare('SELECT * FROM installation_operations WHERE checkout_id=? ORDER BY created_at,operation_id').all(f.checkoutId),
    steps: db.prepare('SELECT * FROM installation_steps WHERE operation_id IN (SELECT operation_id FROM installation_operations WHERE checkout_id=?) ORDER BY operation_id,ordinal').all(f.checkoutId),
  }), { storeRoot: f.store, readOnly: true });
}

afterEach(() => fixtures.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));

describe('W22 R1 checkout ownership proof', () => {
  it('moves both valid managed blocks after user edits outside them and keeps those bytes', () => {
    const f = fixture();
    const moved = move(f);
    const rootText = block('root rules\n', 'changed root prefix\n', '\nchanged root suffix');
    const claudeText = block('claude rules\n', 'changed claude prefix\n', '\nchanged claude suffix');
    writeFileSync(path.join(moved, 'AGENTS.md'), rootText);
    writeFileSync(path.join(moved, 'CLAUDE.md'), claudeText);
    const before = verification(f);
    expect(before.evidence.schemaVersion).toBe(2);
    expect(before.evidence.ownershipFacts).toHaveLength(3);
    reviewedMove(f, moved);
    expect(getInstallationCheckoutId(moved, f.store)).toBe(f.checkoutId);
    expect(readFileSync(path.join(moved, 'AGENTS.md'), 'utf8')).toBe(rootText);
    expect(readFileSync(path.join(moved, 'CLAUDE.md'), 'utf8')).toBe(claudeText);
  });

  it.each([
    ['changed block', 'AGENTS.md', block('changed rules\n')],
    ['missing end marker', 'AGENTS.md', '<!-- make-docs:begin -->\nroot rules\n'],
    ['missing begin marker', 'AGENTS.md', 'root rules\n<!-- make-docs:end -->'],
    ['duplicate marker', 'AGENTS.md', `${block('root rules\n')}\n<!-- make-docs:begin -->`],
    ['reversed markers', 'AGENTS.md', '<!-- make-docs:end -->\n<!-- make-docs:begin -->'],
    ['malformed marker', 'AGENTS.md', '<!-- make-docs:begin -->\nroot rules\n<!-- make-docs:end -- >'],
    ['changed full file', 'owned.md', 'user changed owned text'],
  ])('refuses %s without changing the saved checkout', (_case, relative, content) => {
    const f = fixture();
    const moved = move(f);
    writeFileSync(path.join(moved, relative), content);
    const preview = previewInstallationCheckoutMove(moved, f.checkoutId, f.store);
    expect(preview.candidates[0].blockers.join(' ')).toMatch(/ownership|block|hash|facts|match/i);
    expect(verification(f).rootPath).toBe(canonicalInstallationPath(f.root));
    expect(readFileSync(path.join(moved, relative), 'utf8')).toBe(content);
  });

  it('bridges a saved v1 record with independent block hashes and changed config comments', () => {
    const f = fixture();
    const oldDigest = released205ContentDigest(f.root, f.manifest);
    withInstallationDatabase(f.root, db => {
      const ledger = (db.prepare('SELECT manifest_json FROM installation_ledgers WHERE checkout_id=?').get(f.checkoutId) as { manifest_json: string }).manifest_json;
      db.prepare('UPDATE installation_checkouts SET verification_json=? WHERE checkout_id=?').run(JSON.stringify({
        schemaVersion: 1, projectId: f.manifest.projectId,
        configDigest: sha(readFileSync(path.join(f.root, '.make-docs/config.yaml'), 'utf8')),
        ledgerDigest: sha(ledger), managedContentDigest: oldDigest,
      }), f.checkoutId);
    }, { storeRoot: f.store });
    const moved = move(f);
    writeFileSync(path.join(moved, 'AGENTS.md'), block('root rules\n', 'new user text\n'));
    const configPath = path.join(moved, '.make-docs/config.yaml');
    writeFileSync(configPath, `# new user comment\n${readFileSync(configPath, 'utf8')}`);
    expect(released205ContentDigest(moved, f.manifest)).not.toBe(oldDigest);
    reviewedMove(f, moved);
    expect(verification(f).evidence.schemaVersion).toBe(2);
  });

  it('refuses an invalid declarative project identity', () => {
    const f = fixture();
    const moved = move(f);
    writeFileSync(path.join(moved, '.make-docs/config.yaml'), 'projectId: []\n');
    expect(() => withInstallationOperation(moved, 'test.move', () => {}, { storeRoot: f.store })).toThrow(/invalid projectId/);
    expect(verification(f).rootPath).toBe(canonicalInstallationPath(f.root));
  });

  it.each(['missing block hash', 'wrong ledger digest', 'unknown evidence version'])('refuses %s during the v1 bridge', kind => {
    const f = fixture();
    withInstallationDatabase(f.root, db => {
      const ledger = (db.prepare('SELECT manifest_json FROM installation_ledgers WHERE checkout_id=?').get(f.checkoutId) as { manifest_json: string }).manifest_json;
      if (kind === 'missing block hash') {
        const manifest = JSON.parse(ledger);
        manifest.files['AGENTS.md'].hash = '';
        db.prepare('UPDATE installation_ledgers SET manifest_json=? WHERE checkout_id=?').run(JSON.stringify(manifest), f.checkoutId);
      }
      const currentLedger = (db.prepare('SELECT manifest_json FROM installation_ledgers WHERE checkout_id=?').get(f.checkoutId) as { manifest_json: string }).manifest_json;
      db.prepare('UPDATE installation_checkouts SET verification_json=? WHERE checkout_id=?').run(JSON.stringify({
        schemaVersion: kind === 'unknown evidence version' ? 99 : 1,
        projectId: f.manifest.projectId, configDigest: sha('config'),
        ledgerDigest: kind === 'wrong ledger digest' ? sha('wrong') : sha(currentLedger),
        managedContentDigest: sha('aggregate'),
      }), f.checkoutId);
    }, { storeRoot: f.store });
    const moved = move(f);
    expect(() => withInstallationOperation(moved, 'test.move', () => {}, { storeRoot: f.store })).toThrow();
    expect(verification(f).rootPath).toBe(canonicalInstallationPath(f.root));
  });

  it.skipIf(!process.env.MAKE_DOCS_RELEASED_205_BINARY)('released 2.0.5 refuses a further relocation after v2 evidence', () => {
    const f = fixture();
    const moved = move(f);
    reviewedMove(f, moved);
    const again = path.join(f.parent, 'moved-again');
    renameSync(moved, again);
    const before = savedRows(f);
    const old = spawnSync(process.env.MAKE_DOCS_RELEASED_205_BINARY!, ['project', 'surface', 'ensure', 'artifacts'], {
      encoding: 'utf8', cwd: again, env: { ...process.env, MAKE_DOCS_HOME: f.store },
    });
    expect(old.status, `${old.stdout}\n${old.stderr}`).not.toBe(0);
    expect(`${old.stdout}\n${old.stderr}`).toMatch(/does not have verified installation evidence in the Store/i);
    expect(savedRows(f)).toEqual(before);
    expect(readFileSync(path.join(again, 'AGENTS.md'), 'utf8')).toBe(block('root rules\n', 'user root\n', '\nroot tail'));
  });
});

describe('W22 R1 P2 reviewed checkout move', () => {
  it('declares exact Store and project access for both actions', () => {
    const operations = new Map(listOperations().map(item => [item.id, item]));
    expect(operations.get('project.checkout-move.preview')?.access).toEqual({store: 'read', project: 'read', hostConfig: 'none'});
    expect(operations.get('project.checkout-move.apply')?.access).toEqual({store: 'write', project: 'read', hostConfig: 'none'});
    expect(operations.get('project.checkout-register.apply')?.access).toEqual({store: 'write', project: 'write', hostConfig: 'none'});
    const applyTool = MAKE_DOCS_MCP_TOOLS.find(item => item.name === 'checkout_move_apply');
    expect(applyTool?.inputSchema).toHaveProperty('allowWrite');
  });

  it('requires the MCP write flag before checkout move apply', async () => {
    const f = fixture();
    const moved = move(f);
    const candidate = previewInstallationCheckoutMove(moved, f.checkoutId, f.store).candidates[0];
    const prior = process.env.MAKE_DOCS_HOME;
    process.env.MAKE_DOCS_HOME = f.store;
    try {
      await expect(callMakeDocsMcpTool('checkout_move_apply', {targetRoot: moved, sourceCheckoutId: f.checkoutId, sourceRoot: f.root, reviewDigest: candidate.reviewDigest})).rejects.toThrow(/requires write permission/i);
    } finally {
      if (prior === undefined) delete process.env.MAKE_DOCS_HOME;
      else process.env.MAKE_DOCS_HOME = prior;
    }
  });

  it('uses the same reviewed source through MCP preview and apply', async () => {
    const f = fixture();
    const moved = move(f);
    const prior = process.env.MAKE_DOCS_HOME;
    const priorId = process.env[MCP_CONNECTION_ID_ENV];
    const priorKey = process.env[MCP_CONNECTION_KEY_ENV];
    const executable = path.resolve(import.meta.dirname, '../dist/index.js');
    const generic = prepareGenericMcpSetup({
      clientLabel: 'w22-r1-move', storeRoot: f.store,
      executable: verifyMakeDocsExecutable({executablePath: executable}),
    });
    const connection = (generic.configuration as {mcpServers: {'make-docs': {env: Record<string, string>}}}).mcpServers['make-docs'].env;
    applyGenericMcpSetup(generic);
    writeFileSync(path.join(moved, '.make-docs/config.yaml'), JSON.stringify({
      projectId: f.manifest.projectId,
      harnessIntegrations: [{harness: 'generic-mcp-w22-r1-move', mode: 'narrow', method: 'mcp',
        accessCeiling: {store: 'write', project: 'read', hostConfig: 'none'}}],
    }));
    process.env.MAKE_DOCS_HOME = f.store;
    process.env[MCP_CONNECTION_ID_ENV] = connection.MAKE_DOCS_MCP_CONNECTION_ID;
    process.env[MCP_CONNECTION_KEY_ENV] = connection.MAKE_DOCS_MCP_CONNECTION_KEY;
    try {
      const preview = (await callMakeDocsMcpTool('checkout_move_preview', {targetRoot: moved}, {profile: 'setup'})).result as ReturnType<typeof previewInstallationCheckoutMove>;
      const selected = preview.candidates[0];
      expect(selected.checkoutId).toBe(f.checkoutId);
      expect(selected.available).toBe(true);
      const applied = (await callMakeDocsMcpTool('checkout_move_apply', {
        targetRoot: moved, sourceCheckoutId: f.checkoutId, sourceRoot: f.root,
        reviewDigest: selected.reviewDigest, allowWrite: true,
      }, {profile: 'setup'})).result as {status: string; checkoutId: string};
      expect(applied.status).toBe('completed');
      expect(applied.checkoutId).toBe(f.checkoutId);
      expect(getInstallationCheckoutId(moved, f.store)).toBe(f.checkoutId);
    } finally {
      if (prior === undefined) delete process.env.MAKE_DOCS_HOME;
      else process.env.MAKE_DOCS_HOME = prior;
      if (priorId === undefined) delete process.env[MCP_CONNECTION_ID_ENV];
      else process.env[MCP_CONNECTION_ID_ENV] = priorId;
      if (priorKey === undefined) delete process.env[MCP_CONNECTION_KEY_ENV];
      else process.env[MCP_CONNECTION_KEY_ENV] = priorKey;
    }
  });

  it('keeps status and bare setup inspection read only at the moved path', async () => {
    const f = fixture();
    const moved = move(f);
    const before = savedRows(f);
    expect(readInstallationStatus(moved, f.store).status).toBe('ownership-unverified');
    const writes: string[] = [];
    const output = vi.spyOn(process.stdout, 'write').mockImplementation((chunk: any) => { writes.push(String(chunk)); return true; });
    const priorCwd = process.cwd();
    try { process.chdir(moved); await runCli([]); } finally { process.chdir(priorCwd); output.mockRestore(); }
    expect(savedRows(f)).toEqual(before);
  });

  it('keeps setup --yes and dry run read only until a path choice is made', async () => {
    const f = fixture();
    const moved = move(f);
    const before = savedRows(f);
    const prior = process.env.MAKE_DOCS_HOME;
    const writes: string[] = [];
    const output = vi.spyOn(process.stdout, 'write').mockImplementation((chunk: any) => { writes.push(String(chunk)); return true; });
    process.env.MAKE_DOCS_HOME = f.store;
    try {
      await runCli(['setup', '--target', moved, '--yes', '--json']);
      const first = JSON.parse(writes.at(-1)!);
      expect(first.status).toBe('blocked');
      expect(first.checkoutMove.candidates).toHaveLength(1);
      expect(savedRows(f)).toEqual(before);
      await runCli(['setup', '--target', moved, '--yes', '--dry-run', '--json']);
      expect(JSON.parse(writes.at(-1)!).checkoutMove.candidates).toHaveLength(1);
      expect(savedRows(f)).toEqual(before);
    } finally {
      output.mockRestore();
      if (prior === undefined) delete process.env.MAKE_DOCS_HOME;
      else process.env.MAKE_DOCS_HOME = prior;
    }
  });

  it('uses the same core review and apply through the CLI route', async () => {
    const f = fixture();
    const moved = move(f);
    const prior = process.env.MAKE_DOCS_HOME;
    const writes: string[] = [];
    const output = vi.spyOn(process.stdout, 'write').mockImplementation((chunk: any) => { writes.push(String(chunk)); return true; });
    process.env.MAKE_DOCS_HOME = f.store;
    try {
      await runCli(['project', 'checkout-move', 'preview', '--target-root', moved, '--json']);
      const preview = JSON.parse(writes.at(-1)!);
      const selected = preview.candidates[0];
      await runCli(['project', 'checkout-move', 'apply', '--target-root', moved, '--source-checkout', f.checkoutId, '--source-root', f.root, '--review', selected.reviewDigest, '--json']);
      expect(JSON.parse(writes.at(-1)!)).toMatchObject({status: 'completed', effect: 'checkout-binding-moved', projectFilesChanged: false, nextAction: expect.any(String)});
      await runCli(['project', 'checkout-move', 'apply', '--target-root', moved, '--source-checkout', f.checkoutId, '--source-root', f.root, '--review', selected.reviewDigest]);
      expect(writes.at(-1)).toContain('Checkout move: already-completed');
      expect(writes.at(-1)).toContain(`Source: ${canonicalInstallationPath(f.root)}`);
      expect(writes.at(-1)).toContain(`Checkout ID: ${f.checkoutId}`);
      expect(writes.at(-1)).toContain('Project files: unchanged');
      expect(writes.at(-1)).toContain('Next: Continue setup');
      expect(getInstallationCheckoutId(moved, f.store)).toBe(f.checkoutId);
    } finally {
      output.mockRestore();
      if (prior === undefined) delete process.env.MAKE_DOCS_HOME;
      else process.env.MAKE_DOCS_HOME = prior;
    }
  });

  it('keeps preview read only and applies only the reviewed binding', () => {
    const f = fixture();
    const moved = move(f);
    const before = savedRows(f);
    const preview = previewInstallationCheckoutMove(moved, undefined, f.store);
    expect(preview.status).toBe('ready');
    expect(savedRows(f)).toEqual(before);
    expect(() => getInstallationCheckoutId(moved, f.store)).toThrow(/checkout move/i);
    expect(savedRows(f)).toEqual(before);
    const selected = preview.candidates[0];
    const result = applyInstallationCheckoutMove(moved, selected.checkoutId, selected.sourceRoot, selected.reviewDigest!, f.store);
    expect(result.status).toBe('completed');
    const receiptCount = withInstallationDatabase(moved, db => (db.prepare("SELECT COUNT(*) AS count FROM installation_migration_records WHERE checkout_id=? AND record_id LIKE 'checkout-move:%'").get(f.checkoutId) as {count: number}).count, {storeRoot: f.store, readOnly: true});
    expect(applyInstallationCheckoutMove(moved, selected.checkoutId, selected.sourceRoot, selected.reviewDigest!, f.store).status).toBe('already-completed');
    expect(withInstallationDatabase(moved, db => (db.prepare("SELECT COUNT(*) AS count FROM installation_migration_records WHERE checkout_id=? AND record_id LIKE 'checkout-move:%'").get(f.checkoutId) as {count: number}).count, {storeRoot: f.store, readOnly: true})).toBe(receiptCount);
    expect(getInstallationCheckoutId(moved, f.store)).toBe(f.checkoutId);
    expect(savedRows(f).ledger).toEqual(before.ledger);
    expect(savedRows(f).operations).toEqual(before.operations);
    expect(savedRows(f).steps).toEqual(before.steps);
  });

  it('rejects stale review, recreated source, and another source path', () => {
    const f = fixture();
    const moved = move(f);
    const selected = previewInstallationCheckoutMove(moved, f.checkoutId, f.store).candidates[0];
    const before = savedRows(f);
    expect(() => applyInstallationCheckoutMove(moved, f.checkoutId, path.join(f.parent, 'wrong'), selected.reviewDigest!, f.store)).toThrow(/stale/i);
    expect(() => applyInstallationCheckoutMove(moved, f.checkoutId, f.root, '0'.repeat(64), f.store)).toThrow(/stale/i);
    mkdirSync(f.root);
    expect(() => applyInstallationCheckoutMove(moved, f.checkoutId, f.root, selected.reviewDigest!, f.store)).toThrow(/stale/i);
    expect(savedRows(f)).toEqual(before);
  });

  it.each(['config comment', 'outside block', 'managed block', 'owned file'])('rejects a reviewed %s change before apply', kind => {
    const f = fixture();
    const moved = move(f);
    const selected = previewInstallationCheckoutMove(moved, f.checkoutId, f.store).candidates[0];
    const before = savedRows(f);
    if (kind === 'config comment') {
      const config = path.join(moved, '.make-docs/config.yaml');
      writeFileSync(config, `# changed after review\n${readFileSync(config, 'utf8')}`);
    } else if (kind === 'outside block') {
      writeFileSync(path.join(moved, 'AGENTS.md'), block('root rules\n', 'changed after review\n'));
    } else if (kind === 'managed block') {
      writeFileSync(path.join(moved, 'AGENTS.md'), block('changed rules\n'));
    } else {
      writeFileSync(path.join(moved, 'owned.md'), 'changed after review');
    }
    expect(() => applyInstallationCheckoutMove(moved, f.checkoutId, f.root, selected.reviewDigest!, f.store)).toThrow(/stale|ownership|block|hash/i);
    expect(savedRows(f)).toEqual(before);
  });

  it('keeps a live source checkout bound and refuses to adopt a copy', () => {
    const f = fixture();
    const copied = path.join(f.parent, 'copy');
    cpSync(f.root, copied, {recursive: true});
    const before = savedRows(f);
    const preview = previewInstallationCheckoutMove(copied, f.checkoutId, f.store);
    expect(preview.candidates[0].available).toBe(false);
    expect(preview.candidates[0].blockers.join(' ')).toMatch(/source|exists|live/i);
    expect(savedRows(f)).toEqual(before);
  });

  it('blocks pending work and active or dead writer locks', () => {
    const f = fixture();
    const moved = move(f);
    const initial = previewInstallationCheckoutMove(moved, f.checkoutId, f.store).candidates[0];
    withInstallationDatabase(moved, db => db.prepare("INSERT INTO installation_operations (operation_id,checkout_id,operation,status,before_ledger,after_ledger,created_at,finished_at) VALUES (? ,?,'test.pending','pending',NULL,NULL,?,NULL)").run('pending-test', f.checkoutId, new Date().toISOString()), {storeRoot: f.store});
    expect(previewInstallationCheckoutMove(moved, f.checkoutId, f.store).candidates[0].blockers.join(' ')).toMatch(/pending work/i);
    expect(() => applyInstallationCheckoutMove(moved, f.checkoutId, f.root, initial.reviewDigest!, f.store)).toThrow(/stale/i);
    withInstallationDatabase(moved, db => {
      db.prepare("DELETE FROM installation_operations WHERE operation_id='pending-test'").run();
      db.prepare('INSERT INTO installation_locks VALUES (?,?,?,?,?)').run(canonicalInstallationPath(f.root), 'test-lock', process.pid, os.hostname(), new Date().toISOString());
    }, {storeRoot: f.store});
    expect(previewInstallationCheckoutMove(moved, f.checkoutId, f.store).candidates[0].blockers.join(' ')).toMatch(/writer is active/i);
    withInstallationDatabase(moved, db => db.prepare('UPDATE installation_locks SET pid=? WHERE root_path=?').run(2147483647, canonicalInstallationPath(f.root)), {storeRoot: f.store});
    expect(previewInstallationCheckoutMove(moved, f.checkoutId, f.store).candidates[0].blockers.join(' ')).toMatch(/dead writer lock/i);
  });

  it('requires a valid config ID and blocks a target claim from another project', () => {
    const f = fixture();
    const moved = move(f);
    const before = savedRows(f);
    const configPath = path.join(moved, '.make-docs/config.yaml');
    const original = readFileSync(configPath, 'utf8');
    writeFileSync(configPath, 'name: no-id\n');
    expect(previewInstallationCheckoutMove(moved, undefined, f.store).status).toBe('none');
    writeFileSync(configPath, 'projectId: []\n');
    expect(() => previewInstallationCheckoutMove(moved, undefined, f.store)).toThrow(/invalid projectId/i);
    writeFileSync(configPath, 'name: same-project\nprojectId: another-project-id\n');
    expect(previewInstallationCheckoutMove(moved, undefined, f.store)).toMatchObject({status: 'blocked', candidates: []});
    writeFileSync(configPath, original);
    withInstallationDatabase(moved, db => db.prepare('INSERT INTO installation_checkouts (checkout_id,project_id,root_path,created_at,root_path_key,verified_at,verification_json) VALUES (?,?,?,?,?,?,?)')
      .run('other-checkout', 'other-project', canonicalInstallationPath(moved), new Date().toISOString(), canonicalInstallationPath(moved), null, null), {storeRoot: f.store});
    const preview = previewInstallationCheckoutMove(moved, f.checkoutId, f.store);
    expect(preview.status).toBe('blocked');
    expect(preview.candidates[0].blockers.join(' ')).toMatch(/claims the target/i);
    expect(savedRows(f)).toEqual(before);
  });

  it('lets a reviewed skip finish but does not turn changed owned content into move proof', () => {
    const f = fixture();
    writeFileSync(path.join(f.root, 'owned.md'), 'user changed owned text');
    withInstallationOperation(f.root, 'test.skip', () => {}, {storeRoot: f.store});
    const moved = move(f);
    const preview = previewInstallationCheckoutMove(moved, f.checkoutId, f.store);
    expect(preview.candidates[0].available).toBe(false);
    expect(preview.candidates[0].blockers.join(' ')).toMatch(/managed-snapshot hash|ownership/i);
  });

  it('treats a root project and a nested kit as separate checkouts', () => {
    const f = fixture();
    const kit = path.join(f.root, 'kits', 'api');
    mkdirSync(path.join(kit, '.make-docs'), {recursive: true});
    for (const relative of ['AGENTS.md', 'CLAUDE.md', 'owned.md']) writeFileSync(path.join(kit, relative), readFileSync(path.join(f.root, relative)));
    const kitConfig = path.join(kit, '.make-docs/config.yaml');
    writeFileSync(kitConfig, 'projectId: kit-project-id\n');
    withInstallationOperation(kit, 'test.kit', () => {}, {storeRoot: f.store});
    const kitId = getInstallationCheckoutId(kit, f.store);
    withInstallationOperation(kit, 'test.kit-ledger', () => saveInstallationManifest(kit, {...f.manifest, projectId: 'kit-project-id'}), {storeRoot: f.store, projectId: 'kit-project-id'});
    const movedKit = path.join(f.root, 'kits', 'moved-api');
    renameSync(kit, movedKit);
    const beforeRoot = savedRows(f);
    const preview = previewInstallationCheckoutMove(movedKit, kitId, f.store);
    expect(preview.candidates).toHaveLength(1);
    expect(preview.candidates[0].checkoutId).toBe(kitId);
    expect(preview.candidates[0].available).toBe(true);
    applyInstallationCheckoutMove(movedKit, kitId, kit, preview.candidates[0].reviewDigest!, f.store);
    expect(getInstallationCheckoutId(movedKit, f.store)).toBe(kitId);
    expect(savedRows(f)).toEqual(beforeRoot);
  });

  it('rolls back the path and receipt when the Store receipt fails', () => {
    const f = fixture();
    const moved = move(f);
    const selected = previewInstallationCheckoutMove(moved, f.checkoutId, f.store).candidates[0];
    const before = savedRows(f);
    withInstallationDatabase(moved, db => db.exec("CREATE TRIGGER fail_move_receipt BEFORE INSERT ON installation_migration_records WHEN NEW.record_id LIKE 'checkout-move:%' BEGIN SELECT RAISE(ABORT,'receipt failure'); END"), {storeRoot: f.store});
    expect(() => applyInstallationCheckoutMove(moved, f.checkoutId, f.root, selected.reviewDigest!, f.store)).toThrow(/receipt failure/i);
    expect(savedRows(f)).toEqual(before);
  });

  it('registers a separate checkout ID while keeping the original ledger and pending work', () => {
    const f = fixture();
    const separate = path.join(f.parent, 'separate');
    cpSync(f.root, separate, {recursive: true});
    const before = savedRows(f);
    const preview = previewInstallationCheckoutMove(separate, undefined, f.store);
    expect(preview.candidates[0].available).toBe(false);
    expect(preview.separateReviewDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(savedRows(f)).toEqual(before);
    const result = registerSeparateInstallationCheckout(separate, preview.separateReviewDigest!, f.store);
    expect(result.checkoutId).not.toBe(f.checkoutId);
    expect(result.projectId).toBe(f.manifest.projectId);
    expect(savedRows(f)).toEqual(before);
    expect(getInstallationCheckoutId(separate, f.store)).toBe(result.checkoutId);
  });

  it('routes separate checkout preview and apply through the CLI registry', async () => {
    const f = fixture();
    const separate = path.join(f.parent, 'separate-cli');
    cpSync(f.root, separate, {recursive: true});
    const prior = process.env.MAKE_DOCS_HOME;
    const writes: string[] = [];
    const output = vi.spyOn(process.stdout, 'write').mockImplementation((chunk: any) => { writes.push(String(chunk)); return true; });
    process.env.MAKE_DOCS_HOME = f.store;
    try {
      await runCli(['project', 'checkout-register', 'preview', '--target-root', separate, '--json']);
      const preview = JSON.parse(writes.at(-1)!);
      expect(preview.separateReviewDigest).toMatch(/^[a-f0-9]{64}$/);
      await runCli(['project', 'checkout-register', 'apply', '--target-root', separate, '--review', preview.separateReviewDigest, '--json']);
      const result = JSON.parse(writes.at(-1)!);
      expect(result.checkoutId).not.toBe(f.checkoutId);
      expect(result).toMatchObject({effect: 'new-checkout-binding', projectFilesChanged: false, nextAction: expect.any(String)});
      expect(getInstallationCheckoutId(separate, f.store)).toBe(result.checkoutId);
    } finally {
      output.mockRestore();
      if (prior === undefined) delete process.env.MAKE_DOCS_HOME;
      else process.env.MAKE_DOCS_HOME = prior;
    }
  });

  it('requires source selection when two absent checkouts share one project ID', () => {
    const f = fixture();
    const separate = path.join(f.parent, 'separate');
    cpSync(f.root, separate, {recursive: true});
    const preview = previewInstallationCheckoutMove(separate, undefined, f.store);
    registerSeparateInstallationCheckout(separate, preview.separateReviewDigest!, f.store);
    withInstallationOperation(separate, 'test.ledger', () => saveInstallationManifest(separate, f.manifest), {storeRoot: f.store, projectId: f.manifest.projectId});
    const destination = path.join(f.parent, 'destination');
    renameSync(separate, destination);
    rmSync(f.root, {recursive: true});
    const review = previewInstallationCheckoutMove(destination, undefined, f.store);
    expect(review.status).toBe('blocked');
    expect(review.candidates).toHaveLength(2);
    expect(review.nextAction).toMatch(/select one source/i);
  });
});
