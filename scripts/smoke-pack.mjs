import { execFileSync, spawn } from "node:child_process";
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
      "--yes",
      "--target",
      targetDir,
    ],
    envKind: "npm",
  },
  {
    name: "pnpm dlx",
    command: "pnpm",
    args: (tarballPath, targetDir) => ["dlx", tarballPath, "--yes", "--target", targetDir],
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

const EXPECTED_SYSTEM_RESOURCE_PATHS = [
  ".make-docs/AGENTS.md",
  ".make-docs/CLAUDE.md",
  ".make-docs/contracts/system/commit-message-convention.md",
  ".make-docs/contracts/system/history-record-contract.md",
  ".make-docs/references/system/lifecycle.md",
  ".make-docs/references/system/prompts/request-to-design.prompt.md",
  ".make-docs/scripts/check_path_hygiene.py",
  ".make-docs/templates/system/work-index.md",
  ".make-docs/templates/system/work-phase.md",
];

const EXPECTED_SKILL_PATHS = [
  ".make-docs/agentics/skills/archive-docs/SKILL.md",
  ".make-docs/agentics/skills/archive-docs/agents/openai.yaml",
  ".make-docs/agentics/skills/archive-docs/references/archive-workflow.md",
  ".make-docs/agentics/skills/archive-docs/scripts/trace_relationships.py",
  ".make-docs/agentics/skills/closeout-commit/SKILL.md",
  ".make-docs/agentics/skills/closeout-commit/agents/openai.yaml",
  ".make-docs/agentics/skills/closeout-commit/references/closeout-commit-workflow.md",
  ".make-docs/agentics/skills/decompose-codebase/SKILL.md",
  ".make-docs/agentics/skills/decompose-codebase/references/mcp-playbook.md",
  ".make-docs/agentics/skills/decompose-codebase/assets/templates/decomposition-plan.md",
  ".make-docs/agentics/skills/work-on-phase/SKILL.md",
  ".make-docs/agentics/skills/work-on-phase/agents/openai.yaml",
  ".make-docs/agentics/skills/work-on-phase/references/phase-implementation-workflow.md",
  ".claude/skills/archive-docs",
  ".claude/skills/closeout-commit",
  ".claude/skills/decompose-codebase",
  ".claude/skills/work-on-phase",
  ".agents/skills/archive-docs",
  ".agents/skills/closeout-commit",
  ".agents/skills/decompose-codebase",
  ".agents/skills/work-on-phase",
];

const EXPECTED_RETIRED_SKILL_PATHS = [
  ".claude/skills/closeout-commit/scripts/closeout_probe.py",
  ".claude/skills/closeout-commit/scripts/closeout_validate.py",
  ".claude/skills/closeout-commit/scripts/closeout_history.py",
  ".claude/skills/work-on-phase/scripts/phase_gate.py",
  ".claude/skills/work-on-phase/scripts/scope_guard.py",
  ".agents/skills/closeout-commit/scripts/closeout_probe.py",
  ".agents/skills/closeout-commit/scripts/closeout_validate.py",
  ".agents/skills/closeout-commit/scripts/closeout_history.py",
  ".agents/skills/work-on-phase/scripts/phase_gate.py",
  ".agents/skills/work-on-phase/scripts/scope_guard.py",
];

const EXPECTED_DUPLICATED_SKILL_PAYLOAD_PATHS = [
  ".claude/skills/archive-docs/agents/openai.yaml",
  ".claude/skills/archive-docs/references/archive-workflow.md",
  ".claude/skills/archive-docs/scripts/trace_relationships.py",
  ".claude/skills/closeout-commit/agents/openai.yaml",
  ".claude/skills/closeout-commit/references/closeout-commit-workflow.md",
  ".claude/skills/work-on-phase/agents/openai.yaml",
  ".claude/skills/work-on-phase/references/phase-implementation-workflow.md",
  ".agents/skills/archive-docs/agents/openai.yaml",
  ".agents/skills/archive-docs/references/archive-workflow.md",
  ".agents/skills/archive-docs/scripts/trace_relationships.py",
  ".agents/skills/closeout-commit/agents/openai.yaml",
  ".agents/skills/closeout-commit/references/closeout-commit-workflow.md",
  ".agents/skills/work-on-phase/agents/openai.yaml",
  ".agents/skills/work-on-phase/references/phase-implementation-workflow.md",
];

const EXPECTED_ALL_SKILLS = [
  "archive-docs",
  "cleanup-docs",
  "closeout-commit",
  "closeout-phase",
  "decompose-codebase",
  "work-on-phase",
  "work-on-wave",
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
    assertManifestContainsManagedFiles(manifestPath, [
      ...EXPECTED_READER_ASSET_PATHS,
      ...EXPECTED_SYSTEM_RESOURCE_PATHS,
    ]);
    assertInstalledInstructionTemplate(targetDir);
    assertInstalledReaderFacingAssets(targetDir);
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
  assertMissing(
    path.join(packageRoot, "template/.make-docs/config.yaml"),
    "Packed template should not ship a default project config file.",
  );
  const packedMakeDocs = path.join(packageRoot, packedPackage.bin["make-docs"]);
  const skillsHelp = execFileSync("node", [packedMakeDocs, "skills", "--help"], {
    encoding: "utf8",
    env: packedCliEnv,
  });
  assertOutputContains(skillsHelp, "make-docs skills", "Smoke pack skills help omitted usage.");
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
      [packedMakeDocs, "skills", "--dry-run", "--target", targetDir],
      { encoding: "utf8", env: packedCliEnv },
    );
    assertOutputContains(
      skillsDryRun,
      "make-docs skills plan",
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
      [packedMakeDocs, "--yes", "--target", targetDir],
      { stdio: "inherit", env: packedCliEnv },
    );
    assertExists(
      path.join(targetDir, ".make-docs/manifest.json"),
      "Smoke pack bare install did not produce a manifest.",
    );
    assertMissing(
      path.join(targetDir, ".make-docs/config.yaml"),
      "Smoke pack bare install should not materialize an optional project config.",
    );
    assertExists(
      path.join(targetDir, "docs/AGENTS.md"),
      "Smoke pack bare install did not produce docs/AGENTS.md.",
    );
    assertStoreBootstrapAndNoRepoStateWrites(storeRoot, targetDir, "bare install");
    assertInstalledInstructionTemplate(targetDir);
    assertInstalledReaderFacingAssets(targetDir);
    assertManifestContainsManagedFiles(manifestPath, [
      ...EXPECTED_READER_ASSET_PATHS,
      ...EXPECTED_SYSTEM_RESOURCE_PATHS,
    ]);
    assertManifestOmitsProjectConfig(manifestPath);

    execFileSync(
      "node",
      [packedMakeDocs, "--yes", "--target", targetDir],
      { stdio: "inherit", env: packedCliEnv },
    );
    assertMissing(
      path.join(targetDir, ".make-docs/conflicts"),
      "Smoke pack bare sync staged conflicts for an unchanged install.",
    );
    assertManifestPackageName(manifestPath, EXPECTED_PACKAGE_NAME);
    assertManifestSkillFiles(manifestPath, 0);
    assertMissing(
      path.join(targetDir, ".claude/skills"),
      "Smoke pack bare install should not produce Claude Code skill files.",
    );
    assertMissing(
      path.join(targetDir, ".agents/skills"),
      "Smoke pack bare install should not produce Codex skill files.",
    );
    assertMissing(
      path.join(targetDir, ".make-docs/agentics/skills"),
      "Smoke pack bare install should not produce shared skill payloads.",
    );

    execFileSync(
      "node",
      [packedMakeDocs, "skills", "--yes", "--selected-skills", "all", "--target", targetDir],
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
  assertManifestOmitsSkillFiles(manifestPath, EXPECTED_RETIRED_SKILL_PATHS);
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
  for (const relativePath of EXPECTED_RETIRED_SKILL_PATHS) {
    assertMissing(
      path.join(targetDir, relativePath),
      `Smoke pack install should not produce retired helper script ${relativePath}.`,
    );
  }
  const skillsRemoveDryRun = execFileSync(
    "node",
    [packedMakeDocs, "skills", "--remove", "--dry-run", "--target", targetDir],
    { encoding: "utf8", env: packedCliEnv },
  );
  assertOutputContains(
    skillsRemoveDryRun,
    "make-docs skills removal plan",
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

  const customFilePath = path.join(targetDir, ".make-docs/templates/custom-smoke.md");
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
    [packedMakeDocs, "backup", "--yes", "--target", targetDir],
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
    [packedMakeDocs, "uninstall", "--yes", "--target", targetDir],
    { stdio: "inherit", env: packedCliEnv },
  );

  assertMissing(path.join(targetDir, "AGENTS.md"), "Smoke pack uninstall left AGENTS.md behind.");
  assertMissing(path.join(targetDir, "CLAUDE.md"), "Smoke pack uninstall left CLAUDE.md behind.");
  assertMissing(
    path.join(targetDir, ".make-docs/manifest.json"),
    "Smoke pack uninstall left the make-docs manifest behind.",
  );
  for (const relativePath of EXPECTED_SKILL_PATHS) {
    assertMissing(
      path.join(targetDir, relativePath),
      `Smoke pack uninstall left managed skill artifact ${relativePath} behind.`,
    );
  }
  assertExists(customFilePath, "Smoke pack uninstall removed an unmanaged custom file.");
  assertExists(customConfigPath, "Smoke pack uninstall removed project-owned config.");
  assertMissing(
    path.join(backupDir, ".make-docs/config.yaml"),
    "Smoke pack backup copied project-owned config as managed backup content.",
  );
  for (const relativePath of customReaderAssetPaths) {
    assertExists(
      path.join(targetDir, relativePath),
      `Smoke pack uninstall removed unmanaged reader-facing asset ${relativePath}.`,
    );
  }
  assertExists(backupRoot, "Smoke pack uninstall removed the .make-docs/backup directory.");
  assertExists(path.join(backupDir, "AGENTS.md"), "Smoke pack uninstall modified the backup tree.");
  assertExists(legacyBackupFile, "Smoke pack uninstall removed the legacy .backup directory.");

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
} finally {
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

function assertManifestContainsManagedFiles(manifestPath, expectedPaths) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const files = manifest.files && typeof manifest.files === "object" ? manifest.files : {};

  for (const expectedPath of expectedPaths) {
    const entry = files[expectedPath];
    if (!entry) {
      throw new Error(`Smoke pack manifest did not track managed file ${expectedPath}.`);
    }

    if (entry.sourceId !== `file:${expectedPath}`) {
      throw new Error(
        `Smoke pack manifest tracked ${expectedPath} with sourceId ${entry.sourceId}.`,
      );
    }
  }
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
  const agentsRoot = path.join(packageRoot, "template/AGENTS.md");
  const claudeRoot = path.join(packageRoot, "template/CLAUDE.md");
  const agentsContent = readFileSync(agentsRoot, "utf8");
  const claudeContent = readFileSync(claudeRoot, "utf8");
  const makeDocsAgentsPath = path.join(packageRoot, "template/.make-docs/AGENTS.md");
  const makeDocsClaudePath = path.join(packageRoot, "template/.make-docs/CLAUDE.md");

  assertExists(makeDocsAgentsPath, "Packed template omitted template/.make-docs/AGENTS.md.");
  assertExists(makeDocsClaudePath, "Packed template omitted template/.make-docs/CLAUDE.md.");
  assertOutputContains(
    readFileSync(makeDocsAgentsPath, "utf8"),
    ".make-docs/contracts/system/",
    "Packed .make-docs router omitted system contract routing.",
  );
  assertOutputContains(
    agentsContent,
    "<!-- make-docs:begin -->",
    "Packed AGENTS.md template omitted the managed block marker.",
  );
  assertOutputContains(
    agentsContent,
    "read the same-named instruction file in `docs/`",
    "Packed AGENTS.md template omitted the inline docs routing.",
  );
  assertOutputContains(
    agentsContent,
    "read `.make-docs/references/system/lifecycle.md`",
    "Packed AGENTS.md template omitted the inline lifecycle routing.",
  );
  if (claudeContent !== agentsContent) {
    throw new Error("Packed CLAUDE.md template did not mirror AGENTS.md.");
  }
  assertOutputExcludes(
    agentsContent,
    ".make-docs/AGENTS.md",
    "Packed AGENTS.md template still includes the dedicated instruction pointer.",
  );
  assertOutputExcludes(
    claudeContent,
    "@.make-docs/CLAUDE.md",
    "Packed CLAUDE.md template still includes the dedicated instruction import.",
  );
}

function assertPackedRouterGuidanceParity(packageRoot) {
  // W18 R10 runtime-state guidance: the packed `.make-docs/` routers must be
  // byte-identical to this repo's dogfood copies (upstream-first, then
  // dogfood), must no longer name `.make-docs/runs/` as a runtime-state
  // location, and must name the machine-level global store.
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
    assertOutputExcludes(
      packed,
      ".make-docs/runs",
      `Packed .make-docs/${name} still names .make-docs/runs/ as a runtime-state location.`,
    );
    assertOutputContains(
      packed,
      "~/.make-docs",
      `Packed .make-docs/${name} omitted the machine-level global store guidance.`,
    );
    assertOutputContains(
      packed,
      "work-execution evidence",
      `Packed .make-docs/${name} omitted the work-execution evidence relocation guidance.`,
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

function assertInstalledInstructionTemplate(targetDir) {
  const agentsContent = readFileSync(path.join(targetDir, "AGENTS.md"), "utf8");
  const claudeContent = readFileSync(path.join(targetDir, "CLAUDE.md"), "utf8");
  const makeDocsAgentsPath = path.join(targetDir, ".make-docs/AGENTS.md");
  const makeDocsClaudePath = path.join(targetDir, ".make-docs/CLAUDE.md");

  assertExists(makeDocsAgentsPath, "Smoke pack install omitted .make-docs/AGENTS.md.");
  assertExists(makeDocsClaudePath, "Smoke pack install omitted .make-docs/CLAUDE.md.");
  assertOutputContains(
    readFileSync(makeDocsAgentsPath, "utf8"),
    ".make-docs/contracts/system/",
    "Smoke pack .make-docs router omitted system contract routing.",
  );
  assertOutputContains(
    agentsContent,
    "<!-- make-docs:begin -->",
    "Smoke pack root AGENTS.md omitted the managed block marker.",
  );
  assertOutputContains(
    agentsContent,
    "read the same-named instruction file in `docs/`",
    "Smoke pack root AGENTS.md omitted the inline docs routing.",
  );
  assertOutputContains(
    agentsContent,
    "read `.make-docs/references/system/lifecycle.md`",
    "Smoke pack root AGENTS.md omitted the inline lifecycle routing.",
  );
  if (claudeContent !== agentsContent) {
    throw new Error("Smoke pack root CLAUDE.md did not mirror AGENTS.md.");
  }
  assertOutputExcludes(
    agentsContent,
    ".make-docs/AGENTS.md",
    "Smoke pack root AGENTS.md still includes the dedicated instruction pointer.",
  );
  assertOutputExcludes(
    claudeContent,
    "@.make-docs/CLAUDE.md",
    "Smoke pack root CLAUDE.md still includes the dedicated instruction import.",
  );
}

function assertInstalledReaderFacingAssets(targetDir) {
  for (const relativePath of EXPECTED_READER_ASSET_PATHS) {
    assertExists(
      path.join(targetDir, relativePath),
      `Smoke pack install did not produce ${relativePath}.`,
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
      path.join(targetDir, relativePath),
      `Smoke pack install still produced superseded default path ${relativePath}.`,
    );
  }

  const assetsRouter = readFileSync(path.join(targetDir, "docs/assets/AGENTS.md"), "utf8");
  assertOutputContains(
    assetsRouter,
    "docs/assets/library/<persona-slug>/",
    "Smoke pack assets router omitted the canonical library asset namespace.",
  );
  assertOutputContains(
    assetsRouter,
    "docs/assets/playbooks/<persona-slug>/",
    "Smoke pack assets router omitted the canonical playbook asset namespace.",
  );
  assertOutputContains(
    assetsRouter,
    "docs/assets/archive/**",
    "Smoke pack assets router omitted the archive namespace handoff.",
  );
  assertOutputContains(
    assetsRouter,
    "docs/assets/artifacts/**",
    "Smoke pack assets router omitted the artifact namespace handoff.",
  );
  assertOutputContains(
    assetsRouter,
    "docs/assets/archive/history/**",
    "Smoke pack assets router omitted the archive history namespace handoff.",
  );
  assertOutputExcludes(
    assetsRouter,
    "docs/assets/breadcrumbs/**",
    "Smoke pack assets router still advertises the superseded breadcrumb namespace.",
  );
  assertOutputExcludes(
    assetsRouter,
    "belong in `docs/archive/**`",
    "Smoke pack assets router still advertises top-level docs/archive as a target.",
  );
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
