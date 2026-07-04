import { OperationError } from "./types";

/**
 * Shared argv-parsing helpers for the CLI operation surfaces: the registry
 * derived `make-docs run` tree (`src/run/cli.ts`) and the legacy pruned
 * cluster dispatcher (`src/operations/cli.ts`). Parsing only — no operation
 * logic lives here.
 */

export interface OperationOptions {
  positionals: string[];
  values: Record<string, string>;
  arrays: Record<string, string[]>;
  booleans: Set<string>;
}

const BOOLEAN_FLAGS = [
  "json",
  "run",
  "print-only",
  "write",
  "review-required",
  "no-review-required",
  "allow-unattended",
  "non-interactive",
  "symlink-available",
  "no-symlink-available",
  "reviewed-overwrite",
  "backup-snapshot-reviewed",
  "acknowledge",
  "present",
  "migrate",
  "unattended",
  "parallel-children-reviewed",
  "overwrite",
  "adopt-project",
  // `--last` selects the project's most recent run at every `--run-id`
  // acceptor (W18 R12 P3; PRD 41 R-RUNID-1).
  "last",
];

const ARRAY_FLAGS = [
  "validation-command",
  "changed",
  "requires-capability",
  "prefers-capability",
  "output-surface",
  "resume-hint",
  "evidence-ref",
  "output-ref",
  "source",
  "support-evidence-ref",
  "precondition",
];

export function parseOperationOptions(argv: string[]): OperationOptions {
  const positionals: string[] = [];
  const values: Record<string, string> = {};
  const arrays: Record<string, string[]> = {};
  const booleans = new Set<string>();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!;
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }
    const key = arg.slice(2);
    if (BOOLEAN_FLAGS.includes(key)) {
      booleans.add(key);
      continue;
    }
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      throw new OperationError(`\`${arg}\` requires a value.`);
    }
    index += 1;
    if (ARRAY_FLAGS.includes(key)) {
      arrays[key] = [...(arrays[key] ?? []), next];
    } else {
      values[key] = next;
    }
  }

  return { positionals, values, arrays, booleans };
}

export function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function requiredPositionals(options: OperationOptions, operation: string): string[] {
  if (options.positionals.length === 0) {
    throw new OperationError(`\`${operation}\` requires a target argument.`);
  }
  return options.positionals;
}

export function requiredValue(options: OperationOptions, key: string, operation: string): string {
  const value = options.values[key];
  if (!value) {
    throw new OperationError(`\`${operation}\` requires --${key}.`);
  }
  return value;
}

export function booleanOption(options: OperationOptions, key: string): boolean | undefined {
  if (options.booleans.has(key)) {
    return true;
  }
  if (options.booleans.has(`no-${key}`)) {
    return false;
  }
  return undefined;
}
