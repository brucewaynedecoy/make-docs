# CLI Skill Selection UX — Default and Optional Groups

## Purpose

Capture the follow-on UX correction for the interactive CLI skill-selection step so the wizard no longer forces the user to choose at least one optional skill. The goal is to make the screen reflect the actual registry model: required skills are always installed when skills are enabled, while optional skills are truly optional.

## Context

The shipped `w5-r2` implementation correctly models skills in the registry as either `required` or optional, and the install pipeline already auto-installs required skills independently of `optionalSkills`.

The current interactive wizard step does not match that model:

- the prompt title asks, `Which optional skills should be installed?`
- the screen only renders optional skills
- the prompt requires at least one selection before the user can continue

That creates a semantic mismatch between configuration and UX. A user who wants only the default required skill set is blocked, even though the underlying install logic already supports that state.

The attached screenshot demonstrates the failure mode: the wizard is on the optional-skill screen, `decompose-codebase` is unselected, and the prompt refuses to continue because no option is selected.

This is a narrow follow-on decision inside the existing R2 skill-installation model. It does not change the registry schema, required-skill semantics, non-interactive flags, or the directory-based install pipeline.

## Decision

### 1. Retitle the step to represent the full installed skill set

The wizard step should ask:

- `Which skills should be installed?`

This wording matches the actual decision being presented. The answer to that question is the union of:

- all required skills
- any optional skills the user additionally selects

### 2. Show required and optional skills together, but with different affordances

The interactive skill-selection screen should render two groups:

- `Default`
- `Optional`

`Default` contains every registry entry where `required === true`.

Behavior for default skills:

- always shown as selected
- read-only / not toggleable
- counted as part of the answer to the screen

`Optional` contains every registry entry where `required === false`.

Behavior for optional skills:

- shown as selectable
- initially selected only when already present in `InstallSelections.optionalSkills`
- persisted back into `InstallSelections.optionalSkills` when toggled

This keeps the registry as the source of truth for which skills are mandatory while making the screen accurately reflect what will be installed.

### 3. Zero optional selections is a valid answer

If the user leaves every optional skill unselected, the wizard should still allow continuation because the required `Default` group already constitutes a valid answer to `Which skills should be installed?`

Practical rules:

- the prompt must not require at least one optional selection
- required skills satisfy the “at least one selected skill” condition by themselves
- if the registry contains required skills and zero optional skills, the screen may be skipped entirely because there is no user decision left to make

### 4. Keep the persisted selection model unchanged

The wizard should continue to persist only optional skill ids in `InstallSelections.optionalSkills`.

Required skills should not be copied into `optionalSkills` because:

- they are already derivable from the registry
- duplicating them into persisted selections would blur the meaning of `optionalSkills`
- current install, manifest, and CLI-flag behavior already assumes required skills come from the registry, not from user toggles

### 5. Implement the step as a grouped skill-selection state, not as a raw optional-only multiselect

The current optional-only multiselect is too narrow for the required UI:

- it cannot accurately present `Default` vs `Optional` as one answer set
- it communicates the wrong question
- it makes validation depend on optional selection instead of total installed skills

The wizard should introduce a grouped skill-selection state that can drive one screen containing:

- non-interactive group headings
- selected, disabled required rows
- selectable optional rows
- validation based on the combined displayed selection

The implementation may reuse the custom-prompt approach already used for capability selection if the stock prompt component cannot express grouped, read-only selected rows cleanly.

### 6. Add explicit validation coverage for the corrected behavior

The follow-on implementation should add tests that verify:

- the screen title and grouped rendering semantics
- required skills appear selected and cannot be toggled off
- zero optional selections still allow progression when required skills exist
- persisted `optionalSkills` remains empty when the user accepts only the default skill set
- the screen is skipped when there are no optional skills to choose from

## Alternatives Considered

**Only remove the “at least one option” validation.** Rejected because it would stop blocking the user, but the screen would still be mislabeled and would still hide the required skills that are part of the final installed set.

**Keep the current title and add helper text explaining that required skills are implicit.** Rejected because the main question would still be misleading. The problem is not just missing explanation; it is that the screen currently asks the wrong question.

**Persist required skill ids into `optionalSkills` so the multiselect always has a selected answer.** Rejected because it would corrupt the meaning of the persisted field and duplicate registry-derived truth in user selections.

**Split the flow into two screens: one informational default-skill screen and one optional-skill screen.** Rejected because it adds friction without adding real control. One grouped screen is enough to explain both what is always installed and what is user-selectable.

## Consequences

### Benefits

- The wizard will match the actual registry semantics.
- Users can accept the default skill set without being forced into an optional choice.
- Required skills become visible at the moment the user is making the skill-install decision.
- The skill-selection screen becomes easier to understand because the question and the rendered answer set align.

### Costs and trade-offs

- The wizard step becomes slightly more complex because it needs grouped rendering and read-only selected rows.
- The current optional-only prompt implementation will likely need to be replaced or wrapped with a richer state model.
- Test coverage must expand to cover grouped rendering and the “required-only” continuation path.

### Scope boundaries

- No registry schema change is required.
- No change is required to non-interactive `--optional-skills` semantics.
- No change is required to required-skill install behavior in the planner or installer.
- Review-summary wording may be adjusted later for polish, but it is not required to fix the functional UX bug described here.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [2026-04-16-cli-skill-installation-r2.md](2026-04-16-cli-skill-installation-r2.md)
- Reason: this is a narrow follow-on UX correction within the existing R2 skill-installation model. The broader R2 design remains valid; this document isolates the wizard-step change needed to make required and optional skill behavior consistent in the interactive flow.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../.prompts/designs-to-plan-change.prompt.md)
- Why: this should flow into a small incremental implementation plan against the shipped wizard and test surfaces rather than reopening the baseline `w5-r2` skill-installation design.
