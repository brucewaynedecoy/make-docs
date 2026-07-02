import { existsSync } from "node:fs";
import { stdin, stdout } from "node:process";
import { confirm, isCancel } from "@clack/prompts";
import {
  removeGlobalStore,
  resolveStoreRoot,
  type RemoveGlobalStoreResult,
} from "../store";
import {
  defaultExecCommand,
  detectInstallSource,
  formatManagerCommand,
  INSTALL_MANAGER_MATRIX,
  type ExecCommand,
  type InstallDetection,
  type InstallManagerId,
} from "./install-manager";
import { defaultSelfCommandOutput, type SelfCommandOutput } from "./pre-v2";

/**
 * Top-level `make-docs uninstall` — machine-footprint removal (W18 R11 P3;
 * PRD 39 R-SELF-1, R-SELF-3).
 *
 * Removes Make Docs' machine-level footprint only: the global store at
 * `~/.make-docs/` (via the structurally-safe {@link removeGlobalStore} seam,
 * which never deletes repository content and refuses roots that look like a
 * project `.make-docs/` directory) and the installed binary when exactly one
 * install manager unambiguously owns it. For a remote-execution user there
 * is no binary: the store is removed and the command reports that no binary
 * is installed. When ownership is ambiguous the command never guesses — it
 * prints the exact uninstall command(s) and the affected store path instead
 * of acting. Project removal remains exclusively `make-docs setup remove`;
 * this command never reads or writes the current working directory.
 */

export interface ToolUninstallOptions {
  /** Counts as confirmation; required for non-TTY runs. */
  yes: boolean;
  storeRoot?: string;
  homeDir?: string;
  env?: NodeJS.ProcessEnv;
  execPath?: string;
  argv1?: string;
  /** Injectable seams (tests). */
  exec?: ExecCommand;
  realpath?: (candidate: string) => string;
  output?: SelfCommandOutput;
}

export type ToolUninstallBinaryOutcome =
  | { kind: "removed"; manager: InstallManagerId; command: string; exitCode: number | null }
  | { kind: "failed"; manager: InstallManagerId; command: string; exitCode: number | null }
  | { kind: "not-installed"; evidence: string }
  | { kind: "manual"; candidates: InstallManagerId[]; commands: string[] };

export interface ToolUninstallResult {
  status:
    | "completed"
    | "cancelled"
    | "refused-non-interactive"
    | "manual-binary-removal-required";
  storeRoot: string;
  detection: InstallDetection;
  storeRemoval: RemoveGlobalStoreResult | null;
  binary: ToolUninstallBinaryOutcome | null;
  /** Human-readable report lines, also written to the output seam. */
  lines: string[];
}

