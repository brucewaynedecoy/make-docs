import { existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cloneOf, createGitProof, realPath, recordGitFact, shellPath, shellQuote, type GitProof } from "./git-hook-proof";

/**
 * W35 R0 P4 Stage 1 (T1 to T7): the git facts that the git hooks of P5 stand
 * on. Each test builds its repositories in one temporary folder and records
 * which hooks ran. Each test writes one line with the platform, the git
 * version, and what it saw, so the run log of each platform holds the result.
 *
 * The tests stay in the suite. A git version that changes a fact fails a test.
 */

let proof: GitProof;

beforeEach(() => {
  proof = createGitProof();
});

afterEach(() => {
  proof.cleanup();
});

/** A remote, a clone with the recording hooks, and a second clone that pushes one commit to the remote. */
function remoteWithNews(): { origin: string; mine: string } {
  const origin = proof.bare("origin.git");
  const seed = proof.repo("seed");
  proof.git(seed, ["remote", "add", "origin", origin]);
  proof.git(seed, ["push", "-q", "origin", "main"]);
  const mine = cloneOf(proof, origin, "mine");
  const other = cloneOf(proof, origin, "other");
  proof.commit(other, "theirs.txt", "theirs\n", "A commit of the other clone");
  proof.git(other, ["push", "-q", "origin", "main"]);
  proof.record(mine);
  return { origin, mine };
}

describe("W35 R0 P4 the pull facts (T1)", () => {
  it("git pull with a true merge runs post-merge, and MERGE_HEAD is still there", () => {
    const { mine } = remoteWithNews();
    proof.commit(mine, "mine.txt", "mine\n", "A local commit");
    proof.clear();
    proof.git(mine, ["pull", "-q", "--no-rebase", "--no-edit"]);
    const runs = proof.runs();
    recordGitFact(proof, "pull-merge", runs.map((run) => [run.hook, run.args.join(" "), run.state.join(" ")]));
    expect(proof.names()).toContain("post-merge");
    const merge = runs.find((run) => run.hook === "post-merge")!;
    // The one argument says that this was not a squash merge.
    expect(merge.args).toEqual(["0"]);
    // T2: MERGE_HEAD is still there when post-merge runs after a true merge.
    expect(merge.state).toContain("MERGE_HEAD");
    expect(existsSync(path.join(mine, "theirs.txt"))).toBe(true);
  });

  it("git pull that only moves the branch forward runs post-merge", () => {
    const { mine } = remoteWithNews();
    proof.clear();
    proof.git(mine, ["pull", "-q", "--no-rebase"]);
    recordGitFact(proof, "pull-fast-forward", proof.runs().map((run) => [run.hook, run.args.join(" "), run.state.join(" ")]));
    expect(proof.names()).toContain("post-merge");
    expect(proof.names()).not.toContain("post-rewrite");
  });

  it("git pull --rebase with no local commits runs post-merge", () => {
    const { mine } = remoteWithNews();
    proof.clear();
    proof.git(mine, ["pull", "-q", "--rebase"]);
    recordGitFact(proof, "pull-rebase-no-local-commits", proof.runs().map((run) => [run.hook, run.args.join(" "), run.state.join(" ")]));
    expect(proof.names()).toContain("post-merge");
    expect(proof.names()).not.toContain("post-rewrite");
    expect(existsSync(path.join(mine, "theirs.txt"))).toBe(true);
  });

  it("git pull --rebase with local commits runs post-checkout, post-commit, and post-rewrite, and not post-merge", () => {
    const { mine } = remoteWithNews();
    proof.commit(mine, "mine.txt", "mine\n", "A local commit");
    proof.clear();
    proof.git(mine, ["pull", "-q", "--rebase"]);
    const runs = proof.runs();
    recordGitFact(proof, "pull-rebase-local-commits", runs.map((run) => [run.hook, run.args.join(" "), run.state.join(" ")]));
    expect(proof.names()).toContain("post-checkout");
    expect(proof.names()).toContain("post-commit");
    expect(proof.names()).toContain("post-rewrite");
    expect(proof.names()).not.toContain("post-merge");
    const rewrite = runs.filter((run) => run.hook === "post-rewrite");
    expect(rewrite.map((run) => run.args)).toEqual([["rebase"]]);
    // T2: the rebase folder of git is still there when post-rewrite runs.
    expect(rewrite[0]!.state.some((mark) => mark === "rebase-merge" || mark === "rebase-apply")).toBe(true);
    // post-rewrite is the last hook of the action, so it marks its end.
    expect(proof.names().at(-1)).toBe("post-rewrite");
    expect(existsSync(path.join(mine, "theirs.txt"))).toBe(true);
  });
});

