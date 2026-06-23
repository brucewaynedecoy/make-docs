# Phase 01: Requirements and Scope Gate

## Purpose

Confirm that the accepted package/deployment requirements are present and that implementation stays inside the W10 R1 scope before source or package docs are edited.

## Overview

This phase is a gate, not a PRD-authoring phase. PRD 16 and the baseline annotations already capture the changed requirements. The implementation pass should verify that state, inspect the live TypeScript package/CLI surfaces, and record the blocked actions that remain out of scope.

## Source PRD Docs

- [../../prd/16-revise-package-and-deployment-boundaries.md](../../prd/16-revise-package-and-deployment-boundaries.md)
- [../../prd/00-index.md](../../prd/00-index.md)
- [../../prd/01-product-overview.md](../../prd/01-product-overview.md)
- [../../prd/02-architecture-overview.md](../../prd/02-architecture-overview.md)
- [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md)
- [../../prd/05-installation-profile-and-manifest-lifecycle.md](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [../../prd/07-cli-command-surface-and-lifecycle.md](../../prd/07-cli-command-surface-and-lifecycle.md)
- [../../prd/08-skills-catalog-and-distribution.md](../../prd/08-skills-catalog-and-distribution.md)
- [../../prd/10-packaging-validation-and-release-reference.md](../../prd/10-packaging-validation-and-release-reference.md)
- [../../prd/12-revise-cli-skill-selection-simplification.md](../../prd/12-revise-cli-skill-selection-simplification.md)

## Stage 1 - Active Requirement Gate

### Tasks

- [ ] t1: Verify [../../prd/16-revise-package-and-deployment-boundaries.md](../../prd/16-revise-package-and-deployment-boundaries.md) exists and still records stable `make-docs`, `Make Docs`, and `MakeDocs` identity.
- [ ] t2: Verify [../../prd/00-index.md](../../prd/00-index.md) lists PRD 16 as Current without renumbering existing PRDs.
- [ ] t3: Verify the seven affected baseline PRDs still contain backlinks to PRD 16.
- [ ] t4: Verify [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md) keeps Q-008 Closed and keeps Q-001, Q-007, and Q-012 Open.
- [ ] t5: Confirm no implementation task requires real publish, registry reservation, Homebrew tap, Crates publish, git tag, or release promotion.

### Acceptance criteria

- PRD 16, the PRD index, and baseline backlinks are present before implementation begins.
- Q-008 remains closed against PRD 16.
- Q-001, Q-007, and Q-012 remain open unless a newer accepted design exists.
- Out-of-scope irreversible release actions are explicitly blocked for the implementation pass.

### Dependencies

- [../../plans/2026-06-23-w10-r1-package-and-deployment-boundaries/00-overview.md](../../plans/2026-06-23-w10-r1-package-and-deployment-boundaries/00-overview.md)
- [../../designs/2026-06-19-package-and-deployment-boundaries.md](../../designs/2026-06-19-package-and-deployment-boundaries.md)
- `docs/assets/references/execution-workflow.md`
- `docs/assets/references/prd-change-management.md`

## Stage 2 - Live Surface Inventory

### Tasks

- [ ] t6: Inspect `packages/cli/package.json` for package name, `bin.make-docs`, `files`, release metadata, and npm workspace ownership.
- [ ] t7: Inspect `packages/cli/src/cli.ts` for the public command model, removed-command rejection, help/version behavior, and alias absence.
- [ ] t8: Inspect `packages/cli/src/manifest.ts`, `packages/cli/src/audit.ts`, `packages/cli/src/backup.ts`, and `packages/cli/src/uninstall.ts` for manifest, audit, backup, and uninstall contracts that future Rust work must preserve.
- [ ] t9: Inspect `scripts/smoke-pack.mjs` and existing package tests to identify the minimum validation stack for later phases.

### Acceptance criteria

- The implementation pass has a current list of touched surfaces before edits.
- Stale source paths are not carried forward into implementation notes or docs.
- Package, command, manifest, audit, backup, uninstall, and smoke-pack surfaces are accounted for.

### Dependencies

- `packages/cli/package.json`
- `packages/cli/src/cli.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/uninstall.ts`
- `scripts/smoke-pack.mjs`
