import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  cpSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml, parseDocument as parseYamlDocument } from "yaml";
import {
  COMMAND_TIMEOUT_MS,
  createPackageRunnerEnv,
  formatDuration,
  getSmokeModePlan,
  normalizeTextLineEndings,
  parseSmokePackOptions,
  preflightPackageRunners,
  runObservedCommand,
} from "./lib/smoke-pack-runner.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const cliPackageDir = path.join(repoRoot, "packages", "cli");
let smokeOptions;
try {
  smokeOptions = parseSmokePackOptions(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(error && typeof error.exitCode === "number" ? error.exitCode : 2);
}
const {
  mode,
  verifyDogfood,
  tarballPath: suppliedTarballPath,
  installedPackageRoot: suppliedInstalledPackageRoot,
} = smokeOptions;
const { runLocalChecks, runPackageRunners } = getSmokeModePlan(mode);
const suiteStartedAt = performance.now();
console.log(`[smoke:pack] mode=${mode}`);
if (runPackageRunners) {
  try {
    await preflightPackageRunners({ cwd: repoRoot });
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
const npmHome = mkdtempSync(path.join(os.tmpdir(), "make-docs-npm-home-"));
const packOutputDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-pack-output-"));
// Sandbox global-store root for every direct packed-CLI invocation, so the
// smoke never touches the real `~/.make-docs/` and can assert store behavior.
const storeRoot = mkdtempSync(path.join(os.tmpdir(), "make-docs-store-root-"));
const packedCliEnv = { ...process.env, HOME: npmHome, USERPROFILE: npmHome, CODEX_HOME: path.join(npmHome, ".codex"), CLAUDE_CONFIG_DIR: path.join(npmHome, ".claude"), MAKE_DOCS_HOME: storeRoot };
/** Extra temp directories created by the W18 R11 P6 smokes; removed at exit. */
const auxSmokeDirs = [];

function registerAuxSmokeDir(prefix) {
  const dir = mkdtempSync(path.join(os.tmpdir(), prefix));
  auxSmokeDirs.push(dir);
  return dir;
}
let DatabaseSync;
try {
  ({ DatabaseSync } = await import("node:sqlite"));
} catch {
  throw new Error("Package smoke requires a Node runtime with node:sqlite for mandatory Store state.");
}
const EXPECTED_PACKAGE_NAME = "@brucewaynedecoy/make-docs";
const HUMAN_EXPERIENCE_RESOURCES = [
  {
    type: "contract",
    uri: "make-docs://system/contract/human-experience-contract.md",
    localPath: ".make-docs/system/contracts/human-experience-contract.md",
  },
  {
    type: "reference",
    uri: "make-docs://system/reference/human-experience.md",
    localPath: ".make-docs/system/references/human-experience.md",
  },
];
const PERFORMANCE_EVIDENCE_RESOURCES = [
  {
    type: "contract",
    uri: "make-docs://system/contract/performance-evidence-governance.md",
    localPath: ".make-docs/system/contracts/performance-evidence-governance.md",
  },
  {
    type: "reference",
    uri: "make-docs://system/reference/performance-evidence.md",
    localPath: ".make-docs/system/references/performance-evidence.md",
  },
  {
    type: "prompt",
    uri: "make-docs://system/prompt/performance-coverage.prompt.md",
    localPath: ".make-docs/system/prompts/performance-coverage.prompt.md",
  },
  {
    type: "template",
    uri: "make-docs://system/template/performance-evidence-profile.md",
    localPath: ".make-docs/system/templates/performance-evidence-profile.md",
  },
];
// Independent acceptance table. Project Codex is direct; global Codex has a
// separate native exposure. Do not derive these expected paths from runtime code.
const STANDARD_SKILL_LAYOUTS = {
  project: {
    codex: { canonical: ".agents/skills", native: { codex: ".agents/skills" } },
    "claude-code": { canonical: ".claude/skills", native: { "claude-code": ".claude/skills" } },
    both: { canonical: ".agents/skills", native: { codex: ".agents/skills", "claude-code": ".claude/skills" } },
  },
  global: {
    codex: { canonical: ".agents/skills", native: { codex: ".codex/skills" } },
    "claude-code": { canonical: ".agents/skills", native: { "claude-code": ".claude/skills" } },
    both: { canonical: ".agents/skills", native: { codex: ".codex/skills", "claude-code": ".claude/skills" } },
  },
};


const PACKAGE_RUNNER_SMOKES = [
  {
    name: "npx",
    command: "npx",
    args: (tarballPath, targetDir) => [
      "--yes",
      "--package",
      tarballPath,
      "make-docs",
      "setup",
      "--yes",
      "--codex-method",
      "none",
      "--claude-code-method",
      "none",
      "--target",
      targetDir,
    ],
    envKind: "npm",
  },
  {
    name: "pnpm dlx",
    command: "pnpm",
    args: (tarballPath, targetDir) => [
      "dlx", tarballPath, "setup", "--yes",
      "--codex-method", "none", "--claude-code-method", "none",
      "--target", targetDir,
    ],
    envKind: "pnpm",
  },
  {
    name: "bun x",
    command: "bun",
    args: (tarballPath, targetDir) => [
      "x",
      "--package",
      `file:${tarballPath}`,
      "make-docs",
      "setup",
      "--yes",
      "--codex-method",
      "none",
      "--claude-code-method",
      "none",
      "--target",
      targetDir,
    ],
    envKind: "bun",
  },
];

const RETIRED_READER_ASSET_DEFAULT_PATHS = [
  "docs/assets/archive/AGENTS.md",
  "docs/assets/archive/CLAUDE.md",
  "docs/assets/artifacts/AGENTS.md",
  "docs/assets/artifacts/CLAUDE.md",
  "docs/assets/library/AGENTS.md",
  "docs/assets/library/CLAUDE.md",
  "docs/assets/playbooks/AGENTS.md",
  "docs/assets/playbooks/CLAUDE.md",
  "docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md",
  "docs/assets/playbooks/agent/naive-uat-facilitator.playbook.md",
  "docs/assets/playbooks/user/naive-uat-tester.playbook.md",
];

const ROUTER_HEADING_BY_DIRECTORY = {
  ".": "# Agent Instructions",
  "docs": "# Documentation Router",
  "docs/assets": "# Document Assets Router",
  "docs/designs": "# Designs Router",
  "docs/plans": "# Plans Directory",
  "docs/prd": "# PRD Router",
  "docs/work": "# Work Directory",
  ".make-docs": "# Make Docs System Router",
  ".make-docs/system": "# System Resources Router",
  ".make-docs/system/contracts": "# System Contracts Router",
  ".make-docs/system/prompts": "# System Prompts Router",
  ".make-docs/system/references": "# System References Router",
  ".make-docs/system/templates": "# Templates Router",
};

function getRouterHeading(relativePath) {
  const heading = ROUTER_HEADING_BY_DIRECTORY[path.posix.dirname(relativePath)];
  if (!heading) {
    throw new Error(`Smoke pack has no heading contract for router ${relativePath}.`);
  }
  return heading;
}

// The four lifecycle skills were withdrawn from the shipped registry by the
// D-020 stopgap (they instructed the removed `make-docs operations` surface).
// No install path may produce them until the Q-022 agentics production
// pipeline regenerates them.
const WITHDRAWN_SKILL_PATHS = [
  ".make-docs/agentics/skills/closeout-commit",
  ".make-docs/agentics/skills/closeout-phase",
  ".make-docs/agentics/skills/work-on-phase",
  ".make-docs/agentics/skills/work-on-wave",
  ".claude/skills/closeout-commit",
  ".claude/skills/closeout-phase",
  ".claude/skills/work-on-phase",
  ".claude/skills/work-on-wave",
  ".agents/skills/closeout-commit",
  ".agents/skills/closeout-phase",
  ".agents/skills/work-on-phase",
  ".agents/skills/work-on-wave",
];

const EXPECTED_ALL_SKILLS = [
  "archive-docs",
  "cleanup-docs",
  "decompose-codebase",
  "preflight",
  "factory",
  "human-experience",
  "naive-uat",
];

const LEGACY_SKILL_PATHS = [
  ".claude/skills/archive-docs-archive.md",
  ".claude/skills/archive-docs-staleness-check.md",
  ".claude/skills/archive-docs-deprecate.md",
  ".claude/skills/archive-docs-archive-impact.md",
  ".claude/skills/decompose-codebase.md",
  ".agents/skills/archive-docs-archive.md",
  ".agents/skills/archive-docs-staleness-check.md",
  ".agents/skills/archive-docs-deprecate.md",
  ".agents/skills/archive-docs-archive-impact.md",
  ".agents/skills/decompose-codebase.md",
  ".claude/skill-assets/archive-docs/references/archive-workflow.md",
  ".claude/skill-assets/archive-docs/scripts/trace_relationships.py",
  ".agents/skill-assets/archive-docs/references/archive-workflow.md",
  ".agents/skill-assets/archive-docs/scripts/trace_relationships.py",
];

function npmEnv() {
  const cacheDir = path.join(npmHome, ".npm");
  mkdirSync(cacheDir, { recursive: true });

  return {
    ...process.env,
    HOME: npmHome,
    npm_config_cache: cacheDir,
  };
}

async function runPackageRunnerSmokes(tarballPath) {
  const startedAt = performance.now();
  console.log("[smoke:pack][package-runners] START");
  for (const runner of PACKAGE_RUNNER_SMOKES) {
    await runPackageRunnerSmoke({ runner, tarballPath });
  }
  console.log(`[smoke:pack][package-runners] PASS ${formatDuration(performance.now() - startedAt)}`);
}

async function runPackageRunnerCommand(options) {
  const { runner, action, args, cwd, env } = options;
  const label = `[smoke:pack][${runner.name}][${action}]`;
  console.log(`${label} START`);

  try {
    const result = await runObservedCommand({
      command: runner.command,
      args,
      cwd,
      env,
      timeoutMs: COMMAND_TIMEOUT_MS,
    });
    if (result.stdout && !result.stdout.endsWith("\n")) process.stdout.write("\n");
    if (result.stderr && !result.stderr.endsWith("\n")) process.stderr.write("\n");
    console.log(`${label} PASS ${formatDuration(result.durationMs)}`);
    return result.stdout;
  } catch (error) {
    const durationMs = error && typeof error.durationMs === "number" ? error.durationMs : 0;
    console.error(`${label} FAIL ${formatDuration(durationMs)}`);
    if (error && error.timedOut) {
      throw new Error(
        `Smoke pack ${runner.name} ${action} timed out after ${COMMAND_TIMEOUT_MS} ms.`,
        { cause: error },
      );
    }
    throw error;
  }
}

async function runPackageRunnerSmoke(options) {
  const { runner, tarballPath } = options;
  const runnerStartedAt = performance.now();
  const smokeRoot = mkdtempSync(
    path.join(os.tmpdir(), `make-docs-${runner.envKind}-runner-smoke-`),
  );
  const targetDir = path.join(smokeRoot, "target");
  const workDir = path.join(smokeRoot, "work");
  mkdirSync(targetDir, { recursive: true });
  mkdirSync(workDir, { recursive: true });

  try {
    await runPackageRunnerCommand({
      runner,
      action: "setup",
      args: runner.args(tarballPath, targetDir),
      cwd: workDir,
      env: createPackageRunnerEnv(smokeRoot, runner.envKind),
    });

    const installation = { targetDir, storeRoot: path.join(smokeRoot, "home", ".make-docs") };
    readInstallationLedger(installation);
    assertExists(
      path.join(targetDir, "docs/AGENTS.md"),
      `Smoke pack ${runner.name} install did not produce docs/AGENTS.md.`,
    );
    assertExists(
      path.join(targetDir, ".make-docs/config.yaml"),
      `Smoke pack ${runner.name} install did not declare project identity.`,
    );
    assertManifestPackageName(installation, EXPECTED_PACKAGE_NAME);
    assertManifestSkillFiles(installation, 0);
    assertManifestOmitsProjectConfig(installation);
    assertProviderOnlyDefaultInstall(targetDir, installation);
    // The runner env sandboxes HOME, so the store bootstrap must land under
    // the sandbox home and never under the repository target.
    assertStoreBootstrapAndNoRepoStateWrites(
      path.join(smokeRoot, "home", ".make-docs"),
      targetDir,
      `${runner.name} install`,
    );
    // A package runner has no persistent binary. Verify that its Store has a
    // separate removal choice and that both choices preserve repository bytes.
    const runnerArgs = runner.args(tarballPath, targetDir);
    const commandPrefix = runnerArgs.slice(0, runnerArgs.indexOf("setup"));
    const beforeUninstall = snapshotTree(targetDir);
    const preserveOutput = await runPackageRunnerCommand({
      runner,
      action: "uninstall-preserve-store",
      args: [...commandPrefix, "uninstall", "--yes"],
      cwd: workDir,
      env: createPackageRunnerEnv(smokeRoot, runner.envKind),
    });
    const recognizedRunner = preserveOutput.includes("No persistent make-docs binary is installed");
    if (runner.envKind === "npm" && !recognizedRunner) throw new Error("Smoke pack npx uninstall did not recognize the runner.");
    if (!recognizedRunner) {
      assertOutputContains(preserveOutput, "make-docs will not guess and run a destructive global change.", `Smoke pack ${runner.name} ambiguous uninstall did not refuse safely.`);
    }
    readInstallationLedger(installation);
    if (snapshotTree(targetDir) !== beforeUninstall) throw new Error(`Smoke pack ${runner.name} uninstall changed project files.`);
    const removalOutput = await runPackageRunnerCommand({
      runner,
      action: "uninstall-remove-store",
      args: [...commandPrefix, "uninstall", "--yes", "--remove-store"],
      cwd: workDir,
      env: createPackageRunnerEnv(smokeRoot, runner.envKind),
    });
    if (recognizedRunner) {
      assertOutputContains(removalOutput, `Removed the global store at ${installation.storeRoot}`, `Smoke pack ${runner.name} explicit Store removal did not complete.`);
      assertMissing(installation.storeRoot, `Smoke pack ${runner.name} explicit removal left the Store behind.`);
    } else {
      assertOutputContains(removalOutput, "make-docs will not guess and run a destructive global change.", `Smoke pack ${runner.name} ambiguous explicit removal did not refuse safely.`);
      readInstallationLedger(installation);
    }
    if (snapshotTree(targetDir) !== beforeUninstall) throw new Error(`Smoke pack ${runner.name} Store removal changed project files.`);
    console.log(`[smoke:pack][${runner.name}] PASS ${formatDuration(performance.now() - runnerStartedAt)}`);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      throw new Error(
        `Smoke pack package-runner validation requires ${runner.command} for ${runner.name}.`,
      );
    }

    throw error;
  } finally {
    rmSync(smokeRoot, { recursive: true, force: true });
  }
}

let tarballPath;
let ownsTarball = false;
if (suppliedTarballPath) {
  tarballPath = path.resolve(suppliedTarballPath);
  if (!existsSync(tarballPath)) {
    throw new Error(`Smoke-pack candidate does not exist: ${tarballPath}`);
  }
  console.log(`[smoke:pack] candidate=${tarballPath}`);
} else {
  execFileSync("npm", ["run", "prepack"], {
    cwd: cliPackageDir,
    stdio: "inherit",
    env: npmEnv(),
  });

  const packOutput = execFileSync(
    "npm",
    ["pack", "--json", "--ignore-scripts", "--pack-destination", packOutputDir],
    {
      cwd: cliPackageDir,
      encoding: "utf8",
      env: npmEnv(),
    },
  );
  const [{ filename }] = JSON.parse(packOutput);
  tarballPath = path.join(packOutputDir, filename);
  ownsTarball = true;
}

const unpackDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-pack-"));
const targetDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-smoke-"));

function runLocalPackedSmoke() {
  execFileSync("tar", ["-xzf", tarballPath, "-C", unpackDir], { stdio: "inherit" });
  const packageRoot = path.join(unpackDir, "package");
  const packedPackage = readPackedPackage(packageRoot);
  const { expectedSkillPaths: EXPECTED_SKILL_PATHS, nativePayloadPaths: EXPECTED_DUPLICATED_SKILL_PAYLOAD_PATHS } = readPackedSkillExpectations(packageRoot);
  assertOnlyMakeDocsBin(packedPackage);
  assertPackedRouterGuidanceParity(packageRoot);
  assertPackedReaderFacingTemplate(packageRoot);
  assertNoRetiredConformanceAssetsInTarball(packageRoot);
  assertMissing(
    path.join(packageRoot, "template/.make-docs/config.yaml"),
    "Packed template should not ship a default project config file.",
  );
  const executionPackageRoot = suppliedInstalledPackageRoot
    ? path.resolve(suppliedInstalledPackageRoot)
    : packageRoot;
  const executionPackage = readPackedPackage(executionPackageRoot);
  assertOnlyMakeDocsBin(executionPackage);
  if (
    executionPackage.name !== packedPackage.name ||
    executionPackage.version !== packedPackage.version
  ) {
    throw new Error("Installed package identity does not match the recorded tarball identity.");
  }
  if (suppliedInstalledPackageRoot) {
    const installedRoot = realpathSync(executionPackageRoot);
    const sourceRoot = realpathSync(repoRoot);
    if (installedRoot === sourceRoot || installedRoot.startsWith(`${sourceRoot}${path.sep}`)) {
      throw new Error("P6 installed-package execution root is inside the source checkout.");
    }
  }
  const packedMakeDocs = path.join(executionPackageRoot, executionPackage.bin["make-docs"]);
  assertPackedCliIdentity(executionPackageRoot, executionPackage, packedMakeDocs);
  const skillsHelp = execFileSync("node", [packedMakeDocs, "setup", "skills", "--help"], {
    encoding: "utf8",
    env: packedCliEnv,
  });
  assertOutputContains(skillsHelp, "make-docs setup skills", "Smoke pack skills help omitted usage.");
  assertOutputContains(skillsHelp, "--remove", "Smoke pack skills help omitted removal option.");
  assertOutputContains(
    skillsHelp,
    "--skill-scope project|global",
    "Smoke pack skills help omitted skill scope option.",
  );
  const installation = { targetDir, storeRoot };
  {
    const skillsDryRun = execFileSync(
      "node",
      [packedMakeDocs, "setup", "skills", "--dry-run", "--target", targetDir],
      { encoding: "utf8", env: packedCliEnv },
    );
    assertOutputContains(
      skillsDryRun,
      "make-docs setup skills plan",
      "Smoke pack skills dry run omitted the skills plan title.",
    );
    assertOutputContains(
      skillsDryRun,
      "Dry run complete.",
      "Smoke pack skills dry run did not finish cleanly.",
    );
    assertMissing(
      path.join(targetDir, ".make-docs/manifest.json"),
      "Smoke pack skills dry run created a manifest.",
    );

    execFileSync(
      "node",
      [packedMakeDocs, "setup", "--yes", "--codex-method", "none", "--claude-code-method", "none", "--target", targetDir],
      { stdio: "inherit", env: packedCliEnv },
    );
    readInstallationLedger(installation);
    assertExists(
      path.join(targetDir, ".make-docs/config.yaml"),
      "Smoke pack setup install did not declare project identity.",
    );
    assertExists(
      path.join(targetDir, "docs/AGENTS.md"),
      "Smoke pack setup install did not produce docs/AGENTS.md.",
    );
    assertStoreBootstrapAndNoRepoStateWrites(storeRoot, targetDir, "setup install");
    assertPackedStateStatus(packedMakeDocs, installation, "ready");

    // Bare invocation, installed context (PRD 39 R-BARE-1 / W18 R11 P6 t5):
    // status plus guidance, never a sync.
    const bareInstalled = execFileSync(
      "node",
      [packedMakeDocs, "--target", targetDir],
      { encoding: "utf8", env: packedCliEnv },
    );
    assertOutputContains(
      bareInstalled,
      `make-docs install detected in ${targetDir}`,
      "Smoke pack bare invocation (installed) omitted the install status headline.",
    );
    assertOutputContains(
      bareInstalled,
      "Bare `make-docs` never syncs an existing install.",
      "Smoke pack bare invocation (installed) omitted the never-syncs guidance.",
    );
    assertOutputContains(
      bareInstalled,
      `Package: ${EXPECTED_PACKAGE_NAME}@`,
      "Smoke pack bare invocation (installed) omitted the installed package line.",
    );

    const providerOnlyRouterPaths = assertProviderOnlyDefaultInstall(targetDir, installation);
    assertPackedInstructionTemplate(packageRoot, providerOnlyRouterPaths);
    assertManifestOmitsProjectConfig(installation);
    assertPackedHumanExperienceResources(packageRoot, packedMakeDocs, true);
    assertPackedHumanExperienceLegacyUpdate(packageRoot, packedMakeDocs, installation);

    execFileSync(
      "node",
      [packedMakeDocs, "setup", "--yes", "--codex-method", "none", "--claude-code-method", "none", "--target", targetDir],
      { stdio: "inherit", env: packedCliEnv },
    );
    assertMissing(
      path.join(targetDir, ".make-docs/conflicts"),
      "Smoke pack setup sync staged conflicts for an unchanged install.",
    );
    assertManifestPackageName(installation, EXPECTED_PACKAGE_NAME);
    assertManifestSkillFiles(installation, 0);
    assertPackedStateStatus(packedMakeDocs, installation, "ready");
    assertPackedHumanExperienceResources(packageRoot, packedMakeDocs, false);
    assertMissing(
      path.join(targetDir, ".claude/skills"),
      "Smoke pack setup install should not produce Claude Code skill files.",
    );
    assertMissing(
      path.join(targetDir, ".agents/skills"),
      "Smoke pack setup install should not produce Codex skill files.",
    );
    assertMissing(
      path.join(targetDir, ".make-docs/agentics"),
      "Smoke pack setup must not produce a private Skill layer.",
    );

    execFileSync(
      "node",
      [packedMakeDocs, "setup", "skills", "--yes", "--selected-skills", "all", "--target", targetDir],
      { stdio: "inherit", env: packedCliEnv },
    );
  }

  readInstallationLedger(installation);
  assertManifestPackageName(installation, EXPECTED_PACKAGE_NAME);
  assertManifestOmitsProjectConfig(installation);
  assertPackedStateStatus(packedMakeDocs, installation, "ready");
  assertExists(
    path.join(targetDir, "docs/AGENTS.md"),
    "Smoke pack install did not produce docs/AGENTS.md.",
  );

  assertManifestContainsSkillFiles(installation, EXPECTED_SKILL_PATHS);
  assertManifestOmitsSkillFilePrefixes(installation, WITHDRAWN_SKILL_PATHS);
  assertManifestOmitsSkillFiles(installation, EXPECTED_DUPLICATED_SKILL_PAYLOAD_PATHS);
  assertMissing(path.join(targetDir, ".make-docs/agentics"), "Smoke pack must not create a private Skill layer.");
  assertMissing(path.join(targetDir, ".codex/skills"), "Project Codex must use .agents/skills directly.");
  assertManifestSkillFiles(installation, EXPECTED_SKILL_PATHS.length);
  for (const skill of EXPECTED_ALL_SKILLS) {
    const canonical = path.join(targetDir, ".agents/skills", skill);
    if (!lstatSync(canonical).isDirectory() || lstatSync(canonical).isSymbolicLink()) throw new Error(`Canonical Skill payload must be a real directory: ${canonical}`);
    const native = path.join(targetDir, ".claude/skills", skill);
    if (lstatSync(native).isSymbolicLink() && path.resolve(path.dirname(native), readlinkSync(native)) !== canonical) throw new Error(`Native Skill link has the wrong target: ${native}`);
  }
  assertDirectoryEntries(path.join(targetDir, ".claude/skills"), EXPECTED_ALL_SKILLS);
  assertDirectoryEntries(path.join(targetDir, ".agents/skills"), EXPECTED_ALL_SKILLS);
  assertExists(
    path.join(targetDir, ".make-docs/config.yaml"),
    "Smoke pack skills sync lost declarative project identity.",
  );

  for (const relativePath of EXPECTED_SKILL_PATHS) {
    assertExists(
      path.join(targetDir, relativePath),
      `Smoke pack install did not produce ${relativePath}.`,
    );
  }
  for (const relativePath of WITHDRAWN_SKILL_PATHS) {
    assertMissing(
      path.join(targetDir, relativePath),
      `Smoke pack install should not produce withdrawn lifecycle skill path ${relativePath}.`,
    );
  }
  const skillsRemoveDryRun = execFileSync(
    "node",
    [packedMakeDocs, "setup", "skills", "--remove", "--dry-run", "--target", targetDir],
    { encoding: "utf8", env: packedCliEnv },
  );
  assertOutputContains(
    skillsRemoveDryRun,
    "make-docs setup skills removal plan",
    "Smoke pack skills removal dry run omitted the removal plan title.",
  );
  assertOutputContains(
    skillsRemoveDryRun,
    "Removal scope: all manifest-tracked skill files",
    "Smoke pack skills removal dry run omitted the removal scope.",
  );
  assertExists(
    path.join(targetDir, ".claude/skills/archive-docs/SKILL.md"),
    "Smoke pack skills removal dry run removed Claude Code skill files.",
  );
  assertExists(
    path.join(targetDir, ".agents/skills/archive-docs/SKILL.md"),
    "Smoke pack skills removal dry run removed Codex skill files.",
  );

  assertExists(
    path.join(targetDir, ".claude/skills/decompose-codebase/SKILL.md"),
    "Smoke pack install did not expose the Claude Code decompose-codebase skill.",
  );
  assertExists(
    path.join(targetDir, ".agents/skills/decompose-codebase/SKILL.md"),
    "Smoke pack install did not expose the Codex decompose-codebase skill.",
  );
  assertMissing(
    path.join(targetDir, ".claude/skill-assets"),
    "Smoke pack install should not produce legacy .claude/skill-assets directory.",
  );
  assertMissing(
    path.join(targetDir, ".agents/skill-assets"),
    "Smoke pack install should not produce legacy .agents/skill-assets directory.",
  );

  for (const relativePath of LEGACY_SKILL_PATHS) {
    assertMissing(
      path.join(targetDir, relativePath),
      `Smoke pack install left legacy skill artifact ${relativePath}.`,
    );
  }

  const customFilePath = path.join(targetDir, ".make-docs/system/templates/custom-smoke.md");
  const customConfigPath = path.join(targetDir, ".make-docs/config.yaml");
  mkdirSync(path.dirname(customFilePath), { recursive: true });
  writeFileSync(customFilePath, "preserve this unmanaged smoke fixture\n", "utf8");
  const customConfig = parseYamlDocument(readFileSync(customConfigPath, "utf8"));
  customConfig.setIn(["labels", "documentKinds", "design"], "Idea");
  writeFileSync(customConfigPath, customConfig.toString(), "utf8");
  const customReaderAssetPaths = [
    "docs/assets/artifacts/custom-source/preserve.md",
    "docs/assets/archive/history/custom-history.md",
    "docs/assets/library/custom-persona/preserve.md",
    "docs/assets/playbooks/custom-persona/preserve.md",
  ];
  for (const relativePath of customReaderAssetPaths) {
    const filePath = path.join(targetDir, relativePath);
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, "preserve this unmanaged reader-facing fixture\n", "utf8");
  }
  const legacyBackupFile = path.join(targetDir, ".backup/2026-04-17/AGENTS.md");
  mkdirSync(path.dirname(legacyBackupFile), { recursive: true });
  writeFileSync(legacyBackupFile, "legacy backup evidence\n", "utf8");

  execFileSync(
    "node",
    [packedMakeDocs, "setup", "backup", "--yes", "--target", targetDir],
    { stdio: "inherit", env: packedCliEnv },
  );

  const backupRoot = path.join(targetDir, ".make-docs/backup");
  const backupDir = getOnlyBackupDirectory(backupRoot);
  assertExists(path.join(backupDir, "AGENTS.md"), "Smoke pack backup did not copy AGENTS.md.");
  assertMissing(
    path.join(backupDir, ".make-docs/manifest.json"),
    "Smoke pack backup generated a project-local operational manifest.",
  );
  assertStoredOperation(installation, "setup.backup", path.relative(targetDir, path.join(backupDir, "AGENTS.md")));

  // PRD 38 managed-ownership proof (D-026 successor): capture the complete
  // Store-owned set before removal. The removed project manifest must not be
  // the only place where this ownership evidence exists.
  const managedPathsBeforeRemoval = Object.keys(readInstallationLedger(installation).files ?? {}).sort();
  for (const requiredManagedPath of ["AGENTS.md", "CLAUDE.md", "docs/AGENTS.md", "docs/CLAUDE.md"]) {
    if (!managedPathsBeforeRemoval.includes(requiredManagedPath)) {
      throw new Error(`Smoke pack Store ledger omitted managed path ${requiredManagedPath} before removal.`);
    }
  }

  execFileSync(
    "node",
    [packedMakeDocs, "setup", "remove", "--yes", "--target", targetDir],
    { stdio: "inherit", env: packedCliEnv },
  );

  assertMissing(path.join(targetDir, "AGENTS.md"), "Smoke pack setup remove left AGENTS.md behind.");
  assertMissing(path.join(targetDir, "CLAUDE.md"), "Smoke pack setup remove left CLAUDE.md behind.");
  assertMissing(
    path.join(targetDir, ".make-docs/manifest.json"),
    "Smoke pack setup remove left the make-docs manifest behind.",
  );
  for (const relativePath of managedPathsBeforeRemoval) {
    assertMissing(
      path.join(targetDir, relativePath),
      `Smoke pack setup remove left Store-owned managed file ${relativePath} behind.`,
    );
  }
  for (const relativePath of EXPECTED_SKILL_PATHS) {
    assertMissing(
      path.join(targetDir, relativePath),
      `Smoke pack setup remove left managed skill artifact ${relativePath} behind.`,
    );
  }
  assertExists(customFilePath, "Smoke pack setup remove removed an unmanaged custom file.");
  assertExists(customConfigPath, "Smoke pack setup remove removed project-owned config.");
  assertMissing(
    path.join(backupDir, ".make-docs/config.yaml"),
    "Smoke pack backup copied project-owned config as managed backup content.",
  );
  for (const relativePath of customReaderAssetPaths) {
    assertExists(
      path.join(targetDir, relativePath),
      `Smoke pack setup remove removed unmanaged reader-facing asset ${relativePath}.`,
    );
  }
  assertExists(backupRoot, "Smoke pack setup remove removed the .make-docs/backup directory.");
  assertExists(path.join(backupDir, "AGENTS.md"), "Smoke pack setup remove modified the backup tree.");
  assertExists(legacyBackupFile, "Smoke pack setup remove removed the legacy .backup directory.");
  assertPackedStateStatus(packedMakeDocs, installation, "unregistered");
  inspectStore(installation, (db, checkout) => {
    if (db.prepare("SELECT 1 FROM installation_ledgers WHERE checkout_id = ?").get(checkout.checkout_id)) {
      throw new Error("Smoke pack setup remove left applied ownership in the Store.");
    }
    if (!db.prepare("SELECT 1 FROM installation_operations WHERE checkout_id = ? AND status = 'completed'").get(checkout.checkout_id)) {
      throw new Error("Smoke pack setup remove erased durable operation history.");
    }
  });
  assertNoProjectOperationState(targetDir, "setup remove");
  assertOperationPayloads(installation);

  // Across every packed-CLI operation above (installs, skills, backup,
  // uninstall), operational state stayed in the sandboxed global store and no
  // run-state landed under the repository (PRD 38 R-BND-2, R-TEST-1).
  assertMissing(
    path.join(targetDir, ".make-docs/runs"),
    "Smoke pack run left work-lifecycle run state under the repository.",
  );
  assertExists(
    path.join(storeRoot, "store.db"),
    "Smoke pack run lost the global Store database.",
  );

  // ---- W18 R11 P6 (t5): five-command-tree spellings through the packed
  // tarball — bare invocation, retired route refusal, update, and uninstall. Every invocation carries
  // the sandboxed MAKE_DOCS_HOME so the real ~/.make-docs is never touched.

  // Bare invocation, fresh context: guidance only, no writes, non-TTY safe.
  const bareFreshDir = registerAuxSmokeDir("make-docs-bare-fresh-");
  const bareFresh = execFileSync(
    "node",
    [packedMakeDocs, "--target", bareFreshDir],
    { encoding: "utf8", env: packedCliEnv },
  );
  assertOutputContains(
    bareFresh,
    `No make-docs install was detected in ${bareFreshDir}`,
    "Smoke pack bare invocation (fresh) omitted the no-install detection line.",
  );
  assertOutputContains(
    bareFresh,
    "Run `make-docs setup` (interactive) or `make-docs setup --yes` (non-interactive) to install.",
    "Smoke pack bare invocation (fresh) omitted the setup guidance.",
  );
  assertMissing(
    path.join(bareFreshDir, ".make-docs"),
    "Smoke pack bare invocation (fresh) wrote into the target directory.",
  );

  // Retired workflow entry points must fail in the packed CLI.
  const runFixtureDir = registerAuxSmokeDir("make-docs-run-fixture-");
  writeLegacyContentFixture(runFixtureDir);
  for (const args of [["run", "playbook", "status"], ["run", "package", "plan"], ["run", "protocol", "list"]]) {
    const refusal = runPackedCliExpectingFailure(packedMakeDocs, [...args, "--repo-root", runFixtureDir]);
    assertOutputContains(refusal.stderr, "Unknown make-docs run operation", "Packed CLI did not reject a retired operation.");
  }

  // `update`: the packed direct-node invocation matches no persistent-install
  // pattern, so the command reports without executing anything and exits 0.
  const updateTargetDir = registerAuxSmokeDir("make-docs-update-target-");
  const updateOutput = execFileSync(
    "node",
    [packedMakeDocs, "update", "--target", updateTargetDir],
    { encoding: "utf8", env: packedCliEnv },
  );
  assertOutputContains(
    updateOutput,
    `Global store at ${storeRoot}`,
    "Smoke pack update did not report the sandboxed global-store bootstrap.",
  );
  assertOutputContains(
    updateOutput,
    "Could not determine which install manager owns the make-docs binary",
    "Smoke pack update did not report ambiguous install ownership.",
  );
  assertOutputContains(
    updateOutput,
    `Affected store path: ${storeRoot}`,
    "Smoke pack update did not name the affected store path.",
  );
  assertOutputExcludes(
    updateOutput,
    "Update delegated",
    "Smoke pack update executed a package-manager delegation from a packed invocation.",
  );

  // `uninstall` without --yes in a non-TTY run refuses and removes nothing.
  const uninstallRefusal = execFileSync(
    "node",
    [packedMakeDocs, "uninstall"],
    { encoding: "utf8", env: packedCliEnv },
  );
  assertOutputContains(
    uninstallRefusal,
    "Uninstall confirmation requires a TTY. Re-run with `make-docs uninstall --yes`",
    "Smoke pack uninstall did not refuse without confirmation in a non-TTY run.",
  );
  assertOutputContains(
    uninstallRefusal,
    "Nothing was removed.",
    "Smoke pack uninstall refusal did not report that nothing was removed.",
  );
  assertExists(
    path.join(storeRoot, "store.db"),
    "Smoke pack uninstall refusal removed the sandboxed Store.",
  );

  // `uninstall --yes` preserves the Store. Ambiguous binary ownership never
  // grants permission to remove it, even with an explicit Store choice.
  const repoContentBeforeUninstall = snapshotTree(targetDir);
  const legacyContentBeforeUninstall = snapshotTree(runFixtureDir);
  const uninstallOutput = execFileSync(
    "node",
    [packedMakeDocs, "uninstall", "--yes"],
    { encoding: "utf8", env: packedCliEnv },
  );
  assertOutputContains(
    uninstallOutput,
    `The global Store is preserved at ${storeRoot}.`,
    "Smoke pack uninstall --yes did not preserve the sandboxed Store.",
  );
  assertOutputContains(
    uninstallOutput,
    "make-docs will not guess and run a destructive global change.",
    "Smoke pack uninstall --yes guessed at ambiguous binary ownership.",
  );
  assertExists(path.join(storeRoot, "store.db"), "Smoke pack uninstall --yes removed the sandboxed Store.");
  const ambiguousRemoval = execFileSync("node", [packedMakeDocs, "uninstall", "--yes", "--remove-store"], {
    encoding: "utf8", env: packedCliEnv,
  });
  assertOutputContains(ambiguousRemoval, "make-docs will not guess and run a destructive global change.", "Smoke pack ambiguous explicit removal guessed binary ownership.");
  assertExists(path.join(storeRoot, "store.db"), "Smoke pack ambiguous binary removal deleted the Store.");
  if (snapshotTree(targetDir) !== repoContentBeforeUninstall || snapshotTree(runFixtureDir) !== legacyContentBeforeUninstall) {
    throw new Error("Smoke pack uninstall --yes modified repository content.");
  }
  assertExists(
    path.join(runFixtureDir, "docs/assets/playbooks/user/run-stack.md"),
    "Smoke pack uninstall --yes removed playbook fixture repository content.",
  );
}

const originalWorkingDirectory = process.cwd();
if (suppliedInstalledPackageRoot) process.chdir(npmHome);
try {
  if (runLocalChecks) {
    const localStartedAt = performance.now();
    console.log("[smoke:pack][local] START");
    runLocalPackedSmoke();
    console.log(`[smoke:pack][local] PASS ${formatDuration(performance.now() - localStartedAt)}`);
  }
  if (runPackageRunners) await runPackageRunnerSmokes(tarballPath);
  console.log(`[smoke:pack] PASS mode=${mode} ${formatDuration(performance.now() - suiteStartedAt)}`);
} finally {
  if (process.cwd() !== originalWorkingDirectory) process.chdir(originalWorkingDirectory);
  for (const dir of auxSmokeDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
  rmSync(unpackDir, { recursive: true, force: true });
  rmSync(targetDir, { recursive: true, force: true });
  rmSync(packOutputDir, { recursive: true, force: true });
  rmSync(npmHome, { recursive: true, force: true });
  rmSync(storeRoot, { recursive: true, force: true });
  if (ownsTarball) rmSync(tarballPath, { force: true });
}

function readPackedPackage(packageRoot) {
  return JSON.parse(readFileSync(path.join(packageRoot, "package.json"), "utf8"));
}

function assertOnlyMakeDocsBin(packageJson) {
  const bin = packageJson.bin;
  if (!bin || typeof bin !== "object" || Array.isArray(bin)) {
    throw new Error("Packed package does not expose a bin map.");
  }

  const binNames = Object.keys(bin).sort();
  if (binNames.length !== 1 || binNames[0] !== "make-docs") {
    throw new Error(`Packed package exposed unexpected bins: ${binNames.join(", ") || "(none)"}.`);
  }

  if (bin["make-docs"] !== "./dist/index.js" && bin["make-docs"] !== "dist/index.js") {
    throw new Error(`Packed make-docs bin points at ${bin["make-docs"]}.`);
  }
}

/**
 * PRDs 10 and 16 package identity proof (D-027 successor): execute the exact
 * bin extracted from this tarball. A matching command found on PATH is not
 * evidence about the candidate package.
 */
function assertPackedCliIdentity(packageRoot, packageJson, packedMakeDocs) {
  if (packageJson.name !== EXPECTED_PACKAGE_NAME) {
    throw new Error(`Packed package name was ${packageJson.name}, expected ${EXPECTED_PACKAGE_NAME}.`);
  }
  const resolvedPackageRoot = realpathSync(packageRoot);
  const resolvedPackedMakeDocs = realpathSync(packedMakeDocs);
  if (
    resolvedPackedMakeDocs !== resolvedPackageRoot &&
    !resolvedPackedMakeDocs.startsWith(`${resolvedPackageRoot}${path.sep}`)
  ) {
    throw new Error(`Packed make-docs bin resolved outside the extracted package: ${resolvedPackedMakeDocs}.`);
  }
  const actualVersion = execFileSync(process.execPath, [resolvedPackedMakeDocs, "--version"], {
    encoding: "utf8",
    env: packedCliEnv,
  }).trim();
  if (actualVersion !== packageJson.version) {
    throw new Error(
      `Packed make-docs identity mismatch: package.json is ${packageJson.version}, ` +
        `but the extracted CLI reports ${actualVersion || "(empty)"}.`,
    );
  }
}

function assertManifestPackageName(installation, expectedPackageName) {
  const manifest = readInstallationLedger(installation);
  if (manifest.packageName !== expectedPackageName) {
    throw new Error(
      `Smoke pack manifest packageName was ${manifest.packageName}, expected ${expectedPackageName}.`,
    );
  }
}

function assertManifestSkillFiles(installation, expectedCount) {
  const manifest = readInstallationLedger(installation);
  const skillFiles = Array.isArray(manifest.skillFiles) ? manifest.skillFiles : [];

  if (skillFiles.length !== expectedCount) {
    throw new Error(
      `Smoke pack manifest tracked ${skillFiles.length} skill files, expected ${expectedCount}.`,
    );
  }
}

function assertManifestContainsSkillFiles(installation, expectedPaths) {
  const manifest = readInstallationLedger(installation);
  const skillFiles = Array.isArray(manifest.skillFiles) ? manifest.skillFiles : [];

  for (const expectedPath of expectedPaths) {
    if (!skillFiles.includes(expectedPath)) {
      throw new Error(`Smoke pack manifest did not track skill file ${expectedPath}.`);
    }
  }
}

function assertManifestOmitsSkillFiles(installation, expectedPaths) {
  const manifest = readInstallationLedger(installation);
  const skillFiles = Array.isArray(manifest.skillFiles) ? manifest.skillFiles : [];

  for (const expectedPath of expectedPaths) {
    if (skillFiles.includes(expectedPath)) {
      throw new Error(`Smoke pack manifest unexpectedly tracked skill file ${expectedPath}.`);
    }
  }
}

function assertManifestOmitsSkillFilePrefixes(installation, prefixes) {
  const manifest = readInstallationLedger(installation);
  const skillFiles = Array.isArray(manifest.skillFiles) ? manifest.skillFiles : [];

  for (const prefix of prefixes) {
    const tracked = skillFiles.find(
      (skillFile) => skillFile === prefix || skillFile.startsWith(`${prefix}/`),
    );
    if (tracked) {
      throw new Error(
        `Smoke pack manifest unexpectedly tracked withdrawn skill file ${tracked}.`,
      );
    }
  }
}

function assertProviderOnlyDefaultInstall(targetDir, installation) {
  const manifest = readInstallationLedger(installation);
  const files = manifest.files && typeof manifest.files === "object" ? manifest.files : {};
  const trackedPaths = Object.keys(files).sort();

  if (manifest.schemaVersion !== 4) {
    throw new Error(`Smoke pack provider-only manifest used schema ${manifest.schemaVersion}, expected 4.`);
  }

  const routerOwnership = manifest.routerOwnership;
  const expectedPaths = Object.keys(routerOwnership?.routers ?? {}).sort();
  if (
    routerOwnership?.operationLineage !== "W19 R1 P4" ||
    JSON.stringify(routerOwnership.configuredHarnesses) !==
      JSON.stringify(["claude-code", "codex"]) ||
    expectedPaths.length !== 24
  ) {
    throw new Error("Smoke pack provider-only manifest has invalid router ownership evidence.");
  }
  if (JSON.stringify(trackedPaths) !== JSON.stringify(expectedPaths)) {
    throw new Error(
      `Smoke pack provider-only setup tracked ${trackedPaths.join(", ") || "(none)"}; ` +
        `schema-4 router proof requires ${expectedPaths.join(", ")}.`,
    );
  }

  for (const expectedPath of expectedPaths) {
    const entry = files[expectedPath];
    const harness = expectedPath.endsWith("AGENTS.md") ? "codex" : "claude-code";
    const instructionKind = harness === "codex" ? "AGENTS.md" : "CLAUDE.md";
    const expectedSourceId = `router:${harness}:${expectedPath}`;
    const ownershipEntry = routerOwnership.routers[expectedPath];
    if (!entry) {
      throw new Error(`Smoke pack provider-only manifest did not track router ${expectedPath}.`);
    }
    if (
      entry.sourceId !== expectedSourceId ||
      entry.ownershipClass !== "managed-block" ||
      !/^[a-f0-9]{64}$/.test(entry.hash ?? "") ||
      ownershipEntry?.relativePath !== expectedPath ||
      ownershipEntry?.harness !== harness ||
      ownershipEntry?.instructionKind !== instructionKind ||
      ownershipEntry?.routerClass !== "bootstrap" ||
      ownershipEntry?.sourceId !== expectedSourceId
    ) {
      throw new Error(
        `Smoke pack provider-only manifest has invalid router evidence for ${expectedPath}.`,
      );
    }
  }

  const projection = manifest.resourceProjection;
  const provider = projection?.provider;
  if (
    !projection ||
    projection.selectedTypes !== undefined ||
    !projection.resources ||
    Object.keys(projection.resources).length !== 0 ||
    !Array.isArray(manifest.selections?.resourceProjection) ||
    manifest.selections.resourceProjection.length !== 0 ||
    provider !== undefined
  ) {
    throw new Error("Smoke pack provider-only manifest has invalid desired selection or applied projection evidence.");
  }

  assertDirectoryEntries(targetDir, [".make-docs", "AGENTS.md", "CLAUDE.md", "docs"]);
  assertDirectoryEntries(path.join(targetDir, ".make-docs"), ["AGENTS.md", "CLAUDE.md", "backup", "config.yaml", "system"]);
  assertDirectoryEntries(path.join(targetDir, ".make-docs/backup"), ["operations"]);
  assertNoProjectOperationState(targetDir, "provider-only install");
  assertDirectoryEntries(path.join(targetDir, ".make-docs/system"), ["AGENTS.md", "CLAUDE.md", "contracts", "prompts", "references", "templates"]);
  for (const type of ["contracts", "prompts", "references", "templates"]) {
    assertDirectoryEntries(path.join(targetDir, ".make-docs/system", type), ["AGENTS.md", "CLAUDE.md"]);
  }
  assertDirectoryEntries(path.join(targetDir, "docs"), [
    "AGENTS.md",
    "CLAUDE.md",
    "designs",
    "plans",
    "prd",
    "work",
  ]);

  assertMissing(path.join(targetDir, "docs/assets"), "Fresh setup created the on-demand assets root.");
  for (const relativePath of expectedPaths) {
    const content = readFileSync(path.join(targetDir, relativePath), "utf8");
    assertOutputContains(
      content,
      "<!-- make-docs:begin -->",
      `Smoke pack provider-only router ${relativePath} omitted its managed block.`,
    );
    assertOutputContains(
      content,
      getRouterHeading(relativePath),
      `Smoke pack provider-only router ${relativePath} omitted its title.`,
    );
    assertOutputContains(
      content,
      "make-docs resource read",
      `Smoke pack provider-only router ${relativePath} omitted fallback guidance.`,
    );
  }
  assertOutputContains(
    readFileSync(path.join(targetDir, "docs/AGENTS.md"), "utf8"),
    "docs/designs/",
    "Smoke pack provider-only documentation router omitted full routing duties.",
  );
  return expectedPaths;
}

function assertManifestOmitsProjectConfig(installation) {
  const manifest = readInstallationLedger(installation);
  const files = manifest.files && typeof manifest.files === "object" ? manifest.files : {};
  const assets =
    manifest.systemAssetMaterialization?.assets &&
    typeof manifest.systemAssetMaterialization.assets === "object"
      ? manifest.systemAssetMaterialization.assets
      : {};

  if (files[".make-docs/config.yaml"]) {
    throw new Error("Smoke pack manifest tracked project config as a managed file.");
  }

  if (assets[".make-docs/config.yaml"]) {
    throw new Error("Smoke pack manifest tracked project config as a system asset.");
  }
}

function assertPackedInstructionTemplate(packageRoot, routerPaths) {
  for (const relativePath of routerPaths) {
    const content = readFileSync(path.join(packageRoot, "template", relativePath), "utf8");
    assertOutputContains(
      content,
      "<!-- make-docs:begin -->",
      `Packed thin router ${relativePath} omitted the managed block marker.`,
    );
    assertOutputContains(
      content,
      getRouterHeading(relativePath),
      `Packed thin router ${relativePath} omitted its title.`,
    );
    assertOutputContains(
      content,
      "make-docs resource read",
      `Packed thin router ${relativePath} omitted fallback guidance.`,
    );
  }
}

function assertPackedRouterGuidanceParity(packageRoot) {
  // Package proof precedes live transfer. Upstream is always the package
  // authority; installed parity is a separate, explicit post-transfer check.
  for (const name of ["AGENTS.md", "CLAUDE.md"]) {
    const packedPath = path.join(packageRoot, "template/.make-docs", name);
    const upstreamPath = path.join(repoRoot, "packages/docs/template/.make-docs", name);
    const packed = normalizeTextLineEndings(readFileSync(packedPath, "utf8"));
    const upstream = normalizeTextLineEndings(readFileSync(upstreamPath, "utf8"));
    if (packed !== upstream) {
      throw new Error(
        `Packed template/.make-docs/${name} does not match its upstream source.`,
      );
    }
    const dogfood = verifyDogfood
      ? normalizeTextLineEndings(readFileSync(path.join(repoRoot, ".make-docs", name), "utf8"))
      : null;
    if (verifyDogfood && packed !== dogfood) {
      throw new Error(`Packed template/.make-docs/${name} does not match the dogfood .make-docs/${name}.`);
    }
    assertOutputContains(
      packed,
      "make-docs resource read",
      `Packed .make-docs/${name} omitted resource fallback guidance.`,
    );
  }
  console.log(verifyDogfood
    ? "Packed upstream and installed dogfood router parity passed."
    : "Packed upstream router parity passed. Installed parity requires a later --verify-dogfood run.");
}

function assertPackedHumanExperienceResources(packageRoot, packedMakeDocs, checkFailure) {
  // PRDs 10, 16, and 25 require the public installed-provider resource path
  // to work without a project installation or Store. Use a fresh target and
  // an absent Store path. Do not let an existing Store hide a fallback.
  const resourceTargetDir = registerAuxSmokeDir("make-docs-resource-store-free-");
  const resourceStoreRoot = path.join(npmHome, `resource-store-must-not-open-${randomUUID()}`);
  assertMissing(resourceStoreRoot, "Packed Store-free resource proof began with a Store.");
  const offlineEnv = { ...createPackedOfflineEnv(), MAKE_DOCS_HOME: resourceStoreRoot };
  const listed = JSON.parse(execFileSync(
    "node",
    [packedMakeDocs, "resource", "list", "--origin", "installed", "--format", "json", "--target", resourceTargetDir],
    { encoding: "utf8", env: offlineEnv },
  ));

  for (const resource of [...HUMAN_EXPERIENCE_RESOURCES, ...PERFORMANCE_EVIDENCE_RESOURCES]) {
    const upstreamBytes = readFileSync(path.join(repoRoot, "packages/docs/template", resource.localPath));
    const generatedBytes = readFileSync(path.join(cliPackageDir, "template", resource.localPath));
    const dogfoodBytes = readFileSync(path.join(repoRoot, resource.localPath));
    const packedBytes = readFileSync(path.join(packageRoot, "template", resource.localPath));
    if (!generatedBytes.equals(upstreamBytes) || !dogfoodBytes.equals(upstreamBytes) || !packedBytes.equals(upstreamBytes)) {
      throw new Error(`Governance resource projections differ for ${resource.uri}.`);
    }

    const entry = listed.resources.find((candidate) => candidate.uri === resource.uri);
    if (!entry?.result?.ok) {
      throw new Error(`Packed CLI installed-origin list omitted ${resource.uri}.`);
    }
    if (entry.result.value.origin !== "installed-machine" || entry.result.value.identity.type !== resource.type) {
      throw new Error(`Packed CLI list returned the wrong installed provenance for ${resource.uri}.`);
    }

    const raw = execFileSync(
      "node",
      [packedMakeDocs, "resource", "read", resource.uri, "--origin", "installed", "--format", "raw", "--target", resourceTargetDir],
      { env: offlineEnv },
    );
    if (!raw.equals(upstreamBytes)) {
      throw new Error(`Packed CLI installed-origin read changed the bytes for ${resource.uri}.`);
    }
    const metadata = JSON.parse(execFileSync(
      "node",
      [packedMakeDocs, "resource", "read", resource.uri, "--origin", "installed", "--format", "json", "--target", resourceTargetDir],
      { encoding: "utf8", env: offlineEnv },
    ));
    if (metadata.resource.origin !== "installed-machine") {
      throw new Error(`Packed CLI read returned the wrong installed provenance for ${resource.uri}.`);
    }
    const decoded = Buffer.from(metadata.resource.content.data, "base64");
    if (!decoded.equals(upstreamBytes)) {
      throw new Error(`Packed CLI JSON read changed the bytes for ${resource.uri}.`);
    }
  }

  if (checkFailure) {
    const missingUri = "make-docs://system/contract/not-a-shipped-resource.md";
    const missing = runPackedCliExpectingFailure(
      packedMakeDocs,
      ["resource", "read", missingUri, "--origin", "installed", "--target", resourceTargetDir],
      offlineEnv,
    );
    assertOutputContains(
      missing.stderr,
      `System resource ${missingUri} is not available from the installed provider inventory.`,
      "Packed CLI resource read did not explain a missing installed resource.",
    );
    const missingError = JSON.parse(missing.stderr);
    if (
      missingError.code !== "resource-not-found" ||
      missingError.recovery !== "Check the cataloged resource URI or restore the installed provider."
    ) {
      throw new Error("Packed CLI resource read did not return the supported missing-resource recovery action.");
    }
  }
  assertMissing(resourceStoreRoot, "Packed Store-free resource operations opened a Store session.");
  assertMissing(
    path.join(resourceTargetDir, ".make-docs"),
    "Packed Store-free resource operations wrote project state.",
  );
}

function assertPackedHumanExperienceLegacyUpdate(packageRoot, packedMakeDocs, sourceInstallation) {
  const legacyTargetDir = registerAuxSmokeDir("make-docs-hx-legacy-update-");
  cpSync(sourceInstallation.targetDir, legacyTargetDir, { recursive: true });

  const currentManifest = readInstallationLedger(sourceInstallation);
  const legacyManifest = JSON.parse(
    JSON.stringify(currentManifest).replaceAll(currentManifest.packageVersion, "0.1.0"),
  );
  delete legacyManifest.projectId;
  legacyManifest.updatedAt = "2026-06-18T00:00:00.000Z";

  const legacyManagedBody = [
    "See `.make-docs/AGENTS.md` for the full make-docs routing.",
    "",
    "When asked to create documentation for this project that is not `README.md`, read the same-named instruction file in `docs/` before writing.",
    "",
  ].join("\n");
  const legacyManagedHash = createHash("sha256").update(legacyManagedBody).digest("hex");
  legacyManifest.files["AGENTS.md"].hash = legacyManagedHash;
  legacyManifest.files["AGENTS.md"].systemAsset.expectedHashes = [legacyManagedHash];
  legacyManifest.systemAssetMaterialization.assets["AGENTS.md"].expectedHashes = [legacyManagedHash];
  legacyManifest.routerOwnership.routers["AGENTS.md"].expectedSourceHash = legacyManagedHash;
  legacyManifest.routerOwnership.routers["AGENTS.md"].installedHash = legacyManagedHash;

  const userRouterPrefix = Buffer.from("# User-owned smoke prefix\n\n", "utf8");
  const userRouterSuffix = Buffer.from("# User-owned smoke suffix\n", "utf8");
  const legacyManagedBlock = Buffer.from(
    `<!-- make-docs:begin -->\n${legacyManagedBody}<!-- make-docs:end -->\n`,
    "utf8",
  );
  const rootRouterPath = path.join(legacyTargetDir, "AGENTS.md");
  const legacyRouterBytes = Buffer.concat([userRouterPrefix, legacyManagedBlock, userRouterSuffix]);
  writeFileSync(rootRouterPath, legacyRouterBytes);

  const legacyManifestPath = path.join(legacyTargetDir, ".make-docs/manifest.json");
  writeFileSync(legacyManifestPath, `${JSON.stringify(legacyManifest, null, 2)}\n`, "utf8");
  const configPath = path.join(legacyTargetDir, ".make-docs/config.yaml");
  const config = parseYamlDocument(readFileSync(configPath, "utf8"));
  config.delete("projectId");
  writeFileSync(configPath, config.toString(), "utf8");

  const historicalDesignPath = path.join(
    legacyTargetDir,
    "docs/designs/2024-01-15-user-owned-historical-design.md",
  );
  const historicalDesignBytes = Buffer.from(
    "# User-owned historical design\n\nThis file predates the Human Experience standard.\n",
    "utf8",
  );
  writeFileSync(historicalDesignPath, historicalDesignBytes);

  execFileSync(
    "node",
    [packedMakeDocs, "setup", "--yes", "--codex-method", "none", "--claude-code-method", "none", "--target", legacyTargetDir],
    { stdio: "inherit", env: packedCliEnv },
  );

  assertMissing(legacyManifestPath, "Packed CLI update did not transfer the legacy manifest to the Store.");
  const currentManagedRouter = readFileSync(path.join(packageRoot, "template/AGENTS.md"));
  const expectedRouterBytes = Buffer.concat([userRouterPrefix, currentManagedRouter, userRouterSuffix]);
  const updatedRouterBytes = readFileSync(rootRouterPath);
  if (!updatedRouterBytes.equals(expectedRouterBytes)) {
    throw new Error("Packed CLI update did not preserve the exact router prefix and suffix around the current managed router.");
  }
  if (updatedRouterBytes.equals(legacyRouterBytes)) {
    throw new Error("Packed CLI update did not change the legacy managed router.");
  }
  if (!readFileSync(historicalDesignPath).equals(historicalDesignBytes)) {
    throw new Error("Packed CLI update changed the user-owned historical design.");
  }

  const updatedManifest = inspectStore(
    { targetDir: legacyTargetDir, storeRoot },
    (db, checkout) => {
      const row = db.prepare("SELECT manifest_json FROM installation_ledgers WHERE checkout_id = ?")
        .get(checkout.checkout_id);
      if (!row) throw new Error("Packed CLI update did not write the transferred installation ledger.");
      return JSON.parse(row.manifest_json);
    },
  );
  if (updatedManifest.packageVersion !== readPackedPackage(packageRoot).version) {
    throw new Error("Packed CLI update did not record the current package version.");
  }
  if (updatedManifest.files["AGENTS.md"].hash === legacyManagedHash) {
    throw new Error("Packed CLI update did not record a changed managed router hash.");
  }
  assertPackedHumanExperienceResources(packageRoot, packedMakeDocs, legacyTargetDir, false);
}

function createPackedOfflineEnv() {
  const guardPath = path.join(npmHome, "make-docs-block-network.cjs");
  if (!existsSync(guardPath)) {
    writeFileSync(
      guardPath,
      [
        'const blocked = () => { throw new Error("Network access is blocked by the make-docs package smoke."); };',
        "globalThis.fetch = blocked;",
        'const http = require("node:http"); http.request = blocked; http.get = blocked;',
        'const https = require("node:https"); https.request = blocked; https.get = blocked;',
        'const net = require("node:net"); net.connect = blocked; net.createConnection = blocked; net.Socket.prototype.connect = blocked;',
        'const tls = require("node:tls"); tls.connect = blocked; tls.TLSSocket.prototype.connect = blocked;',
        'const dns = require("node:dns"); dns.lookup = blocked; dns.resolve = blocked; dns.reverse = blocked;',
        'const dnsPromises = require("node:dns/promises"); dnsPromises.lookup = blocked; dnsPromises.resolve = blocked; dnsPromises.reverse = blocked;',
        'const dgram = require("node:dgram"); dgram.createSocket = blocked;',
        'require("node:module").syncBuiltinESMExports();',
        "",
      ].join("\n"),
      "utf8",
    );
  }
  const nodeOptions = [packedCliEnv.NODE_OPTIONS, `--require=${guardPath}`].filter(Boolean).join(" ");
  return { ...packedCliEnv, NODE_OPTIONS: nodeOptions, npm_config_offline: "true" };
}

function inspectStore(installation, inspect) {
  const databasePath = path.join(installation.storeRoot, "store.db");
  assertExists(databasePath, "Smoke pack installation has no Store database.");
  const db = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const checkout = db.prepare("SELECT * FROM installation_checkouts WHERE root_path = ?")
      .get(realpathSync.native(installation.targetDir));
    if (!checkout) throw new Error("Smoke pack Store has no binding for this checkout.");
    return inspect(db, checkout);
  } finally {
    db.close();
  }
}

function readInstallationLedger(installation) {
  assertNoProjectOperationState(installation.targetDir, "installation ledger read");
  assertOperationPayloads(installation);
  return inspectStore(installation, (db, checkout) => {
    const row = db.prepare("SELECT manifest_json FROM installation_ledgers WHERE checkout_id = ?")
      .get(checkout.checkout_id);
    if (!row) throw new Error("Smoke pack Store has no applied installation ledger.");
    const manifest = JSON.parse(row.manifest_json);
    const config = parseYaml(
      readFileSync(path.join(installation.targetDir, ".make-docs/config.yaml"), "utf8"),
    );
    const declaredId = typeof config?.projectId === "string" ? config.projectId : undefined;
    if (!declaredId || declaredId !== checkout.project_id || declaredId !== manifest.projectId) {
      throw new Error("Smoke pack config, checkout binding, and Store ledger identities differ.");
    }
    return manifest;
  });
}

function assertOperationPayloads(installation) {
  const payloads = inspectStore(installation, (db, checkout) => {
    const rows = db.prepare("SELECT before_json, after_json FROM installation_steps JOIN installation_operations USING(operation_id) WHERE checkout_id = ?")
      .all(checkout.checkout_id);
    const expected = new Map();
    for (const row of rows) {
      for (const serialized of [row.before_json, row.after_json]) {
        const state = JSON.parse(serialized);
        if (!state.payload) continue;
        if (!state.payload.startsWith(".make-docs/backup/operations/") || state.kind !== "file" || !/^[a-f0-9]{64}$/.test(state.digest ?? "")) {
          throw new Error("Smoke pack Store references an invalid backup payload.");
        }
        const absolute = realpathSync(path.join(installation.targetDir, state.payload));
        const payloadRoot = realpathSync(path.join(installation.targetDir, ".make-docs/backup/operations"));
        if (!absolute.startsWith(`${payloadRoot}${path.sep}`)) throw new Error("Smoke pack backup payload escapes its protected directory.");
        const digest = createHash("sha256").update(readFileSync(absolute)).digest("hex");
        if (digest !== state.digest) throw new Error(`Smoke pack backup payload differs from Store evidence: ${state.payload}`);
        expected.set(state.payload, digest);
      }
    }
    return expected;
  });
  const payloadRoot = path.join(installation.targetDir, ".make-docs/backup/operations");
  const actual = existsSync(payloadRoot)
    ? JSON.parse(snapshotTree(payloadRoot)).filter(([, kind]) => kind !== "directory")
      .map(([relative]) => `.make-docs/backup/operations/${relative.split(path.sep).join("/")}`).sort()
    : [];
  if (JSON.stringify(actual) !== JSON.stringify([...payloads.keys()].sort())) {
    throw new Error("Smoke pack backup payload files do not match the Store's exact references.");
  }
}

function assertStoredOperation(installation, operation, relativePath) {
  inspectStore(installation, (db, checkout) => {
    const row = db.prepare(
      "SELECT operation_id FROM installation_operations WHERE checkout_id = ? AND operation = ? AND status = 'completed' ORDER BY finished_at DESC LIMIT 1",
    ).get(checkout.checkout_id, operation);
    if (!row) throw new Error(`Smoke pack has no completed Store record for ${operation}.`);
    if (relativePath) {
      const step = db.prepare("SELECT after_json FROM installation_steps WHERE operation_id = ? AND relative_path = ?")
        .get(row.operation_id, relativePath.split(path.sep).join("/"));
      if (!step || JSON.parse(step.after_json).kind !== "file") {
        throw new Error(`Smoke pack ${operation} has no durable file evidence for ${relativePath}.`);
      }
    }
  });
}

function snapshotTree(root) {
  const entries = [];
  const visit = (relative) => {
    const absolute = path.join(root, relative);
    const stat = lstatSync(absolute);
    if (stat.isSymbolicLink()) entries.push([relative, "link", readlinkSync(absolute)]);
    else if (stat.isDirectory()) {
      entries.push([relative, "directory"]);
      for (const name of readdirSync(absolute).sort()) visit(path.join(relative, name));
    } else entries.push([relative, "file", createHash("sha256").update(readFileSync(absolute)).digest("hex")]);
  };
  visit("");
  return JSON.stringify(entries);
}

function assertNoProjectOperationState(targetDir, label) {
  // Inspect the whole fixture. Existing backup copies remain permitted payloads.
  const entries = JSON.parse(snapshotTree(targetDir));
  for (const [entry] of entries) {
    const relative = entry.split(path.sep).join("/");
    if (relative.startsWith(".make-docs/backup/") || relative.startsWith(".backup/")) continue;
    if (/(^|\/)\.make-docs\/(manifest\.json|state|runs|locks|store\.db(?:-wal|-shm)?|config\.json)(\/|$)/.test(relative)) {
      throw new Error(`Smoke pack ${label} created project-local operation state: ${relative}`);
    }
  }
}

function assertPackedStateStatus(packedMakeDocs, installation, expectedStatus) {
  const before = snapshotTree(installation.targetDir);
  const output = execFileSync(
    process.execPath,
    [packedMakeDocs, "project", "state", "status", "--target-root", installation.targetDir, "--json"],
    {
      encoding: "utf8",
      env: { ...packedCliEnv, MAKE_DOCS_HOME: installation.storeRoot },
    },
  );
  const status = JSON.parse(output);
  if (status.status !== expectedStatus || status.storeAvailable !== true) {
    throw new Error(`Packed state status expected ${expectedStatus}: ${output}`);
  }
  if (output.includes(installation.storeRoot)) throw new Error("Packed state status leaked a private Store path.");
  if (snapshotTree(installation.targetDir) !== before) throw new Error("Packed state status changed project files.");
  assertNoProjectOperationState(installation.targetDir, "project state status");
}

function assertStoreBootstrapAndNoRepoStateWrites(storeRootDir, installTargetDir, label) {
  // Store bootstrap (PRD 38 R-STORE-1) is mandatory before install writes.
  assertExists(
    path.join(storeRootDir, "store.db"),
    `Smoke pack ${label} did not bootstrap the global store database.`,
  );
  assertNoProjectOperationState(installTargetDir, label);
  inspectStore({ targetDir: installTargetDir, storeRoot: storeRootDir }, (db) => {
    const tables = db.prepare("SELECT name FROM sqlite_schema WHERE type = 'table'").all().map(row => row.name);
    for (const table of ["installation_checkouts", "installation_ledgers", "installation_operations", "installation_steps", "installation_migration_records", "installation_locks"]) {
      if (!tables.includes(table)) throw new Error(`Smoke pack ${label} omitted required Store table ${table}.`);
    }
    const result = db.prepare("PRAGMA quick_check").get();
    if (Object.values(result)[0] !== "ok") throw new Error(`Smoke pack ${label} Store integrity check failed.`);
  });

  // No operational state under any repository path (R-BND-2, R-TEST-1).
  assertMissing(
    path.join(installTargetDir, ".make-docs/runs"),
    `Smoke pack ${label} wrote run state under the repository.`,
  );
  for (const storeFile of ["store.db", "store.db-wal", "store.db-shm", "config.json"]) {
    assertMissing(
      path.join(installTargetDir, ".make-docs", storeFile),
      `Smoke pack ${label} wrote global-store file ${storeFile} under the repository.`,
    );
  }
}

function assertPackedReaderFacingTemplate(packageRoot) {
  for (const relativePath of RETIRED_READER_ASSET_DEFAULT_PATHS) {
    assertMissing(
      path.join(packageRoot, "template", relativePath),
      `Packed template still includes retired default ${relativePath}.`,
    );
  }
  for (const relativePath of ["docs/assets/AGENTS.md", "docs/assets/CLAUDE.md"]) {
    assertExists(
      path.join(packageRoot, "template", relativePath),
      `Packed template omitted ${relativePath}.`,
    );
  }
  for (const relativePath of [
    "docs/assets/breadcrumbs",
    "docs/assets/history",
    "docs/assets/guides",
    "docs/guides",
    "docs/library",
  ]) {
    assertMissing(
      path.join(packageRoot, "template", relativePath),
      `Packed template still includes superseded default path ${relativePath}.`,
    );
  }

  const assetsRouter = readFileSync(
    path.join(packageRoot, "template/docs/assets/AGENTS.md"),
    "utf8",
  );
  for (const required of ["docs/assets/<persona-slug>", "docs/assets/project", ".make-docs/archive", "user", "maintainer"]) {
    assertOutputContains(assetsRouter, required, `Packed assets router omitted ${required}.`);
  }
  for (const retired of ["docs/assets/archive", "docs/assets/artifacts", "docs/assets/library", "docs/assets/playbooks", "docs/artifacts"]) {
    assertMissing(path.join(packageRoot, "template", retired), `Packed template restored retired directory ${retired}.`);
  }
  for (const [file, declaration] of [["AGENTS.codex-only.md", "Asset router files: AGENTS.md"], ["CLAUDE.claude-only.md", "Asset router files: CLAUDE.md"]]) {
    assertOutputContains(readFileSync(path.join(packageRoot, "template/docs", file), "utf8"), declaration, `Static router variant ${file} has incorrect selection.`);
  }
}

/**
 * PRDs 10 and 16 package-content proof. The retired dynamic conformance
 * system has no allowed package exception. A registry, lab result,
 * transcript, scenario, bootstrap, or root conformance asset fails the pack.
 */
function assertNoRetiredConformanceAssetsInTarball(packageRoot) {
  const contentMarkers = [
    "make-docs.conformance.tuple-registry",
    "conformance.scenario.v1",
    "conformance.result.v1",
    "conformance.result.v2",
  ];
  const pathPatterns = [
    /(?:^|\/)conformance(?:\/|$)/,
    /(?:^|\/)docs\/assets\/conformance(?:\/|$)/,
    /(?:^|\/)(?:tuple-registry\.json|conformance-(?:kit|ingest|scenario|result|transcript|bootstrap)[^/]*)$/,
    /(?:^|\/)[^/]*conformance-lab[^/]*$/,
    /(?:^|\/)[^/]*(?:support|setup)-lab-(?:result|scenario|transcript|bootstrap)[^/]*$/,
  ];
  const pending = [packageRoot];
  while (pending.length > 0) {
    const current = pending.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(absolute);
        continue;
      }
      const relative = path.relative(packageRoot, absolute).split(path.sep).join("/");
      if (pathPatterns.some((pattern) => pattern.test(relative))) {
        throw new Error(
          `Packed tarball ships retired conformance asset path ${relative}.`,
        );
      }
      const content = readFileSync(absolute, "utf8");
      for (const marker of contentMarkers) {
        if (content.includes(marker)) {
          throw new Error(
            `Packed file ${relative} carries retired conformance schema identifier \`${marker}\`.`,
          );
        }
      }
    }
  }
}


