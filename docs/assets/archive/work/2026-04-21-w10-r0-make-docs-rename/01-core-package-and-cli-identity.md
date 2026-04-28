# Phase 1: Core Package and CLI Identity

> Derives from [Phase 1 of the plan](../../plans/2026-04-21-w10-r0-make-docs-rename/01-core-package-and-cli-identity.md).

## Purpose

Settle the canonical package, workspace, CLI binary, lockfile, and runtime identity before other workers update template output, docs, tests, and validation.

## Overview

This phase is the main dependency blocker for the rest of Wave 10. It owns package metadata, `package-lock.json`, source constants, CLI copy outside renderer output, and skill registry identity. Only one worker should edit this phase because lockfile and package/bin changes are shared by every later phase.

## Source PRD Docs

None. This backlog is derived from the `w10-r0` plan and design, not from an active PRD namespace.

## Source Plan Phases

- [01-core-package-and-cli-identity.md](../../plans/2026-04-21-w10-r0-make-docs-rename/01-core-package-and-cli-identity.md)

## Parallel Execution Role

Core identity worker. Write scope:

- `package.json`
- `package-lock.json`
- `packages/*/package.json`
- `packages/cli/src/` except `packages/cli/src/renderers.ts`
- `packages/cli/skill-registry.json`
- `packages/cli/skill-registry.schema.json`

This worker blocks all final validation and should land before template, docs, and test workers make final expectation changes.

## Stage 1 - Rename package manifests and workspaces

### Tasks

1. Update the root package name from `make-docs-monorepo` to `make-docs-monorepo`.
2. Update root scripts to use `-w make-docs` for `build`, `dev`, `test`, and `validate:defaults`.
3. Update `packages/cli/package.json` package name to `make-docs`.
4. Replace the CLI `bin` entry so only `make-docs` points at `./dist/index.js`.
5. Update private workspace package names to `@make-docs/template`, `@make-docs/skills`, and `@make-docs/content`.
6. Update package descriptions that mention the old product name.
7. Regenerate `package-lock.json` after manifest edits.

### Acceptance criteria

- [ ] `npm run build -w make-docs` resolves the CLI workspace.
- [ ] `packages/cli/package.json` has no `make-docs` package or bin entry.
- [ ] Private workspace package names use `@make-docs/*`.
- [ ] `package-lock.json` reflects the new package names.
- [ ] No compatibility package alias is added.

### Dependencies

- None.

## Stage 2 - Rename source constants and runtime metadata

### Tasks

1. Rename `MAKE_DOCS_CONFIG_RELATIVE_DIR` to `MAKE_DOCS_CONFIG_RELATIVE_DIR`.
2. Update all imports and references to the renamed constant.
3. Preserve `MANIFEST_RELATIVE_PATH` as `docs/.assets/config/manifest.json`.
4. Update runtime text in `packages/cli/src/cli.ts` from old command examples to `make-docs`.
5. Update lifecycle output in `packages/cli/src/lifecycle-ui.ts` to use `make-docs`.
6. Update audit reason strings in `packages/cli/src/audit.ts` to use `make-docs`.
7. Update wizard copy in `packages/cli/src/wizard.ts` to use `make-docs`.
8. Update the skill fetch user-agent in `packages/cli/src/skill-resolver.ts` to `make-docs-cli`.
9. Do not edit `packages/cli/src/renderers.ts` in this phase; renderer output belongs to Phase 2.

### Acceptance criteria

- [ ] Source constants use `MAKE_DOCS_*` naming.
- [ ] CLI runtime text no longer references old commands.
- [ ] Lifecycle and audit copy use `make-docs`.
- [ ] Fresh manifest package identity is sourced from package metadata as `make-docs`.
- [ ] The CLI state path remains unchanged.

### Dependencies

- Stage 1.

## Stage 3 - Rename skill registry identity

### Tasks

1. Update `packages/cli/skill-registry.json` GitHub source URLs to the future `make-docs` repository path.
2. Update `packages/cli/skill-registry.schema.json` title to `make-docs skill registry`.
3. Confirm skill IDs such as `archive-docs` and `decompose-codebase` remain unchanged.
4. Confirm registry validation still permits the new URL strings.

### Acceptance criteria

- [ ] Registry source URLs no longer contain the old repository name.
- [ ] Registry schema title uses `make-docs`.
- [ ] Skill IDs are unchanged.
- [ ] Registry tests have a clear set of expected updates for Phase 4.

### Dependencies

- Stage 1.

## Stage 4 - Phase validation

### Tasks

1. Run `npm run build -w make-docs`.
2. Run exact-match searches in the Phase 1 write scope for old-name variants.
3. Capture any test expectation failures that should be handed to the Phase 4 worker.
4. Run `git diff --check`.

### Acceptance criteria

- [ ] Build resolves the renamed workspace.
- [ ] Phase 1 write scope contains no old-name strings or identifiers.
- [ ] Known test failures, if any, are expectation-only and assigned to Phase 4.
- [ ] `git diff --check` passes.

### Dependencies

- Stages 1-3.
