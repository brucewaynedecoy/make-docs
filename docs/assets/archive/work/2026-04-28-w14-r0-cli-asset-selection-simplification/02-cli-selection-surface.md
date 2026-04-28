# Phase 2: CLI Selection Surface

> Derives from [Phase 2 of the plan](../../plans/2026-04-28-w14-r0-cli-asset-selection-simplification/02-cli-selection-surface.md).

## Purpose

Remove prompt/template/reference asset choices from the user-facing CLI wizard and review surface.

## Overview

This phase owns the interactive CLI behavior. It removes the three obsolete asset prompts, removes their review rows, keeps the remaining wizard flow intact, and decides how legacy non-interactive asset flags behave without allowing them to reduce managed assets.

## Source PRD Docs

- [05 Installation, Profile, and Manifest Lifecycle](../../../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [06 Template Contracts and Generated Assets](../../../../prd/06-template-contracts-and-generated-assets.md)
- [07 CLI Command Surface and Lifecycle](../../../../prd/07-cli-command-surface-and-lifecycle.md)
- Planned change doc: `docs/prd/11-revise-cli-asset-selection-simplification.md`

## Source Plan Phases

- [02-cli-selection-surface.md](../../plans/2026-04-28-w14-r0-cli-asset-selection-simplification/02-cli-selection-surface.md)

## Stage 1 - Shorten the Wizard Options Step

### Tasks

1. Update `packages/cli/src/wizard.ts` so `promptForOptions` no longer asks `Install starter prompts?`.
2. Remove the select prompt for `Which document templates should be installed?`.
3. Remove the select prompt for `Which reference files should be installed?`.
4. Preserve the remaining options behavior for skills, skill scope, and optional skill selection.
5. Return or apply invariant asset values if `WizardOptionSelections` still contains asset fields.

### Acceptance criteria

- [x] Runtime wizard code no longer contains the three removed prompt strings.
- [x] Skills, skill scope, and optional skills remain configurable.
- [x] Cancelling remaining prompts still exits the wizard cleanly.
- [x] The options step can still be reached from review navigation.

### Dependencies

- Phase 1 requirement record.

## Stage 2 - Remove Invariant Rows from Review Summary

### Tasks

1. Update `renderWizardReviewSummary` in `packages/cli/src/wizard.ts`.
2. Remove the row for starter prompts.
3. Remove the row for template mode.
4. Remove the row for reference mode.
5. Keep document type, harness, skills, and optional-skills summary rows.

### Acceptance criteria

- [x] Review output no longer includes prompt inclusion or omission.
- [x] Review output no longer includes template mode.
- [x] Review output no longer includes reference mode.
- [x] Review output still summarizes user-controlled selections.

### Dependencies

- Stage 1.

## Stage 3 - Settle Legacy Asset Flag Behavior

### Tasks

1. Inspect `packages/cli/src/cli.ts` for `--no-prompts`, template mode, and reference mode parsing/help.
2. Apply the alpha implementation policy from the approved plan: remove the legacy asset override flags so they are rejected as unknown arguments.
3. Update help text and validation so public guidance does not advertise asset omission as active behavior.
4. Add or update CLI tests for the chosen policy.

### Acceptance criteria

- [x] Legacy asset flags cannot reduce installed prompt/template/reference assets.
- [x] User-facing guidance explains that included prompts, templates, and references are always managed.
- [x] Tests cover the chosen alpha removal behavior.

### Dependencies

- Stage 1.
- Coordinate with Phase 3 before changing shared selection types.

## Stage 4 - Clean Up Option Metadata

### Tasks

1. Find remaining uses of `OPTION_METADATA.prompts`, `OPTION_METADATA.templatesMode`, and `OPTION_METADATA.referencesMode`.
2. Remove obsolete metadata if it is no longer used after the surface and compatibility decisions.
3. Keep any retained metadata internal and stale-manifest-validation-scoped.
4. Update tests that asserted the old labels or review rows.

### Acceptance criteria

- [x] Obsolete user-facing labels are removed from wizard output.
- [x] Any remaining metadata references are intentional and covered by stale-manifest or removed-flag tests.
- [x] No unrelated option metadata is changed.

### Dependencies

- Stages 1-3.

## Stage 5 - Update Wizard Surface Tests

### Tasks

1. Update `packages/cli/tests/wizard.test.ts` helper fixtures for the shorter options shape.
2. Add a test proving removed asset rows are absent from `renderWizardReviewSummary`.
3. Add or update tests proving review navigation back to options still works.
4. Keep optional-skill tests passing for default-only and optional-skill scenarios.

### Acceptance criteria

- [x] `packages/cli/tests/wizard.test.ts` covers the shorter options step.
- [x] Removed prompt strings are not expected by tests.
- [x] Optional skill behavior remains covered.
- [x] Focused wizard tests pass.

### Dependencies

- Stages 1-4.
