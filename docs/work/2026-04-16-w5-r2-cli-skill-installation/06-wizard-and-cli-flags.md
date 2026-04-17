# Phase 6: Wizard Harness Step, Skills+Scope Step, CLI Flags, Backward-Compat Aliases

> Derives from [Phase 6 of the plan](../../plans/2026-04-16-w5-r2-cli-skill-installation/06-wizard-and-cli-flags.md).

## Purpose

Restructure the interactive wizard to add harness selection and skills+scope steps, remove the deprecated instruction-kinds prompt, introduce renamed CLI flags with backward-compatible aliases, and update help text. Depends on Phase 1 (harness types, `InstallSelections` shape) and Phase 2 (registry loader for skills context).

## Overview

Seven stages across `wizard.ts` and `cli.ts`. Stages 1-4 modify the wizard flow (harness step, instruction-kinds removal, skills+scope step, review summary). Stages 5-7 modify the CLI (new flags with aliases, resolveSelections/hasSelectionOverrides wiring, printHelp update). Stage 8 builds and tests. Stages 1-4 and 5-7 can run in parallel; Stage 8 depends on all prior stages.

## Source Plan Phases

- [06-wizard-and-cli-flags.md](../../plans/2026-04-16-w5-r2-cli-skill-installation/06-wizard-and-cli-flags.md)

## Stage 1 — Add harness step to wizard

### Tasks

1. In `wizard.ts`, insert a new `multiselect` prompt between the capabilities step and the options step.
2. Use `"Claude Code"` and `"Codex"` as choices with values `"claude-code"` and `"codex"`, including hint text (`CLAUDE.md + .claude/` and `AGENTS.md + .agents/`).
3. Set `initialValues` from `HARNESSES.filter((h) => selections.harnesses[h])`.
4. Add validation requiring at least one harness selected; re-prompt if empty.
5. Map the result array back to `selections.harnesses`, setting each key to `true`/`false` based on inclusion.

### Acceptance criteria

- [ ] Wizard flow inserts a harness step between capabilities and options
- [ ] Multiselect offers Claude Code and Codex with hint text
- [ ] At least one harness must be selected (validation enforced)
- [ ] Result correctly maps to `selections.harnesses` object

### Dependencies

- Phase 1 (`01-type-system-and-harness-model.md`) — `Harness` const, `HARNESSES`, `harnesses` field in `InstallSelections`

## Stage 2 — Remove instruction-kinds from options step

### Tasks

1. Remove the instruction-kinds multiselect prompt from `promptForOptions`.
2. Remove `instructionKinds` from the `WizardOptionSelections` interface.
3. Remove instruction-kinds entries from `OPTION_METADATA` if present.
4. Remove instruction-kinds handling from `getWizardOptionSelections` and `applyWizardOptionSelections`.

### Acceptance criteria

- [ ] `WizardOptionSelections` no longer includes `instructionKinds`
- [ ] Options step prompts only for prompts, templates mode, and references mode
- [ ] No references to instruction-kinds remain in wizard option logic

### Dependencies

- Phase 1 (`01-type-system-and-harness-model.md`) — instruction-kinds replaced by harness model

## Stage 3 — Add skills+scope step to wizard

### Tasks

1. Add a `confirm` prompt after the options step: `"Install agent skills?"` with `active: "Yes"`, `inactive: "No"`, and `initialValue: selections.skills`.
2. If the user confirms, add a `select` prompt for skill scope with `"project"` and `"global"` options, including hint text (`skills live in the repo` and `skills live in ~/.claude or ~/.agents`).
3. Set `initialValue` for scope from `selections.skillScope`.
4. If the user declines skills, skip the scope prompt and preserve the existing `skillScope` value.
5. Write results to `selections.skills` and `selections.skillScope`.

### Acceptance criteria

- [ ] Wizard prompts "Install agent skills?" after options step
- [ ] Accepting triggers the skill scope selection prompt
- [ ] Declining skips the scope prompt and preserves existing skillScope
- [ ] Both `selections.skills` and `selections.skillScope` are correctly set

### Dependencies

- Phase 1 (`01-type-system-and-harness-model.md`) — `skills` and `skillScope` fields in `InstallSelections`
- Phase 2 (`02-registry-and-resolver.md`) — registry loadable for skills context

## Stage 4 — Update review summary

### Tasks

1. In `renderWizardReviewSummary`, add a **Harnesses** line listing selected harness labels (e.g., `Claude Code, Codex` or just `Claude Code`).
2. Add a **Skills** line showing `Yes (project)` / `Yes (global)` / `No` based on `selections.skills` and `selections.skillScope`.
3. Remove the instruction-kinds line from the summary output.

