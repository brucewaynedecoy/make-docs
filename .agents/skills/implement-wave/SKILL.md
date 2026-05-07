---
name: implement-wave
description: Implement docs/work backlog waves or phases end to end. Use when the agent needs to resolve a wave or phase coordinate, plan implementation from work backlog tasks, preserve scope, checkpoint progress, validate work, run code review when code changed, invoke closeout-phase, and finish each phase with a commit by default while remaining compatible with Codex /goal.
---

# Implement Wave

Use this skill to execute a `docs/work/` wave or phase from backlog to verified closeout. The work backlog is the source of truth for scope and done-ness.

## Start Here

1. Read the nearest `AGENTS.md` or `CLAUDE.md`.
2. Resolve the target with [scripts/resolve_wave.py](./scripts/resolve_wave.py). Accept wave coordinates such as `W14 R2`, phase coordinates such as `W14 R2 P1`, or direct `docs/work/...` paths.
3. Run [scripts/wave_status.py](./scripts/wave_status.py) to see completed phases, incomplete phases, the next phase, and any existing `.make-docs/runs/` state.
4. Run [scripts/phase_plan.py](./scripts/phase_plan.py) for the current phase before delegating or editing.
5. Read [references/wave-implementation-workflow.md](./references/wave-implementation-workflow.md) for the detailed lifecycle and gate rules.

## Operating Contract

- Default mode is `commit-required`: each completed phase ends in its own local commit before advancing.
- `draft-only` is opt-in: stop after closeout and commit-message draft.
- `commit-and-push` is opt-in: require commit and successful push before advancing.
- Create managed state lazily with [scripts/checkpoint.py](./scripts/checkpoint.py); state belongs under `.make-docs/runs/` and must not be added to templates.
- Use [scripts/scope_guard.py](./scripts/scope_guard.py) before closeout to detect edits outside the phase scope.
- Use [scripts/phase_gate.py](./scripts/phase_gate.py) before declaring a phase complete or moving to another phase.

## Delegation

When subagents are available, keep the primary agent as coordinator for planning, integration, validation, scope review, closeout, and checkpoint updates. Delegate independent stage or task clusters from the phase plan. Tell workers they are not alone in the codebase, must not revert others' edits, and must keep their write scopes disjoint.

If subagents are unavailable, execute the same phase plan serially.

## Required Gates

For each phase:

1. Resolve the phase from `docs/work/`.
2. Build the phase plan from backlog tasks, acceptance criteria, dependencies, and validation hints.
3. Implement only the approved phase scope.
4. Run validation from the phase plan and relevant repo contracts.
5. Run code review when code changed, then resolve or explicitly waive findings.
6. Invoke `closeout-phase`; do not duplicate its workflow here.
7. Check phase completion with `phase_gate.py`.
8. Commit the phase unless running in `draft-only`; push only in `commit-and-push`.
9. Refresh status and continue only when the gate passes.

Prefer `jdocmunch` for docs and `jcodemunch` for code when available. If an index is missing or stale, reindex before falling back to direct reads.
