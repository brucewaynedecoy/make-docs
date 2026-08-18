# Maintainer README

This file is for contributors working on the `make-docs` package itself. The root [`README.md`](../README.md) is consumer-facing; this one is for local development, QA, packaging, and release work.

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
- [`src/rules.ts`](./rules.ts): static template path selection rules
- [`src/catalog.ts`](./catalog.ts): which static template files belong to a resolved install profile
- [`src/planner.ts`](./planner.ts): diffing current files vs desired files into install actions
- [`src/install.ts`](./install.ts): plan application and conflict staging
- [`src/manifest.ts`](./manifest.ts): managed-file manifest load/write helpers
- [`src/operations/`](./operations/): modular deterministic operation domains shared by CLI commands and MCP tools
- [`src/operations/registry.ts`](./operations/registry.ts): the append-only operation registry — the single source of truth for deterministic operations
- [`src/operations/context.ts`](./operations/context.ts): the injected execution context that gates writes, dry-run, and approvals uniformly
- [`src/run/cli.ts`](./run/cli.ts): the `make-docs run` surface derived from the registry
- [`src/mcp/`](./mcp/): read-first MCP stdio server registration and tool handlers
- Historical path `src/operations/cli.ts`: legacy dispatch for the pruned operation cluster, removed by the W18 R11 pruning phase
- [`src/operations.ts`](./operations.ts): compatibility facade for callers that still import `src/operations`
- [`tests/`](../tests): integration, CLI, wizard, managed-block, and consistency coverage

## Operation Domains

New deterministic make-docs behavior is declared once in the operation registry ([`src/operations/registry.ts`](./operations/registry.ts)) through a per-operation definition module under `src/operations/<domain>/ops/<verb>.ts`, then surfaced on `make-docs run`, the MCP tools, and Playbook `operation:` steps. Identifiers are stable, lowercase, dot-separated, and append-only. The registered domains are:

- `playbook`: validate, catalog, resolve, capabilities, and the run-state operations (start, invoke, status; next/advance/gate/resume/close are reserved pending the W18 R7 engine).
- `package`: package-plan, surface-resolve, and write over the playbook-packaging implementations.
- `work`: the retained work-item identity resolver and evidence record/read pair over the global store.

The migrated-operations inventory pruned the legacy `closeout`, `work` inspection, and `lifecycle` dispatcher. The former dispatcher path was `src/operations/cli.ts`; W18 R11 removed that file.

