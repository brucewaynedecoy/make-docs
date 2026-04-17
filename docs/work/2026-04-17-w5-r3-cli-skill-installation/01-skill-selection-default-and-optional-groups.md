# Phase 1: Skill Selection Default and Optional Groups

## Purpose

Implement the grouped wizard skill-selection flow so required skills count as part of the answer, optional skills remain truly optional, and persisted install semantics stay unchanged.

## Overview

This phase is intentionally narrow. It updates the wizard from an optional-only multiselect into a grouped skill-selection step, preserves the existing `optionalSkills` storage model, and adds regression coverage for the required-only continuation path.

## Source PRD Docs

- [CLI Skill Installation R3 - Optional Skill Selection UX Fix Plan](../../plans/2026-04-17-w5-r3-cli-skill-installation/01-skill-selection-default-and-optional-groups.md)
- [CLI Skill Selection Default and Optional Groups](../../designs/2026-04-17-cli-skill-selection-default-and-optional-groups.md)

## Stage 1 - Grouped skill-choice helper and state

### Tasks

1. Add a helper in `packages/cli/src/skill-catalog.ts` that exposes the wizard-facing required/default and optional skill groupings from the current registry model.
2. Reuse the existing `required` registry semantics instead of changing the registry schema or persisted selection shape.
3. Keep ordering deterministic so the wizard renders stable `Default` and `Optional` groups across runs.
4. Add focused helper-level coverage in `packages/cli/tests/skill-catalog.test.ts`.

### Acceptance criteria

- The wizard-facing helper returns separate required/default and optional groupings.
- Required skills are not represented as user-toggleable optional selections.
- The grouped data preserves deterministic ordering and existing skill descriptions.
- No registry, planner, install, or manifest behavior changes are introduced in this stage.

### Dependencies

- The shipped `w5-r2` skill registry remains the source of truth for required vs optional skills.

## Stage 2 - Wizard grouped skill-selection prompt

### Tasks

1. Update `packages/cli/src/wizard.ts` so the prompt title reads `Which skills should be installed?`
2. Render all required skills under a `Default` heading as selected and read-only.
3. Render all optional skills under an `Optional` heading as user-selectable.
4. Allow the wizard to continue when zero optional skills are selected if the required/default skills are present.
5. Skip the grouped skill-selection prompt entirely when there are no optional skills to present.
6. Preserve the downstream review/apply flow so only optional selections are stored in `optionalSkills`.

### Acceptance criteria

- The wizard no longer blocks submission solely because no optional skills were chosen.
- Required/default skills are visible in the prompt, shown as selected, and cannot be toggled off.
- Optional skills remain selectable and unselected by default unless already present in selections.
- The stored `optionalSkills` value still contains only optional skill ids.
- Review output and downstream install behavior continue to auto-install required skills without schema changes.

### Dependencies

- Stage 1 grouped helper/state is available for the wizard prompt.

## Stage 3 - Regression tests and validation

### Tasks

1. Add wizard coverage in `packages/cli/tests/wizard.test.ts` for grouped rendering, required-only continuation, optional preselection, and the no-optional-skills skip path.
2. Confirm helper behavior in `packages/cli/tests/skill-catalog.test.ts` for required/default vs optional grouping.
3. Run `npm test -w starter-docs -- tests/wizard.test.ts tests/skill-catalog.test.ts`.
4. Run `npm test -w starter-docs`.
5. Run `npm run dev -w starter-docs -- init --dry-run` and verify the user can proceed with only the default skills selected.

### Acceptance criteria

- Targeted wizard and skill-catalog tests pass.
- The full `starter-docs` test suite passes without regression.
- Manual dry-run verification confirms the grouped screen allows continuation with only default skills selected.
- The prompt text, grouping, and submit behavior match the approved design and plan docs.

### Dependencies

- Stages 1 and 2 are complete.
