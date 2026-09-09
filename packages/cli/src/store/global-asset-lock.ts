import { randomUUID } from "node:crypto";
import { closeSync, constants, fstatSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, unlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { STORE_LEASE_RECOVERY_FILE } from "./lease-recovery";

export const GLOBAL_ASSET_LOCK_FILE = "global-assets.lock";

export interface GlobalAssetLock {
  storeRoot: string;
  lockPath: string;
  token: string;
  device: number;
  inode: number;
  lockDevice: number;
  lockInode: number;
}

const held = new Map<string, { lock: GlobalAssetLock; depth: number }>();

export class GlobalAssetLockError extends Error {
  readonly code = "writer-active";
  constructor(message: string) { super(message); this.name = "GlobalAssetLockError"; }
}

function blocked(message: string): never { throw new GlobalAssetLockError(message); }

function canonicalPath(input: string): string {
  let current = path.resolve(input);
  const missing: string[] = [];
  while (!lstatSync(current, { throwIfNoEntry: false })) {
    const parent = path.dirname(current);
    if (parent === current) blocked("The global asset Store path cannot be resolved.");
    missing.unshift(path.basename(current)); current = parent;
  }
  return path.join(realpathSync(current), ...missing);
}

function assertNoRemoval(root: string): void {
  for (const name of ["removal.lock", STORE_LEASE_RECOVERY_FILE]) {
    if (lstatSync(path.join(root, name), { throwIfNoEntry: false })) {
      blocked("The machine Make Docs Store is being removed or its leases need review. Global skill changes stopped.");
    }
  }
}

/** One lock namespace for home skill targets, even when callers choose different Stores. */
export function acquireGlobalAssetLock(projectRoot: string): GlobalAssetLock {
  const storeRoot = path.join(realpathSync(os.homedir()), ".make-docs");
  const checkout = canonicalPath(projectRoot);
  if (storeRoot === checkout || storeRoot.startsWith(`${checkout}${path.sep}`)) {
    blocked("The machine Make Docs Store is inside the target project. Global skill changes stopped.");
  }
  const prior = lstatSync(storeRoot, { throwIfNoEntry: false });
  if (prior && (!prior.isDirectory() || prior.isSymbolicLink())) blocked("The machine Make Docs Store must be a real directory.");
  assertNoRemoval(storeRoot);
  const existing = held.get(storeRoot);
  if (existing) { assertGlobalAssetLockActive(existing.lock); existing.depth += 1; return existing.lock; }
  mkdirSync(storeRoot, { recursive: true, mode: 0o700 });
  const rootStat = lstatSync(storeRoot);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) blocked("The machine Make Docs Store changed before the global skill lock.");
  const lockPath = path.join(storeRoot, GLOBAL_ASSET_LOCK_FILE);
  let fd: number;
  try { fd = openSync(lockPath, "wx", 0o600); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") blocked("A global skill writer is active or needs recovery. Preserve its machine Store lease and review its owner.");
    throw error;
  }
  const token = randomUUID();
  const lockStat = fstatSync(fd);
  const lock: GlobalAssetLock = { storeRoot, lockPath, token, device: rootStat.dev, inode: rootStat.ino, lockDevice: lockStat.dev, lockInode: lockStat.ino };
  try {
    writeFileSync(fd, JSON.stringify({ token, pid: process.pid, hostname: os.hostname() }));
    fsyncSync(fd);
    held.set(storeRoot, { lock, depth: 1 });
    assertGlobalAssetLockActive(lock);
    return lock;
  } catch (error) {
    held.delete(storeRoot);
    const current = lstatSync(lockPath, { throwIfNoEntry: false });
    if (current?.isFile() && current.dev === lock.lockDevice && current.ino === lock.lockInode) unlinkSync(lockPath);
    throw error;
  } finally { closeSync(fd); }
}

export function assertGlobalAssetLockActive(lock: GlobalAssetLock): void {
  assertNoRemoval(lock.storeRoot);
  const root = lstatSync(lock.storeRoot, { throwIfNoEntry: false });
  const leaf = lstatSync(lock.lockPath, { throwIfNoEntry: false });
  if (!root?.isDirectory() || root.isSymbolicLink() || root.dev !== lock.device || root.ino !== lock.inode ||
      !leaf?.isFile() || leaf.isSymbolicLink() || leaf.dev !== lock.lockDevice || leaf.ino !== lock.lockInode || leaf.size > 16_384) {
    blocked("The global skill Store lease changed. Global skill changes stopped.");
  }
  const fd = openSync(lock.lockPath, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = fstatSync(fd);
    if (stat.dev !== lock.lockDevice || stat.ino !== lock.lockInode) blocked("The global skill lease changed during inspection.");
    const record = JSON.parse(readFileSync(fd, "utf8")) as Record<string, unknown>;
    if (record.token !== lock.token || record.pid !== process.pid || record.hostname !== os.hostname()) blocked("The global skill lease owner changed.");
  } finally { closeSync(fd); }
}

export function releaseGlobalAssetLock(lock: GlobalAssetLock): void {
  const entry = held.get(lock.storeRoot);
  if (!entry || entry.lock.token !== lock.token) return;
  if (entry.depth > 1) { entry.depth -= 1; return; }
  held.delete(lock.storeRoot);
  // Release only the exact file this process created. Preserve replacement leases.
  const root = lstatSync(lock.storeRoot, { throwIfNoEntry: false });
  if (!root?.isDirectory() || root.isSymbolicLink() || root.dev !== lock.device || root.ino !== lock.inode) return;
  const current = lstatSync(lock.lockPath, { throwIfNoEntry: false });
  if (current?.isFile() && !current.isSymbolicLink() && current.dev === lock.lockDevice && current.ino === lock.lockInode) {
    try {
      const record = JSON.parse(readFileSync(lock.lockPath, "utf8")) as Record<string, unknown>;
      if (record.token === lock.token) unlinkSync(lock.lockPath);
    } catch { /* Preserve an unreadable or replaced lease. */ }
  }
}
