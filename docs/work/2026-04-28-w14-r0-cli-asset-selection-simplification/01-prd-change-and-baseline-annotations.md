# Phase 1: PRD Change and Baseline Annotations

> Derives from [Phase 1 of the plan](../../plans/2026-04-28-w14-r0-cli-asset-selection-simplification/01-prd-change-and-baseline-annotations.md).

## Purpose

Record the CLI asset-selection revision in the active PRD namespace before implementation changes the product surface.

## Overview

This phase adds `docs/prd/11-revise-cli-asset-selection-simplification.md`, updates the PRD index, and annotates the impacted baseline docs with non-destructive `### Change Notes` backlinks. It should not rewrite the baseline PRDs beyond targeted annotations unless the user explicitly approves a cleanup rewrite later.

## Source PRD Docs

- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [05 Installation, Profile, and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- Planned change doc: `docs/prd/11-revise-cli-asset-selection-simplification.md`

## Source Plan Phases

- [01-prd-change-and-baseline-annotations.md](../../plans/2026-04-28-w14-r0-cli-asset-selection-simplification/01-prd-change-and-baseline-annotations.md)

## Stage 1 - Add the PRD Revision Doc

### Tasks

1. Create `docs/prd/11-revise-cli-asset-selection-simplification.md` from `docs/assets/templates/prd-change-revision.md`.
2. Set Change Type to `revision`.
3. Identify the baseline areas being revised: wizard options, review summary, install selections, profile/manifest behavior, and asset-selection rules.
4. State the effective requirement that included prompts, templates, and references are always managed and no longer user-selectable in the interactive wizard.
5. Include source anchors for the design, plan, wizard, CLI selection resolver, profile resolver, asset rules, and focused tests.

### Acceptance criteria

- [x] `docs/prd/11-revise-cli-asset-selection-simplification.md` exists.
- [x] The doc uses all required `prd-change-revision.md` headings.
- [x] The effective requirement covers wizard prompts, review rows, selection field removal, stale-manifest validation, and asset coverage.
- [x] Source anchors include `packages/cli/src/wizard.ts`, `packages/cli/src/cli.ts`, `packages/cli/src/profile.ts`, and `packages/cli/src/rules.ts`.

### Dependencies

- Approved W14 R0 plan.

## Stage 2 - Annotate Impacted Baseline PRDs

### Tasks

1. Add a targeted `### Change Notes` block to `docs/prd/03-open-questions-and-risk-register.md` near the template/reference mode drift and open-question rows.
2. Add a targeted `### Change Notes` block to `docs/prd/05-installation-profile-and-manifest-lifecycle.md` near the `InstallSelections` and profile identity contract.
3. Add a targeted `### Change Notes` block to `docs/prd/06-template-contracts-and-generated-assets.md` near asset-selection rules and prompt/template/reference selection behavior.
4. Add a targeted `### Change Notes` block to `docs/prd/07-cli-command-surface-and-lifecycle.md` near the wizard options/review-flow contract.
5. Use `Superseded by 11-revise-cli-asset-selection-simplification.md.` as the note wording, with the actual Markdown link added from within the PRD file, unless a more precise local sentence is required.

### Acceptance criteria

- [x] Every impacted baseline PRD contains a backlink to doc `11`.
- [x] The backlinks are placed under the impacted headings or requirement text.
- [x] Existing baseline text remains visible.
- [x] No active PRD docs are renumbered.

### Dependencies

- Stage 1.

## Stage 3 - Update the PRD Index

### Tasks

1. Add doc `11` to `docs/prd/00-index.md`.
2. Mark it as current and describe its focus as the CLI asset-selection revision.
3. Update reading guidance only if the new change doc needs an explicit reader path.
4. Keep the index concise.

### Acceptance criteria

- [x] `docs/prd/00-index.md` lists doc `11`.
- [x] Existing docs `00` through `10` keep their current numbering.
- [x] The index gives readers a clear route from baseline docs to the change doc.

### Dependencies

- Stages 1 and 2.

## Stage 4 - Validate PRD Traceability

### Tasks

1. Check that every `### Change Notes` link resolves.
2. Check that `docs/prd/11-revise-cli-asset-selection-simplification.md` links back to the affected baseline docs.
3. Confirm the new change doc is discoverable from `docs/prd/00-index.md`.
4. Reindex `jdocmunch` after PRD edits.

### Acceptance criteria

- [x] PRD links resolve locally.
- [x] The effective requirement can be followed from each affected baseline doc to doc `11`.
- [x] `jdocmunch` search finds the new change doc after reindexing.

### Dependencies

- Stages 1-3.
