---
title: "W35 R0 P5 Git Hooks in Setup"
kind: "plan"
status: "draft"
coordinate: "W35 R0 P5"
source:
  type: "design"
  path: "docs/designs/2026-11-27-agent-checkpoints-and-triggers.md"
---

# W35 R0 P5 Git Hooks in Setup

## Purpose

Build the first trigger that needs no agent memory: git hooks that run the checkpoint. This is the second part of the design's Phase 2. It builds only what P4 proved.

## Outcome

`make-docs setup` handles four git hooks for each project. A person selects them explicitly: by a hook input, by an answer in interactive setup, or, in a new project, by the machine preference that the person set. The hooks run the checkpoint as a trigger run, never fail a git action, and leave with `setup remove` exactly as they came.

| Hook | When git runs it | Checkpoint call | Imports |
| --- | --- | --- | --- |
| `post-commit` | After a commit | `--event commit` | Yes |
| `post-merge` | After a merge | `--event commit` | Yes |
| `post-rewrite` | After a rewrite of commits | `--event commit` | Yes |
| `post-checkout` | After a branch change only (third argument 1) | `--event branch-change` | No. It only reports (OD-9 option A). |

## Scope

- The setup offer. Setup shows each hook path and the exact block before it writes. The person selects the hooks explicitly. The offer is for one project. Make Docs sets no machine-wide git hooks path (OD-1 option A). An interactive project setup offers the hooks with "no" selected first when the machine preference is off, and in an older project also when it is on. An interactive setup of a new project offers them with "yes" selected first when the preference is on. An explicit hook input installs them in every mode, in a new project and in an older project.
- The machine preference. The owner decided its form on 2026-11-27 (owner gate OG-5, answered, design OD-11). Global config holds one preference that says whether Make Docs installs the git hooks automatically for each project. Its default is "No". With the preference on, project setup installs the git hooks with no hook input, also in `make-docs setup --yes`. With the preference off, `make-docs setup --yes` installs no hook and says so in one line. The preference never installs a hook that belongs to one agent tool.
- The scope of the preference. The owner decided it on 2026-11-27, and it replaces recommendation R3 of the overview: with the preference on, setup installs the git hooks automatically only in a new project. An older project still gets the git hooks when the person wants them, through an explicit hook input or through an explicit "yes" in an interactive setup of that project. With the preference on, `make-docs setup --yes` in an older project installs no hook and says so in one line. The owner decided the meaning of "new project" on 2026-11-27 (R3a of the overview): it is the meaning of the project name in [PRD 38](../../prd/38-global-store-and-project-state.md) R-ID-8, a fresh setup target with no config file.
- The question at the machine step. The person sets the preference at the machine step of setup: `make-docs setup system`, or the same flow that project setup opens inline (PRD 07 R-SETUP-CLI-4, `packages/cli/src/setup-system.ts`). That step asks only connection methods today. This phase adds the preference question there, with "No" selected first, and an explicit input for a non-interactive machine setup. No new command is added.
- The rule for an update. An update of Make Docs never turns the preference on, and it never installs a hook by itself in a project that has none. Turning the preference on installs no hook by itself, and turning it off removes none. These rules, and the other details that the owner's words do not cover, are the recommendations R1, R2, and R4 to R7 of the overview under OG-5. R3 and R3a are owner decisions of 2026-11-27. The backlog builds the offer, the preference with its question, and the non-interactive path as three tasks. The name of the hook input flag and the key of the machine preference are not set. The builder proposes both names under the PRD 39 name rules, and the phase review shows them to the owner in the phase report. This needs no new gate.
- The marked block. Make Docs adds one marked block to a hook file that is a shell script and keeps every other byte. It creates the file when none exists.
- The refusals. Setup refuses, with a clear reason and no change, when the hook file is not a shell script, when another tool owns the hooks, or when `core.hooksPath` points to another folder.
- The block content. It finds the `make-docs` command by the method that P4 chose, runs the checkpoint with its event, in the foreground, and always exits 0. The owner chose the foreground run at OG-4 on 2026-11-28. It does nothing when the command is not found, when no usable Store exists, or when the folder is not a Make Docs project. The hooks after a commit and after a branch change do nothing while git is in the middle of a rebase, a merge, a cherry-pick, or a bisect. The hooks after a merge and after a rewrite do not use that rule. The hook after a branch change does nothing for a file checkout (third argument 0).
- The wait limit. The owner decided on 2026-11-28, with the answer to OG-4, that the wait for the Store has a short time limit, after which the hook gives up quietly. The work file is then imported by the next checkpoint. The owner did not decide the length of the limit, how it is built, what "quietly" means in detail, or what the limit covers. The overview holds the recommendations R8 to R11 for these under OG-4. The phase builds them as written or names another form with the reason, and the phase review shows them to the owner. A second improvement was offered and not chosen, so it is not built: that the hook after a rewrite skips the amend case. The backlog holds the foreground run and the wait limit as P5 T35 to T38 and A62q to A62v.
- Output. A hook prints nothing when nothing is due. When something waits, it prints at most the summary line and the command. With Store read access only, it prints the one line that says how many files wait. With no Store access it prints nothing.
- A hook never writes a project file (OD-5 option A). The checkpoint's trigger run already holds that rule.
- The clone-owned record. The Store records the exact block for the clone's shared git folder, in the record that P4 found or that the owner approved at OG-3. Setup reports drift when the block changed.
- Removal. `setup remove` removes only a block that still matches, and keeps a changed block with a report. In a clone with linked worktrees it removes the block only when no other bound checkout of that clone remains. Until then it reports that the block stays, and why.
- Repeat setup reports current, missing, and drifted hook state, and changes only the Make Docs block.
- A known gap from P4, such as a platform where a fact failed, appears in the hook review that setup shows (or the offer is absent there, under OG-6).
- The hook block is shipped text. The name test checks that it names the current checkpoint command.
- The platform test list. One task adds the hook test files of this phase to both fixed lists in `.github/workflows/platform-safety.yml`. Without that, they run on Linux only. The three-platform result comes from a pull request run or a manual run (standing rule 12), after the phase commit and the push, and one evidence commit records it.
- Tests on Linux, macOS, and Windows, with a temporary Store: the two-checkout test, the two-worktree test, the `git pull --rebase` test, the read-only and no-Store-access runs, the quiet exits with no CLI, no Store, and no Make Docs install, and setup and removal beside a hook of another tool.
- PRD changes, each with a Requirement History entry: PRD 28 (the sentence about hooks and the Non-Requirements line, which the owner approved); PRD 30 R-ADMIT-1, R-SELECT-1, and the Acceptance Criteria line about default setup, with the exact words that the owner approved on 2026-11-27 (owner gate OG-10, answered); PRD 07 (new R-SETUP-CLI-15 and later, one new sentence in R-SETUP-CLI-10, and `setup remove`); PRD 38 (new R-HOOK-STATE, the field register, and global config); and PRD 39 R-NAME-6 for the hook block.
- PRD 30 R-BOUND-1, R-BOUND-2, and R-ADMIT-4 do not change. The overview gives the reason for each. The overview gives the exact words for PRD 30 R-SELECT-1, the PRD 30 Acceptance Criteria line, and PRD 07 R-SETUP-CLI-10 under OG-10. They follow from the owner's answer to OG-5 and were shown to the owner on 2026-11-27.
- Agent form: the work store reference says what the hooks do and what an agent does when a hook prints its line. An agent installs no hook by hand.
- The proposals from P4. The independent review of P4 added this point on 2026-11-27. "The method that P4 chose" means one thing only: a PATH lookup, and then a path that setup recorded in the block. Each other choice of the P4 builder is a proposal. The phase builds each one as written or names another form with the reason, tests it, and the phase review shows it to the owner. No proposal is an owner decision. The proposals:
  - The block adds the recorded folder of `node` to the end of PATH for the call (register entry R-044). The folder is a path of the machine, and it can go stale.
  - Setup sets the executable mode on a hook file that it creates, and names an existing hook file that is not executable.
  - The position of the block in an existing hook file. A block after an `exec` or an `exit` of another tool never runs.
  - A project in a subfolder of the git repository: the block gives the checkpoint the project root (`--target-root`).
  - `setup remove` removes the Store record with the last block, and Store care names the record.
  - In a linked work tree that is not bound, the hook does nothing and says nothing (register entry R-045), and the hook review names it.
  - A trigger run prints 9 or 10 lines when something is due, and the hook rule allows the summary line and the command. The phase decides where the cut is made.
  - The block hides the error output of the checkpoint call, and a debug switch shows it. The switch is a new idea of the P4 review.
  - The detection rule knows no hook manager by name, so the block can land in a file that another tool owns.
  - A hook file that is a symbolic link is refused.
  - "A shell script" means a file with no null byte whose first line starts with `#!` and names `sh`, `bash`, `dash`, `ksh`, or `zsh`.
  - The block swallows a non-zero exit code of the checkpoint. The checkpoint exits 1 when another process holds the Store. For that case the owner decided the wait limit on 2026-11-28, so the proposal now covers what the hook prints for each other non-zero exit code.
  - A checkout ID stays in the record of the clone after its folder is deleted, and the block then never goes.
  - A record is left behind when the clone moves, because its key is a digest of the path.
  - The state marks of the rule for git in the middle of an action. With `CHERRY_PICK_HEAD` in the rule, a cherry-pick with no conflict never syncs through the hook after a commit. `REVERT_HEAD` stops no hook run of a revert. The rule does not read the `sequencer` folder. The P4 correction added this point. It is not on the list of the review.

