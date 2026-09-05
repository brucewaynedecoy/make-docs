import { validateUatCheckpoint10 } from "./operations/uat/ops";
import { createHash, randomUUID } from "node:crypto";
import {
  chmodSync,
  closeSync,
  copyFileSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  readdirSync,
  renameSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import type {
  ApplyResult,
  CompatibilityDisposition,
  CompatibilitySourceState,
  InstallManifest,
  InstallPlan,
  ManifestProvenanceState,
  PlannedAction,
  ResourceProjectionManifestState,
  SystemAssetManifestState,
} from "./types";
import { MANIFEST_RELATIVE_PATH } from "./manifest";
import {
  applyInstallPlan,
  findReviewableManagedFileConflicts,
} from "./install";
import type { CompatibilityClassification } from "./compatibility";
import {
  CURRENT_STORE_SCHEMA_VERSION,
  classifyStoreCheckpoint9State,
  getStoreDatabasePath,
  loadGlobalManifest,
  migrateStoreDatabaseAtCheckpoint9,
  readStoreCheckpoint9JournalEntry,
  resolveStoreRoot,
  StoreCheckpoint9StateError,
  type StoreCheckpoint9Classification,
  type StoreCheckpoint9JournalEntry,
} from "./store";
import {
  resourceListOperation,
  resourceReadOperation,
} from "./operations/resource/ops";
import {
  validateProjectPathHygiene,
} from "./path-hygiene";
import {
  assertManagedPathHasNoSymlinks,
  relativePathToTarget,
} from "./utils";
import { isRetiredTemplateOwnedChildRouterPath } from "./router-paths";

export const LEGACY_COMPATIBILITY_OPERATION_IDS = [
  "playbook.validate",
  "playbook.catalog",
  "playbook.resolve",
  "playbook.capabilities",
  "playbook.start",
  "playbook.invoke",
  "playbook.status",
  "playbook.next",
  "playbook.advance",
  "playbook.gate",
  "playbook.resume",
  "playbook.close",
  "playbook.run.export",
  "playbook.run.import",
  "package.plan",
  "package.surface-resolve",
  "package.write",
  "package.ship",
] as const;

export type LegacyCompatibilityOperationId =
  (typeof LEGACY_COMPATIBILITY_OPERATION_IDS)[number];

const LEGACY_COMPATIBILITY_OPERATION_SET = new Set<string>(
  LEGACY_COMPATIBILITY_OPERATION_IDS,
);

export const MIGRATION_CHECKPOINTS = [
  { checkpoint: 1, owner: "P5", state: "implemented", purpose: "freeze-reviewed-snapshot" },
  { checkpoint: 2, owner: "P5", state: "implemented", purpose: "verify-backup" },
  { checkpoint: 3, owner: "P5", state: "implemented", purpose: "manifest-identity" },
  { checkpoint: 4, owner: "P5", state: "implemented", purpose: "minimal-manifest-and-routers" },
  { checkpoint: 5, owner: "P5", state: "implemented", purpose: "prompt-and-resource-operations" },
  { checkpoint: 6, owner: "P5", state: "implemented", purpose: "selected-system-resources" },
  { checkpoint: 7, owner: "P5", state: "implemented", purpose: "on-demand-routing-and-clean-legacy-paths" },
  { checkpoint: 8, owner: "P5", state: "implemented", purpose: "typescript-path-hygiene" },
  { checkpoint: 9, owner: "P6", state: "implemented", purpose: "general-store-tables" },
  { checkpoint: 10, owner: "P7", state: "implemented", purpose: "naive-uat-persona-skill-evidence" },
  { checkpoint: 11, owner: "P8", state: "locked", purpose: "traced-legacy-retirement" },
  { checkpoint: 12, owner: "P9", state: "locked", purpose: "selected-agentics" },
  { checkpoint: 13, owner: "P10", state: "locked", purpose: "package-dogfood-legacy-validation" },
] as const;

export type MigrationCheckpoint = (typeof MIGRATION_CHECKPOINTS)[number]["checkpoint"];
export type ImplementedMigrationCheckpoint = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type LockedMigrationCheckpoint = 11 | 12 | 13;

export type MigrationFilesystemState =
  | "absent"
  | "managed-clean"
  | "managed-modified"
  | "project-owned"
  | "mixed"
  | "unknown";

export type MigrationStoreState =
  | "absent"
  | "supported-current"
  | "supported-legacy"
  | "newer-unknown"
  | "corrupt"
  | "unknown"
  | "indeterminate";

export type MigrationPathSafetyState =
  | "safe"
  | "path-escape"
  | "ambiguous"
  | "permission-denied"
  | "cross-platform-mismatch";

export interface MigrationCompatibilityFacets {
  resource: MigrationFilesystemState;
  filesystem: MigrationFilesystemState;
  manifestProvenance: "absent" | ManifestProvenanceState;
  store: MigrationStoreState;
  legacyAssets: MigrationFilesystemState;
  pathSafety: MigrationPathSafetyState;
  optionalAgentics: MigrationFilesystemState;
}

export interface MigrationCompatibilityClassification {
  state: CompatibilitySourceState;
  disposition: CompatibilityDisposition;
  facets: MigrationCompatibilityFacets;
  blockers: MigrationSafetyCode[];
  unattendedSafe: boolean;
  reviewedMigrationAllowed: boolean;
}

export type MigrationPathDisposition =
  | "preserve-project-owned"
  | "export-then-replace"
  | "overwrite-managed-clean"
  | "skip"
  | "stop";

export interface MigrationAffectedPath {
  relativePath: string;
  ownership: MigrationFilesystemState;
  disposition: MigrationPathDisposition;
  reason: string;
}

export interface MigrationPathSnapshot extends MigrationAffectedPath {
  entryType: "missing" | "file" | "directory" | "symlink" | "other";
  digest?: string;
  mode?: number;
  size?: number;
  linkTarget?: "relative" | "external";
}

export interface MigrationRepositoryIdentity {
  projectRootDigest: string;
  projectId: string | null;
  manifestSchemaVersion: number | null;
  manifestDigest: string | null;
}

export interface ReviewedMigrationSnapshot {
  schemaVersion: 1;
  snapshotId: string;
  createdAt: string;
  repository: MigrationRepositoryIdentity;
  classification: MigrationCompatibilityClassification;
  paths: MigrationPathSnapshot[];
  legacyOperations: LegacyCompatibilityOperationId[];
}

export interface ProjectMigrationLock {
  projectRoot: string;
  lockPath: string;
  token: string;
  acquiredAt: string;
  repository: MigrationRepositoryIdentity;
}

export type MigrationSafetyCode =
  | "active-writer"
  | "ambiguous-ownership"
  | "backup-incomplete"
  | "barrier-bypass"
  | "classification-blocked"
  | "checkpoint-receipt-projection-failed"
  | "cross-platform-mismatch"
  | "helper-consumer-active"
  | "helper-hash-mismatch"
  | "helper-replacement-unproved"
  | "legacy-quiesced"
  | "lock-active"
  | "lock-lost"
  | "out-of-order-checkpoint"
  | "path-hygiene-failed"
  | "path-escape"
  | "permission-denied"
  | "product-operation-unavailable"
  | "snapshot-drift"
  | "unsupported-product-action"
  | "downstream-checkpoint-locked";

export class MigrationSafetyError extends Error {
  constructor(
    readonly code: MigrationSafetyCode,
    message: string,
  ) {
    super(message);
    this.name = "MigrationSafetyError";
  }
}

export type MigrationReceiptStatus =
  | "paused"
  | "blocked"
  | "failed"
  | "rollback-required"
  | "completed";

export interface MigrationCheckpointReceipt {
  schemaVersion: 1;
  receiptId: string;
  status: MigrationReceiptStatus;
  checkpoint: number;
  snapshotId: string;
  lockTokenDigest: string;
  createdAt: string;
  code: MigrationSafetyCode | null;
  message: string;
  rollback: {
    attempted: boolean;
    completed: boolean;
    restoredPaths: string[];
    unrestoredPaths: string[];
  };
  claims: {
    validated: false;
    accepted: false;
    downstreamAuthorized: false;
    released: false;
  };
}

export interface Checkpoint9ReceiptProjectionFailure {
  schemaVersion: 1;
  status: "receipt-projection-failed";
  checkpoint: 9;
  code: "checkpoint-receipt-projection-failed";
  receiptId: string;
  projectionAttempts: 2;
  storeCommitted: true;
  setupMayContinue: false;
  message: string;
}

export class Checkpoint9ReceiptProjectionError extends MigrationSafetyError {
  constructor(readonly checkpointResult: Checkpoint9ReceiptProjectionFailure) {
    super(checkpointResult.code, checkpointResult.message);
    this.name = "Checkpoint9ReceiptProjectionError";
  }
}

export type MigrationCheckpointResult =
  | MigrationCheckpointReceipt
  | Checkpoint9ReceiptProjectionFailure;

export type StoreCheckpoint9ExecutionResult =
  | {
      status: "not-required";
      checkpoint: 9;
      storeCommitted: boolean;
      setupMayContinue: true;
    }
  | {
      status: "completed";
      checkpoint: 9;
      storeCommitted: true;
      setupMayContinue: true;
      recoveredProjection: boolean;
      projectionAttempts: 1 | 2;
      receipt: MigrationCheckpointReceipt;
    }
  | Checkpoint9ReceiptProjectionFailure;

interface BackupEntry {
  relativePath: string;
  backupPath: string | null;
  original: MigrationPathSnapshot;
  copied: boolean;
  verified: boolean;
  restoreOrder: number;
}

export interface VerifiedMigrationBackup {
  schemaVersion: 1;
  backupId: string;
  snapshotId: string;
  projectRoot: string;
  backupRoot: string;
  manifestPath: string;
  manifestDigest: string;
  createdAt: string;
  entries: BackupEntry[];
  verified: true;
}

export const MIGRATION_ROUTING_SURFACES = ["archive", "artifacts", "assets"] as const;
export type MigrationRoutingSurface = (typeof MIGRATION_ROUTING_SURFACES)[number];

const MIGRATION_ROUTING_PATHS: Record<MigrationRoutingSurface, string> = {
  archive: ".make-docs/archive",
  artifacts: "docs/artifacts",
  assets: "docs/assets",
};

export interface InstallPlanMigrationResult extends ApplyResult {
  migrationReceipts: MigrationCheckpointResult[];
  reviewedSnapshotId: string;
  backupManifestPath: string;
}

interface FixedMigrationProductPlan {
  projectRoot: string;
  storeRoot: string;
  installPlan: InstallPlan;
  existingManifest: InstallManifest | null;
  currentManifest: InstallManifest | null;
  routerActions: PlannedAction[];
  promptIdentityActions: PlannedAction[];
  resourceActions: PlannedAction[];
  legacyActions: PlannedAction[];
  preservedActions: PlannedAction[];
  appliedActions: PlannedAction[];
  conflictFiles: string[];
}

interface QuiescenceRecord {
  schemaVersion: 1;
  status: "active";
  lockTokenDigest: string;
  snapshotId: string | null;
  activatedAt: string;
  legacyOperations: LegacyCompatibilityOperationId[];
}

const MIGRATION_STATE_RELATIVE_DIR = ".make-docs/state";
const MIGRATION_LOCK_RELATIVE_PATH = `${MIGRATION_STATE_RELATIVE_DIR}/migration.lock.json`;
const QUIESCENCE_RELATIVE_PATH = `${MIGRATION_STATE_RELATIVE_DIR}/legacy-quiescence.json`;
const WRITER_DIR_RELATIVE_PATH = `${MIGRATION_STATE_RELATIVE_DIR}/legacy-writers`;
const RECEIPT_DIR_RELATIVE_PATH = `${MIGRATION_STATE_RELATIVE_DIR}/migration-receipts`;

export function classifyMigrationCompatibility(input: {
  state: CompatibilitySourceState;
  disposition: CompatibilityDisposition;
  facets?: Partial<MigrationCompatibilityFacets>;
}): MigrationCompatibilityClassification {
  const facets: MigrationCompatibilityFacets = {
    resource: input.facets?.resource ?? "unknown",
    filesystem: input.facets?.filesystem ?? "unknown",
    manifestProvenance: input.facets?.manifestProvenance ?? "ambiguous",
    store: input.facets?.store ?? "newer-unknown",
    legacyAssets: input.facets?.legacyAssets ?? "unknown",
    pathSafety: input.facets?.pathSafety ?? "ambiguous",
    optionalAgentics: input.facets?.optionalAgentics ?? "unknown",
  };
  const blockers = new Set<MigrationSafetyCode>();
  for (const state of [
    facets.resource,
    facets.filesystem,
    facets.legacyAssets,
    facets.optionalAgentics,
  ]) {
    if (state === "managed-modified" || state === "mixed" || state === "unknown") {
      blockers.add("ambiguous-ownership");
    }
  }
  if (facets.manifestProvenance !== "verified") blockers.add("ambiguous-ownership");
  if (facets.store === "newer-unknown" || facets.store === "corrupt") {
    blockers.add("classification-blocked");
  }
  if (facets.pathSafety === "path-escape") blockers.add("path-escape");
  if (facets.pathSafety === "permission-denied") blockers.add("permission-denied");
  if (facets.pathSafety === "cross-platform-mismatch") {
    blockers.add("cross-platform-mismatch");
  }
  if (facets.pathSafety === "ambiguous") blockers.add("classification-blocked");
  if (input.state === "unknown-shape") blockers.add("classification-blocked");

  const reviewedMigrationAllowed =
    blockers.size === 0 && input.disposition !== "manual-review-required";
  const unattendedSafe =
    reviewedMigrationAllowed &&
    (input.state === "clean-v1" || input.state.startsWith("clean-v2-")) &&
    (input.disposition === "migrate" || input.disposition === "sync");
  return {
    state: input.state,
    disposition: input.disposition,
    facets,
    blockers: [...blockers].sort(compareCodeUnits),
    unattendedSafe,
    reviewedMigrationAllowed,
  };
}

export function acquireProjectMigrationLock(input: {
  projectRoot: string;
  now?: string;
}): ProjectMigrationLock {
  const projectRoot = realpathSync(path.resolve(input.projectRoot));
  ensureMigrationStateDirectory(projectRoot);
  const repository = readRepositoryIdentity(projectRoot);
  const lockPath = path.join(projectRoot, MIGRATION_LOCK_RELATIVE_PATH);
  const token = randomUUID();
  const acquiredAt = input.now ?? new Date().toISOString();
  const lock: ProjectMigrationLock = {
    projectRoot,
    lockPath,
    token,
    acquiredAt,
    repository,
  };
  let descriptor: number;
  try {
    descriptor = openSync(lockPath, "wx", 0o600);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new MigrationSafetyError("lock-active", "A project migration lock is already active.");
    }
    throw error;
  }
  try {
    writeFileSync(descriptor, `${JSON.stringify({ schemaVersion: 1, ...lock }, null, 2)}\n`);
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }

  try {
    assertNoActiveLegacyWriters(projectRoot);
    writeQuiescence(projectRoot, {
      schemaVersion: 1,
      status: "active",
      lockTokenDigest: digest(token),
      snapshotId: null,
      activatedAt: acquiredAt,
      legacyOperations: [...LEGACY_COMPATIBILITY_OPERATION_IDS],
    });
    assertNoActiveLegacyWriters(projectRoot);
  } catch (error) {
    rmSync(path.join(projectRoot, QUIESCENCE_RELATIVE_PATH), { force: true });
    rmSync(lockPath, { force: true });
    throw error;
  }
  return lock;
}

