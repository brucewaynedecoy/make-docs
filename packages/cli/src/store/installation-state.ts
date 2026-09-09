import { createHash, randomUUID } from 'node:crypto';
import { existsSync, lstatSync, realpathSync, mkdirSync, readFileSync, writeFileSync, openSync, closeSync, fsyncSync, unlinkSync, readdirSync, rmdirSync, symlinkSync, readlinkSync, chmodSync, statSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parseDocument } from 'yaml';
import { recoverDeadStoreLeases } from './lease-recovery';
import { acquireGlobalAssetLock, assertGlobalAssetLockActive, releaseGlobalAssetLock, type GlobalAssetLock } from './global-asset-lock';
import { acquireStoreAccess, applyStoreMigrations, classifyStoreCheckpoint9State, CURRENT_STORE_SCHEMA_VERSION, loadSqliteDriver, type StoreDatabase } from './database';
import { resolveStoreRoot, getStoreDatabasePath } from './paths';
import { validateAndMigrateManifest } from '../manifest';
import type { InstallManifest } from '../types';
export class InstallationStateError extends Error {
    constructor(readonly code: 'store-unavailable' | 'writer-active' | 'ownership-unverified' | 'recovery-required' | 'snapshot-drift', message: string) { super(message); this.name = 'InstallationStateError'; }
}
export interface InstallationLock {
    projectRoot: string;
    storeRoot: string;
    token: string;
    lockPath: string;
}
interface HeldLock extends InstallationLock {
    depth: number;
    releaseAccess: () => void;
    globalLock?: GlobalAssetLock;
}
interface Checkout {
    checkout_id: string;
    project_id: string;
    root_path: string;
    root_device: string;
    root_inode: string;
}
interface Operation {
    operation_id: string;
    checkout_id: string;
    operation: string;
    status: string;
    before_ledger: string | null;
    after_ledger: string | null;
    plan_complete: number;
}
interface FileState {
    kind: 'missing' | 'file' | 'directory' | 'symlink';
    digest?: string;
    payload?: string;
    mode?: number;
    target?: string;
}
interface Step {
    ordinal: number;
    relative_path: string;
    before_json: string;
    after_json: string;
    applied: number;
}
export type PlannedFileState = {
    kind: 'missing';
} | {
    kind: 'directory';
} | {
    kind: 'file';
    content: string | Uint8Array;
    mode?: number;
} | {
    kind: 'symlink';
    target: string;
};
const held = new Map<string, HeldLock>();
const active = new Map<string, {
    id: string;
    storeRoot: string;
    projectId: string;
    depth: number;
}>();
const sha = (bytes: string | Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const now = () => new Date().toISOString();
function fail(code: ConstructorParameters<typeof InstallationStateError>[0], message: string): never { throw new InstallationStateError(code, message); }
/** Resolve absent leaves without trusting a symlink spelling of an external path. */
export function canonicalInstallationPath(input: string): string {
    if (process.platform !== 'win32' && (/^[A-Za-z]:/.test(input) || input.startsWith('\\\\')))
        fail('store-unavailable', 'A Windows drive or UNC path cannot identify a Store on this host.');
    let current = path.resolve(input);
    const leaves: string[] = [];
    while (!lstatSync(current, { throwIfNoEntry: false })) {
        const parent = path.dirname(current);
        if (parent === current)
            break;
        leaves.unshift(path.basename(current));
        current = parent;
    }
    try {
        return path.join(realpathSync(current), ...leaves);
    }
    catch {
        return fail('store-unavailable', `Unresolved symbolic link in path: ${current}`);
    }
}
function inside(root: string, candidate: string): boolean { const rel = path.relative(root, candidate); return rel === '' || (!rel.startsWith(`..${path.sep}`) && rel !== '..' && !path.isAbsolute(rel)); }
export function validateInstallationStoreRoot(projectRoot: string, storeRoot = resolveStoreRoot()): string {
    const project = canonicalInstallationPath(projectRoot);
    const store = canonicalInstallationPath(storeRoot);
    if (existsSync(path.join(store, 'removal.lock')) || existsSync(path.join(store, 'installation-lease-recovery.lock')))
        fail('writer-active', 'The Store has an exclusive removal lock.');
    if (inside(project, store))
        fail('store-unavailable', 'The Make Docs Store must be outside the project.');
    for (const suffix of ['store.db', 'store.db-wal', 'store.db-shm', 'installation-bootstrap.lock']) {
        const child = path.join(store, suffix);
        if (lstatSync(child, { throwIfNoEntry: false })?.isSymbolicLink())
            fail('store-unavailable', `Unsafe Store path: ${child}`);
        if (!inside(store, canonicalInstallationPath(child)))
            fail('store-unavailable', 'A derived Store path escapes the Store.');
    }
    return store;
}
function isDead(pid: number, host: string): boolean {
    if (host !== os.hostname() || !Number.isSafeInteger(pid) || pid <= 0)
        return false;
    try {
        process.kill(pid, 0);
        return false;
    }
    catch (e) {
        return (e as NodeJS.ErrnoException).code === 'ESRCH';
    }
}
function driver() { const result = loadSqliteDriver(); if (!result.available)
    return fail('store-unavailable', result.reason); return result.sqlite; }
function transaction<T>(db: StoreDatabase, fn: () => T): T { db.exec('BEGIN IMMEDIATE'); try {
    const result = fn();
    db.exec('COMMIT');
    return result;
}
catch (e) {
    try {
        db.exec('ROLLBACK');
    }
    catch { }
    throw e;
} }
function prepareStore(projectRoot: string, storeRoot: string): void {
    validateInstallationStoreRoot(projectRoot, storeRoot);
    mkdirSync(storeRoot, { recursive: true, mode: 0o700 });
    if (['installation-bootstrap.lock','store-access.lock'].some(name=>lstatSync(path.join(storeRoot,name),{throwIfNoEntry:false}))) recoverDeadStoreLeases(storeRoot);
    const lockPath = path.join(storeRoot, 'installation-bootstrap.lock');
    const token = randomUUID();
    let fd: number;
    try {
        fd = openSync(lockPath, 'wx', 0o600);
    }
    catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'EEXIST') {
            // Never steal the lock from a timeout or an unverified owner.
            return fail('writer-active', 'Store preparation is locked. Verify the prior writer has stopped before recovery.');
        }
        throw e;
    }
    try {
        writeFileSync(fd, JSON.stringify({ token, pid: process.pid, hostname: os.hostname() }));
        fsyncSync(fd);
        validateInstallationStoreRoot(projectRoot, storeRoot);
        const c = classifyStoreCheckpoint9State(storeRoot);
        if (!['absent', 'supported-current', 'supported-legacy'].includes(c.state))
            fail('store-unavailable', `Store is ${c.state}; preserve it and repair it before managed changes.`);
        const release = acquireStoreAccess(storeRoot, true);
        const db = new (driver().DatabaseSync)(getStoreDatabasePath(storeRoot));
        try {
            db.exec('PRAGMA busy_timeout=5000; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON');
            // Check prior registered locations before any schema or project change.
            if (c.state !== 'absent') {
                const tables = db.prepare("SELECT name FROM sqlite_schema WHERE type='table'").all() as {
                    name: string;
                }[];
                for (const table of ['projects', 'installation_checkouts'])
                    if (tables.some(t => t.name === table)) {
                        const rows = db.prepare(`SELECT root_path FROM ${table} WHERE root_path IS NOT NULL`).all() as {
                            root_path: string;
                        }[];
                        if (rows.some(r => inside(canonicalInstallationPath(r.root_path), storeRoot)))
                            fail('store-unavailable', 'Store path is inside a registered checkout.');
                    }
            }
            // Preparation is distinct from project migration checkpoint receipts.
            applyStoreMigrations(db, c.schemaVersion ?? 0);
            db.exec('PRAGMA journal_mode=WAL');
            const rows = db.prepare('SELECT root_path FROM installation_checkouts').all() as {
                root_path: string;
            }[];
            if (rows.some(r => inside(canonicalInstallationPath(r.root_path), storeRoot)))
                fail('store-unavailable', 'Store path is inside a registered checkout.');
        }
        finally {
            db.close();
            release();
        }
    }
    finally {
        closeSync(fd);
        if (existsSync(lockPath)) {
            const value = JSON.parse(readFileSync(lockPath, 'utf8'));
            if (value.token === token)
                unlinkSync(lockPath);
        }
    }
}
export function withInstallationDatabase<T>(projectRoot: string, fn: (db: StoreDatabase) => T, options: {
    storeRoot?: string;
    readOnly?: boolean;
} = {}): T {
    const root = canonicalInstallationPath(projectRoot);
    const store = validateInstallationStoreRoot(root, options.storeRoot ?? active.get(root)?.storeRoot ?? held.get(root)?.storeRoot ?? resolveStoreRoot());
    if (!options.readOnly && !held.has(root))
        prepareStore(root, store);
    if (!existsSync(getStoreDatabasePath(store)))
        return fail('store-unavailable', 'The Store is absent.');
    const release = options.readOnly ? () => { } : acquireStoreAccess(store);
    let db: StoreDatabase;
    try {
        db = new (driver().DatabaseSync)(getStoreDatabasePath(store), { readOnly: options.readOnly ?? false });
    }
    catch (e) {
        release();
        throw e;
    }
    try {
        db.exec('PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON');
        if (!options.readOnly)
            db.exec('PRAGMA synchronous=FULL');
        return fn(db);
    }
    finally {
        db.close();
        release();
    }
}
export function readDeclarativeProjectId(projectRoot: string): string | null {
    const file = path.join(projectRoot, '.make-docs/config.yaml');
    if (!existsSync(file))
        return null;
    assertSafeFilePath(projectRoot, '.make-docs/config.yaml');
    const doc = parseDocument(readFileSync(file, 'utf8'), { uniqueKeys: true });
    if (doc.errors.length)
        return fail('ownership-unverified', 'Project config is malformed; preserve it and correct it before setup.');
    const value = doc.get('projectId');
    if (value === undefined)
        return null;
    if (typeof value !== 'string' || !value.trim() || value.length > 160)
        return fail('ownership-unverified', 'Project config has an invalid projectId.');
    return value;
}
function checkout(db: StoreDatabase, root: string): Checkout | null { return (db.prepare('SELECT * FROM installation_checkouts WHERE root_path=?').get(root) as unknown as Checkout) ?? null; }
function assertCheckoutIdentity(row: Checkout, root: string): void {
    const id = readDeclarativeProjectId(root);
    if (id && id !== row.project_id)
        fail('ownership-unverified', 'The config project identity conflicts with the checkout binding.');
    if (existsSync(root)) {
        const st = statSync(root);
        if (String(st.dev) !== row.root_device || String(st.ino) !== row.root_inode)
            fail('ownership-unverified', 'The directory identity changed. Review this checkout before adoption.');
    }
}
function bindCheckout(db: StoreDatabase, root: string, projectId?: string): Checkout {
    const prior = checkout(db, root);
    if (prior) {
        assertCheckoutIdentity(prior, root);
        if (projectId && projectId !== prior.project_id)
            fail('ownership-unverified', 'Conflicting project identity.');
        return prior;
    }
    const id = readDeclarativeProjectId(root) ?? projectId ?? randomUUID();
    const st = existsSync(root) ? statSync(root) : { dev: 'uncreated', ino: 'uncreated' };
    const moved = db.prepare('SELECT * FROM installation_checkouts WHERE root_device=? AND root_inode=?').all(String(st.dev), String(st.ino)) as unknown as Checkout[];
    if (moved.length) {
        const row = moved[0];
        if (moved.length !== 1 || row.project_id !== id || existsSync(row.root_path))
            fail('ownership-unverified', 'Ambiguous checkout move.');
        const busy = db.prepare("SELECT 1 FROM installation_operations WHERE checkout_id=? AND status='pending'").get(row.checkout_id);
        if (busy || db.prepare('SELECT 1 FROM installation_locks WHERE root_path=?').get(row.root_path))
            fail('recovery-required', 'Resolve the old checkout operation before rebinding its path.');
        db.prepare('UPDATE installation_checkouts SET root_path=? WHERE checkout_id=?').run(root, row.checkout_id);
        return { ...row, root_path: root };
    }
    const row = { checkout_id: randomUUID(), project_id: id, root_path: root, root_device: String(st.dev), root_inode: String(st.ino) };
    db.prepare('INSERT INTO installation_checkouts VALUES (?,?,?,?,?,?)').run(row.checkout_id, id, root, row.root_device, row.root_inode, now());
    return row;
}
export function getInstallationCheckoutId(projectRoot: string, storeRoot?: string): string {
    const root = canonicalInstallationPath(projectRoot);
    return withInstallationDatabase(root, db => transaction(db, () => bindCheckout(db, root).checkout_id), { storeRoot });
}
export function acquireInstallationLock(projectRoot: string, storeRoot?: string): InstallationLock {
    const root = canonicalInstallationPath(projectRoot);
    const existing = held.get(root);
    if (existing) {
        existing.depth++;
        return existing;
    }
    const store = validateInstallationStoreRoot(root, storeRoot ?? resolveStoreRoot());
    const token = randomUUID();
    withInstallationDatabase(root, db => transaction(db, () => {
        const machine = db.prepare("SELECT operation_id FROM tool_operations WHERE status='pending' LIMIT 1").get() as {
            operation_id: string;
        } | undefined;
        if (machine)
            fail('recovery-required', `Tool operation ${machine.operation_id} is pending. Inspect project state status before managed changes.`);
        const previous = db.prepare('SELECT * FROM installation_locks WHERE root_path=?').get(root) as {
            pid: number;
            hostname: string;
        } | undefined;
        if (previous)
            fail('writer-active', `A writer owns this checkout (${previous.pid}). Use project state recovery after it stops.`);
        db.prepare('INSERT INTO installation_locks VALUES (?,?,?,?,?)').run(root, token, process.pid, os.hostname(), now());
    }), { storeRoot: store });
    const lock = { projectRoot: root, storeRoot: store, token, lockPath: `${getStoreDatabasePath(store)}#installation-lock/${sha(root)}`, depth: 1, releaseAccess: acquireStoreAccess(store) };
    held.set(root, lock);
    return lock;
}
export function assertInstallationLockActive(lock: InstallationLock): void {
    const current = held.get(lock.projectRoot);
    if (current?.globalLock)
        assertGlobalAssetLockActive(current.globalLock);
    withInstallationDatabase(lock.projectRoot, db => { const identity = checkout(db, lock.projectRoot); if (identity)
        assertCheckoutIdentity(identity, lock.projectRoot); const row = db.prepare('SELECT token FROM installation_locks WHERE root_path=?').get(lock.projectRoot) as {
        token: string;
    } | undefined; if (row?.token !== lock.token)
        fail('writer-active', 'Checkout lock ownership changed.'); }, { storeRoot: lock.storeRoot, readOnly: true });
}
export function releaseInstallationLock(lock: InstallationLock): void {
    const current = held.get(lock.projectRoot);
    if (current && current.token === lock.token && current.depth > 1) {
        current.depth--;
        return;
    }
    assertInstallationLockActive(lock);
    withInstallationDatabase(lock.projectRoot, db => { db.prepare('DELETE FROM installation_locks WHERE root_path=? AND token=?').run(lock.projectRoot, lock.token); }, { storeRoot: lock.storeRoot });
    held.delete(lock.projectRoot);
    if (current?.globalLock)
        releaseGlobalAssetLock(current.globalLock);
    current?.releaseAccess();
}
export function readInstallationManifest(projectRoot: string, storeRoot?: string): InstallManifest | null {
    const root = canonicalInstallationPath(projectRoot);
    const store = validateInstallationStoreRoot(root, storeRoot ?? active.get(root)?.storeRoot ?? held.get(root)?.storeRoot ?? resolveStoreRoot());
    if (!existsSync(getStoreDatabasePath(store)))
        return null;
    const c = classifyStoreCheckpoint9State(store);
    if (c.state === 'supported-legacy')
        return null;
    if (c.state !== 'supported-current')
        return fail('store-unavailable', `Store is ${c.state}.`);
    return withInstallationDatabase(root, db => {
        const row = checkout(db, root);
        if (!row)
            return null;
        assertCheckoutIdentity(row, root);
        const op = active.get(root);
        const pending = op ? db.prepare('SELECT after_ledger FROM installation_operations WHERE operation_id=?').get(op.id) as {
            after_ledger: string | null;
        } | undefined : undefined;
        const data = pending?.after_ledger ?? (db.prepare('SELECT manifest_json FROM installation_ledgers WHERE checkout_id=?').get(row.checkout_id) as {
            manifest_json: string;
        } | undefined)?.manifest_json;
        return data ? JSON.parse(data) : null;
    }, { storeRoot: store, readOnly: true });
}
export function getInstallationProjectId(projectRoot: string): string { const root = canonicalInstallationPath(projectRoot); const op = active.get(root); if (op)
    return op.projectId; return withInstallationDatabase(root, db => { const row = checkout(db, root); if (!row)
    return fail('ownership-unverified', 'No checkout identity.'); return row.project_id; }, { readOnly: true }); }
