import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { applyInstallPlan, planInstall } from "../src/install";
import { loadManifest } from "../src/manifest";
import { defaultSelections } from "../src/profile";
import { readPackageFile } from "../src/utils";
import { cleanupTempDir, createTempDir, mockSkillFetches } from "./helpers";

type UnknownRecord = Record<string, unknown>;

type AuditEntryView = {
  bucket: string;
  path: string;
  backupRelativePath?: string;
  reason?: string;
  scope?: string;
};

const AUDIT_FUNCTION_NAMES = [
  "createAuditReport",
  "createSharedAuditReport",
  "runAudit",
  "auditStarterDocs",
  "auditLifecyclePaths",
] as const;

const REMOVABLE_BUCKETS = [
  "removableFiles",
  "filesEligibleForBackupAndOrRemoval",
  "filesToBackup",
  "backupCandidates",
  "copyableFiles",
  "managedFiles",
  "files",
] as const;

const PRUNABLE_DIRECTORY_BUCKETS = [
  "prunableDirectories",
  "directoriesToPrune",
  "directoryPruneCandidates",
  "pruneCandidates",
  "directories",
] as const;

const PRESERVED_BUCKETS = [
  "preservedPaths",
  "preserved",
  "retainedPaths",
  "retained",
  "conflictedPaths",
  "blockedPaths",
  "keptPaths",
] as const;

const SKIPPED_BUCKETS = [
  "skippedPaths",
  "skipped",
  "excludedPaths",
  "excluded",
  "alreadyAbsent",
  "alreadyAbsentPaths",
] as const;

const PATH_KEYS = [
  "path",
  "relativePath",
  "originalPath",
  "auditPath",
  "absolutePath",
  "sourcePath",
  "targetPath",
  "filePath",
  "directoryPath",
  "candidatePath",
] as const;

const BACKUP_PATH_KEYS = [
  "backupRelativePath",
  "backupPath",
  "backupRelativeDestination",
  "backupDestination",
  "destinationRelativePath",
  "destinationPath",
  "backupTargetPath",
  "relativeBackupPath",
] as const;

const REASON_KEYS = [
  "reason",
  "preservationReason",
  "skipReason",
  "message",
  "description",
  "detail",
  "explanation",
] as const;

const SCOPE_KEYS = ["scope", "pathScope", "location", "origin", "pathOrigin"] as const;
const MODE_KEYS = ["mode", "auditMode", "manifestMode", "sourceMode"] as const;
const BOOLEAN_MODE_KEYS = ["usedManifest", "hasManifest", "manifestPresent"] as const;
const CLASSIFICATION_KEYS = ["classification", "kind", "category", "status", "type"] as const;

