# Phase 3: Skill Projection and Mirror Alignment

## Purpose

Align `decompose-codebase` package skill guidance and mirrored skill copies with the root source-authority contract.

## Overview

This phase updates package skill text first, then syncs mirrors mechanically. It preserves bundled skill assets for installed-skill contexts while making clear they are projections, not independent root repo authority.

## Source PRD Docs

- `docs/prd/14-revise-work-backlog-source-authority.md`
- [docs/prd/09-dogfood-and-maintainer-operations.md](../../prd/09-dogfood-and-maintainer-operations.md)

## Stage 1 - Update Package Skill Guidance

### Tasks

- [ ] t1: Update `packages/skills/decompose-codebase/SKILL.md` to describe root `docs/assets` contracts as primary inside this repo.
- [ ] t2: Clarify that skill-local `references/` and `assets/templates/` are bundled projections for installed skill execution.
- [ ] t3: Clarify that mirrors under `.agents` and `.claude` are parity outputs and should not be edited independently.

### Acceptance criteria

- Package skill guidance matches the PRD change doc and root contracts.
- The installed-skill use case remains supported.
- The skill no longer invites agents to treat projections as the primary backlog-shape source in this repo.

### Dependencies

- Phase 2 root contract wording is complete.

## Stage 2 - Align Skill-Local References and Templates

### Tasks

- [ ] t4: Review `packages/skills/decompose-codebase/references/` for conflicting source-authority wording.
- [ ] t5: Review `packages/skills/decompose-codebase/assets/templates/` for conflicting source-authority wording.
- [ ] t6: Update only the package skill-local files that conflict with the new source-priority ladder.

### Acceptance criteria

- Skill-local projections remain self-contained for installed usage.
- Package projections do not contradict root contract authority.
- No unrelated skill workflow rewrite is included.

### Dependencies

- Stage 1 is complete.

## Stage 3 - Sync Mirrors

### Tasks

- [ ] t7: Sync `packages/skills/decompose-codebase/` into `.agents/skills/decompose-codebase/`.
- [ ] t8: Sync `packages/skills/decompose-codebase/` into `.claude/skills/decompose-codebase/`.
- [ ] t9: Verify no mirror-only edits remain.

### Acceptance criteria

- `.agents` and `.claude` mirrors match the package skill source.
- Mirror parity is restored before validation.
- Any sync command or manual copy approach is documented in phase closeout.

### Dependencies

- Stages 1 and 2 are complete.

## Stage 4 - Validator Alignment Review

### Tasks

- [ ] t10: Review `packages/skills/decompose-codebase/scripts/validate_output.py` for assumptions affected by the source-authority wording.
- [ ] t11: Avoid validator edits unless existing checks conflict with the updated contract.
- [ ] t12: Update validator tests only if validator behavior changes.

### Acceptance criteria

- Existing validator hooks still cover work backlog shape.
- No new validator path is added without a concrete gap.
- Validator and validator tests remain aligned with package and mirror skill assets.

### Dependencies

- Stage 3 is complete.
