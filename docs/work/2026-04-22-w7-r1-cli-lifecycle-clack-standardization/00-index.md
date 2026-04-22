# CLI Lifecycle Clack Standardization - Work Backlog

> See `docs/.references/wave-model.md` for W/R semantics.

## Purpose

This backlog tracks execution of the W7 R1 lifecycle revision for standardizing `make-docs backup` and `make-docs uninstall` on Clack-backed workflow rendering. It derives from [the W7 R1 plan](../../plans/2026-04-22-w7-r1-cli-lifecycle-clack-standardization/00-overview.md) and the originating [design](../../designs/2026-04-22-cli-lifecycle-clack-standardization.md).

## Phase Map

| File | Purpose |
| --- | --- |
| [01-renderer-boundary.md](./01-renderer-boundary.md) | Define the lifecycle renderer boundary and Clack-backed production implementation while preserving current command behavior. |
| [02-backup-clack-workflow.md](./02-backup-clack-workflow.md) | Convert backup review, confirmation, noop, cancellation, and completion output to the lifecycle renderer. |
| [03-uninstall-clack-workflow.md](./03-uninstall-clack-workflow.md) | Convert uninstall warning, audit review, final confirmation, backup-before-remove, cancellation, success, and partial-failure output to the lifecycle renderer. |
| [04-tests-and-validation.md](./04-tests-and-validation.md) | Add semantic renderer coverage and complete build, test, and smoke validation for the lifecycle revision. |

## Usage Notes

- This is a W7 revision backlog, not a new baseline lifecycle wave.
- Preserve all W7 R0 backup and uninstall semantics unless a stage explicitly says otherwise.
- Phase 1 should land before Phases 2 and 3 because it defines the renderer contract.
- Phase 2 and Phase 3 can proceed in parallel after Phase 1 if their write scopes stay disjoint.
- Phase 4 is the final validation and fixup pass and should not be folded into the feature phases.
- `docs/prd/` currently contains router files only, so phase files cite the originating design and plan docs rather than active PRD docs.
