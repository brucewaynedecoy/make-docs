---
title: Dogfood and Maintainer Operations
kind: guide
persona: maintainer
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
  - "cli-development-local-build-and-install.md"
  - "maintainer-docs-assets-and-runtime-state-boundaries.md"
  - "release-packaging-validation-and-release-reference.md"
  - "skills-catalog-and-distribution-model.md"
  - "../../prd/09-dogfood-and-maintainer-operations.md"
---

# Dogfood and Maintainer Operations

## Overview

This guide covers the maintainer workflow around the repo's own dogfood docs. The repo-root `docs/` and `.make-docs/system/` trees exercise the files shipped by `make-docs`. `packages/docs/template/` remains the source of truth for shipped files. Project-authored guides, plans and other project documents are edited in place.

Use this guide when you are changing template-owned routers, system resources, prompt starters, templates, or helper scripts; applying those changes through the installed CLI; or verifying the package-template-dogfood relationship before release.

## Template, Package, and Dogfood Relationship

There are three distinct layers:

| Layer | Role |
| --- | --- |
| `packages/docs/template/` | source of truth for shipped template-owned files |
| repo-root `docs/` and `.make-docs/system/` | installed routers and system resources alongside project-authored documents |
| `packages/cli/template/` | bundled copy produced during `prepack` for tarball and publish flows |

Local CLI development reads the sibling template first, so template edits are visible without pre-copying a bundled directory. Packaged validation flips to the bundled copy inside `packages/cli/template/`, which is why dogfood and smoke-pack both matter.

## What Re-seeding May Touch

Here, re-seeding means a reviewed update through the installed CLI. It does not mean copying files into the installed project by hand.

The CLI can update the selected managed routers, system contracts, references, prompts, templates and helper scripts. It creates the assets root and configured root routers only when needed. It does not create empty shared or Persona child directories.

Preserve project-authored material:

- designs, plans, PRDs and work backlogs under `docs/`
- audience guides under `docs/assets/<persona-slug>/`
- shared inputs and review material under `docs/assets/project/`
- history and retired material under `.make-docs/archive/`
- project config and local overlays

Change those documents in place only when they are the intended output of the task. A managed-file update does not grant ownership of project-authored material.

## Standard Re-seed Workflow

1. Edit shipped files in `packages/docs/template/` and change CLI code when needed.
2. Run the checks that match the change.
3. Run `just install-cli` to build and install the reviewed package.
4. Run `make-docs setup --target . --dry-run --yes` and review its exact changes.
5. Run `make-docs setup --target . --yes` after that review.
6. Repeat the dry run and inspect the installed files to confirm the intended result.

Use the public installed CLI for the dogfood update. Do not copy upstream bodies directly into the installed tree or use a `node dist` entry point for this step. If the preview reports a conflict, resolve it through the supported review flow before applying.

Typical checks include:

```bash
npm test -w packages/cli
npm run validate:defaults -w packages/cli
bash scripts/check-instruction-routers.sh
just smoke-pack
```

Installation, upgrade, migration and recovery state belong to the global Make Docs Store. The CLI must record required state before managed writes. A Store failure stops those writes; there is no project-local state fallback. Without the CLI, ordinary project documentation can still be authored, but Make Docs operation state cannot be recorded.

## Maintainer Workflow By Change Type

| Change type | Primary workflow |
| --- | --- |
| router or docs-resource wording | template edit -> checked package -> installed CLI preview/apply -> router check |
| contract, reference, prompt, template, or system helper wording | upstream template edit -> checked package -> installed CLI preview/apply -> targeted diff |
| generated asset or profile behavior | template or CLI edit -> `validate:defaults` -> smoke-pack |
| installer/runtime-state behavior | CLI edit -> tests -> smoke-pack -> boundary review |
| packaging-sensitive template changes | template edit -> package smoke -> installed CLI preview/apply |

For local build and entry-point commands, start with [Building and Installing the CLI Locally](cli-development-local-build-and-install.md). For path-boundary disputes, use [Docs Assets and Runtime State Boundaries](maintainer-docs-assets-and-runtime-state-boundaries.md). For release-facing checks, continue with [Packaging, Validation, and Release Reference](release-packaging-validation-and-release-reference.md).

## Maintainer Rules

- Template first, dogfood second. Do not patch repo-root dogfood copies as if they were the source of truth for template-owned assets.
- Build the package from the upstream source before updating dogfood. Do not hand-edit the bundled `packages/cli/template/` copy.
- Keep declarative identity and settings in `.make-docs/config.yaml`. The global Store owns the installation ledger and operation state. Local backup bytes may support rollback; they are not a second state authority.
- Keep current system resources under `.make-docs/system/`. Shared project material lives under `docs/assets/project/`, audience material under `docs/assets/<persona-slug>/`, and retained history under `.make-docs/archive/`.
- Use the public layout preview, preparation and application or manual-verification flow for reviewed project layout changes. A prepared manual path must record its plan in the Store before moving files and verify the recorded bytes and links before completion.
- Review both the planned file changes and the resulting installed files. A successful source test alone does not prove the dogfood update.
- Keep roadmap strategy separate from this guide. This document is about current maintainer operations, not future-direction planning.

## Related Resources

- [Building and Installing the CLI Locally](cli-development-local-build-and-install.md)
- [Docs Assets and Runtime State Boundaries](maintainer-docs-assets-and-runtime-state-boundaries.md)
- [Packaging, Validation, and Release Reference](release-packaging-validation-and-release-reference.md)
- [09 Dogfood and Maintainer Operations](../../prd/09-dogfood-and-maintainer-operations.md)
