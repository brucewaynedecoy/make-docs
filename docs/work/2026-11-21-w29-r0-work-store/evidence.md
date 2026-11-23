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
