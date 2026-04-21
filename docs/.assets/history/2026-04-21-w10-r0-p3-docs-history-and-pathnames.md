---
date: "2026-04-21"
coordinate: "W10 R0 P3"
---

# Docs, History, and Pathnames Rename

## Changes

This session completed Wave 10 Phase 3 from [03-docs-history-and-pathnames.md](../../work/2026-04-21-w10-r0-make-docs-rename/03-docs-history-and-pathnames.md), based on the source plan at [docs/plans/2026-04-21-w10-r0-make-docs-rename/03-docs-history-and-pathnames.md](../../plans/2026-04-21-w10-r0-make-docs-rename/03-docs-history-and-pathnames.md). The phase rewrote repo documentation, package docs, historical records, and tracked Markdown pathnames to use `make-docs`.

| Area | Summary |
| --- | --- |
| Install guide | Renamed the user install guide to `getting-started-installing-make-docs.md` and updated guide links, title, command examples, source-install examples, and temporary paths. |
| Active docs | Updated root and package READMEs, active references, prompts, routers, user/developer guides, and roadmap copy for `Make Docs`, `make-docs`, and `npx make-docs`. |
| Historical docs | Rewrote design docs, plan directories, work directories, and history records so historical documentation uses the new product name. |
| Pathnames | Removed tracked Markdown path segments containing the old product name and repaired links to renamed docs. |
| Validation | Phase 3 scoped old-name searches passed, tracked pathname search passed, old install-guide link search passed, router checks passed, and `git diff --check` passed. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/.assets/history/2026-04-21-w10-r0-p3-docs-history-and-pathnames.md](2026-04-21-w10-r0-p3-docs-history-and-pathnames.md) | New history record for the Wave 10 Phase 3 docs, history, and pathname rename. |
| [README.md](../../../README.md) | Root project README updated for Make Docs package, command, source-install, and contributor examples. |
| [TODO.md](../../../TODO.md) | Project task list updated for the new product name. |
| [packages/cli/README.md](../../../packages/cli/README.md) | CLI package README updated for `make-docs` install and source-copy examples. |
| [packages/docs/README.md](../../../packages/docs/README.md) | Template package README updated for `@make-docs/template` and `make-docs` distribution wording. |
| [docs/.assets/AGENTS.md](../../.assets/AGENTS.md) | Active assets router updated for make-docs-managed state wording. |
| [docs/.references/commit-message-convention.md](../../.references/commit-message-convention.md) | Active reference copy updated for the new product name. |
| [docs/.references/history-record-contract.md](../../.references/history-record-contract.md) | Active history contract copy updated for the new product name. |
| [docs/designs/2026-04-21-make-docs-rename.md](../../designs/2026-04-21-make-docs-rename.md) | Wave 10 design updated as part of the docs rename pass. |
| [docs/work/2026-04-21-w10-r0-make-docs-rename/03-docs-history-and-pathnames.md](../../work/2026-04-21-w10-r0-make-docs-rename/03-docs-history-and-pathnames.md) | Phase 3 work item updated during the rename pass. |

### Developer

| Path | Description |
| --- | --- |
| [docs/guides/developer/cli-development-local-build-and-install.md](../../guides/developer/cli-development-local-build-and-install.md) | Developer build and local install guide updated for `make-docs` commands and package paths. |
| [docs/guides/developer/roadmap.md](../../guides/developer/roadmap.md) | Developer roadmap copy updated for the new product name. |

### User

| Path | Description |
| --- | --- |
| [docs/guides/user/getting-started-installing-make-docs.md](../../guides/user/getting-started-installing-make-docs.md) | Renamed user install guide with updated title, examples, and source-install paths. |
