# 17 Revise System Asset Materialization Contract

## Purpose

This revision records the effective system asset delivery and materialization contract for v2 Make Docs. It reconciles the accepted system asset design, the W10 R2 plan, and the W10 R7 runtime pivot into the active PRD set so downstream compatibility, migration, package dogfood, TypeScript CLI/MCP provider, and cache work does not reopen which asset modes exist or what local bootstrap must always remain inspectable.

The change keeps the TypeScript package as the source of truth for full-snapshot materialization while defining the requirements a TypeScript CLI/MCP provider, pinned cache, or later approved provider must satisfy before provider-backed behavior can be trusted.

## Change Type

Revision.

This document enhances active asset, template, manifest, package-validation, lifecycle-safety, skills-boundary, and TypeScript CLI/MCP provider requirements across the active PRD set.

## Baseline Being Revised or Removed

This revision updates these baseline assumptions:

- Full local materialization remains available and remains the default until provider-backed mode has implementation evidence across package-runner and TypeScript MCP environments.
- System asset materialization has three explicit modes: `full-snapshot`, `provider-backed`, and `hybrid-pinned-cache`.
- The local bootstrap is not optional and cannot be provider-backed.
- System assets are immutable product-owned resources. Mutable project artifacts, custom overlays, local config, and authored docs are not provider-resolved system assets.
- Skills and plugins are not folded into system asset materialization. They remain selected agentic assets with separate delivery and trust decisions.
- `.make-docs/` remains runtime state. `docs/assets/` remains readable documentation assets.
- Provider-backed and cache-backed behavior must preserve manifest, audit, backup, uninstall, conflict-review, and command-semantics contracts from [16-revise-package-and-deployment-boundaries.md](./16-revise-package-and-deployment-boundaries.md).

## Rationale

The accepted system asset design fixes the asset delivery contract before later Batch 1 work decides compatibility, migration disposition, template/package source of truth, dogfood freshness, runtime behavior, and MCP provider ownership. W10 R7 makes that provider path TypeScript-owned for v2. Without this revision, downstream work can conflate shipped immutable assets with mutable project docs, treat provider-backed behavior as a packaging side effect, or design cache behavior without pinning and recovery guarantees.

The live implementation is full-snapshot and static-template based. `packages/cli/src/catalog.ts` resolves selected system assets from the template bundle, `packages/cli/src/planner.ts` compares desired content against disk and manifest state, `packages/cli/src/install.ts` applies reviewed writes, and `packages/cli/src/manifest.ts` persists package metadata, selections, file hashes, source ids, and skill-file ownership. That implementation is a good full-snapshot baseline, but it does not yet encode materialization mode, provider identity, provider version, asset-set hash pins, offline policy, or recovery guidance.

The W10 R1 package-boundary revision and W10 R7 runtime pivot require TypeScript CLI and MCP paths to share durable manifest, audit, backup, uninstall, and user-facing command contracts. This revision extends that shared-contract boundary to system assets: a TypeScript CLI/MCP provider may serve immutable assets only if it does not make installed projects unreadable without the provider or bypass managed-file safety when materializing an asset on demand.

Code anchors:

- `packages/cli/src/rules.ts`
- `packages/cli/src/catalog.ts`
- `packages/cli/src/types.ts`
- `packages/cli/src/utils.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/system-assets.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/uninstall.ts`
- `packages/cli/src/skill-catalog.ts`
- `packages/cli/src/skill-resolver.ts`
- `packages/cli/tests/install.test.ts`
- `packages/cli/tests/audit.test.ts`
- `packages/cli/tests/system-assets.test.ts`
- `packages/cli/tests/consistency.test.ts`
- `scripts/smoke-pack.mjs`

## Effective Requirement

Materialization modes:

- `full-snapshot` materializes every selected system asset into the repository. It remains the safe default for v2.
- `provider-backed` keeps only the local bootstrap in the repository and resolves immutable system assets through an approved provider, such as the TypeScript CLI/MCP surface, the npm installer bundle, a later remote source, or another approved provider.
- `hybrid-pinned-cache` keeps the local bootstrap in the repository and resolves immutable system assets through a pinned cache whose manifest provenance proves the provider version and hash set.
- Provider-backed mode must be explicit opt-in or an explicit profile choice at first.
- Provider-backed mode must never appear as an accidental side effect of runtime packaging or MCP availability.

Local bootstrap:

- Every install mode must materialize active root and docs instruction routers for the selected harnesses.
- Every install mode must keep `.make-docs/manifest.json`.
- Every install mode must keep local config once v2 config exists.
- Every install mode must keep local custom overlays and project-owned overrides.
- Every install mode must include readable local guidance, in manifest/config state and router text where appropriate, that explains how system assets are resolved and what to do when a provider is unavailable.
- The local bootstrap is not optional and cannot be provider-backed.

