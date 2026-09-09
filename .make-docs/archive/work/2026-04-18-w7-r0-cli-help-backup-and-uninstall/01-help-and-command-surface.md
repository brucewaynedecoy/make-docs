# Phase 1: Help and Command Surface

> Derives from [Phase 1 of the plan](../../plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/01-help-and-command-surface.md).

## Purpose

Expand the CLI shell to recognize `backup` and `uninstall`, replace the flat `--help` output with structured top-level and command-specific help, and lock the new grammar down with parser/help tests before lifecycle execution exists.

## Overview

This phase is the public command-surface foundation for the wave. It should stop at parser, validation, and help rendering boundaries. Non-help `backup` and `uninstall` invocations should fail with deliberate placeholder errors until later phases implement the audit, backup, and uninstall engines.

## Source Plan Phases

- [01-help-and-command-surface.md](../../plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/01-help-and-command-surface.md)

## Stage 1 — Expand command parsing and argument validation

### Tasks

1. Update `packages/cli/src/cli.ts` so `Command` recognizes `init`, `update`, `backup`, and `uninstall`.
2. Extend `ParsedArgs` with the new lifecycle-surface fields needed for later phases:
   - `yes: boolean`
   - `backup: boolean`
3. Parse the new command forms:
   - `make-docs backup [--target <dir>] [--yes] [--help]`
   - `make-docs uninstall [--target <dir>] [--backup] [--yes] [--help]`
4. Enforce parser validation rules:
   - `--backup` only valid with `uninstall`
   - legacy `--permissions` rejected as an unknown argument
   - install-selection flags still only valid with `init` and `update --reconfigure`
   - `--reconfigure` remains update-only
5. Keep implicit command inference limited to install/update flows only.

### Acceptance criteria

- [ ] `Command` recognizes `backup` and `uninstall`
- [ ] `ParsedArgs` captures `yes` and `backup`
- [ ] legacy `--permissions` is rejected as an unknown argument
- [ ] `--backup` is rejected outside `uninstall`
- [ ] Selection flags remain rejected for `backup` and `uninstall`
- [ ] No implicit inference path treats a no-command invocation as `backup` or `uninstall`

### Dependencies

- None

## Stage 2 — Replace flat help with structured command-aware help

### Tasks

1. Refactor `printHelp()` in `packages/cli/src/cli.ts` into command-aware help rendering for:
   - `make-docs --help`
   - `make-docs init --help`
   - `make-docs update --help`
   - `make-docs backup --help`
   - `make-docs uninstall --help`
2. Add a structured top-level help layout with:
   - short purpose statement
   - `Commands` section with one-line summaries
   - grouped examples/common patterns
   - note that `<command> --help` is available
3. Add command-specific help layouts with:
   - short summary
   - `Usage`
   - grouped `Options`
   - compact `Examples`
4. Improve wording for existing install flags while the help is being rewritten:
   - canonical harness flags
   - deprecated aliases noted once
   - clearer `--skill-scope` and `--optional-skills`
5. Document `--yes` and `--backup` in user-facing terms rather than implementation language.

### Acceptance criteria

- [ ] `make-docs --help` shows structured top-level help with command summaries and examples
- [ ] `init --help`, `update --help`, `backup --help`, and `uninstall --help` each show command-specific help
- [ ] `backup --help` documents `--target`, `--yes`, and `--help`
- [ ] `uninstall --help` documents `--target`, `--backup`, `--yes`, and `--help`
- [ ] Existing install/help text is clearer than the current flat block

### Dependencies

- Stage 1 command signatures must be fixed first

## Stage 3 — Route help before lifecycle or install execution

### Tasks

1. Update `runCli()` so help dispatch happens before:
   - manifest-required update validation
   - selection-override validation
   - TTY checks
   - install planning
2. Ensure non-help `backup` and `uninstall` invocations stop with a clear placeholder error instead of falling into install/update behavior.
3. Keep command dispatch thin so later phases can plug backup/uninstall execution in without reworking help handling.

### Acceptance criteria

- [ ] `make-docs --help` exits before install/update-specific validation
- [ ] `make-docs backup --help` and `make-docs uninstall --help` work before lifecycle execution exists
- [ ] Non-help `backup` and `uninstall` invocations fail with an intentional placeholder error
- [ ] No lifecycle command falls through into install/update planning

### Dependencies

- Stages 1 and 2

## Stage 4 — Add focused CLI tests

### Tasks

1. Extend `packages/cli/tests/cli.test.ts` for the new help and parser surface.
2. Add assertions that top-level help includes all four commands and sectioned output.
3. Add command-specific help assertions for `backup` and `uninstall`.
4. Add parser tests for invalid flag mixes, including:
   - `make-docs backup --no-skills`
   - `make-docs uninstall --optional-skills decompose-codebase`
   - `make-docs init --permissions confirm`
   - `make-docs init --backup`
5. Run targeted CLI tests and then the full suite.

### Acceptance criteria

- [ ] `packages/cli/tests/cli.test.ts` covers top-level help and all four command-specific help screens
- [ ] Explicit `backup` and `uninstall` command parsing is covered
- [ ] Invalid cross-command flag combinations are covered
- [ ] `npm test -w make-docs -- tests/cli.test.ts` passes
- [ ] `npm test -w make-docs` passes

### Dependencies

- Stages 1-3
