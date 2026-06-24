# Phase 2 - Contract and Template Guidance

## Objective

Update repo-local work backlog contracts so future agents can identify the authoritative sources before reading skills or archived examples.

## Depends On

- [01-prd-change-and-baseline-annotations.md](./01-prd-change-and-baseline-annotations.md)
- `docs/work/AGENTS.md`
- `docs/assets/references/execution-workflow.md`
- `docs/assets/references/output-contract.md`
- `docs/assets/templates/work-index.md`
- `docs/assets/templates/work-phase.md`

## Files To Modify

- `docs/work/AGENTS.md`
- `docs/assets/references/execution-workflow.md`
- `docs/assets/references/output-contract.md`, if a required-path or source-authority note is warranted
- `docs/assets/templates/work-index.md`, if the index template needs source-authority language
- `docs/assets/templates/work-phase.md`, if the phase template needs source-authority language

## Detailed Changes

1. Add a concise source-authority note to `docs/work/AGENTS.md`.
2. Update `docs/assets/references/execution-workflow.md` backlog rules to name the primary source ladder for plan-derived work backlogs.
3. Add or adjust `docs/assets/references/output-contract.md` language only if required-path guidance lacks enough source-authority context.
4. Keep template edits minimal; update `work-index.md` or `work-phase.md` only if template comments currently imply incomplete guidance.
5. Preserve the current task syntax contract: `- [ ] t1: ...` tasks and plain-bullet acceptance criteria.

## Parallelism

This phase can run after Phase 1. It should complete before package skill projection updates so skill text can mirror the updated root authority.

## Acceptance Criteria

- Agents can identify root contract files as the primary work backlog shape authority from `docs/work/AGENTS.md`.
- `execution-workflow.md` distinguishes contracts, approved plans, archived examples, package skills, and mirrors.
- Existing W/R path, task ID, `Source PRD Docs`, and acceptance criteria rules remain intact.
- Template edits, if any, are minimal and do not change rendered backlog requirements unexpectedly.
