# 21 Revise Tool Directory System and Custom Resource Tiers

## Purpose

Define the v2 in-project tool directory model for make-docs-owned resources.

This change decides which product-owned contracts, workflow references, templates, instruction routers, deterministic helper surfaces, and shared agentic payloads belong under `.make-docs/`, how system and custom tiers interact, and how that local shape works with accepted materialization modes.

## Change Type

Revision to the active architecture, template, package, materialization, compatibility, and dogfood requirements.

## Baseline Being Revised or Removed

- Revises the W9 R1 docs-assets namespace by moving future make-docs-owned tool resources toward `.make-docs/**`.
- Revises `docs/prd/02-architecture-overview.md` by defining `.make-docs/` as both runtime state and tool-resource home.
- Revises `docs/prd/05-installation-profile-and-manifest-lifecycle.md` by requiring manifest provenance for tool resources and materialization modes.
- Revises `docs/prd/06-template-contracts-and-generated-assets.md`, `docs/prd/09-dogfood-and-maintainer-operations.md`, and `docs/prd/10-packaging-validation-and-release-reference.md` by defining migration and package proof expectations.
- Extends PRDs 17 through 20 without superseding their safety boundaries.

## Rationale

Current product-owned tool resources live mostly under `docs/assets/**`, while `.make-docs/` already holds runtime state and at least one deterministic helper. Batch 2 needs `docs/assets/**` available for reader-facing guides, playbooks, and documentation assets without confusing tool resources, runtime state, provider/cache metadata, and project-owned docs. A `.make-docs/` tool directory with system/custom tiers gives future implementations a migration target while preserving local bootstrap readability and Batch 1 safety rules.

## Effective Requirement

Directory model:

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
  scripts/
    system/
    custom/
  agentics/
    skills/
    plugins/
