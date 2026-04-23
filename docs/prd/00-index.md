# Make Docs PRD Index

## Purpose

This index orients maintainers, product owners, and AI coding agents through the active `make-docs` PRD set. The live product spans the publishable CLI in `packages/cli/`, the source-of-truth template in `packages/docs/template/`, the repo-root dogfood docs under `docs/`, and the packaging and validation scripts under `scripts/`; that split is encoded in `README.md:6-46`, `docs/prd/01-product-overview.md`, `docs/prd/02-architecture-overview.md`, `packages/cli/src/utils.ts:33-55`, and `packages/cli/package.json:9-25`.

The fixed-core overview layer is now present through [01 Product Overview](01-product-overview.md) and [02 Architecture Overview](02-architecture-overview.md). The subsystem docs `05` through `10`, the shared status docs [03 Open Questions and Risk Register](03-open-questions-and-risk-register.md) and [04 Glossary](04-glossary.md), and the paired rebuild backlog at [2026-04-23 W12 R0 Make Docs PRD Decomposition](../work/2026-04-23-w12-r0-make-docs-prd-decomposition/00-index.md) extend that core with implementation-level detail grounded in live code such as `packages/cli/src/cli.ts:77-244`, `packages/cli/src/catalog.ts:64-85`, and `scripts/smoke-pack.mjs:60-246`.

## Reading Order

1. Read [01 Product Overview](01-product-overview.md) and [02 Architecture Overview](02-architecture-overview.md) first. They establish the user model, runtime zones, module map, and configuration surfaces for the rest of the set.
2. Read [05 Installation, Profile, and Manifest Lifecycle](05-installation-profile-and-manifest-lifecycle.md), [06 Template Contracts and Generated Assets](06-template-contracts-and-generated-assets.md), [07 CLI Command Surface and Lifecycle](07-cli-command-surface-and-lifecycle.md), [08 Skills Catalog and Distribution](08-skills-catalog-and-distribution.md), [09 Dogfood and Maintainer Operations](09-dogfood-and-maintainer-operations.md), and [10 Packaging, Validation, and Release Reference](10-packaging-validation-and-release-reference.md) in that order. That sequence follows the live dependency chain from `packages/cli/src/profile.ts:10-99` and `packages/cli/src/manifest.ts:18-245` into `packages/cli/src/catalog.ts:64-85`, `packages/cli/src/cli.ts:77-244`, `packages/cli/src/skill-catalog.ts:33-138`, `packages/cli/src/utils.ts:33-55`, and `scripts/smoke-pack.mjs:60-246`.
3. Read [03 Open Questions and Risk Register](03-open-questions-and-risk-register.md) after the subsystem docs to see where the current implementation and the current documentation still diverge, especially around `packages/cli/src/rules.ts:130-194`, `packages/cli/src/skill-resolver.ts:40-226`, and `packages/cli/package.json:9-25`.
4. Use [04 Glossary](04-glossary.md) whenever a term comes from the typed install, asset, skills, or lifecycle contracts in `packages/cli/src/types.ts:38-271`.
5. Use the paired backlog at [docs/work/2026-04-23-w12-r0-make-docs-prd-decomposition/00-index.md](../work/2026-04-23-w12-r0-make-docs-prd-decomposition/00-index.md) when you need dependency-ordered implementation work rather than descriptive product context.

## Document Map