Shared operation contracts live in [`src/operations/types.ts`](./operations/types.ts), the registry contract in [`src/operations/registry.ts`](./operations/registry.ts), and the execution context in [`src/operations/context.ts`](./operations/context.ts). Every handler is invocable through `invokeOperation` without the CLI parser or MCP transport; surfaces adapt transport input, call the registry, and render the result — they never own operation logic or per-surface write gating.

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
- If you touched default assets under `packages/docs/template/`, generated install docs/system resources, or static asset selection: run `npm run validate:defaults`

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
node dist/index.js setup --dry-run --target "$TEST_DIR"
node dist/index.js setup --target "$TEST_DIR"
```

The interactive wizard should currently walk through:

1. `Choose the document types to manage in this project:`
2. `Which agent platforms will you use?`
3. `Install agent skills?`
4. `Review selections`
5. `What would you like to do next?`

If the selected install would conflict with existing managed agent instructions, system resources, references, or templates, the CLI should present one batch conflict-resolution prompt before any per-file review:

- `Overwrite all`: replace every conflicting managed file with the make-docs version and manage it
- `Skip all`: leave every conflicting file alone and stage generated replacements under `.make-docs/conflicts/`
- `Review each`: review files in group order: agent instructions, references, then templates

After an install or dry run, inspect the result:

```bash
find "$TEST_DIR" -maxdepth 4 | sort
cat "$TEST_DIR/.make-docs/manifest.json"
```

### Manual scenarios worth walking through

1. Default install: accept defaults, confirm `docs/work/AGENTS.md` and the manifest are created.
2. Dependency logic: deselect `Plans` and confirm `PRD` and `Work` disable automatically.
3. Review loop: choose `Edit document types` or `Edit options`, change values, and return to review.
4. Apply/sync: rerun `setup` against an installed target, and confirm bare invocation reports status without syncing.

```bash
node dist/index.js setup --target "$TEST_DIR"
node dist/index.js --target "$TEST_DIR"
```

5. Reconfigure saved selections:

```bash
node dist/index.js setup reconfigure --target "$TEST_DIR"
```

6. Managed-file conflict staging: modify a managed file, rerun apply/sync, and confirm the replacement is staged instead of overwritten.

```bash
printf 'local edit\n' > "$TEST_DIR/docs/AGENTS.md"
node dist/index.js setup --target "$TEST_DIR"
find "$TEST_DIR/.make-docs/conflicts" | sort
```

7. Existing root instruction conflict: create a root `AGENTS.md` before install and confirm the conflict prompt appears.

```bash
CONFLICT_DIR=$(mktemp -d)
printf 'custom root agents\n' > "$CONFLICT_DIR/AGENTS.md"
node dist/index.js setup --target "$CONFLICT_DIR"
```

### Packaged `npx` validation

The automated smoke test validates the packed tarball offline, but before publishing it is still worth doing one real npm launcher run:

```bash
npm run build
TARBALL=$(npm pack --silent)
TEST_DIR=$(mktemp -d)

npm exec --yes --package "./$TARBALL" -- \
  make-docs setup --target "$TEST_DIR"
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

- `npm test`: Vitest suite across profile logic, managed blocks, wizard state, CLI flows, and installer integration
- `npm run validate:defaults`: validates the default asset set and consistency assumptions
- `npm run smoke:pack`: builds the package, creates a tarball, unpacks it into a temp directory, and runs the packaged CLI against a temp target

For confidence before merging or publishing, run all three:

```bash
npm test
npm run build
npm run smoke:pack
```

## Packaging And Release

The package is published from `packages/cli/` as `@brucewaynedecoy/make-docs`. The package allowlist in [`package.json`](../package.json) ships `dist`, `template`, `skill-registry.json`, `skill-registry.schema.json`, and the package README; npm also includes package metadata and license files. Repo-root `docs/`, root `AGENTS.md`, root `CLAUDE.md`, source workspaces, scripts, and scratch planning material are not tarball-root package contents.

Recommended release-validation checklist:

1. Update the version.
2. Run `npm test`.
3. Run `npm run build`.
4. Run `npm run smoke:pack`.
5. Run one real `npm exec --package "./<tarball>"` install test.
6. Inspect the tarball contents with `npm pack --dry-run --json --ignore-scripts` if you changed packaging inputs.
7. Validate registry metadata with `npm publish --dry-run --access public --tag next`.

Example dry-run validation flow:

```bash
npm version patch
npm test
npm run build
npm run smoke:pack
npm pack --dry-run --json --ignore-scripts
npm publish --dry-run --access public --tag next
```

The package is scoped, so public publish validation and any separately authorized real publish must include `--access public`. Do not perform a real publish, registry reservation, tag, or promotion unless that irreversible action is explicitly authorized.

`packages/cli/template/` is generated package input. Do not hand-edit it as a source change; edit `packages/docs/template/` or the copy/prepack path, then regenerate the package copy with `npm run prepack -w packages/cli` or let `npm run smoke:pack` exercise the same path.

## Notes For Contributors

- Keep public CLI flags and manifest behavior backward-compatible unless the change is intentional.
- Prefer updating tests in the same change as behavior updates.
- When changing wizard wording, also update relevant tests and this maintainer README if the manual flow changed.
- When changing packaged assets or installer rules, think in both modes: interactive wizard flow and non-interactive `--yes` flow.
