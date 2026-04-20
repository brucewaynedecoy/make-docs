---
date: "2026-04-16"
coordinate: "W2 R0 P4"
---

# Phase 4: Guide Structure Contract — Migration and Re-seed

## Changes

Migrated two existing dogfood guides to the new slug-mirrors-path naming convention with YAML frontmatter, and re-seeded 9 template-owned files from the template package into the repo-root `docs/`.

### Guide migration

| Old path | New path | `path` frontmatter |
| --- | --- | --- |
| `docs/guides/developer/local-build-and-install.md` | `docs/guides/developer/cli-development-local-build-and-install.md` | `cli/development` |
| `docs/guides/user/installing-starter-docs.md` | `docs/guides/user/getting-started-installing-starter-docs.md` | `getting-started` |

Both guides received full YAML frontmatter blocks (`title`, `path`, `status: published`, `order`, `tags`, `applies-to`). Renames used `git mv` to preserve history. Body content was verified intact.

### Re-seed

Copied 3 new files and overwrote 6 router files from `packages/docs/template/` to `docs/`:

| Target | Type |
| --- | --- |
| `docs/.references/guide-contract.md` | New reference |
| `docs/.templates/guide-developer.md` | New template |
| `docs/.templates/guide-user.md` | New template |
| `docs/guides/AGENTS.md` | Router overwrite |
| `docs/guides/CLAUDE.md` | Router overwrite |
| `docs/AGENTS.md` | Router overwrite |
| `docs/CLAUDE.md` | Router overwrite |
| `docs/.templates/AGENTS.md` | Router overwrite |
| `docs/.templates/CLAUDE.md` | Router overwrite |

All 9 targets verified byte-identical to their template source.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-04-16-w2-r0-guide-structure-contract/04-migration-and-reseed.md](../../work/2026-04-16-w2-r0-guide-structure-contract/04-migration-and-reseed.md) | Work backlog phase — acceptance criteria checked off. |

### Developer

| Path | Description |
| --- | --- |
| [docs/guides/developer/cli-development-local-build-and-install.md](../../guides/developer/cli-development-local-build-and-install.md) | Migrated: renamed and added YAML frontmatter. |

### User

| Path | Description |
| --- | --- |
| [docs/guides/user/getting-started-installing-starter-docs.md](../../guides/user/getting-started-installing-starter-docs.md) | Migrated: renamed and added YAML frontmatter. |
