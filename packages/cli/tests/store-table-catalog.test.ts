import { readFileSync } from "node:fs";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BACKLOG_RULE_CATALOG_VERSION } from "../src/operations/work/backlog/catalog";
import { BACKLOG_REVIEW_SKILL_VERSION } from "../src/operations/work/backlog/cache-key";
import { BACKLOG_REVIEW_CACHE_MAX_ENTRIES_PER_CHECKOUT } from "../src/operations/work/backlog/cache-service";
import { BACKLOG_SNAPSHOT_SCHEMA_VERSION } from "../src/operations/work/backlog/schemas";
import { CURRENT_STORE_SCHEMA_VERSION, loadSqliteDriver, withStoreDatabase } from "../src/store/database";
import {
  STORE_BLOCKING_LEFTOVERS,
  STORE_DECISION_ITEMS,
  STORE_FIXED_RULES,
  STORE_FIXED_RULE_IDS,
  STORE_FOLLOW_UPS,
  STORE_PLANNED_OPERATION_RECEIPT_COLUMNS,
  STORE_RULE_WRITE_CONTRACT,
  STORE_SAVED_BYTE_KEYS,
  STORE_TERMINAL_INSTALLATION_STATUSES,
  STORE_MAINTENANCE_PROOFS,
  STORE_MAINTENANCE_SETTINGS,
  STORE_MIGRATION_RECORD_KIND_CATALOG,
  STORE_MIGRATION_RECORD_KINDS,
  STORE_NON_TABLE_RMIN_ROWS,
  STORE_RECORD_CLASSES,
  STORE_TABLE_CATALOG,
  STORE_TABLE_CATALOG_PHYSICAL_SCHEMA_VERSION,
  STORE_TABLE_NAMES,
  classifyMigrationRecord,
  parseStoreRMinRows,
  readPhysicalStoreSchema,
  storeCatalogDrift,
  storeMaintenanceParametersFor,
  storeMaintenanceSqlParameters,
  storeTableCatalogDigest,
  type StorePhysicalSchema,
} from "../src/store/table-catalog";
import { PACKAGE_ROOT } from "../src/utils";
import {
  FIXTURE_DEAD_PID,
  FIXTURE_HOST,
  FIXTURE_LIVE_PID,
  FIXTURE_OTHER_HOST,
  FIXTURE_VERSIONS,
  STORE_MAINTENANCE_FIXTURES,
  evaluateStoreFixture,
  fixtureLiveness,
  makeFixtureEnv,
} from "./fixtures/store-maintenance-contract";
import { cleanupTempDir, createTempDir } from "./helpers";

const REPO_ROOT = path.resolve(PACKAGE_ROOT, "../..");
const PRD_38 = readFileSync(path.join(REPO_ROOT, "docs/prd/38-global-store-and-project-state.md"), "utf8");
const R_MIN_ROWS = parseStoreRMinRows(PRD_38);
const sqliteAvailable = loadSqliteDriver().available;

function section(start: string, end: string): string {
  const from = PRD_38.indexOf(start);
  const to = PRD_38.indexOf(end, from);
  expect(from, start).toBeGreaterThanOrEqual(0);
  expect(to, end).toBeGreaterThan(from);
  return PRD_38.slice(from, to);
}

let tempRoot: string;
beforeEach(() => { tempRoot = createTempDir("make-docs-store-catalog-"); });
afterEach(() => { cleanupTempDir(tempRoot); });

function readFreshSchema(): StorePhysicalSchema {
  return withStoreDatabase(path.join(tempRoot, "store"), (db) => readPhysicalStoreSchema(db));
}

