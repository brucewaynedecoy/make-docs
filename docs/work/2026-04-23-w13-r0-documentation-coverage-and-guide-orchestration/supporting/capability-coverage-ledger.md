# Capability Coverage Ledger

> Phase 1 artifact for [W13 R0](../01-inventory-and-ledger.md). This ledger inventories the current guide surface first, records the historical discovery pass second, and normalizes the current-state capability rows that Phase 2 will convert into final guide decisions.

## Purpose

This ledger follows the evidence order fixed by the design and plan:

1. existing guides
2. wave artifacts in `docs/designs/`, `docs/plans/`, `docs/work/`, and `docs/assets/history/`
3. active PRD set
4. targeted current-code inspection
5. git history only if higher-confidence sources are insufficient

Wave artifacts remain discovery inputs, but the rows below describe the product as it exists now. Where historical artifacts and current PRD or code disagree, the row is marked explicitly and later guide work should follow current truth.

## Existing Guide Surface Inventory

| Guide | Audience | `path` | Status | Current topical coverage | Overlap or drift risk |
| --- | --- | --- | --- | --- | --- |
| [Installing Make Docs](../../../guides/user/getting-started-installing-make-docs.md) | user | `getting-started` | `draft` | install, sync, first-run defaults, capability reference, command reference, troubleshooting | Strong overlap with install, sync, reconfigure, and basic CLI lifecycle surfaces; likely too broad once dedicated CLI guides exist |
| [Understanding W/R/P Coordinates](../../../guides/user/concepts-wave-revision-phase-coordinates.md) | user | `concepts` | `draft` | coordinate semantics, where coordinates appear, commit-message usage | Solid concept coverage, but needs alignment with the broader stage-model and route-selection guide set |
| [How Make Docs Stages Fit Together](../../../guides/user/workflows-how-make-docs-stages-fit-together.md) | user | `workflows` | `draft` | stage sequence, route overview, full-vs-delta outcomes | Partial overlap with route-selection guides; decomposition terminology may need tightening after `W12 R0` |
| [Choosing the Right Route for Your Project](../../../guides/user/workflows-choosing-the-right-route-for-your-project.md) | user | `workflows` | `draft` | route selection for baseline PRDs, decomposition, targeted PRD updates, and backlog scope | Strong overlap with the developer route guide; likely needs clearer cross-links instead of duplicated prose |
| [Building and Installing the CLI Locally](../../../guides/developer/cli-development-local-build-and-install.md) | developer | `cli/development` | `draft` | local build, test, instruction-router validation, smoke-pack, npm link and npm pack workflows | Mixes local CLI development with broader validation and release concerns that likely deserve separate maintainer or release guides |
| [Understanding the Make Docs Stage Model](../../../guides/developer/development-workflows-stage-model-and-artifact-relationships.md) | developer | `development/workflows` | `draft` | stage model, artifact relationships, lifecycle rules, contributor implications | Strong partial overlap with coordinate and route guides; should stay as the maintainer-facing workflow explainer |
| [Choosing the Right Make Docs Route](../../../guides/developer/development-workflows-choosing-the-right-route.md) | developer | `development/workflows` | `draft` | route decision table, baseline generation, decomposition, active-set evolution, W/R follow-up work | Overlaps with the user route guide; good candidate for shared cross-linking instead of standalone expansion |
| [Strategic Roadmap — Skills, Agentics, Multi-Harness, and Extensibility](../../../guides/developer/roadmap.md) | developer | `roadmap` | `draft` | strategic direction for skills packaging, multi-harness support, and extensibility | Intentionally strategic, not operational; should not absorb maintainer, release, or skill-usage guides |

## Historical Discovery Ranges

### W1-W4

