---
name: closeout-phase
description: Close out a completed work backlog phase. Use when the agent needs to verify unchecked acceptance criteria in a docs/work phase file, mark completed criteria, generate maintainer or developer guides when warranted, capture novel gaps, create a docs/assets/history entry, and draft a commit message from the repo convention.
---

# Closeout Phase

## Workflow

1. Resolve the target work backlog phase document under `docs/work/`.
2. Read [references/closeout-workflow.md](./references/closeout-workflow.md).
3. Follow the closeout gates in order:
   - acceptance criteria verification
   - developer guide decision
   - gap capture
   - history entry
   - commit message draft
4. Do not mark unchecked acceptance criteria complete unless evidence shows the work is complete and passing, or the user confirms the unchecked item is only stale documentation.
5. Do not create `docs/architecture/` or a standalone PRD risk register unless the target repo already uses that convention.
6. End with a concise summary of files changed, validation run, and the drafted commit message.

## Required Repo Context

Before writing, read the nearest applicable `AGENTS.md`/`CLAUDE.md` files and the target repo contracts for:

- work backlogs
- developer guides
- history records
- PRD or risk gap tracking, if present
- commit message convention, if present

Prefer `jdocmunch` and `jcodemunch` when available; reindex if stale before falling back to direct reads.
