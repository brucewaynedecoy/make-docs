import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CLI_STORE_MAINTENANCE_VERSIONS } from "../src/operations/setup/store-ops";
import { findGitHookBlock, GIT_HOOK_NAMES, GIT_HOOK_RECORD_OPERATION, listGitHookRecords, renderGitHookBlock, GIT_HOOK_BLOCK_VERSION } from "../src/git-hooks";
import { renderStoreCheck } from "../src/run/setup-store";
import { withInstallationDatabase } from "../src/store/installation-state";
import { checkStore, defaultStoreMaintenanceEnvironment } from "../src/store/maintenance";
import { cloneOf, realPath } from "./git-hook-proof";
import {
  CLI,
  cli,
  createHookFixture,
  hookFile,
  machineFolder,
  hookTexts,
  readPreference,
  recordHookFact,
  setPreference,
  setup,
  setupRemove,
  setupSecondCheckout,
  type HookFixture,
} from "./git-hook-setup";

/**
 * W35 R0 P5 Stage 2: the setup offer, the machine preference, the Store
 * record, and removal. Each test runs the built CLI in a temporary repository,
 * with a temporary Store and a temporary home folder. The machine step runs
 * with no agent tool, so it changes no settings file of any agent tool.
 */

let fixture: HookFixture;

beforeEach(() => {
  fixture = createHookFixture("make-docs-w35-p5-setup-");
});

afterEach(() => {
  fixture.cleanup();
});

const NONE = { "post-commit": null, "post-merge": null, "post-rewrite": null, "post-checkout": null };

function newRepo(name = "aurora"): string {
  return realPath(fixture.proof.repo(name));
}

function records(repo: string) {
  return withInstallationDatabase(repo, (db) => listGitHookRecords(db), { storeRoot: fixture.store, readOnly: true });
}

function schemaVersion(repo: string): number {
  return withInstallationDatabase(repo, (db) => (db.prepare("PRAGMA user_version").get() as { user_version: number }).user_version, { storeRoot: fixture.store, readOnly: true });
}

describe.skipIf(!existsSync(CLI))("W35 R0 P5 the machine preference (T6, T7; A53a, A53f)", () => {
  it("global config holds no preference at first, an explicit input sets one value, and --yes alone never changes it", () => {
    expect(readPreference(fixture)).toBeUndefined();
    // `--yes` with no input leaves the preference as it was: absent.
    const bare = cli(fixture, machineFolder(fixture), ["setup", "system", "--no-codex", "--no-claude-code", "--yes", "--json"]);
    expect(bare.status, bare.stderr).toBe(0);
    expect(JSON.parse(bare.stdout).gitHooksPreference).toEqual({ value: null, changed: false });
    expect(readPreference(fixture)).toBeUndefined();

    // A dry run shows the change under "This computer" and writes nothing.
    const dry = cli(fixture, machineFolder(fixture), ["setup", "system", "--no-codex", "--no-claude-code", "--git-hooks-for-new-projects", "yes", "--dry-run", "--json"]);
    expect(JSON.parse(dry.stdout).gitHooksPreference).toEqual({ value: null, changed: false });
    expect(readPreference(fixture)).toBeUndefined();

    const on = JSON.parse(setPreference(fixture, "yes").stdout);
    expect([on.status, on.gitHooksPreference]).toEqual(["configured", { value: true, changed: true }]);
    expect(readPreference(fixture)).toBe(true);
    const config = JSON.parse(readFileSync(path.join(fixture.store, "config.json"), "utf8"));
    // `--yes` alone leaves it on.
    cli(fixture, machineFolder(fixture), ["setup", "system", "--no-codex", "--no-claude-code", "--yes", "--json"]);
    expect(readPreference(fixture)).toBe(true);
    // Turning it off changes only that one value.
    setPreference(fixture, "no");
    const after = JSON.parse(readFileSync(path.join(fixture.store, "config.json"), "utf8"));
    expect(after.settings.gitHooksForNewProjects).toBe(false);
    expect({ ...after, settings: { ...after.settings, gitHooksForNewProjects: true } }).toEqual(config);
    recordHookFact(fixture.proof, "machine-preference", { absent: "no value", yesAlone: "no change", input: "one value" });
  });

  it("the input belongs to the machine step only, and a wrong value fails before any write", () => {
    const repo = newRepo();
    const project = cli(fixture, repo, ["setup", "--yes", "--no-codex", "--no-claude-code", "--git-hooks-for-new-projects", "yes"]);
    expect(project.status).not.toBe(0);
    expect(project.stderr).toContain("`--git-hooks-for-new-projects` is valid only with `make-docs setup system`.");
    const wrong = cli(fixture, repo, ["setup", "system", "--no-codex", "--no-claude-code", "--git-hooks-for-new-projects", "maybe", "--yes"]);
    expect(wrong.status).not.toBe(0);
    expect(wrong.stderr).toContain("`--git-hooks-for-new-projects` must be yes or no.");
    expect(readPreference(fixture)).toBeUndefined();
    expect(existsSync(path.join(repo, ".make-docs"))).toBe(false);
  });

  it("turning the preference on installs no hook in any project, and turning it off removes none", () => {
    const older = newRepo("older");
    setup(fixture, older, ["--yes"]);
    const hooked = newRepo("hooked");
    setup(fixture, hooked, ["--yes", "--git-hooks"]);
    const before = hookTexts(fixture.proof, hooked);
    setPreference(fixture, "yes");
    expect(hookTexts(fixture.proof, older)).toEqual(NONE);
    expect(hookTexts(fixture.proof, hooked)).toEqual(before);
    setPreference(fixture, "no");
    expect(hookTexts(fixture.proof, hooked)).toEqual(before);
    expect(records(hooked)).toHaveLength(1);
  });
});

