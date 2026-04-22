---
date: "2026-04-21"
coordinate: "W10 R0 P1"
---

# Core Package and CLI Identity Rename

## Changes

This session completed Wave 10 Phase 1 core identity work from [01-core-package-and-cli-identity.md](../../work/2026-04-21-w10-r0-make-docs-rename/01-core-package-and-cli-identity.md), based on the source plan at [docs/plans/2026-04-21-w10-r0-make-docs-rename/01-core-package-and-cli-identity.md](../../plans/2026-04-21-w10-r0-make-docs-rename/01-core-package-and-cli-identity.md). The phase established `make-docs` as the canonical package, workspace, CLI binary, runtime copy, and skill registry identity while leaving renderer output for Phase 2.

| Area | Summary |
| --- | --- |
| Package manifests | Renamed the root package to `make-docs-monorepo`, changed root scripts to target `-w make-docs`, renamed the CLI package/bin to `make-docs`, and renamed private workspaces to `@make-docs/template`, `@make-docs/skills`, and `@make-docs/content`. |
| Lockfile | Regenerated `package-lock.json` with the new workspace links and without a compatibility package alias. |
| CLI runtime | Renamed `MAKE_DOCS_CONFIG_RELATIVE_DIR` to `MAKE_DOCS_CONFIG_RELATIVE_DIR`, preserved `docs/.assets/config/manifest.json`, and updated CLI help, lifecycle, audit, wizard, and maintainer README copy outside renderer output. |
| Skill registry | Updated registry source URLs to the future `brucewaynedecoy/make-docs` repository path, changed the schema title to `make-docs skill registry`, and left skill IDs unchanged. |
| Validation | `npm run build -w make-docs` and `git diff --check` passed. A scoped old-name scan passed for the Phase 1 write scope excluding `packages/cli/src/renderers.ts`, which remains Phase 2-owned. |
| Phase 4 handoff | `npm test -w make-docs` failed on expected follow-up work: tests still assert `make-docs` output and skill-fetch tests now hit future `make-docs` GitHub URLs that return 404 until test expectations or mocks are updated. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/.assets/history/2026-04-21-w10-r0-p1-core-package-and-cli-identity.md](2026-04-21-w10-r0-p1-core-package-and-cli-identity.md) | New history record for the Wave 10 Phase 1 core package and CLI identity rename. |

### Developer

| Path | Description |
| --- | --- |
| [packages/cli/src/README.md](../../../packages/cli/src/README.md) | Updated maintainer-facing command examples and conflict copy from `make-docs` to `make-docs`. |

### User

None this session.