System asset boundary:

- System assets are immutable product-owned resources: shipped contracts, workflow references, templates, prompt starters, instruction routers, and future helper surfaces that the installer owns.
- Mutable project artifacts are not provider-resolved system assets. This includes designs, plans, PRDs, work backlogs, authored guides, history records, local custom overlays, and local config.
- Skills and plugins are not system assets for this contract. They remain selected agentic assets with their own delivery, selection, trust, and audit decisions.
- Conformance-lab scenario specs, result records, raw transcripts, provider logs, and temporary run artifacts are not provider-resolved system assets. [20-revise-agent-harness-model-conformance-lab.md](./20-revise-agent-harness-model-conformance-lab.md) keeps them maintainer-only unless later promoted by design.
- `.make-docs/` remains runtime state; `docs/assets/` remains readable documentation assets. Manifests, conflicts, caches, and provider state do not move into `docs/assets/`.
- [21-revise-tool-directory-system-custom-resource-tiers.md](./21-revise-tool-directory-system-custom-resource-tiers.md) extends this boundary by defining `.make-docs/**` system/custom tool-resource tiers while preserving local bootstrap and keeping runtime state out of `docs/assets/**`.
- [26-revise-no-scripts-migration-skill-refactor.md](./26-revise-no-scripts-migration-skill-refactor.md) classifies first-party system helper scripts and thin compatibility wrappers as managed system resources only when they are shipped by make-docs; custom user scripts remain custom resources outside the migration.

### Change Notes

- Enhanced by [38-revise-global-store-and-project-state.md](./38-revise-global-store-and-project-state.md). W18 R10 introduces the machine-level operational store at `~/.make-docs/`, which is distinct from any provider-backed global asset cache: it holds mutable operational state — the install and directory registry, Playbook run-state, and work-execution evidence — never shipped template assets, is never pinned provider content, and its presence or absence must not weaken the non-optional local repository bootstrap; the materialization modes, cache pinning, and provenance rules here are unchanged.

Provider and cache provenance:

- The npm installer bundle is the current source of truth for full-snapshot materialization.
- The TypeScript CLI or MCP surface may become a provider for immutable system assets only after it preserves manifest, audit, backup, uninstall, and conflict-safety expectations.
- [25-revise-cli-separation-and-mcp-boundary.md](./25-revise-cli-separation-and-mcp-boundary.md) further requires CLI/MCP provider paths to keep local bootstrap readability and manifest provider/version/ref/hash/offline/recovery evidence, and prevents MCP from being the only place a repository can understand provider-backed state.
- A global cache is allowed only as a cache, not as an unpinned source of truth.
- A cached asset set must be pinned by provider identity, provider version or immutable ref, hash algorithm, and hash set.
- If the cache is missing or its hashes do not match, the CLI must rehydrate from an approved provider or fall back to a reviewed materialization path.
- The CLI must not silently use a different asset version.
- Remote sources are deferred as a provider class until Q-007's protocol, pinning, caching, trust, and confirmation policy is resolved.

Manifest provenance:

- The manifest must grow from per-file hash tracking into asset provenance tracking before provider-backed mode becomes reliable.
- For each materialized or provider-resolved asset set, the manifest needs to record materialization mode, source package or provider, source version or immutable ref, hash algorithm, expected hash set, logical asset id, local path when materialized, materialization class, offline expectation, recovery guidance, and selection trigger.
- Selection trigger must distinguish install profile, user selection, provider demand, and later config-driven demand.
- Manifest schema evolution must include compatibility handling for existing schema version 1 installs.
- [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md) makes this provenance evidence part of clean v2 classification: full-snapshot, provider-backed, and hybrid pinned-cache installs are clean only when manifest/provider/cache evidence is trustworthy enough to choose `sync`.

On-demand safety:

- On-demand materialization must go through the same safety path as ordinary install.
- If an on-demand write would overwrite local changes, it must be handled as a managed-file conflict or migration disposition.
- Provider refreshes must not overwrite local content invisibly.
- Backup and uninstall must continue to operate from a reviewed audit snapshot and must not infer removability from provider availability alone.

Validation boundary:

- Current package validation remains the baseline: `npm test -w packages/cli`, `npm run validate:defaults -w packages/cli`, `npm run build -w packages/cli`, `npm run smoke:pack`, template/package parity checks, bare-install checks proving no default skill files, and explicit selected-skill checks through `make-docs skills --selected-skills all`.
- Future provider/cache validation must add provider outage behavior, stale provider hashes, cache misses, on-demand conflict handling, and TypeScript CLI/MCP manifest compatibility.
- Provider-backed mode cannot become default until those checks exist and pass.

## Impacted Docs and Dependencies

