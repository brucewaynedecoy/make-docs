import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../src/cli';
import { renderManagedBlock } from '../src/managed-block';
import { defaultSelections, resolveInstallProfile } from '../src/profile';
import { createEmptySystemAssetManifestState } from '../src/system-assets';
import { STORE_MIGRATIONS, classifyStoreCheckpoint9State, inspectStoreWriteGuard, openStoreSqliteConnection, storeWriteGuardTriggerName } from '../src/store/database';
import {
  applyInstallationCheckoutMove, canonicalInstallationPath, getInstallationCheckoutId, previewInstallationCheckoutMove, registerSeparateInstallationCheckout,
  saveInstallationManifest, withInstallationDatabase, withInstallationOperation, withReviewedStoreCompatibilityBridge,
} from '../src/store/installation-state';
import type { InstallManifest } from '../src/types';

/*
 * W32 R0 P2 follow-up. Schema v7 made checkout move review refuse every Store that was
 * not v7, so a Store that Make Docs 2.0.5 to 2.0.9 left (schema 6) no longer showed a
 * moved checkout. Review must read a schema 6 Store as it is, and apply must change it
 * as it is, because apply never migrates the Store (PRD 38 R-CHECKOUT-8). A v7 Store
 * keeps its write guard check.
 */

const sha = (text: string | Buffer) => createHash('sha256').update(text).digest('hex');
const block = (body: string, prefix = '', suffix = '') => `${prefix}${renderManagedBlock(body)}${suffix}`;
const fixtures: string[] = [];
const INSTALLATION_TABLES = ['installation_checkouts', 'installation_ledgers', 'installation_operations', 'installation_steps', 'installation_migration_records'] as const;

afterEach(() => {
  vi.restoreAllMocks();
  fixtures.splice(0).forEach(root => rmSync(root, { recursive: true, force: true }));
});

/** A managed checkout with two managed blocks and one owned file, saved in a v7 Store by the current code. */
function fixture() {
  const parent = mkdtempSync(path.join(os.tmpdir(), 'make-docs-w32-old-move-'));
  fixtures.push(parent);
  const root = path.join(parent, 'project');
  const store = path.join(parent, 'store');
  mkdirSync(root);
  const profile = resolveInstallProfile(defaultSelections());
  const manifest: InstallManifest = {
    schemaVersion: 2, packageName: '@brucewaynedecoy/make-docs', packageVersion: '2.0.5',
    updatedAt: '2026-10-31T00:00:00.000Z', profileId: profile.profileId,
    selections: profile.selections, effectiveCapabilities: profile.effectiveCapabilities,
    systemAssetMaterialization: createEmptySystemAssetManifestState(), skillFiles: [],
    files: {
      'AGENTS.md': { hash: sha('root rules\n'), sourceId: 'router:codex:AGENTS.md', ownershipClass: 'managed-block' },
      'CLAUDE.md': { hash: sha('claude rules\n'), sourceId: 'router:claude-code:CLAUDE.md', ownershipClass: 'managed-block' },
      'owned.md': { hash: sha('owned text'), sourceId: 'provider:owned.md', ownershipClass: 'managed-snapshot' },
    },
  };
  writeFileSync(path.join(root, 'AGENTS.md'), block('root rules\n', 'user root\n', '\nroot tail'));
  writeFileSync(path.join(root, 'CLAUDE.md'), block('claude rules\n', 'user claude\n', '\nclaude tail'));
  writeFileSync(path.join(root, 'owned.md'), 'owned text');
  withInstallationOperation(root, 'test.seed', () => {}, { storeRoot: store });
  const projectId = withInstallationDatabase(root, db => (db.prepare('SELECT project_id FROM installation_checkouts').get() as { project_id: string }).project_id, { storeRoot: store, readOnly: true });
  manifest.projectId = projectId;
  withInstallationOperation(root, 'test.ledger', () => saveInstallationManifest(root, manifest), { storeRoot: store, projectId });
  const checkoutId = getInstallationCheckoutId(root, store);
  return { parent, root, store, checkoutId, projectId };
}

