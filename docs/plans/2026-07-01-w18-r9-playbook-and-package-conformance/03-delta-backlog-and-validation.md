# Phase 3: Delta Backlog and Validation

## Scope

Generate the dependency-ordered W18 R9 delta backlog from PRD 37 and the Phase 2 settled scope, then run the closing validation pass over every file this plan produced or edited. This phase mutates only `docs/work/2026-07-01-w18-r9-playbook-and-package-conformance/**` plus fix-up edits to files already changed by this plan.

## Inputs

- `docs/prd/20-agent-harness-conformance-and-support-claims.md` and the annotated baselines from Phase 1.
- The settled scope from [02-conformance-scope.md](02-conformance-scope.md).
- The templates at `.make-docs/templates/system/work-index.md` and `.make-docs/templates/system/work-phase.md`, plus the backlog rules in `.make-docs/references/system/execution-workflow.md`.

## Outputs

- `docs/work/2026-07-01-w18-r9-playbook-and-package-conformance/00-index.md` with coordinate `W18 R9`, a phase map, usage notes carrying the R-SCOPE/R-KEEP boundaries, the cross-design sequencing (verifies W18 R8 outputs, executes via the W18 R7 runner, consumes the W18 R6 model), and the maintainer-only `docs/assets/conformance/` exception.
- Dependency-ordered phase files, each with Purpose, Overview, `## Source PRD Docs` citing PRD 37 plus the still-constraining baselines (PRD 20, PRD 33, PRD 36, and PRD 10/PRD 19 where the exclusion check applies), stages with `### Tasks` checkboxes incrementing across the whole file, `### Acceptance criteria` as plain bullets, and `### Dependencies`:
  - support tuple and tuple registry data file (D2, D3),
  - evidence bar and Codex-first first-pass scenario specs (D4, D5),
  - test-layer separation and D9 meta-verification checks including the shipped-artifact exclusion check (D6, D9),
  - support-claim governance wiring (D7).
- Design MUSTs encoded as acceptance criteria, including: no tuple reaches `conformance-validated` without a D4-bar run; verdicts of `inconsistent`, `unsupported`, or `blocked` never advance a tuple; blocked scenarios report `blocked`; internal tests are never cited as harness-recognition evidence; and conformance assets are absent from the shipped template, the packaged copy, and npm tarballs.

## Validation

- Every backlog phase links to PRD 37 and its still-constraining baselines, task IDs increment across each entire phase file without resetting, and acceptance criteria are plain bullets.
- Every new or edited file uses relative markdown links and repo-relative paths, no semantic line breaks, and the plan, PRD, and work coordinates all read `W18 R9`.
- `docs/prd/00-index.md`, the risk register, the annotations, and the backlog cross-resolve: following links from PRD 20, PRD 33, or PRD 36 reaches PRD 37, and PRD 37's follow-on reaches this backlog.
- Changed files pass link checks, `.make-docs/scripts/check_path_hygiene.py` review, and `git diff --check`.