describe("W32 R0 P1 table catalog (A1)", () => {
  it("has one entry for each table, in the table name list", () => {
    expect(STORE_TABLE_CATALOG.map((entry) => entry.table)).toEqual([...STORE_TABLE_NAMES]);
    expect(STORE_TABLE_CATALOG.filter((entry) => entry.schemaStatus === "physical")).toHaveLength(17);
    expect(STORE_TABLE_CATALOG.filter((entry) => entry.schemaStatus === "planned").map((entry) => entry.table)).toEqual(["project_register"]);
  });

  it("fills every field of every table entry", () => {
    for (const entry of STORE_TABLE_CATALOG) {
      for (const field of ["purpose", "retention", "humanMeaning"] as const) {
        expect(entry[field].trim().length, `${entry.table}.${field}`).toBeGreaterThan(0);
      }
      expect(entry.columns.length, entry.table).toBeGreaterThan(0);
      expect(entry.writers.length, entry.table).toBeGreaterThan(0);
      expect(entry.readers.length, entry.table).toBeGreaterThan(0);
      expect(entry.rMinRows.length, entry.table).toBeGreaterThan(0);
      entry.rMinRows.forEach((claim) => expect(claim.classCell.trim().length, `${entry.table} ${claim.row}`).toBeGreaterThan(0));
      expect(entry.rowClasses.length, entry.table).toBeGreaterThan(0);
      expect([...STORE_RECORD_CLASSES, "declared per kind"]).toContain(entry.recordClass);
      expect(entry.sinceSchema, entry.table).toBeGreaterThanOrEqual(1);
    }
  });

  it("uses the R-MIN-1 record classes exactly as PRD 38 names them", () => {
    const rMin1 = section("- R-MIN-1 (MUST)", "- R-MIN-2 (MUST)");
    for (const recordClass of STORE_RECORD_CLASSES) expect(rMin1).toContain(`\`${recordClass}\``);
  });

  it("ties every row class to a rule only when it is bounded or disposable", () => {
    for (const entry of STORE_TABLE_CATALOG) {
      for (const rowClass of entry.rowClasses) {
        if (rowClass.maintenanceClass === "keep") expect(rowClass.rule, `${entry.table}: ${rowClass.rows}`).toBeNull();
        if (rowClass.maintenanceClass === "disposable") expect(rowClass.rule, `${entry.table}: ${rowClass.rows}`).not.toBeNull();
        if (rowClass.maintenanceClass === "bounded") expect(rowClass.rule ?? rowClass.limit, `${entry.table}: ${rowClass.rows}`).not.toBeNull();
        if (rowClass.rule) {
          const rule = STORE_FIXED_RULES.find((candidate) => candidate.id === rowClass.rule)!;
          expect(rule.candidates.map((query) => query.table), `${entry.table} ${rule.id}`).toContain(entry.table);
        }
      }
    }
    expect(BACKLOG_REVIEW_CACHE_MAX_ENTRIES_PER_CHECKOUT).toBe(512);
  });

  it("names a decision item only where the item reads that table", () => {
    for (const entry of STORE_TABLE_CATALOG) {
      for (const id of entry.decisionItems) expect(STORE_DECISION_ITEMS.map((item) => item.id)).toContain(id);
    }
  });
});

describe("W32 R0 P1 migration record kinds (A1)", () => {
  it("has one entry for each kind, with families that each name a class and retention", () => {
    expect(STORE_MIGRATION_RECORD_KIND_CATALOG.map((entry) => entry.kind)).toEqual([...STORE_MIGRATION_RECORD_KINDS]);
    const familyIds = STORE_MIGRATION_RECORD_KIND_CATALOG.flatMap((entry) => entry.families.map((family) => family.id));
    expect(new Set(familyIds).size).toBe(familyIds.length);
    for (const entry of STORE_MIGRATION_RECORD_KIND_CATALOG) {
      expect(entry.purpose.trim().length).toBeGreaterThan(0);
      expect(entry.readers.length).toBeGreaterThan(0);
      expect(entry.families.length).toBeGreaterThan(0);
      expect(STORE_RECORD_CLASSES).toContain(entry.recordClass);
      for (const family of entry.families) {
        expect(family.writers.length, family.id).toBeGreaterThan(0);
        expect(family.retention.trim().length, family.id).toBeGreaterThan(0);
        if (family.maintenanceClass === "keep") expect(family.rule, family.id).toBeNull();
        else expect(family.rule, family.id).not.toBeNull();
        if (family.rule) {
          const rule = STORE_FIXED_RULES.find((candidate) => candidate.id === family.rule)!;
          expect(rule.candidates.map((query) => query.table), family.id).toContain("installation_migration_records");
        }
      }
    }
  });

  it("classifies record IDs from the current writers", () => {
    const harness = JSON.stringify({ scope: "project", harnessId: "claude", connectionMethod: "skill" });
    const cases: Array<[string, string, string, string | null]> = [
      ["receipt", `sha256:${"a".repeat(64)}`, "{}", "migration-receipt"],
      ["receipt", "checkout-move:3f1c", "{}", "checkout-move-receipt"],
      ["receipt", "harness-receipt-current:project:claude:skill", harness, "harness-receipt-current"],
      ["receipt", `harness-receipt-observation:${"b".repeat(32)}`, harness, "harness-receipt-observation"],
      ["receipt", "00000000-0000-4000-8000-000000000001", harness, "harness-receipt"],
      ["receipt", "00000000-0000-4000-8000-000000000001", "{}", null],
      ["quiescence", "legacy", "{}", "legacy-quiescence"],
      ["snapshot", "detached:op", "{}", "detached-plan"],
      ["snapshot", "detached-original:op", "{}", "detached-original-plan"],
      ["snapshot", `sha256:${"c".repeat(64)}`, "{}", "migration-snapshot"],
      ["backup", "atomic:op:3", "{}", "atomic-write-intent"],
      ["backup", "2042-06-01T00-00-00-000Z", "{}", "migration-backup"],
      ["legacy-import", "w22-p5:checkout-object-numbers:v4", "{}", "bridge-evidence"],
      ["legacy-import", "import-1", "{}", "legacy-import-receipt"],
      ["unknown-kind", "x", "{}", null],
    ];
    for (const [kind, recordId, json, family] of cases) {
      expect(classifyMigrationRecord(kind, recordId, json), `${kind} ${recordId}`).toBe(family);
    }
  });
});

