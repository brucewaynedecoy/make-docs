# Phase 3: CLI Skill Selection UX

> Derives from [Phase 3 of the plan](../../plans/2026-04-28-w14-r1-cli-skill-selection-simplification/03-cli-skill-selection-ux.md).

## Purpose

Update the full install wizard, dedicated skills UI, CLI help, and review text so users see one recommended skill set rather than default/required and optional skill categories.

## Overview

This phase is user-facing. It keeps the existing skill detail panel, selected-skill summary, and keyboard guidance, but removes the category headings and default-skill immutability messaging. It also replaces public optional-skill vocabulary with selected-skill vocabulary across the full install and skills-only command surfaces.

## Source PRD Docs

- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- [08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md)
- Planned change doc: `docs/prd/12-revise-cli-skill-selection-simplification.md`

## Source Plan Phases

- [03-cli-skill-selection-ux.md](../../plans/2026-04-28-w14-r1-cli-skill-selection-simplification/03-cli-skill-selection-ux.md)

## Stage 1 - Update Full Install Wizard Skill Picker

### Tasks

1. Update `packages/cli/src/wizard.ts` so the `Select skills to install` screen renders one list of skill rows.
2. Remove heading rows labeled `Default` and `Optional`.
3. Remove disabled default-skill row behavior.
4. Ensure every skill row is toggleable.
5. Ensure fresh installs start with all registry skills selected.
6. Preserve the highlighted skill detail panel with skill name and description.
7. Remove detail-panel category text such as `Group: Default` and `Group: Optional`.
8. Keep selected-skill summary and keyboard instructions.
9. Remove the footer note `Default skills are installed automatically and cannot be changed here.`

### Acceptance criteria

- [ ] The full install wizard skill picker has no `Default` heading.
- [ ] The full install wizard skill picker has no `Optional` heading.
- [ ] Every skill row is toggleable.
- [ ] All skills are selected on fresh installs.
- [ ] Highlighted skill descriptions still render.
- [ ] Selected summary and keyboard instructions still render.
- [ ] The old default-skill immutability note is absent.

### Dependencies

- Phase 2 selected-skill state shape.

## Stage 2 - Update Dedicated Skills Command UI

### Tasks

1. Update `packages/cli/src/skills-ui.ts` to remove the `Required skills` note.
2. Replace `Which optional skills should be installed?` with selected-skill prompt language.
3. Use one selected-skill prompt with all registry skills selected by default.
4. Keep removal mode separate so `make-docs skills --remove` does not ask for skill selection.
5. Update review summary labels from `Optional skills` to `Selected skills`.
6. Update edit actions from `Edit optional skills` to `Edit skills` or `Edit selected skills`.
7. Preserve project/global scope and harness selection behavior.

### Acceptance criteria

- [ ] Skills-only UI has no `Required skills` note.
- [ ] Skills-only UI has no optional-skill prompt.
- [ ] Skills-only UI defaults to all registry skills selected.
- [ ] Removal mode still skips skill selection.
- [ ] Review and edit actions use selected-skill language.
- [ ] Harness and scope prompts still behave as before.

### Dependencies

- Phase 2 selected-skill state shape.

## Stage 3 - Update CLI Flags, Validation, and Help

### Tasks

1. Choose the replacement headless selection flag: either `--skills <csv|all|none>` or `--selected-skills <csv|all|none>`.
2. Decide whether `--optional-skills` remains as a deprecated compatibility alias.
3. If the alias remains, map it to the new selected-skill model and cover it with tests.
4. If the alias is removed, provide clear migration guidance in error/help text.
5. Validate unknown skill names against the full registry skill set.
6. Update command-specific help for the main install/reconfigure flow and the `skills` command.
7. Keep `--no-skills` as the control for disabling skill installation entirely.

### Acceptance criteria

- [ ] Public help no longer teaches optional skills as the primary concept.
- [ ] Unknown skill validation checks all registry skills.
- [ ] Deprecated `--optional-skills` behavior is either deliberately supported or deliberately rejected with guidance.
- [ ] `--no-skills` still disables skill installation.
- [ ] Main flow and skills command use consistent selected-skill terminology.

### Dependencies

- Phase 2 selected-skill state shape.

## Stage 4 - Update Review and Summary Language

### Tasks

1. Replace user-facing labels such as `Optional skills`, `Edit optional skills`, `Adjust optional skills`, and `Required skills`.
2. Use labels such as `Selected skills`, `Edit skills`, and `Adjust selected skills`.
3. Ensure review summaries describe choices the user can control, not hidden required behavior.
4. Check README or package README surfaces only if they document old optional-skill categories or flags.

### Acceptance criteria

- [ ] Review summaries use selected-skill language.
- [ ] Edit actions use selected-skill language.
- [ ] No active user-facing prompt describes skills as required/default versus optional.
- [ ] Documentation surfaces touched by this phase match the new command vocabulary.

### Dependencies

- Stages 1-3.
