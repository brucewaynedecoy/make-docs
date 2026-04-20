# Wave Model

## Purpose

This file is the single source of truth for the Wave/Revision/Phase (W/R/P) encoding used across `starter-docs` v2.

Every other reference file, template, and router links here instead of restating these rules. The encoding was piloted in `docs/.references/agent-guide-contract.md` and is extended to designs, plans, and work in v2. PRDs are exempt; see `## PRD Exemption`.

## Terms

| Token | Name | Meaning |
| --- | --- | --- |
| `w{W}` | Wave | One end-to-end iteration: design to plan to work. Wave 1 is the initial wave. A new wave begins when the user starts a new end-to-end initiative. |
| `r{R}` | Revision | Revision within a wave. `r0` is the initial revision. `r1+` are meaningful redos of that wave's artifacts (for example a redesigned design or a re-planned plan after feedback). |
| `p{P}` | Phase | Phase within a plan or work backlog. Appears in inner phase files and may appear in agent history `coordinate` frontmatter. `p{P}` does NOT appear in the top-level names of designs, plans, work directories, or history filenames. |

## Naming Patterns

| Artifact | Required path |
| --- | --- |
| Plan directory | `docs/plans/YYYY-MM-DD-w{W}-r{R}-<slug>/` |
| Plan overview file | `docs/plans/YYYY-MM-DD-w{W}-r{R}-<slug>/00-overview.md` |
| Plan phase file | `docs/plans/YYYY-MM-DD-w{W}-r{R}-<slug>/0N-<phase>.md` |
| Work directory | `docs/work/YYYY-MM-DD-w{W}-r{R}-<slug>/` |
| Work index file | `docs/work/YYYY-MM-DD-w{W}-r{R}-<slug>/00-index.md` |
| Work phase file | `docs/work/YYYY-MM-DD-w{W}-r{R}-<slug>/0N-<phase>.md` |
| Agent history record | `docs/.assets/history/YYYY-MM-DD-<slug>.md` |

`YYYY-MM-DD` is the date the artifact is written. Never backdate.

`<slug>` is lowercase, hyphens only, no special characters.

## Resolution Rules

When writing a new plan directory or work directory, determine `W` and `R` in this order:

1. **Honor explicit guidance.** If the user has stated the wave or revision (for example "this is wave 2" or "redo the design as r1"), use those values.
2. **Scan the target directory** (`docs/plans/` or `docs/work/`) for existing entries matching `w{W}-r{R}`. Parse the highest `W` present.
3. **Decide W and R within the highest W:**
   - If the user is revising an existing artifact in that wave, keep `W` and increment `R`.
   - If the user is starting a new end-to-end initiative, increment `W` and reset `R` to `0`.
4. **If no prior entries exist**, default to `w1-r0`.

For agent history records, store any known W/R/P/S/T position in the `coordinate` frontmatter field described by `docs/.references/agent-guide-contract.md`.

## PRD Exemption

PRDs are intentionally exempt from W/R/P. The PRD namespace evolves in place through active-set evolution and change docs rather than iterating in waves.

- PRD docs keep the fixed `NN-<slug>.md` convention described in `docs/.references/output-contract.md`.
- Change management for PRDs is governed by `docs/.references/prd-change-management.md`.
- Archived PRD sets are grouped by date, not by wave (see `## Archive Integration`).

## Design Exemption

Designs are exempt from W/R encoding. Design filenames use the simplified pattern `YYYY-MM-DD-<slug>.md`.

The date provides chronological ordering; the slug provides topical identity. No wave or revision identifier is required.

When a design is revised or superseded, write a new dated design and use `## Design Lineage` (defined in `docs/.references/design-contract.md`) to link back to prior designs. Do not use `r{R}` revision numbering on designs.

Designs are inputs to a wave cycle (design → plan → work), not products of one. Binding a design to a wave number implies a 1:1 relationship with a downstream plan/work cycle that often does not hold.

## Archive Integration

Archive rules for designs, plans, work, and PRDs live in `docs/.archive/AGENTS.md`. W/R/P naming is preserved when an artifact is archived; it is not rewritten.

## Forward Compatibility

The W/R/P encoding was piloted in legacy agent history filenames before broader adoption. Existing legacy files continue to conform without change.