export function saveInstallationManifest(projectRoot: string, manifest: InstallManifest): string {
    const root = canonicalInstallationPath(projectRoot);
    const op = active.get(root);
    if (!op)
        return withInstallationOperation(root, 'installation.ledger', () => saveInstallationManifest(root, manifest), { projectId: manifest.projectId });
    if (manifest.projectId !== op.projectId)
        fail('ownership-unverified', 'Installation ledger projectId differs from the reserved identity.');
    withInstallationDatabase(root, db => { db.prepare('UPDATE installation_operations SET after_ledger=? WHERE operation_id=?').run(JSON.stringify(manifest), op.id); }, { storeRoot: op.storeRoot });
    return `${getStoreDatabasePath(op.storeRoot)}#installation-ledger/${op.projectId}`;
}
export function removeInstallationManifest(projectRoot: string): void {
    const root = canonicalInstallationPath(projectRoot);
    const op = active.get(root);
    if (!op)
        return withInstallationOperation(root, 'setup.remove', () => removeInstallationManifest(root));
    withInstallationDatabase(root, db => { db.prepare('UPDATE installation_operations SET after_ledger=? WHERE operation_id=?').run('null', op.id); }, { storeRoot: op.storeRoot });
}
function commitOperation(db: StoreDatabase, id: string, rollback = false): void {
    transaction(db, () => {
        const op = db.prepare('SELECT * FROM installation_operations WHERE operation_id=?').get(id) as unknown as Operation;
        const ledger = rollback ? op.before_ledger : op.after_ledger;
        if (ledger && ledger !== 'null') {
            const parsed = validateAndMigrateManifest(JSON.parse(ledger), 'Make Docs Store final installation ledger');
            const owner = db.prepare('SELECT project_id FROM installation_checkouts WHERE checkout_id=?').get(op.checkout_id) as {
                project_id: string;
            };
            if (parsed.projectId !== owner.project_id)
                fail('ownership-unverified', 'Final ledger project identity differs from this checkout.');
        }
        if (ledger && ledger !== 'null')
            db.prepare('INSERT INTO installation_ledgers VALUES (?,?,?) ON CONFLICT(checkout_id) DO UPDATE SET manifest_json=excluded.manifest_json,updated_at=excluded.updated_at').run(op.checkout_id, ledger, now());
        else
            db.prepare('DELETE FROM installation_ledgers WHERE checkout_id=?').run(op.checkout_id);
        db.prepare('UPDATE installation_operations SET status=?,finished_at=? WHERE operation_id=?').run(rollback ? 'rolled-back' : 'completed', now(), id);
    });
}
export function withInstallationOperation<T>(projectRoot: string, operation: string, fn: () => T, options: {
    storeRoot?: string;
    projectId?: string;
} = {}): T {
    const root = canonicalInstallationPath(projectRoot);
    const parent = active.get(root);
    if (parent) {
        parent.depth++;
        try {
            return fn();
        }
        finally {
            parent.depth--;
        }
    }
    const lock = acquireInstallationLock(root, options.storeRoot);
    let opId: string | null = null;
    try {
        const bound = withInstallationDatabase(root, db => transaction(db, () => {
            const row = bindCheckout(db, root, options.projectId);
            const pending = db.prepare("SELECT operation_id FROM installation_operations WHERE checkout_id=? AND status='pending'").get(row.checkout_id) as {
                operation_id: string;
            } | undefined;
            if (pending)
                fail('recovery-required', `Run make-docs project state recover ${pending.operation_id} --resume --dry-run --target-root ${JSON.stringify(root)}.`);
            const ledger = (db.prepare('SELECT manifest_json FROM installation_ledgers WHERE checkout_id=?').get(row.checkout_id) as {
                manifest_json: string;
            } | undefined)?.manifest_json ?? null;
            const id = randomUUID();
            db.prepare('INSERT INTO installation_operations (operation_id,checkout_id,operation,status,before_ledger,after_ledger,created_at,finished_at) VALUES (?,?,?,?,?,?,?,NULL)').run(id, row.checkout_id, operation, 'pending', ledger, ledger, now());
            return { id, projectId: row.project_id };
        }), { storeRoot: lock.storeRoot });
        opId = bound.id;
        active.set(root, { ...bound, storeRoot: lock.storeRoot, depth: 1 });
        if (!existsSync(root)) {
            withInstallationDatabase(root, db => db.prepare('INSERT INTO installation_steps VALUES (?,0,?,?,?,0)').run(bound.id, '.', JSON.stringify({ kind: 'missing' }), JSON.stringify({ kind: 'directory' })), { storeRoot: lock.storeRoot });
            mkdirSync(root, { recursive: true });
            const st = statSync(root);
            withInstallationDatabase(root, db => transaction(db, () => { db.prepare('UPDATE installation_checkouts SET root_device=?,root_inode=? WHERE root_path=?').run(String(st.dev), String(st.ino), root); db.prepare('UPDATE installation_steps SET applied=1 WHERE operation_id=? AND ordinal=0').run(bound.id); }), { storeRoot: lock.storeRoot });
        }
        ensureDeclarativeIdentity(root);
        const result = fn();
        if (result && typeof (result as {
            then?: unknown;
        }).then === 'function')
            fail('recovery-required', 'Installation operation callback must be synchronous.');
        sealInstallationOperation(root);
        assertInstallationLockActive(lock);
        withInstallationDatabase(root, db => {
            const rows = db.prepare('SELECT * FROM installation_steps WHERE operation_id=? ORDER BY ordinal').all(bound.id) as unknown as Step[];
            const last = new Map(rows.map(s => [s.relative_path, s]));
            for (const step of last.values())
                if (!subsumedByAncestor(root, step, last) && !matches(root, step.relative_path, JSON.parse(step.after_json)))
                    fail('snapshot-drift', `Output changed before final commit: ${step.relative_path}`);
            commitOperation(db, bound.id);
        }, { storeRoot: lock.storeRoot });
        return result;
    }
    catch (e) {
        if (opId && e instanceof Error)
            e.message += ` Pending operation: ${opId}. Inspect make-docs project state status.`;
        throw e;
    }
    finally {
        active.delete(root);
        releaseInstallationLock(lock);
    }
}
function targetPath(root: string, relative: string): string {
    if (path.isAbsolute(relative)) {
        const allowed = ['.agents', '.claude', '.codex'].some(p => canonicalInstallationPath(path.join(os.homedir(), p)) === path.join(canonicalInstallationPath(path.dirname(relative)), path.basename(relative))) || ['.agents/skills', '.codex/skills', '.claude/skills', '.make-docs/agentics'].some(p => inside(canonicalInstallationPath(path.join(os.homedir(), p)), path.join(canonicalInstallationPath(path.dirname(relative)), path.basename(relative)))) || inside(path.join(active.get(root)?.storeRoot ?? resolveStoreRoot(), 'agentics'), path.join(canonicalInstallationPath(path.dirname(relative)), path.basename(relative)));
        if (!allowed)
            fail('ownership-unverified', `External mutation path is not an approved skill location: ${relative}`);
        return path.join(canonicalInstallationPath(path.dirname(relative)), path.basename(relative));
    }
    const target = path.resolve(root, relative);
    if (!inside(root, target) || relative === '')
        fail('ownership-unverified', 'Unsafe operation path.');
    return target;
}
function assertSafeFilePath(root: string, relative: string): string {
    const target = targetPath(root, relative);
    let current = path.dirname(target);
    while (current !== path.dirname(current)) {
        if (lstatSync(current, { throwIfNoEntry: false })?.isSymbolicLink())
            fail('ownership-unverified', `Symbolic-link parent: ${current}`);
        if (current === root)
            break;
        current = path.dirname(current);
    }
    return target;
}
function inspect(root: string, relative: string): FileState {
    const target = assertSafeFilePath(root, relative);
    let st;
    try {
        st = lstatSync(target);
    }
    catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'ENOENT')
            return { kind: 'missing' };
        throw e;
    }
    if (st.isSymbolicLink())
        return { kind: 'symlink', target: readlinkSync(target) };
    if (st.isDirectory())
        return { kind: 'directory' };
    if (!st.isFile())
        fail('ownership-unverified', 'Unsupported recovery file type.');
    return { kind: 'file', digest: sha(readFileSync(target)), mode: st.mode & 0o777 };
}
function matches(root: string, relative: string, expected: FileState): boolean { const current = inspect(root, relative); return current.kind === expected.kind && current.digest === expected.digest && current.target === expected.target && (expected.mode === undefined || current.mode === expected.mode); }
function savePayload(root: string, opId: string, ordinal: number, label: string, bytes: Uint8Array | string): string {
    const relative = `.make-docs/backup/operations/${opId}/${ordinal}-${label}`;
    const target = assertSafeFilePath(root, relative);
    mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
    const fd = openSync(target, 'wx', 0o600);
    try {
        writeFileSync(fd, bytes);
        fsyncSync(fd);
    }
    finally {
        closeSync(fd);
    }
    if (sha(readFileSync(target)) !== sha(bytes))
        fail('snapshot-drift', 'Backup payload verification failed.');
    return relative;
}
export function recordPlannedFileChange(projectRoot: string, relativePath: string, after: PlannedFileState, apply: () => void): void { preparePlannedFileChange(projectRoot, relativePath, after, apply)(); }
export function sealInstallationOperation(projectRoot: string): void { const root = canonicalInstallationPath(projectRoot); const op = active.get(root); if (!op)
    fail('recovery-required', 'No operation to seal.'); if (op.depth > 1)
    return; withInstallationDatabase(root, db => db.prepare('UPDATE installation_operations SET plan_complete=1 WHERE operation_id=?').run(op.id), { storeRoot: op.storeRoot }); }
