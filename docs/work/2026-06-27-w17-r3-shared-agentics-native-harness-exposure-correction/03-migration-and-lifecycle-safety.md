# P3 Migration and Lifecycle Safety

## Goal

Migrate W17 R2 stub installs without damaging user-authored harness skills.

## Source PRD Docs

- [PRD 28](../../prd/28-revise-shared-agentics-installation-harness-redirection.md)
- [PRD 18](../../prd/18-revise-compatibility-audit-and-migration-disposition.md)
- [PRD 03](../../prd/03-open-questions-and-risk-register.md)
- [PRD 05](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md)
- [PRD 08](../../prd/08-skills-catalog-and-distribution.md)

## Tasks

- [x] t1: Classify clean manifest-owned W17 R2 generated stubs separately from modified stubs, custom harness skills, and ambiguous missing-manifest state.
- [x] t2: Replace clean legacy stubs with symlink exposure when possible or managed copy mirrors when fallback is required.
- [x] t3: Classify clean legacy duplicated per-harness payloads and migrate them to shared payload plus native exposure only when ownership and content evidence are clear.
- [x] t4: Preserve modified stubs, modified copy mirrors, wrong-target symlinks, custom harness skill directories, malformed manifests, and ambiguous missing-manifest state for review.
- [x] t5: Update audit, backup, uninstall, and sync to use link-aware filesystem behavior so symlink targets are not traversed or deleted destructively.
- [x] t6: Ensure uninstall removes only reviewed Make Docs-owned symlink exposures or clean copy mirrors, and prunes empty directories only after unmanaged-descendant checks.
- [x] t7: Ensure non-interactive runs fail before unsafe migration when a review decision is required.

## Acceptance Criteria

- Clean W17 R2 generated stubs do not remain stale after reviewed migration or sync.
- Modified W17 R2 stubs and custom harness skills are not overwritten or deleted silently.
- Wrong-target symlinks and modified copy mirrors route to review.
- Backup and uninstall consume one reviewed audit snapshot.
- Link-aware lifecycle logic unlinks symlink exposures without following canonical payload targets.

## Validation Notes

Phase 3 package validation completed:

- `npm test -w packages/cli -- --run tests/audit.test.ts tests/install.test.ts`
- `npm test -w packages/cli -- --reporter=dot`

Lifecycle coverage confirmed:

- clean manifest-owned W17 R2 generated stubs migrate to native exposure;
- modified W17 R2 generated stubs stay review-only;
- clean legacy duplicated per-harness payloads migrate only when manifest/content evidence matches;
- wrong-target symlink exposures and modified copy-mirror exposures are preserved by audit with `manifest-skill-exposure-mismatch`;
- backup and uninstall consume audit snapshots with native exposure directories represented as directory entries;
- missing-manifest ambiguous state remains blocked by existing non-interactive CLI compatibility tests;
- copy-mirror fallback tests now explicitly unstub environment variables after each test to keep global-scope symlink validation isolated.

Manual UAT remains deferred until the full W17 R3 wave is complete.
