---
title: "Phase 6: Package Parity and Acceptance"
kind: "work"
status: "active"
coordinate: "W29 R0 P6"
source:
  type: "prd"
  path: "docs/prd/52-work-store-and-work-queue.md"
---

# Phase 6: Package Parity and Acceptance

## Purpose

Prove the whole work store on an installed package before W30 builds on it.

## Overview

One package candidate passes installed, two-checkout, no-Store, folder-without-git, parity, performance characterization, and Human Experience checks.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. All five promises in the [index](00-index.md#human-experience-trace).
- Intended human outcome: a person and a teammate can share work through git, and a person without a Store sees no change.
- Human-facing surface or indirect effect: the installed CLI, MCP tools, and `docs/work/` files.
- Implementation work: installed proofs, `PERF-004`, and the Human Experience Review.
- Evidence source or testing type selected under current authority: installed tests and Human Experience Review.
- Executor: the implementing agent. The owner is invited to give feedback.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Installed package suite, two-checkout sync, no-Store, and folder-without-git runs. |
| Performance Testing | selected | `PERF-004`, `characterize-now`, informational. |
| Guided Progress Review | selected | Owner feedback on the installed `next`, `status`, and conflict output. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

- Base maintenance action: `create`
- Performance applicability: `characterize-now`
- Canonical `PERF-###` profile link or `none`: [`PERF-004`](#perf-004-automatic-sync-on-a-project-with-many-backlogs), written in this phase by T1 before any measurement.
- Finite evidence budget and stop-rule reference or `not-applicable`: the `PERF-004` profile's budget and stop rules.
- Execution packet link or `not-applicable`: Stage 2 tasks T6 and T7.
- Outcome and evidence handoff or `none`: the fast-path decision, in the [evidence report](evidence.md#run-of-perf-004-a28).
- Gate disposition and supported-scope limit or `not-applicable`: informational for speed. Sync correctness stays blocking.

## Performance Evidence

This phase is the one canonical record of `PERF-004`. The [evidence report](evidence.md#run-of-perf-004-a28) binds the run to this profile and holds the result. It does not define a second profile.

### Performance Applicability

| Field | Value |
| --- | --- |
| Candidate ID | `W29-AUTO-SYNC` |
| Title | Automatic sync at the start of each work command on a project with many backlogs |
| Testing Type | Performance Testing |
| Base Maintenance Action | `create` |
| Protected Outcome | A person or agent who runs a work command on a project with many backlogs gets the answer without a wait that gets in the way, although every command syncs or checks sync first. |
| Decision Informed | Whether automatic sync needs a digest-only fast path now, before it parses changed files. |
| Failure Cost | A slow sync on every call makes `work next` and `work status` feel heavy, and agents call them often. A fast path built too early adds a second code path that can skip a real change. |
| Risk And Reversibility | Local and reversible: a fast path can be added in a later release. A false pass hides a slow command on a larger project; a false fail adds a risky second sync path. |
| Supported Scope | One clone of this repository, on the maintainer machine, with the packed package candidate. |
| Product Maturity | Unreleased package candidate; bounded characterization. |
| Source Authority | [PRD 52](../../prd/52-work-store-and-work-queue.md) R-WORK-SYNC-1 and R-WORK-SYNC-8, [PRD 48](../../prd/48-performance-evidence-governance.md), [design](../../designs/2026-11-21-work-store.md), [plan overview](../../plans/2026-11-21-w29-r0-work-store/00-overview.md#performance-evidence-plan). |
| Source Evidence | [P3 first import](evidence.md#first-import-a12) on this repository's backlogs. |
| Baseline Availability | None. This is the first measurement. |
| Applicability | `characterize-now` |
| Target Class | `characterization-baseline` |
| Owner | Make Docs maintainer; W29 R0 P6. |
| Lifecycle Coordinate | W29 R0 P6. |
| Gate Effect | Informational for speed. No speed promise. Sync correctness in the run stays blocking. |
| Reason | The real sync path and the package candidate exist, so a baseline can inform the fast-path decision now. |
| Next Record | [PERF-004](#perf-004-automatic-sync-on-a-project-with-many-backlogs). |

### PERF-004 Automatic Sync On A Project With Many Backlogs

#### Identity And Authority

| Field | Value |
| --- | --- |
| Profile ID | `PERF-004` |
| Profile Version | `1` |
| Source Digest | `sha256:2c96dd6a021633f58e46b3f215cc2c16816ac04e632ece8b5841b722011fcffd` |
| Title | Automatic sync on a project with many backlogs |
| Protected Outcome | Show the time of the first import, a sync with no change, `work next`, `work status`, and `backlog snapshot --work-store` on a project with many backlogs, next to the time of a CLI start with no work. |
| Source Requirements | [PRD 52](../../prd/52-work-store-and-work-queue.md) R-WORK-SYNC-1 and R-WORK-SYNC-8, [PRD 51](../../prd/51-backlog-review-and-reporting.md) R-BACKLOG-SNAPSHOT-31, [performance contract](../../../.make-docs/system/contracts/performance-evidence-governance.md). |
| Canonical Owner | `docs/work/2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md` |
| Product Maturity | Unreleased package candidate; bounded characterization. |
| Applicability | `characterize-now` |
| Target Class | `characterization-baseline` |
| Risk And Failure Cost | Local and reversible. A false pass hides a slow command on a larger project; a false fail adds a second sync path that can skip a change. |
| Owner | Make Docs maintainer. |
| Approver | Make Docs owner. |

#### Supported Scope

| Field | Value |
| --- | --- |
| Surface | The installed `make-docs` command: `work sync`, `work next`, `work status`, and `backlog snapshot --work-store`, each as one process from start to exit. |
| Platform Or Runtime | macOS 27.2.1 on Apple silicon (arm64), Node `v26.13.1`, built-in `node:sqlite`. |
| Deployment Or Device Class | The maintainer machine, local SSD, a temporary folder. |
| Scale | One clone of this repository at the candidate commit: 61 live backlog folders and their archived work records, about 460 work files and 4,000 units. The result records the exact counts. |
| Account And Network State | One local user. No network. |
| Resource Envelope | No limit beyond the machine. |
| Exclusions | Windows and Linux, other projects and sizes, a sync that imports or writes many changed files, concurrent commands, MCP calls, and any speed promise. |

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
| Product Build | The packed `@brucewaynedecoy/make-docs` `2.0.9` candidate from branch `docs/w29-w30-work-store-and-factory` at `31891c2b` plus the P6 changes, built with `npm run build`, packed with `npm pack`, and installed with `npm install` in a temporary folder. |
| Dependency State | Repository `package-lock.json` installed with `npm ci`; the candidate's dependencies from the npm registry. |
| Configuration | `MAKE_DOCS_HOME`, `HOME`, `CODEX_HOME`, and `CLAUDE_CONFIG_DIR` set to new temporary folders for each run. The clone's own `.make-docs/config.yaml`, with its `work.syncHold`. |
| Qualified Environment | The maintainer machine, as above. |
| Dataset Or Fixture | A fresh `git clone --no-hardlinks` of this repository at the candidate commit for each run, so only committed files are read. |
| Workload | For each run, with the three harness methods `none`: a plain `make-docs setup --yes`, which makes the Store and stops on ownership (the harness checks that its status is `blocked`), then `make-docs setup --yes --adopt` (its time is kept as `setupMs`, outside the result); then three `make-docs --version` calls (the floor), one `work sync --json` (the first import), then five rounds of `work sync --json` (no change), `work next --json`, `work status --json`, `backlog snapshot --work-store --json`, and `backlog snapshot --json` (the file path, for comparison). |
| Concurrency | One process at a time. No other Make Docs command runs. |
| Operation Mix | As in Workload. |
| Workload Exclusions | Claims, reports, closes, conflicts, and a sync with changed files. |

#### Measurement Protocol

| Field | Value |
| --- | --- |
| Measurement Boundary | One CLI process from spawn to exit, measured by the harness around `spawnSync`. It includes Node start, module load, the Store open, the sync or sync check, the command, and the JSON output. |
| Instrument And Version | `performance.now()` in Node `v26.13.1`; the [harness](evidence/p6/performance/perf-004-harness.mjs). |
| Cold Or Warm State | Warm file cache: the clone was just made. The first import runs on a new Store. |
| Warmup Rule | None. The first round is reported with the others. |
| Repetitions Or Observation Window | Three runs, each on a fresh clone and Store; five rounds of each repeated command per run, so 15 samples of each and 3 of the first import. |
| Statistic | The median of all samples of each command, and each run's median. |
| Variance Reporting | The minimum and maximum of each command. |
| Uncertainty Reporting | Three runs on one machine; no interval is claimed. |
| Outlier Treatment | None. Every sample is reported. |
| Comparison Method | none |
| Raw Evidence Retention | Redacted per-run results in [perf-004-results.json](evidence/p6/performance/perf-004-results.json). No path, project name, or project ID is kept. |
| Observer Effects | The harness reads each JSON result to check it; that time is outside the measured process. |

#### Non-Sacrificable Constraints

| Constraint | Required Condition And Evidence |
| --- | --- |
| Correctness | The first import writes and removes no file and reports no conflict and no unreadable file. Each sync with no change imports, writes, and removes nothing. After each run, `git status` shows no change under `docs/work/` and `.make-docs/archive/work/`. |
| Durability | Each command exits 0 and its JSON result parses. |
| Safety | No run reads or writes the real Store: the harness gives each run new temporary folders and refuses a work folder inside the real Store. |
| Security | No secret is read or written. |
| Privacy | The repository keeps only counts, timings, and redacted sync summaries. |
| Accessibility | Not applicable: no visual surface. |
| Portability | macOS only in this run; see Exclusions. |
| Cost | Local compute only. |
| Maintainability | The harness runs the installed package with no change to it. |
| Fixture And Measurement Seam | The harness checks the same sync counts that the P3 and P4 tests check. |

#### Evidence Budget And Stop Rules

| Field | Value |
| --- | --- |
| Authorizing Plan Or Work Scope | [W29 R0 P6](06-package-parity-and-acceptance.md) T6 and T7. |
| Budget Event ID | `W29-R0-P6-PERF-004-1` |
| Characterization Pass Limit | 3 runs. |
| Materially Distinct Correction Attempt Limit | 1, only for a harness defect that is not a product result. |
| Review Cycle Limit | 1. |
| Elapsed Investigation Time Limit | 30 minutes of harness time, and 2 hours in all. |
| Compute Limit | 3 runs on the maintainer machine. |
| External Resource Spend Limit | 0. |
| Unchanged Fingerprint Action | Reuse this result. |
| Material Change Action | Rerun the three runs under a new budget. |
| Diminishing Return Rule | Stop after three runs or at the first failure. |
| Budget Exhaustion Disposition | Record the result as it stands and route the fast-path question to the owner. |

#### Outcome Rules

| Outcome | Exact Condition |
| --- | --- |
| `pass` | All three runs finish, every correctness condition holds, and each command has a recorded time. |
| `fail` | A command fails, the first import or a sync with no change changes a file or a store unit, or a work file changes. |
| `revise` | The workload does not run the sync (for example, the checkout is not bound), so the measure does not show sync time. |
| `blocked` | The candidate, the clone, or the temporary Store is missing. |
| `waived` | Not used. |

| Field | Value |
| --- | --- |
| Severity Treatment | `major` for any correctness or safety failure; `minor` for timing. |
| Reproducibility Treatment | `reproduced` when two or more runs agree; otherwise `intermittent`. |
| Finding Route | The W29 R0 evidence report, then the owner through the P6 closeout. |
| Escalation Route | The owner, through the P6 closeout. |

The fast-path decision rule: build the digest-only fast path now only when a sync with no change takes more than 1 second over the CLI floor on this repository. Otherwise record "not now" and the condition to look again. The 1 second is a decision line for this choice, not a product speed promise.

#### Expiry And Reevaluation

| Field | Value |
| --- | --- |
| Material Change Triggers | A change to the sync, the parser, the store-mode snapshot, the Store schema, Node or SQLite, or a project with many more work files. |
| Time Or Release Boundary | The next Make Docs release that changes sync. |
| Current-Use Invalidation Rule | Any material change trigger ends current use. |
| Next Review Condition | A person reports a slow work command, or this repository holds twice the work files of this run. |
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
| Plan And Work Links | [Plan overview](../../plans/2026-11-21-w29-r0-work-store/00-overview.md), [plan P6](../../plans/2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md), [this phase](06-package-parity-and-acceptance.md). |
| Result Links | [PERF-004 run](evidence.md#run-of-perf-004-a28). |
| Finding Links | [FOLLOW-UP-P6-SETUP-ADOPT](evidence.md#follow-ups) and [register D-070](../../prd/03-open-questions-and-risk-register.md): a new Store needs four setup commands before the first import of a clone. |
| Obligation Links | none |
| History Links | [P6 history record](../../../.make-docs/archive/history/2026-11-23-w29-r0-p6-package-parity-and-acceptance.md). |
| Support Links | [Results](evidence/p6/performance/perf-004-results.json), [harness](evidence/p6/performance/perf-004-harness.mjs). |

#### Evidence Fingerprint

- Profile ID, version, and digest: `PERF-004`, version `1`, the source digest above.
- Product build and relevant code state: a branch build, not a release: the packed candidate that reports version `2.0.9`, identified by its tarball SHA-256 `66eaca5f8e5cad123385bb1d7387a9caf259149bed897c4594da1cbec55bbb94`, built from `31891c2b` plus the first five P6 fixes.
- Dependency and configuration state: `npm ci` from the repository lock file; the candidate installed with `npm install`; the clone's own config with its `work.syncHold`.
- Qualified environment: the maintainer machine, macOS 27.2.1 arm64 (Apple M2 Pro, 10 cores, 16 GiB), Node `v26.13.1`.
- Workload and fixture or dataset: a fresh clone of this repository at `31891c2b` for each run: 463 work files imported, 4,150 units from the files and 4,183 store units with the waves, 955 open.
- Instrument version: `performance.now()` in Node `v26.13.1`; the harness as it ran, SHA-256 `1d6f0f86812186b57e6c4847d757bfdcae8fb63d540be0406732cf6eade653b9`. After the review, the kept harness has more stop checks (SHA-256 `8b13dd77d2de91f16ad156d4a5ad1a51b5ff2059a615bc51465501fe442701f5`); see the ledger.
- Analysis method: per-command median, minimum, and maximum of all samples, and each run's median.
- Comparability result and reasons: `not-comparable` with any earlier result: no earlier result exists.

#### Budget Ledger

- Authorizing scope and budget event: W29 R0 P6, `W29-R0-P6-PERF-004-1`.
- Requalification authorization: none.
- Declared limits: 3 runs, 1 correction attempt for a harness defect, 1 review cycle, 30 minutes of harness time and 2 hours in all, 0 external spend.
- Materially distinct attempts: 1. The first start stopped in run 1 at `setup --adopt`, before any timed command, because a fresh Store needs a plain setup first. The harness now runs a plain setup and then `setup --adopt`, as a person does. No product code changed between the two starts.
- Affected checks: none; no timed command ran in the stopped start.
- Time, compute, and external spend: 125 seconds of harness time for the three runs, about 1 hour in all with the profile and the review; no external spend.
- Review cycles used: 0 of 1. The owner's Guided Progress Review of the output is open.
- Remaining budget: 0 runs and 0 correction attempts.
- Unchanged evidence reused: none. Before the profile existed, one T2 exploration timed one first import on an earlier candidate (1.31 s by `/usr/bin/time`). It is not part of this result.
- Stop reason and escalation: all three runs done; no failure.
- Profile text corrected after the run (2026-11-23, after the independent review): the Workload field now names the plain setup that ran before `setup --adopt`, and Finding Links names FOLLOW-UP-P6-SETUP-ADOPT. Neither changes a timed command, the measurement boundary, the analysis, or an outcome rule, so under the performance contract the version stays `1`. The digest at run time was `sha256:0b896b1b061b5620d2350831ef5eb5cf7f277111ad8fc97ef191cd42c6d63999`; the source digest above is for the corrected text.
- Harness checks added after the run: the first import also stops on a removed file, an unreadable file, or a file error; each sync with no change also stops on an unreadable file or a file error; the plain setup must end `blocked`; and the store units (count and revision sum) must not change during the rounds. PERF-004 was not rerun, because these checks cannot change the recorded outcome: the results already record 0 removed and 0 unreadable files and a `blocked` plain setup in every run, and a separate correctness check (not a timed run) on a fresh clone found every `work_units` row byte for byte the same after five rounds of sync, next, status, and store-mode snapshot (4,183 units, revision sum 4,183).
- Code changed after the run: the blocked-reason punctuation (review item 5) and a moved code comment. Neither touches sync, the parser, the snapshot, the Store schema, or Node, so neither is a material change trigger.
- Code changed after the owner decisions of 2026-11-23: every registry write admission first checks that the Store database exists (one file check before the write open; register D-069), the `ancestor-closed` next action has a done branch, and the doctor has a new check. None changes sync, the parser, the snapshot, the Store schema, or Node, so none is a material change trigger, and PERF-004 was not rerun.

#### Result Record

- Result ID: `PERF-004-R1`
- Exact profile binding: `PERF-004`, version `1`, the source digest above.
- Build and evidence fingerprint: as above.
- Environment and workload: as above.
- Raw and analyzed evidence: [perf-004-results.json](evidence/p6/performance/perf-004-results.json).
- Observed distribution, in milliseconds (median, then minimum to maximum):

| Command | Samples | Median | Range |
| --- | --- | --- | --- |
| `make-docs --version` (the floor) | 9 | 84 | 83 to 87 |
| First import (`work sync`, first sync of the checkout) | 3 | 1,380 | 1,358 to 1,384 |
| `work sync` with no change | 15 | 386 | 382 to 398 |
| `work next` | 15 | 330 | 324 to 408 |
| `work status` | 15 | 351 | 340 to 375 |
| `backlog snapshot --work-store --json` | 15 | 3,245 | 3,196 to 3,656 |
| `backlog snapshot --json` (files, for comparison) | 15 | 2,909 | 2,886 to 3,354 |

- Correctness: every run passed every non-sacrificable condition. Each first import imported 463 files and wrote, removed, and found nothing else. Each sync with no change imported, wrote, and removed nothing. No work file changed. Each store-mode snapshot had the `workStore` key, and each file snapshot had none.
- Uncertainty and exclusions: three runs on one machine with a warm file cache; another machine, a larger project, or a sync with many changed files can differ.
- Budget ledger: above.
- Outcome: `pass`
- Findings: one usability finding outside the timed workload, [FOLLOW-UP-P6-SETUP-ADOPT](evidence.md#follow-ups) (register D-070): a clone with a saved project ID and a new Store needs four setup commands, and the first two do not name `setup --adopt --yes`. It is not a performance finding.
- Owner or reviewer disposition: accepted with the owner's Guided Progress Review, passed on 2026-11-23 (option A). Fast path: not now.
- Supported-scope limit: this repository on this machine; informational only.
- Expiry: the material change triggers above.
- Later result: none.

The fast-path decision: not now. A sync with no change takes 386 ms, which is 302 ms over the 84 ms CLI floor, well under the 1 second line. `work next` and `work status` add about 250 ms of sync check over the floor. At about 0.65 ms per work file, twice the work files would still stay under the line. The store-mode snapshot costs 336 ms (12 percent) more than the file snapshot, and the snapshot is slow in both modes because it builds a JSON result of about 8 MB. Look again when this repository holds about 900 work files, or when a person reports a slow work command.

## Source PRD Docs

- [52 Work Store and Work Queue](../../prd/52-work-store-and-work-queue.md)
- [51 Backlog Review and Reporting](../../prd/51-backlog-review-and-reporting.md)
- [10 Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [48 Performance Evidence Governance](../../prd/48-performance-evidence-governance.md)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Installed proofs

### Tasks

- [x] T1: Write the `PERF-004` profile in this phase file under the performance evidence profile template.
- [x] T2: Install the candidate in a clean fixture project and in this repo's dogfood instance. Run first import.
- [x] T3: Edit the same backlog in two checkouts that share git. Prove import, write, conflict stop, and settle.
- [x] T4: Prove a project without Store access keeps `docs/work/` as the authority and every existing command behaves as before.
- [x] T5: Prove the commands work in a folder without git.

### Acceptance criteria

- A25: The two-checkout run shows each sync table result on the installed package.
- A26: The no-Store run matches the pre-Wave behavior of every existing work command.
- A27: The folder-without-git run completes next, claim, report, and close.

## Stage 2 - Characterization and review

### Tasks

- [x] T6: Run `PERF-004` on a project with many backlogs within its budget.
- [x] T7: Record the baseline and the fast-path decision.
- [x] T8: Complete a Human Experience Review for each promise in the index.
- [x] T9: Create `evidence.md`, record every result and limit, and link it from the index.

### Acceptance criteria

- A28: `PERF-004` has a recorded baseline and a recorded fast-path decision.
- A29: Each promise has a review conclusion with its evidence and limits.
- A30: Every plan validation item has recorded evidence or a named limit.

### Dependencies

- P2 to P5 and one identified package candidate.

### Closeout Notes

- Built (2026-11-23): T1 to T9. Evidence: [P6 section](evidence.md#p6-package-parity-and-acceptance).
- T1, T6, T7: [`PERF-004`](#perf-004-automatic-sync-on-a-project-with-many-backlogs) was written before any counted measurement and run three times on fresh clones of this repository (463 work files, 4,150 units). Result `PERF-004-R1` is `pass`: first import 1,380 ms, a sync with no change 386 ms, `work next` 330 ms, `work status` 351 ms, and `backlog snapshot --work-store` 3,245 ms (medians; CLI floor 84 ms). Fast path: not now.
- T2: the packed branch-build candidate (version `2.0.9`, tarball SHA-256 `66eaca5f8e5cad123385bb1d7387a9caf259149bed897c4594da1cbec55bbb94`) installed in a clean fixture project and in a temporary clone of this repository. First import wrote no file in both. The clone needs `setup --adopt` with a new Store.
- T3 (A25): two worktrees of the clone and one Store proved import, write, same work on both sides, `both-changed`, `file-deleted` with restore and accept-deletion, `remove-copy`, `claimed` with the holder's release, a held path, an unreadable file, and settle refusals.
- T4 (A26): without a Store, and with a Store that the checkout is not bound to, `backlog snapshot` matches the pre-Wave build byte for byte, and the other existing commands match. `work status` and `work next` name the files as the authority. The review found a gap: with no Store, the work write commands returned `work-store-refused` instead of the `store-*` code that R-WORK-STORE-2 requires, said "nothing changed", and created a Store. The owner chose option B of register D-069 on 2026-11-23, and it is built: every registry write command now refuses with `store-unavailable` and creates no Store; setup alone creates one. This also changes the older write commands (`work evidence record`, `lifecycle start`, and others), which used to create a Store; no PRD requires that. D-069 is closed.
- T5 (A27): next, claim, report, close, and sync work in a folder without git.
- The installed MCP server gives the same `work_next` answer as the CLI JSON, and a write needs `allowWrite`.
- Setup finding: a clone with a saved project ID on a new Store needs four setup commands, and the first two do not name `setup --adopt --yes` (FOLLOW-UP-P6-SETUP-ADOPT, register D-070, routed to the setup and adoption area; no W22 R2 file changed).
- Defects: the installed runs found five wording defects (a doubled period, a close listed as store-only, "released its claim" with no claim, a held file counted as "to write", and an unreadable file that sync "applies"). All five are fixed with tests in `packages/cli/tests/w29-r0-p6-package-parity.test.ts`. No PRD changed.
- Independent review (2026-11-23): code fixes accepted; documentation fixes needed. Done: D-069 restated with its wrong code, false "nothing changed", and created Store; D-070 added; the `PERF-004` Workload, Finding Links, digest, and ledger corrected (version stays `1`, no rerun, reasons in the ledger); the harness stops on more checks; the proof script kept in `evidence/p6/proofs/` and rerun on the review candidate (tarball SHA-256 `c1a3d2e752771f4dc2c08179674f0e3bc6fa7a02ca95490099ba12d4e638fded`); a blocked reason that ends in `?` or `!` gets no extra period; candidates named as branch builds by full tarball SHA-256; and a stray code comment moved.
- Owner decisions (2026-11-23): the Guided Progress Review passed (option A); D-069 option B, built; FOLLOW-UP-P6-CLOSED-PARENT option B, built: the index status still does not close its phases, a done phase under a closed index is told to set its status line to `completed` (or close it as done), and `project doctor` has the new `phase-open-under-completed-index` check (PRD 39 R-DOCTOR-9). On a temporary clone of this repository the check finds 17 phase files, all fixable; `fix` was not run, because the owner runs it.
- Four testing decisions: Automated Implementation Testing selected and done (installed runs, new tests, full suite; see evidence). Performance Testing selected and done: `PERF-004` `pass`, informational. Guided Progress Review selected and passed on 2026-11-23 (option A). Unassisted Goal Testing `not-needed-now`.
- Performance evidence: [`PERF-004-R1`](#result-record), `pass`, informational. The fast path is not needed now; look again at about 900 work files or on a report of a slow work command.
- Human Experience Review (A29): all five index promises are met on the installed package, with the limits in the evidence. The Guided Progress Review passed, and D-069 and FOLLOW-UP-P6-CLOSED-PARENT are closed. D-070 is routed to setup and adoption, outside W29.
- Optional experience handoff: none.
- Explicit human acceptance gate: passed. The owner's Guided Progress Review of the samples in the [evidence](evidence.md#owner-samples-for-the-guided-progress-review) passed on 2026-11-23 (option A), and the owner decided D-069 and FOLLOW-UP-P6-CLOSED-PARENT ([decisions](evidence.md#p6-owner-decisions-2026-11-23)).
- Evidence report: [P6 section](evidence.md#p6-package-parity-and-acceptance) (A30 maps each plan validation item).
- Phase / capability status: Phase complete on commit. A25 to A30 are met, and every owner gate of W29 is closed. W29 R0 is complete; its index is `completed`. W30 R0 P2 can start. Open outside W29: D-070 (setup and adoption) and the owner's own `project doctor fix` run on this repository.
