# System Asset Delivery and Materialization Contract

## Purpose

Define how v2 system assets are delivered, resolved, materialized, and proven safe across the current TypeScript npm installer, the future Rust CLI/MCP surface, and any later provider-backed asset source.

This design decides the asset contract before Batch 1 moves into compatibility, migration, and template/package ownership. The main constraint is that make-docs must remain readable and recoverable from the repository itself: provider-backed resolution can reduce local duplication, but it must not replace the minimum local bootstrap that lets a human or agent understand the installed project when the CLI, MCP server, network, or global cache is unavailable.

## Context

This v2 design is being generated from artifact roadmap inputs as an intentional lifecycle straddle before the repo returns to the normal design -> plan -> PRD -> work -> implementation arc. The governing roadmap, [v2-proposed-design-and-roadmap.md](../artifacts/v2-proposed-design-and-roadmap.md), makes this the second design in Batch 1 because package boundaries must be stable before asset delivery can be decided, and asset delivery must be stable before migration and template ownership can be designed.

The accepted predecessor, [2026-06-19-package-and-deployment-boundaries.md](2026-06-19-package-and-deployment-boundaries.md), is stronger authority than the roadmap where they overlap. It keeps the TypeScript npm package as the npm and `npx` installer, assigns current package contents and manifest/audit/backup/uninstall/skills behavior to that package, and assigns long-term MCP startup ownership to the future Rust CLI. It also requires TypeScript and Rust implementations to share durable manifest and user-facing command contracts rather than fork them.

The current implementation is static-template based. The TypeScript CLI resolves package template bytes through package-root/template-root logic, plans desired assets from capability and harness selections, writes `.make-docs/manifest.json`, and tracks managed files by hash and source id. Current package validation copies `packages/docs/template/` into `packages/cli/template/`, then smoke-tests the packed package. Current smoke coverage also verifies that bare installs produce no skill files by default and that explicit `make-docs skills --selected-skills all` materializes selected skills separately.

Prior work matters but does not fully answer the v2 question. The archived asset-pipeline design, [2026-04-16-asset-pipeline-completeness.md](../assets/archive/designs/2026-04-16-asset-pipeline-completeness.md), added always-installed references/templates and preserved static reads for full default installs. The archived state design, [2026-04-20-docs-assets-state-and-history.md](../assets/archive/designs/2026-04-20-docs-assets-state-and-history.md), explored moving operational state under docs, but the current implementation keeps runtime state in `.make-docs/`. The archived namespace design, [2026-04-22-docs-assets-resource-namespace.md](../assets/archive/designs/2026-04-22-docs-assets-resource-namespace.md), established the template-first, dogfood-second invariant. The archived skill-selection design, [2026-04-28-cli-skill-selection-simplification.md](../assets/archive/designs/2026-04-28-cli-skill-selection-simplification.md), and later W17 correction moved the implementation away from public prompt/template/reference mode knobs and toward static template assets plus explicit selected-skill installation.

The evidence pass identified relevant history records: [2026-06-18-w17-r0-static-template-router-skill-correction.md](../assets/history/2026-06-18-w17-r0-static-template-router-skill-correction.md), [2026-04-28-w14-r0-p3-cli-asset-selection-model-and-manifest.md](../assets/history/2026-04-28-w14-r0-p3-cli-asset-selection-model-and-manifest.md), and [2026-06-18-w16-r0-template-dogfood-reconciliation.md](../assets/history/2026-06-18-w16-r0-template-dogfood-reconciliation.md). Together they show the current direction: static template bytes are authoritative, old asset-mode fields were removed from persisted installer state, and product assets must be restored to the template before dogfood parity is trusted.

The PRD/risk register should be referenced but not mutated by this design pass. Relevant entries in [03-open-questions-and-risk-register.md](../prd/03-open-questions-and-risk-register.md) include D-003, D-005, D-006, D-009, D-014, Q-001, Q-002, Q-004, Q-005, Q-007, Q-012, R-003, R-004, R-006, R-007, and R-014.

## Decision

v2 supports three explicit system asset materialization modes:

- `full-snapshot`: the installer materializes every selected system asset into the repository. This is the safe default for v2.
- `provider-backed`: the repository keeps only the local bootstrap and resolves immutable system assets through a provider, such as the Rust CLI/MCP surface, the npm installer bundle, a later remote source, or another approved provider.
- `hybrid-pinned-cache`: the repository keeps the local bootstrap and resolves immutable system assets through a pinned cache, with manifest provenance proving which provider version and hash set the cache represents.

Full local materialization remains available and remains the default until provider-backed mode has implementation evidence across npm-installed and Rust-installed environments. Provider-backed mode must be an explicit opt-in or explicit profile choice at first; it must never appear as an accidental side effect of the TypeScript/Rust split.

Every install mode must keep a minimum local bootstrap:

- active root and docs instruction routers for the selected harnesses;
- `.make-docs/manifest.json`;
- local config once v2 config exists;
- local custom overlays and project-owned overrides;
- a readable local explanation, in manifest/config state and router text where appropriate, of how system assets are resolved and what to do when a provider is unavailable.

The local bootstrap is not optional and cannot be provider-backed. If the CLI, MCP server, network, or global cache is unavailable, a human or agent must still be able to inspect the repository, identify that make-docs manages it, see which asset mode is active, and avoid destructive edits.

System assets are immutable product-owned resources. They include shipped contracts, workflow references, templates, prompt starters, instruction routers, and future helper surfaces that the installer owns. Mutable project artifacts, such as designs, plans, PRDs, work backlogs, authored guides, history records, local custom overlays, and local config, are not provider-resolved system assets. Skills and plugins are also not folded into the system asset materialization mode; they remain selected agentic assets with their own delivery and trust decisions.

The npm installer bundle is the current source of truth for full-snapshot materialization. In today's implementation, this means the TypeScript CLI reads static template bytes from the packaged template and records the resulting managed files in `.make-docs/manifest.json`. The future Rust CLI or MCP surface may become a provider for immutable system assets, but only after it preserves the same manifest, audit, backup, uninstall, and conflict-safety expectations.

A global cache is allowed only as a cache, not as an unpinned source of truth. A cached asset set must be pinned by provider identity, provider version or immutable ref, hash algorithm, and hash set. If the cache is missing or its hashes do not match, the CLI must either rehydrate from an approved provider or fall back to a reviewed materialization path. It must not silently use a different asset version.

Remote sources are deferred as a provider class. A later design may promote a remote source, but only after Q-007's protocol, pinning, caching, trust, and confirmation policy is resolved. Until then, remote source behavior used for selected skills must not be generalized into the system asset contract.

The manifest must grow from per-file hash tracking into asset provenance tracking before provider-backed mode can be relied on. For each materialized or provider-resolved asset set, the manifest needs to record:

- materialization mode;
- source package, bundle, provider, cache, or approved remote;
- source version, immutable ref, or package version;
- hash algorithm and expected hash set;
- logical asset id and local path when materialized;
- whether the asset is always local, on-demand materialized, or provider-resolved only;
- offline expectation and recovery guidance;
- whether the asset was selected by install profile, user selection, or provider demand.

On-demand materialization must go through the same safety path as ordinary install. If an on-demand asset write would overwrite a local change, it must be handled as a managed-file conflict or migration disposition, not as an invisible provider refresh.

`.make-docs/` remains runtime state. `docs/assets/` remains readable documentation assets. This design does not move manifests, conflicts, caches, or provider state into `docs/assets/` for tidiness. It also does not make root `docs/` the source of truth for shipped template-owned assets; that remains a later template/package/dogfood design, with `packages/docs/template/` as the implementation target identified by the roadmap.

## Alternatives Considered

Make provider-backed mode the v2 default. This was rejected because it would trade away the local readability and recovery guarantees before the Rust CLI, MCP surface, cache provenance, and offline behavior have implementation evidence.

Keep only full local snapshots forever. This would preserve the current static-template safety model, but it would not leave room for the Rust CLI/MCP provider direction, the no-scripts migration, or a lower-duplication install mode.

Use the old public prompt/template/reference mode model. This was rejected because W14 removed those fields from persisted installer state and narrowed asset selection to capability rules. V2 materialization modes are install/source-resolution modes, not a return to per-category user knobs.

