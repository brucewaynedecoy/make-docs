import path from "node:path";
import { stdin, stdout } from "node:process";
import {
  classifyCompatibilityState,
  type CompatibilityClassification,
} from "../compatibility";
import {
  bootstrapGlobalStore,
  resolveStoreRoot,
  type StoreBootstrapReport,
} from "../store";
import { readPackageMeta } from "../utils";
import {
  defaultExecCommand,
  detectInstallSource,
  formatManagerCommand,
  INSTALL_MANAGER_MATRIX,
  type ExecCommand,
  type InstallDetection,
} from "./install-manager";
import {
  defaultSelfCommandOutput,
  detectPreV2Install,
  promptPreV2Choice,
  type PreV2Choice,
  type PreV2Detection,
  type SelfCommandOutput,
} from "./pre-v2";

/**
 * Top-level `make-docs update` — detect-and-delegate tool update (W18 R11
 * P3; PRD 39 R-SELF-2, R-SELF-3, R-MIG-2).
 *
 * When a persistent global install is unambiguously detected, the command
 * delegates to that manager's update command (for example
 * `npm install -g @brucewaynedecoy/make-docs@latest`). When detection is
 * ambiguous it prints the exact command(s) and the affected store path
 * instead of executing (R-SELF-3). For remote execution there is nothing
 * persistent to update, because the runner fetches the requested version.
 * In all of these cases the pending global-store schema migration is applied
 * via {@link bootstrapGlobalStore} (PRD 38 R-DB-2) and its status is
 * included in the report — the bootstrap is additive machine-level state and
 * never touches repository content, so it also runs when a pre-v2 install
 * causes the command to cancel.
 *
 * Before delegating, the command runs pre-v2 detection against `targetDir`
 * (default: the current working directory) and surfaces the R-MIG-2
 * warning-and-choice flow when a pre-v2 install is present; choosing
 * "backup-and-install" creates a project backup before delegation, and
 * cancelling leaves the project install untouched.
 */

export interface ToolUpdateOptions {
  /** Accepted for CLI parity; the pre-v2 choice always requires a TTY. */
  yes: boolean;
  targetDir?: string;
  storeRoot?: string;
  env?: NodeJS.ProcessEnv;
  execPath?: string;
  argv1?: string;
  homeDir?: string;
  /** Injectable seams (tests). */
  exec?: ExecCommand;
  realpath?: (candidate: string) => string;
  output?: SelfCommandOutput;
  classify?: (input: {
    targetDir: string;
    homeDir?: string;
  }) => Promise<CompatibilityClassification>;
  runBackup?: (targetDir: string) => Promise<void>;
}

export interface ToolUpdateResult {
  status:
    | "delegated"
    | "delegate-failed"
    | "manual-update-required"
    | "nothing-persistent"
    | "cancelled-pre-v2";
  storeRoot: string;
  /** Global-store bootstrap/migration report (PRD 38 R-DB-2). */
  bootstrap: StoreBootstrapReport;
  detection: InstallDetection;
  preV2: PreV2Detection;
  preV2Choice: PreV2Choice | null;
  executedCommand: string | null;
  printedCommands: string[];
  /** Human-readable report lines, also written to the output seam. */
  lines: string[];
}

