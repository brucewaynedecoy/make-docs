# Phase 03: Handoff Drift Validation

## Purpose

Add validation that proves generated frontmatter and body handoff sections agree without turning follow-ons into hard gates.

## Source PRDs

- [../../prd/23-revise-generated-metadata-lifecycle-handoffs.md](../../prd/23-revise-generated-metadata-lifecycle-handoffs.md)
- [../../prd/14-add-lifecycle-workflow-foundation.md](../../prd/14-add-lifecycle-workflow-foundation.md)

## Tasks

- [x] t1: Add fixtures for valid `follow_on` metadata and matching body `## Intended Follow-On` rendering.
- [x] t2: Add fixtures that flag YAML/body route, prompt, reason, or coordinate handoff mismatch.
- [x] t3: Add fixtures for lifecycle departure values `none`, `source-to-design-straddle`, `skip`, `reorder`, and `revisit`.
- [x] t4: Ensure unresolved, deferred, or overridden follow-ons remain valid when body and YAML agree.
- [x] t5: Route validation into CLI-owned or shared validation code instead of leaving it only in scripts or skills if no-scripts migration is in scope.

## Acceptance Criteria

- YAML/body mismatches are reported as drift.
- Valid advisory follow-ons do not fail only because they are deferred or unresolved.
- Lifecycle departure metadata is machine-readable.

## Validation

- Run focused metadata validation tests.
- Run `npm test -w packages/cli` if validation code lives in the CLI workspace.

## Implementation Notes

- Added `packages/cli/src/document-metadata.ts` as CLI-owned generated-document metadata validation code.
- Added fixtures in `packages/cli/tests/document-metadata.test.ts` for matching `follow_on` metadata/body rendering, mismatch drift, valid lifecycle departure values, invalid metadata values, unresolved/deferred advisory handoffs, and missing follow-on surfaces.
- Kept follow-ons advisory: the validator compares metadata to the body rendering and validates known route values, but it does not fail merely because a handoff reason or coordinate handoff says deferred, unresolved, or overridden.

## Validation Evidence

- `python3 packages/skills/closeout-phase/scripts/work_phase_state.py docs/work/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/03-handoff-drift-validation.md --json`
- `npm test -w packages/cli -- document-metadata.test.ts --reporter=dot`
- `npm test -w packages/cli -- --reporter=dot`
- `git diff --check`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root . --format json`
- Changed-file Markdown link resolver for modified and untracked Markdown files.
- `jdocmunch.index_local`
- `jcodemunch.index_folder`
