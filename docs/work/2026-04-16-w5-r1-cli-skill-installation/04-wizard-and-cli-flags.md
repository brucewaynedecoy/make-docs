# Phase 4: Wizard and CLI Flags

> Derives from [Phase 4 of the plan](../../plans/2026-04-16-w5-r1-cli-skill-installation/04-wizard-and-cli-flags.md).

## Purpose

Add skills support to the interactive wizard, CLI argument parsing, help text, and review summary so users can opt in/out of skill installation.

## Overview

Two parallel workstreams across `cli.ts` and `wizard.ts`. Stage 1 adds the `--no-skills` CLI flag and wires it into selection resolution. Stage 2 adds the skills prompt to the interactive wizard, metadata, and review summary. Stage 3 builds and tests after both are complete.

## Source Plan Phases

- [04-wizard-and-cli-flags.md](../../plans/2026-04-16-w5-r1-cli-skill-installation/04-wizard-and-cli-flags.md)

## Stage 1 — Add --no-skills to cli.ts

### Tasks

1. Add `noSkills: boolean` to `ParsedArgs` interface (default `false`).
2. Add `case "--no-skills":` to the `parseArgs` switch statement, setting `parsed.noSkills = true`.
3. In `resolveSelections`, set `selections.skills = false` when `parsed.noSkills` is present.
4. Add `parsed.noSkills` to the `hasSelectionOverrides` boolean-or expression.
5. Update `printHelp` to include `--no-skills` in the init usage line.

### Acceptance criteria

- [ ] `--no-skills` flag parses correctly and sets `noSkills` to `true`
- [ ] `resolveSelections` applies `skills = false` when flag is present
- [ ] `hasSelectionOverrides` returns `true` when `--no-skills` is passed
- [ ] `printHelp` output includes `--no-skills`

### Dependencies

- Phase 2 (`02-cli-types-and-profile.md`) — `skills` boolean must exist in `InstallSelections`

## Stage 2 — Add skills to wizard.ts

### Tasks

1. Add `skills: boolean` to the `WizardOptionSelections` interface.
2. Add a `skills` entry to the `OPTION_METADATA` constant with label, description, and hint text.
3. Add a `confirm` prompt for "Install agent skills?" in `promptForOptions`, after existing prompts.
4. Update `getWizardOptionSelections` to include the `skills` field.
5. Update `applyWizardOptionSelections` to apply the `skills` field to selections.
6. Update `renderWizardReviewSummary` to show skills status (e.g., `Skills: Yes` / `Skills: No`).

### Acceptance criteria

- [ ] `WizardOptionSelections` includes `skills: boolean`
- [ ] `OPTION_METADATA` has a skills entry
- [ ] Wizard prompts "Install agent skills?" during the options step
- [ ] Review summary displays skills status
- [ ] `getWizardOptionSelections` and `applyWizardOptionSelections` handle skills

### Dependencies

- Phase 2 (`02-cli-types-and-profile.md`) — `skills` boolean must exist in `InstallSelections`

## Stage 3 — Build and test

### Tasks

1. Run `npm run build -w starter-docs` — verify compilation succeeds.
2. Run `npm test -w starter-docs` — verify all existing tests pass with no regressions.

### Acceptance criteria

- [ ] Build succeeds
- [ ] All existing tests pass

### Dependencies

- Stages 1 and 2 (all source changes complete)
