import { createHash, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { platform } from "../platform";
import type {
  HarnessAccessPlan,
  HarnessAccessReceipt,
  HarnessConnectionMethod,
  HarnessId,
  HarnessNativeChange,
  NativeEntryValue,
} from "../harness-access";
import { fingerprintEntry } from "../harness-access";
import { classifyStoreCheckpoint9State, type StoreDatabase } from "./database";
import { readCurrentHarnessIntegrationReceipt } from "./harness-integration-receipts";
import { getStoreDatabasePath } from "./paths";
import {
  canonicalInstallationPath,
  validateInstallationStoreRoot,
  withInstallationDatabase,
} from "./installation-state";

const OPERATION = "setup.system.harness";

export interface PrepareHarnessSystemOperationInput {
  targetRoot: string;
  storeRoot: string;
  adapterId: string;
  harnessId: HarnessId;
  plan: HarnessAccessPlan;
  appliedVersion: string;
  verifiedAt: string;
}

export interface PendingHarnessSystemOperation {
  schemaVersion: 1;
  kind: typeof OPERATION;
  operationId: string;
  adapterId: string;
  harnessId: HarnessId;
  connectionMethod: HarnessConnectionMethod;
  targetRoot: string;
  plan: HarnessAccessPlan;
  planFingerprint: string;
  appliedVersion: string;
  verifiedAt: string;
  ownershipReceipt: HarnessAccessReceipt | null;
}

export interface HarnessSystemOperationFailure {
  reason: string;
  changeOutcome: "none" | "unknown";
}

/** Save and read back an exact reviewed machine plan before any native write. */
export function prepareHarnessSystemOperation(
  input: PrepareHarnessSystemOperationInput,
): PendingHarnessSystemOperation {
  const targetRoot = canonicalInstallationPath(input.targetRoot);
  const storeRoot = validateInstallationStoreRoot(targetRoot, input.storeRoot);
  const ownershipReceipt = input.plan.state === "drifted"
    ? readCurrentHarnessIntegrationReceipt(
        targetRoot,
        storeRoot,
        "machine",
        input.harnessId,
        input.plan.connectionMethod,
      )
    : null;
  assertReviewedPlan(input.plan, input.adapterId, input.harnessId, ownershipReceipt);
  if (!input.appliedVersion.trim()) throw new Error("Machine setup needs an applied version.");
  if (!Number.isFinite(Date.parse(input.verifiedAt))) {
    throw new Error("Machine setup needs a valid verification time.");
  }
  const pending: PendingHarnessSystemOperation = {
    schemaVersion: 1,
    kind: OPERATION,
    operationId: randomUUID(),
    adapterId: input.adapterId,
    harnessId: input.harnessId,
    connectionMethod: input.plan.connectionMethod,
    targetRoot,
    plan: input.plan,
    planFingerprint: fingerprintJson(input.plan),
    appliedVersion: input.appliedVersion,
    verifiedAt: input.verifiedAt,
    ownershipReceipt,
  };
  const savedJson = JSON.stringify(pending);
  withInstallationDatabase(targetRoot, (db) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      assertNoOtherStoreWork(db);
      db.prepare(
        "INSERT INTO tool_operations (operation_id,operation,status,pid,hostname,metadata_json,started_at,finished_at) VALUES (?,?,'pending',?,?,?,?,NULL)",
      ).run(
        pending.operationId,
        OPERATION,
        process.pid,
        platform.hostname,
        savedJson,
        pending.verifiedAt,
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }, { storeRoot });
  const saved = readPendingHarnessSystemOperation(targetRoot, storeRoot, pending.operationId);
  if (!saved || JSON.stringify(saved) !== savedJson) {
    throw new Error(
      `Machine setup intent ${pending.operationId} did not pass Store readback. No native file was changed.`,
    );
  }
  return saved;
}

/** Read one exact pending machine plan for deterministic verify or resume. */
export function readPendingHarnessSystemOperation(
  targetRootInput: string,
  storeRootInput: string,
  operationId?: string,
): PendingHarnessSystemOperation | null {
  const targetRoot = canonicalInstallationPath(targetRootInput);
  const storeRoot = validateInstallationStoreRoot(targetRoot, storeRootInput);
  if (!existsSync(getStoreDatabasePath(storeRoot))) return null;
  // Schema versions 1 and 2 predate tool_operations. A read must not upgrade
  // them or assume the table exists. The reviewed prepare path performs the
  // normal checkpoint upgrade before any native harness write.
  if (classifyStoreCheckpoint9State(storeRoot).state === "supported-legacy") return null;
  return withInstallationDatabase(targetRoot, (db) => {
    const row = operationId
      ? db.prepare(
          "SELECT operation_id,metadata_json FROM tool_operations WHERE operation_id=? AND operation=? AND status='pending'",
        ).get(operationId, OPERATION) as StoredPendingRow | undefined
      : db.prepare(
          "SELECT operation_id,metadata_json FROM tool_operations WHERE operation=? AND status='pending' ORDER BY started_at,operation_id LIMIT 1",
        ).get(OPERATION) as StoredPendingRow | undefined;
    if (!row) return null;
    let value: unknown;
    try {
      value = JSON.parse(row.metadata_json);
    } catch {
      throw invalidPending(row.operation_id);
    }
    const pending = validatePending(value, row.operation_id, targetRoot);
    assertDurableOwnershipReceipt(db, pending);
    return pending;
  }, { storeRoot, readOnly: true });
}

/** Complete only the unchanged plan after its exact verified receipt is in Store. */
export function completeHarnessSystemOperation(
  targetRootInput: string,
  storeRootInput: string,
  pending: PendingHarnessSystemOperation,
  receipt: HarnessAccessReceipt,
): void {
  const targetRoot = canonicalInstallationPath(targetRootInput);
  const storeRoot = validateInstallationStoreRoot(targetRoot, storeRootInput);
  const exact = validatePending(pending, pending.operationId, targetRoot);
  assertReceiptMatchesPlan(receipt, exact);
  const pendingJson = JSON.stringify(exact);
  withInstallationDatabase(targetRoot, (db) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      assertNoOtherStoreWork(db, exact.operationId);
      const storedReceipt = db.prepare(
        "SELECT metadata_json FROM tool_operations WHERE operation_id=? AND operation='setup.system.receipt' AND status='completed'",
      ).get(`harness-receipt:${exact.operationId}`) as { metadata_json: string } | undefined;
      if (!storedReceipt || storedReceipt.metadata_json !== JSON.stringify(receipt)) {
        throw new Error(
          `Machine setup ${exact.operationId} has no exact verified Store receipt. Keep it pending for recovery.`,
        );
      }
      const result = db.prepare(
        "UPDATE tool_operations SET status='completed',metadata_json=?,finished_at=? WHERE operation_id=? AND operation=? AND status='pending' AND metadata_json=?",
      ).run(
        JSON.stringify({ ...exact, receiptOperationId: receipt.operationId }),
        receipt.verifiedAt,
        exact.operationId,
        OPERATION,
        pendingJson,
      );
      if (result.changes !== 1) throw changedPending(exact.operationId);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }, { storeRoot });
}