function readPackedSkillExpectations(packageRoot, scope = "project", tools = "both") {
  const layout = STANDARD_SKILL_LAYOUTS[scope]?.[tools];
  if (!layout) throw new Error(`Unknown Skill smoke layout: ${scope}/${tools}`);
  const nativeRoots = [...new Set(Object.values(layout.native))].filter(root => root !== layout.canonical);
  const registry = JSON.parse(readFileSync(path.join(packageRoot, "skill-registry.json"), "utf8"));
  const names = registry.skills.map(skill => skill.name).sort();
  if (JSON.stringify(names) !== JSON.stringify([...EXPECTED_ALL_SKILLS].sort())) {
    throw new Error(`Packed first-party registry must contain exactly the seven shipped Skills: ${names.join(", ")}`);
  }
  const expectedSkillPaths = [];
  const nativePayloadPaths = [];
  for (const skill of registry.skills) {
    if (skill.source !== `embedded:${skill.name}`) throw new Error(`First-party Skill must use embedded bytes: ${skill.name}`);
    const declared = [{source: skill.entryPoint, installPath: "SKILL.md"}, ...(skill.assets ?? [])];
    const seen = new Set();
    for (const item of declared) {
      for (const value of [item.source, item.installPath]) {
        if (typeof value !== "string" || !value || path.isAbsolute(value) || value.includes("\\") || value.split("/").some(part => !part || part === "." || part === "..")) throw new Error(`Unsafe declared Skill file: ${skill.name}`);
      }
      if (seen.has(item.installPath)) throw new Error(`Duplicate declared Skill destination: ${skill.name}/${item.installPath}`);
      seen.add(item.installPath);
      expectedSkillPaths.push(`${layout.canonical}/${skill.name}/${item.installPath}`);
      for (const native of nativeRoots) nativePayloadPaths.push(`${native}/${skill.name}/${item.installPath}`);
    }
    for (const native of nativeRoots) expectedSkillPaths.push(`${native}/${skill.name}`);
    nativePayloadPaths.push(`${layout.canonical}/${skill.name}`); // No duplicate directory ownership for a direct payload.
  }
  return {expectedSkillPaths, nativePayloadPaths};
}

