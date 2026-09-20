# Phase 4: Output Writers, Lifecycle, and Validation

## Purpose

Implement accepted package-plan writers, lifecycle behavior, validation, guide updates, history, and closeout for Playbook packaging.

## Overview

This phase writes generated plugin and skills-bundle outputs only after package plans are accepted or proven fully deterministic and safe. It also closes package validation and documentation coverage for the new v2 capability.

## Source PRD Docs

- [33 Enhance Playbook Packaging and Harness Adapter Registry](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](../../prd/30-plugin-substrate-and-workflow-bundles.md)
- [28 Revise Shared Agentics Installation Harness Redirection](../../prd/28-shared-agentics-installation-and-harness-exposure.md)
- [32 Revise Lifecycle Backup State and Agentics Pruning](../../prd/30-plugin-substrate-and-workflow-bundles.md) (historical section: `update-migration-audit-backup-and-uninstall`)
- [10 Packaging Validation and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)

## Stage 1 - Output Writers

### Tasks

- [x] t1: Implement plugin output writing through accepted package plans.
- [x] t2: Implement skills-bundle output writing through accepted package plans.
- [x] t3: Record source Playbook provenance, source digests, package profile, target harness, output kind, surface, scope, adapter id, generated artifact inventory, support status, and review status.
- [x] t4: Keep export-only outputs separate from installed selected-agentics state.

### Acceptance criteria

- Writers do not run without an accepted or fully deterministic safe package plan.
- Generated outputs are distinguishable from source Playbooks.
- Plugin and skills-bundle outputs preserve provenance to source Playbook refs and digests.
- Export-only output cannot be mistaken for an installed Make Docs-owned harness exposure.

### Dependencies

- Phase 2 package planner and Phase 3 surface resolution.

## Stage 2 - Lifecycle Safety

### Tasks

- [x] t5: Integrate generated outputs with manifest, audit, backup, uninstall, migration, and dry-run diagnostics.
- [x] t6: Preserve user-modified generated outputs for review instead of overwriting or deleting them blindly.
- [x] t7: Remove stale generated outputs only when audit proves Make Docs ownership and backup has captured the reviewed snapshot.
- [x] t8: Prune empty managed `.make-docs/agentics/**` directories only under the W17 R4 safety rule.

### Acceptance criteria

- Lifecycle output distinguishes generated plugins, generated skills bundles, adapters, symlinks, copy mirrors, export-only files, user-authored files, and legacy generated outputs.
- Backup and uninstall consume one reviewed audit snapshot before destructive changes.
- Modified local outputs route to review or manual resolution.
- Stale generated outputs do not remain orphaned after accepted package changes.

### Dependencies

- Stage 1 output writers.

## Stage 3 - Validation and Closeout

### Tasks

- [x] t9: Add unit and integration tests for package plans, adapter resolution, writers, lifecycle safety, and non-interactive review stops.
- [x] t10: Extend package smoke or equivalent package validation so generated outputs and local run/conformance artifacts are included or excluded intentionally.
- [x] t11: Add conformance scenarios for generated plugin and skills-bundle support claims.
- [x] t12: Update user and developer guides with final command names, supported output kinds, adapter behavior, and known limitations.
- [x] t13: Create W18 R5 closeout history under `docs/assets/archive/history/**` and run docs/package hygiene checks.

### Acceptance criteria

- `npm test -w packages/cli -- --reporter=dot`, `npm run validate:defaults -w packages/cli`, `npm run build -w packages/cli`, and `npm run smoke:pack` pass or documented blockers are recorded.
- `git diff --check`, changed-file Markdown/link checks, `python3 .make-docs/scripts/check_path_hygiene.py --repo-root .`, and `bash scripts/check-wave-numbering.sh` pass or baseline debt is reported separately.
- Generated outputs are not accidentally shipped in templates or tarballs unless selected as reviewed first-party shipped assets.
- Guides explain what users can package and how maintainers add harness support.
- Manual UAT coverage is decided after the full wave is complete.

### Dependencies

- Stages 1 and 2.

## Implementation Notes

- Added `packages/cli/src/operations/playbook-packaging/writers.ts` with `playbook-package-write` support for dry-run diagnostics and explicit `--write` mutation.
- Generated plugin and skills-bundle payloads now write through accepted or deterministic-safe plans, record generated-output provenance, and stop before overwriting modified outputs.
- Installed outputs update the existing Make Docs manifest so lifecycle audit, backup, uninstall, migration, and diagnostics can classify generated payloads, symlink exposures, and copy mirrors.
- Export-only packages write under `.make-docs/exports/playbook-packages/**` without becoming installed harness exposure state.
- Manual UAT is deferred until the full W18 R5 wave closeout decision.

## Validation Notes

- Passed: `npm test -w packages/cli -- --run tests/playbook-packaging.test.ts --reporter=dot`.
- Passed: `npm test -w packages/cli -- --reporter=dot`.
- Passed: `npm run validate:defaults -w packages/cli`.
- Passed: `npm run build -w packages/cli`.
- Passed: `npm run smoke:pack`.
- Passed: `git diff --check`.
- Passed: changed-file Markdown style, changed-file Markdown link, and placeholder checks.
- Passed: `python3 .make-docs/scripts/check_path_hygiene.py --repo-root .`.
- Passed: `bash scripts/check-wave-numbering.sh`.
- Full-doc broken-link scanning still reports unrelated baseline debt in archived/template docs; changed-file link checks passed for the Phase 4 docs touched here.
- Manual UAT coverage is worthwhile for the completed W18 R5 wave because `make-docs operations playbook-package-write` is user-visible; the recommended scenario is recorded in the W18 R5 P4 closeout history.
