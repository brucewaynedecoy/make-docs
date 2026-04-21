# CLI Skill Installation R3 — Optional Skill Selection UX Fix Plan

## Purpose

Implement the follow-on wizard UX correction designed in [2026-04-17-cli-skill-selection-default-and-optional-groups.md](../../designs/2026-04-17-cli-skill-selection-default-and-optional-groups.md). This is **Wave 5 Revision 3** (`w5-r3`): a narrow revision of the shipped `w5-r2` skill-installation flow so the interactive skill-selection screen accurately represents required vs optional skills and no longer blocks users from proceeding with only the default required skill set.

## Objective

- The wizard asks `Which skills should be installed?` instead of `Which optional skills should be installed?`
- Required registry skills are shown under `Default`, visibly selected, and read-only.
- Optional registry skills are shown under `Optional` and remain user-selectable.
- The user can continue with zero optional skills selected when required skills already satisfy the screen.
- `InstallSelections.optionalSkills` continues to persist only optional skill ids.
- The skill-selection prompt is skipped entirely when there are no optional skills to choose from.
- Focused regression coverage prevents the optional-skill prompt from becoming effectively required again.

## Phase Map

| File | Purpose |
| ---- | ------- |
| `01-skill-selection-default-and-optional-groups.md` | Add grouped skill-choice state, replace the optional-only wizard prompt, and add focused regression coverage for required-only acceptance and no-optional edge cases. |

## Dependencies

- [2026-04-17-cli-skill-selection-default-and-optional-groups.md](../../designs/2026-04-17-cli-skill-selection-default-and-optional-groups.md) is the source of truth for the UX change.
- The shipped `w5-r2` registry model already distinguishes required and optional skills, so no schema or manifest migration work is needed.
- The current implementation surfaces live primarily in [packages/cli/src/wizard.ts](../../../packages/cli/src/wizard.ts), [packages/cli/src/skill-catalog.ts](../../../packages/cli/src/skill-catalog.ts), and [packages/cli/tests/wizard.test.ts](../../../packages/cli/tests/wizard.test.ts).
- This revision stays within the existing `cli-skill-installation` wave family, so it keeps `w5` and increments the revision from `r2` to `r3`.

## Validation

1. `npm test -w make-docs -- tests/wizard.test.ts tests/skill-catalog.test.ts`
2. `npm test -w make-docs`
3. `npm run dev -w make-docs -- init --dry-run` and confirm the skill-selection screen allows continuing with only the default required skill(s) selected.
4. Manual spot-check that the prompt still renders optional skills as selectable while leaving required skills read-only.
