# Make Docs PRD Index

## Purpose

This index orients maintainers, product owners, and AI coding agents through the active `make-docs` PRD set. The live product spans the publishable CLI in `packages/cli/`, the source-of-truth template in `packages/docs/template/`, the repo-root dogfood docs under `docs/`, and the packaging and validation scripts under `scripts/`; that split is encoded in `README.md:6-46`, `docs/prd/01-product-overview.md`, `docs/prd/02-architecture-overview.md`, `packages/cli/src/utils.ts:33-55`, and `packages/cli/package.json:9-25`.

The fixed-core overview layer is now present through [01 Product Overview](01-product-overview.md) and [02 Architecture Overview](02-architecture-overview.md). The subsystem docs `05` through `10`, the shared status docs [03 Open Questions and Risk Register](03-open-questions-and-risk-register.md) and [04 Glossary](04-glossary.md), and the paired rebuild backlog at [2026-04-23 W12 R0 Make Docs PRD Decomposition](../assets/archive/work/2026-04-23-w12-r0-make-docs-prd-decomposition/00-index.md) extend that core with implementation-level detail grounded in live code such as `packages/cli/src/cli.ts:77-244`, `packages/cli/src/catalog.ts:64-85`, and `scripts/smoke-pack.mjs:60-246`.

## Reading Order

1. Read [01 Product Overview](01-product-overview.md) and [02 Architecture Overview](02-architecture-overview.md) first. They establish the user model, runtime zones, module map, and configuration surfaces for the rest of the set.
2. Read [05 Installation, Profile, and Manifest Lifecycle](05-installation-profile-and-manifest-lifecycle.md), [06 Template Contracts and Generated Assets](06-template-contracts-and-generated-assets.md), [07 CLI Command Surface and Lifecycle](07-cli-command-surface-and-lifecycle.md), [08 Skills Catalog and Distribution](08-skills-catalog-and-distribution.md), [09 Dogfood and Maintainer Operations](09-dogfood-and-maintainer-operations.md), and [10 Packaging, Validation, and Release Reference](10-packaging-validation-and-release-reference.md) in that order. That sequence follows the live dependency chain from `packages/cli/src/profile.ts:10-99` and `packages/cli/src/manifest.ts:18-245` into `packages/cli/src/catalog.ts:64-85`, `packages/cli/src/cli.ts:77-244`, `packages/cli/src/skill-catalog.ts:33-138`, `packages/cli/src/utils.ts:33-55`, and `scripts/smoke-pack.mjs:60-246`.
3. Read [11 Revise CLI Asset Selection Simplification](11-revise-cli-asset-selection-simplification.md), [12 Revise CLI Skill Selection Simplification](12-revise-cli-skill-selection-simplification.md), [13 Revise CLI Conflict Resolution](13-revise-cli-conflict-resolution.md), [15 Revise Agent Instruction File Ownership](15-revise-agent-instruction-file-ownership.md), [16 Revise Package and Deployment Boundaries](16-revise-package-and-deployment-boundaries.md), [17 Revise System Asset Materialization Contract](17-revise-system-asset-materialization-contract.md), [18 Revise Compatibility Audit and Migration Disposition](18-revise-compatibility-audit-and-migration-disposition.md), [19 Revise Template Package Dogfood Source of Truth Contract](19-revise-template-package-dogfood-source-of-truth-contract.md), [20 Revise Agent Harness Model Conformance Lab](20-revise-agent-harness-model-conformance-lab.md), [21 Revise Tool Directory System Custom Resource Tiers](21-revise-tool-directory-system-custom-resource-tiers.md), [22 Revise New Docs Assets Playbooks Persona Model](22-revise-new-docs-assets-playbooks-persona-model.md), [23 Revise Generated Metadata Lifecycle Handoffs](23-revise-generated-metadata-lifecycle-handoffs.md), [24 Revise Configuration Convention Overlay](24-revise-configuration-convention-overlay.md), and [25 Revise CLI Separation and MCP Boundary](25-revise-cli-separation-and-mcp-boundary.md) after the baseline subsystem docs. They carry the active revisions for invariant prompt/template/reference assets, optional explicit skill selection, batch-first managed-file conflict review, block-scoped agent instruction ownership, stable package/deployment ownership across TypeScript npm and future Rust distributions, explicit system asset materialization modes, state-classified compatibility migration, template/package/dogfood source-of-truth order, maintainer-only harness/model evidence, `.make-docs/` tool-resource tiers, reader-facing guide/playbook persona assets, generated metadata handoffs, presentation-only project configuration, and CLI/MCP operation-boundary parity.
4. Read [03 Open Questions and Risk Register](03-open-questions-and-risk-register.md) after the subsystem docs to see where the current implementation and the current documentation still diverge, especially around `packages/cli/src/rules.ts:130-194`, `packages/cli/src/skill-resolver.ts:40-226`, and `packages/cli/package.json:9-25`.
5. Use [04 Glossary](04-glossary.md) whenever a term comes from the typed install, asset, skills, or lifecycle contracts in `packages/cli/src/types.ts:38-271`.
6. Use the paired backlog at [docs/assets/archive/work/2026-04-23-w12-r0-make-docs-prd-decomposition/00-index.md](../assets/archive/work/2026-04-23-w12-r0-make-docs-prd-decomposition/00-index.md) when you need dependency-ordered implementation work rather than descriptive product context.

