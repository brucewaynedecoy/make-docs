import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createAuditReport } from "../src/audit";
import { executePreparedBackup, prepareBackupExecution } from "../src/backup";
import { applyInstallPlan, applySkillsOnlyInstallPlan, planInstall, planSkillsOnlyInstall } from "../src/install";
import { getManifestFileHash, loadManifest } from "../src/manifest";
import { renderManagedBlock } from "../src/managed-block";
import { defaultSelections } from "../src/profile";
import * as resolver from "../src/skill-resolver";
import { readInstallationStatus } from "../src/store/installation-state";
import { hashText } from "../src/utils";
import { cleanupTempDir, createTempDir } from "./helpers";

describe("W19 R5 Skill byte preservation", () => {
  let root: string;
  let bytes: Buffer;
  const binary = ".agents/skills/archive-docs/assets/sample.bin";

  beforeEach(() => {
    root = createTempDir();
    bytes = Buffer.from([0, 255, 254, 128, 195, 40, 13, 10, 0]);
    vi.spyOn(resolver, "resolveSkillSource").mockImplementation(async () => ({
      entryPointContent: "---\nname: archive-docs\ndescription: Test byte preservation.\n---\n# Archive\n",
      assets: [
        { installPath: "assets/sample.bin", sourcePath: "assets/sample.bin", content: Buffer.from(bytes) },
        { installPath: "examples/AGENTS.md", sourcePath: "examples/AGENTS.md", content: "Plain Skill example.\n" },
      ],
    }));
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    cleanupTempDir(root);
  });

  async function initialInstall() {
    const selections = defaultSelections();
    selections.harnesses = { codex: true, "claude-code": true };
    const base = await planInstall({ targetDir: root, selections, existingManifest: null });
    applyInstallPlan({ targetDir: root, plan: base, existingManifest: null });
    selections.skills = true;
    selections.selectedSkills = ["archive-docs"];
    return selections;
  }

  test.each(["symlink", "copy-mirror"])("keeps raw bytes through %s install, repeat, audit, backup, and removal", async mode => {
    if (mode === "copy-mirror") vi.stubEnv("MAKE_DOCS_DISABLE_SKILL_SYMLINKS", "1");
    const selections = await initialInstall();
    let manifest = loadManifest(root)!;
    const plan = await planSkillsOnlyInstall({ targetDir: root, selections, existingManifest: manifest, remove: false });
    expect(Buffer.isBuffer(plan.actions.find(a => a.relativePath === binary)?.content)).toBe(true);
    applySkillsOnlyInstallPlan({ targetDir: root, plan, existingManifest: manifest });
    manifest = loadManifest(root)!;
    expect(readFileSync(path.join(root, binary))).toEqual(bytes);
    expect(manifest.files[binary].hash).toBe(hashText(bytes));
    expect(manifest.files[".agents/skills/archive-docs/examples/AGENTS.md"].hash).toBe(hashText("Plain Skill example.\n"));
    for (const harness of [".agents", ".claude"]) expect(readFileSync(path.join(root, harness, "skills/archive-docs/assets/sample.bin"))).toEqual(bytes);

    const repeat = await planSkillsOnlyInstall({ targetDir: root, selections, existingManifest: manifest, remove: false });
    expect(repeat.actions.every(a => a.type === "noop")).toBe(true);
    const audit = await createAuditReport({ targetDir: root, manifest: loadManifest(root) });
    expect(audit.removableFiles.some(file => file.path === binary)).toBe(true);
    const backup = executePreparedBackup(await prepareBackupExecution({ targetDir: root, auditReport: audit }));
    expect(readFileSync(path.join(backup.destinationDir!, binary))).toEqual(bytes);

    const removal = await planSkillsOnlyInstall({ targetDir: root, selections, existingManifest: loadManifest(root), remove: true });
    expect(removal.actions.find(a => a.relativePath === binary)?.type).toBe("remove-managed");
    applySkillsOnlyInstallPlan({ targetDir: root, plan: removal, existingManifest: loadManifest(root) });
    expect(existsSync(path.join(root, binary))).toBe(false);
    expect(readFileSync(path.join(backup.destinationDir!, binary))).toEqual(bytes);
    expect(readInstallationStatus(root).status).toBe("ready");
    expect(existsSync(path.join(root, ".make-docs/state"))).toBe(false);
  });

  test("keeps router block hashing separate from same-named Skill files", () => {
    const content = renderManagedBlock("# Instructions\n");
    const routerHash = getManifestFileHash("docs/AGENTS.md", content);
    expect(routerHash).not.toBeNull();
    expect(getManifestFileHash("docs/AGENTS.md", "Owner notes\n" + content)).toBe(routerHash);
    expect(getManifestFileHash(".agents/skills/archive-docs/examples/AGENTS.md", Buffer.from(content))).toBe(hashText(content));
    expect(getManifestFileHash("/home/example/.agents/skills/archive-docs/CLAUDE.md", Buffer.from(content))).toBe(hashText(content));
  });

  test("hashes changed binary bytes and protects edited binary payloads", async () => {
    const selections = await initialInstall();
    let manifest = loadManifest(root)!;
    applySkillsOnlyInstallPlan({ targetDir: root, plan: await planSkillsOnlyInstall({ targetDir: root, selections, existingManifest: manifest, remove: false }), existingManifest: manifest });
    manifest = loadManifest(root)!;
    bytes = Buffer.from([0, 255, 254, 129, 195, 40, 13, 10, 0]);
    const update = await planSkillsOnlyInstall({ targetDir: root, selections, existingManifest: manifest, remove: false });
    expect(update.actions.find(a => a.relativePath === binary)?.type).toBe("update");
    expect(update.actions.find(a => a.relativePath === binary)?.contentHash).toBe(hashText(bytes));
    applySkillsOnlyInstallPlan({ targetDir: root, plan: update, existingManifest: manifest });
    manifest = loadManifest(root)!;
    expect(readFileSync(path.join(root, binary))).toEqual(bytes);
    expect(manifest.files[binary].hash).toBe(hashText(bytes));
    const userBytes = Buffer.from([0, 255, 254, 130, 195, 40, 13, 10, 0]);
    writeFileSync(path.join(root, binary), userBytes);
    const conflict = await planSkillsOnlyInstall({ targetDir: root, selections, existingManifest: manifest, remove: false });
    const action = conflict.actions.find(a => a.relativePath === binary)!;
    expect(action.type).toBe("skip-conflict");
    expect(action.content).toEqual(bytes);
    const audit = await createAuditReport({ targetDir: root, manifest: loadManifest(root) });
    expect(audit.preservedPaths.some(file => file.path === binary)).toBe(true);
    expect(readFileSync(path.join(root, binary))).toEqual(userBytes);
  });

  test("updates a clean old copy from prior ledger hashes and preserves an edited native copy", async () => {
    vi.stubEnv("MAKE_DOCS_DISABLE_SKILL_SYMLINKS", "1");
    const selections = await initialInstall();
    let manifest = loadManifest(root)!;
    applySkillsOnlyInstallPlan({targetDir:root,plan:await planSkillsOnlyInstall({targetDir:root,selections,existingManifest:manifest,remove:false}),existingManifest:manifest});
    manifest = loadManifest(root)!;
    const exposure = ".claude/skills/archive-docs", nativeBinary = path.join(root,exposure,"assets/sample.bin");
    bytes = Buffer.from([0,255,12,128]);
    const update = await planSkillsOnlyInstall({targetDir:root,selections,existingManifest:manifest,remove:false});
    expect(update.actions.find(a=>a.relativePath===exposure)?.type).toBe("update");
    applySkillsOnlyInstallPlan({targetDir:root,plan:update,existingManifest:manifest});
    expect(readFileSync(nativeBinary)).toEqual(bytes);
    manifest = loadManifest(root)!;
    const edited = Buffer.from([255,0,13]); writeFileSync(nativeBinary,edited);
    bytes = Buffer.from([0,255,14,128]);
    const conflict = await planSkillsOnlyInstall({targetDir:root,selections,existingManifest:manifest,remove:false});
    expect(conflict.actions.find(a=>a.relativePath===exposure)?.type).toBe("skip-conflict");
    expect(readFileSync(nativeBinary)).toEqual(edited);
  });
});
