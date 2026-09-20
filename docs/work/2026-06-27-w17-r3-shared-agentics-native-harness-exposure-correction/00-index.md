# W17 R3 Shared Agentics Native Harness Exposure Correction Work Backlog

## Purpose

Implement the W17 R3 correction that supersedes the W17 R2 generated-stub default for selected skill exposure.

W17 R3 preserves the W17 R2 canonical shared payload store and lifecycle classification work, but selected skills must now appear in enabled harnesses as native skill directories. Symlink exposure is preferred, managed copy mirrors are the compatibility fallback, and generated stubs are legacy migration inputs or explicit diagnostics only.

## Source Inputs

- [Shared Agentics Native Harness Exposure Correction](../../designs/2026-06-27-shared-agentics-native-harness-exposure-correction.md)
- [W17 R3 plan](../../plans/2026-06-27-w17-r3-shared-agentics-native-harness-exposure-correction/00-overview.md)
- [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md)
- [PRD 03](../../prd/03-open-questions-and-risk-register.md)
- [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md)
- [PRD 08](../../prd/08-skills-catalog-and-distribution.md)
- [PRD 10](../../prd/10-packaging-validation-and-release-reference.md)
- [PRD 18](../../prd/18-compatibility-classification-and-migration-safety.md)
- [PRD 30](../../prd/30-plugin-substrate-and-workflow-bundles.md)

## Phase Map

| Phase | File | Goal |
| --- | --- | --- |
| P1 | [01-authority-and-prd-reconciliation.md](01-authority-and-prd-reconciliation.md) | Confirm W17 R3 authority, supersession notes, and active-doc alignment before code changes. |
| P2 | [02-native-exposure-implementation.md](02-native-exposure-implementation.md) | Replace generated-stub production with symlink-preferred native exposure and copy-mirror fallback. |
| P3 | [03-migration-and-lifecycle-safety.md](03-migration-and-lifecycle-safety.md) | Migrate clean legacy stubs safely and make audit, backup, uninstall, and sync link-aware. |
| P4 | [04-package-validation-and-closeout.md](04-package-validation-and-closeout.md) | Prove package behavior, smoke coverage, cross-platform fallback, and closeout records. |

## Acceptance Gate

- Future-facing selected-skill installs produce one canonical shared payload per scope plus native harness exposure.
- Harness-visible `SKILL.md` files contain the real skill metadata and description.
- Symlink exposure is preferred and managed copy mirrors are the deterministic fallback.
- Clean W17 R2 stubs are migrated; modified stubs and custom harness skills are preserved for review.
- Backup and uninstall never follow symlink targets destructively.
- Package validation proves default installs remain skill-free and selected installs no longer generate generic stubs.
