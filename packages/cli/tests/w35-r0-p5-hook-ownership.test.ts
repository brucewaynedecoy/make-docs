import { spawnSync } from "node:child_process";
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { findGitHookBlock, inspectGitHooks, listGitHookRecords, planGitHooks, renderGitHookBlock, renderGitHookReview, startsAnotherProgramOnItself } from "../src/git-hooks";
import { decideSetupGitHooks } from "../src/setup-git-hooks";
import { withInstallationDatabase } from "../src/store/installation-state";
import { realPath, shellQuote } from "./git-hook-proof";
import {
  CLI,
  commitAll,
  createHookFixture,
  editTask,
  envWithPath,
  goneCommand,
  hookFile,
  hookTexts,
  installHooks,
  project,
  recordHookFact,
  setPreference,
  setup,
  setupRemove,
  setupSecondCheckout,
  taskText,
  type HookFixture,
} from "./git-hook-setup";

/**
 * W35 R0 P5, the fixes after the independent review: who owns a block and a
 * record (findings M2, M3, and S5), the command that a hook runs (S6), a hook
 * file with two languages, and the modes of the Store folder.
 *
 * Each rule here is a proposal that the evidence lists for the owner.
 */

let fixture: HookFixture;

beforeEach(() => {
  fixture = createHookFixture("make-docs-w35-p5-own-");
});

afterEach(() => {
  fixture.cleanup();
});

const EDIT = ["--event commit --target-root", "--event commit --json --target-root"] as const;

function newRepo(name = "aurora"): string {
  return realPath(fixture.proof.repo(name));
}

/** Each backup file of a hook block below the backup folder of a project. */
function backupFiles(projectRoot: string): string[] {
  const root = path.join(projectRoot, ".make-docs", "backup");
  if (!existsSync(root)) return [];
  return readdirSync(root, { recursive: true }).map(String).filter((entry) => entry.endsWith(".block"));
}

function records(repo: string) {
  return withInstallationDatabase(repo, (db) => listGitHookRecords(db), { storeRoot: fixture.store, readOnly: true });
}

