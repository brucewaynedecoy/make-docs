---
name: work-on-phase
description: Implement exactly one docs/work phase from explicit phase target to validation, closeout, history, and optional commit. Use when the agent needs single-phase implementation with coordinator-led delegation, risk-register checks, scope guardrails, closeout-phase handoff, and no wave continuation.
---

# Work On Phase

Use this skill to implement one explicit `docs/work/` phase. The target phase document is the source of truth for scope, tasks, dependencies, validation hints, and done-ness.

## Start Here

1. Read the nearest `AGENTS.md` or `CLAUDE.md`.
2. Require an explicit phase target. Accept a quoted coordinate such as `'W14 R2 P1'`, split coordinate tokens such as `W14 R2 P1`, or a direct `docs/work/.../01-*.md` phase path. If the user provides only `W14 R2`, a work directory, or no target, stop and ask for the exact phase.
3. Run [scripts/resolve_wave.py](./scripts/resolve_wave.py) to resolve the target phase, using `python3 scripts/resolve_wave.py 'W14 R2 P1' --json` in examples.
4. Run [scripts/phase_plan.py](./scripts/phase_plan.py) before delegating or editing.
5. Read [references/phase-implementation-workflow.md](./references/phase-implementation-workflow.md) for the single-phase lifecycle and gate rules.

## Operating Contract

- Default mode is `draft-only`: stop after validation, `closeout-phase`, and a commit-message draft unless the user explicitly asks to commit.
- In `draft-only`, externally visible tasks such as opening a PR, waiting for CI, merging, or pushing are documented handoffs unless the user explicitly changes the commit policy or authorizes the action.
- `commit-required` is opt-in: create one local phase commit after closeout.
- `commit-and-push` is opt-in: create one local phase commit and push it after closeout.
- Never advance to another phase.
- Create managed state lazily with [scripts/checkpoint.py](./scripts/checkpoint.py); state belongs under `.make-docs/runs/`, stores project-relative paths only, and must not be staged or committed.
- Use [scripts/scope_guard.py](./scripts/scope_guard.py) before closeout to detect edits outside the phase scope.
- Use [scripts/phase_gate.py](./scripts/phase_gate.py) before declaring the phase complete.

## Delegation

When subagents are available, keep the primary agent as coordinator for planning, worker assignment, integration, validation, scope review, closeout, and checkpoint updates. Delegate independent task clusters from the phase plan. Tell workers they are not alone in the codebase, must not revert others' edits, and must keep write scopes disjoint.

If subagents are unavailable, execute the same phase plan serially.

## Required Gates

1. Resolve the explicit phase from `docs/work/`.
2. Build the phase plan from backlog tasks, acceptance criteria, dependencies, and validation hints.
3. Check `docs/prd/03-open-questions-and-risk-register.md` when present. Ask the user before implementation only when an unresolved gap could materially change this phase and cannot be resolved from repo context.
4. Implement only the resolved phase scope.
5. Run validation from the phase plan and relevant repo contracts.
6. Run code review when code changed, then resolve or explicitly waive findings. Valid evidence is a delegated review summary, coordinator diff review, or a waiver with the reason.
7. Run `scope_guard.py` and handle scope drift before closeout.
8. Invoke `closeout-phase`; do not duplicate its workflow here.
9. Re-check the risk register after closeout. Close resolved items or add newly discovered gaps/drift in the existing register when present; otherwise capture them in the history entry.
10. Check phase completion with `phase_gate.py`.
11. Commit or push only when the selected commit policy requires it.

Prefer `jdocmunch` for docs and `jcodemunch` for code when available. If an index is missing or stale, reindex before falling back to direct reads.
