# Phase 3 - CLI Skill Selection UX

## Objective

Update the full install wizard, dedicated skills UI, review summaries, CLI help, and headless flag behavior so users see one selected-by-default recommended skill list rather than default/required and optional categories.

## Depends On

- Phase 1 requirement record
- Phase 2 selected-skill state shape
- Current code in `packages/cli/src/wizard.ts`, `packages/cli/src/skills-ui.ts`, `packages/cli/src/cli.ts`, and `packages/cli/src/skills-command.ts`

## Files To Modify

Expected write scope:

- `packages/cli/src/wizard.ts`
- `packages/cli/src/skills-ui.ts`
- `packages/cli/src/cli.ts`
- `packages/cli/src/skills-command.ts`
- `packages/cli/src/README.md` or packaged README surfaces only if they document the old optional-skill flag or categories

## Detailed Changes

### 1. Full install wizard skill screen

The `Select skills to install` screen should render one list of skill rows:

- no `Default` heading
- no `Optional` heading
- no disabled default-skill rows
- all skills initially selected for fresh installs
- every row toggleable

Keep the highlighted skill description panel.

Remove category text from the detail panel. In particular, stop rendering:

```text
Group: Default
Group: Optional
```

If the panel keeps status text, use selection-state language:

- `Selected`
- `Available`

Keep the bottom selected-skill summary and keyboard instructions, but remove:

```text
Default skills are installed automatically and cannot be changed here.
```

### 2. Dedicated skills command UI

Update the skills-only UI to match the same model:

- no `Required skills` note
- no `Which optional skills should be installed?` prompt
- one selected-skill prompt with all registry skills selected by default
- review summary uses `Selected skills`
- edit action uses `Edit skills` or `Edit selected skills`

Removal mode should remain separate and should not ask for skill selection when removing managed skills.

### 3. CLI flags and help

Replace public `optional` terminology in headless skill selection.

The plan should settle one replacement flag during execution:

- preferred likely option: `--skills <csv|all|none>` if this can coexist cleanly with existing `--no-skills`
- alternate: `--selected-skills <csv|all|none>` if `--skills` would be ambiguous with the boolean skills toggle

Keep `--optional-skills` only as a deprecated compatibility alias if implementation can do so without confusing validation. If retained, it should map to the new selected-skill model and be covered by tests. If removed, help/error text must give clear migration guidance.

Validation should reject unknown skill names against the full recommended registry set, not only a former optional subset.

### 4. Review and summary language

Replace labels such as:

- `Optional skills`
- `Edit optional skills`
- `Adjust optional skills`
- `Required skills`

with selected-skill language:

- `Selected skills`
- `Edit skills`
- `Adjust selected skills`

The review should summarize choices the user can control. It should not restate hidden required behavior because there should be no hidden required skill category.

## Parallelism

This phase can run after the selected-skill state shape is settled. The full install wizard and skills-only UI may be split across two workers only if tests and shared helper types are coordinated carefully.

## Acceptance Criteria

- Full install wizard skill selection has no category headings and all rows are toggleable.
- Dedicated skills UI has no required/optional note or prompt.
- Highlighted skill descriptions still render.
- Bottom selected-skill summary and keyboard instructions still render.
- The old default-skill immutability note is absent.
- Review summaries and edit actions use selected-skill language.
- CLI help and validation no longer teach optional skills as the primary concept.
- Deprecated flag compatibility, if kept, is deliberate and tested.
