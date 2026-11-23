---
title: "W29 R0 Evidence Report"
kind: "work"
status: "active"
coordinate: "W29 R0"
---

# W29 R0 Evidence Report

This report explains the acceptance evidence for the [W29 R0 backlog](00-index.md). Each section names the acceptance cases it covers, what was run, what it showed, and its limits.

## P1 Record Model and Rule Catalog

Covers A1 to A4 in [P1](01-record-model-and-rule-catalog.md). Evidence date: 2026-11-22. Branch: `docs/w29-w30-work-store-and-factory`. Node `v26.13.1`. CLI package version `2.0.9`.

### What Was Built

- `packages/cli/src/operations/work/work-store/schemas.ts` holds the zod contract: unit records for six kinds with a store ID, coordinate, parent, recorded status, status, close outcome, dependencies, unresolved dependency text, gates, blockers, links, source path, and repo copy state; claim records with the takeover handle observation; the per-checkout sync ledger and conflict records; settle, claim, release, report, close, and add requests; the tracker connection; and the `work` config block. Task coordinates use an upper-case `T`.
- `packages/cli/src/operations/work/work-store/project-uri.ts` holds the project URI grammar and the project name form. Every project URI names its project by name or project ID. Nothing in it reads the current folder or the Store.
- `packages/cli/src/operations/work/work-store/catalog.ts` holds the rule catalog `make-docs.work-store-rules.v1`: 39 rules (`WORK-RULE-001` to `WORK-RULE-039`), nine `run work` operations, the sync table, the settle choices for each conflict kind, the wait reason wording, the claim policy, the dependency bullet patterns, the ready order, the recorded status map, the local tracker connection, the field register, and a stable digest.
- `packages/cli/tests/fixtures/work-store-contract.ts` holds 55 fixtures (`WSF-001` to `WSF-055`) in eleven groups.
- No Store table, parser, or operation exists yet. P2 to P4 build them on this contract.

### Catalog and Parity Fixtures (A1, A2, A4)

- Every rule names its PRD 52 requirements, its CLI form, its agent form section in `make-docs://system/reference/work-store.md`, and a plain meaning. The test checks that each cited requirement exists in PRD 52 as a `(MUST` bullet and that each CLI form is a catalog operation or `resource.read`.
- Every rule has at least one fixture, and every fixture names the rules it proves and its expected result. The test checks each fixture kind against the contract. Sync fixtures are checked row by row against the sync table.
- The sync table gives exactly one decision for every file state, store state, and copy setting. It never writes or removes a changed or new file, it treats lost store work as a conflict, and an accepted deletion stays settled in every checkout.
- Each wait reason has a sentence and one next action, so a reader can see from the catalog alone why an open unit waits (A2).

### Field Register (A3)

`WORK_STORE_FIELD_REGISTER` ties every field of the unit, ledger, conflict, claim, and config schemas to a phrase in its PRD 38 R-MIN row. The test fails when a schema field has no register entry or when the row lacks the phrase. The PRD 38 rows now name the project ID, checkout ID, recorded status, gates, blockers, source path, repo copy state, claim ID, claim time, takeover observation, and the quick item backup limit.

### Owner Decisions During P1

- Quick items live only in the work store, and `run work add` adds them. This adds the ninth operation. A quick item has a plain number, such as `7`, read as `make-docs://project/<project>/tasks/7` and written as `task 7` in human text. See register D-061.
- Project URIs always name the project: `make-docs://project/<project>/tasks/` and `make-docs://project/<project>/backlog/W29/R0/P1/T3`. A first draft took the project from the current folder. The owner rejected that, because a URI is an interface to a Store and server that many agents use for many projects.
- A project has a short `projectName` in config, and the Store records it (PRD 38 R-ID-8).
- Task IDs use an upper-case `T`. The P1 contract uses `T` now. The rest of the change is its own Wave, before W29 P3, with a doctor check (register D-063).
- A Store check found an empty legacy `projects` table, no command that lists the projects that the Store knows, and a stale path for a moved checkout. The owner asked for a full review of the Store tables, columns, row events, and data maintenance. Register D-062 holds it.
- The backlog `## Change History` records these scope changes. It also corrects A8, which let a plain claim take a unit with an expired claim.
- The PRD 52 claim, report, close, readiness, and dependency grammar rules were tightened to match the catalog. PRD 17, 21, 25, 38, 39, 53, and 04 were updated to match.

### Independent Reviews

Two independent reviews read the contract against PRD 52.

- The first review found four high and six medium findings: no record of an accepted deletion, no conflict for lost store work, no project or checkout scope, missing stage parents, an incomplete dependency grammar, loose claim checks, wait reasons without next actions, unclear order and edge cases, unhandled draft and unknown statuses, and open tracker limits. All were fixed.
- The second review confirmed six fixes, found four partly fixed, and found three new high and three new medium findings: missing `Phase`, `None`, and `parallel` bullet forms and conditions as gates; no update path for an unclaimed or stuck unit; expired claims that a plain claim could take; no state for a file that never existed; one settle verb for every conflict kind; and accepted deletions that other checkouts did not see. All were fixed, with the low findings.

