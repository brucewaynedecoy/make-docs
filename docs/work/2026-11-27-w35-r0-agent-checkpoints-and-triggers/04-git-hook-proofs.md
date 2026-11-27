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

The [design](../../designs/2026-11-27-agent-checkpoints-and-triggers.md) marks a set of items "the plan proves", "the plan finds out", or "the plan measures". This phase holds each one as a named task. It builds no product behavior: it adds proof tests, records answers, runs `PERF-007`, and brings two choices to the owner. Its results can change what P5 builds, so it ends and is reviewed before P5 starts.

The [standing rules](00-index.md#standing-rules) of the index hold in this phase. Each proof runs in temporary repositories with a temporary `MAKE_DOCS_HOME` at a fixed, checked path.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `indirect`. A git action never fails because of Make Docs, and a person does not need to tell an agent to sync. This phase proves the facts that those promises stand on.
- Intended human outcome: the owner reads one record that says, for each hook fact and each platform, what was seen, and gets two clear choices: the hook run mode, and a Store schema change only if one is needed.
- Human-facing surface or indirect effect: none yet. P5 builds the surface.
- Implementation work: proof tests, recorded findings, the `PERF-007` profile and runs, and register entries.
- Evidence source or testing type selected under current authority: proof tests on Linux, macOS, and Windows through the fixed test list of `.github/workflows/platform-safety.yml` under [standing rule 12](00-index.md#standing-rules), recorded runs, and `PERF-007`.
- Executor: the implementing agent writes the tests and the records. The orchestrator starts the workflow run and the agent tool sessions under standing rules 11 and 12. The owner answers the gates.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Git fact tests that stay in the suite, so a git version that changes a fact fails a test. |
| Performance Testing | selected | `PERF-007`, `characterize-now`, informational. |
| Guided Progress Review | not-needed-now | No human-facing surface exists in this phase. The owner gates carry the choices. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

- Base maintenance action: `create`
- Performance applicability: `characterize-now`
- Canonical `PERF-###` profile link or `none`: `PERF-007`, written in this phase file by T13 before any measurement, under a `## Performance Evidence` section, as [`PERF-004`](../2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md#perf-004-automatic-sync-on-a-project-with-many-backlogs) is in its phase.
- Finite evidence budget and stop-rule reference or `not-applicable`: budget event `W35-R0-P4-PERF-007-1`. At most 3 characterization runs, 1 correction attempt for a harness defect only, 1 review cycle, 2 hours in all, the maintainer machine only, and no external spend. Stop after three runs or at the first correctness failure. The budget does not renew itself.
- Execution packet link or `not-applicable`: Stage 3 tasks T13 to T15.
- Outcome and evidence handoff or `none`: the result goes to the evidence report and to owner gate OG-4.
- Gate disposition and supported-scope limit or `not-applicable`: informational for speed. One machine, this repository's work files, and the candidate build. A hook that changes a project file or fails a git action is a correctness failure and stays blocking.

## Source PRD Docs

- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md): R-CLI-SETUP-1 to R-CLI-SETUP-6, `Lifecycle commands`
- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md): R-DB-7, R-HARNESS-STATE-2, R-HARNESS-STATE-6, R-MIN
- [52 Work Store and Work Queue](../../prd/52-work-store-and-work-queue.md): R-WORK-STORE-11, R-WORK-SYNC-2, R-WORK-SYNC-4, R-WORK-SYNC-9
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md): R-ACCESS-6, R-ACCESS-9, R-ACCESS-16
- [30 Plugin Substrate and Workflow Bundles](../../prd/30-plugin-substrate-and-workflow-bundles.md): R-ADMIT-1, R-LEGACY-1, R-LEGACY-2
- [48 Performance Evidence Governance](../../prd/48-performance-evidence-governance.md)

## Source Obligations, Scenarios, And Findings

- `O-###`: none
- `NUAT-###`: none
- Findings: none. T16 adds register entries.

## Stage 1 - Git facts on each platform

### Tasks