describe("W32 R0 P1 drift test (A2)", () => {
  it.skipIf(!sqliteAvailable)("matches the physical schema and the PRD 38 R-MIN rows", () => {
    expect(CURRENT_STORE_SCHEMA_VERSION).toBe(STORE_TABLE_CATALOG_PHYSICAL_SCHEMA_VERSION);
    const physical = readFreshSchema();
    expect(R_MIN_ROWS.length).toBeGreaterThan(30);
    expect(storeCatalogDrift(physical, R_MIN_ROWS)).toEqual([]);
    for (const entry of STORE_TABLE_CATALOG.filter((candidate) => candidate.schemaStatus === "planned")) {
      expect(entry.sinceSchema).toBeGreaterThan(CURRENT_STORE_SCHEMA_VERSION);
      expect(physical.tables[entry.table]).toBeUndefined();
    }
  });

  it.skipIf(!sqliteAvailable)("fails when a table, a column, or a kind changes on one side only", () => {
    const physical = readFreshSchema();
    const extraTable = { ...physical, tables: { ...physical.tables, surprise_table: ["id"] } };
    expect(storeCatalogDrift(extraTable, R_MIN_ROWS).join("\n")).toContain("surprise_table is in the schema but not in the catalog");
    const { projects: _dropped, ...withoutProjects } = physical.tables;
    expect(storeCatalogDrift({ ...physical, tables: withoutProjects }, R_MIN_ROWS).join("\n")).toContain("projects is in the catalog but not in the schema");
    const extraColumn = { ...physical, tables: { ...physical.tables, runs: [...physical.tables.runs!, "extra"] } };
    expect(storeCatalogDrift(extraColumn, R_MIN_ROWS).join("\n")).toContain("Table runs columns differ");
    const extraKind = { ...physical, migrationRecordKinds: [...physical.migrationRecordKinds, "journal"] };
    expect(storeCatalogDrift(extraKind, R_MIN_ROWS).join("\n")).toContain("Record kinds differ");
    const plannedNowPhysical = { ...physical, tables: { ...physical.tables, project_register: ["project_id", "project_name", "first_seen_at", "last_seen_at"] } };
    expect(storeCatalogDrift(plannedNowPhysical, R_MIN_ROWS).join("\n")).toContain("project_register is in the schema but the catalog marks it planned");
    const fewerKinds = STORE_MIGRATION_RECORD_KINDS.filter((kind) => kind !== "backup");
    expect(storeCatalogDrift(physical, R_MIN_ROWS, { tables: STORE_TABLE_CATALOG, nonTableRows: STORE_NON_TABLE_RMIN_ROWS, kinds: fewerKinds }).join("\n")).toContain("Record kinds differ");
  });

  it.skipIf(!sqliteAvailable)("fails when an R-MIN row is added, removed, or reclassed on one side only", () => {
    const physical = readFreshSchema();
    const added = [...R_MIN_ROWS, { label: "`surprise_table`: id", classCell: "Historical evidence" }];
    expect(storeCatalogDrift(physical, added).join("\n")).toContain("has no catalog entry");
    const removed = R_MIN_ROWS.filter((row) => !row.label.startsWith("`runs`:"));
    expect(storeCatalogDrift(physical, removed).join("\n")).toContain('R-MIN row "`runs`:" (runs) matches 0 PRD 38 rows');
    const reclassed = R_MIN_ROWS.map((row) => (row.label.startsWith("`installation_locks`:") ? { ...row, classCell: "Historical evidence" } : row));
    expect(storeCatalogDrift(physical, reclassed).join("\n")).toContain("`installation_locks`:\" class differs");
    // A second row of one table and a row outside the tables are checked too.
    for (const label of ["`installation_checkouts.root_path`", "Target project last-applied ownership", "Work claims"]) {
      const changed = R_MIN_ROWS.map((row) => (row.label.startsWith(label) ? { ...row, classCell: "Historical evidence" } : row));
      expect(storeCatalogDrift(physical, changed).join("\n"), label).toContain(`${label}" class differs`);
    }
    const withoutWorkClaims = R_MIN_ROWS.filter((row) => !row.label.startsWith("Work claims"));
    expect(storeCatalogDrift(physical, withoutWorkClaims).join("\n")).toContain("Work claims");
  });
});

