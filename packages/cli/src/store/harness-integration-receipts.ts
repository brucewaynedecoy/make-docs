import path from "node:path";
import { platform } from "../platform";
import {
  fingerprintEntry,
  getFirstPartyHarnessAdapter,
  sha256,
  type HarnessAccessReceipt,
  type HarnessAccessState,
  type HarnessConnectionMethod,
  type HarnessId,
  type HarnessReceiptEntry,
  type NativeEntryValue,
} from "../harness-access";
import { listMigrationState, readMigrationState, recordMigrationState, withInstallationDatabase } from "./installation-state";

export interface StoredHarnessIntegrationReceipt extends Omit<
  HarnessAccessReceipt,
  "result" | "verificationResult" | "driftState" | "recoveryStatus"
> {
  result: "verified" | "failed" | "partial";
  verificationResult: "passed" | "failed" | "blocked";
  driftState: HarnessAccessState;
  recoveryStatus: "complete" | "incomplete" | "recovery-required";
}

/** Save an adapter's verified receipt in existing Store records. */
export function recordHarnessIntegrationReceipt(
  targetRoot: string,
  storeRoot: string,
  receipt: HarnessAccessReceipt,
): void {
  assertHarnessIntegrationReceipt(receipt);
  const currentId = currentReceiptRecordId(
    receipt.scope,
    receipt.harnessId,
    receipt.connectionMethod,
  );
  if (receipt.scope === "project") {
    recordMigrationState(targetRoot, "receipt", receipt.operationId, receipt, storeRoot);
    recordMigrationState(targetRoot, "receipt", currentId, receipt, storeRoot);
    return;
  }
  const recordId = machineReceiptRecordId(receipt.operationId);
  withInstallationDatabase(targetRoot, (db) => {
    const write = db.prepare(
      "INSERT INTO tool_operations (operation_id,operation,status,pid,hostname,metadata_json,started_at,finished_at) VALUES (?,?,'completed',?,?,?,?,?) ON CONFLICT(operation_id) DO UPDATE SET status='completed',metadata_json=excluded.metadata_json,finished_at=excluded.finished_at",
    );
    write.run(recordId, "setup.system.receipt", process.pid, platform.hostname, JSON.stringify(receipt), receipt.verifiedAt, receipt.verifiedAt);
    write.run(currentId, "setup.system.receipt-current", process.pid, platform.hostname, JSON.stringify(receipt), receipt.verifiedAt, receipt.verifiedAt);
  }, { storeRoot });
}

/** Retain a later drift or recovery observation without changing current ownership. */
export function recordHarnessIntegrationReceiptObservation(
  targetRoot: string,
  storeRoot: string,
  receipt: StoredHarnessIntegrationReceipt,
): void {
  if (!isStoredHarnessIntegrationReceipt(receipt)) {
    throw new Error("Harness receipt observation is malformed or lacks exact ownership evidence.");
  }
  const observationId = `harness-receipt-observation:${sha256(JSON.stringify({
    operationId: receipt.operationId,
    verifiedAt: receipt.verifiedAt,
    driftState: receipt.driftState,
    recoveryStatus: receipt.recoveryStatus,
  })).slice(0, 32)}`;
  if (receipt.scope === "project") {
    recordMigrationState(targetRoot, "receipt", observationId, receipt, storeRoot);
    return;
  }
  withInstallationDatabase(targetRoot, (db) => {
    db.prepare(
      "INSERT INTO tool_operations (operation_id,operation,status,pid,hostname,metadata_json,started_at,finished_at) VALUES (?,?,'completed',?,?,?,?,?) ON CONFLICT(operation_id) DO UPDATE SET status='completed',metadata_json=excluded.metadata_json,finished_at=excluded.finished_at",
    ).run(observationId, "setup.system.receipt-observation", process.pid, platform.hostname, JSON.stringify(receipt), receipt.verifiedAt, receipt.verifiedAt);
  }, { storeRoot });
}

export function readHarnessIntegrationReceipt(
  targetRoot: string,
  storeRoot: string,
  scope: "machine" | "project",
  operationId: string,
): HarnessAccessReceipt | null {
  if (scope === "project") {
    const receipt = readMigrationState<unknown>(targetRoot, "receipt", operationId, storeRoot);
    return isHarnessIntegrationReceipt(receipt) ? receipt : null;
  }
  return withInstallationDatabase(targetRoot, (db) => {
    const row = db.prepare(
      "SELECT metadata_json FROM tool_operations WHERE operation_id=? AND operation='setup.system.receipt' AND status='completed'",
    ).get(machineReceiptRecordId(operationId)) as { metadata_json: string } | undefined;
    if (!row) return null;
    const value = parseJson(row.metadata_json);
    return isHarnessIntegrationReceipt(value) ? value : null;
  }, { storeRoot, readOnly: true });
}