### Checks

- `npx vitest run tests/work-store-contract.test.ts`: 23 tests pass.
- `npx tsc --noEmit -p packages/cli`: no errors.
- `make-docs run prd authority validate --target-root .`: no diagnostics.
- `make-docs project path-hygiene validate`: `valid: true`.
- `packages/cli/tests/consistency.test.ts` pins the open-question list in PRD 03, so it now includes `Q-026`.

### Full Test Suite

`npx vitest run` in `packages/cli`: 121 test files, 117 passed, 3 failed, and 1 skipped. Of 2,103 tests, 4 failed and 6 were skipped. All four failures exist without this phase:

- `mcp-app-contract` (two tests) and `w19-r5-skills-command` (one test) fail on Node v26 because a deprecation warning reaches stderr.
- `p5-migration-safety` fixture 11 fails only inside the sandbox.

### Limits

- The agent form in `work-store.md` does not exist until P5. The catalog names its sections now.
- The fixtures state expected results. P3 and P4 run real code against them.

## P2 Store Schema and Records

Covers A5 to A9 and A33 in [P2](02-store-schema-and-records.md). Evidence date: 2026-11-23. Branch: `docs/w29-w30-work-store-and-factory`. Node `v26.13.1`. CLI package version `2.0.9`.

### What Was Built

- `packages/cli/src/store/work-store-schema.ts` holds the six schema v8 tables and `WORK_STORE_COLUMN_REGISTER`, which ties each physical column to its field phrase in a PRD 38 R-MIN row.
- `STORE_MIGRATIONS` in `packages/cli/src/store/database.ts` has a v8 entry: the six tables, their indexes, the journal row for schema 8, and the three write guard triggers of each new table. `CURRENT_STORE_SCHEMA_VERSION` is 8. The migration runs through the existing reviewed path: one verified backup (`store.db.bridge-v7-to-v8-<uuid>.backup`), then one `BEGIN IMMEDIATE` transaction with the `user_version` bump.
- `packages/cli/src/store/work-store.ts` is the Store service: units with their dependencies and links, quick item numbers, claims, the sync ledger, and sync conflicts. `readWorkStore` and `writeWorkStore` never create or migrate a Store. `writeWorkStore` records the project's `project_register` row in the same transaction.
- No public operation was added. The `work` operations in P4 call the service.

### Tables and Catalog Classes

| Table | Record class | Maintenance class | Reason |
| --- | --- | --- | --- |
| `work_units` | Store-canonical and non-rebuildable | keep | Current work authority. A quick item has no repo copy, so its row is its only record. |
| `work_dependencies` | Store-canonical and non-rebuildable | keep | Part of the unit record; the deferred foreign key keeps every dependency inside the same project. |
| `work_links` | Store-canonical and non-rebuildable | keep | Part of the unit record (R-WORK-STORE-5). |
| `work_claims` | Short-lived mutation guard | bounded | At most one row for each unit, enforced by `UNIQUE (unit_store_id)`. Release, close, and takeover delete or replace it. No fixed rule removes an expired claim, because an expired claim holds its unit until a takeover after a handle check or a release (R-WORK-QUEUE-4, R-WORK-QUEUE-7). |
| `work_sync_ledger` | Store-canonical and non-rebuildable | keep | Minimum last-applied state, like `installation_ledgers`. A lost row makes sync stop the file as a conflict, so maintenance never removes it. Its writer removes it after a verified copy removal, and a removed checkout takes its rows with it. |
| `work_sync_conflicts` | Store-cached and rebuildable | bounded | At most one row for each file in each checkout (primary key). Settle deletes it, and the next sync rebuilds it. |

Units, dependencies, and links share the R-MIN row "Work store records (schema v8)". R-MIN-2 lets a physical schema group fields differently, so `STORE_SHARED_RMIN_ROWS` in `table-catalog.ts` names each row that several tables may share, with the only tables that may share it. Today it names only this row and these three tables. The drift check accepts a shared row only when the list names it, every claim comes from a named table, and every claim gives the same class. Any other row claimed by two catalog entries is drift.

### Migration and Safety (A5, A6)

- A fresh Store reaches schema 8 with journal rows 3 to 8 and 72 guard triggers on 24 tables.
- A v7 Store moves to v8 after one verified backup that still reads as schema 7, and every row stays.
- When one v8 statement fails, the whole migration rolls back. The Store stays at schema 7 with no work table and no journal row 8, and classification still reads it as a usable v7 Store.
- A Store at schema 9 is refused before any write, and its bytes stay the same.
- `inspectStoreVersionRollback` now checks every schema older than the current one. A v8 Store set back to schema 7 is `changed-outside`, because it has the work store tables and a journal row from schema 8. A new `inspectStoreGuardAndVersion` runs the guard check and the rollback check together, and every Store open path uses it.
- A connection that Make Docs did not open cannot write a work table, and a dropped work table trigger makes the Store `changed-outside`.
- Through the operation boundary, the service gives the existing typed results: an absent Store and a v7 Store give `store-unavailable` with one next action, a changed Store and a schema 9 Store give `store-unsafe`, and a `store-denied` result from the harness policy passes through unchanged. `scopeStoreAccessFailure` in `registry.ts` is now exported so the test can use the real mapping.