describe("W35 R0 P4 the commit and state facts (T2)", () => {
  it("a plain commit runs post-commit only", () => {
    const repo = proof.repo("plain");
    proof.record(repo);
    proof.commit(repo, "a.txt", "a\n");
    recordGitFact(proof, "commit", proof.runs().map((run) => [run.hook, run.args.join(" "), run.state.join(" ")]));
    expect(proof.names()).toEqual(["post-commit"]);
    expect(proof.runs()[0]!.state).toEqual([]);
  });

  it("an amended commit runs post-commit and post-rewrite", () => {
    const repo = proof.repo("amend");
    proof.commit(repo, "a.txt", "a\n");
    proof.record(repo);
    proof.git(repo, ["commit", "-q", "--amend", "-m", "A new message"]);
    const runs = proof.runs();
    recordGitFact(proof, "commit-amend", runs.map((run) => [run.hook, run.args.join(" "), run.state.join(" ")]));
    expect(proof.names().sort()).toEqual(["post-commit", "post-rewrite"]);
    expect(runs.find((run) => run.hook === "post-rewrite")!.args).toEqual(["amend"]);
  });

  it("git reset --hard to another commit runs none of the four hooks", () => {
    const repo = proof.repo("reset");
    proof.commit(repo, "a.txt", "one\n");
    proof.commit(repo, "a.txt", "two\n");
    proof.record(repo);
    proof.git(repo, ["reset", "-q", "--hard", "HEAD~1"]);
    recordGitFact(proof, "reset-hard", proof.names());
    // No trigger reaches the checkpoint here. The reminder line of the next Make Docs command covers this case.
    expect(proof.names()).toEqual([]);
  });
});

describe("W35 R0 P4 the facts of the hook after a checkout (T3)", () => {
  it("a branch change runs post-checkout with the third argument 1", () => {
    const repo = proof.repo("branch");
    proof.record(repo);
    proof.git(repo, ["checkout", "-q", "-b", "topic"]);
    const runs = proof.runs();
    recordGitFact(proof, "checkout-branch", runs.map((run) => [run.hook, run.args.at(-1)]));
    expect(runs.map((run) => [run.hook, run.args.length, run.args[2]])).toEqual([["post-checkout", 3, "1"]]);
  });

  it("a file checkout runs post-checkout with the third argument 0", () => {
    const repo = proof.repo("file");
    proof.commit(repo, "a.txt", "one\n");
    proof.commit(repo, "a.txt", "two\n");
    proof.record(repo);
    proof.git(repo, ["checkout", "-q", "HEAD~1", "--", "a.txt"]);
    const runs = proof.runs();
    recordGitFact(proof, "checkout-file", runs.map((run) => [run.hook, run.args.at(-1)]));
    expect(runs.map((run) => [run.hook, run.args[2]])).toEqual([["post-checkout", "0"]]);
    expect(readFileSync(path.join(repo, "a.txt"), "utf8")).toBe("one\n");
  });

  it("git worktree add runs post-checkout in the new work tree", () => {
    const repo = proof.repo("main-checkout");
    proof.record(repo);
    const linked = path.join(proof.root, "linked");
    proof.git(repo, ["worktree", "add", "-q", "-b", "topic", linked]);
    const runs = proof.runs();
    recordGitFact(proof, "worktree-add", runs.map((run) => [run.hook, run.args.at(-1)]));
    expect(runs.map((run) => [run.hook, run.args[2]])).toEqual([["post-checkout", "1"]]);
    expect(realPath(runs[0]!.top)).toBe(realPath(linked));
  });

  it("a clone runs post-checkout when the clone has the hook, and git does not copy hooks on clone", () => {
    const origin = proof.bare("origin.git");
    const seed = proof.repo("seed");
    proof.record(seed);
    proof.git(seed, ["remote", "add", "origin", origin]);
    proof.git(seed, ["push", "-q", "origin", "main"]);
    proof.clear();

    // A plain clone gets no hook of the source repository, so no hook runs.
    const plain = cloneOf(proof, origin, "plain-clone");
    expect(proof.runs()).toEqual([]);
    expect(existsSync(path.join(proof.hooksDir(plain), "post-checkout"))).toBe(false);

    // A clone gets a hook only from a template folder. Then post-checkout runs at the end of the clone.
    const template = proof.folder("template");
    mkdirSync(path.join(template, "hooks"));
    const hookFile = path.join(template, "hooks", "post-checkout");
    writeFileSync(hookFile, proof.recorder("post-checkout"), { mode: 0o755 });
    cloneOf(proof, origin, "template-clone", [`--template=${template}`]);
    const runs = proof.runs();
    recordGitFact(proof, "clone", runs.map((run) => [run.hook, run.args.at(-1)]));
    expect(runs.map((run) => [run.hook, run.args[2]])).toEqual([["post-checkout", "1"]]);
    expect(runs[0]!.args[0]).toMatch(/^0+$/);
  });
});

