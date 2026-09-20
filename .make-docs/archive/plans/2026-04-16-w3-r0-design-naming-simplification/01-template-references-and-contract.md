# Phase 1 — Template References and Contract

## Objective

Update the wave model, design contract, and design workflow reference files in `packages/docs/template/` to remove W/R encoding from design naming and exempt designs from wave resolution rules.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/docs/template/docs/.references/wave-model.md` | Remove designs from the Naming Patterns table; remove designs from the Resolution Rules section; add a "Design Exemption" section. |
| `packages/docs/template/docs/.references/design-contract.md` | Update "Required Path" from `YYYY-MM-DD-w{W}-r{R}-<slug>.md` to `YYYY-MM-DD-<slug>.md`; remove the wave-model.md reference in the path section. |
| `packages/docs/template/docs/.references/design-workflow.md` | Update all path references from `YYYY-MM-DD-w{W}-r{R}-<slug>.md` to `YYYY-MM-DD-<slug>.md`; remove W/R resolution guidance. |

## Detailed Changes

### 1. `wave-model.md`

#### Naming Patterns table
Remove the Design row from the table. The table currently has 8 rows (Design, Plan directory, Plan overview, Plan phase, Work directory, Work index, Work phase, Agent guide). After the change it has 7 rows.

#### Resolution Rules section
The current text reads: "When writing a new design, plan directory, or work directory, determine `W` and `R` in this order:"

Change to: "When writing a new plan directory or work directory, determine `W` and `R` in this order:"

Also in step 2, the current text references `docs/designs/`, `docs/plans/`, or `docs/work/`. Remove `docs/designs/` from that list.

#### New "Design Exemption" section
Add a new section after "PRD Exemption" and before "Archive Integration" with heading `## Design Exemption`. Content:

- Designs are exempt from W/R encoding. Design filenames use the simplified pattern `YYYY-MM-DD-<slug>.md`.
- The date provides chronological ordering; the slug provides topical identity.
- When a design is revised or superseded, write a new dated design and use `## Design Lineage` (defined in `docs/.references/design-contract.md`) to link back to prior designs.
- Designs are inputs to a wave cycle (design → plan → work), not products of one. Binding them to a wave number implies a 1:1 relationship with a downstream cycle that often does not hold.

### 2. `design-contract.md`

#### Required Path section
Change from:
```
- `docs/designs/YYYY-MM-DD-w{W}-r{R}-<slug>.md`

See `docs/.references/wave-model.md` for W/R semantics and resolution rules.
```

To:
```
- `docs/designs/YYYY-MM-DD-<slug>.md`

`YYYY-MM-DD` is today's date (never backdated). `<slug>` is lowercase, hyphens only.
```

No other sections of design-contract.md change — Required Headings, Design Lineage, Link Rules, etc. all remain as-is.

### 3. `design-workflow.md`

This file contains path references in multiple places. All occurrences of `YYYY-MM-DD-w{W}-r{R}-<slug>.md` must change to `YYYY-MM-DD-<slug>.md`. There are references in:
- The Purpose/preamble paragraph ("See `docs/.references/wave-model.md` for W/R semantics." — remove this line)
- The output form description ("This workflow ends with design docs in `docs/designs/` using the form `docs/designs/YYYY-MM-DD-w{W}-r{R}-<slug>.md`")
- The Validation Checklist ("The output lives in `docs/designs/` and follows `YYYY-MM-DD-w{W}-r{R}-<slug>.md` naming.")

All occurrences change to `YYYY-MM-DD-<slug>.md`. Remove any standalone references to wave-model.md for W/R semantics that are specific to the design path (the wave-model reference in the context of plans/work elsewhere in the system is fine).

## Parallelism

All three files are in the same template package but are disjoint — no cross-file editing dependencies. An implementing agent can edit all three in parallel.

## Acceptance Criteria

- [ ] `wave-model.md` has no Design row in the Naming Patterns table.
- [ ] `wave-model.md` Resolution Rules no longer mention `docs/designs/`.
- [ ] `wave-model.md` has a "Design Exemption" section after "PRD Exemption".
- [ ] `design-contract.md` Required Path is `YYYY-MM-DD-<slug>.md` with no wave-model reference.
- [ ] `design-workflow.md` has no occurrences of `w{W}-r{R}` in path patterns.
- [ ] No other reference files are modified.
