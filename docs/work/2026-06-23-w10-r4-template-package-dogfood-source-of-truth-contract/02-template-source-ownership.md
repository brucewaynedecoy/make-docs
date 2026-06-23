# Template Source Ownership

## Purpose

Implement and document template-first ownership across source files and maintainer guidance.

## Source PRD Docs

- `docs/prd/19-revise-template-package-dogfood-source-of-truth-contract.md`
- `docs/prd/06-template-contracts-and-generated-assets.md`
- `docs/prd/09-dogfood-and-maintainer-operations.md`

## Stage 1 - Ownership Boundary

### Tasks

- [ ] t1: Document `packages/docs/template/` as the first mutation target for shipped template-owned docs assets.
- [ ] t2: Document root `docs/` exclusions for generated PRDs, designs, plans, work backlogs, history, archive, artifact, overlay, and config content.
- [ ] t3: Make mixed-directory ownership explicit for history/archive routers versus local records.

### Acceptance Criteria

- Maintainer docs and implementation notes do not describe root `docs/` as the source of truth.
- Project-owned records are protected from blind reseeding.
- Mixed directory ownership is understandable before a maintainer edits or reseeds.

### Dependencies

- Phase 1 requirements trace.
