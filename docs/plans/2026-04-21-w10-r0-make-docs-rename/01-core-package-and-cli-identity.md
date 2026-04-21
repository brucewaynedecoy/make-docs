# Core Package and CLI Identity

## Purpose

Rename the npm workspace identity, CLI package/bin, source constants, CLI text, and registry metadata from `starter-docs` to `make-docs`.

## Scope

- Root package identity and scripts.
- CLI package name and `bin` map.
- Private workspace package scopes.
- `package-lock.json` metadata.
- CLI source strings, help examples, lifecycle copy, wizard copy, user-agent strings, manifest package metadata, and TypeScript constants.
- Skill registry GitHub source URLs and schema title.

## Implementation Steps

1. Update package manifests:
   - root package name: `make-docs-monorepo`
   - root scripts: `npm run build -w make-docs`, `npm test -w make-docs`, and matching `dev` and `validate:defaults`
   - CLI package name and bin: `make-docs`
   - private workspaces: `@make-docs/template`, `@make-docs/skills`, `@make-docs/content`
2. Regenerate `package-lock.json` once after manifest changes. Do not hand-edit lockfile package-name references except as part of resolving deterministic lockfile output.
3. Rename source constants and env-like identifiers, including `STARTER_DOCS_CONFIG_RELATIVE_DIR` to `MAKE_DOCS_CONFIG_RELATIVE_DIR`.
4. Update CLI copy in `packages/cli/src/` so help, errors, notes, lifecycle warnings, wizard prompts, install/sync summaries, and next-step guidance use `make-docs`.
5. Update skill registry source URLs from the old repository path to the future `make-docs` repository path.
6. Confirm fresh manifests record `packageName: "make-docs"` through the package metadata flow, without adding legacy package-name migration.

## Parallelization

This phase should be owned by one worker because package metadata, workspace names, and lockfile regeneration are shared blockers. Other workers may start read-only discovery, but should not edit tests or docs that depend on exact package/bin names until this worker lands the canonical package identity.

## Dependencies and Blockers

- Blocks validation because `-w make-docs` commands cannot run until package names and lockfile agree.
- Blocks smoke packaging because the packed CLI must expose the final `make-docs` bin.
- Blocks test expectation updates where expected CLI text depends on final source strings.

## Acceptance Criteria

- `npm run build -w make-docs` can resolve the workspace.
- `packages/cli/package.json` exposes only a `make-docs` bin.
- `package-lock.json` has no `starter-docs` or `@starter-docs` package identities.
- CLI source contains no old product-name strings or `STARTER_DOCS_*` identifiers.
- No `starter-docs` compatibility bin, alias, or migration branch is introduced.