describe.skipIf(!existsSync(CLI))("W35 R0 P5 the non-interactive setup path (T8; A52, A53b to A53g)", () => {
  it("with the preference off or absent, setup --yes installs no hook and says so in one line", () => {
    const absent = newRepo("absent");
    const first = setup(fixture, absent, ["--yes"]);
    expect([first.status, first.gitHooks!.status, first.gitHooks!.selection, first.gitHooks!.newProject]).toEqual(["complete", "none", "none", true]);
    expect(first.gitHooks!.message).toBe("Git hooks: none installed. The machine preference for git hooks is off. To install them for this project, run `make-docs setup --git-hooks`.");
    expect(first.gitHooks!.message!.includes("\n")).toBe(false);
    expect(hookTexts(fixture.proof, absent)).toEqual(NONE);
    setPreference(fixture, "no");
    const off = newRepo("off");
    expect(setup(fixture, off, ["--yes"]).gitHooks!.message).toBe(first.gitHooks!.message);
    expect(hookTexts(fixture.proof, off)).toEqual(NONE);
    expect(records(off)).toEqual([]);
  });

  it("with the preference on, setup --yes installs the four hooks in a new project, and the plan names each hook path and the exact block", () => {
    setPreference(fixture, "yes");
    const repo = newRepo();
    // The dry run prints the exact hook plan and writes nothing.
    const plan = setup(fixture, repo, ["--yes", "--dry-run"]);
    expect([plan.status, plan.gitHooks!.status, plan.gitHooks!.selection, plan.gitHooks!.preferenceOn, plan.gitHooks!.newProject]).toEqual(["planned", "planned", "machine-preference", true, true]);
    expect(plan.gitHooks!.hooks.map((entry) => [entry.name, realPath(path.dirname(path.dirname(entry.path))), path.basename(entry.path), entry.action])).toEqual(GIT_HOOK_NAMES.map((name) => [name, realPath(path.dirname(fixture.proof.hooksDir(repo))), name, "create-file"]));
    for (const entry of plan.gitHooks!.hooks) expect(entry.block).toContain(`md_run project checkpoint --event ${entry.name === "post-checkout" ? "branch-change" : "commit"}`);
    expect(hookTexts(fixture.proof, repo)).toEqual(NONE);
    expect(existsSync(path.join(repo, ".make-docs"))).toBe(false);

    const done = setup(fixture, repo, ["--yes"]);
    expect([done.status, done.gitHooks!.status, done.gitHooks!.selection]).toEqual(["complete", "installed", "machine-preference"]);
    // Each file holds exactly the block that the plan showed.
    const texts = hookTexts(fixture.proof, repo);
    for (const entry of plan.gitHooks!.hooks) expect(texts[entry.name]).toBe(`#!/bin/sh\n${entry.block}`);
    // The preference installs no hook of an agent tool: no settings file of any agent tool exists in the temporary home.
    expect(existsSync(path.join(fixture.proof.root, "home", ".claude"))).toBe(false);
    expect(existsSync(path.join(fixture.proof.root, "home", ".codex"))).toBe(false);
    expect(existsSync(path.join(fixture.proof.root, "home", ".copilot"))).toBe(false);
    expect(existsSync(path.join(repo, ".claude", "settings.json"))).toBe(false);
    recordHookFact(fixture.proof, "preference-on-new-project", { installed: 4 });
  });

  it("with the preference on, setup --yes installs no hook in an older project and says so in one line, and an explicit hook input installs them there", () => {
    const repo = newRepo();
    setup(fixture, repo, ["--yes"]);
    setPreference(fixture, "yes");
    const again = setup(fixture, repo, ["--yes"]);
    expect([again.gitHooks!.status, again.gitHooks!.newProject, again.gitHooks!.preferenceOn]).toEqual(["none", false, true]);
    expect(again.gitHooks!.message).toBe("Git hooks: none installed. The machine preference installs them only in a new project, and this project was set up before. To install them here, run `make-docs setup --git-hooks`.");
    expect(hookTexts(fixture.proof, repo)).toEqual(NONE);
    const explicit = setup(fixture, repo, ["--yes", "--git-hooks"]);
    expect([explicit.gitHooks!.status, explicit.gitHooks!.selection]).toEqual(["installed", "hook-input"]);
    expect(Object.values(hookTexts(fixture.proof, repo)).every((text) => text !== null)).toBe(true);
    // A project that only holds a config file is an older project too: it is no fresh setup target with no config file.
    const withConfig = newRepo("with-config");
    fixture.proof.write(withConfig, ".make-docs/config.yaml", "projectName: with-config\n");
    const kept = cli(fixture, withConfig, ["setup", "--no-codex", "--no-claude-code", "--no-skills", "--yes"]);
    if (kept.status === 0) {
      const json = JSON.parse(kept.stdout);
      if (json.gitHooks) expect([json.gitHooks.newProject, json.gitHooks.status]).toEqual([false, "none"]);
    }
    expect(hookTexts(fixture.proof, withConfig)).toEqual(NONE);
  });

  it("an explicit hook input installs the hooks with the preference off, and an explicit no-hooks input installs none with the preference on", () => {
    const repo = newRepo("explicit");
    const done = setup(fixture, repo, ["--yes", "--git-hooks"]);
    expect([done.gitHooks!.status, done.gitHooks!.selection, done.gitHooks!.preferenceOn]).toEqual(["installed", "hook-input", false]);
    setPreference(fixture, "yes");
    const skipped = newRepo("skipped");
    const none = setup(fixture, skipped, ["--yes", "--no-git-hooks"]);
    expect([none.gitHooks!.status, none.gitHooks!.selection, none.gitHooks!.newProject]).toEqual(["none", "no-hook-input", true]);
    expect(none.gitHooks!.message).toBe("Git hooks: none installed in this run (--no-git-hooks).");
    expect(hookTexts(fixture.proof, skipped)).toEqual(NONE);
  });

  it("conflicting hook input fails before any write, and a setup with no --yes installs no hook", () => {
    const repo = newRepo();
    const both = cli(fixture, repo, ["setup", "--yes", "--no-codex", "--no-claude-code", "--git-hooks", "--no-git-hooks"]);
    expect(both.status).not.toBe(0);
    expect(both.stderr).toContain("`--git-hooks` cannot be combined with `--no-git-hooks`.");
    expect(existsSync(path.join(repo, ".make-docs"))).toBe(false);
    const wrongCommand = cli(fixture, repo, ["setup", "skills", "--git-hooks"]);
    expect(wrongCommand.status).not.toBe(0);
    // A setup with no terminal and no `--yes` installs no hook, also with the hook input in a project that needs no other change.
    setup(fixture, repo, ["--yes"]);
    const bare = cli(fixture, repo, ["setup", "--no-codex", "--no-claude-code", "--no-skills", "--git-hooks"]);
    expect(hookTexts(fixture.proof, repo)).toEqual(NONE);
    if (bare.status === 0 && bare.stdout.trim().startsWith("{")) {
      const json = JSON.parse(bare.stdout);
      if (json.gitHooks) expect(json.gitHooks.status).toBe("none");
    }
  });

  it("when setup must refuse the git hooks, it installs none, says why in one line, and the rest of the run goes on", () => {
    setPreference(fixture, "yes");
    const repo = newRepo();
    const other = "#!/usr/bin/env node\nconsole.log('another tool');\n";
    const file = fixture.proof.hook(repo, "post-commit", other);
    const done = setup(fixture, repo, ["--yes"]);
    expect([done.status, done.project.state, done.gitHooks!.status]).toEqual(["complete", "ready", "refused"]);
    expect(done.gitHooks!.message).toMatch(/^Git hooks: none installed\. The hook file .*post-commit is not a shell script: its first line does not name sh, bash, dash, ksh, or zsh\. Make Docs changed no hook file\.$/);
    expect(done.gitHooks!.message!.includes("\n")).toBe(false);
    expect(readFileSync(file, "utf8")).toBe(other);
    expect(existsSync(hookFile(fixture.proof, repo, "post-merge"))).toBe(false);
    expect(existsSync(path.join(repo, ".make-docs", "config.yaml"))).toBe(true);
    // A project outside a git work tree gets no hook, with one line.
    const plain = path.join(fixture.proof.root, "plain");
    const outside = createOutsideGit(plain);
    if (outside) {
      const result = setup(fixture, plain, ["--yes"]);
      expect(result.gitHooks!.status).toBe("unavailable");
      expect(result.gitHooks!.message).toBe("Git hooks: none installed. This project is not in a git work tree, so it has no git hooks.");
    }
  });
});

