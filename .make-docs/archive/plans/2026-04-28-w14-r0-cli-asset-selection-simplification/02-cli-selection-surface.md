# Phase 2 - CLI Selection Surface

## Objective

Remove prompt/template/reference asset choices from the user-facing CLI selection surface while preserving the rest of the interactive wizard and review behavior.

## Depends On

- Phase 1 PRD requirement
- Current wizard state machine in `packages/cli/src/wizard.ts`
- Current CLI parsing/help behavior in `packages/cli/src/cli.ts`

## Files To Modify

Expected:

- `packages/cli/src/wizard.ts`
- `packages/cli/tests/wizard.test.ts`

Possible after discovery:

- `packages/cli/src/cli.ts`
- `packages/cli/tests/cli.test.ts`
- `packages/cli/src/README.md`
- `packages/cli/README.md`
- root `README.md`

## Detailed Changes

### 1. Shorten `promptForOptions`

Remove the three prompt calls for:

- `Install starter prompts?`
- `Which document templates should be installed?`
- `Which reference files should be installed?`

The options step should still collect:

- `Install agent skills?`
- skill scope when skills are enabled
- optional skills when optional choices are available

The returned `WizardOptionSelections` should not carry prompt/template/reference asset fields after Phase 3 removes them from active selection state.

### 2. Remove invariant rows from `renderWizardReviewSummary`

Drop review rows derived from:

- `OPTION_METADATA.prompts`
- `OPTION_METADATA.templatesMode`
- `OPTION_METADATA.referencesMode`

The `Options` section should keep user-controlled values:

- harnesses
- skills
- optional skills
- skill scope where currently shown through the skills summary

### 3. Review option metadata usage

Inspect `OPTION_METADATA` and any help strings or labels tied only to prompt/template/reference choices.

If entries are no longer used anywhere after Phase 2 and Phase 3, remove them. Any remaining references should be limited to stale-manifest validation, removed-flag tests, docs, or history.

### 4. Settle non-interactive asset flag behavior

The code currently has selection override paths for prompt/template/reference asset controls. The approved alpha policy is to remove those public asset override flags and encode that behavior in tests:

- `--no-prompts` is rejected as an unknown argument.
- `--templates` is rejected as an unknown argument.
- `--references` is rejected as an unknown argument.
- help output no longer advertises those flags.

The implementation should not silently narrow asset installation in response to legacy asset flags.

### 5. Preserve wizard review checkpoint semantics

Do not collapse the wizard review step into the generic apply confirmation.

The existing review loop can still return to capabilities, harnesses, or options. The only change is that returning to options no longer exposes prompt/template/reference asset choices.

## Parallelism

This phase can be owned by one CLI surface worker. It can run after Phase 1 and in parallel with Phase 3 if the workers agree on the reduced `WizardOptionSelections` shape before editing shared types.

## Acceptance Criteria

- The three removed question strings no longer appear in wizard execution paths.
- Review output no longer includes prompt/template/reference rows.
- Remaining wizard choices still work: capabilities, harnesses, skills, skill scope, optional skills, and review navigation.
- Public legacy asset flags are rejected as unknown arguments and cannot reduce the installed asset set.
- Wizard tests cover the shorter options step and review summary.
