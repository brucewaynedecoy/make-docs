# CLI Skill Selection Simplification

> Filename: `2026-04-28-cli-skill-selection-simplification.md`. See `docs/assets/references/design-contract.md` for naming and structural rules.

## Purpose

Remove the required-versus-optional skill distinction from the CLI and make the skill install screen reflect the product direction that all shipped skills are recommended, selected by default, and individually deselectable.

This design covers both the interactive screen copy and the underlying registry, selection, manifest, and compatibility shape needed to stop treating some skills as immutable defaults.

## Context

The current CLI skill model still carries the `w5-r2` distinction between required and optional skills:

- `packages/cli/skill-registry.json` marks `archive-docs` as `"required": true` and `decompose-codebase` as `"required": false`.
- `packages/cli/skill-registry.schema.json` requires the `required` boolean on every registry entry.
- `SkillRegistryEntry` includes `required: boolean`, and `getRequiredSkills()` / `getOptionalSkills()` split the registry into separate groups.
- `getDesiredSkillAssets()` always installs required skills and only installs entries listed in `InstallSelections.optionalSkills`.
- The wizard builds `defaultSkills` and `optionalSkills`, inserts disabled `Default` and `Optional` headings, and treats default skill rows as non-toggleable.
- The skill detail panel currently shows `Group: Default` or `Group: Optional` and the footer says `Default skills are installed automatically and cannot be changed here.`

That model no longer matches the desired UX. Users should see a single list of recommended skills on the `Select skills to install` screen. Every listed skill should start selected, but none should be mandatory from that screen. The existing highlighted-skill description panel should remain, as should the bottom section showing the current selection and keyboard instructions.

This is closely related to [2026-04-16-cli-skill-installation-r2.md](2026-04-16-cli-skill-installation-r2.md), which documented the shipped remote registry and harness-aware skill installation model, and to [2026-04-28-cli-asset-selection-simplification.md](2026-04-28-cli-asset-selection-simplification.md), which removes stale choices from the same CLI interview surface.

## Decision

### 1. Replace grouped skill selection with one recommended list

The `Select skills to install` screen should render one list of skills. It should not show `Default` or `Optional` headings, and it should not visually classify any row as immutable.

All skill rows should be selected by default when skills are enabled. Users may deselect any row before confirming.

The screen should preserve:

- the highlighted skill detail panel with the skill name and description
- the bottom selection summary that shows which skills are selected for install
- the keyboard instructions for navigation, toggling, and confirmation

The bottom section should remove the note:

```text
Default skills are installed automatically and cannot be changed here.
```

The detail panel should stop showing `Group: Default` or `Group: Optional`. If the detail panel still needs status text, use selection-state language such as `Selected` or `Available`, not category language.

### 2. Remove required/optional metadata from the registry contract

The skill registry should describe installable recommended skills, not skill obligation classes.

Remove `required` from:

- `packages/cli/skill-registry.json`
- `packages/cli/skill-registry.schema.json`
- `SkillRegistryEntry`
- registry validation logic
- helper functions that only exist to split required and optional skills

The retained registry fields should continue to describe what is needed to resolve and install a skill:

- `name`
- `source`
- `entryPoint`
- `installName`
- `description`
- `assets`

If a future skill truly becomes non-disableable, that should be introduced as a new product decision with explicit UX language. It should not be smuggled back through the old optional-skill terminology.

### 3. Persist selected skills, not optional skills

Replace the user-facing and persisted `optionalSkills` concept with a selection model that can represent any subset of recommended skills.

Follow-on implementation should introduce a field such as:

```ts
selectedSkills: string[];
```

The install planner should install entries whose names are present in `selectedSkills` when `skills` is enabled. Fresh defaults should set `selectedSkills` to every skill in the registry.

Compatibility migration should deliberately handle existing manifests:

- old `skills: false` remains no skill installation
- old manifests with `skills: true` and `optionalSkills` should migrate to the effective prior installed set: formerly required skills plus the listed optional skills
- after migration, reconfigure defaults may offer all registry skills selected, but should not silently rewrite a user's prior deselections without review

The manifest can still track installed skill file paths through `skillFiles`; that tracks managed outputs and is separate from the user's desired skill selection.

### 4. Rename CLI and review language around skill selection

Interactive and headless UX should stop using `optional` as product vocabulary.

The final review summary should replace labels such as `Optional skills` with `Selected skills`.

Any edit actions such as `Edit optional skills` should become `Edit skills` or `Edit selected skills`.

Headless flags and validation should be revised in planning. The current `--optional-skills <csv|none>` flag no longer names the concept correctly. A replacement such as `--skills <csv|all|none>` or `--selected-skills <csv|all|none>` should be chosen during implementation planning, with old flag support retained as a deprecated compatibility alias if needed.

### 5. Update tests around the new invariant

Follow-on implementation should update wizard, registry, CLI flag, manifest migration, and install-planning tests to prove:

- the skill screen has no `Default` or `Optional` heading rows
- every registry skill is initially selected for fresh installs
- every skill can be deselected from the interactive list
- the highlighted detail panel and bottom selection/instruction section still render
- the old default-skill immutability note is absent
- registry entries no longer require or parse `required`
- old manifests with `optionalSkills` migrate predictably
- install planning uses the selected skill set rather than `required || optional`

## Alternatives Considered

### Keep required skills but hide the headings

Rejected because it would leave a hidden mandatory category in the implementation while the UI implies all rows are peer choices. Users would still be unable to deselect formerly default skills, and the registry would continue encoding metadata the product no longer wants.

### Keep the registry `required` flag as deprecated metadata

Rejected for the target state. The registry should stay close to the CLI's current decision model. Keeping a dead `required` flag would create ambiguity for future skills and test fixtures.

### Treat all existing optional skills as selected but keep `optionalSkills`

Rejected because `optionalSkills` can only represent additions to an implicit required set. The new model needs to represent any subset of recommended skills, including deselecting a skill that used to be required.

### Remove the skill selection screen entirely

Rejected because the user still needs a lightweight way to decide which recommended skills to install. The change is to simplify the grouping and defaults, not to remove user control.

## Consequences

The skill selection experience becomes consistent with the asset-selection simplification direction: the CLI recommends the full managed surface by default while still allowing deliberate omission.

The implementation has a real migration surface. `required`, `optionalSkills`, grouped wizard state, CLI flag naming, review labels, tests, and manifest replay logic all need to move together. The follow-on plan should treat this as a structural model cleanup, not just a text edit in the screen renderer.

Existing installed projects should remain understandable after upgrade. Migration should preserve prior effective installs where possible, while fresh installs and explicit reconfiguration should present all registry skills as selected by default.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [2026-04-16-cli-skill-installation-r2.md](2026-04-16-cli-skill-installation-r2.md), [2026-04-28-cli-asset-selection-simplification.md](2026-04-28-cli-asset-selection-simplification.md)
- Reason: this design revises the shipped skill registry and wizard selection model from required/optional categories into one recommended skill set, and it aligns with the broader simplification of the CLI interview surface.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../prompts/designs-to-plan-change.prompt.md)
- Why: this is a targeted revision to existing CLI skill installation, registry, manifest, and wizard behavior rather than a new baseline planning track.
- Coordinate Handoff: related completed coordinate is `W5 R2` for CLI-managed skill installation. Recommended downstream coordinate is `W14 R0` if planned together with the CLI asset-selection simplification work, otherwise the next available `W14` revision; planner should confirm coordinate availability before writing.
