import { stdin as input, stdout as output } from "node:process";
import { confirm, isCancel } from "@clack/prompts";
import type {
  AuditPathMetadata,
  AuditPreservedPath,
  AuditPrunableDirectory,
  AuditRemovableFile,
  AuditReport,
  AuditSkippedPath,
  BackupExecutionResult,
  LifecyclePermissionsMode,
} from "./types";

type LifecycleRenderableEntry =
  | AuditRemovableFile
  | AuditPrunableDirectory
  | AuditPreservedPath
  | AuditSkippedPath;

export function renderBackupAuditSummary(options: {
  auditReport: AuditReport;
  destinationDir: string | null;
}): void {
  const { auditReport, destinationDir } = options;
  renderBox([
    "starter-docs backup",
    `Target: ${auditReport.targetDir}`,
    `Destination: ${destinationDir ?? "(no backup directory will be created)"}`,
    `Files to copy: ${auditReport.removableFiles.length}`,
    `Directories to materialize: ${auditReport.prunableDirectories.length}`,
    `Retained: ${auditReport.preservedPaths.length}`,
    `Skipped: ${auditReport.skippedPaths.length}`,
  ]);

  renderEntryGroup(
    "Files to copy",
    auditReport.removableFiles,
    (entry) => `${formatPath(entry)} (${entry.reason})`,
  );
  renderEntryGroup("Directories to materialize", auditReport.prunableDirectories);
  renderEntryGroup(
    "Retained paths",
    auditReport.preservedPaths,
    (entry) => `${formatPath(entry)} (${entry.reason})`,
  );
  renderEntryGroup(
    "Skipped paths",
    auditReport.skippedPaths,
    (entry) => `${formatPath(entry)} (${entry.reason})`,
  );
}

export async function confirmBackupRun(
  permissions: LifecyclePermissionsMode,
): Promise<boolean> {
  if (permissions === "allow-all") {
    return true;
  }

  if (!input.isTTY || !output.isTTY) {
    throw new Error(
      "Backup confirmation requires a TTY. Re-run with `starter-docs backup --permissions allow-all`.",
    );
  }

  const proceed = await confirm({
    message: "Create this backup?",
    initialValue: true,
    active: "Yes",
    inactive: "No",
    withGuide: true,
  });

  return !(isCancel(proceed) || !proceed);
}

export function renderBackupNoopSummary(): void {
  output.write("\nNo starter-docs-managed files required backup.\n");
}

export function renderBackupCancelled(): void {
  output.write("\nBackup cancelled.\n");
}

export function renderBackupCompletionSummary(result: BackupExecutionResult): void {
  if (result.status !== "completed" || !result.destinationDir) {
    return;
  }

  renderBox([
    "Backup complete",
    `Destination: ${result.destinationDir}`,
    `Copied files: ${result.copiedFiles.length}`,
    `Materialized directories: ${result.materializedDirectories.length}`,
    `Retained paths surfaced: ${result.auditReport.preservedPaths.length}`,
    `Skipped paths surfaced: ${result.auditReport.skippedPaths.length}`,
  ]);
}

function renderBox(lines: string[]): void {
  const width = lines.reduce((max, line) => Math.max(max, line.length), 0);
  const border = `+${"-".repeat(width + 2)}+\n`;

  output.write(`\n${border}`);
  for (const line of lines) {
    output.write(`| ${line.padEnd(width, " ")} |\n`);
  }
  output.write(border);
}

function renderEntryGroup(
  title: string,
  entries: LifecycleRenderableEntry[],
  formatter: (entry: LifecycleRenderableEntry) => string = formatPath,
): void {
  output.write(`\n${title}:\n`);
  if (entries.length === 0) {
    output.write("- none\n");
    return;
  }

  for (const entry of entries) {
    output.write(`- ${formatter(entry)}\n`);
  }
}

function formatPath(entry: Pick<AuditPathMetadata, "path">): string {
  return entry.path;
}
