import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { acquireGlobalAssetLock, assertGlobalAssetLockActive, releaseGlobalAssetLock } from "../src/store/global-asset-lock";

const roots: string[] = [];
function fixture() {
  const parent = mkdtempSync(path.join(os.tmpdir(), "make-docs-global-lock-")); roots.push(parent);
  const home = path.join(parent, "home"), project = path.join(parent, "project");
  mkdirSync(home); mkdirSync(project);
  vi.spyOn(os, "homedir").mockReturnValue(home);
  return { home, project, store: path.join(home, ".make-docs") };
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

it("uses one machine Store namespace when selected Stores differ", () => {
  const f = fixture();
  vi.stubEnv("MAKE_DOCS_HOME", path.join(f.project, "first-store"));
  const first = acquireGlobalAssetLock(f.project);
  try {
    vi.stubEnv("MAKE_DOCS_HOME", path.join(f.project, "second-store"));
    const second = acquireGlobalAssetLock(f.project);
    expect(second).toBe(first);
    expect(first.storeRoot).toBe(realpathSync(f.store));
    releaseGlobalAssetLock(second);
    expect(() => assertGlobalAssetLockActive(first)).not.toThrow();
    expect(existsSync(path.join(f.project, "first-store"))).toBe(false);
    expect(existsSync(path.join(f.project, "second-store"))).toBe(false);
  } finally { releaseGlobalAssetLock(first); }
  expect(existsSync(first.lockPath)).toBe(false);
});

it("refuses a machine Store inside the project before creating it", () => {
  const f = fixture();
  expect(() => acquireGlobalAssetLock(f.home)).toThrow(/inside the target project/);
  expect(existsSync(f.store)).toBe(false);
});

it.each(["removal.lock", "installation-lease-recovery.lock", "global-assets.lock"])("preserves %s from another owner", name => {
  const f = fixture(); mkdirSync(f.store);
  const marker = path.join(f.store, name); writeFileSync(marker, "other owner");
  expect(() => acquireGlobalAssetLock(f.project)).toThrow();
  expect(readFileSync(marker, "utf8")).toBe("other owner");
});

it("refuses a dangling symlink at the machine Store root", () => {
  const f = fixture(); const outside = path.join(path.dirname(f.home), "outside");
  symlinkSync(outside, f.store);
  expect(() => acquireGlobalAssetLock(f.project)).toThrow(/real directory/);
  expect(existsSync(outside)).toBe(false);
});

it("stops after its lease is replaced and preserves the replacement", () => {
  const f = fixture(); const lock = acquireGlobalAssetLock(f.project);
  rmSync(lock.lockPath); writeFileSync(lock.lockPath, "replacement owner");
  expect(() => assertGlobalAssetLockActive(lock)).toThrow();
  releaseGlobalAssetLock(lock);
  expect(readFileSync(lock.lockPath, "utf8")).toBe("replacement owner");
});