function assertExists(filePath, message) {
  if (!existsSync(filePath)) {
    throw new Error(message);
  }
}

function assertMissing(filePath, message) {
  if (lstatSync(filePath, { throwIfNoEntry: false })) {
    throw new Error(message);
  }
}

function assertOutputContains(output, expected, message) {
  if (!output.includes(expected)) {
    throw new Error(`${message}\nExpected to find: ${expected}\nOutput:\n${output}`);
  }
}

function assertOutputExcludes(output, unexpected, message) {
  if (output.includes(unexpected)) {
    throw new Error(`${message}\nUnexpectedly found: ${unexpected}\nOutput:\n${output}`);
  }
}

function assertDirectoryEntries(directoryPath, expectedEntries) {
  assertExists(directoryPath, `Smoke pack install did not produce ${directoryPath}.`);
  const actualEntries = readdirSync(directoryPath).sort();
  const expected = [...expectedEntries].sort();

  if (actualEntries.length !== expected.length) {
    throw new Error(
      `Unexpected contents in ${directoryPath}: expected ${expected.join(", ")}, got ${actualEntries.join(", ") || "(empty)"}.`,
    );
  }

  expected.forEach((entry, index) => {
    if (actualEntries[index] !== entry) {
      throw new Error(
        `Unexpected contents in ${directoryPath}: expected ${expected.join(", ")}, got ${actualEntries.join(", ") || "(empty)"}.`,
      );
    }
  });
}

