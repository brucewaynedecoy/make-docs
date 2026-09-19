import {afterEach,expect,it} from 'vitest';
import {existsSync,mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import os from 'node:os';
import path from 'node:path';

const require=createRequire(import.meta.url);
const sourceEntry=fileURLToPath(new URL('../src/index.ts',import.meta.url));
const candidateEntry=process.env.MAKE_DOCS_HELP_TEST_CLI;
const roots:string[]=[];
afterEach(()=>{for(const root of roots.splice(0))rmSync(root,{recursive:true,force:true});});

it.each([
  {args:['project','state','status','--help'],existing:false},
  {args:['project','state','status','-h'],existing:true},
  {args:['project','state','recover','--help'],existing:false},
  {args:['project','state','recover','-h'],existing:true},
  {args:['project','state','recover','unverified-id','--rollback','--help'],existing:true},
  {args:['setup','skills','--help'],existing:true},
])('reads $args with no Store access or project writes',({args,existing})=>{
  const temp=mkdtempSync(path.join(os.tmpdir(),'make-docs-help-'));roots.push(temp);
  const target=path.join(temp,'project'),store=path.join(temp,'store'),home=path.join(temp,'home');
  mkdirSync(home);
  if(existing){mkdirSync(path.join(target,'.make-docs'),{recursive:true});writeFileSync(path.join(target,'.make-docs/config.yaml'),'invalid: [');writeFileSync(store,'not a Store directory');}
  const child=spawnSync(process.execPath,[...(candidateEntry?[]:['--import',require.resolve('tsx')]),candidateEntry??sourceEntry,...args,args[0]==='setup'?'--target':'--target-root',target],{cwd:temp,env:{...process.env,HOME:home,MAKE_DOCS_HOME:store},encoding:'utf8',timeout:15000});
  expect(child.error,child.stderr).toBeUndefined();expect(child.status,child.stderr).toBe(0);
  expect(child.stdout).toContain('Usage:');
  if(args[0]==='project'){expect(child.stdout).toContain('project state status');expect(child.stdout).toContain('project state recover');expect(child.stdout).toContain('without reading the Store or changing files');}
  else {expect(child.stdout).toContain('A stale review cannot be applied.');expect(child.stdout).toContain('A required Store failure stops managed writes.');expect(child.stdout).toContain('Global Codex uses CODEX_HOME/skills (default ~/.codex/skills).');expect(child.stdout).toContain('Global Claude Code uses CLAUDE_CONFIG_DIR/skills (default ~/.claude/skills).');}
  if(existing){expect(readFileSync(path.join(target,'.make-docs/config.yaml'),'utf8')).toBe('invalid: [');expect(readFileSync(store,'utf8')).toBe('not a Store directory');}
  else {expect(existsSync(target)).toBe(false);expect(existsSync(store)).toBe(false);}
});
