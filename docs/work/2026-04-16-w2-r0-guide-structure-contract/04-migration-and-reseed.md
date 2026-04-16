# Phase 4: Migration and Re-seed

> Derives from [Phase 4 of the plan](../../plans/2026-04-16-w2-r0-guide-structure-contract/04-migration-and-reseed.md).

## Purpose

Migrate the two existing dogfood guides to the new slug-mirrors-path naming convention with YAML frontmatter, and re-seed the repo-root `docs/` from the updated template package.

## Overview

Two work streams execute in parallel: guide migration (rename + frontmatter) and template re-seeding (copy 9 files from the template package). The streams share no files.

## Source Plan Phases

- [04-migration-and-reseed.md](../../plans/2026-04-16-w2-r0-guide-structure-contract/04-migration-and-reseed.md)

## Stage 1 — Migrate developer guide

### Tasks

1. Rename `docs/guides/developer/local-build-and-install.md` to `docs/guides/developer/cli-development-local-build-and-install.md` (use `git mv`).
2. Prepend YAML frontmatter to the renamed file:
   ```yaml
   ---
   title: Building and Installing the CLI Locally
   path: cli/development
   status: published
   order: 10
   tags:
     - build
     - testing
     - npm-link
   applies-to:
     - cli
   ---
   ```
3. Verify the slug prefix `cli-development-` matches the `path` value `cli/development` with `/` → `-`.
4. Verify the original body content is intact below the frontmatter.

### Acceptance criteria

- [x] Old file `docs/guides/developer/local-build-and-install.md` no longer exists
- [x] New file `docs/guides/developer/cli-development-local-build-and-install.md` exists
- [x] YAML frontmatter is valid and contains all specified fields
- [x] Body content is unchanged from the original
- [x] Slug prefix matches `path` value

### Dependencies

- Phase 3 (template package must be complete)

## Stage 2 — Migrate user guide

### Tasks

1. Rename `docs/guides/user/installing-starter-docs.md` to `docs/guides/user/getting-started-installing-starter-docs.md` (use `git mv`).
2. Prepend YAML frontmatter to the renamed file:
   ```yaml
   ---
   title: Installing Starter Docs
   path: getting-started
   status: published
   order: 10
   tags:
     - installation
     - setup
     - npx
   applies-to:
     - cli
     - template
   ---
   ```
3. Verify the slug prefix `getting-started-` matches the `path` value `getting-started` with `/` → `-`.
4. Verify the original body content is intact below the frontmatter.

### Acceptance criteria

- [x] Old file `docs/guides/user/installing-starter-docs.md` no longer exists
- [x] New file `docs/guides/user/getting-started-installing-starter-docs.md` exists
- [x] YAML frontmatter is valid and contains all specified fields
- [x] Body content is unchanged from the original
- [x] Slug prefix matches `path` value

### Dependencies

- Phase 3 (parallel with Stage 1)

## Stage 3 — Re-seed dogfood docs from template

### Tasks

1. Copy new files from `packages/docs/template/` to `docs/`:
   - `docs/.references/guide-contract.md` ← `packages/docs/template/docs/.references/guide-contract.md`
   - `docs/.templates/guide-developer.md` ← `packages/docs/template/docs/.templates/guide-developer.md`
   - `docs/.templates/guide-user.md` ← `packages/docs/template/docs/.templates/guide-user.md`
2. Overwrite router files from `packages/docs/template/` to `docs/`:
   - `docs/guides/AGENTS.md` ← `packages/docs/template/docs/guides/AGENTS.md`
   - `docs/guides/CLAUDE.md` ← `packages/docs/template/docs/guides/CLAUDE.md`
   - `docs/AGENTS.md` ← `packages/docs/template/docs/AGENTS.md`
   - `docs/CLAUDE.md` ← `packages/docs/template/docs/CLAUDE.md`
   - `docs/.templates/AGENTS.md` ← `packages/docs/template/docs/.templates/AGENTS.md`
   - `docs/.templates/CLAUDE.md` ← `packages/docs/template/docs/.templates/CLAUDE.md`
3. Verify each target matches its source (diff should be empty).

### Acceptance criteria

- [x] 3 new files created in `docs/`
- [x] 6 router files overwritten in `docs/`
- [x] Each target file is byte-identical to its source in `packages/docs/template/`
- [ ] `bash scripts/check-instruction-routers.sh` passes for dogfood `docs/` (deferred to Phase 5)

### Dependencies

- Phases 1-3 (template package must be fully updated)
- Parallel with Stages 1 and 2 (no shared files)
