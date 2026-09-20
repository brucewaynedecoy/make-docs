import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {installMakeDocsTarget} from './helpers';
import {prepareDetachedInstallationOperation, readDetachedInstallationOperation, readInstallationManifest, readInstallationPathClaims, readInstallationStatus, recoverInstallationOperation, registerDetachedInstallationOperation, withInstallationOperation, recordPlannedFileChange, saveInstallationManifest, removeInstallationManifest, sealInstallationOperation, type DetachedInstallationPlan, type InstallationFileState} from '../src/store/installation-state';

const faults = vi.hoisted(() => ({symlink: false, touched: false, directory: '', final: false}));
vi.mock('node:fs', async original => {
  const actual = await original<typeof import('node:fs')>();
  return {...actual, mkdirSync: (...args: Parameters<typeof actual.mkdirSync>) => {
    if (faults.directory && String(args[0]) === faults.directory) throw new Error('interrupted after fallback selection');
    return actual.mkdirSync(...args);
  }, symlinkSync: (...args: Parameters<typeof actual.symlinkSync>) => {
    if (faults.symlink) { if (faults.touched) actual.writeFileSync(args[1], 'unrelated arrival'); throw Object.assign(new Error('symlink unavailable'), {code: 'EPERM'}); }
    return actual.symlinkSync(...args);
  }};
});
registerDetachedInstallationOperation('setup.skills.adopt', {beforeRetiredCleanup:()=>[],validate: (_root, _metadata, phase) => phase === 'after' && faults.final ? ['interrupted before ledger commit'] : [], nextAction: (_root, id) => `recover ${id}`});
registerDetachedInstallationOperation('test.layout-safety', {validate: () => [], nextAction: () => 'review'});
let temp: string, project: string, store: string, home: string;
const shared = '.agents/skills/preflight', exposure = '.claude/skills/preflight';
const target = '../../.agents/skills/preflight';
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const file = (s: string): InstallationFileState => ({kind: 'file', digest: sha(s), mode: 0o644, contentBase64: Buffer.from(s).toString('base64')});
beforeEach(async () => {
  temp = fs.mkdtempSync(path.join(os.tmpdir(), 'make-docs-adoption-store-'));
  project = path.join(temp, 'project'); store = path.join(temp, 'store'); home = path.join(temp, 'home');
  fs.mkdirSync(project); fs.mkdirSync(home);
  vi.stubEnv('MAKE_DOCS_HOME', store); vi.spyOn(os, 'homedir').mockReturnValue(home);
  await installMakeDocsTarget(project);
  fs.mkdirSync(path.join(project, shared), {recursive: true});
  fs.mkdirSync(path.dirname(path.join(project, exposure)), {recursive: true});
  fs.writeFileSync(path.join(project, shared, 'SKILL.md'), 'before');
});
afterEach(() => {faults.symlink = false; faults.touched = false; faults.directory = ''; faults.final = false; vi.restoreAllMocks(); vi.unstubAllEnvs(); fs.rmSync(temp, {recursive: true, force: true});});
function plan(): DetachedInstallationPlan {
  const ledger = structuredClone(readInstallationManifest(project, store)!);
  ledger.selections.selectedSkills = ['preflight'];
  ledger.selections.skills = true;
  ledger.files[`${shared}/SKILL.md`] = {hash: sha('after'), sourceId: 'skill:preflight'};
  ledger.files[exposure] = {hash: sha(target), sourceId: 'skill-exposure:codex:preflight', skillExposure: {skillName: 'preflight', installName: 'preflight', harness: 'codex', scope: 'project', canonicalPayloadPath: shared, exposurePath: exposure, symlinkTarget: target, preferredMode: 'symlink', mode: 'symlink'}};
  ledger.skillFiles = [`${shared}/SKILL.md`, exposure];
  return {schemaVersion: 1, reviewDigest: 'reviewed', mode: 'cli', metadata: {}, afterLedger: ledger,
    skillScope: {roots: [shared, exposure], symlinkTargets: {[exposure]: target}},
    changes: [{path: `${shared}/SKILL.md`, before: file('before'), after: file('after')}, {path: exposure, before: {kind: 'missing'}, after: {kind: 'symlink', target}}],
    copyFallbacks: {[exposure]: {changes: [{path: exposure, before: {kind: 'missing'}, after: {kind: 'directory'}}, {path: `${exposure}/SKILL.md`, before: {kind: 'missing'}, after: file('after')}], ledgerEntry: {...ledger.files[exposure], skillExposure: {...ledger.files[exposure].skillExposure!, mode: 'copy-mirror'}}}},
  };
}
function prepare(p = plan()) {return prepareDetachedInstallationOperation(project, 'setup.skills.adopt', () => p, store);}

