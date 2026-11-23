import { createHash } from "node:crypto";

/**
 * W32 R0 P1 Store table catalog and fixed maintenance rules (PRD 38 R-MAINT).
 *
 * This module is a contract only. It names every Store table and every
 * `installation_migration_records` kind with its purpose, writers, readers,
 * record class (R-MIN-1), maintenance class (R-MAINT-2), and retention. It
 * states each fixed rule (R-MAINT-3) and each decision item (R-MAINT-4) as a
 * precise condition with a read-only candidate query and the proofs that must
 * pass before a row changes. No code in this module writes the Store. The
 * `setup store check` and `setup store clean` operations (W32 R0 P4) apply
 * these rules. A change to any entry changes the catalog digest.
 */

export const STORE_TABLE_CATALOG_ID = "make-docs.store-table-catalog.v1";
export const STORE_TABLE_CATALOG_VERSION = 1;

/** The physical schema version that this catalog describes. */
export const STORE_TABLE_CATALOG_PHYSICAL_SCHEMA_VERSION = 7;

/** PRD 38 R-MIN-1 record classes, in PRD order. */
export const STORE_RECORD_CLASSES = [
  "repository-canonical and portable",
  "Store-canonical and non-rebuildable",
  "Store-cached and rebuildable",
  "live-machine fact verified at use time",
  "short-lived mutation guard",
  "historical evidence",
  "obsolete and removable after migration",
] as const;
export type StoreRecordClass = (typeof STORE_RECORD_CLASSES)[number];

/** PRD 38 R-MAINT-2 maintenance classes. */
export const STORE_MAINTENANCE_CLASSES = ["keep", "bounded", "disposable"] as const;
export type StoreMaintenanceClass = (typeof STORE_MAINTENANCE_CLASSES)[number];

export const STORE_TABLE_NAMES = [
  "projects",
  "playbook_runs",
  "work_evidence",
  "runs",
  "run_evidence",
  "store_checkpoint_journal",
  "installation_checkouts",
  "installation_ledgers",
  "installation_operations",
  "installation_steps",
  "installation_locks",
  "installation_migration_records",
  "installation_transfers",
  "tool_operations",
  "store_schema_journal",
  "store_migration_receipts",
  "backlog_review_cache",
  "project_register",
] as const;
export type StoreTableName = (typeof STORE_TABLE_NAMES)[number];

export const STORE_MIGRATION_RECORD_KINDS = ["receipt", "quiescence", "snapshot", "backup", "legacy-import"] as const;
export type StoreMigrationRecordKind = (typeof STORE_MIGRATION_RECORD_KINDS)[number];

export const STORE_FIXED_RULE_IDS = [
  "STORE-RULE-001",
  "STORE-RULE-002",
  "STORE-RULE-003",
  "STORE-RULE-004",
  "STORE-RULE-005",
  "STORE-RULE-006",
  "STORE-RULE-007",
  "STORE-RULE-008",
  "STORE-RULE-009",
] as const;
export type StoreFixedRuleId = (typeof STORE_FIXED_RULE_IDS)[number];

export const STORE_DECISION_ITEM_IDS = ["STORE-DECISION-001", "STORE-DECISION-002", "STORE-DECISION-003"] as const;
export type StoreDecisionItemId = (typeof STORE_DECISION_ITEM_IDS)[number];

/* ------------------------------------------------------------------------ */
/* Retention settings (t6)                                                  */
/* ------------------------------------------------------------------------ */

export interface StoreMaintenanceSetting {
  value: number;
  unit: "days" | "rows" | "files";
  /** True when PRD 38 fixes the value. False when it is an owner decision. */
  fixedByPrd: boolean;
  reason: string;
}

/**
 * Retention windows and kept counts. Values with `fixedByPrd: false` are
 * owner decisions in the P1 acceptance gate.
 */
export const STORE_MAINTENANCE_SETTINGS = Object.freeze({
  terminalOperationRetentionDays: {
    value: 30,
    unit: "days",
    fixedByPrd: false,
    reason: "A completed or rolled-back operation has no resume or rollback path, so its saved bytes, ledgers, and plans only help a person inspect a recent problem; 30 days keeps a month of exact evidence. Failed operations and the removal handoff row are never trimmed.",
  },
  harnessReceiptHistoryKeptCount: {
    value: 10,
    unit: "rows",
    fixedByPrd: false,
    reason: "Receipts are a few kilobytes each, so 10 older receipts for each harness and method keep a long audit trail at almost no cost.",
  },
  lifecycleRunReviewAgeDays: {
    value: 90,
    unit: "days",
    fixedByPrd: false,
    reason: "A lifecycle run can stay open through a long Wave; 90 days without an update flags only runs that a person likely forgot, and the item is a report, never a removal.",
  },
  storeBackupKeptCount: {
    value: 3,
    unit: "files",
    fixedByPrd: true,
    reason: "PRD 38 R-MAINT-5 keeps the three newest Store backups.",
  },
} satisfies Record<string, StoreMaintenanceSetting>);
export type StoreMaintenanceSettingId = keyof typeof STORE_MAINTENANCE_SETTINGS;

/**
 * Operation statuses after which an installation operation can never resume.
 * `failed` is not terminal here: PRD 38 keeps a failed row while recovery is
 * possible. STORE_FAILED_RECOVERY_CLOSED says when that recovery is closed,
 * and no rule touches a failed operation's rows.
 */
export const STORE_TERMINAL_INSTALLATION_STATUSES = ["completed", "rolled-back"] as const;

/** Statuses whose rows still hold recovery evidence. */
export const STORE_RECOVERABLE_INSTALLATION_STATUSES = ["pending", "failed"] as const;

/**
 * JSON keys in `installation_steps.before_json` and `after_json` that hold
 * saved file bytes in the Store. `payload` is not one of them: it is a
 * repository-relative path to a backup file under
 * `.make-docs/backup/operations/<operation>/` (installation-state.ts
 * savePayload), so it stays as the link that owns that file.
 */
export const STORE_SAVED_BYTE_KEYS = ["contentBase64"] as const;

/**
 * Schema v7 columns on installation_operations that hold the bounded receipt
 * of a terminal operation (PRD 38 R-MIN installation_operations, R-DB-7). The
 * commit to `completed` or `rolled-back` fills them in the same transaction
 * (database.ts fillInstallationOperationReceipt), and the v7 migration
 * backfilled them for every terminal row. STORE-RULE-004 nulls the full
 * ledgers only after these are filled. The name keeps its P1 form.
 */
export const STORE_PLANNED_OPERATION_RECEIPT_COLUMNS = Object.freeze([
  { column: "before_ledger_digest", meaning: "SHA-256 of the full before_ledger text, or NULL when there was none." },
  { column: "after_ledger_digest", meaning: "SHA-256 of the full after_ledger text, or NULL when there was none." },
  { column: "step_count", meaning: "The number of installation_steps rows of the operation." },
  { column: "applied_step_count", meaning: "The number of those steps with applied = 1." },
] as const);

/** The R-LIFE-6 failure columns on installation_operations (schema v7). */
export const STORE_OPERATION_FAILURE_COLUMNS = Object.freeze([
  { column: "failure_code", meaning: "A stable code from the error type, such as `snapshot-drift` or `operation-error`." },
  { column: "failure_summary", meaning: "A short fixed sentence: the operation, the stage, and the code. Never a raw error message, terminal output, or file content." },
  { column: "failed_stage", meaning: "The stage that failed: `prepare`, `apply`, `verify`, or `commit`." },
  { column: "next_action", meaning: "The last safe next action, which names `make-docs project state status` for the checkout." },
] as const);

/**
 * When a `failed` installation operation's recovery is closed (W32 R0 P2 T13,
 * FOLLOW-UP-P2-FAILED-RECOVERY-CLOSED). Until a later rule says otherwise, no
 * fixed rule touches a failed operation's rows.
 */
export const STORE_FAILED_RECOVERY_CLOSED = Object.freeze({
  followUp: "FOLLOW-UP-P2-FAILED-RECOVERY-CLOSED",
  openStatuses: ["failed"] as const,
  closingStatuses: ["completed", "rolled-back"] as const,
  definition: "A failed installation operation's recovery is closed only when `make-docs project state recover <operation> --resume` or `--rollback` commits it, so its status becomes `completed` or `rolled-back`. While its status is `failed`, its recovery is open. No time limit, lock loss, or clean closes it.",
  whileOpen: "No fixed rule touches the operation, its steps, its detached plan or atomic write intents, the lock on its checkout, or its quiescence barrier. It blocks new operations on its checkout, tool changes, and Store removal like a pending operation.",
  afterClosed: "The row is terminal and keeps its failure fields as history. The terminal rules (STORE-RULE-003, STORE-RULE-004, STORE-RULE-005) then count its retention window from its new finished_at, like any completed or rolled-back operation.",
});

/* ------------------------------------------------------------------------ */
/* Proofs                                                                   */
/* ------------------------------------------------------------------------ */

export const STORE_MAINTENANCE_PROOF_IDS = [
  "owner-process-dead",
  "package-manager-idle",
  "lock-token-absent",
  "checkout-folder-missing",
] as const;
export type StoreMaintenanceProofId = (typeof STORE_MAINTENANCE_PROOF_IDS)[number];

/** Each proof gives one of three results. Only `proven` lets a rule act. */
export type StoreProofResult = "proven" | "refuted" | "unknown";

export interface StoreMaintenanceProof {
  id: StoreMaintenanceProofId;
  title: string;
  /** The exact check. */
  check: string;
  /** The existing code that performs or models the check. */
  source: string;
  proven: string;
  refuted: string;
  unknown: string;
}

export const STORE_MAINTENANCE_PROOFS: readonly StoreMaintenanceProof[] = Object.freeze([
  {
    id: "owner-process-dead",
    title: "The owner process is dead",
    check: "platform.processLiveness(pid, hostname) returns `dead`. That means the row's host is this host, the pid is a positive safe integer, and process.kill(pid, 0) fails with ESRCH.",
    source: "packages/cli/src/platform.ts processLiveness, used by installation-state.ts isDead and lease-recovery.ts assertOwnerDead",
    proven: "`dead`: the owner stopped.",
    refuted: "`alive`: the owner still runs, so the row stays.",
    unknown: "`unknown`: another host, an invalid pid, or a permission error. The row stays, and the report says that its owner cannot be checked from this machine.",
  },
  {
    id: "package-manager-idle",
    title: "No package manager run is still active",
    check: "The metadata has a known `manager` (npm, pnpm, bun, or brew) and the exact `command` string that Make Docs ran. The process list of this host can be read in full, and no live process runs that manager with the recorded command's arguments. `binaryPath` is the Make Docs CLI path, not the manager, so the check never uses it. Children of the dead owner cannot be found after it exits, so they give no proof.",
    source: "New in W32 R0 P4. No current helper lists processes. The metadata comes from self/update-tool.ts and self/uninstall-tool.ts.",
    proven: "The full process list holds no run of the recorded manager command.",
    refuted: "A matching run exists, so the row stays pending.",
    unknown: "Any doubt: the process list cannot be read or is partial, the metadata has no known `manager` or no `command`, or a process matches the manager but its arguments cannot be read. The row stays pending, and the report says why.",
  },
  {
    id: "lock-token-absent",
    title: "The lock that the barrier names is gone",
    check: "The quiescence record JSON parses and has a 64-character hex `lockTokenDigest`, and no `installation_locks` row has a token whose SHA-256 hex digest equals it.",
    source: "packages/cli/src/migration.ts writeQuiescence and digest (SHA-256 hex of the lock token)",
    proven: "No lock row has that token.",
    refuted: "A lock row with that token exists, so the barrier stays.",
    unknown: "The record JSON is unreadable or has no digest. The row stays, and the report says why.",
  },
  {
    id: "checkout-folder-missing",
    title: "The checkout folder is missing",
    check: "lstat of `installation_checkouts.root_path` fails with ENOENT.",
    source: "New in W32 R0 P4, with the same path rules as installation-state.ts canonicalInstallationPath.",
    proven: "The folder does not exist.",
    refuted: "The folder exists.",
    unknown: "Any other error, such as a permission error or an unmounted drive. The report says that the folder cannot be checked.",
  },
]);

