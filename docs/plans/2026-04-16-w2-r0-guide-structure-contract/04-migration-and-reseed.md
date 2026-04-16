# Phase 4 — Migration and Re-seed

## Objective

Migrate the two existing dogfood guides to the new slug-mirrors-path naming convention with full YAML frontmatter, and re-seed the repo-root `docs/` from the updated template package so that references, templates, and routers reflect the guide structure contract.

## Depends On

Phase 3 (`03-cli-integration.md`) — the template package must be fully wired into the CLI asset pipeline before re-seeding the dogfood docs, so the re-seeded files match what `init --yes` would produce.

## Guide Migration

Two guides in the dogfood `docs/guides/` need renaming and frontmatter injection. The body content of each file is preserved as-is; only the filename changes and the YAML frontmatter block is prepended.

### 1. Developer guide: local build and install

| | Value |
| --- | --- |
| **Old path** | `docs/guides/developer/local-build-and-install.md` |
| **New path** | `docs/guides/developer/cli-development-local-build-and-install.md` |

Frontmatter to prepend:

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

### 2. User guide: installing starter-docs

| | Value |
| --- | --- |
| **Old path** | `docs/guides/user/installing-starter-docs.md` |
| **New path** | `docs/guides/user/getting-started-installing-starter-docs.md` |

Frontmatter to prepend:

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

For each guide: rename the file (via `git mv`), then prepend the frontmatter block above the existing body content. Verify the new filename's slug prefix matches the `path` value with slashes replaced by hyphens (e.g., `path: cli/development` produces slug prefix `cli-development-`).

## Re-seed Dogfood Docs

After Phases 1-3 complete the template package, copy the following files from `packages/docs/template/` into the repo-root `docs/` to bring the dogfood docs up to date.

| Source (in `packages/docs/template/`) | Target (in `docs/`) | Notes |
| --- | --- | --- |
| `.references/guide-contract.md` | `.references/guide-contract.md` | New file; the guide structure contract reference. |
| `.templates/guide-developer.md` | `.templates/guide-developer.md` | New file; developer guide template. |
| `.templates/guide-user.md` | `.templates/guide-user.md` | New file; user guide template. |
| `guides/AGENTS.md` | `guides/AGENTS.md` | Overwrite; updated guide router. |
| `guides/CLAUDE.md` | `guides/CLAUDE.md` | Overwrite; updated guide router. |
| `AGENTS.md` | `AGENTS.md` | Overwrite; updated docs router. |
| `CLAUDE.md` | `CLAUDE.md` | Overwrite; updated docs router. |
| `.templates/AGENTS.md` | `.templates/AGENTS.md` | Overwrite; updated templates router. |
| `.templates/CLAUDE.md` | `.templates/CLAUDE.md` | Overwrite; updated templates router. |

The dogfood `docs/AGENTS.md` and `docs/CLAUDE.md` may contain prior customizations, but these routers are auto-generated from the template. The template is the source of truth — overwrite without merging.

## Parallelism

Guide migration and template re-seeding are independent work streams:

- **Guide migration** touches only `docs/guides/developer/` and `docs/guides/user/` (renaming and editing existing content files).
- **Re-seeding** copies template-owned files into `docs/.references/`, `docs/.templates/`, `docs/guides/`, and `docs/` (router files only).

These two streams share no files and can execute in parallel. The only shared directory is `docs/guides/`, but migration touches content files while re-seeding touches only `AGENTS.md`/`CLAUDE.md` router files.

## Acceptance Criteria

- [ ] `docs/guides/developer/local-build-and-install.md` no longer exists.
- [ ] `docs/guides/developer/cli-development-local-build-and-install.md` exists with the correct frontmatter and original body content.
- [ ] `docs/guides/user/installing-starter-docs.md` no longer exists.
- [ ] `docs/guides/user/getting-started-installing-starter-docs.md` exists with the correct frontmatter and original body content.
- [ ] `docs/.references/guide-contract.md` exists and matches the template source.
- [ ] `docs/.templates/guide-developer.md` and `docs/.templates/guide-user.md` exist and match the template source.
- [ ] `docs/guides/AGENTS.md` and `docs/guides/CLAUDE.md` match the template source.
- [ ] `docs/AGENTS.md` and `docs/CLAUDE.md` match the template source.
- [ ] `docs/.templates/AGENTS.md` and `docs/.templates/CLAUDE.md` match the template source.
- [ ] `bash scripts/check-instruction-routers.sh` passes for the dogfood `docs/` directory.
- [ ] Both migrated guides render correctly (frontmatter parses, body is intact, no broken links).
