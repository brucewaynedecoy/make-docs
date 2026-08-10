# 17 System Asset Materialization and Local Bootstrap

## Purpose

This document defines the current product contract for system-asset provenance, materialization modes, cache safety, and local bootstrap. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns system-asset provenance, materialization modes, cache safety, and local bootstrap. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

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
- Conformance-lab scenario specs, result records, raw transcripts, provider logs, and temporary run artifacts are not provider-resolved system assets. [20-agent-harness-conformance-and-support-claims.md](./20-agent-harness-conformance-and-support-claims.md), PRD 43, and PRD 44 keep them maintainer-only unless those owning PRDs are authoritatively updated to promote a reviewed subset.
- `.make-docs/` remains runtime state; `docs/assets/` remains readable documentation assets. Manifests, conflicts, caches, and provider state do not move into `docs/assets/`.
- [21-project-tool-directory-and-resource-tiers.md](./21-project-tool-directory-and-resource-tiers.md) extends this boundary by defining `.make-docs/**` system/custom tool-resource tiers while preserving local bootstrap and keeping runtime state out of `docs/assets/**`.
- [25-typescript-runtime-cli-mcp-operation-boundaries.md](./25-typescript-runtime-cli-mcp-operation-boundaries.md) classifies first-party system helper scripts and thin compatibility wrappers as managed system resources only when they are shipped by make-docs; custom user scripts remain custom resources outside the migration.

- The machine-level operational store at `~/.make-docs/` is distinct from any provider-backed global asset cache: it holds mutable operational state such as the install and directory registry, playbook run state, and work-execution evidence; it never holds shipped template assets or pinned provider content. Its presence or absence must not weaken the non-optional local repository bootstrap, materialization modes, cache pinning, or provenance rules.

Provider and cache provenance:

- The npm installer bundle is the current source of truth for full-snapshot materialization.
- The TypeScript CLI or MCP surface may become a provider for immutable system assets only after it preserves manifest, audit, backup, uninstall, and conflict-safety expectations.
- [25-typescript-runtime-cli-mcp-operation-boundaries.md](./25-typescript-runtime-cli-mcp-operation-boundaries.md) further requires CLI/MCP provider paths to keep local bootstrap readability and manifest provider/version/ref/hash/offline/recovery evidence, and prevents MCP from being the only place a repository can understand provider-backed state.
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
- [18-compatibility-classification-and-migration-safety.md](./18-compatibility-classification-and-migration-safety.md) makes this provenance evidence part of clean v2 classification: full-snapshot, provider-backed, and hybrid pinned-cache installs are clean only when manifest/provider/cache evidence is trustworthy enough to choose `sync`.

On-demand safety:

- On-demand materialization must go through the same safety path as ordinary install.
- If an on-demand write would overwrite local changes, it must be handled as a managed-file conflict or migration disposition.
- Provider refreshes must not overwrite local content invisibly.
- Backup and uninstall must continue to operate from a reviewed audit snapshot and must not infer removability from provider availability alone.

Validation boundary:

- Current package validation remains the baseline: `npm test -w packages/cli`, `npm run validate:defaults -w packages/cli`, `npm run build -w packages/cli`, `npm run smoke:pack`, template/package parity checks, bare-install checks proving no default skill files, and explicit selected-skill checks through `make-docs setup skills --selected-skills all`.
- Future provider/cache validation must add provider outage behavior, stale provider hashes, cache misses, on-demand conflict handling, and TypeScript CLI/MCP manifest compatibility.
- Provider-backed mode cannot become default until those checks exist and pass.
## Contracts and Data

The named paths, schemas, state records, metadata fields, and evidence shapes in Requirements are normative contracts for this capability.
## Integrations

This capability integrates with the adjacent current authorities linked from Requirements and Source Anchors; those authorities remain owners of their own boundaries.
## Rebuild Notes

A rebuild must preserve the requirement identifiers, stable semantic anchors, ownership boundaries, and failure-safe behavior stated here. Implementation evidence does not silently weaken this authority.
## Requirement History

### 2026-08-08 — W10 R2

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document now states the current system-asset provenance, materialization modes, cache safety, and local bootstrap requirements inline as product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [System asset materialization design](../designs/2026-06-19-system-asset-delivery-and-materialization-contract.md)
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
- `docs/prd/16-package-runtime-and-deployment-boundaries.md`
- `docs/prd/03-open-questions-and-risk-register.md`
- `docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md`
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