- Existing guides reviewed first: all current onboarding, concept, workflow, developer workflow, CLI development, and roadmap guides listed above.
- Design docs reviewed: [Docs Contract v2 — Planning Proposals](../../../designs/2026-04-15-docs-contract-v2-planning.md), [Docs Contract v2 — Execution Plan](../../../designs/2026-04-15-docs-contract-v2-execution.md), [Guide Structure Contract](../../../designs/2026-04-16-guide-structure-contract.md), [Design Naming Simplification](../../../designs/2026-04-16-design-naming-simplification.md), [Asset Pipeline Completeness](../../../designs/2026-04-16-asset-pipeline-completeness.md).
- Plan and work backlogs reviewed: [W2 R0 plan](../../../plans/2026-04-16-w2-r0-guide-structure-contract/00-overview.md), [W2 R0 work](../../2026-04-16-w2-r0-guide-structure-contract/00-index.md), [W3 R0 plan](../../../plans/2026-04-16-w3-r0-design-naming-simplification/00-overview.md), [W3 R0 work](../../2026-04-16-w3-r0-design-naming-simplification/00-index.md), [W4 R0 plan](../../../plans/2026-04-16-w4-r0-asset-pipeline-completeness/00-overview.md), [W4 R0 work](../../2026-04-16-w4-r0-asset-pipeline-completeness/00-index.md).
- History records reviewed: [W2 R0 P1](../../../assets/history/2026-04-16-w2-r0-p1-guide-structure-contract.md), [W2 R0 P5](../../../assets/history/2026-04-16-w2-r0-p5-guide-structure-contract.md), [W3 R0 P1](../../../assets/history/2026-04-16-w3-r0-p1-design-naming-simplification.md), [W4 R0 P1](../../../assets/history/2026-04-16-w4-r0-p1-asset-pipeline-completeness.md).
- Evidence gap: no explicit `W1` plan backlog, work backlog, or history record is present in the active repo. The two `docs-contract-v2` designs act as antecedent context only.

### W5-W8

- Design docs reviewed: [Archive Docs — Relationship-Aware Document Archival Plugin](../../../designs/2026-04-16-archive-docs-skill.md), [CLI Skill Installation](../../../designs/2026-04-16-cli-skill-installation.md), [CLI Skill Installation R2](../../../designs/2026-04-16-cli-skill-installation-r2.md), [CLI Skill Selection UX — Default and Optional Groups](../../../designs/2026-04-17-cli-skill-selection-default-and-optional-groups.md), [Decompose Codebase Skill — Contract De-Drift](../../../designs/2026-04-23-decompose-codebase-skill-contract-dedrift.md), [Validator False-Positive Link Detection in Code Snippets](../../../designs/2026-04-16-validator-false-positive-links.md), [CLI Lifecycle UX — Help, Backup, and Uninstall](../../../designs/2026-04-18-cli-help-backup-and-uninstall.md), [CLI Lifecycle Clack Standardization](../../../designs/2026-04-22-cli-lifecycle-clack-standardization.md), [CLI Command Simplification](../../../designs/2026-04-20-cli-command-simplification.md).
- Plan and work backlogs reviewed: [W5 R0 plan](../../../plans/2026-04-16-w5-r0-archive-docs-plugin/00-overview.md), [W5 R0 work](../../2026-04-16-w5-r0-archive-docs-plugin/00-index.md), [W5 R1 plan](../../../plans/2026-04-16-w5-r1-cli-skill-installation/00-overview.md), [W5 R2 plan](../../../plans/2026-04-16-w5-r2-cli-skill-installation/00-overview.md), [W5 R3 plan](../../../plans/2026-04-17-w5-r3-cli-skill-installation/00-overview.md), [W5 R4 work](../../2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/00-index.md), [W6 R0 plan](../../../plans/2026-04-16-w6-r0-validator-false-positive-links/00-overview.md), [W6 R0 work](../../2026-04-16-w6-r0-validator-false-positive-links/00-index.md), [W7 R0 plan](../../../plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/00-overview.md), [W7 R0 work](../../2026-04-18-w7-r0-cli-help-backup-and-uninstall/00-index.md), [W7 R1 plan](../../../plans/2026-04-22-w7-r1-cli-lifecycle-clack-standardization/00-overview.md), [W7 R1 work](../../2026-04-22-w7-r1-cli-lifecycle-clack-standardization/00-index.md), [W8 R0 plan](../../../plans/2026-04-20-w8-r0-cli-command-simplification/00-overview.md), [W8 R0 work](../../2026-04-20-w8-r0-cli-command-simplification/00-index.md).
- History records reviewed: [W5 R0 P1](../../../assets/history/2026-04-16-w5-r0-p1-archive-docs-plugin.md), [W5 R2 P1](../../../assets/history/2026-04-16-w5-r2-p1-cli-skill-installation.md), [W5 R3 P1](../../../assets/history/2026-04-17-w5-r3-p1-cli-skill-installation.md), [W6 R0 P1](../../../assets/history/2026-04-16-w6-r0-p1-validator-false-positive-links.md), [W7 R0 P1](../../../assets/history/2026-04-18-w7-r0-p1-cli-help-backup-and-uninstall.md), [W7 R1 P1](../../../assets/history/2026-04-22-w7-r1-p1-cli-lifecycle-clack-standardization.md), [W8 R0 P1](../../../assets/history/2026-04-20-w8-r0-p1-cli-command-simplification.md).

### W9-W12

