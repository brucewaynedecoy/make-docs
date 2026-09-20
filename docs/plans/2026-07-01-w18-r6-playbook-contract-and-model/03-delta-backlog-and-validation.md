# Phase 3: Delta Backlog and Validation

## Scope

Generate the W18 R6 delta work backlog from the Phase 2 scope decisions and run the closing validation pass across everything this plan produced. The backlog is a scoped delta, not a regenerated full backlog.

## Inputs

- PRD 34 as the primary requirement source, plus PRD 29 and PRD 33 as still-constraining baselines and PRD 22 and PRD 25 where migration paths and operation-domain modularity apply.
- `.make-docs/templates/system/work-index.md` and `.make-docs/templates/system/work-phase.md` for the backlog shape.
- Design D7 verification requirements as the acceptance-criteria floor.

## Outputs

- `docs/work/2026-07-01-w18-r6-playbook-contract-and-model/00-index.md` with frontmatter coordinate `W18 R6` plus dependency-ordered phase files:
  1. `01-playbook-contract-authoring.md` — author the contract upstream and dogfood it, with the optional reader-facing guide as a non-normative projection (D0, D2–D4 as contract text).
  2. `02-playbook-model-and-parser.md` — the Playbook model data shape and the staged parser pipeline (D5, R-MODEL-1..3).
  3. `03-validator-and-diagnostics.md` — layered validation and the diagnostic catalog, kept in parity with the contract (R-MODEL-4..5, R-AUTH-3, R-DEP-4).
  4. `04-operations-and-default-playbook-migration.md` — `playbook.validate` and `playbook.catalog` wrap the library, and the default Playbook migrates to the `<slug>.playbook.md` form upstream and downstream (R-MODEL-6, R-SCOPE-2, R-DOC-2, R-AUTH-5).
  5. `05-tests-fixtures-and-verification.md` — unit tests, one failing fixture per diagnostic code, the R-TEST-2 coverage areas, the R-WF-7 worked-example parse, and zero-error default-Playbook validation in both locations (D7).
- Task checkboxes use `- [ ] tN: ...` with IDs incrementing across each entire phase file, acceptance criteria are plain bullets, and every phase carries `## Source PRD Docs` citing PRD 34 plus its constraining baselines.

## Validation

- Every design MUST requirement appears as a task or acceptance criterion in exactly one backlog phase; no MUST is silently dropped and no phase implements another design's surface (runner progression, packaging compiler, harness adapters, conformance, CLI reorganization, global store).
- The backlog cites `../../prd/34-playbook-authoring-contract-and-model.md` from every phase, links resolve, paths are repo-relative, task IDs never reset within a phase file, and the closing pass runs the plan-level validation checklist from [00-overview.md](00-overview.md).
