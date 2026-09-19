/**
 * Targeted process-warning filter for the Node SQLite ExperimentalWarning
 * (W18 R12 P3; PRD 39 R-NOISE-1).
 *
 * `node:sqlite` emits `SQLite is an experimental feature and might change at
 * any time (ExperimentalWarning)` on first use, which printed on every CLI
 * invocation (UAT X6). The filter is installed once at CLI entry and swallows
 * ONLY that warning: the match requires both the `ExperimentalWarning` type
 * and the SQLite message text, so every other process warning — including
 * other experimental warnings — still surfaces. Never a blanket suppression
 * (`--no-warnings` or removing the `warning` listener would hide unrelated
 * warnings and is explicitly out of contract).
 */

const SUPPRESSED_WARNING_TYPE = "ExperimentalWarning";
const SUPPRESSED_MESSAGE_PATTERN = /\bSQLite\b/;

type EmitWarning = typeof process.emitWarning;

let installed = false;

function warningType(warning: string | Error, args: unknown[]): string | null {
  if (warning instanceof Error) {
    return warning.name || null;
  }
  const [first] = args;
  if (typeof first === "string") {
    return first;
  }
  if (first && typeof first === "object" && "type" in first) {
    const type = (first as { type?: unknown }).type;
    return typeof type === "string" ? type : null;
  }
  return null;
}

function warningMessage(warning: string | Error): string {
  return warning instanceof Error ? warning.message : warning;
}

export function isSqliteExperimentalWarning(
  warning: string | Error,
  args: unknown[] = [],
): boolean {
  return (
    warningType(warning, args) === SUPPRESSED_WARNING_TYPE &&
    SUPPRESSED_MESSAGE_PATTERN.test(warningMessage(warning))
  );
}

/**
 * Wraps `process.emitWarning` so the SQLite ExperimentalWarning never reaches
 * the `warning` event (and therefore never prints), while every other warning
 * passes through unchanged. Idempotent; returns an uninstaller for tests.
 */
export function installSqliteExperimentalWarningFilter(): () => void {
  if (installed) {
    return () => {};
  }
  installed = true;
  const original: EmitWarning = process.emitWarning.bind(process);
  const filtered = ((warning: string | Error, ...args: unknown[]) => {
    if (isSqliteExperimentalWarning(warning, args)) {
      return;
    }
    (original as (warning: string | Error, ...rest: unknown[]) => void)(warning, ...args);
  }) as EmitWarning;
  process.emitWarning = filtered;
  return () => {
    if (process.emitWarning === filtered) {
      process.emitWarning = original;
    }
    installed = false;
  };
}