/**
 * Replace the fixture Store with a schema `version` Store, as an older Make Docs left it:
 * the older migrations on a raw connection, no write guard, and the installation rows
 * copied with the columns that the older schema has.
 */
function downgradeStore(store: string, version: number): void {
  const older = `${store}-v${version}`;
  mkdirSync(older);
  const target = new DatabaseSync(path.join(older, 'store.db'));
  const source = new DatabaseSync(path.join(store, 'store.db'), { readOnly: true });
  try {
    target.exec('PRAGMA foreign_keys=ON');
    for (const migration of STORE_MIGRATIONS.filter(candidate => candidate.version <= version)) {
      for (const statement of migration.statements) target.exec(statement);
      target.exec(`PRAGMA user_version=${migration.version}`);
    }
    for (const table of INSTALLATION_TABLES) {
      const columns = (target.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map(column => column.name);
      const insert = target.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`);
      for (const row of source.prepare(`SELECT ${columns.join(',')} FROM ${table} ORDER BY rowid`).all() as Record<string, string | number | null>[])
        insert.run(...columns.map(column => row[column]));
    }
  } finally {
    source.close();
    target.close();
  }
  rmSync(store, { recursive: true, force: true });
  renameSync(older, store);
}

function userVersion(store: string): number {
  const db = new DatabaseSync(path.join(store, 'store.db'), { readOnly: true });
  try { return Number((db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version); } finally { db.close(); }
}

/** Every durable installation row, the schema version, the Store file bytes, and the Store directory entries. */
function durable(store: string) {
  const file = path.join(store, 'store.db');
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    return {
      bytes: sha(readFileSync(file)),
      entries: readdirSync(store).sort(),
      userVersion: Number((db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version),
      rows: Object.fromEntries(INSTALLATION_TABLES.map(table => [table, db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()])),
    };
  } finally { db.close(); }
}

async function cliJson(store: string, argv: string[]): Promise<any> {
  const writes: string[] = [];
  const output = vi.spyOn(process.stdout, 'write').mockImplementation((chunk: any) => { writes.push(String(chunk)); return true; });
  const prior = process.env.MAKE_DOCS_HOME;
  process.env.MAKE_DOCS_HOME = store;
  try {
    await runCli(argv);
  } finally {
    output.mockRestore();
    if (prior === undefined) delete process.env.MAKE_DOCS_HOME;
    else process.env.MAKE_DOCS_HOME = prior;
  }
  return JSON.parse(writes.at(-1)!);
}

describe('W32 R0 P2 follow-up: checkout move with an older Store schema', () => {
  it('reviews a moved checkout in a schema 6 Store read only, through setup, the CLI, and the shared core', async () => {
    const f = fixture();
    downgradeStore(f.store, 6);
    const moved = path.join(f.parent, 'moved');
    renameSync(f.root, moved);
    const before = durable(f.store);
    expect(before.userVersion).toBe(6);

    const setup = await cliJson(f.store, ['setup', '--target', moved, '--yes', '--json']);
    expect(setup.status).toBe('blocked');
    expect(setup.checkoutMove).toMatchObject({ status: 'ready', projectId: f.projectId });
    expect(setup.checkoutMove.candidates).toEqual([expect.objectContaining({ checkoutId: f.checkoutId, available: true, blockers: [] })]);
    expect(durable(f.store)).toEqual(before);

    const preview = await cliJson(f.store, ['project', 'move', 'preview', '--target-root', moved, '--json']);
    expect(preview.status).toBe('ready');
    expect(preview.candidates[0]).toMatchObject({ checkoutId: f.checkoutId, available: true, reviewDigest: expect.stringMatching(/^[a-f0-9]{64}$/) });
    expect(previewInstallationCheckoutMove(moved, f.checkoutId, f.store).candidates[0].reviewDigest).toBe(preview.candidates[0].reviewDigest);
    expect(durable(f.store)).toEqual(before);
  });

  it('applies the reviewed move to a schema 6 Store without a schema change, and a later reviewed setup still converts it to v7', async () => {
    const f = fixture();
    downgradeStore(f.store, 6);
    const moved = path.join(f.parent, 'moved');
    renameSync(f.root, moved);
    const before = durable(f.store);
    const preview = previewInstallationCheckoutMove(moved, f.checkoutId, f.store);
    const result = await cliJson(f.store, ['project', 'move', 'apply', '--target-root', moved, '--source-checkout', f.checkoutId, '--source-root', preview.candidates[0].sourceRoot, '--review', preview.candidates[0].reviewDigest!, '--json']);
    expect(result).toMatchObject({ status: 'completed', checkoutId: f.checkoutId, effect: 'checkout-binding-moved', projectFilesChanged: false });

    // Only the selected path and its proof change, and one move receipt is added (R-CHECKOUT-1, R-CHECKOUT-10).
    const after = durable(f.store);
    expect(after.userVersion).toBe(6);
    expect(after.entries).toEqual(before.entries);
    expect(after.rows.installation_ledgers).toEqual(before.rows.installation_ledgers);
    expect(after.rows.installation_operations).toEqual(before.rows.installation_operations);
    expect(after.rows.installation_steps).toEqual(before.rows.installation_steps);
    expect(after.rows.installation_migration_records).toHaveLength(before.rows.installation_migration_records.length + 1);
    expect(after.rows.installation_checkouts).toEqual([expect.objectContaining({ checkout_id: f.checkoutId, project_id: f.projectId, root_path: canonicalInstallationPath(moved) })]);
    const retry = applyInstallationCheckoutMove(moved, f.checkoutId, preview.candidates[0].sourceRoot, preview.candidates[0].reviewDigest!, f.store);
    expect(retry.status).toBe('already-completed');
    expect(durable(f.store).rows).toEqual(after.rows);

    // A copy at another path registers as a separate checkout in the same schema 6 Store.
    const copy = path.join(f.parent, 'copy');
    cpSync(moved, copy, { recursive: true });
    const separate = previewInstallationCheckoutMove(copy, undefined, f.store);
    expect(separate.separateReviewDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(registerSeparateInstallationCheckout(copy, separate.separateReviewDigest!, f.store).status).toBe('registered');
    expect(userVersion(f.store)).toBe(6);

    // The reviewed setup bridge converts the Store to v7 with its write guard, and the moved binding stays.
    withReviewedStoreCompatibilityBridge(() => withInstallationDatabase(moved, () => undefined, { storeRoot: f.store }));
    expect(classifyStoreCheckpoint9State(f.store)).toMatchObject({ state: 'supported-current', schemaVersion: 7 });
    const db = openStoreSqliteConnection(path.join(f.store, 'store.db'), { readOnly: true });
    try {
      expect(inspectStoreWriteGuard(db)).toEqual([]);
      expect(db.prepare('SELECT root_path FROM installation_checkouts WHERE checkout_id=?').get(f.checkoutId)).toEqual({ root_path: canonicalInstallationPath(moved) });
    } finally { db.close(); }
    expect(getInstallationCheckoutId(moved, f.store)).toBe(f.checkoutId);
  });

  it('writes the project register with a v7 Store and keeps refusing a v7 Store whose write guard changed', () => {
    const f = fixture();
    const moved = path.join(f.parent, 'moved');
    renameSync(f.root, moved);
    const candidate = previewInstallationCheckoutMove(moved, f.checkoutId, f.store).candidates[0];
    expect(candidate.available).toBe(true);

    const raw = new DatabaseSync(path.join(f.store, 'store.db'));
    try { raw.exec(`DROP TRIGGER ${storeWriteGuardTriggerName('installation_checkouts', 'update')}`); } finally { raw.close(); }
    // A v7 Store runs in WAL mode, so a read can add `-wal` and `-shm` side files. Compare the rows and schema.
    const saved = () => { const { rows, userVersion } = durable(f.store); return { rows, userVersion }; };
    const before = saved();
    const blocked = previewInstallationCheckoutMove(moved, f.checkoutId, f.store);
    expect(blocked).toMatchObject({ status: 'blocked', candidates: [] });
    expect(blocked.nextAction).toMatch(/installation_checkouts has no BEFORE UPDATE guard trigger/);
    expect(() => applyInstallationCheckoutMove(moved, f.checkoutId, candidate.sourceRoot, candidate.reviewDigest!, f.store)).toThrow(/guard trigger.*No Store state changed/);
    expect(saved()).toEqual(before);
  });

  it.each([
    { marker: 'guard triggers', strip: [] as string[], message: /reports schema 6 but has write guard triggers/ },
    { marker: 'the project register table', strip: ['triggers'], message: /reports schema 6 but has the project_register table/ },
    { marker: 'a newer schema journal row', strip: ['triggers', 'project_register'], message: /reports schema 6 but its schema journal records schema 7/ },
  ])('refuses a v7 Store set back to schema 6 when it still has $marker (R-WRITE-GUARD-4)', ({ strip, message }) => {
    const f = fixture();
    const moved = path.join(f.parent, 'moved');
    renameSync(f.root, moved);
    const candidate = previewInstallationCheckoutMove(moved, f.checkoutId, f.store).candidates[0];
    expect(candidate.available).toBe(true);

    // Set the version back outside Make Docs: drop every guard trigger, so the v7 guard check cannot see them, and report schema 6.
    const raw = new DatabaseSync(path.join(f.store, 'store.db'));
    try {
      if (strip.includes('triggers')) {
        for (const { name } of raw.prepare("SELECT name FROM sqlite_schema WHERE type = 'trigger'").all() as { name: string }[]) raw.exec(`DROP TRIGGER "${name}"`);
      } else {
        raw.exec(`DROP TRIGGER ${storeWriteGuardTriggerName('installation_checkouts', 'update')}`);
      }
      if (strip.includes('project_register')) raw.exec('DROP TABLE project_register');
      raw.exec('PRAGMA user_version=6');
    } finally { raw.close(); }
    const saved = () => { const { rows, userVersion } = durable(f.store); return { rows, userVersion }; };
    const before = saved();
    expect(classifyStoreCheckpoint9State(f.store)).toMatchObject({ state: 'unknown', schemaVersion: 6, issue: { code: 'changed-outside' } });
    const blocked = previewInstallationCheckoutMove(moved, f.checkoutId, f.store);
    expect(blocked).toMatchObject({ status: 'blocked', candidates: [] });
    expect(blocked.nextAction).toMatch(message);
    expect(() => applyInstallationCheckoutMove(moved, f.checkoutId, candidate.sourceRoot, candidate.reviewDigest!, f.store)).toThrow(/reports schema 6/);
    expect(saved()).toEqual(before);
  });

  it('applies a move to an intact v7 Store and records the project in the project register', () => {
    const f = fixture();
    const moved = path.join(f.parent, 'moved');
    renameSync(f.root, moved);
    const candidate = previewInstallationCheckoutMove(moved, f.checkoutId, f.store).candidates[0];
    expect(applyInstallationCheckoutMove(moved, f.checkoutId, candidate.sourceRoot, candidate.reviewDigest!, f.store).status).toBe('completed');
    const db = new DatabaseSync(path.join(f.store, 'store.db'), { readOnly: true });
    try {
      expect(db.prepare('SELECT project_id FROM project_register WHERE project_id=?').get(f.projectId)).toEqual({ project_id: f.projectId });
    } finally { db.close(); }
  });

  it('keeps a schema 5 Store blocked with a setup next action and changes nothing', () => {
    const f = fixture();
    downgradeStore(f.store, 5);
    const moved = path.join(f.parent, 'moved');
    renameSync(f.root, moved);
    const before = durable(f.store);
    const preview = previewInstallationCheckoutMove(moved, f.checkoutId, f.store);
    expect(preview).toMatchObject({ status: 'blocked', candidates: [] });
    expect(preview.nextAction).toMatch(/schema 5\. Run make-docs setup/);
    expect(() => applyInstallationCheckoutMove(moved, f.checkoutId, path.join(f.parent, 'project'), '0'.repeat(64), f.store)).toThrow(/schema 5.*No Store state changed/);
    expect(durable(f.store)).toEqual(before);
  });
});
