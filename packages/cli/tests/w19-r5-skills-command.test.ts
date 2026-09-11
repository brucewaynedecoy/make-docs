import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {stdin,stdout,stderr} from 'node:process';
import {runSkillsCommand} from '../src/skills-command';
import {readInstallationManifest} from '../src/store/installation-state';
import {installMakeDocsTarget} from './helpers';
import {defaultSelections,resolveInstallProfile} from '../src/profile';
import {writeManifest} from '../src/manifest';
const ui=vi.hoisted(()=>({accept:false,confirm:vi.fn()}));
vi.mock('@clack/prompts',async original=>({...await original<typeof import('@clack/prompts')>(),confirm:ui.confirm}));
let temp:string,root:string,store:string,log:string,summary:string,restoreTty:(()=>void)[];
beforeEach(()=>{temp=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'make-docs-adopt-command-')));root=path.join(temp,'project');store=path.join(temp,'store');fs.mkdirSync(root);const home=path.join(temp,'home');fs.mkdirSync(home);vi.stubEnv('HOME',home);vi.stubEnv('MAKE_DOCS_HOME',store);vi.spyOn(os,'homedir').mockReturnValue(home);log='';summary='';restoreTty=[];vi.spyOn(stderr,'write').mockImplementation((chunk:any)=>{summary+=String(chunk);return true;});vi.spyOn(stdout,'write').mockImplementation((chunk:any)=>{log+=String(chunk);return true;});ui.confirm.mockImplementation(async()=>ui.accept);ui.accept=false;});
afterEach(()=>{for(const restore of restoreTty)restore();vi.restoreAllMocks();vi.unstubAllEnvs();ui.confirm.mockClear();fs.rmSync(temp,{recursive:true,force:true});});
function tty(value:boolean){for(const stream of [stdin,stdout]){const descriptor=Object.getOwnPropertyDescriptor(stream,'isTTY');Object.defineProperty(stream,'isTTY',{value,configurable:true});restoreTty.push(()=>{if(descriptor)Object.defineProperty(stream,'isTTY',descriptor);else delete (stream as {isTTY?:boolean}).isTTY;});}}
function command(){return {targetDir:root,dryRun:false,yes:true,remove:false,noCodex:false,noClaudeCode:true,selectedSkills:['preflight'],adoptExisting:['preflight']};}
describe('public Skill adoption approval gate',()=>{
 it('uses different profile IDs for different saved native Skill tools',()=>{const selections=defaultSelections();const a=resolveInstallProfile({...selections,skillHarnesses:{codex:true,'claude-code':false}});const b=resolveInstallProfile({...selections,skillHarnesses:{codex:true,'claude-code':true}});expect(a.profileId).not.toBe(b.profileId);});
 it('prints full review on dry run and rejects yes without that digest',async()=>{await runSkillsCommand({...command(),dryRun:true});const review=JSON.parse(log);expect(review.status).toBe('ready');expect(review.selectedTools).toEqual(['codex']);expect(review.inventory).toBeDefined();expect(review.changes.length).toBeGreaterThan(0);expect(fs.readdirSync(root)).toEqual([]);expect(fs.existsSync(store)).toBe(false);await expect(runSkillsCommand(command())).rejects.toThrow(/--yes does not approve/);expect(fs.readdirSync(root)).toEqual([]);});
 it('cancels the interactive review without state or content writes',async()=>{tty(true);await runSkillsCommand({...command(),yes:false});expect(ui.confirm).toHaveBeenCalledOnce();expect(log).toContain('reviewDigest');expect(summary).toContain('No adoption changes have been applied.');expect(log).toContain('cancelled');expect(fs.readdirSync(root)).toEqual([]);expect(fs.existsSync(store)).toBe(false);});
 it('uses the displayed digest for interactive confirmation',async()=>{tty(true);ui.accept=true;await runSkillsCommand({...command(),yes:false});expect(ui.confirm).toHaveBeenCalledOnce();expect(readInstallationManifest(root)!.selections.selectedSkills).toEqual(['preflight']);expect(log).toContain('"status": "completed"');});
 it('keeps Codex-only Skill selection on later plain sync in a two-router project',async()=>{await installMakeDocsTarget(root);const before=readInstallationManifest(root)!;expect(before.selections.harnesses).toEqual({codex:true,'claude-code':true});await runSkillsCommand({...command(),dryRun:true});const digest=JSON.parse(log).reviewDigest;log='';await runSkillsCommand({...command(),review:digest});const saved=readInstallationManifest(root)!;expect(saved.selections.harnesses).toEqual(before.selections.harnesses);expect(saved.selections.skillHarnesses).toEqual({codex:true,'claude-code':false});expect(fs.existsSync(path.join(root,'.claude/skills/preflight'))).toBe(false);log='';await runSkillsCommand({targetDir:root,dryRun:false,yes:true,remove:false,noCodex:false,noClaudeCode:false});expect(fs.existsSync(path.join(root,'.claude/skills/preflight'))).toBe(false);expect(log).toContain('No make-docs skill changes');});
 it('summarizes ownership-only adoption on stderr while stdout remains complete JSON',async()=>{
  await installMakeDocsTarget(root);const names=['factory','human-experience','preflight'];
  for(const name of names)fs.cpSync(path.resolve('../../packages/skills',name),path.join(root,'.agents/skills',name),{recursive:true});
  const input={...command(),selectedSkills:names,adoptExisting:names};log='';summary='';await runSkillsCommand({...input,dryRun:true});
  const review=JSON.parse(log);expect(review.status).toBe('ready');expect(review.changes).toEqual([]);expect(review.backups).toEqual([]);expect(review.ownership.filter((row:{effect:string})=>row.effect==='register')).toHaveLength(12);
  expect(summary).toContain('No file contents will change.');expect(summary).toContain('If approved, Make Docs will manage 12 existing files across 3 Skills.');expect(summary).toContain('Ownership entries: 12 to register, 0 to update, 0 to remove, 0 to retain.');expect(summary).toContain('No adoption changes have been applied.');expect(readInstallationManifest(root)!.selections.selectedSkills).not.toContain('preflight');
  log='';summary='';await runSkillsCommand({...input,review:review.reviewDigest});expect(JSON.parse(log).status).toBe('completed');
  log='';summary='';await runSkillsCommand({...input,dryRun:true});const repeat=JSON.parse(log);expect(repeat.status).toBe('unchanged');expect(summary).toContain('Make Docs already manages 12 files and 0 native exposures across 3 Skills.');expect(summary).toContain('No file or ownership changes are needed.');expect(summary).toContain('0 to register, 0 to update, 0 to remove, 12 to retain.');expect(summary).not.toContain('will manage');
 });
 it('renames a trusted managed Software Factory installation to Factory',async()=>{
  await installMakeDocsTarget(root,selections=>{selections.skills=true;selections.selectedSkills=['factory'];selections.harnesses={codex:true,'claude-code':false};selections.skillHarnesses={codex:true,'claude-code':false};});
  const current=readInstallationManifest(root)!;
  const currentRoot='.agents/skills/factory',legacyRoot='.agents/skills/software-factory';
  fs.renameSync(path.join(root,currentRoot),path.join(root,legacyRoot));
  const legacyPath=(value:string)=>value.replace(currentRoot,legacyRoot);
  current.selections.selectedSkills=['software-factory'];
  current.selections.skillManifest={manifestId:'make-docs.first-party',displayName:'Make Docs first-party Skills',sourcePolicyKind:'first-party',source:'built-in'};
  current.selections.skillSelectionProvenance=[{skillName:'software-factory',displayName:'Software Factory',manifestId:'make-docs.first-party',manifestDisplayName:'Make Docs first-party Skills',sourcePolicyKind:'first-party',purposeIds:[],purposeLabels:[],supportedHarnesses:['codex','claude-code'],skillSource:'embedded:software-factory',provenanceKind:'first-party',provenanceLabel:'Make Docs first-party Skill'}];
  current.skillFiles=current.skillFiles.map(legacyPath);
  current.files=Object.fromEntries(Object.entries(current.files).map(([file,entry])=>[legacyPath(file),entry]));
  writeManifest(root,current);
  log='';summary='';
  await runSkillsCommand({targetDir:root,dryRun:false,yes:true,remove:false,noCodex:false,noClaudeCode:false});
  expect(fs.existsSync(path.join(root,currentRoot,'SKILL.md'))).toBe(true);
  expect(fs.existsSync(path.join(root,legacyRoot))).toBe(false);
  const updated=readInstallationManifest(root)!;
  expect(updated.selections.selectedSkills).toEqual(['factory']);
  expect(updated.selections.skillSelectionProvenance?.map(entry=>entry.skillName)).toEqual(['factory']);
  expect(updated.skillFiles.some(file=>file.startsWith(`${legacyRoot}/`))).toBe(false);
 });
 it('states blockers without claiming approval or ownership writes',async()=>{
  fs.mkdirSync(path.join(root,'.agents/skills/preflight'),{recursive:true});fs.writeFileSync(path.join(root,'.agents/skills/preflight/unknown.txt'),'preserve');await runSkillsCommand({...command(),dryRun:true});const review=JSON.parse(log);expect(review.status).toBe('blocked');expect(summary).toContain('Adoption is blocked. No changes have been made.');expect(summary).toContain('Unknown extra file:');expect(summary).not.toContain('will manage');expect(fs.existsSync(store)).toBe(false);
 });

 it('counts only newly registered Skills in a mixed managed and unowned review',async()=>{
  await installMakeDocsTarget(root);await runSkillsCommand({...command(),dryRun:true});const digest=JSON.parse(log).reviewDigest;log='';await runSkillsCommand({...command(),review:digest});
  fs.cpSync(path.resolve('../../packages/skills/human-experience'),path.join(root,'.agents/skills/human-experience'),{recursive:true});log='';summary='';await runSkillsCommand({...command(),selectedSkills:['preflight','human-experience'],adoptExisting:['preflight','human-experience'],dryRun:true});
  const review=JSON.parse(log);expect(review.status).toBe('ready');expect(review.changes).toEqual([]);expect(summary).toContain('If approved, Make Docs will manage 3 existing files across 1 Skill.');expect(summary).toContain('3 to register, 0 to update, 0 to remove, 4 to retain.');expect(summary).not.toContain('across 2 Skills');
 });

 it.each([
  {scope:'project' as const,noCodex:true,noClaudeCode:false,tools:'Claude Code',roots:['.claude/skills']},
  {scope:'project' as const,noCodex:false,noClaudeCode:true,tools:'Codex',roots:['.agents/skills']},
  {scope:'project' as const,noCodex:false,noClaudeCode:false,tools:'Claude Code, Codex',roots:['.agents/skills','.claude/skills']},
  {scope:'global' as const,noCodex:false,noClaudeCode:false,tools:'Claude Code, Codex',roots:['GLOBAL']},
 ])('shows the reviewed $scope tool selection and exact Skill roots',async({scope,noCodex,noClaudeCode,tools,roots})=>{
  const codex=path.join(temp,'custom-codex'),claude=path.join(temp,'custom-claude');
  vi.stubEnv('CODEX_HOME',codex);vi.stubEnv('CLAUDE_CONFIG_DIR',claude);
  await runSkillsCommand({...command(),dryRun:true,skillScope:scope,noCodex,noClaudeCode});
  const review=JSON.parse(log);expect(review.scope).toBe(scope);
  expect(summary).toContain(`Scope: ${scope}.`);expect(summary).toContain(`Selected tools: ${tools}.`);
  const expected=scope==='global'?[path.join(temp,'home/.agents/skills'),path.join(codex,'skills'),path.join(claude,'skills')].sort():roots;
  expect(summary).toContain(`Skill roots: ${expected.join(', ')}.`);
  if(scope==='project'&&noCodex)expect(summary).not.toContain('.agents/skills');
  expect(fs.existsSync(store)).toBe(false);expect(fs.readdirSync(root)).toEqual([]);
 });

});
