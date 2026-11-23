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
