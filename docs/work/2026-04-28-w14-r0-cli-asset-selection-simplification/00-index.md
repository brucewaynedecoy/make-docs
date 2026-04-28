# CLI Asset Selection Simplification - Work Backlog

## Purpose

This backlog tracks execution of the CLI asset-selection simplification change. It derives from the approved [W14 R0 plan](../../plans/2026-04-28-w14-r0-cli-asset-selection-simplification/00-overview.md) and the originating [design](../../designs/2026-04-28-cli-asset-selection-simplification.md).

The work is a scoped active-set evolution and implementation delta. It should not regenerate the full PRD namespace or the full rebuild backlog.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-prd-change-and-baseline-annotations.md](./01-prd-change-and-baseline-annotations.md) | Add the PRD revision doc, annotate impacted baseline PRDs, and update the PRD index. |
| [02-cli-selection-surface.md](./02-cli-selection-surface.md) | Remove prompt/template/reference asset questions from the wizard and settle public legacy flag behavior. |
| [03-asset-normalization-and-compatibility.md](./03-asset-normalization-and-compatibility.md) | Normalize install selections to always-managed assets and preserve compatibility with existing manifests and profile behavior. |
| [04-tests-validation-and-closeout.md](./04-tests-validation-and-closeout.md) | Update focused tests, run validation, refresh indexes, and add implementation history records after phases land. |

## Usage Notes

- Read phases in order.
- Phase 1 should land before code changes so the active PRD namespace records the effective requirement.
- Phases 2 and 3 may run in parallel only after their owners agree on the compatibility shape for legacy flags and any shared selection types.
- Phase 4 depends on Phases 1 through 3 and should remain a dedicated validation and closeout pass.
- Preserve baseline PRD text unless a future user explicitly approves a cleanup rewrite.
- Do not reduce the actual prompt, template, or reference asset set. This wave removes user-facing choice points and makes included assets always managed.