- Design docs reviewed: [Docs Assets, Make-Docs State, and Session History](../../../designs/2026-04-20-docs-assets-state-and-history.md), [Docs Assets Resource Namespace Overhaul](../../../designs/2026-04-22-docs-assets-resource-namespace.md), [Make Docs Rename](../../../designs/2026-04-21-make-docs-rename.md), [CLI Skills Command - Skills-Only Lifecycle Surface](../../../designs/2026-04-21-cli-skills-command.md).
- Plan and work backlogs reviewed: [W9 R0 plan](../../../plans/2026-04-20-w9-r0-docs-assets-state-and-history/00-overview.md), [W9 R0 work](../../2026-04-20-w9-r0-docs-assets-state-and-history/00-index.md), [W9 R1 plan](../../../plans/2026-04-22-w9-r1-docs-assets-resource-namespace/00-overview.md), [W9 R1 work](../../2026-04-22-w9-r1-docs-assets-resource-namespace/00-index.md), [W10 R0 plan](../../../plans/2026-04-21-w10-r0-make-docs-rename/00-overview.md), [W10 R0 work](../../2026-04-21-w10-r0-make-docs-rename/00-index.md), [W11 R0 plan](../../../plans/2026-04-21-w11-r0-cli-skills-command/00-overview.md), [W11 R0 work](../../2026-04-21-w11-r0-cli-skills-command/00-index.md), [W12 R0 work](../../2026-04-23-w12-r0-make-docs-prd-decomposition/00-index.md).
- History records reviewed: [W9 R0 P1](../../../assets/history/2026-04-20-w9-r0-p1-contracts-and-history-namespace.md), [W9 R1 P1](../../../assets/history/2026-04-22-w9-r1-p1-resource-contract-and-routing.md), [W10 R0 P1](../../../assets/history/2026-04-21-w10-r0-p1-core-package-and-cli-identity.md), [W11 R0 P1](../../../assets/history/2026-04-22-w11-r0-p1-cli-skills-command.md), [W11 R0 P4](../../../assets/history/2026-04-22-w11-r0-p4-cli-skills-command.md).
- Current-truth validation for these rows was anchored to the active PRD set, especially [PRD index](../../../prd/00-index.md), [01 Product Overview](../../../prd/01-product-overview.md), [05 Installation, Profile, and Manifest Lifecycle](../../../prd/05-installation-profile-and-manifest-lifecycle.md), [06 Template Contracts and Generated Assets](../../../prd/06-template-contracts-and-generated-assets.md), [07 CLI Command Surface and Lifecycle](../../../prd/07-cli-command-surface-and-lifecycle.md), [08 Skills Catalog and Distribution](../../../prd/08-skills-catalog-and-distribution.md), [09 Dogfood and Maintainer Operations](../../../prd/09-dogfood-and-maintainer-operations.md), and [10 Packaging, Validation, and Release Reference](../../../prd/10-packaging-validation-and-release-reference.md).

## Canonical Capability Rows

### L01 - Guide Taxonomy, Frontmatter Contract, and Publication Paths

- `capability`: Guide taxonomy, slug and frontmatter contract, and publication paths for `docs/guides/user/` and `docs/guides/developer/`.
- `source waves/revisions/phases`: `W2 R0 P1-P5` with antecedent context from the `docs-contract-v2` designs.
- `current status`: Active and shipped through the guide contract, templates, and router generation. The product already publishes user and developer guide families, but no current guide explains that contract directly for maintainers.
- `evidence links`: [Guide Structure Contract design](../../../designs/2026-04-16-guide-structure-contract.md), [W2 R0 plan](../../../plans/2026-04-16-w2-r0-guide-structure-contract/00-overview.md), [W2 R0 work](../../2026-04-16-w2-r0-guide-structure-contract/00-index.md), [W2 history](../../../assets/history/2026-04-16-w2-r0-p1-guide-structure-contract.md), [guide contract reference](../../../assets/references/guide-contract.md).
- `existing guide overlap`: All current guides follow the contract, but none of the existing guide bodies explain guide taxonomy, slug rules, or publication paths as a maintainer topic.
- `developer guide action`: provisional: likely `developer` coverage through a maintainer or template-contract guide rather than a user-facing guide.
- `user guide action`: provisional: likely `none` or `link-only`; users do not need a dedicated guide about guide publication mechanics.
- `suggested guide path/title`: provisional `template / Guide Contract and Publication Paths`.
- `priority`: provisional `P2`.
- `related docs`: [guides router](../../../guides/AGENTS.md), [guide developer template](../../../assets/templates/guide-developer.md), [guide user template](../../../assets/templates/guide-user.md), [history record contract](../../../assets/references/history-record-contract.md).

