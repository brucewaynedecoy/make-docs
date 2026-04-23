---
title: Building and Installing the CLI Locally
path: cli/development
status: draft
order: 10
tags:
  - build
  - testing
  - smoke-pack
applies-to:
  - cli
related:
  - ./maintainer-docs-assets-and-runtime-state-boundaries.md
  - ./maintainer-dogfood-and-maintainer-operations.md
  - ./release-packaging-validation-and-release-reference.md
---

# Building and Installing the CLI Locally

## Overview

This guide is the local development entry point for the `make-docs` CLI. It is intentionally narrow: build the CLI, run the test and router-validation paths that matter during development, and exercise local install flows through built or packed artifacts.

For maintainer-specific dogfood work, use [Dogfood and Maintainer Operations](./maintainer-dogfood-and-maintainer-operations.md). For packaging and release procedure, use [Packaging, Validation, and Release Reference](./release-packaging-validation-and-release-reference.md). For path-boundary questions around `docs/assets/**` versus `.make-docs/**`, use [Docs Assets and Runtime State Boundaries](./maintainer-docs-assets-and-runtime-state-boundaries.md).

## Prerequisites

| Requirement | Notes |
| --- | --- |
| Node.js `>=18` | Required for workspace install, build, and tests. |
| npm | Used for workspace scripts and local pack/install checks. |
| repo-root install | Run `npm install` once from the repo root. |

## Local Build Paths

Use the repo root unless a command explicitly says otherwise.

```bash
npm install
npm run build -w make-docs
```

For fast iteration against source without rebuilding every change:

```bash
npm run dev -w make-docs -- --target "$(mktemp -d)"
```

For built-artifact checks, prefer:

```bash
npm run build -w make-docs
node packages/cli/dist/index.js --help
```

## Core Validation Commands

Run the smallest command set that matches the change:

| If you changed | Run |
| --- | --- |
| TypeScript logic, planner, installer, wizard, profile rules | `npm test -w make-docs` |
| template-owned defaults or profile-aware generated assets | `npm run validate:defaults -w make-docs` |
| instruction routers or copied router content | `bash scripts/check-instruction-routers.sh` |
| packaged install behavior or tarball-sensitive flow | `node scripts/smoke-pack.mjs` |

These commands are the local development baseline for L12:

```bash
npm test -w make-docs
npm run validate:defaults -w make-docs
bash scripts/check-instruction-routers.sh
node scripts/smoke-pack.mjs
```

## Local Install Entry Paths

Use one of these depending on what you need to prove.

### Built CLI from `dist/`

Best for normal local behavior checks:

```bash
npm run build -w make-docs
TEST_DIR="$(mktemp -d)"
node packages/cli/dist/index.js --dry-run --target "$TEST_DIR"
node packages/cli/dist/index.js --target "$TEST_DIR"
```

### `npm link`

Best when you want a shell-level `make-docs` command backed by your local build:

```bash
cd packages/cli
npm run build
npm link
make-docs --help
```

Remove the global link when finished:

```bash
npm unlink -g make-docs
```

### Packed tarball

Best when you need the publish-shaped artifact:

```bash
cd packages/cli
npm run prepack
npm pack
```

Then test one real packaged invocation:

```bash
TARBALL="$(ls make-docs-*.tgz | tail -n 1)"
TEST_DIR="$(mktemp -d)"
npm exec --yes --package "./$TARBALL" -- make-docs --target "$TEST_DIR"
```

## When To Leave This Guide

- If you are re-seeding repo-root `docs/` from `packages/docs/template/`, move to [Dogfood and Maintainer Operations](./maintainer-dogfood-and-maintainer-operations.md).
- If you are deciding whether a file belongs in `docs/assets/**` or `.make-docs/**`, move to [Docs Assets and Runtime State Boundaries](./maintainer-docs-assets-and-runtime-state-boundaries.md).
- If you are validating tarball contents, smoke-pack expectations, release checks, or publish procedure, move to [Packaging, Validation, and Release Reference](./release-packaging-validation-and-release-reference.md).

## Related Resources

- [Docs Assets and Runtime State Boundaries](./maintainer-docs-assets-and-runtime-state-boundaries.md)
- [Dogfood and Maintainer Operations](./maintainer-dogfood-and-maintainer-operations.md)
- [Packaging, Validation, and Release Reference](./release-packaging-validation-and-release-reference.md)
