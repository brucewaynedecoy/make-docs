# Phase 1 - Command Surface and Help

## Objective

Add `make-docs skills` as a first-class top-level command with skills-specific flags, validation, and help output while keeping the default apply/reconfigure command model unchanged.

## Depends On

- [2026-04-21-cli-skills-command.md](../../designs/2026-04-21-cli-skills-command.md)
- The current command parser, validation helpers, and help renderer in `packages/cli/src/cli.ts`.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/cli.ts` | Add `skills` to the command union, parse `--remove`, dispatch to a skills command runner, reject unrelated content flags, and add `skills --help`. |
| `packages/cli/tests/cli.test.ts` | Add parser, validation, and help coverage for `make-docs skills`. |

## Detailed Changes

### 1. Extend the command model

The public command union should become:

- `reconfigure`
- `skills`
- `backup`
- `uninstall`

Bare `make-docs` remains the normal apply/sync path. `make-docs reconfigure`, `backup`, and `uninstall` keep their existing meanings.

### 2. Add skills command options

Add a command-specific options shape for `skills`:

- `targetDir`
- `dryRun`
- `yes`
- `remove`
- `noCodex`
- `noClaudeCode`
- `skillScope`
- `optionalSkills`

`--remove` is valid only with `make-docs skills`.

### 3. Validate command-specific flag boundaries

For `make-docs skills`, accept:

- `--target <dir>`
- `--dry-run`
- `--yes`
- `--remove`
- `--no-codex`
- `--no-claude-code`
- `--skill-scope project|global`
- `--optional-skills <csv|none>`

Reject these content-selection flags under `skills`:

- `--no-designs`
- `--no-plans`
- `--no-prd`
- `--no-work`
- `--no-prompts`
- `--templates`
- `--references`

Reject `make-docs skills --remove --optional-skills ...` because removal is based on managed skill ownership, not a desired optional skill set.

### 4. Add help output

Top-level help should list `skills` as a command with a one-line description.

`make-docs skills --help` should include:

- command summary
- usage
- general options
- platform options
- skill options
- examples for sync, dry run, removal, and global scope

Do not add or document a root-level `--skills` flag.

## Acceptance Criteria

- [ ] `make-docs skills --help` renders command-specific help.
- [ ] Top-level help lists `skills`.
- [ ] `make-docs --skills` fails as an unknown argument.
- [ ] `make-docs skills --remove` parses as a skills removal run.
- [ ] `make-docs skills --no-designs` and other content flags fail clearly.
- [ ] `make-docs skills --remove --optional-skills decompose-codebase` fails clearly.
- [ ] Existing `reconfigure`, `backup`, and `uninstall` parser behavior is unchanged.
