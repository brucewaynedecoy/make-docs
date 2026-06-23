# Phase 03: Handoff Drift Validation

## Purpose

Add validation that proves generated frontmatter and body handoff sections agree without turning follow-ons into hard gates.

## Source PRDs

- [../../prd/23-revise-generated-metadata-lifecycle-handoffs.md](../../prd/23-revise-generated-metadata-lifecycle-handoffs.md)
- [../../prd/14-add-lifecycle-workflow-foundation.md](../../prd/14-add-lifecycle-workflow-foundation.md)

## Tasks

- [ ] `W16R1-P3-T1` Add fixtures for valid `follow_on` metadata and matching body `## Intended Follow-On` rendering.
- [ ] `W16R1-P3-T2` Add fixtures that flag YAML/body route, prompt, reason, or coordinate handoff mismatch.
- [ ] `W16R1-P3-T3` Add fixtures for lifecycle departure values `none`, `source-to-design-straddle`, `skip`, `reorder`, and `revisit`.
- [ ] `W16R1-P3-T4` Ensure unresolved, deferred, or overridden follow-ons remain valid when body and YAML agree.
- [ ] `W16R1-P3-T5` Route validation into CLI-owned or shared validation code instead of leaving it only in scripts or skills if no-scripts migration is in scope.

## Acceptance Criteria

- YAML/body mismatches are reported as drift.
- Valid advisory follow-ons do not fail only because they are deferred or unresolved.
- Lifecycle departure metadata is machine-readable.

## Validation

- Run focused metadata validation tests.
- Run `npm test -w packages/cli` if validation code lives in the CLI workspace.
