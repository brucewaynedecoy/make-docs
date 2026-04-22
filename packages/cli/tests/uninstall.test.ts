import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { applyInstallPlan, planInstall } from "../src/install";
import {
  __setLifecycleRendererForTests,
  type LifecycleRenderer,
  type LifecycleUninstallAuditSummaryOptions,
  type LifecycleUninstallCompletionSummaryOptions,
  type LifecycleUninstallFailureSummaryOptions,
  type LifecycleUninstallRunConfirmationOptions,
  type LifecycleUninstallWarningOptions,
} from "../src/lifecycle-ui";
import { loadManifest } from "../src/manifest";
import { defaultSelections } from "../src/profile";
import type {
  BackupExecutionResult,
  LifecyclePermissionsMode,
} from "../src/types";
import * as fileUtils from "../src/utils";
import { cleanupTempDir, createTempDir, mockSkillFetches } from "./helpers";

const { confirmMock, createAuditReportMock } = vi.hoisted(() => ({
  confirmMock: vi.fn(),
  createAuditReportMock: vi.fn(),
}));

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
    __setLifecycleRendererForTests(null);
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
      expect(result.removedFiles).toContain("docs/.assets/config/manifest.json");
      expect(result.prunedDirectories).toContain("docs/.assets/config");
      expect(existsSync(path.join(targetDir, "AGENTS.md"))).toBe(false);
      expect(existsSync(path.join(targetDir, "CLAUDE.md"))).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/.assets/config/manifest.json"))).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/.assets/config"))).toBe(false);
      expect(existsSync(path.join(targetDir, ".backup"))).toBe(false);
      expect(output).toContain("WARNING");
      expect(output).toContain("This command removes audited make-docs-managed paths");
      expect(output).toContain("Safer alternative: make-docs backup");
      expect(output).toContain("Safer destructive flow: make-docs uninstall --backup");
      expect(output).toContain("make-docs uninstall");
      expect(output).toContain("Uninstall complete");
      expect(output).toContain("Files removed:");
      expect(confirmMock).not.toHaveBeenCalled();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("routes successful uninstall lifecycle states through the renderer", async () => {
    const targetDir = createTempDir();
    const events: UninstallRendererEvent[] = [];

    try {
      await installManifest(targetDir, (selections) => {
        selections.skills = false;
      });
      __setLifecycleRendererForTests(
        createUninstallRecordingLifecycleRenderer(events),
      );

      const { result } = await captureUninstallRun({
        targetDir,
        backup: true,
        permissions: "allow-all",
      });

      expect(result.status).toBe("completed");
      expect(result.backupResult?.status).toBe("completed");
      expect(events.map((event) => event.name)).toEqual([
        "workflow",
        "uninstall:warning",
        "uninstall:warning-confirmation",
        "uninstall:audit-summary",
        "uninstall:run-confirmation",
        "uninstall:completion-summary",
      ]);
      expect(events[0]).toMatchObject({
        title: "make-docs uninstall",
      });
      expect(events[1]).toMatchObject({
        targetDir,
        backupDestinationDir: path.join(targetDir, ".backup/2026-04-18"),
        backupDestinationExistsAtWarning: false,
      });
      expect(events[2]).toMatchObject({
        permissions: "allow-all",
      });
      expect(events[3]).toMatchObject({
        targetDir,
        backupDestinationDir: path.join(targetDir, ".backup/2026-04-18"),
        filesToRemove: result.plan.auditReport.removableFiles.length,
        directoriesToPrune: result.plan.auditReport.prunableDirectories.length,
        preserved: result.plan.auditReport.preservedPaths.length,
        skipped: result.plan.auditReport.skippedPaths.length,
        backupDestinationExistsAtReview: false,
      });
      expect(events[4]).toMatchObject({
        permissions: "allow-all",
        backupRequested: true,
      });
      expect(events[5]).toMatchObject({
        removedFiles: result.removedFiles.length,
        prunedDirectories: result.prunedDirectories.length,
        preserved: result.plan.auditReport.preservedPaths.length,
        skipped: result.plan.auditReport.skippedPaths.length,
        backupStatus: "completed",
        backupDestinationDir: path.join(targetDir, ".backup/2026-04-18"),
      });
      expect(confirmMock).not.toHaveBeenCalled();
      expect(createAuditReportMock).toHaveBeenCalledTimes(1);
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
      expect(existsSync(path.join(targetDir, "docs/.assets/config/manifest.json"))).toBe(false);
      expect(output).toContain("Preserved paths");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("preserves history records and assets routers while pruning empty make-docs state", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir, (selections) => {
        selections.skills = false;
      });
      const historyRecordPath = path.join(targetDir, "docs/.assets/history/2026-04-20-phase-3.md");
      mkdirSync(path.dirname(historyRecordPath), { recursive: true });
      writeFileSync(historyRecordPath, "# Phase 3 history\n", "utf8");

      const { result } = await captureUninstallRun({
        targetDir,
        backup: false,
        permissions: "allow-all",
      });

      expect(result.status).toBe("completed");
      expect(result.prunedDirectories).toContain("docs/.assets/config");
      expect(result.prunedDirectories).not.toContain("docs/.assets/history");
      expect(result.prunedDirectories).not.toContain("docs/.assets");
      expect(existsSync(path.join(targetDir, "docs/.assets/config"))).toBe(false);
      expect(existsSync(historyRecordPath)).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.assets/history"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.assets"))).toBe(true);
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
      expect(existsSync(path.join(targetDir, "docs/.assets/config/manifest.json"))).toBe(true);
      expect(output).toContain("Uninstall cancelled. No files were changed.");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("routes warning cancellation through the renderer before audit or mutation", async () => {
    const targetDir = createTempDir();
    const events: UninstallRendererEvent[] = [];

    try {
      await installManifest(targetDir, (selections) => {
        selections.skills = false;
      });
      __setLifecycleRendererForTests(
        createUninstallRecordingLifecycleRenderer(events, {
          warningApproved: false,
        }),
      );

      const { result } = await captureUninstallRun({
        targetDir,
        backup: true,
        permissions: "confirm",
      });

      expect(result.status).toBe("cancelled");
      expect(result.checkpoint).toBe("warning");
      expect(events.map((event) => event.name)).toEqual([
        "workflow",
        "uninstall:warning",
        "uninstall:warning-confirmation",
        "uninstall:cancelled",
      ]);
      expect(createAuditReportMock).not.toHaveBeenCalled();
      expect(existsSync(path.join(targetDir, "AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".backup"))).toBe(false);
      expect(confirmMock).not.toHaveBeenCalled();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("routes final cancellation through the renderer before backup or mutation", async () => {
    const targetDir = createTempDir();
    const events: UninstallRendererEvent[] = [];

    try {
      await installManifest(targetDir, (selections) => {
        selections.skills = false;
      });
      __setLifecycleRendererForTests(
        createUninstallRecordingLifecycleRenderer(events, {
          finalApproved: false,
        }),
      );

      const { result } = await captureUninstallRun({
        targetDir,
        backup: true,
        permissions: "confirm",
      });

      expect(result.status).toBe("cancelled");
      expect(result.checkpoint).toBe("final");
      expect(events.map((event) => event.name)).toEqual([
        "workflow",
        "uninstall:warning",
        "uninstall:warning-confirmation",
        "uninstall:audit-summary",
        "uninstall:run-confirmation",
        "uninstall:cancelled",
      ]);
      expect(createAuditReportMock).toHaveBeenCalledTimes(1);
      expect(existsSync(path.join(targetDir, "AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".backup"))).toBe(false);
      expect(confirmMock).not.toHaveBeenCalled();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("uninstall with backup reuses one audit snapshot and removes files after backup", async () => {
    const targetDir = createTempDir();
    const fakeHome = createTempDir("make-docs-home-");
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
      expect(confirmMock).not.toHaveBeenCalled();
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
      vi.spyOn(fileUtils, "removeFileIfPresent").mockImplementation(
        (filePath) => {
          if (filePath.endsWith("CLAUDE.md")) {
            throw new Error("simulated delete failure");
          }

          return originalRemoveFileIfPresent(filePath);
        },
      );

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

  test("routes partial failure through the renderer with partial mutation counts", async () => {
    const targetDir = createTempDir();
    const events: UninstallRendererEvent[] = [];

    try {
      await installManifest(targetDir, (selections) => {
        selections.skills = false;
      });
      __setLifecycleRendererForTests(
        createUninstallRecordingLifecycleRenderer(events),
      );
      const originalRemoveFileIfPresent = fileUtils.removeFileIfPresent;
      vi.spyOn(fileUtils, "removeFileIfPresent").mockImplementation((filePath) => {
        if (filePath.endsWith("CLAUDE.md")) {
          throw new Error("simulated delete failure");
        }

        return originalRemoveFileIfPresent(filePath);
      });

      const { error } = await captureUninstallFailure({
        targetDir,
        backup: false,
        permissions: "allow-all",
      });

      expect(error.message).toContain("Uninstall partially completed");
      expect(events.map((event) => event.name)).toEqual([
        "workflow",
        "uninstall:warning",
        "uninstall:warning-confirmation",
        "uninstall:audit-summary",
        "uninstall:run-confirmation",
        "uninstall:failure-summary",
      ]);
      expect(events[5]).toMatchObject({
        removedFiles: 1,
        prunedDirectories: 0,
        backupStatus: "not-requested",
        errorMessage: "simulated delete failure",
      });
      expect(existsSync(path.join(targetDir, "AGENTS.md"))).toBe(false);
      expect(existsSync(path.join(targetDir, "CLAUDE.md"))).toBe(true);
      expect(confirmMock).not.toHaveBeenCalled();
    } finally {
      cleanupTempDir(targetDir);
    }
  });
});

type UninstallRendererEvent =
  | {
      name: "workflow";
      title: string;
    }
  | {
      name: "uninstall:warning";
      targetDir: string;
      backupDestinationDir: string | null;
      backupDestinationExistsAtWarning: boolean;
    }
  | {
      name: "uninstall:warning-confirmation";
      permissions: LifecyclePermissionsMode;
    }
  | {
      name: "uninstall:audit-summary";
      targetDir: string;
      backupDestinationDir: string | null;
      filesToRemove: number;
      directoriesToPrune: number;
      preserved: number;
      skipped: number;
      backupDestinationExistsAtReview: boolean;
    }
  | {
      name: "uninstall:run-confirmation";
      permissions: LifecyclePermissionsMode;
      backupRequested: boolean;
    }
  | {
      name: "uninstall:cancelled";
    }
  | {
      name: "uninstall:completion-summary";
      removedFiles: number;
      prunedDirectories: number;
      preserved: number;
      skipped: number;
      backupStatus: BackupStatus;
      backupDestinationDir: string | null;
    }
  | {
      name: "uninstall:failure-summary";
      removedFiles: number;
      prunedDirectories: number;
      preserved: number;
      skipped: number;
      backupStatus: BackupStatus;
      backupDestinationDir: string | null;
      errorMessage: string;
    }
  | {
      name: "backup:ignored";
    };

type BackupStatus = "not-requested" | BackupExecutionResult["status"];

function createUninstallRecordingLifecycleRenderer(
  events: UninstallRendererEvent[],
  options: {
    warningApproved?: boolean;
    finalApproved?: boolean;
  } = {},
): LifecycleRenderer {
  return {
    beginWorkflow(title) {
      events.push({ name: "workflow", title });
    },
    renderBackupAuditSummary() {
      events.push({ name: "backup:ignored" });
    },
    async confirmBackupRun() {
      events.push({ name: "backup:ignored" });
      return true;
    },
    renderBackupNoopSummary() {
      events.push({ name: "backup:ignored" });
    },
    renderBackupCancelled() {
      events.push({ name: "backup:ignored" });
    },
    renderBackupCompletionSummary() {
      events.push({ name: "backup:ignored" });
    },
    renderUninstallWarning(warningOptions: LifecycleUninstallWarningOptions) {
      events.push({
        name: "uninstall:warning",
        targetDir: warningOptions.targetDir,
        backupDestinationDir: warningOptions.backupDestinationDir,
        backupDestinationExistsAtWarning: warningOptions.backupDestinationDir
          ? existsSync(warningOptions.backupDestinationDir)
          : false,
      });
    },
    async confirmUninstallWarning(permissions) {
      events.push({
        name: "uninstall:warning-confirmation",
        permissions,
      });
      return options.warningApproved ?? true;
    },
    renderUninstallAuditSummary(
      summaryOptions: LifecycleUninstallAuditSummaryOptions,
    ) {
      events.push({
        name: "uninstall:audit-summary",
        targetDir: summaryOptions.auditReport.targetDir,
        backupDestinationDir: summaryOptions.backupDestinationDir,
        filesToRemove: summaryOptions.auditReport.removableFiles.length,
        directoriesToPrune:
          summaryOptions.auditReport.prunableDirectories.length,
        preserved: summaryOptions.auditReport.preservedPaths.length,
        skipped: summaryOptions.auditReport.skippedPaths.length,
        backupDestinationExistsAtReview: summaryOptions.backupDestinationDir
          ? existsSync(summaryOptions.backupDestinationDir)
          : false,
      });
    },
    async confirmUninstallRun(
      confirmationOptions: LifecycleUninstallRunConfirmationOptions,
    ) {
      events.push({
        name: "uninstall:run-confirmation",
        permissions: confirmationOptions.permissions,
        backupRequested: confirmationOptions.backupRequested,
      });
      return options.finalApproved ?? true;
    },
    renderUninstallCancelled() {
      events.push({ name: "uninstall:cancelled" });
    },
    renderUninstallCompletionSummary(
      summaryOptions: LifecycleUninstallCompletionSummaryOptions,
    ) {
      events.push({
        name: "uninstall:completion-summary",
        removedFiles: summaryOptions.removedFiles.length,
        prunedDirectories: summaryOptions.prunedDirectories.length,
        preserved: summaryOptions.auditReport.preservedPaths.length,
        skipped: summaryOptions.auditReport.skippedPaths.length,
        backupStatus: getBackupStatus(summaryOptions.backupResult),
        backupDestinationDir: summaryOptions.backupResult?.destinationDir ?? null,
      });
    },
    renderUninstallFailureSummary(
      summaryOptions: LifecycleUninstallFailureSummaryOptions,
    ) {
      events.push({
        name: "uninstall:failure-summary",
        removedFiles: summaryOptions.removedFiles.length,
        prunedDirectories: summaryOptions.prunedDirectories.length,
        preserved: summaryOptions.auditReport.preservedPaths.length,
        skipped: summaryOptions.auditReport.skippedPaths.length,
        backupStatus: getBackupStatus(summaryOptions.backupResult),
        backupDestinationDir: summaryOptions.backupResult?.destinationDir ?? null,
        errorMessage: summaryOptions.errorMessage,
      });
    },
  };
}

function getBackupStatus(result: BackupExecutionResult | null): BackupStatus {
  return result?.status ?? "not-requested";
}
