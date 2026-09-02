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
  config.yaml
  manifest.json
  conflicts/
  <configured harness routers>
  archive/                # on-demand managed history/provenance
  system/                 # always-local configured-harness router
    contracts/
    prompts/
    references/
    templates/
  agentics/
    skills/               # optional selected payloads
```

The unconditional instruction-router foundation remains at the project root, `docs/`, `docs/assets/`, `.make-docs/`, `.make-docs/system/`, and `.make-docs/system/{contracts,prompts,references,templates}/` for each configured supported harness. These routers are bootstrap assets, not content-resource types. The typed system directories remain present even when they contain no resource bodies. The resolved effective profile and its dependencies control the capability-local routers at `docs/designs/`, `docs/plans/`, `docs/prd/`, and `docs/work/`. The `docs/assets/` surface has a root router only and no managed child routers. PRD 28 makes `agentics/skills/` the canonical shared payload home for selected Skill artifacts and uses native Skill exposure under supported harness roots, with symlinks preferred and managed copy mirrors as fallback. No general plugin payload namespace, plugin store, or native plugin exposure is reserved or implied; PRD 30 owns only the admission and legacy-artifact boundary for any future integration.

PRD 24 defines `config.yaml` as optional project-owned convention configuration. It belongs in `.make-docs/` because it configures the tool's presentation behavior for the project, but it is not make-docs-owned runtime state and must not be overwritten by install, reconfigure, provider refresh, package sync, or cache recovery without an explicit user-approved replacement flow.

Resource tiers and identity:

- `contract`, `prompt`, `reference`, and `template` are peer system-resource types. A resource is identified as `make-docs://system/<type>/<posix-relative-path>` independent of provider or projection origin.
- The installed package provider is the ordinary runtime tier. It exposes the complete selected resource inventory without requiring repository copies.
- `.make-docs/system/**` is the sole current local resource tree. Its router skeleton is always local. Resource bodies are an optional managed projection tier. Its plural directory families map to the singular URI types; projected files retain provider/version/hash/ownership provenance in `.make-docs/manifest.json`.
- Project-authored config, documents, overlays, and Skills are not system resources and do not receive `make-docs://system/...` identity. Legacy or user-authored plugin artifacts are migration and ownership inputs only and likewise receive no system-resource identity.
- Playbooks and Protocols are not resource types, directory families, or project-tool authorities.

Resolution and materialization:

- One canonical resolver serves CLI and MCP. It accepts stable resource URIs, normalizes POSIX paths, rejects traversal and invalid type segments, and resolves a trustworthy selected local projection before the installed provider.
- CLI `make-docs resource list`, `make-docs resource read <uri>`, and `make-docs resource ensure <uri>` are canonical resource surfaces. Resource ensure creates or refreshes exactly one selected local projection through the managed-file conflict and approval path. Each operation projects to an MCP tool. Native MCP resources expose the same URI set and bytes as resource list/read where supported.
- Local resource-body projection is explicit and selection-scoped. Empty typed directories are normal and do not reduce runtime resource availability. The router skeleton remains present.
- Divergent, stale, unowned, or provenance-free local files never silently shadow the provider. Refresh and overwrite use the managed-file conflict and approval path.
- `project.surface.ensure <archive|artifacts|assets>` is a separate P4 operation. The `archive` and `artifacts` values create their on-demand surfaces. The `assets` value is idempotent when the unconditional `docs/assets/` root and its configured-harness routers are current. It can create or safely repair that root surface under normal ownership rules, but it must not create Persona or testing children. The operation does not change system-resource selection.

Runtime state and bootstrap:

- `manifest.json`, `conflicts/`, provider/projection metadata, audit state, and bounded migration journals are project-local runtime state and must not move into `docs/assets/` for tidiness. General lifecycle `runs` and `run_evidence` live in the machine Store, not the project tool directory.
- Bootstrap includes configured-harness instruction routers, `.make-docs/manifest.json`, optional local config, project-owned overlays, and readable guidance explaining local-first resource use, CLI fallback, resource-body selection, provenance, and recovery.
- Managed instruction routers continue to use managed blocks.
- Router text must not send agents into hidden provider-only state without a local explanation.
- The manifest records router ownership separately from resource-body projection selection and ownership.
- The `docs/` router keeps the exact heading `# Documentation Router` and its full lifecycle, design, planning, PRD, work, risk, artifact, Persona, UAT, coverage, history, link, and formatting duties.
- Routers do not infer Skills, plugins, Playbooks, Protocols, or unavailable policy.

Canonical and legacy boundaries:

