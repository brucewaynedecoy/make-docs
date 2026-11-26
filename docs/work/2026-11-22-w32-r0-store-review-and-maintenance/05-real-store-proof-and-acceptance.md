---
title: "Phase 5: Real Store Proof and Acceptance"
kind: "work"
status: "completed"
coordinate: "W32 R0 P5"
source:
  type: "prd"
  path: "docs/prd/38-global-store-and-project-state.md"
---

# Phase 5: Real Store Proof and Acceptance

## Purpose

Fix documentation drift and prove the Wave on a copy of a real Store before W29 R0 P2 starts.

## Overview

This phase corrects the Store README and code comments, runs the new commands on a copy of the maintainer machine's Store, measures `PERF-005`, and closes the Wave.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. All promises in the index, on a real Store copy.
- Intended human outcome: the owner sees the real space saved, the real findings, and a guard that holds on real data.
- Human-facing surface or indirect effect: command output on a real Store copy and the Store README.
- Implementation work: drift fixes, the copy run, `PERF-005`, the full suite, and the Human Experience Review.
- Evidence source or testing type selected under current authority: recorded copy run, `PERF-005`, Human Experience Review.
- Executor: the implementing agent runs and records. The owner reviews the wording.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Full suite and the recorded copy run. |
| Performance Testing | selected | `PERF-005`: characterize `clean` with the vacuum on a real Store copy. Informational. It decides whether the vacuum stays in `clean`. |
| Guided Progress Review | selected | The owner reviews `project list`, `check`, and `clean` output on the copy. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