## Document Map

| Slot | Status | Document | Focus |
| --- | --- | --- | --- |
| `00` | Current | [00-index.md](00-index.md) | Entry point for the active PRD set and the paired backlog. |
| `01` | Current | [01-product-overview.md](01-product-overview.md) | Product purpose, users, key capabilities, system boundaries, and current limitations. |
| `02` | Current | [02-architecture-overview.md](02-architecture-overview.md) | Runtime zones, module map, runtime boundaries, data flow, and configuration surfaces. |
| `03` | Current | [03-open-questions-and-risk-register.md](03-open-questions-and-risk-register.md) | Shared drift log, open contract questions, and rebuild risks synthesized from live code and docs. |
| `04` | Current | [04-glossary.md](04-glossary.md) | Shared vocabulary for `InstallSelections`, `ResolvedAsset`, `AuditReport`, and dogfood/release terms. |
| `05` | Current | [05-installation-profile-and-manifest-lifecycle.md](05-installation-profile-and-manifest-lifecycle.md) | Installer intent, capability dependencies, planner/apply flow, manifest state, conflict handling, and lifecycle safety boundaries. |
| `06` | Current | [06-template-contracts-and-generated-assets.md](06-template-contracts-and-generated-assets.md) | Template package ownership, static asset selection rules, managed instruction blocks, and docs contract surfaces. |
| `07` | Current | [07-cli-command-surface-and-lifecycle.md](07-cli-command-surface-and-lifecycle.md) | Public CLI taxonomy, wizard/review behavior, help, backup, uninstall, and audit-backed lifecycle UX. |
| `08` | Current | [08-skills-catalog-and-distribution.md](08-skills-catalog-and-distribution.md) | Skills command, registry/resolver model, project vs global scope, and current distribution mechanics. |
| `09` | Current | [09-dogfood-and-maintainer-operations.md](09-dogfood-and-maintainer-operations.md) | Repo-root `docs/` as a first-class dogfood runtime surface and maintainer workflow boundary. |
| `10` | Current | [10-packaging-validation-and-release-reference.md](10-packaging-validation-and-release-reference.md) | Package allowlist, prepack/template copy flow, smoke-pack validation, and release-surface reference. |
| `11` | Current | [11-revise-cli-asset-selection-simplification.md](11-revise-cli-asset-selection-simplification.md) | Revision making prompt, template, and reference assets always managed rather than user-selectable. |
| `12` | Current | [12-revise-cli-skill-selection-simplification.md](12-revise-cli-skill-selection-simplification.md) | Revision making shipped skills optional explicit selections instead of required/default, selected-by-default, or optional-add-on categories. |
| `13` | Current | [13-revise-cli-conflict-resolution.md](13-revise-cli-conflict-resolution.md) | Revision making selected managed-file diffs, including instructions, prompts, references, templates, desired skill assets, and generic selected managed files, use batch-first overwrite/skip conflict review. |
| `14` | Current | [14-add-lifecycle-workflow-foundation.md](14-add-lifecycle-workflow-foundation.md) | Addition: the lifecycle workflow foundation — coverage-pass contract, always-read lifecycle anchor, persona-scoped playbook output type, stage follow-on handoffs, and an optional `docs/artifacts/` seed. |
| `15` | Current | [15-revise-agent-instruction-file-ownership.md](15-revise-agent-instruction-file-ownership.md) | Revision: replaces whole-file overwrite/skip ownership of agent instruction files with a delimited managed-block inline-routing model that preserves user and project-specific content. |
| `16` | Current | [16-revise-package-and-deployment-boundaries.md](16-revise-package-and-deployment-boundaries.md) | Revision: fixes stable v2 product identity, TypeScript npm ownership, future Rust distribution ownership, one `make-docs` command, no default aliases, MCP startup ownership, and shared package/audit/manifest contracts. |
| `17` | Current | [17-revise-system-asset-materialization-contract.md](17-revise-system-asset-materialization-contract.md) | Revision: defines `full-snapshot`, `provider-backed`, and `hybrid-pinned-cache` system asset modes; preserves a non-provider-backed local bootstrap; and adds manifest provenance, provider/cache pinning, and on-demand safety requirements. |
| `18` | Current | [18-revise-compatibility-audit-and-migration-disposition.md](18-revise-compatibility-audit-and-migration-disposition.md) | Revision: defines compatibility state classification, source-state dispositions, migration review behavior, backup-and-reinstall safety, rollback expectations, and TypeScript/Rust parity requirements for existing installs. |
| `19` | Current | [19-revise-template-package-dogfood-source-of-truth-contract.md](19-revise-template-package-dogfood-source-of-truth-contract.md) | Revision: defines `packages/docs/template/` as the shipped template source, repo-root `docs/` as dogfood validation, and `packages/cli/template/` as the generated package-bundled copy. |
| `20` | Current | [20-revise-agent-harness-model-conformance-lab.md](20-revise-agent-harness-model-conformance-lab.md) | Revision: defines a maintainer-only conformance lab for scenario/result evidence, harness/model support-claim gating, and future adapter coverage without shipping lab assets by default. |
| `21` | Current | [21-revise-tool-directory-system-custom-resource-tiers.md](21-revise-tool-directory-system-custom-resource-tiers.md) | Revision: defines `.make-docs/` as the in-project tool directory for make-docs-owned resources, system/custom tiers, local bootstrap, runtime state, and future migration away from tool assets in `docs/assets/**`. |
| `22` | Current | [22-revise-new-docs-assets-playbooks-persona-model.md](22-revise-new-docs-assets-playbooks-persona-model.md) | Revision: defines `docs/assets/{guides,playbooks}/` as the reader-facing reusable documentation asset surface, `docs/archive/**` as the future archive surface, and `persona` frontmatter plus default/custom persona schema. |
| `23` | Current | [23-revise-generated-metadata-lifecycle-handoffs.md](23-revise-generated-metadata-lifecycle-handoffs.md) | Revision: defines YAML frontmatter as the canonical metadata layer for generated make-docs docs, including common fields, conditional source/persona/lifecycle/follow-on metadata, and YAML/body handoff drift validation. |
| `24` | Current | [24-revise-configuration-convention-overlay.md](24-revise-configuration-convention-overlay.md) | Revision: defines optional `.make-docs/config.yaml` as project-owned presentation configuration for labels, personas, and generated prose while preserving canonical paths, metadata keys, route identifiers, and W/R/P coordinate lineage. |
| `25` | Current | [25-revise-cli-separation-and-mcp-boundary.md](25-revise-cli-separation-and-mcp-boundary.md) | Revision: defines the v2 boundary between the TypeScript npm installer-maintainer CLI, the future Rust agent-facing CLI, and the first MCP surface while preserving installer-first `npx`, no-command install/sync, shared operation contracts, read-first MCP behavior, and no-scripts migration sequencing. |

