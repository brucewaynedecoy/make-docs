# Phase 4: Tests, Validation, and Closeout

> Derives from [Phase 4 of the plan](../../plans/2026-04-28-w14-r0-cli-asset-selection-simplification/04-tests-delta-backlog-and-validation.md).

## Purpose

Prove the implementation satisfies the active PRD revision and close the wave with traceable validation evidence.

## Overview

This phase updates focused tests, runs the targeted validation suite, performs stale-string and link checks, refreshes MCP indexes, and records history after implementation phases complete.

## Source PRD Docs

- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [05 Installation, Profile, and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- Planned change doc: `docs/prd/11-revise-cli-asset-selection-simplification.md`

## Source Plan Phases

- [04-tests-delta-backlog-and-validation.md](../../plans/2026-04-28-w14-r0-cli-asset-selection-simplification/04-tests-delta-backlog-and-validation.md)

## Stage 1 - Update Focused Test Coverage

### Tasks

1. Update `packages/cli/tests/wizard.test.ts` for the shorter wizard options step and review summary.
2. Update `packages/cli/tests/cli.test.ts` for the chosen legacy asset flag behavior.
3. Update `packages/cli/tests/profile.test.ts` for removed asset-selection fields and profile identity behavior.
4. Update `packages/cli/tests/install.test.ts` for stale-manifest validation and always-managed asset coverage.
5. Update `packages/cli/tests/consistency.test.ts` or `packages/cli/tests/renderers.test.ts` if the expected full asset list or rendered router behavior changes.

### Acceptance criteria

- [x] Tests fail against the old user-facing asset-selection behavior.
- [x] Tests pass after Phases 2 and 3 are implemented.
- [x] Coverage includes first install and stale-manifest recovery guidance.
- [x] Coverage proves included prompts, templates, and references remain managed.

### Dependencies

- Phases 2 and 3.

## Stage 2 - Run Focused Validation

### Tasks

1. Run `npm test -w make-docs -- wizard`.
2. Run `npm test -w make-docs -- cli`.
3. Run `npm test -w make-docs -- profile`.
4. Run `npm test -w make-docs -- install`.
5. Run `npm test -w make-docs -- consistency`.
6. Run `npm test -w make-docs -- renderers`.
7. Run `npm run build -w make-docs`.

### Acceptance criteria

- [x] Focused wizard tests pass.
- [x] Focused CLI tests pass.
- [x] Focused profile tests pass.
- [x] Focused install tests pass.
- [x] Focused consistency and renderer tests pass.
- [x] Build passes, or any failure is documented with exact failing command and root cause.

### Dependencies

- Stage 1.

## Stage 3 - Run Stale-String and Link Checks

### Tasks

1. Search runtime code and tests for the removed prompt strings:
   - `Install starter prompts?`
   - `Which document templates should be installed?`
   - `Which reference files should be installed?`
2. Search for remaining asset-mode references:
   - `Starter prompts`
   - `Template mode`
   - `Reference mode`
   - `templatesMode`
   - `referencesMode`
   - `no-prompts`
3. Review each remaining hit and classify it as stale-manifest validation, removed-flag test coverage, PRD/history, or stale runtime surface.
4. Check local Markdown links in touched design, plan, PRD, and work files.

### Acceptance criteria

- [x] Removed prompt strings are absent from runtime code.
- [x] Remaining asset-mode references are intentional and documented by tests or PRD/history context.
- [x] Touched Markdown links resolve.
- [x] No new broken internal links are introduced.

### Dependencies

- Stage 2.

## Stage 4 - Refresh Indexes and Record History

### Tasks

1. Reindex `jcodemunch` after code edits.
2. Reindex `jdocmunch` after docs edits.
3. Add phase-scoped history records under `docs/assets/history/` after implementation phases complete, following `docs/assets/references/history-record-contract.md`.
4. Ensure history records cite the PRD change doc, plan, work backlog, and validation evidence.

### Acceptance criteria

- [x] `jcodemunch` can find changed CLI symbols after reindexing.
- [x] `jdocmunch` can find the new PRD change doc and work backlog after reindexing.
- [x] History records exist for completed implementation phases.
- [x] History records use the `w14-r0-pN` coordinate pattern.

### Dependencies

- Stages 1-3.

## Stage 5 - Final Review

### Tasks

1. Review `git diff` for unintended scope.
2. Confirm no unrelated files were changed.
3. Confirm the active PRD namespace, plan, work backlog, and history records agree on the effective requirement.
4. Summarize validation commands and outcomes for the user.

### Acceptance criteria

- [x] Diff scope matches W14 R0.
- [x] Effective requirement is consistent across PRD, plan, and work artifacts.
- [x] User-facing closeout includes changed files and validation status.

### Dependencies

- Stages 1-4.
