import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync, renameSync, symlinkSync, chmodSync, readdirSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { acquireStoreAccess, formatStoreIssue, makeStoreIssue, openStoreDatabase, recoverDeadStoreAccessSessions, StoreUnavailableError } from '../src/store/database';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { withInstallationOperation, withInstallationDatabase, sealInstallationOperation, preparePlannedFileChange, recordPlannedFileChange, readInstallationStatus, recoverInstallationOperation, readDeclarativeProjectId, readMigrationState, recordMigrationState, acquireInstallationLock, releaseInstallationLock, getInstallationCheckoutId } from '../src/store/installation-state';
import { serializeOperationError } from '../src/operations/context';

let temp:string, project:string, store:string;
beforeEach(()=>{temp=mkdtempSync(path.join(os.tmpdir(),'make-docs-installation-'));project=path.join(temp,'project');store=path.join(temp,'store');mkdirSync(project);});
afterEach(()=>rmSync(temp,{recursive:true,force:true}));
function operation(fn:()=>void) {return withInstallationOperation(project,'test.change',fn,{storeRoot:store});}
function replace(relative:string,content:string) {recordPlannedFileChange(project,relative,{kind:'file',content},()=>{mkdirSync(path.dirname(path.join(project,relative)),{recursive:true});writeFileSync(path.join(project,relative),content);});}
function pendingId() {const status=readInstallationStatus(project,store);return (status as any).pendingOperation.operation_id as string;}
async function waitUntil(check:()=>boolean, timeoutMs=5000) {const deadline=Date.now()+timeoutMs;while(!check()){if(Date.now()>=deadline)throw new Error('Timed out waiting for child process state.');await new Promise(resolve=>setTimeout(resolve,20));}}

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
  it('waits for a live writer and then acquires the same checkout',async()=>{const lock=acquireInstallationLock(project,store);const child=spawn(process.execPath,['--import','tsx','--input-type=module','-e',`import { acquireInstallationLock,releaseInstallationLock } from './packages/cli/src/store/installation-state.ts'; const lock=acquireInstallationLock(${JSON.stringify(project)},${JSON.stringify(store)}); releaseInstallationLock(lock);`],{cwd:path.resolve('../..'),stdio:['ignore','pipe','pipe']});const exited=once(child,'exit');let stderr='';child.stderr.on('data',value=>{stderr+=value});try{await new Promise(resolve=>setTimeout(resolve,150));expect(child.exitCode).toBeNull();}finally{releaseInstallationLock(lock);}const [code]=await exited;expect(code,stderr).toBe(0);});
  it('reads Store state while another process holds a checkout writer',async()=>{
    operation(()=>{});const ready=path.join(temp,'reader-ready');const release=path.join(temp,'reader-release');const script=`import{withInstallationOperation}from'./packages/cli/src/store/installation-state.ts';import{existsSync,writeFileSync}from'node:fs';const wait=new Int32Array(new SharedArrayBuffer(4));withInstallationOperation(${JSON.stringify(project)},'held-writer',()=>{writeFileSync(${JSON.stringify(ready)},'ready');while(!existsSync(${JSON.stringify(release)}))Atomics.wait(wait,0,0,20);},{storeRoot:${JSON.stringify(store)}});`;const child=spawn(process.execPath,['--import','tsx','--input-type=module','-e',script],{cwd:path.resolve('../..'),stdio:['ignore','pipe','pipe']});const exited=once(child,'exit');let stderr='';child.stderr.on('data',value=>{stderr+=value});try{await waitUntil(()=>existsSync(ready));const status=readInstallationStatus(project,store);expect(status.status).toBe('writer-active');expect(status.storeAvailable).toBe(true);}finally{writeFileSync(release,'go');}const [code]=await exited;expect(code,stderr).toBe(0);
  });
  it('runs managed operations for separate checkouts at the same time',async()=>{
    const second=path.join(temp,'second');mkdirSync(second);const release=path.join(temp,'release');
    const ready=[path.join(temp,'ready-a'),path.join(temp,'ready-b')];const roots=[project,second];
    const children=roots.map((root,index)=>{const script=`import {withInstallationOperation,recordPlannedFileChange} from './packages/cli/src/store/installation-state.ts';import{existsSync,writeFileSync}from'node:fs';const wait=new Int32Array(new SharedArrayBuffer(4));withInstallationOperation(${JSON.stringify(root)},'concurrent',()=>{recordPlannedFileChange(${JSON.stringify(root)},'result.txt',{kind:'file',content:'done'},()=>writeFileSync(${JSON.stringify(path.join(root,'result.txt'))},'done'));writeFileSync(${JSON.stringify(ready[index])},'ready');while(!existsSync(${JSON.stringify(release)}))Atomics.wait(wait,0,0,20);},{storeRoot:${JSON.stringify(store)}});`;return spawn(process.execPath,['--import','tsx','--input-type=module','-e',script],{cwd:path.resolve('../..'),stdio:['ignore','pipe','pipe']});});
    const stderr=['',''];const exits=children.map(child=>once(child,'exit'));children.forEach((child,index)=>child.stderr.on('data',value=>{stderr[index]+=value}));
    try{try{await waitUntil(()=>ready.every(file=>existsSync(file)),10_000);}catch(error){const state=existsSync(store)?readdirSync(store).map(name=>{const target=path.join(store,name);return statSync(target).isDirectory()?`${name}/[${readdirSync(target).map(entry=>`${entry}:${readFileSync(path.join(target,entry),'utf8')}`).join(',')}]`:name.endsWith('.lock')?`${name}:${readFileSync(target,'utf8')}`:name;}).join('\n'):'Store absent';throw new Error(`${String(error)}\nStore: ${store}\n${state}\nchild-a ${children[0].pid}:\n${stderr[0]}\nchild-b ${children[1].pid}:\n${stderr[1]}`);}writeFileSync(release,'go');const results=await Promise.all(exits);results.forEach(([code],index)=>expect(code,stderr[index]).toBe(0));expect(readFileSync(path.join(project,'result.txt'),'utf8')).toBe('done');expect(readFileSync(path.join(second,'result.txt'),'utf8')).toBe('done');}
    finally{writeFileSync(release,'go');for(const child of children)if(child.exitCode===null)child.kill('SIGKILL');}
  },20_000);
  it('keeps shared Store sessions safe under 20 processes and five checkouts',async()=>{
    operation(()=>{});const roots=[project,...Array.from({length:4},(_,index)=>path.join(temp,`stress-${index}`))];for(const root of roots.slice(1)){mkdirSync(root);withInstallationOperation(root,'prepare',()=>{},{storeRoot:store});}
    const children=Array.from({length:20},(_,index)=>{const root=roots[index%roots.length];const file=`result-${index}.txt`;const script=`import {withInstallationOperation,recordPlannedFileChange} from './packages/cli/src/store/installation-state.ts';import{writeFileSync}from'node:fs';withInstallationOperation(${JSON.stringify(root)},'stress',()=>recordPlannedFileChange(${JSON.stringify(root)},${JSON.stringify(file)},{kind:'file',content:'done'},()=>writeFileSync(${JSON.stringify(path.join(root,file))},'done')),{storeRoot:${JSON.stringify(store)}});`;return spawn(process.execPath,['--import','tsx','--input-type=module','-e',script],{cwd:path.resolve('../..'),stdio:['ignore','pipe','pipe']});});
    const stderr=Array.from({length:children.length},()=>"");const exits=children.map(child=>once(child,'exit'));children.forEach((child,index)=>child.stderr.on('data',value=>{stderr[index]+=value}));
    const results=await Promise.all(exits);results.forEach(([code],index)=>expect(code,stderr[index]).toBe(0));for(let index=0;index<20;index++)expect(readFileSync(path.join(roots[index%roots.length],`result-${index}.txt`),'utf8')).toBe('done');
  },20_000);
  it('uses one secure Store session record for nested process access',()=>{
    operation(()=>{});const directory=path.join(store,'store-access.lock');const first=acquireStoreAccess(store);const second=acquireStoreAccess(store);
    try{const entries=readdirSync(directory);expect(entries).toHaveLength(1);const file=path.join(directory,entries[0]);const record=JSON.parse(readFileSync(file,'utf8'));expect(record).toMatchObject({version:1,pid:process.pid,hostname:os.hostname()});expect(record.token).toBe(entries[0].replace(/\.json$/,''));expect(Number.isNaN(Date.parse(record.startedAt))).toBe(false);if(process.platform!=='win32'){expect(statSync(directory).mode&0o777).toBe(0o700);expect(statSync(file).mode&0o777).toBe(0o600);}second();expect(existsSync(file)).toBe(true);}finally{first();}
    expect(existsSync(directory)).toBe(false);
  });
  it('keeps live legacy leases and replaces only a proven-dead local lease',()=>{
    operation(()=>{});const access=path.join(store,'store-access.lock');const active=JSON.stringify({token:'legacy-live',pid:process.pid,hostname:os.hostname(),startedAt:new Date().toISOString()});writeFileSync(access,active,{mode:0o600});
    let error:unknown;try{acquireStoreAccess(store,false,0);}catch(value){error=value;}expect(error).toBeInstanceOf(StoreUnavailableError);expect((error as StoreUnavailableError).issue).toMatchObject({code:'contention-timeout',path:access});expect(readFileSync(access,'utf8')).toBe(active);rmSync(access);
    writeFileSync(access,JSON.stringify({token:'legacy-dead',pid:2147483647,hostname:os.hostname(),startedAt:new Date().toISOString()}),{mode:0o600});const release=acquireStoreAccess(store,false,0);expect(statSync(access).isDirectory()).toBe(true);release();expect(existsSync(access)).toBe(false);
  });
  it.each([
    ['remote',JSON.stringify({token:'legacy-remote',pid:process.pid,hostname:`${os.hostname()}-other`,startedAt:new Date().toISOString()})],
    ['malformed','{"token":'],
  ])('preserves an unverified %s legacy lease',(_name,raw)=>{
    operation(()=>{});const access=path.join(store,'store-access.lock');writeFileSync(access,raw,{mode:0o600});let error:unknown;try{acquireStoreAccess(store,false,0);}catch(value){error=value;}expect(error).toBeInstanceOf(StoreUnavailableError);expect((error as StoreUnavailableError).issue.code).toBe('owner-unverified');expect(readFileSync(access,'utf8')).toBe(raw);
  });
  it('removes dead shared sessions and preserves live shared sessions',()=>{
    operation(()=>{});const directory=path.join(store,'store-access.lock');mkdirSync(directory,{mode:0o700});const startedAt=new Date().toISOString();const dead=path.join(directory,'dead.json');const live=path.join(directory,'live.json');writeFileSync(dead,JSON.stringify({version:1,token:'dead',pid:2147483647,hostname:os.hostname(),startedAt}),{mode:0o600});writeFileSync(live,JSON.stringify({version:1,token:'live',pid:process.pid,hostname:os.hostname(),startedAt}),{mode:0o600});const result=recoverDeadStoreAccessSessions(store);expect(result.removed).toEqual(['store-access.lock/dead.json']);expect(result.active).toEqual([{file:live,pid:process.pid,hostname:os.hostname()}]);expect(existsSync(dead)).toBe(false);expect(existsSync(live)).toBe(true);
  });
  it('keeps Store issue detail in CLI and MCP error data',()=>{
    const native=Object.assign(new Error('permission denied by test'),{code:'EACCES'});const issue=makeStoreIssue('io-error',path.join(store,'store.db'),'open Store database',native,{attempts:2,waitedMs:25});const error=new StoreUnavailableError(issue);expect(error.message).toContain('needs read and write access');expect(error.message).toContain('No project files changed.');expect(serializeOperationError(error)).toMatchObject({code:'store-unavailable',issue:{code:'access-denied',systemCode:'EACCES',operation:'open Store database',attempts:2,waitedMs:25}});expect(makeStoreIssue('io-error',store,'test',Object.assign(new Error('blocked'),{code:'EPERM'})).code).toBe('access-denied');expect(makeStoreIssue('io-error',store,'test',Object.assign(new Error('read only'),{code:'EROFS'})).code).toBe('read-only-filesystem');const after=formatStoreIssue(issue,{projectMutationStarted:true,pendingOperationId:'operation-test'});expect(after).toContain('Project files may have changed.');expect(after).toContain('Pending operation: operation-test.');expect(after).toContain('make-docs project state status');expect(after).not.toContain('No project files changed.');
  });
  it('never retries the project mutation callback after a failure',()=>{
    let calls=0;let error:unknown;try{operation(()=>{calls++;replace('once.md','once');throw new Error('one callback failure');});}catch(value){error=value;}expect(calls).toBe(1);expect(readFileSync(path.join(project,'once.md'),'utf8')).toBe('once');expect((error as Error).message).toContain('Project files may have changed.');expect((error as Error).message).toContain('Pending operation:');
  });
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
    expect(()=>operation(()=>replace('must-not-run.md','no'))).toThrow(/stopped|recover/i);expect(existsSync(path.join(project,'must-not-run.md'))).toBe(false);
    expect(recoverInstallationOperation(project,id,'resume',true,store).status).toBe('ready');
    expect(existsSync(path.join(store,'store-access.lock'))).toBe(false);
    expect(recoverInstallationOperation(project,id,'resume',false,store).status).toBe('completed');
    expect(readFileSync(path.join(project,'crash.md'),'utf8')).toBe('saved');expect(existsSync(path.join(store,'store-access.lock'))).toBe(false);
  });

  it('refuses a read-only Store before touching project files',()=>{
    if(process.getuid?.()===0)return;
    operation(()=>{});const config=readFileSync(path.join(project,'.make-docs/config.yaml'));chmodSync(store,0o500);
    try{let error:unknown;try{operation(()=>replace('new.md','no'));}catch(value){error=value;}expect(error).toBeInstanceOf(StoreUnavailableError);expect((error as StoreUnavailableError).issue.code).toBe('access-denied');expect((error as Error).message).toContain('needs read and write access');expect((error as Error).message).toContain('No project files changed.');expect(existsSync(path.join(project,'new.md'))).toBe(false);expect(readFileSync(path.join(project,'.make-docs/config.yaml'))).toEqual(config);}finally{chmodSync(store,0o700);}
  });
  it('preserves newer Store data and rejects foreign drive syntax on this host',()=>{
    mkdirSync(store);const file=path.join(store,'store.db');const db=new DatabaseSync(file);db.exec('PRAGMA user_version=99');db.close();const before=readFileSync(file);expect(()=>operation(()=>{})).toThrow(/newer/);expect(readFileSync(file)).toEqual(before);expect(existsSync(path.join(project,'.make-docs'))).toBe(false);
    if(process.platform!=='win32')expect(()=>withInstallationOperation(project,'test',()=>{},{storeRoot:'C:\\MakeDocs\\Store'})).toThrow(/Windows/);
  });

});
