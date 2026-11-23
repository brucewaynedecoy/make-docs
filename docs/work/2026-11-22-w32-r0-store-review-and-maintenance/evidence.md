---
title: "W32 R0 Evidence Report"
kind: "work"
status: "active"
coordinate: "W32 R0"
---

# W32 R0 Evidence Report

This report explains the acceptance evidence for the [W32 R0 backlog](00-index.md). Each section names the acceptance cases it covers, what was run, what it showed, and its limits.

## P1 Table Catalog and Fixed Rules

Covers A1 to A4 in [P1](01-table-catalog-and-fixed-rules.md). Evidence date: 2026-11-22. Branch: `t3/w32-r0-store-table-catalog`, from `docs/w29-w30-work-store-and-factory` at `55a175e4`. Node `v26.13.1`. CLI package version `2.0.9`.

### What Was Built

- `packages/cli/src/store/table-catalog.ts` holds the catalog `make-docs.store-table-catalog.v1`. It names 18 tables (17 physical at schema v6, and `project_register` planned for v7), 5 `installation_migration_records` kinds with 13 record families, 4 proofs, 9 fixed rules (`STORE-RULE-001` to `STORE-RULE-009`), 3 decision items (`STORE-DECISION-001` to `STORE-DECISION-003`), 7 blocking crash leftovers, 4 retention settings, a write contract for every rule, 7 follow-ups for later phases, the recommended v7 receipt columns, a drift check, and a stable digest.
- Each rule and decision item has a read-only candidate query, the proofs that must pass, the settings it uses, its effect, when it skips a row, and a plain meaning. A query can return a `skip_reason`, so a row that a rule must not touch is reported instead of silently kept.
- Each rule has an activation state. Rules 001, 003, 007, 008, and 009 are active. Rules 002, 004, 005, and 006 are inactive: `setup store check` reports their candidates as skipped, and `clean` never changes them, until their follow-up is done.
- `packages/cli/tests/fixtures/store-maintenance-contract.ts` holds 10 fixture Stores (`SMF-001` to `SMF-010`) and a reference evaluator. Each fixture seeds a fresh schema v6 Store in a temporary folder through `withStoreDatabase`. Process liveness is injected with fixed answers, so no fixture depends on a real process id. No test reads or writes the real Store.
- `packages/cli/tests/store-table-catalog.test.ts` holds 36 tests.
- No Store schema, migration, writer, or reader changed. `packages/cli/src/store/index.ts` only re-exports the new module.

### Table Catalog (A1)

| Table | Maintenance class | Retention |
| --- | --- | --- |
| `projects` | keep | Read-only legacy input. Drop in a later migration once legacy import stops reading it. |
| `playbook_runs` | keep | Preserve until its bridge exit and a separate export or deletion approval. |
| `work_evidence` | keep | Never removed. P2 adds the payload size limit. |
| `runs` | keep | Kept. A run open past the review age is a decision item. |
| `run_evidence` | keep | Follows its run. No fixed rule prunes it. |
| `store_checkpoint_journal` | disposable when a matching receipt exists, else keep | `STORE-RULE-007`. |
| `installation_checkouts` | keep | Kept. A missing folder is a decision item. |
| `installation_ledgers` | keep | Kept while Make Docs owns the files. |
| `installation_operations` | keep, with bounded full ledgers | `STORE-RULE-004`, inactive until the v7 receipt columns exist. Pending, failed, and removal handoff rows always stay. |
| `installation_steps` | keep, with bounded saved file contents | `STORE-RULE-003` removes `contentBase64` after 30 days in a completed or rolled-back state, once no detached plan or atomic intent remains. `payload` backup file links stay. |
| `installation_locks` | keep while held, else disposable | `STORE-RULE-001`. |
| `installation_migration_records` | declared per kind | See the next table. |
| `installation_transfers` | keep | Read-only legacy history until its bridge exit. |
| `tool_operations` | keep, with bounded receipt history and abandoned tool runs | `STORE-RULE-009` (active) and `STORE-RULE-002` (inactive). |
| `store_schema_journal` | keep | One row per schema version for the Store lifetime. |
| `store_migration_receipts` | keep | No fixed rule removes it. |
| `backlog_review_cache` | disposable for old versions, bounded at 512 rows per checkout otherwise | `STORE-RULE-008`. |
| `project_register` (planned v7) | keep | Kept while any checkout of the project is bound. |

| Kind | Families and maintenance class |
| --- | --- |
| `receipt` | `migration-receipt`, `checkout-move-receipt`, and `harness-receipt-current` keep. `harness-receipt` (UUID record ID) and `harness-receipt-observation` are bounded by `STORE-RULE-009`. |
| `quiescence` | `legacy-quiescence` is kept today. `STORE-RULE-006` is inactive, because every normal setup leaves a bound barrier that is the post-migration freeze. |
| `snapshot` | `detached-plan` and `detached-original-plan` are disposable by `STORE-RULE-005` (inactive). `migration-snapshot` keeps. |
| `backup` | `atomic-write-intent` is disposable by `STORE-RULE-005` (inactive). `migration-backup` keeps. |
| `legacy-import` | `bridge-evidence` and `legacy-import-receipt` keep. |

A row that matches no family is kept and reported as unclassified.

### Drift Test (A2)

`storeCatalogDrift` compares the catalog with the physical schema of a fresh Store and with the PRD 38 R-MIN register. It checks table names, columns in order, the record kinds that the CHECK allows, the exact class cell of every R-MIN row that the catalog maps (including second rows of one table and rows outside the tables), and that every R-MIN row has exactly one owner. The test passes on the current schema and PRD. Mutation tests show that it fails for an extra table, a missing table, an extra column, an extra or missing kind, a planned table that becomes physical, an added or removed R-MIN row, and a changed class cell on a first row, a second row, and a non-table row. Each fixture also fails when one of its migration records matches no family, unless the fixture names that row as unclassified on purpose.

### Fixed Rules and Decision Items

"Terminal" means `completed` or `rolled-back` only. A `failed` operation is never terminal in P1, because PRD 38 keeps a failed row while recovery is possible. A failed operation also guards its lock and its quiescence barrier like a pending one.

The removal handoff row is the latest completed `setup.remove` of a checkout with no current ledger. Setup reads its full before-ledger, with no time limit, to offer setup after removal. Rules 003, 004, and 005 all skip it.

Rules 003 and 004 also skip an operation while a `detached:` or `detached-original:` plan or an `atomic:` write intent of it remains. The detached plan reader compares the plan with the steps and the after-ledger even for a completed operation, and the atomic intent check needs `contentBase64` in a step. Stripping the steps first would make `make-docs project layout apply <op>` and `make-docs project state recover <op> --dry-run` report `snapshot-drift` instead of `already-complete`.

- `STORE-RULE-001` (active): delete a lock whose owner is proven dead when no pending or failed operation belongs to a checkout at that path. P4 compares `platform.comparisonKey(l.root_path)` with `c.root_path_key`, as well as the raw path, and keeps the lock on any doubt. The catalog SQL can only approximate the key with `lower()`, which matches more paths, never fewer.
- `STORE-RULE-002` (inactive): mark a pending `tool.update` or `tool.uninstall` as `failed` with reason `abandoned` when its owner is proven dead and no package manager run is active. The idle check uses the recorded `manager` and `command`, never `binaryPath`, which is the Make Docs CLI path.
- `STORE-RULE-003` (active): remove `contentBase64` from the steps of an operation that has been completed or rolled back for more than 30 days, when no detached plan or atomic intent of it remains. `payload` is a path to a backup file under `.make-docs/backup/operations/<operation>/`, not bytes, so it stays and the backup file keeps its owner. The rule frees little Store space unless a step holds `contentBase64`.
- `STORE-RULE-004` (inactive): set the full ledgers of an operation that has been completed or rolled back for more than 30 days to NULL, only after the v7 receipt columns hold its ledger digests and step counts, and only when no detached plan or atomic intent of the operation remains.
- `STORE-RULE-005` (inactive): delete `detached:`, `detached-original:`, and `atomic:<operation>:` records of an operation that has been completed or rolled back for more than 30 days.
- `STORE-RULE-006` (inactive): every normal `make-docs setup` leaves a `legacy` barrier bound to its migration snapshot after it releases its lock. `assertLegacyOperationNotQuiesced` enforces that barrier as the post-migration freeze, so a lock that is gone proves nothing. A later phase may, with owner approval, delete only an unbound barrier (`snapshotId` null) that a crash left, when its lock is gone and its checkout has no pending or failed operation and no legacy import.
- `STORE-RULE-007` (active): delete a `store_checkpoint_journal` row when `store_migration_receipts` has the same receipt ID.
- `STORE-RULE-008` (active): delete `backlog_review_cache` rows with a snapshot, rule catalog, or Skill version lower than this CLI's. A higher version stays.
- `STORE-RULE-009` (active): delete harness receipt history rows that have a text `harnessId` and `connectionMethod`, beyond the 10 newest for each harness and method, and for each checkout in a project. The current receipt, the receipt that a pending machine setup names as its ownership receipt, and project rows with a record ID that is not a UUID stay.
- `STORE-DECISION-001`: a checkout whose folder is missing, with its pending and failed operations and cache rows.
- `STORE-DECISION-002`: an `active` or `paused` lifecycle run not updated for 90 days.
- `STORE-DECISION-003`: a pending `legacy.recovery` operation. No command can finish or clear it yet. The report says to keep the operation, its legacy-import record, and the checkout's snapshot, backup, receipt, and quiescence records.

A proof gives `proven`, `refuted`, or `unknown`. A rule acts only on `proven`. It keeps the row on `refuted` and skips it with a reason on `unknown`.

### Write Contract

`STORE_RULE_WRITE_CONTRACT` holds the write contract, and P4 must implement it. Every change of one clean runs inside one `BEGIN IMMEDIATE` write transaction after the backup. Inside that transaction, the rule runs its candidate query and its proofs again for the row's key. The change is a compare-and-change statement whose WHERE clause names the key and the exact values that the check proved. When the statement changes no row, or a value or proof differs, the row is skipped and reported as changed after the check. Each rule names its recheck columns, and its candidate query selects them:

- Rule 001: `root_path`, `token`, `pid`, and `hostname`.
- Rule 002: the key, `operation`, `status` (still `pending`), `pid`, `hostname`, and the checked `metadata_json`.
- Rule 003: the key, `before_json`, `after_json`, and the operation's status and finish time.
- Rule 004: the key, `status`, `finished_at`, and the ledgers, matched by the digest in the receipt columns.
- Rule 005: the key and the operation's ID, status, and finish time.
- Rule 006: the key and the exact `record_json` whose digest the proof checked.
- Rules 007 and 008: their full keys.
- Rule 009: for machine rows, `operation_id`, the receipt operation ID, and the exact `metadata_json`; for project rows, `checkout_id`, `kind`, `record_id`, the receipt operation ID, and the exact `record_json`. The test checks the key columns of every query, also for rules with more than one query.

### Fixtures (A3, A4)

Each rule and each decision item has at least one fixture row that it acts on once active and one that it keeps. Each rule that uses the owner liveness proof also has a row that it skips. A second pass shows that today an inactive rule skips every row it finds. The fixtures cover these edge cases:

- a lock that guards a pending operation, and one that guards a failed operation;
- a failed operation with old saved bytes, full ledgers, a detached plan, an atomic write intent, a dead-owner lock, and a quiescence barrier, which every rule keeps or skips (`SMF-010`);
- the removal handoff row, which rules 003 and 004 skip, and an older removal that a later operation replaced, which rule 004 acts on;
- a completed detached operation older than the window, with steps that hold `contentBase64` and its plan, which rules 003 and 004 skip, and a completed operation with only an atomic intent left, which they also skip;
- a step with only a `payload` backup file link, which rule 003 keeps;
- an `atomic:op-10:1` record that must not match operation `op-1`, and a plan finished within the retention window;
- a quiescence barrier on a checkout with a pending operation, an imported barrier, and the normal barrier bound to a snapshot, which the rule keeps even once active;
- a lock written with other letter case that still guards a pending operation, which rule 001 keeps;
- 11 machine receipt rows with valid JSON but no `harnessId` or `connectionMethod`, which rule 009 keeps;
- a pending machine drift repair whose ownership receipt rule 009 keeps, and a project receipt with a non-UUID record ID;
- unreadable step JSON, an empty ledger, a newer cache version, and an observation row that counts toward the kept count.

Each blocking crash leftover has a fixture: the dead-owner lock with no pending operation and the lock that guards one (`SMF-001`), the pending tool update or uninstall (`SMF-002`), the pending machine setup (`SMF-008`), and the pending `legacy.recovery` operation, the pending operation on a missing folder, and the pending manual layout with no lock (`SMF-009`). Completed and failed `setup.system.harness` rows have a keep row class and a fixture.

### Validation

