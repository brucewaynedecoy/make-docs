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

## P4 Work Queue Operations

Covers A16 to A19 and A31 in [P4](04-work-queue-operations.md), as a first pass. Evidence date: 2026-11-23. Branch: `t3/w29-work-queue-operations` from `d212b0e9` on `docs/w29-w30-work-store-and-factory`. Node `v26.13.1`. CLI package version `2.0.9`. T7, T8, T10, T11, and T12 are not built in this pass, so A20, A21, A32, and A34 are not covered yet.

### What Was Built

| Command | MCP tool | Profiles | Access |
| --- | --- | --- | --- |
| `make-docs work status` | `work_status` | `backlog`, `workflow` | Reads only: Store read and project read. It reports every Store state itself, so its Store admission is optional. |
| `make-docs work sync` | `work_sync` | `backlog`, `workflow` | Write: Store write and project write. |
| `make-docs work next` | `work_next` | `backlog`, `workflow` | Reads only: Store read and project read. |
| `make-docs work claim` | `work_claim` | `backlog`, `workflow` | Write: Store write and project write. |
| `make-docs work release` | `work_release` | `backlog`, `workflow` | Write: Store write and project write. |
| `make-docs work report` | `work_report` | `backlog`, `workflow` | Write: Store write and project write. |
| `make-docs work close` | `work_close` | `backlog`, `workflow` | Write: Store write and project write. |
| `make-docs work export` | `work_export` | `backlog`, `workflow` | Write: Store write and project write. |
| `make-docs work add` | `work_add` | `backlog`, `workflow` | Write: Store write and project write. |

Every write command runs a real sync first. Each write needs the shared write permission and an `--expected-version` (R-WORK-QUEUE-13), and every command has leaf help (`--help` exits 0) and JSON output. Read-only summaries end with "Changes nothing.".

- `packages/cli/src/operations/work/work-queue/readiness.ts`: readiness, wait reasons with one next action each, and ready order (WORK-RULE-020, -021, -032, -033). It reads records only, so the P1 readiness fixtures run against it directly.
- `packages/cli/src/operations/work/work-queue/queue.ts`: the service of the nine commands, the authority mode, and the compact sync outcome in every result.
- `packages/cli/src/operations/work/work-queue/operations.ts`: the nine registry operations. The name catalog marks them current (`addedBy: "W29 R0"`), and PRD 39 R-RUN-1 lists them as active `work` commands.
- `packages/cli/src/operations/work/work-store/sync.ts`: the settle flags, the read-only sync check, the config hold list, the copies-off ledger rule, and store-only edits.
- `packages/cli/src/store/work-store.ts`: `listWorkClaims`, `releaseExpiredWorkClaim`, a renewal that needs the claim ID, and `setWorkUnitNote` and `readWorkUnitNote` for the progress note.
- `packages/cli/src/store/work-store-schema.ts`: the `note` and `note_at` columns of the unreleased v8 `work_units` table (register D-066), with their R-MIN field and register entries.
- `packages/cli/src/config.ts`: the project config accepts the `work` block and checks it against `WorkConfigBlockSchema`, so this repository can hold the W22 R2 backlog. P5 T3 and T4 still own the rest of the config work.
- `packages/cli/src/store/table-catalog.ts`: decision item `STORE-DECISION-004` and setting `workClaimExpiredReviewDays` (7).

### Owner Decisions of 2026-11-23, as Built

| Task | Decision | How it is built |
| --- | --- | --- |
| T13 | Hide claim IDs from callers that do not hold the claim; a claim ID works like a private key. | Make Docs shows a claim ID once: in the result of a new claim (a plain claim or a takeover). A renewal, a refusal, `work next`, `work status`, a conflict, and the Store check item never show it, also when the caller names the holder's claimant. A renewal must send the claim ID (`--claim-id`); a same-name claim without it is refused. A takeover names the previous claimant (`--takeover-from`). Any caller releases an expired claim without its ID. P1 fixture WSF-017 now renews with the claim ID, and new fixture WSF-056 proves that the claimant name alone is refused. |
| T14 | Report-only Store item for claims expired more than 7 days. | `setup store check` lists `STORE-DECISION-004` with the claimant, the unit, and the end time. No rule removes the claim. |
| T16 | Store-only edits stay in the Store and show in `work report`. | The writer takes the file's own blockers, gate texts, and non-task titles, so it writes only what the file can show. An import keeps a cleared blocker and an added evidence link while the file still shows what the last applied text showed. `work report` lists each store-only edit of the unit's file. A sync whose store change is store-only writes no byte and does not say "Wrote". |
| T17 | A wave is ready when all its revisions are closed. Archived backlogs never show in `work next`. | Each open revision is a `dependency-open` reason of its wave, and a revision never waits for its own wave. Units under `.make-docs/archive/work/`, and a wave whose revisions are all archived, are left out of both lists and still count as dependencies. |
| T18 | A file edit that closes a claimed unit stays a per-file conflict. | P3's import guard stays. `--keep-file` runs the same guard, so the file stops again. `--accept-deletion` is refused while a unit of the file has a live claim, and names the claimant and end time. |
| T19 | The hold list lives in project config. | `work.syncHold` lists work folders or files. Sync reads a held path, never writes or removes it, and reports it as held. A settle that would write or remove a held path, or accept its deletion, is refused. Export never writes under a held path. This repository's `.make-docs/config.yaml` holds `docs/work/2026-11-13-w22-r2-portable-checkout-adoption/` (register D-063). The repository config is dogfood content, and the template ships no config, so the template-first rule does not apply. |
| T20 | Copies off and a copy deleted by hand: clear that file's ledger entry. | Sync clears the entry (`ledger-cleared`). When copies go on again, the file state is absent and the store state is new, so sync writes the file with no conflict. The P1 sync table rows `missing/unchanged/off` and `missing/changed/off` keep the decision `none` and now say the entry goes. Tests cover both rows and a removal that the file system refuses with copies off. |

T15 builds `work sync --settle <path>` with `--keep-file`, `--keep-store`, `--restore`, `--accept-deletion`, `--reimport`, or `--remove-file`, and an optional `--expected-revision`. A choice that the conflict kind does not offer, a stale revision, a path with no conflict, and a missing, unreadable, present, or changed file are refused, with nothing changed. `--keep-file` imports the file with no three-way merge, so the file wins.

T2: a write syncs first. A read-only command (`work status`, `work next`) cannot write, so it runs a read-only sync check instead: it names each file that the next sync imports, writes, or removes, and each conflict. This is new behavior; PRD 52 R-WORK-SYNC-8 now says so.

### New Behavior

- `work export --to <dir>` writes backlog files only to a new or empty folder, and `--quick <file>` writes the quick item list only to a new file. Export never writes under `docs/work/`, `.make-docs/`, or a held path. It checks the real path of every destination, so a symbolic link or another spelling of the same folder (`/var` and `/private/var`) cannot lead into them, and it writes each file with no replace. `--quick` uses `renderWorkTasksList`, which the `tasks` URI read reuses in T10.
- A changed unit's file copy changes at the next sync, not inside `work close` (R-WORK-SYNC-3). The close result names the file only when sync can write it: copies on and not held.
- `work report --note` keeps the latest note of the unit, one line of plain text of at most 256 characters, and its time (register D-066, owner option A). A new note replaces the last, and an import keeps it.
- Every command checks its inputs before its sync: the claim time limit, the note, the evidence or request file, the gate texts, and the export destinations. So a refused input changes nothing. A refusal after the sync says that this command changed no unit.
- `work add` names no `make-docs://project/...` URI until the T10 read lands.

### Samples for the Guided Progress Review

`work next --level task` with one claim and one quick item:

```text
Ready tasks (2), in order. Read each unit's revision with --json, for --expected-version:
  W1 R0 P1 T2: Write the writer. (docs/work/2042-06-01-w1-r0-aurora/01-first.md)
  task 1: Compare two printers
Waiting (3):
  W1 R0 P1 T1: Build the parser.
    - Claimed by builder-a. The claim ends at 2042-06-15T12:30:00.000Z unless builder-a renews it. Next: Wait for builder-a to finish or release it.
  W1 R0 P1 T3: Check it.
    - Part of W1 R0 P1 S2, which is not ready yet. Next: Run `make-docs work next --level stage` to see why W1 R0 P1 S2 waits.
  W1 R0 P2 T1: Ship it.
    - Part of W1 R0 P2, which is not ready yet. Next: Run `make-docs work next --level phase` to see why W1 R0 P2 waits.
Sync check: the files and the store match.
Changes nothing.
```

`work claim W1 R0 P1 T1 --claimant builder-a --task-handle task-a --expected-version 1` (claim ID shortened here):

```text
Claimed W1 R0 P1 T1 for builder-a until 2042-06-15T12:30:00.000Z.
Claim ID: wc-<id>. Unit revision: 1.
Keep the claim ID private, like a key: Make Docs shows it only now. Report, close, release, and renew need it.
Renew at least every 10 minutes: make-docs work claim W1 R0 P1 T1 --claimant builder-a --claim-id <claim ID> --expected-version 1
Sync: 0 files imported, 0 files written, 0 copies removed.
```

`work report W1 R0 P1 T1 --claim-id <id> --status in-progress --note "..." --expected-version 1`:

```text
Reported on W1 R0 P1 T1: status open to in-progress, recorded a note.
Unit revision: 3.
Latest note (2042-06-15T12:00:00.000Z): Parser reads every front matter field.
Store-only edits (the file copy does not show them):
  - The store records W1 R0 P1 T1 as in-progress. The file shows [ ].
```

`work export --to .` and `work export --quick .make-docs/config.yaml` (temporary project):

```text
--to would write /private/tmp/.../aurora/docs/work, and docs/work/ holds the work files that sync owns. Name a folder or file outside it. Nothing changed.
--quick would write /private/tmp/.../aurora/.make-docs/config.yaml, and .make-docs/ holds the project config, system resources, and the work archive. Name a folder or file outside it. Nothing changed.
```

`work next` on the copy of this repository (first lines of the fallback note):

```text
79 phases with no status line count as done, because every task is checked (doneBy: all-tasks-checked): W9 R2 P1, W9 R2 P2, W9 R2 P3, W9 R2 P4, W9 R3 P1, and 74 more (--json lists them). A status line in the file decides instead.
```

`work release W1 R0 P1 T2 --expected-version 1` with no claim, and `work release` of an expired claim without `--handle`:

```text
Not changed: W1 R0 P1 T2. The unit has no claim to release.
Not changed: W1 R0 P1 T1. The unit's claim ran out. Check the old task handle first, then send what you saw with --handle: stopped, finished, or not-found, or no-handle when the claim has no task handle.
```

`work report W1 R0 P2 --clear-blockers --expected-version 1`:

```text
Reported on W1 R0 P2: cleared 1 blocker.
Unit revision: 2.
Store-only edits (the file copy does not show them):
  - The store cleared the blockers of W1 R0 P2. The file still lists 1 blocker.
Sync: 0 files imported, 0 files written, 0 copies removed.
```

A conflict with its settle choices, as `work status` shows it:

```text
The work store is the authority, because this checkout is bound to a usable Store. The docs/work/ files are its repo copy.
Repo copies are on: sync keeps the docs/work/ files and the store the same.
11 open units: 2 ready, 9 waiting. 1 quick item. 1 live claim.
Sync check: 1 conflict waiting for a person. Settle each conflict with one of its commands.
Conflict in docs/work/2042-06-01-w1-r0-aurora/01-first.md (both-changed): The file and the store both changed. A person decides.
  Keep the file. Make Docs imports it and replaces the store's version. Run: make-docs work sync --settle docs/work/2042-06-01-w1-r0-aurora/01-first.md --keep-file
  Keep the store. Make Docs rewrites the file from the store. Run: make-docs work sync --settle docs/work/2042-06-01-w1-r0-aurora/01-first.md --keep-store
Changes nothing.
```

