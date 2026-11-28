import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  GIT_HOOK_DEBUG_ENV,
  GIT_HOOK_NAMES,
  GIT_HOOK_NEW_FILE_FIRST_LINE,
  GIT_HOOK_STATE_MARKS,
  applyGitHookRemoval,
  findGitHookBlock,
  gitHookEndMarker,
  gitHookStartMarker,
  inspectGitHooks,
  planGitHooks,
  renderGitHookBlock,
  renderGitHookReview,
  type GitHookName,
} from "../src/git-hooks";
import { NAME_CATALOG } from "../src/operations/name-catalog";
import { getExistingInstallationCheckoutId } from "../src/store/installation-state";
import { cloneOf, shellPath } from "./git-hook-proof";
import {
  CLI,
  P1,
  addProjectFiles,
  bind,
  checkpoint,
  commitAll,
  createHookFixture,
  editTask,
  envWithPath,
  goneCommand,
  holdStore,
  hookFile,
  hookTexts,
  installHooks,
  project,
  recordHookFact,
  releaseStore,
  shortPathValue,
  taskText,
  type HookFixture,
  type HookGitResult,
} from "./git-hook-setup";

/**
 * W35 R0 P5 Stage 1 and Stage 5: the marked block, the refusals, and what a
 * hook does and prints. Each test installs the block through the product code
 * in a temporary repository, and then runs real git actions.
 */

let fixture: HookFixture;

beforeEach(() => {
  fixture = createHookFixture("make-docs-w35-p5-block-");
});

afterEach(() => {
  fixture.cleanup();
});

const OTHER_HOOK = "#!/bin/sh\n# A hook of another tool.\necho other-tool >> \"$(git rev-parse --show-toplevel)/other.log\"\n";

