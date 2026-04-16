# Design Naming Simplification — Work Backlog

> See `docs/.references/wave-model.md` for W/R semantics.

## Purpose

This backlog tracks execution of the design naming simplification. It derives from [the plan](../../plans/2026-04-16-w3-r0-design-naming-simplification/00-overview.md) and the originating [design](../../designs/2026-04-16-design-naming-simplification.md).

## Phase Map

| File | Purpose |
| --- | --- |
| [01-template-references-and-contract.md](./01-template-references-and-contract.md) | Update wave-model.md, design-contract.md, and design-workflow.md in the template package. |
| [02-template-and-routers.md](./02-template-and-routers.md) | Update design.md template and design directory routers in the template package. |
| [03-cli-renderers.md](./03-cli-renderers.md) | Update renderDesignWorkflow, renderDesignContract, and renderDesignTemplate in renderers.ts. |
| [04-reseed-and-validation.md](./04-reseed-and-validation.md) | Re-seed dogfood docs and run the full validation suite. |

## Usage Notes

- Phases 1 and 2 can execute in parallel (disjoint file sets).
- Phase 3 depends on Phases 1 and 2.
- Phase 4 depends on Phase 3.
- Existing `w2-r0` design files are NOT renamed — they remain valid historical records.
- Keep phase files dependency-ordered.
