import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { previewProjectLayout } from '../src/layout-plan';
import * as layoutPlanner from '../src/layout-plan';
import { applyProjectLayout, prepareProjectLayout, presentProjectLayout } from '../src/store/layout-state';
import { acquireInstallationLock, readDetachedInstallationOperation, readInstallationStatus, recoverInstallationOperation, releaseInstallationLock, withInstallationDatabase, withInstallationOperation } from '../src/store/installation-state';
import { invokeOperation, listOperations } from '../src/operations/registry';
import { createExecutionContext } from '../src/operations/context';
import { runProjectCommand } from '../src/run/root-operations';
import { projectLayoutLedger } from '../src/store/layout-ledger';
import { validateAndMigrateManifest, getManifestFileHash } from '../src/manifest';
import { defaultSelections } from '../src/profile';
import { createEmptySystemAssetManifestState } from '../src/system-assets';

let temp: string, root: string, store: string;
const file = (relative: string) => path.join(root, relative);
function write(relative: string, content: string) {fs.mkdirSync(path.dirname(file(relative)), {recursive: true}); fs.writeFileSync(file(relative), content);}
function prepare(mode: 'cli' | 'manual' = 'cli') {const plan = previewProjectLayout(root); return {plan, prepared: prepareProjectLayout(root, plan.digest, mode, [], store)};}
function manual(plan: ReturnType<typeof previewProjectLayout>, limit = Infinity) {
    for (const change of plan.changes.slice(0, limit)) {
        const target = file(change.path);
        if (change.after.kind === 'missing') {if (fs.lstatSync(target).isDirectory()) fs.rmdirSync(target); else fs.unlinkSync(target);}
        else if (change.after.kind === 'directory') fs.mkdirSync(target, {recursive: true});
        else {fs.mkdirSync(path.dirname(target), {recursive: true}); fs.writeFileSync(target, Buffer.from(change.after.contentBase64!, 'base64')); fs.chmodSync(target, change.after.mode!);}
    }
}
beforeEach(() => {temp = fs.mkdtempSync(path.join(os.tmpdir(), 'r4-layout-state-')); root = path.join(temp, 'project'); store = path.join(temp, 'store'); fs.mkdirSync(root); write('docs/artifacts/note.md', '# Shared note\n'); vi.stubEnv('MAKE_DOCS_HOME', store);});
afterEach(() => {vi.restoreAllMocks(); vi.unstubAllEnvs(); process.exitCode = 0; fs.rmSync(temp, {recursive: true, force: true});});

