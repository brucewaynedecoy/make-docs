import { createHash, randomUUID } from 'node:crypto';
import { existsSync, lstatSync, realpathSync, mkdirSync, readFileSync, writeFileSync, openSync, closeSync, fsyncSync, unlinkSync, readdirSync, rmdirSync, symlinkSync, readlinkSync, chmodSync, statSync, fstatSync, renameSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parseDocument } from 'yaml';
import { recoverDeadStoreLeases } from './lease-recovery';
import { acquireGlobalAssetLock, assertGlobalAssetLockActive, releaseGlobalAssetLock, type GlobalAssetLock } from './global-asset-lock';
import { acquireStoreAccess, applyStoreMigrations, classifyStoreCheckpoint9State, CURRENT_STORE_SCHEMA_VERSION, formatStoreIssue, isSqliteContention, makeStoreIssue, openStoreSqliteConnection, STORE_BUSY_TIMEOUT_MS, STORE_OWNER_WAIT_MS, StoreUnavailableError, tryCreateExclusiveStoreLease, waitForStoreAccessToDrain, waitForStoreRetry, type StoreDatabase, type StoreIssue } from './database';
import { resolveStoreRoot, getStoreDatabasePath } from './paths';
import { validateAndMigrateManifest } from '../manifest';
import type { InstallManifest, ManifestFileEntry } from '../types';
import { getCanonicalSkillDirectory, getHarnessSkillDirectory } from '../skill-paths';
export class InstallationStateError extends Error {
    constructor(readonly code: 'store-unavailable' | 'writer-active' | 'ownership-unverified' | 'recovery-required' | 'snapshot-drift', message: string, readonly issue?: StoreIssue) { super(message); this.name = 'InstallationStateError'; }
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
export interface InstallationFileState {
    kind: 'missing' | 'file' | 'directory' | 'symlink';
    digest?: string;
    payload?: string;
    mode?: number;
    target?: string;
    /** Detached plans keep recovery bytes in the Store, never in a local plan. */
    contentBase64?: string;
}
type FileState = InstallationFileState;
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

function isRetiredSkillPath(root: string, relative: string): boolean {
    const absolute = path.resolve(root, relative);
    return [root, os.homedir()].some(base => inside(path.join(base, '.make-docs/agentics'), absolute));
}

/** New children are absent while their exact reviewed former exposure is still a link. */
function underSavedBeforeLink(root: string, relative: string, changes: DetachedInstallationPlan['changes']): boolean {
    const absolute = path.resolve(root, relative);
    return changes.some(change => {
        const ancestor = path.resolve(root, change.path);
        return absolute !== ancestor && inside(ancestor, absolute) && change.before.kind === 'symlink'
            && changes.some(final => final.path === change.path && final.after.kind === 'directory')
            && matches(root, change.path, change.before);
    });
}

export interface DetachedInstallationPlan {
    schemaVersion: 1;
    reviewDigest: string;
    mode: 'cli' | 'manual';
    metadata: unknown;
    changes: Array<{ path: string; before: InstallationFileState; after: InstallationFileState }>;
    afterLedger?: InstallManifest | null;
    /** Only setup.skills.adopt may opt into the bounded Skill path policy. */
    skillScope?: { roots: string[]; symlinkTargets: Record<string, string>; beforeSymlinkTargets?: Record<string, string>; bootstrapPaths?: string[]; backupRoots?: string[] };
    copyFallbacks?: Record<string, {
        changes: Array<{path: string; before: InstallationFileState; after: InstallationFileState}>;
        ledgerEntry: ManifestFileEntry;
    }>;
    /** Written only by the executor after a proved no-effect symlink failure. */
    selectedCopyFallbacks?: string[];
}
export interface InstallationPathClaim {
    checkoutId: string;
    projectId: string;
    rootPath: string;
    path: string;
    kind: 'ownership' | 'pending';
    operationId?: string;
}
/** Read current ownership and pending intent without creating a Store or binding. */
export function readInstallationPathClaims(projectRoot: string, roots: string[], storeRoot?: string): InstallationPathClaim[] {
    const root = canonicalInstallationPath(projectRoot);
    if (!hasInstallationSchema(root, storeRoot)) return [];
    const requested = roots.map(p => { const absolute = path.resolve(root, p); return path.join(canonicalInstallationPath(path.dirname(absolute)), path.basename(absolute)); });
    return withInstallationDatabase(root, db => {
        const claims: InstallationPathClaim[] = [];
        const append = (row: Checkout, p: string, kind: InstallationPathClaim['kind'], operationId?: string) => {
            const resolved = path.resolve(row.root_path, p);
            const absolute = path.join(canonicalInstallationPath(path.dirname(resolved)), path.basename(resolved));
            if (requested.some(r => inside(r, absolute) || inside(absolute, r))) claims.push({checkoutId: row.checkout_id, projectId: row.project_id, rootPath: row.root_path, path: absolute, kind, ...(operationId ? {operationId} : {})});
        };
        for (const row of db.prepare('SELECT * FROM installation_checkouts').all() as unknown as Checkout[]) {
            const ledger = db.prepare('SELECT manifest_json FROM installation_ledgers WHERE checkout_id=?').get(row.checkout_id) as {manifest_json: string} | undefined;
            if (ledger) for (const p of Object.keys((JSON.parse(ledger.manifest_json) as InstallManifest).files)) append(row, p, 'ownership');
            for (const op of db.prepare("SELECT * FROM installation_operations WHERE checkout_id=? AND status='pending'").all(row.checkout_id) as unknown as Operation[]) {
                for (const step of db.prepare('SELECT relative_path FROM installation_steps WHERE operation_id=?').all(op.operation_id) as {relative_path: string}[]) append(row, step.relative_path, 'pending', op.operation_id);
                const intendedLedger = op.after_ledger ? JSON.parse(op.after_ledger) as InstallManifest | null : null;
                if (intendedLedger) for (const p of Object.keys(intendedLedger.files)) append(row, p, 'pending', op.operation_id);
            }
        }
        return [...new Map(claims.map(c => [canonicalJson(c), c])).values()].sort((a, b) => canonicalJson(a).localeCompare(canonicalJson(b)));
    }, {storeRoot, readOnly: true});
}
function assertNoOtherPendingPathClaims(root: string, paths: string[], storeRoot?: string): void {
    if (!paths.length) return;
    // Ordinary writers need pending reservations only. Do not parse every committed ledger per file.
    const conflict = withInstallationDatabase(root, db => {
        const pending = db.prepare("SELECT o.operation_id,o.after_ledger,c.root_path FROM installation_operations o JOIN installation_checkouts c ON c.checkout_id=o.checkout_id WHERE o.status='pending' AND c.root_path<>?").all(root) as {operation_id: string; after_ledger: string | null; root_path: string}[];
        if (!pending.length) return undefined;
        const canonicalPath = (base: string, p: string) => { const absolute = path.resolve(base, p); return path.join(canonicalInstallationPath(path.dirname(absolute)), path.basename(absolute)); };
        const requested = paths.map(p => canonicalPath(root, p));
        for (const op of pending) {
            const planned = db.prepare('SELECT relative_path FROM installation_steps WHERE operation_id=?').all(op.operation_id) as {relative_path: string}[];
            const intendedLedger = op.after_ledger ? JSON.parse(op.after_ledger) as InstallManifest | null : null;
            const reserved = [...planned.map(step => step.relative_path), ...Object.keys(intendedLedger?.files ?? {})];
            for (const p of reserved) {
                const absolute = canonicalPath(op.root_path, p);
                if (requested.some(r => inside(r, absolute) || inside(absolute, r))) return {operationId: op.operation_id, rootPath: op.root_path, path: absolute};
            }
        }
        return undefined;
    }, {storeRoot, readOnly: true});
    if (conflict) fail('recovery-required', `Pending operation ${conflict.operationId} in ${conflict.rootPath} reserves ${conflict.path}. Recover that operation before overlapping managed writes.`);
}
interface DetachedOperationHooks {
    validate(root: string, metadata: unknown, phase: 'before' | 'after' | 'progress', temporaryFiles?: Record<string, FileState>): string[];
    beforeRetiredCleanup?(root: string, metadata: unknown): string[];
    nextAction(root: string, operationId: string, mode: 'cli' | 'manual'): string;
}
const detachedHooks = new Map<string, DetachedOperationHooks>();
/** Domain checks extend the same journal and recovery executor used by setup. */
export function registerDetachedInstallationOperation(operation: string, hooks: DetachedOperationHooks): void {
    if (detachedHooks.has(operation)) throw new Error(`Duplicate detached operation: ${operation}`);
    detachedHooks.set(operation, hooks);
}
function detachedSnapshot(db: StoreDatabase, op: Operation): DetachedInstallationPlan | null {
    const record = db.prepare("SELECT record_json FROM installation_migration_records WHERE checkout_id=? AND kind='snapshot' AND record_id=?").get(op.checkout_id, `detached:${op.operation_id}`) as {record_json: string} | undefined;
    if (!record) {
        if (detachedHooks.has(op.operation) || op.operation.startsWith('project.layout')) fail('recovery-required', 'The saved layout plan is missing. Preserve the files and restore its Store evidence.');
        return null;
    }
    const envelope = JSON.parse(record.record_json) as { digest: string; plan: DetachedInstallationPlan };
    if (!envelope.plan || sha(canonicalJson(envelope.plan)) !== envelope.digest || envelope.plan.schemaVersion !== 1 || !['cli', 'manual'].includes(envelope.plan.mode) || !Array.isArray(envelope.plan.changes)) fail('snapshot-drift', 'The saved operation plan is invalid or changed.');
    if (envelope.plan.afterLedger !== undefined && canonicalJson(envelope.plan.afterLedger) !== canonicalJson(op.after_ledger ? JSON.parse(op.after_ledger) : null)) fail('snapshot-drift', 'The saved plan and final ownership ledger disagree.');
    const steps = db.prepare('SELECT * FROM installation_steps WHERE operation_id=? ORDER BY ordinal').all(op.operation_id) as unknown as Step[];
    if (steps.length !== envelope.plan.changes.length || steps.some((step, index) => step.relative_path !== envelope.plan.changes[index].path || canonicalJson(JSON.parse(step.before_json)) !== canonicalJson(envelope.plan.changes[index].before) || canonicalJson(JSON.parse(step.after_json)) !== canonicalJson(envelope.plan.changes[index].after))) fail('snapshot-drift', 'The saved plan and file journal disagree.');
    if (!detachedHooks.has(op.operation)) fail('recovery-required', `This CLI cannot validate the saved ${op.operation} operation.`);
    return envelope.plan;
}
function validateDetached(root: string, op: Operation, plan: DetachedInstallationPlan | null, phase: 'before' | 'after' | 'progress', temporaryFiles?: Record<string, FileState>): string[] {
    return plan ? detachedHooks.get(op.operation)!.validate(root, plan.metadata, phase, temporaryFiles) : [];
}
function assertDetachedPaths(root: string, plan: DetachedInstallationPlan, checkBefore = true, operation?: string, hypotheticalFallback = false): void {
    if ([...Object.keys(plan.afterLedger?.files ?? {}), ...(plan.afterLedger?.skillFiles ?? [])].some(p => isRetiredSkillPath(root, p))) fail('recovery-required', 'The saved final ownership uses retired .make-docs/agentics paths. Use a current reviewed Skill layout cutover.');
    if ((plan.skillScope || plan.copyFallbacks) && operation !== 'setup.skills.adopt') fail('ownership-unverified', 'Skill path policy is only valid for reviewed Skill adoption.');
    if (operation === 'setup.skills.adopt' && !plan.skillScope) fail('ownership-unverified', 'Adoption requires its complete selected Skill roots.');
    const selected = plan.afterLedger?.selections;
    const permittedDirectories = [path.join(root,'.agents/skills'),path.join(root,'.claude/skills'),path.join(root,'.codex/skills'),path.join(root,'.make-docs/agentics/skills'),path.join(os.homedir(),'.agents/skills'),path.join(os.homedir(),'.claude/skills'),path.join(os.homedir(),'.codex/skills'),path.join(os.homedir(),'.make-docs/agentics/skills'),getHarnessSkillDirectory('codex','global'),getHarnessSkillDirectory('claude-code','global')].map(p=>path.resolve(p));
    const canonicalDirectory = selected ? path.resolve(selected.skillScope === 'project' ? root : os.homedir(),getCanonicalSkillDirectory(selected)) : '';
    const skillRoots = plan.skillScope?.roots.map(p => {
        const absolute = path.resolve(root, p);
        if (!permittedDirectories.includes(path.dirname(absolute)) || !/^[a-z0-9][a-z0-9-]*$/.test(path.basename(absolute))) fail('ownership-unverified', `Invalid selected Skill root: ${p}`);
        if (!plan.afterLedger?.selections.selectedSkills.includes(path.basename(absolute))) fail('ownership-unverified', 'Skill root is not in the selected set.');
        assertSafeFilePath(root, p);
        return absolute;
    }) ?? [];
    const bootstrap = (plan.skillScope?.bootstrapPaths ?? []).map(p => {
        const router = plan.afterLedger?.routerOwnership?.routers[p];
        if (path.isAbsolute(p) || !router || router.relativePath !== p || router.routerClass !== 'bootstrap' || !plan.afterLedger?.files[p] || !/^(?:(?:docs(?:\/(?:designs|plans|prd|work))?|\.make-docs(?:\/system(?:\/(?:contracts|references|prompts|templates))?)?)\/)?(?:AGENTS|CLAUDE)\.md$/.test(p)) fail('ownership-unverified', `Unproved bootstrap router: ${p}`);
        return path.resolve(root, p);
    });
    const backups = (plan.skillScope?.backupRoots ?? []).map(p => {
        if (!/^\.make-docs\/backup\/skill-adoption-[a-f0-9]{12}$/.test(p) || (checkBefore && inspect(root, p).kind !== 'missing')) fail('ownership-unverified', 'Adoption backup must use its reviewed, initially absent root.');
        return path.resolve(root, p);
    });
    const checkSkillPath = (change: DetachedInstallationPlan['changes'][number]) => {
        const absolute = path.resolve(root, change.path);
        const identity = change.path === '.make-docs/config.yaml';
        const backup = backups.some(p => inside(p, absolute));
        if (!backup && isRetiredSkillPath(root,change.path) && change.after.kind !== 'missing') fail('recovery-required','This saved plan would recreate retired .make-docs/agentics paths. Preserve its evidence; use a current reviewed Skill layout cutover.');
        const parentOnly = [...skillRoots, ...bootstrap, ...backups, path.join(root, '.make-docs/config.yaml')].some(p => inside(absolute, p)) && change.before.kind !== 'file' && change.after.kind !== 'file' && change.before.kind !== 'symlink' && change.after.kind !== 'symlink';
        if (absolute === root || absolute === os.homedir() || (!identity && !parentOnly && !backup && !bootstrap.includes(absolute) && !skillRoots.some(p => inside(p, absolute)))) fail('ownership-unverified', `Path is outside the reviewed Skill roots: ${change.path}`);
        if (backup && (change.before.kind !== 'missing' || !['file', 'directory'].includes(change.after.kind))) fail('ownership-unverified', 'Adoption backups cannot replace existing content.');
        if (backup && change.after.kind === 'file' && !plan.changes.some(c => c.before.kind === 'file' && c.before.digest === change.after.digest && c.before.contentBase64 === change.after.contentBase64)) fail('ownership-unverified', 'Backup bytes do not match reviewed existing content.');
        if (identity && change.after.kind === 'file') {
            const config = parseDocument(Buffer.from(change.after.contentBase64 ?? '', 'base64').toString('utf8')).toJS() as {projectId?: string} | null;
            if (!config || config.projectId !== plan.afterLedger?.projectId) fail('ownership-unverified', 'The prepared config and final ledger identities disagree.');
        }
    };
    const prior = new Map<string, FileState>();
    const lastSteps = new Map<string, Step>();
    plan.changes.forEach((change, index) => lastSteps.set(change.path, {ordinal: index + 1, relative_path: change.path, before_json: JSON.stringify(change.before), after_json: JSON.stringify(change.after), applied: 0}));
    for (const change of plan.changes) {
        if (!change.path || change.path === '.' || (!plan.skillScope && path.isAbsolute(change.path)) || change.path.includes('\\') || change.path.split('/').slice(path.isAbsolute(change.path) ? 1 : 0).some(part => !part || part === '.' || part === '..')) fail('ownership-unverified', 'A saved operation path cannot escape its reviewed scope.');
        if (plan.skillScope) checkSkillPath(change);
        // A later, verified parent link subsumes removed children. Never walk that link to inspect the old tree.
        const removedUnderRecordedAncestor = !checkBefore && change.after.kind === 'missing' && subsumedByAncestor(root, lastSteps.get(change.path)!, lastSteps);
        const absentUnderOldLink = change.before.kind === 'missing' && underSavedBeforeLink(root,change.path,plan.changes);
        if (!hypotheticalFallback && !removedUnderRecordedAncestor && !absentUnderOldLink) assertSafeFilePath(root, change.path);
        for (const [index,state] of [change.before, change.after].entries()) {
            if (!['missing', 'directory', 'file', 'symlink'].includes(state.kind) || state.payload !== undefined) fail('ownership-unverified', 'Unsupported detached file state.');
            if (state.kind === 'file' && (typeof state.contentBase64 !== 'string' || sha(Buffer.from(state.contentBase64, 'base64')) !== state.digest || !Number.isInteger(state.mode) || state.mode! < 0 || state.mode! > 0o777)) fail('snapshot-drift', `Saved file bytes or mode are invalid: ${change.path}`);
            if (state.kind === 'symlink') {
                const target = index === 0 ? plan.skillScope?.beforeSymlinkTargets?.[change.path] ?? plan.skillScope?.symlinkTargets[change.path] : plan.skillScope?.symlinkTargets[change.path];
                const destination = target ? path.resolve(path.dirname(path.resolve(root,change.path)),target) : '';
                if (!target || state.target !== target || destination === path.resolve(root,change.path) || !skillRoots.includes(destination) || (index === 1 && path.dirname(destination) !== canonicalDirectory)) fail('ownership-unverified', 'Only the exact reviewed native Skill link target is allowed.');
            }
        }
        const preceding = prior.get(change.path);
        if (preceding && canonicalJson(preceding) !== canonicalJson(change.before)) fail('snapshot-drift', `Non-contiguous file plan: ${change.path}`);
        if (checkBefore && !preceding && !absentUnderOldLink && !matches(root, change.path, change.before)) fail('snapshot-drift', `Input changed before preparation: ${change.path}`);
        prior.set(change.path, change.after);
    }
    for (const [exposure, fallback] of Object.entries(plan.copyFallbacks ?? {})) {
        const trigger = plan.changes.find(c => c.path === exposure && c.after.kind === 'symlink');
        const selected = plan.selectedCopyFallbacks?.includes(exposure);
        if ((!selected && (!trigger || trigger.before.kind !== 'missing')) || !fallback.changes.length || fallback.changes.some(c => !inside(path.resolve(root, exposure), path.resolve(root, c.path)) || c.before.kind !== 'missing' || !['file', 'directory'].includes(c.after.kind)) || fallback.ledgerEntry.skillExposure?.mode !== 'copy-mirror') fail('ownership-unverified', 'Invalid predeclared native copy fallback.');
        if (selected && canonicalJson(plan.afterLedger?.files[exposure]) !== canonicalJson(fallback.ledgerEntry)) fail('snapshot-drift', 'Selected copy fallback and ledger disagree.');
        assertDetachedPaths(root, {...plan, changes: fallback.changes, copyFallbacks: undefined}, false, operation, true);
    }
}
/** Persist a sealed plan without creating config, project backup files, or changing content. */
export function prepareDetachedInstallationOperation(projectRoot: string, operation: string, build: () => DetachedInstallationPlan, storeRoot?: string) {
    const root = canonicalInstallationPath(projectRoot);
    if (!lstatSync(root, {throwIfNoEntry: false})?.isDirectory()) fail('ownership-unverified', 'Layout preparation requires an existing project directory.');
    const hooks = detachedHooks.get(operation);
    if (!hooks) fail('recovery-required', 'No validator is registered for this operation.');
    const lock = acquireInstallationLock(root, storeRoot);
    try {
        if (operation === 'setup.skills.adopt') held.get(root)!.globalLock = acquireGlobalAssetLock(root);
        const plan = build();
        if (plan.selectedCopyFallbacks?.length) fail('ownership-unverified', 'A new adoption cannot claim an executor-selected fallback.');
        const issues = hooks.validate(root, plan.metadata, 'before');
        if (issues.length) fail('snapshot-drift', issues.join('\n'));
        assertDetachedPaths(root, plan, true, operation);
        assertNoOtherPendingPathClaims(root, [...plan.changes.map(c => c.path), ...Object.keys(plan.afterLedger?.files ?? {})], lock.storeRoot);
        const id = randomUUID();
        withInstallationDatabase(root, db => transaction(db, () => {
            const row = bindCheckout(db, root, operation === 'setup.skills.adopt' ? plan.afterLedger?.projectId : undefined);
            const pending = db.prepare("SELECT operation_id FROM installation_operations WHERE checkout_id=? AND status='pending'").get(row.checkout_id) as {operation_id: string} | undefined;
            if (pending) fail('recovery-required', `Operation ${pending.operation_id} is pending. Inspect project state status.`);
            const ledger = (db.prepare('SELECT manifest_json FROM installation_ledgers WHERE checkout_id=?').get(row.checkout_id) as {manifest_json: string} | undefined)?.manifest_json ?? null;
            const afterLedger = plan.afterLedger === undefined ? ledger : plan.afterLedger === null ? null : JSON.stringify(plan.afterLedger);
            if (afterLedger) {
                const validated = validateAndMigrateManifest(JSON.parse(afterLedger), 'Prepared layout installation ledger');
                if (validated.projectId !== row.project_id) fail('ownership-unverified', 'The prepared ledger belongs to another project.');
            }
            db.prepare("INSERT INTO installation_operations (operation_id,checkout_id,operation,status,before_ledger,after_ledger,created_at,finished_at,plan_complete) VALUES (?,?,?,'pending',?,?,?,NULL,1)").run(id, row.checkout_id, operation, ledger, afterLedger, now());
            for (const [index, change] of plan.changes.entries()) db.prepare('INSERT INTO installation_steps VALUES (?,?,?,?,?,0)').run(id, index + 1, change.path, JSON.stringify(change.before), JSON.stringify(change.after));
            db.prepare("INSERT INTO installation_migration_records VALUES (?,'snapshot',?,?)").run(row.checkout_id, `detached:${id}`, JSON.stringify({digest: sha(canonicalJson(plan)), plan}));
            if (operation === 'setup.skills.adopt') db.prepare("INSERT INTO installation_migration_records VALUES (?,'snapshot',?,?)").run(row.checkout_id, `detached-original:${id}`, JSON.stringify({digest: sha(canonicalJson(plan)), plan}));
        }), {storeRoot: lock.storeRoot});
        // Read the committed receipt back before giving a mover instructions.
        withInstallationDatabase(root, db => {
            const op = db.prepare('SELECT * FROM installation_operations WHERE operation_id=?').get(id) as unknown as Operation;
            if (!op || !detachedSnapshot(db, op)) fail('recovery-required', 'The prepared operation could not be read back.');
        }, {storeRoot: lock.storeRoot, readOnly: true});
        assertInstallationLockActive(lock);
        return {schemaVersion: 1 as const, operationId: id, status: 'pending' as const, mode: plan.mode, reviewDigest: plan.reviewDigest, nextAction: hooks.nextAction(root, id, plan.mode)};
    } finally { releaseInstallationLock(lock); }
}
export function readDetachedInstallationOperation(projectRoot: string, operationId: string, operation: string, storeRoot?: string) {
    const root = canonicalInstallationPath(projectRoot);
    return withInstallationDatabase(root, db => {
        const row = checkout(db, root);
        if (!row) fail('ownership-unverified', 'No checkout binding for this operation.');
        assertCheckoutIdentity(row, root);
        const op = db.prepare('SELECT * FROM installation_operations WHERE operation_id=? AND checkout_id=?').get(operationId, row.checkout_id) as unknown as Operation | undefined;
        if (!op || op.operation !== operation) fail('ownership-unverified', 'This operation does not belong to the requested layout and checkout.');
        const plan = detachedSnapshot(db, op);
        if (!plan) fail('recovery-required', 'The complete saved operation plan is absent.');
        return {status: op.status, plan};
    }, {storeRoot, readOnly: true});
}
function fail(code: ConstructorParameters<typeof InstallationStateError>[0], message: string, issue?: StoreIssue): never { throw new InstallationStateError(code, message, issue); }
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
    if (inside(project, store)) {
        const issue = makeStoreIssue('unsafe-path', store, 'validate Store root', new Error('The Make Docs Store must be outside the project.'));
        fail('store-unavailable', formatStoreIssue(issue), issue);
    }
    for (const suffix of ['store.db', 'store.db-wal', 'store.db-shm', 'store-access.lock', 'removal.lock', 'installation-bootstrap.lock', 'installation-lease-recovery.lock']) {
        const child = path.join(store, suffix);
        try {
            if (lstatSync(child, { throwIfNoEntry: false })?.isSymbolicLink()) {
                const issue = makeStoreIssue('unsafe-path', child, 'validate Store path', new Error('Symbolic links are not allowed for Store state.'));
                fail('store-unavailable', formatStoreIssue(issue), issue);
            }
        }
        catch (error) {
            if (error instanceof InstallationStateError)
                throw error;
            const issue = makeStoreIssue('io-error', child, 'validate Store path', error);
            fail('store-unavailable', formatStoreIssue(issue), issue);
        }
        if (!inside(store, path.resolve(child))) {
            const issue = makeStoreIssue('unsafe-path', child, 'validate Store path', new Error('A derived Store path escapes the Store.'));
            fail('store-unavailable', formatStoreIssue(issue), issue);
        }
    }
    return store;
}
function acquireStorePreparationLease(storeRoot: string, lockPath: string, token: string): import('node:fs').Stats {
    const started = Date.now();
    const deadline = started + STORE_OWNER_WAIT_MS;
    let attempts = 0;
    while (true) {
        try {
            const result = tryCreateExclusiveStoreLease(lockPath, { token, pid: process.pid, hostname: os.hostname(), startedAt: new Date().toISOString() });
            if (result.created)
                return result.stat;
            throw Object.assign(new Error('The Store preparation lock exists.'), { code: 'EEXIST' });
        }
        catch (error) {
            if (error instanceof StoreUnavailableError)
                throw error;
            if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
                const issue = makeStoreIssue('io-error', lockPath, 'create Store preparation lock', error, { attempts: attempts + 1, waitedMs: Date.now() - started });
                return fail('store-unavailable', formatStoreIssue(issue), issue);
            }
            if (Date.now() >= deadline) {
                const issue: StoreIssue = { code: 'contention-timeout', path: lockPath, operation: 'wait for Store preparation', retryable: true, attempts: attempts + 1, waitedMs: Date.now() - started, cause: 'The Store preparation owner is still active.' };
                return fail('writer-active', formatStoreIssue(issue), issue);
            }
            const release = acquireStoreAccess(storeRoot, false, Math.max(0, deadline - Date.now()));
            release();
            attempts++;
        }
    }
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
    try {
        mkdirSync(storeRoot, { recursive: true, mode: 0o700 });
    }
    catch (error) {
        const issue = makeStoreIssue('io-error', storeRoot, 'create Store directory', error);
        fail('store-unavailable', formatStoreIssue(issue), issue);
    }
    let release: () => void;
    try {
        release = acquireStoreAccess(storeRoot);
    }
    catch (error) {
        if (error instanceof StoreUnavailableError && error.issue.code === 'owner-unverified' && path.basename(error.issue.path) === 'installation-bootstrap.lock') {
            recoverDeadStoreLeases(storeRoot);
            release = acquireStoreAccess(storeRoot);
        }
        else {
            throw error;
        }
    }
    try {
        const current = classifyStoreCheckpoint9State(storeRoot);
        if (current.state === 'supported-current')
            return;
        if (current.state !== 'supported-legacy' && current.state !== 'absent') {
            const issue = ('issue' in current ? current.issue : undefined) ?? {
                code: current.state === 'corrupt' ? 'corrupt' as const : current.state === 'newer-unknown' ? 'schema-newer' as const : 'schema-unknown' as const,
                path: current.databasePath,
                operation: 'prepare',
                retryable: false,
                attempts: 1,
                waitedMs: 0,
                cause: current.reason,
            };
            fail('store-unavailable', formatStoreIssue(issue), issue);
        }
    }
    finally {
        release();
    }
    const lockPath = path.join(storeRoot, 'installation-bootstrap.lock');
    const token = randomUUID();
    const lockStat = acquireStorePreparationLease(storeRoot, lockPath, token);
    try {
        validateInstallationStoreRoot(projectRoot, storeRoot);
        const beforeDrain = classifyStoreCheckpoint9State(storeRoot);
        if (beforeDrain.state === 'supported-current')
            return;
        if (beforeDrain.state !== 'absent' && beforeDrain.state !== 'supported-legacy') {
            const issue = ('issue' in beforeDrain ? beforeDrain.issue : undefined) ?? makeStoreIssue(
                beforeDrain.state === 'corrupt' ? 'corrupt' : beforeDrain.state === 'newer-unknown' ? 'schema-newer' : 'schema-unknown',
                beforeDrain.databasePath,
                'prepare Store',
                new Error(beforeDrain.reason),
            );
            fail('store-unavailable', formatStoreIssue(issue), issue);
        }
        waitForStoreAccessToDrain(storeRoot);
        const c = classifyStoreCheckpoint9State(storeRoot);
        if (!['absent', 'supported-current', 'supported-legacy'].includes(c.state)) {
            const issue = ('issue' in c ? c.issue : undefined) ?? makeStoreIssue(
                c.state === 'corrupt' ? 'corrupt' : c.state === 'newer-unknown' ? 'schema-newer' : 'schema-unknown',
                c.databasePath,
                'prepare Store',
                new Error(c.reason),
            );
            fail('store-unavailable', formatStoreIssue(issue), issue);
        }
        const db = openStoreSqliteConnection(getStoreDatabasePath(storeRoot), {}, 'prepare');
        try {
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
        }
    }
    finally {
        const current = lstatSync(lockPath, { throwIfNoEntry: false });
        if (current?.isFile() && current.dev === lockStat.dev && current.ino === lockStat.ino) {
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
    const databasePath = getStoreDatabasePath(store);
    try {
        if (!lstatSync(databasePath, { throwIfNoEntry: false }))
            return fail('store-unavailable', 'The Store is absent. No project files changed. Run setup before this command.');
    }
    catch (error) {
        if (error instanceof InstallationStateError)
            throw error;
        const issue = makeStoreIssue('io-error', databasePath, options.readOnly ? 'read Store database path' : 'write Store database path', error);
        return fail('store-unavailable', formatStoreIssue(issue), issue);
    }
    const release = acquireStoreAccess(store);
    let db: StoreDatabase;
    try {
        db = openStoreSqliteConnection(databasePath, { readOnly: options.readOnly ?? false }, options.readOnly ? 'read' : 'write');
    }
    catch (e) {
        release();
        throw e;
    }
    try {
        try {
            return fn(db);
        }
        catch (error) {
            if (!isSqliteContention(error))
                throw error;
            throw new StoreUnavailableError(makeStoreIssue('contention-timeout', databasePath, options.readOnly ? 'read Store data' : 'write Store data', error, { retryable: true, waitedMs: STORE_BUSY_TIMEOUT_MS }));
        }
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
    prepareStore(root, store);
    const releaseAccess = acquireStoreAccess(store);
    try {
        const token = randomUUID();
        const started = Date.now();
        const deadline = started + STORE_OWNER_WAIT_MS;
        let attempt = 0;
        while (true) {
            const previous = withInstallationDatabase(root, db => transaction(db, () => {
                const machine = db.prepare("SELECT operation_id FROM tool_operations WHERE status='pending' LIMIT 1").get() as {
                    operation_id: string;
                } | undefined;
                if (machine)
                    fail('recovery-required', `Tool operation ${machine.operation_id} is pending. Inspect project state status before managed changes.`);
                const owner = db.prepare('SELECT pid,hostname FROM installation_locks WHERE root_path=?').get(root) as {
                    pid: number;
                    hostname: string;
                } | undefined;
                if (!owner)
                    db.prepare('INSERT INTO installation_locks VALUES (?,?,?,?,?)').run(root, token, process.pid, os.hostname(), now());
                return owner;
            }), { storeRoot: store });
            if (!previous)
                break;
            if (previous.hostname !== os.hostname())
                fail('ownership-unverified', `The checkout writer belongs to another or unknown host (${previous.hostname}). No project files changed.`);
            try {
                process.kill(previous.pid, 0);
            }
            catch (error) {
                if ((error as NodeJS.ErrnoException).code === 'ESRCH')
                    fail('recovery-required', `Checkout writer ${previous.pid} stopped. Inspect project state status before recovery. No project files changed.`);
                fail('ownership-unverified', `Make Docs cannot verify checkout writer ${previous.pid}. No project files changed.`);
            }
            if (Date.now() >= deadline)
                fail('writer-active', `Make Docs waited ${Math.ceil((Date.now() - started) / 1000)} seconds for checkout writer ${previous.pid}. The writer is still active. No project files changed. Run the command after it finishes.`);
            waitForStoreRetry(attempt++, deadline);
        }
        const lock = { projectRoot: root, storeRoot: store, token, lockPath: `${getStoreDatabasePath(store)}#installation-lock/${sha(root)}`, depth: 1, releaseAccess };
        held.set(root, lock);
        return lock;
    }
    catch (error) {
        releaseAccess();
        throw error;
    }
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
    const c = classifyStoreCheckpoint9State(store);
    if (c.state === 'supported-legacy' || c.state === 'absent')
        return null;
    if (c.state !== 'supported-current') {
        const issue = c.issue ?? {
            code: c.state === 'corrupt' ? 'corrupt' as const : c.state === 'newer-unknown' ? 'schema-newer' as const : 'schema-unknown' as const,
            path: c.databasePath,
            operation: 'inspect',
            retryable: false,
            attempts: 1,
            waitedMs: 0,
            cause: c.reason,
        };
        return fail('store-unavailable', formatStoreIssue(issue), issue);
    }
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
    const paths = Object.keys(manifest.files);
    if (paths.some(p => path.isAbsolute(p))) {
        const lock = held.get(root)!;
        if (!lock.globalLock) lock.globalLock = acquireGlobalAssetLock(root);
        assertGlobalAssetLockActive(lock.globalLock);
    }
    assertNoOtherPendingPathClaims(root, paths, op.storeRoot);
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
    let projectMutationStarted = false;
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
        projectMutationStarted = true;
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
        if (e instanceof StoreUnavailableError)
            e.message = formatStoreIssue(e.issue, { projectMutationStarted, ...(opId ? { pendingOperationId: opId } : {}) });
        else if (e instanceof InstallationStateError && e.issue)
            e.message = formatStoreIssue(e.issue, { projectMutationStarted, ...(opId ? { pendingOperationId: opId } : {}) });
        else if (opId && e instanceof Error)
            e.message += projectMutationStarted
                ? ` Project files may have changed. Pending operation: ${opId}. Run make-docs project state status before recovery.`
                : ` No project files changed. Pending operation: ${opId}. Run make-docs project state status.`;
        throw e;
    }
    finally {
        active.delete(root);
        releaseInstallationLock(lock);
    }
}
function targetPath(root: string, relative: string): string {
    if (path.isAbsolute(relative)) {
        const target = path.join(canonicalInstallationPath(path.dirname(relative)),path.basename(relative));
        const nativeDirectories = [getHarnessSkillDirectory('codex','global'),getHarnessSkillDirectory('claude-code','global')];
        const allowed = ['.agents', '.claude', '.codex'].some(p => canonicalInstallationPath(path.join(os.homedir(), p)) === target) || ['.agents/skills', '.codex/skills', '.claude/skills', '.make-docs/agentics'].some(p => inside(canonicalInstallationPath(path.join(os.homedir(), p)), target)) || nativeDirectories.some(p=>inside(canonicalInstallationPath(p),target) || canonicalInstallationPath(path.dirname(p)) === target) || inside(path.join(active.get(root)?.storeRoot ?? resolveStoreRoot(), 'agentics'), target);
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
    if (path.isAbsolute(relative)) {
        let lexicalParent = path.dirname(relative);
        const home = os.homedir();
        while (lexicalParent !== path.dirname(lexicalParent) && lexicalParent !== home) {
            if (lstatSync(lexicalParent, {throwIfNoEntry: false})?.isSymbolicLink()) fail('ownership-unverified', `Symbolic-link parent: ${lexicalParent}`);
            lexicalParent = path.dirname(lexicalParent);
        }
    }
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
        return { kind: 'directory', mode: st.mode & 0o777 };
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
    if (isRetiredSkillPath(root,relativePath) && after.kind !== 'missing') fail('recovery-required','The retired .make-docs/agentics tree is read/remove-only. Review setup skills --adopt-existing --dry-run for layout cutover.');
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
    assertNoOtherPendingPathClaims(root, [relativePath], op.storeRoot);
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
interface AtomicWriteRecord {
    operationId: string;
    ordinal: number;
    temporary: string;
    target: string;
    digest: string;
    mode: number;
    device?: string;
    inode?: string;
}
function atomicTemporaryPath(operationId: string, ordinal: number, target: string): string {
    return path.posix.join(path.posix.dirname(target), `.make-docs-${operationId}-${ordinal}.tmp`);
}
function atomicTemporaryStates(db: StoreDatabase, root: string, op: Operation, steps: Step[]): Record<string, FileState> {
    const temporary: Record<string, FileState> = {};
    const rows = db.prepare("SELECT record_json FROM installation_migration_records WHERE checkout_id=? AND kind='backup' AND record_id LIKE ?").all(op.checkout_id, `atomic:${op.operation_id}:%`) as {record_json: string}[];
    for (const row of rows) {
        const record = JSON.parse(row.record_json) as AtomicWriteRecord;
        const step = steps.find(candidate => candidate.ordinal === record.ordinal);
        if (!step || record.operationId !== op.operation_id || record.target !== step.relative_path || record.temporary !== atomicTemporaryPath(op.operation_id, step.ordinal, step.relative_path)) fail('snapshot-drift', 'Temporary file ownership disagrees with the saved operation.');
        const states: FileState[] = [JSON.parse(step.before_json), JSON.parse(step.after_json)];
        const desired = states.find(state => state.kind === 'file' && state.digest === record.digest && state.mode === record.mode && typeof state.contentBase64 === 'string');
        if (!desired) fail('snapshot-drift', 'Temporary file payload does not belong to the saved operation.');
        const target = assertSafeFilePath(root, record.temporary);
        const stat = lstatSync(target, {throwIfNoEntry: false});
        if (!stat) continue;
        if (!stat.isFile() || stat.isSymbolicLink()) fail('snapshot-drift', `Temporary file was replaced: ${record.temporary}`);
        const bytes = readFileSync(target), intended = Buffer.from(desired.contentBase64!, 'base64');
        const mode = stat.mode & 0o777;
        if (sha(intended) !== record.digest || bytes.length > intended.length || !bytes.equals(intended.subarray(0, bytes.length))) fail('snapshot-drift', `Temporary file was changed: ${record.temporary}`);
        if (record.device !== undefined || record.inode !== undefined) {
            if (record.device !== String(stat.dev) || record.inode !== String(stat.ino)) fail('snapshot-drift', `Temporary file identity changed: ${record.temporary}`);
        } else if (bytes.length !== 0 || mode !== 0o600) fail('snapshot-drift', `Unproved temporary file creation: ${record.temporary}`);
        if (mode !== 0o600 && !(bytes.length === intended.length && mode === record.mode)) fail('snapshot-drift', `Temporary file mode changed: ${record.temporary}`);
        temporary[record.temporary] = {kind: 'file', digest: sha(bytes), mode};
    }
    return temporary;
}
function cleanAtomicTemporaryFiles(root: string, op: Operation, steps: Step[], lock: InstallationLock): void {
    const temporary = withInstallationDatabase(root, db => atomicTemporaryStates(db, root, op, steps), {storeRoot: lock.storeRoot, readOnly: true});
    for (const [relative, expected] of Object.entries(temporary)) {
        assertInstallationLockActive(lock);
        if (!matches(root, relative, expected)) fail('snapshot-drift', `Temporary file changed before cleanup: ${relative}`);
        unlinkSync(assertSafeFilePath(root, relative));
    }
}
function writeAtomicDetachedFile(root: string, relative: string, state: FileState, bytes: Buffer, context: {op: Operation; step: Step; expected: FileState; lock: InstallationLock}): void {
    const {op, step, lock, expected} = context;
    const temporary = atomicTemporaryPath(op.operation_id, step.ordinal, relative);
    const staged = assertSafeFilePath(root, temporary), target = assertSafeFilePath(root, relative);
    if (lstatSync(staged, {throwIfNoEntry: false})) fail('snapshot-drift', `Temporary destination is occupied: ${temporary}`);
    const record: AtomicWriteRecord = {operationId: op.operation_id, ordinal: step.ordinal, temporary, target: relative, digest: state.digest!, mode: state.mode ?? 0o644};
    const save = () => withInstallationDatabase(root, db => db.prepare("INSERT INTO installation_migration_records VALUES (?,'backup',?,?) ON CONFLICT(checkout_id,kind,record_id) DO UPDATE SET record_json=excluded.record_json").run(op.checkout_id, `atomic:${op.operation_id}:${step.ordinal}`, JSON.stringify(record)), {storeRoot: lock.storeRoot});
    save(); // Intent and the exclusive temporary path precede file creation.
    assertInstallationLockActive(lock);
    const fd = openSync(staged, 'wx', 0o600);
    try {
        fsyncSync(fd);
        const stat = fstatSync(fd);
        record.device = String(stat.dev); record.inode = String(stat.ino);
        save(); // Inode proof precedes every payload byte.
        writeFileSync(fd, bytes);
        fsyncSync(fd);
    } finally {closeSync(fd);}
    if (sha(readFileSync(staged)) !== state.digest) fail('snapshot-drift', 'Staged replacement bytes changed.');
    chmodSync(staged, state.mode ?? 0o644);
    assertInstallationLockActive(lock);
    if (!matches(root, relative, expected)) fail('snapshot-drift', `File changed before atomic replacement: ${relative}`);
    renameSync(staged, target);
    const directory = openSync(path.dirname(target), 'r');
    try {fsyncSync(directory);} finally {closeSync(directory);}
}
function restoreState(root: string, relative: string, state: FileState, atomic?: {op: Operation; step: Step; expected: FileState; lock: InstallationLock}): void {
    if (isRetiredSkillPath(root,relative) && state.kind !== 'missing') fail('recovery-required','Recovery cannot recreate retired .make-docs/agentics paths. Preserve the saved bytes and inspect forward resume.');
    const target = assertSafeFilePath(root, relative);
    const current = inspect(root, relative);
    let fileBytes: Buffer | undefined;
    if (state.kind === 'file') {
        if (state.contentBase64 !== undefined) fileBytes = Buffer.from(state.contentBase64, 'base64');
        else {
            if (!state.payload) fail('recovery-required', 'Recovery payload reference is absent.');
            const payload = assertSafeFilePath(root, state.payload);
            if (lstatSync(payload).isSymbolicLink()) fail('snapshot-drift', 'Recovery payload changed.');
            fileBytes = readFileSync(payload);
        }
        if (sha(fileBytes) !== state.digest) fail('snapshot-drift', 'Recovery payload changed.');
    }
    if (state.kind === 'missing') {
        if (current.kind === 'directory')
            rmdirSync(target);
        else if (current.kind !== 'missing')
            unlinkSync(target);
        return;
    }
    if (state.kind === 'directory') {
        mkdirSync(target, { recursive: true });
        if (state.mode !== undefined) chmodSync(target, state.mode);
        return;
    }
    if (state.kind === 'file' && atomic) {
        if (current.kind !== 'missing' && current.kind !== 'file') fail('ownership-unverified', 'Atomic layout writes require a regular file or missing destination.');
        writeAtomicDetachedFile(root, relative, state, fileBytes!, atomic);
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
    const fd = openSync(target, 'w', state.mode ?? 0o644);
    try {
        writeFileSync(fd, fileBytes!);
        fsyncSync(fd);
    }
    finally {
        closeSync(fd);
    }
    chmodSync(target, state.mode ?? 0o644);
}
function selectDetachedCopyFallback(root: string, op: Operation, plan: DetachedInstallationPlan, step: Step, error: unknown, lock: InstallationLock): boolean {
    const fallback = plan.copyFallbacks?.[step.relative_path];
    const from = JSON.parse(step.before_json) as FileState, to = JSON.parse(step.after_json) as FileState;
    if (op.operation !== 'setup.skills.adopt' || !fallback || plan.selectedCopyFallbacks?.includes(step.relative_path) || from.kind !== 'missing' || to.kind !== 'symlink' || error instanceof InstallationStateError || !['EPERM', 'EACCES', 'ENOSYS', 'ENOTSUP', 'EOPNOTSUPP'].includes((error as NodeJS.ErrnoException)?.code ?? '')) return false;
    assertInstallationLockActive(lock);
    if (!matches(root, step.relative_path, from)) fail('snapshot-drift', 'Failed symlink creation changed the target; no copy fallback is safe.');
    const replacement: DetachedInstallationPlan = structuredClone(plan);
    const index = step.ordinal - 1;
    if (canonicalJson(replacement.changes[index]) !== canonicalJson({path: step.relative_path, before: from, after: to})) fail('snapshot-drift', 'Fallback trigger no longer matches its sealed plan.');
    replacement.changes.splice(index, 1, ...fallback.changes);
    replacement.selectedCopyFallbacks = [...(replacement.selectedCopyFallbacks ?? []), step.relative_path];
    if (!replacement.afterLedger) fail('ownership-unverified', 'Copy fallback has no final ledger.');
    replacement.afterLedger.files[step.relative_path] = fallback.ledgerEntry;
    assertDetachedPaths(root, replacement, false, op.operation);
    validateAndMigrateManifest(replacement.afterLedger, 'Prepared copy fallback ledger');
    withInstallationDatabase(root, db => transaction(db, () => {
        const current = db.prepare('SELECT * FROM installation_operations WHERE operation_id=?').get(op.operation_id) as unknown as Operation;
        if (current.status !== 'pending' || canonicalJson(detachedSnapshot(db, current)) !== canonicalJson(plan)) fail('snapshot-drift', 'Pending operation changed before fallback selection.');
        db.prepare('DELETE FROM installation_steps WHERE operation_id=?').run(op.operation_id);
        for (const [i, change] of replacement.changes.entries()) db.prepare('INSERT INTO installation_steps VALUES (?,?,?,?,?,0)').run(op.operation_id, i + 1, change.path, JSON.stringify(change.before), JSON.stringify(change.after));
        db.prepare('UPDATE installation_operations SET after_ledger=? WHERE operation_id=?').run(JSON.stringify(replacement.afterLedger), op.operation_id);
        db.prepare("UPDATE installation_migration_records SET record_json=? WHERE checkout_id=? AND kind='snapshot' AND record_id=?").run(JSON.stringify({digest: sha(canonicalJson(replacement)), plan: replacement}), op.checkout_id, `detached:${op.operation_id}`);
    }), {storeRoot: lock.storeRoot});
    return true;
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
            const pending = db.prepare("SELECT * FROM installation_operations WHERE checkout_id=? AND status='pending'").get(row.checkout_id) as unknown as Operation | undefined;
            const prepared = pending ? detachedSnapshot(db, pending) : null;
            const manifest = (db.prepare('SELECT manifest_json FROM installation_ledgers WHERE checkout_id=?').get(row.checkout_id) as {
                manifest_json: string;
            } | undefined)?.manifest_json;
            return { ...base, projectId: row.project_id, checkoutId: row.checkout_id, storeAvailable: true, installationVersion: manifest ? JSON.parse(manifest).packageVersion : null, pendingOperation: pending ? {operation_id: pending.operation_id, operation: pending.operation, ...(prepared ? {mode: prepared.mode, reviewDigest: prepared.reviewDigest} : {})} : null, status: lock && !isDead(lock.pid, lock.hostname) ? 'writer-active' : pending ? 'recovery-required' : manifest ? 'ready' : 'unregistered', nextAction: pending ? prepared ? detachedHooks.get(pending.operation)!.nextAction(root, pending.operation_id, prepared.mode) : `make-docs project state recover ${pending.operation_id} --resume --dry-run --target-root ${JSON.stringify(root)}` : lock ? 'Wait for the active writer.' : manifest ? 'No recovery is required.' : 'Review setup before installing.' };
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
        const detached = detachedSnapshot(db, op);
        if (detached) assertDetachedPaths(root, detached, false, op.operation);
        const temporary = detached ? atomicTemporaryStates(db, root, op, steps) : undefined;
        return { op, steps, detached, temporary };
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
        const lastSteps = new Map([...byPath].map(([p, items]) => [p, items[items.length - 1]]));
        for (const [relative, steps] of byPath) {
            const current = subsumedByAncestor(root, steps[steps.length - 1], lastSteps) || (state.detached && JSON.parse(steps[0].before_json).kind === 'missing' && underSavedBeforeLink(root,relative,state.detached.changes)) ? { kind: "missing" as const } : inspect(root, relative);
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
        conflicts.push(...validateDetached(root, state.op, state.detached, state.detached?.mode === 'manual' && mode === 'resume' ? 'after' : 'progress', state.temporary));
        return { ordered, remaining, conflicts };
    };
    const state = read();
    if (state.op.status === 'pending' && mode === 'resume' && state.steps.some(step=>isRetiredSkillPath(root,step.relative_path) && JSON.parse(step.after_json).kind !== 'missing')) return {schemaVersion:1 as const,operationId,mode,dryRun,status:'blocked',changes:[],conflicts:['This saved plan writes retired .make-docs/agentics paths. Preserve its Store evidence and saved bytes; a current reviewed Skill layout cutover is required.']};
    if (state.op.status === 'pending' && mode === 'rollback' && state.steps.some(step=>isRetiredSkillPath(root,step.relative_path) && JSON.parse(step.before_json).kind !== 'missing')) return {schemaVersion:1 as const,operationId,mode,dryRun,status:'blocked',changes:[],conflicts:['Rollback would recreate retired .make-docs/agentics paths. This cutover supports forward resume only. Preserve the reviewed backup and Store bytes; inspect --resume --dry-run.']};
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
        if (state.op.operation === 'setup.skills.adopt' || state.steps.some(step => path.isAbsolute(step.relative_path)))
            held.get(root)!.globalLock = acquireGlobalAssetLock(root);
        let current = read();
        if (current.op.status !== 'pending')
            return { ...result, status: current.op.status };
        assertNoOtherPendingPathClaims(root, [...current.steps.map(s => s.relative_path), ...Object.keys(current.op.after_ledger ? JSON.parse(current.op.after_ledger)?.files ?? {} : {})], store);
        const locked = select(current);
        if (locked.conflicts.length)
            fail('snapshot-drift', `Recovery input changed: ${locked.conflicts.join(', ')}`);
        if (current.detached) cleanAtomicTemporaryFiles(root, current.op, current.steps, lock);
        let pendingSteps = current.detached?.mode === 'manual' && mode === 'resume' ? [] : [...locked.remaining];
        let checkedCutoverDestinations = false;
        while (pendingSteps.length) {
            const s = pendingSteps.shift()!;
            assertInstallationLockActive(lock);
            if (!checkedCutoverDestinations && mode === 'resume' && current.detached?.skillScope && isRetiredSkillPath(root, s.relative_path)) {
                const cleanupCheck = detachedHooks.get(current.op.operation)?.beforeRetiredCleanup;
                if (!cleanupCheck) fail('recovery-required', 'This CLI cannot verify all standard Skill destinations before retired source cleanup.');
                const issues = cleanupCheck(root, current.detached.metadata);
                if (issues.length) fail('snapshot-drift', issues.join('\n'));
                const final = new Map(current.steps.map(step => [step.relative_path, step]));
                for (const step of final.values()) {
                    if (isRetiredSkillPath(root, step.relative_path) || subsumedByAncestor(root, step, final)) continue;
                    if (!matches(root, step.relative_path, JSON.parse(step.after_json))) fail('snapshot-drift', `Standard Skill destination must match before retired source cleanup: ${step.relative_path}`);
                }
                checkedCutoverDestinations = true;
            }
            const from: FileState = JSON.parse(mode === 'resume' ? s.before_json : s.after_json);
            const to: FileState = JSON.parse(mode === 'resume' ? s.after_json : s.before_json);
            if (matches(root, s.relative_path, to))
                continue;
            if (!matches(root, s.relative_path, from))
                fail('snapshot-drift', `Recovery input changed: ${s.relative_path}`);
            try {
                restoreState(root, s.relative_path, to, current.detached ? {op: current.op, step: s, expected: from, lock} : undefined);
            } catch (error) {
                if (mode !== 'resume' || !current.detached || !selectDetachedCopyFallback(root, current.op, current.detached, s, error, lock)) throw error;
                current = read();
                const reselected = select(current);
                if (reselected.conflicts.length) fail('snapshot-drift', `Fallback inputs changed: ${reselected.conflicts.join(', ')}`);
                pendingSteps = [...reselected.remaining];
                continue;
            }
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
        const finalIssues = validateDetached(root, current.op, current.detached, mode === 'rollback' ? 'before' : 'after');
        if (finalIssues.length) fail('snapshot-drift', finalIssues.join('\n'));
        if (mode === 'resume' && current.detached?.skillScope && current.detached.afterLedger) for (const exposure of Object.keys(current.detached.skillScope.symlinkTargets)) {
            const entry = current.detached.afterLedger.files[exposure];
            const finalStep = finalSteps.get(exposure);
            if (!entry && finalStep && JSON.parse(finalStep.after_json).kind === 'missing' && matches(root, exposure, {kind: 'missing'})) continue;
            const recorded = entry?.skillExposure?.mode;
            if (!recorded || inspect(root, exposure).kind !== (recorded === 'symlink' ? 'symlink' : 'directory')) fail('snapshot-drift', 'Final native exposure and ownership mode disagree.');
        }
        withInstallationDatabase(root, db => commitOperation(db, operationId, mode === 'rollback'), { storeRoot: store });
        return { ...result, changes: current.steps.map(s => ({path: s.relative_path, to: JSON.parse(mode === 'resume' ? s.after_json : s.before_json).kind})), status: mode === 'resume' ? 'completed' : 'rolled-back' };
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
    const rel = path.relative(path.resolve(root, candidate.relative_path), path.resolve(root, step.relative_path));
    if (!rel || rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel))
        continue;
    const after: FileState = JSON.parse(candidate.after_json);
    if ((after.kind === 'missing' || after.kind === 'symlink') && matches(root, candidate.relative_path, after))
        return true;
} return false; }
