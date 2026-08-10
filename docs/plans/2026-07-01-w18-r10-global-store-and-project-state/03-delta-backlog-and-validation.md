# Phase 3: Delta Backlog and Validation

## Scope

Generate the W18 R10 delta work backlog from PRD 38 and the Phase 2 scope decisions, then run the closing validation pass over every file this plan produced. This phase mutates only `docs/work/2026-07-01-w18-r10-global-store-and-project-state/**` plus validation fix-up edits to files written earlier in this plan.

## Inputs

- `docs/prd/38-global-store-and-project-state.md` as the effective requirement.
- The Phase 2 scope decisions mapping D0–D11 to backlog coverage.
- The work templates at `.make-docs/templates/system/work-index.md` and `.make-docs/templates/system/work-phase.md` and the backlog rules in `.make-docs/references/system/execution-workflow.md`.

## Outputs

- `docs/work/2026-07-01-w18-r10-global-store-and-project-state/00-index.md` with coordinate `W18 R10`, a phase map, usage notes carrying the cross-design sequencing and R-SCOPE-1 exclusions, and the implementation-loop follow-on.
- Dependency-ordered phase files, each with coordinate `W18 R10 P<N>`, `## Source PRD Docs` citing PRD 38 plus the still-constraining baselines (PRD 21, PRD 24, PRD 17, PRD 05, PRD 35 as verified per phase), stages with `- [ ] tN:` tasks incrementing across the whole file, plain-bullet acceptance criteria, and dependencies:
  - Store bootstrap, global config and manifest, and the SQLite database with schema versioning, migrations, WAL concurrency, and graceful recovery (D2, D3).
  - Stable project identity and manifest minting (D4).
  - The unified project-state model and the work-execution evidence migration from the per-repo checkpoint JSON, with the install-registry mirror kept subordinate to project manifests (D5, D6).
  - Lifecycle behaviors — uninstall, setup remove, update — and privacy (D7, D8).
  - The upstream template runtime-state guidance update plus dogfood re-seed, and the D11 test suite (D11 and the documentation consequence).
- Design MUSTs expressed as acceptance criteria, including that state survives a simulated directory move or clone, that a missing database degrades gracefully without blocking repository reads, and that setup remove prunes only the target project's rows.

## Validation

- Every backlog phase cites PRD 38 and the verified still-constraining baselines, and every D0–D11 decision area is covered by at least one task or acceptance criterion.
- Task IDs increment across each entire phase file without resetting, tasks use `- [ ] tN:` checkbox syntax, and acceptance criteria are plain bullets.
- Links resolve, paths are repo-relative (with the literal `~/.make-docs/` store path allowed as the documented subject), no file was backdated, no existing PRD or work file was renumbered, and `git diff --check` is clean.
- The template guidance update appears in the backlog as upstream-first work under `packages/docs/template/` followed by dogfood re-seed, and nothing under `packages/` was authored by this documentation pass itself.
