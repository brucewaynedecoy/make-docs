# Phase 2: Template Resource Tree

> Derives from [Phase 2 of the plan](../../plans/2026-04-22-w9-r1-docs-assets-resource-namespace/02-template-resource-tree.md).

## Purpose

Move the shippable docs template from multiple hidden resource roots to one visible resource tree at `packages/docs/template/docs/assets/`.

## Overview

This phase changes the checked-in template tree. It should move document resources only. The template must not include `.make-docs/` because `.make-docs/` is runtime state created in the install target, not a shippable docs resource.

## Source PRD Docs

None. This backlog is derived from the W9 R1 plan and design, not from an active PRD namespace.

## Source Plan Phases

- [Phase 2 - Template Resource Tree](../../plans/2026-04-22-w9-r1-docs-assets-resource-namespace/02-template-resource-tree.md)

## Stage 1: Create the Template Assets Tree

### Tasks

- [x] Create `packages/docs/template/docs/assets/`.
- [x] Move `packages/docs/template/docs/.archive/` to `packages/docs/template/docs/assets/archive/`.
- [x] Move `packages/docs/template/docs/.assets/history/` to `packages/docs/template/docs/assets/history/`.
- [x] Move `packages/docs/template/docs/.prompts/` to `packages/docs/template/docs/assets/prompts/`.
- [x] Move `packages/docs/template/docs/.references/` to `packages/docs/template/docs/assets/references/`.
- [x] Move `packages/docs/template/docs/.templates/` to `packages/docs/template/docs/assets/templates/`.
- [x] Move `packages/docs/template/docs/.assets/AGENTS.md` and `packages/docs/template/docs/.assets/CLAUDE.md` to `packages/docs/template/docs/assets/`.
- [x] Remove template `docs/.assets/config/` content instead of moving it under `docs/assets/`.

### Acceptance criteria

- [x] `packages/docs/template/docs/assets/` contains `archive/`, `history/`, `prompts/`, `references/`, and `templates/`.
- [x] `packages/docs/template/docs/assets/AGENTS.md` and `packages/docs/template/docs/assets/CLAUDE.md` exist when the template needs an assets-level router.
- [x] No `manifest.json`, `conflicts/`, `state/`, or `config/` child exists under `packages/docs/template/docs/assets/`.
- [x] No template `.make-docs/` directory is checked in.

### Dependencies

- Phase 1 path contract and router wording.

## Stage 2: Repair Template Links and Routers

### Tasks

- [x] Update template root router files that mention support resources so they point to `docs/assets/`.
- [x] Update child resource routers for archive, history, prompts, references, and templates.
- [x] Update template references to workflow docs, templates, and prompts after the physical moves.
- [x] Remove stale references to the old template resource roots from active template files.

### Acceptance criteria

- [x] Template routers use `docs/assets/archive/`, `docs/assets/history/`, `docs/assets/prompts/`, `docs/assets/references/`, and `docs/assets/templates/`.
- [x] Template links resolve after the move.
- [x] Template source does not route state to `docs/assets/`.

### Dependencies

- Stage 1 physical moves should land first or in the same change.

## Stage 3: Remove Retired Template Roots

### Tasks

- [x] Remove empty retired template roots after content is moved.
- [x] Confirm no active files remain under `packages/docs/template/docs/.archive/`, `.assets/`, `.prompts/`, `.references/`, `.templates/`, or `.resources/`.
- [x] Preserve any user-authored or generated content discovered during the move by relocating it to the correct resource child or escalating it before deletion.

### Acceptance criteria

- [x] Retired template resource roots are absent.
- [x] The checked-in template tree contains one support-resource root: `packages/docs/template/docs/assets/`.
- [x] Any old-path matches in the template are historical or negative context only.

## Completion Notes

- Completed on 2026-04-22.
- Moved the shippable template resource families under `packages/docs/template/docs/assets/`.
- Removed the template `docs/.assets/config/` router because CLI state is root `.make-docs/` runtime state, not a shippable docs asset.
- Repaired active template routers and support-resource references to use `docs/assets/` paths.

### Dependencies

- Stages 1 and 2.
