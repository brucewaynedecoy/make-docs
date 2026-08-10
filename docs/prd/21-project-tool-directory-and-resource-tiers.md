# 21 Project Tool Directory and Resource Tiers

## Purpose

This document defines the current product contract for the project tool directory, system resources, custom overlays, and resource tiers. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns the project tool directory, system resources, custom overlays, and resource tiers. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

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

PRD 28 makes `agentics/skills/` the canonical shared payload home for selected skill artifacts and uses native harness exposure under supported harness roots, with symlinks preferred and managed copy mirrors as fallback. PRD 30 makes `agentics/plugins/` the canonical shared payload home for selected plugin artifacts and owns any authoritative change to that native-exposure contract.

PRD 24 defines `config.yaml` as optional project-owned convention configuration. It belongs in `.make-docs/` because it configures the tool's presentation behavior for the project, but it is not make-docs-owned runtime state and must not be overwritten by install, reconfigure, provider refresh, package sync, or cache recovery without an explicit user-approved replacement flow.

Runtime state:

- `manifest.json`, `conflicts/`, provider/cache metadata, audit state, and temporary run state remain runtime state.
- Runtime state must not move into `docs/assets/` for tidiness.

Materialization:

- `full-snapshot` mode materializes selected system resources locally.
- `provider-backed` mode guarantees only local bootstrap resources locally and identifies provider-resolved resources through manifest provenance.
- `hybrid-pinned-cache` mode keeps local bootstrap plus pinned cache provenance.
- Provider/cache use must preserve provider identity, version or immutable ref, hash algorithm, expected hash set, offline behavior, and recovery guidance.

Bootstrap and routers:

- Local bootstrap remains materially local in every mode.
- Bootstrap includes selected instruction routers, `.make-docs/manifest.json`, optional local config, custom overlays, and readable guidance explaining materialization mode and provider/cache recovery.
- Managed instruction routers continue to use managed blocks.
- Router text must not send agents into hidden provider-only state without a local explanation.

Canonical and legacy boundaries:

- `.make-docs/{contracts,references,templates,scripts}/system/` is the canonical home for template-owned tool resources. Content found under legacy `docs/assets/{prompts,references,templates}/` paths is noncanonical migration input and is classified by function rather than preserving the old directory names.
- Project documentation assets belong under `docs/assets/**`; [22-project-documentation-asset-model.md](./22-project-documentation-asset-model.md) defines `docs/assets/{archive,artifacts,library,playbooks}/` plus on-demand `docs/assets/archive/history/**` as the canonical v2 namespace, treats top-level `docs/artifacts/**` as noncanonical migration input for `docs/assets/artifacts/**`, and rejects top-level `docs/archive/**` as a shipped v2 surface.
- `agentics/skills` is the selected-skill shared payload home under PRD 28; `agentics/plugins` is the selected-plugin shared payload home under PRD 30.
- [25-typescript-runtime-cli-mcp-operation-boundaries.md](./25-typescript-runtime-cli-mcp-operation-boundaries.md) constrains `scripts/` and `agentics/` compatibility work: deterministic script-replacement logic belongs in CLI/shared-core operations before MCP exposure, and skills/plugins call that boundary instead of carrying independent filesystem or routing logic.
- [25-typescript-runtime-cli-mcp-operation-boundaries.md](./25-typescript-runtime-cli-mcp-operation-boundaries.md) makes the `.make-docs/scripts/{system,custom}` split concrete for first-party helper migration: system wrappers may remain only as thin delegates after an equivalent CLI/shared-core operation exists, while custom scripts are not migrated. Including custom scripts requires authoritative maintenance of PRDs 21 and 25 before implementation.
- Shipped defaults start in `packages/docs/template/`, dogfood selected files under review, and bundle through `packages/cli/template/` copy/prepack. [06-template-contracts-and-generated-assets.md](./06-template-contracts-and-generated-assets.md), [09-dogfood-and-maintainer-operations.md](./09-dogfood-and-maintainer-operations.md), and [10-packaging-validation-and-release-reference.md](./10-packaging-validation-and-release-reference.md) own that upstream-first authoring, dogfood, and package-proof sequence.
## Contracts and Data

The named paths, schemas, state records, metadata fields, and evidence shapes in Requirements are normative contracts for this capability.
## Integrations

This capability integrates with the adjacent current authorities linked from Requirements and Source Anchors; those authorities remain owners of their own boundaries.
## Rebuild Notes

A rebuild must preserve the requirement identifiers, stable semantic anchors, ownership boundaries, and failure-safe behavior stated here. Implementation evidence does not silently weaken this authority.
## Requirement History

### 2026-08-08 — W9 R2

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document now states the current project tool directory, system resources, custom overlays, and resource-tier requirements inline as product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Tool directory and resource tiers design](../designs/2026-06-19-tool-directory-system-and-custom-resource-tiers.md)
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
- `docs/prd/17-system-asset-materialization-and-local-bootstrap.md`
- `docs/prd/18-compatibility-classification-and-migration-safety.md`
- `docs/prd/22-project-documentation-asset-model.md`
- `docs/prd/24-project-configuration-and-convention-overlay.md`
- `docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md`
- `docs/prd/28-shared-agentics-installation-and-harness-exposure.md`
- `docs/prd/30-plugin-substrate-and-workflow-bundles.md`
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