### L02 - Stage Model, Coordinates, and Artifact Relationships

- `capability`: The stage model that connects design, plan, PRD, work, and history artifacts, plus W/R/P coordinate semantics and where they appear.
- `source waves/revisions/phases`: antecedent `docs-contract-v2` design context, `W3 R0 P1-P4`, and current PRD architecture material.
- `current status`: Active and already substantially documented. Current user and developer guides cover most of the coordinate and stage-model surface, though cross-linking and terminology consistency still need review.
- `evidence links`: [Docs Contract v2 — Planning Proposals](../../../designs/2026-04-15-docs-contract-v2-planning.md), [Design Naming Simplification design](../../../designs/2026-04-16-design-naming-simplification.md), [W3 R0 plan](../../../plans/2026-04-16-w3-r0-design-naming-simplification/00-overview.md), [W3 R0 work](../../2026-04-16-w3-r0-design-naming-simplification/00-index.md), [user coordinate guide](../../../guides/user/concepts-wave-revision-phase-coordinates.md), [developer stage-model guide](../../../guides/developer/development-workflows-stage-model-and-artifact-relationships.md), [wave-model reference](../../../assets/references/wave-model.md).
- `existing guide overlap`: Strong overlap with four existing guides. This looks like update-and-normalize work rather than a greenfield documentation gap.
- `developer guide action`: provisional: likely `link-only` or targeted updates to the current developer workflow guide.
- `user guide action`: provisional: likely targeted updates to existing concept and workflow guides rather than new standalone files.
- `suggested guide path/title`: provisional updates to `concepts / Understanding W/R/P Coordinates` and `development/workflows / Understanding the Make Docs Stage Model`.
- `priority`: provisional `P2`.
- `related docs`: [user stage workflow guide](../../../guides/user/workflows-how-make-docs-stages-fit-together.md), [PRD index](../../../prd/00-index.md), [01 Product Overview](../../../prd/01-product-overview.md), [02 Architecture Overview](../../../prd/02-architecture-overview.md).

### L03 - Route Selection and Decomposition-Driven Workflow Choice

- `capability`: Choosing between baseline generation, decomposition-driven PRD generation, targeted PRD evolution, and follow-up W/R work.
- `source waves/revisions/phases`: `W3 R0`, `W5 R4 P1-P5`, and `W12 R0`.
- `current status`: Active and partially documented. Both route guides describe when to choose decomposition, but they do not yet cover the current decompose-codebase skill and output model as first-class guide material.
- `evidence links`: [developer route guide](../../../guides/developer/development-workflows-choosing-the-right-route.md), [user route guide](../../../guides/user/workflows-choosing-the-right-route-for-your-project.md), [Decompose Codebase Skill — Contract De-Drift](../../../designs/2026-04-23-decompose-codebase-skill-contract-dedrift.md), [W5 R4 work](../../2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/00-index.md), [W12 R0 backlog](../../2026-04-23-w12-r0-make-docs-prd-decomposition/00-index.md), [PRD index audience paths](../../../prd/00-index.md), [01 Product Overview](../../../prd/01-product-overview.md).
- `existing guide overlap`: Strong overlap for the decision layer; weak overlap for the actual decomposition skill and its deliverables.
- `developer guide action`: provisional: likely update the current developer route guide and add or link to a deeper decomposition guide if the skills bundle does not absorb it cleanly.
- `user guide action`: provisional: likely update the current user route guide and consider a link to a decomposition-specific workflow guide.
- `suggested guide path/title`: provisional `workflows / Decomposition-Driven PRD Generation`.
- `priority`: provisional `P1`.
- `related docs`: [W12 PRD decomposition work](../../2026-04-23-w12-r0-make-docs-prd-decomposition/03-skills-and-cli-lifecycle.md), [08 Skills Catalog and Distribution](../../../prd/08-skills-catalog-and-distribution.md), [03 Open Questions and Risk Register](../../../prd/03-open-questions-and-risk-register.md).

### L04 - Install Profile, Apply or Sync, and Reconfigure Semantics

