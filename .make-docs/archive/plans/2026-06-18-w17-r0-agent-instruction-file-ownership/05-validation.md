# Phase 05: Validation and Reconciliation

## Purpose

Prove the block model with focused tests and packaging validation, and reconcile
the PRD and the delta backlog so the change is fully traced.

## What to build

- CLI tests under `packages/cli/tests/` covering: block insert/update/re-assert
  idempotency; user-content preservation; missing/edited/duplicate markers;
  multiple harnesses (`AGENTS.md` and `CLAUDE.md`); greenfield install;
  migration of a verbatim-rendered file; and block-scoped conflict review.
- Smoke-pack validation that the packaged template ships the dedicated
  instruction source and the block template, and installs cleanly from a clean
  directory.
- Regression check that non-instruction managed files keep the existing
  whole-file conflict behavior.
- PRD reconciliation: author `docs/prd/15-revise-agent-instruction-file-ownership.md`
  (revision template), add `### Change Notes` `Superseded by` backlinks to the
  impacted baseline docs, and update `docs/prd/00-index.md`.

## Key decisions

- Validation is the gate before this change is considered done; both code tests
  and the documentation reconciliation must pass.

## Acceptance criteria

- Focused CLI tests and smoke-pack pass; the listed edge cases are covered.
- The PRD change doc, baseline backlinks, and index reflect the revision with no
  renumbering of existing docs.
- Template and dogfood are in parity after re-seed.

## Dependencies

- Phases 01-04. Tests under `packages/cli/`; PRD reconciliation under
  `docs/prd/` (make-docs's own content).