describe('bounded detached Skill adoption service', () => {
  it('reads path claims while a normal uninstall has a null intended ledger', () => {
    withInstallationOperation(project, 'uninstall.test', () => {
      removeInstallationManifest(project);
      expect(() => readInstallationPathClaims(project, [shared], store)).not.toThrow();
    }, {storeRoot: store});
    expect(readInstallationManifest(project, store)).toBeNull();
  });
  it('allows unrelated normal writes while another checkout has a pending ledger removal', async () => {
    const other = path.join(temp, 'other'); fs.mkdirSync(other); await installMakeDocsTarget(other);
    expect(() => withInstallationOperation(other, 'uninstall.test', () => {
      removeInstallationManifest(other); throw new Error('interrupted uninstall');
    }, {storeRoot: store})).toThrow(/interrupted uninstall/);
    const relative = `${shared}/SKILL.md`;
    withInstallationOperation(project, 'normal.write', () => recordPlannedFileChange(project, relative, {kind: 'file', content: 'after'}, () => fs.writeFileSync(path.join(project, relative), 'after')), {storeRoot: store});
    expect(fs.readFileSync(path.join(project, relative), 'utf8')).toBe('after');
    expect(readInstallationStatus(other, store).status).toBe('recovery-required');
  });
  it.each(['resume', 'rollback'] as const)('can %s a pending normal uninstall with a null intended ledger', mode => {
    expect(() => withInstallationOperation(project, 'uninstall.test', () => {
      removeInstallationManifest(project); sealInstallationOperation(project); throw new Error('interrupted uninstall');
    }, {storeRoot: store})).toThrow(/interrupted uninstall/);
    const status = readInstallationStatus(project, store);
    if (!('pendingOperation' in status) || !status.pendingOperation || typeof status.pendingOperation !== 'object' || !('operation_id' in status.pendingOperation) || typeof status.pendingOperation.operation_id !== 'string') throw new Error('Missing test operation');
    expect(recoverInstallationOperation(project, status.pendingOperation.operation_id, mode, false, store).status).toBe(mode === 'resume' ? 'completed' : 'rolled-back');
    expect(readInstallationManifest(project, store) === null).toBe(mode === 'resume');
  });
  it('saves every path and alternate before writes, then uses the existing executor', () => {
    const p = plan(), op = prepare(p);
    expect(fs.readFileSync(path.join(project, shared, 'SKILL.md'), 'utf8')).toBe('before');
    expect(fs.existsSync(path.join(project, exposure))).toBe(false);
    expect(readDetachedInstallationOperation(project, op.operationId, 'setup.skills.adopt', store).plan.copyFallbacks).toEqual(p.copyFallbacks);
    expect(recoverInstallationOperation(project, op.operationId, 'resume', false, store).status).toBe('completed');
    expect(fs.lstatSync(path.join(project, exposure)).isSymbolicLink()).toBe(true);
    expect(readInstallationManifest(project, store)!.files[exposure].skillExposure?.mode).toBe('symlink');
    expect(recoverInstallationOperation(project, op.operationId, 'resume', true, store).status).toBe('completed');
  });
  it('selects only a saved copy alternative after no-effect OS failure', () => {
    const op = prepare(); faults.symlink = true;
    expect(recoverInstallationOperation(project, op.operationId, 'resume', false, store).status).toBe('completed');
    expect(fs.lstatSync(path.join(project, exposure)).isDirectory()).toBe(true);
    expect(fs.readFileSync(path.join(project, exposure, 'SKILL.md'), 'utf8')).toBe('after');
    expect(readInstallationManifest(project, store)!.files[exposure].skillExposure?.mode).toBe('copy-mirror');
    expect(readDetachedInstallationOperation(project, op.operationId, 'setup.skills.adopt', store).plan.selectedCopyFallbacks).toEqual([exposure]);
  });
  it('does not overwrite a target that appeared during the symlink failure', () => {
    const op = prepare(); faults.symlink = true; faults.touched = true;
    expect(() => recoverInstallationOperation(project, op.operationId, 'resume', false, store)).toThrow(/no copy fallback/);
    expect(fs.readFileSync(path.join(project, exposure), 'utf8')).toBe('unrelated arrival');
    expect(readInstallationStatus(project, store).status).toBe('recovery-required');
  });
  it('rejects unrelated paths and wrong raw link targets before preparation', () => {
    const p = plan(); p.changes.push({path: 'README.md', before: {kind: 'missing'}, after: file('bad')});
    expect(() => prepare(p)).toThrow(/outside/);
    const wrong = plan(); wrong.changes[1].after = {kind: 'symlink', target: '/etc'};
    expect(() => prepare(wrong)).toThrow(/exact reviewed/);
    expect(fs.existsSync(path.join(project, 'README.md'))).toBe(false);
  });
  it('keeps relative-only and no-symlink policy for layout operations', () => {
    const p = plan(); delete p.skillScope; delete p.copyFallbacks;
    expect(() => prepareDetachedInstallationOperation(project, 'test.layout-safety', () => p, store)).toThrow(/exact reviewed/);
    p.changes = [{path: path.join(home, '.claude/skills/preflight'), before: {kind: 'missing'}, after: {kind: 'directory'}}];
    expect(() => prepareDetachedInstallationOperation(project, 'test.layout-safety', () => p, store)).toThrow(/escape/);
  });
  it('persists zero-file ownership intent and commits it on resume', () => {
    const p = plan(); p.changes = []; p.skillScope!.symlinkTargets = {}; delete p.copyFallbacks;
    delete p.afterLedger!.files[exposure]; p.afterLedger!.files[`${shared}/SKILL.md`].hash = sha('before'); p.afterLedger!.skillFiles = [`${shared}/SKILL.md`];
    const op = prepare(p);
    expect(readInstallationManifest(project, store)!.selections.selectedSkills).not.toContain('preflight');
    expect(readInstallationPathClaims(project, [shared], store).some(c => c.kind === 'pending' && c.operationId === op.operationId)).toBe(true);
    expect(recoverInstallationOperation(project, op.operationId, 'resume', false, store).status).toBe('completed');
    expect(readInstallationManifest(project, store)!.selections.selectedSkills).toContain('preflight');
  });
  it('finds overlapping claims from another checkout and does not create an absent Store', () => {
    const op = prepare(); const other = path.join(temp, 'other'); fs.mkdirSync(other);
    expect(readInstallationPathClaims(other, [path.join(project, shared)], store).some(c => c.rootPath === fs.realpathSync(project) && c.operationId === op.operationId)).toBe(true);
    expect(readInstallationPathClaims(other, [path.join(fs.realpathSync(project), shared)], store)).toEqual(readInstallationPathClaims(other, [path.join(project, shared)], store));
    const absent = path.join(temp, 'absent'); expect(readInstallationPathClaims(other, [shared], absent)).toEqual([]); expect(fs.existsSync(absent)).toBe(false);
  });
  it('resumes the saved selected fallback after a later interruption', () => {
    const op = prepare(); faults.symlink = true; faults.directory = path.join(fs.realpathSync(project), exposure);
    expect(() => recoverInstallationOperation(project, op.operationId, 'resume', false, store)).toThrow(/interrupted after fallback/);
    expect(readDetachedInstallationOperation(project, op.operationId, 'setup.skills.adopt', store).plan.selectedCopyFallbacks).toEqual([exposure]);
    faults.directory = '';
    expect(recoverInstallationOperation(project, op.operationId, 'resume', false, store).status).toBe('completed');
    expect(fs.readFileSync(path.join(project, exposure, 'SKILL.md'), 'utf8')).toBe('after');
  });
  it('blocks another checkout normal writer on a pending global adoption path', () => {
    const p = plan(), globalRoot = path.join(home, shared), globalFile = path.join(globalRoot, 'SKILL.md');
    fs.mkdirSync(globalRoot, {recursive: true}); fs.writeFileSync(globalFile, 'before');
    p.afterLedger!.selections.skillScope = 'global';
    p.afterLedger!.files[globalFile] = p.afterLedger!.files[`${shared}/SKILL.md`];
    delete p.afterLedger!.files[`${shared}/SKILL.md`]; delete p.afterLedger!.files[exposure];
    p.afterLedger!.skillFiles = [globalFile]; p.skillScope = {roots: [globalRoot], symlinkTargets: {}};
    p.changes = [{path: globalFile, before: file('before'), after: file('after')}]; delete p.copyFallbacks;
    prepare(p);
    const other = path.join(temp, 'other'); fs.mkdirSync(other);
    expect(() => withInstallationOperation(other, 'normal.setup', () => recordPlannedFileChange(other, globalFile, {kind: 'file', content: 'unsafe'}, () => fs.writeFileSync(globalFile, 'unsafe')), {storeRoot: store})).toThrow(/reserves/);
    expect(fs.readFileSync(globalFile, 'utf8')).toBe('before');
  });
  it('blocks ledger-only ownership claims over another pending adoption', async () => {
    const p = plan(), globalRoot = path.join(home, shared), globalFile = path.join(globalRoot, 'SKILL.md');
    fs.mkdirSync(globalRoot, {recursive: true}); fs.writeFileSync(globalFile, 'before');
    p.afterLedger!.files[globalFile] = {hash: sha('before'), sourceId: 'skill:preflight'};
    delete p.afterLedger!.files[`${shared}/SKILL.md`]; delete p.afterLedger!.files[exposure];
    p.afterLedger!.skillFiles = [globalFile]; p.afterLedger!.selections.skillScope = 'global';
    p.skillScope = {roots: [globalRoot], symlinkTargets: {}}; p.changes = []; delete p.copyFallbacks;
    prepare(p);
    const other = path.join(temp, 'other'); fs.mkdirSync(other); await installMakeDocsTarget(other);
    const ledger = readInstallationManifest(other, store)!;
    ledger.files[globalFile] = {hash: sha('before'), sourceId: 'skill:preflight'};
    expect(() => withInstallationOperation(other, 'ownership.only', () => saveInstallationManifest(other, ledger), {storeRoot: store})).toThrow(/reserves/);
    expect(readInstallationManifest(other, store)!.files[globalFile]).toBeUndefined();
  });
  it('rejects a global Skill parent symlink before saving intent', () => {
    const actual = path.join(home, 'redirect'); fs.mkdirSync(actual);
    fs.mkdirSync(path.join(home, '.agents')); fs.symlinkSync(actual, path.join(home, '.agents/skills'));
    const p = plan(); p.skillScope!.roots.push(path.join(home, '.agents/skills/preflight'));
    expect(() => prepare(p)).toThrow(/Symbolic-link parent/);
    expect(fs.readdirSync(actual)).toEqual([]);
  });
  it.each(['resume', 'rollback'] as const)('can %s an existing native directory after its final link exists but before commit', mode => {
    fs.mkdirSync(path.join(project, exposure)); fs.writeFileSync(path.join(project, exposure, 'SKILL.md'), 'local before');
    const p = plan(); p.changes.splice(1, 0,
      {path: `${exposure}/SKILL.md`, before: file('local before'), after: {kind: 'missing'}},
      {path: exposure, before: {kind: 'directory'}, after: {kind: 'missing'}});
    const op = prepare(p); faults.final = true;
    expect(() => recoverInstallationOperation(project, op.operationId, 'resume', false, store)).toThrow(/interrupted before ledger/);
    expect(fs.lstatSync(path.join(project, exposure)).isSymbolicLink()).toBe(true);
    faults.final = false;
    expect(recoverInstallationOperation(project, op.operationId, mode, false, store).status).toBe(mode === 'resume' ? 'completed' : 'rolled-back');
    expect(fs.lstatSync(path.join(project, exposure)).isSymbolicLink()).toBe(mode === 'resume');
    if (mode === 'rollback') expect(fs.readFileSync(path.join(project, exposure, 'SKILL.md'), 'utf8')).toBe('local before');
    else expect(readDetachedInstallationOperation(project, op.operationId, 'setup.skills.adopt', store).status).toBe('completed');
  });
  it('resumes a saved copy fallback after removing the reviewed native tree', () => {
    fs.mkdirSync(path.join(project, exposure)); fs.writeFileSync(path.join(project, exposure, 'SKILL.md'), 'local before');
    const p = plan(); p.changes.splice(1, 0,
      {path: `${exposure}/SKILL.md`, before: file('local before'), after: {kind: 'missing'}},
      {path: exposure, before: {kind: 'directory'}, after: {kind: 'missing'}});
    const op = prepare(p); faults.symlink = true; faults.directory = path.join(fs.realpathSync(project), exposure);
    expect(() => recoverInstallationOperation(project, op.operationId, 'resume', false, store)).toThrow(/interrupted after fallback/);
    expect(fs.existsSync(path.join(project, exposure))).toBe(false);
    faults.directory = '';
    expect(recoverInstallationOperation(project, op.operationId, 'resume', false, store).status).toBe('completed');
    expect(fs.readFileSync(path.join(project, exposure, 'SKILL.md'), 'utf8')).toBe('after');
    expect(readInstallationManifest(project, store)!.files[exposure].skillExposure?.mode).toBe('copy-mirror');
  });
  it('keeps retired-path cutover forward-resume-only after source cleanup', () => {
    const legacy='.make-docs/agentics/skills/preflight';fs.mkdirSync(path.join(project,legacy),{recursive:true});fs.writeFileSync(path.join(project,legacy,'SKILL.md'),'before');
    const p=plan();p.skillScope!.roots.push(legacy);p.changes.push({path:legacy+'/SKILL.md',before:file('before'),after:{kind:'missing'}},{path:legacy,before:{kind:'directory'},after:{kind:'missing'}},{path:'.make-docs/agentics/skills',before:{kind:'directory'},after:{kind:'missing'}},{path:'.make-docs/agentics',before:{kind:'directory'},after:{kind:'missing'}});
    const op=prepare(p);faults.final=true;expect(()=>recoverInstallationOperation(project,op.operationId,'resume',false,store)).toThrow(/interrupted before ledger/);faults.final=false;
    expect(fs.existsSync(path.join(project,'.make-docs/agentics'))).toBe(false);
    const rollback=recoverInstallationOperation(project,op.operationId,'rollback',false,store);expect(rollback.status).toBe('blocked');expect(rollback.conflicts.join(' ')).toContain('forward resume only');expect(fs.existsSync(path.join(project,'.make-docs/agentics'))).toBe(false);
    expect(recoverInstallationOperation(project,op.operationId,'resume',false,store).status).toBe('completed');
  });
  it('refuses retired paths in saved writes and ownership-only adoption plans',()=>{
    const legacy='.make-docs/agentics/skills/preflight';const p=plan();p.skillScope!.roots.push(legacy);p.changes.push({path:legacy+'/SKILL.md',before:{kind:'missing'},after:file('bad')});
    expect(()=>prepare(p)).toThrow(/retired/);const owner=plan();owner.afterLedger!.files[legacy+'/SKILL.md']={hash:sha('bad'),sourceId:'skill:preflight'};expect(()=>prepare(owner)).toThrow(/retired/);
    expect(()=>withInstallationOperation(project,'old.writer',()=>recordPlannedFileChange(project,legacy+'/SKILL.md',{kind:'file',content:'bad'},()=>{throw new Error('must not execute');}),{storeRoot:store})).toThrow(/retired/);
    expect(fs.existsSync(path.join(project,'.make-docs/agentics'))).toBe(false);
  });

});