describe("W35 R0 P4 linked work trees share one hooks folder (T4)", () => {
  it("git rev-parse --git-path hooks in a linked work tree returns the hooks folder of the main checkout", () => {
    const repo = proof.repo("main-checkout");
    const linked = path.join(proof.root, "linked");
    proof.git(repo, ["worktree", "add", "-q", "-b", "topic", linked]);
    const main = realPath(path.join(repo, ".git", "hooks"));
    expect(realPath(proof.hooksDir(linked))).toBe(main);
    expect(realPath(proof.hooksDir(repo))).toBe(main);
    // The common git folder is the shared one. The git folder of the linked work tree is its own.
    const common = path.resolve(linked, proof.git(linked, ["rev-parse", "--git-common-dir"]).stdout.trim());
    const own = proof.git(linked, ["rev-parse", "--absolute-git-dir"]).stdout.trim();
    expect(realPath(common)).toBe(realPath(path.join(repo, ".git")));
    expect(realPath(own)).not.toBe(realPath(common));
    recordGitFact(proof, "worktree-hooks-path", { shared: true });
  });

  it("one hook file runs for a commit in each work tree of the clone", () => {
    const repo = proof.repo("main-checkout");
    const linked = path.join(proof.root, "linked");
    proof.git(repo, ["worktree", "add", "-q", "-b", "topic", linked]);
    proof.record(linked, ["post-commit"]);
    proof.commit(repo, "main.txt", "main\n");
    proof.commit(linked, "topic.txt", "topic\n");
    const runs = proof.runs();
    recordGitFact(proof, "worktree-one-hook-file", runs.map((run) => run.hook));
    expect(runs.map((run) => [run.hook, realPath(run.top)])).toEqual([
      ["post-commit", realPath(repo)],
      ["post-commit", realPath(linked)],
    ]);
    // The hook runs in the top folder of its own work tree, and each work tree has its own git folder.
    expect(realPath(runs[0]!.gitDir)).not.toBe(realPath(runs[1]!.gitDir));
  });
});

/**
 * T5. The detection rule that P5 uses to refuse, as plain checks on git output
 * and on the hook file. This phase builds no setup code, so the checks live
 * here as test functions, and P5 builds them in the product.
 */
function hooksPathSetting(repo: string): Array<{ scope: string; value: string }> {
  const result = proof.git(repo, ["config", "--show-scope", "--get-all", "core.hooksPath"], { allowFailure: true });
  // Exit code 1 means that no scope sets the value.
  if (result.status === 1) return [];
  expect(result.status, result.stderr).toBe(0);
  return result.stdout.split("\n").filter((entry) => entry !== "").map((entry) => {
    const [scope, ...value] = entry.replace(/\r$/, "").split("\t");
    return { scope: scope!, value: value.join("\t") };
  });
}

/** True when git uses the hooks folder of the clone's shared git folder. */
function usesDefaultHooksDir(repo: string): boolean {
  const common = path.resolve(repo, proof.git(repo, ["rev-parse", "--git-common-dir"]).stdout.trim());
  return path.resolve(proof.hooksDir(repo)) === path.join(common, "hooks");
}

const SHELL_FIRST_LINE = /^#!\s*(?:\/usr\/bin\/env\s+(?:-S\s+)?|(?:\/[^\s/]+)*\/)(?:sh|bash|dash|ksh|zsh)(?:\s|$)/;

/** A hook file is a shell script when its first line names a shell. Every other file is not one. */
function isShellHook(bytes: Buffer): boolean {
  if (bytes.includes(0)) return false;
  const first = bytes.toString("utf8").split("\n", 1)[0]!.replace(/\r$/, "");
  return SHELL_FIRST_LINE.test(first);
}

