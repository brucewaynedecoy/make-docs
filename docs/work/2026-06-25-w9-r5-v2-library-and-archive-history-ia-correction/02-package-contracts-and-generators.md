# Phase 2: Package Contracts and Generators

## Purpose

Update generated and shipped package behavior so installs, syncs, tests, and helper skills use W9 R5 paths.

## Overview

This phase replaces W9 R4 guide/breadcrumb package surfaces with library/archive-history behavior across templates, CLI cataloging, compatibility fallback, smoke-pack, tests, and closeout helpers.

## Source PRD Docs

- [19 Revise Template Package Dogfood Source of Truth Contract](../../prd/19-revise-template-package-dogfood-source-of-truth-contract.md)
- [22 Revise New Docs Assets Playbooks Persona Model](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md)
- [10 Packaging Validation and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)

## Stage 1 - Template and Catalog Paths

### Tasks

- [x] t1: Replace shipped `docs/assets/guides/{AGENTS,CLAUDE}.md` routers with `docs/assets/library/{AGENTS,CLAUDE}.md`.
- [x] t2: Remove shipped `docs/assets/breadcrumbs/{AGENTS,CLAUDE}.md` routers from default install/package paths.
- [x] t3: Update `packages/cli/src/catalog.ts` and `packages/cli/src/compatibility.ts` to use library and archive-history fallback behavior.
- [x] t4: Refresh generated `packages/cli/template/**` from `packages/docs/template/**`.

### Acceptance criteria

- Fresh installs include library routers and omit guide, breadcrumb, and history routers.
- `docs/assets/archive/history/**` is on-demand and not pre-created for blank installs.

### Dependencies

- Phase 1 complete.

### Evidence

- Updated `packages/docs/template/docs/assets/library/**`, `packages/docs/template/docs/assets/archive/**`, root docs routers, `.make-docs/**` contracts/prompts/templates, `packages/cli/src/catalog.ts`, and `packages/cli/src/compatibility.ts`.
- Regenerated `packages/cli/template/**` with `node scripts/copy-template-to-cli.mjs`.

## Stage 2 - Tests, Smoke, and Skills

### Tasks

- [x] t5: Update install, consistency, uninstall, and tool-directory tests for W9 R5 paths.
- [x] t6: Update smoke-pack custom preservation and assertions for library and archive-history.
- [x] t7: Update closeout, archive, and work-scope skill helpers to write/read `docs/assets/archive/history/**` and discover guides under `docs/assets/library/**`.

### Acceptance criteria

- Tests assert absence of old shipped path families.
- History closeout helpers create archive/history on demand.

### Dependencies

- Stage 1 complete.

### Evidence

- Updated package tests, smoke-pack assertions, closeout/archive skill scripts, and work-scope guards for library/archive-history paths.
