<!-- make-docs:begin -->
# Work Directory

Output target for implementation backlogs. In v2, every backlog is a **directory** containing an index plus one or more phase files.

## Naming Convention

- Directory: `YYYY-MM-DD-w{W}-r{R}-<slug>/`
- Inside: `00-index.md` (entry point) + `0N-<phase>.md` (one per phase)
- Example: `docs/work/2026-04-15-w1-r0-payments-rollout/` containing `00-index.md`, `01-foundation.md`, `02-rollout.md`
- See `.make-docs/references/system/wave-model.md` for W/R semantics.

## Agent Instructions

- Before writing, read `.make-docs/references/system/execution-workflow.md` and copy the matching template from `.make-docs/templates/system/` (`work-index.md` for `00-index.md`; `work-phase.md` for phase files).
- Use the current repository's accepted design, plan, PRD, and work contracts as backlog authority before consulting archived examples or installed skill projections.
- Treat bundled skill assets, generated harness stubs, and archived backlogs as fallback/reference material only; they are not independent backlog-shape authority when live repo contracts are available.
- In phase files, preserve markdown task syntax in `### Tasks` (`- [ ] t1: ...`) and keep `### Acceptance criteria` as plain bullets.
- Always create work as a directory; never a flat `.md` file.
- Apply the date-W/R-slug naming; do not backdate.
- Archived backlogs live in `docs/assets/archive/work/`. **Never archive unless explicitly asked.** See `docs/assets/archive/AGENTS.md`.
<!-- make-docs:end -->
