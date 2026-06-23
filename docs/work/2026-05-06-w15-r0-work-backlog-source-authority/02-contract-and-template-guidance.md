# Phase 2: Contract and Template Guidance

## Purpose

Update active repo contracts so agents generating `docs/work/` backlogs can identify source authority without overusing skills or mirrors.

## Overview

This phase clarifies the source-priority ladder in the shipped template-owned work guidance first, then keeps the root dogfood copies aligned. The goal is guidance, not a broad rewrite of the backlog contract.

## Source PRD Docs

- [docs/prd/06-template-contracts-and-generated-assets.md](../../prd/06-template-contracts-and-generated-assets.md)
- [docs/prd/09-dogfood-and-maintainer-operations.md](../../prd/09-dogfood-and-maintainer-operations.md)
- [docs/prd/14-add-lifecycle-workflow-foundation.md](../../prd/14-add-lifecycle-workflow-foundation.md)

## Stage 1 - Update Work Router Guidance

### Tasks

- [x] t1: Add a source-authority note to `packages/docs/template/docs/work/AGENTS.md` and the aligned dogfood copy at `docs/work/AGENTS.md`.
- [x] t2: State that live lifecycle artifacts plus `docs/work/AGENTS.md`, `execution-workflow.md`, `output-contract.md`, `wave-model.md`, `work-index.md`, and `work-phase.md` drive backlog shape before fallbacks.
- [x] t3: Clarify that accepted designs, approved plans, PRDs, and existing work artifacts drive backlog content and phase structure for the current coordinate.

### Acceptance criteria

- Template-owned and dogfood `docs/work/AGENTS.md` files give agents a deterministic first-read path.
- The guidance distinguishes shape authority from content source.
- Existing directory, W/R, task, and acceptance criteria rules remain intact.

### Dependencies

- Phase 1 PRD owner reconciliation is complete.

## Stage 2 - Update Execution and Output Contracts

### Tasks

- [x] t4: Update `packages/docs/template/docs/assets/references/execution-workflow.md` and the aligned dogfood copy at `docs/assets/references/execution-workflow.md` with the source-priority ladder.
- [x] t5: Review `output-contract.md`; no edit is needed because it remains path/shape-focused and does not promote another authority source.
- [x] t6: Preserve existing active-set evolution and delta backlog rules.

### Acceptance criteria

- `execution-workflow.md` explains when to use live contracts, current lifecycle artifacts, archived examples, bundled skills, generated stubs, and mirrors.
- `output-contract.md` remains concise and path-focused unless a source-authority note is necessary.
- No existing backlog path contract changes unexpectedly.

### Dependencies

- Stage 1 is complete.

## Stage 3 - Review Work Templates

### Tasks

- [x] t7: Review `packages/docs/template/docs/assets/templates/work-index.md` and the aligned dogfood copy for source-authority wording needs.
- [x] t8: Review `packages/docs/template/docs/assets/templates/work-phase.md` and the aligned dogfood copy for source-authority wording needs.
- [x] t9: Make no work-template edits because the template comments stay shape-focused and do not leave the authority order ambiguous.

### Acceptance criteria

- Template edits, if any, are minimal and consistent with the active contracts.
- Work phase task syntax remains `- [ ] tN: ...`.
- Acceptance criteria remain plain bullets.

### Dependencies

- Stages 1 and 2 are complete.
