import { randomUUID } from "node:crypto";
import { closeSync, constants, fstatSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { STORE_LEASE_RECOVERY_FILE } from "./lease-recovery";
import { platform, type FileMutationGuard } from "../platform";

export const GLOBAL_ASSET_LOCK_FILE = "global-assets.lock";

export interface GlobalAssetLock {
  storeRoot: string;
  lockPath: string;
  token: string;
  rootGuard: FileMutationGuard;
  lockGuard: FileMutationGuard;
}

const held = new Map<string, { lock: GlobalAssetLock; depth: number }>();

export class GlobalAssetLockError extends Error {
  readonly code = "writer-active";
  constructor(message: string) { super(message); this.name = "GlobalAssetLockError"; }
}

function blocked(message: string): never { throw new GlobalAssetLockError(message); }

function canonicalPath(input: string): string {
  try { return platform.describePath(input).canonicalPath; }
  catch { return blocked("The global asset Store path cannot be resolved."); }
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
  const requestedStoreRoot = path.join(platform.userDataRoot(), ".make-docs");
  const requestedState = lstatSync(requestedStoreRoot, { throwIfNoEntry: false });
  if (requestedState && (!requestedState.isDirectory() || requestedState.isSymbolicLink()))
    blocked("The machine Make Docs Store must be a real directory.");
  const storeRoot = canonicalPath(requestedStoreRoot);
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
  const lock: GlobalAssetLock = {
    storeRoot,
    lockPath,
    token,
    rootGuard: platform.captureFileGuard(rootStat, "directory"),
    lockGuard: platform.captureFileGuard(lockStat, "file"),
  };
  try {
    writeFileSync(fd, JSON.stringify({ token, pid: process.pid, hostname: platform.hostname }));
    fsyncSync(fd);
    held.set(storeRoot, { lock, depth: 1 });
    assertGlobalAssetLockActive(lock);
    return lock;
  } catch (error) {
    held.delete(storeRoot);
    const current = lstatSync(lockPath, { throwIfNoEntry: false });
    if (current?.isFile() && platform.matchesFileGuard(current, lock.lockGuard)) unlinkSync(lockPath);
    throw error;
  } finally { closeSync(fd); }
}

export function assertGlobalAssetLockActive(lock: GlobalAssetLock): void {
  assertNoRemoval(lock.storeRoot);
  const root = lstatSync(lock.storeRoot, { throwIfNoEntry: false });
  const leaf = lstatSync(lock.lockPath, { throwIfNoEntry: false });
  if (!root?.isDirectory() || root.isSymbolicLink() || !platform.matchesFileGuard(root, lock.rootGuard) ||
      !leaf?.isFile() || leaf.isSymbolicLink() || !platform.matchesFileGuard(leaf, lock.lockGuard) || leaf.size > 16_384) {
    blocked("The global skill Store lease changed. Global skill changes stopped.");
  }
  const fd = openSync(lock.lockPath, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = fstatSync(fd);
    if (!platform.matchesFileGuard(stat, lock.lockGuard)) blocked("The global skill lease changed during inspection.");
    const record = JSON.parse(readFileSync(fd, "utf8")) as Record<string, unknown>;
    if (record.token !== lock.token || record.pid !== process.pid || record.hostname !== platform.hostname) blocked("The global skill lease owner changed.");
  } finally { closeSync(fd); }
}

export function releaseGlobalAssetLock(lock: GlobalAssetLock): void {
  const entry = held.get(lock.storeRoot);
  if (!entry || entry.lock.token !== lock.token) return;
  if (entry.depth > 1) { entry.depth -= 1; return; }
  held.delete(lock.storeRoot);
  // Release only the exact file this process created. Preserve replacement leases.
  const root = lstatSync(lock.storeRoot, { throwIfNoEntry: false });
  if (!root?.isDirectory() || root.isSymbolicLink() || !platform.matchesFileGuard(root, lock.rootGuard)) return;
  const current = lstatSync(lock.lockPath, { throwIfNoEntry: false });
  if (current?.isFile() && !current.isSymbolicLink() && platform.matchesFileGuard(current, lock.lockGuard)) {
    try {
      const record = JSON.parse(readFileSync(lock.lockPath, "utf8")) as Record<string, unknown>;
      if (record.token === lock.token) unlinkSync(lock.lockPath);
    } catch { /* Preserve an unreadable or replaced lease. */ }
  }
}
