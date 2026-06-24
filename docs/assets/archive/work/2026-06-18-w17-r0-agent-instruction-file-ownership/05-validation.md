# Phase 05: Validation and PRD Reconciliation

## Purpose

Prove the block model with focused tests and packaging validation, and close out
the PRD reconciliation so the change is fully traced.

## Overview

Validation is the gate before the change is considered done: both the code tests
and the documentation reconciliation must pass, and the previously deferred
baseline annotations are confirmed against the now-real implementation.

## Source PRD Docs

- [15-revise-agent-instruction-file-ownership.md](../../../../prd/15-revise-agent-instruction-file-ownership.md)
- [05-installation-profile-and-manifest-lifecycle.md](../../../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [06-template-contracts-and-generated-assets.md](../../../../prd/06-template-contracts-and-generated-assets.md)
- [07-cli-command-surface-and-lifecycle.md](../../../../prd/07-cli-command-surface-and-lifecycle.md)
- [13-revise-cli-conflict-resolution.md](../../../../prd/13-revise-cli-conflict-resolution.md)

## Stage 1 - Code and packaging validation

### Tasks

- [x] t1: Run focused CLI tests for the block model and its edge cases: idempotency, user-content preservation, missing/edited/duplicate markers, multiple harnesses, greenfield install, migration, and block-scoped conflict review. Covered by `npm test -w packages/cli -- managed-block renderers install`.
- [x] t2: Smoke-pack the packaged template to confirm the inline root instruction block ships and installs cleanly from a clean directory. Covered by `npm run smoke:pack` and `scripts/smoke-pack.mjs`, including absence of packed `.make-docs/AGENTS.md` / `.make-docs/CLAUDE.md` instruction files and clean-install root managed-block assertions.
- [x] t3: Regression-check that non-instruction managed files keep the existing whole-file overwrite/skip conflict behavior. Covered by the focused install test suite's non-instruction reference/template conflict cases.

## Stage 2 - PRD reconciliation closeout

### Tasks

- [x] t4: Confirm and apply the deferred baseline annotations to `docs/prd/05-installation-profile-and-manifest-lifecycle.md` and `docs/prd/06-template-contracts-and-generated-assets.md` (`Superseded by` PRD 15) at the now-real render and manifest sections; update `docs/prd/00-index.md` if needed.
- [x] t5: Run a docs hygiene pass: refresh indexes, check links, confirm no placeholders, and run `git diff --check`. `jdocmunch` reindex failed for the local path and repo-name forms, so direct reads were used after the required reindex attempts; `jcodemunch` was refreshed with an incremental code index. `python3 .make-docs/scripts/check_path_hygiene.py --repo-root . --format json`, `scripts/check-wave-numbering.sh`, `scripts/check-instruction-routers.sh`, `diff -rq packages/docs/template packages/cli/template`, and `git diff --check` passed. `npm test -w packages/cli -- consistency` remains blocked only by the pre-existing unmanaged-template and risk-register expected-heading baseline failures.

### Acceptance criteria

- Focused CLI tests and smoke-pack pass; the listed edge cases are covered.
- Non-instruction managed-file conflict behavior is unchanged.
- The deferred PRD 05/06 annotations are applied, and the index and lineage are accurate with no renumbering.
- Template and dogfood are in parity.

### Dependencies

- Phases 01-04. Tests under `packages/cli/`; PRD reconciliation under `docs/prd/` (make-docs's own content).