async function installWithSelections(
  targetDir: string,
  configure: (selections: ReturnType<typeof defaultSelections>) => void,
) {
  const selections = defaultSelections();
  configure(selections);

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

  const manifest = loadManifest(targetDir);
  expect(manifest).not.toBeNull();
  return manifest!;
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

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function getStringField(
  value: UnknownRecord,
  candidateKeys: readonly string[],
): string | undefined {
  for (const candidateKey of candidateKeys) {
    for (const [key, fieldValue] of Object.entries(value)) {
      if (normalizeKey(key) !== normalizeKey(candidateKey)) {
        continue;
      }
      if (typeof fieldValue === "string") {
        return fieldValue;
      }
    }
  }

  return undefined;
}

function getBooleanField(
  value: UnknownRecord,
  candidateKeys: readonly string[],
): boolean | undefined {
  for (const candidateKey of candidateKeys) {
    for (const [key, fieldValue] of Object.entries(value)) {
      if (normalizeKey(key) !== normalizeKey(candidateKey)) {
        continue;
      }
      if (typeof fieldValue === "boolean") {
        return fieldValue;
      }
    }
  }

  return undefined;
}

function extractEntryPath(entry: unknown): string | undefined {
  if (typeof entry === "string") {
    return normalizePath(entry);
  }

  if (!isRecord(entry)) {
    return undefined;
  }

  const candidate = getStringField(entry, PATH_KEYS);
  return typeof candidate === "string" ? normalizePath(candidate) : undefined;
}

function extractBackupRelativePath(entry: unknown): string | undefined {
  if (!isRecord(entry)) {
    return undefined;
  }

  const candidate = getStringField(entry, BACKUP_PATH_KEYS);
  return typeof candidate === "string" ? normalizePath(candidate) : undefined;
}

function extractReason(entry: unknown): string | undefined {
  if (!isRecord(entry)) {
    return undefined;
  }

  return getStringField(entry, REASON_KEYS);
}

function extractScope(entry: unknown): string | undefined {
  if (!isRecord(entry)) {
    return undefined;
  }

  return getStringField(entry, SCOPE_KEYS);
}

function extractClassification(entry: unknown): string | undefined {
  if (!isRecord(entry)) {
    return undefined;
  }

  return getStringField(entry, CLASSIFICATION_KEYS)?.toLowerCase();
}

function collectEntries(
  report: unknown,
  candidateBuckets: readonly string[],
  candidateClassifications: readonly string[] = [],
): AuditEntryView[] {
  const queue: Array<{ value: unknown; depth: number }> = [{ value: report, depth: 0 }];
  const entries: AuditEntryView[] = [];
  const seen = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || current.depth > 3 || !isRecord(current.value)) {
      continue;
    }

    for (const [key, value] of Object.entries(current.value)) {
      if (Array.isArray(value)) {
        const normalizedBucket = normalizeKey(key);
        const bucketMatch = candidateBuckets.some((bucket) =>
          normalizedBucket.includes(normalizeKey(bucket)),
        );

        for (const item of value) {
          const classification = extractClassification(item);
          const classificationMatch = candidateClassifications.some((candidate) =>
            classification?.includes(candidate.toLowerCase()),
          );

          if (!bucketMatch && !classificationMatch) {
            continue;
          }

          const itemPath = extractEntryPath(item);
          if (!itemPath) {
            continue;
          }

          const entry = {
            bucket: key,
            path: itemPath,
            backupRelativePath: extractBackupRelativePath(item),
            reason: extractReason(item),
            scope: extractScope(item),
          };

          const dedupeKey = `${entry.bucket}:${entry.path}`;
          if (!seen.has(dedupeKey)) {
            seen.add(dedupeKey);
            entries.push(entry);
          }
        }

        continue;
      }

      if (isRecord(value)) {
        queue.push({ value, depth: current.depth + 1 });
      }
    }
  }

  return entries;
}

function collectAllEntries(report: unknown): AuditEntryView[] {
  const queue: Array<{ value: unknown; depth: number }> = [{ value: report, depth: 0 }];
  const entries: AuditEntryView[] = [];
  const seen = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || current.depth > 3 || !isRecord(current.value)) {
      continue;
    }

    for (const [key, value] of Object.entries(current.value)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          const itemPath = extractEntryPath(item);
          if (!itemPath) {
            continue;
          }

          const entry = {
            bucket: key,
            path: itemPath,
            backupRelativePath: extractBackupRelativePath(item),
            reason: extractReason(item),
            scope: extractScope(item),
          };

          const dedupeKey = `${entry.bucket}:${entry.path}`;
          if (!seen.has(dedupeKey)) {
            seen.add(dedupeKey);
            entries.push(entry);
          }
        }

        continue;
      }

      if (isRecord(value)) {
        queue.push({ value, depth: current.depth + 1 });
      }
    }
  }

  return entries;
}

function findEntry(entries: AuditEntryView[], expectedPath: string): AuditEntryView | undefined {
  const normalizedExpectedPath = normalizePath(expectedPath);
  return entries.find((entry) => entry.path === normalizedExpectedPath);
}

function getAuditMode(report: unknown): string | undefined {
  const queue: unknown[] = [report];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!isRecord(current)) {
      continue;
    }

    const explicitMode = getStringField(current, MODE_KEYS);
    if (explicitMode) {
      return explicitMode;
    }

    const manifestBoolean = getBooleanField(current, BOOLEAN_MODE_KEYS);
    if (manifestBoolean !== undefined) {
      return manifestBoolean ? "manifest-present" : "manifest-missing";
    }

    for (const value of Object.values(current)) {
      if (isRecord(value)) {
        queue.push(value);
      }
    }
  }

  return undefined;
}

function summarizeAudit(report: unknown): string {
  const mode = getAuditMode(report) ?? "unknown";
  const entries = collectAllEntries(report)
    .map((entry) => `${entry.bucket}:${entry.path}`)
    .sort();

  return `mode=${mode}; entries=${entries.join(", ")}`;
}

function expectAuditMode(report: unknown, expectedMode: "manifest-present" | "manifest-missing") {
  const actualMode = getAuditMode(report);
  expect(actualMode, `missing audit mode on report: ${summarizeAudit(report)}`).toBeDefined();
  expect(actualMode?.toLowerCase()).toContain(expectedMode);
}

