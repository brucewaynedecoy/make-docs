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
