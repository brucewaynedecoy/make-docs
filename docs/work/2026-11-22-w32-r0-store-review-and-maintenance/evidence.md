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
