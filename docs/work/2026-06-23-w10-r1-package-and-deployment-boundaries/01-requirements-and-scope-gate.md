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

- [x] t1: Verify [../../prd/16-revise-package-and-deployment-boundaries.md](../../prd/16-revise-package-and-deployment-boundaries.md) exists and still records stable `make-docs`, `Make Docs`, and `MakeDocs` identity.
- [x] t2: Verify [../../prd/00-index.md](../../prd/00-index.md) lists PRD 16 as Current without renumbering existing PRDs.
- [x] t3: Verify the seven affected baseline PRDs still contain backlinks to PRD 16.
- [x] t4: Verify [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md) keeps Q-008 Closed and keeps Q-001, Q-007, and Q-012 Open.
- [x] t5: Confirm no implementation task requires real publish, registry reservation, Homebrew tap, Crates publish, git tag, or release promotion.

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

- [x] t6: Inspect `packages/cli/package.json` for package name, `bin.make-docs`, `files`, release metadata, and npm workspace ownership.
- [x] t7: Inspect `packages/cli/src/cli.ts` for the public command model, removed-command rejection, help/version behavior, and alias absence.
- [x] t8: Inspect `packages/cli/src/manifest.ts`, `packages/cli/src/audit.ts`, `packages/cli/src/backup.ts`, and `packages/cli/src/uninstall.ts` for manifest, audit, backup, and uninstall contracts that future Rust work must preserve.
- [x] t9: Inspect `scripts/smoke-pack.mjs` and existing package tests to identify the minimum validation stack for later phases.

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

## Implementation Notes

- PRD gate: [../../prd/16-revise-package-and-deployment-boundaries.md](../../prd/16-revise-package-and-deployment-boundaries.md) records `make-docs` as the CLI/package identifier, `Make Docs` as the display name, and `MakeDocs` as the compact identifier. [../../prd/00-index.md](../../prd/00-index.md) lists PRD 16 as Current, and the active PRD sequence remains unrenumbered.
- Baseline backlinks: the seven baseline/change surfaces named by this phase still link to PRD 16 through indexed Change Notes or effective-requirement references: [../../prd/01-product-overview.md](../../prd/01-product-overview.md), [../../prd/02-architecture-overview.md](../../prd/02-architecture-overview.md), [../../prd/05-installation-profile-and-manifest-lifecycle.md](../../prd/05-installation-profile-and-manifest-lifecycle.md), [../../prd/07-cli-command-surface-and-lifecycle.md](../../prd/07-cli-command-surface-and-lifecycle.md), [../../prd/08-skills-catalog-and-distribution.md](../../prd/08-skills-catalog-and-distribution.md), [../../prd/10-packaging-validation-and-release-reference.md](../../prd/10-packaging-validation-and-release-reference.md), and [../../prd/12-revise-cli-skill-selection-simplification.md](../../prd/12-revise-cli-skill-selection-simplification.md).
- Risk/register gate: [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md) keeps Q-008 Closed and keeps Q-001, Q-007, and Q-012 Open. D-006, R-003, R-006, and R-014 remain open pending later-phase evidence.
- Out-of-scope gate: no Phase 1-4 task requires real npm publish, registry reservation, Homebrew tap, Crates publish, git tag, or release promotion. The only release-adjacent package command required by this wave is dry-run validation.
- Live package surface: `packages/cli/package.json` is `@brucewaynedecoy/make-docs` `1.0.0-rc.1`, exposes only `bin.make-docs = dist/index.js`, ships `dist`, `template`, `skill-registry.json`, `skill-registry.schema.json`, and `README.md`, and publishes publicly from the CLI workspace while the root workspace remains private.
- Live command surface: `packages/cli/src/cli.ts` accepts the no-command install/sync path plus `reconfigure`, `skills`, `backup`, and `uninstall`; rejects removed `init`, `update`, `update --reconfigure`, and `--reconfigure`; and has no `makedocs`, `make-docs-js`, or `make-docs-rs` command alias in the parser or help output.
- Shared safety surfaces: `packages/cli/src/manifest.ts` owns `.make-docs/manifest.json` state and audit metadata; `packages/cli/src/audit.ts` classifies manifest-backed/fallback managed paths; `packages/cli/src/backup.ts` prepares and executes backup work from an audit report; and `packages/cli/src/uninstall.ts` loads one audit report, optionally backs it up, then removes audited files/directories.
- Validation stack for later phases: `scripts/smoke-pack.mjs` runs `npm run prepack`, packs the CLI with `--ignore-scripts`, verifies the packed package has only the `make-docs` bin, installs from the packed artifact, confirms bare packaged installs produce no skill files, confirms explicit `--selected-skills all` installs skills, verifies backup/uninstall behavior, and preserves unmanaged reader-facing files. Existing package tests to reuse include `packages/cli/tests/install.test.ts` and `packages/cli/tests/consistency.test.ts`.
- Build-process departure: UAT/manual testing is intentionally deferred until the full W10 R1 wave completes, per the user-directed workflow.
