# Work Directory

This directory contains prescriptive work items, backlogs, and task lists.

## Purpose

Work documents are **prescriptive** — they describe what to do, not what exists. They contain phases, stages, task lists, acceptance criteria, dependency information, and PRD traceability. A backlog may cover the full active PRD namespace or a scoped delta.

## Naming Convention

Files must use the pattern: `YYYY-MM-DD-<slug>.md`

- Prefix with the creation date.
- The slug is lowercase with hyphens separating words.
- No special characters, spaces, or underscores.
- Examples: `2026-03-25-rebuild-backlog.md`, `2026-03-25-auth-hardening-delta-backlog.md`

If a backlog is too large for one file, migrate it to `YYYY-MM-DD-<slug>/` and create an index plus ordered phase files inside.

## Required Structure

Every work backlog must include:

- `## Purpose` — What work this backlog prescribes and why.
- dependency-ordered phase sections
- phase-level `Overview`
- phase-level `Source PRD Docs`
- one or more stages per phase
- stage-level `Tasks`
- stage-level `Acceptance criteria`
- stage-level `Dependencies`

There must be at least one phase in each work document and at least one stage per phase. Every phase must cite the PRD docs that authorize it. For delta backlogs, include the new change docs and the impacted baseline docs that still constrain implementation.

## Templates

Use the templates in `docs/.templates/` when creating work documents:

- `work-backlog.md` — Single-file backlog.
- `work-backlog-index.md` — Index for a split backlog.
- `work-backlog-phase.md` — Individual phase file for a split backlog.

## References

Before generating or validating work documents, consult these files in `docs/.references/`:

- `output-contract.md` — Required paths, section headings, and structural rules for work backlogs.
- `execution-workflow.md` — Step-by-step workflow that governs backlog generation during execution.
- `prd-change-management.md` — Use when the backlog is scoped to an additive change, enhancement, revision, or removal.

## Agent Instructions

- Use the appropriate template from `docs/.templates/` when creating new work documents.
- Validate required paths and headings against `docs/.references/output-contract.md`.
- Always apply the date-slug naming convention.
- Keep work out of `docs/prd/` — link backlog phases back to relevant PRD docs instead.
- Organize backlog phases by dependency order, not by implementation convenience.
- For additive changes, enhancements, revisions, or removals, prefer a dated delta backlog instead of rewriting a prior backlog.
