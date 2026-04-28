import { beforeEach, afterEach, describe, expect, test, vi } from "vitest";
import { existsSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { applyInstallPlan, planInstall } from "../src/install";
import { loadManifest } from "../src/manifest";
import { defaultSelections } from "../src/profile";
import { createTempDir, cleanupTempDir, mockSkillFetches } from "./helpers";

const runSelectionWizardMock = vi.fn();
const promptForInstructionConflictResolutionsMock = vi.fn();
const confirmMock = vi.fn();
const runUninstallCommandMock = vi.fn();
const runSkillsCommandMock = vi.fn();

vi.mock("../src/wizard", () => ({
  runSelectionWizard: runSelectionWizardMock,
  promptForInstructionConflictResolutions: promptForInstructionConflictResolutionsMock,
}));

vi.mock("@clack/prompts", async () => {
  const actual = await vi.importActual<typeof import("@clack/prompts")>("@clack/prompts");

  return {
    ...actual,
    confirm: confirmMock,
    isCancel: (value: unknown) => value === "cancelled",
  };
});

function setTTY(value: boolean) {
  Object.defineProperty(process.stdin, "isTTY", {
    configurable: true,
    value,
  });
  Object.defineProperty(process.stdout, "isTTY", {
    configurable: true,
    value,
  });
}

async function installManifest(
  targetDir: string,
  configure?: (selections: ReturnType<typeof defaultSelections>) => void,
) {
  const selections = defaultSelections();
  configure?.(selections);
  const plan = await planInstall({
    targetDir,
    selections,
    existingManifest: loadManifest(targetDir),
  });

  applyInstallPlan({
    targetDir,
    plan,
    existingManifest: loadManifest(targetDir),
  });
}

function mockHomeDirectory(homeDir: string): () => void {
  const previousHome = process.env.HOME;
  process.env.HOME = homeDir;
  vi.spyOn(os, "homedir").mockReturnValue(homeDir);

  return () => {
    if (previousHome === undefined) {
      delete process.env.HOME;
      return;
    }

    process.env.HOME = previousHome;
  };
}

async function captureCliOutput(argv: string[]): Promise<string> {
  const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

  try {
    const { runCli } = await import("../src/cli");

    await runCli(argv);
    return writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
  } finally {
    writeSpy.mockRestore();
  }
}

async function captureCliError(argv: string[]): Promise<Error> {
  const { runCli } = await import("../src/cli");

  try {
    await runCli(argv);
  } catch (error) {
    if (error instanceof Error) {
      return error;
    }

    throw error;
  }

  throw new Error(`Expected CLI invocation to fail: ${argv.join(" ")}`);
}

describe("cli interactive flows", () => {
  beforeEach(() => {
    runSelectionWizardMock.mockReset();
    promptForInstructionConflictResolutionsMock.mockReset();
    confirmMock.mockReset();
    runUninstallCommandMock.mockReset();
    runSkillsCommandMock.mockReset();
    mockSkillFetches();
    setTTY(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("uses the wizard for interactive apply without an existing manifest", async () => {
    const targetDir = createTempDir();
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    try {
      runSelectionWizardMock.mockResolvedValue(defaultSelections());
      const { runCli } = await import("../src/cli");

      await runCli(["--target", targetDir]);

      expect(runSelectionWizardMock).toHaveBeenCalledWith({
        initialSelections: expect.objectContaining({
          capabilities: expect.objectContaining({ designs: true, plans: true, prd: true, work: true }),
        }),
        introTitle: "Let's configure your make-docs install",
      });
      expect(promptForInstructionConflictResolutionsMock).not.toHaveBeenCalled();
      expect(confirmMock).not.toHaveBeenCalled();
      expect(writeSpy).toHaveBeenCalled();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("uses the wizard for reconfigure", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir, (selections) => {
        selections.capabilities.work = false;
        selections.skills = false;
      });
      const wizardSelections = defaultSelections();
      wizardSelections.capabilities.work = false;
      wizardSelections.skills = false;
      runSelectionWizardMock.mockResolvedValue(wizardSelections);
      const { runCli } = await import("../src/cli");

      await runCli(["reconfigure", "--target", targetDir]);

      expect(runSelectionWizardMock).toHaveBeenCalledWith({
        initialSelections: expect.objectContaining({
          capabilities: expect.objectContaining({ designs: true, plans: true, prd: true, work: false }),
          skills: false,
        }),
        introTitle: "Let's reconfigure your make-docs install",
      });
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("syncs saved selections on a bare interactive apply without opening the wizard", async () => {
    const targetDir = createTempDir();
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    try {
      await installManifest(targetDir, (selections) => {
        selections.capabilities.work = false;
        selections.skills = false;
      });
      const { runCli } = await import("../src/cli");

      await runCli(["--target", targetDir]);

      const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
      expect(runSelectionWizardMock).not.toHaveBeenCalled();
      expect(confirmMock).not.toHaveBeenCalled();
      expect(output).toContain("Information");
      expect(output).toContain("Mode: existing install sync");
      expect(output).toContain("Manifest:");
      expect(output).toContain(".make-docs/manifest.json");
      expect(output).toContain("(found)");
      expect(output).toContain("Selection source: saved manifest selections");
      expect(output).toContain("Changes planned: 0");
      expect(output).toContain("Results");
      expect(output).toContain("No managed file changes are needed.");
      expect(output).toContain("Every managed file already matched");
      expect(output).not.toContain("found an existing manifest");
      expect(output).not.toContain("It compared the saved selections");
      expect(output).not.toContain("make-docs is already up to date");
      expect(loadManifest(targetDir)?.selections.capabilities.work).toBe(false);
      expect(loadManifest(targetDir)?.selections.skills).toBe(false);
    } finally {
      writeSpy.mockRestore();
      cleanupTempDir(targetDir);
    }
  });

  test("installs default selections on a bare non-interactive apply", async () => {
    const targetDir = createTempDir();

    try {
      setTTY(false);
      const { runCli } = await import("../src/cli");

      await runCli(["--yes", "--target", targetDir]);

      const manifest = loadManifest(targetDir);
      expect(runSelectionWizardMock).not.toHaveBeenCalled();
      expect(confirmMock).not.toHaveBeenCalled();
      expect(manifest?.selections.capabilities).toEqual({
        designs: true,
        plans: true,
        prd: true,
        work: true,
      });
      expect(manifest?.selections.skills).toBe(true);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("syncs saved selections on a bare non-interactive apply", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir, (selections) => {
        selections.capabilities.work = false;
        selections.skills = false;
      });
      setTTY(false);
      const { runCli } = await import("../src/cli");

      await runCli(["--yes", "--target", targetDir]);

      expect(runSelectionWizardMock).not.toHaveBeenCalled();
      expect(confirmMock).not.toHaveBeenCalled();
      expect(loadManifest(targetDir)?.selections.capabilities.work).toBe(false);
      expect(loadManifest(targetDir)?.selections.skills).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("preserves non-interactive flag behavior with --yes", async () => {
    const targetDir = createTempDir();

    try {
      const { runCli } = await import("../src/cli");

      await runCli(["--yes", "--no-work", "--target", targetDir]);

      expect(runSelectionWizardMock).not.toHaveBeenCalled();
      expect(promptForInstructionConflictResolutionsMock).not.toHaveBeenCalled();
      expect(loadManifest(targetDir)?.selections.capabilities.work).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("applies selection flags on a bare existing install", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir);
      const claudeSkillPath = path.join(targetDir, ".claude/skills/archive-docs/SKILL.md");
      const codexSkillPath = path.join(targetDir, ".agents/skills/archive-docs/SKILL.md");
      expect(existsSync(claudeSkillPath)).toBe(true);
      expect(existsSync(codexSkillPath)).toBe(true);
      const { runCli } = await import("../src/cli");

      await runCli(["--yes", "--no-skills", "--target", targetDir]);

      expect(runSelectionWizardMock).not.toHaveBeenCalled();
      expect(loadManifest(targetDir)?.selections.skills).toBe(false);
      expect(loadManifest(targetDir)?.selections.optionalSkills).toEqual([]);
      expect(existsSync(claudeSkillPath)).toBe(false);
      expect(existsSync(codexSkillPath)).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("prompts for instruction conflict resolutions when selected agent files already exist", async () => {
    const targetDir = createTempDir();

    try {
      writeFileSync(path.join(targetDir, "AGENTS.md"), "custom root agents\n", "utf8");
      runSelectionWizardMock.mockResolvedValue(defaultSelections());
      promptForInstructionConflictResolutionsMock.mockResolvedValue({
        "AGENTS.md": "update",
      });
      const { runCli } = await import("../src/cli");

      await runCli(["--target", targetDir]);

      expect(promptForInstructionConflictResolutionsMock).toHaveBeenCalledWith([
        {
          relativePath: "AGENTS.md",
          instructionKind: "AGENTS.md",
          reason: "Unmanaged file already exists with different content.",
        },
      ]);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("supports canonical harness and skill flags for non-interactive apply", async () => {
    const targetDir = createTempDir();
    const fakeHome = createTempDir("make-docs-home-");
    const restoreHome = mockHomeDirectory(fakeHome);

    try {
      const { runCli } = await import("../src/cli");

      await runCli([
        "--yes",
        "--no-codex",
        "--skill-scope",
        "global",
        "--optional-skills",
        "decompose-codebase",
        "--target",
        targetDir,
      ]);

      const manifest = loadManifest(targetDir);
      expect(manifest?.selections.harnesses).toEqual({
        "claude-code": true,
        codex: false,
      });
      expect(manifest?.selections.skills).toBe(true);
      expect(manifest?.selections.skillScope).toBe("global");
      expect(manifest?.selections.optionalSkills).toEqual(["decompose-codebase"]);
      expect(manifest?.skillFiles).toContain(
        path.join(fakeHome, ".claude/skills/decompose-codebase/SKILL.md"),
      );
      expect(manifest?.skillFiles).not.toContain(
        path.join(fakeHome, ".agents/skills/decompose-codebase/SKILL.md"),
      );
    } finally {
      restoreHome();
      cleanupTempDir(targetDir);
      cleanupTempDir(fakeHome);
    }
  });

  test.each([
    ["--no-claude-code", { "claude-code": false, codex: true }],
    ["--no-codex", { "claude-code": true, codex: false }],
  ])("applies %s to the harness selections", async (flag, expectedHarnesses) => {
    const targetDir = createTempDir();

    try {
      const { runCli } = await import("../src/cli");

      await runCli(["--yes", flag, "--target", targetDir]);

      expect(loadManifest(targetDir)?.selections.harnesses).toEqual(expectedHarnesses);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("supports --no-skills for non-interactive apply", async () => {
    const targetDir = createTempDir();

    try {
      const { runCli } = await import("../src/cli");

      await runCli(["--yes", "--no-skills", "--target", targetDir]);

      const manifest = loadManifest(targetDir);
      expect(manifest?.selections.skills).toBe(false);
      expect(manifest?.selections.optionalSkills).toEqual([]);
      expect(manifest?.skillFiles).toEqual([]);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test.each(["project", "global"] as const)(
    "supports --skill-scope %s for non-interactive apply",
    async (skillScope) => {
      const targetDir = createTempDir();
      const fakeHome = skillScope === "global" ? createTempDir("make-docs-home-") : null;
      const restoreHome = fakeHome ? mockHomeDirectory(fakeHome) : null;

      try {
        const { runCli } = await import("../src/cli");

        await runCli(["--yes", "--skill-scope", skillScope, "--target", targetDir]);

        const manifest = loadManifest(targetDir);
        expect(manifest?.selections.skills).toBe(true);
        expect(manifest?.selections.skillScope).toBe(skillScope);
      } finally {
        restoreHome?.();
        cleanupTempDir(targetDir);
        if (fakeHome) {
          cleanupTempDir(fakeHome);
        }
      }
    },
  );

  test("routes skills removal through the skills command boundary", async () => {
    const targetDir = createTempDir();
    const cli = await import("../src/cli");

    try {
      cli.__setSkillsCommandRunnerForTests(runSkillsCommandMock);

      await cli.runCli([
        "skills",
        "--yes",
        "--dry-run",
        "--remove",
        "--no-codex",
        "--no-claude-code",
        "--skill-scope",
        "global",
        "--target",
        targetDir,
      ]);

      expect(runSkillsCommandMock).toHaveBeenCalledTimes(1);
      expect(runSkillsCommandMock).toHaveBeenCalledWith({
        targetDir: path.resolve(targetDir),
        dryRun: true,
        yes: true,
        remove: true,
        noCodex: true,
        noClaudeCode: true,
        skillScope: "global",
        optionalSkills: undefined,
      });
    } finally {
      cli.__setSkillsCommandRunnerForTests(null);
      cleanupTempDir(targetDir);
    }
  });

  test("parses skills sync options without entering the apply path", async () => {
    const targetDir = createTempDir();
    const cli = await import("../src/cli");

    try {
      cli.__setSkillsCommandRunnerForTests(runSkillsCommandMock);

      await cli.runCli([
        "skills",
        "--yes",
        "--optional-skills",
        "decompose-codebase",
        "--target",
        targetDir,
      ]);

      expect(runSelectionWizardMock).not.toHaveBeenCalled();
      expect(runSkillsCommandMock).toHaveBeenCalledTimes(1);
      expect(runSkillsCommandMock).toHaveBeenCalledWith({
        targetDir: path.resolve(targetDir),
        dryRun: false,
        yes: true,
        remove: false,
        noCodex: false,
        noClaudeCode: false,
        skillScope: undefined,
        optionalSkills: ["decompose-codebase"],
      });
    } finally {
      cli.__setSkillsCommandRunnerForTests(null);
      cleanupTempDir(targetDir);
    }
  });

  test("skills removal without a manifest does not create one", async () => {
    const targetDir = createTempDir();
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    try {
      const { runCli } = await import("../src/cli");

      await runCli(["skills", "--yes", "--remove", "--target", targetDir]);

      const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
      expect(output).toContain("No make-docs skill changes are needed.");
      expect(existsSync(path.join(targetDir, ".make-docs/manifest.json"))).toBe(
        false,
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("skills removal with no tracked skills is a no-op", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir, (selections) => {
        selections.skills = false;
      });

      const output = await captureCliOutput(["skills", "--yes", "--remove", "--target", targetDir]);
      const manifest = loadManifest(targetDir);

      expect(output).toContain("make-docs skills removal plan");
      expect(output).toContain("Removal scope: all manifest-tracked skill files");
      expect(output).toContain("No make-docs skill changes are needed.");
      expect(manifest?.skillFiles).toEqual([]);
      expect(existsSync(path.join(targetDir, "docs/AGENTS.md"))).toBe(true);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("skills sync output uses skills-specific language", async () => {
    const targetDir = createTempDir();

    try {
      const output = await captureCliOutput(["skills", "--yes", "--target", targetDir]);

      expect(output).toContain("make-docs skills plan");
      expect(output).toContain("Planned skill file operations:");
      expect(output).toContain(".claude/skills/archive-docs/SKILL.md");
      expect(output).toContain(".agents/skills/archive-docs/SKILL.md");
      expect(output).toContain("Installed skills");
      expect(output).not.toContain("Installed make-docs");
      expect(output).not.toContain("Reconfigured make-docs");
      expect(output).not.toContain("docs/assets/prompts");
      expect(output).not.toContain("docs/assets/templates");
      expect(output).not.toContain("docs/assets/references");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test.each([
    ["--no-claude", { "claude-code": false, codex: true }],
    ["--no-agents", { "claude-code": true, codex: false }],
  ])("supports deprecated harness alias %s", async (flag, expectedHarnesses) => {
    const targetDir = createTempDir();

    try {
      const { runCli } = await import("../src/cli");

      await runCli(["--yes", flag, "--target", targetDir]);

      expect(loadManifest(targetDir)?.selections.harnesses).toEqual(expectedHarnesses);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("supports deprecated harness aliases for backward compatibility", async () => {
    const targetDir = createTempDir();

    try {
      const { runCli } = await import("../src/cli");

      await runCli(["--yes", "--no-agents", "--no-claude", "--target", targetDir]);

      expect(loadManifest(targetDir)?.selections.harnesses).toEqual({
        "claude-code": false,
        codex: false,
      });
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("reconfigure can disable skills while preserving the stored skill scope", async () => {
    const targetDir = createTempDir();
    const fakeHome = createTempDir("make-docs-home-");
    const restoreHome = mockHomeDirectory(fakeHome);

    try {
      await installManifest(targetDir, (selections) => {
        selections.skillScope = "global";
        selections.optionalSkills = ["decompose-codebase"];
      });
      const { runCli } = await import("../src/cli");

      await runCli(["reconfigure", "--yes", "--no-skills", "--target", targetDir]);

      const manifest = loadManifest(targetDir);
      expect(manifest?.selections.skills).toBe(false);
      expect(manifest?.selections.skillScope).toBe("global");
      expect(manifest?.selections.optionalSkills).toEqual([]);
      expect(
        existsSync(path.join(targetDir, ".claude/skills/decompose-codebase/SKILL.md")),
      ).toBe(false);
    } finally {
      restoreHome();
      cleanupTempDir(targetDir);
      cleanupTempDir(fakeHome);
    }
  });

  test("reconfigure can clear optional skills and change the skill scope", async () => {
    const targetDir = createTempDir();
    const fakeHome = createTempDir("make-docs-home-");
    const restoreHome = mockHomeDirectory(fakeHome);

    try {
      await installManifest(targetDir, (selections) => {
        selections.skillScope = "global";
        selections.optionalSkills = ["decompose-codebase"];
      });
      const { runCli } = await import("../src/cli");

      await runCli([
        "reconfigure",
        "--yes",
        "--skill-scope",
        "project",
        "--optional-skills",
        "none",
        "--target",
        targetDir,
      ]);

      const manifest = loadManifest(targetDir);
      expect(manifest?.selections.skills).toBe(true);
      expect(manifest?.selections.skillScope).toBe("project");
      expect(manifest?.selections.optionalSkills).toEqual([]);
      expect(existsSync(path.join(targetDir, ".claude/skills/archive-docs/SKILL.md"))).toBe(true);
      expect(
        existsSync(path.join(targetDir, ".claude/skills/decompose-codebase/SKILL.md")),
      ).toBe(false);
    } finally {
      restoreHome();
      cleanupTempDir(targetDir);
      cleanupTempDir(fakeHome);
    }
  });

  test("rejects non-interactive reconfigure without selection flags", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir);

      const error = await captureCliError([
        "reconfigure",
        "--yes",
        "--target",
        targetDir,
      ]);

      expect(error.message).toContain("requires at least one selection flag");
      expect(error.message).toContain("make-docs reconfigure");
      expect(runSelectionWizardMock).not.toHaveBeenCalled();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("rejects reconfigure without a manifest with first-run guidance", async () => {
    const targetDir = createTempDir();

    try {
      const error = await captureCliError(["reconfigure", "--target", targetDir]);

      expect(error.message).toContain("No make-docs manifest");
      expect(error.message).toContain("Run `make-docs` first");
      expect(runSelectionWizardMock).not.toHaveBeenCalled();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("rejects conflicting and invalid optional-skill selections", async () => {
    const targetDir = createTempDir();

    try {
      const { runCli } = await import("../src/cli");

      await expect(
        runCli([
          "--yes",
          "--no-skills",
          "--skill-scope",
          "global",
          "--target",
          targetDir,
        ]),
      ).rejects.toThrow(
        "`--no-skills` cannot be combined with `--skill-scope` or `--optional-skills`.",
      );

      await expect(
        runCli([
          "--yes",
          "--optional-skills",
          "archive-docs",
          "--target",
          targetDir,
        ]),
      ).rejects.toThrow(
        "Required skill `archive-docs` cannot be passed to `--optional-skills`.",
      );

      await expect(
        runCli([
          "--yes",
          "--optional-skills",
          "unknown-skill",
          "--target",
          targetDir,
        ]),
      ).rejects.toThrow(
        "Unknown optional skill `unknown-skill`. Valid optional skills: decompose-codebase.",
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test.each([
    [["--no-designs"], ["--no-designs", "make-docs skills"]],
  ])("rejects content selection flags under skills %s", async (argv, messageParts) => {
    const targetDir = createTempDir();

    try {
      const error = await captureCliError(["skills", ...argv, "--target", targetDir]);

      for (const part of messageParts) {
        expect(error.message).toContain(part);
      }
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test.each([
    ["--no-prompts"],
    ["--templates"],
    ["--references"],
  ])("rejects removed asset-selection flag %s", async (flag) => {
    const targetDir = createTempDir();

    try {
      const error = await captureCliError([flag, "--target", targetDir]);

      expect(error.message).toContain(`Unknown argument: ${flag}`);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("rejects optional skill selection during skills removal", async () => {
    const targetDir = createTempDir();

    try {
      const error = await captureCliError([
        "skills",
        "--remove",
        "--optional-skills",
        "decompose-codebase",
        "--target",
        targetDir,
      ]);

      expect(error.message).toContain(
        "`--optional-skills` cannot be combined with `make-docs skills --remove`.",
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test.each([
    [["--remove"], ["--remove", "no command"]],
    [["reconfigure", "--remove"], ["--remove", "reconfigure"]],
    [["--skills"], ["Unknown argument", "--skills"]],
  ])("rejects invalid root and cross-command skills flags for %s", async (argv, messageParts) => {
    const targetDir = createTempDir();

    try {
      const error = await captureCliError([...argv, "--target", targetDir]);

      for (const part of messageParts) {
        expect(error.message).toContain(part);
      }
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("prints structured top-level help with the public command model", async () => {
    setTTY(false);

    const output = await captureCliOutput(["--help"]);

    expect(output).toMatch(/make-docs/i);
    expect(output).toMatch(/\bCommands\b/i);
    expect(output).toMatch(/\bExamples\b/i);
    expect(output).toContain("make-docs [options]");
    expect(output).toContain("install into a new target or sync an existing manifest");
    expect(output).toContain("make-docs reconfigure");
    expect(output).toContain("make-docs skills");
    expect(output).toContain("make-docs backup");
    expect(output).toContain("make-docs uninstall");
    expect(output).toContain("reconfigure  Change saved selections for an existing install.");
    expect(output).toContain("skills       Sync or remove managed skills.");
    expect(output).toContain("backup       Create a backup of managed files.");
    expect(output).toContain("uninstall    Remove managed files, with an optional backup first.");
    expect(output).not.toContain("make-docs init");
    expect(output).not.toContain("make-docs update");
    expect(output).not.toContain("--reconfigure");
    expect(output).not.toContain("--skills");
    expect(output).toMatch(/--help/i);
  });

  test("documents reconfigure selection-change behavior", async () => {
    setTTY(false);

    const output = await captureCliOutput(["reconfigure", "--help"]);

    expect(output).toContain("Requires an existing .make-docs/manifest.json");
    expect(output).toContain("Interactive runs open the selection wizard");
    expect(output).toContain("Non-interactive runs with --yes must include at least one selection flag");
    expect(output).toContain("--yes                          Skip interactive prompts; requires a selection flag.");
    expect(output).toContain("make-docs reconfigure --yes --no-work");
    expect(output).toContain("--optional-skills <csv|none>");
    expect(output).not.toContain("--no-prompts");
    expect(output).not.toContain("--templates required|all");
    expect(output).not.toContain("--references required|all");
    expect(output).not.toContain("make-docs init");
    expect(output).not.toContain("make-docs update");
    expect(output).not.toContain("--reconfigure");
  });

  test("documents skills command help with skills-specific options", async () => {
    setTTY(false);

    const output = await captureCliOutput(["skills", "--help"]);

    expect(output).toContain("make-docs skills");
    expect(output).toContain("Sync or remove managed make-docs skills");
    expect(output).toContain("Usage:");
    expect(output).toContain("General options:");
    expect(output).toContain("Platform options:");
    expect(output).toContain("Skill options:");
    expect(output).toContain("--remove");
    expect(output).toContain("--skill-scope project|global");
    expect(output).toContain("--optional-skills <csv|none>");
    expect(output).toContain("make-docs skills --dry-run");
    expect(output).toContain("make-docs skills --remove");
    expect(output).toContain("make-docs skills --skill-scope global");
    expect(output).not.toContain("--no-designs");
    expect(output).not.toContain("--templates required|all");
    expect(output).not.toContain("--skills");
  });

  test.each([
    ["reconfigure", ["Usage", "Options", "Examples", "make-docs reconfigure"]],
    ["skills", ["Usage", "Skill options", "Examples", "make-docs skills"]],
    ["backup", ["Usage", "Options", "Examples", "make-docs backup"]],
    ["uninstall", ["Usage", "Options", "Examples", "make-docs uninstall"]],
  ])("prints command-specific help for %s", async (command, snippets) => {
    setTTY(false);

    const output = await captureCliOutput([command, "--help"]);

    for (const snippet of snippets) {
      expect(output).toContain(snippet);
    }
  });

  test.each([
    [["init", "--yes"], ["`init` command was removed", "make-docs --yes"]],
    [["update", "--yes"], ["`update` command was removed", "make-docs --yes"]],
    [["--reconfigure"], ["`--reconfigure` was removed", "make-docs reconfigure"]],
    [
      ["update", "--reconfigure", "--yes"],
      ["`update --reconfigure` command was removed", "make-docs reconfigure"],
    ],
  ])("reports migration guidance for removed command surface %s", async (argv, messageParts) => {
    const targetDir = createTempDir();

    try {
      const error = await captureCliError([...argv, "--target", targetDir]);

      for (const part of messageParts) {
        expect(error.message).toContain(part);
      }
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("documents backup help with lifecycle-specific options", async () => {
    setTTY(false);

    const output = await captureCliOutput(["backup", "--help"]);

    expect(output).toContain("make-docs backup");
    expect(output).toContain("--target");
    expect(output).toContain("--yes");
    expect(output).toContain("Skip confirmation prompts");
    expect(output).toContain("non-destructive");
    expect(output).toContain("source files remain in place");
    expect(output).toContain("--help");
    expect(output).not.toContain("--no-skills");
  });

  test("documents uninstall help with backup and yes options", async () => {
    setTTY(false);

    const output = await captureCliOutput(["uninstall", "--help"]);

    expect(output).toContain("make-docs uninstall");
    expect(output).toContain("--target");
    expect(output).toContain("--backup");
    expect(output).toContain("--yes");
    expect(output).toContain("Skip confirmation prompts");
    expect(output).toContain("destructive");
    expect(output).toContain("audited managed files are removed");
    expect(output).toContain("--help");
    expect(output).not.toContain("--optional-skills");
  });

  test("keeps uninstall help on the help path without dispatching lifecycle work", async () => {
    setTTY(false);

    const output = await captureCliOutput(["uninstall", "--help"]);

    expect(output).toContain("make-docs uninstall");
    expect(runUninstallCommandMock).not.toHaveBeenCalled();
  });

  test("routes backup through the implemented lifecycle flow", async () => {
    const targetDir = createTempDir();

    try {
      setTTY(false);
      const output = await captureCliOutput([
        "backup",
        "--yes",
        "--target",
        targetDir,
      ]);

      expect(output).toContain("make-docs backup");
      expect(output).toContain("No make-docs-managed files required backup.");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("defaults backup to confirmation mode", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir, (selections) => {
        selections.skills = false;
      });
      confirmMock.mockResolvedValue(false);
      const { runCli } = await import("../src/cli");

      await runCli(["backup", "--target", targetDir]);

      expect(confirmMock).toHaveBeenCalledTimes(1);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("uses --yes to skip backup confirmation prompts", async () => {
    const targetDir = createTempDir();

    try {
      setTTY(false);
      const { runCli } = await import("../src/cli");

      await runCli(["backup", "--yes", "--target", targetDir]);

      expect(confirmMock).not.toHaveBeenCalled();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("routes uninstall through the implemented lifecycle flow", async () => {
    const targetDir = createTempDir();
    const cli = await import("../src/cli");

    try {
      cli.__setUninstallCommandLoaderForTests(async () => runUninstallCommandMock);

      await cli.runCli([
        "uninstall",
        "--backup",
        "--yes",
        "--target",
        targetDir,
      ]);

      expect(runUninstallCommandMock).toHaveBeenCalledTimes(1);
      expect(runUninstallCommandMock).toHaveBeenCalledWith({
        targetDir: path.resolve(targetDir),
        backup: true,
        permissions: "allow-all",
      });
    } finally {
      cli.__setUninstallCommandLoaderForTests(null);
      cleanupTempDir(targetDir);
    }
  });

  test("defaults uninstall to confirmation mode", async () => {
    const targetDir = createTempDir();
    const cli = await import("../src/cli");

    try {
      cli.__setUninstallCommandLoaderForTests(async () => runUninstallCommandMock);

      await cli.runCli(["uninstall", "--target", targetDir]);

      expect(runUninstallCommandMock).toHaveBeenCalledTimes(1);
      expect(runUninstallCommandMock).toHaveBeenCalledWith({
        targetDir: path.resolve(targetDir),
        backup: false,
        permissions: "confirm",
      });
    } finally {
      cli.__setUninstallCommandLoaderForTests(null);
      cleanupTempDir(targetDir);
    }
  });

  test("uses --yes to skip uninstall confirmation prompts", async () => {
    const targetDir = createTempDir();
    const cli = await import("../src/cli");

    try {
      cli.__setUninstallCommandLoaderForTests(async () => runUninstallCommandMock);

      await cli.runCli(["uninstall", "--yes", "--target", targetDir]);

      expect(runUninstallCommandMock).toHaveBeenCalledTimes(1);
      expect(runUninstallCommandMock).toHaveBeenCalledWith({
        targetDir: path.resolve(targetDir),
        backup: false,
        permissions: "allow-all",
      });
    } finally {
      cli.__setUninstallCommandLoaderForTests(null);
      cleanupTempDir(targetDir);
    }
  });

  test.each([
    [["backup", "--no-skills"], ["backup", "--no-skills"]],
    [["uninstall", "--optional-skills", "decompose-codebase"], ["uninstall", "--optional-skills"]],
    [["--permissions", "confirm"], ["Unknown argument", "--permissions"]],
    [["--backup"], ["no command", "--backup"]],
    [["reconfigure", "--backup"], ["reconfigure", "--backup"]],
  ])("rejects invalid cross-command flag mixes for %s", async (argv, messageParts) => {
    const targetDir = createTempDir();

    try {
      const error = await captureCliError([...argv, "--target", targetDir]);

      for (const part of messageParts) {
        expect(error.message).toContain(part);
      }
    } finally {
      cleanupTempDir(targetDir);
    }
  });
});
