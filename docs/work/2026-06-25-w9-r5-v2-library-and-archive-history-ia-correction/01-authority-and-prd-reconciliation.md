# Phase 1: Authority and PRD Reconciliation

## Purpose

Make W9 R5 the active authority before package or dogfood paths are changed.

## Overview

This phase captures the corrective design, reconciles active PRDs in place, and updates active routers and backlog prefaces so future workers know W9 R5 supersedes W9 R4 for library and archive-history paths.

## Source PRD Docs

- [22 Revise New Docs Assets Playbooks Persona Model](../../prd/22-project-documentation-asset-model.md#requirements)
- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [09 Dogfood and Maintainer Operations](../../prd/09-dogfood-and-maintainer-operations.md)
- [19 Revise Template Package Dogfood Source of Truth Contract](../../prd/06-template-contracts-and-generated-assets.md#template-source-authority)
- [24 Revise Configuration Convention Overlay](../../prd/24-project-configuration-and-convention-overlay.md)

## Stage 1 - Authority Capture

### Tasks

- [x] t1: Create W9 R5 design authority with `Route: change-plan` and `Coordinate Handoff: W9 R5`.
- [x] t2: Create the W9 R5 plan bundle under `docs/plans/2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/`.
- [x] t3: Create the W9 R5 work backlog under `docs/work/2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/`.

### Acceptance criteria

- The design includes required design headings and lineage to W9 R4.
- The plan and work bundle use W9 R5 consistently.
- The work backlog does not ask implementers to decide the library path, archive-history path, alias policy, or dogfood boundary.

### Dependencies

- User-approved W9 R5 implementation plan.

### Evidence

- Added [../../designs/2026-06-25-v2-library-and-archive-history-ia-correction.md](../../designs/2026-06-25-v2-library-and-archive-history-ia-correction.md).
- Added [../../plans/2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/00-overview.md](../../plans/2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/00-overview.md).
- Added this W9 R5 work backlog.

## Stage 2 - Active PRD Reconciliation

### Tasks

- [x] t4: Update PRD 22 to name `docs/assets/library/**` and `docs/assets/archive/history/**` as the effective managed project asset paths.
- [x] t5: Update PRD 03 risk/register entries for duplicated path knowledge and W9 R5 supersession.
- [x] t6: Update supporting PRDs that still name old paths as future-facing authority.
- [x] t7: Update active plan/work routers and unresolved downstream backlog prefaces to apply W9 R5.

### Acceptance criteria

- Active PRD text no longer treats `docs/assets/guides/**`, `docs/assets/breadcrumbs/**`, `docs/assets/history/**`, `docs/guides/**`, or `docs/library/**` as shipped-current paths.
- Completed historical records remain factual instead of rewritten opportunistically.

### Dependencies

- Stage 1 complete.

### Evidence

- Reconciled PRD 22, PRD 03, PRD 00, and supporting PRDs 01, 02, 06, 09, 10, 14, 19, 21, 24, and 29.
- Added W9 R5 supersession guidance to active plan/work routers and downstream W10/W16/W17/W18 backlog indexes.
