import { stdin as input, stdout as output } from "node:process";
import { confirm, intro, isCancel, note, outro } from "@clack/prompts";
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

export type LifecycleAuditSummaryOptions = {
  auditReport: AuditReport;
  destinationDir: string | null;
};

export type LifecycleUninstallWarningOptions = {
  targetDir: string;
  backupDestinationDir: string | null;
};

export type LifecycleUninstallAuditSummaryOptions = {
  auditReport: AuditReport;
  backupDestinationDir: string | null;
};

export type LifecycleUninstallRunConfirmationOptions = {
  permissions: LifecyclePermissionsMode;
  backupRequested: boolean;
};

export type LifecycleUninstallCompletionSummaryOptions = {
  auditReport: AuditReport;
  removedFiles: string[];
  prunedDirectories: string[];
  backupResult: BackupExecutionResult | null;
};

export type LifecycleUninstallFailureSummaryOptions =
  LifecycleUninstallCompletionSummaryOptions & {
    errorMessage: string;
  };

export interface LifecycleRenderer {
  beginWorkflow(title: string): void;
  renderBackupAuditSummary(options: LifecycleAuditSummaryOptions): void;
  confirmBackupRun(permissions: LifecyclePermissionsMode): Promise<boolean>;
  renderBackupNoopSummary(): void;
  renderBackupCancelled(): void;
  renderBackupCompletionSummary(result: BackupExecutionResult): void;
  renderUninstallWarning(options: LifecycleUninstallWarningOptions): void;
  confirmUninstallWarning(
    permissions: LifecyclePermissionsMode,
  ): Promise<boolean>;
  renderUninstallAuditSummary(
    options: LifecycleUninstallAuditSummaryOptions,
  ): void;
  confirmUninstallRun(
    options: LifecycleUninstallRunConfirmationOptions,
  ): Promise<boolean>;
  renderUninstallCancelled(): void;
  renderUninstallCompletionSummary(
    options: LifecycleUninstallCompletionSummaryOptions,
  ): void;
  renderUninstallFailureSummary(
    options: LifecycleUninstallFailureSummaryOptions,
  ): void;
}

let lifecycleRenderer: LifecycleRenderer = createClackLifecycleRenderer();

export function createClackLifecycleRenderer(): LifecycleRenderer {
  return {
    beginWorkflow(title) {
      intro(title);
    },
    renderBackupAuditSummary(options) {
      renderAuditNote({
        title: "make-docs backup",
        lines: buildBackupAuditSummaryLines(options),
        groups: [
          formatEntryGroup(
            "Files to copy",
            options.auditReport.removableFiles,
            (entry) => `${formatPath(entry)} (${entry.reason})`,
          ),
          formatEntryGroup(
            "Directories to materialize",
            options.auditReport.prunableDirectories,
          ),
          formatEntryGroup(
            "Retained paths",
            options.auditReport.preservedPaths,
            (entry) => `${formatPath(entry)} (${entry.reason})`,
          ),
          formatEntryGroup(
            "Skipped paths",
            options.auditReport.skippedPaths,
            (entry) => `${formatPath(entry)} (${entry.reason})`,
          ),
        ],
      });
    },
    confirmBackupRun(permissions) {
      return confirmLifecycleCheckpoint({
        permissions,
        message: "Create this backup?",
        ttyError:
          "Backup confirmation requires a TTY. Re-run with `make-docs backup --yes`.",
      });
    },
    renderBackupNoopSummary() {
      outro("No make-docs-managed files required backup.");
    },
    renderBackupCancelled() {
      outro("Backup cancelled.");
    },
    renderBackupCompletionSummary(result) {
      if (result.status !== "completed" || !result.destinationDir) {
        return;
      }

      note(
        [
          `Destination: ${result.destinationDir}`,
          `Copied files: ${result.copiedFiles.length}`,
          `Materialized directories: ${result.materializedDirectories.length}`,
          `Retained paths surfaced: ${result.auditReport.preservedPaths.length}`,
          `Skipped paths surfaced: ${result.auditReport.skippedPaths.length}`,
        ].join("\n"),
        "Backup complete",
      );
    },
    renderUninstallWarning(options) {
      const lines = ["This command removes audited make-docs-managed paths", ""];

      if (options.backupDestinationDir) {
        lines.push("A backup will be created before removal begins.");
        lines.push(`Backup destination: ${options.backupDestinationDir}`);
      } else {
        lines.push("Safer alternative: make-docs backup");
        lines.push("Safer destructive flow: make-docs uninstall --backup");
      }

      note(lines.join("\n"), "WARNING");
    },
    confirmUninstallWarning(permissions) {
      return confirmLifecycleCheckpoint({
        permissions,
        message: "Continue with uninstall review?",
        ttyError:
          "Uninstall confirmation requires a TTY. Re-run with `make-docs uninstall --yes`.",
      });
    },
    renderUninstallAuditSummary(options) {
      renderAuditNote({
        title: "make-docs uninstall",
        lines: buildUninstallAuditSummaryLines(options),
        groups: [
          formatEntryGroup(
            "Files to remove",
            options.auditReport.removableFiles,
            (entry) => `${formatPath(entry)} (${entry.reason})`,
          ),
          formatEntryGroup(
            "Directories to prune",
            options.auditReport.prunableDirectories,
            (entry) => `${formatPath(entry)} (${entry.reason})`,
          ),
          formatEntryGroup(
            "Preserved paths",
            options.auditReport.preservedPaths,
            (entry) => `${formatPath(entry)} (${entry.reason})`,
          ),
          formatEntryGroup(
            "Skipped paths",
            options.auditReport.skippedPaths,
            (entry) => `${formatPath(entry)} (${entry.reason})`,
          ),
        ],
      });
    },
    confirmUninstallRun(options) {
      const message = options.backupRequested
        ? "Create the backup and then remove these audited paths? This action cannot be undone."
        : "Remove these audited paths? This action cannot be undone.";

      return confirmLifecycleCheckpoint({
        permissions: options.permissions,
        message,
        ttyError:
          "Uninstall confirmation requires a TTY. Re-run with `make-docs uninstall --yes`.",
      });
    },
    renderUninstallCancelled() {
      outro("Uninstall cancelled. No files were changed.");
    },
    renderUninstallCompletionSummary(options) {
      note(
        [
          `Files removed: ${options.removedFiles.length}`,
          `Directories pruned: ${options.prunedDirectories.length}`,
          `Preserved paths: ${options.auditReport.preservedPaths.length}`,
          `Skipped paths: ${options.auditReport.skippedPaths.length}`,
          `Backup: ${formatBackupStatus(options.backupResult)}`,
        ].join("\n"),
        "Uninstall complete",
      );
    },
    renderUninstallFailureSummary(options) {
      note(
        [
          `Files removed before failure: ${options.removedFiles.length}`,
          `Directories pruned before failure: ${options.prunedDirectories.length}`,
          `Preserved paths: ${options.auditReport.preservedPaths.length}`,
          `Skipped paths: ${options.auditReport.skippedPaths.length}`,
          `Backup: ${formatBackupStatus(options.backupResult)}`,
          `Error: ${options.errorMessage}`,
        ].join("\n"),
        "Uninstall partially completed",
      );
    },
  };
}

