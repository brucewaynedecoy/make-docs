import { existsSync, lstatSync, readFileSync, mkdirSync, writeFileSync, symlinkSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { getDesiredSkillAssets } from "../src/skill-catalog";
import { applyInstallPlan, planInstall, planSkillsOnlyInstall } from "../src/install";
import { loadManifest } from "../src/manifest";
import { defaultSelections } from "../src/profile";
import { loadSkillRegistry } from "../src/skill-registry";
import { PACKAGE_ROOT, hashText } from "../src/utils";
import * as resolver from "../src/skill-resolver";
import { createTempDir, cleanupTempDir } from "./helpers";

describe("W19 R5 standard native Skill layout", () => {
  let root: string;
  beforeEach(() => {
    root = createTempDir();
    vi.spyOn(resolver,"resolveSkillSource").mockResolvedValue({entryPointContent:"# Skill\n",assets:[]});
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); cleanupTempDir(root); });

  test.each(["codex", "claude-code", "both"] as const)("project %s creates only selected native folders", async tools => {
    const selections=defaultSelections();
    selections.harnesses={codex:tools!=="claude-code","claude-code":tools!=="codex"};
    selections.skills=true; selections.selectedSkills=["archive-docs"];
    const plan=await planInstall({targetDir:root,selections,existingManifest:null});
    applyInstallPlan({targetDir:root,plan,existingManifest:null});
    const canonical=tools==="claude-code" ? ".claude" : ".agents";
    expect(lstatSync(path.join(root,canonical,"skills/archive-docs")).isDirectory()).toBe(true);
    expect(lstatSync(path.join(root,canonical,"skills/archive-docs")).isSymbolicLink()).toBe(false);
    expect(readFileSync(path.join(root,canonical,"skills/archive-docs/SKILL.md"),"utf8")).toBe("# Skill\n");
    expect(existsSync(path.join(root,".make-docs/agentics"))).toBe(false);
    if (tools!=="both") expect(existsSync(path.join(root,tools==="codex" ? ".claude" : ".agents"))).toBe(false);
    else expect(lstatSync(path.join(root,".claude/skills/archive-docs")).isSymbolicLink()).toBe(true);
    const manifest=loadManifest(root)!;
    expect(manifest.files[canonical+"/skills/archive-docs"]).toBeUndefined();
    expect(manifest.files[canonical+"/skills/archive-docs/SKILL.md"].hash).toBe(hashText("# Skill\n"));
    const repeat=await planSkillsOnlyInstall({targetDir:root,selections,existingManifest:manifest,remove:false});
    expect(repeat.actions.every(a=>a.type==="noop")).toBe(true);
  });

  test.each(["both-to-claude", "claude-to-both"])("%s requires reviewed native type cutover", async direction => {
    const selections=defaultSelections(); selections.skills=true; selections.selectedSkills=["archive-docs"];
    selections.harnesses={codex:direction==="both-to-claude","claude-code":true};
    const base=await planInstall({targetDir:root,selections,existingManifest:null}); applyInstallPlan({targetDir:root,plan:base,existingManifest:null});
    const manifest=loadManifest(root)!;
    const original=lstatSync(path.join(root,".claude/skills/archive-docs")).isSymbolicLink();
    selections.skillHarnesses={codex:!selections.harnesses.codex,"claude-code":true};
    await expect(planSkillsOnlyInstall({targetDir:root,selections,existingManifest:manifest,remove:false})).rejects.toThrow("--adopt-existing");
    expect(lstatSync(path.join(root,".claude/skills/archive-docs")).isSymbolicLink()).toBe(original);
  });

  test("global exposure uses configured homes without adding a home prefix", async () => {
    vi.stubEnv("CODEX_HOME",path.join(root,"custom-codex"));
    vi.stubEnv("CLAUDE_CONFIG_DIR",path.join(root,"custom-claude"));
    const selections=defaultSelections(); selections.skills=true; selections.selectedSkills=["archive-docs"]; selections.skillScope="global";
    const assets=await getDesiredSkillAssets(selections);
    expect(assets.map(a=>a.relativePath)).toEqual(expect.arrayContaining([
      path.join(os.homedir(),".agents/skills/archive-docs/SKILL.md"),
      path.join(root,"custom-codex/skills/archive-docs"),path.join(root,"custom-claude/skills/archive-docs"),
    ]));
    expect(assets.some(a=>a.relativePath.includes("agentics"))).toBe(false);
    vi.stubEnv("CODEX_HOME",path.join(os.homedir(),".agents"));
    const sameRoot=await getDesiredSkillAssets(selections);
    expect(sameRoot.some(a=>a.kind==="skill-exposure" && a.skillExposure.harness==="codex")).toBe(false);
  });

  test("normal sync cannot claim an unowned matching copy in a configured global home", async () => {
    const selections=defaultSelections();
    const base=await planInstall({targetDir:root,selections,existingManifest:null}); applyInstallPlan({targetDir:root,plan:base,existingManifest:null});
    const manifest=loadManifest(root)!;
    const home=path.join(root,"fixture-home"), native=path.join(root,"custom-codex/skills/archive-docs");
    vi.stubEnv("HOME",home); vi.stubEnv("CODEX_HOME",path.dirname(path.dirname(native)));
    const canonical=path.join(home,".agents/skills/archive-docs/SKILL.md");
    mkdirSync(path.dirname(canonical),{recursive:true}); writeFileSync(canonical,"# Skill\n");
    mkdirSync(native,{recursive:true}); writeFileSync(path.join(native,"SKILL.md"),"# Skill\n");
    manifest.files[canonical]={hash:hashText("# Skill\n"),sourceId:"skill:shared:archive-docs"}; manifest.skillFiles=[canonical];
    selections.skills=true; selections.selectedSkills=["archive-docs"]; selections.skillScope="global"; selections.skillHarnesses={codex:true,"claude-code":false};
    const plan=await planSkillsOnlyInstall({targetDir:root,selections,existingManifest:manifest,remove:false});
    expect(plan.actions.find(action=>action.relativePath===native)).toMatchObject({type:"skip-conflict",reason:expect.stringContaining("--adopt-existing")});
    expect(manifest.files[native]).toBeUndefined();
    expect(readFileSync(path.join(native,"SKILL.md"),"utf8")).toBe("# Skill\n");
  });

  test("equal noncanonical global tool homes fail before any install write", async () => {
    const configured=path.join(root,"same-tool-home"); vi.stubEnv("CODEX_HOME",configured); vi.stubEnv("CLAUDE_CONFIG_DIR",configured);
    const selections=defaultSelections(); selections.skills=true; selections.selectedSkills=["archive-docs"]; selections.skillScope="global";
    await expect(getDesiredSkillAssets(selections)).rejects.toThrow("Use distinct CODEX_HOME and CLAUDE_CONFIG_DIR");
    expect(existsSync(configured)).toBe(false);
  });

  test.each(["project-empty","project-unknown","project-dangling","global-empty","global-unknown","global-dangling"])("normal Skill setup preserves and refuses %s legacy roots", async scenario => {
    const selections=defaultSelections(); selections.skills=true; selections.selectedSkills=["archive-docs"];
    selections.skillScope=scenario.startsWith("global") ? "global" : "project";
    const home=path.join(root,"fixture-home"); vi.stubEnv("HOME",home);
    const oldRoot=path.join(selections.skillScope==="global" ? home : root,".make-docs/agentics");
    mkdirSync(path.dirname(oldRoot),{recursive:true});
    if (scenario.endsWith("dangling")) symlinkSync("missing-owner-source",oldRoot);
    else { mkdirSync(oldRoot); if (scenario.endsWith("unknown")) writeFileSync(path.join(oldRoot,"owner-note"),"Keep me\n"); }
    await expect(planInstall({targetDir:root,selections,existingManifest:null})).rejects.toThrow("Unowned or unknown legacy content");
    expect(lstatSync(oldRoot).isSymbolicLink()).toBe(scenario.endsWith("dangling"));
    if (scenario.endsWith("unknown")) expect(readFileSync(path.join(oldRoot,"owner-note"),"utf8")).toBe("Keep me\n");
    expect(existsSync(path.join(root,".agents/skills"))).toBe(false);
    expect(existsSync(path.join(home,".agents/skills"))).toBe(false);
    selections.skills=false; selections.selectedSkills=[];
    await expect(planInstall({targetDir:root,selections,existingManifest:null})).resolves.toBeDefined();
  });

  test("an alternate Skill with no selected supported tool produces no payload", async () => {
    const selections=defaultSelections(); selections.skills=true; selections.selectedSkills=["archive-docs"]; selections.harnesses={codex:true,"claude-code":false};
    const registry=structuredClone(loadSkillRegistry(PACKAGE_ROOT)); registry.skills.find(s=>s.name==="archive-docs")!.supportedHarnesses=["claude-code"];
    expect(await getDesiredSkillAssets(selections,registry)).toEqual([]);
  });

  test("normal setup and sync refuse old Store ownership without touching old bytes", async () => {
    const selections=defaultSelections();
    const base=await planInstall({targetDir:root,selections,existingManifest:null}); applyInstallPlan({targetDir:root,plan:base,existingManifest:null});
    const manifest=loadManifest(root)!;
    const legacy=".make-docs/agentics/skills/archive-docs/SKILL.md";
    mkdirSync(path.dirname(path.join(root,legacy)),{recursive:true}); writeFileSync(path.join(root,legacy),"Owner bytes\n");
    manifest.files[legacy]={hash:hashText("Owner bytes\n"),sourceId:"skill:shared:archive-docs"}; manifest.skillFiles=[legacy];
    selections.skills=true; selections.selectedSkills=["archive-docs"];
    await expect(planInstall({targetDir:root,selections,existingManifest:manifest})).rejects.toThrow("reviewed cutover");
    await expect(planSkillsOnlyInstall({targetDir:root,selections,existingManifest:manifest,remove:false})).rejects.toThrow("--adopt-existing");
    expect(readFileSync(path.join(root,legacy),"utf8")).toBe("Owner bytes\n");
    expect(existsSync(path.join(root,".agents/skills"))).toBe(false);
    const remove=await planSkillsOnlyInstall({targetDir:root,selections,existingManifest:manifest,remove:true});
    expect(remove.actions.find(a=>a.relativePath===legacy)?.type).toBe("remove-managed");
    const review=await planSkillsOnlyInstall({targetDir:root,selections,existingManifest:manifest,remove:false,reviewedSkillAdoption:true});
    expect(review.desiredSkillFiles.some(p=>p.includes("agentics"))).toBe(false);
  });
});
