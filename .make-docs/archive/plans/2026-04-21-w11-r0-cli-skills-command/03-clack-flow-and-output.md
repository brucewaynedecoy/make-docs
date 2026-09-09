# Phase 3 - Clack Flow and Output

## Objective

Add an interactive skills-only Clack flow and skill-focused plan/completion summaries that avoid the broader install wizard's document type, prompt, template, and reference screens.

## Depends On

- [2026-04-21-cli-skills-command.md](../../designs/2026-04-21-cli-skills-command.md)
- Phase 1 command dispatch.
- Phase 2 skills-only plan data and apply behavior.
- Existing Clack wizard patterns in `packages/cli/src/wizard.ts` and lifecycle output patterns in `packages/cli/src/lifecycle-ui.ts`.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/wizard.ts` or new `packages/cli/src/skills-ui.ts` | Add skills-only prompts for action, platform, scope, optional skill selection, and review. |
| `packages/cli/src/cli.ts` | Invoke the skills-only interactive flow when `make-docs skills` runs without `--yes`. |
| `packages/cli/src/skill-catalog.ts` | Reuse grouped required/optional skill choices for the skills-only UI. |
| `packages/cli/tests/wizard.test.ts` and/or `packages/cli/tests/cli.test.ts` | Cover skills-only prompt state, review summaries, and cancellation behavior. |

## Detailed Changes

### 1. Add a skills-only prompt state

Create a focused state shape that includes only:

- action: sync or remove
- selected harnesses
- skill scope
- selected optional skills
- target directory

Required skills should appear as automatic in the skills screen. Optional skills should use the existing grouped skill choice data.

### 2. Add the interactive flow

Interactive `make-docs skills` should run:

1. action prompt: sync/update or remove managed skills
2. platform multiselect: Claude Code, Codex, or both
3. scope select for sync mode
4. optional skill multiselect for sync mode
5. review screen with apply/edit/cancel actions

Removal mode may skip scope and optional skill prompts if removal is defined as all manifest-tracked skills for the target. If the implementation supports narrowed removal by platform/scope, the review must clearly show the narrowed removal set.

### 3. Keep screens concise

The flow must not show:

- document type/capability choices
- prompt starter choices
- template choices
- reference choices
- full install/reconfigure wording

Review copy should summarize only the current action, platforms, scope when relevant, selected optional skills when relevant, and planned skill file operation counts.

### 4. Add skill-focused summaries

Plan output should include:

- target directory
- action: sync or remove
- skill scope when relevant
- selected platforms when relevant
- optional skill selection when relevant
- managed skill files evaluated
- already current, create, update, remove, and conflict counts

Completion output should use skills-specific language:

- "Synced skills ..."
- "Installed skills ..."
- "Updated skills ..."
- "Removed managed skills ..."

It should not say "Installed make-docs" or "Reconfigured make-docs" for skills-only runs.

## Acceptance Criteria

- [ ] Interactive `make-docs skills` shows only skills-related screens.
- [ ] Cancellation exits without planning/applying changes.
- [ ] Review lets users apply, edit prior skills screens, or cancel.
- [ ] Required skills are shown as automatic and optional skills are selectable.
- [ ] Plan output reports only skill file operations.
- [ ] Completion output uses skills-specific language.
- [ ] Existing full install/reconfigure wizard behavior is unchanged.
