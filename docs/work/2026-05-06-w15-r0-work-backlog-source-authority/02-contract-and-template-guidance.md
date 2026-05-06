# Phase 2: Contract and Template Guidance

## Purpose

Update active repo contracts so agents generating `docs/work/` backlogs can identify source authority without overusing skills or mirrors.

## Overview

This phase clarifies the root source-priority ladder in `docs/work/AGENTS.md` and the relevant `docs/assets` references/templates. The goal is guidance, not a broad rewrite of the backlog contract.

## Source PRD Docs

- `docs/prd/14-revise-work-backlog-source-authority.md`
- [docs/prd/09-dogfood-and-maintainer-operations.md](../../prd/09-dogfood-and-maintainer-operations.md)

## Stage 1 - Update Work Router Guidance

### Tasks

- [ ] t1: Add a source-authority note to `docs/work/AGENTS.md`.
- [ ] t2: State that `docs/work/AGENTS.md`, `execution-workflow.md`, `output-contract.md`, `wave-model.md`, `work-index.md`, and `work-phase.md` are primary for backlog shape.
- [ ] t3: Clarify that approved plans drive backlog content and phase structure.

### Acceptance criteria

- `docs/work/AGENTS.md` gives agents a deterministic first-read path.
- The guidance distinguishes shape authority from content source.
- Existing directory, W/R, task, and acceptance criteria rules remain intact.

### Dependencies

- Phase 1 PRD change doc is complete.

## Stage 2 - Update Execution and Output Contracts

### Tasks

- [ ] t4: Update `docs/assets/references/execution-workflow.md` backlog rules with the source-priority ladder.
- [ ] t5: Update `docs/assets/references/output-contract.md` only if required-path or work-output guidance needs a source-authority note.
- [ ] t6: Preserve existing active-set evolution and delta backlog rules.

### Acceptance criteria

- `execution-workflow.md` explains when to use root contracts, plans, archived examples, package skills, and mirrors.
- `output-contract.md` remains concise and path-focused unless a source-authority note is necessary.
- No existing backlog path contract changes unexpectedly.

### Dependencies

- Stage 1 is complete.

## Stage 3 - Review Work Templates

### Tasks

- [ ] t7: Review `docs/assets/templates/work-index.md` for source-authority wording needs.
- [ ] t8: Review `docs/assets/templates/work-phase.md` for source-authority wording needs.
- [ ] t9: Make minimal template edits only if template comments currently leave the authority order ambiguous.

### Acceptance criteria

- Template edits, if any, are minimal and consistent with the active contracts.
- Work phase task syntax remains `- [ ] tN: ...`.
- Acceptance criteria remain plain bullets.

### Dependencies

- Stages 1 and 2 are complete.
