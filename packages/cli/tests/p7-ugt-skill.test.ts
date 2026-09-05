import { existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { executePreparedBackup, prepareBackupExecution } from "../src/backup";
import { applyInstallPlan, applySkillsOnlyInstallPlan, planInstall, planSkillsOnlyInstall } from "../src/install";
import { loadManifest } from "../src/manifest";
import { defaultSelections } from "../src/profile";
import { loadSkillRegistry, type SkillRegistry } from "../src/skill-registry";
import { PACKAGE_ROOT, TEMPLATE_ROOT } from "../src/utils";
import { cleanupTempDir, createTempDir } from "./helpers";

const canonical = ".make-docs/agentics/skills/naive-uat";
const exposures = [".claude/skills/naive-uat", ".agents/skills/naive-uat"];
const payload = () => readFileSync(path.join(TEMPLATE_ROOT, canonical, "SKILL.md"), "utf8");
const roots: string[] = [];
const temp = () => { const root = createTempDir("make-docs-p7-skill-"); roots.push(root); return root; };

async function install(targetDir: string, selected = true, skillRegistry?: SkillRegistry) {
  const selections = defaultSelections();
  selections.skills = selected;
  selections.selectedSkills = selected ? ["naive-uat"] : [];
  selections.harnesses = { "claude-code": true, codex: true };
  const existingManifest = loadManifest(targetDir);
  const plan = await planInstall({ targetDir, selections, existingManifest, skillRegistry });
  applyInstallPlan({ targetDir, plan, existingManifest });
  return loadManifest(targetDir)!;
}

describe("P7 optional bundled UGT Skill lifecycle", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unexpected network request"); }));
    vi.stubEnv("MAKE_DOCS_DISABLE_SKILL_SYMLINKS", "0");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    for (const root of roots.splice(0)) cleanupTempDir(root);
  });

  test("S1 installs the local payload only after explicit selection", async () => {
    const target = temp();
    const bare = await install(target, false);
    expect(bare.selections.selectedSkills).toEqual([]);
    expect(existsSync(path.join(target, canonical))).toBe(false);
    const registry = loadSkillRegistry(PACKAGE_ROOT);
    const entry = registry.skills.find((skill) => skill.name === "naive-uat")!;
    expect(entry.source.startsWith("file:")).toBe(true);
    expect(entry.defaultForPurposes ?? []).toEqual([]);
    const manifest = await install(target);
    expect(manifest.selections.selectedSkills).toEqual(["naive-uat"]);
    expect(readFileSync(path.join(target, canonical, "SKILL.md"), "utf8")).toBe(payload());
    expect(manifest.skillFiles).toContain(`${canonical}/SKILL.md`);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("S2 backs up the owned payload and updates it through the shared lifecycle", async () => {
    const target = temp();
    const oldSource = temp();
    const oldPayload = `${payload()}\nPrevious release fixture.\n`;
    writeFileSync(path.join(oldSource, "SKILL.md"), oldPayload);
    const oldRegistry = loadSkillRegistry(PACKAGE_ROOT);
    oldRegistry.skills.find((skill) => skill.name === "naive-uat")!.source = pathToFileURL(oldSource).href;
    await install(target, true, oldRegistry);
    const prepared = await prepareBackupExecution({ targetDir: target, now: new Date("2026-09-04T12:00:00Z") });
    const backup = executePreparedBackup(prepared);
    expect(backup.status).toBe("completed");
    const saved = prepared.copyableFiles.find((file) => file.absolutePath === path.join(target, canonical, "SKILL.md"))!;
    expect(saved).toBeDefined();
    expect(readFileSync(path.join(backup.destinationDir!, saved.backupRelativePath), "utf8")).toBe(oldPayload);
    const existingManifest = loadManifest(target)!;
    const plan = await planSkillsOnlyInstall({ targetDir: target, selections: existingManifest.selections, existingManifest, remove: false });
    applySkillsOnlyInstallPlan({ targetDir: target, plan, existingManifest });
    expect(readFileSync(path.join(target, canonical, "SKILL.md"), "utf8")).toBe(payload());
    expect(readFileSync(path.join(backup.destinationDir!, saved.backupRelativePath), "utf8")).toBe(oldPayload);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("S3 exposes the same Skill through native symlinks and copy mirrors", async () => {
    for (const mode of ["symlink", "copy-mirror"] as const) {
      vi.stubEnv("MAKE_DOCS_DISABLE_SKILL_SYMLINKS", mode === "copy-mirror" ? "1" : "0");
      const target = temp();
      const manifest = await install(target);
      for (const exposure of exposures) {
        expect(manifest.files[exposure]?.skillExposure?.mode).toBe(mode);
        expect(lstatSync(path.join(target, exposure)).isSymbolicLink()).toBe(mode === "symlink");
        if (mode === "symlink") expect(path.resolve(target, exposure, "..", readlinkSync(path.join(target, exposure)))).toBe(path.join(target, canonical));
        expect(readFileSync(path.join(target, exposure, "SKILL.md"), "utf8")).toBe(payload());
      }
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  test("S4 removes only owned Skill files and preserves ownership-conflict and custom content", async () => {
    vi.stubEnv("MAKE_DOCS_DISABLE_SKILL_SYMLINKS", "1");
    const cleanTarget = temp();
    const cleanManifest = await install(cleanTarget);
    const cleanPlan = await planSkillsOnlyInstall({ targetDir: cleanTarget, selections: cleanManifest.selections, existingManifest: cleanManifest, remove: true });
    applySkillsOnlyInstallPlan({ targetDir: cleanTarget, plan: cleanPlan, existingManifest: cleanManifest });
    for (const owned of [canonical, ...exposures]) expect(existsSync(path.join(cleanTarget, owned, "SKILL.md"))).toBe(false);
    const target = temp();
    await install(target);
    const custom = path.join(target, ".agents/skills/custom/SKILL.md");
    mkdirSync(path.dirname(custom), { recursive: true });
    writeFileSync(custom, "User Skill\n");
    const changed = path.join(target, exposures[0], "SKILL.md");
    writeFileSync(changed, "User changed mirror\n");
    const extra = path.join(target, exposures[1], "notes.txt");
    writeFileSync(extra, "User notes\n");
    const existingManifest = loadManifest(target)!;
    const plan = await planSkillsOnlyInstall({ targetDir: target, selections: existingManifest.selections, existingManifest, remove: true });
    applySkillsOnlyInstallPlan({ targetDir: target, plan, existingManifest });
    expect(existsSync(path.join(target, canonical, "SKILL.md"))).toBe(false);
    // A custom child removes proof of ownership for the complete native mirror.
    expect(readFileSync(path.join(target, exposures[1], "SKILL.md"), "utf8")).toBe(payload());
    expect(readFileSync(changed, "utf8")).toBe("User changed mirror\n");
    expect(readFileSync(extra, "utf8")).toBe("User notes\n");
    expect(readFileSync(custom, "utf8")).toBe("User Skill\n");
    expect(fetch).not.toHaveBeenCalled();
  });
});
