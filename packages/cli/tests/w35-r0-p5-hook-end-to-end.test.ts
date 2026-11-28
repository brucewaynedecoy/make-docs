import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GIT_HOOK_NAMES, type GitHookName } from "../src/git-hooks";
import { getInstallationCheckoutId } from "../src/store/installation-state";
import { listSyncConflicts, readWorkStore } from "../src/store/work-store";
import { cloneOf, realPath, shellQuote } from "./git-hook-proof";
import {
  CLI,
  P1,
  addProjectFiles,
  bind,
  checkpoint,
  commitAll,
  createHookFixture,
  editTask,
  hookFile,
  installHooks,
  recordHookFact,
  setup,
  taskText,
  type HookFixture,
  type HookGitResult,
} from "./git-hook-setup";

/**
 * W35 R0 P5 Stage 3 (T11 to T13): the end-to-end proofs of the installed git
 * hooks. Each test uses real git actions in temporary repositories, with local
 * bare repositories in place of a network remote.
 */

let fixture: HookFixture;

beforeEach(() => {
  fixture = createHookFixture("make-docs-w35-p5-e2e-");
});

afterEach(() => {
  fixture.cleanup();
});

/** Add one line of "another tool" to each hook file, after the block, that records which hook ran. */
function recordRuns(repo: string): string {
  const log = path.join(fixture.proof.root, `${path.basename(repo)}-hooks.log`);
  for (const name of GIT_HOOK_NAMES) {
    const file = hookFile(fixture.proof, repo, name);
    writeFileSync(file, `${readFileSync(file, "utf8")}printf '%s %s\\n' '${name}' "$*" >> ${shellQuote(log)}\n`);
  }
  return log;
}

function ran(log: string): string[] {
  return existsSync(log) ? readFileSync(log, "utf8").trim().split("\n").filter((line) => line !== "").map((line) => line.split(" ")[0]!) : [];
}

/** A remote with the project, and a bound clone of it with its first sync and the four hooks. */
function remoteAndMine(): { origin: string; mine: string } {
  const origin = fixture.proof.bare("origin.git");
  const seed = fixture.proof.repo("seed");
  addProjectFiles(fixture.proof, seed);
  fixture.proof.git(seed, ["remote", "add", "origin", origin]);
  fixture.proof.git(seed, ["push", "-q", "origin", "main"]);
  const mine = bind(fixture, cloneOf(fixture.proof, origin, "mine"));
  expect(checkpoint(fixture, mine).firstSync).toBe(true);
  expect(installHooks(fixture, mine).status).toBe("installed");
  return { origin, mine };
}

function pushFromOther(origin: string, text: string): void {
  const other = existsSync(path.join(fixture.proof.root, "other")) ? path.join(fixture.proof.root, "other") : cloneOf(fixture.proof, origin, "other");
  fixture.proof.git(other, ["pull", "-q", "--no-rebase", "--no-edit"]);
  editTask(fixture.proof, other, text);
  fixture.proof.git(other, ["add", "-A"]);
  fixture.proof.git(other, ["commit", "-q", "-m", "Change a work file in the other clone"]);
  fixture.proof.git(other, ["push", "-q", "origin", "main"]);
}

describe.skipIf(!existsSync(CLI))("W35 R0 P5 two checkouts (T11; A57)", () => {
  it("after setup with the hook input, an edit of a work file, and a commit, the store holds the edit, and git status shows no change that the hook made", () => {
    // The whole path of a person: setup installs the hooks, and no work command runs by hand after that.
    const repo = realPath(fixture.proof.repo("aurora"));
    const done = setup(fixture, repo, ["--yes", "--git-hooks"]);
    expect([done.status, done.gitHooks!.status]).toEqual(["complete", "installed"]);
    fixture.proof.write(repo, "docs/work/2042-06-01-w1-r0-aurora/00-index.md", "---\ntitle: \"W1 R0 Aurora\"\nkind: \"work\"\nstatus: \"active\"\ncoordinate: \"W1 R0\"\n---\n\n# W1 R0 Aurora\n");
    fixture.proof.write(repo, P1, "---\ntitle: \"Phase 1: First\"\nkind: \"work\"\nstatus: \"active\"\ncoordinate: \"W1 R0 P1\"\n---\n\n# Phase 1: First\n\n## Stage 1 - Build\n\n### Tasks\n\n- [ ] T1: Build the parser.\n");
    const first = commitAll(fixture, repo);
    expect(first.status).toBe(0);
    expect(first.hookOutput).toBe("Checkpoint: 2 files imported.\n");
    const after = checkpoint(fixture, repo);
    expect([after.nothingDue, after.readyCount > 0]).toEqual([true, true]);
    expect(fixture.proof.git(repo, ["status", "--porcelain"]).stdout).toBe("");
    recordHookFact(fixture.proof, "setup-then-commit", { imported: 2, statusClean: true });
  });

  it("a pull with a true merge brings the edit of the other checkout into the store, with no work command run by hand", () => {
    const { origin, mine } = remoteAndMine();
    const log = recordRuns(mine);
    pushFromOther(origin, "Build the pulled parser.");
    fixture.proof.commit(mine, "mine.txt", "mine\n", "A local commit");
    writeFileSync(log, "");
    const pull = fixture.proof.git(mine, ["pull", "-q", "--no-rebase", "--no-edit"], { env: fixture.onPath });
    expect(pull.status).toBe(0);
    expect((pull as HookGitResult).hookOutput).toBe("Checkpoint: 1 file imported.\n");
    expect(ran(log)).toEqual(["post-merge"]);
    expect(taskText(fixture, mine)).toBe("Build the pulled parser.");
    expect(fixture.proof.git(mine, ["status", "--porcelain"]).stdout).toBe("");
    recordHookFact(fixture.proof, "pull-merge", { hooks: ran(log), imported: true });
  });
});

