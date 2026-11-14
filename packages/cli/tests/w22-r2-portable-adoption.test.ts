import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, test, vi } from "vitest";
import { runCli } from "../src/cli";
import { readInstallationStatus, previewInstallationCheckoutMove, withInstallationDatabase } from "../src/store/installation-state";
import { applyInstallPlan, planInstall } from "../src/install";
import { defaultSelections } from "../src/profile";

const roots: string[] = [];
const setupFlags = [
  "--yes", "--codex-method", "none", "--claude-code-method", "none",
  "--no-github-copilot", "--no-skills", "--project-resources", "all", "--json",
];

async function inStore(store: string, args: string[]) {
  const prior = process.env.MAKE_DOCS_HOME;
  process.env.MAKE_DOCS_HOME = store;
  const output = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  try {
    await runCli(args);
    const text = output.mock.calls.map(call => String(call[0])).join("");
    return JSON.parse(text) as { status: string; nextAction?: string; project?: { actions?: Array<{ action: string }> }; failedCondition?: string };
  } finally {
    output.mockRestore();
    if (prior === undefined) delete process.env.MAKE_DOCS_HOME;
    else process.env.MAKE_DOCS_HOME = prior;
  }
}

function git(...args: string[]) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout;
}

afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));

test("a configured second Store adopts a clone and keeps tracked project files", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-w22-r2-"));
  roots.push(root);
  const projectA = path.join(root, "project-a");
  const projectB = path.join(root, "project-b");
  const projectC = path.join(root, "project-c");
  const storeA = path.join(root, "store-a");
  const storeB = path.join(root, "store-b");
  mkdirSync(projectA);
  mkdirSync(projectC);
  expect((await inStore(storeA, ["setup", "--target", projectA, ...setupFlags])).status).toBe("complete");
  const configPath = path.join(projectA, ".make-docs", "config.yaml");
  writeFileSync(configPath, readFileSync(configPath, "utf8").replace(/^resourceProjection:.*\n(?:  - .*\n)*/m, ""));
  const routerPath = path.join(projectA, ".make-docs", "AGENTS.md");
  const routerContent = readFileSync(routerPath, "utf8");
  expect(routerContent).toContain("<!-- make-docs:begin -->");
  writeFileSync(routerPath, routerContent.replace("<!-- make-docs:begin -->", "<!-- make-docs:begin -->\nProject router change.") + "\nProject note.\n");
  const resourcePath = path.join(projectA, ".make-docs", "system", "contracts", "naive-uat-contract.md");
  writeFileSync(resourcePath, readFileSync(resourcePath, "utf8") + "\nProject resource note.\n");
  git("init", "-q", projectA);
  git("-C", projectA, "add", "-A");
  git("-C", projectA, "-c", "user.name=Make Docs Proof", "-c", "user.email=proof@example.invalid", "commit", "-qm", "fixture");
  git("clone", "-q", projectA, projectB);
  expect((await inStore(storeB, ["setup", "--target", projectC, "--yes", "--codex-method", "none", "--claude-code-method", "none", "--no-github-copilot", "--no-skills", "--project-resources", "none", "--json"])).status).toBe("complete");

  const installedA = readInstallationStatus(projectA, storeA);
  const projectId = "projectId" in installedA ? installedA.projectId : null;
  expect(projectId).toBeTruthy();
  expect(readInstallationStatus(projectB, storeB)).toMatchObject({ status: "portable-unregistered", projectId });
  expect(previewInstallationCheckoutMove(projectB, undefined, storeB)).toMatchObject({ status: "portable-unregistered" });
  const count = () => withInstallationDatabase(projectB, db =>
    (db.prepare("SELECT count(*) AS total FROM installation_checkouts WHERE project_id=?").get(projectId) as { total: number }).total,
  { storeRoot: storeB, readOnly: true });
  const storeDigest = () => createHash("sha256").update(readFileSync(path.join(storeB, "store.db"))).digest("hex");
  expect(count()).toBe(0);
  const beforePlainSetup = storeDigest();
  for (const args of [
    ["setup", "--target", projectB],
    ["setup", "--target", projectB, "--yes", "--json"],
    ["setup", "--target", projectB, "--dry-run", "--json"],
    ["setup", "--target", projectB, "--dry-run", "--yes", "--json"],
  ]) {
    const blocked = await inStore(storeB, args);
    expect(blocked.status).toBe("blocked");
    expect(blocked.nextAction).toContain("make-docs setup --adopt --yes");
    expect(count()).toBe(0);
    expect(storeDigest()).toBe(beforePlainSetup);
    expect(git("-C", projectB, "status", "--porcelain")).toBe("");
  }
  const unresolved = await inStore(storeB, ["setup", "--target", projectB, ...setupFlags, "--dry-run"]);
  expect(unresolved.status).toBe("blocked");
  const kept = await inStore(storeB, ["setup", "--conflicts", "keep", "--target", projectB, ...setupFlags, "--dry-run"]);
  expect(kept.status).toBe("blocked");
  expect(git("-C", projectB, "status", "--porcelain")).toBe("");
  const dryRun = await inStore(storeB, ["setup", "--adopt", "--target", projectB, "--dry-run", "--yes", "--json"]);
  expect(dryRun.status).toBe("planned");
  expect(dryRun.project?.actions?.every(action => action.action === "noop")).toBe(true);
  const overwritePreview = await inStore(storeB, ["setup", "--adopt", "--target", projectB, "--conflicts", "overwrite", "--dry-run", "--yes", "--json"]);
  expect(overwritePreview.status).toBe("blocked");
  expect(overwritePreview.nextAction).toContain("--conflicts keep");
  expect(git("-C", projectB, "status", "--porcelain")).toBe("");
  const result = await inStore(storeB, ["setup", "--adopt", "--target", projectB, "--yes", "--json"]);
  expect(result.status, result.failedCondition).toBe("complete");
  expect(readInstallationStatus(projectB, storeB)).toMatchObject({ status: "ready", projectId });
  expect(count()).toBe(1);
  expect(git("-C", projectB, "status", "--porcelain")).toBe("");
  expect((await inStore(storeB, ["setup", "--target", projectB, "--yes", "--json"])).status).toBe("complete");
  expect(count()).toBe(1);
  expect(git("-C", projectB, "status", "--porcelain")).toBe("");
});