## Source Anchors

- `README.md:6-46`
- `docs/assets/references/output-contract.md`
- `docs/assets/references/execution-workflow.md`
- `docs/prd/01-product-overview.md`
- `docs/prd/02-architecture-overview.md`
- `docs/prd/11-revise-cli-asset-selection-simplification.md`
- `docs/prd/12-revise-cli-skill-selection-simplification.md`
- `docs/prd/13-revise-cli-conflict-resolution.md`
- `docs/prd/16-revise-package-and-deployment-boundaries.md`
- `docs/prd/17-revise-system-asset-materialization-contract.md`
- `docs/prd/18-revise-compatibility-audit-and-migration-disposition.md`
- `docs/prd/19-revise-template-package-dogfood-source-of-truth-contract.md`
- `docs/prd/20-revise-agent-harness-model-conformance-lab.md`
- `docs/prd/21-revise-tool-directory-system-custom-resource-tiers.md`
- `docs/prd/22-revise-new-docs-assets-playbooks-persona-model.md`
- `docs/prd/23-revise-generated-metadata-lifecycle-handoffs.md`
- `docs/prd/24-revise-configuration-convention-overlay.md`
- `docs/prd/25-revise-cli-separation-and-mcp-boundary.md`
- `docs/designs/2026-06-19-package-and-deployment-boundaries.md`
- `docs/designs/2026-06-19-system-asset-delivery-and-materialization-contract.md`
- `docs/designs/2026-06-19-compatibility-audit-and-migration-disposition.md`
- `docs/designs/2026-06-19-template-package-and-dogfood-source-of-truth-contract.md`
- `docs/designs/2026-06-19-agent-harness-and-model-conformance-lab.md`
- `docs/designs/2026-06-19-tool-directory-system-and-custom-resource-tiers.md`
- `docs/designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md`
- `docs/designs/2026-06-20-generated-metadata-and-lifecycle-handoffs.md`
- `docs/designs/2026-06-20-configuration-and-convention-overlay.md`
- `docs/designs/2026-06-20-cli-separation-and-mcp-boundary.md`
- `docs/plans/2026-06-23-w10-r1-package-and-deployment-boundaries/00-overview.md`
- `docs/plans/2026-06-23-w10-r2-system-asset-materialization-contract/00-overview.md`
- `docs/plans/2026-06-23-w10-r3-compatibility-audit-and-migration-disposition/00-overview.md`
- `docs/plans/2026-06-23-w10-r4-template-package-dogfood-source-of-truth-contract/00-overview.md`
- `docs/plans/2026-06-23-w10-r5-agent-harness-model-conformance-lab/00-overview.md`
- `docs/plans/2026-06-23-w9-r2-tool-directory-system-custom-resource-tiers/00-overview.md`
- `docs/plans/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-overview.md`
- `docs/plans/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-overview.md`
- `docs/plans/2026-06-23-w16-r2-configuration-convention-overlay/00-overview.md`
- `docs/plans/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-overview.md`
- `packages/cli/src/cli.ts:77-244`
- `packages/cli/src/profile.ts:10-99`
- `packages/cli/src/manifest.ts:18-245`
- `packages/cli/src/catalog.ts:64-85`
- `packages/cli/src/rules.ts:130-194`
- `packages/cli/src/skill-catalog.ts:33-138`
- `packages/cli/src/skill-resolver.ts:40-226`
- `packages/cli/src/utils.ts:33-55`
- `packages/cli/package.json:9-25`
- `scripts/smoke-pack.mjs:60-246`