describe("W35 R0 P4 how setup detects another owner of the hooks (T5)", () => {
  it("with no core.hooksPath, git uses the hooks folder of the clone, and no scope holds the setting", () => {
    const repo = proof.repo("default");
    expect(hooksPathSetting(repo)).toEqual([]);
    expect(usesDefaultHooksDir(repo)).toBe(true);
  });

  it("core.hooksPath of the repository shows with the scope local, and git then ignores the hooks folder of the clone", () => {
    const repo = proof.repo("local");
    proof.record(repo, ["post-commit"]);
    const other = proof.folder("other-hooks");
    proof.git(repo, ["config", "core.hooksPath", shellPath(other)]);
    expect(hooksPathSetting(repo)).toEqual([{ scope: "local", value: shellPath(other) }]);
    expect(usesDefaultHooksDir(repo)).toBe(false);
    expect(realPath(proof.hooksDir(repo))).toBe(realPath(other));
    proof.commit(repo, "a.txt", "a\n");
    // The hook file in the hooks folder of the clone did not run.
    expect(proof.runs()).toEqual([]);
    recordGitFact(proof, "hooks-path-local", hooksPathSetting(repo).map((entry) => entry.scope));
  });

  it("core.hooksPath of the whole machine shows with the scope global", () => {
    const repo = proof.repo("global");
    const other = proof.folder("machine-hooks");
    // The global config of this proof is an empty file inside the temporary folder.
    expect(readFileSync(proof.globalConfig, "utf8")).toBe("");
    proof.git(repo, ["config", "--file", proof.globalConfig, "core.hooksPath", shellPath(other)]);
    expect(hooksPathSetting(repo)).toEqual([{ scope: "global", value: shellPath(other) }]);
    expect(usesDefaultHooksDir(repo)).toBe(false);
    recordGitFact(proof, "hooks-path-global", hooksPathSetting(repo).map((entry) => entry.scope));
  });

  it("a relative core.hooksPath resolves from the top folder of the work tree", () => {
    const repo = proof.repo("relative");
    proof.git(repo, ["config", "core.hooksPath", ".hooks"]);
    expect(realPath(path.dirname(proof.hooksDir(repo)))).toBe(realPath(repo));
    expect(usesDefaultHooksDir(repo)).toBe(false);
  });

  it("tells a shell script from each other kind of hook file by its first line", () => {
    expect(isShellHook(Buffer.from("#!/bin/sh\necho hi\n"))).toBe(true);
    expect(isShellHook(Buffer.from("#!/bin/sh\r\necho hi\r\n"))).toBe(true);
    expect(isShellHook(Buffer.from("#!/usr/bin/env bash\necho hi\n"))).toBe(true);
    expect(isShellHook(Buffer.from("#! /bin/bash -e\n"))).toBe(true);
    expect(isShellHook(Buffer.from("#!/usr/bin/env node\nconsole.log(1)\n"))).toBe(false);
    expect(isShellHook(Buffer.from("#!/usr/bin/python3\n"))).toBe(false);
    expect(isShellHook(Buffer.from("echo no first line\n"))).toBe(false);
    expect(isShellHook(Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x00, 0x01]))).toBe(false);
    expect(isShellHook(Buffer.from(""))).toBe(false);
  });

  it.skipIf(process.platform === "win32")("a hook file that is a link to a file of another tool shows as a symbolic link (skipped on Windows: a test cannot make a symbolic link there without a special right)", async () => {
    const { lstatSync } = await import("node:fs");
    const repo = proof.repo("linked-hook");
    const tool = path.join(proof.folder("tool"), "run-hook");
    writeFileSync(tool, proof.recorder("post-commit"), { mode: 0o755 });
    const target = path.join(proof.hooksDir(repo), "post-commit");
    mkdirSync(path.dirname(target), { recursive: true });
    symlinkSync(tool, target);
    expect(lstatSync(target).isSymbolicLink()).toBe(true);
    proof.commit(repo, "a.txt", "a\n");
    // git runs the linked file, so a block that Make Docs wrote through the link would change the other tool's file.
    expect(proof.names()).toEqual(["post-commit"]);
  });

  it("on a platform with file modes git does not run a hook file that is not executable", () => {
    const repo = proof.repo("mode");
    proof.hook(repo, "post-commit", proof.recorder("post-commit"), { executable: false });
    proof.commit(repo, "a.txt", "a\n");
    recordGitFact(proof, "hook-not-executable", proof.names());
    // Windows has no executable mode, so git runs the hook file there.
    expect(proof.names()).toEqual(process.platform === "win32" ? ["post-commit"] : []);
  });
});