export function releaseProjectMigrationLock(lock: ProjectMigrationLock): void {
  assertMigrationLockTokenActive(lock);
  rmSync(lock.lockPath, { force: false });
}

export function assertProjectMigrationLockActive(lock: ProjectMigrationLock): void {
  let stored: { token?: unknown };
  try {
    stored = JSON.parse(readFileSync(lock.lockPath, "utf8")) as { token?: unknown };
  } catch {
    throw new MigrationSafetyError("lock-lost", "The project migration lock is missing or unreadable.");
  }
  if (stored.token !== lock.token) {
    throw new MigrationSafetyError("lock-lost", "The project migration lock token changed.");
  }
  const current = readRepositoryIdentity(lock.projectRoot);
  if (stableJson(current) !== stableJson(lock.repository)) {
    throw new MigrationSafetyError(
      "snapshot-drift",
      "The repository or manifest identity changed after the migration lock was acquired.",
    );
  }
}

export function createReviewedMigrationSnapshot(input: {
  lock: ProjectMigrationLock;
  classification: MigrationCompatibilityClassification;
  affectedPaths: readonly MigrationAffectedPath[];
  createdAt?: string;
}): ReviewedMigrationSnapshot {
  assertProjectMigrationLockActive(input.lock);
  const paths = normalizeAffectedPaths(input.lock.projectRoot, input.affectedPaths);
  const subject = {
    schemaVersion: 1 as const,
    createdAt: input.createdAt ?? new Date().toISOString(),
    repository: input.lock.repository,
    classification: input.classification,
    paths,
    legacyOperations: [...LEGACY_COMPATIBILITY_OPERATION_IDS],
  };
  const snapshot: ReviewedMigrationSnapshot = {
    ...subject,
    snapshotId: `sha256:${digest(stableJson(subject))}`,
  };
  bindQuiescenceToSnapshot(input.lock, snapshot.snapshotId);
  return snapshot;
}

