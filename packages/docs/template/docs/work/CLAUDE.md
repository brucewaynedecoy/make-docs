<!-- make-docs:begin -->
# Work Directory

Output target for implementation backlogs. In v2, every backlog is a **directory** containing an index plus one or more phase files.

## Naming Convention

- Directory: `YYYY-MM-DD-w{W}-r{R}-<slug>/`
- Inside: `00-index.md` (entry point) + `0N-<phase>.md` (one per phase)
- Example: `docs/work/2026-04-15-w1-r0-payments-rollout/` containing `00-index.md`, `01-foundation.md`, `02-rollout.md`
- Use a valid local `.make-docs/system/references/wave-model.md` body for W/R semantics. When it is absent, run `make-docs resource read make-docs://system/reference/wave-model.md`.

## Agent Instructions

- Before writing, use a valid local `.make-docs/system/references/execution-workflow.md` body or, when it is absent, run `make-docs resource read make-docs://system/reference/execution-workflow.md`.
- For `00-index.md`, use `.make-docs/system/templates/work-index.md` or run `make-docs resource read make-docs://system/template/work-index.md` when the local body is absent. For phase files, use `.make-docs/system/templates/work-phase.md` or run `make-docs resource read make-docs://system/template/work-phase.md` when the local body is absent.
- Use the current repository's accepted design, plan, PRD, and work contracts as backlog authority before consulting archived examples or installed skill projections.
- Treat bundled skill assets, generated harness stubs, and archived backlogs as fallback/reference material only; they are not independent backlog-shape authority when live repo contracts are available.
- In phase files, preserve markdown task syntax in `### Tasks` (`- [ ] t1: ...`) and keep `### Acceptance criteria` as plain bullets.
- Always create work as a directory; never a flat `.md` file.
- Apply the date-W/R-slug naming; do not backdate.
- Archived backlogs live in `.make-docs/archive/work/`. Before first use, run `make-docs project surface ensure archive`. **Never archive unless explicitly asked.**
<!-- make-docs:end -->
