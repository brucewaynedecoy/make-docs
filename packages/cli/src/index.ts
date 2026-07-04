import { runCli } from "./cli";
import { installSqliteExperimentalWarningFilter } from "./run/warnings";

// R-NOISE-1 (W18 R12 P3): suppress ONLY the node:sqlite ExperimentalWarning
// at CLI entry; every other process warning still surfaces.
installSqliteExperimentalWarningFilter();

runCli().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
