import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadMakeDocsConfig } from "../config";
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
import { resolvePlaybookRunIdSelector } from "../operations/playbook";
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
import { ensureParentDir, writeTextFile } from "../utils";
import { renderRunOperationText, resolveRunRenderMode } from "./render";

/**
 * The top-level `make-docs run` command (R-REG-2, R-TOP-3). The command tree
 * is DERIVED from the operation registry: an operation's CLI path is exactly
 * its identifier segments (`run playbook catalog` -> `playbook.catalog`,
 * `run work evidence record` -> `work.evidence.record`). No operation path
 * or help entry is hand-maintained here; only the per-identifier argv
 * adapters below are authored, and a conformance test pins the adapter map
 * to the registry identifier set in both directions.
 *
 * W18 R12 P3 additions:
 *
 * - Intent-named packaging grammar (PRD 41 R-GRAM-1..2): `run package
 *   preview` is a CLI SPELLING over the unchanged `package.write` operation
 *   with the dry-run context — declared once in {@link RUN_CLI_SPELLINGS},
 *   never a second registry identifier, so the operation, its dry-run input,
 *   and the MCP tools stay untouched (R-INV-1). `run package write` writes;
 *   the `--write` flag is retired with guidance naming the new grammar.
 * - A render layer at the old `printJson` seam (R-RENDER-1..3): TTY default
 *   is per-operation human text, `--json` and non-TTY stay byte-identical
 *   full JSON, MCP is untouched.
 * - Run-id ergonomics (R-RUNID-1): every `--run-id` acceptor resolves an
 *   unambiguous prefix, and `--last` selects the project's most recent run.
 * - Flag defaults (R-FLAG-1..2): `--repo-root` defaults to the nearest
 *   ancestor carrying `.make-docs/manifest.json`, and packaging precondition
 *   defaults are absorbed from the project config's `packaging.preconditions`
 *   block with explicit `--precondition` flags always overriding.
 */

interface RunCliInvocation {
  input: Record<string, unknown>;
  /** Dry-run and named approvals ride the execution context, not the input. */
  context?: { dryRun?: boolean; approvals?: string[] };
  /**
   * The `--output <path>` seam (R-GRAM-1, UAT X3): after a successful
   * invocation the dispatcher writes `select(value)` to `path` as JSON.
   * Stdout is unchanged — this only removes the jq surgery from the
   * plan-to-write handoff.
   */
  artifact?: { path: string; select: (value: JsonValue) => JsonValue };
}

type RunCliAdapter = (options: OperationOptions) => RunCliInvocation;

/**
 * Intent-named CLI spellings over existing registry operations (R-GRAM-1..2).
 * A spelling maps a derived-looking CLI path to a registry identifier plus a
 * fixed execution-context overlay; it is presentation-layer routing only —
 * the registry, the operation input, and the MCP surface are untouched.
 * Every spelling still dispatches through a registry identifier, honoring
 * the W18 R11 parity rule (composites like `package.ship` are real
 * registered operations, never spellings).
 */
const RUN_CLI_SPELLINGS: Record<
  string,
  { operation: string; dryRun: boolean; summary: string }
> = {
  "package.preview": {
    operation: "package.write",
    dryRun: true,
    summary:
      "Run the full package write pipeline with no writes: every diagnostic, stop, and generated-output record, nothing on disk (spelling of `package.write` with the dry-run context).",
  },
};

/** CLI display form of an identifier, from the registry's single derivation rule. */
const operationPath = operationCliPath;

/**
 * `--repo-root` default (R-FLAG-1): the nearest ancestor of the working
 * directory carrying `.make-docs/manifest.json`; the working directory
 * itself when no ancestor carries one. The flag remains as an override.
 */
