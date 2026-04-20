import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { applyInstallPlan, planInstall } from "../src/install";
import { loadManifest } from "../src/manifest";
import { defaultSelections } from "../src/profile";
import { cleanupTempDir, createTempDir, mockSkillFetches } from "./helpers";

const confirmMock = vi.fn();

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

  const existingManifest = loadManifest(targetDir);
  const plan = await planInstall({
    targetDir,
    selections,
    existingManifest,
  });

  applyInstallPlan({
    targetDir,
    plan,
    existingManifest,
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

async function captureBackupRun(
  options: Parameters<typeof import("../src/backup").runBackupCommand>[0],
) {
  const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

  try {
    const { runBackupCommand } = await import("../src/backup");
    const result = await runBackupCommand(options);
    const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
    return { result, output };
  } finally {
    writeSpy.mockRestore();
  }
}

describe("backup command", () => {
  beforeEach(() => {
    confirmMock.mockReset();
    mockSkillFetches();
    setTTY(true);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-18T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("copies managed project files into a dated backup directory without modifying originals", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir, (selections) => {
        selections.skills = false;
      });

      const { result, output } = await captureBackupRun({
        targetDir,
        permissions: "allow-all",
      });

      const backupDir = path.join(targetDir, ".backup/2026-04-18");
      expect(result.status).toBe("completed");
      expect(result.destinationDir).toBe(backupDir);
      expect(result.copiedFiles).toContain("AGENTS.md");
      expect(result.copiedFiles).toContain("CLAUDE.md");
      expect(result.copiedFiles).toContain("docs/.starter-docs/manifest.json");
      expect(existsSync(path.join(backupDir, "AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(backupDir, "CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(backupDir, "docs/.starter-docs/manifest.json"))).toBe(true);
      expect(readFileSync(path.join(targetDir, "AGENTS.md"), "utf8")).toBe(
        readFileSync(path.join(backupDir, "AGENTS.md"), "utf8"),
      );
      expect(existsSync(path.join(targetDir, "AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.starter-docs/manifest.json"))).toBe(true);
      expect(output).toContain("starter-docs backup");
      expect(output).toContain(`Destination: ${backupDir}`);
      expect(output).toContain("Backup complete");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("copies global managed files into the _home backup subtree", async () => {
    const targetDir = createTempDir();
    const fakeHome = createTempDir("starter-docs-home-");
    const restoreHome = mockHomeDirectory(fakeHome);

    try {
      await installManifest(targetDir, (selections) => {
        selections.skillScope = "global";
      });

      const { result } = await captureBackupRun({
        targetDir,
        permissions: "allow-all",
      });

      const backupDir = path.join(targetDir, ".backup/2026-04-18");
      expect(result.status).toBe("completed");
      expect(result.copiedFiles).toContain("_home/.agents/skills/archive-docs/SKILL.md");
      expect(result.copiedFiles).toContain("_home/.claude/skills/archive-docs/SKILL.md");
      expect(
        existsSync(path.join(backupDir, "_home/.agents/skills/archive-docs/SKILL.md")),
      ).toBe(true);
      expect(
        existsSync(path.join(backupDir, "_home/.claude/skills/archive-docs/SKILL.md")),
      ).toBe(true);
      expect(existsSync(path.join(fakeHome, ".agents/skills/archive-docs/SKILL.md"))).toBe(true);
      expect(existsSync(path.join(fakeHome, ".claude/skills/archive-docs/SKILL.md"))).toBe(true);
    } finally {
      restoreHome();
      cleanupTempDir(targetDir);
      cleanupTempDir(fakeHome);
    }
  });

  test("promotes plain same-day backups into ordinals and keeps incrementing", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir, (selections) => {
        selections.skills = false;
      });

      await captureBackupRun({
        targetDir,
        permissions: "allow-all",
      });
      await captureBackupRun({
        targetDir,
        permissions: "allow-all",
      });
      const thirdRun = await captureBackupRun({
        targetDir,
        permissions: "allow-all",
      });

      expect(existsSync(path.join(targetDir, ".backup/2026-04-18"))).toBe(false);
      expect(existsSync(path.join(targetDir, ".backup/2026-04-18-01"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".backup/2026-04-18-02"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".backup/2026-04-18-03"))).toBe(true);
      expect(thirdRun.result.destinationDir).toBe(
        path.join(targetDir, ".backup/2026-04-18-03"),
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  }, 15_000);

  test("prompts once in confirm mode and cancels cleanly before creating a backup", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir, (selections) => {
        selections.skills = false;
      });
      confirmMock.mockResolvedValue(false);

      const { result, output } = await captureBackupRun({
        targetDir,
        permissions: "confirm",
      });

      expect(result.status).toBe("cancelled");
      expect(confirmMock).toHaveBeenCalledTimes(1);
      expect(confirmMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Create this backup?",
        }),
      );
      expect(existsSync(path.join(targetDir, ".backup"))).toBe(false);
      expect(output).toContain("Backup cancelled.");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("exits cleanly without prompting or creating backup directories when nothing is copyable", async () => {
    const targetDir = createTempDir();

    try {
      const { result, output } = await captureBackupRun({
        targetDir,
        permissions: "confirm",
      });

      expect(result.status).toBe("noop");
      expect(result.destinationDir).toBeNull();
      expect(confirmMock).not.toHaveBeenCalled();
      expect(existsSync(path.join(targetDir, ".backup"))).toBe(false);
      expect(output).toContain("starter-docs backup");
      expect(output).toContain("No starter-docs-managed files required backup.");
    } finally {
      cleanupTempDir(targetDir);
    }
  });
});
