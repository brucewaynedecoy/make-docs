import path from "node:path";
import {
  buildCloseoutProbe,
  runCloseoutHistory,
  runCloseoutValidate,
} from "./closeout";
import {
  buildCheckpoint,
  buildPhaseGateReport,
  buildScopeReport,
} from "./lifecycle";
import {
  buildPlaybookCatalog,
  resolvePlaybook,
} from "./playbook";
import { OperationError } from "./types";
import {
  buildPhasePlan,
  buildWaveStatus,
  parseWorkPhase,
  renderPhasePlan,
  resolveWaveTarget,
} from "./work";

interface OperationOptions {
  positionals: string[];
  values: Record<string, string>;
  arrays: Record<string, string[]>;
  booleans: Set<string>;
}

export async function runOperationsCommand(argv: string[]): Promise<void> {
  const operation = argv[0];
  if (!operation || operation === "--help" || operation === "-h") {
    printOperationsHelp();
    return;
  }

  const options = parseOperationOptions(argv.slice(1));

  switch (operation) {
    case "closeout-probe":
      printJson(
        buildCloseoutProbe({
          repoRoot: path.resolve(options.values["repo-root"] ?? "."),
          scope: parseScope(options.values.scope ?? "auto"),
        }),
      );
      return;
    case "closeout-validate":
      printJson(
        runCloseoutValidate({
          repoRoot: path.resolve(options.values["repo-root"] ?? "."),
          probeJson: requiredValue(options, "probe-json", operation),
          run: options.booleans.has("run"),
        }),
      );
      return;
    case "closeout-history":
      printJson(
        runCloseoutHistory({
          repoRoot: path.resolve(options.values["repo-root"] ?? "."),
          mode: parseCloseoutMode(requiredValue(options, "mode", operation)),
          probeJson: options.values["probe-json"],
          phaseJson: options.values["phase-json"],
          title: options.values.title,
          date: options.values.date ?? new Date().toISOString().slice(0, 10),
          outputDir: options.values["output-dir"] ?? "docs/assets/archive/history",
          write: options.booleans.has("write"),
        }),
      );
      return;
    case "work-phase-state":
      printJson(parseWorkPhase(resolveCliPath(requiredPositionals(options, operation).join(" "))));
      return;
    case "wave-resolve":
      printJson(resolveWaveTarget(requiredPositionals(options, operation).join(" ")));
      return;
    case "wave-status":
      printJson(buildWaveStatus(requiredPositionals(options, operation).join(" ")));
      return;
    case "phase-plan": {
      const plan = buildPhasePlan(requiredPositionals(options, operation).join(" "));
      process.stdout.write(
        options.booleans.has("json") ? `${JSON.stringify(plan, null, 2)}\n` : renderPhasePlan(plan),
      );
      return;
    }
    case "checkpoint":
      printJson(
        buildCheckpoint({
          target: requiredPositionals(options, operation).join(" "),
          phase: options.values.phase,
          mode: parseOptionalMode(options.values.mode),
          commitPolicy: options.values["commit-policy"],
          status: options.values.status,
          validationStatus: options.values["validation-status"],
          validationCommands: options.arrays["validation-command"] ?? [],
          reviewStatus: options.values["review-status"],
          reviewRequired: booleanOption(options, "review-required"),
          closeoutStatus: options.values["closeout-status"],
          commitStatus: options.values["commit-status"],
          commitSha: options.values["commit-sha"],
          pushStatus: options.values["push-status"],
          note: options.values.note,
        }),
      );
      return;
    case "scope-guard":
      printJson(
        buildScopeReport(
          requiredPositionals(options, operation).join(" "),
          options.arrays.changed,
        ),
      );
      return;
    case "phase-gate":
      printJson(
        buildPhaseGateReport(
          requiredPositionals(options, operation).join(" "),
          options.values["commit-policy"],
        ),
      );
      return;
    case "playbook-catalog":
      printJson(
        buildPlaybookCatalog({
          repoRoot: path.resolve(options.values["repo-root"] ?? "."),
        }),
      );
      return;
    case "playbook-resolve":
      printJson(
        resolvePlaybook({
          repoRoot: path.resolve(options.values["repo-root"] ?? "."),
          ref: requiredPositionals(options, operation).join(" "),
          requestedStack: options.values.stack,
        }),
      );
      return;
    default:
      throw new OperationError(`Unknown make-docs operation: ${operation}`);
  }
}

function parseOperationOptions(argv: string[]): OperationOptions {
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
    if (
      [
        "json",
        "run",
        "print-only",
        "write",
        "review-required",
        "no-review-required",
      ].includes(key)
    ) {
      booleans.add(key);
      continue;
    }
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      throw new OperationError(`\`${arg}\` requires a value.`);
    }
    index += 1;
    if (["validation-command", "changed"].includes(key)) {
      arrays[key] = [...(arrays[key] ?? []), next];
    } else {
      values[key] = next;
    }
  }

  return { positionals, values, arrays, booleans };
}

function printOperationsHelp(): void {
  process.stdout.write(
    [
      "Usage: make-docs operations <operation> [options]",
      "",
      "Operations:",
      "  closeout-probe",
      "  closeout-validate",
      "  closeout-history",
      "  work-phase-state",
      "  wave-resolve",
      "  wave-status",
      "  phase-plan",
      "  checkpoint",
      "  scope-guard",
      "  phase-gate",
      "  playbook-catalog",
      "  playbook-resolve",
      "",
    ].join("\n"),
  );
}

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function requiredPositionals(options: OperationOptions, operation: string): string[] {
  if (options.positionals.length === 0) {
    throw new OperationError(`\`${operation}\` requires a target argument.`);
  }
  return options.positionals;
}

function requiredValue(options: OperationOptions, key: string, operation: string): string {
  const value = options.values[key];
  if (!value) {
    throw new OperationError(`\`${operation}\` requires --${key}.`);
  }
  return value;
}

function booleanOption(options: OperationOptions, key: string): boolean | undefined {
  if (options.booleans.has(key)) {
    return true;
  }
  if (options.booleans.has(`no-${key}`)) {
    return false;
  }
  return undefined;
}

function parseScope(value: string): "auto" | "staged" | "unstaged" | "full" {
  if (value === "auto" || value === "staged" || value === "unstaged" || value === "full") {
    return value;
  }
  throw new OperationError("`--scope` must be auto, staged, unstaged, or full.");
}

function parseCloseoutMode(value: string): "commit" | "phase" {
  if (value === "commit" || value === "phase") {
    return value;
  }
  throw new OperationError("`--mode` must be commit or phase.");
}

function parseOptionalMode(value?: string): "wave" | "phase" | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === "wave" || value === "phase") {
    return value;
  }
  throw new OperationError("`--mode` must be wave or phase.");
}

function resolveCliPath(value: string): string {
  return path.resolve(value);
}
