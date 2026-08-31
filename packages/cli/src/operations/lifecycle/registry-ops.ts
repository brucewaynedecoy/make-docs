import path from "node:path";
import { z } from "zod";
import {
  LIFECYCLE_STAGES,
  LIFECYCLE_STATUSES,
  LifecycleRunExistsError,
  LifecycleRunNotFoundError,
  LifecycleVersionConflictError,
  StoreSchemaNewerError,
  StoreUnavailableError,
  attachLifecycleEvidence,
  createLifecycleRun,
  listLifecycleEvidence,
  listLifecycleRuns,
  readLifecycleRun,
  resolveProjectIdentity,
  resolveStoreRoot,
  transitionLifecycleRun,
  withStoreDatabase,
  type LifecycleMetadata,
  type LifecycleMutationOperation,
  type LifecycleRunRow,
  type LifecycleStage,
  type LifecycleStatus,
  type StoreDatabase,
} from "../../store";
import { assertManagedPathHasNoSymlinks, createRunId } from "../../utils";
import type { OperationExecutionContext } from "../context";
import type { OperationDefinition } from "../registry";
import { findRepoRoot } from "../shared";
import { OperationError, type JsonValue } from "../types";

const RUN_ID_MAX_LENGTH = 160;
const CHECKPOINT_MAX_LENGTH = 256;
const METADATA_MAX_BYTES = 4096;
const METADATA_MAX_KEYS = 32;

const rootFields = {
  repoRoot: z.string().min(1).optional(),
  storeRoot: z.string().min(1).optional(),
};

const runIdSchema = z
  .string()
  .min(1)
  .max(RUN_ID_MAX_LENGTH)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/, "must be a bounded opaque run identifier");
const expectedVersionSchema = z.number().int().positive();
const stageSchema = z.enum(LIFECYCLE_STAGES);
const checkpointSchema = z.string().trim().min(1).max(CHECKPOINT_MAX_LENGTH);
const metadataValueSchema = z.union([z.string().max(512), z.number().finite(), z.boolean(), z.null()]);
const metadataSchema = z
  .record(z.string().min(1).max(64), metadataValueSchema)
  .superRefine((value, context) => {
    if (Object.keys(value).length > METADATA_MAX_KEYS) {
      context.addIssue({
        code: "custom",
        message: `metadata can contain at most ${METADATA_MAX_KEYS} scalar fields`,
      });
    }
    if (Buffer.byteLength(JSON.stringify(value), "utf8") > METADATA_MAX_BYTES) {
      context.addIssue({
        code: "custom",
        message: `metadata must be at most ${METADATA_MAX_BYTES} UTF-8 bytes`,
      });
    }
  });

const startInput = z.object({
  ...rootFields,
  runId: runIdSchema.optional(),
  lifecycleStage: stageSchema,
  checkpoint: checkpointSchema.optional(),
  metadata: metadataSchema.optional(),
}).strict();

const runReadInput = z.object({
  ...rootFields,
  runId: runIdSchema,
}).strict();

const listInput = z.object(rootFields).strict();

const checkpointInput = z.object({
  ...rootFields,
  runId: runIdSchema,
  expectedVersion: expectedVersionSchema,
  checkpoint: checkpointSchema,
  lifecycleStage: stageSchema.optional(),
  metadata: metadataSchema.optional(),
}).strict();

const versionedInput = z.object({
  ...rootFields,
  runId: runIdSchema,
  expectedVersion: expectedVersionSchema,
}).strict();

const evidenceInput = z.object({
  ...rootFields,
  runId: runIdSchema,
  expectedVersion: expectedVersionSchema,
  evidenceId: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/, "must be a bounded opaque evidence identifier"),
  evidenceKind: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-z0-9-]*$/, "must be lowercase and hyphenated"),
  projectPath: z.string().min(1).max(2048).optional(),
  externalReference: z.string().min(1).max(2048).optional(),
  digest: z.string().regex(/^sha256:[a-f0-9]{64}$/).optional(),
}).strict().superRefine((value, context) => {
  if ((value.projectPath === undefined) === (value.externalReference === undefined)) {
    context.addIssue({
      code: "custom",
      message: "pass exactly one of projectPath or externalReference",
    });
  }
});

/**
 * The accepted transition choice is injected so this module cannot silently
 * invent paused-state behavior.
 */
export interface LifecyclePausedTransitionPolicy {
  checkpointStatuses: ReadonlySet<"active" | "paused">;
  evidenceStatuses: ReadonlySet<LifecycleStatus>;
  terminalOperationsWhilePaused: ReadonlySet<
    "lifecycle.complete" | "lifecycle.fail" | "lifecycle.abandon"
  >;
}

