# Phase 2: Skills-Only Planner and Apply

> Derives from [Phase 2 of the plan](../../plans/2026-04-21-w11-r0-cli-skills-command/02-skills-only-planner-and-apply.md).

## Purpose

Implement the engine behind `make-docs skills` so sync and removal touch only skill files plus the manifest tracking state needed to manage those files safely.

## Overview

This phase should reuse the existing remote skill registry, resolver, manifest, hashing, and install action primitives where practical. It must not invoke the full docs asset catalog for skills-only runs.

## Source PRD Docs

- None. This backlog is derived from a design and implementation plan; no active PRD namespace exists for this repo change.

## Source Plan Phases

- [02-skills-only-planner-and-apply.md](../../plans/2026-04-21-w11-r0-cli-skills-command/02-skills-only-planner-and-apply.md)

## Stage 1 - Define skills command execution state

### Tasks

1. Add a skills command execution type that distinguishes sync mode from removal mode.
2. For sync mode, seed selections from the manifest when present.
3. For sync mode with no manifest, seed from skills-only defaults: Claude Code enabled, Codex enabled, project scope, required skills only.
4. Apply `--no-codex`, `--no-claude-code`, `--skill-scope`, and `--optional-skills` over the seed selections.
5. Force `skills = true` for sync mode.
6. For removal mode, use manifest `skillFiles` as the ownership source and avoid requiring active skill selections.

### Acceptance criteria

- [ ] Sync mode seeds from manifest selections when a manifest exists.
- [ ] Sync mode seeds from skills-only defaults when no manifest exists.
- [ ] Command flags override seeded skills selections.
- [ ] Sync mode always enables skills.
- [ ] Removal mode can operate from `skillFiles` even if saved selections currently disable skills.

### Dependencies

- Phase 1 command dispatch.

## Stage 2 - Build a skills-only desired asset graph

### Tasks

1. Reuse `getDesiredSkillAssets` or extract a variant that accepts the skills-only selections.
2. Ensure desired assets include required skills automatically.
3. Ensure desired assets include only selected optional skills.
4. Ensure desired paths are limited to selected harnesses.
5. Ensure desired paths are limited to the selected project/global scope.
6. Avoid calling `getDesiredAssets` from the docs catalog during skills-only runs.

### Acceptance criteria

- [ ] Desired sync assets contain required skill files.
- [ ] Desired sync assets contain selected optional skill files.
- [ ] Disabled harnesses do not produce desired skill paths.
- [ ] Project and global scope paths are computed correctly.
- [ ] No docs templates, prompts, references, root instructions, or generated docs assets enter the desired graph.

### Dependencies

- Stage 1.

## Stage 3 - Plan skills-only sync

### Tasks

1. Compare desired skill assets to current file contents and manifest entries.
2. Plan creates for missing desired skill files.
3. Plan updates for managed skill files whose current hash matches manifest ownership.
4. Preserve or conflict-stage modified managed skill files instead of overwriting them silently.
5. Plan removal of stale manifest-managed skill files that are no longer desired.
6. Preserve all non-skill manifest `files` entries.

### Acceptance criteria

- [ ] Missing desired skill files plan as create actions.
- [ ] Current managed skill files plan as update actions when safe.
- [ ] Modified managed skill files are not silently overwritten.
- [ ] Stale managed skill files plan as remove actions.
- [ ] Non-skill manifest `files` entries are carried forward unchanged.

### Dependencies

- Stage 2.

## Stage 4 - Plan skills-only removal

### Tasks

1. Build removal candidates from manifest `skillFiles`.
2. Confirm each candidate is still safe to remove using the same ownership rules used for sync.
3. Preserve modified or ambiguous skill files.
4. Remove only managed skill files.
5. Prune emptied parent skill directories only through the existing safe pruning utility.
6. Leave docs scaffold, prompts, templates, references, root instructions, and unrelated files intact.

### Acceptance criteria

- [ ] `make-docs skills --remove --yes` removes manifest-tracked skill files.
- [ ] Non-skill manifest files remain in place.
- [ ] Untracked files in skill directories remain in place.
- [ ] Modified managed skill files are preserved or conflict-staged.
- [ ] Empty managed skill directories are pruned only when safe.

### Dependencies

- Stages 1 and 3.

## Stage 5 - Apply skills-only plans and update manifests

### Tasks

1. Add an apply path that executes skills-only actions.
2. Update manifest `skillFiles` to reflect created, updated, preserved, and removed skill files.
3. Preserve existing manifest `files` entries.
4. Preserve unrelated selections from existing manifests.
5. For first-time skills-only installs, write minimal manifest/config state with `files: {}` and populated `skillFiles`.
6. Ensure the resulting manifest loads through existing migration/load paths.

### Acceptance criteria

- [ ] First-time skills-only sync creates minimal manifest state.
- [ ] Existing full installs keep their non-skill manifest entries.
- [ ] Skill file tracking reflects the post-apply state.
- [ ] Later full `make-docs`, `reconfigure`, `backup`, and `uninstall` can load the manifest.
- [ ] Dry runs do not write skill files or manifest changes.

### Dependencies

- Stages 3 and 4.

## Stage 6 - Add planner/apply tests

### Tasks

1. Test first-time skills-only sync.
2. Test existing full install preservation.
3. Test harness changes.
4. Test project-to-global and global-to-project scope changes.
5. Test optional skill add/remove behavior.
6. Test removal mode.
7. Test modified managed skill preservation.

### Acceptance criteria

- [ ] Skills-only sync tests prove non-skill files are untouched.
- [ ] Scope and harness stale cleanup is covered.
- [ ] Optional skill cleanup is covered.
- [ ] Removal mode is covered.
- [ ] Manifest compatibility is covered.

### Dependencies

- Stages 1-5.