- [ ] T1: Add a test file for the pull facts, with a helper that builds temporary repositories and records which hooks ran. The design checked each fact with git 2.47.1. `post-merge` runs for `git pull` with a merge. `git pull --rebase` with no local commits runs `post-merge`. `git pull --rebase` with local commits runs `post-checkout`, `post-commit`, and `post-rewrite`, and not `post-merge`. Each test records the git version of its runner.
- [ ] T2: Add tests for the commit and state facts, with the helper of T1. An amended commit runs `post-rewrite` and `post-commit`. The rebase folder of git is still there when `post-rewrite` runs. `MERGE_HEAD` is still there when `post-merge` runs after a true merge.
- [ ] T3: Add tests for the facts of the hook after a checkout, with the helper of T1. `post-checkout` also runs for a file checkout (third argument 0), for `git worktree add`, and for a clone.
- [ ] T4: Prove that `git rev-parse --git-path hooks` in a linked worktree returns the hooks folder of the main checkout, and that one hook file runs for every worktree of the clone.
- [ ] T5: Find how setup detects `core.hooksPath` for the repository and for the whole machine, and how it tells a hook file that is not a shell script and a hook file that another tool owns. Record the detection rule that P5 uses to refuse.
- [ ] T6: Prove how a git hook script runs on Windows. git on Windows is expected to run a hook through the shell that it ships, and not through the Windows command shell. The test proves which shell runs a hook file on the Windows runner, that a hook file with a small marked block runs in it and exits 0, and what PATH the hook sees. T9 uses this result to prove that the hook finds the `make-docs` command there.
- [ ] T7: Prove the rule for git in the middle of an action. Find how a hook after a commit or a branch change detects a rebase, a merge, a cherry-pick, or a bisect. Prove that the hooks after a merge and after a rewrite can still run the checkpoint while git shows its merge or rebase state. If the proof fails on a platform, record the gap for the hook review that setup shows.
- [ ] T8: Add each new test file of T1 to T7 to both fixed test lists in `.github/workflows/platform-safety.yml`: the step "Run platform safety contracts" of the job `platform-contract`, and the step "Run required source safety matrix" of the job `installed-package`. Without this change the tests run on Linux only. This task closes when both lists hold the files and the tests pass on the maintainer machine. The three-platform result comes later, in the order of [standing rule 12](00-index.md#standing-rules): the phase commit, the push, the pull request run, then one evidence commit of the form `docs: [W35 R0 P4] Agent Checkpoints and Triggers - Git Hook Proofs Evidence`. That commit records a fact that fails on a platform as a gap, not hidden.

### Acceptance criteria

- A39: Both fixed test lists of the workflow hold the test files of this stage. Each git fact of T1 to T4 has a test result on each of the three platforms, with the git version and the link to the workflow run, or a named gap. The platform part of this case passes only after the phase commit, the push, and the pull request run, with the evidence commit.
- A40: The evidence report states the detection rule for another tool's hooks, the hook shell on Windows with the PATH that a hook sees there, and the rule for git in the middle of an action, each with its proof.

### Dependencies

- P1.

## Stage 2 - Command lookup, access, and the record

### Tasks

- [ ] T9: Find how a hook finds the `make-docs` command when it is not on PATH. Git runs a hook with the environment of the git process, and an app that starts git can pass a short PATH. Try each candidate on each platform, with the install methods that the project supports: a PATH lookup alone, and a PATH lookup followed by a path that setup recorded in the block. On Windows, prove it in the hook shell that T6 found, with the command file that each supported install method writes there. Record the choice and its proof. A hook that finds no command does nothing and exits 0. Add the test file of this task to the two workflow lists, as T8 does, so that it runs on each platform. The platform runs follow the same order as T8, and the evidence commit records them. Also prove the folder in which a hook runs the checkpoint: from a subfolder of a project, such as `docs/`, the checkpoint says that the folder is not a Make Docs project and exits 0 ([P1 evidence](evidence.md#known-limits)), so a hook must run the checkpoint at the project root or pass `--target-root`.
- [ ] T10: Find whether a hook that an agent's commit starts passes that agent tool's Store access rules. The run is a session inside an agent tool, so [standing rule 11](00-index.md#standing-rules) says who starts it. The steps for each first-party agent tool: open a temporary project with a temporary Store, install a test hook that runs `make-docs project checkpoint --event commit`, and make a commit from inside the tool. Record what the checkpoint may do there: write, read only, or nothing. Record which tool ran which proof, and each tool with no run as "no proof gathered".
- [ ] T11: Find whether the clone-owned hook record needs a Store schema change. The Store file ledger belongs to one checkout, and the hooks folder is shared by every worktree of a clone and is outside a linked worktree's project folder. Check whether an existing record can hold the exact hook block for the clone's shared git folder, with drift detection, exact removal, and the rule that `setup remove` removes the block only when no other bound checkout of the clone remains. Record the answer. If no existing record fits, owner gate OG-3 opens: record that, bring the gate to the owner, and do no schema work. The gate blocks P5 and not this phase.
- [ ] T12: Record the two-worktree behavior of the checkpoint with no hook. Run a direct checkpoint in one worktree, then in a worktree of the same clone on another branch. Record what the store holds and what each worktree reports. Nothing may be overwritten with no report.

### Acceptance criteria

- A41: The command lookup has one recorded choice, with a run on each platform that finds the command, and a run that finds none and exits 0 with no output. The Windows run is in the hook shell of T6. The platform runs are recorded with the evidence commit, as in A39.
- A42: The access runs name, for each agent tool that was run, who started the session and what the hook's checkpoint could do. Each tool with no run is named with the reason "no proof gathered".
- A43: The record question has one recorded answer: an existing record fits, with its name and the proof, or owner gate OG-3 is open with the reason.
- A44: The two-worktree record shows the store content and each worktree's report, and shows that each difference is visible as a pending write or a conflict.

### Dependencies

- P1.

## Stage 3 - Measurement and the run mode

### Tasks

- [ ] T13: Write the `PERF-007` profile in this phase file, under the performance evidence profile template, before any counted measurement. Reuse the method of `PERF-004`: the installed package candidate, fresh clones of this repository, and a temporary Store at a fixed, checked path. The workload is a commit, a merge, a rewrite, and a branch change, each with no hook, with a hook that runs the checkpoint in the foreground, and with a hook that starts the checkpoint and returns. Measure each with no change, with one changed work file, and for a trigger run that is the first sync of a checkout.
- [ ] T14: Run `PERF-007` within its budget. Record each median and the time that each hook mode adds to the git action. Check in each run that no project file changed and that git exited as it does with no hook.
- [ ] T15: Record the result in the evidence report. State what a person sees in each mode: when the line about waiting files appears, and what happens to the checkpoint's output in the start-and-return mode. Then bring owner gate OG-4 to the owner with the measured times and one recommendation. The plan recommends the foreground run before the measurement. This task confirms that recommendation or changes it, and says which.

### Acceptance criteria

- A45: `PERF-007` has a profile written before the runs and a recorded result with its limits. `make-docs check performance-evidence` reports no error for `PERF-007`.
- A46: The owner answered OG-4, and the evidence records the answer and its date.

### Dependencies

- Stage 1.
- Stage 2.

## Stage 4 - Register and evidence

### Tasks

- [ ] T16: Add entries to the [risk register](../../prd/03-open-questions-and-risk-register.md) under `## Rebuild Risks`: `git pull --rebase` with local commits runs no hook after a merge, with the cases that the hook after a rewrite covers; and one entry for each platform gap that this phase found.
- [ ] T17: Add the P4 section to `evidence.md`, with one table of facts by platform and the answers of T5 to T7 and T9 to T12.

### Acceptance criteria

- A47: The register names each gap, and the evidence report gives P5 one list of what to build and what to name in the hook review.

### Dependencies

- Stage 3.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