test("later setup keeps a changed router block adopted as project-owned", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-w22-r2-router-"));
  roots.push(root);
  const priorStore = process.env.MAKE_DOCS_HOME;
  process.env.MAKE_DOCS_HOME = path.join(root, "store");
  try {
    const project = path.join(root, "project");
    mkdirSync(project);
    const selections = defaultSelections();
    selections.resourceProjection = [];
    const initial = await planInstall({ targetDir: project, selections, existingManifest: null, operation: "setup" });
    const routerPath = ".make-docs/AGENTS.md";
    const initialRouter = initial.actions.find(action => action.relativePath === routerPath);
    expect(initialRouter?.type).toBe("create");
    const changedRouter = String(initialRouter!.content).replace("<!-- make-docs:begin -->", "<!-- make-docs:begin -->\nProject router change.");
    mkdirSync(path.join(project, ".make-docs"));
    writeFileSync(path.join(project, routerPath), changedRouter);
    const adopted = await planInstall({
      targetDir: project, selections, existingManifest: null, operation: "setup", adopt: true,
      managedFileConflictResolutions: { [routerPath]: "skip" },
    });
    expect(adopted.desiredFiles[routerPath]?.ownershipClass).toBe("project-owned");
    const applied = applyInstallPlan({ targetDir: project, plan: adopted, existingManifest: null });
    const next = await planInstall({
      targetDir: project, selections, existingManifest: applied.manifest, operation: "setup",
    });
    expect(next.actions.find(action => action.relativePath === routerPath)?.type).toBe("noop");
    expect(next.desiredFiles[routerPath]?.ownershipClass).toBe("project-owned");
    expect(next.routerOwnership?.routers[routerPath]?.ownershipClass).toBe("project-owned");
    expect(readFileSync(path.join(project, routerPath), "utf8")).toBe(changedRouter);
  } finally {
    if (priorStore === undefined) delete process.env.MAKE_DOCS_HOME;
    else process.env.MAKE_DOCS_HOME = priorStore;
  }
});
