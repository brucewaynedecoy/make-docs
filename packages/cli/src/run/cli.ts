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
import {
  createExecutionContext,
  resolveCliOperationLaunch,
  type CliOperationLaunch,
} from "../operations/context";
import {
  invokeOperation,
  listOperations,
  operationFullCliPath,
  type OperationDescriptor,
} from "../operations/registry";
import { OperationError, type JsonValue } from "../operations/types";
import { ensureParentDir, writeTextFile } from "../utils";
import { renderRunOperationText, resolveRunRenderMode } from "./render";
import { leafHelpEntry } from "../operations/leaf-help-table";
import {
  listLifecycleRuns,
  resolveProjectIdentity,
  resolveStoreRoot,
  withStoreDatabase,
} from "../store";

/** CLI arguments map to typed operations in the canonical registry. */
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
 * The top-level groups (PRD 39 R-TOP-1) whose commands this dispatcher runs.
 * They held the old `make-docs run` tree. `project`, `resource`, and
 * `setup store` keep their own routers in `root-operations.ts` and
 * `setup-store.ts`. `factory` has no commands yet.
 */
export const OPERATION_GROUPS = ["work", "backlog", "lifecycle", "factory", "check"] as const;
export type OperationGroup = (typeof OPERATION_GROUPS)[number];

export function isOperationGroup(value: string | undefined): value is OperationGroup {
  return value !== undefined && (OPERATION_GROUPS as readonly string[]).includes(value);
}

/** Plain-words capability of each group, for help text. */
export const OPERATION_GROUP_SUMMARIES: Readonly<Record<OperationGroup, string>> = {
  work: "Find work items and record work evidence.",
  backlog: "Read the backlog, use its review cache, and open the review app.",
  lifecycle: "Start, track, and finish lifecycle runs.",
  factory: "Run approved backlog work through workers and review.",
  check: "Check PRDs, decomposition output, performance evidence, and user test records. Changes nothing.",
};

/**
 * Intent-named CLI spellings over existing registry operations (R-GRAM-1..2).
 * A spelling maps a full CLI path (after `make-docs`) to a registry
 * identifier plus a fixed execution-context overlay; it is
 * presentation-layer routing only — the registry, the operation input, and
 * the MCP surface are untouched. Every spelling still dispatches through a
 * registry identifier, honoring registry parity rule.
 */
const RUN_CLI_SPELLINGS: Record<
  string,
  { operation: string; dryRun: boolean; summary: string }
> = {
};

/** Full CLI path of an identifier after `make-docs`, from the registry projection. */
const operationPath = operationFullCliPath;

/**
 * `--repo-root` default (R-FLAG-1): the nearest ancestor of the working
 * directory carrying `.make-docs/config.yaml`; the working directory
 * itself when no ancestor carries one. The flag remains as an override.
 */