/* ------------------------------------------------------------------------ */
/* Table catalog (t1)                                                       */
/* ------------------------------------------------------------------------ */

export interface StoreRMinRowClaim {
  row: string;
  classCell: string;
}

export interface StoreRowClassEntry {
  /** Which rows of the table this entry covers, in plain words. */
  rows: string;
  maintenanceClass: StoreMaintenanceClass;
  /** The fixed rule that removes or trims these rows. Keep rows have none. */
  rule: StoreFixedRuleId | null;
  /** The limit for bounded rows that no fixed rule trims. */
  limit: string | null;
}

export interface StoreTableCatalogEntry {
  table: StoreTableName;
  /** The schema version that creates the table. */
  sinceSchema: number;
  /** `planned` tables do not exist in the physical schema yet. */
  schemaStatus: "physical" | "planned";
  /** Physical columns, in schema order. A planned table lists its planned columns. */
  columns: readonly string[];
  purpose: string;
  writers: readonly string[];
  readers: readonly string[];
  recordClass: StoreRecordClass | "declared per kind";
  /** Each PRD 38 R-MIN row that governs this table's fields: the start of its first cell and its exact Class cell. */
  rMinRows: readonly StoreRMinRowClaim[];
  rowClasses: readonly StoreRowClassEntry[];
  retention: string;
  decisionItems: readonly StoreDecisionItemId[];
  humanMeaning: string;
}

const keepRows = (rows: string): StoreRowClassEntry => ({ rows, maintenanceClass: "keep", rule: null, limit: null });