export function assertReviewedMigrationSnapshotCurrent(
  lock: ProjectMigrationLock,
  snapshot: ReviewedMigrationSnapshot,
): void {
  assertProjectMigrationLockActive(lock);
  const currentPaths = snapshot.paths.map((entry) =>
    inspectPath(lock.projectRoot, {
      relativePath: entry.relativePath,
      ownership: entry.ownership,
      disposition: entry.disposition,
      reason: entry.reason,
    }),
  );
  if (stableJson(currentPaths) !== stableJson(snapshot.paths)) {
    throw new MigrationSafetyError(
      "snapshot-drift",
      "An affected path changed after the migration snapshot was reviewed.",
    );
  }
  const barrier = readQuiescence(lock.projectRoot);
  if (barrier.snapshotId !== snapshot.snapshotId) {
    throw new MigrationSafetyError(
      "barrier-bypass",
      "The quiescence barrier is not bound to the reviewed migration snapshot.",
    );
  }
}

export function createVerifiedMigrationBackup(input: {
  lock: ProjectMigrationLock;
  snapshot: ReviewedMigrationSnapshot;
  backupId?: string;
  createdAt?: string;
}): VerifiedMigrationBackup {
  assertReviewedMigrationSnapshotCurrent(input.lock, input.snapshot);
  const backupId = sanitizeBackupId(input.backupId ?? new Date().toISOString());
  const backupRoot = path.join(input.lock.projectRoot, ".make-docs/backup", backupId);
  assertManagedPathHasNoSymlinks(input.lock.projectRoot, ".make-docs/backup");
  if (existsSync(backupRoot)) {
    throw new MigrationSafetyError("backup-incomplete", "The selected backup destination already exists.");
  }
  mkdirSync(path.join(backupRoot, "files"), { recursive: true, mode: 0o700 });
  const entries: BackupEntry[] = [];
  try {
    for (const [index, original] of input.snapshot.paths.entries()) {
      const mutates = isMutatingDisposition(original.disposition);
      const source = path.join(input.lock.projectRoot, ...original.relativePath.split("/"));
      const backupRelative = `files/${original.relativePath}`;
      const destination = path.join(backupRoot, ...backupRelative.split("/"));
      let copied = false;
      if (mutates && original.entryType !== "missing") {
        if (original.entryType === "directory" || original.entryType === "other") {
          throw new MigrationSafetyError(
            "backup-incomplete",
            `A mutating directory or special entry requires explicit child dispositions: ${original.relativePath}.`,
          );
        }
        mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
        if (original.entryType === "symlink") {
          symlinkSync(readlinkSync(source), destination);
        } else {
          copyFileSync(source, destination);
        }
        copied = true;
      }
      entries.push({
        relativePath: original.relativePath,
        backupPath: copied ? backupRelative : null,
        original,
        copied,
        verified: !copied || backupEntryMatches(destination, original),
        restoreOrder: input.snapshot.paths.length - index,
      });
    }
    if (entries.some((entry) => !entry.verified)) {
      throw new MigrationSafetyError("backup-incomplete", "A copied backup entry failed digest verification.");
    }
    const createdAt = input.createdAt ?? new Date().toISOString();
    const manifestBody = {
      schemaVersion: 1 as const,
      backupId,
      snapshotId: input.snapshot.snapshotId,
      projectRoot: input.lock.projectRoot,
      repository: input.snapshot.repository,
      classification: input.snapshot.classification,
      createdAt,
      entries,
    };
    const manifestPath = path.join(backupRoot, "backup-manifest.json");
    writeJsonAtomic(manifestPath, manifestBody);
    const manifestDigest = digest(readFileSync(manifestPath));
    const backup: VerifiedMigrationBackup = {
      schemaVersion: 1,
      backupId,
      snapshotId: input.snapshot.snapshotId,
      projectRoot: input.lock.projectRoot,
      backupRoot,
      manifestPath,
      manifestDigest,
      createdAt,
      entries,
      verified: true,
    };
    verifyMigrationBackup(input.lock, input.snapshot, backup);
    return backup;
  } catch (error) {
    rmSync(backupRoot, { recursive: true, force: true });
    throw error;
  }
}

export function verifyMigrationBackup(
  lock: ProjectMigrationLock,
  snapshot: ReviewedMigrationSnapshot,
  backup: VerifiedMigrationBackup,
): void {
  assertProjectMigrationLockActive(lock);
  verifyMigrationBackupFiles(lock, snapshot, backup);
}

function verifyMigrationBackupFiles(
  lock: ProjectMigrationLock,
  snapshot: ReviewedMigrationSnapshot,
  backup: VerifiedMigrationBackup,
): void {
  if (backup.snapshotId !== snapshot.snapshotId || backup.projectRoot !== lock.projectRoot) {
    throw new MigrationSafetyError("backup-incomplete", "The backup is not bound to this migration snapshot.");
  }
  if (!existsSync(backup.manifestPath) || digest(readFileSync(backup.manifestPath)) !== backup.manifestDigest) {
    throw new MigrationSafetyError("backup-incomplete", "The backup manifest is missing or changed.");
  }
  for (const entry of backup.entries) {
    if (isMutatingDisposition(entry.original.disposition) && entry.original.entryType !== "missing") {
      if (!entry.copied || !entry.backupPath) {
        throw new MigrationSafetyError(
          "backup-incomplete",
          `No restore entry exists for ${entry.relativePath}.`,
        );
      }
      const backupPath = path.join(backup.backupRoot, ...entry.backupPath.split("/"));
      if (!backupEntryMatches(backupPath, entry.original)) {
        throw new MigrationSafetyError(
          "backup-incomplete",
          `The restore entry changed for ${entry.relativePath}.`,
        );
      }
    }
  }
}

export function restoreMigrationBackup(input: {
  lock: ProjectMigrationLock;
  snapshot: ReviewedMigrationSnapshot;
  backup: VerifiedMigrationBackup;
}): { restoredPaths: string[]; unrestoredPaths: string[] } {
  const recoveryPaths = migrationRecoveryPaths(input.backup.entries);
  try {
    assertMigrationLockTokenActive(input.lock);
    verifyMigrationBackupFiles(input.lock, input.snapshot, input.backup);
  } catch {
    return { restoredPaths: [], unrestoredPaths: recoveryPaths };
  }
  const restoredPaths: string[] = [];
  const unrestoredPaths: string[] = [];
  for (const entry of [...input.backup.entries].sort((a, b) => a.restoreOrder - b.restoreOrder)) {
    const destination = path.join(input.lock.projectRoot, ...entry.relativePath.split("/"));
    if (
      entry.original.entryType === "missing" &&
      isMutatingDisposition(entry.original.disposition)
    ) {
      try {
        if (removeRollbackDestinationSafely(destination)) {
          restoredPaths.push(entry.relativePath);
        } else {
          unrestoredPaths.push(entry.relativePath);
        }
      } catch {
        unrestoredPaths.push(entry.relativePath);
      }
      continue;
    }
    if (!entry.copied || !entry.backupPath) continue;
    const backupPath = path.join(input.backup.backupRoot, ...entry.backupPath.split("/"));
    try {
      if (!removeRollbackDestinationSafely(destination)) {
        unrestoredPaths.push(entry.relativePath);
        continue;
      }
      mkdirSync(path.dirname(destination), { recursive: true });
      if (entry.original.entryType === "symlink") {
        symlinkSync(readlinkSync(backupPath), destination);
      } else {
        copyFileSync(backupPath, destination);
        if (entry.original.mode !== undefined) chmodSync(destination, entry.original.mode);
        const stats = lstatSync(backupPath);
        utimesSync(destination, stats.atime, stats.mtime);
      }
      restoredPaths.push(entry.relativePath);
    } catch {
      unrestoredPaths.push(entry.relativePath);
    }
  }
  return { restoredPaths, unrestoredPaths };
}

function migrationRecoveryPaths(entries: readonly BackupEntry[]): string[] {
  return entries
    .filter((entry) => isMutatingDisposition(entry.original.disposition))
    .map((entry) => entry.relativePath)
    .sort(compareCodeUnits);
}

function removeRollbackDestinationSafely(destination: string): boolean {
  let stats;
  try {
    stats = lstatSync(destination);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return true;
    throw error;
  }
  if (!stats.isDirectory() || stats.isSymbolicLink()) {
    rmSync(destination, { force: false });
    return true;
  }
  if (readdirSync(destination).length > 0) return false;
  rmSync(destination, { recursive: false, force: false });
  return true;
}