- `.make-docs/system/{contracts,prompts,references,templates}/` is the only current local resource namespace. Content found under legacy `.make-docs/{contracts,prompts,references,templates}/system/`, `.make-docs/scripts/system/`, or `docs/assets/{prompts,references,templates}/` paths is migration input classified by function and provenance rather than preserved as another current tier. Migration may move or remove a legacy file only when the accepted snapshot proves managed ownership and the current bytes match trusted evidence. Unknown, modified, mixed, unowned, or conflicting content is preserved for explicit review.
- Make Docs-managed archival and provenance records belong under on-demand `.make-docs/archive/**`; non-authoritative source and analysis inputs belong under on-demand `docs/artifacts/**`; and Persona-scoped reader assets plus testing evidence belong under on-demand children of the unconditional `docs/assets/` root. Those children do not have managed routers. [22-project-documentation-asset-model.md](./22-project-documentation-asset-model.md) owns their detailed document contracts. Old `docs/assets/archive/`, `docs/assets/artifacts/`, `docs/assets/library/`, and workflow-shaped families are noncanonical migration inputs.
- `agentics/skills` is the selected-Skill shared payload home under PRD 28. No current general plugin payload namespace or native plugin exposure contract exists; PRD 30 owns future-integration admission and legacy-artifact treatment rather than a plugin store.
- [25-typescript-runtime-cli-mcp-operation-boundaries.md](./25-typescript-runtime-cli-mcp-operation-boundaries.md) constrains agentics compatibility work: deterministic behavior belongs in CLI/shared-core operations before MCP exposure, and selected Skills or any later admitted agentic integration call that boundary instead of carrying independent filesystem or routing logic. First-party helper scripts are migrated to package code rather than retained as a fifth system-resource family; project scripts remain project-owned and outside this authority.
- Shipped defaults start in `packages/docs/template/`, project through `packages/cli/template/` copy/prepack, and only then dogfood selected files under review at the repository root. [06-template-contracts-and-generated-assets.md](./06-template-contracts-and-generated-assets.md), [09-dogfood-and-maintainer-operations.md](./09-dogfood-and-maintainer-operations.md), and [10-packaging-validation-and-release-reference.md](./10-packaging-validation-and-release-reference.md) own that upstream -> package -> root dogfood -> representative installed-project proof sequence.
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

### 2026-08-14 — W19 R1

- Date: 2026-08-14
- Coordinate: W19 R1
- Affected requirement or section: `Directory model`, `Resource tiers and identity`, `Resolution and materialization`, `Runtime state and bootstrap`, and `Canonical and legacy boundaries`
- Previous contract: System and custom content lived in parallel per-type local directories, full snapshots were a current mode, scripts were a system-resource family, shared agentics could imply both Skill and plugin payload homes, and archive/artifact/library/Playbook project assets lived beneath `docs/assets/**`.
- Replacement contract: Contracts, prompts, references, and templates are peer installed-provider resources with stable URIs; `.make-docs/system/**` is an optional provenance-aware projection; `.make-docs/archive/**`, `docs/artifacts/**`, and `docs/assets/<persona-slug>/**` are created on demand; CLI and native MCP share one resolver; selected Skills retain the traced PRD 28 store and exposure boundary while no general plugin payload namespace, store, or native exposure is reserved; scripts remain package or project code; and Playbooks and Protocols are absent.
- Rationale: The project tool directory must distinguish optional resource projection from runtime state and project-authored content while preserving migration evidence for old layouts.
- Source: [Accepted recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

### 2026-09-02 — W19 R1 authority correction

- Date: 2026-09-02
- Coordinate: W19 R1 P4 corrective work
- Affected requirement or section: `Directory model`, `Resource tiers and identity`, `Resolution and materialization`, `Runtime state and bootstrap`, and `Canonical and legacy boundaries`
- Previous contract: `.make-docs/system/**` could be absent when no resource bodies were selected, and typed-directory routers were not required.
- Replacement contract: `.make-docs/system/<type>/` is the sole current tree. The configured-harness router skeleton is always local from the project root through each typed directory. Resource selection controls bodies only. Legacy per-type `system/` paths are guarded migration inputs.
- Rationale: The corrected authority restores local routing and preserves machine-served resource access without a repository snapshot.
- Source: Owner-approved Make Docs Authority and Router Recovery Plan and [D-029](./03-open-questions-and-risk-register.md#d-029-w19-r1-resource-topology-and-router-authority-drift)

### 2026-09-02 — W19 R1 documentation-surface correction

- Date: 2026-09-02
- Coordinate: W19 R1 P4 corrective work
- Affected requirement or section: `Directory model`, `Resolution and materialization`, `Runtime state and bootstrap`, and `Canonical and legacy boundaries`
- Previous contract: The corrected project-tool model still omitted the `docs/assets/` foundation router and the profile-controlled document routers.
- Replacement contract: Each configured harness has the full unconditional foundation, while the resolved effective profile and its dependencies control the four capability-local document routers. The `docs/assets/` router is root-only. Archive and artifact surfaces and Persona testing children remain on demand. `project.surface.ensure assets` remains supported and cannot create a Persona child.
- Rationale: The project-tool contract must match the separate documentation-surface correction without changing the closed system-resource correction.
- Source: [D-030](./03-open-questions-and-risk-register.md#d-030-w19-r1-documentation-surface-router-topology-was-omitted)

## Source Anchors

- [Accepted recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
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
