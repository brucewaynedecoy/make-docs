# Phase 02: Template and Contract System

## Purpose

This phase rebuilds the source-of-truth template tree, the profile-driven asset selection rules, and the generated document contract surfaces that the installer manages. The authoritative implementation lives in `packages/docs/template/**`, `packages/cli/src/rules.ts:8-194`, `packages/cli/src/catalog.ts:7-85`, and `packages/cli/src/renderers.ts:40-570`.

## Overview

The template subsystem is not just a bag of Markdown files. `packages/docs/template/` owns the shipped contract assets, `packages/cli/src/catalog.ts:64-85` decides which assets belong to a profile, and `packages/cli/src/renderers.ts:40-570` selectively renders routers and design fallbacks instead of copying everything verbatim. This phase therefore depends on the state and plan/apply guarantees established in Phase 01.

## Source PRD Docs

- [../../prd/01-product-overview.md](../../../../prd/01-product-overview.md)
- [../../prd/02-architecture-overview.md](../../../../prd/02-architecture-overview.md)
- [../../prd/06-template-contracts-and-generated-assets.md](../../../../prd/06-template-contracts-and-generated-assets.md)
- [../../prd/05-installation-profile-and-manifest-lifecycle.md](../../../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [../../prd/03-open-questions-and-risk-register.md](../../../../prd/03-open-questions-and-risk-register.md)
- [../../prd/04-glossary.md](../../../../prd/04-glossary.md)

## Stage 1 - Template Source and Contract Surface

### Tasks

- Rebuild the template ownership boundary with `packages/docs/template/` as the source of truth and repo-root `docs/assets/**` as a dogfood copy, following `packages/docs/README.md:50-121` and `packages/cli/src/utils.ts:33-55`.
- Preserve the current required-path and section-contract surfaces from `docs/assets/references/output-contract.md` and the template files under `packages/docs/template/docs/assets/templates/*.md`.
- Keep mutable installer state outside the docs tree, preserving root `.make-docs/manifest.json` and `.make-docs/conflicts/` as defined in `packages/cli/src/manifest.ts:18-20`.

### Acceptance criteria

- Every template-owned router, reference, and template file still traces back to `packages/docs/template/**`.
- The docs asset tree remains document-only, with runtime state staying outside `docs/`.
- Fixed PRD core and directory-based work backlog contracts remain explicit rather than implicit knowledge.

### Dependencies

- Phase 01, especially the state contracts in `packages/cli/src/types.ts:38-129`.

## Stage 2 - Profile-Driven Asset Selection and Rendering

### Tasks

- Rebuild capability-gated asset selection through `packages/cli/src/rules.ts:120-194` and `packages/cli/src/catalog.ts:23-85`.
- Preserve the `buildable` versus copied-file boundary from `packages/cli/src/catalog.ts:7-20` and `packages/cli/src/renderers.ts:40-96`.
- Rebuild router and design-fallback rendering in `packages/cli/src/renderers.ts:99-570`, including reduced-profile behavior for missing prompt, template, or reference families.

### Acceptance criteria

- The default full profile still matches the checked-in template surface, as currently proven by `packages/cli/tests/consistency.test.ts:33-77`.
- Reduced profiles omit invalid routers and avoid dangling guidance links, matching `packages/cli/tests/renderers.test.ts:17-73`.
- `ResolvedAsset.sourceId` and hashing remain stable so Phase 01 plan/apply semantics still work without special cases.

### Dependencies

- Stage 1 - Template Source and Contract Surface.
- Phase 01, especially plan/apply semantics from `packages/cli/src/planner.ts:19-189`.

## Stage 3 - Contract Gap Closure and Path Deduplication

### Tasks

- Decide and implement the real contract for `templatesMode` and `referencesMode`, which are user-visible in `packages/cli/src/wizard.ts:761-889` but only partially enforced in `packages/cli/src/rules.ts:130-194`.
- Reconcile the stale `ResolvedAsset.assetClass` union between `packages/cli/src/types.ts:75-80` and `packages/cli/src/catalog.ts:7-20`.
- Either define or explicitly defer `packages/content` so the product no longer carries an implied future workspace with no selector, renderer, or packaging path.
- Reduce duplicated path knowledge across `packages/cli/src/rules.ts`, `packages/cli/src/catalog.ts`, `packages/cli/src/renderers.ts`, tests, and package docs.

### Acceptance criteria

- No stale public mode options or dead asset-class variants remain in the live contract.
- `packages/content` has an explicit status: implemented, intentionally deferred, or removed from current product language.
- Adding a new template-owned path requires one obvious update surface rather than scattered literal edits across multiple modules.

### Dependencies

- Stage 2 - Profile-Driven Asset Selection and Rendering.
- Decision inputs from [../../prd/03-open-questions-and-risk-register.md](../../../../prd/03-open-questions-and-risk-register.md).
