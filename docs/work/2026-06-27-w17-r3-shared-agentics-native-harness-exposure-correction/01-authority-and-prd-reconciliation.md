# P1 Authority and PRD Reconciliation

## Goal

Confirm the W17 R3 corrective authority before implementation starts.

## Source PRD Docs

- [PRD 28](../../prd/28-revise-shared-agentics-installation-harness-redirection.md)
- [PRD 03](../../prd/03-open-questions-and-risk-register.md)
- [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md)
- [PRD 08](../../prd/08-skills-catalog-and-distribution.md)
- [PRD 10](../../prd/10-packaging-validation-and-release-reference.md)
- [PRD 30](../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md)

## Tasks

- [x] t1: Confirm the W17 R3 design supersedes only the W17 R2 generated-stub default and preserves W17 R2 shared-payload/lifecycle evidence.
- [x] t2: Confirm active PRDs name native harness exposure, symlink preference, managed copy-mirror fallback, legacy generated-stub classification, and copy-mirror preservation behavior.
- [x] t3: Confirm W18 R2 plugin substrate docs inherit W17 R3 native exposure unless a later plugin-specific design supersedes it.
- [x] t4: Scan active plans and backlogs so future-facing work does not treat generated stubs as selected-skill target behavior.
- [x] t5: Record any remaining historical W17 R2 stub references as intentional historical evidence, not executable W17 R3 requirements.

## Acceptance Criteria

- W17 R3 is the clear future-facing authority for selected-skill harness exposure.
- No active PRD asks implementers to decide between stubs, symlinks, and copy mirrors.
- W17 R2 completed backlog and history remain factual without being reopened.
- W18 R2 and W18 R3 future work no longer inherit a generated-stub default.

## Validation Notes

Use targeted phrase scans for `generated-stub`, `generated harness stubs`, `harness stubs`, `symlink`, and `copy-mirror`. Historical hits are acceptable only when a nearby W17 R3 supersession note or legacy-classification context makes the status clear.

Phase 1 validation confirmed:

- [Shared Agentics Native Harness Exposure Correction](../../designs/2026-06-27-shared-agentics-native-harness-exposure-correction.md) is the corrective authority and supersedes only the W17 R2 generated-stub default.
- [Shared Agentics Installation and Harness Redirection](../../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md) now carries a W17 R3 supersession note while preserving historical W17 R2 content.
- [PRD 28](../../prd/28-revise-shared-agentics-installation-harness-redirection.md), [PRD 03](../../prd/03-open-questions-and-risk-register.md), [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md), [PRD 08](../../prd/08-skills-catalog-and-distribution.md), [PRD 10](../../prd/10-packaging-validation-and-release-reference.md), and [PRD 30](../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md) all name W17 R3 native exposure, symlink preference, managed copy-mirror fallback, or legacy generated-stub classification where relevant.
- W18 R2 plugin planning and backlog files inherit W17 R3 native exposure and reserve generated adapters for plugin-specific harness needs.
- Remaining W17 R2 stub references are historical, legacy-classification, or W17 R3 migration evidence.

Coverage decisions:

- Developer guide coverage: none. Phase 1 confirmed authority and did not create a new maintainer workflow beyond the W17 R3 backlog itself.
- User guide coverage: none. Phase 1 did not change shipped user behavior.
- PRD coverage: none. Active PRDs and risk-register entries were already reconciled by the W17 R3 planning pass; Phase 1 verified that surface rather than changing requirements.
- UAT coverage: deferred until the W17 R3 wave is fully implemented, per user instruction.
