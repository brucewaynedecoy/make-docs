# Maintainer README

This file is for contributors working on the `starter-docs` package itself. The root [`README.md`](../README.md) is consumer-facing; this one is for local development, QA, packaging, and release work.

## Prerequisites

- Node.js `>=18`
- npm
- a normal terminal with TTY support for interactive wizard testing

Install dependencies from the repo root:

```bash
npm install
```

## Source Map

The package is intentionally small. Most changes land in one of these files:

- [`src/index.ts`](./index.ts): package entrypoint
- [`src/cli.ts`](./cli.ts): argument parsing, interactive vs non-interactive flow, plan/apply orchestration
- [`src/wizard.ts`](./wizard.ts): interactive Clack wizard and review flow
- [`src/profile.ts`](./profile.ts): default selections and capability dependency rules
- [`src/catalog.ts`](./catalog.ts): which files belong to a resolved install profile
- [`src/renderers.ts`](./renderers.ts): generated router and profile-aware file content
- [`src/planner.ts`](./planner.ts): diffing current files vs desired files into install actions
- [`src/install.ts`](./install.ts): plan application and conflict staging
- [`src/manifest.ts`](./manifest.ts): managed-file manifest load/write helpers
- [`tests/`](../tests): integration, CLI, wizard, renderer, and consistency coverage

## Development Workflow

For fast iteration on TypeScript source, run the entrypoint directly with `tsx`:

```bash
npm run dev -- --target "$(mktemp -d)"
```

For packaging-sensitive work, prefer the built artifact:

```bash
npm run build
node dist/index.js --help
```

Use this rule of thumb while changing the package:

- If you touched wizard UX, CLI copy, or argument handling: test interactively against `dist/index.js`
- If you touched profile resolution, planning, manifests, or conflict handling: run `npm test`
- If you touched `package.json`, bundled dependencies, `files`, `bin`, or output structure: run `npm run smoke:pack`
- If you touched default assets under `docs/` or profile-aware renderer output: run `npm run validate:defaults`

## Build

Build the distributable with:

```bash
npm run build
```

This uses `tsup` and writes the package entrypoint to `dist/index.js`, which is also the `bin` target used when the package is installed from npm.

## Manual Testing

Do manual testing in two passes: local built CLI, then packaged tarball.

### Fast local loop

```bash
npm run build

TEST_DIR=$(mktemp -d)
node dist/index.js --help
node dist/index.js --dry-run --target "$TEST_DIR"
node dist/index.js --target "$TEST_DIR"
```

The interactive wizard should currently walk through:

1. `Choose the document types to manage in this project:`
2. `Install starter prompts?`
3. `Which document templates should be installed?`
4. `Which reference files should be installed?`
5. `Which agent instructions should be installed?`
6. `Review selections`
7. `What would you like to do next?`

If the selected install would conflict with an existing `AGENTS.md` or `CLAUDE.md` at one of the managed target paths, the CLI should also present a conflict-resolution prompt for each conflicting file:

- `Update` (default): append starter-docs instructions to the end of the existing file
- `Overwrite`: replace the file with the starter-docs version and manage it
- `Skip`: leave the file alone and stage the generated version under `docs/.starter-docs/conflicts/`

After an install or dry run, inspect the result:

```bash
find "$TEST_DIR" -maxdepth 4 | sort
cat "$TEST_DIR/docs/.starter-docs/manifest.json"
```

### Manual scenarios worth walking through

1. Default install: accept defaults, confirm `docs/work/AGENTS.md` and the manifest are created.
2. Dependency logic: deselect `Plans` and confirm `PRD` and `Work` disable automatically.
3. Review loop: choose `Edit document types` or `Edit options`, change values, and return to review.
4. Apply/sync: rerun against an installed target with no explicit command.

```bash
node dist/index.js --target "$TEST_DIR"
```

5. Reconfigure saved selections:

```bash
node dist/index.js reconfigure --target "$TEST_DIR"
```

6. Managed-file conflict staging: modify a managed file, rerun apply/sync, and confirm the replacement is staged instead of overwritten.

```bash
printf 'local edit\n' > "$TEST_DIR/docs/AGENTS.md"
node dist/index.js --target "$TEST_DIR"
find "$TEST_DIR/docs/.starter-docs/conflicts" | sort
```

7. Existing root instruction conflict: create a root `AGENTS.md` before install and confirm the conflict prompt appears.

```bash
CONFLICT_DIR=$(mktemp -d)
printf 'custom root agents\n' > "$CONFLICT_DIR/AGENTS.md"
node dist/index.js --target "$CONFLICT_DIR"
```

### Packaged `npx` validation

The automated smoke test validates the packed tarball offline, but before publishing it is still worth doing one real npm launcher run:

```bash
npm run build
TARBALL=$(npm pack --silent)
TEST_DIR=$(mktemp -d)

npm exec --yes --package "./$TARBALL" -- \
  starter-docs --target "$TEST_DIR"
```

Important detail: the `--yes` above is for `npm exec`, not the installer. Do not pass installer `--yes` if you want to see the wizard.

## Automated Tests

Run the full automated test suite:

```bash
npm test
```

Useful focused checks:

```bash
npm run validate:defaults
npm run smoke:pack
```

What each script covers:

- `npm test`: Vitest suite across profile logic, renderers, wizard state, CLI flows, and installer integration
- `npm run validate:defaults`: validates the default asset set and consistency assumptions
- `npm run smoke:pack`: builds the package, creates a tarball, unpacks it into a temp directory, and runs the packaged CLI against a temp target

For confidence before merging or publishing, run all three:

```bash
npm test
npm run build
npm run smoke:pack
```

## Packaging And Release

The package is published from the repo root and includes only the entries listed in [`package.json`](../package.json): `dist`, `docs`, root instruction files, and the root consumer README.

Recommended release checklist:

1. Update the version.
2. Run `npm test`.
3. Run `npm run build`.
4. Run `npm run smoke:pack`.
5. Run one real `npm exec --package "./<tarball>"` install test.
6. Inspect the tarball contents with `npm pack --json` if you changed packaging inputs.
7. Publish with `npm publish`.

Example release flow:

```bash
npm version patch
npm test
npm run build
npm run smoke:pack
npm pack --json
npm publish
```

If the package is ever moved under a scope, you may also need `npm publish --access public`.

## Notes For Contributors

- Keep public CLI flags and manifest behavior backward-compatible unless the change is intentional.
- Prefer updating tests in the same change as behavior updates.
- When changing wizard wording, also update relevant tests and this maintainer README if the manual flow changed.
- When changing packaged assets or installer rules, think in both modes: interactive wizard flow and non-interactive `--yes` flow.