## Audience Paths

### Maintainer or Release Owner

Start with [01 Product Overview](01-product-overview.md), then [09 Dogfood and Maintainer Operations](09-dogfood-and-maintainer-operations.md), [10 Packaging, Validation, and Release Reference](10-packaging-validation-and-release-reference.md), and [16 Revise Package and Deployment Boundaries](16-revise-package-and-deployment-boundaries.md). Those docs explain why repo-root `docs/` and the release surface are product behavior, not side chores, via `packages/docs/README.md:86-121`, `packages/cli/src/utils.ts:33-55`, `packages/cli/package.json:9-25`, and `scripts/smoke-pack.mjs:60-246`.

### New Contributor

Start with [01 Product Overview](01-product-overview.md) and [02 Architecture Overview](02-architecture-overview.md), then read [05 Installation, Profile, and Manifest Lifecycle](05-installation-profile-and-manifest-lifecycle.md), [06 Template Contracts and Generated Assets](06-template-contracts-and-generated-assets.md), and [07 CLI Command Surface and Lifecycle](07-cli-command-surface-and-lifecycle.md). That path follows the actual flow from product framing into typed state in `packages/cli/src/types.ts:38-271`, asset resolution, and user-facing command behavior.

### Product or Technical Lead

Read [01 Product Overview](01-product-overview.md) and [02 Architecture Overview](02-architecture-overview.md) first, then [03 Open Questions and Risk Register](03-open-questions-and-risk-register.md), [05](05-installation-profile-and-manifest-lifecycle.md), [06](06-template-contracts-and-generated-assets.md), [08](08-skills-catalog-and-distribution.md), [09](09-dogfood-and-maintainer-operations.md), [10](10-packaging-validation-and-release-reference.md), [11](11-revise-cli-asset-selection-simplification.md), [12](12-revise-cli-skill-selection-simplification.md), [16](16-revise-package-and-deployment-boundaries.md), [17](17-revise-system-asset-materialization-contract.md), [18](18-revise-compatibility-audit-and-migration-disposition.md), [19](19-revise-template-package-dogfood-source-of-truth-contract.md), [20](20-revise-agent-harness-model-conformance-lab.md), [21](21-revise-tool-directory-system-custom-resource-tiers.md), [22](22-revise-new-docs-assets-playbooks-persona-model.md), [23](23-revise-generated-metadata-lifecycle-handoffs.md), [24](24-revise-configuration-convention-overlay.md), and [25](25-revise-cli-separation-and-mcp-boundary.md). Those docs concentrate the open contract choices around template modes, skills delivery, dogfood freshness, `packages/content`, release readiness, W14 simplifications, v2 package/deployment ownership, system asset materialization modes, existing-install migration safety, template/package source-of-truth order, harness/model evidence gating, tool-directory resource tiers, reader-facing guide/playbook persona assets, generated metadata handoffs, presentation-only project configuration, and CLI/MCP operation-boundary parity.