- `capability`: First install defaults, manifest-backed apply or sync, explicit reconfigure, capability dependencies, and non-interactive selection semantics.
- `source waves/revisions/phases`: historical baseline behavior refined through `W8 R0 P1-P4`, with current truth anchored to the active PRD set.
- `current status`: Active and shipped as the primary user entry path. The current install guide covers much of this surface, but it also mixes in command and lifecycle material that probably needs its own guide family.
- `evidence links`: [Installing Make Docs](../../../guides/user/getting-started-installing-make-docs.md), [CLI Command Simplification design](../../../designs/2026-04-20-cli-command-simplification.md), [W8 R0 plan](../../../plans/2026-04-20-w8-r0-cli-command-simplification/00-overview.md), [W8 R0 work](../../2026-04-20-w8-r0-cli-command-simplification/00-index.md), [05 Installation, Profile, and Manifest Lifecycle](../../../prd/05-installation-profile-and-manifest-lifecycle.md), [07 CLI Command Surface and Lifecycle](../../../prd/07-cli-command-surface-and-lifecycle.md), [current `profile.ts`](../../../../packages/cli/src/profile.ts), [current `cli.ts`](../../../../packages/cli/src/cli.ts).
- `existing guide overlap`: Strong overlap with `Installing Make Docs`; likely still missing a cleaner dedicated CLI lifecycle guide for sync and reconfigure.
- `developer guide action`: provisional: likely `link-only` into developer CLI docs unless Phase 2 decides maintainer-specific reconfigure behavior needs a separate explainer.
- `user guide action`: provisional: update `Installing Make Docs` and likely create or expand a user `cli-*` guide for install, sync, and reconfigure.
- `suggested guide path/title`: provisional updates to `getting-started / Installing Make Docs` plus a new `cli / Install, Sync, and Reconfigure`.
- `priority`: provisional `P1`.
- `related docs`: [01 Product Overview](../../../prd/01-product-overview.md), [02 Architecture Overview](../../../prd/02-architecture-overview.md), [manifest lifecycle PRD](../../../prd/05-installation-profile-and-manifest-lifecycle.md).

### L05 - Lifecycle Commands, Shared Audit Engine, and Recovery UX

- `capability`: Help text, backup, uninstall, shared audit classification, and the clack-based lifecycle UX for destructive or recovery-oriented operations.
- `source waves/revisions/phases`: `W7 R0 P1-P5` and `W7 R1 P1-P4`.
- `current status`: Active, shipped, and under-documented as a coherent surface. Current guides mention parts of it, but there is no dedicated lifecycle or recovery guide for users or maintainers.
- `evidence links`: [CLI Lifecycle UX — Help, Backup, and Uninstall](../../../designs/2026-04-18-cli-help-backup-and-uninstall.md), [CLI Lifecycle Clack Standardization](../../../designs/2026-04-22-cli-lifecycle-clack-standardization.md), [W7 R0 plan](../../../plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/00-overview.md), [W7 R1 plan](../../../plans/2026-04-22-w7-r1-cli-lifecycle-clack-standardization/00-overview.md), [W7 R0 work](../../2026-04-18-w7-r0-cli-help-backup-and-uninstall/00-index.md), [W7 R1 work](../../2026-04-22-w7-r1-cli-lifecycle-clack-standardization/00-index.md), [07 CLI Command Surface and Lifecycle](../../../prd/07-cli-command-surface-and-lifecycle.md), [current `audit.ts`](../../../../packages/cli/src/audit.ts).
- `existing guide overlap`: Partial overlap in `Installing Make Docs` and `Building and Installing the CLI Locally`, but neither guide makes backup, uninstall, and audit boundaries easy to find.
- `developer guide action`: provisional: likely create or expand a developer CLI or maintainer guide that explains the audit model and safe removal boundaries.
- `user guide action`: provisional: likely create a user-facing CLI lifecycle guide for backup, uninstall, and recovery.
- `suggested guide path/title`: provisional `cli / Backup, Uninstall, and Recovery`.
- `priority`: provisional `P1`.
- `related docs`: [current `cli.ts`](../../../../packages/cli/src/cli.ts), [10 Packaging, Validation, and Release Reference](../../../prd/10-packaging-validation-and-release-reference.md), [history W7 R0 P3](../../../assets/history/2026-04-18-w7-r0-p3-cli-help-backup-and-uninstall.md).

### L06 - Skills Command, Registry, Scope, and Distribution Model