export interface RunCaptureUnavailableOutcome {
  status: "run-capture-unavailable";
  operation: LifecycleMutationOperation;
  projectId: string;
  runId: string;
  repositoryMutation: false;
  automaticRetry: false;
  blocking: false;
  message: string;
}

export class InvalidLifecycleTransitionError extends OperationError {
  readonly code = "invalid-lifecycle-transition";

  constructor(
    readonly operation: LifecycleMutationOperation,
    readonly runId: string,
    readonly currentStatus: LifecycleStatus,
    readonly allowedStatuses: readonly LifecycleStatus[],
    action: string,
  ) {
    super(
      `Lifecycle run \`${runId}\` cannot ${action} while its status is \`${currentStatus}\`. ` +
        `Allowed status${allowedStatuses.length === 1 ? " is" : "es are"}: ${allowedStatuses.join(", ")}.`,
    );
    this.name = "InvalidLifecycleTransitionError";
  }
}

/** The owner-approved W19 R1 P6 transition matrix. */
export const P6_LIFECYCLE_TRANSITION_POLICY: LifecyclePausedTransitionPolicy = {
  checkpointStatuses: new Set(["active", "paused"]),
  evidenceStatuses: new Set(LIFECYCLE_STATUSES),
  terminalOperationsWhilePaused: new Set(["lifecycle.fail", "lifecycle.abandon"]),
};

/** Builds the ten active P6 definitions after authority supplies the paused-state policy. */
export function buildLifecycleOperations(
  pausedPolicy: LifecyclePausedTransitionPolicy,
): OperationDefinition[] {
  return [
    {
      id: "lifecycle.start",
      summary: "Start a general lifecycle run in the global Store.",
      mutates: "write",
      status: "active",
      inputSchema: startInput,
      handler(input, context) {
        const resolved = startInput.parse(input);
        const identity = lifecycleIdentity(resolved.repoRoot);
        const runId = resolved.runId ?? createRunId(new Date(context.now()));
        if (context.dryRun) {
          return planned("lifecycle.start", identity.projectId, runId);
        }
        return captureMutation("lifecycle.start", identity.projectId, runId, () =>
          withStoreDatabase(lifecycleStoreRoot(resolved.storeRoot), (db) =>
            createLifecycleRun(db, {
              projectId: identity.projectId,
              runId,
              lifecycleStage: resolved.lifecycleStage,
              checkpoint: resolved.checkpoint,
              metadata: resolved.metadata,
              committedAt: context.now(),
            }),
          ),
        );
      },
    },
    {
      id: "lifecycle.show",
      summary: "Show one current general lifecycle run and its evidence references.",
      mutates: "read",
      status: "active",
      inputSchema: runReadInput,
      handler(input) {
        const resolved = runReadInput.parse(input);
        const identity = lifecycleIdentity(resolved.repoRoot);
        return withStoreDatabase(lifecycleStoreRoot(resolved.storeRoot), (db) => {
          const run = readLifecycleRun(db, identity.projectId, resolved.runId);
          if (!run) throw new LifecycleRunNotFoundError(identity.projectId, resolved.runId);
          return {
            status: "found",
            run,
            evidence: listLifecycleEvidence(db, identity.projectId, resolved.runId),
          };
        });
      },
    },
    {
      id: "lifecycle.list",
      summary: "List current general lifecycle runs for one manifest-minted project.",
      mutates: "read",
      status: "active",
      inputSchema: listInput,
      handler(input) {
        const resolved = listInput.parse(input);
        const identity = lifecycleIdentity(resolved.repoRoot);
        return withStoreDatabase(lifecycleStoreRoot(resolved.storeRoot), (db) => ({
          status: "listed",
          projectId: identity.projectId,
          runs: listLifecycleRuns(db, identity.projectId),
        }));
      },
    },
    {
      id: "lifecycle.checkpoint",
      summary: "Record a lifecycle checkpoint with explicit optimistic concurrency.",
      mutates: "write",
      status: "active",
      inputSchema: checkpointInput,
      handler(input, context) {
        const resolved = checkpointInput.parse(input);
        return transitionHandler(
          "lifecycle.checkpoint",
          resolved,
          context,
          (current) => {
            assertStatusAllowed(
              current,
              [...pausedPolicy.checkpointStatuses],
              "lifecycle.checkpoint",
              "record a checkpoint",
            );
            const nextStage = resolved.lifecycleStage ?? current.lifecycleStage;
            return {
              nextStatus: current.status,
              lifecycleStage: nextStage,
              checkpoint: resolved.checkpoint,
              metadata: { ...current.metadata, ...(resolved.metadata ?? {}) },
            };
          },
        );
      },
    },
    statusTransitionDefinition("lifecycle.pause", "Pause an active lifecycle run.", "paused", ["active"]),
    statusTransitionDefinition("lifecycle.resume", "Resume a paused lifecycle run.", "active", ["paused"]),
    {
      id: "lifecycle.attach-evidence",
      summary: "Attach one bounded evidence reference to a lifecycle run.",
      mutates: "write",
      status: "active",
      inputSchema: evidenceInput,
      handler(input, context) {
        const resolved = evidenceInput.parse(input);
        const identity = lifecycleIdentity(resolved.repoRoot);
        const storeRoot = lifecycleStoreRoot(resolved.storeRoot);
        const reference = sanitizeEvidenceReference(resolved, identity.repoRoot);
        if (context.dryRun) {
          return planned("lifecycle.attach-evidence", identity.projectId, resolved.runId);
        }
        return captureMutation(
          "lifecycle.attach-evidence",
          identity.projectId,
          resolved.runId,
          () => withStoreDatabase(storeRoot, (db) => {
            const current = readLifecycleRunOrThrow(db, identity.projectId, resolved.runId);
            assertStatusAllowed(
              current,
              [...pausedPolicy.evidenceStatuses],
              "lifecycle.attach-evidence",
              "attach evidence",
            );
            return attachLifecycleEvidence(db, {
              projectId: identity.projectId,
              runId: resolved.runId,
              expectedVersion: resolved.expectedVersion,
              evidenceId: resolved.evidenceId,
              evidenceKind: resolved.evidenceKind,
              referenceType: reference.type,
              reference: reference.value,
              digest: resolved.digest,
              committedAt: context.now(),
            });
          }),
        );
      },
    },
    terminalTransitionDefinition("lifecycle.complete", "Complete a lifecycle run.", "completed", pausedPolicy),
    terminalTransitionDefinition("lifecycle.fail", "Fail a lifecycle run.", "failed", pausedPolicy),
    terminalTransitionDefinition("lifecycle.abandon", "Abandon a lifecycle run.", "abandoned", pausedPolicy),
  ];
}