| Area | Effective impact |
| --- | --- |
| `docs/prd/02-architecture-overview.md` | Enhances runtime boundaries with system asset modes, provider/cache provenance, and the non-provider-backed local bootstrap. |
| `docs/prd/05-installation-profile-and-manifest-lifecycle.md` | Enhances manifest state, offline policy, provider identity, cache pinning, compatibility, and on-demand conflict handling. |
| `docs/prd/06-template-contracts-and-generated-assets.md` | Enhances static-template full-snapshot behavior and separates immutable product-owned system assets from mutable project artifacts. |
| `docs/prd/07-cli-command-surface-and-lifecycle.md` | Enhances future user-facing mode selection, outage/recovery guidance, dry-run/review behavior, and conflict safety. |
| `docs/prd/08-skills-catalog-and-distribution.md` | Clarifies that skills and plugins remain selected agentic assets outside the system asset materialization mode model. |
| `docs/prd/10-packaging-validation-and-release-reference.md` | Enhances full-snapshot package validation and adds future provider/cache validation requirements. |
| `docs/prd/16-revise-package-and-deployment-boundaries.md` | Enhances the shared TypeScript CLI/MCP contract by defining how provider behavior must preserve system asset provenance and local bootstrap readability. |
| `docs/prd/18-revise-compatibility-audit-and-migration-disposition.md` | Enhances materialization with clean v2 classification rules for full-snapshot, provider-backed, and hybrid pinned-cache installs. |
| `docs/prd/03-open-questions-and-risk-register.md` | Updates existing asset, skill, remote-source, template, package, dogfood, lifecycle, and no-scripts entries without duplicating them. |

The paired delta backlog for implementation work should be generated under `docs/work/2026-06-23-w10-r2-system-asset-materialization-contract/` and trace back to this revision, the W10 R2 plan, the accepted system asset design, W10 R1 package-boundary revision, and current TypeScript CLI/package surfaces.

## Required Baseline Annotations

The following active PRD docs must carry `Change Notes` backlinks to this revision:

| Baseline doc | Note verb | Required note focus |
| --- | --- | --- |
| `docs/prd/02-architecture-overview.md` | Enhanced by | Runtime zones, provider/cache boundary, materialization modes, and local bootstrap. |
| `docs/prd/05-installation-profile-and-manifest-lifecycle.md` | Enhanced by | Manifest provenance, offline policy, asset-set pins, provider/cache identity, and on-demand conflict handling. |
| `docs/prd/06-template-contracts-and-generated-assets.md` | Enhanced by | Full-snapshot default, immutable system assets, mutable project artifacts, and local bootstrap ownership. |
| `docs/prd/07-cli-command-surface-and-lifecycle.md` | Enhanced by | Mode selection, provider outage language, dry-run/review behavior, and managed-file safety. |
| `docs/prd/08-skills-catalog-and-distribution.md` | Enhanced by | Skills and plugins remain outside system asset materialization modes. |
| `docs/prd/10-packaging-validation-and-release-reference.md` | Enhanced by | Package validation baseline plus future provider/cache checks. |
| `docs/prd/16-revise-package-and-deployment-boundaries.md` | Enhanced by | TypeScript CLI/MCP provider behavior must preserve shared contracts and local bootstrap readability. |

Do not add `Change Notes` to `docs/prd/03-open-questions-and-risk-register.md`; update its existing numbered D/Q/R items directly.

## Source Anchors

- `docs/designs/2026-06-19-system-asset-delivery-and-materialization-contract.md`
- `docs/designs/2026-06-19-package-and-deployment-boundaries.md`
- `docs/designs/2026-06-20-cli-separation-and-mcp-boundary.md`
- `docs/plans/2026-06-23-w10-r2-system-asset-materialization-contract/00-overview.md`
- `docs/plans/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-overview.md`
- `docs/prd/02-architecture-overview.md`
- `docs/prd/05-installation-profile-and-manifest-lifecycle.md`
- `docs/prd/06-template-contracts-and-generated-assets.md`
- `docs/prd/07-cli-command-surface-and-lifecycle.md`
- `docs/prd/08-skills-catalog-and-distribution.md`
- `docs/prd/10-packaging-validation-and-release-reference.md`
- `docs/prd/16-revise-package-and-deployment-boundaries.md`
- `docs/prd/03-open-questions-and-risk-register.md`
- `docs/prd/25-revise-cli-separation-and-mcp-boundary.md`
- `docs/prd/26-revise-no-scripts-migration-skill-refactor.md`
- `docs/designs/2026-06-20-no-scripts-migration-and-skill-refactor.md`
- `docs/plans/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-overview.md`
- `packages/cli/src/rules.ts`
- `packages/cli/src/catalog.ts`
- `packages/cli/src/utils.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/uninstall.ts`
- `packages/cli/src/skill-catalog.ts`
- `packages/cli/src/skill-resolver.ts`
- `packages/cli/tests/consistency.test.ts`
- `scripts/smoke-pack.mjs`
