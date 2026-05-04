---
name: closeout-commit
description: Close out uncommitted changes before drafting a commit. Use when the agent needs to inspect staged or unstaged changes, capture novel gaps, create or update a docs/assets/history entry, and draft a commit message from the repo convention without assuming there is a docs/work phase to close.
---

# Closeout Commit

## Workflow

1. Inspect `git status --short` and determine whether the user is asking about staged changes, unstaged changes, or the full working tree.
2. Read [references/closeout-commit-workflow.md](./references/closeout-commit-workflow.md).
3. Follow the closeout gates in order:
   - change set discovery
   - gap capture
   - history entry
   - commit message convention resolution
   - commit message draft
4. Draft the commit message only. Do not stage files or create the commit unless the user explicitly asks.
5. Use `$closeout-phase` only when the change set includes a specific `docs/work/` phase with unchecked acceptance criteria, or the user explicitly asks to close out a phase.
6. End with a concise summary of files changed, validation run, gap/history decisions, and the drafted commit message.

## Required Repo Context

Before writing, read the nearest applicable `AGENTS.md`/`CLAUDE.md` files and the target repo contracts for:

- history records
- PRD or risk gap tracking, if present
- commit message convention, if present
- work backlog phase closeout, only when a phase is in scope

Prefer `jdocmunch` and `jcodemunch` when available; reindex if stale before falling back to direct reads.
