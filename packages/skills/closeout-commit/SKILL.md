---
name: closeout-commit
description: Close out uncommitted changes before drafting a commit. Use when the agent needs to inspect staged or unstaged changes, capture novel gaps, create or update a docs/assets/archive/history entry, and draft a commit message from the repo convention without assuming there is a docs/work phase to close.
---

# Closeout Commit

## Delegation First

Before inspecting the working tree beyond minimal status, first attempt to spawn a worker agent to run this skill. If you are already the spawned worker for this skill invocation, do not spawn another worker; execute the workflow directly.

Use the active harness's native delegation mechanism when available: Codex `spawn_agent`, Claude Code `Task`, or any other exposed agent-spawn/subagent capability. Do not inspect closeout references, read broad repo docs, or perform change-set analysis in the primary agent before this attempt.

When spawning succeeds, the primary agent becomes coordinator only. Hand the worker a minimal, self-contained prompt containing:

- the user's request
- the current working directory
- the skill name and `packages/skills/closeout-commit/SKILL.md` path
- the requested change-set scope if the user specified staged, unstaged, or full working tree
- the required output contract: files changed, validation run, gap/history decisions, approvals needed, blockers, and drafted commit message

The worker must read this skill and its referenced resources in its own context. Before broad repo analysis, it must run [scripts/closeout_probe.py](./scripts/closeout_probe.py) and use the JSON as the context boundary for change discovery, contract locations, candidate coordinates, risk/history hints, and validation hints. It must use [scripts/closeout_validate.py](./scripts/closeout_validate.py) for validation selection and may use [scripts/closeout_history.py](./scripts/closeout_history.py) to draft a history skeleton. The worker must prefer `jdocmunch` and `jcodemunch` first for any follow-up reads, reindex if stale, and only fall back to direct file reads after reindexing does not work. The worker owns change discovery, gap capture, history entry decisions, commit convention lookup, validation summary, and commit-message drafting.

When spawning is unsupported or the spawn attempt fails, state that delegation is unavailable or failed, include the short reason, and continue by executing this skill directly.

## Workflow

1. Inspect `git status --short` and determine whether the user is asking about staged changes, unstaged changes, or the full working tree.
2. Run [scripts/closeout_probe.py](./scripts/closeout_probe.py) with the selected scope before inspecting broad diffs or reference docs manually.
3. Read [references/closeout-commit-workflow.md](./references/closeout-commit-workflow.md), using the probe output to limit follow-up reads to relevant files and unresolved questions.
4. Follow the closeout gates in order:
   - change set discovery
   - gap capture
   - history entry
   - commit message convention resolution
   - commit message draft
5. Draft the commit message only. Do not stage files or create the commit unless the user explicitly asks.
6. Use `$closeout-phase` only when the change set includes a specific `docs/work/` phase with unchecked task items, or the user explicitly asks to close out a phase. Do not inspect developer or user guides for ordinary commit closeout unless a phase is in scope or the user explicitly asks for guide work.
7. End with a concise summary of files changed, validation run, gap/history decisions, and the drafted commit message.

## Required Repo Context

Before writing, read the nearest applicable `AGENTS.md`/`CLAUDE.md` files and the target repo contracts for:

- history records
- PRD or risk gap tracking, if present
- commit message convention, if present
- work backlog phase closeout, only when a phase is in scope

Prefer `jdocmunch` and `jcodemunch` when available; reindex if stale before falling back to direct reads.
