# Phase 1: PRD Change and Baseline Annotations

## Purpose

Record source authority for plan-derived work backlog generation in the active PRD owners without creating a superseded PRD slot.

## Overview

This phase originally planned a new `docs/prd/14-revise-work-backlog-source-authority.md` change doc. The accepted v2 design set and current PRD catalog superseded that target: slot `14` was then represented by the retired action-PRD at `docs/prd/14-add-lifecycle-workflow-foundation.md` ([historical design](../../designs/2026-06-17-make-docs-lifecycle-foundation.md)); [current authority: PRD 14 Lifecycle Workflow and Coverage Passes](../../../../prd/14-lifecycle-workflow-and-coverage-passes.md) now owns the product requirements. W15 is reconciled into existing active owners instead.

## Source PRD Docs

- [docs/prd/00-index.md](../../../../prd/00-index.md)
- [docs/prd/06-template-contracts-and-generated-assets.md](../../../../prd/06-template-contracts-and-generated-assets.md)
- [docs/prd/08-skills-catalog-and-distribution.md](../../../../prd/08-skills-catalog-and-distribution.md)
- [docs/prd/09-dogfood-and-maintainer-operations.md](../../../../prd/09-dogfood-and-maintainer-operations.md)
- retired action-PRD: `docs/prd/14-add-lifecycle-workflow-foundation.md` ([historical design](../../designs/2026-06-17-make-docs-lifecycle-foundation.md); [current authority: PRD 14](../../../../prd/14-lifecycle-workflow-and-coverage-passes.md))
- [docs/prd/03-open-questions-and-risk-register.md](../../../../prd/03-open-questions-and-risk-register.md)

## Stage 1 - Resolve PRD Ownership

### Tasks

- [x] t1: Do not create `docs/prd/14-revise-work-backlog-source-authority.md`; the planned slot is obsolete under the accepted v2 PRD catalog.
- [x] t2: Define the source-priority ladder for plan-derived work backlog generation in the existing active PRD owners.
- [x] t3: Keep W15 traceability through this backlog, the source design, the W15 R0 plan, active PRD owner notes, and the session history record.

### Acceptance criteria

- No obsolete PRD file is created.
- Active PRD owner docs record the W15 source-authority requirement.
- The PRD notes name accepted lifecycle artifacts and live contracts as primary authority.
- The PRD notes treat skills, projections, mirrors, generated stubs, and archived examples as secondary or fallback surfaces.

### Dependencies

- Source design and W15 R0 plan are available.

## Stage 2 - Update PRD Index and Baselines

### Tasks

- [x] t4: Leave `docs/prd/00-index.md` unchanged because no new PRD slot is created.
- [x] t5: Add a focused change note to `docs/prd/09-dogfood-and-maintainer-operations.md` for dogfood/source-authority boundaries.
- [x] t6: Annotate confirmed impacted active owners: `06-template-contracts-and-generated-assets.md`, `08-skills-catalog-and-distribution.md`, `09-dogfood-and-maintainer-operations.md`, and `14-add-lifecycle-workflow-foundation.md`.
- [x] t7: Do not add a risk-register item; no new unresolved risk or open question was discovered beyond existing template-first and dogfood freshness items.

### Acceptance criteria

- PRD index status and lineage remain current without a new change doc.
- Baseline annotations are targeted and reference W15 reconciliation directly.
- No baseline doc is broadly rewritten for this phase.
- Any unresolved ambiguity is tracked in the risk register when discovered.

### Dependencies

- Stage 1 is complete.

## Stage 3 - Validate PRD Traceability

### Tasks

- [x] t8: Verify all new and edited PRD links resolve during final validation.
- [x] t9: Verify no active PRD files were renumbered.
- [x] t10: Reindex docs with `jdocmunch` after PRD edits.

### Acceptance criteria

- `jdocmunch` can find the edited active PRD owner docs.
- The active PRD owners, design, plan, backlog, and history record form a clear traceability chain.
- No unrelated PRD cleanup is included.

### Dependencies

- Stages 1 and 2 are complete.
