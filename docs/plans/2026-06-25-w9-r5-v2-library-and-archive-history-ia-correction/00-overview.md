# v2 Library and Archive History IA Correction - PRD Change Plan

## Objective

Reconcile and implement the accepted [v2 Library and Archive History IA Correction](../../designs/2026-06-25-v2-library-and-archive-history-ia-correction.md) so future Make Docs v2 work uses `docs/assets/library/**` for guide/persona documentation and `docs/assets/archive/history/**` for history and breadcrumb records.

Completion means active authority docs, package/template behavior, dogfood directories, closeout helpers, tests, and generated package copies no longer treat `docs/assets/guides/**`, `docs/assets/breadcrumbs/**`, `docs/assets/history/**`, `docs/guides/**`, or `docs/library/**` as shipped-current targets.

## Coordinate Decision

- Coordinate: `W9 R5`
- Classification: `revision`
- Evidence: W9 R5 revises completed W9 R4 path decisions after the user updated [evolution-direction-structure.md](../../assets/artifacts/evolution-direction-structure.md). W9 R4 remains historical evidence; W9 R5 is the next revision in the same W9 asset-IA line.

## Change Classification

- Requested change type: revision
- Effective execution mode: `active-set evolution`
- Cleanup rewrite requested: yes, limited to future-facing path authority and local dogfood migration
- Full backlog regeneration requested: no

## Change Inputs

| Input | Format | Location | Confidence |
| ----- | ------ | -------- | ---------- |
| Library/archive-history correction design | design | [../../designs/2026-06-25-v2-library-and-archive-history-ia-correction.md](../../designs/2026-06-25-v2-library-and-archive-history-ia-correction.md) | high |
| Structure seed artifact | artifact | [../../assets/artifacts/evolution-direction-structure.md](../../assets/artifacts/evolution-direction-structure.md) | high |
| W9 R4 implementation evidence | plan/work/history | [../2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-overview.md](../2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-overview.md) | high |
| Active PRD set | PRD | [../../prd/00-index.md](../../prd/00-index.md) | high |

## Baseline Context

The active PRD set and package implementation already adopted W9 R4. That means `.make-docs/**`, `docs/assets/archive/**`, `docs/assets/artifacts/**`, and `docs/assets/playbooks/**` largely have the correct shape, while `docs/assets/guides/**` and `docs/assets/breadcrumbs/**` must be corrected to `docs/assets/library/**` and `docs/assets/archive/history/**`.

This plan intentionally departs from the default plan-then-PRD-stop flow because the user explicitly authorized implementation from the plan. The PRD reconciliation is still performed before package/dogfood migration so implementation has one active authority.

## Output Contract

- Plan directory: `docs/plans/2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/`
- Work backlog: `docs/work/2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/`
- Active PRDs to reconcile in place: [00 Index](../../prd/00-index.md), [02 Architecture Overview](../../prd/02-architecture-overview.md), [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md), [09 Dogfood and Maintainer Operations](../../prd/09-dogfood-and-maintainer-operations.md), [19 Template Package Dogfood Source of Truth Contract](../../prd/19-revise-template-package-dogfood-source-of-truth-contract.md), [22 New Docs Assets Playbooks Persona Model](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md), and [24 Configuration Convention Overlay](../../prd/24-revise-configuration-convention-overlay.md).
- Do not create a new numbered PRD change doc for this correction.
- Preserve historical references when they describe completed pre-W9 R5 state.

## Phase Map

| File | Purpose |
| ---- | ------- |
| [01-authority-and-prd-reconciliation.md](01-authority-and-prd-reconciliation.md) | Lock W9 R5 authority, reconcile PRDs, and mark active plan/work routers with the new blocking path contract. |
| [02-package-contracts-and-generators.md](02-package-contracts-and-generators.md) | Update package templates, CLI path producers, tests, smoke-pack expectations, skills, and generated template copies. |
| [03-dogfood-migration-and-link-repair.md](03-dogfood-migration-and-link-repair.md) | Move repo-root dogfood guide, history, breadcrumb, and transitional library content to the W9 R5 paths and repair live links. |
| [04-validation-and-closeout.md](04-validation-and-closeout.md) | Refresh manifest evidence, run validation, record closeout under `docs/assets/archive/history/**`, and document residual risk. |

## Worker Ownership

Execution is single-agent fallback in this session because the user requested direct implementation and did not explicitly ask for delegated subagents. The write scopes remain phase-separated so a future orchestrator can replay the work with delegation if needed.

## MCP Strategy

- Preferred servers available: `jdocmunch` for docs search and `jcodemunch` for code search.
- Fallback plan if unavailable: direct `rg`, targeted file reads, and package tests.

## Validation

- Confirm active future-facing docs use `docs/assets/library/**` and `docs/assets/archive/history/**`.
- Confirm fresh installs and smoke-pack outputs do not create old guide/breadcrumb/history/library directories.
- Confirm package template, CLI template copy, root dogfood routers, catalog path selection, compatibility fallback paths, and closeout helpers agree.
- Run CLI tests, default validation, build, smoke-pack, `git diff --check`, path hygiene, wave numbering, instruction-router checks, and targeted path scans.

## Intended Follow-On

Route: `prd-generation`

Next step: Reconcile the active PRD set from this plan, then execute the W9 R5 work backlog phase-by-phase.

Why: The PRD set and work backlog must become the product contract before implementation changes rewrite package behavior and dogfood paths.

Coordinate Handoff: Carry `W9 R5` into PRD reconciliation, work backlog execution, package/dogfood migration, history records, and closeout.