function defaultRepoRoot(): string {
  const start = path.resolve(".");
  let current = start;
  while (true) {
    if (existsSync(path.join(current, ".make-docs", "config.yaml"))) {
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

/** Lifecycle run selector with the unambiguous prefix and --last support. */
function resolveLifecycleRunIdOption(options: OperationOptions, operation: string): string {
  const last = options.booleans.has("last");
  const runId = options.values["run-id"];
  if (last && runId) {
    throw new OperationError("`--last` cannot be combined with `--run-id`; pass one selector.");
  }
  if (!last && !runId) {
    throw new OperationError(`\`${operation}\` requires --run-id (or --last).`);
  }
  const repoRoot = resolveRepoRoot(options);
  const identity = resolveProjectIdentity(repoRoot);
  if (identity.status !== "resolved") {
    if (last) {
      throw new OperationError("`--last` requires a repository with a configured project identifier.");
    }
    return runId!;
  }
  let runs: ReturnType<typeof listLifecycleRuns>;
  try {
    runs = withStoreDatabase(
      resolveStoreRoot(options.values["store-root"] ? { storeRoot: options.values["store-root"] } : {}),
      (db) => listLifecycleRuns(db, identity.projectId),
    );
  } catch (error) {
    if (!last) return runId!;
    throw error;
  }
  if (last) {
    const latest = [...runs].sort((left, right) =>
      left.startedAt === right.startedAt
        ? left.runId.localeCompare(right.runId)
        : left.startedAt.localeCompare(right.startedAt),
    ).pop();
    if (!latest) {
      throw new OperationError(
        "`--last` found no lifecycle runs for this project; start one with `make-docs lifecycle start`.",
      );
    }
    return latest.runId;
  }
  if (runs.some((run) => run.runId === runId)) return runId!;
  const candidates = runs
    .map((run) => run.runId)
    .filter((candidate) => candidate.startsWith(runId!))
    .sort();
  if (candidates.length === 1) return candidates[0]!;
  if (candidates.length > 1) {
    throw new OperationError(
      `Run id prefix \`${runId}\` is ambiguous; candidates:\n${candidates
        .map((candidate) => `  ${candidate}`)
        .join("\n")}`,
    );
  }
  return runId!;
}

function requiredPositiveInteger(
  options: OperationOptions,
  key: string,
  operation: string,
): number {
  const raw = requiredValue(options, key, operation);
  if (!/^[1-9][0-9]*$/.test(raw)) {
    throw new OperationError(`\`${operation}\` requires --${key} to be a positive integer.`);
  }
  return Number(raw);
}

function optionalMetadata(options: OperationOptions): JsonValue | undefined {
  const raw = options.values["metadata-json"];
  return raw === undefined ? undefined : parseJsonPayload(raw, "metadata-json");
}

function lifecycleVersionedInput(
  options: OperationOptions,
  operationId: string,
): RunCliInvocation {
  const operation = operationPath(operationId);
  return {
    input: {
      repoRoot: resolveRepoRoot(options),
      ...optionalPathValue(options, "store-root", "storeRoot"),
      runId: resolveLifecycleRunIdOption(options, operation),
      expectedVersion: requiredPositiveInteger(options, "expected-version", operation),
    },
  };
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
  "performance.evidence.validate": (options) => ({
    input: {
      targetRoot: path.resolve(options.values["target-root"] ?? "."),
    },
  }),
  "decomposition.output.validate": (options) => ({
    input: {
      targetRoot: path.resolve(options.values["target-root"] ?? "."),
    },
  }),
  "lifecycle.start": (options) => ({
    input: {
      repoRoot: resolveRepoRoot(options),
      ...optionalPathValue(options, "store-root", "storeRoot"),
      runId: options.values["run-id"],
      lifecycleStage: requiredValue(options, "stage", operationPath("lifecycle.start")),
      checkpoint: options.values.checkpoint,
      metadata: optionalMetadata(options),
    },
  }),
  "lifecycle.show": (options) => ({
    input: {
      repoRoot: resolveRepoRoot(options),
      ...optionalPathValue(options, "store-root", "storeRoot"),
      runId: resolveLifecycleRunIdOption(options, operationPath("lifecycle.show")),
    },
  }),
  "lifecycle.list": (options) => ({
    input: {
      repoRoot: resolveRepoRoot(options),
      ...optionalPathValue(options, "store-root", "storeRoot"),
    },
  }),
  "lifecycle.checkpoint": (options) => ({
    input: {
      repoRoot: resolveRepoRoot(options),
      ...optionalPathValue(options, "store-root", "storeRoot"),
      runId: resolveLifecycleRunIdOption(options, operationPath("lifecycle.checkpoint")),
      expectedVersion: requiredPositiveInteger(
        options,
        "expected-version",
        operationPath("lifecycle.checkpoint"),
      ),
      checkpoint: requiredValue(options, "checkpoint", operationPath("lifecycle.checkpoint")),
      lifecycleStage: options.values.stage,
      metadata: optionalMetadata(options),
    },
  }),
  "lifecycle.pause": (options) => lifecycleVersionedInput(options, "lifecycle.pause"),
  "lifecycle.resume": (options) => lifecycleVersionedInput(options, "lifecycle.resume"),
  "lifecycle.attach-evidence": (options) => ({
    input: {
      ...lifecycleVersionedInput(options, "lifecycle.attach-evidence").input,
      evidenceId: requiredValue(
        options,
        "evidence-id",
        operationPath("lifecycle.attach-evidence"),
      ),
      evidenceKind: requiredValue(options, "kind", operationPath("lifecycle.attach-evidence")),
      projectPath: options.values["project-path"],
      externalReference: options.values["external-reference"],
      digest: options.values.digest,
    },
  }),
  "lifecycle.complete": (options) => lifecycleVersionedInput(options, "lifecycle.complete"),
  "lifecycle.fail": (options) => lifecycleVersionedInput(options, "lifecycle.fail"),
  "lifecycle.abandon": (options) => lifecycleVersionedInput(options, "lifecycle.abandon"),
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
  "work.backlog.snapshot": (options) => ({
    input: {
      targetRoot: path.resolve(
        requiredValue(options, "target-root", operationPath("work.backlog.snapshot")),
      ),
    },
  }),
  "backlog.review.open": (options) => ({ input: { report: parseJsonPayload(
    requiredValue(options, "report-json", operationPath("backlog.review.open")), "report-json") } }),
  "backlog.review.refresh": (options) => ({ input: { envelope: parseJsonPayload(
    requiredValue(options, "envelope-json", operationPath("backlog.review.refresh")), "envelope-json") } }),
  "work.backlog-cache.lookup": (options) => ({
    input: {
      targetRoot: path.resolve(
        requiredValue(options, "target-root", operationPath("work.backlog-cache.lookup")),
      ),
      snapshot: parseJsonPayload(
        requiredValue(options, "snapshot-json", operationPath("work.backlog-cache.lookup")),
        "snapshot-json",
      ),
    },
  }),
  "work.backlog-cache.write": (options) => ({
    input: {
      targetRoot: path.resolve(
        requiredValue(options, "target-root", operationPath("work.backlog-cache.write")),
      ),
      snapshot: parseJsonPayload(
        requiredValue(options, "snapshot-json", operationPath("work.backlog-cache.write")),
        "snapshot-json",
      ),
      records: parseJsonPayload(
        requiredValue(options, "records-json", operationPath("work.backlog-cache.write")),
        "records-json",
      ),
    },
  }),
};

function parseUatPayload(raw: string): Record<string, unknown> {
  const value = parseJsonPayload(raw, "payload-json");
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new OperationError("UAT --payload-json must contain an object.");
  return value;
}

// UAT uses the shared typed payload; transports do not own validation policy.
for (const operation of listOperations().filter((entry) => entry.domain === "uat")) {
  RUN_CLI_ADAPTERS[operation.id] = (options) => ({
    input: options.values["payload-json"] === undefined
      ? { ...optionalPathValue(options, "target-root", "targetRoot"), ...(options.values.persona === undefined ? {} : { persona: options.values.persona }) }
      : parseUatPayload(options.values["payload-json"]),
  });
}

// Pending projections have no semantics to adapt. They still resolve to
// their reserved identifiers and the registry returns the typed lineage
// refusal before input validation. Active adapters remain explicit above.
for (const operation of listOperations()) {
  if (
    operation.status === "pending" &&
    isOperationGroup(operation.cli.root) &&
    RUN_CLI_ADAPTERS[operation.id] === undefined
  ) {
    RUN_CLI_ADAPTERS[operation.id] = () => ({ input: {} });
  }
}

/**
 * Conformance seam (R-TEST-1, CLI side): tests pin the adapter-map keys to
 * the registry identifier set in both directions.
 */
export function listRunCliAdapters(): string[] {
  return Object.keys(RUN_CLI_ADAPTERS);
}

/**
 * Test seam (W33 R0 P5): the argv adapter of one registry identifier, so a
 * test can record which options it reads and compare them with its help.
 */
export function runCliAdapterForTests(id: string): ((options: OperationOptions) => unknown) | undefined {
  return RUN_CLI_ADAPTERS[id];
}

/** Conformance seam for the spelling table: spelling path -> registry id. */
export function listRunCliSpellings(): { spelling: string; operation: string }[] {
  return Object.entries(RUN_CLI_SPELLINGS).map(([spelling, entry]) => ({
    spelling,
    operation: entry.operation,
  }));
}

/** Registry operations that the dispatcher runs, in registry order. */
function groupOperations(group?: OperationGroup): OperationDescriptor[] {
  return listOperations().filter((operation) =>
    group === undefined ? isOperationGroup(operation.cli.root) : operation.cli.root === group,
  );
}

/** Every dispatchable full CLI path, mapped to its operation ID or spelling key. */
function dispatchablePaths(group: OperationGroup): Map<string, string> {
  const paths = new Map<string, string>();
  for (const operation of groupOperations(group)) paths.set(operationPath(operation.id), operation.id);
  for (const spelling of Object.keys(RUN_CLI_SPELLINGS)) {
    if (spelling.split(" ", 1)[0] === group) paths.set(spelling, spelling);
  }
  return paths;
}

/**
 * Resolves the operation from leading non-flag argv tokens. `argv[0]` is the
 * group (PRD 39 R-TOP-1). The longest full CLI path in the registry
 * projection (or the declared spelling table) wins. Never a hand-maintained
 * path list. The returned id may be a spelling key; the dispatcher maps it
 * to its registry identifier and context overlay.
 */
export function resolveRunOperationPath(argv: string[]): { id: string; rest: string[] } {
  const group = argv[0];
  if (!isOperationGroup(group)) {
    throw new OperationError(
      `Unknown make-docs command group: \`${group ?? ""}\`. Groups with registry commands: ${OPERATION_GROUPS.join(", ")}.`,
    );
  }
  const paths = dispatchablePaths(group);
  const longest = Math.max(1, ...[...paths.keys()].map((cliPath) => cliPath.split(" ").length));
  const leading: string[] = [];
  for (const arg of argv) {
    if (arg.startsWith("--") || leading.length === longest) {
      break;
    }
    leading.push(arg);
  }
  for (let length = leading.length; length >= 2; length -= 1) {
    const id = paths.get(leading.slice(0, length).join(" "));
    if (id !== undefined) {
      return { id, rest: argv.slice(length) };
    }
  }
  const attempted = leading.join(" ") || argv.join(" ");
  const known = [...paths.keys()].sort().map((pathName) => `  make-docs ${pathName}`).join("\n");
  throw new OperationError(
    paths.size === 0
      ? `Unknown make-docs command: \`${attempted}\`. The ${group} group has no commands yet.`
      : `Unknown make-docs command: \`${attempted}\`. Valid ${group} commands:\n${known}`,
  );
}

/** Help for one group: its capability in plain words and each of its commands. */
export function renderOperationGroupHelp(group: OperationGroup): string {
  const operations = groupOperations(group);
  const lines: string[] = [
    `make-docs ${group}`,
    "",
    OPERATION_GROUP_SUMMARIES[group],
    "",
    `Usage: make-docs ${group} <command> [options]`,
    "",
  ];
  const spellings = Object.entries(RUN_CLI_SPELLINGS).filter(([spelling]) => spelling.split(" ", 1)[0] === group);
  if (operations.length === 0 && spellings.length === 0) {
    lines.push("This group has no commands yet.");
  } else {
    lines.push("Commands:", ...renderCommandLines(operations));
    // Declared spellings render inside their group so the intent-named
    // grammar is discoverable from the derived help (R-GRAM-1).
    for (const [spelling, entry] of spellings) {
      lines.push(`  make-docs ${spelling}`);
      lines.push(`      ${entry.summary}`);
    }
  }
  lines.push(...renderCommandListFooter(operations));
  return lines.join("\n");
}

/**
 * One command per entry: its path with markers, then its plain-words summary
 * from the leaf help table (W33 R0 P5). Every group's help uses this, so flags
 * appear only in each command's own `--help`.
 */
export function renderCommandLines(operations: readonly OperationDescriptor[]): string[] {
  return operations.flatMap((operation) => {
    const markers = [
      ...(operation.mutates === "write" ? ["[write]"] : []),
      ...(operation.status === "pending"
        ? [`[pending: lands with ${operation.pendingLineage}]`]
        : []),
    ];
    const marker = markers.length > 0 ? ` ${markers.join(" ")}` : "";
    return [`  make-docs ${operationPath(operation.id)}${marker}`, `      ${leafHelpEntry(operation.id).summary}`];
  });
}

/** The lines after a command list: the write marker note and the `--help` hint. */
export function renderCommandListFooter(operations: readonly OperationDescriptor[]): string[] {
  const lines: string[] = [];
  if (operations.some((operation) => operation.mutates === "write")) {
    lines.push("", "[write] commands change files or Store records.");
  }
  if (operations.length > 0) {
    lines.push("", "Use --help or -h with a command to see its options.");
  }
  lines.push("");
  return lines;
}

/**
 * The adapted form of one group command argv (`argv[0]` is the group).
 * Operation routing and safety tests use this value to check the real parser,
 * registry identifier, typed input, and context overlay without running the operation.
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
 * Resolves and adapts one group command argv through the registry-derived
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
      `Operation \`${operationId}\` is registered but has no CLI adapter; add one in src/run/cli.ts.`,
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

export async function runRunCommand(
  argv: string[],
  seams: RunCommandSeams = {},
  launch: CliOperationLaunch = resolveCliOperationLaunch(),
): Promise<void> {
  const group = argv[0];
  if (isOperationGroup(group) && (argv.length === 1 || argv[1] === "--help" || argv[1] === "-h")) {
    process.stdout.write(renderOperationGroupHelp(group));
    return;
  }
  const { id, operationId, options, invocation: adapted, spellingDryRun } = adaptRunCliArgv(argv);
  const { input, context, artifact } = adapted;
  const invocation = await invokeOperation(
    operationId,
    input,
    createExecutionContext({
      surface: "cli",
      route: launch.route,
      callerIdentityRaw: launch.callerIdentityRaw,
      callerReference: launch.callerReference,
      writesAllowed: true,
      // A declared spelling may supply the dry-run overlay.
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
    (operationId === "prd.authority.validate" ||
      operationId === "performance.evidence.validate" ||
      operationId === "decomposition.output.validate") &&
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    value.status !== "passed"
  ) {
    process.exitCode = 1;
  }
}