- `npx tsc --noEmit -p .` in `packages/cli`: passed.
- `npx vitest run tests/store-table-catalog.test.ts`: 36 passed. A mutation that counts `failed` as terminal makes 2 tests fail. A mutation that drops the `lower()` path match from rule 001 makes `SMF-001` fail, and a mutation that drops the harness text checks from rule 009 makes `SMF-008` fail. A mutation that drops the detached-plan skip from rule 003 makes `SMF-004` fail.
- Full suite `npx vitest run`: 2133 passed, 3 failed, 6 skipped (2142 tests in 122 files). The 3 failures exist without this change: 2 in `tests/mcp-app-contract.test.ts` and fixture 11 in `tests/p5-migration-safety.test.ts`, which fails only in the sandbox. A fresh worktree first needs `node scripts/copy-template-to-cli.mjs` and `npm run build` in `packages/cli`. Without them, 85 more tests fail for reasons that this change does not cause.
- Catalog digest: `sha256:5de4d123f9352ecff9bc3ae1ca2a6d2f8ba53fd06ac57ce00be87bda6f4e1fc3`.

### Owner Decisions In The Acceptance Gate

- Retention for saved file contents (`contentBase64`), full ledgers, and detached plans of a completed or rolled-back operation: 30 days. Failed operations and the removal handoff row are never trimmed.
- Kept harness receipt history: 10 rows for each harness and method, besides the current receipt.
- Review age for an open lifecycle run: 90 days.
- Recommendation: add bounded receipt columns to `installation_operations` in schema v7 (`before_ledger_digest`, `after_ledger_digest`, `step_count`, `applied_step_count`) instead of a receipt stored in place of the ledger. Rule 004 nulls the full ledgers only after these columns are filled.
- `STORE-RULE-002` stays inactive until P4 builds the corrected package-manager-idle check from the recorded manager and command.
- `STORE-RULE-005` stays inactive until P2 makes a missing plan on a completed or rolled-back operation read as pruned, not as damage. Then it uses the 30-day retention window.
- `STORE-RULE-006` stays inactive. A later phase may turn it on, with your approval, only for an unbound barrier (`snapshotId` null) left by a crash.

### Follow-Ups For Later Phases

- P2: define when a failed operation's recovery is closed. Until then, no rule touches a failed operation's rows.
- P2: add the bounded receipt columns, if the owner accepts them, and make readers accept NULL ledgers on a terminal operation whose receipt columns are filled. This unblocks rule 004.
- P2: make `detachedSnapshot` and its callers (`readDetachedInstallationOperation`, the recovery read, and `applyProjectLayout`) read a missing plan on a completed or rolled-back operation as pruned. This unblocks rule 005.
- P3: `deleteProjectRows` deletes `playbook_runs` and counts projects from the legacy table, against R-LIFE-2 and R-REGISTER-4. Rewrite it with `pruneProjectFromStore`.
- P4: build the package-manager-idle check. This unblocks rule 002.
- P4: implement the write contract for every rule.
- Later phase: with owner approval, turn rule 006 on only for an unbound `legacy` barrier (`snapshotId` null) left by a crash before it was bound to a snapshot. A bound barrier is the post-migration freeze and always stays.
- Later phase: design a reviewed rule that removes the backup files under `.make-docs/backup/operations/<operation>/` of an old finished operation together with the `payload` links in its steps, in one change.

### PRD 38 And Code Gaps

- R-MIN `installation_steps` and R-MAINT-3 call the step data "saved file bytes", but `payload` is a backup file path and only `contentBase64` is bytes in the Store. The backup files live in the project folder, and no rule removes them yet.
- R-MIN `installation_steps` makes saved bytes disposable at the terminal state, but R-MAINT-3 adds the retention window. The catalog uses the window. The R-MIN row also says path and digests stay "until the retention window ends", but no fixed rule removes them after that, so the catalog keeps them.
- R-MIN `installation_operations` keeps "ledger digests" and "step counts", but no column holds them and R-DB-7 adds none. The recommended v7 receipt columns close this.
- R-MIN `installation_migration_records` says to preserve quiescence evidence by declared kind, but R-MAINT-3 makes a quiescence row whose lock is gone disposable. An imported barrier names a legacy lock that never exists in `installation_locks`. Every normal setup also leaves a bound barrier with no lock, and that barrier is the post-migration freeze, so R-MAINT-3 as written would end the freeze. Rule 006 is inactive, and its later form is limited to unbound barriers.
- PRD 38 has no "failed recovery closed" state. Until P2 defines it, a failed operation keeps all its rows.
- R-MAINT-3 makes detached plans of a terminal operation disposable, but today's readers report a missing plan as damage. Rule 005 waits for P2.
- The detached plan reader compares a completed operation's plan with its steps, so step contents can go only after the plan goes. Rule 005 is inactive, so rule 003 acts today only on operations without a detached plan or atomic intent.
- Setup after removal reads the full before-ledger of the latest completed `setup.remove` with no time limit. PRD 38 does not name this exception. The catalog skips that row.
- The `tool_operations` R-MIN row names only machine receipts. Project harness receipts live in `installation_migration_records`. `STORE-RULE-009` covers both.
- A pending `setup.system.harness` row, and a pending detached operation with no lock, block the machine like a pending tool update, but PRD 38 names no rule for them. Their current commands still clear them.
- No current command clears a pending `legacy.recovery` operation.
- `store_schema_journal` has no reader today. P2 adds it.

### Limits

- The reference evaluator lives in the test fixtures. P4 builds the real `setup store check` and must reach the same answers on these fixtures.
- The package-manager-idle proof and process liveness are fixture values, not real process checks.
- A schema v6 Store cannot hold a `failed` installation operation. `SMF-010` lifts the CHECK in its temporary Store to stand for a v7 failed row.
- The v7 receipt-column clause of rule 004 cannot run on schema v6. Its fixtures show the v6 part of the condition only.

## P2 Schema v7 and Defect Fixes

Covers A5 to A10 and A25 to A27 in [P2](02-schema-v7-and-defect-fixes.md). Evidence date: 2026-11-22. Branch: `t3/store-schema-v7-defect-fixes`, from `docs/w29-w30-work-store-and-factory` at `26780343`. Node `v26.13.1`. CLI package version `2.0.9`. No test opened the real Store.

### What Was Built

- `packages/cli/src/store/database.ts` sets `CURRENT_STORE_SCHEMA_VERSION` to 7 and adds one append-only migration. It creates `project_register` (project ID, project name, first seen, last seen; the name is unique, lower case, and at most 64 characters). It rebuilds `installation_operations` with the `failed` status, the four R-LIFE-6 failure columns (`failure_code`, `failure_summary`, `failed_stage`, `next_action`), and the four receipt columns (`before_ledger_digest`, `after_ledger_digest`, `step_count`, `applied_step_count`). It rebuilds `store_migration_receipts` with a widened CHECK: source version 0 or more, target version 5 or more, and source lower than target. It writes the v7 `store_schema_journal` row, then adds `BEFORE INSERT`, `BEFORE UPDATE`, and `BEFORE DELETE` guard triggers on all 18 tables and on any other table that an older process added.
- The migration path: one verified backup (`store.db.bridge-v<from>-to-v7-<id>.backup`) before the first migration, then each migration in one `BEGIN IMMEDIATE` transaction with its `user_version` bump and its journal row. A migration that rebuilds a table turns foreign key checks off before the transaction and turns them back on after. Inside the transaction it runs `PRAGMA foreign_key_check` before and after the migration, grouped by child and parent table. It refuses only references that the migration newly broke. A reference that was already broken stays, and the setup preview (`w32-r0-p2-broken-references`) and `project state status` (`storeIntegrity`) report it with a repair step. Any failure rolls the transaction back. The checkpoint-9 entry point runs its state check, every migration, its receipt, and the version bump in one transaction too.
- One shared connection path, `openSqliteWithRetry`, registers `make_docs_write_guard()` on every Make Docs connection and sets `trusted_schema = ON`. For schema 7 or later, it checks every table's three guard triggers against the exact SQL (`inspectStoreWriteGuard`). A missing or changed trigger raises the Store issue `changed-outside`. The classifier reports the same check as Store state `unknown` with that issue. The operation registry and the harness policy map it to `store-unsafe`, with a next action that names `make-docs setup store check` and the newest Store backup.
- `store.db` and every Store backup get file mode `0600` on POSIX systems: each migration sets it on `store.db`, on the new backup, and on every existing backup (older `store.db.*.backup` files and every file in `<store>/backup/`).
- A virtual table and its shadow tables cannot carry triggers in SQLite. No Make Docs schema has one. When an older program added one, the migration and the open check skip it, and `project state status` reports it as not guarded.
- Defect fixes in `installation-state.ts`: `commitOperation` no longer writes `installation_checkouts` (path, path key, verification time, or evidence), and it fills the receipt columns in its transaction. A failure inside `withInstallationOperation` marks the operation `failed` with fixed, bounded failure fields before the lock is released; when the Store cannot record it, the operation stays `pending`. `pending` and `failed` both block new work on the checkout, tool changes, machine setup, and Store removal, and recovery accepts both. `state-rows.ts` refuses a `work_evidence` payload above 65,536 bytes of UTF-8 JSON with `WorkEvidencePayloadTooLargeError` (code `work-evidence-payload-too-large`). `project state status` reads `store_schema_journal` and reports any missing version from 3 up to the current version.
- Follow-ups: a missing detached plan on a completed or rolled-back operation reads as pruned in `detachedSnapshot`, `readDetachedInstallationOperation` (`allowPruned`), the recovery read, and `applyProjectLayout`. The catalog adds `STORE_FAILED_RECOVERY_CLOSED` and `STORE_OPERATION_FAILURE_COLUMNS`, marks the three P2 follow-ups `done`, and adds `FOLLOW-UP-P4-RULE-ACTIVATION`. Rules 004 and 005 stay inactive until P4.

### Migration and Write Guard (A5 to A8)

- v6 to v7 keeps every operation, step, checkout, and receipt row, passes `PRAGMA foreign_key_check`, leaves foreign keys on, writes journal rows 3 to 7, fills the receipt columns of the completed and rolled-back rows, and leaves them NULL on the pending row. One backup is made, at schema 6 and mode `0600`.
- An injected failure inside the v7 migration leaves `user_version` 6, the old `installation_operations` columns, no new table, no trigger, and foreign keys on.
- A schema 8 Store is refused with `StoreSchemaNewerError`, and its bytes do not change.
- A raw `node:sqlite` connection reads the Store, but its `INSERT`, `UPDATE`, and `DELETE` fail with `no such function: make_docs_write_guard` and the file bytes do not change.
- Every Make Docs open path writes: `withStoreDatabase`, `openStoreSqliteConnection`, `withInstallationDatabase` and `withInstallationOperation`, `migrateStoreDatabaseAtCheckpoint9`, and `applyStoreMigrations` on a connection it is given. A fresh Store has 54 guard triggers, 3 for each of the 18 tables. A new table without triggers fails the check.
- A reference that was broken before the migration (an `installation_steps` row whose operation is gone) does not stop the migration. The row stays, and the preview and status report it with a repair step. A reference that the migration itself breaks stops it, and the Store stays at schema 6.
- An FTS5 virtual table from an older program is skipped with its five shadow tables, the migration and the next open succeed, and status reports the tables as not guarded.
- Older bridge backups and files in `<store>/backup/` with mode `0644` have mode `0600` after the migration.
- A removed trigger, a changed trigger, and an unguarded table each make classify, open, a raw Make Docs read, `withInstallationDatabase`, and `project state status` report "changed outside Make Docs". The scoped operation error is `store-unsafe` and names `make-docs setup store check` and the newest backup.

### Store Open Paths

| Path | How it gets the guard |
| --- | --- |
| `openStoreDatabase` and `withStoreDatabase` (project state, lifecycle runs, backlog cache, work evidence, bootstrap, MCP tools through the same operations) | `connect` → `openSqliteWithRetry`. |
| `migrateStoreDatabaseAtCheckpoint9` | `connect` → `openSqliteWithRetry`. |
| `openStoreSqliteConnection` (`withInstallationDatabase`, `prepareStore`, tool operation removal check, compatibility bridge preview, the setup ledger prediction in `cli.ts`, which used a raw `DatabaseSync` before) | `openSqliteWithRetry`. |
| `classifyStoreCheckpoint9State` and `readStoreCheckpoint9JournalEntry` (read only) | `openSqliteWithRetry`. The classifier runs the guard check itself, so it can report a Store state. |
| Bridge backup verification (read only) | `openSqliteWithRetry`. |
| `applyStoreMigrations` on any connection | Calls `registerStoreWriteGuard` first. |
| Test helpers that write on a raw connection (`tests/store-ledger-fixture.ts`, the child writer in `tests/store.test.ts`) | Call `registerStoreWriteGuard` or register the same function. |

The MCP server has no separate Store open. It calls the same operations, so it uses the same paths.

### Defect Fixes (A9, A10)