/** Mark a reviewed operation failed only when the caller knows its change outcome. */
export function failHarnessSystemOperation(
  targetRootInput: string,
  storeRootInput: string,
  pending: PendingHarnessSystemOperation,
  failure: HarnessSystemOperationFailure,
): void {
  if (
    !failure.reason.trim() ||
    (failure.changeOutcome !== "none" && failure.changeOutcome !== "unknown")
  ) {
    throw new Error("Machine setup failure needs a reason and a known change outcome.");
  }
  const targetRoot = canonicalInstallationPath(targetRootInput);
  const storeRoot = validateInstallationStoreRoot(targetRoot, storeRootInput);
  const exact = validatePending(pending, pending.operationId, targetRoot);
  const pendingJson = JSON.stringify(exact);
  withInstallationDatabase(targetRoot, (db) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      assertNoOtherStoreWork(db, exact.operationId);
      const finishedAt = new Date().toISOString();
      const result = db.prepare(
        "UPDATE tool_operations SET status='failed',metadata_json=?,finished_at=? WHERE operation_id=? AND operation=? AND status='pending' AND metadata_json=?",
      ).run(
        JSON.stringify({ ...exact, failure: { ...failure, failedAt: finishedAt } }),
        finishedAt,
        exact.operationId,
        OPERATION,
        pendingJson,
      );
      if (result.changes !== 1) throw changedPending(exact.operationId);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }, { storeRoot });
}

interface StoredPendingRow {
  operation_id: string;
  metadata_json: string;
}

