---
name: closeout-phase
description: Close out a completed work backlog phase. Use when the agent needs to verify unchecked task items in a docs/work phase file, mark completed tasks, use acceptance criteria as evidence, generate or update developer and/or user guides when warranted, capture novel gaps, create a docs/assets/history entry, and draft a commit message from the repo convention.
---

# Closeout Phase

## Delegation First

Before reading the target phase or closeout reference workflow, first attempt to spawn a worker agent to run this skill. If you are already the spawned worker for this skill invocation, do not spawn another worker; execute the workflow directly.

Use the active harness's native delegation mechanism when available: Codex `spawn_agent`, Claude Code `Task`, or any other exposed agent-spawn/subagent capability. Do not inspect closeout references, read broad repo docs, or perform phase evidence analysis in the primary agent before this attempt.

If the active harness policy only permits subagents after the user explicitly asks for them, and the user did not do so for this turn, skip the spawn attempt. State that delegation is unavailable under the harness policy and continue by executing this skill directly.

When spawning succeeds, the primary agent becomes coordinator only. Hand the worker a minimal, self-contained prompt containing:

- the user's request
- the current working directory
- the skill name and `packages/skills/closeout-phase/SKILL.md` path
- the target `docs/work/` phase path when the user provided one, or instructions to resolve it
- the required output contract: files changed, validation run, task completion decisions, guide/gap/history decisions, approvals needed, blockers, and drafted commit message

The worker must read this skill and its referenced resources in its own context. Before broad repo analysis, it must run [scripts/work_phase_state.py](./scripts/work_phase_state.py) for the target phase, [scripts/closeout_probe.py](./scripts/closeout_probe.py) for changed files and repo contracts, and [scripts/guide_coverage_probe.py](./scripts/guide_coverage_probe.py) before opening guide files. The guide probe uses [scripts/persona_schema.py](./scripts/persona_schema.py) for configured persona defaults and frontmatter validation. It must use the JSON outputs as the context boundary and only read files identified as relevant or unresolved. It must use [scripts/closeout_validate.py](./scripts/closeout_validate.py) for validation selection and may use [scripts/closeout_history.py](./scripts/closeout_history.py) to draft a history skeleton. The worker must prefer `jdocmunch` and `jcodemunch` first for follow-up reads, reindex if stale, and only fall back to direct file reads after reindexing does not work. The worker owns task evidence review, guide coverage, gap capture, history entry decisions, validation summary, and commit-message drafting.

When spawning is unsupported or the spawn attempt fails, state that delegation is unavailable or failed, include the short reason, and continue by executing this skill directly.

For long closeouts, emit concise progress updates as each boundary completes: probe complete, task decisions complete, guide/gap decision complete, validation selected or run, and final closeout summary.

## Workflow

1. Resolve the target work backlog phase document under `docs/work/`.
2. Run [scripts/work_phase_state.py](./scripts/work_phase_state.py) on the target phase before manually reading phase details.
3. Run [scripts/closeout_probe.py](./scripts/closeout_probe.py) for changed files, contracts, candidate coordinates, risk/history hints, and validation hints.
4. Run [scripts/guide_coverage_probe.py](./scripts/guide_coverage_probe.py) before opening guide files.
5. Read [references/closeout-workflow.md](./references/closeout-workflow.md), using the probe outputs to limit follow-up reads to relevant files and unresolved questions.
6. Follow the closeout gates in order:
   - task completion verification
   - guide coverage decision
   - gap capture
   - history entry
   - commit message draft
7. Do not mark unchecked task items complete unless evidence shows the work is complete and passing, or the user confirms the unchecked item is only stale documentation. Use acceptance criteria as evidence, not as checkboxes to mark.
8. Do not create `docs/architecture/` or a standalone PRD risk register unless the target repo already uses that convention.
9. Treat externally visible tasks such as opening a PR, waiting for CI, merging, or pushing as documented handoffs unless the user explicitly authorizes that action in the active turn.
10. End with a concise summary of files changed, validation run, task decisions, guide/gap decisions, and the drafted commit message.

## Required Repo Context

Before writing, read the nearest applicable `AGENTS.md`/`CLAUDE.md` files and the target repo contracts for:

- work backlogs
- developer and user guides
- history records
- PRD or risk gap tracking, if present
- commit message convention, if present

Prefer `jdocmunch` and `jcodemunch` when available; reindex if stale before falling back to direct reads.
