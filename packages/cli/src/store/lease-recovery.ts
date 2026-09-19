import { randomUUID } from "node:crypto";
import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync, unlinkSync, type Stats } from "node:fs";
import path from "node:path";
import { recoverDeadStoreAccessSessions, tryCreateExclusiveStoreLease } from "./database";
import { platform } from "../platform";

/** Writers and Store removal must check this marker before and after acquisition. */
export const STORE_LEASE_RECOVERY_FILE = "installation-lease-recovery.lock";
const RECOVERABLE_LEASES = ["installation-bootstrap.lock", "global-assets.lock"] as const;

export class StoreLeaseRecoveryError extends Error {
  readonly code = "writer-active";
  constructor(message: string) { super(message); this.name = "StoreLeaseRecoveryError"; }
}

interface LeaseSnapshot {
  file: string;
  bytes: Buffer;
  stat: Stats;
  token: string;
  pid: number;
  hostname: string;
}

function blocked(message: string): never {
  throw new StoreLeaseRecoveryError(`${message} The Store leases and pending operation must be preserved.`);
}

function sameFile(left: Stats, right: Stats): boolean {
  return platform.sameFileObject(left, right, "file");
}

function readLease(file: string): LeaseSnapshot | null {
  const initial = lstatSync(file, { throwIfNoEntry: false });
  if (!initial) return null;
  if (!initial.isFile() || initial.isSymbolicLink() || initial.size > 16_384) blocked(`Unsafe lease file: ${path.basename(file)}.`);
  const fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = fstatSync(fd);
    if (!sameFile(initial, stat)) blocked(`Lease changed during inspection: ${path.basename(file)}.`);
    const bytes = readFileSync(fd);
    let record: Record<string, unknown>;
    try { record = JSON.parse(bytes.toString("utf8")); } catch { return blocked(`Unreadable lease owner: ${path.basename(file)}.`); }
    if (!record || typeof record !== "object" || typeof record.token !== "string" || !record.token ||
      typeof record.hostname !== "string" || !record.hostname || typeof record.pid !== "number" || !Number.isSafeInteger(record.pid) || record.pid <= 0) {
      blocked(`Unverified lease owner: ${path.basename(file)}.`);
    }
    return { file, bytes, stat, token: record.token, pid: record.pid, hostname: record.hostname };
  } finally { closeSync(fd); }
}

function assertOwnerDead(lease: LeaseSnapshot): void {
  const state = platform.processLiveness(lease.pid, lease.hostname);
  if (state === "dead") return;
  if (state === "alive") blocked(`A live process owns ${path.basename(lease.file)} (${lease.pid}).`);
  blocked(`The lease owner's death cannot be verified: ${path.basename(lease.file)}.`);
}

function assertUnchanged(lease: LeaseSnapshot): void {
  const current = readLease(lease.file);
  if (!current || !sameFile(lease.stat, current.stat) || current.token !== lease.token || !current.bytes.equals(lease.bytes)) {
    blocked(`Lease changed during recovery: ${path.basename(lease.file)}.`);
  }
}

/**
 * Explicit recovery only. This does not open SQLite or alter pending SQL state.
 * No age or timeout is evidence that a writer stopped. An existing recovery
 * guard is preserved; its owner must finish before another recovery can enter.
 */
export function recoverDeadStoreLeases(storeRoot: string): { removed: string[] } {
  const root = platform.describePath(storeRoot).canonicalPath;
  const rootStat = lstatSync(root, { throwIfNoEntry: false });
  if (!rootStat) return { removed: [] };
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) blocked("The Store root is unsafe.");
  if (lstatSync(path.join(root, "removal.lock"), { throwIfNoEntry: false })) blocked("Store removal is active or requires review.");
  const guard = path.join(root, STORE_LEASE_RECOVERY_FILE);
  const token = randomUUID();
  const created = tryCreateExclusiveStoreLease(guard, { token, pid: process.pid, hostname: platform.hostname, startedAt: new Date().toISOString() });
  if (!created.created) return blocked("Another lease recovery owns the recovery guard. Inspect its owner before retrying.");
  const guardStat = created.stat;
  try {
    if (lstatSync(path.join(root, "removal.lock"), { throwIfNoEntry: false })) blocked("Store removal began during recovery.");
    const leases = RECOVERABLE_LEASES.map(name => readLease(path.join(root, name))).filter((lease): lease is LeaseSnapshot => lease !== null);
    // Validate the entire set first. A live bootstrap/access owner prevents any cleanup.
    for (const lease of leases) assertOwnerDead(lease);
    try {
      const sessions = recoverDeadStoreAccessSessions(root, false);
      if (sessions.active.length > 0) blocked(`A live process owns ${sessions.active.map((session) => path.basename(session.file)).join(", ")}.`);
    } catch (error) {
      blocked(error instanceof Error ? error.message : String(error));
    }
    for (const lease of leases) { assertUnchanged(lease); assertOwnerDead(lease); }
    const removed: string[] = [];
    for (const lease of leases) {
      assertUnchanged(lease);
      unlinkSync(lease.file);
      removed.push(path.basename(lease.file));
    }
    try {
      const sessions = recoverDeadStoreAccessSessions(root);
      if (sessions.active.length > 0) {
        blocked(`A live process owns ${sessions.active.map((session) => path.basename(session.file)).join(", ")}.`);
      }
      removed.push(...sessions.removed);
    } catch (error) {
      blocked(error instanceof Error ? error.message : String(error));
    }
    const order = ["installation-bootstrap.lock", "store-access.lock", "global-assets.lock"];
    removed.sort((left, right) => order.indexOf(left.split(path.sep)[0]) - order.indexOf(right.split(path.sep)[0]));
    return { removed };
  } finally {
    const current = readLease(guard);
    if (current && sameFile(guardStat, current.stat) && current.token === token) unlinkSync(guard);
  }
}