### AI Coding Assistant

Use [04 Glossary](04-glossary.md) first, then read [01](01-product-overview.md), [02](02-architecture-overview.md), [05](05-installation-profile-and-manifest-lifecycle.md) through [10](10-packaging-validation-and-release-reference.md) in order, then [16](16-revise-package-and-deployment-boundaries.md), [17](17-revise-system-asset-materialization-contract.md), [18](18-revise-compatibility-audit-and-migration-disposition.md), [19](19-revise-template-package-dogfood-source-of-truth-contract.md), [20](20-revise-agent-harness-model-conformance-lab.md), [21](21-revise-tool-directory-system-custom-resource-tiers.md), [22](22-revise-new-docs-assets-playbooks-persona-model.md), [23](23-revise-generated-metadata-lifecycle-handoffs.md), [24](24-revise-configuration-convention-overlay.md), and [25](25-revise-cli-separation-and-mcp-boundary.md), and finally use the paired backlog at [../assets/archive/work/2026-04-23-w12-r0-make-docs-prd-decomposition/00-index.md](../assets/archive/work/2026-04-23-w12-r0-make-docs-prd-decomposition/00-index.md) before planning edits. Do not treat repo-root `docs/`, home-scoped skills, `packages/content`, local bootstrap assets, provider/cache state, existing-install classification, template/package copy state, harness/model support claims, `.make-docs/**` tool-resource tiers, reader-facing guide/playbook persona assets, generated metadata handoffs, project-owned config overlays, or future MCP tool behavior as incidental; `README.md:10-17`, `packages/cli/src/manifest.ts:135-183`, `packages/cli/src/skill-catalog.ts:33-46`, [17-revise-system-asset-materialization-contract.md](17-revise-system-asset-materialization-contract.md), [18-revise-compatibility-audit-and-migration-disposition.md](18-revise-compatibility-audit-and-migration-disposition.md), [19-revise-template-package-dogfood-source-of-truth-contract.md](19-revise-template-package-dogfood-source-of-truth-contract.md), [20-revise-agent-harness-model-conformance-lab.md](20-revise-agent-harness-model-conformance-lab.md), [21-revise-tool-directory-system-custom-resource-tiers.md](21-revise-tool-directory-system-custom-resource-tiers.md), [22-revise-new-docs-assets-playbooks-persona-model.md](22-revise-new-docs-assets-playbooks-persona-model.md), [23-revise-generated-metadata-lifecycle-handoffs.md](23-revise-generated-metadata-lifecycle-handoffs.md), [24-revise-configuration-convention-overlay.md](24-revise-configuration-convention-overlay.md), and [25-revise-cli-separation-and-mcp-boundary.md](25-revise-cli-separation-and-mcp-boundary.md) make them part of the live boundary even where the future contract is still incomplete.

