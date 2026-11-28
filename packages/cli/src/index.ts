import { beginGitHookRun } from "./store/git-hook-runs";

// W35 R0 P5: a git hook starts the checkpoint here, before the CLI loads the
// rest of its code. In the background mode this process starts the checkpoint
// as a process of its own and ends at once, so git does not wait.
const hook = beginGitHookRun(process.argv.slice(2));

if (hook.kind === "started" || (hook.kind === "background" && hook.skip)) {
  process.exitCode = 0;
} else {
  const [{ runCli }, { runCliEntry }, { installSqliteExperimentalWarningFilter }] = await Promise.all([
    import("./cli"),
    import("./run/entry"),
    import("./run/warnings"),
  ]);
  // R-NOISE-1 (W18 R12 P3): suppress ONLY the node:sqlite ExperimentalWarning
  // at CLI entry; every other process warning still surfaces.
  installSqliteExperimentalWarningFilter();
  const exitCode = await runCliEntry(runCli);
  process.exitCode = process.exitCode ?? exitCode;
  if (hook.kind === "foreground") hook.after();
}