export function preparePlannedFileChange(projectRoot: string, relativePath: string, after: PlannedFileState, apply: () => void): () => void {
    const root = canonicalInstallationPath(projectRoot);
    if (relativePath === '.')
        fail('ownership-unverified', 'Only bootstrap can create the target root.');
    const op = active.get(root);
    if (!op)
        return fail('recovery-required', 'File mutation requires a pending installation operation.');
    if (path.isAbsolute(relativePath)) {
        const lock = held.get(root)!;
        if (!lock.globalLock)
            lock.globalLock = acquireGlobalAssetLock(root);
        assertGlobalAssetLockActive(lock.globalLock);
    }
    const prior = withInstallationDatabase(root, db => db.prepare('SELECT after_json FROM installation_steps WHERE operation_id=? AND relative_path=? ORDER BY ordinal DESC LIMIT 1').get(op.id, relativePath) as {
        after_json: string;
    } | undefined, { storeRoot: op.storeRoot, readOnly: true });
    const before: FileState = prior ? JSON.parse(prior.after_json) : inspect(root, relativePath);
    if (before.kind === 'directory' && after.kind !== 'directory' && readdirSync(targetPath(root, relativePath)).length)
        fail('ownership-unverified', 'Journal individual files before removing a nonempty directory.');
    const ordinal = withInstallationDatabase(root, db => Number((db.prepare('SELECT COALESCE(MAX(ordinal),0)+1 AS next FROM installation_steps WHERE operation_id=?').get(op.id) as {
        next: number;
    }).next), { storeRoot: op.storeRoot });
    // The operation intent already exists before backup payload creation.
    if (before.kind === 'file' && !before.payload)
        before.payload = savePayload(root, op.id, ordinal, 'before', readFileSync(targetPath(root, relativePath)));
    let desired: FileState;
    if (after.kind === 'file')
        desired = { kind: 'file', digest: sha(after.content), payload: savePayload(root, op.id, ordinal, 'after', after.content), mode: after.mode ?? (before.kind === 'file' ? before.mode : 0o644) };
    else
        desired = { ...after };
    withInstallationDatabase(root, db => db.prepare('INSERT INTO installation_steps VALUES (?,?,?,?,?,0)').run(op.id, ordinal, relativePath, JSON.stringify(before), JSON.stringify(desired)), { storeRoot: op.storeRoot });
    return () => {
        if (!matches(root, relativePath, before))
            fail('snapshot-drift', `File changed before replacement: ${relativePath}`);
        assertInstallationLockActive(held.get(root)!);
        try {
            apply();
        }
        catch (error) {
            if (after.kind === 'symlink' && matches(root, relativePath, before))
                withInstallationDatabase(root, db => db.prepare('DELETE FROM installation_steps WHERE operation_id=? AND ordinal=? AND applied=0').run(op.id, ordinal), { storeRoot: op.storeRoot });
            throw error;
        }
        if (after.kind === 'file' && desired.mode !== undefined)
            chmodSync(targetPath(root, relativePath), desired.mode);
        if (!matches(root, relativePath, desired))
            fail('snapshot-drift', `File change did not match the plan: ${relativePath}`);
        withInstallationDatabase(root, db => db.prepare('UPDATE installation_steps SET applied=1 WHERE operation_id=? AND ordinal=?').run(op.id, ordinal), { storeRoot: op.storeRoot });
    };
}
function restoreState(root: string, relative: string, state: FileState): void {
    const target = assertSafeFilePath(root, relative);
    const current = inspect(root, relative);
    if (state.kind === 'missing') {
        if (current.kind === 'directory')
            rmdirSync(target);
        else if (current.kind !== 'missing')
            unlinkSync(target);
        return;
    }
    if (state.kind === 'directory') {
        mkdirSync(target, { recursive: true });
        return;
    }
    if (current.kind === 'directory')
        rmdirSync(target);
    else if (current.kind === 'symlink')
        unlinkSync(target);
    mkdirSync(path.dirname(target), { recursive: true });
    if (state.kind === 'symlink') {
        if (existsSync(target))
            unlinkSync(target);
        symlinkSync(state.target!, target);
        return;
    }
    if (!state.payload)
        fail('recovery-required', 'Recovery payload reference is absent.');
    const payload = assertSafeFilePath(root, state.payload);
    if (lstatSync(payload).isSymbolicLink() || sha(readFileSync(payload)) !== state.digest)
        fail('snapshot-drift', 'Recovery payload changed.');
    const fd = openSync(target, 'w', state.mode ?? 0o644);
    try {
        writeFileSync(fd, readFileSync(payload));
        fsyncSync(fd);
    }
    finally {
        closeSync(fd);
    }
    chmodSync(target, state.mode ?? 0o644);
}
export function readInstallationStatus(projectRoot: string, storeRoot?: string) {
    const root = canonicalInstallationPath(projectRoot);
    const base = { schemaVersion: 1 as const, projectRoot: root, projectName: path.basename(root) };
    try {
        const id = readDeclarativeProjectId(root);
        const store = validateInstallationStoreRoot(root, storeRoot ?? resolveStoreRoot());
        if (!existsSync(getStoreDatabasePath(store)))
            return { ...base, status: 'unregistered', projectId: id, storeAvailable: false, nextAction: 'Run make-docs setup and review the installation plan.' };
        const c = classifyStoreCheckpoint9State(store);
        if (c.state === 'supported-legacy')
            return { ...base, status: 'unregistered', projectId: id, storeAvailable: true, nextAction: 'Run make-docs setup and review legacy transfer.' };
        if (c.state !== 'supported-current')
            fail('store-unavailable', `Store is ${c.state}.`);
        return withInstallationDatabase(root, db => {
            const toolOperations = (db.prepare("SELECT operation_id AS operationId,operation,started_at AS startedAt,status FROM tool_operations WHERE status='pending' ORDER BY started_at LIMIT 10").all() as {
                operationId: string;
                operation: string;
                startedAt: string;
                status: string;
            }[]).map(op => ({ ...op, nextAction: 'Review the package manager result before completing this tool operation.' }));
            if (toolOperations.length)
                return { ...base, projectId: id, storeAvailable: true, status: 'recovery-required', toolOperations, nextAction: 'A tool operation is pending. Review its package manager result before managed changes.' };
            const row = checkout(db, root);
            if (!row)
                return { ...base, status: id ? 'ownership-unverified' : 'unregistered', projectId: id, storeAvailable: true, nextAction: 'Run make-docs setup and review this checkout.' };
            assertCheckoutIdentity(row, root);
            const lock = db.prepare('SELECT pid,hostname FROM installation_locks WHERE root_path=?').get(root) as {
                pid: number;
                hostname: string;
            } | undefined;
            const pending = db.prepare("SELECT operation_id,operation FROM installation_operations WHERE checkout_id=? AND status='pending'").get(row.checkout_id) as {
                operation_id: string;
                operation: string;
            } | undefined;
            const manifest = (db.prepare('SELECT manifest_json FROM installation_ledgers WHERE checkout_id=?').get(row.checkout_id) as {
                manifest_json: string;
            } | undefined)?.manifest_json;
            return { ...base, projectId: row.project_id, checkoutId: row.checkout_id, storeAvailable: true, installationVersion: manifest ? JSON.parse(manifest).packageVersion : null, pendingOperation: pending ?? null, status: lock && !isDead(lock.pid, lock.hostname) ? 'writer-active' : pending ? 'recovery-required' : manifest ? 'ready' : 'unregistered', nextAction: pending ? `make-docs project state recover ${pending.operation_id} --resume --dry-run --target-root ${JSON.stringify(root)}` : lock ? 'Wait for the active writer.' : manifest ? 'No recovery is required.' : 'Review setup before installing.' };
        }, { storeRoot: store, readOnly: true });
    }
    catch (e) {
        return { ...base, status: e instanceof InstallationStateError ? e.code : 'store-unavailable', storeAvailable: false, nextAction: e instanceof Error ? e.message : String(e) };
    }
}
export function recoverInstallationOperation(projectRoot: string, operationId: string, mode: 'resume' | 'rollback', dryRun: boolean, storeRoot?: string) {
    if (mode !== 'resume' && mode !== 'rollback')
        return fail('recovery-required', 'Choose exactly one recovery mode.');
    const root = canonicalInstallationPath(projectRoot);
    const store = validateInstallationStoreRoot(root, storeRoot ?? resolveStoreRoot());
    const read = () => withInstallationDatabase(root, db => {
        const row = checkout(db, root);
        if (!row)
            fail('ownership-unverified', 'No checkout binding.');
        assertCheckoutIdentity(row, root);
        const op = db.prepare('SELECT * FROM installation_operations WHERE operation_id=? AND checkout_id=?').get(operationId, row.checkout_id) as unknown as Operation | undefined;
        if (!op)
            fail('ownership-unverified', 'Operation does not belong to this checkout.');
        const steps = db.prepare('SELECT * FROM installation_steps WHERE operation_id=? ORDER BY ordinal').all(operationId) as unknown as Step[];
        return { op, steps };
    }, { storeRoot: store, readOnly: true });
    const select = (state: ReturnType<typeof read>) => {
        const ordered = mode === 'rollback' ? [...state.steps].reverse() : state.steps;
        const byPath = new Map<string, Step[]>();
        for (const step of state.steps) {
            const group = byPath.get(step.relative_path) ?? [];
            group.push(step);
            byPath.set(step.relative_path, group);
        }
        const selected = new Set<number>();
        const conflicts: string[] = [];
        const equal = (a: FileState, b: FileState) => a.kind === b.kind && a.digest === b.digest && a.target === b.target && (b.mode === undefined || a.mode === b.mode);
        for (const [relative, steps] of byPath) {
            const lastSteps = new Map([...byPath].map(([p, items]) => [p, items[items.length - 1]]));
            const current = subsumedByAncestor(root, steps[steps.length - 1], lastSteps) ? { kind: "missing" as const } : inspect(root, relative);
            let boundary = -2;
            if (equal(current, JSON.parse(steps[0].before_json)))
                boundary = -1;
            for (let i = 0; i < steps.length; i++)
                if (equal(current, JSON.parse(steps[i].after_json)))
                    boundary = i;
            if (boundary === -2) {
                conflicts.push(relative);
                continue;
            }
            for (let i = 0; i < steps.length; i++)
                if (mode === 'resume' ? i > boundary : i <= boundary)
                    selected.add(steps[i].ordinal);
        }
        const remaining = ordered.filter(s => selected.has(s.ordinal));
        return { ordered, remaining, conflicts };
    };
    const state = read();
    const { ordered, remaining, conflicts } = select(state);
    const result = { schemaVersion: 1 as const, operationId, mode, dryRun, status: state.op.status === 'pending' ? (conflicts.length ? 'blocked' : 'ready') : state.op.status, changes: ordered.map(s => ({ path: s.relative_path, to: JSON.parse(mode === 'resume' ? s.after_json : s.before_json).kind })), conflicts };
    if (mode === 'resume' && !state.op.plan_complete)
        return { ...result, status: 'blocked', conflicts: ['The complete change plan was not saved. Review rollback; do not infer missing steps.'] };
    if (state.op.operation === 'legacy.recovery')
        return { ...result, status: 'blocked', conflicts: ['Legacy recovery needs its verified migration snapshot; no generic replay is safe.'] };
    if (dryRun || state.op.status !== 'pending')
        return result;
    if (conflicts.length)
        fail('snapshot-drift', `Recovery preserves changed files: ${[...new Set(conflicts)].join(', ')}`);
    recoverDeadStoreLeases(store);
    if (state.steps.some(step => path.isAbsolute(step.relative_path)))
        recoverDeadStoreLeases(canonicalInstallationPath(path.join(os.homedir(), '.make-docs')));
    // A crashed lock can be released only with same-host process death evidence.
    withInstallationDatabase(root, db => transaction(db, () => { const owner = db.prepare('SELECT pid,hostname FROM installation_locks WHERE root_path=?').get(root) as {
        pid: number;
        hostname: string;
    } | undefined; if (owner) {
        if (!isDead(owner.pid, owner.hostname))
            fail('writer-active', 'Prior writer is live or cannot be proven inactive.');
        db.prepare('DELETE FROM installation_locks WHERE root_path=?').run(root);
    } }), { storeRoot: store });
    const lock = acquireInstallationLock(root, store);
    try {
        if (state.steps.some(step => path.isAbsolute(step.relative_path)))
            held.get(root)!.globalLock = acquireGlobalAssetLock(root);
        const current = read();
        if (current.op.status !== 'pending')
            return { ...result, status: current.op.status };
        const locked = select(current);
        if (locked.conflicts.length)
            fail('snapshot-drift', `Recovery input changed: ${locked.conflicts.join(', ')}`);
        for (const s of locked.remaining) {
            assertInstallationLockActive(lock);
            const from: FileState = JSON.parse(mode === 'resume' ? s.before_json : s.after_json);
            const to: FileState = JSON.parse(mode === 'resume' ? s.after_json : s.before_json);
            if (matches(root, s.relative_path, to))
                continue;
            if (!matches(root, s.relative_path, from))
                fail('snapshot-drift', `Recovery input changed: ${s.relative_path}`);
            restoreState(root, s.relative_path, to);
            if (!matches(root, s.relative_path, to))
                fail('snapshot-drift', 'Recovery output verification failed.');
        }
        const finalSteps = new Map<string, Step>();
        for (const step of (mode === 'rollback' ? [...current.steps].reverse() : current.steps))
            finalSteps.set(step.relative_path, step);
        for (const step of finalSteps.values()) {
            if (mode === 'resume' && subsumedByAncestor(root, step, finalSteps))
                continue;
            if (!matches(root, step.relative_path, JSON.parse(mode === 'resume' ? step.after_json : step.before_json)))
                fail('snapshot-drift', `Recovery output changed before commit: ${step.relative_path}`);
        }
        assertInstallationLockActive(lock);
        withInstallationDatabase(root, db => commitOperation(db, operationId, mode === 'rollback'), { storeRoot: store });
        return { ...result, status: mode === 'resume' ? 'completed' : 'rolled-back' };
    }
    finally {
        releaseInstallationLock(lock);
    }
}
export type MigrationRecordKind = 'receipt' | 'quiescence' | 'snapshot' | 'backup' | 'legacy-import';
export function recordMigrationState(projectRoot: string, kind: MigrationRecordKind, id: string, value: unknown, storeRoot?: string): void { const cid = getInstallationCheckoutId(projectRoot, storeRoot); withInstallationDatabase(projectRoot, db => db.prepare('INSERT INTO installation_migration_records VALUES (?,?,?,?) ON CONFLICT(checkout_id,kind,record_id) DO UPDATE SET record_json=excluded.record_json').run(cid, kind, id, JSON.stringify(value)), { storeRoot }); }
export function readMigrationState<T = unknown>(projectRoot: string, kind: MigrationRecordKind, id: string, storeRoot?: string): T | null { if (!hasInstallationSchema(projectRoot, storeRoot))
    return null; return withInstallationDatabase(projectRoot, db => { const row = checkout(db, canonicalInstallationPath(projectRoot)); if (!row)
    return null; assertCheckoutIdentity(row, canonicalInstallationPath(projectRoot)); const record = db.prepare('SELECT record_json FROM installation_migration_records WHERE checkout_id=? AND kind=? AND record_id=?').get(row.checkout_id, kind, id) as {
    record_json: string;
} | undefined; return record ? JSON.parse(record.record_json) : null; }, { storeRoot, readOnly: true }); }
export function listMigrationState<T = unknown>(projectRoot: string, kind: MigrationRecordKind, storeRoot?: string): T[] { if (!hasInstallationSchema(projectRoot, storeRoot))
    return []; return withInstallationDatabase(projectRoot, db => { const row = checkout(db, canonicalInstallationPath(projectRoot)); if (!row)
    return []; assertCheckoutIdentity(row, canonicalInstallationPath(projectRoot)); return (db.prepare('SELECT record_json FROM installation_migration_records WHERE checkout_id=? AND kind=?').all(row.checkout_id, kind) as {
    record_json: string;
}[]).map(r => JSON.parse(r.record_json)); }, { storeRoot, readOnly: true }); }
export function deleteMigrationState(projectRoot: string, kind: MigrationRecordKind, id: string, storeRoot?: string): void { withInstallationDatabase(projectRoot, db => { const row = checkout(db, canonicalInstallationPath(projectRoot)); if (row)
    db.prepare('DELETE FROM installation_migration_records WHERE checkout_id=? AND kind=? AND record_id=?').run(row.checkout_id, kind, id); }, { storeRoot }); }