describe("W32 R0 P1 fixed rules and decision items", () => {
  it("states every R-MAINT-3 bullet as at least one rule, in order", () => {
    const rMaint3 = section("- R-MAINT-3 (MUST)", "- R-MAINT-4 (MUST)");
    const bullets = rMaint3.split("\n").filter((line) => line.startsWith("  - ")).map((line) => line.slice(4));
    expect(bullets).toHaveLength(9);
    expect(STORE_FIXED_RULES.map((rule) => rule.id)).toEqual([...STORE_FIXED_RULE_IDS]);
    for (const rule of STORE_FIXED_RULES) {
      expect(bullets.some((bullet) => bullet.startsWith(rule.prdBullet)), rule.id).toBe(true);
    }
    for (const bullet of bullets) {
      expect(STORE_FIXED_RULES.some((rule) => bullet.startsWith(rule.prdBullet)), bullet).toBe(true);
    }
  });

  it("states every R-MAINT-4 decision item", () => {
    const rMaint4 = section("- R-MAINT-4 (MUST)", "- R-MAINT-5 (MUST)");
    for (const item of STORE_DECISION_ITEMS) {
      expect(rMaint4, item.id).toContain(item.prdPhrase);
      expect(item.reasonText.trim().length).toBeGreaterThan(0);
      expect(item.nextAction.trim().length).toBeGreaterThan(0);
      expect(item.condition.length).toBeGreaterThan(0);
    }
  });

  it("gives every rule a condition, an effect, a plain meaning, and known proofs and settings", () => {
    const proofs = new Set(STORE_MAINTENANCE_PROOFS.map((proof) => proof.id));
    for (const target of [...STORE_FIXED_RULES, ...STORE_DECISION_ITEMS]) {
      expect(target.condition.length, target.id).toBeGreaterThan(0);
      expect(target.candidates.length, target.id).toBeGreaterThan(0);
      target.proofs.forEach((proof) => expect(proofs.has(proof), `${target.id} ${proof}`).toBe(true));
      target.settings.forEach((setting) => expect(STORE_MAINTENANCE_SETTINGS[setting], `${target.id} ${setting}`).toBeDefined());
    }
    for (const rule of STORE_FIXED_RULES) {
      expect(rule.effect.trim().length, rule.id).toBeGreaterThan(0);
      expect(rule.humanMeaning.trim().length, rule.id).toBeGreaterThan(0);
      const referenced = STORE_TABLE_CATALOG.some((entry) => entry.rowClasses.some((rowClass) => rowClass.rule === rule.id))
        || STORE_MIGRATION_RECORD_KIND_CATALOG.some((entry) => entry.families.some((family) => family.rule === rule.id));
      expect(referenced, `${rule.id} is named by a table row class or record family`).toBe(true);
    }
  });

  it.skipIf(!sqliteAvailable)("uses only read-only candidate queries that run on a fresh Store", () => {
    const parameters = storeMaintenanceSqlParameters(new Date("2042-06-15T12:00:00.000Z"), FIXTURE_VERSIONS);
    withStoreDatabase(path.join(tempRoot, "store"), (db) => {
      for (const target of [...STORE_FIXED_RULES, ...STORE_DECISION_ITEMS]) {
        for (const [index, query] of target.candidates.entries()) {
          expect(query.sql.trim(), target.id).toMatch(/^(SELECT|WITH)\b/);
          expect(query.sql.replace(/'[^']*'/g, "''"), target.id).not.toMatch(/\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|PRAGMA|ATTACH)\b/i);
          const statement = db.prepare(query.sql);
          expect(statement.all(storeMaintenanceParametersFor(query.sql, parameters)), target.id).toEqual([]);
          const columns = statement.columns().map((column) => column.name);
          query.key.forEach((key) => expect(columns, `${target.id} key ${key}`).toContain(key));
          if ("recheck" in target) {
            const recheck = target.recheck.columnsByQuery[index]!;
            recheck.forEach((column) => expect(columns, `${target.id} query ${index} recheck ${column}`).toContain(column));
          }
        }
      }
    });
  });

  it("never treats a failed operation as terminal", () => {
    expect([...STORE_TERMINAL_INSTALLATION_STATUSES]).toEqual(["completed", "rolled-back"]);
    for (const target of [...STORE_FIXED_RULES, ...STORE_DECISION_ITEMS]) {
      for (const query of target.candidates) {
        for (const match of query.sql.matchAll(/status IN \(([^)]*)\)/g)) {
          if (match[1]!.includes("'completed'")) expect(match[1], target.id).not.toContain("'failed'");
        }
      }
    }
  });

  it("marks rules 002, 004, 005, and 006 inactive until their follow-ups, and keeps the rest active", () => {
    const followUps = new Map(STORE_FOLLOW_UPS.map((followUp) => [followUp.id, followUp]));
    const inactive = STORE_FIXED_RULES.filter((rule) => rule.activation.state === "inactive");
    expect(inactive.map((rule) => rule.id)).toEqual(["STORE-RULE-002", "STORE-RULE-004", "STORE-RULE-005", "STORE-RULE-006"]);
    for (const rule of inactive) {
      if (rule.activation.state !== "inactive") continue;
      const followUp = followUps.get(rule.activation.until);
      expect(followUp, rule.id).toBeDefined();
      expect(followUp!.unblocks, rule.id).toContain(rule.id);
      expect(rule.activation.reason.trim().length).toBeGreaterThan(0);
    }
    expect(followUps.has("FOLLOW-UP-P2-FAILED-RECOVERY-CLOSED")).toBe(true);
    expect(followUps.has("FOLLOW-UP-P3-DELETE-PROJECT-ROWS")).toBe(true);
    expect(STORE_PLANNED_OPERATION_RECEIPT_COLUMNS.map((column) => column.column)).toEqual(["before_ledger_digest", "after_ledger_digest", "step_count", "applied_step_count"]);
  });

  it("gives every rule a compare-and-change recheck that P4 must implement", () => {
    expect(STORE_RULE_WRITE_CONTRACT.implementedIn).toBe("W32 R0 P4");
    expect(STORE_RULE_WRITE_CONTRACT.steps.join(" ")).toContain("BEGIN IMMEDIATE");
    expect(STORE_RULE_WRITE_CONTRACT.steps.join(" ")).toContain("compare-and-change");
    for (const rule of STORE_FIXED_RULES) {
      expect(rule.recheck, rule.id).toBeDefined();
      expect(rule.recheck.columnsByQuery, rule.id).toHaveLength(rule.candidates.length);
      expect(rule.recheck.match.trim().length, rule.id).toBeGreaterThan(0);
      rule.candidates.forEach((query, index) => {
        const recheck = rule.recheck.columnsByQuery[index]!;
        query.key.forEach((key) => expect(recheck, `${rule.id} query ${index} recheck names key ${key}`).toContain(key));
      });
    }
    const byId = new Map(STORE_FIXED_RULES.map((rule) => [rule.id, rule]));
    expect(byId.get("STORE-RULE-001")!.recheck.columnsByQuery[0]).toEqual(expect.arrayContaining(["root_path", "token", "pid", "hostname"]));
    expect(byId.get("STORE-RULE-002")!.recheck.columnsByQuery[0]).toEqual(expect.arrayContaining(["status", "metadata_json"]));
    expect(byId.get("STORE-RULE-006")!.recheck.columnsByQuery[0]).toContain("record_json");
    expect(byId.get("STORE-RULE-009")!.recheck.columnsByQuery[0]).toEqual(["operation_id", "receipt_operation_id", "metadata_json"]);
    expect(byId.get("STORE-RULE-009")!.recheck.columnsByQuery[1]).toEqual(["checkout_id", "kind", "record_id", "receipt_operation_id", "record_json"]);
    expect(byId.get("STORE-RULE-001")!.condition.join(" ")).toContain("platform.comparisonKey(l.root_path)");
  });

  it("strips only contentBase64 and keeps the payload backup file link", () => {
    expect([...STORE_SAVED_BYTE_KEYS]).toEqual(["contentBase64"]);
    const rule = STORE_FIXED_RULES.find((candidate) => candidate.id === "STORE-RULE-003")!;
    expect(rule.candidates[0]!.sql).not.toContain("$.payload");
    expect(rule.effect).toContain("Keep `payload`");
    expect(STORE_FOLLOW_UPS.map((followUp) => followUp.id)).toContain("FOLLOW-UP-LATER-OPERATION-BACKUP-FILES");
  });

  it("checks the package manager from the recorded manager and command, never binaryPath", () => {
    const proof = STORE_MAINTENANCE_PROOFS.find((candidate) => candidate.id === "package-manager-idle")!;
    expect(proof.check).toContain("`manager`");
    expect(proof.check).toContain("`command`");
    expect(proof.check).toContain("never uses it");
  });

  it("uses fixed liveness answers that never depend on a real process", () => {
    expect(fixtureLiveness(FIXTURE_DEAD_PID, FIXTURE_HOST)).toBe("dead");
    expect(fixtureLiveness(FIXTURE_LIVE_PID, FIXTURE_HOST)).toBe("alive");
    expect(fixtureLiveness(FIXTURE_DEAD_PID, FIXTURE_OTHER_HOST)).toBe("unknown");
    expect(fixtureLiveness(0, FIXTURE_HOST)).toBe("unknown");
    expect(fixtureLiveness(process.pid, FIXTURE_HOST)).toBe("unknown");
  });

  it("uses the backlog cache versions of this CLI", () => {
    expect(FIXTURE_VERSIONS).toEqual({
      snapshotSchemaVersion: BACKLOG_SNAPSHOT_SCHEMA_VERSION,
      ruleCatalogVersion: BACKLOG_RULE_CATALOG_VERSION,
      skillVersion: BACKLOG_REVIEW_SKILL_VERSION,
    });
  });

  it("states each retention setting with a reason, and keeps three backups", () => {
    for (const [id, setting] of Object.entries(STORE_MAINTENANCE_SETTINGS)) {
      expect(setting.value, id).toBeGreaterThan(0);
      expect(setting.reason.trim().length, id).toBeGreaterThan(0);
    }
    expect(STORE_MAINTENANCE_SETTINGS.storeBackupKeptCount.value).toBe(3);
    expect(section("- R-MAINT-5 (MUST)", "- R-MAINT-6 (MUST)")).toContain("keeps the three newest backups");
  });

  it("has a stable digest", () => {
    const digest = storeTableCatalogDigest();
    expect(digest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(storeTableCatalogDigest()).toBe(digest);
  });
});

describe("W32 R0 P1 fixture Stores (A3, A4)", () => {
  it("gives each rule and decision item a fixture row it acts on and one it keeps", () => {
    for (const target of [...STORE_FIXED_RULES, ...STORE_DECISION_ITEMS]) {
      const expectations = STORE_MAINTENANCE_FIXTURES.flatMap((fixture) => fixture.expected).filter((entry) => entry.target === target.id);
      expect(expectations.some((entry) => entry.outcome === "act"), `${target.id} act`).toBe(true);
      expect(expectations.some((entry) => entry.outcome === "keep"), `${target.id} keep`).toBe(true);
      expect(STORE_MAINTENANCE_FIXTURES.some((fixture) => fixture.proves.includes(target.id)), target.id).toBe(true);
    }
  });

  it("gives each rule with a liveness or package manager proof a row it skips", () => {
    for (const rule of STORE_FIXED_RULES.filter((candidate) => candidate.proofs.includes("owner-process-dead"))) {
      const expectations = STORE_MAINTENANCE_FIXTURES.flatMap((fixture) => fixture.expected).filter((entry) => entry.target === rule.id);
      expect(expectations.some((entry) => entry.outcome === "skip"), rule.id).toBe(true);
    }
  });

  it("gives each blocking crash leftover a fixture and a route", () => {
    const targets = new Set<string>([...STORE_FIXED_RULE_IDS, ...STORE_DECISION_ITEMS.map((item) => item.id)]);
    for (const leftover of STORE_BLOCKING_LEFTOVERS) {
      expect(STORE_MAINTENANCE_FIXTURES.some((fixture) => fixture.proves.includes(leftover.id)), leftover.id).toBe(true);
      if (!leftover.route.startsWith("existing:")) expect(targets.has(leftover.route), leftover.id).toBe(true);
    }
    expect(STORE_BLOCKING_LEFTOVERS).toHaveLength(7);
    for (const fixture of STORE_MAINTENANCE_FIXTURES) {
      for (const expectation of fixture.expected) expect(targets.has(expectation.target), `${fixture.id} ${expectation.target}`).toBe(true);
    }
  });

  for (const fixture of STORE_MAINTENANCE_FIXTURES) {
    it.skipIf(!sqliteAvailable)(`${fixture.id}: ${fixture.title}`, () => {
      const env = makeFixtureEnv(tempRoot);
      withStoreDatabase(path.join(tempRoot, "store"), (db) => {
        db.exec("BEGIN IMMEDIATE");
        fixture.seed(db, env);
        db.exec("COMMIT");
        const before = JSON.stringify(readPhysicalStoreSchema(db));
        const asIfActive = evaluateStoreFixture(db, fixture, env, { asIfActive: true });
        for (const expectation of fixture.expected) {
          const outcome = asIfActive.get(expectation.target)?.get(expectation.key) ?? "keep";
          expect(outcome, `${fixture.id} ${expectation.target} ${expectation.key}`).toBe(expectation.outcome);
        }
        // Today an inactive rule never acts: every candidate it finds is skipped.
        const today = evaluateStoreFixture(db, fixture, env);
        for (const rule of STORE_FIXED_RULES) {
          const outcomes = [...(today.get(rule.id)?.values() ?? [])];
          if (rule.activation.state === "inactive") expect(outcomes.every((outcome) => outcome === "skip"), `${fixture.id} ${rule.id}`).toBe(true);
          else expect(outcomes).toEqual([...(asIfActive.get(rule.id)?.values() ?? [])]);
        }
        for (const [key, family] of Object.entries(fixture.families ?? {})) {
          const [checkoutId, kind, recordId] = key.split("|") as [string, string, string];
          const row = db.prepare("SELECT record_json FROM installation_migration_records WHERE checkout_id=? AND kind=? AND record_id=?").get(checkoutId, kind, recordId) as { record_json: string };
          expect(classifyMigrationRecord(kind, recordId, row.record_json), key).toBe(family);
        }
        // Every migration record in a fixture matches a family, unless the fixture says otherwise.
        const records = db.prepare("SELECT checkout_id, kind, record_id, record_json FROM installation_migration_records").all() as Array<{ checkout_id: string; kind: string; record_id: string; record_json: string }>;
        for (const row of records) {
          const key = `${row.checkout_id}|${row.kind}|${row.record_id}`;
          if (fixture.unclassified?.includes(key)) continue;
          expect(classifyMigrationRecord(row.kind, row.record_id, row.record_json), `${fixture.id} ${key} has no family`).not.toBeNull();
        }
        expect(JSON.stringify(readPhysicalStoreSchema(db))).toBe(before);
      });
    });
  }
});
