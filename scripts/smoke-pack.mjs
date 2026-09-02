import { execFileSync, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const cliPackageDir = path.join(repoRoot, "packages", "cli");
const npmHome = mkdtempSync(path.join(os.tmpdir(), "make-docs-npm-home-"));
const packOutputDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-pack-output-"));
// Sandbox global-store root for every direct packed-CLI invocation, so the
// smoke never touches the real `~/.make-docs/` and can assert store behavior.
const storeRoot = mkdtempSync(path.join(os.tmpdir(), "make-docs-store-root-"));
const packedCliEnv = { ...process.env, MAKE_DOCS_HOME: storeRoot };
/** Extra temp directories created by the W18 R11 P6 smokes; removed at exit. */
const auxSmokeDirs = [];

function registerAuxSmokeDir(prefix) {
  const dir = mkdtempSync(path.join(os.tmpdir(), prefix));
  auxSmokeDirs.push(dir);
  return dir;
}
let sqliteAvailable = true;
try {
  await import("node:sqlite");
} catch {
  sqliteAvailable = false;
}
const EXPECTED_PACKAGE_NAME = "@brucewaynedecoy/make-docs";
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
      "--target",
      targetDir,
    ],
    envKind: "npm",
  },
  {
    name: "pnpm dlx",
    command: "pnpm",
    args: (tarballPath, targetDir) => ["dlx", tarballPath, "setup", "--yes", "--target", targetDir],
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
      "--target",
      targetDir,
    ],
    envKind: "bun",
  },
];

const EXPECTED_READER_ASSET_PATHS = [
  "docs/assets/archive/AGENTS.md",
  "docs/assets/archive/CLAUDE.md",
  "docs/assets/artifacts/AGENTS.md",
  "docs/assets/artifacts/CLAUDE.md",
  "docs/assets/library/AGENTS.md",
  "docs/assets/library/CLAUDE.md",
  "docs/assets/playbooks/AGENTS.md",
  "docs/assets/playbooks/CLAUDE.md",
  "docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md",
];

const EXPECTED_PROVIDER_ONLY_ROUTER_PATHS = [
  "AGENTS.md",
  "CLAUDE.md",
  "docs/AGENTS.md",
  "docs/CLAUDE.md",
  ".make-docs/AGENTS.md",
  ".make-docs/CLAUDE.md",
  ".make-docs/system/AGENTS.md",
  ".make-docs/system/CLAUDE.md",
  ".make-docs/system/contracts/AGENTS.md",
  ".make-docs/system/contracts/CLAUDE.md",
  ".make-docs/system/prompts/AGENTS.md",
  ".make-docs/system/prompts/CLAUDE.md",
  ".make-docs/system/references/AGENTS.md",
  ".make-docs/system/references/CLAUDE.md",
  ".make-docs/system/templates/AGENTS.md",
  ".make-docs/system/templates/CLAUDE.md",
];

const ROUTER_HEADINGS = {
  "AGENTS.md": "# Agent Instructions",
  "CLAUDE.md": "# Agent Instructions",
  "docs/AGENTS.md": "# Documentation Router",
  "docs/CLAUDE.md": "# Documentation Router",
  ".make-docs/AGENTS.md": "# Make Docs System Router",
  ".make-docs/CLAUDE.md": "# Make Docs System Router",
  ".make-docs/system/AGENTS.md": "# System Resources Router",
  ".make-docs/system/CLAUDE.md": "# System Resources Router",
  ".make-docs/system/contracts/AGENTS.md": "# System Contracts Router",
  ".make-docs/system/contracts/CLAUDE.md": "# System Contracts Router",
  ".make-docs/system/prompts/AGENTS.md": "# System Prompts Router",
  ".make-docs/system/prompts/CLAUDE.md": "# System Prompts Router",
  ".make-docs/system/references/AGENTS.md": "# System References Router",
  ".make-docs/system/references/CLAUDE.md": "# System References Router",
  ".make-docs/system/templates/AGENTS.md": "# Templates Router",
  ".make-docs/system/templates/CLAUDE.md": "# Templates Router",
};

const EXPECTED_SKILL_PATHS = [
  ".make-docs/agentics/skills/archive-docs/SKILL.md",
  ".make-docs/agentics/skills/archive-docs/agents/openai.yaml",
  ".make-docs/agentics/skills/archive-docs/references/archive-workflow.md",
  ".make-docs/agentics/skills/archive-docs/scripts/trace_relationships.py",
  ".make-docs/agentics/skills/cleanup-docs/SKILL.md",
  ".make-docs/agentics/skills/cleanup-docs/agents/openai.yaml",
  ".make-docs/agentics/skills/cleanup-docs/scripts/check_markdown_style.py",
  ".make-docs/agentics/skills/decompose-codebase/SKILL.md",
  ".make-docs/agentics/skills/decompose-codebase/references/mcp-playbook.md",
  ".make-docs/agentics/skills/decompose-codebase/assets/templates/decomposition-plan.md",
  ".claude/skills/archive-docs",
  ".claude/skills/cleanup-docs",
  ".claude/skills/decompose-codebase",
  ".agents/skills/archive-docs",
  ".agents/skills/cleanup-docs",
  ".agents/skills/decompose-codebase",
];

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

