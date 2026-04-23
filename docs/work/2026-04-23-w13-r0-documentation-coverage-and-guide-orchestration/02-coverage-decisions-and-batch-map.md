# Phase 2: Coverage Decisions and Batch Map

> Derives from [Phase 2 of the plan](../../plans/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/02-coverage-decisions-and-batch-map.md).

## Purpose

Turn the raw ledger into a decision-complete guide delivery map. This phase resolves the final audience outcome for every capability row, assigns guide families and priorities, picks create-vs-update targets, and locks the write scopes that later bundle workers must follow.

## Overview

Phase 2 is the decision gate between discovery and guide drafting. Its outputs are the finalized ledger fields and `supporting/guide-delivery-map.md`. Once this phase closes, later workers should be writing guides, not inventing filenames, debating ownership, or reopening the audience rubric.

## Source PRD Docs

- [../../prd/00-index.md](../../prd/00-index.md)
- [../../prd/01-product-overview.md](../../prd/01-product-overview.md)
- [../../prd/02-architecture-overview.md](../../prd/02-architecture-overview.md)
- [../../prd/05-installation-profile-and-manifest-lifecycle.md](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [../../prd/06-template-contracts-and-generated-assets.md](../../prd/06-template-contracts-and-generated-assets.md)
- [../../prd/07-cli-command-surface-and-lifecycle.md](../../prd/07-cli-command-surface-and-lifecycle.md)
- [../../prd/08-skills-catalog-and-distribution.md](../../prd/08-skills-catalog-and-distribution.md)
- [../../prd/09-dogfood-and-maintainer-operations.md](../../prd/09-dogfood-and-maintainer-operations.md)
- [../../prd/10-packaging-validation-and-release-reference.md](../../prd/10-packaging-validation-and-release-reference.md)

## Source Plan Phases

- [00-overview.md](../../plans/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/00-overview.md)
- [02-coverage-decisions-and-batch-map.md](../../plans/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/02-coverage-decisions-and-batch-map.md)

## Stage 1 - Resolve the final documentation outcome for every row

### Tasks

- [x] Reviewed every provisional ledger row and assigned one final outcome: `developer`, `user`, `both`, `link-only`, or `none`.
- [x] Applied the design rubric exactly: maintainer and extensibility surfaces default to `developer`; install, CLI, workflow, and concept surfaces default to `user`; `both` only when the audiences need genuinely distinct treatments.
- [x] Used `link-only` where broader-guide coverage is sufficient and reserved `none` for obsolete or no-longer-meaningful guide content.
- [x] Recorded concise reasoning in the ledger where the final outcome is non-obvious or where historical evidence pointed in a different direction.

### Acceptance criteria

- [x] Every ledger row has one final outcome and no provisional audience fields remain.
- [x] `both`, `link-only`, and `none` rows include enough reasoning to survive later review.
- [x] Audience decisions follow the design rubric instead of wave chronology.

### Dependencies

- Phase 1 ledger completion.

## Stage 2 - Assign guide families and final targets

### Tasks

- [x] Mapped every non-`none` row into one canonical guide family: onboarding, concepts and workflows, CLI lifecycle, template and contracts, skills, or maintainer and release operations.
- [x] Decided whether each row updates an existing guide, creates a new guide, or lands as `link-only` coverage in an existing guide.
- [x] Recorded the final audience, guide family, target `path`, final filename slug, and suggested title in the ledger or delivery map.
- [x] Preferred existing guide anchors before creating new files, especially the current onboarding, workflow, coordinate, CLI-development, and maintainer-adjacent guides already present in the repo.

### Acceptance criteria

- [x] Every non-`none` row maps to exactly one guide family.
- [x] Every non-`none` row has a final create, update, or link-only target.
- [x] No later bundle worker will need to invent a filename, title, or primary guide family.

### Dependencies

- Stage 1 - Resolve the final documentation outcome for every row.

## Stage 3 - Create the execution-facing guide delivery map

### Tasks

- [x] Created `docs/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/supporting/guide-delivery-map.md`.
- [x] Copied the finalized guide decisions into a worker-facing map that records target audience, guide family, action, guide `path`, filename slug, target worker bundle, and priority.
- [x] Assigned each non-`none` row a priority of `P1`, `P2`, or `P3`.
- [x] Grouped work into the fixed bundle families: Bundle A for onboarding/concepts/workflows, Bundle B for CLI lifecycle, Bundle C for skills, and Bundle D for template/contracts/maintainer/release operations.

### Acceptance criteria

- [x] The guide delivery map exists at the planned support path.
- [x] Every non-`none` row has a priority.
- [x] Every guide change belongs to exactly one bundle.
- [x] The delivery map is specific enough for bundle workers to execute without reopening planning.

### Dependencies

- Stage 2 - Assign guide families and final targets.

## Stage 4 - Reserve assembly dependencies and prepare worker handoffs

### Tasks

- [x] Recorded `README.md` discovery work, deferred cross-bundle `related` links, and `link-only` rows that depend on another bundle as assembly-owned items.
- [x] Documented each bundle's allowed write scope and explicitly called out prohibited shared files.
- [x] Defined the required handoff payload for later workers: files changed, ledger rows satisfied, evidence used, unresolved questions, and links added or deferred.
- [x] Left shared navigation and validation ownership with Phase 6 rather than smearing that work across bundle phases.

### Acceptance criteria

- [x] `README.md` and other shared assembly dependencies are reserved for Phase 6.
- [x] Bundle write scopes are explicit and non-overlapping.
- [x] Worker handoff expectations are documented before drafting begins.
- [x] Phase 3-5 workers can start without reinterpreting ownership.

### Dependencies

- Stage 3 - Create the execution-facing guide delivery map.

## Implementation Notes

Completed on 2026-04-23.

- Finalized `supporting/capability-coverage-ledger.md` with locked outcomes for all 12 capability rows: 4 `developer`, 3 `user`, 3 `both`, 2 `link-only`, and 0 `none`.
- Created `supporting/guide-delivery-map.md` with exact target files, path values, titles, priorities, and bundle assignments for Phases 3-6.
- Reused the current onboarding, workflow, coordinate, and developer workflow guides where coverage already exists, and locked new guide creation to the missing CLI lifecycle, skills, template, maintainer, and release surfaces only.
- Reserved `README.md` discovery updates and final cross-bundle `related` normalization for Phase 6 so bundle workers can draft without competing for shared files.
