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

describe("cli interactive flows", () => {
  beforeEach(() => {
    runSelectionWizardMock.mockReset();
    promptForUpdateWizardActionMock.mockReset();
    promptForInstructionConflictResolutionsMock.mockReset();
    confirmMock.mockReset();
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
        path.join(os.homedir(), ".claude/skills/decompose-codebase/SKILL.md"),
      );
      expect(manifest?.skillFiles).not.toContain(
        path.join(os.homedir(), ".agents/skills/decompose-codebase/SKILL.md"),
      );
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
      cleanupTempDir(targetDir);
    }
  });

  test("reconfigure can clear optional skills and change the skill scope", async () => {
    const targetDir = createTempDir();

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
      cleanupTempDir(targetDir);
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

  test("prints help with canonical harness and skill flags", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    try {
      const { runCli } = await import("../src/cli");

      await runCli(["--help"]);

      const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
      expect(output).toContain("--no-codex");
      expect(output).toContain("--no-claude-code");
      expect(output).toContain("--no-skills");
      expect(output).toContain("--skill-scope project|global");
      expect(output).toContain("--optional-skills <csv|none>");
    } finally {
      writeSpy.mockRestore();
    }
  });
});