- The checkpoint-9 receipt for a v6 Store records source 6 and target 7, and for a new Store source 0 and target 7. A backward receipt (7 to 6) fails the CHECK.
- A second committed operation leaves the whole `installation_checkouts` row unchanged, including a sentinel verification time and evidence.
- A callback failure gives `status = 'failed'`, `failure_code = 'operation-error'`, `failed_stage = 'apply'`, the summary "The test.change operation stopped during apply (operation-error).", and a next action that names `make-docs project state status`. The raw error text is not stored. A new operation on that checkout is refused until recovery.
- A payload of exactly 65,536 bytes is kept. One byte more is refused with the typed error that names "65536 bytes (64 KiB)", and nothing is written. Current callers write evidence records and lifecycle notes. No existing test used a larger payload.
- `project state status` shows `storeSchema` with journal versions 3 to 7. After a journal row is removed, it lists the missing version and a warning.

### Follow-Ups (A25 to A27)

- A25: a completed operation has both ledger digests (`sha256:` plus the hex SHA-256 of the exact ledger text) and its step and applied counts. A missing ledger, SQL NULL or the text `null`, has a NULL digest. The migration backfill gives the same values for old terminal rows.
- A26: after its plan is removed, a completed layout operation reads as `planPruned`. `project layout apply <op>` reports `already-complete`, and `project state recover <op> --resume --dry-run` and `--rollback --dry-run` report `completed` with no conflict. A pending operation with a missing plan still reports the missing plan.
- A27: `STORE_FAILED_RECOVERY_CLOSED` says that a failed operation's recovery is closed only when `project state recover` commits it as `completed` or `rolled-back`. While it is `failed`, no rule touches its rows. A test recovers a failed operation, sees `completed` with its failure fields kept, and checks that no rule query counts `failed` as terminal.

### Test Expectations Changed

- `tests/store-table-catalog.test.ts`: `project_register` is now physical, so the planned count is 0 and the planned-table mutation uses a planned catalog copy. A new check covers a missing physical `project_register`.
- `tests/fixtures/store-maintenance-contract.ts`: SMF-010 no longer lifts the CHECK, because v7 accepts `failed`.
- `tests/backlog-cache.test.ts`: the refusal names the current version, not 6.
- `tests/installation-state.test.ts`: a callback failure now reports `Failed operation:`, under R-LIFE-6.
- `tests/p6-global-store-lifecycle.test.ts`: the table and schema lists include `project_register` and the guard triggers, and the "later write" table that test 4 adds gets its guard triggers, as every table must.
- `tests/store.test.ts`: the child process that stands for a second Make Docs writer registers the guard function.
- `tests/w32-r0-p2-schema-v7.test.ts` (new in P2): after the review, the rolled-back row's `after_ledger` text `null` has a NULL digest, not the digest of `null`.
- `tests/w22-r1-ownership.test.ts`: checkout evidence is empty before the first move, because commits no longer write it, and is a full v2 proof after the move.

### Validation

- `npx tsc --noEmit -p .` in `packages/cli`: passed.
- `npx vitest run tests/w32-r0-p2-schema-v7.test.ts tests/store-table-catalog.test.ts`: 61 passed (25 P2 tests and 36 catalog tests). `tests/w22-r1-ownership.test.ts`: 35 passed, 1 skipped.
- Full suite `npx vitest run` after `npm run build`: 2172 passed, 3 failed, 6 skipped (2181 tests in 125 files). The 3 failures exist without this change: 2 in `tests/mcp-app-contract.test.ts` and fixture 11 in `tests/p5-migration-safety.test.ts`, which fails only in the sandbox. Tests that start the built CLI need `npm run build` after this change.
- Catalog digest: `sha256:adb8d489744c67e9acaea78dc6abf159f29421188324fac31f4dddcc9a996845`.

### Decisions For The Owner

- Checkout move proof. Commits no longer refresh `verification_json`, so saved evidence can name an older ledger. The move preview now trusts the Store ledger and its full current proof of every owned target file. Saved evidence must name the same project, and evidence for the same ledger must still match exactly. Unreadable or unknown evidence still blocks. Without this change, every move after a later commit would be blocked.
- `work_evidence` limit: 64 KiB of UTF-8 JSON.
- Extra triggers. The open check requires every table's three guard triggers with the exact SQL. It does not flag other triggers, because a write in their body still fires the guard. Several existing fault-injection tests rely on such triggers.
- v6 to v7 runs through the existing reviewed path: `make-docs setup` (the compatibility bridge and checkpoint 9). Other commands on a v6 Store say to run setup. A lock or a pending tool operation does not block this conversion, because it keeps every row; only the W22 schema 3 and 4 conversion still needs a quiet Store.
- A failure during `project state recover` leaves the operation in its current status. Only the shared mutation journal (`withInstallationOperation`) records `failed`.
- The v7 migration leaves `project_register` empty. P3 fills it.
- A reference that was broken before the migration is kept and reported, not refused, so setup cannot be blocked by old damage.
- A virtual table cannot carry triggers. It is skipped and reported, so its rows are not guarded.
- A missing schema journal version is reported in status. It does not block a Store open.

### Limits

- The guard stops accidental and casual writes only. A program that runs as the same person can register the same function or drop triggers. The next Make Docs open detects a dropped or changed trigger, under R-WRITE-GUARD-6.
- File mode `0600` is not set on Windows.
- `make-docs setup store check` does not exist until P4, so the next action names a command that P4 builds.
- The Store README and comments still describe schemas 1 to 6 in places. P5 fixes documentation drift.

### Follow-Ups For Later Phases

- P5: status and documentation must state the guard's limit under R-WRITE-GUARD-6. P2 does not state it in status yet.
- P3 or P4: T7 removed the implicit `root_path` respelling on commit. Queries that still compare `root_path` exactly (`installation-state.ts` pending path claims near line 207, `harness-system-operations.ts` near line 453, and the `installation_locks` lookups) can take a case-renamed checkout's own work for another checkout's. They should compare `root_path_key` with `platform.comparisonKey`, as checkout lookup does.
- P4 requirement: the `store-unsafe` next action names `make-docs setup store check`. That command must open a changed Store read only, with the guard check off, so it can report the change.
- P5 wording review: the `store-unsafe` message repeats its next action, once in the issue text and once as the scoped next action.
- P5: on its copy of a real Store, check the largest `work_evidence` payload against the 64 KiB limit.

## P3 Project Register and Row Events

Covers A11 to A14 in [P3](03-project-register-and-row-events.md). Evidence date: 2026-11-22. Branch: `t3/w32-p3-project-register-row-events`, from `docs/w29-w30-work-store-and-factory` at `4daaf18f`. Node `v26.13.1`. CLI package version `2.0.9`. No test opened the real Store: every test uses a temporary `MAKE_DOCS_HOME`, and the P3 test file points `MAKE_DOCS_HOME` at a temporary guard folder before each test.

### What Was Built

- `packages/cli/src/store/project-register.ts` holds `recordProjectInRegister`. Each Store write for a project calls it inside the write's own transaction. It reads `projectName` from `.make-docs/config.yaml` and creates or updates the project's `project_register` row. It has two modes:
  - `refuse`, at the start of a write: it refuses a name in the wrong form, a name that another project holds, a name that is another project's ID, and a project ID that is another project's name. A refusal throws before the write's own rows, so the transaction leaves no row.
  - `keep`, at an operation commit and at the end of a recovery: it never refuses. On a name problem it keeps the stored name, records the row, and returns the problem. A recovery puts it in its result as `projectNameConflict`, and `make-docs project state recover` prints it. A commit inside a running operation keeps the stored name, and the next operation start refuses the name with the full message. So a rollback or a resume always finishes once it has put files back.
- The register writers: the start and the commit of every installation operation (`withInstallationOperation` and `commitOperation`, so setup, install apply, adoption, `setup remove`, and recover), detached operation preparation (layout prepare and Skill adoption), a new checkout binding (`getInstallationCheckoutId`), migration records (`recordMigrationState`, which now binds, registers, and writes in one transaction), legacy import, checkout register, checkout move, backlog cache write, work evidence record (`recordWorkEvidence`, which also serves lifecycle checkpoint evidence), and every lifecycle write: `lifecycle.start`, each state change, and `lifecycle.attach-evidence`. The lifecycle operations pass the project folder from `lifecycleIdentity`, and `createLifecycleRun`, `transitionLifecycleRun`, and `attachLifecycleEvidence` record the register row in their own transaction. `buildWorkEvidenceRecord` now writes its register row and evidence row in one transaction.
- Legacy identity adoption deletes the temporary project ID's register row when no checkout names that ID any more. Without this, the temporary row would list a project with no checkout and could hold the config name, so the import would refuse its own name.
- `projectName` form (PRD 38 R-ID-8, PRD 24 R-CONFIG-STATE-9): 1 to 64 characters, lower-case letters, digits, and hyphens, starting with a letter, and not in the form of a minted project ID (a UUID). Config validation reports a wrong form as `invalid-project-name`. A Store write refuses it with `ProjectNameInvalidError` (`project-name-invalid`).
- Name refusal: `ProjectNameTakenError` (`project-name-taken`). Its message names the other project's ID and its checkout paths, says that Make Docs refused the Store write, and asks for another `projectName`. Its `details` carry the name, both project IDs, and the other project's checkouts. A project ID that is another project's name is refused with `ProjectIdIsOtherNameError` (`project-id-is-other-name`), which names that project and asks to change its `projectName`.
- Name changes: a changed `projectName` replaces the name at the next Store write, and the old name is free at once. A config with no `projectName` clears the name. A missing config file keeps the recorded name, because the name is unknown then.
- Project prune (`deleteProjectRows` through `pruneProjectFromStore`) removes only `run_evidence`, `runs`, and `work_evidence` rows of the project, and its `project_register` row once no checkout of the project is bound. It keeps `playbook_runs`, the read-only legacy `projects` table, every installation table, and every other project's rows. It counts the remaining projects from `project_register` and reports the removed rows by table. It still has no caller.
- `project.register.list` (`make-docs project list`, MCP `project_list`, profiles `core` and `all`) reads `project_register` and `installation_checkouts` only. It shows each project by name first, then its ID, last seen time, and checkouts, and names each missing checkout folder in plain words. A checkout that names a project with no register row yet is listed as not recorded. The name catalog marks it current. The `project` help lists it.
- The `root_path` follow-up from P2: `packages/cli/src/store/root-path-match.ts` compares a stored checkout or lock path with the platform comparison key, as checkout lookup does. A match is `same`, `different`, or `unknown`; `unknown` means a path could not be resolved and the lower-case paths are equal. A caller that blocks work treats `unknown` as the same folder. Recovery is the only caller that removes a row: it deletes a dead lock only on `same` and stops on `unknown`, keeping the lock.

### Row Events (A11)

Each test takes every row of every catalog table before and after the event, keyed by primary key, and checks the exact tables and the number of rows that the event created, updated, or removed. All are in `packages/cli/tests/w32-r0-p3-project-register.test.ts`.

| Row event | Rows it touches |
| --- | --- |
| Store create | `store_schema_journal`: 5 created. Register empty. |
| Setup and install apply (`make-docs setup`) | `installation_checkouts` 1 created, `installation_ledgers` 1 created, `installation_operations`, `installation_steps`, and `installation_migration_records` created, `project_register` 1 created. A later setup with a new `projectName` updates the register row and adds no checkout. |
| Adoption (`make-docs setup --adopt` in a second Store) | `installation_checkouts` 1 created, `installation_ledgers` 1 created, `installation_operations` created, `project_register` 1 created. No table outside the installation tables and the register. |
| Legacy import | `installation_checkouts` 1, `installation_migration_records` 2, `installation_operations` 1 (pending `legacy.recovery`), `project_register` 1, all created. |
| Checkout register | `installation_checkouts` 1 created, `project_register` 1 updated. |
| Checkout move | `installation_checkouts` 1 updated, `installation_migration_records` 1 created (move receipt), `project_register` 1 updated. |
| `setup remove` | `installation_ledgers` 1 removed, `installation_operations` 1 created, `project_register` 1 updated. The checkout stays. |
| Project prune, checkout bound | `run_evidence`, `runs`, and `work_evidence` 1 removed each. `playbook_runs`, `projects`, the register row, and the other project's rows stay. Remaining projects: 1. |
| Project prune, no checkout bound | `work_evidence` 1 removed, `project_register` 1 removed. Remaining projects: 0. |
| Tool update and tool uninstall | `tool_operations` 1 created each. No project row. |
| Machine harness setup | `tool_operations` 1 created. No project row. |
| Project recover (rollback of a failed operation) | `installation_ledgers` 1 updated, `installation_operations` 1 updated, `project_register` 1 updated. |
| Lifecycle start, change, and evidence (through the operations) | `runs` 1 created and `project_register` 1 created; `runs` 1 updated and `project_register` 1 updated; `run_evidence` 1 created, `runs` 1 updated, and `project_register` 1 updated. A taken name stops `lifecycle.start` with `project-name-taken` and no row changes. |
| Lifecycle Store functions with no project folder | Only `runs` and `run_evidence`, as before. Every current operation passes the folder. |
| Work evidence record | `work_evidence` 1 created, `project_register` 1 created. |
| Backlog cache write | `installation_checkouts` 1 created (first binding), `backlog_review_cache` 1 created, `project_register` 1 created. |
| Maintenance clean | P4 builds `setup store clean` and its row tests. |

### Project Names (A12)

