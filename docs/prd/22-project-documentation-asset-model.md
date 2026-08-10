# 22 Project Documentation Asset Model

## Purpose

This document defines the current product contract for managed project documentation assets, their canonical paths, and template-to-package flow. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns managed project documentation assets, their canonical paths, and template-to-package flow. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

### Managed Project Asset Namespace

The canonical v2 managed project documentation asset tree is:

```text
docs/
  assets/
    archive/
      AGENTS.md
      history/
        <date>-<slug>.md
    artifacts/
      AGENTS.md
    library/
      AGENTS.md
      <persona-slug>/
        <guide-slug>.md
    playbooks/
      AGENTS.md
      <persona-slug>/
        <playbook-slug>.playbook.md
```

`docs/assets/archive/**` is managed archive storage. `docs/assets/archive/history/**` is the on-demand home for history and breadcrumb records, and blank installs do not create it until the first record is written. `docs/assets/artifacts/**` is optional zero-contract pre-design input material and is not created by default. `docs/assets/library/**` is for explanatory, conceptual, operational, or reference material written for a configured persona. `docs/assets/playbooks/**` is for persona-scoped repeatable process definitions. A playbook is content that the PRD 34/35 execution model can consume; storage under `docs/assets/playbooks/**` does not make it a plugin or command.

`docs/assets/**` is not a general dumping ground for make-docs tool resources, runtime state, or generated planning artifacts.

### Canonical and Legacy Path Rules

The canonical namespace and its treatment of legacy surfaces are:

| Legacy or governed surface | Canonical surface | Current requirement |
| --- | --- | --- |
| `docs/artifacts/**` | `docs/assets/artifacts/**` | The top-level path is noncanonical and is not preserved as a shipped alias; compatibility handling treats existing content as migration input and preserves it until a reviewed move succeeds. |
| `docs/assets/guides/**` | `docs/assets/library/**` | The guide path is noncanonical; compatibility handling preserves guide intent, router behavior, and persona targeting under the library surface. |
| `docs/guides/**` | `docs/assets/library/**` | The v1 path is noncanonical; compatibility handling preserves its guide/persona content when adopting the managed library surface. |
| `docs/library/playbooks/**` | `docs/assets/playbooks/**` | The W16 path is transitional and noncanonical; compatibility handling preserves lineage when adopting the managed playbook surface. |
| `docs/archive/**` | `docs/assets/archive/**` | Do not ship top-level archive storage; use the managed archive surface under `docs/assets/archive/**`. Existing `docs/assets/archive/**` content remains the current archive namespace. |
| `docs/assets/history/**` | `docs/assets/archive/history/**` | The standalone history path is noncanonical; compatibility handling preserves existing records under the archive history surface. |
| `docs/assets/breadcrumbs/**` | `docs/assets/archive/history/**` | The breadcrumb path is noncanonical; compatibility handling preserves existing W9 R4 records, while new breadcrumb/history records use archive history. |
| `docs/assets/{prompts,references,templates}/**` | `.make-docs/{contracts,references,templates,scripts}/system/**` | These are tool resources governed by PRD 21, not project documentation assets governed by this PRD. |

### Template, Dogfood, and Package Flow

Future shipped reader-facing guide/playbook defaults must follow the upstream-first ownership sequence governed by [06-template-contracts-and-generated-assets.md](./06-template-contracts-and-generated-assets.md), [09-dogfood-and-maintainer-operations.md](./09-dogfood-and-maintainer-operations.md), and [10-packaging-validation-and-release-reference.md](./10-packaging-validation-and-release-reference.md):

1. Author in `packages/docs/template/docs/**`.
2. Reseed repo-root dogfood `docs/**` for review.
3. Generate `packages/cli/template/**` through copy/prepack behavior.
4. Validate local dev and packed npm behavior.

Implementation must audit and update duplicated path knowledge across CLI source, tests, package docs, routers, path-hygiene checks, and parity checks.

### Persona Grouping Boundary

Library and playbook paths may group content by the configured persona slug for discovery and publication. [47 Persona Model](47-persona-model.md) owns persona metadata, primitive mapping, frontmatter authority, and path/persona drift; this asset model does not redefine those contracts.
## Non-Requirements

- This PRD does not implement the file migration.
- This PRD does not define plugin behavior. [34-playbook-authoring-contract-and-model.md](34-playbook-authoring-contract-and-model.md) defines the generic Run Playbook model.
- This PRD does not make adversarial review a persona-scoped asset by default. [14-lifecycle-workflow-and-coverage-passes.md](14-lifecycle-workflow-and-coverage-passes.md) owns the optional adversarial-review candidate contract.
- This PRD does not require blank installs to pre-create `docs/assets/archive/history/**`; that directory is on-demand record storage.
- This PRD does not move tool resources back into `docs/assets/**`.
- This PRD does not change the local bootstrap or materialization mode contracts from PRD 17 and PRD 21.
## Acceptance Criteria

- The active PRD set makes `docs/assets/library/**` and `docs/assets/playbooks/**` the canonical reader-facing asset surfaces.
- The active PRD set treats `docs/library/playbooks/**`, `docs/guides/**`, `docs/assets/history/**`, and `docs/assets/breadcrumbs/**` as noncanonical compatibility inputs; `docs/assets/archive/**` is the canonical archive surface, `docs/assets/artifacts/**` is the optional input surface, and `docs/assets/archive/history/**` is the canonical history/breadcrumb surface.
- `Q-009` remains closed by the persona schema owned exclusively by [47-persona-model.md](./47-persona-model.md); this PRD neither defines nor overrides that schema.
- `R-011` cites PRD 47 for persona authority, `R-012` cites this PRD for playbook storage and the playbook/execution/plugin authorities for behavior, and `R-013` cites this PRD for migration targets.
- Template-first assets, dogfood projections, and packaged copies agree on the canonical namespace, and validation covers path hygiene, compatibility handling, package-copy proof, and persona fixtures.
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
## Source Anchors

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