- `capability`: The `make-docs skills` command, skills-only planning and apply, registry-backed required and optional skills, harness selection, and project versus global scope.
- `source waves/revisions/phases`: `W5 R1 P1-P5`, `W5 R2 P1-P7`, `W5 R3 P1`, and `W11 R0 P1-P4`.
- `current status`: Active, shipped, and materially under-documented. The roadmap mentions the packaging direction, but there is no current user or developer guide for the skills lifecycle surface.
- `evidence links`: [CLI Skill Installation](../../../designs/2026-04-16-cli-skill-installation.md), [CLI Skill Installation R2](../../../designs/2026-04-16-cli-skill-installation-r2.md), [CLI Skill Selection UX — Default and Optional Groups](../../../designs/2026-04-17-cli-skill-selection-default-and-optional-groups.md), [CLI Skills Command - Skills-Only Lifecycle Surface](../../../designs/2026-04-21-cli-skills-command.md), [W5 R2 plan](../../../plans/2026-04-16-w5-r2-cli-skill-installation/00-overview.md), [W11 R0 work](../../2026-04-21-w11-r0-cli-skills-command/00-index.md), [08 Skills Catalog and Distribution](../../../prd/08-skills-catalog-and-distribution.md), [current `skills-command.ts`](../../../../packages/cli/src/skills-command.ts), [current `skill-catalog.ts`](../../../../packages/cli/src/skill-catalog.ts), [current `skill-registry.ts`](../../../../packages/cli/src/skill-registry.ts).
- `existing guide overlap`: Only strategic overlap in [roadmap](../../../guides/developer/roadmap.md). No current guide explains how to use or maintain the skills lifecycle surface.
- `developer guide action`: provisional: likely create a developer `skills-*` guide that covers registry, scope, harness targets, and skills-only planning.
- `user guide action`: provisional: likely create a user `skills-*` guide that covers command usage, scope choices, and optional-skill selection.
- `suggested guide path/title`: provisional `skills / Managing Skills with make-docs`.
- `priority`: provisional `P1`.
- `related docs`: [07 CLI Command Surface and Lifecycle](../../../prd/07-cli-command-surface-and-lifecycle.md), [roadmap](../../../guides/developer/roadmap.md), [current `cli.ts`](../../../../packages/cli/src/cli.ts).

### L07 - Archive Docs Skill

- `capability`: The required `archive-docs` skill that ships with the default skills profile and provides relationship-aware archival helpers and supporting assets.
- `source waves/revisions/phases`: `W5 R0 P1-P5` with current registry truth confirmed in the active skills catalog.
- `current status`: Active, shipped, and installed by default when skills are enabled. Dedicated guide coverage is currently absent.
- `evidence links`: [Archive Docs — Relationship-Aware Document Archival Plugin](../../../designs/2026-04-16-archive-docs-skill.md), [W5 R0 plan](../../../plans/2026-04-16-w5-r0-archive-docs-plugin/00-overview.md), [W5 R0 work](../../2026-04-16-w5-r0-archive-docs-plugin/00-index.md), [W5 history](../../../assets/history/2026-04-16-w5-r0-p1-archive-docs-plugin.md), [08 Skills Catalog and Distribution](../../../prd/08-skills-catalog-and-distribution.md), [roadmap](../../../guides/developer/roadmap.md).
- `existing guide overlap`: Roadmap mentions `archive-docs` strategically; no current user or developer guide explains what the skill does or when to use it.
- `developer guide action`: provisional: likely create or fold into a developer skills catalog guide with a dedicated `archive-docs` section.
- `user guide action`: provisional: likely create or fold into a user skills catalog guide with a dedicated `archive-docs` section.
- `suggested guide path/title`: provisional `skills / Archive Docs Skill`.
- `priority`: provisional `P2`.
- `related docs`: [current `skill-registry.ts`](../../../../packages/cli/src/skill-registry.ts), [packages/skills/archive-docs](../../../../packages/skills/archive-docs), [guide roadmap](../../../guides/developer/roadmap.md).

### L08 - Decompose Codebase Skill

- `capability`: The optional `decompose-codebase` skill, its contract surface, and its role in decomposition-driven PRD and backlog generation.
- `source waves/revisions/phases`: `W5 R4 P1-P5` and `W12 R0`.
- `current status`: Active, shipped as an optional skill, and only partially documented through route-selection guides and the current PRD decomposition backlog. The skill contract and delivered assets are not yet guide-ready.
- `evidence links`: [Decompose Codebase Skill — Contract De-Drift](../../../designs/2026-04-23-decompose-codebase-skill-contract-dedrift.md), [W5 R4 plan](../../../plans/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/00-overview.md), [W5 R4 work](../../2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/00-index.md), [W12 R0 backlog](../../2026-04-23-w12-r0-make-docs-prd-decomposition/00-index.md), [08 Skills Catalog and Distribution](../../../prd/08-skills-catalog-and-distribution.md), [developer route guide](../../../guides/developer/development-workflows-choosing-the-right-route.md).
- `existing guide overlap`: Partial overlap in the route guides, but no current guide explains the skill payload, expected outputs, or maintainer-facing contract.
- `developer guide action`: provisional: likely create or fold into a developer skills guide with stronger cross-links back to route selection.
- `user guide action`: provisional: likely create or fold into a user workflow or skills guide if the skill is intended to be directly operated by non-maintainer users.
- `suggested guide path/title`: provisional `skills / Decompose Codebase Skill`.
- `priority`: provisional `P2`.
- `related docs`: [packages/skills/decompose-codebase](../../../../packages/skills/decompose-codebase), [current `skill-catalog.ts`](../../../../packages/cli/src/skill-catalog.ts), [current W12 backlog](../../2026-04-23-w12-r0-make-docs-prd-decomposition/03-skills-and-cli-lifecycle.md).

