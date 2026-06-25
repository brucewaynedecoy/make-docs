---
date: "2026-04-22"
client: "Codex Desktop"
repo: "make-docs"
status: "completed"
coordinate: "W9 R1 P4"
summary: "Dogfooded the docs/assets resource tree and root .make-docs state layout."
---

# Dogfood Docs Migration

## Changes

Implemented W9 R1 Phase 4 for the docs assets resource namespace overhaul, framed by [the Phase 4 backlog](../archive/work/2026-04-22-w9-r1-docs-assets-resource-namespace/04-dogfood-docs-migration.md). This phase dogfooded the finalized resource layout by moving this repository's support resources into `docs/assets/`, relocating dogfood CLI state to root `.make-docs/manifest.json`, retiring hidden docs resource directories, and updating active READMEs, routers, guides, and archive skill copies to use the new paths.

| Area | Summary |
| --- | --- |
| Dogfood resource tree | Moved archive, history, prompts, references, and templates into `docs/assets/**` and removed the retired hidden resource directories. |
| Runtime state | Moved the dogfood manifest to `.make-docs/manifest.json`; no conflict staging directory existed to preserve. |
| Active docs | Updated READMEs, output routers, maintainer guides, package docs, and template prompt links for the new resource and state paths. |
| Archive skill | Updated packaged and installed archive skill copies to scan `docs/assets/history/` and archive into `docs/assets/archive/`. |
| Validation | Verified router pairs, whitespace, active stale-path scans, retired-directory absence, concrete moved-history links, and archive skill relationship tracing. |
| Work backlog | Marked Phase 4 tasks and acceptance criteria complete with implementation notes and validation commands. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/assets/](../) | New dogfood document-resource root containing archive, history, prompts, references, and templates. |
| [.make-docs/manifest.json](../../../.make-docs/manifest.json) | Moved dogfood CLI manifest state to the root state namespace. |
| [README.md](../../../README.md), [packages/cli/README.md](../../../packages/cli/README.md), and [packages/docs/README.md](../../../packages/docs/README.md) | Updated resource tree, manifest path, conflict path, and re-seeding guidance. |
| [docs/designs/AGENTS.md](../../designs/AGENTS.md), [docs/plans/AGENTS.md](../../plans/AGENTS.md), [docs/prd/AGENTS.md](../../prd/AGENTS.md), and [docs/work/AGENTS.md](../../work/AGENTS.md) | Updated active output routers to route references, templates, and archives through `docs/assets/`. |
| [docs/assets/history/2026-04-22-w9-r1-p4-dogfood-docs-migration.md](2026-04-22-w9-r1-p4-dogfood-docs-migration.md) | History record for this phase. |
| [docs/assets/archive/work/2026-04-22-w9-r1-docs-assets-resource-namespace/04-dogfood-docs-migration.md](../archive/work/2026-04-22-w9-r1-docs-assets-resource-namespace/04-dogfood-docs-migration.md) | Marked Phase 4 complete and recorded validation. |
| [packages/docs/template/docs/assets/references/design-contract.md](../../../packages/docs/template/docs/assets/references/design-contract.md) and [packages/docs/template/docs/assets/templates/design.md](../../../packages/docs/template/docs/assets/templates/design.md) | Repaired prompt relative links after the resource tree move. |
| [.agents/skills/archive-docs/SKILL.md](../../../.agents/skills/archive-docs/SKILL.md), [.claude/skills/archive-docs/SKILL.md](../../../.claude/skills/archive-docs/SKILL.md), and [packages/skills/archive-docs/SKILL.md](../../../packages/skills/archive-docs/SKILL.md) | Updated archive skill routing and tracing paths for the new assets tree. |

### Developer

| Path | Description |
| --- | --- |
| [docs/guides/developer/cli-development-local-build-and-install.md](../../guides/developer/cli-development-local-build-and-install.md) | Updated smoke-pack guidance to assert `.make-docs/manifest.json`. |

### User

| Path | Description |
| --- | --- |
| [docs/guides/user/getting-started-installing-make-docs.md](../../guides/user/getting-started-installing-make-docs.md) | Updated manifest and conflict staging guidance to use root `.make-docs/` state. |
