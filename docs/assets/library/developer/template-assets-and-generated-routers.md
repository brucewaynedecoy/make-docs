---
title: Template Assets and Generated Routers
path: template/assets
status: draft
order: 20
tags:
  - template
  - assets
  - routers
  - renderers
applies-to:
  - docs
  - template
  - cli
related:
  - ./template-contracts-guide-authoring.md
  - ../../../prd/06-template-contracts-and-generated-assets.md
  - ../../../prd/02-architecture-overview.md
  - ../../../../.make-docs/system/contracts/guide-contract.md
---

# Template Assets and Generated Routers

> See `docs/prd/06-template-contracts-and-generated-assets.md` for subsystem context and `packages/docs/README.md` for package ownership and re-seed rules.

## Overview

This guide explains the current maintainer boundary between:

- template-owned files in `packages/docs/template/`
- rule-selected managed assets in installed `docs/**` and `.make-docs/**`
- generated router files and reduced-profile fallbacks rendered by the CLI

The important current-state rule is that the installed docs surface is not a blind copy of the template tree. `packages/cli/src/rules.ts`, `packages/cli/src/catalog.ts`, and `packages/cli/src/renderers.ts` select a profile-valid subset, then render only the narrow set of paths that must change with profile shape.

## Source of Truth

Template ownership starts in `packages/docs/template/`.

- `packages/docs/template/.make-docs/system/contracts/*.md` and `packages/docs/template/.make-docs/system/references/*.md` hold authoritative workflow and contract files
- `packages/docs/template/.make-docs/system/templates/*.md` holds structural starters
- `packages/docs/template/.make-docs/scripts/**` holds selected helper scripts when shipped
- `packages/docs/template/docs/assets/{archive,artifacts,library,playbooks}/` holds the managed project-asset namespace routers
- `packages/docs/template/AGENTS.md` and the per-directory router files define authoring routes inside the shipped tree

`packages/docs/README.md` is explicit about ownership:

- edit the template package first
- the repo-root `docs/` tree is only a dogfood copy
- re-seeding copies template-owned routers, system contracts, references, prompt starters, templates, and selected helper scripts back into the repo-root dogfood copy
- generated designs, plans, PRDs, work backlogs, local guide bodies, local playbooks, archive history records, artifact review content, overlays, and project config are not template-owned re-seed targets unless a later accepted plan deliberately promotes a file into starter content

## Asset Selection Boundaries

The install profile decides which document-resource assets exist at all.

`packages/cli/src/profile.ts` and `packages/cli/src/rules.ts` define the active boundaries:

- `prd` depends on `plans`
- `work` depends on `plans` and `prd`
- guide templates and guide-contract references are always installable
- plan, PRD, and work templates appear only when their capabilities are effectively selected
- prompt starters appear only when prompts are enabled and their required capabilities are present
- `referencesMode: all` currently adds matching `.make-docs/system/references/**` assets; it does not create a second reference-selection system beyond that

`packages/cli/src/catalog.ts` then turns those selected paths plus active instruction-router files into one `ResolvedAsset[]` set for planning and apply.

## Generated Router Boundaries

Only a narrow set of files is treated as buildable in `packages/cli/src/renderers.ts`.

Current buildable families are:

- root instructions: `AGENTS.md`, `CLAUDE.md`
- `docs/` router instructions
- `docs/assets/`, `docs/assets/archive/`, `docs/assets/artifacts/`, `docs/assets/library/`, and `docs/assets/playbooks/` router instructions
- the design fallback trio:
  - `.make-docs/system/references/design-workflow.md`
  - `.make-docs/system/contracts/design-contract.md`
  - `.make-docs/system/templates/design.md`

Everything else in the selected asset set is copied from the template package as a static file.

That boundary matters because buildable files are rendered for profile correctness, while most contracts and templates are preserved verbatim from template source.

## Reduced-Profile Behavior

Reduced profiles do not leave dangling router advice behind.

Current renderer behavior includes:

- `renderDocsRouter()` only mentions capability directories that are actually installed
- `renderTemplatesRouter()` only advertises template families that the current profile can use
- `renderPromptsRouter()` suppresses generated-output claims when prompts are absent
- `renderAssetsRouter()` keeps `docs/assets/` document-only and explicitly rejects runtime-state locations such as `docs/assets/config/` and `docs/assets/manifest.json`
- the design workflow, contract, and template renderers fall back to reduced-profile text when planning assets or prompts are unavailable

The renderer does not broadly rewrite the template package. It only handles those known buildable paths.

## What Stays Out of `docs/assets/`

Current renderer and PRD boundaries keep runtime state out of the document-resource namespace.

Reader-facing document resources live under `docs/assets/library/**`, `docs/assets/playbooks/**`, `docs/assets/artifacts/**`, and `docs/assets/archive/**`. History and breadcrumb records are created on demand under `docs/assets/archive/history/**`.
Tool-resource bootstrap files live under `.make-docs/**`, including `.make-docs/system/prompts/**`, `.make-docs/system/contracts/**`, and `.make-docs/system/templates/**`.
Runtime state lives under `.make-docs/**`, especially:

- `.make-docs/manifest.json`
- `.make-docs/conflicts/<run-id>/`

Do not author or introduce hidden runtime state under:

- `docs/assets/config/`
- `docs/assets/state/`
- `docs/assets/manifest.json`
- `docs/assets/conflicts/`

## Maintainer Change Checklist

When you add or change a template-owned asset, update the full current pipeline:

1. Edit the source file in `packages/docs/template/`.
2. Update `packages/cli/src/rules.ts` if asset selection changes.
3. Update `packages/cli/src/catalog.ts` if router expansion or asset assembly changes.
4. Update `packages/cli/src/renderers.ts` only if the file must be buildable or needs reduced-profile rendering.
5. Update the relevant tests in `packages/cli/tests/consistency.test.ts` or `packages/cli/tests/renderers.test.ts`.
6. Re-seed the dogfood copies in repo-root `docs/` for template-owned files only.

If the file does not need profile-aware output, prefer keeping it static. The current implementation is intentionally conservative about what becomes buildable.

## Validation Expectations

Two tests lock in the current contract boundary:

- `packages/cli/tests/consistency.test.ts` proves every template file is covered by the asset pipeline and that default-profile buildable output matches the checked-in template source
- `packages/cli/tests/renderers.test.ts` proves reduced-profile routers and design fallback rendering do not advertise missing capabilities

Those tests are the practical guardrails against drift between template source, selected assets, and generated output.

## Related Resources

- [Guide Contracts and Authoring for make-docs](./template-contracts-guide-authoring.md)
- [06 Template Contracts and Generated Assets](../../../prd/06-template-contracts-and-generated-assets.md)
- [02 Architecture Overview](../../../prd/02-architecture-overview.md)
- [Guide Contract](../../../../.make-docs/system/contracts/guide-contract.md)
