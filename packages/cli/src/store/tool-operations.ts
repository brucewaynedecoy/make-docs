import { randomUUID } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { existsSync, lstatSync, openSync, writeFileSync, fsyncSync, closeSync, unlinkSync, readFileSync } from "node:fs";
import { GLOBAL_ASSET_LOCK_FILE } from "./global-asset-lock";
import { STORE_LEASE_RECOVERY_FILE } from "./lease-recovery";
import { loadSqliteDriver, getStoreDatabasePath, classifyStoreCheckpoint9State } from "../store";
import { validateInstallationStoreRoot, withInstallationDatabase } from "./installation-state";

export interface ToolOperationMetadata {
  manager: string;
  command: string;
  binaryPath: string;
}

/** Prepare required machine state without minting a project or checkout identity. */
export function prepareToolOperationStore(targetDir: string, storeRoot: string): void {
  withInstallationDatabase(targetDir, db => {
    db.prepare("SELECT operation_id FROM tool_operations LIMIT 1").get();
  }, { storeRoot });
}

/** Never retry a package manager implicitly. A crash leaves a durable pending operation. */
export async function runRecordedToolOperation<T extends { exitCode: number | null }>(
  targetDir: string,
  storeRoot: string,
  operation: "tool.update" | "tool.uninstall",
  metadata: ToolOperationMetadata,
  delegate: () => Promise<T>,
): Promise<{ operationId: string; result: T }> {
  const operationId = randomUUID();
  withInstallationDatabase(targetDir, db => {
    db.exec("BEGIN IMMEDIATE");
    try {
      const pending = db.prepare("SELECT operation_id, pid, hostname FROM tool_operations WHERE status='pending' LIMIT 1").get() as {operation_id:string;pid:number;hostname:string}|undefined;
      if (pending) throw new Error(`Tool operation ${pending.operation_id} is pending (${pending.hostname}, process ${pending.pid}). Inspect the package manager result before another tool change. No command was run.`);
      // A checkout reserves its SQL lock before taking its long-lived access
      // lease. Check both reservations in this same transaction so a tool
      // command cannot enter that handoff gap or bypass unfinished recovery.
      const installation = db.prepare("SELECT operation_id FROM installation_operations WHERE status='pending' LIMIT 1").get() as {operation_id:string}|undefined;
      const writer = db.prepare("SELECT root_path FROM installation_locks LIMIT 1").get() as {root_path:string}|undefined;
      if (installation || writer) throw new Error("An installation operation or checkout writer is pending. Resolve that work before a tool change. No command was run.");
      db.prepare("INSERT INTO tool_operations (operation_id,operation,status,pid,hostname,metadata_json,started_at,finished_at) VALUES (?,?,'pending',?,?,?,?,NULL)")
        .run(operationId, operation, process.pid, os.hostname(), JSON.stringify(metadata), new Date().toISOString());
      db.exec("COMMIT");
    } catch(error) { db.exec("ROLLBACK"); throw error; }
  }, {storeRoot});
  // Close the removal handshake before external mutation. A remover that
  // starts later must see this pending row; an earlier remover blocks here.
  withInstallationDatabase(targetDir, db => {
    const saved = db.prepare("SELECT status, operation, pid, hostname FROM tool_operations WHERE operation_id=?").get(operationId) as {status:string;operation:string;pid:number;hostname:string}|undefined;
    if (!saved || saved.status !== "pending" || saved.operation !== operation || saved.pid !== process.pid || saved.hostname !== os.hostname()) {
      throw new Error(`Tool intent read-back failed for ${operationId}; no package manager command was run.`);
    }
  }, {storeRoot,readOnly:true});
  if (existsSync(path.join(storeRoot,"removal.lock"))) throw new Error(`Store removal is active; tool operation ${operationId} remains pending and no package manager command was run.`);
  let result: T;
  try { result = await delegate(); }
  catch(error) {
    // A manager error is recorded, but never inferred to mean that it made no changes.
    withInstallationDatabase(targetDir, db => {
      db.prepare("UPDATE tool_operations SET status='failed', metadata_json=?, finished_at=? WHERE operation_id=? AND status='pending'")
        .run(JSON.stringify({...metadata, outcome:"delegate-threw", changeOutcome:"unknown"}),new Date().toISOString(),operationId);
    },{storeRoot});
    throw error;
  }
  // If this write fails, the pending row remains. Do not claim success or run again.
  withInstallationDatabase(targetDir, db => {
    db.prepare("UPDATE tool_operations SET status=?, metadata_json=?, finished_at=? WHERE operation_id=? AND status='pending'")
      .run(result.exitCode===0 ? "completed" : "failed",JSON.stringify({...metadata, exitCode:result.exitCode}),new Date().toISOString(),operationId);
  },{storeRoot});
  return {operationId,result};
}

