---
date: 2026-06-24
coordinate: W9 R2 P3
repo: make-docs
branch: make-docs-v2
status: completed
summary: "Defined migration fixtures and local bootstrap guidance for tool-directory resources."
---

# Tool Directory Migration and Validation

## Changes

Completed W9 R2 Phase 3 by defining legacy `docs/assets/**` tool-resource migration fixtures to `.make-docs/<family>/system/**`, locking materialization-mode bootstrap paths in tests, and updating asset routers across source and docs-template copies so agents continue to use local readable resources unless provider-backed resources have local manifest or bootstrap provenance; smoke-pack confirmed the docs template propagates through the packed CLI template path.

| Area | Summary |
| --- | --- |
| Code contract | Extended [../../../../packages/cli/src/tool-directory.ts](../../../../packages/cli/src/tool-directory.ts) with legacy tool-resource roots, system migration fixture helpers, materialization modes, and local bootstrap path helpers. |
| Tests | Expanded [../../../../packages/cli/tests/tool-directory.test.ts](../../../../packages/cli/tests/tool-directory.test.ts) to cover migration target mapping, stable fixture generation, ignored non-tool assets, and bootstrap paths across all materialization modes. |
| Router guidance | Updated asset routers in `docs/assets/` and `packages/docs/template/docs/assets/` so provider-backed resources do not become hidden, non-local instructions; packed CLI template propagation is validated by `npm run smoke:pack`. |
| Work backlog | Marked Phase 3 tasks complete and added implementation notes to [../../../work/2026-06-23-w9-r2-tool-directory-system-custom-resource-tiers/03-migration-and-validation.md](../../../work/2026-06-23-w9-r2-tool-directory-system-custom-resource-tiers/03-migration-and-validation.md). |
| Coverage decisions | Developer-guide and user-guide verdicts are `none` for this phase because the user-facing migration behavior has not moved resources yet. PRD verdict is `none` because PRDs 17, 18, 19, and 21 already own the requirement and no risk status changed. UAT remains deferred until the full W9 R2 wave is complete. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../../work/2026-06-23-w9-r2-tool-directory-system-custom-resource-tiers/03-migration-and-validation.md](../../../work/2026-06-23-w9-r2-tool-directory-system-custom-resource-tiers/03-migration-and-validation.md) | Captures Phase 3 implementation notes and completed task state. |
| [../AGENTS.md](../AGENTS.md) | Updates the source asset router with local-readability and provider-provenance guidance. |
| [../CLAUDE.md](../CLAUDE.md) | Mirrors the source asset router guidance for Claude-style agents. |
| [../../../../packages/docs/template/docs/assets/AGENTS.md](../../../../packages/docs/template/docs/assets/AGENTS.md) | Propagates the router guidance to the docs package template. |
| [../../../../packages/docs/template/docs/assets/CLAUDE.md](../../../../packages/docs/template/docs/assets/CLAUDE.md) | Propagates the Claude router guidance to the docs package template. |

### Developer

None this session.

### User

None this session.
