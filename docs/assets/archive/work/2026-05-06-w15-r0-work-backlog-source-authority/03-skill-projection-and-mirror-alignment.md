# Phase 3: Skill Projection and Mirror Alignment

## Purpose

Align `decompose-codebase` package skill guidance with the v2 source-authority contract and record why legacy mirror sync does not apply in this checkout.

## Overview

This phase updates package skill text first. The original mirror-sync target is superseded by the current checkout and v2 shared-agentics direction: `.agents/skills/decompose-codebase/` and `.claude/skills/decompose-codebase/` do not exist here, and future harness exposure should be generated rather than hand-maintained.

## Source PRD Docs

- [docs/prd/08-skills-catalog-and-distribution.md](../../../../prd/08-skills-catalog-and-distribution.md)
- [docs/prd/09-dogfood-and-maintainer-operations.md](../../../../prd/09-dogfood-and-maintainer-operations.md)

## Stage 1 - Update Package Skill Guidance

### Tasks

- [x] t1: Update `packages/skills/decompose-codebase/SKILL.md` to describe v2 template-owned, dogfood, and project-owned source layers instead of treating root `docs/assets` as the blanket authoring authority.
- [x] t2: Clarify that skill-local `references/` and `assets/templates/` are bundled projections for installed skill execution and fallback usage.
- [x] t3: Clarify through active PRD and W15 notes that generated harness exposure or installed skill copies are fallback outputs and should not be edited as independent authority.

### Acceptance criteria

- Package skill guidance matches the active PRD owner notes and root contracts.
- The installed-skill use case remains supported.
- The skill no longer invites agents to treat projections as the primary backlog-shape source in this repo.

### Dependencies

- Phase 2 root contract wording is complete.

## Stage 2 - Align Skill-Local References and Templates

### Tasks

- [x] t4: Review `packages/skills/decompose-codebase/references/` for conflicting source-authority wording.
- [x] t5: Review `packages/skills/decompose-codebase/assets/templates/` for conflicting source-authority wording.
- [x] t6: Update only the package skill-local files that conflict with the new source-priority ladder.

### Acceptance criteria

- Skill-local projections remain self-contained for installed usage.
- Package projections do not contradict root contract authority.
- No unrelated skill workflow rewrite is included.

### Dependencies

- Stage 1 is complete.

## Stage 3 - Resolve Mirror Disposition

### Tasks

- [x] t7: Do not create `.agents/skills/decompose-codebase/`; the mirror target is absent and v2 moves toward generated harness exposure.
- [x] t8: Do not create `.claude/skills/decompose-codebase/`; the mirror target is absent and v2 moves toward generated harness exposure.
- [x] t9: Verify no mirror-only edits remain.

### Acceptance criteria

- No `.agents` or `.claude` mirror directories are introduced by this reconciliation.
- The package skill source remains the only edited skill source.
- The mirror disposition is documented in phase closeout.

### Dependencies

- Stages 1 and 2 are complete.

## Stage 4 - Validator Alignment Review

### Tasks

- [x] t10: Review `packages/skills/decompose-codebase/scripts/validate_output.py` for assumptions affected by the source-authority wording.
- [x] t11: Avoid validator edits because existing checks validate output shape rather than source-authority precedence.
- [x] t12: Do not update validator tests because validator behavior did not change.

### Acceptance criteria

- Existing validator hooks still cover work backlog shape.
- No new validator path is added without a concrete gap.
- Validator and validator tests remain aligned with package skill assets.

### Dependencies

- Stage 3 is complete.
