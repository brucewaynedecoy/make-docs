# Phase Implementation Workflow

## Purpose

This workflow turns one explicit `docs/work/` phase into a controlled implementation loop. It is narrower than `work-on-wave`: it never chooses the next incomplete phase and never continues after the resolved phase is closed.

## Preflight

Run these before implementation:

1. `make-docs operations wave-resolve 'Wn Rn Pn' --json`
2. `make-docs operations phase-plan 'Wn Rn Pn'`
3. `make-docs operations checkpoint 'Wn Rn Pn' --mode phase --commit-policy draft-only`

Confirm `closeout-phase` is installed or available in the repo package tree. If it is missing, stop and ask the user to install/select `closeout-phase`.

## Target Rules

- `Wn Rn Pn`: valid.
- Split tokens such as `Wn Rn Pn`: valid for helper scripts, but examples should quote the coordinate as one shell argument.
- Direct phase file path under `docs/work/`: valid.
- `Wn Rn`, `docs/work/<wave-dir>/`, or omitted target: invalid. Stop and ask the user for the exact phase.

## Phase Lifecycle

1. Read the phase plan output and identify serial dependencies before parallel work.
2. Inspect the active PRD risk register when `docs/prd/03-open-questions-and-risk-register.md` exists.
3. Ask the user pre-implementation only for unresolved risk-register items or gaps that can materially change the phase and are not answerable from repo context.
4. Delegate only independent task clusters with disjoint write scopes.
5. After implementation, run the validation commands listed in the phase plan plus any repo-required checks.
6. If code changed, run code review and resolve every finding or record an explicit waiver. Valid evidence is a delegated review summary, coordinator diff review, or a waiver with the reason.
7. Run `make-docs operations scope-guard TARGET` to identify changed files outside declared phase scope.
8. Run `closeout-phase` for task verification, guide coverage, gap capture, history, and commit-message drafting.
9. Re-check the risk register. Close resolved items or add newly discovered gaps/drift in the existing register; if no register exists, capture novel gaps in the history entry.
10. Run `make-docs operations phase-gate TARGET`; do not declare the phase complete while it reports blockers.
11. In `draft-only`, stop after the commit-message draft and document PR/CI/merge/push tasks as handoffs. In `commit-required`, create one local phase commit. In `commit-and-push`, commit and push once.

## Commit Policy

- `draft-only`: default. Validation and closeout must pass, but no commit is created.
- `commit-required`: opt-in. One local phase commit is required before final completion.
- `commit-and-push`: opt-in. One local phase commit and successful push are required before final completion.

## State

Managed state lives in `.make-docs/runs/<wave-slug>/state.json`. This is local resume state: do not stage or commit it. State files must store project-relative paths only; never serialize absolute checkout paths, home directories, or machine-specific temporary paths. Store compact facts only:

- target and resolved phase path
- commit policy
- validation status
- review status
- closeout status
- commit SHA when committed
- push status when pushed
- next action

State is a resume aid, not a source of truth. The target `docs/work/` phase remains authoritative for task completion.

## Failure Handling

- Missing or ambiguous phase target: stop and ask for the exact `Wn Rn Pn` or phase file path.
- Missing `closeout-phase`: stop before implementation.
- Phase-blocking risk-register gap: ask the user before implementation.
- Scope guard warnings: inspect before closeout; either fix scope drift or record an explicit user-approved scope change.
- Failed validation: fix and rerun validation before checkpointing the phase as validated.
- Review findings: resolve or record an explicit waiver before closeout.
- Unchecked tasks: do not mark complete without evidence or explicit stale-doc confirmation.
- Missing commit in `commit-required`: do not declare the phase complete.
