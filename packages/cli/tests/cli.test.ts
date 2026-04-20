import { beforeEach, afterEach, describe, expect, test, vi } from "vitest";
import { existsSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { applyInstallPlan, planInstall } from "../src/install";
import { loadManifest } from "../src/manifest";
import { defaultSelections } from "../src/profile";
import { createTempDir, cleanupTempDir, mockSkillFetches } from "./helpers";

const runSelectionWizardMock = vi.fn();
const promptForUpdateWizardActionMock = vi.fn();
const promptForInstructionConflictResolutionsMock = vi.fn();
const confirmMock = vi.fn();
const runUninstallCommandMock = vi.fn();

vi.mock("../src/wizard", () => ({
  runSelectionWizard: runSelectionWizardMock,
  promptForUpdateWizardAction: promptForUpdateWizardActionMock,
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
    promptForUpdateWizardActionMock.mockReset();
    promptForInstructionConflictResolutionsMock.mockReset();
    confirmMock.mockReset();
    runUninstallCommandMock.mockReset();
    mockSkillFetches();
    setTTY(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("uses the wizard for interactive init", async () => {
    const targetDir = createTempDir();
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    try {
      runSelectionWizardMock.mockResolvedValue(defaultSelections());
      const { runCli } = await import("../src/cli");

      await runCli(["init", "--target", targetDir]);

      expect(runSelectionWizardMock).toHaveBeenCalledWith({
        initialSelections: expect.objectContaining({
          capabilities: expect.objectContaining({ designs: true, plans: true, prd: true, work: true }),
        }),
        introTitle: "Let's configure your starter-docs install",
      });
      expect(promptForUpdateWizardActionMock).not.toHaveBeenCalled();
      expect(promptForInstructionConflictResolutionsMock).not.toHaveBeenCalled();
      expect(confirmMock).not.toHaveBeenCalled();
      expect(writeSpy).toHaveBeenCalled();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("uses the wizard for update --reconfigure", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir);
      runSelectionWizardMock.mockResolvedValue(defaultSelections());
      const { runCli } = await import("../src/cli");

      await runCli(["update", "--reconfigure", "--target", targetDir]);

      expect(runSelectionWizardMock).toHaveBeenCalledWith({
        initialSelections: expect.objectContaining({
          capabilities: expect.objectContaining({ designs: true, plans: true, prd: true, work: true }),
        }),
        introTitle: "Let's reconfigure your starter-docs install",
      });
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("offers update vs reconfigure for implicit update and starts at review when keeping selections", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir);
      promptForUpdateWizardActionMock.mockResolvedValue("update-existing");
      runSelectionWizardMock.mockResolvedValue(defaultSelections());
      const { runCli } = await import("../src/cli");

      await runCli(["--target", targetDir]);

      expect(promptForUpdateWizardActionMock).toHaveBeenCalledTimes(1);
      expect(runSelectionWizardMock).toHaveBeenCalledWith({
        initialSelections: expect.objectContaining({
          capabilities: expect.objectContaining({ designs: true, plans: true, prd: true, work: true }),
        }),
        introTitle: "Review your current starter-docs install",
        startStep: "review",
      });
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("preserves non-interactive flag behavior with --yes", async () => {
    const targetDir = createTempDir();

    try {
      const { runCli } = await import("../src/cli");

      await runCli(["init", "--yes", "--no-work", "--target", targetDir]);

      expect(runSelectionWizardMock).not.toHaveBeenCalled();
      expect(promptForInstructionConflictResolutionsMock).not.toHaveBeenCalled();
      expect(loadManifest(targetDir)?.selections.capabilities.work).toBe(false);
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

      await runCli(["init", "--target", targetDir]);

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

  test("supports canonical harness and skill flags for non-interactive init", async () => {
    const targetDir = createTempDir();
    const fakeHome = createTempDir("starter-docs-home-");
    const restoreHome = mockHomeDirectory(fakeHome);

    try {
      const { runCli } = await import("../src/cli");

      await runCli([
        "init",
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

      await runCli(["init", "--yes", flag, "--target", targetDir]);

      expect(loadManifest(targetDir)?.selections.harnesses).toEqual(expectedHarnesses);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("supports --no-skills for non-interactive init", async () => {
    const targetDir = createTempDir();

    try {
      const { runCli } = await import("../src/cli");

      await runCli(["init", "--yes", "--no-skills", "--target", targetDir]);

      const manifest = loadManifest(targetDir);
      expect(manifest?.selections.skills).toBe(false);
      expect(manifest?.selections.optionalSkills).toEqual([]);
      expect(manifest?.skillFiles).toEqual([]);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test.each(["project", "global"] as const)(
    "supports --skill-scope %s for non-interactive init",
    async (skillScope) => {
      const targetDir = createTempDir();
      const fakeHome = skillScope === "global" ? createTempDir("starter-docs-home-") : null;
      const restoreHome = fakeHome ? mockHomeDirectory(fakeHome) : null;

      try {
        const { runCli } = await import("../src/cli");

        await runCli(["init", "--yes", "--skill-scope", skillScope, "--target", targetDir]);

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

  test.each([
    ["--no-claude", { "claude-code": false, codex: true }],
    ["--no-agents", { "claude-code": true, codex: false }],
  ])("supports deprecated harness alias %s", async (flag, expectedHarnesses) => {
    const targetDir = createTempDir();

    try {
      const { runCli } = await import("../src/cli");

      await runCli(["init", "--yes", flag, "--target", targetDir]);

      expect(loadManifest(targetDir)?.selections.harnesses).toEqual(expectedHarnesses);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("supports deprecated harness aliases for backward compatibility", async () => {
    const targetDir = createTempDir();

    try {
      const { runCli } = await import("../src/cli");

      await runCli(["init", "--yes", "--no-agents", "--no-claude", "--target", targetDir]);

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
    const fakeHome = createTempDir("starter-docs-home-");
    const restoreHome = mockHomeDirectory(fakeHome);

    try {
      await installManifest(targetDir, (selections) => {
        selections.skillScope = "global";
        selections.optionalSkills = ["decompose-codebase"];
      });
      const { runCli } = await import("../src/cli");

      await runCli(["update", "--reconfigure", "--yes", "--no-skills", "--target", targetDir]);

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
    const fakeHome = createTempDir("starter-docs-home-");
    const restoreHome = mockHomeDirectory(fakeHome);

    try {
      await installManifest(targetDir, (selections) => {
        selections.skillScope = "global";
        selections.optionalSkills = ["decompose-codebase"];
      });
      const { runCli } = await import("../src/cli");

      await runCli([
        "update",
        "--reconfigure",
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

  test("rejects conflicting and invalid optional-skill selections", async () => {
    const targetDir = createTempDir();

    try {
      const { runCli } = await import("../src/cli");

      await expect(
        runCli([
          "init",
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
          "init",
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
          "init",
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

  test("prints structured top-level help with all four commands", async () => {
    setTTY(false);

    const output = await captureCliOutput(["--help"]);

    expect(output).toMatch(/starter-docs/i);
    expect(output).toMatch(/\bCommands\b/i);
    expect(output).toMatch(/\bExamples\b/i);
    expect(output).toContain("starter-docs init");
    expect(output).toContain("starter-docs update");
    expect(output).toContain("starter-docs backup");
    expect(output).toContain("starter-docs uninstall");
    expect(output).toMatch(/--help/i);
  });

  test.each([
    ["init", ["Usage", "Options", "Examples", "starter-docs init"]],
    ["update", ["Usage", "Options", "Examples", "starter-docs update"]],
    ["backup", ["Usage", "Options", "Examples", "starter-docs backup"]],
    ["uninstall", ["Usage", "Options", "Examples", "starter-docs uninstall"]],
  ])("prints command-specific help for %s", async (command, snippets) => {
    setTTY(false);

    const output = await captureCliOutput([command, "--help"]);

    for (const snippet of snippets) {
      expect(output).toContain(snippet);
    }
  });

  test("documents backup help with lifecycle-specific options", async () => {
    setTTY(false);

    const output = await captureCliOutput(["backup", "--help"]);

    expect(output).toContain("starter-docs backup");
    expect(output).toContain("--target");
    expect(output).toContain("--permissions");
    expect(output).toContain("--help");
    expect(output).not.toContain("--no-skills");
  });

  test("documents uninstall help with backup and permissions options", async () => {
    setTTY(false);

    const output = await captureCliOutput(["uninstall", "--help"]);

    expect(output).toContain("starter-docs uninstall");
    expect(output).toContain("--target");
    expect(output).toContain("--backup");
    expect(output).toContain("--permissions");
    expect(output).toContain("--help");
    expect(output).not.toContain("--optional-skills");
  });

  test("keeps uninstall help on the help path without dispatching lifecycle work", async () => {
    setTTY(false);

    const output = await captureCliOutput(["uninstall", "--help"]);

    expect(output).toContain("starter-docs uninstall");
    expect(runUninstallCommandMock).not.toHaveBeenCalled();
  });

  test("routes backup through the implemented lifecycle flow", async () => {
    const targetDir = createTempDir();

    try {
      setTTY(false);
      const output = await captureCliOutput([
        "backup",
        "--permissions",
        "allow-all",
        "--target",
        targetDir,
      ]);

      expect(output).toContain("starter-docs backup");
      expect(output).toContain("No starter-docs-managed files required backup.");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("defaults backup permissions to confirm mode", async () => {
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

  test("routes uninstall through the implemented lifecycle flow", async () => {
    const targetDir = createTempDir();
    const cli = await import("../src/cli");

    try {
      cli.__setUninstallCommandLoaderForTests(async () => runUninstallCommandMock);

      await cli.runCli([
        "uninstall",
        "--backup",
        "--permissions",
        "allow-all",
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

  test("defaults uninstall permissions to confirm mode", async () => {
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

  test.each([
    [["backup", "--no-skills"], ["backup", "--no-skills"]],
    [["uninstall", "--optional-skills", "decompose-codebase"], ["uninstall", "--optional-skills"]],
    [["init", "--permissions", "confirm"], ["init", "--permissions"]],
    [["init", "--backup"], ["init", "--backup"]],
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
