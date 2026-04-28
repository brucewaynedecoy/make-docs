---
date: "2026-04-28"
client: "Codex Desktop"
repo: "make-docs"
status: "completed"
summary: "Archived completed W2-W13 planning artifacts while keeping the active PRD set in place."
---

# W2-W13 Planning Artifact Archive

## Changes

Archived the completed W2-W13 planning artifacts into the active archive namespace while leaving the PRD set, W14 planning docs, guides, and history records active. The archive pass moved 17 plan directories, 18 work directories, and 17 associated design docs into `docs/assets/archive/`, then rewrote active references so current docs still point to useful planning lineage.

| Area | Summary |
| --- | --- |
| Archive scope | Moved W2-W13 plan directories to `docs/assets/archive/plans/`, work directories to `docs/assets/archive/work/`, and associated design docs to `docs/assets/archive/designs/`. |
| Active docs | Kept `docs/prd/**`, W14 design/plan/work docs, guides, and history records active; only links were rewritten where they referenced archived artifacts. |
| PRD continuity | Updated active PRD references to point at archived W2-W13 lineage without moving the PRD documents themselves. |
| Validation | Ran the archive relationship inventory, scoped moved-artifact link validation, docs reindexing, broad `jdocmunch` broken-link scan, and `git diff --check -- docs`. |

Validation notes:

- `docs/assets/archive/plans/` contains 17 archived W2-W13 plan directories.
- `docs/assets/archive/work/` contains 18 archived W2-W13 work directories, including the W12 PRD decomposition backlog and W13 support files.
- `docs/assets/archive/designs/` contains 17 archived design docs associated with the moved plan/work set.
- The scoped archive validation confirmed no active links still target the moved `docs/plans/`, `docs/work/`, or `docs/designs/` locations.
- The broad `jdocmunch.get_broken_links("local/make-docs")` scan still reports known historical/template link noise, so scoped validation remained the acceptance gate.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/assets/archive/plans/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/00-overview.md](../archive/plans/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/00-overview.md) | Representative archived plan from the moved W2-W13 plan set. |
| [docs/assets/archive/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/00-index.md](../archive/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/00-index.md) | Representative archived work backlog from the moved W2-W13 work set. |
| [docs/assets/archive/designs/2026-04-23-documentation-coverage-and-guide-orchestration.md](../archive/designs/2026-04-23-documentation-coverage-and-guide-orchestration.md) | Representative archived design from the moved W2-W13 design set. |
| [docs/prd/00-index.md](../../prd/00-index.md) | Updated active PRD entry points so the W12 decomposition backlog now resolves through the archive namespace. |
| [docs/prd/08-skills-catalog-and-distribution.md](../../prd/08-skills-catalog-and-distribution.md) | Updated active skills PRD lineage links to archived skill installation and skills command design docs. |
| [docs/prd/09-dogfood-and-maintainer-operations.md](../../prd/09-dogfood-and-maintainer-operations.md) | Updated active dogfood and maintainer references to archived W2/W9 migration planning docs. |
| [docs/designs/2026-04-28-cli-asset-selection-simplification.md](../archive/designs/2026-04-28-cli-asset-selection-simplification.md) | Updated W14 asset-selection lineage links to archived prior design docs. |
| [docs/designs/2026-04-28-cli-skill-selection-simplification.md](../../designs/2026-04-28-cli-skill-selection-simplification.md) | Updated W14 skill-selection lineage links to archived prior skill installation design docs. |
| [docs/assets/references/commit-message-convention.md](../references/commit-message-convention.md) | Updated the example command-simplification design link to the archive namespace. |
| [docs/assets/history/2026-04-23-w13-r0-p6-navigation-assembly-and-validation.md](2026-04-23-w13-r0-p6-navigation-assembly-and-validation.md) | Representative active history breadcrumb updated to point at archived W13 plan/work artifacts. |
| [docs/assets/history/2026-04-28-archive-w2-w13-planning-artifacts.md](2026-04-28-archive-w2-w13-planning-artifacts.md) | History record for this archive checkpoint. |

### Developer

| Path | Description |
| --- | --- |
| [docs/guides/developer/roadmap.md](../../guides/developer/roadmap.md) | Updated roadmap frontmatter and related-design links to archived skill and archive-docs design docs. |

### User

| Path | Description |
| --- | --- |
| [docs/guides/user/concepts-wave-revision-phase-coordinates.md](../../guides/user/concepts-wave-revision-phase-coordinates.md) | Updated the W13 coordinate example so it points at the archived W13 plan/work locations. |
