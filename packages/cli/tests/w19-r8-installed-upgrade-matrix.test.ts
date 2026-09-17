import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createCompatibilityFixture,
  type CompatibilitySourceState,
} from "./compatibility-fixtures";

const candidateEntry = process.env.MAKE_DOCS_R8_UPGRADE_TEST_CLI;
const roots: string[] = [];
let testRoot: string;
let homeRoot: string;
let storeRoot: string;

interface CliResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

beforeEach(() => {
  if (
    candidateEntry === undefined ||
    !path.isAbsolute(candidateEntry) ||
    !existsSync(candidateEntry) ||
    !statSync(candidateEntry).isFile()
  ) {
    throw new Error(
      "MAKE_DOCS_R8_UPGRADE_TEST_CLI must name the installed candidate entry.",
    );
  }
  testRoot = path.join(
    os.tmpdir(),
    `make-docs-r8-installed-upgrade-${process.pid}-${Date.now()}`,
  );
  homeRoot = path.join(testRoot, "home");
  storeRoot = path.join(testRoot, "store");
  mkdirSync(homeRoot, { recursive: true });
  mkdirSync(storeRoot, { recursive: true });
  roots.push(testRoot);
});

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function runCandidate(
  projectRoot: string,
  args: string[],
): CliResult {
  const child = spawnSync(
    process.execPath,
    [candidateEntry!, ...args],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        HOME: homeRoot,
        MAKE_DOCS_HOME: storeRoot,
        CODEX_HOME: path.join(homeRoot, ".codex"),
        CLAUDE_CONFIG_DIR: path.join(homeRoot, ".claude"),
      },
      encoding: "utf8",
      timeout: 30_000,
    },
  );
  expect(child.error, child.stderr).toBeUndefined();
  return {
    status: child.status,
    stdout: child.stdout,
    stderr: child.stderr,
  };
}

function setupArgs(projectRoot: string, json = false): string[] {
  return [
    "setup",
    "--yes",
    "--codex-method",
    "none",
    "--claude-code-method",
    "none",
    "--target",
    projectRoot,
    ...(json ? ["--json"] : []),
  ];
}

function codexMcpSetupArgs(projectRoot: string, dryRun = false): string[] {
  return [
    "setup",
    "--target",
    projectRoot,
    ...(dryRun ? ["--dry-run"] : []),
    "--yes",
    "--codex-method",
    "mcp",
    "--claude-code-method",
    "none",
    "--project-resources",
    "contract,reference,prompt,template",
    "--json",
  ];
}

function sanitizedCodexConfig(): string {
  const skills = Array.from({ length: 21 }, (_, index) => [
    "[[skills.config]]",
    `name = "fixture-skill-${index + 1}"`,
    `enabled = ${index % 2 === 0}`,
    "[skills.config.metadata]",
    `source = "fixture-source-${index + 1}"`,
  ].join("\n")).join("\n\n");
  return `model = "fixture-model"\n\n${skills}\n`;
}

async function compatibilityFixture(state: CompatibilitySourceState) {
  const priorStore = process.env.MAKE_DOCS_HOME;
  process.env.MAKE_DOCS_HOME = storeRoot;
  try {
    const fixture = await createCompatibilityFixture({
      id: state,
      state,
      disposition:
        state === "clean-v1"
          ? "migrate"
          : state === "partial-install"
            ? "migrate-with-review"
            : "sync",
    });
    roots.push(fixture.targetDir);
    return fixture;
  } finally {
    if (priorStore === undefined) delete process.env.MAKE_DOCS_HOME;
    else process.env.MAKE_DOCS_HOME = priorStore;
  }
}

