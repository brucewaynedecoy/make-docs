import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StoreAccessStateError } from "../src/operations/store-access";
import { scopeStoreAccessFailure } from "../src/operations/registry";
import { WORK_STORE_FIELD_REGISTER } from "../src/operations/work/work-store/catalog";
import type { WorkClaimRecord, WorkUnitRecord } from "../src/operations/work/work-store/schemas";
import { platform } from "../src/platform";
import {
  CURRENT_STORE_SCHEMA_VERSION,
  STORE_MIGRATIONS,
  STORE_WRITE_GUARD_EVENTS,
  StoreSchemaNewerError,
  applyStoreMigrations,
  classifyStoreCheckpoint9State,
  inspectStoreGuardAndVersion,
  inspectStoreWriteGuard,
  isVerifiedStoreBackupFile,
  openStoreDatabase,
  openStoreSqliteConnection,
  readStoreSchemaJournal,
  storeWriteGuardTriggerName,
  withStoreDatabase,
} from "../src/store/database";
import { previewStoreCompatibilityBridge } from "../src/store/compatibility-bridge";
import { STORE_LEGACY_SCHEMA_NEXT_ACTION, getInstallationCheckoutId, previewInstallationCheckoutMove } from "../src/store/installation-state";
import { STORE_TABLE_CATALOG, parseStoreRMinRows, readPhysicalStoreSchema } from "../src/store/table-catalog";
import {
  WORK_STORE_COLUMN_REGISTER,
  WORK_STORE_RMIN_ROWS,
  WORK_STORE_TABLE_NAMES,
  rMinRowFieldPhrases,
  workStoreSchemaDrift,
} from "../src/store/work-store-schema";
import {
  WorkStoreRefusalError,
  checkWorkUnitWriteClaim,
  claimWorkUnit,
  createQuickItem,
  deleteSyncConflict,
  deleteSyncLedgerEntry,
  listSyncConflicts,
  listWorkUnits,
  putSyncConflict,
  putSyncLedgerEntry,
  putWorkUnit,
  readSyncLedgerEntry,
  readWorkClaim,
  readWorkStore,
  readWorkUnit,
  releaseWorkClaim,
  resolveWorkProject,
  writeWorkStore,
} from "../src/store/work-store";
import { CHECKOUT_ID, NOW, PROJECT_ID, WORK_STORE_CONTRACT_FIXTURES, storeIdFor, unit } from "./fixtures/work-store-contract";
import { cleanupTempDir, createTempDir } from "./helpers";

/**
 * W29 R0 P2: the schema v8 work store tables (A5, A6), the Store service with
 * an expected version on every write (T5), one claim row for each unit (A7),
 * claim expiry and takeover (A8), the R-MIN parity test (A9), and project
 * resolution through `project_register` only (A33).
 */

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const PRD_38 = readFileSync(path.join(REPO_ROOT, "docs/prd/38-global-store-and-project-state.md"), "utf8");
const R_MIN_ROWS = parseStoreRMinRows(PRD_38);
const LATER_NOW = new Date(NOW);

const roots: string[] = [];
let temp: string;
let store: string;

beforeEach(() => {
  temp = platform.describePath(createTempDir("make-docs-w29-p2-")).canonicalPath;
  roots.push(temp);
  store = path.join(temp, "store");
  // No test may reach the real Store.
  vi.stubEnv("MAKE_DOCS_HOME", store);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  while (roots.length) cleanupTempDir(roots.pop()!);
});

function project(name: string, config: Record<string, string>): string {
  const root = path.join(temp, name);
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(path.join(root, ".make-docs/config.yaml"), Object.entries(config).map(([key, value]) => `${key}: ${value}\n`).join(""));
  return platform.describePath(root).canonicalPath;
}

/** Seed a Store at an older schema on a raw connection, as an older Make Docs left it. */
function seedStoreAt(version: number): DatabaseSync {
  mkdirSync(store, { recursive: true });
  const db = new DatabaseSync(path.join(store, "store.db"));
  db.exec("PRAGMA foreign_keys=ON");
  db.function("make_docs_write_guard", () => null);
  // Schemas up to 6 have no guard, so their statements replay as they are.
  expect(version).toBeLessThan(7);
  for (const migration of STORE_MIGRATIONS.filter((candidate) => candidate.version <= version)) {
    for (const statement of migration.statements) db.exec(statement);
    db.exec(`PRAGMA user_version=${migration.version}`);
  }
  return db;
}

/** A schema 7 Store, made by the real migration code from a fresh v6 Store, with one checkout row. */
function seedV7(): void {
  const db = seedStoreAt(6);
  db.prepare("INSERT INTO installation_checkouts (checkout_id,project_id,root_path,created_at,root_path_key,verified_at,verification_json) VALUES (?,?,?,?,?,?,?)")
    .run("checkout-old", "project-old", "/old/project", "2026-01-01T00:00:00.000Z", "/old/project", null, null);
  db.close();
  const migrating = openStoreSqliteConnection(path.join(store, "store.db"), {}, "seed");
  try {
    const v7 = STORE_MIGRATIONS.filter((migration) => migration.version <= 7);
    // Apply only up to schema 7 by running the real list without the v8 entry.
    const saved = STORE_MIGRATIONS.splice(v7.length);
    try {
      expect(applyStoreMigrations(migrating, 6)).toBe(7);
    } finally {
      STORE_MIGRATIONS.push(...saved);
    }
  } finally {
    migrating.close();
  }
  for (const file of readdirSync(store)) {
    if (file.endsWith(".backup")) rmSync(path.join(store, file), { force: true });
  }
}

