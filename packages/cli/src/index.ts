import { runCli } from "./cli";
import { runCliEntry } from "./run/entry";
import { installSqliteExperimentalWarningFilter } from "./run/warnings";

// R-NOISE-1 (W18 R12 P3): suppress ONLY the node:sqlite ExperimentalWarning
// at CLI entry; every other process warning still surfaces.
installSqliteExperimentalWarningFilter();

runCliEntry(runCli).then((exitCode) => {
  process.exitCode = exitCode;
});
