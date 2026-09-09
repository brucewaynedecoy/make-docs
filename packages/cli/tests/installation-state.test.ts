import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync, renameSync, symlinkSync, chmodSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openStoreDatabase } from '../src/store/database';
import { spawnSync } from 'node:child_process';
import { withInstallationOperation, withInstallationDatabase, sealInstallationOperation, preparePlannedFileChange, recordPlannedFileChange, readInstallationStatus, recoverInstallationOperation, readDeclarativeProjectId, readMigrationState, recordMigrationState, acquireInstallationLock, releaseInstallationLock, getInstallationCheckoutId } from '../src/store/installation-state';

let temp:string, project:string, store:string;
beforeEach(()=>{temp=mkdtempSync(path.join(os.tmpdir(),'make-docs-installation-'));project=path.join(temp,'project');store=path.join(temp,'store');mkdirSync(project);});
afterEach(()=>rmSync(temp,{recursive:true,force:true}));
function operation(fn:()=>void) {return withInstallationOperation(project,'test.change',fn,{storeRoot:store});}
function replace(relative:string,content:string) {recordPlannedFileChange(project,relative,{kind:'file',content},()=>{mkdirSync(path.dirname(path.join(project,relative)),{recursive:true});writeFileSync(path.join(project,relative),content);});}
function pendingId() {const status=readInstallationStatus(project,store);return (status as any).pendingOperation.operation_id as string;}