/** The ten active definitions used by the registry and every derived surface. */
export const lifecycleOperations = buildLifecycleOperations(
  P6_LIFECYCLE_TRANSITION_POLICY,
);

function statusTransitionDefinition(
  operation: "lifecycle.pause" | "lifecycle.resume",
  summary: string,
  nextStatus: LifecycleStatus,
  allowedStatuses: readonly LifecycleStatus[],
): OperationDefinition {
  return {
    id: operation,
    summary,
    mutates: "write",
    status: "active",
    inputSchema: versionedInput,
    handler(input, context) {
      const resolved = versionedInput.parse(input);
      return transitionHandler(operation, resolved, context, (current) => {
        assertStatusAllowed(
          current,
          allowedStatuses,
          operation,
          operation.split(".")[1]!,
        );
        return { nextStatus };
      });
    },
  };
}

function terminalTransitionDefinition(
  operation: "lifecycle.complete" | "lifecycle.fail" | "lifecycle.abandon",
  summary: string,
  nextStatus: LifecycleStatus,
  pausedPolicy: LifecyclePausedTransitionPolicy,
): OperationDefinition {
  const allowed: LifecycleStatus[] = ["active"];
  if (pausedPolicy.terminalOperationsWhilePaused.has(operation)) allowed.push("paused");
  return {
    id: operation,
    summary,
    mutates: "write",
    status: "active",
    inputSchema: versionedInput,
    handler(input, context) {
      const resolved = versionedInput.parse(input);
      return transitionHandler(operation, resolved, context, (current) => {
        assertStatusAllowed(current, allowed, operation, operation.split(".")[1]!);
        return { nextStatus };
      });
    },
  };
}

function transitionHandler(
  operation: Exclude<LifecycleMutationOperation, "lifecycle.start" | "lifecycle.attach-evidence">,
  input: {
    repoRoot?: string;
    storeRoot?: string;
    runId: string;
    expectedVersion: number;
  },
  context: OperationExecutionContext,
  build: (current: LifecycleRunRow) => {
    nextStatus: LifecycleStatus;
    lifecycleStage?: LifecycleStage;
    checkpoint?: string | null;
    metadata?: LifecycleMetadata;
  },
): unknown {
  const identity = lifecycleIdentity(input.repoRoot);
  const storeRoot = lifecycleStoreRoot(input.storeRoot);
  if (context.dryRun) return planned(operation, identity.projectId, input.runId);
  return captureMutation(operation, identity.projectId, input.runId, () =>
    withStoreDatabase(storeRoot, (db) => {
      const current = readLifecycleRunOrThrow(db, identity.projectId, input.runId);
      if (current.version !== input.expectedVersion) {
        throw new LifecycleVersionConflictError(input.runId, input.expectedVersion, current.version);
      }
      const change = build(current);
      return transitionLifecycleRun(db, {
        operation,
        projectId: identity.projectId,
        runId: input.runId,
        expectedVersion: input.expectedVersion,
        ...change,
        committedAt: context.now(),
      });
    }),
  );
}

