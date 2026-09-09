# Guide Structure Contract — Work Backlog

> See `docs/.references/wave-model.md` for W/R semantics.

## Purpose

This backlog tracks execution of the guide structure contract implementation. It derives from [the plan](../../plans/2026-04-16-w2-r0-guide-structure-contract/00-overview.md) and the originating [design](../../designs/2026-04-16-guide-structure-contract.md).

## Phase Map

| File | Purpose |
| --- | --- |
| [01-authority-and-templates.md](01-authority-and-templates.md) | Create guide-contract reference and two guide templates in the template package. |
| [02-router-updates.md](02-router-updates.md) | Update guide, docs, and templates router files in the template package. |
| [03-cli-integration.md](03-cli-integration.md) | Wire new files into the CLI asset pipeline (rules, catalog, renderers). |
| [04-migration-and-reseed.md](04-migration-and-reseed.md) | Migrate existing guides and re-seed dogfood docs from the template. |
| [05-tests-and-validation.md](05-tests-and-validation.md) | Update tests, run full validation suite. |

## Usage Notes

- Phases 1 and 2 can execute in parallel (disjoint file sets).
- Phase 3 depends on Phases 1 and 2.
- Phase 4 depends on Phase 3.
- Phase 5 depends on Phase 4.
- Every phase file includes `## Source Plan Phases` linking back to the plan.
- Keep phase files dependency-ordered.
