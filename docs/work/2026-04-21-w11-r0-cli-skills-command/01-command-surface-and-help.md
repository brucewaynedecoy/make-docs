# Phase 1: Command Surface and Help

> Derives from [Phase 1 of the plan](../../plans/2026-04-21-w11-r0-cli-skills-command/01-command-surface-and-help.md).

## Purpose

Add `make-docs skills` as a first-class top-level command before planner, UI, and validation work depends on it.

## Overview

This phase owns command parsing, command-specific flag validation, and help output. It should not implement the full skills-only planner beyond routing to a placeholder or command runner boundary that later phases can fill.

## Source PRD Docs

- None. This backlog is derived from a design and implementation plan; no active PRD namespace exists for this repo change.

## Source Plan Phases

- [01-command-surface-and-help.md](../../plans/2026-04-21-w11-r0-cli-skills-command/01-command-surface-and-help.md)

## Stage 1 - Extend the command model

### Tasks

1. Update `packages/cli/src/cli.ts` so the command union includes `skills`.
2. Detect `skills` in the same top-level command position as `reconfigure`, `backup`, and `uninstall`.
3. Preserve bare `make-docs` as the normal apply/sync path.
4. Preserve existing `reconfigure`, `backup`, and `uninstall` dispatch behavior.

### Acceptance criteria

- [ ] `make-docs skills` is recognized as a top-level command.
- [ ] Bare `make-docs` still enters the apply/sync path.
- [ ] `reconfigure`, `backup`, and `uninstall` still dispatch to their existing paths.
- [ ] No root-level `--skills` option is added.

### Dependencies

- None.

## Stage 2 - Add skills command option parsing

### Tasks

1. Add a skills command options shape that carries `targetDir`, `dryRun`, `yes`, `remove`, `noCodex`, `noClaudeCode`, `skillScope`, and `optionalSkills`.
2. Parse `--remove` only for `make-docs skills`.
3. Reuse existing parsing and validation for `--skill-scope project|global`.
4. Reuse existing parsing and validation for `--optional-skills <csv|none>`.
5. Reuse existing harness flags `--no-codex` and `--no-claude-code`.

### Acceptance criteria

- [ ] `make-docs skills --remove` parses as removal mode.
- [ ] `make-docs skills --skill-scope global` parses.
- [ ] `make-docs skills --optional-skills decompose-codebase` parses.
- [ ] `make-docs skills --no-codex` and `--no-claude-code` parse.
- [ ] `--remove` outside `make-docs skills` fails clearly.

### Dependencies

- Stage 1.

## Stage 3 - Enforce skills command flag boundaries

### Tasks

1. Reject content-selection flags under `make-docs skills`: `--no-designs`, `--no-plans`, `--no-prd`, `--no-work`, `--no-prompts`, `--templates`, and `--references`.
2. Reject `make-docs skills --remove --optional-skills ...`.
3. Keep lifecycle-only validation such as `--backup` uninstall-only unchanged.
4. Keep optional skill id validation using the existing remote registry metadata.

### Acceptance criteria

- [ ] `make-docs skills --no-designs` fails with a skills-command-specific message.
- [ ] `make-docs skills --templates all` fails clearly.
- [ ] `make-docs skills --remove --optional-skills decompose-codebase` fails clearly.
- [ ] Unknown optional skill ids still fail with the valid optional skill list.
- [ ] Existing lifecycle invalid flag tests continue to pass.

### Dependencies

- Stage 2.

## Stage 4 - Add help output

### Tasks

1. Update top-level help so `skills` appears in the command list.
2. Add `make-docs skills --help`.
3. Group skills help into usage, general options, platform options, skill options, and examples.
4. Include sync, dry-run, removal, and global-scope examples.
5. Ensure no help surface advertises root-level `--skills`.

### Acceptance criteria

- [ ] `make-docs --help` lists `skills`.
- [ ] `make-docs skills --help` renders the skills command summary and usage.
- [ ] Skills help documents `--remove`.
- [ ] Skills help documents accepted platform and skill flags.
- [ ] Help text does not mention root-level `--skills`.

### Dependencies

- Stages 1-3.

## Stage 5 - Add parser and help tests

### Tasks

1. Add `packages/cli/tests/cli.test.ts` coverage for `skills` command recognition.
2. Add valid skills flag parsing tests.
3. Add invalid content-flag tests for `skills`.
4. Add `--remove --optional-skills` rejection tests.
5. Add top-level and command-specific help assertions.

### Acceptance criteria

- [ ] Parser tests cover the `skills` command.
- [ ] Help tests cover `make-docs skills --help`.
- [ ] Invalid flag boundaries are tested.
- [ ] `make-docs --skills` is tested as invalid.
- [ ] Targeted CLI tests pass.

### Dependencies

- Stages 1-4.