### L09 - Template Asset Pipeline, Generated Routers, and Contract Surfaces

- `capability`: Template-owned source files, rule-driven asset selection, generated routers, and reduced-profile rendering of contracts, prompts, references, and templates.
- `source waves/revisions/phases`: `W2 R0 P1-P5`, `W4 R0 P1-P2`, `W9 R1 P1-P5`, and supporting rename work in `W10 R0`.
- `current status`: Active and central to the maintainer surface, but not explained in a dedicated guide. Current guide coverage is indirect.
- `evidence links`: [Asset Pipeline Completeness](../../../designs/2026-04-16-asset-pipeline-completeness.md), [Guide Structure Contract](../../../designs/2026-04-16-guide-structure-contract.md), [Docs Assets Resource Namespace Overhaul](../../../designs/2026-04-22-docs-assets-resource-namespace.md), [W4 R0 work](../../2026-04-16-w4-r0-asset-pipeline-completeness/00-index.md), [W9 R1 work](../../2026-04-22-w9-r1-docs-assets-resource-namespace/00-index.md), [06 Template Contracts and Generated Assets](../../../prd/06-template-contracts-and-generated-assets.md), [current `renderers.ts`](../../../../packages/cli/src/renderers.ts), [current `utils.ts`](../../../../packages/cli/src/utils.ts).
- `existing guide overlap`: `Building and Installing the CLI Locally` covers validation and smoke-pack consequences, but not the actual template, catalog, and renderer model.
- `developer guide action`: provisional: likely create a developer `template-*` guide that explains template ownership, catalog rules, and generated routers.
- `user guide action`: provisional: likely `none` or `link-only`; users generally consume the result rather than maintaining the template system.
- `suggested guide path/title`: provisional `template / Template Contracts and Generated Assets`.
- `priority`: provisional `P1`.
- `related docs`: [guide contract reference](../../../assets/references/guide-contract.md), [execution workflow reference](../../../assets/references/execution-workflow.md), [packages/docs/README.md](../../../../packages/docs/README.md), [packages/docs/template](../../../../packages/docs/template).

### L10 - Docs Assets Namespace, History Records, and Runtime State Boundaries

- `capability`: The `docs/assets/` document-resource namespace, `docs/assets/history/` session records, and the boundary between documentation resources and runtime install state.
- `source waves/revisions/phases`: `W9 R0 P1-P5`, `W9 R1 P1-P5`, and `W10 R0 P3`.
- `current status`: Active with a historical mismatch that must be preserved explicitly. Current truth is that document resources and history live under `docs/assets/**`, while runtime manifest and conflict state remain under `.make-docs/**`, not `docs/assets/config/`.
- `evidence links`: [Docs Assets, Make-Docs State, and Session History](../../../designs/2026-04-20-docs-assets-state-and-history.md), [Docs Assets Resource Namespace Overhaul](../../../designs/2026-04-22-docs-assets-resource-namespace.md), [W9 R0 work](../../2026-04-20-w9-r0-docs-assets-state-and-history/00-index.md), [W9 R1 work](../../2026-04-22-w9-r1-docs-assets-resource-namespace/00-index.md), [W10 history](../../../assets/history/2026-04-21-w10-r0-p3-docs-history-and-pathnames.md), [history record contract](../../../assets/references/history-record-contract.md), [current `renderers.ts`](../../../../packages/cli/src/renderers.ts), [current `audit.ts`](../../../../packages/cli/src/audit.ts).
- `existing guide overlap`: No dedicated guide currently explains this boundary. The install guide and generated routers imply pieces of it, but the mismatch between historical W9 intent and current code truth is not documented anywhere.
- `developer guide action`: provisional: likely create or fold into a maintainer or template-contract guide, with an explicit mismatch note carried forward.
- `user guide action`: provisional: likely `none` or `link-only`; end users only need the runtime-path story when troubleshooting.
- `suggested guide path/title`: provisional `maintainer / Docs Assets and Runtime State Boundaries`.
- `priority`: provisional `P1`.
- `related docs`: [current root README](../../../../README.md), [packages/docs/README.md](../../../../packages/docs/README.md), [guide installing make-docs](../../../guides/user/getting-started-installing-make-docs.md).

