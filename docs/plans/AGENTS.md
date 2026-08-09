<!-- make-docs:begin -->
# Plans Directory

This directory contains approach and rationale documents created before execution begins. Plans are always directories: an entry-point `00-overview.md` plus one or more `0N-<phase>.md` files.

## Naming Convention

Pattern: `YYYY-MM-DD-w{W}-r{R}-<slug>/`

- Inside the directory: `00-overview.md` plus one or more `0N-<phase>.md` files.
- Slug: lowercase, hyphens only, no special characters.
- Example: `docs/plans/2026-04-15-w1-r0-migration-strategy/` containing `00-overview.md`, `01-clean-room.md`, `02-integration.md`.
- See `.make-docs/references/system/wave-model.md` for W/R semantics.

## Agent Instructions

- Before writing, read `.make-docs/references/system/planning-workflow.md` and copy the matching template from `.make-docs/templates/system/` (`plan-overview.md` for `00-overview.md`; `plan-prd.md`, `plan-prd-decompose.md`, or `plan-prd-change.md` for the PRD authority-maintenance overview content shape).
- PRD authority-maintenance plans list existing PRD owners to update, genuinely new product PRDs if any, requirement-history entries, and affected links, risks, plans, and work artifacts. Editorial change and revision language belongs here, not in `docs/prd/`.
- Always create the plan as a directory; even single-phase plans use the same shape with one `0N-<phase>.md` file.
- Apply the date-slug-W/R naming; do not backdate plans.
- Plans are written before execution, not retroactively.
- Archived plans live in `docs/assets/archive/plans/`. Never archive unless explicitly asked. See `docs/assets/archive/AGENTS.md`.
<!-- make-docs:end -->
