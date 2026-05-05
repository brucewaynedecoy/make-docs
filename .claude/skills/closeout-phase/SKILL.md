---
name: closeout-phase
description: Close out a completed work backlog phase. Use when the agent needs to verify unchecked acceptance criteria in a docs/work phase file, mark completed criteria, generate or update developer and/or user guides when warranted, capture novel gaps, create a docs/assets/history entry, and draft a commit message from the repo convention.
---

# Closeout Phase

## Delegation First

Before reading the target phase or closeout reference workflow, first attempt to spawn a worker agent to run this skill. If you are already the spawned worker for this skill invocation, do not spawn another worker; execute the workflow directly.

Use the active harness's native delegation mechanism when available: Codex `spawn_agent`, Claude Code `Task`, or any other exposed agent-spawn/subagent capability. Do not inspect closeout references, read broad repo docs, or perform phase evidence analysis in the primary agent before this attempt.

When spawning succeeds, the primary agent becomes coordinator only. Hand the worker a minimal, self-contained prompt containing:

- the user's request
- the current working directory
- the skill name and `packages/skills/closeout-phase/SKILL.md` path
- the target `docs/work/` phase path when the user provided one, or instructions to resolve it
- the required output contract: files changed, validation run, acceptance criteria decisions, guide/gap/history decisions, approvals needed, blockers, and drafted commit message

The worker must read this skill and its referenced resources in its own context, prefer `jdocmunch` and `jcodemunch` first, reindex if stale, and only fall back to direct file reads after reindexing does not work. The worker owns acceptance evidence review, guide coverage, gap capture, history entry decisions, validation summary, and commit-message drafting.

When spawning is unsupported or the spawn attempt fails, state that delegation is unavailable or failed, include the short reason, and continue by executing this skill directly.

## Workflow

1. Resolve the target work backlog phase document under `docs/work/`.
2. Read [references/closeout-workflow.md](./references/closeout-workflow.md).
3. Follow the closeout gates in order:
   - acceptance criteria verification
   - guide coverage decision
   - gap capture
   - history entry
   - commit message draft
4. Do not mark unchecked acceptance criteria complete unless evidence shows the work is complete and passing, or the user confirms the unchecked item is only stale documentation.
5. Do not create `docs/architecture/` or a standalone PRD risk register unless the target repo already uses that convention.
6. End with a concise summary of files changed, validation run, and the drafted commit message.

## Required Repo Context

Before writing, read the nearest applicable `AGENTS.md`/`CLAUDE.md` files and the target repo contracts for:

- work backlogs
- developer and user guides
- history records
- PRD or risk gap tracking, if present
- commit message convention, if present

Prefer `jdocmunch` and `jcodemunch` when available; reindex if stale before falling back to direct reads.
