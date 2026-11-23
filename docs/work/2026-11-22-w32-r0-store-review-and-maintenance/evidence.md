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