describe.skipIf(candidateEntry === undefined)("W19 R8 exact installed setup matrix", () => {
  it("preserves repeated Codex TOML array tables through exact setup and repair", () => {
    const projectRoot = path.join(testRoot, "codex-array-table-project");
    const configPath = path.join(homeRoot, ".codex", "config.toml");
    mkdirSync(projectRoot, { recursive: true });
    mkdirSync(path.dirname(configPath), { recursive: true });
    const original = sanitizedCodexConfig();
    writeFileSync(configPath, original);

    const dryRun = runCandidate(projectRoot, codexMcpSetupArgs(projectRoot, true));
    expect(dryRun.status, dryRun.stderr || dryRun.stdout).toBe(0);
    expect(JSON.parse(dryRun.stdout)).toMatchObject({ operation: "setup" });
    expect(readFileSync(configPath, "utf8")).toBe(original);

    const applied = runCandidate(projectRoot, codexMcpSetupArgs(projectRoot));
    expect(applied.status, applied.stderr || applied.stdout).toBe(0);
    expect(JSON.parse(applied.stdout)).toMatchObject({
      operation: "setup",
      status: "complete",
    });
    const configured = readFileSync(configPath, "utf8");
    expect(configured.startsWith(original)).toBe(true);
    expect(configured.match(/^\[\[skills\.config\]\]$/gm)).toHaveLength(21);
    expect(configured).toContain("# make-docs:begin harness-access codex mcp");

    const repeated = runCandidate(projectRoot, codexMcpSetupArgs(projectRoot));
    expect(repeated.status, repeated.stderr || repeated.stdout).toBe(0);
    expect(readFileSync(configPath, "utf8")).toBe(configured);

    writeFileSync(configPath, original);

    const repaired = runCandidate(projectRoot, codexMcpSetupArgs(projectRoot));
    expect(repaired.status, repaired.stderr || repaired.stdout).toBe(0);
    const repairedConfig = readFileSync(configPath, "utf8");
    expect(repairedConfig.startsWith(original)).toBe(true);
    expect(repairedConfig.match(/^\[\[skills\.config\]\]$/gm)).toHaveLength(21);
    expect(repairedConfig).toContain("# make-docs:begin harness-access codex mcp");
  }, 60_000);

  it("runs fresh setup, repeated setup, and recovery after an invalid option", () => {
    const projectRoot = path.join(testRoot, "fresh-project");
    mkdirSync(projectRoot, { recursive: true });

    const invalid = runCandidate(projectRoot, [
      "setup",
      "--invalid-w19-r8-option",
      "--target",
      projectRoot,
    ]);
    expect(invalid.status).not.toBe(0);
    expect(`${invalid.stdout}\n${invalid.stderr}`).toContain(
      "Unknown argument: --invalid-w19-r8-option",
    );
    expect(existsSync(path.join(projectRoot, ".make-docs/config.yaml"))).toBe(false);

    const fresh = runCandidate(projectRoot, setupArgs(projectRoot, true));
    expect(fresh.status, fresh.stderr || fresh.stdout).toBe(0);
    expect(JSON.parse(fresh.stdout)).toMatchObject({
      operation: "setup",
      status: "complete",
    });

    const repeated = runCandidate(projectRoot, setupArgs(projectRoot, true));
    expect(repeated.status, repeated.stderr || repeated.stdout).toBe(0);
    expect(JSON.parse(repeated.stdout)).toMatchObject({
      operation: "setup",
      status: "complete",
    });
  });

  it("keeps a v1 install unchanged and gives the reachable migration review", async () => {
    const fixture = await compatibilityFixture("clean-v1");
    const manifestPath = path.join(fixture.targetDir, ".make-docs/manifest.json");
    const manifestBefore = readFileSync(manifestPath, "utf8");

    const result = runCandidate(fixture.targetDir, setupArgs(fixture.targetDir));

    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stdout).toContain("pre-v2 make-docs install was detected");
    expect(result.stdout).toContain(
      "Setup cancelled. The existing pre-v2 install was left untouched.",
    );
    expect(readFileSync(manifestPath, "utf8")).toBe(manifestBefore);
  });

  it("updates an early v2 full-snapshot install and is safe to run again", async () => {
    const fixture = await compatibilityFixture("clean-v2-full-snapshot");

    const first = runCandidate(fixture.targetDir, setupArgs(fixture.targetDir, true));
    expect(first.status, first.stderr || first.stdout).toBe(0);
    expect(JSON.parse(first.stdout)).toMatchObject({
      operation: "setup",
      status: "complete",
    });

    const repeated = runCandidate(fixture.targetDir, setupArgs(fixture.targetDir, true));
    expect(repeated.status, repeated.stderr || repeated.stdout).toBe(0);
    expect(JSON.parse(repeated.stdout)).toMatchObject({
      operation: "setup",
      status: "complete",
    });
  });

  it("repairs a partial install and is safe to run again", async () => {
    const fixture = await compatibilityFixture("partial-install");

    const first = runCandidate(fixture.targetDir, setupArgs(fixture.targetDir, true));
    expect(first.status, first.stderr || first.stdout).toBe(0);
    expect(JSON.parse(first.stdout)).toMatchObject({
      operation: "setup",
      status: "complete",
    });

    const repeated = runCandidate(fixture.targetDir, setupArgs(fixture.targetDir, true));
    expect(repeated.status, repeated.stderr || repeated.stdout).toBe(0);
    expect(JSON.parse(repeated.stdout)).toMatchObject({
      operation: "setup",
      status: "complete",
    });
  });
});