### Every v7 to v8 Touch Point

- `database.ts`: `CURRENT_STORE_SCHEMA_VERSION`, the v8 migration, `VERSION_EIGHT_TABLES` in the expected table lists, the classification types (`supported-current` is 8 and `supported-legacy` is 1 to 7), `inspectStoreVersionRollback`, the new `inspectStoreGuardAndVersion` in the classifier, the shared open path, `openStoreForReview`, and backup verification.
- `compatibility-bridge.ts`: the setup review lists `w29-r0-p2-store-schema-v8` as a conversion for a Store older than 8.
- `installation-state.ts`: checkout move review, checkout move, and separate checkout registration use a schema 6 or 7 Store as it is (comment only; the schema 6 floor already covers 7).
- `maintenance.ts`: the legacy refusal names the current schema instead of 7.
- `table-catalog.ts`: the physical schema version is 8, six new table entries, the four work rows leave the list of rows outside the tables, and the shared-row drift rule.
- `scripts/w22-r1-package-proof.mjs`: released 2.0.5 now refuses with "schema version 8 is newer than supported version 6".
- Readers that need the current schema keep refusing an older one, as they refused schema 6 before: the backlog review cache, `project list`, Store maintenance, and the installation manifest read. Checkout move keeps reading schema 6 and 7.
- `setup store check` JSON reports the schema version that it reads, so it needed no change.

### Store Service (T5 to T9, A7, A8, A33)

- Every write carries an expected version. Units and claims use the unit's record revision. The sync ledger and sync conflicts use a new entry version, which the PRD 38 R-MIN rows now name. A wrong version is refused with `WorkStoreRefusalError` (`version-conflict`), and nothing changes.
- `putWorkUnit` checks the parent kind and project, replaces the dependency and link lists in the same write, and removes the claim of a unit that closes. Dependencies are checked at commit, so one transaction can write units in any order, and a dependency on a unit that never arrives rolls the whole write back.
- Quick items get the next plain number of their project. A closed quick item keeps its number, so a number is never used twice.
- A second claim row for one unit fails with `UNIQUE constraint failed: work_claims.unit_store_id` (A7). A claim row whose times are out of order fails its `CHECK`.
- A plain claim on an expired claim is refused with `takeover-needs-handle-check`, also for the claimant whose claim expired. A takeover that names the expired claim and a stopped, finished, or not-found handle succeeds and records what the check saw. A running handle is refused, and an old claim with no task handle is refused, so a person releases it (A8).
- The P1 claim fixtures WSF-014, WSF-016 to WSF-021, and WSF-044 give the P1 answer from the Store service. WSF-015 expects `not-ready`, which is the readiness rule of the work queue in P4.
- Projects resolve by name or ID only through `project_register`. After a rename, the old name resolves to nothing and the new name resolves to the same project and its units. Only `project_register` has a project name column (A33).

### R-MIN Parity (T8, A9)

`workStoreSchemaDrift` reads the physical work tables and the four PRD 38 R-MIN rows. The test passes on the current schema and PRD 38. It fails when a column is removed from the schema, when a column is added without a register entry, when a field is removed from an R-MIN row, and when the column register loses a column. A second test checks that every P1 field register phrase has a physical column.

### Owner Decisions and Open Items

- Open P4 item ([P4](04-work-queue-operations.md) T14), not active: a report-only decision item for work claims that expired more than a set number of days ago, for example 7, so a person can release them. A fixed rule that deletes expired claims is not proposed, because it would let a unit be taken without the handle check of R-WORK-QUEUE-7. The catalog records no rule for claims today. The owner keeps it a proposal.
- Approved: the owner approved the new entry version field in the PRD 38 rows for the work sync ledger and work sync conflicts on 2026-11-23.
- Open P4 item ([P4](04-work-queue-operations.md) T12): the work tables have no foreign key to `project_register`, because a project prune removes the register row once no checkout is bound, and the R-MIN row keeps work records until an explicit cleanup after export. `deleteProjectRows` keeps the work rows today, and its comment and the Store README say so. A project that is pruned keeps its work rows without a register row, and it cannot be resolved by name or ID until a checkout writes it again. P4 builds the scoped work-row cleanup after export.
- Open P4 item ([P4](04-work-queue-operations.md) T13): `releaseWorkClaim` releases a claim for any caller that names its claim ID, and `readWorkClaim` shows the claim ID to any caller. P2 keeps this behavior. Before P4 builds `claim` and `release`, the owner decides whether to hide claim IDs from callers that do not hold the claim, or to make a release also check the claimant.

