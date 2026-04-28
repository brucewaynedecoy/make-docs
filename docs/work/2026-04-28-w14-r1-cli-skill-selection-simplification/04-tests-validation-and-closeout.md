# Phase 4: Tests, Validation, and Closeout

> Derives from [Phase 4 of the plan](../../plans/2026-04-28-w14-r1-cli-skill-selection-simplification/04-tests-delta-backlog-and-validation.md).

## Purpose

Prove the skill-selection revision is implemented safely, keep the active docs traceable, and close the wave with focused validation instead of a broad unrelated cleanup.

## Overview

This phase updates targeted tests, validates code and docs behavior, refreshes MCP indexes, and records any remaining follow-up risks. It should not widen into a full PRD regeneration or rewrite unrelated CLI lifecycle behavior.

## Source PRD Docs

- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [05 Installation, Profile, and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- [08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md)
- Planned change doc: `docs/prd/12-revise-cli-skill-selection-simplification.md`

## Source Plan Phases

- [04-tests-delta-backlog-and-validation.md](../../plans/2026-04-28-w14-r1-cli-skill-selection-simplification/04-tests-delta-backlog-and-validation.md)

## Stage 1 - Update Registry and Catalog Tests

### Tasks

1. Update `packages/cli/tests/skill-registry.test.ts` so the packaged registry and schema no longer expect `required`.
2. Verify the schema accepts the new registry shape.
3. Preserve tests for invalid source, entrypoint, install name, description, and asset data.
4. Update `packages/cli/tests/skill-catalog.test.ts` for selected-skill asset expansion.
5. Add or revise tests proving default selected skills include every registry entry.
6. Add or revise tests proving deselecting a skill removes its desired assets.

### Acceptance criteria

- [ ] Registry tests pass without `required`.
- [ ] Catalog tests prove selected-skill filtering.
- [ ] Catalog tests prove all skills are selected by default when skills are enabled.
- [ ] Invalid registry entry coverage remains meaningful.

### Dependencies

- Phase 2.

## Stage 2 - Update Wizard and Skills UI Tests

### Tasks

1. Update `packages/cli/tests/wizard.test.ts` for one-list skill selection.
2. Update `packages/cli/tests/skills-ui.test.ts` for selected-skill prompt language.
3. Test that rendered frames do not contain `Default`, `Optional`, or the default-skill immutability note.
4. Test that highlighted skill descriptions still render.
5. Test that selected-skill summary and keyboard instructions remain present.
6. Test that every skill can be toggled.
7. Test that skills-only removal mode still skips selection.

### Acceptance criteria

- [ ] Wizard tests no longer depend on heading rows.
- [ ] Skills UI tests no longer depend on required/optional prompts.
- [ ] Render tests prove the removed note is absent.
- [ ] Render tests prove the retained detail and instruction sections still exist.
- [ ] Removal mode behavior remains covered.

### Dependencies

- Phase 3.

## Stage 3 - Update CLI, Manifest, and Install Tests

### Tasks

1. Update `packages/cli/tests/cli.test.ts` for replacement selected-skill flag behavior and help text.
2. Cover deprecated `--optional-skills` behavior if the alias remains.
3. Cover migration guidance if `--optional-skills` is removed.
4. Update `packages/cli/tests/install.test.ts` for legacy manifest migration from `optionalSkills` to selected skills.
5. Verify old `skills: false` manifests remain skill-disabled.
6. Verify `profileId` changes when selected skills change.
7. Verify install and reconfigure use the selected skill set without collapsing `skillFiles` into `files`.

### Acceptance criteria

- [ ] CLI tests cover new selected-skill flag behavior.
- [ ] Compatibility behavior for old `--optional-skills` is explicit and tested.
- [ ] Manifest migration tests preserve prior effective installed skill sets.
- [ ] Install tests prove selected skills drive managed skill outputs.
- [ ] `skillFiles` remains separate from `files`.

### Dependencies

- Phases 2 and 3.

## Stage 4 - Run Focused Validation

### Tasks

1. Run `npm test -w make-docs -- skill-registry`.
2. Run `npm test -w make-docs -- skill-catalog`.
3. Run `npm test -w make-docs -- wizard`.
4. Run `npm test -w make-docs -- skills-ui`.
5. Run `npm test -w make-docs -- cli`.
6. Run `npm test -w make-docs -- install`.
7. Run `npm run build -w make-docs`.
8. Run an exact stale-string check for active required/optional skill copy:

```sh
rg -n "Default skills|Required skills|Optional skills|optional skills|Which optional skills|Edit optional skills" packages/cli/src packages/cli/tests
```

### Acceptance criteria

- [ ] Focused test commands pass.
- [ ] Build passes.
- [ ] Stale-string scan has no unexpected active user-facing required/optional skill copy.
- [ ] Any allowed compatibility matches are documented in closeout notes.

### Dependencies

- Stages 1-3.

## Stage 5 - Refresh Indexes and Close Out

### Tasks

1. Reindex `jdocmunch` after docs edits.
2. Reindex `jcodemunch` after code edits.
3. Run local link checks for the new PRD change doc, baseline backlinks, plan links, and work backlog links.
4. Confirm no active PRD docs were renumbered.
5. Confirm unrelated CLI lifecycle, remote skill resolver, harness scope, and skill ownership behavior were not changed.
6. Record any follow-up risks in `docs/prd/03-open-questions-and-risk-register.md` only if they are newly discovered during implementation.

### Acceptance criteria

- [ ] `jdocmunch` index is refreshed.
- [ ] `jcodemunch` index is refreshed.
- [ ] New docs are link-valid.
- [ ] Active PRD numbering remains stable.
- [ ] The final implementation scope matches this W14 R1 backlog.
- [ ] Any remaining risks are documented or explicitly deferred.

### Dependencies

- Stage 4.