### L11 - Validation and Broken-Link False-Positive Filtering

- `capability`: Code-aware validation behavior that avoids treating fenced code examples and similar snippets as broken documentation links.
- `source waves/revisions/phases`: `W6 R0 P1-P3`.
- `current status`: Active, internal, and effectively undocumented. This is a maintainer-quality surface rather than a user-facing product feature.
- `evidence links`: [Validator False-Positive Link Detection in Code Snippets](../../../designs/2026-04-16-validator-false-positive-links.md), [W6 R0 plan](../../../plans/2026-04-16-w6-r0-validator-false-positive-links/00-overview.md), [W6 R0 work](../../2026-04-16-w6-r0-validator-false-positive-links/00-index.md), [W6 history](../../../assets/history/2026-04-16-w6-r0-p1-validator-false-positive-links.md), [10 Packaging, Validation, and Release Reference](../../../prd/10-packaging-validation-and-release-reference.md).
- `existing guide overlap`: No direct guide coverage today. This topic likely belongs inside a broader maintainer validation guide rather than as a standalone document.
- `developer guide action`: provisional: likely `link-only` coverage inside a release or validation guide.
- `user guide action`: provisional: `none`.
- `suggested guide path/title`: provisional `release / Validation and Link Hygiene`.
- `priority`: provisional `P3`.
- `related docs`: [current `cli-development-local-build-and-install`](../../../guides/developer/cli-development-local-build-and-install.md), [current `packages/cli/src/README.md`](../../../../packages/cli/src/README.md).

### L12 - Product Identity, Local Build, Dogfood, Packaging, and Release Validation

- `capability`: The `make-docs` product identity, local CLI development, dogfood reseeding expectations, packaging, smoke-pack validation, and release procedure.
- `source waves/revisions/phases`: `W10 R0 P1-P4`, with ongoing validation anchors in `W4 R0`, `W9 R1`, and `W12 R0`.
- `current status`: Active and partially documented. Current coverage is split between the local-build developer guide and the roadmap, leaving no dedicated maintainer or release guide.
- `evidence links`: [Make Docs Rename](../../../designs/2026-04-21-make-docs-rename.md), [W10 R0 plan](../../../plans/2026-04-21-w10-r0-make-docs-rename/00-overview.md), [W10 R0 work](../../2026-04-21-w10-r0-make-docs-rename/00-index.md), [Building and Installing the CLI Locally](../../../guides/developer/cli-development-local-build-and-install.md), [09 Dogfood and Maintainer Operations](../../../prd/09-dogfood-and-maintainer-operations.md), [10 Packaging, Validation, and Release Reference](../../../prd/10-packaging-validation-and-release-reference.md), [current `utils.ts`](../../../../packages/cli/src/utils.ts), [packages/docs/README.md](../../../../packages/docs/README.md).
- `existing guide overlap`: Strong overlap with the existing CLI development guide for local build and smoke-pack steps; weak overlap for dogfood operations, package identity, and release procedure.
- `developer guide action`: provisional: likely update `cli-development-local-build-and-install` and create companion maintainer or release guides.
- `user guide action`: provisional: likely `none` or `link-only`; users do not need release-procedure detail.
- `suggested guide path/title`: provisional `maintainer / Dogfood and Maintainer Operations` and `release / Packaging, Validation, and Release`.
- `priority`: provisional `P1`.
- `related docs`: [roadmap](../../../guides/developer/roadmap.md), [current root README](../../../../README.md), [packages/cli/package.json](../../../../packages/cli/package.json), [scripts/smoke-pack.mjs](../../../../scripts/smoke-pack.mjs).

## Phase 2 Handoff Notes

- `evidence gap`: No explicit `W1` implementation plan, work backlog, or history record remains in the active repo. If Phase 2 needs exact `W1` provenance, targeted commit inspection is the fallback.
- `existing-guide overlap conflict`: The current install guide and the current developer CLI guide both accumulate too many unrelated topics. Phase 2 should decide whether to split them into narrower lifecycle, maintainer, and release guides or keep them as hubs with stronger `related` links.
- `current-truth mismatch`: `W9` historical artifacts describe a broader `docs/assets` state surface, but current renderer and audit code keep runtime state in `.make-docs/**`. Later guide decisions must follow current code and PRD truth, not the older migration intent.
- `bundle-boundary question`: The decomposition surface spans both workflows and skills. Phase 2 must decide whether `decompose-codebase` is a dedicated skills guide, a workflow guide, or a cross-linked pair.
- `low-priority row`: The `make-docs` rename appears to be mostly absorbed into the current guide corpus. Phase 2 should decide whether that row resolves to `link-only` or `none`.
