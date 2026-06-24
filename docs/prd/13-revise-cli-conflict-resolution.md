# 13 Revise CLI Conflict Resolution

## Purpose

This change revises the active CLI installation requirements for handling existing managed files whose local contents differ from the make-docs desired contents.

The change belongs in the active PRD namespace because the current baseline and prior revision docs establish managed installation behavior for selected managed files, but the interactive conflict flow still treats agent instruction conflicts as a special per-file path and leaves divergent prompts, references, templates, desired skill assets, and generic managed files without the same explicit review contract. The revised requirement is captured by the W14 R2 source design, [CLI Conflict Resolution](../designs/2026-05-06-cli-conflict-resolution.md), and the W14 R2 change plan, [CLI Conflict Resolution - Change Plan](../assets/archive/plans/2026-05-06-w14-r2-cli-conflict-resolution/00-overview.md).

## Change Type

This doc records a `revision`.

It supersedes the prior requirement that the installer resolve only agent instruction conflicts through an instruction-specific `Update` / `Overwrite` / `Skip` review path. The revised requirement is that the installer uses a batch-first managed-file conflict flow for divergent selected managed files, including agent instructions, prompts, references, templates, desired skill assets, and any other selected managed file whose desired contents differ from existing local contents, with deterministic apply behavior driven only by explicit per-path resolutions.

## Baseline Being Revised or Removed

This revision alters these established requirement areas:

- [07 CLI Command Surface and Lifecycle](./07-cli-command-surface-and-lifecycle.md), where install and reconfigure behavior define the interactive CLI lifecycle and review flow.
- [11 Revise CLI Asset Selection Simplification](./11-revise-cli-asset-selection-simplification.md), where included prompts, templates, and references become invariant managed assets rather than user-selectable asset groups.
- [03 Open Questions and Risk Register](./03-open-questions-and-risk-register.md), where the W14 R2 PRD 05 drift item is closed after the lifecycle baseline is reconciled.
- [05 Installation, Profile, and Manifest Lifecycle](./05-installation-profile-and-manifest-lifecycle.md), where manifest, planner, and apply behavior must reflect selected managed-file diff review.

## Rationale

The prior requirement is no longer sufficient because it gives users explicit decisions for instruction-file conflicts but does not generalize to all selected managed-file diffs, even though W14 revisions made prompts, references, templates, and selected skill assets part of the managed product surface. That leaves a mismatch between the managed-asset model and the install-time conflict experience.

The instruction-specific `Update` option is also too narrow for the generalized conflict model. Append-merging generated guidance into an existing instruction file does not apply to prompts, references, templates, desired skill assets, or generic managed files, and keeping it would force divergent decision vocabularies across asset groups. The revised conflict flow uses consistent overwrite-or-preserve choices for every reviewable managed-file diff.

Code anchors:

- `packages/cli/src/planner.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/wizard.ts`
- `packages/cli/src/cli.ts`
- `packages/cli/src/types.ts`

## Effective Requirement

### Change Notes

- Superseded by [15-revise-agent-instruction-file-ownership.md](./15-revise-agent-instruction-file-ownership.md) for instruction files: the whole-file overwrite/skip-only model and the "no append-merge path for agent instructions" requirement are replaced by a delimited managed-block inline-routing model. Non-instruction managed files keep this batch-first conflict behavior.

The CLI installer must handle divergent selected managed files through a batch-first conflict-resolution flow.

Effective behavior:

- The planner inspects selected desired managed files before prompting and identifies reviewable diffs for agent instructions, prompts, references, templates, desired skill assets, and generic managed files.
- Reviewable groups are ordered as `agent instructions`, `references`, `templates`, `prompts`, `skills`, then `managed files`.
- When one or more reviewable diffs exist, the first user decision is a batch prompt: `How should make-docs handle these existing files?`
- Batch options are exactly `Overwrite all`, `Skip all`, and `Review each`.
- `Overwrite all` maps every reviewable diff to an explicit overwrite resolution.
- `Skip all` maps every reviewable diff to an explicit skip resolution.
- `Review each` walks files by group order and asks for an explicit per-file decision.
- Per-file options are exactly `Overwrite` and `Skip`.
- The conflict-review flow does not offer `Update`.
- The conflict-review flow does not provide an append-merge path for agent instructions or any other managed file.
- The final install plan is applied deterministically from the desired file set and explicit per-path resolutions.
- The apply phase does not prompt and does not infer conflict behavior that was not present in the resolution map.
- Missing files, already-matching files, and manifest-owned files that can be safely updated keep their existing automatic behavior.
- Desired skill assets keep their dedicated manifest ownership model, but selected skill-file diffs participate in the same explicit overwrite/skip review before apply.

