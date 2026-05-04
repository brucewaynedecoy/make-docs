# CLI Skill Selection Simplification - Work Backlog

## Purpose

This backlog tracks execution of the CLI skill-selection simplification change. It derives from the approved [W14 R1 plan](../../plans/2026-04-28-w14-r1-cli-skill-selection-simplification/00-overview.md) and the originating [design](../../designs/2026-04-28-cli-skill-selection-simplification.md).

The work is a scoped active-set evolution and implementation delta. It should not regenerate the full PRD namespace, rewrite unrelated `W14 R0` asset-selection behavior, or change the remote skill resolver model.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-prd-change-and-baseline-annotations.md](./01-prd-change-and-baseline-annotations.md) | Add the PRD revision doc, annotate impacted baseline PRDs, and update the PRD index. |
| [02-registry-and-selection-model.md](./02-registry-and-selection-model.md) | Remove required/optional metadata from the skill registry and replace `optionalSkills` with a selected-skill model. |
| [03-cli-skill-selection-ux.md](./03-cli-skill-selection-ux.md) | Update full-install and skills-only selection surfaces to show one recommended, selected-by-default skill list. |
| [04-tests-validation-and-closeout.md](./04-tests-validation-and-closeout.md) | Update focused tests, run validation, refresh indexes, and record closeout requirements. |

## Usage Notes

- Read phases in order.
- Phase 1 should land before code changes so the active PRD namespace records the effective requirement.
- Phase 2 owns the structural selection model and should settle field names before Phase 3 edits UI state wiring.
- Phase 3 may inspect copy and UX expectations in parallel, but should not commit shared state changes until Phase 2 settles `selectedSkills` or its final equivalent.
- Phase 4 depends on Phases 1 through 3 and should remain a dedicated validation and closeout pass.
- If `docs/prd/11-revise-cli-asset-selection-simplification.md` has not landed by execution time, confirm whether `docs/prd/12-revise-cli-skill-selection-simplification.md` is still the next correct change-doc number before writing.
- Preserve baseline PRD text unless a future user explicitly approves a cleanup rewrite.
