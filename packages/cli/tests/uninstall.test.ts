import { existsSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { applyInstallPlan, planInstall } from "../src/install";
import { loadManifest } from "../src/manifest";
import { defaultSelections } from "../src/profile";
import * as fileUtils from "../src/utils";
import { cleanupTempDir, createTempDir, mockSkillFetches } from "./helpers";

const confirmMock = vi.fn();
const createAuditReportMock = vi.fn();

vi.mock("@clack/prompts", async () => {
  const actual = await vi.importActual<typeof import("@clack/prompts")>("@clack/prompts");

  return {
    ...actual,
    confirm: confirmMock,
    isCancel: (value: unknown) => value === "cancelled",
  };
});

vi.mock("../src/audit", async () => {
  const actual = await vi.importActual<typeof import("../src/audit")>("../src/audit");
  createAuditReportMock.mockImplementation(actual.createAuditReport);

  return {
    ...actual,
    createAuditReport: createAuditReportMock,
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

async function captureUninstallRun(
  options: Parameters<typeof import("../src/uninstall").runUninstallCommand>[0],
) {
  const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

  try {
    const { runUninstallCommand } = await import("../src/uninstall");
    const result = await runUninstallCommand(options);
    const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
    return { result, output };
  } finally {
    writeSpy.mockRestore();
  }
}

async function captureUninstallFailure(
  options: Parameters<typeof import("../src/uninstall").runUninstallCommand>[0],
) {
  const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

  try {
    const { runUninstallCommand } = await import("../src/uninstall");

    try {
      await runUninstallCommand(options);
    } catch (error) {
      if (error instanceof Error) {
        const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
        return { error, output };
      }

      throw error;
    }

    throw new Error("Expected uninstall invocation to fail.");
  } finally {
    writeSpy.mockRestore();
  }
}

describe("uninstall command", () => {
  beforeEach(async () => {
    confirmMock.mockReset();
    createAuditReportMock.mockReset();
    const actualAudit = await vi.importActual<typeof import("../src/audit")>("../src/audit");
    createAuditReportMock.mockImplementation(actualAudit.createAuditReport);
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

  test("allow-all removes exact-match managed files and prunes audited empty directories", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir, (selections) => {
        selections.skills = false;
      });

      const { result, output } = await captureUninstallRun({
        targetDir,
        backup: false,
        permissions: "allow-all",
      });

      expect(result.status).toBe("completed");
      expect(result.removedFiles).toContain("AGENTS.md");
      expect(result.removedFiles).toContain("CLAUDE.md");
      expect(result.removedFiles).toContain("docs/.starter-docs/manifest.json");
      expect(result.prunedDirectories).toContain("docs/.starter-docs");
      expect(existsSync(path.join(targetDir, "AGENTS.md"))).toBe(false);
      expect(existsSync(path.join(targetDir, "CLAUDE.md"))).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/.starter-docs/manifest.json"))).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/.starter-docs"))).toBe(false);
      expect(existsSync(path.join(targetDir, ".backup"))).toBe(false);
      expect(output).toContain("WARNING");
      expect(output).toContain("This command removes audited starter-docs-managed paths");
      expect(output).toContain("Safer alternative: starter-docs backup");
      expect(output).toContain("Safer destructive flow: starter-docs uninstall --backup");
      expect(output).toContain("starter-docs uninstall");
      expect(output).toContain("Uninstall complete");
      expect(output).toContain("Files removed:");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("preserves modified root instructions and unmanaged descendants", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir, (selections) => {
        selections.skills = false;
      });
      writeFileSync(path.join(targetDir, "AGENTS.md"), "custom root agents\n", "utf8");
      writeFileSync(path.join(targetDir, "CLAUDE.md"), "custom root claude\n", "utf8");
      writeFileSync(path.join(targetDir, "docs/.templates/custom.md"), "keep me\n", "utf8");

      const { result, output } = await captureUninstallRun({
        targetDir,
        backup: false,
        permissions: "allow-all",
      });

      expect(result.status).toBe("completed");
      expect(readFileSync(path.join(targetDir, "AGENTS.md"), "utf8")).toBe("custom root agents\n");
      expect(readFileSync(path.join(targetDir, "CLAUDE.md"), "utf8")).toBe("custom root claude\n");
      expect(existsSync(path.join(targetDir, "docs/.templates/custom.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.templates"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.starter-docs/manifest.json"))).toBe(false);
      expect(output).toContain("Preserved paths");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("confirm mode can cancel at the final checkpoint without mutating files", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir, (selections) => {
        selections.skills = false;
      });
      confirmMock.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

      const { result, output } = await captureUninstallRun({
        targetDir,
        backup: false,
        permissions: "confirm",
      });

      expect(result.status).toBe("cancelled");
      expect(result.checkpoint).toBe("final");
      expect(confirmMock).toHaveBeenCalledTimes(2);
      expect(existsSync(path.join(targetDir, "AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.starter-docs/manifest.json"))).toBe(true);
      expect(output).toContain("Uninstall cancelled. No files were changed.");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("uninstall with backup reuses one audit snapshot and removes files after backup", async () => {
    const targetDir = createTempDir();
    const fakeHome = createTempDir("starter-docs-home-");
    const restoreHome = mockHomeDirectory(fakeHome);

    try {
      await installManifest(targetDir, (selections) => {
        selections.skillScope = "global";
      });

      const { result, output } = await captureUninstallRun({
        targetDir,
        backup: true,
        permissions: "allow-all",
      });

      expect(result.status).toBe("completed");
      expect(createAuditReportMock).toHaveBeenCalledTimes(1);
      expect(existsSync(path.join(targetDir, ".backup/2026-04-18/AGENTS.md"))).toBe(true);
      expect(
        existsSync(path.join(targetDir, ".backup/2026-04-18/_home/.agents/skills/archive-docs/SKILL.md")),
      ).toBe(true);
      expect(existsSync(path.join(targetDir, "AGENTS.md"))).toBe(false);
      expect(existsSync(path.join(targetDir, "CLAUDE.md"))).toBe(false);
      expect(output).toContain("WARNING");
      expect(output).toContain("A backup will be created before removal begins.");
      expect(output).toContain("Backup destination: ");
      expect(output).toContain(".backup/2026-04-18");
      expect(output).toContain("Uninstall complete");
    } finally {
      restoreHome();
      cleanupTempDir(targetDir);
      cleanupTempDir(fakeHome);
    }
  });

  test("reports partial delete failures without touching preserved paths or backups", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir, (selections) => {
        selections.skills = false;
      });
      const originalRemoveFileIfPresent = fileUtils.removeFileIfPresent;
      vi.spyOn(fileUtils, "removeFileIfPresent").mockImplementation((filePath) => {
        if (filePath.endsWith("CLAUDE.md")) {
          throw new Error("simulated delete failure");
        }

        return originalRemoveFileIfPresent(filePath);
      });

      const { error, output } = await captureUninstallFailure({
        targetDir,
        backup: false,
        permissions: "allow-all",
      });

      expect(error.message).toContain("Uninstall partially completed");
      expect(error.message).toContain("simulated delete failure");
      expect(existsSync(path.join(targetDir, "AGENTS.md"))).toBe(false);
      expect(existsSync(path.join(targetDir, "CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".backup"))).toBe(false);
      expect(output).toContain("Uninstall partially completed");
      expect(output).toContain("Error: simulated delete failure");
    } finally {
      cleanupTempDir(targetDir);
    }
  });
});
