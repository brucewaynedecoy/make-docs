# CLI Asset Selection Simplification

> Filename: `2026-04-28-cli-asset-selection-simplification.md`. See `docs/assets/references/design-contract.md` for naming and structural rules.

## Purpose

Remove redundant asset-selection choices from the CLI interview while preserving the installer's current asset coverage.

The CLI should no longer ask whether starter prompts, document templates, or reference files should be installed. It should always install or update every included prompt, template, and reference file that belongs to the selected product surface.

## Context

The current selection wizard still exposes three questions for assets that are no longer meant to be optional:

- `Install starter prompts?`
- `Which document templates should be installed?`
- `Which reference files should be installed?`

Those choices also appear in the final `Review selections` summary as:

- starter prompt inclusion or omission
- template mode
- reference mode

This made sense when the installer treated prompts, templates, and references as user-tunable install scope. The project has since moved toward a complete managed documentation system where included prompts, templates, and references are part of the contract the CLI keeps current. Asking the user to omit them now creates avoidable decision fatigue and increases the chance of partially installed documentation support.

The code path that currently exposes this behavior is the CLI selection wizard in `packages/cli/src/wizard.ts`. Indexed code inspection shows the obsolete prompt strings in `promptForOptions`, and the corresponding review rows in `renderWizardReviewSummary`.

Related prior design context:

- [2026-04-16-asset-pipeline-completeness.md](../assets/archive/designs/2026-04-16-asset-pipeline-completeness.md) introduced always-installed asset categories and made unmanaged template coverage more complete.
- [2026-04-20-cli-command-simplification.md](../assets/archive/designs/2026-04-20-cli-command-simplification.md) simplified the CLI command surface around install and reconfigure behavior.
- [2026-04-22-docs-assets-resource-namespace.md](../assets/archive/designs/2026-04-22-docs-assets-resource-namespace.md) standardized the docs asset namespace that the CLI now manages.

## Decision

### 1. Remove prompt, template, and reference questions from the interview

The CLI interview should skip these three asset-selection prompts entirely:

- `Install starter prompts?`
- `Which document templates should be installed?`
- `Which reference files should be installed?`

The interview should continue to ask the remaining meaningful choices, such as document types, harnesses, skills, skill scope, and optional skills when applicable.

### 2. Treat included prompts, templates, and references as always managed

All install and update flows should converge on the same effective asset choices:

- prompts are included
- templates use the complete included template set
- references use the complete included reference set

If the implementation keeps `prompts`, `templatesMode`, or `referencesMode` fields for compatibility with existing internal types, manifests, or helper functions, those fields should be normalized to the always-managed values before planning, review, or install execution. They should not remain user-facing choices in the interactive CLI.

### 3. Remove these rows from `Review selections`

The final review summary should no longer list prompt, template, or reference asset choices.

The review should focus on selections the user still controls. In practice, the `Options` block should keep rows like harnesses, skill installation, and optional skills, but drop rows derived from:

- `OPTION_METADATA.prompts`
- `OPTION_METADATA.templatesMode`
- `OPTION_METADATA.referencesMode`

This keeps the review summary honest: it should confirm user decisions, not restate invariant installer behavior.

### 4. Preserve asset install/update behavior

This change is not a reduction in installed content. It is a reduction in interview surface.

The planner should verify that removing the prompts does not accidentally narrow install plans, conflict handling, manifest updates, smoke-pack output, or reconfigure behavior. The accepted outcome is that every included prompt, template, and reference that the CLI knows how to manage is still installed or updated according to the normal asset rules.

### 5. Update tests around wizard flow and review output

Follow-on implementation should update wizard tests that currently expect:

- cancelling or answering the three removed prompts
- review rows for prompt inclusion, template mode, or reference mode
- non-default asset modes selected through interactive wizard options

Replacement coverage should prove:

- the interview advances from the remaining option prompts into review without visiting the removed questions
- effective selections still resolve to prompts included, all templates, and all references
- the review screen omits invariant asset rows
- install or reconfigure planning still includes managed prompts, templates, and references

## Alternatives Considered

### Keep the questions but default them to all included assets

Rejected because defaulting still asks the user to make a decision the product no longer wants them to make. It preserves decision fatigue and leaves room for partial installs.

### Keep the review rows as informational output

Rejected because the review section should summarize decisions the user made in the interview. Listing invariant asset behavior beside true choices makes the review feel longer without adding useful confirmation.

### Remove the underlying selection fields immediately

Deferred to planning. The design requires removing the user-facing choices and normalizing behavior to always-managed assets. A follow-on plan should inspect whether `prompts`, `templatesMode`, and `referencesMode` are still useful compatibility fields before deleting them from shared types, persisted state, or tests.

### Make the behavior configurable through an advanced mode

Rejected for this change. The stated product direction is that included prompts, templates, and references are always installed or updated. An advanced omission mode would reintroduce the same partial-install risk under a less discoverable interface.

## Consequences

The CLI interview becomes shorter and easier to complete. Users no longer need to understand the difference between required and all templates or references before the documentation system is installed.

The installer contract also becomes clearer: managed documentation support includes the prompts, templates, and references shipped with the product. If those assets change between releases, update flows should keep them current without asking the user to opt in again.

The main implementation risk is hidden coupling. Existing tests, manifest replay, install planning, and review rendering may assume the three asset fields can vary. The follow-on plan should handle that deliberately by separating user-facing choice removal from any deeper type cleanup.

Validation should include at least:

- wizard-flow coverage for the shorter interview
- review-summary coverage proving the removed rows are absent
- install-plan or smoke coverage proving all included prompts, templates, and references are still managed
- migration or compatibility coverage if existing manifests can contain omitted prompts, required-only templates, or required-only references

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [2026-04-16-asset-pipeline-completeness.md](../assets/archive/designs/2026-04-16-asset-pipeline-completeness.md), [2026-04-20-cli-command-simplification.md](../assets/archive/designs/2026-04-20-cli-command-simplification.md), [2026-04-22-docs-assets-resource-namespace.md](../assets/archive/designs/2026-04-22-docs-assets-resource-namespace.md)
- Reason: this design narrows the user-facing CLI selection surface while relying on the prior asset-pipeline, command-surface, and docs-asset namespace decisions that made prompts, templates, and references part of the managed product contract.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../assets/prompts/designs-to-plan-change.prompt.md)
- Why: this is a targeted revision to existing CLI wizard and asset-planning behavior, not a new baseline planning track.
- Coordinate Handoff: related completed coordinates include `W4 R0` for asset pipeline completeness, `W8 R0` for CLI command simplification, and `W9 R1` for docs asset namespace work. Recommended downstream coordinate is `W14 R0`, based on the current latest planned/work coordinate `W13 R0`; planner should confirm the coordinate is still available before writing.
