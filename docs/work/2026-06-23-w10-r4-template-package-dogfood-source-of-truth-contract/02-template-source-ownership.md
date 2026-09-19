# Template Source Ownership

## Purpose

Implement and document template-first ownership across source files and maintainer guidance.

## Source PRD Docs

- `docs/prd/06-template-contracts-and-generated-assets.md`
- `docs/prd/06-template-contracts-and-generated-assets.md`
- `docs/prd/09-dogfood-and-maintainer-operations.md`

## Stage 1 - Ownership Boundary

### Tasks

- [x] t1: Document `packages/docs/template/` as the first mutation target for shipped template-owned docs assets.
- [x] t2: Document root `docs/` exclusions for generated PRDs, designs, plans, work backlogs, history, archive, artifact, overlay, and config content.
- [x] t3: Make mixed-directory ownership explicit for history/archive routers versus local records.

### Acceptance Criteria

- Maintainer docs and implementation notes do not describe root `docs/` as the source of truth.
- Project-owned records are protected from blind reseeding.
- Mixed directory ownership is understandable before a maintainer edits or reseeds.
- Ownership guidance distinguishes shipped template/package behavior from root dogfood migration evidence; direct dogfood moves do not satisfy packaged V2 user migration acceptance.

### Dependencies

- Phase 1 requirements trace.

## Implementation Notes

Phase 2 updated maintainer-facing ownership guidance without changing package code or moving user-authored Markdown trees.

### Ownership Surfaces Updated

| Surface | Ownership clarification |
| --- | --- |
| `README.md` | The installed tree now distinguishes `docs/assets/{archive,artifacts,library,playbooks}/**` project documentation assets from `.make-docs/{contracts,references,templates}/system/**`, `.make-docs/scripts/**`, and mutable `.make-docs/manifest.json` or `.make-docs/conflicts/<run-id>/` state. |
| `packages/docs/README.md` | Re-seed guidance now names `packages/docs/template/` as the source, adds selected `.make-docs/scripts/**` helper scripts, and explicitly excludes generated designs, plans, PRDs, work backlogs, local library guide bodies, local playbooks, archive history records, artifact review material, overlays, and project config from blind reseeding. |
| `docs/assets/library/developer/maintainer-dogfood-and-maintainer-operations.md` | The maintainer re-seed guide now routes system contracts, references, prompt starters, templates, helper scripts, and managed asset routers through template-first selective reseeding while preserving local records. |
| `docs/assets/library/developer/maintainer-docs-assets-and-runtime-state-boundaries.md` | The boundary guide now separates managed project documentation assets, shipped system machinery, and mutable installer state instead of treating all `.make-docs/**` content as runtime state. |
| `docs/assets/library/developer/template-assets-and-generated-routers.md` | The template-assets guide now treats installed managed assets as spanning both `docs/**` and `.make-docs/**`, and names archive/artifact/library/playbook routers plus system helper scripts as template-owned when shipped. |

### Migration Boundary

These edits document package/template/dogfood ownership only. They do not claim that direct repo-root dogfood moves satisfy packaged V2 user migration behavior. Any future migration that moves user or project Markdown trees still depends on the W10 R3 future backlog requirements for packaged CLI/shared-core move planning, deterministic Markdown link rewriting, review or manual-review routing, and full destination-tree link validation.