/** Save useful legacy records and exact source provenance in one Store transaction. */
export function importInstallationState(projectRoot: string, input: {
    manifest: InstallManifest | null;
    records: {
        kind: MigrationRecordKind;
        id: string;
        value: unknown;
    }[];
    importId: string;
    sources: {
        relativePath: string;
        digest: string;
    }[];
    recoveryRequired: boolean;
}, storeRoot?: string): void {
    const root = canonicalInstallationPath(projectRoot);
    const lock = acquireInstallationLock(root, storeRoot);
    try {
        withInstallationDatabase(root, db => transaction(db, () => {
            const row = bindCheckout(db, root, input.manifest?.projectId);
            const prior = db.prepare("SELECT record_json FROM installation_migration_records WHERE checkout_id=? AND kind='legacy-import' AND record_id=?").get(row.checkout_id, input.importId);
            if (prior)
                return;
            const ledger = db.prepare('SELECT manifest_json FROM installation_ledgers WHERE checkout_id=?').get(row.checkout_id) as {
                manifest_json: string;
            } | undefined;
            if (ledger && input.manifest && JSON.stringify(JSON.parse(ledger.manifest_json)) !== JSON.stringify(input.manifest))
                fail('ownership-unverified', 'Legacy ledger conflicts with existing Store ownership.');
            if (input.manifest)
                db.prepare('INSERT INTO installation_ledgers VALUES (?,?,?) ON CONFLICT(checkout_id) DO NOTHING').run(row.checkout_id, JSON.stringify({ ...input.manifest, projectId: row.project_id }), now());
            for (const record of input.records) {
                const existing = db.prepare('SELECT record_json FROM installation_migration_records WHERE checkout_id=? AND kind=? AND record_id=?').get(row.checkout_id, record.kind, record.id) as {
                    record_json: string;
                } | undefined;
                if (existing && canonicalJson(JSON.parse(existing.record_json)) !== canonicalJson(record.value))
                    fail('ownership-unverified', 'Legacy record conflicts with existing Store evidence.');
            }
            for (const record of input.records)
                db.prepare('INSERT INTO installation_migration_records VALUES (?,?,?,?) ON CONFLICT(checkout_id,kind,record_id) DO NOTHING').run(row.checkout_id, record.kind, record.id, JSON.stringify(record.value));
            for (const source of input.sources)
                db.prepare("INSERT INTO installation_transfers VALUES (?,?,?,'imported',?) ON CONFLICT DO NOTHING").run(row.checkout_id, source.relativePath, source.digest, now());
            db.prepare("INSERT INTO installation_migration_records VALUES (?,'legacy-import',?,?)").run(row.checkout_id, input.importId, JSON.stringify({ sources: input.sources, recoveryRequired: input.recoveryRequired, importedAt: now() }));
            if (input.recoveryRequired)
                db.prepare("INSERT INTO installation_operations (operation_id,checkout_id,operation,status,before_ledger,after_ledger,created_at,finished_at) VALUES (?,?,?,'pending',?,?,?,NULL)").run(input.importId, row.checkout_id, 'legacy.recovery', ledger?.manifest_json ?? null, input.manifest ? JSON.stringify(input.manifest) : null, now());
        }), { storeRoot: lock.storeRoot });
        if (!input.recoveryRequired)
            withInstallationOperation(root, 'legacy.identity', () => ensureDeclarativeIdentity(root), { storeRoot: lock.storeRoot, projectId: input.manifest?.projectId });
    }
    finally {
        releaseInstallationLock(lock);
    }
}
function ensureDeclarativeIdentity(root: string): void {
    const id = getInstallationProjectId(root);
    const prior = readDeclarativeProjectId(root);
    if (prior) {
        if (prior !== id)
            fail('ownership-unverified', 'Conflicting project identity.');
        return;
    }
    const relative = '.make-docs/config.yaml';
    const file = assertSafeFilePath(root, relative);
    const doc = parseDocument(existsSync(file) ? readFileSync(file, 'utf8') : '', { uniqueKeys: true });
    if (doc.errors.length || (doc.contents !== null && !doc.toJS()) || (doc.contents !== null && typeof doc.toJS() !== 'object') || Array.isArray(doc.toJS()))
        fail('ownership-unverified', 'Unsupported project config.');
    doc.set('projectId', id);
    const content = doc.toString();
    recordPlannedFileChange(root, relative, { kind: 'file', content }, () => { mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, content); });
}
function hasInstallationSchema(root: string, override?: string): boolean { const canonical = canonicalInstallationPath(root); const store = validateInstallationStoreRoot(canonical, override ?? active.get(canonical)?.storeRoot ?? held.get(canonical)?.storeRoot ?? resolveStoreRoot()); const c = classifyStoreCheckpoint9State(store); if (c.state === 'absent' || c.state === 'supported-legacy')
    return false; if (c.state !== 'supported-current')
    fail('store-unavailable', `Store is ${c.state}.`); return true; }
function canonicalJson(value: unknown): string { const sort = (v: any): any => Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v; return JSON.stringify(sort(value)); }
function subsumedByAncestor(root: string, step: Step, last: Map<string, Step>): boolean { for (const candidate of [...last.values()].sort((a, b) => a.relative_path.split(path.sep).length - b.relative_path.split(path.sep).length)) {
    if (candidate.ordinal <= step.ordinal)
        continue;
    const rel = path.relative(targetPath(root, candidate.relative_path), targetPath(root, step.relative_path));
    if (!rel || rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel))
        continue;
    const after: FileState = JSON.parse(candidate.after_json);
    if ((after.kind === 'missing' || after.kind === 'symlink') && matches(root, candidate.relative_path, after))
        return true;
} return false; }
