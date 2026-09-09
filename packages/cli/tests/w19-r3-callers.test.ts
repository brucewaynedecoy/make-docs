import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { applyInstallPlan, planInstall } from "../src/install";
import { loadManifest } from "../src/manifest";
import { defaultSelections } from "../src/profile";
import { runProjectCommand } from "../src/run/root-operations";
import { createExecutionContext } from "../src/operations/context";
import { invokeOperation, listOperations } from "../src/operations/registry";
import * as fileUtils from "../src/utils";
import * as installationState from "../src/store/installation-state";
import { readInstallationStatus, recoverInstallationOperation, withInstallationOperation } from "../src/store/installation-state";
import { cleanupTempDir, collectFiles, createTempDir, mockSkillFetches } from "./helpers";

const roots: string[] = [];
function fixture() { const root = createTempDir("w19-r3-callers-"); roots.push(root); return root; }
afterEach(() => { vi.restoreAllMocks(); for (const root of roots.splice(0)) cleanupTempDir(root); });
async function smallPlan(root: string) {
  const selections = defaultSelections();
  selections.skills = false;
  selections.resourceProjection = [];
  return planInstall({ targetDir: root, selections, existingManifest: loadManifest(root) });
}

describe("W19 R3 installation callers", () => {
  test("a Store error during skill exposure stops instead of choosing a copy fallback", async () => {
    const root = fixture();
    mockSkillFetches();
    const selections = defaultSelections();
    selections.skills = true;
    selections.selectedSkills = ["archive-docs"];
    const plan = await planInstall({ targetDir: root, selections, existingManifest: null });
    const exposure = plan.actions.find(action => action.skillExposure)!;
    expect(exposure).toBeDefined();
    const record = installationState.recordPlannedFileChange;
    vi.spyOn(installationState, "recordPlannedFileChange").mockImplementation((projectRoot, relative, after, apply) => {
      if (relative === exposure.relativePath && after.kind === "symlink") throw Object.assign(new Error("Store write permission lost"), { code: "EACCES" });
      return record(projectRoot, relative, after, apply);
    });
    expect(() => applyInstallPlan({ targetDir: root, plan, existingManifest: null })).toThrow("Store write permission lost");
    expect(existsSync(path.join(root, exposure.relativePath, "SKILL.md"))).toBe(false);
    expect(readInstallationStatus(root).status).toBe("recovery-required");
  });

  test("install and repeat use the Store while local knowledge stays readable", async () => {
    const root = fixture();
    writeFileSync(path.join(root, "notes.md"), "Project knowledge stays here.\n");
    const plan = await smallPlan(root);
    const applied = applyInstallPlan({ targetDir: root, plan, existingManifest: null });
    expect(loadManifest(root)?.projectId).toBe(applied.manifest.projectId);
    expect(readFileSync(path.join(root, ".make-docs/config.yaml"), "utf8")).toContain(applied.manifest.projectId!);
    expect(readInstallationStatus(root).status).toBe("ready");
    const repeatPlan = await smallPlan(root);
    const repeat = applyInstallPlan({ targetDir: root, plan: repeatPlan, existingManifest: loadManifest(root) });
    expect(repeat.mutationApplied).toBe(false);
    expect(existsSync(path.join(root, ".make-docs/state"))).toBe(false);
    expect(existsSync(path.join(root, ".make-docs/manifest.json"))).toBe(false);
    expect(readFileSync(path.join(root, "notes.md"), "utf8")).toBe("Project knowledge stays here.\n");
  });

  test("a sealed install resumes all prepared files and commits its intended ledger", async () => {
    const root = fixture();
    const plan = await smallPlan(root);
    const write = fileUtils.writeTextFile;
    let count = 0;
    vi.spyOn(fileUtils, "writeTextFile").mockImplementation((target, content) => {
      if (++count === 2) throw new Error("simulated interrupted writer");
      return write(target, content);
    });
    expect(() => applyInstallPlan({ targetDir: root, plan, existingManifest: null })).toThrow("simulated interrupted writer");
    vi.restoreAllMocks();
    const status = readInstallationStatus(root) as unknown as { status: string; pendingOperation: { operation_id: string } };
    expect(status.status).toBe("recovery-required");
    const recovered = recoverInstallationOperation(root, status.pendingOperation.operation_id, "resume", false);
    expect(recovered.status).toBe("completed");
    const manifest = loadManifest(root)!;
    expect(manifest.projectId).toBeTruthy();
    for (const action of plan.actions) {
      if (["create", "generate", "update"].includes(action.type) && typeof action.content === "string") expect(readFileSync(path.join(root, action.relativePath), "utf8")).toBe(action.content);
    }
    expect(existsSync(path.join(root, ".make-docs/state"))).toBe(false);
  });

  test("an unfinished operation prevents false unchanged setup success", async () => {
    const root = fixture();
    applyInstallPlan({ targetDir: root, plan: await smallPlan(root), existingManifest: null });
    expect(() => withInstallationOperation(root, "test.interrupted", () => { throw new Error("interrupted"); })).toThrow("interrupted");
    const plan = await smallPlan(root);
    expect(() => applyInstallPlan({ targetDir: root, plan, existingManifest: loadManifest(root) })).toThrow("recovery-required");
  });

  test("required Store failure leaves the project unchanged", async () => {
    const root = fixture();
    const plan = await smallPlan(root);
    const before = collectFiles(root);
    const priorRoot = process.env.MAKE_DOCS_HOME;
    process.env.MAKE_DOCS_HOME = path.join(root, "local-state");
    try {
      expect(() => applyInstallPlan({ targetDir: root, plan, existingManifest: null })).toThrow();
      expect(collectFiles(root)).toEqual(before);
    } finally {
      if (priorRoot === undefined) delete process.env.MAKE_DOCS_HOME;
      else process.env.MAKE_DOCS_HOME = priorRoot;
    }
  });

  test("status shares registry results and rejects ambiguous recovery flags", async () => {
    const root = fixture();
    const before = collectFiles(root);
    const writes: string[] = [];
    vi.spyOn(process.stdout, "write").mockImplementation(((text: string) => { writes.push(String(text)); return true; }) as typeof process.stdout.write);
    await runProjectCommand(["state", "status", "--target-root", root, "--json"]);
    const cli = JSON.parse(writes.join(""));
    const registry = await invokeOperation("project.state.status", { targetRoot: root }, createExecutionContext({ cwd: root, surface: "mcp", writesAllowed: false }));
    expect(cli).toEqual(registry.value);
    expect(collectFiles(root)).toEqual(before);
    expect(listOperations().map(x => x.id)).toContain("project.state.recover");
    await expect(runProjectCommand(["state", "recover", "missing-id", "--resume", "--rollback"])).rejects.toThrow("exactly one");
    await expect(invokeOperation("project.state.recover", { targetRoot: root, operationId: "missing-id", mode: "resume" }, createExecutionContext({ cwd: root, surface: "mcp", writesAllowed: false }))).rejects.toThrow();
  });
});