## Intended Follow-On

- Generate or reconcile the paired delta backlog under `docs/work/2026-06-23-w10-r1-package-and-deployment-boundaries/` before implementation begins.
- Generate or reconcile the paired delta backlog under `docs/work/2026-06-23-w10-r2-system-asset-materialization-contract/` before system asset materialization implementation begins.
- Generate or reconcile the paired delta backlog under `docs/work/2026-06-23-w10-r3-compatibility-audit-and-migration-disposition/` before compatibility migration implementation begins.
- Generate or reconcile the paired delta backlog under `docs/work/2026-06-23-w10-r4-template-package-dogfood-source-of-truth-contract/` before template/package/dogfood source-of-truth implementation begins.
- Generate or reconcile the paired delta backlog under `docs/work/2026-06-23-w10-r5-agent-harness-model-conformance-lab/` before conformance-lab implementation begins.
- Generate or reconcile the paired delta backlog under `docs/work/2026-06-23-w9-r2-tool-directory-system-custom-resource-tiers/` before tool-directory migration implementation begins.
- Generate or reconcile the paired delta backlog under `docs/work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/` before reader-facing guide/playbook and persona-schema implementation begins.
- Generate or reconcile the paired delta backlog under `docs/work/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/` before generated metadata and lifecycle handoff validation implementation begins.
- Generate or reconcile the paired delta backlog under `docs/work/2026-06-23-w16-r2-configuration-convention-overlay/` before configuration overlay implementation begins.
- Generate or reconcile the paired delta backlog under `docs/work/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/` before CLI/MCP boundary implementation begins.
- Keep package/release validation dry-run only until a separate user authorization allows registry, Homebrew, Crates, or npm publish actions.
- Preserve active-set evolution rules for future package, compatibility, Rust, MCP, and migration changes: append new PRD change docs, annotate affected baselines, and update this index plus the living risk register.