Code anchors:

- `packages/cli/src/planner.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/wizard.ts`
- `packages/cli/src/cli.ts`
- `packages/cli/src/types.ts`
- `packages/cli/tests/install.test.ts`
- `packages/cli/tests/cli.test.ts`

## Impacted Docs and Dependencies

This revision affects the CLI install path, wizard conflict prompts, and managed-asset planning. It also constrains downstream implementation workers by making `Update` removal, overwrite/skip-only review, and deterministic resolution mapping part of the active PRD contract.

Impacted docs and artifacts:

- [2026-05-06 CLI Conflict Resolution Design](../designs/2026-05-06-cli-conflict-resolution.md)
- [2026-05-06 W14 R2 CLI Conflict Resolution Plan](../assets/archive/plans/2026-05-06-w14-r2-cli-conflict-resolution/00-overview.md)
- [2026-05-06 W14 R2 P1 PRD Change and Baseline Annotations Work](../assets/archive/work/2026-05-06-w14-r2-cli-conflict-resolution/01-prd-change-and-baseline-annotations.md)
- [07 CLI Command Surface and Lifecycle](./07-cli-command-surface-and-lifecycle.md)
- [11 Revise CLI Asset Selection Simplification](./11-revise-cli-asset-selection-simplification.md)
- [03 Open Questions and Risk Register](./03-open-questions-and-risk-register.md), for closing the PRD 05 conflict-model drift item after reconciliation.
- [05 Installation, Profile, and Manifest Lifecycle](./05-installation-profile-and-manifest-lifecycle.md), for manifest hash, selected-diff review, non-interactive failure, and apply-blocking semantics.

Code anchors:

- `packages/cli/src/planner.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/wizard.ts`
- `packages/cli/src/cli.ts`
- `packages/cli/src/types.ts`
- `packages/cli/tests/install.test.ts`
- `packages/cli/tests/cli.test.ts`

## Required Baseline Annotations

The following baseline PRD docs must carry `### Change Notes` using `Superseded by`:

- `docs/prd/07-cli-command-surface-and-lifecycle.md` near install, reconfigure, wizard review, or conflict-resolution behavior that currently describes the older instruction-specific review path.
- `docs/prd/11-revise-cli-asset-selection-simplification.md` near the always-managed reference and template requirement, to connect that managed-asset model to explicit conflict handling for divergent local files.
- `docs/prd/05-installation-profile-and-manifest-lifecycle.md` near manifest, planner, and apply behavior that describes selected managed-file diff handling.

The following living-register update is required after PRD 05 is current:

- `docs/prd/03-open-questions-and-risk-register.md` must close or revise the existing W14 R2 PRD 05 drift item instead of leaving PRD 05 as deferred follow-up.

## Source Anchors

- `docs/designs/2026-05-06-cli-conflict-resolution.md`
- `docs/assets/archive/plans/2026-05-06-w14-r2-cli-conflict-resolution/00-overview.md`
- `docs/assets/archive/plans/2026-05-06-w14-r2-cli-conflict-resolution/01-prd-change-and-baseline-annotations.md`
- `docs/assets/archive/work/2026-05-06-w14-r2-cli-conflict-resolution/01-prd-change-and-baseline-annotations.md`
- `docs/assets/references/prd-change-management.md`
- `docs/assets/templates/prd-change-revision.md`
- `docs/prd/07-cli-command-surface-and-lifecycle.md`
- `docs/prd/11-revise-cli-asset-selection-simplification.md`
- `docs/prd/05-installation-profile-and-manifest-lifecycle.md`
- `packages/cli/src/planner.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/wizard.ts`
- `packages/cli/src/cli.ts`
- `packages/cli/src/types.ts`
