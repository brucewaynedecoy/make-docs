# Phase 3: Onboarding, Concepts, and Workflows

> Derives from [Phase 3 of the plan](../../plans/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/03-onboarding-concepts-and-workflows.md).

## Purpose

Deliver the Bundle A guide set for onboarding, concepts, workflows, and any companion developer workflow guides assigned by the delivery map. This phase updates current entry-point guides first and creates new files only where the finalized map says coverage is missing.

## Overview

This bundle owns the reader's first-stop docs: how to get started, how to reason about the system, and how to choose the right route or workflow. Historical wave documents remain evidence, but the guides written here must read as current-state guidance rather than timeline narration.

## Source PRD Docs

- [../../prd/01-product-overview.md](../../prd/01-product-overview.md)
- [../../prd/02-architecture-overview.md](../../prd/02-architecture-overview.md)
- [../../prd/04-glossary.md](../../prd/04-glossary.md)
- [../../prd/05-installation-profile-and-manifest-lifecycle.md](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [../../prd/07-cli-command-surface-and-lifecycle.md](../../prd/07-cli-command-surface-and-lifecycle.md)

## Source Plan Phases

- [03-onboarding-concepts-and-workflows.md](../../plans/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/03-onboarding-concepts-and-workflows.md)

## Stage 1 - Refresh the onboarding entry points

### Tasks

1. Review the guide delivery map rows assigned to onboarding and confirm whether each is an update, create, or link-only decision.
2. Update `docs/guides/user/getting-started-installing-make-docs.md` when the map assigns it to this bundle.
3. Create new `docs/guides/user/getting-started-*.md` files only where the map calls for uncovered onboarding content.
4. Ensure every new guide created in this stage uses `status: draft` and current `related` links to companion user or developer guides.

### Acceptance criteria

- [ ] Existing onboarding guides are reused before new ones are created.
- [ ] Every new onboarding guide has `status: draft`.
- [ ] Onboarding guides explain current entry paths and not historical rollout order.

### Dependencies

- Phase 2 guide delivery map.

## Stage 2 - Update user concepts and workflow guides

### Tasks

1. Update `docs/guides/user/concepts-wave-revision-phase-coordinates.md` when the map keeps coordinate concepts in the user library.
2. Update `docs/guides/user/workflows-how-make-docs-stages-fit-together.md` and `docs/guides/user/workflows-choosing-the-right-route-for-your-project.md` when assigned by the delivery map.
3. Create new `docs/guides/user/concepts-*.md` or `docs/guides/user/workflows-*.md` files only where the map says current coverage is materially missing.
4. Implement `link-only` decisions inside broader concept or workflow guides instead of spinning up thin standalones.
5. Add `related` links to adjacent workflow, onboarding, CLI, or authority docs wherever the final targets are already known.

### Acceptance criteria

- [ ] Updated concept and workflow guides stay within the `concepts-*` and `workflows-*` families.
- [ ] Guide bodies present current behavior and mental models rather than changelog prose.
- [ ] `link-only` rows are absorbed into broader guides instead of producing unnecessary new files.

### Dependencies

- Stage 1 - Refresh the onboarding entry points.

## Stage 3 - Update developer workflow companions and prepare the bundle handoff

### Tasks

1. Update `docs/guides/developer/development-workflows-stage-model-and-artifact-relationships.md` and `docs/guides/developer/development-workflows-choosing-the-right-route.md` if the delivery map assigns them to this bundle.
2. Keep edits within the allowed path families: `getting-started`, `concepts`, `workflows`, and `development/workflows`.
3. Add companion-audience `related` links where one workflow needs both user and developer views.
4. Produce the structured bundle handoff: files changed, ledger rows satisfied, evidence used, unresolved questions, and links added or deferred to Phase 6.

### Acceptance criteria

- [ ] All modified files remain within Bundle A path families.
- [ ] Companion workflow guides link across audiences where appropriate.
- [ ] The bundle handoff is complete enough for Phase 6 traceability and assembly work.

### Dependencies

- Stage 2 - Update user concepts and workflow guides.
