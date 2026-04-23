# Phase 2: Templates and Output Model

> Derives from [Phase 2 of the plan](../../plans/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/02-templates-and-output-model.md).

## Purpose

Bring the packaged decomposition and work templates onto the shared v2 model and remove the obsolete single-file backlog template from the decompose skill surface.

## Overview

This phase updates the packaged generation scaffolds that the installed skill points at. The retained local filenames can stay where they are useful, but their content needs to reflect the current shared decomposition and work-directory contract.

## Source PRD Docs

None. This backlog is derived from the `w5-r4` plan and design, not from an active PRD namespace.

## Source Plan Phases

- [Phase 2 - Templates and Output Model](../../plans/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/02-templates-and-output-model.md)

## Stage 1: Rebase the local decomposition plan template

### Tasks

- [ ] Rewrite `packages/skills/decompose-codebase/assets/templates/decomposition-plan.md` to the v2 plan-directory model.
- [ ] Ensure the local decomposition-plan template describes `00-overview.md` plus `0N-<phase>.md` outputs.
- [ ] Align coordinator policy, worker ownership, MCP strategy, and validation sections with the current shared decomposition-plan contract.
- [ ] Remove any wording that implies the default decomposition plan output is a single Markdown file.

### Acceptance criteria

- [ ] The local decomposition-plan template now describes a v2 plan directory.
- [ ] The local decomposition-plan template matches the current shared decomposition-plan semantics.

### Dependencies

- Phase 1 contract language.

## Stage 2: Rebase local backlog templates to the work-directory model

### Tasks

- [ ] Rewrite `packages/skills/decompose-codebase/assets/templates/rebuild-backlog-index.md` around the current `work-index.md` shape.
- [ ] Rewrite `packages/skills/decompose-codebase/assets/templates/rebuild-backlog-phase.md` around the current `work-phase.md` shape.
- [ ] Ensure the local backlog templates describe `00-index.md` plus dependency-ordered phase files.
- [ ] Ensure each phase template includes source-PRD traceability language consistent with the shared work-phase contract.

### Acceptance criteria

- [ ] The local backlog index template aligns with the shared work-index model.
- [ ] The local backlog phase template aligns with the shared work-phase model.
- [ ] The retained local backlog templates no longer imply a one-file backlog default.

### Dependencies

- Stage 1.

## Stage 3: Retire obsolete backlog and PRD template drift

### Tasks

- [ ] Delete `packages/skills/decompose-codebase/assets/templates/rebuild-backlog.md`.
- [ ] Remove any active references to the retired one-file backlog template from the packaged skill docs.
- [ ] Compare the local `prd-*.md` templates against `docs/assets/templates/prd-*.md`.
- [ ] Reseed any drifted local `prd-*.md` template from the repo-authoritative shared template.

### Acceptance criteria

- [ ] `assets/templates/rebuild-backlog.md` is removed from the packaged skill source.
- [ ] No active packaged template or doc still references the retired one-file backlog template.
- [ ] Shared PRD template drift is either eliminated or confirmed absent.

### Dependencies

- Stages 1 and 2.
