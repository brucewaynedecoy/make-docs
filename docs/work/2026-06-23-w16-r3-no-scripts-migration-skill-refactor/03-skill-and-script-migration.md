# P3 Skill and Script Migration

## Purpose

Rewrite selected first-party skills so they call CLI/shared-core operations instead of owning deterministic helper logic.

## Tasks

- [x] t1: Update `closeout-commit`, `closeout-phase`, `work-on-wave`, and `work-on-phase` skill prose, references, and metadata to call the CLI/shared-core boundary.
- [x] t2: Update `packages/cli/skill-registry.json` and registry tests only after the replacement operation and skill rewrite both exist.
- [x] t3: Classify removed helper scripts as managed old scripts, managed wrappers, modified local files, or custom scripts.
- [x] t4: Preserve no-default-skills behavior for bare installs.
- [x] t5: Keep explicit selected-skill installs functional for project and home scopes.

## Implementation Notes

- Rewrote `closeout-commit`, `closeout-phase`, `work-on-wave`, and `work-on-phase` skill prose and reference guides to call `make-docs operations` for lifecycle-critical deterministic behavior.
- Removed replaced lifecycle helper scripts from `packages/cli/skill-registry.json` so selected first-party skill installs no longer require those script assets.
- Kept `closeout-phase` guide coverage assets installed because `scripts/guide_coverage_probe.py` and `scripts/persona_schema.py` were not replaced by the Phase 2 operation boundary.
- Added retired managed skill asset classification for the W16 R3 removed lifecycle helper scripts so unchanged old managed copies are removable and modified local copies are preserved for review.
- Preserved no-default-skills behavior and verified explicit selected-skill install/update/remove behavior across project and home scopes.
- Updated PRD 26 source anchors for the Phase 3 implementation and test files.
- UAT is intentionally deferred until the full W16 R3 wave is complete.

## Validation Evidence

- `npm test -w packages/cli -- --run tests/install.test.ts tests/audit.test.ts tests/skill-registry.test.ts tests/skill-catalog.test.ts tests/operations.test.ts`
- `npm test -w packages/cli -- --run tests/backup.test.ts tests/uninstall.test.ts`
- `npm test -w packages/cli -- --reporter=dot`
- `npm run build -w packages/cli`

## Acceptance Criteria

- Selected first-party skills no longer require missing script assets.
- Selected-skill install/update/remove tests cover rewritten skill assets.
- Audit, backup, uninstall, and migration behavior treats removed or wrapper scripts as managed assets with reviewable plans.