function validatePending(
  value: unknown,
  rowOperationId: string,
  expectedTargetRoot: string,
): PendingHarnessSystemOperation {
  if (!value || typeof value !== "object") throw invalidPending(rowOperationId);
  const pending = value as Partial<PendingHarnessSystemOperation>;
  if (
    pending.schemaVersion !== 1 ||
    pending.kind !== OPERATION ||
    pending.operationId !== rowOperationId ||
    typeof pending.adapterId !== "string" ||
    (pending.harnessId !== "codex" && pending.harnessId !== "claude-code") ||
    typeof pending.targetRoot !== "string" ||
    canonicalInstallationPath(pending.targetRoot) !== expectedTargetRoot ||
    !pending.plan ||
    typeof pending.plan !== "object" ||
    typeof pending.planFingerprint !== "string" ||
    typeof pending.appliedVersion !== "string" ||
    !pending.appliedVersion.trim() ||
    typeof pending.verifiedAt !== "string" ||
    !Number.isFinite(Date.parse(pending.verifiedAt))
  ) {
    throw invalidPending(rowOperationId);
  }
  if (pending.ownershipReceipt !== null && typeof pending.ownershipReceipt !== "object") {
    throw invalidPending(rowOperationId);
  }
  assertReviewedPlan(
    pending.plan,
    pending.adapterId,
    pending.harnessId,
    pending.ownershipReceipt ?? null,
  );
  if (
    pending.connectionMethod !== pending.plan.connectionMethod ||
    pending.planFingerprint !== fingerprintJson(pending.plan)
  ) {
    throw invalidPending(rowOperationId);
  }
  return pending as PendingHarnessSystemOperation;
}

function assertReviewedPlan(
  plan: HarnessAccessPlan,
  adapterId: string,
  harnessId: HarnessId,
  ownershipReceipt: HarnessAccessReceipt | null,
): void {
  if (
    plan.schemaVersion !== 1 ||
    plan.kind !== "apply" ||
    plan.adapterId !== adapterId ||
    plan.harnessId !== harnessId ||
    plan.scope !== "machine" ||
    !path.isAbsolute(plan.root) ||
    path.normalize(plan.root) !== plan.root ||
    !/^[0-9a-f]{64}$/.test(plan.reviewFingerprint) ||
    plan.state === "blocked" ||
    plan.state === "unsupported" ||
    !Array.isArray(plan.changes) ||
    plan.changes.length === 0
  ) {
    throw new Error("Machine setup needs one exact reviewed machine harness plan.");
  }
  for (const change of plan.changes) assertReviewedChange(plan.root, change);
  if (plan.state === "drifted") {
    assertReceiptOwnedDrift(plan, ownershipReceipt);
  } else if (ownershipReceipt !== null) {
    throw new Error("Only a reviewed drift repair can carry an ownership receipt.");
  }
}

function assertReceiptOwnedDrift(
  plan: HarnessAccessPlan,
  receipt: HarnessAccessReceipt | null,
): void {
  if (
    !receipt ||
    receipt.schemaVersion !== 1 ||
    receipt.adapterId !== plan.adapterId ||
    receipt.adapterVersion !== plan.adapterVersion ||
    receipt.harnessId !== plan.harnessId ||
    receipt.connectionMethod !== plan.connectionMethod ||
    receipt.scope !== "machine" ||
    receipt.result !== "verified" ||
    receipt.verificationResult !== "passed" ||
    receipt.driftState !== "current" ||
    receipt.recoveryStatus !== "complete" ||
    receipt.entries.length !== plan.changes.length
  ) {
    throw new Error("A drift repair needs the exact current Make Docs ownership receipt.");
  }
  for (let index = 0; index < plan.changes.length; index++) {
    const change = plan.changes[index];
    const entry = receipt.entries[index];
    if (
      change.action !== "update" ||
      change.ownership !== "make-docs-owned" ||
      change.blockedReason ||
      entry.ownership !== "make-docs" ||
      entry.path !== change.path ||
      entry.entryId !== change.entryId ||
      entry.entryFingerprint !== change.beforeEntryFingerprint ||
      JSON.stringify(entry.value) !== JSON.stringify(change.beforeEntryValue) ||
      fingerprintEntry(entry.value) !== entry.entryFingerprint
    ) {
      throw new Error(
        `Drift repair target ${change.path} is not the exact receipt-owned native entry.`,
      );
    }
  }
}

function assertDurableOwnershipReceipt(
  db: StoreDatabase,
  pending: PendingHarnessSystemOperation,
): void {
  const receipt = pending.ownershipReceipt;
  if (!receipt) return;
  const row = db.prepare(
    "SELECT metadata_json FROM tool_operations WHERE operation_id=? AND operation='setup.system.receipt' AND status='completed'",
  ).get(`harness-receipt:${receipt.operationId}`) as { metadata_json: string } | undefined;
  if (!row || row.metadata_json !== JSON.stringify(receipt)) {
    throw new Error(
      `Pending machine setup ${pending.operationId} lost its exact ownership receipt. Preserve it for manual recovery.`,
    );
  }
}

