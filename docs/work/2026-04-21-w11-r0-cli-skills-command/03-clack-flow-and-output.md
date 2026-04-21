# Phase 3: Clack Flow and Output

> Derives from [Phase 3 of the plan](../../plans/2026-04-21-w11-r0-cli-skills-command/03-clack-flow-and-output.md).

## Purpose

Add a skills-only interactive experience and output layer that matches the CLI's Clack style without exposing unrelated docs install choices.

## Overview

This phase owns human-facing screens and summaries. It should use the skills-only command state and planner results from Phases 1 and 2, while leaving the full install/reconfigure wizard behavior unchanged.

## Source PRD Docs

- None. This backlog is derived from a design and implementation plan; no active PRD namespace exists for this repo change.

## Source Plan Phases

- [03-clack-flow-and-output.md](../../plans/2026-04-21-w11-r0-cli-skills-command/03-clack-flow-and-output.md)

## Stage 1 - Define skills-only UI state and renderer seams

### Tasks

1. Add a focused skills UI state containing action, harnesses, skill scope, optional skills, and target directory.
2. Reuse grouped required/optional skill choices from the skill catalog.
3. Define renderer seams so tests can exercise the flow without a live TTY.
4. Keep the skills UI separate from general capability/prompt/template/reference wizard state.

### Acceptance criteria

- [ ] Skills UI state contains only skills-command fields.
- [ ] Required and optional skill choices reuse registry-backed catalog data.
- [ ] Renderer-level tests can drive the flow.
- [ ] Existing install/reconfigure wizard types are not overloaded with unrelated skills-command action state.

### Dependencies

- Phase 1 command state.

## Stage 2 - Add the interactive sync flow

### Tasks

1. Prompt for sync/update as the action when applicable.
2. Prompt for Claude Code, Codex, or both.
3. Prompt for project/global skill scope.
4. Show required skills as automatic.
5. Allow optional skill selection.
6. Build the resulting skills command state and pass it to the planner.

### Acceptance criteria

- [ ] Interactive sync asks only skills-related questions.
- [ ] The platform prompt requires at least one harness.
- [ ] The scope prompt supports project and global.
- [ ] Required skills cannot be deselected.
- [ ] Optional skills can be selected or omitted.

### Dependencies

- Stage 1.

## Stage 3 - Add the interactive removal flow

### Tasks

1. Prompt for remove managed skills as an action.
2. Skip scope and optional skill prompts if removal is all manifest-tracked skills for the target.
3. If implementation supports narrowed removal, clearly show selected platforms and/or scope before review.
4. Handle no-manifest and no-tracked-skill cases with a no-op summary rather than a confusing empty destructive flow.

### Acceptance criteria

- [ ] Interactive removal does not ask irrelevant optional skill questions.
- [ ] Removal review clearly identifies the removal scope.
- [ ] No-manifest and no-tracked-skill cases are readable no-ops.
- [ ] Cancellation exits before applying changes.

### Dependencies

- Stage 1 and Phase 2 removal planning.

## Stage 4 - Add review and edit actions

### Tasks

1. Render a review summary with action, target, harnesses, scope when relevant, optional skills when relevant, and planned operation counts.
2. Offer apply, edit, and cancel actions.
3. Route edit actions back to the relevant prior prompt.
4. Avoid repeating required skill descriptions across multiple screens.

### Acceptance criteria

- [ ] Review includes only skills-command information.
- [ ] Apply returns final command state.
- [ ] Edit returns users to prior skills screens.
- [ ] Cancel exits without applying.
- [ ] Required skills are not described redundantly on every screen.

### Dependencies

- Stages 2 and 3.

## Stage 5 - Add skill-focused plan and completion output

### Tasks

1. Add a skills plan summary with target directory, action, scope, platforms, optional skills, evaluated count, noop count, create count, update count, remove count, and conflict count.
2. Add a planned operations list that only includes skill files.
3. Add completion messages for synced, installed, updated, and removed skills.
4. Ensure skills-only output does not use full install/reconfigure wording.
5. Keep existing conflict reporting readable for skipped modified skill files.

### Acceptance criteria

- [ ] Skills plan output does not mention document types, templates, prompts, or references.
- [ ] Planned operations list contains only skill file paths.
- [ ] Completion output uses skills-specific language.
- [ ] Conflict output remains actionable.
- [ ] Existing full install/reconfigure output is unchanged.

### Dependencies

- Phase 2 planner/apply results.

## Stage 6 - Add UI and output tests

### Tasks

1. Test sync flow state transitions.
2. Test removal flow state transitions.
3. Test review apply/edit/cancel behavior.
4. Test summary formatting for sync and removal.
5. Test cancellation before apply.

### Acceptance criteria

- [ ] Renderer-level tests cover sync.
- [ ] Renderer-level tests cover removal.
- [ ] Review edit/cancel behavior is covered.
- [ ] Plan/completion summary output is covered.
- [ ] Existing wizard tests still pass.

### Dependencies

- Stages 1-5.
