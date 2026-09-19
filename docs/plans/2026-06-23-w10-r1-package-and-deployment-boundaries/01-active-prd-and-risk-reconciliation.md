# Phase 01: Active PRD and Risk Reconciliation

## Purpose

Turn the accepted package and deployment boundary design into the active PRD namespace without rewriting unrelated baseline docs or generating implementation work ahead of approval.

## What to Build

- Add `docs/prd/16-package-runtime-and-deployment-boundaries.md` as a revision change doc.
- Update `docs/prd/00-index.md` with the new active change doc and related-doc links.
- Add targeted `### Change Notes` backlinks to affected baseline docs:
  - `docs/prd/01-product-overview.md`
  - `docs/prd/02-architecture-overview.md`
  - `docs/prd/05-installation-profile-and-manifest-lifecycle.md`
  - `docs/prd/07-cli-command-surface-and-lifecycle.md`
  - `docs/prd/08-skills-catalog-and-distribution.md`
  - `docs/prd/10-packaging-validation-and-release-reference.md`
  - `docs/prd/08-skills-catalog-and-distribution.md`
- Update `docs/prd/03-open-questions-and-risk-register.md` in place for D-005, D-006, Q-001, Q-007, Q-008, Q-012, R-003, R-006, and R-014.

## Key Decisions

- Q-008 should be reconciled as stale or closed because the v2 design fixes the product spelling as `make-docs`, `Make Docs`, and `MakeDocs`, and explicitly rejects broad rename or compatibility-alias work.
- Q-001, Q-007, and Q-012 remain open unless a later accepted design resolves skills delivery, remote-source integrity, or plugin/skill install sharing.
- D-005, D-006, R-003, R-006, and R-014 stay active unless the implementation pass proves the related package, README, audit, backup/uninstall, or no-scripts migration risk has been closed.
- Baseline text remains visible; this is active-set evolution, not cleanup rewrite.

## Acceptance Criteria

- The new PRD change doc records the package identity, command boundary, TypeScript npm ownership, Rust standalone ownership, no-alias decision, MCP startup ownership direction, and shared manifest/metadata contracts.
- The index links the new change doc and does not renumber existing docs.
- Each affected baseline doc has the right note verb and target link.
- The risk register changes existing D/Q/R entries directly and does not add duplicate items for the same package-boundary concerns.
- The PRD pass explicitly records that real publishing, registry reservation, Homebrew tap creation, and Crates publication are out of scope without separate user authorization.

## Dependencies

- [00-overview.md](00-overview.md)
- [2026-06-19-package-and-deployment-boundaries.md](../../designs/2026-06-19-package-and-deployment-boundaries.md)
- `docs/assets/references/prd-change-management.md`
- `docs/prd/00-index.md`
- `docs/prd/03-open-questions-and-risk-register.md`
