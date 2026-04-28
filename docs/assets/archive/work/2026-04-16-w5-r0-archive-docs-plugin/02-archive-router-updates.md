# Phase 2: Archive Router Updates

> Derives from [Phase 2 of the plan](../../plans/2026-04-16-w5-r0-archive-docs-plugin/02-archive-router-updates.md).

## Purpose

Update the archive router files to include guide sub-directory mappings for archived guides.

## Overview

Add three guide archive sub-directories to the docs/.archive/ mapping in the template, then re-seed to dogfood. Two files updated in the template (AGENTS.md/CLAUDE.md pair), two re-seeded.

## Source Plan Phases

- [02-archive-router-updates.md](../../plans/2026-04-16-w5-r0-archive-docs-plugin/02-archive-router-updates.md)

## Stage 1 — Update template archive routers

### Tasks

1. Add guide sub-directories to `packages/docs/template/docs/.archive/AGENTS.md` after the existing `prds/` mapping.
2. Add the same guide sub-directories to `packages/docs/template/docs/.archive/CLAUDE.md` after the existing `prds/` mapping.
3. The new entries to add after the existing `prds/` mapping:
   - `docs/.archive/guides/agent/` — archived agent session guides.
   - `docs/.archive/guides/developer/` — archived developer guides.
   - `docs/.archive/guides/user/` — archived user guides.
4. Verify both files remain byte-identical.

### Acceptance criteria

- [x] `packages/docs/template/docs/.archive/AGENTS.md` contains three new `docs/.archive/guides/` sub-directory entries.
- [x] `packages/docs/template/docs/.archive/CLAUDE.md` contains three new `docs/.archive/guides/` sub-directory entries.
- [x] Both template files are byte-identical (`diff --brief` returns nothing).
- [x] New mappings present after existing `prds/` entry.

### Dependencies

- None (no file overlap with other phases).

## Stage 2 — Re-seed dogfood

### Tasks

1. Copy `packages/docs/template/docs/.archive/AGENTS.md` to `docs/.archive/AGENTS.md`.
2. Copy `packages/docs/template/docs/.archive/CLAUDE.md` to `docs/.archive/CLAUDE.md`.
3. Verify dogfood copies are byte-identical to their template counterparts.
4. Run `bash scripts/check-instruction-routers.sh`.

### Acceptance criteria

- [x] `docs/.archive/AGENTS.md` is byte-identical to `packages/docs/template/docs/.archive/AGENTS.md`.
- [x] `docs/.archive/CLAUDE.md` is byte-identical to `packages/docs/template/docs/.archive/CLAUDE.md`.
- [x] `bash scripts/check-instruction-routers.sh` passes (no router drift detected).
- [x] No other files are modified by this stage.

### Dependencies

- Stage 1 (template files must be updated before re-seeding).
