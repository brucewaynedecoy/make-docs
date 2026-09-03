<!-- make-docs:begin -->
# Plans Directory

This directory contains approach and rationale documents created before execution begins. Plans are always directories: an entry-point `00-overview.md` plus one or more `0N-<phase>.md` files.

## Naming Convention

Pattern: `YYYY-MM-DD-w{W}-r{R}-<slug>/`

- Inside the directory: `00-overview.md` plus one or more `0N-<phase>.md` files.
- Slug: lowercase, hyphens only, no special characters.
- Example: `docs/plans/2026-04-15-w1-r0-migration-strategy/` containing `00-overview.md`, `01-clean-room.md`, `02-integration.md`.
- Use a valid local `.make-docs/system/references/wave-model.md` body for W/R semantics. When it is absent, run `make-docs resource read make-docs://system/reference/wave-model.md`.

## Agent Instructions

- Before writing, use a valid local `.make-docs/system/references/planning-workflow.md` body or, when it is absent, run `make-docs resource read make-docs://system/reference/planning-workflow.md`.
- For `00-overview.md`, use `.make-docs/system/templates/plan-overview.md` or run `make-docs resource read make-docs://system/template/plan-overview.md` when the local body is absent.
- For PRD authority-maintenance overview content, use `.make-docs/system/templates/plan-prd.md`, `.make-docs/system/templates/plan-prd-decompose.md`, or `.make-docs/system/templates/plan-prd-change.md`. When the selected local body is absent, run `make-docs resource read` with its exact `make-docs://system/template/plan-prd.md`, `make-docs://system/template/plan-prd-decompose.md`, or `make-docs://system/template/plan-prd-change.md` URI.
- PRD authority-maintenance plans list existing PRD owners to update, genuinely new product PRDs if any, requirement-history entries, and affected links, risks, plans, and work artifacts. Editorial change and revision language belongs here, not in `docs/prd/`.
- Always create the plan as a directory; even single-phase plans use the same shape with one `0N-<phase>.md` file.
- Apply the date-slug-W/R naming; do not backdate plans.
- Plans are written before execution, not retroactively.
- Archived plans live in `.make-docs/archive/plans/`. Before first use, run `make-docs project surface ensure archive`. Never archive unless explicitly asked.
<!-- make-docs:end -->
