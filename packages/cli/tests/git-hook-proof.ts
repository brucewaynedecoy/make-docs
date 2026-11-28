import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, rmdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

import { cleanupTempDir, createTempDir } from "./helpers";

/**
 * W35 R0 P4: the helper of the git hook proofs.
 *
 * Each proof works only inside one temporary folder that the helper makes.
 * The helper refuses a git command with a working folder outside that folder.
 * The git child process gets a temporary home folder and empty config files in
 * place of the person's global and system git config, and it cannot find a
 * repository above the temporary folder. Each remote is a local bare
 * repository, so no proof contacts a network.
 */

export const GIT_HOOK_NAMES = ["post-commit", "post-merge", "post-rewrite", "post-checkout"] as const;
export type GitHookName = (typeof GIT_HOOK_NAMES)[number];

/** The state files and folders of git that show an action in the middle. */
export const GIT_STATE_MARKS = ["rebase-merge", "rebase-apply", "MERGE_HEAD", "CHERRY_PICK_HEAD", "REVERT_HEAD", "BISECT_LOG", "sequencer"] as const;

export interface HookRun {
  hook: string;
  args: string[];
  /** The state marks of git that were there when the hook ran. */
  state: string[];
  /** The top folder of the work tree in which the hook ran. */
  top: string;
  gitDir: string;
}

export interface GitResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

export interface GitProof {
  /** The one temporary folder of this proof. */
  root: string;
  /** The environment of each git child process. */
  env: NodeJS.ProcessEnv;
  /** The absolute path of the git program. */
  gitPath: string;
  /** A folder inside the temporary folder that holds only a `node` command. A test adds it to a PATH that needs `node`. */
  nodeDir: string;
  gitVersion: string;
  /** The empty file that stands in for the person's global git config. */
  globalConfig: string;
  /** Run git in a folder inside the temporary folder. It throws when git fails, unless `allowFailure` is set. */
  git(cwd: string, args: string[], options?: { allowFailure?: boolean; env?: NodeJS.ProcessEnv }): GitResult;
  /** A new folder inside the temporary folder. */
  folder(name: string): string;
  /** A bare repository that stands in for a remote. */
  bare(name: string): string;
  /** A new repository with one commit on the branch `main`. */
  repo(name: string): string;
  /** Write one file with `\n` line ends, and make its folder. */
  write(repo: string, relative: string, text: string): void;
  /** Write a file, add it, and commit it. */
  commit(repo: string, relative: string, text: string, message?: string): void;
  /** The hooks folder that git uses for a work tree. */
  hooksDir(repo: string): string;
  /** Install a hook that records each run in the log. */
  record(repo: string, hooks?: readonly GitHookName[]): void;
  /** Install one hook file with the given shell text. */
  hook(repo: string, name: string, text: string, options?: { executable?: boolean }): string;
  /** The hook that records a run, as shell text. */
  recorder(name: string): string;
  runs(): HookRun[];
  /** The hook names of the log, in the order in which they ran. */
  names(): string[];
  clear(): void;
  cleanup(): void;
}

/** The real path of a folder or file, with each short name of Windows made long, as git prints it. */
export function realPath(target: string): string {
  return realpathSync.native(target);
}

/** A path in the form that a shell script and git accept on each platform. */
export function shellPath(target: string): string {
  return target.split(path.sep).join("/");
}

/**
 * A path as one word of POSIX shell text, in single quotes. A single quote inside the path ends the quoted text,
 * adds one escaped quote, and starts the quoted text again, so a temporary folder with a quote in its name is safe.
 */
export function shellQuote(target: string): string {
  return `'${shellPath(target).replace(/'/g, "'\\''")}'`;
}

/**
 * Remove a link and never what it points to. A recursive removal is not used here, so it cannot go into the
 * target. A link to a folder on Windows (a junction) does not go with `unlink`, and `rmdir` removes only the link.
 */