### Acceptance criteria

- [ ] Review summary displays selected harnesses by label
- [ ] Review summary displays skills status with scope when enabled
- [ ] Review summary no longer shows instruction-kinds
- [ ] Summary correctly reflects all combinations (single harness, both harnesses, skills on/off)

### Dependencies

- Stages 1, 2, and 3 (harness and skills selections must be populated)

## Stage 5 — Add new CLI flags and backward-compat aliases

### Tasks

1. In `cli.ts`, update the `ParsedArgs` interface: replace `noClaude` with `noClaudeCode: boolean` and `noAgents` with `noCodex: boolean`; add `noSkills: boolean` and `skillScope: "project" | "global" | undefined`.
2. In `parseArgs` switch, add `case "--no-claude-code":` and `case "--no-claude":` (alias) both setting `parsed.noClaudeCode = true`.
3. Add `case "--no-codex":` and `case "--no-agents":` (alias) both setting `parsed.noCodex = true`.
4. Add `case "--no-skills":` setting `parsed.noSkills = true`.
5. Add `case "--skill-scope":` consuming the next argument as `parsed.skillScope`.

### Acceptance criteria

- [ ] `ParsedArgs` has `noClaudeCode`, `noCodex`, `noSkills`, and `skillScope` fields
- [ ] `--no-claude-code` and `--no-claude` both set `noClaudeCode = true`
- [ ] `--no-codex` and `--no-agents` both set `noCodex = true`
- [ ] `--no-skills` sets `noSkills = true`
- [ ] `--skill-scope project` and `--skill-scope global` set `skillScope` correctly

### Dependencies

- Phase 1 (`01-type-system-and-harness-model.md`) — harness field names in `InstallSelections`

## Stage 6 — Wire flags into resolveSelections and hasSelectionOverrides

### Tasks

1. In `resolveSelections`, apply: `if (parsed.noClaudeCode) selections.harnesses["claude-code"] = false`.
2. Apply: `if (parsed.noCodex) selections.harnesses["codex"] = false`.
3. Apply: `if (parsed.noSkills) selections.skills = false`.
4. Apply: `if (parsed.skillScope) selections.skillScope = parsed.skillScope`.
5. Remove old `noClaude` / `noAgents` application logic for `instructionKinds`.
6. In `hasSelectionOverrides`, add `parsed.noClaudeCode`, `parsed.noCodex`, `parsed.noSkills`, and `parsed.skillScope !== undefined` to the boolean-or expression.

### Acceptance criteria

- [ ] `resolveSelections` applies all four new flags to selections
- [ ] Old `noClaude`/`noAgents` instruction-kinds logic is removed
- [ ] `hasSelectionOverrides` returns `true` for each new flag individually
- [ ] Combined flags apply correctly (e.g., `--no-codex --no-skills --skill-scope global`)

### Dependencies

- Stage 5 (flag parsing must be in place)

## Stage 7 — Update printHelp

### Tasks

1. Replace existing `--no-claude` and `--no-agents` lines in `printHelp` with new flag names.
2. Add help entries:
   - `--no-claude-code   Skip Claude Code harness (alias: --no-claude)`
   - `--no-codex         Skip Codex harness (alias: --no-agents)`
   - `--no-skills        Skip skill installation`
   - `--skill-scope <s>  Skill scope: project (default) or global`
3. Verify alignment and formatting match existing help text style.

### Acceptance criteria

- [ ] `printHelp` lists `--no-claude-code` with alias note
- [ ] `printHelp` lists `--no-codex` with alias note
- [ ] `printHelp` lists `--no-skills`
- [ ] `printHelp` lists `--skill-scope` with value description
- [ ] Old flag names (`--no-claude`, `--no-agents`) no longer appear as primary entries

### Dependencies

- Stage 5 (flags must exist to document them)

## Stage 8 — Build and test

### Tasks

1. Run `npm run build -w starter-docs` — verify compilation succeeds with zero type errors.
2. Run `npm test -w starter-docs` — verify all existing tests pass with no regressions.
3. Manual smoke test: run the wizard and confirm the new flow (Capabilities -> Harnesses -> Options -> Skills -> Review).
4. Manual smoke test: run with `--no-claude-code --no-skills` and verify selections resolve correctly without entering the wizard.

### Acceptance criteria

- [ ] `npm run build -w starter-docs` succeeds with zero type errors
- [ ] `npm test -w starter-docs` passes
- [ ] Wizard flow follows Capabilities -> Harnesses -> Options -> Skills -> Review
- [ ] CLI flags and aliases resolve correctly in non-interactive mode

### Dependencies

- Stages 1-7 (all source changes complete)