describe('Store-owned installation safety',()=>{
  it('reads absent Store without creating anything',()=>{expect(readInstallationStatus(project,store).status).toBe('unregistered');expect(readMigrationState(project,'receipt','none',store)).toBeNull();expect(existsSync(store)).toBe(false);expect(existsSync(path.join(project,'.make-docs'))).toBe(false);});
  it('rejects a Store inside project or through a symlink before project writes',()=>{const local=path.join(project,'state');expect(()=>withInstallationOperation(project,'test',()=>replace('a','x'),{storeRoot:local})).toThrow(/outside/);expect(existsSync(local)).toBe(false);const alias=path.join(temp,'alias');symlinkSync(project,alias);expect(()=>withInstallationOperation(project,'test',()=>{}, {storeRoot:path.join(alias,'state')})).toThrow(/outside/);});
  it('preserves damaged Store bytes and project files',()=>{mkdirSync(store);const db=path.join(store,'store.db');writeFileSync(db,'corrupt bytes');expect(()=>operation(()=>replace('a','x'))).toThrow();expect(readFileSync(db,'utf8')).toBe('corrupt bytes');expect(existsSync(path.join(project,'.make-docs'))).toBe(false);});
  it('saves only payload references and stable identity, no local state/manifest',()=>{operation(()=>replace('note.md','private document body'));const id=readDeclarativeProjectId(project);expect(id).toBeTruthy();expect(existsSync(path.join(project,'.make-docs/state'))).toBe(false);expect(existsSync(path.join(project,'.make-docs/manifest.json'))).toBe(false);withInstallationDatabase(project,db=>{const step=db.prepare("SELECT after_json FROM installation_steps WHERE relative_path='note.md'").get() as any;expect(step.after_json).not.toContain('private document body');expect(step.after_json).toContain('payload');expect(db.prepare('PRAGMA user_version').get()).toEqual({user_version:3});},{storeRoot:store,readOnly:true});operation(()=>replace('note.md','updated'));expect(readDeclarativeProjectId(project)).toBe(id);});
  it('preserves config comments and fields',()=>{mkdirSync(path.join(project,'.make-docs'));writeFileSync(path.join(project,'.make-docs/config.yaml'),'# human note\nlabels: {}\n');operation(()=>{});expect(readFileSync(path.join(project,'.make-docs/config.yaml'),'utf8')).toContain('# human note\nlabels: {}');});
  it('holds a failed operation and resumes only its known change',()=>{expect(()=>operation(()=>{replace('note.md','new');sealInstallationOperation(project);throw new Error('injected');})).toThrow('injected');const id=pendingId();expect(()=>operation(()=>replace('other','unsafe'))).toThrow(/recover/);expect(existsSync(path.join(project,'other'))).toBe(false);expect(recoverInstallationOperation(project,id,'resume',true,store).status).toBe('ready');expect(recoverInstallationOperation(project,id,'resume',false,store).status).toBe('completed');expect(readFileSync(path.join(project,'note.md'),'utf8')).toBe('new');});
  it('resumes a fully saved multi-step plan from its latest file state',()=>{expect(()=>operation(()=>{
    const first=preparePlannedFileChange(project,'note.md',{kind:'file',content:'first'},()=>writeFileSync(path.join(project,'note.md'),'first'));
    const second=preparePlannedFileChange(project,'note.md',{kind:'file',content:'second'},()=>writeFileSync(path.join(project,'note.md'),'second'));
    const third=preparePlannedFileChange(project,'other.md',{kind:'file',content:'third'},()=>writeFileSync(path.join(project,'other.md'),'third'));
    sealInstallationOperation(project);first();second();throw new Error('power loss');
  })).toThrow();const id=pendingId();expect(recoverInstallationOperation(project,id,'resume',false,store).status).toBe('completed');expect(readFileSync(path.join(project,'other.md'),'utf8')).toBe('third');});
  it('does not claim resume is safe when the complete plan was not recorded',()=>{expect(()=>operation(()=>{replace('note.md','x');throw new Error('fault');})).toThrow();const id=pendingId();expect(recoverInstallationOperation(project,id,'resume',false,store).status).toBe('blocked');expect(readInstallationStatus(project,store).status).toBe('recovery-required');});
  it('rolls back only affected files and preserves unrelated Store rows',()=>{writeFileSync(path.join(project,'note.md'),'original');expect(()=>operation(()=>{replace('note.md','changed');throw new Error('fault');})).toThrow();const id=pendingId();writeFileSync(path.join(project,'unrelated'),'keep');recordMigrationState(project,'receipt','other',{message:'keep'},store);expect(recoverInstallationOperation(project,id,'rollback',false,store).status).toBe('rolled-back');expect(readFileSync(path.join(project,'note.md'),'utf8')).toBe('original');expect(readFileSync(path.join(project,'unrelated'),'utf8')).toBe('keep');expect(readMigrationState(project,'receipt','other',store)).toEqual({message:'keep'});});
  it('blocks recovery over later user edits',()=>{expect(()=>operation(()=>{replace('note.md','planned');throw new Error('fault');})).toThrow();const id=pendingId();writeFileSync(path.join(project,'note.md'),'later user edit');expect(recoverInstallationOperation(project,id,'rollback',true,store).status).toBe('blocked');expect(()=>recoverInstallationOperation(project,id,'rollback',false,store)).toThrow(/preserves/);expect(readFileSync(path.join(project,'note.md'),'utf8')).toBe('later user edit');});
  it('refuses another checkout operation even when project IDs match',()=>{expect(()=>operation(()=>{replace('note.md','x');throw new Error('fault');})).toThrow();const id=pendingId();const clone=path.join(temp,'clone');mkdirSync(path.join(clone,'.make-docs'),{recursive:true});writeFileSync(path.join(clone,'.make-docs/config.yaml'),readFileSync(path.join(project,'.make-docs/config.yaml')));withInstallationOperation(clone,'clone',()=>{}, {storeRoot:store});expect(getInstallationCheckoutId(clone,store)).not.toBe(getInstallationCheckoutId(project,store));expect(()=>recoverInstallationOperation(clone,id,'resume',false,store)).toThrow(/belong/);});
  it('refuses a live writer in another process',()=>{const lock=acquireInstallationLock(project,store);try{const child=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',`import { acquireInstallationLock } from './packages/cli/src/store/installation-state.ts'; acquireInstallationLock(${JSON.stringify(project)},${JSON.stringify(store)});`],{cwd:path.resolve('../..'),encoding:'utf8'});expect(child.status).not.toBe(0);expect(child.stderr).toMatch(/writer owns|Store access lease|live process owns/);}finally{releaseInstallationLock(lock);}});
  it('rebinds an unchanged moved directory using identity and filesystem evidence',()=>{operation(()=>replace('note.md','content'));const before=getInstallationCheckoutId(project,store);const moved=path.join(temp,'moved');renameSync(project,moved);withInstallationOperation(moved,'move',()=>{}, {storeRoot:store});expect(getInstallationCheckoutId(moved,store)).toBe(before);});
  it('refuses dangling Store database links without creating their destinations',()=>{
    mkdirSync(store);const outside=path.join(temp,'outside.sqlite');symlinkSync(outside,path.join(store,'store.db'));
    expect(()=>operation(()=>replace('note','x'))).toThrow(/Unsafe|symbolic/);
    expect(existsSync(outside)).toBe(false);expect(existsSync(path.join(project,'.make-docs'))).toBe(false);
    expect(()=>openStoreDatabase(store)).toThrow(/Unsafe/);
  });
  it('preserves an unknown version-zero Store in all open paths',()=>{
    mkdirSync(store);const file=path.join(store,'store.db');const db=new DatabaseSync(file);db.exec('CREATE TABLE unknown_data(value TEXT); INSERT INTO unknown_data VALUES ("original")'.replace('"original"',"'original'"));db.close();
    const bytes=readFileSync(file);expect(()=>operation(()=>{})).toThrow();expect(()=>openStoreDatabase(store)).toThrow();expect(readFileSync(file)).toEqual(bytes);
  });
  it('reports a pending machine operation and blocks project writers',()=>{
    operation(()=>{});withInstallationDatabase(project,db=>db.prepare("INSERT INTO tool_operations VALUES ('tool-pending','self.update','pending',1,'host','{}','today',NULL)").run(),{storeRoot:store});
    const status=readInstallationStatus(project,store);expect(status.status).toBe('recovery-required');expect((status as any).toolOperations[0].operationId).toBe('tool-pending');expect(()=>operation(()=>replace('note','x'))).toThrow(/Tool operation/);expect(existsSync(path.join(project,'note'))).toBe(false);
  });
  it('creates an absent target only after its durable operation intent',()=>{
    rmSync(project,{recursive:true});operation(()=>replace('note.md','created'));expect(readFileSync(path.join(project,'note.md'),'utf8')).toBe('created');
    withInstallationDatabase(project,db=>expect(db.prepare("SELECT before_json FROM installation_steps WHERE relative_path='.'").get()).toEqual({before_json:'{"kind":"missing"}'}),{storeRoot:store,readOnly:true});
  });

  it('keeps the pending operation when step recording fails after the file write',()=>{
    operation(()=>{});
    withInstallationDatabase(project,db=>db.exec("CREATE TRIGGER fail_step BEFORE UPDATE OF applied ON installation_steps WHEN NEW.relative_path='note.md' BEGIN SELECT RAISE(ABORT,'injected step write failure'); END"),{storeRoot:store});
    expect(()=>operation(()=>{const apply=preparePlannedFileChange(project,'note.md',{kind:'file',content:'durable'},()=>writeFileSync(path.join(project,'note.md'),'durable'));sealInstallationOperation(project);apply();})).toThrow(/step write failure/);
    const id=pendingId();expect(readFileSync(path.join(project,'note.md'),'utf8')).toBe('durable');
    withInstallationDatabase(project,db=>db.exec('DROP TRIGGER fail_step'),{storeRoot:store});
    expect(recoverInstallationOperation(project,id,'resume',false,store).status).toBe('completed');
  });
  it('keeps the pending operation when its final receipt cannot commit',()=>{
    operation(()=>{});
    withInstallationDatabase(project,db=>db.exec("CREATE TRIGGER fail_receipt BEFORE UPDATE OF status ON installation_operations WHEN NEW.status='completed' BEGIN SELECT RAISE(ABORT,'injected receipt failure'); END"),{storeRoot:store});
    expect(()=>operation(()=>replace('note.md','durable'))).toThrow(/receipt failure/);
    const id=pendingId();expect(readFileSync(path.join(project,'note.md'),'utf8')).toBe('durable');
    withInstallationDatabase(project,db=>db.exec('DROP TRIGGER fail_receipt'),{storeRoot:store});
    expect(recoverInstallationOperation(project,id,'resume',false,store).status).toBe('completed');
  });

  it('recovers an actual exited writer using Store intent and exact file bytes',()=>{
    const script=`import {withInstallationOperation,recordPlannedFileChange,sealInstallationOperation} from './packages/cli/src/store/installation-state.ts';import{writeFileSync}from'node:fs';withInstallationOperation(${JSON.stringify(project)},'crash',()=>{recordPlannedFileChange(${JSON.stringify(project)},'crash.md',{kind:'file',content:'saved'},()=>writeFileSync(${JSON.stringify(path.join(project,'crash.md'))},'saved'));sealInstallationOperation(${JSON.stringify(project)});process.exit(23);},{storeRoot:${JSON.stringify(store)}});`;
    const child=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',script],{cwd:path.resolve('../..'),encoding:'utf8'});
    expect(child.status,child.stderr).toBe(23);const id=pendingId();
    expect(recoverInstallationOperation(project,id,'resume',true,store).status).toBe('ready');
    expect(existsSync(path.join(store,'store-access.lock'))).toBe(true);
    expect(recoverInstallationOperation(project,id,'resume',false,store).status).toBe('completed');
    expect(readFileSync(path.join(project,'crash.md'),'utf8')).toBe('saved');expect(existsSync(path.join(store,'store-access.lock'))).toBe(false);
  });

  it('refuses a read-only Store before touching project files',()=>{
    if(process.getuid?.()===0)return;
    operation(()=>{});const config=readFileSync(path.join(project,'.make-docs/config.yaml'));chmodSync(store,0o500);
    try{expect(()=>operation(()=>replace('new.md','no'))).toThrow();expect(existsSync(path.join(project,'new.md'))).toBe(false);expect(readFileSync(path.join(project,'.make-docs/config.yaml'))).toEqual(config);}finally{chmodSync(store,0o700);}
  });
  it('preserves newer Store data and rejects foreign drive syntax on this host',()=>{
    mkdirSync(store);const file=path.join(store,'store.db');const db=new DatabaseSync(file);db.exec('PRAGMA user_version=99');db.close();const before=readFileSync(file);expect(()=>operation(()=>{})).toThrow(/newer/);expect(readFileSync(file)).toEqual(before);expect(existsSync(path.join(project,'.make-docs'))).toBe(false);
    if(process.platform!=='win32')expect(()=>withInstallationOperation(project,'test',()=>{},{storeRoot:'C:\\MakeDocs\\Store'})).toThrow(/Windows/);
  });

});
