# Work Directory

Output target for implementation backlogs. In v2, every backlog is a **directory** containing an index plus one or more phase files.

## Naming Convention

- Directory: `YYYY-MM-DD-w{W}-r{R}-<slug>/`
- Inside: `00-index.md` (entry point) + `0N-<phase>.md` (one per phase)
- Example: `docs/work/2026-04-15-w1-r0-payments-rollout/` containing `00-index.md`, `01-foundation.md`, `02-rollout.md`
- See `docs/assets/references/wave-model.md` for W/R semantics.

## Agent Instructions

- Before writing, read `docs/assets/references/execution-workflow.md` and copy the matching template from `docs/assets/templates/` (`work-index.md` for `00-index.md`; `work-phase.md` for phase files).
- Always create work as a directory; never a flat `.md` file.
- Apply the date-W/R-slug naming; do not backdate.
- Archived backlogs live in `docs/assets/archive/work/`. **Never archive unless explicitly asked.** See `docs/assets/archive/AGENTS.md`.