/** A folder that is in no git work tree. The temporary folder of a proof holds no repository above it. */
function createOutsideGit(folder: string): boolean {
  fixture.proof.folder(path.basename(folder));
  return fixture.proof.git(folder, ["rev-parse", "--show-toplevel"], { allowFailure: true }).status !== 0;
}

describe.skipIf(!existsSync(CLI))("W35 R0 P5 repeat setup, drift, and the record (T4; A51)", () => {
  it("repeat setup reports current, missing, and drifted hook state and changes no block without the hook input", () => {
    const repo = newRepo();
    setup(fixture, repo, ["--yes", "--git-hooks"]);
    const schema = schemaVersion(repo);
    const current = setup(fixture, repo, ["--yes"]);
    expect([current.gitHooks!.status, current.gitHooks!.hooks.map((entry) => entry.state)]).toEqual(["selected", ["current", "current", "current", "current"]]);
    expect(current.gitHooks!.message).toContain("Git hooks: this project has the Make Docs git hooks, and each block is current.");

    // A changed block is drift. A removed block is missing.
    const commitFile = hookFile(fixture.proof, repo, "post-commit");
    const drifted = readFileSync(commitFile, "utf8").replace("--event commit --target-root", "--event commit --json --target-root");
    writeFileSync(commitFile, drifted);
    rmSync(hookFile(fixture.proof, repo, "post-merge"));
    const report = setup(fixture, repo, ["--yes"]);
    expect(report.gitHooks!.status).toBe("selected");
    // One changed block keeps each of the four hook files as it is.
    expect(report.gitHooks!.hooks.map((entry) => `${entry.name}:${entry.state}:${entry.action}`)).toEqual(["post-commit:drifted:keep", "post-merge:missing:keep", "post-rewrite:current:keep", "post-checkout:current:keep"]);
    expect(report.gitHooks!.kept).toEqual([expect.objectContaining({ name: "post-commit", state: "drifted" })]);
    expect(report.gitHooks!.message).toContain("was changed after Make Docs wrote it. Make Docs keeps it and changes no hook in this run. To replace it and keep a backup of the old block text, run `make-docs setup --git-hooks`.");
    expect(report.gitHooks!.message).toContain("post-commit: drifted: the block was changed after Make Docs wrote it, and Make Docs keeps it");
    expect(report.gitHooks!.message).toContain("missing: the Store has a record of the block, and the file holds none");
    // Nothing changed.
    expect(readFileSync(commitFile, "utf8")).toBe(drifted);
    expect(existsSync(hookFile(fixture.proof, repo, "post-merge"))).toBe(false);

    // The reviewed plan of the hook input names the change, and then setup writes only the Make Docs block.
    const plan = setup(fixture, repo, ["--yes", "--dry-run", "--git-hooks"]);
    expect(plan.gitHooks!.hooks.map((entry) => entry.action)).toEqual(["replace-block", "create-file", "none", "none"]);
    // The plan names the changed block as one that gets a backup, before any write.
    expect(plan.gitHooks!.hooks.map((entry) => entry.backup ?? false)).toEqual([true, false, false, false]);
    expect(readFileSync(commitFile, "utf8")).toBe(drifted);
    const repaired = setup(fixture, repo, ["--yes", "--git-hooks"]);
    expect(repaired.gitHooks!.status).toBe("installed");
    // The result names the backup file, and that file holds the old block text, byte for byte.
    const backupFile = repaired.gitHooks!.hooks[0]!.backupFile!;
    expect(backupFile).toContain(path.join(".make-docs", "backup"));
    const oldBlock = findGitHookBlock(drifted, "post-commit") as { block: string };
    expect(readFileSync(backupFile, "utf8")).toBe(oldBlock.block);
    expect(oldBlock.block).toContain("--event commit --json --target-root");
    expect(setup(fixture, repo, ["--yes"]).gitHooks!.hooks.map((entry) => entry.state)).toEqual(["current", "current", "current", "current"]);
    // The record is one row of an existing table, and the schema version of the Store did not change.
    expect(records(repo)).toHaveLength(1);
    expect(schemaVersion(repo)).toBe(schema);
    const row = withInstallationDatabase(repo, (db) => db.prepare("SELECT operation, status FROM tool_operations WHERE operation=?").all(GIT_HOOK_RECORD_OPERATION), { storeRoot: fixture.store, readOnly: true });
    expect(row).toEqual([{ operation: GIT_HOOK_RECORD_OPERATION, status: "completed" }]);
    recordHookFact(fixture.proof, "repeat-setup-states", { states: ["current", "missing", "drifted"], schemaChanged: false });
  });
});

