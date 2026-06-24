# Work Backlog Source Authority

> Filename: `2026-05-06-work-backlog-source-authority.md`. See `docs/assets/references/design-contract.md` for naming and structural rules.

## Purpose

Clarify how agents should choose source material when generating `docs/work/` backlogs.

Work backlog generation should treat repo-local documentation contracts and templates as the source of truth. Skills such as `decompose-codebase` can still participate when their trigger rules apply, but they should not be presented or used as the primary authority for backlog shape when the active repo already exposes `docs/work/AGENTS.md`, `docs/assets/references/`, and `docs/assets/templates/`.

## Context

During W14 R2 backlog generation, the active task matched the available `decompose-codebase` skill description because that skill covers producing `docs/work/...` backlogs. The session skill rules therefore made it reasonable to load the skill.

The confusing part was the rationale. The working note said the repo's `decompose-codebase` skill was being used "for the backlog shape." That wording over-promoted a secondary surface.

The repo contracts inspected during the backlog run already define the backlog structure:

- `docs/work/AGENTS.md` says work is always a directory, names `work-index.md` and `work-phase.md`, and requires markdown checkbox tasks plus plain-bullet acceptance criteria.
- `docs/assets/references/execution-workflow.md` defines active-set evolution backlog rules, phase ordering, `Source PRD Docs`, phase-local task IDs, and delta backlog traceability.
- `docs/assets/references/output-contract.md` defines required plan and work directory paths.
- `docs/assets/templates/work-index.md` and `docs/assets/templates/work-phase.md` define the repo-local templates for work backlog index and phase files.

The `decompose-codebase` skill also states that, in this repository, `docs/assets/references/` and `docs/assets/templates/` define the authoritative lifecycle contract. Its bundled skill assets are projections for installed skill execution, not the root authoring authority.

The generation behavior should therefore make the authority order explicit so future agents do not chase mirrored skills for shape when the canonical docs are available.

## Decision

Adopt a source-priority ladder for work backlog generation.

### 1. Use Repo Contracts as the Primary Authority

When generating a `docs/work/` backlog inside this repository, agents should first read:

1. `docs/work/AGENTS.md`
2. `docs/assets/references/execution-workflow.md`
3. `docs/assets/references/output-contract.md`
4. `docs/assets/references/wave-model.md`
5. `docs/assets/templates/work-index.md`
6. `docs/assets/templates/work-phase.md`

These files define the expected path, directory shape, phase file shape, task syntax, acceptance criteria syntax, W/R naming, and traceability requirements.

If these files are indexed, use `jdocmunch` first. If the index misses or is stale, reindex before falling back to direct file reads.

### 2. Use the Approved Plan as the Content Driver

The approved `docs/plans/YYYY-MM-DD-w{W}-r{R}-<slug>/` directory should drive the backlog's phase structure, dependencies, worker boundaries, and acceptance criteria.

Existing archived backlogs can be used as examples of local style, but they should not override the current active contracts. If an older example conflicts with `docs/work/AGENTS.md`, `execution-workflow.md`, `output-contract.md`, or the templates, the current active contract wins.

### 3. Treat Skills as Secondary Alignment Surfaces

Skills should be loaded when the task matches their trigger rules, but their role should be described precisely:

- use the skill to follow required workflow or orchestration behavior;
- use bundled skill references/templates only when operating from the installed skill context or when repo-local docs/assets are unavailable;
- use skill scripts, such as validators, when they are the repo-approved validation path;
- do not cite the skill as the backlog-shape authority when repo-local contracts are available.

For this repository, if skill behavior itself must change, edit `packages/skills/decompose-codebase/` first and then sync mirrors to `.agents/skills/decompose-codebase/` and `.claude/skills/decompose-codebase/`. Mirrored skill copies should not be treated as independent source material.

### 4. Make Fallback Behavior Explicit

When repo-local docs/assets are unavailable, stale, or incomplete, the fallback order should be:

1. reindex `jdocmunch` and retry the active repo docs;
2. read the active repo files directly;
3. use archived same-coordinate or same-family backlogs as examples;
4. use the package skill projection under `packages/skills/decompose-codebase/`;
5. use mirrored skill copies only when package sources are missing or the task specifically concerns an installed mirror.

If the agent uses a fallback source, the final answer should say which fallback was used and why.

### 5. Update Agent-Facing Guidance

The implementation should make this source-priority ladder visible where agents are likely to look before generating a backlog:

- `docs/work/AGENTS.md`
- `docs/assets/references/execution-workflow.md`
- `docs/assets/references/output-contract.md`, if the required-path section needs a source-authority note
- `packages/skills/decompose-codebase/SKILL.md`
- skill-local references/templates if they currently imply that bundled projections are the root authority

Any mirrored skill updates should be mechanical parity updates from `packages/skills/decompose-codebase/`.

## Alternatives Considered

### Always Use `decompose-codebase` for Backlog Shape

This follows broad skill trigger rules, but it blurs source authority. The skill is useful for orchestration and validation, yet the root repo contracts already define the current shape. Making the skill primary would increase the chance of stale projection drift.

### Never Load `decompose-codebase` for Plan-Derived Backlogs

This would avoid the confusing source-authority signal, but it would conflict with skill trigger rules when the task explicitly matches backlog generation. It would also skip useful workflow and validator guidance.

### Use Archived Backlogs as the Primary Model

Archived backlogs are helpful style examples, especially for nearby W/R lineage, but they can lag behind current contracts. They should be examples, not authority.

### Leave Behavior Unspecified

Leaving the behavior implicit preserves flexibility, but it makes agent behavior less consistent. The observed confusion came from an implicit ordering decision, so the fix should make that ordering explicit.

## Consequences

Agents generating work backlogs will have a deterministic lookup order and a clearer explanation for why each source is used.

The repo-local docs/assets contracts remain the canonical source of truth. The `decompose-codebase` skill remains relevant, but primarily as a workflow, orchestration, installed-skill, and validation surface.

This will likely require small documentation and skill-text changes rather than major code changes. If validators or renderers reference the older `rebuild-backlog-*` projections, the implementation should preserve compatibility while clarifying the relationship between root templates and skill-local projections.

The change should reduce unnecessary reads from `.agents/` or `.claude/` mirrors. Mirrored skill trees remain generated parity surfaces, not independent references.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [2026-05-06-cli-conflict-resolution.md](../../../designs/2026-05-06-cli-conflict-resolution.md)
- Reason: this design captures a process improvement discovered while generating the W14 R2 CLI conflict-resolution work backlog.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../prompts/designs-to-plan-change.prompt.md)
- Why: this is a targeted documentation and skill-guidance revision to the existing plan-to-work backlog workflow, not a new baseline planning track.
- Coordinate Handoff: unresolved; planner must resolve before writing.
