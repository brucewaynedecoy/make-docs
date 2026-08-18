import { serializeOperationError } from "../operations/context";

export type CliRunner = (argv: string[]) => Promise<void>;

export interface CliEntryOptions {
  machineReadable?: boolean;
  writeError?: (value: string) => void;
}

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
    await runCli(argv);
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
