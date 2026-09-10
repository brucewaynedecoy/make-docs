import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {buildSkillAdoptionReview} from '../src/skills-adoption';
import {defaultSelections} from '../src/profile';
import {loadEffectiveSkillRegistry} from '../src/skill-registry';
import {applySkillRegistrySelectionMetadata} from '../src/skill-catalog';
import {PACKAGE_ROOT} from '../src/utils';
import {prepareDetachedInstallationOperation,readInstallationManifest,readInstallationStatus,recoverInstallationOperation} from '../src/store/installation-state';

const faults=vi.hoisted(()=>({link:false}));
vi.mock('node:fs',async original=>{const actual=await original<typeof import('node:fs')>();return {...actual,symlinkSync:(...args:Parameters<typeof actual.symlinkSync>)=>{if(faults.link)throw new Error('interrupted before native exposure');return actual.symlinkSync(...args);}};});
let temp:string,root:string,home:string,store:string;
const require=createRequire(import.meta.url);
const sourceEntry=fileURLToPath(new URL('../src/index.ts',import.meta.url));
// The same isolated recovery proof can target the final extracted or installed
// public entry. It never uses the target CLI's default Store or project.
const candidateEntry=process.env.MAKE_DOCS_RECOVERY_TEST_CLI;
beforeEach(()=>{
  if(candidateEntry && (!path.isAbsolute(candidateEntry) || !fs.statSync(candidateEntry).isFile()))throw new Error('MAKE_DOCS_RECOVERY_TEST_CLI must be an existing absolute CLI entry path.');
  temp=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'make-docs-recovery-cli-')));root=path.join(temp,'project');home=path.join(temp,'home');store=path.join(temp,'store');fs.mkdirSync(root);fs.mkdirSync(home);fs.writeFileSync(path.join(root,'notes.txt'),'unrelated project bytes');vi.stubEnv('HOME',home);vi.stubEnv('MAKE_DOCS_HOME',store);vi.stubEnv('CODEX_HOME',path.join(home,'.codex'));vi.stubEnv('CLAUDE_CONFIG_DIR',path.join(home,'.claude'));vi.stubEnv('MAKE_DOCS_DISABLE_SKILL_SYMLINKS','');vi.spyOn(os,'homedir').mockReturnValue(home);
});
afterEach(()=>{faults.link=false;vi.restoreAllMocks();vi.unstubAllEnvs();fs.rmSync(temp,{recursive:true,force:true});});
function cli(args:string[]) {
  const child=spawnSync(process.execPath,[...(candidateEntry?[]:['--import',require.resolve('tsx')]),candidateEntry??sourceEntry,...args,'--target-root',root,'--json'],{cwd:root,env:{...process.env,HOME:home,MAKE_DOCS_HOME:store},encoding:'utf8',timeout:20000});
  expect(child.error,child.stderr).toBeUndefined();
  expect(child.status,child.stderr||child.stdout).toBe(0);
  return JSON.parse(child.stdout);
}
describe('fresh public CLI Skill adoption recovery',()=>{
  it('loads pending adoption recovery through a fresh MCP stdio process',async()=>{
    const selections=defaultSelections();selections.skills=true;selections.selectedSkills=['preflight'];selections.harnesses={codex:true,'claude-code':false};
    const effectiveRegistry=loadEffectiveSkillRegistry({packageRoot:PACKAGE_ROOT});
    const review=await buildSkillAdoptionReview({targetDir:root,selections:applySkillRegistrySelectionMetadata(selections,effectiveRegistry),adoptExisting:['preflight'],effectiveRegistry});
    const prepared=prepareDetachedInstallationOperation(root,'setup.skills.adopt',()=>review.plan);
    const client=new Client({name:'make-docs-recovery-test',version:'1.0.0'},{capabilities:{}});
    const transport=new StdioClientTransport({command:process.execPath,args:[...(candidateEntry?[]:['--import',require.resolve('tsx')]),candidateEntry??sourceEntry,'mcp'],cwd:root,env:Object.fromEntries(Object.entries({...process.env,HOME:home,MAKE_DOCS_HOME:store}).filter((entry):entry is [string,string]=>entry[1]!==undefined)),stderr:'pipe'});
    let diagnostics='';transport.stderr?.on('data',chunk=>{diagnostics+=String(chunk);});
    try {
      try {await client.connect(transport);} catch(error) {throw new Error(`${String(error)}\n${diagnostics}`);}
      const status=await client.callTool({name:'make_docs_project_state_status',arguments:{targetRoot:root}});
      expect(status.isError).not.toBe(true);
      expect(JSON.stringify(status)).toContain('recovery-required');
      const checked=await client.callTool({name:'make_docs_project_state_recover',arguments:{targetRoot:root,operationId:prepared.operationId,mode:'resume',dryRun:true,allowWrite:true}});
      expect(checked.isError,JSON.stringify(checked)).not.toBe(true);
      expect(JSON.stringify(checked)).toContain(prepared.operationId);
      expect(fs.readdirSync(root)).toEqual(['notes.txt']);
      expect(readInstallationManifest(root)).toBeNull();
      const denied=await client.callTool({name:'make_docs_project_state_recover',arguments:{targetRoot:root,operationId:prepared.operationId,mode:'resume'}});
      expect(denied.isError).toBe(true);
      expect(readInstallationStatus(root).status).toBe('recovery-required');
    } finally {await client.close();}
  },30000);
  it.each([['project','resume'],['project','rollback'],['global','resume'],['global','rollback']] as const)('handles prepared, interrupted and finished %s adoption with %s',async(scope,mode)=>{
    const selections=defaultSelections();selections.skills=true;selections.selectedSkills=['preflight'];selections.skillScope=scope;selections.harnesses={codex:true,'claude-code':scope==='project'};
    const effectiveRegistry=loadEffectiveSkillRegistry({packageRoot:PACKAGE_ROOT});
    const review=await buildSkillAdoptionReview({targetDir:root,selections:applySkillRegistrySelectionMetadata(selections,effectiveRegistry),adoptExisting:['preflight'],effectiveRegistry});
    const prepared=prepareDetachedInstallationOperation(root,'setup.skills.adopt',()=>review.plan);
    expect(cli(['project','state','status']).status).toBe('recovery-required');
    const before=fs.readdirSync(root);
    const preview=cli(['project','state','recover',prepared.operationId,'--resume','--dry-run']);
    expect(preview.operationId).toBe(prepared.operationId);
    expect(fs.readdirSync(root)).toEqual(before);
    expect(readInstallationManifest(root)).toBeNull();
    faults.link=true;
    expect(()=>recoverInstallationOperation(root,prepared.operationId,'resume',false)).toThrow('interrupted before native exposure');
    faults.link=false;
    expect(readInstallationStatus(root).status).toBe('recovery-required');
    const canonical=path.join(scope==='global'?home:root,'.agents/skills/preflight');
    const native=path.join(scope==='global'?home:root,scope==='global'?'.codex/skills/preflight':'.claude/skills/preflight');
    expect(fs.lstatSync(canonical).isDirectory()).toBe(true);
    expect(fs.lstatSync(canonical).isSymbolicLink()).toBe(false);
    expect(fs.existsSync(native)).toBe(false);
    cli(['project','state','recover',prepared.operationId,`--${mode}`,'--dry-run']);
    expect(readInstallationStatus(root).status).toBe('recovery-required');
    const applied=cli(['project','state','recover',prepared.operationId,`--${mode}`]);
    expect(applied.status).toBe(mode==='resume'?'completed':'rolled-back');
    expect(cli(['project','state','recover',prepared.operationId,`--${mode}`,'--dry-run']).status).toBe(applied.status);
    if(mode==='resume'){expect(fs.lstatSync(native).isSymbolicLink()).toBe(true);expect(fs.realpathSync(native)).toBe(fs.realpathSync(canonical));expect(fs.readFileSync(path.join(canonical,'SKILL.md'))).toEqual(fs.readFileSync(path.join(native,'SKILL.md')));expect(readInstallationManifest(root)!.files[path.join(scope==='global'?home:'.','.agents/skills/preflight/SKILL.md')]).toBeDefined();expect(readInstallationManifest(root)!.selections.selectedSkills).toEqual(['preflight']);}
    else {expect(fs.existsSync(native)).toBe(false);expect(fs.existsSync(canonical)).toBe(false);expect(readInstallationManifest(root)).toBeNull();}
    expect(fs.readFileSync(path.join(root,'notes.txt'),'utf8')).toBe('unrelated project bytes');
    expect(fs.existsSync(path.join(root,'.make-docs/state'))).toBe(false);
  },30000);
});
