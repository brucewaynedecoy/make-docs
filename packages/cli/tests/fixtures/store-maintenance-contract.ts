import { createHash } from "node:crypto";
import { lstatSync, mkdirSync } from "node:fs";
import path from "node:path";

import type { ProcessLiveness } from "../../src/platform";
import { storeLedgerDigest, type StoreDatabase } from "../../src/store/database";
import {
  STORE_DECISION_ITEMS,
  STORE_FIXED_RULES,
  storeMaintenanceParametersFor,
  storeMaintenanceSqlParameters,
  type StoreBlockingLeftover,
  type StoreFixedRule,
  type StoreDecisionItemId,
  type StoreFixedRuleId,
  type StoreMaintenanceProofId,
  type StoreMaintenanceVersions,
  type StoreMigrationRecordFamilyId,
  type StoreProofResult,
  type StoreRuleCandidateQuery,
} from "../../src/store/table-catalog";

/**
 * W32 R0 P1 fixture Stores. Each fixture seeds a fresh schema v6 Store in a
 * temporary folder. A reference evaluator runs each rule's candidate query
 * and its proofs, so a fixture can say which rows a rule acts on, keeps, or
 * skips. Expected outcomes are the outcomes of the rule once it is active.
 * P4 must reach the same answers with the real `setup store check`.
 *
 * Liveness is injected, so no fixture depends on a real process id.
 */

export type StoreMaintenanceTarget = StoreFixedRuleId | StoreDecisionItemId;
export type StoreFixtureOutcome = "act" | "keep" | "skip";

export interface StoreFixtureEnv {
  now: Date;
  hostname: string;
  livePid: number;
  deadPid: number;
  otherHost: string;
  /** The injected liveness check. It stands for platform.processLiveness. */
  liveness: (pid: number, hostname: string) => ProcessLiveness;
  /** A folder that exists. */
  presentFolder: string;
  /** A folder that does not exist. */
  missingFolder: string;
}

export interface StoreFixtureExpectation {
  target: StoreMaintenanceTarget;
  /** Key column values joined with `|`. */
  key: string;
  outcome: StoreFixtureOutcome;
}

export interface StoreMaintenanceFixture {
  id: `SMF-${string}`;
  title: string;
  proves: readonly (StoreMaintenanceTarget | StoreBlockingLeftover["id"])[];
  seed: (db: StoreDatabase, env: StoreFixtureEnv) => void;
  expected: readonly StoreFixtureExpectation[];
  /** Package-manager-idle results by tool operation ID. Missing means `unknown`. */
  packageManager?: Readonly<Record<string, StoreProofResult>>;
  /** Expected record families by `checkout_id|kind|record_id`. */
  families?: Readonly<Record<string, StoreMigrationRecordFamilyId | null>>;
  /** Migration record keys that are meant to match no family. Any other unclassified row fails the test. */
  unclassified?: readonly string[];
}

/** Current versions for the backlog cache rule in this CLI. */
export const FIXTURE_VERSIONS: StoreMaintenanceVersions = { snapshotSchemaVersion: 2, ruleCatalogVersion: 2, skillVersion: 1 };