describe("W35 R0 P5 the block text (T2, T15)", () => {
  it("each block names the current checkpoint command, its event, and POSIX shell text only", () => {
    const entry = NAME_CATALOG.find((candidate) => candidate.id === "project.checkpoint.run")!;
    expect(entry.status).toBe("current");
    const command = entry.currentCli!;
    expect(command).toBe("project checkpoint");
    for (const name of GIT_HOOK_NAMES) {
      const block = renderGitHookBlock(name, { ...fixture.command, projectFolders: ["."] });
      const event = name === "post-checkout" ? "branch-change" : "commit";
      expect(block.startsWith(`${gitHookStartMarker(name)}\n`)).toBe(true);
      expect(block.endsWith(`${gitHookEndMarker(name)}\n`)).toBe(true);
      // The command of the block is the current catalog path, with the event of this hook.
      expect(block).toContain(`md_run ${command} --event ${event} --target-root "$md_root"`);
      expect(block).toContain(`\`make-docs ${command} --event ${event}\``);
      // No bash-only form, no background job of the shell, and no exit of the hook script itself. The command
      // starts the background checkpoint itself, and the block only sets the variable that asks for it.
      expect(block).not.toMatch(/\[\[|\bfunction\b|&\s*$|\bnohup\b|\bdisown\b|\bsetsid\b/m);
      expect(block).toContain("  export MAKE_DOCS_GIT_HOOK_RUN=start\n");
      expect(block).toContain("(version 2)");
      expect(block).toContain("It starts the checkpoint in the background and prints nothing, so git does not wait.");
      expect(block).toContain(") </dev/null || :");
      // The rule for git in the middle of an action is in the hooks after a commit and after a branch change only.
      expect(block.includes(GIT_HOOK_STATE_MARKS.join(" "))).toBe(name === "post-commit" || name === "post-checkout");
      expect(block.includes("[ \"${3:-}\" = 1 ] || exit 0")).toBe(name === "post-checkout");
      // The hook after a rewrite does not skip the amend case: the owner did not choose that improvement.
      expect(block).not.toContain("amend");
    }
    expect(GIT_HOOK_STATE_MARKS).toEqual(["rebase-merge", "rebase-apply", "MERGE_HEAD", "CHERRY_PICK_HEAD", "BISECT_LOG"]);
  });

  it("a path with a space and a quote character is one safe word of the block", () => {
    const block = renderGitHookBlock("post-commit", { nodePath: "/opt/a b/it's/node", commandFile: "/opt/a b/it's/make-docs.js", projectFolders: [".", "docs site/it's"] });
    expect(block).toContain("md_node='/opt/a b/it'\\''s/node'");
    expect(block).toContain("for md_folder in '.' 'docs site/it'\\''s'; do");
  });
});

describe("W35 R0 P5 the block writer and the refusals (T1, T21, T22, T28 to T30; A48, A62b, A62c, A62i to A62k)", () => {
  it("setup creates each hook file with the executable mode, and the file is the first line and the block", () => {
    const root = project(fixture, "aurora", { hooks: false });
    const result = installHooks(fixture, root);
    expect(result.hooks.map((entry) => entry.action)).toEqual(["create-file", "create-file", "create-file", "create-file"]);
    for (const name of GIT_HOOK_NAMES) {
      const file = hookFile(fixture.proof, root, name);
      expect(readFileSync(file, "utf8")).toBe(`${GIT_HOOK_NEW_FILE_FIRST_LINE}${renderGitHookBlock(name, { ...fixture.command, projectFolders: ["."] })}`);
      if (process.platform !== "win32") expect(lstatSync(file).mode & 0o111).not.toBe(0);
    }
    recordHookFact(fixture.proof, "create-hook-files", { created: 4, executable: process.platform !== "win32" });
  });

  it("beside a hook of another tool, setup adds the block after the first line and keeps every other byte, and removal gives the file back byte for byte", () => {
    const root = project(fixture, "aurora", { hooks: false });
    const file = fixture.proof.hook(root, "post-commit", OTHER_HOOK);
    const mode = lstatSync(file).mode;
    installHooks(fixture, root);
    const text = readFileSync(file, "utf8");
    const found = findGitHookBlock(text, "post-commit");
    expect(found).not.toBeNull();
    expect(found).not.toBe("malformed");
    const block = (found as { block: string }).block;
    // The block stands right after the first line, and the bytes outside it are the bytes of the other tool.
    expect(text).toBe(`#!/bin/sh\n${block}${OTHER_HOOK.slice("#!/bin/sh\n".length)}`);
    expect(lstatSync(file).mode).toBe(mode);
    // Both run for one commit: the block, and the lines of the other tool.
    editTask(fixture.proof, root, "Build the new parser.");
    expect(commitAll(fixture, root).status).toBe(0);
    expect(taskText(fixture, root)).toBe("Build the new parser.");
    expect(readFileSync(path.join(root, "other.log"), "utf8")).toBe("other-tool\n");
    // Removal in the last bound checkout takes out exactly the block.
    const removed = applyGitHookRemoval(root, fixture.store, getExistingInstallationCheckoutId(root, fixture.store));
    expect(removed.status).toBe("last");
    expect(readFileSync(file, "utf8")).toBe(OTHER_HOOK);
    // A file that Make Docs created, and that holds nothing else, goes.
    expect(existsSync(hookFile(fixture.proof, root, "post-merge"))).toBe(false);
  });

  it("the block runs in a hook file of another tool that ends with exec or exit, because it stands before those lines", () => {
    for (const [name, ending] of [["exec-end", "exec true\n"], ["exit-end", "exit 0\n"]] as const) {
      const local = createHookFixture(`make-docs-w35-p5-${name}-`);
      try {
        const root = project(local, "aurora", { hooks: false });
        const other = `#!/bin/sh\n# Another tool.\n${ending}`;
        const file = local.proof.hook(root, "post-commit", other);
        installHooks(local, root);
        expect(readFileSync(file, "utf8").endsWith(other.slice("#!/bin/sh\n".length))).toBe(true);
        editTask(local.proof, root, "Build the new parser.");
        const result = commitAll(local, root);
        expect(result.status).toBe(0);
        expect(taskText(local, root)).toBe("Build the new parser.");
        expect(result.hookOutput).toBe("Checkpoint: 1 file imported.\n");
      } finally {
        local.cleanup();
      }
    }
    recordHookFact(fixture.proof, "block-before-exec-and-exit", { runs: true });
  });

  it("a hook file with one line and no line end gets its line end, and removal gives the file back byte for byte", () => {
    const root = project(fixture, "aurora", { hooks: false });
    const file = fixture.proof.hook(root, "post-merge", "#!/bin/sh");
    installHooks(fixture, root);
    expect(readFileSync(file, "utf8")).toBe(`#!/bin/sh\n${renderGitHookBlock("post-merge", { ...fixture.command, projectFolders: ["."] })}`);
    applyGitHookRemoval(root, fixture.store, getExistingInstallationCheckoutId(root, fixture.store));
    expect(readFileSync(file, "utf8")).toBe("#!/bin/sh");
  });

  it("setup names an existing hook file that is not executable and does not change its mode", () => {
    const root = project(fixture, "aurora", { hooks: false });
    const file = fixture.proof.hook(root, "post-commit", OTHER_HOOK, { executable: false });
    const mode = lstatSync(file).mode;
    const plan = planGitHooks({ projectRoot: root, storeRoot: fixture.store, command: fixture.command });
    // Windows has no executable mode, so no file is named there.
    expect(plan.hooks.find((entry) => entry.name === "post-commit")!.notExecutable).toBe(process.platform !== "win32");
    if (process.platform !== "win32") expect(renderGitHookReview(plan)).toContain("This file is not executable, so git does not run it on a platform with file modes. Make Docs does not change its mode.");
    installHooks(fixture, root);
    expect(lstatSync(file).mode).toBe(mode);
    recordHookFact(fixture.proof, "existing-file-not-executable", { named: process.platform !== "win32", modeKept: true });
  });

  it("setup refuses when a hooks path is set, in the repository or for the machine, and changes nothing", () => {
    const root = project(fixture, "aurora", { hooks: false });
    const other = fixture.proof.folder("other-hooks");
    fixture.proof.git(root, ["config", "core.hooksPath", shellPath(other)]);
    const local = planGitHooks({ projectRoot: root, storeRoot: fixture.store, command: fixture.command });
    expect(local.status).toBe("refused");
    expect(local.reason).toContain("core.hooksPath");
    expect(local.reason).toContain("(scope: local)");
    expect(local.reason).toContain("Make Docs changed no hook file.");
    const applied = installHooks(fixture, root);
    expect([applied.status, applied.hooks]).toEqual(["refused", []]);
    expect(hookTexts(fixture.proof, root)).toEqual({ "post-commit": null, "post-merge": null, "post-rewrite": null, "post-checkout": null });
    fixture.proof.git(root, ["config", "--unset", "core.hooksPath"]);
    writeFileSync(fixture.proof.globalConfig, `[core]\n\thooksPath = ${shellPath(other)}\n`);
    const machine = planGitHooks({ projectRoot: root, storeRoot: fixture.store, command: fixture.command });
    expect(machine.status).toBe("refused");
    expect(machine.reason).toContain("(scope: global)");
    writeFileSync(fixture.proof.globalConfig, "");
    expect(planGitHooks({ projectRoot: root, storeRoot: fixture.store, command: fixture.command }).status).toBe("ready");
    recordHookFact(fixture.proof, "refuse-hooks-path", { local: "refused", global: "refused" });
  });

  it.skipIf(process.platform === "win32")("setup refuses a hook file that is a symbolic link, and the file that the link points to is byte-identical (skipped on Windows, where a test cannot make a link)", () => {
    const root = project(fixture, "aurora", { hooks: false });
    const owned = path.join(fixture.proof.folder("other-tool"), "post-commit");
    writeFileSync(owned, OTHER_HOOK, { mode: 0o755 });
    mkdirSync(fixture.proof.hooksDir(root), { recursive: true });
    symlinkSync(owned, hookFile(fixture.proof, root, "post-commit"));
    const plan = planGitHooks({ projectRoot: root, storeRoot: fixture.store, command: fixture.command });
    expect(plan.status).toBe("refused");
    expect(plan.reason).toContain("it is a symbolic link");
    expect(installHooks(fixture, root).status).toBe("refused");
    expect(readFileSync(owned, "utf8")).toBe(OTHER_HOOK);
    expect(lstatSync(hookFile(fixture.proof, root, "post-commit")).isSymbolicLink()).toBe(true);
    expect(existsSync(hookFile(fixture.proof, root, "post-merge"))).toBe(false);
  });

  it("setup takes a hook file whose first line names a shell, and refuses every other file with one reason and no change", () => {
    const accepted = ["#!/bin/sh\n", "#!/bin/bash\necho x\n", "#!/usr/bin/env bash\n", "#!/usr/bin/env -S zsh\n", "#! /bin/dash\n", "#!/usr/local/bin/ksh -e\n"];
    const refused: Array<[string, Buffer, string]> = [
      ["another program", Buffer.from("#!/usr/bin/env node\nconsole.log(1)\n"), "its first line does not name sh, bash, dash, ksh, or zsh"],
      ["another program with a full path", Buffer.from("#!/usr/bin/python3\nprint(1)\n"), "its first line does not name sh, bash, dash, ksh, or zsh"],
      ["shell text with no first line of that kind", Buffer.from("echo hello\nexit 0\n"), "its first line does not name sh, bash, dash, ksh, or zsh"],
      ["a binary file", Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x00, 0x01, 0x02]), "it is a binary file"],
      ["an empty file", Buffer.alloc(0), "it is empty"],
    ];
    const root = project(fixture, "aurora", { hooks: false });
    const file = hookFile(fixture.proof, root, "post-rewrite");
    mkdirSync(path.dirname(file), { recursive: true });
    for (const text of accepted) {
      writeFileSync(file, text, { mode: 0o755 });
      expect(inspectGitHooks(root).status, text).toBe("ready");
    }
    for (const [label, bytes, reason] of refused) {
      writeFileSync(file, bytes, { mode: 0o755 });
      const plan = planGitHooks({ projectRoot: root, storeRoot: fixture.store, command: fixture.command });
      expect(plan.status, label).toBe("refused");
      expect(plan.reason, label).toContain(reason);
      // The reason names the hook file. The folder part can have another spelling on Windows, so the test reads the file name.
      expect(plan.reason, label).toContain("post-rewrite");
      expect(installHooks(fixture, root).status, label).toBe("refused");
      expect(Buffer.compare(readFileSync(file), bytes), label).toBe(0);
      expect(existsSync(hookFile(fixture.proof, root, "post-commit")), label).toBe(false);
    }
    recordHookFact(fixture.proof, "shell-script-rule", { accepted: accepted.length, refused: refused.length });
  });

  it("when another tool writes its plain hook file again, the block is gone, and setup reports it as missing", () => {
    const root = project(fixture, "aurora", { hooks: false });
    const file = fixture.proof.hook(root, "post-commit", OTHER_HOOK);
    installHooks(fixture, root);
    expect(planGitHooks({ projectRoot: root, storeRoot: fixture.store, command: fixture.command }).hooks.map((entry) => entry.state)).toEqual(["current", "current", "current", "current"]);
    writeFileSync(file, OTHER_HOOK);
    const plan = planGitHooks({ projectRoot: root, storeRoot: fixture.store, command: fixture.command });
    expect(plan.hooks.find((entry) => entry.name === "post-commit")!.state).toBe("missing");
    expect(renderGitHookReview(plan)).toContain("Make Docs knows no other hook tool by name.");
  });

  it("a changed block is drift, and the plan says so before any change", () => {
    const root = project(fixture);
    const file = hookFile(fixture.proof, root, "post-commit");
    const before = readFileSync(file, "utf8");
    writeFileSync(file, before.replace("--event commit --target-root", "--event commit --json --target-root"));
    const changed = readFileSync(file, "utf8");
    const plan = planGitHooks({ projectRoot: root, storeRoot: fixture.store, command: fixture.command });
    expect(plan.hooks.find((entry) => entry.name === "post-commit")!.state).toBe("drifted");
    expect(plan.hooks.filter((entry) => entry.state === "current").map((entry) => entry.name)).toEqual(["post-merge", "post-rewrite", "post-checkout"]);
    // With no hook input the plan keeps the changed block, and with it each of the four hook files.
    expect(plan.kept).toEqual([expect.objectContaining({ name: "post-commit", state: "drifted" })]);
    expect(plan.hooks.map((entry) => entry.action)).toEqual(["keep", "keep", "keep", "keep"]);
    expect(plan.changed).toBe(false);
    // A plan changes nothing, and an apply with no hook input changes nothing too.
    expect(readFileSync(file, "utf8")).toBe(changed);
    const refused = installHooks(fixture, root);
    expect(refused.status).toBe("refused");
    expect(refused.reason).toContain("was changed after Make Docs wrote it. Make Docs keeps it and changes no hook in this run.");
    expect(readFileSync(file, "utf8")).toBe(changed);
  });
});