### Acceptance Cases

- A16: every operation's CLI argv and MCP arguments give the same typed input through the registry input schema, and both run the one registry handler. The test checks this for all nine. No test in this pass calls the nine tools through a live MCP transport.
- A17: a plain claim on an expired claim gives `takeover-needs-handle-check`; a running handle gives `previous-holder-still-working`; a wrong previous claimant gives `version-conflict`; a stopped or finished handle takes the claim.
- A18: after a takeover, the old claimant's report and close give `not-claim-holder`, and a caller without a claim also gets `not-claim-holder`.
- A19: `work status` names the mode and reason for a usable bound Store, an absent Store (`not-configured`, and no Store is made), a denied caller, an unsafe Store (`user_version` 999), and an unbound checkout.
- A31: quick items get 1, then 2 after 1 closed; `work next` lists them after every coordinate as `task 2`.
- The P1 fixtures: every readiness fixture (WSF-002, -003, -004, -007, -022 to -025, -057), every claim fixture (WSF-014 to -021, -044, -056), and every update fixture (WSF-033 to -037, -045 to -047) give the P1 answer through the P4 code. WSF-035 now carries its note to the version check.

### Independent Review

An independent review found the first pass needs changes. Findings 1 to 6, 8, and 10 are fixed, each with tests in `tests/w29-r0-p4-work-queue-operations.test.ts`:

1. High: `work export --to .` wrote into `docs/work/` and a held path; on a temporary copy it rewrote a W22 R2 task line. Export now checks the real path of the target and of each destination against `docs/work/`, `.make-docs/`, and every held path, and needs a new or empty folder. Tests: `--to .`, the project root, a folder in `docs/work/` and in `.make-docs/`, a symbolic link into `docs/work/` and into the project root, and the `/var` spelling of a `/private/var` path.
2. High: `--quick` could replace any file, also `.make-docs/config.yaml`. It now needs a new file outside `.make-docs/`, and writes with no replace. No phase task needs a replace flag, so none exists. Tests: the config file, a new file under `.make-docs/`, and an existing file elsewhere, whose bytes stay.
3. High: T13 was broken. Naming the holder's claimant showed the claim ID in `work next`, and a same-name claim renewed the claim and returned its ID. Now only a new claim's result shows the ID, and a renewal sends it. PRD 52 R-WORK-QUEUE-19 says so, with a Requirement History entry that cites the owner's T13 decision. Tests for a new claim, a same-name claim, another claimant, `work next` for every caller, `work status`, the renewal, a takeover, and the Store check item.
4. Medium: refusals said "Nothing changed." after the sync had run. Inputs are now checked before the sync. A test edits a file, sends six bad inputs, and shows that the edit was never imported and the file kept its bytes.
5. Medium: `work add` printed a project URI that does not resolve yet. It names none until T10, and the T10 task says so.
6. Medium: `work close` named the file also for a held path or with copies off. Tests for held, copies off, and copies on.
8. Low: `--accept-deletion` on a held path is refused. Test.
10. Low: the claim text shows the claim ID and the unit revision; a release with no claim says so. PRD 52 keeps the short note in the operation table, and the note now works.

### Owner Decisions on Findings 7 and 9 (2026-11-23)

Finding 7, both rules: a status line is the authority when present, and for older backlogs a phase with no status line whose tasks are all checked counts as done for readiness. It is neither ready nor waiting, it meets a dependency, and a claim on it is refused as closed. The store record and the file do not change. `work next` lists each such phase in `doneByFallback` with `doneBy: "all-tasks-checked"` and says so in words; `work status` counts it as done. A phase with no task, or with an unchecked task, keeps today's behavior. PRD 52 R-WORK-QUEUE-20 and rule WORK-RULE-040 state the rule, P1 fixture WSF-057 proves it, and P5 T10 holds the later fix that adds status lines to older backlogs.

On a temporary copy of this repository's `docs/work/`, `.make-docs/archive/work/`, and config (temporary `MAKE_DOCS_HOME`, first sync, then `work next` at phase level): 125 ready phases without the fallback, 46 with it, and 79 phases done by the fallback, from W9 R2 P1 onward. Waiting phases stay at 20. The 46 that are still ready have a status line that says active, such as W17 R2, W18 R1 to R3, W21 R0, and the current Waves, so the status line decides for them.

Finding 9, option A: a release of an expired claim needs the R-WORK-QUEUE-7 handle check (`--handle`: stopped, finished, or not-found; `no-handle` when the claim has no task handle; running is refused), so a release and a new claim never skip the check that a takeover runs. A close of a unit whose claim expired, by a caller without the claim, needs the same check; the P2 rule that let any caller close such a unit now asks for it. A file edit never closes a unit with any claim, live or expired: sync stops that file as a conflict, because sync never runs the check. `--accept-deletion` is refused while any unit of the file has a claim. PRD 52 R-WORK-QUEUE-8, R-WORK-QUEUE-10, and R-WORK-SYNC-16 say so. Tests: release-then-claim, an expired close without and with the check, a running task, a claim with no task handle, and a file edit that closes a unit with an expired claim.

Register D-066: the owner chose option A on 2026-11-23. The unreleased v8 `work_units` table gains `note` (one line, 1 to 256 characters) and `note_at` (UTC time), with a check that both are set or both are empty. The PRD 38 work store records row names "latest progress note and its time", the R-MIN parity register maps both columns, and the parity test passes. The Store table catalog lists both columns. D-066 is closed in the register.

### Re-check Review

A re-check confirmed fixes 2 to 10 and the owner decisions on findings 7 and 9, and found seven more problems. All are fixed. Each repro from the re-check's probe scripts (`export.mts`, `fallback.mts`, `keep.mts`, `expired.mts`) is now a test, and the four scripts, run unchanged against the fixed code, show each fix:

1. High: on macOS, `--to Docs/Work/new`, `--to .MAKE-DOCS/out`, and `--quick .Make-Docs/q.md` wrote into protected folders, because `realpathSync` keeps the typed letter case. Export now reads the stored case of each existing part with `realpathSync.native`, and on macOS and Windows compares paths without letter case, so a part that does not exist yet matches in any case. Tests: `Docs/Work/new`, `DOCS/work/x`, `.MAKE-DOCS/out`, `.Make-Docs/q.md`, and a held path in another case.
2. Medium: a unit with a progress note that left its file was deleted with its note. A note is now store-only data, so the file stops as a conflict that names the note (PRD 52 R-WORK-SYNC-16). Test.
3. Medium: an unchecked checkbox that is not a unit, such as an indented `- [ ] T2: ...` or a nested `- [ ] ...` with no ID, did not keep a phase with no status line open. The fallback now also needs no unchecked checkbox in the phase's `Tasks` sections, at any indent (PRD 52 R-WORK-QUEUE-20). Test with the five probe phases: only the all-checked phase counts as done.
4. Medium: a file edit that closes a claimed unit could block its file for good: `--keep-file` said "Settled" and stopped the file again, no choice named the release, and `work status` said "so Make Docs imports it". The rule stays (owner T18 and finding 9). Such a file is now a `claimed` conflict, a new conflict kind (schema v8 check, unreleased). Its choices are `make-docs work release <unit>` for each claimed unit (`--claim-id <claim ID>` for its holder, or `--handle <stopped|finished|not-found>` or `--handle no-handle` for an expired claim, with `--expected-version`) and `--keep-store`. `--keep-file` is refused with nothing changed. Its meaning says that `setup store check` lists an expired claim after 7 days (STORE-DECISION-004). `work status` shows the same choices and reads the claim at its own time. PRD 52 R-WORK-SYNC-12 and R-WORK-SYNC-16 say so. Tests: the live and expired claim, the refused `--keep-file`, the status words, the release and then the import, `--keep-store` once, and no loop.
5. Low: the holder of an expired claim was told "Claim the unit again", which is refused. The words now name the takeover (`--takeover-from` and `--handle`) or the release with `--handle`. Test.
6. Low: a claim on a phase done by the fallback said "The unit is closed." It now says "The unit counts as done." Test.
7. Low: the MCP `claimant` text of `work_next` said that a caller's claims show their claim ID. It now says that `work next` never shows a claim ID, and only the result of a new claim does. Test.

`work next` on the temporary copy of this repository gives the same counts after fix 3: 46 ready phases, 79 done by the fallback, 20 waiting.

Sample, a `claimed` conflict after the claim ended, as `work status` shows it:

```text
Conflict in docs/work/2042-06-01-w1-r0-x/01-p.md (claimed): The file closes or removes a unit that a claim still holds, live or expired. An import never acts for a claim holder, so Make Docs stopped this file. The claim ends only through its holder, a takeover, or a release after a check of its task handle. If nobody acts, make-docs setup store check lists an expired claim after 7 days (STORE-DECISION-004).
  The claim of a on W1 R0 P1 T1 ended at 2042-06-15T12:30:00.000Z. Check its task handle, then release it; then the next sync imports the file. Run: make-docs work release W1 R0 P1 T1 --handle <stopped|finished|not-found> --expected-version 1
  Keep the store. Make Docs rewrites the file from the store, so the claimed unit stays open for its claim. Run: make-docs work sync --settle docs/work/2042-06-01-w1-r0-x/01-p.md --keep-store
Changes nothing.
```

### Checks

- `npx tsc --noEmit -p .` and `npm run build` in `packages/cli`: pass.
- `tests/w29-r0-p4-work-queue-operations.test.ts`: 88 tests pass.
- With it: the W29 P1 to P3 work store tests, the W31 and W32 Store and maintenance tests, `store-table-catalog`, the name catalog, the W33 leaf help, alias, and native rule tests, the MCP and registry tests, `operation-domains`, `p3-operation-surfaces`, `consistency`, and `cli` all pass.
- Re-check test change: the P1 contract test now expects one settle choice (`--keep-store`) for a `claimed` conflict.
- Review-fix test changes: the P2 renewal tests send the claim ID, a P2 raw insert names the two note columns, P1 fixture WSF-017 renews with the claim ID, the P2 expired-close test now needs the handle check, and new P1 fixtures WSF-056 and WSF-057.
- Tests changed for this phase: counts and lists that now include the nine operations (name catalog, MCP tool lists and profiles, registry admissions, leaf help, operation domains, P3 surfaces, top-level help), the P3 settle command test (the entry is current now), the P3 store-only test (a store-only edit writes no byte, so the file is not named as written), the P1 config default (`syncHold: []`), and a Store maintenance fixture for `STORE-DECISION-004`.
- `npm run validate:defaults -w packages/cli`: 53 tests pass.
- `bash scripts/check-instruction-routers.sh`: pass, run outside the sandbox because the sandbox blocks its temporary folder.
- `check prd`: passed, 37 PRD files.
- `project paths validate`: `valid: true`. `project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption`: one prose finding in `docs/work/2026-11-23-w34-r0-skill-scripts-into-the-cli/evidence.md` line 108, a sentence that W34 R0 wrote on purpose about the two letter cases of one task ID; no task line. Both ran with a temporary `MAKE_DOCS_HOME`.

### Full Test Suite

`npx vitest run --reporter=json` in `packages/cli`, counted from the JSON report, after the review fixes, the owner decisions on findings 7 and 9, and the re-check fixes: 144 test files, 142 passed and 2 failed. Of 3,268 tests, 3,259 passed, 3 failed, and 6 were skipped. All three failures exist without this phase:

- `mcp-app-contract` (two tests) fails on Node v26 because a deprecation warning reaches stderr.
- `p5-migration-safety` fixture 11 fails only inside the sandbox.

### Limits

