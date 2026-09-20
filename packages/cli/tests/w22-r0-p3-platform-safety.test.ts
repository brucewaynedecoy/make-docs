import { afterEach, describe, expect, it } from "vitest";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
  type Stats,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  comparisonKeyForPath,
  createPlatformService,
  normalizePathSyntax,
  platform,
  PlatformOperationError,
} from "../src/platform";
import {
  applyStoreMigrations,
  classifyStoreCheckpoint9State,
  CURRENT_STORE_SCHEMA_VERSION,
  openStoreSqliteConnection,
  storeSessionPendingName,
  STORE_MIGRATIONS,
} from "../src/store/database";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function temporaryRoot(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-platform-"));
  roots.push(root);
  return root;
}

describe("W22 R0 P3 platform safety contract", () => {
  it("normalizes drive, UNC, separator, and case rules without host guesses", () => {
    expect(normalizePathSyntax("C:/Work/Folder/../File/", "win32")).toBe("C:\\Work\\File");
    expect(normalizePathSyntax("\\\\server\\share\\folder\\..\\file", "win32"))
      .toBe("\\\\server\\share\\file");
    expect(comparisonKeyForPath("C:\\Work\\File", "win32"))
      .toBe(comparisonKeyForPath("c:/work/file/", "win32"));
    expect(comparisonKeyForPath("/Work/File", "darwin"))
      .not.toBe(comparisonKeyForPath("/work/file", "darwin"));
    expect(comparisonKeyForPath("/Work/File", "linux"))
      .not.toBe(comparisonKeyForPath("/work/file", "linux"));
  });

  it("resolves links and absent leaves through the nearest real parent", () => {
    const root = temporaryRoot();
    const real = path.join(root, "real");
    const alias = path.join(root, "alias");
    mkdirSync(real);
    symlinkSync(real, alias, "dir");
    const described = platform.describePath(path.join(alias, "absent", "leaf"));
    expect(described.canonicalPath).toBe(path.join(platform.describePath(real).canonicalPath, "absent", "leaf"));
    expect(described.comparisonKey).toBe(platform.comparisonKey(path.join(real, "absent", "leaf")));
    expect(platform.isPathInside(real, path.join(real, "absent", "leaf"))).toBe(true);
    expect(platform.isPathInside(real, root)).toBe(false);
  });

  it("uses native object numbers only for a short guard and has a metadata fallback", () => {
    const root = temporaryRoot();
    const file = path.join(root, "file.txt");
    writeFileSync(file, "one");
    const native = statSync(file);
    const nativeGuard = platform.captureFileGuard(native, "file");
    expect(platform.matchesFileGuard(statSync(file), nativeGuard)).toBe(true);

    const fallback = {
      ...native,
      dev: 0,
      ino: 0,
      isFile: () => true,
      isDirectory: () => false,
    } as Stats;
    const fallbackGuard = platform.captureFileGuard(fallback, "file");
    expect(fallbackGuard.strategy).toBe("metadata");
    expect(platform.matchesFileGuard(fallback, fallbackGuard)).toBe(true);
    expect(platform.matchesFileGuard({ ...fallback, size: fallback.size + 1 } as Stats, fallbackGuard)).toBe(false);
    expect(platform.matchesFileIdentity({ ...fallback, size: fallback.size + 1 } as Stats, fallbackGuard)).toBe(true);
  });

  it("reports local process state and does not guess about another host", () => {
    expect(platform.processLiveness(process.pid, platform.hostname)).toBe("alive");
    expect(platform.processLiveness(process.pid, `${platform.hostname}-other`)).toBe("unknown");
    expect(platform.processLiveness(-1, platform.hostname)).toBe("unknown");
  });

  it("finds an executable with platform-owned PATH rules", () => {
    const root = temporaryRoot();
    const executable = path.join(root, "make-docs-test-bin");
    writeFileSync(executable, "#!/bin/sh\nexit 0\n");
    chmodSync(executable, 0o755);
    expect(platform.findExecutable("make-docs-test-bin", root)).toBe(executable);
    expect(platform.findExecutable("missing-bin", root)).toBeNull();
    expect(createPlatformService("linux", "test-host").acceptsExecutableMode(0o644)).toBe(false);
    expect(createPlatformService("win32", "test-host").acceptsExecutableMode(0o644)).toBe(true);
  });

  it("replaces a file atomically and preserves the target when replacement fails", () => {
    const root = temporaryRoot();
    const target = path.join(root, "target.txt");
    const staged = path.join(root, "staged.txt");
    writeFileSync(target, "old");
    writeFileSync(staged, "new");
    platform.atomicReplace(staged, target);
    expect(readFileSync(target, "utf8")).toBe("new");
    expect(existsSync(staged)).toBe(false);

    const missing = path.join(root, "missing.txt");
    let failure: unknown;
    try { platform.atomicReplace(missing, target); } catch (error) { failure = error; }
    expect(failure).toBeInstanceOf(PlatformOperationError);
    expect((failure as PlatformOperationError).code).toBe("atomic-replace-failed");
    expect(readFileSync(target, "utf8")).toBe("new");
  });

  it("selects user data roots by platform contract", () => {
    const win = createPlatformService("win32", "test-host");
    expect(win.userDataRoot({ env: { LOCALAPPDATA: "C:\\Data" }, homeDir: "C:\\Home" })).toBe("C:\\Data");
    expect(win.userDataRoot({ env: { APPDATA: "C:\\Roaming" }, homeDir: "C:\\Home" })).toBe("C:\\Roaming");
    expect(createPlatformService("linux").userDataRoot({ env: {}, homeDir: "/home/test" })).toBe("/home/test");
    expect(createPlatformService("darwin").userDataRoot({ env: {}, homeDir: "/Users/test" })).toBe("/Users/test");
    expect(() => win.applyPrivateMode(-1, 0o600)).not.toThrow();
    expect(win.matchesFileMode(0o666, 0o600)).toBe(true);
    expect(win.canMutateOpenPaths).toBe(false);
    expect(createPlatformService("linux").matchesFileMode(0o666, 0o600)).toBe(false);
  });

  it("bounds Store session names even when a host name is long", () => {
    const name = storeSessionPendingName(12345, "host.".repeat(100), "00000000-0000-4000-8000-000000000000");
    expect(name.length).toBeLessThan(100);
    expect(name).toMatch(/^\.pending-12345\.h[0-9a-f]{16}\.00000000-0000-4000-8000-000000000000$/);
  });

  it("upgrades schema 3 checkout rows without treating legacy object numbers as identity", () => {
    const store = temporaryRoot();
    const databasePath = path.join(store, "store.db");
    const legacy = new DatabaseSync(databasePath);
    for (const migration of STORE_MIGRATIONS.filter(candidate => candidate.version <= 3)) {
      for (const statement of migration.statements) legacy.exec(statement);
      legacy.exec(`PRAGMA user_version = ${migration.version}`);
    }
    legacy.prepare("INSERT INTO projects VALUES (?,?,?,?,?,?)")
      .run("project-1", "/old/project", "package", "1.0.0", new Date().toISOString(), new Date().toISOString());
    legacy.prepare("INSERT INTO installation_checkouts VALUES (?,?,?,?,?,?)")
      .run("checkout-1", "project-1", "/old/project", "legacy-device", "legacy-inode", new Date().toISOString());
    legacy.close();

    expect(classifyStoreCheckpoint9State(store)).toMatchObject({ state: "supported-legacy", schemaVersion: 3 });
    const migrated = openStoreSqliteConnection(databasePath);
    try {
      applyStoreMigrations(migrated, 3);
      expect(migrated.prepare("PRAGMA user_version").get()).toEqual({ user_version: CURRENT_STORE_SCHEMA_VERSION });
      const row = migrated.prepare("SELECT root_path_key,verified_at,verification_json FROM installation_checkouts WHERE checkout_id='checkout-1'").get() as Record<string, unknown>;
      expect(row).toMatchObject({
        root_path_key: "/old/project",
      });
      expect(typeof row.verified_at).toBe("string");
      expect(JSON.parse(String(row.verification_json))).toEqual({ schemaVersion: 1, kind: "legacy-path-import" });
      const columns = (migrated.prepare("PRAGMA table_info(installation_checkouts)").all() as Array<{ name: string }>).map(candidate => candidate.name);
      expect(columns).not.toContain("root_device");
      expect(columns).not.toContain("root_inode");
      const archived = migrated.prepare("SELECT record_json FROM installation_migration_records WHERE checkout_id='checkout-1' AND kind='legacy-import' AND record_id='w22-p5:checkout-object-numbers:v4'").get() as { record_json: string };
      expect(JSON.parse(archived.record_json)).toMatchObject({ rootDevice: "legacy-device", rootInode: "legacy-inode", retainedAs: "legacy-comparison-evidence" });
    } finally {
      migrated.close();
    }
  });
});
