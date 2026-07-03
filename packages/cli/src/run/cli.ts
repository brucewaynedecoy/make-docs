import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  booleanOption,
  parseOperationOptions,
  printJson,
  requiredPositionals,
  requiredValue,
  type OperationOptions,
} from "../operations/cli-options";
import { createExecutionContext } from "../operations/context";
import type { createPlaybookRunState } from "../operations/playbook";
import type {
  createPlaybookPackagePlan,
  resolvePackageSurface,
  writePlaybookPackageOutputs,
} from "../operations/playbook-packaging";
import {
  hasOperation,
  invokeOperation,
  listOperations,
  operationCliPath,
  type OperationDescriptor,
} from "../operations/registry";
import { OperationError, type JsonValue } from "../operations/types";

/**
 * The top-level `make-docs run` command (R-REG-2, R-TOP-3). The command tree
 * is DERIVED from the operation registry: an operation's CLI path is exactly
 * its identifier segments (`run playbook catalog` -> `playbook.catalog`,
 * `run work evidence record` -> `work.evidence.record`). No operation path
 * or help entry is hand-maintained here; only the per-identifier argv
 * adapters below are authored, and a conformance test pins the adapter map
 * to the registry identifier set in both directions.
 */

interface RunCliInvocation {
  input: Record<string, unknown>;
  /** Dry-run and named approvals ride the execution context, not the input. */
  context?: { dryRun?: boolean; approvals?: string[] };
}

type RunCliAdapter = (options: OperationOptions) => RunCliInvocation;

/** CLI display form of an identifier, from the registry's single derivation rule. */
const operationPath = operationCliPath;

function resolveRepoRoot(options: OperationOptions): string {
  return path.resolve(options.values["repo-root"] ?? ".");
}

/** Optional repo/store roots stay absent so handlers fall back to context. */
function optionalPathValue(
  options: OperationOptions,
  key: string,
  inputKey: string,
): Record<string, string> {
  const value = options.values[key];
  return value ? { [inputKey]: path.resolve(value) } : {};
}

function readJsonFile(filePath: string): unknown {
  return JSON.parse(readFileSync(path.resolve(filePath), "utf8")) as unknown;
}

/** Accepts a JSON file path or inline JSON for evidence payloads. */
function parseJsonPayload(raw: string, flag: string): JsonValue {
  const candidatePath = path.resolve(raw);
  const text = existsSync(candidatePath) ? readFileSync(candidatePath, "utf8") : raw;
  try {
    return JSON.parse(text) as JsonValue;
  } catch {
    throw new OperationError(`\`--${flag}\` must be a path to a JSON file or inline JSON.`);
  }
}

function parseExecutionMode(value: string | undefined): "serial" | "parallel" | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === "serial" || value === "parallel") {
    return value;
  }
  throw new OperationError("Playbook run execution mode must be serial or parallel.");
}

function parseOptionalStack(value: string | undefined): "build" | "run" | null {
  if (value === undefined || value === "") {
    return null;
  }
  if (value === "build" || value === "run") {
    return value;
  }
  throw new OperationError("Playbook package stack must be build or run.");
}

function parsePreconditionStates(
  values: string[],
): Record<string, "satisfied" | "unknown" | "unsupported"> {
  const states: Record<string, "satisfied" | "unknown" | "unsupported"> = {};
  for (const value of values) {
    const [id, state] = value.split("=");
    if (!id || (state !== "satisfied" && state !== "unknown" && state !== "unsupported")) {
      throw new OperationError(
        "Precondition states must use id=satisfied, id=unknown, or id=unsupported.",
      );
    }
    states[id] = state;
  }
  return states;
}

/**
 * Per-identifier argv adapters, keyed by registry identifier. Adapters do
 * argv-to-typed-input adaptation ONLY; validation, write gating, approvals,
 * and execution all happen in the registry dispatch.
 */
