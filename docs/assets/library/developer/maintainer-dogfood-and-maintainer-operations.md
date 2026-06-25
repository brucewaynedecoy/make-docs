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
  - ../../../prd/09-dogfood-and-maintainer-operations.md
---

# Dogfood and Maintainer Operations

## Overview

This guide covers the maintainer workflow around the repo's own dogfood docs. The repo-root `docs/` tree is an active dogfood instance of the template and contracts shipped by `make-docs`, while `packages/docs/template/` remains the source of truth for template-owned files.

Use this guide when you are changing template-owned routers, system resources, prompt starters, templates, or helper scripts; re-seeding those changes into repo-root `docs/`; or verifying the package-template-dogfood relationship before release.

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
- system contracts under `.make-docs/contracts/system/*.md`
- system references and prompt starters under `.make-docs/references/system/**`
- system templates under `.make-docs/templates/system/*.md`
- selected system helper scripts under `.make-docs/scripts/**`
- managed project-asset routers under `docs/assets/{archive,artifacts,library,playbooks}/`

Do not overwrite authored project docs such as:

- `docs/designs/`
- `docs/plans/`
- `docs/prd/`
- `docs/work/`
- `docs/assets/library/**` guide bodies unless the guide itself is the intended output of your task
- `docs/assets/playbooks/**` playbook bodies unless the playbook itself is the intended output of your task
- `docs/assets/archive/history/**` closeout records
- `docs/assets/artifacts/**` seed or review material
- local overlays and project config

## Standard Re-seed Workflow

1. Edit template-owned files in `packages/docs/template/`.
2. Re-seed only the changed template-owned files into repo-root `docs/`.
3. Diff the copied files so the dogfood update is deliberate.
4. Run the validation commands that match the change.

Never run a blind recursive copy from `packages/docs/template/docs/` into repo-root `docs/`. Dogfood reseeding is a reviewed propagation of known template-owned files, not a replacement of this repo's project-authored designs, plans, PRDs, work backlogs, guides, playbooks, artifacts, or history records.

Typical checks after a dogfood-sensitive change:

```bash
npm test -w packages/cli
npm run validate:defaults -w packages/cli
bash scripts/check-instruction-routers.sh
node scripts/smoke-pack.mjs
```

## Maintainer Workflow By Change Type

| Change type | Primary workflow |
| --- | --- |
| router or docs-resource wording | template edit -> selective re-seed -> router check |
| contract, reference, prompt, template, or system helper wording | template edit under `.make-docs/**` -> selective re-seed -> targeted diff and validation |
| generated asset or profile behavior | template or CLI edit -> `validate:defaults` -> smoke-pack |
| installer/runtime-state behavior | CLI edit -> tests -> smoke-pack -> boundary review |
| packaging-sensitive template changes | template edit -> re-seed -> `prepack` or smoke-pack validation |

For local build and entry-point commands, start with [Building and Installing the CLI Locally](./cli-development-local-build-and-install.md). For path-boundary disputes, use [Docs Assets and Runtime State Boundaries](./maintainer-docs-assets-and-runtime-state-boundaries.md). For release-facing checks, continue with [Packaging, Validation, and Release Reference](./release-packaging-validation-and-release-reference.md).

## Maintainer Rules

- Template first, dogfood second. Do not patch repo-root dogfood copies as if they were the source of truth for template-owned assets.
- Package copy third. Do not hand-edit `packages/cli/template/` as source; refresh it through `scripts/copy-template-to-cli.mjs`, package `prepack`, or smoke-pack validation after the template source is correct.
- Keep the runtime-state boundary intact. Dogfood docs live under `docs/`, system machinery lives under `.make-docs/{contracts,references,templates}/system/**` and `.make-docs/scripts/**`, and mutable installer state lives under `.make-docs/manifest.json` plus `.make-docs/conflicts/<run-id>/`.
- Do not treat direct repo-root dogfood moves as proof of packaged V2 migration behavior. User/project Markdown tree moves need packaged CLI/shared-core migration logic before they can satisfy V2 migration acceptance.
- Treat manual re-seeding as intentional review work, not an inconvenience to bypass. The manual step is how maintainers catch drift before release.
- Keep roadmap strategy separate from this guide. This document is about current maintainer operations, not future-direction planning.

## Related Resources

- [Building and Installing the CLI Locally](./cli-development-local-build-and-install.md)
- [Docs Assets and Runtime State Boundaries](./maintainer-docs-assets-and-runtime-state-boundaries.md)
- [Packaging, Validation, and Release Reference](./release-packaging-validation-and-release-reference.md)
- [09 Dogfood and Maintainer Operations](../../../prd/09-dogfood-and-maintainer-operations.md)