export async function runToolUninstallCommand(
  options: ToolUninstallOptions,
): Promise<ToolUninstallResult> {
  const output = options.output ?? defaultSelfCommandOutput;
  const exec = options.exec ?? defaultExecCommand;
  const storeRoot = resolveStoreRoot({
    storeRoot: options.storeRoot,
    env: options.env,
    homeDir: options.homeDir,
  });
  const detection = detectInstallSource({
    argv1: options.argv1,
    execPath: options.execPath,
    realpath: options.realpath,
  });

  const lines: string[] = [];
  const emit = (line: string) => {
    lines.push(line);
    output.write(line);
  };

  emit("make-docs uninstall removes the machine-level footprint only:");
  emit(
    `- global store: ${storeRoot}${existsSync(storeRoot) ? "" : " (not present)"}`,
  );
  emit(`- installed binary: ${describeBinaryFootprint(detection)}`);
  emit(
    "Repository content is never touched; to remove make-docs from a project, use `make-docs setup remove`.",
  );

  const result: ToolUninstallResult = {
    status: "completed",
    storeRoot,
    detection,
    storeRemoval: null,
    binary: null,
    lines,
  };

  if (!options.yes) {
    if (!stdin.isTTY || !stdout.isTTY) {
      result.status = "refused-non-interactive";
      emit(
        "Uninstall confirmation requires a TTY. Re-run with `make-docs uninstall --yes` to confirm removal of the footprint listed above. Nothing was removed.",
      );
      return result;
    }

    const proceed = await confirm({
      message: "Remove the make-docs machine footprint listed above?",
      initialValue: false,
      active: "Yes",
      inactive: "No",
      withGuide: true,
    });
    if (isCancel(proceed) || !proceed) {
      result.status = "cancelled";
      emit("Uninstall cancelled. Nothing was removed.");
      return result;
    }
  }

  const storeRemoval = removeGlobalStore({
    storeRoot,
    env: options.env,
    homeDir: options.homeDir,
  });
  result.storeRemoval = storeRemoval;
  emit(describeStoreRemoval(storeRemoval));
  for (const warning of storeRemoval.warnings) {
    emit(`Warning: ${warning}`);
  }

  if (detection.kind === "persistent") {
    const command = formatManagerCommand(detection.manager.uninstallCommand);
    const { exitCode } = await exec(
      detection.manager.uninstallCommand.command,
      detection.manager.uninstallCommand.args,
    );
    if (exitCode === 0) {
      result.binary = {
        kind: "removed",
        manager: detection.manager.id,
        command,
        exitCode,
      };
      emit(`Removed the installed binary via ${detection.manager.id}: ${command}`);
    } else {
      result.binary = {
        kind: "failed",
        manager: detection.manager.id,
        command,
        exitCode,
      };
      result.status = "manual-binary-removal-required";
      emit(
        `The ${detection.manager.id} uninstall command failed (exit code ${exitCode ?? "unknown"}). Run it manually: ${command}`,
      );
    }
    return result;
  }

  if (detection.kind === "remote") {
    result.binary = { kind: "not-installed", evidence: detection.evidence };
    emit(
      "No make-docs binary is installed on this machine: this invocation runs via a package runner (remote execution). The global store removal above is the complete machine footprint.",
    );
    return result;
  }

  // Ambiguous ownership: never guess and execute (R-SELF-3). Print the
  // exact command(s) and the affected store path instead.
  const candidates =
    detection.candidates.length > 0 ? detection.candidates : [...INSTALL_MANAGER_MATRIX];
  const commands = candidates.map((candidate) =>
    formatManagerCommand(candidate.uninstallCommand),
  );
  result.binary = {
    kind: "manual",
    candidates: candidates.map((candidate) => candidate.id),
    commands,
  };
  result.status = "manual-binary-removal-required";
  emit(
    `Could not determine which install manager owns the make-docs binary (${detection.reason})`,
  );
  emit(
    "make-docs will not guess and run a destructive global change. If you installed the binary yourself, run the matching command:",
  );
  for (const command of commands) {
    emit(`  ${command}`);
  }
  emit(`Affected store path: ${storeRoot}`);
  return result;
}

function describeBinaryFootprint(detection: InstallDetection): string {
  if (detection.kind === "persistent") {
    return `${detection.binaryPath} (managed by ${detection.manager.id}; will run \`${formatManagerCommand(detection.manager.uninstallCommand)}\`)`;
  }
  if (detection.kind === "remote") {
    return "none detected (remote execution via a package runner; nothing persistent to remove)";
  }
  return "ownership is ambiguous; the exact command(s) will be printed instead of executed";
}

function describeStoreRemoval(removal: RemoveGlobalStoreResult): string {
  switch (removal.status) {
    case "removed":
      return `Removed the global store at ${removal.storeRoot} (${removal.removedFiles.length} file(s)).`;
    case "not-found":
      return `No global store exists at ${removal.storeRoot}; nothing to remove.`;
    case "refused":
      return `Refused to remove ${removal.storeRoot}; see the warning below.`;
    default:
      return `The global store at ${removal.storeRoot} was partially removed; retained entries: ${removal.retainedEntries.join(", ") || "(none)"}.`;
  }
}