const RUN_CLI_ADAPTERS: Record<string, RunCliAdapter> = {
  "playbook.validate": (options) => ({
    input: {
      repoRoot: resolveRepoRoot(options),
      refs: options.positionals,
    },
  }),
  "playbook.catalog": (options) => ({
    input: {
      repoRoot: resolveRepoRoot(options),
    },
  }),
  "playbook.resolve": (options) => ({
    input: {
      repoRoot: resolveRepoRoot(options),
      ref: requiredPositionals(options, operationPath("playbook.resolve")).join(" "),
      requestedStack: options.values.stack,
    },
  }),
  "playbook.capabilities": (options) => ({
    input: {
      repoRoot: resolveRepoRoot(options),
      harness: requiredValue(options, "harness", operationPath("playbook.capabilities")),
      requiredCapabilities: options.arrays["requires-capability"] ?? [],
      preferredCapabilities: options.arrays["prefers-capability"] ?? [],
    },
  }),
  "playbook.start": (options) => ({
    input: {
      repoRoot: resolveRepoRoot(options),
      ...optionalPathValue(options, "store-root", "storeRoot"),
      ref: requiredPositionals(options, operationPath("playbook.start")).join(" "),
      requestedStack: options.values.stack,
      harness: requiredValue(options, "harness", operationPath("playbook.start")),
      runId: options.values["run-id"],
      parentRunId: options.values["parent-run-id"],
      executionMode: parseExecutionMode(options.values["execution-mode"]),
      // Explicit unattended opt-in; the Playbook must also permit it (R-GUARD-4).
      ...(options.booleans.has("unattended") ? { unattended: true } : {}),
      outputSurfaceClaims: options.arrays["output-surface"] ?? [],
      currentStep: options.values["current-step"],
      currentGate: options.values["current-gate"],
      status: options.values.status as Parameters<typeof createPlaybookRunState>[0]["status"],
      resumeHints: options.arrays["resume-hint"] ?? [],
      requiredCapabilities: options.arrays["requires-capability"] ?? [],
      preferredCapabilities: options.arrays["prefers-capability"] ?? [],
    },
    context: {
      // The R-GUARD-2 reviewed approval for parallel children rides the
      // execution context's named-approval seam, not the operation input.
      approvals: options.booleans.has("parallel-children-reviewed")
        ? ["parallel-children-reviewed"]
        : [],
    },
  }),
  "playbook.invoke": (options) => ({
    input: {
      repoRoot: resolveRepoRoot(options),
      ...optionalPathValue(options, "store-root", "storeRoot"),
      ref: requiredPositionals(options, operationPath("playbook.invoke")).join(" "),
      requestedStack: options.values.stack,
      harness: requiredValue(options, "harness", operationPath("playbook.invoke")),
      runId: options.values["run-id"],
      outputSurfaceClaims: options.arrays["output-surface"] ?? [],
      allowUnattended: options.booleans.has("allow-unattended"),
      requiredCapabilities: options.arrays["requires-capability"] ?? [],
      preferredCapabilities: options.arrays["prefers-capability"] ?? [],
    },
  }),
  "playbook.status": (options) => ({
    input: {
      repoRoot: resolveRepoRoot(options),
      ...optionalPathValue(options, "store-root", "storeRoot"),
      runId: requiredValue(options, "run-id", operationPath("playbook.status")),
    },
  }),
  "playbook.next": (options) => ({
    input: {
      repoRoot: resolveRepoRoot(options),
      ...optionalPathValue(options, "store-root", "storeRoot"),
      runId: requiredValue(options, "run-id", operationPath("playbook.next")),
    },
  }),
  "playbook.advance": (options) => ({
    input: {
      repoRoot: resolveRepoRoot(options),
      ...optionalPathValue(options, "store-root", "storeRoot"),
      runId: requiredValue(options, "run-id", operationPath("playbook.advance")),
      stepId: options.values.step,
      // Optional: absent, the step's execution mode decides what advance
      // does (R-MODE-1) — deterministic executes, delegated holds, manual
      // requires --acknowledge.
      outcome: options.values.outcome,
      ...(options.booleans.has("acknowledge") ? { acknowledge: true } : {}),
      ...(options.booleans.has("present") ? { present: true } : {}),
      evidenceRefs: options.arrays["evidence-ref"] ?? [],
      outputRefs: options.arrays["output-ref"] ?? [],
      note: options.values.note,
    },
  }),
  "playbook.gate": (options) => ({
    input: {
      repoRoot: resolveRepoRoot(options),
      ...optionalPathValue(options, "store-root", "storeRoot"),
      runId: requiredValue(options, "run-id", operationPath("playbook.gate")),
      gateId: options.values.gate,
      decision: requiredValue(options, "decision", operationPath("playbook.gate")),
      evidenceRefs: options.arrays["evidence-ref"] ?? [],
      note: options.values.note,
    },
  }),
  "playbook.resume": (options) => ({
    input: {
      repoRoot: resolveRepoRoot(options),
      ...optionalPathValue(options, "store-root", "storeRoot"),
      runId: requiredValue(options, "run-id", operationPath("playbook.resume")),
      resumeHints: options.arrays["resume-hint"] ?? [],
      evidenceRefs: options.arrays["evidence-ref"] ?? [],
      note: options.values.note,
      // Explicit opt-in step re-mapping after a digest mismatch (R-RESUME-2).
      ...(options.booleans.has("migrate") ? { migrate: true } : {}),
    },
  }),
  "playbook.close": (options) => ({
    input: {
      repoRoot: resolveRepoRoot(options),
      ...optionalPathValue(options, "store-root", "storeRoot"),
      runId: requiredValue(options, "run-id", operationPath("playbook.close")),
      terminalStatus: requiredValue(options, "terminal-status", operationPath("playbook.close")),
      evidenceRefs: options.arrays["evidence-ref"] ?? [],
      note: options.values.note,
    },
  }),
  "playbook.run.export": (options) => ({
    input: {
      repoRoot: resolveRepoRoot(options),
      ...optionalPathValue(options, "store-root", "storeRoot"),
      runId: requiredValue(options, "run-id", operationPath("playbook.run.export")),
      // Opt-in file output only (R-PORT-1): without --output the artifact is
      // printed to stdout and no file is written.
      ...optionalPathValue(options, "output", "outputPath"),
    },
  }),
  "playbook.run.import": (options) => ({
    input: {
      repoRoot: resolveRepoRoot(options),
      ...optionalPathValue(options, "store-root", "storeRoot"),
      artifact: parseJsonPayload(
        requiredValue(options, "artifact-json", operationPath("playbook.run.import")),
        "artifact-json",
      ),
      ...(options.booleans.has("overwrite") ? { overwrite: true } : {}),
      ...(options.booleans.has("adopt-project") ? { adoptProject: true } : {}),
    },
  }),
  "package.plan": (options) => ({
    input: {
      repoRoot: resolveRepoRoot(options),
      refs: options.arrays.source ?? requiredPositionals(options, operationPath("package.plan")),
      requestedStack: parseOptionalStack(options.values.stack),
      target: {
        harness: requiredValue(options, "harness", operationPath("package.plan")),
        outputKind: requiredValue(options, "output-kind", operationPath("package.plan")) as Parameters<typeof createPlaybookPackagePlan>[0]["target"]["outputKind"],
        surface: requiredValue(options, "surface", operationPath("package.plan")) as Parameters<typeof createPlaybookPackagePlan>[0]["target"]["surface"],
        scope: requiredValue(options, "scope", operationPath("package.plan")) as Parameters<typeof createPlaybookPackagePlan>[0]["target"]["scope"],
      },
      packageId: options.values["package-id"],
      title: options.values.title,
      summary: options.values.summary,
      reviewStatus: options.values["review-status"] as Parameters<typeof createPlaybookPackagePlan>[0]["reviewStatus"],
      reviewedBy: options.values["reviewed-by"],
      supportEvidenceRefs: options.arrays["support-evidence-ref"] ?? [],
      nonInteractive: options.booleans.has("non-interactive"),
    },
  }),
  "package.surface-resolve": (options) => ({
    input: {
      target: {
        harness: requiredValue(options, "harness", operationPath("package.surface-resolve")),
        outputKind: requiredValue(options, "output-kind", operationPath("package.surface-resolve")) as Parameters<typeof resolvePackageSurface>[0]["target"]["outputKind"],
        surface: requiredValue(options, "surface", operationPath("package.surface-resolve")) as Parameters<typeof resolvePackageSurface>[0]["target"]["surface"],
        scope: requiredValue(options, "scope", operationPath("package.surface-resolve")) as Parameters<typeof resolvePackageSurface>[0]["target"]["scope"],
      },
      packageId: requiredValue(options, "package-id", operationPath("package.surface-resolve")),
      platform: options.values.platform as Parameters<typeof resolvePackageSurface>[0]["platform"],
      symlinkAvailable: booleanOption(options, "symlink-available"),
      preconditions: parsePreconditionStates(options.arrays.precondition ?? []),
    },
  }),
  "package.write": (options) => ({
    input: {
      repoRoot: resolveRepoRoot(options),
      homeDir: options.values["home-dir"],
      plan: readJsonFile(requiredValue(options, "plan-json", operationPath("package.write"))),
      platform: options.values.platform as Parameters<typeof writePlaybookPackageOutputs>[0]["platform"],
      symlinkAvailable: booleanOption(options, "symlink-available"),
      preconditions: parsePreconditionStates(options.arrays.precondition ?? []),
    },
    context: {
      // The impl treats write=false as plan-only; the context expresses that
      // as dry-run rather than a per-surface write flag.
      dryRun: !options.booleans.has("write"),
      approvals: [
        ...(options.booleans.has("reviewed-overwrite") ? ["reviewed-overwrite"] : []),
        ...(options.booleans.has("backup-snapshot-reviewed") ? ["backup-snapshot-reviewed"] : []),
      ],
    },
  }),
  "work.item.resolve": (options) => ({
    input: {
      target: requiredPositionals(options, operationPath("work.item.resolve")).join(" "),
      ...optionalPathValue(options, "repo-root", "repoRoot"),
    },
  }),
  "work.evidence.record": (options) => ({
    input: {
      target: requiredPositionals(options, operationPath("work.evidence.record")).join(" "),
      evidenceKind: requiredValue(options, "kind", operationPath("work.evidence.record")),
      payload: parseJsonPayload(
        requiredValue(options, "payload-json", operationPath("work.evidence.record")),
        "payload-json",
      ),
      ...optionalPathValue(options, "repo-root", "repoRoot"),
      ...optionalPathValue(options, "store-root", "storeRoot"),
    },
  }),
  "work.evidence.read": (options) => ({
    input: {
      target: requiredPositionals(options, operationPath("work.evidence.read")).join(" "),
      ...optionalPathValue(options, "repo-root", "repoRoot"),
      ...optionalPathValue(options, "store-root", "storeRoot"),
    },
  }),
};

