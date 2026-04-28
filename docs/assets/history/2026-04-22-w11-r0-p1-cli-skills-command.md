---
date: "2026-04-22"
coordinate: "W11 R0 P1"
repo: "make-docs"
branch: "main"
status: "complete"
summary: "Added the `make-docs skills` command surface, command-specific help, parser validation, and CLI tests."
---

# CLI Skills Command - Phase 1 Command Surface and Help

## Changes

Implemented Phase 1 of the Wave 11 CLI skills command work, framed by [the Phase 1 plan](../archive/plans/2026-04-21-w11-r0-cli-skills-command/01-command-surface-and-help.md) and [the Phase 1 backlog](../archive/work/2026-04-21-w11-r0-cli-skills-command/01-command-surface-and-help.md). This phase adds `make-docs skills` as a first-class top-level command with skills-specific parsing, validation, help output, and test coverage while leaving the full skills planner for later phases.

| Area | Summary |
| --- | --- |
| Command model | [`packages/cli/src/cli.ts`](../../../packages/cli/src/cli.ts) now recognizes `skills` alongside `reconfigure`, `backup`, and `uninstall` while preserving bare `make-docs` apply/sync behavior. |
| Skills options | [`packages/cli/src/cli.ts`](../../../packages/cli/src/cli.ts) parses skills command options for target directory, dry run, yes, removal mode, platform skips, skill scope, and optional skills. |
| Validation | [`packages/cli/src/cli.ts`](../../../packages/cli/src/cli.ts) rejects root-level `--remove`, root-level `--skills`, content-selection flags under `make-docs skills`, and `make-docs skills --remove --optional-skills ...`. |
| Help output | [`packages/cli/src/cli.ts`](../../../packages/cli/src/cli.ts) lists `skills` in top-level help and adds command-specific `make-docs skills --help` sections for usage, general options, platform options, skill options, and examples. |
| Test coverage | [`packages/cli/tests/cli.test.ts`](../../../packages/cli/tests/cli.test.ts) covers skills command dispatch, valid skills flags, invalid flag boundaries, top-level help, command-specific help, and the absence of a root-level `--skills` flag. |
| Verification | `npm test -- --run tests/cli.test.ts`, `npm run build`, and `npm test` passed from `packages/cli/`. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/.assets/history/2026-04-22-w11-r0-p1-cli-skills-command.md](2026-04-22-w11-r0-p1-cli-skills-command.md) | History record for Wave 11 Phase 1 command surface and help implementation. |

### Developer

None this session.

### User

None this session.
