# 22 Project Documentation Asset Model

## Purpose

This document defines the current product contract for managed project documentation assets, their canonical paths, and template-to-package flow. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns managed project documentation assets, their canonical paths, and template-to-package flow. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

### Managed Project Asset Namespace

The canonical v2 information architecture is:

```text
.make-docs/
  system/
    contracts/
    prompts/
    references/
    templates/
  archive/
docs/
  artifacts/
  assets/
    <persona-slug>/
      testing/
```

`.make-docs/system/**` contains only explicitly selected local projections of machine-served system resources and project overrides; the default provider-backed install does not eagerly materialize the full system-resource snapshot. `.make-docs/archive/**` is Make Docs lifecycle archive storage. `docs/artifacts/**` holds project-owned pre-design or supporting source material. `docs/assets/<persona-slug>/testing/**` is the only current project home for persona-specific UAT rendered tester packets, executions, outcomes, findings, dispositions, evidence metadata, and approved evidence. These directories are on-demand and blank installs must not create empty placeholders.

`docs/**` is repository-authoritative project knowledge, not a home for machine-local operational state. Canonical `NUAT-###` scenario identity and version remain with the active PRD that owns the external outcome, while every current UAT packet, execution, outcome, finding, disposition, evidence record, and approved evidence payload belongs under the selected Persona slug's `docs/assets/<persona-slug>/testing/**` tree and is bound to that canonical scenario version or content digest. `.make-docs/archive/**` and `docs/artifacts/**` are prohibited UAT evidence destinations. Make Docs v2 defines no Library, Playbook, or Protocol target family.

### Canonical and Legacy Path Rules

The canonical namespace and its treatment of legacy surfaces are:

| Legacy or governed surface | Canonical surface | Current requirement |
| --- | --- | --- |
| `docs/artifacts/**` | `docs/artifacts/**` | This is the canonical project-owned artifact surface; migration preserves existing content and provenance. |
| `docs/assets/guides/**`, `docs/guides/**`, `docs/assets/library/**` | project-owned location selected during review | These are bounded migration inputs, not v2 managed target families; preserve content and lineage rather than silently relocating or deleting it. |
| `docs/library/playbooks/**`, `docs/assets/playbooks/**`, Protocol-shaped assets | project-owned location selected during review | Make Docs v2 does not enumerate or execute Playbooks or Protocols; existing assets remain opaque project content unless an independent capability later adopts them. |
| `docs/archive/**`, `docs/assets/archive/**`, `docs/assets/history/**`, `docs/assets/breadcrumbs/**` | `.make-docs/archive/**` when explicitly adopted | These are bounded legacy archive/history facets. Migration preserves user-owned records and requires reviewed provenance before moving them into the managed lifecycle archive. |
| `docs/assets/{prompts,references,templates}/**`, `.make-docs/{contracts,references,templates,scripts}/system/**` | `.make-docs/system/{contracts,prompts,references,templates}/**` when explicitly selected | System resources default to machine service; local projection is optional, provenance-aware, and limited to selected resource types and paths. |
| Persona-specific UAT packets, executions, outcomes, findings, dispositions, and evidence under legacy paths | `docs/assets/<persona-slug>/testing/**` | Migration preserves Persona association and user ownership; only proven material moves, and directory placement does not replace scenario or Persona authority. |

### Template, Dogfood, and Package Flow

Future shipped defaults must follow the upstream-first ownership sequence governed by [06-template-contracts-and-generated-assets.md](./06-template-contracts-and-generated-assets.md), [09-dogfood-and-maintainer-operations.md](./09-dogfood-and-maintainer-operations.md), and [10-packaging-validation-and-release-reference.md](./10-packaging-validation-and-release-reference.md):

1. Author in the applicable `packages/docs/template/.make-docs/**` or `packages/docs/template/docs/**` upstream path.
2. Generate the package projection and verify its allowlist.
3. Reseed only the affected repo-root dogfood paths for review.
4. Validate local development, packed npm behavior, root dogfood parity, and an installed-project fixture in that order.

Implementation must audit and update duplicated path knowledge across CLI source, tests, package docs, routers, path-hygiene checks, and parity checks.

### Persona Grouping Boundary

The actual selected Persona slug controls only the path segment used to organize and route current UAT packets, executions, outcomes, findings, dispositions, and evidence. That grouping is not a second canonical scenario, Persona, outcome, finding, or evidence authority: [46 Naive End-User Acceptance Testing](46-naive-end-user-acceptance-testing.md) owns UAT semantics and scenario binding, and [47 Persona Model](47-persona-model.md) owns eligibility, defaulting, slug resolution, metadata, and path/persona drift.
## Non-Requirements

