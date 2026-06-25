# W16 R3 No-Scripts Migration Skill Refactor Work Backlog

## W9 R5 Prerequisite

Before executing this backlog, apply [W9 R5 v2 Library and Archive History IA Correction](../2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/00-index.md). W16 R3 must treat deterministic helper scripts and prompt starters as `.make-docs/**` system resources, route guide discovery through `docs/assets/library/**`, and route history writes through `docs/assets/archive/history/**`.

## Purpose

Implement the requirements captured in [26-revise-no-scripts-migration-skill-refactor.md](../../prd/26-revise-no-scripts-migration-skill-refactor.md) and planned in [W16 R3 No-Scripts Migration Skill Refactor Plan](../../plans/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-overview.md).

## Source Inputs

- [No-Scripts Migration and Skill Refactor](../../designs/2026-06-20-no-scripts-migration-and-skill-refactor.md)
- [W16 R3 plan overview](../../plans/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-overview.md)
- [PRD 26](../../prd/26-revise-no-scripts-migration-skill-refactor.md)
- [Risk register](../../prd/03-open-questions-and-risk-register.md)

## Phase Map

| Phase | File | Focus |
| --- | --- | --- |
| P1 | [01 Requirements and Register Reconciliation](01-requirements-and-register-reconciliation.md) | Keep PRD/risk updates aligned with the accepted design and plan. |
| P2 | [02 CLI Shared-Core Operation Boundary](02-cli-shared-core-operation-boundary.md) | Implement deterministic operation contracts before script removal. |
| P3 | [03 Skill and Script Migration](03-skill-and-script-migration.md) | Rewrite first-party skills and migrate managed script assets safely. |
| P4 | [04 Package Validation and Closeout](04-package-validation-and-closeout.md) | Prove package/template/dogfood parity and update closeout records. |

## Acceptance Gate

Do not close W16 R3 while any selected first-party skill requires a missing script or missing CLI replacement.
