# Phase 04: Closeout and Risk Validation

## Purpose

Validate the completed implementation, reconcile only the risks proven by evidence, and record release-adjacent manual-test guidance without performing real publish actions.

## Overview

This phase closes the implementation loop. It should run touched-file validation first, separate unrelated baseline debt from regressions introduced by this work, and update PRD/risk/history surfaces only after implementation evidence exists.

## Source PRD Docs

- [../../prd/16-revise-package-and-deployment-boundaries.md](../../prd/16-revise-package-and-deployment-boundaries.md)
- [../../prd/00-index.md](../../prd/00-index.md)
- [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md)
- [../../prd/10-packaging-validation-and-release-reference.md](../../prd/10-packaging-validation-and-release-reference.md)

## Stage 1 - Aggregate Validation

### Tasks

- [x] t1: Run `git diff --check` across the completed work.
- [x] t2: Run targeted CLI/package tests for every touched TypeScript or package surface.
- [x] t3: Run docs validation or touched-link checks for edited docs and READMEs.
- [x] t4: Run `npm run validate:defaults` when template, package, or managed-asset surfaces change.
- [x] t5: Run `scripts/smoke-pack.mjs` or the current smoke-pack equivalent when package contents, package docs, or release validation changes.
- [x] t6: Run npm pack or publish validation only in dry-run mode and record the command/output summary.

### Acceptance criteria

- Validation covers every touched surface at the right level.
- Dry-run package validation is captured without real publish side effects.
- Touched-doc hygiene is checked separately from unrelated baseline debt.
- Any skipped validation has an explicit reason and residual risk.

### Dependencies

- Phase 01 requirements gate
- Phase 02 shared command/runtime contract
- Phase 03 package validation and release boundary
- `docs/assets/references/execution-workflow.md`
- `docs/assets/references/output-contract.md`

## Stage 2 - PRD, Risk, History, and Manual-Test Closeout

### Tasks

- [x] t7: Reconcile [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md) only for items the implementation evidence actually changes.
- [x] t8: Keep Q-001, Q-007, and Q-012 open unless a newer accepted design resolves them.
- [x] t9: Close D-006, R-003, R-006, or R-014 only when the corresponding evidence satisfies each item's `To close` text.
- [x] t10: Create a history breadcrumb after implementation completes, using the repo-local history contract and the actual validation results.
- [x] t11: Record the final manual-test or UAT decision for package/release-adjacent behavior, including any dry-run package evidence.
- [x] t12: Produce a final diff summary that distinguishes work from unrelated pre-existing changes.

### Acceptance criteria

- Risk-register status changes are evidence-backed and do not duplicate existing D/Q/R entries.
- PRD 16 remains the owning package-boundary requirement.
- History is created only after implementation, not as part of planning alone.
- Manual-test guidance is explicit, especially around packaged CLI and release-adjacent behavior.
- Real publish, registry, Homebrew, Crates, or tag operations remain blocked unless separately authorized.

### Dependencies

- Stage 1 aggregate validation
- `docs/assets/references/history-record-contract.md`
- [../../plans/2026-06-23-w10-r1-package-and-deployment-boundaries/04-delta-backlog-and-closeout.md](../../plans/2026-06-23-w10-r1-package-and-deployment-boundaries/04-delta-backlog-and-closeout.md)

## Implementation Notes

- Aggregate validation covered the completed W10 R1 wave: `git diff --check`, touched Markdown link checks, `check_path_hygiene.py`, `check-wave-numbering.sh`, and `scope_guard.py` passed for the edited work/doc surfaces.
- Targeted package tests passed: `npm --prefix packages/cli test -- tests/cli.test.ts`, `npm --prefix packages/cli test -- tests/install.test.ts tests/consistency.test.ts tests/lifecycle.test.ts tests/backup.test.ts tests/uninstall.test.ts`, and `npm run validate:defaults`.
- Package/release validation stayed reversible: `npm pack --dry-run --json --ignore-scripts`, `node scripts/smoke-pack.mjs`, and `npm publish --dry-run --access public --tag next` passed; no real npm publish, registry reservation, Homebrew tap, Crates publish, git tag, release promotion, remote push, or other irreversible release action was performed.
- Final package-adjacent UAT used a local tarball with `npm exec --yes --package <tarball> -- make-docs --yes --target <temp-dir>` and verified `.make-docs/manifest.json`, root instruction files, `docs/AGENTS.md`, package provenance, and no default skill files.
- Risk reconciliation changed only evidence-backed items: D-006 and R-003 were closed in Phase 3; Q-001, Q-007, Q-012, R-006, and R-014 remain open.
- PRD 16 remains the owning package/deployment boundary requirement; no new PRD was needed for this implementation wave.
- Final diff scope is limited to W10 R1 code/docs/backlog/history/risk work already committed in Phases 1-3 plus this Phase 4 closeout record.