describe("W35 R0 P4 the shell that runs a hook (T6)", () => {
  it("a hook file with a small marked block runs in a POSIX shell, exits 0, and sees a PATH", () => {
    const repo = proof.repo("shell");
    const out = path.join(proof.root, "shell.txt");
    const hookText = [
      "#!/bin/sh",
      "echo 'a line of another tool'",
      "# >>> make-docs proof block >>>",
      "{",
      "  printf 'shell=%s\\n' \"${BASH_VERSION:+bash }${ZSH_VERSION:+zsh }$0\"",
      "  printf 'kernel=%s\\n' \"$(uname -s 2>/dev/null)\"",
      "  printf 'sh=%s\\n' \"$(command -v sh 2>/dev/null)\"",
      "  printf 'git=%s\\n' \"$(command -v git 2>/dev/null)\"",
      "  printf 'cwd=%s\\n' \"$(pwd)\"",
      "  printf 'path=%s\\n' \"$PATH\"",
      `} > ${shellQuote(out)} 2>/dev/null`,
      "# <<< make-docs proof block <<<",
      "exit 0",
      "",
    ].join("\n");
    proof.hook(repo, "post-commit", hookText);
    proof.write(repo, "a.txt", "a\n");
    proof.git(repo, ["add", "--", "a.txt"]);
    const result = proof.git(repo, ["commit", "-q", "-m", "Run the hook"]);
    expect(result.status).toBe(0);
    expect(existsSync(out)).toBe(true);
    const seen = Object.fromEntries(readFileSync(out, "utf8").split("\n").filter((entry) => entry.includes("=")).map((entry) => {
      const index = entry.indexOf("=");
      return [entry.slice(0, index), entry.slice(index + 1).replace(/\r$/, "")];
    }));
    // The log line holds the shape of the PATH and not its full text, which names folders of the machine.
    const pathParts = seen.path!.split(":");
    recordGitFact(proof, "hook-shell", { shell: seen.shell, kernel: seen.kernel, sh: seen.sh, gitFound: seen.git !== "", pathEntries: pathParts.length, pathFirst: path.posix.basename(pathParts[0]!) });
    // A POSIX shell ran the file: the shell syntax worked, and `uname` and `command -v` gave answers.
    expect(seen.kernel).not.toBe("");
    expect(seen.sh).not.toBe("");
    // git puts its own program folder on the PATH of a hook, so a hook finds `git`.
    expect(seen.git).not.toBe("");
    expect(seen.path).not.toBe("");
    // The hook runs in the top folder of the work tree.
    expect(path.basename(seen.cwd!)).toBe("shell");
    // The line of the other tool printed, and the block printed nothing.
    expect(`${result.stdout}${result.stderr}`).toContain("a line of another tool");
  });

  it("the recording hook works when the temporary folder has a single quote and a space in its name", () => {
    const quoted = createGitProof("make-docs-w35-p4-it's a-");
    try {
      expect(quoted.root).toContain("'");
      const repo = quoted.repo("quote");
      quoted.record(repo, ["post-commit"]);
      quoted.commit(repo, "a.txt", "a\n");
      expect(quoted.names()).toEqual(["post-commit"]);
      expect(realPath(quoted.runs()[0]!.top)).toBe(realPath(repo));
    } finally {
      quoted.cleanup();
    }
  });
});

