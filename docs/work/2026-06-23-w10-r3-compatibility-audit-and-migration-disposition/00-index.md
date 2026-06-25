# Compatibility Audit and Migration Disposition Work Backlog

> In v2, work backlogs are directories. This file is the `00-index.md` entry point. Phase detail lives in sibling `0N-<phase>.md` files. See `docs/assets/references/wave-model.md` for W/R semantics.

## Purpose

This backlog implements the W10 R3 compatibility classifier and migration disposition contract. It turns the accepted design, W10 R3 plan, and PRD 18 revision into dependency-ordered work for state classification, migration safety, backup-and-reinstall, rollback expectations, and TypeScript/Rust coexistence.

Implementation must classify the current source state before any managed-file mutation.

## Phase Map

| Phase | File | Purpose |
| --- | --- | --- |
| 01 | [01-requirements-and-state-fixtures.md](01-requirements-and-state-fixtures.md) | Confirm PRD 18 and build the required fixture matrix. |
| 02 | [02-compatibility-classifier.md](02-compatibility-classifier.md) | Implement state classification and conservative fallback recognition. |
| 03 | [03-migration-disposition-flows.md](03-migration-disposition-flows.md) | Implement sync, migrate, migrate-with-review, backup-and-reinstall, and manual-review-required behavior. |
| 04 | [04-validation-and-closeout.md](04-validation-and-closeout.md) | Validate lifecycle, package, dogfood, and docs behavior before closeout. |

## Usage Notes

- Do not implement destructive migration in the ordinary bare `make-docs` or `make-docs reconfigure` path.
- Do not re-audit between approval, backup, removal, and reinstall.
- Do not infer repo-root authored docs as product-owned just because they live near managed assets.
- Do not treat agent-only dogfood moves as shipped migration behavior. Documentation tree moves that relocate Markdown files must be implemented in the packaged CLI/shared core with deterministic move planning, reviewed link rewrites, and full destination-tree link validation.
- Do not silently expand `selectedSkills` or install skill files by default during migration.
- Preserve the TypeScript CLI as the implementation source of truth until a Rust parity plan lands.

## Intended Follow-On

Route: implementation

Next step: Implement phase 01, then proceed through phases 02 to 04 in order.

Why: The active PRD set now defines the compatibility classifier and disposition requirements; implementation should proceed through the fixture-gated backlog rather than adding one-off migration behavior.

Coordinate Handoff: `W10 R3`.