function defaultRepoRoot(): string {
  const start = path.resolve(".");
  let current = start;
  while (true) {
    if (existsSync(path.join(current, ".make-docs", "manifest.json"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return start;
    }
    current = parent;
  }
}

function resolveRepoRoot(options: OperationOptions): string {
  const explicit = options.values["repo-root"];
  return explicit ? path.resolve(explicit) : defaultRepoRoot();
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

/**
 * The `--run-id`/`--last` selector for operations addressing an EXISTING run
 * (R-RUNID-1): unambiguous prefixes resolve, ambiguity fails listing the
 * candidates, and `--last` selects the project's most recent run. Operations
 * that MINT a run id (`playbook.start`, `playbook.invoke`) keep their plain
 * `--run-id` value and never resolve prefixes.
 */
function resolveRunIdOption(options: OperationOptions, operation: string): string {
  const last = options.booleans.has("last");
  const runId = options.values["run-id"];
  if (!last && !runId) {
    throw new OperationError(`\`${operation}\` requires --run-id (or --last).`);
  }
  return resolvePlaybookRunIdSelector({
    repoRoot: resolveRepoRoot(options),
    storeRoot: options.values["store-root"],
    runId,
    last,
  });
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
 * Packaging precondition absorption (R-FLAG-2): defaults come from the
 * project config's `packaging.preconditions` block; explicit `--precondition`
 * flags always override per key. Config is convenience, never authority — a
 * missing or invalid config contributes nothing, changing no behavior for
 * projects without the block.
 */
function resolvePreconditionStates(
  options: OperationOptions,
  repoRoot: string,
): Record<string, "satisfied" | "unknown" | "unsupported"> {
  const flagStates = parsePreconditionStates(options.arrays.precondition ?? []);
  const loaded = loadMakeDocsConfig(repoRoot);
  const configStates = loaded.valid ? loaded.config.packaging.preconditions : {};
  return { ...configStates, ...flagStates };
}

/**
 * The retired `--write` flag fails with guidance naming the new grammar
 * (R-GRAM-2). Never an alias: the old `write`-as-dry-run spelling is gone,
 * and `write` still fails closed before writing whenever any stop applies.
 */
function rejectRetiredWriteFlag(options: OperationOptions): void {
  if (options.booleans.has("write")) {
    throw new OperationError(
      "`--write` is retired. The packaging grammar is intent-named: " +
        "`make-docs run package preview` runs the full pipeline with no writes, " +
        "`make-docs run package write` writes (every precondition and fail-before-write stop unchanged), " +
        "`make-docs run package plan --output <path>` writes the reviewable plan artifact, and " +
        "`make-docs run package ship` runs plan -> preview -> write end-to-end.",
    );
  }
}

/** Shared argv adaptation for the plan-shaped inputs of plan and ship. */
function packagePlanShapedInput(
  options: OperationOptions,
  operation: string,
): Record<string, unknown> {
  return {
    repoRoot: resolveRepoRoot(options),
    refs: options.arrays.source ?? requiredPositionals(options, operation),
    requestedStack: parseOptionalStack(options.values.stack),
    target: {
      harness: requiredValue(options, "harness", operation),
      outputKind: requiredValue(options, "output-kind", operation) as Parameters<typeof createPlaybookPackagePlan>[0]["target"]["outputKind"],
      surface: requiredValue(options, "surface", operation) as Parameters<typeof createPlaybookPackagePlan>[0]["target"]["surface"],
      scope: requiredValue(options, "scope", operation) as Parameters<typeof createPlaybookPackagePlan>[0]["target"]["scope"],
    },
    packageId: options.values["package-id"],
    title: options.values.title,
    summary: options.values.summary,
    reviewStatus: options.values["review-status"] as Parameters<typeof createPlaybookPackagePlan>[0]["reviewStatus"],
    reviewedBy: options.values["reviewed-by"],
    supportEvidenceRefs: options.arrays["support-evidence-ref"] ?? [],
  };
}

/** The destructive-confirmation approvals shared by write, preview, and ship. */
function packageWriteApprovals(options: OperationOptions): string[] {
  return [
    ...(options.booleans.has("reviewed-overwrite") ? ["reviewed-overwrite"] : []),
    ...(options.booleans.has("backup-snapshot-reviewed") ? ["backup-snapshot-reviewed"] : []),
  ];
}

/**
 * Per-identifier argv adapters, keyed by registry identifier. Adapters do
 * argv-to-typed-input adaptation ONLY; validation, write gating, approvals,
 * and execution all happen in the registry dispatch.
 */
const RUN_CLI_ADAPTERS: Record<string, RunCliAdapter> = {
  "prd.authority.validate": (options) => ({
    input: {
      targetRoot: path.resolve(options.values["target-root"] ?? "."),
    },
  }),
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
      runId: resolveRunIdOption(options, operationPath("playbook.status")),
    },
  }),
  "playbook.next": (options) => ({
    input: {
      repoRoot: resolveRepoRoot(options),
      ...optionalPathValue(options, "store-root", "storeRoot"),
      runId: resolveRunIdOption(options, operationPath("playbook.next")),
    },
  }),
  "playbook.advance": (options) => ({
    input: {
      repoRoot: resolveRepoRoot(options),
      ...optionalPathValue(options, "store-root", "storeRoot"),
      runId: resolveRunIdOption(options, operationPath("playbook.advance")),
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
      runId: resolveRunIdOption(options, operationPath("playbook.gate")),
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
      runId: resolveRunIdOption(options, operationPath("playbook.resume")),
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
      runId: resolveRunIdOption(options, operationPath("playbook.close")),
      terminalStatus: requiredValue(options, "terminal-status", operationPath("playbook.close")),
      evidenceRefs: options.arrays["evidence-ref"] ?? [],
      note: options.values.note,
    },
  }),
  "playbook.run.export": (options) => ({
    input: {
      repoRoot: resolveRepoRoot(options),
      ...optionalPathValue(options, "store-root", "storeRoot"),
      runId: resolveRunIdOption(options, operationPath("playbook.run.export")),
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
      ...packagePlanShapedInput(options, operationPath("package.plan")),
      nonInteractive: options.booleans.has("non-interactive"),
    },
    // `--output <path>` writes the reviewable plan artifact — the exact
    // object `package.write --plan-json` consumes — directly to a
    // caller-named path, mirroring `run playbook run export --output`
    // (R-GRAM-1, UAT X3). Handled at the CLI surface because the operation
    // stays classified `read`; stdout is unchanged.
    ...(options.values.output
      ? {
          artifact: {
            path: path.resolve(options.values.output),
            select: (value: JsonValue) =>
              (value as { plan: JsonValue }).plan ?? value,
          },
        }
      : {}),
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
  "package.write": (options) => {
    // Serves two CLI spellings (R-GRAM-1): `run package write` (writes;
    // dispatched with the default context) and `run package preview` (the
    // dry-run context overlay from RUN_CLI_SPELLINGS). The operation, its
    // dry-run input, and the MCP tool are untouched (R-GRAM-2, R-INV-1).
    rejectRetiredWriteFlag(options);
    const repoRoot = resolveRepoRoot(options);
    return {
      input: {
        repoRoot,
        homeDir: options.values["home-dir"],
        plan: readJsonFile(requiredValue(options, "plan-json", operationPath("package.write"))),
        platform: options.values.platform as Parameters<typeof writePlaybookPackageOutputs>[0]["platform"],
        symlinkAvailable: booleanOption(options, "symlink-available"),
        preconditions: resolvePreconditionStates(options, repoRoot),
      },
      context: {
        approvals: packageWriteApprovals(options),
      },
    };
  },
  "package.ship": (options) => {
    rejectRetiredWriteFlag(options);
    const operation = operationPath("package.ship");
    const repoRoot = resolveRepoRoot(options);
    return {
      input: {
        ...packagePlanShapedInput(options, operation),
        homeDir: options.values["home-dir"],
        platform: options.values.platform as Parameters<typeof writePlaybookPackageOutputs>[0]["platform"],
        symlinkAvailable: booleanOption(options, "symlink-available"),
        preconditions: resolvePreconditionStates(options, repoRoot),
      },
      context: {
        approvals: packageWriteApprovals(options),
      },
    };
  },
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

/** Conformance seam for the spelling table: spelling path -> registry id. */
export function listRunCliSpellings(): { spelling: string; operation: string }[] {
  return Object.entries(RUN_CLI_SPELLINGS).map(([spelling, entry]) => ({
    spelling,
    operation: entry.operation,
  }));
}

const MAX_IDENTIFIER_SEGMENTS = 3;

function isDispatchablePath(id: string): boolean {
  return hasOperation(id) || id in RUN_CLI_SPELLINGS;
}

/**
 * Derives the operation identifier from leading non-flag argv tokens by
 * joining them with dots and taking the longest registry match. Never a
 * hand-maintained path list: `hasOperation` (plus the declared spelling
 * table) is the only source of truth. The returned id may be a spelling key;
 * the dispatcher maps it to its registry identifier and context overlay.
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
    if (isDispatchablePath(id)) {
      return { id, rest: argv.slice(length) };
    }
  }
  const attempted = leading.join(" ") || argv.join(" ");
  const known = [
    ...listOperations().map((operation) => operationPath(operation.id)),
    ...Object.keys(RUN_CLI_SPELLINGS).map((spelling) => operationPath(spelling)),
  ]
    .sort()
    .map((pathName) => `  ${pathName}`)
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
    // Declared spellings render inside their operation's domain group so the
    // intent-named grammar is discoverable from the derived help (R-GRAM-1).
    for (const [spelling, entry] of Object.entries(RUN_CLI_SPELLINGS)) {
      if (spelling.split(".", 1)[0] !== domain) {
        continue;
      }
      lines.push(`  ${operationPath(spelling)}`);
      lines.push(`      ${entry.summary}`);
    }
  }
  lines.push("");
  process.stdout.write(lines.join("\n"));
}

/**
 * The adapted form of one `make-docs run` argv: the spelled id, the registry
 * identifier it dispatches, the parsed options, and the adapter's invocation
 * (typed input plus context overlay). Exposed for the W18 R13 conformance kit
 * generator's executable-by-construction check (PRD 43 R-KIT-3): projecting a
 * scenario command through the REAL resolver and adapters — never a parallel
 * parser — proves the current CLI accepts it, without executing anything.
 */
export interface AdaptedRunCliInvocation {
  /** The resolved CLI path id; may be a declared spelling key. */
  id: string;
  /** The registry identifier the invocation dispatches. */
  operationId: string;
  options: OperationOptions;
  invocation: RunCliInvocation;
  /** The spelling's dry-run context overlay, when the id is a spelling. */
  spellingDryRun: boolean | undefined;
}

/**
 * Resolves and adapts one `make-docs run` argv through the registry-derived
 * path resolver and the per-identifier adapters, throwing exactly where the
 * real dispatch would (unknown operation, missing required flags, malformed
 * values) — without invoking the operation. {@link runRunCommand} routes
 * through this same seam so the validation surface can never drift from the
 * executing surface.
 */
export function adaptRunCliArgv(argv: string[]): AdaptedRunCliInvocation {
  const { id, rest } = resolveRunOperationPath(argv);
  const spelling = RUN_CLI_SPELLINGS[id];
  const operationId = spelling?.operation ?? id;
  const adapter = RUN_CLI_ADAPTERS[operationId];
  if (!adapter) {
    // Registry/adapter drift: the conformance test pins this, but fail loudly
    // rather than silently for an identifier added without a CLI adapter.
    throw new OperationError(
      `Operation \`${operationId}\` is registered but has no \`run\` CLI adapter; add one in src/run/cli.ts.`,
    );
  }
  const options = parseOperationOptions(rest);
  return {
    id,
    operationId,
    options,
    invocation: adapter(options),
    spellingDryRun: spelling?.dryRun,
  };
}

/**
 * Injectable seams for the render layer (R-TEST-4): tests simulate a TTY by
 * passing `isTty` since vitest's captured stdout is never one; production
 * reads `process.stdout.isTTY`.
 */
export interface RunCommandSeams {
  isTty?: boolean;
}

export async function runRunCommand(argv: string[], seams: RunCommandSeams = {}): Promise<void> {
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    printRunHelp();
    return;
  }
  const { id, operationId, options, invocation: adapted, spellingDryRun } = adaptRunCliArgv(argv);
  const { input, context, artifact } = adapted;
  const invocation = await invokeOperation(
    operationId,
    input,
    createExecutionContext({
      surface: "cli",
      writesAllowed: true,
      // The spelling's context overlay wins: `package.preview` is exactly
      // `package.write` under the dry-run context (R-GRAM-1..2).
      dryRun: spellingDryRun ?? context?.dryRun ?? false,
      approvals: context?.approvals ?? [],
    }),
  );
  if (artifact) {
    ensureParentDir(artifact.path);
    writeTextFile(artifact.path, `${JSON.stringify(artifact.select(invocation.value), null, 2)}\n`);
  }
  // The render seam (R-RENDER-1, R-INV-1): `--json` and non-TTY emit the full
  // operation result byte-identical to the pre-render-layer output; a TTY
  // defaults to the per-operation-family human text keyed by the SPELLED id.
  const mode = resolveRunRenderMode({
    jsonFlag: options.booleans.has("json"),
    isTty: seams.isTty ?? process.stdout.isTTY === true,
  });
  if (mode === "text") {
    const lines = renderRunOperationText(id, invocation.value);
    if (lines) {
      process.stdout.write(`${lines.join("\n")}\n`);
      setValidationExitCode(operationId, invocation.value);
      return;
    }
  }
  printJson(invocation.value);
  setValidationExitCode(operationId, invocation.value);
}

/** Explicit validators report their complete result and then fail the CLI. */
function setValidationExitCode(operationId: string, value: JsonValue): void {
  if (
    operationId === "prd.authority.validate" &&
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    value.status === "failed"
  ) {
    process.exitCode = 1;
  }
}
