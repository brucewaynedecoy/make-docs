import { serializeOperationError } from "../operations/context";
import { takeCliReminder } from "../operations/work/work-queue/reminder";

export type CliRunner = (argv: string[]) => Promise<void>;

export interface CliEntryOptions {
  machineReadable?: boolean;
  writeError?: (value: string) => void;
}

/**
 * Commands that never show the reminder line (PRD 39 R-RENDER-4), also when
 * they run a registry operation of the reminder set inside.
 */
const NO_REMINDER_COMMANDS = new Set(["setup", "mcp", "update", "uninstall"]);

export function formatCliError(error: unknown, machineReadable: boolean): string {
  const serialized = serializeOperationError(error);
  if (!machineReadable) return `${serialized.message}\n`;
  return `${JSON.stringify({ ok: false, ...serialized })}\n`;
}

export async function runCliEntry(
  runCli: CliRunner,
  argv = process.argv.slice(2),
  options: CliEntryOptions = {},
): Promise<number> {
  try {
    // A line that an earlier run in this process left never shows on this run.
    takeCliReminder();
    await runCli(argv);
    // W35 R0 P2: the reminder goes to standard error after the normal output,
    // one time for each command run. Standard output does not change.
    // A command can return and still fail: its operation returns a refusal, and
    // the CLI then sets the exit code. So the line shows only for exit code 0.
    const reminder = takeCliReminder();
    const ended = process.exitCode === undefined || process.exitCode === null || Number(process.exitCode) === 0;
    if (reminder && ended && !NO_REMINDER_COMMANDS.has(argv[0] ?? "")) {
      (options.writeError ?? ((value) => process.stderr.write(value)))(`${reminder}\n`);
    }
    return 0;
  } catch (error) {
    const machineReadable = options.machineReadable ?? requestsMachineOutput(argv);
    (options.writeError ?? ((value) => process.stderr.write(value)))(
      formatCliError(error, machineReadable),
    );
    return 1;
  }
}

function requestsMachineOutput(argv: readonly string[]): boolean {
  if (process.stdout.isTTY !== true) return true;
  if (argv.includes("--json")) return true;
  return argv.some((value, index) =>
    value === "--format" ? argv[index + 1] === "json" : value === "--format=json",
  );
}