### Independent Review

An independent review found the phase safe and asked for seven small changes. All seven are made:

1. Medium: the relaxed drift check let any R-MIN row be shared by tables with one class. Sharing is now limited to the rows and tables that `STORE_SHARED_RMIN_ROWS` names. A test proves that a table not on the list, a row not on the list, and a named table with another class each still count as drift.
2. Medium: a project prune keeps work rows. P4 T12 now owns their scoped cleanup after export, and the `deleteProjectRows` comment and the Store README say the rows stay.
3. Low: closing a unit deleted any live claim. A close now follows the claim rule of a report: `putWorkUnit` takes the holder's `claimId` and checks it with `checkWorkUnitWriteClaim`. A caller without the claim gets `not-claim-holder`, the holder of an expired claim gets `claim-expired`, and anyone may close a unit whose claim expired. Nothing changes on a refusal.
4. Low: `putWorkUnit` did not check that its record belongs to the project that `writeWorkStore` opened. Every write in a session now checks it, also claims, releases, and ledger and conflict writes and deletes, and refuses another project with `project-mismatch`.
5. Low: a renewal while the clock went back hit a raw SQLite `CHECK` error. A renewal now starts from the later of now and the last renewal, so the claim times stay in order.
6. Low: a release needs only the claim ID, which any caller can read. The behavior stays, and P4 T13 holds the owner's decision.
7. Low: the table `CHECK` of each repository path now also refuses a `..` segment, as a second layer under the service's own check. A test inserts `../x.md`, `docs/../x.md`, and `docs/work/..` directly and meets the `CHECK`; `docs/work/..x/a.md` is allowed.

### Other Changes

- The P1 fixture helper `storeIdFor` padded short coordinates with `0`, so W1 R0 P1 and W1 R0 P10 got the same store ID. It now pads with `x`, and the contract test checks that the two differ.
- Older tests that expected schema 7 as current now expect schema 8: `w32-r0-p2-schema-v7`, `w32-r0-p2-old-store-checkout-move`, `w32-r0-p3-project-register`, `w32-r0-p4-store-maintenance`, `w32-r0-p5-store-wording`, `p6-global-store-lifecycle`, `store-table-catalog`, and `backlog-cache`, whose schema 5 helper now also drops the v8 tables.

### Checks

- `npx tsc --noEmit -p .` and `npm run build` in `packages/cli`: pass.
- `tests/w29-r0-p2-store-schema-and-records.test.ts`: 36 tests pass. `tests/work-store-contract.test.ts`: 23 tests pass.
- The Store tests (`store*.test.ts`, `w32-r0-*.test.ts`, `p6-global-store-lifecycle`, `installation-state`, `backlog-cache`, `self-management`) with the two files above: 338 tests pass, with the new shared-row drift test.
- `npm run validate:defaults -w packages/cli`: 53 tests pass.
- `bash scripts/check-instruction-routers.sh`: pass, run outside the sandbox because the sandbox blocks its temporary folder.
- `npm run smoke:pack:local`: pass. Released 2.0.5 refuses the upgraded Store with "schema version 8 is newer than supported version 6" and changes nothing. It ran outside the sandbox because it downloads the released 2.0.5 package, and it passed again after the review fixes.

### Full Test Suite

`npx vitest run --reporter=json` in `packages/cli`, counted from the JSON report: 138 test files, 136 passed and 2 failed. Of 2,907 tests, 2,898 passed, 3 failed, and 6 were skipped. This is the run after the review fixes. All three failures exist without this phase:

- `mcp-app-contract` (two tests) fails on Node v26 because a deprecation warning reaches stderr.
- `p5-migration-safety` fixture 11 fails only inside the sandbox.

### Limits

- Readiness, the work queue operations, and their CLI and MCP forms are P4. The claim service does not check readiness.
- The sync ledger and conflict writes are tested directly. P3 builds sync on them.

## P3 Parser, Import, and Sync

Covers A10 to A15 in [P3](03-parser-import-and-sync.md). Evidence date: 2026-11-23. Branch: `docs/w29-w30-work-store-and-factory`, rebased on `71096981`. Node `v26.13.1`. CLI package version `2.0.9`.

### What Was Built

