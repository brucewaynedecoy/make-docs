---
title: Packaging, Validation, and Release Reference
path: release
status: draft
order: 40
tags:
  - release
  - packaging
  - validation
applies-to:
  - cli
  - template
related:
  - ./cli-development-local-build-and-install.md
  - ./maintainer-docs-assets-and-runtime-state-boundaries.md
  - ./maintainer-dogfood-and-maintainer-operations.md
  - ../../prd/10-packaging-validation-and-release-reference.md
---

# Packaging, Validation, and Release Reference

## Overview

This guide is the maintainer reference for package shape, validation expectations, smoke-pack context, and release procedure. It assumes local development is already working and focuses on the publish-shaped artifact and the checks that protect it.

Use [Building and Installing the CLI Locally](./cli-development-local-build-and-install.md) for day-to-day build and entry-point work. Use [Dogfood and Maintainer Operations](./maintainer-dogfood-and-maintainer-operations.md) for template re-seeding and repo-root dogfood upkeep.

## Packaging Surface

The publishable package is the CLI workspace in `packages/cli/`. The template workspace is source-of-truth input to that package, not a separately published npm artifact.

| Surface | Current role |
| --- | --- |
| `packages/cli/` | published npm package |
| `packages/docs/template/` | source-of-truth template tree during development |
| `packages/cli/template/` | bundled template copy produced during `prepack` |
| repo-root `docs/` | dogfood validation surface, not packaged output |

The important distinction is development mode versus packed mode:

- local development resolves the sibling template in `packages/docs/template/`
- `prepack` copies that template into `packages/cli/template/`
- packed and published installs consume the bundled copy

## Validation Expectations

Run the validation set that matches the change, then escalate to the full chain for release work.

| Command | What it proves |
| --- | --- |
| `npm test -w make-docs` | CLI behavior, planner/install flows, skills behavior, and integration coverage |
| `npm run validate:defaults -w make-docs` | profile-aware generated assets still match the checked-in default surface |
| `bash scripts/check-instruction-routers.sh` | router pairs, byte identity, and line-budget rules still hold |
| `node scripts/smoke-pack.mjs` | prepack bundling, tarball install, manifest creation, skills, backup, and uninstall still work together |

A release-sensitive run should normally include all four.

## Smoke-Pack Context

`node scripts/smoke-pack.mjs` is not just a tarball existence check. It is the main packaged-end-to-end proof that:

- `prepack` copied the template into `packages/cli/template/`
- the tarball exposes the expected `make-docs` binary
- packaged installation creates `docs/AGENTS.md` and `.make-docs/manifest.json`
- default shipped skills are installed and legacy skill artifacts are absent
- backup and uninstall preserve unmanaged files while removing managed runtime state

That makes smoke-pack the bridge between local development, bundled template correctness, and release confidence.

## Broken-Link Validation Note

Validation behavior includes a maintainer-only rule that avoids treating fenced code examples and similar snippets as real broken-doc links. This belongs here as release and validation context, not as its own standalone guide.

When link validation changes or appears to regress:

- treat code-snippet false-positive filtering as part of the validation contract
- verify the broader release validation path, not just individual docs edits
- keep this behavior documented here instead of splitting it into a separate guide

## Release Procedure

Use this order for release work:

1. Run `npm test -w make-docs`.
2. Run `npm run validate:defaults -w make-docs`.
3. Run `bash scripts/check-instruction-routers.sh` when router or docs-resource changes are involved.
4. Run `node scripts/smoke-pack.mjs`.
5. Inspect a tarball with `npm pack --json -w make-docs` or run a packaged invocation from the tarball when packaging inputs changed.
6. Publish from `packages/cli/`, not from `packages/docs` or `packages/skills`.

If the issue is still at the local build stage, step back to [Building and Installing the CLI Locally](./cli-development-local-build-and-install.md). If the issue is stale dogfood docs or template propagation, step back to [Dogfood and Maintainer Operations](./maintainer-dogfood-and-maintainer-operations.md).

## Related Resources

- [Building and Installing the CLI Locally](./cli-development-local-build-and-install.md)
- [Docs Assets and Runtime State Boundaries](./maintainer-docs-assets-and-runtime-state-boundaries.md)
- [Dogfood and Maintainer Operations](./maintainer-dogfood-and-maintainer-operations.md)
- [10 Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
