import path from "node:path";
import {
  buildCloseoutProbe,
  runCloseoutHistory,
  runCloseoutValidate,
} from "./closeout";
import {
  parseOperationOptions,
  printJson,
  requiredPositionals,
  requiredValue,
  booleanOption,
} from "./cli-options";
import {
  buildCheckpoint,
  buildPhaseGateReport,
  buildScopeReport,
} from "./lifecycle";
import { OperationError } from "./types";
import {
  buildPhasePlan,
  buildWaveStatus,
  parseWorkPhase,
  renderPhasePlan,
  resolveWaveTarget,
} from "./work";

/**
 * Legacy dispatcher for the pruned operation cluster only (R-RUN-2). The
 * registry-derived `make-docs run` command (src/run/cli.ts) owns every
 * retained operation; the root CLI no longer routes here. This module
 * survives solely for direct test use until the Phase 4 pruning deletes it.
 */
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
    default:
      throw new OperationError(`Unknown make-docs operation: ${operation}`);
  }
}

function printOperationsHelp(): void {
  process.stdout.write(
    [
      "Usage: make-docs operations <operation> [options]",
      "",
      "Operations (pruned legacy cluster; retained operations live under `make-docs run`):",
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
      "",
    ].join("\n"),
  );
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