async function runAudit(options: { targetDir: string; manifest?: unknown | null }): Promise<unknown> {
  const modulePath = "../src/audit";
  const auditModule = (await import(modulePath)) as UnknownRecord;
  const auditFn = AUDIT_FUNCTION_NAMES.map((name) => auditModule[name]).find(
    (candidate): candidate is (...args: unknown[]) => unknown => typeof candidate === "function",
  );

  expect(
    auditFn,
    `expected ${modulePath} to export one of ${AUDIT_FUNCTION_NAMES.join(", ")}`,
  ).toBeTypeOf("function");

  const attempts = [
    () => auditFn!({ targetDir: options.targetDir, manifest: options.manifest ?? null }),
    () => auditFn!({ targetDir: options.targetDir }),
    () => auditFn!(options.targetDir, options.manifest ?? null),
    () => auditFn!(options.targetDir),
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

describe("shared audit engine", () => {
  beforeEach(() => {
    mockSkillFetches();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("covers manifest-present audit with managed docs files, skill files, and exact-match root instructions", async () => {
    const targetDir = createTempDir();

    try {
      const manifest = await installWithSelections(targetDir, () => {});
      const report = await runAudit({ targetDir, manifest });

      expectAuditMode(report, "manifest-present");

      const removableEntries = collectEntries(report, REMOVABLE_BUCKETS, ["removable"]);
      const docsEntry = findEntry(removableEntries, "docs/AGENTS.md");
      const skillEntry = findEntry(removableEntries, ".agents/skills/archive-docs/SKILL.md");
      const rootAgentsEntry = findEntry(removableEntries, "AGENTS.md");
      const rootClaudeEntry = findEntry(removableEntries, "CLAUDE.md");

      expect(docsEntry, summarizeAudit(report)).toBeDefined();
      expect(skillEntry, summarizeAudit(report)).toBeDefined();
      expect(rootAgentsEntry, summarizeAudit(report)).toBeDefined();
      expect(rootClaudeEntry, summarizeAudit(report)).toBeDefined();
      expect(docsEntry?.backupRelativePath ?? docsEntry?.path).toBe("docs/AGENTS.md");
      expect(skillEntry?.backupRelativePath ?? skillEntry?.path).toBe(
        ".agents/skills/archive-docs/SKILL.md",
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("covers manifest-missing fallback conservatively and ignores unrelated lookalike paths", async () => {
    const targetDir = createTempDir();

    try {
      await installWithSelections(targetDir, () => {});

      const unrelatedInstructionPath = path.join(targetDir, "notes/AGENTS.md");
      mkdirSync(path.dirname(unrelatedInstructionPath), { recursive: true });
      writeFileSync(unrelatedInstructionPath, readPackageFile("AGENTS.md"), "utf8");
      rmSync(path.join(targetDir, "docs/.assets/starter-docs/manifest.json"), { force: true });

      const report = await runAudit({ targetDir, manifest: null });

      expectAuditMode(report, "manifest-missing");

      const removableEntries = collectEntries(report, REMOVABLE_BUCKETS, ["removable"]);
      const allEntries = collectAllEntries(report);

      expect(findEntry(removableEntries, "AGENTS.md"), summarizeAudit(report)).toBeDefined();
      expect(findEntry(removableEntries, "docs/AGENTS.md"), summarizeAudit(report)).toBeDefined();
      expect(findEntry(allEntries, "notes/AGENTS.md"), summarizeAudit(report)).toBeUndefined();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("covers .backup exclusion for removable files and prunable directories", async () => {
    const targetDir = createTempDir();

    try {
      const manifest = await installWithSelections(targetDir, () => {});

      const backupFile = path.join(targetDir, ".backup/2026-04-18/docs/AGENTS.md");
      mkdirSync(path.dirname(backupFile), { recursive: true });
      writeFileSync(backupFile, readPackageFile("AGENTS.md"), "utf8");

      const report = await runAudit({ targetDir, manifest });

      const removableEntries = collectEntries(report, REMOVABLE_BUCKETS, ["removable"]);
      const prunableDirectories = collectEntries(report, PRUNABLE_DIRECTORY_BUCKETS, ["prunable"]);

      expect(
        removableEntries.some((entry) => entry.path.startsWith(".backup/")),
        summarizeAudit(report),
      ).toBe(false);
      expect(
        prunableDirectories.some((entry) => entry.path.startsWith(".backup/")),
        summarizeAudit(report),
      ).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("covers modified root instruction files as preserved rather than removable", async () => {
    const targetDir = createTempDir();

    try {
      const manifest = await installWithSelections(targetDir, () => {});

      writeFileSync(path.join(targetDir, "AGENTS.md"), "custom root codex instructions\n", "utf8");
      writeFileSync(path.join(targetDir, "CLAUDE.md"), "custom root claude instructions\n", "utf8");

      const report = await runAudit({ targetDir, manifest });

      const removableEntries = collectEntries(report, REMOVABLE_BUCKETS, ["removable"]);
      const preservedEntries = collectEntries(report, PRESERVED_BUCKETS, ["preserved", "retained"]);
      const preservedAgents = findEntry(preservedEntries, "AGENTS.md");
      const preservedClaude = findEntry(preservedEntries, "CLAUDE.md");

      expect(findEntry(removableEntries, "AGENTS.md"), summarizeAudit(report)).toBeUndefined();
      expect(findEntry(removableEntries, "CLAUDE.md"), summarizeAudit(report)).toBeUndefined();
      expect(preservedAgents, summarizeAudit(report)).toBeDefined();
      expect(preservedClaude, summarizeAudit(report)).toBeDefined();
      expect(typeof preservedAgents?.reason, summarizeAudit(report)).toBe("string");
      expect(typeof preservedClaude?.reason, summarizeAudit(report)).toBe("string");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("covers preserved directories with unmanaged descendants while removable leaves remain classified", async () => {
    const targetDir = createTempDir();

    try {
      const manifest = await installWithSelections(targetDir, (selections) => {
        selections.harnesses["claude-code"] = false;
        selections.harnesses.codex = true;
      });

      const unmanagedLeaf = path.join(targetDir, "docs/work/user-notes.md");
      mkdirSync(path.dirname(unmanagedLeaf), { recursive: true });
      writeFileSync(unmanagedLeaf, "keep this note\n", "utf8");

      const report = await runAudit({ targetDir, manifest });

      const removableEntries = collectEntries(report, REMOVABLE_BUCKETS, ["removable"]);
      const preservedEntries = collectEntries(report, PRESERVED_BUCKETS, ["preserved", "retained"]);
      const prunableDirectories = collectEntries(report, PRUNABLE_DIRECTORY_BUCKETS, ["prunable"]);

      expect(findEntry(removableEntries, "docs/work/AGENTS.md"), summarizeAudit(report)).toBeDefined();
      expect(findEntry(preservedEntries, "docs/work"), summarizeAudit(report)).toBeDefined();
      expect(findEntry(prunableDirectories, "docs/work"), summarizeAudit(report)).toBeUndefined();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("covers home and global path mapping to _home backup-relative destinations", async () => {
    const targetDir = createTempDir();
    const fakeHome = createTempDir("starter-docs-home-");
    const restoreHome = mockHomeDirectory(fakeHome);

    try {
      const manifest = await installWithSelections(targetDir, (selections) => {
        selections.skillScope = "global";
      });

      const report = await runAudit({ targetDir, manifest });
      const removableEntries = collectEntries(report, REMOVABLE_BUCKETS, ["removable"]);
      const globalSkillPath = path.join(fakeHome, ".claude/skills/archive-docs/SKILL.md");
      const globalSkillEntry = findEntry(removableEntries, globalSkillPath);

      expect(globalSkillEntry, summarizeAudit(report)).toBeDefined();
      expect(globalSkillEntry?.backupRelativePath, summarizeAudit(report)).toBeDefined();
      expect(globalSkillEntry?.backupRelativePath?.endsWith("_home/.claude/skills/archive-docs/SKILL.md")).toBe(
        true,
      );

      if (globalSkillEntry?.scope) {
        expect(globalSkillEntry.scope.toLowerCase()).toMatch(/home|global/);
      }
    } finally {
      restoreHome();
      cleanupTempDir(targetDir);
      cleanupTempDir(fakeHome);
    }
  });

  test("covers skipped or already-absent managed paths without treating them as removable errors", async () => {
    const targetDir = createTempDir();

    try {
      const manifest = await installWithSelections(targetDir, () => {});
      rmSync(path.join(targetDir, "docs/AGENTS.md"), { force: true });

      const report = await runAudit({ targetDir, manifest });
      const removableEntries = collectEntries(report, REMOVABLE_BUCKETS, ["removable"]);
      const skippedEntries = collectEntries(report, SKIPPED_BUCKETS, [
        "skipped",
        "already-absent",
        "excluded",
      ]);

      expect(findEntry(removableEntries, "docs/AGENTS.md"), summarizeAudit(report)).toBeUndefined();
      expect(findEntry(skippedEntries, "docs/AGENTS.md"), summarizeAudit(report)).toBeDefined();
    } finally {
      cleanupTempDir(targetDir);
    }
  });
});