| Slot | Status | Document | Focus |
| --- | --- | --- | --- |
| `00` | Current | [00-index.md](00-index.md) | Entry point for the active PRD set and the paired backlog. |
| `01` | Current | [01-product-overview.md](01-product-overview.md) | Product purpose, users, key capabilities, system boundaries, and current limitations. |
| `02` | Current | [02-architecture-overview.md](02-architecture-overview.md) | Runtime zones, module map, runtime boundaries, data flow, and configuration surfaces. |
| `03` | Current | [03-open-questions-and-risk-register.md](03-open-questions-and-risk-register.md) | Shared drift log, open contract questions, and rebuild risks synthesized from live code and docs. |
| `04` | Current | [04-glossary.md](04-glossary.md) | Shared vocabulary for `InstallSelections`, `ResolvedAsset`, `AuditReport`, and dogfood/release terms. |
| `05` | Current | [05-installation-profile-and-manifest-lifecycle.md](05-installation-profile-and-manifest-lifecycle.md) | Installer intent, capability dependencies, planner/apply flow, manifest state, conflict handling, and lifecycle safety boundaries. |
| `06` | Current | [06-template-contracts-and-generated-assets.md](06-template-contracts-and-generated-assets.md) | Template package ownership, asset selection rules, router rendering, and generated docs contract surfaces. |
| `07` | Current | [07-cli-command-surface-and-lifecycle.md](07-cli-command-surface-and-lifecycle.md) | Public CLI taxonomy, wizard/review behavior, help, backup, uninstall, and audit-backed lifecycle UX. |
| `08` | Current | [08-skills-catalog-and-distribution.md](08-skills-catalog-and-distribution.md) | Skills command, registry/resolver model, project vs global scope, and current distribution mechanics. |
| `09` | Current | [09-dogfood-and-maintainer-operations.md](09-dogfood-and-maintainer-operations.md) | Repo-root `docs/` as a first-class dogfood runtime surface and maintainer workflow boundary. |
| `10` | Current | [10-packaging-validation-and-release-reference.md](10-packaging-validation-and-release-reference.md) | Package allowlist, prepack/template copy flow, smoke-pack validation, and release-surface reference. |

## Source Anchors

- `README.md:6-46`
- `docs/assets/references/output-contract.md`
- `docs/assets/references/execution-workflow.md`
- `docs/prd/01-product-overview.md`
- `docs/prd/02-architecture-overview.md`
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

Start with [01 Product Overview](01-product-overview.md), then [09 Dogfood and Maintainer Operations](09-dogfood-and-maintainer-operations.md), then [10 Packaging, Validation, and Release Reference](10-packaging-validation-and-release-reference.md). Those docs explain why repo-root `docs/` and the release surface are product behavior, not side chores, via `packages/docs/README.md:86-121`, `packages/cli/src/utils.ts:33-55`, `packages/cli/package.json:9-25`, and `scripts/smoke-pack.mjs:60-246`.

### New Contributor

Start with [01 Product Overview](01-product-overview.md) and [02 Architecture Overview](02-architecture-overview.md), then read [05 Installation, Profile, and Manifest Lifecycle](05-installation-profile-and-manifest-lifecycle.md), [06 Template Contracts and Generated Assets](06-template-contracts-and-generated-assets.md), and [07 CLI Command Surface and Lifecycle](07-cli-command-surface-and-lifecycle.md). That path follows the actual flow from product framing into typed state in `packages/cli/src/types.ts:38-271`, asset resolution, and user-facing command behavior.

### Product or Technical Lead

Read [01 Product Overview](01-product-overview.md) and [02 Architecture Overview](02-architecture-overview.md) first, then [03 Open Questions and Risk Register](03-open-questions-and-risk-register.md), [05](05-installation-profile-and-manifest-lifecycle.md), [06](06-template-contracts-and-generated-assets.md), [08](08-skills-catalog-and-distribution.md), and [10](10-packaging-validation-and-release-reference.md). Those docs concentrate the open contract choices around template modes, skills delivery, `packages/content`, and release readiness.

### AI Coding Assistant

Use [04 Glossary](04-glossary.md) first, then read [01](01-product-overview.md), [02](02-architecture-overview.md), and [05](05-installation-profile-and-manifest-lifecycle.md) through [10](10-packaging-validation-and-release-reference.md) in order, and finally use the paired backlog at [../work/2026-04-23-w12-r0-make-docs-prd-decomposition/00-index.md](../work/2026-04-23-w12-r0-make-docs-prd-decomposition/00-index.md) before planning edits. Do not treat repo-root `docs/`, home-scoped skills, or `packages/content` as incidental; `README.md:10-17`, `packages/cli/src/manifest.ts:135-183`, and `packages/cli/src/skill-catalog.ts:33-46` make them part of the live boundary even where the future contract is still incomplete.
