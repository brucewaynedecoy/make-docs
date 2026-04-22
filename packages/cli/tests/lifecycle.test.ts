import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createAuditReport } from "../src/audit";
import { resolveBackupDestinationPlan, runBackupCommand } from "../src/backup";
import {
  __setLifecycleRendererForTests,
  createClackLifecycleRenderer,
  type LifecycleRenderer,
} from "../src/lifecycle-ui";
import { loadManifest } from "../src/manifest";
import { runUninstallCommand } from "../src/uninstall";
import type {
  AuditPreservedPath,
  AuditPrunableDirectory,
  AuditReport,
  AuditRemovableFile,
  AuditSkippedPath,
} from "../src/types";
import {
  cleanupTempDir,
  createTempDir,
  installMakeDocsTarget,
  mockHomeDirectory,
  mockSkillFetches,
  setTTY,
} from "./helpers";

const NOW = new Date("2026-04-18T12:00:00Z");
const clackMocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  intro: vi.fn(),
  note: vi.fn(),
  outro: vi.fn(),
}));

vi.mock("@clack/prompts", async () => {
  const actual =
    await vi.importActual<typeof import("@clack/prompts")>("@clack/prompts");

  return {
    ...actual,
    confirm: clackMocks.confirm,
    intro: clackMocks.intro,
    isCancel: (value: unknown) => value === "cancelled",
    note: clackMocks.note,
    outro: clackMocks.outro,
  };
});

