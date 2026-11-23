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
