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
import {
  hasOperation,
  getOperation,
  invokeOperation,
  listOperations,
  operationCliProjection,
  operationCliPath,
  type OperationDescriptor,
} from "../operations/registry";
import { OperationError, type JsonValue } from "../operations/types";
import { ensureParentDir, writeTextFile } from "../utils";
import { renderRunOperationText, resolveRunRenderMode } from "./render";
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
 * Intent-named CLI spellings over existing registry operations (R-GRAM-1..2).
 * A spelling maps a derived-looking CLI path to a registry identifier plus a
 * fixed execution-context overlay; it is presentation-layer routing only —
 * the registry, the operation input, and the MCP surface are untouched.
 * Every spelling still dispatches through a registry identifier, honoring
 * registry parity rule.
 */
const RUN_CLI_SPELLINGS: Record<
  string,
  { operation: string; dryRun: boolean; summary: string }
> = {
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
      throw new OperationError("`--last` requires a repository with a manifest-minted project identifier.");
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
        "`--last` found no lifecycle runs for this project; start one with `make-docs run lifecycle start`.",
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

// Pending run projections have no semantics to adapt. They still resolve to
// their reserved identifiers and the registry returns the typed lineage
// refusal before input validation. Active adapters remain explicit above.
for (const operation of listOperations()) {
  if (
    operation.status === "pending" &&
    operation.cli.root === "run" &&
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

/** Conformance seam for the spelling table: spelling path -> registry id. */
export function listRunCliSpellings(): { spelling: string; operation: string }[] {
  return Object.entries(RUN_CLI_SPELLINGS).map(([spelling, entry]) => ({
    spelling,
    operation: entry.operation,
  }));
}

const MAX_IDENTIFIER_SEGMENTS = 3;

function isDispatchablePath(id: string): boolean {
  return (
    (hasOperation(id) && operationCliProjection(getOperation(id).id).root === "run") ||
    id in RUN_CLI_SPELLINGS
  );
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
    ...listOperations()
      .filter((operation) => operation.cli.root === "run")
      .map((operation) => operationPath(operation.id)),
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
  for (const operation of listOperations().filter((entry) => entry.cli.root === "run")) {
    const group = byDomain.get(operation.domain) ?? [];
    group.push(operation);
    byDomain.set(operation.domain, group);
  }
  const lines: string[] = [
    "Usage: make-docs run <operation...> [options]",
    "",
    "Operation paths are the registry identifier segments (e.g. `run work item resolve`",
    "invokes `work.item.resolve`).",
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
    operationId === "prd.authority.validate" &&
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    value.status === "failed"
  ) {
    process.exitCode = 1;
  }
}