export function enterLegacyCompatibilityOperation(input: {
  projectRoot: string;
  operationId: string;
  mutates: boolean;
}): () => void {
  if (!LEGACY_COMPATIBILITY_OPERATION_SET.has(input.operationId)) return () => undefined;
  const projectRoot = resolveProjectRoot(input.projectRoot);
  assertLegacyOperationNotQuiesced(projectRoot, input.operationId);
  if (!input.mutates) return () => undefined;

  ensureMigrationStateDirectory(projectRoot);
  const writerDir = path.join(projectRoot, WRITER_DIR_RELATIVE_PATH);
  mkdirSync(writerDir, { recursive: true, mode: 0o700 });
  const leasePath = path.join(writerDir, `${process.pid}-${randomUUID()}.json`);
  const descriptor = openSync(leasePath, "wx", 0o600);
  try {
    writeFileSync(
      descriptor,
      `${JSON.stringify({ operationId: input.operationId, pid: process.pid, startedAt: new Date().toISOString() })}\n`,
    );
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
  try {
    assertLegacyOperationNotQuiesced(projectRoot, input.operationId);
  } catch (error) {
    rmSync(leasePath, { force: true });
    throw error;
  }
  return () => rmSync(leasePath, { force: true });
}

export function resolveLegacyOperationProjectRoot(
  cwd: string,
  parsedInput: unknown,
): string {
  if (typeof parsedInput === "object" && parsedInput !== null) {
    const input = parsedInput as Record<string, unknown>;
    for (const key of ["repoRoot", "targetDir", "projectRoot", "canonicalRoot"]) {
      const value = input[key];
      if (typeof value === "string" && value.length > 0) {
        return resolveProjectRoot(path.resolve(cwd, value));
      }
    }
  }
  return resolveProjectRoot(cwd);
}

export function planMigrationRoutingSurface(
  projectRoot: string,
  surface: MigrationRoutingSurface,
): PlannedAction {
  const relativePath = MIGRATION_ROUTING_PATHS[surface];
  assertManagedPathHasNoSymlinks(projectRoot, relativePath);
  const absolutePath = relativePathToTarget(projectRoot, relativePath);
  if (!existsSync(absolutePath)) {
    return {
      type: "create",
      disposition: "create",
      relativePath,
      reason: "Selected project surface is absent.",
    };
  }
  const stats = lstatSync(absolutePath);
  if (!stats.isDirectory() || stats.isSymbolicLink()) {
    throw new MigrationSafetyError(
      "ambiguous-ownership",
      `Selected project surface is not a safe directory: ${relativePath}.`,
    );
  }
  return {
    type: "noop",
    disposition: "preserve",
    relativePath,
    reason: "Selected project surface already exists.",
  };
}

export function applyMigrationRoutingSurface(
  projectRoot: string,
  action: PlannedAction,
  routerActions: readonly PlannedAction[] = [],
): void {
  if (!Object.values(MIGRATION_ROUTING_PATHS).includes(action.relativePath)) {
    throw new MigrationSafetyError(
      "unsupported-product-action",
      `Unsupported migration routing path: ${action.relativePath}.`,
    );
  }
  if (action.type !== "noop" && action.type !== "create") {
    throw new MigrationSafetyError(
      "unsupported-product-action",
      `Unsupported migration routing action for ${action.relativePath}: ${action.type}.`,
    );
  }
  if (action.type === "create") {
    assertManagedPathHasNoSymlinks(projectRoot, action.relativePath);
    mkdirSync(relativePathToTarget(projectRoot, action.relativePath), { recursive: true });
  }
  for (const routerAction of routerActions) {
    if (
      path.dirname(routerAction.relativePath) !== action.relativePath ||
      !/\/(?:AGENTS|CLAUDE)\.md$/.test(routerAction.relativePath)
    ) {
      throw new MigrationSafetyError(
        "unsupported-product-action",
        `Unsupported project surface router path: ${routerAction.relativePath}.`,
      );
    }
    if (routerAction.type === "noop") continue;
    if (routerAction.type !== "create" || typeof routerAction.content !== "string") {
      throw new MigrationSafetyError(
        "unsupported-product-action",
        `Unsupported project surface router action for ${routerAction.relativePath}: ${routerAction.type}.`,
      );
    }
    assertManagedPathHasNoSymlinks(projectRoot, routerAction.relativePath);
    writeFileSync(
      relativePathToTarget(projectRoot, routerAction.relativePath),
      routerAction.content,
      { encoding: "utf8", flag: "wx" },
    );
  }
}

export function removeTrustedPythonPathHelper(input: {
  projectRoot: string;
  relativePath: string;
  trustedHashes: readonly string[];
  replacementParityProved: boolean;
  consumers: readonly { name: string; replaced: boolean }[];
}): { removed: boolean; digest: string } {
  if (!input.replacementParityProved) {
    throw new MigrationSafetyError(
      "helper-replacement-unproved",
      "The TypeScript path-hygiene replacement has not proved parity.",
    );
  }
  const activeConsumers = input.consumers.filter((consumer) => !consumer.replaced);
  if (activeConsumers.length > 0) {
    throw new MigrationSafetyError(
      "helper-consumer-active",
      `The Python helper still has active consumers: ${activeConsumers.map((item) => item.name).join(", ")}.`,
    );
  }
  const relativePath = assertProjectRelativePosix(input.relativePath);
  assertManagedPathHasNoSymlinks(input.projectRoot, relativePath);
  const absolutePath = path.join(input.projectRoot, ...relativePath.split("/"));
  const stats = lstatSync(absolutePath);
  if (!stats.isFile()) {
    throw new MigrationSafetyError("helper-hash-mismatch", "The Python helper is not a regular file.");
  }
  const fileDigest = digest(readFileSync(absolutePath));
  if (!input.trustedHashes.includes(fileDigest)) {
    throw new MigrationSafetyError(
      "helper-hash-mismatch",
      "The Python helper does not match a trusted managed hash.",
    );
  }
  rmSync(absolutePath, { force: false });
  return { removed: true, digest: fileDigest };
}

export class ImmutableMigrationCoordinator {
  private checkpoint = 0;
  private expectedPaths: MigrationPathSnapshot[];

  constructor(
    private readonly lock: ProjectMigrationLock,
    private readonly snapshot: ReviewedMigrationSnapshot,
    private readonly backup: VerifiedMigrationBackup,
    private readonly productPlan: FixedMigrationProductPlan | null = null,
  ) {
    this.expectedPaths = snapshot.paths.map((entry) => ({ ...entry }));
  }

  currentCheckpoint(): number {
    return this.checkpoint;
  }

  pause(message: string): MigrationCheckpointReceipt {
    return this.persistReceipt("paused", null, message, emptyRollback(), this.checkpoint);
  }

  block(code: MigrationSafetyCode, message: string): MigrationCheckpointReceipt {
    return this.persistReceipt("blocked", code, message, emptyRollback(), this.checkpoint);
  }

  advance(next: MigrationCheckpoint): MigrationCheckpointResult {
    if (next >= 11) {
      const owner = MIGRATION_CHECKPOINTS.find((item) => item.checkpoint === next)!.owner;
      return this.block(
        "downstream-checkpoint-locked",
        `Checkpoint ${next} is locked to ${owner} and cannot run before its owning phase.`,
      );
    }
    if (next !== this.checkpoint + 1) {
      return this.block(
        "out-of-order-checkpoint",
        `Checkpoint ${next} cannot follow checkpoint ${this.checkpoint}.`,
      );
    }
    try {
      if (this.checkpoint < 3) {
        assertReviewedMigrationSnapshotCurrent(this.lock, this.snapshot);
        if (next >= 2) verifyMigrationBackup(this.lock, this.snapshot, this.backup);
      } else {
        assertMigrationLockTokenActive(this.lock);
        assertBarrierBoundToSnapshot(this.lock, this.snapshot.snapshotId);
        verifyMigrationBackupFiles(this.lock, this.snapshot, this.backup);
        this.assertExpectedPathBinding();
      }
      if (next >= 3 && !this.snapshot.classification.reviewedMigrationAllowed) {
        throw new MigrationSafetyError(
          "classification-blocked",
          `The frozen classification does not permit reviewed mutation (${this.snapshot.classification.blockers.join(", ") || "no accepted safety proof"}).`,
        );
      }
      if (next === 9 && this.productPlan) {
        const checkpoint9 = executeCheckpoint9WithLock({
          lock: this.lock,
          snapshot: this.snapshot,
          storeRoot: this.productPlan.storeRoot,
        });
        if (checkpoint9.status === "receipt-projection-failed") {
          return checkpoint9;
        }
        if (checkpoint9.status === "completed") {
          this.checkpoint = next;
          return checkpoint9.receipt;
        }
      }
      this.applyFixedProductOperation(next as ImplementedMigrationCheckpoint);
      if (next >= 3) this.refreshExpectedPathBinding();
      this.checkpoint = next;
      const receipt = this.persistReceipt(
        "completed",
        null,
        `Checkpoint ${next} completed under the frozen snapshot.`,
        emptyRollback(),
        next,
      );
      return receipt;
    } catch (error) {
      const code =
        error instanceof MigrationSafetyError ? error.code : "classification-blocked";
      if (next < 3) {
        return this.persistReceipt("failed", code, errorMessage(error), emptyRollback(), next);
      }
      let rollback = emptyRollback();
      try {
        const result = restoreMigrationBackup({
          lock: this.lock,
          snapshot: this.snapshot,
          backup: this.backup,
        });
        rollback = {
          attempted: true,
          completed: result.unrestoredPaths.length === 0,
          restoredPaths: result.restoredPaths,
          unrestoredPaths: result.unrestoredPaths,
        };
      } catch {
        rollback = {
          attempted: true,
          completed: false,
          restoredPaths: [],
          unrestoredPaths: migrationRecoveryPaths(this.backup.entries),
        };
      }
      return this.persistReceipt(
        rollback.completed ? "failed" : "rollback-required",
        code,
        errorMessage(error),
        rollback,
        next,
      );
    }
  }

  productResult(): ApplyResult {
    if (!this.productPlan?.currentManifest) {
      throw new MigrationSafetyError(
        "product-operation-unavailable",
        "The fixed migration product plan has not produced a manifest.",
      );
    }
    return {
      manifest: this.productPlan.currentManifest,
      appliedActions: [...this.productPlan.appliedActions],
      conflictFiles: [...this.productPlan.conflictFiles],
      mutationApplied: this.productPlan.appliedActions.some((action) => action.type !== "noop"),
    };
  }

  private applyFixedProductOperation(next: ImplementedMigrationCheckpoint): void {
    if (next <= 2) return;
    const product = this.productPlan;
    if (!product) {
      throw new MigrationSafetyError(
        "product-operation-unavailable",
        `Checkpoint ${next} requires a fixed install-plan migration operation.`,
      );
    }
    switch (next) {
      case 3:
        applyFixedInstallStage(product, 3, []);
        return;
      case 4:
        applyFixedInstallStage(product, 4, product.routerActions);
        return;
      case 5:
        assertResourceDiscoveryOperationsAvailable();
        applyFixedInstallStage(product, 5, product.promptIdentityActions);
        return;
      case 6:
        applyFixedInstallStage(product, 6, product.resourceActions);
        return;
      case 7:
        assertOnDemandRoutingAvailable(this.lock.projectRoot);
        applyFixedInstallStage(product, 7, [
          ...product.legacyActions,
          ...product.preservedActions.filter((action) =>
            action.type === "noop" &&
            product.installPlan.desiredFiles[action.relativePath] !== undefined &&
            JSON.stringify(product.currentManifest?.files[action.relativePath] ?? null) !==
              JSON.stringify(product.installPlan.desiredFiles[action.relativePath]),
          ),
        ]);
        return;
      case 8: {
        const result = validateProjectPathHygiene({ projectRoot: this.lock.projectRoot });
        if (!result.valid) {
          throw new MigrationSafetyError(
            "path-hygiene-failed",
            `TypeScript path hygiene failed with ${result.failingFindings} finding(s) and ${result.ioErrors.length} I/O error(s).`,
          );
        }
        return;
      }
      case 9:
        return;
      case 10:
        validateUatCheckpoint10(this.lock.projectRoot);
        return;
    }
  }

  private assertExpectedPathBinding(): void {
    const current = this.expectedPaths.map((entry) => inspectPath(this.lock.projectRoot, entry));
    if (stableJson(current) !== stableJson(this.expectedPaths)) {
      throw new MigrationSafetyError(
        "snapshot-drift",
        "An affected path changed outside the fixed migration operations.",
      );
    }
  }

  private refreshExpectedPathBinding(): void {
    this.expectedPaths = this.expectedPaths.map((entry) =>
      inspectPath(this.lock.projectRoot, entry),
    );
  }

  private persistReceipt(
    status: MigrationReceiptStatus,
    code: MigrationSafetyCode | null,
    message: string,
    rollback: MigrationCheckpointReceipt["rollback"],
    checkpoint: number,
  ): MigrationCheckpointReceipt {
    return persistMigrationReceipt(
      this.lock,
      this.snapshot.snapshotId,
      status,
      code,
      message,
      rollback,
      checkpoint,
    );
  }
}

export function executeInstallPlanMigration(input: {
  projectRoot: string;
  storeRoot: string;
  compatibility: CompatibilityClassification;
  installPlan: InstallPlan;
  existingManifest: InstallManifest | null;
  backupId?: string;
}): InstallPlanMigrationResult {
  const projectRoot = realpathSync(path.resolve(input.projectRoot));
  assertStoreCheckpoint9SetupSafe(input.storeRoot);
  const unresolved = findReviewableManagedFileConflicts(input.installPlan);
  if (unresolved.length > 0 || (input.installPlan.stops?.length ?? 0) > 0) {
    throw new MigrationSafetyError(
      "ambiguous-ownership",
      "The install plan still has unresolved ownership or safety stops.",
    );
  }
  const lock = acquireProjectMigrationLock({ projectRoot });
  try {
    const productPlan = createFixedMigrationProductPlan(
      projectRoot,
      input.storeRoot,
      input.installPlan,
      input.existingManifest,
    );
    const snapshot = createReviewedMigrationSnapshot({
      lock,
      classification: classificationFromReviewedInstallPlan(
        input.compatibility,
        input.existingManifest,
        input.installPlan,
      ),
      affectedPaths: affectedPathsFromInstallPlan(projectRoot, productPlan),
    });
    const backup = createVerifiedMigrationBackup({
      lock,
      snapshot,
      ...(input.backupId ? { backupId: input.backupId } : {}),
    });
    const coordinator = new ImmutableMigrationCoordinator(lock, snapshot, backup, productPlan);
    const migrationReceipts: MigrationCheckpointResult[] = [];
    for (const checkpoint of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const) {
      const receipt = coordinator.advance(checkpoint);
      migrationReceipts.push(receipt);
      if (receipt.status === "receipt-projection-failed") {
        throw new Checkpoint9ReceiptProjectionError(receipt);
      }
      if (receipt.status !== "completed") {
        throw new MigrationSafetyError(
          receipt.code ?? "classification-blocked",
          `Migration checkpoint ${checkpoint} ended with status ${receipt.status}: ${receipt.message}`,
        );
      }
    }
    return {
      ...coordinator.productResult(),
      migrationReceipts,
      reviewedSnapshotId: snapshot.snapshotId,
      backupManifestPath: backup.manifestPath,
    };
  } finally {
    releaseProjectMigrationLock(lock);
  }
}

/** Classifies the Store before setup creates a project lock or changes a file. */
export function assertStoreCheckpoint9SetupSafe(
  storeRoot: string,
): StoreCheckpoint9Classification {
  const classification = classifyStoreCheckpoint9State(storeRoot);
  if (
    classification.state === "corrupt" ||
    classification.state === "unknown" ||
    classification.state === "newer-unknown" ||
    classification.state === "indeterminate"
  ) {
    throw new StoreCheckpoint9StateError(classification);
  }
  return classification;
}

/** Runs or recovers checkpoint 9 before fresh-project and no-op setup mutation. */
export function executeStoreCheckpoint9Migration(input: {
  projectRoot: string;
  storeRoot: string;
}): StoreCheckpoint9ExecutionResult {
  const storeClassification = assertStoreCheckpoint9SetupSafe(input.storeRoot);
  const projectRoot = realpathSync(path.resolve(input.projectRoot));
  const lock = acquireProjectMigrationLock({ projectRoot });
  try {
    const classification: MigrationCompatibilityClassification = {
      state: "clean-v2-full-snapshot",
      disposition: "sync",
      facets: {
        resource: "absent",
        filesystem: "absent",
        manifestProvenance: "verified",
        store: checkpoint9MigrationStoreState(storeClassification),
        legacyAssets: "absent",
        pathSafety: "safe",
        optionalAgentics: "absent",
      },
      blockers: [],
      unattendedSafe: true,
      reviewedMigrationAllowed: true,
    };
    const createdAt = new Date().toISOString();
    const snapshotSubject = {
      schemaVersion: 1 as const,
      createdAt,
      repository: lock.repository,
      classification,
      paths: [] as MigrationPathSnapshot[],
      legacyOperations: [...LEGACY_COMPATIBILITY_OPERATION_IDS],
    };
    const snapshot: ReviewedMigrationSnapshot = {
      ...snapshotSubject,
      snapshotId: `sha256:${digest(stableJson(snapshotSubject))}`,
    };
    bindQuiescenceToSnapshot(lock, snapshot.snapshotId);
    return executeCheckpoint9WithLock({ lock, snapshot, storeRoot: input.storeRoot });
  } finally {
    releaseProjectMigrationLock(lock);
  }
}

function executeCheckpoint9WithLock(input: {
  lock: ProjectMigrationLock;
  snapshot: ReviewedMigrationSnapshot;
  storeRoot: string;
}): StoreCheckpoint9ExecutionResult {
  const classification = assertStoreCheckpoint9SetupSafe(input.storeRoot);
  if (classification.state === "supported-current") {
    const journal = readStoreCheckpoint9JournalEntry(
      input.storeRoot,
      input.lock.repository.projectRootDigest,
    );
    if (!journal) {
      return {
        status: "not-required",
        checkpoint: 9,
        storeCommitted: true,
        setupMayContinue: true,
      };
    }
    const receipt = receiptFromCheckpoint9Journal(journal);
    return projectCheckpoint9Receipt(input.lock, receipt, true);
  }

  const receipt = createMigrationReceipt(
    input.lock,
    input.snapshot.snapshotId,
    "completed",
    null,
    "Checkpoint 9 completed under the frozen Store snapshot.",
    emptyRollback(),
    9,
  );
  const journal: StoreCheckpoint9JournalEntry = {
    receiptId: receipt.receiptId,
    checkpoint: 9,
    projectRootDigest: input.lock.repository.projectRootDigest,
    snapshotId: receipt.snapshotId,
    committedAt: receipt.createdAt,
    receiptJson: JSON.stringify(receipt),
  };
  const migrated = migrateStoreDatabaseAtCheckpoint9(input.storeRoot, journal);
  if (!migrated.journal) {
    return {
      status: "not-required",
      checkpoint: 9,
      storeCommitted: true,
      setupMayContinue: true,
    };
  }
  return projectCheckpoint9Receipt(input.lock, receipt, false);
}

function projectCheckpoint9Receipt(
  lock: ProjectMigrationLock,
  receipt: MigrationCheckpointReceipt,
  recoveredProjection: boolean,
): StoreCheckpoint9ExecutionResult {
  let lastError: unknown;
  for (const projectionAttempts of [1, 2] as const) {
    try {
      projectMigrationReceipt(lock, receipt);
      return {
        status: "completed",
        checkpoint: 9,
        storeCommitted: true,
        setupMayContinue: true,
        recoveredProjection,
        projectionAttempts,
        receipt,
      };
    } catch (error) {
      lastError = error;
    }
  }
  return {
    schemaVersion: 1,
    status: "receipt-projection-failed",
    checkpoint: 9,
    code: "checkpoint-receipt-projection-failed",
    receiptId: receipt.receiptId,
    projectionAttempts: 2,
    storeCommitted: true,
    setupMayContinue: false,
    message: `Checkpoint 9 committed, but its project receipt could not be projected twice: ${errorMessage(lastError)}`,
  };
}

function receiptFromCheckpoint9Journal(
  journal: StoreCheckpoint9JournalEntry,
): MigrationCheckpointReceipt {
  const receipt = JSON.parse(journal.receiptJson) as MigrationCheckpointReceipt;
  if (
    receipt.schemaVersion !== 1 ||
    receipt.receiptId !== journal.receiptId ||
    receipt.checkpoint !== 9 ||
    receipt.snapshotId !== journal.snapshotId ||
    receipt.createdAt !== journal.committedAt
  ) {
    throw new MigrationSafetyError(
      "classification-blocked",
      "The checkpoint-9 journal receipt metadata is inconsistent.",
    );
  }
  return receipt;
}

function checkpoint9MigrationStoreState(
  classification: StoreCheckpoint9Classification,
): MigrationStoreState {
  switch (classification.state) {
    case "absent": return "absent";
    case "supported-current": return "supported-current";
    case "supported-legacy": return "supported-legacy";
    case "newer-unknown": return "newer-unknown";
    case "corrupt": return "corrupt";
    case "unknown": return "unknown";
    case "indeterminate": return "indeterminate";
  }
}

function createFixedMigrationProductPlan(
  projectRoot: string,
  storeRoot: string,
  installPlan: InstallPlan,
  existingManifest: InstallManifest | null,
): FixedMigrationProductPlan {
  const routerActions: PlannedAction[] = [];
  const promptIdentityActions: PlannedAction[] = [];
  const resourceActions: PlannedAction[] = [];
  const legacyActions: PlannedAction[] = [];
  const preservedActions: PlannedAction[] = [];
  for (const action of installPlan.actions) {
    if (action.sourceId?.startsWith("router:")) {
      routerActions.push(action);
    } else if (action.sourceId?.startsWith("resource:")) {
      resourceActions.push(action);
    } else if (/^\.make-docs\/system\/prompts\/(?:AGENTS|CLAUDE)\.md$/.test(action.relativePath)) {
      promptIdentityActions.push(action);
    } else if (mustPreserveOutsideP5(action)) {
      preservedActions.push(action);
    } else {
      legacyActions.push(action);
    }
  }
  return {
    projectRoot,
    storeRoot,
    installPlan,
    existingManifest,
    currentManifest: existingManifest,
    routerActions,
    promptIdentityActions,
    resourceActions,
    legacyActions,
    preservedActions,
    appliedActions: [],
    conflictFiles: [],
  };
}

function applyFixedInstallStage(
  product: FixedMigrationProductPlan,
  checkpoint: 3 | 4 | 5 | 6 | 7,
  actions: readonly PlannedAction[],
): void {
  const stagePlan = fixedStagePlan(product, checkpoint, actions);
  const result = applyInstallPlan({
    targetDir: product.projectRoot,
    plan: stagePlan,
    existingManifest: product.currentManifest,
  });
  product.currentManifest = result.manifest;
  product.appliedActions.push(...result.appliedActions);
  product.conflictFiles.push(...result.conflictFiles);
}

function fixedStagePlan(
  product: FixedMigrationProductPlan,
  checkpoint: 3 | 4 | 5 | 6 | 7,
  actions: readonly PlannedAction[],
): InstallPlan {
  const { classificationSnapshot: _classificationSnapshot, ...basePlan } = product.installPlan;
  const installedPaths = new Set([
    ...Object.keys(product.currentManifest?.files ?? {}),
    ...actions.flatMap((action) =>
      action.type === "create" || action.type === "update" || action.type === "generate"
        ? [action.relativePath]
        : [],
    ),
  ]);
  return {
    ...basePlan,
    actions: [...actions],
    desiredSkillFiles: [...(product.currentManifest?.skillFiles ?? [])],
    systemAssetMaterialization: filterSystemAssetState(
      product.installPlan.systemAssetMaterialization,
      installedPaths,
    ),
    ...((checkpoint >= 6
      ? product.installPlan.resourceProjection
      : product.currentManifest?.resourceProjection)
      ? {
          resourceProjection:
            checkpoint >= 6
              ? product.installPlan.resourceProjection!
              : product.currentManifest!.resourceProjection!,
        }
      : {}),
    stops: [],
    forceManifestWrite: true,
  };
}

function filterSystemAssetState(
  state: SystemAssetManifestState,
  installedPaths: ReadonlySet<string>,
): SystemAssetManifestState {
  return {
    ...state,
    localBootstrapPaths: state.localBootstrapPaths.filter((item) => installedPaths.has(item)),
    assets: Object.fromEntries(
      Object.entries(state.assets).filter(([relativePath]) => installedPaths.has(relativePath)),
    ),
  };
}

function assertResourceDiscoveryOperationsAvailable(): void {
  for (const operation of [resourceListOperation, resourceReadOperation]) {
    if (operation.status !== "active" || typeof operation.handler !== "function") {
      throw new MigrationSafetyError(
        "product-operation-unavailable",
        `Required resource operation is unavailable: ${operation.id}.`,
      );
    }
  }
}

function assertOnDemandRoutingAvailable(projectRoot: string): void {
  for (const surface of MIGRATION_ROUTING_SURFACES) {
    const action = planMigrationRoutingSurface(projectRoot, surface);
    if (action.type !== "create" && action.type !== "noop") {
      throw new MigrationSafetyError(
        "product-operation-unavailable",
        `On-demand routing is unavailable for ${surface}.`,
      );
    }
  }
}

function mustPreserveOutsideP5(action: PlannedAction): boolean {
  return Boolean(
    action.skillExposure ||
    action.agenticOwnership ||
    action.agenticRole ||
    (!isRetiredTemplateOwnedChildRouterPath(action.relativePath) &&
      /(?:^|\/)(?:playbooks?|protocols?)(?:\/|$)/i.test(action.relativePath)) ||
    /^(?:\.agents\/|\.claude\/skills\/|\.make-docs\/agentics\/)/.test(action.relativePath),
  );
}

function classificationFromReviewedInstallPlan(
  compatibility: CompatibilityClassification,
  existingManifest: InstallManifest | null,
  installPlan: InstallPlan,
  storeRoot = resolveStoreRoot(),
): MigrationCompatibilityClassification {
  const { evidence, auditReport } = compatibility;
  const manifestTrust = evidence.manifestTrust;
  const filesystemTrust = evidence.filesystemTrust;
  const manifestProvenance = !manifestTrust.present
    ? "absent"
    : manifestTrust.parseable &&
        manifestTrust.packageIdentityTrusted &&
        manifestTrust.selectionsTrusted &&
        manifestTrust.managedFileRecordsTrusted &&
        manifestTrust.skillRecordsTrusted &&
        manifestTrust.materializationProvenanceTrusted
      ? "verified"
      : manifestTrust.parseable
        ? "incomplete"
        : "contradictory";
  const reviewedMutationPaths = new Set(
    installPlan.actions
      .filter((action) =>
        action.type === "update" ||
        action.type === "update-conflict" ||
        action.type === "strip-managed-block" ||
        action.type === "remove-managed",
      )
      .map((action) => action.relativePath),
  );
  const allModifiedPathsReviewed = filesystemTrust.modifiedPaths.every((relativePath) =>
    reviewedMutationPaths.has(relativePath),
  );
  const filesystem: MigrationFilesystemState =
    filesystemTrust.ambiguousFallbackPaths.length > 0 ||
    filesystemTrust.nonMakeDocsPathCollisions.length > 0
      ? "unknown"
      : (filesystemTrust.modifiedPaths.length > 0 && !allModifiedPathsReviewed) ||
          !filesystemTrust.managedBlocksValid
        ? "managed-modified"
        : filesystemTrust.managedFilesMatch || filesystemTrust.missingPaths.length > 0
          ? "managed-clean"
          : "absent";
  const legacyAssets: MigrationFilesystemState = !auditReport
    ? "unknown"
    : auditReport.preservedPaths.length > 0 || auditReport.skippedPaths.length > 0
      ? "project-owned"
      : auditReport.removableFiles.length > 0
        ? "managed-clean"
        : "absent";
  const optionalAgentics: MigrationFilesystemState =
    (existingManifest?.skillFiles.length ?? 0) === 0
      ? "absent"
      : evidence.skillTrust.selectedSkillsTrusted &&
          evidence.skillTrust.missingSkillOutputs.length === 0 &&
          evidence.skillTrust.modifiedSkillOutputs.length === 0
        ? "managed-clean"
        : "unknown";
  return classifyMigrationCompatibility({
    state: compatibility.state,
    disposition: compatibility.disposition,
    facets: {
      resource: evidence.providerCacheTrust.trusted ? "managed-clean" : "unknown",
      filesystem,
      manifestProvenance,
      store: inspectMigrationStoreFacet(storeRoot),
      legacyAssets,
      pathSafety:
        filesystemTrust.ambiguousFallbackPaths.length === 0 &&
        filesystemTrust.nonMakeDocsPathCollisions.length === 0
          ? "safe"
          : "ambiguous",
      optionalAgentics,
    },
  });
}

function inspectMigrationStoreFacet(storeRoot: string): MigrationStoreState {
  const databasePath = getStoreDatabasePath(storeRoot);
  const globalManifestPath = path.join(storeRoot, "manifest.json");
  if (!existsSync(databasePath) && !existsSync(globalManifestPath)) return "absent";
  const manifest = loadGlobalManifest(storeRoot);
  if (!manifest || !existsSync(databasePath)) return "corrupt";
  if (manifest.database.status === "schema-newer") return "newer-unknown";
  if (manifest.database.status === "unavailable" || manifest.database.schemaVersion === null) {
    return "corrupt";
  }
  if (manifest.database.schemaVersion > CURRENT_STORE_SCHEMA_VERSION) return "newer-unknown";
  if (manifest.database.schemaVersion < CURRENT_STORE_SCHEMA_VERSION) return "supported-legacy";
  return "supported-current";
}

function affectedPathsFromInstallPlan(
  projectRoot: string,
  product: FixedMigrationProductPlan,
): MigrationAffectedPath[] {
  const paths = new Map<string, MigrationAffectedPath>();
  const add = (item: MigrationAffectedPath) => paths.set(item.relativePath, item);
  const manifestExists = existsSync(path.join(projectRoot, MANIFEST_RELATIVE_PATH));
  add({
    relativePath: MANIFEST_RELATIVE_PATH,
    ownership: product.existingManifest || !manifestExists ? "managed-clean" : "project-owned",
    disposition: product.existingManifest || !manifestExists
      ? "overwrite-managed-clean"
      : "export-then-replace",
    reason: "The reviewed migration updates the project manifest in ordered checkpoints.",
  });
  for (const action of product.installPlan.actions) {
    const preserved = product.preservedActions.includes(action);
    if (preserved) continue;
    const replacingProjectContent = action.type === "update-conflict";
    add({
      relativePath: action.relativePath,
      ownership: replacingProjectContent ? "project-owned" : "managed-clean",
      disposition: action.type === "noop" || action.type === "skip" || action.type === "skip-conflict"
        ? "skip"
        : replacingProjectContent
          ? "export-then-replace"
          : "overwrite-managed-clean",
      reason: action.reason ?? "The reviewed install plan owns this migration action.",
    });
  }
  return [...paths.values()].sort((left, right) => compareCodeUnits(left.relativePath, right.relativePath));
}

function normalizeAffectedPaths(
  projectRoot: string,
  affectedPaths: readonly MigrationAffectedPath[],
): MigrationPathSnapshot[] {
  const byPath = new Map<string, MigrationAffectedPath>();
  for (const item of affectedPaths) {
    const relativePath = assertProjectRelativePosix(item.relativePath);
    if (byPath.has(relativePath)) {
      throw new MigrationSafetyError(
        "ambiguous-ownership",
        `The migration plan has more than one disposition for ${relativePath}.`,
      );
    }
    validateDisposition(item);
    byPath.set(relativePath, { ...item, relativePath });
  }
  if (!byPath.has(MANIFEST_RELATIVE_PATH) && existsSync(path.join(projectRoot, MANIFEST_RELATIVE_PATH))) {
    byPath.set(MANIFEST_RELATIVE_PATH, {
      relativePath: MANIFEST_RELATIVE_PATH,
      ownership: "managed-clean",
      disposition: "overwrite-managed-clean",
      reason: "The project manifest must be restored with filesystem state.",
    });
  }
  const folded = new Map<string, string>();
  for (const relativePath of byPath.keys()) {
    const key = relativePath.toLowerCase();
    const prior = folded.get(key);
    if (prior && prior !== relativePath) {
      throw new MigrationSafetyError(
        "cross-platform-mismatch",
        `Case-folding collision between ${prior} and ${relativePath}.`,
      );
    }
    folded.set(key, relativePath);
  }
  return [...byPath.values()]
    .sort((a, b) => compareCodeUnits(a.relativePath, b.relativePath))
    .map((item) => inspectPath(projectRoot, item));
}

function assertMigrationLockTokenActive(lock: ProjectMigrationLock): void {
  let stored: { token?: unknown };
  try {
    stored = JSON.parse(readFileSync(lock.lockPath, "utf8")) as { token?: unknown };
  } catch {
    throw new MigrationSafetyError("lock-lost", "The project migration lock is missing or unreadable.");
  }
  if (stored.token !== lock.token) {
    throw new MigrationSafetyError("lock-lost", "The project migration lock token changed.");
  }
}

function inspectPath(projectRoot: string, item: MigrationAffectedPath): MigrationPathSnapshot {
  const relativePath = assertProjectRelativePosix(item.relativePath);
  const absolutePath = path.join(projectRoot, ...relativePath.split("/"));
  let stats;
  try {
    stats = lstatSync(absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { ...item, relativePath, entryType: "missing" };
    }
    if ((error as NodeJS.ErrnoException).code === "EACCES") {
      throw new MigrationSafetyError("permission-denied", `Cannot inspect ${relativePath}.`);
    }
    throw error;
  }
  if (stats.isSymbolicLink()) {
    const target = readlinkSync(absolutePath);
    return {
      ...item,
      relativePath,
      entryType: "symlink",
      digest: digest(target),
      mode: stats.mode & 0o7777,
      size: stats.size,
      linkTarget: isExternalLink(projectRoot, absolutePath, target) ? "external" : "relative",
    };
  }
  if (stats.isFile()) {
    return {
      ...item,
      relativePath,
      entryType: "file",
      digest: digest(readFileSync(absolutePath)),
      mode: stats.mode & 0o7777,
      size: stats.size,
    };
  }
  if (stats.isDirectory()) {
    return {
      ...item,
      relativePath,
      entryType: "directory",
      digest: digestDirectory(absolutePath),
      mode: stats.mode & 0o7777,
      size: stats.size,
    };
  }
  return { ...item, relativePath, entryType: "other", mode: stats.mode & 0o7777, size: stats.size };
}

function validateDisposition(item: MigrationAffectedPath): void {
  if (item.disposition === "overwrite-managed-clean" && item.ownership !== "managed-clean") {
    throw new MigrationSafetyError(
      "ambiguous-ownership",
      `Only proven managed-clean content can be overwritten: ${item.relativePath}.`,
    );
  }
  if (item.disposition === "preserve-project-owned" && item.ownership !== "project-owned") {
    throw new MigrationSafetyError(
      "ambiguous-ownership",
      `Project-owned preservation requires project-owned classification: ${item.relativePath}.`,
    );
  }
  if (
    (item.ownership === "managed-modified" || item.ownership === "mixed" || item.ownership === "unknown") &&
    item.disposition !== "skip" &&
    item.disposition !== "stop"
  ) {
    throw new MigrationSafetyError(
      "ambiguous-ownership",
      `Uncertain ownership must skip or stop: ${item.relativePath}.`,
    );
  }
}

function assertProjectRelativePosix(value: string): string {
  if (
    value.length === 0 ||
    value.includes("\0") ||
    value.includes("\\") ||
    path.posix.isAbsolute(value) ||
    /^[A-Za-z]:/.test(value) ||
    value.startsWith("//")
  ) {
    throw new MigrationSafetyError("path-escape", `Unsafe project path: ${value}.`);
  }
  const normalized = path.posix.normalize(value);
  if (
    normalized !== value ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    normalized.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    throw new MigrationSafetyError("path-escape", `Unsafe project path: ${value}.`);
  }
  return normalized;
}

function readRepositoryIdentity(projectRoot: string): MigrationRepositoryIdentity {
  const manifestPath = path.join(projectRoot, MANIFEST_RELATIVE_PATH);
  let projectId: string | null = null;
  let manifestSchemaVersion: number | null = null;
  let manifestDigest: string | null = null;
  if (existsSync(manifestPath)) {
    const bytes = readFileSync(manifestPath);
    manifestDigest = digest(bytes);
    try {
      const manifest = JSON.parse(bytes.toString("utf8")) as Partial<InstallManifest>;
      projectId = typeof manifest.projectId === "string" ? manifest.projectId : null;
      manifestSchemaVersion =
        typeof manifest.schemaVersion === "number" ? manifest.schemaVersion : null;
    } catch {
      // The digest remains exact. Classification owns the malformed state.
    }
  }
  return {
    projectRootDigest: digest(realpathSync(projectRoot)),
    projectId,
    manifestSchemaVersion,
    manifestDigest,
  };
}

function ensureMigrationStateDirectory(projectRoot: string): void {
  assertManagedPathHasNoSymlinks(projectRoot, MIGRATION_STATE_RELATIVE_DIR);
  mkdirSync(path.join(projectRoot, MIGRATION_STATE_RELATIVE_DIR), { recursive: true, mode: 0o700 });
}

function assertNoActiveLegacyWriters(projectRoot: string): void {
  const writerDir = path.join(projectRoot, WRITER_DIR_RELATIVE_PATH);
  if (!existsSync(writerDir)) return;
  const active = readdirSync(writerDir).filter((name) => name.endsWith(".json"));
  if (active.length > 0) {
    throw new MigrationSafetyError(
      "active-writer",
      `Migration cannot start while legacy writers are active (${active.length}).`,
    );
  }
}

function bindQuiescenceToSnapshot(lock: ProjectMigrationLock, snapshotId: string): void {
  const barrier = readQuiescence(lock.projectRoot);
  if (barrier.lockTokenDigest !== digest(lock.token)) {
    throw new MigrationSafetyError("barrier-bypass", "The quiescence barrier belongs to another lock.");
  }
  writeQuiescence(lock.projectRoot, { ...barrier, snapshotId });
}

function assertBarrierBoundToSnapshot(lock: ProjectMigrationLock, snapshotId: string): void {
  const barrier = readQuiescence(lock.projectRoot);
  if (
    barrier.lockTokenDigest !== digest(lock.token) ||
    barrier.snapshotId !== snapshotId ||
    stableJson(barrier.legacyOperations) !== stableJson(LEGACY_COMPATIBILITY_OPERATION_IDS)
  ) {
    throw new MigrationSafetyError(
      "barrier-bypass",
      "The quiescence barrier changed or is not bound to the frozen snapshot.",
    );
  }
}

function writeQuiescence(projectRoot: string, record: QuiescenceRecord): void {
  writeJsonAtomic(path.join(projectRoot, QUIESCENCE_RELATIVE_PATH), record);
}

function readQuiescence(projectRoot: string): QuiescenceRecord {
  const barrierPath = path.join(projectRoot, QUIESCENCE_RELATIVE_PATH);
  try {
    const value = JSON.parse(readFileSync(barrierPath, "utf8")) as QuiescenceRecord;
    if (
      value.schemaVersion !== 1 ||
      value.status !== "active" ||
      !Array.isArray(value.legacyOperations)
    ) {
      throw new Error("invalid barrier");
    }
    return value;
  } catch {
    throw new MigrationSafetyError(
      "barrier-bypass",
      "The legacy quiescence barrier is missing, malformed, or unreadable.",
    );
  }
}

function assertLegacyOperationNotQuiesced(projectRoot: string, operationId: string): void {
  const lockPath = path.join(projectRoot, MIGRATION_LOCK_RELATIVE_PATH);
  const barrierPath = path.join(projectRoot, QUIESCENCE_RELATIVE_PATH);
  if (!existsSync(lockPath) && !existsSync(barrierPath)) return;
  if (existsSync(barrierPath)) {
    try {
      const barrier = readQuiescence(projectRoot);
      if (!barrier.legacyOperations.includes(operationId as LegacyCompatibilityOperationId)) {
        throw new MigrationSafetyError(
          "barrier-bypass",
          `Legacy operation ${operationId} is not covered by the active barrier.`,
        );
      }
    } catch (error) {
      if (error instanceof MigrationSafetyError && error.code === "barrier-bypass") throw error;
      throw new MigrationSafetyError("barrier-bypass", "The active barrier cannot be verified.");
    }
  }
  throw new MigrationSafetyError(
    "legacy-quiesced",
    `Legacy compatibility operation ${operationId} is quiesced for migration and cannot start or resume.`,
  );
}

function resolveProjectRoot(start: string): string {
  let current = path.resolve(start);
  while (true) {
    if (existsSync(path.join(current, MANIFEST_RELATIVE_PATH))) return current;
    const parent = path.dirname(current);
    if (parent === current) return path.resolve(start);
    current = parent;
  }
}

function backupEntryMatches(backupPath: string, original: MigrationPathSnapshot): boolean {
  try {
    const stats = lstatSync(backupPath);
    if (original.entryType === "symlink") {
      return stats.isSymbolicLink() && digest(readlinkSync(backupPath)) === original.digest;
    }
    return stats.isFile() && digest(readFileSync(backupPath)) === original.digest;
  } catch {
    return false;
  }
}

function isMutatingDisposition(disposition: MigrationPathDisposition): boolean {
  return disposition === "export-then-replace" || disposition === "overwrite-managed-clean";
}

function isExternalLink(projectRoot: string, linkPath: string, target: string): boolean {
  const resolved = path.resolve(path.dirname(linkPath), target);
  const relative = path.relative(projectRoot, resolved);
  return relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
}

function digestDirectory(directory: string): string {
  const entries = readdirSync(directory).sort(compareCodeUnits).map((name) => {
    const entry = path.join(directory, name);
    const stats = lstatSync(entry);
    if (stats.isSymbolicLink()) return [name, "symlink", digest(readlinkSync(entry))];
    if (stats.isDirectory()) return [name, "directory", digestDirectory(entry)];
    if (stats.isFile()) return [name, "file", digest(readFileSync(entry))];
    return [name, "other", stats.mode & 0o7777];
  });
  return digest(stableJson(entries));
}

function persistMigrationReceipt(
  lock: ProjectMigrationLock,
  snapshotId: string,
  status: MigrationReceiptStatus,
  code: MigrationSafetyCode | null,
  message: string,
  rollback: MigrationCheckpointReceipt["rollback"],
  checkpoint: number,
): MigrationCheckpointReceipt {
  const receipt = createMigrationReceipt(
    lock,
    snapshotId,
    status,
    code,
    message,
    rollback,
    checkpoint,
  );
  projectMigrationReceipt(lock, receipt);
  return receipt;
}

function createMigrationReceipt(
  lock: ProjectMigrationLock,
  snapshotId: string,
  status: MigrationReceiptStatus,
  code: MigrationSafetyCode | null,
  message: string,
  rollback: MigrationCheckpointReceipt["rollback"],
  checkpoint: number,
): MigrationCheckpointReceipt {
  const createdAt = new Date().toISOString();
  const subject = {
    status,
    checkpoint,
    snapshotId,
    lockTokenDigest: digest(lock.token),
    createdAt,
    code,
    message,
    rollback,
  };
  const receipt: MigrationCheckpointReceipt = {
    schemaVersion: 1,
    receiptId: `sha256:${digest(stableJson(subject))}`,
    ...subject,
    claims: {
      validated: false,
      accepted: false,
      downstreamAuthorized: false,
      released: false,
    },
  };
  return receipt;
}

function projectMigrationReceipt(
  lock: ProjectMigrationLock,
  receipt: MigrationCheckpointReceipt,
): void {
  const receiptDir = path.join(lock.projectRoot, RECEIPT_DIR_RELATIVE_PATH);
  mkdirSync(receiptDir, { recursive: true, mode: 0o700 });
  writeJsonAtomic(path.join(receiptDir, `${receipt.receiptId.slice(7)}.json`), receipt);
}

function sanitizeBackupId(value: string): string {
  const sanitized = value.replace(/[^A-Za-z0-9._-]/g, "-");
  if (!sanitized || sanitized === "." || sanitized === "..") {
    throw new MigrationSafetyError("path-escape", "The backup identifier is unsafe.");
  }
  return sanitized;
}

function writeJsonAtomic(filePath: string, value: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const tempPath = `${filePath}.${randomUUID()}.tmp`;
  const descriptor = openSync(tempPath, "wx", 0o600);
  try {
    writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`);
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
  renameSync(tempPath, filePath);
}

function stableJson(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => compareCodeUnits(left, right))
        .map(([key, entry]) => [key, sortJson(entry)]),
    );
  }
  return value;
}

function digest(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function emptyRollback(): MigrationCheckpointReceipt["rollback"] {
  return { attempted: false, completed: false, restoredPaths: [], unrestoredPaths: [] };
}
