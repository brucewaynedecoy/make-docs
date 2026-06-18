# Wave Implementation Workflow

## Purpose

This workflow turns a `docs/work/` wave into a controlled implementation loop. It is compatible with normal agent sessions and Codex `/goal`. `/goal` may provide persistence, but this skill owns the repo-aware process, state, and guardrails.

## Preflight

Run these before implementation:

1. `python3 scripts/resolve_wave.py 'Wn Rn' --json`
2. `python3 scripts/wave_status.py 'Wn Rn' --json`
3. `python3 scripts/phase_plan.py 'Wn Rn Pn'`
4. `python3 scripts/checkpoint.py 'Wn Rn Pn' --commit-policy commit-required`

Confirm `closeout-phase` is installed or available in the repo package tree. If it is missing, stop and ask the user to install/select `closeout-phase`.

## Target Modes

- Wave target: start with the first phase that has unchecked tasks. Continue phase by phase until no incomplete phases remain.
- Phase target: complete only that phase unless the user explicitly asks for full-wave continuation.
- Direct path target: treat a phase file as phase mode and a work directory as wave mode.

## Phase Lifecycle

1. Read the phase plan output and identify serial dependencies before parallel work.
2. Delegate only independent stages or task clusters with disjoint write scopes.
3. After implementation, run the validation commands listed in the phase plan plus any repo-required checks.
4. If code changed, run code review and resolve every finding or record an explicit waiver. Valid evidence is a delegated review summary, coordinator diff review, or a waiver with the reason.
5. Run `scope_guard.py` to identify changed files outside declared phase scope.
6. Run `closeout-phase` for task verification, guide coverage, gap capture, history, and commit-message drafting.
7. Run `phase_gate.py`; do not move forward while it reports blockers.
8. Commit the phase in `commit-required` or `commit-and-push` mode.
9. Push only when `commit-and-push` was selected by the user or invocation prompt.

## State

Managed state lives in `.make-docs/runs/<wave-slug>/state.json`. Create it lazily only when this skill runs. This is local resume state: do not stage or commit it. State files must store project-relative paths only; never serialize absolute checkout paths, home directories, or machine-specific temporary paths. Store compact facts only:

- target and resolved phase paths
- mode and commit policy
- phase status
- validation commands and status
- review status
- closeout status
- commit SHA
- push status
- next action

State is a resume aid, not a source of truth. `docs/work/` remains authoritative for task completion.

## Codex `/goal` Usage

Use a goal prompt that names the target and policy:

```text
Use the work-on-wave skill to complete W14 R2 end to end. Treat docs/work as the source of truth. Use commit-required mode. After each phase, validate, run code review if code changed, resolve findings, run closeout-phase, commit the phase, checkpoint state, then continue to the next incomplete phase until the wave is complete.
```

For `draft-only`:

```text
Use the work-on-wave skill for W14 R2 P1 in draft-only mode. Stop after validation, code review resolution, closeout-phase, and the commit-message draft. Treat PR, CI, merge, and push tasks as documented handoffs unless explicitly authorized.
```

For `commit-and-push`:

```text
Use the work-on-wave skill to complete W14 R2 in commit-and-push mode. Each phase must be committed and pushed before advancing.
```

## Failure Handling

- Missing wave or ambiguous coordinate: stop and report the candidate paths.
- Missing `closeout-phase`: stop before implementation.
- Scope guard warnings: inspect before closeout; either fix the scope drift or record an explicit user-approved scope change.
- Failed validation: fix and rerun validation before checkpointing the phase as validated.
- Review findings: resolve or record an explicit waiver before closeout.
- Unchecked tasks: do not mark complete without evidence or explicit stale-doc confirmation.
- Missing commit in `commit-required`: do not start the next phase.