- A second project with the same `projectName` is refused at the start of its installation operation, before any project file changes. The error is `project-name-taken`, its message names the other project's ID and its checkout path, and the Store rows are unchanged. Work evidence record and backlog cache write refuse the same name and leave no row.
- After the first project changes its name, its next write records the new name, and the second project can take the old one. Removing `projectName` clears the name.
- Wrong forms (`Docs`, `2docs`, `docs_site`, 65 characters, a UUID) are refused by config validation and by the Store write. A name that is another project's ID is refused. A write whose project ID is another project's name is refused with `project-id-is-other-name`, the other project's ID and checkout, and no row change. A project may use its own ID as its name.
- Recovery and commit never stop on a name. A failed operation whose project's config name now clashes finishes with `--rollback` (the new file is removed, status `rolled-back`) and with `--resume` (status `completed`). Each result reports `projectNameConflict` with `project-name-taken`, the other project's ID, and the kept name, and the register keeps the stored name. A name changed to a taken one during a running operation does not block its commit; the next operation start refuses it.
- Through `make-docs setup` on a fixture Store, the refusal is the `failedCondition`: "The project name "handbook" belongs to another project in this Store: project c3610116-…. Its checkout: …/handbook. Make Docs refused this Store write. Choose another projectName in .make-docs/config.yaml, then run the command again." The project kept only its config file.

### Project Prune (A13)

The prune tests above show that `playbook_runs` and the legacy `projects` rows stay and that `remainingProjects` comes from `project_register`. The older prune tests in `store.test.ts`, `store-lifecycle.test.ts`, `store-verification.test.ts`, and `p6-global-store-lifecycle.test.ts` expected `playbook_runs` and `projects` rows to be deleted, against R-LIFE-2 and R-PS-6. They now expect those rows to stay.

### Project List (A14)

- A fixture Store set up through the built CLI with a generic MCP client: `make-docs project list --json` (a separate process) and the MCP `project_list` call give the same result, and no Store row changes.
- The typed Store outcomes (R-STORE-CMD-5). A missing Store gives a different code on each surface: the CLI `make-docs project list --json` exits 1 with `store-unavailable` ("The Store is absent"), and the MCP `project_list` call gives `store-denied`. The CLI runs on the direct route, reaches the Store open, and finds the Store absent. MCP must first prove its connection against the harness settings saved with the Store, and a missing Store has none, so the harness policy denies it. This is the existing behavior for every Store operation. The test asserts each exact code, and neither creates the Store. A Store with `user_version` 999 gives `store-unsafe` through MCP, and a project without harness access gives `store-not-configured`.
- `--target-root` names the project whose harness access admits the Store read; it defaults to the current folder. The `project` help and the `project list` help show it. The registry usage string stays `make-docs project list [--json]`, the canonical form in the PRD 39 R-STORE-CMD table, as `project state status` does.
- Sample text output on a fixture Store with two projects, one renamed `handbook` and one whose folder was moved away:

```text
The Store knows 2 projects with 2 checkouts. 1 checkout folder is missing.

handbook
  Project ID: c3610116-c85f-4eb5-9d33-f71527722307
  Last seen: 2026-11-23T04:54:35.643Z
  Checkout:
    /private/tmp/claude-501/p3-sample/handbook

(no project name)
  Project ID: 7fef8031-dfef-4a95-97ad-477e2947a188
  Last seen: 2026-11-23T04:54:27.525Z
  Checkout:
    /private/tmp/claude-501/p3-sample/old-site
      The folder is missing. It was moved or deleted.
```

### `root_path` Comparison (P2 Follow-Up)

- `assertNoOtherPendingPathClaims` (the pending path claims in `installation-state.ts`) now leaves out this checkout's own operations by checkout ID, not by exact path text. Before, a checkout renamed only by letter case took its own pending operation for another checkout's claim and blocked itself.
- Every `installation_locks` lookup (acquire, active check, release, status, move preview, recover) uses `findInstallationLocks`, which matches a lock saved under any spelling of the folder. A dead lock under the old spelling still guards the folder. Recovery deletes a dead lock only when its path matches by the platform key. A lock whose path cannot be resolved and that matches only by lower case stays, and recovery stops with "Make Docs cannot resolve that path" (`tests/w32-r0-p3-recover-lock-doubt.test.ts`, which makes one path unresolvable through a mocked platform key).
- `assertNoOtherStoreWork` in `harness-system-operations.ts` matches pending checkout work and locks by the platform key, so a pending or failed operation on the old spelling still blocks machine setup.
- The setup ledger prediction in `cli.ts` compares by the platform key, and more than one match predicts nothing. Schema 3 has no `root_path_key` column, so it uses the path only.
- The test renames a checkout folder by case on this machine's case-insensitive volume. It skips on a case-sensitive volume. A mutation that turns the key match off makes the old-spelling lock check fail, and a mutation that restores the exact-path exclusion makes the test's own ledger write fail with "Pending operation … reserves …". A mutation that lets recovery delete an `unknown` lock fails the doubt test, and a mutation that makes the commit refuse a taken name fails the rollback, resume, and running-operation tests.

### Test Expectations Changed

- `tests/name-catalog.test.ts`: 46 current operations and 21 planned ones (W32 planned 2).
- `tests/mcp.test.ts`, `tests/mcp-profiles.test.ts`, `tests/mcp-profile-discovery.test.ts`, `tests/mcp-derivation.test.ts`, `tests/operation-domains.test.ts`, `tests/registry-contract.test.ts`, `tests/p3-operation-surfaces.test.ts`, `tests/reorganization-verification.test.ts`: the new `project_list` tool and `project.register.list` operation (core 9 tools, all 52). The first P3 report missed the last two. Its text summary of the full suite counted 2273 tests, while a JSON report of the same suite counts 2296 and shows these two failures. The cause of that gap is not known, so this report uses the JSON count.
- `tests/store.test.ts`, `tests/store-lifecycle.test.ts`, `tests/store-verification.test.ts`, `tests/p6-global-store-lifecycle.test.ts`: prune keeps `playbook_runs` and `projects` and reports the register count.

### Validation

- `npx tsc --noEmit -p .` in `packages/cli`: passed.
- `npx vitest run tests/w32-r0-p3-project-register.test.ts tests/w32-r0-p3-recover-lock-doubt.test.ts`: 30 passed (29 and 1).
- The P3 tests with the catalog, name-catalog, MCP, registry, Store, prune, harness, ownership, schema v7, backlog cache, and project state tests (19 files): 309 passed, 1 skipped.
- Full suite after `npm run build`, counted by `npx vitest run --reporter=json`: 2286 passed, 4 failed, 6 skipped (2296 tests in 129 files). Three failures exist without this change: 2 in `tests/mcp-app-contract.test.ts` and fixture 11 in `tests/p5-migration-safety.test.ts`, which fails only in the sandbox. The fourth, `cli interactive flows > routes reconfigure skill scope and selected-name changes without changing Skills` in `tests/cli.test.ts`, timed out at 15 seconds under full-suite load in two runs and passes alone. An earlier run had the same kind of timeout in `tests/backup.test.ts`, which also passes alone. An earlier full run found one real defect, a setup query that read `root_path_key` from a schema 3 Store, which has no such column. It is fixed.
- Catalog digest: `sha256:1f7d44ed03d87044bc01dc35cc12b2776fb0da15cb9d78ceb09229ee009507e6`.

### Decisions For The Owner

- A name problem at a commit or at the end of a recovery is reported, not refused. A recovery reports it in its result. A commit inside a running operation does not report it at once; the next operation start refuses the name with the full message.
- The v7 Store starts with an empty register, and no backfill fills it. `project list` still shows every checkout's project and marks one with no register row as not recorded yet. Its next Store write records it. A backfill would change the committed v7 migration.
- A missing config file keeps the recorded name. A config with no `projectName` clears it.
- A name equal to another project's ID is refused, so `make-docs://project/<project>/` cannot mean two projects. A project's own ID is allowed as its name.
- Prune keeps the legacy `projects` table, because it is a read-only legacy input. It removes the register row only when no checkout of the project is bound, under the R-MIN retention.
- Legacy identity adoption removes the temporary ID's register row. This is a removal inside a row event, not maintenance.
- On doubt, the path match says "same folder". Each caller uses it only to block work. A path that cannot be resolved falls back to a lower-case comparison, which matches more paths, never fewer.
- `project list` uses Store read and project read access, like `project state status`, because it checks each checkout folder.
- `project list` keeps `--target-root`, because harness access is checked for one project. The registry usage string follows the PRD 39 table, so changing it to show the option would need a PRD 39 change.

### Limits

- Guided Progress Review is pending: the owner runs `make-docs project list` on this machine's projects. The builder ran it only on fixture Stores.
- Without a backfill, a project's config name is not in the register until that project's next Store write. Until then, another project can record the same name, and the first project's next write is refused.
- Setup does not yet propose the checkout folder name as `projectName`, which PRD 38 R-ID-8 requires (MUST). [W29 R0 P5](../2026-11-21-w29-r0-work-store/05-agent-twin-and-config.md) T8 owns it ("have setup propose the checkout folder name"). The other half of T8, config validation of `projectName`, landed in this phase.
- In `setup`, a name refusal is the `failedCondition`, but the general `nextAction` still says "Correct the reported Store prerequisite". P5 reviews the wording.
- The case-rename test runs only on a case-insensitive volume.

### Follow-Ups For Later Phases

- P4: `setup store check` and `clean` use `findInstallationLocks` and `storedRootMatches` for rule 001, as the catalog asks.
- P5: the setup `nextAction` for a name refusal, and the Store README, which still describes older schemas in places.
- W29 R0 P5 T8: setup proposes the checkout folder name as `projectName`.

## P4 Maintenance Commands

Covers A15 to A18 in [P4](04-maintenance-commands.md). Evidence date: 2026-11-22. Branch: `t3/w32-store-maintenance-commands`, from `docs/w29-w30-work-store-and-factory` at `4daaf18f`. Node `v26.13.1`. CLI package version `2.0.9`. No test opened the real Store. Every test Store is a temporary folder that the test names in `MAKE_DOCS_HOME`.

### What Was Built

- `packages/cli/src/store/maintenance.ts` is the rule engine. `checkStore` reads only. `cleanStore` backs up, changes, rotates, vacuums, and reports. Both run the candidate queries and proofs of the P1 catalog. A rule acts on a row only when every proof is `proven`. It keeps the row on `refuted`, and it skips the row with a reason on `unknown`. An inactive rule skips every row and says what it would do once it is on.
- `packages/cli/src/operations/setup/store-ops.ts` adds `setup.store.check` (Store read, project none) and `setup.store.clean` (Store write, project none). Both are in the `setup` MCP profile, so also in `all`, with deferred exposure. Clean needs `yes: true` (CLI `--yes`) unless it is a dry run.
- `packages/cli/src/run/setup-store.ts` adds `make-docs setup store check [--json]` and `make-docs setup store clean [--yes] [--dry-run] [--json]`. An interactive clean shows the check and asks once. A non-interactive clean without `--yes` changes nothing and says how to confirm.
- The registry, the MCP name map (`setup_store_check`, `setup_store_clean`), and the name catalog list both operations as current. `make-docs setup --help` names them.
- `database.ts` adds `openStoreForReview`: the shared connection path, read only, with the guard check off. It returns the guard problems.
- `context.ts`: the Store session for `setup.store.check` skips the guarded admission open, refuses a missing Store before it makes any lease file, and holds the shared Store lease while the check runs. The admission for `setup.store.clean` opens read only, so clean never creates or prepares a Store.
- `registry.ts`: an operation under the `setup` command root is never a native command-rule candidate.
- Catalog changes (digest `sha256:00008efc6b5b7d4d31fadfbc2bc3abce52bdd4b589c68d06e4af324a9f2f4ddc` after the review fixes): rules 004 and 005 are active. Rule 004's query also reads the receipt columns and skips a row whose columns are empty, before the detached-plan reason. Rule 009 no longer ranks the current receipt's own rows. `FOLLOW-UP-P4-RULE-ACTIVATION` is done. `FOLLOW-UP-P4-PACKAGE-MANAGER-IDLE` is `built-pending-approval` (a new follow-up state): the check is built and tested, and rule 002 waits for the owner.

### Rule Activation

| Rule | State | Proof |
| --- | --- | --- |
| 001 | active | Unchanged from P1. P4 compares `platform.comparisonKey` of the lock path with `root_path_key` and the raw path, and keeps the lock on any doubt. A path that the platform cannot describe skips the lock. |
| 002 | inactive | The package-manager-idle check is built and tested on real npm, pnpm, yarn, bun, and brew process lines, and the compare-and-change write is tested with the rule forced on. The rule stays off until the owner approves it (`FOLLOW-UP-P4-PACKAGE-MANAGER-IDLE`, `built-pending-approval`). Check reports what the check finds. |
| 003 | active | Unchanged from P1. |
| 004 | active | The v7 receipt columns are filled at each terminal commit and by the backfill (P2 A25). The rule skips a row with empty columns and a row whose digest does not match its ledger. The only readers of a terminal operation's full ledgers are the removal handoff (skipped) and the detached plan check (skipped while a plan exists). A real `make-docs setup`, clean 40 days later, `project state status`, a second setup, `setup remove`, clean 80 days later, and setup after removal all pass. |
| 005 | active | P2 made a missing plan of a completed or rolled-back operation read as pruned (A26). After clean removes a real layout operation's plan and intent, `readDetachedInstallationOperation` gives `planPruned`, `project layout apply` gives `already-complete`, and both recovery dry runs give `completed` with no conflict. |
| 006 | inactive | Unchanged. Its write is tested with the rule forced on, and it removes only the unbound barrier whose lock is gone. |
| 007, 008 | active | Unchanged from P1. |
| 009 | active | The current receipt's own rows (the history copy that every setup writes beside the pointer, and its observations) take no kept slot, so the current receipt plus exactly 10 older receipts stay for each harness and method (review fix 1). |