/**
 * Conformance seam (R-TEST-1, CLI side): tests pin the adapter-map keys to
 * the registry identifier set in both directions.
 */
export function listRunCliAdapters(): string[] {
  return Object.keys(RUN_CLI_ADAPTERS);
}

const MAX_IDENTIFIER_SEGMENTS = 3;

/**
 * Derives the operation identifier from leading non-flag argv tokens by
 * joining them with dots and taking the longest registry match. Never a
 * hand-maintained path list: `hasOperation` is the only source of truth.
 */
export function resolveRunOperationPath(argv: string[]): { id: string; rest: string[] } {
  const leading: string[] = [];
  for (const arg of argv) {
    if (arg.startsWith("--") || leading.length === MAX_IDENTIFIER_SEGMENTS) {
      break;
    }
    leading.push(arg);
  }
  for (let length = Math.min(MAX_IDENTIFIER_SEGMENTS, leading.length); length >= 2; length -= 1) {
    const id = leading.slice(0, length).join(".");
    if (hasOperation(id)) {
      return { id, rest: argv.slice(length) };
    }
  }
  const attempted = leading.join(" ") || argv.join(" ");
  const known = listOperations()
    .map((operation) => `  ${operationPath(operation.id)}`)
    .join("\n");
  throw new OperationError(
    `Unknown make-docs run operation: \`${attempted}\`. Valid operations:\n${known}`,
  );
}

