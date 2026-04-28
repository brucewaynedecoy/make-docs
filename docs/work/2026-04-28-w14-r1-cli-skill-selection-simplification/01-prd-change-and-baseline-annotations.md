# Phase 1: PRD Change and Baseline Annotations

> Derives from [Phase 1 of the plan](../../plans/2026-04-28-w14-r1-cli-skill-selection-simplification/01-prd-change-and-baseline-annotations.md).

## Purpose

Record the CLI skill-selection revision in the active PRD namespace before implementation changes registry, manifest, planner, or user-facing skill-selection behavior.

## Overview

This phase adds the planned PRD revision doc, updates the PRD index, and annotates impacted baseline docs with non-destructive `### Change Notes` backlinks. It should not rewrite baseline PRDs beyond targeted annotations unless the user explicitly approves a cleanup rewrite later.

## Source PRD Docs

- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [05 Installation, Profile, and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- [08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md)
- Planned change doc: `docs/prd/12-revise-cli-skill-selection-simplification.md`

## Source Plan Phases

- [01-prd-change-and-baseline-annotations.md](../../plans/2026-04-28-w14-r1-cli-skill-selection-simplification/01-prd-change-and-baseline-annotations.md)

## Stage 1 - Confirm Change Doc Number

### Tasks

1. Inspect `docs/prd/` for existing numbered docs.
2. Confirm whether `docs/prd/11-revise-cli-asset-selection-simplification.md` has landed from `W14 R0`.
3. If doc `11` exists or is otherwise reserved by the active plan sequence, create `docs/prd/12-revise-cli-skill-selection-simplification.md`.
4. If doc `11` has not landed and no higher change docs exist, pause long enough to confirm whether the skill-selection change should still use `12` for planned sequencing or move to the next available PRD number.
5. Do not create placeholder PRD docs only to reserve numbers.

### Acceptance criteria

- [ ] The execution record states the chosen PRD number and why.
- [ ] No existing PRD docs are renumbered.
- [ ] No placeholder PRD docs are created.

### Dependencies

- Approved W14 R1 plan.
- Awareness of W14 R0 status.

## Stage 2 - Add the PRD Revision Doc

### Tasks

1. Create the confirmed `NN-revise-cli-skill-selection-simplification.md` from `docs/assets/templates/prd-change-revision.md`.
2. Set Change Type to `revision`.
3. Identify the baseline areas being revised: skills registry contract, selected-skill state, manifest migration, full-install wizard behavior, skills-only command behavior, and CLI flag language.
4. State the effective requirement that all registry skills are recommended, selected by default when skills are enabled, and individually deselectable.
5. State that registry entries no longer carry `required` and persisted selections no longer model only optional additions to an implicit required set.
6. Include source anchors for the design, plan, registry JSON/schema, registry loader, catalog, types, manifest migration, wizard, skills UI, and CLI parser.

### Acceptance criteria

- [ ] The PRD revision doc exists at the confirmed `NN-` path.
- [ ] The doc uses all required `prd-change-revision.md` headings.
- [ ] The effective requirement covers registry metadata, selected-skill state, migration, wizard behavior, skills-only behavior, and flag language.
- [ ] Source anchors include `packages/cli/skill-registry.json`, `packages/cli/skill-registry.schema.json`, `packages/cli/src/skill-registry.ts`, `packages/cli/src/skill-catalog.ts`, `packages/cli/src/types.ts`, `packages/cli/src/manifest.ts`, `packages/cli/src/wizard.ts`, `packages/cli/src/skills-ui.ts`, and `packages/cli/src/cli.ts`.

### Dependencies

- Stage 1.

## Stage 3 - Annotate Impacted Baseline PRDs

### Tasks

1. Add targeted `### Change Notes` backlinks in `docs/prd/03-open-questions-and-risk-register.md` near skills delivery, registry, authoring, release, or safety rows affected by the selected-skill model.
2. Add targeted `### Change Notes` backlinks in `docs/prd/05-installation-profile-and-manifest-lifecycle.md` near `InstallSelections`, profile identity, and manifest migration references to `optionalSkills`.
3. Add targeted `### Change Notes` backlinks in `docs/prd/07-cli-command-surface-and-lifecycle.md` near skills command validation, help behavior, and wizard/review selection behavior.
4. Add targeted `### Change Notes` backlinks in `docs/prd/08-skills-catalog-and-distribution.md` near command behavior, catalog layer, registry contract, shipped inventory, install selections, manifest ownership, and rebuild notes that describe required/optional skill behavior.
5. Use `Superseded by` wording with a relative Markdown link to the new change doc.

### Acceptance criteria

- [ ] Every impacted baseline PRD contains a backlink to the new skill-selection change doc.
- [ ] The backlinks are placed under the impacted headings or requirement text.
- [ ] Existing baseline text remains visible.
- [ ] No active PRD docs are renumbered.

### Dependencies

- Stage 2.

## Stage 4 - Update PRD Index and Validate Traceability

### Tasks

1. Add the new change doc to `docs/prd/00-index.md`.
2. Mark it as current and describe its focus as the CLI skill-selection revision.
3. Check that every `### Change Notes` link resolves.
4. Check that the new change doc links back to the affected baseline docs.
5. Reindex `jdocmunch` after PRD edits.

### Acceptance criteria

- [ ] `docs/prd/00-index.md` lists the new skill-selection change doc.
- [ ] Existing docs keep their current numbering.
- [ ] PRD links resolve locally.
- [ ] The effective requirement can be followed from each affected baseline doc to the change doc.
- [ ] `jdocmunch` search finds the new change doc after reindexing.

### Dependencies

- Stages 1-3.
