# Phase 5: Tests and Validation

> Derives from [Phase 5 of the plan](../../plans/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/05-tests-and-validation.md).

## Purpose

Prove that the packaged and mirrored `decompose-codebase` surfaces now implement the corrected v2 contract and that the repo’s validation surfaces catch future regressions.

## Overview

This is the closeout phase. It verifies focused validator behavior, CLI install/test coverage, mirror parity, stale-path removal, router consistency, and final repository hygiene.

## Source PRD Docs

None. This backlog is derived from the `w5-r4` plan and design, not from an active PRD namespace.

## Source Plan Phases

- [Phase 5 - Tests and Validation](../../plans/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/05-tests-and-validation.md)

## Stage 1: Run focused automated tests

### Tasks

- [ ] Run `python packages/skills/decompose-codebase/scripts/test_validate_output.py`.
- [ ] Run `npm run build -w make-docs`.
- [ ] Run `npm test -w make-docs`.
- [ ] Run `bash scripts/check-instruction-routers.sh`.
- [ ] If any failure reveals a stale assumption, fix the owning file or test instead of weakening the validation surface.

### Acceptance criteria

- [ ] Focused validator, build, test, and router checks pass.
- [ ] Any surfaced stale assumption is resolved in the owning file set.

### Dependencies

- Phases 1 through 4.

## Stage 2: Run active-surface stale-path scans

### Tasks

- [ ] Run targeted scans over `packages/skills/decompose-codebase/`, `.agents/skills/decompose-codebase/`, `packages/cli/skill-registry.json`, and relevant `packages/cli/tests/` files.
- [ ] Confirm active surfaces no longer document `docs/prd/archive/...` as the current archive path.
- [ ] Confirm active surfaces no longer document `docs/plans/YYYY-MM-DD-decomposition-plan.md` as the current plan output.
- [ ] Confirm active surfaces no longer document `docs/work/YYYY-MM-DD-rebuild-backlog.md` as the current backlog output.
- [ ] Confirm active surfaces no longer treat `assets/templates/rebuild-backlog.md` as a retained installed asset.

### Acceptance criteria

- [ ] No active packaged or mirrored surface still routes future work to the retired archive or one-file plan/backlog paths.
- [ ] No active install/test surface still treats the retired backlog template as part of the installed skill.

### Dependencies

- Phases 1 through 4.

## Stage 3: Confirm installed-surface correctness

### Tasks

- [ ] Use the updated install and skill-catalog tests to prove optional `decompose-codebase` installs still work.
- [ ] Confirm retained files install into `.claude/skills/decompose-codebase/` and `.agents/skills/decompose-codebase/`.
- [ ] Confirm the retired one-file backlog template does not install.
- [ ] Confirm no legacy `skill-assets` projection behavior reappears.
- [ ] Confirm the mapped-file parity check fails on drift and passes after the mirror refresh.

### Acceptance criteria

- [ ] The installed optional skill surface matches the retained packaged file set.
- [ ] The retired one-file backlog template is absent from the installed optional skill surface.
- [ ] The parity guardrail works as intended.

### Dependencies

- Stages 1 and 2.

## Stage 4: Final hygiene

### Tasks

- [ ] Run `git diff --check`.
- [ ] Review `git status --short` and confirm only intended `w5-r4` files changed.
- [ ] Capture any skipped validations and the reason they were skipped.
- [ ] Leave the final status with only the intended `w5-r4` implementation and backlog changes.

### Acceptance criteria

- [ ] `git diff --check` passes.
- [ ] Final repository status contains only intentional `w5-r4` changes.
- [ ] Any skipped validation is documented explicitly.

### Dependencies

- Stages 1 through 3.
