# Phase 1: Authority and Skill Contract

> Derives from [Phase 1 of the plan](../../plans/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/01-authority-and-skill-contract.md).

## Purpose

Rewrite the human-facing `decompose-codebase` contract so the packaged skill describes the current v2 archive, plan, and backlog model while still presenting itself as a self-contained installed skill.

## Overview

This phase updates the skill’s behavioral contract, not its feature set. The goal is to remove stale lifecycle guidance from the shipped decompose skill without making the installed skill depend on repo-root docs or scripts at runtime.

## Source PRD Docs

None. This backlog is derived from the `w5-r4` plan and design, not from an active PRD namespace.

## Source Plan Phases

- [Phase 1 - Authority and Skill Contract](../../plans/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/01-authority-and-skill-contract.md)

## Stage 1: Rewrite active path and lifecycle guidance

### Tasks

- [ ] Update `packages/skills/decompose-codebase/SKILL.md` to route archived PRD sets through `docs/assets/archive/prds/...`.
- [ ] Update `packages/skills/decompose-codebase/SKILL.md` to describe decomposition plans as plan directories with `00-overview.md` plus phase files.
- [ ] Update `packages/skills/decompose-codebase/SKILL.md` to describe rebuild work as a work directory with `00-index.md` plus phase files.
- [ ] Update `packages/skills/decompose-codebase/references/planning-workflow.md`, `references/execution-workflow.md`, and `references/output-contract.md` to the same v2 archive and directory-based output model.
- [ ] Remove active wording that still treats `docs/prd/archive/...`, `docs/plans/YYYY-MM-DD-decomposition-plan.md`, or `docs/work/YYYY-MM-DD-rebuild-backlog.md` as current behavior.

### Acceptance criteria

- [ ] No active decompose skill contract file routes future work to `docs/prd/archive/...`.
- [ ] No active decompose skill contract file still documents one-file plan output as the current model.
- [ ] No active decompose skill contract file still documents one-file rebuild backlog output as the current model.

### Dependencies

- None. This phase establishes the contract later phases must implement.

## Stage 2: Clarify authority versus installed-runtime behavior

### Tasks

- [ ] Update `packages/skills/decompose-codebase/SKILL.md` and `assets/README.md` to explain that repo-authoritative lifecycle rules live in `docs/assets/...` during source authoring in this repo.
- [ ] Make the same docs explicit that installed skills still rely on their bundled local copies of references, templates, and scripts.
- [ ] Clarify that `scripts/probe_environment.py` and `scripts/validate_output.py` are skill-local assets, not repo-root utilities.
- [ ] Remove any wording that implies an installed skill expects this repository’s root `docs/assets/` tree at runtime.

### Acceptance criteria

- [ ] The active skill docs clearly distinguish source-authority from installed runtime behavior.
- [ ] Helper scripts are explicitly described as bundled skill-local assets.
- [ ] The installed skill contract remains self-contained.

### Dependencies

- Stage 1 path decisions.

## Stage 3: Preserve only useful local projection differences

### Tasks

- [ ] Keep the retained local template filenames stable where they still serve the packaged skill surface.
- [ ] Remove or rewrite any contract wording that treats filename differences as lifecycle differences.
- [ ] Review `references/mcp-playbook.md` and `references/harness-capability-matrix.md` only for stale path or script-resolution guidance and leave unrelated guidance untouched.

### Acceptance criteria

- [ ] Stable local filenames remain only where they do not imply stale lifecycle behavior.
- [ ] No unrelated `mcp-playbook` or harness guidance is churned without a concrete stale-contract reason.

### Dependencies

- Stages 1 and 2.
