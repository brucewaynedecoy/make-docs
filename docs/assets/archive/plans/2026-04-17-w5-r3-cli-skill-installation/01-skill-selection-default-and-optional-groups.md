# Phase 1 — Skill Selection Default and Optional Groups

## Objective

Replace the wizard’s optional-only skill multiselect with a grouped skill-selection step that accurately displays required and optional skills, allows default-only acceptance, and preserves the existing persisted selection model.

## Depends On

- [2026-04-17-cli-skill-selection-default-and-optional-groups.md](../../designs/2026-04-17-cli-skill-selection-default-and-optional-groups.md)
- The shipped `w5-r2` registry/install behavior where required skills are auto-installed independently of `optionalSkills`

This is a single-phase change plan with no upstream execution phases inside `w5-r3`.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/skill-catalog.ts` | Add a grouped skill-choice helper for wizard use so required/default and optional skills can be rendered together in deterministic order. |
| `packages/cli/src/wizard.ts` | Replace the current optional-only skill picker with a grouped prompt titled `Which skills should be installed?`, render `Default` and `Optional` sections, keep required skills read-only, and allow submission with zero optional selections. |
| `packages/cli/tests/wizard.test.ts` | Add regression coverage for grouped rendering, required-only continuation, optional preselection, and the no-optional-skills edge case. |
| `packages/cli/tests/skill-catalog.test.ts` | Add helper-level coverage for required vs optional grouping and stable sort behavior. |

## Detailed Changes

### 1. Add grouped wizard skill-choice state

The current helper surface in `skill-catalog.ts` only exposes `getOptionalSkillChoices()`, which is too narrow for the desired UX.

Add a grouped helper for the wizard that returns:

- required/default skills
- optional skills

The returned shape should be display-ready and deterministically sorted. It should expose enough information for the wizard to render:

- section membership (`Default` vs `Optional`)
- skill name
- description
- whether the row is selected by default
- whether the row is toggleable

Constraints:

- Do not change the registry schema.
- Do not change the meaning of `InstallSelections.optionalSkills`.
- Required skills remain registry-derived, not user-persisted.

### 2. Replace the optional-only wizard prompt

In `promptForOptions()` inside `wizard.ts`, replace the current optional-only multiselect:

- old title: `Which optional skills should be installed?`
- new title: `Which skills should be installed?`

The new screen should render two groups:

- `Default`
- `Optional`

Behavior:

- `Default` rows are shown selected and read-only.
- `Optional` rows are toggleable and initialize from `options.optionalSkills`.
- If the user selects no optional skills, the prompt still accepts submission as long as one or more required/default skills exist.
- If there are no optional skills at all, skip the skill-selection prompt entirely and preserve `optionalSkills = []`.

Implementation guidance:

- Prefer a custom prompt/state path over the stock `multiselect` if grouped headings and selected disabled rows are not representable cleanly with the current prompt component.
- Keep the persisted result limited to optional skill ids only.
- Do not add required skills into `WizardOptionSelections.optionalSkills`.

### 3. Preserve review and downstream semantics

The downstream planner/install path already treats required skills correctly, so this phase should not modify:

- registry parsing
- install planning
- manifest migration
- non-interactive `--optional-skills` behavior

The wizard’s review/apply path should continue to work with:

- default-only skill acceptance
- optional skill acceptance
- no-optional-skill registries

Review-summary wording may remain unchanged unless a tiny follow-on polish is needed during implementation.

### 4. Add focused regression coverage

Add tests that confirm:

- the grouped helper returns required and optional skills separately
- required skills are present in wizard state as default/read-only rows
- the prompt accepts a result with zero optional selections
- `optionalSkills` remains `[]` when the user accepts only default skills
- optional skills remain preselected when already present in `optionalSkills`
- required skills cannot be toggled off through the prompt state
- the skill-selection prompt is skipped when there are no optional skills to choose from

No new CLI-flag tests are required unless the implementation changes shared wizard state in a way that affects the existing non-interactive paths.

## Parallelism

- `skill-catalog.ts` helper work can be done independently first.
- `wizard.ts` prompt/state work depends on the grouped helper shape.
- `wizard.test.ts` and `skill-catalog.test.ts` can be completed in parallel once the helper and prompt interfaces are stable.

There is no expected overlap with installer, planner, manifest, or CLI-flag surfaces.

## Acceptance Criteria

- [ ] The interactive skill-selection step asks `Which skills should be installed?`
- [ ] Required skills are shown under `Default`
- [ ] Default skills are visibly selected and non-toggleable
- [ ] Optional skills are shown under `Optional` and remain selectable
- [ ] The wizard can continue with zero optional skills selected when required skills exist
- [ ] `InstallSelections.optionalSkills` stores only optional skill ids
- [ ] Required skills are not copied into `optionalSkills`
- [ ] The prompt is skipped when there are no optional skills in the registry
- [ ] `npm test -w make-docs -- tests/wizard.test.ts tests/skill-catalog.test.ts` passes
- [ ] `npm test -w make-docs` passes
- [ ] Manual `init --dry-run` verification confirms the screen no longer makes optional skills effectively required
