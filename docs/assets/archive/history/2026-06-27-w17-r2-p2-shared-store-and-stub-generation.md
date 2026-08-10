---
client: "Codex Desktop"
date: "2026-06-27"
coordinate: "W17 R2 P2"
repo: "make-docs"
branch: "make-docs-v2"
status: "completed"
summary: "Implemented shared selected-skill payloads and generated harness stubs."
---

# W17 R2 P2 Shared Store and Stub Generation

## Changes

Phase 2 implemented the selected-skill shared store and generated harness stub contract: selected project skills now install one canonical payload under `.make-docs/agentics/skills/<skill-name>/`, selected global skills install the same shape under the home-scoped `.make-docs/agentics/skills/<skill-name>/`, and enabled harness roots receive generated `SKILL.md` entrypoint stubs instead of duplicated supporting payload files.

- Added shared skill payload generation in the CLI skill catalog.
- Added generated harness stubs for Claude Code and Codex skill entrypoints.
- Included canonical payload path, source, purpose summary, provenance, and deterministic operation guidance in generated stubs.
- Preserved bare-install no-skill-files behavior.
- Updated planner conflict grouping so shared payload paths classify as skill assets.
- Updated install, catalog, lifecycle, audit, backup, uninstall, skills UI, and smoke-pack expectations for shared payloads plus stubs.
- Reconciled the active PRDs and user/developer guides with the shared-store path shape.
- Marked the Phase 2 work backlog complete.

Validation run:

- `npm test -w packages/cli -- skill-catalog install cli audit backup uninstall skills-ui lifecycle --reporter=dot`
- `npm run build -w packages/cli`

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/02-shared-store-and-stub-generation.md](../../../work/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/02-shared-store-and-stub-generation.md) | Marked Phase 2 complete and recorded shared-store implementation and validation evidence. |
| [docs/prd/01-product-overview.md](../../../prd/01-product-overview.md) | Updated product-surface language for shared selected-skill payloads and generated stubs. |
| [docs/prd/02-architecture-overview.md](../../../prd/02-architecture-overview.md) | Updated installation topology, runtime boundaries, and data-flow references for shared payloads and stubs. |
| [docs/prd/08-skills-catalog-and-distribution.md](../../../prd/08-skills-catalog-and-distribution.md) | Updated the active selected-skill asset contract. |
| [docs/prd/09-dogfood-and-maintainer-operations.md](../../../prd/09-dogfood-and-maintainer-operations.md) | Updated maintainer validation expectations for default and selected-skill installs. |
| [docs/prd/10-packaging-validation-and-release-reference.md](../../../prd/10-packaging-validation-and-release-reference.md) | Updated package validation expectations for shared payloads, stubs, and absent duplicated artifacts. |
| [historical closeout](2026-06-27-w17-r2-p4-package-validation-and-closeout.md) (retired action-PRD: `docs/prd/28-revise-shared-agentics-installation-harness-redirection.md`) | Added the Phase 2 implementation note and preserved later-phase ownership for structured classification and migration behavior. |
| [docs/assets/archive/history/2026-06-27-w17-r2-p2-shared-store-and-stub-generation.md](2026-06-27-w17-r2-p2-shared-store-and-stub-generation.md) | Added this phase closeout breadcrumb. |

### Developer

| Path | Description |
| --- | --- |
| [packages/cli/src/skill-catalog.ts](../../../../packages/cli/src/skill-catalog.ts) | Generates shared payloads and harness stubs for selected skills. |
| [packages/cli/src/planner.ts](../../../../packages/cli/src/planner.ts) | Classifies shared payload paths as skill assets for conflict grouping. |
| [packages/cli/tests/skill-catalog.test.ts](../../../../packages/cli/tests/skill-catalog.test.ts) | Covers shared payloads, stubs, global scope, selected-skill filtering, and no duplicated harness support files. |
| [packages/cli/tests/install.test.ts](../../../../packages/cli/tests/install.test.ts) | Covers installed shared payload files, generated stubs, manifest entries, and valid payload-local references. |
| [scripts/smoke-pack.mjs](../../../../scripts/smoke-pack.mjs) | Updates package smoke expectations for bare installs, selected shared payloads, generated stubs, and absent duplicated payload artifacts. |
| [docs/assets/library/developer/roadmap.md](../../library/developer/roadmap.md) | Updated the maintainer roadmap with the shared selected-skill shape. |
| [docs/assets/library/developer/skills-catalog-and-distribution-model.md](../../library/developer/skills-catalog-and-distribution-model.md) | Updated the skills distribution model with shared payload roots and generated stubs. |
| [docs/assets/library/developer/release-packaging-validation-and-release-reference.md](../../library/developer/release-packaging-validation-and-release-reference.md) | Updated packaging validation guidance for bare and selected-skill installs. |

### User

| Path | Description |
| --- | --- |
| [docs/assets/library/user/getting-started-installing-make-docs.md](../../library/user/getting-started-installing-make-docs.md) | Clarified that bare defaults create no selected skill payloads or stubs. |
| [docs/assets/library/user/skills-installing-and-managing-skills.md](../../library/user/skills-installing-and-managing-skills.md) | Updated user-facing selected-skill install behavior for shared payloads and generated harness stubs. |