Treat selected skills as system assets. This would simplify one manifest concept but would conflate immutable product contracts with selected agentic payloads. Skills have separate open delivery and trust questions, including Q-001, Q-007, and Q-012.

Move runtime state under `docs/assets/`. Earlier archived design work explored a docs-owned operational namespace, but the current implementation and risk model keep mutable installer state in `.make-docs/`. Keeping that boundary avoids mixing authored documentation with runtime state.

Allow unpinned global or remote provider resolution. This was rejected because it would make audits, backups, package validation, and reproducibility depend on mutable external state.

## Consequences

The next Batch 1 design can classify v1/v2 install states against a concrete asset contract. It can distinguish a full-snapshot install, a provider-backed install, a hybrid pinned-cache install, a malformed manifest, and a missing-provider state without reopening which modes exist.

The template/package/dogfood design can treat full-snapshot materialization as the package validation baseline. It still needs to define when `packages/docs/template/` is mutated, when root `docs/` is reseeded, and how `packages/cli/template/` and smoke-pack prove bundled installs receive the same system assets.

The Rust CLI and MCP designs inherit a stricter contract. They may resolve or serve immutable system assets, but they must preserve local bootstrap readability, pinned provenance, conflict review, manifest compatibility, and the existing backup/uninstall safety model.

The manifest schema will need a future revision before provider-backed mode becomes production default. Current schema version 1 records package metadata, selections, file hashes, source ids, and skill files; it does not yet encode full asset-set provenance, offline policy, provider identity, or cache pinning.

This design intentionally leaves several PRD/risk entries open. D-005/Q-001/Q-007 remain open for skills delivery and remote trust. D-006 remains open for package README/tarball allowlist alignment. D-009/Q-004 remain open for `packages/content`. Q-005/R-007 remain open for dogfood freshness proof. R-003/R-004 remain active until template/package parity and duplicated path surfaces are covered by stronger validation. R-006 remains the lifecycle-safety guardrail for backup/uninstall. R-014 remains active for the no-scripts transition.

Future implementation validation should include current package checks plus new provider-mode checks. Existing checks include `npm test -w packages/cli`, `npm run validate:defaults -w packages/cli`, `npm run build -w packages/cli`, `npm run smoke:pack`, template/package parity checks, bare-install checks that prove `skillFiles: 0`, and explicit selected-skill checks through `make-docs skills --selected-skills all`. New checks will need to cover provider outage behavior, stale provider hashes, cache misses, on-demand conflict handling, and TypeScript/Rust manifest compatibility.

## Design Lineage

Update Mode: new-doc-related.

Prior Design Docs:

- [2026-06-19-package-and-deployment-boundaries.md](2026-06-19-package-and-deployment-boundaries.md)
- [2026-04-16-asset-pipeline-completeness.md](../assets/archive/designs/2026-04-16-asset-pipeline-completeness.md)
- [2026-04-20-docs-assets-state-and-history.md](../assets/archive/designs/2026-04-20-docs-assets-state-and-history.md)
- [2026-04-22-docs-assets-resource-namespace.md](../assets/archive/designs/2026-04-22-docs-assets-resource-namespace.md)
- [2026-04-28-cli-skill-selection-simplification.md](../assets/archive/designs/2026-04-28-cli-skill-selection-simplification.md)

Reason: This design extends the accepted Batch 1 package boundary into the system asset contract. It also reconciles earlier asset-pipeline and docs-assets intent with the newer static-template, no-default-skills, and template-first evidence. It does not edit or backlink those prior designs.

## Intended Follow-On

Route: change-plan

Next Prompt: [designs-to-plan-change.prompt.md](../assets/prompts/designs-to-plan-change.prompt.md)

Why: This design changes and extends existing installer, template, manifest, package, and dogfood behavior rather than establishing a fresh baseline. It should feed additive change planning against the active PRD namespace after the complete v2 design set is accepted.

Coordinate Handoff: Prior lineage anchors include W17 R0, W14 R0/R1, W9 R1, and the accepted Batch 1 package boundary design; recommended downstream W/R coordinate unresolved; planner must resolve before writing.