- This PRD does not implement the file migration.
- This PRD does not define plugin behavior or create a current Playbook or Protocol product surface.
- This PRD does not make adversarial review a persona-scoped asset by default. [14-lifecycle-workflow-and-coverage-passes.md](14-lifecycle-workflow-and-coverage-passes.md) owns the optional adversarial-review candidate contract.
- This PRD does not require blank installs to pre-create `.make-docs/archive/**`, `docs/artifacts/**`, or persona testing directories; those surfaces are on-demand.
- This PRD does not move tool resources back into `docs/assets/**`.
- This PRD does not redefine system-resource resolution mechanics owned by PRD 17 and PRD 21; it owns the project target paths and placement boundaries only.
## Acceptance Criteria

- The active PRD set makes `.make-docs/system/{contracts,prompts,references,templates}/**`, `.make-docs/archive/**`, `docs/artifacts/**`, and `docs/assets/<persona-slug>/testing/**` the canonical target surfaces while keeping system-resource projection optional and provenance-aware.
- The active PRD set treats legacy guide, Library, Playbook, Protocol, archive, history, breadcrumb, and old system-resource paths as bounded compatibility facets whose user-owned contents are preserved until an explicit reviewed disposition succeeds.
- `Q-009` remains closed by the persona schema owned exclusively by [47-persona-model.md](./47-persona-model.md); this PRD neither defines nor overrides that schema.
- `R-011` cites PRD 47 for persona authority, and `R-013` cites this PRD for migration targets; no current requirement cites this PRD as Playbook or Protocol storage authority.
- Template-first assets, generated package projections, dogfood projections, and installed-project fixtures agree on the canonical namespace, and validation covers path hygiene, compatibility handling, package-copy proof, and persona fixtures across Windows, macOS, and Linux.
## Contracts and Data

The named paths, schemas, state records, metadata fields, and evidence shapes in Requirements are normative contracts for this capability.
## Integrations

This capability integrates with the adjacent current authorities linked from Requirements and Source Anchors; those authorities remain owners of their own boundaries.
## Rebuild Notes

A rebuild must preserve the requirement identifiers, stable semantic anchors, ownership boundaries, and failure-safe behavior stated here. Implementation evidence does not silently weaken this authority.
## Requirement History

### 2026-08-08 — W9 R3

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document now states the current managed project documentation assets, their canonical paths, and template-to-package flow requirements inline as product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Documentation assets and persona design](../designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md)

### 2026-08-14 — W19 R1

- Affected requirement or section: `Managed Project Asset Namespace`, `Canonical and Legacy Path Rules`, `Template, Dogfood, and Package Flow`, `Persona Grouping Boundary`, `Non-Requirements`, and `Acceptance Criteria`
- Previous contract: The v2 target tree used `docs/assets/{archive,artifacts,library,playbooks}/**`, moved top-level `docs/artifacts/**` and `docs/archive/**` into that tree, and treated Library and Playbook paths as current managed product families.
- Replacement contract: The target information architecture is `.make-docs/system/{contracts,prompts,references,templates}/**`, `.make-docs/archive/**`, `docs/artifacts/**`, and `docs/assets/<persona-slug>/testing/**`; system resources are machine-served by default with explicit optional projection, and legacy Library, Playbook, Protocol, archive, and guide surfaces are bounded migration inputs whose user-owned contents are preserved.
- Rationale: Recovery requires one product boundary and migration target model that does not mistake historical or project-owned content for current Make Docs authority.
- Source: [Accepted W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
## Source Anchors

- `docs/designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md`
- `docs/plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md`
- [../designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md](../designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md)
- [../designs/2026-06-25-v2-documentation-asset-ia-hard-move.md](../designs/2026-06-25-v2-documentation-asset-ia-hard-move.md)
- [../designs/2026-06-25-v2-library-and-archive-history-ia-correction.md](../designs/2026-06-25-v2-library-and-archive-history-ia-correction.md)
- [../plans/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-overview.md](../plans/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-overview.md)
- [../plans/2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-overview.md](../plans/2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-overview.md)
- [../plans/2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/00-overview.md](../plans/2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/00-overview.md)
- [../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-index.md](../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-index.md)
- [../work/2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-index.md](../work/2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-index.md)
- [../work/2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/00-index.md](../work/2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/00-index.md)
- [23 Generated Metadata Lifecycle Handoffs](23-generated-document-metadata-and-lifecycle-handoffs.md)
- [24 Configuration Convention Overlay](24-project-configuration-and-convention-overlay.md)
- [34 Playbook Authoring Contract and Model](34-playbook-authoring-contract-and-model.md)
- [14 Lifecycle Workflow and Coverage Passes](14-lifecycle-workflow-and-coverage-passes.md)
- [21 Tool Directory System Custom Resource Tiers](21-project-tool-directory-and-resource-tiers.md)
- [../designs/2026-06-20-playbook-contract-and-run-playbook.md](../designs/2026-06-20-playbook-contract-and-run-playbook.md)
- [../plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md](../plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md)
- [../designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md](../designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md)
- [../plans/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-overview.md](../plans/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-overview.md)
- `packages/cli/src/rules.ts`
- `packages/cli/src/catalog.ts`
- `packages/cli/src/types.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/install.ts`
- `packages/cli/tests/install.test.ts`
- `packages/cli/tests/consistency.test.ts`