export const STORE_TABLE_CATALOG: readonly StoreTableCatalogEntry[] = Object.freeze<StoreTableCatalogEntry[]>([
  {
    table: "projects",
    sinceSchema: 1,
    schemaStatus: "physical",
    columns: ["project_id", "root_path", "package_name", "package_version", "registered_at", "last_seen_at"],
    purpose: "Legacy discovery mirror of each project's manifest, keyed by project ID with one root path.",
    writers: ["None current. registry-mirror.ts mirrorProjectManifest and rebuildProjectRegistry have no caller.", "Delete only: state-rows.ts deleteProjectRows through lifecycle.ts pruneProjectFromStore, which has no caller (FOLLOW-UP-P3-DELETE-PROJECT-ROWS)"],
    readers: ["Legacy import identity adoption", "lifecycle.ts pruneProjectFromStore remaining-project count (a defect that W32 R0 P3 moves to project_register)"],
    recordClass: "obsolete and removable after migration",
    rMinRows: [{ row: "`projects`:", classCell: "Obsolete and removable after migration" }],
    rowClasses: [keepRows("Every row. It is a read-only legacy input.")],
    retention: "Keep read-only until legacy import no longer reads it, then drop the table in a later migration.",
    decisionItems: [],
    humanMeaning: "An old list of projects. Make Docs no longer writes it and keeps it only so an old install can still be imported.",
  },
  {
    table: "playbook_runs",
    sinceSchema: 1,
    schemaStatus: "physical",
    columns: ["project_id", "run_id", "record", "created_at", "updated_at"],
    purpose: "Legacy Playbook run state, kept as opaque JSON.",
    writers: ["None current. state-rows.ts createPlaybookRunRecord, transitionPlaybookRunRecord, and upsertPlaybookRunRecord have no caller.", "Delete only, against R-LIFE-2: state-rows.ts deleteProjectRows through lifecycle.ts pruneProjectFromStore, which has no caller (FOLLOW-UP-P3-DELETE-PROJECT-ROWS)"],
    readers: ["Explicit export", "Compatibility", "Removal review"],
    recordClass: "historical evidence",
    rMinRows: [{ row: "`playbook_runs`:", classCell: "Historical evidence" }],
    rowClasses: [keepRows("Every row. Maintenance never reads or changes the opaque record.")],
    retention: "Preserve until its bridge exit and a separate export or deletion approval.",
    decisionItems: [],
    humanMeaning: "Old Playbook history. Make Docs keeps it untouched until a person approves its export or removal.",
  },
  {
    table: "work_evidence",
    sinceSchema: 1,
    schemaStatus: "physical",
    columns: ["project_id", "wave_slug", "phase_path", "evidence_kind", "payload", "repo_root", "recorded_at"],
    purpose: "Recorded sign-offs and decisions for work phases that the repository cannot rebuild.",
    writers: ["`work.evidence.record` through project-state.ts upsertWorkEvidence", "Delete only: state-rows.ts deleteProjectRows through lifecycle.ts pruneProjectFromStore, which has no caller (FOLLOW-UP-P3-DELETE-PROJECT-ROWS)"],
    readers: ["Work evidence read", "Wave status", "Lifecycle views", "Export", "Compatibility"],
    recordClass: "historical evidence",
    rMinRows: [{ row: "`work_evidence`:", classCell: "Historical evidence for old rows; current rows are Store-canonical recorded decisions" }],
    rowClasses: [keepRows("Every row.")],
    retention: "Keep. Maintenance never removes it. A payload above 64 KiB of JSON is refused under R-MAINT-6 (state-rows.ts WORK_EVIDENCE_PAYLOAD_LIMIT_BYTES).",
    decisionItems: [],
    humanMeaning: "Your recorded sign-offs and decisions. Maintenance never removes them.",
  },
  {
    table: "runs",
    sinceSchema: 2,
    schemaStatus: "physical",
    columns: ["project_id", "run_id", "run_type", "lifecycle_stage", "status", "checkpoint", "version", "metadata", "started_at", "updated_at", "finished_at"],
    purpose: "General lifecycle runs and their legal state.",
    writers: ["Lifecycle operation core in lifecycle-runs.ts", "Delete only: state-rows.ts deleteProjectRows through lifecycle.ts pruneProjectFromStore, which has no caller (FOLLOW-UP-P3-DELETE-PROJECT-ROWS)"],
    readers: ["Lifecycle show, list, transition, and evidence", "Status", "Export"],
    recordClass: "Store-canonical and non-rebuildable",
    rMinRows: [{ row: "`runs`:", classCell: "Store-canonical and non-rebuildable" }],
    rowClasses: [keepRows("Every row, open or terminal.")],
    retention: "Retain until an explicit scoped project-state cleanup after export and terminal-state review. A run left open past the review age is a decision item.",
    decisionItems: ["STORE-DECISION-002"],
    humanMeaning: "Your lifecycle runs. A run that stayed open for a long time is shown to you, never removed.",
  },
  {
    table: "run_evidence",
    sinceSchema: 2,
    schemaStatus: "physical",
    columns: ["project_id", "run_id", "evidence_id", "evidence_kind", "reference_type", "reference_value", "digest", "recorded_at"],
    purpose: "Bounded evidence references for lifecycle runs.",
    writers: ["Lifecycle evidence operation in lifecycle-runs.ts", "Delete only: state-rows.ts deleteProjectRows through lifecycle.ts pruneProjectFromStore, which has no caller (FOLLOW-UP-P3-DELETE-PROJECT-ROWS)"],
    readers: ["Lifecycle evidence readers", "Status", "Export"],
    recordClass: "Store-canonical and non-rebuildable",
    rMinRows: [{ row: "`run_evidence`:", classCell: "Store-canonical when the external reference is non-rebuildable; Store-cached for a repository reference" }],
    rowClasses: [keepRows("Every row. No fixed rule prunes repository references.")],
    retention: "Follow the run. Repository references may be rebuilt, but no fixed rule removes them.",
    decisionItems: [],
    humanMeaning: "Links from a lifecycle run to its evidence. They stay with their run.",
  },
  {
    table: "store_checkpoint_journal",
    sinceSchema: 2,
    schemaStatus: "physical",
    columns: ["receipt_id", "checkpoint", "project_root_digest", "snapshot_id", "committed_at", "receipt_json"],
    purpose: "Old checkpoint-9 cutover receipts.",
    writers: ["None current after the bridge cutover. Schema v5 copied each row into store_migration_receipts."],
    readers: ["Compatibility", "Export", "Bridge remaining-state check"],
    recordClass: "historical evidence",
    rMinRows: [{ row: "`store_checkpoint_journal`:", classCell: "Historical evidence, then disposable" }],
    rowClasses: [
      { rows: "A row whose receipt ID is also in store_migration_receipts.", maintenanceClass: "disposable", rule: "STORE-RULE-007", limit: null },
      keepRows("A row with no matching migration receipt."),
    ],
    retention: "Disposable once a store_migration_receipts row with the same receipt ID exists. Otherwise keep.",
    decisionItems: [],
    humanMeaning: "Old copies of migration receipts. Once the newer receipt table holds the same receipt, the old copy can go.",
  },
  {
    table: "installation_checkouts",
    sinceSchema: 3,
    schemaStatus: "physical",
    columns: ["checkout_id", "project_id", "root_path", "created_at", "root_path_key", "verified_at", "verification_json"],
    purpose: "Binds one local clone or worktree to its project ID, with its folder path and last verification.",
    writers: ["Reviewed checkout bind (installation-state.ts bindCheckout)", "Separate checkout registration (registerSeparateInstallationCheckout)", "The path-update rule: checkout move (applyInstallationCheckoutMove), the only writer of root_path and verification after bind", "Explicit legacy identity repair (adoptLegacyProjectIdentity)"],
    readers: ["Installation", "Recovery", "Status", "Setup", "Removal", "Lock planning", "`project list` and Store maintenance (W32 R0)"],
    recordClass: "Store-canonical and non-rebuildable",
    rMinRows: [
      { row: "`installation_checkouts`: `checkout_id`", classCell: "Store-canonical and non-rebuildable" },
      { row: "`installation_checkouts.root_path`", classCell: "Store-cached and rebuildable mutable lookup" },
      { row: "`installation_checkouts.root_device`", classCell: "Obsolete and removable after migration" },
    ],
    rowClasses: [keepRows("Every row. A missing folder is a decision item, never an automatic removal.")],
    retention: "Retain until explicit reviewed checkout-state removal. Only the path-update rule replaces root_path and verification.",
    decisionItems: ["STORE-DECISION-001"],
    humanMeaning: "Which folders on this machine belong to which project. A folder that is gone is shown to you, never removed for you.",
  },
  {
    table: "installation_ledgers",
    sinceSchema: 3,
    schemaStatus: "physical",
    columns: ["checkout_id", "manifest_json", "updated_at"],
    purpose: "The current ownership record of each checkout: which files Make Docs applied and their digests.",
    writers: ["Shared install, resource apply, and layout operations through installation-state.ts commitOperation"],
    readers: ["Verify", "Refresh", "Repair", "Remove", "Audit", "Status", "Recovery", "Skill adoption path claims"],
    recordClass: "Store-canonical and non-rebuildable",
    rMinRows: [
      { row: "`installation_ledgers.manifest_json`", classCell: "Store-canonical and non-rebuildable current ownership record" },
      { row: "Target project last-applied ownership", classCell: "Store-canonical and non-rebuildable minimum last-applied state" },
    ],
    rowClasses: [keepRows("Every row.")],
    retention: "Retain while Make Docs claims local applied ownership. Delete on `setup remove` or verified ownership release.",
    decisionItems: [],
    humanMeaning: "The list of files that Make Docs put in each project. It stays while Make Docs owns those files.",
  },
  {
    table: "installation_operations",
    sinceSchema: 3,
    schemaStatus: "physical",
    columns: ["operation_id", "checkout_id", "operation", "status", "before_ledger", "after_ledger", "created_at", "finished_at", "plan_complete", "failure_code", "failure_summary", "failed_stage", "next_action", "before_ledger_digest", "after_ledger_digest", "step_count", "applied_step_count"],
    purpose: "The shared mutation journal: one row for each installation operation, with its before and after ledgers.",
    writers: ["Shared mutation journal in installation-state.ts (withInstallationOperation, detached plans, legacy recovery import)"],
    readers: ["Setup", "Status", "Recover", "Audit", "Store maintenance", "Removal", "Tool operation and Store removal guards"],
    recordClass: "Store-canonical and non-rebuildable",
    rMinRows: [{ row: "`installation_operations`:", classCell: "Store-canonical and non-rebuildable" }],
    rowClasses: [
      keepRows("A pending or failed row while recovery is possible."),
      { rows: "The full before and after ledgers of a completed or rolled-back row after the retention window, once its v7 receipt columns are filled. Never the removal handoff row.", maintenanceClass: "bounded", rule: "STORE-RULE-004", limit: null },
      keepRows("The bounded receipt of a completed or rolled-back row: operation, status, times, step counts, ledger digests, and failure summary."),
      keepRows("The latest completed `setup.remove` of a checkout with no current ledger. Setup reads its full before-ledger to offer setup after removal."),
    ],
    retention: "Keep pending and failed rows while recovery is possible; STORE_FAILED_RECOVERY_CLOSED says when a failed row's recovery ends. After a completed or rolled-back state and the retention window, keep the bounded receipt in the v7 receipt columns and null the full ledgers.",
    decisionItems: ["STORE-DECISION-001", "STORE-DECISION-003"],
    humanMeaning: "A record of each change Make Docs made to a project. Old finished records keep a short summary.",
  },
  {
    table: "installation_steps",
    sinceSchema: 3,
    schemaStatus: "physical",
    columns: ["operation_id", "ordinal", "relative_path", "before_json", "after_json", "applied"],
    purpose: "Ordered file steps of each installation operation, with saved file bytes for recovery.",
    writers: ["Shared mutation journal in installation-state.ts"],
    readers: ["Apply", "Verify", "Resume", "Rollback", "Status", "Store maintenance"],
    recordClass: "Store-canonical and non-rebuildable",
    rMinRows: [{ row: "`installation_steps`:", classCell: "Store-canonical and non-rebuildable while recovery is open; bounded history after closure" }],
    rowClasses: [
      keepRows("Every step of a pending or failed operation."),
      { rows: "Saved file contents (`contentBase64`) of a completed or rolled-back operation's steps after the retention window. Never the removal handoff row, and never while a detached plan or atomic intent of the operation exists.", maintenanceClass: "bounded", rule: "STORE-RULE-003", limit: null },
      keepRows("The path, applied state, kind, digest, mode, and `payload` backup file link of each step of a completed or rolled-back operation."),
    ],
    retention: "Keep exact recovery evidence while the operation is pending or failed. After a completed or rolled-back state and the retention window, remove saved file contents (`contentBase64`) and keep path, applied state, digests, and `payload` backup file links.",
    decisionItems: [],
    humanMeaning: "The file-by-file steps of each change. Old copies of file contents are removed once the change is long finished.",
  },
  {
    table: "installation_locks",
    sinceSchema: 3,
    schemaStatus: "physical",
    columns: ["root_path", "token", "pid", "hostname", "acquired_at"],
    purpose: "One mutation lock for each checkout root while a writer runs.",
    writers: ["Platform lock service: installation-state.ts acquireInstallationLock, releaseInstallationLock, and accepted stale recovery"],
    readers: ["Current writer", "Status", "Store maintenance", "Tool operation and Store removal guards"],
    recordClass: "short-lived mutation guard",
    rMinRows: [{ row: "`installation_locks`:", classCell: "Short-lived mutation guard" }],
    rowClasses: [
      keepRows("A lock whose owner is alive or cannot be checked, or that guards a pending operation."),
      { rows: "A lock whose owner is proven dead and that guards no pending operation.", maintenanceClass: "disposable", rule: "STORE-RULE-001", limit: null },
    ],
    retention: "Delete on release or accepted stale recovery. A lock whose owner is proven dead and that guards no pending operation is disposable.",
    decisionItems: [],
    humanMeaning: "A sign that says a Make Docs command is changing a project. A sign left by a command that crashed is removed.",
  },
  {
    table: "installation_migration_records",
    sinceSchema: 3,
    schemaStatus: "physical",
    columns: ["checkout_id", "kind", "record_id", "record_json"],
    purpose: "Migration and installation evidence for each checkout, by declared kind.",
    writers: ["Migration (migration.ts)", "Installation operations (installation-state.ts)", "Harness receipts (harness-integration-receipts.ts)", "Legacy import (legacy-installation.ts)", "Schema v5 bridge"],
    readers: ["Migration", "Recovery", "Status", "Export", "Bridge checks", "Store maintenance"],
    recordClass: "declared per kind",
    rMinRows: [{ row: "`installation_migration_records`:", classCell: "Declared per kind in the Store table catalog under R-MAINT-1" }],
    rowClasses: [
      keepRows("Each kind declares its own row classes in STORE_MIGRATION_RECORD_KIND_CATALOG."),
    ],
    retention: "Each kind and record family declares its class and retention.",
    decisionItems: ["STORE-DECISION-001"],
    humanMeaning: "Saved plans, receipts, and backups from changes and migrations. Each kind has its own rule.",
  },
  {
    table: "installation_transfers",
    sinceSchema: 3,
    schemaStatus: "physical",
    columns: ["checkout_id", "source_path", "source_digest", "status", "imported_at"],
    purpose: "Legacy proof that old project-local state was imported once.",
    writers: ["None current after the bridge cutover."],
    readers: ["Compatibility reader", "Bridge remaining-state check"],
    recordClass: "obsolete and removable after migration",
    rMinRows: [{ row: "`installation_transfers`:", classCell: "Obsolete and removable after migration" }],
    rowClasses: [keepRows("Every row. It is read-only legacy history.")],
    retention: "Preserve through the local-state transfer bridge, then remove only after its exit and separate approval.",
    decisionItems: [],
    humanMeaning: "Old proof that a past import happened. It stays until a person approves its removal.",
  },
  {
    table: "tool_operations",
    sinceSchema: 3,
    schemaStatus: "physical",
    columns: ["operation_id", "operation", "status", "pid", "hostname", "metadata_json", "started_at", "finished_at"],
    purpose: "Machine-wide tool operations (`tool.update`, `tool.uninstall`, `setup.system.harness`), machine harness receipts, and the schema v5 bridge marker.",
    writers: ["Tool operation journal (tool-operations.ts runRecordedToolOperation)", "Machine harness setup (harness-system-operations.ts, harness-integration-receipts.ts)", "Schema v5 bridge"],
    readers: ["Tool mutation", "Harness history", "Status", "Store maintenance", "Store removal guard", "Installation lock acquisition"],
    recordClass: "Store-canonical and non-rebuildable",
    rMinRows: [{ row: "`tool_operations`:", classCell: "Store-canonical while active; bounded history after terminal result" }],
    rowClasses: [
      keepRows("A pending row whose owner is alive or cannot be checked, and every pending `setup.system.harness` row."),
      { rows: "A pending `tool.update` or `tool.uninstall` whose owner is proven dead and whose package manager is idle. It becomes `failed` with reason `abandoned` and stays as history.", maintenanceClass: "bounded", rule: "STORE-RULE-002", limit: null },
      keepRows("The current harness receipt pointer (`setup.system.receipt-current`) and the compatibility bridge marker."),
      { rows: "Machine harness receipts and observations beyond the kept count for each harness and method.", maintenanceClass: "bounded", rule: "STORE-RULE-009", limit: null },
      keepRows("Completed and failed `tool.update` and `tool.uninstall` rows."),
      keepRows("Completed and failed `setup.system.harness` rows."),
    ],
    retention: "Keep active rows through recovery. Mark an abandoned tool update or uninstall as failed. Keep the current harness receipt and a fixed number of older receipts.",
    decisionItems: [],
    humanMeaning: "A record of Make Docs updating or removing itself and of machine harness setup. A crashed update stops blocking the machine.",
  },
  {
    table: "store_schema_journal",
    sinceSchema: 3,
    schemaStatus: "physical",
    columns: ["schema_version", "description", "committed_at"],
    purpose: "One row for each accepted schema version.",
    writers: ["Each schema migration transaction"],
    readers: ["Store status: `project state status` (installation-state.ts readInstallationStatus through database.ts readStoreSchemaJournal), which reports a missing version"],
    recordClass: "historical evidence",
    rMinRows: [{ row: "`store_schema_journal`:", classCell: "Historical evidence" }],
    rowClasses: [keepRows("Every row.")],
    retention: "Retain one immutable row per accepted schema version for the Store lifetime.",
    decisionItems: [],
    humanMeaning: "The history of Store upgrades. It is never removed.",
  },
  {
    table: "store_migration_receipts",
    sinceSchema: 5,
    schemaStatus: "physical",
    columns: ["receipt_id", "operation", "project_root_digest", "source_schema_version", "target_schema_version", "snapshot_id", "result", "committed_at", "receipt_json"],
    purpose: "Receipts of explicit Store schema migrations.",
    writers: ["Schema v5 bridge copy", "database.ts migrateStoreDatabaseAtCheckpoint9, whose receipt names the current target version under the v7 CHECK"],
    readers: ["Compatibility", "Status history", "Bridge checks", "Export", "STORE-RULE-007"],
    recordClass: "historical evidence",
    rMinRows: [{ row: "Receipt history", classCell: "Historical evidence" }],
    rowClasses: [keepRows("Every row.")],
    retention: "Retain until the owning history policy or bridge exit permits scoped removal. No fixed rule removes it.",
    decisionItems: [],
    humanMeaning: "Proof of each Store upgrade. It is kept.",
  },
  {
    table: "backlog_review_cache",
    sinceSchema: 6,
    schemaStatus: "physical",
    columns: ["checkout_id", "record_path", "record_digest", "snapshot_schema_version", "rule_catalog_version", "skill_version", "fragment_json", "created_at", "updated_at"],
    purpose: "Optional per-record backlog review cache.",
    writers: ["Backlog review cache service (operations/work/backlog/cache-service.ts)"],
    readers: ["Backlog review cache readers", "Validation", "Pruning", "Store status"],
    recordClass: "Store-cached and rebuildable",
    rMinRows: [{ row: "Backlog review cache", classCell: "Store-cached and rebuildable" }],
    rowClasses: [
      { rows: "A row whose snapshot schema, rule catalog, or Skill version is older than the current version.", maintenanceClass: "disposable", rule: "STORE-RULE-008", limit: null },
      { rows: "A row for the current versions.", maintenanceClass: "bounded", rule: null, limit: "512 rows for each checkout, trimmed by the cache writer (BACKLOG_REVIEW_CACHE_MAX_ENTRIES_PER_CHECKOUT)." },
    ],
    retention: "May be deleted or rebuilt at any time. Rows for old versions are disposable. Rows for a checkout whose folder is missing are part of that decision item.",
    decisionItems: ["STORE-DECISION-001"],
    humanMeaning: "A speed-up for backlog reviews. Entries from older Make Docs versions are removed.",
  },
  {
    table: "project_register",
    sinceSchema: 7,
    schemaStatus: "physical",
    columns: ["project_id", "project_name", "first_seen_at", "last_seen_at"],
    purpose: "One row for each project that the Store knows. Schema v7 adds it empty; W32 R0 P3 fills it.",
    writers: ["Each Store write for the project under R-ID-8 and R-REGISTER-1"],
    readers: ["`project list`", "Project resource URI reads", "Status", "Setup", "Prune", "Store maintenance"],
    recordClass: "Store-cached and rebuildable",
    rMinRows: [{ row: "`project_register`:", classCell: "Store-cached and rebuildable from each bound checkout's `.make-docs/config.yaml` and `installation_checkouts`" }],
    rowClasses: [keepRows("Every row while any checkout of the project is bound.")],
    retention: "Retain while any checkout of the project is bound. Replace the name when config names the project differently.",
    decisionItems: [],
    humanMeaning: "The list of your projects, with their short names.",
  },
]);

/**
 * PRD 38 R-MIN rows that name no Store table. Each one says where its record
 * lives instead. The drift test needs every R-MIN row to be claimed by a table,
 * a record kind, or this list.
 */
