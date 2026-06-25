# v2 Library and Archive History IA Correction - Work Backlog

## Purpose

Implement [../../plans/2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/00-overview.md](../../plans/2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/00-overview.md). This backlog is the blocking corrective wave that supersedes W9 R4's `docs/assets/guides/**` and `docs/assets/breadcrumbs/**` decisions with `docs/assets/library/**` and `docs/assets/archive/history/**`.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-authority-and-prd-reconciliation.md](01-authority-and-prd-reconciliation.md) | Create W9 R5 authority, reconcile PRDs, and update active router/backlog handoffs. |
| [02-package-contracts-and-generators.md](02-package-contracts-and-generators.md) | Update package templates, CLI path producers, tests, skills, and generated package copies. |
| [03-dogfood-migration-and-link-repair.md](03-dogfood-migration-and-link-repair.md) | Move dogfood directories and repair non-historical links to the W9 R5 paths. |
| [04-validation-and-closeout.md](04-validation-and-closeout.md) | Run validation, refresh manifest proof, and write closeout history under archive/history. |

## Usage Notes

- Apply W9 R5 before any future v2 backlog that references managed project asset paths, closeout history paths, guide/library coverage, package templates, or dogfood migration.
- W9 R4 remains historical evidence for the prior hard move, but W9 R5 supersedes W9 R4 for guide/library and history/breadcrumb targets.
- Do not reintroduce `docs/assets/guides/**`, `docs/assets/breadcrumbs/**`, `docs/assets/history/**`, `docs/guides/**`, or `docs/library/**` as shipped-current paths.
- Preserve old path references only when they describe completed historical state.

## Intended Follow-On

Route: `implementation-loop`

Next step: Implement phases 1 through 4 in order, then resume downstream W10/W16/W17/W18 v2 work against W9 R5.

Why: The backlog turns the accepted correction into package behavior, dogfood state, and validation evidence.

Coordinate Handoff: Use `W9 R5` for implementation history, phase closeout, and final coverage decisions.
