import { stdin as input, stdout as output } from "node:process";
import { confirm, isCancel, note } from "@clack/prompts";
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
    "make-docs backup",
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
  return confirmLifecycleCheckpoint({
    permissions,
    message: "Create this backup?",
    ttyError:
      "Backup confirmation requires a TTY. Re-run with `make-docs backup --yes`.",
  });
}

export function renderUninstallWarning(options: {
  targetDir: string;
  backupDestinationDir: string | null;
}): void {
  const lines = ["This command removes audited make-docs-managed paths", ""];

  if (options.backupDestinationDir) {
    lines.push("A backup will be created before removal begins.");
    lines.push(`Backup destination: ${options.backupDestinationDir}`);
  } else {
    lines.push("Safer alternative: make-docs backup");
    lines.push("Safer destructive flow: make-docs uninstall --backup");
  }

  note(lines.join("\n"), "WARNING");
}

export async function confirmUninstallWarning(
  permissions: LifecyclePermissionsMode,
): Promise<boolean> {
  return confirmLifecycleCheckpoint({
    permissions,
    message: "Continue with uninstall review?",
    ttyError:
      "Uninstall confirmation requires a TTY. Re-run with `make-docs uninstall --yes`.",
  });
}

export function renderUninstallAuditSummary(options: {
  auditReport: AuditReport;
  backupDestinationDir: string | null;
}): void {
  const { auditReport, backupDestinationDir } = options;
  renderBox([
    "make-docs uninstall",
    `Target: ${auditReport.targetDir}`,
    `Backup before removal: ${backupDestinationDir ?? "not requested"}`,
    `Files to remove: ${auditReport.removableFiles.length}`,
    `Directories to prune: ${auditReport.prunableDirectories.length}`,
    `Preserved: ${auditReport.preservedPaths.length}`,
    `Skipped: ${auditReport.skippedPaths.length}`,
  ]);

  renderEntryGroup(
    "Files to remove",
    auditReport.removableFiles,
    (entry) => `${formatPath(entry)} (${entry.reason})`,
  );
  renderEntryGroup(
    "Directories to prune",
    auditReport.prunableDirectories,
    (entry) => `${formatPath(entry)} (${entry.reason})`,
  );
  renderEntryGroup(
    "Preserved paths",
    auditReport.preservedPaths,
    (entry) => `${formatPath(entry)} (${entry.reason})`,
  );
  renderEntryGroup(
    "Skipped paths",
    auditReport.skippedPaths,
    (entry) => `${formatPath(entry)} (${entry.reason})`,
  );
}

export async function confirmUninstallRun(options: {
  permissions: LifecyclePermissionsMode;
  backupRequested: boolean;
}): Promise<boolean> {
  const message = options.backupRequested
    ? "Create the backup and then remove these audited paths? This action cannot be undone."
    : "Remove these audited paths? This action cannot be undone.";

  return confirmLifecycleCheckpoint({
    permissions: options.permissions,
    message,
    ttyError:
      "Uninstall confirmation requires a TTY. Re-run with `make-docs uninstall --yes`.",
  });
}

export function renderUninstallCancelled(): void {
  output.write("\nUninstall cancelled. No files were changed.\n");
}

export function renderUninstallCompletionSummary(options: {
  auditReport: AuditReport;
  removedFiles: string[];
  prunedDirectories: string[];
  backupResult: BackupExecutionResult | null;
}): void {
  renderBox([
    "Uninstall complete",
    `Files removed: ${options.removedFiles.length}`,
    `Directories pruned: ${options.prunedDirectories.length}`,
    `Preserved paths: ${options.auditReport.preservedPaths.length}`,
    `Skipped paths: ${options.auditReport.skippedPaths.length}`,
    `Backup: ${formatBackupStatus(options.backupResult)}`,
  ]);
}

export function renderUninstallFailureSummary(options: {
  auditReport: AuditReport;
  removedFiles: string[];
  prunedDirectories: string[];
  backupResult: BackupExecutionResult | null;
  errorMessage: string;
}): void {
  renderBox([
    "Uninstall partially completed",
    `Files removed before failure: ${options.removedFiles.length}`,
    `Directories pruned before failure: ${options.prunedDirectories.length}`,
    `Preserved paths: ${options.auditReport.preservedPaths.length}`,
    `Skipped paths: ${options.auditReport.skippedPaths.length}`,
    `Backup: ${formatBackupStatus(options.backupResult)}`,
    `Error: ${options.errorMessage}`,
  ]);
}

export function renderBackupNoopSummary(): void {
  output.write("\nNo make-docs-managed files required backup.\n");
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

function formatBackupStatus(result: BackupExecutionResult | null): string {
  if (!result) {
    return "not requested";
  }

  if (result.status === "completed" && result.destinationDir) {
    return `created at ${result.destinationDir}`;
  }

  if (result.status === "noop") {
    return "requested, but no backup files or directories needed to be created";
  }

  return "requested";
}

async function confirmLifecycleCheckpoint(options: {
  permissions: LifecyclePermissionsMode;
  message: string;
  ttyError: string;
}): Promise<boolean> {
  if (options.permissions === "allow-all") {
    return true;
  }

  if (!input.isTTY || !output.isTTY) {
    throw new Error(options.ttyError);
  }

  const proceed = await confirm({
    message: options.message,
    initialValue: true,
    active: "Yes",
    inactive: "No",
    withGuide: true,
  });

  return !(isCancel(proceed) || !proceed);
}
