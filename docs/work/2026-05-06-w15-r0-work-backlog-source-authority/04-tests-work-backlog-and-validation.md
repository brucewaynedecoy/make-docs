# Phase 4: Tests, Work Backlog, and Validation

## Purpose

Validate the source-authority guidance change and capture implementation closeout evidence.

## Overview

This phase updates focused tests only where the guidance change affects parity, validator, renderer, or skill-registry expectations. It then runs the repository validation loop and records history after implementation phases are completed.

## Source PRD Docs

- `docs/prd/14-revise-work-backlog-source-authority.md`
- [docs/prd/09-dogfood-and-maintainer-operations.md](../../prd/09-dogfood-and-maintainer-operations.md)

## Stage 1 - Test and Consistency Updates

### Tasks

- [ ] t1: Review `packages/cli/tests/consistency.test.ts` for root, package, and mirror parity expectations.
- [ ] t2: Update consistency tests only if the source-authority wording changes expected parity relationships.
- [ ] t3: Review `packages/cli/src/renderers.ts` only if generated router text needs to mention source-authority behavior.
- [ ] t4: Review `packages/cli/tests/skill-catalog.test.ts` and `packages/cli/tests/skill-registry.test.ts` only if skill metadata or packaged assets changed.

### Acceptance criteria

- Tests continue to enforce package and mirror alignment.
- No unrelated test churn is introduced.
- Renderer expectations remain aligned with generated instruction routers.

### Dependencies

- Phases 2 and 3 are complete.

## Stage 2 - Focused Validation

### Tasks

- [ ] t5: Run `python3 -B packages/skills/decompose-codebase/scripts/test_validate_output.py`.
- [ ] t6: Run `npm test -w make-docs -- consistency renderers install skill-catalog skill-registry`.
- [ ] t7: Run `npm run build -w make-docs`.
- [ ] t8: Run `bash scripts/check-instruction-routers.sh`.
- [ ] t9: Run `bash scripts/check-wave-numbering.sh`.
- [ ] t10: Run `git diff --check`.

### Acceptance criteria

- Validation commands pass, or failures are documented with concrete blockers.
- Any baseline validation debt is separated from regressions caused by this work.
- Mirror parity failures are fixed by syncing from package source, not by hand-patching mirrors.

### Dependencies

- Stage 1 is complete.

## Stage 3 - Stale-Wording Scan

### Tasks

- [ ] t11: Scan docs and skill text for stale wording that implies `decompose-codebase` is the primary backlog-shape authority.
- [ ] t12: Scan docs and skill text for stale wording that implies `.agents` or `.claude` mirrors are independent sources.
- [ ] t13: Scan for stale `rebuild-backlog-*` wording where it conflicts with the active `work-index.md` and `work-phase.md` naming.

### Acceptance criteria

- Remaining skill-projection wording is intentional and accurate.
- Mirror wording clearly indicates parity output status.
- Root work backlog source authority is unambiguous.

### Dependencies

- Stage 2 validation is complete or blockers are documented.

## Stage 4 - Closeout Artifacts

### Tasks

- [ ] t14: Reindex docs with `jdocmunch` after docs and history edits.
- [ ] t15: Reindex code with `jcodemunch` after implementation if code-indexed review is needed.
- [ ] t16: Create `docs/assets/history/` records for completed implementation phases.
- [ ] t17: Summarize validation evidence and remaining risks for handoff.

### Acceptance criteria

- History records exist for completed implementation phases.
- The W15 R0 design, plan, PRD change doc, backlog, contract edits, skill edits, and validation evidence are traceable.
- Final handoff states whether implementation is complete and which validations were run.

### Dependencies

- Stages 1 through 3 are complete.
