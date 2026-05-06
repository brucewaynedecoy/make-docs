# Phase 1: PRD Change and Baseline Annotations

## Purpose

Create the active-set PRD change documentation that defines source authority for plan-derived work backlog generation.

## Overview

This phase records the source-authority change in the active PRD namespace before contract, skill, or validation surfaces are updated.

## Source PRD Docs

- Planned: `docs/prd/14-revise-work-backlog-source-authority.md`
- [docs/prd/00-index.md](../../prd/00-index.md)
- [docs/prd/09-dogfood-and-maintainer-operations.md](../../prd/09-dogfood-and-maintainer-operations.md)
- [docs/prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md)

## Stage 1 - Create the PRD Change Doc

### Tasks

- [ ] t1: Create `docs/prd/14-revise-work-backlog-source-authority.md` from the revision change template.
- [ ] t2: Define the source-priority ladder for plan-derived work backlog generation.
- [ ] t3: Link the PRD change doc to the source design and W15 R0 plan.

### Acceptance criteria

- The PRD change doc exists at the planned path.
- The doc identifies the change type as `revision`.
- The doc names root contracts and templates as primary authority.
- The doc treats skills, projections, mirrors, and archived examples as secondary or fallback surfaces.

### Dependencies

- Source design and W15 R0 plan are available.

## Stage 2 - Update PRD Index and Baselines

### Tasks

- [ ] t4: Update `docs/prd/00-index.md` to include `docs/prd/14-revise-work-backlog-source-authority.md`.
- [ ] t5: Add a focused change note to `docs/prd/09-dogfood-and-maintainer-operations.md` if it covers generated-doc, skill, or mirror maintenance workflows.
- [ ] t6: Search for other baseline PRD docs that describe plan-to-work backlog generation and annotate only confirmed impacted docs.
- [ ] t7: Record concrete risks or open questions in `docs/prd/03-open-questions-and-risk-register.md` only if discovered.

### Acceptance criteria

- PRD index status and lineage are current.
- Baseline annotations are targeted and backlink to the new PRD change doc.
- No baseline doc is broadly rewritten for this phase.
- Any unresolved ambiguity is tracked in the risk register.

### Dependencies

- Stage 1 is complete.

## Stage 3 - Validate PRD Traceability

### Tasks

- [ ] t8: Verify all new and edited PRD links resolve.
- [ ] t9: Verify no active PRD files were renumbered.
- [ ] t10: Reindex docs with `jdocmunch` after PRD edits.

### Acceptance criteria

- `jdocmunch` can find the new PRD change doc.
- The PRD index, design, plan, and backlog form a clear traceability chain.
- No unrelated PRD cleanup is included.

### Dependencies

- Stages 1 and 2 are complete.