describe.skipIf(!existsSync(CLI))("W35 R0 P5 two linked work trees on different branches (T12; A58)", () => {
  it("a commit in one work tree imports through the hook, the other work tree sees a file that waits, and a branch change alone changes no store record", () => {
    const repo = fixture.proof.repo("aurora");
    addProjectFiles(fixture.proof, repo);
    const linkedPath = path.join(fixture.proof.root, "aurora-topic");
    fixture.proof.git(repo, ["worktree", "add", "-q", "-b", "topic", linkedPath]);
    const main = bind(fixture, repo);
    const linked = bind(fixture, linkedPath, { separate: true });
    const firstMain = checkpoint(fixture, main);
    const firstLinked = checkpoint(fixture, linked);
    expect(firstMain.checkout.checkoutId).not.toBe(firstLinked.checkout.checkoutId);
    // One install serves both work trees: the hook files belong to the clone.
    installHooks(fixture, main);
    expect(installHooks(fixture, linked).hooks.map((entry) => entry.action)).toEqual(["none", "none", "none", "none"]);

    // A commit on the topic branch: the hook imports the text of that branch into the one project store.
    editTask(fixture.proof, linked, "Build the topic parser.");
    const commit = commitAll(fixture, linked);
    expect(commit.hookOutput).toBe("Checkpoint: 1 file imported.\n");
    expect(taskText(fixture, main)).toBe("Build the topic parser.");

    // A branch change alone in the main work tree: one report, no import, and no store record changes.
    const before = JSON.stringify(readWorkStore(main, (db) => db.prepare("SELECT * FROM work_units ORDER BY store_id").all(), { storeRoot: fixture.store }));
    const branch = fixture.proof.git(main, ["checkout", "-q", "-b", "side"], { env: fixture.onPath });
    expect((branch as HookGitResult).hookOutput).toBe("Checkpoint: 1 file waits.\nRun make-docs project checkpoint to see and settle what waits.\n");
    expect(JSON.stringify(readWorkStore(main, (db) => db.prepare("SELECT * FROM work_units ORDER BY store_id").all(), { storeRoot: fixture.store }))).toBe(before);
    expect(readFileSync(path.join(main, P1), "utf8")).toContain("Build the parser.");

    // A checkpoint in the main work tree names its own checkout, and names the file that it writes. Nothing is overwritten with no report.
    const direct = checkpoint(fixture, main);
    expect(direct.checkout).toEqual({ root: main, checkoutId: firstMain.checkout.checkoutId });
    expect([direct.imported, direct.written, direct.conflicts.length]).toEqual([[], [P1], 0]);
    expect(fixture.proof.git(main, ["status", "--porcelain"]).stdout.trim()).toBe(`M ${P1}`);
    recordHookFact(fixture.proof, "two-work-trees", { topicCommit: "imported", mainBranchChange: "1 file waits, no store change", mainDirect: "wrote the file, named in the result" });
  });

  it("when both work trees changed the file, the difference shows as a conflict for the checkout that runs second, and no text is lost", () => {
    const repo = fixture.proof.repo("aurora");
    addProjectFiles(fixture.proof, repo);
    const linkedPath = path.join(fixture.proof.root, "aurora-topic");
    fixture.proof.git(repo, ["worktree", "add", "-q", "-b", "topic", linkedPath]);
    const main = bind(fixture, repo);
    const linked = bind(fixture, linkedPath, { separate: true });
    checkpoint(fixture, main);
    checkpoint(fixture, linked);
    installHooks(fixture, main);
    installHooks(fixture, linked);
    editTask(fixture.proof, linked, "Build the topic parser.");
    expect(commitAll(fixture, linked).hookOutput).toBe("Checkpoint: 1 file imported.\n");
    // The main work tree also changed its file. Its commit reports a conflict, with the summary line and the command.
    editTask(fixture.proof, main, "Build the main parser.");
    const commit = commitAll(fixture, main);
    expect(commit.status).toBe(0);
    expect(commit.hookOutput).toBe("Checkpoint: 1 conflict waits for a person.\nRun make-docs project checkpoint to see and settle what waits.\n");
    expect(taskText(fixture, main)).toBe("Build the topic parser.");
    expect(readFileSync(path.join(main, P1), "utf8")).toContain("Build the main parser.");
    const checkoutId = getInstallationCheckoutId(main, fixture.store);
    expect(readWorkStore(main, (db) => listSyncConflicts(db, checkoutId).map((row) => row.conflict.targetPath), { storeRoot: fixture.store })).toEqual([P1]);
    expect(fixture.proof.git(main, ["status", "--porcelain"]).stdout).toBe("");
  });
});

