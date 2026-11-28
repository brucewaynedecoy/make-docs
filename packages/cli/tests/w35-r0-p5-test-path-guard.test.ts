import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createGitProof, foreignMakeDocsOnPath, shellQuote, type GitProof } from "./git-hook-proof";
import { CLI, commitAll, createHookFixture, editTask, envWithPath, project, taskText, type HookFixture, type HookGitResult } from "./git-hook-setup";
import { cleanupTempDir, createTempDir } from "./helpers";

/**
 * W35 R0 P5 review, finding M4: no hook test may run a `make-docs` command that
 * is installed on this computer. A hook looks for `make-docs` on PATH. So the
 * PATH of each git child process of a hook test holds one tool folder inside
 * the temporary folder of the test and the system folders, and nothing of the
 * PATH of the caller.
 *
 * Each test here puts a fake `make-docs` first on the PATH of this process, as
 * an installed command is. The fake command writes a mark file when it runs.
 */

let outer: string | null = null;
let fixture: HookFixture | null = null;
let proof: GitProof | null = null;

afterEach(() => {
  fixture?.cleanup();
  proof?.cleanup();
  fixture = null;
  proof = null;
  vi.unstubAllEnvs();
  if (outer) cleanupTempDir(outer);
  outer = null;
});

/** A folder outside each test folder with a fake `make-docs`, first on the PATH of this process. */
function fakeInstalledCommand(): { folder: string; mark: string } {
  outer = createTempDir("make-docs-w35-p5-outer-");
  const folder = path.join(outer, "installed-bin");
  mkdirSync(folder);
  const mark = path.join(outer, "the-installed-command-ran");
  writeFileSync(path.join(folder, "make-docs"), `#!/bin/sh\necho ran >> ${shellQuote(mark)}\nexit 0\n`, { mode: 0o755 });
  if (process.platform === "win32") writeFileSync(path.join(folder, "make-docs.cmd"), `@echo ran>> "${mark}"\r\n`);
  vi.stubEnv("PATH", [folder, process.env.PATH ?? ""].join(path.delimiter));
  return { folder, mark };
}

function pathOf(env: NodeJS.ProcessEnv): string {
  const key = Object.keys(env).find((entry) => entry.toUpperCase() === "PATH");
  return key ? env[key] ?? "" : "";
}

describe("W35 R0 P5 the PATH of a hook test reaches no installed make-docs command (review finding M4)", () => {
  it("the PATH of a proof holds nothing of the PATH of the caller, and no make-docs command", () => {
    const fake = fakeInstalledCommand();
    expect(foreignMakeDocsOnPath(process.env.PATH ?? "", path.join(outer!, "no-test-folder"))).toContain(path.join(fake.folder, "make-docs"));
    proof = createGitProof("make-docs-w35-p5-guard-");
    const value = pathOf(proof.env);
    expect(value.split(path.delimiter)).not.toContain(fake.folder);
    expect(foreignMakeDocsOnPath(value, proof.root)).toEqual([]);
    // Git and the shell tools still work with that PATH.
    const repo = proof.repo("plain");
    proof.record(repo, ["post-commit"]);
    proof.commit(repo, "a.txt", "a\n");
    expect(proof.names()).toEqual(["post-commit"]);
    expect(existsSync(fake.mark)).toBe(false);
  });

  it("each environment of a hook fixture reaches only the make-docs command that the fixture made", () => {
    fakeInstalledCommand();
    fixture = createHookFixture("make-docs-w35-p5-guard-");
    for (const env of [fixture.proof.env, fixture.onPath, fixture.shortPath, fixture.noStore]) {
      expect(foreignMakeDocsOnPath(pathOf(env), fixture.proof.root)).toEqual([]);
    }
    // The command that the fixture made is inside the test folder, so it is allowed.
    expect(pathOf(fixture.onPath).split(path.delimiter)[0]).toBe(fixture.binDir);
    // The folder that the block adds to the end of PATH holds no make-docs command.
    expect(foreignMakeDocsOnPath(path.dirname(fixture.command.nodePath), fixture.proof.root)).toEqual([]);
  });

  it("a git run with a PATH that reaches a foreign make-docs command is refused before git starts", () => {
    const fake = fakeInstalledCommand();
    proof = createGitProof("make-docs-w35-p5-guard-");
    const repo = proof.repo("plain");
    const env = { ...proof.env, PATH: [fake.folder, pathOf(proof.env)].join(path.delimiter) };
    expect(() => proof!.git(repo, ["status"], { env })).toThrow(/reaches a make-docs command that the test did not make/);
    expect(existsSync(fake.mark)).toBe(false);
  });

  it.skipIf(!existsSync(CLI))("a commit with the installed hooks and the default environment of the proof runs no installed command", () => {
    const fake = fakeInstalledCommand();
    fixture = createHookFixture("make-docs-w35-p5-guard-");
    const root = project(fixture);
    editTask(fixture.proof, root, "Build the new parser.");
    // The default environment has no make-docs on PATH. The block then uses the recorded command, which is the built CLI.
    fixture.proof.git(root, ["add", "-A"]);
    const result = fixture.proof.git(root, ["commit", "-q", "-m", "Change a work file"]);
    expect((result as HookGitResult).hookOutput).toBe("Checkpoint: 1 file imported.\n");
    expect(taskText(fixture, root)).toBe("Build the new parser.");
    // With no command on PATH and none at the recorded path, nothing runs.
    fixture.proof.write(root, "a.txt", "a\n");
    expect(commitAll(fixture, root, envWithPath(fixture.proof, pathOf(fixture.shortPath))).status).toBe(0);
    expect(existsSync(fake.mark)).toBe(false);
  }, 120_000);
});
