# Work Backlog Source Authority - Work Backlog

## Purpose

Coordinate implementation for the W15 R0 work backlog source-authority revision derived from [2026-05-06-work-backlog-source-authority.md](../../designs/2026-05-06-work-backlog-source-authority.md) and [2026-05-06-w15-r0-work-backlog-source-authority](../../plans/2026-05-06-w15-r0-work-backlog-source-authority/00-overview.md).

This is a delta backlog. It should update the plan-to-work backlog workflow contracts and skill guidance without regenerating the full active PRD or work backlog set.

## Source Design

- [2026-05-06-work-backlog-source-authority.md](../../designs/2026-05-06-work-backlog-source-authority.md)

## Source Plan

- [00-overview.md](../../plans/2026-05-06-w15-r0-work-backlog-source-authority/00-overview.md)
- [01-prd-change-and-baseline-annotations.md](../../plans/2026-05-06-w15-r0-work-backlog-source-authority/01-prd-change-and-baseline-annotations.md)
- [02-contract-and-template-guidance.md](../../plans/2026-05-06-w15-r0-work-backlog-source-authority/02-contract-and-template-guidance.md)
- [03-skill-projection-and-mirror-alignment.md](../../plans/2026-05-06-w15-r0-work-backlog-source-authority/03-skill-projection-and-mirror-alignment.md)
- [04-tests-work-backlog-and-validation.md](../../plans/2026-05-06-w15-r0-work-backlog-source-authority/04-tests-work-backlog-and-validation.md)

## Phase Map

| Phase | File | Owner Scope | Summary |
| --- | --- | --- | --- |
| 1 | [01-prd-change-and-baseline-annotations.md](./01-prd-change-and-baseline-annotations.md) | Active PRD owners | Reconcile W15 into existing PRD owners without creating the superseded PRD slot. |
| 2 | [02-contract-and-template-guidance.md](./02-contract-and-template-guidance.md) | Template-owned contracts and dogfood copies | Update shipped template guidance first, then align root dogfood copies with the source-priority ladder. |
| 3 | [03-skill-projection-and-mirror-alignment.md](./03-skill-projection-and-mirror-alignment.md) | Package skill and generated harness disposition | Align `decompose-codebase` package guidance and document why absent harness mirrors are not recreated. |
| 4 | [04-tests-work-backlog-and-validation.md](./04-tests-work-backlog-and-validation.md) | Tests and validation | Update focused checks, validate, and record closeout evidence. |

## Execution Order

1. Complete Phase 1 before editing root contracts or skill guidance.
2. Complete Phase 2 before syncing package skill projections.
3. Complete Phase 3 before final parity and validator checks.
4. Complete Phase 4 after all implementation surfaces are stable.

## Global Constraints

- Do not change the W14 R2 CLI conflict-resolution design, plan, or backlog.
- Do not recreate absent `.agents` or `.claude` mirrors for this reconciliation; current v2 direction treats harness exposure as generated/fallback output.
- Do not remove skill-local bundled assets.
- Do not add a new validator path if existing work-phase validation can cover the contract.
- Keep `### Tasks` as checkbox items with phase-local `tN` IDs.
- Keep `### Acceptance criteria` as plain bullets.

## Completion Definition

The backlog is complete when all phase tasks are checked, source-authority guidance is traceable from design through active PRD owners, template-owned contracts, dogfood copies, skill projections, generated-harness disposition, tests, and history, and validation passes or blockers are documented.
