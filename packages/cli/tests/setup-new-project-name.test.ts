/**
 * Setup writes the name of a new project (PRD 38 R-ID-8, register D-081).
 *
 * - A new project gets `projectName` in the config that setup creates.
 * - A config that exists and has no name is not changed.
 * - No usable name, or a name that another project holds: setup writes no
 *   name, completes, and says what the person does.
 * - A dry run writes nothing.
 * - A linked git worktree uses the folder name of its main checkout.
 *
 * No test reads or writes the real Store: each run sets `MAKE_DOCS_HOME` to a
 * folder inside the test's own temporary folder.
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parse as parseYaml } from "yaml";

import { runCli } from "../src/cli";
import { setTTY } from "./helpers";
import { loadMakeDocsConfig } from "../src/config";
import { findProjectNameHolderForSetup, readInstallationManifest, readProjectRegisterList } from "../src/store/installation-state";
import {
  addProjectNameToNewConfig,
  decideProjectNameForNewConfig,
  describeNewProjectNameForSetup,
} from "../src/store/project-register";

interface SetupResult {
  status: string;
  dryRun: boolean;
  project: {
    name: string | null;
    nameProposal: { name: string; source: string } | null;
    nameWrite: { state: string; name: string | null; reason?: string; nextAction?: string } | null;
    changed: boolean;
  };
}

const HARNESS = ["--codex-method", "none", "--claude-code-method", "none", "--no-github-copilot", "--no-skills", "--project-resources", "none"];
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));

function workspace(): { root: string; store: string } {
  const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-new-name-"));
  roots.push(root);
  return { root, store: path.join(root, "store") };
}

function folder(root: string, ...parts: string[]): string {
  const target = path.join(root, ...parts);
  mkdirSync(target, { recursive: true });
  return target;
}

async function setup(store: string, target: string, ...flags: string[]): Promise<SetupResult> {
  expect(store).not.toBe("");
  const prior = process.env.MAKE_DOCS_HOME;
  process.env.MAKE_DOCS_HOME = store;
  const output = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  try {
    await runCli(["setup", "--target", target, ...flags, ...HARNESS, "--json"]);
    return JSON.parse(output.mock.calls.map((call) => String(call[0])).join("")) as SetupResult;
  } finally {
    output.mockRestore();
    if (prior === undefined) delete process.env.MAKE_DOCS_HOME;
    else process.env.MAKE_DOCS_HOME = prior;
  }
}

const configPath = (target: string) => path.join(target, ".make-docs", "config.yaml");
const readConfig = (target: string) => parseYaml(readFileSync(configPath(target), "utf8")) as Record<string, unknown>;
const registerNames = (target: string, store: string) =>
  readProjectRegisterList(target, store).projects.map((project) => project.name);

describe("setup writes the name of a new project", () => {
  it("previews the write without writing, then writes the name into the new config", async () => {
    const { root, store } = workspace();
    const garden = folder(root, "Garden Planner");

    const preview = await setup(store, garden, "--dry-run");
    expect(preview.status).toBe("planned");
    expect(preview.project).toMatchObject({ name: null, nameProposal: null, nameWrite: { state: "planned", name: "garden-planner" } });
    expect(existsSync(path.join(garden, ".make-docs"))).toBe(false);
    expect(existsSync(store)).toBe(false);

    const applied = await setup(store, garden, "--yes");
    expect(applied.status, JSON.stringify(applied.project.nameWrite)).toBe("complete");
    expect(applied.project).toMatchObject({ name: "garden-planner", nameProposal: null, nameWrite: { state: "written", name: "garden-planner" } });
    expect(applied.project.nameWrite).not.toHaveProperty("nextAction");
    const config = readConfig(garden);
    expect(config.projectName).toBe("garden-planner");
    expect(typeof config.projectId).toBe("string");
    expect(loadMakeDocsConfig(garden).diagnostics).toEqual([]);
    expect(registerNames(garden, store)).toEqual(["garden-planner"]);

    // A second setup shows the name and plans no name write.
    const again = await setup(store, garden, "--dry-run");
    expect(again.project).toMatchObject({ name: "garden-planner", nameProposal: null, nameWrite: null, changed: false });
  });

  it("does not change an existing config that has no name", async () => {
    const { root, store } = workspace();
    const garden = folder(root, "garden");
    expect((await setup(store, garden, "--yes")).status).toBe("complete");
    // The person removed the name. The project is an existing project with no name.
    const unnamed = readFileSync(configPath(garden), "utf8").replace(/^\s*projectName:.*\n/m, "");
    expect(unnamed).not.toContain("projectName");
    writeFileSync(configPath(garden), unnamed);

    const result = await setup(store, garden, "--yes");
    expect(result.status).toBe("complete");
    expect(result.project).toMatchObject({ name: null, nameProposal: { name: "garden", source: "checkout-folder" }, nameWrite: null });
    expect(readFileSync(configPath(garden), "utf8")).toBe(unnamed);
  });

  it.each([true, false])("keeps a legacy install unnamed during transfer (config present: %s)", async (hasConfig) => {
    const { root, store } = workspace();
    const source = folder(root, "source");
    expect((await setup(store, source, "--yes")).status).toBe("complete");
    const legacy = folder(root, "legacy");
    cpSync(source, legacy, { recursive: true });
    const manifest = readInstallationManifest(source, store)!;
    delete manifest.projectId;
    const manifestPath = path.join(legacy, ".make-docs", "manifest.json");
    writeFileSync(manifestPath, JSON.stringify(manifest));
    if (hasConfig) writeFileSync(configPath(legacy), "{}\n");
    else rmSync(configPath(legacy));

    const preview = await setup(store, legacy, "--dry-run");
    expect(preview.status).toBe("planned");
    expect(preview.project).toMatchObject({ name: null, nameWrite: null });
    expect(existsSync(configPath(legacy))).toBe(hasConfig);
    expect(existsSync(manifestPath)).toBe(true);

    const result = await setup(store, legacy, "--yes");
    expect(result.status).toBe("complete");
    expect(result.project).toMatchObject({ name: null, nameWrite: null });
    expect(readConfig(legacy)).not.toHaveProperty("projectName");
    expect(readConfig(legacy).projectId).not.toBe(readConfig(source).projectId);
    expect(existsSync(manifestPath)).toBe(false);
    expect(readInstallationManifest(legacy, store)?.projectId).toBe(readConfig(legacy).projectId);
    expect(registerNames(legacy, store)).toEqual(expect.arrayContaining(["source", null]));
  });

  it("writes no name and completes when the folder name gives no usable name", async () => {
    const { root, store } = workspace();
    const numbers = folder(root, "123");

    const result = await setup(store, numbers, "--yes");
    expect(result.status).toBe("complete");
    expect(result.project).toMatchObject({
      name: null,
      nameProposal: null,
      nameWrite: {
        state: "skipped",
        name: null,
        reason: "no-usable-name",
        nextAction: "Choose a name and add projectName to .make-docs/config.yaml: lower-case letters, digits, and hyphens, starting with a letter.",
      },
    });
    expect(readConfig(numbers)).not.toHaveProperty("projectName");
    expect(registerNames(numbers, store)).toEqual([null]);
  });

  it("writes no name and completes when another project in the Store holds the name", async () => {
    const { root, store } = workspace();
    const first = folder(root, "one", "garden");
    const second = folder(root, "two", "garden");
    expect((await setup(store, first, "--yes")).project.name).toBe("garden");

    const preview = await setup(store, second, "--dry-run");
    expect(preview.project.nameWrite).toMatchObject({ state: "skipped", name: "garden", reason: "name-taken" });
    expect(existsSync(path.join(second, ".make-docs"))).toBe(false);

    const result = await setup(store, second, "--yes");
    expect(result.status).toBe("complete");
    expect(result.project).toMatchObject({
      name: null,
      nameProposal: null,
      nameWrite: {
        state: "skipped",
        name: "garden",
        reason: "name-taken",
        nextAction: "Choose another name and add projectName to .make-docs/config.yaml: lower-case letters, digits, and hyphens, starting with a letter.",
      },
    });
    expect(readConfig(second)).not.toHaveProperty("projectName");
    expect(readConfig(first).projectName).toBe("garden");
    expect(registerNames(second, store).sort()).toEqual(["garden", null]);

    // The plan text names the holder and says what the person does.
    const holder = findProjectNameHolderForSetup(second, "garden", store);
    expect(holder?.projectId).toBe(readConfig(first).projectId);
    const text = describeNewProjectNameForSetup(decideProjectNameForNewConfig(second, () => holder));
    expect(text).toContain(`Project name: none. Setup writes no name, because the name "garden" belongs to another project in this Store: project ${holder!.projectId}.`);
    expect(text).toContain("Choose another name and add projectName to .make-docs/config.yaml");
    // A project is not another project for its own checkout.
    expect(findProjectNameHolderForSetup(first, "garden", store)).toBeNull();
  });

  it("uses the folder name of the main checkout for a linked git worktree", async () => {
    const { root, store } = workspace();
    const main = folder(root, "aurora-main");
    const worktree = folder(root, "wt-1234abcd");
    const gitDir = folder(main, ".git", "worktrees", "wt-1234abcd");
    writeFileSync(path.join(worktree, ".git"), `gitdir: ${gitDir}\n`);

    const result = await setup(store, worktree, "--yes");
    expect(result.status).toBe("complete");
    expect(result.project).toMatchObject({ name: "aurora-main", nameWrite: { state: "written", name: "aurora-main" } });
    expect(readConfig(worktree).projectName).toBe("aurora-main");
  });

  it("writes no name for a linked git worktree when the main checkout folder name is not usable", async () => {
    const { root, store } = workspace();
    const main = folder(root, "1234");
    const worktree = folder(root, "wt-1234abcd");
    const gitDir = folder(main, ".git", "worktrees", "wt-1234abcd");
    writeFileSync(path.join(worktree, ".git"), `gitdir: ${gitDir}\n`);

    const result = await setup(store, worktree, "--yes");
    expect(result.status).toBe("complete");
    expect(result.project).toMatchObject({ name: null, nameWrite: { state: "skipped", name: null, reason: "no-usable-name" } });
    expect(readConfig(worktree).projectName).toBeUndefined();
  });

  it("says in the terminal text that setup writes the name, and then that it wrote it", async () => {
    const { root, store } = workspace();
    const garden = folder(root, "garden");
    const prior = process.env.MAKE_DOCS_HOME;
    process.env.MAKE_DOCS_HOME = store;
    setTTY(true);
    const output = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    let text = "";
    try {
      await runCli(["setup", "--target", garden, "--yes", ...HARNESS]);
      text = output.mock.calls.map((call) => String(call[0])).join("").replace(/\u001b\[[0-9;]*m/g, "");
    } finally {
      output.mockRestore();
      setTTY(false);
      if (prior === undefined) delete process.env.MAKE_DOCS_HOME;
      else process.env.MAKE_DOCS_HOME = prior;
    }
    expect(text).toContain("Project name: garden, from the checkout folder name.");
    expect(text).toContain("Project name: setup wrote projectName: garden to .make-docs/config.yaml. You can change it in that file.");
    expect(readConfig(garden).projectName).toBe("garden");
  });

  it("says in the plan words that setup writes the name and that the person can change it", () => {
    const { root } = workspace();
    const garden = folder(root, "garden");
    const write = decideProjectNameForNewConfig(garden, () => null);
    expect(write).toMatchObject({ state: "write", name: "garden" });
    expect(describeNewProjectNameForSetup(write)).toBe(
      "Project name: garden, from the checkout folder name. Setup writes projectName: garden to .make-docs/config.yaml. You can change it in that file: lower-case letters, digits, and hyphens, starting with a letter.",
    );
    const none = decideProjectNameForNewConfig(folder(root, "123"), () => { throw new Error("no Store read without a name"); });
    expect(describeNewProjectNameForSetup(none)).toBe(
      "Project name: none. Setup writes no name, because the folder name gives no usable name. Choose a name and add projectName to .make-docs/config.yaml: lower-case letters, digits, and hyphens, starting with a letter.",
    );
  });

  it("keeps the new config valid YAML in flow style and in block style", () => {
    expect(parseYaml(addProjectNameToNewConfig("{}\n", "garden"))).toEqual({ projectName: "garden" });
    expect(parseYaml(addProjectNameToNewConfig("{ harnessIntegrations: [] }\n", "garden"))).toEqual({ harnessIntegrations: [], projectName: "garden" });
    expect(addProjectNameToNewConfig("resourceProjection: []\n", "garden")).toBe("resourceProjection: []\nprojectName: garden\n");
    expect(addProjectNameToNewConfig("", "garden")).toBe("projectName: garden\n");
    expect(addProjectNameToNewConfig("projectName: kept\n", "garden")).toBe("projectName: kept\n");
    expect(() => addProjectNameToNewConfig("{}\n", "Not Valid")).toThrow();
  });

  it("gives no holder when the Store is absent", () => {
    const { root, store } = workspace();
    expect(findProjectNameHolderForSetup(folder(root, "garden"), "garden", store)).toBeNull();
    expect(existsSync(store)).toBe(false);
  });
});
