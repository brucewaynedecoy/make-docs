import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HARNESS_CALLER_IDENTITY_ENV } from "../src/harness-access/contract";
import { CLI_STORE_MAINTENANCE_VERSIONS } from "../src/operations/setup/store-ops";
import type { WorkCheckpointResult } from "../src/operations/work/work-queue/checkpoint";
import type { WorkUnitRecord } from "../src/operations/work/work-store/schemas";
import { platform } from "../src/platform";
import { getInstallationCheckoutId, previewInstallationCheckoutMove, registerSeparateInstallationCheckout, withInstallationDatabase } from "../src/store/installation-state";
import { STORE_BUSY_TIMEOUT_MS } from "../src/store/database";
import { checkStore, defaultStoreMaintenanceEnvironment } from "../src/store/maintenance";
import { getStoreDatabasePath } from "../src/store/paths";
import { listSyncConflicts, listWorkUnits, readWorkStore } from "../src/store/work-store";
import { cloneOf, createGitProof, realPath, recordGitFact, removeLinkOnly, shellPath, shellQuote, type GitProof } from "./git-hook-proof";

/**
 * W35 R0 P4 Stage 1 T7 and Stage 2 T9, T11, and T12: the checkpoint that a git
 * hook runs. Each test builds its repositories in one temporary folder, with a
 * temporary Store at a fixed, checked path inside it.
 *
 * This phase installs no hook in a real project and builds no setup code. The
 * hook text here is a proof form of the block that P5 builds.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(HERE, "../dist/index.js");
const PROJECT_ID = "aurora-w35-hooks";
const RECORD = "docs/work/2042-06-01-w1-r0-aurora";
const INDEX = `${RECORD}/00-index.md`;
const P1 = `${RECORD}/01-first.md`;
const TASK = "W1 R0 P1 T1";

const INDEX_TEXT = `---
title: "W1 R0 Aurora"
kind: "work"
status: "active"
coordinate: "W1 R0"
---

# W1 R0 Aurora
`;

const P1_TEXT = `---
title: "Phase 1: First"
kind: "work"
status: "active"
coordinate: "W1 R0 P1"
---

# Phase 1: First

## Stage 1 - Build

### Tasks

- [ ] T1: Build the parser.
- [ ] T2: Write the writer.
`;

let proof: GitProof;
let store: string;
/** A folder that holds a `make-docs` command file, as an install puts one on PATH. */
let binDir: string;
let launcher: string;

beforeEach(() => {
  proof = createGitProof("make-docs-w35-p4-hook-");
  store = path.join(proof.root, "store");
  vi.stubEnv("MAKE_DOCS_HOME", store);
  vi.stubEnv(HARNESS_CALLER_IDENTITY_ENV, "");
  // An empty value means the real Store, so the run stops when the value is empty.
  expect(process.env.MAKE_DOCS_HOME).toBe(store);
  expect(store.startsWith(proof.root)).toBe(true);
  proof.env.MAKE_DOCS_HOME = store;
  proof.env[HARNESS_CALLER_IDENTITY_ENV] = "";
  binDir = proof.folder("install-bin");
  // A launcher in the form that a package manager writes for a shell: a small script with a first line.
  // This one names the node program by its full path, so it needs nothing from PATH.
  launcher = path.join(binDir, "make-docs");
  writeFileSync(launcher, `#!/bin/sh\nexec ${shellQuote(process.execPath)} ${shellQuote(CLI)} "$@"\n`, { mode: 0o755 });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  proof.cleanup();
});

/** The environment of git with another PATH. Windows holds the name in another letter case, so each form goes. */
function envWithPath(value: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const [key, entry] of Object.entries(proof.env)) if (key.toUpperCase() !== "PATH") env[key] = entry;
  env.PATH = value;
  return env;
}

function currentPath(): string {
  const key = Object.keys(proof.env).find((entry) => entry.toUpperCase() === "PATH");
  return key ? proof.env[key] ?? "" : "";
}

/** A PATH as an app can pass it to git: the system folders only, with no folder of a package manager. */
function shortPath(): string {
  if (process.platform !== "win32") return "/usr/bin:/bin";
  const system = process.env.SystemRoot ?? "C:\\Windows";
  return [path.join(system, "System32"), system].join(path.delimiter);
}

function withBin(base: string): string {
  return [binDir, base].join(path.delimiter);
}

/** True when a `node` program is in one of the folders of a PATH. */
function pathHasNode(value: string): boolean {
  return value.split(path.delimiter).some((folder) => folder !== "" && ["node", "node.exe"].some((name) => existsSync(path.join(folder, name))));
}

interface BlockOptions {
  event?: "commit" | "branch-change";
  /** A full path that setup would record in the block, or null for a PATH lookup alone. */
  recorded?: string | null;
  /** A folder that the block adds to the end of PATH for the call, or null. */
  nodeDir?: string | null;
}