- Base maintenance action: `create`
- Performance applicability: `characterize-now`
- Canonical `PERF-###` profile link or `none`: [`PERF-005`](#perf-005-store-clean-with-vacuum-on-a-real-store-copy), created in this phase.
- Finite evidence budget and stop-rule reference or `not-applicable`: three runs on one Store copy; stop after three or on the first failure.
- Execution packet link or `not-applicable`: [PERF-005 run](evidence.md#run-of-perf-005-a22).
- Outcome and evidence handoff or `none`: the vacuum decision, in the [evidence report](evidence.md#run-of-perf-005-a22).
- Gate disposition and supported-scope limit or `not-applicable`: informational; no speed promise.

## Performance Evidence

This phase is the one canonical record of `PERF-005`. The [evidence report](evidence.md#run-of-perf-005-a22) binds the run to this profile and holds the result. It does not define a second profile.

### Performance Applicability

| Field | Value |
| --- | --- |
| Candidate ID | `W32-CLEAN-VACUUM` |
| Title | Store clean with the vacuum on a real Store copy |
| Testing Type | Performance Testing |
| Base Maintenance Action | `create` |
| Protected Outcome | A person who runs `make-docs setup store clean` gets the Store file smaller, with a verified backup, in a wait that does not get in the way. |
| Decision Informed | Whether `clean` keeps its `VACUUM` step. |
| Failure Cost | Without the vacuum, removed rows leave free pages and the file does not shrink, so the person sees no space saved. A slow vacuum could hold the Store write lock while other Make Docs commands wait. |
| Risk And Reversibility | Local and reversible: clean makes a verified backup first, and the vacuum step can be removed in a later release. A false pass hides a long lock; a false fail removes the step that frees the space. |
| Supported Scope | One copy of the maintainer machine's Store (schema 6 from Make Docs 2.0.9, converted to schema 7), on the maintainer machine, with the current development build. |
| Product Maturity | Maintainer development build; bounded characterization. |
| Source Authority | [PRD 38](../../prd/38-global-store-and-project-state.md) R-MAINT-5, [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-STORE-CMD-4, [design](../../designs/2026-11-22-store-review-and-maintenance.md), [plan overview](../../plans/2026-11-22-w32-r0-store-review-and-maintenance/00-overview.md). |
| Source Evidence | [P4 sample output](evidence.md#sample-output): the fixture Store is small, so the vacuum freed no pages. |
| Baseline Availability | None. This is the first measurement. |
| Applicability | `characterize-now` |
| Target Class | `characterization-baseline` |
| Owner | Make Docs maintainer; W32 R0 P5. |
| Lifecycle Coordinate | W32 R0 P5. |
| Gate Effect | Informational. No speed promise. Honest evidence and its limits are required for phase closeout. |
| Reason | Clean is built and stable, and a real Store copy exists, so a baseline can inform the vacuum decision now. |
| Next Record | [PERF-005](#perf-005-store-clean-with-vacuum-on-a-real-store-copy). |

### PERF-005 Store Clean With Vacuum On A Real Store Copy

#### Identity And Authority

| Field | Value |
| --- | --- |
| Profile ID | `PERF-005` |
| Profile Version | `1` |
| Source Digest | `sha256:877be6157fb09ab6958a55dec732050f36ebfaccf3169335f7a610dac52b7774` |
| Title | Store clean with the vacuum on a real Store copy |
| Protected Outcome | Show the time, the file size before and after, and the pages freed when `clean` runs with its backup and its `VACUUM` on a real Store. |
| Source Requirements | [PRD 38](../../prd/38-global-store-and-project-state.md) R-MAINT-5, [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-STORE-CMD-4, [performance contract](../../../.make-docs/system/contracts/performance-evidence-governance.md). |
| Canonical Owner | `docs/work/2026-11-22-w32-r0-store-review-and-maintenance/05-real-store-proof-and-acceptance.md` |
| Product Maturity | Maintainer development build; bounded characterization. |
| Applicability | `characterize-now` |
| Target Class | `characterization-baseline` |
| Risk And Failure Cost | Local and reversible. A false pass hides a long write lock; a false fail removes the step that frees the space. |
| Owner | Make Docs maintainer. |
| Approver | Make Docs owner. |

#### Supported Scope

| Field | Value |
| --- | --- |
| Surface | `cleanStore` in `packages/cli/src/store/maintenance.ts`, the same code that `make-docs setup store clean --yes` runs. |
| Platform Or Runtime | macOS 27.2.1 on Apple silicon (arm64), Node `v26.13.1`, built-in `node:sqlite` with SQLite 3.54.1. |
| Deployment Or Device Class | The maintainer machine, local SSD, a temporary folder. |
| Scale | One Store: 37,003,264 bytes at schema 6, 9,034 pages of 4,096 bytes, 18 tables after conversion, 10 installation operations, 323 steps, 45 migration records. |
| Account And Network State | One local user. No network. |
| Resource Envelope | Free disk space for one backup (clean needs twice the Store size). No other limit. |
| Exclusions | Windows and Linux, other Stores, other sizes, a Store with concurrent writers, and any speed promise. |

#### Baseline And Target

| Field | Value |
| --- | --- |
| Comparable Baseline | none |
| Target | none |
| Unit | none |
| Direction | none |
| Tolerance | none |
| Target Source | none |
| Target Approval | none |

#### Environment And Workload

| Field | Value |
| --- | --- |
| Product Build | `@brucewaynedecoy/make-docs` `2.0.9` development build from branch `docs/w29-w30-work-store-and-factory` at `c2498d55` plus the P5 changes, built with `npm run build`. |
| Dependency State | Repository `package-lock.json` installed with `npm ci`. |
| Configuration | `MAKE_DOCS_HOME` and `HOME` set to temporary folders. Retention settings at their defaults (30 days for terminal operations). |
| Qualified Environment | The maintainer machine, as above. |
| Dataset Or Fixture | A read-only copy of the maintainer machine's Store (`store.db` SHA-256 `66d7e4187df5`, schema 6). Each run uses a fresh duplicate. |
| Workload | On the duplicate: `make-docs setup --yes` on one new temporary project converts the Store to schema 7. Then the harness runs `checkStore` and `cleanStore` once with the clock set to 2026-12-24T12:00:00Z, so the 30-day retention window has passed for every operation. |
| Concurrency | One process. No other Make Docs command runs. |
| Operation Mix | One check and one clean: plan, `VACUUM INTO` backup and verify, one `BEGIN IMMEDIATE` change transaction, rotation, `VACUUM`, `PRAGMA wal_checkpoint(TRUNCATE)`. |
| Workload Exclusions | A clean with nothing to remove (it makes no backup and no vacuum). |

#### Measurement Protocol

| Field | Value |
| --- | --- |
| Measurement Boundary | The `cleanStore` call from start to return. The harness also times each `VACUUM INTO`, `BEGIN IMMEDIATE`, `COMMIT`, `VACUUM`, and `PRAGMA wal_checkpoint` statement that clean runs, and records the file size and page counts before and after. |
| Instrument And Version | `performance.now()` in Node `v26.13.1`; the `sqlite3` 3.54.0 shell, read only, for page counts and `dbstat` sizes. |
| Cold Or Warm State | Warm file cache: the duplicate was just copied and converted. |
| Warmup Rule | None. Each run is one clean on its own duplicate. |
| Repetitions Or Observation Window | Three runs, each on a fresh duplicate. |
| Statistic | Each run's value, and the median of the three. |
| Variance Reporting | The range of the three runs. |
| Uncertainty Reporting | Three runs on one machine; no interval is claimed. |
| Outlier Treatment | None. Every run is reported. |
| Comparison Method | none |
| Raw Evidence Retention | Redacted per-run results in [perf-005-results.json](evidence/p5/performance/perf-005-results.json); the harness in [perf-005-harness.mjs](evidence/p5/performance/perf-005-harness.mjs). No path, project name, or project ID is kept. |
| Observer Effects | The statement timer wraps `DatabaseSync.prototype.exec`; it adds one timer call per statement. |

#### Non-Sacrificable Constraints

| Constraint | Required Condition And Evidence |
| --- | --- |
| Correctness | Clean changes only the rows that check planned. Each run changed the same 38 rows, and the restored backup gives back every row. |
| Durability | The backup verifies (quick check, schema 7, 54 guard triggers) before any row changes. |
| Safety | No run touched the real Store. The read-only copy kept its SHA-256. |
| Security | Store and backup files have mode `0600`. |
| Privacy | The repository keeps only counts, sizes, timings, rule IDs, and redacted examples. |
| Accessibility | Not applicable: no visual surface. |
| Portability | macOS only in this run; see Exclusions. |
| Cost | Local compute only. |
| Maintainability | The harness calls the shipped `cleanStore` with no change to it. |
| Fixture And Measurement Seam | Before the runs, `make-docs setup store check` on the converted copy matched the harness check for the real clock (nothing to remove). |

#### Evidence Budget And Stop Rules

| Field | Value |
| --- | --- |
| Authorizing Plan Or Work Scope | [W32 R0 P5](05-real-store-proof-and-acceptance.md), owner approval on 2026-11-23 to run on a copy of the real Store. |
| Budget Event ID | `W32-R0-P5-PERF-005-1` |
| Characterization Pass Limit | 3 runs. |
| Materially Distinct Correction Attempt Limit | 0. |
| Review Cycle Limit | 1. |
| Elapsed Investigation Time Limit | 2 hours. |
| Compute Limit | 3 runs of one clean each on the maintainer machine. |
| External Resource Spend Limit | 0. |
| Unchanged Fingerprint Action | Reuse this result. |
| Material Change Action | Rerun only the clean timing and the size check under a new budget. |
| Diminishing Return Rule | Stop after three runs or at the first failure. |
| Budget Exhaustion Disposition | Record the result as it stands and route any open question to the owner. |

#### Outcome Rules

| Outcome | Exact Condition |
| --- | --- |
| `pass` | All three runs finish, each run changes the planned rows, verifies its backup, vacuums, and records time, size, and pages. |
| `fail` | A run fails, changes a row that check did not plan, or leaves the Store unreadable. |
| `revise` | The workload cannot exercise the vacuum (nothing to remove), or the measurement cannot separate the vacuum. |
| `blocked` | The Store copy, the build, or the owner approval is missing. |
| `waived` | Not used. |

| Field | Value |
| --- | --- |
| Severity Treatment | `major` for any correctness, durability, or safety failure; `minor` for timing. |
| Reproducibility Treatment | `reproduced` when two or more runs agree; otherwise `intermittent`. |
| Finding Route | The W32 R0 evidence report, then register D-062. |
| Escalation Route | The owner, through the P5 closeout. |

#### Expiry And Reevaluation

| Field | Value |
| --- | --- |
| Material Change Triggers | A change to `cleanStore`, the backup or vacuum steps, the Store schema, Node or SQLite, or a Store of a very different size. |
| Time Or Release Boundary | The next Make Docs release that changes clean. |
| Current-Use Invalidation Rule | Any material change trigger ends current use. |
| Next Review Condition | A person reports a slow clean, or the Store grows past 500 MB (as the CLI prints it). |
| Requalification Authority | A new phase with owner authority. |
| Requalification Budget | A new finite budget in that phase. |
| Unchanged-Fingerprint Qualification Limit | One bounded execution. |

#### Lineage And Traceability

| Field | Value |
| --- | --- |
| Predecessor | none |
| Successor | none |
| Promotion Source | none |
| Promotion Approval | none |
| Supersession Reason | none |
| Plan And Work Links | [Plan overview](../../plans/2026-11-22-w32-r0-store-review-and-maintenance/00-overview.md), [plan P5](../../plans/2026-11-22-w32-r0-store-review-and-maintenance/05-real-store-proof-and-acceptance.md), [this phase](05-real-store-proof-and-acceptance.md). |
| Result Links | [PERF-005 run](evidence.md#run-of-perf-005-a22). |
| Finding Links | none |
| Obligation Links | none |
| History Links | [P5 history record](../../../.make-docs/archive/history/2026-11-23-w32-r0-p5-real-store-proof-and-acceptance.md). |
| Support Links | [Results](evidence/p5/performance/perf-005-results.json), [harness](evidence/p5/performance/perf-005-harness.mjs). |

#### Evidence Fingerprint

- Profile ID, version, and digest: `PERF-005`, version `1`, the source digest above.
- Product build and relevant code state: `2.0.9` development build at `c2498d55` plus the P5 changes; `cleanStore` is unchanged in P5.
- Dependency and configuration state: `npm ci` from the repository lock file; default retention settings.
- Qualified environment: the maintainer machine, macOS 27.2.1 arm64, Node `v26.13.1`, SQLite 3.54.1.
- Workload and fixture or dataset: the Store copy with SHA-256 `66d7e4187df5`, converted by setup, clock 2026-12-24T12:00:00Z.
- Instrument version: `performance.now()` in Node `v26.13.1`.
- Analysis method: per-run values, median, and range.
- Comparability result and reasons: `not-comparable` with any earlier result: no earlier result exists.

#### Budget Ledger

- Authorizing scope and budget event: W32 R0 P5, `W32-R0-P5-PERF-005-1`.
- Requalification authorization: none.
- Declared limits: 3 runs, 0 correction attempts, 1 review cycle, 2 hours, 0 external spend.
- Materially distinct attempts: none.
- Affected checks: clean time, file size, pages, backup.
- Time, compute, and external spend: 3 runs of under 1 second each, about 20 minutes in all; no external spend.
- Review cycles used: 1 (the owner's Guided Progress Review, passed on 2026-11-23).
- Remaining budget: 0 runs.
- Unchanged evidence reused: none.
- Stop reason and escalation: three runs done; no failure.

#### Result Record

- Result ID: `PERF-005-R1`
- Exact profile binding: `PERF-005`, version `1`, the source digest above.
- Build and evidence fingerprint: as above.
- Environment and workload: as above.
- Raw and analyzed evidence: [perf-005-results.json](evidence/p5/performance/perf-005-results.json).
- Observed distribution: clean took 166, 176, and 164 ms (median 166 ms). The backup `VACUUM INTO` took 57 to 59 ms, the `VACUUM` 4 ms, and the WAL checkpoint 2 to 3 ms. The Store file went from 39,780,352 bytes (9,712 pages, 758 free) to 1,298,432 bytes (317 pages, 0 free) in every run: 38,481,920 bytes and 9,395 pages freed.
- Uncertainty and exclusions: three runs on one machine with a warm cache; timing on another machine or a larger Store can differ.
- Budget ledger: above.
- Outcome: `pass`
- Findings: none.
- Owner or reviewer disposition: accepted by the owner in the Guided Progress Review on 2026-11-23 (option A); the vacuum stays.
- Supported-scope limit: this Store copy on this machine; informational only.
- Expiry: the material change triggers above.
- Later result: none.

The vacuum decision: keep the `VACUUM` in `clean`. Without it, the file keeps its 37.9 MB, because the Store does not use `auto_vacuum` (`PRAGMA auto_vacuum` is 0). With it, the file shrank by 96.7 percent, and the vacuum and checkpoint added about 7 ms to a clean of about 170 ms.

## Source PRD Docs

- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)

## Source Obligations, Scenarios, And Findings

- [D-062](../../prd/03-open-questions-and-risk-register.md)

## Stage 1 - Drift

### Tasks

- [x] T1: Correct the Store README and code comments: callers, backup names, recovery paths, and table counts.

### Acceptance criteria

- A19: The Store README and comments name only callers, files, and paths that exist.

## Stage 2 - Real Store copy

### Tasks

- [x] T2: Copy the maintainer machine's Store to a temporary folder. Run `project list`, `setup store check`, and `setup store clean` on the copy with `MAKE_DOCS_HOME` pointed at it. Never run `clean` on the real Store.
- [x] T3: On the copy, confirm that a `sqlite3` write fails after the migration and that a removed trigger is reported as `store-unsafe`.
- [x] T4: Run `PERF-005` on the copy and record the vacuum decision.

### Acceptance criteria

- A20: The copy run records the findings, the rows removed, and the space before and after.
- A21: The guard holds on the copy, and a removed trigger is reported.
- A22: `PERF-005` has a recorded baseline and a vacuum decision.

## Stage 3 - Acceptance

### Tasks

- [x] T5: Run the full test suite and record known failures.
- [x] T6: Complete a Human Experience Review for each promise in the index, and record evidence in `evidence.md`.
- [x] T7: Update register D-062 with the result.

### Acceptance criteria

- A23: Every plan validation item has recorded evidence or a named limit.
- A24: Register D-062 names the result and any remaining item.

### Dependencies

- P3 and P4.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected and passed: 12 new tests in `packages/cli/tests/w32-r0-p5-store-wording.test.ts`, the updated catalog test, the type check, the validators, the recorded copy run, and the full suite with only known failures ([evidence](evidence.md#validation-a23)). Performance Testing selected and done: `PERF-005` passed within its scope, three runs ([evidence](evidence.md#run-of-perf-005-a22)). Guided Progress Review selected and passed: the owner accepted the output on 2026-11-23 with option A ([evidence](evidence.md#guided-progress-review)). Unassisted Goal Testing `not-needed-now`.
- Performance evidence: [`PERF-005`](#perf-005-store-clean-with-vacuum-on-a-real-store-copy) result `PERF-005-R1` is `pass`, informational. Clean took 164 to 176 ms (median 166 ms); the file went from 39,780,352 to 1,298,432 bytes (37.9 MB to 1.2 MB as the CLI prints MiB), 9,395 pages freed. The vacuum stays in `clean`.
- Human Experience Review: done for each index promise ([evidence](evidence.md#human-experience-review-a23)). All five are met on the copy. P5 fixed the repeated `store-unsafe` next action, the setup name refusal next action, the schema 6 next action, the doubled dry-run lines, and the guard limit in status. After the independent review it also fixed the `uninstall --remove-store` wording (backups named before and after, no "preserved" line), the plain reason for a foreign `backup/` folder, and, at the owner's request, the "rows wait for the 30-day window" line. Three items stay as follow-ups in the [evidence report](evidence.md#follow-ups): raw JSON for text-mode refusals and raw row keys (the owner chose to track both), and the "MB" label for MiB.
- Optional experience handoff: not applicable.
- Explicit human acceptance gate: passed. On 2026-11-23 the owner accepted the `project list`, `setup store check`, `setup store clean`, and `uninstall --remove-store` output with option A: accept the output, fix the 30-day wording now (done in P5), and track the two other wording points as follow-ups. The W32 index is `completed`.
- Evidence report: [P5 Real Store Proof and Acceptance](evidence.md#p5-real-store-proof-and-acceptance).
- Phase / capability status: Phase complete on commit. A19 to A24 are met, and the owner's Guided Progress Review passed on 2026-11-23. The Wave is complete. W29 R0 P2 can start. A real `setup store clean` of the owner's Store after about 2026-12-23 needs separate owner approval.
