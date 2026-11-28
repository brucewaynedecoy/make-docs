---
title: "Phase 4: Git Hook Proofs"
kind: "work"
status: "draft"
coordinate: "W35 R0 P4"
source:
  type: "prd"
  path: "docs/prd/07-cli-command-surface-and-lifecycle.md"
---

# Phase 4: Git Hook Proofs

## Purpose

Settle every open fact about git hooks before any hook is built. It depends on P1 for the checkpoint and its `--event` input.

## Overview

The [design](../../designs/2026-11-27-agent-checkpoints-and-triggers.md) marks a set of items "the plan proves", "the plan finds out", or "the plan measures". This phase holds each one as a named task. It builds no product behavior, with one exception: Stage 5 fixes the sync core fault of [register entry R-041](../../prd/03-open-questions-and-risk-register.md), and its task T18 is the one task of this phase that builds product code. For the rest, the phase adds proof tests, records answers, runs `PERF-007`, and brings two choices to the owner. Its results can change what P5 builds, so it ends and is reviewed before P5 starts.

The owner decided on 2026-11-27 to fix R-041 in this Wave, before the hooks ship. The owner did not choose the phase. The orchestrator placed it in P4, before any hook installs. P5 is the first phase that installs a hook in a project.

The [standing rules](00-index.md#standing-rules) of the index hold in this phase. Each proof runs in temporary repositories with a temporary `MAKE_DOCS_HOME` at a fixed, checked path.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `indirect`. A git action never fails because of Make Docs, and a person does not need to tell an agent to sync. This phase proves the facts that those promises stand on.
- Intended human outcome: the owner reads one record that says, for each hook fact and each platform, what was seen, and gets two clear choices: the hook run mode, and a Store schema change only if one is needed.
- Human-facing surface or indirect effect: none yet. P5 builds the surface.
- Implementation work: proof tests, recorded findings, the `PERF-007` profile and runs, and register entries. Stage 5 adds one change to the sync core, its tests, and one new measurement of the sync time.
- Evidence source or testing type selected under current authority: proof tests on Linux, macOS, and Windows through the fixed test list of `.github/workflows/platform-safety.yml` under [standing rule 12](00-index.md#standing-rules), recorded runs, and `PERF-007`.
- Executor: the implementing agent writes the tests and the records. The orchestrator starts the workflow run and the agent tool sessions under standing rules 11 and 12. The owner answers the gates.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Git fact tests that stay in the suite, so a git version that changes a fact fails a test. |
| Performance Testing | selected | `PERF-007`, `characterize-now`, informational. Stage 5 T22 also measures the sync time again with the `PERF-004` method, after the change to the sync core. |
| Guided Progress Review | not-needed-now | No human-facing surface exists in this phase. The owner gates carry the choices. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

- Base maintenance action: `create`
- Performance applicability: `characterize-now`
- Canonical `PERF-###` profile link or `none`: `PERF-007`, written in this phase file by T13 before any measurement, under a `## Performance Evidence` section, as [`PERF-004`](../2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md#perf-004-automatic-sync-on-a-project-with-many-backlogs) is in its phase.
- Finite evidence budget and stop-rule reference or `not-applicable`: budget event `W35-R0-P4-PERF-007-1`. At most 3 characterization runs, 1 correction attempt for a harness defect only, 1 review cycle, 2 hours in all, the maintainer machine only, and no external spend. Stop after three runs or at the first correctness failure. The budget does not renew itself.
- Execution packet link or `not-applicable`: Stage 3 tasks T13 to T15.
- Outcome and evidence handoff or `none`: the result goes to the evidence report and to owner gate OG-4.
- Gate disposition and supported-scope limit or `not-applicable`: informational for speed. One machine, this repository's work files, and the candidate build. A hook that changes a project file or fails a git action is a correctness failure and stays blocking.

## Performance Evidence

This phase is the one canonical record of `PERF-007`. It also holds the authorization and the budget for one requalification of [`PERF-004`](../2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md#perf-004-automatic-sync-on-a-project-with-many-backlogs) (T22). The `PERF-004` profile and its results stay in their own phase file. The [evidence report](evidence.md#p4-git-hook-proofs) binds the runs to these records and repeats the results in plain lines. It defines no second profile.

### Requalification Of PERF-004 After The Sync Core Fix

This record was written before any counted run.

- Profile: `PERF-004`, version `1`, with its source digest as its own record states it. The profile text does not change.
- Why: a material change trigger of the profile holds. T18 changes sync: the scan of the work files now runs inside the Store write session.
- Authorization: the owner decided on 2026-11-27 to fix register entry R-041 in this Wave. The backlog holds the measurement as P4 T22. The profile asks for "a new phase with owner authority", and this phase with that decision is that authority.
- Budget event: `W35-R0-P4-PERF-004-2`.
- Limits of budget event `W35-R0-P4-PERF-004-2` for `PERF-004`: 3 runs, 1 correction attempt for a harness defect only, 1 review cycle, 1 hour in all, the maintainer machine only, and no external spend. The budget does not renew itself.
- Stop rule: stop after three runs or at the first correctness failure.
- Method: the kept harness of `PERF-004`, with no change (SHA-256 `8b13dd77d2de91f16ad156d4a5ad1a51b5ff2059a615bc51465501fe442701f5`), the packed candidate of this phase, and fresh clones of this repository. The workload, the measurement boundary, the statistic, and the outcome rules are those of the profile.
- Result: `PERF-004-R2`, recorded beside `PERF-004-R1` in the [result record](../2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md#result-record) of the profile.
- Side measure, outside the profile: the time that a second sync waits for the Store while the first one works. The `PERF-004` workload runs one process at a time, so it cannot show this time. One more [harness](evidence/p4/performance/perf-004-r2-wait-harness.mjs) starts two `work sync` runs with no change at the same time, five times, in one fresh clone, and compares the run that ends last with one sync alone. It is one run on one machine, it is informational, and it is not a result of `PERF-004`.
- Second side measure, outside the profile, added by the independent review of 2026-11-27: a comparison in one session of the build with the fix and the build with the sync file of commit `d12d1047`. `PERF-004-R2` holds no run of the older build, so it cannot say whether the fix adds time. One more [harness](evidence/p4/performance/perf-004-r2-compare-harness.mjs) runs `work sync` with no change and `make-docs project checkpoint` with no change, 25 samples for each build, in turn, on one fresh clone and one temporary Store. The two builds are made in temporary copies of the source outside this checkout and differ in the one file. It is one session on one machine, it is informational, it is not a result of `PERF-004`, and it uses no counted run of the budget.

### Performance Applicability

| Field | Value |
| --- | --- |
| Candidate ID | `W35-GIT-HOOK-CHECKPOINT` |
| Title | The checkpoint that a git hook runs after a commit, a merge, a rewrite, and a branch change |
| Testing Type | Performance Testing |
| Base Maintenance Action | `create` |
| Protected Outcome | A git action stays as fast as before for the person, although a hook now runs the checkpoint after it. |
| Decision Informed | Owner gate OG-4: a hook runs the checkpoint in the foreground, or a hook starts the checkpoint and returns. |
| Failure Cost | A slow hook makes every commit, merge, rewrite, and branch change feel heavy, and a person can then remove the hooks. A hook that starts the checkpoint and returns loses the one line that tells the person what waits. |
| Risk And Reversibility | Local and reversible: the run mode is one line of the hook block, and a later release can change it. A false pass hides a slow git action on a larger project. A false fail sends the owner to the mode that prints nothing. |
| Supported Scope | Clones of this repository, on the maintainer machine, with the packed package candidate. |
| Product Maturity | Unreleased package candidate; bounded characterization. |
| Source Authority | [PRD 52](../../prd/52-work-store-and-work-queue.md) R-WORK-CHECKPOINT, [PRD 48](../../prd/48-performance-evidence-governance.md), [design](../../designs/2026-11-27-agent-checkpoints-and-triggers.md) (performance evidence candidates), [plan overview](../../plans/2026-11-27-w35-r0-agent-checkpoints-and-triggers/00-overview.md#performance-evidence-plan). |
| Source Evidence | [`PERF-004-R1`](../2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md#result-record): a sync with no change takes about 300 ms over the CLI floor at 463 work files, and a first import takes 1,380 ms. |
| Baseline Availability | None for a git action with a hook. `PERF-004-R1` and `PERF-004-R2` measured the sync alone. |
| Applicability | `characterize-now` |
| Target Class | `characterization-baseline` |
| Owner | Make Docs maintainer; W35 R0 P4. |
| Lifecycle Coordinate | W35 R0 P4. |
| Gate Effect | Informational for speed. No speed promise. A hook that changes a project file or fails a git action is a correctness failure and stays blocking. |
| Reason | The checkpoint, its `--event` input, and the package candidate exist, so a measurement can inform owner gate OG-4 before P5 builds the hook block. |
| Next Record | [PERF-007](#perf-007-the-checkpoint-that-a-git-hook-runs). |

### PERF-007 The Checkpoint That A Git Hook Runs

#### Identity And Authority

| Field | Value |
| --- | --- |
| Profile ID | `PERF-007` |
| Profile Version | `1` |
| Source Digest | `sha256:29b2a2345dd938dd3f41c50dbe0be3476cc35219fc5b8cf24c8f52ad669cc6b8` |
| Title | The checkpoint that a git hook runs |
| Protected Outcome | Show the time of a commit, a true merge, an amended commit, and a branch change with no hook, with a hook that runs the checkpoint in the foreground, and with a hook that starts the checkpoint and returns, each with no change and with one changed work file, and the time of a hook run that is the first sync of a checkout. |
| Source Requirements | [PRD 52](../../prd/52-work-store-and-work-queue.md) R-WORK-CHECKPOINT and R-WORK-SYNC-9, [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md), [performance contract](../../../.make-docs/system/contracts/performance-evidence-governance.md). |
| Canonical Owner | `docs/work/2026-11-27-w35-r0-agent-checkpoints-and-triggers/04-git-hook-proofs.md` |
| Product Maturity | Unreleased package candidate; bounded characterization. |
| Applicability | `characterize-now` |
| Target Class | `characterization-baseline` |
| Risk And Failure Cost | Local and reversible. A false pass hides a slow git action on a larger project. A false fail sends the owner to the mode that prints nothing. |
| Owner | Make Docs maintainer. |
| Approver | Make Docs owner. |

#### Supported Scope

| Field | Value |
| --- | --- |
| Surface | One `git` process from start to exit: `git commit`, `git merge --no-ff` (a true merge), `git commit --amend` (the rewrite), and `git checkout <branch>` (the branch change). The hooks are proof hooks that the harness writes into its own temporary clones. They run the installed `make-docs project checkpoint` with `--event commit` or `--event branch-change`. |
| Platform Or Runtime | macOS 27.2.1 on Apple silicon (arm64), Node `v26.13.1`, built-in `node:sqlite`, git 2.47.1. |
| Deployment Or Device Class | The maintainer machine, local SSD, a temporary folder. |
| Scale | Clones of this repository at the candidate commit. The result records the count of store units. |
| Account And Network State | One local user. No network during a timed command. |
| Resource Envelope | No limit beyond the machine. |
| Exclusions | Windows and Linux, other projects and sizes, many changed work files, a rebase with many commits, `git pull`, an agent tool that limits Store access, the hook block that P5 builds, a hook that finds the command through a recorded path, and any speed promise. |

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
| Product Build | The packed `@brucewaynedecoy/make-docs` `2.1.1` candidate from branch `docs/w35-store-authority-and-agent-reminders` at `d12d1047` plus the uncommitted P4 change of the sync core (T18), built with `npm run prepack -w packages/cli`, packed with `npm pack`, and installed with `npm install` in a temporary folder. |
| Dependency State | Repository `package-lock.json` installed with `npm ci`; the candidate's dependencies from the npm registry. |
| Configuration | `MAKE_DOCS_HOME`, `HOME`, `CODEX_HOME`, and `CLAUDE_CONFIG_DIR` set to new temporary folders for each clone. The git child processes read an empty file in place of the global and the system git config. The clone's own `.make-docs/config.yaml`, with its `work.syncHold`. The folder of the installed command is first on PATH, so the hook finds the command by a PATH lookup. |
| Qualified Environment | The maintainer machine, as above. |
| Dataset Or Fixture | Two fresh `git clone --no-hardlinks` of this repository at the candidate commit for each run, so only committed files are read. Clone A serves the rounds with no hook and then the foreground hook. Clone B serves the hook that starts the checkpoint and returns. |
| Workload | For each clone, with the three harness methods `none`: a plain `make-docs setup --yes`, which makes the Store and stops on ownership, then `make-docs setup --yes --adopt`, then one commit of the files that setup wrote, with no hook. No sync runs before the hooks. Then three `make-docs --version` calls (the floor). For each hook mode, the harness writes four hook files into the clone: `post-commit`, `post-merge`, and `post-rewrite` run the checkpoint with `--event commit`, and `post-checkout` runs it with `--event branch-change` when its third argument is 1. The hooks after a commit and after a checkout first check the state marks of git and stop in the middle of an action. Each hook always exits 0. For each mode with a hook, the first timed action is one commit of a file that sync does not read. Its hook run is the first sync of the checkout. Then five rounds. Each round runs the four actions, each in the state "no change" (the action changes a file that sync does not read) and in the state "one changed work file" (the action adds one comment line to one work file, so one file waits for import). The preparation of each action (a staged change, a side branch, a commit on the main branch) runs with no hook and outside the measure. |
| Concurrency | One git action at a time. An amended commit runs two hooks, so in the mode that starts and returns, two checkpoints run at the same time. The harness waits until each started checkpoint has ended before the next action. |
| Operation Mix | As in Workload. |
| Workload Exclusions | Claims, conflicts, files that wait for a write or a removal, and more than one changed work file. |

#### Measurement Protocol

| Field | Value |
| --- | --- |
| Measurement Boundary | One `git` process from spawn to exit, measured by the harness around `spawnSync`. With the foreground hook it includes the whole checkpoint. With the hook that starts and returns it ends when git exits, and the harness records, as a second number, how long after that the last started checkpoint ended. |
| Instrument And Version | `performance.now()` in Node `v26.13.1`; the [harness](evidence/p4/performance/perf-007-harness.mjs). |
| Cold Or Warm State | Warm file cache: the clone was just made. |
| Warmup Rule | None. The first round is reported with the others. |
| Repetitions Or Observation Window | Three runs, each on fresh clones and Stores; five rounds of each action, state, and mode per run, so 15 samples of each, and 3 samples of each first sync. |
| Statistic | The median of all samples of each action, state, and mode. The time that a hook mode adds is its median minus the median with no hook, for the same action and state. |
| Variance Reporting | The minimum and maximum of each action, state, and mode. |
| Uncertainty Reporting | Three runs on one machine; no interval is claimed. |
| Outlier Treatment | None. Every sample is reported. |
| Comparison Method | The three modes run the same action list in the same order. The mode with no hook and the foreground mode share clone A, and the third mode has clone B. No equivalence test is claimed. |
| Raw Evidence Retention | Redacted per-run results in [perf-007-results.json](evidence/p4/performance/perf-007-results.json). No path, project name, or project ID is kept. |
| Observer Effects | Each proof hook writes one line to a log file when it starts a checkpoint and one when the checkpoint ends. The harness reads the Store unit count before and after each action; that time is outside the measured process. The repository grows by a few commits and branches during a run. |

#### Non-Sacrificable Constraints

| Constraint | Required Condition And Evidence |
| --- | --- |
| Correctness | Each git action exits 0 in each mode, as it does with no hook. After each action, and after each started checkpoint has ended, `git status` shows a clean work tree: no hook changed a project file. With a hook, an action with one changed work file changes the store units, and an action with no change does not. A branch change never changes the store units. Each action starts the expected number of checkpoints: one, and two for an amended commit. |
| Durability | Each started checkpoint ends. |
| Safety | No run reads or writes the real Store: the harness gives each clone new temporary folders and refuses a work folder inside the real Store. The hooks exist only in the temporary clones. |
| Security | No secret is read or written. |
| Privacy | The repository keeps only counts, timings, and the first output line with its numbers removed. |
| Accessibility | Not applicable: no visual surface. |
| Portability | macOS only in this run; see Exclusions. |
| Cost | Local compute only. |
| Maintainability | The harness changes no product file and installs no hook outside its own clones. |
| Fixture And Measurement Seam | The harness checks what a person sees: the foreground hook prints when a work file was imported or waits, and prints nothing with no change. The hook that starts and returns prints nothing in each state. |

#### Evidence Budget And Stop Rules

| Field | Value |
| --- | --- |
| Authorizing Plan Or Work Scope | [W35 R0 P4](04-git-hook-proofs.md) T13 to T15. |
| Budget Event ID | `W35-R0-P4-PERF-007-1` |
| Characterization Pass Limit | 3 runs. |
| Materially Distinct Correction Attempt Limit | 1, only for a harness defect that is not a product result. |
| Review Cycle Limit | 1. |
| Elapsed Investigation Time Limit | 2 hours in all. |
| Compute Limit | 3 runs on the maintainer machine. |
| External Resource Spend Limit | 0. |
| Unchanged Fingerprint Action | Reuse this result. |
| Material Change Action | Rerun the three runs under a new budget. |
| Diminishing Return Rule | Stop after three runs or at the first correctness failure. |
| Budget Exhaustion Disposition | Record the result as it stands and bring owner gate OG-4 to the owner with it. The budget does not renew itself. |

#### Outcome Rules

| Outcome | Exact Condition |
| --- | --- |
| `pass` | All three runs finish, every correctness condition holds, and each action, state, and mode has a recorded time. |
| `fail` | A git action fails, a hook changes a project file, a checkpoint does not end, or another correctness condition does not hold. |
| `revise` | The workload does not run the checkpoint in a hook (for example, the hook finds no command), so the measure does not show its time. |
| `blocked` | The candidate, a clone, or a temporary Store is missing. |
| `waived` | Not used. |

| Field | Value |
| --- | --- |
| Severity Treatment | `major` for any correctness or safety failure; `minor` for timing. |
| Reproducibility Treatment | `reproduced` when two or more runs agree; otherwise `intermittent`. |
| Finding Route | The W35 R0 evidence report, then the owner through owner gate OG-4. |
| Escalation Route | The owner, through owner gate OG-4. |

The profile sets no decision line for OG-4. The gate always opens, and the owner chooses with the measured times and with what a person sees in each mode.

#### Expiry And Reevaluation

| Field | Value |
| --- | --- |
| Material Change Triggers | A change to the checkpoint, the sync, the parser, the Store schema, Node or SQLite, the hook block that P5 builds when it differs from the proof hooks in what it runs, or a project with many more work files. |
| Time Or Release Boundary | The next Make Docs release that changes the checkpoint or the hook block. |
| Current-Use Invalidation Rule | Any material change trigger ends current use. |
| Next Review Condition | A person reports a slow git action, or this repository holds about 900 work files, as the record of 2026-11-23 says. |
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
| Plan And Work Links | [Plan overview](../../plans/2026-11-27-w35-r0-agent-checkpoints-and-triggers/00-overview.md), [plan P4](../../plans/2026-11-27-w35-r0-agent-checkpoints-and-triggers/04-git-hook-proofs.md), [this phase](04-git-hook-proofs.md). |
| Result Links | [P4 evidence](evidence.md#p4-git-hook-proofs). |
| Finding Links | none |
| Obligation Links | none |
| History Links | none |
| Support Links | [Results](evidence/p4/performance/perf-007-results.json), [harness](evidence/p4/performance/perf-007-harness.mjs). |

#### Evidence Fingerprint

- Profile ID, version, and digest: `PERF-007`, version `1`, the source digest above. The digest is the SHA-256 of this profile text from its `### PERF-007` heading to the end of `Lineage And Traceability`, with the digest value written as `sha256:pending`.
- Product build and relevant code state: a branch build, not a release: the packed candidate that reports version `2.1.1`, identified by its tarball SHA-256 `739ad356412dfa09c3ffb853e3f0a62391cef44d042da3fbb11c676eb8ab7ab9`, built from `d12d1047` plus the P4 change of the sync core (T18).
- Dependency and configuration state: `npm ci` from the repository lock file; the candidate installed with `npm install`; the clone's own config with its `work.syncHold`.
- Qualified environment: the maintainer machine, macOS 27.2.1 arm64 (Apple M2 Pro, 10 cores, 16 GiB), Node `v26.13.1`, git 2.47.1.
- Workload and fixture or dataset: two fresh clones of this repository at `d12d1047` for each run, each with one more commit of the files that setup wrote: 471 work files and 4,396 store units after the first sync.
- Instrument version: `performance.now()` in Node `v26.13.1`; the harness as it ran, SHA-256 `a0c7134351c5edf03c94aa1c8b5c9a31e5b137415451f6fee24861f5fb13612c`.
- Analysis method: per action, state, and mode: the median, minimum, and maximum of all samples. The added time is the median with the hook minus the median with no hook.
- Comparability result and reasons: `not-comparable` with `PERF-004-R1` and `PERF-004-R2` as a result: they time one Make Docs process, and this profile times one git process. The time of one checkpoint in a hook agrees with them: a foreground hook adds 538 ms to a commit with no change, next to 444 ms for a sync with no change in `PERF-004-R2`. The rest is the start of the hook shell, the git lookups of the hook, and the read steps of the checkpoint.

#### Budget Ledger

- Authorizing scope and budget event: W35 R0 P4, `W35-R0-P4-PERF-007-1`.
- Requalification authorization: none.
- Declared limits: 3 runs, 1 correction attempt for a harness defect, 1 review cycle, 2 hours in all, 0 external spend.
- Materially distinct attempts: 1. The three counted runs ran one time, with no failure and no correction.
- Affected checks: none.
- Time, compute, and external spend: 241 seconds of harness time for the three runs, about 1 hour in all with the profile and the harness; no external spend.
- Review cycles used: 0 of 1.
- Remaining budget: 0 runs and 1 correction attempt, which stays unused.
- Unchanged evidence reused: none. Before the profile was written, one trial of the harness ran with 1 run and 1 round, to prove that the harness works. The full test suite ran on the machine at the same time, so its times are not usable, and it is not part of this result.
- Stop reason and escalation: all three runs done; no failure. Owner gate OG-4 goes to the owner with this result.
- Code changed after the run: tests and documents only. No product code changed after the candidate was packed.

#### Result Record

- Result ID: `PERF-007-R1`
- Exact profile binding: `PERF-007`, version `1`, the source digest above.
- Build and evidence fingerprint: as above.
- Environment and workload: as above.
- Raw and analyzed evidence: [perf-007-results.json](evidence/p4/performance/perf-007-results.json).
- Observed distribution, in milliseconds, for one git action. Each cell is the median, then the minimum to the maximum, of 15 samples. "Adds" is the median minus the median with no hook. "Ends after" is the median time between the end of git and the end of the last checkpoint that the hook started. The CLI floor (`make-docs --version`, 9 samples) is 99 (94 to 100).

| Action | State | No hook | Foreground hook | Adds | Start and return hook | Adds | Ends after |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `git commit` | no change | 32 (29 to 34) | 571 (562 to 630) | 538 | 59 (52 to 62) | 27 | 524 |
| `git commit` | one changed work file | 34 (31 to 47) | 665 (643 to 725) | 631 | 61 (57 to 66) | 27 | 612 |
| `git merge` (a true merge) | no change | 59 (54 to 75) | 591 (575 to 729) | 533 | 75 (68 to 155) | 17 | 523 |
| `git merge` (a true merge) | one changed work file | 60 (56 to 70) | 688 (653 to 740) | 628 | 75 (69 to 78) | 16 | 606 |
| `git commit --amend` (the rewrite, two hooks) | no change | 33 (31 to 57) | 1,120 (1,079 to 1,239) | 1,086 | 78 (74 to 131) | 45 | 815 |
| `git commit --amend` (the rewrite, two hooks) | one changed work file | 35 (29 to 42) | 1,194 (1,159 to 1,361) | 1,159 | 78 (71 to 85) | 44 | 910 |
| `git checkout <branch>` | no change | 22 (20 to 26) | 433 (423 to 555) | 411 | 48 (47 to 122) | 27 | 393 |
| `git checkout <branch>` | one changed work file | 22 (19 to 23) | 439 (425 to 450) | 417 | 48 (45 to 52) | 27 | 400 |

A hook run that is the first sync of a checkout, as one `git commit` (3 samples for each mode):

| Mode | The commit takes | The checkpoint ends after the commit |
| --- | --- | --- |
| Foreground hook | 2,210 (2,048 to 2,638) | with the commit |
| Start and return hook | 139 (134 to 269) | 1,944 later |

- What the tables show: a foreground hook adds about 0.53 seconds to a commit or a true merge with no change, and about 0.63 seconds when one work file is imported. It adds about 0.41 seconds to a branch change, which only checks. An amended commit runs two hooks, so it pays two times: about 1.1 seconds. A commit that is the first sync of a checkout takes about 2.2 seconds one time. A hook that starts the checkpoint and returns adds 16 ms to 45 ms, and the checkpoint then ends 0.4 seconds to 0.9 seconds after git returned.
- What a person sees, as the harness checked it in each sample. With the foreground hook and no change, nothing prints. With the foreground hook and one changed work file, the output of the checkpoint appears before git returns: 9 lines that start with `Checkpoint: 1 file imported.` after a commit, a merge, or a rewrite, and 10 lines that start with `Checkpoint: 1 file waits.` after a branch change. With the hook that starts and returns, nothing prints in any state, because the hook must send the output of the checkpoint to nowhere: the checkpoint ends after the prompt is back.
- Correctness: every run passed every non-sacrificable condition. Each git action exited 0. The work tree was clean after each action and after each started checkpoint ended. The store units changed only for a commit, a merge, or a rewrite with one changed work file, and never for a branch change. Each action started one checkpoint, and an amended commit started two. With the hook that starts and returns, the two checkpoints of an amended commit ran at the same time, and the store and the work tree were right in each of the 30 samples.
- Uncertainty and exclusions: three runs on one machine with a warm file cache; another machine, a larger project, many changed work files, or another platform can differ. The proof hooks find the command by a PATH lookup, and the block of P5 can differ.
- Budget ledger: above.
- Outcome: `pass`
- Findings: two, both outside the timed workload. First: a trigger run that imported a file or found a file that waits prints 9 or 10 lines, and the hook rule of the design allows the summary line and the command. P5 T3 owns that rule. Second, from the independent review of 2026-11-27: the timed workload has no case in which another process holds the Store. Two tests show that case: the checkpoint of a commit then waits 5 seconds and exits 1, so a foreground hook can add about 5.5 seconds to a git action. No table of this result holds that time. The [evidence report](evidence.md#owner-gate-og-4-the-run-mode-of-a-git-hook) records both.
- Owner or reviewer disposition: the owner answered owner gate OG-4 on 2026-11-28 with this result: a git hook runs the checkpoint in the foreground, with a short time limit on the wait for the Store. The result stays informational.
- Supported-scope limit: this repository on this machine; informational only.
- Expiry: the material change triggers above. One of them holds since 2026-11-28: the hook block that P5 built differs from the proof hooks in what it runs, so current use of this result for the hook columns ended.
- Later result: `PERF-007-R2`, below.

#### Result Record Of The Requalification

[P5](05-git-hooks-in-setup.md#requalification-of-perf-007-with-the-built-block) holds the authorization, the budget event `W35-R0-P5-PERF-007-2`, and the stated differences of the method. That record was written before the counted runs. The profile text above did not change.

- Result ID: `PERF-007-R2`
- Exact profile binding: `PERF-007`, version `1`, the source digest above.
- Build and evidence fingerprint: a branch build, not a release: the built CLI of branch `docs/w35-store-authority-and-agent-reminders` at `7e3436d0` plus the uncommitted P5 change, which reports version `2.1.1`. The package file that `npm pack` makes from that build has the SHA-256 `6eabbaca4313dd34d8b03910361c025d2e61ebabf351fc84711d905cc8191e43`. The candidate was not packed and installed: the harness started the built CLI of the checkout through a small command file, because the sandbox of the builder cannot reach the package registry.
- Environment and workload: the maintainer machine, macOS on Apple silicon (arm64, Apple M2 Pro, 10 cores, 16 GiB), Node `v26.13.1`, git 2.47.1. Two fresh clones of this repository at `7e3436d0` for each run, each with the commits of the files that setup wrote: 4,417 store units after the first sync. The harness as it ran: [perf-007-r2-harness.mjs](evidence/p5/performance/perf-007-r2-harness.mjs), SHA-256 `76480cb1b974ff779d0a7944cb76b06b02ddf38686569f611ac11b5df0b6f269`. It is the harness of `PERF-007-R1` with the differences that the requalification record states: the hooks are the blocks that `make-docs setup --yes --git-hooks` installs (block version 2), in the background mode and in the foreground fallback.
- Raw and analyzed evidence: [perf-007-r2-results.json](evidence/p5/performance/perf-007-r2-results.json).
- Comparability: the column with no hook is comparable with `PERF-007-R1`. The hook columns are `not-comparable` with `PERF-007-R1` as a result: the hooks, the way they find the command, and the candidate install differ. The no-hook time of a commit is 24 ms here and 32 ms there, so the machine state also differed.
- Observed distribution, in milliseconds, for one git action. Each cell is the median, then the minimum to the maximum, of 15 samples. "Adds" is the median minus the median with no hook. "Ends after" is the median time between the end of git and the end of the last background checkpoint that the hook started. The CLI floor (`make-docs --version`, 9 samples) is 91 (89 to 92).

| Action | State | No hook | Installed hooks, background | Adds | Ends after | Installed hooks, foreground fallback | Adds | Its background run ends after |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `git commit` | no change | 24 (23 to 25) | 83 (81 to 87) | 59 | 461 | 516 (509 to 534) | 492 | 453 |
| `git commit` | one changed work file | 25 (25 to 27) | 84 (82 to 87) | 59 | 543 | 606 (594 to 611) | 580 | 455 |
| `git merge` (a true merge) | no change | 47 (46 to 48) | 97 (96 to 176) | 51 | 458 | 534 (528 to 610) | 487 | 456 |
| `git merge` (a true merge) | one changed work file | 48 (47 to 50) | 98 (96 to 106) | 50 | 545 | 619 (612 to 627) | 572 | 455 |
| `git commit --amend` (the rewrite, two hooks) | no change | 24 (24 to 27) | 135 (132 to 213) | 111 | 857 | 570 (564 to 632) | 546 | 860 |
| `git commit --amend` (the rewrite, two hooks) | one changed work file | 25 (25 to 31) | 138 (134 to 143) | 113 | 955 | 657 (640 to 682) | 632 | 869 |
| `git checkout <branch>` | no change | 16 (15 to 18) | 75 (73 to 153) | 59 | 345 | 394 (389 to 462) | 378 | 336 |
| `git checkout <branch>` | one changed work file | 16 (16 to 17) | 75 (73 to 80) | 59 | 348 | 394 (388 to 399) | 378 | 338 |

A hook run that is the first sync of a checkout, as one `git commit` (3 samples for each mode):

| Mode | The commit takes | The checkpoint ends after the commit |
| --- | --- | --- |
| Installed hooks, background | 161 (141 to 239) | 1,706 later |
| Installed hooks, foreground fallback | 1,825 (1,821 to 1,875) | with the commit. The background run that the fallback also starts ends 454 later |

- What the tables show: in the background mode the installed hooks add about 59 ms to a commit and to a branch change, about 50 ms to a true merge, and about 112 ms to an amended commit, which runs two hooks. The checkpoint then ends 0.35 seconds to 0.96 seconds after git returned. A commit that is the first sync of a checkout takes about 0.16 seconds, and its checkpoint ends about 1.7 seconds later. In the foreground fallback the hooks add about 0.49 seconds to a commit or a true merge with no change, about 0.58 seconds when one work file is imported, and about 0.38 seconds to a branch change. An amended commit in the fallback adds about 0.55 seconds and not two times the commit value: its second hook finds the background run of the first one alive and uses the background. A first sync in the fallback takes about 1.8 seconds one time.
- What a person sees, as the harness checked it in each sample: nothing in the background mode, in any state. In the foreground fallback, nothing with no change, and the short form with one changed work file: one line after a commit, a merge, or a rewrite, and two lines after a branch change.
- Correctness: every run passed every condition that the requalification record names. Each git action exited 0. The work tree was clean after each action and after each background checkpoint ended. The store units changed only for a commit, a merge, or a rewrite with one changed work file, and never for a branch change. Each background checkpoint ended with exit code 0. The foreground fallback ran only in its mode. The harness did not count the checkpoints that one action starts, which the profile asks for: the built block writes no log line. This is a stated difference.
- Uncertainty and exclusions: three runs on one machine with a warm file cache, on macOS only; another machine, a larger project, many changed work files, or another platform can differ. The fallback of this result is made by the harness, with a start mark of a process that is gone. No run measured a shell that stops the background process.
- Budget ledger, for budget event `W35-R0-P5-PERF-007-2`. Declared limits: 3 runs, 1 correction attempt for a harness defect, 1 review cycle, 2 hours in all, 0 external spend. Materially distinct attempts: 1. The three counted runs ran one time, with no failure and no correction. Time, compute, and external spend: 276 seconds of harness time for the three runs, about 1 hour in all with the record and the harness; no external spend. Review cycles used: 0 of 1. Remaining budget: 0 runs and 1 correction attempt, which stays unused. Unchanged evidence reused: none. Before the counted runs, one trial of the harness ran with 1 run and 1 round, at the same time as other tests, so its times are not usable, and it is not part of this result. Stop reason: all three runs done; no failure. Code changed after the run: the file of the start code moved to another source folder, and the entry file changed how it loads the rest of the CLI, so that two dependency tests of the suite pass. What a hook start runs did not change. The package digest changed with it. No sample ran again.
- Outcome: `pass`
- Findings: one, outside the timed workload. The foreground fallback still costs what the foreground hook cost, and that cost grows with the count of work files ([register entry R-047](../../prd/03-open-questions-and-risk-register.md)). The side measure of P5 shows it by count.
- Owner or reviewer disposition: none yet. The owner decided the background mode on 2026-11-28 before this result. The result goes to the owner with the P5 report, and it stays informational.
- Supported-scope limit: this repository on this machine; informational only.
- Expiry: the material change triggers above.
- Later result: none.

### Ledger And Result Of The PERF-004 Requalification

- Authorizing scope and budget event: W35 R0 P4 T22, `W35-R0-P4-PERF-004-2`.
- Declared limits for `PERF-004`: 3 runs, 1 correction attempt for a harness defect, 1 review cycle, 1 hour in all, 0 external spend.
- Materially distinct attempts: 1. The three counted runs of `PERF-004` ran one time, with the kept harness and no change to it, with no failure and no correction.
- Time, compute, and external spend for `PERF-004`: 143 seconds of harness time for the three runs, and 6 seconds for the side measure; no external spend.
- Review cycles used: 1 of 1. The independent review of 2026-11-27 read the result and found that the words "no added time from the fix" had no support in it. The correction changed the words and added the second side measure. It made no new counted run and changed no number of `PERF-004-R2`.
- Remaining budget: 0 runs, 0 review cycles, and 1 correction attempt, which stays unused.
- Stop reason: all three runs done; no failure.
- Result: `PERF-004-R2`, outcome `pass`, in the [result record of the profile](../2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md#result-record). Raw evidence: [perf-004-r2-results.json](evidence/p4/performance/perf-004-r2-results.json).
- Side measure, outside the `PERF-004` profile: [perf-004-r2-wait-results.json](evidence/p4/performance/perf-004-r2-wait-results.json). One sync with no change alone: 459 ms (median of 5). Two started at the same time: the first one ends after 468 ms, and the second one after 764 ms. So the second sync waits about 305 ms for the Store, which is about the time that the first one works inside its write session. Before the fix, the scan ran outside the session, so a second sync could scan while the first one held the Store. This phase did not measure that older wait.
- Second side measure, outside the `PERF-004` profile: [perf-004-r2-compare-results.json](evidence/p4/performance/perf-004-r2-compare-results.json), 54 seconds of harness time, on 471 work files. `work sync` with no change: 431.8 ms with the fix and 432.6 ms before it (medians of 25). `make-docs project checkpoint` with no change: 498.9 ms with the fix and 503.0 ms before it. The medians differ by less than 5 ms, and the samples of one build spread over 70 ms to 110 ms. So the comparison found no difference larger than its spread. It does not prove that the fix costs nothing. The harness as it ran has the SHA-256 `b4dfd6cb1bc3ebbf2f4ff0e82911009f1ce109ab6f6447fe7beb6774c1c52894`. The [evidence](evidence.md#the-fix-for-two-syncs-at-the-same-time-t18-to-t23-a47a-to-a47f) holds the method and its limits.

## Source PRD Docs

- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md): R-CLI-SETUP-1 to R-CLI-SETUP-6, `Lifecycle commands`
- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md): R-DB-7, R-HARNESS-STATE-2, R-HARNESS-STATE-6, R-MIN
- [52 Work Store and Work Queue](../../prd/52-work-store-and-work-queue.md): R-WORK-STORE-11, R-WORK-SYNC-2, R-WORK-SYNC-4, R-WORK-SYNC-9. Stage 5 T23 adds a Requirement History entry for the sync core.
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md): R-ACCESS-6, R-ACCESS-9, R-ACCESS-16
- [30 Plugin Substrate and Workflow Bundles](../../prd/30-plugin-substrate-and-workflow-bundles.md): R-ADMIT-1, R-LEGACY-1, R-LEGACY-2
- [48 Performance Evidence Governance](../../prd/48-performance-evidence-governance.md)

## Source Obligations, Scenarios, And Findings

- `O-###`: none
- `NUAT-###`: none
- Findings: [register entry R-041](../../prd/03-open-questions-and-risk-register.md), which Stage 5 fixes and T23 closes. T16 adds register entries.

## Stage 1 - Git facts on each platform

### Tasks

- [x] T1: Add a test file for the pull facts, with a helper that builds temporary repositories and records which hooks ran. The design checked each fact with git 2.47.1. `post-merge` runs for `git pull` with a merge. `git pull --rebase` with no local commits runs `post-merge`. `git pull --rebase` with local commits runs `post-checkout`, `post-commit`, and `post-rewrite`, and not `post-merge`. Each test records the git version of its runner.
- [x] T2: Add tests for the commit and state facts, with the helper of T1. An amended commit runs `post-rewrite` and `post-commit`. The rebase folder of git is still there when `post-rewrite` runs. `MERGE_HEAD` is still there when `post-merge` runs after a true merge.
- [x] T3: Add tests for the facts of the hook after a checkout, with the helper of T1. `post-checkout` also runs for a file checkout (third argument 0), for `git worktree add`, and for a clone.
- [x] T4: Prove that `git rev-parse --git-path hooks` in a linked worktree returns the hooks folder of the main checkout, and that one hook file runs for every worktree of the clone.
- [x] T5: Find how setup detects `core.hooksPath` for the repository and for the whole machine, and how it tells a hook file that is not a shell script and a hook file that another tool owns. Record the detection rule that P5 uses to refuse.
- [x] T6: Prove how a git hook script runs on Windows. git on Windows is expected to run a hook through the shell that it ships, and not through the Windows command shell. The test proves which shell runs a hook file on the Windows runner, that a hook file with a small marked block runs in it and exits 0, and what PATH the hook sees. T9 uses this result to prove that the hook finds the `make-docs` command there.
- [x] T7: Prove the rule for git in the middle of an action. Find how a hook after a commit or a branch change detects a rebase, a merge, a cherry-pick, or a bisect. Prove that the hooks after a merge and after a rewrite can still run the checkpoint while git shows its merge or rebase state. If the proof fails on a platform, record the gap for the hook review that setup shows.
- [x] T8: Add each new test file of T1 to T7 to both fixed test lists in `.github/workflows/platform-safety.yml`: the step "Run platform safety contracts" of the job `platform-contract`, and the step "Run required source safety matrix" of the job `installed-package`. Without this change the tests run on Linux only. This task closes when both lists hold the files and the tests pass on the maintainer machine. The three-platform result comes later, in the order of [standing rule 12](00-index.md#standing-rules): the phase commit, the push, the pull request run, then one evidence commit of the form `docs: [W35 R0 P4] Agent Checkpoints and Triggers - Git Hook Proofs Evidence`. That commit records a fact that fails on a platform as a gap, not hidden.

### Acceptance criteria

- A39: Both fixed test lists of the workflow hold the test files of this stage. Each git fact of T1 to T4 has a test result on each of the three platforms, with the git version and the link to the workflow run, or a named gap. The platform part of this case passes only after the phase commit, the push, and the pull request run, with the evidence commit.
- A40: The evidence report states the detection rule for another tool's hooks, the hook shell on Windows with the PATH that a hook sees there, and the rule for git in the middle of an action, each with its proof.

### Dependencies

- P1.

## Stage 2 - Command lookup, access, and the record

### Tasks

- [x] T9: Find how a hook finds the `make-docs` command when it is not on PATH. Git runs a hook with the environment of the git process, and an app that starts git can pass a short PATH. Try each candidate on each platform, with the install methods that the project supports: a PATH lookup alone, and a PATH lookup followed by a path that setup recorded in the block. On Windows, prove it in the hook shell that T6 found, with the command file that each supported install method writes there. Record the choice and its proof. A hook that finds no command does nothing and exits 0. Add the test file of this task to the two workflow lists, as T8 does, so that it runs on each platform. The platform runs follow the same order as T8, and the evidence commit records them. Also prove the folder in which a hook runs the checkpoint: from a subfolder of a project, such as `docs/`, the checkpoint says that the folder is not a Make Docs project and exits 0 ([P1 evidence](evidence.md#known-limits)), so a hook must run the checkpoint at the project root or pass `--target-root`.
- [x] T10: Find whether a hook that an agent's commit starts passes that agent tool's Store access rules. The run is a session inside an agent tool, so [standing rule 11](00-index.md#standing-rules) says who starts it. The steps for each first-party agent tool: open a temporary project with a temporary Store, install a test hook that runs `make-docs project checkpoint --event commit`, and make a commit from inside the tool. Record what the checkpoint may do there: write, read only, or nothing. Record which tool ran which proof, and each tool with no run as "no proof gathered".
- [x] T11: Find whether the clone-owned hook record needs a Store schema change. The Store file ledger belongs to one checkout, and the hooks folder is shared by every worktree of a clone and is outside a linked worktree's project folder. Check whether an existing record can hold the exact hook block for the clone's shared git folder, with drift detection, exact removal, and the rule that `setup remove` removes the block only when no other bound checkout of the clone remains. Record the answer. If no existing record fits, owner gate OG-3 opens: record that, bring the gate to the owner, and do no schema work. The gate blocks P5 and not this phase.
- [x] T12: Record the two-worktree behavior of the checkpoint with no hook. Run a direct checkpoint in one worktree, then in a worktree of the same clone on another branch. Record what the store holds and what each worktree reports. Nothing may be overwritten with no report.

### Acceptance criteria

- A41: The command lookup has one recorded choice, with a run on each platform that finds the command, and a run that finds none and exits 0 with no output. The Windows run is in the hook shell of T6. The platform runs are recorded with the evidence commit, as in A39.
- A42: The access runs name, for each agent tool that was run, who started the session and what the hook's checkpoint could do. Each tool with no run is named with the reason "no proof gathered".
- A43: The record question has one recorded answer: an existing record fits, with its name and the proof, or owner gate OG-3 is open with the reason.
- A44: The two-worktree record shows the store content and each worktree's report, and shows that each difference is visible as a pending write or a conflict.

### Dependencies

- P1.

## Stage 3 - Measurement and the run mode

### Tasks

- [x] T13: Write the `PERF-007` profile in this phase file, under the performance evidence profile template, before any counted measurement. Reuse the method of `PERF-004`: the installed package candidate, fresh clones of this repository, and a temporary Store at a fixed, checked path. The workload is a commit, a merge, a rewrite, and a branch change, each with no hook, with a hook that runs the checkpoint in the foreground, and with a hook that starts the checkpoint and returns. Measure each with no change, with one changed work file, and for a trigger run that is the first sync of a checkout.
- [x] T14: Run `PERF-007` within its budget. Record each median and the time that each hook mode adds to the git action. Check in each run that no project file changed and that git exited as it does with no hook.
- [x] T15: Record the result in the evidence report. State what a person sees in each mode: when the line about waiting files appears, and what happens to the checkpoint's output in the start-and-return mode. Then bring owner gate OG-4 to the owner with the measured times and one recommendation. The plan recommends the foreground run before the measurement. This task confirms that recommendation or changes it, and says which.

### Acceptance criteria

- A45: `PERF-007` has a profile written before the runs and a recorded result with its limits. `make-docs check performance-evidence` reports no error for `PERF-007`.
- A46: The owner answered OG-4, and the evidence records the answer and its date. The owner answered on 2026-11-28: option A, with a short time limit on the wait for the Store.

### Dependencies

- Stage 1.
- Stage 2.
- Stage 5.

## Stage 4 - Register and evidence

### Tasks

- [x] T16: Add entries to the [risk register](../../prd/03-open-questions-and-risk-register.md) under `## Rebuild Risks`: `git pull --rebase` with local commits runs no hook after a merge, with the cases that the hook after a rewrite covers; and one entry for each platform gap that this phase found.
- [x] T17: Add the P4 section to `evidence.md`, with one table of facts by platform and the answers of T5 to T7 and T9 to T12.

### Acceptance criteria

- A47: The register names each gap, and the evidence report gives P5 one list of what to build and what to name in the hook review.

### Dependencies

- Stage 3.

## Stage 5 - The fix for two syncs at the same time

This stage was added on 2026-11-27, after the owner decided to fix [register entry R-041](../../prd/03-open-questions-and-risk-register.md) in this Wave, before the hooks ship. The orchestrator placed it in this phase. The stage has the next free numbers, so no earlier task or case number changed, and its number says nothing about its place in the order: it depends only on P1, and Stage 3 waits for it, so that `PERF-007` measures the fixed sync core. No hook of P5 or P6 installs before this stage ends. T18 is the one task of this phase that builds product code. The [standing rules](00-index.md#standing-rules) hold: each test uses a temporary Store at a fixed, checked path.

The fault: `syncWorkFiles` in `packages/cli/src/operations/work/work-store/sync.ts` calls `scanWorkFiles` before `writeWorkStore`, so sync reads the work files before it takes the Store. When two syncs of one checkout run at the same time, the second one imports the file text that it read before the first one wrote. The [P1 evidence](evidence.md#known-limits) holds the review's proof.

### Tasks

- [x] T18: Move the scan of the work files inside the Store write session in the sync core, so that a sync reads the work files only after it holds the Store. A second sync then sees what the first one wrote. Change no other rule of sync. The read-only sync check (`previewWorkSync`) stays read-only and takes no write session. Review the agent form in the work store reference under the [twins guide](../../assets/project/developing-deterministic-agentic-twins.md), and record whether it needs a change.
- [x] T19: Add a test that reproduces the race of the review with the close outcome `cancelled`. Close a unit with `make-docs work close "<unit>" --expected-version <n> --outcome cancelled`, start two `make-docs project checkpoint --json` runs at the same time, and prove that the store keeps the outcome `cancelled` and never shows the unit as open. The test must fail on the code before T18. So it proves that the two runs did overlap, or it forces the order of the two runs through a test seam, and it does not pass only because the runs did not overlap.
- [x] T20: Add the same test for the close outcome `superseded`.
- [x] T21: Check notes and met gates in the same race, which the review of 2026-11-27 did not check. Add a test for each one, and record what the store holds before T18 and after T18.
- [x] T22: Measure the sync time again with the method of [`PERF-004`](../2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md#perf-004-automatic-sync-on-a-project-with-many-backlogs), because the file scan now runs inside the write session. Write the record that the [performance contract](../../../.make-docs/system/contracts/performance-evidence-governance.md) needs, with a finite budget, in this phase file before any counted run. Record the result beside [`PERF-004-R1`](../2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md#result-record), with the time that a second sync waits for the Store while the first one scans.
- [x] T23: Update [PRD 52](../../prd/52-work-store-and-work-queue.md) with a `W35 R0 P4` Requirement History entry: sync reads the work files inside its Store write session. Close [register entry R-041](../../prd/03-open-questions-and-risk-register.md) when the fix has landed and the tests of T19 to T21 pass. Record the result in the P4 section of `evidence.md`, and update the R-041 line under the [known limits of P1](evidence.md#known-limits).

### Acceptance criteria

- A47a: The sync core scans the work files inside its Store write session. The sync, checkpoint, and parity tests that existed before this stage pass. The read-only sync check opens no write session.
- A47b: With two checkpoint runs at the same time after a close with the outcome `cancelled`, the store keeps the outcome `cancelled`, and no run shows the unit as open. The test fails on the code before T18.
- A47c: The same holds for the outcome `superseded`.
- A47d: The evidence report states what happens to notes and met gates in the same race, each with a test. A loss that the fix does not remove is a named gap with a register entry.
- A47e: The sync time has a new recorded result with the `PERF-004` method, with its limits and its comparison with `PERF-004-R1`. `make-docs check performance-evidence` reports no error for the new record.
- A47f: PRD 52 holds the `W35 R0 P4` Requirement History entry, and `make-docs check prd` passes. The risk register shows R-041 as closed, with a link to the evidence. The evidence records the twin review of T18.

### Dependencies

- P1.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing `selected` and done on the maintainer machine. `packages/cli/tests/w35-r0-p4-git-hook-facts.test.ts` (34 tests) holds the git facts of T1 to T7. `packages/cli/tests/w35-r0-p4-hook-checkpoint.test.ts` (17 tests) holds the checkpoint in the hooks after a merge and after a rewrite, the command lookup, a trigger run while another process holds the Store, the Store record, and the two work trees. `packages/cli/tests/w35-r0-p4-sync-race.test.ts` (5 tests) holds the race of R-041. The platform run of 2026-11-28 (pull request 69, workflow run `46097028050`, commit `965ad51e`) ran the three files on Linux, macOS, and Windows, each with git 2.56.1. On each platform the three files pass with 34, 17, and 5 tests. On Windows one test of the first file is skipped: the symbolic link test. The [evidence](evidence.md#platform-run) holds each result. Performance Testing `selected` and done: `PERF-007`, and the requalification of `PERF-004`. Guided Progress Review and Unassisted Goal Testing stay `not-needed-now`.
- Performance evidence, later result: [`PERF-007-R2`](#result-record-of-the-requalification), `pass`, informational, from P5 with the built block.
- Performance evidence: [`PERF-007-R1`](#result-record), `pass`, informational. A foreground hook adds about 0.53 seconds to a commit with no change and about 1.1 seconds to an amended commit, and a hook that starts the checkpoint and returns adds 16 ms to 45 ms. [`PERF-004-R2`](../2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md#result-record-of-the-requalification), `pass`, informational: alone it cannot say whether the fix adds time, and it cannot give the cost of the fix as one number. A comparison of the two builds in one session, as a side measure outside the profile, found no difference larger than its spread: `work sync` with no change took 431.8 ms with the fix and 432.6 ms before it. With a foreground hook, a git action can take about 5.5 seconds longer while another process holds the Store. That worst case is from two tests, and it is not a `PERF-007` time.
- Human Experience Review: none in this phase. The phase has no human-facing surface. The [evidence](evidence.md#run-of-perf-007-and-the-run-mode-t13-to-t15-a45) says what a person sees in each hook mode, for the owner's choice at OG-4.
- Optional experience handoff: none.
- Explicit human acceptance gate: done for owner gate OG-4 on 2026-11-28. The owner chose option A: a git hook runs the checkpoint in the foreground. The owner also chose improvement 1: a short time limit on the wait for the Store, after which the hook gives up quietly. Improvement 2 was offered and not chosen, and it is not built: that the hook after a rewrite skips the amend case. So A46 has the owner's answer and its date. The [evidence](evidence.md#owner-gate-og-4-the-run-mode-of-a-git-hook) holds the answer, beside the two options with their times, what a person sees, and the worst case of each. The owner did not decide four details of the limit. The plan holds a recommendation for each, R8 to R11, and [P5 Stage 6](05-git-hooks-in-setup.md#stage-6---the-foreground-run-and-the-wait-limit) builds them as T35 to T38. Owner gate OG-3 did not open on the builder's finding of T11: an existing record fits. The independent review agreed with that reading on 2026-11-27. It is not an owner decision. Owner gate OG-6: the finding from the platform run is "no platform gap found in the run of commit `965ad51e`; the gate did not open". One fact has no Windows proof, that git runs a hook file that is a symbolic link, and the [evidence](evidence.md#platform-run) holds it with a recommendation. The finding is not an owner decision.
- Evidence report: [P4 Git Hook Proofs](evidence.md#p4-git-hook-proofs).
- Phase / capability status: built on the maintainer machine, not complete. The orchestrator ran T10 on 2026-11-27 for Codex and Claude Code, and A42 has its record in the [evidence](evidence.md#the-access-runs-in-each-agent-tool-t10-a42). GitHub Copilot CLI has no run, with the reason "no proof gathered". The main finding: a hook syncs only when the shell of the agent may write the Store. The platform run is done, and the notes for A39 and A41 below say what each case has. The independent review of the platform record and the package digest are not done.
- T8 and T9: both fixed lists of `.github/workflows/platform-safety.yml` hold the two git proof test files and the race test file. The tests pass on the maintainer machine, and on Linux, macOS, and Windows in the platform run of commit `965ad51e`, in the platform contract job and in the installed package job.
- A39: what it has now. Both fixed lists hold the test files. Each git fact of T1 to T4 has a test result on Linux, on macOS, and on Windows, with the git version (2.56.1 on each platform of the run, and 2.47.1 on the maintainer machine) and the link to the workflow run, in the [evidence](evidence.md#the-git-facts-by-platform-t1-to-t4-a39). One fact of that table differs on Windows, as its test expects: git runs a hook file that is not executable there. For three parts of those facts the test passed and its log line holds no value, and the table names each one. What is still missing: the evidence commit of standing rule 12, which the orchestrator makes, and the review of this record.
- A41: what it has now. One recorded choice: a PATH lookup, and then a recorded path. On each of the three platforms a run finds the command through PATH, a run finds it through the recorded path with a short PATH, a run finds the command file of a real global install, and a run that finds no command exits 0 with no output. The Windows runs are in the hook shell of T6, which the log shows as a bash shell with the kernel name `MINGW64_NT-10.0-26100`. Neither of the two tests that can skip took its skip path on any platform. What is still missing: the evidence commit of standing rule 12, and the review of this record. One Windows point has no logged value: the log does not say whether the block used `cygpath` for the folder of `node`.
- T15: the result, what a person sees in each mode, and the recommendation are in the evidence. The task is checked because the builder's part is done. The owner answered the gate on 2026-11-28.
- T18: the one product change of the phase. `syncWorkFiles` scans the work files inside its Store write session. The agent form needs no change, and the [evidence](evidence.md#the-fix-for-two-syncs-at-the-same-time-t18-to-t23-a47a-to-a47f) records the twin review.
- T19 to T21: the race tests fail on the code before T18 (the store shows the task as open) and pass after it, 20 of 20 runs in a row. They force the overlap with a helper process that holds the Store write lock, with no test seam in the product. A progress note and a met gate stayed before the fix and stay after it, with one test each.
- T23: PRD 52 R-WORK-SYNC-1 and its `W35 R0 P4` Requirement History entry. Register entry R-041 is closed, and R-043 to R-045 are new.
- New behavior: the [evidence](evidence.md#p4-new-behavior-that-the-documents-did-not-state) lists 13 points that no document stated. The owner has not reviewed them. [P5 Stage 5](05-git-hooks-in-setup.md#stage-5---proposals-from-phase-4) holds each one that P5 can build as a proposal, with a task and a case.
- Review correction of 2026-11-27: the independent review found four statements that the proofs did not support, and the phase corrected them. The rule for git in the middle of an action stops every hook run of a cherry-pick with no conflict, also of one commit. `REVERT_HEAD` stops no hook run of a revert. `PERF-004-R2` alone cannot say whether the fix adds time. The OG-4 text left out the worst case of the foreground mode. The [evidence](evidence.md#p4-review-corrections-of-2026-11-27) lists each correction.
