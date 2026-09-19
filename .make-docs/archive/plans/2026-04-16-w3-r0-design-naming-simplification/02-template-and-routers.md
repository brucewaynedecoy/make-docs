# Phase 2 — Template and Routers

## Objective

Update the design document template and the design directory router files in `packages/docs/template/` to reflect the simplified naming convention.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/docs/template/docs/.templates/design.md` | Update the filename blockquote from the W/R pattern to the simplified pattern. |
| `packages/docs/template/docs/designs/AGENTS.md` | Update naming convention pattern and example. |
| `packages/docs/template/docs/designs/CLAUDE.md` | Mirror AGENTS.md changes. |

## Detailed Changes

### 1. `design.md` template

The template currently has a blockquote:
```
> Filename: `YYYY-MM-DD-w{W}-r{R}-<slug>.md`. See `docs/.references/wave-model.md` for W/R semantics.
```

Replace with:
```
> Filename: `YYYY-MM-DD-<slug>.md`. See `docs/.references/design-contract.md` for naming and structural rules.
```

The reference changes from `wave-model.md` to `design-contract.md` since designs are no longer governed by the wave model for naming.

### 2. `designs/AGENTS.md` and `CLAUDE.md`

Both files are identical and must remain identical. The current Naming Convention section reads:

```
## Naming Convention

Pattern: `YYYY-MM-DD-w{W}-r{R}-<slug>.md`

- Prefix with the creation date (today's date, never backdated).
- Slug: lowercase, hyphens only, no special characters.
- Example: `2026-04-15-w1-r0-authentication-flow.md`
- See `docs/.references/wave-model.md` for W/R semantics and resolution rules.
```

Replace with:

```
## Naming Convention

Pattern: `YYYY-MM-DD-<slug>.md`

- Prefix with the creation date (today's date, never backdated).
- Slug: lowercase, hyphens only, no special characters.
- Example: `2026-04-16-authentication-flow.md`
```

Key changes:
- Pattern drops `w{W}-r{R}`
- Example drops `w1-r0-`
- Wave-model reference removed (designs are exempt from wave naming)

The Agent Instructions section below the naming convention should also be checked: if it references W/R naming or wave-model.md specifically for designs, update those references. The instruction "Always apply date-slug naming" is already correct. The instruction about archived designs is unrelated and stays.

## Parallelism

All three files are disjoint from Phase 1's files. Phase 2 can run in parallel with Phase 1. The AGENTS.md and CLAUDE.md pair must be edited identically.

## Acceptance Criteria

- [ ] `design.md` blockquote references `design-contract.md` instead of `wave-model.md` and uses the simplified pattern.
- [ ] `designs/AGENTS.md` naming convention uses `YYYY-MM-DD-<slug>.md` with no W/R.
- [ ] `designs/AGENTS.md` example shows a filename without W/R.
- [ ] `designs/AGENTS.md` no longer references `wave-model.md` for design naming.
- [ ] `designs/CLAUDE.md` is byte-identical to `designs/AGENTS.md`.
- [ ] No other template files are modified.