/** Read the latest exact receipt without knowing its prior operation ID. */
export function readCurrentHarnessIntegrationReceipt(
  targetRoot: string,
  storeRoot: string,
  scope: "machine" | "project",
  harnessId: HarnessId,
  connectionMethod: HarnessConnectionMethod,
): HarnessAccessReceipt | null {
  const currentId = currentReceiptRecordId(scope, harnessId, connectionMethod);
  if (scope === "project") {
    const current = readMigrationState<unknown>(targetRoot, "receipt", currentId, storeRoot);
    if (isHarnessIntegrationReceipt(current)) return current;
    return latestReceipt(
      listProjectHarnessIntegrationReceipts(targetRoot, storeRoot)
        .filter((receipt) => receipt.harnessId === harnessId && receipt.connectionMethod === connectionMethod),
    );
  }
  return withInstallationDatabase(targetRoot, (db) => {
    const current = db.prepare(
      "SELECT metadata_json FROM tool_operations WHERE operation_id=? AND operation='setup.system.receipt-current' AND status='completed'",
    ).get(currentId) as { metadata_json: string } | undefined;
    const currentValue = current ? parseJson(current.metadata_json) : null;
    if (isHarnessIntegrationReceipt(currentValue)) return currentValue;
    const rows = db.prepare(
      "SELECT metadata_json FROM tool_operations WHERE operation='setup.system.receipt' AND status='completed' ORDER BY finished_at DESC",
    ).all() as Array<{ metadata_json: string }>;
    return latestReceipt(rows
      .map((row) => parseJson(row.metadata_json))
      .filter(isHarnessIntegrationReceipt)
      .filter((receipt) => receipt.scope === "machine" && receipt.harnessId === harnessId && receipt.connectionMethod === connectionMethod));
  }, { storeRoot, readOnly: true });
}

function machineReceiptRecordId(operationId: string): string {
  return `harness-receipt:${operationId}`;
}

function currentReceiptRecordId(
  scope: "machine" | "project",
  harnessId: HarnessId,
  connectionMethod: HarnessConnectionMethod,
): string {
  return `harness-receipt-current:${scope}:${harnessId}:${connectionMethod}`;
}

export function listProjectHarnessIntegrationReceipts(
  targetRoot: string,
  storeRoot: string,
): HarnessAccessReceipt[] {
  return uniqueReceipts(listMigrationState<unknown>(targetRoot, "receipt", storeRoot)
    .filter(isHarnessIntegrationReceipt)
    .filter((receipt) => receipt.scope === "project"));
}

/** List applied receipt history without replacing older valid evidence. */
export function listHarnessIntegrationReceiptHistory(
  targetRoot: string,
  storeRoot: string,
  scope: "machine" | "project",
): StoredHarnessIntegrationReceipt[] {
  if (scope === "project") {
    return uniqueStoredReceipts(listMigrationState<unknown>(targetRoot, "receipt", storeRoot)
      .filter(isStoredHarnessIntegrationReceipt)
      .filter((receipt) => receipt.scope === "project"))
      .sort(compareStoredReceiptNewestFirst);
  }
  return withInstallationDatabase(targetRoot, (db) => {
    const rows = db.prepare(
      "SELECT metadata_json FROM tool_operations WHERE operation IN ('setup.system.receipt','setup.system.receipt-observation') AND status='completed' ORDER BY finished_at DESC",
    ).all() as Array<{ metadata_json: string }>;
    return uniqueStoredReceipts(rows
      .map((row) => parseJson(row.metadata_json))
      .filter(isStoredHarnessIntegrationReceipt)
      .filter((receipt) => receipt.scope === "machine"));
  }, { storeRoot, readOnly: true });
}

export function assertHarnessIntegrationReceipt(value: unknown): asserts value is HarnessAccessReceipt {
  if (!isHarnessIntegrationReceipt(value)) {
    throw new Error("Harness access receipt is malformed or lacks exact ownership evidence.");
  }
}

export function isHarnessIntegrationReceipt(value: unknown): value is HarnessAccessReceipt {
  if (!isStoredHarnessIntegrationReceipt(value)) return false;
  const adapter = typeof value.harnessId === "string" ? getFirstPartyHarnessAdapter(value.harnessId) : undefined;
  return adapter !== undefined &&
    value.adapterVersion === adapter.version &&
    adapter.methods.some(method => method.id === value.connectionMethod) &&
    value.result === "verified" &&
    value.verificationResult === "passed" &&
    value.driftState === "current" &&
    value.recoveryStatus === "complete";
}

