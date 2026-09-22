import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, test } from "vitest";
import {
  CURRENT_STORE_SCHEMA_VERSION,
  STORE_COMPATIBILITY_BRIDGE_REGISTER,
  STORE_MIGRATIONS,
  applyStoreMigrations,
  openStoreDatabase,
  previewStoreCompatibilityBridge,
} from "../src/store";
import { withInstallationOperation } from "../src/store/installation-state";

const roots: string[] = [];

afterEach(() => {
  while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true });
});

function storeRoot(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-w22-p5-"));
  roots.push(root);
  return root;
}

function seedSchema(root: string, version: 1 | 2 | 3 | 4 | 5): DatabaseSync {
  mkdirSync(root, { recursive: true });
  const db = new DatabaseSync(path.join(root, "store.db"));
  db.exec("PRAGMA foreign_keys=ON");
  for (const migration of STORE_MIGRATIONS.filter((candidate) => candidate.version <= version)) {
    for (const statement of migration.statements) db.exec(statement);
    db.exec(`PRAGMA user_version=${migration.version}`);
  }
  return db;
}

function seedVersionFourRecords(db: DatabaseSync): string {
  const ledger = JSON.stringify({
    schemaVersion: 4,
    projectId: "project-1",
    selections: { resourceProjection: ["contract"] },
    resourceProjection: {
      selectedTypes: ["contract"],
      provider: { packageName: "legacy-provider" },
      resources: {
        "make-docs://system/contract/example.md": {
          uri: "make-docs://system/contract/example.md",
          managedDestination: ".make-docs/system/contracts/example.md",
          ownershipClass: "managed-snapshot",
          installedDigest: "sha256:" + "a".repeat(64),
          hashAlgorithm: "sha256",
          lastVerifiedAt: "2026-09-19T00:00:00.000Z",
          lifecycleDisposition: "active",
          providerPackage: "legacy-provider",
          providerVersion: "1.0.0",
        },
      },
    },
    files: {},
  });
  db.prepare("INSERT INTO installation_checkouts VALUES (?,?,?,?,?,?,?,?,?)")
    .run("checkout-1", "project-1", "/old/project", "legacy-device", "legacy-inode", "created", "/old/project", "verified", '{"schemaVersion":1,"kind":"legacy-path-import"}');
  db.prepare("INSERT INTO installation_ledgers VALUES (?,?,?)").run("checkout-1", ledger, "updated");
  db.prepare("INSERT INTO installation_transfers VALUES (?,?,?,'imported',?)")
    .run("checkout-1", ".make-docs/manifest.json", "sha256:" + "b".repeat(64), "imported");
  db.prepare("INSERT INTO installation_operations (operation_id,checkout_id,operation,status,before_ledger,after_ledger,created_at,finished_at) VALUES (?,?,?,'pending',?,?,?,NULL)")
    .run("pending-1", "checkout-1", "legacy.recovery", ledger, ledger, "created");
  db.prepare("INSERT INTO store_checkpoint_journal VALUES (?,9,?,?,?,?)")
    .run("sha256:" + "c".repeat(64), "d".repeat(64), "sha256:" + "e".repeat(64), "committed", '{"schemaVersion":1}');
  return ledger;
}

