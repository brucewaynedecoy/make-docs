---
title: "Phase 5: Git Hooks in Setup"
kind: "work"
status: "draft"
coordinate: "W35 R0 P5"
source:
  type: "prd"
  path: "docs/prd/07-cli-command-surface-and-lifecycle.md"
---

# Phase 5: Git Hooks in Setup

## Purpose

Build the first trigger that needs no agent memory: git hooks that run the checkpoint. It depends on P4 and builds only what P4 proved.

## Overview

`make-docs setup` handles four git hooks for each project, and a person selects them explicitly: by a hook input, by an answer in interactive setup, or, in a new project, by the machine preference that the person set. The owner decided the form of that preference on 2026-11-27 (owner gate OG-5, answered, design OD-11), and its scope later on the same day: it installs the git hooks automatically only in a new project. Make Docs writes into the git hooks folder for the first time, so the phase also builds the ownership record, the drift report, and exact removal. Git hooks, the marked block, the refusal when another tool owns the hooks, the clone-owned record, and the machine preference are new.

The owner answered owner gate OG-4 on 2026-11-28 with option A: a git hook runs the checkpoint in the foreground. The owner also chose one improvement: a short time limit on the wait for the Store, after which the hook gives up quietly. [Stage 6](#stage-6---the-foreground-run-and-the-wait-limit) holds both. A second improvement was offered and not chosen, so it is not built: that the hook after a rewrite skips the amend case.

On the same day, 2026-11-28, the owner replaced the foreground mode: git hooks run in the background. The hook starts the checkpoint and returns, git does not wait, and the hook prints nothing in every case. A foreground fallback applies where a background process cannot survive, and there the limit of 1,000 ms on each wait for the Store applies. The reason for the change, as a fact that the owner saw: an independent review measured that the cost of a foreground hook grows with the count of work files (about 1.85 seconds for each commit at 1,000 work files in the review's project), and that the wait limit does not bound the work of the run. Stage 6 holds the five decisions, OD-P5-1 to OD-P5-5, and the tasks T39 to T45 that build them. The record of the first answer stays. `PERF-007-R2` holds the times of the built block.

| Hook | When git runs it | Checkpoint call | Imports |
| --- | --- | --- | --- |
| `post-commit` | After a commit | `make-docs project checkpoint --event commit` | Yes |
| `post-merge` | After a merge | `make-docs project checkpoint --event commit` | Yes |
| `post-rewrite` | After a rewrite of commits | `make-docs project checkpoint --event commit` | Yes |
| `post-checkout` | After a branch change only (third argument 1) | `make-docs project checkpoint --event branch-change` | No. It only reports (design OD-9 option A). |

The [standing rules](00-index.md#standing-rules) of the index hold in this phase. Rule 5 is the centre of it: a hook never fails or blocks a git action.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. A person does not need to tell an agent to sync. A git action never fails because of Make Docs. Setup shows each hook before it writes, and `setup remove` takes out only what Make Docs put in.
- Intended human outcome: git does not wait for the checkpoint after a commit, and the work store has the file changes when the background checkpoint ended. The person sees nothing at the commit. `make-docs work status` and the reminder line of the next Make Docs command say what waits and which command settles it. Only in the foreground fallback does the person see one line at the commit. The person saw each hook path and the exact block before setup wrote, and gets the hook files back as they were on removal.
- Human-facing surface or indirect effect: the setup hook review, which states the run mode, the line that a hook prints in its foreground fallback, the repeat setup status, and the `setup remove` plan and report.
- Implementation work: the setup offer, the machine preference and its question at the machine step, the block writer, the refusals, the Store record, drift detection, removal, and tests on each platform.
- Evidence source or testing type selected under current authority: the two-checkout, two-worktree, and `git pull --rebase` tests, quiet-exit tests, setup and removal tests beside a hook of another tool, and a Guided Progress Review of the hook review.
- Executor: the implementing agent runs the tests. The orchestrator starts the workflow run under [standing rule 12](00-index.md#standing-rules). The owner reviews the hook review, the machine preference question, and the removal report, and answers the open gates.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Hook, setup, drift, and removal tests. They run on Linux, macOS, and Windows only when T14 adds their files to the fixed test list of the platform workflow. |
| Performance Testing | selected | `PERF-007` in [P4](04-git-hook-proofs.md) measured proof hooks. The owner's decisions of 2026-11-28 changed the run mode, and the built block differs from the proof hooks in what it runs, which is a material change trigger of the profile. So this phase holds one requalification of `PERF-007` with the built block, under a new budget: see [Requalification Of PERF-007 With The Built Block](#requalification-of-perf-007-with-the-built-block). |
| Guided Progress Review | selected | The owner sees the setup hook review, the machine preference question, the line that a hook prints, and the removal report. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

## Performance Evidence

This phase defines no profile. [P4](04-git-hook-proofs.md#perf-007-the-checkpoint-that-a-git-hook-runs) is the one canonical record of `PERF-007`, and its result record holds each result.

### Requalification Of PERF-007 With The Built Block

This record was written before any counted run.

- Profile: `PERF-007`, version `1`, with its source digest as its own record states it. The profile text does not change.
- Why: a material change trigger of the profile holds: "the hook block that P5 builds when it differs from the proof hooks in what it runs".
- Authorization: the owner decided the background mode on 2026-11-28 (T39 to T45), and the task of this phase for that decision asks for the measurement. This phase with that decision is the authority that the profile asks for.
- Budget event: `W35-R0-P5-PERF-007-2`. Limits: 3 runs, 1 correction attempt for a harness defect only, 1 review cycle, 2 hours in all, the maintainer machine only, and no external spend. The budget does not renew itself.
- Stop rule: stop after three runs or at the first correctness failure.
- Method: the harness of `PERF-007-R1` with stated differences, kept as [perf-007-r2-harness.mjs](evidence/p5/performance/perf-007-r2-harness.mjs). The list of its differences and the side measure stood in this record before the counted runs. It moved to the [evidence](evidence.md#the-method-of-perf-007-r2-as-recorded-before-the-runs) with the same words, because a work file has a size limit.
- Result: `PERF-007-R2`, recorded beside `PERF-007-R1` in the [result record](04-git-hook-proofs.md#result-record-of-the-requalification) of the profile.

## Source PRD Docs

- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md): R-SETUP-CLI-1 to R-SETUP-CLI-14, R-CLI-SETUP-1 to R-CLI-SETUP-6. This phase adds R-SETUP-CLI-15 and later, and one sentence to R-SETUP-CLI-10.
- [28 Shared Agentics Installation and Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md): `Optional Agentics Boundary`, `Non-Requirements`
- [30 Plugin Substrate and Workflow Bundles](../../prd/30-plugin-substrate-and-workflow-bundles.md): R-BOUND-1, R-BOUND-2, R-ADMIT-1, R-ADMIT-4, R-SELECT-1, R-SELECT-4, R-LEGACY-1, R-LEGACY-2. This phase changes R-ADMIT-1, R-SELECT-1, and the Acceptance Criteria line about default setup, with the words that the owner approved on 2026-11-27. It changes no other PRD 30 requirement.
- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md): R-STORE-2, R-DB-7, R-HARNESS-STATE-1, R-HARNESS-STATE-2, R-MIN. This phase adds R-HOOK-STATE.
- [52 Work Store and Work Queue](../../prd/52-work-store-and-work-queue.md): R-WORK-STORE-11, R-WORK-SYNC-2, R-WORK-SYNC-4, and the R-WORK-CHECKPOINT requirements that P1 adds
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md): R-NAME-6

## Source Obligations, Scenarios, And Findings

- `O-###`: none
- `NUAT-###`: none
- Findings: the P4 gaps in the [risk register](../../prd/03-open-questions-and-risk-register.md) (R-043, R-044, and R-045) and the P4 section of `evidence.md`. Stage 5 holds each choice of P4 as a proposal.

## Stage 1 - The hook block and the record

### Tasks

- [x] T1: Build the block writer. Make Docs adds one marked block to a hook file that is a shell script and keeps every other byte. It creates the file when none exists. It refuses, with a clear reason and no change, when the hook file is not a shell script, when another tool owns the hooks, or when `core.hooksPath` points to another folder, with the detection rule that P4 recorded. Make Docs sets no machine-wide git hooks path.
- [x] T2: Write the block content for the four hooks. It finds the `make-docs` command by the method that P4 chose. It starts the checkpoint with its event in the background: the owner chose the foreground at OG-4 on 2026-11-28 and replaced it with the background on the same day, and T35 and T39 hold the run mode. It always exits 0. It does nothing when the command is not found, when no usable Store exists, or when the folder is not a Make Docs project. The hooks after a commit and after a branch change do nothing while git is in the middle of a rebase, a merge, a cherry-pick, or a bisect. The hooks after a merge and after a rewrite do not use that rule. The hook after a branch change acts only when its third argument is 1.
- [x] T3: Make the output rule hold. In the background mode a hook prints nothing, in every case (OD-P5-5 of 2026-11-28). In the foreground fallback a hook prints nothing when nothing is due. When something waits for a person, it prints only the summary line and the command. With Store read access only, it prints the one line that says how many files wait and which command to run. With no Store access it prints nothing. That the fallback prints these lines is a proposal of T42.
- [x] T4: Record the exact block in the Store for the clone's shared git folder, in the record that P4 found, or in the record that the owner approved at OG-3. Report drift when the block changed. Repeat setup reports current, missing, and drifted hook state and changes only the Make Docs block.

### Acceptance criteria

- A48: Setup beside an existing hook file of another kind keeps every byte outside the Make Docs block. Setup refuses, with one clear reason and no change, for a hook file that is not a shell script, for hooks that another tool owns, and for a `core.hooksPath` that points to another folder.
- A49: Each of the four hooks exits 0 and prints nothing when the `make-docs` command is missing, when no Store exists, and when the project has no Make Docs install. A file checkout (third argument 0) makes the hook after a checkout do nothing. The hooks after a commit and after a branch change do nothing in the middle of a rebase, a merge, a cherry-pick, or a bisect, and the hooks after a merge and after a rewrite still run the checkpoint there.
- A50: A foreground run of a hook with Store read access only prints the one line with the count of waiting files and the command. A hook with no Store access prints nothing. Both exit 0. In the background mode a hook prints nothing in both cases.
- A51: A changed block is reported as drift, and repeat setup does not change it without a reviewed plan.

Owner gate OG-3 did not open. P4 T11 found on 2026-11-27 that an existing Store record can hold the hook block: one row of the table `tool_operations`, with no new table, column, version, or migration. The independent review of P4 agreed on 2026-11-27. So no gate bullet for OG-3 stands in the dependency list, and T4 uses "the record that P4 found". This is a finding and not an owner decision. If the owner reads a new kind of row in that table as a Store schema change, the gate opens with the two options of the [plan](../../plans/2026-11-27-w35-r0-agent-checkpoints-and-triggers/00-overview.md#owner-decisions).

Owner gate OG-4 is answered. The owner chose on 2026-11-28 that a hook runs the checkpoint in the foreground, with a short time limit on the wait for the Store. An answered gate blocks nothing, so no gate bullet for OG-4 stands in the dependency list.

### Dependencies

- P4.

## Stage 2 - The setup offer and removal

Merge risk: W22 R2 is active and adds the adoption path to the setup flow and to PRD 07. This stage adds the git hook offer to the same flow, and Stage 4 adds PRD 07 requirements. Merge by hand, then rerun the setup tests and record the digest again under standing rule 10. This Wave edits no W22 R2 file. This note is not a dependency, so it stands here and not under `### Dependencies`. See the [index](00-index.md#wave-sequence).

The owner's answer to OG-5: a machine preference says whether Make Docs installs the git hooks automatically for each project. Its default is "No". The person sets it when Make Docs is first installed on the computer, or when the machine installation itself is changed. With the preference on, project setup installs the git hooks with no hook input, also in `make-docs setup --yes`. With the preference off, `make-docs setup --yes` installs no hook, an interactive project setup still offers the git hooks with "no" selected first, and an explicit hook input still installs them. A hook that belongs to one agent tool always needs an explicit input, in every mode, and the preference never installs one. The owner's reason: git hooks are part of a different lifecycle than agent tool hooks, and agent tools are a lifecycle on top of the normal development and documentation lifecycle, so their hooks get an extra measure of caution.

The scope of the preference: the owner decided it on 2026-11-27, after the answer to OG-5. With the machine preference on, setup installs the git hooks automatically only in new projects. An older project still gets the git hooks when the person wants them, through an explicit hook input or through an explicit "yes" in an interactive setup of that project. This replaces recommendation R3 of the plan, which said that the preference also covers a project that was set up before. The owner decided the meaning of "new project" on 2026-11-27. The plan lists it as R3a: the same as for the project name in [PRD 38](../../prd/38-global-store-and-project-state.md) R-ID-8, a fresh setup target with no config file. T8 builds R3a as written.

The machine step: the person sets the preference at the machine step of setup. `make-docs setup system` opens that step directly, and project setup opens the same flow inline ([PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md) R-SETUP-CLI-4, `runSystemSetupCommand` and `promptForSystemSetupMethods` in `packages/cli/src/setup-system.ts`). That step asks one connection method for each agent tool today, and no machine preference. Its non-interactive form has no input for one. So T7 adds the question and the input. Add no new command.

Recommendations: the owner's words do not cover each detail. The [plan](../../plans/2026-11-27-w35-r0-agent-checkpoints-and-triggers/00-overview.md#owner-decisions) lists the recommendations R1, R2, and R4 to R7 under OG-5. The tasks below build them as written, and each task marks them with their number. They are not owner decisions. R3 and R3a are owner decisions of 2026-11-27, and T8 builds them. The phase report shows the recommendations R1, R2, and R4 to R7 to the owner, and the owner can change any of these six recommendations.

Names: the name of the hook input flag, the name of the input that sets the machine preference, and the key of the machine preference are not set. The builder proposes these names under the name rules of [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md), and the phase review shows them to the owner in the phase report. This needs no new gate.

### Tasks

- [x] T5: Add the offer to interactive `make-docs setup`. Setup shows each hook path, the exact block, and what the block runs, before it writes. The person selects the hooks explicitly. The offer is for one project. With the machine preference absent or off, "no" is selected first. With the preference on, "yes" is selected first in a new project, and the person still sees the review and confirms it (R4). In an older project "no" is selected first also with the preference on, and an explicit "yes" installs the hooks (owner decision R3). An explicit hook input installs the hooks in both cases. A known gap from P4 appears in this review.
- [x] T6: Add one machine preference to global config: whether Make Docs installs the git hooks automatically for each new project. Its default is "No", and an absent value means "No". The preference concerns the git hooks only. It never installs a hook that belongs to one agent tool. Make these rules hold, each with a test. An update of Make Docs never turns the preference on and never installs a hook by itself in a project that has none (R1). Turning the preference on writes one value of global config and installs no hook in any project by itself, and turning it off removes no hook that a project already has (R2).
- [x] T7: Add the preference question to the machine step of setup: `make-docs setup system`, and the same flow that project setup opens inline. The question has "No" selected first when global config holds no answer. The machine step asks it when global config holds no answer yet, and `make-docs setup system` shows it again with the current value selected first (R6). Add an explicit input that sets the preference in a non-interactive machine setup. `--yes` alone never changes the preference (R6). The machine review shows the change under `This computer`. Turning the preference on or off changes only that one value of global config.
- [x] T8: Add the non-interactive path as the owner decided at OG-5. With the preference on, `make-docs setup --yes` with no hook input installs the four git hooks in a new project, and its plan output names them. With the preference off, it installs no hook and says so in one line. An explicit hook input installs the hooks with the preference on or off, in a new project and in an older project. An explicit "no hooks" input for one run holds over the preference (R5). With the preference on, setup installs the hooks automatically only in a new project (owner decision R3 of 2026-11-27, which replaces the first R3). In an older project, `make-docs setup --yes` with no hook input installs no hook and says so in one line, also with the preference on. Decide "new project" as the project name of PRD 38 R-ID-8 does: a fresh setup target with no config file (R3a, decided by the owner on 2026-11-27). When setup must refuse the git hooks under T1, it installs no hook, says why in one line, and the rest of the run goes on (R7). A bare non-interactive setup, with no `--yes`, installs no hook. `--dry-run` prints the exact hook plan. Conflicting hook input fails before any write.
- [x] T9: Build removal. `setup remove` removes only a block that still matches the recorded bytes, and keeps a changed block with a report. It removes a hook file that Make Docs created only when the file holds nothing else. In a clone with linked worktrees it removes the block only when no other bound checkout of that clone remains. Until then it reports that the block stays, and why.
- [ ] T10: If owner gate OG-6 opened, apply the owner's choice for each platform with a gap, and add a test for it. If the gate did not open, say so in the evidence report and close this task as `superseded`, not as `cancelled`, because a cancelled unit keeps each unit that depends on it waiting.

### Acceptance criteria

- A52: The setup review shows each of the four hook paths and the exact block before any write, and a run with no selection writes no hook.
- A53: The interactive offer has "no" selected first when the machine preference is absent or off, and "yes" selected first when it is on and the project is new. In an older project "no" is selected first also with the preference on. The person confirms in each case. After the person turns the preference off, "no" is selected first again, global config holds no other change, and the hooks of a project that already has them stay.
- A53a: The machine step (`make-docs setup system`, and the same flow inline in project setup) asks the preference question with "No" selected first. With no answer, global config holds no preference, and that means "No". `--yes` alone leaves the preference as it was.
- A53b: With the preference on, `make-docs setup --yes` with no hook input installs the four git hooks in a new project, and the plan output names each hook path.
- A53c: With the preference off or absent, `make-docs setup --yes` with no hook input installs no hook and says so in one line.
- A53d: An explicit hook input installs the hooks with the preference on, off, or absent, in interactive and in non-interactive setup, in a new project and in an older project. An explicit "no hooks" input installs none with the preference on.
- A53e: With the preference on, setup with no hook input for an agent tool installs no hook of any agent tool, in interactive and in non-interactive setup.
- A53f: After an update of Make Docs, the preference holds the same value as before, and a project that had no hook has none. After the person turns the preference on, no project has a new hook by that change alone.
- A53g: With the preference on, `make-docs setup --yes` with no hook input in an older project installs no hook and says so in one line. An explicit hook input installs the four hooks there, and so does an explicit "yes" in an interactive setup of that project. A fresh setup target with no config file is a new project, and each other project is an older project (R3a, decided by the owner on 2026-11-27).
- A54: After setup and then `setup remove` beside a hook of another tool, each hook file is byte-identical to its state before setup.
- A55: `setup remove` in one worktree keeps the block while another bound checkout of the clone remains, and says so. It removes the block when none remains.
- A56: If OG-6 opened, a test shows that setup on each platform with a gap does what the owner chose. If OG-6 did not open, the evidence report says so.

### Dependencies

- Stage 1.
- Owner gate OG-6, when it opened: the owner chooses whether setup offers the hooks on a platform with a gap.

## Stage 3 - End-to-end proofs

### Tasks

- [x] T11: Add the two-checkout test. One side edits a work file and commits. The store has the edit after the commit with no work command run by hand, and the work tree is as git left it.
- [x] T12: Add the two-worktree test. Two linked worktrees of one clone are on different branches. A commit in one, then a checkpoint in the other. The test records what the store holds and what each worktree reports, with no silent overwrite. A branch change alone leaves the store unchanged and prints the one line when files wait.
- [x] T13: Add the `git pull --rebase` test with local commits. It shows which hook ran and what the store holds after it. Add the amended commit case: two hooks run, and the second finds nothing due.
- [x] T14: Add each new hook test file of this phase to both fixed test lists in `.github/workflows/platform-safety.yml`: the step "Run platform safety contracts" of the job `platform-contract`, and the step "Run required source safety matrix" of the job `installed-package`. Without this change the tests run on Linux only. This task closes when both lists hold the files and the tests pass on the maintainer machine. The three-platform result comes later, in the order of [standing rule 12](00-index.md#standing-rules): the phase commit, the push, the pull request run, then one evidence commit of the form `docs: [W35 R0 P5] Agent Checkpoints and Triggers - Git Hooks in Setup Evidence`. That commit records each platform result with the link to the workflow run.

### Acceptance criteria

- A57: After an edit of a work file and a commit, the store holds the edit, no work command was run by hand, and `git status` shows no change that the hook made.
- A58: In the two-worktree test, each result names its checkout, each difference shows as a pending write or a conflict, and a branch change alone changes no store record.
- A59: After `git pull --rebase` with local commits, the recorded hook ran and the store holds the pulled work files, or the gap is named in the hook review and the register. An amended commit runs two hooks, and the second run finds nothing due and prints nothing.
- A60: Both fixed test lists of the workflow hold the hook test files of this phase. The tests pass on each of the three platforms in a pull request run or a manual run, or each failure is a recorded gap with the owner's choice at OG-6. This case passes only after the phase commit, the push, and the pull request run, with the evidence commit.

### Dependencies

- Stage 2.

## Stage 4 - Agent form, PRDs, and evidence

### Tasks

- [x] T15: Update the work store reference in `packages/docs/template/`: what the hooks do, what an agent does when a hook prints its line, and that an agent installs no hook by hand. Copy the file byte for byte to the installed copy. Extend the name test so that it checks the hook block for the current checkpoint command.
- [x] T16: Update the two PRDs that own the hook boundary, with a `W35 R0 P5` Requirement History entry in each:
  - [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md): the sentence "Make Docs has no general plugin, hook, extension, workflow-bundle, or Playbook-generated Skill product" and the matching Non-Requirements line. Make Docs still has no general hook product. It has two bounded kinds of hook: the git hooks that setup offers for each project, and a hook method of a first-party adapter with real capability evidence. The owner approved this change on 2026-11-27.
  - [PRD 30](../../prd/30-plugin-substrate-and-workflow-bundles.md), with these exact words. The owner answered owner gate OG-10 on 2026-11-27.
    - R-ADMIT-1 becomes: "R-ADMIT-1 (MUST): a future optional integration requires a traced current non-Playbook consumer and purpose, a coherent owning PRD, explicit selection, a real harness capability contract or, for the git hooks that PRD 07 owns, the git hook behavior that tests prove on each supported platform, install and uninstall behavior, ownership and provenance records, safe audit/backup/migration handling, and honest support status." The owner approved this sentence. Git is not an agent tool, so a git hook cannot meet "a real harness capability contract" as the requirement reads today.
    - R-SELECT-1 gains: "The git hooks are installed only by an explicit hook input, by an explicit answer in interactive setup, or by the machine preference that the person set." Follows from D1; shown to the owner on 2026-11-27.
    - The Acceptance Criteria line "Default setup, sync, and Skills selection create no plugin, hook, extension, workflow-bundle, or generated package output" becomes: "Default setup, sync, and Skills selection create no plugin, extension, workflow-bundle, or generated package output, and no hook other than the git hooks that R-SELECT-1 admits." Follows from D1; shown to the owner on 2026-11-27.
  - D1 is the owner's answer to OG-5, which the design records as OD-11. Change no other PRD 30 requirement. R-BOUND-1 forbids a hook registry, and this Wave builds none. R-BOUND-2 allows a hook that passed R-ADMIT. R-ADMIT-4 forbids a simulated hook, and a git hook is real. So these three stay as they are.
- [x] T17: Update [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md) with a `W35 R0 P5` Requirement History entry: new R-SETUP-CLI-15 and later for the offer, the review, the machine preference with its question at the machine step, the refusals, and removal. R-SETUP-CLI-10 gains this exact sentence: "For the git hooks, the machine preference is the explicit selection when it is on." Follows from D1; shown to the owner on 2026-11-27. State the owner decisions R3 and R3a as requirements, and each of the recommendations R1, R2, and R4 to R7 that the owner kept.
- [x] T18: Update [PRD 38](../../prd/38-global-store-and-project-state.md) and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md), with a `W35 R0 P5` Requirement History entry in each. PRD 38 gains new R-HOOK-STATE requirements for the clone-owned record, the R-MIN field register row, and the global config preference. PRD 39 R-NAME-6 says that the hook block is shipped text.
- [x] T19: Add the P5 section to `evidence.md`, with the hook review and the removal report as a person sees them.

### Acceptance criteria

- A61: `make-docs check prd`, the shipped-text test, and the byte-match test pass. PRD 28 and PRD 30 agree about hooks. PRD 30 R-ADMIT-1, R-SELECT-1, and the Acceptance Criteria line about default setup, and PRD 07 R-SETUP-CLI-10, hold the exact words of T16 and T17. The evidence records the owner's answers to OG-5 and OG-10 and their date, 2026-11-27. No other PRD 30 line changed.
- A62: The owner reviews the setup hook review, the machine preference question, the line that a hook prints, and the removal report. The phase report lists the recommendations R1, R2, and R4 to R7, and the proposed names. Each one says what happens, where, and what the person can do next.

### Dependencies

- Stage 3.
- Stage 5.
- Stage 6.

## Stage 5 - Proposals from Phase 4

This stage was added on 2026-11-27, after the independent review of P4. P4 is a proof phase, and its builder made choices that no document stated. T2 says "the method that P4 chose". Those words mean one thing only: a PATH lookup, and then a path that setup recorded in the block. Each other choice of P4 is a proposal, and each one has its own task below, so that no choice of a builder becomes Phase 5 scope by reference.

No proposal is an owner decision. For each task, the builder builds the proposal as written or names another form with the reason, and adds the test of its case. The Phase 5 review shows each proposal to the owner in the phase report, as it shows the recommendations R1, R2, and R4 to R7, and the owner can change any of them. The [P4 evidence](evidence.md#p4-git-hook-proofs) holds the proof or the gap behind each task.

The stage has the next free numbers, so no earlier task or case number changed, and its number says nothing about its place in the order. Its tasks shape the block and the record of Stage 1 and the review of Stage 2. It waits for Stage 1, where the block and the record first exist, and Stage 4 waits for it, so that the phase report holds each proposal.

### Tasks

- [x] T20: Proposal from Phase 4, which the Phase 5 review shows to the owner. The folder of `node` in the block. The block adds the recorded folder of the `node` program to the end of PATH for the checkpoint call ([register entry R-044](../../prd/03-open-questions-and-risk-register.md)). That folder is a path of this machine at the time of setup, and it can go stale when the person moves or updates `node`. Build this form or name another one. Add a test for a recorded folder that no longer exists.
- [x] T21: Proposal from Phase 4, which the Phase 5 review shows to the owner. The executable mode of the hook file. Setup sets the executable mode on a hook file that it creates. For an existing hook file that is not executable, setup names the file and does not change its mode. Git does not run a hook file that is not executable on a platform with file modes.
- [x] T22: Proposal from Phase 4, which the Phase 5 review shows to the owner. The position of the block in an existing hook file. P4 proved no place. A shell script of another tool can end with `exec` or `exit`, and a block after that line never runs. Choose the place, give the reason, and add a test with such a file.
- [x] T23: Proposal from Phase 4, which the Phase 5 review shows to the owner. A project in a subfolder of the git repository. The proof block passes `--target-root` with the top folder of the work tree. When the Make Docs project is in a subfolder of the git repository, the top folder is not the project root, and P4 did not prove that case. Make the block give the checkpoint the project root, and add a test with a project in a subfolder.
- [x] T24: Proposal from Phase 4, which the Phase 5 review shows to the owner. The removal of the Store record. The record of the hook block is a machine record. It does not go when a project is removed from the Store. `setup remove` removes the record together with the last block, and Store care names the record.
- [x] T25: Proposal from Phase 4, which the Phase 5 review shows to the owner. A linked work tree that is not bound. In a work tree that is not bound to the Store, the hook does nothing and says nothing ([register entry R-045](../../prd/03-open-questions-and-risk-register.md)). Keep that form or name another one. The hook review says that the hooks act only in a bound checkout, and it names the command that binds a work tree.
- [x] T26: Proposal from Phase 4, which the Phase 5 review shows to the owner. The length of the hook output. A trigger run that imported a file, or that found a file that waits, prints 9 or 10 lines today. The hook rule of T3 allows the summary line and the command. Decide where the cut is made: in the block, or in a shorter trigger output of the checkpoint. T3 builds the rule, and this task records the choice and its test.
- [x] T27: Proposal from Phase 4, which the Phase 5 review shows to the owner. Hidden error output, with a debug switch. The proof block sends the error output of the checkpoint call to nowhere, so that a command that cannot start prints nothing. Keep that form or name another one. Add a switch that shows the error output to a person who looks for a fault. The switch is a new idea of the P4 review. Propose its name under the name rules of [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md). Since the background mode of 2026-11-28, the switch shows the error output only of a foreground run, and never on the output of git in the background mode. T42 proposes where the error output of a background run goes.
- [x] T28: Proposal from Phase 4, which the Phase 5 review shows to the owner. No hook manager is known by name. The detection rule knows no hook manager by name. A hook manager that writes a plain shell script into the hooks folder of the clone is not seen as an owner. So the block can land in a file that another tool owns, and that tool can remove it. Keep the rule or name another one. The hook review names the limit.
- [x] T29: Proposal from Phase 4, which the Phase 5 review shows to the owner. A hook file that is a symbolic link is refused. No document before P4 names this check. A link points to a file that another tool owns, and a block written through the link would change that file. Keep the refusal or name another form.
- [x] T30: Proposal from Phase 4, which the Phase 5 review shows to the owner. What "a shell script" means. A hook file is a shell script when it holds no null byte and its first line starts with `#!` and names `sh`, `bash`, `dash`, `ksh`, or `zsh`, directly or through `env`. Every other file is refused, also a file with shell text and no such first line. Keep this meaning or name another one.
- [x] T31: Proposal from Phase 4, which the Phase 5 review shows to the owner. The hook swallows a non-zero exit code of the checkpoint. The checkpoint exits 1 when another process holds the Store: at the time of P4 it waited the busy time of the Store, and then it printed one long line on standard error. The [P4 evidence](evidence.md#owner-gate-og-4-the-run-mode-of-a-git-hook) holds the measured case, beside the times of [`PERF-007`](04-git-hook-proofs.md#perf-007-the-checkpoint-that-a-git-hook-runs). Standing rule 5 says that a git hook never fails or blocks a git action. So the block ends with exit code 0 after any exit code of the checkpoint. For the case of a held Store, the owner decided on 2026-11-28 that the hook waits only a short time and then gives up quietly, and T36 builds that wait limit. So this task no longer decides that case. It makes the block agree with T36: after the limit the hook prints nothing and exits 0. For each other non-zero exit code of the checkpoint, decide what the hook prints. The proposal is: nothing. Since the background mode of 2026-11-28, this task holds for a run in the foreground fallback, and a hook in the background mode prints nothing in every case.
- [x] T32: Proposal from Phase 4, which the Phase 5 review shows to the owner. A checkout ID that stays in the record of the clone. The record holds the checkout IDs that selected the hooks, and `setup remove` keeps the block while another ID remains. When a person deletes the folder of a checkout and does not run `setup remove` there, its ID stays in the record. The block then never goes. The P4 review named this gap. Decide how setup and `setup remove` treat an ID whose folder is gone, and add a test.
- [x] T33: Proposal from Phase 4, which the Phase 5 review shows to the owner. A record that is left behind when the clone moves. The key of the record is a digest of the path of the clone's shared git folder. When the clone moves to another path, the key changes. The old record stays in the Store, and the block in the moved clone has no record. The P4 review named this gap. Decide the key or the repair, and add a test with a moved clone.
- [x] T34: Proposal from Phase 4, which the Phase 5 review shows to the owner. The state marks of the rule for git in the middle of an action. The independent review of P4 did not list this point. The P4 correction adds it, because the facts changed what T2 means. T2 says that the hooks after a commit and after a branch change do nothing in the middle of a rebase, a merge, a cherry-pick, or a bisect. The P4 tests show three facts. With `CHERRY_PICK_HEAD` in the rule, a cherry-pick with no conflict never syncs through the hook after a commit, also a cherry-pick of one commit. `REVERT_HEAD` stops no hook run of a revert, because git removes that file before it runs the hook. The rule does not read the `sequencer` folder, so a revert of several commits runs the checkpoint after each commit. Propose the list of marks: keep `REVERT_HEAD` or take it out, and read the `sequencer` folder or not. The hook review names a cherry-pick and `git am` among the actions that do not reach the checkpoint.

### Acceptance criteria

- A62a: The block finds and starts a command file that needs `node` when git has a short PATH. With a recorded `node` folder that no longer exists, the hook does nothing, prints nothing, and exits 0, and the hook review says that the recorded path can go stale and that repeat setup records it again.
- A62b: A hook file that setup creates is executable where the platform has file modes. An existing hook file that is not executable keeps its mode, and setup names it.
- A62c: The block runs in an existing hook file of another tool that ends with `exec` or `exit`, or setup refuses that file with one clear reason and no change. Every byte outside the block stays.
- A62d: With the Make Docs project in a subfolder of the git repository, a commit runs the checkpoint for that project, and the store has the edit.
- A62e: After `setup remove` in the last bound checkout of a clone, the Store holds no hook record for that clone. The Store check reports no leftover, and it names a hook record that still exists.
- A62f: In a linked work tree that is not bound, each of the four hooks exits 0 and prints nothing. The hook review names the limit and the command that binds a work tree.
- A62g: When something is due, a hook in its foreground fallback prints the summary line and the command and no other line, and the background checkpoint of a hook gives the same short form, which the file of the last run keeps. The evidence names where the cut is made.
- A62h: With no switch, a hook whose checkpoint call fails prints nothing. With the debug switch on, a foreground run shows the error output, and it still exits 0. A background run prints nothing with the switch on too, and the file of the last run holds its error output.
- A62i: Beside a plain shell script that another tool wrote, setup adds the block and keeps every other byte. When that tool writes its file again, repeat setup reports the block as missing. The hook review names the limit.
- A62j: For a hook file that is a symbolic link, setup refuses the git hooks with one clear reason and changes nothing, and the file that the link points to is byte-identical.
- A62k: Setup adds the block to a hook file with such a first line. It refuses, with one clear reason and no change, a file with another program on its first line, a file with no first line of that kind, a binary file, and an empty file.
- A62l: While another process holds the Store, a commit with the installed hook exits 0 and prints nothing, in the background mode and in the foreground fallback, as the owner decided on 2026-11-28 (A62r holds the times). The work file is imported by the next checkpoint. For each other non-zero exit code of the checkpoint, the commit exits 0, and the hook prints what T31 decided.
- A62m: After the folder of one bound checkout of a clone is deleted with no `setup remove`, `setup remove` in the last checkout that remains removes the block and the record, or it says exactly which record holds the block and what the person can do.
- A62n: After a clone with the hooks moves to another path, repeat setup reports the hook state there with no false drift, `setup remove` removes the block, and the Store holds no record for the old path, or Store care names it.
- A62o: A test for a cherry-pick of one commit, for a revert of one commit, and for a revert of two commits shows what the hook after a commit does in each case, and the result matches the proposed list of marks. The hook review names each git action that does not reach the checkpoint.
- A62p: The phase report lists each proposal of T20 to T34 with what was built and the reason. The owner saw each one. No proposal is recorded as an owner decision before the owner made it.

### Dependencies

- Stage 1.

## Stage 6 - The foreground run and the wait limit

This stage was added on 2026-11-28, with the owner's answer to owner gate OG-4. It has the next free numbers, so no earlier task or case number changed, and its number says nothing about its place in the order. It waits for Stage 1, and Stage 4 waits for it. Since the owner's second decision of 2026-11-28 it holds the background run, its foreground fallback, and the waits for the Store in both.

The owner's first answer of 2026-11-28, which the decisions below replaced on the same day. This record stays:

- A git hook runs the checkpoint in the foreground (option A of OG-4).
- Improvement 1: a short time limit on the wait for the Store, after which the hook gives up quietly.
- Improvement 2 was offered and not chosen: the hook after a rewrite skips the amend case. It is not built. So an amended commit still runs two hooks, and each one starts the checkpoint.

The owner's decisions of 2026-11-28 that replaced the foreground mode, and nothing more. The overview of this file gives the reason.

- OD-P5-1: git hooks run in the background. The hook starts the checkpoint and returns, and git does not wait. This replaces the foreground mode that the owner chose at owner gate OG-4 on 2026-11-28 (option A).
- OD-P5-2: a foreground fallback applies where a background process cannot survive. On a platform or in an agent tool where the started process does not keep running after the hook ends, the hook runs the checkpoint in the foreground. The owner did not exclude a foreground fallback for git hooks and sees no reason why it cannot be done. The review that setup shows says which mode applies.
- OD-P5-3: in the background, the checkpoint has no short limit on the wait for the Store. It uses the normal wait, which is the Store busy timeout, and then it syncs. The fix for the long waits for a live Store owner stays: no background run waits that long. The [evidence](evidence.md#the-waits-for-the-store-by-kind-of-run) holds each value.
- OD-P5-4: in the foreground fallback, the short limit on each wait for the Store applies, as the owner chose with OG-4 (improvement 1).
- OD-P5-5: a person who wants a foreground hook, or a hook whose output an agent can see, uses the hook of an agent tool ([P6](06-agent-tool-hooks.md)). So a git hook in the background mode prints nothing, in every case.

The owner did not decide these points. The builder builds one proposal for each, marks it as a proposal, and lists it for the owner in the [evidence](evidence.md#the-background-mode-for-the-owner): how a hook knows that it must fall back to the foreground; what the fallback prints, other than "gives up quietly" for a held Store; how the mode shows in the setup review, in the setup JSON result, and in the Store record; and whether the mode is fixed at install time or found at each run.

The owner's words of the first answer did not cover four details. The [plan](../../plans/2026-11-27-w35-r0-agent-checkpoints-and-triggers/00-overview.md#owner-decisions) lists one recommendation for each, R8 to R11, under OG-4. They are not owner decisions, and the owner can change any of them. The second set of decisions changed where each one holds:

- R8, the length of the limit: the value that the plan recommends. It holds only for a run in the foreground fallback (OD-P5-4). A background run waits the normal time (OD-P5-3).
- R9, how the limit is built: the checkpoint takes the bound for a trigger run, and the hook script holds no timer. It still holds, and the checkpoint takes the bound by run mode.
- R10, what "quietly" means: the hook prints nothing, the git action exits 0, and the next checkpoint or the reminder line covers the file. It still holds for the foreground fallback. In the background mode a hook prints nothing in every case (OD-P5-5).
- R11, what the limit covers: only the wait for the Store, and not the whole checkpoint run. It still holds, in both modes.

### Tasks

- [x] T35: Make the block of each of the four hooks run the checkpoint in the run mode that the owner decided. The first build ran it in the foreground, as the owner decided at OG-4 on 2026-11-28. The owner replaced that mode on the same day (OD-P5-1), so the block now asks the command to start the checkpoint in the background, and T39 holds that start. The hook waits for the checkpoint only in the foreground fallback of T42. The hook after a rewrite does not skip the amend case, because the owner did not choose improvement 2.
- [x] T36: Build the bound on each wait for the Store of a run that a git hook starts. A foreground run has the short limit (improvement 1 of OG-4, kept as OD-P5-4). A background run has no short limit and uses the normal wait (OD-P5-3), and it never waits the long time of a live Store owner. A run that reaches its bound gives up: it imports nothing and changes no Store record. Build the four recommendations of the plan, or name another form with the reason. R8: the length of the limit of a foreground run. R9: the checkpoint takes the bound for a trigger run with the event `commit` or `branch-change`, with no new CLI option and no new MCP input, and the hook script holds no timer. R10: after the limit a hook prints nothing, and the git action exits 0. R11: each bound covers one wait for the Store and not the whole run, so a first sync that has the Store is not cut. A direct run keeps the busy time of the Store, and no other caller changes. The checkpoint is deterministic logic with an agent form, so review the agent form under the [twins guide](../../assets/project/developing-deterministic-agentic-twins.md) and record the result.
- [x] T37: Add the tests with a held Store, with a temporary Store at a fixed, checked path. A helper process holds the Store for longer than each bound. A commit with the installed hooks then exits 0, prints nothing, and is not delayed, and its background run waits the normal time and gives up. Each test states its bounds as numbers. The work file is not imported by that commit. After the helper frees the Store, the next checkpoint imports the file: prove it with the next commit and with a direct run. When the helper frees the Store inside the wait, the background run waits and then syncs. Add the same test for a true merge, and for each named lock file of the Store that a live process holds. Show that a run in the foreground fallback waits the short limit and then gives up. Add one test that a direct run still waits the busy time of the Store. Add the test file to both fixed test lists with T14.
- [x] T38: Record the run mode and the waits in the PRDs of this phase, with the `W35 R0 P5` Requirement History entries of T16 to T18: [PRD 52](../../prd/52-work-store-and-work-queue.md) R-WORK-CHECKPOINT, [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md) for what setup shows about the mode, and [PRD 38](../../prd/38-global-store-and-project-state.md) R-DB-3 and R-HOOK-STATE. The work store reference says the same in its agent form. List R8 to R11 in the phase report for the owner, with what was built, the reason, and what the decisions of 2026-11-28 changed for each.
- [x] T39: Build the background start (OD-P5-1). The hook starts the checkpoint so that it keeps running after the shell of the hook exits and after git returns, with its input, its output, and its error output closed or sent to nowhere. A git action returns at once also when a pipe reads its output and when a tool captures it. Compare two forms, a start by the shell with only what a POSIX `sh` and the shell of git on Windows provide, and a start by the command itself. Choose the one that can be proven on Linux, macOS, and Windows, and say what is used on each platform and why. Ship no new program for it. Measure what the start costs in the foreground. A hook in the background mode prints nothing, in every case (OD-P5-5). How the start is built is a proposal.
- [x] T40: Prove that the started process survives. It keeps running after the process that ran git ended. A hang-up signal to the process group of git, as a closed terminal sends it, does not stop it. It leaves no process behind when it ended. Each test waits for the end of each background run, with a bound, through a file, and leaves no process and no folder in use.
- [x] T41: Prove overlapping runs again with real background hooks: several commits in a loop, and then one direct checkpoint. The store agrees with the files, and no outcome is lost, as the fix for [register entry R-041](../../prd/03-open-questions-and-risk-register.md) promises. Bound how many background checkpoints of one checkout can pile up, when a rule for it is simple and safe. Such a rule is a proposal.
- [x] T42: Build the foreground fallback (OD-P5-2 and OD-P5-4). Propose and build the simplest sound rule by which a hook knows that it must fall back, and say plainly what it can and cannot detect, by platform. The rule never makes a hook fail, block, or print in the background mode. It writes nothing into the project, it works in a linked work tree, and it needs no Store schema change. If it needs a table, a column, a version, or a migration, owner gate OG-3 opens: stop that part and report. A run in the fallback has the short limit and gives up quietly for a held Store, as the owner chose. Propose what the fallback prints in each other case, and where the debug switch of T27 shows the error output. Each of these is a proposal.
- [x] T43: Show the mode. The hook review that setup shows states the mode, what the person sees, which is nothing, and where the person finds the result: `make-docs work status`, and the reminder line of the next Make Docs command. Propose how the mode shows in the setup JSON result and in the Store record, and whether the mode is fixed at install time or found at each run. `setup remove` takes out what the fallback rule keeps for its checkout. Each of these is a proposal.
- [x] T44: Measure again. Run [`PERF-007`](04-git-hook-proofs.md#perf-007-the-checkpoint-that-a-git-hook-runs) with the built block, under its profile rules and the [requalification record](#requalification-of-perf-007-with-the-built-block): the time that the hook adds to each git action of the profile and to a commit that is the first sync, in the background mode and in the foreground fallback, and when the checkpoint ends after git. Record the result as `PERF-007-R2` beside `PERF-007-R1`. Add the side measure by the count of work files, to show whether the added time still grows. State the machine and the limits.
- [x] T45: Prepare the proof inside each agent tool, which the orchestrator runs under [standing rule 11](00-index.md#standing-rules). Add a script that installs the real hook block through the real setup, in a temporary project with a temporary Store and a temporary home folder, and that lets the orchestrator read afterwards, from files outside the project, whether the background checkpoint ran to its end, what it did, and whether the fallback happened. Write the exact steps and the table to fill. Do not guess the result. This task closes when the script, the steps, and the table exist and the script ran one time from a plain shell.

### Acceptance criteria

- A62q: With the installed hooks and one changed work file, a commit, a true merge, and a rewrite print nothing, and the store holds each edit after the background run ended. No process of a hook still runs after the test waited for the end of the runs.
- A62r: While another process holds the Store, or a live process holds a named lock file of the Store, a commit and a true merge with the installed hooks exit 0, print nothing, and are not delayed. The background run waits the normal time and gives up, and it never waits the long time of a live Store owner. A run in the foreground fallback waits the short limit and gives up. The tests name each bound as a number. `PERF-007` holds the measured times.
- A62s: The work file of that commit is not imported while the Store is held for longer than the wait. The next checkpoint imports it, in a test with the next commit and in a test with a direct run. Until then, `make-docs work status` and the reminder line count the file as waiting. When the Store is free again inside the wait, the background run imports the file.
- A62t: A direct run of the checkpoint still waits the busy time of the Store, and a first sync that has the Store is not cut by a limit.
- A62u: An amended commit runs two hooks, and each one starts the checkpoint, because improvement 2 is not built. The evidence records that the owner did not choose it.
- A62v: The PRDs hold the background run, the foreground fallback, and each bound, and `make-docs check prd` passes. The phase report lists R8 to R11 with what was built, the reason, and what the decisions of 2026-11-28 changed for each. The owner saw each one. None is recorded as an owner decision before the owner made it.
- A62w: With the installed hooks, a commit returns before the checkpoint ends and prints nothing, also when something is due. When the background run ended, the store has the edit, and `git status` shows no change that the hook made.
- A62x: A commit with the installed hooks returns at once also when a pipe reads its output (`git commit ... | cat`) and when a tool captures both of its outputs, while the background run still works.
- A62y: The started process leads a process group of its own. It keeps running after the process that ran git ended, and after a hang-up signal went to the process group of git. When it ended, no process and no run file of a live run is left.
- A62z: After ten commits in a loop and one direct checkpoint, the store agrees with the files, the direct run finds nothing due, and no outcome is lost. No more than one background checkpoint of a checkout waits. The waiting one waits a bounded time for the working one and then works too, and the store still agrees with the files. The evidence names that rule as a proposal. `PERF-007` holds the measured times.
- A62aa: After a background run that was stopped before its end, the next hook runs the checkpoint in the foreground and prints the short form, and the hook after it uses the background again. While each background run is stopped, each next hook stays in the foreground. The evidence says what the rule can and cannot detect.
- A62ab: A run in the foreground fallback has the short limit on each wait for the Store, gives up quietly, and exits 0. With the debug switch it shows the error output on standard error. The rule writes no file of the project, works in a linked work tree, and needs no Store schema change.
- A62ac: The hook review that setup shows states the mode, that the person sees nothing, where the person finds the result, and the fallback. The setup JSON result and the Store record state the mode. `setup remove` takes out the run files of its checkout.
- A62ad: `PERF-007-R2` holds the time that the built block adds to each git action in the background mode and in the foreground fallback, and when the checkpoint ends after git. The side measure by the count of work files is recorded with its limits. `make-docs check performance-evidence` shows no new finding.
- A62ae: The evidence holds the script, the exact steps, and the table for the proof inside each agent tool. The builder filled no cell with a guess. The orchestrator fills the table.

### Dependencies

- Stage 1.

### Closeout Notes

- The background mode: the owner decided on 2026-11-28 that git hooks run in the background (OD-P5-1 to OD-P5-5), after the notes below were written. T39 to T45 hold the change, and the [evidence](evidence.md#the-background-mode-t39-to-t45-a62w-to-a62ae) holds what was built, the proofs on macOS, `PERF-007-R2`, the points RF-19 to RF-32 for the owner, and what this change replaced in each note below. The seventh platform test file is `packages/cli/tests/w35-r0-p5-hook-background.test.ts`. Not done for the background mode: the independent review, the proof inside each agent tool (T45 is prepared, and A62ae waits for the orchestrator), the platform run, and the owner review. Owner gate OG-3 did not open for the run files, which is a finding and not an owner decision.
- Four testing decisions: Automated Implementation Testing `selected` and done on the maintainer machine. Six test files prove the platform facts, and both fixed lists of the platform workflow hold them: `packages/cli/tests/w35-r0-p5-git-hook-block.test.ts` (26 tests), `packages/cli/tests/w35-r0-p5-setup-git-hooks.test.ts` (17 tests), `packages/cli/tests/w35-r0-p5-hook-wait-limit.test.ts` (19 tests), `packages/cli/tests/w35-r0-p5-hook-end-to-end.test.ts` (7 tests), `packages/cli/tests/w35-r0-p5-hook-ownership.test.ts` (11 tests), and `packages/cli/tests/w35-r0-p5-test-path-guard.test.ts` (4 tests). `packages/cli/tests/w35-r0-p5-setup-offer.test.ts` (6 tests) proves the interactive offer and the preference question with the prompts replaced by test answers. The tests ran on macOS only. Linux and Windows wait for the pull request run. Performance Testing `not-needed-now`: no `PERF-007` sample ran again, and the [evidence](evidence.md#the-wait-limit-t35-to-t37-a62q-to-a62u) says how the built block differs from the measured one. Guided Progress Review `selected` and not done: the owner has not seen the surfaces. Unassisted Goal Testing `not-needed-now`.
- Performance evidence: none new. The evidence holds test log times and hand run times for the wait limit, and a side measure of the hook cost by the count of work files. None is a `PERF-007` result.
- Human Experience Review: not done. The surfaces for the owner are in the [evidence](evidence.md#the-list-for-the-owner): the hook review, the machine preference question and its review under `This computer`, each line that a hook can print, and the removal report. No run used a real terminal, because the sandbox of the builder gives none.
- Optional experience handoff: none.
- Explicit human acceptance gate: not done. The owner has not reviewed the recommendations R1, R2, and R4 to R11, the proposals of T20 to T34, the proposed names, the 18 points of new behavior, or the points RF-1 to RF-18 of the fixes after the independent review. None is recorded as an owner decision. Owner gate OG-3 did not open in the build: the record is one row of an existing table, with no new table, column, version, or migration. That is a finding, and not an owner decision. Owner gate OG-6 did not open, by the finding of the P4 platform run.
- Evidence report: [P5 Git Hooks in Setup](evidence.md#p5-git-hooks-in-setup).
- Phase / capability status: built on the maintainer machine, not complete. The independent review ran, and its findings are fixed. A second look by the review at the fixes, the package digest, the platform run, and the owner review are not done.
- Fixes after the independent review: the [evidence](evidence.md#p5-fixes-after-the-independent-review) holds each finding and what changed. In short: the wait limit of a hook run now bounds each wait for the Store, also for a held lock file, and for a branch change (T36, A62r); setup keeps a block that a person changed and a block that no record of this clone covers, unless the person gave `--git-hooks`, and then it keeps a backup of the old block text (T4, A51); a record of a clone at another folder is taken over only by `--git-hooks`, and `setup remove` takes none over (T33, A62n); a moved linked work tree keeps the blocks (T32, A62m); the block runs the recorded command before PATH (T2, T20); no hook test can run an installed `make-docs`. Each rule of that round is a proposal for the owner.
- T10: not checked. Owner gate OG-6 did not open, so the task has nothing to apply, and the [evidence](evidence.md#owner-gates-og-3-and-og-6) says so. The phase file asks to close it as `superseded`. A checked box in this file would close it as done, so the builder left the box open. The orchestrator closes the task with the outcome `superseded`.
- T14 and A60: both fixed lists hold the four test files, and the tests pass on the maintainer machine. A60 passes only with the three-platform result and the evidence commit.
- A50, A53f, A62j, and A62t: each is proven in part, and the [evidence](evidence.md#the-cases-by-test) says which part has no test.
- T16 to T18 and T38: PRD 07, 28, 30, 38, 39, and 52 each have a `W35 R0 P5` Requirement History entry. PRD 30 R-ADMIT-1, R-SELECT-1, and its Acceptance Criteria line, and PRD 07 R-SETUP-CLI-10, hold the exact words that the owner approved. No other PRD 30 line changed. PRD 38 R-DB-3 changed, because the Store code gained a wait input.
- T36: the twin review is in the [evidence](evidence.md#the-twin-review-t36). The agent form gained `WORK-RULE-070` to `WORK-RULE-072`. The fixes after the review changed the words of `WORK-RULE-071` in both forms.
- Tests of earlier phases that changed: two P1 test files and one parity fixture file take the short form and the three new rules, the P2 rule list ends at `WORK-RULE-069`, the P3 name test also reads the hook block, and two P4 tests that pinned the wait of the busy time now pin the limit. Each change follows a behavior that this phase changed on purpose.
- Register: R-043 to R-045 name what this phase built, and R-046 and R-047 are new. R-047 is the open point that the time of a hook run grows with the work files and that no rule bounds it.
- New behavior: the [evidence](evidence.md#p5-new-behavior-that-the-documents-did-not-state) lists 18 points that no document stated.
