# Tool Directory System and Custom Resource Tiers

## Purpose

Define the v2 in-project tool directory model for make-docs-owned resources.

This design decides which product-owned contracts, workflow references, templates, prompt starters, instruction routers, and deterministic helper surfaces belong under `.make-docs/`, how system and custom tiers interact, and how that local shape works with the accepted Batch 1 materialization modes.

## Context

Batch 2 defines the canonical information architecture after Batch 1 settled package, materialization, migration, and source-of-truth boundaries. The active roadmap places this design before reader-facing assets, persona schema, generated metadata, and configuration overlays because those later designs need a stable answer for the current template-owned `docs/assets/**` content.

This design uses artifact roadmap inputs as explicit source material. That is an intentional lifecycle straddle before returning to the default arc documented in `.make-docs/references/system/lifecycle.md`: design -> plan -> PRD -> work -> implementation. The roadmap inputs are not themselves lifecycle stages or implementation authority.

The accepted Batch 1 materialization contract defines three install modes: `full-snapshot`, `provider-backed`, and `hybrid-pinned-cache`. It also requires a local bootstrap in every mode: selected root/docs instruction routers, `.make-docs/manifest.json`, local config once it exists, local custom overlays, and enough readable guidance for a human or agent to understand the repository without the CLI, MCP server, network, or global cache.

The accepted source-of-truth contract defines `packages/docs/template/` as the first mutation target for shipped template-owned assets, root `docs/` as dogfood validation, and `packages/cli/template/` as the package-bundled copy. This design applies that ownership model to the proposed tool directory; it does not make root `docs/` the product source of truth.

Today, many product-owned resources live in `docs/assets/{prompts,references,templates}/`, and one deterministic helper already installs under `.make-docs/scripts/check_path_hygiene.py`. Current code mirrors that split through `packages/cli/src/rules.ts`, `packages/cli/src/catalog.ts`, `packages/cli/src/planner.ts`, `packages/cli/src/manifest.ts`, and the audit/backup/install tests. The new design must preserve compatibility and conflict safety while giving later Batch 2 designs room to reuse `docs/assets/` for reader-facing guides and playbooks.

## Decision

Use `.make-docs/` as the in-project tool directory for make-docs-owned tool resources and runtime state. Keep `docs/` as the project documentation tree and keep future reader-facing reusable documentation assets under `docs/assets/**`, after current template-owned tool assets have a migration path.

The v2 tool directory has these logical surfaces:

```text
.make-docs/
  AGENTS.md
  CLAUDE.md
  config.yaml
  manifest.json
  conflicts/
  contracts/
    system/
    custom/
  references/
    system/
    custom/
  templates/
    system/
    custom/
  prompts/
    system/
    custom/
  scripts/
    system/
    custom/
  agentics/
    skills/
    plugins/
```

`manifest.json`, `conflicts/`, provider/cache metadata, audit state, and temporary run state remain runtime state. They are never moved into `docs/assets/` for tidiness.

`contracts/`, `references/`, `templates/`, `prompts/`, and `scripts/` are tool resource families. Each family has two tiers:

- `system/`: make-docs-owned resources selected by the installer profile or resolved through an approved provider/cache. System resources are immutable from the project perspective; local edits are handled as managed-file conflicts or custom overlays, not silent upstream edits.
- `custom/`: project-owned overrides, additions, and overlays. Custom resources are local project content and must not be overwritten by install, reconfigure, provider refresh, or cache rehydration unless a later plan defines an explicit user-approved replacement flow.

The `system/` tier does not imply every resource is always physically materialized in every repository. In `full-snapshot` mode, selected system resources are local files. In `provider-backed` mode, only the required local bootstrap is guaranteed local, and provider-resolved system resources are identified through manifest provenance. In `hybrid-pinned-cache` mode, the repository keeps local bootstrap plus pinned cache provenance. Any provider or cache use must preserve the Batch 1 requirements for provider identity, version or immutable ref, hash algorithm, expected hash set, offline behavior, and recovery guidance.

The local bootstrap remains materially local in every mode. At minimum, it includes selected instruction routers, `.make-docs/manifest.json`, local config once implemented, local custom overlays, and readable guidance explaining the active materialization mode and what to do when a provider or cache is unavailable. The bootstrap may reference provider-backed system resources, but it cannot require those resources to understand that make-docs manages the repository.

Managed instruction routers continue to use managed blocks. Root and docs routers may point to `.make-docs/` tool resources when those resources are local, or to manifest-described providers when provider-backed mode is active. Router text must not send agents into hidden provider-only state without a local explanation. If a router update collides with local edits, existing managed-file conflict rules apply.

Current template-owned `docs/assets/{prompts,references,templates}/` content should migrate toward `.make-docs/{prompts,references,templates}/system/` only through a later implementation plan. Until that plan lands, active docs and code continue to reflect the current installed shape. The design direction is that product-owned contracts, workflow references, prompt starters, structural templates, and deterministic helper surfaces belong to the tool directory, while future reader-facing docs assets such as guides and playbooks belong under `docs/assets/**`.

`agentics/` is reserved as the future shared install surface for selected skills and plugins, but this design does not settle shared skill/plugin delivery. Skills remain optional selected agentic assets, not system assets. The later skill-purpose and shared-agentics designs must decide whether `agentics/skills` and `agentics/plugins` use filesystem redirection, CLI routing, generated harness stubs, or a hybrid model.