describe.skipIf(!existsSync(CLI))("W35 R0 P5 removal (T9, T24, T32, T33; A54, A55, A62e, A62m, A62n)", () => {
  it("after setup and setup remove beside a hook of another tool, each hook file is byte-identical to its state before setup, and the Store holds no hook record", () => {
    const repo = newRepo();
    const other = "#!/bin/sh\n# Another tool.\necho other >/dev/null\nexit 0\n";
    fixture.proof.hook(repo, "post-commit", other);
    fixture.proof.hook(repo, "post-checkout", "#!/usr/bin/env bash\ntrue");
    const before = hookTexts(fixture.proof, repo);
    setup(fixture, repo, ["--yes", "--git-hooks"]);
    expect(hookTexts(fixture.proof, repo)).not.toEqual(before);
    // Store care names the record while it exists.
    const withRecord = checkStore(fixture.store, defaultStoreMaintenanceEnvironment(CLI_STORE_MAINTENANCE_VERSIONS, new Date()));
    expect(withRecord.leftovers).toEqual([]);
    expect(withRecord.gitHookRecords).toHaveLength(1);
    expect(withRecord.gitHookRecords[0]).toMatchObject({ checkouts: 1, gitFolderExists: true, hooks: [...GIT_HOOK_NAMES].sort() });
    expect(renderStoreCheck(withRecord)).toContain("Git hook records (kept; no rule removes them):");

    const report = setupRemove(fixture, repo);
    expect(report).toContain("Git hooks: this is the last bound checkout of this clone that selected the hooks");
    expect(report).toContain("Git hooks: removed for this clone. The Store holds no git hook record for it now.");
    expect(hookTexts(fixture.proof, repo)).toEqual(before);
    expect(records(repo)).toEqual([]);
    const after = checkStore(fixture.store, defaultStoreMaintenanceEnvironment(CLI_STORE_MAINTENANCE_VERSIONS, new Date()));
    expect([after.leftovers, after.gitHookRecords]).toEqual([[], []]);
    recordHookFact(fixture.proof, "remove-byte-identical", { files: 4, record: "removed" });
  });

  it("setup remove keeps a changed block with a report, and removes each block that still matches", () => {
    const repo = newRepo();
    setup(fixture, repo, ["--yes", "--git-hooks"]);
    const file = hookFile(fixture.proof, repo, "post-commit");
    const changed = readFileSync(file, "utf8").replace("--event commit --target-root", "--event commit --json --target-root");
    writeFileSync(file, changed);
    const report = setupRemove(fixture, repo);
    expect(report).toContain("post-commit: kept: the block was changed after Make Docs wrote it. It has no Store record now, and a later setup keeps it unless you give `--git-hooks`. To remove it, take out its two marker lines and the lines between them by hand");
    expect(readFileSync(file, "utf8")).toBe(changed);
    for (const name of ["post-merge", "post-rewrite", "post-checkout"] as const) expect(existsSync(hookFile(fixture.proof, repo, name))).toBe(false);
    expect(records(repo)).toEqual([]);

    // Review finding S5: the kept block has no record now. The next setup run must not replace it silently, also
    // with the machine preference on.
    setPreference(fixture, "yes");
    const again = setup(fixture, repo, ["--yes"]);
    expect([again.gitHooks!.status, again.gitHooks!.kept]).toEqual(["none", [expect.objectContaining({ name: "post-commit", state: "unrecorded" })]]);
    expect(again.gitHooks!.message).toContain("This folder has Make Docs hook blocks that no record of this clone covers (post-commit");
    expect(readFileSync(file, "utf8")).toBe(changed);
    for (const name of ["post-merge", "post-rewrite", "post-checkout"] as const) expect(existsSync(hookFile(fixture.proof, repo, name))).toBe(false);
    expect(records(repo)).toEqual([]);
    // The hook input replaces it, and the result names the backup of the old block text.
    const replaced = setup(fixture, repo, ["--yes", "--git-hooks"]);
    expect(replaced.gitHooks!.hooks.map((entry) => entry.action)).toEqual(["replace-block", "create-file", "create-file", "create-file"]);
    expect(readFileSync(replaced.gitHooks!.hooks[0]!.backupFile!, "utf8")).toContain("--event commit --json --target-root");
    expect(readFileSync(file, "utf8")).not.toContain("--json");
  });

  it("setup remove in one work tree keeps the block while another bound checkout of the clone remains, and removes it in the last one", () => {
    const repo = newRepo();
    setup(fixture, repo, ["--yes", "--git-hooks"]);
    fixture.proof.git(repo, ["add", "-A"]);
    fixture.proof.git(repo, ["commit", "-q", "-m", "Add Make Docs"], { env: fixture.noStore });
    const linked = path.join(fixture.proof.root, "aurora-topic");
    fixture.proof.git(repo, ["worktree", "add", "-q", "-b", "topic", linked], { env: fixture.noStore });
    // The linked work tree binds as a separate checkout, and then selects the hooks. The blocks are there already.
    const second = setupSecondCheckout(fixture, realPath(linked), ["--git-hooks"]);
    expect([second.gitHooks!.status, second.gitHooks!.newProject, second.gitHooks!.hooks.map((entry) => entry.action)]).toEqual(["installed", false, ["none", "none", "none", "none"]]);
    expect(records(repo)).toHaveLength(1);
    expect(records(repo)[0]!.record.checkouts).toHaveLength(2);
    const texts = hookTexts(fixture.proof, repo);

    const first = setupRemove(fixture, realPath(linked));
    expect(first).toContain("Git hooks: the Make Docs blocks stay");
    // The report names the checkout that keeps the blocks, by its folder.
    expect(first).toContain(path.basename(repo));
    expect(first).toContain("Make Docs removes the blocks when `make-docs setup remove` runs in the last of these checkouts.");
    expect(hookTexts(fixture.proof, repo)).toEqual(texts);
    expect(records(repo)[0]!.record.checkouts).toHaveLength(1);

    const last = setupRemove(fixture, repo);
    expect(last).toContain("Git hooks: removed for this clone.");
    expect(hookTexts(fixture.proof, repo)).toEqual(NONE);
    expect(records(repo)).toEqual([]);
    recordHookFact(fixture.proof, "remove-in-two-work-trees", { first: "blocks stay", last: "blocks and record removed" });
  });

  it("a checkout whose folder was deleted with no setup remove does not keep the block", () => {
    const repo = newRepo();
    setup(fixture, repo, ["--yes", "--git-hooks"]);
    fixture.proof.git(repo, ["add", "-A"]);
    fixture.proof.git(repo, ["commit", "-q", "-m", "Add Make Docs"], { env: fixture.noStore });
    const linked = path.join(fixture.proof.root, "aurora-topic");
    fixture.proof.git(repo, ["worktree", "add", "-q", "-b", "topic", linked], { env: fixture.noStore });
    setupSecondCheckout(fixture, realPath(linked), ["--git-hooks"]);
    expect(records(repo)[0]!.record.checkouts).toHaveLength(2);
    // The person deletes the folder of the linked work tree and runs no setup remove there.
    rmSync(linked, { recursive: true, force: true });
    const report = setupRemove(fixture, repo);
    // The plan names the gone checkout by its recorded folder, before the person approves.
    expect(report).toContain("Git hooks: 1 other checkout of this clone selected the hooks, and its recorded folder is gone:");
    expect(report).toContain("aurora-topic");
    expect(report).toContain("It does not keep the blocks, and git lists no work tree of this clone that can be that checkout at a new folder.");
    expect(report).toContain("Git hooks: removed for this clone.");
    expect(hookTexts(fixture.proof, repo)).toEqual(NONE);
    expect(records(repo)).toEqual([]);
  });

  it("after a clone with the hooks moves, repeat setup reports no false drift, setup remove removes the block, and no record stays for the old path", () => {
    const origin = fixture.proof.bare("origin.git");
    const seed = fixture.proof.repo("seed");
    fixture.proof.git(seed, ["remote", "add", "origin", origin]);
    fixture.proof.git(seed, ["push", "-q", "origin", "main"]);
    const first = realPath(cloneOf(fixture.proof, origin, "first-place"));
    setup(fixture, first, ["--yes", "--git-hooks"]);
    const oldKey = records(first)[0]!.key;
    const texts = Object.values(hookTexts(fixture.proof, first));
    const movedPath = path.join(fixture.proof.root, "second-place");
    renameSync(first, movedPath);
    const moved = realPath(movedPath);

    // Store care names the record that the move left behind.
    const left = checkStore(fixture.store, defaultStoreMaintenanceEnvironment(CLI_STORE_MAINTENANCE_VERSIONS, new Date()));
    expect(left.gitHookRecords).toEqual([expect.objectContaining({ key: oldKey, gitFolderExists: false })]);
    expect(left.gitHookRecords[0]!.nextAction).toContain("run make-docs setup --git-hooks in the clone at its new path");

    // The folder at the new path binds as a checkout of the project again, with a new checkout ID. A plain setup
    // then reads the hook state there. It reports no drift: it says that no record of this clone covers the blocks,
    // it names the record of the old folder, and it takes nothing over.
    const report = setupSecondCheckout(fixture, moved);
    expect([report.gitHooks!.status, report.gitHooks!.hooks.map((entry) => entry.state)]).toEqual(["none", ["unrecorded", "unrecorded", "unrecorded", "unrecorded"]]);
    expect(report.gitHooks!.message).toContain("This folder has Make Docs hook blocks that no record of this clone covers");
    expect(report.gitHooks!.message).toContain("The Store holds a record of the same blocks for the git folder");
    expect(report.gitHooks!.message).toContain("first-place");
    expect(report.gitHooks!.message).toContain("When this clone moved from that folder, run `make-docs setup --git-hooks` here to move that record to this clone.");
    expect(Object.values(hookTexts(fixture.proof, moved))).toEqual(texts);
    expect(records(moved).map((entry) => entry.key)).toEqual([oldKey]);

    // The explicit hook input takes the record over. The plan names the record and the folder that it came from.
    const plan = setup(fixture, moved, ["--yes", "--dry-run", "--git-hooks"]);
    expect(plan.gitHooks!.takeoverFrom).toContain("first-place");
    expect(records(moved).map((entry) => entry.key)).toEqual([oldKey]);
    const taken = setup(fixture, moved, ["--yes", "--git-hooks"]);
    expect([taken.gitHooks!.status, taken.gitHooks!.hooks.map((entry) => entry.state)]).toEqual(["installed", ["current", "current", "current", "current"]]);
    expect(Object.values(hookTexts(fixture.proof, moved))).toEqual(texts);
    expect(records(moved)).toHaveLength(1);
    expect(records(moved)[0]!.key).not.toBe(oldKey);

    const removed = setupRemove(fixture, moved);
    expect(removed).toContain("Git hooks: removed for this clone.");
    expect(hookTexts(fixture.proof, moved)).toEqual(NONE);
    expect(records(moved)).toEqual([]);
    recordHookFact(fixture.proof, "moved-clone", { falseDrift: false, removed: true, oldRecord: "gone" });
  });

  it("a second project in another folder of one repository shares the hook files, and each one gets its checkpoint", () => {
    const repo = newRepo("mono");
    const one = path.join(repo, "apps", "one");
    const two = path.join(repo, "apps", "two");
    fixture.proof.folder(path.join("mono", "apps", "one"));
    fixture.proof.folder(path.join("mono", "apps", "two"));
    setup(fixture, one, ["--yes", "--git-hooks"]);
    setup(fixture, two, ["--yes", "--git-hooks"]);
    const record = records(repo)[0]!.record;
    expect(record.checkouts.map((entry) => entry.projectFolder).sort()).toEqual(["apps/one", "apps/two"]);
    expect(readFileSync(hookFile(fixture.proof, repo, "post-commit"), "utf8")).toContain(renderGitHookBlock("post-commit", { nodePath: record.nodePath, commandFile: record.commandFile, projectFolders: ["apps/one", "apps/two"] }));
    // The record of an older version: it names block version 1 and no run mode.
    withInstallationDatabase(repo, (db) => {
      const key = records(repo)[0]!.key;
      const { runMode: _mode, runFallback: _fallback, ...older } = record;
      db.prepare("UPDATE tool_operations SET metadata_json=? WHERE operation_id=?").run(JSON.stringify({ ...older, blockVersion: 1 }), key);
    }, { storeRoot: fixture.store });
    expect([records(repo)[0]!.record.blockVersion, records(repo)[0]!.record.runMode]).toEqual([1, undefined]);
    // Removal in one project takes its folder out of the block, and the other project keeps its hooks.
    const first = setupRemove(fixture, one);
    // The blocks were written again with the block text of this version, so the record names this version.
    expect([records(repo)[0]!.record.blockVersion, records(repo)[0]!.record.runMode, records(repo)[0]!.record.runFallback]).toEqual([GIT_HOOK_BLOCK_VERSION, "background", "foreground"]);
    expect(first).toContain("Git hooks: the Make Docs blocks stay");
    // Review finding S3: the words are true for a block that is written again with a shorter folder list.
    expect(first).toContain("post-commit: The block stays. Make Docs writes it again with no line for the project folder of this checkout, and keeps every other byte.");
    expect(first).toContain("Make Docs wrote these blocks again, with no line for the project folder of this checkout, and kept every other byte:");
    expect(readFileSync(hookFile(fixture.proof, repo, "post-commit"), "utf8")).toContain("for md_folder in 'apps/two'; do");
    setupRemove(fixture, two);
    expect(hookTexts(fixture.proof, repo)).toEqual(NONE);
    expect(records(repo)).toEqual([]);
  });

  it("an update of Make Docs leaves the preference as it was and installs no hook in a project that has none", () => {
    setPreference(fixture, "yes");
    const before = readFileSync(path.join(fixture.store, "config.json"), "utf8");
    const repo = newRepo();
    setup(fixture, repo, ["--yes", "--no-git-hooks"]);
    // A later setup run of the installed project is the sync that an update leads to. It installs no hook by the preference alone.
    const sync = setup(fixture, repo, ["--yes"]);
    expect([sync.gitHooks!.status, sync.gitHooks!.newProject]).toEqual(["none", false]);
    expect(hookTexts(fixture.proof, repo)).toEqual(NONE);
    expect(readFileSync(path.join(fixture.store, "config.json"), "utf8")).toBe(before);
  });
});
