---
title: Docs Assets and Runtime State Boundaries
path: maintainer
status: draft
order: 20
tags:
  - maintainer
  - docs-assets
  - runtime-state
applies-to:
  - cli
  - template
related:
  - ./cli-development-local-build-and-install.md
  - ./maintainer-dogfood-and-maintainer-operations.md
  - ./release-packaging-validation-and-release-reference.md
  - ../../prd/06-template-contracts-and-generated-assets.md
---

# Docs Assets and Runtime State Boundaries

## Overview

This guide explains the boundary maintainers need to preserve between shipped document resources and mutable installer state. The short version is stable: `docs/assets/**` is part of the docs system that ships to consumers, while `.make-docs/**` is runtime state created and updated by installer runs.

That split matters in three places:

- template authoring in `packages/docs/template/`
- repo-root dogfood maintenance in `docs/`
- installer and release validation in `packages/cli/`

## Current Boundary

| Area | What belongs there | Examples |
| --- | --- | --- |
| `docs/assets/**` | Shipped document resources and history records | `docs/assets/references/`, `docs/assets/templates/`, `docs/assets/prompts/`, `docs/assets/history/` |
| visible docs directories | Authored or managed documentation content | `docs/designs/`, `docs/plans/`, `docs/prd/`, `docs/work/`, `docs/guides/` |
| `.make-docs/**` | Mutable CLI runtime state | `.make-docs/manifest.json`, `.make-docs/conflicts/<run-id>/` |

`docs/assets/history/` is part of the shipped docs resource namespace. It is not installer state just because it records work history. The runtime state boundary begins at root `.make-docs/`, not inside `docs/`.

## Historical Mismatch You Must Preserve

Older W9 migration material and intermediate plans described a future where manifest or config state would live under documentation-owned paths such as `docs/assets/config/`. That is no longer current truth.

Current truth is:

- document resources and history live under `docs/assets/**`
- runtime manifest and conflict staging live under `.make-docs/**`
- maintainers should treat older `docs/.references`, `docs/.templates`, `docs/.assets`, and `docs/assets/config/*` references as historical lineage only

Do not rewrite guides to erase that mismatch. The mismatch is part of the maintainer story because it explains why some historical artifacts point at paths that the live CLI no longer writes.

## Source-of-Truth Rules

Follow these ownership rules when touching paths near the boundary:

1. Edit shipped resource contracts, templates, and routers in `packages/docs/template/` first.
2. Treat repo-root `docs/assets/**` as the dogfood copy of those template-owned resources.
3. Treat `.make-docs/**` as installer output owned by apply, sync, backup, and uninstall behavior.
4. Do not move manifest or conflict files into `docs/` to make the tree look tidier. That would collapse authored docs and mutable runtime state back into one namespace.

## Maintainer Checks

When a change touches these boundaries, verify the right layer:

| Change type | Minimum checks |
| --- | --- |
| template-owned resource path changes | `npm test`, `npm run validate:defaults`, `bash scripts/check-instruction-routers.sh` |
| installer state path changes | `npm test`, packaged install check, `node scripts/smoke-pack.mjs` |
| dogfood re-seed after template changes | manual copy into repo-root `docs/`, then router and smoke-pack validation |

If the failure involves local build or packaged entry paths, start with [Building and Installing the CLI Locally](./cli-development-local-build-and-install.md). If the failure involves dogfood re-seeding, template-to-package flow, or maintainer routines, continue with [Dogfood and Maintainer Operations](./maintainer-dogfood-and-maintainer-operations.md). If the failure is packaging or release-facing, use [Packaging, Validation, and Release Reference](./release-packaging-validation-and-release-reference.md).

## Practical Debugging Heuristics

- Missing or stale files under `docs/assets/**` usually mean template ownership or dogfood re-seed drift.
- Missing or stale `.make-docs/manifest.json` usually means installer behavior, not template content.
- Files staged under `.make-docs/conflicts/` are expected conflict output, not docs resources that should be copied back into the template.
- If a historical doc disagrees with the current path layout, prefer current README, `packages/docs/README.md`, and the live CLI code over migration intent.

## Related Resources

- [Building and Installing the CLI Locally](./cli-development-local-build-and-install.md)
- [Dogfood and Maintainer Operations](./maintainer-dogfood-and-maintainer-operations.md)
- [Packaging, Validation, and Release Reference](./release-packaging-validation-and-release-reference.md)
- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