describe("lifecycle validation", () => {
  beforeEach(() => {
    clackMocks.confirm.mockReset();
    clackMocks.intro.mockReset();
    clackMocks.note.mockReset();
    clackMocks.outro.mockReset();
    mockSkillFetches();
    setTTY(true);
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("manifest-backed audits include managed ownership while excluding backup content", async () => {
    const targetDir = createTempDir();

    try {
      await installMakeDocsTarget(targetDir, (selections) => {
        selections.skills = false;
      });
      mkdirSync(path.join(targetDir, ".backup/2026-04-18/docs"), { recursive: true });
      writeFileSync(path.join(targetDir, ".backup/2026-04-18/docs/AGENTS.md"), "old backup\n");

      const report = await createAuditReport({
        targetDir,
        manifest: loadManifest(targetDir),
      });
      const removablePaths = report.removableFiles.map((entry) => entry.path);
      const prunablePaths = report.prunableDirectories.map((entry) => entry.path);

      expect(report.mode).toBe("manifest-present");
      expect(removablePaths).toContain("AGENTS.md");
      expect(removablePaths).toContain("CLAUDE.md");
      expect(removablePaths).toContain("docs/.assets/config/manifest.json");
      expect(prunablePaths).toContain("docs/.assets/config");
      expect(allAuditPaths(report).some((entryPath) => entryPath.startsWith(".backup/"))).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("manifest-missing fallback stays conservative and ignores unrelated lookalikes", async () => {
    const targetDir = createTempDir();

    try {
      await installMakeDocsTarget(targetDir, (selections) => {
        selections.skills = false;
      });
      rmSync(path.join(targetDir, "docs/.assets/config/manifest.json"), { force: true });
      mkdirSync(path.join(targetDir, "notes"), { recursive: true });
      writeFileSync(path.join(targetDir, "notes/AGENTS.md"), "not make-docs\n");

      const report = await createAuditReport({
        targetDir,
        manifest: null,
      });
      const removablePaths = report.removableFiles.map((entry) => entry.path);

      expect(report.mode).toBe("manifest-missing");
      expect(removablePaths).toContain("AGENTS.md");
      expect(removablePaths).toContain("CLAUDE.md");
      expect(allAuditPaths(report)).not.toContain("notes/AGENTS.md");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("uninstall preserves modified roots and unmanaged descendants while pruning empty managed dirs", async () => {
    const targetDir = createTempDir();

    try {
      await installMakeDocsTarget(targetDir, (selections) => {
        selections.skills = false;
      });
      writeFileSync(path.join(targetDir, "AGENTS.md"), "custom agent instructions\n");
      writeFileSync(path.join(targetDir, "docs/.templates/custom.md"), "keep this unmanaged file\n");

      const result = await captureStdout(() =>
        runUninstallCommand({
          targetDir,
          backup: false,
          permissions: "allow-all",
        }),
      );

      expect(result.status).toBe("completed");
      expect(result.removedFiles).not.toContain("AGENTS.md");
      expect(result.removedFiles).toContain("CLAUDE.md");
      expect(result.prunedDirectories).not.toContain("docs/.templates");
      expect(readFileSync(path.join(targetDir, "AGENTS.md"), "utf8")).toBe(
        "custom agent instructions\n",
      );
      expect(existsSync(path.join(targetDir, "docs/.templates/custom.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.assets/config"))).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("backup naming remains deterministic through later same-day ordinals", () => {
    const targetDir = createTempDir();

    try {
      const firstPlan = resolveBackupDestinationPlan(targetDir, NOW);
      expect(firstPlan.directoryName).toBe("2026-04-18");

      for (let ordinal = 1; ordinal <= 9; ordinal += 1) {
        mkdirSync(path.join(targetDir, ".backup", `2026-04-18-${String(ordinal).padStart(2, "0")}`), {
          recursive: true,
        });
      }

      const tenthOrdinalPlan = resolveBackupDestinationPlan(targetDir, NOW);
      expect(tenthOrdinalPlan.directoryName).toBe("2026-04-18-10");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("backup maps home-scoped files under _home without deleting source files", async () => {
    const targetDir = createTempDir();
    const fakeHome = createTempDir("make-docs-home-");
    const restoreHome = mockHomeDirectory(fakeHome);

    try {
      await installMakeDocsTarget(targetDir, (selections) => {
        selections.skillScope = "global";
      });

      const result = await captureStdout(() =>
        runBackupCommand({
          targetDir,
          homeDir: fakeHome,
          permissions: "allow-all",
          now: NOW,
        }),
      );

      const homeSkillPath = ".agents/skills/archive-docs/SKILL.md";
      expect(result.status).toBe("completed");
      expect(result.copiedFiles).toContain(`_home/${homeSkillPath}`);
      expect(existsSync(path.join(targetDir, ".backup/2026-04-18/_home", homeSkillPath))).toBe(true);
      expect(existsSync(path.join(fakeHome, homeSkillPath))).toBe(true);
      expect(existsSync(path.join(targetDir, "AGENTS.md"))).toBe(true);
    } finally {
      restoreHome();
      cleanupTempDir(targetDir);
      cleanupTempDir(fakeHome);
    }
  });

  test("uninstall with backup aborts deletion when backup copying fails", async () => {
    const targetDir = createTempDir();

    try {
      const malformedManagedFile = path.join(targetDir, "managed-file.md");
      mkdirSync(malformedManagedFile, { recursive: true });
      const auditReport = createSyntheticAuditReport(targetDir, malformedManagedFile);

      await expect(
        captureStdout(() =>
          runUninstallCommand({
            targetDir,
            backup: true,
            permissions: "allow-all",
            auditReport,
            now: NOW,
          }),
        ),
      ).rejects.toThrow("Backup failed before uninstall removal began");
      expect(existsSync(malformedManagedFile)).toBe(true);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("backup and uninstall route lifecycle states through the renderer boundary", async () => {
    const targetDir = createTempDir();
    const events: string[] = [];

    try {
      __setLifecycleRendererForTests(createRecordingLifecycleRenderer(events));

      await runBackupCommand({
        targetDir,
        permissions: "allow-all",
        now: NOW,
      });
      expect(events).toEqual([
        "workflow:make-docs backup",
        "backup:audit-summary",
        "backup:noop-summary",
      ]);

      events.length = 0;

      await runUninstallCommand({
        targetDir,
        backup: false,
        permissions: "allow-all",
        now: NOW,
      });
      expect(events).toEqual([
        "workflow:make-docs uninstall",
        "uninstall:warning",
        "uninstall:warning-confirmation",
        "uninstall:audit-summary",
        "uninstall:run-confirmation",
        "uninstall:completion-summary",
      ]);
    } finally {
      __setLifecycleRendererForTests(null);
      cleanupTempDir(targetDir);
    }
  });

  test("Clack lifecycle renderer emits semantic workflow summaries", () => {
    const targetDir = createTempDir();

    try {
      const renderer = createClackLifecycleRenderer();
      const auditReport = createRendererAuditReport(targetDir);
      const backupDestinationDir = path.join(targetDir, ".backup/2026-04-18");

      renderer.beginWorkflow("make-docs lifecycle");
      renderer.renderBackupAuditSummary({
        auditReport,
        destinationDir: backupDestinationDir,
        copyableFiles: auditReport.removableFiles,
        materializableDirectories: auditReport.prunableDirectories,
      });
      renderer.renderBackupNoopSummary();
      renderer.renderBackupCancelled();
      renderer.renderBackupCompletionSummary({
        status: "completed",
        targetDir,
        destinationDir: backupDestinationDir,
        auditReport,
        copiedFiles: ["AGENTS.md"],
        materializedDirectories: ["docs/.assets/config"],
      });
      renderer.renderUninstallWarning({
        targetDir,
        backupDestinationDir: null,
      });
      renderer.renderUninstallWarning({
        targetDir,
        backupDestinationDir,
      });
      renderer.renderUninstallAuditSummary({
        auditReport,
        backupDestinationDir,
      });
      renderer.renderUninstallCancelled();
      renderer.renderUninstallCompletionSummary({
        auditReport,
        removedFiles: ["AGENTS.md"],
        prunedDirectories: ["docs/.assets/config"],
        backupResult: null,
      });
      renderer.renderUninstallFailureSummary({
        auditReport,
        removedFiles: ["AGENTS.md"],
        prunedDirectories: [],
        backupResult: null,
        errorMessage: "simulated failure",
      });

      expect(clackMocks.intro).toHaveBeenCalledWith("make-docs lifecycle");
      expect(clackMocks.note).toHaveBeenCalledWith(
        expect.stringContaining("Files to copy: 1"),
        "make-docs backup",
      );
      expect(getClackNoteBody("make-docs backup")).toContain(
        [
          "Files to copy:",
          "- managed-file.md (Synthetic backup failure fixture.)",
          "",
          "Directories to materialize:",
          "- docs/.assets/config",
          "",
          "Retained paths:",
          "- CLAUDE.md (The managed file has local changes.)",
          "",
          "Skipped paths:",
          "- .backup/2026-04-17/AGENTS.md (Backup content is excluded from lifecycle operations.)",
        ].join("\n"),
      );
      expect(clackMocks.note).toHaveBeenCalledWith(
        expect.stringContaining("Materialized directories: 1"),
        "Backup complete",
      );
      expect(clackMocks.note).toHaveBeenCalledWith(
        expect.stringContaining("Safer destructive flow: make-docs uninstall --backup"),
        "WARNING",
      );
      expect(clackMocks.note).toHaveBeenCalledWith(
        expect.stringContaining(`Backup destination: ${backupDestinationDir}`),
        "WARNING",
      );
      expect(clackMocks.note).toHaveBeenCalledWith(
        expect.stringContaining("Files to remove: 1"),
        "make-docs uninstall",
      );
      expect(getClackNoteBody("make-docs uninstall")).toContain(
        [
          "Files to remove:",
          "- managed-file.md (Synthetic backup failure fixture.)",
          "",
          "Directories to prune:",
          "- docs/.assets/config (Directory is eligible for pruning.)",
          "",
          "Preserved paths:",
          "- CLAUDE.md (The managed file has local changes.)",
          "",
          "Skipped paths:",
          "- .backup/2026-04-17/AGENTS.md (Backup content is excluded from lifecycle operations.)",
        ].join("\n"),
      );
      expect(clackMocks.note).toHaveBeenCalledWith(
        expect.stringContaining("Backup: not requested"),
        "Uninstall complete",
      );
      expect(clackMocks.note).toHaveBeenCalledWith(
        expect.stringContaining("Error: simulated failure"),
        "Uninstall partially completed",
      );
      expect(clackMocks.outro).toHaveBeenCalledWith(
        "No make-docs-managed files required backup. No backup destination was created.",
      );
      expect(clackMocks.outro).toHaveBeenCalledWith("Backup cancelled.");
      expect(clackMocks.outro).toHaveBeenCalledWith(
        "Uninstall cancelled. No files were changed.",
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("Clack lifecycle confirmations handle approval, cancellation, prompt skipping, and non-TTY errors", async () => {
    const renderer = createClackLifecycleRenderer();

    await expect(renderer.confirmBackupRun("allow-all")).resolves.toBe(true);
    expect(clackMocks.confirm).not.toHaveBeenCalled();

    clackMocks.confirm.mockResolvedValueOnce(true);
    await expect(renderer.confirmBackupRun("confirm")).resolves.toBe(true);
    expect(clackMocks.confirm).toHaveBeenLastCalledWith(
      expect.objectContaining({
        message: "Create this backup?",
        initialValue: true,
        active: "Yes",
        inactive: "No",
        withGuide: true,
      }),
    );

    clackMocks.confirm.mockResolvedValueOnce(false);
    await expect(renderer.confirmUninstallWarning("confirm")).resolves.toBe(false);
    expect(clackMocks.confirm).toHaveBeenLastCalledWith(
      expect.objectContaining({
        message: "Continue with uninstall review?",
      }),
    );

    clackMocks.confirm.mockResolvedValueOnce("cancelled");
    await expect(
      renderer.confirmUninstallRun({
        permissions: "confirm",
        backupRequested: true,
      }),
    ).resolves.toBe(false);
    expect(clackMocks.confirm).toHaveBeenLastCalledWith(
      expect.objectContaining({
        message:
          "Create the backup and then remove these audited paths? This action cannot be undone.",
      }),
    );

    clackMocks.confirm.mockResolvedValueOnce(true);
    await expect(
      renderer.confirmUninstallRun({
        permissions: "confirm",
        backupRequested: false,
      }),
    ).resolves.toBe(true);
    expect(clackMocks.confirm).toHaveBeenLastCalledWith(
      expect.objectContaining({
        message: "Remove these audited paths? This action cannot be undone.",
      }),
    );

    const promptCount = clackMocks.confirm.mock.calls.length;
    setTTY(false);
    await expect(renderer.confirmBackupRun("confirm")).rejects.toThrow(
      "Backup confirmation requires a TTY. Re-run with `make-docs backup --yes`.",
    );
    await expect(
      renderer.confirmUninstallRun({
        permissions: "confirm",
        backupRequested: false,
      }),
    ).rejects.toThrow(
      "Uninstall confirmation requires a TTY. Re-run with `make-docs uninstall --yes`.",
    );
    expect(clackMocks.confirm).toHaveBeenCalledTimes(promptCount);
  });
});

function getClackNoteBody(title: string): string {
  const call = clackMocks.note.mock.calls.find(
    ([, noteTitle]) => noteTitle === title,
  );

  if (!call || typeof call[0] !== "string") {
    throw new Error(`Expected Clack note body for ${title}.`);
  }

  return call[0];
}

async function captureStdout<T>(operation: () => Promise<T>): Promise<T> {
  const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

  try {
    return await operation();
  } finally {
    writeSpy.mockRestore();
  }
}

function allAuditPaths(report: AuditReport): string[] {
  return [
    ...report.removableFiles,
    ...report.prunableDirectories,
    ...report.preservedPaths,
    ...report.skippedPaths,
  ].map((entry) => entry.path);
}

function createSyntheticAuditReport(targetDir: string, absolutePath: string): AuditReport {
  const removableFile: AuditRemovableFile = {
    path: "managed-file.md",
    absolutePath,
    kind: "file",
    scope: "project",
    pathScope: "project",
    backupRelativePath: "managed-file.md",
    backup: {
      scope: "project",
      relativePath: "managed-file.md",
    },
    ordering: {
      scopeOrder: 0,
      depth: 1,
      sortKey: "project:managed-file.md",
      pruneSortKey: "0001:project:managed-file.md",
    },
    ownershipSource: "manifest-file",
    reason: "Synthetic backup failure fixture.",
    reasonCode: "managed-file-hash-match",
  };

  return {
    mode: "manifest-present",
    targetDir,
    manifestPath: path.join(targetDir, "docs/.assets/config/manifest.json"),
    removableFiles: [removableFile],
    prunableDirectories: [],
    preservedPaths: [],
    skippedPaths: [],
  };
}

function createRendererAuditReport(targetDir: string): AuditReport {
  const removableFile = createSyntheticAuditReport(
    targetDir,
    path.join(targetDir, "AGENTS.md"),
  ).removableFiles[0];

  if (!removableFile) {
    throw new Error("Expected synthetic removable file.");
  }

  const prunableDirectory: AuditPrunableDirectory = {
    path: "docs/.assets/config",
    absolutePath: path.join(targetDir, "docs/.assets/config"),
    kind: "directory",
    scope: "project",
    pathScope: "project",
    backupRelativePath: "docs/.assets/config",
    backup: {
      scope: "project",
      relativePath: "docs/.assets/config",
    },
    ordering: {
      scopeOrder: 0,
      depth: 3,
      sortKey: "project:docs/.assets/config",
      pruneSortKey: "0003:project:docs/.assets/config",
    },
    reason: "Directory is eligible for pruning.",
    reasonCode: "directory-eligible-for-prune",
    removableDescendantPaths: ["docs/.assets/config/manifest.json"],
    preservedDescendantPaths: [],
  };
  const preservedPath: AuditPreservedPath = {
    path: "CLAUDE.md",
    absolutePath: path.join(targetDir, "CLAUDE.md"),
    kind: "file",
    scope: "project",
    pathScope: "project",
    backupRelativePath: "CLAUDE.md",
    backup: {
      scope: "project",
      relativePath: "CLAUDE.md",
    },
    ordering: {
      scopeOrder: 0,
      depth: 1,
      sortKey: "project:CLAUDE.md",
      pruneSortKey: "0001:project:CLAUDE.md",
    },
    reason: "The managed file has local changes.",
    reasonCode: "managed-file-modified",
  };
  const skippedPath: AuditSkippedPath = {
    path: ".backup/2026-04-17/AGENTS.md",
    absolutePath: path.join(targetDir, ".backup/2026-04-17/AGENTS.md"),
    kind: "file",
    scope: "project",
    pathScope: "project",
    backupRelativePath: null,
    backup: {
      scope: null,
      relativePath: null,
    },
    ordering: {
      scopeOrder: 0,
      depth: 3,
      sortKey: "project:.backup/2026-04-17/AGENTS.md",
      pruneSortKey: "0003:project:.backup/2026-04-17/AGENTS.md",
    },
    reason: "Backup content is excluded from lifecycle operations.",
    reasonCode: "inside-backup-root",
    status: "excluded",
  };

  return {
    mode: "manifest-present",
    targetDir,
    manifestPath: path.join(targetDir, "docs/.assets/config/manifest.json"),
    removableFiles: [removableFile],
    prunableDirectories: [prunableDirectory],
    preservedPaths: [preservedPath],
    skippedPaths: [skippedPath],
  };
}

function createRecordingLifecycleRenderer(events: string[]): LifecycleRenderer {
  return {
    beginWorkflow(title) {
      events.push(`workflow:${title}`);
    },
    renderBackupAuditSummary() {
      events.push("backup:audit-summary");
    },
    async confirmBackupRun() {
      events.push("backup:run-confirmation");
      return true;
    },
    renderBackupNoopSummary() {
      events.push("backup:noop-summary");
    },
    renderBackupCancelled() {
      events.push("backup:cancelled");
    },
    renderBackupCompletionSummary() {
      events.push("backup:completion-summary");
    },
    renderUninstallWarning() {
      events.push("uninstall:warning");
    },
    async confirmUninstallWarning() {
      events.push("uninstall:warning-confirmation");
      return true;
    },
    renderUninstallAuditSummary() {
      events.push("uninstall:audit-summary");
    },
    async confirmUninstallRun() {
      events.push("uninstall:run-confirmation");
      return true;
    },
    renderUninstallCancelled() {
      events.push("uninstall:cancelled");
    },
    renderUninstallCompletionSummary() {
      events.push("uninstall:completion-summary");
    },
    renderUninstallFailureSummary() {
      events.push("uninstall:failure-summary");
    },
  };
}
