---
date: "2026-04-20"
coordinate: "W9 R0 P4"
---

# Docs Assets, State, and History - Phase 4: History and Documentation Migration

## Changes

Completed Wave 9 Phase 4, framed by [the Phase 4 plan](../../plans/2026-04-20-w9-r0-docs-assets-state-and-history/04-history-and-documentation-migration.md) and [the Phase 4 backlog](../../work/2026-04-20-w9-r0-docs-assets-state-and-history/04-history-and-documentation-migration.md). This phase moved current repository history records into `docs/.assets/history/` and updated active documentation surfaces for the new `.assets` model.

| Area | Summary |
| --- | --- |
| History migration | Existing session records were moved from `docs/guides/agent/` to `docs/.assets/history/`, while the retired `docs/guides/agent/AGENTS.md` and `CLAUDE.md` routers were removed. |
| History naming | The history contract, wave model, output contract, prompt, template, history routers, template copies, and generated renderer now allow W/R/P in phase-scoped history filenames while keeping stage/task detail only in `coordinate`. |
| Active docs | Repo and package READMEs now describe `.assets` as the home for history records and installer state; the developer CLI guide link targets were repaired after the history move. |
| Archive skill | Archive-docs skill instructions now scan `docs/.assets/history/` and prefer `coordinate` frontmatter, with W/R/P filename parsing as a fallback for older moved records. |
| Stale references | Exact-match scans still find retired paths in historical design, plan, and work docs where they describe prior behavior; active routers and current behavior docs now route history and CLI state to `.assets`. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-04-20-w9-r0-docs-assets-state-and-history/04-history-and-documentation-migration.md](../../work/2026-04-20-w9-r0-docs-assets-state-and-history/04-history-and-documentation-migration.md) | Phase 4 work item with acceptance criteria marked complete. |
| [docs/.assets/history/](./) | New home for moved session history records. |
| [docs/.assets/history/AGENTS.md](./AGENTS.md) | Updated history router filename guidance. |
| [docs/.assets/history/CLAUDE.md](./CLAUDE.md) | Updated history router filename guidance. |
| [docs/.prompts/session-to-history-record.prompt.md](../../.prompts/session-to-history-record.prompt.md) | Updated prompt instructions for W/R/P-aware history filenames. |
| [docs/.references/history-record-contract.md](../../.references/history-record-contract.md) | Updated path, naming, and coordinate rules for phase-scoped history records. |
| [docs/.references/output-contract.md](../../.references/output-contract.md) | Updated output path contract for history record filename fallbacks. |
| [docs/.references/wave-model.md](../../.references/wave-model.md) | Updated W/R/P naming rules for history record filenames. |
| [docs/.templates/history-record.md](../../.templates/history-record.md) | Added filename guidance for W/R/P-scoped history records. |
| [README.md](../../../README.md) | Updated top-level documentation tree and install output summary for `.assets/history`. |
| [packages/cli/README.md](../../../packages/cli/README.md) | Updated package README tree and install output summary for `.assets/history`. |
| [packages/cli/src/renderers.ts](../../../packages/cli/src/renderers.ts) | Updated generated history router text to match the new filename rules. |
| [packages/docs/README.md](../../../packages/docs/README.md) | Updated template package inventory and router list for `.assets/history` and `.assets/starter-docs`. |
| [packages/docs/template/docs/](../../../packages/docs/template/docs/) | Mirrored the history router, contract, template, prompt, output contract, and wave-model updates into the shippable docs template. |
| [packages/skills/archive-docs/SKILL.md](../../../packages/skills/archive-docs/SKILL.md) | Updated archive lookup guidance for history records in `.assets/history`. |
| [packages/skills/archive-docs/references/archive-workflow.md](../../../packages/skills/archive-docs/references/archive-workflow.md) | Updated upstream/downstream history tracing to use `.assets/history` and coordinate frontmatter. |
| [docs/.assets/history/2026-04-20-w9-r0-p4-history-and-documentation-migration.md](./2026-04-20-w9-r0-p4-history-and-documentation-migration.md) | History record for the Phase 4 history and documentation migration. |

### Developer

| Path | Description |
| --- | --- |
| [docs/guides/developer/cli-development-local-build-and-install.md](../../guides/developer/cli-development-local-build-and-install.md) | Repaired relative links to CLI utility and smoke scripts after the history migration pass. |

### User

None this session.