export function isStoredHarnessIntegrationReceipt(
  value: unknown,
): value is StoredHarnessIntegrationReceipt {
  if (!isRecord(value)) return false;
  const adapter = typeof value.harnessId === "string" ? getFirstPartyHarnessAdapter(value.harnessId) : undefined;
  return value.schemaVersion === 1 &&
    isSafeId(value.operationId) &&
    adapter !== undefined &&
    value.adapterId === adapter.id &&
    Number.isSafeInteger(value.adapterVersion) &&
    Number(value.adapterVersion) > 0 &&
    (value.connectionMethod === "mcp" || value.connectionMethod === "command-rules" || value.connectionMethod === "permission-rules") &&
    (value.scope === "machine" || value.scope === "project") &&
    isExecutable(value.executable) &&
    isSafeId(value.appliedVersion) &&
    isTimestamp(value.verifiedAt) &&
    Array.isArray(value.entries) &&
    value.entries.length > 0 &&
    value.entries.every(isReceiptEntry) &&
    (value.result === "verified" || value.result === "failed" || value.result === "partial") &&
    (value.verificationResult === "passed" || value.verificationResult === "failed" || value.verificationResult === "blocked") &&
    (value.driftState === "current" || value.driftState === "missing" || value.driftState === "drifted" || value.driftState === "unsupported" || value.driftState === "blocked") &&
    (value.recoveryStatus === "complete" || value.recoveryStatus === "incomplete" || value.recoveryStatus === "recovery-required");
}

function isExecutable(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (
    value.kind !== "make-docs" ||
    value.productMarker !== "@brucewaynedecoy/make-docs:package-bin" ||
    value.packageName !== "@brucewaynedecoy/make-docs" ||
    !isSafeId(value.packageVersion) ||
    !path.isAbsolute(String(value.path)) ||
    !path.isAbsolute(String(value.packageRoot)) ||
    !isSafeRelativePath(value.binRelativePath) ||
    !isSha256(value.sha256) ||
    !Number.isSafeInteger(value.size) ||
    Number(value.size) < 1
  ) return false;
  return platform.samePath(
    String(value.path),
    path.resolve(String(value.packageRoot), String(value.binRelativePath)),
  );
}

function isReceiptEntry(value: unknown): value is HarnessReceiptEntry {
  return isRecord(value) && isSafeNativePath(value.path) && isSafeId(value.entryId) &&
    value.ownership === "make-docs" && isNullableSha256(value.beforeEntryFingerprint) &&
    isNullableSha256(value.beforeFileFingerprint) && isNativeValueOrNull(value.beforeValue) &&
    isSha256(value.entryFingerprint) && isSha256(value.fileFingerprint) && isNativeValue(value.value) &&
    value.entryFingerprint === fingerprintEntry(value.value) &&
    (value.beforeValue === null
      ? value.beforeEntryFingerprint === null
      : value.beforeEntryFingerprint === fingerprintEntry(value.beforeValue));
}

function isSafeNativePath(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || /[\r\n\0]/.test(value)) return false;
  if (value.includes("\\") || path.posix.isAbsolute(value) || /^[A-Za-z]:/.test(value)) return false;
  const normalized = path.posix.normalize(value);
  return normalized !== "." && normalized === value && normalized !== ".." && !normalized.startsWith("../");
}

function isSafeRelativePath(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || /[\r\n\0]/.test(value)) return false;
  if (value.includes("\\") || path.posix.isAbsolute(value) || /^[A-Za-z]:/.test(value)) return false;
  const normalized = path.posix.normalize(value);
  return normalized !== "." && normalized === value && normalized !== ".." && !normalized.startsWith("../");
}

function isNativeValueOrNull(value: unknown): value is NativeEntryValue | null {
  return value === null || isNativeValue(value);
}

function isNativeValue(value: unknown): value is NativeEntryValue {
  if (value === null || typeof value === "boolean" || typeof value === "string") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isNativeValue);
  return isRecord(value) && Object.values(value).every(isNativeValue);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 256 && !/[\r\n\0]/.test(value);
}

function isNullableSha256(value: unknown): boolean {
  return value === null || isSha256(value);
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function latestReceipt(receipts: HarnessAccessReceipt[]): HarnessAccessReceipt | null {
  return receipts.sort(compareReceiptNewestFirst)[0] ?? null;
}

function compareReceiptNewestFirst(left: HarnessAccessReceipt, right: HarnessAccessReceipt): number {
  return Date.parse(right.verifiedAt) - Date.parse(left.verifiedAt);
}

function compareStoredReceiptNewestFirst(
  left: StoredHarnessIntegrationReceipt,
  right: StoredHarnessIntegrationReceipt,
): number {
  return Date.parse(right.verifiedAt) - Date.parse(left.verifiedAt);
}

function uniqueReceipts(receipts: HarnessAccessReceipt[]): HarnessAccessReceipt[] {
  const byOperation = new Map<string, HarnessAccessReceipt>();
  for (const receipt of receipts) {
    const existing = byOperation.get(receipt.operationId);
    if (!existing || Date.parse(receipt.verifiedAt) > Date.parse(existing.verifiedAt)) {
      byOperation.set(receipt.operationId, receipt);
    }
  }
  return [...byOperation.values()];
}

function uniqueStoredReceipts(
  receipts: StoredHarnessIntegrationReceipt[],
): StoredHarnessIntegrationReceipt[] {
  const unique = new Map<string, StoredHarnessIntegrationReceipt>();
  for (const receipt of receipts) {
    const key = [
      receipt.operationId,
      receipt.verifiedAt,
      receipt.driftState,
      receipt.recoveryStatus,
    ].join("\0");
    unique.set(key, receipt);
  }
  return [...unique.values()];
}
