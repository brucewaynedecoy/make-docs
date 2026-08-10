# Phase 04: Delta Backlog and Closeout

## Purpose

Generate the paired implementation backlog and close the planning round with validation and a local commit.

## Backlog Contract

- Work directory: `docs/work/2026-06-23-w10-r2-system-asset-materialization-contract/`.
- Entry point: `00-index.md`.
- Phase files:
  - `01-requirements-and-register-reconciliation.md`
  - `02-materialization-mode-and-bootstrap.md`
  - `03-provider-cache-manifest-safety.md`
  - `04-validation-and-closeout.md`

## Source PRD Docs

Every work phase must cite:

- [17-system-asset-materialization-and-local-bootstrap.md](../../prd/17-system-asset-materialization-and-local-bootstrap.md)
- [16-package-runtime-and-deployment-boundaries.md](../../prd/16-package-runtime-and-deployment-boundaries.md)
- [05-installation-profile-and-manifest-lifecycle.md](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [06-template-contracts-and-generated-assets.md](../../prd/06-template-contracts-and-generated-assets.md)
- [03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md)

## Closeout Validation

- Run `git diff --check`.
- Reindex docs with `jdocmunch`.
- Verify links and headings in touched docs.
- Verify work phase task syntax and plain-bullet acceptance criteria.
- Read `docs/assets/references/commit-message-convention.md`.
- Stage only W10 R2 planning, PRD reconciliation, and work backlog files.
- Commit locally and do not push.