const EXPECTED_DUPLICATED_SKILL_PAYLOAD_PATHS = [
  ".claude/skills/archive-docs/agents/openai.yaml",
  ".claude/skills/archive-docs/references/archive-workflow.md",
  ".claude/skills/archive-docs/scripts/trace_relationships.py",
  ".claude/skills/cleanup-docs/agents/openai.yaml",
  ".claude/skills/cleanup-docs/scripts/check_markdown_style.py",
  ".agents/skills/archive-docs/agents/openai.yaml",
  ".agents/skills/archive-docs/references/archive-workflow.md",
  ".agents/skills/archive-docs/scripts/trace_relationships.py",
  ".agents/skills/cleanup-docs/agents/openai.yaml",
  ".agents/skills/cleanup-docs/scripts/check_markdown_style.py",
];

const EXPECTED_ALL_SKILLS = [
  "archive-docs",
  "cleanup-docs",
  "decompose-codebase",
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

function runPackageRunnerSmokes(tarballPath) {
  for (const runner of PACKAGE_RUNNER_SMOKES) {
    runPackageRunnerSmoke({ runner, tarballPath });
  }
}

function runPackageRunnerSmoke(options) {
  const { runner, tarballPath } = options;
  const smokeRoot = mkdtempSync(
    path.join(os.tmpdir(), `make-docs-${runner.envKind}-runner-smoke-`),
  );
  const targetDir = path.join(smokeRoot, "target");
  const workDir = path.join(smokeRoot, "work");
  mkdirSync(targetDir, { recursive: true });
  mkdirSync(workDir, { recursive: true });

  try {
    execFileSync(runner.command, runner.args(tarballPath, targetDir), {
      cwd: workDir,
      encoding: "utf8",
      env: packageRunnerEnv(smokeRoot, runner.envKind),
      timeout: 120000,
    });

    const manifestPath = path.join(targetDir, ".make-docs/manifest.json");
    assertExists(
      manifestPath,
      `Smoke pack ${runner.name} install did not produce a manifest.`,
    );
    assertExists(
      path.join(targetDir, "docs/AGENTS.md"),
      `Smoke pack ${runner.name} install did not produce docs/AGENTS.md.`,
    );
    assertMissing(
      path.join(targetDir, ".make-docs/config.yaml"),
      `Smoke pack ${runner.name} install should not materialize an optional project config.`,
    );
    assertManifestPackageName(manifestPath, EXPECTED_PACKAGE_NAME);
    assertManifestSkillFiles(manifestPath, 0);
    assertManifestOmitsProjectConfig(manifestPath);
    assertProviderOnlyDefaultInstall(targetDir, manifestPath);
    // The runner env sandboxes HOME, so the store bootstrap must land under
    // the sandbox home and never under the repository target.
    assertStoreBootstrapAndNoRepoStateWrites(
      path.join(smokeRoot, "home", ".make-docs"),
      targetDir,
      `${runner.name} install`,
    );
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

function packageRunnerEnv(smokeRoot, envKind) {
  const homeDir = path.join(smokeRoot, "home");
  const xdgCacheDir = path.join(smokeRoot, "xdg-cache");
  const env = {
    ...process.env,
    CI: "1",
    FORCE_COLOR: "0",
    HOME: homeDir,
    NO_COLOR: "1",
    XDG_CACHE_HOME: xdgCacheDir,
  };

  mkdirSync(homeDir, { recursive: true });
  mkdirSync(xdgCacheDir, { recursive: true });

  if (envKind === "npm") {
    return {
      ...env,
      npm_config_cache: path.join(smokeRoot, "npm-cache"),
      npm_config_userconfig: path.join(homeDir, ".npmrc"),
    };
  }

  if (envKind === "pnpm") {
    return {
      ...env,
      COREPACK_HOME: path.join(smokeRoot, "corepack"),
      PNPM_HOME: path.join(smokeRoot, "pnpm-home"),
      npm_config_cache: path.join(smokeRoot, "pnpm-npm-cache"),
      npm_config_store_dir: path.join(smokeRoot, "pnpm-store"),
      npm_config_userconfig: path.join(homeDir, ".npmrc"),
    };
  }

  return {
    ...env,
    BUN_CACHE_DIR: path.join(smokeRoot, "bun-cache"),
    BUN_INSTALL_CACHE_DIR: path.join(smokeRoot, "bun-install-cache"),
  };
}

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
const tarballPath = path.join(packOutputDir, filename);

const unpackDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-pack-"));
const targetDir = mkdtempSync(path.join(os.tmpdir(), "make-docs-smoke-"));

try {
  execFileSync("tar", ["-xzf", tarballPath, "-C", unpackDir], { stdio: "inherit" });
  const packageRoot = path.join(unpackDir, "package");
  const packedPackage = readPackedPackage(packageRoot);
  assertOnlyMakeDocsBin(packedPackage);
  assertPackedInstructionTemplate(packageRoot);
  assertPackedRouterGuidanceParity(packageRoot);
  assertPackedReaderFacingTemplate(packageRoot);
  assertNoConformanceAssetsInTarball(packageRoot);
  assertMissing(
    path.join(packageRoot, "template/.make-docs/config.yaml"),
    "Packed template should not ship a default project config file.",
  );
  const packedMakeDocs = path.join(packageRoot, packedPackage.bin["make-docs"]);
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
  runPackageRunnerSmokes(tarballPath);

  const manifestPath = path.join(targetDir, ".make-docs/manifest.json");
  const fixtureServer = await startRepoFixtureServer(repoRoot);

  try {
    rewritePackedSkillRegistry(packageRoot, fixtureServer.baseUrl);
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
      [packedMakeDocs, "setup", "--yes", "--target", targetDir],
      { stdio: "inherit", env: packedCliEnv },
    );
    assertExists(
      path.join(targetDir, ".make-docs/manifest.json"),
      "Smoke pack setup install did not produce a manifest.",
    );
    assertMissing(
      path.join(targetDir, ".make-docs/config.yaml"),
      "Smoke pack setup install should not materialize an optional project config.",
    );
    assertExists(
      path.join(targetDir, "docs/AGENTS.md"),
      "Smoke pack setup install did not produce docs/AGENTS.md.",
    );
    assertStoreBootstrapAndNoRepoStateWrites(storeRoot, targetDir, "setup install");

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

    assertProviderOnlyDefaultInstall(targetDir, manifestPath);
    assertManifestOmitsProjectConfig(manifestPath);

    execFileSync(
      "node",
      [packedMakeDocs, "setup", "--yes", "--target", targetDir],
      { stdio: "inherit", env: packedCliEnv },
    );
    assertMissing(
      path.join(targetDir, ".make-docs/conflicts"),
      "Smoke pack setup sync staged conflicts for an unchanged install.",
    );
    assertManifestPackageName(manifestPath, EXPECTED_PACKAGE_NAME);
    assertManifestSkillFiles(manifestPath, 0);
    assertMissing(
      path.join(targetDir, ".claude/skills"),
      "Smoke pack setup install should not produce Claude Code skill files.",
    );
    assertMissing(
      path.join(targetDir, ".agents/skills"),
      "Smoke pack setup install should not produce Codex skill files.",
    );
    assertMissing(
      path.join(targetDir, ".make-docs/agentics/skills"),
      "Smoke pack setup install should not produce shared skill payloads.",
    );

    execFileSync(
      "node",
      [packedMakeDocs, "setup", "skills", "--yes", "--selected-skills", "all", "--target", targetDir],
      { stdio: "inherit", env: packedCliEnv },
    );
  } finally {
    await fixtureServer.close();
  }

  assertExists(manifestPath, "Smoke pack install did not produce a manifest.");
  assertManifestPackageName(manifestPath, EXPECTED_PACKAGE_NAME);
  assertManifestOmitsProjectConfig(manifestPath);
  assertExists(
    path.join(targetDir, "docs/AGENTS.md"),
    "Smoke pack install did not produce docs/AGENTS.md.",
  );

  assertManifestContainsSkillFiles(manifestPath, EXPECTED_SKILL_PATHS);
  assertManifestOmitsSkillFilePrefixes(manifestPath, WITHDRAWN_SKILL_PATHS);
  assertManifestOmitsSkillFiles(manifestPath, EXPECTED_DUPLICATED_SKILL_PAYLOAD_PATHS);
  assertDirectoryEntries(path.join(targetDir, ".make-docs/agentics/skills"), EXPECTED_ALL_SKILLS);
  assertDirectoryEntries(path.join(targetDir, ".claude/skills"), EXPECTED_ALL_SKILLS);
  assertDirectoryEntries(path.join(targetDir, ".agents/skills"), EXPECTED_ALL_SKILLS);
  assertMissing(
    path.join(targetDir, ".make-docs/config.yaml"),
    "Smoke pack skills sync should not materialize an optional project config.",
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
    path.join(targetDir, ".make-docs/agentics/skills/archive-docs/SKILL.md"),
    "Smoke pack skills removal dry run removed shared skill payloads.",
  );

  assertExists(
    path.join(targetDir, ".claude/skills/decompose-codebase/SKILL.md"),
    "Smoke pack install did not expose the Claude Code decompose-codebase skill.",
  );
  assertExists(
    path.join(targetDir, ".agents/skills/decompose-codebase/SKILL.md"),
    "Smoke pack install did not expose the Codex decompose-codebase skill.",
  );
  assertExists(
    path.join(targetDir, ".make-docs/agentics/skills/decompose-codebase/SKILL.md"),
    "Smoke pack install did not install the shared decompose-codebase skill payload.",
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
  writeFileSync(customConfigPath, "labels:\n  documentKinds:\n    design: Idea\n", "utf8");
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
  assertExists(
    path.join(backupDir, ".make-docs/manifest.json"),
    "Smoke pack backup did not copy the make-docs manifest.",
  );

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

  // Across every packed-CLI operation above (installs, skills, backup,
  // uninstall), operational state stayed in the sandboxed global store and no
  // run-state landed under the repository (PRD 38 R-BND-2, R-TEST-1).
  assertMissing(
    path.join(targetDir, ".make-docs/runs"),
    "Smoke pack run left work-lifecycle run state under the repository.",
  );
  assertExists(
    path.join(storeRoot, "manifest.json"),
    "Smoke pack run lost the global store manifest.",
  );

  // ---- W18 R11 P6 (t5): five-command-tree spellings through the packed
  // tarball — bare invocation (fresh context), `run playbook status`,
  // `run package plan`, `update`, and `uninstall`. Every invocation carries
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

  // `run playbook start` + `run playbook status` against a playbook fixture
  // repo. Run state is relocated-canonical in the sandboxed global store
  // (PRD 35 R-STORE-1/R-STORE-2), keyed by the fixture's manifest-minted
  // project identifier; nothing may land under the fixture repository.
  const runFixtureDir = registerAuxSmokeDir("make-docs-run-fixture-");
  writeRunPlaybookFixture(runFixtureDir);
  const startOutput = execFileSync(
    "node",
    [
      packedMakeDocs,
      "run",
      "playbook",
      "start",
      "user/run-stack",
      "--harness",
      "codex",
      "--run-id",
      "smoke-run",
      "--repo-root",
      runFixtureDir,
    ],
    { encoding: "utf8", env: packedCliEnv },
  );
  const started = JSON.parse(startOutput);
  if (started?.state?.runId !== "smoke-run" || started?.state?.playbookRef !== "user/run-stack") {
    throw new Error(`Smoke pack run playbook start returned unexpected state:\n${startOutput}`);
  }
  if (!started?.projectId || started?.state?.projectId !== started.projectId) {
    throw new Error(`Smoke pack run playbook start did not key run state by project id:\n${startOutput}`);
  }
  assertMissing(
    path.join(runFixtureDir, ".make-docs/runs"),
    "Smoke pack run playbook start wrote run state under the fixture repository (PRD 35 R-STORE-1).",
  );

  const statusOutput = execFileSync(
    "node",
    [
      packedMakeDocs,
      "run",
      "playbook",
      "status",
      "--run-id",
      "smoke-run",
      "--repo-root",
      runFixtureDir,
    ],
    { encoding: "utf8", env: packedCliEnv },
  );
  const runStatus = JSON.parse(statusOutput);
  if (runStatus?.runId !== "smoke-run" || runStatus?.playbookRef !== "user/run-stack") {
    throw new Error(`Smoke pack run playbook status returned unexpected state:\n${statusOutput}`);
  }

  // A bogus run id fails with the structured operation error, not a crash.
  const bogusStatus = runPackedCliExpectingFailure(packedMakeDocs, [
    "run",
    "playbook",
    "status",
    "--run-id",
    "no-such-run",
    "--repo-root",
    runFixtureDir,
  ]);
  assertOutputContains(
    bogusStatus.stderr,
    "No Playbook run state found for run id `no-such-run`.",
    "Smoke pack run playbook status did not report the unknown-run error.",
  );

  // `run package plan` with the codex plugin target (mirrors
  // tests/registry-package-ops.test.ts fixture shape).
  const planOutput = execFileSync(
    "node",
    [
      packedMakeDocs,
      "run",
      "package",
      "plan",
      "user/run-stack",
      "--harness",
      "codex",
      "--output-kind",
      "plugin",
      "--surface",
      "native",
      "--scope",
      "project",
      "--support-evidence-ref",
      "docs/prd/36-playbook-packaging-compiler-and-harness-adapters.md",
      "--repo-root",
      runFixtureDir,
    ],
    { encoding: "utf8", env: packedCliEnv },
  );
  const packagePlan = JSON.parse(planOutput);
  if (
    packagePlan?.plan?.target?.harness !== "codex" ||
    packagePlan?.plan?.target?.outputKind !== "plugin" ||
    !Array.isArray(packagePlan?.plan?.generatedArtifacts) ||
    packagePlan.plan.generatedArtifacts.length === 0
  ) {
    throw new Error(`Smoke pack run package plan returned an unexpected plan:\n${planOutput}`);
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
    path.join(storeRoot, "manifest.json"),
    "Smoke pack uninstall refusal removed the sandboxed store.",
  );

  // `uninstall --yes` removes the sandboxed store and never touches
  // repository content (the ambiguous packed binary is reported, not guessed).
  const repoContentBeforeUninstall = readFileSync(customFilePath, "utf8");
  const uninstallOutput = execFileSync(
    "node",
    [packedMakeDocs, "uninstall", "--yes"],
    { encoding: "utf8", env: packedCliEnv },
  );
  assertOutputContains(
    uninstallOutput,
    `Removed the global store at ${storeRoot}`,
    "Smoke pack uninstall --yes did not remove the sandboxed store.",
  );
  assertOutputContains(
    uninstallOutput,
    "make-docs will not guess and run a destructive global change.",
    "Smoke pack uninstall --yes guessed at ambiguous binary ownership.",
  );
  assertMissing(storeRoot, "Smoke pack uninstall --yes left the sandboxed store behind.");
  if (readFileSync(customFilePath, "utf8") !== repoContentBeforeUninstall) {
    throw new Error("Smoke pack uninstall --yes modified repository content.");
  }
  assertExists(
    path.join(runFixtureDir, "docs/assets/playbooks/user/run-stack.md"),
    "Smoke pack uninstall --yes removed playbook fixture repository content.",
  );
} finally {
  for (const dir of auxSmokeDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
  rmSync(unpackDir, { recursive: true, force: true });
  rmSync(targetDir, { recursive: true, force: true });
  rmSync(packOutputDir, { recursive: true, force: true });
  rmSync(npmHome, { recursive: true, force: true });
  rmSync(storeRoot, { recursive: true, force: true });
  rmSync(tarballPath, { force: true });
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

function assertManifestPackageName(manifestPath, expectedPackageName) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (manifest.packageName !== expectedPackageName) {
    throw new Error(
      `Smoke pack manifest packageName was ${manifest.packageName}, expected ${expectedPackageName}.`,
    );
  }
}

function assertManifestSkillFiles(manifestPath, expectedCount) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const skillFiles = Array.isArray(manifest.skillFiles) ? manifest.skillFiles : [];

  if (skillFiles.length !== expectedCount) {
    throw new Error(
      `Smoke pack manifest tracked ${skillFiles.length} skill files, expected ${expectedCount}.`,
    );
  }
}

function assertManifestContainsSkillFiles(manifestPath, expectedPaths) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const skillFiles = Array.isArray(manifest.skillFiles) ? manifest.skillFiles : [];

  for (const expectedPath of expectedPaths) {
    if (!skillFiles.includes(expectedPath)) {
      throw new Error(`Smoke pack manifest did not track skill file ${expectedPath}.`);
    }
  }
}

function assertManifestOmitsSkillFiles(manifestPath, expectedPaths) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const skillFiles = Array.isArray(manifest.skillFiles) ? manifest.skillFiles : [];

  for (const expectedPath of expectedPaths) {
    if (skillFiles.includes(expectedPath)) {
      throw new Error(`Smoke pack manifest unexpectedly tracked skill file ${expectedPath}.`);
    }
  }
}

function assertManifestOmitsSkillFilePrefixes(manifestPath, prefixes) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
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

function assertProviderOnlyDefaultInstall(targetDir, manifestPath) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const files = manifest.files && typeof manifest.files === "object" ? manifest.files : {};
  const trackedPaths = Object.keys(files).sort();
  const expectedPaths = [...EXPECTED_PROVIDER_ONLY_ROUTER_PATHS].sort();
  if (JSON.stringify(trackedPaths) !== JSON.stringify(expectedPaths)) {
    throw new Error(
      `Smoke pack provider-only setup tracked ${trackedPaths.join(", ") || "(none)"}; ` +
        `expected only ${expectedPaths.join(", ")}.`,
    );
  }

  if (manifest.schemaVersion !== 4) {
    throw new Error(`Smoke pack provider-only manifest used schema ${manifest.schemaVersion}, expected 4.`);
  }

  for (const expectedPath of EXPECTED_PROVIDER_ONLY_ROUTER_PATHS) {
    const entry = files[expectedPath];
    const harness = expectedPath.endsWith("AGENTS.md") ? "codex" : "claude-code";
    const expectedSourceId = `router:${harness}:${expectedPath}`;
    if (!entry) {
      throw new Error(`Smoke pack provider-only manifest did not track router ${expectedPath}.`);
    }
    if (
      entry.sourceId !== expectedSourceId ||
      entry.ownershipClass !== "managed-block" ||
      !/^[a-f0-9]{64}$/.test(entry.hash ?? "")
    ) {
      throw new Error(
        `Smoke pack provider-only manifest has invalid router evidence for ${expectedPath}.`,
      );
    }
  }

  const routerOwnership = manifest.routerOwnership;
  if (
    routerOwnership?.operationLineage !== "W19 R1 P4" ||
    JSON.stringify(Object.keys(routerOwnership.routers ?? {}).sort()) !== JSON.stringify(expectedPaths)
  ) {
    throw new Error("Smoke pack provider-only manifest has invalid router ownership evidence.");
  }

  const projection = manifest.resourceProjection;
  const provider = projection?.provider;
  if (
    !projection ||
    !Array.isArray(projection.selectedTypes) ||
    projection.selectedTypes.length !== 0 ||
    !projection.resources ||
    Object.keys(projection.resources).length !== 0 ||
    !Array.isArray(manifest.selections?.resourceProjection) ||
    manifest.selections.resourceProjection.length !== 0 ||
    provider?.ownershipClass !== "installed-provider" ||
    provider?.provenanceState !== "verified" ||
    provider?.packageName !== EXPECTED_PACKAGE_NAME ||
    provider?.version !== manifest.packageVersion ||
    provider?.immutableRef !== `package:${EXPECTED_PACKAGE_NAME}@${manifest.packageVersion}` ||
    !/^[a-f0-9]{64}$/.test(provider?.inventoryDigest ?? "")
  ) {
    throw new Error("Smoke pack provider-only manifest has invalid provider or projection evidence.");
  }

  assertDirectoryEntries(targetDir, [".make-docs", "AGENTS.md", "CLAUDE.md", "docs"]);
  assertDirectoryEntries(path.join(targetDir, ".make-docs"), ["AGENTS.md", "CLAUDE.md", "manifest.json", "system"]);
  assertDirectoryEntries(path.join(targetDir, ".make-docs/system"), ["AGENTS.md", "CLAUDE.md", "contracts", "prompts", "references", "templates"]);
  for (const type of ["contracts", "prompts", "references", "templates"]) {
    assertDirectoryEntries(path.join(targetDir, ".make-docs/system", type), ["AGENTS.md", "CLAUDE.md"]);
  }
  assertDirectoryEntries(path.join(targetDir, "docs"), ["AGENTS.md", "CLAUDE.md"]);

  for (const relativePath of EXPECTED_PROVIDER_ONLY_ROUTER_PATHS) {
    const content = readFileSync(path.join(targetDir, relativePath), "utf8");
    assertOutputContains(
      content,
      "<!-- make-docs:begin -->",
      `Smoke pack provider-only router ${relativePath} omitted its managed block.`,
    );
    assertOutputContains(
      content,
      ROUTER_HEADINGS[relativePath],
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
}

function assertManifestOmitsProjectConfig(manifestPath) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
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

function assertPackedInstructionTemplate(packageRoot) {
  for (const relativePath of EXPECTED_PROVIDER_ONLY_ROUTER_PATHS) {
    const content = readFileSync(path.join(packageRoot, "template", relativePath), "utf8");
    assertOutputContains(
      content,
      "<!-- make-docs:begin -->",
      `Packed thin router ${relativePath} omitted the managed block marker.`,
    );
    assertOutputContains(
      content,
      ROUTER_HEADINGS[relativePath],
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
  // The packed `.make-docs/` routers must be byte-identical to this repo's
  // dogfood copies after the upstream-first projection.
  for (const name of ["AGENTS.md", "CLAUDE.md"]) {
    const packedPath = path.join(packageRoot, "template/.make-docs", name);
    const dogfoodPath = path.join(repoRoot, ".make-docs", name);
    const packed = readFileSync(packedPath, "utf8");
    const dogfood = readFileSync(dogfoodPath, "utf8");
    if (packed !== dogfood) {
      throw new Error(
        `Packed template/.make-docs/${name} does not match the dogfood .make-docs/${name}.`,
      );
    }
    assertOutputContains(
      packed,
      "make-docs resource read",
      `Packed .make-docs/${name} omitted resource fallback guidance.`,
    );
  }
}

function assertStoreBootstrapAndNoRepoStateWrites(storeRootDir, installTargetDir, label) {
  // Store bootstrap (PRD 38 R-STORE-1): global config, global manifest, and —
  // when node:sqlite is available — the SQLite database exist under the store
  // root after an install.
  assertExists(
    path.join(storeRootDir, "config.json"),
    `Smoke pack ${label} did not bootstrap the global store config.`,
  );
  assertExists(
    path.join(storeRootDir, "manifest.json"),
    `Smoke pack ${label} did not bootstrap the global store manifest.`,
  );
  if (sqliteAvailable) {
    assertExists(
      path.join(storeRootDir, "store.db"),
      `Smoke pack ${label} did not bootstrap the global store database.`,
    );
  }

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
  for (const relativePath of EXPECTED_READER_ASSET_PATHS) {
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
  assertOutputContains(
    assetsRouter,
    "docs/assets/library/<persona-slug>/",
    "Packed assets router omitted the canonical library asset namespace.",
  );
  assertOutputContains(
    assetsRouter,
    "docs/assets/playbooks/<persona-slug>/",
    "Packed assets router omitted the canonical playbook asset namespace.",
  );
  assertOutputContains(
    assetsRouter,
    "docs/assets/archive/**",
    "Packed assets router omitted the archive namespace handoff.",
  );
  assertOutputContains(
    assetsRouter,
    "docs/assets/artifacts/**",
    "Packed assets router omitted the artifact namespace handoff.",
  );
  assertOutputContains(
    assetsRouter,
    "docs/assets/archive/history/**",
    "Packed assets router omitted the archive history namespace handoff.",
  );
  assertOutputExcludes(
    assetsRouter,
    "docs/assets/breadcrumbs/**",
    "Packed assets router still advertises the superseded breadcrumb namespace.",
  );
  assertOutputExcludes(
    assetsRouter,
    "belong in `docs/archive/**`",
    "Packed assets router still advertises top-level docs/archive as a target.",
  );
}

/**
 * W18 R9 P3 (PRD 20 R-TEST-3, R-KEEP-1): conformance assets — the tuple
 * registry, scenario specs, fixtures, and result records under the repo-root
 * `conformance/` directory (relocated from `docs/assets/conformance/` per
 * PRD 43) — are maintainer-only evidence infrastructure and never ship in
 * the npm tarball. Detection mirrors the repo-side check in
 * `packages/cli/src/conformance/meta-verification.ts` (the source of truth
 * for the marker set): the asset directory path (the canonical root-level
 * `conformance/` home, its distinctive subtrees at any depth, and the
 * pre-relocation `docs/assets/conformance` home), the registry data file's
 * basename, and the unambiguous schema identifiers as content markers, so a
 * relocated or renamed asset still fails. Check CODE bundled under `dist/`
 * is allowed to ship — only the ASSETS are excluded — so the content sweep
 * covers the packed template tree. A green sweep is an exclusion fact, never
 * a support claim: it proves the maintainer-only boundary held, not that any
 * harness recognizes any generated output.
 */
function assertNoConformanceAssetsInTarball(packageRoot) {
  const contentMarkers = [
    "make-docs.conformance.tuple-registry",
    "conformance.scenario.v1",
    "conformance.result.v1",
  ];
  // Mirrors CONFORMANCE_ASSET_PATH_MARKERS / isConformanceAssetPath in
  // packages/cli/src/conformance/meta-verification.ts.
  const pathMarkers = [
    "docs/assets/conformance",
    "conformance/tuple-registry.json",
    "conformance/scenarios/",
    "conformance/fixtures/",
    "conformance/results/",
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
      if (
        relative.startsWith("conformance/") ||
        pathMarkers.some((marker) => relative.includes(marker))
      ) {
        throw new Error(
          `Packed tarball ships conformance asset path ${relative} (R-TEST-3, R-KEEP-1).`,
        );
      }
      if (path.basename(relative) === "tuple-registry.json") {
        throw new Error(
          `Packed tarball ships conformance asset file ${relative} (R-TEST-3, R-KEEP-1).`,
        );
      }
      if (relative.startsWith("template/")) {
        const content = readFileSync(absolute, "utf8");
        for (const marker of contentMarkers) {
          if (content.includes(marker)) {
            throw new Error(
              `Packed template file ${relative} carries conformance schema identifier ` +
                `\`${marker}\`; relocated conformance assets still may not ship (R-TEST-3, R-KEEP-1).`,
            );
          }
        }
      }
    }
  }
}

function rewritePackedSkillRegistry(packageRoot, baseUrl) {
  const registryPath = path.join(packageRoot, "skill-registry.json");
  const registry = JSON.parse(readFileSync(registryPath, "utf8"));

  registry.skills = registry.skills.map((entry) => ({
    ...entry,
    source: rewriteSkillSource(entry.source, baseUrl),
  }));

  writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
}

function rewriteSkillSource(source, baseUrl) {
  const normalizedSource = source.startsWith("url:") ? source.slice("url:".length) : source;
  const marker = "/packages/skills/";
  const markerIndex = normalizedSource.indexOf(marker);

  if (markerIndex === -1) {
    throw new Error(`Smoke pack could not map skill source ${source} to a local fixture.`);
  }

  const relativePath = normalizedSource.slice(markerIndex);
  return new URL(ensureTrailingSlash(relativePath), ensureTrailingSlash(baseUrl)).href;
}

async function startRepoFixtureServer(rootDir) {
  const fixtureScript = `
    import { createServer } from "node:http";
    import { readFileSync, statSync } from "node:fs";
    import path from "node:path";

    const rootDir = process.argv[1];

    function guessContentType(filePath) {
      if (filePath.endsWith(".md")) return "text/markdown; charset=utf-8";
      if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) return "application/yaml; charset=utf-8";
      if (filePath.endsWith(".py")) return "text/x-python; charset=utf-8";
      return "application/octet-stream";
    }

    const server = createServer((request, response) => {
      if (!request.url) {
        response.writeHead(400).end("Missing request URL");
        return;
      }

      const requestUrl = new URL(request.url, "http://127.0.0.1");
      const relativePath = decodeURIComponent(requestUrl.pathname);
      const absolutePath = path.resolve(rootDir, \`.\${relativePath}\`);
      const rootWithSep = \`\${rootDir}\${path.sep}\`;

      if (absolutePath !== rootDir && !absolutePath.startsWith(rootWithSep)) {
        response.writeHead(403).end("Forbidden");
        return;
      }

      let stats;
      try {
        stats = statSync(absolutePath);
      } catch {
        response.writeHead(404).end("Not Found");
        return;
      }

      if (!stats.isFile()) {
        response.writeHead(404).end("Not Found");
        return;
      }

      const body = readFileSync(absolutePath);
      response.writeHead(200, {
        "Content-Length": body.byteLength,
        "Content-Type": guessContentType(absolutePath),
      });

      if (request.method === "HEAD") {
        response.end();
        return;
      }

      response.end(body);
    });

    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        console.error("Smoke pack fixture server did not expose a TCP port.");
        process.exit(1);
        return;
      }

      process.stdout.write(\`\${address.port}\\n\`);
    });
  `;

  const serverProcess = spawn(process.execPath, ["--input-type=module", "-e", fixtureScript, rootDir], {
    stdio: ["ignore", "pipe", "inherit"],
  });

  const baseUrl = await new Promise((resolve, reject) => {
    const onExit = (code) => {
      reject(new Error(`Smoke pack fixture server exited before startup (code ${code ?? "null"}).`));
    };

    serverProcess.once("exit", onExit);
    serverProcess.stdout.once("data", (chunk) => {
      serverProcess.off("exit", onExit);
      resolve(`http://127.0.0.1:${String(chunk).trim()}`);
    });
    serverProcess.once("error", reject);
  });

  return {
    baseUrl,
    close: () =>
      new Promise((resolve) => {
        if (serverProcess.exitCode !== null) {
          resolve();
          return;
        }

        serverProcess.once("exit", () => resolve());
        serverProcess.kill();
      }),
  };
}

function assertExists(filePath, message) {
  if (!existsSync(filePath)) {
    throw new Error(message);
  }
}

function assertMissing(filePath, message) {
  if (existsSync(filePath)) {
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
    existsSync(path.join(backupRoot, entry)),
  );

  if (backupEntries.length !== 1) {
    throw new Error(
      `Expected exactly one smoke-pack backup directory, found ${backupEntries.join(", ") || "(none)"}.`,
    );
  }

  return path.join(backupRoot, backupEntries[0]);
}

function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}

/**
 * Minimal repo fixture for the `run playbook`/`run package` smokes: a
 * `docs/work/` anchor so repo-root discovery stays inside the fixture, plus
 * one accepted run-stack playbook (mirrors the tests/registry-package-ops
 * fixture shape).
 */
function writeRunPlaybookFixture(fixtureDir) {
  mkdirSync(path.join(fixtureDir, "docs/work"), { recursive: true });
  // Run state is keyed by the manifest-minted project identifier (PRD 35
  // R-STORE-2), so the fixture carries a minimal manifest with one.
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
function runPackedCliExpectingFailure(packedMakeDocs, args) {
  try {
    execFileSync("node", [packedMakeDocs, ...args], {
      encoding: "utf8",
      env: packedCliEnv,
    });
  } catch (error) {
    if (error && typeof error.status === "number" && error.status !== 0) {
      return { status: error.status, stdout: String(error.stdout ?? ""), stderr: String(error.stderr ?? "") };
    }
    throw error;
  }

  throw new Error(`Smoke pack expected \`make-docs ${args.join(" ")}\` to fail, but it exited 0.`);
}