- `packages/cli/src/operations/work/task-line.ts` is the one task line reader. It reads `t` and `T` as the same ID and gives `T`. The backlog snapshot now uses it instead of its own pattern, and the work file parser uses it. W34 R0 P1 has its own task pattern in `decomposition/output.ts` (line 110, on its own branch). Whichever of W29 R0 P3 and W34 R0 P1 lands second switches that code to `readTaskLine`.
- `packages/cli/src/operations/work/work-store/work-file.ts` is the parser and writer. The parser reads an index or phase file into a lossless document: every line with its own line ending, and the units the file records (the revision or phase, its stages, and its tasks), with dependency bullets, blocker bullets, and outbound links. The writer renders a document with the store's unit states and changes only the part of a line that the store changed.
- `packages/cli/src/operations/work/work-store/dependency-bullets.ts` reads one dependency bullet into dependencies, unresolved coordinates, a gate, a reference, or nothing (R-WORK-SYNC-13).
- `packages/cli/src/operations/work/work-store/sync.ts` is first import and two-way sync. It reads `work.projection`, computes the file and store state of each work file, takes the one P1 sync table decision, applies it in one Store write session, and stops a file for a person when its import would lose store data or act for a claim holder.
- `packages/cli/src/operations/work/work-store/conflict-report.ts` builds and words the conflict report.
- The P2 Store service gains `deleteWorkUnit`, for a unit that left its file, `readWorkSyncCheckout` and `markWorkSyncCheckout`, for the first sync mark, and two refusals: `unit-in-use` and `checkout-not-bound`.
- Schema v8 gains a seventh work store table, `work_sync_checkouts` (`checkout_id`, `first_synced_at`): one row for each checkout whose first sync is done. It has the three write guard triggers, a Store table catalog entry (Store-cached and rebuildable, `bounded` by its primary key: a lost row only makes the next sync of that checkout import without writing), a PRD 38 R-MIN row with a Requirement History entry, R-MIN parity register entries, and a place in the v8 expected table list and the rollback marker list, so a Store that reports schema 7 but has this table is changed outside Make Docs. The owner chose on 2026-11-23 to add it to the unreleased v8 migration instead of a new v9: schema v7 and v8 exist only on this unreleased branch (release 2.0.9 and `main` are at schema 6); the owner's real Store was last changed on 2026-11-22 at 22:09 and was at schema 6 when it was copied for W32 R0 P5 on 2026-11-23; and the v8 migration was written on 2026-11-23. So no real Store is at v8. Tests that list the v8 tables now list seven.
- No public command or MCP tool was added. PRD 52 gained R-WORK-SYNC-14 to R-WORK-SYNC-16 and edits to R-WORK-STORE-10, R-WORK-SYNC-9, and R-WORK-SYNC-13, with Requirement History entries, so each owner-approved behavior below is documented. PRD 38 gained the `work_sync_checkouts` row and its R-DB-7 name.

### How the Store Holds a File

- The file unit (the revision of an index file, or the phase of a phase file) keeps the file's text as its body: the frame. Stages and tasks keep their own fields. A task keeps its full text as its body, because a title holds at most 1,024 characters.
- The writer renders the frame with the store's fields. A line whose unit the store did not change keeps its bytes. Every write leaves the frame equal to the bytes it wrote.
- The writer can show three store changes: a task's mark (closed or not), a task's text, and a file unit's front matter `status`. It writes `T` in each task line it changes, also after a byte order mark on line 1. A status the file cannot show (a stage's status, a task in progress, a phase with no `status` field) and a met gate stay in the store only. An added unit, a removed unit, a changed blocker, an added or changed gate text, or a stage title is refused and reported as not written (P4 T16).
- On import, a field that the file still shows as the frame showed keeps the store's value. So a stage that the store closed, a task in progress, and a met gate survive a later edit elsewhere in the file.
- The store revision of a file is the sum of the record revisions of its units. Each write raises one revision by one, so the sum changes with each store change, and the ledger's unit list shows a changed set.
- A store ID follows its coordinate. When a person renumbers tasks, for example swaps the texts of T1 and T3, each store ID stays with its coordinate and takes the new text. R-COORD-20 already says existing coordinates are not renumbered, so this is acceptable. A test records it.
- A wave unit is made for each wave that an imported revision names. It has no file text and no recorded status (P4 T17).

### Round Trip (A10)

The test reads every work file under `docs/work/` and `.make-docs/archive/work/` in this repository: 463 files, live and archived, with the W22 R2 backlog read only. Each file parses, and both the plain write and the write through every unit's own state give identical bytes. No file fails. A further test takes a W22 R2 task with a lower-case `t`, flips its state in memory only, and shows that only that line changes and gets `T`. The W22 R2 files are never written. Fixtures with a byte order mark before a task on line 1, with CRLF line endings, and with no final newline round-trip and take a store change.

Two readable parts of current files are not units, and the file text keeps them as written:

- 1,693 task lines have no task ID, mostly in older backlogs. A task coordinate needs an ID, so they stay text.
- 26 task lines repeat an ID already used in their file (W19 R1 P4, which restarts its numbers after a reopen, and W23 R0 P3 T6). The first line is the unit, and the later line stays text.

The import report lists both as diagnostics with path and line.

### Unreadable Files (A11)