/** The proof form of the hook block: find the command, run the checkpoint at the project root, and always exit 0. */
function hookText(name: string, options: BlockOptions = {}): string {
  const found = shellQuote(path.join(proof.root, "found.log"));
  const lines = [
    "#!/bin/sh",
    "# >>> make-docs proof block >>>",
    "md_top=$(git rev-parse --show-toplevel 2>/dev/null)",
    "md_cmd=$(command -v make-docs 2>/dev/null)",
  ];
  if (options.recorded) lines.push(`if [ -z "$md_cmd" ] && [ -x ${shellQuote(options.recorded)} ]; then md_cmd=${shellQuote(options.recorded)}; fi`);
  // The hook shell on Windows prints its folder in its own form (`/d/a/...`). `pwd -W` gives the Windows form there.
  // Another shell does not know `-W`, so the plain form follows.
  lines.push("md_pwd=$(pwd -W 2>/dev/null || pwd)");
  lines.push(`printf '%s\\t%s\\t%s\\n' '${name}' "$md_pwd" "$md_cmd" >> ${found}`);
  lines.push("if [ -n \"$md_cmd\" ] && [ -n \"$md_top\" ]; then");
  if (options.nodeDir) {
    lines.push(`  md_node=${shellQuote(options.nodeDir)}`);
    // The hook shell on Windows holds PATH in its own form, so the folder is changed to that form first.
    lines.push("  if command -v cygpath >/dev/null 2>&1; then md_node=$(cygpath -u \"$md_node\"); fi");
    lines.push(`  PATH="$PATH:$md_node" "$md_cmd" project checkpoint --event ${options.event ?? "commit"} --target-root "$md_top" 2>/dev/null || true`);
  } else {
    lines.push(`  "$md_cmd" project checkpoint --event ${options.event ?? "commit"} --target-root "$md_top" 2>/dev/null || true`);
  }
  lines.push("fi", "# <<< make-docs proof block <<<", "exit 0", "");
  return lines.join("\n");
}

function found(): Array<{ hook: string; cwd: string; command: string }> {
  const file = path.join(proof.root, "found.log");
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8").split("\n").filter((entry) => entry !== "").map((entry) => {
    const [hook, cwd, command] = entry.replace(/\r$/, "").split("\t");
    return { hook: hook!, cwd: cwd ?? "", command: command ?? "" };
  });
}

/** Add the Make Docs files of the fixture project to a repository, and commit them. */
function addProjectFiles(repo: string): void {
  proof.write(repo, ".make-docs/config.yaml", `projectId: ${PROJECT_ID}\nprojectName: aurora\n`);
  proof.write(repo, INDEX, INDEX_TEXT);
  proof.write(repo, P1, P1_TEXT);
  proof.git(repo, ["add", "--", ".make-docs", "docs"]);
  proof.git(repo, ["commit", "-q", "-m", "Add the project files"]);
}

/**
 * Bind a checkout to the temporary Store. The result is the root in the form that the Store holds.
 * A second checkout of one project, such as a linked work tree, binds as a separate checkout: the step that
 * `make-docs project checkout apply` does for a person.
 */
function bind(repo: string, options: { separate?: boolean } = {}): string {
  expect(process.env.MAKE_DOCS_HOME).toBe(store);
  const root = platform.describePath(repo).canonicalPath;
  if (options.separate) registerSeparateInstallationCheckout(root, previewInstallationCheckoutMove(root, undefined, store).separateReviewDigest!, store);
  else getInstallationCheckoutId(root, store);
  return root;
}