In one clean, rule 005 runs before rules 003 and 004. Check shows a rule 003 or 004 row that waits only for plans that rule 005 removes in the same clean as an act row, with the note "After STORE-RULE-005 removes this operation's plan and write intents in the same clean."

### Check (A15)

- On each of the 10 fixture Stores, and on one Store that holds six of them, the bytes of `store.db` and every other file are the same after check. SQLite may add its `-shm` index and an empty `-wal` file for a read-only connection; the test counts a `-wal` file with any frame as a write.
- The registry gives the same report for a CLI and an MCP-shaped call. A real setup with a generic MCP connection gives the same report from `make-docs setup store check --json` and the `setup_store_check` tool in the `setup` and `all` profiles, except `checkedAt`. Neither writes the Store.
- A Store whose guard trigger was dropped outside Make Docs: check reads it, reports `guardIntact: false`, the missing trigger, "The Store was changed outside Make Docs.", and "Do not write the Store.", and writes nothing. Clean refuses it as `store-unsafe` with a next action that names `make-docs setup store check`.
- A missing Store gives `store-unavailable` for both commands, and no Store folder is made.
- Old broken references and unguardable tables are reported as notes. No rule removes them.

### Clean (A16, A17)

- On each fixture Store, clean changes exactly the rows that check planned in each table, and every other row of every table stays the same. Each act row is gone (delete rules), has no `contentBase64` (rule 003), or has NULL ledgers with its receipt columns kept (rule 004). Each keep or skip row is unchanged.
- With all fixtures that can share a Store, `work_evidence`, `runs`, `run_evidence`, `installation_checkouts`, `installation_ledgers`, `playbook_runs`, `projects`, `project_register`, `store_schema_journal`, `store_migration_receipts`, and `installation_transfers` are unchanged, and the pending `legacy.recovery` decision item stays.
- The backup is a `VACUUM INTO` copy with mode `0600`. Clean writes it as `<store>/backup/.store-clean-<time>-<id>.db.partial`, verifies it (quick check, schema version, guard), and renames it to `store-clean-<time>-<id>.db` only after the clean transaction commits. Every failure deletes the partial file. A partial file older than a day, left by a crash, is removed at the next clean. `PRAGMA data_version` is read before the backup and after `BEGIN IMMEDIATE`; when another connection committed in between, clean discards that backup and takes it again (tested), so the backup is the exact start state of the transaction. Inside the transaction, clean checks again that `user_version` is 7 and that the guard is intact.
- Restore by the reported steps (copy the backup over `store.db`, delete `-wal` and `-shm`) gives every row, every schema object, and `user_version` exactly as before the clean, on every fixture that clean changed. The restored Store opens through Make Docs with its guard intact.
- After five cleans, only the three newest clean backups remain, and an unrelated file in the backup folder stays. Rotation and `findNewestStoreBackup` count a file in `<store>/backup/` only when it has a finished clean name and verifies as a Store (`isVerifiedStoreBackupFile`); schema bridge backups next to `store.db` count as before. File modes still cover every file.
- A dry run and a clean with nothing to prove change nothing and make no backup.
- Clean needs the write permission (`OperationWriteDeniedError` without it) and one confirmation. Through MCP it needs `allowWrite: true` and a project access ceiling with Store write; a read ceiling gives `store-denied`.

### Review Fixes

An independent review found rules 004 and 005 safe against today's readers, compare-and-change correct, and check on an unsafe Store read only. It asked for six fixes. Each has a test in `tests/w32-r0-p4-store-maintenance.test.ts`.

1. Rule 009 kept too few receipts: every setup writes the current receipt as a history row too, and its observation took another slot, so SMF-008's project group kept only 8 older receipts. The ranking now leaves out every row whose operation ID is the current pointer's, for the same harness and method (and checkout for project rows). SMF-008 now keeps receipts 102 to 111 and removes only 101. A new test builds 15 setups on the machine and in a project, each with the history copy, the current pointer, and an observation of the current receipt, and counts exactly 10 older receipts kept in both.
2. The package-manager-idle check missed Homebrew: it read only the first 3 words and did not strip `.sh`. It now reads `ps -A -ww -o pid=,args=`, leaves out this process and its parent, and examines every word of every line: the bare word, each path segment, and the file name without `.js`, `.cjs`, `.mjs`, `.sh`, `.rb`, `.exe`, `.cmd`, `.bat`, or `.ps1`. Any process that names the recorded manager, or the make-docs package as a word (not a file path), counts as running, whatever its arguments, because a manager can change its process title. A hidden command line, such as `(node)`, `(npm)`, or a defunct process, of the manager or an interpreter that can run it gives `unknown`. Tests use real npm (`npm-cli.js`, `/opt/homebrew/bin/npm`, the bare `npm` title), pnpm (`pnpm.cjs`), yarn, bun, and brew (`brew.rb` under portable Ruby, `bash -p brew.sh`) lines. The running Make Docs CLI and MCP server do not refute it. Rule 002 stays inactive.
3. A failed clean left a backup that took a kept slot: see the backup bullet above. Tests make `VACUUM INTO` fail (a read-only backup folder), make the verify fail (an empty partial file), time out `BEGIN IMMEDIATE` (another writer holds the lock), fail inside the transaction, and fail the schema check. After each, no `store-clean-*` or partial file is added, the Store rows are unchanged, and the one good backup is still the only kept backup. An empty `store-clean-*.db` file and a non-Store file with newer names never take a kept slot and are never named as the newest backup.
4. A busy Store gave a raw `database is locked` error. A busy `BEGIN IMMEDIATE` now gives `store-busy`, which the operation maps to the typed `store-unavailable` outcome with `retryable: true` and a next action to run clean again (PRD 39 R-STORE-CMD-5). "Other commands kept changing the Store" is retryable too.
5. Check could plan a rule 004 change that clean then skipped with "changed after the check": the empty receipt column reason now comes before the detached-plan reason, so check and clean both skip the row with the receipt reason. Rule 005 still removes the finished plan.
6. Clean now checks `user_version = 7` and the guard again inside the write transaction. A test changes the version inside the transaction: clean stops with "The Store schema is 6 inside the clean transaction, not 7. Clean changed nothing.", and the Store and backups are unchanged.

### Compare-And-Change

Every change runs in one `BEGIN IMMEDIATE` transaction. For each rule, in apply order, clean runs the candidate query and the proofs again, and changes a planned row only when its outcome is still `act` and its recheck columns are the same. The write's WHERE clause names the key and every checked value, plus the rule's guard conditions (no pending or failed operation, terminal status and finish time, current receipt pointers). When it changes no row, the row is skipped as "It changed after the check". Tests change a step between the check and the write, and bring a lock owner back to life; both rows stay and are reported.

### Crash Leftovers (A18)

- A dead-owner lock with no pending operation blocks `tool.update`, `tool.uninstall`, and Store removal. After clean, all three run (tested with `runRecordedToolOperation` and `withStoreRemovalLock`), and check lists no leftover.
- A dead-owner lock that guards an unfinished change stays, with "make-docs project state recover" as its next step.
- The pending tool update or uninstall (STORE-LEFTOVER-002) stays until the owner turns rule 002 on. Check shows the package manager result. The other leftovers (legacy recovery, missing folder, machine setup, pending operation with no lock) have no fixed rule by design; check names the existing command for each.

### Sample Output

Fixture Stores SMF-001, SMF-003, SMF-007, and SMF-009 in one temporary Store, shortened:

```text
Store check: Clean would remove or trim 9 rows (about 612 B) under 4 rules. 5 rows are skipped, each with its reason. 10 items need your decision. 11 crash leftovers block this computer. Nothing was changed.
Store: <tmp>/store/store.db (schema 7, 212.0 KB).

Fixed rules:
  STORE-RULE-001 Dead-owner lock with no pending operation: would remove or trim 1 row (about 75 B). Keeps 1. Skips 1.
    Remove: /fixture/dead
    Skip: /fixture/remote: Its owner (process 4102 on other-host.invalid) cannot be checked from this computer.
  STORE-RULE-002 Abandoned tool update or uninstall (not on yet): would remove nothing.
  STORE-RULE-004 Full ledgers of a terminal operation: would remove or trim 4 rows (about 146 B). Skips 3.
    Skip: op-handoff: This is the latest completed removal of a checkout with no ledger. Setup reads its full before-ledger to offer setup after removal.
    Skip: op-no-receipt: The bounded receipt columns of this operation are empty, so its ledgers have no saved fingerprint yet.
    Skip: op-stale-receipt: The after_ledger_digest receipt column does not match the after ledger, so the ledger stays.

Needs your decision (never removed by a rule):
  STORE-DECISION-002 Lifecycle run left open: Lifecycle run run-forgotten in project project-runs has been active at stage implementation since 2041-11-27T12:00:00.000Z. Make Docs never closes a run for you.
    Next: Resume, complete, or abandon the run with `make-docs run lifecycle`.

Crash leftovers that block this computer:
  STORE-LEFTOVER-001 /fixture/dead: A dead-owner installation lock with no pending operation. Its owner process has stopped.
    It blocks: Tool update, tool uninstall, and Store removal (tool-operations.ts checks any installation_locks row), and the next writer on that checkout (acquireInstallationLock reports recovery-required).
    Clean clears it. Next: Run make-docs setup store clean to remove it.

Next: Run make-docs setup store clean to back up the Store and remove these rows.
```

```text
Store clean: Clean removed or trimmed 9 rows (about 612 B of row data) under 4 rules. The Store file shrank by 0 B. 5 rows were skipped, each with its reason. The backup is <tmp>/store/backup/store-clean-20420615T120000000Z-a7e7add7.db.

Each rule:
  STORE-RULE-001 Dead-owner lock with no pending operation: 1 row (about 75 B). Skipped 1.
  STORE-RULE-004 Full ledgers of a terminal operation: 4 rows (about 146 B). Skipped 3.

Space: 212.0 KB before, 212.0 KB after, 0 B freed.
Backup: <tmp>/store/backup/store-clean-20420615T120000000Z-a7e7add7.db

To restore this backup:
  1. Stop every Make Docs command and MCP server on this computer.
  2. Copy <tmp>/store/backup/store-clean-20420615T120000000Z-a7e7add7.db over <tmp>/store/store.db.
  3. Delete <tmp>/store/store.db-wal and <tmp>/store/store.db-shm if they exist.
  4. Run make-docs project state status in a project to check the Store.

Next: Run make-docs setup store check to review the items that need your decision.
```

The fixture Store is small, so the vacuum frees no pages. `PERF-005` measures space on a real Store copy in P5.

### Test Expectations Changed

- `tests/store-table-catalog.test.ts`: rules 002 and 006 are the inactive rules. `FOLLOW-UP-P4-RULE-ACTIVATION` is done, and `FOLLOW-UP-P4-PACKAGE-MANAGER-IDLE` is `built-pending-approval` and unblocks rule 002.
- `tests/fixtures/store-maintenance-contract.ts`: a terminal fixture operation now has its receipt columns filled, as a commit fills them. SMF-003 adds an operation with empty receipt columns and one with a stale digest, which rule 004 skips. The reference evaluator checks the digest too. SMF-002's busy tool update uses pnpm, so a process list can show pnpm running while npm is idle. SMF-008 keeps the 10 older project receipts 102 to 111 and the current receipt's observation (review fix 1).
- `tests/w32-r0-p2-schema-v7.test.ts`: rules 004 and 005 are active.
- `tests/name-catalog.test.ts`: 47 current operations and 20 planned; W32 plans 1 (`project.register.list`, built in P3).
- Registry and MCP surface pins add the two operations and tools: `tests/registry-contract.test.ts`, `tests/p3-operation-surfaces.test.ts`, `tests/operation-domains.test.ts` (new `setup` domain), `tests/reorganization-verification.test.ts` (non-run IDs; `setup` is a registry domain only for `setup.store.*` and stays off the `run` tree), `tests/mcp-derivation.test.ts`, `tests/mcp.test.ts`, `tests/mcp-profiles.test.ts` (53 ready tools), and `tests/mcp-profile-discovery.test.ts` (`setup` 23, `all` 53).

### Validation

