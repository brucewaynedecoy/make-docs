# CLI Skills Command - Work Backlog

> See `docs/.references/wave-model.md` for W/R semantics.

## Purpose

This backlog tracks execution of the CLI skills command wave. It derives from [the `w11-r0` plan](../../plans/2026-04-21-w11-r0-cli-skills-command/00-overview.md) and the originating [design](../../designs/2026-04-21-cli-skills-command.md).

## Phase Map

| File | Purpose |
| --- | --- |
| [01-command-surface-and-help.md](01-command-surface-and-help.md) | Add the `skills` command grammar, command-specific flag validation, and help output. |
| [02-skills-only-planner-and-apply.md](02-skills-only-planner-and-apply.md) | Add the skills-only planning/apply path, manifest update rules, and first-time minimal tracking state. |
| [03-clack-flow-and-output.md](03-clack-flow-and-output.md) | Add the skills-only interactive Clack flow and skill-focused plan/completion output. |
| [04-tests-and-validation.md](04-tests-and-validation.md) | Add parser, planner, manifest, UX, and smoke validation for the skills command. |

## Usage Notes

- Read phases in order.
- Phase 1 fixes the public command grammar and help contract.
- Phase 2 depends on Phase 1 for command dispatch, but planner helper design can start once the command contract is stable.
- Phase 3 depends on Phases 1 and 2 because the interactive review must render the skills-only plan shape.
- Phase 4 depends on all prior phases and should remain a dedicated validation/fixup pass.
- Do not add or document a root-level `--skills` flag.
- Do not let skills-only sync or removal modify non-skill docs assets, root instructions, prompts, templates, references, or unrelated files.
