---
title: "Phase 2: Reminder and Read Commands"
kind: "work"
status: "draft"
coordinate: "W35 R0 P2"
source:
  type: "prd"
  path: "docs/prd/52-work-store-and-work-queue.md"
---

# Phase 2: Reminder and Read Commands

## Purpose

Make a Make Docs command that an agent already runs say when work files wait for sync. It depends on P1, because each line names the checkpoint command.

## Overview

This phase adds one reminder check to each command with Store read access. The check runs after the command's own operation ends, and it prints one line when work files still wait for import. The phase also changes the first lines of `work next` and `work status`, marks out-of-date units in `work next`, and adds one sentence to a project URI read. It measures the cost of the reminder check with `PERF-006`. The read commands still change nothing: under design OD-2 option A they detect the out-of-date state and name the checkpoint, and they do not sync. The reminder, the marks, the "list is not complete" line, and the URI sentence are new.

The reminder line is:

`Work files wait for sync. Run: make-docs project checkpoint`

The [standing rules](00-index.md#standing-rules) of the index hold in this phase.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. When work files changed and the store does not have them yet, the next Make Docs command says so in one line with the exact command.
- Intended human outcome: a person or agent who runs any Make Docs command with Store read access learns in one line that the store is out of date and which command settles it. A person who reads `work next` does not act on an out-of-date line.
- Human-facing surface or indirect effect: the reminder line on standard error, the reminder field of an MCP result, the first lines and marks of `work next`, the first lines of `work status`, and the text of a project URI read.
- Implementation work: the reminder check in the operation runner, the render change, the read command changes, the URI sentence, and tests.
- Evidence source or testing type selected under current authority: reminder tests for the whole set, `PERF-006`, and a Guided Progress Review of the lines.
- Executor: the implementing agent runs the tests and the measurement. The owner reviews the lines.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Reminder set, exclusion, output channel, error drop, mark, and URI sentence tests. |
| Performance Testing | selected | `PERF-006`, `characterize-now`, informational. |
| Guided Progress Review | selected | The owner sees the reminder line and the first lines of `work next` and `work status`. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

- Base maintenance action: `create`
- Performance applicability: `characterize-now`
- Canonical `PERF-###` profile link or `none`: `PERF-006`, written in this phase file by T9 before any measurement, under a `## Performance Evidence` section, as [`PERF-004`](../2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md#perf-004-automatic-sync-on-a-project-with-many-backlogs) is in its phase.
- Finite evidence budget and stop-rule reference or `not-applicable`: budget event `W35-R0-P2-PERF-006-1`. At most 3 characterization runs, 1 correction attempt for a harness defect only, 1 review cycle, 2 hours in all, the maintainer machine only, and no external spend. Stop after three runs or at the first correctness failure. The budget does not renew itself.
- Execution packet link or `not-applicable`: Stage 3 tasks T9 to T11.
- Outcome and evidence handoff or `none`: the result goes to the evidence report and to owner gate OG-2 when its condition holds.
- Gate disposition and supported-scope limit or `not-applicable`: informational for speed. One machine, this repository's work files, and the candidate build. Correctness of the check stays blocking.

## Performance Evidence

This phase is the one canonical record of `PERF-006`. The [evidence report](evidence.md#p2-reminder-and-read-commands) binds the run to this profile and repeats the result in plain lines. It does not define a second profile.

### Performance Applicability

| Field | Value |
| --- | --- |
| Candidate ID | `W35-REMINDER-CHECK` |
| Title | The reminder check on each Make Docs command with Store read access |
| Testing Type | Performance Testing |
| Base Maintenance Action | `create` |
| Protected Outcome | A person or agent who runs a Make Docs command with Store read access gets the answer without a wait that gets in the way, although the command now runs the reminder check when it ends. |
| Decision Informed | Whether the exact check of design OD-6 option A stays on each command of the reminder set (owner gate OG-2), and what the result means for the owner's decision "Fast path: not now" of 2026-11-23. |
| Failure Cost | A slow check on the 46 commands of the set that run it makes every one of them feel heavy. A stored signal built too early adds a Store schema change and a second way to find a change. |
| Risk And Reversibility | Local and reversible: the reminder set can shrink, or a stored signal can come, in a later release. A false pass hides a slow command on a larger project. A false fail opens owner gate OG-2 with no need. |
| Supported Scope | One clone of this repository, on the maintainer machine, with the packed package candidate. |
| Product Maturity | Unreleased package candidate; bounded characterization. |
| Source Authority | [PRD 52](../../prd/52-work-store-and-work-queue.md) R-WORK-SYNC-8, [PRD 48](../../prd/48-performance-evidence-governance.md), [design](../../designs/2026-11-27-agent-checkpoints-and-triggers.md) OD-6, [plan overview](../../plans/2026-11-27-w35-r0-agent-checkpoints-and-triggers/00-overview.md#performance-evidence-plan). |
| Source Evidence | [`PERF-004-R1`](../2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md#result-record): `work next` and `work status` add about 250 ms of sync check over the CLI floor at 463 work files. |
| Baseline Availability | None for these commands. `PERF-004-R1` measured the same check inside other commands. |
| Applicability | `characterize-now` |
| Target Class | `characterization-baseline` |
| Owner | Make Docs maintainer; W35 R0 P2. |
| Lifecycle Coordinate | W35 R0 P2. |
| Gate Effect | Informational for speed. No speed promise. Correctness of the check in the run stays blocking. |
| Reason | The reminder check and the package candidate exist, so a measurement can inform owner gate OG-2 now. |
| Next Record | [PERF-006](#perf-006-the-reminder-check-on-commands-with-store-read-access). |

### PERF-006 The Reminder Check On Commands With Store Read Access

#### Identity And Authority

| Field | Value |
| --- | --- |
| Profile ID | `PERF-006` |
| Profile Version | `1` |
| Source Digest | `sha256:c152adba454e194b07d30e6b0c73e5b55997f7992d8cbea0b1a96419d8beccbb` |
| Title | The reminder check on commands with Store read access |
| Protected Outcome | Show, for a sample of commands of the reminder set, the time of the command with the reminder check and with no check, with and without a work file that waits for import, next to the time of a CLI start with no work. |
| Source Requirements | [PRD 52](../../prd/52-work-store-and-work-queue.md) R-WORK-SYNC-8 and the new R-WORK-REMIND, [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) new R-RENDER-4, [performance contract](../../../.make-docs/system/contracts/performance-evidence-governance.md). |
| Canonical Owner | `docs/work/2026-11-27-w35-r0-agent-checkpoints-and-triggers/02-reminder-and-read-commands.md` |
| Product Maturity | Unreleased package candidate; bounded characterization. |
| Applicability | `characterize-now` |
| Target Class | `characterization-baseline` |
| Risk And Failure Cost | Local and reversible. A false pass hides a slow command on a larger project. A false fail opens owner gate OG-2 with no need. |
| Owner | Make Docs maintainer. |
| Approver | Make Docs owner. |

#### Supported Scope

| Field | Value |
| --- | --- |
| Surface | The installed `make-docs` command, each sampled command as one process from start to exit: `project state status`, `lifecycle list`, `factory status`, `work evidence read`, `resource ensure --dry-run`, `backlog snapshot --work-store`, and `work add`. |
| Platform Or Runtime | macOS 27.2.1 on Apple silicon (arm64), Node `v26.13.1`, built-in `node:sqlite`. |
| Deployment Or Device Class | The maintainer machine, local SSD, a temporary folder. |
| Scale | One clone of this repository at the candidate commit. The result records the exact count of work files and units. |
| Account And Network State | One local user. No network during a timed command. |
| Resource Envelope | No limit beyond the machine. |
| Exclusions | Windows and Linux, other projects and sizes, many files that wait for import, concurrent commands, MCP calls, the 40 commands of the set that are not in the sample, and any speed promise. `backlog review refresh` is not in the sample: it needs the session data of a review app, and it runs the same snapshot and sync check that `backlog snapshot --work-store` runs. The default `backlog snapshot`, with no `--work-store`, is not in the sample: after the fix pass of 2026-11-27 it runs no reminder check, so the check adds nothing to it. |

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
| Product Build | Two installs of one packed `@brucewaynedecoy/make-docs` `2.1.1` candidate from branch `docs/w35-store-authority-and-agent-reminders` at `1a9c552c` plus the uncommitted P2 changes, built with `npm run prepack -w packages/cli`, packed with `npm pack`, and installed with `npm install` in two temporary folders. The first install is the candidate as packed: the build with the check. The second install is the same package with one change, made by the harness: in the installed bundle, the function `workReminderFor` returns null in its first statement. This is the build with no check. The harness stops unless exactly one place in exactly one bundle file changes. |
| Dependency State | Repository `package-lock.json` installed with `npm ci`; the candidate's dependencies from the npm registry. |
| Configuration | `MAKE_DOCS_HOME`, `HOME`, `CODEX_HOME`, and `CLAUDE_CONFIG_DIR` set to new temporary folders for each run. The clone's own `.make-docs/config.yaml`, with its `work.syncHold`. |
| Qualified Environment | The maintainer machine, as above. |
| Dataset Or Fixture | A fresh `git clone --no-hardlinks` of this repository at the candidate commit for each run, so only committed files are read. |
| Workload | For each run, with the three harness methods `none`: a plain `make-docs setup --yes`, which makes the Store and stops on ownership, then `make-docs setup --yes --adopt`, then one `make-docs work sync --json` (the first import, outside the result). Then three `make-docs --version` calls with each build (the floor). Then five rounds in the state "nothing waits": each sampled command one time with the build with no check and one time with the build with the check. Then five rounds in the state "one file waits": before each timed command the harness adds one comment line to the end of one work file, so that exactly one work file waits for import, and then runs the command, again with each build. `work add` syncs first, so its run with a waiting file also measures that command's own sync, which imports the file. `backlog snapshot --work-store` already runs the sync check, and the reminder reuses that result. |
| Scale | The work files of the clone. The result records the count. |
| Concurrency | One process at a time. No other Make Docs command runs. |
| Operation Mix | As in Workload. |
| Workload Exclusions | Claims, reports, closes, conflicts, files that wait for a write or a removal, and more than one file that waits for import. |

#### Measurement Protocol

| Field | Value |
| --- | --- |
| Measurement Boundary | One CLI process from spawn to exit, measured by the harness around `spawnSync`. It includes Node start, module load, the Store open, the command, the reminder check, and the output. |
| Instrument And Version | `performance.now()` in Node `v26.13.1`; the [harness](evidence/p2/performance/perf-006-harness.mjs). |
| Cold Or Warm State | Warm file cache: the clone was just made and synced. |
| Warmup Rule | None. The first round is reported with the others. |
| Repetitions Or Observation Window | Three runs, each on a fresh clone and Store; five rounds of each command, state, and build per run, so 15 samples of each. |
| Statistic | The median of all samples of each command, state, and build. The time that the check adds is the median with the check minus the median with no check, for the same command and state. |
| Variance Reporting | The minimum and maximum of each command, state, and build. |
| Uncertainty Reporting | Three runs on one machine; no interval is claimed. |
| Outlier Treatment | None. Every sample is reported. |
| Comparison Method | The two builds are compared sample by sample in the same round, in the same clone and Store, the build with no check first. No equivalence test is claimed. |
| Raw Evidence Retention | Redacted per-run results in [perf-006-results.json](evidence/p2/performance/perf-006-results.json). No path, project name, or project ID is kept. |
| Observer Effects | The harness reads each output to check it; that time is outside the measured process. `work add` adds one quick item for each sample, so the store grows by a few rows during a run. |

#### Non-Sacrificable Constraints

| Constraint | Required Condition And Evidence |
| --- | --- |
| Correctness | In the state "nothing waits", no command of either build prints the reminder line. In the state "one file waits", each command that does not sync first prints the line one time on standard error with the build with the check, and no line with the build with no check. `work add` prints no line with either build, and its result shows one imported file. Standard output never holds the line. |
| Durability | Each command exits 0. |
| Safety | No run reads or writes the real Store: the harness gives each run new temporary folders and refuses a work folder inside the real Store. |
| Security | No secret is read or written. |
| Privacy | The repository keeps only counts and timings. |
| Accessibility | Not applicable: no visual surface. |
| Portability | macOS only in this run; see Exclusions. |
| Cost | Local compute only. |
| Maintainability | The harness changes only its own temporary copy of the package. |
| Fixture And Measurement Seam | The harness checks the same reminder line and the same sync counts that the P2 tests check. |

#### Evidence Budget And Stop Rules

| Field | Value |
| --- | --- |
| Authorizing Plan Or Work Scope | [W35 R0 P2](02-reminder-and-read-commands.md) T9 to T11. |
| Budget Event ID | `W35-R0-P2-PERF-006-1` |
| Characterization Pass Limit | 3 runs. |
| Materially Distinct Correction Attempt Limit | 1, only for a harness defect that is not a product result. |
| Review Cycle Limit | 1. |
| Elapsed Investigation Time Limit | 2 hours in all. |
| Compute Limit | 3 runs on the maintainer machine. |
| External Resource Spend Limit | 0. |
| Unchanged Fingerprint Action | Reuse this result. |
| Material Change Action | Rerun the three runs under a new budget. |
| Diminishing Return Rule | Stop after three runs or at the first correctness failure. |
| Budget Exhaustion Disposition | Record the result as it stands and route the question to the owner through owner gate OG-2. The budget does not renew itself. |

#### Outcome Rules

| Outcome | Exact Condition |
| --- | --- |
| `pass` | All three runs finish, every correctness condition holds, and each command, state, and build has a recorded time. |
| `fail` | A command fails, or a correctness condition does not hold. |
| `revise` | The workload does not run the check (for example, the checkout is not bound), so the measure does not show its time. |
| `blocked` | The candidate, the clone, or the temporary Store is missing. |
| `waived` | Not used. |

| Field | Value |
| --- | --- |
| Severity Treatment | `major` for any correctness or safety failure; `minor` for timing. |
| Reproducibility Treatment | `reproduced` when two or more runs agree; otherwise `intermittent`. |
| Finding Route | The W35 R0 evidence report, then the owner through the P2 closeout. |
| Escalation Route | The owner, through owner gate OG-2 when its condition holds. |

The OG-2 decision rule: owner gate OG-2 opens only when the check adds more than 1 second over the same command with no check, for any sampled command and state. The record of 2026-11-23 used the same 1 second for a sync with no change. The 1 second is a decision line for this choice, not a product speed promise.

#### Expiry And Reevaluation

| Field | Value |
| --- | --- |
| Material Change Triggers | A change to the sync check, the parser, the reminder check, the store-mode snapshot, the Store schema, Node or SQLite, or a project with many more work files. |
| Time Or Release Boundary | The next Make Docs release that changes the sync check or the reminder set. |
| Current-Use Invalidation Rule | Any material change trigger ends current use. |
| Next Review Condition | A person reports a slow Make Docs command, or this repository holds about 900 work files, as the record of 2026-11-23 says. |
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
| Plan And Work Links | [Plan overview](../../plans/2026-11-27-w35-r0-agent-checkpoints-and-triggers/00-overview.md), [plan P2](../../plans/2026-11-27-w35-r0-agent-checkpoints-and-triggers/02-reminder-and-read-commands.md), [this phase](02-reminder-and-read-commands.md). |
| Result Links | [P2 evidence](evidence.md#p2-reminder-and-read-commands). |
| Finding Links | none |
| Obligation Links | none |
| History Links | none |
| Support Links | [Results](evidence/p2/performance/perf-006-results.json), [harness](evidence/p2/performance/perf-006-harness.mjs). |

#### Evidence Fingerprint

- Profile ID, version, and digest: `PERF-006`, version `1`, the source digest above. The digest is the SHA-256 of this profile text from its `### PERF-006` heading to the end of `Lineage And Traceability`, with the digest value written as `sha256:pending`.
- Product build and relevant code state: a branch build, not a release: the packed candidate that reports version `2.1.1`, identified by its tarball SHA-256 `1777736182a77b361dd6d53f2042c1008b2f0973e779c321cc67c9729b524bfa`, built from `1a9c552c` plus the P2 changes of Stages 1 and 2. The build with no check is that package with one changed statement.
- Dependency and configuration state: `npm ci` from the repository lock file; the candidate installed with `npm install`; the clone's own config with its `work.syncHold`.
- Qualified environment: the maintainer machine, macOS 27.2.1 arm64 (Apple M2 Pro, 10 cores, 16 GiB), Node `v26.13.1`.
- Workload and fixture or dataset: a fresh clone of this repository at `1a9c552c` for each run: 471 work files imported and 4,382 store units.
- Instrument version: `performance.now()` in Node `v26.13.1`; the harness as it ran, SHA-256 `d1aa5c7f19b5314977fae4d90888f16db7b2ecafc1f671ee07986df60ff1737b`.
- Analysis method: per command, state, and build: the median, minimum, and maximum of all samples. The added time is the median with the check minus the median with no check.
- Comparability result and reasons: `not-comparable` with `PERF-004-R1` as a result: other commands, and 471 work files in place of 463. The time of the check itself agrees with it: about 190 ms here and about 250 ms of sync check there.

#### Budget Ledger

- Authorizing scope and budget event: W35 R0 P2, `W35-R0-P2-PERF-006-1`.
- Requalification authorization: none.
- Declared limits: 3 runs, 1 correction attempt for a harness defect, 1 review cycle, 2 hours in all, 0 external spend.
- Materially distinct attempts: 1. The three counted runs ran one time, with no failure and no correction.
- Affected checks: none.
- Time, compute, and external spend: 303 seconds of harness time for the three runs, about 1 hour in all with the profile and the harness; no external spend.
- Review cycles used: 0 of 1. The owner's Guided Progress Review is open.
- Remaining budget: 0 runs and 1 correction attempt, which stays unused.
- Unchanged evidence reused: none. Before the counted runs, one trial of the harness ran with 1 run and 1 round, to prove that the harness works. It is not part of this result. It showed the same picture: the largest added time was 202 ms.
- Stop reason and escalation: all three runs done; no failure. Owner gate OG-2 did not open.
- Profile text changed after the run: the fix pass of 2026-11-27 added one sentence to the Exclusions row, about the default `backlog snapshot`. So the source digest changed from `sha256:5e956f973b5e495fbce28a3d1df7c0bd3ea0a916cbcf67d45e9b25018cf8dc27` to the value above. The workload, the method, and the result did not change, and the profile version stays `1`. The reviewer checks this choice.
- Code changed in the fix pass of 2026-11-27, after the run: the reminder check gained one early stop, for a backlog snapshot that ran no sync check of its own. The CLI prints the line only for exit code 0. The MCP field names the tool and is absent on a refusal. The sync check line of `work status` and `work next` names the checkpoint. Each of the seven sampled commands runs the same statements of the check as in the run: `backlog snapshot --work-store` still passes the access check and the authority rule and then reuses its own sync check. The profile names "a change to the reminder check" as a material change trigger. The builder's reading is that the measured path did not change, so `PERF-006` was not rerun. The budget has no run left, and a rerun needs a new budget with owner authority. The reviewer and the owner decide whether this reading holds.
- Code changed after the run, before the review: the rule catalog gained `WORK-RULE-066` to `WORK-RULE-069`, and the PRDs, the work store reference, and the tests changed. None of these changes the reminder check, the sync check, the parser, the snapshot, the Store schema, or Node, so none is a material change trigger, and PERF-006 was not rerun. The orchestrator's package digest of the phase commit is for a later build of the same check code.

#### Result Record

- Result ID: `PERF-006-R1`
- Exact profile binding: `PERF-006`, version `1`, the source digest above.
- Build and evidence fingerprint: as above.
- Environment and workload: as above.
- Raw and analyzed evidence: [perf-006-results.json](evidence/p2/performance/perf-006-results.json).
- Observed distribution, in milliseconds. Each cell is the median, then the minimum to the maximum, of 15 samples. The floor has 9 samples for each build.

| Command | State | With no check | With the check | The check adds |
| --- | --- | --- | --- | --- |
| `make-docs --version` (the floor) | none | 87 (85 to 90) | 86 (85 to 88) | 0 |
| `project state status` | nothing waits | 124 (123 to 127) | 317 (311 to 323) | 193 |
| `project state status` | one file waits | 125 (120 to 128) | 315 (313 to 323) | 189 |
| `lifecycle list` | nothing waits | 143 (140 to 147) | 336 (330 to 347) | 193 |
| `lifecycle list` | one file waits | 144 (141 to 147) | 340 (333 to 342) | 196 |
| `factory status` | nothing waits | 132 (125 to 138) | 325 (321 to 336) | 193 |
| `factory status` | one file waits | 132 (128 to 137) | 326 (319 to 332) | 193 |
| `work evidence read` | nothing waits | 145 (141 to 148) | 335 (329 to 350) | 191 |
| `work evidence read` | one file waits | 144 (142 to 148) | 339 (337 to 346) | 195 |
| `resource ensure --dry-run` | nothing waits | 145 (143 to 151) | 336 (329 to 346) | 191 |
| `resource ensure --dry-run` | one file waits | 146 (143 to 150) | 337 (334 to 344) | 191 |
| `backlog snapshot --work-store` | nothing waits | 3,082 (3,063 to 3,482) | 3,101 (3,092 to 3,134) | 19 |
| `backlog snapshot --work-store` | one file waits | 3,079 (3,064 to 3,094) | 3,101 (3,086 to 3,127) | 23 |
| `work add` (syncs first) | nothing waits | 412 (408 to 420) | 570 (564 to 577) | 159 |
| `work add` (syncs first) | one file waits | 498 (493 to 507) | 658 (649 to 669) | 160 |

- What the table shows: a command that does not sync first pays for one exact check, 189 ms to 196 ms. The state does not change that time, because the check reads every work file in both states. `backlog snapshot --work-store` pays about 20 ms, because the reminder reuses the sync check of the snapshot and runs no second check. The 20 ms is the access check and the authority rule. `work add` syncs first and then pays about 160 ms for the check after its sync. With a waiting file, its time with no check is 87 ms higher (498 ms and not 412 ms), and that is its own sync, which imports the file. The largest added time is 196 ms.
- Correctness: every run passed every non-sacrificable condition. In the state "nothing waits", no command printed the line. In the state "one file waits", each command that does not sync first printed the line one time on standard error with the check (5 of 5 samples in each run), and never with no check. `work add` printed no line and imported exactly one file in each sample. Standard output never held the line. After each run, exactly one work file differed from the clone: the file that the harness changed.
- Uncertainty and exclusions: three runs on one machine with a warm file cache; another machine, a larger project, many waiting files, or an MCP call can differ. 40 of the 47 commands of the set were not measured. The check is the same code for each one, so the same added time is expected, and that is not measured. The default `backlog snapshot` was not measured. After the fix pass of 2026-11-27 it runs no reminder check.
- Budget ledger: above.
- Outcome: `pass`
- Findings: none.
- Owner or reviewer disposition: not reviewed yet. The owner's Guided Progress Review is open.
- Supported-scope limit: this repository on this machine; informational only.
- Expiry: the material change triggers above.
- Later result: none.

The OG-2 result: owner gate OG-2 did not open. The check adds at most 196 ms over the same command with no check, well under the 1 second line.

What the result means for the owner's decision "Fast path: not now" of 2026-11-23: the result gives no reason to change that decision, and design OD-6 option A puts the cost of the check on more commands than the decision covered. This is the builder's reading. The owner decides. The decision looked at a sync with no change (302 ms over the floor) and at the sync check of `work next` and `work status` (about 250 ms over the floor). Now each of the 46 commands of the reminder set that run the check pays for the same check, about 190 ms for a command that does not sync first, and a command that took about 130 ms takes about 330 ms. The backlog snapshot runs no reminder check of its own. A person does not notice that on one command. An agent that runs many commands pays it each time. At about 0.4 ms for each work file, the added time reaches 1 second near 2,400 work files, and the earlier record says to look again at about 900 work files. [Register entry Q-027](../../prd/03-open-questions-and-risk-register.md) holds the question and when to look again.

## Source PRD Docs

- [52 Work Store and Work Queue](../../prd/52-work-store-and-work-queue.md): R-WORK-STORE-1 to R-WORK-STORE-3, R-WORK-SYNC-8, R-WORK-QUEUE-5, R-WORK-URI-3, R-WORK-URI-5. This phase adds R-WORK-REMIND.
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md): R-RENDER-1 to R-RENDER-3, R-TOP-4. This phase adds R-RENDER-4.
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md): R-ACCESS-1, R-ACCESS-2, R-ACCESS-9, R-ACCESS-17
- [48 Performance Evidence Governance](../../prd/48-performance-evidence-governance.md)

## Source Obligations, Scenarios, And Findings

- `O-###`: none
- `NUAT-###`: none
- Findings: none. T14 added register entry Q-027.

## Stage 1 - The reminder

### Tasks

- [x] T1: Build the reminder set from the registry, not from a hand list: each operation that runs in a Make Docs project and whose declared access includes a Store read. Exclude `work.queue.status`, `work.queue.next`, `work.queue.sync`, and `project.checkpoint.run`. Exclude the operations with Store access and no project access (`setup.store.check`, `setup.store.clean`, `factory.tools.save`, and `factory.tools.list`); this exclusion is new in the plan. `--help`, `mcp`, `update`, and `uninstall` show no reminder. At `86dc7dba` the set has 47 operations, and the [plan](../../plans/2026-11-27-w35-r0-agent-checkpoints-and-triggers/02-reminder-and-read-commands.md#scope) lists them. Add a test that builds the set from the registry and fails when the set and the PRD 39 list differ. Six operations of the set sync first, through `syncFirst` in `packages/cli/src/operations/work/work-queue/queue.ts`: `work.queue.claim`, `work.queue.release`, `work.queue.report`, `work.queue.close`, `work.queue.add`, and `work.queue.export`. They stay in the set. The other 41 do not sync. After the review of 2026-11-27, one of the 41 is counted in the set and runs no reminder check of its own: `work.backlog.snapshot` shows the reminder only with `--work-store` (T3). So 46 operations run the check on each run.
- [x] T2: Confirm, for each tool that this phase changes, which path `formatMcpToolResult` takes. A tool with an `mcpResultSchema` has a fixed result schema and shows no reminder. `backlog.review.refresh` is the only one in the set today. Record the list in the evidence report. Add the reminder to such a tool only with proof that its schema stays valid.
- [x] T3: Add the reminder check. The check runs after the operation ends, on the state that the operation left, and never before the operation. So a command that syncs first shows no line after a good sync, because its own sync imported the files and nothing waits when it ends. Put the check in the operation runner after the handler returns. The check runs the authority rule first and stops with no line when the work store is not in charge. It then runs the exact read-only sync check that `work status` and `work next` run (design OD-6 option A). It counts only files that the next checkpoint run would import. It does not count a conflict or a file that waits for a write or a removal. It never opens a Store that the command may not open: for an operation with `optional` or `handler` Store admission, it passes the same access check for a Store read first. Any error in the check is dropped and never changes the command's result or exit code. `work.backlog.snapshot` already runs the same sync check in store mode (`previewWorkSync` in `packages/cli/src/operations/work/backlog/store-snapshot.ts`), so the reminder reuses that result there and runs no second check. The default snapshot, with no `--work-store`, runs no reminder check and shows no reminder, because [PRD 51](../../prd/51-backlog-review-and-reporting.md) R-BACKLOG-SNAPSHOT-24 says that it reads no Store state by default. The fix pass of 2026-11-27 built this after the review. If the reuse is not possible, say so in the evidence report, and T9 measures the cost of the second check.
- [x] T4: Print the line in the CLI on standard error, after the normal output of the operation, and only one time for each command run. Print it only when the command ends with exit code 0, so a command whose operation returns a refusal prints none. JSON on standard output does not change.
- [x] T5: Add the reminder to an MCP tool result as one field of the result object, so that it reaches a host through the `content` text and through `structuredContent`. The field names the command and the `project_checkpoint` tool, in the form of the first line of `work next`. A tool result that is an error or a refusal carries no such field.

### Acceptance criteria

- A16: Each of the 40 commands in the set that do not sync first and run the check on each run shows the line when one work file waits for import. `backlog snapshot` shows it with `--work-store` and never by default. None of the 47 shows it when nothing waits, when only a conflict waits, when only a file waits for a write or a removal, when the work store is not in charge, and when no usable Store exists.
- A17: Each of the six commands that sync first shows no line after a good sync, when one work file waited for import before the run. The store holds that file after the run. This test fails for a check that runs before the operation, because such a check sees the waiting file and prints the line.
- A18: `work status`, `work next`, `work sync`, the checkpoint, `--help` of any command, a command that does not end with exit code 0, and each operation with no Store read in its declared access show no reminder line.
- A19: With `--json`, standard output is byte-identical with and without the reminder, and the line is on standard error.
- A20: After a checkpoint run with write access, the next command shows no reminder. A caller with read access only still sees it.
- A21: A forced error inside the check leaves the command's output and exit code unchanged.
- A22: An MCP tool result in the set carries the reminder field in both `content` and `structuredContent`, and the field names the command and the tool. A tool result that is an error or a refusal carries none. `backlog_review_refresh` carries none and still passes its schema.

### Dependencies

- P1.

## Stage 2 - The read commands and the project URI read

### Tasks

- [x] T6: When the sync check finds files that wait for import, make `work next` and `work status` put the checkpoint command first in their result, before the list. Both keep "Changes nothing" in their help and change nothing. Each work tool result that finds files waiting names the checkpoint tool as its next step, in its `lines` and `summary` fields. The sync check line near the end of both results names the same command and tool.
- [x] T7: Make `work next` mark each listed unit whose file waits for import. When a new work file waits for import, or the first sync of this checkout is not done, make it say in one line that the list is not complete, and name the checkpoint command.
- [x] T8: Add one fixed sentence to the text of a project URI read in `packages/cli/src/operations/work/work-queue/project-resource.ts`: the read does not know whether work files wait for sync in a checkout, and `make-docs project checkpoint` there finds out. The read still runs no sync and no sync check.

### Acceptance criteria

- A23: With one changed work file, the first line of `work next` and of `work status` names `make-docs project checkpoint`, the sync check line names the same command and no other one, and each unit of that file in `work next` has the mark. Units of other files have none.
- A24: With a new work file that the store does not hold, and in a checkout whose first sync is not done, `work next` says in one line that the list is not complete and names the checkpoint command.
- A25: `work next` and `work status` change no store record and no file in each of these cases.
- A26: Each project URI read carries the fixed sentence, and its Store session stays read-only.

### Dependencies

- Stage 1.

## Stage 3 - Measurement

### Tasks

- [x] T9: Write the `PERF-006` profile in this phase file, under the performance evidence profile template, before any counted measurement. Reuse the method of `PERF-004`: the installed package candidate, fresh clones of this repository, a temporary Store at a fixed, checked path, and the CLI floor (`make-docs --version`) beside each measured command. The workload is a sample of commands from the reminder set, at least one from each group, each with and without a file that waits for import. Measure each sampled command with the reminder check and with no check, so that the record gives the time that the check adds, and say in the profile how the run with no check is made. For a command that syncs first, the run with a waiting file also measures that command's own sync, and the record says so. Put `work.backlog.snapshot` in the sample, because it already runs the sync check, and record whether the reminder reused that result or the command paid for the check two times.
- [x] T10: Run `PERF-006` within its budget. Record the work file count, each median, the CLI floor, and the time that the check adds over the same command with no check.
- [x] T11: Record the result in the evidence report next to [`PERF-004-R1`](../2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md#result-record). State what it means for the owner's decision "Fast path: not now" of 2026-11-23, which design OD-6 opens again. The record of 2026-11-23 used the line "more than 1 second over the CLI floor" for a sync with no change. If the check adds more than 1 second over the same command with no check, owner gate OG-2 opens: record that, and Stage 4 waits for the owner's answer.

### Acceptance criteria

- A27: `PERF-006` has a profile written before the runs, a recorded result with its limits, and a recorded statement about the fast path. `make-docs check performance-evidence` reports no error for `PERF-006`.

### Dependencies

- Stage 1.

## Stage 4 - Agent form, PRDs, and register

Owner gate OG-2 did not open. `PERF-006` ran on 2026-11-27, and the reminder check adds at most 196 ms over the same command with no check. The gate opens only above 1 second. So no gate stops this stage, and the dependency list holds no gate. This is a measured result and not an owner decision.

### Tasks

- [x] T12: Update the work store reference in `packages/docs/template/`: what the reminder line means, what a mark in `work next` means, and what to do when the list is not complete. Give each new `work next` rule an ID in the catalog `make-docs.work-store-rules.v1`. Copy the file byte for byte to the installed copy.
- [x] T13: Update the PRDs with a `W35 R0 P2` Requirement History entry in each:
  - [PRD 52](../../prd/52-work-store-and-work-queue.md): new R-WORK-REMIND requirements for what the reminder counts, the exact check, and the authority rule first; R-WORK-SYNC-8, so that the read commands name the checkpoint first and still change nothing; R-WORK-QUEUE-5 for the marks and the "list is not complete" line; and R-WORK-URI-3 for the fixed sentence.
  - [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md): new R-RENDER-4 for the reminder output rule and the commands that show it.
  - [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md): the reminder as a result field, and no reminder for a tool with a fixed result schema.
- [x] T14: Add one entry to the [risk register](../../prd/03-open-questions-and-risk-register.md) under `## Open Questions`: the reminder puts the cost of the exact check on more commands than the 2026-11-23 decision covered. Record the `PERF-006` result and when to look again.
- [x] T15: Add the P2 section to `evidence.md`, with the plain lines for the owner.

### Acceptance criteria

- A28: The twin rule ID test and the byte-match test pass. `make-docs check prd` passes. The risk register holds the entry of T14.
- A29: The owner reviews the reminder line, the first lines of `work next` and `work status`, one marked unit, and the "list is not complete" line. Each one names the exact command.

### Dependencies

- Stage 2.
- Stage 3.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing `selected` and done. `packages/cli/tests/w35-r0-p2-reminder.test.ts` (45 tests) covers the reminder set from the registry against the PRD 39 table, with five broken fixture rows; the real operation runner for each of the 40 operations that do not sync first and run the check on each run, with a handler that does nothing, when one work file waits for import; the backlog snapshot, which shows the line with `--work-store` and never by default; a command whose operation returns a refusal, in this process and with the built CLI; an MCP tool result that is a refusal; a changed work file under a sync hold; all 47 operations in five states with no line; the six real commands that sync first; each operation outside the set; `--help`; the access check for an `optional` and a `handler` operation; a forced error in the check; the CLI line with byte-identical JSON on standard output; one line for each run; the checkpoint that clears the reminder, and a caller with read access only; the reuse of the snapshot's sync check; the MCP field over a real client, with a real setup and connection key; `backlog_review_refresh` against its schema; the first lines, the marks, and the "not complete" line of the read commands, with no store or file change; the project URI sentence; the twin rule IDs with three broken fixtures; and the five parity fixtures `WSF-084` to `WSF-088` run through the real read commands. Performance Testing `selected` and done: [`PERF-006-R1`](#result-record) is `pass`. Guided Progress Review `selected` and open: the lines are in the [evidence](evidence.md#the-lines-for-the-owner-a29) for the owner. Unassisted Goal Testing `not-needed-now`.
- Performance evidence: [`PERF-006`](#perf-006-the-reminder-check-on-commands-with-store-read-access) was written, with its digest, before the three counted runs on fresh clones of this repository (471 work files, 4,382 store units). Result `PERF-006-R1` is `pass`. The check adds 189 ms to 196 ms to a command that does not sync first, about 160 ms to `work add`, which syncs first, and about 20 ms to `backlog snapshot --work-store`, which reuses its own sync check (medians; CLI floor 87 ms). The largest added time is 196 ms.
- Owner gate OG-2: did not open. The gate opens only when the check adds more than 1 second. No owner decision was needed, and none is recorded. The gate bullet of Stage 4 is gone for that reason. The gate tables of the [index](00-index.md#owner-gates) and of the [plan](../../plans/2026-11-27-w35-r0-agent-checkpoints-and-triggers/00-overview.md#owner-decisions) state the result.
- Review and fix pass, 2026-11-27: an independent review found three faults. A command whose operation returned a refusal printed the reminder (M1). The default `backlog snapshot` read the Store for the reminder, against PRD 51 R-BACKLOG-SNAPSHOT-24 (M2). PRD 52 R-WORK-REMIND-2 said that a held file does not count, which was false (M3). The fix pass corrected each one. It also made the sync check line of `work status` and `work next` name the checkpoint, made the MCP `reminder` field name the tool, and updated the gate tables. The [evidence](evidence.md#the-failing-cases-of-the-p2-review-run-again) shows the cases again. For M2 the reviewer named a second option, which was not taken, and the evidence says why.
- Human Experience Review: prepared, not done. The real lines of the built CLI, with a temporary Store, are in the [evidence](evidence.md#the-lines-for-the-owner-a29) for the owner's review.
- T2: `backlog.review.refresh` is the only operation of the set with a fixed MCP result schema. It carries no reminder field. The [evidence](evidence.md#t2-finding-the-mcp-path-of-each-changed-tool-a22) holds the list.
- T3: `backlog snapshot --work-store` gives its sync check to the reminder, and no second check runs. The reuse was possible, and `PERF-006` shows it.
- New behavior that the documents did not state: 22 points, listed in the [evidence](evidence.md#p2-new-behavior-that-the-documents-did-not-state). Each point waits for the owner's review at the phase report. None is recorded as an owner decision. The first one departs from the letter of A26: the fixed sentence is on `backlog` reads by project URI only, and not on `tasks` and `factory` reads.
- Recorded limit of A16: 40 commands ran through the real operation runner with a handler that does nothing. Real handlers ran for 15 commands of the set, in the tests and in `PERF-006`.
- Known limits: the [evidence](evidence.md#p2-known-limits) lists them. Each one can only miss a line.
- Package digest: not recorded in this pass. This phase changed package bytes, so the orchestrator records the digest again after the review, under [standing rule 10](00-index.md#standing-rules).
- Optional experience handoff: none.
- Explicit human acceptance gate: Pending. The owner reviews the lines (A29) and the points of new behavior.
- Evidence report: [P2 Reminder and Read Commands](evidence.md#p2-reminder-and-read-commands).
- Phase / capability status: implementation complete, reviewed one time, corrected in the fix pass of 2026-11-27, and not committed. The fix pass waits for its own review. T1 to T15 are done. A16 to A28 have automated or recorded evidence, with the limits above. A29 waits for the owner. The phase is not marked complete.