function lifecycleIdentity(repoRoot: string | undefined): {
  projectId: string;
  repoRoot: string;
} {
  const root = findRepoRoot(repoRoot);
  const resolution = resolveProjectIdentity(root);
  if (resolution.status === "resolved") {
    return { projectId: resolution.projectId, repoRoot: resolution.rootPath };
  }
  const guidance =
    resolution.status === "unminted"
      ? "the manifest has no stable project identifier; run `make-docs` once to mint it"
      : resolution.status === "no-manifest"
        ? "the repository has no .make-docs/manifest.json; set up Make Docs first"
        : "the .make-docs/manifest.json file is unreadable; repair it first";
  throw new OperationError(
    `Cannot use lifecycle run capture because ${guidance}. ` +
      "Lifecycle rows are keyed by the manifest-minted project identifier, never by a path.",
  );
}

function lifecycleStoreRoot(storeRoot: string | undefined): string {
  return resolveStoreRoot(storeRoot ? { storeRoot } : {});
}

function readLifecycleRunOrThrow(
  db: StoreDatabase,
  projectId: string,
  runId: string,
): LifecycleRunRow {
  const run = readLifecycleRun(db, projectId, runId);
  if (!run) throw new LifecycleRunNotFoundError(projectId, runId);
  return run;
}

function assertStatusAllowed(
  run: LifecycleRunRow,
  allowedStatuses: readonly LifecycleStatus[],
  operation: LifecycleMutationOperation,
  action: string,
): void {
  if (!allowedStatuses.includes(run.status)) {
    throw new InvalidLifecycleTransitionError(
      operation,
      run.runId,
      run.status,
      allowedStatuses,
      action,
    );
  }
}

function sanitizeEvidenceReference(
  input: z.infer<typeof evidenceInput>,
  repoRoot: string,
): { type: "project-path" | "external"; value: string } {
  if (input.projectPath !== undefined) {
    const value = input.projectPath.trim();
    if (
      value.includes("\0") ||
      value.includes("\\") ||
      path.posix.isAbsolute(value) ||
      /^[A-Za-z]:/.test(value) ||
      /^\/{2}/.test(value)
    ) {
      throw new OperationError(
        "projectPath must be a forward-slash project-relative path, not an absolute, drive, UNC, or backslash path.",
      );
    }
    const normalized = path.posix.normalize(value);
    if (normalized === "." || normalized === ".." || normalized.startsWith("../")) {
      throw new OperationError("projectPath must stay inside the project root.");
    }
    const resolved = path.resolve(repoRoot, ...normalized.split("/"));
    const relative = path.relative(repoRoot, resolved);
    if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new OperationError("projectPath must stay inside the project root.");
    }
    try {
      assertManagedPathHasNoSymlinks(repoRoot, normalized);
    } catch (error) {
      throw new OperationError(
        `projectPath must not cross a symbolic link: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    return { type: "project-path", value: normalized };
  }

  const raw = input.externalReference!;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new OperationError("externalReference must be a valid HTTPS URL.");
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new OperationError(
      "externalReference must use HTTPS and must not contain credentials.",
    );
  }
  url.search = "";
  url.hash = "";
  const value = url.toString();
  if (value.length > 2048) {
    throw new OperationError("The sanitized externalReference exceeds 2048 characters.");
  }
  return { type: "external", value };
}

function captureMutation<T>(
  operation: LifecycleMutationOperation,
  projectId: string,
  runId: string,
  apply: () => T,
): T | RunCaptureUnavailableOutcome {
  try {
    return apply();
  } catch (error) {
    if (
      error instanceof OperationError ||
      error instanceof LifecycleRunExistsError ||
      error instanceof LifecycleRunNotFoundError ||
      error instanceof LifecycleVersionConflictError
    ) {
      throw error;
    }
    return {
      status: "run-capture-unavailable",
      operation,
      projectId,
      runId,
      repositoryMutation: false,
      automaticRetry: false,
      blocking: false,
      message: storeFailureMessage(error),
    };
  }
}

function storeFailureMessage(error: unknown): string {
  if (error instanceof StoreUnavailableError || error instanceof StoreSchemaNewerError) {
    return error.message;
  }
  return error instanceof Error
    ? `The lifecycle Store mutation did not commit: ${error.message}`
    : "The lifecycle Store mutation did not commit.";
}

function planned(
  operation: LifecycleMutationOperation,
  projectId: string,
  runId: string,
): JsonValue {
  return {
    status: "planned",
    operation,
    projectId,
    runId,
    storeMutation: false,
    repositoryMutation: false,
    receipt: null,
  };
}