- T7, T8, T10, T11, and T12 are not built. A20, A21, A32, and A34 wait for the follow-up pass.
- `work next` without a usable Store returns the typed Store outcome. It does not read the `docs/work/` files directly yet (PRD 52 R-WORK-STORE-2 for the queue commands); the follow-up pass decides with the owner.
- The read-only sync check does not run the import guards, so a file it lists as an import may stop as a conflict in the real sync.
- The agent form (P5) still says what P1 said about release, takeover, and renewal, and has no text yet for WORK-RULE-040. P5 owns the agent text; the existing rule IDs did not change, and WORK-RULE-040 is new.

## P4 Second Pass

Covers T7, T8, T10, T11, and T12 and A20, A21, A32, and A34 in [P4](04-work-queue-operations.md), and the `work next` gap from the first pass's limits. Evidence date: 2026-11-23. Branch: `t3/w29-p4-work-queue-second-pass` from `0b1c0df9` on `docs/w29-w30-work-store-and-factory`. Node `v26.13.1`. CLI package version `2.0.9`. Every sample ran against a temporary `MAKE_DOCS_HOME`; no test or sample read or wrote the real Store.

### What Was Built

| Task | What it does now | Code |
| --- | --- | --- |
| T7 | When the work store is the authority (opt-in with `--work-store` since the owner decision below), `backlog snapshot` runs the read-only sync check, reads each work file's text from the store (the P3 writer renders the frame with the store's unit states), and adds a `readiness` key to each record and phase and a top-level `workStore` key. The `store` capability says `available`. Schema version stays 2. | `packages/cli/src/operations/work/backlog/store-snapshot.ts`, `snapshot.ts` (a work file source seam), `schemas.ts` |
| T8 | Without a usable Store (absent, older schema, unsafe, or a checkout that is not bound), the snapshot runs the old file path, unchanged, with no store-mode key. A Store refusal in store mode, such as a harness denial, reads the files and names the typed result in `workStore.refusal`. | same |
| T10 | `make-docs resource read`, the `resource_read` tool, and native MCP `resources/read` accept `make-docs://project/<project>/tasks/` and `.../tasks/<n>`. The project resolves by name or project ID through `project_register` only. Each read opens one read-only Store session with no project folder. `work add` names the new quick item's URI again. | `packages/cli/src/operations/work/work-queue/project-resource.ts`, `resource/ops.ts`, `mcp/resources.ts`, `run/root-operations.ts`, `store/installation-state.ts` (`withStoreReadOnlyDatabase`), `store/work-store.ts` (`readWorkStoreAt`) |
| T11 | The same reads accept `.../backlog/` and coordinate paths down to a stage or a task, with each unit's status, readiness and wait reasons, live claim, links, and child list. A phase shows its stages with their tasks. | `project-resource.ts` |
| T12 | A complete `work export` (every backlog file and, when the project has quick items, `--quick`) returns `complete: true` and a `workDigest` of the project's work rows. `deletePrunedProjectWorkRows` removes one project's units, dependencies, links, and claims only when the project has no register row and no bound checkout, the digest still matches, and no claim is live. `pruneProjectFromStore` runs it when given `workExportDigest`, and reports `workRows` as removed or kept with the reason. | `store/work-store.ts`, `store/lifecycle.ts`, `work-queue/queue.ts` |
| Gap | `work next` without a usable Store keeps its typed Store outcome and code, and its next step now names the `docs/work/` files and `make-docs backlog snapshot`. A checkout that is not bound to a usable Store gets the same typed outcome, with the reason `work status` gives, instead of a "refused this work store write" message. It does not read or rank the files. | `work-queue/files-fallback.ts`, `work-queue/operations.ts` |

Generated files: `packages/cli/src/mcp/assets/backlog-review-v1.html` and `.ts`, and `packages/skills/backlog-review/scripts/agent-contract.mjs` and `report-contract.mjs`, rebuilt from the changed snapshot schema with `build-mcp-app-assets.mjs` and `build-backlog-presentation.mjs --all`.

### New Behavior

Each item below is new; no earlier text said it.

- A project URI read leaves sync conflicts out of readiness, because a conflict belongs to one checkout and a project URI names none. The read says so in one line. `work next` in a checkout still shows them.
- `resource.read` keeps `store: none` in its declared access, as PRD 25 R-ACCESS-2 and PRD 39 R-REG-EVOLVE-2 say, so harness command rules and Store-free system reads do not change. Only a project URI read runs the harness check for Store read and opens its own read-only Store session.
- `backlog snapshot` now declares Store-optional read (`store: read`, optional admission), as PRD 51 R-BACKLOG-SNAPSHOT-24 already said.
- The snapshot's `readiness` and `workStore` keys appear only in store mode, so a no-Store result is the same as before. Readiness facts hold no next action, so the snapshot gives no recommendation.
- A cleanup refuses while any unit of the project has a live claim.
- Native MCP `resources/read` of a project URI returns Markdown `text`, not a base64 `blob`, with the structured read in `_meta.makeDocs`. Project URIs are not listed in `resources/list`.
- `resource read --origin local` or `installed` on a project URI is refused, because a project URI has no projection.

### A20 and A21: the Snapshot Source

- A20: on a checkout with an absent Store, and on a checkout that is not bound to a usable Store, the operation result equals `buildBacklogSnapshot` apart from `generatedAt`, has no `readiness` or `workStore` key, and makes no Store folder.
- A21: on a bound checkout whose files and store agree, the result equals the file snapshot apart from the store-mode keys and the `store` capability. A store change that sync has not written yet (task T1 closed in the store only) shows as a checked task, the file keeps its bytes, and the sync check lists the file as `write`. With copies off and the copies removed, the records still come from the store. A live claim shows its claimant and handle, never its claim ID.

Store-mode sample (`make-docs backlog snapshot --target-root <project> --json`, a temporary project, excerpt):

```json
{
  "store": { "state": "available", "diagnosticCodes": [] },
  "workStore": {
    "authority": "store",
    "state": "read",
    "syncCheck": { "summary": "Sync check: the files and the store match.", "pending": [], "conflicts": [] },
    "refusal": null
  },
  "phases[1].readiness": {
    "source": "work-store",
    "status": "open",
    "state": "waiting",
    "doneBy": null,
    "waitReasons": [{ "reason": "dependency-open", "text": "Waits for W1 R0 P1 to close.", "coordinate": "W1 R0 P1" }],
    "liveClaim": null,
    "syncConflict": false
  }
}
```

The same project with `MAKE_DOCS_HOME` at an absent folder gives `"store": { "state": "not-used", "diagnosticCodes": [] }` and no `workStore` key.

### A32 and A34: Project URI Reads

Samples, run from a folder outside the project with the real CLI (`packages/cli/dist/index.js`):

```text
$ make-docs resource read make-docs://project/aurora/tasks/
# Quick items of aurora

- task 1: Compare two printers [open]
```

```text
$ make-docs resource read make-docs://project/aurora/backlog/w1/r0/p1
# W1 R0 P1: Phase 1: First

make-docs://project/aurora/backlog/W1/R0/P1/

- Kind: phase
- Status: open; the file records "active"
- Readiness: ready
- Claim: none
- File: docs/work/2042-06-01-w1-r0-aurora/01-first.md
- Links: none

Stages and tasks (5):
- W1 R0 P1 S1: Build [open; ready] make-docs://project/aurora/backlog/W1/R0/P1/S1
  - W1 R0 P1 T1: Build the parser. [open; ready] make-docs://project/aurora/backlog/W1/R0/P1/T1
  - W1 R0 P1 T2: Write the writer. [open; ready] make-docs://project/aurora/backlog/W1/R0/P1/T2
- W1 R0 P1 S2: Check [open; waiting] make-docs://project/aurora/backlog/W1/R0/P1/S2
  - W1 R0 P1 T3: Check it. [open; waiting] make-docs://project/aurora/backlog/W1/R0/P1/T3

Sync conflicts belong to one checkout, so this read does not show them. Run make-docs work next in a checkout to see them.
Changes nothing.
```

```text
$ make-docs resource read make-docs://project/nobody/tasks/
{"ok":false,"code":"resource-not-found","message":"The Store knows no project named nobody. The part that did not match: nobody.", ...}
$ make-docs resource read make-docs://project/aurora/backlog/W1/R0/P01/
{"ok":false,"code":"invalid-resource-uri","message":"Part 3 of the coordinate must be P and a number without a leading zero. ...", ...}
```

- A32: the `tasks` list text equals the file that `work export --quick` wrote, byte for byte, and equals `renderWorkTasksList`. The test moves the checkout folder away before the read, so the read opens no repository file. A system-resource read with the Store root at an absent folder succeeds and makes no Store folder. A project URI read with that Store root gives `store-unavailable`, and its next step says to read the `docs/work/` files of project `aurora` directly.
- A34: the same URI from two other folders gives the same result. `AURORA`, `Aurora`, `w1/r0/p1`, and no trailing slash read, and the result names the canonical URI. An unknown project, a quick item that does not exist, and a coordinate that does not exist give `resource-not-found` with the part that did not match; a part after a task, `P01`, quick item `0`, and a query give `invalid-resource-uri`. The project ID URI reads the same unit as the name URI.
- `work add` sample: `Read it from any folder: make-docs resource read make-docs://project/aurora/tasks/1`.

### T12: Work Rows of a Pruned Project

```text
$ make-docs work export --to <dir>/copies --quick <dir>/tasks.md --allow-write true
Exported 3 work files from the store to <dir>/copies.
Wrote 1 quick item to <dir>/tasks.md.
This export holds all of the project's work. Work digest: sha256:0e933bdb373edb1cc5e93199a797ff43c2187df1ff85e356771c3af40fea16c9.
$ make-docs work export --to <dir>/copies2 --allow-write true
This export does not hold all of the project's work, so it gives no work digest. Export with --to and no path filter, and with --quick when the project has quick items.
```

Tests: a prune with the digest removes exactly the pruned project's 2 units and leaves the other project's units; a prune without a digest, with a stale digest (a quick item added after the export), and with a live claim keeps the work rows and names why; a cleanup of a project that is still registered is refused. No command calls `pruneProjectFromStore` yet, so the cleanup has no CLI path (Store README, R-LIFE-2).

### `work next` Without a Usable Store

```text
$ MAKE_DOCS_HOME=<absent> make-docs work next --target-root <project>
{"ok":false,"code":"store-unavailable", ... "nextAction":"Restore access to the configured Make Docs Store, then retry only this operation. Until the Store is usable, the docs/work/ files are the authority. Read them directly, or run make-docs backlog snapshot, which reads them without the Store.", ... "details":{"projectRoot":"<project>","authority":"files","workFiles":["docs/work/",".make-docs/archive/work/"]}}
$ make-docs work next --target-root <checkout not bound>
{"ok":false,"code":"store-unavailable","reason":"The docs/work/ files are the authority, because this checkout is not bound to the Store.","nextAction":"Run make-docs setup in this checkout. Until the Store is usable, ...", ...}
```

PRD 52 R-WORK-STORE-2 says every work operation reads the files without a usable Store. Register D-068 asks the owner whether to keep this pointer (option A, built) or to make `work next` read and rank the files (option B).

### PRD Changes

- PRD 52: R-WORK-STORE-10 (the export digest), new R-WORK-STORE-13 (the scoped cleanup), R-WORK-QUEUE-18 (the URI in the `work add` result), and R-WORK-URI-3 (no checkout conflicts in a project URI read), with a Requirement History entry.
- PRD 51: R-BACKLOG-SNAPSHOT-13, -31, and -32 (the read-only sync check, store-mode-only keys, and where a refusal goes), with a Requirement History entry.
- PRD 25 R-ACCESS-2 and PRD 39 R-REG-EVOLVE-2 and the resource command lines (a project URI read opens its own read-only Store session; system reads stay Store-free), each with a Requirement History entry.
- Register D-068 (open).

### Checks

