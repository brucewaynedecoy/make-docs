---
title: Building and Installing the CLI Locally
path: cli/development
status: draft
order: 10
tags:
  - build
  - testing
  - npm-link
applies-to:
  - cli
---

# Building and Installing the CLI Locally

## Overview

This guide walks developers and contributors through building, running, and testing the `starter-docs` CLI from source. It covers day-to-day development workflows, local installation methods, and the smoke-test pipeline. If you are a consumer of the published npm package rather than a contributor, this guide is not for you.

## Prerequisites

| Requirement | Notes |
|---|---|
| **Node.js >= 18** | Required. Check with `node --version`. |
| **npm** | Ships with Node.js. Check with `npm --version`. |
| **just** | Optional convenience runner. Install via `brew install just` (macOS) or see [just docs](https://github.com/casey/just#installation). All `just` recipes have direct npm equivalents listed below. |

## Cloning and Setup

Clone the repository and install all workspace dependencies from the repo root:

```sh
git clone <repo-url> starter-docs
cd starter-docs
npm install
```

`npm install` at the root handles every workspace (`packages/cli`, `packages/docs`, etc.) automatically -- no per-package install step is needed.

## Building the CLI

Compile TypeScript to JavaScript using [tsup](https://tsup.egoist.dev/):

```sh
# npm
npm run build

# just
just build
```

Both commands delegate to `npm run build -w starter-docs`, which runs `tsup` inside `packages/cli/`. The compiled output lands in `packages/cli/dist/`.

## Running in Development Mode

For rapid iteration you can skip the build entirely. The `dev` script uses [tsx](https://tsx.is/) to execute TypeScript source directly:

```sh
# npm
npm run dev

# just
just dev
```

Both delegate to `npm run dev -w starter-docs`, which runs `tsx src/index.ts` inside `packages/cli/`.

During development the CLI resolves the documentation template from the sibling workspace at `packages/docs/template/` (see `resolveTemplateRoot()` in [`packages/cli/src/utils.ts`](../../packages/cli/src/utils.ts)). No copy step is required -- edits to template files are picked up immediately.

To pass flags to the CLI in dev mode, append them after `--`:

```sh
npm run dev -- --dry-run --yes --target /tmp/dev-test
```

## Running Tests

### Unit and integration tests

```sh
# npm
npm test

# just
just test
```

Both delegate to `vitest run` inside `packages/cli/`.

### Default-value consistency checks

Validates that hardcoded defaults stay in sync with the template:

```sh
# npm
npm run validate:defaults

# just
just validate-defaults
```

### Instruction-router validation

Checks that every directory's routing instructions are intact:

```sh
just check-instruction-routers
```

(No npm equivalent -- this runs `bash scripts/check-instruction-routers.sh` directly.)

## Testing a Packed Install (Smoke Test)

The smoke test exercises the full publish pipeline without actually publishing:

```sh
# npm
npm run smoke:pack

# just
just smoke-pack
```

What happens behind the scenes (implemented in [`scripts/smoke-pack.mjs`](../../scripts/smoke-pack.mjs)):

1. Runs `npm run prepack` in the CLI package, which copies `packages/docs/template/` into `packages/cli/template/` and then builds with tsup.
2. Runs `npm pack --json` to produce a tarball.
3. Unpacks the tarball into a temporary directory.
4. Executes `node dist/index.js --yes --target <temp-dir>` from the unpacked package.
5. Asserts that `docs/.starter-docs/manifest.json` and `docs/AGENTS.md` exist in the target.
6. Cleans up all temporary directories.

If any step fails the script exits non-zero with a diagnostic message.

## Installing Locally via npm link

`npm link` creates a global symlink so you can invoke `starter-docs` from any directory, pointing at your local build:

```sh
cd packages/cli
npm run build
npm link
```

Verify the link:

```sh
starter-docs --help
```

You should see the CLI help output. Any subsequent `npm run build` updates the linked binary in place.

To remove the global link when you are done:

```sh
npm unlink -g starter-docs
```

## Installing Locally via npm pack

If you want to test the exact artifact that `npm publish` would upload -- including the `prepack` copy step -- use `npm pack`:

```sh
cd packages/cli
npm run prepack
npm pack
```

This produces a tarball such as `starter-docs-0.1.0.tgz`. Install it globally:

```sh
npm install -g ./starter-docs-0.1.0.tgz
```

Test the installed CLI:

```sh
starter-docs --dry-run --yes --target /tmp/test-install
```

To uninstall:

```sh
npm uninstall -g starter-docs
```

## Common Development Workflows

| Task | Commands |
|---|---|
| Edit a template file and test | Edit file under `packages/docs/template/`, then `npm run dev -- --dry-run --yes --target /tmp/tpl-test` |
| Edit CLI source and test | Edit file under `packages/cli/src/`, then `npm run dev -- --yes --target /tmp/cli-test` |
| Run the full test suite | `npm test` |
| Validate defaults after changing a template | `npm run validate:defaults` |
| Full pre-publish check | `npm test && npm run validate:defaults && npm run smoke:pack` |
| Test as a globally installed package | `cd packages/cli && npm run build && npm link`, then run `starter-docs` from another directory |

## Troubleshooting

### Template not found

**Symptom:** The CLI errors with a message about a missing template directory.

**Cause:** In development mode the CLI expects the template at `packages/docs/template/` relative to the CLI package root. If you are running from an unusual working directory or have moved packages, the path will not resolve.

**Fix:** Make sure you are running commands from the repository root (or using the npm/just scripts, which handle paths for you). Confirm that `packages/docs/template/` exists and is not empty.

### Stale build output

**Symptom:** Code changes are not reflected when running `node packages/cli/dist/index.js` or the globally linked `starter-docs` command.

**Cause:** The `dist/` directory contains a previous build. Unlike `npm run dev`, the compiled entry point does not pick up source changes automatically.

**Fix:** Rebuild with `npm run build` (or `just build`). If you used `npm link`, the symlink points at `dist/index.js` so the rebuild is sufficient -- no re-link needed.

### Permission errors with npm link or global install

**Symptom:** `EACCES` or similar permission errors when running `npm link` or `npm install -g`.

**Fix:** Avoid using `sudo`. Instead, configure npm to use a user-owned prefix:

```sh
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
```

Then add `~/.npm-global/bin` to your `PATH` in your shell profile (e.g., `~/.zshrc` or `~/.bashrc`):

```sh
export PATH="$HOME/.npm-global/bin:$PATH"
```

Restart your shell and retry.

### Smoke test fails during prepack

**Symptom:** `npm run smoke:pack` fails at the prepack step.

**Cause:** The copy-template script ([`scripts/copy-template-to-cli.mjs`](../../scripts/copy-template-to-cli.mjs)) could not copy `packages/docs/template/` into `packages/cli/template/`, or tsup failed to compile.

**Fix:** Run the steps manually to isolate the failure:

```sh
node scripts/copy-template-to-cli.mjs
npm run build -w starter-docs
```

Check for TypeScript errors in the build output and verify that `packages/docs/template/` is populated.