- `npx tsc --noEmit -p .` in `packages/cli`: passed.
- `npx vitest run tests/w32-r0-p4-store-maintenance.test.ts tests/store-table-catalog.test.ts tests/name-catalog.test.ts tests/w32-r0-p2-schema-v7.test.ts` after the review fixes: 154 passed (54 P4 tests).
- Full suite `npx vitest run` after `npm run build`, after the review fixes: 2309 passed, 5 failed, 6 skipped (2320 tests in 128 files). 3 failures exist without this change: 2 in `tests/mcp-app-contract.test.ts` and fixture 11 in `tests/p5-migration-safety.test.ts`, which fails only in the sandbox. 2 were timeouts under full-suite load: `tests/backup.test.ts` passes alone, and the `tests/cli.test.ts` test "routes reconfigure skill scope and selected-name changes without changing Skills" takes about 12.3 s against its 15 s limit with this change and about 12.6 s on the base commit `4daaf18f`, so this change does not slow it.

### P4 Decisions For The Owner

- Rule 002 stays inactive. The package-manager-idle check reads `ps -A -ww -o pid=,args=` on macOS and Linux and gives `unknown` on Windows, on a failed or empty list, for a hidden command line that could be the manager, for an unknown manager, or without a command. It refutes idle when any process names the manager or the make-docs package. This is strict: a running `npx make-docs mcp` or any npm run keeps an abandoned npm update pending. Approve or decline turning the rule on.
- `setup store check` and `setup store clean` are not native command rules (Codex command rules, Claude Code permission rules), because the harness contract forbids the word `setup` in any rule. People run them in a terminal, and agents use the MCP tools. The other choice is to allow this exact prefix in the contract.
- Rotation removes only clean backups (`store-clean-*.db` in `<store>/backup/`). It never removes the schema bridge backups next to `store.db` or other files.
- A clean with nothing to remove makes no backup and does not vacuum, so old backups are not rotated away for nothing.
- Restore exactness is logical: every row, schema object, and `user_version`. The backup file is a compact `VACUUM INTO` copy, so its bytes differ from `store.db`.
- The interactive clean shows the check, asks once, and then runs its own fresh check inside the transaction. A row that changed in between is skipped and reported.
- PRD 39 R-SURF-1 says `setup` is a lifecycle command and not a registry operation, but R-STORE-CMD-1 admits `setup.store.check` and `setup.store.clean` in the `setup` domain. P4 follows R-STORE-CMD-1, and the tests allow only these two in that domain. R-SURF-1 needs a wording update (a PRD change for the owner).
- A native-rule agent call cannot prove its caller on a Store changed outside Make Docs, because its receipt lives in that Store, so it gets `store-unsafe`. The direct CLI and MCP routes can still check it.

### Limits

- Space per rule is the bytes of the removed row data. The real file change shows only after the vacuum, in `space`.
- Process liveness and the process list are injected in the fixture tests. The built CLI and real setup tests use the real checks.
- The P2 follow-up about exact `root_path` comparisons in other queries (`installation-state.ts` pending path claims, `harness-system-operations.ts`, lock lookups) is not changed here. Rule 001 already compares the key.
- `name-catalog.ts` and its test counts also change in P3 (`project.register.list`). The merge keeps both.

## P2 Follow-Up: Checkout Move With an Older Store Schema

This follow-up fixes a regression that P2 made. The W22 R1 package proof (`scripts/w22-r1-package-proof.mjs`, run by `npm run smoke:pack:local` and by `platform-safety.yml`) failed at its setup review check, `setupReview.checkoutMove.status` was `null`.

### Cause

The proof seeds a project and Store with Make Docs 2.0.5 (Store schema 6), moves the project folder, and runs the candidate's `setup` review. `previewInstallationCheckoutMove`, `applyInstallationCheckoutMove`, and `registerSeparateInstallationCheckout` in `packages/cli/src/store/installation-state.ts` accept only a `supported-current` Store. Before P2, schema 6 was current. After P2, schema 6 is `supported-legacy`, so the preview returned `blocked` with no candidates, and setup review then dropped `checkoutMove`. `project move preview` said "The Store must use the current schema before checkout move."

### Fix

- One shared check, `checkoutBindingStore`, accepts a `supported-current` Store and a `supported-legacy` Store at schema 6 or later. It refuses every other state. A v7 Store whose write guard changed is `unknown` to the classifier, so it stays refused, and the next action names the guard problem. The reviewer found that a v7 Store with its guard triggers dropped and `user_version` set back to 6 passed as schema 6 and took a move. The new `inspectStoreVersionRollback` in `packages/cli/src/store/database.ts` closes this: a Store below schema 7 that has a guard trigger, a `project_register` table, or a schema journal row newer than its `user_version` is `changed-outside`. The classifier, the guarded Store open, and the backup check all use it, so such a Store is refused like a v7 Store with a changed guard (R-WRITE-GUARD-4). A Store at schema 5 or older stays blocked and says to run `make-docs setup` first.
- Preview reads a schema 6 Store on a read-only connection, as 2.0.9 did. It makes no durable write.
- Apply and separate registration change a schema 6 Store as it is and do not migrate it. They write `project_register` only when the Store has it (schema 7 and later). The schema is read inside the write transaction.
- The v7 write guard and its open check are unchanged.

### Decision

The brief for this fix asked that `project move apply` migrate the Store to v7 first. This fix does not do that, for three reasons:

- [PRD 38 R-CHECKOUT-8](../../prd/38-global-store-and-project-state.md) says apply never "migrates the Store schema", and R-CHECKOUT-9 asks for an existing supported Store. No other ordinary write migrates the Store. Only a reviewed `make-docs setup` runs the compatibility bridge (P2 decision above).
- The proof compares the `installation_operations` rows before and after the move. The v7 migration rebuilds that table with eight new columns, so a migrating apply would fail the proof.
- Setup review stops on a moved checkout before it offers the Store conversion, so a refusing apply would leave no way forward.

Schema 6 has every column that the move reads and writes, the same as 2.0.9. Schema 5 has the same installation tables, but 2.0.9 refused it too, so it stays blocked. No requirement text changed.

### Tests

- New `tests/w32-r0-p2-old-store-checkout-move.test.ts` (8 tests). Three of them set a v7 Store back to schema 6 with each rollback marker left in place (guard triggers, the `project_register` table, a newer journal row), and prove that the classifier says `changed-outside`, that preview is blocked, that apply throws, and that no row changes. It builds a real checkout with the current code and copies its installation rows into a raw schema 6 or schema 5 Store, as an older Make Docs left it. It proves that setup review, `project move preview`, and the shared core show the moved checkout as `ready` with no change to the Store bytes, rows, or files. It proves that `project move apply` completes on schema 6 with no schema change, adds one receipt, keeps ledger, operation, and step rows, and retries as `already-completed`. It proves that separate registration works on schema 6, and that a later reviewed setup bridge still converts the Store to v7 with an intact guard and the moved binding. It proves that an intact v7 Store records the project in `project_register`, and that a v7 Store with a dropped guard trigger and a schema 5 Store stay blocked and unchanged. Without the fix, 4 of the 5 tests fail.
- Two `tests/backlog-cache.test.ts` tests made a schema 5 Store by setting a v7 Store back to version 5 with its guard triggers still in place. The rollback check now refuses that Store, so they failed. Their fixture now also drops the guard triggers, `project_register`, and journal rows from schema 6 on, like a Store that Make Docs left at schema 5. They again prove that cache lookup and write never migrate the Store.
- No old 2.0.5 Store fixture exists in the tests, so the real 2.0.5 Store is proved only by the package proof.

### Validation

- `npx tsc --noEmit -p .` in `packages/cli`: passed.
- The new test and 15 Store, database, and checkout test files (`installation-state`, `p6-global-store-lifecycle`, `store-lifecycle`, `store-table-catalog`, `store-verification`, `store`, `w22-r0-p5-compatibility-bridge`, `w22-r0-p7-authentic-upgrade`, `w22-r0-p7-legacy-identity`, `w22-r1-ownership`, `w22-r2-portable-adoption`, `w32-r0-p2-schema-v7`, `w32-r0-p3-project-register`, `w32-r0-p3-recover-lock-doubt`, `w32-r0-p4-store-maintenance`): 302 passed, 0 failed, 1 skipped.
- The package proof, run directly against a packed candidate with its `project checkout-move` calls changed for this run only to `project move`: every check through the moves, the upgrades, and the repeat setup passes. It then fails at its last check, line 225. That check expects the released 2.0.5 reader to say "does not have verified installation evidence in the Store". After the candidate's setup upgrade, the Store is v7, so 2.0.5 refuses it earlier with "schema version 7 is newer than supported version 6". It still exits non-zero and changes nothing. No CLI change can bring back the old message, so the proof check needs an update (for example, also accept `newer schema`).
- `npm run smoke:pack:local`, on the builder base: failed before the package proof, because the retired `run` check still expected the old text. W33 R0 P4 then moved the proof to `project move` and changed that check to a typed `operation-error`.
- Integration on `docs/w29-w30-work-store-and-factory` after W33 R0 P4: moves now keep the Store at schema 6, so the proof runs the released 2.0.5 reader twice. Right after the moves, on schema 6, 2.0.5 refuses a copy at an unregistered path with "does not have verified installation evidence in the Store", as the original check meant. At the end, after the candidate setup made the Store v7, 2.0.5 refuses with the exact text `schema version 7 is newer than supported version 6`. Both runs exit non-zero and change no durable Store state. `npm run smoke:pack:local` then passed (local mode, 22.0s), including the full package proof.

### Limits

- W33 R0 P4 made the `project move` and smoke changes. The 2.0.5 reader message check changed with this fix, at integration.

## P5 Real Store Proof and Acceptance

Covers A19 to A24 in [P5](05-real-store-proof-and-acceptance.md). Evidence date: 2026-11-23. Branch: `t3/w32-r0-p5-real-store-proof`, from `docs/w29-w30-work-store-and-factory` at `c2498d55`. Node `v26.13.1`. CLI package version `2.0.9`, built with `npm run build`. No command opened the real Store. Every run used a duplicate of the read-only Store copy that the owner made, with `MAKE_DOCS_HOME` and `HOME` set to temporary folders. The read-only copy kept its SHA-256 (`66d7e4187df5`) through the phase. This report keeps counts, sizes, rule IDs, timings, and redacted examples only: `<project-1>` to `<project-3>` are the owner's projects, `<tmp-project>` is the temporary project that converted the copy, and `<store>` is the duplicate folder.

Units: sizes in this section use the CLI's own label. The CLI prints "MB" for MiB: 1 MB here is 1,048,576 bytes, so 39,780,352 bytes is 37.9 MB. Exact byte counts are given where they matter.

### Owner Decisions (2026-11-23)

1. P5 runs on a copy of the real Store. Done: one read-only copy, and nine duplicates of it, each deleted after use.
2. Rule 002 stays off. `FOLLOW-UP-P4-PACKAGE-MANAGER-IDLE` is built, and the owner kept the rule off: the catalog state is now `built-kept-off` (a new state) and the rule's activation reason names the decision. On the copy, rule 002 would remove nothing: `tool_operations` has 6 rows, all `completed`, and none is a pending `tool.update` or `tool.uninstall`. `setup store check` keeps reporting what the rule would do, so the owner can revisit it.
3. `setup store check` and `setup store clean` stay off the native agent command rule list. `make-docs setup store --help` and the Store README now say that people run them in a terminal and agents use the `setup_store_check` and `setup_store_clean` MCP tools.
4. `project list --target-root`: help text only. The help now says that the list always shows every project in the Store, and that `--target-root <path>` is the project folder whose harness access allows the Store read, does not filter the list, and defaults to the current folder. The registry usage string stays as in PRD 39.

### Drift Fixes (A19)

- `packages/cli/src/store/README.md` is rewritten against the code. It now names only callers, files, and paths that exist: `bootstrapGlobalStore` is called only by `make-docs update` (it said the install apply); the `projects` mirror functions, the Playbook run functions, and `pruneProjectFromStore` have no command caller (it said the apply flow and `setup remove` call them); `setup remove` keeps Store rows; identity lives in `.make-docs/config.yaml` `projectId` first; the inventory link is `docs/assets/project/migrated-operations-inventory.md`; the playbook-packaging seam it named does not exist. It names both backup kinds (`store.db.bridge-v<from>-to-v7-<uuid>.backup` and `backup/store-clean-<time>-<id>.db`, with the `.partial` name while clean writes it), the 18 tables of schema 7 with their 54 guard triggers, schemas 1 to 7, the real conversion path (setup preparation, one verified backup, one transaction per migration with its journal row), the write guard and its limit under R-WRITE-GUARD-6, the maintenance commands, the real locking pragmas (including `trusted_schema` and `synchronous = FULL` on the installation path), and the real recovery path: a corrupt Store is kept and refused, never quarantined and replaced. The privacy audit was rechecked: `skill-resolver.ts` still holds the only `fetch`.
- Code comments: `OpenStoreDatabaseResult.recovered` and `quarantinedPath` now say that they are always false and null today, and `quarantineDatabase` says that nothing calls it. `KNOWN_STORE_FILES` in `lifecycle.ts` no longer claims to be every file the Store writes.
- R-WRITE-GUARD-6 in status: `make-docs project state status` now returns `storeIntegrity.writeGuard` (`state` `intact`, and `limit` from the new `STORE_WRITE_GUARD_LIMIT`) and prints "Store write guard: on." with the limit. A guard problem never reaches status, because the guarded open refuses the Store as `store-unsafe` first.
- The repeated `store-unsafe` next action (P2 follow-up): `StoreAccessStateError` now removes a next action from the end of its reason when the reason already ends with it (`withoutRepeatedNextAction`), so the message and the `reason` field state it once. On the copy with a dropped trigger, "Do not write the Store." now appears once in the `project list` refusal (it appeared twice).
- The setup `nextAction` for a name refusal (P3 follow-up): setup now gives a `project-name-invalid` or `project-name-taken` refusal its own next action ("Choose another projectName in .make-docs/config.yaml, then run `make-docs setup` again."), the failed condition states the reason once, and `store.mutationState` is `none` (it said `applied` for a Store that needed no conversion). Reproduced before the fix on two temporary projects with the same `projectName`.
- Template-first rule: no shipped resource under `packages/docs/template/` changed, so no dogfood copy changed.

