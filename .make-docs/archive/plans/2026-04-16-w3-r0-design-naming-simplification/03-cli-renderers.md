# Phase 3 — CLI Renderers

## Objective

Update the three design-related renderer functions in `packages/cli/src/renderers.ts` to emit the simplified `YYYY-MM-DD-<slug>.md` path pattern instead of `YYYY-MM-DD-w{W}-r{R}-<slug>.md`.

## Depends On

- Phase 1 (template references updated — renderers must match).
- Phase 2 (template and routers updated — renderers must match).

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/renderers.ts` | Update `renderDesignWorkflow`, `renderDesignContract`, and `renderDesignTemplate` to emit simplified path patterns. |

## Detailed Changes

### 1. `renderDesignWorkflow`

This function has two code paths: full (designs + plans) and reduced (designs only). Both emit the design path pattern.

#### Full variant (designs + plans installed)
- Change `YYYY-MM-DD-w{W}-r{R}-<slug>.md` to `YYYY-MM-DD-<slug>.md` in the output form description.
- Remove or replace the `See \`docs/.references/wave-model.md\` for W/R semantics.` line — replace with `See \`docs/.references/design-contract.md\` for naming and structural rules.`
- Change the validation checklist entry from `follows \`YYYY-MM-DD-w{W}-r{R}-<slug>.md\` naming` to `follows \`YYYY-MM-DD-<slug>.md\` naming`.

#### Reduced variant (designs only, no plans)
- Same path pattern change: `YYYY-MM-DD-w{W}-r{R}-<slug>.md` → `YYYY-MM-DD-<slug>.md`.
- Same wave-model reference removal/replacement.
- Same validation checklist update.

### 2. `renderDesignContract`

- In the Required Path section, change `YYYY-MM-DD-w{W}-r{R}-<slug>.md` to `YYYY-MM-DD-<slug>.md`.
- Replace `See \`docs/.references/wave-model.md\` for W/R semantics and resolution rules.` with `\`YYYY-MM-DD\` is today's date (never backdated). \`<slug>\` is lowercase, hyphens only.`

### 3. `renderDesignTemplate`

- In the filename blockquote, change `YYYY-MM-DD-w{W}-r{R}-<slug>.md` to `YYYY-MM-DD-<slug>.md`.
- Change the reference from `wave-model.md` to `design-contract.md`: the blockquote should read `> Filename: \`YYYY-MM-DD-<slug>.md\`. See \`docs/.references/design-contract.md\` for naming and structural rules.`

## Parallelism

All changes are within one file (`renderers.ts`). They should be made in a single editing session. Edits to the three functions are independent of each other.

## Acceptance Criteria

- [ ] No occurrences of `w{W}-r{R}` remain in design-related renderer output.
- [ ] `renderDesignWorkflow` emits `YYYY-MM-DD-<slug>.md` for both full and reduced variants.
- [ ] `renderDesignContract` emits the simplified Required Path.
- [ ] `renderDesignTemplate` emits the simplified filename blockquote.
- [ ] `npm run build -w make-docs` succeeds.
- [ ] `npm test -w make-docs` passes with no regressions (existing design-workflow content assertions still hold).
