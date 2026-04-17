# CLI Skill Installation R2 — Work Backlog

> See `docs/.references/wave-model.md` for W/R semantics.

## Purpose

This backlog tracks execution of the harness-aware, registry-based skill installation. It is **Wave 5 Revision 2** (`w5-r2`). It derives from [the plan](../../plans/2026-04-16-w5-r2-cli-skill-installation/00-overview.md) and the originating [design](../../designs/2026-04-16-cli-skill-installation-r2.md).

## Phase Map

| File | Purpose |
| --- | --- |
| [01-type-system-and-harness-model.md](./01-type-system-and-harness-model.md) | Replace instructionKinds with harnesses, add skillScope, manifest migration. |
| [02-registry-and-resolver.md](./02-registry-and-resolver.md) | Create skill-registry.json, registry loader, local: protocol resolver. |
| [03-instruction-derivation.md](./03-instruction-derivation.md) | Derive instruction files from harness selection in catalog + renderers. |
| [04-skill-install-pipeline.md](./04-skill-install-pipeline.md) | Skill catalog, multi-target install, path rewriting, planner/installer integration. |
| [05-selective-prepack.md](./05-selective-prepack.md) | Prepack selectively copies only registry-declared files. |
| [06-wizard-and-cli-flags.md](./06-wizard-and-cli-flags.md) | Harness step, skills+scope step, new flags, backward-compat aliases. |
| [07-tests-and-validation.md](./07-tests-and-validation.md) | Full test updates, smoke-pack, dogfood skill discovery. |

## Usage Notes

- Phases 1 and 2 can execute in parallel (no dependencies).
- Phases 3, 4, 5, and 6 can execute in parallel (each depends on Phase 1 and/or 2, but not on each other).
- Phase 7 depends on all prior phases.
- Keep phase files dependency-ordered.
