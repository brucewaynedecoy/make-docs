# Phase 4: Tests, Work Backlog, and Validation

## Purpose

Validate the source-authority guidance change and capture implementation closeout evidence.

## Overview

This phase records the validation loop for the v2 W15 reconciliation. No runtime code or test expectation changes were needed for W15; the validation pass separated source-authority coverage from existing CLI backup/router baseline debt.

## Source PRD Docs

- [docs/prd/06-template-contracts-and-generated-assets.md](../../../../prd/06-template-contracts-and-generated-assets.md)
- [docs/prd/08-skills-catalog-and-distribution.md](../../../../prd/08-skills-catalog-and-distribution.md)
- [docs/prd/09-dogfood-and-maintainer-operations.md](../../../../prd/09-dogfood-and-maintainer-operations.md)
- [historical design](../../designs/2026-06-17-make-docs-lifecycle-foundation.md) (retired action-PRD: `docs/prd/14-add-lifecycle-workflow-foundation.md`)

## Stage 1 - Test and Consistency Updates

### Tasks

- [x] t1: Review `packages/cli/tests/consistency.test.ts` for root, package, and generated package-template parity expectations.
- [x] t2: Leave consistency tests unchanged because the source-authority wording preserves existing template/dogfood/package relationships.
- [x] t3: Leave renderer code unchanged because source-authority guidance is shipped as template-owned documentation, not generated renderer text.
- [x] t4: Leave skill catalog and registry tests unchanged because W15 changed package skill wording only, not the declared skill asset set.

### Acceptance criteria

- Tests continue to enforce package and generated package-template alignment.
- No unrelated test churn is introduced.
- Renderer expectations remain aligned with generated instruction routers.

### Dependencies

- Phases 2 and 3 are complete.

## Stage 2 - Focused Validation

### Tasks

- [x] t5: Run `python3 -B packages/skills/decompose-codebase/scripts/test_validate_output.py`.
- [x] t6: Run `npm test -w packages/cli`.
- [x] t7: Run `npm run build -w packages/cli`.
- [x] t8: Run `bash scripts/check-instruction-routers.sh`.
- [x] t9: Run `bash scripts/check-wave-numbering.sh`.
- [x] t10: Run `git diff --check`.

### Acceptance criteria

- Validation commands pass, or failures are documented with concrete blockers.
- Any baseline validation debt is separated from regressions caused by this work.
- Generated package-template parity failures are fixed by syncing from template source, not by hand-patching generated copies.

### Validation evidence

| Command | Result | Notes |
| --- | --- | --- |
| `python3 -B packages/skills/decompose-codebase/scripts/test_validate_output.py` | Pass | 42 validator tests passed. |
| `npm run validate:defaults -w packages/cli` | Pass | `tests/consistency.test.ts` passed, including template/package parity checks. |
| `npm run build -w packages/cli` | Pass | CLI TypeScript bundle built successfully. |
| `npm run smoke:pack` | Pass | Prepack copied `packages/docs/template` into the ignored CLI package template and smoke install/sync/skills/backup/uninstall flow completed. |
| `bash scripts/check-wave-numbering.sh` | Pass | Wave numbering check passed. |
| `git diff --check` | Pass | No whitespace errors. |
| `bash scripts/check-instruction-routers.sh` | Baseline failure | Fails on root `./AGENTS.md`/`./CLAUDE.md` mismatch and root/docs line-budget debt; the edited `docs/work` router pair is aligned. |
| `npm test -w packages/cli` | Baseline failure | 213 tests passed, 3 failed. Failures are stale backup expectations: counts expect `72` files and `14` directories but the regenerated template produces `80` and `15`, and two tests expect global `archive-docs` skill backups even when `skills = false` and `selectedSkills = []`. |

### Dependencies

- Stage 1 is complete.

## Stage 3 - Stale-Wording Scan

### Tasks

- [x] t11: Scan docs and skill text for stale wording that promotes `decompose-codebase` above active backlog contracts.
- [x] t12: Scan docs and skill text for stale wording that treats `.agents` or `.claude` mirrors as independent source authority.
- [x] t13: Scan for stale `rebuild-backlog-*` wording where it conflicts with the active `work-index.md` and `work-phase.md` naming.

### Acceptance criteria

- Remaining skill-projection wording is intentional and accurate.
- Mirror wording clearly indicates parity output status.
- Root work backlog source authority is unambiguous.

### Scan evidence

Remaining active skill-local `rebuild-backlog-index.md` and `rebuild-backlog-phase.md` references are intentional projection filenames under `packages/skills/decompose-codebase/`; they point at the current directory backlog shape and do not replace `work-index.md` or `work-phase.md` as template-owned source contracts.

Remaining primary-authority or mirror-language hits are in the original W15 design/plan text, archived historical records, or this closeout's validation statements. Current shipped guidance now makes template-owned docs and live lifecycle contracts primary, with skill projections, generated harness stubs, installed copies, and archives as fallback/reference evidence.

### Dependencies

- Stage 2 validation is complete or blockers are documented.

## Stage 4 - Closeout Artifacts

### Tasks

- [x] t14: Reindex docs with `jdocmunch` after docs and history edits.
- [x] t15: Confirm no `jcodemunch` reindex is needed because W15 did not change code implementation.
- [x] t16: Create `docs/assets/history/` records for completed implementation phases.
- [x] t17: Summarize validation evidence and remaining risks for handoff.

### Acceptance criteria

- A history record exists for the completed W15 v2 reconciliation.
- The W15 R0 design, plan, PRD change doc, backlog, contract edits, skill edits, and validation evidence are traceable.
- Final handoff states whether implementation is complete and which validations were run.

### Dependencies

- Stages 1 through 3 are complete.