export function removeLinkOnly(link: string): void {
  let stats;
  try {
    stats = lstatSync(link);
  } catch {
    return;
  }
  if (!stats.isSymbolicLink()) throw new Error(`Not a link, so it is not removed here: ${link}`);
  try {
    unlinkSync(link);
  } catch {
    rmdirSync(link);
  }
}

function inside(root: string, target: string): boolean {
  const relative = path.relative(root, path.resolve(target));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

/** The first `git` program on PATH, as an absolute path. */
export function findGit(): string | null {
  const names = process.platform === "win32" ? ["git.exe", "git.cmd"] : ["git"];
  for (const folder of (process.env.PATH ?? "").split(path.delimiter)) {
    if (!folder) continue;
    for (const name of names) {
      const candidate = path.join(folder, name);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

/** The names under which a `make-docs` command can be on PATH. */
function makeDocsCommandNames(): string[] {
  return process.platform === "win32" ? ["make-docs", "make-docs.cmd", "make-docs.exe", "make-docs.bat", "make-docs.ps1"] : ["make-docs"];
}

/**
 * Each `make-docs` command that a PATH value reaches and that is not inside `root`. A hook test puts its own
 * command file inside its temporary folder. Every other one is a command that is installed on this computer, and
 * a hook that finds it would run it against the test.
 */
export function foreignMakeDocsOnPath(pathValue: string, root: string): string[] {
  const found: string[] = [];
  for (const folder of pathValue.split(path.delimiter)) {
    if (!folder) continue;
    for (const name of makeDocsCommandNames()) {
      const candidate = path.join(folder, name);
      if (!existsSync(candidate)) continue;
      let real = candidate;
      try { real = realpathSync.native(candidate); } catch { /* The path itself is the answer. */ }
      if (!inside(root, real) || !inside(root, path.resolve(candidate))) found.push(candidate);
    }
  }
  return found;
}

/** The system folders that an app passes to git, with no folder of a package manager and no folder of the person. */
export function systemPathFolders(): string[] {
  if (process.platform !== "win32") return ["/usr/bin", "/bin"];
  const system = process.env.SystemRoot ?? "C:\\Windows";
  return [path.join(system, "System32"), system];
}

/**
 * The PATH of each hook test: one tool folder inside the temporary folder, and the system folders. The tool
 * folder holds only `git` and `node`. On a computer with file modes each one is a small script that starts the
 * real program by its full path, so the folder of the real program is not on PATH. That folder can also hold an
 * installed `make-docs`, and no test may run that one. On Windows the folder of `git` itself stands on PATH,
 * because a program there is found only by its real file, and `node` is a script for the shell that git starts.
 */
export function isolatedToolPath(root: string, gitPath: string): { value: string; toolsDir: string; nodeDir: string } {
  const toolsDir = path.join(root, "tools");
  const nodeDir = path.join(root, "tools-node");
  mkdirSync(toolsDir, { recursive: true });
  mkdirSync(nodeDir, { recursive: true });
  const script = (target: string) => `#!/bin/sh\nexec ${shellQuote(target)} "$@"\n`;
  writeFileSync(path.join(nodeDir, "node"), script(process.execPath), { mode: 0o755 });
  const folders = [toolsDir];
  if (process.platform === "win32") {
    writeFileSync(path.join(nodeDir, "node.cmd"), `@"${process.execPath}" %*\r\n`);
    folders.push(path.dirname(gitPath));
  } else {
    writeFileSync(path.join(toolsDir, "git"), script(gitPath), { mode: 0o755 });
  }
  writeFileSync(path.join(toolsDir, "node"), script(process.execPath), { mode: 0o755 });
  if (process.platform === "win32") writeFileSync(path.join(toolsDir, "node.cmd"), `@"${process.execPath}" %*\r\n`);
  const value = [...folders, ...systemPathFolders()].join(path.delimiter);
  const foreign = foreignMakeDocsOnPath(value, root);
  if (foreign.length > 0) throw new Error(`The PATH of a hook test reaches a make-docs command that the test did not make: ${foreign.join(", ")}`);
  return { value, toolsDir, nodeDir };
}

/** One line for the run log: a fact, the platform, and the git version. The evidence report takes the platform result from it. */
export function recordGitFact(proof: Pick<GitProof, "gitVersion">, fact: string, seen: unknown): void {
  process.stdout.write(`W35-R0-P4-GIT-FACT ${JSON.stringify({ platform: process.platform, git: proof.gitVersion, fact, seen })}\n`);
}

export function createGitProof(prefix = "make-docs-w35-p4-git-"): GitProof {
  const gitPath = findGit();
  if (!gitPath) throw new Error("The git hook proofs need git on PATH.");
  const created = createTempDir(prefix);
  const root = realPath(created);
  const home = path.join(root, "home");
  mkdirSync(home);
  const globalConfig = path.join(root, "global.gitconfig");
  const systemConfig = path.join(root, "system.gitconfig");
  writeFileSync(globalConfig, "");
  writeFileSync(systemConfig, "");
  const log = path.join(root, "hook-runs.log");

  // Drop each git variable of the caller, so a proof that runs inside a git hook cannot reach that repository.
  const env: NodeJS.ProcessEnv = {};
  // Drop the PATH of the caller too. It can hold an installed `make-docs`, and a hook would find and run it.
  for (const [key, value] of Object.entries(process.env)) if (!/^GIT_/i.test(key) && key.toUpperCase() !== "PATH") env[key] = value;
  const tools = isolatedToolPath(root, gitPath);
  Object.assign(env, {
    PATH: tools.value,
    HOME: home,
    USERPROFILE: home,
    XDG_CONFIG_HOME: path.join(home, ".config"),
    GIT_CONFIG_GLOBAL: globalConfig,
    GIT_CONFIG_SYSTEM: systemConfig,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CEILING_DIRECTORIES: root,
    GIT_TERMINAL_PROMPT: "0",
    GIT_ALLOW_PROTOCOL: "file",
    GIT_AUTHOR_NAME: "Proof Author",
    GIT_AUTHOR_EMAIL: "author@example.invalid",
    GIT_COMMITTER_NAME: "Proof Author",
    GIT_COMMITTER_EMAIL: "author@example.invalid",
    GIT_EDITOR: "true",
    GIT_MERGE_AUTOEDIT: "no",
  });

  const checkedPaths = new Set<string>();
  const git: GitProof["git"] = (cwd, args, options = {}) => {
    if (!inside(root, cwd)) throw new Error(`A git hook proof ran git outside its temporary folder: ${cwd}`);
    const runEnv = options.env ?? env;
    const pathKey = Object.keys(runEnv).find((key) => key.toUpperCase() === "PATH");
    const pathValue = pathKey ? runEnv[pathKey] ?? "" : "";
    if (!checkedPaths.has(pathValue)) {
      const foreign = foreignMakeDocsOnPath(pathValue, root);
      if (foreign.length > 0) throw new Error(`A git hook proof would run git with a PATH that reaches a make-docs command that the test did not make: ${foreign.join(", ")}`);
      checkedPaths.add(pathValue);
    }
    const result = spawnSync(gitPath, args, { cwd, env: runEnv, encoding: "utf8" });
    if (result.error) throw result.error;
    const out = { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
    if (out.status !== 0 && !options.allowFailure) throw new Error(`git ${args.join(" ")} ended with status ${out.status} in ${cwd}.\n${out.stdout}\n${out.stderr}`);
    return out;
  };

  const gitVersion = git(root, ["--version"]).stdout.trim().replace(/^git version /, "");

  const folder = (name: string) => {
    const target = path.join(root, name);
    mkdirSync(target, { recursive: true });
    return target;
  };
  const configure = (repo: string) => {
    // Fixed line ends and no signing, so each platform makes the same commits.
    git(repo, ["config", "core.autocrlf", "false"]);
    git(repo, ["config", "commit.gpgsign", "false"]);
  };
  const write: GitProof["write"] = (repo, relative, text) => {
    const target = path.join(repo, ...relative.split("/"));
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, text);
  };
  // A commit goes through `api.git`, so that a helper which wraps that function, to wait for a background
  // process that a hook started, also covers each commit that this helper makes.
  const commit: GitProof["commit"] = (repo, relative, text, message = `Change ${relative}`) => {
    write(repo, relative, text);
    api.git(repo, ["add", "--", relative]);
    api.git(repo, ["commit", "-q", "-m", message]);
  };
  const hooksDir: GitProof["hooksDir"] = (repo) => path.resolve(repo, git(repo, ["rev-parse", "--git-path", "hooks"]).stdout.trim());
  const recorder: GitProof["recorder"] = (name) => [
    "#!/bin/sh",
    "# Make Docs hook proof. It records that this hook ran, and it always exits 0.",
    "gd=$(git rev-parse --absolute-git-dir 2>/dev/null)",
    "st=''",
    `for m in ${GIT_STATE_MARKS.join(" ")}; do`,
    "  if [ -e \"$gd/$m\" ]; then st=\"$st $m\"; fi",
    "done",
    "top=$(git rev-parse --show-toplevel 2>/dev/null)",
    `printf '%s\\t%s\\t%s\\t%s\\t%s\\n' '${name}' "$*" "\${st# }" "$top" "$gd" >> ${shellQuote(log)}`,
    "exit 0",
    "",
  ].join("\n");
  const hook: GitProof["hook"] = (repo, name, text, options = {}) => {
    const directory = hooksDir(repo);
    if (!inside(root, directory)) throw new Error(`A git hook proof found a hooks folder outside its temporary folder: ${directory}`);
    mkdirSync(directory, { recursive: true });
    const target = path.join(directory, name);
    writeFileSync(target, text);
    chmodSync(target, options.executable === false ? 0o644 : 0o755);
    return target;
  };

  const api: GitProof = {
    root,
    env,
    gitPath,
    nodeDir: tools.nodeDir,
    gitVersion,
    globalConfig,
    git,
    folder,
    bare(name) {
      const target = folder(name);
      git(target, ["init", "-q", "--bare", "--initial-branch=main"]);
      return target;
    },
    repo(name) {
      const target = folder(name);
      git(target, ["init", "-q", "--initial-branch=main"]);
      configure(target);
      commit(target, "README.md", "# Proof\n", "First commit");
      return target;
    },
    write,
    commit,
    hooksDir,
    record(repo, hooks = GIT_HOOK_NAMES) {
      for (const name of hooks) hook(repo, name, recorder(name));
    },
    hook,
    recorder,
    runs() {
      if (!existsSync(log)) return [];
      return readFileSync(log, "utf8").split("\n").filter((entry) => entry !== "").map((entry) => {
        const [name, args, state, top, gitDir] = entry.replace(/\r$/, "").split("\t");
        return { hook: name!, args: args ? args.split(" ") : [], state: state ? state.split(" ") : [], top: top ?? "", gitDir: gitDir ?? "" };
      });
    },
    names() {
      return this.runs().map((run) => run.hook);
    },
    clear() {
      rmSync(log, { force: true });
    },
    cleanup() {
      cleanupTempDir(created);
    },
  };
  return api;
}

/** A clone of a local bare repository, with the same fixed config as `repo`. */
export function cloneOf(proof: GitProof, bare: string, name: string, extra: string[] = []): string {
  const target = path.join(proof.root, name);
  proof.git(proof.root, ["clone", "-q", ...extra, bare, target]);
  proof.git(target, ["config", "core.autocrlf", "false"]);
  proof.git(target, ["config", "commit.gpgsign", "false"]);
  return target;
}