The parser refuses, with the path and the first failing line: invalid UTF-8, front matter that never closes, invalid YAML, a front matter coordinate that the folder and file name do not give, a `status` that is not one line of text, a code fence or HTML comment that never closes, a stage number used twice, and a file over the store's 65,536-character body limit. A comment block opens only at the start of a line, as in Markdown, so a `<!--` in inline code is text. In sync, an unreadable file stays untouched (same bytes and modification time), the report names its path and line, and other files still import. Sync also refuses, as unreadable, a file whose coordinate another file holds (`coordinate-taken`) and a phase whose revision has no index file (`parent-missing`).

### First Import (A12)

The test copies this repository's `docs/work/` and `.make-docs/archive/work/` trees into a temporary git repository with a project config, commits them, binds a checkout in a temporary Store, and runs the first sync. `git status --porcelain` is empty after it and after a second sync, which does nothing. No real file in this worktree is written.

Import report sample (counts from that run):

| Item | Count |
| --- | --- |
| Work files imported | 463 |
| Units | 4,178 (33 waves, 85 revisions, 378 phases, 899 stages, 2,783 tasks) |
| Dependencies resolved to a unit | 784 |
| Unresolved dependency bullets | 0 |
| Gates (bullets with no coordinate, or a coordinate and a further condition) | 707 |
| Diagnostics | 1,693 tasks without an ID, 26 repeated task IDs |
| Unreadable files, conflicts, written files | 0 |

Summary line: `First sync of this checkout: 463 work files and 4145 units entered the store. Make Docs wrote and removed no project file.` (The 4,145 units are the units of the files. The 33 waves have no file.)

A fixture backlog shows the unresolved case: the bullet "P9 is complete." in `02-second.md`, line 12, is reported as unit `W1 R0 P2`, coordinate `W1 R0 P9`, and kept as unresolved text. When a `09-ninth.md` file arrives, the next sync turns it into a dependency and reports the change.

### The First Sync of a Checkout Writes No File

Owner-approved on 2026-11-23 (PRD 52 R-WORK-SYNC-9). The first sync of a checkout imports only. It writes and removes no project file, and the report lists each file that the next sync writes or removes. At its end it writes the checkout's row in `work_sync_checkouts`, so every later sync is not a first sync: it writes and removes files under the sync table, and names each one ("Wrote: ..."). This holds also for a checkout with no work file at all, and for a checkout whose copies were removed with copies off and then turned on again; the re-check review found that both stayed in first-sync mode forever when the first sync was read from an empty ledger. A file that already matches the store is recorded as synced and counted in the summary. The independent review found that the earlier code wrote a file on a second checkout's first sync and still said "No project file changed". The summary now names every file written or removed in every sync.

### Sync Table Rows (A13)

Every one of the 31 rows of the P1 sync table has a fixture. 23 rows run through real sync on a fixture backlog, and each checks the file state, store state, setting, decision, and effect: write, import, removal, ledger clean-up, conflict kind, or nothing. 8 rows cannot arise: the file state and the store state read the same ledger entry, so a file state with an entry never meets a store state without one, and the reverse, and a path that nobody knows is never visited. Those 8 rows are checked through the decision function, and a test runs every input of the two state readers to show they never produce those pairs.

### Conflicts (A14) and the Report

A change to `02-second.md` on both sides stops only that file. In the same sync an edit to `01-first.md` imports. The conflict record names only the units of `02-second.md`, and a later sync keeps the conflict and the file as they are. Sample report text, for the owner's Guided Progress Review:

```text
Sync stopped for docs/work/2042-06-01-w1-r0-aurora/02-second.md.
The file and the store both changed. A person decides.
File: present (sha256 d30dbb739cac).
Store: revision 4, 3 units.
What differs:
- W1 R0 P2 T1: file [ ], "Ship it today."; store closed (done), "Ship it.".
These units wait until you choose: W1 R0 P2, W1 R0 P2 S1, W1 R0 P2 T1. Other files continue.
Choose one:
- Keep the file. Make Docs imports it and replaces the store's version. Run: make-docs work sync --settle docs/work/2042-06-01-w1-r0-aurora/02-second.md --keep-file
- Keep the store. Make Docs rewrites the file from the store. Run: make-docs work sync --settle docs/work/2042-06-01-w1-r0-aurora/02-second.md --keep-store
```

The commands use the planned `work sync` name of `work.queue.sync` in the name catalog, and the test checks that. P4 T15 builds the `--settle` flags. A file-deleted conflict records no file digest, as the conflict table requires, also when the copy came back; the report shows the live digest.

### Import Guards

Owner-approved on 2026-11-23 (PRD 52 R-WORK-SYNC-16). An import never acts for a claim holder and never deletes what the file cannot show. When it would, sync stops that one file as an `unclear` conflict, changes nothing in the file or the store, and names each unit and why:

- The file closes a unit that someone holds on a live claim. Only the holder closes a claimed unit (R-WORK-QUEUE-8, R-WORK-QUEUE-9), and an import holds no claim. The report names the unit, the claimant, and the claim's end time. It never shows the claim ID, which only the holder sees (P4 T13). This stays a conflict for each file until the owner's choice in P4 T18 (PRD 52 R-WORK-SYNC-16). When the claim ends, the next sync imports the edit and clears the conflict.
- A unit leaves the file while it has a live claim, or while the store holds something the file cannot show: a status other than what its line shows (such as in progress), a met gate, or links from other documents.
- A unit leaves the file while a unit in a file that waits for a person depends on it. Sync never changes the units of a waiting file.

One stopped file can make another stop, so the check runs again until no new file stops, and the order of the files never matters. The re-check review found that a later file could pass before an earlier file stopped, and then its delete failed with `unit-in-use` on every sync.

### File System Errors

A write or removal that the file system refuses, such as `EACCES` on a read-only folder, is caught for each file. It is reported in `fileErrors` with the path, the operation, the error code, and the message, and the summary says: "Could not write <path> (EACCES). The file and its store records stay as they were, and the next sync tries again." That file's frame and ledger entry do not change, and every other file continues. Each file is written just before its own Store change in the same session. If the whole session fails after some files were written, its Store changes roll back, and the next sync finds each written file equal to what the store renders and records it with no conflict (R-WORK-SYNC-14).

Sample, from the reviewer's probe, where a typo (`T2 Two.`) dropped the ID of a task that was in progress:

```text
Sync stopped for docs/work/2042-06-01-w1-r0-aurora/01-first.md.
Make Docs stopped this file instead of importing it, so no store data is lost and no claim is overridden. A person decides.
W1 R0 P1 T2 left the file, and the store holds what the file cannot show: the status in-progress.
```

A unit with nothing that the file cannot show is deleted when it leaves its file, and the summary names it: `Deleted 1 unit that left its file: W1 R0 P1 T3 (docs/work/.../01-first.md).` Units that leave together and depend on each other, such as Stage 2 on Stage 1, lose those links first, so the delete succeeds. The independent review found that this case made every later sync fail.

### Copies Off (A15, T7)

`work.projection` is read from `.make-docs/config.yaml`. No block means `on`, and a malformed block stops sync with nothing changed. With copies off, sync writes no file. It removes a copy only when its bytes still match the last applied digest. A changed copy is imported, kept, and reported in that sync. Its ledger then records the imported bytes, as T5 asks, so a later sync removes it as an unchanged copy. The report says so: "Copies are off, so Make Docs imported each edit, and a later sync removes the copy, because it then matches the store." The owner approved this on 2026-11-23 (PRD 52 R-WORK-STORE-10).

### Write Holds

Sync takes a list of held folders. It reads a file in a held folder but never writes or removes it, and reports it as held with its reason. A test holds `docs/work/2026-11-13-w22-r2-portable-checkout-adoption/`, which waits for its own project doctor run (register D-063). The list is an option, not a path written into the product, because Make Docs ships to other projects. No public command runs sync in P3, so nothing can write that folder yet. P4 T19 decides where the list comes from before `work sync` ships.

### Owner Decisions (2026-11-23)

The owner approved each behavior below as recommended on 2026-11-23. PRD 52 now states each one, so none is undocumented, and its Requirement History records the change.

1. A unit that leaves its file is deleted from the store only when it has no store-only data: no live claim, not in progress, no met gate, and nothing else the file cannot show. The summary names each deleted unit. Otherwise sync stops that file as a conflict (R-WORK-SYNC-16).
2. The first sync of a checkout imports only, writes no file, and reports what the next sync writes (R-WORK-SYNC-9).
3. A changed copy with copies off is imported, kept for that sync, and removed by a later sync, and the report says so (R-WORK-STORE-10). The other choice, keeping it until a person deletes it, was not taken.
4. A bullet that names a phase and adds words is a dependency only when the words match the named unit's real title, and otherwise a gate (R-WORK-SYNC-13). Before this rule, the independent review counted 538 open units with gates, 352 of them in live backlogs; the earlier note that "a gate never hides work" was wrong, because a gate holds its unit until a person records it as met. After the rule, the same count gives 514 open units with gates, 348 of them live, and 114 live gate bullets that start with a phase. Most of those name a phase by a short label, not its title, such as "Phase 01 scope gate" for "Phase 01: Requirements and Scope Gate", so they stay gates.
5. Identical content on both sides is recorded with no conflict (R-WORK-SYNC-14), and an archive move keeps store IDs (R-WORK-SYNC-15).

A file edit that closes a claimed unit stays a conflict for each file until P4 T18 (R-WORK-SYNC-16). Task lines without an ID, and repeated task IDs, stay text with a diagnostic (Round Trip above). P5 T9 adds the new rules to the rule catalog and the agent form.

### P4 Items

P4 gains T15 (the settle flags), T16 (the file form of store edits that the writer refuses), T17 (wave readiness and archived backlogs in `work next`), T18 (an imported close of a claimed unit, which stops as a conflict until then), and T19 (where the write hold list comes from). The backlog index records the edit.

### Independent Review

An independent review asked for changes before commit. All are made:

1. High: two stages that left a file together, one depending on the other, made every sync fail with `unit-in-use`. Their links are now dropped first. Test.
2. High: an import closed a claimed unit by using the holder's claim ID. It now stops the file as a conflict that names the unit and its holder state, never the claim ID. Test.
3. High: a task that left its file was deleted silently. Deleted units are now named, and a unit with a live claim or data the file cannot show stops the file instead. Tests for each case.
4. Medium: a second checkout's first sync wrote a file and said no file changed. The first sync now writes nothing and lists what the next sync writes, and every summary names each file written or removed. Test.
5. Medium: "a gate never hides work" was wrong. Owner Decisions item 4 now has the counts, and the title rule is built. Tests.
6. Medium: the dependency fix-up changed units in waiting files. It skips them now, and a delete that would need that stops its own file. Test.
7. Low: a byte order mark before a task on line 1 crashed the writer. Fixed, with fixtures for a byte order mark and for no final newline.
8. Low: a write hold for the W22 R2 folder. Built as an option, with a test and P4 T19.
9. Low: renumbered tasks move store IDs. Recorded above, with a test.
10. Copies off: the report says that a later sync removes the kept copy. Test.
11. The W34 R0 P1 task pattern: recorded above.

The reviewer's probe scripts were run again against the fixed code. Every finding they showed is gone.

### Re-check Review

A second reviewer confirmed fixes 1, 2, 3, 5, and 7, and fix 8 as safe until P4 T19, and found new problems. All are fixed, each with a test built from the reviewer's probes (`probe2.mts`, `probe3.mts`):

1. High: the import guard checked the files once, from last to first, so a delete of a unit that a stopped earlier file depends on failed with `unit-in-use` on every sync. The check now runs until no new file stops. Test: a claimed close in `01-first.md` and a removed stage in `02-second.md` both stop, on two syncs, with no error.
2. High: the first sync was read as "no ledger entry and no conflict", so a checkout with no work file, or with its copies removed, never left it. The new `work_sync_checkouts` mark fixes it (owner Option A). Tests: the table, its triggers, its catalog entry, and the rollback check; the mark is written once; an empty second checkout gets all three files on its second sync; copies on, then off, then on writes the files again.
3. Medium: a refused file write threw a raw error inside the Store session. It is now a typed file error for that file only. Test: a read-only folder.
4. Low: a test for a unit with links from other documents that leaves its file.
5. Low: this report and PRD 52 R-WORK-SYNC-9 now say how the first sync is recorded, with a Requirement History entry.

### Checks

- `npx tsc --noEmit -p .` and `npm run build` in `packages/cli`: pass.
- `tests/w29-r0-p3-parser-import-and-sync.test.ts`: 90 tests pass.
- After the re-check fixes: the P3, P2, and P1 work store tests, the W31 task ID and project doctor tests, the backlog snapshot tests, the name catalog test, the consistency test, and the Store tests that list the v8 tables (`store-table-catalog`, `p6-global-store-lifecycle`, `backlog-cache`): 13 files, 374 tests pass.
- `npm run validate:defaults -w packages/cli`: 53 tests pass, after `scripts/copy-template-to-cli.mjs` filled the ignored `packages/cli/template` copy in this new worktree.
- `bash scripts/check-instruction-routers.sh`: pass, run outside the sandbox because the sandbox blocks its temporary folder.
- `check prd`: no diagnostics after the PRD 52 and PRD 38 changes.
- `project paths validate`: `valid: true`. `project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption`: no problems in 386 files. Both ran with a temporary `MAKE_DOCS_HOME`.
- The first reviewer's three probe scripts and the re-check reviewer's two, run unchanged against the fixed code: the stage probe syncs twice with no error; the typo probe stops the file; the claimed close and the depended-on delete both stop, on two syncs, with no error and no claim ID; an empty second checkout gets its three files on its second sync; a read-only folder gives a typed file error, and the next sync writes the file; and copies on, then off, then on writes the files again.

### Full Test Suite

`npx vitest run --reporter=json` in `packages/cli`, counted from the JSON report, after the re-check fixes: 139 test files, 137 passed and 2 failed. Of 2,997 tests, 2,988 passed, 3 failed, and 6 were skipped. All three failures exist without this phase:

- `mcp-app-contract` (two tests) fails on Node v26 because a deprecation warning reaches stderr.
- `p5-migration-safety` fixture 11 fails only inside the sandbox.

### Limits

- The settle commands are named, not built (P4 T15). Readiness, which keeps conflicted units out of `work next`, is P4.
- Inbound links from other documents are kept on import but not yet found. Outbound links come from the file.
- A file larger than 65,536 characters cannot be held as one unit body and is reported unreadable. The largest current work file has 48,520 bytes.
- If the Store session fails after a file write, the next sync finds the file equal to what the store renders and records it, so nothing is lost. A removal in that window leaves a ledger entry that the next sync clears or reports.