describe('W19 R4 Store-backed layout operations', () => {
    it('gives distinct next actions for blocked, ready, and unchanged previews', () => {
        const plan = previewProjectLayout(root);
        expect(presentProjectLayout(plan)).toMatchObject({status: 'ready', nextAction: expect.stringContaining(`layout prepare --review ${plan.digest}`)});
        expect(presentProjectLayout({...plan, changes: [], blockers: ['Review this path.']})).toMatchObject({status: 'blocked', nextAction: 'Resolve the listed choices, then preview again.'});
        manual(plan);
        const unchanged = presentProjectLayout(previewProjectLayout(root));
        expect(unchanged).toMatchObject({status: 'unchanged', changes: [], nextAction: 'No layout migration is required. No operation needs to be prepared.'});
        expect(unchanged.nextAction).not.toContain('layout prepare');
        expect(fs.existsSync(store)).toBe(false);
    });
    it('separates link text edits from unchanged target checks without losing occurrences or saved proof', async () => {
        write('docs/artifacts/note.md', '# Note\n\n[Other](other.md)\n');
        write('docs/artifacts/other.md', '# Other\n');
        write('docs/readme.md', '[Note](artifacts/note.md) and [Note again](artifacts/note.md)\n');
        const plan = previewProjectLayout(root);
        expect(plan.blockers).toEqual([]);
        const edits = plan.linkEdits.filter(edit => edit.before !== edit.after);
        const checks = plan.linkEdits.filter(edit => edit.before === edit.after);
        expect(edits.filter(edit => edit.before === 'artifacts/note.md')).toHaveLength(2);
        expect(checks.length).toBeGreaterThan(0);
        const output = presentProjectLayout(plan);
        expect(output.linkEdits).toEqual(edits);
        expect(output.linkChecks).toEqual(checks);
        expect(output.reviewDigest).toBe(plan.digest);
        const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
        await runProjectCommand(['layout', 'preview', '--target-root', root]);
        const text = stdout.mock.calls.map(call => String(call[0])).join('');
        expect(text).toContain(`Link text edits: ${edits.length}`);
        expect(text).toContain(`Unchanged link target checks: ${checks.length}`);
        stdout.mockRestore();
        const prepared = prepareProjectLayout(root, plan.digest, 'manual', [], store);
        expect(prepared.linkEdits).toEqual(edits);
        expect(prepared.linkChecks).toEqual(checks);
        const saved = readDetachedInstallationOperation(root, prepared.operationId, 'project.layout.prepare', store);
        expect((saved.plan.metadata as typeof plan).linkEdits).toEqual(plan.linkEdits);
    });
    it('previews without Store writes and prepares without config or local recovery files', () => {
        const plan = previewProjectLayout(root);
        expect(plan.blockers).toEqual([]);
        expect(fs.existsSync(store)).toBe(false);
        const prepared = prepareProjectLayout(root, plan.digest, 'cli', [], store);
        expect(fs.readFileSync(file('docs/artifacts/note.md'), 'utf8')).toBe('# Shared note\n');
        expect(fs.existsSync(file('.make-docs'))).toBe(false);
        expect(readInstallationStatus(root, store)).toMatchObject({status: 'recovery-required', nextAction: expect.stringContaining('layout apply')});
        withInstallationDatabase(root, db => {
            expect(db.prepare('SELECT * FROM installation_locks').all()).toHaveLength(0);
            const row = db.prepare('SELECT after_json FROM installation_steps WHERE operation_id=? AND relative_path=?').get(prepared.operationId, 'docs/assets/project/note.md') as {after_json: string};
            expect(Buffer.from(JSON.parse(row.after_json).contentBase64, 'base64').toString()).toBe('# Shared note\n');
        }, {storeRoot: store, readOnly: true});
        expect(() => withInstallationOperation(root, 'setup.test', () => {throw new Error('must not run');}, {storeRoot: store})).toThrow(/pending|recover/i);
    });
    it('rejects a stale digest before creating a Store', () => {
        const digest = previewProjectLayout(root).digest;
        write('docs/artifacts/note.md', 'changed');
        expect(() => prepareProjectLayout(root, digest, 'cli', [], store)).toThrow(/changed/);
        expect(fs.existsSync(store)).toBe(false);
    });
    it('applies exact bytes, removes empty old parents, and does not repeat completed changes', () => {
        fs.chmodSync(file('docs/artifacts/note.md'), 0o600);
        const {prepared} = prepare();
        expect(applyProjectLayout(root, prepared.operationId, 'apply', false, store)).toMatchObject({status: 'completed'});
        expect(fs.readFileSync(file('docs/assets/project/note.md'), 'utf8')).toBe('# Shared note\n');
        expect(fs.statSync(file('docs/assets/project/note.md')).mode & 0o777).toBe(0o600);
        expect(fs.existsSync(file('docs/artifacts'))).toBe(false);
        expect(applyProjectLayout(root, prepared.operationId, 'apply', false, store)).toMatchObject({status: 'already-complete'});
        expect(previewProjectLayout(root).changes).toEqual([]);
    });
    it('manual verify and generic resume never do the requested manual file moves', () => {
        const {plan, prepared} = prepare('manual');
        expect(() => applyProjectLayout(root, prepared.operationId, 'apply', false, store)).toThrow(/manual mode/);
        expect(() => applyProjectLayout(root, prepared.operationId, 'verify', false, store)).toThrow(/preserves changed files|differs/i);
        expect(fs.existsSync(file('docs/artifacts/note.md'))).toBe(true);
        expect(recoverInstallationOperation(root, prepared.operationId, 'resume', true, store)).toMatchObject({status: 'blocked'});
        manual(plan);
        expect(applyProjectLayout(root, prepared.operationId, 'verify', false, store)).toMatchObject({status: 'completed'});
    });
    it.each(['new source', 'wrong bytes', 'new destination'])('keeps manual operation pending for %s', cause => {
        const {plan, prepared} = prepare('manual'); manual(plan);
        if (cause === 'new source') write('docs/artifacts/unreviewed.md', 'new');
        if (cause === 'wrong bytes') write('docs/assets/project/note.md', 'wrong');
        if (cause === 'new destination') write('docs/assets/project/unreviewed.md', 'new');
        expect(() => applyProjectLayout(root, prepared.operationId, 'verify', false, store)).toThrow();
        expect(readInstallationStatus(root, store).status).toBe('recovery-required');
    });
    it('resumes interrupted CLI files and can roll back partial manual files from Store bytes', () => {
        const {plan, prepared} = prepare();
        const firstWrite = plan.changes.findIndex(change => change.after.kind === 'file');
        manual(plan, firstWrite + 1);
        expect(recoverInstallationOperation(root, prepared.operationId, 'resume', false, store).status).toBe('completed');
        write('docs/artifacts/second.md', 'second');
        const second = prepare('manual'); manual(second.plan, second.plan.changes.findIndex(change => change.after.kind === 'file') + 1);
        expect(recoverInstallationOperation(root, second.prepared.operationId, 'rollback', false, store).status).toBe('rolled-back');
        expect(fs.readFileSync(file('docs/artifacts/second.md'), 'utf8')).toBe('second');
    });
    it('stops before changes for a live second-process writer and unsafe Store root', () => {
        const digest = previewProjectLayout(root).digest;
        expect(() => prepareProjectLayout(root, digest, 'cli', [], file('local-state'))).toThrow(/outside the project/);
        const lock = acquireInstallationLock(root, store);
        try {
            const script = `import {prepareProjectLayout} from './packages/cli/src/store/layout-state.ts';prepareProjectLayout(${JSON.stringify(root)},${JSON.stringify(digest)},'cli',[],${JSON.stringify(store)});`;
            const child = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], {cwd: path.resolve('../..'), encoding: 'utf8'});
            expect(child.status).not.toBe(0); expect(child.stderr).toMatch(/writer|lease|lock|active/i);
        } finally {releaseInstallationLock(lock);}
        expect(fs.readFileSync(file('docs/artifacts/note.md'), 'utf8')).toBe('# Shared note\n');
    });
    it('refuses corrupt saved file evidence before any replay', () => {
        const {prepared} = prepare();
        withInstallationDatabase(root, db => db.prepare("UPDATE installation_steps SET after_json='{}' WHERE operation_id=? AND relative_path='docs/assets/project/note.md'").run(prepared.operationId), {storeRoot: store});
        expect(() => applyProjectLayout(root, prepared.operationId, 'apply', false, store)).toThrow(/disagree/);
        expect(fs.existsSync(file('docs/assets/project/note.md'))).toBe(false);
    });
    it('recovers a real exited CLI writer from the saved Store plan and verified bytes', () => {
        const {prepared} = prepare();
        const script = `import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';const unlink=fs.unlinkSync;fs.unlinkSync=(target)=>{if(String(target)===${JSON.stringify(fs.realpathSync(file('docs/artifacts/note.md')))})process.exit(86);return unlink(target)};syncBuiltinESMExports();const {applyProjectLayout}=await import('./packages/cli/src/store/layout-state.ts');applyProjectLayout(${JSON.stringify(root)},${JSON.stringify(prepared.operationId)},'apply',false,${JSON.stringify(store)});`;
        const child = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], {cwd: path.resolve('../..'), encoding: 'utf8'});
        expect(child.status, child.stderr).toBe(86);
        expect(fs.readFileSync(file('docs/assets/project/note.md'), 'utf8')).toBe('# Shared note\n');
        expect(fs.readFileSync(file('docs/artifacts/note.md'), 'utf8')).toBe('# Shared note\n');
        expect(readInstallationStatus(root, store).status).toBe('recovery-required');
        expect(recoverInstallationOperation(root, prepared.operationId, 'resume', false, store).status).toBe('completed');
    });
    it('keeps the operation pending if final verification fails after all files move', () => {
        const {prepared} = prepare();
        const original = layoutPlanner.verifyProjectLayout;
        const injected = vi.spyOn(layoutPlanner, 'verifyProjectLayout').mockImplementation((target, plan, phase) => {
            if (phase === 'after') throw new Error('injected final verification failure');
            return original(target, plan, phase);
        });
        expect(() => applyProjectLayout(root, prepared.operationId, 'apply', false, store)).toThrow(/injected/);
        expect(fs.existsSync(file('docs/artifacts'))).toBe(false);
        injected.mockRestore();
        expect(readInstallationStatus(root, store).status).toBe('recovery-required');
        expect(recoverInstallationOperation(root, prepared.operationId, 'resume', false, store).status).toBe('completed');
    });
    it.each(['partial-write', 'before-rename', 'after-rename', 'changed-partial'])('recovers atomic %s boundaries without truncating the existing target', point => {
        write('docs/readme.md', '[Shared note](artifacts/note.md)\n');
        const {plan, prepared} = prepare();
        const index = plan.changes.findIndex(change => change.path === 'docs/readme.md');
        expect(index).toBeGreaterThanOrEqual(0);
        const staged = path.join(plan.projectRoot, 'docs', `.make-docs-${prepared.operationId}-${index + 1}.tmp`);
        const script = `import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';const open=fs.openSync,write=fs.writeFileSync,rename=fs.renameSync;let stagedFd;fs.openSync=(p,...args)=>{const fd=open(p,...args);if(String(p)===${JSON.stringify(staged)})stagedFd=fd;return fd};fs.writeFileSync=(fd,bytes,...args)=>{if(fd===stagedFd&&${JSON.stringify(point)}.includes('partial')){fs.writeSync(fd,Buffer.from(bytes).subarray(0,5));fs.fsyncSync(fd);process.exit(87)}return write(fd,bytes,...args)};fs.renameSync=(a,b)=>{if(String(a)===${JSON.stringify(staged)}){if(${JSON.stringify(point)}==='after-rename')rename(a,b);process.exit(88)}return rename(a,b)};syncBuiltinESMExports();const {applyProjectLayout}=await import('./packages/cli/src/store/layout-state.ts');applyProjectLayout(${JSON.stringify(root)},${JSON.stringify(prepared.operationId)},'apply',false,${JSON.stringify(store)});`;
        const child = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], {cwd: path.resolve('../..'), encoding: 'utf8'});
        expect(child.status, child.stderr).toBe(point.includes('partial') ? 87 : 88);
        const expected = point === 'after-rename' ? plan.changes[index]!.after : plan.changes[index]!.before;
        expect(fs.readFileSync(file('docs/readme.md'))).toEqual(Buffer.from(expected.contentBase64!, 'base64'));
        if (point === 'changed-partial') {
            fs.writeFileSync(staged, 'user changed the temporary file');
            expect(() => recoverInstallationOperation(root, prepared.operationId, 'resume', false, store)).toThrow(/Temporary file was changed/);
            expect(fs.readFileSync(staged, 'utf8')).toBe('user changed the temporary file');
        } else {
            expect(recoverInstallationOperation(root, prepared.operationId, 'resume', false, store).status).toBe('completed');
            expect(fs.readFileSync(file('docs/readme.md'))).toEqual(Buffer.from(plan.changes[index]!.after.contentBase64!, 'base64'));
            expect(fs.existsSync(staged)).toBe(false);
        }
    });
    it('uses one registry handler and enforces the MCP write boundary', async () => {
        const read = createExecutionContext({surface: 'mcp', cwd: root, writesAllowed: false});
        const preview = await invokeOperation('project.layout.preview', {}, read);
        expect(preview.value).toMatchObject({status: 'ready', reviewDigest: expect.any(String)});
        expect(fs.existsSync(store)).toBe(false);
        await expect(invokeOperation('project.layout.prepare', {review: (preview.value as any).reviewDigest, mode: 'cli'}, read)).rejects.toThrow(/write permission/);
        expect(listOperations().filter(op => op.id.startsWith('project.layout.'))).toHaveLength(4);
        const output = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
        await runProjectCommand(['layout', 'preview', '--target-root', root, '--json']);
        expect(JSON.parse(String(output.mock.calls[0]?.[0]))).toEqual(preview.value);
        await expect(runProjectCommand(['layout', 'prepare', '--review', (preview.value as any).reviewDigest, '--target-root', root])).rejects.toThrow(/--mode/);
    });
    it('preserves existing ownership while moving its proved path and leaves other content unowned', () => {
        write('docs/artifacts/unowned.md', 'ordinary project material');
        const selections = defaultSelections();
        const manifest = validateAndMigrateManifest({schemaVersion: 3, projectId: '3141394c-2b97-4ee2-a8ba-53a27e030789', packageName: 'make-docs', packageVersion: '2.0.0-rc', updatedAt: '2026-09-09T00:00:00Z', profileId: 'test', selections, effectiveCapabilities: [], systemAssetMaterialization: createEmptySystemAssetManifestState(), files: {'docs/artifacts/note.md': {sourceId: 'legacy-note', ownershipClass: 'managed-snapshot', hash: getManifestFileHash('docs/artifacts/note.md', '# Shared note\n')}}, skillFiles: []}, 'fixture');
        const original = structuredClone(manifest);
        const plan = previewProjectLayout(root);
        const next = projectLayoutLedger(manifest, plan)!;
        expect(next.files['docs/assets/project/note.md']).toEqual(manifest.files['docs/artifacts/note.md']);
        expect(next.files['docs/artifacts/note.md']).toBeUndefined();
        expect(next.files['docs/assets/project/unowned.md']).toBeUndefined();
        expect(next.projectId).toBe(manifest.projectId);
        expect(manifest).toEqual(original);
        const changed = structuredClone(manifest); changed.files['docs/artifacts/note.md']!.hash = '0'.repeat(64);
        expect(() => projectLayoutLedger(changed, plan)).toThrow(/ownership needs review/);
    });
});