- `npx tsc --noEmit -p .` and `npm run build` in `packages/cli`: pass. The build's MCP app asset check passes after the regenerated widget.
- `tests/w29-r0-p4-second-pass.test.ts`: 21 tests pass. With it, the W29 P1 to P4 tests, `work-store-contract`, the backlog snapshot tests, the resource and MCP resource tests, the Store lifecycle and verification tests, the harness access tests, `mcp-derivation`, `registry-contract`, the name catalog, and `consistency` pass.
- Tests changed: P4 `work add` now expects the quick item's URI (finding 5 closed by T10); the snapshot surface test expects Store-optional read; the Store lifecycle prune test expects the `workRows` outcome; the W26 P3 cross-interface test expects the store-mode snapshot on its bound checkout with a Store read grant. That last test is also a live MCP call of `backlog_snapshot` in store mode.
- `npm run validate:defaults -w packages/cli`: 53 tests pass.
- `bash scripts/check-instruction-routers.sh`: pass, run outside the sandbox because the sandbox blocks its system temporary folder.
- `check prd`: passed, 37 PRD files.
- `project paths validate`: `valid: true`. `project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption`: no problems in 386 files. Both ran with a temporary `MAKE_DOCS_HOME`.

### Full Test Suite

`npx vitest run --reporter=json` in `packages/cli`, counted from the JSON report: 148 test files, 145 passed and 3 failed. Of 3,335 tests, 3,325 passed, 4 failed, and 6 were skipped. Three failures are known and exist without this pass: `mcp-app-contract` (two tests, a Node v26 deprecation warning on stderr) and `p5-migration-safety` fixture 11 (sandbox only). The fourth, `w26-p3-cross-interface`, expected `not-used` from a snapshot on a bound checkout with a Store read grant; that is now store mode by design, so the test now expects it, and that file passes on rerun (2 tests). The full suite was not run again after that one test change.

### Limits

- No test calls a project URI through a live stdio MCP transport. The review fixes below add MCP tests through the tool handler and the native `resources/read` handler with a real generic MCP client grant.
- Old installed copies of the backlog-review Skill validate snapshot JSON with a strict schema. In store mode they refuse the new `readiness` and `workStore` keys. A Skill installed with this CLI version has the new bundles. No released version has the work store yet.
- The cleanup has no command, and sync ledger, conflict, and first-sync rows go with their checkout (`ON DELETE CASCADE`), not with the cleanup.
- The P5 agent form does not describe project URI reads, the snapshot source, or the cleanup yet. P5 owns that text.

## P4 Second Pass Review Fixes

An independent review of the second pass needed changes. Evidence date: 2026-11-23. The worktree was fast-forwarded to `main` at `f1aaa63d` first, with the work kept uncommitted; PRD 39 Requirement History kept both new entries (D-067 Part A and this pass). One high finding, old Skill copies against the new snapshot keys, waits for an owner choice, so the snapshot default did not change.

| Item | Fix | Tests |
| --- | --- | --- |
| 2 (medium) | An agent's project URI read uses the harness grant of the folder where the agent works: a Store read grant there allows every project URI, also another project's. When that folder is not a Make Docs project, the read is refused as `store-not-configured` with a plain reason and the next step "Start the agent in a Make Docs project whose harness access allows Store read, then read the project URI from there." It never tells the person to set that folder up. A project folder with no grant keeps its setup step, which names that working folder, and the reason now says that the working folder's grant decides. The direct CLI route needs no grant, as before. The review fix also found that native MCP `resources/read` of a project URI sent no MCP connection, so a granted agent was refused; it now sends it, as a tool call does. | MCP tool and native read with a real generic MCP client grant, reading another project's URI; MCP from a folder that is not a project; MCP from a project with no grant; the CLI binary from a folder that is not a project and from the granted project. |
| 3 (low) | `backlog snapshot` runs the harness check before it reads any Store state. A refused caller gets the file facts and `workStore.refusal`; with no Store database file at all, it gets the plain file snapshot (A20). The only check before the harness check is that file test, which reads no Store state. | A refused MCP caller in a bound checkout; a refused MCP caller with no Store, whose result equals the file snapshot. |
| 4 (low) | Safer path chosen: a complete `work export` also writes the files of units whose repo copy a person removed (an accepted deletion), names them in `removedCopies` and in its text, and only then gives a `workDigest`. So the T12 cleanup can never remove a unit that no export wrote. | A deleted file, `--accept-deletion`, then a full export that writes the removed file outside `docs/work/` and names it. |
| 5 (low) | `work next` with no Store database has one next step: reason "This computer has no Make Docs Store, so the work store cannot be read. Nothing changed." and next step "Run make-docs setup to create the Store, then run this command again.", then the `docs/work/` step. The same applies to project URI reads and store-mode snapshot reads. | `work next` on the direct CLI route with an absent Store. |
| 6 (low) | Recorded here: a read-only Store read can leave a `store.db-wal` file of 0 bytes and a `store.db-shm` index file next to `store.db`. SQLite makes them when it opens the database in WAL mode. The Store data does not change. The W26 P3 byte checks already leave these two files out. | none |

New behavior: the working-folder grant rule (item 2) and the export of removed-copy files (item 4) are new. PRD 25 R-ACCESS-2, PRD 39 R-REG-EVOLVE-2, PRD 51 R-BACKLOG-SNAPSHOT-11, and PRD 52 R-WORK-STORE-10 and R-WORK-STORE-13 say so, each with a Requirement History entry.

Samples:

```text
MCP resource_read make-docs://project/aurora/tasks/ from a folder that is not a project:
code: store-not-configured
reason: The folder where this agent works, <folder>, is not a Make Docs project, so the agent has no Store read grant for project URIs. A Store read grant in the project where the agent works allows every project URI.
next: Start the agent in a Make Docs project whose harness access allows Store read, then read the project URI from there. Until the Store is usable, read the docs/work/ files of project aurora directly in a checkout of it, or run make-docs backlog snapshot there, which reads them without the Store.

$ MAKE_DOCS_HOME=<absent> make-docs work next --target-root <project>
reason: This computer has no Make Docs Store, so the work store cannot be read. Nothing changed.
next: Run make-docs setup to create the Store, then run this command again. Until the Store is usable, the docs/work/ files are the authority. Read them directly, or run make-docs backlog snapshot, which reads them without the Store.
```

Tolerant snapshot schema: not changed. PRD 51 R-BACKLOG-SNAPSHOT-30 requires installed Skill copies to validate snapshot JSON against "the bundled strict schema", so that a mismatch between an older Skill and a newer CLI fails clearly instead of being misread, and R-BACKLOG-SNAPSHOT-10 requires a new schema version for a breaking change. A schema that passes unknown keys would break that rule. A change needs the owner's choice, which the pending high finding covers.

Register D-068 stays open; R-WORK-STORE-2 did not change.

### Checks

The review fixes and the owner decisions were checked together; see the checks of the owner decisions section below.

## P4 Owner Decisions (2026-11-23)

Two owner choices, applied in the same worktree after the review fixes.

### Old Skill Copies: Option A, Opt-in

- The default `backlog snapshot` output is exactly as before in every mode: schema version 2, `store` capability `not-used`, no `readiness` or `workStore` key, and the files' own text. It reads no Store state and runs no harness check.
- The store-mode facts are opt-in: `make-docs backlog snapshot --target-root <project> --work-store` on the CLI, and the argument `workStore: true` on the `backlog_snapshot` MCP tool. Leaf help names `--work-store`. With the option, T7 works as built in the second pass and its review fixes.
- The backlog-review Skill reads none of the new keys, so its text does not ask for them. Its bundles were rebuilt and the byte-match test passes; the bundles did not change, because the schema did not change.
- Proof with this repository's old installed `.agents/skills/backlog-review/scripts/agent-contract.mjs` (not changed): its `validateBacklogRebuiltModel` parses the snapshot with its strict schema first, and only then checks that the report belongs to the snapshot. With a fixture report, a snapshot that the old schema accepts fails only that later check. On a Store-mode checkout made with the real CLI:

```text
default snapshot  -> Rebuilt model must match the latest checked source facts.   (the old schema accepted it)
--work-store      -> unrecognized_keys "readiness" at records[0].phases[0] ...   (the old schema refused it)
```

The test `this repository's old installed backlog-review Skill accepts the default snapshot, and refuses the opt-in one` checks both. New behavior: the `--work-store` option.

### Register D-068: Option A

`work next` without a usable Store keeps the typed Store outcome and the pointer to `docs/work/` and `make-docs backlog snapshot`. PRD 52 R-WORK-STORE-2 now says: the queue commands that need the Store return the typed Store outcome; the read-only `work next` also names the files and the snapshot; `work status` reports the file authority; file-reading commands read the files. The write commands (`sync`, `claim`, `release`, `report`, `close`, `export`, `add`) return the typed outcome without that pointer, so the PRD says only what the code does. D-068 is closed in the register.

### PRD Changes

- PRD 51 R-BACKLOG-SNAPSHOT-1, -11, -13, -24, and -31, with a Requirement History entry that names the owner decision.
- PRD 52 R-WORK-STORE-2 and the PRD 51 integration line, with a Requirement History entry that names both decisions.
- Register D-068 closed.

### Checks

- `npx tsc --noEmit -p .` and `npm run build` in `packages/cli`: pass; the build's MCP app asset check passes.
- `tests/w29-r0-p4-second-pass.test.ts`: 31 tests pass, among them the MCP tool and native reads with a real generic MCP client grant and the CLI binary from folders with and without a grant.
- Backlog-review Skill bundles rebuilt with `build-backlog-presentation.mjs --all`; `backlog-review-skill-bundles` (the byte-match test), `backlog-review-skill`, `backlog-snapshot-schema-version`, and the W33 leaf help and command tests pass.
- `check prd`: passed, 37 PRD files. `project paths validate`: `valid: true`. `project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption`: no problems in 386 files. All with a temporary `MAKE_DOCS_HOME`.
- `bash scripts/check-instruction-routers.sh`: pass, run outside the sandbox because the sandbox blocks its system temporary folder.

### Full Test Suite

`npx vitest run --reporter=json` in `packages/cli`, on `main` at `f1aaa63d` with this work uncommitted, after the review fixes and both owner decisions, counted from the JSON report: 148 test files, 146 passed and 2 failed. Of 3,346 tests, 3,337 passed, 3 failed, and 6 were skipped. All three failures are known and exist without this work: `mcp-app-contract` (two tests, a Node v26 deprecation warning on stderr) and `p5-migration-safety` fixture 11 (sandbox only).


### P4 Second Pass Integration

- The re-check passed the second pass. Two of its three low wording items were fixed at integration: the MCP description for tools with optional Store access no longer talks about the review cache, and PRD 51 R-BACKLOG-SNAPSHOT-31 now says that a `--work-store` caller whom the harness refuses gets `workStore.refusal`, as R-BACKLOG-SNAPSHOT-11 allows.
- Follow-up: when only the Store grant is missing, the next step of a project URI refusal still begins "Until the Store is usable", although the Store itself is usable. It should name the missing grant.
- Lead decision: without a usable Store, only `work next` points to the `docs/work/` files and `make-docs backlog snapshot`. The write commands keep the plain typed Store error, because they need the Store to act. PRD 52 R-WORK-STORE-2 says exactly this.

## P5 Agent Twin and Config

Covers T1 to T10 and A22 to A24 in [P5](05-agent-twin-and-config.md). Evidence date: 2026-11-23. Branch: `t3/w29-r0-p5-agent-twin-config` from `a7e516cb` on `docs/w29-w30-work-store-and-factory`. Node `v26.13.1`. CLI package version `2.0.9`. Every test and command ran with a temporary `MAKE_DOCS_HOME`; nothing read or wrote the real Store.

### What Was Built

