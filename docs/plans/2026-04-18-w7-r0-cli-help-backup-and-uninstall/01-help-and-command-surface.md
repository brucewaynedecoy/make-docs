# Phase 1 — Help and Command Surface

## Objective

Expand the CLI surface from an install/update tool into a fuller lifecycle command shell by registering `backup` and `uninstall`, improving top-level and command-specific help rendering, and validating the new command grammar without yet implementing backup or uninstall execution.

## Depends On

- [2026-04-18-cli-help-backup-and-uninstall.md](../../designs/2026-04-18-cli-help-backup-and-uninstall.md)
- The shipped `packages/cli/src/cli.ts` parser/help flow, which currently supports only `init`, `update`, and one flat `printHelp()` output

This phase is the command-surface foundation for the rest of `w7-r0`. Later phases should build backup auditing, confirmation UX, and uninstall execution on top of the command and help surfaces defined here rather than reworking them.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/cli.ts` | Expand `Command` and `ParsedArgs` for `backup` and `uninstall`, add command-aware flag validation, split help rendering into top-level and command-specific surfaces, and wire explicit placeholder handling for non-help `backup`/`uninstall` invocations. |
| `packages/cli/tests/cli.test.ts` | Add parser/help coverage for top-level help, `init`/`update` help, `backup`/`uninstall` help, new command recognition, and invalid cross-command flag combinations. |

## Detailed Changes

### 1. Expand the command grammar without changing execution semantics yet

The current parser only recognizes `init` and `update`. Extend that surface so the first positional command may also be:

- `backup`
- `uninstall`

Keep the current implicit command inference only for install flows:

- no explicit command + manifest present => `update`
- no explicit command + no manifest => `init`

Do not infer `backup` or `uninstall`.

Extend `ParsedArgs` with the new command-surface fields needed by later phases:

- `permissions?: "confirm" | "allow-all"`
- `backup: boolean` for `uninstall --backup`

Parse and validate:

- `starter-docs backup [--target <dir>] [--permissions confirm|allow-all] [--help]`
- `starter-docs uninstall [--target <dir>] [--backup] [--permissions confirm|allow-all] [--help]`

Validation rules for this phase:

- `--backup` is only valid with `uninstall`
- `--permissions` is only valid with `backup` or `uninstall`
- install-selection flags remain valid only for `init` and `update --reconfigure`
- `--reconfigure` remains invalid outside `update`

For explicit `backup` and `uninstall` invocations without `--help`, do not implement lifecycle behavior yet. Instead, stop with a clear not-yet-implemented error so the command surface can land before the audit engine and execution phases.

### 2. Replace the flat help block with structured help screens

Replace the single flat `printHelp()` output with a command-aware help renderer that supports:

- top-level help for `starter-docs --help`
- command-specific help for:
  - `starter-docs init --help`
  - `starter-docs update --help`
  - `starter-docs backup --help`
  - `starter-docs uninstall --help`

The top-level help screen should include:

- a short CLI purpose statement
- a `Commands` section with one-line summaries for `init`, `update`, `backup`, and `uninstall`
- a `Common patterns` or `Examples` section with a few representative commands
- a short note that command-specific help is available via `<command> --help`

The command-specific help screens should use one consistent layout:

- short command summary
- `Usage`
- grouped `Options`
- compact `Examples`

Help wording should be updated while the surface is being rewritten:

- keep canonical harness flags (`--no-claude-code`, `--no-codex`) and note deprecated aliases once
- explain `--skill-scope` and `--optional-skills` more clearly than the current flat output
- describe `--permissions` in terms of confirmation behavior, not internal implementation
- describe `--backup` as “create a backup before removing files”

This phase should keep help rendering in `cli.ts`; no separate renderer module is needed yet.

### 3. Dispatch help before install/update-only logic

Update `runCli()` so help handling is command-aware and returns before unrelated workflow checks.

Required behavior:

- `starter-docs --help` prints the top-level help and exits
- `starter-docs init --help` and `starter-docs update --help` print the matching command help and exit
- `starter-docs backup --help` and `starter-docs uninstall --help` print the matching command help and exit

Help dispatch must happen before:

- manifest-required update validation
- selection-override validation
- TTY checks
- install planning

This ensures the new lifecycle commands have stable, discoverable help output even before their execution phases exist.

### 4. Lock the parser and help surface with CLI tests

Add focused `cli.test.ts` coverage for:

- top-level help includes the four commands and a structured section layout
- `init --help` and `update --help` still show install/reconfigure flags
- `backup --help` documents `--target`, `--permissions`, and `--help`
- `uninstall --help` documents `--target`, `--backup`, `--permissions`, and `--help`
- explicit `backup` and `uninstall` commands are recognized by the parser
- non-help `backup` and `uninstall` invocations fail with the deliberate placeholder error instead of falling into install/update behavior
- invalid flag mixes fail clearly, for example:
  - `starter-docs backup --no-skills`
  - `starter-docs uninstall --optional-skills decompose-codebase`
  - `starter-docs init --permissions confirm`
  - `starter-docs init --backup`

Do not add tests for audit output, confirmation prompts, backup directory naming, or deletion behavior in this phase. Those belong to later phases once the lifecycle engine exists.

## Parallelism

- `cli.ts` command grammar and validation work can proceed in parallel with help-text drafting once the public command signatures are fixed.
- `cli.test.ts` can be written after the final help section names and placeholder error text are chosen.

There is no expected overlap with manifest, planner, installer, backup, or uninstall execution logic in this phase.

## Acceptance Criteria

- [ ] `Command` recognizes `init`, `update`, `backup`, and `uninstall`
- [ ] `starter-docs --help` prints structured top-level help with command summaries and examples
- [ ] `starter-docs init --help` and `starter-docs update --help` print command-specific help
- [ ] `starter-docs backup --help` and `starter-docs uninstall --help` print command-specific help
- [ ] `backup` and `uninstall` command grammar accepts `--target`, `--permissions`, and `--help`
- [ ] `uninstall` command grammar accepts `--backup`
- [ ] `--permissions` is rejected outside `backup` and `uninstall`
- [ ] `--backup` is rejected outside `uninstall`
- [ ] install-selection flags remain rejected for `backup` and `uninstall`
- [ ] non-help `backup` and `uninstall` invocations fail with a clear placeholder error instead of unknown-argument or install/update behavior
- [ ] `npm test -w starter-docs -- tests/cli.test.ts` passes
- [ ] `npm test -w starter-docs` passes