```

PRD 28 makes `agentics/skills/` the canonical shared payload home for selected skill artifacts and uses generated harness stubs as the exposure layer under supported harness roots. PRD 30 makes `agentics/plugins/` the canonical shared payload home for selected plugin artifacts and applies the same generated-exposure primitive instead of duplicating authoritative payloads per harness.

PRD 24 defines `config.yaml` as optional project-owned convention configuration. It belongs in `.make-docs/` because it configures the tool's presentation behavior for the project, but it is not make-docs-owned runtime state and must not be overwritten by install, reconfigure, provider refresh, package sync, or cache recovery without an explicit user-approved replacement flow.

Runtime state:

- `manifest.json`, `conflicts/`, provider/cache metadata, audit state, and temporary run state remain runtime state.
- Runtime state must not move into `docs/assets/` for tidiness.

Tool resource families:

- `contracts/`, `references/`, `templates/`, `scripts/`, and `agentics/` are tool resource families.
- `system/` resources are make-docs-owned resources selected by installer profile or resolved through an approved provider/cache.
- `custom/` resources are project-owned overrides, additions, and overlays.
- Local edits to `system/` resources are conflicts or overlays, not silent upstream edits.
- `custom/` resources must not be overwritten by install, reconfigure, provider refresh, or cache rehydration without explicit user-approved replacement.
- Existing prompt-starter content must be reclassified during migration instead of preserving a separate future `.make-docs/prompts/**` family by default. Process guidance belongs under `.make-docs/references/**`; reusable document skeletons belong under `.make-docs/templates/**`; a later accepted design may reintroduce a prompt family only with explicit source, package, and router semantics.

Materialization:

- `full-snapshot` mode materializes selected system resources locally.
- `provider-backed` mode guarantees only local bootstrap resources locally and identifies provider-resolved resources through manifest provenance.
- `hybrid-pinned-cache` mode keeps local bootstrap plus pinned cache provenance.
- Provider/cache use must preserve provider identity, version or immutable ref, hash algorithm, expected hash set, offline behavior, and recovery guidance.

Bootstrap and routers:

- Local bootstrap remains materially local in every mode.
- Bootstrap includes selected instruction routers, `.make-docs/manifest.json`, local config once implemented, custom overlays, and readable guidance explaining materialization mode and provider/cache recovery.
- Managed instruction routers continue to use managed blocks.
- Router text must not send agents into hidden provider-only state without a local explanation.

Migration:

- Current template-owned `docs/assets/{prompts,references,templates}/` content migrates toward `.make-docs/{contracts,references,templates,scripts}/system/` only through a later implementation plan that classifies each file by function instead of preserving the old directory names.
- Future project documentation assets belong under `docs/assets/**`; [22-revise-new-docs-assets-playbooks-persona-model.md](./22-revise-new-docs-assets-playbooks-persona-model.md) defines `docs/assets/{archive,artifacts,breadcrumbs,guides,playbooks}/` as the v2 target and rejects top-level `docs/archive/**` and `docs/artifacts/**` as shipped v2 surfaces.
- `agentics/skills` is the selected-skill shared payload home under PRD 28; `agentics/plugins` is the selected-plugin shared payload home under PRD 30.
- [25-revise-cli-separation-and-mcp-boundary.md](./25-revise-cli-separation-and-mcp-boundary.md) constrains future `scripts/` and `agentics/` migration work: deterministic script-replacement logic must move into CLI/shared-core operations before MCP exposure, and skills/plugins must call that boundary instead of carrying independent filesystem or routing logic.
- [26-revise-no-scripts-migration-skill-refactor.md](./26-revise-no-scripts-migration-skill-refactor.md) makes the `.make-docs/scripts/{system,custom}` split concrete for first-party helper migration: system wrappers may remain only as thin delegates after an equivalent CLI/shared-core operation exists, while custom scripts are not migrated unless a later accepted design includes them.
- Implementation follows PRD 19 source-of-truth order: shipped defaults start in `packages/docs/template/`, dogfood selected files under review, and bundle through `packages/cli/template/` copy/prepack.

## Impacted Docs and Dependencies

| Area | Effective impact |
| --- | --- |
| `docs/prd/02-architecture-overview.md` | Adds the `.make-docs/` tool directory, runtime state, and local bootstrap shape. |
| `docs/prd/05-installation-profile-and-manifest-lifecycle.md` | Extends manifest and lifecycle expectations for tool-resource provenance. |
| `docs/prd/06-template-contracts-and-generated-assets.md` | Redirects future product-owned tool resources away from reader-facing `docs/assets/**`. |
| `docs/prd/09-dogfood-and-maintainer-operations.md` | Clarifies dogfood behavior for `.make-docs/**` tool resources. |
| `docs/prd/10-packaging-validation-and-release-reference.md` | Adds package proof expectations for tool-directory template changes. |
| `docs/prd/17-revise-system-asset-materialization-contract.md` | Applies materialization-mode rules to local/non-local system tool resources. |
| `docs/prd/18-revise-compatibility-audit-and-migration-disposition.md` | Applies migration classification and conflict safety to tool-resource moves. |
| `docs/prd/19-revise-template-package-dogfood-source-of-truth-contract.md` | Applies template/package/dogfood source-of-truth order to `.make-docs/**` defaults. |
| `docs/prd/22-revise-new-docs-assets-playbooks-persona-model.md` | Complements this PRD by defining `docs/assets/{archive,artifacts,breadcrumbs,guides,playbooks}/`, rejecting top-level `docs/archive/**` and `docs/artifacts/**` as shipped v2 targets, and preserving the persona frontmatter contract. |
| `docs/prd/20-revise-agent-harness-model-conformance-lab.md` | Keeps conformance lab artifacts separate from shipped tool resources unless later promoted. |
| `docs/prd/03-open-questions-and-risk-register.md` | Updates existing docs-assets, dogfood, package, audit, no-scripts, remote-source, and shared-agentics entries. |

The original paired delta backlog was generated under `docs/work/2026-06-23-w9-r2-tool-directory-system-custom-resource-tiers/`. The W9 R4 pivot is tracked under `docs/plans/2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/` and `docs/work/2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/`.

## Required Baseline Annotations

- `docs/prd/00-index.md` must include PRD 21 in reading order, map, source anchors, and follow-on.
- Affected baseline docs must point to PRD 21 from change notes or impacted dependency sections.
- The risk register must update existing relevant items without adding duplicate IDs.

## Source Anchors

- `docs/designs/2026-06-19-tool-directory-system-and-custom-resource-tiers.md`
- `docs/designs/2026-06-25-v2-documentation-asset-ia-hard-move.md`
- `docs/plans/2026-06-23-w9-r2-tool-directory-system-custom-resource-tiers/00-overview.md`
- `docs/plans/2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-overview.md`
- `docs/work/2026-06-23-w9-r2-tool-directory-system-custom-resource-tiers/00-index.md`
- `docs/work/2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-index.md`
- `docs/prd/02-architecture-overview.md`
- `docs/prd/05-installation-profile-and-manifest-lifecycle.md`
- `docs/prd/06-template-contracts-and-generated-assets.md`
- `docs/prd/09-dogfood-and-maintainer-operations.md`
- `docs/prd/10-packaging-validation-and-release-reference.md`
- `docs/prd/17-revise-system-asset-materialization-contract.md`
- `docs/prd/18-revise-compatibility-audit-and-migration-disposition.md`
- `docs/prd/19-revise-template-package-dogfood-source-of-truth-contract.md`
- `docs/prd/22-revise-new-docs-assets-playbooks-persona-model.md`
- `docs/prd/24-revise-configuration-convention-overlay.md`
- `docs/prd/25-revise-cli-separation-and-mcp-boundary.md`
- `docs/prd/26-revise-no-scripts-migration-skill-refactor.md`
- `docs/prd/28-revise-shared-agentics-installation-harness-redirection.md`
- `docs/prd/30-revise-harness-plugin-substrate-workflow-bundles.md`
- `docs/designs/2026-06-20-cli-separation-and-mcp-boundary.md`
- `docs/designs/2026-06-20-no-scripts-migration-and-skill-refactor.md`
- `docs/designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md`
- `docs/designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md`
- `docs/plans/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-overview.md`
- `docs/plans/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-overview.md`
- `docs/plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md`
- `docs/plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md`
- `packages/cli/src/rules.ts`
- `packages/cli/src/catalog.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/managed-block.ts`
