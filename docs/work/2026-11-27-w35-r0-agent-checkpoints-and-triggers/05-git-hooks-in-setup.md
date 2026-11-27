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

`make-docs setup` handles four git hooks for each project, and a person selects them explicitly: by a hook input, by an answer in interactive setup, or by the machine preference that the person set. The owner decided the form of that preference on 2026-11-27 (owner gate OG-5, answered, design OD-11). Make Docs writes into the git hooks folder for the first time, so the phase also builds the ownership record, the drift report, and exact removal. Git hooks, the marked block, the refusal when another tool owns the hooks, the clone-owned record, and the machine preference are new.

| Hook | When git runs it | Checkpoint call | Imports |
| --- | --- | --- | --- |
| `post-commit` | After a commit | `make-docs project checkpoint --event commit` | Yes |
| `post-merge` | After a merge | `make-docs project checkpoint --event commit` | Yes |
| `post-rewrite` | After a rewrite of commits | `make-docs project checkpoint --event commit` | Yes |
| `post-checkout` | After a branch change only (third argument 1) | `make-docs project checkpoint --event branch-change` | No. It only reports (design OD-9 option A). |

The [standing rules](00-index.md#standing-rules) of the index hold in this phase. Rule 5 is the centre of it: a hook never fails or blocks a git action.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. A person does not need to tell an agent to sync. A git action never fails because of Make Docs. Setup shows each hook before it writes, and `setup remove` takes out only what Make Docs put in.
- Intended human outcome: after a commit, the work store has the file changes, or the person sees one line that says what waits and which command settles it. The person saw each hook path and the exact block before setup wrote, and gets the hook files back as they were on removal.
- Human-facing surface or indirect effect: the setup hook review, the line that a hook prints, the repeat setup status, and the `setup remove` plan and report.
- Implementation work: the setup offer, the machine preference and its question at the machine step, the block writer, the refusals, the Store record, drift detection, removal, and tests on each platform.
- Evidence source or testing type selected under current authority: the two-checkout, two-worktree, and `git pull --rebase` tests, quiet-exit tests, setup and removal tests beside a hook of another tool, and a Guided Progress Review of the hook review.
- Executor: the implementing agent runs the tests. The orchestrator starts the workflow run under [standing rule 12](00-index.md#standing-rules). The owner reviews the hook review, the machine preference question, and the removal report, and answers the open gates.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Hook, setup, drift, and removal tests. They run on Linux, macOS, and Windows only when T14 adds their files to the fixed test list of the platform workflow. |
| Performance Testing | not-needed-now | `PERF-007` in [P4](04-git-hook-proofs.md) measured the hook run. If the built block differs from the measured one, the phase reruns only the affected check within the remaining budget. |
| Guided Progress Review | selected | The owner sees the setup hook review, the machine preference question, the line that a hook prints, and the removal report. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

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
- Findings: the P4 gaps in the [risk register](../../prd/03-open-questions-and-risk-register.md) and the P4 section of `evidence.md`.

## Stage 1 - The hook block and the record

### Tasks

- [ ] T1: Build the block writer. Make Docs adds one marked block to a hook file that is a shell script and keeps every other byte. It creates the file when none exists. It refuses, with a clear reason and no change, when the hook file is not a shell script, when another tool owns the hooks, or when `core.hooksPath` points to another folder, with the detection rule that P4 recorded. Make Docs sets no machine-wide git hooks path.
- [ ] T2: Write the block content for the four hooks. It finds the `make-docs` command by the method that P4 chose. It runs the checkpoint with its event, in the run mode that the owner chose at OG-4. It always exits 0. It does nothing when the command is not found, when no usable Store exists, or when the folder is not a Make Docs project. The hooks after a commit and after a branch change do nothing while git is in the middle of a rebase, a merge, a cherry-pick, or a bisect. The hooks after a merge and after a rewrite do not use that rule. The hook after a branch change acts only when its third argument is 1.
- [ ] T3: Make the output rule hold. A hook prints nothing when nothing is due. When something waits for a person, it prints only the summary line and the command. With Store read access only, it prints the one line that says how many files wait and which command to run. With no Store access it prints nothing.
- [ ] T4: Record the exact block in the Store for the clone's shared git folder, in the record that P4 found, or in the record that the owner approved at OG-3. Report drift when the block changed. Repeat setup reports current, missing, and drifted hook state and changes only the Make Docs block.

### Acceptance criteria

- A48: Setup beside an existing hook file of another kind keeps every byte outside the Make Docs block. Setup refuses, with one clear reason and no change, for a hook file that is not a shell script, for hooks that another tool owns, and for a `core.hooksPath` that points to another folder.
- A49: Each of the four hooks exits 0 and prints nothing when the `make-docs` command is missing, when no Store exists, and when the project has no Make Docs install. A file checkout (third argument 0) makes the hook after a checkout do nothing. The hooks after a commit and after a branch change do nothing in the middle of a rebase, a merge, a cherry-pick, or a bisect, and the hooks after a merge and after a rewrite still run the checkpoint there.
- A50: A hook with Store read access only prints the one line with the count of waiting files and the command. A hook with no Store access prints nothing. Both exit 0.
- A51: A changed block is reported as drift, and repeat setup does not change it without a reviewed plan.

### Dependencies

- P4.
- Owner gate OG-3, when it opened: the owner approves a Store schema change or does not.
- Owner gate OG-4: the owner chooses a foreground run or a run that starts and returns.

## Stage 2 - The setup offer and removal

Merge risk: W22 R2 is active and adds the adoption path to the setup flow and to PRD 07. This stage adds the git hook offer to the same flow, and Stage 4 adds PRD 07 requirements. Merge by hand, then rerun the setup tests and record the digest again under standing rule 10. This Wave edits no W22 R2 file. This note is not a dependency, so it stands here and not under `### Dependencies`. See the [index](00-index.md#wave-sequence).

The owner's answer to OG-5: a machine preference says whether Make Docs installs the git hooks automatically for each project. Its default is "No". The person sets it when Make Docs is first installed on the computer, or when the machine installation itself is changed. With the preference on, project setup installs the git hooks with no hook input, also in `make-docs setup --yes`. With the preference off, `make-docs setup --yes` installs no hook, an interactive project setup still offers the git hooks with "no" selected first, and an explicit hook input still installs them. A hook that belongs to one agent tool always needs an explicit input, in every mode, and the preference never installs one. The owner's reason: git hooks are part of a different lifecycle than agent tool hooks, and agent tools are a lifecycle on top of the normal development and documentation lifecycle, so their hooks get an extra measure of caution.

The machine step: the person sets the preference at the machine step of setup. `make-docs setup system` opens that step directly, and project setup opens the same flow inline ([PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md) R-SETUP-CLI-4, `runSystemSetupCommand` and `promptForSystemSetupMethods` in `packages/cli/src/setup-system.ts`). That step asks one connection method for each agent tool today, and no machine preference. Its non-interactive form has no input for one. So T7 adds the question and the input. Add no new command.

Recommendations: the owner's words do not cover each detail. The [plan](../../plans/2026-11-27-w35-r0-agent-checkpoints-and-triggers/00-overview.md#owner-decisions) lists the recommendations R1 to R7 under OG-5. The tasks below build them as written, and each task marks them with their number. They are not owner decisions. The phase report shows them to the owner, and the owner can change any of them.

Names: the name of the hook input flag, the name of the input that sets the machine preference, and the key of the machine preference are not set. The builder proposes these names under the name rules of [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md), and the phase review shows them to the owner in the phase report. This needs no new gate.

### Tasks

- [ ] T5: Add the offer to interactive `make-docs setup`. Setup shows each hook path, the exact block, and what the block runs, before it writes. The person selects the hooks explicitly. The offer is for one project. With the machine preference absent or off, "no" is selected first. With the preference on, "yes" is selected first, and the person still sees the review and confirms it (R4). An explicit hook input installs the hooks in both cases. A known gap from P4 appears in this review.
- [ ] T6: Add one machine preference to global config: whether Make Docs installs the git hooks automatically for each project. Its default is "No", and an absent value means "No". The preference concerns the git hooks only. It never installs a hook that belongs to one agent tool. Make these rules hold, each with a test. An update of Make Docs never turns the preference on and never installs a hook by itself in a project that has none (R1). Turning the preference on writes one value of global config and installs no hook in any project by itself, and turning it off removes no hook that a project already has (R2).
- [ ] T7: Add the preference question to the machine step of setup: `make-docs setup system`, and the same flow that project setup opens inline. The question has "No" selected first when global config holds no answer. The machine step asks it when global config holds no answer yet, and `make-docs setup system` shows it again with the current value selected first (R6). Add an explicit input that sets the preference in a non-interactive machine setup. `--yes` alone never changes the preference (R6). The machine review shows the change under `This computer`. Turning the preference on or off changes only that one value of global config.
- [ ] T8: Add the non-interactive path as the owner decided at OG-5. With the preference on, `make-docs setup --yes` with no hook input installs the four git hooks, and its plan output names them. With the preference off, it installs no hook and says so in one line. An explicit hook input installs the hooks with the preference on or off. An explicit "no hooks" input for one run holds over the preference (R5). With the preference on, a project setup run installs the hooks also in a project that was set up before and has none (R3). When setup must refuse the git hooks under T1, it installs no hook, says why in one line, and the rest of the run goes on (R7). A bare non-interactive setup, with no `--yes`, installs no hook. `--dry-run` prints the exact hook plan. Conflicting hook input fails before any write.
- [ ] T9: Build removal. `setup remove` removes only a block that still matches the recorded bytes, and keeps a changed block with a report. It removes a hook file that Make Docs created only when the file holds nothing else. In a clone with linked worktrees it removes the block only when no other bound checkout of that clone remains. Until then it reports that the block stays, and why.
- [ ] T10: If owner gate OG-6 opened, apply the owner's choice for each platform with a gap, and add a test for it. If the gate did not open, say so in the evidence report and close this task as `superseded`, not as `cancelled`, because a cancelled unit keeps each unit that depends on it waiting.

### Acceptance criteria

- A52: The setup review shows each of the four hook paths and the exact block before any write, and a run with no selection writes no hook.
- A53: The interactive offer has "no" selected first when the machine preference is absent or off, and "yes" selected first when it is on. The person confirms in both cases. After the person turns the preference off, "no" is selected first again, global config holds no other change, and the hooks of a project that already has them stay.
- A53a: The machine step (`make-docs setup system`, and the same flow inline in project setup) asks the preference question with "No" selected first. With no answer, global config holds no preference, and that means "No". `--yes` alone leaves the preference as it was.
- A53b: With the preference on, `make-docs setup --yes` with no hook input installs the four git hooks, and the plan output names each hook path.
- A53c: With the preference off or absent, `make-docs setup --yes` with no hook input installs no hook and says so in one line.
- A53d: An explicit hook input installs the hooks with the preference on, off, or absent, in interactive and in non-interactive setup. An explicit "no hooks" input installs none with the preference on.
- A53e: With the preference on, setup with no hook input for an agent tool installs no hook of any agent tool, in interactive and in non-interactive setup.
- A53f: After an update of Make Docs, the preference holds the same value as before, and a project that had no hook has none. After the person turns the preference on, no project has a new hook until its next project setup run.
- A54: After setup and then `setup remove` beside a hook of another tool, each hook file is byte-identical to its state before setup.
- A55: `setup remove` in one worktree keeps the block while another bound checkout of the clone remains, and says so. It removes the block when none remains.
- A56: If OG-6 opened, a test shows that setup on each platform with a gap does what the owner chose. If OG-6 did not open, the evidence report says so.

### Dependencies

- Stage 1.
- Owner gate OG-6, when it opened: the owner chooses whether setup offers the hooks on a platform with a gap.

## Stage 3 - End-to-end proofs

### Tasks

- [ ] T11: Add the two-checkout test. One side edits a work file and commits. The store has the edit after the commit with no work command run by hand, and the work tree is as git left it.
- [ ] T12: Add the two-worktree test. Two linked worktrees of one clone are on different branches. A commit in one, then a checkpoint in the other. The test records what the store holds and what each worktree reports, with no silent overwrite. A branch change alone leaves the store unchanged and prints the one line when files wait.
- [ ] T13: Add the `git pull --rebase` test with local commits. It shows which hook ran and what the store holds after it. Add the amended commit case: two hooks run, and the second finds nothing due.
- [ ] T14: Add each new hook test file of this phase to both fixed test lists in `.github/workflows/platform-safety.yml`: the step "Run platform safety contracts" of the job `platform-contract`, and the step "Run required source safety matrix" of the job `installed-package`. Without this change the tests run on Linux only. This task closes when both lists hold the files and the tests pass on the maintainer machine. The three-platform result comes later, in the order of [standing rule 12](00-index.md#standing-rules): the phase commit, the push, the pull request run, then one evidence commit of the form `docs: [W35 R0 P5] Agent Checkpoints and Triggers - Git Hooks in Setup Evidence`. That commit records each platform result with the link to the workflow run.

### Acceptance criteria

- A57: After an edit of a work file and a commit, the store holds the edit, no work command was run by hand, and `git status` shows no change that the hook made.
- A58: In the two-worktree test, each result names its checkout, each difference shows as a pending write or a conflict, and a branch change alone changes no store record.
- A59: After `git pull --rebase` with local commits, the recorded hook ran and the store holds the pulled work files, or the gap is named in the hook review and the register. An amended commit runs two hooks, and the second run finds nothing due and prints nothing.
- A60: Both fixed test lists of the workflow hold the hook test files of this phase. The tests pass on each of the three platforms in a pull request run or a manual run, or each failure is a recorded gap with the owner's choice at OG-6. This case passes only after the phase commit, the push, and the pull request run, with the evidence commit.

### Dependencies

- Stage 2.

## Stage 4 - Agent form, PRDs, and evidence

### Tasks

- [ ] T15: Update the work store reference in `packages/docs/template/`: what the hooks do, what an agent does when a hook prints its line, and that an agent installs no hook by hand. Copy the file byte for byte to the installed copy. Extend the name test so that it checks the hook block for the current checkpoint command.
- [ ] T16: Update the two PRDs that own the hook boundary, with a `W35 R0 P5` Requirement History entry in each:
  - [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md): the sentence "Make Docs has no general plugin, hook, extension, workflow-bundle, or Playbook-generated Skill product" and the matching Non-Requirements line. Make Docs still has no general hook product. It has two bounded kinds of hook: the git hooks that setup offers for each project, and a hook method of a first-party adapter with real capability evidence. The owner approved this change on 2026-11-27.
  - [PRD 30](../../prd/30-plugin-substrate-and-workflow-bundles.md), with these exact words. The owner answered owner gate OG-10 on 2026-11-27.
    - R-ADMIT-1 becomes: "R-ADMIT-1 (MUST): a future optional integration requires a traced current non-Playbook consumer and purpose, a coherent owning PRD, explicit selection, a real harness capability contract or, for the git hooks that PRD 07 owns, the git hook behavior that tests prove on each supported platform, install and uninstall behavior, ownership and provenance records, safe audit/backup/migration handling, and honest support status." The owner approved this sentence. Git is not an agent tool, so a git hook cannot meet "a real harness capability contract" as the requirement reads today.
    - R-SELECT-1 gains: "The git hooks are installed only by an explicit hook input, by an explicit answer in interactive setup, or by the machine preference that the person set." Follows from D1; shown to the owner on 2026-11-27.
    - The Acceptance Criteria line "Default setup, sync, and Skills selection create no plugin, hook, extension, workflow-bundle, or generated package output" becomes: "Default setup, sync, and Skills selection create no plugin, extension, workflow-bundle, or generated package output, and no hook other than the git hooks that R-SELECT-1 admits." Follows from D1; shown to the owner on 2026-11-27.
  - D1 is the owner's answer to OG-5, which the design records as OD-11. Change no other PRD 30 requirement. R-BOUND-1 forbids a hook registry, and this Wave builds none. R-BOUND-2 allows a hook that passed R-ADMIT. R-ADMIT-4 forbids a simulated hook, and a git hook is real. So these three stay as they are.
- [ ] T17: Update [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md) with a `W35 R0 P5` Requirement History entry: new R-SETUP-CLI-15 and later for the offer, the review, the machine preference with its question at the machine step, the refusals, and removal. R-SETUP-CLI-10 gains this exact sentence: "For the git hooks, the machine preference is the explicit selection when it is on." Follows from D1; shown to the owner on 2026-11-27. State each of the recommendations R1 to R7 that the owner kept as a requirement.
- [ ] T18: Update [PRD 38](../../prd/38-global-store-and-project-state.md) and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md), with a `W35 R0 P5` Requirement History entry in each. PRD 38 gains new R-HOOK-STATE requirements for the clone-owned record, the R-MIN field register row, and the global config preference. PRD 39 R-NAME-6 says that the hook block is shipped text.
- [ ] T19: Add the P5 section to `evidence.md`, with the hook review and the removal report as a person sees them.

### Acceptance criteria

- A61: `make-docs check prd`, the shipped-text test, and the byte-match test pass. PRD 28 and PRD 30 agree about hooks. PRD 30 R-ADMIT-1, R-SELECT-1, and the Acceptance Criteria line about default setup, and PRD 07 R-SETUP-CLI-10, hold the exact words of T16 and T17. The evidence records the owner's answers to OG-5 and OG-10 and their date, 2026-11-27. No other PRD 30 line changed.
- A62: The owner reviews the setup hook review, the machine preference question, the line that a hook prints, and the removal report. The phase report lists the recommendations R1 to R7 and the proposed names. Each one says what happens, where, and what the person can do next.

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