describe("W22 R0 P5 compatibility bridge", () => {
  test("the bridge register has every bounded exit field and separate deletion approval", () => {
    expect(STORE_COMPATIBILITY_BRIDGE_REGISTER.map((entry) => entry.bridgeId)).toEqual([
      "w22-p5-store-schema-v1-v4",
      "w22-p5-checkout-object-numbers",
      "w22-p5-checkpoint-receipts",
      "w22-p5-installation-transfers",
      "w22-p5-installation-ledger",
      "w22-p5-harness-receipt-v1",
      "w22-p5-pending-operations",
    ]);
    for (const entry of STORE_COMPATIBILITY_BRIDGE_REGISTER) {
      expect(entry.owner).not.toBe("");
      expect(entry.endCondition).not.toBe("");
      expect(entry.remainingStateCheck).not.toBe("");
      expect(entry.requiredTests.length).toBeGreaterThan(0);
      expect(entry.separateDeletionApproval).toBe(true);
    }
  });

  test.each([1, 2, 3, 4] as const)("previews schema %s without changing database bytes", (version) => {
    const root = storeRoot();
    const db = seedSchema(root, version);
    db.close();
    const file = path.join(root, "store.db");
    const before = readFileSync(file);
    const beforeEntries = readdirSync(root).sort();
    const preview = previewStoreCompatibilityBridge(root);
    expect(preview).toMatchObject({
      readOnly: true,
      sourceSchemaVersion: version,
      targetSchemaVersion: CURRENT_STORE_SCHEMA_VERSION,
      disposition: "convert",
      blockers: [],
    });
    expect(preview.changes.project).toEqual([]);
    expect(preview.changes.native).toEqual([]);
    expect(readFileSync(file)).toEqual(before);
    expect(readdirSync(root).sort()).toEqual(beforeEntries);
  });

  test("previews the schema-5 cache migration without treating retained bridge history as a collision", () => {
    const root = storeRoot();
    const db = seedSchema(root, 5);
    db.close();
    const preview = previewStoreCompatibilityBridge(root);
    expect(preview).toMatchObject({
      readOnly: true,
      sourceSchemaVersion: 5,
      targetSchemaVersion: CURRENT_STORE_SCHEMA_VERSION,
      disposition: "convert",
      blockers: [],
    });
    expect(preview.records).toEqual(expect.arrayContaining([
      expect.objectContaining({ bridgeId: "w23-r0-p5-backlog-review-cache", disposition: "convert" }),
    ]));
  });

  test("does not let an unreviewed Store writer trigger the bridge", () => {
    const root = storeRoot();
    const db = seedSchema(root, 4);
    db.close();
    const project = mkdtempSync(path.join(os.tmpdir(), "make-docs-w22-p5-project-"));
    roots.push(project);
    expect(() => withInstallationOperation(project, "test.unreviewed", () => {}, { storeRoot: root }))
      .toThrow(/Run make-docs setup to review/);
    const preserved = new DatabaseSync(path.join(root, "store.db"));
    expect(preserved.prepare("PRAGMA user_version").get()).toEqual({ user_version: 4 });
    preserved.close();
  });

  test("converts supported state in one journal and preserves ids, recovery, history, and files", () => {
    const root = storeRoot();
    const project = path.join(root, "project-content");
    mkdirSync(project);
    const userFile = path.join(project, "user.txt");
    writeFileSync(userFile, "keep me");
    const db = seedSchema(root, 4);
    seedVersionFourRecords(db);
    db.close();

    const preview = previewStoreCompatibilityBridge(root);
    expect(preview.disposition).toBe("convert");
    expect(preview.changes.store).toEqual(expect.arrayContaining([
      expect.stringContaining("backup"),
      expect.stringContaining("device and inode"),
      expect.stringContaining("checkpoint receipt"),
      expect.stringContaining("legacy projection mirrors"),
    ]));

    const migrated = new DatabaseSync(path.join(root, "store.db"));
    expect(applyStoreMigrations(migrated, 4)).toBe(CURRENT_STORE_SCHEMA_VERSION);
    expect(migrated.prepare("PRAGMA user_version").get()).toEqual({
      user_version: CURRENT_STORE_SCHEMA_VERSION,
    });
    const columns = (migrated.prepare("PRAGMA table_info(installation_checkouts)").all() as Array<{ name: string }>).map((row) => row.name);
    expect(columns).not.toContain("root_device");
    expect(columns).not.toContain("root_inode");
    expect(migrated.prepare("SELECT checkout_id,project_id,root_path FROM installation_checkouts").get()).toEqual({ checkout_id: "checkout-1", project_id: "project-1", root_path: "/old/project" });
    const objectHistory = migrated.prepare("SELECT record_json FROM installation_migration_records WHERE record_id='w22-p5:checkout-object-numbers:v4'").get() as { record_json: string };
    expect(JSON.parse(objectHistory.record_json)).toMatchObject({ rootDevice: "legacy-device", rootInode: "legacy-inode" });
    const ledgerHistory = migrated.prepare("SELECT record_json FROM installation_migration_records WHERE record_id='w22-p5:installation-ledger-projection:v4'").get() as { record_json: string };
    expect(JSON.parse(ledgerHistory.record_json).resourceProjection.provider.packageName).toBe("legacy-provider");
    const targetLedger = JSON.parse((migrated.prepare("SELECT manifest_json FROM installation_ledgers").get() as { manifest_json: string }).manifest_json);
    expect(targetLedger.resourceProjection.selectedTypes).toBeUndefined();
    expect(targetLedger.resourceProjection.provider).toBeUndefined();
    expect(targetLedger.resourceProjection.resources["make-docs://system/contract/example.md"].providerPackage).toBeUndefined();
    expect(migrated.prepare("SELECT COUNT(*) AS count FROM installation_transfers").get()).toEqual({ count: 1 });
    expect(migrated.prepare("SELECT status FROM installation_operations WHERE operation_id='pending-1'").get()).toEqual({ status: "pending" });
    expect(migrated.prepare("SELECT status FROM tool_operations WHERE operation_id='compatibility-bridge:w22-p5:v5'").get()).toEqual({ status: "completed" });
    expect(migrated.prepare("SELECT COUNT(*) AS count FROM store_migration_receipts").get()).toEqual({ count: 1 });
    migrated.close();

    expect(readFileSync(userFile, "utf8")).toBe("keep me");
    expect(readdirSync(root).filter((name) => name.endsWith(".backup"))).toHaveLength(1);
    const after = previewStoreCompatibilityBridge(root);
    expect(after.disposition).toBe("retain-history");
    expect(after.blockers).toEqual([]);
    const repeat = new DatabaseSync(path.join(root, "store.db"));
    const backupCount = readdirSync(root).filter((name) => name.endsWith(".backup")).length;
    expect(applyStoreMigrations(repeat, CURRENT_STORE_SCHEMA_VERSION)).toBe(
      CURRENT_STORE_SCHEMA_VERSION,
    );
    repeat.close();
    expect(readdirSync(root).filter((name) => name.endsWith(".backup"))).toHaveLength(backupCount);
  });

  test("rolls back an interrupted conversion and keeps the saved before state", () => {
    const root = storeRoot();
    const db = seedSchema(root, 4);
    const ledger = seedVersionFourRecords(db);
    const migration = STORE_MIGRATIONS.find((candidate) => candidate.version === 5)!;
    migration.statements.splice(1, 0, "THIS IS AN INJECTED FAILURE");
    try {
      expect(() => applyStoreMigrations(db, 4)).toThrow();
    } finally {
      migration.statements.splice(1, 1);
    }
    expect(db.prepare("PRAGMA user_version").get()).toEqual({ user_version: 4 });
    expect((db.prepare("PRAGMA table_info(installation_checkouts)").all() as Array<{ name: string }>).map((row) => row.name)).toEqual(expect.arrayContaining(["root_device", "root_inode"]));
    expect(db.prepare("SELECT name FROM sqlite_schema WHERE name='store_migration_receipts'").get()).toBeUndefined();
    expect(db.prepare("SELECT operation_id FROM tool_operations WHERE operation_id='compatibility-bridge:w22-p5:v5'").get()).toBeUndefined();
    expect((db.prepare("SELECT manifest_json FROM installation_ledgers").get() as { manifest_json: string }).manifest_json).toBe(ledger);
    db.close();
    expect(readdirSync(root).some((name) => name.endsWith(".backup"))).toBe(true);
  });

  test("quarantines unclear data and rejects newer state without rewriting either file", () => {
    const malformedRoot = storeRoot();
    const malformed = seedSchema(malformedRoot, 4);
    malformed.prepare("INSERT INTO installation_checkouts VALUES (?,?,?,?,?,?,?,?,?)")
      .run("checkout-1", "project-1", "/project", "device", "inode", "created", "/project", "verified", "{}");
    malformed.prepare("INSERT INTO installation_ledgers VALUES (?,?,?)").run("checkout-1", "not-json", "updated");
    malformed.close();
    const malformedFile = path.join(malformedRoot, "store.db");
    const malformedBytes = readFileSync(malformedFile);
    expect(previewStoreCompatibilityBridge(malformedRoot)).toMatchObject({ disposition: "quarantine", blockers: [expect.stringContaining("malformed")] });
    const blocked = new DatabaseSync(malformedFile);
    expect(() => applyStoreMigrations(blocked, 4)).toThrow(/not valid JSON/);
    blocked.close();
    expect(readFileSync(malformedFile)).toEqual(malformedBytes);

    const newerRoot = storeRoot();
    const current = openStoreDatabase(newerRoot);
    current.db.exec("PRAGMA user_version=99");
    current.db.close();
    const newerFile = path.join(newerRoot, "store.db");
    const newerBytes = readFileSync(newerFile);
    expect(previewStoreCompatibilityBridge(newerRoot)).toMatchObject({ disposition: "unsupported", sourceSchemaVersion: 99 });
    expect(readFileSync(newerFile)).toEqual(newerBytes);
  });
});
