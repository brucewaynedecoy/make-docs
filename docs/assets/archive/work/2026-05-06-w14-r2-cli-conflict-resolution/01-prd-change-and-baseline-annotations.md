# Phase 1: PRD Change and Baseline Annotations

## Purpose

Create the active-set PRD change documentation that defines the CLI conflict-resolution revision before implementation begins.

## Overview

This phase converts the approved design and plan into the PRD contract that implementation workers should follow. It creates the new revision doc, updates the PRD index, and annotates baseline docs that currently describe install and asset-selection behavior.

## Source PRD Docs

- Planned: `docs/prd/13-revise-cli-conflict-resolution.md`
- [docs/prd/00-index.md](../../../../prd/00-index.md)
- [docs/prd/07-cli-command-surface-and-lifecycle.md](../../../../prd/07-cli-command-surface-and-lifecycle.md)
- [historical design](../../designs/2026-04-28-cli-asset-selection-simplification.md) (retired action-PRD: `docs/prd/11-revise-cli-asset-selection-simplification.md`)
- [docs/prd/03-open-questions-and-risk-register.md](../../../../prd/03-open-questions-and-risk-register.md)

## Stage 1 - Create the PRD Change Doc

### Tasks

- [x] t1: Create `docs/prd/13-revise-cli-conflict-resolution.md` from the revision change template.
- [x] t2: Capture the batch-first conflict decision, grouped review order, overwrite/skip-only per-file decisions, and deterministic apply behavior.
- [x] t3: Link the PRD change doc to the source design and W14 R2 plan.

### Acceptance criteria

- The PRD change doc exists at the planned path.
- The doc identifies the change type as `revision`.
- The doc clearly scopes agent instructions, references, and templates as reviewable managed-file diff groups.
- The doc states that `Update` is removed from this conflict-resolution flow.

### Dependencies

- Source design and plan are available.
- `docs/assets/templates/prd-change-revision.md` is current.

## Stage 2 - Annotate Baseline PRD Docs

### Tasks

- [x] t4: Update `docs/prd/00-index.md` to include `docs/prd/13-revise-cli-conflict-resolution.md`.
- [x] t5: Add a change note in `docs/prd/07-cli-command-surface-and-lifecycle.md` for revised install/reconfigure conflict behavior.
- [x] t6: Add a follow-on note in `docs/prd/11-revise-cli-asset-selection-simplification.md` connecting always-managed references and templates to explicit conflict handling.
- [x] t7: Record concrete risks or open questions in `docs/prd/03-open-questions-and-risk-register.md` only if discovered.

### Acceptance criteria

- PRD index status and lineage are current.
- Baseline annotations point readers to the new PRD change doc.
- Existing baseline text is preserved except for targeted annotations.
- Any new risk is tracked in the risk register rather than only in implementation notes.

### Dependencies

- Stage 1 is complete.

## Stage 3 - Validate PRD Traceability

### Tasks

- [x] t8: Verify every new or edited PRD link resolves.
- [x] t9: Verify no active PRD files were renumbered.
- [x] t10: Reindex docs with `jdocmunch` after the PRD edits.

### Acceptance criteria

- `jdocmunch` can find the new PRD change doc.
- The PRD index, baseline annotations, design, and plan form a clear traceability chain.
- No unrelated PRD cleanup is included in this phase.

### Dependencies

- Stages 1 and 2 are complete.