describe.skipIf(!existsSync(CLI))("W35 R0 P5 git pull --rebase and an amended commit (T13; A59)", () => {
  it("after git pull --rebase with local commits, the hook after a rewrite ran the checkpoint, and the store holds the pulled work file", () => {
    const { origin, mine } = remoteAndMine();
    const log = recordRuns(mine);
    pushFromOther(origin, "Build the pulled parser.");
    fixture.proof.commit(mine, "mine.txt", "mine\n", "A local commit");
    writeFileSync(log, "");
    const pull = fixture.proof.git(mine, ["pull", "-q", "--rebase"], { env: fixture.onPath });
    expect(pull.status).toBe(0);
    const hooks = ran(log);
    // Git runs no hook after a merge here. The hooks after a checkout and after a commit run in the middle of the
    // rebase and do nothing. The hook after a rewrite runs last, one time, and imports.
    expect(hooks).not.toContain("post-merge");
    expect(hooks.filter((name) => name === "post-rewrite")).toHaveLength(1);
    expect(hooks[hooks.length - 1]).toBe("post-rewrite");
    expect((pull as HookGitResult).hookOutput).toBe("Checkpoint: 1 file imported.\n");
    expect(taskText(fixture, mine)).toBe("Build the pulled parser.");
    expect(fixture.proof.git(mine, ["status", "--porcelain"]).stdout).toBe("");
    recordHookFact(fixture.proof, "pull-rebase-local-commits", { hooks, imported: true });
  });

  it("git pull --rebase with no local commits runs the hook after a merge, and the store holds the pulled work file", () => {
    const { origin, mine } = remoteAndMine();
    const log = recordRuns(mine);
    pushFromOther(origin, "Build the pulled parser.");
    writeFileSync(log, "");
    const pull = fixture.proof.git(mine, ["pull", "-q", "--rebase"], { env: fixture.onPath });
    expect(pull.status).toBe(0);
    expect(ran(log)).toContain("post-merge");
    expect(taskText(fixture, mine)).toBe("Build the pulled parser.");
    recordHookFact(fixture.proof, "pull-rebase-no-local-commits", { hooks: ran(log), imported: true });
  });

  it("an amended commit runs two hooks, and the second run finds nothing due and prints nothing", () => {
    const { mine } = remoteAndMine();
    const log = recordRuns(mine);
    editTask(fixture.proof, mine, "Build the new parser.");
    fixture.proof.git(mine, ["add", "-A"]);
    fixture.proof.git(mine, ["commit", "-q", "-m", "Change a work file"], { env: fixture.onPath });
    writeFileSync(log, "");
    const amend = fixture.proof.git(mine, ["commit", "-q", "--amend", "-m", "The same change, with another message"], { env: fixture.onPath });
    expect(amend.status).toBe(0);
    expect(ran(log) as GitHookName[]).toEqual(["post-commit", "post-rewrite"]);
    // Nothing changed in the work files, so both runs find nothing due, and nothing prints.
    expect(`${amend.stdout}${amend.stderr}`).toBe("");
    recordHookFact(fixture.proof, "amended-commit", { hooks: ran(log), output: "" });
  });
});
