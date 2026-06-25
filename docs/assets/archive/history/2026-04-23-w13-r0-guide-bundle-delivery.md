---
date: "2026-04-23"
client: "Codex Desktop"
repo: "make-docs"
status: "completed"
coordinate: "W13 R0 P3-5"
summary: "Delivered the Phase 3-5 guide bundles for onboarding, workflows, CLI lifecycle, skills, template contracts, and maintainer operations."
---

# Guide Bundle Delivery

## Changes

Implemented W13 R0 Phases 3-5 for the documentation coverage audit and guide orchestration effort, framed by [the Phase 3 backlog](../archive/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/03-onboarding-concepts-and-workflows.md), [the Phase 4 backlog](../archive/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/04-cli-lifecycle-and-skills.md), [the Phase 5 backlog](../archive/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/05-template-contracts-and-maintainer-operations.md), and [the W13 R0 plan overview](../archive/plans/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/00-overview.md). These phases used orchestrated parallel workers to update the existing onboarding and workflow guides, create the missing CLI lifecycle and skills guides, add the template, maintainer, and release developer guides, and mark the three backlog phases complete with structured handoff data for later assembly. The delivered guide set covers Bundles A through D without overlapping write scopes, while deferring `README.md` discovery refresh and final cross-bundle `related` normalization to Phase 6.

| Area | Summary |
| --- | --- |
| Bundle A | Reused the existing onboarding, concepts, and workflow guides and refreshed both user and developer route-selection coverage as current-state documentation. |
| Bundle B/C | Added the missing user CLI lifecycle guide, distinct user and developer skills guides, and decomposition guidance, with link-only archive-docs coverage folded into the broader skills set. |
| Bundle D | Added the template, maintainer, and release guide set and updated the local CLI build/install developer guide as part of maintainer operations coverage. |
| Orchestration | Kept the main rollout in coordinator mode while parallel workers owned disjoint guide families and returned structured handoffs for traceability. |
| Phase 6 handoff | Left shared discovery and final cross-bundle link normalization for the assembly phase to avoid collisions on shared navigation surfaces. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/assets/archive/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/03-onboarding-concepts-and-workflows.md](../archive/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/03-onboarding-concepts-and-workflows.md) | Completed Phase 3 backlog with the Bundle A handoff payload for onboarding, concepts, and workflows. |
| [docs/assets/archive/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/04-cli-lifecycle-and-skills.md](../archive/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/04-cli-lifecycle-and-skills.md) | Completed Phase 4 backlog with the Bundle B/C handoff payload for CLI lifecycle and skills coverage. |
| [docs/assets/archive/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/05-template-contracts-and-maintainer-operations.md](../archive/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/05-template-contracts-and-maintainer-operations.md) | Completed Phase 5 backlog with the Bundle D handoff payload for template, maintainer, and release guides. |
| [docs/assets/history/2026-04-23-w13-r0-guide-bundle-delivery.md](2026-04-23-w13-r0-guide-bundle-delivery.md) | Combined history record for the Phase 3-5 guide bundle implementation checkpoint. |

### Developer

| Path | Description |
| --- | --- |
| [docs/guides/developer/development-workflows-stage-model-and-artifact-relationships.md](../../guides/developer/development-workflows-stage-model-and-artifact-relationships.md) | Updated developer companion guide for the stage model and artifact relationships. |
| [docs/guides/developer/development-workflows-choosing-the-right-route.md](../../guides/developer/development-workflows-choosing-the-right-route.md) | Updated developer routing guide for choosing the correct make-docs workflow path. |
| [docs/guides/developer/cli-development-local-build-and-install.md](../../guides/developer/cli-development-local-build-and-install.md) | Updated maintainer-facing CLI local build and install workflow coverage. |
| [docs/guides/developer/skills-catalog-and-distribution-model.md](../../guides/developer/skills-catalog-and-distribution-model.md) | New developer guide for the skills catalog, registry, scope model, and distribution responsibilities. |
| [docs/guides/developer/template-contracts-guide-authoring.md](../../guides/developer/template-contracts-guide-authoring.md) | New developer guide for guide contracts, authoring expectations, and template-owned documentation rules. |
| [docs/guides/developer/template-assets-and-generated-routers.md](../../guides/developer/template-assets-and-generated-routers.md) | New developer guide for generated routers, template assets, and renderer-owned outputs. |
| [docs/guides/developer/maintainer-docs-assets-and-runtime-state-boundaries.md](../../guides/developer/maintainer-docs-assets-and-runtime-state-boundaries.md) | New maintainer guide clarifying the boundary between `docs/assets/**` resources and `.make-docs/**` runtime state. |
| [docs/guides/developer/maintainer-dogfood-and-maintainer-operations.md](../../guides/developer/maintainer-dogfood-and-maintainer-operations.md) | New maintainer guide for dogfood reseeding and day-to-day maintainer operations. |
| [docs/guides/developer/release-packaging-validation-and-release-reference.md](../../guides/developer/release-packaging-validation-and-release-reference.md) | New release guide for packaging, validation, smoke-pack checks, and release expectations. |

### User

| Path | Description |
| --- | --- |
| [docs/guides/user/getting-started-installing-make-docs.md](../../guides/user/getting-started-installing-make-docs.md) | Updated onboarding guide for current install and first-run entry paths. |
| [docs/guides/user/concepts-wave-revision-phase-coordinates.md](../../guides/user/concepts-wave-revision-phase-coordinates.md) | Updated concepts guide for current W/R/P mental-model coverage. |
| [docs/guides/user/workflows-how-make-docs-stages-fit-together.md](../../guides/user/workflows-how-make-docs-stages-fit-together.md) | Updated workflow guide explaining how the make-docs stages fit together. |
| [docs/guides/user/workflows-choosing-the-right-route-for-your-project.md](../../guides/user/workflows-choosing-the-right-route-for-your-project.md) | Updated workflow routing guide for choosing the right route for a project. |
| [docs/guides/user/cli-lifecycle-managing-installations.md](../../guides/user/cli-lifecycle-managing-installations.md) | New user guide for lifecycle tasks such as apply or sync, reconfigure, backup, uninstall, and recovery. |
| [docs/guides/user/skills-installing-and-managing-skills.md](../../guides/user/skills-installing-and-managing-skills.md) | New user guide for installing, updating, and managing skills with the CLI. |
| [docs/guides/user/skills-decomposing-an-existing-codebase.md](../../guides/user/skills-decomposing-an-existing-codebase.md) | New user guide for using the decomposition skill to audit an existing codebase into PRDs and backlog artifacts. |
