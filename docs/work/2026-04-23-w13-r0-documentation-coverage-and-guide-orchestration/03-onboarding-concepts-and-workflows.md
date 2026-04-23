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

- [x] Review the guide delivery map rows assigned to onboarding and confirm whether each is an update, create, or link-only decision.
- [x] Update `docs/guides/user/getting-started-installing-make-docs.md` when the map assigns it to this bundle.
- [x] Confirm no new `docs/guides/user/getting-started-*.md` files were required for uncovered onboarding content.
- [x] Confirm the stage output stayed within current guides and used current `related` links instead of adding new onboarding files.

### Acceptance criteria

- [x] Existing onboarding guides are reused before new ones are created.
- [x] No new onboarding guides were needed, so no additional `status: draft` files were introduced.
- [x] Onboarding guides explain current entry paths and not historical rollout order.

### Dependencies

- Phase 2 guide delivery map.

## Stage 2 - Update user concepts and workflow guides

### Tasks

- [x] Update `docs/guides/user/concepts-wave-revision-phase-coordinates.md` as assigned by the delivery map.
- [x] Update `docs/guides/user/workflows-how-make-docs-stages-fit-together.md` and `docs/guides/user/workflows-choosing-the-right-route-for-your-project.md`.
- [x] Confirm no new `docs/guides/user/concepts-*.md` or `docs/guides/user/workflows-*.md` files were required.
- [x] Implement `link-only` decisions inside the broader concept and workflow guides instead of creating thin standalones.
- [x] Add same-bundle `related` links and defer Phase 6 cross-bundle links where the handoff called for later assembly.

### Acceptance criteria

- [x] Updated concept and workflow guides stay within the `concepts-*` and `workflows-*` families.
- [x] Guide bodies present current behavior and mental models rather than changelog prose.
- [x] `link-only` rows are absorbed into broader guides instead of producing unnecessary new files.

### Dependencies

- Stage 1 - Refresh the onboarding entry points.

## Stage 3 - Update developer workflow companions and prepare the bundle handoff

### Tasks

- [x] Update `docs/guides/developer/development-workflows-stage-model-and-artifact-relationships.md` and `docs/guides/developer/development-workflows-choosing-the-right-route.md`.
- [x] Confirm all delivered edits stayed within the allowed path families: `getting-started`, `concepts`, `workflows`, and `development/workflows`.
- [x] Add or reinforce companion-audience `related` links where the workflow set needed both user and developer views.
- [x] Capture the structured bundle handoff: files changed, ledger rows satisfied, evidence used, unresolved questions, and links added or deferred to Phase 6.

### Acceptance criteria

- [x] All modified files remain within Bundle A path families.
- [x] Companion workflow guides link across audiences where appropriate.
- [x] The bundle handoff is complete enough for Phase 6 traceability and assembly work.

### Dependencies

- Stage 2 - Update user concepts and workflow guides.

## Implementation notes

- Phase 03 is complete from worker handoffs; the bundle reused existing guides, updated the assigned user and developer workflow coverage, and did not require new guide files.
- Same-bundle `related` links were added where finalized within Bundle A, while the explicitly deferred Phase 6 cross-bundle links remain deferred for later assembly.

### Structured handoff payload

**Files changed**

- `docs/guides/user/getting-started-installing-make-docs.md`
- `docs/guides/user/concepts-wave-revision-phase-coordinates.md`
- `docs/guides/user/workflows-how-make-docs-stages-fit-together.md`
- `docs/guides/user/workflows-choosing-the-right-route-for-your-project.md`
- `docs/guides/developer/development-workflows-stage-model-and-artifact-relationships.md`
- `docs/guides/developer/development-workflows-choosing-the-right-route.md`

**Ledger rows satisfied**

- `L04`
- User portions of `L02`
- User portion of `L03`
- Developer portions of `L02`
- Developer portions of `L03`

**Evidence used**

- User-guide worker handoff naming the completed user guide updates, satisfied ledger rows, and deferred Phase 6 cross-bundle links.
- Developer-guide worker handoff naming the completed developer workflow updates, satisfied ledger rows, and deferred Phase 6 cross-bundle links.

**Unresolved questions**

- None.

**Links added or deferred**

- Added same-bundle related links across the updated user and developer guides.
- Deferred Phase 6 cross-bundle links from `getting-started-installing-make-docs.md` to the user CLI lifecycle guide.
- Deferred Phase 6 cross-bundle links from `workflows-choosing-the-right-route-for-your-project.md` to the decomposition skill guide.
- Deferred direct cross-bundle linking from `development-workflows-choosing-the-right-route.md` to Bundle C skills coverage.
