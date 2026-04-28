# Phase 4 — Wizard and CLI Flags

## Objective

Add skills support to the interactive wizard, CLI argument parsing, help text, and review summary so users can opt in/out of skill installation.

## Depends On

- Phase 2 (`skills` boolean must exist in `InstallSelections`)
- Can run in parallel with Phase 3

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/wizard.ts` | Add skills prompt to the options step; update review summary to show skills status. |
| `packages/cli/src/cli.ts` | Add `--no-skills` flag to `ParsedArgs` and `parseArgs`; add to `resolveSelections`; add to `hasSelectionOverrides`; update `printHelp`. |

## Detailed Changes

### 1. `wizard.ts` — Options step

In the `promptForOptions` function, add a skills prompt after the existing instruction-kinds prompt:

```ts
const skillsResult = await confirm({
  message: "Install agent skills?",
  withGuide: true,
  initialValue: options.skills,
  active: "Yes",
  inactive: "No",
});
```

The `WizardOptionSelections` interface needs a `skills: boolean` field. Update `getWizardOptionSelections` and `applyWizardOptionSelections` to include it.

### 2. `wizard.ts` — Review summary

In `renderWizardReviewSummary`, add a skills line to the summary output, e.g., `Skills: Yes` or `Skills: No`.

### 3. `wizard.ts` — OPTION_METADATA

Add a `skills` entry to the `OPTION_METADATA` constant with label, description, and hint text.

### 4. `cli.ts` — ParsedArgs and parseArgs

Add `noSkills: boolean` to `ParsedArgs`. Add a `case "--no-skills":` to the `parseArgs` switch statement.

### 5. `cli.ts` — resolveSelections

In `resolveSelections`, apply `parsed.noSkills` to `selections.skills = false` when the flag is present.

### 6. `cli.ts` — hasSelectionOverrides

Add `parsed.noSkills` to the boolean-or expression.

### 7. `cli.ts` — printHelp

Update the help text to include `--no-skills` in the init usage line.

## Parallelism

- All changes are within `wizard.ts` and `cli.ts` — no overlap with Phase 3 files.
- Can run in parallel with Phase 3.

## Acceptance Criteria

- [ ] `--no-skills` flag is recognized by the CLI.
- [ ] The wizard includes a "Install agent skills?" prompt in the options step.
- [ ] The review summary shows skills status.
- [ ] `printHelp` includes `--no-skills`.
- [ ] `npm run build -w make-docs` succeeds.
- [ ] `npm test -w make-docs` passes.
