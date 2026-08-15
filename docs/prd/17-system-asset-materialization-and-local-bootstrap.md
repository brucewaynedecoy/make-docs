# 17 System Asset Materialization and Local Bootstrap

## Purpose

This document defines the current product contract for system-resource provenance, optional local projection, cache safety, and local bootstrap. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns system-resource provenance, optional local projection, cache safety, and local bootstrap. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

Projection and compatibility modes:

- The default is machine-served resolution from the installed package provider with no repository snapshot of system resources.
- Local projection is optional and explicit. A selection may project none, one or more resource types, or the full system-resource inventory into `.make-docs/system/{contracts,prompts,references,templates}/`.
- A local projection is not a competing source of truth. The manifest records its provider origin, immutable provider version or ref, resource URI, expected hash, local path, and ownership state.
- Existing `full-snapshot`, provider-backed, or pinned-cache installs are compatibility inputs, not alternate current authority. Migration classifies their provenance and either adopts a trustworthy projection, refreshes it through the managed-file safety path, or leaves divergent local content for review.
- Remote providers and shared caches remain deferred until their trust, pinning, caching, confirmation, and recovery policy is authoritatively accepted.

Local bootstrap:

- Every install must materialize active root, `.make-docs/`, and docs instruction routers for the selected supported harnesses.
- Every install must keep `.make-docs/manifest.json`.
- Every install must keep local config once v2 config exists.
- Every install must keep local custom overlays and project-owned overrides.
- The local bootstrap must include readable manifest/config state and router guidance that explains installed-provider resolution, selected projections, provenance, and unavailable-provider recovery.
- The local bootstrap is always repository-readable; the four content-resource families do not need local projection for CLI or MCP access.

System asset boundary:

- System resources are immutable product-owned contracts, prompts, references, and templates. Their stable identities are `make-docs://system/<type>/<posix-relative-path>` where `<type>` is singular `contract`, `prompt`, `reference`, or `template` and the remaining path uses POSIX separators.
- Instruction routers are installed bootstrap assets rather than a fifth content-resource type. Deterministic runtime helpers are package code, not content resources.
- Mutable project artifacts are not provider-resolved system assets. This includes designs, plans, PRDs, work backlogs, authored guides, history records, local custom overlays, and local config.
- Skills and plugins are not system assets for this contract. They remain selected agentic assets with their own delivery, selection, trust, and audit decisions.
- Conformance-lab scenario specs, result records, raw transcripts, provider logs, and temporary run artifacts are not provider-resolved system assets. [20-agent-harness-conformance-and-support-claims.md](./20-agent-harness-conformance-and-support-claims.md), PRD 43, and PRD 44 keep them maintainer-only unless those owning PRDs are authoritatively updated to promote a reviewed subset.
- `.make-docs/` holds manifest/config/bootstrap state and any selected local projection; `docs/assets/` remains readable project documentation assets. Manifests, conflicts, caches, and provider state do not move into `docs/assets/`.
- [21-project-tool-directory-and-resource-tiers.md](./21-project-tool-directory-and-resource-tiers.md) extends this boundary by defining the optional `.make-docs/system/**` projection and project-owned overlays while preserving local bootstrap and keeping runtime state out of `docs/assets/**`.
- Playbooks and Protocols are not system-resource types, projection families, provider content kinds, or runtime authorities.

- The machine-level operational Store at `~/.make-docs/` is distinct from the installed resource provider: it holds mutable registry state and bounded lifecycle `runs` and `run_evidence`, while shipped template resources remain package content. Legacy `playbook_runs` rows, when present, remain opaque and untouched by lifecycle migration. Store availability must not weaken repository bootstrap, resolver precedence, projection provenance, or conflict safety; `run-capture-unavailable` is ancillary when a command can otherwise complete.

Provider and cache provenance:

- `packages/docs/template/` is upstream authoring authority; package preparation builds the installed provider from it, and the provider is the default runtime source.
- The canonical resolver applies one precedence rule for both CLI and MCP: a trustworthy selected local projection first, then the installed provider, otherwise a typed unavailable or integrity error. Divergent, untrusted, or stale local files do not silently shadow the provider.
- CLI `resource list` and `resource read` are canonical. Native MCP discovery/read expose the same URI inventory and bytes where the SDK supports native resources; MCP tools cover resource operations that are not native.
- A global cache is allowed only as a cache, not as an unpinned source of truth.
- A cached or projected resource set must be pinned by provider identity, provider version or immutable ref, hash algorithm, and hash set.
- If cached or projected hashes do not match, the CLI must resolve from the installed provider or require a reviewed refresh path.
- The CLI must not silently use a different asset version.
- Remote sources are deferred as a provider class until their pinning, caching, trust, confirmation, and recovery policy is resolved.

Manifest provenance:

- The manifest records resource provenance before any local projection is treated as trustworthy.
- For each projected or provider-resolved resource set, the manifest records provider, provider version or immutable ref, hash algorithm, expected hash set, stable resource URI, local path when projected, projection/ownership state, offline expectation, recovery guidance, and selection trigger.
- Selection provenance must distinguish default machine-served access, explicit setup or reconfiguration choice, saved manifest reuse, and reviewed migration or adoption.
- Manifest schema evolution must include compatibility handling for existing schema version 1 installs.
- [18-compatibility-classification-and-migration-safety.md](./18-compatibility-classification-and-migration-safety.md) makes this provenance evidence part of clean v2 classification: an existing snapshot or cache is clean only when provider and hash evidence is trustworthy enough to choose `sync` or adopt it as a current projection.

On-demand safety:

- On-demand materialization must go through the same safety path as ordinary install.
- If an on-demand write would overwrite local changes, it must be handled as a managed-file conflict or migration disposition.
- Provider refreshes must not overwrite local content invisibly.
- Backup and uninstall must continue to operate from a reviewed audit snapshot and must not infer removability from provider availability alone.

Validation boundary:

- Current package validation remains the baseline: `npm test -w packages/cli`, `npm run validate:defaults -w packages/cli`, `npm run build -w packages/cli`, `npm run smoke:pack`, template/package parity checks, bare-install checks proving no default skill files, and explicit selected-skill checks through `make-docs setup skills --selected-skills all`.
- Resource validation must cover installed-provider availability without projection, all four peer resource types, URI normalization and traversal rejection, trustworthy local-first precedence, stale projection hashes, on-demand conflict handling, CLI/native-MCP parity where supported, and manifest compatibility.
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

### 2026-08-14 — W19 R1

- Date: 2026-08-14
- Coordinate: W19 R1
- Affected requirement or section: `Purpose`, `Scope`, `Projection and compatibility modes`, `Local bootstrap`, `System asset boundary`, `Provider and cache provenance`, `Manifest provenance`, `On-demand safety`, and `Validation boundary`
- Previous contract: Full repository snapshots were the safe default, provider access was opt-in, local system paths were mandatory, and mutable Store state included Playbook runs.
- Replacement contract: The installed package provider is the default; contracts, prompts, references, and templates share stable URIs and one CLI/MCP resolver; local `.make-docs/system/**` projection is optional and provenance-aware; Playbooks and Protocols are absent; and the Store records bounded lifecycle runs and evidence while preserving legacy rows opaquely.
- Rationale: Materialization authority must separate runtime availability from optional project projection and preserve recovery safety across existing installs.
- Source: [Accepted recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

## Source Anchors

- [Accepted recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
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