## Exclusions

- No machine-wide `core.hooksPath` (OD-1 option B was not chosen).
- No hook before a commit, and no hook that blocks.
- No import after a branch change (OD-9 option B was not chosen).
- No agent tool hook. P6 owns it.
- No hook setting in project config.

## Acceptance

- After an edit of a work file and a commit in one checkout, the store has the edit with no work command run by hand.
- With two linked worktrees on different branches, a commit in one and a checkpoint in the other leave no silent overwrite, and each result names its checkout.
- After `git pull --rebase` with local commits, the recorded hook ran and the store holds the pulled work files. An amended commit runs two hooks, and the second run finds nothing due.
- A file checkout makes the hook do nothing. The hooks after a commit and after a branch change do nothing in the middle of a rebase, a merge, a cherry-pick, or a bisect, and the hooks after a merge and after a rewrite still run.
- Each hook exits 0 in every tested case, and prints nothing when nothing is due.
- A hook runs the checkpoint in the foreground: the output of the checkpoint appears before the git action returns.
- While another process holds the Store for longer than the wait limit, a commit with the installed hook exits 0, prints nothing, and ends within the limit plus the normal time of a commit with the hook. The next checkpoint imports the work file.
- A direct run of the checkpoint still waits the busy time of the Store.
- The phase report lists the recommendations R8 to R11, and the owner saw each one.
- A git action leaves the work tree as git left it.
- Setup beside a hook of another tool keeps that tool's bytes, and `setup remove` restores the file byte for byte.
- A changed block is kept and reported.
- The machine step asks the preference question with "No" selected first, and an absent value means "No".
- With the preference on, `setup --yes` with no hook input installs the four hooks in a new project. With the preference off, it installs none and says so in one line.
- With the preference on, `setup --yes` with no hook input installs no hook in an older project and says so in one line. An explicit hook input, and an explicit "yes" in an interactive setup, install the four hooks in an older project.
- An interactive project setup offers the hooks with "no" first when the preference is off, and with "yes" first when it is on and the project is new. An explicit hook input installs them in both cases.
- The phase review shows the owner that the phase built the meaning of "new project" that the owner decided on 2026-11-27 (R3a).
- The preference installs no hook of an agent tool.
- An update of Make Docs leaves the preference as it was and installs no hook in a project that has none. A later setup run in that older project installs no hook by the preference alone.
- After the person turns the machine preference off, the first choice of the offer is "no" again, and the hooks of a project that already has them stay.
- PRD 30 R-ADMIT-1, R-SELECT-1, and the Acceptance Criteria line, and PRD 07 R-SETUP-CLI-10, hold the words that the owner approved on 2026-11-27.
- `setup remove` in one worktree keeps the block while another bound checkout of the clone remains.
- Each proposal from P4 has a test, and the phase report lists each one with what was built and the reason. The owner saw each one, and none is recorded as an owner decision before the owner made it.

## Testing Decisions

- Automated Implementation Testing: required. The hook tests run on each platform through the fixed list of the platform workflow.
- Performance Testing: `not-needed-now`. `PERF-007` in P4 measured the hook run. The phase reruns only an affected check if the built block differs from the measured one.
- Guided Progress Review: selected. The owner sees the setup hook review and the removal report.
- Unassisted Goal Testing: `not-needed-now`.

## Dependencies

- P4.
- Owner gate OG-6 (only if it opened) for the setup stage. Owner gate OG-4 is answered: the owner chose the foreground run on 2026-11-28, with a short time limit on the wait for the Store, so it blocks nothing. OG-3 did not open: P4 found on 2026-11-27 that an existing Store record fits, and the independent review of P4 agreed. OG-5 and OG-10 are answered and block nothing.
- The P4 three-platform result.
- Merge risk with W22 in the setup flow and PRD 07. See the overview.