export const FIXTURE_NOW = new Date("2042-06-15T12:00:00.000Z");
const daysAgo = (days: number) => new Date(FIXTURE_NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

export const FIXTURE_HOST = "fixture-host.invalid";
export const FIXTURE_OTHER_HOST = "other-host.invalid";
export const FIXTURE_LIVE_PID = 4101;
export const FIXTURE_DEAD_PID = 4102;

/** Same-host rules as platform.processLiveness, with a fixed answer for each fixture pid. */
export function fixtureLiveness(pid: number, hostname: string): ProcessLiveness {
  if (!Number.isSafeInteger(pid) || pid <= 0 || hostname !== FIXTURE_HOST) return "unknown";
  if (pid === FIXTURE_DEAD_PID) return "dead";
  if (pid === FIXTURE_LIVE_PID) return "alive";
  return "unknown";
}

export function makeFixtureEnv(tempRoot: string): StoreFixtureEnv {
  const presentFolder = path.join(tempRoot, "present-checkout");
  mkdirSync(presentFolder, { recursive: true });
  return {
    now: FIXTURE_NOW,
    hostname: FIXTURE_HOST,
    livePid: FIXTURE_LIVE_PID,
    deadPid: FIXTURE_DEAD_PID,
    otherHost: FIXTURE_OTHER_HOST,
    liveness: fixtureLiveness,
    presentFolder,
    missingFolder: path.join(tempRoot, "missing-checkout"),
  };
}

const sha256Hex = (value: string) => createHash("sha256").update(value).digest("hex");
const sha256Id = (value: string) => `sha256:${sha256Hex(value)}`;

function checkout(db: StoreDatabase, id: string, root: string, projectId = `project-${id}`, rootPathKey = root): void {
  db.prepare(
    "INSERT INTO installation_checkouts (checkout_id, project_id, root_path, created_at, root_path_key, verified_at, verification_json) VALUES (?,?,?,?,?,?,?)",
  ).run(id, projectId, root, daysAgo(400), rootPathKey, daysAgo(400), '{"schemaVersion":1}');
}

function operation(
  db: StoreDatabase,
  id: string,
  checkoutId: string,
  status: "pending" | "completed" | "rolled-back" | "failed",
  finishedDaysAgo: number | null,
  options: { operation?: string; before?: string | null; after?: string | null; receipt?: "filled" | "empty" | "stale" } = {},
): void {
  const before = options.before === undefined ? '{"files":{"a.md":{}}}' : options.before;
  const after = options.after === undefined ? '{"files":{"a.md":{},"b.md":{}}}' : options.after;
  // A terminal commit fills the v7 receipt columns (database.ts fillInstallationOperationReceipt).
  // step() adds to the counts. `empty` stands for a row the receipt never reached; `stale` for a digest that no longer matches.
  const terminal = status === "completed" || status === "rolled-back";
  const receipt = terminal ? options.receipt ?? "filled" : "empty";
  const digest = (ledger: string | null) => receipt === "filled" ? storeLedgerDigest(ledger) : receipt === "stale" && storeLedgerDigest(ledger) ? `sha256:${"0".repeat(64)}` : null;
  db.prepare(
    "INSERT INTO installation_operations (operation_id, checkout_id, operation, status, before_ledger, after_ledger, created_at, finished_at, plan_complete, before_ledger_digest, after_ledger_digest, step_count, applied_step_count) VALUES (?,?,?,?,?,?,?,?,1,?,?,?,?)",
  ).run(
    id,
    checkoutId,
    options.operation ?? "setup.skills.adopt",
    status,
    before,
    after,
    daysAgo(400),
    finishedDaysAgo === null ? null : daysAgo(finishedDaysAgo),
    digest(before),
    digest(after),
    receipt === "empty" ? null : 0,
    receipt === "empty" ? null : 0,
  );
}

function step(db: StoreDatabase, operationId: string, ordinal: number, before: unknown, after: unknown): void {
  db.prepare("INSERT INTO installation_steps VALUES (?,?,?,?,?,1)").run(
    operationId,
    ordinal,
    `file-${ordinal}.md`,
    typeof before === "string" ? before : JSON.stringify(before),
    typeof after === "string" ? after : JSON.stringify(after),
  );
  db.prepare("UPDATE installation_operations SET step_count = step_count + 1, applied_step_count = applied_step_count + 1 WHERE operation_id = ? AND step_count IS NOT NULL").run(operationId);
}

function lock(db: StoreDatabase, root: string, token: string, pid: number, hostname: string): void {
  db.prepare("INSERT INTO installation_locks VALUES (?,?,?,?,?)").run(root, token, pid, hostname, daysAgo(1));
}

function record(db: StoreDatabase, checkoutId: string, kind: string, recordId: string, value: unknown): void {
  db.prepare("INSERT INTO installation_migration_records VALUES (?,?,?,?)").run(
    checkoutId,
    kind,
    recordId,
    typeof value === "string" ? value : JSON.stringify(value),
  );
}

function tool(
  db: StoreDatabase,
  id: string,
  op: string,
  status: "pending" | "completed" | "failed",
  pid: number,
  hostname: string,
  metadata: unknown,
  finishedAt: string | null = null,
): void {
  db.prepare("INSERT INTO tool_operations VALUES (?,?,?,?,?,?,?,?)").run(
    id,
    op,
    status,
    pid,
    hostname,
    JSON.stringify(metadata),
    daysAgo(2),
    finishedAt,
  );
}

function run(db: StoreDatabase, runId: string, status: string, updatedDaysAgo: number): void {
  db.prepare(
    "INSERT INTO runs (project_id, run_id, run_type, lifecycle_stage, status, checkpoint, version, metadata, started_at, updated_at, finished_at) VALUES (?,?,'lifecycle','implementation',?,NULL,1,'{}',?,?,?)",
  ).run("project-runs", runId, status, daysAgo(updatedDaysAgo + 1), daysAgo(updatedDaysAgo), status === "completed" ? daysAgo(updatedDaysAgo) : null);
}

function cacheRow(db: StoreDatabase, checkoutId: string, recordPath: string, versions: [number, number, number]): void {
  db.prepare(
    "INSERT INTO backlog_review_cache VALUES (?,?,?,?,?,?,?,?,?)",
  ).run(checkoutId, recordPath, sha256Hex(recordPath), versions[0], versions[1], versions[2], "{}", daysAgo(3), daysAgo(3));
}

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const receiptJson = (scope: "machine" | "project", harnessId: string, method: string, operationId: string, verifiedDaysAgo: number) => ({
  scope,
  harnessId,
  connectionMethod: method,
  operationId,
  verifiedAt: daysAgo(verifiedDaysAgo),
  result: "verified",
  entries: [],
});

/** `payload` is a backup file path, as installation-state.ts savePayload writes it. It is not bytes. */
const STEP_WITH_PAYLOAD = { kind: "file", digest: "d1", payload: ".make-docs/backup/operations/op/1-before", mode: 420 };
const STEP_WITH_BASE64 = { kind: "file", digest: "d2", contentBase64: "aGVsbG8=" };
const STEP_NO_BYTES = { kind: "file", digest: "d3", mode: 420 };

export const STORE_MAINTENANCE_FIXTURES: readonly StoreMaintenanceFixture[] = Object.freeze<StoreMaintenanceFixture[]>([
  {
    id: "SMF-001",
    title: "Installation locks: dead, live, unknown, and guarding",
    proves: ["STORE-RULE-001", "STORE-LEFTOVER-001", "STORE-LEFTOVER-005"],
    seed(db, env) {
      checkout(db, "c-guarded", "/fixture/guarded");
      operation(db, "op-guarded", "c-guarded", "pending", null);
      lock(db, "/fixture/dead", "token-dead", env.deadPid, env.hostname);
      lock(db, "/fixture/live", "token-live", env.livePid, env.hostname);
      lock(db, "/fixture/remote", "token-remote", env.deadPid, env.otherHost);
      lock(db, "/fixture/guarded", "token-guarded", env.deadPid, env.hostname);
      // On a case-insensitive drive, root_path_key is the lower-cased comparison key.
      // A lock written with other letter case still guards the pending operation.
      checkout(db, "c-mixed", "/Fixture/MixedCase", "project-c-mixed", "/fixture/mixedcase");
      operation(db, "op-mixed", "c-mixed", "pending", null);
      lock(db, "/FIXTURE/MixedCase", "token-mixed", env.deadPid, env.hostname);
    },
    expected: [
      { target: "STORE-RULE-001", key: "/fixture/dead", outcome: "act" },
      { target: "STORE-RULE-001", key: "/fixture/live", outcome: "keep" },
      { target: "STORE-RULE-001", key: "/fixture/remote", outcome: "skip" },
      { target: "STORE-RULE-001", key: "/fixture/guarded", outcome: "keep" },
      { target: "STORE-RULE-001", key: "/FIXTURE/MixedCase", outcome: "keep" },
    ],
  },
  {
    id: "SMF-002",
    title: "Tool operations: abandoned, live, remote, finished, and machine setup",
    proves: ["STORE-RULE-002", "STORE-LEFTOVER-002", "STORE-LEFTOVER-006"],
    seed(db, env) {
      // binaryPath is the Make Docs CLI realpath, as self/update-tool.ts records it. It is not the package manager.
      const metadata = { manager: "npm", command: "npm install -g @brucewaynedecoy/make-docs@latest", binaryPath: "/opt/homebrew/lib/node_modules/@brucewaynedecoy/make-docs/dist/index.js" };
      tool(db, "tool-abandoned", "tool.update", "pending", env.deadPid, env.hostname, metadata);
      tool(db, "tool-live", "tool.uninstall", "pending", env.livePid, env.hostname, metadata);
      tool(db, "tool-remote", "tool.update", "pending", env.deadPid, env.otherHost, metadata);
      // Another manager, so a process list can show pnpm running while npm is idle.
      tool(db, "tool-busy", "tool.update", "pending", env.deadPid, env.hostname, { ...metadata, manager: "pnpm", command: "pnpm add -g @brucewaynedecoy/make-docs@latest" });
      tool(db, "tool-unchecked", "tool.uninstall", "pending", env.deadPid, env.hostname, { manager: "npm", binaryPath: metadata.binaryPath });
      tool(db, "tool-done", "tool.update", "completed", env.deadPid, env.hostname, metadata, daysAgo(1));
      tool(db, "machine-setup", "setup.system.harness", "pending", env.deadPid, env.hostname, { operationId: "m1" });
    },
    packageManager: { "tool-abandoned": "proven", "tool-live": "proven", "tool-remote": "proven", "tool-busy": "refuted" },
    expected: [
      { target: "STORE-RULE-002", key: "tool-abandoned", outcome: "act" },
      { target: "STORE-RULE-002", key: "tool-live", outcome: "keep" },
      { target: "STORE-RULE-002", key: "tool-remote", outcome: "skip" },
      { target: "STORE-RULE-002", key: "tool-busy", outcome: "keep" },
      { target: "STORE-RULE-002", key: "tool-unchecked", outcome: "skip" },
      { target: "STORE-RULE-002", key: "tool-done", outcome: "keep" },
      { target: "STORE-RULE-002", key: "machine-setup", outcome: "keep" },
    ],
  },
  {
    id: "SMF-003",
    title: "Saved bytes and full ledgers of terminal operations, and the removal handoff",
    proves: ["STORE-RULE-003", "STORE-RULE-004"],
    seed(db) {
      checkout(db, "c-ops", "/fixture/ops");
      operation(db, "op-old", "c-ops", "completed", 60);
      step(db, "op-old", 1, STEP_WITH_PAYLOAD, STEP_NO_BYTES);
      step(db, "op-old", 2, STEP_NO_BYTES, STEP_WITH_BASE64);
      step(db, "op-old", 3, STEP_NO_BYTES, STEP_NO_BYTES);
      step(db, "op-old", 4, "not json", STEP_NO_BYTES);
      step(db, "op-old", 5, STEP_WITH_PAYLOAD, STEP_WITH_BASE64);
      operation(db, "op-recent", "c-ops", "completed", 5);
      step(db, "op-recent", 1, STEP_WITH_BASE64, STEP_WITH_BASE64);
      operation(db, "op-pending", "c-ops", "pending", null);
      step(db, "op-pending", 1, STEP_WITH_BASE64, STEP_WITH_BASE64);
      operation(db, "op-empty", "c-ops", "rolled-back", 90, { before: null, after: "null" });
      operation(db, "op-rolled", "c-ops", "rolled-back", 45, { after: null });
      // The latest completed removal of a checkout with no ledger: setup reads its before-ledger.
      checkout(db, "c-removed", "/fixture/removed");
      operation(db, "op-handoff", "c-removed", "completed", 200, { operation: "setup.remove", after: "null" });
      step(db, "op-handoff", 1, STEP_WITH_BASE64, { kind: "missing" });
      // An older removal that a later completed operation replaced is not the handoff row.
      checkout(db, "c-reinstalled", "/fixture/reinstalled");
      operation(db, "op-old-remove", "c-reinstalled", "completed", 80, { operation: "setup.remove", after: "null" });
      operation(db, "op-reinstall", "c-reinstalled", "completed", 70, { operation: "setup.migration" });
      // Receipt columns that the backfill never reached, and a digest that no longer matches its ledger.
      operation(db, "op-no-receipt", "c-ops", "completed", 60, { receipt: "empty" });
      operation(db, "op-stale-receipt", "c-ops", "completed", 60, { receipt: "stale" });
    },
    expected: [
      // A payload path alone is not bytes in the Store, so step 1 stays.
      { target: "STORE-RULE-003", key: "op-old|1", outcome: "keep" },
      { target: "STORE-RULE-003", key: "op-old|2", outcome: "act" },
      { target: "STORE-RULE-003", key: "op-old|5", outcome: "act" },
      { target: "STORE-RULE-003", key: "op-old|3", outcome: "keep" },
      { target: "STORE-RULE-003", key: "op-old|4", outcome: "keep" },
      { target: "STORE-RULE-003", key: "op-recent|1", outcome: "keep" },
      { target: "STORE-RULE-003", key: "op-pending|1", outcome: "keep" },
      { target: "STORE-RULE-003", key: "op-handoff|1", outcome: "skip" },
      { target: "STORE-RULE-004", key: "op-old", outcome: "act" },
      { target: "STORE-RULE-004", key: "op-rolled", outcome: "act" },
      { target: "STORE-RULE-004", key: "op-old-remove", outcome: "act" },
      { target: "STORE-RULE-004", key: "op-recent", outcome: "keep" },
      { target: "STORE-RULE-004", key: "op-pending", outcome: "keep" },
      { target: "STORE-RULE-004", key: "op-empty", outcome: "keep" },
      { target: "STORE-RULE-004", key: "op-handoff", outcome: "skip" },
      { target: "STORE-RULE-004", key: "op-no-receipt", outcome: "skip" },
      { target: "STORE-RULE-004", key: "op-stale-receipt", outcome: "skip" },
    ],
  },
  {
    id: "SMF-004",
    title: "Detached plans and atomic write intents",
    proves: ["STORE-RULE-003", "STORE-RULE-004", "STORE-RULE-005"],
    seed(db) {
      checkout(db, "c-plans", "/fixture/plans");
      operation(db, "op-1", "c-plans", "completed", 60);
      operation(db, "op-10", "c-plans", "pending", null);
      operation(db, "op-recent", "c-plans", "completed", 5);
      // A completed detached operation older than the window: its steps hold the same contentBase64 as its plan.
      step(db, "op-1", 1, STEP_NO_BYTES, STEP_WITH_BASE64);
      // A completed operation with only an atomic write intent left.
      operation(db, "op-atomic", "c-plans", "completed", 60);
      step(db, "op-atomic", 1, STEP_NO_BYTES, STEP_WITH_BASE64);
      record(db, "c-plans", "backup", "atomic:op-atomic:1", { ordinal: 1 });
      record(db, "c-plans", "snapshot", "detached:op-1", { digest: "x", plan: {} });
      record(db, "c-plans", "snapshot", "detached-original:op-1", { digest: "x", plan: {} });
      record(db, "c-plans", "backup", "atomic:op-1:1", { ordinal: 1 });
      record(db, "c-plans", "snapshot", "detached:op-10", { digest: "y", plan: {} });
      record(db, "c-plans", "backup", "atomic:op-10:1", { ordinal: 1 });
      record(db, "c-plans", "snapshot", "detached:op-recent", { digest: "w", plan: {} });
      record(db, "c-plans", "snapshot", "detached:op-missing", { digest: "z", plan: {} });
      record(db, "c-plans", "snapshot", sha256Id("migration-snapshot"), { snapshotId: "s" });
      record(db, "c-plans", "backup", "2042-06-01T00-00-00-000Z", { backupId: "b" });
    },
    expected: [
      { target: "STORE-RULE-005", key: "c-plans|snapshot|detached:op-1", outcome: "act" },
      { target: "STORE-RULE-005", key: "c-plans|snapshot|detached-original:op-1", outcome: "act" },
      { target: "STORE-RULE-005", key: "c-plans|backup|atomic:op-1:1", outcome: "act" },
      { target: "STORE-RULE-005", key: "c-plans|snapshot|detached:op-10", outcome: "keep" },
      { target: "STORE-RULE-005", key: "c-plans|backup|atomic:op-10:1", outcome: "keep" },
      { target: "STORE-RULE-005", key: "c-plans|snapshot|detached:op-recent", outcome: "keep" },
      { target: "STORE-RULE-005", key: "c-plans|snapshot|detached:op-missing", outcome: "keep" },
      { target: "STORE-RULE-005", key: `c-plans|snapshot|${sha256Id("migration-snapshot")}`, outcome: "keep" },
      { target: "STORE-RULE-005", key: "c-plans|backup|2042-06-01T00-00-00-000Z", outcome: "keep" },
      { target: "STORE-RULE-005", key: "c-plans|backup|atomic:op-atomic:1", outcome: "act" },
      // While a detached plan or an atomic intent exists, the steps and ledgers stay.
      { target: "STORE-RULE-003", key: "op-1|1", outcome: "skip" },
      { target: "STORE-RULE-003", key: "op-atomic|1", outcome: "skip" },
      { target: "STORE-RULE-004", key: "op-1", outcome: "skip" },
      { target: "STORE-RULE-004", key: "op-atomic", outcome: "skip" },
    ],
    families: {
      "c-plans|snapshot|detached:op-1": "detached-plan",
      "c-plans|snapshot|detached-original:op-1": "detached-original-plan",
      "c-plans|backup|atomic:op-1:1": "atomic-write-intent",
      [`c-plans|snapshot|${sha256Id("migration-snapshot")}`]: "migration-snapshot",
      "c-plans|backup|2042-06-01T00-00-00-000Z": "migration-backup",
    },
  },
  {
    id: "SMF-005",
    title: "Quiescence barriers with and without their lock",
    proves: ["STORE-RULE-006"],
    seed(db, env) {
      for (const id of ["gone", "held", "bad", "pending", "imported", "bound"]) checkout(db, `c-q-${id}`, `/fixture/q-${id}`);
      lock(db, "/fixture/q-held", "token-held", env.livePid, env.hostname);
      const barrier = (token: string) => ({ schemaVersion: 1, status: "active", lockTokenDigest: sha256Hex(token), snapshotId: null, activatedAt: daysAgo(1), legacyOperations: [] });
      record(db, "c-q-gone", "quiescence", "legacy", barrier("token-gone"));
      record(db, "c-q-held", "quiescence", "legacy", barrier("token-held"));
      record(db, "c-q-bad", "quiescence", "legacy", "{not json");
      // A crash while recovery takes its lock again leaves a pending operation and no lock.
      operation(db, "op-q-pending", "c-q-pending", "pending", null, { operation: "setup.migration" });
      record(db, "c-q-pending", "quiescence", "legacy", barrier("token-crashed"));
      // An imported barrier names a legacy lock token that never appears in installation_locks.
      record(db, "c-q-imported", "legacy-import", "import-1", { sources: [], recoveryRequired: false, importedAt: daysAgo(30) });
      record(db, "c-q-imported", "quiescence", "legacy", barrier("token-legacy"));
      // The normal barrier that every setup leaves: bound to its snapshot, lock released.
      record(db, "c-q-bound", "quiescence", "legacy", { ...barrier("token-released"), snapshotId: sha256Id("bound-snapshot") });
    },
    expected: [
      { target: "STORE-RULE-006", key: "c-q-gone|quiescence|legacy", outcome: "act" },
      { target: "STORE-RULE-006", key: "c-q-held|quiescence|legacy", outcome: "keep" },
      { target: "STORE-RULE-006", key: "c-q-bad|quiescence|legacy", outcome: "skip" },
      { target: "STORE-RULE-006", key: "c-q-pending|quiescence|legacy", outcome: "skip" },
      { target: "STORE-RULE-006", key: "c-q-imported|quiescence|legacy", outcome: "skip" },
      { target: "STORE-RULE-006", key: "c-q-bound|quiescence|legacy", outcome: "keep" },
    ],
    families: { "c-q-gone|quiescence|legacy": "legacy-quiescence", "c-q-imported|legacy-import|import-1": "legacy-import-receipt" },
  },
  {
    id: "SMF-006",
    title: "Checkpoint journal rows with and without a migration receipt",
    proves: ["STORE-RULE-007"],
    seed(db) {
      const journal = (id: string) =>
        db.prepare("INSERT INTO store_checkpoint_journal VALUES (?,9,?,?,?,'{}')").run(id, sha256Hex("root"), sha256Id(`snap-${id}`), daysAgo(300));
      const copied = sha256Id("receipt-copied");
      const lonely = sha256Id("receipt-lonely");
      journal(copied);
      journal(lonely);
      db.prepare("INSERT INTO store_migration_receipts VALUES (?,'store.schema.migrate',?,2,5,?,'completed',?,'{}')").run(copied, sha256Hex("root"), sha256Id("snap"), daysAgo(300));
    },
    expected: [
      { target: "STORE-RULE-007", key: sha256Id("receipt-copied"), outcome: "act" },
      { target: "STORE-RULE-007", key: sha256Id("receipt-lonely"), outcome: "keep" },
    ],
  },
  {
    id: "SMF-007",
    title: "Backlog review cache rows for current, old, and newer versions",
    proves: ["STORE-RULE-008"],
    seed(db) {
      checkout(db, "c-cache", "/fixture/cache");
      cacheRow(db, "c-cache", "docs/work/current.md", [2, 2, 1]);
      cacheRow(db, "c-cache", "docs/work/old-snapshot.md", [1, 2, 1]);
      cacheRow(db, "c-cache", "docs/work/old-rules.md", [2, 1, 1]);
      cacheRow(db, "c-cache", "docs/work/newer.md", [3, 3, 2]);
    },
    expected: [
      { target: "STORE-RULE-008", key: `c-cache|docs/work/current.md|${sha256Hex("docs/work/current.md")}|2|2|1`, outcome: "keep" },
      { target: "STORE-RULE-008", key: `c-cache|docs/work/old-snapshot.md|${sha256Hex("docs/work/old-snapshot.md")}|1|2|1`, outcome: "act" },
      { target: "STORE-RULE-008", key: `c-cache|docs/work/old-rules.md|${sha256Hex("docs/work/old-rules.md")}|2|1|1`, outcome: "act" },
      { target: "STORE-RULE-008", key: `c-cache|docs/work/newer.md|${sha256Hex("docs/work/newer.md")}|3|3|2`, outcome: "keep" },
    ],
  },
  {
    id: "SMF-008",
    title: "Harness receipt history on the machine and in a project",
    proves: ["STORE-RULE-009", "STORE-LEFTOVER-006"],
    seed(db, env) {
      // Machine: 13 history rows for claude/mcp. The oldest is the current receipt.
      // A pending drift repair names the second oldest as its ownership receipt.
      for (let n = 1; n <= 13; n++) {
        const op = uuid(n);
        tool(db, `harness-receipt:${op}`, n % 4 === 0 ? "setup.system.receipt-observation" : "setup.system.receipt", "completed", env.livePid, env.hostname, receiptJson("machine", "claude", "mcp", op, 100 - n), daysAgo(100 - n));
      }
      tool(db, "harness-receipt-current:machine:claude:mcp", "setup.system.receipt-current", "completed", env.livePid, env.hostname, receiptJson("machine", "claude", "mcp", uuid(1), 99), daysAgo(99));
      tool(db, "machine-drift-repair", "setup.system.harness", "pending", env.deadPid, env.hostname, { operationId: "machine-drift-repair", ownershipReceipt: receiptJson("machine", "claude", "mcp", uuid(2), 98) });
      tool(db, `harness-receipt:${uuid(50)}`, "setup.system.receipt", "completed", env.livePid, env.hostname, receiptJson("machine", "codex", "mcp", uuid(50), 200), daysAgo(200));
      // Valid JSON without harnessId or connectionMethod: 11 rows that would form a blank group.
      for (let n = 1; n <= 11; n++) {
        tool(db, `harness-receipt:blank-${n}`, "setup.system.receipt", "completed", env.livePid, env.hostname, { operationId: `blank-${n}`, verifiedAt: daysAgo(300 - n) }, daysAgo(300 - n));
      }
      // Project: 12 receipts and 1 observation for one checkout, plus the current pointer and other receipts.
      checkout(db, "c-harness", "/fixture/harness");
      for (let n = 1; n <= 12; n++) {
        record(db, "c-harness", "receipt", uuid(100 + n), receiptJson("project", "claude", "skill", uuid(100 + n), 100 - n));
      }
      record(db, "c-harness", "receipt", "harness-receipt-current:project:claude:skill", receiptJson("project", "claude", "skill", uuid(112), 88));
      record(db, "c-harness", "receipt", sha256Id("migration-receipt"), { receiptId: "r" });
      record(db, "c-harness", "receipt", "checkout-move:11111111-1111-4111-8111-111111111111", { operation: "project.checkout-move.apply" });
      record(db, "c-harness", "receipt", `harness-receipt-observation:${"a".repeat(32)}`, receiptJson("project", "claude", "skill", uuid(112), 87));
      // Harness-shaped JSON under a record ID that is not a UUID: no family, never removed.
      record(db, "c-harness", "receipt", "legacy-harness-receipt", receiptJson("project", "claude", "skill", "legacy-op", 300));
    },
    expected: [
      { target: "STORE-RULE-009", key: `harness-receipt:${uuid(1)}`, outcome: "keep" },
      { target: "STORE-RULE-009", key: `harness-receipt:${uuid(2)}`, outcome: "keep" },
      { target: "STORE-RULE-009", key: `harness-receipt:${uuid(3)}`, outcome: "act" },
      { target: "STORE-RULE-009", key: `harness-receipt:${uuid(4)}`, outcome: "keep" },
      { target: "STORE-RULE-009", key: `harness-receipt:${uuid(13)}`, outcome: "keep" },
      { target: "STORE-RULE-009", key: "harness-receipt-current:machine:claude:mcp", outcome: "keep" },
      { target: "STORE-RULE-009", key: `harness-receipt:${uuid(50)}`, outcome: "keep" },
      { target: "STORE-RULE-009", key: "harness-receipt:blank-1", outcome: "keep" },
      // 12 project receipts and 1 observation. The current receipt (112) and its observation take no slot,
      // so the 10 older receipts 102 to 111 stay and only the oldest (101) goes.
      { target: "STORE-RULE-009", key: `c-harness|receipt|${uuid(101)}`, outcome: "act" },
      { target: "STORE-RULE-009", key: `c-harness|receipt|${uuid(102)}`, outcome: "keep" },
      { target: "STORE-RULE-009", key: `c-harness|receipt|${uuid(103)}`, outcome: "keep" },
      { target: "STORE-RULE-009", key: `c-harness|receipt|${uuid(104)}`, outcome: "keep" },
      { target: "STORE-RULE-009", key: `c-harness|receipt|${uuid(112)}`, outcome: "keep" },
      { target: "STORE-RULE-009", key: `c-harness|receipt|harness-receipt-observation:${"a".repeat(32)}`, outcome: "keep" },
      { target: "STORE-RULE-009", key: "c-harness|receipt|harness-receipt-current:project:claude:skill", outcome: "keep" },
      { target: "STORE-RULE-009", key: `c-harness|receipt|${sha256Id("migration-receipt")}`, outcome: "keep" },
      { target: "STORE-RULE-009", key: "c-harness|receipt|checkout-move:11111111-1111-4111-8111-111111111111", outcome: "keep" },
      { target: "STORE-RULE-009", key: "c-harness|receipt|legacy-harness-receipt", outcome: "keep" },
      { target: "STORE-RULE-002", key: "machine-drift-repair", outcome: "keep" },
    ],
    families: {
      [`c-harness|receipt|${uuid(101)}`]: "harness-receipt",
      "c-harness|receipt|harness-receipt-current:project:claude:skill": "harness-receipt-current",
      [`c-harness|receipt|${sha256Id("migration-receipt")}`]: "migration-receipt",
      "c-harness|receipt|checkout-move:11111111-1111-4111-8111-111111111111": "checkout-move-receipt",
      [`c-harness|receipt|harness-receipt-observation:${"a".repeat(32)}`]: "harness-receipt-observation",
      "c-harness|receipt|legacy-harness-receipt": null,
    },
    unclassified: ["c-harness|receipt|legacy-harness-receipt"],
  },
  {
    id: "SMF-009",
    title: "Decision items, a pending layout with no lock, and machine setup history",
    proves: ["STORE-DECISION-001", "STORE-DECISION-002", "STORE-DECISION-003", "STORE-LEFTOVER-003", "STORE-LEFTOVER-004", "STORE-LEFTOVER-007"],
    seed(db, env) {
      checkout(db, "c-present", env.presentFolder);
      checkout(db, "c-missing", env.missingFolder);
      operation(db, "op-on-missing", "c-missing", "pending", null);
      operation(db, "op-legacy", "c-present", "pending", null, { operation: "legacy.recovery" });
      operation(db, "op-legacy-done", "c-present", "completed", 10, { operation: "legacy.recovery" });
      operation(db, "op-other-pending", "c-present", "pending", null, { operation: "setup.migration" });
      // An unverified manual layout: pending, detached, no lock, folder present.
      operation(db, "op-layout", "c-present", "pending", null, { operation: "project.layout" });
      record(db, "c-present", "snapshot", "detached:op-layout", { digest: "l", plan: { mode: "manual" } });
      run(db, "run-forgotten", "active", 200);
      run(db, "run-paused-long", "paused", 120);
      run(db, "run-recent", "active", 10);
      run(db, "run-finished", "completed", 200);
      tool(db, "machine-done", "setup.system.harness", "completed", env.deadPid, env.hostname, { operationId: "machine-done" }, daysAgo(3));
      tool(db, "machine-failed", "setup.system.harness", "failed", env.deadPid, env.hostname, { operationId: "machine-failed" }, daysAgo(3));
    },
    expected: [
      { target: "STORE-DECISION-001", key: "c-missing", outcome: "act" },
      { target: "STORE-DECISION-001", key: "c-present", outcome: "keep" },
      { target: "STORE-DECISION-002", key: "project-runs|run-forgotten", outcome: "act" },
      { target: "STORE-DECISION-002", key: "project-runs|run-paused-long", outcome: "act" },
      { target: "STORE-DECISION-002", key: "project-runs|run-recent", outcome: "keep" },
      { target: "STORE-DECISION-002", key: "project-runs|run-finished", outcome: "keep" },
      { target: "STORE-DECISION-003", key: "op-legacy", outcome: "act" },
      { target: "STORE-DECISION-003", key: "op-legacy-done", outcome: "keep" },
      { target: "STORE-DECISION-003", key: "op-other-pending", outcome: "keep" },
      { target: "STORE-RULE-005", key: "c-present|snapshot|detached:op-layout", outcome: "keep" },
      { target: "STORE-RULE-002", key: "machine-done", outcome: "keep" },
      { target: "STORE-RULE-002", key: "machine-failed", outcome: "keep" },
      { target: "STORE-RULE-009", key: "machine-done", outcome: "keep" },
    ],
    families: { "c-present|snapshot|detached:op-layout": "detached-plan" },
  },
  {
    id: "SMF-010",
    title: "A failed operation is never terminal",
    proves: ["STORE-RULE-001", "STORE-RULE-003", "STORE-RULE-004", "STORE-RULE-005", "STORE-RULE-006"],
    seed(db, env) {
      // Schema v7 accepts a `failed` installation operation.
      checkout(db, "c-failed", "/fixture/failed");
      operation(db, "op-failed", "c-failed", "failed", 200);
      step(db, "op-failed", 1, STEP_WITH_PAYLOAD, STEP_WITH_BASE64);
      record(db, "c-failed", "snapshot", "detached:op-failed", { digest: "f", plan: {} });
      record(db, "c-failed", "backup", "atomic:op-failed:1", { ordinal: 1 });
      lock(db, "/fixture/failed", "token-failed", env.deadPid, env.hostname);
      record(db, "c-failed", "quiescence", "legacy", { schemaVersion: 1, status: "active", lockTokenDigest: sha256Hex("token-gone"), snapshotId: null, activatedAt: daysAgo(200), legacyOperations: [] });
    },
    expected: [
      { target: "STORE-RULE-001", key: "/fixture/failed", outcome: "keep" },
      { target: "STORE-RULE-003", key: "op-failed|1", outcome: "keep" },
      { target: "STORE-RULE-004", key: "op-failed", outcome: "keep" },
      { target: "STORE-RULE-005", key: "c-failed|snapshot|detached:op-failed", outcome: "keep" },
      { target: "STORE-RULE-005", key: "c-failed|backup|atomic:op-failed:1", outcome: "keep" },
      { target: "STORE-RULE-006", key: "c-failed|quiescence|legacy", outcome: "skip" },
    ],
  },
]);

/* ------------------------------------------------------------------------ */
/* Reference evaluator                                                      */
/* ------------------------------------------------------------------------ */

type Row = Record<string, unknown>;

const KNOWN_MANAGERS = new Set(["npm", "pnpm", "bun", "brew"]);

function rowKey(query: StoreRuleCandidateQuery, row: Row): string {
  return query.key.map((column) => String(row[column])).join("|");
}

function ownerDead(row: Row, env: StoreFixtureEnv): StoreProofResult {
  const state = env.liveness(Number(row.pid), String(row.hostname));
  return state === "dead" ? "proven" : state === "alive" ? "refuted" : "unknown";
}

function lockTokenAbsent(db: StoreDatabase, row: Row): StoreProofResult {
  let digest: unknown;
  try {
    digest = (JSON.parse(String(row.record_json)) as { lockTokenDigest?: unknown }).lockTokenDigest;
  } catch {
    return "unknown";
  }
  if (typeof digest !== "string" || !/^[0-9a-f]{64}$/.test(digest)) return "unknown";
  const tokens = db.prepare("SELECT token FROM installation_locks").all() as Array<{ token: string }>;
  return tokens.some((lockRow) => sha256Hex(lockRow.token) === digest) ? "refuted" : "proven";
}

function folderMissing(row: Row): StoreProofResult {
  try {
    lstatSync(String(row.root_path));
    return "refuted";
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "ENOENT" ? "proven" : "unknown";
  }
}

/** The fixture stands for the process check. Without a known manager and command, it is always `unknown`. */
function packageManagerIdle(row: Row, fixture: StoreMaintenanceFixture): StoreProofResult {
  let metadata: { manager?: unknown; command?: unknown } = {};
  try { metadata = JSON.parse(String(row.metadata_json)) as typeof metadata; } catch { return "unknown"; }
  if (typeof metadata.manager !== "string" || !KNOWN_MANAGERS.has(metadata.manager)) return "unknown";
  if (typeof metadata.command !== "string" || !metadata.command.startsWith(`${metadata.manager} `)) return "unknown";
  return fixture.packageManager?.[String(row.operation_id)] ?? "unknown";
}

function proof(id: StoreMaintenanceProofId, db: StoreDatabase, row: Row, fixture: StoreMaintenanceFixture, env: StoreFixtureEnv): StoreProofResult {
  switch (id) {
    case "owner-process-dead":
      return ownerDead(row, env);
    case "package-manager-idle":
      return packageManagerIdle(row, fixture);
    case "lock-token-absent":
      return lockTokenAbsent(db, row);
    case "checkout-folder-missing":
      return folderMissing(row);
  }
}

/** STORE-RULE-004 acts only when each full ledger's receipt digest matches its text. */
function receiptDigestsMatch(row: Row): boolean {
  return (["before", "after"] as const).every((side) => {
    const ledger = row[`${side}_ledger`];
    const full = ledger !== null && ledger !== undefined && ledger !== "null";
    return !full || storeLedgerDigest(String(ledger)) === row[`${side}_ledger_digest`];
  });
}

function isInactive(target: StoreFixedRule | (typeof STORE_DECISION_ITEMS)[number]): boolean {
  return "activation" in target && target.activation.state === "inactive";
}

/**
 * Run every rule and decision item on a seeded Store. Returns the outcome
 * for each candidate row. A row that no candidate query returns is kept.
 * An inactive rule gives `skip` for every candidate, unless `asIfActive`
 * asks for the outcome that the rule gives once it is active.
 */
export function evaluateStoreFixture(
  db: StoreDatabase,
  fixture: StoreMaintenanceFixture,
  env: StoreFixtureEnv,
  options: { asIfActive?: boolean } = {},
): Map<StoreMaintenanceTarget, Map<string, StoreFixtureOutcome>> {
  const parameters = storeMaintenanceSqlParameters(env.now, FIXTURE_VERSIONS);
  const results = new Map<StoreMaintenanceTarget, Map<string, StoreFixtureOutcome>>();
  for (const target of [...STORE_FIXED_RULES, ...STORE_DECISION_ITEMS]) {
    const outcomes = new Map<string, StoreFixtureOutcome>();
    const inactive = isInactive(target) && !options.asIfActive;
    for (const query of target.candidates) {
      const rows = db.prepare(query.sql).all(storeMaintenanceParametersFor(query.sql, parameters)) as Row[];
      for (const row of rows) {
        let outcome: StoreFixtureOutcome = "act";
        if (inactive || (row.skip_reason !== undefined && row.skip_reason !== null)) outcome = "skip";
        else if (target.id === "STORE-RULE-004" && !receiptDigestsMatch(row)) outcome = "skip";
        else {
          for (const proofId of target.proofs) {
            const result = proof(proofId, db, row, fixture, env);
            if (result === "refuted") { outcome = "keep"; break; }
            if (result === "unknown") { outcome = "skip"; break; }
          }
        }
        outcomes.set(rowKey(query, row), outcome);
      }
    }
    results.set(target.id, outcomes);
  }
  return results;
}