export async function runToolUpdateCommand(
  options: ToolUpdateOptions,
): Promise<ToolUpdateResult> {
  const output = options.output ?? defaultSelfCommandOutput;
  const exec = options.exec ?? defaultExecCommand;
  const classify = options.classify ?? classifyCompatibilityState;
  const storeRoot = resolveStoreRoot({
    storeRoot: options.storeRoot,
    env: options.env,
    homeDir: options.homeDir,
  });
  const targetDir = path.resolve(options.targetDir ?? process.cwd());

  const lines: string[] = [];
  const emit = (line: string) => {
    lines.push(line);
    output.write(line);
  };

  // Global-store schema migration applies in all cases (PRD 38 R-DB-2).
  const bootstrap = bootstrapGlobalStore({
    storeRoot,
    env: options.env,
    homeDir: options.homeDir,
    packageMeta: safeReadPackageMeta(),
  });
  emit(
    `Global store at ${bootstrap.storeRoot}: database ${bootstrap.databaseStatus}` +
      (bootstrap.schemaVersion === null
        ? ""
        : ` (schema version ${bootstrap.schemaVersion})`),
  );
  for (const warning of bootstrap.warnings) {
    emit(`Warning: ${warning}`);
  }

  const detection = detectInstallSource({
    argv1: options.argv1,
    execPath: options.execPath,
    realpath: options.realpath,
  });

  const result: ToolUpdateResult = {
    status: "nothing-persistent",
    storeRoot,
    bootstrap,
    detection,
    preV2: { preV2: false, fingerprints: [] },
    preV2Choice: null,
    executedCommand: null,
    printedCommands: [],
    lines,
  };

  // Pre-v2 detection against the target directory (R-MIG-2), surfaced
  // before any delegation.
  const classification = await classify({ targetDir, homeDir: options.homeDir });
  result.preV2 = detectPreV2Install({ targetDir, classification });
  if (result.preV2.preV2) {
    result.preV2Choice = await promptPreV2Choice({
      detection: result.preV2,
      interactive: Boolean(stdin.isTTY && stdout.isTTY),
      command: "update",
      output,
    });
    if (result.preV2Choice === "cancel") {
      result.status = "cancelled-pre-v2";
      emit(
        `Update cancelled: the pre-v2 install at ${targetDir} was left untouched. The global-store migration above is additive and does not affect the project.`,
      );
      return result;
    }

    emit(`Backing up the pre-v2 install at ${targetDir} before updating.`);
    const runBackup = options.runBackup ?? defaultRunBackup;
    await runBackup(targetDir);
  }

  if (detection.kind === "persistent") {
    const command = formatManagerCommand(detection.manager.updateCommand);
    emit(`Delegating to ${detection.manager.id}: ${command}`);
    const { exitCode } = await exec(
      detection.manager.updateCommand.command,
      detection.manager.updateCommand.args,
    );
    result.executedCommand = command;
    if (exitCode === 0) {
      result.status = "delegated";
      emit(`Update delegated to ${detection.manager.id} completed.`);
    } else {
      result.status = "delegate-failed";
      emit(
        `The ${detection.manager.id} update command failed (exit code ${exitCode ?? "unknown"}). Run it manually: ${command}`,
      );
    }
    return result;
  }

  if (detection.kind === "remote") {
    result.status = "nothing-persistent";
    emit(
      "Nothing persistent to update: this invocation runs via a package runner (remote execution), and the runner fetches the requested version on each run.",
    );
    return result;
  }

  // Ambiguous ownership: print the exact command(s) and the affected store
  // path instead of executing (R-SELF-3).
  const candidates =
    detection.candidates.length > 0 ? detection.candidates : [...INSTALL_MANAGER_MATRIX];
  result.printedCommands = candidates.map((candidate) =>
    formatManagerCommand(candidate.updateCommand),
  );
  result.status = "manual-update-required";
  emit(
    `Could not determine which install manager owns the make-docs binary (${detection.reason})`,
  );
  emit(
    "make-docs will not guess and run a global change. If you installed the binary yourself, run the matching command:",
  );
  for (const command of result.printedCommands) {
    emit(`  ${command}`);
  }
  emit(`Affected store path: ${storeRoot}`);
  return result;
}

async function defaultRunBackup(targetDir: string): Promise<void> {
  const { runBackupCommand } = await import("../backup");
  await runBackupCommand({ targetDir, permissions: "allow-all" });
}

function safeReadPackageMeta(): { name: string; version: string } | undefined {
  try {
    return readPackageMeta();
  } catch {
    return undefined;
  }
}