function assertReviewedChange(root: string, change: HarnessNativeChange): void {
  const resolved = path.resolve(root, change.path);
  if (
    !change.path ||
    path.isAbsolute(change.path) ||
    (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) ||
    !new Set(["create", "update", "remove", "none"]).has(change.action) ||
    !new Set(["missing", "make-docs-owned", "unverified"]).has(change.ownership) ||
    change.blockedReason ||
    !isFingerprint(change.beforeFileFingerprint, true) ||
    !isFingerprint(change.afterFileFingerprint, false) ||
    !entryMatches(change.beforeEntryValue, change.beforeEntryFingerprint) ||
    change.afterEntryValue === null ||
    !entryMatches(change.afterEntryValue, change.afterEntryFingerprint)
  ) {
    throw new Error(`Machine setup has an unsafe or incomplete reviewed change: ${change.path}.`);
  }
}

function assertReceiptMatchesPlan(
  receipt: HarnessAccessReceipt,
  pending: PendingHarnessSystemOperation,
): void {
  const plan = pending.plan;
  if (
    receipt.schemaVersion !== 1 ||
    receipt.operationId !== pending.operationId ||
    receipt.adapterId !== pending.adapterId ||
    receipt.adapterVersion !== plan.adapterVersion ||
    receipt.harnessId !== pending.harnessId ||
    receipt.connectionMethod !== pending.connectionMethod ||
    receipt.scope !== "machine" ||
    receipt.appliedVersion !== pending.appliedVersion ||
    receipt.verifiedAt !== pending.verifiedAt ||
    receipt.result !== "verified" ||
    receipt.verificationResult !== "passed" ||
    receipt.driftState !== "current" ||
    receipt.recoveryStatus !== "complete" ||
    JSON.stringify(receipt.executable) !== JSON.stringify(plan.executable) ||
    receipt.entries.length !== plan.changes.length
  ) {
    throw new Error(`Machine setup receipt does not match pending plan ${pending.operationId}.`);
  }
  for (let index = 0; index < plan.changes.length; index++) {
    const change = plan.changes[index];
    const entry = receipt.entries[index];
    if (
      entry.path !== change.path ||
      entry.entryId !== change.entryId ||
      entry.ownership !== "make-docs" ||
      entry.beforeEntryFingerprint !== change.beforeEntryFingerprint ||
      entry.beforeFileFingerprint !== change.beforeFileFingerprint ||
      JSON.stringify(entry.beforeValue) !== JSON.stringify(change.beforeEntryValue) ||
      entry.entryFingerprint !== change.afterEntryFingerprint ||
      entry.fileFingerprint !== change.afterFileFingerprint ||
      JSON.stringify(entry.value) !== JSON.stringify(change.afterEntryValue) ||
      fingerprintEntry(entry.value) !== entry.entryFingerprint
    ) {
      throw new Error(`Machine setup receipt changed reviewed target ${change.path}.`);
    }
  }
}

function assertNoOtherStoreWork(db: StoreDatabase, ownOperationId?: string): void {
  const tool = db.prepare(
    `SELECT operation_id FROM tool_operations WHERE status='pending'${ownOperationId ? " AND operation_id<>?" : ""} LIMIT 1`,
  ).get(...(ownOperationId ? [ownOperationId] : [])) as { operation_id: string } | undefined;
  const project = db.prepare(
    "SELECT operation_id FROM installation_operations WHERE status='pending' LIMIT 1",
  ).get() as { operation_id: string } | undefined;
  const writer = db.prepare("SELECT root_path FROM installation_locks LIMIT 1").get() as
    | { root_path: string }
    | undefined;
  if (tool || project || writer) {
    throw new Error(
      `A Store operation is already pending (${tool?.operation_id ?? project?.operation_id ?? writer?.root_path}). Resolve it before machine setup. No native file was changed.`,
    );
  }
}

function entryMatches(
  value: NativeEntryValue | null,
  fingerprint: string | null,
): boolean {
  return value === null ? fingerprint === null : fingerprint === fingerprintEntry(value);
}

function isFingerprint(value: string | null, allowNull: boolean): boolean {
  return (allowNull && value === null) || (typeof value === "string" && /^[0-9a-f]{64}$/.test(value));
}

function fingerprintJson(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function invalidPending(operationId: string): Error {
  return new Error(
    `Pending machine setup ${operationId} has invalid Store evidence. Preserve it for manual recovery.`,
  );
}

function changedPending(operationId: string): Error {
  return new Error(
    `Pending machine setup ${operationId} changed before completion. Preserve it for Store recovery.`,
  );
}
