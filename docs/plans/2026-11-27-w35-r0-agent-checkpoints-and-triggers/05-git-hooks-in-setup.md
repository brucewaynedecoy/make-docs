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

`make-docs setup` offers four git hooks for each project. A person selects them explicitly. The hooks run the checkpoint as a trigger run, never fail a git action, and leave with `setup remove` exactly as they came.

| Hook | When git runs it | Checkpoint call | Imports |
| --- | --- | --- | --- |
| `post-commit` | After a commit | `--event commit` | Yes |
| `post-merge` | After a merge | `--event commit` | Yes |
| `post-rewrite` | After a rewrite of commits | `--event commit` | Yes |
| `post-checkout` | After a branch change only (third argument 1) | `--event branch-change` | No. It only reports (OD-9 option A). |

## Scope

- The setup offer. Setup shows each hook path and the exact block before it writes. The person selects the hooks explicitly. The offer is for one project. Make Docs sets no machine-wide git hooks path (OD-1 option A).
- The machine preference. Global config holds one preference that makes "yes" the default answer of the offer for each new project. With the preference off, the default answer is "no". Machine setup can set it and clear it. Clearing it changes no hook that a project already has. What non-interactive `setup --yes` does with it is owner gate OG-5. The backlog builds the offer, the preference, and the set and clear step as three tasks. The name of the hook input flag and the key of the machine preference are not set. The builder proposes both names under the PRD 39 name rules, and the phase review shows them to the owner in the phase report. This needs no new gate.
- The marked block. Make Docs adds one marked block to a hook file that is a shell script and keeps every other byte. It creates the file when none exists.
- The refusals. Setup refuses, with a clear reason and no change, when the hook file is not a shell script, when another tool owns the hooks, or when `core.hooksPath` points to another folder.
- The block content. It finds the `make-docs` command by the method that P4 chose, runs the checkpoint with its event, in the run mode that the owner chose at OG-4, and always exits 0. It does nothing when the command is not found, when no usable Store exists, or when the folder is not a Make Docs project. The hooks after a commit and after a branch change do nothing while git is in the middle of a rebase, a merge, a cherry-pick, or a bisect. The hooks after a merge and after a rewrite do not use that rule. The hook after a branch change does nothing for a file checkout (third argument 0).
- Output. A hook prints nothing when nothing is due. When something waits, it prints at most the summary line and the command. With Store read access only, it prints the one line that says how many files wait. With no Store access it prints nothing.
- A hook never writes a project file (OD-5 option A). The checkpoint's trigger run already holds that rule.
- The clone-owned record. The Store records the exact block for the clone's shared git folder, in the record that P4 found or that the owner approved at OG-3. Setup reports drift when the block changed.
- Removal. `setup remove` removes only a block that still matches, and keeps a changed block with a report. In a clone with linked worktrees it removes the block only when no other bound checkout of that clone remains. Until then it reports that the block stays, and why.
- Repeat setup reports current, missing, and drifted hook state, and changes only the Make Docs block.
- A known gap from P4, such as a platform where a fact failed, appears in the hook review that setup shows (or the offer is absent there, under OG-6).
- The hook block is shipped text. The name test checks that it names the current checkpoint command.
- The platform test list. One task adds the hook test files of this phase to both fixed lists in `.github/workflows/platform-safety.yml`. Without that, they run on Linux only. The three-platform result comes from a pull request run or a manual run (standing rule 12), after the phase commit and the push, and one evidence commit records it.
- Tests on Linux, macOS, and Windows, with a temporary Store: the two-checkout test, the two-worktree test, the `git pull --rebase` test, the read-only and no-Store-access runs, the quiet exits with no CLI, no Store, and no Make Docs install, and setup and removal beside a hook of another tool.
- PRD changes, each with a Requirement History entry: PRD 28 (the sentence about hooks and the Non-Requirements line, which the owner approved); PRD 30 R-ADMIT-1 only, with the exact words that the owner approves at owner gate OG-10; PRD 07 (new R-SETUP-CLI-15 and later, and `setup remove`); PRD 38 (new R-HOOK-STATE, the field register, and global config); and PRD 39 R-NAME-6 for the hook block.
- PRD 30 R-BOUND-1, R-BOUND-2, and R-ADMIT-4 do not change. The overview gives the reason for each. PRD 30 R-SELECT-1, the PRD 30 Acceptance Criteria line about default setup, and PRD 07 R-SETUP-CLI-10 change only if the owner chooses option B at OG-5.
- Agent form: the work store reference says what the hooks do and what an agent does when a hook prints its line. An agent installs no hook by hand.

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
- A git action leaves the work tree as git left it.
- Setup beside a hook of another tool keeps that tool's bytes, and `setup remove` restores the file byte for byte.
- A changed block is kept and reported.
- After the person clears the machine preference, the default answer of the offer is "no" again.
- PRD 30 R-ADMIT-1 holds the words that the owner approved at OG-10.
- `setup remove` in one worktree keeps the block while another bound checkout of the clone remains.

## Testing Decisions

- Automated Implementation Testing: required. The hook tests run on each platform through the fixed list of the platform workflow.
- Performance Testing: `not-needed-now`. `PERF-007` in P4 measured the hook run. The phase reruns only an affected check if the built block differs from the measured one.
- Guided Progress Review: selected. The owner sees the setup hook review and the removal report.
- Unassisted Goal Testing: `not-needed-now`.

## Dependencies

- P4.
- Owner gates OG-3 (only if it opened) and OG-4 for the first stage, OG-5 and OG-6 (only if it opened) for the setup stage, and OG-10 for the PRD stage.
- The P4 three-platform result.
- Merge risk with W22 in the setup flow and PRD 07. See the overview.