function summaryTail(summary: string): string {
  // Registry summaries may lead with "Operation `id`:"; the path column
  // already identifies the operation, so print only the tail.
  return summary.replace(/^Operation `[^`]+`:\s*/, "");
}

function printRunHelp(): void {
  const byDomain = new Map<string, OperationDescriptor[]>();
  for (const operation of listOperations()) {
    const group = byDomain.get(operation.domain) ?? [];
    group.push(operation);
    byDomain.set(operation.domain, group);
  }
  const lines: string[] = [
    "Usage: make-docs run <operation...> [options]",
    "",
    "Operation paths are the registry identifier segments (e.g. `run playbook catalog`",
    "invokes `playbook.catalog`).",
  ];
  for (const [domain, operations] of byDomain) {
    lines.push("", `${domain}:`);
    for (const operation of operations) {
      const markers = [
        ...(operation.mutates === "write" ? ["[write]"] : []),
        ...(operation.status === "pending"
          ? [`[pending: lands with ${operation.pendingLineage}]`]
          : []),
      ];
      const marker = markers.length > 0 ? ` ${markers.join(" ")}` : "";
      lines.push(`  ${operationPath(operation.id)}${marker}`);
      lines.push(`      ${summaryTail(operation.summary)}`);
    }
  }
  lines.push("");
  process.stdout.write(lines.join("\n"));
}

export async function runRunCommand(argv: string[]): Promise<void> {
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    printRunHelp();
    return;
  }
  const { id, rest } = resolveRunOperationPath(argv);
  const adapter = RUN_CLI_ADAPTERS[id];
  if (!adapter) {
    // Registry/adapter drift: the conformance test pins this, but fail loudly
    // rather than silently for an identifier added without a CLI adapter.
    throw new OperationError(
      `Operation \`${id}\` is registered but has no \`run\` CLI adapter; add one in src/run/cli.ts.`,
    );
  }
  const { input, context } = adapter(parseOperationOptions(rest));
  const invocation = await invokeOperation(
    id,
    input,
    createExecutionContext({
      surface: "cli",
      writesAllowed: true,
      dryRun: context?.dryRun ?? false,
      approvals: context?.approvals ?? [],
    }),
  );
  printJson(invocation.value);
}
