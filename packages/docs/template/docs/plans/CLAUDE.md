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

- Before writing, read `.make-docs/references/system/planning-workflow.md` and copy the matching template from `.make-docs/templates/system/` (`plan-overview.md` for `00-overview.md`; `plan-prd.md`, `plan-prd-decompose.md`, or `plan-prd-change.md` for the overview content shape).
- When updating or executing plans written before W9 R4, apply `docs/plans/2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-overview.md` as the superseding asset-IA authority. Do not carry forward old future-facing targets for top-level `docs/artifacts/**`, top-level `docs/archive/**`, future `docs/assets/history/**` writes, or `docs/assets/{prompts,references,templates}/**` tool resources.
- Always create the plan as a directory; even single-phase plans use the same shape with one `0N-<phase>.md` file.
- Apply the date-slug-W/R naming; do not backdate plans.
- Plans are written before execution, not retroactively.
- Archived plans live in `docs/assets/archive/plans/`. Never archive unless explicitly asked. See `docs/assets/archive/AGENTS.md`.
<!-- make-docs:end -->