/** Hold the removal marker across checks and deletion. All corrected writers honor it. */
export function withStoreRemovalLock<T>(targetDir: string, storeRoot: string, remove: () => T): T {
  prepareToolOperationStore(targetDir, storeRoot);
  const lockPath = path.join(storeRoot, "removal.lock");
  const token = randomUUID();
  const fd = openSync(lockPath, "wx", 0o600);
  try { writeFileSync(fd, token); fsyncSync(fd); } finally { closeSync(fd); }
  try {
    const assertNoStoreAccess = () => {
      if (["installation-bootstrap.lock", "store-access.lock", GLOBAL_ASSET_LOCK_FILE, STORE_LEASE_RECOVERY_FILE].some(name => lstatSync(path.join(storeRoot,name), { throwIfNoEntry: false }))) {
        throw new Error("A Store database or schema writer is active; the Store was preserved.");
      }
    };
    assertNoStoreAccess();
    const driver = loadSqliteDriver();
    if (!driver.available) throw new Error(driver.reason);
    const db = new driver.sqlite.DatabaseSync(getStoreDatabasePath(storeRoot), {readOnly:true});
    try {
      const tool = db.prepare("SELECT operation_id FROM tool_operations WHERE status='pending' LIMIT 1").get();
      const project = db.prepare("SELECT operation_id FROM installation_operations WHERE status='pending' LIMIT 1").get();
      const writer = db.prepare("SELECT root_path FROM installation_locks LIMIT 1").get();
      if (tool || project || writer) throw new Error("Store removal is blocked by a pending operation or active writer. Resolve that work first; the Store was preserved.");
    } finally { db.close(); }
    assertNoStoreAccess();
    return remove();
  } finally {
    if (existsSync(lockPath) && readFileSync(lockPath,"utf8") === token) unlinkSync(lockPath);
  }
}

export interface PendingToolOperation {
  id: string;
  operation: string;
  startedAt: string;
  status: "pending";
  nextAction: string;
}
/** Machine operations are shown separately; they never imply checkout ownership. */
export function listPendingToolOperations(projectRoot: string, storeRoot: string): PendingToolOperation[] {
  const store = validateInstallationStoreRoot(projectRoot, storeRoot);
  if (!existsSync(getStoreDatabasePath(store))) return [];
  if (classifyStoreCheckpoint9State(store).state === "supported-legacy") return [];
  return withInstallationDatabase(projectRoot, db => {
    const rows = db.prepare("SELECT operation_id,operation,started_at FROM tool_operations WHERE status='pending' ORDER BY started_at,operation_id LIMIT 10").all() as {operation_id:string;operation:string;started_at:string}[];
    return rows.map(row => ({
      id: row.operation_id,
      operation: row.operation,
      startedAt: row.started_at,
      status: "pending" as const,
      nextAction: "Inspect the installed CLI version and the package manager outcome. Review that evidence before reconciling this operation. Do not replay the package manager command automatically.",
    }));
  }, {storeRoot:store,readOnly:true});
}