export function getLifecycleRenderer(): LifecycleRenderer {
  return lifecycleRenderer;
}

export function __setLifecycleRendererForTests(
  renderer: LifecycleRenderer | null,
): void {
  lifecycleRenderer = renderer ?? createClackLifecycleRenderer();
}

export function beginLifecycleWorkflow(title: string): void {
  getLifecycleRenderer().beginWorkflow(title);
}

export function renderBackupAuditSummary(
  options: LifecycleAuditSummaryOptions,
): void {
  getLifecycleRenderer().renderBackupAuditSummary(options);
}

export async function confirmBackupRun(
  permissions: LifecyclePermissionsMode,
): Promise<boolean> {
  return getLifecycleRenderer().confirmBackupRun(permissions);
}

export function renderUninstallWarning(
  options: LifecycleUninstallWarningOptions,
): void {
  getLifecycleRenderer().renderUninstallWarning(options);
}

export async function confirmUninstallWarning(
  permissions: LifecyclePermissionsMode,
): Promise<boolean> {
  return getLifecycleRenderer().confirmUninstallWarning(permissions);
}

export function renderUninstallAuditSummary(
  options: LifecycleUninstallAuditSummaryOptions,
): void {
  getLifecycleRenderer().renderUninstallAuditSummary(options);
}

export async function confirmUninstallRun(
  options: LifecycleUninstallRunConfirmationOptions,
): Promise<boolean> {
  return getLifecycleRenderer().confirmUninstallRun(options);
}

export function renderUninstallCancelled(): void {
  getLifecycleRenderer().renderUninstallCancelled();
}

export function renderUninstallCompletionSummary(
  options: LifecycleUninstallCompletionSummaryOptions,
): void {
  getLifecycleRenderer().renderUninstallCompletionSummary(options);
}

export function renderUninstallFailureSummary(
  options: LifecycleUninstallFailureSummaryOptions,
): void {
  getLifecycleRenderer().renderUninstallFailureSummary(options);
}

export function renderBackupNoopSummary(): void {
  getLifecycleRenderer().renderBackupNoopSummary();
}

export function renderBackupCancelled(): void {
  getLifecycleRenderer().renderBackupCancelled();
}

export function renderBackupCompletionSummary(
  result: BackupExecutionResult,
): void {
  getLifecycleRenderer().renderBackupCompletionSummary(result);
}

function buildBackupAuditSummaryLines(options: LifecycleAuditSummaryOptions): string[] {
  const { auditReport, destinationDir } = options;
  return [
    `Target: ${auditReport.targetDir}`,
    `Destination: ${destinationDir ?? "(no backup directory will be created)"}`,
    `Files to copy: ${auditReport.removableFiles.length}`,
    `Directories to materialize: ${auditReport.prunableDirectories.length}`,
    `Retained: ${auditReport.preservedPaths.length}`,
    `Skipped: ${auditReport.skippedPaths.length}`,
  ];
}

function buildUninstallAuditSummaryLines(
  options: LifecycleUninstallAuditSummaryOptions,
): string[] {
  const { auditReport, backupDestinationDir } = options;
  return [
    `Target: ${auditReport.targetDir}`,
    `Backup before removal: ${backupDestinationDir ?? "not requested"}`,
    `Files to remove: ${auditReport.removableFiles.length}`,
    `Directories to prune: ${auditReport.prunableDirectories.length}`,
    `Preserved: ${auditReport.preservedPaths.length}`,
    `Skipped: ${auditReport.skippedPaths.length}`,
  ];
}

function renderAuditNote(options: {
  title: string;
  lines: string[];
  groups: string[][];
}): void {
  note([...options.lines, "", ...options.groups.flat()].join("\n"), options.title);
}

function formatEntryGroup(
  title: string,
  entries: LifecycleRenderableEntry[],
  formatter: (entry: LifecycleRenderableEntry) => string = formatPath,
): string[] {
  if (entries.length === 0) {
    return [`${title}:`, "- none"];
  }

  return [`${title}:`, ...entries.map((entry) => `- ${formatter(entry)}`)];
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
