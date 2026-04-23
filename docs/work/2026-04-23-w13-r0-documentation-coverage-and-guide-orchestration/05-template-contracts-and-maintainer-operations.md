# Phase 5: Template Contracts and Maintainer Operations

> Derives from [Phase 5 of the plan](../../plans/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/05-template-contracts-and-maintainer-operations.md).

## Purpose

Deliver the developer-facing guide coverage for the template and contract system, dogfood workflow, packaging, validation, and release operations. This phase is where the guide set explains how maintainers and extenders work on `make-docs` itself.

## Overview

Bundle D owns the maintainer-facing side of the guide library. These guides should cite current contracts, current PRD docs, and current implementation boundaries instead of replaying historical refactors. When a topic lands as `link-only`, it should be integrated into broader developer guides rather than turned into a thin standalone file.

## Source PRD Docs

- [../../prd/02-architecture-overview.md](../../prd/02-architecture-overview.md)
- [../../prd/06-template-contracts-and-generated-assets.md](../../prd/06-template-contracts-and-generated-assets.md)
- [../../prd/09-dogfood-and-maintainer-operations.md](../../prd/09-dogfood-and-maintainer-operations.md)
- [../../prd/10-packaging-validation-and-release-reference.md](../../prd/10-packaging-validation-and-release-reference.md)

## Source Plan Phases

- [05-template-contracts-and-maintainer-operations.md](../../plans/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/05-template-contracts-and-maintainer-operations.md)

## Stage 1 - Template and contract guides

### Tasks

- [x] Update or create `docs/guides/developer/template-*.md` files according to the guide delivery map.
- [x] Explain the current contract and template system, including template-owned docs, routers, contract references under `docs/assets/`, and generated document expectations that matter to maintainers.
- [x] Clarify how the template package and the dogfood docs tree relate without drifting into historical refactor narration.
- [x] Implement `link-only` decisions inside broader template or contract guides where the delivery map says standalone files are unnecessary.
- [x] Add `related` links to user-facing onboarding, workflow, CLI, or skills guides where the maintainer surface exists to support them.

### Acceptance criteria

- [x] Template and contract edits stay within the `template-*` developer guide family.
- [x] Guides cite current contract authority and current implementation boundaries.
- [x] `link-only` template rows are absorbed into broader guides rather than creating thin files.
- [x] New guides created in this stage use `status: draft`.

### Dependencies

- Phase 2 guide delivery map.

## Stage 2 - Maintainer, validation, packaging, and release guides

### Tasks

- [x] Update or create `docs/guides/developer/maintainer-*.md` files according to the guide delivery map.
- [x] Update or create `docs/guides/developer/release-*.md` files according to the guide delivery map.
- [x] Cover the current operational workflow for dogfood reseeding, build and test expectations, instruction-router verification, smoke-pack validation, packaging, and release surfaces.
- [x] Keep `docs/guides/developer/roadmap.md` untouched unless the delivery map explicitly assigns it.
- [x] Keep strategy material separate from operational guides by linking to roadmap content instead of folding it into maintainer instructions.

### Acceptance criteria

- [x] Maintainer and release edits stay within `maintainer-*` and `release-*` guide families unless the map explicitly says otherwise.
- [x] Operational guides explain the current workflow rather than historical planning context.
- [x] `docs/guides/developer/roadmap.md` remains untouched unless explicitly assigned.
- [x] New guides created in this stage use `status: draft`.

### Dependencies

- Phase 2 guide delivery map.

## Stage 3 - Bundle D handoff and companion-link review

### Tasks

- [x] Review template, maintainer, and release guides together for companion links back to user-facing entry points where useful.
- [x] Capture structured handoff data: files changed, ledger rows satisfied, evidence used, unresolved questions, and links added or deferred.
- [x] Document any deferred cross-bundle links that depend on Bundle A, B, or C outputs.
- [x] Leave shared discovery and final cross-bundle normalization to Phase 6.

### Acceptance criteria

- [x] Bundle D returns complete handoff data for traceability and validation.
- [x] Developer-only guides still link back to user entry points where that improves navigability.
- [x] Deferred shared-link work is explicit and assembly-owned.

### Dependencies

- Stage 1 - Template and contract guides.
- Stage 2 - Maintainer, validation, packaging, and release guides.

## Implementation notes

- Phase 05 is complete from the template-guide and maintainer/release worker handoffs; Bundle D finished the assigned template, maintainer, and release coverage without expanding write scope beyond the expected guide families.
- Same-bundle links were added where the worker handoffs reported them, while cross-bundle normalization and README discovery refresh remain explicitly deferred to Phase 6.

### Structured handoff payload

- `files changed`:
  - `template-contracts-guide-authoring.md`
  - `template-assets-and-generated-routers.md`
  - `maintainer-docs-assets-and-runtime-state-boundaries.md`
  - `cli-development-local-build-and-install.md`
  - `maintainer-dogfood-and-maintainer-operations.md`
  - `release-packaging-validation-and-release-reference.md`
- `ledger rows satisfied`:
  - `L01`
  - `L09`
  - `L10`
  - `L11`
  - `L12`
- `evidence used`:
  - Template-guide worker handoff for Phase 05 covering `L01` and `L09`.
  - Maintainer/release worker handoff for Phase 05 covering `L10`, `L11`, and `L12`.
  - `docs/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/supporting/guide-delivery-map.md`
  - `docs/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/supporting/capability-coverage-ledger.md`
  - `docs/prd/06-template-contracts-and-generated-assets.md`
  - `docs/prd/09-dogfood-and-maintainer-operations.md`
  - `docs/prd/10-packaging-validation-and-release-reference.md`
- `unresolved questions`:
  - None.
- `links added or deferred`:
  - Added same-bundle related links between the two template guides.
  - Added links among the four Bundle D maintainer and release guides and to PRDs `06`, `09`, and `10`.
  - Deferred cross-bundle normalization to Phase 6.
  - Deferred README discovery refresh to Phase 6.