| Task | What it does now | Files |
| --- | --- | --- |
| T1, T2, T7 | The agent twin `make-docs://system/reference/work-store.md`. It states that it is the twin of the work operations, that both forms share the catalog `make-docs.work-store-rules.v1` and its rule IDs, and that a change to either form needs a review of the other. Sections: Purpose (the nine commands and MCP tools), Authority, Repo Copy, Sync (with the sync table and the settle choices of each conflict kind, also `claimed`), First Import (recorded status map and dependency bullets), Units, Readiness (every wait reason with one next action), Claims, Report and Close, Tracker Connections (with the `work` block), Quick Items, and Project URIs. A checkout without the CLI or a Store reads `docs/work/` directly and has no claims, notes, met-gate records, or quick items. | `packages/docs/template/.make-docs/system/references/work-store.md` |
| T9 | Rules `WORK-RULE-041` to `WORK-RULE-054` in the catalog: same work on both sides (R-WORK-SYNC-14), a move (-15), a unit that leaves its file (-16), a file edit never acts for a claim (-12, -16), the hold list (-17), settle (-18), the first sync only imports (-9), a changed copy with copies off (R-WORK-STORE-10), a bullet with the unit's own title (R-WORK-SYNC-13), the private claim ID (R-WORK-QUEUE-19), notes and store-only edits (R-WORK-QUEUE-8), the read-only sync check (R-WORK-SYNC-8), no Store or no CLI (R-WORK-STORE-2, -6, R-WORK-URI-6), and export (R-WORK-STORE-10, -13). Fixtures `WSF-058` to `WSF-069`, among them a new fixture kind, `sync-scenario`. | `packages/cli/src/operations/work/work-store/catalog.ts`, `packages/cli/tests/fixtures/work-store-contract.ts` |
| T3, T4 | The `work` block holds `projection` (default `on`), `syncHold`, and `tracker` (`connection: local` and a field map). Config validation names each state or secret key, such as a digest, an ID, a receipt, a claim, a revision, or a token, with code `work-block-state-field`, and refuses a field map value that looks like a key. | `packages/cli/src/operations/work/work-store/schemas.ts`, `packages/cli/src/config.ts` |
| T5 | The template body is copied byte for byte to `packages/cli/template/` and to `.make-docs/system/references/`. Both catalogs list it in the `workflow` and `backlog` profiles, and the installer's reference list holds it. | `.make-docs/system-resources.catalog.json` (both), `packages/cli/src/rules.ts` |
| T6 | The `docs/work/` router and the references router name `work-store.md`, in the template and the dogfood copy. | `docs/work/AGENTS.md`, `docs/work/CLAUDE.md`, `.make-docs/system/references/AGENTS.md`, `.make-docs/system/references/CLAUDE.md`, and their template sources |
| T8 | Config validation of `projectName` existed since W32 R0 P3 (R-CONFIG-STATE-9). Setup now shows the name, or proposes one from the checkout folder name in the R-ID-8 form, in its plan text and in `project.name` and `project.nameProposal` of its JSON result. It writes nothing for it. | `packages/cli/src/store/project-register.ts`, `packages/cli/src/cli.ts` |
| T10 | The doctor check `phase-status-line`. It finds a phase file under `docs/work/` with no front matter `status` whose tasks are all checked and whose `Tasks` sections have no unchecked box, and its fix adds `status: "completed"`. The agent twin `project-doctor.md` has the same rules and a shared example that the test reads. | `packages/cli/src/operations/project/doctor/phase-status-line.ts`, `index.ts`, `packages/cli/src/run/root-operations.ts`, `project-doctor.md` |

### New Behavior

- Setup shows a proposed `projectName` and does not write it. A linked git worktree proposes the folder name of its main checkout, because a worktree folder often has a generated name. Writing the name would turn every setup of an existing project into a config change.
- The `phase-status-line` check skips each path on `work.syncHold` and names it as skipped by that check. `task-id-case` still reads held paths, so the W22 R2 doctor run of register D-063 stays possible. `--exclude` leaves a path out of every check.
- A phase file with no front matter gets front matter that holds only the status line.
- `project doctor check` on this repository now exits 1, because it has findings.

### A22: Bytes

The P5 test compares `work-store.md` and `project-doctor.md` in the template, the bundled package copy, and the dogfood copy, the catalog entry in both catalogs, and the router copies. All match.

### A23: Twin Parity

- The test reads the sections of `work-store.md`. Every catalog rule ID is in the section that its agent form names, and every rule ID in the text is in the catalog. It fails when a rule ID is on one side only, like `w34-r0-p2-skill-check-twins.test.ts`.
- The text's sync table equals `WORK_SYNC_TABLE` row for row. Each conflict kind lists its catalog settle choices, and `claimed` names the release and never `keep-file`. Each wait reason, recorded status word, and claim time matches the catalog. The `work` block example in the text is a valid block.
- The ten `sync-scenario` fixtures run through the real sync, and `WSF-067` (a title bullet) and `WSF-068` (a progress note) run through the P3 and P4 code.

### A24: Config

```text
work.lastAppliedDigest holds a digest. The work block holds shared intent only: projection, syncHold, and tracker. Make Docs keeps this state in the Store. Remove the key.
work.tracker.apiToken holds a secret. The work block holds shared intent only: projection, syncHold, and tracker. A secret stays with the tool that owns it. Remove the key.
work.tracker.fieldMap.status: A field map value looks like a key or a token. The field map names fields only, never a secret.
```

### T8 Sample

```text
Project name: none. Proposed: paper-plans, from the checkout folder name. To use it, add projectName: paper-plans to .make-docs/config.yaml. You can choose another name: lower-case letters, digits, and hyphens, starting with a letter.
```

### T10: This Repository

`make-docs project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption --target-root .` with a temporary `MAKE_DOCS_HOME`:

```text
Found 79 phase files with no status line whose tasks are all checked. Nothing changed.
```

It read 386 files, skipped 2, and excluded 6. No held path was skipped by the check, because the W22 R2 backlog was excluded. The 79 files are the same 79 that `work next` counted as done by the fallback in P4. `fix` was not run on this repository's files: a repository-wide fix needs the owner's approval.

### Checks

- `npx tsc --noEmit -p .` and `npm run build` in `packages/cli`: pass.
- `tests/w29-r0-p5-agent-twin-and-config.test.ts`: 37 tests pass.
- With it, all W29 tests, `work-store-contract`, the doctor tests, `config`, the setup tests, `consistency`, the resource and router tests, `mcp-resource-profiles` (counts updated for one more resource), `w32-r0-p3-project-register`, and `w34-r0-p2-skill-check-twins`: 29 files and 986 tests pass.
- `npm run validate:defaults -w packages/cli`: 53 tests pass.
- `bash scripts/check-instruction-routers.sh`: pass, run outside the sandbox because the sandbox blocks its system temporary folder.
- `check prd`: no diagnostics. `project paths validate`: `valid: true`.

### Full Test Suite

`npx vitest run --reporter=json` in `packages/cli`, counted from the JSON report: 149 test files, 147 passed and 2 failed. Of 3,385 tests, 3,376 passed, 3 failed, and 6 were skipped. All three failures are known and exist without this phase: `mcp-app-contract` (two tests, a Node v26 deprecation warning on stderr) and `p5-migration-safety` fixture 11 (sandbox only).

A mutation check removed one rule ID from the resource: the twin test failed and named `WORK-RULE-049` and its section. The resource was then restored. After the suite, one sentence of the resource changed (the expected version is named for claim, release, report, and close only); the P5 test and the task ID resource test passed again on the final bytes.

### Review Fixes

An independent review of P5 asked for small changes. Each is fixed with tests in `tests/w29-r0-p5-agent-twin-and-config.test.ts`.

| Item | Fix |
| --- | --- |
| 1 (medium) | A phase file with front matter and mixed line endings got a second front matter block. The check now finds front matter with `/^---\r?\n/`, keeps each line's own ending, and gives each new line the ending of the file's first line. Tests: an LF file with one CRLF line, a CRLF first line in an LF file, and a file with no front matter. |
| 2 (medium-low) | `looksLikeSecret` refused real camelCase field names with digits. It now splits a name into words at `_`, `.`, `-`, upper case, and digits, and refuses only a run of 32 or more letters and digits, or a name of four or more words where most words have one or two characters. `customField10023Value` and `issueLinksAndRelatedItems2024Q` are accepted. |
| 3 (low) | The fix sentence is built from its parts: "Added 79 status lines in 79 files.", "Changed 1 task ID and added 4 status lines in 4 files.", and for a dry run "Would add 2 status lines in 2 files." and "Would change 1 task ID and add 4 status lines in 4 files." |
| 4 (low) | State and secret key words matched inside other words. Keys are now split into words, each word compares whole (with a plural `s` or `es` removed), and `id` or `uuid` match only as the last word. `author`, `valid`, `idea`, `identity`, and `handler` pass to the plain unknown-key refusal. `apiKey`, `api_key`, and `privateKey` match as two-word names. |
| 5 (low) | `work-store.md` names the opt-in `backlog snapshot --work-store` (MCP `workStore: true`). Template first, then the byte-identical dogfood copy. The resource and `project-doctor.md` also state the new field name and line ending rules. |
| 6 (low) | New fixture kind `report-scenario`: `WSF-070` (a 257-character note is refused before the sync, so a file edit is not imported either; 256 characters are accepted), `WSF-071` (a new note replaces the last), and `WSF-072` (a status that the file cannot show stays in the store, and `work report` names it). They run through the real `work report`. |
| 7 (low) | Test examples use generic names: `tracker_field_7` and `wt-1234abcd`. |

PRD 39 R-DOCTOR-8 now states the line ending rule.

Checks after the review fixes, all with a temporary `MAKE_DOCS_HOME`:

- `npx tsc --noEmit -p .` and `npm run build` in `packages/cli`: pass.
- `tests/w29-r0-p5-agent-twin-and-config.test.ts`: 45 tests pass. With all W29 tests, `work-store-contract`, the doctor, config, setup, resource, router, and `consistency` tests: 29 files and 994 tests pass.
- `npm run validate:defaults -w packages/cli`: 53 tests pass. `bash scripts/check-instruction-routers.sh`: pass, run outside the sandbox. `check prd`: no diagnostics. `project paths validate`: `valid: true`.
- `project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption` on a temporary copy of `docs/work/` and the config: 79 phase files, 386 files read. Without the exclusion, the copy also shows the 32 known lower-case task IDs in the W22 R2 backlog, and no held phase file needs a status line. `fix` was not run on this repository's files.
- Full suite, `npx vitest run --reporter=json`, counted from the JSON report: 149 test files, 147 passed and 2 failed. Of 3,393 tests, 3,384 passed, 3 failed, and 6 were skipped. The three failures are the known ones: `mcp-app-contract` (two tests) and `p5-migration-safety` fixture 11.

### Owner Decision: `projectName` in Setup

Setup proposes `projectName` and never writes it, as built. The owner chose this on 2026-11-23. Writing the name would turn every setup of an existing project into a config change.

### Limits

- The agent twin is prose. Its parity is checked through its tables, its rule IDs, and the shared fixtures, not by an agent run.
- Setup proposes `projectName` and does not write it, so a project has no name until a person adds it.
- The 79 status lines on this repository wait for the owner's approval of a repository-wide fix.

## P6 Package Parity and Acceptance

Covers A25 to A30 in [P6](06-package-parity-and-acceptance.md). Evidence date: 2026-11-23. Branch: `t3/w29-p6-package-parity-acceptance` from `31891c2b` on `docs/w29-w30-work-store-and-factory`. Node `v26.13.1`. CLI package version `2.0.9`. Every run used a temporary `MAKE_DOCS_HOME` and `HOME`; nothing read or wrote the real Store. Setup never ran on this worktree or the main checkout: the dogfood proofs used a temporary clone of this repository at `31891c2b`. In the samples, `<temp>` stands for a temporary folder.

### Package Candidate