function cliRun(cwd: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
  expect(proof.env.MAKE_DOCS_HOME).toBe(store);
  const result = spawnSync(process.execPath, [CLI, ...args], { cwd, env: proof.env, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function checkpoint(root: string, args: string[] = []): WorkCheckpointResult {
  const result = cliRun(root, ["project", "checkpoint", "--target-root", root, "--json", ...args]);
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout) as WorkCheckpointResult;
}

function units(root: string): WorkUnitRecord[] {
  return readWorkStore(root, (db) => listWorkUnits(db, PROJECT_ID), { storeRoot: store });
}

function taskText(root: string): string | null {
  return units(root).find((unit) => unit.coordinate === TASK)?.body ?? null;
}

/** A project in a new repository, bound, with its first sync done. */
function project(name = "aurora"): string {
  const repo = proof.repo(name);
  addProjectFiles(repo);
  const root = bind(repo);
  expect(checkpoint(root).firstSync).toBe(true);
  expect(taskText(root)).toBe("Build the parser.");
  return root;
}

function editTask(repo: string, text: string): void {
  proof.write(repo, P1, P1_TEXT.replace("Build the parser.", text));
}

function commitAll(repo: string, env?: NodeJS.ProcessEnv, cwd = repo): { status: number | null; stdout: string; stderr: string } {
  proof.git(repo, ["add", "-A"]);
  return proof.git(cwd, ["commit", "-q", "-m", "Change a work file"], env ? { env } : {});
}

describe.skipIf(!existsSync(CLI))("W35 R0 P4 how a hook finds the make-docs command (T9)", () => {
  it("a PATH lookup alone finds the command when its folder is on PATH, and the store has the edit after the commit", () => {
    const root = project();
    proof.hook(root, "post-commit", hookText("post-commit"));
    editTask(root, "Build the new parser.");
    const result = commitAll(root, envWithPath(withBin(currentPath())));
    expect(result.status).toBe(0);
    expect(found().map((entry) => entry.command !== "")).toEqual([true]);
    expect(taskText(root)).toBe("Build the new parser.");
    // The trigger run wrote no project file. It imported a file, so it printed its result, and the summary line is first.
    expect(proof.git(root, ["status", "--porcelain"]).stdout).toBe("");
    expect(`${result.stdout}${result.stderr}`.split("\n")[0]).toBe("Checkpoint: 1 file imported.");
    recordGitFact(proof, "lookup-path-alone-on-path", { found: true, imported: true });
  });

  it("a PATH lookup alone finds no command when git has a short PATH, and the hook then does nothing and exits 0", () => {
    const root = project();
    proof.hook(root, "post-commit", hookText("post-commit"));
    editTask(root, "Build the new parser.");
    const result = commitAll(root, envWithPath(shortPath()));
    expect(result.status).toBe(0);
    expect(`${result.stdout}${result.stderr}`).toBe("");
    expect(found().map((entry) => entry.command)).toEqual([""]);
    expect(taskText(root)).toBe("Build the parser.");
    recordGitFact(proof, "lookup-path-alone-short-path", { found: false, exit: result.status, output: "" });
  });

  it("a PATH lookup and then a recorded path finds the command when git has a short PATH", () => {
    const root = project();
    proof.hook(root, "post-commit", hookText("post-commit", { recorded: launcher }));
    editTask(root, "Build the new parser.");
    const result = commitAll(root, envWithPath(shortPath()));
    expect(result.status).toBe(0);
    expect(found().map((entry) => entry.command)).toEqual([shellPath(launcher)]);
    expect(taskText(root)).toBe("Build the new parser.");
    expect(`${result.stdout}${result.stderr}`.split("\n")[0]).toBe("Checkpoint: 1 file imported.");
    recordGitFact(proof, "lookup-path-then-recorded-short-path", { found: true, imported: true });
  });

  it("a hook that finds no command on PATH and none at the recorded path does nothing, prints nothing, and exits 0", () => {
    const root = project();
    proof.hook(root, "post-commit", hookText("post-commit", { recorded: path.join(binDir, "gone", "make-docs") }));
    editTask(root, "Build the new parser.");
    const result = commitAll(root, envWithPath(shortPath()));
    expect(result.status).toBe(0);
    expect(`${result.stdout}${result.stderr}`).toBe("");
    expect(found().map((entry) => entry.command)).toEqual([""]);
    expect(taskText(root)).toBe("Build the parser.");
    recordGitFact(proof, "lookup-none", { found: false, exit: result.status, output: "" });
  });

  // The short PATH cannot show the case when the system folders of the machine hold a node program. The test is then skipped, and the run shows it as skipped.
  it.skipIf(pathHasNode(shortPath()))("a recorded command file that needs node from PATH fails with a short PATH, and works when the block adds the node folder (skipped when the system folders hold a node program)", () => {
    const short = shortPath();
    // The form that a package manager writes when it links the command: the file starts node by name.
    const needsNode = path.join(proof.folder("needs-node-bin"), "make-docs");
    writeFileSync(needsNode, `#!/bin/sh\nexec node ${shellQuote(CLI)} "$@"\n`, { mode: 0o755 });

    const root = project();
    proof.hook(root, "post-commit", hookText("post-commit", { recorded: needsNode }));
    editTask(root, "Build the new parser.");
    const without = commitAll(root, envWithPath(short));
    // The command file was found, but it could not start. The block hides the error and still exits 0.
    expect(without.status).toBe(0);
    expect(`${without.stdout}${without.stderr}`).toBe("");
    expect(found().map((entry) => entry.command)).toEqual([shellPath(needsNode)]);
    expect(taskText(root)).toBe("Build the parser.");

    proof.hook(root, "post-commit", hookText("post-commit", { recorded: needsNode, nodeDir: path.dirname(process.execPath) }));
    proof.write(root, "note.txt", "one more commit\n");
    const withNode = commitAll(root, envWithPath(short));
    expect(withNode.status).toBe(0);
    expect(taskText(root)).toBe("Build the new parser.");
    recordGitFact(proof, "lookup-launcher-needs-node", { withoutNodeFolder: "found, not run, exit 0, no output", withNodeFolder: "imported" });
  });

  it("the command file that a real global install writes is found on PATH and runs in the hook shell (skipped when the install into the temporary prefix does not work)", (context) => {
    // A global install of this package from its folder, into a prefix inside the temporary folder. It needs no network.
    const prefix = path.join(proof.root, "npm-prefix");
    const userConfig = path.join(proof.root, "npmrc");
    writeFileSync(userConfig, "");
    const install = spawnSync(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["install", "-g", "--prefix", prefix, "--offline", "--no-audit", "--no-fund", "--ignore-scripts", path.resolve(HERE, "..")],
      {
        cwd: proof.root,
        encoding: "utf8",
        shell: process.platform === "win32",
        env: { ...proof.env, npm_config_userconfig: userConfig, npm_config_cache: path.join(proof.root, "npm-cache"), npm_config_update_notifier: "false" },
      },
    );
    const globalBin = process.platform === "win32" ? prefix : path.join(prefix, "bin");
    // An install from a folder writes a link to that folder. The link points into this repository's package folder.
    const packageLink = path.join(prefix, ...(process.platform === "win32" ? [] : ["lib"]), "node_modules", "@brucewaynedecoy", "make-docs");
    try {
      const made = install.status === 0 && existsSync(path.join(globalBin, "make-docs"));
      if (!made) {
        // No proof gathered on this platform. The log line says so, the run shows the test as skipped, and the evidence report records it as a gap.
        recordGitFact(proof, "lookup-global-install", { made: false, status: install.status, error: (install.stderr ?? "").split("\n").slice(0, 3).join(" ") });
        context.skip("The global install into the temporary prefix did not work on this platform.");
        return;
      }
      const root = project();
      proof.hook(root, "post-commit", hookText("post-commit"));
      editTask(root, "Build the new parser.");
      // The global command folder and the node folder are on PATH, as in a person's terminal.
      const result = commitAll(root, envWithPath([globalBin, path.dirname(process.execPath), shortPath()].join(path.delimiter)));
      expect(result.status).toBe(0);
      expect(found().map((entry) => entry.command !== "")).toEqual([true]);
      expect(taskText(root)).toBe("Build the new parser.");
      recordGitFact(proof, "lookup-global-install", { made: true, found: true, imported: true });
    } finally {
      // Take the link out by itself, before the recursive removal of the temporary folder, so that no removal can go
      // through the link into the package folder. Then prove that the package folder is whole.
      removeLinkOnly(packageLink);
      expect(existsSync(packageLink)).toBe(false);
      expect(existsSync(path.join(HERE, "..", "package.json"))).toBe(true);
      expect(existsSync(CLI)).toBe(true);
    }
  }, 180_000);

  it("a hook runs in the top folder of the work tree, also for a commit from a subfolder, and the checkpoint needs the project root", () => {
    const root = project();
    proof.hook(root, "post-commit", hookText("post-commit"));
    editTask(root, "Build the new parser.");
    const result = commitAll(root, envWithPath(withBin(currentPath())), path.join(root, "docs"));
    expect(result.status).toBe(0);
    expect(found().map((entry) => realPath(entry.cwd))).toEqual([realPath(root)]);
    expect(taskText(root)).toBe("Build the new parser.");

    // From a subfolder with no project root given, the checkpoint says that the folder is not a Make Docs project.
    const direct = cliRun(path.join(root, "docs"), ["project", "checkpoint"]);
    expect(direct.status).toBe(0);
    expect(direct.stdout).toContain("not a Make Docs project");
    // A trigger run there prints nothing.
    const trigger = cliRun(path.join(root, "docs"), ["project", "checkpoint", "--event", "commit"]);
    expect([trigger.status, trigger.stdout]).toEqual([0, ""]);
    recordGitFact(proof, "hook-folder", { hookRunsAtTop: true, subfolderWithoutRoot: "not a Make Docs project, exit 0" });
  });
});

/** A helper process: take the Store write lock, say so, and let go when the test closes its input. */
const HOLDER = `
const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync(process.argv[1]);
db.exec("BEGIN IMMEDIATE");
process.stdout.write("held\\n");
process.stdin.on("end", () => { db.exec("COMMIT"); db.close(); });
process.stdin.resume();
`;

function holdStore(): Promise<ChildProcessWithoutNullStreams> {
  expect(proof.env.MAKE_DOCS_HOME).toBe(store);
  const holder = spawn(process.execPath, ["-e", HOLDER, getStoreDatabasePath(store)], { cwd: proof.root, env: proof.env });
  return new Promise((resolve, reject) => {
    let errors = "";
    holder.stdout.on("data", (chunk) => { if (String(chunk).includes("held")) resolve(holder); });
    holder.stderr.on("data", (chunk) => { errors += String(chunk); });
    holder.on("error", reject);
    holder.on("close", (status) => reject(new Error(`The lock helper ended with status ${status}. ${errors}`)));
  });
}

function release(holder: ChildProcessWithoutNullStreams): Promise<void> {
  return new Promise((resolve) => {
    holder.on("close", () => resolve());
    holder.stdin.end();
  });
}

/**
 * The worst case of a foreground hook, as the product behaves today. The Store is one for the machine, so any other
 * Make Docs write on the machine can hold it. These tests pin the behavior. They do not say that it is wanted.
 */
describe.skipIf(!existsSync(CLI))("W35 R0 P4 a trigger run while another process holds the Store (OG-4)", () => {
  it("a trigger run for a commit waits the Store busy time, exits 1, and prints one line with the typed Store result on standard error", async () => {
    const root = project();
    editTask(root, "Build the new parser.");
    const holder = await holdStore();
    let waited: { status: number | null; stdout: string; stderr: string };
    let branchChange: { status: number | null; stdout: string; stderr: string };
    let elapsed: number;
    let branchElapsed: number;
    try {
      const started = Date.now();
      waited = cliRun(root, ["project", "checkpoint", "--event", "commit", "--target-root", root]);
      elapsed = Date.now() - started;
      // A trigger run for a branch change only reads, so it does not wait for the write lock.
      const branchStarted = Date.now();
      branchChange = cliRun(root, ["project", "checkpoint", "--event", "branch-change", "--target-root", root]);
      branchElapsed = Date.now() - branchStarted;
    } finally {
      await release(holder);
    }
    recordGitFact(proof, "store-held-trigger-run", { exit: waited.status, waitedMs: Math.round(elapsed / 100) * 100, stdout: waited.stdout, errorLines: waited.stderr.trim().split("\n").length, branchChangeExit: branchChange.status, branchChangeMs: Math.round(branchElapsed / 100) * 100 });
    expect(waited.status).toBe(1);
    expect(waited.stdout).toBe("");
    const errorLines = waited.stderr.trim().split("\n");
    expect(errorLines).toHaveLength(1);
    // The one line is the typed Store result as JSON, also with no `--json` input. It is long: about 1,100 characters.
    const failure = JSON.parse(errorLines[0]!) as { ok: boolean; code: string; operation: string; details: { issue: { code: string; waitedMs: number } } };
    expect([failure.ok, failure.code, failure.operation, failure.details.issue.code, failure.details.issue.waitedMs]).toEqual([false, "store-unavailable", "project.checkpoint.run", "contention-timeout", STORE_BUSY_TIMEOUT_MS]);
    expect(elapsed).toBeGreaterThanOrEqual(STORE_BUSY_TIMEOUT_MS - 100);
    expect(elapsed).toBeLessThan(STORE_BUSY_TIMEOUT_MS + 10_000);
    expect(branchChange.status).toBe(0);
    expect(branchChange.stdout.split("\n")[0]).toBe("Checkpoint: 1 file waits.");
    expect(branchElapsed).toBeLessThan(STORE_BUSY_TIMEOUT_MS - 1_000);
    // Nothing was imported, and the next run with a free Store imports the file.
    expect(taskText(root)).toBe("Build the parser.");
    expect(checkpoint(root).imported).toEqual([P1]);
  }, 60_000);

  it("a commit with a foreground proof hook then takes the Store busy time longer, exits 0, and prints nothing, because the proof block hides the error and the exit code", async () => {
    const root = project();
    proof.hook(root, "post-commit", hookText("post-commit"));
    editTask(root, "Build the new parser.");
    proof.git(root, ["add", "-A"]);
    const holder = await holdStore();
    let result: { status: number | null; stdout: string; stderr: string };
    let elapsed: number;
    try {
      const started = Date.now();
      result = proof.git(root, ["commit", "-q", "-m", "Change a work file"], { env: envWithPath(withBin(currentPath())), allowFailure: true });
      elapsed = Date.now() - started;
    } finally {
      await release(holder);
    }
    recordGitFact(proof, "store-held-foreground-hook", { exit: result.status, commitMs: Math.round(elapsed / 100) * 100, output: `${result.stdout}${result.stderr}` });
    expect(result.status).toBe(0);
    expect(`${result.stdout}${result.stderr}`).toBe("");
    expect(elapsed).toBeGreaterThanOrEqual(STORE_BUSY_TIMEOUT_MS - 100);
    expect(proof.git(root, ["status", "--porcelain"]).stdout).toBe("");
    expect(taskText(root)).toBe("Build the parser.");
  }, 60_000);
});

describe.skipIf(!existsSync(CLI))("W35 R0 P4 the checkpoint at the end of a merge and of a rewrite (T7)", () => {
  /** A remote with the project, my bound clone with its first sync, and a pushed edit of the work file by another clone. */
  function remoteWithWorkEdit(): string {
    const origin = proof.bare("origin.git");
    const seed = proof.repo("seed");
    addProjectFiles(seed);
    proof.git(seed, ["remote", "add", "origin", origin]);
    proof.git(seed, ["push", "-q", "origin", "main"]);
    const mine = bind(cloneOf(proof, origin, "mine"));
    expect(checkpoint(mine).firstSync).toBe(true);
    const other = cloneOf(proof, origin, "other");
    editTask(other, "Build the pulled parser.");
    proof.git(other, ["add", "-A"]);
    proof.git(other, ["commit", "-q", "-m", "Change a work file in the other clone"]);
    proof.git(other, ["push", "-q", "origin", "main"]);
    proof.commit(mine, "mine.txt", "mine\n", "A local commit");
    return mine;
  }

  it("the hook after a merge runs the checkpoint while MERGE_HEAD is still there, and the store has the pulled edit", () => {
    const mine = remoteWithWorkEdit();
    proof.record(mine, ["post-commit", "post-checkout", "post-rewrite"]);
    // One hook file that records the state of git and then runs the block.
    proof.hook(mine, "post-merge", `${proof.recorder("post-merge").replace(/exit 0\n$/, "")}${hookText("post-merge").replace("#!/bin/sh\n", "")}`);
    const result = proof.git(mine, ["pull", "-q", "--no-rebase", "--no-edit"], { env: envWithPath(withBin(currentPath())) });
    expect(result.status).toBe(0);
    const merge = proof.runs().find((run) => run.hook === "post-merge")!;
    expect(merge.state).toContain("MERGE_HEAD");
    expect(taskText(mine)).toBe("Build the pulled parser.");
    expect(proof.git(mine, ["status", "--porcelain"]).stdout).toBe("");
    recordGitFact(proof, "checkpoint-in-post-merge", { state: merge.state, imported: true });
  });

  it("the hook after a rewrite runs the checkpoint while the rebase folder is still there, and the store has the pulled edit", () => {
    const mine = remoteWithWorkEdit();
    proof.record(mine, ["post-commit", "post-checkout", "post-merge"]);
    proof.hook(mine, "post-rewrite", `${proof.recorder("post-rewrite").replace(/exit 0\n$/, "")}${hookText("post-rewrite").replace("#!/bin/sh\n", "")}`);
    const result = proof.git(mine, ["pull", "-q", "--rebase"], { env: envWithPath(withBin(currentPath())) });
    expect(result.status).toBe(0);
    expect(proof.names()).not.toContain("post-merge");
    const rewrite = proof.runs().find((run) => run.hook === "post-rewrite")!;
    expect(rewrite.state.some((mark) => mark === "rebase-merge" || mark === "rebase-apply")).toBe(true);
    expect(taskText(mine)).toBe("Build the pulled parser.");
    expect(proof.git(mine, ["status", "--porcelain"]).stdout).toBe("");
    recordGitFact(proof, "checkpoint-in-post-rewrite", { state: rewrite.state, imported: true });
  });
});

describe.skipIf(!existsSync(CLI))("W35 R0 P4 two work trees of one clone and a direct checkpoint, with no hook (T12)", () => {
  /** The main checkout on `main` and a linked work tree on `topic`, both bound. The linked one binds as a separate checkout. */
  function twoWorkTrees(options: { topicDiffers: boolean }): { main: string; linked: string } {
    const repo = proof.repo("aurora");
    addProjectFiles(repo);
    const linkedPath = path.join(proof.root, "aurora-topic");
    proof.git(repo, ["worktree", "add", "-q", "-b", "topic", linkedPath]);
    if (options.topicDiffers) commitTopicEdit(linkedPath);
    return { main: bind(repo), linked: bind(linkedPath, { separate: true }) };
  }

  function commitTopicEdit(linked: string): void {
    editTask(linked, "Build the topic parser.");
    proof.git(linked, ["add", "-A"]);
    proof.git(linked, ["commit", "-q", "-m", "Change the task on the topic branch"]);
  }

  it("a second work tree cannot bind with the plain step, and binds as a separate checkout", () => {
    const repo = proof.repo("aurora");
    addProjectFiles(repo);
    const linkedPath = path.join(proof.root, "aurora-topic");
    proof.git(repo, ["worktree", "add", "-q", "-b", "topic", linkedPath]);
    bind(repo);
    expect(() => bind(linkedPath)).toThrow(/This project ID has a Store checkout at another path/);
    // Until it is bound, the checkpoint there syncs nothing, exits 0, and a trigger run prints nothing.
    const direct = cliRun(linkedPath, ["project", "checkpoint", "--target-root", linkedPath, "--json"]);
    expect(direct.status).toBe(0);
    expect((JSON.parse(direct.stdout) as WorkCheckpointResult).syncRan).toBe(false);
    const trigger = cliRun(linkedPath, ["project", "checkpoint", "--target-root", linkedPath, "--event", "commit"]);
    expect([trigger.status, trigger.stdout]).toEqual([0, ""]);
    expect(() => bind(linkedPath, { separate: true })).not.toThrow();
    recordGitFact(proof, "two-worktrees-binding", { plainBind: "refused", unboundCheckpoint: "syncs nothing, exit 0, trigger run prints nothing", separate: "bound" });
  });

  it("the first sync of a work tree on another branch reports each file that differs as a conflict, and the store keeps its text", () => {
    const { main, linked } = twoWorkTrees({ topicDiffers: true });
    const first = checkpoint(main);
    expect([first.firstSync, first.imported.length, first.written.length, first.conflicts.length]).toEqual([true, 2, 0, 0]);
    expect(taskText(main)).toBe("Build the parser.");

    const linkedFile = readFileSync(path.join(linked, P1), "utf8");
    const second = checkpoint(linked);
    expect(second.checkout.checkoutId).not.toBe(first.checkout.checkoutId);
    expect([second.firstSync, second.written.length]).toEqual([true, 0]);
    expect(second.imported).not.toContain(P1);
    expect(second.conflicts.map((conflict) => conflict.path)).toEqual([P1]);
    // Nothing was overwritten: the store keeps the text of the main checkout, and the file keeps the text of the branch.
    expect(taskText(main)).toBe("Build the parser.");
    expect(readFileSync(path.join(linked, P1), "utf8")).toBe(linkedFile);
    // The main checkout sees no change.
    expect(checkpoint(main).nothingDue).toBe(true);
    recordGitFact(proof, "two-worktrees-first-sync-differs", { linked: "1 conflict, no import of that file", store: "kept", main: "nothing due" });
  });

  it("after both first syncs, the store follows the work tree that ran the checkpoint last, and the other one sees a file that waits", () => {
    const { main, linked } = twoWorkTrees({ topicDiffers: false });
    checkpoint(main);
    expect(checkpoint(linked).conflicts).toEqual([]);

    // An edit on the topic branch, then a direct checkpoint there: the one project store takes the text of that branch.
    commitTopicEdit(linked);
    const second = checkpoint(linked);
    expect([second.imported, second.written.length, second.conflicts.length]).toEqual([[P1], 0, 0]);
    expect(taskText(main)).toBe("Build the topic parser.");

    // The main checkout did not change its file. A read-only check there names the file that waits for a write.
    const check = checkpoint(main, ["--event", "branch-change"]);
    expect(check.syncRan).toBe(false);
    expect(check.waiting).toEqual([{ path: P1, waitsFor: "write" }]);
    expect(readFileSync(path.join(main, P1), "utf8")).toContain("Build the parser.");
    // A trigger run that may import leaves the file as it is, and names it as a file that waits.
    const trigger = checkpoint(main, ["--event", "commit"]);
    expect([trigger.written.length, trigger.waiting]).toEqual([0, [{ path: P1, waitsFor: "write" }]]);
    expect(readFileSync(path.join(main, P1), "utf8")).toContain("Build the parser.");

    // A direct run there writes the file from the store, and its result names the file. Nothing changed with no report.
    const third = checkpoint(main);
    expect([third.imported.length, third.conflicts.length]).toEqual([0, 0]);
    expect(third.written).toEqual([P1]);
    expect(readFileSync(path.join(main, P1), "utf8")).toContain("Build the topic parser.");
    expect(proof.git(main, ["status", "--porcelain"]).stdout.trim()).toBe(`M ${P1}`);
    recordGitFact(proof, "two-worktrees-file-unchanged", { linked: "imported", mainCheck: "1 file waits for a write", mainTrigger: "1 file waits, no file written", mainDirect: "wrote the file, named in the result" });
  });

  it("when the other work tree also changed its file, the difference is a conflict, and no file and no store text changes", () => {
    const { main, linked } = twoWorkTrees({ topicDiffers: false });
    checkpoint(main);
    checkpoint(linked);
    commitTopicEdit(linked);
    checkpoint(linked);
    editTask(main, "Build the main parser.");
    const before = readFileSync(path.join(main, P1), "utf8");

    const result = checkpoint(main);
    expect([result.imported.length, result.written.length]).toEqual([0, 0]);
    expect(result.conflicts.map((conflict) => conflict.path)).toEqual([P1]);
    expect(readFileSync(path.join(main, P1), "utf8")).toBe(before);
    expect(taskText(main)).toBe("Build the topic parser.");
    const checkoutId = getInstallationCheckoutId(main, store);
    expect(readWorkStore(main, (db) => listSyncConflicts(db, checkoutId).map((row) => row.conflict.targetPath), { storeRoot: store })).toEqual([P1]);
    recordGitFact(proof, "two-worktrees-file-changed", { main: "1 conflict, no file changed, store text kept" });
  });
});

describe("W35 R0 P4 a Store record for the hook block that the clone owns (T11)", () => {
  const OPERATION = "setup.git-hooks.receipt-current";
  const BLOCK = "# >>> make-docs >>>\nmake-docs project checkpoint --event commit\n# <<< make-docs <<<\n";
  const digest = (text: string) => createHash("sha256").update(text).digest("hex");

  /** The key of the record: the shared git folder of the clone, which each work tree of the clone gives. */
  function cloneKey(workTree: string): string {
    const common = realPath(path.resolve(workTree, proof.git(workTree, ["rev-parse", "--git-common-dir"]).stdout.trim()));
    return `git-hooks:${digest(shellPath(common))}`;
  }

  interface HookRecord {
    hooks: Record<string, { blockDigest: string }>;
    checkouts: string[];
  }

  function save(root: string, key: string, record: HookRecord): void {
    withInstallationDatabase(root, (db) => {
      db.prepare(
        "INSERT INTO tool_operations (operation_id,operation,status,pid,hostname,metadata_json,started_at,finished_at) VALUES (?,?,'completed',?,?,?,?,?) ON CONFLICT(operation_id) DO UPDATE SET status='completed',metadata_json=excluded.metadata_json,finished_at=excluded.finished_at",
      ).run(key, OPERATION, process.pid, platform.hostname, JSON.stringify(record), "2042-06-15T12:00:00.000Z", "2042-06-15T12:00:00.000Z");
    }, { storeRoot: store });
  }

  function read(root: string, key: string): HookRecord | null {
    return withInstallationDatabase(root, (db) => {
      const row = db.prepare("SELECT metadata_json FROM tool_operations WHERE operation_id=? AND operation=? AND status='completed'").get(key, OPERATION) as { metadata_json: string } | undefined;
      return row ? JSON.parse(row.metadata_json) as HookRecord : null;
    }, { storeRoot: store, readOnly: true });
  }

  function remove(root: string, key: string): void {
    withInstallationDatabase(root, (db) => {
      db.prepare("DELETE FROM tool_operations WHERE operation_id=? AND operation=? AND status='completed'").run(key, OPERATION);
    }, { storeRoot: store });
  }

  it("the existing tool operation record holds one hook record for a clone, from each work tree, with no schema change", () => {
    const repo = proof.repo("aurora");
    addProjectFiles(repo);
    const linkedPath = path.join(proof.root, "aurora-topic");
    proof.git(repo, ["worktree", "add", "-q", "-b", "topic", linkedPath]);
    const main = bind(repo);
    const linked = bind(linkedPath, { separate: true });
    const schemaBefore = withInstallationDatabase(main, (db) => (db.prepare("PRAGMA user_version").get() as { user_version: number }).user_version, { storeRoot: store, readOnly: true });

    // Each work tree of the clone gives the same key, and another clone gives another key.
    expect(cloneKey(linked)).toBe(cloneKey(main));
    expect(cloneKey(proof.repo("another-clone"))).not.toBe(cloneKey(main));

    // Setup in the main checkout records the block. The record names the bound checkout that selected the hooks.
    const mainId = getInstallationCheckoutId(main, store);
    const linkedId = getInstallationCheckoutId(linked, store);
    save(main, cloneKey(main), { hooks: { "post-commit": { blockDigest: digest(BLOCK) } }, checkouts: [mainId] });
    // Setup in the linked work tree finds the same record and adds its checkout. One record stays.
    const fromLinked = read(linked, cloneKey(linked))!;
    save(linked, cloneKey(linked), { ...fromLinked, checkouts: [...fromLinked.checkouts, linkedId] });
    const rows = withInstallationDatabase(main, (db) => db.prepare("SELECT operation_id FROM tool_operations WHERE operation=?").all(OPERATION), { storeRoot: store, readOnly: true });
    expect(rows).toHaveLength(1);

    // Drift: the block of the hook file no longer has the recorded digest.
    const hookFile = proof.hook(main, "post-commit", `#!/bin/sh\necho other\n${BLOCK}`);
    const blockOf = (text: string) => text.slice(text.indexOf("# >>> make-docs >>>"), text.indexOf("# <<< make-docs <<<\n") + "# <<< make-docs <<<\n".length);
    const record = read(main, cloneKey(main))!;
    expect(digest(blockOf(readFileSync(hookFile, "utf8")))).toBe(record.hooks["post-commit"]!.blockDigest);
    writeFileSync(hookFile, readFileSync(hookFile, "utf8").replace("--event commit", "--event commit --json"));
    expect(digest(blockOf(readFileSync(hookFile, "utf8")))).not.toBe(record.hooks["post-commit"]!.blockDigest);
    writeFileSync(hookFile, `#!/bin/sh\necho other\n${BLOCK}`);

    // Removal in the linked work tree: another bound checkout of the clone remains, so the block and the record stay.
    const afterLinked = { ...read(linked, cloneKey(linked))!, checkouts: [mainId] };
    save(linked, cloneKey(linked), afterLinked);
    expect(read(main, cloneKey(main))!.checkouts).toEqual([mainId]);
    expect(readFileSync(hookFile, "utf8")).toContain(BLOCK);
    // Removal in the last checkout: the block matches the record, so exactly the block goes, and the record goes.
    const text = readFileSync(hookFile, "utf8");
    expect(digest(blockOf(text))).toBe(afterLinked.hooks["post-commit"]!.blockDigest);
    writeFileSync(hookFile, text.replace(BLOCK, ""));
    remove(main, cloneKey(main));
    expect(readFileSync(hookFile, "utf8")).toBe("#!/bin/sh\necho other\n");
    expect(read(main, cloneKey(main))).toBeNull();

    // No schema version changed.
    const schemaAfter = withInstallationDatabase(main, (db) => (db.prepare("PRAGMA user_version").get() as { user_version: number }).user_version, { storeRoot: store, readOnly: true });
    expect(schemaAfter).toBe(schemaBefore);
  });

  it("the Store check stays healthy with the record, and no cleanup rule selects it", () => {
    const main = bind((() => { const repo = proof.repo("aurora"); addProjectFiles(repo); return repo; })());
    save(main, cloneKey(main), { hooks: { "post-commit": { blockDigest: digest(BLOCK) } }, checkouts: [getInstallationCheckoutId(main, store)] });
    const later = new Date("2043-06-15T12:00:00.000Z");
    const report = checkStore(store, defaultStoreMaintenanceEnvironment(CLI_STORE_MAINTENANCE_VERSIONS, later));
    expect(report.leftovers).toEqual([]);
    const touched = JSON.stringify(report.rules.flatMap((rule) => [...rule.act.entries, ...rule.skipped.entries]));
    expect(touched).not.toContain(cloneKey(main));
    expect(read(main, cloneKey(main))).not.toBeNull();
  });
});
