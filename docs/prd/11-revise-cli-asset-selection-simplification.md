# 11 Revise CLI Asset Selection Simplification

## Purpose

This change revises the active CLI installation requirements so prompt starters, document templates, and reference files are no longer user-selectable asset groups in the interactive installer.

The change belongs in the active PRD namespace because the current baseline documents still describe prompts, template mode, and reference mode as user-facing choices. The Wave 14 Revision 0 plan changes that product contract: included prompts, templates, and references become managed installer assets by default, while the wizard and review summary stop presenting them as choices.

## Change Type

This doc records a `revision`.

It supersedes the prior requirement that the CLI expose prompt, template, and reference asset controls in the wizard and selection review. Because this is an alpha cleanup, the removed asset controls do not require backward compatibility. The revised requirement is that included prompts, templates, and references are invariant managed assets, while the old `--no-prompts`, `--templates`, `--references`, `prompts`, `templatesMode`, and `referencesMode` surfaces are removed rather than normalized.

## Baseline Being Revised or Removed

This revision alters these established requirement areas:

- [03 Open Questions and Risk Register](./03-open-questions-and-risk-register.md), where template/reference mode drift and the public-option question are tracked.
- [05 Installation, Profile, and Manifest Lifecycle](./05-installation-profile-and-manifest-lifecycle.md), where `InstallSelections` and `profileId` currently include prompt, template, and reference choices.
- [06 Template Contracts and Generated Assets](./06-template-contracts-and-generated-assets.md), where prompt/template/reference asset selection is described as capability-gated and mode-sensitive.
- [07 CLI Command Surface and Lifecycle](./07-cli-command-surface-and-lifecycle.md), where the wizard options step and review flow currently include these asset choices.

## Rationale

The prior requirement is no longer sufficient because the CLI is moving toward a complete managed documentation support surface. Asking users whether to install prompt starters, which document templates to install, or which reference files to install creates partial-install states that no longer match the intended product behavior.

The current implementation and PRDs also show drift: `templatesMode` and `referencesMode` appear as broader public choices than the selector actually enforces. Wave 14 Revision 0 resolves that drift by removing the user-facing choice instead of preserving controls whose meanings are no longer useful.

Code anchors:

- `packages/cli/src/wizard.ts`
- `packages/cli/src/cli.ts`
- `packages/cli/src/profile.ts`
- `packages/cli/src/rules.ts`
- `packages/cli/src/catalog.ts`

## Effective Requirement

The CLI installer must treat included prompt starters, document templates, and reference files as managed assets rather than interactive asset choices.

Effective behavior:

- The wizard does not ask `Install starter prompts?`.
- The wizard does not ask which document templates should be installed.
- The wizard does not ask which reference files should be installed.
- The wizard review summary does not list prompt inclusion, template mode, or reference mode rows as user decisions.
- Included prompt starters, document templates, and reference files are invariant managed assets whenever their owning capability surface is installed.
- The old `--no-prompts`, `--templates`, and `--references` flags are removed from the public CLI contract.
- The old `prompts`, `templatesMode`, and `referencesMode` selection fields are removed from the active persisted-selection contract rather than translated into new values.
- Install, sync, and reconfigure flows continue to manage every included prompt, template, and reference file that belongs to the effective capability surface.
- Manifest checking must identify stale or malformed manifests that still carry the removed asset-selection fields, tell users to fix or remove the stale manifest, and tell them to rerun bare `make-docs` to rebuild the manifest.

Code anchors:

- `packages/cli/src/wizard.ts`
- `packages/cli/src/cli.ts`
- `packages/cli/src/profile.ts`
- `packages/cli/src/rules.ts`
- `packages/cli/src/catalog.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/tests/wizard.test.ts`
- `packages/cli/tests/cli.test.ts`
- `packages/cli/tests/install.test.ts`
- `packages/cli/tests/profile.test.ts`

## Impacted Docs and Dependencies

This revision affects the active PRD docs that describe installer selection state, template asset selection, and CLI wizard behavior. It also affects the W14 R0 implementation backlog because that backlog should now treat PRD continuity notes as already present.

Impacted docs and artifacts:

- [03 Open Questions and Risk Register](./03-open-questions-and-risk-register.md)
- [05 Installation, Profile, and Manifest Lifecycle](./05-installation-profile-and-manifest-lifecycle.md)
- [06 Template Contracts and Generated Assets](./06-template-contracts-and-generated-assets.md)
- [07 CLI Command Surface and Lifecycle](./07-cli-command-surface-and-lifecycle.md)
- [2026-04-28 W14 R0 CLI Asset Selection Simplification Plan](../assets/archive/plans/2026-04-28-w14-r0-cli-asset-selection-simplification/00-overview.md)
- [2026-04-28 W14 R0 CLI Asset Selection Simplification Work](../assets/archive/work/2026-04-28-w14-r0-cli-asset-selection-simplification/00-index.md)

Code anchors:

- `packages/cli/src/types.ts`
- `packages/cli/src/profile.ts`
- `packages/cli/src/rules.ts`
- `packages/cli/src/wizard.ts`
- `packages/cli/src/cli.ts`
- `packages/cli/tests/consistency.test.ts`
- `packages/cli/tests/renderers.test.ts`

## Required Baseline Annotations

The following baseline PRD docs must carry `### Change Notes` using `Superseded by`:

- `docs/prd/03-open-questions-and-risk-register.md` under the confirmed drift and open-question sections for template/reference mode controls.
- `docs/prd/05-installation-profile-and-manifest-lifecycle.md` near selection/profile identity and `InstallSelections` contract text that includes prompt/template/reference modes.
- `docs/prd/06-template-contracts-and-generated-assets.md` near asset-selection rules, mode-sensitive template/reference behavior, and rebuild-risk notes.
- `docs/prd/07-cli-command-surface-and-lifecycle.md` near the wizard options step, review flow, and selection contract.

## Source Anchors

- `docs/assets/archive/designs/2026-04-28-cli-asset-selection-simplification.md`
- `docs/assets/archive/plans/2026-04-28-w14-r0-cli-asset-selection-simplification/00-overview.md`
- `docs/assets/archive/work/2026-04-28-w14-r0-cli-asset-selection-simplification/00-index.md`
- `docs/prd/03-open-questions-and-risk-register.md`
- `docs/prd/05-installation-profile-and-manifest-lifecycle.md`
- `docs/prd/06-template-contracts-and-generated-assets.md`
- `docs/prd/07-cli-command-surface-and-lifecycle.md`
- `packages/cli/src/wizard.ts`
- `packages/cli/src/cli.ts`
- `packages/cli/src/profile.ts`
- `packages/cli/src/rules.ts`
- `packages/cli/src/catalog.ts`
- `packages/cli/src/manifest.ts`
