# Phase 4: Dogfood Docs Migration

> Derives from [Phase 4 of the plan](../../plans/2026-04-22-w9-r1-docs-assets-resource-namespace/04-dogfood-docs-migration.md).

## Purpose

Apply the finalized resource namespace and root state model to this repository's own `docs/` tree.

## Overview

This phase dogfoods the same structure shipped by the template. It moves this repository's reusable docs resources to `docs/assets/`, moves current dogfood CLI state to root `.make-docs/`, and removes active references to retired paths.

## Source PRD Docs

None. This backlog is derived from the W9 R1 plan and design, not from an active PRD namespace.

## Source Plan Phases

- [Phase 4 - Dogfood Docs Migration](../../plans/2026-04-22-w9-r1-docs-assets-resource-namespace/04-dogfood-docs-migration.md)

## Stage 1: Move Dogfood Resource Directories

### Tasks

- [ ] Create `docs/assets/`.
- [ ] Move `docs/.archive/` to `docs/assets/archive/`.
- [ ] Move `docs/.assets/history/` to `docs/assets/history/`.
- [ ] Move `docs/.prompts/` to `docs/assets/prompts/`.
- [ ] Move `docs/.references/` to `docs/assets/references/`.
- [ ] Move `docs/.templates/` to `docs/assets/templates/`.
- [ ] Move docs assets router files from `docs/.assets/` to `docs/assets/` when those routers remain active.
- [ ] Preserve any user-authored content discovered under retired resource paths.

### Acceptance criteria

- [ ] `docs/assets/` contains `archive/`, `history/`, `prompts/`, `references/`, and `templates/`.
- [ ] Active dogfood resource files are no longer stored under retired hidden resource directories.
- [ ] `docs/assets/` does not contain CLI state.

### Dependencies

- Phases 1 through 3 should be complete so the repository tree matches the template and CLI behavior.

## Stage 2: Move Dogfood CLI State

### Tasks

- [ ] Move `docs/.assets/config/manifest.json` to `.make-docs/manifest.json` if the dogfood manifest exists.
- [ ] Move `docs/.assets/config/conflicts/` to `.make-docs/conflicts/` if conflict staging exists.
- [ ] Remove `docs/.assets/config/` after state is moved and no user-authored content remains.
- [ ] Do not create `docs/assets/config/`, `docs/assets/state/`, `docs/assets/manifest.json`, `docs/assets/conflicts/`, or `docs/.make-docs/`.

### Acceptance criteria

- [ ] Dogfood CLI state lives at root `.make-docs/`.
- [ ] `.make-docs/manifest.json` exists when the repository has dogfood manifest state to preserve.
- [ ] `.make-docs/conflicts/` exists only when there are conflicts to preserve or future runs create it.
- [ ] No manifest, conflicts, state, or config path exists under `docs/assets/`.

### Dependencies

- Stage 1 can move resources independently, but final cleanup should happen after state migration.

## Stage 3: Update Active Dogfood References

### Tasks

- [ ] Update `docs/AGENTS.md`, `docs/CLAUDE.md`, active guides, active references, templates, prompts, and archive/history routers to the new paths.
- [ ] Update repository READMEs and package docs that mention docs resource paths or CLI state paths.
- [ ] Update skill assets and generated workflow instructions that mention archive, history, references, templates, prompts, manifest, or conflicts paths.
- [ ] Keep historical designs, plans, work backlogs, and history records intact when old paths are describing prior behavior.

### Acceptance criteria

- [ ] Active dogfood docs route support resources through `docs/assets/`.
- [ ] Active dogfood docs route CLI state through `.make-docs/`.
- [ ] Old-path references that remain are historical, negative, or explicitly retired-path context.

### Dependencies

- Stage 1 and Stage 2 moves.

## Stage 4: Remove Retired Dogfood Directories

### Tasks

- [ ] Remove empty `docs/.archive/`, `docs/.assets/`, `docs/.prompts/`, `docs/.references/`, `docs/.templates/`, and `docs/.resources/` paths after content and references are migrated.
- [ ] Confirm no active file remains in a retired hidden resource directory.
- [ ] Confirm no root `docs/.make-docs/` directory was introduced.

### Acceptance criteria

- [ ] `docs/assets/` is the only active support-resource namespace inside this repository's `docs/` tree.
- [ ] Root `.make-docs/` is the only active make-docs runtime state namespace.
- [ ] Retired dogfood directories are absent unless a historical artifact intentionally preserves them as text only.

### Dependencies

- Stages 1 through 3.

