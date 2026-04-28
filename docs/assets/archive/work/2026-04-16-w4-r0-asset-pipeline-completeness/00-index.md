# Asset Pipeline Completeness — Work Backlog

> See `docs/.references/wave-model.md` for W/R semantics.

## Purpose

This backlog tracks execution of the asset pipeline completeness fix. It derives from [the plan](../../plans/2026-04-16-w4-r0-asset-pipeline-completeness/00-overview.md) and the originating [design](../../designs/2026-04-16-asset-pipeline-completeness.md).

## Phase Map

| File | Purpose |
| --- | --- |
| [01-cli-source-changes.md](01-cli-source-changes.md) | Update rules.ts and catalog.ts to cover all 7 unmanaged template files. |
| [02-tests-and-validation.md](02-tests-and-validation.md) | Add template-completeness test, update reduced-profile assertions, run full validation. |

## Usage Notes

- Phase 1 is self-contained (CLI source changes only).
- Phase 2 depends on Phase 1.
- No template or dogfood file changes needed — only CLI source and test files are modified.
- Keep phase files dependency-ordered.