export const STORE_NON_TABLE_RMIN_ROWS: readonly (StoreRMinRowClaim & { location: string })[] = Object.freeze([
  { row: "Project config `projectId`", classCell: "Repository-canonical and portable", location: "Repository file `.make-docs/config.yaml`." },
  { row: "Global config machine preferences", classCell: "Store-canonical and non-rebuildable", location: "Store file `config.json`, not a table." },
  { row: "Global manifest minimum", classCell: "Store-canonical and non-rebuildable", location: "Store file for the global manifest, not a table." },
  { row: "Project config `work` and `factory` blocks", classCell: "Repository-canonical and portable", location: "Repository file `.make-docs/config.yaml`." },
  { row: "Work store records (schema v8)", classCell: "Store-canonical and non-rebuildable", location: "Planned schema v8 table, added by W29 R0 P2." },
  { row: "Work sync ledger", classCell: "Store-canonical and non-rebuildable minimum last-applied state", location: "Planned schema v8 table, added by W29 R0 P2." },
  { row: "Work sync conflicts", classCell: "Store-cached and rebuildable", location: "Planned schema v8 table, added by W29 R0 P2." },
  { row: "Work claims", classCell: "Short-lived mutation guard", location: "Planned schema v8 table, added by W29 R0 P2." },
  { row: "Factory machine tools", classCell: "Store-cached and rebuildable", location: "Planned factory table, added by W30 R0." },
  { row: "Factory workflow bindings", classCell: "Store-canonical and non-rebuildable", location: "Planned factory table, added by W30 R0." },
  { row: "Factory grants", classCell: "Store-canonical and non-rebuildable", location: "Planned factory table, added by W30 R0." },
  { row: "Factory assignments", classCell: "Store-canonical and non-rebuildable", location: "Planned factory table, added by W30 R0." },
  { row: "Factory proof results", classCell: "Store-canonical and non-rebuildable", location: "Planned factory table, added by W30 R0." },
  { row: "Factory backup records", classCell: "Store-canonical and non-rebuildable while the backup exists", location: "Planned factory table, added by W30 R0." },
]);

/* ------------------------------------------------------------------------ */
/* installation_migration_records kinds (t2)                                */
/* ------------------------------------------------------------------------ */

export const STORE_MIGRATION_RECORD_FAMILY_IDS = [
  "migration-receipt",
  "checkout-move-receipt",
  "harness-receipt-current",
  "harness-receipt",
  "harness-receipt-observation",
  "legacy-quiescence",
  "detached-plan",
  "detached-original-plan",
  "migration-snapshot",
  "atomic-write-intent",
  "migration-backup",
  "legacy-import-receipt",
  "bridge-evidence",
] as const;
export type StoreMigrationRecordFamilyId = (typeof STORE_MIGRATION_RECORD_FAMILY_IDS)[number];

export interface StoreMigrationRecordFamily {
  id: StoreMigrationRecordFamilyId;
  /** How a row is matched, in plain words. */
  match: string;
  /** The record ID test. `null` when the family is matched by its JSON. */
  recordIdPattern: RegExp | null;
  writers: readonly string[];
  maintenanceClass: StoreMaintenanceClass;
  rule: StoreFixedRuleId | null;
  retention: string;
}

export interface StoreMigrationRecordKindEntry {
  kind: StoreMigrationRecordKind;
  purpose: string;
  readers: readonly string[];
  recordClass: StoreRecordClass;
  /** Families in match order. A row that matches none is kept and reported as unclassified. */
  families: readonly StoreMigrationRecordFamily[];
  humanMeaning: string;
}

const SHA256_ID = /^sha256:[0-9a-f]{64}$/;
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

export const STORE_MIGRATION_RECORD_KIND_CATALOG: readonly StoreMigrationRecordKindEntry[] = Object.freeze<StoreMigrationRecordKindEntry[]>([
  {
    kind: "receipt",
    purpose: "Receipts that prove a past migration, checkout move, or project harness change.",
    readers: ["Migration verify", "Checkout move retry", "Project harness status and history", "Compatibility bridge checks", "Export"],
    recordClass: "historical evidence",
    families: [
      { id: "migration-receipt", match: "Record ID is `sha256:` plus 64 hex characters.", recordIdPattern: SHA256_ID, writers: ["migration.ts commit receipt", "Legacy import"], maintenanceClass: "keep", rule: null, retention: "Keep for the checkout lifetime." },
      { id: "checkout-move-receipt", match: "Record ID starts with `checkout-move:`.", recordIdPattern: /^checkout-move:/, writers: ["installation-state.ts applyInstallationCheckoutMove"], maintenanceClass: "keep", rule: null, retention: "Keep for the checkout lifetime. A move retry reads it." },
      { id: "harness-receipt-current", match: "Record ID starts with `harness-receipt-current:project:`.", recordIdPattern: /^harness-receipt-current:project:/, writers: ["harness-integration-receipts.ts recordHarnessIntegrationReceipt"], maintenanceClass: "keep", rule: null, retention: "Keep while the harness integration exists." },
      { id: "harness-receipt-observation", match: "Record ID starts with `harness-receipt-observation:`.", recordIdPattern: /^harness-receipt-observation:/, writers: ["harness-integration-receipts.ts recordHarnessIntegrationReceiptObservation"], maintenanceClass: "bounded", rule: "STORE-RULE-009", retention: "Keep the kept count of newest history rows for each checkout, harness, and method." },
      { id: "harness-receipt", match: "Record ID is a UUID, and the JSON has `scope` `project`, a `harnessId`, and a `connectionMethod`.", recordIdPattern: new RegExp(`^${UUID}$`), writers: ["harness-integration-receipts.ts recordHarnessIntegrationReceipt"], maintenanceClass: "bounded", rule: "STORE-RULE-009", retention: "Keep the kept count of newest history rows for each checkout, harness, and method." },
    ],
    humanMeaning: "Receipts of past changes. Only old harness receipts beyond the kept count are removed.",
  },
  {
    kind: "quiescence",
    purpose: "The legacy quiescence barrier that stops old writers during a migration.",
    readers: ["Migration", "Legacy operation guard (migration.ts assertLegacyOperationNotQuiesced)"],
    recordClass: "short-lived mutation guard",
    families: [
      { id: "legacy-quiescence", match: "Record ID is `legacy`.", recordIdPattern: /^legacy$/, writers: ["migration.ts acquireProjectMigrationLock and bindQuiescenceToSnapshot", "Legacy import"], maintenanceClass: "disposable", rule: "STORE-RULE-006", retention: "Kept today. STORE-RULE-006 is inactive, because the bound barrier that every setup leaves is the post-migration freeze. A later phase may remove only an unbound barrier (no snapshotId) left by a crash, with owner approval." },
    ],
    humanMeaning: "A sign that stops old Make Docs writers after a migration. It is kept.",
  },
  {
    kind: "snapshot",
    purpose: "Saved plans for detached installation operations and frozen migration snapshots.",
    readers: ["Detached operation resume and verify (installation-state.ts)", "Migration verify"],
    recordClass: "Store-canonical and non-rebuildable",
    families: [
      { id: "detached-plan", match: "Record ID is `detached:` plus an operation ID.", recordIdPattern: /^detached:/, writers: ["installation-state.ts detached plan start and replan"], maintenanceClass: "disposable", rule: "STORE-RULE-005", retention: "Disposable once its operation has been completed or rolled back for the retention window. The rule is inactive until W32 R0 P4." },
      { id: "detached-original-plan", match: "Record ID is `detached-original:` plus an operation ID.", recordIdPattern: /^detached-original:/, writers: ["installation-state.ts detached plan start for `setup.skills.adopt`"], maintenanceClass: "disposable", rule: "STORE-RULE-005", retention: "Disposable once its operation has been completed or rolled back for the retention window. The rule is inactive until W32 R0 P4." },
      { id: "migration-snapshot", match: "Record ID is `sha256:` plus 64 hex characters.", recordIdPattern: SHA256_ID, writers: ["migration.ts freeze snapshot"], maintenanceClass: "keep", rule: null, retention: "Keep. A migration receipt names it." },
    ],
    humanMeaning: "Saved plans. A plan for a change that finished long ago is removed.",
  },
  {
    kind: "backup",
    purpose: "Atomic write intents of detached operations and migration backup manifests.",
    readers: ["Detached operation recovery (installation-state.ts)", "Migration restore"],
    recordClass: "Store-canonical and non-rebuildable",
    families: [
      { id: "atomic-write-intent", match: "Record ID is `atomic:` plus an operation ID, a colon, and a step ordinal.", recordIdPattern: /^atomic:.+:\d+$/, writers: ["installation-state.ts atomic write save"], maintenanceClass: "disposable", rule: "STORE-RULE-005", retention: "Disposable once its operation has been completed or rolled back for the retention window. The rule is inactive until W32 R0 P4." },
      { id: "migration-backup", match: "Any other record ID.", recordIdPattern: /^(?!atomic:)/, writers: ["migration.ts backup manifest", "Legacy import"], maintenanceClass: "keep", rule: null, retention: "Keep. It is the restore path for a migration." },
    ],
    humanMeaning: "Backup notes. A note for a change that finished long ago is removed. Migration backups are kept.",
  },
  {
    kind: "legacy-import",
    purpose: "Proof of a legacy install import and the schema v5 bridge evidence.",
    readers: ["Legacy import retry (legacy-installation.ts)", "Compatibility bridge checks"],
    recordClass: "historical evidence",
    families: [
      { id: "bridge-evidence", match: "Record ID starts with `w22-p5:`.", recordIdPattern: /^w22-p5:/, writers: ["Schema v5 bridge", "Checkpoint-9 ledger projection"], maintenanceClass: "keep", rule: null, retention: "Keep through the bridge exit." },
      { id: "legacy-import-receipt", match: "Any other record ID.", recordIdPattern: /^(?!w22-p5:)/, writers: ["installation-state.ts importInstallationState"], maintenanceClass: "keep", rule: null, retention: "Keep for the checkout lifetime." },
    ],
    humanMeaning: "Proof that an old install was imported. It is kept.",
  },
]);

/**
 * Classify one `installation_migration_records` row. Returns `null` when no
 * family matches. An unclassified row is kept and reported.
 */
export function classifyMigrationRecord(
  kind: string,
  recordId: string,
  recordJson: string,
): StoreMigrationRecordFamilyId | null {
  const entry = STORE_MIGRATION_RECORD_KIND_CATALOG.find((candidate) => candidate.kind === kind);
  if (!entry) return null;
  for (const family of entry.families) {
    if (family.recordIdPattern && !family.recordIdPattern.test(recordId)) continue;
    if (family.id === "harness-receipt" && !isProjectHarnessReceiptJson(recordJson)) continue;
    return family.id;
  }
  return null;
}

