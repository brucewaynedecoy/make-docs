# W17 R3 Shared Agentics Native Harness Exposure Correction Plan

## Purpose

Plan the correction from W17 R2 generated harness stubs to native harness skill exposure, based on [Shared Agentics Native Harness Exposure Correction](../../designs/2026-06-27-shared-agentics-native-harness-exposure-correction.md).

## Objective

W17 R3 should preserve the W17 R2 canonical shared payload store while replacing generated harness stubs with native harness skill directories. The implementation target is symlink-first exposure with managed copy-mirror fallback, deterministic migration away from clean W17 R2 stubs, and lifecycle-safe audit, backup, uninstall, and package validation.

Completion means active PRDs, implementation backlogs, and validation expectations no longer treat generated stubs as the future default for selected skills.

## Coordinate Decision

- Coordinate: `W17 R3`
- Classification: `revision`
- Evidence: W17 R2 is the completed shared-agentics installation wave. The corrective design preserves W17 scope and supersedes only the W17 R2 generated-stub exposure decision, so the next revision in the same wave is W17 R3.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-authority-and-prd-reconciliation.md](01-authority-and-prd-reconciliation.md) | Reconcile the corrective design into active PRDs, risk register entries, and future-facing docs. |
| [02-native-exposure-implementation.md](02-native-exposure-implementation.md) | Implement symlink-first native harness exposure and managed copy-mirror fallback in package code. |
| [03-migration-and-lifecycle-safety.md](03-migration-and-lifecycle-safety.md) | Migrate clean stubs and duplicated payloads safely while preserving modified/custom harness skill content. |
| [04-package-validation-and-closeout.md](04-package-validation-and-closeout.md) | Validate packaged behavior, platform fallback behavior, docs hygiene, and closeout records. |

## Dependencies

- W17 R2 remains historical implementation evidence for canonical shared payload placement, selected-skill planning, role classification, and lifecycle safety.
- W17 R3 supersedes W17 R2 wherever future-facing docs or code expect generated harness stubs as the default exposure mode.
- PRD 28 remains the primary active PRD owner; supporting reconciliation must update PRD 00, PRD 01, PRD 02, PRD 03, PRD 08, PRD 10, PRD 12, PRD 16, PRD 18, PRD 21, PRD 24, PRD 25, PRD 26, PRD 27, and PRD 30 where they describe generated stubs as future target behavior.
- W18 R2 plugin substrate work must inherit native harness exposure unless a later accepted plugin-specific design supersedes this W17 R3 correction.

## Validation

- Design and plan links resolve.
- Active PRDs no longer describe generated stubs as the default selected-skill exposure target.
- Backlog phases make symlink-preferred and copy-mirror fallback behavior decision-complete.
- Future implementation validation covers default installs, project-scope selected skills, global-scope selected skills, symlink exposure, copy-mirror fallback, clean W17 R2 stub migration, modified/custom preservation, audit, backup, uninstall, skills sync, package smoke, and platform fallback behavior.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `prd-generation`
- Next step: Reconcile the active PRD set from this plan, then generate the matching W17 R3 work backlog.
- Why: The corrected product contract must be reflected in PRDs before implementers change package behavior.
- Coordinate Handoff: Carry `W17 R3` into the downstream PRD reconciliation, work backlog, history records, and local commits.
