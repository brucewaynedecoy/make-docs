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
import { loadManifest } from "../src/manifest";
import { runUninstallCommand } from "../src/uninstall";
import type { AuditReport, AuditRemovableFile } from "../src/types";
import {
  cleanupTempDir,
  createTempDir,
  installStarterDocsTarget,
  mockHomeDirectory,
  mockSkillFetches,
  setTTY,
} from "./helpers";

const NOW = new Date("2026-04-18T12:00:00Z");

describe("lifecycle validation", () => {
  beforeEach(() => {
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
      await installStarterDocsTarget(targetDir, (selections) => {
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
      await installStarterDocsTarget(targetDir, (selections) => {
        selections.skills = false;
      });
      rmSync(path.join(targetDir, "docs/.assets/config/manifest.json"), { force: true });
      mkdirSync(path.join(targetDir, "notes"), { recursive: true });
      writeFileSync(path.join(targetDir, "notes/AGENTS.md"), "not starter-docs\n");

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
      await installStarterDocsTarget(targetDir, (selections) => {
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
    const fakeHome = createTempDir("starter-docs-home-");
    const restoreHome = mockHomeDirectory(fakeHome);

    try {
      await installStarterDocsTarget(targetDir, (selections) => {
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
});

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
