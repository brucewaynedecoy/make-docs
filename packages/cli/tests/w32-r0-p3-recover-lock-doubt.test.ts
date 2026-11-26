import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupTempDir, createTempDir } from "./helpers";

/**
 * W32 R0 P3: recovery deletes a dead writer lock only when its path matches the
 * checkout by the platform comparison key. A lock whose path cannot be resolved,
 * and that matches only by lower case, stays and stops recovery.
 */

const unresolvable = new Set<string>();

vi.mock("../src/platform", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/platform")>();
  const comparisonKey = (input: string) => {
    if (unresolvable.has(input)) throw new actual.PlatformOperationError("path-unavailable", `The path cannot be resolved: ${input}`);
    return actual.platform.comparisonKey(input);
  };
  return {
    ...actual,
    platform: {
      ...actual.platform,
      comparisonKey,
      samePath: (left: string, right: string) => comparisonKey(left) === comparisonKey(right),
    },
  };
});

const { platform } = await import("../src/platform");
const { withStoreDatabase } = await import("../src/store");
const { compareStoredRoot } = await import("../src/store/root-path-match");
const {
  getInstallationCheckoutId,
  recoverInstallationOperation,
  withInstallationDatabase,
  withInstallationOperation,
} = await import("../src/store/installation-state");

const roots: string[] = [];

beforeEach(() => {
  const guard = createTempDir("make-docs-w32-p3-lock-guard-");
  roots.push(guard);
  vi.stubEnv("MAKE_DOCS_HOME", path.join(guard, "store"));
});

afterEach(() => {
  unresolvable.clear();
  vi.unstubAllEnvs();
  while (roots.length) cleanupTempDir(roots.pop()!);
});

function deadPid(): number {
  return spawnSync(process.execPath, ["-e", ""]).pid!;
}

describe("W32 R0 P3 recover and doubtful lock paths", () => {
  it("keeps a lock that matches only on doubt, and deletes a dead lock that matches by the platform key", () => {
    const parent = platform.describePath(createTempDir("make-docs-w32-p3-lock-")).canonicalPath;
    roots.push(parent);
    const store = path.join(parent, "store");
    vi.stubEnv("MAKE_DOCS_HOME", store);
    withStoreDatabase(store, () => undefined);
    const root = path.join(parent, "locked");
    mkdirSync(path.join(root, ".make-docs"), { recursive: true });
    writeFileSync(path.join(root, ".make-docs/config.yaml"), "projectId: locked-project\n");
    getInstallationCheckoutId(root, store);
    expect(() => withInstallationOperation(root, "test.change", () => { throw new Error("stop"); }, { storeRoot: store })).toThrow(/Failed operation/);
    const operationId = withInstallationDatabase(root, (db) => (db.prepare("SELECT operation_id FROM installation_operations WHERE status='failed'").get() as { operation_id: string }).operation_id, { storeRoot: store, readOnly: true });
    const locks = () => withInstallationDatabase(root, (db) => db.prepare("SELECT root_path FROM installation_locks ORDER BY root_path").all(), { storeRoot: store, readOnly: true });
    const insertLock = (lockPath: string, token: string) => withInstallationDatabase(root, (db) => db.prepare("INSERT INTO installation_locks VALUES (?,?,?,?,?)").run(lockPath, token, deadPid(), platform.hostname, "2026-11-22T00:00:00.000Z"), { storeRoot: store });

    const doubtful = root.toUpperCase();
    unresolvable.add(doubtful);
    expect(compareStoredRoot(doubtful, root)).toBe("unknown");
    insertLock(doubtful, "doubt-token");
    expect(() => recoverInstallationOperation(root, operationId, "rollback", false, store)).toThrow(/cannot resolve that path/);
    expect(locks()).toEqual([{ root_path: doubtful }]);

    withInstallationDatabase(root, (db) => db.prepare("DELETE FROM installation_locks").run(), { storeRoot: store });
    insertLock(root, "dead-token");
    expect(compareStoredRoot(root, root)).toBe("same");
    expect(recoverInstallationOperation(root, operationId, "rollback", false, store)).toMatchObject({ status: "rolled-back" });
    expect(locks()).toEqual([]);
  });
});