describe("W35 R0 P4 git in the middle of an action (T7)", () => {
  /** The rule that a hook after a commit or a branch change uses: any of these marks means "in the middle". */
  const inTheMiddle = (state: string[]) => state.some((mark) => ["rebase-merge", "rebase-apply", "MERGE_HEAD", "CHERRY_PICK_HEAD", "REVERT_HEAD", "BISECT_LOG"].includes(mark));

  it("each post-commit and post-checkout run of a rebase sees the rebase folder", () => {
    const { mine } = remoteWithNews();
    proof.commit(mine, "mine.txt", "mine\n", "A local commit");
    proof.clear();
    proof.git(mine, ["pull", "-q", "--rebase"]);
    const runs = proof.runs().filter((run) => run.hook === "post-commit" || run.hook === "post-checkout");
    recordGitFact(proof, "middle-rebase", runs.map((run) => [run.hook, run.state.join(" ")]));
    expect(runs.length).toBeGreaterThan(0);
    for (const run of runs) expect(inTheMiddle(run.state), `${run.hook} ${run.state.join(" ")}`).toBe(true);
  });

  it("a merge that stops for a conflict shows MERGE_HEAD, and the commit that ends it runs post-commit and not post-merge", () => {
    const repo = proof.repo("conflict");
    proof.commit(repo, "a.txt", "base\n");
    proof.git(repo, ["checkout", "-q", "-b", "topic"]);
    proof.commit(repo, "a.txt", "topic\n");
    proof.git(repo, ["checkout", "-q", "main"]);
    proof.commit(repo, "a.txt", "main\n");
    proof.record(repo);
    const merge = proof.git(repo, ["merge", "-q", "topic"], { allowFailure: true });
    expect(merge.status).not.toBe(0);
    expect(existsSync(path.join(repo, ".git", "MERGE_HEAD"))).toBe(true);
    // A file checkout in the middle of the merge runs post-checkout, and the hook sees the merge.
    proof.git(repo, ["checkout", "-q", "--ours", "--", "a.txt"]);
    const during = proof.runs();
    expect(during.map((run) => [run.hook, run.args[2], inTheMiddle(run.state)])).toEqual([["post-checkout", "0", true]]);
    proof.clear();
    proof.git(repo, ["add", "--", "a.txt"]);
    proof.git(repo, ["commit", "-q", "--no-edit"]);
    const runs = proof.runs();
    recordGitFact(proof, "middle-merge-conflict-end", runs.map((run) => [run.hook, run.state.join(" ")]));
    expect(proof.names()).toEqual(["post-commit"]);
    // No state mark is left then, so the rule does not stop this run, and the hook after a commit runs the checkpoint.
    expect(runs[0]!.state).toEqual([]);
    expect(inTheMiddle(runs[0]!.state)).toBe(false);
  });

  it("a cherry-pick of one commit runs post-commit one time, and that run sees CHERRY_PICK_HEAD, so the rule stops it", () => {
    const repo = proof.repo("pick-one");
    proof.git(repo, ["checkout", "-q", "-b", "topic"]);
    proof.commit(repo, "one.txt", "one\n");
    proof.git(repo, ["checkout", "-q", "main"]);
    proof.record(repo);
    proof.git(repo, ["cherry-pick", "topic"]);
    const runs = proof.runs();
    recordGitFact(proof, "middle-cherry-pick-one", runs.map((run) => [run.hook, run.state.join(" ")]));
    // Git runs no other hook of the four for a cherry-pick, so no hook is left to run the checkpoint at its end.
    expect(runs.map((run) => run.hook)).toEqual(["post-commit"]);
    expect(runs[0]!.state).toEqual(["CHERRY_PICK_HEAD"]);
    expect(inTheMiddle(runs[0]!.state)).toBe(true);
    // The mark is gone when the command has ended.
    expect(existsSync(path.join(repo, ".git", "CHERRY_PICK_HEAD"))).toBe(false);
    expect(existsSync(path.join(repo, "one.txt"))).toBe(true);
  });

  it("a cherry-pick of two commits runs post-commit for each one, and each run, also the last one, sees CHERRY_PICK_HEAD", () => {
    const repo = proof.repo("pick");
    proof.git(repo, ["checkout", "-q", "-b", "topic"]);
    proof.commit(repo, "one.txt", "one\n");
    proof.commit(repo, "two.txt", "two\n");
    proof.git(repo, ["checkout", "-q", "main"]);
    proof.record(repo);
    proof.git(repo, ["cherry-pick", "topic~1", "topic"]);
    const runs = proof.runs().filter((run) => run.hook === "post-commit");
    recordGitFact(proof, "middle-cherry-pick", proof.runs().map((run) => [run.hook, run.state.join(" ")]));
    expect(runs).toHaveLength(2);
    expect(proof.names()).toEqual(["post-commit", "post-commit"]);
    for (const run of runs) {
      expect(run.state).toContain("CHERRY_PICK_HEAD");
      expect(run.state).toContain("sequencer");
      expect(inTheMiddle(run.state)).toBe(true);
    }
    // The last run is the end of the action, and the rule stops it too. So no hook runs the checkpoint for a cherry-pick with no conflict.
    expect(inTheMiddle(runs.at(-1)!.state)).toBe(true);
  });

  /** A repository in which a cherry-pick or a revert of the named commits stops for a conflict in `a.txt`. */
  function conflictRepo(name: string): string {
    const repo = proof.repo(name);
    proof.commit(repo, "a.txt", "base\n");
    proof.git(repo, ["checkout", "-q", "-b", "topic"]);
    proof.commit(repo, "a.txt", "topic\n", "Change a.txt on topic");
    proof.commit(repo, "two.txt", "two\n", "Add two.txt on topic");
    proof.git(repo, ["checkout", "-q", "main"]);
    proof.commit(repo, "a.txt", "main\n");
    return repo;
  }

  it("a cherry-pick that stops for a conflict runs no hook, and the command that ends it runs post-commit with no CHERRY_PICK_HEAD", () => {
    const repo = conflictRepo("pick-conflict");
    proof.record(repo);
    const pick = proof.git(repo, ["cherry-pick", "topic~1"], { allowFailure: true });
    expect(pick.status).not.toBe(0);
    expect(existsSync(path.join(repo, ".git", "CHERRY_PICK_HEAD"))).toBe(true);
    expect(proof.runs()).toEqual([]);
    proof.write(repo, "a.txt", "settled\n");
    proof.git(repo, ["add", "--", "a.txt"]);
    proof.git(repo, ["cherry-pick", "--continue"]);
    const runs = proof.runs();
    recordGitFact(proof, "middle-cherry-pick-conflict-end", runs.map((run) => [run.hook, run.state.join(" ")]));
    // Git removes the mark before it runs the hook here. So the rule does not stop this run, and the hook runs the checkpoint.
    expect(runs.map((run) => [run.hook, run.state])).toEqual([["post-commit", []]]);
  });

  it("in a cherry-pick of two commits that stops at the first one, the commit that ends the stop sees only the sequencer folder, and the next one sees CHERRY_PICK_HEAD", () => {
    const repo = conflictRepo("pick-two-conflict");
    proof.record(repo);
    expect(proof.git(repo, ["cherry-pick", "topic~1", "topic"], { allowFailure: true }).status).not.toBe(0);
    proof.write(repo, "a.txt", "settled\n");
    proof.git(repo, ["add", "--", "a.txt"]);
    proof.git(repo, ["cherry-pick", "--continue"]);
    const runs = proof.runs();
    recordGitFact(proof, "middle-cherry-pick-two-conflict-end", runs.map((run) => [run.hook, run.state.join(" ")]));
    expect(runs.map((run) => [run.hook, run.state, inTheMiddle(run.state)])).toEqual([
      // The rule does not read the sequencer folder, so it does not stop the first run.
      ["post-commit", ["sequencer"], false],
      ["post-commit", ["CHERRY_PICK_HEAD", "sequencer"], true],
    ]);
  });

  it("a revert of one commit runs post-commit with no state mark, so the rule does not stop it", () => {
    const repo = proof.repo("revert-one");
    proof.commit(repo, "one.txt", "one\n");
    proof.record(repo);
    proof.git(repo, ["revert", "--no-edit", "HEAD"]);
    const runs = proof.runs();
    recordGitFact(proof, "middle-revert-one", runs.map((run) => [run.hook, run.state.join(" ")]));
    // No REVERT_HEAD: git writes that file only when a revert stops before its commit.
    expect(runs.map((run) => [run.hook, run.state])).toEqual([["post-commit", []]]);
    expect(existsSync(path.join(repo, "one.txt"))).toBe(false);
  });

  it("a revert of two commits runs post-commit for each one, and each run sees only the sequencer folder, which the rule does not read", () => {
    const repo = proof.repo("revert-two");
    proof.commit(repo, "one.txt", "one\n");
    proof.commit(repo, "two.txt", "two\n");
    proof.record(repo);
    proof.git(repo, ["revert", "--no-edit", "HEAD", "HEAD~1"]);
    const runs = proof.runs();
    recordGitFact(proof, "middle-revert-two", runs.map((run) => [run.hook, run.state.join(" ")]));
    expect(runs.map((run) => [run.hook, run.state, inTheMiddle(run.state)])).toEqual([
      ["post-commit", ["sequencer"], false],
      ["post-commit", ["sequencer"], false],
    ]);
  });

  it("a revert that stops for a conflict shows REVERT_HEAD and runs no post-commit, and the command that ends it runs post-commit with no state mark", () => {
    const repo = proof.repo("revert-conflict");
    proof.commit(repo, "a.txt", "one\n");
    proof.commit(repo, "a.txt", "two\n");
    proof.commit(repo, "a.txt", "three\n");
    proof.record(repo);
    const revert = proof.git(repo, ["revert", "--no-edit", "HEAD~1"], { allowFailure: true });
    expect(revert.status).not.toBe(0);
    expect(existsSync(path.join(repo, ".git", "REVERT_HEAD"))).toBe(true);
    expect(proof.runs()).toEqual([]);
    // A file checkout in the middle of the revert runs post-checkout with the third argument 0, and that run sees REVERT_HEAD.
    proof.git(repo, ["checkout", "-q", "--ours", "--", "a.txt"]);
    expect(proof.runs().map((run) => [run.hook, run.args[2], run.state])).toEqual([["post-checkout", "0", ["REVERT_HEAD"]]]);
    proof.clear();
    proof.write(repo, "a.txt", "settled\n");
    proof.git(repo, ["add", "--", "a.txt"]);
    proof.git(repo, ["revert", "--continue"]);
    const runs = proof.runs();
    recordGitFact(proof, "middle-revert-conflict-end", runs.map((run) => [run.hook, run.state.join(" ")]));
    expect(runs.map((run) => [run.hook, run.state])).toEqual([["post-commit", []]]);
    expect(existsSync(path.join(repo, ".git", "REVERT_HEAD"))).toBe(false);
  });

  it("a revert with --no-commit leaves REVERT_HEAD, and a branch change then removes it before post-checkout runs", () => {
    const repo = proof.repo("revert-no-commit");
    proof.git(repo, ["branch", "other"]);
    proof.commit(repo, "one.txt", "one\n");
    proof.record(repo);
    proof.git(repo, ["revert", "--no-commit", "HEAD"]);
    expect(existsSync(path.join(repo, ".git", "REVERT_HEAD"))).toBe(true);
    expect(proof.runs()).toEqual([]);
    proof.git(repo, ["checkout", "-q", "other"]);
    const runs = proof.runs();
    recordGitFact(proof, "middle-revert-no-commit-branch-change", runs.map((run) => [run.hook, run.args.at(-1), run.state.join(" ")]));
    // So no post-commit run and no branch change run of these tests ever saw REVERT_HEAD.
    expect(runs.map((run) => [run.hook, run.args[2], run.state])).toEqual([["post-checkout", "1", []]]);
    expect(existsSync(path.join(repo, ".git", "REVERT_HEAD"))).toBe(false);
  });

  it("git am runs none of the four hooks", () => {
    const repo = proof.repo("am");
    proof.git(repo, ["checkout", "-q", "-b", "topic"]);
    proof.commit(repo, "one.txt", "one\n");
    proof.commit(repo, "two.txt", "two\n");
    const patches = proof.folder("patches");
    proof.git(repo, ["format-patch", "-q", "-2", "-o", shellPath(patches)]);
    proof.git(repo, ["checkout", "-q", "main"]);
    proof.record(repo);
    proof.git(repo, ["am", "-q", shellPath(path.join(patches, "0001-Change-one.txt.patch")), shellPath(path.join(patches, "0002-Change-two.txt.patch"))]);
    recordGitFact(proof, "am", proof.names());
    // Two new commits exist, and no trigger reached the checkpoint. The reminder line and the next commit cover this case.
    expect(existsSync(path.join(repo, "two.txt"))).toBe(true);
    expect(proof.git(repo, ["rev-list", "--count", "HEAD"]).stdout.trim()).toBe("3");
    expect(proof.names()).toEqual([]);
  });

  it("each post-checkout run of a bisect sees the bisect log", () => {
    const repo = proof.repo("bisect");
    for (const name of ["one", "two", "three", "four"]) proof.commit(repo, `${name}.txt`, `${name}\n`);
    proof.record(repo);
    proof.git(repo, ["bisect", "start"]);
    proof.git(repo, ["bisect", "bad", "HEAD"]);
    proof.git(repo, ["bisect", "good", "HEAD~4"]);
    const runs = proof.runs();
    recordGitFact(proof, "middle-bisect", runs.map((run) => [run.hook, run.args.at(-1), run.state.join(" ")]));
    expect(runs.length).toBeGreaterThan(0);
    for (const run of runs) expect([run.hook, run.state.includes("BISECT_LOG")]).toEqual(["post-checkout", true]);
    proof.git(repo, ["bisect", "reset"]);
  });
});
