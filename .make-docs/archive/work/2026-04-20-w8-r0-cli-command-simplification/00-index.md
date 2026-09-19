# CLI Command Simplification — Work Backlog

> See `docs/.references/wave-model.md` for W/R semantics.

## Purpose

This backlog tracks execution of the CLI command simplification wave. It derives from [the `w8-r0` plan](../../plans/2026-04-20-w8-r0-cli-command-simplification/00-overview.md) and the originating [design](../../designs/2026-04-20-cli-command-simplification.md).

## Phase Map

| File | Purpose |
| --- | --- |
| [01-command-model-and-parser.md](01-command-model-and-parser.md) | Replace the public parser command model with bare apply/sync, `reconfigure`, `backup`, and `uninstall`, including helpful removed-command errors. |
| [02-apply-and-reconfigure-behavior.md](02-apply-and-reconfigure-behavior.md) | Implement apply/sync and reconfigure semantics on top of the existing install planner and selection model. |
| [03-help-router-and-doc-text.md](03-help-router-and-doc-text.md) | Update CLI help, generated router guidance, and project docs to use the simplified command vocabulary. |
| [04-tests-and-validation.md](04-tests-and-validation.md) | Add regression coverage and run final build, test, smoke-pack, and stale-reference validation. |

## Usage Notes

- Read phases in order.
- Phase 1 fixes the public command grammar and should land before behavior changes.
- Phase 2 depends on Phase 1.
- Phase 3 depends on the final command names and behavior, but generated router text can be prepared once Phase 1 is stable.
- Phase 4 depends on all prior phases and should remain a dedicated validation/fixup pass.
- Do not modify backup or uninstall execution behavior except to preserve their parser boundaries after the command model changes.
