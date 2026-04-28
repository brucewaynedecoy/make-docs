# 12 Revise CLI Skill Selection Simplification

## Purpose

This change revises the active skill installation requirements so shipped skills are treated as one recommended, selected-by-default set rather than split into required/default and optional categories.

The change belongs in the active PRD namespace because the current baseline documents explicitly describe `required` registry metadata, `optionalSkills` selection state, required-vs-optional UI grouping, and optional-only CLI validation. Wave 14 Revision 1 changes that product and data model.

## Change Type

This doc records a `revision`.

It supersedes the prior requirement that `archive-docs` be a mandatory/default skill and `decompose-codebase` be an optional add-on. The revised requirement is that all registry skills are recommended, initially selected when skills are enabled, and individually deselectable.

## Baseline Being Revised or Removed

This revision alters these established requirement areas:

- [03 Open Questions and Risk Register](./03-open-questions-and-risk-register.md), where skill registry, delivery, and release guidance risks are tracked.
- [05 Installation, Profile, and Manifest Lifecycle](./05-installation-profile-and-manifest-lifecycle.md), where `InstallSelections`, `profileId`, and manifest migration currently reference `optionalSkills`.
- [07 CLI Command Surface and Lifecycle](./07-cli-command-surface-and-lifecycle.md), where the wizard and CLI validation currently expose optional skill selection.
- [08 Skills Catalog and Distribution](./08-skills-catalog-and-distribution.md), where required/optional registry metadata, UI grouping, shipped inventory, and skills command behavior are described.

## Rationale

The required-versus-optional skill distinction no longer matches the intended user experience. The skill selection screen should show one recommended list, select every skill by default, preserve the highlighted skill description panel, and allow every listed skill to be deselected.

Keeping `required` in the registry or `optionalSkills` in persisted selection state would preserve a hidden mandatory category after the UI stops presenting one. That would make the CLI harder to reason about and would prevent users from deselecting skills that were formerly installed automatically.

Code anchors:

- `packages/cli/skill-registry.json`
- `packages/cli/skill-registry.schema.json`
- `packages/cli/src/skill-registry.ts`
- `packages/cli/src/skill-catalog.ts`
- `packages/cli/src/types.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/wizard.ts`
- `packages/cli/src/skills-ui.ts`
- `packages/cli/src/cli.ts`

## Effective Requirement

The CLI must model shipped skills as one recommended selected-skill set.

Effective behavior:

- Registry entries describe installable skills and do not carry `required`.
- Fresh defaults select every registry skill when `skills` is enabled.
- Persisted selections represent the selected skill set, not optional additions to an implicit required set.
- Desired skill assets are generated only for selected skill names when skills are enabled.
- Full install and skills-only selection UIs do not render `Default`, `Optional`, `Required skills`, or `Optional skills` as product categories.
- Every skill row is selectable and deselectable in the interactive selection UI.
- The highlighted skill detail panel and bottom selected-skill summary/instructions remain.
- Legacy manifests with `optionalSkills` migrate to the prior effective selected-skill set: formerly required skills plus the listed optional skills.
- `skillFiles` remains managed-output ownership tracking and is not merged into `manifest.files`.

Code anchors:

- `packages/cli/skill-registry.json`
- `packages/cli/skill-registry.schema.json`
- `packages/cli/src/skill-registry.ts`
- `packages/cli/src/skill-catalog.ts`
- `packages/cli/src/types.ts`
- `packages/cli/src/profile.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/wizard.ts`
- `packages/cli/src/skills-ui.ts`
- `packages/cli/src/skills-command.ts`
- `packages/cli/tests/skill-registry.test.ts`
- `packages/cli/tests/skill-catalog.test.ts`
- `packages/cli/tests/wizard.test.ts`
- `packages/cli/tests/skills-ui.test.ts`
- `packages/cli/tests/install.test.ts`

## Impacted Docs and Dependencies

This revision affects the skills subsystem, shared install lifecycle, and CLI user-facing selection surface. It also affects the W14 R1 implementation backlog because that backlog should now treat PRD continuity notes as already present.

Impacted docs and artifacts:

- [03 Open Questions and Risk Register](./03-open-questions-and-risk-register.md)
- [05 Installation, Profile, and Manifest Lifecycle](./05-installation-profile-and-manifest-lifecycle.md)
- [07 CLI Command Surface and Lifecycle](./07-cli-command-surface-and-lifecycle.md)
- [08 Skills Catalog and Distribution](./08-skills-catalog-and-distribution.md)
- [2026-04-28 W14 R1 CLI Skill Selection Simplification Plan](../plans/2026-04-28-w14-r1-cli-skill-selection-simplification/00-overview.md)
- [2026-04-28 W14 R1 CLI Skill Selection Simplification Work](../work/2026-04-28-w14-r1-cli-skill-selection-simplification/00-index.md)

Code anchors:

- `packages/cli/src/skill-registry.ts`
- `packages/cli/src/skill-catalog.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/wizard.ts`
- `packages/cli/src/skills-ui.ts`
- `packages/cli/src/cli.ts`
- `packages/cli/src/skills-command.ts`

## Required Baseline Annotations

The following baseline PRD docs must carry `### Change Notes` using `Superseded by`:

- `docs/prd/03-open-questions-and-risk-register.md` under skills delivery, registry, authoring, and safety-risk sections affected by the selected-skill model.
- `docs/prd/05-installation-profile-and-manifest-lifecycle.md` near `InstallSelections`, profile identity, skill ownership, and manifest migration references to `optionalSkills`.
- `docs/prd/07-cli-command-surface-and-lifecycle.md` near wizard/review behavior, skills command validation, and public flag language.
- `docs/prd/08-skills-catalog-and-distribution.md` near command behavior, catalog layer, registry contract, shipped inventory, install selections, and rebuild notes that describe required/optional behavior.

## Source Anchors

- `docs/designs/2026-04-28-cli-skill-selection-simplification.md`
- `docs/plans/2026-04-28-w14-r1-cli-skill-selection-simplification/00-overview.md`
- `docs/work/2026-04-28-w14-r1-cli-skill-selection-simplification/00-index.md`
- `docs/prd/03-open-questions-and-risk-register.md`
- `docs/prd/05-installation-profile-and-manifest-lifecycle.md`
- `docs/prd/07-cli-command-surface-and-lifecycle.md`
- `docs/prd/08-skills-catalog-and-distribution.md`
- `packages/cli/skill-registry.json`
- `packages/cli/skill-registry.schema.json`
- `packages/cli/src/skill-registry.ts`
- `packages/cli/src/skill-catalog.ts`
- `packages/cli/src/types.ts`
- `packages/cli/src/profile.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/wizard.ts`
- `packages/cli/src/skills-ui.ts`
- `packages/cli/src/cli.ts`