function columns(db: { prepare(sql: string): { all(...args: unknown[]): unknown[] } }, table: string): string[] {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>).map((row) => row.name);
}

describe("W29 R0 P2 schema v8 migration (A5)", () => {
  it("creates a fresh Store at schema v8 with every work table, its guard triggers, its journal row, and its catalog entry", () => {
    expect(CURRENT_STORE_SCHEMA_VERSION).toBe(8);
    withStoreDatabase(store, (db) => {
      const journal = readStoreSchemaJournal(db);
      expect(journal.schemaVersion).toBe(8);
      expect(journal.journal.map((row) => row.version)).toEqual([3, 4, 5, 6, 7, 8]);
      expect(inspectStoreWriteGuard(db)).toEqual([]);
      const triggers = new Set((db.prepare("SELECT name FROM sqlite_schema WHERE type = 'trigger'").all() as Array<{ name: string }>).map((row) => row.name));
      for (const table of WORK_STORE_TABLE_NAMES) {
        expect(columns(db, table), table).toEqual(STORE_TABLE_CATALOG.find((entry) => entry.table === table)!.columns);
        for (const event of STORE_WRITE_GUARD_EVENTS) expect(triggers.has(storeWriteGuardTriggerName(table, event)), `${table} ${event}`).toBe(true);
      }
    });
    const catalog = Object.fromEntries(STORE_TABLE_CATALOG.filter((entry) => entry.sinceSchema === 8).map((entry) => [entry.table, entry.rowClasses.map((rowClass) => rowClass.maintenanceClass)]));
    expect(catalog).toEqual({
      work_units: ["keep"],
      work_dependencies: ["keep"],
      work_links: ["keep"],
      work_claims: ["bounded"],
      work_sync_ledger: ["keep"],
      work_sync_conflicts: ["bounded"],
      work_sync_checkouts: ["bounded"],
    });
  });

  it("moves v7 to v8 after one verified backup, keeps every row, and leaves the v7 Store readable until then", () => {
    seedV7();
    const before = classifyStoreCheckpoint9State(store);
    expect(before).toMatchObject({ state: "supported-legacy", schemaVersion: 7 });
    expect(previewStoreCompatibilityBridge(store).records).toEqual(expect.arrayContaining([
      expect.objectContaining({ bridgeId: "w29-r0-p2-store-schema-v8", disposition: "convert" }),
    ]));
    // A v7 Store stays readable where a v6 Store is: checkout move review reads it as it is.
    const reader = project("reader", { projectId: "project-old" });
    // The review reads the v7 checkout row; its blocker is the missing ownership proof, not the Store schema.
    const preview = previewInstallationCheckoutMove(reader, undefined, store);
    expect(preview.candidates.map((candidate) => candidate.checkoutId)).toEqual(["checkout-old"]);
    expect(preview.nextAction).not.toMatch(/schema|Store conversion/);
    expect(classifyStoreCheckpoint9State(store)).toMatchObject({ state: "supported-legacy", schemaVersion: 7 });

    const db = openStoreSqliteConnection(path.join(store, "store.db"), {}, "migrate");
    try {
      expect(applyStoreMigrations(db, 7)).toBe(8);
      expect(db.prepare("PRAGMA user_version").get()).toEqual({ user_version: 8 });
      expect(db.prepare("SELECT checkout_id FROM installation_checkouts").all()).toEqual([{ checkout_id: "checkout-old" }]);
      expect(readStoreSchemaJournal(db).journal.map((row) => row.version)).toEqual([3, 4, 5, 6, 7, 8]);
      expect(inspectStoreWriteGuard(db)).toEqual([]);
    } finally {
      db.close();
    }
    const backups = readdirSync(store).filter((file) => /^store\.db\.bridge-v7-to-v8-.*\.backup$/.test(file));
    expect(backups).toHaveLength(1);
    expect(isVerifiedStoreBackupFile(path.join(store, backups[0]!))).toBe(true);
    const backup = new DatabaseSync(path.join(store, backups[0]!), { readOnly: true });
    try {
      expect(backup.prepare("PRAGMA user_version").get()).toEqual({ user_version: 7 });
    } finally {
      backup.close();
    }
    expect(classifyStoreCheckpoint9State(store)).toMatchObject({ state: "supported-current", schemaVersion: 8 });
  });

  it("rolls the whole v8 migration back when one statement fails, and the v7 Store stays usable", () => {
    seedV7();
    // An index with the name of a v8 index makes the v8 migration fail after its first table.
    const raw = openStoreSqliteConnection(path.join(store, "store.db"), {}, "seed");
    raw.exec("CREATE INDEX idx_work_units_parent ON project_register (project_id)");
    raw.close();
    const db = openStoreSqliteConnection(path.join(store, "store.db"), {}, "migrate");
    try {
      expect(() => applyStoreMigrations(db, 7)).toThrow(/already exists/);
      expect(db.prepare("PRAGMA user_version").get()).toEqual({ user_version: 7 });
      expect(db.prepare(`SELECT name FROM sqlite_schema WHERE type = 'table' AND name IN (${WORK_STORE_TABLE_NAMES.map((name) => `'${name}'`).join(",")})`).all()).toEqual([]);
      expect(readStoreSchemaJournal(db).journal.map((row) => row.version)).toEqual([3, 4, 5, 6, 7]);
    } finally {
      db.close();
    }
    expect(classifyStoreCheckpoint9State(store)).toMatchObject({ state: "supported-legacy", schemaVersion: 7 });
  });

  it("refuses a v7 Store for work store writes until a reviewed setup converts it, and never migrates on read", () => {
    seedV7();
    const root = project("legacy", { projectId: "project-old" });
    let error: unknown;
    try {
      writeWorkStore(root, () => undefined, { storeRoot: store });
    } catch (caught) {
      error = caught;
    }
    expect(error).toMatchObject({ code: "store-unavailable", nextAction: STORE_LEGACY_SCHEMA_NEXT_ACTION });
    expect(() => readWorkStore(root, () => undefined, { storeRoot: store })).toThrow(/legacy schema 7/);
    expect(classifyStoreCheckpoint9State(store)).toMatchObject({ state: "supported-legacy", schemaVersion: 7 });
  });

  it("refuses a newer schema without a write", () => {
    withStoreDatabase(store, () => undefined);
    const raw = new DatabaseSync(path.join(store, "store.db"));
    raw.exec("PRAGMA user_version=9");
    raw.close();
    const bytes = readFileSync(path.join(store, "store.db"));
    expect(classifyStoreCheckpoint9State(store)).toMatchObject({ state: "newer-unknown", schemaVersion: 9 });
    expect(() => openStoreDatabase(store)).toThrow(StoreSchemaNewerError);
    expect(() => openStoreDatabase(store)).toThrow(/schema version 9, but this CLI supports up to version 8/);
    expect(readFileSync(path.join(store, "store.db")).equals(bytes)).toBe(true);
  });

  it("reports a v8 Store set back to schema 7 as changed outside Make Docs", () => {
    withStoreDatabase(store, () => undefined);
    const raw = new DatabaseSync(path.join(store, "store.db"));
    raw.exec("PRAGMA user_version=7");
    raw.close();
    const state = classifyStoreCheckpoint9State(store);
    expect(state).toMatchObject({ state: "unknown", schemaVersion: 7, issue: { code: "changed-outside" } });
    expect("reason" in state && state.reason).toContain("The Store reports schema 7 but has the work_units table from schema 8.");
    expect("reason" in state && state.reason).toContain("its schema journal records schema 8");
    const review = new DatabaseSync(path.join(store, "store.db"), { readOnly: true });
    try {
      expect(inspectStoreGuardAndVersion(review as never).length).toBeGreaterThan(0);
    } finally {
      review.close();
    }
  });

  it("guards every work table: a connection that Make Docs did not open cannot write, and a dropped trigger is found", () => {
    withStoreDatabase(store, () => undefined);
    const raw = new DatabaseSync(path.join(store, "store.db"));
    try {
      expect(() => raw.prepare("INSERT INTO work_sync_conflicts (checkout_id,target_path,kind,file_digest,ledger_digest,store_revision,affected_unit_store_ids_json,detected_at,entry_version) VALUES ('c','a.md','unclear',NULL,NULL,1,'[]','2042-06-15T12:00:00.000Z',1)").run())
        .toThrow(/no such function/);
      raw.exec(`DROP TRIGGER ${storeWriteGuardTriggerName("work_claims", "delete")}`);
    } finally {
      raw.close();
    }
    expect(classifyStoreCheckpoint9State(store)).toMatchObject({ state: "unknown", issue: { code: "changed-outside" } });
  });
});