| Field | Value |
| --- | --- |
| Candidate | A branch build, not a release. The package reports version `2.0.9` because this branch has not changed the version; each candidate is identified by its tarball SHA-256. Packed with `npm pack` in `packages/cli` after `npm run build`, from `31891c2b` plus the P6 changes below. |
| Tarball SHA-256 | `66eaca5f8e5cad123385bb1d7387a9caf259149bed897c4594da1cbec55bbb94` (151 files), with the five fixes below. T2 to T5, the MCP check, and `PERF-004` ran on it. |
| Review candidate | `c1a3d2e752771f4dc2c08179674f0e3bc6fa7a02ca95490099ba12d4e638fded`, after the review fixes (the blocked-reason punctuation and a moved code comment). The kept proof script ran T2 to T5, the MCP check, and the owner samples again on it. |
| Final candidate | `373fa0dacf0f55c76a4e22b895fdecac248a0175c65c3a0d66cad647449b2a08` (151 files), after the owner decisions (D-069 option B, the closed-parent advice, and the new doctor check). `npm run smoke:pack:local` packed this same tarball and passed. The kept proof script ran on it, and its redacted log is the one kept. Its output equals the review candidate's run, apart from the temporary path length in two byte counts and the new doctor check's 17 findings in the T4 doctor comparison (the older checks' findings still match the pre-Wave build exactly). |
| Install | `npm install <tarball>` in a new temporary folder; every proof ran that installed `make-docs` command. |
| Pre-Wave build for comparison | `93814f27`, the last commit before W29 R0 P2, built in a temporary clone. W29 R0 P1 added only the contract. |
| Proof script | [installed-proofs.sh](evidence/p6/proofs/installed-proofs.sh) with its helpers ([sum.mjs](evidence/p6/proofs/sum.mjs), [rev.mjs](evidence/p6/proofs/rev.mjs), [mcp-proof.mjs](evidence/p6/proofs/mcp-proof.mjs)) runs T2 to T5, the MCP check, and the owner samples. It takes every path as an argument and builds the fixture backlog itself. The first copy lived in a temporary folder and was deleted with it; the kept copy is the same steps, rebuilt after the review, and its run on the final candidate is kept, redacted, as [installed-proofs-run.log](evidence/p6/proofs/installed-proofs-run.log). Two earlier candidates ran the same steps while P6 fixed the defects below. |

### Defects Found and Fixed

The installed runs found five wording defects. P6 fixed each one with a test in `packages/cli/tests/w29-r0-p6-package-parity.test.ts`. No PRD changes: each fix makes the output match its PRD 52 rule.

| # | Defect, as the installed CLI showed it | Fix |
| --- | --- | --- |
| 1 | A blocker that ends with a period showed two: "Blocked: The owner has not chosen a schema format..". | The wait reason drops a blocker's own final period, and after the review it adds no period after a text that ends in `?` or `!` ("... Is the format final?"). `readiness.ts`. |
| 2 | `work close` listed the close under "Store-only edits (the file copy does not show them)", and in the same result said "The next sync shows it in ...". The P4 sample had the same line. | When the next sync can write the file, store-only edits compare the store with what the writer renders, not with the last applied text. A close shows as store-only only when the path is held or copies are off. A status the file cannot show (such as `in-progress`) and a cleared blocker stay store-only (R-WORK-QUEUE-8). `sync.ts` `workStoreOnlyEdits`, `queue.ts`. |
| 3 | Closing a phase that had no claim said "Closed W22 R2 P4 as done, and released its claim. Closing every task does not close its phase." | "and released its claim" shows only when a claim existed, and the phase sentence only for a task. `queue.ts`. |
| 4 | `work status` with a held file that differed from the store said "Sync check: 1 file to write. The next work write command ... applies the changes.", but sync never writes a held path. | The read-only check counts a held file apart: "Sync check: 1 held file differs from the store, and sync never writes it." (R-WORK-SYNC-8, R-WORK-SYNC-17). `sync.ts` `summarizePreview`. |
| 5 | An unreadable file gave "Sync check: 1 unreadable file. The next work write command, or make-docs work sync, applies the changes." Sync never changes an unreadable file. | "Sync check: 1 unreadable file. Fix each unreadable file. Sync leaves it untouched." With other changes, both sentences show. `sync.ts`. |

### Installed First Import (T2)

Clean fixture project (git, one three-file backlog): `setup --yes` with the three harness methods `none` made a schema 8 Store and bound the checkout. The first work command, `work status`, ran the read-only check: "This checkout has not synced yet. The first work write command imports every backlog and writes no file. Sync check: 3 files to import." Then `work sync`: "First sync of this checkout: 3 work files and 10 units entered the store. Make Docs wrote and removed no project file." The backlog files did not change.

Temporary clone of this repository (the dogfood instance): plain `setup --yes` stopped with "The reviewed plan does not permit migration (ambiguous-ownership)", because a new Store has no record of the clone's saved project ID. `setup --yes --adopt` completed. It changed only the harness lines of `.make-docs/config.yaml`, as the methods `none` ask. The first import: "First sync of this checkout: 463 work files and 4150 units entered the store. Make Docs wrote and removed no project file." `git status` showed no change under `docs/work/` or `.make-docs/archive/work/`. `work status` then said: "955 open units: 105 ready, 850 waiting. ... Sync check: the files and the store match. Sync never writes these held paths: docs/work/2026-11-13-w22-r2-portable-checkout-adoption."

### Two Checkouts That Share Git (A25, T3)

Checkout A is the clone above. Checkout B is a `git worktree` of it, registered with `project checkout preview` and `project checkout apply --review <digest>` ("Effect: new-checkout-binding. Project files: unchanged."), then `setup --yes --adopt`. Both use one temporary Store. A fixture backlog was committed in A for short output.

| Sync result | What happened on the installed package | Result |
| --- | --- | --- |
| First sync of a second checkout | B: "First sync of this checkout: 0 work files and 0 units entered the store. ... 466 files already matched the store, so Make Docs recorded them as synced." | Pass |
| `import` (new file) | A, after the backlog commit: "Sync: 3 files imported, 0 files written, 0 copies removed." | Pass |
| `write` (store changed, file did not) | A: claim and close `W1 R0 P1 T1` through the store, then sync: "1 file written"; the file now shows `- [x] T1`. | Pass |
| Same work on both sides | B merges A's commit, then sync: "1 file already matched the store, so Make Docs recorded it as synced." No conflict. | Pass |
| `import` (a teammate's hand edit) | B removes the P2 blocker by hand and commits; A merges. A's `work next` says "Sync check: 1 file to import." A's sync imports it, and `W1 R0 P2` is ready. | Pass |
| `both-changed` conflict | A closes `T2` and writes the file; B, before it merges, edits the same file. B's sync stops that file, shows both sides per unit, names the units that wait, and gives two settle commands. | Pass |
| Settle with a stale revision | "The store revision of ... is 12, not 11. Make Docs did not settle ..., and nothing changed." | Pass |
| Settle `--keep-store` | "Settled ... (both-changed) with --keep-store"; the file is written from the store, and B's hand edit is gone. | Pass |
| `file-deleted` conflict, `--restore` | B deletes a work file: the conflict names restore and accept-deletion. `--restore` writes it back. | Pass |
| `--accept-deletion`, then `remove-copy` | B accepts the deletion; the units close as superseded. A's next sync: "1 copy removed." | Pass |
| `claimed` conflict | A claims `W1 R0 P3 T1`; B checks that task by hand. B's sync stops the file: "The file closes W1 R0 P3 T1, and builder-a holds it on a live claim until ...". The choices are the holder's release and `--keep-store`. `--keep-file` is refused. After A releases its claim, B's next sync imports the file. | Pass |
| Held path | A closes `W22 R2 P4` through the store. Sync: "Held, not written: docs/work/2026-11-13-w22-r2-portable-checkout-adoption/04-first-sync-after-adoption.md. ..."; the file did not change. `work status`: "Sync check: 1 held file differs from the store, and sync never writes it." A settle on that held path is refused. B's hand edit of another held file is imported. | Pass |
| `report-unreadable` | B breaks a file's front matter: "Cannot read ..., line 1: The front matter opens on line 1 and never closes with `---`. The file is untouched." Fixed again, the next sync is clean. | Pass |

Not reached with two checkouts: the `store-missing` and `unclear` conflict kinds and the copies-off rows. Normal use does not produce them; the P3 and P4 tests and the P5 sync scenarios cover them.

### Without Store Access (A26, T4)

A fresh clone of this repository, not set up, in two states: no Store at all, and a usable Store that this checkout is not bound to. The pre-Wave build (`93814f27`) and the candidate ran the same commands.

| Command | Both states |
| --- | --- |
| `backlog snapshot --json` | Same bytes as the pre-Wave build, apart from `generatedAt` (4,991,315 bytes compact). |
| `backlog snapshot --work-store --json` | Same bytes as the default snapshot: no `workStore` or `readiness` key, store capability `not-used`. |
| `work item resolve` (coordinate and path) | Same output and exit code. |
| `project paths validate`, `check prd` | Same output and exit code. |
| `project doctor check` | Same findings and files for the older checks. The candidate adds the P5 check `phase-status-line` (0 findings here) and, on the final candidate, the P6 check `phase-open-under-completed-index` (17 findings here, the finished phases under a completed index). |
| `work evidence read` | Same output and exit code with the pre-W29 config. With this repository's config, the pre-Wave build refuses its `work` block (an unknown key), and with a schema 8 Store it refuses the Store as newer. See Limits. |
| `work status` | "The docs/work/ files are the authority, because this computer has no Make Docs Store." or "... because this checkout is not bound to the Store.", each with "Read and edit the docs/work/ files directly." |
| `work next` | `store-unavailable`, with "Until the Store is usable, the docs/work/ files are the authority. Read them directly, or run make-docs backlog snapshot, which reads them without the Store." (register D-068). |
| Project files | No change in either state. The read commands made no Store. |

Fixed after the owner's decision (see [P6 Owner Decisions](#p6-owner-decisions-2026-11-23)). Before the fix, with no Store at all, the work write commands (`sync`, `claim`, `report`, `close`, `release`) failed in three ways. Rechecked on the review build in a temporary clone, one new temporary `MAKE_DOCS_HOME` for each command:

1. Wrong code: each returns `work-store-refused` ("This checkout is not bound to the Store, so it has no sync ledger."), not the typed Store outcome with its `store-*` code that [PRD 52](../../prd/52-work-store-and-work-queue.md) R-WORK-STORE-2 requires. For the same state, `work next` and `work evidence read` return `store-unavailable`. An agent that handles Store problems by their `store-*` code does not see this as a Store problem.
2. A false claim: the message says "Make Docs refused this work store write, and nothing changed."
3. A side effect: the shared Store session creates a new, empty Store before the refusal, so the next `work status` says "not bound" instead of "no Make Docs Store".

The write commands from before W29 (`work evidence record`, `lifecycle start`) also create a Store when none exists, but they then do their work. Register [D-069](../../prd/03-open-questions-and-risk-register.md) gave the owner two options: A, keep it and change PRD 52; or B, refuse with the `store-*` code and create nothing. The owner chose B on 2026-11-23, and it is built: see [Register D-069, Option B](#register-d-069-option-b).

### Folder Without Git (A27, T5)

A folder with no `.git` ("fatal: not a git repository") and the fixture backlog: `setup` completed, then `work sync` (first import of 3 files), `work next --level task`, `work claim`, `work report --status in-progress --note "Parser reads the front matter."`, `work close`, and `work sync`, which wrote `- [x] T1: Build the parser.` Every command passed.

### MCP on the Installed Package

On a fixture project with a generic MCP client grant (`setup system --generic-mcp-client` and `setup --generic-mcp-client`), an MCP client over stdio listed all nine `work_` tools, and `work_status` gave the CLI text. `work_next` gave the same ready list, wait list, and summary as `work next --json`. `work_claim` without `allowWrite` was refused: "Operation `work.queue.claim` mutates state and requires write permission ... MCP allowWrite=true". With `allowWrite`, `work_claim` returned the claim ID once, and `work_close` closed the task.

### Run Of PERF-004 (A28)

The run binds the [PERF-004 profile](06-package-parity-and-acceptance.md#perf-004-automatic-sync-on-a-project-with-many-backlogs), version `1`, digest `sha256:2c96dd6a021633f58e46b3f215cc2c16816ac04e632ece8b5841b722011fcffd` (SHA-256 of the profile text from its heading to the end of its lineage table, with the digest field as `{{DIGEST}}`; a P6 test checks it). The digest at run time was `sha256:0b896b1b061b5620d2350831ef5eb5cf7f277111ad8fc97ef191cd42c6d63999`. After the review, the Workload field names the plain setup that ran before `setup --adopt`, and Finding Links names FOLLOW-UP-P6-SETUP-ADOPT; the version stays `1` because no timed command, boundary, analysis, or outcome rule changed. The ledger in the profile records this and why PERF-004 was not rerun after the harness got more stop checks. Budget event `W29-R0-P6-PERF-004-1`: three runs, each on a fresh clone of this repository and a fresh Store, with the installed candidate. Redacted raw results: [perf-004-results.json](evidence/p6/performance/perf-004-results.json); [harness](evidence/p6/performance/perf-004-harness.mjs).

| Command | Median (ms) | Range (ms) |
| --- | --- | --- |
| `make-docs --version` (floor) | 84 | 83 to 87 |
| First import | 1,380 | 1,358 to 1,384 |
| `work sync`, no change | 386 | 382 to 398 |
| `work next` | 330 | 324 to 408 |
| `work status` | 351 | 340 to 375 |
| `backlog snapshot --work-store --json` | 3,245 | 3,196 to 3,656 |
| `backlog snapshot --json` | 2,909 | 2,886 to 3,354 |

Outcome `pass`. Every correctness condition held in every run. The fast-path decision: not now. A sync with no change costs 302 ms over the CLI floor, under the profile's 1 second line, and twice the work files would still be under it. Look again at about 900 work files or when a person reports a slow work command. The harness needed one correction (a plain setup before `setup --adopt`); the first start stopped before any timed command.

### Human Experience Review (A29)

Each promise of the [index](00-index.md#human-experience-trace), checked against the installed runs:

| Promise | Evidence on the installed package | Result | Open item |
| --- | --- | --- | --- |
| `work next` names ready units in dependency order and says why each blocked unit waits. | Fixture: ready tasks in order, a quick item last, and one reason and one next action for each waiting unit (claim, parent not ready, blocker). The repository copy: 46 ready phases, 20 waiting, each with a reason. MCP gives the same list. | Met. 17 finished phases (W19 R2 P2, W20 R0 P3 and P4, and the phases of W31, W32, and W33) wait under a closed index because their phase files still say `active`. Under the owner's option B, each now gets "All its tasks are done. Set its status line to completed in <file>, or close it with `make-docs work close <unit> --outcome done`.", and the new doctor check finds the same 17 files. The ready list still holds old phases (W17, W18, W21) whose indexes and phases both say `active`. | None. Guided Progress Review passed; FOLLOW-UP-P6-CLOSED-PARENT closed. |
| Hand edits and teammates' edits through git reach the store after the next work command. | Two checkouts: a teammate's edit through git was imported by the next sync; the read-only `work next` before it named "1 file to import". Same work on both sides needs no person. | Met, with the limit that a read-only command (`work next`, `work status`) names the pending import and the next write command or `work sync` applies it (R-WORK-SYNC-8). | None. |
| When both sides changed, Make Docs stops, shows both sides, and names one settle command. | `both-changed`, `file-deleted`, and `claimed` conflicts each stopped only their own file, showed the file and store side of each unit, named the units that wait, and gave one command for each choice. A stale revision and `--keep-file` on a claimed conflict were refused with nothing changed. | Met. Each conflict gives two choices, each one command, as R-WORK-SYNC-4 says. | None. Guided Progress Review passed. |
| Existing `docs/work/` files keep their format and names. A teammate without a Store sees no change. | The first import of 463 files changed no file. Without a Store, the snapshot is byte for byte the pre-Wave output, and resolve, paths, PRD check, doctor findings, and evidence read match. | Met for a teammate on this CLI. A teammate on an older CLI sees its config refusal of the `work` block that this repository opted into, and a refusal of a schema 8 Store. | D-069; Limits. |
| `work status` says whether the store or the files are the authority, and why. | Store mode, no Store, and not bound each give the mode and one reason; held paths are named; conflicts give their commands. P6 fixed the held-file and unreadable-file counts. | Met. Before the D-069 fix, a refused work write with no Store created a Store, so `work status` then said "not bound". Now no command but setup creates a Store. | None. Guided Progress Review passed; D-069 closed. |

### Plan Validation Items (A30)

| Plan validation item | Evidence |
| --- | --- |
| Validate design, plan, PRD, work, path, link, and metadata contracts. | `check prd`, `project paths validate`, `project doctor check`, `validate:defaults`, and the router check in Checks below. |
| PRD authority validation before the backlog is implementation authority. | [P1](#p1-record-model-and-rule-catalog) checks; `check prd` again below. |
| The parser and writer round-trip every current backlog byte for byte. | [P3 round trip (A10)](#round-trip-a10); P6 first import of 463 files on the installed package changed no file. |
| First import changes no file and matches the `backlog_snapshot` facts. | [P3 first import (A12)](#first-import-a12); P6 installed first import above. |
| Each row of the sync table, with a conflict that blocks only its own units. | [P3 sync table rows (A13)](#sync-table-rows-a13) and the P5 sync scenarios; P6 two-checkout table above. Each conflict named only its own units, and "Other files continue." |
| Claims: one live claim, renewal, expiry, a stale claimant's report refused, the handle check before takeover. | [P4 acceptance cases](#acceptance-cases); P6 installed claim, release, and `claimed` conflict above. |
| CLI JSON and MCP result parity for every new operation. | [P4 A16](#acceptance-cases) for all nine through the registry; P6 installed MCP check for `work_status`, `work_next`, `work_claim`, and `work_close`. |
| No-Store, denied, and unsafe Store states keep `docs/work/` as the authority. | [P4 A19](#acceptance-cases) for each state; P6 installed no-Store and not-bound runs above. The denied and unsafe states were not rerun on the installed package. |
| The agent twin and the CLI give the same answer on the shared fixtures. | [P5 A23](#a23-twin-parity). |
| The finite `PERF-004` characterization. | Run of PERF-004 above. |
| A Human Experience Review for each promise. | Above. |

### Checks

Final run, after the owner decisions, all with a temporary `MAKE_DOCS_HOME`:

- `npx tsc --noEmit -p .` and `npm run build` in `packages/cli`: pass.
- All W29 tests, the Store tests, `consistency`, the doctor tests, and `skill-adoption-store`: 20 files, 633 tests pass. The P6 test file `tests/w29-r0-p6-package-parity.test.ts` has 27 tests.
- `npm run validate:defaults`: 53 tests pass.
- `bash scripts/check-instruction-routers.sh`: pass, run outside the sandbox because the sandbox blocks its system temporary folder.
- `check prd`: no diagnostics. `project paths validate`: `valid: true`, 0 failing findings.
- `project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption` on this worktree (read only): 23 phase files marked active under a completed index, all fixable: the 17 listed above and the six W29 phase files, because the W29 index is now `completed` and its phases keep `active`, as in W31 to W33. `fix` was not run.
- `check performance-evidence`: `failed` globally with only the 17 known W23 errors; `PERF-004` has none.
- `npm run smoke:pack:local` (network, outside the sandbox): `PASS mode=local`, tarball SHA-256 `373fa0dacf0f55c76a4e22b895fdecac248a0175c65c3a0d66cad647449b2a08`.

Earlier runs: with the first candidate, every check above passed and the smoke packed `66eaca5f8e5cad123385bb1d7387a9caf259149bed897c4594da1cbec55bbb94`. After the review fixes, the type check, build, W29 and `consistency` tests (363), `check prd`, `project paths validate`, the doctor check, the performance check, and the full suite passed; the smoke did not run on the review candidate `c1a3d2e752771f4dc2c08179674f0e3bc6fa7a02ca95490099ba12d4e638fded`, only the kept proof script did.

### Full Test Suite

`npx vitest run --reporter=json` in `packages/cli`, counted from the JSON report.

| Run | Test files (passed, failed) | Tests: passed, failed, skipped, of |
| --- | --- | --- |
| First candidate | 150 (148, 2) | 3,393, 3, 6, of 3,402 |
| After the review fixes | 150 (148, 2) | 3,393, 3, 6, of 3,402 |
| Owner decisions, first try | 150 (147, 3) | 3,408, 6, 6, of 3,420 |
| Owner decisions, final | 150 (148, 2) | 3,411, 3, 6, of 3,420 |

In every run, the three failures are the known ones: `mcp-app-contract` (two tests, a Node v26 deprecation warning on stderr) and `p5-migration-safety` fixture 11 (sandbox only). The first try after the owner decisions also failed three tests in `p3-operation-surfaces` that counted on a write command creating the Store; they were updated (see [Register D-069, Option B](#register-d-069-option-b)), and the final run passes them.

### P6 Owner Decisions (2026-11-23)

- Guided Progress Review: passed. The owner found the installed `work next`, `work status`, and conflict output clear (option A). The samples are below.
- Register [D-069](../../prd/03-open-questions-and-risk-register.md): option B, fixed inside W29. See [Register D-069, Option B](#register-d-069-option-b).
- FOLLOW-UP-P6-CLOSED-PARENT: option B. The index status still does not close its phases (PRD 52 R-WORK-QUEUE-4 and R-WORK-QUEUE-20 stand). The `ancestor-closed` next action and a new doctor check changed. See [Closed Parent, Option B](#closed-parent-option-b).
- Register [D-070](../../prd/03-open-questions-and-risk-register.md): routed to the setup and adoption area, not a W29 gate.

### Register D-069, Option B

The shared Store session of every registry write operation now checks for the Store database before its write admission opens (`packages/cli/src/operations/context.ts`). Opening the Store for writing is what created it (`prepareStore` inside the writable open). With no Store database, the session returns `store-unavailable`, the code that `work next` and `work evidence read` already give for this state, and creates no folder, database, WAL, SHM, or lease file. Read admissions open read only, already refused a missing Store without creating one, and keep their words. Setup is not a registry operation and still creates the Store, as PRD 38 R-DB-4 allows.

On the review build, each command in a temporary clone with its own new `MAKE_DOCS_HOME`:

| Command | Code | Store folder after |
| --- | --- | --- |
| `work sync`, `claim`, `release`, `report`, `close`, `export`, `add` | `store-unavailable` | none |
| `work evidence record`, `lifecycle start`, `project surface ensure` | `store-unavailable` | none |
| `work evidence read` (a read) | `store-unavailable`, its earlier words | none |

`make-docs work sync` with no Store (the `code` and `message` fields of the JSON result; the Store folder stays absent):

```text
code: store-unavailable
message: This computer has no Make Docs Store. Nothing changed, and Make Docs created no Store. Only operation 'work.queue.sync' stopped. Independent Store-free work can continue. Next: Run make-docs setup to create the Store, then run this command again. Until the Store is usable, the docs/work/ files are the authority. Read them directly, or run make-docs backlog snapshot, which reads them without the Store.
```

Released behavior that changed: The change covers 26 registry write commands on the CLI: the seven work queue writes (`work sync`, `claim`, `release`, `report`, `close`, `export`, `add`), `work evidence record`, `backlog cache write`, `resource ensure`, `project surface ensure`, the eight `lifecycle` writes, `project layout prepare`, `apply`, and `verify`, `project state recover`, and `project doctor fix`. In released 2.0.9, only `lifecycle start` and `work evidence record` worked with no Store, creating one as a side effect; the others created a stray empty Store and then failed. Now all of them refuse the same way. Over MCP, these tools already refuse earlier with `store-denied`, because there is no connection key, so MCP behavior did not change. Flag this change in the next release notes (this repository writes release notes in the GitHub release). No PRD requires the old behavior: PRD 38 R-DB-4 lets only setup initialize a missing Store, and PRD 38 R-TEST-12 asks that `store-not-configured` opens no Store. The project router already says that lifecycle capture without the CLI or Store is reported as unavailable. No PRD text changed. The code is `store-unavailable`, not `store-not-configured`, because R-WORK-STORE-2 asks for "the existing typed Store outcome", and that is the code the reads already return for an absent Store. A Store that exists while this checkout is not bound still gives `work-store-refused`; that state was not part of this decision.

Tests in `packages/cli/tests/w29-r0-p6-package-parity.test.ts`: each of the seven work queue writes, `work evidence record`, and `lifecycle start` returns `store-unavailable` with the setup step (and the files step for the queue commands), changes no project file, and leaves no Store folder; a test checks that the list covers every work queue write; a read keeps its earlier words. Three older tests in `tests/p3-operation-surfaces.test.ts` counted on a write command creating the Store: two now expect the no-Store refusal for `project surface ensure` and check that no Store is made (the refusal for a Store without installation evidence stays covered in `tests/w22-r1-ownership.test.ts`), and the `resource ensure` permission test creates its Store first, the way the session used to.

### Closed Parent, Option B

- The `ancestor-closed` next action has two branches (`catalog.ts` `nextActionWhenDone`, `readiness.ts`). When the waiting unit has tasks and every one is closed as done: "All its tasks are done. Set its status line to completed in <file>, or close it with `make-docs work close <unit> --outcome done`." Otherwise, as before: "Close this unit as superseded with `make-docs work close`, or reopen <parent> by changing its status in <index>." A task is never told it is done. The agent twin `work-store.md` names both branches (template first, then the byte-identical dogfood and package copies). The catalog and the twin stay in parity; the twin test passes.
- New doctor check `phase-open-under-completed-index` (PRD 39 R-DOCTOR-9, with Requirement History): a phase file whose status line says `active` or `open` while its index status reads as closed and done (`completed`, `complete`, `closed`, or `done`, the same map as the work queue). When every task is checked, the fix changes only the word to `completed` and keeps the key, spacing, quotes, line ending, and byte order mark. Otherwise the finding is report only. It skips held paths and respects `--exclude`. The agent twin `project-doctor.md` has the check, its rules, and a shared example that a test reads.
- On a temporary clone of this repository at `31891c2b`, `project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption` found 17 phase files, all with every task checked, so all 17 are fixable and none is report only. `work next` on the same clone gives the "All its tasks are done" advice to exactly these 17 phases. `fix` was not run; the owner runs it on the repository.

```text
docs/work/2026-08-14-w19-r2-performance-evidence-governance/02-governance-resources-and-routing.md
docs/work/2026-08-28-w20-r0-human-experience-standard-and-intent/03-lifecycle-propagation-and-routing.md
docs/work/2026-08-28-w20-r0-human-experience-standard-and-intent/04-evidence-review-and-acceptance.md
docs/work/2026-11-22-w31-r0-task-id-case-and-project-doctor/01-readers-accept-both-cases.md
docs/work/2026-11-22-w31-r0-task-id-case-and-project-doctor/02-writers-and-shipped-resources.md
docs/work/2026-11-22-w31-r0-task-id-case-and-project-doctor/03-project-doctor.md
docs/work/2026-11-22-w31-r0-task-id-case-and-project-doctor/04-one-time-rewrite-and-acceptance.md
docs/work/2026-11-22-w32-r0-store-review-and-maintenance/01-table-catalog-and-fixed-rules.md
docs/work/2026-11-22-w32-r0-store-review-and-maintenance/02-schema-v7-and-defect-fixes.md
docs/work/2026-11-22-w32-r0-store-review-and-maintenance/03-project-register-and-row-events.md
docs/work/2026-11-22-w32-r0-store-review-and-maintenance/04-maintenance-commands.md
docs/work/2026-11-22-w32-r0-store-review-and-maintenance/05-real-store-proof-and-acceptance.md
docs/work/2026-11-22-w33-r0-command-tree-and-tool-names/01-name-catalog-and-rules.md
docs/work/2026-11-22-w33-r0-command-tree-and-tool-names/02-command-tree-and-tool-names.md
docs/work/2026-11-22-w33-r0-command-tree-and-tool-names/03-aliases-and-migration-window.md
docs/work/2026-11-22-w33-r0-command-tree-and-tool-names/04-shipped-text-and-skills.md
docs/work/2026-11-22-w33-r0-command-tree-and-tool-names/05-acceptance.md
```

The owner expected about 20. The other three of the 20 waiting phases on this repository are W22 R1 P1, P3, and P4, which are drafts, not phases under a closed index. W19 R2's index says `complete`, which the check reads as completed, as the work queue does.

### Owner Samples For The Guided Progress Review

Installed candidate, fixture project, `<temp>` folders. Times are shortened.

`work next --level task`, with one claim and one quick item:

```text
Ready tasks (2), in order. Read each unit's revision with --json, for --expected-version:
  W1 R0 P1 T2: Write the writer. (docs/work/2042-06-01-w1-r0-aurora/01-first.md)
  task 1: Compare two printers
Waiting (3):
  W1 R0 P1 T1: Build the parser.
    - Claimed by builder-a. The claim ends at 2026-11-23T21:36Z unless builder-a renews it. Next: Wait for builder-a to finish or release it.
  W1 R0 P1 T3: Check it.
    - Part of W1 R0 P1 S2, which is not ready yet. Next: Run `make-docs work next --level stage` to see why W1 R0 P1 S2 waits.
  W1 R0 P2 T1: Ship it.
    - Part of W1 R0 P2, which is not ready yet. Next: Run `make-docs work next --level phase` to see why W1 R0 P2 waits.
Sync check: the files and the store match.
Changes nothing.
```

`work next` on the copy of this repository, a phase of a finished Wave whose file still says `active`:

```text
  W31 R0 P1: Phase 1: Readers Accept Both Cases
    - Part of W31 R0, which is closed. Next: Close this unit as superseded with `make-docs work close`, or reopen W31 R0 by changing its status in docs/work/2026-11-22-w31-r0-task-id-case-and-project-doctor/00-index.md.
```

`work status` in checkout B with a both-changed conflict:

```text
The work store is the authority, because this checkout is bound to a usable Store. The docs/work/ files are its repo copy.
Repo copies are on: sync keeps the docs/work/ files and the store the same.
964 open units: 109 ready, 855 waiting. 0 quick items. 0 live claims.
Sync check: 1 conflict waiting for a person. Settle each conflict with one of its commands.
Conflict in docs/work/2042-06-01-w1-r0-aurora/01-first.md (both-changed): The file and the store both changed. A person decides.
  Keep the file. Make Docs imports it and replaces the store's version. Run: make-docs work sync --settle docs/work/2042-06-01-w1-r0-aurora/01-first.md --keep-file
  Keep the store. Make Docs rewrites the file from the store. Run: make-docs work sync --settle docs/work/2042-06-01-w1-r0-aurora/01-first.md --keep-store
Sync never writes these held paths: docs/work/2026-11-13-w22-r2-portable-checkout-adoption.
Changes nothing.
```

The same conflict as `work sync` reports it:

```text
Sync stopped for docs/work/2042-06-01-w1-r0-aurora/01-first.md.
The file and the store both changed. A person decides.
File: present (sha256 ff03bd112f59).
Store: revision 12, 6 units.
What differs:
- W1 R0 P1 T2: file [ ], "Write the writer."; store closed (done), "Write the writer.".
- W1 R0 P1 T3: file [ ], "Check it twice."; store open, "Check it.".
These units wait until you choose: W1 R0 P1, W1 R0 P1 S1, W1 R0 P1 S2, W1 R0 P1 T1, W1 R0 P1 T2, W1 R0 P1 T3. Other files continue.
Choose one:
- Keep the file. Make Docs imports it and replaces the store's version. Run: make-docs work sync --settle docs/work/2042-06-01-w1-r0-aurora/01-first.md --keep-file
- Keep the store. Make Docs rewrites the file from the store. Run: make-docs work sync --settle docs/work/2042-06-01-w1-r0-aurora/01-first.md --keep-store
```

A `claimed` conflict and its choices:

```text
Sync stopped for docs/work/2042-06-01-w1-r0-aurora/03-third.md.
The file closes or removes a unit that a claim still holds, live or expired. An import never acts for a claim holder, so Make Docs stopped this file. The claim ends only through its holder, a takeover, or a release after a check of its task handle. If nobody acts, make-docs setup store check lists an expired claim after 7 days (STORE-DECISION-004).
The file closes W1 R0 P3 T1, and builder-a holds it on a live claim until 2026-11-23T21:32Z. Only the claim holder closes a claimed unit.
...
Choose one:
- builder-a holds W1 R0 P3 T1 until 2026-11-23T21:32Z. The holder releases it with its claim ID, or closes the unit; then the next sync imports the file. Run: make-docs work release W1 R0 P3 T1 --claim-id <claim ID> --expected-version 1
- Keep the store. Make Docs rewrites the file from the store, so the claimed unit stays open for its claim. Run: make-docs work sync --settle docs/work/2042-06-01-w1-r0-aurora/03-third.md --keep-store
```

Result (2026-11-23): passed, option A. The owner found the order and wording of `work next`, `work status`, and the conflict report clear. The closed-parent question was decided separately (option B, above).

### Follow-Ups

None blocks W29.

- FOLLOW-UP-P6-CLOSED-PARENT: closed on 2026-11-23 with the owner's option B. A done unit under a closed index now gets the "set its status line to completed" advice, and `project doctor` has the `phase-open-under-completed-index` check with a reviewed fix (see [Closed Parent, Option B](#closed-parent-option-b)). The index status still does not cascade. The 17 files on this repository wait for the owner's own fix run.
- FOLLOW-UP-P6-UNIT-COUNT: the first import says "10 units entered the store", and `work status` then counts 11 open units, because the store adds one unit for each wave. A P3 test fixes the first wording.
- FOLLOW-UP-P6-SETUP-ADOPT (register [D-070](../../prd/03-open-questions-and-risk-register.md), routed to the setup and adoption area): a clone with a saved project ID, on a new Store, needs four setup commands before its first import. Rechecked on the review build: (1) `setup --adopt --yes` first refuses "This checkout cannot be adopted yet. The Store is absent. Checkout move needs a usable Store." with no next step; (2) plain `setup --yes` makes the Store and stops with "ambiguous-ownership" and the next step "Run make-docs setup again"; (3) plain `setup --yes` again stops with "This checkout has a project ID but no installed record in this Store", and only now names `make-docs setup --adopt --yes`; (4) `setup --adopt --yes` completes. Steps 2 and 3 exit 0 while blocked. A second worktree also needs `project checkout apply --review <digest>` first. This is setup behavior from W22, not W29; the `PERF-004` harness and the proof script run steps 2 and 4.

### Limits

- One machine (macOS arm64), one Node version, and one repository for `PERF-004`; informational only.
- The `store-missing` and `unclear` conflict kinds, copies off, and the denied and unsafe Store states were not rerun on the installed package; the P3 to P5 tests cover them.
- A teammate on a CLI from before W29 cannot use Store commands on a project whose config has a `work` block (only this repository has one) and cannot read a schema 8 Store; it refuses both safely.
- The MCP check called four of the nine tools on the installed package; P4 A16 covers all nine through the registry.
- The fix of the 17 open phase files on this repository waits for the owner's own `project doctor fix` run.
- The proof script kept in this folder is a rebuild of the script that ran on the first candidates; its own run on the review candidate is the one kept.
- `backlog snapshot` byte counts include the temporary folder path, so they differ by a few bytes between runs (4,991,315 and 4,991,313).
