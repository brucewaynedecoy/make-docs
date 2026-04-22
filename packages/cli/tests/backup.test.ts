import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { applyInstallPlan, planInstall } from "../src/install";
import {
  __setLifecycleRendererForTests,
  type LifecycleAuditSummaryOptions,
  type LifecycleRenderer,
} from "../src/lifecycle-ui";
import { loadManifest } from "../src/manifest";
import { defaultSelections } from "../src/profile";
import type { BackupExecutionResult, LifecyclePermissionsMode } from "../src/types";
import { cleanupTempDir, createTempDir, mockSkillFetches } from "./helpers";

const { createAuditReportMock, confirmMock } = vi.hoisted(() => ({
  createAuditReportMock: vi.fn(),
  confirmMock: vi.fn(),
}));

vi.mock("../src/audit", async () => {
  const actual = await vi.importActual<typeof import("../src/audit")>(
    "../src/audit",
  );

  createAuditReportMock.mockImplementation(actual.createAuditReport);

  return {
    ...actual,
    createAuditReport: createAuditReportMock,
  };
});

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
  beforeEach(async () => {
    const actualAudit = await vi.importActual<typeof import("../src/audit")>(
      "../src/audit",
    );
    createAuditReportMock.mockReset();
    createAuditReportMock.mockImplementation(actualAudit.createAuditReport);
    confirmMock.mockReset();
    mockSkillFetches();
    setTTY(true);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-18T12:00:00Z"));
  });

  afterEach(() => {
    __setLifecycleRendererForTests(null);
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
      expect(result.copiedFiles).toContain("docs/.assets/config/manifest.json");
      expect(existsSync(path.join(backupDir, "AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(backupDir, "CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(backupDir, "docs/.assets/config/manifest.json"))).toBe(true);
      expect(readFileSync(path.join(targetDir, "AGENTS.md"), "utf8")).toBe(
        readFileSync(path.join(backupDir, "AGENTS.md"), "utf8"),
      );
      expect(existsSync(path.join(targetDir, "AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.assets/config/manifest.json"))).toBe(true);
      expect(output).toContain("make-docs backup");
      expect(output).toContain("Destination:");
      expect(output).toContain(".backup/2026-04-18");
      expect(output).toContain("Backup complete");
      expect(confirmMock).not.toHaveBeenCalled();
      expect(createAuditReportMock).toHaveBeenCalledTimes(1);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("routes successful backup lifecycle states through the renderer", async () => {
    const targetDir = createTempDir();
    const events: BackupRendererEvent[] = [];

    try {
      await installManifest(targetDir, (selections) => {
        selections.skills = false;
      });
      __setLifecycleRendererForTests(
        createBackupRecordingLifecycleRenderer(events),
      );

      const { result } = await captureBackupRun({
        targetDir,
        permissions: "confirm",
      });

      expect(result.status).toBe("completed");
      expect(events.map((event) => event.name)).toEqual([
        "backup:audit-summary",
        "backup:run-confirmation",
        "backup:completion-summary",
      ]);
      expect(events[0]).toMatchObject({
        destinationDir: path.join(targetDir, ".backup/2026-04-18"),
        filesToCopy: 70,
        directoriesToMaterialize: 13,
        retained: 0,
        skipped: 0,
        destinationExistedAtReview: false,
      });
      expect(events[1]).toMatchObject({
        permissions: "confirm",
      });
      expect(events[2]).toMatchObject({
        status: "completed",
        destinationDir: path.join(targetDir, ".backup/2026-04-18"),
        copiedFiles: 70,
        materializedDirectories: 13,
        retained: 0,
        skipped: 0,
      });
      expect(existsSync(path.join(targetDir, ".backup/2026-04-18"))).toBe(true);
      expect(confirmMock).not.toHaveBeenCalled();
      expect(createAuditReportMock).toHaveBeenCalledTimes(1);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("copies global managed files into the _home backup subtree", async () => {
    const targetDir = createTempDir();
    const fakeHome = createTempDir("make-docs-home-");
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

  test("routes backup cancellation through the renderer before creating a destination", async () => {
    const targetDir = createTempDir();
    const events: BackupRendererEvent[] = [];

    try {
      await installManifest(targetDir, (selections) => {
        selections.skills = false;
      });
      __setLifecycleRendererForTests(
        createBackupRecordingLifecycleRenderer(events, { shouldProceed: false }),
      );

      const { result } = await captureBackupRun({
        targetDir,
        permissions: "confirm",
      });

      expect(result.status).toBe("cancelled");
      expect(events.map((event) => event.name)).toEqual([
        "backup:audit-summary",
        "backup:run-confirmation",
        "backup:cancelled",
      ]);
      expect(existsSync(path.join(targetDir, ".backup"))).toBe(false);
      expect(confirmMock).not.toHaveBeenCalled();
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
      expect(output).toContain("make-docs backup");
      expect(output).toContain("No make-docs-managed files required backup.");
      expect(output).toContain("No backup destination was created.");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("routes backup noop through the renderer without prompting or creating a destination", async () => {
    const targetDir = createTempDir();
    const events: BackupRendererEvent[] = [];

    try {
      __setLifecycleRendererForTests(
        createBackupRecordingLifecycleRenderer(events),
      );

      const { result } = await captureBackupRun({
        targetDir,
        permissions: "confirm",
      });

      expect(result.status).toBe("noop");
      expect(events.map((event) => event.name)).toEqual([
        "backup:audit-summary",
        "backup:noop-summary",
      ]);
      expect(events[0]).toMatchObject({
        destinationDir: null,
        filesToCopy: 0,
        directoriesToMaterialize: 0,
      });
      expect(existsSync(path.join(targetDir, ".backup"))).toBe(false);
      expect(confirmMock).not.toHaveBeenCalled();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("keeps non-TTY confirmation guidance before creating a destination", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir, (selections) => {
        selections.skills = false;
      });
      setTTY(false);

      await expect(
        captureBackupRun({
          targetDir,
          permissions: "confirm",
        }),
      ).rejects.toThrow(
        "Backup confirmation requires a TTY. Re-run with `make-docs backup --yes`.",
      );
      expect(existsSync(path.join(targetDir, ".backup"))).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });
});

type BackupRendererEvent =
  | {
      name: "backup:audit-summary";
      destinationDir: string | null;
      filesToCopy: number;
      directoriesToMaterialize: number;
      retained: number;
      skipped: number;
      destinationExistedAtReview: boolean;
    }
  | {
      name: "backup:run-confirmation";
      permissions: LifecyclePermissionsMode;
    }
  | {
      name: "backup:noop-summary" | "backup:cancelled";
    }
  | {
      name: "backup:completion-summary";
      status: BackupExecutionResult["status"];
      destinationDir: string | null;
      copiedFiles: number;
      materializedDirectories: number;
      retained: number;
      skipped: number;
    }
  | {
      name: "uninstall:ignored";
    };

function createBackupRecordingLifecycleRenderer(
  events: BackupRendererEvent[],
  options: { shouldProceed?: boolean } = {},
): LifecycleRenderer {
  return {
    beginWorkflow() {
      return;
    },
    renderBackupAuditSummary(summaryOptions: LifecycleAuditSummaryOptions) {
      events.push({
        name: "backup:audit-summary",
        destinationDir: summaryOptions.destinationDir,
        filesToCopy: summaryOptions.copyableFiles.length,
        directoriesToMaterialize:
          summaryOptions.materializableDirectories.length,
        retained: summaryOptions.auditReport.preservedPaths.length,
        skipped: summaryOptions.auditReport.skippedPaths.length,
        destinationExistedAtReview: summaryOptions.destinationDir
          ? existsSync(summaryOptions.destinationDir)
          : false,
      });
    },
    async confirmBackupRun(permissions) {
      events.push({
        name: "backup:run-confirmation",
        permissions,
      });
      return options.shouldProceed ?? true;
    },
    renderBackupNoopSummary() {
      events.push({ name: "backup:noop-summary" });
    },
    renderBackupCancelled() {
      events.push({ name: "backup:cancelled" });
    },
    renderBackupCompletionSummary(result) {
      events.push({
        name: "backup:completion-summary",
        status: result.status,
        destinationDir: result.destinationDir,
        copiedFiles: result.copiedFiles.length,
        materializedDirectories: result.materializedDirectories.length,
        retained: result.auditReport.preservedPaths.length,
        skipped: result.auditReport.skippedPaths.length,
      });
    },
    renderUninstallWarning() {
      events.push({ name: "uninstall:ignored" });
    },
    async confirmUninstallWarning() {
      events.push({ name: "uninstall:ignored" });
      return true;
    },
    renderUninstallAuditSummary() {
      events.push({ name: "uninstall:ignored" });
    },
    async confirmUninstallRun() {
      events.push({ name: "uninstall:ignored" });
      return true;
    },
    renderUninstallCancelled() {
      events.push({ name: "uninstall:ignored" });
    },
    renderUninstallCompletionSummary() {
      events.push({ name: "uninstall:ignored" });
    },
    renderUninstallFailureSummary() {
      events.push({ name: "uninstall:ignored" });
    },
  };
}