/* ------------------------------------------------------------------------ */

function seedProject(): { root: string; checkoutId: string } {
  const root = project("aurora", { projectId: PROJECT_ID, projectName: "aurora" });
  const checkoutId = getInstallationCheckoutId(root, store);
  return { root, checkoutId };
}

function seedUnits(root: string, units: readonly WorkUnitRecord[], claims: readonly WorkClaimRecord[] = []): void {
  writeWorkStore(root, (db) => {
    // Parents first; dependencies may point forward.
    const order = ["wave", "revision", "phase", "stage", "task", "quick-item"];
    for (const record of [...units].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))) {
      const { revision: _revision, ...input } = record;
      putWorkUnit(db, input, { expectedVersion: null });
    }
    const insert = db.prepare("INSERT INTO work_claims VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    for (const claim of claims) {
      insert.run(claim.claimId, claim.projectId, claim.unitStoreId, claim.claimant, claim.taskHandle, claim.claimedAt, claim.renewedAt, claim.expiresAt, claim.takeoverObservation);
    }
  }, { storeRoot: store });
}

describe("W29 R0 P2 Store service (T5, A6)", () => {
  it("writes and reads units with dependencies and links, and refuses a stale or repeated version", () => {
    const { root } = seedProject();
    const units = [unit("wave", "W1"), unit("revision", "W1 R0"), unit("phase", "W1 R0 P1"), unit("phase", "W1 R0 P2", { dependsOn: ["W1 R0 P1"], gates: [{ text: "Owner approval", met: false }] })];
    seedUnits(root, units);
    const read = readWorkStore(root, (db) => readWorkUnit(db, storeIdFor("W1 R0 P2")), { storeRoot: store })!;
    expect(read).toEqual(units[3]);
    writeWorkStore(root, (db) => {
      const updated = putWorkUnit(db, { ...units[3]!, links: [{ direction: "outbound", kind: "plan", path: "docs/plans/x.md", anchor: null }] }, { expectedVersion: 1 });
      expect(updated.revision).toBe(2);
      expect(updated.links).toHaveLength(1);
      expect(() => putWorkUnit(db, units[3]!, { expectedVersion: 1 })).toThrow(WorkStoreRefusalError);
      expect(() => putWorkUnit(db, units[2]!, { expectedVersion: null })).toThrow(/already exists/);
      expect(() => putWorkUnit(db, unit("phase", "W1 R0 P3", { parent: "W1" }), { expectedVersion: null })).toThrow(/needs a revision parent/);
    }, { storeRoot: store });
    const all = readWorkStore(root, (db) => listWorkUnits(db, PROJECT_ID), { storeRoot: store });
    expect(all.map((record) => [record.coordinate, record.revision])).toEqual([["W1", 1], ["W1 R0", 1], ["W1 R0 P1", 1], ["W1 R0 P2", 2]]);
  });

  it("refuses a dependency on a unit that never arrives, and the whole write rolls back", () => {
    const { root } = seedProject();
    expect(() => writeWorkStore(root, (db) => {
      putWorkUnit(db, unit("wave", "W1", { dependsOn: ["W9"] }), { expectedVersion: null });
    }, { storeRoot: store })).toThrow(/FOREIGN KEY/);
    expect(readWorkStore(root, (db) => listWorkUnits(db, PROJECT_ID), { storeRoot: store })).toEqual([]);
  });

  it("gives quick items the next plain number and never reuses a closed one", () => {
    const { root } = seedProject();
    const [first, second] = writeWorkStore(root, (db, workProject) => [
      createQuickItem(db, workProject.projectId, { title: "Compare layouts", body: null, links: [] }),
      createQuickItem(db, workProject.projectId, { title: "Check fonts", body: "Two faces", links: [] }),
    ], { storeRoot: store });
    expect([first!.coordinate, second!.coordinate]).toEqual(["1", "2"]);
    writeWorkStore(root, (db, workProject) => {
      putWorkUnit(db, { ...second!, status: "closed", closeOutcome: "done" }, { expectedVersion: 1 });
      expect(createQuickItem(db, workProject.projectId, { title: "Third", body: null, links: [] }).coordinate).toBe("3");
    }, { storeRoot: store });
  });

  it("writes the sync ledger and conflicts only with the expected entry version", () => {
    const { root, checkoutId } = seedProject();
    seedUnits(root, [unit("wave", "W1")]);
    const entry = { checkoutId, targetPath: "docs/work/w1/00-index.md", unitStoreIds: [storeIdFor("W1")], digestAlgorithm: "sha256" as const, lastAppliedDigest: "a".repeat(64), storeRevision: 1, syncedAt: NOW };
    writeWorkStore(root, (db) => {
      expect(putSyncLedgerEntry(db, entry, { expectedVersion: null }).entryVersion).toBe(1);
      expect(() => putSyncLedgerEntry(db, entry, { expectedVersion: null })).toThrow(/version-conflict|not absent/);
      expect(putSyncLedgerEntry(db, { ...entry, lastAppliedDigest: "b".repeat(64) }, { expectedVersion: 1 }).entryVersion).toBe(2);
      expect(() => deleteSyncLedgerEntry(db, checkoutId, entry.targetPath, { expectedVersion: 1 })).toThrow(WorkStoreRefusalError);
      expect(() => putSyncLedgerEntry(db, { ...entry, targetPath: "x.md", unitStoreIds: ["wu-missing00"] }, { expectedVersion: null })).toThrow(/not work units/);
      const conflict = { checkoutId, targetPath: entry.targetPath, kind: "both-changed" as const, fileDigest: "c".repeat(64), ledgerDigest: "b".repeat(64), storeRevision: 2, affectedUnitStoreIds: [storeIdFor("W1")], detectedAt: NOW };
      expect(putSyncConflict(db, conflict, { expectedVersion: null }).entryVersion).toBe(1);
      expect(listSyncConflicts(db, checkoutId).map((row) => row.conflict)).toEqual([conflict]);
      deleteSyncConflict(db, checkoutId, entry.targetPath, { expectedVersion: 1 });
      expect(listSyncConflicts(db, checkoutId)).toEqual([]);
    }, { storeRoot: store });
    expect(readWorkStore(root, (db) => readSyncLedgerEntry(db, checkoutId, entry.targetPath), { storeRoot: store })).toMatchObject({ entryVersion: 2, entry: { lastAppliedDigest: "b".repeat(64) } });
    // Another project's checkout cannot hold this project's units.
    expect(CHECKOUT_ID).not.toBe(checkoutId);
  });

  it("returns the existing typed Store results for an absent, legacy, unsafe, newer, or denied Store (A6)", () => {
    const root = project("typed", { projectId: PROJECT_ID });
    const scoped = (fn: () => unknown): StoreAccessStateError => {
      try {
        fn();
      } catch (error) {
        return scopeStoreAccessFailure(error, "work.queue.next", root) as StoreAccessStateError;
      }
      throw new Error("expected a Store failure");
    };
    const absent = scoped(() => readWorkStore(root, () => undefined, { storeRoot: store }));
    expect(absent).toMatchObject({ code: "store-unavailable" });
    expect(existsSync(store)).toBe(false);

    seedV7();
    expect(scoped(() => writeWorkStore(root, () => undefined, { storeRoot: store }))).toMatchObject({ code: "store-unavailable", nextAction: STORE_LEGACY_SCHEMA_NEXT_ACTION });

    rmSync(store, { recursive: true, force: true });
    withStoreDatabase(store, () => undefined);
    const raw = new DatabaseSync(path.join(store, "store.db"));
    raw.exec(`DROP TRIGGER ${storeWriteGuardTriggerName("work_units", "insert")}`);
    raw.close();
    expect(scoped(() => readWorkStore(root, () => undefined, { storeRoot: store }))).toMatchObject({ code: "store-unsafe" });

    rmSync(store, { recursive: true, force: true });
    withStoreDatabase(store, () => undefined);
    const newer = new DatabaseSync(path.join(store, "store.db"));
    newer.exec("PRAGMA user_version=9");
    newer.close();
    expect(scoped(() => writeWorkStore(root, () => undefined, { storeRoot: store }))).toMatchObject({ code: "store-unsafe" });

    const denied = new StoreAccessStateError("store-denied", "work.queue.next", "Denied.", "Review access.");
    expect(scopeStoreAccessFailure(denied, "work.queue.next", root)).toBe(denied);
  });
});

