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

1. Update or create `docs/guides/developer/template-*.md` files according to the guide delivery map.
2. Explain the current contract and template system, including template-owned docs, routers, contract references under `docs/assets/`, and generated document expectations that matter to maintainers.
3. Clarify how the template package and the dogfood docs tree relate without drifting into historical refactor narration.
4. Implement `link-only` decisions inside broader template or contract guides where the delivery map says standalone files are unnecessary.
5. Add `related` links to user-facing onboarding, workflow, CLI, or skills guides where the maintainer surface exists to support them.

### Acceptance criteria

- [ ] Template and contract edits stay within the `template-*` developer guide family.
- [ ] Guides cite current contract authority and current implementation boundaries.
- [ ] `link-only` template rows are absorbed into broader guides rather than creating thin files.
- [ ] New guides created in this stage use `status: draft`.

### Dependencies

- Phase 2 guide delivery map.

## Stage 2 - Maintainer, validation, packaging, and release guides

### Tasks

1. Update or create `docs/guides/developer/maintainer-*.md` files according to the guide delivery map.
2. Update or create `docs/guides/developer/release-*.md` files according to the guide delivery map.
3. Cover the current operational workflow for dogfood reseeding, build and test expectations, instruction-router verification, smoke-pack validation, packaging, and release surfaces.
4. Keep `docs/guides/developer/roadmap.md` untouched unless the delivery map explicitly assigns it.
5. Keep strategy material separate from operational guides by linking to roadmap content instead of folding it into maintainer instructions.

### Acceptance criteria

- [ ] Maintainer and release edits stay within `maintainer-*` and `release-*` guide families unless the map explicitly says otherwise.
- [ ] Operational guides explain the current workflow rather than historical planning context.
- [ ] `docs/guides/developer/roadmap.md` remains untouched unless explicitly assigned.
- [ ] New guides created in this stage use `status: draft`.

### Dependencies

- Phase 2 guide delivery map.

## Stage 3 - Bundle D handoff and companion-link review

### Tasks

1. Review template, maintainer, and release guides together for companion links back to user-facing entry points where useful.
2. Capture structured handoff data: files changed, ledger rows satisfied, evidence used, unresolved questions, and links added or deferred.
3. Document any deferred cross-bundle links that depend on Bundle A, B, or C outputs.
4. Leave shared discovery and final cross-bundle normalization to Phase 6.

### Acceptance criteria

- [ ] Bundle D returns complete handoff data for traceability and validation.
- [ ] Developer-only guides still link back to user entry points where that improves navigability.
- [ ] Deferred shared-link work is explicit and assembly-owned.

### Dependencies

- Stage 1 - Template and contract guides.
- Stage 2 - Maintainer, validation, packaging, and release guides.
