---
title: "W35 R0 P4 Git Hook Proofs"
kind: "plan"
status: "draft"
coordinate: "W35 R0 P4"
source:
  type: "design"
  path: "docs/designs/2026-11-27-agent-checkpoints-and-triggers.md"
---

# W35 R0 P4 Git Hook Proofs

## Purpose

Settle every open fact about git hooks before any hook is built. The design marks these items "the plan proves", "the plan finds out", or "the plan measures". This is the first part of the design's Phase 2. It builds no product behavior.

## Outcome

A recorded answer for each question below, on each platform that the project supports, a recorded answer to whether gate OG-3 opens, and the owner's answer at gate OG-4. P5 builds from these answers.

## Scope

Each item is one named task in the backlog.

- Git hook facts on each platform. Tests in temporary repositories prove, on Linux, macOS, and Windows, each fact that the design checked with git 2.47.1: `post-merge` runs for `git pull` with a merge; `git pull --rebase` with no local commits runs `post-merge`; with local commits it runs `post-checkout`, `post-commit`, and `post-rewrite`, and not `post-merge`; an amended commit runs `post-rewrite` and `post-commit`; the rebase folder is still there when `post-rewrite` runs; `MERGE_HEAD` is still there when `post-merge` runs after a true merge; `post-checkout` also runs for a file checkout (third argument 0), for `git worktree add`, and for a clone. The tests record the git version of each runner. The backlog splits these facts into three tasks: the pull facts, the commit and state facts, and the facts of the hook after a checkout.
- The platform test list. `.github/workflows/platform-safety.yml` runs the full CLI test suite on Linux only. Its jobs `platform-contract` and `installed-package` run a fixed list of test files on Linux, macOS, and Windows. One task adds the hook proof test files of this phase to both lists. The workflow starts only on a pull request or a manual start, so the three-platform result comes after the reviewed phase commit is pushed. The orchestrator starts the run through the pull request (standing rule 12).
- Linked worktrees. Prove that `git rev-parse --git-path hooks` in a linked worktree returns the hooks folder of the main checkout, and that one hook file runs for every worktree of the clone.
- `core.hooksPath`. Prove how setup detects a hooks path for the repository and for the whole machine, and what a hook manager's hook file looks like, so that P5 can refuse with a clear reason.
- How a hook finds the `make-docs` command when it is not on PATH. Git runs a hook with the environment of the git process, and an app that starts git can pass a short PATH. The task tries the candidates, such as a PATH lookup alone, or a PATH lookup and then a path that setup recorded in the block, on each platform, with the installs that the project supports. It records the choice. A hook that finds no command does nothing and exits 0.
- A hook script on Windows. git on Windows is expected to run a hook through the shell that it ships. Prove which shell runs a hook file there, that the block runs in it, what PATH the hook sees, and that the hook finds the `make-docs` command there with each supported install method.
- The rule for git in the middle of an action. Prove how a hook after a commit or a branch change detects a rebase, a merge, a cherry-pick, or a bisect, and that the hooks after a merge and after a rewrite still run the checkpoint when git shows its merge or rebase state.
- Whether a hook that an agent's commit starts passes that agent tool's Store access rules. Run a commit from each first-party agent tool, with a temporary Store, and record what the hook's checkpoint may do: write, read only, or nothing. Standing rule 11 says who starts each session. A tool with no run is recorded as "no proof gathered".
- Whether the clone-owned hook record needs a Store schema change. Check whether an existing record can hold the exact hook block for the clone's shared git folder, across worktrees, with drift detection and exact removal. If none fits, stop at owner gate OG-3 before any schema work.
- Foreground run against start-and-return. Write `PERF-007` before any measurement, reuse the `PERF-004` method, and measure a commit, a merge, a rewrite, and a branch change with a hook that runs the checkpoint each way, with no change and with one changed work file, and for a trigger run that is the first sync of a checkout. Then ask the owner at gate OG-4, with the measured times and one recommendation.
- The two-worktree behavior of the checkpoint itself, with no hook: a direct run in one worktree, then a direct run in a worktree on another branch. Record what the store holds and what each worktree reports.
- Register: a risk for `git pull --rebase` with its covered and open cases, and one entry for each platform gap.

## Exclusions

- No setup change, no hook install, and no Store record. P5 owns them.
- No Store schema change. A needed change stops at OG-3.

## Acceptance

- Both test lists of the platform workflow hold the hook proof test files.
- Each git fact has a test result on each of the three platforms, from a pull request run or a manual run, or a named gap.
- The command lookup has one recorded choice with its proof on each platform. The Windows proof runs in the shell that runs hooks there.
- The record question has one recorded answer: an existing record fits, or OG-3 is open with the reason.
- `PERF-007` has a recorded result, and OG-4 has the owner's answer.
- The access runs name what each agent tool allowed and who started each session.

## Testing Decisions

- Automated Implementation Testing: required. The proof tests stay in the suite, so a new git version that changes a fact fails a test.
- Performance Testing: selected, `PERF-007`, `characterize-now`, informational.
- Guided Progress Review: `not-needed-now`. The owner gates carry the choices.
- Unassisted Goal Testing: `not-needed-now`.

## Dependencies

- P1, for the checkpoint and its `--event` input.
- No owner gate blocks this phase. Owner gates OG-3 (only if no record fits) and OG-4 block P5, not P4. This phase finds whether OG-3 opens, and it brings OG-4 to the owner with the `PERF-007` times.
- A pull request for the three-platform run. The orchestrator opens it. The order is the phase commit, the push, the pull request run, then one evidence commit (standing rule 12).