describe.skipIf(!existsSync(CLI))("W35 R0 P5 what a hook does and prints (T2, T3, T20, T23, T25 to T27, T31, T34)", () => {
  it("a commit with a changed work file prints the summary line only, and the store has the edit with no work command run by hand", () => {
    const root = project(fixture);
    editTask(fixture.proof, root, "Build the new parser.");
    const result = commitAll(fixture, root);
    expect(result.status).toBe(0);
    expect(result.hookOutput).toBe("Checkpoint: 1 file imported.\n");
    expect(taskText(fixture, root)).toBe("Build the new parser.");
    expect(fixture.proof.git(root, ["status", "--porcelain"]).stdout).toBe("");
    // A commit with nothing due prints nothing.
    fixture.proof.write(root, "note.txt", "note\n");
    expect(commitAll(fixture, root).output).toBe("");
    recordHookFact(fixture.proof, "commit-imports-and-is-quiet", { imported: "Checkpoint: 1 file imported.", nothingDue: "" });
  });

  it("when a file waits, the hook prints the summary line and the command and no other line", () => {
    const root = project(fixture);
    editTask(fixture.proof, root, "Build the new parser.");
    fixture.proof.git(root, ["add", "-A"]);
    fixture.proof.git(root, ["commit", "-q", "-m", "Edit, with no Store"], { env: fixture.noStore });
    // The commit above ran with no Store, so the file still waits. A branch change now only reports.
    const result = fixture.proof.git(root, ["checkout", "-q", "-b", "topic"], { env: fixture.onPath });
    expect((result as HookGitResult).hookOutput).toBe("Checkpoint: 1 file waits.\nRun make-docs project checkpoint to see and settle what waits.\n");
    expect(taskText(fixture, root)).toBe("Build the parser.");
    recordHookFact(fixture.proof, "branch-change-reports", { lines: 2 });
  });

  it("each of the four hooks exits 0 and prints nothing with no command, with no Store, and with no Make Docs install", () => {
    const root = project(fixture, "aurora", { hooks: false });
    installHooks(fixture, root, { nodePath: shellPath(path.join(fixture.proof.root, "gone", "node")), commandFile: shellPath(path.join(fixture.proof.root, "gone", "make-docs.js")) });
    const cases: Array<[string, NodeJS.ProcessEnv, () => void]> = [
      // No command: a short PATH, and no file at the recorded path.
      ["no command", fixture.shortPath, () => {}],
      // No Store: the command is on PATH, and the Store folder does not exist.
      ["no Store", fixture.noStore, () => {}],
      // No Make Docs install: the project config is gone.
      ["no install", fixture.onPath, () => { fixture.proof.git(root, ["rm", "-q", "-r", "--cached", ".make-docs"]); rmSync(path.join(root, ".make-docs"), { recursive: true, force: true }); }],
    ];
    const seen: Record<string, string[]> = {};
    let step = 0;
    for (const [label, env, prepare] of cases) {
      prepare();
      step += 1;
      editTask(fixture.proof, root, `Build parser ${step}.`);
      fixture.proof.git(root, ["add", "-A"]);
      const commit = fixture.proof.git(root, ["commit", "-q", "-m", `Commit ${step}`], { env });
      const amend = fixture.proof.git(root, ["commit", "-q", "--amend", "-m", `Commit ${step} again`], { env });
      const branch = fixture.proof.git(root, ["checkout", "-q", "-b", `branch-${step}`], { env });
      fixture.proof.git(root, ["checkout", "-q", "main"], { env });
      fixture.proof.commit(root, `main-${step}.txt`, "main\n");
      const merge = fixture.proof.git(root, ["merge", "-q", "--no-ff", "--no-edit", `branch-${step}`], { env, allowFailure: true });
      const outputs = [commit, amend, branch, merge].map((run) => `${run.status}:${run.stdout}${run.stderr}`);
      seen[label] = outputs;
      expect(outputs, label).toEqual(["0:", "0:", "0:", "0:"]);
    }
    // Nothing reached the store in any case, and no hook made a Store.
    expect(taskText(fixture, root)).toBe("Build the parser.");
    expect(existsSync(fixture.noStoreDir)).toBe(false);
    recordHookFact(fixture.proof, "quiet-exits", seen);
  });

  it("a file checkout makes the hook after a checkout do nothing", () => {
    const root = project(fixture);
    editTask(fixture.proof, root, "Build the new parser.");
    // A file checkout gives the hook the third argument 0. The work file changed, so a branch change would report.
    fixture.proof.write(root, "README.md", "# Changed\n");
    const result = fixture.proof.git(root, ["checkout", "--", "README.md"], { env: fixture.onPath });
    expect(`${result.status}:${result.stdout}${result.stderr}`).toBe("0:");
    const branch = fixture.proof.git(root, ["checkout", "-q", "-b", "topic"], { env: fixture.onPath });
    expect((branch as HookGitResult).hookOutput).toContain("Checkpoint: 1 file waits.");
  });

  it("the hooks after a commit and after a branch change do nothing in the middle of a merge, a cherry-pick, a bisect, and a rebase", () => {
    const root = project(fixture);
    const gitDir = fixture.proof.git(root, ["rev-parse", "--absolute-git-dir"]).stdout.trim();
    const seen: Record<string, string> = {};
    for (const mark of GIT_HOOK_STATE_MARKS) {
      const target = path.join(gitDir, mark);
      const folder = mark.startsWith("rebase-");
      if (folder) mkdirSync(target); else writeFileSync(target, "0000000000000000000000000000000000000000\n");
      try {
        editTask(fixture.proof, root, `Build the parser in ${mark}.`);
        // The hook is run as git runs it: `sh <hook file> <arguments>`, in the top folder of the work tree.
        for (const [name, args] of [["post-commit", []], ["post-checkout", ["a", "b", "1"]]] as Array<[GitHookName, string[]]>) {
          const run = runHook(root, name, args);
          expect(`${run.status}:${run.stdout}${run.stderr}`, `${name} with ${mark}`).toBe("0:");
        }
        seen[mark] = "quiet";
        expect(taskText(fixture, root)).toBe("Build the parser.");
      } finally {
        rmSync(target, { recursive: true, force: true });
      }
    }
    // With no mark, the same two hook runs act.
    // With no mark, the same two hook runs act: each one starts a background checkpoint, and prints nothing itself.
    const report = runHook(root, "post-checkout", ["a", "b", "1"]);
    expect(`${report.status}:${report.stdout}${report.stderr}`).toBe("0:");
    expect(report.hookOutput).toContain("1 file waits");
    const imported = runHook(root, "post-commit", []);
    expect(`${imported.status}:${imported.stdout}${imported.stderr}`).toBe("0:");
    expect(imported.hookOutput).toContain("1 file imported");
    recordHookFact(fixture.proof, "state-marks", seen);
  });

  it("a cherry-pick of one commit does not reach the checkpoint, and a revert of one commit and of two commits does", () => {
    const root = project(fixture);
    fixture.proof.git(root, ["checkout", "-q", "-b", "topic"], { env: fixture.onPath });
    editTask(fixture.proof, root, "Build the topic parser.");
    commitAll(fixture, root, fixture.noStore, "Topic edit, with no Store");
    const topic = fixture.proof.git(root, ["rev-parse", "HEAD"]).stdout.trim();
    fixture.proof.git(root, ["checkout", "-q", "main"], { env: fixture.noStore });
    // A cherry-pick with no conflict: the hook after a commit sees CHERRY_PICK_HEAD and does nothing.
    const pick = fixture.proof.git(root, ["cherry-pick", topic], { env: fixture.onPath });
    expect(pick.status).toBe(0);
    expect(`${pick.stdout}${pick.stderr}`).not.toContain("Checkpoint:");
    expect(taskText(fixture, root)).toBe("Build the parser.");
    // The next commit covers it.
    fixture.proof.write(root, "note.txt", "note\n");
    expect(commitAll(fixture, root).hookOutput).toBe("Checkpoint: 1 file imported.\n");
    expect(taskText(fixture, root)).toBe("Build the topic parser.");

    // A revert of one commit: the hook after a commit runs the checkpoint.
    const one = fixture.proof.git(root, ["revert", "--no-edit", "HEAD~1"], { env: fixture.onPath });
    expect((one as HookGitResult).hookOutput).toContain("Checkpoint: 1 file imported.");
    expect(taskText(fixture, root)).toBe("Build the parser.");

    // A revert of two commits: the hook runs the checkpoint after each commit, also in the middle of the sequence.
    editTask(fixture.proof, root, "Build parser A.");
    commitAll(fixture, root);
    editTask(fixture.proof, root, "Build parser B.");
    commitAll(fixture, root);
    expect(taskText(fixture, root)).toBe("Build parser B.");
    const two = fixture.proof.git(root, ["revert", "--no-edit", "HEAD", "HEAD~1"], { env: fixture.onPath });
    expect(two.status).toBe(0);
    // Each hook run starts a background checkpoint and prints nothing. After the runs, the store holds the last state.
    expect(`${two.stdout}${two.stderr}`).not.toContain("Checkpoint:");
    expect((two as HookGitResult).background).not.toBeNull();
    expect(taskText(fixture, root)).toBe("Build the parser.");
    recordHookFact(fixture.proof, "cherry-pick-and-revert", { cherryPickOne: "no checkpoint", revertOne: "checkpoint", revertTwo: "the store holds the last state after the background runs" });
  });

  it("with a short PATH the block starts the recorded command with the recorded node program, and a recorded node folder that is gone makes the hook do nothing", () => {
    const root = project(fixture);
    editTask(fixture.proof, root, "Build the new parser.");
    const result = commitAll(fixture, root, fixture.shortPath);
    expect(result.status).toBe(0);
    expect(result.hookOutput).toBe("Checkpoint: 1 file imported.\n");
    expect(taskText(fixture, root)).toBe("Build the new parser.");

    // The recorded node folder no longer exists: nothing runs, nothing prints, and the commit succeeds.
    const stale = createHookFixture("make-docs-w35-p5-stale-");
    try {
      const other = project(stale, "aurora", { hooks: false });
      installHooks(stale, other, { nodePath: shellPath(path.join(stale.proof.root, "old-node", "bin", "node")), commandFile: stale.command.commandFile });
      editTask(stale.proof, other, "Build the new parser.");
      const quiet = commitAll(stale, other, stale.shortPath);
      expect(`${quiet.status}:${quiet.output}`).toBe("0:");
      expect(taskText(stale, other)).toBe("Build the parser.");
      // The review says that the recorded paths can go stale, and that setup records them again.
      const review = renderGitHookReview(planGitHooks({ projectRoot: other, storeRoot: stale.store, command: stale.command }));
      expect(review).toContain("The paths can go stale when you move, update, or remove them. Then a hook runs `make-docs` from PATH, or does nothing when none is there. Run `make-docs setup --git-hooks` again to record them again.");
      // Setup with the current command writes the block again, and the next commit imports.
      expect(installHooks(stale, other).hooks.map((entry) => entry.action)).toEqual(["replace-block", "replace-block", "replace-block", "replace-block"]);
      stale.proof.write(other, "note.txt", "note\n");
      expect(commitAll(stale, other, stale.shortPath).hookOutput).toBe("Checkpoint: 1 file imported.\n");
    } finally {
      stale.cleanup();
    }
    recordHookFact(fixture.proof, "recorded-command", { shortPath: "imported", staleNodeFolder: "quiet, exit 0" });
  });

  it("a launcher on PATH that starts node by name works with a short PATH plus its folder, because the block adds the recorded node folder to the end of PATH", () => {
    // The recorded command file is gone, so the block uses the launcher on PATH. The recorded `node` is still there.
    const root = project(fixture, "aurora", { hooks: false });
    installHooks(fixture, root, goneCommand(fixture));
    const needsNode = fixture.proof.folder("needs-node-bin");
    writeFileSync(path.join(needsNode, "make-docs"), `#!/bin/sh\nexec node '${shellPath(CLI).replace(/'/g, "'\\''")}' "$@"\n`, { mode: 0o755 });
    editTask(fixture.proof, root, "Build the new parser.");
    const result = commitAll(fixture, root, envWithPath(fixture.proof, [needsNode, shortPathValue()].join(path.delimiter)));
    expect(result.status).toBe(0);
    expect(taskText(fixture, root)).toBe("Build the new parser.");
    recordHookFact(fixture.proof, "node-folder-on-path", { imported: true });
  });

  it("with the Make Docs project in a subfolder of the git repository, a commit runs the checkpoint for that project", () => {
    const repo = fixture.proof.repo("mono");
    addProjectFiles(fixture.proof, repo, "apps/docs site");
    const root = bind(fixture, path.join(repo, "apps", "docs site"));
    expect(checkpoint(fixture, root).firstSync).toBe(true);
    installHooks(fixture, root);
    expect(readFileSync(hookFile(fixture.proof, repo, "post-commit"), "utf8")).toContain("for md_folder in 'apps/docs site'; do");
    editTask(fixture.proof, repo, "Build the new parser.", "apps/docs site");
    const result = commitAll(fixture, repo);
    expect(result.hookOutput).toBe("Checkpoint: 1 file imported.\n");
    expect(taskText(fixture, root)).toBe("Build the new parser.");
    recordHookFact(fixture.proof, "project-in-subfolder", { imported: true });
  });

  it("in a linked work tree that is not bound, each of the four hooks exits 0 and prints nothing, and the review names the limit and the command", () => {
    const root = project(fixture);
    const linked = path.join(fixture.proof.root, "aurora-topic");
    const add = fixture.proof.git(root, ["worktree", "add", "-q", "-b", "topic", linked], { env: fixture.onPath });
    expect(`${add.stdout}${add.stderr}`).toBe("");
    editTask(fixture.proof, linked, "Build the topic parser.");
    const commit = commitAll(fixture, linked);
    const amend = fixture.proof.git(linked, ["commit", "-q", "--amend", "-m", "Again"], { env: fixture.onPath });
    const branch = fixture.proof.git(linked, ["checkout", "-q", "-b", "topic-2"], { env: fixture.onPath });
    fixture.proof.commit(root, "main.txt", "main\n");
    const merge = fixture.proof.git(linked, ["merge", "-q", "--no-ff", "--no-edit", "main"], { env: fixture.onPath });
    expect([commit, amend, branch, merge].map((run) => `${run.status}:${run.stdout}${run.stderr}`)).toEqual(["0:", "0:", "0:", "0:"]);
    expect(taskText(fixture, root)).toBe("Build the parser.");
    const review = renderGitHookReview(planGitHooks({ projectRoot: root, storeRoot: fixture.store, command: fixture.command }));
    expect(review).toContain("The hooks act only in a checkout that is bound to the Store.");
    expect(review).toContain("`make-docs project checkout apply`");
    recordHookFact(fixture.proof, "unbound-work-tree", { hooks: "quiet, exit 0" });
  });

  it("a hook whose background checkpoint fails prints nothing, also with the debug switch, and the file of the last run holds the error output", async () => {
    const root = project(fixture);
    // Another process holds the Store, so the checkpoint ends with a Store error and exit code 1.
    editTask(fixture.proof, root, "Build the new parser.");
    fixture.proof.git(root, ["add", "-A"]);
    const holder = await holdStore(fixture);
    let quiet;
    let loud;
    try {
      quiet = fixture.proof.git(root, ["commit", "-q", "-m", "Quiet"], { env: fixture.onPath });
      fixture.proof.write(root, "note.txt", "note\n");
      fixture.proof.git(root, ["add", "-A"]);
      loud = fixture.proof.git(root, ["commit", "-q", "-m", "Loud"], { env: envWithPath(fixture.proof, fixture.onPath.PATH!, { [GIT_HOOK_DEBUG_ENV]: "1" }) });
    } finally {
      await releaseStore(holder);
    }
    expect(`${quiet.status}:${quiet.stdout}${quiet.stderr}`).toBe("0:");
    // The background mode prints nothing on the output of git, also with the debug switch (OD-P5-5).
    expect(`${loud.status}:${loud.stdout}${loud.stderr}`).toBe("0:");
    // The file of the last background run holds the typed Store result, with exit code 1.
    for (const run of [quiet, loud] as HookGitResult[]) {
      expect(run.background).toMatchObject({ outcome: "ran", exitCode: 1, output: "" });
      expect(run.background!.errorOutput).toContain("store-unavailable");
    }
    // With the switch and no command at all, the hook says so.
    const none = createHookFixture("make-docs-w35-p5-debug-");
    try {
      const other = project(none, "aurora", { hooks: false });
      installHooks(none, other, { nodePath: shellPath(path.join(none.proof.root, "gone", "node")), commandFile: shellPath(path.join(none.proof.root, "gone", "make-docs.js")) });
      none.proof.write(other, "note.txt", "note\n");
      none.proof.git(other, ["add", "-A"]);
      const told = none.proof.git(other, ["commit", "-q", "-m", "Told"], { env: envWithPath(none.proof, shortPathValue(), { [GIT_HOOK_DEBUG_ENV]: "1" }) });
      expect(told.status).toBe(0);
      expect(told.stderr).toContain("make-docs git hook: no make-docs command at the recorded path and none on PATH.");
    } finally {
      none.cleanup();
    }
    recordHookFact(fixture.proof, "debug-switch", { background: "no output with the switch off and on; the file of the last run holds the error output", noCommand: "one line on standard error with the switch" });
  });

  it.skipIf(process.platform === "win32")("a hook prints nothing and exits 0 when its shell may not write the Store folder (skipped on Windows, which has no such file mode)", () => {
    const root = project(fixture);
    editTask(fixture.proof, root, "Build the new parser.");
    fixture.proof.git(root, ["add", "-A"]);
    chmodSync(fixture.store, 0o500);
    let result;
    try {
      result = fixture.proof.git(root, ["commit", "-q", "-m", "No Store write"], { env: fixture.onPath });
    } finally {
      chmodSync(fixture.store, 0o700);
    }
    expect(`${result.status}:${result.stdout}${result.stderr}`).toBe("0:");
    // The next checkpoint with Store access imports the file.
    expect(checkpoint(fixture, root).imported).toEqual([P1]);
  });

  it("the hook does not read the input of a hook, and it changes no variable and no folder of the script of another tool", () => {
    const root = project(fixture, "aurora", { hooks: false });
    const seen = path.join(fixture.proof.root, "seen.log");
    // Another tool reads the list that git gives the hook after a rewrite, and uses its own variables.
    fixture.proof.hook(root, "post-rewrite", `#!/bin/sh\nmd_top=theirs\ncat > '${shellPath(seen).replace(/'/g, "'\\''")}'\nprintf '%s %s\\n' "$md_top" "$(pwd)" >> '${shellPath(seen).replace(/'/g, "'\\''")}'\n`);
    installHooks(fixture, root);
    editTask(fixture.proof, root, "Build the new parser.");
    commitAll(fixture, root);
    fixture.proof.git(root, ["commit", "-q", "--amend", "-m", "Amended"], { env: fixture.onPath });
    const lines = readFileSync(seen, "utf8").trim().split("\n");
    // Line 1 is the old and the new commit of the rewrite. Line 2 shows the variable and the folder of the other tool.
    expect(lines[0]).toMatch(/^[0-9a-f]{40} [0-9a-f]{40}$/);
    expect(lines[1]!.startsWith("theirs ")).toBe(true);
  });

  it("a clone that moved keeps its blocks, and the hooks still run at the new path", () => {
    const origin = fixture.proof.bare("origin.git");
    const seed = fixture.proof.repo("seed");
    addProjectFiles(fixture.proof, seed);
    fixture.proof.git(seed, ["remote", "add", "origin", origin]);
    fixture.proof.git(seed, ["push", "-q", "origin", "main"]);
    const first = cloneOf(fixture.proof, origin, "first place");
    const root = bind(fixture, first);
    checkpoint(fixture, root);
    installHooks(fixture, root);
    const moved = path.join(fixture.proof.root, "second place");
    renameSync(first, moved);
    // The block holds no path of the clone, so it runs at the new path. The checkout is not bound there yet, so it is quiet.
    editTask(fixture.proof, moved, "Build the new parser.");
    const result = commitAll(fixture, moved);
    expect(`${result.status}:${result.output}`).toBe("0:");
  });
});

/** Run a hook file as git runs it: with `sh`, in the top folder of the work tree. */
function runHook(root: string, name: GitHookName, args: string[]): HookGitResult {
  // `git -c alias` is not needed: the hook is plain shell text, and `git hook run` gives it no arguments on old git.
  const file = hookFile(fixture.proof, root, name);
  const result = fixture.proof.git(root, ["-c", `alias.run-hook=!sh '${shellPath(file).replace(/'/g, "'\\''")}'`, "run-hook", ...args], { env: fixture.onPath, allowFailure: true });
  return result as HookGitResult;
}