function isProjectHarnessReceiptJson(recordJson: string): boolean {
  try {
    const value = JSON.parse(recordJson) as Record<string, unknown> | null;
    return Boolean(value) && value!.scope === "project" && typeof value!.harnessId === "string" && typeof value!.connectionMethod === "string";
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------------ */
/* Fixed rules (t4)                                                         */
/* ------------------------------------------------------------------------ */

export type StoreRuleAction =
  | "delete-row"
  | "mark-failed-abandoned"
  | "strip-saved-bytes"
  | "null-full-ledgers";

export interface StoreRuleCandidateQuery {
  table: StoreTableName;
  /**
   * Read-only SELECT. Named parameters come from {@link storeMaintenanceSqlParameters}.
   * A non-NULL `skip_reason` column means the rule must skip that row and report the reason.
   */
  sql: string;
  /** Result columns that identify one row. */
  key: readonly string[];
}

/** A rule that is `inactive` reports its candidates as skipped and never changes a row. */
export type StoreRuleActivation =
  | { state: "active" }
  | { state: "inactive"; until: StoreFollowUpId; reason: string };

export interface StoreFixedRule {
  id: StoreFixedRuleId;
  title: string;
  /** The start of the PRD 38 R-MAINT-3 bullet that this rule states. */
  prdBullet: string;
  action: StoreRuleAction;
  activation: StoreRuleActivation;
  /** Every clause must hold before the rule acts on a row. */
  condition: readonly string[];
  /** The rows that pass the SQL part of the condition. Proofs run on each one. */
  candidates: readonly StoreRuleCandidateQuery[];
  proofs: readonly StoreMaintenanceProofId[];
  settings: readonly StoreMaintenanceSettingId[];
  /** What the rule does to a row that passes every clause. */
  effect: string;
  /** When the rule must skip a row and report why. */
  skipWhen: readonly string[];
  /** The compare-and-change check at write time. See {@link STORE_RULE_WRITE_CONTRACT}. */
  recheck: StoreRuleRecheck;
  humanMeaning: string;
}

export interface StoreRuleRecheck {
  /**
   * For each candidate query, in order: the result columns whose checked
   * values the write must match exactly. Each list includes every key column
   * of its query.
   */
  columnsByQuery: readonly (readonly string[])[];
  /** What the write's WHERE clause matches, in plain words. */
  match: string;
}

/**
 * The write contract for every fixed rule. W32 R0 P4 must implement it.
 * `check` and `clean` can run far apart, and another Make Docs command can
 * change a row in between, so no rule trusts a value it read earlier.
 */
export const STORE_RULE_WRITE_CONTRACT = Object.freeze({
  implementedIn: "W32 R0 P4",
  steps: [
    "Run every change of one clean inside one BEGIN IMMEDIATE write transaction, after the backup.",
    "Inside that transaction, run the rule's candidate query again for the row's key, and run its proofs again.",
    "Change or delete the row with a compare-and-change statement: its WHERE clause names the key and every recheck column with the exact value that the check proved.",
    "When the statement changes no row, or a value or proof differs, skip the row and report that it changed after the check. Never retry with the new values in the same clean.",
  ],
} as const);

const TERMINAL_SQL = `('completed','rolled-back')`;
const RECOVERABLE_SQL = `('pending','failed')`;

/** A JSON field that reads as NULL when the column is not valid JSON, so a bad row never fails the query. */
const jsonField = (column: string, jsonPath: string) =>
  `(CASE WHEN json_valid(${column}) THEN json_extract(${column}, '${jsonPath}') END)`;
const jsonTypeOf = (column: string, jsonPath: string) =>
  `(CASE WHEN json_valid(${column}) THEN json_type(${column}, '${jsonPath}') END)`;

const savedBytesPresent = (column: string) => `(${jsonTypeOf(column, "$.contentBase64")} IS NOT NULL)`;

/**
 * True when a detached plan or an atomic write intent of operation `o` still
 * exists. The detached plan reader (installation-state.ts detachedSnapshot)
 * compares the plan with the operation's steps and after-ledger, and the
 * atomic intent check (atomicTemporaryStates) needs `contentBase64` in a step,
 * even for a completed operation.
 */
const detachedEvidenceExists = (o: string) => `EXISTS (
                   SELECT 1 FROM installation_migration_records r
                    WHERE r.checkout_id = ${o}.checkout_id
                      AND (
                        (r.kind = 'snapshot' AND (r.record_id = 'detached:' || ${o}.operation_id OR r.record_id = 'detached-original:' || ${o}.operation_id))
                        OR (r.kind = 'backup' AND substr(r.record_id, 1, length('atomic:' || ${o}.operation_id || ':')) = 'atomic:' || ${o}.operation_id || ':')
                      ))`;
const DETACHED_EVIDENCE_REASON = "A detached plan or an atomic write intent of this operation still exists, and its readers compare it with the steps and ledgers.";

const fullLedger = (column: string) => `(${column} IS NOT NULL AND ${column} <> 'null')`;

/** The same UUID shape that {@link classifyMigrationRecord} uses, as a SQLite GLOB. */
const hexGlob = (count: number) => "[0-9a-f]".repeat(count);
const UUID_GLOB = `${hexGlob(8)}-${hexGlob(4)}-${hexGlob(4)}-${hexGlob(4)}-${hexGlob(12)}`;

/**
 * True when operation `o` is the latest completed operation of its checkout,
 * is a `setup.remove`, and the checkout has no current ledger. Setup reads the
 * full before-ledger of that row to offer setup after removal
 * (installation-state.ts reviewCompletedRemovalHandoff), with no time limit.
 */
const removalHandoff = (o: string) => `(${o}.operation = 'setup.remove' AND ${o}.status = 'completed'
          AND NOT EXISTS (SELECT 1 FROM installation_ledgers led WHERE led.checkout_id = ${o}.checkout_id)
          AND ${o}.operation_id = (
            SELECT h.operation_id FROM installation_operations h
             WHERE h.checkout_id = ${o}.checkout_id AND h.status = 'completed'
             ORDER BY h.finished_at DESC, h.operation_id DESC LIMIT 1))`;
const REMOVAL_HANDOFF_REASON = "This is the latest completed removal of a checkout with no ledger. Setup reads its full before-ledger to offer setup after removal.";

export const STORE_FIXED_RULES: readonly StoreFixedRule[] = Object.freeze<StoreFixedRule[]>([
  {
    id: "STORE-RULE-001",
    title: "Dead-owner lock with no pending operation",
    prdBullet: "a lock whose owner is proven dead and that guards no pending or failed operation",
    action: "delete-row",
    activation: { state: "active" },
    condition: [
      "The row is in installation_locks.",
      "No installation_operations row with status `pending` or `failed` belongs to a checkout at the lock's path. P4 compares `platform.comparisonKey(l.root_path)` with `c.root_path_key`, and also compares the raw root_path. The SQL below can only approximate that key with `lower()`, which matches more paths, never fewer. On any doubt about the comparison, the lock stays.",
      "The owner-process-dead proof passes for the lock's pid and hostname.",
    ],
    candidates: [{
      table: "installation_locks",
      sql: `SELECT l.root_path, l.token, l.pid, l.hostname, l.acquired_at
        FROM installation_locks l
        WHERE NOT EXISTS (
          SELECT 1 FROM installation_operations o
          JOIN installation_checkouts c ON c.checkout_id = o.checkout_id
          WHERE o.status IN ${RECOVERABLE_SQL}
            AND (c.root_path = l.root_path OR c.root_path_key = l.root_path OR c.root_path_key = lower(l.root_path))
        )
        ORDER BY l.root_path`,
      key: ["root_path"],
    }],
    proofs: ["owner-process-dead"],
    settings: [],
    effect: "Delete the lock row.",
    skipWhen: [
      "The owner's liveness is `unknown`, for example a lock from another host.",
      "platform.comparisonKey cannot describe the lock path, for example a path that no longer resolves. The lock stays.",
    ],
    recheck: { columnsByQuery: [["root_path", "token", "pid", "hostname"]], match: "The lock row with the same root_path, token, pid, and hostname, and still no pending or failed operation on a checkout whose root_path equals the lock path or whose root_path_key equals platform.comparisonKey of it." },
    humanMeaning: "A lock left by a Make Docs command that crashed, with no unfinished change behind it, is removed so that the next command can run.",
  },
  {
    id: "STORE-RULE-002",
    title: "Abandoned tool update or uninstall",
    prdBullet: "a pending `tool.update` or `tool.uninstall` whose owner is proven dead",
    action: "mark-failed-abandoned",
    activation: { state: "inactive", until: "FOLLOW-UP-P4-PACKAGE-MANAGER-IDLE", reason: "No helper can prove that the package manager is idle yet." },
    condition: [
      "The row is in tool_operations with status `pending` and operation `tool.update` or `tool.uninstall`.",
      "The owner-process-dead proof passes for the row's pid and hostname.",
      "The package-manager-idle proof passes for the row's `manager` and `command` metadata.",
    ],
    candidates: [{
      table: "tool_operations",
      sql: `SELECT operation_id, operation, status, pid, hostname, metadata_json
        FROM tool_operations
        WHERE status = 'pending' AND operation IN ('tool.update', 'tool.uninstall')
        ORDER BY started_at, operation_id`,
      key: ["operation_id"],
    }],
    proofs: ["owner-process-dead", "package-manager-idle"],
    settings: [],
    effect: "Set status to `failed`, set finished_at to the clean time, and merge `{\"outcome\":\"abandoned\",\"reason\":\"abandoned\",\"changeOutcome\":\"unknown\"}` into metadata_json. The row stays as history.",
    skipWhen: [
      "The rule is inactive.",
      "The owner's liveness is `unknown`.",
      "The package-manager-idle proof is `unknown` or `refuted`.",
    ],
    recheck: { columnsByQuery: [["operation_id", "operation", "status", "pid", "hostname", "metadata_json"]], match: "The tool operation with the same operation_id and operation, status still `pending`, the same pid and hostname, and the same metadata_json that the package-manager-idle proof checked." },
    humanMeaning: "A Make Docs update or uninstall that crashed stops blocking the machine. Make Docs records it as failed and does not guess whether the package manager changed anything.",
  },
  {
    id: "STORE-RULE-003",
    title: "Saved file contents of a terminal operation",
    prdBullet: "saved `contentBase64` bytes in `installation_steps` of a terminal operation after the retention window",
    action: "strip-saved-bytes",
    activation: { state: "active" },
    condition: [
      "The step's operation has status `completed` or `rolled-back`. A `failed` operation is never terminal here.",
      "The operation's finished_at is set and is earlier than the clean time minus terminalOperationRetentionDays.",
      "The step's before_json or after_json is valid JSON with a `contentBase64` key. A `payload` key is a backup file path, not bytes, and stays.",
      "No `detached:` or `detached-original:` plan and no `atomic:` write intent of the operation remains.",
      "The operation is not the removal handoff row: the latest completed `setup.remove` of a checkout with no current ledger.",
    ],
    candidates: [{
      table: "installation_steps",
      sql: `SELECT s.operation_id, s.ordinal, s.before_json, s.after_json, o.status AS operation_status, o.finished_at AS operation_finished_at,
               CASE
                 WHEN ${removalHandoff("o")} THEN '${REMOVAL_HANDOFF_REASON}'
                 WHEN ${detachedEvidenceExists("o")} THEN '${DETACHED_EVIDENCE_REASON}'
               END AS skip_reason
        FROM installation_steps s
        JOIN installation_operations o ON o.operation_id = s.operation_id
        WHERE o.status IN ${TERMINAL_SQL}
          AND o.finished_at IS NOT NULL AND o.finished_at < :terminalCutoff
          AND (${savedBytesPresent("s.before_json")} OR ${savedBytesPresent("s.after_json")})
        ORDER BY s.operation_id, s.ordinal`,
      key: ["operation_id", "ordinal"],
    }],
    proofs: [],
    settings: ["terminalOperationRetentionDays"],
    effect: "Remove the `contentBase64` key from before_json and after_json. Keep `payload` (the backup file path), kind, digest, mode, target, relative_path, and applied. This frees little space unless a step holds `contentBase64`; the backup files that `payload` names stay until FOLLOW-UP-LATER-OPERATION-BACKUP-FILES.",
    skipWhen: [
      "The operation is the removal handoff row.",
      "A detached plan or an atomic write intent of the operation still exists.",
      "before_json or after_json is not valid JSON. The step is kept and reported as unreadable.",
    ],
    recheck: { columnsByQuery: [["operation_id", "ordinal", "before_json", "after_json", "operation_status", "operation_finished_at"]], match: "The step with the same operation_id and ordinal and the same before_json and after_json, whose operation still has the checked terminal status and finished_at, and still no detached plan or atomic intent." },
    humanMeaning: "Old copies of file contents kept inside the Store, from a change that finished more than the retention window ago, are removed. The record of which files changed, and the link to each backup file, stays.",
  },
  {
    id: "STORE-RULE-004",
    title: "Full ledgers of a terminal operation",
    prdBullet: "the full before and after ledgers in `installation_operations` of a terminal operation after the retention window",
    action: "null-full-ledgers",
    activation: { state: "inactive", until: "FOLLOW-UP-P4-RULE-ACTIVATION", reason: "Its reader is ready: schema v7 fills the receipt columns at each terminal commit and backfilled old terminal rows (FOLLOW-UP-P2-OPERATION-RECEIPT-COLUMNS, done in W32 R0 P2). The rule stays off until P4 implements its write contract and turns it on." },
    condition: [
      "The operation has status `completed` or `rolled-back`. A `failed` operation is never terminal here.",
      "Its finished_at is set and is earlier than the clean time minus terminalOperationRetentionDays.",
      "Its before_ledger or after_ledger holds a full ledger: not NULL and not `null`.",
      "Its bounded receipt columns (STORE_PLANNED_OPERATION_RECEIPT_COLUMNS, schema v7) are filled, and each ledger digest (`sha256:` plus the hex SHA-256 of the exact ledger text) matches the ledger text that it replaces.",
      "No `detached:` or `detached-original:` plan and no `atomic:` write intent of the operation remains, because the detached plan reader compares its after-ledger with the operation's after_ledger.",
      "The operation is not the removal handoff row: the latest completed `setup.remove` of a checkout with no current ledger.",
    ],
    candidates: [{
      table: "installation_operations",
      sql: `SELECT o.operation_id, o.status, o.finished_at, o.before_ledger, o.after_ledger,
               CASE
                 WHEN ${removalHandoff("o")} THEN '${REMOVAL_HANDOFF_REASON}'
                 WHEN ${detachedEvidenceExists("o")} THEN '${DETACHED_EVIDENCE_REASON}'
               END AS skip_reason
        FROM installation_operations o
        WHERE o.status IN ${TERMINAL_SQL}
          AND o.finished_at IS NOT NULL AND o.finished_at < :terminalCutoff
          AND (${fullLedger("o.before_ledger")} OR ${fullLedger("o.after_ledger")})
        ORDER BY o.operation_id`,
      key: ["operation_id"],
    }],
    proofs: [],
    settings: ["terminalOperationRetentionDays"],
    effect: "After the receipt columns are filled and read back, set each full ledger (before_ledger, after_ledger) to NULL in the same transaction. A ledger that is NULL or `null` stays as it is. Every other column stays.",
    skipWhen: [
      "The rule is inactive.",
      "The receipt columns are empty or do not match the ledger text.",
      "A detached plan or an atomic write intent of the operation still exists.",
      "The operation is the removal handoff row.",
    ],
    recheck: { columnsByQuery: [["operation_id", "status", "finished_at", "before_ledger", "after_ledger"]], match: "The operation with the same operation_id, status, and finished_at, and ledgers whose SHA-256 still equals the digest checked and stored in the receipt columns." },
    humanMeaning: "An old finished change keeps a short summary with fingerprints of its ledgers instead of the full lists.",
  },
  {
    id: "STORE-RULE-005",
    title: "Detached plan snapshots and atomic write intents of a terminal operation",
    prdBullet: "detached plan snapshots and atomic write intents in `installation_migration_records` of a terminal operation after the retention window",
    action: "delete-row",
    activation: { state: "inactive", until: "FOLLOW-UP-P4-RULE-ACTIVATION", reason: "Its readers are ready: a missing plan of a completed or rolled-back operation reads as pruned (FOLLOW-UP-P2-PRUNED-DETACHED-PLAN, done in W32 R0 P2). The rule stays off until P4 implements its write contract and turns it on." },
    condition: [
      "The row is a `detached-plan`, `detached-original-plan`, or `atomic-write-intent` record.",
      "The operation ID in its record ID names an installation_operations row on the same checkout.",
      "That operation has status `completed` or `rolled-back`. A `failed` operation is never terminal here.",
      "The operation's finished_at is set and is earlier than the clean time minus terminalOperationRetentionDays.",
      "The operation is not the removal handoff row.",
    ],
    candidates: [{
      table: "installation_migration_records",
      sql: `SELECT r.checkout_id, r.kind, r.record_id, o.operation_id, o.status AS operation_status, o.finished_at AS operation_finished_at,
               CASE WHEN ${removalHandoff("o")} THEN '${REMOVAL_HANDOFF_REASON}' END AS skip_reason
        FROM installation_migration_records r
        JOIN installation_operations o ON o.checkout_id = r.checkout_id
        WHERE o.status IN ${TERMINAL_SQL}
          AND o.finished_at IS NOT NULL AND o.finished_at < :terminalCutoff
          AND (
            (r.kind = 'snapshot' AND (r.record_id = 'detached:' || o.operation_id OR r.record_id = 'detached-original:' || o.operation_id))
            OR (r.kind = 'backup' AND substr(r.record_id, 1, length('atomic:' || o.operation_id || ':')) = 'atomic:' || o.operation_id || ':')
          )
        ORDER BY r.checkout_id, r.kind, r.record_id`,
      key: ["checkout_id", "kind", "record_id"],
    }],
    proofs: [],
    settings: ["terminalOperationRetentionDays"],
    effect: "Delete the record row. In one clean, this rule runs before STORE-RULE-004.",
    skipWhen: [
      "The rule is inactive.",
      "The named operation is pending or failed, or no operation row exists. A plan with no operation is kept and reported.",
      "The operation is the removal handoff row.",
    ],
    recheck: { columnsByQuery: [["checkout_id", "kind", "record_id", "operation_id", "operation_status", "operation_finished_at"]], match: "The record with the same checkout_id, kind, and record_id, whose operation still has the checked terminal status and finished_at." },
    humanMeaning: "Saved plans and write notes for a change that finished more than the retention window ago are removed. This frees most of the space on a Store with a large Skill adoption.",
  },
  {
    id: "STORE-RULE-006",
    title: "Quiescence barrier whose lock is gone",
    prdBullet: "a quiescence row in `installation_migration_records` that a crash left before it was bound to a snapshot",
    action: "delete-row",
    activation: { state: "inactive", until: "FOLLOW-UP-LATER-QUIESCENCE-CRASH-BARRIER", reason: "Every normal `make-docs setup` leaves a bound `legacy` barrier after it releases its lock (cli.ts executeStoreCheckpoint9Migration). That barrier is the post-migration freeze that migration.ts assertLegacyOperationNotQuiesced enforces, so a lock that is gone does not prove the barrier is stale." },
    condition: [
      "The row is in installation_migration_records with kind `quiescence`.",
      "Its checkout has no installation_operations row with status `pending` or `failed`. A crash while recovery takes its lock again can leave a pending operation with no lock.",
      "Its checkout has no `legacy-import` record. An imported barrier names a legacy lock token that never appears in installation_locks, so it stays as import evidence.",
      "Its record_json has no snapshotId (JSON null or absent): the barrier was left by a crash before it was bound to a migration snapshot. A bound barrier is the post-migration freeze and always stays.",
      "The lock-token-absent proof passes for its record_json.",
      "The owner approves the later phase that turns this rule on.",
    ],
    candidates: [{
      table: "installation_migration_records",
      sql: `SELECT q.checkout_id, q.kind, q.record_id, q.record_json,
               CASE
                 WHEN EXISTS (SELECT 1 FROM installation_operations o WHERE o.checkout_id = q.checkout_id AND o.status IN ${RECOVERABLE_SQL})
                   THEN 'This checkout has an unfinished operation, so the barrier may still be recovery evidence.'
                 WHEN EXISTS (SELECT 1 FROM installation_migration_records i WHERE i.checkout_id = q.checkout_id AND i.kind = 'legacy-import')
                   THEN 'This checkout has a legacy import, so the barrier may be imported evidence.'
               END AS skip_reason
        FROM installation_migration_records q
        WHERE q.kind = 'quiescence'
          AND ${jsonField("q.record_json", "$.snapshotId")} IS NULL
        ORDER BY q.checkout_id, q.record_id`,
      key: ["checkout_id", "kind", "record_id"],
    }],
    proofs: ["lock-token-absent"],
    settings: [],
    effect: "Delete the record row.",
    skipWhen: [
      "The rule is inactive.",
      "Its checkout has a pending or failed operation.",
      "Its checkout has a legacy-import record.",
      "The record JSON is unreadable or has no lockTokenDigest.",
    ],
    recheck: { columnsByQuery: [["checkout_id", "kind", "record_id", "record_json"]], match: "The quiescence record with the same key and the exact record_json whose lockTokenDigest the proof checked, and still no lock with that token, no pending or failed operation, and no legacy import on its checkout." },
    humanMeaning: "A migration barrier that a crash left before the migration was bound to a snapshot can be removed once a later phase turns this rule on. The normal barrier that every setup leaves stays.",
  },
  {
    id: "STORE-RULE-007",
    title: "Checkpoint journal row with a migration receipt",
    prdBullet: "a `store_checkpoint_journal` row with a matching `store_migration_receipts` row",
    action: "delete-row",
    activation: { state: "active" },
    condition: [
      "The row is in store_checkpoint_journal.",
      "A store_migration_receipts row has the same receipt_id.",
    ],
    candidates: [{
      table: "store_checkpoint_journal",
      sql: `SELECT j.receipt_id
        FROM store_checkpoint_journal j
        JOIN store_migration_receipts r ON r.receipt_id = j.receipt_id
        ORDER BY j.receipt_id`,
      key: ["receipt_id"],
    }],
    proofs: [],
    settings: [],
    effect: "Delete the journal row.",
    skipWhen: [],
    recheck: { columnsByQuery: [["receipt_id"]], match: "The journal row with the same receipt_id, while a store_migration_receipts row with that receipt_id still exists." },
    humanMeaning: "An old copy of a migration receipt is removed once the newer receipt table holds the same receipt.",
  },
  {
    id: "STORE-RULE-008",
    title: "Backlog review cache rows for old versions",
    prdBullet: "`backlog_review_cache` rows for old snapshot, rule catalog, or Skill versions",
    action: "delete-row",
    activation: { state: "active" },
    condition: [
      "The row is in backlog_review_cache.",
      "Its snapshot_schema_version, rule_catalog_version, or skill_version is lower than the current version in this CLI. A higher version is kept, because a newer CLI may use it.",
    ],
    candidates: [{
      table: "backlog_review_cache",
      sql: `SELECT checkout_id, record_path, record_digest, snapshot_schema_version, rule_catalog_version, skill_version
        FROM backlog_review_cache
        WHERE snapshot_schema_version < :snapshotSchemaVersion
           OR rule_catalog_version < :ruleCatalogVersion
           OR skill_version < :skillVersion
        ORDER BY checkout_id, record_path`,
      key: ["checkout_id", "record_path", "record_digest", "snapshot_schema_version", "rule_catalog_version", "skill_version"],
    }],
    proofs: [],
    settings: [],
    effect: "Delete the cache row.",
    skipWhen: [],
    recheck: { columnsByQuery: [["checkout_id", "record_path", "record_digest", "snapshot_schema_version", "rule_catalog_version", "skill_version"]], match: "The cache row with the same full primary key, which holds the checked versions." },
    humanMeaning: "Backlog review results saved by an older Make Docs version are removed. The next review rebuilds them.",
  },
  {
    id: "STORE-RULE-009",
    title: "Harness receipt history beyond the kept count",
    prdBullet: "harness receipt history beyond the kept count",
    action: "delete-row",
    activation: { state: "active" },
    condition: [
      "The row is a harness receipt or observation history row: in tool_operations with status `completed` and operation `setup.system.receipt` or `setup.system.receipt-observation`, or in installation_migration_records as a `harness-receipt` (UUID record ID) or `harness-receipt-observation` record with project scope.",
      "Its JSON is valid and has a text `harnessId` and a text `connectionMethod`. A row without them is never grouped or removed. Rows are grouped by harnessId and connectionMethod, and by checkout for project receipts.",
      "More than harnessReceiptHistoryKeptCount newer rows exist in its group, ordered by verifiedAt, then by row ID.",
      "Its receipt operationId is not the operationId of a current receipt pointer.",
      "Its receipt operationId is not the `ownershipReceipt.operationId` of a pending `setup.system.harness` row. Machine setup reads that receipt to resume a drift repair.",
    ],
    candidates: [
      {
        table: "tool_operations",
        sql: `WITH history AS (
            SELECT operation_id AS row_id, metadata_json,
                   ${jsonField("metadata_json", "$.harnessId")} AS harness_id,
                   ${jsonField("metadata_json", "$.connectionMethod")} AS method,
                   ${jsonField("metadata_json", "$.operationId")} AS receipt_operation_id,
                   coalesce(${jsonField("metadata_json", "$.verifiedAt")}, finished_at) AS ordered_at
              FROM tool_operations
             WHERE status = 'completed'
               AND operation IN ('setup.system.receipt', 'setup.system.receipt-observation')
               AND ${jsonTypeOf("metadata_json", "$.harnessId")} = 'text'
               AND ${jsonTypeOf("metadata_json", "$.connectionMethod")} = 'text'
          ), ranked AS (
            SELECT history.*, ROW_NUMBER() OVER (PARTITION BY harness_id, method ORDER BY ordered_at DESC, row_id DESC) AS position
              FROM history
          )
          SELECT row_id AS operation_id, receipt_operation_id, metadata_json,
                 CASE WHEN EXISTS (
                   SELECT 1 FROM tool_operations p
                    WHERE p.status = 'pending' AND p.operation = 'setup.system.harness' AND NOT json_valid(p.metadata_json)
                 ) THEN 'A pending machine setup has unreadable metadata, so the receipt it needs cannot be known.' END AS skip_reason
            FROM ranked
           WHERE position > :harnessReceiptKeptCount
             AND receipt_operation_id IS NOT NULL
             AND receipt_operation_id NOT IN (
               SELECT ${jsonField("metadata_json", "$.operationId")}
                 FROM tool_operations
                WHERE status = 'completed' AND operation = 'setup.system.receipt-current'
                  AND ${jsonField("metadata_json", "$.operationId")} IS NOT NULL
             )
             AND receipt_operation_id NOT IN (
               SELECT ${jsonField("metadata_json", "$.ownershipReceipt.operationId")}
                 FROM tool_operations
                WHERE status = 'pending' AND operation = 'setup.system.harness'
                  AND ${jsonField("metadata_json", "$.ownershipReceipt.operationId")} IS NOT NULL
             )
           ORDER BY row_id`,
        key: ["operation_id"],
      },
      {
        table: "installation_migration_records",
        sql: `WITH history AS (
            SELECT checkout_id, kind, record_id, record_json,
                   ${jsonField("record_json", "$.harnessId")} AS harness_id,
                   ${jsonField("record_json", "$.connectionMethod")} AS method,
                   ${jsonField("record_json", "$.operationId")} AS receipt_operation_id,
                   ${jsonField("record_json", "$.verifiedAt")} AS ordered_at
              FROM installation_migration_records
             WHERE kind = 'receipt'
               AND (record_id GLOB '${UUID_GLOB}' OR substr(record_id, 1, 28) = 'harness-receipt-observation:')
               AND ${jsonField("record_json", "$.scope")} = 'project'
               AND ${jsonTypeOf("record_json", "$.harnessId")} = 'text'
               AND ${jsonTypeOf("record_json", "$.connectionMethod")} = 'text'
          ), ranked AS (
            SELECT history.*, ROW_NUMBER() OVER (PARTITION BY checkout_id, harness_id, method ORDER BY ordered_at DESC, record_id DESC) AS position
              FROM history
          )
          SELECT checkout_id, kind, record_id, receipt_operation_id, record_json
            FROM ranked
           WHERE position > :harnessReceiptKeptCount
             AND receipt_operation_id IS NOT NULL
             AND receipt_operation_id NOT IN (
               SELECT ${jsonField("c.record_json", "$.operationId")}
                 FROM installation_migration_records c
                WHERE c.kind = 'receipt' AND c.checkout_id = ranked.checkout_id
                  AND substr(c.record_id, 1, 24) = 'harness-receipt-current:'
                  AND ${jsonField("c.record_json", "$.operationId")} IS NOT NULL
             )
           ORDER BY checkout_id, record_id`,
        key: ["checkout_id", "kind", "record_id"],
      },
    ],
    proofs: [],
    settings: ["harnessReceiptHistoryKeptCount"],
    effect: "Delete the history row. The current receipt pointer, the receipt that a pending machine setup names, and the newest history rows stay.",
    skipWhen: [
      "The JSON is unreadable or has no operationId. The row is kept and reported.",
      "A pending machine setup has unreadable metadata.",
    ],
    recheck: {
      columnsByQuery: [
        ["operation_id", "receipt_operation_id", "metadata_json"],
        ["checkout_id", "kind", "record_id", "receipt_operation_id", "record_json"],
      ],
      match: "The history row with the same key (operation_id for machine rows; checkout_id, kind, and record_id for project rows), the same receipt operationId, and the exact metadata_json or record_json that the check read, still past the kept count and still not named by a current pointer or a pending machine setup.",
    },
    humanMeaning: "Old harness setup receipts beyond the kept count are removed. The current receipt, any receipt an unfinished setup needs, and the newest ones stay.",
  },
]);

/* ------------------------------------------------------------------------ */
/* Decision items (t5)                                                      */
/* ------------------------------------------------------------------------ */

export interface StoreDecisionItem {
  id: StoreDecisionItemId;
  title: string;
  /** The start of the PRD 38 R-MAINT-4 phrase that this item states. */
  prdPhrase: string;
  condition: readonly string[];
  candidates: readonly StoreRuleCandidateQuery[];
  proofs: readonly StoreMaintenanceProofId[];
  settings: readonly StoreMaintenanceSettingId[];
  /** The plain reason that `setup store check` shows. `{...}` marks a value from the row. */
  reasonText: string;
  nextAction: string;
}

export const STORE_DECISION_ITEMS: readonly StoreDecisionItem[] = Object.freeze<StoreDecisionItem[]>([
  {
    id: "STORE-DECISION-001",
    title: "Checkout folder is missing",
    prdPhrase: "a checkout whose folder is missing",
    condition: [
      "The row is in installation_checkouts.",
      "The checkout-folder-missing proof passes for its root_path.",
    ],
    candidates: [{
      table: "installation_checkouts",
      sql: `SELECT c.checkout_id, c.project_id, c.root_path,
               (SELECT count(*) FROM installation_operations o WHERE o.checkout_id = c.checkout_id AND o.status IN ${RECOVERABLE_SQL}) AS pending_operations,
               (SELECT count(*) FROM backlog_review_cache b WHERE b.checkout_id = c.checkout_id) AS cache_rows
          FROM installation_checkouts c
         ORDER BY c.root_path`,
      key: ["checkout_id"],
    }],
    proofs: ["checkout-folder-missing"],
    settings: [],
    reasonText: "The folder {root_path} for project {project_id} no longer exists. Make Docs keeps its Store rows, including {pending_operations} unfinished changes and {cache_rows} cached review results, because the folder may have moved or may be on a drive that is not connected.",
    nextAction: "If the project moved, run `make-docs setup` in the new folder to move the checkout. If the folder is gone for good, a later reviewed removal can clear its rows.",
  },
  {
    id: "STORE-DECISION-002",
    title: "Lifecycle run left open",
    prdPhrase: "a lifecycle run left open past the review age",
    condition: [
      "The row is in runs with status `active` or `paused`.",
      "Its updated_at is earlier than the check time minus lifecycleRunReviewAgeDays.",
    ],
    candidates: [{
      table: "runs",
      sql: `SELECT project_id, run_id, status, lifecycle_stage, updated_at
          FROM runs
         WHERE status IN ('active', 'paused') AND updated_at < :runReviewCutoff
         ORDER BY updated_at, project_id, run_id`,
      key: ["project_id", "run_id"],
    }],
    proofs: [],
    settings: ["lifecycleRunReviewAgeDays"],
    reasonText: "Lifecycle run {run_id} in project {project_id} has been {status} at stage {lifecycle_stage} since {updated_at}. Make Docs never closes a run for you.",
    nextAction: "Resume, complete, or abandon the run with `make-docs run lifecycle`.",
  },
  {
    id: "STORE-DECISION-003",
    title: "Legacy recovery is pending",
    prdPhrase: "a pending `legacy.recovery` operation",
    condition: [
      "The row is in installation_operations with status `pending` and operation `legacy.recovery`.",
    ],
    candidates: [{
      table: "installation_operations",
      sql: `SELECT o.operation_id, o.checkout_id, c.root_path, o.created_at
          FROM installation_operations o
          JOIN installation_checkouts c ON c.checkout_id = o.checkout_id
         WHERE o.status = 'pending' AND o.operation = 'legacy.recovery'
         ORDER BY o.created_at, o.operation_id`,
      key: ["operation_id"],
    }],
    proofs: [],
    settings: [],
    reasonText: "An old install in {root_path} was imported on {created_at}, and its recovery never finished. While it is pending, tool update, tool uninstall, and Store removal stay blocked. No Make Docs command can finish or clear it yet: generic recovery refuses to replay it, because it needs its verified migration snapshot.",
    nextAction: "Keep the operation row, its legacy-import record, and the checkout's snapshot, backup, receipt, and quiescence records. Do not edit the Store. Ask the Make Docs maintainers for a reviewed recovery.",
  },
]);

/* ------------------------------------------------------------------------ */
/* Crash leftovers that block the machine today                             */
/* ------------------------------------------------------------------------ */

export interface StoreBlockingLeftover {
  id: `STORE-LEFTOVER-${string}`;
  title: string;
  /** What it blocks today, with the code that blocks. */
  blocks: string;
  /** The rule, decision item, or existing command that clears or reports it. */
  route: StoreFixedRuleId | StoreDecisionItemId | `existing:${string}`;
}

export const STORE_BLOCKING_LEFTOVERS: readonly StoreBlockingLeftover[] = Object.freeze<StoreBlockingLeftover[]>([
  {
    id: "STORE-LEFTOVER-001",
    title: "A dead-owner installation lock with no pending operation",
    blocks: "Tool update, tool uninstall, and Store removal (tool-operations.ts checks any installation_locks row), and the next writer on that checkout (acquireInstallationLock reports recovery-required).",
    route: "STORE-RULE-001",
  },
  {
    id: "STORE-LEFTOVER-002",
    title: "A pending tool.update or tool.uninstall with a dead owner",
    blocks: "Every later tool operation, every installation lock on the machine (acquireInstallationLock checks pending tool_operations), and Store removal. STORE-RULE-002 is inactive until the package-manager-idle helper exists, so check reports this row and clean skips it.",
    route: "STORE-RULE-002",
  },
  {
    id: "STORE-LEFTOVER-003",
    title: "A pending legacy.recovery operation",
    blocks: "Tool update, tool uninstall, and Store removal (tool-operations.ts checks any pending installation operation). No command clears it yet.",
    route: "STORE-DECISION-003",
  },
  {
    id: "STORE-LEFTOVER-004",
    title: "A pending installation operation on a checkout whose folder is gone",
    blocks: "Tool update, tool uninstall, and Store removal. No resume is possible, because the folder is gone.",
    route: "STORE-DECISION-001",
  },
  {
    id: "STORE-LEFTOVER-005",
    title: "A dead-owner installation lock that guards a pending operation",
    blocks: "The same as STORE-LEFTOVER-001. The pending operation still holds recovery evidence, so no fixed rule removes the lock.",
    route: "existing:make-docs project state recover",
  },
  {
    id: "STORE-LEFTOVER-006",
    title: "A pending setup.system.harness operation",
    blocks: "Every later tool operation and every installation lock on the machine, because both check any pending tool_operations row.",
    route: "existing:make-docs setup system",
  },
  {
    id: "STORE-LEFTOVER-007",
    title: "A pending detached operation with no lock on a folder that still exists, such as an unverified manual layout",
    blocks: "Tool update, tool uninstall, and Store removal (tool-operations.ts checks any pending installation operation). No lock or dead process is involved, so no fixed rule applies.",
    route: "existing:make-docs project layout verify",
  },
]);

/* ------------------------------------------------------------------------ */
/* Follow-ups that later phases own                                         */
/* ------------------------------------------------------------------------ */

export const STORE_FOLLOW_UP_IDS = [
  "FOLLOW-UP-P2-FAILED-RECOVERY-CLOSED",
  "FOLLOW-UP-P2-OPERATION-RECEIPT-COLUMNS",
  "FOLLOW-UP-P2-PRUNED-DETACHED-PLAN",
  "FOLLOW-UP-P3-DELETE-PROJECT-ROWS",
  "FOLLOW-UP-P4-PACKAGE-MANAGER-IDLE",
  "FOLLOW-UP-P4-RULE-ACTIVATION",
  "FOLLOW-UP-LATER-OPERATION-BACKUP-FILES",
  "FOLLOW-UP-LATER-QUIESCENCE-CRASH-BARRIER",
] as const;
export type StoreFollowUpId = (typeof STORE_FOLLOW_UP_IDS)[number];

export interface StoreFollowUp {
  id: StoreFollowUpId;
  phase: "W32 R0 P2" | "W32 R0 P3" | "W32 R0 P4" | "later phase";
  need: string;
  /** The rules that stay inactive or narrow until this is done. */
  unblocks: readonly StoreFixedRuleId[];
  /** `done` once the phase that owns it has landed it. */
  state: "open" | "done";
  /** What landed, for a done follow-up. */
  resolution?: string;
}

export const STORE_FOLLOW_UPS: readonly StoreFollowUp[] = Object.freeze<StoreFollowUp[]>([
  {
    id: "FOLLOW-UP-P2-FAILED-RECOVERY-CLOSED",
    phase: "W32 R0 P2",
    need: "Define when a `failed` installation operation's recovery is closed. Until then, no rule touches a failed operation's rows, and a failed operation guards its lock and quiescence barrier like a pending one.",
    unblocks: [],
    state: "done",
    resolution: "STORE_FAILED_RECOVERY_CLOSED: recovery is closed only when `project state recover` commits the operation as `completed` or `rolled-back`. While it is `failed`, no rule touches its rows.",
  },
  {
    id: "FOLLOW-UP-P2-OPERATION-RECEIPT-COLUMNS",
    phase: "W32 R0 P2",
    need: "Recommendation for the owner: add bounded receipt columns to installation_operations in schema v7 (STORE_PLANNED_OPERATION_RECEIPT_COLUMNS), filled when an operation reaches a terminal state and backfilled once by the v7 migration. Readers of a terminal operation's ledgers must accept NULL ledgers when the receipt columns are filled.",
    unblocks: ["STORE-RULE-004"],
    state: "done",
    resolution: "Schema v7 adds the four columns. commitOperation fills them in its transaction, and the migration backfilled every completed and rolled-back row. The only readers of a terminal operation's full ledgers are the removal handoff (rule 004 skips that row) and the detached plan check (rule 004 skips an operation with a plan), so no reader needs a NULL ledger today.",
  },
  {
    id: "FOLLOW-UP-P2-PRUNED-DETACHED-PLAN",
    phase: "W32 R0 P2",
    need: "Make a missing detached plan on a completed or rolled-back operation read as `pruned`, not as damage, in installation-state.ts detachedSnapshot and its callers (readDetachedInstallationOperation, the recovery read, and layout-state.ts applyProjectLayout).",
    unblocks: ["STORE-RULE-005"],
    state: "done",
    resolution: "detachedSnapshot returns no plan for a completed or rolled-back operation without one. readDetachedInstallationOperation reports `planPruned` when asked, `project layout apply <op>` reports `already-complete`, and `project state recover <op> --dry-run` reports the operation's terminal status.",
  },
  {
    id: "FOLLOW-UP-P3-DELETE-PROJECT-ROWS",
    phase: "W32 R0 P3",
    need: "state-rows.ts deleteProjectRows deletes playbook_runs and counts projects from the legacy table, against PRD 38 R-LIFE-2 and R-REGISTER-4. Rewrite it on project_register when pruneProjectFromStore is rewritten.",
    unblocks: [],
    state: "open",
  },
  {
    id: "FOLLOW-UP-P4-PACKAGE-MANAGER-IDLE",
    phase: "W32 R0 P4",
    need: "Build the package-manager-idle proof from the recorded `manager` and `command`, with `unknown` on any doubt.",
    unblocks: ["STORE-RULE-002"],
    state: "open",
  },
  {
    id: "FOLLOW-UP-P4-RULE-ACTIVATION",
    phase: "W32 R0 P4",
    need: "Implement the write contract for STORE-RULE-004 and STORE-RULE-005 and turn them on. Their readers landed in W32 R0 P2.",
    unblocks: ["STORE-RULE-004", "STORE-RULE-005"],
    state: "open",
  },
  {
    id: "FOLLOW-UP-LATER-OPERATION-BACKUP-FILES",
    phase: "later phase",
    need: "Design a reviewed rule that removes the backup files under `.make-docs/backup/operations/<operation>/` of an old completed or rolled-back operation together with the `payload` links in its steps, in one change. STORE-RULE-003 keeps both, so each backup file keeps its owner.",
    unblocks: [],
    state: "open",
  },
  {
    id: "FOLLOW-UP-LATER-QUIESCENCE-CRASH-BARRIER",
    phase: "later phase",
    need: "With owner approval, turn STORE-RULE-006 on for one case only: a `legacy` barrier left by a crash before it was bound to a snapshot (`snapshotId` null), whose lock is gone, on a checkout with no pending or failed operation and no legacy import. A bound barrier is the post-migration freeze and is never removed by this rule.",
    unblocks: ["STORE-RULE-006"],
    state: "open",
  },
]);

/* ------------------------------------------------------------------------ */
/* Parameters and digest                                                    */
/* ------------------------------------------------------------------------ */

export interface StoreMaintenanceVersions {
  snapshotSchemaVersion: number;
  ruleCatalogVersion: number;
  skillVersion: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Named SQL parameters for every candidate query, from the clean or check time. */
export function storeMaintenanceSqlParameters(
  now: Date,
  versions: StoreMaintenanceVersions,
  settings: { [K in StoreMaintenanceSettingId]: { value: number } } = STORE_MAINTENANCE_SETTINGS,
): Record<string, string | number> {
  return {
    terminalCutoff: new Date(now.getTime() - settings.terminalOperationRetentionDays.value * DAY_MS).toISOString(),
    runReviewCutoff: new Date(now.getTime() - settings.lifecycleRunReviewAgeDays.value * DAY_MS).toISOString(),
    harnessReceiptKeptCount: settings.harnessReceiptHistoryKeptCount.value,
    snapshotSchemaVersion: versions.snapshotSchemaVersion,
    ruleCatalogVersion: versions.ruleCatalogVersion,
    skillVersion: versions.skillVersion,
  };
}

/** Bind only the parameters that a query names. node:sqlite refuses unknown names. */
export function storeMaintenanceParametersFor(sql: string, parameters: Record<string, string | number>): Record<string, string | number> {
  const names = new Set([...sql.matchAll(/:([A-Za-z]+)/g)].map((match) => match[1]!));
  return Object.fromEntries(Object.entries(parameters).filter(([name]) => names.has(name)));
}

export function storeTableCatalogDigest(): string {
  const body = JSON.stringify(
    {
      id: STORE_TABLE_CATALOG_ID,
      version: STORE_TABLE_CATALOG_VERSION,
      physicalSchema: STORE_TABLE_CATALOG_PHYSICAL_SCHEMA_VERSION,
      tables: STORE_TABLE_CATALOG,
      nonTableRows: STORE_NON_TABLE_RMIN_ROWS,
      kinds: STORE_MIGRATION_RECORD_KIND_CATALOG,
      proofs: STORE_MAINTENANCE_PROOFS,
      rules: STORE_FIXED_RULES,
      decisions: STORE_DECISION_ITEMS,
      leftovers: STORE_BLOCKING_LEFTOVERS,
      writeContract: STORE_RULE_WRITE_CONTRACT,
      followUps: STORE_FOLLOW_UPS,
      plannedReceiptColumns: STORE_PLANNED_OPERATION_RECEIPT_COLUMNS,
      failureColumns: STORE_OPERATION_FAILURE_COLUMNS,
      failedRecoveryClosed: STORE_FAILED_RECOVERY_CLOSED,
      settings: STORE_MAINTENANCE_SETTINGS,
    },
    (_key, value) => (value instanceof RegExp ? value.source : value),
  );
  return `sha256:${createHash("sha256").update(body).digest("hex")}`;
}

/* ------------------------------------------------------------------------ */
/* Drift check (t3)                                                         */
/* ------------------------------------------------------------------------ */

export interface StorePhysicalSchema {
  /** Each physical table and its columns, in schema order. */
  tables: Readonly<Record<string, readonly string[]>>;
  /** The kinds that the installation_migration_records CHECK allows. */
  migrationRecordKinds: readonly string[];
}

export interface StoreRMinRow {
  /** The first cell: the durable record or field group. */
  label: string;
  /** The second cell: the record class. */
  classCell: string;
}

interface StoreCatalogDriftInput {
  tables: readonly Pick<StoreTableCatalogEntry, "table" | "schemaStatus" | "columns" | "rMinRows">[];
  nonTableRows: readonly StoreRMinRowClaim[];
  kinds: readonly string[];
}

/** Read table names, columns, and record kinds. Reads only `sqlite_master` and `PRAGMA table_info`. */
export function readPhysicalStoreSchema(db: {
  prepare(sql: string): { all(...args: unknown[]): unknown[] };
}): StorePhysicalSchema {
  const rows = db.prepare(
    "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  ).all() as Array<{ name: string; sql: string }>;
  const tables: Record<string, string[]> = {};
  let migrationRecordKinds: string[] = [];
  for (const row of rows) {
    const columns = db.prepare(`PRAGMA table_info(${JSON.stringify(row.name)})`).all() as Array<{ name: string }>;
    tables[row.name] = columns.map((column) => column.name);
    if (row.name === "installation_migration_records") {
      const match = /kind\s+IN\s*\(([^)]*)\)/i.exec(row.sql);
      migrationRecordKinds = match ? [...match[1]!.matchAll(/'([^']*)'/g)].map((kind) => kind[1]!) : [];
    }
  }
  return { tables, migrationRecordKinds };
}

/** Parse the PRD 38 R-MIN durable field register table. */
export function parseStoreRMinRows(prd38: string): StoreRMinRow[] {
  const start = prd38.indexOf("| Durable record or field group |");
  const end = prd38.indexOf("- R-MIN-3 (MUST)", start);
  if (start < 0 || end < 0) return [];
  return prd38
    .slice(start, end)
    .split("\n")
    .filter((line) => line.startsWith("| "))
    .slice(2)
    .map((line) => {
      const cells = line.slice(2, -2).split(" | ");
      return { label: cells[0] ?? "", classCell: cells[1] ?? "" };
    });
}

/**
 * Compare the catalog with the physical schema and the PRD 38 R-MIN rows.
 * Returns one plain sentence for each drift. An empty list means no drift.
 */
export function storeCatalogDrift(
  physical: StorePhysicalSchema,
  rMinRows: readonly StoreRMinRow[],
  catalog: StoreCatalogDriftInput = {
    tables: STORE_TABLE_CATALOG,
    nonTableRows: STORE_NON_TABLE_RMIN_ROWS,
    kinds: STORE_MIGRATION_RECORD_KINDS,
  },
): string[] {
  const drift: string[] = [];
  const catalogTables = new Map(catalog.tables.map((entry) => [entry.table as string, entry]));
  for (const [table, columns] of Object.entries(physical.tables)) {
    const entry = catalogTables.get(table);
    if (!entry) {
      drift.push(`Table ${table} is in the schema but not in the catalog.`);
      continue;
    }
    if (entry.schemaStatus !== "physical") drift.push(`Table ${table} is in the schema but the catalog marks it planned.`);
    if (JSON.stringify(columns) !== JSON.stringify(entry.columns)) {
      drift.push(`Table ${table} columns differ: schema has ${columns.join(", ")}; catalog has ${entry.columns.join(", ")}.`);
    }
  }
  for (const entry of catalog.tables) {
    if (entry.schemaStatus === "physical" && !(entry.table in physical.tables)) {
      drift.push(`Table ${entry.table} is in the catalog but not in the schema.`);
    }
  }
  const physicalKinds = [...physical.migrationRecordKinds].sort();
  const catalogKinds = [...catalog.kinds].sort();
  if (JSON.stringify(physicalKinds) !== JSON.stringify(catalogKinds)) {
    drift.push(`Record kinds differ: schema allows ${physicalKinds.join(", ")}; catalog has ${catalogKinds.join(", ")}.`);
  }
  const claims = [
    ...catalog.tables.flatMap((entry) => entry.rMinRows.map((claim) => ({
      rMinRow: claim.row,
      owner: entry.table as string,
      classCell: claim.classCell,
    }))),
    ...catalog.nonTableRows.map((claim) => ({ rMinRow: claim.row, owner: "outside the tables", classCell: claim.classCell })),
  ];
  for (const claim of claims) {
    const matches = rMinRows.filter((row) => row.label.startsWith(claim.rMinRow));
    if (matches.length !== 1) {
      drift.push(`R-MIN row "${claim.rMinRow}" (${claim.owner}) matches ${matches.length} PRD 38 rows.`);
      continue;
    }
    if (matches[0]!.classCell !== claim.classCell) {
      drift.push(`R-MIN row "${claim.rMinRow}" class differs: PRD 38 says "${matches[0]!.classCell}"; catalog says "${claim.classCell}".`);
    }
  }
  for (const row of rMinRows) {
    const owners = claims.filter((claim) => row.label.startsWith(claim.rMinRow));
    if (owners.length === 0) drift.push(`R-MIN row "${row.label.slice(0, 60)}" has no catalog entry.`);
    if (owners.length > 1) drift.push(`R-MIN row "${row.label.slice(0, 60)}" has ${owners.length} catalog entries.`);
  }
  return drift;
}