function getOnlyBackupDirectory(backupRoot) {
  assertExists(backupRoot, "Smoke pack backup did not produce a .make-docs/backup directory.");
  const backupEntries = readdirSync(backupRoot).filter((entry) =>
    entry !== "operations" && existsSync(path.join(backupRoot, entry)),
  );

  if (backupEntries.length !== 1) {
    throw new Error(
      `Expected exactly one smoke-pack backup directory, found ${backupEntries.join(", ") || "(none)"}.`,
    );
  }

  return path.join(backupRoot, backupEntries[0]);
}



/**
 * Opaque legacy project content for packed CLI refusal and uninstall preservation.
 */
function writeLegacyContentFixture(fixtureDir) {
  mkdirSync(path.join(fixtureDir, "docs/work"), { recursive: true });
  // This explicit legacy manifest is opaque input. Retired-route refusal and
  // tool removal must preserve it; it is never treated as current authority.
  const manifestPath = path.join(fixtureDir, ".make-docs/manifest.json");
  mkdirSync(path.dirname(manifestPath), { recursive: true });
  writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
        schemaVersion: 2,
        projectId: randomUUID(),
        packageName: "make-docs-smoke",
        packageVersion: "0.0.0-smoke",
        updatedAt: new Date().toISOString(),
        profileId: "smoke",
        selections: {
          capabilities: { designs: true, plans: true, prd: true, work: true },
          harnesses: { "claude-code": true, codex: true },
          skills: false,
          skillScope: "project",
          selectedSkills: [],
          plugins: false,
          pluginScope: "project",
          selectedPlugins: [],
        },
        effectiveCapabilities: ["designs", "plans", "prd", "work"],
        files: {},
        skillFiles: [],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  const playbookPath = path.join(fixtureDir, "docs/assets/playbooks/user/run-stack.md");
  mkdirSync(path.dirname(playbookPath), { recursive: true });
  writeFileSync(
    playbookPath,
    [
      "---",
      "title: Run Stack",
      "kind: playbook",
      "status: accepted",
      "persona: user",
      "stack: run",
      "summary: Run Stack summary.",
      "---",
      "",
      "# Run Stack",
      "",
      "## Purpose",
      "",
      "Use this playbook when the matching workflow goal is active.",
      "",
      "## Inputs and Authority",
      "",
      "- User request.",
      "",
      "## Procedure",
      "",
      "1. Resolve the playbook.",
      "",
      "## Gates and Decisions",
      "",
      "- Stop when user review is required.",
      "",
      "## Assists",
      "",
      "- Assists are optional unless the playbook says otherwise.",
      "",
      "## Outputs and Handoff",
      "",
      "- Record the expected output or handoff artifact.",
      "",
      "## Validation",
      "",
      "- Confirm the workflow completed or report why it stopped.",
      "",
    ].join("\n"),
    "utf8",
  );
}

/** Runs the packed CLI expecting a nonzero exit; returns captured output. */
function runPackedCliExpectingFailure(packedMakeDocs, args, env = packedCliEnv) {
  try {
    execFileSync("node", [packedMakeDocs, ...args], {
      encoding: "utf8",
      env,
    });
  } catch (error) {
    if (error && typeof error.status === "number" && error.status !== 0) {
      return { status: error.status, stdout: String(error.stdout ?? ""), stderr: String(error.stderr ?? "") };
    }
    throw error;
  }

  throw new Error(`Smoke pack expected \`make-docs ${args.join(" ")}\` to fail, but it exited 0.`);
}
