import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import type {
  LifecycleMutationReceipt,
  LifecyclePlanDisposition,
  LifecyclePlanSnapshot,
  LifecyclePlanSnapshotEntry,
  PlannedAction,
  ProjectResourceType,
} from "./types";
import { normalizeRelativePath, relativePathToTarget } from "./utils";

export function lifecycleDisposition(action: PlannedAction): LifecyclePlanDisposition {
  switch (action.type) {
    case "create":
    case "generate":
      return "create";
    case "update":
    case "strip-managed-block":
      return "update";
    case "noop":
      return "preserve";
    case "skip":
      return "skip";
    case "remove-managed":
      return "remove";
    case "update-conflict":
    case "skip-conflict":
      return "conflict";
  }
}

export function annotateLifecycleActions(actions: PlannedAction[]): PlannedAction[] {
  return actions.map((action) => ({
    ...action,
    disposition: lifecycleDisposition(action),
  }));
}

export function createLifecyclePlanSnapshot(
  targetDir: string,
  actions: readonly PlannedAction[],
  authorityPaths: readonly string[] = [],
): LifecyclePlanSnapshot {
  const entries = Array.from(
    new Set([
      ...actions.map((action) => normalizeRelativePath(action.relativePath)),
      ...authorityPaths.map(normalizeRelativePath),
    ]),
  )
    .sort(compareCodeUnits)
    .map((relativePath) => inspectSnapshotEntry(targetDir, relativePath));
  return {
    id: `sha256:${digestJson(entries)}`,
    entries,
  };
}

export function assertLifecyclePlanSnapshotCurrent(
  targetDir: string,
  snapshot: LifecyclePlanSnapshot,
): void {
  const currentEntries = snapshot.entries.map((entry) =>
    inspectSnapshotEntry(targetDir, entry.relativePath),
  );
  const currentId = `sha256:${digestJson(currentEntries)}`;
  if (currentId !== snapshot.id) {
    throw new Error(
      "The reviewed lifecycle plan is stale because a planned path changed. Create and review a new plan before applying it.",
    );
  }
}

export function createLifecycleMutationReceipt(options: {
  operation: string;
  projectId: string;
  manifestSchemaVersion: number;
  profileId: string;
  selectedResourceTypes: readonly ProjectResourceType[];
  actions: readonly PlannedAction[];
  backupReferences?: readonly string[];
  committedAt?: string;
}): LifecycleMutationReceipt {
  const committedAt = options.committedAt ?? new Date().toISOString();
  const outcomes = emptyOutcomeCounts();
  const conflicts: string[] = [];
  for (const action of options.actions) {
    const disposition = action.disposition ?? lifecycleDisposition(action);
    outcomes[disposition] += 1;
    if (disposition === "conflict") {
      conflicts.push(action.relativePath);
    }
  }
  const receiptSubject = {
    operation: options.operation,
    projectId: options.projectId,
    manifestSchemaVersion: options.manifestSchemaVersion,
    profileId: options.profileId,
    selectedResourceTypes: [...options.selectedResourceTypes].sort(compareCodeUnits),
    outcomes,
    conflicts: conflicts.sort(compareCodeUnits),
    backupReferences: [...(options.backupReferences ?? [])].sort(compareCodeUnits),
    committedAt,
  };
  return {
    schemaVersion: 1,
    receiptId: `sha256:${digestJson(receiptSubject)}`,
    ...receiptSubject,
    claims: {
      validated: false,
      accepted: false,
      published: false,
      released: false,
    },
  };
}

function inspectSnapshotEntry(
  targetDir: string,
  relativePath: string,
): LifecyclePlanSnapshotEntry {
  const absolutePath = relativePathToTarget(targetDir, relativePath);
  let stats;
  try {
    stats = lstatSync(absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { relativePath, state: "missing" };
    }
    throw error;
  }
  if (stats.isSymbolicLink()) {
    return { relativePath, state: "symlink" };
  }
  if (stats.isDirectory()) {
    return { relativePath, state: "directory" };
  }
  if (stats.isFile()) {
    return {
      relativePath,
      state: "file",
      digest: createHash("sha256").update(readFileSync(absolutePath)).digest("hex"),
    };
  }
  return { relativePath, state: "other" };
}

function emptyOutcomeCounts(): Record<LifecyclePlanDisposition, number> {
  return {
    create: 0,
    update: 0,
    preserve: 0,
    conflict: 0,
    skip: 0,
    remove: 0,
    stop: 0,
  };
}

function digestJson(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