Implementation must treat the proposed directory model as a product-owned template change. Shipped defaults start in `packages/docs/template/`, are dogfooded into root `docs/` or `.make-docs/` only for selected template-owned files, and are bundled into `packages/cli/template/` through the package copy/prepack path.

## Alternatives Considered

Keep all tool resources under `docs/assets/**`.

This preserves the current resource namespace, but it blocks the Batch 2 reader-facing assets model. It also keeps machine-oriented contracts, prompt starters, templates, and helper surfaces mixed with future user-facing guides and playbooks.

Move all make-docs state and resources under `.make-docs/**`.

This makes the boundary simple for the CLI, but it would hide too much of the project-readable documentation model. The local bootstrap and active docs routers still need to explain make-docs behavior without requiring a CLI, provider, or global cache.

Materialize every system resource into every repository.

This is safe and remains the default through `full-snapshot`, but Batch 1 deliberately allows provider-backed and hybrid pinned-cache modes once manifest provenance and implementation evidence exist. The tool directory should support those modes without forcing permanent local replication of every immutable resource.

Treat `custom/` as mutable edits inside `system/`.

This would make overrides look like upstream product changes and would weaken audit, backup, reconfigure, and provider-refresh safety. Separate tiers make ownership explicit and let future validation distinguish product drift from local customization.

Settle shared skills and plugins in this design.

The proposed `agentics/` directory is relevant to the tool directory shape, but shared skill/plugin install depends on cross-platform redirection, trust, purpose ids, and config-aware routing. Those decisions belong to later Batch 3 and Batch 4 designs.

## Consequences

Later Batch 2 designs can reuse `docs/assets/` for reader-facing assets only after they respect this migration boundary: current template-owned tool resources need a planned destination under `.make-docs/**`, while project-authored docs remain in the documentation tree.

The manifest must eventually describe both file ownership and tool-resource provenance. Schema version 1 can track managed file hashes and selected skill files, but provider-backed and hybrid modes require more explicit records for materialization mode, provider identity, provider version or immutable ref, hash set, local path when materialized, and offline recovery.

Implementation planning must update literal path surfaces carefully. Relevant source and validation surfaces include `packages/cli/src/rules.ts`, `packages/cli/src/catalog.ts`, `packages/cli/src/planner.ts`, `packages/cli/src/manifest.ts`, `packages/cli/src/audit.ts`, `packages/cli/src/backup.ts`, `packages/cli/src/install.ts`, `packages/cli/src/managed-block.ts`, package template copying, smoke-pack validation, and consistency tests.

The design references but does not mutate the PRD/risk register. Relevant open or recently resolved items include `D-008` for historical hidden-dot paths, `D-007`, `Q-005`, and `R-007` for dogfood freshness, `D-014` for template-first source of truth, `R-003` for packed-template drift, `R-004` for duplicated path knowledge, `R-006` for one reviewed audit snapshot, `R-014` for the no-scripts transition, and `Q-007`/`Q-012` for remote and shared skill delivery.

Future validation should include `npm test -w packages/cli`, `npm run validate:defaults -w packages/cli`, `npm run build -w packages/cli`, `npm run smoke:pack`, template/dogfood parity checks for resources expected to match, managed-block/router checks, audit/backup/uninstall lifecycle tests, and new fixtures for provider/cache missing or stale states once those modes are implemented.

## Design Lineage

Update Mode: `new-doc-related`

Prior Design Docs: [Package and Deployment Boundaries](2026-06-19-package-and-deployment-boundaries.md), [System Asset Delivery and Materialization Contract](2026-06-19-system-asset-delivery-and-materialization-contract.md), [Compatibility, Audit, and Migration Disposition](2026-06-19-compatibility-audit-and-migration-disposition.md), [Template, Package, and Dogfood Source-of-Truth Contract](2026-06-19-template-package-and-dogfood-source-of-truth-contract.md), [Docs Assets Resource Namespace Overhaul](../assets/archive/designs/2026-04-22-docs-assets-resource-namespace.md), [CLI Asset Selection Simplification](../assets/archive/designs/2026-04-28-cli-asset-selection-simplification.md)

Reason: This design extends the accepted Batch 1 v2 contracts into the concrete tool-directory information architecture. It also materially updates the older docs-assets namespace intent by moving make-docs-owned tool resources out of the future reader-facing `docs/assets/**` model while preserving `.make-docs/**` runtime state and local bootstrap readability.

## Intended Follow-On

Route: `change-plan`

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/references/system/prompts/designs-to-plan-change.prompt.md)

Why: This design revises and standardizes existing make-docs installer, template, manifest, docs-assets, managed-router, and dogfood/package behavior rather than starting a fresh baseline. It should feed additive change planning against the active make-docs PRD/risk namespace after the full v2 design set is accepted.

Coordinate Handoff: prior lineage anchors include W9 R1 resource namespace work, W14 asset selection work, W16 R0 template/dogfood reconciliation, W17 R0 static template/router correction, and the accepted Batch 1 v2 designs; recommended downstream W/R coordinate unresolved; planner must resolve before writing.
