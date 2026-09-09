# CLI Skills Command - Implementation Plan

## Purpose

Implement the dedicated `make-docs skills` lifecycle command designed in [2026-04-21-cli-skills-command.md](../../designs/2026-04-21-cli-skills-command.md). This is **Wave 11 Revision 0** (`w11-r0`): a skills-only command surface that syncs or removes managed skills without running the broader docs apply/reconfigure path.

## Objective

- `make-docs skills` becomes a top-level command beside `reconfigure`, `backup`, and `uninstall`.
- Skill payload behavior remains remote-registry driven; the CLI continues to fetch hosted skill content at runtime.
- Skills-only sync creates, updates, and removes only skill files plus the minimal manifest state needed to track them.
- Skills-only removal uses `make-docs skills --remove` and removes only managed skill files.
- Interactive runs use Clack screens scoped to action, platform, scope, optional skills, and review.
- Help, tests, and smoke validation prove no root-level `--skills` flag exists and no non-skill assets are modified by the new command.

## Phase Map

| File | Purpose |
| ---- | ------- |
| `01-command-surface-and-help.md` | Add the `skills` command grammar, command-specific flag validation, and help output. |
| `02-skills-only-planner-and-apply.md` | Add the skills-only planning/apply path, manifest update rules, and first-time minimal tracking state. |
| `03-clack-flow-and-output.md` | Add the skills-only interactive Clack flow and skill-focused plan/completion output. |
| `04-tests-and-validation.md` | Add parser, planner, manifest, UX, and smoke validation for the skills command. |

## Dependencies

- Phase 1 has no implementation dependencies and should land before command behavior is wired.
- Phase 2 depends on Phase 1 for the command dispatch shape, but its planner helpers can be developed in parallel after the command contract is fixed.
- Phase 3 depends on Phase 1 for command dispatch and Phase 2 for the plan summary data it reviews.
- Phase 4 depends on all prior phases and is the final validation/fixup pass.

## Validation

1. `make-docs skills --help` documents the skills command and top-level help lists `skills` as a command.
2. No root-level `--skills` flag is accepted or documented.
3. `make-docs skills --yes` syncs only skill files and manifest skill tracking state.
4. `make-docs skills --remove --yes` removes only managed skill files.
5. Existing full installs keep non-skill managed files untouched during skills-only sync, scope changes, harness changes, and removal.
6. Interactive `make-docs skills` shows only skills-related Clack screens.
7. `npm run build -w make-docs`, `npm test -w make-docs`, and `node scripts/smoke-pack.mjs` pass.