### Findings On The Copy That P5 Fixed

- A schema 6 Store gave `project list` the next action "Restore access to the configured Make Docs Store, then retry only this operation." That is wrong: the Store is reachable and only needs conversion. The installation state error now carries its next action, and `project list` on a schema 6 Store says "Run make-docs setup to review and apply the Store conversion, then run this command again." An absent Store says "Run make-docs setup in a project first."
- After any clean, `removeGlobalStore` (the Store removal of `make-docs uninstall --remove-store`) refused the whole Store, because `backup` is a project `.make-docs/` marker and clean makes `<store>/backup/`. Shown on a cleaned duplicate: status `refused`, nothing removed. Now a `backup/` folder next to `store.db` that holds only `store-clean-*.db` and `.store-clean-*.db.partial` files (and a file browser's `.DS_Store` or `Thumbs.db`) is the Store's own. Removal deletes the Store files and keeps the backups (fails closed). The result names them in a new `keptBackups` field. A `backup/` folder with any other file still refuses, now with "its backup folder has other files (...), so Make Docs cannot tell that it holds only Store backups" instead of "marks a project .make-docs/ directory".
- Reviewed scope of `make-docs uninstall --remove-store` (review fix, PRD 39 R-SELF-1, PRD 38 R-LIFE-1): before confirmation, the Store line now says "explicit removal selected; the Store database and its records will be deleted; Store backups stay in `<store>/backup/` and as store.db.bridge-*.backup files in `<store>`". It said "all stored history and recovery records will be deleted". After removal, when only backups remain, it says "Removed the Store. Kept N backup(s) at `<store>/backup/`. Delete them yourself if you no longer need them." It said "partially removed". It no longer prints "The global Store is preserved" when the Store is being removed; the line is now printed only without `--remove-store`. A test runs a real clean, then `runToolUninstallCommand` with `removeStore: true`, and checks all three texts.
- Rows inside the 30-day window (owner wording request, confirmed in the Guided Progress Review on 2026-11-23): `setup store check` and `setup store clean` now say how many rows of rules 003, 004, and 005 wait for the window and the first day one can go, for example "Clean would remove nothing. 38 rows wait for the 30-day window; the first can go on 2026-12-14." The check JSON has a new `waiting` field (`rows`, `retentionDays`, `firstDate`). The count uses the same rules and proofs with every finished operation treated as old enough, minus the rows that act now, so it reads only. With nothing else to review, the next action is "Run make-docs setup store check again on or after <date>." Tested on a fixture before, inside, and after the window.
- The clean dry run printed its summary twice ("Store clean: Dry run. ..." and "Store check: ..."), the Store line twice, and "Next: Review each item above and use its next step." twice. A dry run and a clean with nothing to remove now state each once.

### Copy Run (A20)

Store copy: schema 6 from Make Docs 2.0.9, 37,003,264 bytes, 9,034 pages of 4,096 bytes (121 free), `quick_check` ok, 17 tables, 0 triggers, `auto_vacuum` 0. Rows: 3 checkouts, 3 ledgers, 9 installation operations (all `completed`), 321 steps, 44 migration records, 6 tool operations, 4 schema journal rows, and 0 rows in every other table. `installation_migration_records` used 27.1 MB of the file, `installation_steps` 3.8 MB, and `installation_operations` 3.1 MB.

1. Before conversion, on schema 6: `project list` and `setup store check` (text and `--json`) refuse with `store-unavailable` and change nothing (same SHA-256). Check says "uses schema 6. Store maintenance needs schema 7. Nothing was changed." and "Run make-docs setup to convert the Store".
2. Conversion: `make-docs setup --target <tmp-project> --dry-run --no-codex --no-claude-code --no-github-copilot --no-skills` showed `store.disposition: convert`, `sourceSchemaVersion: 6`, `targetSchemaVersion: 7`, and one change: "Create and verify one Store backup before converting schema 6 to schema 7." The same command with `--yes` and no other prompt or flag applied it in 0.5 s. Receipt: the setup result (`status: complete`, `store.mutationState: applied`), the schema journal row 7 ("W32 R0 P2 project register, failed operations, receipt columns, and write guard"), and the verified backup `store.db.bridge-v6-to-v7-<uuid>.backup` (36,507,648 bytes, mode `0600`). Store preparation writes no `store_migration_receipts` row; that table stayed empty, as designed. After conversion: `user_version` 7, 18 tables, 54 triggers, `quick_check` ok, `store.db` mode `0600`, 39,780,352 bytes (9,712 pages, 758 free). The setup of `<tmp-project>` added 1 checkout, 1 ledger, 1 operation, 2 steps, 1 migration record, and 1 `project_register` row.
3. `project list` (text and `--json`): "The Store knows 4 projects with 4 checkouts. 1 checkout folder is missing." Three owner projects show "Last seen: not recorded yet" (the v7 register starts empty, a P3 decision), and `<tmp-project>` shows its time. No project has a name.
4. `setup store check` (text and `--json`, real clock): "Clean would remove nothing. 1 item needs your decision. No crash leftover blocks this computer. Nothing was changed." Guard intact, no broken reference, no unguarded table, no unclassified record. The decision is STORE-DECISION-001 for `<project-1>`, whose folder is gone. Check took 0.11 s and changed no byte. After the review fix, a re-run on a fresh duplicate says "Clean would remove nothing. 38 rows wait for the 30-day window; the first can go on 2026-12-14. 1 item needs your decision. ..." (37 owner rows and 1 `<tmp-project>` row; the oldest operation finished on 2026-11-14).
5. `setup store clean --dry-run`, then `setup store clean` without `--yes` (refused: "Clean changes the Store, so it needs one confirmation. Nothing was changed."), then `setup store clean --yes`: "Clean removed nothing: no fixed rule proves a row now. No backup was made, and the Store did not change." The SHA-256 stayed the same. After the review fix, the same clean says "Clean removed nothing: no fixed rule proves a row now. 38 rows wait for the 30-day window; the first can go on 2026-12-14. No backup was made, and the Store did not change."

Why nothing today: rules 003, 004, and 005 wait 30 days after an operation finishes, and the newest real operation finished on 2026-11-23. With the clock moved (harness, same `checkStore` code), 2026-12-15 gives 2 rows (rule 004, 658,806 bytes), and 2026-12-23T06:00Z gives 37 rows and 35,243,794 bytes from the owner's data alone. On 2026-12-24 the `<tmp-project>` operation joins (1 more rule 004 row).

Clean with the clock at 2026-12-24T12:00:00Z (three runs, each on a fresh duplicate; see [PERF-005](#run-of-perf-005-a22)):

| Rule | Rows changed | Row data |
| --- | --- | --- |
| STORE-RULE-003 saved file contents | 13 `installation_steps` rows trimmed (`contentBase64` removed) | 3,765,909 bytes |
| STORE-RULE-004 full ledgers | 10 `installation_operations` rows trimmed (ledgers set to NULL, receipt columns kept) | 3,301,934 bytes |
| STORE-RULE-005 plans and write intents | 15 `installation_migration_records` rows removed (13 atomic write intents and 2 detached plans of one `setup.skills.adopt` operation) | 28,245,075 bytes |
| Rules 001, 006, 007, 008, 009 | 0 | 0 |
| Rule 002 (off) | 0, and 0 candidates | 0 |

| Table | Rows before | Rows after | Bytes before (`dbstat`) | Bytes after |
| --- | --- | --- | --- | --- |
| `installation_migration_records` | 45 | 30 | 28,446,720 | 172,032 |
| `installation_operations` | 10 | 10 | 3,321,856 | 4,096 |
| `installation_steps` | 323 | 323 | 3,952,640 | 176,128 |
| `installation_ledgers` | 4 | 4 | 679,936 | 679,936 |
| Every other table | unchanged | unchanged | unchanged | unchanged |

File: 39,780,352 bytes (9,712 pages, 758 free) before, 1,298,432 bytes (317 pages, 0 free) after; 38,481,920 bytes and 9,395 pages freed. Backup: one `backup/store-clean-20261224T120000000Z-<id>.db`, 36,675,584 bytes, mode `0600`, `quick_check` ok, schema 7, 54 triggers; kept count 1, none rotated. The STORE-DECISION-001 item stayed. Restore by the printed steps on one cleaned duplicate (copy the backup over `store.db`, delete `-wal` and `-shm`): `setup store check` then read schema 7, guard intact, 45 migration records, and the full ledgers again.

Largest `work_evidence` payload (P2 follow-up): the copy has 0 `work_evidence` rows, so the largest payload is 0 bytes, under the 65,536-byte limit. The limit was not reached by real data.

### Guard On The Copy (A21)

On the converted duplicate, the macOS `sqlite3` 3.54.0 shell ran `UPDATE store_schema_journal ...`, `INSERT INTO installation_locks ...`, and `DELETE FROM tool_operations`. Each failed with "no such function: make_docs_write_guard", the row counts stayed, and the `store.db` SHA-256 stayed the same. Then `DROP TRIGGER make_docs_guard_installation_locks_delete` (DDL needs no function) left 53 triggers. After that:

- `project list`, `project state status`, and `setup store clean --yes` each stop with `store-unsafe`: "The Store was changed outside Make Docs: Table installation_locks has no BEFORE DELETE guard trigger. No project files changed." and the next action "Do not write the Store. Run make-docs setup store check to review it. The newest Store backup is `<store>/store.db.bridge-v6-to-v7-<uuid>.backup`."
- `setup store check` reads it read only: "The Store was changed outside Make Docs." in the summary, a note "Check read it without writing. Clean refuses until the Store is restored from a backup or repaired.", `guardIntact: false`, the missing trigger, and "Next: Do not write the Store. Restore the newest Store backup or repair the Store, then run make-docs setup store check again."
- The `store.db` SHA-256 was the same before and after these commands.

### Run Of PERF-005 (A22)

The run binds the [PERF-005 profile](05-real-store-proof-and-acceptance.md#perf-005-store-clean-with-vacuum-on-a-real-store-copy), version `1`, digest `sha256:877be6157fb09ab6958a55dec732050f36ebfaccf3169335f7a610dac52b7774` (SHA-256 of the profile text from its heading to the end of the profile, with the digest field as `{{DIGEST}}`). Budget event `W32-R0-P5-PERF-005-1`: three runs, each on a fresh duplicate, converted by `make-docs setup --yes`, then the [harness](evidence/p5/performance/perf-005-harness.mjs) runs the shipped `checkStore` and `cleanStore` once with the clock at 2026-12-24T12:00:00Z. Redacted raw results: [perf-005-results.json](evidence/p5/performance/perf-005-results.json).

| Run | Setup conversion | Check | Clean (total) | `VACUUM INTO` backup | `VACUUM` | WAL checkpoint | File before | File after |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0.51 s | 45 ms | 166 ms | 57 ms | 4 ms | 3 ms | 39,780,352 B | 1,298,432 B |
| 2 | 0.50 s | 51 ms | 176 ms | 59 ms | 4 ms | 2 ms | 39,780,352 B | 1,298,432 B |
| 3 | 0.49 s | 45 ms | 164 ms | 58 ms | 4 ms | 2 ms | 39,780,352 B | 1,298,432 B |

Median clean 166 ms (range 164 to 176 ms). Every run changed the same 38 rows, freed 9,395 pages, and verified its backup. Outcome `pass` within its scope. Stopped after three runs, with no failure.

Vacuum decision: keep the `VACUUM` in `clean`. The Store has `auto_vacuum` 0, so without the vacuum the 9,395 freed pages stay in the file and it keeps its 37.9 MB. With it, the file shrinks by 96.7 percent, and the vacuum and the checkpoint add about 7 ms. The backup `VACUUM INTO` is the largest step (about 58 ms) and is required for safety. This is informational: three runs on one machine, with a warm cache, and no speed promise.

### Validation (A23)

- `npx tsc --noEmit -p .` in `packages/cli`: passed.
- New `tests/w32-r0-p5-store-wording.test.ts` (12 tests after the review fixes): a repeated next action is stated once; a dropped guard trigger gives one "Do not write the Store." in the `project list` refusal; a schema 6 Store names `make-docs setup`; a setup name refusal has its own next action and `store.mutationState: none`; status states the guard limit in JSON and text; the clean dry run states its summary, Store line, and next action once; Store removal keeps a clean backup folder (also with `.DS_Store` and `Thumbs.db`), names the kept backups, and refuses a `backup/` folder with other files with the plain "other files" reason; `uninstall --remove-store` after a real clean names the kept backup folder before confirmation, says "Removed the Store. Kept 1 backup at ..." after, and prints no "preserved" line; check and clean say how many rows wait for the 30-day window and the first date, before, inside, and after the window, and name the next check date when nothing else needs review; and the help explains `--target-root` and who runs the Store commands.
- `tests/store-table-catalog.test.ts`: the rule 002 follow-up state is `built-kept-off`.
- After the review fixes, full suite after `npm run build`, counted from `npx vitest run --reporter=json`: 2573 passed, 3 failed, 6 skipped (2582 tests in 136 files). The 3 failures are the known ones: 2 in `tests/mcp-app-contract.test.ts` and fixture 11 in `tests/p5-migration-safety.test.ts` (sandbox only). The Store and uninstall test files all pass: `w32-r0-p5-store-wording` 12, `w32-r0-p4-store-maintenance` 54, `store-table-catalog` 36, `p6-global-store-lifecycle` 20, `self-management` 17, `w19-r3-tool-state` 15, `store-lifecycle` 13, and `store-verification` 6. Type check, build, `validate:defaults` (53 passed), the router check, `project paths validate` (valid, 0 findings), and `project doctor check` (no problems) pass again. `check performance-evidence` still fails only on the 17 known W23 errors; `PERF-005` has none.
- First review round, full suite after `npm run build`, counted from `npx vitest run --reporter=json`: 2570 passed, 3 failed, 6 skipped (2579 tests in 136 files). The 3 failures exist without this change: 2 in `tests/mcp-app-contract.test.ts` and fixture 11 in `tests/p5-migration-safety.test.ts`, which fails only in the sandbox. The `w19-r5-skills-command` and `cli.test.ts` timeout failures did not occur in this run. A first full run found 3 tests that matched the old schema 6 text ("Run make-docs setup to review and apply the compatibility bridge"): `setup-system.ts` chose its next action by that text. It now keys on the shared `STORE_LEGACY_SCHEMA_NEXT_ACTION`, and the 3 tests pass. The same run caught the catalog test while its file was being edited; it passes now.
- `node packages/cli/dist/index.js project paths validate` (temporary `MAKE_DOCS_HOME`): valid, 1,104 files, 0 findings. `project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption`: no problems in 379 files. `npm run validate:defaults -w packages/cli`: 53 passed. `bash scripts/check-instruction-routers.sh`: passed. `make-docs check performance-evidence`: `failed` globally with the 17 known errors in the unchanged W23 work and evidence; `PERF-005` has no error, and the only W32 warning is the older P1 line 100 (`PERF-VAL-014`). Catalog digest after the rule 002 change: `sha256:1436ae952940aca10eea21deea8ec866445fea019788695257c6969c2835481c`.

### Human Experience Review (A23)

Each promise of the [index](00-index.md#human-experience-trace), checked against the copy run:

| Promise | Evidence on the copy | Result | Open item |
| --- | --- | --- | --- |
| `project list` shows every project, its name, ID, checkouts, and any missing folder. | 4 projects, 4 checkouts, one missing folder named in plain words; no name is set, so each shows "(no project name)"; three show "Last seen: not recorded yet. The next Make Docs write for this project records it." | Met. | None. |
| `setup store check` explains what is safe to remove, what needs a decision, and the space a clean frees, and changes nothing. | Summary line first, each rule, the one decision with its next step; no byte changed. With the clock 31 days later: "Clean would remove or trim 38 rows (about 33.7 MB) under 3 rules." | Met. After the review fix, "would remove nothing" also says that 38 rows wait for the 30-day window and that the first can go on 2026-12-14. One wording limit stays: rows are named by raw keys (for example an operation ID and a step number). | FOLLOW-UP-P5-ROW-KEYS. |
| `setup store clean` removes only proven rows, after a backup, and reports what it removed and how to restore. | Same 38 rows as check planned; verified backup; "Space: 37.9 MB before, 1.2 MB after, 36.7 MB freed."; numbered restore steps; restore proved on a duplicate. Nothing to remove gives no backup and no change. | Met. | None. |
| A program that is not Make Docs cannot change the Store by accident, and Make Docs says so if the guard is removed. | `sqlite3` writes fail and change nothing; a dropped trigger gives `store-unsafe` with one next action; check reads the changed Store; status states the limit. | Met. | None. |
| A crash never leaves a lock or a pending row that blocks the machine forever. | The copy has no lock, no pending operation, and no pending tool operation: "No crash leftover blocks this computer." Fixture proof stays in P4. | Met on the copy; the crash cases are proved on fixtures only. | None. |

### Follow-Ups

These stay open after P5. None blocks the Wave. The owner chose to track the first two (option A, 2026-11-23).

- FOLLOW-UP-P5-TEXT-REFUSAL-JSON: a refusal of a command run in text mode prints the raw JSON error (for example `project list` on a schema 6 Store, or `setup store clean` without `--yes`). Every CLI operation error prints this way today, not only Store commands, so the fix belongs to the shared CLI error output.
- FOLLOW-UP-P5-ROW-KEYS: check and clean name each row by its raw key (for example `<op-adopt>|9` or `<checkout>|backup|atomic:<op-adopt>:10`). A person cannot tell what the row is. A plain label (operation kind, file, date) would help.
- FOLLOW-UP-P5-MB-LABEL: `formatBytes` in `packages/cli/src/store/maintenance.ts` divides by 1,048,576 and prints "MB". Either print "MiB" or divide by 1,000,000. P5 keeps the label and states the unit in this report.

### Guided Progress Review

Passed on 2026-11-23. The owner reviewed the redacted output below (`project list`, `setup store check`, `setup store clean`, and `uninstall --remove-store`) and chose option A: accept the output, fix the 30-day wording now, and track the other two wording points (raw JSON on text-mode refusals, rows named by raw keys) as follow-ups. The 30-day wording is done in P5 (see Findings On The Copy That P5 Fixed). The W32 index is `completed`.

### Owner Sample For The Guided Progress Review

Real output on a duplicate of the owner's Store, redacted. `<project-1>` has a missing folder.

```text
$ make-docs project list
The Store knows 4 projects with 4 checkouts. 1 checkout folder is missing.

(no project name)
  Project ID: <id-1>
  Last seen: not recorded yet. The next Make Docs write for this project records it.
  Checkout:
    <project-1>
      The folder is missing. It was moved or deleted.

(no project name)
  Project ID: <id-tmp>
  Last seen: 2026-11-23T12:07:59.314Z
  Checkout:
    <tmp-project>

(no project name)
  Project ID: <id-2>
  Last seen: not recorded yet. The next Make Docs write for this project records it.
  Checkout:
    <project-2>

(no project name)
  Project ID: <id-3>
  Last seen: not recorded yet. The next Make Docs write for this project records it.
  Checkout:
    <project-3>
```

```text
$ make-docs setup store check
Store check: Clean would remove nothing. 38 rows wait for the 30-day window; the first can go on 2026-12-14. 1 item needs your decision. No crash leftover blocks this computer. Nothing was changed.
Store: <store>/store.db (schema 7, 37.9 MB).

Fixed rules:
  STORE-RULE-001 Dead-owner lock with no pending operation: would remove nothing.
  STORE-RULE-002 Abandoned tool update or uninstall (not on yet): would remove nothing.
  STORE-RULE-003 Saved file contents of a terminal operation: would remove nothing.
  STORE-RULE-004 Full ledgers of a terminal operation: would remove nothing.
  STORE-RULE-005 Detached plan snapshots and atomic write intents of a terminal operation: would remove nothing.
  STORE-RULE-006 Quiescence barrier whose lock is gone (not on yet): would remove nothing.
  STORE-RULE-007 Checkpoint journal row with a migration receipt: would remove nothing.
  STORE-RULE-008 Backlog review cache rows for old versions: would remove nothing.
  STORE-RULE-009 Harness receipt history beyond the kept count: would remove nothing.

Needs your decision (never removed by a rule):
  STORE-DECISION-001 Checkout folder is missing: The folder <project-1> for project <id-1> no longer exists. Make Docs keeps its Store rows, including 0 unfinished changes and 0 cached review results, because the folder may have moved or may be on a drive that is not connected.
    Next: If the project moved, run `make-docs setup` in the new folder to move the checkout. If the folder is gone for good, a later reviewed removal can clear its rows.

Next: Review each item above and use its next step.
```

The same check with the clock 31 days later (shortened; each `Remove:` line names a row key):

```text
Store check: Clean would remove or trim 38 rows (about 33.7 MB) under 3 rules. 1 item needs your decision. No crash leftover blocks this computer. Nothing was changed.
Store: <store>/store.db (schema 7, 37.9 MB).

Fixed rules:
  STORE-RULE-003 Saved file contents of a terminal operation: would remove or trim 13 rows (about 3.6 MB).
    Remove: <op-adopt>|9 (After STORE-RULE-005 removes this operation's plan and write intents in the same clean.)
    ...
  STORE-RULE-004 Full ledgers of a terminal operation: would remove or trim 10 rows (about 3.1 MB).
    Remove: <op-1>
    ...
  STORE-RULE-005 Detached plan snapshots and atomic write intents of a terminal operation: would remove or trim 15 rows (about 26.9 MB).
    Remove: <checkout>|backup|atomic:<op-adopt>:10
    ...

Next: Run make-docs setup store clean to back up the Store and remove these rows.
```

```text
$ make-docs setup store clean --yes        (clock 31 days later)
Store clean: Clean removed or trimmed 38 rows (about 33.7 MB of row data) under 3 rules. The Store file shrank by 36.7 MB. The backup is <store>/backup/store-clean-20261224T120000000Z-<id>.db.
Store: <store>/store.db.

Each rule:
  STORE-RULE-003 Saved file contents of a terminal operation: 13 rows (about 3.6 MB).
  STORE-RULE-004 Full ledgers of a terminal operation: 10 rows (about 3.1 MB).
  STORE-RULE-005 Detached plan snapshots and atomic write intents of a terminal operation: 15 rows (about 26.9 MB).
  (the six other rules: 0 rows)

Space: 37.9 MB before, 1.2 MB after, 36.7 MB freed.
Backup: <store>/backup/store-clean-20261224T120000000Z-<id>.db

To restore this backup:
  1. Stop every Make Docs command and MCP server on this computer.
  2. Copy <store>/backup/store-clean-20261224T120000000Z-<id>.db over <store>/store.db.
  3. Delete <store>/store.db-wal and <store>/store.db-shm if they exist.
  4. Run make-docs project state status in a project to check the Store.

Next: Run make-docs setup store check to review the items that need your decision.
```

Today, `make-docs setup store clean --yes` on the same Store prints "Store clean: Clean removed nothing: no fixed rule proves a row now. 38 rows wait for the 30-day window; the first can go on 2026-12-14. No backup was made, and the Store did not change." followed by the same rule and decision lists as check.

Real output of `runToolUninstallCommand` with `removeStore: true` and a package-runner (no binary) detection, on a converted duplicate right after a clean (clock 31 days ahead):

```text
make-docs uninstall removes the installed binary:
- global Store: <store> (explicit removal selected; the Store database and its records will be deleted; Store backups stay in <store>/backup/ and as store.db.bridge-*.backup files in <store>)
- installed binary: none detected (remote execution via a package runner; nothing persistent to remove)
Repository content is never touched; to remove make-docs from a project, use `make-docs setup remove`.
Removed the Store. Kept 2 backups at <store>/backup/ and <store>/. Delete them yourself if you no longer need them.
No persistent make-docs binary is installed: this invocation uses a package runner. The Store remains available unless explicit removal was selected.
```

Afterwards the folder held only `backup/store-clean-20261224T120000000Z-<id>.db` and `store.db.bridge-v6-to-v7-<uuid>.backup`. The last line comes from the package-runner branch and still says "The Store remains available unless explicit removal was selected."; it is true but reads oddly after a removal. P5 leaves it, because W33 R0 P5 is changing the uninstall text at the same time.

### Limits

- The real Store itself was never read or cleaned. A real clean needs separate owner approval.
- The clean numbers use a clock moved 31 days ahead through the harness, because the copy's newest operations are inside the 30-day retention window. The CLI has no clock option.
- The copy has no crash leftover, no lock, no `work_evidence`, no lifecycle run, and no backlog cache, so rules 001, 007, 008, and 009 and the crash leftovers were not exercised on real data.
- `PERF-005` covers one Store copy on one macOS machine.
- The owner's Guided Progress Review passed on 2026-11-23 (option A). A real `setup store clean` of the owner's Store, after about 2026-12-23 when the first operations leave the 30-day window, needs separate owner approval.
- The CLI prints MiB as "MB" (FOLLOW-UP-P5-MB-LABEL).
