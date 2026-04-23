---
title: Dogfood and Maintainer Operations
path: maintainer
status: draft
order: 30
tags:
  - maintainer
  - dogfood
  - template
applies-to:
  - cli
  - template
related:
  - ../user/cli-lifecycle-managing-installations.md
  - ./cli-development-local-build-and-install.md
  - ./maintainer-docs-assets-and-runtime-state-boundaries.md
  - ./release-packaging-validation-and-release-reference.md
  - ./skills-catalog-and-distribution-model.md
  - ../../prd/09-dogfood-and-maintainer-operations.md
---

# Dogfood and Maintainer Operations

## Overview

This guide covers the maintainer workflow around the repo's own dogfood docs. The repo-root `docs/` tree is an active dogfood instance of the template and contracts shipped by `make-docs`, while `packages/docs/template/` remains the source of truth for template-owned files.

Use this guide when you are changing template-owned routers, references, or templates; re-seeding those changes into repo-root `docs/`; or verifying the package-template-dogfood relationship before release.

## Template, Package, and Dogfood Relationship

There are three distinct layers:

| Layer | Role |
| --- | --- |
| `packages/docs/template/` | source of truth for shipped template-owned files |
| repo-root `docs/` | dogfood copy used by this repo to exercise the shipped docs system |
| `packages/cli/template/` | bundled copy produced during `prepack` for tarball and publish flows |

Local CLI development reads the sibling template first, so template edits are visible without pre-copying a bundled directory. Packaged validation flips to the bundled copy inside `packages/cli/template/`, which is why dogfood and smoke-pack both matter.

## What Re-seeding May Touch

Re-seed only template-owned files from `packages/docs/template/` back into repo-root `docs/`:

- router files under `docs/`, `docs/assets/`, and capability directories
- `docs/assets/references/*.md`
- `docs/assets/templates/*.md`

Do not overwrite authored project docs such as:

- `docs/designs/`
- `docs/plans/`
- `docs/prd/`
- `docs/work/`
- developer or user guide bodies unless the guide itself is the intended output of your task

## Standard Re-seed Workflow

1. Edit template-owned files in `packages/docs/template/`.
2. Re-seed only the changed template-owned files into repo-root `docs/`.
3. Diff the copied files so the dogfood update is deliberate.
4. Run the validation commands that match the change.

Typical checks after a dogfood-sensitive change:

```bash
npm test -w make-docs
npm run validate:defaults -w make-docs
bash scripts/check-instruction-routers.sh
node scripts/smoke-pack.mjs
```

## Maintainer Workflow By Change Type

| Change type | Primary workflow |
| --- | --- |
| router or docs-resource wording | template edit -> selective re-seed -> router check |
| generated asset or profile behavior | template or CLI edit -> `validate:defaults` -> smoke-pack |
| installer/runtime-state behavior | CLI edit -> tests -> smoke-pack -> boundary review |
| packaging-sensitive template changes | template edit -> re-seed -> `prepack` or smoke-pack validation |

For local build and entry-point commands, start with [Building and Installing the CLI Locally](./cli-development-local-build-and-install.md). For path-boundary disputes, use [Docs Assets and Runtime State Boundaries](./maintainer-docs-assets-and-runtime-state-boundaries.md). For release-facing checks, continue with [Packaging, Validation, and Release Reference](./release-packaging-validation-and-release-reference.md).

## Maintainer Rules

- Template first, dogfood second. Do not patch repo-root dogfood copies as if they were the source of truth for template-owned assets.
- Keep the runtime-state boundary intact. Dogfood docs live under `docs/`; mutable installer state lives under `.make-docs/`.
- Treat manual re-seeding as intentional review work, not an inconvenience to bypass. The manual step is how maintainers catch drift before release.
- Keep roadmap strategy separate from this guide. This document is about current maintainer operations, not future-direction planning.

## Related Resources

- [Building and Installing the CLI Locally](./cli-development-local-build-and-install.md)
- [Docs Assets and Runtime State Boundaries](./maintainer-docs-assets-and-runtime-state-boundaries.md)
- [Packaging, Validation, and Release Reference](./release-packaging-validation-and-release-reference.md)
- [09 Dogfood and Maintainer Operations](../../prd/09-dogfood-and-maintainer-operations.md)