describe.skipIf(!existsSync(CLI))("W35 R0 P5 Make Docs keeps a block that a person changed (review finding M2)", () => {
  it("with the machine preference on, setup of a new project in a subfolder keeps a changed block of the repository, changes no hook, and says so in one line", () => {
    setPreference(fixture, "yes");
    const repo = newRepo("mono");
    setup(fixture, repo, ["--yes", "--git-hooks"]);
    // The person edits the block of one hook.
    const file = hookFile(fixture.proof, repo, "post-commit");
    const edited = readFileSync(file, "utf8").replace(...EDIT);
    writeFileSync(file, edited);
    const before = hookTexts(fixture.proof, repo);
    const record = JSON.stringify(records(repo));

    const sub = path.join(repo, "sub");
    mkdirSync(sub);
    const plain = setup(fixture, sub, ["--yes"]);
    expect([plain.gitHooks!.newProject, plain.gitHooks!.preferenceOn, plain.gitHooks!.status]).toEqual([true, true, "none"]);
    expect(plain.gitHooks!.hooks.map((entry) => `${entry.state}:${entry.action}`)).toEqual(["drifted:keep", "outdated:keep", "outdated:keep", "outdated:keep"]);
    const lines = plain.gitHooks!.message!.split("\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("was changed after Make Docs wrote it. Make Docs keeps it and changes no hook in this run. To replace it and keep a backup of the old block text, run `make-docs setup --git-hooks`.");
    // The edit is there, no other hook file changed, and the record is as it was.
    expect(hookTexts(fixture.proof, repo)).toEqual(before);
    expect(JSON.stringify(records(repo))).toBe(record);
    expect(backupFiles(sub)).toEqual([]);

    // The explicit hook input replaces the block. The plan names it first, and the result names the backup.
    const plan = setup(fixture, sub, ["--yes", "--dry-run", "--git-hooks"]);
    expect(plan.gitHooks!.hooks.map((entry) => `${entry.action}:${entry.backup ?? false}`)).toEqual(["replace-block:true", "replace-block:false", "replace-block:false", "replace-block:false"]);
    expect(hookTexts(fixture.proof, repo)).toEqual(before);
    const done = setup(fixture, sub, ["--yes", "--git-hooks"]);
    expect(done.gitHooks!.status).toBe("installed");
    const backups = done.gitHooks!.hooks.map((entry) => entry.backupFile ?? null);
    expect(backups.slice(1)).toEqual([null, null, null]);
    expect(realPath(backups[0]!).startsWith(realPath(path.join(sub, ".make-docs", "backup")))).toBe(true);
    expect(backupFiles(sub)).toHaveLength(1);
    expect(readFileSync(backups[0]!, "utf8")).toBe((findGitHookBlock(edited, "post-commit") as { block: string }).block);
    expect(readFileSync(file, "utf8")).not.toContain("--json");
    expect(records(repo)[0]!.record.checkouts.map((entry) => entry.projectFolder).sort()).toEqual([".", "sub"]);
    recordHookFact(fixture.proof, "changed-block-kept", { plain: "kept, no change", hookInput: "replaced with a backup" });
  }, 120_000);

  it("an interactive setup asks no hook question for a kept block, and only the hook input makes a plan that replaces it", () => {
    const root = project(fixture);
    const file = hookFile(fixture.proof, root, "post-commit");
    writeFileSync(file, readFileSync(file, "utf8").replace(...EDIT));
    const base = { targetDir: root, storeRoot: fixture.store, yes: false, dryRun: false, command: fixture.command };
    for (const [preferenceOn, newProject] of [[false, false], [true, true]] as const) {
      const asked = decideSetupGitHooks({ ...base, hookInput: undefined, interactive: true, preferenceOn, newProject });
      // No question, no install: the state of the project and one line with the next step.
      expect([asked.mode, asked.source, asked.plan.changed]).toEqual(["status", "none", false]);
      expect(asked.line).toContain("was changed after Make Docs wrote it. Make Docs keeps it and changes no hook in this run.");
    }
    const explicit = decideSetupGitHooks({ ...base, hookInput: true, interactive: true, preferenceOn: false, newProject: false });
    expect([explicit.mode, explicit.source]).toEqual(["install", "hook-input"]);
    expect(explicit.plan.hooks.filter((entry) => entry.backup).map((entry) => entry.name)).toEqual(["post-commit"]);
    // The review that the person sees before the write names the block and the backup.
    const review = renderGitHookReview(explicit.plan);
    expect(review).toContain("This run replaces a block that Make Docs did not write in this form, and keeps a backup of each old block text below .make-docs/backup/:");
    expect(review).toContain("Because you gave `--git-hooks`, Make Docs replaces the block. It first keeps the old block text in a backup below .make-docs/backup/ of this project, and the result names that file.");
  });

  it("an apply with no hook input changes nothing for a block with no record, and the hook input records the same block with no byte change", () => {
    const root = project(fixture);
    const texts = hookTexts(fixture.proof, root);
    // Take the record away, as when the Store was made new. Each block is then a block that no record covers.
    withInstallationDatabase(root, (db) => { db.prepare("DELETE FROM tool_operations WHERE operation='setup.git-hooks.receipt-current'").run(); }, { storeRoot: fixture.store });
    const plan = planGitHooks({ projectRoot: root, storeRoot: fixture.store, command: fixture.command });
    expect(plan.kept.map((entry) => `${entry.name}:${entry.state}:${entry.differs}`)).toEqual(["post-commit:unrecorded:false", "post-merge:unrecorded:false", "post-rewrite:unrecorded:false", "post-checkout:unrecorded:false"]);
    expect(installHooks(fixture, root).status).toBe("refused");
    expect(records(root)).toEqual([]);
    const explicit = installHooks(fixture, root, fixture.command, { explicit: true });
    expect(explicit.hooks.map((entry) => entry.action)).toEqual(["record-block", "record-block", "record-block", "record-block"]);
    expect(hookTexts(fixture.proof, root)).toEqual(texts);
    expect(records(root)).toHaveLength(1);
  });
});

describe.skipIf(!existsSync(CLI))("W35 R0 P5 a record belongs to the clone at its folder (review finding M3)", () => {
  it("a copy of a clone does not take over the record of the original while the original is away, and setup remove in the copy does not delete it", () => {
    const original = newRepo("g");
    setup(fixture, original, ["--yes", "--git-hooks"]);
    const key = records(original)[0]!.key;
    const record = JSON.stringify(records(original));
    const texts = hookTexts(fixture.proof, original);
    // A copy of the clone. Then the original is away, as on a drive that is not connected.
    const copyPath = path.join(fixture.proof.root, "g2");
    cpSync(original, copyPath, { recursive: true });
    const away = path.join(fixture.proof.root, "g-away");
    renameSync(original, away);
    const copy = realPath(copyPath);

    // A plain setup in the copy says the true state. It does not say that the project has the hooks.
    const plain = setupSecondCheckout(fixture, copy);
    expect(plain.gitHooks!.status).toBe("none");
    expect(plain.gitHooks!.message).toContain("This folder has Make Docs hook blocks that no record of this clone covers");
    expect(plain.gitHooks!.message).not.toContain("this project has the Make Docs git hooks");
    expect(JSON.stringify(records(copy))).toBe(record);

    // `setup remove` in the copy leaves the blocks of the copy, and it does not delete the record of the original.
    const removed = setupRemove(fixture, copy);
    expect(removed).toContain("no record of this clone covers it. So `setup remove` leaves each block and removes no record.");
    expect(removed).toContain("`setup remove` does not take that record over and does not delete it.");
    expect(JSON.stringify(records(copy))).toBe(record);
    expect(Object.values(hookTexts(fixture.proof, copy))).toEqual(Object.values(texts));

    // The original comes back. Its record still covers its four blocks, and `setup remove` there takes them out.
    renameSync(away, original);
    expect(records(original).map((entry) => entry.key)).toEqual([key]);
    const back = setup(fixture, original, ["--yes"]);
    expect([back.gitHooks!.status, back.gitHooks!.hooks.map((entry) => entry.state)]).toEqual(["selected", ["current", "current", "current", "current"]]);
    expect(setupRemove(fixture, original)).toContain("Git hooks: removed for this clone.");
    expect(Object.values(hookTexts(fixture.proof, original))).toEqual([null, null, null, null]);
    expect(records(original)).toEqual([]);
    recordHookFact(fixture.proof, "copied-clone", { plainSetup: "true state, no take-over", removeInCopy: "record of the original stays" });
  }, 180_000);

  it("a copy beside the original gets its own record only by the hook input, and each clone then removes only its own blocks", () => {
    const original = newRepo("g");
    setup(fixture, original, ["--yes", "--git-hooks"]);
    const copyPath = path.join(fixture.proof.root, "g2");
    cpSync(original, copyPath, { recursive: true });
    const copy = realPath(copyPath);
    const plain = setupSecondCheckout(fixture, copy);
    expect(plain.gitHooks!.status).toBe("none");
    expect(plain.gitHooks!.message).toContain("To record them for this clone, run `make-docs setup --git-hooks`.");
    expect(plain.gitHooks!.message).not.toContain("which is not there now");
    expect(records(copy)).toHaveLength(1);
    const explicit = setup(fixture, copy, ["--yes", "--git-hooks"]);
    expect(explicit.gitHooks!.takeoverFrom).toBeNull();
    expect(explicit.gitHooks!.hooks.map((entry) => entry.action)).toEqual(["record-block", "record-block", "record-block", "record-block"]);
    expect(records(copy)).toHaveLength(2);
    setupRemove(fixture, copy);
    expect(Object.values(hookTexts(fixture.proof, copy)).every((text) => text === null || !text.includes("make-docs git hook"))).toBe(true);
    expect(records(original)).toHaveLength(1);
    expect(setup(fixture, original, ["--yes"]).gitHooks!.hooks.map((entry) => entry.state)).toEqual(["current", "current", "current", "current"]);
  }, 180_000);

  it("setup remove in the main checkout keeps the blocks for a linked work tree whose folder moved, and the plan names that work tree first", () => {
    const repo = newRepo();
    setup(fixture, repo, ["--yes", "--git-hooks"]);
    fixture.proof.git(repo, ["add", "-A"]);
    fixture.proof.git(repo, ["commit", "-q", "-m", "Add Make Docs"], { env: fixture.noStore });
    const linked = path.join(fixture.proof.root, "aurora-topic");
    fixture.proof.git(repo, ["worktree", "add", "-q", "-b", "topic", linked], { env: fixture.noStore });
    setupSecondCheckout(fixture, realPath(linked), ["--git-hooks"]);
    const linkedId = records(repo)[0]!.record.checkouts.map((entry) => entry.checkoutId);
    expect(linkedId).toHaveLength(2);
    // The folder of the linked work tree moves. The Store still has its old folder, so it counts as gone.
    const movedTo = path.join(fixture.proof.root, "aurora-topic-moved");
    fixture.proof.git(repo, ["worktree", "move", linked, movedTo], { env: fixture.noStore });
    const texts = hookTexts(fixture.proof, repo);

    const report = setupRemove(fixture, repo);
    expect(report).toContain("Git hooks: 1 other checkout of this clone selected the hooks, and its recorded folder is gone:");
    expect(report).toContain("Git lists a work tree of this clone that can be that checkout at a new folder");
    expect(report).toContain("aurora-topic-moved");
    expect(report).toContain("Git hooks: the Make Docs blocks stay, with no change, and their Store record stays.");
    // No block went, and the record keeps the checkout of the moved work tree.
    expect(hookTexts(fixture.proof, repo)).toEqual(texts);
    expect(records(realPath(movedTo))).toHaveLength(1);
    expect(records(realPath(movedTo))[0]!.record.checkouts).toHaveLength(1);
    recordHookFact(fixture.proof, "moved-work-tree", { blocks: "stay", record: "stays" });
  }, 180_000);
});

describe.skipIf(!existsSync(CLI))("W35 R0 P5 the command that a hook runs (review finding S6)", () => {
  it("a hook runs the recorded command and not another make-docs on PATH, and it uses PATH only when the recorded command is gone", () => {
    // An older command on PATH, as an installed version that does not know the event or the wait limit.
    const oldBin = fixture.proof.folder("old-install-bin");
    const mark = path.join(fixture.proof.root, "the-older-command-ran");
    writeFileSync(path.join(oldBin, "make-docs"), `#!/bin/sh\necho ran >> ${shellQuote(mark)}\nexit 2\n`, { mode: 0o755 });
    const env = envWithPath(fixture.proof, [oldBin, fixture.onPath.PATH!].join(path.delimiter));

    const root = project(fixture);
    editTask(fixture.proof, root, "Build the new parser.");
    expect(commitAll(fixture, root, env).hookOutput).toBe("Checkpoint: 1 file imported.\n");
    expect(taskText(fixture, root)).toBe("Build the new parser.");
    expect(existsSync(mark)).toBe(false);

    // The recorded command file is gone, as after the person removed that install. Then the hook uses PATH.
    expect(installHooks(fixture, root, goneCommand(fixture)).status).toBe("installed");
    editTask(fixture.proof, root, "Build the newest parser.");
    const fallback = commitAll(fixture, root, env);
    expect(`${fallback.status}:${fallback.output}`).toBe("0:");
    expect(existsSync(mark)).toBe(true);
    expect(taskText(fixture, root)).toBe("Build the new parser.");
    // The review that setup shows names the command that a hook runs.
    const review = renderGitHookReview(planGitHooks({ projectRoot: root, storeRoot: fixture.store, command: fixture.command }));
    expect(review).toContain(`Each hook runs the Make Docs command at the recorded path: ${fixture.command.nodePath} ${fixture.command.commandFile}.`);
    expect(review).toContain("Only when that file or that `node` program is gone does a hook run `make-docs` from PATH.");
    recordHookFact(fixture.proof, "command-order", { first: "recorded command", fallback: "PATH" });
  }, 120_000);

  it("the block text puts the recorded command before the PATH lookup", () => {
    const block = renderGitHookBlock("post-commit", { nodePath: "/n/node", commandFile: "/m/index.js", projectFolders: ["."] });
    const recorded = block.indexOf("if [ -f \"$md_file\" ] && [ -x \"$md_node\" ]; then \"$md_node\" \"$md_file\" \"$@\"");
    const onPath = block.indexOf("elif [ -n \"$md_cmd\" ]; then \"$md_cmd\" \"$@\"");
    expect(recorded).toBeGreaterThan(0);
    expect(onPath).toBeGreaterThan(recorded);
  });
});

describe("W35 R0 P5 a hook file with a second language after the shell line", () => {
  const POLYGLOT = "#!/bin/sh\n':' //; exec node \"$0\" \"$@\"\nconsole.log('the other program ran');\n";

  it("the mark is a line with exec and $0 as one word, and a line that builds another path from $0 is plain shell", () => {
    expect(startsAnotherProgramOnItself(POLYGLOT)).toBe(true);
    expect(startsAnotherProgramOnItself("#!/bin/sh\neval 'exec perl -S $0 ${1+\"$@\"}'\n")).toBe(true);
    expect(startsAnotherProgramOnItself("#!/bin/sh\nexec python3 ${0} \"$@\"\n")).toBe(true);
    expect(startsAnotherProgramOnItself("#!/bin/sh\nexec \"$(dirname \"$0\")/post-commit.d/run\" \"$@\"\n")).toBe(false);
    expect(startsAnotherProgramOnItself("#!/bin/sh\n# exec node \"$0\"\necho \"$0\"\nexec other-tool run\n")).toBe(false);
  });

  it.skipIf(process.platform === "win32")("a block on line 2 would break such a file, so setup refuses it with one reason and no change", () => {
    const root = project(fixture, "aurora", { hooks: false });
    const file = fixture.proof.hook(root, "post-commit", POLYGLOT);
    const run = (target: string) => spawnSync("sh", [target], { cwd: root, env: fixture.proof.env, encoding: "utf8" });
    expect([run(file).status, run(file).stdout]).toEqual([0, "the other program ran\n"]);
    // The proof that a block would break it: the same file with a block after the first line no longer runs.
    const broken = path.join(fixture.proof.root, "broken-hook");
    const block = renderGitHookBlock("post-commit", { ...fixture.command, projectFolders: ["."] });
    writeFileSync(broken, POLYGLOT.replace("#!/bin/sh\n", `#!/bin/sh\n${block}`), { mode: 0o755 });
    const result = run(broken);
    expect(result.status).not.toBe(0);
    expect(result.stdout).not.toContain("the other program ran");

    const plan = planGitHooks({ projectRoot: root, storeRoot: fixture.store, command: fixture.command });
    expect(plan.status).toBe("refused");
    expect(plan.reason).toContain("is not a plain shell script: it starts another program on this same file");
    expect(installHooks(fixture, root).status).toBe("refused");
    expect(readFileSync(file, "utf8")).toBe(POLYGLOT);
    expect(existsSync(hookFile(fixture.proof, root, "post-merge"))).toBe(false);
    // A dispatcher that starts another file is a plain shell script, and it takes the block.
    writeFileSync(file, "#!/bin/sh\nexec \"$(dirname \"$0\")/post-commit.d/run\" \"$@\"\n", { mode: 0o755 });
    expect(inspectGitHooks(root).status).toBe("ready");
  });
});

describe.skipIf(!existsSync(CLI) || process.platform === "win32")("W35 R0 P5 the modes of a Store that the machine step makes", () => {
  it("setup system with no Store makes the Store folder for the owner only (0700) and config.json for the owner only (0600)", () => {
    expect(existsSync(fixture.store)).toBe(false);
    setPreference(fixture, "yes");
    expect(lstatSync(fixture.store).mode & 0o777).toBe(0o700);
    expect(lstatSync(path.join(fixture.store, "config.json")).mode & 0o777).toBe(0o600);
  });
});