/* ------------------------------------------------------------------------ */

describe("W29 R0 P2 claims (A7, A8)", () => {
  it("allows one claim row for each unit in the schema itself", () => {
    const { root } = seedProject();
    seedUnits(root, [unit("wave", "W1")]);
    writeWorkStore(root, (db) => {
      const insert = db.prepare("INSERT INTO work_claims VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
      insert.run("wc-first000", PROJECT_ID, storeIdFor("W1"), "builder-a", "task-a", NOW, NOW, "2042-06-15T12:30:00.000Z", null);
      expect(() => insert.run("wc-second00", PROJECT_ID, storeIdFor("W1"), "builder-b", "task-b", NOW, NOW, "2042-06-15T12:30:00.000Z", null))
        .toThrow(/UNIQUE constraint failed: work_claims.unit_store_id/);
      expect(() => insert.run("wc-third000", PROJECT_ID, storeIdFor("W1"), "builder-c", null, NOW, "2042-06-15T13:00:00.000Z", "2042-06-15T12:30:00.000Z", null))
        .toThrow(/CHECK constraint failed/);
    }, { storeRoot: store });
  });

  it("refuses a plain claim on an expired claim, and allows a takeover after a handle check", () => {
    const { root } = seedProject();
    seedUnits(root, [unit("wave", "W1"), unit("revision", "W1 R0"), unit("phase", "W1 R0 P1")]);
    const p1 = storeIdFor("W1 R0 P1");
    const request = { unitStoreId: p1, claimant: "builder-a", taskHandle: "task-a", ttlSeconds: 20 * 60, expectedVersion: 1, takeover: null };
    writeWorkStore(root, (db) => {
      const first = claimWorkUnit(db, request, { now: new Date("2042-06-15T10:00:00.000Z") });
      expect(first).toMatchObject({ result: "claimed", claim: { expiresAt: "2042-06-15T10:20:00.000Z" } });
      expect(claimWorkUnit(db, { ...request, claimant: "builder-b" }, { now: new Date("2042-06-15T10:10:00.000Z") })).toMatchObject({ result: "refused", refusal: "already-claimed" });
      expect(claimWorkUnit(db, request, { now: new Date("2042-06-15T10:10:00.000Z") })).toMatchObject({ result: "renewed", claim: { renewedAt: "2042-06-15T10:10:00.000Z", expiresAt: "2042-06-15T10:30:00.000Z" } });
      const later = new Date("2042-06-15T11:00:00.000Z");
      expect(claimWorkUnit(db, { ...request, claimant: "builder-b" }, { now: later })).toMatchObject({ result: "refused", refusal: "takeover-needs-handle-check" });
      // The holder of an expired claim is a stale claimant and cannot renew it either.
      expect(claimWorkUnit(db, request, { now: later })).toMatchObject({ result: "refused", refusal: "takeover-needs-handle-check" });
      const previousClaimId = first.claim!.claimId;
      expect(claimWorkUnit(db, { ...request, claimant: "builder-b", takeover: { previousClaimId, handleObservation: "running" } }, { now: later })).toMatchObject({ refusal: "previous-holder-still-working" });
      expect(claimWorkUnit(db, { ...request, claimant: "builder-b", takeover: { previousClaimId: "wc-other0000", handleObservation: "stopped" } }, { now: later })).toMatchObject({ refusal: "version-conflict" });
      const taken = claimWorkUnit(db, { ...request, claimant: "builder-b", taskHandle: "task-b", takeover: { previousClaimId, handleObservation: "stopped" } }, { now: later });
      expect(taken).toMatchObject({ result: "claimed", claim: { claimant: "builder-b", takeoverObservation: "stopped" } });
      expect(taken.claim!.claimId).not.toBe(previousClaimId);
      expect(checkWorkUnitWriteClaim(db, p1, previousClaimId, later)).toBe("not-claim-holder");
      expect(checkWorkUnitWriteClaim(db, p1, null, later)).toBe("not-claim-holder");
      expect(checkWorkUnitWriteClaim(db, p1, taken.claim!.claimId, later)).toBeNull();
      expect(checkWorkUnitWriteClaim(db, p1, taken.claim!.claimId, new Date("2042-06-16T00:00:00.000Z"))).toBe("claim-expired");
      expect(claimWorkUnit(db, { ...request, expectedVersion: 4 }, { now: later })).toMatchObject({ refusal: "version-conflict" });
    }, { storeRoot: store });
  });

  it("refuses a takeover when the old claim has no task handle; a release clears it", () => {
    const { root } = seedProject();
    seedUnits(root, [unit("wave", "W1")]);
    const w1 = storeIdFor("W1");
    writeWorkStore(root, (db) => {
      const first = claimWorkUnit(db, { unitStoreId: w1, claimant: "builder-a", taskHandle: null, ttlSeconds: null, expectedVersion: 1, takeover: null }, { now: new Date("2042-06-15T10:00:00.000Z") });
      const later = new Date("2042-06-15T11:00:00.000Z");
      expect(claimWorkUnit(db, { unitStoreId: w1, claimant: "builder-b", taskHandle: null, ttlSeconds: null, expectedVersion: 1, takeover: { previousClaimId: first.claim!.claimId, handleObservation: "not-found" } }, { now: later }))
        .toMatchObject({ refusal: "no-handle-to-check" });
      expect(releaseWorkClaim(db, { unitStoreId: w1, claimId: "wc-other0000", expectedVersion: 1 })).toEqual({ accepted: false, refusal: "not-claim-holder" });
      expect(releaseWorkClaim(db, { unitStoreId: w1, claimId: first.claim!.claimId, expectedVersion: 1 })).toEqual({ accepted: true, refusal: null });
      expect(readWorkClaim(db, w1)).toBeNull();
    }, { storeRoot: store });
  });

  it("closes a claimed unit only through its holder, and removes the claim when it closes", () => {
    const { root } = seedProject();
    seedUnits(root, [unit("wave", "W1")]);
    const w1 = storeIdFor("W1");
    writeWorkStore(root, (db) => {
      const held = claimWorkUnit(db, { unitStoreId: w1, claimant: "builder-a", taskHandle: "t", ttlSeconds: null, expectedVersion: 1, takeover: null }, { now: LATER_NOW });
      const closed = { ...readWorkUnit(db, w1)!, status: "closed" as const, closeOutcome: "done" as const };
      const refusal = (fn: () => unknown) => {
        try { fn(); } catch (error) { return (error as WorkStoreRefusalError).refusal; }
        return null;
      };
      // A caller without the claim, or with another claim ID, cannot close a unit with a live claim.
      expect(refusal(() => putWorkUnit(db, closed, { expectedVersion: 1, now: LATER_NOW }))).toBe("not-claim-holder");
      expect(refusal(() => putWorkUnit(db, closed, { expectedVersion: 1, claimId: "wc-other0000", now: LATER_NOW }))).toBe("not-claim-holder");
      // The holder of a claim that expired gets claim-expired.
      const afterExpiry = new Date("2042-06-15T13:00:00.000Z");
      expect(refusal(() => putWorkUnit(db, closed, { expectedVersion: 1, claimId: held.claim!.claimId, now: afterExpiry }))).toBe("claim-expired");
      expect(readWorkUnit(db, w1)).toMatchObject({ status: "open", revision: 1 });
      expect(readWorkClaim(db, w1)).not.toBeNull();
      // The holder closes it, and the claim goes with the close.
      putWorkUnit(db, closed, { expectedVersion: 1, claimId: held.claim!.claimId, now: LATER_NOW });
      expect(readWorkClaim(db, w1)).toBeNull();
    }, { storeRoot: store });
  });

  it("lets any caller close a unit whose claim expired, as a report may (R-WORK-QUEUE-8)", () => {
    const { root } = seedProject();
    seedUnits(root, [unit("wave", "W1")]);
    const w1 = storeIdFor("W1");
    writeWorkStore(root, (db) => {
      claimWorkUnit(db, { unitStoreId: w1, claimant: "builder-a", taskHandle: "t", ttlSeconds: null, expectedVersion: 1, takeover: null }, { now: LATER_NOW });
      putWorkUnit(db, { ...readWorkUnit(db, w1)!, status: "closed", closeOutcome: "cancelled" }, { expectedVersion: 1, now: new Date("2042-06-15T13:00:00.000Z") });
      expect(readWorkClaim(db, w1)).toBeNull();
    }, { storeRoot: store });
  });

  it("renews from the later time when the clock goes back, with no raw CHECK error", () => {
    const { root } = seedProject();
    seedUnits(root, [unit("wave", "W1")]);
    const request = { unitStoreId: storeIdFor("W1"), claimant: "builder-a", taskHandle: "t", ttlSeconds: 30 * 60, expectedVersion: 1, takeover: null };
    writeWorkStore(root, (db) => {
      claimWorkUnit(db, request, { now: new Date("2042-06-15T10:00:00.000Z") });
      const renewed = claimWorkUnit(db, request, { now: new Date("2042-06-15T09:50:00.000Z") });
      expect(renewed).toMatchObject({
        result: "renewed",
        claim: { claimedAt: "2042-06-15T10:00:00.000Z", renewedAt: "2042-06-15T10:00:00.000Z", expiresAt: "2042-06-15T10:30:00.000Z" },
      });
    }, { storeRoot: store });
  });

  const claimFixtures = WORK_STORE_CONTRACT_FIXTURES.filter((fixture) => fixture.kind === "claim");
  it.each(claimFixtures.filter((fixture) => fixture.expected.refusal !== "not-ready").map((fixture) => [fixture.id, fixture] as const))(
    "%s gives the P1 claim answer from the Store service",
    (_id, fixture) => {
      const { root } = seedProject();
      seedUnits(root, fixture.input.units, fixture.input.claims);
      const outcome = writeWorkStore(root, (db) => claimWorkUnit(db, fixture.input.request, { now: new Date(fixture.input.now) }), { storeRoot: store });
      expect({ result: outcome.result, refusal: outcome.refusal }).toEqual(fixture.expected);
    },
  );

  it("leaves the readiness refusal to the work queue", () => {
    // WSF-015 expects `not-ready`. Readiness is the W29 R0 P4 work queue rule; the Store service checks only the claim table.
    expect(claimFixtures.filter((fixture) => fixture.expected.refusal === "not-ready").map((fixture) => fixture.id)).toEqual(["WSF-015"]);
  });
});

/* ------------------------------------------------------------------------ */

describe("W29 R0 P2 R-MIN parity (T8, A9)", () => {
  function physical() {
    return withStoreDatabase(store, (db) => readPhysicalStoreSchema(db)).tables;
  }

  it("matches the work store tables, the column register, and the PRD 38 R-MIN rows", () => {
    expect(workStoreSchemaDrift(physical(), R_MIN_ROWS)).toEqual([]);
  });

  it("covers every P1 field register phrase with a physical column", () => {
    const held = new Set(Object.values(WORK_STORE_COLUMN_REGISTER).flatMap((table) => Object.values(table).map((entry) => `${WORK_STORE_RMIN_ROWS[entry.row]}|${entry.phrase}`)));
    for (const row of WORK_STORE_FIELD_REGISTER.filter((entry) => entry.rowLabel !== "Project config `work` and `factory` blocks")) {
      for (const phrase of Object.values(row.fields)) expect(held.has(`${row.rowLabel}|${phrase}`), `${row.rowLabel}: ${phrase}`).toBe(true);
    }
  });

  it("fails when a column is removed from the physical schema", () => {
    const tables = physical();
    const withoutColumn = { ...tables, work_claims: tables.work_claims!.filter((column) => column !== "takeover_observation") };
    expect(workStoreSchemaDrift(withoutColumn, R_MIN_ROWS).join("\n")).toContain('R-MIN field "takeover handle observation" of "Work claims" has no physical column.');
    const extraColumn = { ...tables, work_units: [...tables.work_units!, "priority"] };
    expect(workStoreSchemaDrift(extraColumn, R_MIN_ROWS).join("\n")).toContain("Column work_units.priority has no R-MIN field");
  });

  it("fails when a field is removed from the R-MIN row", () => {
    const removed = R_MIN_ROWS.map((row) => (row.label.startsWith("Work sync ledger") ? { ...row, label: row.label.replace(", sync time", "") } : row));
    expect(rMinRowFieldPhrases(removed.find((row) => row.label.startsWith("Work sync ledger"))!.label)).not.toContain("sync time");
    expect(workStoreSchemaDrift(physical(), removed).join("\n")).toContain('Physical columns hold "sync time", but the R-MIN row "Work sync ledger" does not name it.');
  });

  it("fails when the column register loses a column", () => {
    const { blockers_json: _dropped, ...units } = WORK_STORE_COLUMN_REGISTER.work_units;
    const register = { ...WORK_STORE_COLUMN_REGISTER, work_units: units };
    const drift = workStoreSchemaDrift(physical(), R_MIN_ROWS, register).join("\n");
    expect(drift).toContain("Column work_units.blockers_json has no R-MIN field");
    expect(drift).toContain('R-MIN field "blockers" of "Work store records (schema v8)" has no physical column.');
  });
});

/* ------------------------------------------------------------------------ */

describe("W29 R0 P2 project resolution through project_register (T9, A33)", () => {
  it("resolves by name or ID, and a renamed project only by its new name", () => {
    const { root } = seedProject();
    seedUnits(root, [unit("wave", "W1")]);
    readWorkStore(root, (db) => {
      expect(resolveWorkProject(db, "aurora")).toEqual({ projectId: PROJECT_ID, projectName: "aurora" });
      expect(resolveWorkProject(db, { kind: "id", value: PROJECT_ID })).toEqual({ projectId: PROJECT_ID, projectName: "aurora" });
      // A project ID that has the name form still resolves, because register writes refuse a name that is another project's ID.
      expect(resolveWorkProject(db, PROJECT_ID)).toEqual({ projectId: PROJECT_ID, projectName: "aurora" });
      expect(resolveWorkProject(db, "borealis")).toBeNull();
    }, { storeRoot: store });

    writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\nprojectName: borealis\n`);
    // The next work store write records the new name in the same transaction.
    writeWorkStore(root, () => undefined, { storeRoot: store });
    readWorkStore(root, (db) => {
      expect(resolveWorkProject(db, "borealis")).toEqual({ projectId: PROJECT_ID, projectName: "borealis" });
      expect(resolveWorkProject(db, "aurora")).toBeNull();
      expect(resolveWorkProject(db, { kind: "id", value: "aurora" })).toBeNull();
      expect(listWorkUnits(db, resolveWorkProject(db, "borealis")!.projectId).map((record) => record.coordinate)).toEqual(["W1"]);
    }, { storeRoot: store });
    // No second project name record: only project_register holds names.
    withStoreDatabase(store, (db) => {
      const nameColumns = (db.prepare("SELECT m.name AS tbl, p.name AS col FROM sqlite_schema m JOIN pragma_table_info(m.name) p WHERE m.type = 'table' AND p.name LIKE '%project_name%'").all() as Array<{ tbl: string }>).map((row) => row.tbl);
      expect(nameColumns).toEqual(["project_register"]);
    });
  });

  it("refuses work writes for a project without a register row", () => {
    seedProject();
    withStoreDatabase(store, (db) => {
      expect(() => putWorkUnit(db, { ...unit("wave", "W1"), projectId: "unknown-project" }, { expectedVersion: null })).toThrow(/project register/);
    });
  });
});

/* ------------------------------------------------------------------------ */

describe("W29 R0 P2 review fixes", () => {
  it("refuses a write for another project inside a project's write session", () => {
    const { root } = seedProject();
    const other = project("borealis", { projectId: "borealis-project", projectName: "borealis" });
    getInstallationCheckoutId(other, store);
    seedUnits(other, [{ ...unit("wave", "W1"), projectId: "borealis-project", storeId: "wu-borealis1" }]);
    writeWorkStore(root, (db) => {
      const refusal = (fn: () => unknown) => {
        try { fn(); } catch (error) { return error instanceof WorkStoreRefusalError ? error.refusal : String(error); }
        return null;
      };
      expect(refusal(() => putWorkUnit(db, { ...unit("wave", "W2"), projectId: "borealis-project", storeId: "wu-borealis2" }, { expectedVersion: null }))).toBe("project-mismatch");
      expect(refusal(() => claimWorkUnit(db, { unitStoreId: "wu-borealis1", claimant: "builder-a", taskHandle: "t", ttlSeconds: null, expectedVersion: 1, takeover: null }, { now: LATER_NOW }))).toBe("project-mismatch");
      expect(refusal(() => releaseWorkClaim(db, { unitStoreId: "wu-borealis1", claimId: "wc-any000000", expectedVersion: 1 }))).toBe("project-mismatch");
      // The session's own project still writes.
      expect(putWorkUnit(db, unit("wave", "W1"), { expectedVersion: null }).projectId).toBe(PROJECT_ID);
    }, { storeRoot: store });
    readWorkStore(root, (db) => {
      expect(listWorkUnits(db, "borealis-project").map((record) => record.storeId)).toEqual(["wu-borealis1"]);
    }, { storeRoot: store });
  });

  it("refuses a `..` path segment in the table CHECK too, under the service's own check", () => {
    const { root, checkoutId } = seedProject();
    seedUnits(root, [unit("wave", "W1")]);
    writeWorkStore(root, (db) => {
      // The service refuses it first.
      expect(() => putWorkUnit(db, { ...unit("phase", "W1 R0 P1", { parent: "W1" }), kind: "revision", coordinate: "W1 R0", sourcePath: "docs/../secret.md" }, { expectedVersion: null })).toThrow(WorkStoreRefusalError);
      // A direct insert on a Make Docs connection meets the table CHECK.
      const unitInsert = db.prepare(
        "INSERT INTO work_units VALUES (?, ?, 'revision', 'W1 R0', ?, 't', NULL, NULL, 'open', NULL, '[]', '[]', '[]', ?, 'kept', 1)",
      );
      for (const bad of ["../x.md", "docs/../x.md", "docs/work/.."]) {
        expect(() => unitInsert.run(PROJECT_ID, "wu-badpath00", storeIdFor("W1"), bad), bad).toThrow(/CHECK constraint failed/);
      }
      unitInsert.run(PROJECT_ID, "wu-goodpath0", storeIdFor("W1"), "docs/work/..x/a.md");
      expect(() => db.prepare("INSERT INTO work_links VALUES (?, 0, 'outbound', 'plan', 'docs/../x.md', NULL)").run(storeIdFor("W1"))).toThrow(/CHECK constraint failed/);
      expect(() => db.prepare("INSERT INTO work_sync_ledger VALUES (?, 'docs/work/../x.md', ?, 'sha256', ?, 1, ?, 1)").run(checkoutId, JSON.stringify([storeIdFor("W1")]), "a".repeat(64), NOW)).toThrow(/CHECK constraint failed/);
      db.prepare("DELETE FROM work_units WHERE store_id = 'wu-goodpath0'").run();
    }, { storeRoot: store });
  });
});
